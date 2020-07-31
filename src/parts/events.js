import { decode, extend } from './helpers'

export function triggerChangeEvent(){
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

    // also trigger a Tagify event
    this.trigger("change", this.state.lastOriginalValueReported)

    // React, for some reason, clears the input's value after "dispatchEvent" is fired
    inputElm.value = this.state.lastOriginalValueReported
}

export default {
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
            var _s = this.settings,
                text = e.target ? (_s.preserveWhiteSpace ? e.target.textContent : e.target.textContent.trim()) : '', // a string
                type = e.type,
                ddEnabled = _s.dropdown.enabled >= 0,
                eventData = {relatedTarget:e.relatedTarget},
                isTargetSelectOption = this.state.actions.selectOption && (ddEnabled || !_s.dropdown.closeOnSelect),
                isTargetAddNewBtn = this.state.actions.addNew && ddEnabled,
                selection = window.getSelection(),
                shouldAddTags;

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

                    if (selection.getRangeAt && selection.rangeCount)
                        this.state.selection.range = selection.getRangeAt(0)

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
            var s = this.settings.preserveWhiteSpace ? e.target.textContent : e.target.textContent.trim();

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
                        setTimeout(() => {
                            var currentValue = decode(this.DOM.input.innerHTML);

                            // fixes #384, where the first and only tag will not get removed with backspace
                            if( currentValue.length >= lastInputValue.length ){
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
                    if( !this.state.dropdown.visible || this.settings.dropdown.position == 'manual' ){
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
            if( this.settings.mode == 'mix' )
                return this.events.callbacks.onMixTagsInput.call(this, e);

            var value = this.input.normalize.call(this),
                showSuggestions = value.length >= this.settings.dropdown.enabled,
                eventData = {value, inputElm:this.DOM.input};

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
            var tagElm = e.target.closest('.' + this.settings.classNames.tag),
                _s = this.settings,
                timeDiffFocus = +new Date() - this.state.hasFocus;

            if( e.target == this.DOM.scope ){
                if( !this.state.hasFocus )
                    this.DOM.input.focus()
                return
            }

            else if( e.target.classList.contains(this.settings.classNames.tagX) ){
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
                this.injectAtCaret(pastedData, window.getSelection().getRangeAt(0))
            else
                this.addTags(pastedData)
        },

        onEditTagInput( editableElm, e ){
            var tagElm = editableElm.closest('.' + this.settings.classNames.tag),
                tagElmIdx = this.getNodeIndex(tagElm),
                tagData = this.tagData(tagElm),
                value = this.input.normalize.call(this, editableElm),
                hasChanged = value != tagData.__originalData.value,
                isValid = this.validateTag({value}); // the value could have been invalid in the first-place so make sure to re-validate it (via "addEmptyTag" method)

            // if the value is same as before-editing and the tag was valid before as well, ignore the  current "isValid" result, which is false-positive
            if( !hasChanged && editableElm.originalIsValid === true )
                isValid = true

            tagElm.classList.toggle(this.settings.classNames.invalid, isValid !== true)
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

            var tagElm       = editableElm.closest('.' + this.settings.classNames.tag),
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
            newTagData = this.getWhitelistItemsByValue(value)[0] || newTagData.__preInvalidData || {}
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
            var tagElm = e.target.closest('.' + this.settings.classNames.tag),
                _s = this.settings,
                isEditingTag,
                isReadyOnlyTag;

            if( !tagElm ) return

            isEditingTag = tagElm.classList.contains(this.settings.classNames.tagEditing)
            isReadyOnlyTag = tagElm.hasAttribute('readonly')

            if( _s.mode != 'select' && !_s.readonly && !isEditingTag && !isReadyOnlyTag && this.settings.editTags )
                this.editTag(tagElm)

            this.toggleFocusClass(true)
            this.trigger('dblclick', { tag:tagElm, index:this.getNodeIndex(tagElm), data:this.tagData(tagElm) })
        }
    }
}