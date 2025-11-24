import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'durationFormat',
  standalone: true
})
export class DurationFormatPipe implements PipeTransform {

  /**
   * Transforms a given duration in seconds to a string in the format 'hh:mm:ss'.
   * If the given duration is invalid (NaN, null, or negative), returns '00:00:00'.
   * @param seconds Duration in seconds.
   * @returns A string representation of the duration.
   */
  transform(seconds: number): string {
    if (!seconds || seconds < 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [hours, minutes, secs]
      .map(v => v < 10 ? '0' + v : v)
      .join(':');
  }

}
