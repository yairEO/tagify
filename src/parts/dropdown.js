import { sameStr, isObject, minify, getNodeHeight, getCaretGlobalPosition } from './helpers'
import suggestionsMethods from './suggestions'

export function initDropdown(){
    this.dropdown = {}

    // auto-bind "this" to all the dropdown methods
    for( let p in this._dropdown )
        this.dropdown[p] = typeof this._dropdown[p] === 'function'
            ? this._dropdown[p].bind(this)
            : this._dropdown[p]

    this.dropdown.refs()
    this.DOM.dropdown.__tagify = this
}

export default {
    ...suggestionsMethods,

    refs(){
        this.DOM.dropdown = this.parseTemplate('dropdown', [this.settings])
        this.DOM.dropdown.content = this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-wrapper']")
    },

    getHeaderRef(){
        return this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-header']")
    },

    getFooterRef(){
        return this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-footer']")
    },

    getAllSuggestionsRefs(){
        return [...this.DOM.dropdown.content.querySelectorAll(this.settings.classNames.dropdownItemSelector)]
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
        if( (noWhitelist && !allowNewTags && !_s.templates.dropdownItemNoMatch)
            || _s.dropdown.enabled === false
            || this.state.isLoading
            || this.settings.readonly )
            return;

        clearTimeout(this.dropdownHide__bindEventsTimeout)

        // if no value was supplied, show all the "whitelist" items in the dropdown
        // @type [Array] listItems
        this.suggestedListItems = this.dropdown.filterListItems(value)

        // trigger at this exact point to let the developer the chance to manually set "this.suggestedListItems"
        if( value && !this.suggestedListItems.length ){
            this.trigger('dropdown:noMatch', value)

            if( _s.templates.dropdownItemNoMatch )
                noMatchListItem = _s.templates.dropdownItemNoMatch.call(this, {value})
        }

        // if "dropdownItemNoMatch" was not defined, procceed regular flow.
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

        if( _s.dropdown.highlightFirst ) {
            this.dropdown.highlightOption(this.DOM.dropdown.content.querySelector(_s.classNames.dropdownItemSelector))
        }

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

    getAppendTarget() {
        var _sd = this.settings.dropdown;
        return typeof _sd.appendTarget === 'function' ? _sd.appendTarget() : _sd.appendTarget;
    },

    render(){
        // let the element render in the DOM first, to accurately measure it.
        // this.DOM.dropdown.style.cssText = "left:-9999px; top:-9999px;";
        var ddHeight = getNodeHeight(this.DOM.dropdown),
            _s = this.settings,
            appendTarget = this.dropdown.getAppendTarget();

        if( _s.dropdown.enabled === false ) return this;

        this.DOM.scope.setAttribute("aria-expanded", true)

        // if the dropdown has yet to be appended to the DOM,
        // append the dropdown to the body element & handle events
        if( !document.body.contains(this.DOM.dropdown) ){
            this.DOM.dropdown.classList.add( _s.classNames.dropdownInital )
            this.dropdown.position(ddHeight)
            appendTarget.appendChild(this.DOM.dropdown)

            setTimeout(() =>
                this.DOM.dropdown.classList.remove( _s.classNames.dropdownInital )
            )
        }

        return this
    },

    /**
     * re-renders the dropdown content element (see "dropdownContent" in templates file)
     * @param {String/Array} HTMLContent - optional
     */
    fill( HTMLContent ){
        HTMLContent = typeof HTMLContent == 'string'
            ? HTMLContent
            : this.dropdown.createListHTML(HTMLContent || this.suggestedListItems)

        var dropdownContent = this.settings.templates.dropdownContent.call(this, HTMLContent)

        this.DOM.dropdown.content.innerHTML = minify(dropdownContent)
    },

    /**
     * Re-renders only the header & footer.
     * Used when selecting a suggestion and it is wanted that the suggestions dropdown stays open.
     * Since the list of sugegstions is not being re-rendered completely every time a suggestion is selected (the item is transitioned-out)
     * then the header & footer should be kept in sync with the suggestions data change
     */
    fillHeaderFooter(){
        var suggestions = this.dropdown.filterListItems(this.state.dropdown.query),
            newHeaderElem = this.parseTemplate('dropdownHeader', [suggestions]),
            newFooterElem = this.parseTemplate('dropdownFooter', [suggestions]),
            headerRef = this.dropdown.getHeaderRef(),
            footerRef = this.dropdown.getFooterRef();

        newHeaderElem && headerRef?.parentNode.replaceChild(newHeaderElem, headerRef)
        newFooterElem && footerRef?.parentNode.replaceChild(newFooterElem, footerRef)
    },

    /**
     * dropdown positioning logic
     * (shown above/below or next to typed text for mix-mode)
     */
    position( ddHeight ){
        var _sd = this.settings.dropdown,
            appendTarget = this.dropdown.getAppendTarget();

        if( _sd.position == 'manual' || !appendTarget) return

        var rect, top, bottom, left, width, ancestorsOffsets,
            isPlacedAbove, hasSpaceOnRight,
            cssTop, cssLeft,
            ddElm = this.DOM.dropdown,
            isRTL = _sd.RTL,
            isDefaultAppendTarget = appendTarget === document.body,
            isSelfAppended = appendTarget === this.DOM.scope,
            appendTargetScrollTop = isDefaultAppendTarget ? window.pageYOffset : appendTarget.scrollTop,
            root = document.fullscreenElement || document.webkitFullscreenElement || document.documentElement,
            viewportHeight = root.clientHeight,
            viewportWidth = Math.max(root.clientWidth || 0, window.innerWidth || 0),
            positionTo = viewportWidth > 480 ? _sd.position : 'all',
            ddTarget = this.DOM[positionTo == 'input' ? 'input' : 'scope'],
            MIN_DISTANCE_FROM_VIEWPORT_H_EDGE = 120;

        ddHeight = ddHeight || ddElm.clientHeight

        function getAncestorsOffsets(p){
            var top = 0, left = 0;

            p = p.parentNode;

            // when in element-fullscreen mode, do not go above the fullscreened-element
            while(p && p != root){
                top += p.offsetTop || 0
                left += p.offsetLeft || 0
                p = p.parentNode
            }

            return {top, left};
        }

        function getAccumulatedAncestorsScrollTop() {
            var scrollTop = 0,
                p = _sd.appendTarget.parentNode;

            while(p){
                scrollTop += p.scrollTop || 0;
                p = p.parentNode
            }

            return scrollTop;
        }

        if( !this.state.dropdown.visible ) return

        if( positionTo == 'text' ){
            rect   = getCaretGlobalPosition()
            bottom = rect.bottom
            top    = rect.top
            left   = rect.left
            width  = 'auto'
        }

        else{
            ancestorsOffsets = getAncestorsOffsets(appendTarget)
            rect   = ddTarget.getBoundingClientRect()
            top    = isSelfAppended ? -1 : rect.top - ancestorsOffsets.top
            bottom = (isSelfAppended ? rect.height : rect.bottom - ancestorsOffsets.top) - 1
            left   = isSelfAppended ? -1 : rect.left - ancestorsOffsets.left
            width  = rect.width + 'px'
        }

        // if the "append target" isn't the default, correct the `top` variable by ignoring any scrollTop of the target's Ancestors
        if( !isDefaultAppendTarget ) {
            let accumulatedAncestorsScrollTop = getAccumulatedAncestorsScrollTop()
            top += accumulatedAncestorsScrollTop
            bottom += accumulatedAncestorsScrollTop
        }

        top = Math.floor(top)
        bottom = Math.ceil(bottom)

        isPlacedAbove = _sd.placeAbove ?? viewportHeight - rect.bottom < ddHeight
        hasSpaceOnRight = viewportWidth - left < MIN_DISTANCE_FROM_VIEWPORT_H_EDGE;

        // flip vertically if there is no space for the dropdown below the input
        cssTop = (isPlacedAbove ? top : bottom) + appendTargetScrollTop;

        // "pageXOffset" property is an alias for "scrollX"
        cssLeft = (left + (isRTL ? (rect.width || 0) : 0) + window.pageXOffset);

        // check if there's enough space on the right-side of the viewport,
        // because the element is positioned to the right of the caret, which might need to be changed.
        if( positionTo == 'text' && hasSpaceOnRight ) {
            cssLeft = `right: 0;`;
        }
        else {
            cssLeft = `left: ${cssLeft}px;`;
        }

        // rtl = rtl ?? viewportWidth -
        ddElm.style.cssText = `${cssLeft} top: ${cssTop}px; min-width: ${width}; max-width: ${width}`;

        ddElm.setAttribute('placement', isPlacedAbove ? 'top' : 'bottom')
        ddElm.setAttribute('position', positionTo)
    },
}
