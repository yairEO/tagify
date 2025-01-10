import {ZERO_WIDTH_CHAR} from './constants'

export const logger = {
    isEnabled() { return window.TAGIFY_DEBUG ?? true},
    log(...args){ this.isEnabled() && console.log('[Tagify]:', ...args) },
    warn(...args) { this.isEnabled() && console.warn('[Tagify]:', ...args) }
}

// console.json = console.json || function(argument){
//     for(var arg=0; arg < arguments.length; ++arg)
//         console.log(  JSON.stringify(arguments[arg], null, 4)  )
// }

// const isEdge = /Edge/.test(navigator.userAgent)
export const sameStr = (s1, s2, caseSensitive, trim) => {
    // cast to String
    s1 = ""+s1;
    s2 = ""+s2;

    if( trim ){
        s1 = s1.trim()
        s2 = s2.trim()
    }

    return caseSensitive
        ? s1 == s2
        : s1.toLowerCase() == s2.toLowerCase()
}


// const getUID = () => (new Date().getTime() + Math.floor((Math.random()*10000)+1)).toString(16)
export const removeCollectionProp = (collection, unwantedProps) => collection && Array.isArray(collection) && collection.map(v => omit(v, unwantedProps))

export function omit(obj, props){
    var newObj = {}, p;
    for( p in obj )
        if( props.indexOf(p) < 0 )
            newObj[p] = obj[p]
    return newObj
}

export function decode( s ) {
    var el = document.createElement('div');
    return s.replace(/\&#?[0-9a-z]+;/gi, function(enc){
        el.innerHTML = enc;
        return el.innerText
    })
}

/**
 * utility method
 * https://stackoverflow.com/a/35385518/104380
 * @param  {String} s [HTML string]
 * @return {Object}   [DOM node]
 */
export function parseHTML( s ){
    var parser = new DOMParser(),
        node   = parser.parseFromString(s.trim(), "text/html");

    return node.body.firstElementChild;
}

/**
 * Removed new lines and irrelevant spaces which might affect layout, and are better gone
 * @param {string} s [HTML string]
 */
export function minify( s ){
    return s ? s
        .replace(/\>[\r\n ]+\</g, "><")
        .split(/>\s+</).join('><').trim()
        : ""
}

export function removeTextChildNodes( elm ){
    var iter = document.createNodeIterator(elm, NodeFilter.SHOW_TEXT, null, false),
        textnode;

    // print all text nodes
    while (textnode = iter.nextNode()){
        if( !textnode.textContent.trim() )
            textnode.parentNode.removeChild(textnode)
    }
}

export function getfirstTextNode( elm, action ){
    action = action || 'previous';
    while ( elm = elm[action + 'Sibling'] )
        if( elm.nodeType == 3 )
            return elm
}

/**
 * utility method
 * https://stackoverflow.com/a/6234804/104380
 */
export function escapeHTML( s ){
    return typeof s == 'string' ? s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/`|'/g, "&#039;")
        : s;
}

/**
 * Checks if an argument is a javascript Object
 */
export function isObject(obj) {
    var type = Object.prototype.toString.call(obj).split(' ')[1].slice(0, -1);
    return obj === Object(obj) && type != 'Array' && type != 'Function' && type != 'RegExp' && type != 'HTMLUnknownElement';
}

/**
 * merge objects into a single new one
 * TEST: extend({}, {a:{foo:1}, b:[]}, {a:{bar:2}, b:[1], c:()=>{}})
 */
export function extend( o, o1, o2) {
    if( !(o instanceof Object) ) o = {};

    copy(o, o1);
    if( o2 )
        copy(o, o2)

    function copy(a,b){
        // copy o2 to o
        for( var key in b )
            if( b.hasOwnProperty(key) ){
                if( isObject(b[key]) ){
                    if( !isObject(a[key]) )
                        a[key] = Object.assign({}, b[key])
                    else
                        copy(a[key], b[key])

                    continue;
                }

                if( Array.isArray(b[key]) ){
                    a[key] = Object.assign([], b[key])
                    continue
                }

                a[key] = b[key]
            }
    }

    return o
}

/**
 * concatenates N arrays without dups.
 * If an array's item is an Object, compare by `value`
 */
export function concatWithoutDups(){
    const newArr = [],
        existingObj = {};

    for( let arr of arguments ) {
        for( let item of arr ) {
            // if current item is an object which has yet to be added to the new array
            if( isObject(item) ){
                if( !existingObj[item.value] ){
                    newArr.push(item)
                    existingObj[item.value] = 1
                }
            }

            // if current item is not an object and is not in the new array
            else if( !newArr.includes(item) )
                newArr.push(item)
        }
    }

    return newArr
}

/**
 *  Extracted from: https://stackoverflow.com/a/37511463/104380
 * @param {String} s
 */
export function unaccent( s ){
    // if not supported, do not continue.
    // developers should use a polyfill:
    // https://github.com/walling/unorm
    if( !String.prototype.normalize )
        return s

    if (typeof(s) === 'string')
        return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

/**
 * Meassures an element's height, which might yet have been added DOM
 * https://stackoverflow.com/q/5944038/104380
 * @param {DOM} node
 */
export function getNodeHeight( node ){
    var height, clone = node.cloneNode(true)
    clone.style.cssText = "position:fixed; top:-9999px; opacity:0"
    document.body.appendChild(clone)
    height = clone.clientHeight
    clone.parentNode.removeChild(clone)
    return height
}

export var isChromeAndroidBrowser = () => /(?=.*chrome)(?=.*android)/i.test(navigator.userAgent)

export function getUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

export function isNodeTag(node){
    return isNodeBelongsToThisTagifyInstance.call(this, node) && node?.classList?.contains(this.settings.classNames.tag)
}

export function isWithinNodeTag(node){
    return isNodeBelongsToThisTagifyInstance.call(this, node) && node?.closest(this.settings.classNames.tagSelector)
}

function isNodeBelongsToThisTagifyInstance(node) {
    let closestTagifyNode = node?.closest?.(this.settings.classNames.namespaceSelector)
    return closestTagifyNode === this.DOM.scope
}

/**
* Get the caret position relative to the viewport
* https://stackoverflow.com/q/58985076/104380
*
* @returns {object} left, top distance in pixels
*/
export function getCaretGlobalPosition(){
   const sel = document.getSelection()

   if( sel.rangeCount ){
       const r = sel.getRangeAt(0)
       const node = r.startContainer
       const offset = r.startOffset
       let rect,  r2;

       if (offset > 0) {
           r2 = document.createRange()
           r2.setStart(node, offset - 1)
           r2.setEnd(node, offset)
           rect = r2.getBoundingClientRect()
           return {left:rect.right, top:rect.top, bottom:rect.bottom}
       }

       if( node.getBoundingClientRect )
           return node.getBoundingClientRect()
   }

   return {left:-9999, top:-9999}
}

/**
 * Injects content (either string or node) at the current the current (or specificed) caret position
 * @param {content} string/node
 * @param {range} Object (optional, a range other than the current window selection)
 */
export function injectAtCaret(content, range){
    var selection = window.getSelection();
    range = range || selection.getRangeAt(0)

    if( typeof content == 'string' )
        content = document.createTextNode(content)

    if( range ) {
        range.deleteContents()
        range.insertNode(content)
    }

    return content
}

/** Setter/Getter
 * Each tag DOM node contains a custom property called "__tagifyTagData" which hosts its data
 * @param {Node}   tagElm
 * @param {Object} data
 */
export function getSetTagData(tagElm, data, override){
    if( !tagElm ){
        logger.warn("tag element doesn't exist",{tagElm, data})
        return data
    }

    if( data )
        tagElm.__tagifyTagData = override
            ? data
            : extend({}, tagElm.__tagifyTagData || {}, data)

    return tagElm.__tagifyTagData
}

export function placeCaretAfterNode( node ){
    if( !node || !node.parentNode ) return

    var nextSibling = node,
        sel = window.getSelection(),
        range = sel.getRangeAt(0);

    if (sel.rangeCount) {
        range.setStartAfter(nextSibling);
        range.collapse(true)
        // range.setEndBefore(nextSibling || node);
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

/**
 * iterate all tags, checking if multiple ones are close-siblings and if so, add a zero-space width character between them,
 * which forces the caret to be rendered when the selection is between tags.
 * Also do that if the tag is the first node.
 * @param {Array} tags
 */
export function fixCaretBetweenTags(tags, TagifyHasFocuse) {
    tags.forEach(tag => {
        if( getSetTagData(tag.previousSibling) || !tag.previousSibling ) {
            var textNode = document.createTextNode(ZERO_WIDTH_CHAR)
            tag.before(textNode)
            TagifyHasFocuse && placeCaretAfterNode(textNode)
        }
    })
}

