/**
 * Tagify - Tags input component
 * By Yair Even-Or (2016)
 * Don't sell this code. (c)
 * https://github.com/yairEO/tagify
 */

function Tagify(input){
    this.value = [];
    this.build(input);
    this.events();
}

Tagify.prototype = {
    build : function(input){
        var that = this,
            value = input.value;

        this.DOM = {};
        this.DOM.originalInput = input;
        this.DOM.scope = document.createElement('tags');
        // need to wrap the input with a DIV
        // Chrome bug: http://stackoverflow.com/q/34354085/104380
        this.DOM.scope.innerHTML = '<div><span class="placeholder" data-placeholder="'+ input.placeholder +'" contenteditable></span></div>';
        this.DOM.input = this.DOM.scope.querySelector('span');
        input.parentNode.insertBefore(this.DOM.scope, input);
        this.DOM.scope.appendChild(input);

        if( value )
            this.addTag(value).forEach(function(tag){
                tag.classList.add('tagify--noAnim');
            });
    },

    // DOM events binding
    events : function(){
        this.DOM.input.addEventListener('focus', this.callbacks.onFocusBlur.bind(this));
        this.DOM.input.addEventListener('blur', this.callbacks.onFocusBlur.bind(this));
        this.DOM.input.addEventListener('input', this.callbacks.onInput.bind(this));
        this.DOM.input.addEventListener('keydown', this.callbacks.onKeydown.bind(this));
        this.DOM.scope.addEventListener('click', this.callbacks.onClickScope.bind(this));
    },

    // DOM events callbacks
    callbacks : {
        onFocusBlur : function(e){
            var text =  e.target.textContent.replace(/\u200B/g,'').trim();

            if( e.type == "focus" )
                e.target.className = '';
            else if( e.type == "blur" && text == "" )
                e.target.className = 'placeholder';
        },

        onKeydown : function(e){
            var s = e.target.textContent;
            if( e.key == "Backspace" && (s == "" || s.charCodeAt(0) == 8203) ){
                this.removeTag( this.DOM.scope.querySelectorAll('tag:not(.tagify--hide)').length - 1 );
            }
            if( e.key == "Escape" ){
                e.target.textContent = '';
                e.target.blur();
            }
            if( e.key == "Enter" ){
                e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                this.addTag(s);
                e.target.innerHTML = '';
                return false;
            }
        },

        onInput : function(e){
            var value = e.target.textContent,
                    lastChar = value[value.length - 1];

            if( value.indexOf(',') != -1 ){
                this.addTag( value );
                e.target.textContent = ''; // clear the input field's value
            }
        },

        onClickScope : function(e){
            if( e.target.tagName == "TAGS" )
                this.DOM.input.focus();
            if( e.target.tagName == "TAG" ){
                this.removeTag( this.getNodeindex(e.target) );
            }
        }
    },

    getNodeindex : function( node ){
        var index = 0;
        while( (node = node.previousSibling) )
            if (node.nodeType != 3 || !/^\s*$/.test(node.data))
                index++;
        return index;
    },

    addTag : function( value ){
        var that = this;

        value = value.replace(/\u200B/g,'').trim();
        if( !value ) return;

        return value.split(',').filter(function(v){ return !!v }).map(function(v){
            var tagElm = document.createElement('tag');
            tagElm.textContent = v;
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

        this.value.splice(idx,1);
        this.update();
    },

    // update the origianl (hidden) input field's value
    update : function(){
        this.DOM.originalInput.value = this.value.join(', ');
    }
}
