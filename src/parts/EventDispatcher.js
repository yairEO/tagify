import { extend, logger } from './helpers'

export default function EventDispatcher( instance ){
    // Create a DOM EventTarget object
    var target = document.createTextNode(''),
        // keep track of all binded events & their callbacks to be able to completely remove all listeners of a speicific type
        callbacksPerType = {}

    function addRemove(op, events, cb){
        if( cb )
            events.split(/\s+/g).forEach(ev => target[op + 'EventListener'].call(target, ev, cb))
    }

    // Pass EventTarget interface calls to DOM EventTarget object
    return {
        // unbinds all events
        removeAllCustomListeners(){
            Object.entries(callbacksPerType).forEach(([ev, cbArr]) => {
                cbArr.forEach(cb => addRemove('remove', ev, cb))
            })

            callbacksPerType = {}
        },

        off(events, cb){
            if( events ) {
                if( cb )
                    addRemove('remove', events, cb)
                else
                    // if `cb` argument was not specified then remove all listeners for the given event(s) types
                    events.split(/\s+/g).forEach(ev => {
                        callbacksPerType[ev]?.forEach(cb => addRemove('remove', ev, cb))
                        delete callbacksPerType[ev]
                    })
            }

            return this
        },

        on(events, cb){
            if(cb && typeof cb == 'function') {
                //track events callbacks to be able to remove them altogehter
                events.split(/\s+/g).forEach(ev => {
                    if (Array.isArray(callbacksPerType[ev]) )
                        callbacksPerType[ev].push(cb)
                    else
                        callbacksPerType[ev] = [cb]
                })

                addRemove('add', events, cb)
            }

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

                    // "extend" deep-clones DOM elements into plain objects, so restore the original element references.
                    // Only own properties are read (no "for...in"), otherwise payloads which are DOM elements
                    // (like the dropdown) would have all their inherited props read, including deprecated ones
                    // such as Firefox's "onmozfullscreenchange" which triggers deprecation warnings (issue #1513)
                    // TODO: move the below to the "extend" function
                    if( opts.cloneData && data instanceof Object )
                        Object.keys(data).forEach(prop => {
                            if( data[prop] instanceof HTMLElement )
                                eventData[prop] = data[prop]
                        })

                    e = new CustomEvent(eventName, {"detail":eventData})
                }
                catch(err){ logger.warn(err) }

                target.dispatchEvent(e);
            }
        }
    }
}
