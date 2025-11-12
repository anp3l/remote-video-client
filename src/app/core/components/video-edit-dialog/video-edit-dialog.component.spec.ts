import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoEditDialogComponent } from './video-edit-dialog.component';

describe('VideoEditDialogComponent', () => {
  let component: VideoEditDialogComponent;
  let fixture: ComponentFixture<VideoEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoEditDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
