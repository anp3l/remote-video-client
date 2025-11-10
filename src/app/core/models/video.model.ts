export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  uploadDate: Date;
  size: string;
  category: string;
  tags: string[];
  _localIndex?: number;
}