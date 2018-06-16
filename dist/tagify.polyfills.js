(function(){
    if( !String.prototype.includes ){
        String.prototype.includes = function(search, start) {
            'use strict';
            if (typeof start !== 'number')
                start = 0;

            if (start + search.length > this.length)
                return false;

            else
                return this.indexOf(search, start) !== -1;
        };
    }

    /////////////////////////////////
    // https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
    if ( typeof window.CustomEvent === "function" ) return false;

    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})()

