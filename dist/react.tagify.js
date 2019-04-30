import React from 'react';
import Tagify from './tagify.js'
import './tagify.css'

class Tags extends React.Component{
    constructor( props ){
        super(props);
        this._handleRef = this._handleRef.bind(this);
    }

    componentDidMount(){
        this.tagify = new Tagify(this.component, this.props.settings || {});
    }

    shouldComponentUpdate(nextProps, nextState){
        // check if value has changed
        if( nextProps.value && nextProps.value.join() != this.props.value.join() ){
            this.tagify.loadOriginalValues(nextProps.value);
            // this.tagify.addTags(nextProps.value, true, true)
        }

        this.tagify.settings.whitelist = nextProps.settings.whitelist;

        if( nextProps.showDropdown )
            this.tagify.dropdown.show.call(this.tagify, nextProps.showDropdown);

        // do not allow react to re-render since the component is modifying its own HTML
        return false;
    }

    _handleRef(component){
        this.component = component;
    }

    render(){
        const attrs = {
            ref         : this._handleRef,
            name        : this.props.name,
            className   : this.props.className,
            placeholder : this.props.class,
            autoFocus   : this.props.autofocus
        }

        return this.props.mode === 'textarea' ?
            <textarea {...attrs} defaultValue={this.props.initialValue}></textarea> :
            <input {...attrs} defaultValue={this.props.initialValue} />
    }
}

Tags.defaultProps = {
    value: []
}

export default Tags;