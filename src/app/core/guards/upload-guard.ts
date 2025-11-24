import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { UploadProgressService } from '../services/upload-progress.service';

/**
 * Guard that prevents the user from navigating away from a page
 * while there are still video uploads in progress.
 *
 * If there are any video uploads in progress, the guard will
 * display a confirmation dialog to the user, asking them if they
 * want to continue with the navigation, potentially interrupting the
 * video uploads.
 *
 * If the user confirms, the guard will allow the navigation to
 * continue. If the user cancels, the guard will prevent the
 * navigation from happening.
 */
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
