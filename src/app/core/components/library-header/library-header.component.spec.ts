import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryHeaderComponent } from './library-header.component';

describe('LibraryHeaderComponent', () => {
  let component: LibraryHeaderComponent;
  let fixture: ComponentFixture<LibraryHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibraryHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
