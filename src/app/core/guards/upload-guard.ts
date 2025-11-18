import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { UploadProgressService } from '../services/upload-progress.service';

export const uploadGuard: CanDeactivateFn<any> = () => {
  const uploadService = inject(UploadProgressService);
  
  if (uploadService.uploadingCount() > 0) {
    return confirm(
      `${uploadService.uploadingCount()} video are still uploading.\n` +
      'If you leave now, uploads will be interrupted. Continue?'
    );
  }
  
  return true;
};
