<h1 align="center">
  <img src="/logo.svg?sanitize=true" width="40%" />
  <br><br>
  <a href='https://yaireo.github.io/tagify'>Tagify</a> - <em>tags</em> input component
</h1>

<p align="center">
  Transforms an input field or a textarea into a <em>Tags component</em>, in an easy, customizable way,
  with great performance and small code footprint, exploded with features.
  <br>
  <strong>Vanilla</strong> ⚡ <strong>React</strong> ⚡ <strong>Vue</strong> ⚡ <strong>Angular</strong>
<p>

<h3 align="center">
  👉 <a href="https://yaireo.github.io/tagify">See Demos</a> 👈
</h3>

<p align="center">
  <a href='https://www.npmjs.com/package/@yaireo/tagify'>
      <img src="https://img.shields.io/npm/v/@yaireo/tagify.svg" />
  </a>
  <a href='https://simple.wikipedia.org/wiki/MIT_License'>
      <img src="https://img.shields.io/badge/license-MIT-lightgrey" />
  </a>
  <img src="https://img.shields.io/bundlephobia/minzip/@yaireo/tagify" />
  <img src="https://img.shields.io/npm/dw/@yaireo/tagify" />
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/yairEO/tagify/master/mix3.gif" />
  <img src="https://raw.githubusercontent.com/yairEO/tagify/master/demo.gif" />
</p>





## Table of Contents

<!--ts-->
   * [Installation](#installation)
   * [Selling points](#selling-points)
   * [What can Tagify do](#what-can-tagify-do)
   * [Building the project](#building-the-project)
   * [Adding tags dynamically](#adding-tags-dynamically)
   * [Ajax whitelist](#ajax-whitelist)
   * [Edit tags](#edit-tags)
   * [DOM Templates](#dom-templates)
   * [Suggestions selectbox](#suggestions-selectbox)
   * [React wrapper](#react)
   * [Angular wrapper](#angular)
   * [Vue Example](https://medium.com/@krishnadeepuv/tagify-with-vue-234cdb03abd3)
   * [jQuery version](#jquery-version)
   * [FAQ](#FAQ)
   * [Methods](#methods)
   * [Events](#events)
   * [Settings](#settings)
<!--te-->

## Installation

    npm i @yaireo/tagify --save

### usage (in your bundle):

    import Tagify from '@yaireo/tagify'

    var tagify = new Tagify(...)

> Don't forget to include `tagify.css` file in your project.
> CSS location: `@yaireo/tagify/dist/tagify.css`
> SCSS location: `@yaireo/tagify/src/tagify.scss`
> [See SCSS usecase & example](https://github.com/yairEO/tagify/pull/282)

## Selling points
* JS minified `~30kb` (`~9kb` GZIP)
* CSS minified `~8kb` (`~2kb` GZIP) - generated from SCSS with variables
* Easily customized, plenty of settings for common scenarios
* Your input/textarea node values kept in sync with Tagify
* ARIA accessibility support
* Many useful custom [events](#events)
* Easily change direction to RTL (via the SCSS file)
* Internet Explorer - A polyfill script can be used: `tagify.polyfills.min.js` in `/dist`

## What can Tagify do
* Can be applied on input & textarea elements
* Supports [mix content](#mixed-content) (text and tags together)
* Supports [single-value](#single-value) mode (like `<select>`)
* Supports whitelist
* Supports blacklists
* Supports Templates for customized markup: <em>wrapper</em>, <em>tag item<em> & </em>suggestion item</em>
* Shows suggestions selectbox (flexiable settings & styling) at full width or next to the typed texted (caret)
* Allows setting suggestions' [aliases](#example-for-a-suggestion-item-alias) for easier fuzzy-searching
* Auto-suggest input as-you-type with ability to auto-complete
* Can paste in multiple values: `tag 1, tag 2, tag 3` or even newline-separated tags
* Tags can be created by Regex delimiter or by pressing the "Enter" key / focusing of the input
* Validate tags by Regex pattern
* Tags are [editable](#edit-tags)
* Supports read-only mode to the whole componenet or per-tag
* Each tag can have any properties desired (class, data-whatever, readonly...)
* Automatically disallow duplicate tags (vis "settings" object)
* Has built-in CSS loader, if needed (Ex. <em>AJAX</em> whitelist pulling)
* Tags can be trimmed via `hellip` by giving `max-width` to the `tag` element in your `CSS`

## Building the project
Simply run `gulp` in your terminal, from the project's path ([Gulp](https://gulpjs.com) should be installed first).

Source files are this path: `/src/`

Output files, which are automatically generated using Gulp, are in: `/dist/`

The rest of the files are most likely irrelevant.

## Adding tags dynamically
```javascript
var tagify = new Tagify(...);

tagify.addTags(["banana", "orange", "apple"])

// or add tags with pre-defined propeties

tagify.addTags([{value:"banana", color:"yellow"}, {value:"apple", color:"red"}, {value:"watermelon", color:"green"}])
```

## output value
There are two possible ways to get the value of the tags:

1. Access the tagify's instance's `value` prop: `tagify.value` (Array of tags)
2. Access the original input's value: `inputElm.value` (Stringified Array of tags)

## Ajax whitelist
Dynamically-loaded suggestions list (*whitelist*) from the server (as the user types) is a frequent need to many.

Tagify comes with its own loading animation, which is a very lightweight CSS-only code, and the <em>loading</em>
state is controlled by the method `tagify.loading` which accepts `true` or `false` as arguments.

Below is a basic example using the `fetch` API. I advise to abort the last request on any input before starting a new request.

<details>
  <summary>Example:</summary>

```javascript
var input = document.querySelector('input'),
    tagify = new Tagify(input, {whitelist:[]}),
    controller; // for aborting the call

// listen to any keystrokes which modify tagify's input
tagify.on('input', onInput)

function onInput( e ){
  var value = e.detail.value;
  tagify.settings.whitelist.length = 0; // reset the whitelist

  // https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
  controller && controller.abort();
  controller = new AbortController();

  // show loading animation and hide the suggestions dropdown
  tagify.loading(true).dropdown.hide.call(tagify)

  fetch('http://get_suggestions.com?value=' + value, {signal:controller.signal})
    .then(RES => RES.json())
    .then(function(whitelist){
      // update inwhitelist Array in-place
      tagify.settings.whitelist.splice(0, whitelist.length, ...whitelist)
      tagify.loading(false).dropdown.show.call(tagify, value); // render the suggestions dropdown
    })
}
```
</details>

## Edit tags
Tags which aren't `read-only` can be edited by double-clicking them (by default)
or by changing the `editTags` *setting* to `1`, making tags editable by single-clicking them.

The value is saved on `blur` or by pressing `enter` key. Pressing `Escape` will revert the change trigger `blur`.
<kbd>ctrl</kbd><kbd>z</kbd> will revert the change if an edited tag was marked as not valid (perhaps duplicate or blacklisted)

To prevent *all* tags from being allowed to be editable, set the `editTags` setting to `false` (or `null`).<br>
To do the same but for specific tag(s), set those tags' data with `editable` property set to `false`:

```
<input value='[{"value":"foo", "editable":false}, {"value":"bar"}]'>
```

## DOM Templates
It's possible to control the templates for the following HTML elements tagify generates by
modying the `settings.templates` Object with your own custom functions which should output a string.

<details>
  <summary><strong>Default templates</strong></summary>

```javascript
templates : {
  wrapper(input, settings){
    return `<tags class="tagify ${settings.mode ? "tagify--" + settings.mode : ""} ${input.className}"
                        ${settings.readonly ? 'readonly aria-readonly="true"' : 'aria-haspopup="listbox" aria-expanded="false"'}
                        role="tagslist"
                        tabIndex="-1">
                <span contenteditable data-placeholder="${settings.placeholder || '&#8203;'}" aria-placeholder="${settings.placeholder || ''}"
                    class="tagify__input"
                    role="textbox"
                    aria-controls="dropdown"
                    aria-autocomplete="both"
                    aria-multiline="${settings.mode=='mix'?true:false}"></span>
            </tags>`
  },

  tag(value, tagData){
      return `<tag title='${tagData.title || value}'
                contenteditable='false'
                spellcheck='false'
                tabIndex="-1"
                class='tagify__tag ${tagData.class ? tagData.class : ""}'
                ${this.getAttributes(tagData)}>
          <x title='' class='tagify__tag__removeBtn' role='button' aria-label='remove tag'></x>
          <div>
              <span class='tagify__tag-text'>${value}</span>
          </div>
      </tag>`
  },

  dropdownItem( item ){
    var mapValueTo = this.settings.dropdown.mapValueTo,
        value = (mapValueTo
            ? typeof mapValueTo == 'function'
                ? mapValueTo(item)
                : item[mapValueTo]
            : item.value) || item.value,
        sanitizedValue = (value || item).replace(/`|'/g, "&#39;");

    return `<div ${this.getAttributes(item)}
                class='tagify__dropdown__item ${item.class ? item.class : ""}'
                tabindex="0"
                role="option"
                aria-labelledby="dropdown-label">${sanitizedValue}</div>`;
  }
}
```
</details>

## Suggestions selectbox
The suggestions selectbox is shown is a whitelist Array of Strings or Objects was passed in the settings when the Tagify instance was created.
Suggestions list will only be rendered if there are at least two matching sugegstions (case-insensetive).

The selectbox dropdown will be appended to the document's `<body>` element and will be rendered by default in a position below (bottom of) the Tagify element.
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
            enabled   : 0,         // show the dropdown immediately on focus
            maxItems  : 5,
            position  : "text",    // place the dropdown near the typed text
            closeOnSelect : false, // keep the dropdown open after selecting a suggestion
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

By default searching the suggestions is using fuzzy-search (see [settings](#settings)).

If you wish to assign *alias* to items (in your suggestion list), add the `searchBy` property to whitelist items you wish
to have an *alias* for. In the below example, when typing a part of string which is included in the `searchBy` property, the suggested item will
match "Israel" will be rendered in the suggestion list selectbox.

### [Example](https://yaireo.github.io/tagify/#section-extra-properties) for a suggestion item alias

```javascript
whitelist = [
    ...
    { value:'Israel', code:'IL', searchBy:'holy land, desert, middle east' },
    ...
]
```

Another handy setting is `dropdown.searchKeys` which, like the above `dropdown.searchBy` setting, allows
expanding the search of any typed terms to more than the `value` property of the whitelist items (if items are a *Collection*).

### Example whitelist:

```javascript
[
  {
    value    : "foo",
    nickname : "bar",
    email    : "baz@mail.com"
  },
  ...
]
```

// setting to search in other keys:
```javascript
{
  dropdown: {
    searchKeys: ["nickname", "email"] // "value" & "searchBy" key are searched in, regardless
  }
}
```

## Mixed-Content

> To use this feature it must be toggled - see [settings](#settings).

When mixing text with tags, the original textarea (or input) element will have a value as follows:

    [[cartman]]⁠ and [[kyle]]⁠ do not know [[Homer simpson]]⁠

If the inital value of the textarea or input is formatted as the above example, tagify will try to
automatically convert everything between `[[` & `]]` to a tag, if tag exists in the *whitelist*, so make
sure when the Tagify instance is initialized, that it has tags with the correct `value` property that match
the same values that appear between `[[` & `]]`.

Applying the setting `dropdown.position:"text"` is encouraged for mixed-content tags, because the suggestions list
will be rendered right next to the caret location and not the the bottom of the Tagify componenet, which might look
weird when there is already a lot of content at multiple lines.

If a tag does not exists in the *whitelist*, it may be created by the user and all you should do is listen to the `add` event and update your local/remote state.

## Single-Value

Similar to native `<Select>` element, but allows typing free text as value.

## React

A Tagify React component is exported as `<Tags>` from [`react.tagify.js`](https://github.com/yairEO/tagify/blob/master/dist/react.tagify.js):

Check the [**live demo**](https://codesandbox.io/s/tagify-react-wrapper-6vd3i) for a live React integration example


## Angular

**TagifyComponent** which will be used by your template as `<tagify>`

<details>
  <summary>Example:</summary>

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
</details>

**TagifyService**

> (The tagifyService is a singletone injected by angular, do not create a new instance of it)
Remember to add `TagifyService` to your module definition.

<details>
  <summary>Example:</summary>

```typescript
import {Component, OnDestroy} from '@angular/core';
import {TagifyService} from '@yaireo/tagify';

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
</details>



## jQuery version

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
$('[name=tags]').data('tagify').addTags('aaa, bbb, ccc')
````

## FAQ

To render all the tags at the same line, without tags wrapping to new lines, add this to your `.tagify` CSS:

```css
flex-wrap: nowrap;
````

* [Double-click tag fires both "edit" & "click" custom events](https://github.com/yairEO/tagify/issues/247)
* [Manualy open the suggestions dropdown](https://github.com/yairEO/tagify/issues/254)
* [Render your own suggestions dropdown](https://github.com/yairEO/tagify/issues/244)
* [Allow max length on mix mode](https://github.com/yairEO/tagify/issues/252)
* [Always show dropdown](https://github.com/yairEO/tagify/issues/253)
* [Limit the length of a tag value (minimum & maximum)](https://github.com/yairEO/tagify/issues/245)
* [Mixed mode initial value](https://github.com/yairEO/tagify/issues/237)
* [Random colors for each tag](https://github.com/yairEO/tagify/issues/223)
* [Format input value for server side](https://github.com/yairEO/tagify/issues/220)
* [Writing to tagify textarea](https://github.com/yairEO/tagify/issues/294)
* [Scroll all tags within one line, instead of growing vertically](https://github.com/yairEO/tagify/issues/145)
* [Insert emoji at caret location when editing a tag](https://github.com/yairEO/tagify/issues/365)
* [propagate `change` event](https://github.com/yairEO/tagify/issues/413)
* [Manually update tag data after it was added](https://github.com/yairEO/tagify/issues/433)

## CSS Variables (see [MDN docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties))

These CSS variables allow easy customization without the need to manually write CSS.
If you do wish to heavily style your Tagify components, then you can use these variables within
your modified styles.

For example how this can be used, see the [demos page](https://yaireo.github.io/tagify/#section-different-look).

Name                            | Info
------------------------------- | --------------------------------
--tags-border-color             | The outer border color which surrounds tagify
--tag-bg                        | Tag background color
--tag-hover                     | Tag background color on hover (mouse)
--tag-text-color                | Tag text color
--tag-text-color--edit          | Tag text color when a Tag is being edited
--tag-pad                       | Tag padding, from all sides. Ex. `.3em .5em`
--tag--min-width                | Minimum Tag width
--tag--max-width                | Maximum tag width, which gets trimmed with *hellip* after
--tag-inset-shadow-size         | This is the inner shadow size, which dictates the color of the Tags.<br>It's important the size fits *exactly* to the tag.<br>Change this if you change the `--tag-pad` or fontsize.
--tag-invalid-color             | For border color of edited tags with invalid value being typed into them
--tag-invalid-bg                | Background color for invalid Tags.
--tag-remove-bg                 | Tag background color when hovering the `×` button.
--tag-remove-btn-bg             | The remove (`×`) button background color
--tag-remove-btn-bg--hover      | The remove (`×`) button background color on hover
--loader-size                   | Loading animation size. `1em` is pretty big, default is a bit less.
--tag-hide-transition           | Controls the transition property when a tag is removed. default is '.3s'


## Methods

Name                | Parameters                               | Info
------------------- | ---------------------------------------- | --------------------------------------------------------------------------
destroy             |                                          | Reverts the input element back as it was before Tagify was applied
removeAllTags       |                                          | Removes all tags and resets the original input tag's value property
addTags             | `tagsItems`, `clearInput`, `skipInvalid` | Accepts a String (word, single or multiple with a delimiter), an Array of Objects (see above) or Strings
removeTag           | Node/String                              | Removes a specific tag. Argument is the tag DOM element to be removed, or value. When nothing passed, removes last tag (see source code)
loadOriginalValues  | String/Array                             | Converts the input's value into tags. This method gets called automatically when instansiating Tagify. Also works for mixed-tags
getTagIndexByValue  | String                                   | Returns the index of a specific tag, by value
parseMixTags        | String                                   | Converts a String argument (`[[foo]]⁠ and [[bar]]⁠ are..`) into HTML with mixed tags & texts
getTagElms          |                                          | Returns a DOM nodes list of all the tags
getTagElmByValue    | String                                   | Returns a specific tag DOM node by value
editTag             | Node                                     | Goes to edit-mode in a specific tag
replaceTag          | `tagElm`, `tagData`                      | Exit a tag's edit-mode. if "tagData" exists, replace the tag element with new data and update Tagify value
loading             | Boolean                                  | Toogle loading state on/off (Ex. AJAX whitelist pulling)

## Events

All triggered events return the instance's scope (tagify).<br>
See `e.detail` for custom event additional data.

<details>
  <summary>See Examples</summary>

```javascript
var tagify = new Tagify(...)

// events are chainable and multiple events may be binded for the same callback
tagify
  .on('input', e => console.log(e.detail))
  .on('edit:input edit:updated edit:start edit:keydown', e => console.log(e.type, e.detail))
```
</details>

Name               | Info
------------------ | --------------------------------------------------------------------------
add                | A tag has been added
remove             | A tag has been removed
invalid            | A tag has been added but did not pass vaildation. See [event detail](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events)
input              | [Input](https://developer.mozilla.org/en-US/docs/Web/Events/input) event, when a tag is being typed/edited. `e.detail` exposes `value`, `inputElm` & `isValid`
click              | Clicking a tag. Exposes the tag element, its index & data
keydown            | When tagify input has focus and a key was pressed
focus              | The component currently has focus
blur               | The component lost focus
edit:input         | Typing inside an edited tag
edit:beforeUpdate  | Just before a tag has been updated, while still in "edit" mode
edit:updated       | A tag as been updated (changed view editing or by directly calling the `replaceTag()` method)
edit:start         | A tag is now in "edit mode"
edit:keydown       | keydown event while an edited tag is in focus
dropdown:show      | Suggestions dropdown is to be rendered. The dropdown DOM node is passed in the callback, [see demo](https://yaireo.github.io/tagify/#section-basic).
dropdown:hide      | Suggestions dropdown has been removed from the DOM
dropdown:select    | Suggestions dropdown item selected (by mouse/keyboard/touch)
dropdown:scroll    | Tells the percentage scrolled. (`event.detail.percentage`)


## Settings

Name                    | Type             | Default                          | Info
----------------------- | ---------------- | -------------------------------- | --------------------------------------------------------------------------
placeholder             | String           |                                  | Placeholder text. If this attribute is set on an input/textarea element it will override this setting
delimiters              | String           | `,`                              | [regex string] split tags by any of these delimiters. Example: `",|`  |."`
pattern                 | String           | null                             | Validate input by REGEX pattern (can also be applied on the input itself as an attribute) Ex: `/[1-9]/`
mode                    | String           | null                             | Use `select` for single-value dropdown-like select box. See `mix` as value to allow mixed-content. The 'pattern' setting must be set to some character.
mixTagsInterpolator     | Array            | `['[[', ']]']`                   | Interpolation for mix mode. Everything between these will become a tag
mixTagsAllowedAfter     | Regex            | `/,|\.|\:|\s/`                   | Define conditions in which typed mix-tags content is allowing a tag to be created after.
duplicates              | Boolean          | false                            | Should duplicate tags be allowed or not
enforceWhitelist        | Boolean          | false                            | Should ONLY use tags allowed in whitelist.<br>In `mix-mode`, setting it  to `false` will not allow creating new tags.
autoComplete.enabled    | Boolean          | true                             | Tries to suggest the input's value while typing (match from whitelist) by adding the rest of term as grayed-out text
autoComplete.rightKey   | Boolean          | false                            | If `true`, when <kbd>→</kdb> is pressed, use the suggested value to create a tag, else just auto-completes the input. In mixed-mode this is ignored and treated as "true"
whitelist               | Array            | []                               | An array of tags which only they are allowed
blacklist               | Array            | []                               | An array of tags which aren't allowed
addTagOnBlur            | Boolean          | true                             | Automatically adds the text which was inputed as a tag when blur event happens
callbacks               | Object           | {}                               | Exposed callbacks object to be triggered on events: `'add'` / `'remove'` tags
maxTags                 | Number           | Infinity                         | Maximum number of allowed tags. when reached, adds a class "tagify--hasMaxTags" to `<Tags>`
editTags                | Number           | 2                                | Number of clicks on a tag to enter "edit" mode. Only `1` or `2` work. `false` or `null` will disallow editing
templates               | Object           | `wrapper`, `tag`, `dropdownItem` | Object consisting of functions which return template strings
transformTag            | Function         | undefined                        | Takes a tag input as argument and returns a transformed value
keepInvalidTags         | Boolean          | false                            | If `true`, do not remove tags which did not pass validation
skipInvalid             | Boolean          | false                            | If `true`, do not add invalid, temporary, tags before automatically removing them
backspace               | *                | true                             | On pressing backspace key:<br> `true` - remove last tag <br>`edit` - edit last tag
dropdown.enabled        | Number           | 2                                | Minimum characters to input to show the suggestions list. "false" to disable
dropdown.maxItems       | Number           | 10                               | Maximum items to show in the suggestions list dropdown
dropdown.classname      | String           | `""`                             | Custom class name for the dropdown suggestions selectbox
dropdown.fuzzySearch    | Boolean          | true                             | Enables filtering dropdown items values' by string *containing* and not only *beginning*
dropdown.position       | String           | null                             | <ul><li>`manual` - will not render the dropdown, and you would need to do it yourself. [See demo](https://yaireo.github.io/tagify/#section-manual-suggestions)</li><li>`text` - will place the dropdown next to the caret</li><li>`all` - normal, full-width design</li></ul>
dropdown.highlightFirst | Boolean          | false                            | When a suggestions list is shown, highlight the first item, and also suggest it in the input (The suggestion can be accepted with <kbd>→</kbd> key)
dropdown.closeOnSelect  | Boolean          | true                             | close the dropdown after selecting an item, if `enabled:0` is set (which means always show dropdown on focus)
dropdown.mapValueTo     | Function/String  |                                  | if whitelist is an Array of Objects:<br>Ex. `[{value:'foo', email:'foo@a.com'},...]`)<br> this setting controlls which data <em>key</em> will be printed in the dropdown.<br> Ex. `mapValueTo: data => "To:" + data.email`<br>Ex. `mapValueTo: "email"`
dropdown.searchKeys     | Array            | `["value", "searchBy"]`          | When a user types something and trying to match the whitelist items for suggestions, this setting allows matching other keys of a whitelist objects
