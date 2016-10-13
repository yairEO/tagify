/**
 * Tagify - jQuery tags input plugin
 * By Yair Even-Or (2016)
 * Don't sell this code. (c)
 * https://github.com/yairEO/tagify
 */
;(function($){
    $.fn.tagify = function(settings){
        var $input = $(this),
            tags;

        if( $input.data("tagify") ) // don't continue if already "tagified"
            return this;

        tags = new Tags($input, settings);
        $input.data("tagify", tags);

        return this;
    }

    function Tags($input, settings){
        this.value = [];
        this.build($input);
        this.events();
    }

    Tags.prototype = {
        build : function($input){
            var that = this,
                value = $input.val();

            this.DOM = {};
            this.DOM.originalInput = $input;
            this.DOM.input = $('<span class="placeholder" contenteditable>').text($input[0].placeholder);
            this.DOM.originalInput.wrap('<tags>');
            this.DOM.originalInput.before(this.DOM.input);
            this.DOM.scope = this.DOM.originalInput.parent();

            // need to wrap the input with a DIV
            // Chrome bug: http://stackoverflow.com/q/34354085/104380
            this.DOM.input.wrap('<div>');

            // if already has any value, convert to tags
            if( value ){
                value = value.split(',');
                value.forEach(function(v){
                    that.addTag(v).addClass('noAnim');
                });
            }
        },

        // DOM events binding
        events : function(){
                this.DOM.input.on('focus blur', this.callbacks.onFocus.bind(this))
                              .on('input', this.callbacks.onInput.bind(this))
                              .on('keydown', this.callbacks.onKeydown.bind(this));

                this.DOM.scope.on('click', 'tag', this.callbacks.onClickRemove.bind(this))
                              .on('click', this.callbacks.onClickScope.bind(this))
        },

        // DOM events callbacks
        callbacks : {
            onFocus : function(e){
                var text =  e.target.textContent.replace(/\u200B/g,'').trim(),
                    placeholder = this.DOM.originalInput[0].placeholder;

                if( e.type == "focus" && text == placeholder){
                    e.target.className = '';
                    e.target.innerHTML = '&#8203;';
                }
                else if( e.type == "blur" && text == "" ){
                    e.target.className = 'placeholder';
                    e.target.innerHTML = placeholder;
                }
            },

            onKeydown : function(e){
                var s = e.target.textContent;
                if( e.key == "Backspace" && (s == "" || s.charCodeAt(0) == 8203) ){
                    this.removeTag(-1);
                }
                if( e.key == "Escape" ){
                    e.target.textContent = '';
                    e.target.blur();
                }
                if( e.key == "Enter" ){
                    this.addTag(s);
                    e.target.textContent = '';
                    return false;
                }
            },

            onInput : function(e){
                var value = e.target.textContent,
                    lastChar = value[value.length - 1];

                if( value.indexOf(',') != -1 ){
                    value = value.split(',');
                    value.forEach(this.addTag.bind(this)); // add the tag
                    e.target.textContent = ''; // clear the input field's value
                }
            },

            onClickRemove : function(e){
                var tagIndex = $(e.currentTarget).index();
                this.removeTag(tagIndex);
            },

            onClickScope : function(e){
                if( e.target.tagName == "TAGS" )
                    this.DOM.input[0].focus();
            }
        },

        addTag : function( value ){
            value = value.replace(/\u200B/g,'').trim();
            if( !value ) return;

            var $tagElm = $("<tag title='click to remove'>").text(value);
            this.DOM.input.parent().before($tagElm);
            this.value.push(value);
            this.update();
            this.DOM.originalInput.trigger('tags.added', [$tagElm]); // broadcast outside
            return $tagElm;
        },

        removeTag : function( idx ){
            var $tagElm = this.DOM.scope.find('tag').eq(idx);

            if( !$tagElm.length) return;

            $tagElm.width( $tagElm.width() );
            document.body.clientTop; // force repaint for the width to take affect before the "hide" class below
            $tagElm.addClass('hide');
            // manual timeout (hack, since transitionend cannot be used because of hover)
            setTimeout(function(){
                $tagElm.remove();
            },400);

            this.value.splice(idx,1);
            this.DOM.originalInput.trigger('tags.removed', [$tagElm]); // broadcast outside
            this.update();
        },

        // update the origianl (hidden) input field's value
        update : function(){
            this.DOM.originalInput.val( this.value.join(', ') );
        }
    }
})(jQuery);