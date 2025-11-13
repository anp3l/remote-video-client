import { Injectable, signal, computed } from '@angular/core';

export interface UploadProgress {
  id: string;
  fileName: string;
  title: string;
  status: 'uploading' | 'processing' | 'uploaded' | 'error';
  thumbnailBlob?: string;
  errorMessage?: string;
  startTime: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UploadProgressService {
  private uploads = signal<Map<string, UploadProgress>>(new Map());

  activeUploads = computed(() => Array.from(this.uploads().values()));
  uploadCount = computed(() => this.activeUploads().length);
  inProgressCount = computed(() => 
    this.activeUploads().filter(u => u.status === 'uploading' || u.status === 'processing').length
  );
  hasActiveUploads = computed(() => this.uploadCount() > 0);

  addUpload(id: string, fileName: string, title: string): void {
    this.uploads.update(map => {
      const newMap = new Map(map);
      newMap.set(id, {
        id,
        fileName,
        title,
        status: 'uploading',
        startTime: new Date()
      });
      return newMap;
    });
  }

  updateProgress(id: string, updates: Partial<UploadProgress>): void {
    this.uploads.update(map => {
      const newMap = new Map(map);
      const existing = newMap.get(id);
      if (existing) {
        newMap.set(id, { ...existing, ...updates });
      }
      return newMap;
    });
  }

  removeUpload(id: string): void {
    this.uploads.update(map => {
      const newMap = new Map(map);
      newMap.delete(id);
      return newMap;
    });
  }

  clearCompleted(): void {
    this.uploads.update(map => {
      const newMap = new Map();
      map.forEach((upload, id) => {
        if (upload.status === 'processing' || upload.status === 'uploading') {
          newMap.set(id, upload);
        }
      });
      return newMap;
    });
  }
}
