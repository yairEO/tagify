// console.json = console.json || function(argument){
//     for(var arg=0; arg < arguments.length; ++arg)
//         console.log(  JSON.stringify(arguments[arg], null, 4)  )
// }


// const isEdge = /Edge/.test(navigator.userAgent)
export const sameStr = (s1, s2, caseSensitive) => caseSensitive
    ? s1 == s2
    : (""+s1).toLowerCase() == (""+s2).toLowerCase()


// const getUID = () => (new Date().getTime() + Math.floor((Math.random()*10000)+1)).toString(16)
export const removeCollectionProp = (collection, unwantedProps) => collection.map(v => {
    var props = {}
    for( var p in v )
        if( unwantedProps.indexOf(p) < 0 )
            props[p] = v[p]
    return props
})

/**
 * Checks if an argument is a javascript Object
 */
export function isObject(obj) {
    var type = Object.prototype.toString.call(obj).split(' ')[1].slice(0, -1);
    return obj === Object(obj) && type != 'Array' && type != 'Function' && type != 'RegExp' && type != 'HTMLUnknownElement';
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

/**
 * utility method
 * https://stackoverflow.com/a/6234804/104380
 */
export function escapeHTML( s ){
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/`|'/g, "&#039;")
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
                        a[key] = Object.assign({}, b[key]);
                    else
                        copy(a[key], b[key])
                }
                else
                    a[key] = b[key];
            }
    }

    return o;
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