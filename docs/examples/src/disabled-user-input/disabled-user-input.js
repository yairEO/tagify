var input = document.querySelector('input[name=disabled-user-input]'),
    tagify = new Tagify(input, {
        whitelist: [1,2,3,4,5],
        userInput: false
    })