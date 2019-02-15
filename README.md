[Tagify](https://yaireo.github.io/tagify) - lightweight input "tags" script
========

<!--
```
<custom-element-demo>
  <template>
    <script src="https://yaireo.github.io/tagify/dist/tagify.js"></script>
    <script src="https://yaireo.github.io/tagify/dist/tagify.css"></script>
    <input name='tags' placeholder='write some tags' value='css, html, javascript, css'>
  </template>
</custom-element-demo>
```
-->
<p align="center">
    <img src="https://raw.githubusercontent.com/yairEO/tagify/master/mix2.gif" />
</p>
<p align="center">
    <img src="https://raw.githubusercontent.com/yairEO/tagify/master/demo.gif" />
</p>

Transforms an input field or a textarea into a *Tags* component, in an easy, customizable way,
with great performance and tiny code footprint.

## [Documentation & Demos](https://yaireo.github.io/tagify)

## Table of contents

<!--ts-->
   * [Installation](#installation)
   * [Selling points](#selling-points)
   * [What can Tagify do](#what-can-tagify-do)
   * [Building the project](#building-the-project)
   * [Adding tags dynamically](#adding-tags-dynamically)
   * [Ajax whitelist](#ajax-whitelist)
   * [Suggestions selectbox](#suggestions-selectbox)
   * [Edit tags](#edit-tags)
   * [React wrapper](#react)
   * [Angular wrapper](#angular)
   * [jQuery version](#jquery-version)
   * [Methods](#methods)
   * [Events](#events)
   * [Settings](#settings)
<!--te-->

## Installation

    npm i @yaireo/tagify --save

    // usage:
    import Tagify from '@yaireo/tagify'

    var tagify = new Tagify(...)

## Selling points
* JS minified `~17kb` (`~6kb` GZIP)
* CSS minified `~5kb` (`~2kb` GZIP) - well-crafted flexible code
* Easily change direction to RTL via the SCSS file only
* No other inputs are used beside the original, and its value is kept in sync
* Easily customized
* Exposed custom events (add, remove, invalid)
* Internet Explorer - A polyfill script can be used: `tagify.polyfills.min.js` in `/dist`

## What can Tagify do
* Can be applied on input & textarea elements
* Supports mix content (text and tags together)
* Supports whitelist
* Supports blacklists
* Shows suggestions selectbox (flexiable settings & styling)
* Auto-complete input as-you-type (whitelist first match)
* Can paste in multiple values: `tag 1, tag 2, tag 3`
* Tags can be created by Regex delimiter or by pressing the "Enter" key / focusing of the input
* Validate tags by Regex pattern
* Tags are [editable](#edit-tags)
* Supports read-only mode to the whole componenet or per-tag
* Each tag can have any properties desired (class, data-whatever, readonly...)
* Automatically disallow duplicate tags (vis "settings" object)
* Tags can be trimmed via `hellip` by giving `max-width` to the `tag` element in your `CSS`

## Building the project
Simply run `gulp` in your terminal, from the project's path ([Gulp](https://gulpjs.com) should be installed first).

Source files are this path: `/src/`

Output files, which are automatically generated using Gulp, are in: `/dist/`

The rest of the files are most likely irrelevant.

### Adding tags dynamically

```javascript
var tagify = new Tagify(...);

tagify.addTags(["banana", "orange", "apple"])

// or add tags with pre-defined propeties

tagify.addTags([{value:"banana", color:"yellow"}, {value:"apple", color:"red"}, {value:"watermelon", color:"green"}])
```

### output value

There are two possible ways to get the value of the tags:

1. Access the tagify's instance's `value` prop: `tagify.value` (Array of tags)
2. Access the original input's value: `inputElm.value` (Stringified Array of tags)

### Ajax whitelist

Dynamically-loaded suggestions list (*whitelist*) from the server (as the user types) is a frequent need to many.

Below is a basic example using the `fetch` API. I advise to abort the last request on any input before starting a new request.

```javascript
var input = document.querySelector('input'),
    tagify = new Tagify(input, {whitelist:[]}),
    controller; // for aborting the call

// listen to any keystrokes which modify tagify's input
tagify.on('input', onInput)

function onInput( e ){
  var value = e.detail;
  tagify.settings.whitelist.length = 0; // reset the whitelist

  // https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
  controller && controller.abort();
  controller = new AbortController();

  fetch('http://get_suggestions.com?value=' + value, {signal:controller.signal})
    .then(RES => RES.json())
    .then(function(whitelist){
      tagify.settings.whitelist = whitelist;
      tagify.dropdown.show.call(tagify, value); // render the suggestions dropdown
    })
}

```


### Suggestions selectbox
The suggestions selectbox is shown is a whitelist Array of Strings or Objects was passed in the settings when the Tagify instance was created.
Suggestions list will only be rendered if there were at least two sugegstions found.
Matching suggested values is case-insensetive.
The selectbox dropdown will be appended to the document's "body" element and will be positioned under the element.
Using the keyboard arrows up/down will highlight an option from the list, and hitting the Enter key to select.

It is possible to tweak the selectbox dropdown via 2 settings:

 - enabled - this is a numeral value which tells Tagify when to show the suggestions dropdown, when a minimum of N characters were typed.
 - maxItems - Limits the number of items the suggestions selectbox will render

```javascript
var input = document.querySelector('input'),
    tagify = new Tagify(input, {
        whitelist : ['aaa', 'aaab', 'aaabb', 'aaabc', 'aaabd', 'aaabe', 'aaac', 'aaacc'],
        dropdown : {
            classname : "color-blue",
            enabled   : 3,
            maxItems  : 5
        }
    });
```

Will render:

```html
<div class="tagify__dropdown" style="left: 993.5px; top: 106.375px; width: 616px;">
    <div class="tagify__dropdown__item" value="aaab">aaab</div>
    <div class="tagify__dropdown__item" value="aaabb">aaabb</div>
    <div class="tagify__dropdown__item" value="aaabc">aaabc</div>
    <div class="tagify__dropdown__item" value="aaabd">aaabd</div>
    <div class="tagify__dropdown__item" value="aaabe">aaabe</div>
</div>
```

### Edit tags
Tags which aren't `read-only` can be edited by double-clicking them.

The value is saved on `blur` or by pressnig `enter` key. Pressing `Escaspe` will revert the change trigger `blur`.
<kbd>ctrl</kbd><kbd>z</kbd> will revert the change if an edited tag was marked as not valid (perhaps duplicate or blacklisted)

### React

`react.tagify.js`

React component using the Tagify's Wrapper `<Tags>`:

```javascript
import { Tags } from '@yaireo/tagify/dist/react.tagify'

// setup some basic Tagify settings object
var tagifySettings = {
    blacklist : ["fuck", "shit"]
}

// Demo "App" component that is using the Tagify React component (<Tags/>)
class App extends React.Component {
    constructor(props) {
        super(props);

        tagifySettings.callbacks = {
            add     : this.onTagifyAdd,
            remove  : this.onTagifyRemove,
            input   : this.onTagifyInput,
            invalid : this.onTagifyInvalid
        }
    }

    componentDidMount(){}

    // callbacks for all of Tagify's events:
    onTagifyAdd = e => {
        console.log('added:', e.detail);
    }

    onTagifyRemove = e => {
        console.log('remove:', e.detail);
    }

    onTagifyInput = e => {
        console.log('input:', e.detail);
    }

    onTagifyInvalid = e => {
        console.log('invalid:', e.detail);
    }

    // Render <Textarea> element and applies Tagify on it
    render(){
        return (
            <Tags mode='textarea'
                  autofocus={true}
                  className='myInput'
                  name='tags'
                  settings={tagifySettings}
                  initialValue='foo, bar, baz' />
        )
    }
}

ReactDOM.render(<App />, document.getElementById('app'))
```

[Live React Demo in Codepen](https://codepen.io/vsync/project/editor/44cc53af79bbede42efd7521d94d6f9f)

### Angular

**TagifyComponent** which will be used by your template as `<tagify>`

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

**TagifyService**

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

### jQuery version

`jQuery.tagify.js`

A jQuery wrapper verison is also available, but I advise not using it because it's basically the exact same as the "normal"
script (non-jqueryfied) and all the jQuery's wrapper does is allowing to chain the event listeners for ('add', 'remove', 'invalid')

```javascript
$('[name=tags]')
    .tagify()
    .on('add', function(e, tagName){
        console.log('added', tagName)
    });
```

Accessing methods can be done via the [`.data('tagify')`](https://api.jquery.com/data):

```javascript
$('[name=tags]').tagify();
// get tags from the server (ajax) and add them:
$('[name=tags]').data('tagify').addTag('aaa, bbb, ccc')
````

## Methods

Name                | Info
------------------- | --------------------------------------------------------------------------
destroy             | Reverts the input element back as it was before Tagify was applied
removeAllTags       | Removes all tags and resets the original input tag's value property
addTags             | Accepts a String (word, single or multiple with a delimiter), an Array of Objects (see above) or Strings
removeTag           | Removes a specific tag (argument is the tag DOM element to be removed. see source code.)
loadOriginalValues  | Converts the input's value into tags. This method gets called automatically when instansiating Tagify
getTagIndexByValue  |
getTagElmByValue    |


## Events

Name            | Info
--------------- | --------------------------------------------------------------------------
add             | A tag has been added
remove          | A tag has been removed
invalid         | A tag has been added but did not pass vaildation. See [event detail](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events)
input           | [Input](https://developer.mozilla.org/en-US/docs/Web/Events/input) event, when a tag is being typed/edited. `e.detail` exposes the typed value
click           | Clicking a tag. Exposes the tag element, its index & data
edit            | A tag has been edited


## Settings

Name                  | Type       | Default     | Info
----------------------| ---------- | ----------- | --------------------------------------------------------------------------
delimiters            | String     | ","         | [regex] split tags by any of these delimiters. Example: ",| |."
pattern               | String     | null        | Validate input by REGEX pattern (can also be applied on the input itself as an attribute) Ex: /[1-9]/
mode                  | String     | null        | use 'mix' as value to allow mixed-content. The 'pattern' setting must be set to some character.
duplicates            | Boolean    | false       | (flag) Should duplicate tags be allowed or not
enforceWhitelist      | Boolean    | false       | Should ONLY use tags allowed in whitelist
autocomplete          | Boolean    | true        | Tries to autocomplete the input's value while typing (match from whitelist)
whitelist             | Array      | []          | An array of tags which only they are allowed
blacklist             | Array      | []          | An array of tags which aren't allowed
addTagOnBlur          | Boolean    | true        | Automatically adds the text which was inputed as a tag when blur event happens
callbacks             | Object     | {}          | Exposed callbacks object to be triggered on events: 'add' / 'remove' tags
maxTags               | Number     | Infinity    | Maximum number of allowed tags. when reached, adds a class "hasMaxTags" to `<Tags>`
transformTag          | Function   | undefined   | Takes a tag input as argument and returns a transformed value
tagTemplate           | Function   | undefined   | Takes a tag's value and data as arguments and returns an HTML string for a tag element
keepInvalidTags       | Boolean    | false       | If true, do not remove tags which did not pass validation
backspace             | *          | true        | On backspace: (true) - remove last tag, ("edit") - edit last tag
dropdown.enabled      | Number     | 2           | Minimum characters to input to show the suggestions list. "false" to disable
dropdown.maxItems     | Number     | 10          | Maximum items to show in the suggestions list dropdown
dropdown.classname    | String     | ""          | Custom class name for the dropdown suggestions selectbox
dropdown.itemTemplate | Function   | ""          | Returns a custom string for each list item in the dropdown suggestions selectbox
