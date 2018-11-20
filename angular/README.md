# NgTagify

An Angular module wrapper for https://github.com/yairEO/tagify

you can install it by running following from lib folder:

`npm i ngTagify-1.0.0.tgz`


This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.1.3.

## How To Use
Install ngTagify which is located under /package folder (ngTagify-1.0.0.tgz).

Import ngTagify from your consumer module.

```
import {TagifyModule} from 'ngTagify';

...

  imports: [
    TagifyModule.forRoot()
  ],

...
```


You will get the **TagifyComponent** which will be used by your template as `<tagify>`

Example:

```
<div>
  testing tagify wrapper
  <tagify [settings]="settings"
          (add)="onAdd($event)"
          (remove)="onRemove($event)">
  </tagify>
  <button (click)="clearTags()">clear</button>
  <button (click)="addTags()">add Tags</button>
</div>
```

And the **TagifyService**

(The tagifyService is a singletone injected by angular, do not create a new instance of it)

```typescript
import {Component, OnDestroy} from '@angular/core';
import {TagifyService} from 'ngTagify';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {

  constructor(private tagifyService: TagifyService) {}
  public settings = { blacklist: ['fucking', 'shit']};

  onAdd(tagify) {
    console.log('added a tag', tagify);
  }

  onRemove(tags) {
    console.log('removed a tag', tags);
  }
  clearTags() {
    this.tagifyService.removeAll();
  }
  addTags() {
    this.tagifyService.addTags(['this', 'is', 'cool']);
  }
  ngOnDestroy() {
    this.tagifyService.destroy();
  }
}
```

## Build instructions
- run `npm i` in order to install all required dependencies.
- run `npm run packagr` in order to tell ng-packager to bundle the ng-tagify-wrapper module
- from the generated /dist run `npm pack` to pack it as an npm ready package