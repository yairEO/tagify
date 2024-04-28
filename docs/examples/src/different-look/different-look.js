// generate random whilist items (for the demo)
var randomStringsArr = Array.apply(null, Array(100)).map(function () {
    return Array.apply(null, Array(~~(Math.random() * 10 + 3))).map(function () {
        return String.fromCharCode(Math.random() * (123 - 97) + 97)
    }).join('') + '@gmail.com'
})

var input = document.querySelector('.customLook'),
    button = input.nextElementSibling,
    tagify = new Tagify(input, {
        editTags: {
            keepInvalid: false, // better to auto-remove invalid tags which are in edit-mode (on blur)
        },
        // email address validation (https://stackoverflow.com/a/46181/104380)
        pattern: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        whitelist: randomStringsArr,
        callbacks: {
            "invalid": onInvalidTag
        },
        dropdown: {
            position: 'text',
            enabled: 1 // show suggestions dropdown after 1 typed character
        }
    });  // "add new tag" action-button

button.addEventListener("click", onAddButtonClick)

function onAddButtonClick() {
    tagify.addEmptyTag()
}

function onInvalidTag(e) {
    console.log("invalid", e.detail)
}