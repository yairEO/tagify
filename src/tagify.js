// console.json = console.json || function(argument){
//     for(var arg=0; arg < arguments.length; ++arg)
//         console.log(  JSON.stringify(arguments[arg], null, 4)  )
// }

const isFirefox = typeof InstallTrigger !== 'undefined'
// const isEdge = /Edge/.test(navigator.userAgent)
const sameStr = (s1, s2) => s1.toLowerCase() == s2.toLowerCase()
// const getUID = () => (new Date().getTime() + Math.floor((Math.random()*10000)+1)).toString(16)
const removeCollectionProp = (collection, unwantedProps) => collection.map(v => {
    var props = {}
    for( var p in v )
        if( unwantedProps.indexOf(p) < 0 )
            props[p] = v[p]
    return props
})

/**
 * Checks if an argument is a javascript Object
 */
function isObject(obj) {
    var type = Object.prototype.toString.call(obj).split(' ')[1].slice(0, -1);
    return obj === Object(obj) && type != 'Array' && type != 'Function' && type != 'RegExp' && type != 'HTMLUnknownElement';
}

function decode( s ) {
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
function parseHTML( s ){
    var parser = new DOMParser(),
        node   = parser.parseFromString(s.trim(), "text/html");

    return node.body.firstElementChild;
}

/**
 * Removed new lines and irrelevant spaces which might affect layout, and are better gone
 * @param {string} s [HTML string]
 */
function minify( s ){
    return s ? s
        .replace(/\>[\r\n ]+\</g, "><")
        .replace(/(<.*?>)|\s+/g, (m, $1) => $1 ? $1 : ' ') // https://stackoverflow.com/a/44841484/104380
        : ""
}


/**
 * utility method
 * https://stackoverflow.com/a/6234804/104380
 */
function escapeHTML( s ){
    return s.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/`|'/g, "&#039;")
}


/**
 * merge objects into a single new one
 * TEST: extend({}, {a:{foo:1}, b:[]}, {a:{bar:2}, b:[1], c:()=>{}})
 */
function extend( o, o1, o2) {
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
function unaccent( s ){
    // if not supported, do not continue.
    // developers should use a polyfill:
    // https://github.com/walling/unorm
    if( !String.prototype.normalize )
        return s

    if (typeof(s) === 'string')
        return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

}

// ☝☝☝ ALL THE ABOVE WILL BE MOVED INTO SEPARATE FILES ☝☝☝

/**
 * @constructor
 * @param {Object} input    DOM element
 * @param {Object} settings settings object
 */
function Tagify( input, settings ){
    if( input.previousElementSibling && input.previousElementSibling.classList.contains('tagify') ){
        console.warn('Tagify: ', 'input element is already Tagified', input)
        return this
    }

    // protection
    if( !input ){
        console.warn('Tagify: ', 'invalid input element ', input)
        return this
    }

    this.applySettings(input, settings||{})

    this.state = {
        editing : false,
        actions : {},   // UI actions for state-locking
        mixMode : {},
        dropdown: {},
        flaggedTags: {} // in mix-mode, when a string is detetced as potential tag, and the user has chocen to close the suggestions dropdown, keep the record of the tasg here
    }

    this.value = [] // tags' data

    // events' callbacks references will be stores here, so events could be unbinded
    this.listeners = {}

    this.DOM = {} // Store all relevant DOM elements in an Object
    extend(this, new this.EventDispatcher(this))
    this.build(input)
    this.getCSSVars()
    this.loadOriginalValues()

    this.events.customBinding.call(this);
    this.events.binding.call(this)
    input.autofocus && this.DOM.input.focus()
}

Tagify.prototype = {
    isIE : window.document.documentMode, // https://developer.mozilla.org/en-US/docs/Web/API/Document/compatMode#Browser_compatibility

    TEXTS : {
        empty      : "empty",
        exceed     : "number of tags exceeded",
        pattern    : "pattern mismatch",
        duplicate  : "already exists",
        notAllowed : "not allowed"
    },

    DEFAULTS : {
        delimiters          : ",",            // [RegEx] split tags by any of these delimiters ("null" to cancel) Example: ",| |."
        pattern             : null,           // RegEx pattern to validate input by. Ex: /[1-9]/
        maxTags             : Infinity,       // Maximum number of tags
        callbacks           : {},             // Exposed callbacks object to be triggered on certain events
        addTagOnBlur        : true,           // Flag - automatically adds the text which was inputed as a tag when blur event happens
        duplicates          : false,          // Flag - allow tuplicate tags
        whitelist           : [],             // Array of tags to suggest as the user types (can be used along with "enforceWhitelist" setting)
        blacklist           : [],             // A list of non-allowed tags
        enforceWhitelist    : false,          // Flag - Only allow tags allowed in whitelist
        keepInvalidTags     : false,          // Flag - if true, do not remove tags which did not pass validation
        mixTagsAllowedAfter : /,|\.|\:|\s/,   // RegEx - Define conditions in which mix-tags content allows a tag to be added after
        mixTagsInterpolator : ['[[', ']]'],   // Interpolation for mix mode. Everything between this will becmoe a tag
        backspace           : true,           // false / true / "edit"
        skipInvalid         : false,          // If `true`, do not add invalid, temporary, tags before automatically removing them
        editTags            : 2,              // 1 or 2 clicks to edit a tag. false/null for not allowing editing
        transformTag        : ()=>{},         // Takes a tag input string as argument and returns a transformed value

        autoComplete        : {
            enabled : true,                   // Tries to suggest the input's value while typing (match from whitelist) by adding the rest of term as grayed-out text
            rightKey: false,                  // If `true`, when Right key is pressed, use the suggested value to create a tag, else just auto-completes the input. in mixed-mode this is set to "true"
        },

        dropdown            : {
            classname     : '',
            enabled       : 2,      // minimum input characters needs to be typed for the suggestions dropdown to show
            maxItems      : 10,
            searchKeys    : [],
            fuzzySearch   : true,
            accentedSearch: true,
            highlightFirst: false,  // highlights first-matched item in the list
            closeOnSelect : true,   // closes the dropdown after selecting an item, if `enabled:0` (which means always show dropdown)
            position      : 'all'   // 'manual' / 'text' / 'all'
        },

        hooks : {
            beforeRemoveTag: () => Promise.resolve(),
            suggestionClick: () => Promise.resolve()
        }
    },

    // Using ARIA & role attributes
    // https://www.w3.org/TR/wai-aria-practices/examples/combobox/aria1.1pattern/listbox-combo.html
    templates : {
        /**
         *
         * @param {DOM Object} input     Original input DOm element
         * @param {Object}     settings  Tagify instance settings Object
         */
        wrapper(input, settings){
            return `<tags class="tagify ${settings.mode ? "tagify--" + settings.mode : ""} ${input.className}"
                        ${settings.readonly ? 'readonly' : ''}
                        ${settings.required ? "required" : ""}
                        tabIndex="-1">
                <span ${!settings.readonly || settings.mode != 'mix' ? 'contenteditable' : ''} data-placeholder="${settings.placeholder || '&#8203;'}" aria-placeholder="${settings.placeholder || ''}"
                    class="tagify__input"
                    role="textbox"
                    aria-autocomplete="both"
                    aria-multiline="${settings.mode=='mix'?true:false}"></span>
            </tags>`
        },

        tag(value, tagData){
            return `<tag title="${(tagData.title || value)}"
                        contenteditable='false'
                        spellcheck='false'
                        tabIndex="-1"
                        class="tagify__tag ${tagData.class ? tagData.class : ""}"
                        ${this.getAttributes(tagData)}>
                <x title='' class='tagify__tag__removeBtn' role='button' aria-label='remove tag'></x>
                <div>
                    <span class='tagify__tag-text'>${value}</span>
                </div>
            </tag>`
        },

        dropdown(settings){
            var _s = settings.dropdown,
                className = `${_s.position == 'manual' ? "" : `tagify__dropdown tagify__dropdown--${_s.position}`} ${_s.classname}`.trim();

            return `<div class="${className}" role="listbox" aria-labelledby="dropdown">
                        <div class="tagify__dropdown__wrapper"></div>
                    </div>`
        },

        dropdownItem( item ){
            return `<div ${this.getAttributes(item)}
                        class='tagify__dropdown__item ${item.class ? item.class : ""}'
                        tabindex="0"
                        role="option">${item.value}</div>`
        }
    },

    customEventsList : ['add', 'remove', 'invalid', 'input', 'click', 'keydown', 'focus', 'blur', 'edit:input', 'edit:updated', 'edit:start', 'edit:keydown', 'dropdown:show', 'dropdown:hide', 'dropdown:select'],

    applySettings( input, settings ){
        this.DEFAULTS.templates = this.templates;

        this.settings = extend({}, this.DEFAULTS, settings);
        this.settings.readonly = input.hasAttribute('readonly') // if "readonly" do not include an "input" element inside the Tags component
        this.settings.placeholder = input.getAttribute('placeholder') || this.settings.placeholder || ""
        this.settings.required = input.hasAttribute('required')

        if( this.isIE )
            this.settings.autoComplete = false; // IE goes crazy if this isn't false

        ["whitelist", "blacklist"].forEach(name => {
            var attrVal = input.getAttribute('data-' + name)
            if( attrVal ){
                attrVal = attrVal.split(this.settings.delimiters)
                if( attrVal instanceof Array )
                    this.settings[name] = attrVal
            }
        })

        // backward-compatibility for old version of "autoComplete" setting:
        if( "autoComplete" in settings && !isObject(settings.autoComplete) ){
            this.settings.autoComplete = this.DEFAULTS.autoComplete
            this.settings.autoComplete.enabled = settings.autoComplete
        }

        if( input.pattern )
            try { this.settings.pattern = new RegExp(input.pattern)  }
            catch(e){}

        // Convert the "delimiters" setting into a REGEX object
        if( this.settings.delimiters ){
            try { this.settings.delimiters = new RegExp(this.settings.delimiters, "g") }
            catch(e){}
        }

        // make sure the dropdown will be shown on "focus" and not only after typing something (in "select" mode)
        if( this.settings.mode == 'select' )
            this.settings.dropdown.enabled = 0

        if( this.settings.mode == 'mix' )
            this.settings.autoComplete.rightKey = true
    },

    /**
     * Returns a string of HTML element attributes
     * @param {Object} data [Tag data]
     */
    getAttributes( data ){
        // only items which are objects have properties which can be used as attributes
        if( Object.prototype.toString.call(data) != "[object Object]" )
            return '';

        var keys = Object.keys(data),
            s = "", propName, i;

        for( i=keys.length; i--; ){
            propName = keys[i];
            if( propName != 'class' && data.hasOwnProperty(propName) && data[propName] )
                s += " " + propName + (data[propName] ? `="${data[propName]}"` : "");
        }
        return s;
    },

    /**
     * Get the caret position relative to the viewport
     * https://stackoverflow.com/q/58985076/104380
     *
     * @returns {object} left, top distance in pixels
     */
    getCaretGlobalPosition(){
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

            return node.getBoundingClientRect()
        }

        return {left:-9999, top:-9999}
    },

    /**
     * Get specific CSS variables which are relevant to this script and parse them as needed.
     * The result is saved on the instance in "this.CSSVars"
     */
    getCSSVars(){
        var compStyle = getComputedStyle(this.DOM.scope, null)

        const getProp = name => compStyle.getPropertyValue('--'+name)

        function seprateUnitFromValue(a){
            if( !a ) return {}
            a = a.trim().split(' ')[0]
            var unit  = a.split(/\d+/g).filter(n=>n).pop().trim(),
                value = +a.split(unit).filter(n=>n)[0].trim()
            return {value, unit}
        }

        this.CSSVars = {
            tagHideTransition: (({value, unit}) => unit=='s' ? value * 1000 : value)(seprateUnitFromValue(getProp('tag-hide-transition')))
        }
    },

    /**
     * builds the HTML of this component
     * @param  {Object} input [DOM element which would be "transformed" into "Tags"]
     */
    build( input ){
        var DOM  = this.DOM,
            template = this.settings.templates.wrapper(input, this.settings)

        DOM.originalInput = input
        DOM.scope = parseHTML(template)
        DOM.input = DOM.scope.querySelector('.tagify__input')
        input.parentNode.insertBefore(DOM.scope, input)

        if( this.settings.dropdown.enabled >= 0 ){
            this.dropdown.init.call(this)
        }
    },

    /**
     * revert any changes made by this component
     */
    destroy(){
        this.DOM.scope.parentNode.removeChild(this.DOM.scope)
        this.dropdown.hide.call(this, true)
        clearTimeout(this.dropdownHide__bindEventsTimeout)
    },

    /**
     * if the original input had any values, add them as tags
     */
    loadOriginalValues( value ){
        value = value || this.DOM.originalInput.value

        if( value ){
            this.removeAllTags()

            if( this.settings.mode == 'mix' )
                this.parseMixTags(value.trim())

            else{
                try{
                    if( typeof JSON.parse(value) !== 'string' )
                        value = JSON.parse(value)
                }
                catch(err){}
                this.addTags(value).forEach(tag => tag && tag.classList.add('tagify--noAnim'))
            }
        }

        else
            this.postUpdate()

        this.state.lastOriginalValueReported = this.DOM.originalInput.value
        this.state.loadedOriginalValues = true
    },

    cloneEvent(e){
        var clonedEvent = {}
        for( var v in e )
            clonedEvent[v] = e[v]
        return clonedEvent
    },

    /**
     * A constructor for exposing events to the outside
     */
    EventDispatcher( instance ){
        // Create a DOM EventTarget object
        var target = document.createTextNode('')

        function addRemove(op, events, cb){
            if( cb )
                events.split(/\s+/g).forEach(name => target[op + 'EventListener'].call(target, name, cb))
        }

        // Pass EventTarget interface calls to DOM EventTarget object
        this.off = function(events, cb){
            addRemove('remove', events, cb)
            return this
        };

        this.on = function(events, cb){
            if(cb && typeof cb == 'function')
                addRemove('add', events, cb)
            return this
        };

        this.trigger = function(eventName, data){
            var e;
            if( !eventName ) return;

            if( instance.settings.isJQueryPlugin ){
                if( eventName == 'remove' ) eventName = 'removeTag' // issue #222
                jQuery(instance.DOM.originalInput).triggerHandler(eventName, [data])
            }
            else{
                try {
                    var eventData =  extend({}, data)
                    eventData.tagify = this
                    e = new CustomEvent(eventName, {"detail":eventData})
                }
                catch(err){ console.warn(err) }
                target.dispatchEvent(e);
            }
        }
    },

    /**
     * Toogle global loading state on/off
     * Useful when fetching async whitelist while user is typing
     * @param {Boolean} isLoading
     */
    loading( isLoading ){
        this.state.isLoading = isLoading
        // IE11 doesn't support toggle with second parameter
        this.DOM.scope.classList[isLoading?"add":"remove"]('tagify--loading')
        return this
    },

    /**
     * Toogle specieif tag loading state on/off
     * @param {Boolean} isLoading
     */
    tagLoading( tagElm, isLoading ){
        if( tagElm )
            // IE11 doesn't support toggle with second parameter
            tagElm.classList[isLoading?"add":"remove"]('tagify__tag--loading')
        return this
    },

    toggleFocusClass( force ){
        this.DOM.scope.classList.toggle('tagify--focus', !!force)
    },

    triggerChangeEvent(){
        var inputElm = this.DOM.originalInput,
            changed = this.state.lastOriginalValueReported !== inputElm.value,
            event = new CustomEvent("change", {bubbles: true}); // must use "CustomEvent" and not "Event" to support IE

        if( !changed ) return;

        // must apply this BEFORE triggering the simulated event
        this.state.lastOriginalValueReported = inputElm.value

        // React hack: https://github.com/facebook/react/issues/11488
        event.simulated = true
        if (inputElm._valueTracker)
            inputElm._valueTracker.setValue(Math.random())

        inputElm.dispatchEvent(event)

        // React, for some reason, clears the input's value after "dispatchEvent" is fired
        inputElm.value = this.state.lastOriginalValueReported
    },

    /**
     * DOM events listeners binding
     */
    events : {
        // bind custom events which were passed in the settings
        customBinding(){
            this.customEventsList.forEach(name => {
                this.on(name, this.settings.callbacks[name])
            })
        },

        binding( bindUnbind = true ){
            var _CB = this.events.callbacks,
                _CBR,
                action = bindUnbind ? 'addEventListener' : 'removeEventListener';

            // do not allow the main events to be bound more than once
            if( this.state.mainEvents && bindUnbind )
                return;

            // set the binding state of the main events, so they will not be bound more than once
            this.state.mainEvents = bindUnbind;

            // everything inside gets executed only once-per instance
            if( bindUnbind && !this.listeners.main ){
                // this event should never be unbinded:
                // IE cannot register "input" events on contenteditable elements, so the "keydown" should be used instead..
                this.DOM.input.addEventListener(this.isIE ? "keydown" : "input", _CB[this.isIE ? "onInputIE" : "onInput"].bind(this));

                if( this.settings.isJQueryPlugin )
                    jQuery(this.DOM.originalInput).on('tagify.removeAllTags', this.removeAllTags.bind(this))
            }

            // setup callback references so events could be removed later
            _CBR = (this.listeners.main = this.listeners.main || {
                focus    : ['input', _CB.onFocusBlur.bind(this)],
                blur     : ['input', _CB.onFocusBlur.bind(this)],
                keydown  : ['input', _CB.onKeydown.bind(this)],
                click    : ['scope', _CB.onClickScope.bind(this)],
                dblclick : ['scope', _CB.onDoubleClickScope.bind(this)],
                paste    : ['input', _CB.onPaste.bind(this)]
            })

            for( var eventName in _CBR ){
                // make sure the focus/blur event is always regesitered (and never more than once)
                if( eventName == 'blur' && !bindUnbind ) continue;

                this.DOM[_CBR[eventName][0]][action](eventName, _CBR[eventName][1]);
            }
        },

        /**
         * DOM events callbacks
         */
        callbacks : {
            onFocusBlur(e){
                var text = e.target ? e.target.textContent.trim() : '', // a string
                    _s = this.settings,
                    type = e.type,
                    ddEnabled = _s.dropdown.enabled >= 0,
                    eventData = {relatedTarget:e.relatedTarget},
                    isTargetTag = e.relatedTarget && e.relatedTarget.classList.contains('tagify__tag') && this.DOM.scope.contains(e.relatedTarget),
                    isTargetSelectOption = this.state.actions.selectOption && (ddEnabled || !_s.dropdown.closeOnSelect),
                    isTargetAddNewBtn = this.state.actions.addNew && ddEnabled,
                    selection = window.getSelection(),
                    shouldAddTags;

                // goes into this scenario only on input "blur" and a tag was clicked
                if( isTargetTag )
                    return

                if( type == 'blur' ){
                    if( e.relatedTarget === this.DOM.scope ){
                        this.dropdown.hide.call(this)
                        this.DOM.input.focus()
                        return
                    }

                    this.postUpdate()
                    this.triggerChangeEvent()
                }

                if( isTargetSelectOption || isTargetAddNewBtn )
                    return;

                this.state.hasFocus = type == "focus" ? +new Date() : false
                this.toggleFocusClass(this.state.hasFocus)

                if( _s.mode == 'mix' ){
                    if( type == "focus" ){
                        this.trigger("focus", eventData)
                    }

                    else if( e.type == "blur" ){
                        this.trigger("blur", eventData)
                        this.loading(false)
                        this.dropdown.hide.call(this)
                        // reset state which needs reseting
                        this.state.dropdown.visible = undefined

                        // save last selection place to be able to inject anything from outside to that specific place
                        this.state.selection = {
                            anchorOffset : selection.anchorOffset,
                            anchorNode: selection.anchorNode
                        }
                    }

                    return
                }


                if( type == "focus" ){
                    this.trigger("focus", eventData)
                    //  e.target.classList.remove('placeholder');
                    if( _s.dropdown.enabled === 0  ){  // && _s.mode != "select"
                        this.dropdown.show.call(this)
                    }
                    return
                }

                else if( type == "blur" ){
                    this.trigger("blur", eventData)
                    this.loading(false)

                    shouldAddTags = this.settings.mode == 'select'
                        ? !this.value.length || this.value[0].value != text
                        : text && !this.state.actions.selectOption && _s.addTagOnBlur

                    // do not add a tag if "selectOption" action was just fired (this means a tag was just added from the dropdown)
                    shouldAddTags && this.addTags(text, true)
                }


                this.DOM.input.removeAttribute('style')
                this.dropdown.hide.call(this)
            },

            onKeydown(e){
                var s = e.target.textContent.trim();

                this.trigger("keydown", {originalEvent:this.cloneEvent(e)})

                /**
                 * ONLY FOR MIX-MODE:
                 */
                if( this.settings.mode == 'mix' ){
                    switch( e.key ){
                        case 'Left' :
                        case 'ArrowLeft' : {
                            // when left arrow was pressed, raise a flag so when the dropdown is shown, right-arrow will be ignored
                            // because it seems likely the user wishes to use the arrows to move the caret
                            this.state.actions.ArrowLeft = true
                            break
                        }

                        case 'Delete':
                        case 'Backspace' : {
                            if( this.state.editing ) return

                            var selection = document.getSelection(),
                                deleteKeyTagDetected = e.key == 'Delete' && selection.anchorOffset == selection.anchorNode.length,
                                backspaceKeyTagDetected =  selection.anchorNode.nodeType == 1 || !selection.anchorOffset && selection.anchorNode.previousElementSibling,
                                lastInputValue = decode(this.DOM.input.innerHTML),
                                lastTagElems = this.getTagElms();

                            if( selection.anchorNode.nodeType == 3 &&   // node at caret location is a Text node
                                !selection.anchorNode.nodeValue    &&   // has some text
                                selection.anchorNode.previousElementSibling )  // text node has a Tag node before it
                                e.preventDefault()

                            // TODO: a better way to detect if nodes were deleted is simply check the "this.value" before & after
                            if( (backspaceKeyTagDetected || deleteKeyTagDetected) && !this.settings.backspace ){
                                e.preventDefault()
                                return
                            }


                            // if( isFirefox && selection && selection.anchorOffset == 0 )
                            //     this.removeTags(selection.anchorNode.previousSibling)

                            // a minimum delay is needed before the node actually gets ditached from the document (don't know why),
                            // to know exactly which tag was deleted. This is the easiest way of knowing besides using MutationObserver
                            setTimeout(()=>{
                                var currentValue = decode(this.DOM.input.innerHTML),
                                    // when there's a tag and a character after it, and user hits Backspace, the text will get deleted instanctly,
                                    // and because of the timeout, the code must understand a text was removed and a tag should NOT be removed, because
                                    // the caret was on textNode and not just after a tag element
                                    shoudlDeleteOnlyTag = selection.anchorNode == this.DOM.input && currentValue.length == lastInputValue.length;

                                // fixes #384, where the first and only tag will not get removed with backspace
                                if( ( shoudlDeleteOnlyTag || !selection.anchorOffset && currentValue.length >= lastInputValue.length) ){
                                    this.removeTags(selection.anchorNode.previousElementSibling)
                                    this.fixFirefoxLastTagNoCaret()

                                    // the above "removeTag" methods removes the tag with a transition. Chrome adds a <br> element for some reason at this stage
                                    if( this.DOM.input.children.length == 2 && this.DOM.input.children[1].tagName == "BR" ){
                                        this.DOM.input.innerHTML = ""
                                        this.value.length = 0
                                        return true
                                    }
                                }

                                // find out which tag(s) were deleted and trigger "remove" event
                                // iterate over the list of tags still in the document and then filter only those from the "this.value" collection
                                this.value = [].map.call(lastTagElems, (node, nodeIdx) => {
                                    var tagData = node.__tagifyTagData

                                    if( node.parentNode )
                                        return tagData
                                    else
                                        this.trigger('remove', { tag:node, index:nodeIdx, data:tagData })
                                })
                                .filter(n=>n)  // remove empty items in the mapped array
                            }, 50) // Firefox needs this higher duration for some reason or things get buggy when deleting text from the end
                            break;
                        }
                        // currently commented to allow new lines in mixed-mode
                        // case 'Enter' :
                        //     e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                    }

                    return true
                }

                switch( e.key ){
                    case 'Backspace' :
                        if( !this.state.dropdown.visible ){
                            if( s == "" || s.charCodeAt(0) == 8203 ){  // 8203: ZERO WIDTH SPACE unicode
                                if( this.settings.backspace === true )
                                    this.removeTags();
                                else if( this.settings.backspace == 'edit' )
                                    setTimeout(this.editTag.bind(this), 0) // timeout reason: when edited tag gets focused and the caret is placed at the end, the last character gets deletec (because of backspace)
                            }
                        }
                        break;

                    case 'Esc' :
                    case 'Escape' :
                        if( this.state.dropdown.visible ) return
                        e.target.blur()
                        break;

                    case 'Down' :
                    case 'ArrowDown' :
                        // if( this.settings.mode == 'select' ) // issue #333
                        if( !this.state.dropdown.visible )
                            this.dropdown.show.call(this)
                        break;

                    case 'ArrowRight' : {
                        let tagData = this.state.inputSuggestion || this.state.ddItemData
                        if( tagData && this.settings.autoComplete.rightKey ){
                            this.addTags([tagData], true)
                            return;
                        }
                        break
                    }
                    case 'Tab' : {
                        e.preventDefault()
                        if( !s || this.settings.mode == 'select' ) return true;
                    }

                    case 'Enter' :
                        if( this.state.dropdown.visible || e.keyCode == 229 ) return
                        e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                        // because the main "keydown" event is bound before the dropdown events, this will fire first and will not *yet*
                        // know if an option was just selected from the dropdown menu. If an option was selected,
                        // the dropdown events should handle adding the tag
                        setTimeout(()=>{
                            if( this.state.actions.selectOption )
                                return
                            this.addTags(s, true)
                        })
                }
            },

            onInput(e){
                var value = this.input.normalize.call(this),
                    showSuggestions = value.length >= this.settings.dropdown.enabled,
                    eventData = {value, inputElm:this.DOM.input};

                if( this.settings.mode == 'mix' )
                    return this.events.callbacks.onMixTagsInput.call(this, e);

                eventData.isValid = this.validateTag({value});
                this.trigger('input', eventData) // "input" event must be triggered at this point, before the dropdown is shown

                // for IE; since IE doesn't have an "input" event so "keyDown" is used instead to trigger the "onInput" callback,
                // and so many keys do not change the input, and for those do not continue.
                if( this.input.value == value ) return;

                // save the value on the input's State object
                this.input.set.call(this, value, false); // update the input with the normalized value and run validations
                // this.setRangeAtStartEnd(); // fix caret position


                if( value.search(this.settings.delimiters) != -1 ){
                    if( this.addTags( value ) ){
                        this.input.set.call(this); // clear the input field's value
                    }
                }
                else if( this.settings.dropdown.enabled >= 0 ){
                    this.dropdown[showSuggestions ? "show" : "hide"].call(this, value);
                }
            },

            onMixTagsInput( e ){
                var range, rangeText, match, matchedPatternCount, tag, showSuggestions, selection,
                    _s = this.settings,
                    lastTagsCount = this.value.length,
                    matchFlaggedTag,
                    tagsCount = this.getTagElms().length;

                // check if ANY tags were magically added through browser redo/undo
                if( tagsCount > lastTagsCount ){
                    this.value = [].map.call(this.getTagElms(), node => node.__tagifyTagData)
                    this.update({withoutChangeEvent:true})
                    return
                }

                if( this.hasMaxTags() )
                    return true

                if( window.getSelection ){
                    selection = window.getSelection()

                    // only detect tags if selection is inside a textNode (not somehow on already-existing tag)
                    if( selection.rangeCount > 0 && selection.anchorNode.nodeType == 3 ){
                        range = selection.getRangeAt(0).cloneRange()
                        range.collapse(true)
                        range.setStart(selection.focusNode, 0)

                        rangeText = range.toString().slice(0, range.endOffset)  // slice the range so everything AFTER the caret will be trimmed
                        // split = range.toString().split(_s.mixTagsAllowedAfter)  // ["foo", "bar", "@baz"]
                        matchedPatternCount = rangeText.split(_s.pattern).length - 1;

                        match = rangeText.match( _s.pattern )

                        if( match )
                            // tag string, example: "@aaa ccc"
                            tag = rangeText.slice( rangeText.lastIndexOf(match[match.length-1]) )

                        if( tag ){
                            this.state.actions.ArrowLeft = false // start fresh, assuming the user did not (yet) used any arrow to move the caret
                            this.state.tag = {
                                prefix : tag.match(_s.pattern)[0],
                                value  : tag.replace(_s.pattern, ''), // ret rid of the prefix
                            }
                            this.state.tag.baseOffset = selection.baseOffset - this.state.tag.value.length

                            showSuggestions = this.state.tag.value.length >= _s.dropdown.enabled

                            // When writeing something that might look like a tag (an email address) but isn't one - it is unwanted
                            // the suggestions dropdown be shown, so the user closes it (in any way), and while continue typing,
                            // dropdown should stay closed until another tag is typed.
                            // if( this.state.tag.value.length && this.state.dropdown.visible === false )
                            //     showSuggestions = false

                            // test for similar flagged tags to the current tag

                            try{
                                matchFlaggedTag = this.state.flaggedTags[this.state.tag.baseOffset]
                                matchFlaggedTag = matchFlaggedTag.prefix   == this.state.tag.prefix &&
                                                  matchFlaggedTag.value[0] == this.state.tag.value[0]


                                // reset
                                if( this.state.flaggedTags[this.state.tag.baseOffset] && !this.state.tag.value )
                                    delete this.state.flaggedTags[this.state.tag.baseOffset];
                            }
                            catch(err){}

                            // scenario: (do not show suggestions of previous matched tag, if more than 1 detected)
                            // (2 tags exist)                          " a@a.com and @"
                            // (second tag is removed by backspace)    " a@a.com and "
                            if( matchFlaggedTag || matchedPatternCount < this.state.mixMode.matchedPatternCount )
                                showSuggestions = false
                        }
                        // no (potential) tag found
                        else{
                            this.state.flaggedTags = {}
                        }

                        this.state.mixMode.matchedPatternCount = matchedPatternCount
                    }
                }


                // wait until the "this.value" has been updated (see "onKeydown" method for "mix-mode")
                // the dropdown must be shown only after this event has been driggered, so an implementer could
                // dynamically change the whitelist.
                setTimeout(()=>{
                    this.update({withoutChangeEvent:true})
                    this.trigger("input", extend({}, this.state.tag, {textContent:this.DOM.input.textContent}))

                    if( this.state.tag )
                        this.dropdown[showSuggestions ? "show" : "hide"].call(this, this.state.tag.value);
                }, 10)
            },

            onInputIE(e){
                var _this = this;
                // for the "e.target.textContent" to be changed, the browser requires a small delay
                setTimeout(function(){
                    _this.events.callbacks.onInput.call(_this, e)
                })
            },

            onClickScope(e){
                var tagElm = e.target.closest('.tagify__tag'),
                    _s = this.settings,
                    timeDiffFocus = +new Date() - this.state.hasFocus;

                if( e.target == this.DOM.scope ){
                    if( !this.state.hasFocus )
                        this.DOM.input.focus()
                    return
                }

                else if( e.target.classList.contains("tagify__tag__removeBtn") ){
                    this.removeTags( e.target.parentNode );
                    return
                }

                else if( tagElm ){
                    this.trigger("click", { tag:tagElm, index:this.getNodeIndex(tagElm), data:this.tagData(tagElm), originalEvent:this.cloneEvent(e) })

                    if( this.settings.editTags == 1 )
                        this.events.callbacks.onDoubleClickScope.call(this, e)

                    return
                }

                // when clicking on the input itself
                else if( e.target == this.DOM.input ){
                    if( _s.mode == 'mix' ){
                        // firefox won't show caret if last element is a tag (and not a textNode),
                        // so an empty textnode should be added
                        this.fixFirefoxLastTagNoCaret()
                    }

                    if( timeDiffFocus > 500 ){
                        if( this.state.dropdown.visible )
                            this.dropdown.hide.call(this)
                        else if( _s.dropdown.enabled === 0 && _s.mode != 'mix' )
                            this.dropdown.show.call(this)
                        return
                    }
                }

                if( _s.mode == 'select' )
                    !this.state.dropdown.visible && this.dropdown.show.call(this);
            },

            onPaste(e){
                var clipboardData, pastedData;

                e.preventDefault()

                // Get pasted data via clipboard API
                clipboardData = e.clipboardData || window.clipboardData
                pastedData = clipboardData.getData('Text')

                if( this.settings.mode == 'mix' )
                    this.injectAtCaret(pastedData, window.getSelection())
                else
                  this.addTags(pastedData)
                    // this.input.set.call(this, pastedData)
            },

            onEditTagInput( editableElm, e ){
                var tagElm = editableElm.closest('.tagify__tag'),
                    tagElmIdx = this.getNodeIndex(tagElm),
                    tagData = this.tagData(tagElm),
                    value = this.input.normalize.call(this, editableElm),
                    hasChanged = value != tagData.__originalData.value,
                    isValid = this.validateTag({value}); // the value could have been invalid in the first-place so make sure to re-validate it (via "addEmptyTag" method)

                // if the value is same as before-editing and the tag was valid before as well, ignore the  current "isValid" result, which is false-positive
                if( !hasChanged && editableElm.originalIsValid === true )
                    isValid = true

                tagElm.classList.toggle('tagify--invalid', isValid !== true)
                tagData.__isValid = isValid


                tagElm.title = isValid === true
                    ? tagData.title || tagData.value
                    : isValid // change the tag's title to indicate why is the tag invalid (if it's so)

                // show dropdown if typed text is equal or more than the "enabled" dropdown setting
                if( value.length >= this.settings.dropdown.enabled ){
                    this.state.editing.value = value
                    this.dropdown.show.call(this, value)
                }

                this.trigger("edit:input", {
                    tag          : tagElm,
                    index        : tagElmIdx,
                    data         : extend({}, this.value[tagElmIdx], {newValue:value}),
                    originalEvent: this.cloneEvent(e)
                })
            },

            onEditTagFocus( tagElm ){
                this.state.editing = {
                    scope: tagElm,
                    input: tagElm.querySelector("[contenteditable]")
                }
            },

            onEditTagBlur( editableElm ){
                this.state.editing = false;

                if( !this.state.hasFocus )
                    this.toggleFocusClass()

                // one scenario is when selecting a suggestion from the dropdown, when editing, and by selecting it
                // the "onEditTagDone" is called directly, already replacing the tag, so the argument "editableElm" node isn't in the DOM
                if( !this.DOM.scope.contains(editableElm) ) return;

                var tagElm       = editableElm.closest('.tagify__tag'),
                    currentValue = this.input.normalize.call(this, editableElm),
                    value        = currentValue,
                    newTagData   = extend({}, this.tagData(tagElm), {value}),
                    hasChanged   = value != newTagData.__originalData.value,
                    isValid      = this.validateTag(newTagData);

                //  this.DOM.input.focus()

                if( !currentValue ){
                    this.removeTags(tagElm)
                    this.onEditTagDone(null, newTagData)
                    return
                }

                if( hasChanged ){
                    this.settings.transformTag.call(this, newTagData)
                    // MUST re-validate after tag transformation
                    isValid = this.validateTag(newTagData)
                }
                else{
                    // if nothing changed revert back to how it was before editing
                    this.onEditTagDone(tagElm, newTagData.__originalData)
                    return
                }

                if( isValid !== true ){
                    this.trigger("invalid", {data:newTagData, tag:tagElm, message:isValid})
                    return;
                }

                // check if the new value is in the whiteilst, if not check if there
                // is any pre-invalidation data, and lastly resort to fresh emptty Object
                newTagData = this.getWhitelistItemsByValue(value) || newTagData.__preInvalidData || {}
                newTagData = Object.assign({}, newTagData, {value}) // clone it, not to mess with the whitelist
                //transform it again
                this.settings.transformTag.call(this, newTagData)

                this.onEditTagDone(tagElm, newTagData)
            },

            onEditTagkeydown(e, tagElm){
                this.trigger("edit:keydown", {originalEvent:this.cloneEvent(e)})
                switch( e.key ){
                    case 'Esc' :
                    case 'Escape' :
                        e.target.textContent = tagElm.__tagifyTagData.__originalData.value
                    case 'Enter' :
                    case 'Tab' :
                        e.preventDefault()
                        e.target.blur()
                }
            },

            onDoubleClickScope(e){
                var tagElm = e.target.closest('tag'),
                    _s = this.settings,
                    isEditingTag,
                    isReadyOnlyTag;

                if( !tagElm ) return

                isEditingTag = tagElm.classList.contains('tagify__tag--editable')
                isReadyOnlyTag = tagElm.hasAttribute('readonly')

                if( _s.mode != 'select' && !_s.readonly && !isEditingTag && !isReadyOnlyTag && this.settings.editTags )
                    this.editTag(tagElm)

                this.toggleFocusClass(true)
                this.trigger('dblclick', { tag:tagElm, index:this.getNodeIndex(tagElm), data:this.tagData(tagElm) })
            }
        }
    },

    fixFirefoxLastTagNoCaret(){
        var inputElm = this.DOM.input

        if( isFirefox && inputElm.childNodes.length && inputElm.lastChild.nodeType == 1 ){
            inputElm.appendChild(document.createTextNode("\u200b"))
            this.setRangeAtStartEnd(true)
            return true
        }
    },

    placeCaretAfterTag( tagElm ){
        var nextSibling = tagElm.nextSibling;
        var sel = window.getSelection(),
            range = sel.getRangeAt(0);

        if( !nextSibling ){
            nextSibling = document.createTextNode("")
            tagElm.appendChild(nextSibling)
            tagElm.parentNode.insertBefore(nextSibling, tagElm.nextSibling);
        }

        if (sel.rangeCount) {
            range.setStartAfter(tagElm);
            range.setEndAfter(tagElm);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    },

    /**
     * Enters a tag into "edit" mode
     * @param {Node} tagElm the tag element to edit. if nothing specified, use last last
     */
    editTag( tagElm, opts ){
        tagElm = tagElm || this.getLastTag()
        opts = opts || {}

        var editableElm = tagElm.querySelector('.tagify__tag-text'),
            tagIdx = this.getNodeIndex(tagElm),
            tagData = tagElm.__tagifyTagData,
            _CB = this.events.callbacks,
            that = this,
            isValid = true,
            delayed_onEditTagBlur = function(){
                setTimeout(_CB.onEditTagBlur.bind(that), 0, editableElm)
            }

        if( !editableElm ){
            console.warn('Cannot find element in Tag template: ', '.tagify__tag-text');
            return;
        }

        if( tagData instanceof Object && "editable" in tagData && !tagData.editable )
            return

        // cache the original data, on the DOM node, before any modification ocurs, for possible revert
        tagElm.__tagifyTagData.__originalData = extend({}, tagData)

        tagElm.classList.add('tagify__tag--editable')

        editableElm.setAttribute('contenteditable', true)

        editableElm.addEventListener('focus', _CB.onEditTagFocus.bind(this, tagElm))
        editableElm.addEventListener('blur', delayed_onEditTagBlur)
        editableElm.addEventListener('input', _CB.onEditTagInput.bind(this, editableElm))
        editableElm.addEventListener('keydown', e => _CB.onEditTagkeydown.call(this, e, tagElm))

        editableElm.focus()
        this.setRangeAtStartEnd(false, editableElm)

        if( !opts.skipValidation )
            isValid = this.editTagToggleValidity(tagElm, tagData.value)

        editableElm.originalIsValid = isValid

        this.trigger("edit:start", { tag:tagElm, index:tagIdx, data:tagData, isValid })

        return this;
    },

    editTagToggleValidity( tagElm, value ){
        var tagData = tagElm.__tagifyTagData,
            toggleState;

        if( !tagData ){
            console.warn("tag has no data: ", tagElm, tagData)
            return;
        }

        toggleState = !!(tagData.__isValid && tagData.__isValid != true);

        //this.validateTag(tagData);

        tagElm.classList.toggle('tagify--invalid', toggleState)
        return tagData.__isValid
    },

    onEditTagDone(tagElm, tagData){
        tagData = tagData || {}

        var eventData = { tag:tagElm, index:this.getNodeIndex(tagElm), data:tagData };

        this.trigger("edit:beforeUpdate", eventData)

        delete tagData.__originalData;

        if( tagElm ){
            this.editTagToggleValidity(tagElm)
            this.replaceTag(tagElm, tagData)
        }

        this.trigger("edit:updated", eventData)
        this.dropdown.hide.call(this)

        // check if any of the current tags which might have been marked as "duplicate" should be now un-marked
        if( this.settings.keepInvalidTags )
            this.reCheckInvalidTags()
    },

    /**
     * Replaces an exisitng tag with a new one. Used for updating a tag's data
     * @param {Object} tagElm  [DOM node to replace]
     * @param {Object} tagData [data to create new tag from]
     */
    replaceTag(tagElm, tagData){
        if( !tagData || !tagData.value )
            tagData = tagElm.__tagifyTagData

        // if tag is invalid, make the according changes in the newly created element
        if( tagData.__isValid && tagData.__isValid != true )
            extend( tagData, this.getInvaildTagParams(tagData, tagData.__isValid) )

        var newTag = this.createTagElem(tagData)

        // update DOM
        tagElm.parentNode.replaceChild(newTag, tagElm)
        this.updateValueByDOMTags()
    },

    /**
     * update "value" (Array of Objects) by traversing all valid tags
     */
    updateValueByDOMTags(){
        this.value.length = 0;

        [].forEach.call(this.getTagElms(), node => {
            if( node.classList.contains('tagify--notAllowed') ) return
            this.value.push( this.tagData(node) )
        })

        this.update()
    },

    /** https://stackoverflow.com/a/59156872/104380
     * @param {Boolean} start indicating where to place it (start or end of the node)
     * @param {Object}  node  DOM node to place the caret at
     */
    setRangeAtStartEnd( start, node ){
        node = node || this.DOM.input;
        node = node.lastChild || node;
        const sel = document.getSelection()

        if( sel.rangeCount ){
            ['Start', 'End'].forEach(pos =>
                sel.getRangeAt(0)["set" + pos](node, start ? 0 : node.length)
            )
        }
    },

    /**
     * injects nodes/text at caret position, which is saved on the "state" when "blur" event gets triggered
     * @param {Node} injectedNode [the node to inject at the caret position]
     * @param {Object} selection [optional selection Object. must have "anchorNode" & "anchorOffset"]
     */
    injectAtCaret( injectedNode, selection ){
        var selection = selection || this.state.selection || {},
            sel = window.getSelection(),
            range;

        if( !selection.anchorNode || selection.anchorOffset === undefined) return;

        if( typeof injectedNode == 'string' )
            injectedNode = document.createTextNode(injectedNode);

        if (sel.getRangeAt && sel.rangeCount){
            range = sel.getRangeAt(0)
            range.deleteContents()
            range.insertNode(injectedNode)
        }

        this.DOM.input.focus()
        this.setRangeAtStartEnd(true, injectedNode.nextSibling)

        this.updateValueByDOMTags()
        this.update()

        return this
    },

    /**
     * input bridge for accessing & setting
     * @type {Object}
     */
    input : {
        value : '',
        set( s = '', updateDOM = true ){
            var hideDropdown = this.settings.dropdown.closeOnSelect
            this.input.value = s;

            if( updateDOM )
                this.DOM.input.innerHTML = s;

            if( !s && hideDropdown )
                setTimeout(this.dropdown.hide.bind(this), 20)  // setTimeout duration must be HIGER than the dropdown's item "onClick" method's "focus()" event, because the "hide" method re-binds the main events and it will catch the "blur" event and will cause

            this.input.autocomplete.suggest.call(this);
            this.input.validate.call(this);
            this.setRangeAtStartEnd()
        },

        /**
         * Marks the tagify's input as "invalid" if the value did not pass "validateTag()"
         */
        validate(){
            var isValid = !this.input.value || this.validateTag({value:this.input.value}) === true

            if( this.settings.mode == 'select' )
                this.toggleInvalidClass(!isValid)
            else
                this.DOM.input.classList.toggle('tagify__input--invalid', !isValid)

            return isValid
        },

        // remove any child DOM elements that aren't of type TEXT (like <br>)
        normalize( node ){
            var clone = node || this.DOM.input, //.cloneNode(true),
                v = [];

            // when a text was pasted in FF, the "this.DOM.input" element will have <br> but no newline symbols (\n), and this will
            // result in tags no being properly created if one wishes to create a separate tag per newline.
            clone.childNodes.forEach(n => n.nodeType==3 && v.push(n.nodeValue))
            v = v.join("\n")

            try{
                // "delimiters" might be of a non-regex value, where this will fail ("Tags With Properties" example in demo page):
                v = v.replace(/(?:\r\n|\r|\n)/g, this.settings.delimiters.source.charAt(0))
            }
            catch(err){}


            v = v.replace(/\s/g, ' ')  // replace NBSPs with spaces characters
                .replace(/^\s+/, "") // trimLeft

            return v
        },

        /**
         * suggest the rest of the input's value (via CSS "::after" using "content:attr(...)")
         * @param  {String} s [description]
         */
        autocomplete : {
            suggest( data ){
                if( !this.settings.autoComplete.enabled ) return;

                data = data || {}

                if( typeof data == 'string' )
                    data = {value:data}

                var suggestedText = data.value || '',
                    suggestionStart = suggestedText.substr(0, this.input.value.length).toLowerCase(),
                    suggestionTrimmed = suggestedText.substring(this.input.value.length);

                if( !suggestedText || !this.input.value || suggestionStart != this.input.value.toLowerCase() ){
                    this.DOM.input.removeAttribute("data-suggest");
                    delete this.state.inputSuggestion
                }
                else{
                    this.DOM.input.setAttribute("data-suggest", suggestionTrimmed);
                    this.state.inputSuggestion = data
                }
            },

            /**
             * sets the suggested text as the input's value & cleanup the suggestion autocomplete.
             * @param {String} s [text]
             */
            set( s ){
                var dataSuggest = this.DOM.input.getAttribute('data-suggest'),
                    suggestion = s || (dataSuggest ? this.input.value + dataSuggest : null);

                if( suggestion ){
                    if( this.settings.mode == 'mix' ){
                        this.replaceTextWithNode( document.createTextNode(this.state.tag.prefix + suggestion) )
                    }
                    else{
                        this.input.set.call(this, suggestion);
                        this.setRangeAtStartEnd()
                    }

                    this.input.autocomplete.suggest.call(this);
                    this.dropdown.hide.call(this);

                    return true;
                }

                return false;
            }
        }
    },

    getTagIdx( tagData ){
        return this.value.findIndex(item => JSON.stringify(item) == JSON.stringify(tagData) )
    },

    getNodeIndex( node ){
        var index = 0;

        if( node )
            while( (node = node.previousElementSibling) )
                index++;

        return index;
    },

    getTagElms( ...classess ){
        var classname = ['.tagify__tag', ...classess].join('.')
        return this.DOM.scope.querySelectorAll(classname)
    },

    getLastTag(){
        var lastTag = this.DOM.scope.querySelectorAll('tag:not(.tagify--hide):not([readonly])');
        return lastTag[lastTag.length - 1];
    },

    /** Setter/Getter
     * Each tag DOM node contains a custom property called "__tagifyTagData" which hosts its data
     * @param {Node}   tagElm
     * @param {Object} data
     */
    tagData(tagElm, data){
        if( !tagElm ){
            console.warn("tag elment doesn't exist",tagElm, data)
            return data
        }

        if( data )
            tagElm.__tagifyTagData = extend({}, tagElm.__tagifyTagData || {}, data)

        return tagElm.__tagifyTagData
    },

    /**
     * Searches if any tag with a certain value already exis
     * @param  {String/Object} v [text value / tag data object]
     * @return {Boolean}
     */
    isTagDuplicate( value ){
        var duplications;
        // duplications are irrelevant for this scenario
        if( this.settings.mode == 'select' )
            return false

        duplications = this.value.reduce((acc, item) => (""+value).trim().toLowerCase() === item.value.toLowerCase() ? acc+1 : acc, 0)
        return duplications
        // this.value.some(item => value.trim().toLowerCase() === item.value.toLowerCase())
    },

    getTagIndexByValue( value ){
        var result = [];
        this.getTagElms().forEach((tagElm, i) => {
            if( tagElm.textContent.trim().toLowerCase() == value.toLowerCase() )
                result.push(i)
        })
        return result;
    },

    getTagElmByValue( value ){
        var tagIdx = this.getTagIndexByValue(value)[0]
        return this.getTagElms()[tagIdx]
    },

    /**
     * Mark a tag element by its value
     * @param  {String|Number} value  [text value to search for]
     * @param  {Object}        tagElm [a specific "tag" element to compare to the other tag elements siblings]
     * @return {boolean}              [found / not found]
     */
    markTagByValue( value, tagElm ){
        tagElm = tagElm || this.getTagElmByValue(value);

        // check AGAIN if "tagElm" is defined
        if( tagElm ){
            tagElm.classList.add('tagify--mark')
            setTimeout(() => { tagElm.classList.remove('tagify--mark') }, 100)
            return tagElm
        }

        return false
    },

    /**
     * make sure the tag, or words in it, is not in the blacklist
     */
    isTagBlacklisted( v ){
        v = v.toLowerCase().trim();
        return this.settings.blacklist.filter(x =>v == x.toLowerCase()).length;
    },

    /**
     * make sure the tag, or words in it, is not in the blacklist
     */
    isTagWhitelisted( v ){
        return this.settings.whitelist.some(item =>
            typeof v == 'string'
                ? v.trim().toLowerCase() === (item.value || item).toLowerCase()
                : JSON.stringify(item).toLowerCase() === JSON.stringify(v).toLowerCase()
        )
    },

    /**
     * validate a tag object BEFORE the actual tag will be created & appeneded
     * @param  {String} s
     * @param  {String} uid      [unique ID, to not inclue own tag when cheking for duplicates]
     * @return {Boolean/String}  ["true" if validation has passed, String for a fail]
     */
    validateTag( tagData ){
        var value = tagData.value.trim(),
            _s = this.settings,
            result = true;

        // check for empty value
        if( !value )
            result = this.TEXTS.empty;

        // check if pattern should be used and if so, use it to test the value
        else if( _s.pattern && _s.pattern instanceof RegExp && !(_s.pattern.test(value)) )
            result = this.TEXTS.pattern;

        // if duplicates are not allowed and there is a duplicate
        else if( !_s.duplicates && this.isTagDuplicate(value) )
            result = this.TEXTS.duplicate;

        else if( this.isTagBlacklisted(value) || (_s.enforceWhitelist && !this.isTagWhitelisted(value)) )
            result = this.TEXTS.notAllowed;

        return result;
    },

    getInvaildTagParams(tagData, validation){
        return {
            "aria-invalid" : true,
            "class": (tagData.class || '') + ' tagify--notAllowed',
            "title": validation
        }
    },

    hasMaxTags(){
        if( this.value.length >= this.settings.maxTags )
            return this.TEXTS.exceed;
        return false;
    },

    /**
     * pre-proccess the tagsItems, which can be a complex tagsItems like an Array of Objects or a string comprised of multiple words
     * so each item should be iterated on and a tag created for.
     * @return {Array} [Array of Objects]
     */
    normalizeTags( tagsItems ){
        var {whitelist, delimiters, mode} = this.settings,
            whitelistWithProps = whitelist ? whitelist[0] instanceof Object : false,
            // checks if this is a "collection", meanning an Array of Objects
            isArray = tagsItems instanceof Array,
            temp = [],
            mapStringToCollection = s => (s+"").split(delimiters).filter(n => n).map(v => ({ value:v.trim() }))

        if( typeof tagsItems == 'number' )
            tagsItems = tagsItems.toString();

        // if the value is a "simple" String, ex: "aaa, bbb, ccc"
        if( typeof tagsItems == 'string' ){
            if( !tagsItems.trim() ) return [];

            // go over each tag and add it (if there were multiple ones)
            tagsItems = mapStringToCollection(tagsItems);
        }

        // assuming Array of Strings
        else if( isArray ){
            // flatten the 2D array
            tagsItems = [].concat(...tagsItems.map(item => item.value
                ? mapStringToCollection(item.value).map(newItem => ({...item,...newItem}))
                : mapStringToCollection(item)
            ));
        }

        // search if the tag exists in the whitelist as an Object (has props),
        // to be able to use its properties
        if( whitelistWithProps ){
            tagsItems.forEach(item => {
                // the "value" prop should preferably be unique
                var matchObj = this.getWhitelistItemsByValue(item.value)

                if( matchObj && matchObj instanceof Object ){
                    temp.push( matchObj ); // set the Array (with the found Object) as the new value
                }
                else if( mode != 'mix' )
                    temp.push(item)
            })

            if( temp.length )
                tagsItems = temp;
        }

        return tagsItems;
    },

    getWhitelistItemsByValue(value){
        return this.settings.whitelist.filter(item => sameStr(item.value || item, value))[0]
    },

    /**
     * Parse the initial value of a textarea (or input) element and generate mixed text w/ tags
     * https://stackoverflow.com/a/57598892/104380
     * @param {String} s
     */
    parseMixTags( s ){
        var {mixTagsInterpolator, duplicates, transformTag, enforceWhitelist} = this.settings,
            tagsDataSet = [];

        s = s.split(mixTagsInterpolator[0]).map((s1, i) => {
            var s2 = s1.split(mixTagsInterpolator[1]),
                preInterpolated = s2[0],
                tagData,
                tagElm;

            try{
                tagData = JSON.parse(preInterpolated)
            } catch(err){
                tagData = this.normalizeTags(preInterpolated)[0]  //{value:preInterpolated}
            }

            if( s2.length > 1   &&   (!enforceWhitelist || this.isTagWhitelisted(tagData.value))   &&   !(!duplicates  && this.isTagDuplicate(tagData.value)) ){
                transformTag.call(this, tagData)

                tagElm = this.createTagElem(tagData)
                tagsDataSet.push( tagData )
                tagElm.classList.add('tagify--noAnim')

                s2[0] = tagElm.outerHTML //+ "&#8288;"  // put a zero-space at the end so the caret won't jump back to the start (when the last input's child element is a tag)
                this.value.push(tagData)
            }
            else if(s1)
                return i ? mixTagsInterpolator[0] + s1 : s1

            return s2.join('')
        }).join('')

        this.DOM.input.innerHTML = s
        this.DOM.input.appendChild(document.createTextNode(''))
        this.DOM.input.normalize()
        this.getTagElms().forEach((elm, idx) => this.tagData(elm,  tagsDataSet[idx]))
        this.update({withoutChangeEvent:true})
        return s
    },

    /**
     * For mixed-mode: replaces a text starting with a prefix with a wrapper element (tag or something)
     * First there *has* to be a "this.state.tag" which is a string that was just typed and is staring with a prefix
     */
    replaceTextWithNode( wrapperElm, strToReplace ){
        if( !this.state.tag && !strToReplace ) return;

        strToReplace = strToReplace || this.state.tag.prefix + this.state.tag.value;
        var idx, replacedNode,
            selection = this.state.selection || window.getSelection(),
            nodeAtCaret = selection.anchorNode;

        // ex. replace #ba with the tag "bart" where "|" is where the caret is:
        // start with: "#ba #ba| #ba"
        // split the text node at the index of the caret
        nodeAtCaret.splitText(selection.anchorOffset)
        // "#ba #ba"
        // get index of last occurence of "#ba"
        idx = nodeAtCaret.nodeValue.lastIndexOf(strToReplace)

        replacedNode = nodeAtCaret.splitText(idx)

        // clean up the tag's string and put tag element instead
        replacedNode.nodeValue = replacedNode.nodeValue.replace(strToReplace, '');
        nodeAtCaret.parentNode.insertBefore(wrapperElm, replacedNode);

        return replacedNode;
    },

    /**
     * For selecting a single option (not used for multiple tags, but for "mode:select" only)
     * @param {Object} tagElm   Tag DOM node
     * @param {Object} tagData  Tag data
     */
    selectTag(tagElm, tagData){
        if( this.settings.enforceWhitelist && !this.isTagWhitelisted(tagData.value) )
            return

        this.input.set.call(this, tagData.value, true)

        // place the caret at the end of the input, only if a dropdown option was selected (and not by manually typing another value and clicking "TAB")
        if( this.state.actions.selectOption )
            setTimeout(this.setRangeAtStartEnd.bind(this))

        if( this.getLastTag() )
            this.replaceTag(this.getLastTag(), tagData)
        else
            this.appendTag(tagElm)

        this.value[0] = tagData
        this.trigger('add', { tag:tagElm, data:tagData })
        this.update()

        return [tagElm]
    },

    /**
     * add an empty "tag" element in an editable state
     */
    addEmptyTag(){
        var tagData = {value:""},
            tagElm = this.createTagElem(tagData)

        // must be assigned ASAP, before "validateTag" method below
        this.tagData(tagElm, tagData)

        // add the tag to the component's DOM
        this.appendTag(tagElm)
        this.editTag(tagElm, {skipValidation:true})
    },

    /**
     * add a "tag" element to the "tags" component
     * @param {String/Array} tagsItems   [A string (single or multiple values with a delimiter), or an Array of Objects or just Array of Strings]
     * @param {Boolean}      clearInput  [flag if the input's value should be cleared after adding tags]
     * @param {Boolean}      skipInvalid [do not add, mark & remove invalid tags]
     * @return {Array} Array of DOM elements (tags)
     */
    addTags( tagsItems, clearInput, skipInvalid = this.settings.skipInvalid ){
        var tagElems = [], tagElm, _s = this.settings;

        if( !tagsItems || tagsItems.length == 0 ){
            // is mode is "select" clean all tags
            if( _s.mode == 'select' )
                this.removeAllTags()
            return tagElems
        }

        // converts Array/String/Object to an Array of Objects
        tagsItems = this.normalizeTags(tagsItems)

        if( _s.mode == 'mix' ){
            return this.addMixTags(tagsItems)
        }

        if( _s.mode == 'select' )
            clearInput = false

        this.DOM.input.removeAttribute('style')

        tagsItems.forEach(tagData => {
            var tagElm,
                tagElmParams = {},
                originalData = Object.assign({}, tagData);

            // shallow-clone tagData so later modifications will not apply to the source
            tagData = Object.assign({}, tagData)

            _s.transformTag.call(this, tagData);

            ///////////////// ( validation )//////////////////////
            tagData.__isValid = this.hasMaxTags() || this.validateTag(tagData);

            if( tagData.__isValid !== true ){
                if( skipInvalid )
                    return

                extend(tagElmParams, this.getInvaildTagParams(tagData, tagData.__isValid), {__preInvalidData:originalData})

                // mark, for a brief moment, the tag THIS CURRENT tag is a duplcate of
                if( tagData.__isValid == this.TEXTS.duplicate )
                    this.markTagByValue(tagData.value)
            }
            /////////////////////////////////////////////////////


            if( tagData.readonly )
                tagElmParams["aria-readonly"] = true

            // Create tag HTML element
            tagElm = this.createTagElem( extend({}, tagData, tagElmParams) )
            tagElems.push(tagElm)

            // mode-select overrides
            if( _s.mode == 'select' ){
                return this.selectTag(tagElm, tagData)
            }

            // add the tag to the component's DOM
            this.appendTag(tagElm)

            if( tagData.__isValid && tagData.__isValid === true ){
                // update state
                this.value.push(tagData)
                this.update()
                this.trigger('add', {tag:tagElm, index:this.value.length - 1, data:tagData})
            }
            else{
                this.trigger("invalid", {data:tagData, index:this.value.length, tag:tagElm, message:tagData.__isValid})
                if( !_s.keepInvalidTags )
                    // remove invalid tags (if "keepInvalidTags" is set to "false")
                    setTimeout(() => this.removeTags(tagElm, true), 1000)
            }

            this.dropdown.position.call(this) // reposition the dropdown because the just-added tag might cause a new-line
        })

        if( tagsItems.length && clearInput ){
            this.input.set.call(this);
        }

        this.dropdown.refilter.call(this)
        return tagElems
    },

    /**
     * Adds a mix-content tag
     * @param {String/Array} tagsItems   [A string (single or multiple values with a delimiter), or an Array of Objects or just Array of Strings]
     */
    addMixTags( tagsItems ){
        var _s = this.settings,
            tagElm;

        _s.transformTag.call(this, tagsItems[0])

        tagsItems[0].prefix = tagsItems[0].prefix || this.state.tag ? this.state.tag.prefix : (_s.pattern.source||_s.pattern)[0];

        // TODO: should check if the tag is valid
        tagElm = this.createTagElem(tagsItems[0])
        // tries to replace a taged textNode with a tagElm, and if not able,
        // insert the new tag to the END if "addTags" was called from outside
        if( !this.replaceTextWithNode(tagElm) ){
            this.DOM.input.appendChild(tagElm)
        }

        setTimeout(()=> tagElm.classList.add('tagify--noAnim'), 300)


        this.value.push(tagsItems[0])
        this.update()

        this.state.tag = null
        this.trigger('add', extend({}, {tag:tagElm}, {data:tagsItems[0]}))

        // fixes a firefox bug where if the last child of the input is a tag and not a text, the input cannot get focus (by Tab key)
        this.fixFirefoxLastTagNoCaret()
        setTimeout(this.placeCaretAfterTag.bind(this), 100, tagElm)

        return tagElm
    },

    /**
     * appened (validated) tag to the component's DOM scope
     */
    appendTag(tagElm){
        var insertBeforeNode = this.DOM.scope.lastElementChild;

        if( insertBeforeNode === this.DOM.input )
            this.DOM.scope.insertBefore(tagElm, insertBeforeNode);
        else
            this.DOM.scope.appendChild(tagElm);
    },

    /**
     * creates a DOM tag element and injects it into the component (this.DOM.scope)
     * @param  {Object}  tagData [text value & properties for the created tag]
     * @return {Object} [DOM element]
     */
    createTagElem( tagData ){
        var tagElm,
            v = escapeHTML(tagData.value),
            template = this.settings.templates.tag.call(this, v, tagData);

        if( this.settings.readonly )
            tagData.readonly = true

        // tagData.__uid = tagData.__uid || getUID()

        template = minify(template)
        tagElm = parseHTML(template)

        this.tagData(tagElm, tagData)

        return tagElm;
    },

    /**
     * find all invalid tags and re-check them
     */
    reCheckInvalidTags(){
        var tagElms = this.DOM.scope.querySelectorAll('.tagify__tag.tagify--notAllowed');

        [].forEach.call(tagElms, node => {
            var tagData = this.tagData(node),
                wasNodeDuplicate = node.getAttribute('title') == this.TEXTS.duplicate,
                isNodeValid = this.validateTag(tagData) === true;

            // if this tag node was marked as a dulpicate, unmark it (it might have been marked as "notAllowed" for other reasons)
            if( wasNodeDuplicate && isNodeValid ){
                if( tagData.__preInvalidData )
                    tagData = tagData.__preInvalidData
                else
                    // start fresh
                    tagData = {value:tagData.value}

                this.replaceTag(node, tagData)
            }
        })
    },

    /**
     * Removes a tag
     * @param  {Array|Node|String}  tagElms         [DOM element(s) or a String value. if undefined or null, remove last added tag]
     * @param  {Boolean}            silent          [A flag, which when turned on, does not remove any value and does not update the original input value but simply removes the tag from tagify]
     * @param  {Number}             tranDuration    [Transition duration in MS]
     * TODO: Allow multiple tags to be removed at-once
     */
    removeTags( tagElms, silent, tranDuration ){
        var tagsToRemove;

        tagElms = tagElms && tagElms instanceof HTMLElement
            ? [tagElms]
            : tagElms instanceof Array
                ? tagElms
                : tagElms
                    ? [tagElms]
                    : [this.getLastTag()]

        // normalize tagElms array values:
        // 1. removing invalid items
        // 2, if an item is String try to get the matching Tag HTML node
        // 3. get the tag data
        // 4. return a collection of Objects
        tagsToRemove = tagElms.reduce((elms, tagElm) => {
            if( tagElm && typeof tagElm == 'string')
                tagElm = this.getTagElmByValue(tagElm)

            if( tagElm )
                // because the DOM node might be removed by async animation, the state will be updated while
                // the node might still be in the DOM, so the "update" method should know which nodes to ignore
                elms.push({node:tagElm, data:this.tagData(tagElm, {'__removed':true})})

            return elms
        }, [])

        tranDuration = typeof tranDuration == "number" ? tranDuration : this.CSSVars.tagHideTransition

        if( this.settings.mode == 'select' ){
            tranDuration = 0;
            this.input.set.call(this)
        }

        // if only a single tag is to be removed
        if( tagsToRemove.length == 1 ){
            if( tagsToRemove[0].node.classList.contains('tagify--notAllowed') )
                silent = true
        }

        if( !tagsToRemove.length )
            return;

        this.settings.hooks.beforeRemoveTag(tagsToRemove)
            .then(() => {
                function removeNode( tag ){
                    if( !tag.node.parentNode ) return
                    // tag index MUST be derived from "this.value" index, because when called repeatedly, the tag nodes still exists
                    // for example if called twice, the first idx would be "0" and the other "1", but when the tags are actually removed, they
                    // are removed in a synchronized way, so after the first tag was removed (only 1 left now), the other one cannot be removed becuase
                    // its index now does not exists
                    var tagIdx = this.getTagIdx(tag.data) // this.getNodeIndex(tagElm); // this.getTagIndexByValue(tagElm.textContent)

                    tag.node.parentNode.removeChild(tag.node)

                    if( !silent ){
                        // this.removeValueById(tagData.__uid)
                        this.trigger('remove', { tag:tag.node, index:tagIdx, data:tag.data })
                        this.dropdown.refilter.call(this)
                        this.dropdown.position.call(this)
                        this.DOM.input.normalize() // best-practice when in mix-mode (safe to do always anyways)

                        // check if any of the current tags which might have been marked as "duplicate" should be now un-marked
                        if( this.settings.keepInvalidTags )
                            this.reCheckInvalidTags()
                    }
                    else if( this.settings.keepInvalidTags )
                        this.trigger('remove', { tag:tag.node, index:tagIdx })
                }

                function animation( tag ){
                    tag.node.style.width = parseFloat(window.getComputedStyle(tag.node).width) + 'px'
                    document.body.clientTop // force repaint for the width to take affect before the "hide" class below
                    tag.node.classList.add('tagify--hide')

                    // manual timeout (hack, since transitionend cannot be used because of hover)
                    setTimeout(removeNode.bind(this), tranDuration, tag)
                }

                if( tranDuration && tranDuration > 10 && tagsToRemove.length == 1 ) animation.call(this, tagsToRemove[0])
                else tagsToRemove.forEach(removeNode.bind(this))

                // update state regardless of animation
                if( !silent ){
                    tagsToRemove.forEach(tag => {
                        // remove "__removed" so the comparison in "getTagIdx" could work
                        var tagData = Object.assign({}, tag.data) // shallow clone
                        delete tagData.__removed

                        var tagIdx = this.getTagIdx(tagData)
                        if( tagIdx > -1 )
                            this.value.splice(tagIdx, 1)
                    })

                    // that.removeValueById(tagData.__uid)
                    this.update() // update the original input with the current value
                }
            }
        )
        .catch(reason => {})
    },

    removeAllTags(){
        this.value = []

        if( this.settings.mode == 'mix' )
            this.DOM.input.innerHTML = ''
        else
            Array.prototype.slice.call(this.getTagElms()).forEach(elm => elm.parentNode.removeChild(elm))

        this.dropdown.position.call(this)

        if( this.settings.mode == 'select' )
            this.input.set.call(this)

        this.update()
    },

    /**
     * Removes an item in "this.value" by its UID
     * @param {String} uid

    removeValueById( uid ){
        //  this.value = this.value.filter(item => item.__tagifyTagData.__uid != uid)
    },
    */

    postUpdate(){
        var hasValue = this.settings.mode == 'mix' ? this.DOM.originalInput.value : this.value.length;
        this.DOM.scope.classList.toggle('tagify--hasMaxTags',  this.value.length >= this.settings.maxTags)
        this.DOM.scope.classList.toggle('tagify--noTags',  !this.value.length)
        this.DOM.scope.classList.toggle('tagify--empty', !hasValue)
    },

    /**
     * update the origianl (hidden) input field's value
     * see - https://stackoverflow.com/q/50957841/104380
     */
    update( args ){
        var inputElm = this.DOM.originalInput,
            { withoutChangeEvent } = args || {},
            value = removeCollectionProp(this.value, ['__isValid', '__removed']);


        inputElm.value = this.settings.mode == 'mix'
            ? this.getMixedTagsAsString(value)
            : value.length
                ? this.settings.originalInputValueFormat
                    ? this.settings.originalInputValueFormat(value)
                    : JSON.stringify(value)
                : ""

        this.postUpdate()

        if( !withoutChangeEvent && this.state.loadedOriginalValues )
            this.triggerChangeEvent()
    },

    getMixedTagsAsString(){
        var result = "",
            that = this,
            i = 0,
            _interpolator = this.settings.mixTagsInterpolator;

        function iterateChildren(rootNode){
            rootNode.childNodes.forEach((node) => {
                if( node.nodeType == 1 ){
                    if( node.classList.contains("tagify__tag") && that.tagData(node) ){
                        if( that.tagData(node).__removed )
                            return;
                        else
                            result += _interpolator[0] + JSON.stringify( node.__tagifyTagData ) + _interpolator[1]
                        return
                    }

                    if( node.tagName == 'BR' && (node.parentNode == that.DOM.input || node.parentNode.childNodes.length == 1 ) ){
                        result += "\r\n";
                    }

                    else if( node.tagName == 'DIV' || node.tagName == 'P' ){
                        result += "\r\n";
                        iterateChildren(node)
                    }
                }
                else
                    result += node.textContent;
            })
        }

        iterateChildren(this.DOM.input)

        return result;
    },

    /**
     * Meassures an element's height, which might yet have been added DOM
     * https://stackoverflow.com/q/5944038/104380
     * @param {DOM} node
     */
    getNodeHeight( node ){
        var height, clone = node.cloneNode(true)
        clone.style.cssText = "position:fixed; top:-9999px; opacity:0"
        document.body.appendChild(clone)
        height = clone.clientHeight
        clone.parentNode.removeChild(clone)
        return height
    },

    /**
     * Dropdown controller
     * @type {Object}
     */
    dropdown : {
        init(){
            this.DOM.dropdown = parseHTML( this.settings.templates.dropdown(this.settings) )
            this.DOM.dropdown.content = this.DOM.dropdown.querySelector('.tagify__dropdown__wrapper')
        },

        show( value ){
            var HTMLContent,
                _s = this.settings,
                firstListItem,
                firstListItemValue,
                ddHeight,
                selection = window.getSelection(),
                allowNewTags = _s.mode == 'mix' && !_s.enforceWhitelist,
                noWhitelist =  !_s.whitelist || !_s.whitelist.length,
                isManual = _s.dropdown.position == 'manual';

            // ⚠️ Do not render suggestions list  if:
            // 1. there's no whitelist (can happen while async loading) AND new tags arn't allowed
            // 2. dropdown is disabled
            // 3. loader is showing (controlled outside of this code)
            if( (noWhitelist && !allowNewTags) || _s.dropdown.enable === false || this.state.isLoading ) return;

            clearTimeout(this.dropdownHide__bindEventsTimeout)

            // if no value was supplied, show all the "whitelist" items in the dropdown
            // @type [Array] listItems
            // TODO: add a Setting to control items' sort order for "listItems"
            this.suggestedListItems = this.dropdown.filterListItems.call(this, value)

            // in mix-mode, if the value isn't included in the whilelist & "enforceWhitelist" setting is "false",
            // then add a custom suggestion item to the dropdown
            if( this.suggestedListItems.length ){
                if( value   &&   allowNewTags   &&   !this.state.editing.scope  &&  !sameStr(this.suggestedListItems[0].value, value) )
                    this.suggestedListItems.unshift({value})
            }
            else{
                if( value   &&   allowNewTags  &&  !this.state.editing.scope ){
                    this.suggestedListItems = [{value}]
                }
                // hide suggestions list if no suggestions were matched & cleanup
                else{
                    this.input.autocomplete.suggest.call(this);
                    this.dropdown.hide.call(this)

                    return;
                }
            }

            firstListItem =  this.suggestedListItems[0]
            firstListItemValue = ""+(isObject(firstListItem) ? firstListItem.value : firstListItem)

            if( _s.autoComplete && firstListItemValue ){
                // only fill the sugegstion if the value of the first list item STARTS with the input value (regardless of "fuzzysearch" setting)
                if( firstListItemValue.indexOf(value) == 0 )
                    this.input.autocomplete.suggest.call(this, firstListItem)
            }

            HTMLContent = this.dropdown.createListHTML.call(this, this.suggestedListItems);

            this.DOM.dropdown.content.innerHTML = minify(HTMLContent);

            if( _s.dropdown.highlightFirst )
                this.dropdown.highlightOption.call(this, this.DOM.dropdown.content.children[0])

            this.DOM.scope.setAttribute("aria-expanded", true)


            // bind events, exactly at this stage of the code. "dropdown.show" method is allowed to be
            // called multiple times, regardless if the dropdown is currently visisble, but the events-binding
            // should only be called if the dropdown wasn't previously visible.
            if( !this.state.dropdown.visible )
                // timeout is needed for when pressing arrow down to show the dropdown,
                // so the key event won't get registered in the dropdown events listeners
                setTimeout(this.dropdown.events.binding.bind(this))

            // set the dropdown visible state to be the same as the searched value.
            // MUST be set *before* position() is called
            this.state.dropdown.visible = value || true
            this.state.dropdown.query = value

            this.state.selection = {
                anchorOffset : selection.anchorOffset,
                anchorNode: selection.anchorNode
            }

            // try to positioning the dropdown (it might not yet be on the page, doesn't matter, next code handles this)
            if( !isManual )
                this.dropdown.position.call(this)

            // if the dropdown has yet to be appended to the document,
            // append the dropdown to the body element & handle events
            if( !document.body.contains(this.DOM.dropdown) ){
                if( !isManual ){
                    // let the element render in the DOM first to accurately measure it
                    // this.DOM.dropdown.style.cssText = "left:-9999px; top:-9999px;";
                    ddHeight = this.getNodeHeight(this.DOM.dropdown)

                    this.DOM.dropdown.classList.add('tagify__dropdown--initial')
                    this.dropdown.position.call(this, ddHeight)
                    document.body.appendChild(this.DOM.dropdown)

                    setTimeout(() =>
                        this.DOM.dropdown.classList.remove('tagify__dropdown--initial')
                    )
                }
            }

            this.trigger("dropdown:show", this.DOM.dropdown)
        },

        hide( force ){
            var {scope, dropdown} = this.DOM,
                isManual = this.settings.dropdown.position == 'manual' && !force;

            // if there's no dropdown, this means the dropdown events aren't binded
            if( !dropdown || !document.body.contains(dropdown) || isManual ) return;

            window.removeEventListener('resize', this.dropdown.position)
            this.dropdown.events.binding.call(this, false) // unbind all events

            // if the dropdown is open, and the input (scope) is clicked,
            // the dropdown should be now "close", and the next click (on the scope)
            // should re-open it, and without a timeout, clicking to close will re-open immediately
            //  clearTimeout(this.dropdownHide__bindEventsTimeout)
            //  this.dropdownHide__bindEventsTimeout = setTimeout(this.events.binding.bind(this), 250)  // re-bind main events


            scope.setAttribute("aria-expanded", false)
            dropdown.parentNode.removeChild(dropdown)

            // scenario: clicking the scope to show the dropdown, clicking again to hide -> calls dropdown.hide() and then re-focuses the input
            // which casues another onFocus event, which checked "this.state.dropdown.visible" and see it as "false" and re-open the dropdown
            setTimeout(() => {
                this.state.dropdown.visible = false
            }, 100)

            this.state.dropdown.query =
            this.state.ddItemData =
            this.state.ddItemElm =
            this.state.selection = null

            // if the user closed the dropdown (in mix-mode) while a potential tag was detected, flag the current tag
            // so the dropdown won't be shown on following user input for that "tag"
            if( this.state.tag && this.state.tag.value.length ){
                this.state.flaggedTags[this.state.tag.baseOffset] = this.state.tag
            }

            this.trigger("dropdown:hide", dropdown)

            return this
        },

        /**
         * fill data into the suggestions list
         * (mainly used to update the list when removing tags, so they will be re-added to the list. not efficient)
         */
        refilter( value ){
            var HTMLstr;

            value = value || this.state.dropdown.query || ''
            this.suggestedListItems = this.dropdown.filterListItems.call(this, value)

            if( this.suggestedListItems.length ){
                HTMLstr = this.dropdown.createListHTML.call(this, this.suggestedListItems)
                this.DOM.dropdown.content.innerHTML = minify(HTMLstr)
            }
            else
                this.dropdown.hide.call(this)

            this.trigger("dropdown:updated", this.DOM.dropdown)
        },

        position(ddHeight){
            var isBelowViewport, rect, top, bottom, left, width,
                ddElm = this.DOM.dropdown,
                ddTarget = this.DOM[this.settings.dropdown.position == 'input' ? 'input' : 'scope']

            if( !this.state.dropdown.visible ) return

            if( this.settings.dropdown.position == 'text' ){
                rect   = this.getCaretGlobalPosition()
                bottom = rect.bottom
                top    = rect.top
                left   = rect.left
                width  = 'auto'
            }

            else{
                rect   = ddTarget.getBoundingClientRect()
                top    = rect.top
                bottom = rect.bottom - 1
                left   = rect.left
                width  = rect.width + "px"
            }

            top = Math.floor(top)
            bottom = Math.ceil(bottom)
            isBelowViewport = document.documentElement.clientHeight - bottom < (ddHeight || ddElm.clientHeight);

            // flip vertically if there is no space for the dropdown below the input
            ddElm.style.cssText = "left:"  + (left + window.pageXOffset) + "px; width:" + width + ";" + (isBelowViewport
                ? "bottom:" + (document.documentElement.clientHeight - top - window.pageYOffset - 2) + "px;"
                : "top: "   + (bottom + window.pageYOffset) + "px");

            ddElm.setAttribute('placement', isBelowViewport ? "top" : "bottom")
        },

        events : {
            /**
             * Events should only be binded when the dropdown is rendered and removed when isn't
             * because there might be multiple Tagify instances on a certain page
             * @param  {Boolean} bindUnbind [optional. true when wanting to unbind all the events]
             */
            binding( bindUnbind = true ){
                // references to the ".bind()" methods must be saved so they could be unbinded later
                var _CB = this.dropdown.events.callbacks,
                    // callback-refs
                    _CBR = (this.listeners.dropdown = this.listeners.dropdown || {
                        position     : this.dropdown.position.bind(this),
                        onKeyDown    : _CB.onKeyDown.bind(this),
                        onMouseOver  : _CB.onMouseOver.bind(this),
                        onMouseLeave : _CB.onMouseLeave.bind(this),
                        onClick      : _CB.onClick.bind(this),
                        onScroll     : _CB.onScroll.bind(this)
                    }),
                    action = bindUnbind ? 'addEventListener' : 'removeEventListener';

                if( this.settings.dropdown.position != 'manual' ){
                    window[action]('resize', _CBR.position)
                    window[action]('keydown', _CBR.onKeyDown)
                }

                this.DOM.dropdown[action]('mouseover', _CBR.onMouseOver)
                this.DOM.dropdown[action]('mouseleave', _CBR.onMouseLeave)
                this.DOM.dropdown[action]('mousedown', _CBR.onClick)
                this.DOM.dropdown.content[action]('scroll', _CBR.onScroll)
            },

            callbacks : {
                onKeyDown(e){
                    // get the "active" element, and if there was none (yet) active, use first child
                    var activeListElm = this.DOM.dropdown.querySelector("[class$='--active']"),
                        selectedElm = activeListElm;

                    switch( e.key ){
                        case 'ArrowDown' :
                        case 'ArrowUp' :
                        case 'Down' :  // >IE11
                        case 'Up' : {  // >IE11
                            e.preventDefault()
                            var dropdownItems;

                            if( selectedElm )
                                selectedElm = selectedElm[(e.key == 'ArrowUp' || e.key == 'Up' ? "previous" : "next") + "ElementSibling"];

                            // if no element was found, loop
                            if( !selectedElm ){
                                dropdownItems = this.DOM.dropdown.content.children
                                selectedElm = dropdownItems[e.key == 'ArrowUp' || e.key == 'Up' ? dropdownItems.length - 1 : 0];
                            }

                            this.dropdown.highlightOption.call(this, selectedElm, true);
                            break;
                        }
                        case 'Escape' :
                        case 'Esc': // IE11
                            this.dropdown.hide.call(this);
                            break;

                        case 'ArrowRight' :
                            if( this.state.actions.ArrowLeft )
                                return
                        case 'Tab' : {
                            // in mix-mode, treat arrowRight like Enter key, so a tag will be created
                            if( this.settings.mode != 'mix' && !this.settings.autoComplete.rightKey ){
                                try{
                                    let value = selectedElm ? selectedElm.textContent : this.suggestedListItems[0].value;
                                    this.input.autocomplete.set.call(this, value)
                                }
                                catch(err){}
                                return false;
                            }
                        }
                        case 'Enter' : {
                            e.preventDefault();
                            this.dropdown.selectOption.call(this, activeListElm)
                            break;
                        }
                        case 'Backspace' : {
                            if( this.settings.mode == 'mix' || this.state.editing.scope ) return;

                            let value = this.input.value.trim()

                            if( value == "" || value.charCodeAt(0) == 8203 ){
                                if( this.settings.backspace === true )
                                    this.removeTags()
                                else if( this.settings.backspace == 'edit' )
                                    setTimeout(this.editTag.bind(this), 0)
                            }
                        }
                    }
                },

                onMouseOver(e){
                    var ddItem = e.target.closest('.tagify__dropdown__item')
                    // event delegation check
                    ddItem && this.dropdown.highlightOption.call(this, ddItem)
                },

                onMouseLeave(e){
                    // de-highlight any previously highlighted option
                    this.dropdown.highlightOption.call(this)
                },

                onClick(e){
                    if( e.button != 0 || e.target == this.DOM.dropdown ) return; // allow only mouse left-clicks

                    var listItemElm = e.target.closest(".tagify__dropdown__item")

                    // temporary set the "actions" state to indicate to the main "blur" event it shouldn't run
                    this.state.actions.selectOption = true;
                    setTimeout(()=> this.state.actions.selectOption = false, 50)

                    this.settings.hooks.suggestionClick(e)
                        .then(() => {
                            if( listItemElm )
                                this.dropdown.selectOption.call(this, listItemElm)
                        })
                        .catch(err => err)

                    // if( addNewBtn )
                    //     this.dropdown.events.callbacks.onClickAddNewBtn.call(this)
                },

                onScroll(e){
                    var elm = e.target,
                        pos = elm.scrollTop / (elm.scrollHeight - elm.parentNode.clientHeight) * 100;

                    this.trigger("dropdown:scroll", {percentage:Math.round(pos)})
                },
                /*
                onClickAddNewBtn(e){
                    this.state.actions.addNew = true
                    setTimeout(()=> this.state.actions.addNew = false, 150)

                    if( this.state.tag.value )
                        this.addTags([this.state.tag], true)

                    this.dropdown.hide.call(this)

                    setTimeout(() => {
                        this.DOM.input.focus()
                        this.toggleFocusClass(true)
                    })
                }
                */
            }
        },

        /**
         * mark the currently active suggestion option
         * @param {Object}  elm            option DOM node
         * @param {Boolean} adjustScroll   when navigation with keyboard arrows (up/down), aut-scroll to always show the highlighted element
         */
        highlightOption( elm, adjustScroll ){
            var className = "tagify__dropdown__item--active",
                itemData;

            // focus casues a bug in Firefox with the placeholder been shown on the input element
            // if( this.settings.dropdown.position != 'manual' )
            //     elm.focus();

            if( this.state.ddItemElm ){
                this.state.ddItemElm.classList.remove(className)
                this.state.ddItemElm.removeAttribute("aria-selected")
            }

            if( !elm ){
                this.state.ddItemData = null
                this.state.ddItemElm = null
                this.input.autocomplete.suggest.call(this)
                return;
            }

            itemData = this.suggestedListItems[this.getNodeIndex(elm)]
            this.state.ddItemData = itemData
            this.state.ddItemElm = elm

            // this.DOM.dropdown.querySelectorAll("[class$='--active']").forEach(activeElm => activeElm.classList.remove(className));
            elm.classList.add(className);
            elm.setAttribute("aria-selected", true)

            if( adjustScroll )
                elm.parentNode.scrollTop = elm.clientHeight + elm.offsetTop - elm.parentNode.clientHeight

            // Try to autocomplete the typed value with the currently highlighted dropdown item
            if( this.settings.autoComplete ){
                this.input.autocomplete.suggest.call(this, itemData)
                if( this.settings.dropdown.position != 'manual' )
                    this.dropdown.position.call(this) // suggestions might alter the height of the tagify wrapper because of unkown suggested term length that could drop to the next line
            }
        },

        /**
         * Create a tag from the currently active suggestion option
         * @param {Object} elm  DOM node to select
         */
        selectOption( elm ){
            if( !elm ) return;

            // if in edit-mode, do not continue but instead replace the tag's text.
            // the scenario is that "addTags" was called from a dropdown suggested option selected while editing

            var hideDropdown = this.settings.dropdown.closeOnSelect,
                selectedOption = this.suggestedListItems[this.getNodeIndex(elm)],
                value = selectedOption.value || selectedOption || this.input.value;


            this.trigger("dropdown:select", value)

            if( this.state.editing )
                this.onEditTagDone(this.state.editing.scope, {...this.state.editing.scope.__tagifyTagData, value, __isValid:true})

            // Tagify instances should re-focus to the input element once an option was selected, to allow continuous typing
            else{
                this.addTags([value], true)
            }

            // todo: consider not doing this on mix-mode
            setTimeout(() => {
                this.DOM.input.focus()
                this.toggleFocusClass(true)
            })

            if( hideDropdown ){
                return this.dropdown.hide.call(this)
            }

            this.dropdown.refilter.call(this)
        },

        /**
         * returns an HTML string of the suggestions' list items
         * @param {string} value string to filter the whitelist by
         * @return {Array} list of filtered whitelist items according to the settings provided and current value
         */
        filterListItems( value ){
            var _s = this.settings,
                list = [],
                whitelist = _s.whitelist,
                suggestionsCount = _s.dropdown.maxItems || Infinity,
                searchKeys = _s.dropdown.searchKeys.concat(["searchBy", "value"]),
                whitelistItem,
                valueIsInWhitelist,
                whitelistItemValueIndex,
                searchBy,
                isDuplicate,
                i = 0;

            if( !value ){
                return (_s.duplicates
                    ? whitelist
                    : whitelist.filter(item => !this.isTagDuplicate( isObject(item) ? item.value : item )) // don't include tags which have already been added.
                ).slice(0, suggestionsCount); // respect "maxItems" dropdown setting
            }

            for( ; i < whitelist.length; i++ ){
                whitelistItem = whitelist[i] instanceof Object ? whitelist[i] : { value:whitelist[i] } //normalize value as an Object
                searchBy = searchKeys.reduce((values, k) => values + " " + (whitelistItem[k]||""), "").toLowerCase()

                whitelistItemValueIndex = _s.dropdown.accentedSearch
                    ? unaccent(searchBy).indexOf(unaccent(value.toLowerCase()))
                    : searchBy.indexOf(value.toLowerCase())

                valueIsInWhitelist = _s.dropdown.fuzzySearch
                    ? whitelistItemValueIndex >= 0
                    : whitelistItemValueIndex == 0;

                isDuplicate = !_s.duplicates && this.isTagDuplicate( isObject(whitelistItem) ? whitelistItem.value : whitelistItem )

                // match for the value within each "whitelist" item
                if( valueIsInWhitelist && !isDuplicate && suggestionsCount-- )
                    list.push(whitelistItem)

                if( suggestionsCount == 0 ) break
            }

            return list;
        },

        /**
         * Creates the dropdown items' HTML
         * @param  {Array} list  [Array of Objects]
         * @return {String}
         */
        createListHTML( optionsArr ){
            return optionsArr.map(item => {
                if( typeof item == 'string' || typeof item == 'number' )
                    item = {value:item}

                var mapValueTo = this.settings.dropdown.mapValueTo,
                    value = (mapValueTo
                        ? typeof mapValueTo == 'function' ? mapValueTo(item) : item[mapValueTo]
                        : item.value),
                    escapedValue = value && typeof value == 'string' ? escapeHTML(value) : value,
                    data = extend({}, item, {value:escapedValue})

                return this.settings.templates.dropdownItem.call(this, data)
            }).join("")
        }
    }
}

// legacy support for changed methods names
Tagify.prototype.removeTag = Tagify.prototype.removeTags