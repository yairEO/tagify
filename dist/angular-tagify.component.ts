import {AfterViewInit, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {TagifyService} from './angular-tagify.service';

export interface SettingsModel {
  delimiters?: string;
  pattern?: string;
  mode?: string;
  duplicates?: boolean;
  enforceWhitelist?: boolean;
  autocomplete?: boolean;
  whitelist?: string[];
  blacklist?: string[];
  addTagOnBlur?: boolean;
  callbacks?: Object;
  maxTags?: number;
  transformTag?: Function;
  tagTemplate?: Function;
  'dropdown.enabled'?: number;
  'dropdown.maxItems'?: string;
  'dropdown.classname'?: string;
  'dropdown.itemTemplate'?; Function;
}

@Component({
  selector: 'tagify',
  template: `<input *ngIf="settings" #tagifyInputRef/>`
})
export class TagifyComponent implements AfterViewInit {
  @Output() add = new EventEmitter(); // returns the added tag + updated tags list
  @Output() remove = new EventEmitter(); // returns the updated tags list
  @Input() settings: SettingsModel; // get possible tagify settings

  constructor(private tagifyService: TagifyService) { }

  @ViewChild('tagifyInputRef') tagifyInputRef: any;

  private tagify;

  ngAfterViewInit() {
    if (!this.settings) return;
    this.settings.callbacks = {
      add: () => this.add.emit({
        tags: this.tagify.value,
        added: this.tagify.value[this.tagify.value.length - 1]
      }),
      remove: () => this.remove.emit(this.tagify.value)
    };
    this.tagify = this.tagifyService.getTagifyRef(this.tagifyInputRef.nativeElement, this.settings);
  }
}
