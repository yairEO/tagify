import {ElementRef, Injectable} from '@angular/core';
import * as Tagify from '@yaireo/tagify';
import { SettingsModel } from './angular-tagify.component';

@Injectable({
  providedIn: 'root'
})
export class TagifyService {

  private tagify: Tagify;

  constructor() {}

  /** @description Singleton used by TagifyComponent to a ref to tagify
   * @returns tagify instance
   */
  getTagifyRef(tagifyInputRef: ElementRef, settings: SettingsModel) {
    if (arguments.length === 0) return;
    if (this.tagify) return this.tagify;
    this.tagify = new Tagify( tagifyInputRef, settings);
    return this.tagify;
  }

  /**
   * @description removes all tags
   */
  public removeAll() {
    this.tagify.removeAllTags();
  }

  /**
   * @description add multiple tags
   */
  public addTags(tags) {
    this.tagify.addTags(tags);
  }

  /**
   * @description destroy dom and everything
   */
  public destroy() {
    this.tagify.destroy();
  }
}
