import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TagifyComponent } from './tagify.component';

describe('TagifyComponent', () => {
  let component: TagifyComponent;
  let fixture: ComponentFixture<TagifyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TagifyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
