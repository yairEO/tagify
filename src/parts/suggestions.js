import { isObject, escapeHTML, extend, unaccent, logger } from './helpers'


/**
 * Tagify's dropdown suggestions-related logic
 */

export default {
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
                    position          : this.dropdown.position.bind(this, null),
                    onKeyDown         : _CB.onKeyDown.bind(this),
                    onMouseOver       : _CB.onMouseOver.bind(this),
                    onMouseLeave      : _CB.onMouseLeave.bind(this),
                    onClick           : _CB.onClick.bind(this),
                    onScroll          : _CB.onScroll.bind(this),
                }),
                action = bindUnbind ? 'addEventListener' : 'removeEventListener';

            if( this.settings.dropdown.position != 'manual' ){
                document[action]('scroll', _CBR.position, true)
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
                // ignore keys during IME composition
                if( !this.state.hasFocus || this.state.composing )
                    return

                // get the "active" element, and if there was none (yet) active, use first child
                var _s = this.settings,
                    includeSelectedTags = _s.dropdown.includeSelectedTags,
                    selectedElm = this.DOM.dropdown.querySelector(_s.classNames.dropdownItemActiveSelector),
                    selectedElmData = this.dropdown.getSuggestionDataByNode(selectedElm),
                    isMixMode = _s.mode == 'mix',
                    isSelectMode = _s.mode == 'select';

                _s.hooks.beforeKeyDown(e, {tagify:this})
                    .then(result => {
                        switch( e.key ){
                            case 'ArrowDown' :
                            case 'ArrowUp' :
                            case 'Down' :  // >IE11
                            case 'Up' : {  // >IE11
                                e.preventDefault()
                                var dropdownItems = this.dropdown.getAllSuggestionsRefs(),
                                    actionUp = e.key == 'ArrowUp' || e.key == 'Up';

                                if( selectedElm ) {
                                    selectedElm = this.dropdown.getNextOrPrevOption(selectedElm, !actionUp)
                                }

                                // if no element was found OR current item is not a "real" item, loop
                                if( !selectedElm || !selectedElm.matches(_s.classNames.dropdownItemSelector) ){
                                    selectedElm = dropdownItems[actionUp ? dropdownItems.length - 1 : 0];
                                }

                                this.dropdown.highlightOption(selectedElm, true)
                                // selectedElm.scrollIntoView({inline: 'nearest', behavior: 'smooth'})
                                break;
                            }
                            case 'PageUp':
                            case 'PageDown': {
                                e.preventDefault()
                                const dropdownItems = this.dropdown.getAllSuggestionsRefs()
                                const itemsPerPage = Math.floor(this.DOM.dropdown.content.clientHeight / dropdownItems[0]?.offsetHeight) || 1
                                const isPageUp = e.key === 'PageUp'

                                if (selectedElm) {
                                    const currentIndex = dropdownItems.indexOf(selectedElm)
                                    const targetIndex = isPageUp
                                        ? Math.max(0, currentIndex - itemsPerPage)
                                        : Math.min(dropdownItems.length - 1, currentIndex + itemsPerPage)
                                    selectedElm = dropdownItems[targetIndex]
                                } else {
                                    selectedElm = dropdownItems[0]
                                }

                                this.dropdown.highlightOption(selectedElm, true)
                                break;
                            }
                            case 'Home':
                            case 'End': {
                                e.preventDefault()
                                const dropdownItems = this.dropdown.getAllSuggestionsRefs()
                                selectedElm = dropdownItems[e.key === 'Home' ? 0 : dropdownItems.length - 1]
                                this.dropdown.highlightOption(selectedElm, true)
                                break;
                            }
                            case 'Escape' :
                            case 'Esc': // IE11
                                this.dropdown.hide();
                                break;

                            case 'ArrowRight' :
                                // do not continue if the left arrow key was pressed while typing, because assuming the user wants to bypass any of the below logic and edit the content without intervention.
                                // also do not procceed if a tag should be created when the setting `autoComplete.rightKey` is set to `true`
                                if( this.state.actions.ArrowLeft || _s.autoComplete.rightKey )
                                    return
                            case 'Tab' : {
                                let shouldAutocompleteOnKey = !_s.autoComplete.rightKey || !_s.autoComplete.tabKey

                                // in mix-mode, treat arrowRight like Enter key, so a tag will be created
                                if( !isMixMode && !isSelectMode && selectedElm && shouldAutocompleteOnKey && !this.state.editing && selectedElmData ){
                                    e.preventDefault() // prevents blur so the autocomplete suggestion will not become a tag
                                    var value = this.dropdown.getMappedValue(selectedElmData)

                                    this.state.autoCompleteData = selectedElmData;
                                    this.input.autocomplete.set.call(this, value)
                                    return false
                                }
                                return true
                            }
                            case 'Enter' : {
                                e.preventDefault()

                                // temporary set the "actions" state to indicate to the main "blur" event it shouldn't execute any if its logic.
                                // a `100ms` is a good-enough timeout after some testing
                                this.state.actions.selectOption = true;
                                setTimeout(()=> this.state.actions.selectOption = false, 100)

                                _s.hooks.suggestionClick(e, {tagify:this, tagData:selectedElmData, suggestionElm:selectedElm})
                                    .then(() => {
                                        if( selectedElm ){
                                            var nextOrPrevOption = includeSelectedTags ? selectedElm : this.dropdown.getNextOrPrevOption(selectedElm, !actionUp);

                                            this.dropdown.selectOption(selectedElm, e, () => {
                                                // highlight next option
                                                if(nextOrPrevOption) {
                                                    var nextOrPrevOptionValue = nextOrPrevOption.getAttribute('value')
                                                    nextOrPrevOption = this.dropdown.getSuggestionNodeByValue(nextOrPrevOptionValue)
                                                    this.dropdown.highlightOption(nextOrPrevOption)
                                                }
                                            })

                                            return
                                        }
                                        else
                                            this.dropdown.hide()

                                        if( !isMixMode )
                                            this.addTags(this.state.inputText.trim(), true)
                                    })
                                    .catch(err => logger.warn(err))

                                break;
                            }
                            case 'Backspace' : {
                                if( isMixMode || this.state.editing.scope ) return;

                                const value = this.input.raw.call(this)

                                if( value == "" || value.charCodeAt(0) == 8203 ){
                                    if( _s.backspace === true )
                                        this.removeTags()
                                    else if( _s.backspace == 'edit' )
                                        setTimeout(this.editTag.bind(this), 0)
                                }
                            }
                        }
                    })
            },

            onMouseOver(e){
                var ddItem = e.target.closest(this.settings.classNames.dropdownItemSelector)
                // event delegation check
                this.dropdown.highlightOption(ddItem)
            },

            onMouseLeave(e){
                // de-highlight any previously highlighted option
                this.dropdown.highlightOption()
            },

            onClick(e){
                if( e.button != 0 || e.target == this.DOM.dropdown || e.target == this.DOM.dropdown.content ) return; // allow only mouse left-clicks

                var selectedElm = e.target.closest(this.settings.classNames.dropdownItemSelector),
                    selectedElmData = this.dropdown.getSuggestionDataByNode(selectedElm)

                // temporary set the "actions" state to indicate to the main "blur" event it shouldn't execute any if its logic.
                // a `100ms` is a good-enough timeout after some testing
                this.state.actions.selectOption = true;
                setTimeout(()=> this.state.actions.selectOption = false, 100)

                this.settings.hooks.suggestionClick(e, {tagify:this, tagData:selectedElmData, suggestionElm:selectedElm})
                    .then(() => {
                        if( selectedElm )
                            this.dropdown.selectOption(selectedElm, e)
                        else
                            this.dropdown.hide()
                    })
                    .catch(err => logger.warn(err))
            },

            onScroll(e){
                var elm = e.target,
                    pos = elm.scrollTop / (elm.scrollHeight - elm.parentNode.clientHeight) * 100;

                this.trigger("dropdown:scroll", {percentage:Math.round(pos)})
            },
        }
    },

    /**
     * fill data into the suggestions list
     * (mainly used to update the list when removing tags while the suggestions dropdown is visible, so they will be re-added to the list. not efficient)
     */
    refilter( value ){
        value = value || this.state.dropdown.query || ''
        this.suggestedListItems = this.dropdown.filterListItems(value)

        this.dropdown.fill()

        if( !this.suggestedListItems.length )
            this.dropdown.hide()

        this.trigger("dropdown:updated", this.DOM.dropdown)
    },

    /**
     * Given a suggestion-item, return the data associated with it
     * @param {HTMLElement} tagElm
     * @returns Object
     */
    getSuggestionDataByNode( tagElm ){
        var item, value = tagElm && tagElm.getAttribute('value')

        for(var i = this.suggestedListItems.length; i--; ) {
            item = this.suggestedListItems[i]
            if( isObject(item) && item.value == value ) return item
            // for primitive whitelist items:
            else if( item == value ) return {value: item}
        }
    },

    getSuggestionNodeByValue( value ){
        var dropdownItems = this.dropdown.getAllSuggestionsRefs()
        return dropdownItems.find(item => item.getAttribute('value') === value);
    },

    getNextOrPrevOption(selected, next = true) {
        var dropdownItems = this.dropdown.getAllSuggestionsRefs(),
            selectedIdx = dropdownItems.findIndex(item => item === selected);

        return next ? dropdownItems[selectedIdx + 1] : dropdownItems[selectedIdx - 1]
    },

    /**
     * mark the currently active suggestion option
     * @param {Object}  elm            option DOM node
     * @param {Boolean} adjustScroll   when navigation with keyboard arrows (up/down), auto-scroll to always show the highlighted element
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

        itemData = this.dropdown.getSuggestionDataByNode(elm)
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
     * @param {Object} event The original Click event, if available (since keyboard ENTER key also triggers this method)
     */
    selectOption( elm, event, onSelect ){
        var _s = this.settings,
            includeSelectedTags = _s.dropdown.includeSelectedTags,
            {clearOnSelect, closeOnSelect} = _s.dropdown;

        if( !elm ) {
            this.addTags(this.state.inputText, true)
            closeOnSelect && this.dropdown.hide()
            return;
        }

        event = event || {}

        // if in edit-mode, do not continue but instead replace the tag's text.
        // the scenario is that "addTags" was called from a dropdown suggested option selected while editing

        var value = elm.getAttribute('value'),
            isNoMatch = value == 'noMatch',
            isMixMode = _s.mode == 'mix',
            tagData = this.suggestedListItems.find(item => (item.value ?? item) == value)

        // The below event must be triggered, regardless of anything else which might go wrong
        this.trigger('dropdown:select', {data:tagData, elm, event})

        if( !tagData && !isNoMatch ){
            closeOnSelect && setTimeout(this.dropdown.hide.bind(this))
            return
        }

        if( this.state.editing ) {
            let normalizedTagData = this.normalizeTags([tagData])[0]
            tagData = _s.transformTag.call(this, normalizedTagData) || normalizedTagData

            // normalizing value, because "tagData" might be a string, and therefore will not be able to extend the object
            this.onEditTagDone(null, extend({__isValid: true}, tagData))
        }
        // Tagify instances should re-focus to the input element once an option was selected, to allow continuous typing
        else {
            this[isMixMode ? "addMixTags" : "addTags"]([tagData || this.input.raw.call(this)], clearOnSelect)
        }

        if( !isMixMode && !this.DOM.input.parentNode )
            return

        setTimeout(() => {
            this.DOM.input.focus()
            this.toggleFocusClass(true)
        })

        closeOnSelect && setTimeout(this.dropdown.hide.bind(this))

        // execute these tasks once a suggestion has been selected
        if(includeSelectedTags) {
            onSelect && onSelect()
        }

        // if the selected suggestion is removed after being selected, more things things needs to be done:
        else {
            elm.addEventListener('transitionend', () => {
                this.dropdown.fillHeaderFooter()

                setTimeout(() => {
                    elm.remove()
                    this.dropdown.refilter()
                    onSelect && onSelect()
                }, 100)
            }, {once: true})

            // hide selected suggestion
            elm.classList.add(this.settings.classNames.dropdownItemHidden)
        }
    },

    // adds all the suggested items, including the ones which are not currently rendered,
    // unless specified otherwise (by the "onlyRendered" argument)
    selectAll( onlyRendered ){
        // having suggestedListItems with items messes with "normalizeTags" when wanting
        // to add all tags
        this.suggestedListItems.length = 0;
        this.dropdown.hide()

        this.dropdown.filterListItems('');

        var tagsToAdd = this.dropdown.filterListItems('');

        if( !onlyRendered )
            tagsToAdd = this.state.dropdown.suggestions

        // some whitelist items might have already been added as tags so when addings all of them,
        // skip adding already-added ones, so best to use "filterListItems" method over "settings.whitelist"
        this.addTags(tagsToAdd, true)
        return this
    },

    /**
     * returns an HTML string of the suggestions' list items
     * @param {String} value string t
     * o filter the whitelist by
     * @param {Object} options "exact" - for exact complete match
     * @return {Array} list of filtered whitelist items according to the settings provided and current value
     */
    filterListItems( value, options ){
        var _s = this.settings,
            _sd = _s.dropdown,
            options = options || {},
            list = [],
            exactMatchesList = [],
            whitelist = _s.whitelist,
            suggestionsCount = _sd.maxItems >= 0 ? _sd.maxItems : Infinity,
            includeSelectedTags = _sd.includeSelectedTags,
            hasCustomSort = typeof _sd.sortby == 'function',
            searchKeys = _sd.searchKeys,
            whitelistItem,
            valueIsInWhitelist,
            searchBy,
            isDuplicate,
            niddle,
            i = 0;

        value = (_s.mode == 'select' && this.value.length && this.value[0][_s.tagTextProp] == value
            ? '' // do not filter if the tag, which is already selecetd in "select" mode, is the same as the typed text
            : value);

        if( !value || !searchKeys.length ){
            list = includeSelectedTags
                ? whitelist
                : whitelist.filter(item => !this.isTagDuplicate( isObject(item) ? item.value : item )) // don't include tags which have already been added.

            var filteredList = hasCustomSort
                ? _sd.sortby(list, niddle)
                : list.slice(0, suggestionsCount); // respect "maxItems" dropdown setting

            this.state.dropdown.suggestions = filteredList;

            return filteredList;
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

            isDuplicate = !_sd.includeSelectedTags && this.isTagDuplicate( isObject(whitelistItem) ? whitelistItem.value : whitelistItem )

            // match for the value within each "whitelist" item
            if( valueIsInWhitelist && !isDuplicate )
                if( exactMatch && startsWithMatch)
                    exactMatchesList.push(whitelistItem)
                else if( _sd.sortby == 'startsWith' && startsWithMatch )
                    list.unshift(whitelistItem)
                else
                    list.push(whitelistItem)
        }

        this.state.dropdown.suggestions = exactMatchesList.concat(list);

        // custom sorting function
        var filteredList = hasCustomSort
            ? _sd.sortby(exactMatchesList.concat(list), niddle)
            : exactMatchesList.concat(list).slice(0, suggestionsCount)

        this.state.dropdown.suggestions = filteredList;
        return filteredList
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
     * @param  {Array} sugegstionsList  [Array of Objects]
     * @return {String}
     */
    createListHTML( sugegstionsList ){
        return extend([], sugegstionsList).map((suggestion, idx) => {
            if( typeof suggestion == 'string' || typeof suggestion == 'number' )
                suggestion = {value:suggestion}

            var mappedValue = this.dropdown.getMappedValue(suggestion);

            mappedValue = (typeof mappedValue == 'string' && this.settings.dropdown.escapeHTML)
                ? escapeHTML(mappedValue)
                : mappedValue;

            return this.settings.templates.dropdownItem.apply(this, [{...suggestion, mappedValue}, this])
        }).join("")
    }
}