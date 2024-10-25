/*
Tagify v4.31.4 - tags input component
By: Yair Even-Or <vsync.design@gmail.com>
https://github.com/yairEO/tagify

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

This Software may not be rebranded and sold as a library under any other name
other than "Tagify" (by owner) or as part of another library.
*/

(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
   typeof define === 'function' && define.amd ? define(factory) :
   (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Tagify = factory());
})(this, (function () { 'use strict';

   var ZERO_WIDTH_CHAR = "​";
   var ZERO_WIDTH_UNICODE_CHAR = "&#8203;";

   function _array_like_to_array$4(arr, len) {
       if (len == null || len > arr.length) len = arr.length;
       for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
       return arr2;
   }
   function _array_without_holes$3(arr) {
       if (Array.isArray(arr)) return _array_like_to_array$4(arr);
   }
   function _instanceof$4(left, right) {
       if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
           return !!right[Symbol.hasInstance](left);
       } else {
           return left instanceof right;
       }
   }
   function _iterable_to_array$3(iter) {
       if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
   }
   function _non_iterable_spread$3() {
       throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
   }
   function _to_consumable_array$3(arr) {
       return _array_without_holes$3(arr) || _iterable_to_array$3(arr) || _unsupported_iterable_to_array$4(arr) || _non_iterable_spread$3();
   }
   function _unsupported_iterable_to_array$4(o, minLen) {
       if (!o) return;
       if (typeof o === "string") return _array_like_to_array$4(o, minLen);
       var n = Object.prototype.toString.call(o).slice(8, -1);
       if (n === "Object" && o.constructor) n = o.constructor.name;
       if (n === "Map" || n === "Set") return Array.from(n);
       if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$4(o, minLen);
   }
   var logger = {
       isEnabled: function isEnabled() {
           var _window_TAGIFY_DEBUG;
           return (_window_TAGIFY_DEBUG = window.TAGIFY_DEBUG) !== null && _window_TAGIFY_DEBUG !== void 0 ? _window_TAGIFY_DEBUG : true;
       },
       log: function log() {
           for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
               args[_key] = arguments[_key];
           }
           var _console;
           this.isEnabled() && (_console = console).log.apply(_console, [
               "[Tagify]:"
           ].concat(_to_consumable_array$3(args)));
       },
       warn: function warn() {
           for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
               args[_key] = arguments[_key];
           }
           var _console;
           this.isEnabled() && (_console = console).warn.apply(_console, [
               "[Tagify]:"
           ].concat(_to_consumable_array$3(args)));
       }
   };
   // console.json = console.json || function(argument){
   //     for(var arg=0; arg < arguments.length; ++arg)
   //         console.log(  JSON.stringify(arguments[arg], null, 4)  )
   // }
   // const isEdge = /Edge/.test(navigator.userAgent)
   var sameStr = function(s1, s2, caseSensitive, trim) {
       // cast to String
       s1 = "" + s1;
       s2 = "" + s2;
       if (trim) {
           s1 = s1.trim();
           s2 = s2.trim();
       }
       return caseSensitive ? s1 == s2 : s1.toLowerCase() == s2.toLowerCase();
   };
   // const getUID = () => (new Date().getTime() + Math.floor((Math.random()*10000)+1)).toString(16)
   var removeCollectionProp = function(collection, unwantedProps) {
       return collection && Array.isArray(collection) && collection.map(function(v) {
           return omit(v, unwantedProps);
       });
   };
   function omit(obj, props) {
       var newObj = {}, p;
       for(p in obj)if (props.indexOf(p) < 0) newObj[p] = obj[p];
       return newObj;
   }
   function decode(s) {
       var el = document.createElement("div");
       return s.replace(/\&#?[0-9a-z]+;/gi, function(enc) {
           el.innerHTML = enc;
           return el.innerText;
       });
   }
   /**
    * utility method
    * https://stackoverflow.com/a/35385518/104380
    * @param  {String} s [HTML string]
    * @return {Object}   [DOM node]
    */ function parseHTML(s) {
       var parser = new DOMParser(), node = parser.parseFromString(s.trim(), "text/html");
       return node.body.firstElementChild;
   }
   /**
    * Removed new lines and irrelevant spaces which might affect layout, and are better gone
    * @param {string} s [HTML string]
    */ function minify(s) {
       return s ? s.replace(/\>[\r\n ]+\</g, "><").split(/>\s+</).join("><").trim() : "";
   }
   function removeTextChildNodes(elm) {
       var iter = document.createNodeIterator(elm, NodeFilter.SHOW_TEXT, null, false), textnode;
       // print all text nodes
       while(textnode = iter.nextNode()){
           if (!textnode.textContent.trim()) textnode.parentNode.removeChild(textnode);
       }
   }
   function getfirstTextNode(elm, action) {
       action = action || "previous";
       while(elm = elm[action + "Sibling"])if (elm.nodeType == 3) return elm;
   }
   /**
    * utility method
    * https://stackoverflow.com/a/6234804/104380
    */ function escapeHTML(s) {
       return typeof s == "string" ? s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/`|'/g, "&#039;") : s;
   }
   /**
    * Checks if an argument is a javascript Object
    */ function isObject(obj) {
       var type = Object.prototype.toString.call(obj).split(" ")[1].slice(0, -1);
       return obj === Object(obj) && type != "Array" && type != "Function" && type != "RegExp" && type != "HTMLUnknownElement";
   }
   /**
    * merge objects into a single new one
    * TEST: extend({}, {a:{foo:1}, b:[]}, {a:{bar:2}, b:[1], c:()=>{}})
    */ function extend(o, o1, o2) {
       if (!_instanceof$4(o, Object)) o = {};
       copy(o, o1);
       if (o2) copy(o, o2);
       function copy(a, b) {
           // copy o2 to o
           for(var key in b)if (b.hasOwnProperty(key)) {
               if (isObject(b[key])) {
                   if (!isObject(a[key])) a[key] = Object.assign({}, b[key]);
                   else copy(a[key], b[key]);
                   continue;
               }
               if (Array.isArray(b[key])) {
                   a[key] = Object.assign([], b[key]);
                   continue;
               }
               a[key] = b[key];
           }
       }
       return o;
   }
   /**
    * concatenates N arrays without dups.
    * If an array's item is an Object, compare by `value`
    */ function concatWithoutDups() {
       var newArr = [], existingObj = {};
       var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
       try {
           for(var _iterator = arguments[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
               var arr = _step.value;
               var _iteratorNormalCompletion1 = true, _didIteratorError1 = false, _iteratorError1 = undefined;
               try {
                   for(var _iterator1 = arr[Symbol.iterator](), _step1; !(_iteratorNormalCompletion1 = (_step1 = _iterator1.next()).done); _iteratorNormalCompletion1 = true){
                       var item = _step1.value;
                       // if current item is an object which has yet to be added to the new array
                       if (isObject(item)) {
                           if (!existingObj[item.value]) {
                               newArr.push(item);
                               existingObj[item.value] = 1;
                           }
                       } else if (!newArr.includes(item)) newArr.push(item);
                   }
               } catch (err) {
                   _didIteratorError1 = true;
                   _iteratorError1 = err;
               } finally{
                   try {
                       if (!_iteratorNormalCompletion1 && _iterator1.return != null) {
                           _iterator1.return();
                       }
                   } finally{
                       if (_didIteratorError1) {
                           throw _iteratorError1;
                       }
                   }
               }
           }
       } catch (err) {
           _didIteratorError = true;
           _iteratorError = err;
       } finally{
           try {
               if (!_iteratorNormalCompletion && _iterator.return != null) {
                   _iterator.return();
               }
           } finally{
               if (_didIteratorError) {
                   throw _iteratorError;
               }
           }
       }
       return newArr;
   }
   /**
    *  Extracted from: https://stackoverflow.com/a/37511463/104380
    * @param {String} s
    */ function unaccent(s) {
       // if not supported, do not continue.
       // developers should use a polyfill:
       // https://github.com/walling/unorm
       if (!String.prototype.normalize) return s;
       if (typeof s === "string") return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
   }
   /**
    * Meassures an element's height, which might yet have been added DOM
    * https://stackoverflow.com/q/5944038/104380
    * @param {DOM} node
    */ function getNodeHeight(node) {
       var height, clone = node.cloneNode(true);
       clone.style.cssText = "position:fixed; top:-9999px; opacity:0";
       document.body.appendChild(clone);
       height = clone.clientHeight;
       clone.parentNode.removeChild(clone);
       return height;
   }
   var isChromeAndroidBrowser = function() {
       return /(?=.*chrome)(?=.*android)/i.test(navigator.userAgent);
   };
   function getUID() {
       return ([
           1e7
       ] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function(c) {
           return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
       });
   }
   function isNodeTag(node) {
       return node && node.classList && node.classList.contains(this.settings.classNames.tag);
   }
   function isWithinNodeTag(node) {
       return node && node.closest(this.settings.classNames.tagSelector);
   }
   /**
   * Get the caret position relative to the viewport
   * https://stackoverflow.com/q/58985076/104380
   *
   * @returns {object} left, top distance in pixels
   */ function getCaretGlobalPosition() {
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
           if (node.getBoundingClientRect) return node.getBoundingClientRect();
       }
       return {
           left: -9999,
           top: -9999
       };
   }
   /**
    * Injects content (either string or node) at the current the current (or specificed) caret position
    * @param {content} string/node
    * @param {range} Object (optional, a range other than the current window selection)
    */ function injectAtCaret(content, range) {
       var selection = window.getSelection();
       range = range || selection.getRangeAt(0);
       if (typeof content == "string") content = document.createTextNode(content);
       if (range) {
           range.deleteContents();
           range.insertNode(content);
       }
       return content;
   }
   /** Setter/Getter
    * Each tag DOM node contains a custom property called "__tagifyTagData" which hosts its data
    * @param {Node}   tagElm
    * @param {Object} data
    */ function getSetTagData(tagElm, data, override) {
       if (!tagElm) {
           logger.warn("tag element doesn't exist", {
               tagElm: tagElm,
               data: data
           });
           return data;
       }
       if (data) tagElm.__tagifyTagData = override ? data : extend({}, tagElm.__tagifyTagData || {}, data);
       return tagElm.__tagifyTagData;
   }
   function placeCaretAfterNode(node) {
       if (!node || !node.parentNode) return;
       var nextSibling = node, sel = window.getSelection(), range = sel.getRangeAt(0);
       if (sel.rangeCount) {
           range.setStartAfter(nextSibling);
           range.collapse(true);
           // range.setEndBefore(nextSibling || node);
           sel.removeAllRanges();
           sel.addRange(range);
       }
   }
   /**
    * iterate all tags, checking if multiple ones are close-siblings and if so, add a zero-space width character between them,
    * which forces the caret to be rendered when the selection is between tags.
    * Also do that if the tag is the first node.
    * @param {Array} tags
    */ function fixCaretBetweenTags(tags, TagifyHasFocuse) {
       tags.forEach(function(tag) {
           if (getSetTagData(tag.previousSibling) || !tag.previousSibling) {
               var textNode = document.createTextNode(ZERO_WIDTH_CHAR);
               tag.before(textNode);
               TagifyHasFocuse && placeCaretAfterNode(textNode);
           }
       });
   }

   var DEFAULTS = {
       delimiters: ",",
       pattern: null,
       tagTextProp: "value",
       maxTags: Infinity,
       callbacks: {},
       addTagOnBlur: true,
       addTagOn: [
           "blur",
           "tab",
           "enter"
       ],
       onChangeAfterBlur: true,
       duplicates: false,
       whitelist: [],
       blacklist: [],
       enforceWhitelist: false,
       userInput: true,
       focusable: true,
       keepInvalidTags: false,
       createInvalidTags: true,
       mixTagsAllowedAfter: /,|\.|\:|\s/,
       mixTagsInterpolator: [
           "[[",
           "]]"
       ],
       backspace: true,
       skipInvalid: false,
       pasteAsTags: true,
       editTags: {
           clicks: 2,
           keepInvalid: true // keeps invalid edits as-is until `esc` is pressed while in focus
       },
       transformTag: function() {},
       trim: true,
       a11y: {
           focusableTags: false
       },
       mixMode: {
           insertAfterTag: "\xa0"
       },
       autoComplete: {
           enabled: true,
           rightKey: false,
           tabKey: false
       },
       classNames: {
           namespace: "tagify",
           mixMode: "tagify--mix",
           selectMode: "tagify--select",
           input: "tagify__input",
           focus: "tagify--focus",
           tagNoAnimation: "tagify--noAnim",
           tagInvalid: "tagify--invalid",
           tagNotAllowed: "tagify--notAllowed",
           scopeLoading: "tagify--loading",
           hasMaxTags: "tagify--hasMaxTags",
           hasNoTags: "tagify--noTags",
           empty: "tagify--empty",
           inputInvalid: "tagify__input--invalid",
           dropdown: "tagify__dropdown",
           dropdownWrapper: "tagify__dropdown__wrapper",
           dropdownHeader: "tagify__dropdown__header",
           dropdownFooter: "tagify__dropdown__footer",
           dropdownItem: "tagify__dropdown__item",
           dropdownItemActive: "tagify__dropdown__item--active",
           dropdownItemHidden: "tagify__dropdown__item--hidden",
           dropdownItemSelected: "tagify__dropdown__item--selected",
           dropdownInital: "tagify__dropdown--initial",
           tag: "tagify__tag",
           tagText: "tagify__tag-text",
           tagX: "tagify__tag__removeBtn",
           tagLoading: "tagify__tag--loading",
           tagEditing: "tagify__tag--editable",
           tagFlash: "tagify__tag--flash",
           tagHide: "tagify__tag--hide"
       },
       dropdown: {
           classname: "",
           enabled: 2,
           maxItems: 10,
           searchKeys: [
               "value",
               "searchBy"
           ],
           fuzzySearch: true,
           caseSensitive: false,
           accentedSearch: true,
           includeSelectedTags: false,
           escapeHTML: true,
           highlightFirst: true,
           closeOnSelect: true,
           clearOnSelect: true,
           position: "all",
           appendTarget: null // defaults to document.body once DOM has been loaded
       },
       hooks: {
           beforeRemoveTag: function() {
               return Promise.resolve();
           },
           beforePaste: function() {
               return Promise.resolve();
           },
           suggestionClick: function() {
               return Promise.resolve();
           },
           beforeKeyDown: function() {
               return Promise.resolve();
           }
       }
   };

   function _define_property$3(obj, key, value) {
       if (key in obj) {
           Object.defineProperty(obj, key, {
               value: value,
               enumerable: true,
               configurable: true,
               writable: true
           });
       } else {
           obj[key] = value;
       }
       return obj;
   }
   function _instanceof$3(left, right) {
       if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
           return !!right[Symbol.hasInstance](left);
       } else {
           return left instanceof right;
       }
   }
   function _object_spread$3(target) {
       for(var i = 1; i < arguments.length; i++){
           var source = arguments[i] != null ? arguments[i] : {};
           var ownKeys = Object.keys(source);
           if (typeof Object.getOwnPropertySymbols === "function") {
               ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                   return Object.getOwnPropertyDescriptor(source, sym).enumerable;
               }));
           }
           ownKeys.forEach(function(key) {
               _define_property$3(target, key, source[key]);
           });
       }
       return target;
   }
   function ownKeys$2(object, enumerableOnly) {
       var keys = Object.keys(object);
       if (Object.getOwnPropertySymbols) {
           var symbols = Object.getOwnPropertySymbols(object);
           if (enumerableOnly) {
               symbols = symbols.filter(function(sym) {
                   return Object.getOwnPropertyDescriptor(object, sym).enumerable;
               });
           }
           keys.push.apply(keys, symbols);
       }
       return keys;
   }
   function _object_spread_props$2(target, source) {
       source = source != null ? source : {};
       if (Object.getOwnPropertyDescriptors) {
           Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
       } else {
           ownKeys$2(Object(source)).forEach(function(key) {
               Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
           });
       }
       return target;
   }
   /**
    * Tagify's dropdown suggestions-related logic
    */ var suggestionsMethods = {
       events: {
           /**
            * Events should only be binded when the dropdown is rendered and removed when isn't
            * because there might be multiple Tagify instances on a certain page
            * @param  {Boolean} bindUnbind [optional. true when wanting to unbind all the events]
            */ binding: function binding() {
               var bindUnbind = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
               // references to the ".bind()" methods must be saved so they could be unbinded later
               var _CB = this.dropdown.events.callbacks, // callback-refs
               _CBR = this.listeners.dropdown = this.listeners.dropdown || {
                   position: this.dropdown.position.bind(this, null),
                   onKeyDown: _CB.onKeyDown.bind(this),
                   onMouseOver: _CB.onMouseOver.bind(this),
                   onMouseLeave: _CB.onMouseLeave.bind(this),
                   onClick: _CB.onClick.bind(this),
                   onScroll: _CB.onScroll.bind(this)
               }, action = bindUnbind ? "addEventListener" : "removeEventListener";
               if (this.settings.dropdown.position != "manual") {
                   document[action]("scroll", _CBR.position, true);
                   window[action]("resize", _CBR.position);
                   window[action]("keydown", _CBR.onKeyDown);
               }
               this.DOM.dropdown[action]("mouseover", _CBR.onMouseOver);
               this.DOM.dropdown[action]("mouseleave", _CBR.onMouseLeave);
               this.DOM.dropdown[action]("mousedown", _CBR.onClick);
               this.DOM.dropdown.content[action]("scroll", _CBR.onScroll);
           },
           callbacks: {
               onKeyDown: function onKeyDown(e) {
                   var _this = this;
                   // ignore keys during IME composition
                   if (!this.state.hasFocus || this.state.composing) return;
                   // get the "active" element, and if there was none (yet) active, use first child
                   var _s = this.settings, selectedElm = this.DOM.dropdown.querySelector(_s.classNames.dropdownItemActiveSelector), selectedElmData = this.dropdown.getSuggestionDataByNode(selectedElm), isMixMode = _s.mode == "mix", isSelectMode = _s.mode == "select";
                   _s.hooks.beforeKeyDown(e, {
                       tagify: this
                   }).then(function(result) {
                       switch(e.key){
                           case "ArrowDown":
                           case "ArrowUp":
                           case "Down":
                           case "Up":
                               {
                                   e.preventDefault();
                                   var dropdownItems = _this.dropdown.getAllSuggestionsRefs(), actionUp = e.key == "ArrowUp" || e.key == "Up";
                                   if (selectedElm) {
                                       selectedElm = _this.dropdown.getNextOrPrevOption(selectedElm, !actionUp);
                                   }
                                   // if no element was found OR current item is not a "real" item, loop
                                   if (!selectedElm || !selectedElm.matches(_s.classNames.dropdownItemSelector)) {
                                       selectedElm = dropdownItems[actionUp ? dropdownItems.length - 1 : 0];
                                   }
                                   _this.dropdown.highlightOption(selectedElm, true);
                                   break;
                               }
                           case "Escape":
                           case "Esc":
                               _this.dropdown.hide();
                               break;
                           case "ArrowRight":
                               // do not continue if the left arrow key was pressed while typing, because assuming the user wants to bypass any of the below logic and edit the content without intervention.
                               // also do not procceed if a tag should be created when the setting `autoComplete.rightKey` is set to `true`
                               if (_this.state.actions.ArrowLeft || _s.autoComplete.rightKey) return;
                           case "Tab":
                               {
                                   var shouldAutocompleteOnKey = !_s.autoComplete.rightKey || !_s.autoComplete.tabKey;
                                   // in mix-mode, treat arrowRight like Enter key, so a tag will be created
                                   if (!isMixMode && !isSelectMode && selectedElm && shouldAutocompleteOnKey && !_this.state.editing && selectedElmData) {
                                       e.preventDefault() // prevents blur so the autocomplete suggestion will not become a tag
                                       ;
                                       var value = _this.dropdown.getMappedValue(selectedElmData);
                                       _this.input.autocomplete.set.call(_this, value);
                                       return false;
                                   }
                                   return true;
                               }
                           case "Enter":
                               {
                                   e.preventDefault();
                                   _s.hooks.suggestionClick(e, {
                                       tagify: _this,
                                       tagData: selectedElmData,
                                       suggestionElm: selectedElm
                                   }).then(function() {
                                       if (selectedElm) {
                                           _this.dropdown.selectOption(selectedElm);
                                           // highlight next option
                                           selectedElm = _this.dropdown.getNextOrPrevOption(selectedElm, !actionUp);
                                           _this.dropdown.highlightOption(selectedElm);
                                           return;
                                       } else _this.dropdown.hide();
                                       if (!isMixMode) _this.addTags(_this.state.inputText.trim(), true);
                                   }).catch(function(err) {
                                       return logger.warn(err);
                                   });
                                   break;
                               }
                           case "Backspace":
                               {
                                   if (isMixMode || _this.state.editing.scope) return;
                                   var value1 = _this.input.raw.call(_this);
                                   if (value1 == "" || value1.charCodeAt(0) == 8203) {
                                       if (_s.backspace === true) _this.removeTags();
                                       else if (_s.backspace == "edit") setTimeout(_this.editTag.bind(_this), 0);
                                   }
                               }
                       }
                   });
               },
               onMouseOver: function onMouseOver(e) {
                   var ddItem = e.target.closest(this.settings.classNames.dropdownItemSelector);
                   // event delegation check
                   this.dropdown.highlightOption(ddItem);
               },
               onMouseLeave: function onMouseLeave(e) {
                   // de-highlight any previously highlighted option
                   this.dropdown.highlightOption();
               },
               onClick: function onClick(e) {
                   var _this = this;
                   if (e.button != 0 || e.target == this.DOM.dropdown || e.target == this.DOM.dropdown.content) return; // allow only mouse left-clicks
                   var selectedElm = e.target.closest(this.settings.classNames.dropdownItemSelector), selectedElmData = this.dropdown.getSuggestionDataByNode(selectedElm);
                   // temporary set the "actions" state to indicate to the main "blur" event it shouldn't run
                   this.state.actions.selectOption = true;
                   setTimeout(function() {
                       return _this.state.actions.selectOption = false;
                   }, 50);
                   this.settings.hooks.suggestionClick(e, {
                       tagify: this,
                       tagData: selectedElmData,
                       suggestionElm: selectedElm
                   }).then(function() {
                       if (selectedElm) _this.dropdown.selectOption(selectedElm, e);
                       else _this.dropdown.hide();
                   }).catch(function(err) {
                       return logger.warn(err);
                   });
               },
               onScroll: function onScroll(e) {
                   var elm = e.target, pos = elm.scrollTop / (elm.scrollHeight - elm.parentNode.clientHeight) * 100;
                   this.trigger("dropdown:scroll", {
                       percentage: Math.round(pos)
                   });
               }
           }
       },
       /**
        * fill data into the suggestions list
        * (mainly used to update the list when removing tags while the suggestions dropdown is visible, so they will be re-added to the list. not efficient)
        */ refilter: function refilter(value) {
           value = value || this.state.dropdown.query || "";
           this.suggestedListItems = this.dropdown.filterListItems(value);
           this.dropdown.fill();
           if (!this.suggestedListItems.length) this.dropdown.hide();
           this.trigger("dropdown:updated", this.DOM.dropdown);
       },
       /**
        * Given a suggestion-item, return the data associated with it
        * @param {HTMLElement} tagElm
        * @returns Object
        */ getSuggestionDataByNode: function getSuggestionDataByNode(tagElm) {
           var item, value = tagElm && tagElm.getAttribute("value");
           for(var i = this.suggestedListItems.length; i--;){
               item = this.suggestedListItems[i];
               if (isObject(item) && item.value == value) return item;
               else if (item == value) return {
                   value: item
               };
           }
       },
       getNextOrPrevOption: function getNextOrPrevOption(selected) {
           var next = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
           var dropdownItems = this.dropdown.getAllSuggestionsRefs(), selectedIdx = dropdownItems.findIndex(function(item) {
               return item === selected;
           });
           return next ? dropdownItems[selectedIdx + 1] : dropdownItems[selectedIdx - 1];
       },
       /**
        * mark the currently active suggestion option
        * @param {Object}  elm            option DOM node
        * @param {Boolean} adjustScroll   when navigation with keyboard arrows (up/down), aut-scroll to always show the highlighted element
        */ highlightOption: function highlightOption(elm, adjustScroll) {
           var className = this.settings.classNames.dropdownItemActive, itemData;
           // focus casues a bug in Firefox with the placeholder been shown on the input element
           // if( this.settings.dropdown.position != 'manual' )
           //     elm.focus();
           if (this.state.ddItemElm) {
               this.state.ddItemElm.classList.remove(className);
               this.state.ddItemElm.removeAttribute("aria-selected");
           }
           if (!elm) {
               this.state.ddItemData = null;
               this.state.ddItemElm = null;
               this.input.autocomplete.suggest.call(this);
               return;
           }
           itemData = this.dropdown.getSuggestionDataByNode(elm);
           this.state.ddItemData = itemData;
           this.state.ddItemElm = elm;
           // this.DOM.dropdown.querySelectorAll("." + this.settings.classNames.dropdownItemActive).forEach(activeElm => activeElm.classList.remove(className));
           elm.classList.add(className);
           elm.setAttribute("aria-selected", true);
           if (adjustScroll) elm.parentNode.scrollTop = elm.clientHeight + elm.offsetTop - elm.parentNode.clientHeight;
           // Try to autocomplete the typed value with the currently highlighted dropdown item
           if (this.settings.autoComplete) {
               this.input.autocomplete.suggest.call(this, itemData);
               this.dropdown.position() // suggestions might alter the height of the tagify wrapper because of unkown suggested term length that could drop to the next line
               ;
           }
       },
       /**
        * Create a tag from the currently active suggestion option
        * @param {Object} elm  DOM node to select
        * @param {Object} event The original Click event, if available (since keyboard ENTER key also triggers this method)
        */ selectOption: function selectOption(elm, event) {
           var _this = this;
           var _s = this.settings, _s_dropdown = _s.dropdown, clearOnSelect = _s_dropdown.clearOnSelect, closeOnSelect = _s_dropdown.closeOnSelect;
           if (!elm) {
               this.addTags(this.state.inputText, true);
               closeOnSelect && this.dropdown.hide();
               return;
           }
           event = event || {};
           // if in edit-mode, do not continue but instead replace the tag's text.
           // the scenario is that "addTags" was called from a dropdown suggested option selected while editing
           var value = elm.getAttribute("value"), isNoMatch = value == "noMatch", isMixMode = _s.mode == "mix", tagData = this.suggestedListItems.find(function(item) {
               var _item_value;
               return ((_item_value = item.value) !== null && _item_value !== void 0 ? _item_value : item) == value;
           });
           // The below event must be triggered, regardless of anything else which might go wrong
           this.trigger("dropdown:select", {
               data: tagData,
               elm: elm,
               event: event
           });
           if (!tagData && !isNoMatch) {
               closeOnSelect && setTimeout(this.dropdown.hide.bind(this));
               return;
           }
           if (this.state.editing) {
               var normalizedTagData = this.normalizeTags([
                   tagData
               ])[0];
               tagData = _s.transformTag.call(this, normalizedTagData) || normalizedTagData;
               // normalizing value, because "tagData" might be a string, and therefore will not be able to extend the object
               this.onEditTagDone(null, extend({
                   __isValid: true
               }, tagData));
           } else {
               this[isMixMode ? "addMixTags" : "addTags"]([
                   tagData || this.input.raw.call(this)
               ], clearOnSelect);
           }
           if (!isMixMode && !this.DOM.input.parentNode) return;
           setTimeout(function() {
               _this.DOM.input.focus();
               _this.toggleFocusClass(true);
           });
           closeOnSelect && setTimeout(this.dropdown.hide.bind(this));
           // execute these tasks once a suggestion has been selected
           elm.addEventListener("transitionend", function() {
               _this.dropdown.fillHeaderFooter();
               setTimeout(function() {
                   elm.remove();
                   _this.dropdown.refilter();
               }, 100);
           }, {
               once: true
           });
           // hide selected suggestion
           elm.classList.add(this.settings.classNames.dropdownItemHidden);
       },
       // adds all the suggested items, including the ones which are not currently rendered,
       // unless specified otherwise (by the "onlyRendered" argument)
       selectAll: function selectAll(onlyRendered) {
           // having suggestedListItems with items messes with "normalizeTags" when wanting
           // to add all tags
           this.suggestedListItems.length = 0;
           this.dropdown.hide();
           this.dropdown.filterListItems("");
           var tagsToAdd = this.dropdown.filterListItems("");
           if (!onlyRendered) tagsToAdd = this.state.dropdown.suggestions;
           // some whitelist items might have already been added as tags so when addings all of them,
           // skip adding already-added ones, so best to use "filterListItems" method over "settings.whitelist"
           this.addTags(tagsToAdd, true);
           return this;
       },
       /**
        * returns an HTML string of the suggestions' list items
        * @param {String} value string to filter the whitelist by
        * @param {Object} options "exact" - for exact complete match
        * @return {Array} list of filtered whitelist items according to the settings provided and current value
        */ filterListItems: function filterListItems(value, options) {
           var _this, _loop = function() {
               var startsWithMatch = void 0, exactMatch = void 0;
               whitelistItem = _instanceof$3(whitelist[i], Object) ? whitelist[i] : {
                   value: whitelist[i]
               } //normalize value as an Object
               ;
               var itemWithoutSearchKeys = !Object.keys(whitelistItem).some(function(k) {
                   return searchKeys.includes(k);
               }), _searchKeys = itemWithoutSearchKeys ? [
                   "value"
               ] : searchKeys;
               if (_sd.fuzzySearch && !options.exact) {
                   searchBy = _searchKeys.reduce(function(values, k) {
                       return values + " " + (whitelistItem[k] || "");
                   }, "").toLowerCase().trim();
                   if (_sd.accentedSearch) {
                       searchBy = unaccent(searchBy);
                       niddle = unaccent(niddle);
                   }
                   startsWithMatch = searchBy.indexOf(niddle) == 0;
                   exactMatch = searchBy === niddle;
                   valueIsInWhitelist = stringHasAll(searchBy, niddle);
               } else {
                   startsWithMatch = true;
                   valueIsInWhitelist = _searchKeys.some(function(k) {
                       var v = "" + (whitelistItem[k] || "" // if key exists, cast to type String
                       );
                       if (_sd.accentedSearch) {
                           v = unaccent(v);
                           niddle = unaccent(niddle);
                       }
                       if (!_sd.caseSensitive) v = v.toLowerCase();
                       exactMatch = v === niddle;
                       return options.exact ? v === niddle : v.indexOf(niddle) == 0;
                   });
               }
               isDuplicate = !_sd.includeSelectedTags && _this.isTagDuplicate(isObject(whitelistItem) ? whitelistItem.value : whitelistItem);
               // match for the value within each "whitelist" item
               if (valueIsInWhitelist && !isDuplicate) if (exactMatch && startsWithMatch) exactMatchesList.push(whitelistItem);
               else if (_sd.sortby == "startsWith" && startsWithMatch) list.unshift(whitelistItem);
               else list.push(whitelistItem);
           };
           var _this1 = this;
           var _s = this.settings, _sd = _s.dropdown, options = options || {}, list = [], exactMatchesList = [], whitelist = _s.whitelist, suggestionsCount = _sd.maxItems >= 0 ? _sd.maxItems : Infinity, includeSelectedTags = _sd.includeSelectedTags || _s.mode == "select", searchKeys = _sd.searchKeys, whitelistItem, valueIsInWhitelist, searchBy, isDuplicate, niddle, i = 0;
           value = _s.mode == "select" && this.value.length && this.value[0][_s.tagTextProp] == value ? "" // do not filter if the tag, which is already selecetd in "select" mode, is the same as the typed text
            : value;
           if (!value || !searchKeys.length) {
               list = includeSelectedTags ? whitelist : whitelist.filter(function(item) {
                   return !_this1.isTagDuplicate(isObject(item) ? item.value : item);
               }) // don't include tags which have already been added.
               ;
               this.state.dropdown.suggestions = list;
               return list.slice(0, suggestionsCount); // respect "maxItems" dropdown setting
           }
           niddle = _sd.caseSensitive ? "" + value : ("" + value).toLowerCase();
           // checks if ALL of the words in the search query exists in the current whitelist item, regardless of their order
           function stringHasAll(s, query) {
               return query.toLowerCase().split(" ").every(function(q) {
                   return s.includes(q.toLowerCase());
               });
           }
           for(; i < whitelist.length; i++)_this = this, _loop();
           this.state.dropdown.suggestions = exactMatchesList.concat(list);
           // custom sorting function
           return typeof _sd.sortby == "function" ? _sd.sortby(exactMatchesList.concat(list), niddle) : exactMatchesList.concat(list).slice(0, suggestionsCount);
       },
       /**
        * Returns the final value of a tag data (object) with regards to the "mapValueTo" dropdown setting
        * @param {Object} tagData
        * @returns
        */ getMappedValue: function getMappedValue(tagData) {
           var mapValueTo = this.settings.dropdown.mapValueTo, value = mapValueTo ? typeof mapValueTo == "function" ? mapValueTo(tagData) : tagData[mapValueTo] || tagData.value : tagData.value;
           return value;
       },
       /**
        * Creates the dropdown items' HTML
        * @param  {Array} sugegstionsList  [Array of Objects]
        * @return {String}
        */ createListHTML: function createListHTML(sugegstionsList) {
           var _this = this;
           return extend([], sugegstionsList).map(function(suggestion, idx) {
               if (typeof suggestion == "string" || typeof suggestion == "number") suggestion = {
                   value: suggestion
               };
               var mappedValue = _this.dropdown.getMappedValue(suggestion);
               mappedValue = typeof mappedValue == "string" && _this.settings.dropdown.escapeHTML ? escapeHTML(mappedValue) : mappedValue;
               return _this.settings.templates.dropdownItem.apply(_this, [
                   _object_spread_props$2(_object_spread$3({}, suggestion), {
                       mappedValue: mappedValue
                   }),
                   _this
               ]);
           }).join("");
       }
   };

   function _array_like_to_array$3(arr, len) {
       if (len == null || len > arr.length) len = arr.length;
       for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
       return arr2;
   }
   function _array_without_holes$2(arr) {
       if (Array.isArray(arr)) return _array_like_to_array$3(arr);
   }
   function _define_property$2(obj, key, value) {
       if (key in obj) {
           Object.defineProperty(obj, key, {
               value: value,
               enumerable: true,
               configurable: true,
               writable: true
           });
       } else {
           obj[key] = value;
       }
       return obj;
   }
   function _iterable_to_array$2(iter) {
       if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
   }
   function _non_iterable_spread$2() {
       throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
   }
   function _object_spread$2(target) {
       for(var i = 1; i < arguments.length; i++){
           var source = arguments[i] != null ? arguments[i] : {};
           var ownKeys = Object.keys(source);
           if (typeof Object.getOwnPropertySymbols === "function") {
               ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                   return Object.getOwnPropertyDescriptor(source, sym).enumerable;
               }));
           }
           ownKeys.forEach(function(key) {
               _define_property$2(target, key, source[key]);
           });
       }
       return target;
   }
   function ownKeys$1(object, enumerableOnly) {
       var keys = Object.keys(object);
       if (Object.getOwnPropertySymbols) {
           var symbols = Object.getOwnPropertySymbols(object);
           if (enumerableOnly) {
               symbols = symbols.filter(function(sym) {
                   return Object.getOwnPropertyDescriptor(object, sym).enumerable;
               });
           }
           keys.push.apply(keys, symbols);
       }
       return keys;
   }
   function _object_spread_props$1(target, source) {
       source = source != null ? source : {};
       if (Object.getOwnPropertyDescriptors) {
           Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
       } else {
           ownKeys$1(Object(source)).forEach(function(key) {
               Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
           });
       }
       return target;
   }
   function _to_consumable_array$2(arr) {
       return _array_without_holes$2(arr) || _iterable_to_array$2(arr) || _unsupported_iterable_to_array$3(arr) || _non_iterable_spread$2();
   }
   function _unsupported_iterable_to_array$3(o, minLen) {
       if (!o) return;
       if (typeof o === "string") return _array_like_to_array$3(o, minLen);
       var n = Object.prototype.toString.call(o).slice(8, -1);
       if (n === "Object" && o.constructor) n = o.constructor.name;
       if (n === "Map" || n === "Set") return Array.from(n);
       if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$3(o, minLen);
   }
   function initDropdown() {
       this.dropdown = {};
       // auto-bind "this" to all the dropdown methods
       for(var p in this._dropdown)this.dropdown[p] = typeof this._dropdown[p] === "function" ? this._dropdown[p].bind(this) : this._dropdown[p];
       this.dropdown.refs();
       this.DOM.dropdown.__tagify = this;
   }
   var _dropdown = _object_spread_props$1(_object_spread$2({}, suggestionsMethods), {
       refs: function refs() {
           this.DOM.dropdown = this.parseTemplate("dropdown", [
               this.settings
           ]);
           this.DOM.dropdown.content = this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-wrapper']");
       },
       getHeaderRef: function getHeaderRef() {
           return this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-header']");
       },
       getFooterRef: function getFooterRef() {
           return this.DOM.dropdown.querySelector("[data-selector='tagify-suggestions-footer']");
       },
       getAllSuggestionsRefs: function getAllSuggestionsRefs() {
           return _to_consumable_array$2(this.DOM.dropdown.content.querySelectorAll(this.settings.classNames.dropdownItemSelector));
       },
       /**
        * shows the suggestions select box
        * @param {String} value [optional, filter the whitelist by this value]
        */ show: function show(value) {
           var _this = this;
           var _s = this.settings, firstListItem, firstListItemValue, allowNewTags = _s.mode == "mix" && !_s.enforceWhitelist, noWhitelist = !_s.whitelist || !_s.whitelist.length, noMatchListItem, isManual = _s.dropdown.position == "manual";
           // if text still exists in the input, and `show` method has no argument, then the input's text should be used
           value = value === undefined ? this.state.inputText : value;
           // ⚠️ Do not render suggestions list  if:
           // 1. there's no whitelist (can happen while async loading) AND new tags arn't allowed
           // 2. dropdown is disabled
           // 3. loader is showing (controlled outside of this code)
           if (noWhitelist && !allowNewTags && !_s.templates.dropdownItemNoMatch || _s.dropdown.enabled === false || this.state.isLoading || this.settings.readonly) return;
           clearTimeout(this.dropdownHide__bindEventsTimeout);
           // if no value was supplied, show all the "whitelist" items in the dropdown
           // @type [Array] listItems
           this.suggestedListItems = this.dropdown.filterListItems(value);
           // trigger at this exact point to let the developer the chance to manually set "this.suggestedListItems"
           if (value && !this.suggestedListItems.length) {
               this.trigger("dropdown:noMatch", value);
               if (_s.templates.dropdownItemNoMatch) noMatchListItem = _s.templates.dropdownItemNoMatch.call(this, {
                   value: value
               });
           }
           // if "dropdownItemNoMatch" was not defined, procceed regular flow.
           //
           if (!noMatchListItem) {
               // in mix-mode, if the value isn't included in the whilelist & "enforceWhitelist" setting is "false",
               // then add a custom suggestion item to the dropdown
               if (this.suggestedListItems.length) {
                   if (value && allowNewTags && !this.state.editing.scope && !sameStr(this.suggestedListItems[0].value, value)) this.suggestedListItems.unshift({
                       value: value
                   });
               } else {
                   if (value && allowNewTags && !this.state.editing.scope) {
                       this.suggestedListItems = [
                           {
                               value: value
                           }
                       ];
                   } else {
                       this.input.autocomplete.suggest.call(this);
                       this.dropdown.hide();
                       return;
                   }
               }
               firstListItem = this.suggestedListItems[0];
               firstListItemValue = "" + (isObject(firstListItem) ? firstListItem.value : firstListItem);
               if (_s.autoComplete && firstListItemValue) {
                   // only fill the sugegstion if the value of the first list item STARTS with the input value (regardless of "fuzzysearch" setting)
                   if (firstListItemValue.indexOf(value) == 0) this.input.autocomplete.suggest.call(this, firstListItem);
               }
           }
           this.dropdown.fill(noMatchListItem);
           if (_s.dropdown.highlightFirst) {
               this.dropdown.highlightOption(this.DOM.dropdown.content.querySelector(_s.classNames.dropdownItemSelector));
           }
           // bind events, exactly at this stage of the code. "dropdown.show" method is allowed to be
           // called multiple times, regardless if the dropdown is currently visible, but the events-binding
           // should only be called if the dropdown wasn't previously visible.
           if (!this.state.dropdown.visible) // timeout is needed for when pressing arrow down to show the dropdown,
           // so the key event won't get registered in the dropdown events listeners
           setTimeout(this.dropdown.events.binding.bind(this));
           // set the dropdown visible state to be the same as the searched value.
           // MUST be set *before* position() is called
           this.state.dropdown.visible = value || true;
           this.state.dropdown.query = value;
           this.setStateSelection();
           // try to positioning the dropdown (it might not yet be on the page, doesn't matter, next code handles this)
           if (!isManual) {
               // a slight delay is needed if the dropdown "position" setting is "text", and nothing was typed in the input,
               // so sadly the "getCaretGlobalPosition" method doesn't recognize the caret position without this delay
               setTimeout(function() {
                   _this.dropdown.position();
                   _this.dropdown.render();
               });
           }
           // a delay is needed because of the previous delay reason.
           // this event must be fired after the dropdown was rendered & positioned
           setTimeout(function() {
               _this.trigger("dropdown:show", _this.DOM.dropdown);
           });
       },
       /**
        * Hides the dropdown (if it's not managed manually by the developer)
        * @param {Boolean} overrideManual
        */ hide: function hide(overrideManual) {
           var _this = this;
           var _this_DOM = this.DOM, scope = _this_DOM.scope, dropdown = _this_DOM.dropdown, isManual = this.settings.dropdown.position == "manual" && !overrideManual;
           // if there's no dropdown, this means the dropdown events aren't binded
           if (!dropdown || !document.body.contains(dropdown) || isManual) return;
           window.removeEventListener("resize", this.dropdown.position);
           this.dropdown.events.binding.call(this, false) // unbind all events
           ;
           // if the dropdown is open, and the input (scope) is clicked,
           // the dropdown should be now "close", and the next click (on the scope)
           // should re-open it, and without a timeout, clicking to close will re-open immediately
           //  clearTimeout(this.dropdownHide__bindEventsTimeout)
           //  this.dropdownHide__bindEventsTimeout = setTimeout(this.events.binding.bind(this), 250)  // re-bind main events
           scope.setAttribute("aria-expanded", false);
           dropdown.parentNode.removeChild(dropdown);
           // scenario: clicking the scope to show the dropdown, clicking again to hide -> calls dropdown.hide() and then re-focuses the input
           // which casues another onFocus event, which checked "this.state.dropdown.visible" and see it as "false" and re-open the dropdown
           setTimeout(function() {
               _this.state.dropdown.visible = false;
           }, 100);
           this.state.dropdown.query = this.state.ddItemData = this.state.ddItemElm = this.state.selection = null;
           // if the user closed the dropdown (in mix-mode) while a potential tag was detected, flag the current tag
           // so the dropdown won't be shown on following user input for that "tag"
           if (this.state.tag && this.state.tag.value.length) {
               this.state.flaggedTags[this.state.tag.baseOffset] = this.state.tag;
           }
           this.trigger("dropdown:hide", dropdown);
           return this;
       },
       /**
        * Toggles dropdown show/hide
        * @param {Boolean} show forces the dropdown to show
        */ toggle: function toggle(show) {
           this.dropdown[this.state.dropdown.visible && !show ? "hide" : "show"]();
       },
       getAppendTarget: function getAppendTarget() {
           var _sd = this.settings.dropdown;
           return typeof _sd.appendTarget === "function" ? _sd.appendTarget() : _sd.appendTarget;
       },
       render: function render() {
           var _this = this;
           // let the element render in the DOM first, to accurately measure it.
           // this.DOM.dropdown.style.cssText = "left:-9999px; top:-9999px;";
           var ddHeight = getNodeHeight(this.DOM.dropdown), _s = this.settings, appendTarget = this.dropdown.getAppendTarget();
           if (_s.dropdown.enabled === false) return this;
           this.DOM.scope.setAttribute("aria-expanded", true);
           // if the dropdown has yet to be appended to the DOM,
           // append the dropdown to the body element & handle events
           if (!document.body.contains(this.DOM.dropdown)) {
               this.DOM.dropdown.classList.add(_s.classNames.dropdownInital);
               this.dropdown.position(ddHeight);
               appendTarget.appendChild(this.DOM.dropdown);
               setTimeout(function() {
                   return _this.DOM.dropdown.classList.remove(_s.classNames.dropdownInital);
               });
           }
           return this;
       },
       /**
        * re-renders the dropdown content element (see "dropdownContent" in templates file)
        * @param {String/Array} HTMLContent - optional
        */ fill: function fill(HTMLContent) {
           HTMLContent = typeof HTMLContent == "string" ? HTMLContent : this.dropdown.createListHTML(HTMLContent || this.suggestedListItems);
           var dropdownContent = this.settings.templates.dropdownContent.call(this, HTMLContent);
           this.DOM.dropdown.content.innerHTML = minify(dropdownContent);
       },
       /**
        * Re-renders only the header & footer.
        * Used when selecting a suggestion and it is wanted that the suggestions dropdown stays open.
        * Since the list of sugegstions is not being re-rendered completely every time a suggestion is selected (the item is transitioned-out)
        * then the header & footer should be kept in sync with the suggestions data change
        */ fillHeaderFooter: function fillHeaderFooter() {
           var suggestions = this.dropdown.filterListItems(this.state.dropdown.query), newHeaderElem = this.parseTemplate("dropdownHeader", [
               suggestions
           ]), newFooterElem = this.parseTemplate("dropdownFooter", [
               suggestions
           ]), headerRef = this.dropdown.getHeaderRef(), footerRef = this.dropdown.getFooterRef();
           newHeaderElem && (headerRef === null || headerRef === void 0 ? void 0 : headerRef.parentNode.replaceChild(newHeaderElem, headerRef));
           newFooterElem && (footerRef === null || footerRef === void 0 ? void 0 : footerRef.parentNode.replaceChild(newFooterElem, footerRef));
       },
       /**
        * dropdown positioning logic
        * (shown above/below or next to typed text for mix-mode)
        */ position: function position(ddHeight) {
           var _sd = this.settings.dropdown, appendTarget = this.dropdown.getAppendTarget();
           if (_sd.position == "manual" || !appendTarget) return;
           var rect, top, bottom, left, width, ancestorsOffsets, isPlacedAbove, cssTop, cssLeft, ddElm = this.DOM.dropdown, isRTL = _sd.RTL, isDefaultAppendTarget = appendTarget === document.body, isSelfAppended = appendTarget === this.DOM.scope, appendTargetScrollTop = isDefaultAppendTarget ? window.pageYOffset : appendTarget.scrollTop, root = document.fullscreenElement || document.webkitFullscreenElement || document.documentElement, viewportHeight = root.clientHeight, viewportWidth = Math.max(root.clientWidth || 0, window.innerWidth || 0), positionTo = viewportWidth > 480 ? _sd.position : "all", ddTarget = this.DOM[positionTo == "input" ? "input" : "scope"];
           ddHeight = ddHeight || ddElm.clientHeight;
           function getAncestorsOffsets(p) {
               var top = 0, left = 0;
               p = p.parentNode;
               // when in element-fullscreen mode, do not go above the fullscreened-element
               while(p && p != root){
                   top += p.offsetTop || 0;
                   left += p.offsetLeft || 0;
                   p = p.parentNode;
               }
               return {
                   top: top,
                   left: left
               };
           }
           function getAccumulatedAncestorsScrollTop() {
               var scrollTop = 0, p = _sd.appendTarget.parentNode;
               while(p){
                   scrollTop += p.scrollTop || 0;
                   p = p.parentNode;
               }
               return scrollTop;
           }
           if (!this.state.dropdown.visible) return;
           if (positionTo == "text") {
               rect = getCaretGlobalPosition();
               bottom = rect.bottom;
               top = rect.top;
               left = rect.left;
               width = "auto";
           } else {
               ancestorsOffsets = getAncestorsOffsets(appendTarget);
               rect = ddTarget.getBoundingClientRect();
               top = isSelfAppended ? -1 : rect.top - ancestorsOffsets.top;
               bottom = (isSelfAppended ? rect.height : rect.bottom - ancestorsOffsets.top) - 1;
               left = isSelfAppended ? -1 : rect.left - ancestorsOffsets.left;
               width = rect.width + "px";
           }
           // if the "append target" isn't the default, correct the `top` variable by ignoring any scrollTop of the target's Ancestors
           if (!isDefaultAppendTarget) {
               var accumulatedAncestorsScrollTop = getAccumulatedAncestorsScrollTop();
               top += accumulatedAncestorsScrollTop;
               bottom += accumulatedAncestorsScrollTop;
           }
           top = Math.floor(top);
           bottom = Math.ceil(bottom);
           var _sd_placeAbove;
           isPlacedAbove = (_sd_placeAbove = _sd.placeAbove) !== null && _sd_placeAbove !== void 0 ? _sd_placeAbove : viewportHeight - rect.bottom < ddHeight;
           // flip vertically if there is no space for the dropdown below the input
           cssTop = (isPlacedAbove ? top : bottom) + appendTargetScrollTop;
           // "pageXOffset" property is an alias for "scrollX"
           cssLeft = "left: ".concat(left + (isRTL ? rect.width || 0 : 0) + window.pageXOffset, "px;");
           // rtl = rtl ?? viewportWidth -
           ddElm.style.cssText = "".concat(cssLeft, "; top: ").concat(cssTop, "px; min-width: ").concat(width, "; max-width: ").concat(width);
           ddElm.setAttribute("placement", isPlacedAbove ? "top" : "bottom");
           ddElm.setAttribute("position", positionTo);
       }
   });

   var VERSION = 1; // current version of persisted data. if code change breaks persisted data, verison number should be bumped.
   var STORE_KEY = "@yaireo/tagify/";
   var getPersistedData = function(id) {
       return function(key) {
           var _localStorage;
           if (!id) return;
           // if "persist" is "false", do not save to localstorage
           var customKey = "/" + key, persistedData, currentStorageVersion = (_localStorage = localStorage) === null || _localStorage === void 0 ? void 0 : _localStorage.getItem(STORE_KEY + id + "/v");
           if (currentStorageVersion === VERSION) {
               try {
                   persistedData = JSON.parse(localStorage[STORE_KEY + id + customKey]);
               } catch (err) {}
           }
           return persistedData;
       };
   };
   var setPersistedData = function(id) {
       var // for storage invalidation
       _localStorage;
       if (!id) return function() {};
       (_localStorage = localStorage) === null || _localStorage === void 0 ? void 0 : _localStorage.setItem(STORE_KEY + id + "/v", VERSION);
       return function(data, key) {
           var customKey = "/" + key, persistedData = JSON.stringify(data);
           if (data && key) {
               var _localStorage;
               (_localStorage = localStorage) === null || _localStorage === void 0 ? void 0 : _localStorage.setItem(STORE_KEY + id + customKey, persistedData);
               dispatchEvent(new Event("storage"));
           }
       };
   };
   var clearPersistedData = function(id) {
       return function(key) {
           var base = STORE_KEY + "/" + id + "/";
           // delete specific key in the storage
           if (key) localStorage.removeItem(base + key);
           else {
               for(var k in localStorage)if (k.includes(base)) localStorage.removeItem(k);
           }
       };
   };

   var TEXTS = {
       empty: "empty",
       exceed: "number of tags exceeded",
       pattern: "pattern mismatch",
       duplicate: "already exists",
       notAllowed: "not allowed"
   };

   var templates = {
       /**
        *
        * @param {DOM Object} input     Original input DOm element
        * @param {Object}     settings  Tagify instance settings Object
        */ wrapper: function wrapper(input, _s) {
           return '<tags class="'.concat(_s.classNames.namespace, " ").concat(_s.mode ? "".concat(_s.classNames[_s.mode + "Mode"]) : "", " ").concat(input.className, '"\n                    ').concat(_s.readonly ? "readonly" : "", "\n                    ").concat(_s.disabled ? "disabled" : "", "\n                    ").concat(_s.required ? "required" : "", "\n                    ").concat(_s.mode === "select" ? "spellcheck='false'" : "", '\n                    tabIndex="-1">\n                    ').concat(this.settings.templates.input.call(this), "\n                ").concat(ZERO_WIDTH_UNICODE_CHAR, "\n        </tags>");
       },
       input: function input() {
           var _s = this.settings, placeholder = _s.placeholder || ZERO_WIDTH_UNICODE_CHAR;
           return "<span ".concat(!_s.readonly && _s.userInput ? "contenteditable" : "", ' tabIndex="0" data-placeholder="').concat(placeholder, '" aria-placeholder="').concat(_s.placeholder || "", '"\n                    class="').concat(_s.classNames.input, '"\n                    role="textbox"\n                    autocapitalize="false"\n                    autocorrect="off"\n                    aria-autocomplete="both"\n                    aria-multiline="').concat(_s.mode == "mix" ? true : false, '"></span>');
       },
       tag: function tag(tagData, param) {
           var _s = param.settings;
           return '<tag title="'.concat(tagData.title || tagData.value, "\"\n                    contenteditable='false'\n                    tabIndex=\"").concat(_s.a11y.focusableTags ? 0 : -1, '"\n                    class="').concat(_s.classNames.tag, " ").concat(tagData.class || "", '"\n                    ').concat(this.getAttributes(tagData), ">\n            <x title='' tabIndex=\"").concat(_s.a11y.focusableTags ? 0 : -1, '" class="').concat(_s.classNames.tagX, "\" role='button' aria-label='remove tag'></x>\n            <div>\n                <span ").concat(_s.mode === "select" && _s.userInput ? "contenteditable='true'" : "", ' autocapitalize="false" autocorrect="off" spellcheck=\'false\' class="').concat(_s.classNames.tagText, '">').concat(tagData[_s.tagTextProp] || tagData.value, "</span>\n            </div>\n        </tag>");
       },
       dropdown: function dropdown(settings) {
           var _sd = settings.dropdown, isManual = _sd.position == "manual";
           return '<div class="'.concat(isManual ? "" : settings.classNames.dropdown, " ").concat(_sd.classname, '" role="listbox" aria-labelledby="dropdown" dir="').concat(_sd.RTL ? "rtl" : "", "\">\n                    <div data-selector='tagify-suggestions-wrapper' class=\"").concat(settings.classNames.dropdownWrapper, '"></div>\n                </div>');
       },
       dropdownContent: function dropdownContent(HTMLContent) {
           var _t = this.settings.templates, suggestions = this.state.dropdown.suggestions;
           return "\n            ".concat(_t.dropdownHeader.call(this, suggestions), "\n            ").concat(HTMLContent, "\n            ").concat(_t.dropdownFooter.call(this, suggestions), "\n        ");
       },
       dropdownItem: function dropdownItem(item) {
           return "<div ".concat(this.getAttributes(item), "\n                    class='").concat(this.settings.classNames.dropdownItem, " ").concat(this.isTagDuplicate(item.value) ? this.settings.classNames.dropdownItemSelected : "", " ").concat(item.class || "", '\'\n                    tabindex="0"\n                    role="option">').concat(item.mappedValue || item.value, "</div>");
       },
       /**
        * @param {Array} suggestions An array of all the matched suggested items, including those which were sliced away due to the "dropdown.maxItems" setting
        */ dropdownHeader: function dropdownHeader(suggestions) {
           return "<header data-selector='tagify-suggestions-header' class=\"".concat(this.settings.classNames.dropdownHeader, '"></header>');
       },
       dropdownFooter: function dropdownFooter(suggestions) {
           var hasMore = suggestions.length - this.settings.dropdown.maxItems;
           return hasMore > 0 ? "<footer data-selector='tagify-suggestions-footer' class=\"".concat(this.settings.classNames.dropdownFooter, '">\n                ').concat(hasMore, " more items. Refine your search.\n            </footer>") : "";
       },
       dropdownItemNoMatch: null
   };

   function _array_like_to_array$2(arr, len) {
       if (len == null || len > arr.length) len = arr.length;
       for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
       return arr2;
   }
   function _array_with_holes(arr) {
       if (Array.isArray(arr)) return arr;
   }
   function _instanceof$2(left, right) {
       if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
           return !!right[Symbol.hasInstance](left);
       } else {
           return left instanceof right;
       }
   }
   function _iterable_to_array_limit(arr, i) {
       var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
       if (_i == null) return;
       var _arr = [];
       var _n = true;
       var _d = false;
       var _s, _e;
       try {
           for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
               _arr.push(_s.value);
               if (i && _arr.length === i) break;
           }
       } catch (err) {
           _d = true;
           _e = err;
       } finally{
           try {
               if (!_n && _i["return"] != null) _i["return"]();
           } finally{
               if (_d) throw _e;
           }
       }
       return _arr;
   }
   function _non_iterable_rest() {
       throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
   }
   function _sliced_to_array(arr, i) {
       return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array$2(arr, i) || _non_iterable_rest();
   }
   function _unsupported_iterable_to_array$2(o, minLen) {
       if (!o) return;
       if (typeof o === "string") return _array_like_to_array$2(o, minLen);
       var n = Object.prototype.toString.call(o).slice(8, -1);
       if (n === "Object" && o.constructor) n = o.constructor.name;
       if (n === "Map" || n === "Set") return Array.from(n);
       if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$2(o, minLen);
   }
   function EventDispatcher(instance) {
       // Create a DOM EventTarget object
       var target = document.createTextNode(""), // keep track of all binded events & their callbacks to be able to completely remove all listeners of a speicific type
       callbacksPerType = {};
       function addRemove(op, events, cb) {
           if (cb) events.split(/\s+/g).forEach(function(ev) {
               return target[op + "EventListener"].call(target, ev, cb);
           });
       }
       // Pass EventTarget interface calls to DOM EventTarget object
       return {
           // unbinds all events
           removeAllCustomListeners: function removeAllCustomListeners() {
               Object.entries(callbacksPerType).forEach(function(param) {
                   var _param = _sliced_to_array(param, 2), ev = _param[0], cbArr = _param[1];
                   cbArr.forEach(function(cb) {
                       return addRemove("remove", ev, cb);
                   });
               });
               callbacksPerType = {};
           },
           off: function off(events, cb) {
               if (events) {
                   if (cb) addRemove("remove", events, cb);
                   else // if `cb` argument was not specified then remove all listeners for the given event(s) types
                   events.split(/\s+/g).forEach(function(ev) {
                       var _callbacksPerType_ev;
                       (_callbacksPerType_ev = callbacksPerType[ev]) === null || _callbacksPerType_ev === void 0 ? void 0 : _callbacksPerType_ev.forEach(function(cb) {
                           return addRemove("remove", ev, cb);
                       });
                       delete callbacksPerType[ev];
                   });
               }
               return this;
           },
           on: function on(events, cb) {
               if (cb && typeof cb == "function") {
                   //track events callbacks to be able to remove them altogehter
                   events.split(/\s+/g).forEach(function(ev) {
                       if (Array.isArray(callbacksPerType[ev])) callbacksPerType[ev].push(cb);
                       else callbacksPerType[ev] = [
                           cb
                       ];
                   });
                   addRemove("add", events, cb);
               }
               return this;
           },
           trigger: function trigger(eventName, data, opts) {
               var e;
               opts = opts || {
                   cloneData: true
               };
               if (!eventName) return;
               if (instance.settings.isJQueryPlugin) {
                   if (eventName == "remove") eventName = "removeTag" // issue #222
                   ;
                   jQuery(instance.DOM.originalInput).triggerHandler(eventName, [
                       data
                   ]);
               } else {
                   try {
                       var eventData = typeof data === "object" ? data : {
                           value: data
                       };
                       eventData = opts.cloneData ? extend({}, eventData) : eventData;
                       eventData.tagify = this;
                       if (data.event) eventData.event = this.cloneEvent(data.event);
                       // TODO: move the below to the "extend" function
                       if (_instanceof$2(data, Object)) {
                           for(var prop in data)if (_instanceof$2(data[prop], HTMLElement)) eventData[prop] = data[prop];
                       }
                       e = new CustomEvent(eventName, {
                           "detail": eventData
                       });
                   } catch (err) {
                       logger.warn(err);
                   }
                   target.dispatchEvent(e);
               }
           }
       };
   }

   function _array_like_to_array$1(arr, len) {
       if (len == null || len > arr.length) len = arr.length;
       for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
       return arr2;
   }
   function _array_without_holes$1(arr) {
       if (Array.isArray(arr)) return _array_like_to_array$1(arr);
   }
   function _define_property$1(obj, key, value) {
       if (key in obj) {
           Object.defineProperty(obj, key, {
               value: value,
               enumerable: true,
               configurable: true,
               writable: true
           });
       } else {
           obj[key] = value;
       }
       return obj;
   }
   function _instanceof$1(left, right) {
       if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
           return !!right[Symbol.hasInstance](left);
       } else {
           return left instanceof right;
       }
   }
   function _iterable_to_array$1(iter) {
       if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
   }
   function _non_iterable_spread$1() {
       throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
   }
   function _object_spread$1(target) {
       for(var i = 1; i < arguments.length; i++){
           var source = arguments[i] != null ? arguments[i] : {};
           var ownKeys = Object.keys(source);
           if (typeof Object.getOwnPropertySymbols === "function") {
               ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                   return Object.getOwnPropertyDescriptor(source, sym).enumerable;
               }));
           }
           ownKeys.forEach(function(key) {
               _define_property$1(target, key, source[key]);
           });
       }
       return target;
   }
   function ownKeys(object, enumerableOnly) {
       var keys = Object.keys(object);
       if (Object.getOwnPropertySymbols) {
           var symbols = Object.getOwnPropertySymbols(object);
           if (enumerableOnly) {
               symbols = symbols.filter(function(sym) {
                   return Object.getOwnPropertyDescriptor(object, sym).enumerable;
               });
           }
           keys.push.apply(keys, symbols);
       }
       return keys;
   }
   function _object_spread_props(target, source) {
       source = source != null ? source : {};
       if (Object.getOwnPropertyDescriptors) {
           Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
       } else {
           ownKeys(Object(source)).forEach(function(key) {
               Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
           });
       }
       return target;
   }
   function _to_consumable_array$1(arr) {
       return _array_without_holes$1(arr) || _iterable_to_array$1(arr) || _unsupported_iterable_to_array$1(arr) || _non_iterable_spread$1();
   }
   function _unsupported_iterable_to_array$1(o, minLen) {
       if (!o) return;
       if (typeof o === "string") return _array_like_to_array$1(o, minLen);
       var n = Object.prototype.toString.call(o).slice(8, -1);
       if (n === "Object" && o.constructor) n = o.constructor.name;
       if (n === "Map" || n === "Set") return Array.from(n);
       if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array$1(o, minLen);
   }
   function triggerChangeEvent() {
       if (this.settings.mixMode.integrated) return;
       var inputElm = this.DOM.originalInput, changed = this.state.lastOriginalValueReported !== inputElm.value, event = new CustomEvent("change", {
           bubbles: true
       }); // must use "CustomEvent" and not "Event" to support IE
       if (!changed) return;
       // must apply this BEFORE triggering the simulated event
       this.state.lastOriginalValueReported = inputElm.value;
       // React hack: https://github.com/facebook/react/issues/11488
       event.simulated = true;
       if (inputElm._valueTracker) inputElm._valueTracker.setValue(Math.random());
       inputElm.dispatchEvent(event);
       // also trigger a Tagify event
       this.trigger("change", this.state.lastOriginalValueReported);
       // React, for some reason, clears the input's value after "dispatchEvent" is fired
       inputElm.value = this.state.lastOriginalValueReported;
   }
   var events = {
       // bind custom events which were passed in the settings
       customBinding: function customBinding() {
           var _this = this;
           this.customEventsList.forEach(function(name) {
               _this.on(name, _this.settings.callbacks[name]);
           });
       },
       binding: function binding() {
           var bindUnbind = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
           var _s = this.settings, _CB = this.events.callbacks, _CBR, action = bindUnbind ? "addEventListener" : "removeEventListener";
           // do not allow the main events to be bound more than once
           if (this.state.mainEvents && bindUnbind) return;
           // set the binding state of the main events, so they will not be bound more than once
           this.state.mainEvents = bindUnbind;
           // everything inside gets executed only once-per instance
           if (bindUnbind && !this.listeners.main) {
               this.events.bindGlobal.call(this);
               if (this.settings.isJQueryPlugin) jQuery(this.DOM.originalInput).on("tagify.removeAllTags", this.removeAllTags.bind(this));
           }
           // TODO: bind bubblable "focusin" and "focusout" events on the Tagify scope itself and not the input
           // setup callback references so events could be removed later
           _CBR = this.listeners.main = this.listeners.main || {
               keydown: [
                   "input",
                   _CB.onKeydown.bind(this)
               ],
               click: [
                   "scope",
                   _CB.onClickScope.bind(this)
               ],
               dblclick: _s.mode != "select" && [
                   "scope",
                   _CB.onDoubleClickScope.bind(this)
               ],
               paste: [
                   "input",
                   _CB.onPaste.bind(this)
               ],
               drop: [
                   "input",
                   _CB.onDrop.bind(this)
               ],
               compositionstart: [
                   "input",
                   _CB.onCompositionStart.bind(this)
               ],
               compositionend: [
                   "input",
                   _CB.onCompositionEnd.bind(this)
               ]
           };
           for(var eventName in _CBR){
               _CBR[eventName] && this.DOM[_CBR[eventName][0]][action](eventName, _CBR[eventName][1]);
           }
           // observers
           var inputMutationObserver = this.listeners.main.inputMutationObserver || new MutationObserver(_CB.onInputDOMChange.bind(this));
           // cleaup just-in-case
           inputMutationObserver.disconnect();
           // observe stuff
           if (_s.mode == "mix") {
               inputMutationObserver.observe(this.DOM.input, {
                   childList: true
               });
           }
           this.events.bindOriginaInputListener.call(this);
       },
       bindOriginaInputListener: function bindOriginaInputListener(delay) {
           var DELAY = (delay || 0) + 500;
           if (!this.listeners.main) return;
           // listen to original input changes (unfortunetly this is the best way...)
           // https://stackoverflow.com/a/1949416/104380
           clearInterval(this.listeners.main.originalInputValueObserverInterval);
           this.listeners.main.originalInputValueObserverInterval = setInterval(this.events.callbacks.observeOriginalInputValue.bind(this), DELAY);
       },
       bindGlobal: function bindGlobal(unbind) {
           var _CB = this.events.callbacks, action = unbind ? "removeEventListener" : "addEventListener", e;
           if (!this.listeners || !unbind && this.listeners.global) return; // do not re-bind
           // these events are global and should never be unbinded, unless the instance is destroyed:
           this.listeners.global = this.listeners.global || [
               {
                   type: this.isIE ? "keydown" : "input",
                   target: this.DOM.input,
                   cb: _CB[this.isIE ? "onInputIE" : "onInput"].bind(this)
               },
               {
                   type: "keydown",
                   target: window,
                   cb: _CB.onWindowKeyDown.bind(this)
               },
               {
                   type: "focusin",
                   target: this.DOM.scope,
                   cb: _CB.onFocusBlur.bind(this)
               },
               {
                   type: "focusout",
                   target: this.DOM.scope,
                   cb: _CB.onFocusBlur.bind(this)
               },
               {
                   type: "click",
                   target: document,
                   cb: _CB.onClickAnywhere.bind(this),
                   useCapture: true
               }
           ];
           var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
           try {
               for(var _iterator = this.listeners.global[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                   e = _step.value;
                   e.target[action](e.type, e.cb, !!e.useCapture);
               }
           } catch (err) {
               _didIteratorError = true;
               _iteratorError = err;
           } finally{
               try {
                   if (!_iteratorNormalCompletion && _iterator.return != null) {
                       _iterator.return();
                   }
               } finally{
                   if (_didIteratorError) {
                       throw _iteratorError;
                   }
               }
           }
       },
       unbindGlobal: function unbindGlobal() {
           this.events.bindGlobal.call(this, true);
       },
       /**
        * DOM events callbacks
        */ callbacks: {
           onFocusBlur: function onFocusBlur(e) {
               var _this_value_, _this_value;
               // when focusing within a tag which is in edit-mode
               var _s = this.settings, nodeTag = isWithinNodeTag.call(this, e.target), targetIsTagNode = isNodeTag.call(this, e.target), isTargetXBtn = e.target.classList.contains(_s.classNames.tagX), isFocused = e.type == "focusin", lostFocus = e.type == "focusout";
               // when focusing within a tag which is in edit-mode, only and specifically on the text-part of the tag node
               // and not the X button or any other custom element thatmight be there
               // var tagTextNode = e.target?.closest(this.settings.classNames.tagTextSelector)
               if (nodeTag && isFocused && !targetIsTagNode && !isTargetXBtn) {
                   this.toggleFocusClass(this.state.hasFocus = +new Date());
               // only if focused within a tag's text node should the `onEditTagFocus` function be called.
               // if clicked anywhere else inside a tag, which had triggered an `focusin` event,
               // the onFocusBlur should be aborted. This part was spcifically written for `select` mode.
               // tagTextNode && this.events.callbacks.onEditTagFocus.call(this, nodeTag)
               }
               var text = e.target ? this.trim(this.DOM.input.textContent) : "", currentDisplayValue = (_this_value = this.value) === null || _this_value === void 0 ? void 0 : (_this_value_ = _this_value[0]) === null || _this_value_ === void 0 ? void 0 : _this_value_[_s.tagTextProp], ddEnabled = _s.dropdown.enabled >= 0, eventData = {
                   relatedTarget: e.relatedTarget
               }, isTargetSelectOption = this.state.actions.selectOption && (ddEnabled || !_s.dropdown.closeOnSelect), isTargetAddNewBtn = this.state.actions.addNew && ddEnabled, shouldAddTags;
               if (lostFocus) {
                   if (e.relatedTarget === this.DOM.scope) {
                       this.dropdown.hide();
                       this.DOM.input.focus();
                       return;
                   }
                   this.postUpdate();
                   _s.onChangeAfterBlur && this.triggerChangeEvent();
               }
               if (isTargetSelectOption || isTargetAddNewBtn || isTargetXBtn) return;
               // should only loose focus at this point if the event was not generated from within a tag, within the component
               if (isFocused || nodeTag) {
                   this.state.hasFocus = +new Date();
                   this.toggleFocusClass(this.state.hasFocus);
               } else {
                   this.state.hasFocus = false;
               }
               if (_s.mode == "mix") {
                   if (isFocused) {
                       this.trigger("focus", eventData);
                   } else if (lostFocus) {
                       this.trigger("blur", eventData);
                       this.loading(false);
                       this.dropdown.hide();
                       // reset state which needs reseting
                       this.state.dropdown.visible = undefined;
                       this.setStateSelection();
                   }
                   return;
               }
               if (isFocused) {
                   if (!_s.focusable) return;
                   var dropdownCanBeShown = _s.dropdown.enabled === 0 && !this.state.dropdown.visible, condition2 = !targetIsTagNode || _s.mode === "select";
                   this.toggleFocusClass(true);
                   this.trigger("focus", eventData);
                   //  e.target.classList.remove('placeholder');
                   if (dropdownCanBeShown && condition2) {
                       this.dropdown.show(this.value.length ? "" : undefined);
                   }
                   return;
               } else if (lostFocus) {
                   this.trigger("blur", eventData);
                   this.loading(false);
                   // when clicking the X button of a selected tag, it is unwanted for it to be added back
                   // again in a few more lines of code (shouldAddTags && addTags)
                   if (_s.mode == "select") {
                       if (this.value.length) {
                           var firstTagNode = this.getTagElms()[0];
                           text = this.trim(firstTagNode.textContent);
                       }
                       // if nothing has changed (same display value), do not add a tag
                       if (currentDisplayValue === text) text = "";
                   }
                   shouldAddTags = text && !this.state.actions.selectOption && _s.addTagOnBlur && _s.addTagOn.includes("blur");
                   // do not add a tag if "selectOption" action was just fired (this means a tag was just added from the dropdown)
                   shouldAddTags && this.addTags(text, true);
               }
               // when clicking a tag, do not consider this is a "blur" event
               if (!nodeTag) {
                   this.DOM.input.removeAttribute("style");
                   this.dropdown.hide();
               }
           },
           onCompositionStart: function onCompositionStart(e) {
               this.state.composing = true;
           },
           onCompositionEnd: function onCompositionEnd(e) {
               this.state.composing = false;
           },
           onWindowKeyDown: function onWindowKeyDown(e) {
               var _s = this.settings, focusedElm = document.activeElement, withinTag = isWithinNodeTag.call(this, focusedElm), isBelong = withinTag && this.DOM.scope.contains(document.activeElement), isReadyOnlyTag = isBelong && focusedElm.hasAttribute("readonly"), nextTag;
               if (!this.state.hasFocus && (!isBelong || isReadyOnlyTag)) return;
               nextTag = focusedElm.nextElementSibling;
               var targetIsRemoveBtn = e.target.classList.contains(_s.classNames.tagX);
               switch(e.key){
                   // remove tag if has focus
                   case "Backspace":
                       {
                           if (!_s.readonly && !this.state.editing) {
                               this.removeTags(focusedElm);
                               (nextTag ? nextTag : this.DOM.input).focus();
                           }
                           break;
                       }
                   case "Enter":
                       {
                           if (targetIsRemoveBtn) {
                               this.removeTags(e.target.parentNode);
                               return;
                           }
                           if (_s.a11y.focusableTags && isNodeTag.call(this, focusedElm)) setTimeout(this.editTag.bind(this), 0, focusedElm);
                           break;
                       }
                   case "ArrowDown":
                       {
                           // if( _s.mode == 'select' ) // issue #333
                           if (!this.state.dropdown.visible && _s.mode != "mix") this.dropdown.show();
                           break;
                       }
               }
           },
           onKeydown: function onKeydown(e) {
               var _this = this;
               var _s = this.settings;
               // ignore keys during IME composition or when user input is not allowed
               if (this.state.composing || !_s.userInput) return;
               if (_s.mode == "select" && _s.enforceWhitelist && this.value.length && e.key != "Tab") {
                   e.preventDefault();
               }
               var s = this.trim(e.target.textContent);
               this.trigger("keydown", {
                   event: e
               });
               _s.hooks.beforeKeyDown(e, {
                   tagify: this
               }).then(function(result) {
                   /**
                        * ONLY FOR MIX-MODE:
                        */ if (_s.mode == "mix") {
                       switch(e.key){
                           case "Left":
                           case "ArrowLeft":
                               {
                                   // when left arrow was pressed, set a flag so when the dropdown is shown, right-arrow will be ignored
                                   // because it seems likely the user wishes to use the arrows to move the caret
                                   _this.state.actions.ArrowLeft = true;
                                   break;
                               }
                           case "Delete":
                           case "Backspace":
                               {
                                   if (_this.state.editing) return;
                                   var sel = document.getSelection(), deleteKeyTagDetected = e.key == "Delete" && sel.anchorOffset == (sel.anchorNode.length || 0), prevAnchorSibling = sel.anchorNode.previousSibling, isCaretAfterTag = sel.anchorNode.nodeType == 1 || !sel.anchorOffset && prevAnchorSibling && prevAnchorSibling.nodeType == 1 && sel.anchorNode.previousSibling; decode(_this.DOM.input.innerHTML); var lastTagElems = _this.getTagElms(), isZWS = sel.anchorNode.length === 1 && sel.anchorNode.nodeValue == String.fromCharCode(8203), //  isCaretInsideTag = sel.anchorNode.parentNode('.' + _s.classNames.tag),
                                   tagBeforeCaret, tagElmToBeDeleted, firstTextNodeBeforeTag;
                                   if (_s.backspace == "edit" && isCaretAfterTag) {
                                       tagBeforeCaret = sel.anchorNode.nodeType == 1 ? null : sel.anchorNode.previousElementSibling;
                                       setTimeout(_this.editTag.bind(_this), 0, tagBeforeCaret); // timeout is needed to the last cahacrter in the edited tag won't get deleted
                                       e.preventDefault() // needed so the tag elm won't get deleted
                                       ;
                                       return;
                                   }
                                   if (isChromeAndroidBrowser() && _instanceof$1(isCaretAfterTag, Element)) {
                                       firstTextNodeBeforeTag = getfirstTextNode(isCaretAfterTag);
                                       if (!isCaretAfterTag.hasAttribute("readonly")) isCaretAfterTag.remove() // since this is Chrome, can safetly use this "new" DOM API
                                       ;
                                       // Android-Chrome wrongly hides the keyboard, and loses focus,
                                       // so this hack below is needed to regain focus at the correct place:
                                       _this.DOM.input.focus();
                                       setTimeout(function() {
                                           placeCaretAfterNode(firstTextNodeBeforeTag);
                                           _this.DOM.input.click();
                                       });
                                       return;
                                   }
                                   if (sel.anchorNode.nodeName == "BR") return;
                                   if ((deleteKeyTagDetected || isCaretAfterTag) && sel.anchorNode.nodeType == 1) if (sel.anchorOffset == 0) tagElmToBeDeleted = deleteKeyTagDetected // delete key pressed
                                    ? lastTagElems[0] : null;
                                   else tagElmToBeDeleted = lastTagElems[Math.min(lastTagElems.length, sel.anchorOffset) - 1];
                                   else if (deleteKeyTagDetected) tagElmToBeDeleted = sel.anchorNode.nextElementSibling;
                                   else if (_instanceof$1(isCaretAfterTag, Element)) tagElmToBeDeleted = isCaretAfterTag;
                                   // tagElm.hasAttribute('readonly')
                                   if (sel.anchorNode.nodeType == 3 && // node at caret location is a Text node
                                   !sel.anchorNode.nodeValue && // has some text
                                   sel.anchorNode.previousElementSibling) e.preventDefault();
                                   // if backspace not allowed, do nothing
                                   // TODO: a better way to detect if nodes were deleted is to simply check the "this.value" before & after
                                   if ((isCaretAfterTag || deleteKeyTagDetected) && !_s.backspace) {
                                       e.preventDefault();
                                       return;
                                   }
                                   if (sel.type != "Range" && !sel.anchorOffset && sel.anchorNode == _this.DOM.input && e.key != "Delete") {
                                       e.preventDefault();
                                       return;
                                   }
                                   if (sel.type != "Range" && tagElmToBeDeleted && tagElmToBeDeleted.hasAttribute("readonly")) {
                                       // allows the continuation of deletion by placing the caret on the first previous textNode.
                                       // since a few readonly-tags might be one after the other, iteration is needed:
                                       placeCaretAfterNode(getfirstTextNode(tagElmToBeDeleted));
                                       return;
                                   }
                                   if (e.key == "Delete" && isZWS && getSetTagData(sel.anchorNode.nextSibling)) {
                                       _this.removeTags(sel.anchorNode.nextSibling);
                                   }
                                   break;
                               }
                       }
                       return true;
                   }
                   var isManualDropdown = _s.dropdown.position == "manual";
                   switch(e.key){
                       case "Backspace":
                           if (_s.mode == "select" && _s.enforceWhitelist && _this.value.length) _this.removeTags();
                           else if (!_this.state.dropdown.visible || _s.dropdown.position == "manual") {
                               if (e.target.textContent == "" || s.charCodeAt(0) == 8203) {
                                   if (_s.backspace === true) _this.removeTags();
                                   else if (_s.backspace == "edit") setTimeout(_this.editTag.bind(_this), 0) // timeout reason: when edited tag gets focused and the caret is placed at the end, the last character gets deletec (because of backspace)
                                   ;
                               }
                           }
                           break;
                       case "Esc":
                       case "Escape":
                           if (_this.state.dropdown.visible) return;
                           e.target.blur();
                           break;
                       case "Down":
                       case "ArrowDown":
                           // if( _s.mode == 'select' ) // issue #333
                           if (!_this.state.dropdown.visible) _this.dropdown.show();
                           break;
                       case "ArrowRight":
                           {
                               var tagData = _this.state.inputSuggestion || _this.state.ddItemData;
                               if (tagData && _s.autoComplete.rightKey) {
                                   _this.addTags([
                                       tagData
                                   ], true);
                                   return;
                               }
                               break;
                           }
                       case "Tab":
                           {
                               var selectMode = _s.mode == "select";
                               if (s && !selectMode) e.preventDefault();
                               else return true;
                           }
                       case "Enter":
                           // manual suggestion boxes are assumed to always be visible
                           if (_this.state.dropdown.visible && !isManualDropdown) return;
                           e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                           // because the main "keydown" event is bound before the dropdown events, this will fire first and will not *yet*
                           // know if an option was just selected from the dropdown menu. If an option was selected,
                           // the dropdown events should handle adding the tag
                           setTimeout(function() {
                               if ((!_this.state.dropdown.visible || isManualDropdown) && !_this.state.actions.selectOption && _s.addTagOn.includes(e.key.toLowerCase())) _this.addTags(s, true);
                           });
                   }
               }).catch(function(err) {
                   return err;
               });
           },
           onInput: function onInput(e) {
               this.postUpdate() // toggles "tagify--empty" class
               ;
               var _s = this.settings;
               if (_s.mode == "mix") return this.events.callbacks.onMixTagsInput.call(this, e);
               var value = this.input.normalize.call(this, undefined, {
                   trim: false
               }), showSuggestions = value.length >= _s.dropdown.enabled, eventData = {
                   value: value,
                   inputElm: this.DOM.input
               }, validation = this.validateTag({
                   value: value
               });
               if (_s.mode == "select") {
                   this.toggleScopeValidation(validation);
               }
               eventData.isValid = validation;
               // for IE; since IE doesn't have an "input" event so "keyDown" is used instead to trigger the "onInput" callback,
               // and so many keys do not change the input, and for those do not continue.
               if (this.state.inputText == value) return;
               // save the value on the input's State object
               this.input.set.call(this, value, false); // update the input with the normalized value and run validations
               // this.setRangeAtStartEnd(false, this.DOM.input); // fix caret position
               // if delimiters detected, add tags
               if (value.search(_s.delimiters) != -1) {
                   if (this.addTags(value)) {
                       this.input.set.call(this); // clear the input field's value
                   }
               } else if (_s.dropdown.enabled >= 0) {
                   this.dropdown[showSuggestions ? "show" : "hide"](value);
               }
               this.trigger("input", eventData) // "input" event must be triggered at this point, before the dropdown is shown
               ;
           },
           onMixTagsInput: function onMixTagsInput(e) {
               var _this = this;
               var rangeText, match, matchedPatternCount, tag, showSuggestions, selection, _s = this.settings, lastTagsCount = this.value.length, matchFlaggedTag, matchDelimiters, tagsElems = this.getTagElms(), fragment = document.createDocumentFragment(), range = window.getSelection().getRangeAt(0), remainingTagsValues = [].map.call(tagsElems, function(node) {
                   return getSetTagData(node).value;
               });
               // Android Chrome "keydown" event argument does not report the correct "key".
               // this workaround is needed to manually call "onKeydown" method with a synthesized event object
               if (e.inputType == "deleteContentBackward" && isChromeAndroidBrowser()) {
                   this.events.callbacks.onKeydown.call(this, {
                       target: e.target,
                       key: "Backspace"
                   });
               }
               // if there's a tag as the first child of the input, always make sure it has a zero-width character before it
               // or if two tags are next to each-other, add a zero-space width character (For the caret to appear)
               fixCaretBetweenTags(this.getTagElms());
               // re-add "readonly" tags which might have been removed
               this.value.slice().forEach(function(item) {
                   if (item.readonly && !remainingTagsValues.includes(item.value)) fragment.appendChild(_this.createTagElem(item));
               });
               if (fragment.childNodes.length) {
                   range.insertNode(fragment);
                   this.setRangeAtStartEnd(false, fragment.lastChild);
               }
               // check if tags were "magically" added/removed (browser redo/undo or CTRL-A -> delete)
               if (tagsElems.length != lastTagsCount) {
                   this.value = [].map.call(this.getTagElms(), function(node) {
                       return getSetTagData(node);
                   });
                   this.update({
                       withoutChangeEvent: true
                   });
                   return;
               }
               if (this.hasMaxTags()) return true;
               if (window.getSelection) {
                   selection = window.getSelection();
                   // only detect tags if selection is inside a textNode (not somehow on already-existing tag)
                   if (selection.rangeCount > 0 && selection.anchorNode.nodeType == 3) {
                       range = selection.getRangeAt(0).cloneRange();
                       range.collapse(true);
                       range.setStart(selection.focusNode, 0);
                       rangeText = range.toString().slice(0, range.endOffset) // slice the range so everything AFTER the caret will be trimmed
                       ;
                       // split = range.toString().split(_s.mixTagsAllowedAfter)  // ["foo", "bar", "@baz"]
                       matchedPatternCount = rangeText.split(_s.pattern).length - 1;
                       match = rangeText.match(_s.pattern);
                       if (match) // tag string, example: "@aaa ccc"
                       tag = rangeText.slice(rangeText.lastIndexOf(match[match.length - 1]));
                       if (tag) {
                           this.state.actions.ArrowLeft = false // start fresh, assuming the user did not (yet) used any arrow to move the caret
                           ;
                           this.state.tag = {
                               prefix: tag.match(_s.pattern)[0],
                               value: tag.replace(_s.pattern, "")
                           };
                           this.state.tag.baseOffset = selection.baseOffset - this.state.tag.value.length;
                           matchDelimiters = this.state.tag.value.match(_s.delimiters);
                           // if a delimeter exists, add the value as tag (exluding the delimiter)
                           if (matchDelimiters) {
                               this.state.tag.value = this.state.tag.value.replace(_s.delimiters, "");
                               this.state.tag.delimiters = matchDelimiters[0];
                               this.addTags(this.state.tag.value, _s.dropdown.clearOnSelect);
                               this.dropdown.hide();
                               return;
                           }
                           showSuggestions = this.state.tag.value.length >= _s.dropdown.enabled;
                           // When writing something that might look like a tag (an email address) but isn't one - it is unwanted
                           // the suggestions dropdown be shown, so the user can close it (in any way), and while continue typing,
                           // dropdown should stay closed until another tag is typed.
                           // if( this.state.tag.value.length && this.state.dropdown.visible === false )
                           //     showSuggestions = false
                           // test for similar flagged tags to the current tag
                           try {
                               matchFlaggedTag = this.state.flaggedTags[this.state.tag.baseOffset];
                               matchFlaggedTag = matchFlaggedTag.prefix == this.state.tag.prefix && matchFlaggedTag.value[0] == this.state.tag.value[0];
                               // reset
                               if (this.state.flaggedTags[this.state.tag.baseOffset] && !this.state.tag.value) delete this.state.flaggedTags[this.state.tag.baseOffset];
                           } catch (err) {}
                           // scenario: (do not show suggestions of another matched tag, if more than one detected)
                           // (2 tags exist)                          " a@a.com and @"
                           // (second tag is removed by backspace)    " a@a.com and "
                           if (matchFlaggedTag || matchedPatternCount < this.state.mixMode.matchedPatternCount) showSuggestions = false;
                       } else {
                           this.state.flaggedTags = {};
                       }
                       this.state.mixMode.matchedPatternCount = matchedPatternCount;
                   }
               }
               // wait until the "this.value" has been updated (see "onKeydown" method for "mix-mode")
               // the dropdown must be shown only after this event has been triggered, so an implementer could
               // dynamically change the whitelist.
               setTimeout(function() {
                   _this.update({
                       withoutChangeEvent: true
                   });
                   _this.trigger("input", extend({}, _this.state.tag, {
                       textContent: _this.DOM.input.textContent
                   }));
                   if (_this.state.tag) _this.dropdown[showSuggestions ? "show" : "hide"](_this.state.tag.value);
               }, 10);
           },
           onInputIE: function onInputIE(e) {
               var _this = this;
               // for the "e.target.textContent" to be changed, the browser requires a small delay
               setTimeout(function() {
                   _this.events.callbacks.onInput.call(_this, e);
               });
           },
           observeOriginalInputValue: function observeOriginalInputValue() {
               // if, for some reason, the Tagified element is no longer in the DOM,
               // call the "destroy" method to kill all references to timeouts/intervals
               if (!this.DOM.originalInput.parentNode) this.destroy();
               // if original input value changed for some reason (for exmaple a form reset)
               if (this.DOM.originalInput.value != this.DOM.originalInput.tagifyValue) this.loadOriginalValues();
           },
           onClickAnywhere: function onClickAnywhere(e) {
               if (e.target != this.DOM.scope && !this.DOM.scope.contains(e.target)) {
                   this.toggleFocusClass(false);
                   this.state.hasFocus = false;
                   // do not hide the dropdown if a click was initiated within it and that dropdown belongs to this Tagify instance
                   if (e.target.closest(".tagify__dropdown") && e.target.closest(".tagify__dropdown").__tagify != this) this.dropdown.hide();
               }
           },
           onClickScope: function onClickScope(e) {
               var _s = this.settings, tagElm = e.target.closest("." + _s.classNames.tag), isScope = e.target === this.DOM.scope, timeDiffFocus = +new Date() - this.state.hasFocus;
               if (isScope && _s.mode != "select") {
                   // if( !this.state.hasFocus )
                   this.DOM.input.focus();
                   return;
               } else if (e.target.classList.contains(_s.classNames.tagX)) {
                   this.removeTags(e.target.parentNode);
                   return;
               } else if (tagElm && !this.state.editing) {
                   this.trigger("click", {
                       tag: tagElm,
                       index: this.getNodeIndex(tagElm),
                       data: getSetTagData(tagElm),
                       event: e
                   });
                   if (_s.editTags === 1 || _s.editTags.clicks === 1 || _s.mode == "select") this.events.callbacks.onDoubleClickScope.call(this, e);
                   return;
               } else if (e.target == this.DOM.input) {
                   if (_s.mode == "mix") {
                       // firefox won't show caret if last element is a tag (and not a textNode),
                       // so an empty textnode should be added
                       this.fixFirefoxLastTagNoCaret();
                   }
                   if (timeDiffFocus > 500 || !_s.focusable) {
                       if (this.state.dropdown.visible) this.dropdown.hide();
                       else if (_s.dropdown.enabled === 0 && _s.mode != "mix") this.dropdown.show(this.value.length ? "" : undefined);
                       return;
                   }
               }
               if (_s.mode == "select" && _s.dropdown.enabled === 0 && !this.state.dropdown.visible) {
                   this.events.callbacks.onDoubleClickScope.call(this, _object_spread_props(_object_spread$1({}, e), {
                       target: this.getTagElms()[0]
                   }));
                   !_s.userInput && this.dropdown.show();
               }
           },
           // special proccess is needed for pasted content in order to "clean" it
           onPaste: function onPaste(e) {
               var _this = this;
               e.preventDefault();
               var tagsElems, _s = this.settings, selectModeWithoutInput = _s.mode == "select" && _s.enforceWhitelist;
               if (selectModeWithoutInput || !_s.userInput) {
                   return false;
               }
               var clipboardData, pastedText;
               if (_s.readonly) return;
               // Get pasted data via clipboard API
               clipboardData = e.clipboardData || window.clipboardData;
               pastedText = clipboardData.getData("Text");
               _s.hooks.beforePaste(e, {
                   tagify: this,
                   pastedText: pastedText,
                   clipboardData: clipboardData
               }).then(function(result) {
                   if (result === undefined) result = pastedText;
                   if (result) {
                       _this.injectAtCaret(result, window.getSelection().getRangeAt(0));
                       if (_this.settings.mode == "mix") {
                           _this.events.callbacks.onMixTagsInput.call(_this, e);
                       } else if (_this.settings.pasteAsTags) {
                           tagsElems = _this.addTags(_this.state.inputText + result, true);
                       } else {
                           _this.state.inputText = result;
                           _this.dropdown.show(result);
                       }
                   }
                   _this.trigger("paste", {
                       event: e,
                       pastedText: pastedText,
                       clipboardData: clipboardData,
                       tagsElems: tagsElems
                   });
               }).catch(function(err) {
                   return err;
               });
           },
           onDrop: function onDrop(e) {
               e.preventDefault();
           },
           onEditTagInput: function onEditTagInput(editableElm, e) {
               var _obj;
               var tagElm = editableElm.closest("." + this.settings.classNames.tag), tagElmIdx = this.getNodeIndex(tagElm), tagData = getSetTagData(tagElm), textValue = this.input.normalize.call(this, editableElm), dataForChangedProp = (_obj = {}, _define_property$1(_obj, this.settings.tagTextProp, textValue), _define_property$1(_obj, "__tagId", tagData.__tagId), _obj), isValid = this.validateTag(dataForChangedProp), hasChanged = this.editTagChangeDetected(extend(tagData, dataForChangedProp));
               // if the value is same as before-editing and the tag was valid before as well, ignore the  current "isValid" result, which is false-positive
               if (!hasChanged && editableElm.originalIsValid === true) isValid = true;
               tagElm.classList.toggle(this.settings.classNames.tagInvalid, isValid !== true);
               tagData.__isValid = isValid;
               tagElm.title = isValid === true ? tagData.title || tagData.value : isValid // change the tag's title to indicate why is the tag invalid (if it's so)
               ;
               // show dropdown if typed text is equal or more than the "enabled" dropdown setting
               if (textValue.length >= this.settings.dropdown.enabled) {
                   // this check is needed apparently because doing browser "undo" will fire
                   //  "onEditTagInput" but "this.state.editing" will be "false"
                   if (this.state.editing) this.state.editing.value = textValue;
                   this.dropdown.show(textValue);
               }
               this.trigger("edit:input", {
                   tag: tagElm,
                   index: tagElmIdx,
                   data: extend({}, this.value[tagElmIdx], {
                       newValue: textValue
                   }),
                   event: e
               });
           },
           onEditTagPaste: function onEditTagPaste(tagElm, e) {
               // Get pasted data via clipboard API
               var clipboardData = e.clipboardData || window.clipboardData, pastedText = clipboardData.getData("Text");
               e.preventDefault();
               var newNode = injectAtCaret(pastedText);
               this.setRangeAtStartEnd(false, newNode);
           },
           onEditTagClick: function onEditTagClick(tagElm, e) {
               this.events.callbacks.onClickScope.call(this, e);
           },
           onEditTagFocus: function onEditTagFocus(tagElm) {
               this.state.editing = {
                   scope: tagElm,
                   input: tagElm.querySelector("[contenteditable]")
               };
           },
           onEditTagBlur: function onEditTagBlur(editableElm, e) {
               // if "relatedTarget" is the tag then do not continue as this should not be considered a "blur" event
               var isRelatedTargetNodeTag = isNodeTag.call(this, e.relatedTarget);
               // in "select-mode" when editing the tag's template to include more nodes other than the editable "span",
               // clicking those elements should not be considered a blur event
               if (this.settings.mode == "select" && isRelatedTargetNodeTag && e.relatedTarget.contains(e.target)) {
                   this.dropdown.hide();
                   return;
               }
               // if "ESC" key was pressed then the "editing" state should be `false` and if so, logic should not continue
               // because "ESC" reverts the edited tag back to how it was (replace the node) before editing
               if (!this.state.editing) return;
               if (!this.state.hasFocus) this.toggleFocusClass();
               // one scenario is when selecting a suggestion from the dropdown, when editing, and by selecting it
               // the "onEditTagDone" is called directly, already replacing the tag, so the argument "editableElm"
               // node isn't in the DOM anynmore because it has been replaced.
               if (!this.DOM.scope.contains(editableElm)) return;
               var _obj;
               var _s = this.settings, tagElm = editableElm.closest("." + _s.classNames.tag), tagData = getSetTagData(tagElm), textValue = this.input.normalize.call(this, editableElm), dataForChangedProp = (_obj = {}, _define_property$1(_obj, _s.tagTextProp, textValue), _define_property$1(_obj, "__tagId", tagData.__tagId), _obj), originalData = tagData.__originalData, hasChanged = this.editTagChangeDetected(extend(tagData, dataForChangedProp)), isValid = this.validateTag(dataForChangedProp), hasMaxTags, newTagData;
               if (!textValue) {
                   this.onEditTagDone(tagElm);
                   return;
               }
               // if nothing changed revert back to how it was before editing
               if (!hasChanged) {
                   this.onEditTagDone(tagElm, originalData);
                   return;
               }
               // need to know this because if "keepInvalidTags" setting is "true" and an invalid tag is edited as a valid one,
               // but the maximum number of tags have alreay been reached, so it should not allow saving the new valid value.
               // only if the tag was already valid before editing, ignore this check (see a few lines below)
               hasMaxTags = this.hasMaxTags();
               var _obj1;
               newTagData = extend({}, originalData, (_obj1 = {}, _define_property$1(_obj1, _s.tagTextProp, this.trim(textValue)), _define_property$1(_obj1, "__isValid", isValid), _obj1));
               // pass through optional transformer defined in settings
               _s.transformTag.call(this, newTagData, originalData);
               // MUST re-validate after tag transformation
               // only validate the "tagTextProp" because is the only thing that metters for validating an edited tag.
               // -- Scenarios: --
               // 1. max 3 tags allowd. there are 4 tags, one has invalid input and is edited to a valid one, and now should be marked as "not allowed" because limit of tags has reached
               // 2. max 3 tags allowed. there are 3 tags, one is edited, and so max-tags vaildation should be OK
               isValid = (!hasMaxTags || originalData.__isValid === true) && this.validateTag(newTagData);
               if (isValid !== true) {
                   this.trigger("invalid", {
                       data: newTagData,
                       tag: tagElm,
                       message: isValid
                   });
                   // do nothing if invalid, stay in edit-mode until corrected or reverted by presssing esc
                   if (_s.editTags.keepInvalid) return;
                   if (_s.keepInvalidTags) newTagData.__isValid = isValid;
                   else // revert back if not specified to keep
                   newTagData = originalData;
               } else if (_s.keepInvalidTags) {
                   // cleaup any previous leftovers if the tag was invalid
                   delete newTagData.title;
                   delete newTagData["aria-invalid"];
                   delete newTagData.class;
               }
               // tagElm.classList.toggle(_s.classNames.tagInvalid, true)
               this.onEditTagDone(tagElm, newTagData);
           },
           onEditTagkeydown: function onEditTagkeydown(e, tagElm) {
               // ignore keys during IME composition
               if (this.state.composing) return;
               this.trigger("edit:keydown", {
                   event: e
               });
               switch(e.key){
                   case "Esc":
                   case "Escape":
                       {
                           this.state.editing = false;
                           var hasValueToRevertTo = !!tagElm.__tagifyTagData.__originalData.value;
                           if (hasValueToRevertTo) // revert the tag to how it was before editing
                           // replace current tag with original one (pre-edited one)
                           tagElm.parentNode.replaceChild(tagElm.__tagifyTagData.__originalHTML, tagElm);
                           else tagElm.remove();
                           break;
                       }
                   case "Enter":
                   case "Tab":
                       {
                           e.preventDefault();
                           var EDITED_TAG_BLUR_DELAY = 0;
                           // a setTimeout is used so when editing (in "select" mode) while the dropdown is shown and a suggestion is highlighted
                           // and ENTER key is pressed down - the `dropdown.hide` method won't be invoked immediately and unbind the dropdown's
                           // KEYDOWN "ENTER" before it has time to call the handler and select the suggestion.
                           setTimeout(function() {
                               return e.target.blur();
                           }, EDITED_TAG_BLUR_DELAY);
                       }
               }
           },
           onDoubleClickScope: function onDoubleClickScope(e) {
               var tagElm = e.target.closest("." + this.settings.classNames.tag), tagData = getSetTagData(tagElm), _s = this.settings, isEditingTag, isReadyOnlyTag;
               if (!tagElm || tagData.editable === false) return;
               isEditingTag = tagElm.classList.contains(this.settings.classNames.tagEditing);
               isReadyOnlyTag = tagElm.hasAttribute("readonly");
               if (!_s.readonly && !isEditingTag && !isReadyOnlyTag && this.settings.editTags && _s.userInput) {
                   this.events.callbacks.onEditTagFocus.call(this, tagElm);
                   this.editTag(tagElm);
               }
               this.toggleFocusClass(true);
               if (_s.mode != "select") this.trigger("dblclick", {
                   tag: tagElm,
                   index: this.getNodeIndex(tagElm),
                   data: getSetTagData(tagElm)
               });
           },
           /**
            *
            * @param {Object} m an object representing the observed DOM changes
            */ onInputDOMChange: function onInputDOMChange(m) {
               var _this = this;
               // iterate all DOM mutation
               m.forEach(function(record) {
                   // only the ADDED nodes
                   record.addedNodes.forEach(function(addedNode) {
                       // fix chrome's placing '<div><br></div>' everytime ENTER key is pressed, and replace with just `<br'
                       if (addedNode.outerHTML == "<div><br></div>") {
                           addedNode.replaceWith(document.createElement("br"));
                       } else if (addedNode.nodeType == 1 && addedNode.querySelector(_this.settings.classNames.tagSelector)) {
                           var // unwrap the useless div
                           // chrome adds a BR at the end which should be removed
                           _addedNode;
                           var newlineText = document.createTextNode("");
                           if (addedNode.childNodes[0].nodeType == 3 && addedNode.previousSibling.nodeName != "BR") newlineText = document.createTextNode("\n");
                           (_addedNode = addedNode).replaceWith.apply(_addedNode, _to_consumable_array$1([
                               newlineText
                           ].concat(_to_consumable_array$1(_to_consumable_array$1(addedNode.childNodes).slice(0, -1)))));
                           placeCaretAfterNode(newlineText);
                       } else if (isNodeTag.call(_this, addedNode)) {
                           var _addedNode_previousSibling;
                           if (((_addedNode_previousSibling = addedNode.previousSibling) === null || _addedNode_previousSibling === void 0 ? void 0 : _addedNode_previousSibling.nodeType) == 3 && !addedNode.previousSibling.textContent) addedNode.previousSibling.remove();
                           // and it is the first node in a new line
                           if (addedNode.previousSibling && addedNode.previousSibling.nodeName == "BR") {
                               // allows placing the caret just before the tag, when the tag is the first node in that line
                               addedNode.previousSibling.replaceWith("\n" + ZERO_WIDTH_CHAR);
                               var nextNode = addedNode.nextSibling, anythingAfterNode = "";
                               while(nextNode){
                                   anythingAfterNode += nextNode.textContent;
                                   nextNode = nextNode.nextSibling;
                               }
                               // when hitting ENTER for new line just before an existing tag, but skip below logic when a tag has been addded
                               anythingAfterNode.trim() && placeCaretAfterNode(addedNode.previousSibling);
                           } else if (!addedNode.previousSibling || getSetTagData(addedNode.previousSibling)) {
                               addedNode.before(ZERO_WIDTH_CHAR);
                           }
                       }
                   });
                   record.removedNodes.forEach(function(removedNode) {
                       // when trying to delete a tag which is in a new line and there's nothing else there (caret is after the tag)
                       if (removedNode && removedNode.nodeName == "BR" && isNodeTag.call(_this, lastInputChild)) {
                           _this.removeTags(lastInputChild);
                           _this.fixFirefoxLastTagNoCaret();
                       }
                   });
               });
               // get the last child only after the above DOM modifications
               // check these scenarios:
               // 1. after a single line, press ENTER once - should add only 1 BR
               // 2. presss ENTER right before a tag
               // 3. press enter within a text node before a tag
               var lastInputChild = this.DOM.input.lastChild;
               if (lastInputChild && lastInputChild.nodeValue == "") lastInputChild.remove();
               // make sure the last element is always a BR
               if (!lastInputChild || lastInputChild.nodeName != "BR") {
                   this.DOM.input.appendChild(document.createElement("br"));
               }
           }
       }
   };

   function _array_like_to_array(arr1, len) {
       if (len == null || len > arr1.length) len = arr1.length;
       for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr1[i];
       return arr2;
   }
   function _array_without_holes(arr1) {
       if (Array.isArray(arr1)) return _array_like_to_array(arr1);
   }
   function _define_property(obj, key, value) {
       if (key in obj) {
           Object.defineProperty(obj, key, {
               value: value,
               enumerable: true,
               configurable: true,
               writable: true
           });
       } else {
           obj[key] = value;
       }
       return obj;
   }
   function _instanceof(left, right) {
       if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
           return !!right[Symbol.hasInstance](left);
       } else {
           return left instanceof right;
       }
   }
   function _iterable_to_array(iter) {
       if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
   }
   function _non_iterable_spread() {
       throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
   }
   function _object_spread(target) {
       for(var i = 1; i < arguments.length; i++){
           var source = arguments[i] != null ? arguments[i] : {};
           var ownKeys = Object.keys(source);
           if (typeof Object.getOwnPropertySymbols === "function") {
               ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                   return Object.getOwnPropertyDescriptor(source, sym).enumerable;
               }));
           }
           ownKeys.forEach(function(key) {
               _define_property(target, key, source[key]);
           });
       }
       return target;
   }
   function _to_consumable_array(arr1) {
       return _array_without_holes(arr1) || _iterable_to_array(arr1) || _unsupported_iterable_to_array(arr1) || _non_iterable_spread();
   }
   function _unsupported_iterable_to_array(o, minLen) {
       if (!o) return;
       if (typeof o === "string") return _array_like_to_array(o, minLen);
       var n = Object.prototype.toString.call(o).slice(8, -1);
       if (n === "Object" && o.constructor) n = o.constructor.name;
       if (n === "Map" || n === "Set") return Array.from(n);
       if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
   }
   /**
    * @constructor
    * @param {Object} input    DOM element
    * @param {Object} settings settings object
    */ function Tagify(input, settings) {
       if (!input) {
           logger.warn("input element not found", input);
           // return an empty mock of all methods, so the code using tagify will not break
           // because it might be calling methods even though the input element does not exist
           var mockInstance = new Proxy(this, {
               get: function get() {
                   return function() {
                       return mockInstance;
                   };
               }
           });
           return mockInstance;
       }
       if (input.__tagify) {
           logger.warn("input element is already Tagified - Same instance is returned.", input);
           return input.__tagify;
       }
       extend(this, EventDispatcher(this));
       this.isFirefox = /firefox|fxios/i.test(navigator.userAgent) && !/seamonkey/i.test(navigator.userAgent);
       this.isIE = window.document.documentMode; // https://developer.mozilla.org/en-US/docs/Web/API/Document/compatMode#Browser_compatibility
       settings = settings || {};
       this.getPersistedData = getPersistedData(settings.id);
       this.setPersistedData = setPersistedData(settings.id);
       this.clearPersistedData = clearPersistedData(settings.id);
       this.applySettings(input, settings);
       this.state = {
           inputText: "",
           editing: false,
           composing: false,
           actions: {},
           mixMode: {},
           dropdown: {},
           flaggedTags: {} // in mix-mode, when a string is detetced as potential tag, and the user has chocen to close the suggestions dropdown, keep the record of the tasg here
       };
       this.value = [] // tags' data
       ;
       // events' callbacks references will be stores here, so events could be unbinded
       this.listeners = {};
       this.DOM = {} // Store all relevant DOM elements in an Object
       ;
       this.build(input);
       initDropdown.call(this);
       this.getCSSVars();
       this.loadOriginalValues();
       this.events.customBinding.call(this);
       this.events.binding.call(this);
       input.autofocus && this.DOM.input.focus();
       input.__tagify = this;
   }
   Tagify.prototype = {
       _dropdown: _dropdown,
       placeCaretAfterNode: placeCaretAfterNode,
       getSetTagData: getSetTagData,
       helpers: {
           sameStr: sameStr,
           removeCollectionProp: removeCollectionProp,
           omit: omit,
           isObject: isObject,
           parseHTML: parseHTML,
           escapeHTML: escapeHTML,
           extend: extend,
           concatWithoutDups: concatWithoutDups,
           getUID: getUID,
           isNodeTag: isNodeTag
       },
       customEventsList: [
           "change",
           "add",
           "remove",
           "invalid",
           "input",
           "paste",
           "click",
           "keydown",
           "focus",
           "blur",
           "edit:input",
           "edit:beforeUpdate",
           "edit:updated",
           "edit:start",
           "edit:keydown",
           "dropdown:show",
           "dropdown:hide",
           "dropdown:select",
           "dropdown:updated",
           "dropdown:noMatch",
           "dropdown:scroll"
       ],
       dataProps: [
           "__isValid",
           "__removed",
           "__originalData",
           "__originalHTML",
           "__tagId"
       ],
       trim: function trim(text) {
           return this.settings.trim && text && typeof text == "string" ? text.trim() : text;
       },
       // expose this handy utility function
       parseHTML: parseHTML,
       templates: templates,
       parseTemplate: function parseTemplate(template, data) {
           template = this.settings.templates[template] || template;
           return parseHTML(template.apply(this, data));
       },
       set whitelist (arr){
           var isArray = arr && Array.isArray(arr);
           this.settings.whitelist = isArray ? arr : [];
           this.setPersistedData(isArray ? arr : [], "whitelist");
       },
       get whitelist () {
           return this.settings.whitelist;
       },
       set userInput (state){
           this.settings.userInput = !!state;
           this.setContentEditable(!!state);
       },
       get userInput () {
           return this.settings.userInput;
       },
       generateClassSelectors: function generateClassSelectors(classNames) {
           var _loop = function(name) {
               var currentName = name;
               Object.defineProperty(classNames, currentName + "Selector", {
                   get: function get() {
                       return "." + this[currentName].split(" ")[0];
                   }
               });
           };
           for(var name in classNames)_loop(name);
       },
       applySettings: function applySettings(input, settings) {
           var _settings_dropdown, _settings_dropdown1;
           DEFAULTS.templates = this.templates;
           var mixModeDefaults = {
               dropdown: {
                   position: "text"
               }
           };
           var mergedDefaults = extend({}, DEFAULTS, settings.mode == "mix" ? mixModeDefaults : {});
           var _s = this.settings = extend({}, mergedDefaults, settings);
           _s.disabled = input.hasAttribute("disabled");
           _s.readonly = _s.readonly || input.hasAttribute("readonly");
           _s.placeholder = escapeHTML(input.getAttribute("placeholder") || _s.placeholder || "");
           _s.required = input.hasAttribute("required");
           this.generateClassSelectors(_s.classNames);
           if (_s.dropdown.includeSelectedTags === undefined) _s.dropdown.includeSelectedTags = _s.duplicates;
           if (this.isIE) _s.autoComplete = false; // IE goes crazy if this isn't false
           [
               "whitelist",
               "blacklist"
           ].forEach(function(name) {
               var attrVal = input.getAttribute("data-" + name);
               if (attrVal) {
                   attrVal = attrVal.split(_s.delimiters);
                   if (_instanceof(attrVal, Array)) _s[name] = attrVal;
               }
           });
           // backward-compatibility for old version of "autoComplete" setting:
           if ("autoComplete" in settings && !isObject(settings.autoComplete)) {
               _s.autoComplete = DEFAULTS.autoComplete;
               _s.autoComplete.enabled = settings.autoComplete;
           }
           if (_s.mode == "mix") {
               _s.pattern = _s.pattern || /@/;
               _s.autoComplete.rightKey = true;
               _s.delimiters = settings.delimiters || null // default dlimiters in mix-mode must be NULL
               ;
               // needed for "filterListItems". This assumes the user might have forgotten to manually
               // define the same term in "dropdown.searchKeys" as defined in "tagTextProp" setting, so
               // by automatically adding it, tagify is "helping" out, guessing the intesntions of the developer.
               if (_s.tagTextProp && !_s.dropdown.searchKeys.includes(_s.tagTextProp)) _s.dropdown.searchKeys.push(_s.tagTextProp);
           }
           if (input.pattern) try {
               _s.pattern = new RegExp(input.pattern);
           } catch (e) {}
           // Convert the "delimiters" setting into a REGEX object
           if (_s.delimiters) {
               _s._delimiters = _s.delimiters;
               try {
                   _s.delimiters = new RegExp(this.settings.delimiters, "g");
               } catch (e) {}
           }
           if (_s.disabled) _s.userInput = false;
           this.TEXTS = _object_spread({}, TEXTS, _s.texts || {});
           // make sure the dropdown will be shown on "focus" and not only after typing something (in "select" mode)
           if (_s.mode == "select" && !((_settings_dropdown = settings.dropdown) === null || _settings_dropdown === void 0 ? void 0 : _settings_dropdown.enabled) || !_s.userInput) {
               _s.dropdown.enabled = 0;
           }
           _s.dropdown.appendTarget = ((_settings_dropdown1 = settings.dropdown) === null || _settings_dropdown1 === void 0 ? void 0 : _settings_dropdown1.appendTarget) || document.body;
           // get & merge persisted data with current data
           var persistedWhitelist = this.getPersistedData("whitelist");
           if (Array.isArray(persistedWhitelist)) this.whitelist = Array.isArray(_s.whitelist) ? concatWithoutDups(_s.whitelist, persistedWhitelist) : persistedWhitelist;
       },
       /**
        * Returns a string of HTML element attributes
        * @param {Object} data [Tag data]
        */ getAttributes: function getAttributes(data) {
           var attrs = this.getCustomAttributes(data), s = "", k;
           for(k in attrs)s += " " + k + (data[k] !== undefined ? '="'.concat(attrs[k], '"') : "");
           return s;
       },
       /**
        * Returns an object of attributes to be used for the templates
        */ getCustomAttributes: function getCustomAttributes(data) {
           // only items which are objects have properties which can be used as attributes
           if (!isObject(data)) return "";
           var output = {}, propName;
           for(propName in data){
               if (propName.slice(0, 2) != "__" && propName != "class" && data.hasOwnProperty(propName) && data[propName] !== undefined) output[propName] = escapeHTML(data[propName]);
           }
           return output;
       },
       setStateSelection: function setStateSelection() {
           var selection = window.getSelection();
           // save last selection place to be able to inject anything from outside to that specific place
           var sel = {
               anchorOffset: selection.anchorOffset,
               anchorNode: selection.anchorNode,
               range: selection.getRangeAt && selection.rangeCount && selection.getRangeAt(0)
           };
           this.state.selection = sel;
           return sel;
       },
       /**
        * Get specific CSS variables which are relevant to this script and parse them as needed.
        * The result is saved on the instance in "this.CSSVars"
        */ getCSSVars: function getCSSVars() {
           var compStyle = getComputedStyle(this.DOM.scope, null);
           var getProp = function(name) {
               return compStyle.getPropertyValue("--" + name);
           };
           function seprateUnitFromValue(a) {
               if (!a) return {};
               a = a.trim().split(" ")[0];
               var unit = a.split(/\d+/g).filter(function(n) {
                   return n;
               }).pop().trim(), value = +a.split(unit).filter(function(n) {
                   return n;
               })[0].trim();
               return {
                   value: value,
                   unit: unit
               };
           }
           this.CSSVars = {
               tagHideTransition: function(param) {
                   var value = param.value, unit = param.unit;
                   return unit == "s" ? value * 1000 : value;
               }(seprateUnitFromValue(getProp("tag-hide-transition")))
           };
       },
       /**
        * builds the HTML of this component
        * @param  {Object} input [DOM element which would be "transformed" into "Tags"]
        */ build: function build(input) {
           var DOM = this.DOM, labelWrapper = input.closest("label");
           if (this.settings.mixMode.integrated) {
               DOM.originalInput = null;
               DOM.scope = input;
               DOM.input = input;
           } else {
               DOM.originalInput = input;
               DOM.originalInput_tabIndex = input.tabIndex;
               DOM.scope = this.parseTemplate("wrapper", [
                   input,
                   this.settings
               ]);
               DOM.input = DOM.scope.querySelector(this.settings.classNames.inputSelector);
               input.parentNode.insertBefore(DOM.scope, input);
               input.tabIndex = -1; // do not allow focus or typing directly, once tagified
           }
           // fixes tagify nested inside a <label> tag from getting focus when clicked on
           if (labelWrapper) labelWrapper.setAttribute("for", "");
       },
       /**
        * revert any changes made by this component
        */ destroy: function destroy() {
           this.events.unbindGlobal.call(this);
           this.DOM.scope.parentNode.removeChild(this.DOM.scope);
           this.DOM.originalInput.tabIndex = this.DOM.originalInput_tabIndex;
           delete this.DOM.originalInput.__tagify;
           this.dropdown.hide(true);
           this.removeAllCustomListeners();
           clearTimeout(this.dropdownHide__bindEventsTimeout);
           clearInterval(this.listeners.main.originalInputValueObserverInterval);
       },
       /**
        * if the original input has any values, add them as tags
        */ loadOriginalValues: function loadOriginalValues(value) {
           var lastChild, _s = this.settings;
           // temporarily block firing the "change" event on the original input until
           // this method finish removing current value and adding a new one
           this.state.blockChangeEvent = true;
           if (value === undefined) {
               var persistedOriginalValue = this.getPersistedData("value");
               // if the field already has a field, trust its the desired
               // one to be rendered and do not use the persisted one
               if (persistedOriginalValue && !this.DOM.originalInput.value) value = persistedOriginalValue;
               else value = _s.mixMode.integrated ? this.DOM.input.textContent : this.DOM.originalInput.value;
           }
           this.removeAllTags();
           if (value) {
               if (_s.mode == "mix") {
                   this.parseMixTags(value);
                   lastChild = this.DOM.input.lastChild;
                   // fixes a Chrome bug, when the last node in `mix-mode` is a tag, the caret appears at the far-top-top, outside the field
                   if (!lastChild || lastChild.tagName != "BR") this.DOM.input.insertAdjacentHTML("beforeend", "<br>");
               } else {
                   try {
                       if (_instanceof(JSON.parse(value), Array)) value = JSON.parse(value);
                   } catch (err) {}
                   this.addTags(value, true).forEach(function(tag) {
                       return tag && tag.classList.add(_s.classNames.tagNoAnimation);
                   });
               }
           } else this.postUpdate();
           this.state.lastOriginalValueReported = _s.mixMode.integrated ? "" : this.DOM.originalInput.value;
       },
       cloneEvent: function cloneEvent(e) {
           var clonedEvent = {};
           for(var v in e)if (v != "path") clonedEvent[v] = e[v];
           return clonedEvent;
       },
       /**
        * Toogle global loading state on/off
        * Useful when fetching async whitelist while user is typing
        * @param {Boolean} isLoading
        */ loading: function loading(isLoading) {
           this.state.isLoading = isLoading;
           // IE11 doesn't support toggle with second parameter
           this.DOM.scope.classList[isLoading ? "add" : "remove"](this.settings.classNames.scopeLoading);
           return this;
       },
       /**
        * Toogle a tag loading state on/off
        * @param {Boolean} isLoading
        */ tagLoading: function tagLoading(tagElm, isLoading) {
           if (tagElm) // IE11 doesn't support toggle with second parameter
           tagElm.classList[isLoading ? "add" : "remove"](this.settings.classNames.tagLoading);
           return this;
       },
       /**
        * Toggles class on the main tagify container ("scope")
        * @param {String} className
        * @param {Boolean} force
        */ toggleClass: function toggleClass(className, force) {
           if (typeof className == "string") this.DOM.scope.classList.toggle(className, force);
       },
       toggleScopeValidation: function toggleScopeValidation(validation) {
           var isValid = validation === true || validation === undefined; // initially it is undefined
           if (!this.settings.required && validation && validation === this.TEXTS.empty) isValid = true;
           this.toggleClass(this.settings.classNames.tagInvalid, !isValid);
           this.DOM.scope.title = isValid ? "" : validation;
       },
       toggleFocusClass: function toggleFocusClass(force) {
           this.toggleClass(this.settings.classNames.focus, !!force);
       },
       /**
        * Sets the templates placeholder after initialization
        * @param {String} str
        */ setPlaceholder: function setPlaceholder(str) {
           var _this = this;
           [
               "data",
               "aria"
           ].forEach(function(p) {
               return _this.DOM.input.setAttribute("".concat(p, "-placeholder"), str);
           });
       },
       triggerChangeEvent: triggerChangeEvent,
       events: events,
       fixFirefoxLastTagNoCaret: function fixFirefoxLastTagNoCaret() {
           return; // seems to be fixed in newer version of FF, so retiring below code (for now)
       // var inputElm = this.DOM.input
       // if( this.isFirefox && inputElm.childNodes.length && inputElm.lastChild.nodeType == 1 ){
       //     inputElm.appendChild(document.createTextNode("\u200b"))
       //     this.setRangeAtStartEnd(true, inputElm)
       //     return true
       // }
       },
       /** https://stackoverflow.com/a/59156872/104380
        * @param {Boolean} start indicating where to place it (start or end of the node)
        * @param {Object}  node  DOM node to place the caret at
        */ setRangeAtStartEnd: function setRangeAtStartEnd(start, node) {
           if (!node) return;
           start = typeof start == "number" ? start : !!start;
           node = node.lastChild || node;
           var sel = document.getSelection();
           // do not force caret placement if the current selection (focus) is on another element (not this tagify instance)
           if (_instanceof(sel.focusNode, Element) && !this.DOM.input.contains(sel.focusNode)) {
               return true;
           }
           try {
               if (sel.rangeCount >= 1) {
                   [
                       "Start",
                       "End"
                   ].forEach(function(pos) {
                       return sel.getRangeAt(0)["set" + pos](node, start ? start : node.length);
                   });
               }
           } catch (err) {
               console.warn(err);
           }
       },
       insertAfterTag: function insertAfterTag(tagElm, newNode) {
           newNode = newNode || this.settings.mixMode.insertAfterTag;
           if (!tagElm || !tagElm.parentNode || !newNode) return;
           newNode = typeof newNode == "string" ? document.createTextNode(newNode) : newNode;
           tagElm.parentNode.insertBefore(newNode, tagElm.nextSibling);
           return newNode;
       },
       // compares all "__originalData" property values with the current "tagData" properties
       // and returns "true" if something changed.
       editTagChangeDetected: function editTagChangeDetected(tagData) {
           var originalData = tagData.__originalData;
           for(var prop in originalData)if (!this.dataProps.includes(prop) && tagData[prop] != originalData[prop]) return true;
           return false; // not changed
       },
       // returns the node which has the actual tag's content
       getTagTextNode: function getTagTextNode(tagElm) {
           return tagElm.querySelector(this.settings.classNames.tagTextSelector);
       },
       // sets the text of a tag
       setTagTextNode: function setTagTextNode(tagElm, HTML) {
           this.getTagTextNode(tagElm).innerHTML = escapeHTML(HTML);
       },
       /**
        * Enters a tag into "edit" mode
        * @param {Node} tagElm the tag element to edit. if nothing specified, use last last
        */ editTag: function editTag(tagElm, opts) {
           var _this = this;
           tagElm = tagElm || this.getLastTag();
           opts = opts || {};
           var _s = this.settings, editableElm = this.getTagTextNode(tagElm), tagIdx = this.getNodeIndex(tagElm), tagData = getSetTagData(tagElm), _CB = this.events.callbacks, isValid = true, isSelectMode = _s.mode == "select";
           // select mode is a bit different as clicking the tagify's content once will get into edit-mode if a value
           // is already selected, and there cannot be a dropdown already open at this point.
           !isSelectMode && this.dropdown.hide();
           if (!editableElm) {
               logger.warn("Cannot find element in Tag template: .", _s.classNames.tagTextSelector);
               return;
           }
           if (_instanceof(tagData, Object) && "editable" in tagData && !tagData.editable) return;
           // cache the original data, on the DOM node, before any modification ocurs, for possible revert
           tagData = getSetTagData(tagElm, {
               __originalData: extend({}, tagData),
               __originalHTML: tagElm.cloneNode(true)
           });
           // re-set the tagify custom-prop on the clones element (because cloning removed it)
           getSetTagData(tagData.__originalHTML, tagData.__originalData);
           editableElm.setAttribute("contenteditable", true);
           tagElm.classList.add(_s.classNames.tagEditing);
           // because "editTag" method can be called manually, make sure that "state.editing" is set correctly
           this.events.callbacks.onEditTagFocus.call(this, tagElm);
           editableElm.addEventListener("click", _CB.onEditTagClick.bind(this, tagElm));
           editableElm.addEventListener("blur", _CB.onEditTagBlur.bind(this, this.getTagTextNode(tagElm)));
           editableElm.addEventListener("input", _CB.onEditTagInput.bind(this, editableElm));
           editableElm.addEventListener("paste", _CB.onEditTagPaste.bind(this, editableElm));
           editableElm.addEventListener("keydown", function(e) {
               return _CB.onEditTagkeydown.call(_this, e, tagElm);
           });
           editableElm.addEventListener("compositionstart", _CB.onCompositionStart.bind(this));
           editableElm.addEventListener("compositionend", _CB.onCompositionEnd.bind(this));
           if (!opts.skipValidation) isValid = this.editTagToggleValidity(tagElm);
           editableElm.originalIsValid = isValid;
           this.trigger("edit:start", {
               tag: tagElm,
               index: tagIdx,
               data: tagData,
               isValid: isValid
           });
           editableElm.focus();
           !isSelectMode && this.setRangeAtStartEnd(false, editableElm) // place the caret at the END of the editable tag text
           ;
           _s.dropdown.enabled === 0 && !isSelectMode && this.dropdown.show();
           this.state.hasFocus = true;
           return this;
       },
       /**
        * If a tag is invalid, for any reason, set its class to "not allowed" (see defaults file)
        * @param {Node} tagElm required
        * @param {Object} tagData optional
        * @returns true if valid, a string (reason) if not
        */ editTagToggleValidity: function editTagToggleValidity(tagElm, tagData) {
           var tagData = tagData || getSetTagData(tagElm), isValid;
           if (!tagData) {
               logger.warn("tag has no data: ", tagElm, tagData);
               return;
           }
           isValid = !("__isValid" in tagData) || tagData.__isValid === true;
           if (!isValid) {
               this.removeTagsFromValue(tagElm);
           }
           this.update();
           //this.validateTag(tagData);
           tagElm.classList.toggle(this.settings.classNames.tagNotAllowed, !isValid);
           tagData.__isValid = isValid;
           return tagData.__isValid;
       },
       onEditTagDone: function onEditTagDone(tagElm, tagData) {
           tagElm = tagElm || this.state.editing.scope;
           tagData = tagData || {};
           var eventData = {
               tag: tagElm,
               index: this.getNodeIndex(tagElm),
               previousData: getSetTagData(tagElm),
               data: tagData
           };
           var _s = this.settings;
           this.trigger("edit:beforeUpdate", eventData, {
               cloneData: false
           });
           this.state.editing = false;
           delete tagData.__originalData;
           delete tagData.__originalHTML;
           // some scenarrios like in the one in the demos page with textarea that has 2 whitelists, one of the whitelist might be
           // an array of objects with a property defined the same as the `tagTextProp` setting (if used) but another whitelist
           // might be simpler - just an array of primitives.
           function veryfyTagTextProp() {
               var tagTextProp = tagData[_s.tagTextProp];
               // 'tagTextProp' might also be the number 0 so checking for `undefined` here:
               if (tagTextProp !== undefined) {
                   var _tagTextProp_trim;
                   tagTextProp += ""; // cast possible number into a string
                   return !!((_tagTextProp_trim = tagTextProp.trim) === null || _tagTextProp_trim === void 0 ? void 0 : _tagTextProp_trim.call(tagTextProp));
               }
               if (!(_s.tagTextProp in tagData)) return !!tagData.value;
           }
           if (tagElm && veryfyTagTextProp()) {
               tagElm = this.replaceTag(tagElm, tagData);
               this.editTagToggleValidity(tagElm, tagData);
               if (_s.a11y.focusableTags) tagElm.focus();
               else if (_s.mode != "select") // place caret after edited tag
               placeCaretAfterNode(tagElm);
           } else if (tagElm) this.removeTags(tagElm);
           this.trigger("edit:updated", eventData);
           this.dropdown.hide();
           // check if any of the current tags which might have been marked as "duplicate" should be now un-marked
           if (this.settings.keepInvalidTags) this.reCheckInvalidTags();
       },
       /**
        * Replaces an exisitng tag with a new one. Used for updating a tag's data
        * @param {Object} tagElm  [DOM node to replace]
        * @param {Object} tagData [data to create new tag from]
        */ replaceTag: function replaceTag(tagElm, tagData) {
           if (!tagData || tagData.value === "" || tagData.value === undefined) tagData = tagElm.__tagifyTagData;
           // if tag is invalid, make the according changes in the newly created element
           if (tagData.__isValid && tagData.__isValid != true) extend(tagData, this.getInvalidTagAttrs(tagData, tagData.__isValid));
           var newTagElm = this.createTagElem(tagData);
           // update DOM
           tagElm.parentNode.replaceChild(newTagElm, tagElm);
           this.updateValueByDOMTags();
           return newTagElm;
       },
       /**
        * update "value" (Array of Objects) by traversing all valid tags
        */ updateValueByDOMTags: function updateValueByDOMTags() {
           var _this = this;
           this.value.length = 0;
           var clsNames = this.settings.classNames, tagNotAllowedClassName = clsNames.tagNotAllowed.split(" ")[0], skipNodesWithClassNames = [
               tagNotAllowedClassName,
               clsNames.tagHide
           ];
           [].forEach.call(this.getTagElms(), function(node) {
               if (_to_consumable_array(node.classList).some(function(cls) {
                   return skipNodesWithClassNames.includes(cls);
               })) return;
               _this.value.push(getSetTagData(node));
           });
           this.update();
       },
       /**
        * injects nodes/text at caret position, which is saved on the "state" when "blur" event gets triggered
        * @param {Node} injectedNode [the node to inject at the caret position]
        * @param {Object} selection [optional range Object. must have "anchorNode" & "anchorOffset"]
        */ injectAtCaret: function injectAtCaret1(injectedNode, range) {
           var _this_state_selection;
           range = range || ((_this_state_selection = this.state.selection) === null || _this_state_selection === void 0 ? void 0 : _this_state_selection.range);
           if (typeof injectedNode === "string") injectedNode = document.createTextNode(injectedNode);
           if (!range && injectedNode) {
               this.appendMixTags(injectedNode);
               return this;
           }
           var node = injectAtCaret(injectedNode, range);
           this.setRangeAtStartEnd(false, node);
           this.updateValueByDOMTags() // updates internal "this.value"
           ;
           this.update() // updates original input/textarea
           ;
           return this;
       },
       /**
        * input bridge for accessing & setting
        * @type {Object}
        */ input: {
           set: function set() {
               var value = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", updateDOM = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
               var _s = this.settings, hideDropdown = _s.dropdown.closeOnSelect;
               this.state.inputText = value;
               if (updateDOM) {
                   this.DOM.input.innerHTML = escapeHTML("" + value);
                   value && this.toggleClass(_s.classNames.empty, !this.DOM.input.innerHTML) // remove the "empty" (is exists) class only if a value was added
                   ;
               }
               if (!value && hideDropdown) this.dropdown.hide.bind(this);
               this.input.autocomplete.suggest.call(this);
               this.input.validate.call(this);
           },
           raw: function raw() {
               return this.DOM.input.textContent;
           },
           /**
            * Marks the tagify's input as "invalid" if the value did not pass "validateTag()"
            */ validate: function validate() {
               var isValid = !this.state.inputText || this.validateTag({
                   value: this.state.inputText
               }) === true;
               this.DOM.input.classList.toggle(this.settings.classNames.inputInvalid, !isValid);
               return isValid;
           },
           // remove any child DOM elements that aren't of type TEXT (like <br>)
           normalize: function normalize(node, options) {
               var clone = node || this.DOM.input, v = [];
               // when a text was pasted in FF, the "this.DOM.input" element will have <br> but no newline symbols (\n), and this will
               // result in tags not being properly created if one wishes to create a separate tag per newline.
               clone.childNodes.forEach(function(n) {
                   return n.nodeType == 3 && v.push(n.nodeValue);
               });
               v = v.join("\n");
               try {
                   // "delimiters" might be of a non-regex value, where this will fail ("Tags With Properties" example in demo page):
                   v = v.replace(/(?:\r\n|\r|\n)/g, this.settings.delimiters.source.charAt(0));
               } catch (err) {}
               v = v.replace(/\s/g, " ") // replace NBSPs with spaces characters
               ;
               return (options === null || options === void 0 ? void 0 : options.trim) ? this.trim(v) : v;
           },
           /**
            * suggest the rest of the input's value (via CSS "::after" using "content:attr(...)")
            * @param  {String} s [description]
            */ autocomplete: {
               suggest: function suggest(data) {
                   if (!this.settings.autoComplete.enabled) return;
                   data = data || {
                       value: ""
                   };
                   if (typeof data !== "object") data = {
                       value: data
                   };
                   var suggestedText = this.dropdown.getMappedValue(data);
                   if (typeof suggestedText === "number") return;
                   var inputText = this.state.inputText.toLowerCase(), suggestionStart = suggestedText.substr(0, this.state.inputText.length).toLowerCase(), suggestionTrimmed = suggestedText.substring(this.state.inputText.length);
                   if (!suggestedText || !this.state.inputText || suggestionStart != inputText) {
                       this.DOM.input.removeAttribute("data-suggest");
                       delete this.state.inputSuggestion;
                   } else {
                       this.DOM.input.setAttribute("data-suggest", suggestionTrimmed);
                       this.state.inputSuggestion = data;
                   }
               },
               /**
                * sets the suggested text as the input's value & cleanup the suggestion autocomplete.
                * @param {String} s [text]
                */ set: function set(s) {
                   var dataSuggest = this.DOM.input.getAttribute("data-suggest"), suggestion = s || (dataSuggest ? this.state.inputText + dataSuggest : null);
                   if (suggestion) {
                       if (this.settings.mode == "mix") {
                           this.replaceTextWithNode(document.createTextNode(this.state.tag.prefix + suggestion));
                       } else {
                           this.input.set.call(this, suggestion);
                           this.setRangeAtStartEnd(false, this.DOM.input);
                       }
                       this.input.autocomplete.suggest.call(this);
                       this.dropdown.hide();
                       return true;
                   }
                   return false;
               }
           }
       },
       /**
        * returns the index of the the tagData within the "this.value" array collection.
        * since values should be unique, it is suffice to only search by "value" property
        * @param {Object} tagData
        */ getTagIdx: function getTagIdx(tagData) {
           return this.value.findIndex(function(item) {
               return item.__tagId == (tagData || {}).__tagId;
           });
       },
       getNodeIndex: function getNodeIndex(node) {
           var index = 0;
           if (node) while(node = node.previousElementSibling)index++;
           return index;
       },
       getTagElms: function getTagElms() {
           for(var _len = arguments.length, classess = new Array(_len), _key = 0; _key < _len; _key++){
               classess[_key] = arguments[_key];
           }
           var classname = "." + _to_consumable_array(this.settings.classNames.tag.split(" ")).concat(_to_consumable_array(classess)).join(".");
           return [].slice.call(this.DOM.scope.querySelectorAll(classname)) // convert nodeList to Array - https://stackoverflow.com/a/3199627/104380
           ;
       },
       /**
        * gets the last non-readonly, not-in-the-proccess-of-removal tag
        */ getLastTag: function getLastTag() {
           var _sc = this.settings.classNames, tagNodes = this.DOM.scope.querySelectorAll("".concat(_sc.tagSelector, ":not(.").concat(_sc.tagHide, "):not([readonly])"));
           return tagNodes[tagNodes.length - 1];
       },
       /**
        * Searches if any tag with a certain value already exis
        * @param  {String/Object} value [text value / tag data object]
        * @param  {Boolean} caseSensitive
        * @return {Number}
        */ isTagDuplicate: function isTagDuplicate(value, caseSensitive, tagId) {
           var dupsCount = 0;
           var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
           try {
               for(var _iterator = this.value[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                   var item = _step.value;
                   var isSameStr = sameStr(this.trim("" + value), item.value, caseSensitive);
                   if (isSameStr && tagId != item.__tagId) dupsCount++;
               }
           } catch (err) {
               _didIteratorError = true;
               _iteratorError = err;
           } finally{
               try {
                   if (!_iteratorNormalCompletion && _iterator.return != null) {
                       _iterator.return();
                   }
               } finally{
                   if (_didIteratorError) {
                       throw _iteratorError;
                   }
               }
           }
           return dupsCount;
       },
       getTagIndexByValue: function getTagIndexByValue(value) {
           var _this = this;
           var indices = [], isCaseSensitive = this.settings.dropdown.caseSensitive;
           this.getTagElms().forEach(function(tagElm, i) {
               if (tagElm.__tagifyTagData && sameStr(_this.trim(tagElm.__tagifyTagData.value), value, isCaseSensitive)) indices.push(i);
           });
           return indices;
       },
       getTagElmByValue: function getTagElmByValue(value) {
           var tagIdx = this.getTagIndexByValue(value)[0];
           return this.getTagElms()[tagIdx];
       },
       /**
        * Temporarily marks a tag element (by value or Node argument)
        * @param  {Object} tagElm [a specific "tag" element to compare to the other tag elements siblings]
        */ flashTag: function flashTag(tagElm) {
           var _this = this;
           if (tagElm) {
               tagElm.classList.add(this.settings.classNames.tagFlash);
               setTimeout(function() {
                   tagElm.classList.remove(_this.settings.classNames.tagFlash);
               }, 100);
           }
       },
       /**
        * checks if text is in the blacklist
        */ isTagBlacklisted: function isTagBlacklisted(v) {
           v = this.trim(v.toLowerCase());
           return this.settings.blacklist.filter(function(x) {
               return ("" + x).toLowerCase() == v;
           }).length;
       },
       /**
        * checks if text is in the whitelist
        */ isTagWhitelisted: function isTagWhitelisted(v) {
           return !!this.getWhitelistItem(v);
       /*
           return this.settings.whitelist.some(item =>
               typeof v == 'string'
                   ? sameStr(this.trim(v), (item.value || item))
                   : sameStr(JSON.stringify(item), JSON.stringify(v))
           )
           */ },
       /**
        * Returns the first whitelist item matched, by value (if match found)
        * @param {String} value [text to match by]
        */ getWhitelistItem: function getWhitelistItem(value, prop, whitelist) {
           var result, prop = prop || "value", _s = this.settings, whitelist = whitelist || _s.whitelist;
           whitelist.some(function(_wi) {
               // whitelist item value. Can be either a String, Number or an Object (with a `value` property)
               var _wiv = typeof _wi == "object" ? _wi[prop] || _wi.value : _wi, isSameStr = sameStr(_wiv, value, _s.dropdown.caseSensitive, _s.trim);
               if (isSameStr) {
                   result = typeof _wi == "object" ? _wi : {
                       value: _wi
                   };
                   return true;
               }
           });
           // first iterate the whitelist, try find matches by "value" and if that fails
           // and a "tagTextProp" is set to be other than "value", try that also
           if (!result && prop == "value" && _s.tagTextProp != "value") {
               // if found, adds the first which matches
               result = this.getWhitelistItem(value, _s.tagTextProp, whitelist);
           }
           return result;
       },
       /**
        * validate a tag object BEFORE the actual tag will be created & appeneded
        * @param  {String} s
        * @param  {String} uid      [unique ID, to not inclue own tag when cheking for duplicates]
        * @return {Boolean/String}  ["true" if validation has passed, String for a fail]
        */ validateTag: function validateTag(tagData) {
           var _s = this.settings, // when validating a tag in edit-mode, need to take "tagTextProp" into consideration
           prop = "value" in tagData ? "value" : _s.tagTextProp, v = this.trim(tagData[prop] + "");
           // check for definitive empty value
           if (!(tagData[prop] + "").trim()) return this.TEXTS.empty;
           // check if pattern should be used and if so, use it to test the value
           if (_s.mode != "mix" && _s.pattern && _instanceof(_s.pattern, RegExp) && !_s.pattern.test(v)) return this.TEXTS.pattern;
           // check for duplicates
           if (!_s.duplicates && this.isTagDuplicate(v, _s.dropdown.caseSensitive, tagData.__tagId)) return this.TEXTS.duplicate;
           if (this.isTagBlacklisted(v) || _s.enforceWhitelist && !this.isTagWhitelisted(v)) return this.TEXTS.notAllowed;
           if (_s.validate) return _s.validate(tagData);
           return true;
       },
       getInvalidTagAttrs: function getInvalidTagAttrs(tagData, validation) {
           return {
               "aria-invalid": true,
               "class": "".concat(tagData.class || "", " ").concat(this.settings.classNames.tagNotAllowed).trim(),
               "title": validation
           };
       },
       hasMaxTags: function hasMaxTags() {
           return this.value.length >= this.settings.maxTags ? this.TEXTS.exceed : false;
       },
       setReadonly: function setReadonly(toggle, attrribute) {
           var _s = this.settings;
           this.DOM.scope.contains(document.activeElement) && document.activeElement.blur() // exit possible edit-mode
           ;
           _s[attrribute || "readonly"] = toggle;
           this.DOM.scope[(toggle ? "set" : "remove") + "Attribute"](attrribute || "readonly", true);
           this.settings.userInput = true;
           this.setContentEditable(!toggle);
       },
       setContentEditable: function setContentEditable(state1) {
           this.DOM.input.contentEditable = state1;
           this.DOM.input.tabIndex = !!state1 ? 0 : -1;
       },
       setDisabled: function setDisabled(isDisabled) {
           this.setReadonly(isDisabled, "disabled");
       },
       /**
        * pre-proccess the tagsItems, which can be a complex tagsItems like an Array of Objects or a string comprised of multiple words
        * so each item should be iterated on and a tag created for.
        * @return {Array} [Array of Objects]
        */ normalizeTags: function normalizeTags(tagsItems) {
           var _this = this;
           var _this_settings = this.settings, whitelist = _this_settings.whitelist, delimiters = _this_settings.delimiters, mode = _this_settings.mode, tagTextProp = _this_settings.tagTextProp, whitelistMatches = [], whitelistWithProps = whitelist ? _instanceof(whitelist[0], Object) : false, // checks if this is a "collection", meanning an Array of Objects
           isArray = Array.isArray(tagsItems), isCollection = isArray && tagsItems[0].value, mapStringToCollection = function(s) {
               return (s + "").split(delimiters).reduce(function(acc, v) {
                   var trimmed = _this.trim(v);
                   var _obj;
                   trimmed && acc.push((_obj = {}, _define_property(_obj, tagTextProp, trimmed), _define_property(_obj, "value", trimmed), _obj));
                   return acc;
               }, []);
           };
           if (typeof tagsItems == "number") tagsItems = tagsItems.toString();
           // if the argument is a "simple" String, ex: "aaa, bbb, ccc"
           if (typeof tagsItems == "string") {
               if (!tagsItems.trim()) return [];
               // go over each tag and add it (if there were multiple ones)
               tagsItems = mapStringToCollection(tagsItems);
           } else if (isArray) {
               // flatten the 2D array
               tagsItems = tagsItems.reduce(function(acc, item) {
                   if (isObject(item)) {
                       var itemCopy = extend({}, item);
                       // if 'tagTextProp' property does not exist in the item, use `value` instead
                       if (!(tagTextProp in itemCopy)) tagTextProp = "value";
                       itemCopy[tagTextProp] = _this.trim(itemCopy[tagTextProp]);
                       // discard empty tags but allow `0` as a valid value
                       if (itemCopy[tagTextProp] || itemCopy[tagTextProp] === 0) acc.push(itemCopy) // mapStringToCollection(item.value).map(newItem => ({...item,...newItem}))
                       ;
                   } else if (item != null && item !== "" && item !== undefined) {
                       var _acc;
                       (_acc = acc).push.apply(_acc, _to_consumable_array(mapStringToCollection(item)));
                   }
                   return acc;
               }, []);
           }
           // search if the tag exists in the whitelist as an Object (has props),
           // to be able to use its properties.
           // skip matching collections with whitelist items as they are considered "whole"
           if (whitelistWithProps && !isCollection) {
               tagsItems.forEach(function(item) {
                   var whitelistMatchesValues = whitelistMatches.map(function(a) {
                       return a.value;
                   });
                   // if suggestions are shown, they are already filtered, so it's easier to use them,
                   // because the whitelist might also include items which have already been added
                   var filteredList = _this.dropdown.filterListItems.call(_this, item[tagTextProp], {
                       exact: true
                   });
                   if (!_this.settings.duplicates) // also filter out items which have already been matched in previous iterations
                   filteredList = filteredList.filter(function(filteredItem) {
                       return !whitelistMatchesValues.includes(filteredItem.value);
                   });
                   // get the best match out of list of possible matches.
                   // if there was a single item in the filtered list, use that one
                   var matchObj = filteredList.length > 1 ? _this.getWhitelistItem(item[tagTextProp], tagTextProp, filteredList) : filteredList[0];
                   if (matchObj && _instanceof(matchObj, Object)) {
                       whitelistMatches.push(matchObj) // set the Array (with the found Object) as the new value
                       ;
                   } else if (mode != "mix") {
                       if (item.value == undefined) item.value = item[tagTextProp];
                       whitelistMatches.push(item);
                   }
               });
               if (whitelistMatches.length) tagsItems = whitelistMatches;
           }
           return tagsItems;
       },
       /**
        * Parse the initial value of a textarea (or input) element and generate mixed text w/ tags
        * https://stackoverflow.com/a/57598892/104380
        * @param {String} s
        */ parseMixTags: function parseMixTags(s) {
           var _this = this;
           var _this_settings = this.settings, mixTagsInterpolator = _this_settings.mixTagsInterpolator, duplicates = _this_settings.duplicates, transformTag = _this_settings.transformTag, enforceWhitelist = _this_settings.enforceWhitelist, maxTags = _this_settings.maxTags, tagTextProp = _this_settings.tagTextProp, tagsDataSet = [];
           s = s.split(mixTagsInterpolator[0]).map(function(s1, i) {
               var s2 = s1.split(mixTagsInterpolator[1]), preInterpolated = s2[0], maxTagsReached = tagsDataSet.length == maxTags, textProp, tagData, tagElm;
               try {
                   // skip numbers and go straight to the "catch" statement
                   if (preInterpolated == +preInterpolated) throw Error;
                   tagData = JSON.parse(preInterpolated);
               } catch (err) {
                   tagData = _this.normalizeTags(preInterpolated)[0] || {
                       value: preInterpolated
                   };
               }
               transformTag.call(_this, tagData);
               if (!maxTagsReached && s2.length > 1 && (!enforceWhitelist || _this.isTagWhitelisted(tagData.value)) && !(!duplicates && _this.isTagDuplicate(tagData.value))) {
                   // in case "tagTextProp" setting is set to other than "value" and this tag does not have this prop
                   textProp = tagData[tagTextProp] ? tagTextProp : "value";
                   tagData[textProp] = _this.trim(tagData[textProp]);
                   tagElm = _this.createTagElem(tagData);
                   tagsDataSet.push(tagData);
                   tagElm.classList.add(_this.settings.classNames.tagNoAnimation);
                   s2[0] = tagElm.outerHTML //+ "&#8288;"  // put a zero-space at the end so the caret won't jump back to the start (when the last input's child element is a tag)
                   ;
                   _this.value.push(tagData);
               } else if (s1) return i ? mixTagsInterpolator[0] + s1 : s1;
               return s2.join("");
           }).join("");
           this.DOM.input.innerHTML = s;
           this.DOM.input.appendChild(document.createTextNode(""));
           this.DOM.input.normalize();
           var tagNodes = this.getTagElms();
           tagNodes.forEach(function(elm, idx) {
               return getSetTagData(elm, tagsDataSet[idx]);
           });
           this.update({
               withoutChangeEvent: true
           });
           fixCaretBetweenTags(tagNodes, this.state.hasFocus);
           return s;
       },
       /**
        * For mixed-mode: replaces a text starting with a prefix with a wrapper element (tag or something)
        * First there *has* to be a "this.state.tag" which is a string that was just typed and is staring with a prefix
        */ replaceTextWithNode: function replaceTextWithNode(newWrapperNode, strToReplace) {
           if (!this.state.tag && !strToReplace) return;
           strToReplace = strToReplace || this.state.tag.prefix + this.state.tag.value;
           var idx, nodeToReplace, selection = this.state.selection || window.getSelection(), nodeAtCaret = selection.anchorNode, firstSplitOffset = this.state.tag.delimiters ? this.state.tag.delimiters.length : 0;
           // STEP 1: ex. replace #ba with the tag "bart" where "|" is where the caret is:
           // CURRENT STATE: "foo #ba #ba| #ba"
           // split the text node at the index of the caret
           nodeAtCaret.splitText(selection.anchorOffset - firstSplitOffset);
           // node 0: "foo #ba #ba|"
           // node 1: " #ba"
           // get index of LAST occurence of "#ba"
           idx = nodeAtCaret.nodeValue.lastIndexOf(strToReplace);
           if (idx == -1) return true;
           nodeToReplace = nodeAtCaret.splitText(idx);
           // node 0: "foo #ba "
           // node 1: "#ba"    <- nodeToReplace
           newWrapperNode && nodeAtCaret.parentNode.replaceChild(newWrapperNode, nodeToReplace);
           // must NOT normalize contenteditable or it will cause unwanted issues:
           // https://monosnap.com/file/ZDVmRvq5upYkidiFedvrwzSswegWk7
           // nodeAtCaret.parentNode.normalize()
           return true;
       },
       /**
        * Validate a tag's data and create a new tag node
        * @param {*} tagData
        * @param {*} options
        * @returns Object
        */ prepareNewTagNode: function prepareNewTagNode(tagData, options) {
           options = options || {};
           var tagElm, _s = this.settings, aggregatedInvalidInput = [], tagElmParams = {}, originalData = Object.assign({}, tagData, {
               value: tagData.value + ""
           });
           // shallow-clone tagData so later modifications will not apply to the source
           tagData = Object.assign({}, originalData);
           _s.transformTag.call(this, tagData);
           tagData.__isValid = this.hasMaxTags() || this.validateTag(tagData);
           if (tagData.__isValid !== true) {
               if (options.skipInvalid) return;
               // originalData is kept because it might be that this tag is invalid because it is a duplicate of another,
               // and if that other tags is edited/deleted, this one should be re-validated and if is no more a duplicate - restored
               extend(tagElmParams, this.getInvalidTagAttrs(tagData, tagData.__isValid), {
                   __preInvalidData: originalData
               });
               if (tagData.__isValid == this.TEXTS.duplicate) // mark, for a brief moment, the tag (this this one) which THIS CURRENT tag is a duplcate of
               this.flashTag(this.getTagElmByValue(tagData.value));
               if (!_s.createInvalidTags) {
                   aggregatedInvalidInput.push(tagData.value);
                   return;
               }
           }
           if ("readonly" in tagData) {
               if (tagData.readonly) tagElmParams["aria-readonly"] = true;
               else delete tagData.readonly;
           }
           // Create tag HTML element
           tagElm = this.createTagElem(tagData, tagElmParams);
           return {
               tagElm: tagElm,
               tagData: tagData,
               aggregatedInvalidInput: aggregatedInvalidInput
           };
       },
       /**
        * Logic to happen once a tag has just been injected into the DOM
        * @param {Node} tagElm
        * @param {Object} tagData
        */ postProcessNewTagNode: function postProcessNewTagNode(tagElm, tagData) {
           var _this = this;
           var _s = this.settings, isValid = tagData.__isValid;
           if (isValid && isValid === true) {
               // update state
               this.value.push(tagData);
           } else {
               this.trigger("invalid", {
                   data: tagData,
                   index: this.value.length,
                   tag: tagElm,
                   message: isValid
               });
               if (!_s.keepInvalidTags) // remove invalid tags (if "keepInvalidTags" is set to "false")
               setTimeout(function() {
                   return _this.removeTags(tagElm, true);
               }, 1000);
           }
           this.dropdown.position() // reposition the dropdown because the just-added tag might cause a new-line
           ;
       },
       /**
        * For selecting a single option (not used for multiple tags, but for "mode:select" only)
        * @param {Object} tagElm   Tag DOM node
        * @param {Object} tagData  Tag data
        */ selectTag: function selectTag(tagElm, tagData) {
           var _this = this;
           var _s = this.settings;
           if (_s.enforceWhitelist && !this.isTagWhitelisted(tagData.value)) return;
           // this.input.set.call(this, tagData[_s.tagTextProp] || tagData.value, true)
           // place the caret at the end of the input, only if a dropdown option was selected (and not by manually typing another value and clicking "TAB")
           if (this.state.actions.selectOption) setTimeout(function() {
               return _this.setRangeAtStartEnd(false, _this.DOM.input);
           });
           var lastTagElm = this.getLastTag();
           if (lastTagElm) this.replaceTag(lastTagElm, tagData);
           else this.appendTag(tagElm);
           // if( _s.enforceWhitelist )
           //     this.setContentEditable(false);
           this.value[0] = tagData;
           this.update();
           this.trigger("add", {
               tag: tagElm,
               data: tagData
           });
           return [
               tagElm
           ];
       },
       /**
        * add an empty "tag" element in an editable state
        */ addEmptyTag: function addEmptyTag(initialData) {
           var tagData = extend({
               value: ""
           }, initialData || {}), tagElm = this.createTagElem(tagData);
           getSetTagData(tagElm, tagData);
           // add the tag to the component's DOM
           this.appendTag(tagElm);
           this.editTag(tagElm, {
               skipValidation: true
           });
           this.toggleFocusClass(true);
       },
       /**
        * add a "tag" element to the "tags" component
        * @param {String/Array} tagsItems   [A string (single or multiple values with a delimiter), or an Array of Objects or just Array of Strings]
        * @param {Boolean}      clearInput  [flag if the input's value should be cleared after adding tags]
        * @param {Boolean}      skipInvalid [do not add, mark & remove invalid tags]
        * @return {Array} Array of DOM elements (tags)
        */ addTags: function addTags(tagsItems, clearInput, skipInvalid) {
           var _this = this;
           var tagElems = [], _s = this.settings, aggregatedInvalidInput = [], frag = document.createDocumentFragment(), addedTags = []; // all tags, also invalid. this is used for firing the `add` event
           if (!tagsItems || tagsItems.length == 0) {
               return tagElems;
           }
           // converts Array/String/Object to an Array of Objects
           tagsItems = this.normalizeTags(tagsItems);
           switch(_s.mode){
               case "mix":
                   return this.addMixTags(tagsItems);
               case "select":
                   {
                       clearInput = false;
                       this.removeAllTags();
                   }
           }
           this.DOM.input.removeAttribute("style");
           tagsItems.forEach(function(tagData) {
               var newTagNode = _this.prepareNewTagNode(tagData, {
                   skipInvalid: skipInvalid || _s.skipInvalid
               });
               if (!newTagNode) return;
               var tagElm = newTagNode.tagElm;
               tagData = newTagNode.tagData;
               aggregatedInvalidInput = newTagNode.aggregatedInvalidInput;
               tagElems.push(tagElm);
               // mode-select overrides
               if (_s.mode == "select") {
                   return _this.selectTag(tagElm, tagData);
               }
               // add the tag to the component's DOM
               // this.appendTag(tagElm)
               frag.appendChild(tagElm);
               _this.postProcessNewTagNode(tagElm, tagData);
               addedTags.push({
                   tagElm: tagElm,
                   tagData: tagData
               });
           });
           this.appendTag(frag);
           addedTags.forEach(function(param) {
               var tagElm = param.tagElm, tagData = param.tagData;
               return _this.trigger("add", {
                   tag: tagElm,
                   index: _this.getTagIdx(tagData),
                   data: tagData
               });
           });
           this.update();
           if (tagsItems.length && clearInput) {
               this.input.set.call(this, _s.createInvalidTags ? "" : aggregatedInvalidInput.join(_s._delimiters));
               this.setRangeAtStartEnd(false, this.DOM.input);
           }
           // refilter hydrate the list
           this.dropdown.refilter();
           return tagElems;
       },
       /**
        * Adds a mix-content tag
        * @param {String/Array} tagData    A string (single or multiple values with a delimiter), or an Array of Objects or just Array of Strings
        */ addMixTags: function addMixTags(tagsData) {
           var _this = this;
           tagsData = this.normalizeTags(tagsData);
           // flow for creating custom tags which aren't a part of the whitelist
           if (tagsData[0].prefix || this.state.tag) {
               return this.prefixedTextToTag(tagsData[0]);
           }
           var frag = document.createDocumentFragment();
           tagsData.forEach(function(tagData) {
               var newTagNode = _this.prepareNewTagNode(tagData);
               frag.appendChild(newTagNode.tagElm);
               _this.insertAfterTag(newTagNode.tagElm);
               _this.postProcessNewTagNode(newTagNode.tagElm, newTagNode.tagData);
           });
           this.appendMixTags(frag);
           return frag.children;
       },
       appendMixTags: function appendMixTags(node) {
           var selection = !!this.state.selection;
           // if "selection" exists, assumes intention of inecting the new tag at the last
           // saved location of the caret inside "this.DOM.input"
           if (selection) {
               this.injectAtCaret(node);
           } else {
               this.DOM.input.focus();
               selection = this.setStateSelection();
               selection.range.setStart(this.DOM.input, selection.range.endOffset);
               selection.range.setEnd(this.DOM.input, selection.range.endOffset);
               this.DOM.input.appendChild(node);
               this.updateValueByDOMTags() // updates internal "this.value"
               ;
               this.update() // updates original input/textarea
               ;
           }
       },
       /**
        * Adds a tag which was activly typed by the user
        * @param {String/Array} tagData   [A string (single or multiple values with a delimiter), or an Array of Objects or just Array of Strings]
        */ prefixedTextToTag: function prefixedTextToTag(tagData) {
           var _this = this;
           var _this_state_tag;
           var _s = this.settings, tagElm, newTag, createdFromDelimiters = (_this_state_tag = this.state.tag) === null || _this_state_tag === void 0 ? void 0 : _this_state_tag.delimiters;
           tagData.prefix = tagData.prefix || this.state.tag ? this.state.tag.prefix : (_s.pattern.source || _s.pattern)[0];
           newTag = this.prepareNewTagNode(tagData);
           tagElm = newTag.tagElm;
           // tries to replace a taged textNode with a tagElm, and if not able,
           // insert the new tag to the END if "addTags" was called from outside
           if (!this.replaceTextWithNode(tagElm)) {
               this.DOM.input.appendChild(tagElm);
           }
           setTimeout(function() {
               return tagElm.classList.add(_this.settings.classNames.tagNoAnimation);
           }, 300);
           this.update();
           if (!createdFromDelimiters) {
               var elm = this.insertAfterTag(tagElm) || tagElm;
               // a timeout is needed when selecting a tag from the suggestions via mouse.
               // Without it, it seems the caret is placed right after the tag and not after the
               // node which was inserted after the tag (whitespace by default)
               setTimeout(placeCaretAfterNode, 0, elm);
           }
           this.state.tag = null;
           this.postProcessNewTagNode(tagElm, newTag.tagData);
           return tagElm;
       },
       /**
        * appened (validated) tag to the component's DOM scope
        */ appendTag: function appendTag(tagElm) {
           var DOM = this.DOM, insertBeforeNode = DOM.input;
           //if( insertBeforeNode === DOM.input )
           DOM.scope.insertBefore(tagElm, insertBeforeNode);
       //else
       //    DOM.scope.appendChild(tagElm)
       },
       /**
        * creates a DOM tag element and injects it into the component (this.DOM.scope)
        * @param  {Object}  tagData [text value & properties for the created tag]
        * @param  {Object}  extraData [properties which are for the HTML template only]
        * @return {Object} [DOM element]
        */ createTagElem: function createTagElem(tagData, extraData) {
           tagData.__tagId = getUID();
           var tagElm, templateData = extend({}, tagData, _object_spread({
               value: escapeHTML(tagData.value + "")
           }, extraData));
           // if( this.settings.readonly )
           //     tagData.readonly = true
           tagElm = this.parseTemplate("tag", [
               templateData,
               this
           ]);
           // crucial for proper caret placement when deleting content. if textNodes are allowed as children of a tag element,
           // a browser bug casues the caret to be misplaced inside the tag element (especially affects "readonly" tags)
           removeTextChildNodes(tagElm);
           // while( tagElm.lastChild.nodeType == 3 )
           //     tagElm.lastChild.parentNode.removeChild(tagElm.lastChild)
           getSetTagData(tagElm, tagData);
           return tagElm;
       },
       /**
        * re-check all invalid tags.
        * called after a tag was edited or removed
        */ reCheckInvalidTags: function reCheckInvalidTags() {
           var _this = this;
           var _s = this.settings;
           this.getTagElms(_s.classNames.tagNotAllowed).forEach(function(tagElm, i) {
               var tagData = getSetTagData(tagElm), hasMaxTags = _this.hasMaxTags(), tagValidation = _this.validateTag(tagData), isValid = tagValidation === true && !hasMaxTags;
               if (_s.mode == "select") _this.toggleScopeValidation(tagValidation);
               // if the tag has become valid
               if (isValid) {
                   tagData = tagData.__preInvalidData ? tagData.__preInvalidData : {
                       value: tagData.value
                   };
                   return _this.replaceTag(tagElm, tagData);
               }
               // if the tag is still invaild, set its title as such (reson of invalid might have changed)
               tagElm.title = hasMaxTags || tagValidation;
           });
       },
       /**
        * Removes a tag
        * @param  {Array|Node|String}  tagElms         [DOM element(s) or a String value. if undefined or null, remove last added tag]
        * @param  {Boolean}            silent          [A flag, which when turned on, does not remove any value and does not update the original input value but simply removes the tag from tagify]
        * @param  {Number}             tranDuration    [Transition duration in MS]
        * TODO: Allow multiple tags to be removed at-once
        */ removeTags: function removeTags(tagElms, silent, tranDuration) {
           var _this = this;
           var tagsToRemove, _s = this.settings;
           tagElms = tagElms && _instanceof(tagElms, HTMLElement) ? [
               tagElms
           ] : _instanceof(tagElms, Array) ? tagElms : tagElms ? [
               tagElms
           ] : [
               this.getLastTag()
           ].filter(function(n) {
               return n;
           }) // must filter because "this.getLastTag()" might be `undefined` if there are not tags
           ;
           // normalize tagElms array values:
           // 1. removing invalid items
           // 2, if an item is String try to get the matching Tag HTML node
           // 3. get the tag data
           // 4. return a collection of Objects
           tagsToRemove = tagElms.reduce(function(elms, tagElm) {
               if (tagElm && typeof tagElm == "string") tagElm = _this.getTagElmByValue(tagElm);
               var tagData = getSetTagData(tagElm);
               if (tagElm && tagData && !tagData.readonly) // because the DOM node might be removed by async animation, the state will be updated while
               // the node might still be in the DOM, so the "update" method should know which nodes to ignore
               elms.push({
                   node: tagElm,
                   idx: _this.getTagIdx(tagData),
                   data: getSetTagData(tagElm, {
                       "__removed": true
                   })
               });
               return elms;
           }, []);
           tranDuration = typeof tranDuration == "number" ? tranDuration : this.CSSVars.tagHideTransition;
           if (_s.mode == "select") {
               tranDuration = 0;
               this.input.set.call(this);
           }
           // if only a single tag is to be removed.
           // skip "select" mode because invalid tags are actually set to `this.value`
           if (tagsToRemove.length == 1 && _s.mode != "select") {
               if (tagsToRemove[0].node.classList.contains(_s.classNames.tagNotAllowed)) silent = true;
           }
           if (!tagsToRemove.length) return;
           return _s.hooks.beforeRemoveTag(tagsToRemove, {
               tagify: this
           }).then(function() {
               var removeNode = function removeNode(tag) {
                   if (!tag.node.parentNode) return;
                   tag.node.parentNode.removeChild(tag.node);
                   if (!silent) {
                       // this.removeValueById(tagData.__uid)
                       this.trigger("remove", {
                           tag: tag.node,
                           index: tag.idx,
                           data: tag.data
                       });
                       this.dropdown.refilter();
                       this.dropdown.position();
                       this.DOM.input.normalize() // best-practice when in mix-mode (safe to do always anyways)
                       ;
                       // check if any of the current tags which might have been marked as "duplicate" should be un-marked
                       if (_s.keepInvalidTags) this.reCheckInvalidTags();
                   // below code is unfinished. it should iterate all currently invalid edited tags, which their edits have not
                   // changed the value yet, and should re-trigger the check, but since nothing has changed, it does not work...
                   // this.getTagElms(_s.classNames.tagEditing).forEach( this.events.callbacks.onEditTagBlur.bind )
                   } else if (_s.keepInvalidTags) this.trigger("remove", {
                       tag: tag.node,
                       index: tag.idx
                   });
               };
               var animation = function animation(tag) {
                   tag.node.style.width = parseFloat(window.getComputedStyle(tag.node).width) + "px";
                   document.body.clientTop // force repaint for the width to take affect before the "hide" class below
                   ;
                   tag.node.classList.add(_s.classNames.tagHide);
                   // manual timeout (hack, since transitionend cannot be used because of hover)
                   setTimeout(removeNode.bind(this), tranDuration, tag);
               };
               if (tranDuration && tranDuration > 10 && tagsToRemove.length == 1) animation.call(_this, tagsToRemove[0]);
               else tagsToRemove.forEach(removeNode.bind(_this));
               // update state regardless of animation
               if (!silent) {
                   _this.removeTagsFromValue(tagsToRemove.map(function(tag) {
                       return tag.node;
                   }));
                   _this.update() // update the original input with the current value
                   ;
                   if (_s.mode == "select" && _s.userInput) _this.setContentEditable(true);
               }
           }).catch(function(reason) {});
       },
       removeTagsFromDOM: function removeTagsFromDOM() {
           this.getTagElms().forEach(function(node) {
               return node.remove();
           });
       },
       /**
        * @param {Array/Node} tags to be removed from the this.value array
        */ removeTagsFromValue: function removeTagsFromValue(tags) {
           var _this = this;
           tags = Array.isArray(tags) ? tags : [
               tags
           ];
           tags.forEach(function(tag) {
               var tagData = getSetTagData(tag), tagIdx = _this.getTagIdx(tagData);
               //  delete tagData.__removed
               if (tagIdx > -1) _this.value.splice(tagIdx, 1);
           });
       },
       removeAllTags: function removeAllTags(opts) {
           var _this = this;
           opts = opts || {};
           this.value = [];
           if (this.settings.mode == "mix") this.DOM.input.innerHTML = "";
           else this.removeTagsFromDOM();
           this.dropdown.refilter();
           this.dropdown.position();
           if (this.state.dropdown.visible) setTimeout(function() {
               _this.DOM.input.focus();
           });
           if (this.settings.mode == "select") {
               this.input.set.call(this);
               this.settings.userInput && this.setContentEditable(true);
           }
           // technically for now only "withoutChangeEvent" exists in the opts.
           // if more properties will be added later, only pass what's needed to "update"
           this.update(opts);
       },
       postUpdate: function postUpdate() {
           this.state.blockChangeEvent = false;
           var _s = this.settings, classNames = _s.classNames, hasValue = _s.mode == "mix" ? _s.mixMode.integrated ? this.DOM.input.textContent : this.DOM.originalInput.value.trim() : this.value.length + this.input.raw.call(this).length;
           this.toggleClass(classNames.hasMaxTags, this.value.length >= _s.maxTags);
           this.toggleClass(classNames.hasNoTags, !this.value.length);
           this.toggleClass(classNames.empty, !hasValue);
           // specifically the "select mode" might have the "invalid" classname set when the field is changed, so it must be toggled on add/remove/edit
           if (_s.mode == "select") {
               var _this_value_, _this_value;
               this.toggleScopeValidation((_this_value = this.value) === null || _this_value === void 0 ? void 0 : (_this_value_ = _this_value[0]) === null || _this_value_ === void 0 ? void 0 : _this_value_.__isValid);
           }
       },
       setOriginalInputValue: function setOriginalInputValue(v) {
           var inputElm = this.DOM.originalInput;
           if (!this.settings.mixMode.integrated) {
               inputElm.value = v;
               inputElm.tagifyValue = inputElm.value // must set to "inputElm.value" and not again to "inputValue" because for some reason the browser changes the string afterwards a bit.
               ;
               this.setPersistedData(v, "value");
           }
       },
       /**
        * update the origianl (hidden) input field's value
        * see - https://stackoverflow.com/q/50957841/104380
        */ update: function update(args) {
           var UPDATE_DELAY = 100;
           clearTimeout(this.debouncedUpdateTimeout);
           this.debouncedUpdateTimeout = setTimeout(reallyUpdate.bind(this), UPDATE_DELAY);
           this.events.bindOriginaInputListener.call(this, UPDATE_DELAY);
           function reallyUpdate() {
               var inputValue = this.getInputValue();
               this.setOriginalInputValue(inputValue);
               if ((!this.settings.onChangeAfterBlur || !(args || {}).withoutChangeEvent) && !this.state.blockChangeEvent) this.triggerChangeEvent();
               this.postUpdate();
           }
       },
       getInputValue: function getInputValue() {
           var value = this.getCleanValue();
           return this.settings.mode == "mix" ? this.getMixedTagsAsString(value) : value.length ? this.settings.originalInputValueFormat ? this.settings.originalInputValueFormat(value) : JSON.stringify(value) : "";
       },
       /**
        * removes properties from `this.value` which are only used internally
        */ getCleanValue: function getCleanValue(v) {
           return removeCollectionProp(v || this.value, this.dataProps);
       },
       getMixedTagsAsString: function getMixedTagsAsString() {
           var result = "", that = this, _s = this.settings, originalInputValueFormat = _s.originalInputValueFormat || JSON.stringify, _interpolator = _s.mixTagsInterpolator;
           function iterateChildren(rootNode) {
               rootNode.childNodes.forEach(function(node) {
                   if (node.nodeType == 1) {
                       var tagData = getSetTagData(node);
                       if (node.tagName == "BR") {
                           result += "\r\n";
                       }
                       if (tagData && isNodeTag.call(that, node)) {
                           if (tagData.__removed) return;
                           else result += _interpolator[0] + originalInputValueFormat(omit(tagData, that.dataProps)) + _interpolator[1];
                       } else if (node.getAttribute("style") || [
                           "B",
                           "I",
                           "U"
                       ].includes(node.tagName)) result += node.textContent;
                       else if (node.tagName == "DIV" || node.tagName == "P") {
                           result += "\r\n";
                           //  if( !node.children.length && node.textContent )
                           //  result += node.textContent;
                           iterateChildren(node);
                       }
                   } else result += node.textContent;
               });
           }
           iterateChildren(this.DOM.input);
           return result;
       }
   };
   // legacy support for changed methods names
   Tagify.prototype.removeTag = Tagify.prototype.removeTags;

   return Tagify;

}));
//# sourceMappingURL=tagify.js.map
