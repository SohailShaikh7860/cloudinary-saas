-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "hasSubtitles" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subtitleFormat" TEXT,
ADD COLUMN     "subtitles" TEXT;
