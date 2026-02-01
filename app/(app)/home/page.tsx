"use client"
import React, {useState, useCallback, useEffect} from 'react'
import axios from 'axios'
import VideoCard from '@/components/videoCard'
import {Video} from '@/types/index'
import { ShowToast } from '@/components/toast'
const HomePage = () => {

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generatingSubtitlesId, setGeneratingSubtitlesId] = useState<string | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [videoToGenerateSubtitles, setVideoToGenerateSubtitles] = useState<{id: string, publicId: string} | null>(null);

  const fetchVideos = useCallback(async () => {
      try {
       const response = await axios.get(('/api/video'));
       if(Array.isArray(response.data)){
          setVideos(response.data);
       }else{
          throw new Error("Unexpected response format");
       }
      } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'Failed to load videos';
         setError(errorMessage);
         ShowToast(errorMessage, 'error');
      } finally {
         setLoading(false);
      }
  },[])
  
  useEffect(()=>{
     fetchVideos();
  },[fetchVideos])

   const handleDownload = useCallback(async (url: string, title: string, subtitles?: string | null) => {
        
        try {
            window.open(url, '_blank');
            
            if (subtitles) {
               
                setTimeout(async () => {
                    try {
                        if (subtitles.startsWith('http')) {
                            
                            const subResponse = await fetch(subtitles);
                            const subBlob = await subResponse.blob();
                            const subBlobUrl = window.URL.createObjectURL(subBlob);
                            
                            const link = document.createElement("a");
                            link.href = subBlobUrl;
                            link.download = `${title}-subtitles.vtt`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(subBlobUrl);
                           
                        } else {
                            
                            const blob = new Blob([subtitles], { type: 'text/vtt' });
                            const blobUrl = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = `${title}-subtitles.vtt`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(blobUrl);
                        
                        }
                    } catch (err) {
                        ShowToast('Failed to download subtitles', 'error');
                    }
                }, 500);
            }
        } catch (error) {
            ShowToast('Failed to open video', 'error');
        }
    }, [])

    const handleDelete = useCallback(async (id: string) => {
        setVideoToDelete(id);
    }, [])

    const confirmDelete = useCallback(async () => {
        if (!videoToDelete) return;

        setDeletingId(videoToDelete);
        setVideoToDelete(null);

        try {
            const response = await axios.delete(`/api/video-delete?id=${videoToDelete}`);
            
            if (response.data.success) {
                setVideos(prevVideos => prevVideos.filter(video => video.id !== videoToDelete));
                ShowToast('Video deleted successfully!', 'success');
            } else {
                ShowToast('Failed to delete video. Please try again.', 'error');
            }
        } catch (error) {
            const errorMessage = axios.isAxiosError(error) && error.response?.data?.error 
                ? error.response.data.error 
                : 'Failed to delete video. Please try again.';
            ShowToast(errorMessage, 'error');
        } finally {
            setDeletingId(null);
        }
    }, [videoToDelete])

    const handleGenerateSubtitles = useCallback(async (videoId: string, publicId: string) => {
        setVideoToGenerateSubtitles({id: videoId, publicId});
    }, [])

    const confirmGenerateSubtitles = useCallback(async () => {
        if (!videoToGenerateSubtitles) return;

        const {id: videoId, publicId} = videoToGenerateSubtitles;
        setGeneratingSubtitlesId(videoId);
        setVideoToGenerateSubtitles(null);

        try {
            const response = await axios.post('/api/subtitle-generator', {
                videoId,
                publicId
            });

            if (response.data.success) {
                
                setVideos(prevVideos => 
                    prevVideos.map(video => 
                        video.id === videoId 
                            ? { ...video, hasSubtitles: true, subtitles: response.data.subtitles }
                            : video
                    )
                );

                ShowToast('Subtitles generated successfully!', 'success');
            } else {
                ShowToast('Failed to generate subtitles. Please try again.', 'error');
            }
        } catch (error) {
            const errorMessage = axios.isAxiosError(error) && error.response?.data?.error 
                ? error.response.data.error 
                : 'Failed to generate subtitles. Please try again.';
            ShowToast(errorMessage, 'error');
        } finally {
            setGeneratingSubtitlesId(null);
        }
    }, [videoToGenerateSubtitles])

    if(loading){
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-4 text-lg font-semibold">Loading videos...</p>
            </div>
        )
    }
  return (
     <>
      <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Videos</h1>
          {videos.length === 0 ? (
            <div className="text-center text-lg text-gray-500">
              No videos available
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {
                videos.map((video) => (
                    <VideoCard
                        key={video.id}
                        publicId={video.publicId}
                        video={video}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onGenerateSubtitles={handleGenerateSubtitles}
                        isDeleting={deletingId === video.id}
                        isGeneratingSubtitles={generatingSubtitlesId === video.id}
                    />
                ))
              }
            </div>
          )}
        </div>

        {videoToDelete && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Confirm Delete</h3>
              <p className="py-4">Are you sure you want to delete this video? This action cannot be undone.</p>
              <div className="modal-action">
                <button className="btn" onClick={() => setVideoToDelete(null)}>Cancel</button>
                <button className="btn btn-error" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}

        
        {videoToGenerateSubtitles && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Generate Subtitles</h3>
              <p className="py-4">Generate subtitles for this video? This may take a few minutes.</p>
              <div className="modal-action">
                <button className="btn" onClick={() => setVideoToGenerateSubtitles(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmGenerateSubtitles}>Generate</button>
              </div>
            </div>
          </div>
        )}
      </>
  )
}

export default HomePage
