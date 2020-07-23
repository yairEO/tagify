export default {
    /**
     *
     * @param {DOM Object} input     Original input DOm element
     * @param {Object}     settings  Tagify instance settings Object
     */
    wrapper(input, settings){
        return `<tags class="${settings.classNames.namespace} ${settings.mode ? `${settings.classNames.namespace}--${settings.mode}` : ""} ${input.className}"
                    ${settings.readonly ? 'readonly' : ''}
                    ${settings.required ? 'required' : ''}
                    tabIndex="-1">
            <span ${!settings.readonly || settings.mode != 'mix' ? 'contenteditable' : ''} data-placeholder="${settings.placeholder || '&#8203;'}" aria-placeholder="${settings.placeholder || ''}"
                class="${settings.classNames.input}"
                role="textbox"
                aria-autocomplete="both"
                aria-multiline="${settings.mode=='mix'?true:false}"></span>
        </tags>`
    },

    tag(tagData){
        return `<tag title="${(tagData.title || tagData.value)}"
                    contenteditable='false'
                    spellcheck='false'
                    tabIndex="-1"
                    class="${this.settings.classNames.tag} ${tagData.class ? tagData.class : ""}"
                    ${this.getAttributes(tagData)}>
            <x title='' class="${this.settings.classNames.tagX}" role='button' aria-label='remove tag'></x>
            <div>
                <span class="${this.settings.classNames.tagText}">${tagData.value}</span>
            </div>
        </tag>`
    },

    dropdown(settings){
        var _sd = settings.dropdown,
            isManual = _sd.position == 'manual',
            className = `${settings.classNames.dropdown}`;

        return `<div class="${isManual ? "" : className} ${_sd.classname}" role="listbox" aria-labelledby="dropdown">
                    <div class="${settings.classNames.dropdownWrapper}"></div>
                </div>`
    },

    dropdownItem( item ){
        return `<div ${this.getAttributes(item)}
                    class='${this.settings.classNames.dropdownItem} ${item.class ? item.class : ""}'
                    tabindex="0"
                    role="option">${item.value}</div>`
    },

    dropdownItemNoMatch: null
}