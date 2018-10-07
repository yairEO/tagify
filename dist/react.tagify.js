// import React from 'react';
import Tagify from './tagify.js'
import './tagify.css'


export class Tags extends React.Component{
	constructor( props ){
	    super(props);
	    this.state = {};
	}

    componentDidMount(){
    	this.tagify = new Tagify(this.component, this.props.settings || {});

    	// this.tagify.on('add', onAddTag)
			  //      .on('remove', onRemoveTag)
			  //      .on('input', onInput)
			  //      .on('invalid', onInvalidTag);
    }

    componentDidUpdate(prevProps) {
        if( prevProps.children !== this.props.children ){
            this.$el.trigger("chosen:updated");
        }
    }
 
    componentWillUnmount(){
        this.component.removeEventListener('tabclosed', this.onTabClosed);
    }

    shouldComponentUpdate(nextProps, nextState){
    	// do not allow react to re-render since the component is modifying its own HTML
        return false;
    }
 
    onTabClosed = ({detail: component}) => {
        this.props.onTabClosed && this.props.onTabClosed(component.getAttribute('tabId'));
    }
 
    _handleRef = (component) => {
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

    	if( this.props.mode === 'textarea' )
    		return <textarea {...attrs} defaultValue={this.props.initialValue}></textarea>
	        
    	return <input {...attrs} defaultValue={this.props.initialValue} />
    }
}