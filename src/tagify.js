function Tagify( input, settings ){
    // protection
    if( !input ){
        console.warn('Tagify: ', 'invalid input element ', input)
        return this;
    }

    this.applySettings(input, settings);

    this.state = {};
    this.value = []; // tags' data

    // events' callbacks references will be stores here, so events could be unbinded
    this.listeners = {};

    this.DOM = {}; // Store all relevant DOM elements in an Object
    this.extend(this, new this.EventDispatcher(this));
    this.build(input);
    this.loadOriginalValues();

    this.events.customBinding.call(this);
    this.events.binding.call(this);
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
        autoComplete        : true,           // Flag - tries to autocomplete the input's value while typing
        mixTagsAllowedAfter : /,|\.|\:|\s/,   // RegEx - Define conditions in which mix-tags content is allowing a tag to be added after
        backspace           : true,           // false / true / "edit"
        skipInvalid         : false,
        transformTag        : ()=>{},
        dropdown            : {
            classname    : '',
            enabled      : 2,    // minimum input characters needs to be typed for the dropdown to show
            maxItems     : 10,
            itemTemplate : '',
            fuzzySearch  : true
        }
    },

    templates : {
        wrapper(input, settings){
            return `<tags class="tagify ${settings.mode ? "tagify--mix" : "" } ${input.className}"
                          ${settings.readonly ? 'readonly aria-readonly="true"' : 'aria-haspopup="true" aria-expanded="false"'}
                          role="tagslist">
                <span contenteditable data-placeholder="${input.placeholder || '&#8203;'}" aria-placeholder="${input.placeholder || ''}"
                      class="tagify__input"
                      role="textbox"
                      aria-multiline="false"></span>
            </tags>`
        },

        tag(v, tagData){
            return `<tag title='${tagData.title || v}'
                         contenteditable='false'
                         spellcheck='false'
                         class='tagify__tag ${tagData.class ? tagData.class : ""}'
                         ${this.getAttributes(tagData)}>
                <x title='' class='tagify__tag__removeBtn' role='button' aria-label='remove tag'></x>
                <div>
                    <span class='tagify__tag-text'>${v}</span>
                </div>
            </tag>`
        },

        dropdownItem( item ){
            var sanitizedValue = (item.value || item).replace(/`|'/g, "&#39;");
            return `<div ${this.getAttributes(item)}
                         class='tagify__dropdown__item ${item.class ? item.class : ""}'
                         tabindex="0"
                         role="menuitem"
                         aria-labelledby="dropdown-label">${sanitizedValue}</div>`;
        }
    },

    customEventsList : ['click', 'add', 'remove', 'invalid', 'input', 'edit'],

    applySettings( input, settings ){
        var attr__whitelist = input.getAttribute('data-whitelist'),
            attr__blacklist = input.getAttribute('data-blacklist');

        this.DEFAULTS.templates = this.templates;
        this.DEFAULTS.dropdown.itemTemplate = this.templates.dropdownItem; // regression fallback

        this.settings = this.extend({}, this.DEFAULTS, settings);
        this.settings.readonly = input.hasAttribute('readonly'); // if "readonly" do not include an "input" element inside the Tags component

        if( this.isIE )
            this.settings.autoComplete = false; // IE goes crazy if this isn't false

        if( attr__blacklist ){
            attr__blacklist = attr__blacklist.split(this.settings.delimiters);
            if( attr__blacklist instanceof Array )
                this.settings.blacklist = attr__blacklist;
        }

        if( attr__whitelist ){
            attr__whitelist = attr__whitelist.split(this.settings.delimiters)
            if( attr__whitelist instanceof Array )
                this.settings.whitelist = attr__whitelist;
        }

        if( input.pattern )
            try { this.settings.pattern = new RegExp(input.pattern)  }
            catch(e){}

        // Convert the "delimiters" setting into a REGEX object
        if( this.settings && this.settings.delimiters ){
            try { this.settings.delimiters = new RegExp(this.settings.delimiters, "g") }
            catch(e){}
        }
    },

    /**
     * utility method
     * https://stackoverflow.com/a/35385518/104380
     * @param  {String} s [HTML string]
     * @return {Object}   [DOM node]
     */
    parseHTML( s ){
        var parser = new DOMParser(),
            node   = parser.parseFromString(s.trim(), "text/html");

        return node.body.firstElementChild;
    },

    /**
     * utility method
     * https://stackoverflow.com/a/25396011/104380
     */
    escapeHTML( s ){
        var text = document.createTextNode(s),
            p    = document.createElement('p');

        p.appendChild(text);
        return p.innerHTML;
    },

    /**
     * builds the HTML of this component
     * @param  {Object} input [DOM element which would be "transformed" into "Tags"]
     */
    build( input ){
        var that = this,
            DOM  = this.DOM,
            template = this.settings.templates.wrapper(input, this.settings);

        DOM.originalInput = input;
        DOM.scope = this.parseHTML(template);
        DOM.input = DOM.scope.querySelector('[contenteditable]');
        input.parentNode.insertBefore(DOM.scope, input);

        if( this.settings.dropdown.enabled >= 0 ){
            this.dropdown.init.call(this);
        }
    },

    /**
     * revert any changes made by this component
     */
    destroy(){
        this.DOM.scope.parentNode.removeChild(this.DOM.scope);
        this.dropdown.hide.call(this, true);
    },

    /**
     * if the original input had any values, add them as tags
     */
    loadOriginalValues( value = this.DOM.originalInput.value ){
        // if the original input already had any value (tags)
        if( !value ) return;

        this.removeAllTags();

        try{ value = JSON.parse(value) }
        catch(err){}

        if( this.settings.mode == 'mix' ){
            this.parseMixTags(value);
        }

        else
            this.addTags(value).forEach(tag => {
                tag && tag.classList.add('tagify--noAnim');
            });
    },

    /**
     * merge two objects into a new one
     * TEST: extend({}, {a:{foo:1}, b:[]}, {a:{bar:2}, b:[1], c:()=>{}})
     */
    extend(o, o1, o2){
        if( !(o instanceof Object) ) o = {};

        copy(o, o1);
        if( o2 )
            copy(o, o2)

        function isObject(obj) {
            var type = Object.prototype.toString.call(obj).split(' ')[1].slice(0, -1);
            return obj === Object(obj) && type != 'Array' && type != 'Function' && type != 'RegExp' && type != 'HTMLUnknownElement';
        };

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
    },

    /**
     * A constructor for exposing events to the outside
     */
    EventDispatcher( instance ){
        // Create a DOM EventTarget object
        var target = document.createTextNode('');

        // Pass EventTarget interface calls to DOM EventTarget object
        this.off = function(name, cb){
            if( cb )
                target.removeEventListener.call(target, name, cb);
            return this;
        };

        this.on = function(name, cb){
            if( cb )
                target.addEventListener.call(target, name, cb);
            return this;
        };

        this.trigger = function(eventName, data){
            var e;
            if( !eventName ) return;

            if( instance.settings.isJQueryPlugin ){
                $(instance.DOM.originalInput).triggerHandler(eventName, [data])
            }
            else{
                try {
                    e = new CustomEvent(eventName, {"detail":data});
                }
                catch(err){ console.warn(err) }
                target.dispatchEvent(e);
            }
        }
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

            if( bindUnbind && !this.listeners.main ){
                // this event should never be unbinded
                // IE cannot register "input" events on contenteditable elements, so the "keydown" should be used instead..
                this.DOM.input.addEventListener(this.isIE ? "keydown" : "input", _CB[this.isIE ? "onInputIE" : "onInput"].bind(this));

                if( this.settings.isJQueryPlugin )
                    $(this.DOM.originalInput).on('tagify.removeAllTags', this.removeAllTags.bind(this))
            }

            // setup callback references so events could be removed later
            _CBR = (this.listeners.main = this.listeners.main || {
                paste    : ['input', _CB.onPaste.bind(this)],
                focus    : ['input', _CB.onFocusBlur.bind(this)],
                blur     : ['input', _CB.onFocusBlur.bind(this)],
                keydown  : ['input', _CB.onKeydown.bind(this)],
                click    : ['scope', _CB.onClickScope.bind(this)],
                dblclick : ['scope', _CB.onDoubleClickScope.bind(this)]
            });

            for( var eventName in _CBR ){
                this.DOM[_CBR[eventName][0]][action](eventName, _CBR[eventName][1]);
            }
        },

        /**
         * DOM events callbacks
         */
        callbacks : {
            onFocusBlur(e){
                var s = e.target.textContent.trim();

                if( this.settings.mode == 'mix' ) return;

                if( e.type == "focus" ){
                    this.DOM.scope.classList.add('tagify--focus')
                    //  e.target.classList.remove('placeholder');
                    if( this.settings.dropdown.enabled === 0 ){
                        this.dropdown.show.call(this);
                    }
                }

                else if( e.type == "blur" ){
                    this.DOM.scope.classList.remove('tagify--focus');
                    s && this.settings.addTagOnBlur && this.addTags(s, true).length;
                }

                else{
                    //  e.target.classList.add('placeholder');
                    this.DOM.input.removeAttribute('style');
                    this.dropdown.hide.call(this);
                }
            },

            onKeydown(e){
                var s = e.target.textContent,
                    lastTag, tags;

                if( this.settings.mode == 'mix' ){
                    switch( e.key ){
                        case 'Delete':
                        case 'Backspace' :
                            var values = [];
                            // find out which tag(s) were deleted and update "this.value" accordingly
                            tags = this.DOM.input.children;
                            // a delay is in need before the node actually is ditached from the document
                            setTimeout(()=>{
                                // iterate over the list of tags still in the document and then filter only those from the "this.value" collection
                                [].forEach.call( tags, tagElm => values.push(tagElm.getAttribute('value')) )
                                this.value = this.value.filter(d => values.indexOf(d.value) != -1);
                            }, 20)
                            break;

                        case 'Enter' :
                            e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                    }

                    return true;
                }

                switch( e.key ){
                    case 'Backspace' :
                        if( s == "" || s.charCodeAt(0) == 8203 ){  // 8203: ZERO WIDTH SPACE unicode
                            if( this.settings.backspace === true )
                                this.removeTag();
                            else if( this.settings.backspace == 'edit' )
                                this.editTag()
                        }
                        break;

                    case 'Esc' :
                    case 'Escape' :
                        this.input.set.call(this)
                        e.target.blur();
                        break;

                    case 'ArrowRight' :
                    case 'Tab' :
                        if( !s ) return true;

                    case 'Enter' :
                        e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                        this.addTags(this.input.value || s, true)
                }
            },

            onInput(e){
                var value = this.input.normalize.call(this),
                    showSuggestions = value.length >= this.settings.dropdown.enabled,
                    data = {value, inputElm:this.DOM.input};

                if( this.settings.mode == 'mix' )
                    return this.events.callbacks.onMixTagsInput.call(this, e);

                if( !value ){
                    this.input.set.call(this, '');
                    return;
                }

                if( this.input.value == value ) return; // for IE; since IE doesn't have an "input" event so "keyDown" is used instead

                data.isValid = this.validateTag.call(this, value);

                // save the value on the input's State object
                this.input.set.call(this, value, false); // update the input with the normalized value and run validations
                // this.input.setRangeAtStartEnd.call(this); // fix caret position

                this.trigger("input", data);

                if( value.search(this.settings.delimiters) != -1 ){
                    if( this.addTags( value ).length ){
                        this.input.set.call(this); // clear the input field's value
                    }
                }
                else if( this.settings.dropdown.enabled >= 0 ){
                    this.dropdown[showSuggestions ? "show" : "hide"].call(this, value);
                }
            },

            onMixTagsInput( e ){
                var sel, range, split, tag, showSuggestions, eventData = {};

                if( this.maxTagsReached() )
                    return true;

                if( window.getSelection ){
                    sel = window.getSelection();
                    if( sel.rangeCount > 0 ){
                        range = sel.getRangeAt(0).cloneRange();
                        range.collapse(true);
                        range.setStart(window.getSelection().focusNode, 0);

                        split = range.toString().split(this.settings.mixTagsAllowedAfter);  // ["foo", "bar", "@a"]

                        tag = split[split.length-1].match(this.settings.pattern);

                        if( tag ){
                            this.state.tag = {
                                prefix : tag[0],
                                value  : tag.input.split(tag[0])[1],
                            }

                            tag = this.state.tag;
                            showSuggestions = this.state.tag.value.length >= this.settings.dropdown.enabled
                        }
                    }
                }

                this.update();
                this.trigger("input", this.extend({}, this.state.tag, {textContent:this.DOM.input.textContent}));

                if( this.state.tag ){
                    this.dropdown[showSuggestions ? "show" : "hide"].call(this, this.state.tag.value);
                }
            },

            onInputIE(e){
                var _this = this;
                // for the "e.target.textContent" to be changed, the browser requires a small delay
                setTimeout(function(){
                    _this.events.callbacks.onInput.call(_this, e)
                })
            },

            onPaste(e){
            },

            onClickScope(e){
                var tagElm = e.target.closest('tag'), tagElmIdx;

                if( e.target.tagName == "TAGS" )
                    this.DOM.input.focus();

                else if( e.target.tagName == "X" )
                    this.removeTag( e.target.parentNode );

                else if( tagElm ){
                    tagElmIdx = this.getNodeIndex(tagElm);
                    this.trigger("click", { tag:tagElm, index:tagElmIdx, data:this.value[tagElmIdx] });
                }
            },

            onEditTagInput( editableElm ){
                var tagElm = editableElm.closest('tag'),
                    tagElmIdx = this.getNodeIndex(tagElm),
                    value = this.input.normalize(editableElm),
                    isValid = value.toLowerCase() == editableElm.originalValue.toLowerCase() || this.validateTag(value);

                tagElm.classList.toggle('tagify--invalid', isValid !== true);
                tagElm.isValid = isValid;
                this.trigger("input", { tag:tagElm, index:tagElmIdx, data:this.extend({}, this.value[tagElmIdx], {newValue:value}) });
            },

            onEditTagBlur( editableElm ){
                var tagElm = editableElm.closest('tag'),
                    tagElmIdx = this.getNodeIndex(tagElm),
                    value = this.input.normalize(editableElm) || editableElm.originalValue,
                    hasChanged = this.input.normalize(editableElm) != editableElm.originalValue,
                    isValid = tagElm.isValid,
                    tagData = {...this.value[tagElmIdx], value},
                    clone;

                if( hasChanged ){
                    this.settings.transformTag.call(this, tagData);
                    // re-validate after tag transformation
                    isValid = this.validateTag(tagData.value);
                }

                if( isValid !== undefined && isValid !== true )
                    return;

                // undo if empty
                editableElm.textContent = tagData.value;

                // update data
                this.value[tagElmIdx].value = tagData.value;
                this.update();

                // cleanup (clone node to remove events)
                clone = editableElm.cloneNode(true);
                clone.removeAttribute('contenteditable');

                tagElm.title = tagData.value;
                tagElm.classList.remove('tagify--editable');
                // remove all events from the "editTag" method
                editableElm.parentNode.replaceChild(clone, editableElm);
                this.trigger("edit", { tag:tagElm, index:tagElmIdx, data:this.value[tagElmIdx] });
            },

            onEditTagkeydown(e){
                switch( e.key ){
                    case 'Esc' :
                    case 'Escape' :
                        e.target.textContent = e.target.originalValue;

                    case 'Enter' :
                    case 'Tab' :
                        e.preventDefault();
                        e.target.blur();
                }
            },

            onDoubleClickScope(e){
                var tagElm = e.target.closest('tag'),
                    _s = this.settings,
                    isEditingTag = tagElm.classList.contains('tagify--editable'),
                    isReadyOnlyTag = tagElm.hasAttribute('readonly')

                if( _s.mode != 'mix' && !_s.readonly && !_s.enforceWhitelist && tagElm && !isEditingTag && !isReadyOnlyTag )
                    this.editTag(tagElm);
            }
        }
    },

    editTag( tagElm = this.getLastTag() ){
        var editableElm = tagElm.querySelector('.tagify__tag-text'),
            _CB = this.events.callbacks;

        if( !editableElm ){
            console.warn('Cannot find element in Tag template: ', '.tagify__tag-text');
            return;
        }

        tagElm.classList.add('tagify--editable');
        editableElm.originalValue = editableElm.textContent;
        editableElm.setAttribute('contenteditable', true);

        editableElm.addEventListener('blur', _CB.onEditTagBlur.bind(this, editableElm));
        editableElm.addEventListener('input', _CB.onEditTagInput.bind(this, editableElm));
        editableElm.addEventListener('keydown', e => _CB.onEditTagkeydown.call(this, e));

        editableElm.focus();
    },

    /**
     * input bridge for accessing & setting
     * @type {Object}
     */
    input : {
        value : '',
        set( s = '', updateDOM = true ){
            this.input.value = s;

            if( updateDOM )     this.DOM.input.innerHTML = s;
            if( !s )            this.dropdown.hide.call(this);
            if( s.length < 2 )  this.input.autocomplete.suggest.call(this, '');

            this.input.validate.call(this);
        },

        // https://stackoverflow.com/a/3866442/104380
        setRangeAtStartEnd( start=false, node ){
            var range, selection;

            if( !document.createRange ) return;

            range = document.createRange();
            range.selectNodeContents(node || this.DOM.input);
            range.collapse(start);
            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        },

        /**
         * Marks the tagify's input as "invalid" if the value did not pass "validateTag()"
         */
        validate(){
            var isValid = !this.input.value || this.validateTag.call(this, this.input.value);
            this.DOM.input.classList.toggle('tagify__input--invalid', isValid !== true);
        },

        // remove any child DOM elements that aren't of type TEXT (like <br>)
        normalize( node = this.DOM.input ){
            var clone = node, //.cloneNode(true),
                v = clone.innerText;

            if( "settings" in this && this.settings.delimiters )
                v = v.replace(/(?:\r\n|\r|\n)/g, this.settings.delimiters.source.charAt(1));

            v = v.replace(/\s/g, ' ')  // replace NBSPs with spaces characters
                 .replace(/^\s+/, ""); // trimLeft

            return v;
        },

        /**
         * suggest the rest of the input's value (via CSS "::after" using "content:attr(...)")
         * @param  {String} s [description]
         */
        autocomplete : {
            suggest( s ){
                if( !s || !this.input.value )
                    this.DOM.input.removeAttribute("data-suggest");
                else
                    this.DOM.input.setAttribute("data-suggest", s.substring(this.input.value.length));
            },
            set( s ){
                var dataSuggest = this.DOM.input.getAttribute('data-suggest'),
                    suggestion = s || (dataSuggest ? this.input.value + dataSuggest : null);

                if( suggestion ){
                    this.input.set.call(this, suggestion);
                    this.input.autocomplete.suggest.call(this, '');
                    this.dropdown.hide.call(this);
                    this.input.setRangeAtStartEnd.call(this);

                    return true;
                }

                return false;
                // if( suggestion && this.addTags(this.input.value + suggestion).length ){
                //     this.input.set.call(this);
                //     this.dropdown.hide.call(this);
                // }
            }
        }
    },

    getNodeIndex( node ){
        var index = 0;

        if( node )
            while( (node = node.previousElementSibling) )
                index++;

        return index;
    },

    getTagElms(){
        return this.DOM.scope.querySelectorAll('tag')
    },

    getLastTag(){
        var lastTag = this.DOM.scope.querySelectorAll('tag:not(.tagify--hide):not([readonly])');
        return lastTag[lastTag.length - 1];
    },

    /**
     * Searches if any tag with a certain value already exis
     * @param  {String} s [text value to search for]
     * @return {int}      [Position index of the tag. -1 is returned if tag is not found.]
     */
    isTagDuplicate( s ){
        return this.value.findIndex(item => s.trim().toLowerCase() === item.value.toLowerCase());
        // return this.value.some(item => s.toLowerCase() === item.value.toLowerCase());
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
        var tagIdx = this.getTagIndexByValue(value)[0];
        return this.getTagElms()[tagIdx];
    },

    /**
     * Mark a tag element by its value
     * @param  {String / Number} value  [text value to search for]
     * @param  {Object}          tagElm [a specific "tag" element to compare to the other tag elements siblings]
     * @return {boolean}                [found / not found]
     */
    markTagByValue( value, tagElm ){
        var tagsElms, tagsElmsLen

        tagElm = tagElm || this.getTagElmByValue(value);

        // check AGAIN if "tagElm" is defined
        if( tagElm ){
            tagElm.classList.add('tagify--mark');
         //   setTimeout(() => { tagElm.classList.remove('tagify--mark') }, 100);
            return tagElm;
        }

        return false;
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
        return this.settings.whitelist.some(item => {
            if( (item.value || item).toLowerCase() === v.toLowerCase() )
                return true;
        });
    },

    /**
     * validate a tag object BEFORE the actual tag will be created & appeneded
     * @param  {String} s
     * @return {Boolean/String}  ["true" if validation has passed, String for a fail]
     */
    validateTag( s ){
        var value = s.trim(),
            result = true;

        // check for empty value
        if( !value )
            result = this.TEXTS.empty;
        // check if pattern should be used and if so, use it to test the value
        else if( this.settings.pattern && !(this.settings.pattern.test(value)) )
            result = this.TEXTS.pattern;

        // if duplicates are not allowed and there is a duplicate
        else if( !this.settings.duplicates && this.isTagDuplicate(value) !== -1 )
            result = this.TEXTS.duplicate;

        else if( this.isTagBlacklisted(value) ||(this.settings.enforceWhitelist && !this.isTagWhitelisted(value)) )
            result = this.TEXTS.notAllowed;

        return result;
    },

    maxTagsReached(){
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
            isCollection = tagsItems instanceof Array && tagsItems[0] instanceof Object && "value" in tagsItems[0],
            temp = [],
            mapStringToCollection = s => s.split(delimiters).filter(n => n).map(v => ({ value:v.trim() }))

        // no need to continue if "tagsItems" is an Array of Objects
        if (isCollection){
            // iterate the collection items and check for values that can be splitted into multiple tags
            tagsItems = [].concat(...tagsItems.map(item => mapStringToCollection(item.value).map(newItem => ({...item,...newItem})) ));
            return tagsItems;
        }

        if( typeof tagsItems == 'number' )
            tagsItems = tagsItems.toString();

        // if the value is a "simple" String, ex: "aaa, bbb, ccc"
        if( typeof tagsItems == 'string' ){
            if( !tagsItems.trim() ) return [];

            // go over each tag and add it (if there were multiple ones)
            tagsItems = mapStringToCollection(tagsItems);
        }

        else if( !isCollection && tagsItems instanceof Array ){
            tagsItems = [].concat(...tagsItems.map(item => mapStringToCollection(item)));
        }

        // search if the tag exists in the whitelist as an Object (has props), to be able to use its properties
        if( whitelistWithProps ){
            tagsItems.forEach(item => {
                var matchObj = whitelist.filter( WL_item => WL_item.value.toLowerCase() == item.value.toLowerCase() )
                if( matchObj[0] )
                    temp.push( matchObj[0] ); // set the Array (with the found Object) as the new value
                else if( mode != 'mix' )
                    temp.push(item)
            })

            tagsItems = temp;
        }

        return tagsItems;
    },

    parseMixTags( s ){
        var collect = false,
            match = "",
            parsedMatch,
            value = s,
            html = s,
            tagData;

        for( let i = 0; i < s.length; i++ ){
            if( s[i] == '[' && s[i] == s[i+1])
                collect = true;

            if (collect)
                match += s[i];

            if( s[i] == ']' && s[i] == s[i-1]){
                collect = false;

                parsedMatch = match.slice(2).slice(0, -2);

                if( this.isTagWhitelisted(parsedMatch) && !this.settings.duplicates && this.isTagDuplicate(parsedMatch) == -1 ){
                    tagData = this.normalizeTags.call(this, parsedMatch)[0];
                    html = this.replaceMixStringWithTag(html, match, tagData).html;
                  //  value = value.replace(match, "[[" + tagData.value + "]]")
                }

                match = "";
            }
        }

        this.DOM.input.innerHTML = html;
        this.update();
        return s;
    },

    /**
     * [replaceMixStringWithTag description]
     * @param  {String} html    [tagify input string, probably from a textarea]
     * @param  {String} tag     [tag string to replace with tag element]
     * @param  {Object} tagData [value, plus any other optional attributes]
     * @return {Object}         [HTML string & tag DOM object]
     */
    replaceMixStringWithTag( html, tag, tagData, tagElm ){
        if( tagData && html && html.indexOf(tag) != -1 ){
            tagElm = this.createTagElem(tagData);
            this.value.push(tagData);
            html = html.replace(tag, tagElm.outerHTML + "&#8288;") // put a zero-space at the end so the caret won't jump back to the start (when the last input child is a tag)
        }

        return {html, tagElm};
    },

    /**
     * Add a tag where it might be beside textNodes
     */
    addMixTag( tagData ){
        if( !tagData || !this.state.tag ) return;

        var tag = this.state.tag.prefix + this.state.tag.value,
            iter = document.createNodeIterator(this.DOM.input, NodeFilter.SHOW_TEXT),
            textnode,
            tagElm,
            idx,
            maxLoops = 100,
            replacedNode;

        while( textnode = iter.nextNode() ){
            if( !maxLoops-- ) break;
            if( textnode.nodeType === Node.TEXT_NODE ){
                // get the index of which the tag (string) is within the textNode (if at all)
                idx = textnode.nodeValue.indexOf(tag);
                if( idx == -1 ) continue;

                replacedNode = textnode.splitText(idx);

                this.settings.transformTag.call(this, tagData);
                tagElm = this.createTagElem(tagData);
                // clean up the tag's string and put tag element instead
                replacedNode.nodeValue = replacedNode.nodeValue.replace(tag, '');
                textnode.parentNode.insertBefore(tagElm, replacedNode);
                tagElm.insertAdjacentHTML('afterend', '&#8288;');
            }
        }

        if( tagElm ){
            this.value.push(tagData);
            this.update();
            this.trigger('add', this.extend({}, {index:this.value.length, tag:tagElm}, tagData));
        }

        this.state.tag = null;
    },

    /**
     * add a "tag" element to the "tags" component
     * @param {String/Array} tagsItems   [A string (single or multiple values with a delimiter), or an Array of Objects or just Array of Strings]
     * @param {Boolean}      clearInput  [flag if the input's value should be cleared after adding tags]
     * @param {Boolean}      skipInvalid [do not add, mark & remove invalid tags]
     * @return {Array} Array of DOM elements (tags)
     */
    addTags( tagsItems, clearInput, skipInvalid = this.settings.skipInvalid ){
        var tagElems = [];

        if( !tagsItems || !tagsItems.length ){
            console.warn('[addTags]', 'no tags to add:', tagsItems)
            return tagElems;
        }

        tagsItems = this.normalizeTags.call(this, tagsItems); // converts Array/String/Object to an Array of Objects

        if( this.settings.mode == 'mix' )
            return this.addMixTag(tagsItems[0]);

        this.DOM.input.removeAttribute('style');

        tagsItems.forEach(tagData => {
            var tagValidation,
                tagElm,
                tagElmParams = {}

            // shallow-clone tagData so later modifications will not apply to the source
            tagData = Object.assign({}, tagData);

            this.settings.transformTag.call(this, tagData);

///////////////// ( validation )//////////////////////
            tagValidation = this.maxTagsReached() || this.validateTag.call(this, tagData.value);

            if( tagValidation !== true ){
                if( skipInvalid )
                    return

                tagElmParams["aria-invalid"] = true
                tagElmParams.class = (tagData.class || '') + ' tagify--notAllowed';
                tagElmParams.title = tagValidation;

                this.markTagByValue(tagData.value);
                this.trigger("invalid", {data:tagData, index:this.value.length, message:tagValidation});
            }
///////////////////////////)//////////////////////////

            // add accessibility attributes
            tagElmParams.role = "tag";

            if( tagData.readonly )
                tagElmParams["aria-readonly"] = true

            // Create tag HTML element
            tagElm = this.createTagElem( this.extend({}, tagData, tagElmParams) );
            tagElems.push(tagElm);

            // add the tag to the component's DOM
            appendTag.call(this, tagElm);

            if( tagValidation === true ){
                // update state
                this.value.push(tagData);
                this.update();
                this.trigger('add', { tag:tagElm, index:this.value.length - 1, data:tagData });
            }
            else if( !this.settings.keepInvalidTags ){
                // remove invalid tags (if "keepInvalidTags" is set to "false")
                setTimeout(() => { this.removeTag(tagElm, true) }, 1000);
            }
        })

        if( tagsItems.length && clearInput ){
            this.input.set.call(this);
        }

        /**
         * appened (validated) tag to the component's DOM scope
         * @return {[type]} [description]
         */
        function appendTag(tagElm){
            var insertBeforeNode = this.DOM.scope.lastElementChild;

            if( insertBeforeNode === this.DOM.input )
                this.DOM.scope.insertBefore(tagElm, insertBeforeNode);
            else
                this.DOM.scope.appendChild(tagElm);
        }

        return tagElems
    },

    minify( html ){
        return html.replace( new RegExp( "\>[\r\n ]+\<" , "g" ) , "><" );
    },

    /**
     * creates a DOM tag element and injects it into the component (this.DOM.scope)
     * @param  {Object}  tagData [text value & properties for the created tag]
     * @return {Object} [DOM element]
     */
    createTagElem( tagData ){
        var tagElm,
            v = this.escapeHTML(tagData.value),
            template = this.settings.templates.tag.call(this, v, tagData);

        if( this.settings.readonly )
            tagData.readonly = true;

        template = this.minify(template);
        tagElm = this.parseHTML(template);

        return tagElm;
    },

    /**
     * Removes a tag
     * @param  {Object|String}  tagElm          [DOM element or a String value. if undefined or null, remove last added tag]
     * @param  {Boolean}        silent          [A flag, which when turned on, does not removes any value and does not update the original input value but simply removes the tag from tagify]
     * @param  {Number}         tranDuration    [Transition duration in MS]
     */
    removeTag( tagElm = this.getLastTag(), silent, tranDuration = 250 ){
        if( typeof tagElm == 'string' )
            tagElm = this.getTagElmByValue(tagElm)

        if( !(tagElm instanceof HTMLElement) )
            return;

        var tagData,
            tagIdx = this.getNodeIndex(tagElm); // this.getTagIndexByValue(tagElm.textContent)

        if( tranDuration && tranDuration > 10 ) animation()
        else removeNode();

        if( !silent ){
            tagData = this.value.splice(tagIdx, 1)[0]; // remove the tag from the data object
            this.update() // update the original input with the current value
            this.trigger('remove', { tag:tagElm, index:tagIdx, data:tagData });
            this.dropdown.render.call(this);
        }

        function animation(){
            tagElm.style.width = parseFloat(window.getComputedStyle(tagElm).width) + 'px';
            document.body.clientTop; // force repaint for the width to take affect before the "hide" class below
            tagElm.classList.add('tagify--hide');

            // manual timeout (hack, since transitionend cannot be used because of hover)
            setTimeout(removeNode, 400);
        }

        function removeNode(){
            if( !tagElm.parentNode ) return
            tagElm.parentNode.removeChild(tagElm)
        }
    },

    removeAllTags(){
        this.value = [];
        this.update();
        Array.prototype.slice.call(this.getTagElms()).forEach(elm => elm.parentNode.removeChild(elm));
    },

    getAttributes( data ){
        // only items which are objects have properties which can be used as attributes
        if( Object.prototype.toString.call(data) != "[object Object]" )
            return '';

        var keys = Object.keys(data),
            s = "",
            propName,
            i;

        for( i=keys.length; i--; ){
            propName = keys[i];
            if( propName != 'class' && data.hasOwnProperty(propName) )
                s += " " + propName + (data[propName] ? `="${data[propName]}"` : "");
        }
        return s;
    },

    preUpdate(){
        this.DOM.scope.classList.toggle('hasMaxTags',  this.value.length >= this.settings.maxTags)
    },

    /**
     * update the origianl (hidden) input field's value
     * see - https://stackoverflow.com/q/50957841/104380
     */
    update(){
        this.preUpdate()

        this.DOM.originalInput.value = this.settings.mode == 'mix'
            ? this.getMixedTagsAsString()
            : this.value.length
                ? JSON.stringify(this.value)
                : ""
    },

    getMixedTagsAsString(){
        var result = "";

        this.DOM.input.childNodes.forEach((node, i) => {
            if( node.nodeType == 1 ){
                if( node.classList.contains("tagify__tag") )
                    result += "[[" + node.getAttribute("value") + "]]"
            }
            else
                result += node.textContent;
        })

        return result;
    },

    /**
     * Dropdown controller
     * @type {Object}
     */
    dropdown : {
        init(){
            this.DOM.dropdown = this.dropdown.build.call(this);
        },

        build(){
            var {position, classname} = this.settings.dropdown,
                _className = `${position == 'manual' ? "" : "tagify__dropdown"} ${classname}`.trim(),
                template = `<div class="${_className}" role="menu"></div>`;
            return this.parseHTML(template);
        },

        show( value ){
            var listHTML,
                isManual = this.settings.dropdown.position == 'manual';

            if( !this.settings.whitelist.length ) return;

            // if no value was supplied, show all the "whitelist" items in the dropdown
            // @type [Array] listItems
            // TODO: add a Setting to control items' sort order for "listItems"
            this.suggestedListItems = this.dropdown.filterListItems.call(this, value);

            // hide suggestions list if no suggestions were matched
            if( !this.suggestedListItems.length ){
                this.input.autocomplete.suggest.call(this);
                this.dropdown.hide.call(this);
                return;
            }

            listHTML = this.dropdown.createListHTML.call(this, this.suggestedListItems);

            this.DOM.dropdown.innerHTML = this.minify(listHTML);
            // if "enforceWhitelist" is "true", highlight the first suggested item
            this.settings.enforceWhitelist && !isManual && this.dropdown.highlightOption.call(this, this.DOM.dropdown.querySelector('.tagify__dropdown__item'));
            this.DOM.scope.setAttribute("aria-expanded", true)

            this.trigger("dropdown:show", this.DOM.dropdown);

            // if the dropdown has yet to be appended to the document,
            // append the dropdown to the body element & handle events
            if( !document.body.contains(this.DOM.dropdown) ){
                if( !isManual ){
                    this.dropdown.position.call(this);
                    document.body.appendChild(this.DOM.dropdown);
                    this.events.binding.call(this, false); // unbind the main events
                }

                this.dropdown.events.binding.call(this);
            }
        },

        hide( force ){
            var {scope, dropdown} = this.DOM,
                isManual = this.settings.dropdown.position == 'manual' && !force;

            if( !dropdown || !document.body.contains(dropdown) || isManual ) return;

            window.removeEventListener('resize', this.dropdown.position)

            this.dropdown.events.binding.call(this, false); // unbind all events
            this.events.binding.call(this); // re-bind main events

            scope.setAttribute("aria-expanded", false)
            dropdown.parentNode.removeChild(dropdown);

            this.trigger("dropdown:hide", dropdown);
        },

        /**
         * renders data into the suggestions list (mainly used to update the list when removing tags, so they will be re-added to the list. not efficient)
         */
        render(){
            this.suggestedListItems = this.dropdown.filterListItems.call(this, '');
            var listHTML = this.dropdown.createListHTML.call(this, this.suggestedListItems);
            this.DOM.dropdown.innerHTML = this.minify(listHTML);
        },

        position(){
            var rect = this.DOM.scope.getBoundingClientRect();

            this.DOM.dropdown.style.cssText = "left: "  + (rect.left + window.pageXOffset) + "px; \
                                               top: "   + (rect.top + rect.height - 1 + window.pageYOffset)  + "px; \
                                               width: " + rect.width + "px";
        },

        /**
         * @type {Object}
         */
        events : {

            /**
             * Events should only be binded when the dropdown is rendered and removed when isn't
             * @param  {Boolean} bindUnbind [optional. true when wanting to unbind all the events]
             * @return {[type]}             [description]
             */
            binding( bindUnbind = true ){
                    // references to the ".bind()" methods must be saved so they could be unbinded later
                var _CBR = (this.listeners.dropdown = this.listeners.dropdown || {
                        position     : this.dropdown.position.bind(this),
                        onKeyDown    : this.dropdown.events.callbacks.onKeyDown.bind(this),
                        onMouseOver  : this.dropdown.events.callbacks.onMouseOver.bind(this),
                        onClick      : this.dropdown.events.callbacks.onClick.bind(this)
                    }),
                    action = bindUnbind ? 'addEventListener' : 'removeEventListener';

                if( this.settings.dropdown.position != 'manual' ){
                    window[action]('resize', _CBR.position);
                    window[action]('keydown', _CBR.onKeyDown);
                }

                window[action]('mousedown', _CBR.onClick);

                this.DOM.dropdown[action]('mouseover', _CBR.onMouseOver);
              //  this.DOM.dropdown[action]('click', _CBR.onClick);
            },

            callbacks : {
                onKeyDown(e){
                    // get the "active" element, and if there was none (yet) active, use first child
                    var activeListElm = this.DOM.dropdown.querySelector("[class$='--active']"),
                        selectedElm = activeListElm || this.DOM.dropdown.children[0],
                        newValue = "";

                    switch( e.key ){
                        case 'ArrowDown' :
                        case 'ArrowUp' :
                        case 'Down' :  // >IE11
                        case 'Up' :    // >IE11
                            e.preventDefault();
                            if( selectedElm )
                                selectedElm = selectedElm[(e.key == 'ArrowUp' || e.key == 'Up' ? "previous" : "next") + "ElementSibling"];

                            // if no element was found, loop
                            if( !selectedElm )
                                selectedElm = this.DOM.dropdown.children[e.key == 'ArrowUp' || e.key == 'Up' ? this.DOM.dropdown.children.length - 1 : 0];

                            this.dropdown.highlightOption.call(this, selectedElm, true);
                            break;

                        case 'Escape' :
                        case 'Esc': // IE11
                            this.dropdown.hide.call(this);
                            break;

                        case 'ArrowRight' :
                        case 'Tab' :
                            e.preventDefault();
                            if( !this.input.autocomplete.set.call(this, selectedElm ? selectedElm.textContent : null) )
                                return false;
                        case 'Enter' :
                            e.preventDefault();
                            if( activeListElm ){
                                newValue = this.suggestedListItems[this.getNodeIndex(activeListElm)] || this.input.value;
                                this.addTags( [newValue], true );
                                this.dropdown.hide.call(this);
                                setTimeout(() => this.DOM.input.focus(), 100);
                                return false;
                            }
                            else{
                                this.addTags(this.input.value, true)
                            }
                    }
                },

                onMouseOver(e){
                    // event delegation check
                    if( e.target.className.includes('__item') )
                        this.dropdown.highlightOption.call(this, e.target);
                },

                onClick(e){
                    var value,
                        listItemElm;

                    if( e.button != 0 || e.target == this.DOM.dropdown ) return; // allow only mouse left-clicks

                    listItemElm = e.target.closest(".tagify__dropdown__item");

                    if( listItemElm ){
                        value = this.suggestedListItems[this.getNodeIndex(listItemElm)] || this.input.value;
                        this.addTags([value], true);

                        setTimeout(() => this.DOM.input.focus(), 100);
                    }

                    this.dropdown.hide.call(this);
                }
            }
        },

        highlightOption( elm, adjustScroll ){
            if( !elm ) return;

            var className = "tagify__dropdown__item--active",
                value;

            // focus casues a bug in Firefox with the placeholder been shown on the input element
            // if( this.settings.dropdown.position != 'manual' )
            //     elm.focus();

            this.DOM.dropdown.querySelectorAll("[class$='--active']").forEach(activeElm => {
                activeElm.classList.remove(className)
                activeElm.removeAttribute("aria-selected")
            })


           // this.DOM.dropdown.querySelectorAll("[class$='--active']").forEach(activeElm => activeElm.classList.remove(className));
            elm.classList.add(className);
            elm.setAttribute("aria-selected", true)

            if( adjustScroll )
                elm.parentNode.scrollTop = elm.clientHeight + elm.offsetTop - elm.parentNode.clientHeight

            // set the first item from the suggestions list as the autocomplete value
            if( this.settings.autoComplete && !this.settings.dropdown.fuzzySearch ){
                value = this.suggestedListItems[this.getNodeIndex(elm)].value || this.input.value;
                this.input.autocomplete.suggest.call(this, value);
            }
        },

        /**
         * returns an HTML string of the suggestions' list items
         * @return {[type]} [description]
         */
        filterListItems( value ){
            var list = [],
                whitelist = this.settings.whitelist,
                suggestionsCount = this.settings.dropdown.maxItems || Infinity,
                whitelistItem,
                valueIsInWhitelist,
                whitelistItemValueIndex,
                searchBy,
                isDuplicate,
                i = 0;

            if( !value ){
                return whitelist
                    .filter(item => this.isTagDuplicate(item.value || item) == -1 ) // don't include tags which have already been added.
                    .slice(0, suggestionsCount); // respect "maxItems" dropdown setting
            }

            for( ; i < whitelist.length; i++ ){
                whitelistItem = whitelist[i] instanceof Object ? whitelist[i] : { value:whitelist[i] }; //normalize value as an Object
                searchBy = ((whitelistItem.searchBy || '') + ' ' + whitelistItem.value).toLowerCase();
                whitelistItemValueIndex = searchBy.indexOf( value.toLowerCase() );

                valueIsInWhitelist = this.settings.dropdown.fuzzySearch
                    ? whitelistItemValueIndex >= 0
                    : whitelistItemValueIndex == 0;

                isDuplicate = !this.settings.duplicates && this.isTagDuplicate(whitelistItem.value) > -1;

                // match for the value within each "whitelist" item
                if( valueIsInWhitelist && !isDuplicate && suggestionsCount-- )
                    list.push(whitelistItem);

                if( suggestionsCount == 0 ) break;
            }

            return list;
        },

        /**
         * Creates the dropdown items' HTML
         * @param  {Array} list  [Array of Objects]
         * @return {String}
         */
        createListHTML( list ){
            var getItem = this.settings.templates.dropdownItem.bind(this);

            return list.map(getItem).join("");
        }
    }
}
