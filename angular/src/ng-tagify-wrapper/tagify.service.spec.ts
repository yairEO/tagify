import { TestBed, inject } from '@angular/core/testing';

import { TagifyService } from './tagify.service';

describe('TagifyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TagifyService]
    });
  });

  it('should be created', inject([TagifyService], (service: TagifyService) => {
    expect(service).toBeTruthy();
  }));
});
