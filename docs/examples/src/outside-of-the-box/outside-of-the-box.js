var input = document.querySelector('input[name=tags-outside]')

var tagify = new Tagify(input, {
    whitelist: ['foo', 'bar', 'baz'],
    focusable: false,
    dropdown: {
        position: 'input',
        enabled: 0 // always opens dropdown when input gets focus
    }
})