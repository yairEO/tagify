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

const noop = _ => _; // if a template is a React component, it should be outputed as a String (and not as a React component)


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
  const mountedRef = (0, _react.useRef)();
  const inputElmRef = (0, _react.useRef)();
  const tagify = (0, _react.useRef)();

  const handleRef = elm => {
    inputElmRef.current = elm;
  };

  const inputAttrs = (0, _react.useMemo)(() => ({
    ref: handleRef,
    name,
    value: children ? children : typeof value === "string" ? value : JSON.stringify(value),
    className,
    readOnly,
    onChange,
    autoFocus,
    placeholder,
    defaultValue
  }), []);
  const setFocus = (0, _react.useCallback)(() => {
    autoFocus && tagify.current && tagify.current.DOM.input.focus();
  }, [tagify]);
  (0, _react.useEffect)(() => {
    templatesToString(settings.templates);
    if (InputMode == "textarea") settings.mode = "mix"; // "whitelist" prop takes precedence

    if (whitelist && whitelist.length) settings.whitelist = whitelist;
    const t = new _tagifyMin.default(inputElmRef.current, settings);
    onInput && t.on("input", onInput);
    onAdd && t.on("add", onAdd);
    onRemove && t.on("remove", onRemove);
    onEdit && t.on("edit", onEdit);
    onInvalid && t.on("invalid", onInvalid);
    onKeydown && t.on("keydown", onKeydown);
    onFocus && t.on("focus", onFocus);
    onBlur && t.on("blur", onBlur);
    onClick && t.on("click", onClick); // Bridge Tagify instance with parent component

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
    if (mountedRef.current) {
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
  children: _propTypes.element,
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
  showDropdown: (0, _propTypes.oneOfType)([_propTypes.string, _propTypes.bool])
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
return Tags;
}));
