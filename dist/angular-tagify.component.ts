import {AfterViewInit, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import * as Tagify from '@yaireo/tagify';

export interface SettingsModel {
  placeholder?: string;
  delimiters?: string;
  pattern?: string | RegExp;
  mode?: string;
  mixTagsInterpolator?: string[];
  mixTagsAllowedAfter?: RegExp;
  duplicates?: boolean;
  enforceWhitelist?: boolean;
  autoComplete?: {
      enabled?: boolean;
      rightKey?: boolean;
  };
  whitelist?: string[] | Object[];
  blacklist?: string[] | Object[];
  addTagOnBlur?: boolean;
  callbacks?: Object;
  maxTags?: number;
  editTags?: number;
  templates?: {
      wrapper?: Function;
      tag?: Function;
      dropdownItem?: Function;
      dropdownItemNoMatch?: Function;
  };
  transformTag?: Function;
  keepInvalidTags?: boolean;
  skipInvalid?: boolean;
  backspace?: any;
  originalInputValueFormat?: Function;
  dropdown?: {
      enabled?: number | false;
      caseSensitive?: boolean;
      maxItems?: number;
      classname?: string;
      fuzzySearch?: boolean;
      accentedSearch?: boolean;
      position?: string;
      highlightFirst?: boolean;
      closeOnSelect?: boolean;
      mapValueTo?: string | Function;
      searchKeys?: string[];
      appendTarget?: any;
  };
}

@Component({
  selector: 'tagify',
  template: `<input *ngIf="settings" #tagifyInputRef/>`
})
export class TagifyComponent implements AfterViewInit {
  @Output() add = new EventEmitter(); // returns the added tag + updated tags list
  @Output() remove = new EventEmitter(); // returns the updated tags list
  @Input() settings: SettingsModel; // get possible tagify settings
  @Input() value: string | Array<string>

  @ViewChild('tagifyInputRef') tagifyInputRef: any;

  private tagify;

  ngAfterViewInit() {
    if (!this.settings) {
      return;
    }
    this.settings.callbacks = {
      add: () => this.add.emit({
        tags: this.tagify.value,
        added: this.tagify.value[this.tagify.value.length - 1]
      }),
      remove: () => this.remove.emit(this.tagify.value)
    };
    this.tagify = new Tagify(this.tagifyInputRef.nativeElement, this.settings);
  }

  ngOnChanges({ value }) {
    if(!this.tagify) return
    if (!value.previousValue) {
      this.tagify.loadOriginalValues(value.currentValue)
    }
  }

  /**
   * @description removes all tags
   */
  removeAll() {
    this.tagify.removeAllTags();
  }

  /**
   * @description add multiple tags
   */
  addTags(tags) {
    this.tagify.addTags(tags);
  }

  /**
   * @description destroy dom and everything
   */
  destroy() {
    this.tagify.destroy();
  }
}
