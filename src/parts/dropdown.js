import { sameStr, isObject, minify, escapeHTML, extend, unaccent, getNodeHeight } from './helpers'

export default {
    init(){
        this.DOM.dropdown = this.parseTemplate('dropdown', [this.settings])
        this.DOM.dropdown.content = this.DOM.dropdown.querySelector('.' + this.settings.classNames.dropdownWrapper)
    },

    /**
     * shows the suggestions select box
     * @param {String} value [optional, filter the whitelist by this value]
     */
    show( value ){
        var _s = this.settings,
            firstListItem,
            firstListItemValue,
            selection = window.getSelection(),
            allowNewTags = _s.mode == 'mix' && !_s.enforceWhitelist,
            noWhitelist =  !_s.whitelist || !_s.whitelist.length,
            noMatchListItem,
            isManual = _s.dropdown.position == 'manual';

        // ⚠️ Do not render suggestions list  if:
        // 1. there's no whitelist (can happen while async loading) AND new tags arn't allowed
        // 2. dropdown is disabled
        // 3. loader is showing (controlled outside of this code)
        if( (noWhitelist && !allowNewTags && !_s.templates.dropdownItemNoMatch) || _s.dropdown.enable === false || this.state.isLoading ) return;

        clearTimeout(this.dropdownHide__bindEventsTimeout)

        // if no value was supplied, show all the "whitelist" items in the dropdown
        // @type [Array] listItems
        // TODO: add a Setting to control items' sort order for "listItems"
        this.suggestedListItems = this.dropdown.filterListItems.call(this, value)

        // trigger at this exact point to let the developer the chance to manually set "this.suggestedListItems"
        if( value && !this.suggestedListItems.length ){
            this.trigger('dropdown:noMatch', value)

            if( _s.templates.dropdownItemNoMatch )
                noMatchListItem = _s.templates.dropdownItemNoMatch.call(this, {value})
        }

        // if "dropdownItemNoMatch" was no defined, procceed regular flow.
        //
        if( !noMatchListItem ){
            // in mix-mode, if the value isn't included in the whilelist & "enforceWhitelist" setting is "false",
            // then add a custom suggestion item to the dropdown
            if( this.suggestedListItems.length ){
                if( value   &&   allowNewTags   &&   !this.state.editing.scope  &&  !sameStr(this.suggestedListItems[0].value, value) )
                    this.suggestedListItems.unshift({value})
            }
            else{
                if( value   &&   allowNewTags  &&  !this.state.editing.scope ){
                    this.suggestedListItems = [{value}]
                }
                // hide suggestions list if no suggestion matched
                else{
                    this.input.autocomplete.suggest.call(this);
                    this.dropdown.hide.call(this)
                    return;
                }
            }

            firstListItem =  this.suggestedListItems[0]
            firstListItemValue = ""+(isObject(firstListItem) ? firstListItem.value : firstListItem)

            if( _s.autoComplete && firstListItemValue ){
                // only fill the sugegstion if the value of the first list item STARTS with the input value (regardless of "fuzzysearch" setting)
                if( firstListItemValue.indexOf(value) == 0 )
                    this.input.autocomplete.suggest.call(this, firstListItem)
            }
        }

        this.dropdown.fill.call(this, noMatchListItem)

        if( _s.dropdown.highlightFirst )
            this.dropdown.highlightOption.call(this, this.DOM.dropdown.content.children[0])

        // bind events, exactly at this stage of the code. "dropdown.show" method is allowed to be
        // called multiple times, regardless if the dropdown is currently visible, but the events-binding
        // should only be called if the dropdown wasn't previously visible.
        if( !this.state.dropdown.visible )
            // timeout is needed for when pressing arrow down to show the dropdown,
            // so the key event won't get registered in the dropdown events listeners
            setTimeout(this.dropdown.events.binding.bind(this))

        // set the dropdown visible state to be the same as the searched value.
        // MUST be set *before* position() is called
        this.state.dropdown.visible = value || true
        this.state.dropdown.query = value

        this.state.selection = {
            anchorOffset : selection.anchorOffset,
            anchorNode: selection.anchorNode
        }

        // try to positioning the dropdown (it might not yet be on the page, doesn't matter, next code handles this)
        if( !isManual ){
            // a slight delay is needed if the dropdown "position" setting is "text", and nothing was typed in the input,
            // so sadly the "getCaretGlobalPosition" method doesn't recognize the caret position without this delay
            setTimeout(() => {
                this.dropdown.position.call(this)
                this.dropdown.render.call(this)
            })
        }

        // a delay is needed because of the previous delay reason.
        // this event must be fired after the dropdown was rendered & positioned
        setTimeout(() => {
            this.trigger("dropdown:show", this.DOM.dropdown)
        })
    },

    hide( force ){
        var {scope, dropdown} = this.DOM,
            isManual = this.settings.dropdown.position == 'manual' && !force;

        // if there's no dropdown, this means the dropdown events aren't binded
        if( !dropdown || !document.body.contains(dropdown) || isManual ) return;

        window.removeEventListener('resize', this.dropdown.position)
        this.dropdown.events.binding.call(this, false) // unbind all events

        // if the dropdown is open, and the input (scope) is clicked,
        // the dropdown should be now "close", and the next click (on the scope)
        // should re-open it, and without a timeout, clicking to close will re-open immediately
        //  clearTimeout(this.dropdownHide__bindEventsTimeout)
        //  this.dropdownHide__bindEventsTimeout = setTimeout(this.events.binding.bind(this), 250)  // re-bind main events


        scope.setAttribute("aria-expanded", false)
        dropdown.parentNode.removeChild(dropdown)

        // scenario: clicking the scope to show the dropdown, clicking again to hide -> calls dropdown.hide() and then re-focuses the input
        // which casues another onFocus event, which checked "this.state.dropdown.visible" and see it as "false" and re-open the dropdown
        setTimeout(() => {
            this.state.dropdown.visible = false
        }, 100)

        this.state.dropdown.query =
        this.state.ddItemData =
        this.state.ddItemElm =
        this.state.selection = null

        // if the user closed the dropdown (in mix-mode) while a potential tag was detected, flag the current tag
        // so the dropdown won't be shown on following user input for that "tag"
        if( this.state.tag && this.state.tag.value.length ){
            this.state.flaggedTags[this.state.tag.baseOffset] = this.state.tag
        }

        this.trigger("dropdown:hide", dropdown)

        return this
    },

    render(){
        // let the element render in the DOM first, to accurately measure it.
        // this.DOM.dropdown.style.cssText = "left:-9999px; top:-9999px;";
        var ddHeight = getNodeHeight(this.DOM.dropdown),
            _s = this.settings;

        this.DOM.scope.setAttribute("aria-expanded", true)

        // if the dropdown has yet to be appended to the DOM,
        // append the dropdown to the body element & handle events
        if( !document.body.contains(this.DOM.dropdown) ){
            this.DOM.dropdown.classList.add( _s.classNames.dropdownInital )
            this.dropdown.position.call(this, ddHeight)
            _s.dropdown.appendTarget.appendChild(this.DOM.dropdown)

            setTimeout(() =>
                this.DOM.dropdown.classList.remove( _s.classNames.dropdownInital )
            )
        }

        return this
    },

    /**
     *
     * @param {String/Array} HTMLContent - optional
     */
    fill( HTMLContent ){
        HTMLContent = typeof HTMLContent == 'string'
            ? HTMLContent
            : this.dropdown.createListHTML.call(this, HTMLContent || this.suggestedListItems)

        this.DOM.dropdown.content.innerHTML = minify(HTMLContent)
    },

    /**
     * fill data into the suggestions list
     * (mainly used to update the list when removing tags, so they will be re-added to the list. not efficient)
     */
    refilter( value ){
        value = value || this.state.dropdown.query || ''
        this.suggestedListItems = this.dropdown.filterListItems.call(this, value)

        if( this.suggestedListItems.length ){
            this.dropdown.fill.call(this)
        }
        else
            this.dropdown.hide.call(this)

        this.trigger("dropdown:updated", this.DOM.dropdown)
    },

    position( ddHeight ){
        if( this.settings.dropdown.position == 'manual' ) return

        var placeAbove, rect, top, bottom, left, width, parentsPositions,
            ddElm = this.DOM.dropdown,
            viewportHeight = document.documentElement.clientHeight,
            viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            positionTo = viewportWidth > 480 ? this.settings.dropdown.position : 'all',
            ddTarget = this.DOM[positionTo == 'input' ? 'input' : 'scope'];

        ddHeight = ddHeight || ddElm.clientHeight

        function getParentsPositions(p){
            var left = 0,
                top = 0;

            while(p){
                left += p.offsetLeft || 0;
                top += p.offsetTop || 0;
                p = p.parentNode
            }

            return {left, top};
        }

        if( !this.state.dropdown.visible ) return

        if( positionTo == 'text' ){
            rect   = this.getCaretGlobalPosition()
            bottom = rect.bottom
            top    = rect.top
            left   = rect.left
            width  = 'auto'
        }

        else{
            parentsPositions = getParentsPositions(this.settings.dropdown.appendTarget)
            rect   = ddTarget.getBoundingClientRect()

            top    = rect.top + 2 - parentsPositions.top
            bottom = rect.bottom - 1 - parentsPositions.top
            left   = rect.left - parentsPositions.left
            width  = rect.width + 'px'
        }

        top = Math.floor(top)
        bottom = Math.ceil(bottom)

        placeAbove = viewportHeight - rect.bottom < ddHeight

        // flip vertically if there is no space for the dropdown below the input
        ddElm.style.cssText = "left:"  + (left + window.pageXOffset) + "px; width:" + width + ";" + (placeAbove
            ? "top: "   + (top + window.pageYOffset)    + "px"
            : "top: "   + (bottom + window.pageYOffset) + "px");

        ddElm.setAttribute('placement', placeAbove ? "top" : "bottom")
        ddElm.setAttribute('position', positionTo)
    },

    events : {
        /**
         * Events should only be binded when the dropdown is rendered and removed when isn't
         * because there might be multiple Tagify instances on a certain page
         * @param  {Boolean} bindUnbind [optional. true when wanting to unbind all the events]
         */
        binding( bindUnbind = true ){
            // references to the ".bind()" methods must be saved so they could be unbinded later
            var _CB = this.dropdown.events.callbacks,
                // callback-refs
                _CBR = (this.listeners.dropdown = this.listeners.dropdown || {
                    position     : this.dropdown.position.bind(this),
                    onKeyDown    : _CB.onKeyDown.bind(this),
                    onMouseOver  : _CB.onMouseOver.bind(this),
                    onMouseLeave : _CB.onMouseLeave.bind(this),
                    onClick      : _CB.onClick.bind(this),
                    onScroll     : _CB.onScroll.bind(this)
                }),
                action = bindUnbind ? 'addEventListener' : 'removeEventListener';

            if( this.settings.dropdown.position != 'manual' ){
                window[action]('resize', _CBR.position)
                window[action]('keydown', _CBR.onKeyDown)
            }

            this.DOM.dropdown[action]('mouseover', _CBR.onMouseOver)
            this.DOM.dropdown[action]('mouseleave', _CBR.onMouseLeave)
            this.DOM.dropdown[action]('mousedown', _CBR.onClick)
            this.DOM.dropdown.content[action]('scroll', _CBR.onScroll)
        },

        callbacks : {
            onKeyDown(e){
                // get the "active" element, and if there was none (yet) active, use first child
                var activeListElm = this.DOM.dropdown.querySelector("[class$='--active']"),
                    selectedElm = activeListElm;

                switch( e.key ){
                    case 'ArrowDown' :
                    case 'ArrowUp' :
                    case 'Down' :  // >IE11
                    case 'Up' : {  // >IE11
                        e.preventDefault()
                        var dropdownItems;

                        if( selectedElm )
                            selectedElm = selectedElm[(e.key == 'ArrowUp' || e.key == 'Up' ? "previous" : "next") + "ElementSibling"];

                        // if no element was found, loop
                        if( !selectedElm ){
                            dropdownItems = this.DOM.dropdown.content.children
                            selectedElm = dropdownItems[e.key == 'ArrowUp' || e.key == 'Up' ? dropdownItems.length - 1 : 0];
                        }

                        this.dropdown.highlightOption.call(this, selectedElm, true);
                        break;
                    }
                    case 'Escape' :
                    case 'Esc': // IE11
                        this.dropdown.hide.call(this);
                        break;

                    case 'ArrowRight' :
                        if( this.state.actions.ArrowLeft )
                            return
                    case 'Tab' : {
                        // in mix-mode, treat arrowRight like Enter key, so a tag will be created
                        if( this.settings.mode != 'mix' && selectedElm && !this.settings.autoComplete.rightKey && !this.state.editing ){
                            e.preventDefault() // prevents blur so the autocomplete suggestion will not become a tag
                            var tagifySuggestionIdx = selectedElm.getAttribute('tagifySuggestionIdx'),
                                data = tagifySuggestionIdx ? this.suggestedListItems[+tagifySuggestionIdx] : '';

                            this.input.autocomplete.set.call(this, data.value || data)
                            return false
                        }
                        return true
                    }
                    case 'Enter' : {
                        e.preventDefault();
                        this.dropdown.selectOption.call(this, activeListElm)
                        break;
                    }
                    case 'Backspace' : {
                        if( this.settings.mode == 'mix' || this.state.editing.scope ) return;

                        let value = this.input.value.trim()

                        if( value == "" || value.charCodeAt(0) == 8203 ){
                            if( this.settings.backspace === true )
                                this.removeTags()
                            else if( this.settings.backspace == 'edit' )
                                setTimeout(this.editTag.bind(this), 0)
                        }
                    }
                }
            },

            onMouseOver(e){
                var ddItem = e.target.closest('.' + this.settings.classNames.dropdownItem)
                // event delegation check
                ddItem && this.dropdown.highlightOption.call(this, ddItem)
            },

            onMouseLeave(e){
                // de-highlight any previously highlighted option
                this.dropdown.highlightOption.call(this)
            },

            onClick(e){
                if( e.button != 0 || e.target == this.DOM.dropdown ) return; // allow only mouse left-clicks

                var listItemElm = e.target.closest('.' + this.settings.classNames.dropdownItem)

                // temporary set the "actions" state to indicate to the main "blur" event it shouldn't run
                this.state.actions.selectOption = true;
                setTimeout(()=> this.state.actions.selectOption = false, 50)

                this.settings.hooks.suggestionClick(e, {tagify:this, suggestionElm:listItemElm})
                    .then(() => {
                        if( listItemElm )
                            this.dropdown.selectOption.call(this, listItemElm)
                    })
                    .catch(err => err)
            },

            onScroll(e){
                var elm = e.target,
                    pos = elm.scrollTop / (elm.scrollHeight - elm.parentNode.clientHeight) * 100;

                this.trigger("dropdown:scroll", {percentage:Math.round(pos)})
            },
        }
    },

    /**
     * mark the currently active suggestion option
     * @param {Object}  elm            option DOM node
     * @param {Boolean} adjustScroll   when navigation with keyboard arrows (up/down), aut-scroll to always show the highlighted element
     */
    highlightOption( elm, adjustScroll ){
        var className = this.settings.classNames.dropdownItemActive,
            itemData;

        // focus casues a bug in Firefox with the placeholder been shown on the input element
        // if( this.settings.dropdown.position != 'manual' )
        //     elm.focus();

        if( this.state.ddItemElm ){
            this.state.ddItemElm.classList.remove(className)
            this.state.ddItemElm.removeAttribute("aria-selected")
        }

        if( !elm ){
            this.state.ddItemData = null
            this.state.ddItemElm = null
            this.input.autocomplete.suggest.call(this)
            return;
        }

        itemData = this.suggestedListItems[this.getNodeIndex(elm)]
        this.state.ddItemData = itemData
        this.state.ddItemElm = elm

        // this.DOM.dropdown.querySelectorAll("[class$='--active']").forEach(activeElm => activeElm.classList.remove(className));
        elm.classList.add(className);
        elm.setAttribute("aria-selected", true)

        if( adjustScroll )
            elm.parentNode.scrollTop = elm.clientHeight + elm.offsetTop - elm.parentNode.clientHeight

        // Try to autocomplete the typed value with the currently highlighted dropdown item
        if( this.settings.autoComplete ){
            this.input.autocomplete.suggest.call(this, itemData)
            this.dropdown.position.call(this) // suggestions might alter the height of the tagify wrapper because of unkown suggested term length that could drop to the next line
        }
    },

    /**
     * Create a tag from the currently active suggestion option
     * @param {Object} elm  DOM node to select
     */
    selectOption( elm ){
        var {clearOnSelect, closeOnSelect} = this.settings.dropdown

        if( !elm ) {
            this.addTags(this.input.value, true)
            closeOnSelect && this.dropdown.hide.call(this)
            return;
        }

        // if in edit-mode, do not continue but instead replace the tag's text.
        // the scenario is that "addTags" was called from a dropdown suggested option selected while editing

        var tagifySuggestionIdx = elm.getAttribute('tagifySuggestionIdx'),
            selectedOption = tagifySuggestionIdx ? this.suggestedListItems[+tagifySuggestionIdx] : '',
            tagData = selectedOption || this.input.value;

        this.trigger("dropdown:select", {data:tagData, elm})

        if( this.state.editing ){
            this.onEditTagDone(this.state.editing.scope, {
                ...this.state.editing.scope.__tagifyTagData,
                value: tagData.value,
                ...(tagData instanceof Object ? tagData : {}),  // if "tagData" is an Object, include all its properties
                __isValid: true
            })
        }

        // Tagify instances should re-focus to the input element once an option was selected, to allow continuous typing
        else{
            this.addTags([tagData], clearOnSelect)
        }


        // todo: consider not doing this on mix-mode
        setTimeout(() => {
            this.DOM.input.focus()
            this.toggleFocusClass(true)
        })

        if( closeOnSelect ){
            return this.dropdown.hide.call(this)
        }

        this.dropdown.refilter.call(this)
    },

    selectAll(){
        // having suggestedListItems with items messes with "normalizeTags" when wanting
        // to add all tags
        this.suggestedListItems.length = 0;
        this.dropdown.hide.call(this)

        // some whitelist items might have already been added as tags so when addings all of them,
        // skip adding already-added ones, so best to use "filterListItems" method over "settings.whitelist"
        this.addTags(this.dropdown.filterListItems.call(this, ''), true)
        return this
    },

    /**
     * returns an HTML string of the suggestions' list items
     * @param {string} value string to filter the whitelist by
     * @return {Array} list of filtered whitelist items according to the settings provided and current value
     */
    filterListItems( value ){
        var _s = this.settings,
            _sd = _s.dropdown,
            list = [],
            whitelist = _s.whitelist,
            suggestionsCount = _sd.maxItems || Infinity,
            searchKeys = _sd.searchKeys,
            whitelistItem,
            valueIsInWhitelist,
            searchBy,
            isDuplicate,
            niddle,
            i = 0;

        if( !value || !searchKeys.length ){
            return (_s.duplicates
                ? whitelist
                : whitelist.filter(item => !this.isTagDuplicate( isObject(item) ? item.value : item )) // don't include tags which have already been added.
            ).slice(0, suggestionsCount); // respect "maxItems" dropdown setting
        }

        niddle = _sd.caseSensitive
            ? ""+value
            : (""+value).toLowerCase()

        function stringHasAll(s, query){
            return query.toLowerCase().split(' ').every(q => s.includes(q.toLowerCase()))
        }

        for( ; i < whitelist.length; i++ ){
            whitelistItem = whitelist[i] instanceof Object ? whitelist[i] : { value:whitelist[i] } //normalize value as an Object

            if( _sd.fuzzySearch ){
                searchBy = searchKeys.reduce((values, k) => values + " " + (whitelistItem[k]||""), "").toLowerCase()
                valueIsInWhitelist = stringHasAll(_sd.accentedSearch ? unaccent(searchBy) : searchBy, niddle)
            }

            else {
                valueIsInWhitelist = searchKeys.some(k => {
                    var v = '' + (whitelistItem[k] || '') // if key exists, cast to type String

                    if( _sd.accentedSearch ){
                        v = unaccent(v)
                        niddle = unaccent(niddle)
                    }

                    if( !_sd.caseSensitive )
                        v = v.toLowerCase()

                    return v.indexOf(niddle) == 0
                })
            }

            isDuplicate = !_s.duplicates && this.isTagDuplicate( isObject(whitelistItem) ? whitelistItem.value : whitelistItem )

            // match for the value within each "whitelist" item
            if( valueIsInWhitelist && !isDuplicate && suggestionsCount-- )
                list.push(whitelistItem)

            if( suggestionsCount == 0 ) break
        }

        return list;
    },

    /**
     * Creates the dropdown items' HTML
     * @param  {Array} list  [Array of Objects]
     * @return {String}
     */
    createListHTML( optionsArr ){
        return optionsArr.map((suggestion, idx) => {
            if( typeof suggestion == 'string' || typeof suggestion == 'number' )
                suggestion = {value:suggestion}

            var mapValueTo = this.settings.dropdown.mapValueTo,
                value = (mapValueTo
                    ? typeof mapValueTo == 'function' ? mapValueTo(suggestion) : suggestion[mapValueTo]
                    : suggestion.value),
                escapedValue = value && typeof value == 'string' ? escapeHTML(value) : value,
                data = extend({}, suggestion, { value:escapedValue, tagifySuggestionIdx:idx })

            return this.settings.templates.dropdownItem.call(this, data)
        }).join("")
    }
}