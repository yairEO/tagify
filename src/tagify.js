/**
 * Tagify (v 2.1.7)- tags input component
 * By Yair Even-Or (2016)
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
'use strict';

function Tagify(input, settings) {
    // protection
    if (!input) {
        console.warn('Tagify: ', 'invalid input element ', input);
        return this;
    }

    this.settings = this.extend({}, this.DEFAULTS, settings);
    this.settings.readonly = input.hasAttribute('readonly'); // if "readonly" do not include an "input" element inside the Tags component

    if (this.isIE) this.settings.autoComplete = false; // IE goes crazy if this isn't false

    if (input.pattern) try {
        this.settings.pattern = new RegExp(input.pattern);
    } catch (e) {}

    // Convert the "delimiters" setting into a REGEX object
    if (this.settings && this.settings.delimiters) {
        try {
            this.settings.delimiters = new RegExp("[" + this.settings.delimiters + "]", "g");
        } catch (e) {}
    }

    this.value = []; // tags' data

    // events' callbacks references will be stores here, so events could be unbinded
    this.listeners = {};

    this.DOM = {}; // Store all relevant DOM elements in an Object
    this.extend(this, new this.EventDispatcher(this));
    this.build(input);
    this.loadOriginalValues();

    this.events.customBinding.call(this);
    this.events.binding.call(this);
}

Tagify.prototype = {
    isIE: window.document.documentMode,

    TEXTS: {
        empty: "empty",
        exceed: "number of tags exceeded",
        pattern: "pattern mismatch",
        duplicate: "already exists",
        notAllowed: "not allowed",
        stringLength: "invalid string length"
    },

    DEFAULTS: {
        delimiters: ",", // [RegEx] split tags by any of these delimiters ("null" to cancel) Example: ",| |."
        pattern: null, // RegEx pattern to validate input by. Ex: /[1-9]/
        maxTags: Infinity, // Maximum number of tags
        minTagLength: false, // Minimum length required for each tag
        maxTagLength: false, // Maximum length allowed for each tag
        callbacks: {}, // Exposed callbacks object to be triggered on certain events
        addTagOnBlur: true, // Flag - automatically adds the text which was inputed as a tag when blur event happens
        duplicates: false, // Flag - allow tuplicate tags
        whitelist: [], // Array of tags to suggest as the user types (can be used along with "enforceWhitelist" setting)
        blacklist: [], // A list of non-allowed tags
        enforceWhitelist: false, // Flag - Only allow tags allowed in whitelist
        keepInvalidTags: false, // Flag - if true, do not remove tags which did not pass validation
        autoComplete: true, // Flag - tries to autocomplete the input's value while typing
        mapValueToProp: "", // String - when tags have multiple properties, and for each tag another property should be used besides the "value"
        dropdown: {
            classname: '',
            enabled: 2, // minimum input characters needs to be typed for the dropdown to show
            maxItems: 10,
            itemTemplate: ''
        }
    },

    customEventsList: ['add', 'remove', 'invalid'],

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


    // https://stackoverflow.com/a/25396011/104380
    escapeHtml: function escapeHtml(s) {
        var text = document.createTextNode(s),
            p = document.createElement('p');
        p.appendChild(text);
        return p.innerHTML;
    },


    /**
     * builds the HTML of this component
     * @param  {Object} input [DOM element which would be "transformed" into "Tags"]
     */
    build: function build(input) {
        var that = this,
            DOM = this.DOM,
            template = '<tags class="tagify ' + input.className + '" ' + (this.settings.readonly ? 'readonly' : '') + '>\n                            <div contenteditable data-placeholder="' + input.placeholder + '" class="tagify__input"></div>\n                        </tags>';

        DOM.originalInput = input;
        DOM.scope = this.parseHTML(template);
        DOM.input = DOM.scope.querySelector('[contenteditable]');
        input.parentNode.insertBefore(DOM.scope, input);

        if (this.settings.dropdown.enabled && this.settings.whitelist.length) {
            this.dropdown.init.call(this);
        }

        input.autofocus && DOM.input.focus();
    },


    /**
     * Reverts back any changes made by this component
     */
    destroy: function destroy() {
        this.DOM.scope.parentNode.removeChild(this.DOM.scope);
    },


    /**
     * Merge two objects into a new one
     * TEST: extend({}, {a:{foo:1}, b:[]}, {a:{bar:2}, b:[1], c:()=>{}})
     */
    extend: function extend(o, o1, o2) {
        if (!(o instanceof Object)) o = {};

        copy(o, o1);
        if (o2) copy(o, o2);

        function isObject(obj) {
            var type = Object.prototype.toString.call(obj).split(' ')[1].slice(0, -1);
            return obj === Object(obj) && type != 'Array' && type != 'Function' && type != 'RegExp' && type != 'HTMLUnknownElement';
        };

        function copy(a, b) {
            // copy o2 to o
            for (var key in b) {
                if (b.hasOwnProperty(key)) {
                    if (isObject(b[key])) {
                        if (!isObject(a[key])) {
                            a[key] = Object.assign({}, b[key]);
                        } else copy(a[key], b[key]);
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
        var target = document.createTextNode('');

        // Pass EventTarget interface calls to DOM EventTarget object
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
                $(instance.DOM.originalInput).triggerHandler(eventName, [data]);
            } else {
                try {
                    e = new CustomEvent(eventName, { "detail": data });
                } catch (err) {
                    console.warn(err);
                }
                target.dispatchEvent(e);
            }
        };
    },


    /**
     * DOM events listeners binding
     */
    events: {
        // bind custom events which were passed in the settings
        customBinding: function customBinding() {
            var _this2 = this;

            this.customEventsList.forEach(function (name) {
                _this2.on(name, _this2.settings.callbacks[name]);
            });
        },
        binding: function binding() {
            var bindUnbind = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            var _CB = this.events.callbacks,

            // setup callback references so events could be removed later
            _CBR = this.listeners.main = this.listeners.main || {
                paste: ['input', _CB.onPaste.bind(this)],
                focus: ['input', _CB.onFocusBlur.bind(this)],
                blur: ['input', _CB.onFocusBlur.bind(this)],
                keydown: ['input', _CB.onKeydown.bind(this)],
                click: ['scope', _CB.onClickScope.bind(this)]
            },
                action = bindUnbind ? 'addEventListener' : 'removeEventListener';

            for (var eventName in _CBR) {
                this.DOM[_CBR[eventName][0]][action](eventName, _CBR[eventName][1]);
            }

            if (bindUnbind) {
                // this event should never be unbinded
                // IE cannot register "input" events on contenteditable elements, so the "keydown" should be used instead..
                this.DOM.input.addEventListener(this.isIE ? "keydown" : "input", _CB[this.isIE ? "onInputIE" : "onInput"].bind(this));

                if (this.settings.isJQueryPlugin) $(this.DOM.originalInput).on('tagify.removeAllTags', this.removeAllTags.bind(this));
            }
        },


        /**
         * DOM events callbacks
         */
        callbacks: {
            onFocusBlur: function onFocusBlur(e) {
                var s = e.target.textContent.trim();

                if (e.type == "focus") {
                    //  e.target.classList.remove('placeholder');
                } else if (e.type == "blur" && s) {
                    this.settings.addTagOnBlur && this.addTags(s, true).length;
                } else {
                    //  e.target.classList.add('placeholder');
                    this.DOM.input.removeAttribute('style');
                    this.dropdown.hide.call(this);
                }
            },
            onKeydown: function onKeydown(e) {
                var s = e.target.textContent,
                    lastTag;

                if (e.key == 'Backspace' && (s == "" || s.charCodeAt(0) == 8203)) {
                    lastTag = this.DOM.scope.querySelectorAll('tag:not(.tagify--hide)');
                    lastTag = lastTag[lastTag.length - 1];
                    this.removeTag(lastTag);
                } else if (e.key == 'Escape') {
                    this.input.set.call(this);
                    e.target.blur();
                } else if (e.key == 'Enter' || e.key == 'Esc') {
                    e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                    this.addTags(this.input.value, true);
                } else if (e.key == 'ArrowRight') this.input.autocomplete.set.call(this);
            },
            onInput: function onInput(e) {
                var value = this.input.normalize.call(this),
                    showSuggestions = value.length >= this.settings.dropdown.enabled;

                if (!value) {
                    this.input.set.call(this, '');
                    return;
                }

                if (this.input.value == value) return; // for IE; since IE doesn't have an "input" event so "keyDown" is used instead

                // save the value on the input's State object
                this.input.set.call(this, value, false);

                if (value.search(this.settings.delimiters) != -1) {
                    if (this.addTags(value).length) {
                        this.input.set.call(this); // clear the input field's value
                    }
                } else if (this.settings.dropdown.enabled && this.settings.whitelist.length) {
                    this.dropdown[showSuggestions ? "show" : "hide"].call(this, value);
                }
            },
            onInputIE: function onInputIE(e) {
                var _this = this;
                // for the "e.target.textContent" to be changed, the browser requires a small delay
                setTimeout(function () {
                    _this.events.callbacks.onInput.call(_this, e);
                });
            },
            onPaste: function onPaste(e) {},
            onClickScope: function onClickScope(e) {
                if (e.target.tagName == "TAGS") this.DOM.input.focus();else if (e.target.tagName == "X") {
                    this.removeTag(e.target.parentNode);
                }
            }
        }
    },

    /**
     * If the original input had an values, add them as tags
     */
    loadOriginalValues: function loadOriginalValues() {
        var value = this.DOM.originalInput.value,
            values;

        // if the original input already had any value (tags)
        if (!value) return;

        this.addTags(value).forEach(function (tag) {
            tag && tag.classList.add('tagify--noAnim');
        });
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

            this.input.value = s;

            if (updateDOM) this.DOM.input.innerHTML = s;
            if (!s) this.dropdown.hide.call(this);
            if (s.length < 2) this.input.autocomplete.suggest.call(this, '');

            this.input.validate.call(this);
        },


        // https://stackoverflow.com/a/3866442/104380
        setRangeAtEnd: function setRangeAtEnd() {
            var range, selection;

            if (!document.createRange) return;

            range = document.createRange();
            range.selectNodeContents(this.DOM.input);
            range.collapse(false);
            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        },


        /**
         * Marks the tagify's input as "invalid" if the value did not pass "validateTag()"
         */
        validate: function validate() {
            var isValid = !this.input.value || this.validateTag.call(this, this.input.value);
            this.DOM.input.classList.toggle('tagify__input--invalid', isValid !== true);
        },


        // remove any child DOM elements that aren't of type TEXT (like <br>)
        normalize: function normalize() {
            var clone = this.DOM.input.cloneNode(true),
                v = clone.textContent.replace(/\s/g, ' '); // replace NBSPs with spaces characters

            while (clone.firstElementChild) {
                v += clone.firstElementChild.textContent;
                clone.removeChild(clone.firstElementChild);
            }

            return v.replace(/^\s+/, ""); // trimLeft
        },


        /**
         * suggest the rest of the input's value
         * @param  {String} s [description]
         */
        autocomplete: {
            suggest: function suggest(s) {
                if (s) this.DOM.input.setAttribute("data-suggest", s.substring(this.input.value.length));else this.DOM.input.removeAttribute("data-suggest");
            },
            set: function set(s) {
                var dataSuggest = this.DOM.input.getAttribute('data-suggest'),
                    suggestion = s || (dataSuggest ? this.input.value + dataSuggest : null);

                if (suggestion) {
                    this.input.set.call(this, suggestion);
                    this.input.autocomplete.suggest.call(this, '');
                    this.dropdown.hide.call(this);
                    this.input.setRangeAtEnd.call(this);
                }

                // if( suggestion && this.addTags(this.input.value + suggestion).length ){
                //     this.input.set.call(this);
                //     this.dropdown.hide.call(this);
                // }
            }
        }
    },

    getNodeIndex: function getNodeIndex(node) {
        var index = 0;
        while (node = node.previousSibling) {
            if (node.nodeType != 3 || !/^\s*$/.test(node.data)) index++;
        }return index;
    },


    /**
     * Searches if any tag with a certain value already exis
     * @param  {String} s [text value to search for]
     * @return {int}      [Position index of the tag. -1 is returned if tag is not found.]
     */
    isTagDuplicate: function isTagDuplicate(s) {
        return this.value.findIndex(function (item) {
            return s.toLowerCase() === item.value.toLowerCase();
        });
        // return this.value.some(item => s.toLowerCase() === item.value.toLowerCase());
    },


    /**
     * Mark a tag element by its value
     * @param  {String / Number} value  [text value to search for]
     * @param  {Object}          tagElm [a specific "tag" element to compare to the other tag elements siblings]
     * @return {boolean}                [found / not found]
     */
    markTagByValue: function markTagByValue(value, tagElm) {
        var tagsElms, tagsElmsLen, tagIdx;

        if (!tagElm) {
            tagIdx = this.isTagDuplicate.call(this, value);
            tagElm = this.DOM.scope.querySelectorAll('tag')[tagIdx];
        }

        // check AGAIN if "tagElm" is defined
        if (tagElm) {
            tagElm.classList.add('tagify--mark');
            setTimeout(function () {
                tagElm.classList.remove('tagify--mark');
            }, 100);
            return tagElm;
        }

        return false;
    },


    /**
     * make sure the tag, or words in it, is not in the blacklist
     */
    isTagBlacklisted: function isTagBlacklisted(v) {
        v = v.split(' ');
        return this.settings.blacklist.filter(function (x) {
            return v.indexOf(x) != -1;
        }).length;
    },


    /**
     * make sure the tag, or words in it, is not in the blacklist
     */
    isTagWhitelisted: function isTagWhitelisted(v) {
        return this.settings.whitelist.some(function (item) {
            var value = item.value ? item.value : item;
            if (value.toLowerCase() === v.toLowerCase()) return true;
        });
    },


    /**
     * validate a tag object BEFORE the actual tag will be created & appeneded
     * @param  {String} s
     * @return {Boolean/String}  ["true" if validation has passed, String for a fail]
     */
    validateTag: function validateTag(s) {
        var value = s.trim(),
            maxTagsExceed = this.value.length >= this.settings.maxTags,
            isDuplicate,
            eventName__error,
            result = true;

        // check for empty value
        if (!value) result = this.TEXTS.empty;else if (maxTagsExceed) result = this.TEXTS.exceed;

        // if minimum or maximum lengths were provided check that the string adheres to them.
        else if ( (this.settings.minTagLength && value.length < this.settings.minTagLength) || (this.settings.maxTagLength && value.length > this.settings.maxTagLength) ) result = this.TEXTS.stringLength;

        // check if pattern should be used and if so, use it to test the value
        else if (this.settings.pattern && !this.settings.pattern.test(value)) result = this.TEXTS.pattern;

            // if duplicates are not allowed and there is a duplicate
            else if (!this.settings.duplicates && this.isTagDuplicate(value) !== -1) result = this.TEXTS.duplicate;else if (this.isTagBlacklisted(value) || this.settings.enforceWhitelist && !this.isTagWhitelisted(value)) result = this.TEXTS.notAllowed;

        return result;
    },


    /**
     * pre-proccess the tagsItems, which can be a complex tagsItems like an Array of Objects or a string comprised of multiple words
     * so each item should be iterated on and a tag created for.
     * @return {Array} [Array of Objects]
     */
    normalizeTags: function normalizeTags(tagsItems) {
        var _this3 = this;

        var whitelistWithProps = this.settings.whitelist[0] instanceof Object,
            isComplex = tagsItems instanceof Array && "value" in tagsItems[0],
            // checks if the value is a "complex" which means an Array of Objects, each object is a tag
        temp = [];

        // no need to continue if "tagsItems" is an Array of Objects
        if (isComplex) return tagsItems;

        // if the value is a "simple" String, ex: "aaa, bbb, ccc"
        if (!isComplex) {
            if (!tagsItems.trim()) return [];

            // go over each tag and add it (if there were multiple ones)
            tagsItems = tagsItems.split(this.settings.delimiters).filter(function (n) {
                return n;
            }).map(function (v) {
                return { value: v.trim() };
            });
        }

        // search if the tag exists in the whitelist as an Object (has props), to be able to use its properties
        if (!isComplex && whitelistWithProps) {
            tagsItems.forEach(function (tag) {
                var matchObj = _this3.settings.whitelist.filter(function (WL_item) {
                    return WL_item.value.toLowerCase() == tag.value.toLowerCase();
                });
                if (matchObj[0]) temp.push(matchObj[0]); // set the Array (with the found Object) as the new value
                else temp.push(tag);
            });

            tagsItems = temp;
        }

        return tagsItems;
    },


    /**
     * add a "tag" element to the "tags" component
     * @param {String/Array} tagsItems [A string (single or multiple values with a delimiter), or an Array of Objects]
     * @param {Boolean} clearInput [flag if the input's value should be cleared after adding tags]
     * @return {Array} Array of DOM elements (tags)
     */
    addTags: function addTags(tagsItems, clearInput) {
        var _this4 = this;

        var tagElems = [];

        this.DOM.input.removeAttribute('style');

        tagsItems = this.normalizeTags.call(this, tagsItems);

        tagsItems.forEach(function (tagData) {
            var tagValidation, tagElm;

            if (typeof _this4.settings.transformTag === 'function') {
                tagData.value = _this4.settings.transformTag.call(_this4, tagData.value) || tagData.value;
            }

            tagValidation = _this4.validateTag.call(_this4, tagData.value);

            if (tagValidation !== true) {
                tagData.class = tagData.class ? tagData.class + " tagify--notAllowed" : "tagify--notAllowed";
                tagData.title = tagValidation;
                _this4.markTagByValue.call(_this4, tagData.value);
                _this4.trigger("invalid", { value: tagData.value, index: _this4.value.length, message: tagValidation });
            }

            // Create tag HTML element
            tagElm = _this4.createTagElem(tagData);
            tagElems.push(tagElm);

            // add the tag to the component's DOM
            appendTag.call(_this4, tagElm);

            if (tagValidation === true) {
                // update state
                _this4.value.push(tagData);
                _this4.update();
                _this4.trigger('add', _this4.extend({}, { index: _this4.value.length, tag: tagElm }, tagData));
            } else if (!_this4.settings.keepInvalidTags) {
                // remove invalid tags (if "keepInvalidTags" is set to "false")
                setTimeout(function () {
                    _this4.removeTag(tagElm, true);
                }, 1000);
            }
        });

        if (tagsItems.length && clearInput) {
            this.input.set.call(this);
        }

        /**
         * appened (validated) tag to the component's DOM scope
         * @return {[type]} [description]
         */
        function appendTag(tagElm) {
            var insertBeforeNode = this.DOM.scope.lastElementChild;

            if (insertBeforeNode === this.DOM.input) this.DOM.scope.insertBefore(tagElm, insertBeforeNode);else this.DOM.scope.appendChild(tagElm);
        }

        return tagElems;
    },


    /**
     * creates a DOM tag element and injects it into the component (this.DOM.scope)
     * @param  Object}  tagData [text value & properties for the created tag]
     * @return {Object} [DOM element]
     */
    createTagElem: function createTagElem(tagData) {
        var tagElm,
            v = this.escapeHtml(tagData.value),
            template = '<tag title=\'' + v + '\'>\n                            <x title=\'\'></x><div><span>' + v + '</span></div>\n                        </tag>';

        if (typeof this.settings.tagTemplate === "function") {
            try {
                template = this.settings.tagTemplate(v, tagData);
            } catch (err) {}
        }

        // for a certain Tag element, add attributes.
        function addTagAttrs(tagElm, tagData) {
            var i,
                keys = Object.keys(tagData);
            for (i = keys.length; i--;) {
                var propName = keys[i];
                if (!tagData.hasOwnProperty(propName)) return;
                tagElm.setAttribute(propName, tagData[propName]);
            }
        }

        tagElm = this.parseHTML(template);

        // add any attribuets, if exists
        addTagAttrs(tagElm, tagData);

        return tagElm;
    },


    /**
     * Removes a tag
     * @param  {Object}  tagElm          [DOM element]
     * @param  {Boolean} silent          [A flag, which when turned on, does not removes any value and does not update the original input value but simply removes the tag from tagify]
     * @param  {Number}  tranDuration    [Transition duration in MS]
     */
    removeTag: function removeTag(tagElm, silent) {
        var tranDuration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 250;

        if (!tagElm) return;

        var tagData,
            tagIdx = this.getNodeIndex(tagElm);

        if (!tagElm) return;

        if (tranDuration && tranDuration > 10) animation();else removeNode();

        if (!silent) {
            tagData = this.value.splice(tagIdx, 1)[0]; // remove the tag from the data object
            this.update(); // update the original input with the current value
            this.trigger('remove', this.extend({}, { index: tagIdx, tag: tagElm }, tagData));
        }

        function animation() {
            tagElm.style.width = parseFloat(window.getComputedStyle(tagElm).width) + 'px';
            document.body.clientTop; // force repaint for the width to take affect before the "hide" class below
            tagElm.classList.add('tagify--hide');

            // manual timeout (hack, since transitionend cannot be used because of hover)
            setTimeout(removeNode, 400);
        }

        function removeNode() {
            tagElm.parentNode.removeChild(tagElm);
        }
    },
    removeAllTags: function removeAllTags() {
        this.value = [];
        this.update();
        Array.prototype.slice.call(this.DOM.scope.querySelectorAll('tag')).forEach(function (elm) {
            return elm.parentNode.removeChild(elm);
        });
    },


    /**
     * update the origianl (hidden) input field's value
     * see - https://stackoverflow.com/q/50957841/104380
     */
    update: function update() {
        var _this5 = this;

        var tagsAsString = this.value.map(function (v) {
            return v[_this5.settings.mapValueToProp || "value"] || v.value;
        });
        this.DOM.originalInput.value = JSON.stringify(tagsAsString);
    },


    /**
     * Dropdown controller
     * @type {Object}
     */
    dropdown: {
        init: function init() {
            this.DOM.dropdown = this.dropdown.build.call(this);
        },
        build: function build() {
            var className = ('tagify__dropdown ' + this.settings.dropdown.classname).trim(),
                template = '<div class="' + className + '"></div>';
            return this.parseHTML(template);
        },
        show: function show(value) {
            var listItems = this.dropdown.filterListItems.call(this, value),
                listHTML = this.dropdown.createListHTML.call(this, listItems);

            // set the first item from the suggestions list as the autocomplete value
            if (this.settings.autoComplete) {
                this.input.autocomplete.suggest.call(this, listItems.length ? listItems[0].value : '');
            }

            if (!listHTML || listItems.length < 2) {
                this.dropdown.hide.call(this);
                return;
            }

            this.DOM.dropdown.innerHTML = listHTML;
            this.dropdown.position.call(this);

            // if the dropdown has yet to be appended to the document,
            // append the dropdown to the body element & handle events
            if (!this.DOM.dropdown.parentNode != document.body) {
                document.body.appendChild(this.DOM.dropdown);
                this.events.binding.call(this, false); // unbind the main events
                this.dropdown.events.binding.call(this);
            }
        },
        hide: function hide() {
            if (!this.DOM.dropdown || this.DOM.dropdown.parentNode != document.body) return;

            document.body.removeChild(this.DOM.dropdown);
            window.removeEventListener('resize', this.dropdown.position);

            this.dropdown.events.binding.call(this, false); // unbind all events
            this.events.binding.call(this); // re-bind main events
        },
        position: function position() {
            var rect = this.DOM.scope.getBoundingClientRect();

            this.DOM.dropdown.style.cssText = "left: " + (rect.left + window.pageXOffset) + "px; \
                                               top: " + (rect.top + rect.height - 1 + window.pageYOffset) + "px; \
                                               width: " + rect.width + "px";
        },


        /**
         * @type {Object}
         */
        events: {

            /**
             * Events should only be binded when the dropdown is rendered and removed when isn't
             * @param  {Boolean} bindUnbind [optional. true when wanting to unbind all the events]
             * @return {[type]}             [description]
             */
            binding: function binding() {
                var bindUnbind = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

                // references to the ".bind()" methods must be saved so they could be unbinded later
                var _CBR = this.listeners.dropdown = this.listeners.dropdown || {
                    position: this.dropdown.position.bind(this),
                    onKeyDown: this.dropdown.events.callbacks.onKeyDown.bind(this),
                    onMouseOver: this.dropdown.events.callbacks.onMouseOver.bind(this),
                    onClick: this.dropdown.events.callbacks.onClick.bind(this)
                },
                    action = bindUnbind ? 'addEventListener' : 'removeEventListener';

                window[action]('resize', _CBR.position);
                window[action]('keydown', _CBR.onKeyDown);
                window[action]('click', _CBR.onClick);

                this.DOM.dropdown[action]('mouseover', _CBR.onMouseOver);
                //  this.DOM.dropdown[action]('click', _CBR.onClick);
            },


            callbacks: {
                onKeyDown: function onKeyDown(e) {
                    var selectedElm = this.DOM.dropdown.querySelectorAll("[class$='--active']")[0],
                        newValue = "";

                    switch (e.key) {
                        case 'ArrowDown':
                        case 'ArrowUp':
                        case 'Down': // >IE11
                        case 'Up':
                            // >IE11
                            e.preventDefault();
                            if (selectedElm) selectedElm = selectedElm[(e.key == 'ArrowUp' || e.key == 'Up' ? "previous" : "next") + "ElementSibling"];

                            // if no element was found, loop
                            if (!selectedElm) selectedElm = this.DOM.dropdown.children[e.key == 'ArrowUp' || e.key == 'Up' ? this.DOM.dropdown.children.length - 1 : 0];

                            this.dropdown.highlightOption.call(this, selectedElm);
                            break;

                        case 'Escape':
                        case 'Esc':
                            // IE11
                            this.dropdown.hide.call(this);
                            break;

                        case 'Enter':
                            e.preventDefault();
                            newValue = selectedElm ? selectedElm.textContent : this.input.value;
                            this.addTags(newValue, true);
                            this.dropdown.hide.call(this);
                            break;

                        case 'ArrowRight':
                            this.input.autocomplete.set.call(this, selectedElm ? selectedElm.textContent : null);
                            break;
                    }
                },
                onMouseOver: function onMouseOver(e) {
                    // event delegation check
                    if (e.target.className.includes('__item')) this.dropdown.highlightOption.call(this, e.target);
                },
                onClick: function onClick(e) {
                    var listItemElm = [e.target, e.target.parentNode].filter(function (a) {
                        return a.className.includes("tagify__dropdown__item");
                    })[0];

                    if (listItemElm) {
                        this.input.set.call(this);
                        this.addTags(listItemElm.textContent);
                    }
                    // clicked outside the dropdown, so just close it
                    this.dropdown.hide.call(this);
                }
            }
        },

        highlightOption: function highlightOption(elm) {
            if (!elm) return;
            var className = "tagify__dropdown__item--active";

            // for IE support, which doesn't allow "forEach" on "NodeList" Objects
            [].forEach.call(this.DOM.dropdown.querySelectorAll("[class$='--active']"), function (activeElm) {
                return activeElm.classList.remove(className);
            });

            // this.DOM.dropdown.querySelectorAll("[class$='--active']").forEach(activeElm => activeElm.classList.remove(className));
            elm.classList.add(className);

            elm.parentNode.scrollTop = elm.clientHeight + elm.offsetTop - elm.parentNode.clientHeight;
        },


        /**
         * returns an HTML string of the suggestions' list items
         * @return {[type]} [description]
         */
        filterListItems: function filterListItems(value) {
            if (!value) return "";

            var list = [],
                whitelist = this.settings.whitelist,
                suggestionsCount = this.settings.dropdown.maxItems || Infinity,
                whitelistItem,
                valueIsInWhitelist,
                i = 0;

            for (; i < whitelist.length; i++) {
                whitelistItem = whitelist[i] instanceof Object ? whitelist[i] : { value: whitelist[i] }, //normalize value as an Object
                valueIsInWhitelist = whitelistItem.value.toLowerCase().replace(/\s/g, '').indexOf(value.toLowerCase().replace(/\s/g, '')) == 0; // for fuzzy-search use ">="

                // match for the value within each "whitelist" item
                if (valueIsInWhitelist && this.isTagDuplicate(whitelistItem.value) == -1 && suggestionsCount--) list.push(whitelistItem);
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
            var getItem = this.settings.dropdown.itemTemplate || function (item) {
                return '<div class=\'tagify__dropdown__item ' + (item.class ? item.class : "") + '\' ' + getAttributesString(item) + '>' + item.value + '</div>';
            };

            // for a certain Tag element, add attributes.
            function getAttributesString(item) {
                var i,
                    keys = Object.keys(item),
                    s = "";
                for (i = keys.length; i--;) {
                    var propName = keys[i];
                    if (propName != 'class' && !item.hasOwnProperty(propName)) return;
                    s += " " + propName + (item[propName] ? "=" + item[propName] : "");
                }
                return s;
            }

            return list.map(getItem).join("");
        }
    }
};
return Tagify;
}));
