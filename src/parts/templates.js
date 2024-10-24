import {ZERO_WIDTH_UNICODE_CHAR} from './constants'

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
                    ${this.settings.templates.input.call(this)}
                ${ZERO_WIDTH_UNICODE_CHAR}
        </tags>`
    },

    input() {
        var _s = this.settings,
            placeholder = _s.placeholder || ZERO_WIDTH_UNICODE_CHAR;

        return `<span ${!_s.readonly && _s.userInput ? 'contenteditable' : ''} tabIndex="0" data-placeholder="${placeholder}" aria-placeholder="${_s.placeholder || ''}"
                    class="${_s.classNames.input}"
                    role="textbox"
                    autocapitalize="false"
                    autocorrect="off"
                    aria-autocomplete="both"
                    aria-multiline="${_s.mode=='mix'?true:false}"></span>`
    },

    tag(tagData, {settings: _s}){
        return `<tag title="${(tagData.title || tagData.value)}"
                    contenteditable='false'
                    tabIndex="${_s.a11y.focusableTags ? 0 : -1}"
                    class="${_s.classNames.tag} ${tagData.class || ""}"
                    ${this.getAttributes(tagData)}>
            <x title='' tabIndex="${_s.a11y.focusableTags ? 0 : -1}" class="${_s.classNames.tagX}" role='button' aria-label='remove tag'></x>
            <div>
                <span ${_s.mode === 'select' && _s.userInput ? "contenteditable='true'" : ''} autocapitalize="false" autocorrect="off" spellcheck='false' class="${_s.classNames.tagText}">${tagData[_s.tagTextProp] || tagData.value}</span>
            </div>
        </tag>`
    },

    dropdown(settings){
        var _sd = settings.dropdown,
            isManual = _sd.position == 'manual';

        return `<div class="${isManual ? '' : settings.classNames.dropdown } ${_sd.classname}" role="listbox" aria-labelledby="dropdown" dir="${_sd.RTL ? 'rtl' : ''}">
                    <div data-selector='tagify-suggestions-wrapper' class="${settings.classNames.dropdownWrapper}"></div>
                </div>`
    },

    dropdownContent(HTMLContent) {
        var _t = this.settings.templates,
            suggestions = this.state.dropdown.suggestions;

        return `
            ${_t.dropdownHeader.call(this, suggestions)}
            ${HTMLContent}
            ${_t.dropdownFooter.call(this, suggestions)}
        `
    },

    dropdownItem(item){
        return `<div ${this.getAttributes(item)}
                    class='${this.settings.classNames.dropdownItem} ${this.isTagDuplicate(item.value) ? this.settings.classNames.dropdownItemSelected: ""} ${item.class || ""}'
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
