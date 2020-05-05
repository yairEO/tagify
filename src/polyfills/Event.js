// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
function CustomEventPolyfill ( event, params ) {
  params = params || { bubbles: false, cancelable: false, detail: undefined };
  var evt = document.createEvent( 'CustomEvent' );
  evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
  return evt;
}

CustomEventPolyfill.prototype = window.Event.prototype;

if ( typeof window.CustomEvent !== "function" ){
  window.CustomEvent = CustomEventPolyfill;
}