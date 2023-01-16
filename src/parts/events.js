import { decode, extend, getfirstTextNode, isChromeAndroidBrowser, isNodeTag, injectAtCaret, getSetTagData } from './helpers'

var deleteBackspaceTimeout;

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
            this.events.bindGlobal.call(this);

            if( this.settings.isJQueryPlugin )
                jQuery(this.DOM.originalInput).on('tagify.removeAllTags', this.removeAllTags.bind(this))
        }

        // setup callback references so events could be removed later
        _CBR = (this.listeners.main = this.listeners.main || {
            focus            : ['input', _CB.onFocusBlur.bind(this)],
            keydown          : ['input', _CB.onKeydown.bind(this)],
            click            : ['scope', _CB.onClickScope.bind(this)],
            dblclick         : ['scope', _CB.onDoubleClickScope.bind(this)],
            paste            : ['input', _CB.onPaste.bind(this)],
            drop             : ['input', _CB.onDrop.bind(this)],
            compositionstart : ['input', _CB.onCompositionStart.bind(this)],
            compositionend   : ['input', _CB.onCompositionEnd.bind(this)]
        })

        for( var eventName in _CBR ){
            this.DOM[_CBR[eventName][0]][action](eventName, _CBR[eventName][1]);
        }

        // listen to original input changes (unfortunetly this is the best way...)
        // https://stackoverflow.com/a/1949416/104380
        clearInterval(this.listeners.main.originalInputValueObserverInterval)
        this.listeners.main.originalInputValueObserverInterval = setInterval(_CB.observeOriginalInputValue.bind(this), 500)

        // observers
        var inputMutationObserver = this.listeners.main.inputMutationObserver || new MutationObserver(_CB.onInputDOMChange.bind(this));

        // cleaup just-in-case
        inputMutationObserver.disconnect()

        // observe stuff
        if( this.settings.mode == 'mix' )
            inputMutationObserver.observe(this.DOM.input, {childList:true})
    },

    bindGlobal( unbind ) {
        var _CB = this.events.callbacks,
            action = unbind ? 'removeEventListener' : 'addEventListener',
            e;

        if( !this.listeners || (!unbind  && this.listeners.global) ) return; // do not re-bind

        // these events are global event should never be unbinded, unless the instance is destroyed:
        this.listeners.global = this.listeners.global || [
            {
                type: this.isIE ? 'keydown' : 'input',  // IE cannot register "input" events on contenteditable elements, so the "keydown" should be used instead..
                target: this.DOM.input,
                cb: _CB[this.isIE ? 'onInputIE' : 'onInput'].bind(this)
            },
            {
                type: 'keydown',
                target: window,
                cb: _CB.onWindowKeyDown.bind(this)
            },
            {
                type: 'blur',
                target: this.DOM.input,
                cb: _CB.onFocusBlur.bind(this)
            },
            {
                type: 'click',
                target: document,
                cb: _CB.onClickAnywhere.bind(this)
            },
        ]

        for( e of this.listeners.global )
            e.target[action](e.type, e.cb);
    },

    unbindGlobal() {
        this.events.bindGlobal.call(this, true);
    },

    /**
     * DOM events callbacks
     */
    callbacks : {
        onFocusBlur(e){
            var _s = this.settings,
                text = e.target ? this.trim(e.target.textContent) : '', // a string
                currentDisplayValue = this.value?.[0]?.[_s.tagTextProp],
                type = e.type,
                ddEnabled = _s.dropdown.enabled >= 0,
                eventData = {relatedTarget:e.relatedTarget},
                isTargetSelectOption = this.state.actions.selectOption && (ddEnabled || !_s.dropdown.closeOnSelect),
                isTargetAddNewBtn = this.state.actions.addNew && ddEnabled,
                isRelatedTargetX = e.relatedTarget && isNodeTag.call(this, e.relatedTarget) && this.DOM.scope.contains(e.relatedTarget),
                shouldAddTags;

            if( type == 'blur' ){
                if( e.relatedTarget === this.DOM.scope ){
                    this.dropdown.hide()
                    this.DOM.input.focus()
                    return
                }

                this.postUpdate()
                _s.onChangeAfterBlur && this.triggerChangeEvent()
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
                    this.dropdown.hide()
                    // reset state which needs reseting
                    this.state.dropdown.visible = undefined
                    this.setStateSelection()
                }

                return
            }

            if( type == "focus" ){
                this.trigger("focus", eventData)
                //  e.target.classList.remove('placeholder');
                if( _s.dropdown.enabled === 0 || !_s.userInput ){  // && _s.mode != "select"
                    this.dropdown.show(this.value.length ? '' : undefined)
                }
                return
            }

            else if( type == "blur" ){
                this.trigger("blur", eventData)
                this.loading(false)

                // when clicking the X button of a selected tag, it is unwanted for it to be added back
                // again in a few more lines of code (shouldAddTags && addTags)
                if( _s.mode == 'select' ) {
                    if( isRelatedTargetX ) {
                        this.removeTags()
                        text = '';
                    }

                    // if nothing has changed (same display value), do not add a tag
                    if( currentDisplayValue === text )
                        text = ''
                }

                shouldAddTags = text && !this.state.actions.selectOption && _s.addTagOnBlur;

                // do not add a tag if "selectOption" action was just fired (this means a tag was just added from the dropdown)
                shouldAddTags && this.addTags(text, true)
            }

            this.DOM.input.removeAttribute('style')
            this.dropdown.hide()
        },

        onCompositionStart(e){
            this.state.composing = true
        },

        onCompositionEnd(e){
            this.state.composing = false
        },

        onWindowKeyDown(e){
            var focusedElm = document.activeElement,
                isTag = isNodeTag.call(this, focusedElm),
                isBelong = isTag && this.DOM.scope.contains(document.activeElement),
                nextTag;

            if( !isBelong ) return

            nextTag = focusedElm.nextElementSibling

            switch( e.key ){
                // remove tag if has focus
                case 'Backspace': {
                    if( !this.settings.readonly ) {
                        this.removeTags(focusedElm);
                        (nextTag ? nextTag : this.DOM.input).focus()
                    }

                    break;
                }

                // edit tag if has focus
                case 'Enter': {
                    setTimeout(this.editTag.bind(this), 0, focusedElm);
                    break;
                }
            }
        },

        onKeydown(e){
            var _s = this.settings;

            // ignore keys during IME composition or when user input is not allowed
            if( this.state.composing || !_s.userInput )
                return

            if( _s.mode == 'select' && _s.enforceWhitelist && this.value.length && e.key != 'Tab' ){
                e.preventDefault()
            }

            var s = this.trim(e.target.textContent);

            this.trigger("keydown", {event:e})

            /**
             * ONLY FOR MIX-MODE:
             */
            if( _s.mode == 'mix' ){
                switch( e.key ){
                    case 'Left' :
                    case 'ArrowLeft' : {
                        // when left arrow was pressed, set a flag so when the dropdown is shown, right-arrow will be ignored
                        // because it seems likely the user wishes to use the arrows to move the caret
                        this.state.actions.ArrowLeft = true
                        break
                    }

                    case 'Delete':
                    case 'Backspace' : {
                        if( this.state.editing ) return

                        var sel = document.getSelection(),
                            deleteKeyTagDetected = e.key == 'Delete' && sel.anchorOffset == (sel.anchorNode.length || 0),
                            prevAnchorSibling = sel.anchorNode.previousSibling,
                            isCaretAfterTag = sel.anchorNode.nodeType == 1 || !sel.anchorOffset && prevAnchorSibling && prevAnchorSibling.nodeType == 1 && sel.anchorNode.previousSibling,
                            lastInputValue = decode(this.DOM.input.innerHTML),
                            lastTagElems = this.getTagElms(),
                            //  isCaretInsideTag = sel.anchorNode.parentNode('.' + _s.classNames.tag),
                            tagBeforeCaret,
                            tagElmToBeDeleted,
                            firstTextNodeBeforeTag;

                        if( _s.backspace == 'edit' && isCaretAfterTag ){
                            tagBeforeCaret = sel.anchorNode.nodeType == 1 ? null : sel.anchorNode.previousElementSibling;
                            setTimeout(this.editTag.bind(this), 0, tagBeforeCaret); // timeout is needed to the last cahacrter in the edited tag won't get deleted
                            e.preventDefault() // needed so the tag elm won't get deleted
                            return;
                        }

                        if( isChromeAndroidBrowser() && isCaretAfterTag instanceof Element ){
                            firstTextNodeBeforeTag = getfirstTextNode(isCaretAfterTag)

                            if( !isCaretAfterTag.hasAttribute('readonly') )
                                isCaretAfterTag.remove() // since this is Chrome, can safetly use this "new" DOM API

                            // Android-Chrome wrongly hides the keyboard, and loses focus,
                            // so this hack below is needed to regain focus at the correct place:
                            this.DOM.input.focus()
                            setTimeout(() => {
                                this.placeCaretAfterNode(firstTextNodeBeforeTag)
                                this.DOM.input.click()

                            })

                            return
                        }

                        if( sel.anchorNode.nodeName == 'BR')
                            return

                        if( (deleteKeyTagDetected || isCaretAfterTag) && sel.anchorNode.nodeType == 1 )
                            if( sel.anchorOffset == 0 ) // caret is at the very begining, before a tag
                                tagElmToBeDeleted = deleteKeyTagDetected // delete key pressed
                                    ? lastTagElems[0]
                                    : null;
                            else
                                tagElmToBeDeleted = lastTagElems[Math.min(lastTagElems.length, sel.anchorOffset) - 1]

                        // find out if a tag *might* be a candidate for deletion, and if so, which
                        else if( deleteKeyTagDetected )
                            tagElmToBeDeleted = sel.anchorNode.nextElementSibling;

                        else if( isCaretAfterTag instanceof Element )
                            tagElmToBeDeleted = isCaretAfterTag;

                        // tagElm.hasAttribute('readonly')
                        if( sel.anchorNode.nodeType == 3 &&   // node at caret location is a Text node
                            !sel.anchorNode.nodeValue    &&   // has some text
                            sel.anchorNode.previousElementSibling )  // text node has a Tag node before it
                            e.preventDefault()

                        // if backspace not allowed, do nothing
                        // TODO: a better way to detect if nodes were deleted is to simply check the "this.value" before & after
                        if( (isCaretAfterTag || deleteKeyTagDetected) && !_s.backspace ){
                            e.preventDefault()
                            return
                        }

                        if( sel.type != 'Range' && !sel.anchorOffset && sel.anchorNode == this.DOM.input && e.key != 'Delete' ){
                            e.preventDefault()
                            return
                        }

                        if( sel.type != 'Range' && tagElmToBeDeleted && tagElmToBeDeleted.hasAttribute('readonly') ){
                            // allows the continuation of deletion by placing the caret on the first previous textNode.
                            // since a few readonly-tags might be one after the other, iteration is needed:

                            this.placeCaretAfterNode( getfirstTextNode(tagElmToBeDeleted) )
                            return
                        }

                        // update regarding https://github.com/yairEO/tagify/issues/762#issuecomment-786464317:
                        // the bug described is more severe than the fix below, therefore I disable the fix until a solution
                        // is found which work well for both cases.
                        // -------
                        // nodeType is "1" only when the caret is at the end after last tag (no text after), or before first first (no text before)
                        /*
                        if( this.isFirefox && sel.anchorNode.nodeType == 1 && sel.anchorOffset != 0 ){
                            this.removeTags() // removes last tag by default if no parameter supplied
                            // place caret inside last textNode, if exist. it's an annoying bug only in FF,
                            // if the last tag is removed, and there is a textNode before it, the caret is not placed at its end
                            this.placeCaretAfterNode( setRangeAtStartEnd(false, this.DOM.input) )
                        }
                        */

                        clearTimeout(deleteBackspaceTimeout)
                        // a minimum delay is needed before the node actually gets detached from the document (don't know why),
                        // to know exactly which tag was deleted. This is the easiest way of knowing besides using MutationObserver
                        deleteBackspaceTimeout = setTimeout(() => {
                            var sel = document.getSelection(),
                                currentValue = decode(this.DOM.input.innerHTML),
                                prevElm = !deleteKeyTagDetected && sel.anchorNode.previousSibling;

                            // fixes #384, where the first and only tag will not get removed with backspace
                            /*
                             * [UPDATE DEC 3, 22] SEEMS BELOEW CODE IS NOT NEEDED ANY MORE
                             *
                            if( currentValue.length > lastInputValue.length && prevElm ){
                                if( isNodeTag.call(this, prevElm) && !prevElm.hasAttribute('readonly') ){
                                    this.removeTags(prevElm)
                                    this.fixFirefoxLastTagNoCaret()

                                    // the above "removeTag" methods removes the tag with a transition. Chrome adds a <br> element for some reason at this stage
                                    if( this.DOM.input.children.length == 2 && this.DOM.input.children[1].tagName == "BR" ){
                                        this.DOM.input.innerHTML = ""
                                        this.value.length = 0
                                        return true
                                    }
                                }

                                else
                                    prevElm.remove()
                            }
                            */

                            // find out which tag(s) were deleted and trigger "remove" event
                            // iterate over the list of tags still in the document and then filter only those from the "this.value" collection
                            this.value = [].map.call(lastTagElems, (node, nodeIdx) => {
                                var tagData = getSetTagData(node)

                                // since readonly cannot be removed (it's technically resurrected if removed somehow)
                                if( node.parentNode || tagData.readonly )
                                    return tagData
                                else
                                    this.trigger('remove', { tag:node, index:nodeIdx, data:tagData })
                            })
                                .filter(n=>n)  // remove empty items in the mapped array
                        }, 20) // Firefox needs this higher duration for some reason or things get buggy when deleting text from the end
                        break;
                    }
                    // currently commented to allow new lines in mixed-mode
                    // case 'Enter' :
                    //     // e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                }

                return true
            }

            switch( e.key ){
                case 'Backspace' :
                    if( _s.mode == 'select' && _s.enforceWhitelist && this.value.length)
                        this.removeTags()

                    else if( !this.state.dropdown.visible || _s.dropdown.position == 'manual' ){
                        if( e.target.textContent == "" || s.charCodeAt(0) == 8203 ){  // 8203: ZERO WIDTH SPACE unicode
                            if( _s.backspace === true )
                                this.removeTags()
                            else if( _s.backspace == 'edit' )
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
                    // if( _s.mode == 'select' ) // issue #333
                    if( !this.state.dropdown.visible )
                        this.dropdown.show()
                    break;

                case 'ArrowRight' : {
                    let tagData = this.state.inputSuggestion || this.state.ddItemData
                    if( tagData && _s.autoComplete.rightKey ){
                        this.addTags([tagData], true)
                        return;
                    }
                    break
                }
                case 'Tab' : {
                    let selectMode = _s.mode == 'select'
                    if(s && !selectMode) e.preventDefault()
                    else return true;
                }

                case 'Enter' :
                    // manual suggestion boxes are assumed to always be visible
                    if( this.state.dropdown.visible && _s.dropdown.position != 'manual' ) return
                    e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                    // because the main "keydown" event is bound before the dropdown events, this will fire first and will not *yet*
                    // know if an option was just selected from the dropdown menu. If an option was selected,
                    // the dropdown events should handle adding the tag
                    setTimeout(()=>{
                        if( this.state.dropdown.visible || this.state.actions.selectOption )
                            return
                        this.addTags(s, true)
                    })
            }
        },

        onInput(e){
            this.postUpdate() // toggles "tagify--empty" class

            var _s = this.settings;

            if( _s.mode == 'mix' )
                return this.events.callbacks.onMixTagsInput.call(this, e);

            var value = this.input.normalize.call(this),
                showSuggestions = value.length >= _s.dropdown.enabled,
                eventData = {value, inputElm:this.DOM.input},
                validation = this.validateTag({value});

            if( _s.mode == 'select' ) {
                this.toggleScopeValidation(validation)
            }

            eventData.isValid = validation;

            // for IE; since IE doesn't have an "input" event so "keyDown" is used instead to trigger the "onInput" callback,
            // and so many keys do not change the input, and for those do not continue.
            if( this.state.inputText == value ) return;

            // save the value on the input's State object
            this.input.set.call(this, value, false); // update the input with the normalized value and run validations
            // this.setRangeAtStartEnd(false, this.DOM.input); // fix caret position

            // if delimiters detected, add tags
            if( value.search(_s.delimiters) != -1 ){
                if( this.addTags( value ) ){
                    this.input.set.call(this); // clear the input field's value
                }
            }

            else if( _s.dropdown.enabled >= 0 ){
                this.dropdown[showSuggestions ? "show" : "hide"](value);
            }

            this.trigger('input', eventData) // "input" event must be triggered at this point, before the dropdown is shown
        },

        onMixTagsInput( e ){
            var rangeText, match, matchedPatternCount, tag, showSuggestions, selection,
                _s = this.settings,
                lastTagsCount = this.value.length,
                matchFlaggedTag,
                matchDelimiters,
                tagsElems = this.getTagElms(),
                fragment = document.createDocumentFragment(),
                range = window.getSelection().getRangeAt(0),
                remainingTagsValues = [].map.call(tagsElems, node => getSetTagData(node).value);

            // Android Chrome "keydown" event argument does not report the correct "key".
            // this workaround is needed to manually call "onKeydown" method with a synthesized event object
            if( e.inputType == "deleteContentBackward" && isChromeAndroidBrowser() ){
                this.events.callbacks.onKeydown.call(this, {
                    target: e.target,
                    key: "Backspace",
                })
            }

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
                this.value = [].map.call(this.getTagElms(), node => getSetTagData(node))
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
                            this.dropdown.hide()
                            return
                        }

                        showSuggestions = this.state.tag.value.length >= _s.dropdown.enabled

                        // When writing something that might look like a tag (an email address) but isn't one - it is unwanted
                        // the suggestions dropdown be shown, so the user can close it (in any way), and while continue typing,
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

                        // scenario: (do not show suggestions of another matched tag, if more than one detected)
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
            // the dropdown must be shown only after this event has been triggered, so an implementer could
            // dynamically change the whitelist.
            setTimeout(()=>{
                this.update({withoutChangeEvent:true})
                this.trigger("input", extend({}, this.state.tag, {textContent:this.DOM.input.textContent}))

                if( this.state.tag )
                    this.dropdown[showSuggestions ? "show" : "hide"](this.state.tag.value);
            }, 10)
        },

        onInputIE(e){
            var _this = this;
            // for the "e.target.textContent" to be changed, the browser requires a small delay
            setTimeout(function(){
                _this.events.callbacks.onInput.call(_this, e)
            })
        },

        observeOriginalInputValue(){
            // if, for some reason, the Tagified element is no longer in the DOM,
            // call the "destroy" method to kill all references to timeouts/intervals
            if( !this.DOM.originalInput.parentNode ) this.destroy()

            // if original input value changed for some reason (for exmaple a form reset)
            if( this.DOM.originalInput.value != this.DOM.originalInput.tagifyValue )
                this.loadOriginalValues()
        },

        onClickAnywhere(e){
            if (e.target != this.DOM.scope && !this.DOM.scope.contains(e.target)) {
                this.toggleFocusClass(false)
                this.state.hasFocus = false
            }
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
                this.removeTags( e.target.parentNode )
                return
            }

            else if( tagElm ){
                this.trigger("click", { tag:tagElm, index:this.getNodeIndex(tagElm), data:getSetTagData(tagElm), event:e })

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
                        this.dropdown.hide()
                    else if( _s.dropdown.enabled === 0 && _s.mode != 'mix' )
                        this.dropdown.show(this.value.length ? '' : undefined)
                    return
                }
            }

            if( _s.mode == 'select' && _s.dropdown.enabled === 0 && !this.state.dropdown.visible)
                this.dropdown.show()
        },

        // special proccess is needed for pasted content in order to "clean" it
        onPaste(e){
            e.preventDefault()

            var _s = this.settings,
                selectModeWithoutInput =_s.mode == 'select' && _s.enforceWhitelist;

            if( selectModeWithoutInput || !_s.userInput ){
                return false;
            }

            var clipboardData, pastedText;

            if( _s.readonly ) return

            // Get pasted data via clipboard API
            clipboardData = e.clipboardData || window.clipboardData
            pastedText = clipboardData.getData('Text')

            _s.hooks.beforePaste(e, {tagify:this, pastedText, clipboardData})
                .then(result => {
                    if( result === undefined )
                        result = pastedText;

                    if( result ){
                        this.injectAtCaret(result, window.getSelection().getRangeAt(0))

                        if( this.settings.mode == 'mix' ){
                            this.events.callbacks.onMixTagsInput.call(this, e);
                        }

                        else if( this.settings.pasteAsTags ){
                            this.addTags(this.state.inputText + result, true)
                        }

                        else
                            this.state.inputText = result
                    }
                })
                .catch(err => err)
        },

        onDrop(e){
            e.preventDefault()
        },

        onEditTagInput( editableElm, e ){
            var tagElm = editableElm.closest('.' + this.settings.classNames.tag),
                tagElmIdx = this.getNodeIndex(tagElm),
                tagData = getSetTagData(tagElm),
                textValue = this.input.normalize.call(this, editableElm),
                dataForChangedProp = {[this.settings.tagTextProp]: textValue, __tagId: tagData.__tagId}, // "__tagId" is needed so validation will skip current tag when checking for dups
                isValid = this.validateTag(dataForChangedProp), // the value could have been invalid in the first-place so make sure to re-validate it (via "addEmptyTag" method)
                hasChanged = this.editTagChangeDetected(extend(tagData, dataForChangedProp));

            // if the value is same as before-editing and the tag was valid before as well, ignore the  current "isValid" result, which is false-positive
            if( !hasChanged && editableElm.originalIsValid === true )
                isValid = true

            tagElm.classList.toggle(this.settings.classNames.tagInvalid, isValid !== true)
            tagData.__isValid = isValid

            tagElm.title = isValid === true
                ? tagData.title || tagData.value
                : isValid // change the tag's title to indicate why is the tag invalid (if it's so)

            // show dropdown if typed text is equal or more than the "enabled" dropdown setting
            if( textValue.length >= this.settings.dropdown.enabled ){
                // this check is needed apparently because doing browser "undo" will fire
                //  "onEditTagInput" but "this.state.editing" will be "false"
                if( this.state.editing )
                    this.state.editing.value = textValue
                this.dropdown.show(textValue)
            }

            this.trigger("edit:input", {
                tag  : tagElm,
                index: tagElmIdx,
                data : extend({}, this.value[tagElmIdx], {newValue:textValue}),
                event: e
            })
        },

        onEditTagPaste( tagElm, e ){
            // Get pasted data via clipboard API
            var clipboardData = e.clipboardData || window.clipboardData,
                pastedText = clipboardData.getData('Text');

            e.preventDefault()

            var newNode = injectAtCaret(pastedText)
            this.setRangeAtStartEnd(false, newNode)
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
                tagData      = getSetTagData(tagElm),
                textValue    = this.input.normalize.call(this, editableElm),
                dataForChangedProp = {[_s.tagTextProp]: textValue, __tagId: tagData.__tagId}, // "__tagId" is needed so validation will skip current tag when checking for dups
                originalData = tagData.__originalData, // pre-edit data
                hasChanged   = this.editTagChangeDetected(extend(tagData, dataForChangedProp)),
                isValid      = this.validateTag(dataForChangedProp), // "__tagId" is needed so validation will skip current tag when checking for dups
                hasMaxTags,
                newTagData;

            if( !textValue ){
                this.onEditTagDone(tagElm)
                return
            }

            // if nothing changed revert back to how it was before editing
            if( !hasChanged ){
                this.onEditTagDone(tagElm, originalData)
                return
            }

            // need to know this because if "keepInvalidTags" setting is "true" and an invalid tag is edited as a valid one,
            // but the maximum number of tags have alreay been reached, so it should not allow saving the new valid value.
            // only if the tag was already valid before editing, ignore this check (see a few lines below)
            hasMaxTags = this.hasMaxTags()

            newTagData = extend(
                {},
                originalData,
                {
                    [_s.tagTextProp]: this.trim(textValue),
                    __isValid: isValid
                }
            )

            // pass through optional transformer defined in settings
            _s.transformTag.call(this, newTagData, originalData)

            // MUST re-validate after tag transformation
            // only validate the "tagTextProp" because is the only thing that metters for validating an edited tag.
            // -- Scenarios: --
            // 1. max 3 tags allowd. there are 4 tags, one has invalid input and is edited to a valid one, and now should be marked as "not allowed" because limit of tags has reached
            // 2. max 3 tags allowed. there are 3 tags, one is edited, and so max-tags vaildation should be OK
            isValid = (!hasMaxTags || originalData.__isValid === true) && this.validateTag(newTagData)

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

            else if( _s.keepInvalidTags ){
                // cleaup any previous leftovers if the tag was invalid
                delete newTagData.title
                delete newTagData["aria-invalid"]
                delete newTagData.class
            }

            // tagElm.classList.toggle(_s.classNames.tagInvalid, true)

            this.onEditTagDone(tagElm, newTagData)
        },

        onEditTagkeydown(e, tagElm){
            // ignore keys during IME composition
            if( this.state.composing )
                return

            this.trigger("edit:keydown", {event:e})

            switch( e.key ){
                case 'Esc' :
                case 'Escape' : {
                    // revert the tag to how it was before editing
                    // replace current tag with original one (pre-edited one)
                    tagElm.parentNode.replaceChild(tagElm.__tagifyTagData.__originalHTML, tagElm)
                    this.state.editing = false;
                }
                case 'Enter' :
                case 'Tab' :
                    e.preventDefault()
                    e.target.blur()
            }
        },

        onDoubleClickScope(e){
            var tagElm = e.target.closest('.' + this.settings.classNames.tag),
                tagData = getSetTagData(tagElm),
                _s = this.settings,
                isEditingTag,
                isReadyOnlyTag;

            if( !tagElm || !_s.userInput || tagData.editable === false ) return

            isEditingTag = tagElm.classList.contains(this.settings.classNames.tagEditing)
            isReadyOnlyTag = tagElm.hasAttribute('readonly')

            if( _s.mode != 'select' && !_s.readonly && !isEditingTag && !isReadyOnlyTag && this.settings.editTags )
                this.editTag(tagElm)

            this.toggleFocusClass(true)
            this.trigger('dblclick', { tag:tagElm, index:this.getNodeIndex(tagElm), data:getSetTagData(tagElm) })
        },

        /**
         *
         * @param {Object} m an object representing the observed DOM changes
         */
        onInputDOMChange(m){
            // iterate all DOm mutation
            m.forEach(record => {
                // only the ADDED nodes
                record.addedNodes.forEach(addedNode => {
                    // fix chrome's placing '<div><br></div>' everytime ENTER key is pressed, and replace with just `<br'
                    if( addedNode.outerHTML == '<div><br></div>' ){
                        addedNode.replaceWith(document.createElement('br'))
                    }

                    // if the added element is a div containing a tag within it (chrome does this when pressing ENTER before a tag)
                    else if( addedNode.nodeType == 1 && addedNode.querySelector(this.settings.classNames.tagSelector) ){
                        let newlineText = document.createTextNode('')

                        if( addedNode.childNodes[0].nodeType == 3 && addedNode.previousSibling.nodeName != 'BR' )
                            newlineText  = document.createTextNode('\n')

                        // unwrap the useless div
                        // chrome adds a BR at the end which should be removed
                        addedNode.replaceWith(...[newlineText, ...[...addedNode.childNodes].slice(0,-1)])
                        this.placeCaretAfterNode(newlineText)
                    }

                    // if this is a tag
                    else if( isNodeTag.call(this, addedNode) ){
                        if( addedNode.previousSibling?.nodeType == 3 && !addedNode.previousSibling.textContent )
                            addedNode.previousSibling.remove()
                        // and it is the first node in a new line
                        if( addedNode.previousSibling && addedNode.previousSibling.nodeName == 'BR' ){
                            // allows placing the caret just before the tag, when the tag is the first node in that line
                            addedNode.previousSibling.replaceWith('\n\u200B')

                            let nextNode = addedNode.nextSibling, anythingAfterNode = '';

                            while (nextNode) {
                                anythingAfterNode += nextNode.textContent
                                nextNode = nextNode.nextSibling;
                            }

                            // when hitting ENTER for new line just before an existing tag, but skip below logic when a tag has been addded
                            anythingAfterNode.trim() && this.placeCaretAfterNode(addedNode.previousSibling)
                        }
                    }
                })

                record.removedNodes.forEach(removedNode => {
                    // when trying to delete a tag which is in a new line and there's nothing else there (caret is after the tag)
                    if( removedNode && removedNode.nodeName == 'BR' && isNodeTag.call(this, lastInputChild)){
                        this.removeTags(lastInputChild)
                        this.fixFirefoxLastTagNoCaret()
                    }
                })
            })

            // get the last child only after the above DOM modifications
            // check these scenarios:
            // 1. after a single line, press ENTER once - should add only 1 BR
            // 2. presss ENTER right before a tag
            // 3. press enter within a text node before a tag
            var lastInputChild = this.DOM.input.lastChild;

            if( lastInputChild && lastInputChild.nodeValue == '' )
                lastInputChild.remove()

            // make sure the last element is always a BR
            if( !lastInputChild || lastInputChild.nodeName != 'BR' ){
                this.DOM.input.appendChild(document.createElement('br'))
            }
        },
    }
}

