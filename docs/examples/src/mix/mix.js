// Define two types of whitelists, each used for the dropdown suggestions menu,
// depending on the prefix pattern typed (@/#). See settings below.
var whitelist_1 = [
    { value: 100, text: 'kenny', title: 'Kenny McCormick' },
    { value: 200, text: 'cartman', title: 'Eric Cartman' },
    { value: 300, text: 'kyle', title: 'Kyle Broflovski' },
    { value: 400, text: 'token', title: 'Token Black' },
    { value: 500, text: 'jimmy', title: 'Jimmy Valmer' },
    { value: 600, text: 'butters', title: 'Butters Stotch' },
    { value: 700, text: 'stan', title: 'Stan Marsh' },
    { value: 800, text: 'randy', title: 'Randy Marsh' },
    { value: 900, text: 'Mr. Garrison', title: 'POTUS' },
    { value: 1000, text: 'Mr. Mackey', title: "M'Kay" }
  ]

// Second whitelist, which is shown only when starting to type "#".
// Below whitelist is the simplest possible format.
var whitelist_2 = ['Homer simpson', 'Marge simpson', 'Bart', 'Lisa', 'Maggie', 'Mr. Burns', 'Ned', 'Milhouse', 'Moe'];


// initialize Tagify
var input = document.querySelector('[name=mix]'),
    // init Tagify script on the above inputs
    tagify = new Tagify(input, {
    //  mixTagsInterpolator: ["{{", "}}"],
        mode: 'mix',  // <--  Enable mixed-content
        pattern: /@|#/,  // <--  Text starting with @ or # (if single, String can be used here)
        tagTextProp: 'text',  // <-- the default property (from whitelist item) for the text to be rendered in a tag element.
        // Array for initial interpolation, which allows only these tags to be used
        whitelist: whitelist_1.concat(whitelist_2).map(function(item){
            return typeof item == 'string' ? {value:item} : item
        }),

        // custom validation - no special characters
        validate(data){
            return !/[^a-zA-Z0-9 ]/.test(data.value)
        },

        dropdown : {
            enabled: 1,
            position: 'text', // <-- render the suggestions list next to the typed text ("caret")
            mapValueTo: 'text', // <-- similar to above "tagTextProp" setting, but for the dropdown items
            highlightFirst: true  // automatically highlights first sugegstion item in the dropdown
        },
        callbacks: {
            add: console.log,  // callback when adding a tag
            remove: console.log   // callback when removing a tag
        }
    })


// A good place to pull server suggestion list accoring to the prefix/value
tagify.on('input', function(e){
    var prefix = e.detail.prefix;

    // first, clean the whitlist array, because the below code, while not, might be async,
    // therefore it should be up to you to decide WHEN to render the suggestions dropdown
    // tagify.settings.whitelist.length = 0;

    if( prefix ){
        if( prefix == '@' )
            tagify.whitelist = whitelist_1;

        if( prefix == '#' )
            tagify.whitelist = whitelist_2;

        if( e.detail.value.length > 1 )
            tagify.dropdown.show(e.detail.value);
    }

    console.log( tagify.value )
    console.log('mix-mode "input" event value: ', e.detail)
})

tagify.on('add', function(e){
    console.log(e)
})