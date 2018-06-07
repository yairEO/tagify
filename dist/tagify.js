/**
 * Tagify (v 1.3.1)- tags input component
 * By Yair Even-Or (2016)
 * Don't sell this code. (c)
 * https://github.com/yairEO/tagify
 */
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Tagify = factory();
  }
}(this, function() {
function Tagify( input, settings ){
    // protection
    if( !input ){
        console.warn('Tagify: ', 'invalid input element ', input)
        return this;
    }

    this.settings = this.extend({}, settings, this.DEFAULTS);
    this.settings.readonly = input.hasAttribute('readonly'); // if "readonly" do not include an "input" element inside the Tags component

    this.legacyFixes();

    if( input.pattern )
        try {
            this.settings.pattern = new RegExp(input.pattern);
        } catch(e){}

    if( settings && settings.delimiters ){
        try {
            this.settings.delimiters = new RegExp("[" + settings.delimiters + "]");
        } catch(e){}
    }

    this.id = Math.random().toString(36).substr(2,9), // almost-random ID (because, fuck it)
    this.value = []; // An array holding all the (currently used) tags
    this.DOM = {}; // Store all relevant DOM elements in an Object
    this.extend(this, new this.EventDispatcher());
    this.build(input);
    this.events();
}

Tagify.prototype = {
    DEFAULTS : {
        delimiters          : ",",        // [regex] split tags by any of these delimiters
        pattern             : "",         // pattern to validate input by
        callbacks           : {},         // exposed callbacks object to be triggered on certain events
        duplicates          : false,      // flag - allow tuplicate tags
        enforceWhitelist    : false,      // flag - should ONLY use tags allowed in whitelist
        autocomplete        : true,       // flag - show native suggeestions list as you type
        whitelist           : [],         // is this list has any items, then only allow tags from this list
        blacklist           : [],         // a list of non-allowed tags
        maxTags             : Infinity,   // maximum number of tags
        suggestionsMinChars : 2,          // minimum characters to input to see sugegstions list
        maxSuggestions      : 10
    },

    /**
     * Fixes which require backword support
     */
    legacyFixes : function(){
        var _s = this.settings;

        // For backwards compatibility with older versions, which use 'enforeWhitelist' instead of 'enforceWhitelist'.
        if( _s.hasOwnProperty("enforeWhitelist") && !_s.hasOwnProperty("enforceWhitelist") ){
            _s["enforceWhitelist"] = _s["enforeWhitelist"];
            delete _s["enforeWhitelist"];
            console.warn("Please update your Tagify settings. The 'enforeWhitelist' property is deprecated and you should be using 'enforceWhitelist'.");
        }
    },

    /**
     * builds the HTML of this component
     * @param  {Object} input [DOM element which would be "transformed" into "Tags"]
     */
    build : function( input ){
        var that = this,
            value = input.value,
            inputHTML = '<div><input list="tagifySuggestions'+ this.id +'" class="placeholder"/><span>'+ input.placeholder +'</span></div>';
        this.DOM.originalInput = input;
        this.DOM.scope = document.createElement('tags');
        input.className && (this.DOM.scope.className = input.className); // copy any class names from the original input element to the Tags element
        this.DOM.scope.innerHTML = inputHTML;
        this.DOM.input = this.DOM.scope.querySelector('input');

        if( this.settings.readonly )
            this.DOM.scope.classList.add('readonly')

        input.parentNode.insertBefore(this.DOM.scope, input);
        this.DOM.scope.appendChild(input);

        // if "autocomplete" flag on toggeled & "whitelist" has items, build suggestions list
        if( this.settings.autocomplete && this.settings.whitelist.length ){
            if( "suggestions" in this )
                this.suggestions.init();
            else
                this.DOM.datalist = this.buildDataList();
        }

        // if the original input already had any value (tags)
        if( value )
            this.addTags(value).forEach(function(tag){
                tag && tag.classList.add('tagify--noAnim');
            });
    },

    /**
     * Reverts back any changes made by this component
     */
    destroy : function(){
        this.DOM.scope.parentNode.appendChild(this.DOM.originalInput);
        this.DOM.scope.parentNode.removeChild(this.DOM.scope);
    },

    /**
     * Merge two objects into a new one
     */
    extend : function(o, o1, o2){
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
    EventDispatcher : function(){
        // Create a DOM EventTarget object
        var target = document.createTextNode('');

        // Pass EventTarget interface calls to DOM EventTarget object
        this.off = target.removeEventListener.bind(target);
        this.on = target.addEventListener.bind(target);
        this.trigger = function(eventName, data){
            var e;
            if( !eventName ) return;

            if( this.isJQueryPlugin )
                $(this.DOM.originalInput).triggerHandler(eventName, [data])
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
    events : function(){
        var that = this,
            events = {
                 //  event name / event callback / element to be listening to
                paste   : ['onPaste'      , 'input'],
                focus   : ['onFocusBlur'  , 'input'],
                blur    : ['onFocusBlur'  , 'input'],
                input   : ['onInput'      , 'input'],
                keydown : ['onKeydown'    , 'input'],
                click   : ['onClickScope' , 'scope']
            },
            customList = ['add', 'remove', 'duplicate', 'maxTagsExceed', 'blacklisted', 'notWhitelisted'];

        for( var e in events )
            this.DOM[events[e][1]].addEventListener(e, this.callbacks[events[e][0]].bind(this));

        customList.forEach(function(name){
            that.on(name, that.settings.callbacks[name])
        })

        if( this.isJQueryPlugin )
            $(this.DOM.originalInput).on('tagify.removeAllTags', this.removeAllTags.bind(this))
    },

    /**
     * DOM events callbacks
     */
    callbacks : {
        onFocusBlur : function(e){
            var text =  e.target.value.trim();

            if( e.type == "focus" )
                e.target.className = 'input';
            else if( e.type == "blur" && text ){
                if( this.addTags(text).length )
                    e.target.value = '';
            }
            else{
                e.target.className = 'input placeholder';
                this.DOM.input.removeAttribute('style');
            }
        },

        onKeydown : function(e){
            var s = e.target.value,
                lastTag,
                that = this;

            if( e.key == "Backspace" && (s == "" || s.charCodeAt(0) == 8203) ){
                lastTag = this.DOM.scope.querySelectorAll('tag:not(.tagify--hide)');
                lastTag = lastTag[lastTag.length - 1];
                this.removeTag( lastTag );
            }
            if( e.key == "Escape" ){
                e.target.value = '';
                e.target.blur();
            }
            if( e.key == "Enter" ){
                e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                if( this.addTags(s).length )
                    e.target.value = '';
                return false;
            }
            else{
                if( this.noneDatalistInput ) clearTimeout(this.noneDatalistInput);
                this.noneDatalistInput = setTimeout(function(){ that.noneDatalistInput = null }, 50);
            }
        },

        onInput : function(e){
            var value = e.target.value,
                lastChar = value[value.length - 1],
                isDatalistInput = !this.noneDatalistInput && value.length > 1,
                showSuggestions = value.length >= this.settings.suggestionsMinChars,
                datalistInDOM;

            e.target.style.width = ((e.target.value.length + 1) * 7) + 'px';


            // if( value.indexOf(',') != -1 || isDatalistInput ){
            if( value.slice().search(this.settings.delimiters) != -1 || isDatalistInput ){
                if( this.addTags(value).length )
                    e.target.value = ''; // clear the input field's value
            }
            else if( this.settings.autocomplete && this.settings.whitelist.length ){
                datalistInDOM = this.DOM.input.parentNode.contains( this.DOM.datalist );

                // if sugegstions should be hidden
                if( !showSuggestions && datalistInDOM )
                    this.DOM.input.parentNode.removeChild(this.DOM.datalist)
                else if( showSuggestions && !datalistInDOM ){
                    this.DOM.input.parentNode.appendChild(this.DOM.datalist)
                }
            }
        },

        onPaste : function(e){
            var that = this;
            if( this.noneDatalistInput ) clearTimeout(this.noneDatalistInput);
            this.noneDatalistInput = setTimeout(function(){ that.noneDatalistInput = null }, 50);
        },

        onClickScope : function(e){
            if( e.target.tagName == "TAGS" )
                this.DOM.input.focus();
            if( e.target.tagName == "X" ){
                this.removeTag( e.target.parentNode );
            }
        }
    },

    /**
     * Build tags suggestions using HTML datalist
     * @return {[type]} [description]
     */
    buildDataList : function(){
        var OPTIONS = "",
            i,
            datalist = document.createElement('datalist');

        datalist.id = 'tagifySuggestions' + this.id;
        datalist.innerHTML = "<label> \
                                select from the list: \
                                <select> \
                                    <option value=''></option> \
                                    [OPTIONS] \
                                </select> \
                            </label>";

        for( i=this.settings.whitelist.length; i--; )
            OPTIONS += "<option>"+ this.settings.whitelist[i] +"</option>";

        datalist.innerHTML = datalist.innerHTML.replace('[OPTIONS]', OPTIONS); // inject the options string in the right place

      //  this.DOM.input.insertAdjacentHTML('afterend', datalist); // append the datalist HTML string in the Tags

        return datalist;
    },

    getNodeIndex : function( node ){
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
    isTagDuplicate : function(s){
        return this.value.some(function(item){ return s.toLowerCase() === item.value.toLowerCase() });
    },

    /**
     * Mark a tag element by its value
     * @param  {String / Number} value  [text value to search for]
     * @param  {Object}          tagElm [a specific "tag" element to compare to the other tag elements siblings]
     * @return {boolean}                [found / not found]
     */
    markTagByValue : function(value, tagElm){
        var tagsElms, tagsElmsLen;

        if( !tagElm ){
            tagsElms = this.DOM.scope.querySelectorAll('tag');
            for( tagsElmsLen = tagsElms.length; tagsElmsLen--; ){
                if( tagsElms[tagsElmsLen].textContent.toLowerCase().includes(value.toLowerCase()) )
                    tagElm = tagsElms[tagsElmsLen];
            }
        }

        // check AGAIN if "tagElm" is defined
        if( tagElm ){
            tagElm.classList.add('tagify--mark');
            setTimeout(function(){ tagElm.classList.remove('tagify--mark') }, 2000);
            return true;
        }

        else{

        }

        return false;
    },

    /**
     * make sure the tag, or words in it, is not in the blacklist
     */
    isTagBlacklisted : function(v){
        v = v.split(' ');
        return this.settings.blacklist.filter(function(x){ return v.indexOf(x) != -1 }).length;
    },

    /**
     * make sure the tag, or words in it, is not in the blacklist
     */
    isTagWhitelisted : function(v){
        return this.settings.whitelist.indexOf(v) != -1;
    },

    /**
     * add a "tag" element to the "tags" component
     * @param  {String/Array} tagsItems [A string (single or multiple values with a delimiter), or an Array of Objects]
     * @return {Array} Array of DOM elements (tags)
     */
    addTags : function( tagsItems ){
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
                var matchObj = this.settings.whitelist.filter(function(item){
                    return item.value.toLowerCase() == tagsItems.toLowerCase();
                })

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
                result = tagsItems.split(this.settings.delimiters).map(function(v){
                    return { value:v.trim() }
                });
            }

            return result.filter(function(n){ return n }); // cleanup the array from "undefined", "false" or empty items;
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
            this.DOM.scope.insertBefore(tagElm, this.DOM.input.parentNode);
        }

        //////////////////////
        tagsItems = normalizeTags.call(this, tagsItems);

        tagsItems.forEach(function(tagData){
            var isTagValidated = validateTag.call(that, tagData);

            if( isTagValidated === true || isTagValidated == "notAllowed" ){
                // create the tag element
                var tagElm = that.createTagElem(tagData);

                // add the tag to the component's DOM
                appendTag.call(that, tagElm);

                // remove the tag "slowly"
                if( isTagValidated == "notAllowed" ){
                    setTimeout(function(){ that.removeTag(tagElm, true) }, 1000);
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

        return tagElems
    },

    /**
     * creates a DOM tag element and injects it into the component (this.DOM.scope)
     * @param  Object}  tagData [text value & properties for the created tag]
     * @return {Object} [DOM element]
     */
    createTagElem : function(tagData){
        var tagElm = document.createElement('tag');

        // for a certain Tag element, add attributes.
        function addTagAttrs(tagElm, tagData){
            var i, keys = Object.keys(tagData);
            for( i=keys.length; i--; ){
                var propName = keys[i];
                if( !tagData.hasOwnProperty(propName) ) return;
                tagElm.setAttribute(propName, tagData[propName] );
            }
        }

        // The space below is important - http://stackoverflow.com/a/19668740/104380
        tagElm.innerHTML = "<x></x><div><span title='"+ tagData.value +"'>"+ tagData.value +" </span></div>";

        // add any attribuets, if exists
        addTagAttrs(tagElm, tagData);

        return tagElm;
    },

    /**
     * Removes a tag
     * @param  {Object}  tagElm    [DOM element]
     * @param  {Boolean} silent    [A flag, which when turned on, does not removes any value and does not update the original input value but simply removes the tag from tagify]
     */
    removeTag : function( tagElm, silent ){
        var tagData,
            tagIdx = this.getNodeIndex(tagElm);

        if( !tagElm) return;

        tagElm.style.width = parseFloat(window.getComputedStyle(tagElm).width) + 'px';
        document.body.clientTop; // force repaint for the width to take affect before the "hide" class below
        tagElm.classList.add('tagify--hide');

        // manual timeout (hack, since transitionend cannot be used because of hover)
        setTimeout(function(){
            tagElm.parentNode.removeChild(tagElm);
        }, 400);

        if( !silent ){
            tagData = this.value.splice(tagIdx, 1)[0]; // remove the tag from the data object
            this.update(); // update the original input with the current value
            this.trigger('remove', this.extend({}, tagData, {index:tagIdx, tag:tagElm}));
        }
    },

    removeAllTags : function(){
        this.value = [];
        this.update();
        Array.prototype.slice.call(this.DOM.scope.querySelectorAll('tag')).forEach(function(elm){
            elm.parentNode.removeChild(elm);
        });
    },

    /**
     * update the origianl (hidden) input field's value
     */
    update : function(){
        var tagsAsString = this.value.map(function(v){ return v.value }).join(',');
        this.DOM.originalInput.value = tagsAsString;
    }
}

return Tagify;
}));
