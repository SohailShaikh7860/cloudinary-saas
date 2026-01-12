export interface Video {
    id: string;
    title:string;
    description: string | null;
    publicId: string;
    OriginalSize: string;
    compressedSize: string;
    duration: string;
    createdAt: Date;
    updatedAt: Date;
}