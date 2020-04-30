import React from "react"
import Tagify from "./tagify.min.js"
import "./tagify.css"

class Tags extends React.Component {
  constructor(props) {
    super(props)
    this._handleRef = this._handleRef.bind(this)
  }

  componentDidMount() {
    this.tagify = new Tagify(this.component, this.props.settings || {})
  }

  componentWillUnmount() {
    const tagify = this.tagify

    tagify.dropdown.hide.call(tagify)
    clearTimeout(tagify.dropdownHide__bindEventsTimeout)
  }

  shouldComponentUpdate(nextProps, nextState) {
    const nextSettings = nextProps.settings || {}
    const tagify = this.tagify,
          currentValue = this.props.value instanceof Array
            ? this.props.value
            : [this.props.value]

    // check if value has changed
    if (
      nextProps.value &&
      nextProps.value instanceof Array &&
      nextProps.value.join() !== currentValue.join()
    ) {
      tagify.loadOriginalValues(nextProps.value.join())
      // this.tagify.addTags(nextProps.value, true, true)
    }

    if( nextSettings.whitelist && nextSettings.whitelist.length )
      tagify.settings.whitelist = nextSettings.whitelist

    if ("loading" in nextProps) {
      tagify.loading(nextProps.loading)
    }

    if (nextProps.showDropdown) {
      tagify.dropdown.show.call(tagify, nextProps.showDropdown)
      tagify.toggleFocusClass(true)
    } else if ("showDropdown" in nextProps && !nextProps.showDropdown) {
      tagify.dropdown.hide.call(tagify)
    }

    // do not allow react to re-render since the component is modifying its own HTML
    return false
  }

  _handleRef(component) {
    this.component = component
  }

  render() {
    const attrs = {
      ref        : this._handleRef,
      name       : this.props.name,
      className  : this.props.className,
      placeholder: this.props.placeholder,
      autoFocus  : this.props.autofocus,
      value      : this.props.children || this.props.value,
      readOnly   : this.props.readonly,
      onChange   : this.props.onChange || function(){}
    }

    const {className} = this.props

    return React.createElement(
      "div",
      {className},
      React.createElement(
        this.props.mode,
        Object.assign({}, attrs, {defaultValue: this.props.initialValue})
      )
    )
  }
}

Tags.defaultProps = {
  value: [],
  mode: "input"
}

export default Tags