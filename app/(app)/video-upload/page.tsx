"use client"

import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation';
import { ShowToast } from '@/components/toast';


const page = () => {
   
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const router = useRouter();

const MAX_FILE_SIZE = 70 * 1024 * 1024; // 70MB

const handleSubmit = async (event: React.FormEvent)=>{
       event.preventDefault();

       if(!file){
          ShowToast("Please select a file", "error");
          return;
       }

       if(file.size > MAX_FILE_SIZE){
          ShowToast("File size exceeds 70MB limit", "error");
          return;
       }

       setIsUploading(true);
       const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("description", description);
        formData.append("originalSize", file.size.toString());

        try {
         const res =  await axios.post('/api/video-upload', formData);

          if(res.status === 200){
             ShowToast("Video uploaded successfully", "success");
             router.push('/home');
          }else{
              ShowToast("Video upload failed", "error");
          }

        } catch (error) {
          const errorMessage = axios.isAxiosError(error) && error.response?.data?.error 
              ? error.response.data.error 
              : 'Failed to upload video. Please try again.';
          ShowToast(errorMessage, "error");
        }finally{
          setIsUploading(false);
        }
}

  return (
     <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Title</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea textarea-bordered w-full"
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Video File</span>
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="file-input file-input-bordered w-full"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Video"}
            </button>
          </form>
        </div>
  )
}

export default page
