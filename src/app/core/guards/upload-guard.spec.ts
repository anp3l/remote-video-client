import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { uploadGuard } from './upload-guard';

describe('uploadGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => uploadGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
