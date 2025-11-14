import { Injectable, signal, computed } from '@angular/core';

export interface UploadProgress {
  id: string;           // ID definitivo dal server (vuoto inizialmente)
  tempId: string;       // ID temporaneo usato per tracciare l'upload
  fileName: string;
  title: string;
  status: 'uploading' | 'uploaded' | 'error';
  progress: number;
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
  hasActiveUploads = computed(() => this.uploadCount() > 0);
  
  // Count by status
  uploadingCount = computed(() => 
    this.activeUploads().filter(u => u.status === 'uploading').length
  );
  
  uploadedCount = computed(() => 
    this.activeUploads().filter(u => u.status === 'uploaded').length
  );
  
  errorCount = computed(() => 
    this.activeUploads().filter(u => u.status === 'error').length
  );

  addUpload(tempId: string, fileName: string, title: string): void {
    this.uploads.update(map => {
      const newMap = new Map(map);
      newMap.set(tempId, {
        id: '',
        tempId,
        fileName,
        title,
        status: 'uploading',
        progress: 0,
        startTime: new Date()
      });
      return newMap;
    });
  }

  updateProgress(tempId: string, updates: Partial<UploadProgress>): void {
    this.uploads.update(map => {
      const newMap = new Map(map);
      const existing = newMap.get(tempId);
      if (existing) {
        newMap.set(tempId, { ...existing, ...updates });
      }
      return newMap;
    });
  }

  removeUpload(tempId: string): void {
    this.uploads.update(map => {
      const newMap = new Map(map);
      newMap.delete(tempId);
      return newMap;
    });
  }

  clearCompleted(): void {
    this.uploads.update(map => {
      const newMap = new Map();
      map.forEach((upload, key) => {
        if (upload.status === 'uploading') {
          newMap.set(key, upload);
        }
      });
      return newMap;
    });
  }

  clearAll(): void {
    this.uploads.set(new Map());
  }
}
