export default {
    delimiters          : ",",            // [RegEx] split tags by any of these delimiters ("null" to cancel) Example: ",| |."
    pattern             : null,           // RegEx pattern to validate input by. Ex: /[1-9]/
    tagTextProp         : 'value',        // tag data Object property which will be displayed as the tag's text
    maxTags             : Infinity,       // Maximum number of tags
    callbacks           : {},             // Exposed callbacks object to be triggered on certain events
    addTagOnBlur        : true,           // automatically adds the text which was inputed as a tag when blur event happens
    onChangeAfterBlur   : true,           // By default, the native way of inputs' onChange events is kept, and it only fires when the field is blured.
    duplicates          : false,          // "true" - allow duplicate tags
    whitelist           : [],             // Array of tags to suggest as the user types (can be used along with "enforceWhitelist" setting)
    blacklist           : [],             // A list of non-allowed tags
    enforceWhitelist    : false,          // Only allow tags from the whitelist
    userInput           : true,           // disable manually typing/pasting/editing tags (tags may only be added from the whitelist)
    keepInvalidTags     : false,          // if true, do not remove tags which did not pass validation
    createInvalidTags   : true,           // if false, do not create invalid tags from invalid user input
    mixTagsAllowedAfter : /,|\.|\:|\s/,   // RegEx - Define conditions in which mix-tags content allows a tag to be added after
    mixTagsInterpolator : ['[[', ']]'],   // Interpolation for mix mode. Everything between these will become a tag, if is a valid Object
    backspace           : true,           // false / true / "edit"
    skipInvalid         : false,          // If `true`, do not add invalid, temporary, tags before automatically removing them
    pasteAsTags         : true,           // automatically converts pasted text into tags. if "false", allows for further text editing

    editTags            : {
        clicks      : 2,                  // clicks to enter "edit-mode": 1 for single click. any other value is considered as double-click
        keepInvalid : true                // keeps invalid edits as-is until `esc` is pressed while in focus
    },              // 1 or 2 clicks to edit a tag. false/null for not allowing editing
    transformTag        : ()=>{},         // Takes a tag input string as argument and returns a transformed value
    trim                : true,           // whether or not the value provided should be trimmed, before being added as a tag
    a11y: {
        focusableTags: false
    },

    mixMode: {
        insertAfterTag  : '\u00A0',       // String/Node to inject after a tag has been added (see #588)
    },

    autoComplete: {
        enabled: true,                    // Tries to suggest the input's value while typing (match from whitelist) by adding the rest of term as grayed-out text
        rightKey: false,                  // If `true`, when Right key is pressed, use the suggested value to create a tag, else just auto-completes the input. in mixed-mode this is set to "true"
    },

    classNames: {
        namespace          : 'tagify',
        mixMode            : 'tagify--mix',
        selectMode         : 'tagify--select',
        input              : 'tagify__input',
        focus              : 'tagify--focus',
        tagNoAnimation     : 'tagify--noAnim',
        tagInvalid         : 'tagify--invalid',
        tagNotAllowed      : 'tagify--notAllowed',
        scopeLoading       : 'tagify--loading',
        hasMaxTags         : 'tagify--hasMaxTags',
        hasNoTags          : 'tagify--noTags',
        empty              : 'tagify--empty',
        inputInvalid       : 'tagify__input--invalid',
        dropdown           : 'tagify__dropdown',
        dropdownWrapper    : 'tagify__dropdown__wrapper',
        dropdownHeader     : 'tagify__dropdown__header',
        dropdownFooter     : 'tagify__dropdown__footer',
        dropdownItem       : 'tagify__dropdown__item',
        dropdownItemActive : 'tagify__dropdown__item--active',
        dropdownItemHidden : 'tagify__dropdown__item--hidden',
        dropdownInital     : 'tagify__dropdown--initial',
        tag                : 'tagify__tag',
        tagText            : 'tagify__tag-text',
        tagX               : 'tagify__tag__removeBtn',
        tagLoading         : 'tagify__tag--loading',
        tagEditing         : 'tagify__tag--editable',
        tagFlash           : 'tagify__tag--flash',
        tagHide            : 'tagify__tag--hide',

    },

    dropdown: {
        classname          : '',
        enabled            : 2,      // minimum input characters to be typed for the suggestions dropdown to show
        maxItems           : 10,
        searchKeys         : ["value", "searchBy"],
        fuzzySearch        : true,
        caseSensitive      : false,
        accentedSearch     : true,
        includeSelectedTags: false,  // Should the suggestions list Include already-selected tags (after filtering)
        highlightFirst     : false,  // highlights first-matched item in the list
        closeOnSelect      : true,   // closes the dropdown after selecting an item, if `enabled:0` (which means always show dropdown)
        clearOnSelect      : true,   // after selecting a suggetion, should the typed text input remain or be cleared
        position           : 'all',  // 'manual' / 'text' / 'all'
        appendTarget       : null    // defaults to document.body once DOM has been loaded
    },

    hooks: {
        beforeRemoveTag: () => Promise.resolve(),
        beforePaste: () => Promise.resolve(),
        suggestionClick: () => Promise.resolve()
    }
}