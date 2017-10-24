/**
 * Tagify (v 1.2.1)- tags input component
 * By Yair Even-Or (2016)
 * Don't sell this code. (c)
 * https://github.com/yairEO/tagify
 */
;(function($){
    // just a jQuery wrapper for the vanilla version of this component
    $.fn.tagify = function(settings){
        var $input = this,
            tagify;

        if( $input.data("tagify") ) // don't continue if already "tagified"
            return this;

        tagify = new Tagify(this[0], settings);
        tagify.isJQueryPlugin = true;
        $input.data("tagify", tagify);

        return this;
    }

function Tagify( input, settings ){
    // protection
    if( !input ){
        console.warn('Tagify: ', 'invalid input element ', input)
        return this;
    }

    this.settings = this.extend({}, settings, this.DEFAULTS);
    this.settings.readonly = input.hasAttribute('readonly'); // if "readonly" do not include an "input" element inside the Tags component

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
        delimiters          : ",",       // [regex] split tags by any of these delimiters
        pattern             : "",         // pattern to validate input by
        callbacks           : {},         // exposed callbacks object to be triggered on certain events
        duplicates          : false,      // flag - allow tuplicate tags
        enforeWhitelist     : false,      // flag - should ONLY use tags allowed in whitelist
        autocomplete        : true,       // flag - show native suggeestions list as you type
        whitelist           : [],         // is this list has any items, then only allow tags from this list
        blacklist           : [],         // a list of non-allowed tags
        maxTags             : Infinity,   // maximum number of tags
        suggestionsMinChars : 2           // minimum characters to input to see sugegstions list
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
        this.DOM.scope.innerHTML = inputHTML;
        this.DOM.input = this.DOM.scope.querySelector('input');

        if( this.settings.readonly )
            this.DOM.scope.classList.add('readonly')

        input.parentNode.insertBefore(this.DOM.scope, input);
        this.DOM.scope.appendChild(input);

        // if "autocomplete" flag on toggeled & "whitelist" has items, build suggestions list
        if( this.settings.autocomplete && this.settings.whitelist.length )
            this.DOM.datalist = this.buildDataList();

        // if the original input already had any value (tags)
        if( value )
            this.addTag(value).forEach(function(tag){
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
                if( this.addTag(text).length )
                    e.target.value = '';
            }
            else{
                e.target.className = 'input placeholder';
                this.DOM.input.removeAttribute('style');
            }
        },

        onKeydown : function(e){
            var s = e.target.value,
                that = this;

            if( e.key == "Backspace" && (s == "" || s.charCodeAt(0) == 8203) ){
                this.removeTag( this.DOM.scope.querySelectorAll('tag:not(.tagify--hide)').length - 1 );
            }
            if( e.key == "Escape" ){
                e.target.value = '';
                e.target.blur();
            }
            if( e.key == "Enter" ){
                e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                if( this.addTag(s).length )
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
                if( this.addTag(value).length )
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
                this.removeTag( this.getNodeIndex(e.target.parentNode) );
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
     * Searches if any tags with a certain value exist and mark them
     * @param  {String / Number} value [description]
     * @return {boolean}               [found / not found]
     */
    markTagByValue : function(value){
        var idx = this.value.filter(function(item){ return value.toLowerCase() === item.toLowerCase() })[0],
            tag = this.DOM.scope.querySelectorAll('tag')[idx];

        if( tag ){
            tag.classList.add('tagify--mark');
            setTimeout(function(){ tag.classList.remove('tagify--mark') }, 2000);
            return true;
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
     * @param  {String} value [A string of a value or multiple values]
     * @return {Array}  Array of DOM elements
     */
    addTag : function( value ){
        var that = this,
            result;

        this.DOM.input.removeAttribute('style');

        value = value.trim();

        if( !value ) return [];

        // go over each tag and add it (if there were multiple ones)
        result = value.split(this.settings.delimiters).filter(function(v){ return !!v }).map(function(v){
            v = v.trim();

            if( that.settings.pattern && !(that.settings.pattern.test(v)) )
                return false;

            var tagElm = document.createElement('tag'),
                isDuplicate = that.markTagByValue(v),
                tagAllowed,
                tagNotAllowedEventName,
                maxTagsExceed = that.value.length >= that.settings.maxTags;

            if( isDuplicate ){
                that.trigger('duplicate', v);
                if( !that.settings.duplicates ){
                    return false;
                }
            }

            tagAllowed = !that.isTagBlacklisted(v) && (!that.settings.enforeWhitelist || that.isTagWhitelisted(v)) && !maxTagsExceed;

            // check against blacklist & whitelist (if enforced)
            if( !tagAllowed ){
                tagElm.classList.add('tagify--notAllowed');
                setTimeout(function(){ that.removeTag(that.getNodeIndex(tagElm), true) }, 1000);

                // broadcast why the tag was not allowed
                if( maxTagsExceed ) tagNotAllowedEventName = 'maxTagsExceed';
                else if( that.isTagBlacklisted(v) ) tagNotAllowedEventName = 'blacklisted';
                else if( that.settings.enforeWhitelist && !that.isTagWhitelisted(v) ) tagNotAllowedEventName = 'notWhitelisted';

                that.trigger(tagNotAllowedEventName, {value:v, index:that.value.length});
            }

            // the space below is important - http://stackoverflow.com/a/19668740/104380
            tagElm.innerHTML = "<x></x><div><span title='"+ v +"'>"+ v +" </span></div>";
            that.DOM.scope.insertBefore(tagElm, that.DOM.input.parentNode);

            if( tagAllowed ){
                that.value.push(v);
                that.update();
                that.trigger('add', {value:v, index:that.value.length});
            }

            return tagElm;
        });

        return result.filter(function(n){ return n });
    },

    /**
     * Removes a tag
     * @param  {Number}  idx    [tag index to be removed]
     * @param  {Boolean} silent [A flag, which when turned on, does not removes any value and does not update the original input value but simply removes the tag from tagify]
     */
    removeTag : function( idx, silent ){
        var tagElm = this.DOM.scope.children[idx];
        if( !tagElm) return;

        tagElm.style.width = parseFloat(window.getComputedStyle(tagElm).width) + 'px';
        document.body.clientTop; // force repaint for the width to take affect before the "hide" class below
        tagElm.classList.add('tagify--hide');

        // manual timeout (hack, since transitionend cannot be used because of hover)
        setTimeout(function(){
            tagElm.parentNode.removeChild(tagElm);
        }, 400);

        if( !silent ){
            this.value.splice(idx, 1); // remove the tag from the data object
            this.update(); // update the original input with the current value
            this.trigger('remove', {value:tagElm.textContent.trim(), index:idx});
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
        this.DOM.originalInput.value = this.value.join(',');
    }
}

})(jQuery);
