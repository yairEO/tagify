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

![alt tag](https://raw.githubusercontent.com/yairEO/tagify/master/demo.gif)

Transforms an input field or a textarea into a *Tags* component, in an easy, customizable way,
with great performance and tiny code footprint.

## [Documentation & Demos](https://yaireo.github.io/tagify)

## Selling points
* JS at `~13kb` (`4kb` GZIP) (less than *900* easily understandable lines of code)
* SCSS file is `~6kb` of well-crafted flexible code
* Easily change direction to RTL via the SCSS file only
* No other inputs are used beside the original, and its value is kept in sync
* Easily customized
* Exposed custom events (add, remove, invalid)
* For Internet Explorer 11 include the script `tagify.polyfills.js` under `/dist`

## What can Tagify do
* Can be applied on input & textarea elements
* Supports whitelist
* Supports blacklists
* Shows suggestions selectbox (flexiable settings & styling)
* Auto-complete input as-you-type (whitelist first match)
* Can paste in multiple values: `tag 1, tag 2, tag 3`
* Tags can be created by Regex delimiter or by pressing the "Enter" key / focusing of the input
* Validate tags by Regex pattern
* Supports read-only mode to the whole componenet or per-tag
* Each tag can have any properties desired (class, data-whatever, readonly...)
* Automatically disallow duplicate tags (vis "settings" object)
* Tags can be trimmed via `hellip` by giving `max-width` to the `tag` element in your `CSS`


## Building the project
Simply run `gulp` in your terminal, from the project's path ([Gulp](https://gulpjs.com) should be installed first).

Source files are this path: `/src/`

Output files, which are automatically generated using Gulp, are in: `/dist/`

The rest of the files are most likely irrelevant.

## Basic usage
Lets say this is your markup, and you already have a value set on the input (which was pre-filled by data from the server):

```html
<input name='tags' placeholder='write some tags' value='foo, bar,buzz'>
<textarea name='tags' pattern=".{3,}" placeholder='write some tags'>foo, bar,buzz</textarea>
```

What you need to do to convert that nice input into "tags" is simply select your input/textarea and run `tagify()`:

```javascript
// vanilla component
var input = document.querySelector('input[name=tags]'),
    tagify = new Tagify( input );

// with settings passed
tagify = new Tagify( input, {
    duplicates: true,
    whitelist: ['foo', 'bar'],
    callbacks: {
        add : onAddTag // calls an imaginary "onAddTag" function when a tag is added
    }
});

// listen to custom tags' events such as 'add' or 'remove' (see full list below).
// listeners are chainable
tagify.on('remove', onTagRemoved)
      .on('add', onTagAdded);
      .on('invalid', onInvaildTag)

function onTagRemoved(e){
    console.log(e, e.detail);
    // remove listener after first tag removal
    tagify.off('remove', onTagRemoved);
}

function onTagAdded(e){
    // do whatever
}

function onInvaildTag(e){
    // e.detail ...
}
```

The value of the Tagify component can be accessed like so:

```javascript
var tagify = new Tagify(...);

console.log( tagify.value )
// [{"value":"tag1"}, {"value":"tag2"}, ...]

// the original input's value is a String of Array items
console.log( input.value )
// "["tag1", "tag2", ...]"
```

If the Tags were added with custom properties, the *value* output might look something like this:

```javascript
tagify.value
// [{ "value":"tag1", "class":"red", "id":1}, ...]
```


### Tags with properties ([example](https://yaireo.github.io/tagify#section-extra-properties))

The below example will populate the Tags component with 2 tags, each with specific attributes & values.
the `addTags` method accepts an Array of Objects with **any** key/value, as long as the `value` key is defined.

```html
<input placeholder="add tags">
```

```javascript
var allowedTags = [
    {
        "value"   : "apple",
        "data-id" : 3,
        "class"   : 'color-green'
    },
    {
        "value"    : "orange",
        "data-id"  : 56,
        "class"    : 'color-orange'
    },
    {
        "value"    : "passion fruit",
        "data-id"  : 17,
        "class"    : 'color-purple'
    },
    {
        "value"    : "banana",
        "data-id"  : 12,
        "class"    : 'color-yellow'
    },
    {
        "value"    : "paprika",
        "data-id"  : 25,
        "class"    : 'color-red'
    }
];

var input = document.querySelector('input'),
    tagify = new Tagify(input, {
        whitelist : allowedTags,
        mapValueToProp : "data-id"
    });

// Add the first 2 tags from the "allowedTags" Array
tagify.addTags( allowedTags.slice(0,2) )
```

The above will prepend a "tags" element before the original input element:

```html
<tags class="tagify">
    <tag readonly="true" class="color-red" data-id="8" value="strawberry">
        <x></x><div><span title="strawberry">strawberry</span></div>
    </tag>
    <tag readonly="true" class="color-darkblue" data-id="6" value="blueberry">
        <x></x><div><span title="blueberry">blueberry</span></div>
    </tag>
    <div contenteditable data-placeholder="add tags" class="tagify--input"></div>
</tags>
<input placeholder="add tags">
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


### jQuery plugin version (jQuery.tagify.js)

```javascript
$('[name=tags]')
    .tagify()
    .on('add', function(e, tagName){
        console.log('added', tagName)
    });
```


## Methods

Name            | Info
--------------- | --------------------------------------------------------------------------
destroy         | Reverts the input element back as it was before Tagify was applied
removeAllTags   | Removes all tags and resets the original input tag's value property
addTags         | Accepts a String (word, single or multiple with a delimiter) or an Array of Objects (see above)
removeTag       | Removes a specific tag (argument is the tag DOM element to be removed. see source code.)


## Exposed events

Name            | Info
--------------- | --------------------------------------------------------------------------
add             | A tag has been added
remove          | A tag has been removed
invalid         | A tag has been added but did not pass vaildation. See [event detail](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events)


## Settings

Name                  | Type       | Default     | Info
----------------------| ---------- | ----------- | --------------------------------------------------------------------------
delimiters            | String     | ","         | [regex] split tags by any of these delimiters. Example: ",| |."
pattern               | String     | null        | Validate input by REGEX pattern (can also be applied on the input itself as an attribute) Ex: /[1-9]/
duplicates            | Boolean    | false       | (flag) Should duplicate tags be allowed or not
enforceWhitelist      | Boolean    | false       | Should ONLY use tags allowed in whitelist
autocomplete          | Boolean    | true        | Tries to autocomplete the input's value while typing (match from whitelist)
whitelist             | Array      | []          | An array of tags which only they are allowed
blacklist             | Array      | []          | An array of tags which aren't allowed
addTagOnBlur          | Boolean    | true        | Automatically adds the text which was inputed as a tag when blur event happens
callbacks             | Object     | {}          | Exposed callbacks object to be triggered on events: 'add' / 'remove' tags
maxTags               | Number     | Infinity    | Maximum number of tags
mapValueToProp        | String     | ""          | For tags with properties, where a certain property should be used as the "saved" value 
transformTag          | Function   | undefined   | Takes a tag input as argument and returns a transformed value
tagTemplate           | Function   | undefined   | Takes a tag's value and data as arguments and returns an HTML string for a tag element
dropdown.enabled      | Number     | 2           | Minimum characters to input to show the suggestions list. "false" to disable
dropdown.maxItems     | Number     | 10          | Maximum items to show in the suggestions list dropdown
dropdown.classname    | String     | ""          | Custom class name for the dropdown suggestions selectbox
dropdown.itemTemplate | Function   | ""          | Returns a custom string for each list item in the dropdown suggestions selectbox