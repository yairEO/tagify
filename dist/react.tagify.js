!function(e,t){"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?module.exports=t():e.React.tagify=t()}(this,function(){"use strict";function i(e){return(i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.MixedTags=void 0;var e,A=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==i(e)&&"function"!=typeof e)return{default:e};var t=a();if(t&&t.has(e))return t.get(e);var n,r={},o=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(n in e){var u;Object.prototype.hasOwnProperty.call(e,n)&&((u=o?Object.getOwnPropertyDescriptor(e,n):null)&&(u.get||u.set)?Object.defineProperty(r,n,u):r[n]=e[n])}r.default=e,t&&t.set(e,r);return r}(require("react")),r=require("react-dom/server"),t=require("prop-types"),R=(e=require("./tagify.min.js"))&&e.__esModule?e:{default:e};function a(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return a=function(){return e},e}function n(){return(n=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n,r=arguments[t];for(n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e}).apply(this,arguments)}function o(e,t){if(null==e)return{};var n,r=function(e,t){if(null==e)return{};var n,r,o={},u=Object.keys(e);for(r=0;r<u.length;r++)n=u[r],0<=t.indexOf(n)||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols)for(var o=Object.getOwnPropertySymbols(e),u=0;u<o.length;u++)n=o[u],0<=t.indexOf(n)||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n]);return r}function k(e){return function(e){if(Array.isArray(e))return u(e)}(e)||function(e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e))return Array.from(e)}(e)||function(e,t){if(!e)return;if("string"==typeof e)return u(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);"Object"===n&&e.constructor&&(n=e.constructor.name);if("Map"===n||"Set"===n)return Array.from(e);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return u(e,t)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function u(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function C(e){return e}function N(e){if(e)for(var n in e)String(e[n]).includes(".createElement")&&function(){var t=e[n];e[n]=function(e){return(0,r.renderToStaticMarkup)(A.default.createElement(t,e))}}()}function c(e){function t(e){P.current=e}var n=e.name,r=e.value,o=void 0===r?"":r,u=void 0!==(r=e.loading)&&r,i=void 0===(r=e.onInput)?C:r,a=void 0===(r=e.onAdd)?C:r,c=void 0===(r=e.onRemove)?C:r,f=void 0===(r=e.onEdit)?C:r,l=void 0===(r=e.onInvalid)?C:r,s=void 0===(r=e.onClick)?C:r,d=void 0===(r=e.onKeydown)?C:r,p=void 0===(r=e.onFocus)?C:r,y=void 0===(r=e.onBlur)?C:r,g=void 0===(r=e.onChange)?C:r,v=e.readOnly,m=e.children,b=void 0===(r=e.settings)?{}:r,h=void 0===(r=e.InputMode)?"input":r,O=e.autoFocus,w=e.className,j=e.whitelist,E=e.tagifyRef,S=void 0===(r=e.placeholder)?"":r,x=e.defaultValue,M=e.showDropdown,I=(0,A.useRef)(),P=(0,A.useRef)(),T=(0,A.useRef)(),e=(0,A.useMemo)(function(){return{ref:t,name:n,value:m||("string"==typeof o?o:JSON.stringify(o)),className:w,readOnly:v,onChange:g,autoFocus:O,placeholder:S,defaultValue:x}},[]);return(0,A.useEffect)(function(){N(b.templates),"textarea"==h&&(b.mode="mix"),j&&j.length&&(b.whitelist=j);var e=new R.default(P.current,b);return i&&e.on("input",i),a&&e.on("add",a),c&&e.on("remove",c),f&&e.on("edit",f),l&&e.on("invalid",l),d&&e.on("keydown",d),p&&e.on("focus",p),y&&e.on("blur",y),s&&e.on("click",s),E&&(E.current=e),T.current=e,function(){e.destroy()}},[]),(0,A.useEffect)(function(){var e;I.current&&(T.current.settings.whitelist.length=0,j&&j.length&&(e=T.current.settings.whitelist).push.apply(e,k(j)))},[j]),(0,A.useEffect)(function(){I.current&&T.current.loadOriginalValues(o)},[o]),(0,A.useEffect)(function(){I.current&&T.current.toggleClass(w)},[w]),(0,A.useEffect)(function(){I.current&&T.current.loading(u)},[u]),(0,A.useEffect)(function(){I.current&&T.current.setReadonly(v)},[v]),(0,A.useEffect)(function(){var e=T.current;I.current&&(M?(e.dropdown.show.call(e,M),e.toggleFocusClass(!0)):e.dropdown.hide.call(e))},[M]),(0,A.useEffect)(function(){I.current=!0},[]),A.default.createElement("div",{className:"tags-input"},A.default.createElement(h,e))}c.propTypes={name:t.string,value:(0,t.oneOfType)([t.string,t.array]),loading:t.bool,children:t.element,onChange:t.func,readOnly:t.bool,settings:t.object,InputMode:t.string,autoFocus:t.bool,className:t.string,tagifyRef:t.object,whitelist:t.array,placeholder:t.string,defaultValue:(0,t.oneOfType)([t.string,t.array]),showDropdown:(0,t.oneOfType)([t.string,t.bool])};var f=A.default.memo(c);f.displayName="Tags";return exports.MixedTags=function(e){var t=e.children,e=o(e,["children"]);return A.default.createElement(f,n({InputMode:"textarea"},e),t)},exports.default=f});