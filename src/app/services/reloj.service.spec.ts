import { TestBed } from '@angular/core/testing';

import { RelojService } from './reloj.service';

describe('RelojService', () => {
  let service: RelojService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelojService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
