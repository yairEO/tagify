Tagify - lightweight jQuery input "tags" plugin
========

Want to simply convert an input field into a tags element, in a easy customizable way,
with good performance and smallest code footprint? You are in the right place my friend.

### Why jQuery and not just plain JS?

Becuase I think jQuery is king and not using it will result in just creating, with time, the same
library of functions. it is a standard, it lightweight, much more readable than the W3C code,
and produces less code. You might think differently, and you are welcome to use other shitty plugins that
are double the size, have difficult-to-read codebase and are just a pathetic attemp at coding.
I've created this plugin in 2 hours, after seeing what the internet had to offer. It was sad.

##[Demo page](http://codepen.io/vsync/pen/LRAyak)

### Selling points
* JS file is under 150 very readiable lines of code
* JS weights less than ~5kb
* SCSS file is ~2kb of highly readable and flexible code
* No other inputs are used beside the original, and its value is kept in sync
* Can paste in multiple values ("tag 1, tag 2, tag 3")
* Tags can be created by commas or by pressing the "Enter" key
* Easily customized

### Basic usage

Lets say this is your markup, and you already have a value set on the input (which was pre-filled by data from the server):

```html
<input name='tags' placeholder='write some tags' value='foo, bar,buzz'>
<textarea name='tags' placeholder='write some tags'>foo, bar,buzz</textarea>
```

what you need to do to convert that nice input into "tags" is simply select your input/textarea and run `tagify()`:

```javascript
$('[name=tags]').tagify()
```

Now markup be like:

```html
<tags>
    <tag title="click to remove" class="noAnim">foo</tag>
    <tag title="click to remove" class="noAnim">bar</tag>
    <tag title="click to remove" class="noAnim">buzz</tag>
    <div><span class="placeholder" contenteditable="">write some tags</span></div>
    <input name="tags" placeholder="write some tags" value="foo, bar,buzz">
</tags>
```

Don't forget to actually include the script & css files in your code  :)

