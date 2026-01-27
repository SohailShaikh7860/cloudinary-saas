import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request: NextRequest){
    try {
       const videos =  await prisma.video.findMany({
            orderBy:{
                createdAt: 'desc'
            }
        })

        return NextResponse.json(videos);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch videos'}, {status: 500});        
    } finally{
        await prisma.$disconnect();
    }
}