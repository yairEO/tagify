/**
 * Tagify (v 2.31.7)- tags input component
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
    root.Tagify = factory();
  }
}(this, function() {
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function Tagify(input, settings) {
  // protection
  if (!input) {
    console.warn('Tagify: ', 'invalid input element ', input);
    return this;
  }

  this.applySettings(input, settings);
  this.state = {
    editing: {},
    actions: {} // UI actions for state-locking

  };
  this.value = []; // tags' data
  // events' callbacks references will be stores here, so events could be unbinded

  this.listeners = {};
  this.DOM = {}; // Store all relevant DOM elements in an Object

  this.extend(this, new this.EventDispatcher(this));
  this.build(input);
  this.loadOriginalValues();
  this.events.customBinding.call(this);
  this.events.binding.call(this);
  input.autofocus && this.DOM.input.focus();
}

Tagify.prototype = {
  isIE: window.document.documentMode,
  // https://developer.mozilla.org/en-US/docs/Web/API/Document/compatMode#Browser_compatibility
  TEXTS: {
    empty: "empty",
    exceed: "number of tags exceeded",
    pattern: "pattern mismatch",
    duplicate: "already exists",
    notAllowed: "not allowed"
  },
  DEFAULTS: {
    delimiters: ",",
    // [RegEx] split tags by any of these delimiters ("null" to cancel) Example: ",| |."
    pattern: null,
    // RegEx pattern to validate input by. Ex: /[1-9]/
    maxTags: Infinity,
    // Maximum number of tags
    callbacks: {},
    // Exposed callbacks object to be triggered on certain events
    addTagOnBlur: true,
    // Flag - automatically adds the text which was inputed as a tag when blur event happens
    duplicates: false,
    // Flag - allow tuplicate tags
    whitelist: [],
    // Array of tags to suggest as the user types (can be used along with "enforceWhitelist" setting)
    blacklist: [],
    // A list of non-allowed tags
    enforceWhitelist: false,
    // Flag - Only allow tags allowed in whitelist
    keepInvalidTags: false,
    // Flag - if true, do not remove tags which did not pass validation
    autoComplete: true,
    // Flag - tries to autocomplete the input's value while typing
    mixTagsAllowedAfter: /,|\.|\:|\s/,
    // RegEx - Define conditions in which mix-tags content is allowing a tag to be added after
    mixTagsInterpolator: ['[[', ']]'],
    // Interpolation for mix mode. Everything between this will becmoe a tag
    backspace: true,
    // false / true / "edit"
    skipInvalid: false,
    editTags: 2,
    // 1 or 2 clicks to edit a tag
    transformTag: function transformTag() {},
    dropdown: {
      classname: '',
      enabled: 2,
      // minimum input characters needs to be typed for the dropdown to show
      maxItems: 10,
      itemTemplate: '',
      fuzzySearch: true,
      highlightFirst: false,
      // highlights first-matched item in the list
      closeOnSelect: true,
      // closes the dropdown after selecting an item, if `enabled:0` (which means always show dropdown)
      position: 'all' // 'manual' / 'text' / 'all'

    }
  },
  templates: {
    wrapper: function wrapper(input, settings) {
      return "<tags class=\"tagify ".concat(settings.mode ? "tagify--" + settings.mode : "", " ").concat(input.className, "\"\n                        ").concat(settings.readonly ? 'readonly aria-readonly="true"' : 'aria-haspopup="true" aria-expanded="false"', "\n                        role=\"tagslist\">\n                <span contenteditable data-placeholder=\"").concat(settings.placeholder || '&#8203;', "\" aria-placeholder=\"").concat(settings.placeholder || '', "\"\n                    class=\"tagify__input\"\n                    role=\"textbox\"\n                    aria-multiline=\"false\"></span>\n            </tags>");
    },
    tag: function tag(value, tagData) {
      return "<tag title='".concat(tagData.title || value, "'\n                        contenteditable='false'\n                        spellcheck='false'\n                        class='tagify__tag ").concat(tagData["class"] ? tagData["class"] : "", "'\n                        ").concat(this.getAttributes(tagData), ">\n                <x title='' class='tagify__tag__removeBtn' role='button' aria-label='remove tag'></x>\n                <div>\n                    <span class='tagify__tag-text'>").concat(value, "</span>\n                </div>\n            </tag>");
    },
    dropdownItem: function dropdownItem(item) {
      var sanitizedValue = (item.value || item).replace(/`|'/g, "&#39;");
      return "<div ".concat(this.getAttributes(item), "\n                        class='tagify__dropdown__item ").concat(item["class"] ? item["class"] : "", "'\n                        tabindex=\"0\"\n                        role=\"menuitem\"\n                        aria-labelledby=\"dropdown-label\">").concat(sanitizedValue, "</div>");
    }
  },
  customEventsList: ['click', 'add', 'remove', 'invalid', 'input', 'edit'],
  applySettings: function applySettings(input, settings) {
    var _this2 = this;

    this.DEFAULTS.templates = this.templates;
    this.DEFAULTS.dropdown.itemTemplate = this.templates.dropdownItem; // regression fallback

    this.settings = this.extend({}, this.DEFAULTS, settings);
    this.settings.readonly = input.hasAttribute('readonly'); // if "readonly" do not include an "input" element inside the Tags component

    this.settings.placeholder = input.getAttribute('placeholder') || this.settings.placeholder || "";
    if (this.isIE) this.settings.autoComplete = false; // IE goes crazy if this isn't false

    ["whitelist", "blacklist"].forEach(function (name) {
      var attrVal = input.getAttribute('data-' + name);

      if (attrVal) {
        attrVal = attrVal.split(_this2.settings.delimiters);
        if (attrVal instanceof Array) _this2.settings[name] = attrVal;
      }
    });
    if (input.pattern) try {
      this.settings.pattern = new RegExp(input.pattern);
    } catch (e) {} // Convert the "delimiters" setting into a REGEX object

    if (this.settings.delimiters) {
      try {
        this.settings.delimiters = new RegExp(this.settings.delimiters, "g");
      } catch (e) {}
    } // make sure the dropdown will be shown on "focus" and not only after typing something (in "select" mode)


    if (this.settings.mode == 'select') this.settings.dropdown.enabled = 0;
  },

  /**
   * utility method
   * https://stackoverflow.com/a/35385518/104380
   * @param  {String} s [HTML string]
   * @return {Object}   [DOM node]
   */
  parseHTML: function parseHTML(s) {
    var parser = new DOMParser(),
        node = parser.parseFromString(s.trim(), "text/html");
    return node.body.firstElementChild;
  },

  /**
   * utility method
   * https://stackoverflow.com/a/25396011/104380
   */
  escapeHTML: function escapeHTML(s) {
    var text = document.createTextNode(s),
        p = document.createElement('p');
    p.appendChild(text);
    return p.innerHTML;
  },

  /**
   * Get the caret position relative to the viewport
   * https://stackoverflow.com/q/58985076/104380
   *
   * @returns {object} left, top distance in pixels
   */
  getCaretGlobalPosition: function getCaretGlobalPosition() {
    var sel = document.getSelection();

    if (sel.rangeCount) {
      var r = sel.getRangeAt(0);
      var node = r.startContainer;
      var offset = r.startOffset;
      var rect, r2;

      if (offset > 0) {
        r2 = document.createRange();
        r2.setStart(node, offset - 1);
        r2.setEnd(node, offset);
        rect = r2.getBoundingClientRect();
        return {
          left: rect.right,
          top: rect.top,
          bottom: rect.bottom
        };
      }
    }

    return {
      left: -9999,
      top: -9999
    };
  },

  /**
   * builds the HTML of this component
   * @param  {Object} input [DOM element which would be "transformed" into "Tags"]
   */
  build: function build(input) {
    var that = this,
        DOM = this.DOM,
        template = this.settings.templates.wrapper(input, this.settings);
    DOM.originalInput = input;
    DOM.scope = this.parseHTML(template);
    DOM.input = DOM.scope.querySelector('[contenteditable]');
    input.parentNode.insertBefore(DOM.scope, input);

    if (this.settings.dropdown.enabled >= 0) {
      this.dropdown.init.call(this);
    }
  },

  /**
   * revert any changes made by this component
   */
  destroy: function destroy() {
    this.DOM.scope.parentNode.removeChild(this.DOM.scope);
    this.dropdown.hide.call(this, true);
  },

  /**
   * if the original input had any values, add them as tags
   */
  loadOriginalValues: function loadOriginalValues() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.DOM.originalInput.value;
    // if the original input already had any value (tags)
    if (!value) return;
    this.removeAllTags();

    try {
      value = JSON.parse(value);
    } catch (err) {}

    if (this.settings.mode == 'mix') {
      this.parseMixTags(value);
    } else this.addTags(value).forEach(function (tag) {
      return tag && tag.classList.add('tagify--noAnim');
    });
  },

  /**
   * Checks if an argument is a javascript Object
   */
  isObject: function isObject(obj) {
    var type = Object.prototype.toString.call(obj).split(' ')[1].slice(0, -1);
    return obj === Object(obj) && type != 'Array' && type != 'Function' && type != 'RegExp' && type != 'HTMLUnknownElement';
  },

  /**
   * merge objects into a single new one
   * TEST: extend({}, {a:{foo:1}, b:[]}, {a:{bar:2}, b:[1], c:()=>{}})
   */
  extend: function extend(o, o1, o2) {
    var that = this;
    if (!(o instanceof Object)) o = {};
    copy(o, o1);
    if (o2) copy(o, o2);

    function copy(a, b) {
      // copy o2 to o
      for (var key in b) {
        if (b.hasOwnProperty(key)) {
          if (that.isObject(b[key])) {
            if (!that.isObject(a[key])) a[key] = Object.assign({}, b[key]);else copy(a[key], b[key]);
          } else a[key] = b[key];
        }
      }
    }

    return o;
  },

  /**
   * A constructor for exposing events to the outside
   */
  EventDispatcher: function EventDispatcher(instance) {
    // Create a DOM EventTarget object
    var target = document.createTextNode(''); // Pass EventTarget interface calls to DOM EventTarget object

    this.off = function (name, cb) {
      if (cb) target.removeEventListener.call(target, name, cb);
      return this;
    };

    this.on = function (name, cb) {
      if (cb) target.addEventListener.call(target, name, cb);
      return this;
    };

    this.trigger = function (eventName, data) {
      var e;
      if (!eventName) return;

      if (instance.settings.isJQueryPlugin) {
        if (eventName == 'remove') eventName = 'removeTag'; // issue #222

        jQuery(instance.DOM.originalInput).triggerHandler(eventName, [data]);
      } else {
        try {
          e = new CustomEvent(eventName, {
            "detail": this.extend({}, data, {
              tagify: this
            })
          });
        } catch (err) {
          console.warn(err);
        }

        target.dispatchEvent(e);
      }
    };
  },

  /**
   * Toogle loading state on/off
   * @param {Boolean} isLoading
   */
  loading: function loading(isLoading) {
    this.DOM.scope.classList.toggle('tagify--loading', isLoading);
    return this;
  },

  /**
   * DOM events listeners binding
   */
  events: {
    // bind custom events which were passed in the settings
    customBinding: function customBinding() {
      var _this3 = this;

      this.customEventsList.forEach(function (name) {
        _this3.on(name, _this3.settings.callbacks[name]);
      });
    },
    binding: function binding() {
      var bindUnbind = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      var _CB = this.events.callbacks,
          _CBR,
          action = bindUnbind ? 'addEventListener' : 'removeEventListener',
          editTagsEventType = this.settings.editTags == 1 ? "click_" // TODO: Refactor this crappy hack to allow same event more than once
      : this.settings.editTags == 2 ? "dblclick" : ""; // do not allow the main events to be bound more than once


      if (this.state.mainEvents && bindUnbind) return; // set the binding state of the main events, so they will not be bound more than once

      this.state.mainEvents = bindUnbind;

      if (bindUnbind && !this.listeners.main) {
        // this event should never be unbinded
        // IE cannot register "input" events on contenteditable elements, so the "keydown" should be used instead..
        this.DOM.input.addEventListener(this.isIE ? "keydown" : "input", _CB[this.isIE ? "onInputIE" : "onInput"].bind(this));
        if (this.settings.isJQueryPlugin) jQuery(this.DOM.originalInput).on('tagify.removeAllTags', this.removeAllTags.bind(this));
      } // setup callback references so events could be removed later


      _CBR = this.listeners.main = this.listeners.main || _defineProperty({
        paste: ['input', _CB.onPaste.bind(this)],
        focus: ['input', _CB.onFocusBlur.bind(this)],
        blur: ['input', _CB.onFocusBlur.bind(this)],
        keydown: ['input', _CB.onKeydown.bind(this)],
        click: ['scope', _CB.onClickScope.bind(this)]
      }, editTagsEventType, ['scope', _CB.onDoubleClickScope.bind(this)]);

      for (var eventName in _CBR) {
        // make sure the focus/blur event is always regesitered (and never more than once)
        if (eventName == 'blur' && !bindUnbind) return;

        this.DOM[_CBR[eventName][0]][action](eventName.replace(/_/g, ''), _CBR[eventName][1]);
      }
    },

    /**
     * DOM events callbacks
     */
    callbacks: {
      onFocusBlur: function onFocusBlur(e) {
        var text = e.target ? e.target.textContent.trim() : '',
            // a string
        _s = this.settings;
        if (this.state.actions.selectOption && (_s.dropdown.enabled || !_s.dropdown.closeOnSelect)) return; // toggle "focus" BEM class

        this.DOM.scope.classList[e.type == "focus" ? "add" : "remove"]('tagify--focus');
        if (_s.mode == 'mix') return;

        if (e.type == "focus") {
          this.trigger("focus"); //  e.target.classList.remove('placeholder');

          if (_s.dropdown.enabled === 0) {
            this.dropdown.show.call(this);
          }

          return;
        } else if (e.type == "blur") {
          this.trigger("blur");
          text && _s.addTagOnBlur && this.addTags(text, true);
        } //    else{
        //  e.target.classList.add('placeholder');


        this.DOM.input.removeAttribute('style');
        this.dropdown.hide.call(this); //    }
      },
      onKeydown: function onKeydown(e) {
        var _this4 = this;

        var s = e.target.textContent.trim(),
            tags;
        this.trigger("keydown", e);

        if (this.settings.mode == 'mix') {
          switch (e.key) {
            case 'Delete':
            case 'Backspace':
              var values = []; // find out which tag(s) were deleted and update "this.value" accordingly

              tags = this.DOM.input.children; // a delay is in need before the node actually gets ditached from the document

              setTimeout(function () {
                // iterate over the list of tags still in the document and then filter only those from the "this.value" collection
                [].forEach.call(tags, function (tagElm) {
                  return values.push(tagElm.getAttribute('value'));
                });
                _this4.value = _this4.value.filter(function (d) {
                  return values.indexOf(d.value) != -1;
                });
              }, 20);
              break;
            // currently commented to allow new lines in mixed-mode
            // case 'Enter' :
            //     e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
          }

          return true;
        }

        switch (e.key) {
          case 'Backspace':
            if (s == "" || s.charCodeAt(0) == 8203) {
              // 8203: ZERO WIDTH SPACE unicode
              if (this.settings.backspace === true) this.removeTag();else if (this.settings.backspace == 'edit') setTimeout(this.editTag.bind(this), 0); // timeout reason: when edited tag gets focused and the caret is placed at the end, the last character gets deletec (because of backspace)
            }

            break;

          case 'Esc':
          case 'Escape':
            e.target.blur();
            break;

          case 'Down':
          case 'ArrowDown':
            // if( this.settings.mode == 'select' ) // #333
            this.dropdown.show.call(this);
            break;

          case 'ArrowRight':
          case 'Tab':
            if (!s) return true;

          case 'Enter':
            e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380

            this.addTags(s, true);
        }
      },
      onInput: function onInput(e) {
        var value = this.settings.mode == 'mix' ? this.DOM.input.textContent : this.input.normalize.call(this),
            showSuggestions = value.length >= this.settings.dropdown.enabled,
            data = {
          value: value,
          inputElm: this.DOM.input
        };
        if (this.settings.mode == 'mix') return this.events.callbacks.onMixTagsInput.call(this, e);

        if (!value) {
          this.input.set.call(this, '');
          return;
        }

        if (this.input.value == value) return; // for IE; since IE doesn't have an "input" event so "keyDown" is used instead

        data.isValid = this.validateTag(value); // save the value on the input's State object

        this.input.set.call(this, value, false); // update the input with the normalized value and run validations
        // this.setRangeAtStartEnd(); // fix caret position

        if (value.search(this.settings.delimiters) != -1) {
          if (this.addTags(value)) {
            this.input.set.call(this); // clear the input field's value
          }
        } else if (this.settings.dropdown.enabled >= 0) {
          this.dropdown[showSuggestions ? "show" : "hide"].call(this, value);
        }

        this.trigger("input", data);
      },
      onMixTagsInput: function onMixTagsInput(e) {
        var sel, range, split, tag, showSuggestions;
        if (this.maxTagsReached()) return true;

        if (window.getSelection) {
          sel = window.getSelection();

          if (sel.rangeCount > 0) {
            range = sel.getRangeAt(0).cloneRange();
            range.collapse(true);
            range.setStart(window.getSelection().focusNode, 0);
            split = range.toString().split(this.settings.mixTagsAllowedAfter); // ["foo", "bar", "@a"]

            tag = split[split.length - 1].match(this.settings.pattern);

            if (tag) {
              this.state.tag = {
                prefix: tag[0],
                value: tag.input.split(tag[0])[1]
              };
              showSuggestions = this.state.tag.value.length >= this.settings.dropdown.enabled;
            }
          }
        }

        this.update(); // wait until the "this.value" has been updated (see "onKeydown" method for "mix-mode")

        setTimeout(this.trigger.bind(this, "input", this.extend({}, this.state.tag, {
          textContent: this.DOM.input.textContent
        })), 30);

        if (this.state.tag) {
          this.dropdown[showSuggestions ? "show" : "hide"].call(this, this.state.tag.value);
        }
      },
      onInputIE: function onInputIE(e) {
        var _this = this; // for the "e.target.textContent" to be changed, the browser requires a small delay


        setTimeout(function () {
          _this.events.callbacks.onInput.call(_this, e);
        });
      },
      onPaste: function onPaste(e) {},
      onClickScope: function onClickScope(e) {
        var tagElm = e.target.closest('tag'),
            tagElmIdx;
        if (e.target.tagName == "TAGS") this.DOM.input.focus();else if (e.target.tagName == "X") {
          this.removeTag(e.target.parentNode);
          return; // for select-mode: do not continue, so the dropdown won't be shown
        } else if (tagElm) {
          tagElmIdx = this.getNodeIndex(tagElm);
          this.trigger("click", {
            tag: tagElm,
            index: tagElmIdx,
            data: this.value[tagElmIdx]
          });
        }
        if (this.settings.mode == 'select' || this.settings.dropdown.enabled === 0) this.dropdown.show.call(this);
      },
      onEditTagInput: function onEditTagInput(editableElm) {
        var tagElm = editableElm.closest('tag'),
            tagElmIdx = this.getNodeIndex(tagElm),
            value = this.input.normalize.call(this, editableElm),
            isValid = value.toLowerCase() == editableElm.originalValue.toLowerCase() || this.validateTag(value);
        tagElm.classList.toggle('tagify--invalid', isValid !== true);
        tagElm.isValid = isValid; // show dropdown if typed text is equal or more than the "enabled" dropdown setting

        if (value.length >= this.settings.dropdown.enabled) {
          this.state.editing.value = value;
          this.dropdown.show.call(this, value);
        }

        this.trigger("edit:input", {
          tag: tagElm,
          index: tagElmIdx,
          data: this.extend({}, this.value[tagElmIdx], {
            newValue: value
          })
        });
      },
      onEditTagBlur: function onEditTagBlur(editableElm) {
        if (!this.DOM.scope.contains(editableElm)) return;

        var tagElm = editableElm.closest('.tagify__tag'),
            tagElmIdx = this.getNodeIndex(tagElm),
            currentValue = this.input.normalize.call(this, editableElm),
            value = currentValue || editableElm.originalValue,
            hasChanged = value != editableElm.originalValue,
            isValid = tagElm.isValid,
            tagData = _objectSpread({}, this.value[tagElmIdx], {
          value: value
        });

        this.DOM.input.focus();

        if (!currentValue) {
          this.removeTag(tagElm);
          return;
        }

        if (hasChanged) {
          this.settings.transformTag.call(this, tagData); // re-validate after tag transformation

          isValid = this.validateTag(tagData.value);
        } else {
          this.replaceTag(tagElm);
          return;
        }

        if (isValid !== undefined && isValid !== true) return;
        this.replaceTag(tagElm, tagData);
      },
      onEditTagkeydown: function onEditTagkeydown(e) {
        this.trigger("edit:keydown", e);

        switch (e.key) {
          case 'Esc':
          case 'Escape':
            e.target.textContent = e.target.originalValue;

          case 'Enter':
          case 'Tab':
            e.preventDefault();
            e.target.blur();
        }
      },
      onDoubleClickScope: function onDoubleClickScope(e) {
        var tagElm = e.target.closest('tag'),
            _s = this.settings,
            isEditingTag,
            isReadyOnlyTag;
        if (!tagElm) return;
        isEditingTag = tagElm.classList.contains('tagify--editable'), isReadyOnlyTag = tagElm.hasAttribute('readonly');
        if (_s.mode != 'mix' && _s.mode != 'select' && !_s.readonly && !_s.enforceWhitelist && !isEditingTag && !isReadyOnlyTag) this.editTag(tagElm);
      }
    }
  },

  /**
   * @param {Node} tagElm the tag element to edit. if nothing specified, use last last
   */
  editTag: function editTag() {
    var _this5 = this;

    var tagElm = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.getLastTag();

    var editableElm = tagElm.querySelector('.tagify__tag-text'),
        tagIdx = this.getNodeIndex(tagElm),
        _CB = this.events.callbacks,
        that = this,
        delayed_onEditTagBlur = function delayed_onEditTagBlur() {
      setTimeout(_CB.onEditTagBlur.bind(that), 0, editableElm);
    };

    if (!editableElm) {
      console.warn('Cannot find element in Tag template: ', '.tagify__tag-text');
      return;
    }

    tagElm.classList.add('tagify--editable');
    editableElm.originalValue = editableElm.textContent;
    editableElm.setAttribute('contenteditable', true);
    editableElm.addEventListener('blur', delayed_onEditTagBlur);
    editableElm.addEventListener('input', _CB.onEditTagInput.bind(this, editableElm));
    editableElm.addEventListener('keydown', function (e) {
      return _CB.onEditTagkeydown.call(_this5, e);
    });
    editableElm.focus();
    this.setRangeAtStartEnd(false, editableElm);
    this.state.editing = {
      scope: tagElm,
      input: tagElm.querySelector("[contenteditable]")
    };
    this.trigger("edit:start", {
      tag: tagElm,
      index: tagIdx,
      data: this.value[tagIdx]
    });
    return this;
  },

  /**
   * Exit a tag's edit-mode.
   * if "tagData" exists, replace the tag element with new data and update Tagify value
   */
  replaceTag: function replaceTag(tagElm, tagData) {
    var _this6 = this;

    var editableElm = tagElm.querySelector('.tagify__tag-text'),
        clone = editableElm.cloneNode(true),
        tagElmIdx;
    if (this.state.editing.locked) return; // when editing a tag and selecting a dropdown suggested item, the state should be "locked"
    // so "onEditTagBlur" won't run and change the tag also *after* it was just changed.

    this.state.editing = {
      locked: true
    };
    setTimeout(function () {
      return delete _this6.state.editing.locked;
    }, 500); // update DOM nodes

    clone.removeAttribute('contenteditable');
    tagElm.classList.remove('tagify--editable'); // guarantee to remove all events which were added by the "editTag" method

    editableElm.parentNode.replaceChild(clone, editableElm); // continue only if there was a reason for it

    if (tagData) {
      clone.innerHTML = tagData.value;
      clone.title = tagData.value; // update data

      tagElmIdx = this.getNodeIndex(clone);
      this.value[tagElmIdx] = tagData;
      this.update();
      this.trigger("edit:updated", {
        tag: tagElm,
        index: tagElmIdx,
        data: tagData
      });
    }
  },

  /** https://stackoverflow.com/a/59156872/104380
   * @param {Boolean} start indicating where to place it (start or end of the node)
   * @param {Object}  node  DOM node to place the caret at
   */
  setRangeAtStartEnd: function setRangeAtStartEnd(start, node) {
    node = node || this.DOM.input;
    node = node.firstChild;
    var sel = document.getSelection();

    if (sel.rangeCount) {
      ['Start', 'End'].forEach(function (pos) {
        return sel.getRangeAt(0)["set" + pos](node, start ? 0 : node.length);
      });
    }
  },

  /**
   * input bridge for accessing & setting
   * @type {Object}
   */
  input: {
    value: '',
    set: function set() {
      var s = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var updateDOM = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var hideDropdown = this.settings.dropdown.enabled > 0 || this.settings.dropdown.closeOnSelect;
      this.input.value = s;
      if (updateDOM) this.DOM.input.innerHTML = s;
      if (!s && hideDropdown) setTimeout(this.dropdown.hide.bind(this), 20); // setTimeout duration must be HIGER than the dropdown's item "onClick" method's "focus()" event, because the "hide" method re-binds the main events and it will catch the "blur" event and will cause

      this.input.autocomplete.suggest.call(this, '');
      this.input.validate.call(this);
    },

    /**
     * Marks the tagify's input as "invalid" if the value did not pass "validateTag()"
     */
    validate: function validate() {
      var isValid = !this.input.value || this.validateTag(this.input.value);
      if (this.settings.mode == 'select') this.DOM.scope.classList.toggle('tagify--invalid', isValid !== true);else this.DOM.input.classList.toggle('tagify__input--invalid', isValid !== true);
    },
    // remove any child DOM elements that aren't of type TEXT (like <br>)
    normalize: function normalize() {
      var node = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.DOM.input;
      var clone = node,
          //.cloneNode(true),
      v = clone.innerText;

      try {
        // "delimiters" might be of a non-regex value, where this will fail ("Tags With Properties" example in demo page):
        v = v.replace(/(?:\r\n|\r|\n)/g, this.settings.delimiters.source.charAt(1));
      } catch (err) {}

      v = v.replace(/\s/g, ' ') // replace NBSPs with spaces characters
      .replace(/^\s+/, ""); // trimLeft

      return v;
    },

    /**
     * suggest the rest of the input's value (via CSS "::after" using "content:attr(...)")
     * @param  {String} s [description]
     */
    autocomplete: {
      suggest: function suggest(s) {
        s = s || '';
        var suggestionStart = s.substr(0, this.input.value.length).toLowerCase(),
            suggestionTrimmed = s.substring(this.input.value.length);
        if (!s || !this.input.value || suggestionStart != this.input.value.toLowerCase()) this.DOM.input.removeAttribute("data-suggest");else this.DOM.input.setAttribute("data-suggest", suggestionTrimmed);
      },
      set: function set(s) {
        var dataSuggest = this.DOM.input.getAttribute('data-suggest'),
            suggestion = s || (dataSuggest ? this.input.value + dataSuggest : null);

        if (suggestion) {
          if (this.settings.mode == 'mix') {
            this.replaceTaggedText(document.createTextNode(this.state.tag.prefix + suggestion));
          } else {
            this.input.set.call(this, suggestion);
            this.setRangeAtStartEnd();
          }

          this.input.autocomplete.suggest.call(this, '');
          this.dropdown.hide.call(this);
          return true;
        }

        return false;
      }
    }
  },
  getNodeIndex: function getNodeIndex(node) {
    var index = 0;
    if (node) while (node = node.previousElementSibling) {
      index++;
    }
    return index;
  },
  getTagElms: function getTagElms() {
    return this.DOM.scope.querySelectorAll('tag');
  },
  getLastTag: function getLastTag() {
    var lastTag = this.DOM.scope.querySelectorAll('tag:not(.tagify--hide):not([readonly])');
    return lastTag[lastTag.length - 1];
  },

  /**
   * Searches if any tag with a certain value already exis
   * @param  {String/Object} v [text value / tag data object]
   * @return {Boolean}
   */
  isTagDuplicate: function isTagDuplicate(v) {
    var _this7 = this;

    // duplications are irrelevant for this scenario
    if (this.settings.mode == 'select') return false;
    return this.value.some(function (item) {
      return _this7.isObject(v) ? JSON.stringify(item).toLowerCase() === JSON.stringify(v).toLowerCase() : v.trim().toLowerCase() === item.value.toLowerCase();
    });
  },
  getTagIndexByValue: function getTagIndexByValue(value) {
    var result = [];
    this.getTagElms().forEach(function (tagElm, i) {
      if (tagElm.textContent.trim().toLowerCase() == value.toLowerCase()) result.push(i);
    });
    return result;
  },
  getTagElmByValue: function getTagElmByValue(value) {
    var tagIdx = this.getTagIndexByValue(value)[0];
    return this.getTagElms()[tagIdx];
  },

  /**
   * Mark a tag element by its value
   * @param  {String|Number} value  [text value to search for]
   * @param  {Object}          tagElm [a specific "tag" element to compare to the other tag elements siblings]
   * @return {boolean}                [found / not found]
   */
  markTagByValue: function markTagByValue(value, tagElm) {
    tagElm = tagElm || this.getTagElmByValue(value); // check AGAIN if "tagElm" is defined

    if (tagElm) {
      tagElm.classList.add('tagify--mark'); //   setTimeout(() => { tagElm.classList.remove('tagify--mark') }, 100);

      return tagElm;
    }

    return false;
  },

  /**
   * make sure the tag, or words in it, is not in the blacklist
   */
  isTagBlacklisted: function isTagBlacklisted(v) {
    v = v.toLowerCase().trim();
    return this.settings.blacklist.filter(function (x) {
      return v == x.toLowerCase();
    }).length;
  },

  /**
   * make sure the tag, or words in it, is not in the blacklist
   */
  isTagWhitelisted: function isTagWhitelisted(v) {
    return this.settings.whitelist.some(function (item) {
      return typeof v == 'string' ? v.trim().toLowerCase() === (item.value || item).toLowerCase() : JSON.stringify(item).toLowerCase() === JSON.stringify(v).toLowerCase();
    });
  },

  /**
   * validate a tag object BEFORE the actual tag will be created & appeneded
   * @param  {String} s
   * @return {Boolean/String}  ["true" if validation has passed, String for a fail]
   */
  validateTag: function validateTag(s) {
    var value = s.trim(),
        result = true; // check for empty value

    if (!value) result = this.TEXTS.empty; // check if pattern should be used and if so, use it to test the value
    else if (this.settings.pattern && !this.settings.pattern.test(value)) result = this.TEXTS.pattern; // if duplicates are not allowed and there is a duplicate
      else if (!this.settings.duplicates && this.isTagDuplicate(value)) result = this.TEXTS.duplicate;else if (this.isTagBlacklisted(value) || this.settings.enforceWhitelist && !this.isTagWhitelisted(value)) result = this.TEXTS.notAllowed;
    return result;
  },
  maxTagsReached: function maxTagsReached() {
    if (this.value.length >= this.settings.maxTags) return this.TEXTS.exceed;
    return false;
  },

  /**
   * pre-proccess the tagsItems, which can be a complex tagsItems like an Array of Objects or a string comprised of multiple words
   * so each item should be iterated on and a tag created for.
   * @return {Array} [Array of Objects]
   */
  normalizeTags: function normalizeTags(tagsItems) {
    var _this$settings = this.settings,
        whitelist = _this$settings.whitelist,
        delimiters = _this$settings.delimiters,
        mode = _this$settings.mode,
        whitelistWithProps = whitelist ? whitelist[0] instanceof Object : false,
        isArray = tagsItems instanceof Array,
        isCollection = isArray && tagsItems[0] instanceof Object && "value" in tagsItems[0],
        temp = [],
        mapStringToCollection = function mapStringToCollection(s) {
      return s.split(delimiters).filter(function (n) {
        return n;
      }).map(function (v) {
        return {
          value: v.trim()
        };
      });
    }; // no need to continue if "tagsItems" is an Array of Objects


    if (isCollection) {
      var _ref2;

      // iterate the collection items and check for values that can be splitted into multiple tags
      tagsItems = (_ref2 = []).concat.apply(_ref2, _toConsumableArray(tagsItems.map(function (item) {
        return mapStringToCollection(item.value).map(function (newItem) {
          return _objectSpread({}, item, {}, newItem);
        });
      })));
      return tagsItems;
    }

    if (typeof tagsItems == 'number') tagsItems = tagsItems.toString(); // if the value is a "simple" String, ex: "aaa, bbb, ccc"

    if (typeof tagsItems == 'string') {
      if (!tagsItems.trim()) return []; // go over each tag and add it (if there were multiple ones)

      tagsItems = mapStringToCollection(tagsItems);
    } else if (isArray) {
      var _ref3;

      tagsItems = (_ref3 = []).concat.apply(_ref3, _toConsumableArray(tagsItems.map(function (item) {
        return mapStringToCollection(item);
      })));
    } // search if the tag exists in the whitelist as an Object (has props), to be able to use its properties


    if (whitelistWithProps) {
      tagsItems.forEach(function (item) {
        var matchObj = whitelist.filter(function (WL_item) {
          return WL_item.value.toLowerCase() == item.value.toLowerCase();
        });
        if (matchObj[0]) temp.push(matchObj[0]); // set the Array (with the found Object) as the new value
        else if (mode != 'mix') temp.push(item);
      });
      tagsItems = temp;
    }

    return tagsItems;
  },

  /**
   * Used to parse the initial value of a textarea (or input) element and gemerate mixed text w/ tags
   * https://stackoverflow.com/a/57598892/104380
   * @param {String} s
   */
  parseMixTags: function parseMixTags(s) {
    var _this8 = this;

    var _this$settings2 = this.settings,
        mixTagsInterpolator = _this$settings2.mixTagsInterpolator,
        duplicates = _this$settings2.duplicates,
        transformTag = _this$settings2.transformTag;
    s = s.split(mixTagsInterpolator[0]).map(function (s1) {
      var s2 = s1.split(mixTagsInterpolator[1]),
          preInterpolated = s2[0],
          tagData,
          tagElm;

      try {
        tagData = JSON.parse(preInterpolated);
      } catch (err) {
        tagData = _this8.normalizeTags(preInterpolated)[0]; //{value:preInterpolated}
      }

      if (s2.length > 1 && _this8.isTagWhitelisted(tagData.value) && !(!duplicates && _this8.isTagDuplicate(tagData))) {
        transformTag.call(_this8, tagData);
        tagElm = _this8.createTagElem(tagData);
        s2[0] = tagElm.outerHTML; //+ "&#8288;"  // put a zero-space at the end so the caret won't jump back to the start (when the last input's child element is a tag)

        _this8.value.push(tagData);
      }

      return s2.join('');
    }).join('');
    this.DOM.input.innerHTML = s;
    this.update();
    return s;
  },

  /**
   * For mixed-mode: replaces a text starting with a prefix with a wrapper element (tag or something)
   * First there *has* to be a "this.state.tag" which is a string that was just typed and is staring with a prefix
   */
  replaceTaggedText: function replaceTaggedText(wrapperElm, tagString) {
    if (!this.state.tag && !tagString) return;
    tagString = tagString || this.state.tag.prefix + this.state.tag.value;
    var iter = document.createNodeIterator(this.DOM.input, NodeFilter.SHOW_TEXT),
        textnode,
        idx,
        maxLoops = 100,
        replacedNode;

    while (textnode = iter.nextNode()) {
      if (!maxLoops--) break; // get the index of which the tag (string) is within the textNode (if at all)

      idx = textnode.nodeValue.indexOf(tagString);
      if (idx == -1) continue;
      replacedNode = textnode.splitText(idx); // clean up the tag's string and put tag element instead

      replacedNode.nodeValue = replacedNode.nodeValue.replace(tagString, '');
      textnode.parentNode.insertBefore(wrapperElm, replacedNode);
    }

    this.state.tag = null;
    return replacedNode;
  },

  /**
   * For selecting a single option (not used for multiple tags)
   * @param {Object} tagElm   Tag DOM node
   * @param {Object} tagData  Tag data
   */
  selectTag: function selectTag(tagElm, tagData) {
    this.input.set.call(this, tagData.value, true);
    setTimeout(this.setRangeAtStartEnd.bind(this));
    if (this.getLastTag()) this.replaceTag(this.getLastTag(), tagData);else this.appendTag(tagElm);
    this.value[0] = tagData;
    this.trigger('add', {
      tag: tagElm,
      data: tagData
    });
    this.update();
    return [tagElm];
  },

  /**
   * add an empty "tag" element in an editable state
   */
  addEmptyTag: function addEmptyTag() {
    var tagData = {
      value: ""
    },
        tagElm = this.createTagElem(tagData); // add the tag to the component's DOM

    this.appendTag.call(this, tagElm);
    this.value.push(tagData);
    this.update();
    this.editTag(tagElm);
  },

  /**
   * add a "tag" element to the "tags" component
   * @param {String/Array} tagsItems   [A string (single or multiple values with a delimiter), or an Array of Objects or just Array of Strings]
   * @param {Boolean}      clearInput  [flag if the input's value should be cleared after adding tags]
   * @param {Boolean}      skipInvalid [do not add, mark & remove invalid tags]
   * @return {Array} Array of DOM elements (tags)
   */
  addTags: function addTags(tagsItems, clearInput) {
    var _this9 = this;

    var skipInvalid = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.settings.skipInvalid;
    var tagElems = [],
        tagElm;

    if (!tagsItems || tagsItems.length == 0) {
      // is mode is "select" clean all tags
      if (this.settings.mode == 'select') this.removeAllTags(); // console.warn('[addTags]', 'no tags to add:', tagsItems)

      return tagElems;
    }

    tagsItems = this.normalizeTags(tagsItems); // converts Array/String/Object to an Array of Objects
    // if in edit-mode, do not continue but instead replace the tag's text

    if (this.state.editing.scope) {
      return this.replaceTag(this.state.editing.scope, tagsItems[0]);
    }

    if (this.settings.mode == 'mix') {
      this.settings.transformTag.call(this, tagsItems[0]);
      tagElm = this.createTagElem(tagsItems[0]);

      if (!this.replaceTaggedText(tagElm)) {
        this.DOM.input.appendChild(tagElm);
      }

      this.value.push(tagsItems[0]);
      this.update();
      this.trigger('add', this.extend({}, {
        tag: tagElm
      }, {
        data: tagsItems[0]
      }));
      return tagElm;
    }

    if (this.settings.mode == 'select') clearInput = false;
    this.DOM.input.removeAttribute('style');
    tagsItems.forEach(function (tagData) {
      var tagValidation,
          tagElm,
          tagElmParams = {}; // shallow-clone tagData so later modifications will not apply to the source

      tagData = Object.assign({}, tagData);

      _this9.settings.transformTag.call(_this9, tagData); ///////////////// ( validation )//////////////////////


      tagValidation = _this9.maxTagsReached() || _this9.validateTag(tagData.value);

      if (tagValidation !== true) {
        if (skipInvalid) return;
        tagElmParams["aria-invalid"] = true;
        tagElmParams["class"] = (tagData["class"] || '') + ' tagify--notAllowed';
        tagElmParams.title = tagValidation;

        _this9.markTagByValue(tagData.value);

        _this9.trigger("invalid", {
          data: tagData,
          index: _this9.value.length,
          message: tagValidation
        });
      } /////////////////////////////////////////////////////
      // add accessibility attributes


      tagElmParams.role = "tag";
      if (tagData.readonly) tagElmParams["aria-readonly"] = true; // Create tag HTML element

      tagElm = _this9.createTagElem(_this9.extend({}, tagData, tagElmParams));
      tagElems.push(tagElm); // mode-select overrides

      if (_this9.settings.mode == 'select') {
        return _this9.selectTag(tagElm, tagData);
      } // add the tag to the component's DOM


      _this9.appendTag(tagElm);

      if (tagValidation === true) {
        // update state
        _this9.value.push(tagData);

        _this9.update();

        _this9.trigger('add', {
          tag: tagElm,
          index: _this9.value.length - 1,
          data: tagData
        });
      } else if (!_this9.settings.keepInvalidTags) {
        // remove invalid tags (if "keepInvalidTags" is set to "false")
        setTimeout(function () {
          _this9.removeTag(tagElm, true);
        }, 1000);
      }

      _this9.dropdown.position.call(_this9); // reposition the dropdown because the just-added tag might cause a new-line

    });

    if (tagsItems.length && clearInput) {
      this.input.set.call(this);
    }

    this.dropdown.refilter.call(this);
    return tagElems;
  },

  /**
   * appened (validated) tag to the component's DOM scope
   */
  appendTag: function appendTag(tagElm) {
    var insertBeforeNode = this.DOM.scope.lastElementChild;
    if (insertBeforeNode === this.DOM.input) this.DOM.scope.insertBefore(tagElm, insertBeforeNode);else this.DOM.scope.appendChild(tagElm);
  },

  /**
   *
   * @param {string} html removed new lines and irrelevant spaced which might affect stlying and are better gone
   */
  minify: function minify(html) {
    return html.replace(new RegExp("\>[\r\n ]+\<", "g"), "><");
  },

  /**
   * creates a DOM tag element and injects it into the component (this.DOM.scope)
   * @param  {Object}  tagData [text value & properties for the created tag]
   * @return {Object} [DOM element]
   */
  createTagElem: function createTagElem(tagData) {
    var tagElm,
        v = this.escapeHTML(tagData.value),
        template = this.settings.templates.tag.call(this, v, tagData);
    if (this.settings.readonly) tagData.readonly = true;
    template = this.minify(template);
    tagElm = this.parseHTML(template);
    return tagElm;
  },

  /**
   * Removes a tag
   * @param  {Object|String}  tagElm          [DOM element or a String value. if undefined or null, remove last added tag]
   * @param  {Boolean}        silent          [A flag, which when turned on, does not removes any value and does not update the original input value but simply removes the tag from tagify]
   * @param  {Number}         tranDuration    [Transition duration in MS]
   */
  removeTag: function removeTag() {
    var tagElm = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.getLastTag();
    var silent = arguments.length > 1 ? arguments[1] : undefined;
    var tranDuration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 250;
    if (typeof tagElm == 'string') tagElm = this.getTagElmByValue(tagElm);
    if (!(tagElm instanceof HTMLElement)) return;
    var tagData,
        that = this,
        tagIdx = this.getNodeIndex(tagElm); // this.getTagIndexByValue(tagElm.textContent)

    if (this.settings.mode == 'select') {
      tranDuration = 0;
      this.input.set.call(this);
    }

    if (tagElm.classList.contains('tagify--notAllowed')) silent = true;

    function removeNode() {
      if (!tagElm.parentNode) return;
      tagElm.parentNode.removeChild(tagElm);

      if (!silent) {
        tagData = that.value.splice(tagIdx, 1)[0]; // remove the tag from the data object

        that.update(); // update the original input with the current value

        that.trigger('remove', {
          tag: tagElm,
          index: tagIdx,
          data: tagData
        });
        that.dropdown.refilter.call(that);
        that.dropdown.position.call(that);
      } else if (that.settings.keepInvalidTags) that.trigger('remove', {
        tag: tagElm,
        index: tagIdx
      });
    }

    function animation() {
      tagElm.style.width = parseFloat(window.getComputedStyle(tagElm).width) + 'px';
      document.body.clientTop; // force repaint for the width to take affect before the "hide" class below

      tagElm.classList.add('tagify--hide'); // manual timeout (hack, since transitionend cannot be used because of hover)

      setTimeout(removeNode, 400);
    }

    if (tranDuration && tranDuration > 10) animation();else removeNode();
  },
  removeAllTags: function removeAllTags() {
    this.value = [];
    this.update();
    Array.prototype.slice.call(this.getTagElms()).forEach(function (elm) {
      return elm.parentNode.removeChild(elm);
    });
    this.dropdown.position.call(this);
  },
  getAttributes: function getAttributes(data) {
    // only items which are objects have properties which can be used as attributes
    if (Object.prototype.toString.call(data) != "[object Object]") return '';
    var keys = Object.keys(data),
        s = "",
        propName,
        i;

    for (i = keys.length; i--;) {
      propName = keys[i];
      if (propName != 'class' && data.hasOwnProperty(propName) && data[propName]) s += " " + propName + (data[propName] ? "=\"".concat(data[propName], "\"") : "");
    }

    return s;
  },
  preUpdate: function preUpdate() {
    this.DOM.scope.classList.toggle('hasMaxTags', this.value.length >= this.settings.maxTags);
  },

  /**
   * update the origianl (hidden) input field's value
   * see - https://stackoverflow.com/q/50957841/104380
   */
  update: function update() {
    this.preUpdate();
    this.DOM.originalInput.value = this.settings.mode == 'mix' ? this.getMixedTagsAsString() : this.value.length ? JSON.stringify(this.value) : "";
  },
  getMixedTagsAsString: function getMixedTagsAsString() {
    var _this10 = this;

    var result = "",
        i = 0,
        _interpolator = this.settings.mixTagsInterpolator;
    this.DOM.input.childNodes.forEach(function (node) {
      if (node.nodeType == 1 && node.classList.contains("tagify__tag")) result += _interpolator[0] + JSON.stringify(_this10.value[i++]) + _interpolator[1];else result += node.textContent;
    });
    return result;
  },

  /**
   * https://stackoverflow.com/q/5944038/104380
   * @param {DOM} node
   */
  getNodeHeight: function getNodeHeight(node) {
    var height,
        clone = node.cloneNode(true);
    clone.style.cssText = "position:fixed; top:-9999px; opacity:0";
    document.body.appendChild(clone);
    height = clone.clientHeight;
    clone.parentNode.removeChild(clone);
    return height;
  },

  /**
   * Dropdown controller
   * @type {Object}
   */
  dropdown: {
    init: function init() {
      this.DOM.dropdown = this.dropdown.build.call(this);
      this.DOM.dropdown.content = this.DOM.dropdown.querySelector('.tagify__dropdown__wrapper');
    },
    build: function build() {
      var _this$settings$dropdo = this.settings.dropdown,
          position = _this$settings$dropdo.position,
          classname = _this$settings$dropdo.classname,
          _className = "".concat(position == 'manual' ? "" : "tagify__dropdown tagify__dropdown--".concat(position), " ").concat(classname).trim(),
          elm = this.parseHTML("<div class=\"".concat(_className, "\" role=\"menu\">\n                        <div class=\"tagify__dropdown__wrapper\"></div>\n                    </div>"));

      return elm;
    },
    show: function show(value) {
      var _this11 = this;

      var listHTML,
          _s = this.settings,
          firstListItem,
          firstListItemValue,
          ddHeight,
          isManual = _s.dropdown.position == 'manual';
      if (!_s.whitelist.length) return; // if no value was supplied, show all the "whitelist" items in the dropdown
      // @type [Array] listItems
      // TODO: add a Setting to control items' sort order for "listItems"

      this.suggestedListItems = this.dropdown.filterListItems.call(this, value); // hide suggestions list if no suggestions were matched

      if (this.suggestedListItems.length) {
        firstListItem = this.suggestedListItems[0];
        firstListItemValue = firstListItem.value || firstListItem;

        if (this.settings.autoComplete) {
          // only fill the sugegstion if the value of the first list item STARTS with the input value (regardless of "fuzzysearch" setting)
          if (firstListItemValue.indexOf(value) == 0) this.input.autocomplete.suggest.call(this, firstListItemValue);
        }
      } else {
        this.input.autocomplete.suggest.call(this);
        this.dropdown.hide.call(this);
        return;
      }

      listHTML = this.dropdown.createListHTML.call(this, this.suggestedListItems);
      this.DOM.dropdown.content.innerHTML = this.minify(listHTML); // if "enforceWhitelist" is "true", highlight the first suggested item

      if (_s.enforceWhitelist && !isManual || _s.dropdown.highlightFirst) this.dropdown.highlightOption.call(this, this.DOM.dropdown.content.children[0]);
      this.DOM.scope.setAttribute("aria-expanded", true);
      this.trigger("dropdown:show", this.DOM.dropdown); // if the dropdown has yet to be appended to the document,
      // append the dropdown to the body element & handle events

      if (!document.body.contains(this.DOM.dropdown)) {
        if (!isManual) {
          this.events.binding.call(this, false); // unbind the main events
          // let the element render in the DOM first to accurately measure it
          // this.DOM.dropdown.style.cssText = "left:-9999px; top:-9999px;";

          ddHeight = this.getNodeHeight(this.DOM.dropdown);
          this.DOM.dropdown.classList.add('tagify__dropdown--initial');
          document.body.appendChild(this.DOM.dropdown);
          this.dropdown.visible = true;
          this.dropdown.position.call(this, ddHeight);
          setTimeout(function () {
            return _this11.DOM.dropdown.classList.remove('tagify__dropdown--initial');
          });
        } // timeout is needed for when pressing arrow down to show the dropdown,
        // so the key event won't get registered in the dropdown events listeners


        setTimeout(this.dropdown.events.binding.bind(this));
      }
    },
    hide: function hide(force) {
      var _this$DOM = this.DOM,
          scope = _this$DOM.scope,
          dropdown = _this$DOM.dropdown,
          isManual = this.settings.dropdown.position == 'manual' && !force;
      if (!dropdown || !document.body.contains(dropdown) || isManual) return;
      window.removeEventListener('resize', this.dropdown.position);
      this.dropdown.events.binding.call(this, false); // unbind all events
      // must delay because if the dropdown is open, and the input (scope) is clicked,
      // the dropdown should be now closed, and the next click should re-open it,
      // and without this timeout, clicking to close will re-open immediately

      setTimeout(this.events.binding.bind(this), 250); // re-bind main events

      scope.setAttribute("aria-expanded", false);
      dropdown.parentNode.removeChild(dropdown);
      this.dropdown.visible = false;
      this.trigger("dropdown:hide", dropdown);
    },

    /**
     * fill data into the suggestions list (mainly used to update the list when removing tags, so they will be re-added to the list. not efficient)
     */
    refilter: function refilter() {
      this.suggestedListItems = this.dropdown.filterListItems.call(this, '');
      var listHTML = this.dropdown.createListHTML.call(this, this.suggestedListItems);
      this.DOM.dropdown.content.innerHTML = this.minify(listHTML);
    },
    position: function position(ddHeight) {
      var isBelowViewport,
          rect,
          top,
          bottom,
          left,
          width,
          ddElm = this.DOM.dropdown;
      if (!this.dropdown.visible) return;

      if (this.settings.dropdown.position == 'text') {
        rect = this.getCaretGlobalPosition();
        bottom = rect.bottom;
        top = rect.top;
        left = rect.left;
        width = 'auto';
      } else {
        rect = this.DOM.scope.getBoundingClientRect();
        top = rect.top;
        bottom = rect.bottom - 1;
        left = rect.left;
        width = rect.width + "px";
      }

      isBelowViewport = document.documentElement.clientHeight - bottom < (ddHeight || ddElm.clientHeight); // flip vertically if there is no space for the dropdown below the input

      ddElm.style.cssText = "left:" + (left + window.pageXOffset) + "px; width:" + width + ";" + (isBelowViewport ? "bottom:" + (document.documentElement.clientHeight - top - window.pageYOffset - 2) + "px;" : "top: " + (bottom + window.pageYOffset) + "px");
      ddElm.setAttribute('placement', isBelowViewport ? "top" : "bottom");
    },
    events: {
      /**
       * Events should only be binded when the dropdown is rendered and removed when isn't
       * @param  {Boolean} bindUnbind [optional. true when wanting to unbind all the events]
       */
      binding: function binding() {
        var bindUnbind = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

        // references to the ".bind()" methods must be saved so they could be unbinded later
        var _CB = this.dropdown.events.callbacks,
            _CBR = this.listeners.dropdown = this.listeners.dropdown || {
          position: this.dropdown.position.bind(this),
          onKeyDown: _CB.onKeyDown.bind(this),
          onMouseOver: _CB.onMouseOver.bind(this),
          onMouseLeave: _CB.onMouseLeave.bind(this),
          onClick: _CB.onClick.bind(this)
        },
            action = bindUnbind ? 'addEventListener' : 'removeEventListener';

        if (this.settings.dropdown.position != 'manual') {
          window[action]('resize', _CBR.position);
          window[action]('keydown', _CBR.onKeyDown);
        } //  window[action]('mousedown', _CBR.onClick);


        this.DOM.dropdown[action]('mouseover', _CBR.onMouseOver);
        this.DOM.dropdown[action]('mouseleave', _CBR.onMouseLeave);
        this.DOM.dropdown[action]('mousedown', _CBR.onClick); // add back the main "click" event because it is needed for removing/clicking already-existing tags, even if dropdown is shown

        this.DOM[this.listeners.main.click[0]][action]('click', this.listeners.main.click[1]);
      },
      callbacks: {
        onKeyDown: function onKeyDown(e) {
          // get the "active" element, and if there was none (yet) active, use first child
          var activeListElm = this.DOM.dropdown.querySelector("[class$='--active']"),
              selectedElm = activeListElm,
              newValue = "";

          switch (e.key) {
            case 'ArrowDown':
            case 'ArrowUp':
            case 'Down': // >IE11

            case 'Up':
              {
                // >IE11
                e.preventDefault();
                var dropdownItems;
                if (selectedElm) selectedElm = selectedElm[(e.key == 'ArrowUp' || e.key == 'Up' ? "previous" : "next") + "ElementSibling"]; // if no element was found, loop

                if (!selectedElm) {
                  dropdownItems = this.DOM.dropdown.content.children;
                  selectedElm = dropdownItems[e.key == 'ArrowUp' || e.key == 'Up' ? dropdownItems.length - 1 : 0];
                }

                this.dropdown.highlightOption.call(this, selectedElm, true);
                break;
              }

            case 'Escape':
            case 'Esc':
              // IE11
              this.dropdown.hide.call(this);
              break;

            case 'ArrowRight':
            case 'Tab':
              {
                e.preventDefault();

                try {
                  var value = selectedElm ? selectedElm.textContent : this.suggestedListItems[0].value;
                  this.input.autocomplete.set.call(this, value);
                } catch (err) {}

                return false;
              }

            case 'Enter':
              {
                e.preventDefault();
                this.dropdown.selectOption.call(this, activeListElm);
                break;
              }

            case 'Backspace':
              {
                if (this.settings.mode == 'mix' || this.state.editing.scope) return;

                var _value = this.input.value.trim();

                if (_value == "" || _value.charCodeAt(0) == 8203) {
                  if (this.settings.backspace === true) this.removeTag();else if (this.settings.backspace == 'edit') setTimeout(this.editTag.bind(this), 0);
                }
              }
          }
        },
        onMouseOver: function onMouseOver(e) {
          // event delegation check
          if (e.target.className.includes('__item')) this.dropdown.highlightOption.call(this, e.target);
        },
        onMouseLeave: function onMouseLeave(e) {
          // de-highlight any previously highlighted option
          this.dropdown.highlightOption.call(this);
        },
        onClick: function onClick(e) {
          if (e.button != 0 || e.target == this.DOM.dropdown) return; // allow only mouse left-clicks

          var listItemElm = e.target.closest(".tagify__dropdown__item");
          this.dropdown.selectOption.call(this, listItemElm);
        }
      }
    },
    highlightOption: function highlightOption(elm, adjustScroll) {
      var className = "tagify__dropdown__item--active",
          value; // focus casues a bug in Firefox with the placeholder been shown on the input element
      // if( this.settings.dropdown.position != 'manual' )
      //     elm.focus();

      this.DOM.dropdown.querySelectorAll("[class$='--active']").forEach(function (activeElm) {
        activeElm.classList.remove(className);
        activeElm.removeAttribute("aria-selected");
      });

      if (!elm) {
        this.input.autocomplete.suggest.call(this);
        return;
      } // this.DOM.dropdown.querySelectorAll("[class$='--active']").forEach(activeElm => activeElm.classList.remove(className));


      elm.classList.add(className);
      elm.setAttribute("aria-selected", true);
      if (adjustScroll) elm.parentNode.scrollTop = elm.clientHeight + elm.offsetTop - elm.parentNode.clientHeight; // Try to autocomplete the typed value with the currently highlighted dropdown item

      if (this.settings.autoComplete) {
        value = this.suggestedListItems[this.getNodeIndex(elm)].value || this.input.value;
        this.input.autocomplete.suggest.call(this, value);
        this.dropdown.position.call(this); // suggestions might alter the height of the tagify wrapper because of unkown suggested term length that could drop to the next line
      }
    },
    selectOption: function selectOption(elm) {
      var _this12 = this;

      if (!elm) return; // temporary set the "actions" state to indicate to the main "blur" event it shouldn't run

      this.state.actions.selectOption = true;
      setTimeout(function () {
        return _this12.state.actions.selectOption = false;
      }, 50);
      var hideDropdown = this.settings.dropdown.enabled || this.settings.dropdown.closeOnSelect,
          value = this.suggestedListItems[this.getNodeIndex(elm)] || this.input.value;
      this.trigger("dropdown:select", value);
      this.addTags([value], true); // Tagify instances should re-focus to the input element once an option was selected, to allow continuous typing

      setTimeout(function () {
        return _this12.DOM.input.focus();
      }, 60);

      if (hideDropdown) {
        this.dropdown.hide.call(this); // setTimeout(() => this.events.callbacks.onFocusBlur.call(this, {type:"blur"}), 60)
      }
    },

    /**
     * returns an HTML string of the suggestions' list items
     * @param {string} value string to filter the whitelist by
     * @return {Array} list of filtered whitelist items according to the settings provided and current value
     */
    filterListItems: function filterListItems(value) {
      var _this13 = this;

      var list = [],
          whitelist = this.settings.whitelist,
          suggestionsCount = this.settings.dropdown.maxItems || Infinity,
          whitelistItem,
          valueIsInWhitelist,
          whitelistItemValueIndex,
          searchBy,
          isDuplicate,
          i = 0;

      if (!value) {
        return whitelist.filter(function (item) {
          return !_this13.isTagDuplicate(item.value || item);
        }) // don't include tags which have already been added.
        .slice(0, suggestionsCount); // respect "maxItems" dropdown setting
      }

      for (; i < whitelist.length; i++) {
        whitelistItem = whitelist[i] instanceof Object ? whitelist[i] : {
          value: whitelist[i]
        }; //normalize value as an Object

        searchBy = ((whitelistItem.searchBy || '') + ' ' + whitelistItem.value).toLowerCase();
        whitelistItemValueIndex = searchBy.indexOf(value.toLowerCase());
        valueIsInWhitelist = this.settings.dropdown.fuzzySearch ? whitelistItemValueIndex >= 0 : whitelistItemValueIndex == 0;
        isDuplicate = !this.settings.duplicates && this.isTagDuplicate(whitelistItem.value); // match for the value within each "whitelist" item

        if (valueIsInWhitelist && !isDuplicate && suggestionsCount--) list.push(whitelistItem);
        if (suggestionsCount == 0) break;
      }

      return list;
    },

    /**
     * Creates the dropdown items' HTML
     * @param  {Array} list  [Array of Objects]
     * @return {String}
     */
    createListHTML: function createListHTML(list) {
      var getItem = this.settings.templates.dropdownItem.bind(this);
      return list.map(getItem).join("");
    }
  }
};
return Tagify;
}));
