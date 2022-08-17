import { extend } from './helpers'

export default function EventDispatcher( instance ){
    // Create a DOM EventTarget object
    var target = document.createTextNode('')

    function addRemove(op, events, cb){
        if( cb )
            events.split(/\s+/g).forEach(name => target[op + 'EventListener'].call(target, name, cb))
    }

    // Pass EventTarget interface calls to DOM EventTarget object
    return {
        off(events, cb){
            addRemove('remove', events, cb)
            return this
        },

        on(events, cb){
            if(cb && typeof cb == 'function')
                addRemove('add', events, cb)
            return this
        },

        trigger(eventName, data, opts){
            var e;

            opts = opts || {
                cloneData:true
            }

            if( !eventName ) return;

            if( instance.settings.isJQueryPlugin ){
                if( eventName == 'remove' ) eventName = 'removeTag' // issue #222
                jQuery(instance.DOM.originalInput).triggerHandler(eventName, [data])
            }
            else{
                try {
                    var eventData = typeof data === 'object'
                        ? data
                        : {value:data};

                    eventData = opts.cloneData ? extend({}, eventData) : eventData
                    eventData.tagify = this

                    if( data.event )
                        eventData.event = this.cloneEvent(data.event)

                    // TODO: move the below to the "extend" function
                    if( data instanceof Object )
                        for( var prop in data )
                            if(data[prop] instanceof HTMLElement)
                                eventData[prop] = data[prop]

                    e = new CustomEvent(eventName, {"detail":eventData})
                }
                catch(err){ console.warn(err) }

                target.dispatchEvent(e);
            }
        }
    }
}
