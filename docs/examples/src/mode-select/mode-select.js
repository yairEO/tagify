var input = document.querySelector('input[name=mode-select]'),
    tagify = new Tagify(input, {
        enforceWhitelist: true,
        mode : "select",
        whitelist: ["first option", "second option", "third option"],
        blacklist: ['foo', 'bar'],
    })

// bind events
tagify.on('add', onAddTag)
tagify.DOM.input.addEventListener('focus', onSelectFocus)

function onAddTag(e){
    console.log(e.detail)
}

function onSelectFocus(e){
    console.log(e)
}