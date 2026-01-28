"use client"
import React, {useState, useCallback, useEffect} from 'react'
import axios from 'axios'
import VideoCard from '@/components/videoCard'
import {Video} from '@/types/index'
const HomePage = () => {

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
      try {
       const response = await axios.get(('/api/video'));
       if(Array.isArray(response.data)){
          setVideos(response.data);
       }else{
          throw new Error("Unexpected response format");
       }
      } catch (error) {
         console.log(error);
         setError(error instanceof Error ? error.message : String(error));
      } finally {
         setLoading(false);
      }
  },[])
  
  useEffect(()=>{
     fetchVideos();
  },[fetchVideos])

   const handleDownload = useCallback((url: string, title: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${title}.mp4`);
        link.setAttribute("target", "_blank");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [])

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to delete this video?')) {
            return;
        }

        setDeletingId(id); // Set loading state

        try {
            const response = await axios.delete(`/api/video-delete?id=${id}`);
            
            if (response.data.success) {
                setVideos(prevVideos => prevVideos.filter(video => video.id !== id));
                alert('Video deleted successfully!');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete video. Please try again.');
        } finally {
            setDeletingId(null);
        }
    }, [])

    if(loading){
        return <div>Loading...</div>
    }
  return (
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
                        isDeleting={deletingId === video.id}
                    />
                ))
              }
            </div>
          )}
        </div>
  )
}

export default HomePage
