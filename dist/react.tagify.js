/**
 * Tagify (v 4.17.0) - tags input component
 * By undefined
 * https://github.com/yairEO/tagify
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * THE SOFTWARE IS NOT PERMISSIBLE TO BE SOLD.
 */

;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.React.tagify = factory();
  }
}(this, function() {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.MixedTags = void 0;
var _react = _interopRequireWildcard(require("react"));
var _server = require("react-dom/server");
var _propTypes = require("prop-types");
var _tagify = _interopRequireDefault(require("./tagify.js"));
const _excluded = ["children"];
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
const noop = _ => _;
const isSameDeep = (a, b) => {
  const trans = x => typeof x == 'string' ? x : JSON.stringify(x);
  return trans(a) == trans(b);
};

// if a template is a React component, it should be outputed as a String (and not as a React component)
function templatesToString(templates) {
  if (templates) {
    for (let templateName in templates) {
      let Template = templates[templateName];
      let isReactComp = String(Template).includes("jsxRuntime");
      if (isReactComp) templates[templateName] = function () {
        for (var _len = arguments.length, props = new Array(_len), _key = 0; _key < _len; _key++) {
          props[_key] = arguments[_key];
        }
        return (0, _server.renderToStaticMarkup)( /*#__PURE__*/_react.default.createElement(Template, {
          props: props
        }));
      };
    }
  }
}
const TagifyWrapper = _ref => {
  let name = _ref.name,
    value = _ref.value,
    _ref$loading = _ref.loading,
    loading = _ref$loading === void 0 ? false : _ref$loading,
    _ref$onInput = _ref.onInput,
    onInput = _ref$onInput === void 0 ? noop : _ref$onInput,
    _ref$onAdd = _ref.onAdd,
    onAdd = _ref$onAdd === void 0 ? noop : _ref$onAdd,
    _ref$onRemove = _ref.onRemove,
    onRemove = _ref$onRemove === void 0 ? noop : _ref$onRemove,
    _ref$onEditInput = _ref.onEditInput,
    onEditInput = _ref$onEditInput === void 0 ? noop : _ref$onEditInput,
    _ref$onEditBeforeUpda = _ref.onEditBeforeUpdate,
    onEditBeforeUpdate = _ref$onEditBeforeUpda === void 0 ? noop : _ref$onEditBeforeUpda,
    _ref$onEditUpdated = _ref.onEditUpdated,
    onEditUpdated = _ref$onEditUpdated === void 0 ? noop : _ref$onEditUpdated,
    _ref$onEditStart = _ref.onEditStart,
    onEditStart = _ref$onEditStart === void 0 ? noop : _ref$onEditStart,
    _ref$onEditKeydown = _ref.onEditKeydown,
    onEditKeydown = _ref$onEditKeydown === void 0 ? noop : _ref$onEditKeydown,
    _ref$onInvalid = _ref.onInvalid,
    onInvalid = _ref$onInvalid === void 0 ? noop : _ref$onInvalid,
    _ref$onClick = _ref.onClick,
    onClick = _ref$onClick === void 0 ? noop : _ref$onClick,
    _ref$onKeydown = _ref.onKeydown,
    onKeydown = _ref$onKeydown === void 0 ? noop : _ref$onKeydown,
    _ref$onFocus = _ref.onFocus,
    onFocus = _ref$onFocus === void 0 ? noop : _ref$onFocus,
    _ref$onBlur = _ref.onBlur,
    onBlur = _ref$onBlur === void 0 ? noop : _ref$onBlur,
    _ref$onChange = _ref.onChange,
    onChange = _ref$onChange === void 0 ? noop : _ref$onChange,
    _ref$onDropdownShow = _ref.onDropdownShow,
    onDropdownShow = _ref$onDropdownShow === void 0 ? noop : _ref$onDropdownShow,
    _ref$onDropdownHide = _ref.onDropdownHide,
    onDropdownHide = _ref$onDropdownHide === void 0 ? noop : _ref$onDropdownHide,
    _ref$onDropdownSelect = _ref.onDropdownSelect,
    onDropdownSelect = _ref$onDropdownSelect === void 0 ? noop : _ref$onDropdownSelect,
    _ref$onDropdownScroll = _ref.onDropdownScroll,
    onDropdownScroll = _ref$onDropdownScroll === void 0 ? noop : _ref$onDropdownScroll,
    _ref$onDropdownNoMatc = _ref.onDropdownNoMatch,
    onDropdownNoMatch = _ref$onDropdownNoMatc === void 0 ? noop : _ref$onDropdownNoMatc,
    _ref$onDropdownUpdate = _ref.onDropdownUpdated,
    onDropdownUpdated = _ref$onDropdownUpdate === void 0 ? noop : _ref$onDropdownUpdate,
    readOnly = _ref.readOnly,
    disabled = _ref.disabled,
    children = _ref.children,
    _ref$settings = _ref.settings,
    settings = _ref$settings === void 0 ? {} : _ref$settings,
    _ref$InputMode = _ref.InputMode,
    InputMode = _ref$InputMode === void 0 ? "input" : _ref$InputMode,
    autoFocus = _ref.autoFocus,
    className = _ref.className,
    whitelist = _ref.whitelist,
    tagifyRef = _ref.tagifyRef,
    _ref$placeholder = _ref.placeholder,
    placeholder = _ref$placeholder === void 0 ? "" : _ref$placeholder,
    defaultValue = _ref.defaultValue,
    showDropdown = _ref.showDropdown;
  const mountedRef = (0, _react.useRef)();
  const inputElmRef = (0, _react.useRef)();
  const tagify = (0, _react.useRef)();
  const _value = defaultValue || value;
  const inputAttrs = (0, _react.useMemo)(() => ({
    ref: inputElmRef,
    name,
    defaultValue: children || typeof _value == 'string' ? _value : JSON.stringify(_value),
    className,
    readOnly,
    disabled,
    autoFocus,
    placeholder
  }), []);
  const setFocus = (0, _react.useCallback)(() => {
    autoFocus && tagify.current && tagify.current.DOM.input.focus();
  }, [tagify]);
  (0, _react.useEffect)(() => {
    templatesToString(settings.templates);
    if (InputMode == "textarea") settings.mode = "mix";

    // "whitelist" prop takes precedence
    if (whitelist && whitelist.length) settings.whitelist = whitelist;
    const t = new _tagify.default(inputElmRef.current, settings);
    t.on("input", onInput).on("add", onAdd).on("remove", onRemove).on("invalid", onInvalid).on("keydown", onKeydown).on("focus", onFocus).on("blur", onBlur).on("click", onClick).on("change", onChange).on("edit:input", onEditInput).on("edit:beforeUpdate", onEditBeforeUpdate).on("edit:updated", onEditUpdated).on("edit:start", onEditStart).on("edit:keydown", onEditKeydown).on("dropdown:show", onDropdownShow).on("dropdown:hide", onDropdownHide).on("dropdown:select", onDropdownSelect).on("dropdown:scroll", onDropdownScroll).on("dropdown:noMatch", onDropdownNoMatch).on("dropdown:updated", onDropdownUpdated);

    // Bridge Tagify instance with parent component
    if (tagifyRef) {
      tagifyRef.current = t;
    }
    tagify.current = t;
    setFocus();

    // cleanup
    return () => {
      t.destroy();
    };
  }, []);
  (0, _react.useEffect)(() => {
    setFocus();
  }, [autoFocus]);
  (0, _react.useEffect)(() => {
    if (mountedRef.current) {
      tagify.current.settings.whitelist.length = 0;

      // replace whitelist array items
      whitelist && whitelist.length && tagify.current.settings.whitelist.push(...whitelist);
    }
  }, [whitelist]);
  (0, _react.useEffect)(() => {
    const currentValue = tagify.current.getInputValue();
    if (mountedRef.current && !isSameDeep(value, currentValue)) {
      tagify.current.loadOriginalValues(value);
    }
  }, [value]);
  (0, _react.useEffect)(() => {
    if (mountedRef.current) {
      tagify.current.toggleClass(className);
    }
  }, [className]);
  (0, _react.useEffect)(() => {
    if (mountedRef.current) {
      tagify.current.loading(loading);
    }
  }, [loading]);
  (0, _react.useEffect)(() => {
    if (mountedRef.current) {
      tagify.current.setReadonly(readOnly);
    }
  }, [readOnly]);
  (0, _react.useEffect)(() => {
    if (mountedRef.current) {
      tagify.current.setDisabled(disabled);
    }
  }, [disabled]);
  (0, _react.useEffect)(() => {
    const t = tagify.current;
    if (mountedRef.current) {
      if (showDropdown) {
        t.dropdown.show.call(t, showDropdown);
        t.toggleFocusClass(true);
      } else {
        t.dropdown.hide.call(t);
      }
    }
  }, [showDropdown]);
  (0, _react.useEffect)(() => {
    mountedRef.current = true;
  }, []);
  return (
    /*#__PURE__*/
    // a wrapper must be used because Tagify will appened inside it it's component,
    // keeping the virtual-DOM out of the way
    _react.default.createElement("div", {
      className: "tags-input"
    }, /*#__PURE__*/_react.default.createElement(InputMode, inputAttrs))
  );
};
TagifyWrapper.propTypes = {
  name: _propTypes.string,
  value: (0, _propTypes.oneOfType)([_propTypes.string, _propTypes.array]),
  loading: _propTypes.bool,
  children: (0, _propTypes.oneOfType)([_propTypes.string, _propTypes.array]),
  onChange: _propTypes.func,
  readOnly: _propTypes.bool,
  settings: _propTypes.object,
  InputMode: _propTypes.string,
  autoFocus: _propTypes.bool,
  className: _propTypes.string,
  tagifyRef: _propTypes.object,
  whitelist: _propTypes.array,
  placeholder: _propTypes.string,
  defaultValue: (0, _propTypes.oneOfType)([_propTypes.string, _propTypes.array]),
  showDropdown: (0, _propTypes.oneOfType)([_propTypes.string, _propTypes.bool]),
  onInput: _propTypes.func,
  onAdd: _propTypes.func,
  onRemove: _propTypes.func,
  onEditInput: _propTypes.func,
  onEditBeforeUpdate: _propTypes.func,
  onEditUpdated: _propTypes.func,
  onEditStart: _propTypes.func,
  onEditKeydown: _propTypes.func,
  onInvalid: _propTypes.func,
  onClick: _propTypes.func,
  onKeydown: _propTypes.func,
  onFocus: _propTypes.func,
  onBlur: _propTypes.func,
  onDropdownShow: _propTypes.func,
  onDropdownHide: _propTypes.func,
  onDropdownSelect: _propTypes.func,
  onDropdownScroll: _propTypes.func,
  onDropdownNoMatch: _propTypes.func,
  onDropdownUpdated: _propTypes.func
};
const Tags = /*#__PURE__*/_react.default.memo(TagifyWrapper);
Tags.displayName = "Tags";
const MixedTags = _ref2 => {
  let children = _ref2.children,
    rest = _objectWithoutProperties(_ref2, _excluded);
  return /*#__PURE__*/_react.default.createElement(Tags, _extends({
    InputMode: "textarea"
  }, rest), children);
};
exports.MixedTags = MixedTags;
var _default = Tags;
exports.default = _default;
return exports;
}));
