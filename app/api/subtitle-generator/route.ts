import { NextRequest, NextResponse } from "next/server";
import openai from "@/utils/openai";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


export async function POST(request: NextRequest) {
  
  try {
    const { videoId, publicId } = await request.json();

    if (!videoId || !publicId) {
      return NextResponse.json(
        { error: "Video ID and Public ID are required" },
        { status: 400 }
      );
    }

    const videoUrl = cloudinary.url(publicId, {
      resource_type: "video",
      format: "mp4",
    });

    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error("Failed to fetch video from Cloudinary");
    }

    const videoBlob = await videoResponse.blob();
    
    const videoFile = new File([videoBlob], `${publicId}.mp4`, {
      type: "video/mp4",
    });


    const transcription = await openai.audio.transcriptions.create({
      file: videoFile,
      model: "whisper-1",
      response_format: "vtt",
      language: "en",
    });


    
    const subtitleUpload = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "video-subtitles",
          public_id: `${publicId}-subtitles`,
          format: "vtt",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(Buffer.from(transcription, 'utf-8'));
    });

    await prisma.video.update({
      where: { id: videoId },
      data: {
        subtitles: subtitleUpload.secure_url,
        hasSubtitles: true,
        subtitleFormat: "vtt",
      },
    });

    return NextResponse.json({
      success: true,
      subtitles: transcription,
      subtitleUrl: subtitleUpload.secure_url,
      message: "Subtitles generated and uploaded successfully",
    }, {status: 201});
    
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate subtitles" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}