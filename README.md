<h1 align="center">
  <a href='https://yaireo.github.io/tagify'><img src="/docs/readme-header.svg" width="320" height="160"><a/>
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
  👉 <a href="https://yaireo.github.io/tagify">See Many Examples</a> 👈
  <br/><br/>
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
  <img src="/docs/mix3.gif?sanitize=true" />
  <img src="/docs/demo.gif?sanitize=true" />
</p>

## Table of Contents

<!--ts-->
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
  - [Option 1 - import from CDN:](#option-1---import-from-cdn)
  - [option 2 - import as a *Node module*:](#option-2---import-as-a-node-module)
- [Basic Usage Examples](#basic-usage-examples)
  - [Debugging](#debugging)
- [Features](#features)
- [Building the project](#building-the-project)
  - [Output files:](#output-files)
- [Adding tags dynamically](#adding-tags-dynamically)
- [Output value](#output-value)
  - [Modify original input value format](#modify-original-input-value-format)
- [Ajax whitelist](#ajax-whitelist)
- [Persisted data](#persisted-data)
- [Edit tags](#edit-tags)
- [Validations](#validations)
- [Drag \& Sort](#drag--sort)
  - [Integration example:](#integration-example)
- [DOM Templates](#dom-templates)
  - [Example of overriding the `tag` template:](#example-of-overriding-the-tag-template)
- [Suggestions list](#suggestions-list)
  - [Example for a suggestion item alias](#example-for-a-suggestion-item-alias)
  - [Example whitelist:](#example-whitelist)
- [Mixed-Content](#mixed-content)
- [Single-Value](#single-value)
- [React](#react)
  - [Update regarding `onChange` prop:](#update-regarding-onchange-prop)
    - [Updating the component's state](#updating-the-components-state)
- [jQuery version](#jquery-version)
- [HTML input \& textarea attributes](#html-input--textarea-attributes)
- [Caveats](#caveats)
- [FAQ](#faq)
- [CSS Variables](#css-variables)
  - [Suggestions Dropdown CSS variables](#suggestions-dropdown-css-variables)
  - [Full list of Tagify's SCSS variables](#full-list-of-tagifys-scss-variables)
- [Methods](#methods)
- [Events](#events)
- [Hooks](#hooks)
- [Settings](#settings)
<!--te-->

## Installation

### Option 1 - import from CDN:

Place these lines before any other code which is (or will be) using *Tagify* ([Example here](https://jsbin.com/jekuqap/edit?html))
```html
<script src="https://cdn.jsdelivr.net/npm/@yaireo/tagify"></script>
<script src="https://cdn.jsdelivr.net/npm/@yaireo/tagify/dist/tagify.polyfills.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/@yaireo/tagify/dist/tagify.css" rel="stylesheet" type="text/css" />
```

`Tagify` will then be available globally.
To load specific version use `@` - for example: `unpkg.com/@yaireo/tagify@3.1.0`

### option 2 - import as a *Node module*:
```sh
npm i @yaireo/tagify --save
```

## Basic Usage Examples

- Many demos with code examples can be [seen here](yaireo.github.io/tagify/)
- [CodeSandbox live demo](https://codesandbox.io/s/simple-tagify-setup-6pfi2)



```js
import Tagify from '@yaireo/tagify'

var inputElem = document.querySelector('input') // the 'input' element which will be transformed into a Tagify component
var tagify = new Tagify(inputElem, {
  // A list of possible tags. This setting is optional if you want to allow
  // any possible tag to be added without suggesting any to the user.
  whitelist: ['foo', 'bar', 'and baz', 0, 1, 2]
})
```

The above example shows the most basic `whitelist` array setting possible, with a mix
of *Strings* and *Numbers* but the array also support Objects whic a must-have property of `value`:

```js
whitelist: [{value: 'foo', id: '123', email: 'foo@whatever.com'}, ...]
```

The `value` property is what will be used when actually defining the `value` property of the original input element (`inputElem` in the example above) which was transformed
into a *Tagify* component, and so when the form data is sent to the server, it will contain all the values (which are the selected tags in the component).

For selected tags to show a different text than what is defined in `value` for a whitelist item, see the `tagTextProp` [setting](#settings)

⚠️ Important:
Don't forget to **include `tagify.css`** file in your project.
CSS location: `@yaireo/tagify/dist/tagify.css`
SCSS location: `@yaireo/tagify/src/tagify.scss`
[See SCSS usecase & example](https://github.com/yairEO/tagify/pull/282)

### Debugging
There are several places in the source code which emits `console.warn` logs to help identify issues,
and those will only work if `Tagify.logger.enabled` flag is set to `true`, before Tagify instances are created:

```js
Tagify.logger.enabled = true

var tagify = new Tagify(...)
```


## Features
* Can be applied to input & textarea elements
* Supports [mix content](#mixed-content) (text and tags together)
* Supports [single-value](#single-value) mode (like `<select>`)
* Supports whitelist/blacklist
* Customizable HTML templates for the different areas of the component (wrapper, tags, dropdown, dropdown item, dropdown header, dropdown footer)
* Shows suggestions list (flexiable settings & styling) at *full (component) width* or *next to* the typed texted (caret)
* Allows setting suggestions' [aliases](#example-for-a-suggestion-item-alias) for easier fuzzy-searching
* Auto-suggest input as-you-type with the ability to auto-complete
* Can paste in multiple values: `tag 1, tag 2, tag 3` or even newline-separated tags
* Tags can be created by Regex delimiter or by pressing the "Enter" key / focusing of the input
* Validate tags by Regex *pattern* or by function
* Tags may be [editable](#edit-tags) (double-click)
* <del>ARIA accessibility support</del>(Component too generic for any meaningful ARIA)
* Supports read-only mode to the whole component or per-tag
* Each tag can have any properties desired (class, data-whatever, readonly...)
* Automatically disallow duplicate tags (vis "settings" object)
* Has built-in CSS loader, if needed (Ex. <em>AJAX</em> whitelist pulling)
* Tags can be trimmed via `hellip` by giving `max-width` to the `tag` element in your `CSS`
* Easily change direction to RTL (via the SCSS file)
* <del>Internet Explorer - A polyfill script should be used: `tagify.polyfills.min.js` (in `/dist`)</del> ***(IE support has been dropped)***
* Many useful custom [events](#events)
* Original input/textarea element values kept in sync with Tagify

## Building the project
Simply run `gulp` in your terminal, from the project's path ([Gulp](https://gulpjs.com) should be installed first).

Source files are this path: `/src/`

Output files, which are automatically generated using Gulp, are in: `/dist/`

### Output files:

Filename                  | Info
------------------------- | -----------------------------------------------------------
`tagify.esm.js`           | ESM version. [see jsbin demo](https://jsbin.com/sulijap/edit?html,output)
`tagify.js`               | *unminified* UMD version, including its souremaps
`tagify.min.js`           | *minified* UMD version, including its souremaps. This is the **main** file the package exports.
`tagify.polyfills.min.js` | Used for old Internet Explorer browser support
`react.tagify.js`         | Wrapper-only for React. [Read more](#react)
`jQuery.tagify.min.js`    | jQuery wrapper - same as `tagify.min.js`. might be removed in the future.
`tagify.css`              |


## Adding tags dynamically
```javascript
var tagify = new Tagify(...);

tagify.addTags(["banana", "orange", "apple"])

// or add tags with pre-defined properties

tagify.addTags([{value:"banana", color:"yellow"}, {value:"apple", color:"red"}, {value:"watermelon", color:"green"}])
```

## Output value
There are two possible ways to get the value of the tags:

1. Access the tagify's instance's `value` prop: `tagify.value` (Array of tags)
2. Access the *original* input's value: `inputElm.value` (Stringified Array of tags)

The most common way is to simply listen to the `change` event on the *original input*

```javascript
var inputElm = document.querySelector,
    tagify = new Tagify (inputElm);

inputElm.addEventListener('change', onChange)

function onChange(e){
  // outputs a String
  console.log(e.target.value)
}

```

### [Modify original input value format](https://jsbin.com/paxijaj/edit?html,js,output)

Default format is a JSON string:<br>
`'[{"value":"cat"}, {"value":"dog"}]'`

I **recommend** keeping this because some situations might have values such as addresses (tags contain commas):<br>
`'[{"value":"Apt. 2A, Jacksonville, FL 39404"}, {"value":"Forrest Ray, 191-103 Integer Rd., Corona New Mexico"}]'`

Another example for complex tags state might be disabled tags, or ones with custom identifier *class*:<br>
*(tags can be clicked, so delevopers can choose to use this to disable/enable tags)*<br>
`'[{"value":"cat", "disabled":true}, {"value":"dog"}, {"value":"bird", "class":"color-green"}]'`

To change the format, assuming your tags have no commas and are fairly simple:

```js
var tagify = new Tagify(inputElm, {
  originalInputValueFormat: valuesArr => valuesArr.map(item => item.value).join(',')
})
```

**Output:**<br>
`"cat,dog"`


## Ajax whitelist
Dynamically-loaded suggestions list (*whitelist*) from the server (as the user types) is a frequent need to many.

Tagify comes with its own loading animation, which is a very lightweight CSS-only code, and the <em>loading</em>
state is controlled by the method `tagify.loading` which accepts `true` or `false` as arguments.

Below is a basic example using the `fetch` API. I advise aborting the last request on any input before starting a new request.

<details>
  <summary>Example:</summary>

```javascript
var input = document.querySelector('input'),
    tagify = new Tagify(input, {whitelist:[]}),
    controller; // for aborting the call

// listen to any keystrokes which modify tagify's input
tagify.on('input', onInput)

function onInput( e ){
  var value = e.detail.value
  tagify.whitelist = null // reset the whitelist

  // https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
  controller && controller.abort()
  controller = new AbortController()

  // show loading animation.
  tagify.loading(true)

  fetch('http://get_suggestions.com?value=' + value, {signal:controller.signal})
    .then(RES => RES.json())
    .then(function(newWhitelist){
      tagify.whitelist = newWhitelist // update whitelist Array in-place
      tagify.loading(false).dropdown.show(value) // render the suggestions dropdown
    })
}
```
</details>

## Persisted data

Sometimes the whitelist might be loaded asynchronously, and so any pre-filled value in the original input field
will be removed if the `enforceWhitelist` is set to `true`.

Tagify can automatically restore the last used `whitelist` by setting a ***unique id*** to the Tagify instance,
by using the *localstorage* to persist the `whitelist` & `value` data:

```js
var input = document.querySelector('input'),
    tagify = new Tagify(input, {
      id: 'test1',  // must be unique (per-tagify instance)
      enforceWhitelist: true,
    }),
```

## Edit tags
Tags that aren't `read-only` can be edited by double-clicking them (by default)
or by changing the `editTags` *setting* to `1`, making tags editable by single-clicking them.

The value is saved on `blur` or by pressing `enter` key. Pressing `Escape` will revert the change trigger `blur`.
<kbd>ctrl</kbd><kbd>z</kbd> will revert the change if an edited tag was marked as not valid (perhaps duplicate or blacklisted)

To prevent *all* tags from being allowed to be editable, set the `editTags` setting to `false` (or `null`).<br>
To do the same but for specific tag(s), set those tags' data with `editable` property set to `false`:

```html
<input value='[{"value":"foo", "editable":false}, {"value":"bar"}]'>
```


## Validations
For "regular" tags (not *mix-mode* or *select-mode*) the easiest way is to use the `pattern` setting and use a Regex, or
apply the `pattern` attribute directly on the `input` which will be "transformed" into a *Tagify* component (for vanilla code where the `input` tag is fully accessible to developers).

If the `pattern` setting does not meet your needs, use the [`validate` setting](#settings), which recieves a *tag data object* as an argument and should return `true` if validaiton is passing, or `false`/`string` of not.
A *string* may be returned as the reason of the validation failure so it would be printed as the `title` attribute of the invalid tag.

[Here's an example](https://jsbin.com/rojixul/edit?js,output) for async validation for an added tag. The idea is to listen to `"add"` event,
and when it fires, first set the tag to "loading" state, run an async call, and then set the *loading* state (of the tag) back to `false`.
If the custom async validation failed, call the `replaceTag` Tagify method and set the `__isValid` tag data property to the error string which will
be shown when hovering the tag.


Note - there is a setting to keep invalid tags ([`keepInvalidTags`](#settings))  and if it's set to `true`, the user can see the reason for the invalidation by
hovering the tag and see the browser's native tooltip via the `title` attribute:

```js
{
  empty      : "empty",
  exceed     : "number of tags exceeded",
  pattern    : "pattern mismatch",
  duplicate  : "already exists",
  notAllowed : "not allowed"
}
```

The texts for those (invalid tags) *titles* can be customized from the settings:

```js
new Tagify(inputElement, {
  texts: {
    duplicate: "Duplicates are not allowed"
  }
})
```

Or by directly manipulating the *Tagify* function *prototype*:

```js
Tagify.prototype.TEXTS = {...Tagify.prototype.TEXTS, {duplicate: "Duplicates are not allowed"}}
```

## Drag & Sort

To be able to sort tags by dragging, a 3rd-party script is needed.

I have made a very simple *drag & drop* (~`11kb` *unminified*) script which uses [HTML5 native API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) and
it is available to download via [NPM](https://www.npmjs.com/package/@yaireo/dragsort) or [Github](https://github.com/yairEO/dragsort)
but any other *drag & drop* script may work. I could not find on the whole internet a decent lightweight script.

### [Integration example](https://codepen.io/vsync/pen/jOqYOVJ):

```js
var tagify = new Tagify(inputElement)

// bind "DragSort" to Tagify's main element and tell
// it that all the items with the below "selector" are "draggable"
var dragsort = new DragSort(tagify.DOM.scope, {
    selector: '.'+tagify.settings.classNames.tag,
    callbacks: {
        dragEnd: onDragEnd
    }
})

// must update Tagify's value according to the re-ordered nodes in the DOM
function onDragEnd(elm){
    tagify.updateValueByDOMTags()
}
```


## DOM Templates
It's possible to control the templates for some of the HTML elements Tagify is using by
modifying the `settings.templates` Object with your own custom functions which **must return** an *HTML string*.

Available templates are: `wrapper`, `tag`, `dropdown`, `dropdownItem`, `dropdownContent`, `dropdownHeader`, `dropdownFooter` and the optional `dropdownItemNoMatch`
which is a special template for rendering a suggestion item (in the dropdown list) only if there were no matches found for the typed input, for example:

```js
// ...more tagify settings...
templates: {
  dropdownItemNoMatch: data =>
    `<div class='${tagify.settings.classNames.dropdownItem}' value="noMatch" tabindex="0" role="option">
        No suggestion found for: <strong>${data.value}</strong>
    </div>`
}
```

[View templates](https://github.com/yairEO/tagify/blob/master/src/parts/templates.js)

### Example of overriding the `tag` template:

Each template function is automatically binded with `this` pointing to the current *Tagify* instance.
It is imperative to preserve the class names and also the `this.getAttributes(tagData)` for proper functionality.

```js
new Tagify(inputElem, {
  templates: {
    tag(tagData, tagify){
      return `<tag title="${(tagData.title || tagData.value)}"
              contenteditable='false'
              spellcheck='false'
              tabIndex="${this.settings.a11y.focusableTags ? 0 : -1}"
              class="${this.settings.classNames.tag} ${tagData.class ? tagData.class : ""}"
              ${this.getAttributes(tagData)}>
      <x title='' class="${this.settings.classNames.tagX}" role='button' aria-label='remove tag'></x>
      <div>
          <span class="${this.settings.classNames.tagText}">${tagData[this.settings.tagTextProp] || tagData.value}</span>
      </div>
    </tag>`,

    dropdownFooter(suggestions){
      var hasMore = suggestions.length - this.settings.dropdown.maxItems;

      return hasMore > 0
        ? `<footer data-selector='tagify-suggestions-footer' class="${this.settings.classNames.dropdownFooter}">
            ${hasMore} more items. Refine your search.
          </footer>`
        : '';
    }
  }
})
```

## Suggestions list

<p align="center">
  <img src="/docs/suggestions-list.apng" alt='suggestions list dropdown'/>
</p>

The suggestions list is a *whitelist Array* of *Strings* or *Objects* which was set in the [settings](#settings) Object when the Tagify instance was created, and can be set later directly on the instance: `tagifyInstance.whitelist = ["tag1", "tag2", ...]`.

The suggestions dropdown will be appended to the document's `<body>` element and will be rendered by default in a position below (bottom of) the Tagify element.
Using the keyboard arrows up/down will highlight an option from the list, and hitting the Enter key to select.

It is possible to tweak the list dropdown via 2 settings:

 - `enabled` - this is a numeral value that tells Tagify when to show the suggestions dropdown, when a minimum of N characters were typed.
 - `maxItems` - Limits the number of items the suggestions list will render

```javascript
var input = document.querySelector('input'),
    tagify = new Tagify(input, {
        whitelist : ['aaa', 'aaab', 'aaabb', 'aaabc', 'aaabd', 'aaabe', 'aaac', 'aaacc'],
        dropdown : {
            classname     : "color-blue",
            enabled       : 0,              // show the dropdown immediately on focus
            maxItems      : 5,
            position      : "text",         // place the dropdown near the typed text
            closeOnSelect : false,          // keep the dropdown open after selecting a suggestion
            highlightFirst: true
        }
    });
```

<p align="center"><b>Will render</b></p>

```html
<div class="tagify__dropdown tagify__dropdown--text" style="left:993.5px; top:106.375px; width:616px;">
    <div class="tagify__dropdown__wrapper">
      <div class="tagify__dropdown__item tagify__dropdown__item--active" value="aaab">aaab</div>
      <div class="tagify__dropdown__item" value="aaabb">aaabb</div>
      <div class="tagify__dropdown__item" value="aaabc">aaabc</div>
      <div class="tagify__dropdown__item" value="aaabd">aaabd</div>
      <div class="tagify__dropdown__item" value="aaabe">aaabe</div>
    </div>
</div>
```

By default searching the suggestions is using [fuzzy-search](https://en.wikipedia.org/wiki/Approximate_string_matching) (see [settings](#settings)).

If you wish to assign *alias* to items (in your suggestion list), add the `searchBy` property to *whitelist* items you wish
to have an *alias* for.

In the below example, typing a part of a string which is included in the `searchBy` property, for example *`land midd"`* -
the suggested item which matches the value "Israel" will be rendered in the suggestions (dropdown) list.

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
    value    : 123456,
    nickname : "foo",
    email    : "foo@mail.com"
  },
  {
    value    : 987654,
    nickname : "bar",
    email    : "bar@mail.com"
  },
  ...more..
]
```

Modified `searchKeys` setting to also search in other keys:
```javascript
{
  dropdown: {
    searchKeys: ["nickname", "email"] //  fuzzy-search matching for those whitelist items' properties
  }
}
```

## Mixed-Content

[See demo here](https://yaireo.github.io/tagify/#section-mix)

This feature must be toggled using these [settings](#settings):

```js
{
  //  mixTagsInterpolator: ["{{", "}}"],  // optional: interpolation before & after string
  mode: 'mix',    // <--  Enable mixed-content
  pattern: /@|#/  // <--  Text starting with @ or # (if single, String can be used here instead of Regex)
}
```

When mixing text with tags, the original textarea (or input) element will have a value as follows:

    [[cartman]]⁠ and [[kyle]]⁠ do not know [[Homer simpson]]⁠

If the initial value of the textarea or input is formatted as the above example, Tagify will try to
automatically convert everything between `[[` & `]]` to a tag, if tag exists in the *whitelist*, so make
sure when the Tagify instance is initialized, that it has tags with the correct `value` property that match
the same values that appear between `[[` & `]]`.

Applying the setting `dropdown.position:"text"` is encouraged for mixed-content tags, because the suggestions list
weird when there is already a lot of content on multiple lines.

If a tag does not exist in the *whitelist*, it may be created by the user and all you should do is listen to the `add` event and update your local/remote state.

## Single-Value

Similar to native `<Select>` element, but allows typing text as value.

## React

See [**live demo**](https://codesandbox.io/s/tagify-react-wrapper-oempc) for React integration examples.
⚠️ Tagify is **not** a [controlled component](https://github.com/yairEO/tagify/issues/489#issuecomment-629316093).

A Tagify React component is exported from [`react.tagify.jsx`](https://github.com/yairEO/tagify/blob/master/src/react.tagify.jsx):

---
### Update regarding `onChange` prop:

I have changed how the `onChange` works internally within the Wrapper of Tagify
so as of *March 30, 2021* the `e` argument will include a `detail` parameter with the value as string.
There is no more `e.target`, and to access the original DOM input element, do this: `e.detail.tagify.DOM.originalInput`.

----

> Note: You will need to import Tagify's CSS also, either by JavaScript or by SCSS `@import` (which is preferable)
> Also note that you will need to use [*dart-sass*](https://www.npmjs.com/package/sass) and not *node-sass* in order to compile the file.

```javascript
import Tags from "@yaireo/tagify/dist/react.tagify" // React-wrapper file
import "@yaireo/tagify/dist/tagify.css" // Tagify CSS

// on tag add/edit/remove
const onChange = useCallback((e) => {
  console.log("CHANGED:"
    , e.detail.tagify.value // Array where each tag includes tagify's (needed) extra properties
    , e.detail.tagify.getCleanValue() // Same as above, without the extra properties
    , e.detail.value // a string representing the tags
  )
}, [])

const App = () => {
  return (
    <Tags
      tagifyRef={tagifyRef} // optional Ref object for the Tagify instance itself, to get access to  inner-methods
      settings={settings}  // tagify settings object
      defaultValue="a,b,c"
      {...tagifyProps}   // dynamic props such as "loading", "showDropdown:'abc'", "value"
      onChange={onChange}
    />
  )
})
```

To gain full access to Tagify's (instance) inner methods, A custom `ref` can be used:

```jsx
...
const tagifyRef = useRef()
...
<Tags tagifyRef={tagifyRef} ... />

// or mix-mode
<MixedTags
  settings={...}
  onChange={...}
  defaultValue={`This is a textarea which mixes text with [[{"value":"tags"}]].`}
/>
```

`<MixedTags>` component is a shorthand for `<Tags InputMode="textarea">`

#### Updating the component's state

The `settings` prop is **only used once** in the initialization process, please do not update it afterwards.

---
<details>
  <summary>📖 List of (React) props for the <code>&lt;Tags/&gt;</code> component</summary>


Prop                    | Type                      | Updatable | Info
----------------------- | ------------------------- |:---------:| -----------------------------------------------------------
settings                | <sub>Object</sub>         |           | See [*settings* section](#settings)
name                    | <sub>String</sub>         | ✔         | `<input>`'s element `name` attribute
value                   | <sub>String/Array</sub>   | ✔         | Initial value.
defaultValue            | <sub>String/Array</sub>   |           | Same as `value prop
placeholder             | <sub>String</sub>         | ✔         | placeholder text for the component
readOnly                | <sub>Boolean</sub>        | ✔         | Toggles `readonly` state. With capital `O`.
tagifyRef               | <sub>Object</sub>         |           | `useRef` hook refference for the component inner instance of vanilla *Tagify* (for methods access)
showDropdown            | <sub>Boolean/String</sub> | ✔         | if `true` shows the suggestions dropdown. if assigned a String, show the dropdown pre-filtered.
loading                 | <sub>Boolean</sub>        | ✔         | Toggles `loading` state for the whole component
whitelist               | <sub>Array</sub>          | ✔         | Sets the `whitelist` which is the basis for the suggestions dropdown & autocomplete
className               | <sub>String</sub>         |           | Component's optional class name to be added
InputMode               | <sub>String</sub>         |           | `"textarea"` will create a `<textarea>` (hidden) element instead of the default `<input>` and automatically make Tagify act as [*"mix mode"*](#mixed-content)
autoFocus               | <sub>Boolean</sub>        |           | Should the component have focus on mount. Must be unique, per-page.
children                | <sub>String/Array</sub>   |           | `value`/`defaultValue` props are prefered
onChange                | <sub>Function</sub>       |           | See [*events* section](#events)
onInput                 | <sub>Function</sub>       |           | See [*events* section](#events)
onAdd                   | <sub>Function</sub>       |           | See [*events* section](#events)
onRemove                | <sub>Function</sub>       |           | See [*events* section](#events)
onInvalid               | <sub>Function</sub>       |           | See [*events* section](#events)
onClick                 | <sub>Function</sub>       |           | See [*events* section](#events)
onKeydown               | <sub>Function</sub>       |           | See [*events* section](#events)
onFocus                 | <sub>Function</sub>       |           | See [*events* section](#events)
onBlur                  | <sub>Function</sub>       |           | See [*events* section](#events)
onEditInput             | <sub>Function</sub>       |           | See [*events* section](#events)
onEditBeforeUpdate      | <sub>Function</sub>       |           | See [*events* section](#events)
onEditUpdated           | <sub>Function</sub>       |           | See [*events* section](#events)
onEditStart             | <sub>Function</sub>       |           | See [*events* section](#events)
onEditKeydown           | <sub>Function</sub>       |           | See [*events* section](#events)
onDropdownShow          | <sub>Function</sub>       |           | See [*events* section](#events)
onDropdownHide          | <sub>Function</sub>       |           | See [*events* section](#events)
onDropdownSelect        | <sub>Function</sub>       |           | See [*events* section](#events)
onDropdownScroll        | <sub>Function</sub>       |           | See [*events* section](#events)
onDropdownNoMatch       | <sub>Function</sub>       |           | See [*events* section](#events)
onDropdownUpdated       | <sub>Function</sub>       |           | See [*events* section](#events)
</details>

---


## jQuery version

`jQuery.tagify.js`

A jQuery wrapper version is also available, but I advise not using it because it's basically the exact same as the "normal"
script (non-jqueryfied) and all the jQuery's wrapper does is allowing to chain the event listeners for ('add', 'remove', 'invalid')

```javascript
$('[name=tags]')
    .tagify()
    .on('add', function(e, tagData){
        console.log('added', ...tagData)  // data, index, and DOM node
    });
```

Accessing methods can be done via the [`.data('tagify')`](https://api.jquery.com/data):

```javascript
$('[name=tags]').tagify();
// get tags from the server (ajax) and add them:
$('[name=tags]').data('tagify').addTags('aaa, bbb, ccc')
````

## HTML input & textarea attributes

The below list of *attributes* affect *Tagify*.<br>
These can also be set by Tagify [settings](#settings) Object manually, and not *declerativly* (via attributes).

Attribute         | Example                                               | Info
----------------- | ----------------------------------------------------- | --------------------
[pattern](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern) | <pre lang=html>`<input pattern='^[A-Za-z_✲ ]{1,15}$'>`</pre>               | Tag Regex pattern which tag input is validated by.
[placeholder](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefplaceholder) | <pre lang=html>`<input placeholder='please type your tags'>`</pre>        | This attribute's value will be used as a constant placeholder, which is visible unless something is being typed.
readOnly          | <pre lang=html>`<input readOnly>`</pre> | No user-interaction (add/remove/edit) allowed.
autofocus         | <pre lang=html>`<input autofocus>`</pre> | Automatically focus the the Tagify component when the component is loaded
required          | <pre lang=html>`<input required>`</pre> | Adds a `required` attribute to the Tagify wrapper element. Does nothing more.



## Caveats
- `<input>` wrapped in a `<label>` doesn't work - [#1219](https://github.com/yairEO/tagify/issues/1219) and so Tagify internally sets the label's `for` attribute to an empty string, so clicking the Tagify component will not blur it and re-focus on the hidden input/textarea element Tagify is "connected" to

## FAQ
List of questions & scenarios which might come up during development with Tagify:

<details>
  <summary><strong>Dynamic whitelist</strong></summary>
The whitelist initial value is set like so:

```js
const tagify = new Tagify(tagNode, {
  whitelist: ["a", "b", "c"]
})
```

If changes to the whitelist are needed, they should be done like so:

**Incorrect:**

```js
tagify.settings.whitelist = ["foo", "bar"]
```

**Correct:**
```js
// set the whitelist directly on the instance and not on the "settings" property
tagify.whitelist = ["foo", "bar"]
```
</details>

---

<details>
  <summary><strong>tags/whitelist data structure</strong></summary>

Tagify does not accept just *any* kind of data structure.<br>
If a tag data is represented as an `Object`, it **must** contain a **unique** property `value`
which Tagify uses to check if a tag already exists, among other things, so make sure it is present.

**Incorrect:**

```javascript
[{ "id":1, "name":"foo bar" }]
```

**Correct:**

```javascript
[{ "id":1, "value": 1, "name":"foo bar" }]
```

```javascript
[{ "value":1, "name":"foo bar" }]
```

```javascript
[{ "value":"foo bar" }]
```

```javascript
// ad a simple array of Strings
["foo bar"]
```
</details>

---

<details>
  <summary><strong>Save changes (Ex. to a server)</strong></summary>

In framework-less projects, the developer should save the state of the Tagify component (somewhere), and
the question is:<br/>
**when should the state be saved?**
On every change made to *Tagify's* internal state (`tagify.value` via the `update()` method).<br>


```javascript
var tagify = new Tagify(...)

// listen to "change" events on the "original" input/textarea element
tagify.DOM.originalInput.addEventListener('change', onTagsChange)

// This example uses async/await but you can use Promises, of course, if you prefer.
async function onTagsChange(e){
  const {name, value} = e.target
  // "imaginary" async function "saveToServer" should get the field's name & value
  await saveToServer(name, value)
}
```

If you are using *React/Vue/Angular* or any "modern" framework, then you already know how to
attach "onChange" event listeners to your `<input>`/`<textarea>` elements, so the above is irrelevant.
</details>

----

<details>
  <summary><strong>Render tags in one single line</strong></summary>

Stopping tags from wrapping to new lines, add this to your `.tagify` *selector CSS Rule*:

```css
flex-wrap: nowrap;
````
</details>

----

<details>
  <summary><strong>Submit on `Enter` key</strong></summary>

Tagify internally has `state` property, per `Tagify` instance
and this may be useful for a variety of things when implementing a specific scenario.

```js
var tagify = new Tagify(...)
var formElm = document.forms[0]; // just an example

tagify.on('keydown', onTagifyKeyDown)

function onTagifyKeyDown(e){
  if( e.key == 'Enter' &&         // "enter" key pressed
      !tagify.state.inputText &&  // assuming user is not in the middle or adding a tag
      !tagify.state.editing       // user not editing a tag
    ){
    setTimeout(() => formElm.submit())  // put some buffer to make sure tagify has done with whatever, to be on the safe-side
  }

}
```
</details>

---

* [Double-click tag fires both "edit" & "click" custom events](https://github.com/yairEO/tagify/issues/247)
* [Manualy open the suggestions dropdown](https://github.com/yairEO/tagify/issues/254)
* [Render your own suggestions dropdown](https://github.com/yairEO/tagify/issues/244)
* [Allow max length on mix mode](https://github.com/yairEO/tagify/issues/252)
* [Always show dropdown](https://github.com/yairEO/tagify/issues/253)
* [Limit the length of a tag value (minimum & maximum)](https://github.com/yairEO/tagify/issues/245)
* [*Mixed mode* initial value](https://github.com/yairEO/tagify/issues/237)
* [Random colors for each tag](https://github.com/yairEO/tagify/issues/223)
* [Format input value for server side](https://github.com/yairEO/tagify/issues/220)
* [Writing to tagify textarea](https://github.com/yairEO/tagify/issues/294)
* [Scroll all tags within one line, instead of growing vertically](https://github.com/yairEO/tagify/issues/145)
* [Insert emoji at caret location when editing a tag](https://github.com/yairEO/tagify/issues/365)
* [propagate `change` event](https://github.com/yairEO/tagify/issues/413)
* [Manually update tag data after it was added](https://github.com/yairEO/tagify/issues/433)
* [Ajax Whitelist with "enforceWhitelist" setting enabled](https://github.com/yairEO/tagify/issues/465)
* [Custom (multiple) tag validation & AJAX](https://github.com/yairEO/tagify/issues/474)
* [Make tags from pasted multi-line text](https://github.com/yairEO/tagify/issues/160)
* [Add a tag at *caret* position in *mixed mode*](https://github.com/yairEO/tagify/issues/524#issuecomment-699140465)
* [Change automatic title tooltips for invalid tags](https://github.com/yairEO/tagify/issues/862)
* [Create a submenu for the suggestions dropdown](https://github.com/yairEO/tagify/issues/1016#issuecomment-1106910803)

## CSS Variables

> Learn more about [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)) (custom properties)

Tagify's utilizes *CSS variables* which allow easy customization without the need to manually write CSS.
If you do wish to heavily style your Tagify components, then you can (and should) use the below variables within
your modified styles as much as you can.

For a *live* example, see the [demos page](https://yaireo.github.io/tagify/#section-different-look).

Name                            | Info
------------------------------- | --------------------------------
--tags-disabled-bg              | Tag background color when *disabled*
--tags-border-color             | The outer border color which surrounds tagify
--tags-hover-border-color       | *hover* state
--tags-focus-border-color       | *focus* state
--tag-border-radius             | Tag border radius
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
--tag-remove-btn-color          | Remove (`×`) button text color
--tag-remove-btn-bg             | Remove (`×`) button background color
--tag-remove-btn-bg--hover      | Remove (`×`) button hover background color
--input-color                   | Input text color
--tag-hide-transition           | Controls the transition property when a tag is removed. default is '.3s'
--placeholder-color             | Placeholder text color
--placeholder-color-focus       | Placeholder text color when Tagify has focus and no input was typed
--loader-size                   | Loading animation size. `1em` is pretty big, default is a bit less.
--readonly-striped              | Either a value `1` or `0` can be used to toggle the striped diagonal background in *readonly*

### Suggestions Dropdown CSS variables

should be appiled on the `:root {...}` selector

Name                              | Info
--------------------------------- | --------------------------------
--tagify-dd-color-primary         | The suggestion's dropdown background color
--tagify-dd-bg-color              | Sugegstion's background color on hover
--tagify-dd-item--hidden-duration | When selecting a suggestion, this is the duration for it to become hidden (shrink)
--tagify-dd-item-pad              | Suggestion item padding
--tagify-dd-max-height            | Maximum height of the suggestions dropdown (`300px` by default)

### Full list of Tagify's [SCSS variables](https://github.com/yairEO/tagify/blob/master/src/tagify.scss#L9-L24)


## Methods

`Tagify` is [prototype](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_prototypes) based and There are many methods, but I've chosen to list the most relevant ones:

Name                       | Parameters                                                                              | Info
-------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------
`destroy`                  |                                                                                         | Reverts the input element back as it was before Tagify was applied
`removeAllTags`            |                                                                                         | Removes all tags and resets the original input tag's value property
`addTags`                  | <ol><li>`Array`/`String`/`Object` tag(s) to add</li><li>`Boolean` clear input after adding</li><li>`Boolean` - skip adding invalids</li><ol>  | Accepts a String (word, single or multiple with a delimiter), an Array of Objects (see above) or Strings.
`addMixTags`               | `Array`/`String`                                                                        | Bypasses the normalization process in `addTags`, forcefully adding tags at the last caret location or at the end, if there's no last caret location saved (at `tagify.state.selection`)
`removeTags`               | <ol><li>`Array`/`HTMLElement`/`String` tag(s) to remove</li><li>`silent` does not update the component's value</li><li>`tranDuration` Transition duration (in `ms`)</li></ul> | (#502) Remove single/multiple Tags. When nothing passed, removes last tag. <ul><li>`silent` - A flag, which when turned on, does not remove any value and does not update the original input value but simply removes the tag from tagify</li><li>`tranDuration` - delay for animation, after which the tag will be removed from the DOM</li></ul>
`addEmptyTag`              | `Object` <sub>(`tagData`)</sub>                                                         | Create an empty tag (optionally with pre-defined data) and enters "edit" mode directly. [See demo](https://yaireo.github.io/tagify#section-different-look)
`loadOriginalValues`       | `String`/`Array`                                                                        | Converts the input's value into tags. This method gets called automatically when instansiating Tagify. Also works for mixed-tags
`getWhitelistItemsByValue` | `Object`                                                                                | `{value}` - return an Array of found matching items (case-insensitive)
`getTagIndexByValue`       | `String`                                                                                | Returns the index of a specific tag, by value
`getTagElmByValue`         | `String`                                                                                | Returns the first matched tag node, if found
`isTagDuplicate`           | `String`                                                                                | Returns how many tags already exists with that value
`parseMixTags`             | `String`                                                                                | Converts a String argument (`[[foo]]⁠ and [[bar]]⁠ are..`) into HTML with mixed tags & texts
`getTagElms`               |                                                                                         | Returns a DOM nodes list of all the tags
`getTagElmByValue`         | `String`                                                                                | Returns a specific tag DOM node by value
`getSetTagData`            | `HTMLElement`, `Object`                                                                 | set/get tag data on a tag element (has`.tagify__tag` class by default)
`editTag`                  | `HTMLElement`                                                                           | Goes to edit-mode in a specific tag
`getTagTextNode`           | `HTMLElement`                                                                           | Get the node which has the actual tag's content
`setTagTextNode`           | `HTMLElement`, `String`                                                                 | Sets the text of a tag (DOM only, does not affect actual data)
`replaceTag`               | `tagElm`, `Object` <sub>(`tagData`)</sub>                                               | Exit a tag's edit-mode. if "tagData" exists, replace the tag element with new data and update Tagify value
`loading`                  | `Boolean`                                                                               | toggle loading state on/off (Ex. AJAX whitelist pulling)
`tagLoading`               | `HTMLElement`, `Boolean`                                                                | same as above but for a specific tag element
`createTagElem`            | `Object` <sub>(`tagData`)</sub>                                                         | Returns a tag element from the supplied tag data
`injectAtCaret`            | `HTMLElement` <sub>(`injectedNode`)</sub>, `Object` <sub>(`range`)</sub>                | Injects text or HTML node at last caret position. `range` parameter is *optional*
`placeCaretAfterNode`      | `HTMLElement`                                                             | Places the caret after a given node
`insertAfterTag`           | `HTMLElement` <sub>(tag element)</sub>, `HTMLElement`/`String` <sub>(whatever to insert after)</sub> |
`toggleClass`              | `Boolean`                                                                               | Toggles `class` on the main *tagify* container (`scope`)
`dropdown.selectAll`       |                                                                                         | Add **all** whitelist items as tags and close the suggestion dropdown
`dropdown.show`            | `String`                                                                                | Shows the sugegstions list dropdown. A string paramater allows filtering the results
`dropdown.hide`            | `Boolean`                                                                               | Hides the suggestions list dropdown (if it's not managed manually by the developer)
`dropdown.toggle`          | `Boolean`                                                                               | Toggles dropdown show/hide. the boolean parameter will force-show
`updateValueByDOMTags`     |                                                                                         | Iterate tag DOM nodes and re-build  the `tagify.value` array (call this if tags get sorted manually)
`parseTemplate`            | `String`/`Function` <sub>(template name or function)</sub>, `Array` <sub>(data)</sub>   | converts a template string (by selecting one from the `settings.templates` by name or supplying a template function which returns a String) into a DOM node
`setReadonly`              | `Boolean`                                                                               | Toggles "readonly" mode on/off
`setDisabled`              | `Boolean`                                                                               | Toggles "disabled" mode on/off
`getPersistedData`         | `String`                                                                                | Get data for the specific instance by parameter
`setPersistedData`         | `*`, `String`                                                                           | Set data for the specific instance. Must supply a second parameter which will be the key to save the data in the localstorage (under the tagify namespace)
`clearPersistedData`       | `String`                                                                                | Clears data for the specific instance, by parameter. If the parameter is ommited, clears all persisted data related to this instance (by its `id` which was set in the instance's settings)

## Events

To listen to `tagify` events use the `.on(EVENT_NAME, EVENT_CALLBACK_REFERENCE)` mehotd and stop listening use the `.off(EVENT_NAME, EVENT_CALLBACK_REFERENCE)`

All triggered events return the instance's scope (tagify).<br>
See `e.detail` for custom event additional data.

<details>
  <summary>Example 1</summary>

```javascript
var tagify = new Tagify(...)

// events can be chainable, and multiple events may be binded for the same callback
tagify
  .on('input', onInput)
  .on('edit:input edit:updated edit:start edit:keydown', e => console.log(e.type, e.detail))

function onInput(e) {
  console.log(e.detail)
}

// later in the code you might do to unsubscribe the event listener with a specific callback
tagify.off('input', onInput)
```
</details>

<details>
  <summary>Example 2</summary>

```javascript
var tagify = new Tagify(inputNode, {
  callbacks: {
    "change": (e) => console.log(e.detail),
    "dropdown:show": (e) => console.log(e.detail)
  }
})
```
</details>

Name               | Info
------------------ | --------------------------------------------------------------------------
change             | Any change to the value has occurred. `e.detail.value` callback listener argument is a *String*
add                | A tag has been added
remove             | A tag has been removed ([use `removeTag`](https://github.com/yairEO/tagify/issues/222) instead with *jQuery*)
invalid            | A tag has been added but did not pass validation. See [event detail](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events)
input              | [Input](https://developer.mozilla.org/en-US/docs/Web/Events/input) event, when a tag is being typed/edited. `e.detail` exposes `value`, `inputElm` & `isValid`
paste              | Text pasted (not while editing a tag). The pasted text might or might not have been converted into tags, depneding if `pasteAsTags` setting is set to `false`
click              | Clicking a tag. Exposes the tag element, its index & data
dblclick           | Double-clicking a tag
keydown            | When Tagify input has focus and a key was pressed
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
dropdown:noMatch   | No whitelist suggestion item matched for the typed input. At this point it is possible to manually set `tagify.suggestedListItems` to any possible custom value, for example: `[{ value:"default" }]`
dropdown:updated   | Fired when the dropdown list is re-filtered while suggestions list is visible and a tag was removed so it was re-added as a suggestion

## Hooks

**Promise**-based hooks for *async* program flow scenarios.

Allows to "hook" (intervene) at certain points of the program, which were selected as a suitable place to
**pause** the program flow and wait for further instructions on how/if to proceed.

<details>
  <summary>For example, if a developer wishes to add a (native) confirmation popup before a tag is removed (by a user action):
</summary>

```javascript
var input = document.querySelector('input')
var tagify = new Tagify(input,{
    hooks: {
        /**
         * Removes a tag
         * @param  {Array}  tags [Array of Objects [{node:..., data:...}, {...}, ...]]
         */
        beforeRemoveTag : function( tags ){
            return new Promise((resolve, reject) => {
                confirm("Remove " + tags[0].data.value + "?")
                    ? resolve()
                    : reject()
            })
        }
    }
})
```
</details>


Name                   | Parameters                                  | Info
---------------------- | ------------------------------------------- | --------------------------------------------------------------------------
beforeRemoveTag        | Array <sub>(of Objects)</sub>               | [Example](https://jsbin.com/xoseyux/edit?html,js,output)
suggestionClick        | Object <sub>(click event data)</sub>        | [Example](https://jsbin.com/tuwihuf/edit?html,js,output)
beforePaste            | `tagify`, `pastedText`, `clipboardData`     | Before pasted text was added to Tagify. *Resolve* with new paste value if needed
beforeKeyDown          |                                             | On any browser keydown event, but called after `keydown` Tagify event

## [Settings](https://github.com/yairEO/tagify/blob/master/src/parts/defaults.js#L1)

Name                           | Type                         | Default                                     | Info
------------------------------ | ---------------------------- | ------------------------------------------- | --------------------------------------------------------------------------
id                             | <sub>String</sub>            |                                             | See [*Persisted data*](https://github.com/yairEO/tagify/#persisted-data)
tagTextProp                    | <sub>String</sub>            | `"value"`                                   | Tag data Object property which will be displayed as the tag's text. Remember to keep "value" property <em>unique</em>. See Also: `dropdown.mapValueTo`, `dropdown.searchKeys`
placeholder                    | <sub>String</sub>            |                                             | Placeholder text. If this attribute is set on an input/textarea element it will override this setting
delimiters                     | <sub>String</sub>            | `","`                                       | [RegEx **string**] split tags by any of these delimiters. Example delimeters: ",&#124;.&#124; " (*comma*, *dot* or *whitespace*)
pattern                        | <sub>String/RegEx</sub>      | null                                        | Validate input by RegEx pattern (can also be applied on the input itself as an attribute) Ex: `/[1-9]/`
mode                           | <sub>String</sub>            | null                                        | Use `select` for single-value dropdown-like select box. See `mix` as value to allow mixed-content. The 'pattern' setting must be set to some character.
mixTagsInterpolator            | <sub>Array</sub>             | <sub>`['[[', ']]']`</sub>                   | Interpolation for mix mode. Everything between these will become a tag
mixTagsAllowedAfter            | <sub>RegEx</sub>             | <sub>`/,\|\.\|\:\|\s/`</sub>                | Define conditions in which typed mix-tags content is allowing a tag to be created after.
duplicates                     | <sub>Boolean</sub>           | false                                       | Should duplicate tags be allowed or not
trim                           | <sub>Boolean</sub>           | true                                        | If `true` trim the tag's value (remove before/after whitespaces)
enforceWhitelist               | <sub>Boolean</sub>           | false                                       | Should ONLY use tags allowed in whitelist.<br>In `mix-mode`, setting it  to `false` will not allow creating new tags.
userInput                      | <sub>Boolean</sub>           | true                                        | Disable manually typing/pasting/editing tags (tags may only be added from the whitelist). Can also use the `disabled` attribute on the original input element.
autoComplete.enabled           | <sub>Boolean</sub>           | true                                        | Tries to suggest the input's value while typing (match from whitelist) by adding the rest of term as grayed-out text
autoComplete.rightKey          | <sub>Boolean</sub>           | false                                       | If `true`, when `→` is pressed, use the suggested value to create a tag, else just auto-completes the input. In mixed-mode this is ignored and treated as "true"
autoComplete.tabKey            | <sub>Boolean</sub>           | false                                       | If `true`, pressing `tab` key would only auto-complete (if a suggesiton is highlighted) but will not convert to a tag (like `rightKey` does) also, unless clicked again (considering the `addTagOn` setting).
whitelist                      | <sub>Array</sub>             | `[]`                                        | An array of allowed tags (*Strings* or *Objects*). When using *Objects* in the *whitelist* array a `value` property is a must & should be unique. <br/>Also, the *whitelist used for auto-completion when `autoCompletion.enabled` is `true`
blacklist                      | <sub>Array</sub>             | `[]`                                        | An array of tags which aren't allowed
addTagOnBlur                   | <sub>Boolean</sub>           | true                                        | Automatically adds the text which was inputed as a tag when blur event happens
addTagOn                       | <sub>Array</sub>             | `['blur', 'tab', 'enter']`                  | If the tagify field (in a normal mode) has any non-tag input in it, convert it to a tag on any of these "events": blur away from the field, click "tab"/"enter" key
onChangeAfterBlur              | <sub>Boolean</sub>           | true                                        | By default, the native way of inputs' `onChange` events is kept, and it only fires when the field is blured.
pasteAsTags                    | <sub>Boolean</sub>           | true                                        | Automatically converts pasted text into tags
callbacks                      | <sub>Object</sub>            | `{}`                                        | Exposed callbacks object to be triggered on events: `'add'` / `'remove'` tags
maxTags                        | <sub>Number</sub>            | Infinity                                    | Maximum number of allowed tags. when reached, adds a class "tagify--hasMaxTags" to `<Tags>`
editTags                       | <sub>Object/Number</sub>     | `{}`                                        | `false` or `null` will disallow editing
editTags.*clicks*              | <sub>Number</sub>            | 2                                           | Number of clicks to enter "edit-mode": 1 for single click. Any other value is considered as double-click
editTags.*keepInvalid*         | <sub>Boolean</sub>           | true                                        | keeps invalid edits as-is until `esc` is pressed while in focus
templates                      | <sub>Object</sub>            | <sub>`wrapper`, `tag`, `dropdownItem`</sub> | Object consisting of functions which return template strings
validate                       | <sub>Function</sub>          |                                             | If the `pattern` setting does not meet your needs, use this function, which receives *tag data object* as an argument and should return `true` if validation passed or `false`/`string` if not. A *string* may be returned as the reason for the validation failure.
transformTag                   | <sub>Function</sub>          |                                             | Takes a tag data as argument and allows mutating it before a tag is created or edited and also before validation.<br>Should not `return` anything, only **mutate** the argument.
keepInvalidTags                | <sub>Boolean</sub>           | false                                       | If `true`, do not remove tags which did not pass validation
createInvalidTags              | <sub>Boolean</sub>           | true                                        | If `true`, create invalid-tags. Otherwise, keep the editable input and do not create tags from it
skipInvalid                    | <sub>Boolean</sub>           | false                                       | If `true`, do not add invalid, temporary, tags before automatically removing them
backspace                      | <sub>*</sub>                 | true                                        | On pressing backspace key:<br> `true` - remove last tag <br>`edit` - edit last tag<br>`false` - do nothing (useful for outside style)
originalInputValueFormat       | <sub>Function</sub>          |                                             | If you wish your original input/textarea `value` property format to other than the default (which I recommend keeping) you may use this and make sure it returns a *string*.
mixMode.*insertAfterTag*       | <sub>Node/String</sub>       | `\u00A0`                                    | `node` or `string` to add after a tag added |
a11y.*focusableTags*           | <sub>Boolean</sub>           | false                                       | allows tags to get focus, and also to be deleted via <kbd>Backspace</kbd>
dropdown.*enabled*             | <sub>Number</sub>            | 2                                           | Minimum characters input for showing a suggestions list. `false` will not render a suggestions list.
dropdown.*caseSensitive*       | <sub>Boolean</sub>           | false                                       | if `true`, match **exact** item when a suggestion is selected (from the dropdown) and also more strict matching for dulpicate items. **Ensure** `fuzzySearch` is `false` for this to work.
dropdown.*maxItems*            | <sub>Number</sub>            | 10                                          | Maximum items to show in the suggestions list
dropdown.*classname*           | <sub>String</sub>            | `""`                                        | Custom *classname* for the dropdown suggestions list
dropdown.*fuzzySearch*         | <sub>Boolean</sub>           | true                                        | Enables filtering dropdown items values' by string *containing* and not only *beginning*
dropdown.*sortby*              | <sub>String/Function</sub>   |                                             | If set as `startsWith` string, the suggestions list will be sorted with matched items which starts with the query shown first, and *exact* matches shown before all.<br><br> If this setting is defined as a `function`, it recieves two arguments: the array of filtered items and the query and it must return an Array.<br><br>(*default sorting order is same as the whitelist's*)
dropdown.*accentedSearch*      | <sub>Boolean</sub>           | true                                        | Enable searching for <em>accented</em> items in the whitelist without typing exact match (#491)
dropdown.*includeSelectedTags* | <sub>Boolean</sub>           | false                                       | Should the suggestions list Include already-selected tags (after filtering)
dropdown.*escapeHTML*          | <sub>Boolean</sub>           | true                                        | Escapes HTML entities in the suggestions' rendered text
dropdown.*position*            | <sub>String</sub>            | `"all"`                                     | <ul><li>`manual` - will not render the dropdown, and you would need to do it yourself. [See demo](https://yaireo.github.io/tagify/#section-manual-suggestions)</li><li>`text` - places the dropdown next to the caret</li><li>`input` - places the dropdown next to the input (useful in rare situations)</li><li>`all` - normal, full-width design</li></ul>
dropdown.*RTL*                 | <sub>Boolean</sub>           | false                                       | Dictates the dropdown's horizontal starting position. By default it would be aligned with the left side of the *Tagify* component.
dropdown.*highlightFirst*      | <sub>Boolean</sub>           | false                                       | When a suggestions list is shown, highlight the first item, and also suggest it in the input (The suggestion can be accepted with <kbd>→</kbd> key)
dropdown.*closeOnSelect*       | <sub>Boolean</sub>           | true                                        | close the dropdown after selecting an item, if `enabled:0` is set (which means always show dropdown on focus)
dropdown.*clearOnSelect*       | <sub>Boolean</sub>           | true                                        | Keep typed text after selecting a suggestion
dropdown.*mapValueTo*          | <sub>Function/String</sub>   |                                             | If whitelist is an Array of Objects:<br>Ex. `[{value:'foo', email:'foo@a.com'},...]`)<br> this setting controlls which data <em>key</em> will be printed in the dropdown.<br> Ex.1: `mapValueTo: data => "To:" + data.email`<br>Ex.2: `mapValueTo: "email"`
dropdown.*searchKeys*          | <sub>Array</sub>             | <sub>`["value", "searchBy"]`</sub>          | When a user types something and trying to match the whitelist items for suggestions, this setting allows matching other keys of a whitelist objects
dropdown.*appendTarget*        | <sub>HTMLNode/Function</sub> | `document.body`                             | Target-Node which the *suggestions dropdown* is appended to (*only when rendered*). If used as a function, should return a DOM node.
dropdown.*placeAbove*          | <sub>Boolean</sub>           |                                             | If defined, will force the placement of the dropdown in respect to the Boolean value: `true` will always show the suggestions dropdown above the input field and `false` will always show it below. By default this setting it not defined and the placement of the dropdown is automatically decided according to the space availble, where opening it *below* the input is preferred.
