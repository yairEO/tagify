import { sameStr, removeCollectionProp, omit, isObject, parseHTML, removeTextChildNodes, escapeHTML, extend, concatWithoutDups, getUID, isNodeTag, injectAtCaret, getSetTagData } from './parts/helpers'
import DEFAULTS from './parts/defaults'
import _dropdown, { initDropdown } from './parts/dropdown'
import { getPersistedData, setPersistedData, clearPersistedData } from './parts/persist'
import TEXTS from './parts/texts'
import templates from './parts/templates'
import EventDispatcher from './parts/EventDispatcher'
import events, { triggerChangeEvent } from './parts/events'

/**
 * @constructor
 * @param {Object} input    DOM element
 * @param {Object} settings settings object
 */
function Tagify( input, settings ){
    if( !input ){
        console.warn('Tagify:', 'input element not found', input)
        // return an empty mock of all methods, so the code using tagify will not break
        // because it might be calling methods even though the input element does not exist
        const mockInstance = new Proxy(this, { get(){ return () => mockInstance } })
        return mockInstance
    }

    if( input.__tagify ){
        console.warn('Tagify: ', 'input element is already Tagified - Same instance is returned.', input)
        return input.__tagify
    }

    extend(this, EventDispatcher(this))
    this.isFirefox = (/firefox|fxios/i).test(navigator.userAgent) && !(/seamonkey/i).test(navigator.userAgent)
    this.isIE = window.document.documentMode; // https://developer.mozilla.org/en-US/docs/Web/API/Document/compatMode#Browser_compatibility

    settings = settings || {};
    this.getPersistedData = getPersistedData(settings.id)
    this.setPersistedData = setPersistedData(settings.id)
    this.clearPersistedData = clearPersistedData(settings.id)
    this.applySettings(input, settings)

    this.state = {
        inputText: '',
        editing : false,
        composing: false,
        actions : {},   // UI actions for state-locking
        mixMode : {},
        dropdown: {},
        flaggedTags: {} // in mix-mode, when a string is detetced as potential tag, and the user has chocen to close the suggestions dropdown, keep the record of the tasg here
    }

    this.value = [] // tags' data

    // events' callbacks references will be stores here, so events could be unbinded
    this.listeners = {}

    this.DOM = {} // Store all relevant DOM elements in an Object

    this.build(input)
    initDropdown.call(this)

    this.getCSSVars()
    this.loadOriginalValues()

    this.events.customBinding.call(this)
    this.events.binding.call(this)
    input.autofocus && this.DOM.input.focus()
    input.__tagify = this
}

Tagify.prototype = {
    _dropdown,

    getSetTagData,
    helpers: {sameStr, removeCollectionProp, omit, isObject, parseHTML, escapeHTML, extend, concatWithoutDups, getUID, isNodeTag},

    customEventsList : ['change', 'add', 'remove', 'invalid', 'input', 'click', 'keydown', 'focus', 'blur', 'edit:input', 'edit:beforeUpdate', 'edit:updated', 'edit:start', 'edit:keydown', 'dropdown:show', 'dropdown:hide', 'dropdown:select', 'dropdown:updated', 'dropdown:noMatch', 'dropdown:scroll'],
    dataProps: ['__isValid', '__removed', '__originalData', '__originalHTML', '__tagId'], // internal-uasge props

    trim(text){
        return this.settings.trim && text && typeof text == "string" ? text.trim() : text
    },

    // expose this handy utility function
    parseHTML,

    templates,

    parseTemplate(template, data){
        template = this.settings.templates[template] || template;
        return parseHTML( template.apply(this, data) )
    },

    set whitelist( arr ){
        const isArray = arr && Array.isArray(arr)
        this.settings.whitelist = isArray ? arr : []
        this.setPersistedData(isArray ? arr : [], 'whitelist')
    },

    get whitelist(){
        return this.settings.whitelist
    },

    generateClassSelectors(classNames){
        for( let name in classNames ) {
            let currentName = name;
            Object.defineProperty(classNames, currentName + "Selector" , {
                get(){ return "." + this[currentName].split(" ")[0] }
            })
        }
    },

    applySettings( input, settings ){
        DEFAULTS.templates = this.templates

        var mixModeDefaults = {
            dropdown: {
                position: "text"
            }
        }

        var mergedDefaults = extend({}, DEFAULTS, (settings.mode == 'mix' ? mixModeDefaults : {}));
        var _s = this.settings = extend({}, mergedDefaults, settings)

        _s.disabled = input.hasAttribute('disabled')
        _s.readonly = _s.readonly || input.hasAttribute('readonly')
        _s.placeholder = escapeHTML(input.getAttribute('placeholder') || _s.placeholder || "")
        _s.required = input.hasAttribute('required')

        this.generateClassSelectors(_s.classNames)

        if ( _s.dropdown.includeSelectedTags === undefined )
            _s.dropdown.includeSelectedTags = _s.duplicates;

        if( this.isIE )
            _s.autoComplete = false; // IE goes crazy if this isn't false

        ["whitelist", "blacklist"].forEach(name => {
            var attrVal = input.getAttribute('data-' + name)
            if( attrVal ){
                attrVal = attrVal.split(_s.delimiters)
                if( attrVal instanceof Array )
                    _s[name] = attrVal
            }
        })

        // backward-compatibility for old version of "autoComplete" setting:
        if( "autoComplete" in settings && !isObject(settings.autoComplete) ){
            _s.autoComplete = DEFAULTS.autoComplete
            _s.autoComplete.enabled = settings.autoComplete
        }

        if( _s.mode == 'mix' ){
            _s.pattern = _s.pattern || /@/;
            _s.autoComplete.rightKey = true
            _s.delimiters = settings.delimiters || null // default dlimiters in mix-mode must be NULL

            // needed for "filterListItems". This assumes the user might have forgotten to manually
            // define the same term in "dropdown.searchKeys" as defined in "tagTextProp" setting, so
            // by automatically adding it, tagify is "helping" out, guessing the intesntions of the developer.
            if( _s.tagTextProp && !_s.dropdown.searchKeys.includes(_s.tagTextProp) )
                _s.dropdown.searchKeys.push(_s.tagTextProp)
        }

        if( input.pattern )
            try { _s.pattern = new RegExp(input.pattern)  }
            catch(e){}

        // Convert the "delimiters" setting into a REGEX object
        if( _s.delimiters ){
            _s._delimiters = _s.delimiters;
            try { _s.delimiters = new RegExp(this.settings.delimiters, "g") }
            catch(e){}
        }

        if( _s.disabled )
            _s.userInput = false;

        this.TEXTS = {...TEXTS, ...(_s.texts || {})}

        // make sure the dropdown will be shown on "focus" and not only after typing something (in "select" mode)
        if( (_s.mode == 'select' && !settings.dropdown?.enabled) || !_s.userInput ){
            _s.dropdown.enabled = 0
        }

        _s.dropdown.appendTarget = settings.dropdown?.appendTarget || document.body;


        // get & merge persisted data with current data
        let persistedWhitelist = this.getPersistedData('whitelist');

        if( Array.isArray(persistedWhitelist))
            this.whitelist = Array.isArray(_s.whitelist)
                ? concatWithoutDups(_s.whitelist, persistedWhitelist)
                : persistedWhitelist;
    },

    /**
     * Returns a string of HTML element attributes
     * @param {Object} data [Tag data]
     */
    getAttributes( data ){
        var attrs = this.getCustomAttributes(data), s = '', k;

        for( k in attrs )
            s += " " + k + (data[k] !== undefined ? `="${attrs[k]}"` : "");

        return s;
    },

    /**
     * Returns an object of attributes to be used for the templates
     */
    getCustomAttributes( data ){
        // only items which are objects have properties which can be used as attributes
        if( !isObject(data) )
            return '';

        var output = {}, propName;

        for( propName in data ){
            if( propName.slice(0,2) != '__' && propName != 'class' && data.hasOwnProperty(propName) && data[propName] !== undefined )
                output[propName] = escapeHTML(data[propName])
        }
        return output
    },

    setStateSelection(){
        var selection = window.getSelection()

        // save last selection place to be able to inject anything from outside to that specific place
        var sel = {
            anchorOffset: selection.anchorOffset,
            anchorNode  : selection.anchorNode,
            range       : selection.getRangeAt && selection.rangeCount && selection.getRangeAt(0)
        }

        this.state.selection = sel
        return sel
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
        var DOM  = this.DOM;

        if( this.settings.mixMode.integrated ){
            DOM.originalInput = null;
            DOM.scope = input;
            DOM.input = input;
        }

        else {
            DOM.originalInput = input
            DOM.originalInput_tabIndex = input.tabIndex
            DOM.scope = this.parseTemplate('wrapper', [input, this.settings])
            DOM.input = DOM.scope.querySelector(this.settings.classNames.inputSelector)
            input.parentNode.insertBefore(DOM.scope, input)
            input.tabIndex = -1; // do not allow focus or typing directly, once tagified
        }
    },

    /**
     * revert any changes made by this component
     */
    destroy(){
        this.events.unbindGlobal.call(this)
        this.DOM.scope.parentNode.removeChild(this.DOM.scope)
        this.DOM.originalInput.tabIndex = this.DOM.originalInput_tabIndex
        delete this.DOM.originalInput.__tagify
        this.dropdown.hide(true)
        clearTimeout(this.dropdownHide__bindEventsTimeout)
        clearInterval(this.listeners.main.originalInputValueObserverInterval)
    },

    /**
     * if the original input has any values, add them as tags
     */
    loadOriginalValues( value ){
        var lastChild,
            _s = this.settings

        // temporarily block firing the "change" event on the original input until
        // this method finish removing current value and adding a new one
        this.state.blockChangeEvent = true

        if( value === undefined ){
            const persistedOriginalValue = this.getPersistedData('value')

            // if the field already has a field, trust its the desired
            // one to be rendered and do not use the persisted one
            if( persistedOriginalValue && !this.DOM.originalInput.value )
                value = persistedOriginalValue
            else
                value = _s.mixMode.integrated ? this.DOM.input.textContent : this.DOM.originalInput.value
        }

        this.removeAllTags()

        if( value ){
            if( _s.mode == 'mix' ){
                this.parseMixTags(value)

                lastChild = this.DOM.input.lastChild

                // fixes a Chrome bug, when the last node in `mix-mode` is a tag, the caret appears at the far-top-top, outside the field
                if( !lastChild || lastChild.tagName != 'BR' )
                    this.DOM.input.insertAdjacentHTML('beforeend', '<br>')
            }

            else{
                try{
                    if( JSON.parse(value) instanceof Array )
                        value = JSON.parse(value)
                }
                catch(err){}
                this.addTags(value, true).forEach(tag => tag && tag.classList.add(_s.classNames.tagNoAnimation))
            }
        }

        else
            this.postUpdate()

        this.state.lastOriginalValueReported = _s.mixMode.integrated ? '' : this.DOM.originalInput.value
    },

    cloneEvent(e){
        var clonedEvent = {}
        for( var v in e )
            if( v != 'path' )
                clonedEvent[v] = e[v]
        return clonedEvent
    },

    /**
     * Toogle global loading state on/off
     * Useful when fetching async whitelist while user is typing
     * @param {Boolean} isLoading
     */
    loading( isLoading ){
        this.state.isLoading = isLoading
        // IE11 doesn't support toggle with second parameter
        this.DOM.scope.classList[isLoading ? "add" : "remove"](this.settings.classNames.scopeLoading)
        return this
    },

    /**
     * Toogle a tag loading state on/off
     * @param {Boolean} isLoading
     */
    tagLoading( tagElm, isLoading ){
        if( tagElm )
            // IE11 doesn't support toggle with second parameter
            tagElm.classList[isLoading ? "add" : "remove"](this.settings.classNames.tagLoading)
        return this
    },

    /**
     * Toggles class on the main tagify container ("scope")
     * @param {String} className
     * @param {Boolean} force
     */
    toggleClass( className, force ){
        if( typeof className == 'string' )
            this.DOM.scope.classList.toggle(className, force)
    },

    toggleScopeValidation( validation ){
        var isValid = validation === true || validation === undefined; // initially it is undefined

        if( !this.settings.required && validation && validation === this.TEXTS.empty)
            isValid = true

        this.toggleClass(this.settings.classNames.tagInvalid, !isValid)
        this.DOM.scope.title = isValid ? '' : validation
    },

    toggleFocusClass( force ){
        this.toggleClass(this.settings.classNames.focus, !!force)
    },

    triggerChangeEvent,

    events,

    fixFirefoxLastTagNoCaret(){
        return // seems to be fixed in newer version of FF, so retiring below code (for now)
        // var inputElm = this.DOM.input

        // if( this.isFirefox && inputElm.childNodes.length && inputElm.lastChild.nodeType == 1 ){
        //     inputElm.appendChild(document.createTextNode("\u200b"))
        //     this.setRangeAtStartEnd(true, inputElm)
        //     return true
        // }
    },

    /** https://stackoverflow.com/a/59156872/104380
     * @param {Boolean} start indicating where to place it (start or end of the node)
     * @param {Object}  node  DOM node to place the caret at
     */
    setRangeAtStartEnd( start, node ){
        if( !node ) return;

        start = typeof start == 'number' ? start : !!start
        node = node.lastChild || node;
        var sel = document.getSelection()

        // do not force caret placement if the current selection (focus) is on another element (not this tagify instance)
        if( sel.focusNode instanceof Element && !this.DOM.input.contains(sel.focusNode) ) {
            return true
        }

        try{
            if( sel.rangeCount >= 1 ){
                ['Start', 'End'].forEach(pos =>
                    sel.getRangeAt(0)["set" + pos](node, start ? start : node.length)
                )
            }
        } catch(err){
            // console.warn("Tagify: ", err)
        }
    },

    placeCaretAfterNode( node ){
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
    },

    insertAfterTag( tagElm, newNode ){
        newNode = newNode || this.settings.mixMode.insertAfterTag;

        if( !tagElm || !tagElm.parentNode || !newNode ) return

        newNode = typeof newNode == 'string'
            ? document.createTextNode(newNode)
            : newNode

        tagElm.parentNode.insertBefore(newNode, tagElm.nextSibling)
        return newNode
    },

    // compares all "__originalData" property values with the current "tagData" properties
    // and returns "true" if something changed.
    editTagChangeDetected(tagData) {
        var originalData = tagData.__originalData;

        for( var prop in originalData )
            if( !this.dataProps.includes(prop) && tagData[prop] != originalData[prop] )
                return true

        return false; // not changed
    },

    // returns the node which has the actual tag's content
    getTagTextNode(tagElm){
        return tagElm.querySelector(this.settings.classNames.tagTextSelector)
    },

    // sets the text of a tag
    setTagTextNode(tagElm, HTML){
        this.getTagTextNode(tagElm).innerHTML = escapeHTML(HTML)
    },

    /**
     * Enters a tag into "edit" mode
     * @param {Node} tagElm the tag element to edit. if nothing specified, use last last
     */
    editTag( tagElm, opts ){
        tagElm = tagElm || this.getLastTag()
        opts = opts || {}

        this.dropdown.hide()

        var _s = this.settings,
            editableElm = this.getTagTextNode(tagElm),
            tagIdx = this.getNodeIndex(tagElm),
            tagData = getSetTagData(tagElm),
            _CB = this.events.callbacks,
            that = this,
            isValid = true,
            delayed_onEditTagBlur = function(){
                setTimeout(() => _CB.onEditTagBlur.call(that, that.getTagTextNode(tagElm)))
            }

        if( !editableElm ){
            console.warn('Cannot find element in Tag template: .', _s.classNames.tagTextSelector);
            return;
        }

        if( tagData instanceof Object && "editable" in tagData && !tagData.editable )
            return

        // cache the original data, on the DOM node, before any modification ocurs, for possible revert
        tagData = getSetTagData(tagElm, {
            __originalData: extend({}, tagData),
            __originalHTML: tagElm.cloneNode(true)
        })
        // re-set the tagify custom-prop on the clones element (because cloning removed it)
        getSetTagData(tagData.__originalHTML, tagData.__originalData)

        editableElm.setAttribute('contenteditable', true)
        tagElm.classList.add( _s.classNames.tagEditing )

        editableElm.addEventListener('focus', _CB.onEditTagFocus.bind(this, tagElm))
        editableElm.addEventListener('blur', delayed_onEditTagBlur)
        editableElm.addEventListener('input', _CB.onEditTagInput.bind(this, editableElm))
        editableElm.addEventListener('paste', _CB.onEditTagPaste.bind(this, editableElm))
        editableElm.addEventListener('keydown', e => _CB.onEditTagkeydown.call(this, e, tagElm))
        editableElm.addEventListener('compositionstart', _CB.onCompositionStart.bind(this))
        editableElm.addEventListener('compositionend', _CB.onCompositionEnd.bind(this))

        if( !opts.skipValidation )
            isValid = this.editTagToggleValidity(tagElm)

        editableElm.originalIsValid = isValid

        this.trigger("edit:start", { tag:tagElm, index:tagIdx, data:tagData, isValid })

        editableElm.focus()
        this.setRangeAtStartEnd(false, editableElm) // place the caret at the END of the editable tag text

        return this
    },

    /**
     * If a tag is invalid, for any reason, set its class to "not allowed" (see defaults file)
     * @param {Node} tagElm required
     * @param {Object} tagData optional
     * @returns true if valid, a string (reason) if not
     */
    editTagToggleValidity( tagElm, tagData ){
        var tagData = tagData || getSetTagData(tagElm),
            isValid;

        if( !tagData ){
            console.warn("tag has no data: ", tagElm, tagData)
            return;
        }

        isValid = !("__isValid" in tagData) || tagData.__isValid === true

        if( !isValid ){
            this.removeTagsFromValue(tagElm)
        }

        this.update()

        //this.validateTag(tagData);

        tagElm.classList.toggle(this.settings.classNames.tagNotAllowed, !isValid)
        return tagData.__isValid
    },

    onEditTagDone(tagElm, tagData){
        tagElm = tagElm || this.state.editing.scope
        tagData = tagData || {}

        var eventData = {
            tag         : tagElm,
            index       : this.getNodeIndex(tagElm),
            previousData: getSetTagData(tagElm),
            data        : tagData
        }

        this.trigger("edit:beforeUpdate", eventData, {cloneData:false})

        this.state.editing = false;

        delete tagData.__originalData
        delete tagData.__originalHTML

        if( tagElm && tagData[this.settings.tagTextProp] ){
            tagElm = this.replaceTag(tagElm, tagData)
            this.editTagToggleValidity(tagElm, tagData)

            if( this.settings.a11y.focusableTags )
                tagElm.focus()
            else
                // place caret after edited tag
                this.placeCaretAfterNode(tagElm)
        }

        else if(tagElm)
            this.removeTags(tagElm)

        this.trigger("edit:updated", eventData)
        this.dropdown.hide()

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
            extend( tagData, this.getInvalidTagAttrs(tagData, tagData.__isValid) )

        var newTagElm = this.createTagElem(tagData)

        // update DOM
        tagElm.parentNode.replaceChild(newTagElm, tagElm)
        this.updateValueByDOMTags()
        return newTagElm
    },

    /**
     * update "value" (Array of Objects) by traversing all valid tags
     */
    updateValueByDOMTags(){
        this.value.length = 0;

        [].forEach.call(this.getTagElms(), node => {
            if( node.classList.contains(this.settings.classNames.tagNotAllowed.split(' ')[0]) ) return
            this.value.push( getSetTagData(node) )
        })

        this.update()
    },

    /**
     * injects nodes/text at caret position, which is saved on the "state" when "blur" event gets triggered
     * @param {Node} injectedNode [the node to inject at the caret position]
     * @param {Object} selection [optional range Object. must have "anchorNode" & "anchorOffset"]
     */
    injectAtCaret( injectedNode, range ){
        range = range || this.state.selection?.range

        if( !range && injectedNode ) {
            this.appendMixTags(injectedNode)
            return this;
        }

        injectAtCaret(injectedNode, range)
        this.setRangeAtStartEnd(false, injectedNode)

        this.updateValueByDOMTags() // updates internal "this.value"
        this.update() // updates original input/textarea

        return this
    },

    /**
     * input bridge for accessing & setting
     * @type {Object}
     */
    input : {
        set( s = '', updateDOM = true ){
            var hideDropdown = this.settings.dropdown.closeOnSelect
            this.state.inputText = s

            if( updateDOM )
                this.DOM.input.innerHTML = escapeHTML(""+s);

            if( !s && hideDropdown )
                this.dropdown.hide.bind(this)

            this.input.autocomplete.suggest.call(this);
            this.input.validate.call(this);
        },

        raw(){
            return this.DOM.input.textContent
        },

        /**
         * Marks the tagify's input as "invalid" if the value did not pass "validateTag()"
         */
        validate(){
            var isValid = !this.state.inputText || this.validateTag({value:this.state.inputText}) === true;

            this.DOM.input.classList.toggle(this.settings.classNames.inputInvalid, !isValid)

            return isValid
        },

        // remove any child DOM elements that aren't of type TEXT (like <br>)
        normalize( node ){
            var clone = node || this.DOM.input, //.cloneNode(true),
                v = [];

            // when a text was pasted in FF, the "this.DOM.input" element will have <br> but no newline symbols (\n), and this will
            // result in tags not being properly created if one wishes to create a separate tag per newline.
            clone.childNodes.forEach(n => n.nodeType==3 && v.push(n.nodeValue))
            v = v.join("\n")

            try{
                // "delimiters" might be of a non-regex value, where this will fail ("Tags With Properties" example in demo page):
                v = v.replace(/(?:\r\n|\r|\n)/g, this.settings.delimiters.source.charAt(0))
            }
            catch(err){}

            v = v.replace(/\s/g, ' ')  // replace NBSPs with spaces characters

            return this.trim(v)
        },

        /**
         * suggest the rest of the input's value (via CSS "::after" using "content:attr(...)")
         * @param  {String} s [description]
         */
        autocomplete : {
            suggest( data ){
                if( !this.settings.autoComplete.enabled ) return;

                data = data || {value:''}

                if( typeof data == 'string' )
                    data = {value:data}

                var suggestedText = this.dropdown.getMappedValue(data);

                if( typeof suggestedText === 'number' )
                    return

                var suggestionStart = suggestedText.substr(0, this.state.inputText.length).toLowerCase(),
                    suggestionTrimmed = suggestedText.substring(this.state.inputText.length);


                    if( !suggestedText || !this.state.inputText || suggestionStart != this.state.inputText.toLowerCase() ){
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
                    suggestion = s || (dataSuggest ? this.state.inputText + dataSuggest : null);

                if( suggestion ){
                    if( this.settings.mode == 'mix' ){
                        this.replaceTextWithNode( document.createTextNode(this.state.tag.prefix + suggestion) )
                    }
                    else{
                        this.input.set.call(this, suggestion);
                        this.setRangeAtStartEnd(false, this.DOM.input)
                    }

                    this.input.autocomplete.suggest.call(this);
                    this.dropdown.hide();

                    return true;
                }

                return false;
            }
        }
    },

    /**
     * returns the index of the the tagData within the "this.value" array collection.
     * since values should be unique, it is suffice to only search by "value" property
     * @param {Object} tagData
     */
    getTagIdx( tagData ){
        return this.value.findIndex(item => item.__tagId == (tagData||{}).__tagId )
    },

    getNodeIndex( node ){
        var index = 0;

        if( node )
            while( (node = node.previousElementSibling) )
                index++;

        return index;
    },

    getTagElms( ...classess ){
        var classname = '.' + [...this.settings.classNames.tag.split(' '), ...classess].join('.')
        return [].slice.call(this.DOM.scope.querySelectorAll(classname)) // convert nodeList to Array - https://stackoverflow.com/a/3199627/104380
    },

    /**
     * gets the last non-readonly, not-in-the-proccess-of-removal tag
     */
    getLastTag(){
        var lastTag = this.DOM.scope.querySelectorAll(`${this.settings.classNames.tagSelector}:not(.${this.settings.classNames.tagHide}):not([readonly])`);
        return lastTag[lastTag.length - 1];
    },

    /**
     * Searches if any tag with a certain value already exis
     * @param  {String/Object} value [text value / tag data object]
     * @param  {Boolean} caseSensitive
     * @return {Number}
     */
    isTagDuplicate( value, caseSensitive, tagId ){
        var dupsCount = 0,
            _s = this.settings;

        // duplications are irrelevant for this scenario
        if( _s.mode == 'select' )
            return false

        for( let item of this.value ) {
            let isSameStr = sameStr( this.trim(""+value), item.value, caseSensitive );
            if( isSameStr && tagId != item.__tagId )
                dupsCount++;
        }

        return dupsCount
    },

    getTagIndexByValue( value ){
        var indices = [];

        this.getTagElms().forEach((tagElm, i) => {
            if(  sameStr( this.trim(tagElm.textContent), value, this.settings.dropdown.caseSensitive )  )
                indices.push(i)
        })

        return indices;
    },

    getTagElmByValue( value ){
        var tagIdx = this.getTagIndexByValue(value)[0]
        return this.getTagElms()[tagIdx]
    },

    /**
     * Temporarily marks a tag element (by value or Node argument)
     * @param  {Object} tagElm [a specific "tag" element to compare to the other tag elements siblings]
     */
    flashTag( tagElm ){
        if( tagElm ){
            tagElm.classList.add(this.settings.classNames.tagFlash)
            setTimeout(() => { tagElm.classList.remove(this.settings.classNames.tagFlash) }, 100)
        }
    },

    /**
     * checks if text is in the blacklist
     */
    isTagBlacklisted( v ){
        v = this.trim(v.toLowerCase());
        return this.settings.blacklist.filter(x => (""+x).toLowerCase() == v).length;
    },

    /**
     * checks if text is in the whitelist
     */
    isTagWhitelisted( v ){
        return !!this.getWhitelistItem(v)
        /*
        return this.settings.whitelist.some(item =>
            typeof v == 'string'
                ? sameStr(this.trim(v), (item.value || item))
                : sameStr(JSON.stringify(item), JSON.stringify(v))
        )
        */
    },

    /**
     * Returns the first whitelist item matched, by value (if match found)
     * @param {String} value [text to match by]
     */
    getWhitelistItem( value, prop, whitelist ){
        var result,
            prop = prop || 'value',
            _s = this.settings,
            whitelist = whitelist || _s.whitelist;

        whitelist.some(_wi => {
            var _wiv = typeof _wi == 'string' ? _wi : (_wi[prop] || _wi.value),
                isSameStr = sameStr(_wiv, value, _s.dropdown.caseSensitive, _s.trim)

            if( isSameStr ){
                result = typeof _wi == 'string' ? {value:_wi} : _wi
                return true
            }
        })

        // first iterate the whitelist, try find matches by "value" and if that fails
        // and a "tagTextProp" is set to be other than "value", try that also
        if( !result && prop == 'value' && _s.tagTextProp != 'value' ){
            // if found, adds the first which matches
            result = this.getWhitelistItem(value, _s.tagTextProp, whitelist)
        }

        return result
    },

    /**
     * validate a tag object BEFORE the actual tag will be created & appeneded
     * @param  {String} s
     * @param  {String} uid      [unique ID, to not inclue own tag when cheking for duplicates]
     * @return {Boolean/String}  ["true" if validation has passed, String for a fail]
     */
    validateTag( tagData ){
        var _s = this.settings,
            // when validating a tag in edit-mode, need to take "tagTextProp" into consideration
            prop = "value" in tagData ? "value" : _s.tagTextProp,
            v = this.trim(tagData[prop] + "");

        // check for definitive empty value
        if( !(tagData[prop]+"").trim() )
            return this.TEXTS.empty;

        // check if pattern should be used and if so, use it to test the value
        if( _s.pattern && _s.pattern instanceof RegExp && !(_s.pattern.test(v)) )
            return this.TEXTS.pattern;

        // check for duplicates
        if( !_s.duplicates && this.isTagDuplicate(v, _s.dropdown.caseSensitive, tagData.__tagId) )
            return this.TEXTS.duplicate;

        if( this.isTagBlacklisted(v) || (_s.enforceWhitelist && !this.isTagWhitelisted(v)) )
            return this.TEXTS.notAllowed;

        if( _s.validate )
            return _s.validate(tagData)

        return true
    },

    getInvalidTagAttrs(tagData, validation){
        return {
            "aria-invalid" : true,
            "class": `${tagData.class || ''} ${this.settings.classNames.tagNotAllowed}`.trim(),
            "title": validation
        }
    },

    hasMaxTags(){
        return this.value.length >= this.settings.maxTags
            ? this.TEXTS.exceed
            : false
    },

    setReadonly( toggle, attrribute ){
        var _s = this.settings

        document.activeElement.blur() // exit possible edit-mode
        _s[attrribute || 'readonly'] = toggle
        this.DOM.scope[(toggle ? 'set' : 'remove') + 'Attribute'](attrribute || 'readonly', true)

        this.setContentEditable(!toggle)
    },

    setContentEditable(state){
        if( !this.settings.userInput ) return;
        this.DOM.input.contentEditable = state
        this.DOM.input.tabIndex = !!state ? 0 : -1;
    },

    setDisabled( isDisabled ){
        this.setReadonly(isDisabled, 'disabled')
    },

    /**
     * pre-proccess the tagsItems, which can be a complex tagsItems like an Array of Objects or a string comprised of multiple words
     * so each item should be iterated on and a tag created for.
     * @return {Array} [Array of Objects]
     */
    normalizeTags( tagsItems ){
        var {whitelist, delimiters, mode, tagTextProp} = this.settings,
            whitelistMatches = [],
            whitelistWithProps = whitelist ? whitelist[0] instanceof Object : false,
            // checks if this is a "collection", meanning an Array of Objects
            isArray = Array.isArray(tagsItems),
            isCollection = isArray && tagsItems[0].value,
            mapStringToCollection = s => (s+"").split(delimiters).filter(n => n).map(v => ({ [tagTextProp]:this.trim(v), value:this.trim(v) }))

        if( typeof tagsItems == 'number' )
            tagsItems = tagsItems.toString()

        // if the argument is a "simple" String, ex: "aaa, bbb, ccc"
        if( typeof tagsItems == 'string' ){
            if( !tagsItems.trim() ) return [];

            // go over each tag and add it (if there were multiple ones)
            tagsItems = mapStringToCollection(tagsItems)
        }

        // if is an Array of Strings, convert to an Array of Objects
        else if( isArray ){
            // flatten the 2D array
            tagsItems = [].concat(...tagsItems.map(item => item.value != undefined
                ? item // mapStringToCollection(item.value).map(newItem => ({...item,...newItem}))
                : mapStringToCollection(item)
            ))
        }

        // search if the tag exists in the whitelist as an Object (has props),
        // to be able to use its properties.
        // skip matching collections with whitelist items as they are considered "whole"
        if( whitelistWithProps && !isCollection ){
            tagsItems.forEach(item => {
                var whitelistMatchesValues = whitelistMatches.map(a=>a.value)

                // if suggestions are shown, they are already filtered, so it's easier to use them,
                // because the whitelist might also include items which have already been added
                var filteredList = this.dropdown.filterListItems.call(this, item[tagTextProp], { exact:true })

                if( !this.settings.duplicates )
                    // also filter out items which have already been matched in previous iterations
                    filteredList = filteredList.filter(filteredItem => !whitelistMatchesValues.includes(filteredItem.value))

                // get the best match out of list of possible matches.
                // if there was a single item in the filtered list, use that one
                var matchObj = filteredList.length > 1
                    ? this.getWhitelistItem(item[tagTextProp], tagTextProp, filteredList)
                    : filteredList[0]

                if( matchObj && matchObj instanceof Object ){
                    whitelistMatches.push( matchObj ) // set the Array (with the found Object) as the new value
                }
                else if( mode != 'mix' ){
                    if( item.value == undefined )
                        item.value = item[tagTextProp]
                    whitelistMatches.push(item)
                }
            })

            if( whitelistMatches.length )
                tagsItems = whitelistMatches
        }

        return tagsItems;
    },

    /**
     * Parse the initial value of a textarea (or input) element and generate mixed text w/ tags
     * https://stackoverflow.com/a/57598892/104380
     * @param {String} s
     */
    parseMixTags( s ){
        var {mixTagsInterpolator, duplicates, transformTag, enforceWhitelist, maxTags, tagTextProp} = this.settings,
            tagsDataSet = [];

        s = s.split(mixTagsInterpolator[0]).map((s1, i) => {
            var s2 = s1.split(mixTagsInterpolator[1]),
                preInterpolated = s2[0],
                maxTagsReached = tagsDataSet.length == maxTags,
                textProp,
                tagData,
                tagElm;

            try{
                // skip numbers and go straight to the "catch" statement
                if( preInterpolated == +preInterpolated )
                    throw Error
                tagData = JSON.parse(preInterpolated)
            } catch(err){
                tagData = this.normalizeTags(preInterpolated)[0] || {value:preInterpolated}
            }

            transformTag.call(this, tagData)

            if( !maxTagsReached   &&
                s2.length > 1   &&
                (!enforceWhitelist || this.isTagWhitelisted(tagData.value))   &&
                !(!duplicates && this.isTagDuplicate(tagData.value)) ){

                // in case "tagTextProp" setting is set to other than "value" and this tag does not have this prop
                textProp = tagData[tagTextProp] ? tagTextProp : 'value'
                tagData[textProp] = this.trim(tagData[textProp])

                tagElm = this.createTagElem(tagData)
                tagsDataSet.push( tagData )
                tagElm.classList.add(this.settings.classNames.tagNoAnimation)

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
        this.getTagElms().forEach((elm, idx) => getSetTagData(elm,  tagsDataSet[idx]))
        this.update({withoutChangeEvent:true})
        return s
    },

    /**
     * For mixed-mode: replaces a text starting with a prefix with a wrapper element (tag or something)
     * First there *has* to be a "this.state.tag" which is a string that was just typed and is staring with a prefix
     */
    replaceTextWithNode( newWrapperNode, strToReplace ){
        if( !this.state.tag && !strToReplace ) return;

        strToReplace = strToReplace || this.state.tag.prefix + this.state.tag.value;
        var idx, nodeToReplace,
            selection = this.state.selection || window.getSelection(),
            nodeAtCaret = selection.anchorNode,
            firstSplitOffset = this.state.tag.delimiters ? this.state.tag.delimiters.length : 0;

        // STEP 1: ex. replace #ba with the tag "bart" where "|" is where the caret is:
        // CURRENT STATE: "foo #ba #ba| #ba"

        // split the text node at the index of the caret
        nodeAtCaret.splitText(selection.anchorOffset - firstSplitOffset)

        // node 0: "foo #ba #ba|"
        // node 1: " #ba"

        // get index of LAST occurence of "#ba"
        idx = nodeAtCaret.nodeValue.lastIndexOf(strToReplace)

        if( idx == -1 ) return true;

        nodeToReplace = nodeAtCaret.splitText(idx)

        // node 0: "foo #ba "
        // node 1: "#ba"    <- nodeToReplace

        newWrapperNode && nodeAtCaret.parentNode.replaceChild(newWrapperNode, nodeToReplace)

        // must NOT normalize contenteditable or it will cause unwanted issues:
        // https://monosnap.com/file/ZDVmRvq5upYkidiFedvrwzSswegWk7
        // nodeAtCaret.parentNode.normalize()

        return true;
    },

    /**
     * For selecting a single option (not used for multiple tags, but for "mode:select" only)
     * @param {Object} tagElm   Tag DOM node
     * @param {Object} tagData  Tag data
     */
    selectTag( tagElm, tagData ){
        var _s = this.settings

        if( _s.enforceWhitelist && !this.isTagWhitelisted(tagData.value) )
            return

        this.input.set.call(this, tagData[_s.tagTextProp] || tagData.value, true)

        // place the caret at the end of the input, only if a dropdown option was selected (and not by manually typing another value and clicking "TAB")
        if( this.state.actions.selectOption )
            setTimeout(() => this.setRangeAtStartEnd(false, this.DOM.input))

        var lastTagElm = this.getLastTag()

        if( lastTagElm )
            this.replaceTag(lastTagElm, tagData)
        else
            this.appendTag(tagElm)

        // if( _s.enforceWhitelist )
        //     this.setContentEditable(false);

        this.value[0] = tagData
        this.update()
        this.trigger('add', { tag:tagElm, data:tagData })

        return [tagElm]
    },

    /**
     * add an empty "tag" element in an editable state
     */
    addEmptyTag( initialData ){
        var tagData = extend({ value:"" }, initialData || {}),
            tagElm = this.createTagElem(tagData)

        getSetTagData(tagElm, tagData)

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
    addTags( tagsItems, clearInput, skipInvalid ){
        var tagElems = [],
            _s = this.settings,
            aggregatedinvalidInput = [],
            frag = document.createDocumentFragment()

        skipInvalid = skipInvalid || _s.skipInvalid;

        if( !tagsItems || tagsItems.length == 0 ){
            return tagElems
        }

        // converts Array/String/Object to an Array of Objects
        tagsItems = this.normalizeTags(tagsItems)

        switch( _s.mode ){
            case 'mix': return this.addMixTags(tagsItems)
            case 'select': {
                clearInput = false
                this.removeAllTags()
            }
        }

        this.DOM.input.removeAttribute('style')

        tagsItems.forEach(tagData => {
            var tagElm,
                tagElmParams = {},
                originalData = Object.assign({}, tagData, {value:tagData.value+""});

            // shallow-clone tagData so later modifications will not apply to the source
            tagData = Object.assign({}, originalData)
            _s.transformTag.call(this, tagData)

            tagData.__isValid = this.hasMaxTags() || this.validateTag(tagData)

            if( tagData.__isValid !== true ){
                if( skipInvalid )
                    return

                // originalData is kept because it might be that this tag is invalid because it is a duplicate of another,
                // and if that other tags is edited/deleted, this one should be re-validated and if is no more a duplicate - restored
                extend(tagElmParams, this.getInvalidTagAttrs(tagData, tagData.__isValid), {__preInvalidData:originalData})

                if( tagData.__isValid == this.TEXTS.duplicate )
                    // mark, for a brief moment, the tag (this this one) which THIS CURRENT tag is a duplcate of
                    this.flashTag( this.getTagElmByValue(tagData.value) )

                if( !_s.createInvalidTags ){
                    aggregatedinvalidInput.push(tagData.value)
                    return
                }
            }

            if( 'readonly' in tagData ){
                if( tagData.readonly )
                    tagElmParams["aria-readonly"] = true
                // if "readonly" is "false", remove it from the tagData so it won't be added as an attribute in the template
                else
                    delete tagData.readonly
            }

            // Create tag HTML element
            tagElm = this.createTagElem(tagData, tagElmParams)
            tagElems.push(tagElm)

            // mode-select overrides
            if( _s.mode == 'select' ){
                return this.selectTag(tagElm, tagData)
            }

            // add the tag to the component's DOM
            // this.appendTag(tagElm)
            frag.appendChild(tagElm)

            if( tagData.__isValid && tagData.__isValid === true ){
                // update state
                this.value.push(tagData)
                this.trigger('add', {tag:tagElm, index:this.value.length - 1, data:tagData})
            }
            else{
                this.trigger("invalid", {data:tagData, index:this.value.length, tag:tagElm, message:tagData.__isValid})
                if( !_s.keepInvalidTags )
                    // remove invalid tags (if "keepInvalidTags" is set to "false")
                    setTimeout(() => this.removeTags(tagElm, true), 1000)
            }

            this.dropdown.position() // reposition the dropdown because the just-added tag might cause a new-line
        })

        this.appendTag(frag)
        this.update()

        if( tagsItems.length && clearInput ){
            this.input.set.call(this, _s.createInvalidTags ? '' : aggregatedinvalidInput.join(_s._delimiters))
            this.setRangeAtStartEnd(false, this.DOM.input)
        }

        _s.dropdown.enabled && this.dropdown.refilter()
        return tagElems
    },

    /**
     * Adds a mix-content tag
     * @param {String/Array} tagData    A string (single or multiple values with a delimiter), or an Array of Objects or just Array of Strings
     */
    addMixTags( tagsData ){
        tagsData = this.normalizeTags(tagsData);

        if( tagsData[0].prefix || this.state.tag ){
            return this.prefixedTextToTag(tagsData[0])
        }

        var frag = document.createDocumentFragment()

        tagsData.forEach(tagData => {
            var tagElm = this.createTagElem(tagData)
            frag.appendChild(tagElm)
        })

        this.appendMixTags(frag)

        return frag
    },

    appendMixTags( node ) {
        var selection = !!this.state.selection;

        // if "selection" exists, assumes intention of inecting the new tag at the last
        // saved location of the caret inside "this.DOM.input"
        if( selection ){
            this.injectAtCaret(node)
        }
        // else, create a range and inject the new tag as the last child of "this.DOM.input"
        else{
            this.DOM.input.focus()
            selection = this.setStateSelection()
            selection.range.setStart(this.DOM.input, selection.range.endOffset)
            selection.range.setEnd(this.DOM.input, selection.range.endOffset)
            this.DOM.input.appendChild(node)

            this.updateValueByDOMTags() // updates internal "this.value"
            this.update() // updates original input/textarea
        }
    },

    /**
     * Adds a tag which was activly typed by the user
     * @param {String/Array} tagItem   [A string (single or multiple values with a delimiter), or an Array of Objects or just Array of Strings]
     */
    prefixedTextToTag( tagItem ){
        var _s = this.settings,
            tagElm,
            createdFromDelimiters = this.state.tag.delimiters;

        _s.transformTag.call(this, tagItem)

        tagItem.prefix = tagItem.prefix || this.state.tag ? this.state.tag.prefix : (_s.pattern.source||_s.pattern)[0];

        // TODO: should check if the tag is valid
        tagElm = this.createTagElem(tagItem)

        // tries to replace a taged textNode with a tagElm, and if not able,
        // insert the new tag to the END if "addTags" was called from outside
        if( !this.replaceTextWithNode(tagElm) ){
            this.DOM.input.appendChild(tagElm)
        }

        setTimeout(()=> tagElm.classList.add(this.settings.classNames.tagNoAnimation), 300)

        this.value.push(tagItem)
        this.update()

        if( !createdFromDelimiters ) {
            var elm = this.insertAfterTag(tagElm) || tagElm;
            // a timeout is needed when selecting a tag from the suggestions via mouse.
            // Without it, it seems the caret is placed right after the tag and not after the
            // node which was inserted after the tag (whitespace by default)
            setTimeout(this.placeCaretAfterNode, 0, elm);
        }

        this.state.tag = null
        this.trigger('add', extend({}, {tag:tagElm}, {data:tagItem}))

        return tagElm
    },

    /**
     * appened (validated) tag to the component's DOM scope
     */
    appendTag(tagElm){
        var DOM = this.DOM,
            insertBeforeNode = DOM.input;

        //if( insertBeforeNode === DOM.input )
            DOM.scope.insertBefore(tagElm, insertBeforeNode)
        //else
        //    DOM.scope.appendChild(tagElm)
    },

    /**
     * creates a DOM tag element and injects it into the component (this.DOM.scope)
     * @param  {Object}  tagData [text value & properties for the created tag]
     * @param  {Object}  extraData [properties which are for the HTML template only]
     * @return {Object} [DOM element]
     */
    createTagElem( tagData, extraData ){
        tagData.__tagId = getUID()

        var tagElm,
            templateData = extend({}, tagData, { value:escapeHTML(tagData.value+""), ...extraData });

        // if( this.settings.readonly )
        //     tagData.readonly = true

        tagElm = this.parseTemplate('tag', [templateData, this])

        // crucial for proper caret placement when deleting content. if textNodes are allowed as children of a tag element,
        // a browser bug casues the caret to be misplaced inside the tag element (especially affects "readonly" tags)
        removeTextChildNodes(tagElm)
        // while( tagElm.lastChild.nodeType == 3 )
        //     tagElm.lastChild.parentNode.removeChild(tagElm.lastChild)

        getSetTagData(tagElm, tagData)
        return tagElm
    },

    /**
     * re-check all invalid tags.
     * called after a tag was edited or removed
     */
    reCheckInvalidTags(){
        var _s = this.settings

        this.getTagElms(_s.classNames.tagNotAllowed).forEach((tagElm, i) => {
            var tagData = getSetTagData(tagElm),
                hasMaxTags = this.hasMaxTags(),
                tagValidation = this.validateTag(tagData),
                isValid = tagValidation === true && !hasMaxTags;

            if( _s.mode == 'select' )
                this.toggleScopeValidation(tagValidation)

            // if the tag has become valid
            if( isValid ){
                tagData = tagData.__preInvalidData
                    ? tagData.__preInvalidData
                    : { value:tagData.value }

                return this.replaceTag(tagElm, tagData)
            }

            // if the tag is still invaild, set its title as such (reson of invalid might have changed)
            tagElm.title = hasMaxTags || tagValidation
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
        var tagsToRemove,
            _s = this.settings;

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

            var tagData = getSetTagData(tagElm);

            if( tagElm && tagData && !tagData.readonly ) // make sure it's a tag and not some other node
                // because the DOM node might be removed by async animation, the state will be updated while
                // the node might still be in the DOM, so the "update" method should know which nodes to ignore
                elms.push({
                    node: tagElm,
                    idx: this.getTagIdx(tagData), // this.getNodeIndex(tagElm); // this.getTagIndexByValue(tagElm.textContent)
                    data: getSetTagData(tagElm, {'__removed':true})
                })

            return elms
        }, [])

        tranDuration = typeof tranDuration == "number" ? tranDuration : this.CSSVars.tagHideTransition

        if( _s.mode == 'select' ){
            tranDuration = 0;
            this.input.set.call(this)
        }

        // if only a single tag is to be removed.
        // skip "select" mode because invalid tags are actually set to `this.value`
        if( tagsToRemove.length == 1 && _s.mode != 'select' ){
            if( tagsToRemove[0].node.classList.contains(_s.classNames.tagNotAllowed) )
                silent = true
        }

        if( !tagsToRemove.length )
            return;

        return _s.hooks.beforeRemoveTag(tagsToRemove, {tagify:this})
            .then(() => {
                function removeNode( tag ){
                    if( !tag.node.parentNode ) return

                    tag.node.parentNode.removeChild(tag.node)

                    if( !silent ){
                        // this.removeValueById(tagData.__uid)
                        this.trigger('remove', { tag:tag.node, index:tag.idx, data:tag.data })
                        this.dropdown.refilter()
                        this.dropdown.position()
                        this.DOM.input.normalize() // best-practice when in mix-mode (safe to do always anyways)

                        // check if any of the current tags which might have been marked as "duplicate" should be un-marked
                        if( _s.keepInvalidTags )
                            this.reCheckInvalidTags()

                        // below code is unfinished. it should iterate all currently invalid edited tags, which their edits have not
                        // changed the value yet, and should re-trigger the check, but since nothing has changed, it does not work...
                        // this.getTagElms(_s.classNames.tagEditing).forEach( this.events.callbacks.onEditTagBlur.bind )
                    }
                    else if( _s.keepInvalidTags )
                        this.trigger('remove', { tag:tag.node, index:tag.idx })
                }

                function animation( tag ){
                    tag.node.style.width = parseFloat(window.getComputedStyle(tag.node).width) + 'px'
                    document.body.clientTop // force repaint for the width to take affect before the "hide" class below
                    tag.node.classList.add(_s.classNames.tagHide)

                    // manual timeout (hack, since transitionend cannot be used because of hover)
                    setTimeout(removeNode.bind(this), tranDuration, tag)
                }

                if( tranDuration && tranDuration > 10 && tagsToRemove.length == 1 )
                    animation.call(this, tagsToRemove[0])
                else
                    tagsToRemove.forEach(removeNode.bind(this))

                // update state regardless of animation
                if( !silent ){
                    this.removeTagsFromValue(tagsToRemove.map(tag => tag.node))
                    this.update() // update the original input with the current value

                    if( _s.mode == 'select' )
                        this.setContentEditable(true);
                }
            })
            .catch(reason => {})
    },

    removeTagsFromDOM(){
        [].slice.call(this.getTagElms()).forEach(elm => elm.parentNode.removeChild(elm))
    },

    /**
     * @param {Array/Node} tags to be removed from the this.value array
     */
    removeTagsFromValue( tags ){
        tags = Array.isArray(tags) ? tags : [tags];

        tags.forEach(tag => {
            var tagData = getSetTagData(tag),
                tagIdx = this.getTagIdx(tagData)

            //  delete tagData.__removed

            if( tagIdx > -1 )
                this.value.splice(tagIdx, 1)
        })
    },

    removeAllTags( opts ){
        opts = opts || {}
        this.value = []

        if( this.settings.mode == 'mix' )
            this.DOM.input.innerHTML = ''
        else
            this.removeTagsFromDOM()

        this.dropdown.refilter()
        this.dropdown.position()

        if( this.state.dropdown.visible )
            setTimeout(() => {
                this.DOM.input.focus()
            })

        if( this.settings.mode == 'select' ){
            this.input.set.call(this)
            this.setContentEditable(true)
        }

        // technically for now only "withoutChangeEvent" exists in the opts.
        // if more properties will be added later, only pass what's needed to "update"
        this.update(opts)
    },

    postUpdate(){
        this.state.blockChangeEvent = false

        var _s = this.settings,
            classNames = _s.classNames,
            hasValue = _s.mode == 'mix'
                ? _s.mixMode.integrated
                    ? this.DOM.input.textContent
                    : this.DOM.originalInput.value.trim()
                : this.value.length + this.input.raw.call(this).length;

        this.toggleClass(classNames.hasMaxTags, this.value.length >= _s.maxTags)
        this.toggleClass(classNames.hasNoTags, !this.value.length)
        this.toggleClass(classNames.empty, !hasValue)

        // specifically the "select mode" might have the "invalid" classname set when the field is changed, so it must be toggled on add/remove/edit
        if( _s.mode == 'select' ){
            this.toggleScopeValidation(this.value?.[0]?.__isValid)
        }
    },

    setOriginalInputValue( v ){
        var inputElm = this.DOM.originalInput;

        if( !this.settings.mixMode.integrated ){
            inputElm.value = v
            inputElm.tagifyValue = inputElm.value // must set to "inputElm.value" and not again to "inputValue" because for some reason the browser changes the string afterwards a bit.
            this.setPersistedData(v, 'value')
        }
    },

    /**
     * update the origianl (hidden) input field's value
     * see - https://stackoverflow.com/q/50957841/104380
     */
    update( args ){
        const UPDATE_DELAY = 100
        clearTimeout(this.debouncedUpdateTimeout)
        this.debouncedUpdateTimeout = setTimeout(reallyUpdate.bind(this), UPDATE_DELAY)

        function reallyUpdate() {
            var inputValue = this.getInputValue();

            this.setOriginalInputValue(inputValue)

            if( (!this.settings.onChangeAfterBlur || !(args||{}).withoutChangeEvent) && !this.state.blockChangeEvent )
                this.triggerChangeEvent()

            this.postUpdate()
        }
    },

    getInputValue(){
        var value = this.getCleanValue();

        return this.settings.mode == 'mix'
            ? this.getMixedTagsAsString(value)
            : value.length
                ? this.settings.originalInputValueFormat
                    ? this.settings.originalInputValueFormat(value)
                    : JSON.stringify(value)
                : ""
    },

    /**
     * removes properties from `this.value` which are only used internally
     */
    getCleanValue(v){
        return removeCollectionProp(v || this.value, this.dataProps);
    },

    getMixedTagsAsString(){
        var result = "",
            that = this,
            _s = this.settings,
            originalInputValueFormat = _s.originalInputValueFormat || JSON.stringify,
            _interpolator = _s.mixTagsInterpolator;

        function iterateChildren(rootNode){
            rootNode.childNodes.forEach((node) => {
                if( node.nodeType == 1 ){
                    const tagData = getSetTagData(node);

                    if( node.tagName == 'BR'  ){
                        result += "\r\n";
                    }

                    if( tagData && isNodeTag.call(that, node) ){
                        if( tagData.__removed )
                            return;
                        else
                            result += _interpolator[0] + originalInputValueFormat( omit(tagData, that.dataProps) ) + _interpolator[1]
                    }
                    else if( node.getAttribute('style') || ['B', 'I', 'U'].includes(node.tagName)  )
                        result += node.textContent;

                    else if( node.tagName == 'DIV' || node.tagName == 'P' ){
                        result += "\r\n";
                        //  if( !node.children.length && node.textContent )
                        //  result += node.textContent;
                        iterateChildren(node)
                    }
                }
                else
                    result += node.textContent;
            })
        }

        iterateChildren(this.DOM.input)

        return result;
    }
}

// legacy support for changed methods names
Tagify.prototype.removeTag = Tagify.prototype.removeTags

export default Tagify
