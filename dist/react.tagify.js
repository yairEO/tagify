/**
 * Tagify (v 4.3.1) - tags input component
 * By Yair Even-Or
 * Don't sell this code. (c)
 * https://github.com/yairEO/tagify
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

var _tagifyMin = _interopRequireDefault(require("./tagify.min.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const noop = _ => _;

const isSameDeep = (a, b) => {
  const trans = x => typeof x == 'string' ? x : JSON.stringify(x);

  return trans(a) == trans(b);
}; // if a template is a React component, it should be outputed as a String (and not as a React component)


function templatesToString(templates) {
  if (templates) {
    for (let templateName in templates) {
      let isReactComp = String(templates[templateName]).includes(".createElement");

      if (isReactComp) {
        let Template = templates[templateName];

        templates[templateName] = data => (0, _server.renderToStaticMarkup)( /*#__PURE__*/_react.default.createElement(Template, data));
      }
    }
  }
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
    autoFocus,
    placeholder
  }), []);
  const setFocus = (0, _react.useCallback)(() => {
    autoFocus && tagify.current && tagify.current.DOM.input.focus();
  }, [tagify]);
  (0, _react.useEffect)(() => {
    templatesToString(settings.templates);
    if (InputMode == "textarea") settings.mode = "mix"; // "whitelist" prop takes precedence

    if (whitelist && whitelist.length) settings.whitelist = whitelist;
    const t = new _tagifyMin.default(inputElmRef.current, settings);
    t.on("input", onInput).on("add", onAdd).on("remove", onRemove).on("invalid", onInvalid).on("keydown", onKeydown).on("focus", onFocus).on("blur", onBlur).on("click", onClick).on("change", onChange).on("edit:input", onEditInput).on("edit:beforeUpdate", onEditBeforeUpdate).on("edit:updated", onEditUpdated).on("edit:start", onEditStart).on("edit:keydown", onEditKeydown).on("dropdown:show", onDropdownShow).on("dropdown:hide", onDropdownHide).on("dropdown:select", onDropdownSelect).on("dropdown:scroll", onDropdownScroll).on("dropdown:noMatch", onDropdownNoMatch).on("dropdown:updated", onDropdownUpdated); // Bridge Tagify instance with parent component

    if (tagifyRef) {
      tagifyRef.current = t;
    }

    tagify.current = t;
    setFocus(); // cleanup

    return () => {
      t.destroy();
    };
  }, []);
  (0, _react.useEffect)(() => {
    setFocus();
  }, [autoFocus]);
  (0, _react.useEffect)(() => {
    if (mountedRef.current) {
      tagify.current.settings.whitelist.length = 0; // replace whitelist array items

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

const MixedTags = (_ref) => {
  let children = _ref.children,
      rest = _objectWithoutProperties(_ref, ["children"]);

  return /*#__PURE__*/_react.default.createElement(Tags, _extends({
    InputMode: "textarea"
  }, rest), children);
};

exports.MixedTags = MixedTags;
var _default = Tags;
exports.default = _default;
return exports;
}));
