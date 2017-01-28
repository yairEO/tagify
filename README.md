Tagify - lightweight input "tags" script
========

Want to simply convert an input field into a tags element, in a easy customizable way,
with good performance and smallest code footprint? You are in the right place my friend.

##[Demo page](https://yaireo.github.io/tagify/)

### Selling points
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


### building the project
Simply run `gulp` in your terminal, from the project's path.


### Basic usage
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
tagify = new Tagify( input, {duplicates:true} );

// when using jQuery plugin version file `jQuery.tagify.js`
$('[name=tags]').tagify()
```

Now markup be like:

```html
<tags>
    <tag title="click to remove" class="tagify--noAnim">foo</tag>
    <tag title="click to remove" class="tagify--noAnim">bar</tag>
    <tag title="click to remove" class="tagify--noAnim">buzz</tag>
    <div><span class="placeholder" contenteditable="">write some tags</span></div>
    <input name="tags" placeholder="write some tags" value="foo, bar,buzz">
</tags>
```

### Settings

Name          | Type       | Default     | Info
------------- | ---------- | ----------- | --------------------------------------------------------------------------
duplicates    | Boolean    | false       | (flag) should duplicate tags be allowed or not
whitelist     | Array      | []          | an array of tags which only they are allowed
blacklist     | Array      | []          | an array of tags which aren't allowed
