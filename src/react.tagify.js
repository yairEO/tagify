import React, {useMemo, useEffect, useRef} from "react"
import {renderToStaticMarkup} from "react-dom/server"
import {string, array, func, bool, object, element, oneOfType} from "prop-types"
import Tagify from "./tagify.min.js"

const noop = _ => _

// if a template is a React component, it should be outputed as a String (and not as a React component)
function templatesToString(templates) {
    if (templates) {
        for (let templateName in templates) {
            let isReactComp = String(templates[templateName]).includes(".createElement")

            if (isReactComp) {
                let Template = templates[templateName]
                templates[templateName] = data => renderToStaticMarkup(<Template {...data} />)
            }
        }
    }
}

const TagifyWrapper = ({
    name,
    value = "",
    loading = false,
    onInput = noop,
    onAdd = noop,
    onRemove = noop,
    onEdit = noop,
    onInvalid = noop,
    onClick = noop,
    onKeydown = noop,
    onFocus = noop,
    onBlur = noop,
    onChange = noop,
    readOnly,
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

    const handleRef = elm => {
        inputElmRef.current = elm
    }

    const inputAttrs = useMemo(() => ({
            ref: handleRef,
            name,
            value: children
                ? children
                : typeof value === "string"
                    ? value
                    : JSON.stringify(value),
            className,
            readOnly,
            onChange,
            autoFocus,
            placeholder,
            defaultValue
        }), [defaultValue, placeholder, autoFocus, className, children, onChange, readOnly, value, name ]
    )

    useEffect(() => {
        templatesToString(settings.templates)

        if (InputMode == "textarea") settings.mode = "mix"

        const t = new Tagify(inputElmRef.current, settings)

        onInput   && t.on("input", onInput)
        onAdd     && t.on("add", onAdd)
        onRemove  && t.on("remove", onRemove)
        onEdit    && t.on("edit", onEdit)
        onInvalid && t.on("invalid", onInvalid)
        onKeydown && t.on("keydown", onKeydown)
        onFocus   && t.on("focus", onFocus)
        onBlur    && t.on("blur", onBlur)
        onClick   && t.on("click", onClick)
                // Bridge Tagify instance with parent component
        if (tagifyRef) {
            tagifyRef.current = t
        }

        tagify.current = t

        // cleanup
        return () => {
            t.destroy()
        }
    }, [])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.loadOriginalValues(value)
        }
    }, [value])

    useEffect(() => {
        if (mountedRef.current) {
            // replace whitelist array items
            tagify.current.settings.whitelist.splice(0, tagify.current.settings.whitelist.length, ...(whitelist || []))
        }
    }, [whitelist])

    useEffect(() => {
        if (mountedRef.current) {
            tagify.current.loading(loading)
        }
    }, [loading])

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

TagifyWrapper.propTypes = {
    name: string,
    value: oneOfType([string, array]),
    loading: bool,
    children: element,
    onChange: func,
    readOnly: bool,
    settings: object,
    InputMode: string,
    autoFocus: bool,
    className: string,
    tagifyRef: object,
    whitelist: array,
    placeholder: string,
    defaultValue: oneOfType([string, array]),
    showDropdown: oneOfType([string, bool])
}

const Tags = React.memo(TagifyWrapper)
Tags.displayName = "Tags"

export default Tags
