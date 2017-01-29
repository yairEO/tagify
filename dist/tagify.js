/**
 * Tagify - jQuery tags input plugin
 * By Yair Even-Or (2016)
 * Don't sell this code. (c)
 * https://github.com/yairEO/tagify
 */
function Tagify( input, settings ){
    // protection
    if( !input ){
        console.warn('Tagify: ', 'invalid input element ', input)
        return this;
    }

    settings = typeof settings == 'object' ? settings : {}; // make sure settings is an 'object'

    this.settings = {
        duplicates      : settings.duplicates || false, // flag - allow tuplicate tags
        enforeWhitelist : settings.enforeWhitelist || false, // flag - should ONLY use tags allowed in whitelist
        autocomplete    : settings.autocomplete || true, // flag - show native suggeestions list as you type
        whitelist       : settings.whitelist || [], // is this list has any items, then only allow tags from this list
        blacklist       : settings.blacklist || [] // a list of non-allowed tags
    };

    this.id = Math.random().toString(36).substr(2,9), // almost-random ID (because, fuck it)
    this.value = []; // An array holding all the (currently used) tags
    this.DOM = {}; // Store all relevant DOM elements in an Object
    this.build(input);
    this.events();
}

Tagify.prototype = {
    build : function( input ){
        var that = this,
            value = input.value;

        this.DOM.originalInput = input;
        this.DOM.scope = document.createElement('tags');
        this.DOM.scope.innerHTML = '<div><input list="tagsSuggestions'+ this.id +'" class="placeholder"/><span>'+ input.placeholder +'</span></div>';

        this.DOM.input = this.DOM.scope.querySelector('input');
        input.parentNode.insertBefore(this.DOM.scope, input);
        this.DOM.scope.appendChild(input);

        // if "autocomplete" flag on toggeled & "whitelist" has items, build suggestions list
        if( this.settings.autocomplete && this.settings.whitelist.length )
            this.buildDataList();

        // if the original input already had any value (tags)
        if( value )
            this.addTag(value).forEach(function(tag){
                tag && tag.classList.add('tagify--noAnim');
            });
    },

    /**
     * DOM events binding
     */
    events : function(){
        var events = {
        //  event name / event callback / element to be listening to
            focus   : ['onFocusBlur'  , 'input'],
            blur    : ['onFocusBlur'  , 'input'],
            input   : ['onInput'      , 'input'],
            keydown : ['onKeydown'    , 'input'],
            click   : ['onClickScope' , 'scope']
        };

        for( var e in events )
            this.DOM[events[e][1]].addEventListener(e, this.callbacks[events[e][0]].bind(this));
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
            var s = e.target.value;
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
        },

        onInput : function(e){
            var value = e.target.value,
                lastChar = value[value.length - 1];

            e.target.style.width = ((e.target.value.length + 1) * 7) + 'px';

            if( value.indexOf(',') != -1 ){
                this.addTag( value );
                e.target.value = ''; // clear the input field's value
            }
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
            datalist = "<datalist id='tagsSuggestions"+ this.id +"'> \
                            <label> \
                                select from the list: \
                                <select> \
                                    <option value=''></option> \
                                    [OPTIONS] \
                                </select> \
                            </label> \
                        </datalist>";

        for( i=this.settings.whitelist.length; i--; )
            OPTIONS += "<option>"+ this.settings.whitelist[i] +"</option>";

        datalist = datalist.replace('[OPTIONS]', OPTIONS); // inject the options string in the right place
        this.DOM.input.insertAdjacentHTML('afterend', datalist); // append the datalist HTML string in the Tags

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

        return value.split(',').filter(function(v){ return !!v }).map(function(v){
            var tagElm = document.createElement('tag');
            v = v.trim();

            if( !that.settings.duplicates && that.markTagByValue(v) )
                return false;

            // check against blacklist & whitelist (if enforced)
            if( that.isTagBlacklisted(v) || (that.settings.enforeWhitelist && !that.isTagWhitelisted(v)) ){
                tagElm.classList.add('tagify--notAllowed');
                setTimeout(function(){ that.removeTag(that.getNodeIndex(tagElm)) }, 1000);
            }

            // the space below is important - http://stackoverflow.com/a/19668740/104380
            tagElm.innerHTML = "<x></x><div><span title='"+ v +"'>"+ v +" </span></div>";
            that.DOM.scope.insertBefore(tagElm, that.DOM.input.parentNode);

            that.value.push(v);
            that.update();
            return tagElm;
        });
    },

    removeTag : function( idx ){
        var tagElm = this.DOM.scope.children[idx];
        if( !tagElm) return;

        tagElm.style.width = parseFloat(window.getComputedStyle(tagElm).width) + 'px';
        document.body.clientTop; // force repaint for the width to take affect before the "hide" class below
        tagElm.classList.add('tagify--hide');

        // manual timeout (hack, since transitionend cannot be used because of hover)
        setTimeout(function(){
            tagElm.parentNode.removeChild(tagElm);
        }, 400);

        this.value.splice(idx, 1);
        this.update();
    },

    // update the origianl (hidden) input field's value
    update : function(){
        this.DOM.originalInput.value = this.value.join(', ');
    }
}
