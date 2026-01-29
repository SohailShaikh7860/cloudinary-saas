import { NextRequest, NextResponse } from "next/server";
import openai from "@/utils/openai";
import { PrismaClient } from "@/app/generated/prisma/client";
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
      response_format: "srt",
      language: "en",
    });


    await prisma.video.update({
      where: { id: videoId },
      data: {
        subtitles: transcription,
        hasSubtitles: true,
        subtitleFormat: "srt",
      },
    });

    return NextResponse.json({
      success: true,
      subtitles: transcription,
      message: "Subtitles generated successfully",
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