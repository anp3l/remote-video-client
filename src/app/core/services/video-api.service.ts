import { Injectable, inject } from '@angular/core';
import { HttpClient , HttpEventType, HttpEvent, HttpResponse} from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { map, switchMap, takeWhile, tap, filter } from 'rxjs/operators';
import { Video, VideoMetadata } from '../models/video.model';
import { AppConfig } from '../config/app.config';

export interface UploadProgressEvent {
  type: 'progress' | 'complete';
  progress?: number;
  video?: Video;
}
@Injectable({
  providedIn: 'root'
})
export class VideoApiService {
  private http = inject(HttpClient);
  private apiUrl = AppConfig.apiBaseUrl;

  getAllVideos(): Observable<Video[]> {
    return this.http.get<any[]>(`${this.apiUrl}/videos`).pipe(
      map(videos => videos.map(v => ({
      id: v._id,
      title: v.title,
      description: v.description,
      thumbnail: v.thumbnail,
      videoUrl: v.videoUrl,
      duration: v.duration,
      uploadDate: new Date(v.uploadDate),
      size: v.size,
      category: v.category,
      tags: v.tags || []
      })))
    );
  }

  getVideoById(id: string): Observable<Video> {
    return this.http.get<any>(`${this.apiUrl}/videos/${id}`).pipe(
      map(v => ({
        ...v,
        uploadDate: new Date(v.uploadDate)
      }))
    );
  }

  uploadVideo(
      videoFile: File,
      thumbnailFile: File | null,
      metadata: VideoMetadata
    ): Observable<UploadProgressEvent> {
      const formData = new FormData();
      formData.append('videos', videoFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      formData.append('title', metadata.title);
      formData.append('description', metadata.description);
      formData.append('category', metadata.category);
      formData.append('tags', JSON.stringify(metadata.tags));

      return this.http.post<any>(`${this.apiUrl}/videos`, formData, {
        reportProgress: true,  // abilita il tracking del progresso
        observe: 'events'      // osserva gli eventi invece della risposta
      }).pipe(
        map((event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress) {
            // Evento di progresso
            const progress = event.total 
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
            
            return {
              type: 'progress' as const,
              progress
            };
          } else if (event.type === HttpEventType.Response) {
            const videoData = event.body.ops?.[0] || event.body;
            
            return {
              type: 'complete' as const,
              video: {
                id: videoData._id,
                title: videoData.title,
                description: videoData.description,
                thumbnail: videoData.thumbnail || `/videos/thumb/static/${videoData._id}`,
                videoUrl: videoData.videoUrl || `/videos/stream/${videoData._id}`,
                duration: videoData.duration || 0,
                uploadDate: new Date(videoData.createdAt || videoData.uploadDate),
                size: videoData.size,
                category: videoData.category,
                tags: videoData.tags
              }
            };
          }
          
          return { type: 'progress' as const, progress: 0 };
        }),
        filter(event => event.type === 'progress' || event.type === 'complete')
      );
    }

  updateVideo(id: string, updates: Partial<VideoMetadata>): Observable<Video> {
    return this.http.patch<any>(`${this.apiUrl}/videos/${id}`, updates).pipe(  // <-- PATCH
      map(v => ({
        ...v,
        uploadDate: new Date(v.uploadDate)
      }))
    );
  }

  deleteVideo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/videos/${id}`);
  }

  getVideoDownload(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/videos/download/${id}`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  getVideoStreamUrl(id: string): string {
    return `${this.apiUrl}/videos/stream/${id}/${id}.m3u8`;
  }

  getThumbnailUrl(id: string): string {
    return `${this.apiUrl}/videos/thumb/static/${id}`;
  }

  getAnimatedThumbnailUrl(id: string): string {
    return `${this.apiUrl}/videos/thumb/animated/${id}`;
  }

  searchVideos(query: string, category?: string): Observable<Video[]> {
    let url = `${this.apiUrl}/videos/search?q=${encodeURIComponent(query)}`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    return this.http.get<any[]>(url).pipe(
      map(videos => videos.map(v => ({
        ...v,
        uploadDate: new Date(v.uploadDate)
      })))
    );
  }

  // Extecutes polling every X ms until the status is 'uploaded'
  pollUntilUploaded(id: string, intervalMs: number = 10000): Observable<string> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.getVideoStatus(id)),
      takeWhile((status) => status === 'inProgress', true)
    );
  }

  getVideoStatus(id: string): Observable<string> {
    return this.http.get<{ videoStatus: string }>(`${this.apiUrl}/videos/status/${id}`).pipe(
      map(response => response.videoStatus)
    );
  }

  getVideoDuration(id: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/videos/duration/${id}`);
  }
}
