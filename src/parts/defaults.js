export default {
    delimiters          : ",",            // [RegEx] split tags by any of these delimiters ("null" to cancel) Example: ",| |."
    pattern             : null,           // RegEx pattern to validate input by. Ex: /[1-9]/
    maxTags             : Infinity,       // Maximum number of tags
    callbacks           : {},             // Exposed callbacks object to be triggered on certain events
    addTagOnBlur        : true,           // Flag - automatically adds the text which was inputed as a tag when blur event happens
    duplicates          : false,          // Flag - allow tuplicate tags
    whitelist           : [],             // Array of tags to suggest as the user types (can be used along with "enforceWhitelist" setting)
    blacklist           : [],             // A list of non-allowed tags
    enforceWhitelist    : false,          // Flag - Only allow tags allowed in whitelist
    keepInvalidTags     : false,          // Flag - if true, do not remove tags which did not pass validation
    mixTagsAllowedAfter : /,|\.|\:|\s/,   // RegEx - Define conditions in which mix-tags content allows a tag to be added after
    mixTagsInterpolator : ['[[', ']]'],   // Interpolation for mix mode. Everything between this will becmoe a tag
    backspace           : true,           // false / true / "edit"
    skipInvalid         : false,          // If `true`, do not add invalid, temporary, tags before automatically removing them
    editTags            : 2,              // 1 or 2 clicks to edit a tag. false/null for not allowing editing
    transformTag        : ()=>{},         // Takes a tag input string as argument and returns a transformed value
    trim                : true,           // whether or not the value provided should be trimmed, before being added as a tag

    mixMode: {
        insertAfterTag  : '\u00A0',       // String/Node to inject after a tag has been added
    },

    autoComplete: {
        enabled: true,                   // Tries to suggest the input's value while typing (match from whitelist) by adding the rest of term as grayed-out text
        rightKey: false,                  // If `true`, when Right key is pressed, use the suggested value to create a tag, else just auto-completes the input. in mixed-mode this is set to "true"
    },


    classNames: {
        namespace          : 'tagify',
        input              : 'tagify__input',
        focus              : 'tagify--focus',
        tag                : 'tagify__tag',
        tagNoAnimation     : 'tagify--noAnim',
        tagInvalid         : 'tagify--invalid',
        tagNotAllowed      : 'tagify--notAllowed',
        inputInvalid       : 'tagify__input--invalid',
        tagX               : 'tagify__tag__removeBtn',
        tagText            : 'tagify__tag-text',
        dropdown           : 'tagify__dropdown',
        dropdownWrapper    : 'tagify__dropdown__wrapper',
        dropdownItem       : 'tagify__dropdown__item',
        dropdownItemActive : 'tagify__dropdown__item--active',
        dropdownInital     : 'tagify__dropdown--initial',
        scopeLoading       : 'tagify--loading',
        tagLoading         : 'tagify__tag--loading',
        tagEditing         : 'tagify__tag--editable',
        tagFlash           : 'tagify__tag--flash',
        tagHide            : 'tagify__tag--hide',
        hasMaxTags         : 'tagify--hasMaxTags',
        hasNoTags          : 'tagify--noTags',
        empty              : 'tagify--empty',
    },

    dropdown: {
        classname     : '',
        enabled       : 2,      // minimum input characters needs to be typed for the suggestions dropdown to show
        maxItems      : 10,
        searchKeys    : ["value", "searchBy"],
        fuzzySearch   : true,
        caseSensitive : false,
        accentedSearch: true,
        highlightFirst: false,  // highlights first-matched item in the list
        closeOnSelect : true,   // closes the dropdown after selecting an item, if `enabled:0` (which means always show dropdown)
        clearOnSelect : true,   // after selecting a suggetion, should the typed text input remain or be cleared
        position      : 'all',  // 'manual' / 'text' / 'all'
        appendTarget  : null    // defaults to document.body one DOM has been loaded
    },

    hooks: {
        beforeRemoveTag: () => Promise.resolve(),
        suggestionClick: () => Promise.resolve()
    }
}