Tagify - lightweight input "tags" script
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

Want to simply convert an input field into a tags element, in a easy customizable way,
with good performance and smallest code footprint? You are in the right place my friend.

## [Demo page](https://yaireo.github.io/tagify/)

## Selling points
* supports whitelist (with native suggestions dropdown as-you-type)
* supports blacklists
* JS file is under 150 very readiable lines of code
* JS weights less than ~5kb
* SCSS file is ~2kb of highly readable and flexible code
* No other inputs are used beside the original, and its value is kept in sync
* Can paste in multiple values ("tag 1, tag 2, tag 3")
* Automatically disallow duplicate tags (vis "settings" object)
* Tags can be created by commas *or* by pressing the "Enter" key
* Tags can be trimmed via `hellip` by giving `max-width` to the `tag` element in your `CSS`
* Easily customized
* Exposed custom events


## building the project
Simply run `gulp` in your terminal, from the project's path (Gulp should be installed first)


## Basic usage
Lets say this is your markup, and you already have a value set on the input (which was pre-filled by data from the server):

```html
<input name='tags' placeholder='write some tags' value='foo, bar,buzz'>
<textarea name='tags' placeholder='write some tags'>foo, bar,buzz</textarea>
```

what you need to do to convert that nice input into "tags" is simply select your input/textarea and run `tagify()`:

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

// listen to custom tags' events such as 'add' or 'remove'
tagify1.on('remove', ()=>{
    console.log(e, e.detail);
});
```

### jQuery plugin version (jQuery.tagify.js)

```javascript
$('[name=tags]')
    .tagify()
    .on('add', function(e, tagName){
        console.log('added', tagName)
    });
```

Now markup be like:

```html
<tags>
    <tag>
        <x></x>
        <div><span title="css">css</span></div>
    </tag>
    <tag>
        <x></x>
        <div><span title="html">html</span></div>
    </tag>
    <tag>
        <x></x>
        <div><span title="javascript">javascript</span></div>
    </tag>
    <div>
        <input list="tagsSuggestions3l9nbieyr" class="input placeholder">
        <datalist id="tagsSuggestions3l9nbieyr">
            <label> select from the list:
                <select>
                    <option value=""></option>
                    <option>foo</option>
                    <option>bar</option>
                </select>
            </label>
        </datalist><span>write some tags</span>
    </div>
    <input name="tags" placeholder="write some tags" value="foo, bar,buzz">
</tags>
```

## Methods

Name            | Info
--------------- | --------------------------------------------------------------------------
destroy         | if called, will revert the input back as it was before Tagify was applied
removeAllTags   | removes all tags and rests the original input tag's value property


## Exposed events

Name            | Info
--------------- | --------------------------------------------------------------------------
add             | A tag has been added
remove          | A tag has been removed
duplicate       | A tag has been added and found to be a duplicate of existing one
maxTagsExceed   | Number of tags exceeds the allowed quantity and the exceed tags were denied (removed)
blacklisted     | A tag which is in the blacklist has been added and denied (removed)
notWhitelisted  | A tag which is not in the whitelist has been added and denied (removed)



## Settings

Name                | Type       | Default     | Info
------------------- | ---------- | ----------- | --------------------------------------------------------------------------
delimiters          | String     | ","         | [regex] split tags by any of these delimiters. Example: Space or Coma - ", "
pattern             | String     | ""          | Validate the input by REGEX pattern (can also be applied on the input itself as an attribute)
duplicates          | Boolean    | false       | (flag) should duplicate tags be allowed or not
enforeWhitelist     | Boolean    | false       | should ONLY use tags allowed in whitelist
autocomplete        | Boolean    | true        | show native suggeestions list, as you type
whitelist           | Array      | []          | an array of tags which only they are allowed
blacklist           | Array      | []          | an array of tags which aren't allowed
callbacks           | Object     | {}          | exposed callbacks object to be triggered on events: 'add' / 'remove' tags
maxTags             | Number     | Infinity    | max number of tags
suggestionsMinChars | Number     | 2           | minimum characters to input which shows the sugegstions list


