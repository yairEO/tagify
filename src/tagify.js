function Tagify( input, settings ){
    // protection
    if( !input ){
        console.warn('Tagify: ', 'invalid input element ', input)
        return this;
    }

    this.settings = this.extend({}, settings, this.DEFAULTS);
    this.settings.readonly = input.hasAttribute('readonly'); // if "readonly" do not include an "input" element inside the Tags component

    if( input.pattern )
        try { this.settings.pattern = new RegExp(input.pattern) }
        catch(e){}

    // Convert the "delimiters" setting into a REGEX object
    if( this.settings && this.settings.delimiters ){
        try { this.settings.delimiters = new RegExp("[" + this.settings.delimiters + "]", "g") }
        catch(e){}
    }

    this.id = Math.random().toString(36).substr(2,9), // almost-random ID (because, fuck it)
    this.value = []; // An array holding all the (currently used) tags

    // events' callbacks references will be stores here, so events could be unbinded
    this.listeners = {};

    this.DOM = {}; // Store all relevant DOM elements in an Object
    this.extend(this, new this.EventDispatcher(this));
    this.build(input);

    this.events.customBinding.call(this);
    this.events.binding.call(this);
}

Tagify.prototype = {
    DEFAULTS : {
        delimiters          : ",",        // [regex] split tags by any of these delimiters ("null" to cancel) Example: ",| |."
        pattern             : null,       // regex pattern to validate input by. Ex: /[1-9]/
        maxTags             : Infinity,   // maximum number of tags
        callbacks           : {},         // exposed callbacks object to be triggered on certain events
        addTagOnBlur        : true,       // flag - automatically adds the text which was inputed as a tag when blur event happens
        duplicates          : false,      // flag - allow tuplicate tags
        whitelist           : [],         // is this list has any items, then only allow tags from this list
        blacklist           : [],         // a list of non-allowed tags
        enforceWhitelist    : false,      // flag - should ONLY use tags allowed in whitelist
        autoComplete        : true,       // flag - show native suggeestions list as you type
        autoSuggest         : true,       // flag - show native suggeestions list as you type
        suggestionsMinChars : 2,          // minimum characters to input to see sugegstions list
        maxSuggestions      : 10
    },

    customEventsList : ['add', 'remove', 'duplicate', 'maxTagsExceed', 'blacklisted', 'notWhitelisted'],

    /**
     * utility method
     * https://stackoverflow.com/a/35385518/104380
     * @param  {String} s [HTML string]
     * @return {Object}   [DOM node]
     */
    parseHTML(s){
        var t = document.createElement('template');
            t.innerHTML = s.trim();
        return t.content.firstChild;
    },

    // https://stackoverflow.com/a/25396011/104380
    escapeHtml(s){
        var text = document.createTextNode(s);
        var p = document.createElement('p');
        p.appendChild(text);
        return p.innerHTML;
    },

    /**
     * builds the HTML of this component
     * @param  {Object} input [DOM element which would be "transformed" into "Tags"]
     */
    build( input ){
        var that = this,
            value = input.value,
            template = `
                <tags class="${input.className} ${this.settings.readonly ? 'readonly' : ''}">
                    <div contenteditable data-placeholder="${input.placeholder}" class="tagify--input"></div>
                </tags>`;

        this.DOM.originalInput = input;
        this.DOM.scope = this.parseHTML(template);
        this.DOM.input = this.DOM.scope.querySelector('[contenteditable]');
        input.parentNode.insertBefore(this.DOM.scope, input);

        // if "autocomplete" flag on toggeled & "whitelist" has items, build suggestions list
        if( this.settings.autoSuggest && this.settings.whitelist.length ){
            this.dropdown.init.call(this);
        }

        // if the original input already had any value (tags)
        if( value )
            this.addTags(value).forEach(tag => {
                tag && tag.classList.add('tagify--noAnim');
            });
    },

    /**
     * Reverts back any changes made by this component
     */
    destroy(){
        this.DOM.scope.parentNode.removeChild(this.DOM.scope);
    },

    /**
     * Merge two objects into a new one
     */
    extend(o, o1, o2){
        if( !(o instanceof Object) ) o = {};

        if( o2 ){
            copy(o, o2)
            copy(o, o1)
        }
        else
            copy(o, o1)

        function copy(a,b){
            // copy o2 to o
            for( var key in b )
                if( b.hasOwnProperty(key) )
                    a[key] = b[key];
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
                catch(err){
                    e = document.createEvent("Event");
                    e.initEvent("toggle", false, false);
                }
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
                // setup callback references so events could be removed later
                _CBR = (this.listeners.main = this.listeners.main || {
                    paste   : ['input', _CB.onPaste.bind(this)],
                    focus   : ['input', _CB.onFocusBlur.bind(this)],
                    blur    : ['input', _CB.onFocusBlur.bind(this)],
                    keydown : ['input', _CB.onKeydown.bind(this)],
                    click   : ['scope', _CB.onClickScope.bind(this)]
                }),
                action = bindUnbind ? 'addEventListener' : 'removeEventListener';

            for( var eventName in _CBR ){
               this.DOM[_CBR[eventName][0]][action](eventName, _CBR[eventName][1]);
            }

            if( bindUnbind ){
                // this event should never be unbinded
                this.DOM.input.addEventListener("input", _CB.onInput.bind(this));

                if( this.settings.isJQueryPlugin )
                    $(this.DOM.originalInput).on('tagify.removeAllTags', this.removeAllTags.bind(this))
            }
        },

        /**
         * DOM events callbacks
         */
        callbacks : {
            onFocusBlur(e){
                var s = e.target.textContent.trim();

                if( e.type == "focus" ){
                  //  e.target.classList.remove('placeholder');
                }

                else if( e.type == "blur" && s ){
                    this.settings.addTagOnBlur && this.addTags(s, true).length;
                }

                else{
                  //  e.target.classList.add('placeholder');
                    this.DOM.input.removeAttribute('style');
                    this.dropdown.hide.call(this);
                }
            },

            onKeydown(e){
                var s = e.target.textContent,
                    lastTag;

                if( e.key == 'Backspace' && (s == "" || s.charCodeAt(0) == 8203) ){
                    lastTag = this.DOM.scope.querySelectorAll('tag:not(.tagify--hide)');
                    lastTag = lastTag[lastTag.length - 1];
                    this.removeTag( lastTag );
                }

                if( e.key == 'Escape' ){
                    this.input.set.call(this)
                    e.target.blur();
                }

                if( e.key == 'Enter' ){
                    e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                    this.addTags(this.input.value, true)
                }
            },

            onInput(e){
                var value = e.target.textContent.trim(),
                    showSuggestions = value.length >= this.settings.suggestionsMinChars;

                // save the value on the input state object
                this.input.value = value;

                if( value.search(this.settings.delimiters) != -1 ){
                    if( this.addTags( value ).length )
                        this.input.set.call(this); // clear the input field's value
                }
                else if( this.settings.autoSuggest && this.settings.whitelist.length ){
                    this.dropdown[showSuggestions ? "show" : "hide"].call(this, value);
                }
            },

            onPaste(e){
            },

            onClickScope(e){
                if( e.target.tagName == "TAGS" )
                    this.DOM.input.focus();
                else if( e.target.tagName == "X" ){
                    this.removeTag( e.target.parentNode );
                }
            }
        }
    },

    input : {
        value : '',
        set(s = ''){
            this.input.value = this.DOM.input.innerHTML = s;
        }
    },

    getNodeIndex( node ){
        var index = 0;
        while( (node = node.previousSibling) )
            if (node.nodeType != 3 || !/^\s*$/.test(node.data))
                index++;
        return index;
    },

    /**
     * Searches if any tag with a certain value already exis
     * @param  {String} s [text value to search for]
     * @return {boolean}  [found / not found]
     */
    isTagDuplicate(s){
        return this.value.some(item => s.toLowerCase() === item.value.toLowerCase());
    },

    /**
     * Mark a tag element by its value
     * @param  {String / Number} value  [text value to search for]
     * @param  {Object}          tagElm [a specific "tag" element to compare to the other tag elements siblings]
     * @return {boolean}                [found / not found]
     */
    markTagByValue(value, tagElm){
        var tagsElms, tagsElmsLen;

        if( !tagElm ){
            tagsElms = this.DOM.scope.querySelectorAll('tag');
            for( tagsElmsLen = tagsElms.length; tagsElmsLen--; ){
                if( tagsElms[tagsElmsLen].value.toLowerCase().includes(value.toLowerCase()) )
                    tagElm = tagsElms[tagsElmsLen];
            }
        }

        // check AGAIN if "tagElm" is defined
        if( tagElm ){
            tagElm.classList.add('tagify--mark');
            setTimeout(() => { tagElm.classList.remove('tagify--mark') }, 2000);
            return true;
        }

        else{

        }

        return false;
    },

    /**
     * make sure the tag, or words in it, is not in the blacklist
     */
    isTagBlacklisted(v){
        v = v.split(' ');
        return this.settings.blacklist.filter(x =>v.indexOf(x) != -1).length;
    },

    /**
     * make sure the tag, or words in it, is not in the blacklist
     */
    isTagWhitelisted(v){
        return this.settings.whitelist.indexOf(v) != -1;
    },

    /**
     * add a "tag" element to the "tags" component
     * @param {String/Array} tagsItems [A string (single or multiple values with a delimiter), or an Array of Objects]
     * @param {Boolean} clearInput [flag if the input's value should be cleared after adding tags]
     * @return {Array} Array of DOM elements (tags)
     */
    addTags( tagsItems, clearInput ){
        var that = this,
            tagElems = [];

        this.DOM.input.removeAttribute('style');

        /**
         * pre-proccess the tagsItems, which can be a complex tagsItems like an Array of Objects or a string comprised of multiple words
         * so each item should be iterated on and a tag created for.
         * @return {Array} [Array of Objects]
         */
        function normalizeTags(tagsItems){
            var whitelistWithProps = this.settings.whitelist[0] instanceof Object,
                isComplex = tagsItems instanceof Array && "value" in tagsItems[0], // checks if the value is a "complex" which means an Array of Objects, each object is a tag
                result = tagsItems; // the returned result

            // no need to continue if "tagsItems" is an Array of Objects
            if( isComplex )
                return result;

            // search if the tag exists in the whitelist as an Object (has props), to be able to use its properties
            if( !isComplex && typeof tagsItems == "string" && whitelistWithProps ){
                var matchObj = this.settings.whitelist.filter( item => item.value.toLowerCase() == tagsItems.toLowerCase() )

                if( matchObj[0] ){
                    isComplex = true;
                    result = matchObj; // set the Array (with the found Object) as the new value
                }
            }

            // if the value is a "simple" String, ex: "aaa, bbb, ccc"
            if( !isComplex ){
                tagsItems = tagsItems.trim();
                if( !tagsItems ) return [];

                // go over each tag and add it (if there were multiple ones)
                result = tagsItems.split(this.settings.delimiters).map(v => ({ value:v.trim() }));
            }

            return result.filter(n => n); // cleanup the array from "undefined", "false" or empty items;
        }

        /**
         * validate a tag object BEFORE the actual tag will be created & appeneded
         * @param  {Object} tagData  [{"value":"text", "class":whatever", ...}]
         * @return {Boolean/String}  ["true" if validation has passed, String or "false" for any type of error]
         */
        function validateTag( tagData ){
            var value = tagData.value.trim(),
                maxTagsExceed = this.value.length >= this.settings.maxTags,
                isDuplicate,
                eventName__error,
                tagAllowed;

            // check for empty value
            if( !value )
                return "empty";

            // check if pattern should be used and if so, use it to test the value
            if( this.settings.pattern && !(this.settings.pattern.test(value)) )
                return "pattern";

            // check if the tag already exists
            if( this.isTagDuplicate(value) ){
                this.trigger('duplicate', value);

                if( !this.settings.duplicates ){
                    // this.markTagByValue(value, tagElm)
                    return "duplicate";
                }
            }

            // check if the tag is allowed by the rules set
            tagAllowed = !this.isTagBlacklisted(value) && (!this.settings.enforceWhitelist || this.isTagWhitelisted(value)) && !maxTagsExceed;

            // Check against blacklist & whitelist (if enforced)
            if( !tagAllowed ){
                tagData.class = tagData.class ? tagData.class + " tagify--notAllowed" : "tagify--notAllowed";

                // broadcast why the tag was not allowed
                if( maxTagsExceed )                                                        eventName__error = 'maxTagsExceed';
                else if( this.isTagBlacklisted(value) )                                    eventName__error = 'blacklisted';
                else if( this.settings.enforceWhitelist && !this.isTagWhitelisted(value) ) eventName__error = 'notWhitelisted';

                this.trigger(eventName__error, {value:value, index:this.value.length});

                return "notAllowed";
            }

            return true;
        }

        /**
         * appened (validated) tag to the component's DOM scope
         * @return {[type]} [description]
         */
        function appendTag(tagElm){
            this.DOM.scope.insertBefore(tagElm, this.DOM.input);
        }

        //////////////////////
        tagsItems = normalizeTags.call(this, tagsItems);

        tagsItems.forEach(tagData => {
            var isTagValidated = validateTag.call(that, tagData);

            if( isTagValidated === true || isTagValidated == "notAllowed" ){
                // create the tag element
                var tagElm = that.createTagElem(tagData);

                // add the tag to the component's DOM
                appendTag.call(that, tagElm);

                // remove the tag "slowly"
                if( isTagValidated == "notAllowed" ){
                    setTimeout(() => { that.removeTag(tagElm, true) }, 1000);
                }

                else{
                    // update state
                    that.value.push(tagData);
                    that.update();
                    that.trigger('add', that.extend({}, tagData, {index:that.value.length, tag:tagElm}));

                    tagElems.push(tagElm);
                }
            }
        })

        if( tagsItems.length && clearInput ){
            this.input.set.call(this);
        }

        return tagElems
    },

    /**
     * creates a DOM tag element and injects it into the component (this.DOM.scope)
     * @param  Object}  tagData [text value & properties for the created tag]
     * @return {Object} [DOM element]
     */
    createTagElem(tagData){
        var tagElm,
            escapedValue = this.escapeHtml(tagData.value),
            template = `<tag>
                            <x></x><div><span title='${escapedValue}'>${escapedValue}</span></div>
                        </tag>`;

        // for a certain Tag element, add attributes.
        function addTagAttrs(tagElm, tagData){
            var i, keys = Object.keys(tagData);
            for( i=keys.length; i--; ){
                var propName = keys[i];
                if( !tagData.hasOwnProperty(propName) ) return;
                tagElm.setAttribute( propName, tagData[propName] );
            }
        }

        tagElm = this.parseHTML(template);

        // add any attribuets, if exists
        addTagAttrs(tagElm, tagData);

        return tagElm;
    },

    /**
     * Removes a tag
     * @param  {Object}  tagElm    [DOM element]
     * @param  {Boolean} silent    [A flag, which when turned on, does not removes any value and does not update the original input value but simply removes the tag from tagify]
     */
    removeTag( tagElm, silent ){
        var tagData,
            tagIdx = this.getNodeIndex(tagElm);

        if( !tagElm) return;

        tagElm.style.width = parseFloat(window.getComputedStyle(tagElm).width) + 'px';
        document.body.clientTop; // force repaint for the width to take affect before the "hide" class below
        tagElm.classList.add('tagify--hide');

        // manual timeout (hack, since transitionend cannot be used because of hover)
        setTimeout(() => {
            tagElm.parentNode.removeChild(tagElm);
        }, 400);

        if( !silent ){
            tagData = this.value.splice(tagIdx, 1)[0]; // remove the tag from the data object
            this.update(); // update the original input with the current value
            this.trigger('remove', this.extend({}, tagData, {index:tagIdx, tag:tagElm}));
        }
    },

    removeAllTags(){
        this.value = [];
        this.update();
        Array.prototype.slice.call(this.DOM.scope.querySelectorAll('tag')).forEach(elm => elm.parentNode.removeChild(elm));
    },

    /**
     * update the origianl (hidden) input field's value
     */
    update(){
        var tagsAsString = this.value.map(v => v.value).join(',');
        this.DOM.originalInput.value = tagsAsString;
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
            var template = `<div class="tagify__dropdown"></div>`;
            return this.parseHTML(template);
        },

        show( value ){
            var listItems = this.dropdown.filterListItems.call(this, value),
                listHTML = this.dropdown.createListHTML(listItems);

            if( !listItems.length ){
                this.dropdown.hide.call(this);
                return;
            }

            if( this.settings.autoComplete )
                this.DOM.input.setAttribute("data-suggest", listItems[0].substring(value.length));

            this.DOM.dropdown.innerHTML = listHTML

            this.dropdown.position.call(this);

            if( !this.DOM.dropdown.parentNode != document.body ){
                document.body.appendChild(this.DOM.dropdown);
                this.events.binding.call(this, false); // unbind the main events
                this.dropdown.events.binding.call(this);
            }
        },

        hide(){
            if( !this.DOM.dropdown || this.DOM.dropdown.parentNode != document.body ) return;

            this.DOM.input.removeAttribute("data-suggest");

            document.body.removeChild(this.DOM.dropdown);
            window.removeEventListener('resize', this.dropdown.position)

            this.dropdown.events.binding.call(this, false); // unbind all events
            this.events.binding.call(this); // re-bind main events
        },

        position(){
            var rect = this.DOM.scope.getBoundingClientRect();

            this.DOM.dropdown.style.cssText = "left: "  + rect.left + window.pageXOffset + "px; \
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

                window[action]('resize', _CBR.position);
                window[action]('keydown', _CBR.onKeyDown);
                window[action]('click', _CBR.onClick);

                this.DOM.dropdown[action]('mouseover', _CBR.onMouseOver);
              //  this.DOM.dropdown[action]('click', _CBR.onClick);
            },

            callbacks : {
                onKeyDown(e){
                    var selectedElm = this.DOM.dropdown.querySelectorAll("[class$='--active']")[0],
                        newValue = "";

                    switch( e.key ){
                        case 'ArrowDown' :
                        case 'ArrowUp' :
                            e.preventDefault();
                            if( selectedElm )
                                selectedElm = selectedElm[e.key == 'ArrowUp' ? "previousElementSibling" : "nextElementSibling"];

                            // if no element was found, loop
                            else
                                selectedElm = this.DOM.dropdown.children[e.key == 'ArrowUp' ? this.DOM.dropdown.children.length - 1 : 0];

                            this.dropdown.highlightOption.call(this, selectedElm);
                            break;

                        case 'Escape' :
                            this.dropdown.hide.call(this);
                            break;

                        case 'Enter' :
                            e.preventDefault();
                            newValue = selectedElm ? selectedElm.textContent : this.input.value;
                            this.addTags( newValue, true );
                            this.dropdown.hide.call(this);
                            break;

                        case 'ArrowRight' :
                            var suggestion = this.DOM.input.getAttribute('data-suggest');

                            if( suggestion && this.addTags(this.input.value + suggestion).length ){
                                this.input.set.call(this);
                                this.dropdown.hide.call(this);
                            }
                            break;
                    }
                },

                onMouseOver(e){
                    // event delegation check
                    if( e.target.className.includes('__item') )
                        this.dropdown.highlightOption.call(this, e.target);
                },

                onClick(e){
                    if( e.target.className.includes('tagify__dropdown__item') ){
                        this.input.set.call(this)
                        this.addTags( e.target.textContent );
                    }
                    // clicked outside the dropdown, so just close it
                    this.dropdown.hide.call(this);
                }
            }
        },

        highlightOption( elm ){
            if( !elm ) return;
            var className = "tagify__dropdown__item--active";
            this.DOM.dropdown.querySelectorAll("[class$='--active']").forEach(activeElm => activeElm.classList.remove(className));
            elm.classList.add(className);
        },

        /**
         * returns an HTML string of the suggestions' list items
         * @return {[type]} [description]
         */
        filterListItems( value ){
            if( !value ) return "";

            var list = [],
                className = "tagify__dropdown__item",
                whitelist = this.settings.whitelist,
                suggestionsCount = this.settings.maxSuggestions || Infinity,
                whitelistItemValue,
                i = 0;

            for( ; i < whitelist.length; i++ ){
                var whitelistItemValue = whitelist[i] instanceof Object ? whitelist[i].value : whitelist[i],
                    valueIsInWhitelist = whitelistItemValue.toLowerCase().replace(/\s/g, '').indexOf(value.toLowerCase().replace(/\s/g, '')) == 0; // for fuzzy-search use ">="

                // match for the value within each "whitelist" item
                if( valueIsInWhitelist && suggestionsCount-- )
                    list.push(whitelistItemValue);
                if( suggestionsCount == 0 ) break;
            }

            return list;
        },

        /**
         * @param  {Array} list  [Array of strings]
         * @return {Object}      [DOM node]
         */
        createListHTML(list){
            var className = "tagify__dropdown__item";
            return list.map(item => `<div class='${className}'>${item}</div>`).join("");
        }
    }
}
