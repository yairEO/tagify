Tagify - lightweight jQuery input "tags" plugin 
========

Want to simlpy convert an input field into a tags element, in a easy customizable way,
with good performance and smallest code footprint? You are in the right place my friend.

##[Demo page](http://codepen.io/vsync/pen/LRAyak)

### Basic usage

Lets say this is your markup, and you already have a value set on the input (which was pre-filled by data from the server):

```html
<input name='tags' placeholder='write some tags' value='foo, bar,buzz'>
```

what you need to do to convert that nice input into "tags" is simply select your input and run `tagify()`:

```javascript
$('input[name=tags]').tagify()
```

Don't forget to actually include in your code the script & css files :)

