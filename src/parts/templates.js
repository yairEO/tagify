export default {
    /**
     *
     * @param {DOM Object} input     Original input DOm element
     * @param {Object}     settings  Tagify instance settings Object
     */
    wrapper(input, _s){
        return `<tags class="${_s.classNames.namespace} ${_s.mode ? `${_s.classNames[_s.mode + "Mode"]}` : ""} ${input.className}"
                    ${_s.readonly ? 'readonly' : ''}
                    ${_s.disabled ? 'disabled' : ''}
                    ${_s.required ? 'required' : ''}
                    ${_s.mode === 'select' ? "spellcheck='false'" : ''}
                    tabIndex="-1">
            <span ${!_s.readonly && _s.userInput ? 'contenteditable' : ''} tabIndex="0" data-placeholder="${_s.placeholder || '&#8203;'}" aria-placeholder="${_s.placeholder || ''}"
                class="${_s.classNames.input}"
                role="textbox"
                aria-autocomplete="both"
                aria-multiline="${_s.mode=='mix'?true:false}"></span>
                &#8203;
        </tags>`
    },

    tag(tagData, {settings: _s}){
        return `<tag title="${(tagData.title || tagData.value)}"
                    contenteditable='false'
                    spellcheck='false'
                    tabIndex="${_s.a11y.focusableTags ? 0 : -1}"
                    class="${_s.classNames.tag} ${tagData.class || ""}"
                    ${this.getAttributes(tagData)}>
            <x title='' class="${_s.classNames.tagX}" role='button' aria-label='remove tag'></x>
            <div>
                <span class="${_s.classNames.tagText}">${tagData[_s.tagTextProp] || tagData.value}</span>
            </div>
        </tag>`
    },

    dropdown(settings){
        var _sd = settings.dropdown,
            isManual = _sd.position == 'manual',
            className = `${settings.classNames.dropdown}`;

        return `<div class="${isManual ? "" : className} ${_sd.classname}" role="listbox" aria-labelledby="dropdown">
                    <div data-selector='tagify-suggestions-wrapper' class="${settings.classNames.dropdownWrapper}"></div>
                </div>`
    },

    dropdownContent(HTMLContent) {
        var _s = this.settings,
            suggestions = this.state.dropdown.suggestions;

        return `
            ${_s.templates.dropdownHeader.call(this, suggestions)}
            ${HTMLContent}
            ${_s.templates.dropdownFooter.call(this, suggestions)}
        `
    },

    dropdownItem(item){
        return `<div ${this.getAttributes(item)}
                    class='${this.settings.classNames.dropdownItem} ${item.class ? item.class : ""}'
                    tabindex="0"
                    role="option">${item.mappedValue || item.value}</div>`
    },

    /**
     * @param {Array} suggestions An array of all the matched suggested items, including those which were sliced away due to the "dropdown.maxItems" setting
     */
    dropdownHeader(suggestions){
        return `<header data-selector='tagify-suggestions-header' class="${this.settings.classNames.dropdownHeader}"></header>`
    },

    dropdownFooter(suggestions){
        var hasMore = suggestions.length - this.settings.dropdown.maxItems;

        return hasMore > 0
            ? `<footer data-selector='tagify-suggestions-footer' class="${this.settings.classNames.dropdownFooter}">
                ${hasMore} more items. Refine your search.
            </footer>`
            : '';
    },

    dropdownItemNoMatch: null
}
