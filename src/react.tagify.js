import React, {useMemo, useEffect, useRef} from "react"
import {renderToStaticMarkup} from "react-dom/server"
import {string, array, func, bool, object, oneOfType} from "prop-types"
import Tagify from "./tagify.min.js"
import "./tagify.css" // TODO: REMOVE!!!!

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
    onChange = _ => _,
    readOnly,
    settings = {},
    InputMode = "input",
    autoFocus,
    className,
    whitelist,
    tagifyRef,
    placeholder = "",
    defaultValue,
    showFilteredDropdown
}) => {
    const mountedRef = useRef()
    const inputElmRef = useRef()
    const tagify = useRef()

    const handleRef = elm => {
        inputElmRef.current = elm
    }

    const inputAttrs = useMemo(
        () => ({
            ref: handleRef,
            name,
            value: typeof value === "string" ? value : JSON.stringify(value),
            className,
            readOnly,
            onChange,
            autoFocus,
            placeholder,
            defaultValue
        }),
        [
            defaultValue,
            placeholder,
            autoFocus,
            className,
            onChange,
            readOnly,
            value,
            name
        ]
    )

    useEffect(() => {
        templatesToString(settings.templates)

        tagify.current = new Tagify(inputElmRef.current, settings)

        // Bridge Tagify instance with parent component
        if (tagifyRef) {
            tagifyRef.current = tagify.current
        }

        // cleanup
        return () => {
            tagify.current.destroy()
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
            tagify.current.settings.whitelist.splice(
                0,
                tagify.current.settings.whitelist.length,
                ...(whitelist || [])
            )
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
            if (showFilteredDropdown) {
                t.dropdown.show.call(t, showFilteredDropdown)
                t.toggleFocusClass(true)
            } else {
                t.dropdown.hide.call(t)
            }
        }
    }, [showFilteredDropdown])

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
    showFilteredDropdown: oneOfType([string, bool])
}

const Tags = React.memo(TagifyWrapper)
Tags.displayName = "Tags"

export default Tags
