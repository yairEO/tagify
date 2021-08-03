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
        .replace(/(<.*?>)|\s+/g, (m, $1) => $1 ? $1 : ' ') // https://stackoverflow.com/a/44841484/104380
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