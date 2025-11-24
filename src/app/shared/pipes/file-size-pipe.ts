import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true
})
export class FileSizePipe implements PipeTransform {
/**
 * Returns a human-readable string representation of a file size in bytes.
 * @param {number|string} bytes The file size in bytes, or a string representation of it.
 * @param {number} [decimals=2] The number of decimal places to round to.
 * @returns {string} A string representation of the file size, such as "1.23 KB" or "4.56 MB".
 */
  transform(bytes: number | string, decimals: number = 2): string {
    const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    
    if (isNaN(numBytes) || numBytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(numBytes) / Math.log(k));

    return `${parseFloat((numBytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
