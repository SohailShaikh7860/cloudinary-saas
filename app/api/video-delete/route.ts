import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../generated/prisma/client";
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

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
        }

        
        const video = await prisma.video.findUnique({
            where: { id }
        });

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        
        try {
            await cloudinary.uploader.destroy(video.publicId, {
                resource_type: "video"
            });
        } catch (cloudinaryError) {
            console.error("Cloudinary deletion error:", cloudinaryError);
            
        }

        
        const deletedVideo = await prisma.video.delete({
            where: { id }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Video deleted successfully',
            video: deletedVideo 
        });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}