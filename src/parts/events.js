import { decode, extend, getfirstTextNode } from './helpers'

export function triggerChangeEvent(){
    if( this.settings.mixMode.integrated ) return;

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
            var text = e.target ? this.trim(e.target.textContent) : '', // a string
                _s = this.settings,
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
            var s = this.trim(e.target.textContent);

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

                        var sel = document.getSelection(),
                            deleteKeyTagDetected = e.key == 'Delete' && sel.anchorOffset == (sel.anchorNode.length || 0),
                            isCaretAfterTag = sel.anchorNode.nodeType == 1 || !sel.anchorOffset && sel.anchorNode.previousElementSibling,
                            lastInputValue = decode(this.DOM.input.innerHTML),
                            lastTagElems = this.getTagElms(),
                            //  isCaretInsideTag = sel.anchorNode.parentNode('.' + this.settings.classNames.tag),
                            tagElmToBeDeleted;

                        if( sel.anchorNode.nodeName == 'BR')
                            return

                        if( (deleteKeyTagDetected || isCaretAfterTag) && sel.anchorNode.nodeType == 1 )
                            if( sel.anchorOffset == 0 ) // caret is at the very begining, before a tag
                                tagElmToBeDeleted = deleteKeyTagDetected // delete key pressed
                                    ? lastTagElems[0]
                                    : null;
                            else
                                tagElmToBeDeleted = lastTagElems[sel.anchorOffset - 1]

                        // find out if a tag *might* be a candidate for deletion, and if so, which
                        else if( deleteKeyTagDetected )
                            tagElmToBeDeleted = sel.anchorNode.nextElementSibling;

                        else if( isCaretAfterTag )
                            tagElmToBeDeleted = isCaretAfterTag;

                        // tagElm.hasAttribute('readonly')
                        if( sel.anchorNode.nodeType == 3 &&   // node at caret location is a Text node
                            !sel.anchorNode.nodeValue    &&   // has some text
                            sel.anchorNode.previousElementSibling )  // text node has a Tag node before it
                            e.preventDefault()

                        // if backspace not allowed, do nothing
                        // TODO: a better way to detect if nodes were deleted is simply check the "this.value" before & after
                        if( (isCaretAfterTag || deleteKeyTagDetected) && !this.settings.backspace ){
                            e.preventDefault()
                            return
                        }

                        if( sel.type != 'Range' && tagElmToBeDeleted && tagElmToBeDeleted.hasAttribute('readonly') ){
                            // allows the continuation of deletion by placing the caret on the first previous textNode.
                            // since a few readonly-tags might be one after the other, iteration is needed:
                            this.placeCaretAfterNode( getfirstTextNode(tagElmToBeDeleted) )
                            return
                        }

                        // nodeType is "1" only when the caret is at the end after last tag (no text after), or before first first (no text before)
                        if( this.isFirefox && sel.anchorNode.nodeType == 1 && sel.anchorOffset != 0 ){
                            this.removeTags() // removes last tag by default if no parameter supplied
                            // place caret inside last textNode, if exist. it's an annoying bug only in FF,
                            // if the last tag is removed, and there is a textNode before it, the caret is not placed at its end
                            this.placeCaretAfterNode( this.setRangeAtStartEnd() )
                        }

                        // a minimum delay is needed before the node actually gets detached from the document (don't know why),
                        // to know exactly which tag was deleted. This is the easiest way of knowing besides using MutationObserver
                        setTimeout(() => {
                            var sel = document.getSelection(),
                                currentValue = decode(this.DOM.input.innerHTML),
                                prevElm = sel.anchorNode.previousElementSibling;

                            // fixes #384, where the first and only tag will not get removed with backspace
                            if( currentValue.length >= lastInputValue.length && prevElm && !prevElm.hasAttribute('readonly') ){
                                this.removeTags(prevElm)
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
                                var tagData = this.tagData(node)

                                // since readonly cannot be removed (it's technically resurrected if removed somehow)
                                if( node.parentNode || tagData.readonly )
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
                    s && e.preventDefault()
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
            if( this.state.inputText == value ) return;

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
                matchDelimiters,
                tagsElems = this.getTagElms(),
                fragment = document.createDocumentFragment(),
                range = window.getSelection().getRangeAt(0),
                remainingTagsValues = [].map.call(tagsElems, node => this.tagData(node).value);

            // re-add "readonly" tags which might have been removed
            this.value.slice().forEach(item => {
                if( item.readonly && !remainingTagsValues.includes(item.value) )
                    fragment.appendChild( this.createTagElem(item) )
            })

            if( fragment.childNodes.length ){
                range.insertNode(fragment)
                this.setRangeAtStartEnd(false, fragment.lastChild)
            }

            // check if tags were "magically" added/removed (browser redo/undo or CTRL-A -> delete)
            if( tagsElems.length != lastTagsCount ){
                this.value = [].map.call(this.getTagElms(), node => this.tagData(node))
                this.update({ withoutChangeEvent:true })
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
                            value  : tag.replace(_s.pattern, ''), // get rid of the prefix
                        }
                        this.state.tag.baseOffset = selection.baseOffset - this.state.tag.value.length

                        matchDelimiters = this.state.tag.value.match(_s.delimiters)
                        // if a delimeter exists, add the value as tag (exluding the delimiter)
                        if( matchDelimiters ){
                            this.state.tag.value = this.state.tag.value.replace(_s.delimiters, '')
                            this.state.tag.delimiters = matchDelimiters[0]
                            this.addTags(this.state.tag.value, _s.dropdown.clearOnSelect)
                            this.dropdown.hide.call(this)
                            return
                        }

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
            var _s = this.settings,
                tagElm = e.target.closest('.' + _s.classNames.tag),
                timeDiffFocus = +new Date() - this.state.hasFocus;

            if( e.target == this.DOM.scope ){
                if( !this.state.hasFocus )
                    this.DOM.input.focus()
                return
            }

            else if( e.target.classList.contains(_s.classNames.tagX) ){
                this.removeTags( e.target.parentNode );
                return
            }

            else if( tagElm ){
                this.trigger("click", { tag:tagElm, index:this.getNodeIndex(tagElm), data:this.tagData(tagElm), originalEvent:this.cloneEvent(e) })

                if( _s.editTags === 1 || _s.editTags.clicks === 1 )
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

        // special proccess is needed for pasted content in order to "clean" it
        onPaste(e){
            var clipboardData, pastedData;

            e.preventDefault()

            if( this.settings.readonly ) return;

            // Get pasted data via clipboard API
            clipboardData = e.clipboardData || window.clipboardData
            pastedData = clipboardData.getData('Text')

            this.injectAtCaret(pastedData, window.getSelection().getRangeAt(0))

            if( this.settings.mode != 'mix' )
                this.addTags(this.DOM.input.textContent, true)
        },

        onEditTagInput( editableElm, e ){
            var tagElm = editableElm.closest('.' + this.settings.classNames.tag),
                tagElmIdx = this.getNodeIndex(tagElm),
                tagData = this.tagData(tagElm),
                value = this.input.normalize.call(this, editableElm),
                hasChanged = tagElm.innerHTML != tagElm.__tagifyTagData.__originalHTML,
                isValid = this.validateTag({[this.settings.tagTextProp]:value}); // the value could have been invalid in the first-place so make sure to re-validate it (via "addEmptyTag" method)

            // if the value is same as before-editing and the tag was valid before as well, ignore the  current "isValid" result, which is false-positive
            if( !hasChanged && editableElm.originalIsValid === true )
                isValid = true

            tagElm.classList.toggle(this.settings.classNames.tagInvalid, isValid !== true)
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
            if( !this.state.hasFocus )
                this.toggleFocusClass()

            // one scenario is when selecting a suggestion from the dropdown, when editing, and by selecting it
            // the "onEditTagDone" is called directly, already replacing the tag, so the argument "editableElm"
            // node isn't in the DOM anynmore because it has been replaced.
            if( !this.DOM.scope.contains(editableElm) ) return;

            var _s           = this.settings,
                tagElm       = editableElm.closest('.' + _s.classNames.tag),
                textValue    = this.input.normalize.call(this, editableElm),
                originalData = this.tagData(tagElm).__originalData, // pre-edit data
                hasChanged   = tagElm.innerHTML != tagElm.__tagifyTagData.__originalHTML,
                isValid      = this.validateTag({[_s.tagTextProp]:textValue}),
                newTagData;

            //  this.DOM.input.focus()
            if( !textValue ){
                this.onEditTagDone(tagElm)
                return
            }

            // if nothing changed revert back to how it was before editing
            if( !hasChanged ){
                this.onEditTagDone(tagElm, originalData)
                return
            }

            newTagData = this.getWhitelistItem(textValue) || {[_s.tagTextProp]:textValue, value:textValue}

            _s.transformTag.call(this, newTagData, originalData)

            // MUST re-validate after tag transformation
            // only validate the "tagTextProp" because is the only thing that metters for validation
            isValid = this.validateTag({[_s.tagTextProp]:newTagData[_s.tagTextProp]})

            if( isValid !== true ){
                this.trigger("invalid", { data:newTagData, tag:tagElm, message:isValid })

                // do nothing if invalid, stay in edit-mode until corrected or reverted by presssing esc
                if( _s.editTags.keepInvalid ) return

                if( _s.keepInvalidTags )
                    newTagData.__isValid = isValid
                else
                    // revert back if not specified to keep
                    newTagData = originalData
            }

            // tagElm.classList.toggle(_s.classNames.tagInvalid, true)

            this.onEditTagDone(tagElm, newTagData)
        },

        onEditTagkeydown(e, tagElm){
            this.trigger("edit:keydown", {originalEvent:this.cloneEvent(e)})

            switch( e.key ){
                case 'Esc' :
                case 'Escape' :
                    tagElm.innerHTML = tagElm.__tagifyTagData.__originalHTML
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