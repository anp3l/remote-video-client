import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, Subject, switchMap} from 'rxjs';
import { Video } from '../models/video.model';
import { appConfig } from '../../app.config';

@Injectable({
  providedIn: 'root',
})
export class VideoApiService {
  
  private baseUrl = appConfig.apiBaseUrl;
  private syncRequest$ = new Subject<void>();
  public syncRequested$ = this.syncRequest$.asObservable();

  constructor(private http: HttpClient) {}

  // save video on server
  public saveVideo(video: File, metadata: Video): Observable<Object> {
    const url = this.baseUrl + '/videos';
    if (url === '') return of();

    const formData = new FormData();
    formData.append('videos', video);
    formData.append('description', metadata.description);
    formData.append('category', metadata.category);
    formData.append('tags', JSON.stringify(metadata.tags));

    return this.http.post<Object>(url, formData);
  }

  getVideoById(id: string): Observable<Video> {
    return this.http.get<Video>(`${this.baseUrl}/videos/${id}`);
  }

  getVideoStatus(id: string): Observable<string> {
    const url = `${this.baseUrl}/videos/status/${id}?_=${Date.now()}`;
    return this.http.get<{ videoStatus: string }>(url).pipe(
      // Extract just the string value
      switchMap((response) => [response.videoStatus]),
    );
  }

  getStaticThumbnailUrl(id: string): string {
    return `${this.baseUrl}/videos/thumb/static/${id}`;
  }

  getAnimatedThumbnailUrl(id: string): string {
    return `${this.baseUrl}/videos/thumb/animated/${id}`;
  }

  getStreamUrl(id: string): string {
    return `${this.baseUrl}/videos/stream/${id}/${id}.m3u8`;
  }

  getDownloadUrl(id: string): string {
    return `${this.baseUrl}/videos/download/${id}`;
  }
  deleteVideo(videoId: string): Observable<Object> {
    return this.http.delete<Object>(`${this.baseUrl}/videos/${videoId}`);
  }

  uploadCustomThumbnail(id: string, file: File, token: string): Observable<any> {
    const formData = new FormData();
    formData.append('thumbnail', file);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch(`${this.baseUrl}/videos/thumb/custom/${id}`, formData, { headers });
  }


}
