import { sameStr, isObject, minify, escapeHTML, extend, unaccent, getNodeHeight } from './helpers'

export function initDropdown(){
    this.dropdown = {}

    for( let p in this._dropdown )
        this.dropdown[p] = typeof this._dropdown[p] === 'function'
            ? this._dropdown[p].bind(this)
            : this._dropdown[p]

    if( this.settings.dropdown.enabled >= 0 )
        this.dropdown.init()
}

export default {
    init(){
        this.DOM.dropdown = this.parseTemplate('dropdown', [this.settings])
        this.DOM.dropdown.content = this.DOM.dropdown.querySelector(this.settings.classNames.dropdownWrapperSelector)
    },

    /**
     * shows the suggestions select box
     * @param {String} value [optional, filter the whitelist by this value]
     */
    show( value ){
        var _s = this.settings,
            firstListItem,
            firstListItemValue,
            allowNewTags = _s.mode == 'mix' && !_s.enforceWhitelist,
            noWhitelist =  !_s.whitelist || !_s.whitelist.length,
            noMatchListItem,
            isManual = _s.dropdown.position == 'manual';

        // if text still exists in the input, and `show` method has no argument, then the input's text should be used
        value = value === undefined ? this.state.inputText : value

        // ⚠️ Do not render suggestions list  if:
        // 1. there's no whitelist (can happen while async loading) AND new tags arn't allowed
        // 2. dropdown is disabled
        // 3. loader is showing (controlled outside of this code)
        if( (noWhitelist && !allowNewTags && !_s.templates.dropdownItemNoMatch) || _s.dropdown.enable === false || this.state.isLoading ) return;

        clearTimeout(this.dropdownHide__bindEventsTimeout)

        // if no value was supplied, show all the "whitelist" items in the dropdown
        // @type [Array] listItems
        // TODO: add a Setting to control items' sort order for "listItems"
        this.suggestedListItems = this.dropdown.filterListItems(value)

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
                    this.dropdown.hide()
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

        this.dropdown.fill(noMatchListItem)

        if( _s.dropdown.highlightFirst )
            this.dropdown.highlightOption(this.DOM.dropdown.content.children[0])

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

        this.setStateSelection()

        // try to positioning the dropdown (it might not yet be on the page, doesn't matter, next code handles this)
        if( !isManual ){
            // a slight delay is needed if the dropdown "position" setting is "text", and nothing was typed in the input,
            // so sadly the "getCaretGlobalPosition" method doesn't recognize the caret position without this delay
            setTimeout(() => {
                this.dropdown.position()
                this.dropdown.render()
            })
        }

        // a delay is needed because of the previous delay reason.
        // this event must be fired after the dropdown was rendered & positioned
        setTimeout(() => {
            this.trigger("dropdown:show", this.DOM.dropdown)
        })
    },

    /**
     * Hides the dropdown (if it's not managed manually by the developer)
     * @param {Boolean} overrideManual
     */
    hide( overrideManual ){
        var {scope, dropdown} = this.DOM,
            isManual = this.settings.dropdown.position == 'manual' && !overrideManual;

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

    /**
     * Toggles dropdown show/hide
     * @param {Boolean} show forces the dropdown to show
     */
    toggle(show){
        this.dropdown[this.state.dropdown.visible && !show ? 'hide' : 'show']()
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
            this.dropdown.position(ddHeight)
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
            : this.dropdown.createListHTML(HTMLContent || this.suggestedListItems)

        this.DOM.dropdown.content.innerHTML = minify(HTMLContent)
    },

    /**
     * fill data into the suggestions list
     * (mainly used to update the list when removing tags, so they will be re-added to the list. not efficient)
     */
    refilter( value ){
        value = value || this.state.dropdown.query || ''
        this.suggestedListItems = this.dropdown.filterListItems(value)

        this.dropdown.fill()

        if( !this.suggestedListItems.length )
            this.dropdown.hide()

        this.trigger("dropdown:updated", this.DOM.dropdown)
    },

    position( ddHeight ){
        var _sd = this.settings.dropdown;

        if( _sd.position == 'manual' ) return

        var rect, top, bottom, left, width, parentsPositions,
            ddElm = this.DOM.dropdown,
            placeAbove = _sd.placeAbove,
            viewportHeight = document.documentElement.clientHeight,
            viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            positionTo = viewportWidth > 480 ? _sd.position : 'all',
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

            top    = rect.top - parentsPositions.top
            bottom = rect.bottom - 1 - parentsPositions.top
            left   = rect.left - parentsPositions.left
            width  = rect.width + 'px'
        }

        top = Math.floor(top)
        bottom = Math.ceil(bottom)

        placeAbove = placeAbove === undefined
            ? viewportHeight - rect.bottom < ddHeight
            : placeAbove

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
                var selectedElm = this.DOM.dropdown.querySelector(this.settings.classNames.dropdownItemActiveSelector),
                    selectedElmData = this.dropdown.getSuggestionDataByNode(selectedElm)

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

                        selectedElmData = this.dropdown.getSuggestionDataByNode(selectedElm)

                        this.dropdown.highlightOption(selectedElm, true);
                        break;
                    }
                    case 'Escape' :
                    case 'Esc': // IE11
                        this.dropdown.hide();
                        break;

                    case 'ArrowRight' :
                        if( this.state.actions.ArrowLeft )
                            return
                    case 'Tab' : {
                        // in mix-mode, treat arrowRight like Enter key, so a tag will be created
                        if( this.settings.mode != 'mix' && selectedElm && !this.settings.autoComplete.rightKey && !this.state.editing ){
                            e.preventDefault() // prevents blur so the autocomplete suggestion will not become a tag
                            var value = this.dropdown.getMappedValue(selectedElmData)

                            this.input.autocomplete.set.call(this, value)
                            return false
                        }
                        return true
                    }
                    case 'Enter' : {
                        e.preventDefault()

                        this.settings.hooks.suggestionClick(e, {tagify:this, tagData:selectedElmData, suggestionElm:selectedElm})
                            .then(() => {
                                if( selectedElm )
                                    return this.dropdown.selectOption(selectedElm)
                                else
                                    this.dropdown.hide()

                                if( this.settings.mode != 'mix' )
                                    this.addTags(this.state.inputText.trim(), true)
                            })
                            .catch(err => err)

                        break;
                    }
                    case 'Backspace' : {
                        if( this.settings.mode == 'mix' || this.state.editing.scope ) return;

                        const value = this.input.raw.call(this)

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
                var ddItem = e.target.closest(this.settings.classNames.dropdownItemSelector)
                // event delegation check
                ddItem && this.dropdown.highlightOption(ddItem)
            },

            onMouseLeave(e){
                // de-highlight any previously highlighted option
                this.dropdown.highlightOption()
            },

            onClick(e){
                if( e.button != 0 || e.target == this.DOM.dropdown || e.target == this.DOM.dropdown.content ) return; // allow only mouse left-clicks

                var selectedElm = e.target.closest(this.settings.classNames.dropdownItemSelector),
                    selectedElmData = this.dropdown.getSuggestionDataByNode(selectedElm)

                // temporary set the "actions" state to indicate to the main "blur" event it shouldn't run
                this.state.actions.selectOption = true;
                setTimeout(()=> this.state.actions.selectOption = false, 50)

                this.settings.hooks.suggestionClick(e, {tagify:this, tagData:selectedElmData, suggestionElm:selectedElm})
                    .then(() => {
                        if( selectedElm )
                            this.dropdown.selectOption(selectedElm)
                        else
                            this.dropdown.hide()
                    })
                    .catch(err => console.warn(err))
            },

            onScroll(e){
                var elm = e.target,
                    pos = elm.scrollTop / (elm.scrollHeight - elm.parentNode.clientHeight) * 100;

                this.trigger("dropdown:scroll", {percentage:Math.round(pos)})
            },
        }
    },

    getSuggestionDataByNode( tagElm ){
        var idx = tagElm ? +tagElm.getAttribute('tagifySuggestionIdx') : -1;
        return this.suggestedListItems[idx] || null
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

        // this.DOM.dropdown.querySelectorAll("." + this.settings.classNames.dropdownItemActive).forEach(activeElm => activeElm.classList.remove(className));
        elm.classList.add(className);
        elm.setAttribute("aria-selected", true)

        if( adjustScroll )
            elm.parentNode.scrollTop = elm.clientHeight + elm.offsetTop - elm.parentNode.clientHeight

        // Try to autocomplete the typed value with the currently highlighted dropdown item
        if( this.settings.autoComplete ){
            this.input.autocomplete.suggest.call(this, itemData)
            this.dropdown.position() // suggestions might alter the height of the tagify wrapper because of unkown suggested term length that could drop to the next line
        }
    },

    /**
     * Create a tag from the currently active suggestion option
     * @param {Object} elm  DOM node to select
     */
    selectOption( elm ){
        var {clearOnSelect, closeOnSelect} = this.settings.dropdown,
            addedTag;

        if( !elm ) {
            addedTag = this.addTags(this.state.inputText, true)
            closeOnSelect && this.dropdown.hide()
            return;
        }

        // if in edit-mode, do not continue but instead replace the tag's text.
        // the scenario is that "addTags" was called from a dropdown suggested option selected while editing

        var tagifySuggestionIdx = elm.getAttribute('tagifySuggestionIdx'),
            tagData = this.suggestedListItems[+tagifySuggestionIdx];

        this.trigger("dropdown:select", {data:tagData, elm})

        // The above event must be triggered, regardless of anything else which might go wrong
        if( !tagifySuggestionIdx || !tagData ){
            this.dropdown.hide()
            return
        }

        if( this.state.editing )
            // normalizing value, because "tagData" might be a string, and therefore will not be able to extend the object
            this.onEditTagDone(null, extend({__isValid: true}, this.normalizeTags(tagData)[0]))

        // Tagify instances should re-focus to the input element once an option was selected, to allow continuous typing
        else{
            addedTag = this[this.settings.mode == 'mix' ? "addMixTags" : "addTags"]([tagData], clearOnSelect)
        }

        // todo: consider not doing this on mix-mode
        if( !this.DOM.input.parentNode )
            return

        setTimeout(() => {
            this.DOM.input.focus()
            this.toggleFocusClass(true)
            this.placeCaretAfterNode(addedTag)
        })

        if( closeOnSelect ){
            setTimeout(this.dropdown.hide.bind(this))
        }
        else
            this.dropdown.refilter()
    },

    selectAll(){
        // having suggestedListItems with items messes with "normalizeTags" when wanting
        // to add all tags
        this.suggestedListItems.length = 0;
        this.dropdown.hide()

        // some whitelist items might have already been added as tags so when addings all of them,
        // skip adding already-added ones, so best to use "filterListItems" method over "settings.whitelist"
        this.addTags(this.dropdown.filterListItems(''), true)
        return this
    },

    /**
     * returns an HTML string of the suggestions' list items
     * @param {String} value string to filter the whitelist by
     * @param {Object} options "exact" - for exact complete match
     * @return {Array} list of filtered whitelist items according to the settings provided and current value
     */
    filterListItems( value, options ){
        var _s = this.settings,
            _sd = _s.dropdown,
            options = options || {},
            value = (_s.mode == 'select' && this.value.length && this.value[0][_s.tagTextProp] == value
                ? '' // do not filter if the tag, which is already selecetd in "select" mode, is the same as the typed text
                : value),
            list = [],
            exactMatchesList = [],
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

        // checks if ALL of the words in the search query exists in the current whitelist item, regardless of their order
        function stringHasAll(s, query){
            return query.toLowerCase().split(' ').every(q => s.includes(q.toLowerCase()))
        }

        for( ; i < whitelist.length; i++ ){
            let startsWithMatch, exactMatch;

            whitelistItem = whitelist[i] instanceof Object ? whitelist[i] : { value:whitelist[i] } //normalize value as an Object

            let itemWithoutSearchKeys = !Object.keys(whitelistItem).some(k => searchKeys.includes(k) ),
                _searchKeys = itemWithoutSearchKeys ? ["value"] : searchKeys

            if( _sd.fuzzySearch && !options.exact ){
                searchBy = _searchKeys.reduce((values, k) => values + " " + (whitelistItem[k]||""), "").toLowerCase().trim()

                if( _sd.accentedSearch ){
                    searchBy = unaccent(searchBy)
                    niddle = unaccent(niddle)
                }

                startsWithMatch = searchBy.indexOf(niddle) == 0
                exactMatch = searchBy === niddle
                valueIsInWhitelist = stringHasAll(searchBy, niddle)
            }

            else {
                startsWithMatch = true;
                valueIsInWhitelist = _searchKeys.some(k => {
                    var v = '' + (whitelistItem[k] || '') // if key exists, cast to type String

                    if( _sd.accentedSearch ){
                        v = unaccent(v)
                        niddle = unaccent(niddle)
                    }

                    if( !_sd.caseSensitive )
                        v = v.toLowerCase()

                    exactMatch = v === niddle

                    return options.exact
                        ? v === niddle
                        : v.indexOf(niddle) == 0
                })
            }

            isDuplicate = !_s.duplicates && this.isTagDuplicate( isObject(whitelistItem) ? whitelistItem.value : whitelistItem )

            // match for the value within each "whitelist" item
            if( valueIsInWhitelist && !isDuplicate )
                if( exactMatch && startsWithMatch)
                    exactMatchesList.push(whitelistItem)
                else if( _sd.sortby == 'startsWith' && startsWithMatch )
                    list.unshift(whitelistItem)
                else
                    list.push(whitelistItem)
        }

        // custom sorting function
        return typeof _sd.sortby == 'function'
            ? _sd.sortby(exactMatchesList.concat(list), niddle)
            : exactMatchesList.concat(list).slice(0, suggestionsCount)
    },

    /**
     * Returns the final value of a tag data (object) with regards to the "mapValueTo" dropdown setting
     * @param {Object} tagData
     * @returns
     */
    getMappedValue(tagData){
        var mapValueTo = this.settings.dropdown.mapValueTo,
            value = (mapValueTo
                ? typeof mapValueTo == 'function' ? mapValueTo(tagData) : (tagData[mapValueTo] || tagData.value)
                : tagData.value);

        return value
    },

    /**
     * Creates the dropdown items' HTML
     * @param  {Array} list  [Array of Objects]
     * @return {String}
     */
    createListHTML( optionsArr ){
        return extend([], optionsArr).map((suggestion, idx) => {
            if( typeof suggestion == 'string' || typeof suggestion == 'number' )
                suggestion = {value:suggestion}

            var value = this.dropdown.getMappedValue(suggestion)

            suggestion.value = value && typeof value == 'string'
                ? escapeHTML(value)
                : value

            var tagHTMLString = this.settings.templates.dropdownItem.apply(this, [suggestion, this])

            // make sure the sugestion index is present as attribute, to match the data when one is selected
            tagHTMLString = tagHTMLString
                .replace(/\s*tagifySuggestionIdx=(["'])(.*?)\1/gmi, '') // remove the "tagifySuggestionIdx" attribute if for some reason was there
                .replace('>', ` tagifySuggestionIdx="${idx}">`) // add "tagifySuggestionIdx"

            return tagHTMLString
        }).join("")
    }
}
