/**
 * Tagify - tags input component
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
        $input.data("tagify", tagify);

        return this;
    }

function Tagify( input, settings ){
    // protection
    if( !input ){
        console.warn('Tagify: ', 'invalid input element ', input)
        return this;
    }

    settings = typeof settings == 'object' ? settings : {}; // make sure settings is an 'object'

    this.settings = {
        callbacks           : settings.callbacks || {}, // exposed callbacks object to be triggered on certain events
        duplicates          : settings.duplicates || false, // flag - allow tuplicate tags
        enforeWhitelist     : settings.enforeWhitelist || false, // flag - should ONLY use tags allowed in whitelist
        autocomplete        : settings.autocomplete || true, // flag - show native suggeestions list as you type
        whitelist           : settings.whitelist || [], // is this list has any items, then only allow tags from this list
        blacklist           : settings.blacklist || [], // a list of non-allowed tags
        maxTags             : settings.maxTags || Infinity, // maximum number of tags
        suggestionsMinChars : settings.suggestionsMinChars || 2 // minimum characters to input to see sugegstions list
    };

    this.id = Math.random().toString(36).substr(2,9), // almost-random ID (because, fuck it)
    this.value = []; // An array holding all the (currently used) tags
    this.DOM = {}; // Store all relevant DOM elements in an Object
    this.extend(this, new this.EventDispatcher());
    this.build(input);
    this.events();
}

Tagify.prototype = {
    build : function( input ){
        var that = this,
            value = input.value;

        this.DOM.originalInput = input;
        this.DOM.scope = document.createElement('tags');
        this.DOM.scope.innerHTML = '<div><input list="tagifySuggestions'+ this.id +'" class="placeholder"/><span>'+ input.placeholder +'</span></div>';

        this.DOM.input = this.DOM.scope.querySelector('input');
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

    destroy : function(){
        this.DOM.scope.parentNode.appendChild(this.DOM.originalInput);
        this.DOM.scope.parentNode.removeChild(this.DOM.scope);
    },

    /**
     * Merge between 2 objects , adding "o2" keys in "o1"
     */
    extend : function(o1, o2){
        for( var key in o2 )
            if( o2.hasOwnProperty(key) )
                o1[key] = o2[key];
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
            if( !eventName ) return;
            var e = new CustomEvent(eventName, {"detail":data});
            target.dispatchEvent(e);
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
    },

    /**
     * DOM events callbacks
     */
    callbacks : {
        onFocusBlur : function(e){
            var text =  e.target.value.trim();

            if( e.type == "focus" )
                e.target.className = 'input';
            else if( e.type == "blur" && text == "" ){
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
                if( this.addTag(s) )
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

            if( value.indexOf(',') != -1 || isDatalistInput ){
                this.addTag( value );
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

    markTagByValue : function(value){
        var tagIdx = this.value.findIndex(function(item){ return value.toLowerCase() === item.toLowerCase() }),
            tag = this.DOM.scope.querySelectorAll('tag')[tagIdx];

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

    addTag : function( value ){
        var that = this;

        this.DOM.input.removeAttribute('style');

        value = value.trim();
        if( !value ) return;

        // go over each tag and add it (if there were multiple ones)
        return value.split(',').filter(function(v){ return !!v }).map(function(v){
            v = v.trim();

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
                that.trigger('add', {value:value, index:that.value.length});
            }

            return tagElm;
        });
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

    // update the origianl (hidden) input field's value
    update : function(){
        this.DOM.originalInput.value = this.value.join(', ');
    }
}

})(jQuery);
