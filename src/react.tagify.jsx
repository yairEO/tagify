'use client';

import {memo, useMemo, useEffect, useRef, useCallback} from 'react';
import {renderToStaticMarkup} from './react-compat-layer'
// import {renderToStaticMarkup} from "react-dom/server"
// import {string, array, func, bool, object, oneOfType} from "prop-types"
import Tagify from "./tagify.js"

const noop = _ => _

const isSameDeep = (a,b) => {
    const trans = x => typeof x == 'string' ? x : JSON.stringify(x)
    return trans(a) == trans(b)
}

// if a template is a React component, it should be outputed as a String (and not as a React component)
function templatesToString(templates) {
    if (templates) {
        for (let templateName in templates) {
            let Template = templates[templateName]
            let isReactComp = String(Template).includes("jsxRuntime")
            if (isReactComp)
                templates[templateName] = (...props) => renderToStaticMarkup(<Template props={props} />)
        }
    }
}

// used for `className` prop changes
function compareStrings(str1, str2) {
    if( typeof str1 != typeof str2) return;
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');

    const added = words2.filter(word => !words1.includes(word));
    const removed = words1.filter(word => !words2.includes(word));

    return { added, removed };
  }

const TagifyWrapper = ({
    name,
    value,
    loading = false,
    onInput = noop,
    onAdd = noop,
    onRemove = noop,
    onEditInput = noop,
    onEditBeforeUpdate = noop,
    onEditUpdated = noop,
    onEditStart = noop,
    onEditKeydown = noop,
    onInvalid = noop,
    onClick = noop,
    onKeydown = noop,
    onFocus = noop,
    onBlur = noop,
    onChange = noop,
    onDropdownShow = noop,
    onDropdownHide = noop,
    onDropdownSelect = noop,
    onDropdownScroll = noop,
    onDropdownNoMatch = noop,
    onDropdownUpdated = noop,
    readOnly,
    disabled,
    userInput = true,
    children,
    settings = {},
    InputMode = "input",
    autoFocus,
    className,
    whitelist,
    tagifyRef,
    placeholder = "",
    defaultValue,
    showDropdown
}) => {
    const mountedRef = useRef()
    const inputElmRef = useRef()
    const tagify = useRef()
    const lastClassNameRef = useRef()
    const _value = defaultValue || value

    const inputAttrs = useMemo(() => ({
        ref: inputElmRef,
        name,
        defaultValue: children || typeof _value == 'string' ? _value : JSON.stringify(_value),
        className,
        readOnly,
        disabled,
        autoFocus,
        placeholder,
    }), [])

    const setFocus = useCallback(() => {
        autoFocus && tagify.current && tagify.current.DOM.input.focus()
    }, [tagify])

    useEffect(() => {
        templatesToString(settings.templates)

        settings.userInput = userInput

        if (InputMode == "textarea")
            settings.mode = "mix"

        // "whitelist" prop takes precedence
        if( whitelist && whitelist.length )
            settings.whitelist = whitelist

        const t = new Tagify(inputElmRef.current, settings)

        // Bridge Tagify instance with parent component
        if (tagifyRef) {
            tagifyRef.current = t
        }

        tagify.current = t

        setFocus()

        // cleanup
        return () => {
            t.destroy()
        }
    }, [])

    // event listeners updaters
    useEffect(() => { tagify.current.off('change').on('change' , onChange) }, [onChange])
    useEffect(() => { tagify.current.off('input').on('input' , onInput) }, [onInput])
    useEffect(() => { tagify.current.off('add').on('add' , onAdd) }, [onAdd])
    useEffect(() => { tagify.current.off('remove').on('remove' , onRemove) }, [onRemove])
    useEffect(() => { tagify.current.off('invalid').on('invalid' , onInvalid) }, [onInvalid])
    useEffect(() => { tagify.current.off('keydown').on('keydown' , onKeydown) }, [onKeydown])
    useEffect(() => { tagify.current.off('focus').on('focus' , onFocus) }, [onFocus])
    useEffect(() => { tagify.current.off('blur').on('blur' , onBlur) }, [onBlur])
    useEffect(() => { tagify.current.off('click').on('click' , onClick) }, [onClick])

    useEffect(() => { tagify.current.off('edit:input').on('edit:input' , onEditInput) }, [onEditInput])
    useEffect(() => { tagify.current.off('edit:beforeUpdate').on('edit:beforeUpdate' , onEditBeforeUpdate) }, [onEditBeforeUpdate])
    useEffect(() => { tagify.current.off('edit:updated').on('edit:updated' , onEditUpdated) }, [onEditUpdated])
    useEffect(() => { tagify.current.off('edit:start').on('edit:start' , onEditStart) }, [onEditStart])
    useEffect(() => { tagify.current.off('edit:keydown').on('edit:keydown' , onEditKeydown) }, [onEditKeydown])

    useEffect(() => { tagify.current.off('dropdown:show').on('dropdown:show' , onDropdownShow) }, [onDropdownShow])
    useEffect(() => { tagify.current.off('dropdown:hide').on('dropdown:hide' , onDropdownHide) }, [onDropdownHide])
    useEffect(() => { tagify.current.off('dropdown:select').on('dropdown:select' , onDropdownSelect) }, [onDropdownSelect])
    useEffect(() => { tagify.current.off('dropdown:scroll').on('dropdown:scroll' , onDropdownScroll) }, [onDropdownScroll])
    useEffect(() => { tagify.current.off('dropdown:noMatch').on('dropdown:noMatch' , onDropdownNoMatch) }, [onDropdownNoMatch])
    useEffect(() => { tagify.current.off('dropdown:updated').on('dropdown:updated' , onDropdownUpdated) }, [onDropdownUpdated])


    useEffect(() => {
        setFocus()
    }, [autoFocus])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.settings.whitelist.length = 0

            // replace whitelist array items
            whitelist && whitelist.length && tagify.current.settings.whitelist.push(...whitelist)
        }
    }, [whitelist])

    useEffect(() => {
        const currentValue = tagify.current.getInputValue()

        if (mountedRef.current && !isSameDeep(value, currentValue)) {
            tagify.current.loadOriginalValues(value)
        }
    }, [value])

    useEffect(() => {
        if (mountedRef.current) {
            // compare last `className` prop with current `className` prop and find
            // which clases should be added and which should be removed:
            const { added, removed } = compareStrings(lastClassNameRef.current, className);

            added.filter(String).forEach(cls => tagify.current.toggleClass(cls, true))
            removed.filter(String).forEach(cls => tagify.current.toggleClass(cls, false))

        }
        // save current `className` prop for next change iteration
        lastClassNameRef.current = className
    }, [className])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.loading(loading)
        }
    }, [loading])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.setReadonly(readOnly)
        }
    }, [readOnly])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.setDisabled(disabled)
        }
    }, [disabled])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.userInput = userInput
        }
    }, [userInput])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.setPlaceholder(placeholder)
        }
    }, [placeholder])

    useEffect(() => {
        const t = tagify.current

        if (mountedRef.current) {
            if (showDropdown) {
                t.dropdown.show.call(t, showDropdown)
                t.toggleFocusClass(true)
            } else {
                t.dropdown.hide.call(t)
            }
        }
    }, [showDropdown])

    useEffect(() => {
        mountedRef.current = true
    }, [])

    return (
        // a wrapper must be used because Tagify will appened inside it it's component,
        // keeping the virtual-DOM out of the way
        <div className="tags-input">
            <InputMode {...inputAttrs} />
        </div>
    )
}

// TagifyWrapper.propTypes = {
//     name: string,
//     value: oneOfType([string, array]),
//     loading: bool,
//     children: oneOfType([string, array]),
//     onChange: func,
//     readOnly: bool,
//     disabled: bool,
//     userInput: bool,
//     settings: object,
//     InputMode: string,
//     autoFocus: bool,
//     className: string,
//     tagifyRef: object,
//     whitelist: array,
//     placeholder: string,
//     defaultValue: oneOfType([string, array]),
//     showDropdown: oneOfType([string, bool]),
//     onInput: func,
//     onAdd: func,
//     onRemove: func,
//     onEditInput: func,
//     onEditBeforeUpdate: func,
//     onEditUpdated: func,
//     onEditStart: func,
//     onEditKeydown: func,
//     onInvalid: func,
//     onClick: func,
//     onKeydown: func,
//     onFocus: func,
//     onBlur: func,
//     onDropdownShow: func,
//     onDropdownHide: func,
//     onDropdownSelect: func,
//     onDropdownScroll: func,
//     onDropdownNoMatch: func,
//     onDropdownUpdated: func,
// }

const Tags = memo(TagifyWrapper)
Tags.displayName = "Tags"


export const MixedTags = ({ children, ...rest }) =>
  <Tags InputMode="textarea" {...rest}>{children}</Tags>

export default Tags
