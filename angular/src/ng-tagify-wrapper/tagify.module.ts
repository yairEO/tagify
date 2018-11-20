import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagifyComponent } from './tagify.component';
import {TagifyService} from './tagify.service';

@NgModule({
  declarations: [TagifyComponent],
  exports: [TagifyComponent],
  imports: [CommonModule],
  providers: [TagifyService],
})
export class TagifyModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: TagifyModule,
      providers: [ TagifyService ]
    };
  }
}
