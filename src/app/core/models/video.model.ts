export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  uploadDate: Date;
  size: string;
  category: string;
  tags: string[];
  _localIndex?: number;
}

export interface VideoMetadata {
  title: string;
  description: string;
  category: string;
  tags: string[];
}

export interface VideoUploadData extends VideoMetadata {
  videoFile: File;
  thumbnailFile: File | null;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'date' | 'title' | 'duration';
