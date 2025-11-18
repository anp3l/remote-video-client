import { Component, Input, Output, EventEmitter, computed, Signal } from '@angular/core'
;
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SortBy, ViewMode } from '../../models/video.model';

@Component({
  selector: 'app-library-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './library-header.component.html',
  styleUrls: ['./library-header.component.scss']
})
export class LibraryHeaderComponent {

  @Input({ required: true }) videoCount!: number;
  @Input({ required: true }) filteredCount!: number;
  @Input({ required: true }) categories!: string[];
  @Input({ required: true }) searchQuery!: string;
  @Input({ required: true }) categoryFilter!: string;
  @Input({ required: true }) sortBy!: SortBy;
  @Input({ required: true }) viewMode!: ViewMode;
  @Input({ required: true }) loading!: boolean;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() categoryFilterChange = new EventEmitter<string>();
  @Output() sortByChange = new EventEmitter<SortBy>();
  @Output() viewModeChange = new EventEmitter<ViewMode>();
  @Output() upload = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  onSearchChange(value: string): void {
    this.searchQueryChange.emit(value);
  }

  onCategoryChange(value: string): void {
    this.categoryFilterChange.emit(value);
  }

  onSortChange(value: SortBy): void {
    this.sortByChange.emit(value);
  }

  onViewModeChange(value: ViewMode): void {
    this.viewModeChange.emit(value);
  }

  onUploadClick(): void {
    this.upload.emit();
  }

  onRefreshClick(): void {
    this.refresh.emit();
  }
  
  onLogoutClick(): void {
    this.logout.emit();
  }
}
