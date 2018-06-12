/**
 * Tagify (v 1.3.1)- tags input component
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

    this.settings = this.extend({}, settings, this.DEFAULTS);
    this.settings.readonly = input.hasAttribute('readonly'); // if "readonly" do not include an "input" element inside the Tags component

    if (input.pattern) try {
        this.settings.pattern = new RegExp(input.pattern);
    } catch (e) {}

    // Convert the "delimiters" setting into a REGEX object
    if (this.settings && this.settings.delimiters) {
        try {
            this.settings.delimiters = new RegExp("[" + this.settings.delimiters + "]", "g");
        } catch (e) {}
    }

    this.id = Math.random().toString(36).substr(2, 9), // almost-random ID (because, fuck it)
    this.value = []; // An array holding all the (currently used) tags
    this.DOM = {}; // Store all relevant DOM elements in an Object
    this.extend(this, new this.EventDispatcher());
    this.build(input);

    this.events.customBinding.call(this);
    this.events.binding.call(this);
}

Tagify.prototype = {
    DEFAULTS: {
        delimiters: ",", // [regex] split tags by any of these delimiters ("null" to cancel)
        pattern: "", // pattern to validate input by
        maxTags: Infinity, // maximum number of tags
        callbacks: {}, // exposed callbacks object to be triggered on certain events
        addTagOnBlur: false, // flag - automatically adds the text which was inputed as a tag when blur event happens
        duplicates: false, // flag - allow tuplicate tags
        whitelist: [], // is this list has any items, then only allow tags from this list
        blacklist: [], // a list of non-allowed tags
        enforceWhitelist: false, // flag - should ONLY use tags allowed in whitelist
        autocomplete: true, // flag - show native suggeestions list as you type
        suggestionsMinChars: 2, // minimum characters to input to see sugegstions list
        maxSuggestions: 10
    },

    customEventsList: ['add', 'remove', 'duplicate', 'maxTagsExceed', 'blacklisted', 'notWhitelisted'],

    /**
     * utility method
     * https://stackoverflow.com/a/35385518/104380
     * @param  {String} s [HTML string]
     * @return {Object}   [DOM node]
     */
    parseHTML: function parseHTML(s) {
        var t = document.createElement('template');
        t.innerHTML = s.trim();
        return t.content.firstChild;
    },


    /**
     * builds the HTML of this component
     * @param  {Object} input [DOM element which would be "transformed" into "Tags"]
     */
    build: function build(input) {
        var that = this,
            value = input.value,
            template = '\n                <tags class="' + input.className + ' ' + (this.settings.readonly ? 'readonly' : '') + '">\n                    <div contenteditable data-placeholder="' + input.placeholder + '" class="placeholder"></div>\n                </tags>';

        this.DOM.originalInput = input;
        this.DOM.scope = this.parseHTML(template);
        this.DOM.input = this.DOM.scope.querySelector('[contenteditable]');
        input.parentNode.insertBefore(this.DOM.scope, input);

        // this.DOM.scope.innerHTML = `<div contenteditable data-placeholder="${input.placeholder}"></div>`;
        // this.DOM.scope.classList.toggle(input.className, input.className); // copy any class names from the original input element to the Tags element
        // this.DOM.scope.classList.toggle('readonly', this.settings.readonly);

        // if "autocomplete" flag on toggeled & "whitelist" has items, build suggestions list
        if (this.settings.autocomplete && this.settings.whitelist.length) {
            this.dropdown.init.call(this);
            // this.DOM.datalist = this.buildDataList();
        }

        // if the original input already had any value (tags)
        if (value) this.addTags(value).forEach(function (tag) {
            tag && tag.classList.add('tagify--noAnim');
        });
    },


    /**
     * Reverts back any changes made by this component
     */
    destroy: function destroy() {
        this.DOM.scope.parentNode.removeChild(this.DOM.scope);
    },


    /**
     * Merge two objects into a new one
     */
    extend: function extend(o, o1, o2) {
        if (!(o instanceof Object)) o = {};

        if (o2) {
            copy(o, o2);
            copy(o, o1);
        } else copy(o, o1);

        function copy(a, b) {
            // copy o2 to o
            for (var key in b) {
                if (b.hasOwnProperty(key)) a[key] = b[key];
            }
        }

        return o;
    },


    /**
     * A constructor for exposing events to the outside
     */
    EventDispatcher: function EventDispatcher() {
        // Create a DOM EventTarget object
        var target = document.createTextNode('');

        // Pass EventTarget interface calls to DOM EventTarget object
        this.off = target.removeEventListener.bind(target);
        this.on = target.addEventListener.bind(target);
        this.trigger = function (eventName, data) {
            var e;
            if (!eventName) return;

            if (this.isJQueryPlugin) $(this.DOM.originalInput).triggerHandler(eventName, [data]);else {
                try {
                    e = new CustomEvent(eventName, { "detail": data });
                } catch (err) {
                    e = document.createEvent("Event");
                    e.initEvent("toggle", false, false);
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
            var _this = this;

            this.customEventsList.forEach(function (name) {
                _this.on(name, _this.settings.callbacks[name]);
            });
        },
        binding: function binding() {
            var bindUnbind = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            var _CB = this.events.callbacks,

            // setup callback references so events could be removed later
            _CR = this.events._CR = this.events._CR || {
                paste: ['input', _CB.onPaste.bind(this)],
                focus: ['input', _CB.onFocusBlur.bind(this)],
                blur: ['input', _CB.onFocusBlur.bind(this)],
                //    input   : ['input', _CB.onInput.bind(this)],
                keydown: ['input', _CB.onKeydown.bind(this)],
                click: ['scope', _CB.onClickScope.bind(this)]
            },
                action = bindUnbind ? 'addEventListener' : 'removeEventListener';

            for (var eventName in _CR) {
                this.DOM[_CR[eventName][0]][action](eventName, _CR[eventName][1]);
            }

            if (bindUnbind) {
                // this event should not be unbinded ever
                this.DOM.input.addEventListener("input", _CB.onInput.bind(this));

                if (this.isJQueryPlugin) $(this.DOM.originalInput).on('tagify.removeAllTags', this.removeAllTags.bind(this));
            }
        },


        /**
         * DOM events callbacks
         */
        callbacks: {
            onFocusBlur: function onFocusBlur(e) {
                var text = e.target.textContent.trim();

                if (e.type == "focus") e.target.className = 'input';else if (e.type == "blur" && text) {
                    if (this.settings.addTagOnBlur && this.addTags(text).length) e.target.textContent = '';
                } else {
                    e.target.className = 'input placeholder';
                    this.DOM.input.removeAttribute('style');
                    this.dropdown.hide.call(this);
                }
            },
            onKeydown: function onKeydown(e) {
                var s = e.target.textContent,
                    lastTag,
                    that = this;

                if (e.key == "Backspace" && (s == "" || s.charCodeAt(0) == 8203)) {
                    lastTag = this.DOM.scope.querySelectorAll('tag:not(.tagify--hide)');
                    lastTag = lastTag[lastTag.length - 1];
                    this.removeTag(lastTag);
                }

                if (e.key == "Escape") {
                    e.target.textContent = '';
                    e.target.blur();
                }

                if (e.key == "Enter") {
                    e.preventDefault(); // solves Chrome bug - http://stackoverflow.com/a/20398191/104380
                    s = e.target.textContent;
                    if (this.addTags(s).length) e.target.textContent = '';

                    e.target.textContent.replace(/<br>/g, "");

                    return false;
                }
            },
            onInput: function onInput(e) {
                var value = e.target.textContent.slice(),
                    lastChar = value[value.length - 1],
                    showSuggestions = value.length >= this.settings.suggestionsMinChars;

                if (value.search(this.settings.delimiters) != -1) {
                    if (this.addTags(value).length) e.target.textContent = ''; // clear the input field's value
                } else if (this.settings.autocomplete && this.settings.whitelist.length) {
                    this.dropdown[showSuggestions ? "show" : "hide"].call(this, value);
                }
            },
            onPaste: function onPaste(e) {},
            onClickScope: function onClickScope(e) {
                if (e.target.tagName == "TAGS") this.DOM.input.focus();
                if (e.target.tagName == "X") {
                    this.removeTag(e.target.parentNode);
                }
            }
        }
    },

    /**
     * Build tags suggestions using HTML datalist
     * @return {[type]} [description]
     */
    buildDataList: function buildDataList() {
        var OPTIONS = "",
            i,
            datalist = document.createElement('datalist');

        datalist.id = 'tagifySuggestions' + this.id;
        datalist.innerHTML = "<label> \
                                select from the list: \
                                <select> \
                                    <option value=''></option> \
                                    [OPTIONS] \
                                </select> \
                            </label>";

        for (i = this.settings.whitelist.length; i--;) {
            OPTIONS += "<option>" + this.settings.whitelist[i] + "</option>";
        }datalist.innerHTML = datalist.innerHTML.replace('[OPTIONS]', OPTIONS); // inject the options string in the right place

        //  this.DOM.input.insertAdjacentHTML('afterend', datalist); // append the datalist HTML string in the Tags

        return datalist;
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
     * @return {boolean}  [found / not found]
     */
    isTagDuplicate: function isTagDuplicate(s) {
        return this.value.some(function (item) {
            return s.toLowerCase() === item.value.toLowerCase();
        });
    },


    /**
     * Mark a tag element by its value
     * @param  {String / Number} value  [text value to search for]
     * @param  {Object}          tagElm [a specific "tag" element to compare to the other tag elements siblings]
     * @return {boolean}                [found / not found]
     */
    markTagByValue: function markTagByValue(value, tagElm) {
        var tagsElms, tagsElmsLen;

        if (!tagElm) {
            tagsElms = this.DOM.scope.querySelectorAll('tag');
            for (tagsElmsLen = tagsElms.length; tagsElmsLen--;) {
                if (tagsElms[tagsElmsLen].value.toLowerCase().includes(value.toLowerCase())) tagElm = tagsElms[tagsElmsLen];
            }
        }

        // check AGAIN if "tagElm" is defined
        if (tagElm) {
            tagElm.classList.add('tagify--mark');
            setTimeout(function () {
                tagElm.classList.remove('tagify--mark');
            }, 2000);
            return true;
        } else {}

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
        return this.settings.whitelist.indexOf(v) != -1;
    },


    /**
     * add a "tag" element to the "tags" component
     * @param  {String/Array} tagsItems [A string (single or multiple values with a delimiter), or an Array of Objects]
     * @return {Array} Array of DOM elements (tags)
     */
    addTags: function addTags(tagsItems) {
        var that = this,
            tagElems = [];

        this.DOM.input.removeAttribute('style');

        /**
         * pre-proccess the tagsItems, which can be a complex tagsItems like an Array of Objects or a string comprised of multiple words
         * so each item should be iterated on and a tag created for.
         * @return {Array} [Array of Objects]
         */
        function normalizeTags(tagsItems) {
            var whitelistWithProps = this.settings.whitelist[0] instanceof Object,
                isComplex = tagsItems instanceof Array && "value" in tagsItems[0],
                // checks if the value is a "complex" which means an Array of Objects, each object is a tag
            result = tagsItems; // the returned result

            // no need to continue if "tagsItems" is an Array of Objects
            if (isComplex) return result;

            // search if the tag exists in the whitelist as an Object (has props), to be able to use its properties
            if (!isComplex && typeof tagsItems == "string" && whitelistWithProps) {
                var matchObj = this.settings.whitelist.filter(function (item) {
                    return item.value.toLowerCase() == tagsItems.toLowerCase();
                });

                if (matchObj[0]) {
                    isComplex = true;
                    result = matchObj; // set the Array (with the found Object) as the new value
                }
            }

            // if the value is a "simple" String, ex: "aaa, bbb, ccc"
            if (!isComplex) {
                tagsItems = tagsItems.trim();
                if (!tagsItems) return [];

                // go over each tag and add it (if there were multiple ones)
                result = tagsItems.split(this.settings.delimiters).map(function (v) {
                    return { value: v.trim() };
                });
            }

            return result.filter(function (n) {
                return n;
            }); // cleanup the array from "undefined", "false" or empty items;
        }

        /**
         * validate a tag object BEFORE the actual tag will be created & appeneded
         * @param  {Object} tagData  [{"value":"text", "class":whatever", ...}]
         * @return {Boolean/String}  ["true" if validation has passed, String or "false" for any type of error]
         */
        function validateTag(tagData) {
            var value = tagData.value.trim(),
                maxTagsExceed = this.value.length >= this.settings.maxTags,
                isDuplicate,
                eventName__error,
                tagAllowed;

            // check for empty value
            if (!value) return "empty";

            // check if pattern should be used and if so, use it to test the value
            if (this.settings.pattern && !this.settings.pattern.test(value)) return "pattern";

            // check if the tag already exists
            if (this.isTagDuplicate(value)) {
                this.trigger('duplicate', value);

                if (!this.settings.duplicates) {
                    // this.markTagByValue(value, tagElm)
                    return "duplicate";
                }
            }

            // check if the tag is allowed by the rules set
            tagAllowed = !this.isTagBlacklisted(value) && (!this.settings.enforceWhitelist || this.isTagWhitelisted(value)) && !maxTagsExceed;

            // Check against blacklist & whitelist (if enforced)
            if (!tagAllowed) {
                tagData.class = tagData.class ? tagData.class + " tagify--notAllowed" : "tagify--notAllowed";

                // broadcast why the tag was not allowed
                if (maxTagsExceed) eventName__error = 'maxTagsExceed';else if (this.isTagBlacklisted(value)) eventName__error = 'blacklisted';else if (this.settings.enforceWhitelist && !this.isTagWhitelisted(value)) eventName__error = 'notWhitelisted';

                this.trigger(eventName__error, { value: value, index: this.value.length });

                return "notAllowed";
            }

            return true;
        }

        /**
         * appened (validated) tag to the component's DOM scope
         * @return {[type]} [description]
         */
        function appendTag(tagElm) {
            this.DOM.scope.insertBefore(tagElm, this.DOM.input);
        }

        //////////////////////
        tagsItems = normalizeTags.call(this, tagsItems);

        tagsItems.forEach(function (tagData) {
            var isTagValidated = validateTag.call(that, tagData);

            if (isTagValidated === true || isTagValidated == "notAllowed") {
                // create the tag element
                var tagElm = that.createTagElem(tagData);

                // add the tag to the component's DOM
                appendTag.call(that, tagElm);

                // remove the tag "slowly"
                if (isTagValidated == "notAllowed") {
                    setTimeout(function () {
                        that.removeTag(tagElm, true);
                    }, 1000);
                } else {
                    // update state
                    that.value.push(tagData);
                    that.update();
                    that.trigger('add', that.extend({}, tagData, { index: that.value.length, tag: tagElm }));

                    tagElems.push(tagElm);
                }
            }
        });

        return tagElems;
    },


    /**
     * creates a DOM tag element and injects it into the component (this.DOM.scope)
     * @param  Object}  tagData [text value & properties for the created tag]
     * @return {Object} [DOM element]
     */
    createTagElem: function createTagElem(tagData) {
        var tagElm,
            template = '<tag>\n                            <x></x><div><span title=\'' + tagData.value + '\'></span></div>\n                        </tag>';

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
        tagElm.querySelector('span').innerText = tagData.value; // escaping HTML

        // add any attribuets, if exists
        addTagAttrs(tagElm, tagData);

        return tagElm;
    },


    /**
     * Removes a tag
     * @param  {Object}  tagElm    [DOM element]
     * @param  {Boolean} silent    [A flag, which when turned on, does not removes any value and does not update the original input value but simply removes the tag from tagify]
     */
    removeTag: function removeTag(tagElm, silent) {
        var tagData,
            tagIdx = this.getNodeIndex(tagElm);

        if (!tagElm) return;

        tagElm.style.width = parseFloat(window.getComputedStyle(tagElm).width) + 'px';
        document.body.clientTop; // force repaint for the width to take affect before the "hide" class below
        tagElm.classList.add('tagify--hide');

        // manual timeout (hack, since transitionend cannot be used because of hover)
        setTimeout(function () {
            tagElm.parentNode.removeChild(tagElm);
        }, 400);

        if (!silent) {
            tagData = this.value.splice(tagIdx, 1)[0]; // remove the tag from the data object
            this.update(); // update the original input with the current value
            this.trigger('remove', this.extend({}, tagData, { index: tagIdx, tag: tagElm }));
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
     */
    update: function update() {
        var tagsAsString = this.value.map(function (v) {
            return v.value;
        }).join(',');
        this.DOM.originalInput.value = tagsAsString;
    },


    /**
     * Dropdown controller
     * @type {Object}
     */
    dropdown: {
        init: function init() {
            this.DOM.dropdown = this.dropdown.build();
        },
        build: function build() {
            var elm = document.createElement('div');
            elm.className = 'tagify__dropdown';

            return elm;
        },
        show: function show(value) {
            var listItems = this.dropdown.createListItems.call(this, value);

            if (!listItems) {
                this.dropdown.hide.call(this);
                return;
            }

            this.DOM.dropdown.innerHTML = listItems;

            this.dropdown.position.call(this);

            if (!this.DOM.dropdown.parentNode) {
                document.body.appendChild(this.DOM.dropdown);
                this.events.binding.call(this, false); // unbind the main events
                this.dropdown.events.binding.call(this);
            }
        },
        hide: function hide() {
            if (!this.DOM.dropdown.parentNode) return;

            document.body.removeChild(this.DOM.dropdown);
            window.removeEventListener('resize', this.dropdown.position);

            this.dropdown.events.binding.call(this, false); // unbind all events
            this.events.binding.call(this); // re-bind main events
        },
        position: function position() {
            var rect = this.DOM.scope.getBoundingClientRect();

            this.DOM.dropdown.style.cssText = "left: " + rect.left + "px; \
                                               top: " + (rect.top + rect.height - 1) + "px; \
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
                var _EC = this.dropdown.events._CR = this.dropdown.events._CR || {
                    position: this.dropdown.position.bind(this),
                    onKeyDown: this.dropdown.events.callbacks.onKeyDown.bind(this),
                    onMouseOver: this.dropdown.events.callbacks.onMouseOver.bind(this),
                    onClick: this.dropdown.events.callbacks.onClick.bind(this)
                },
                    action = bindUnbind ? 'addEventListener' : 'removeEventListener';

                window[action]('resize', _EC.position);
                window[action]('keydown', _EC.onKeyDown);
                window[action]('click', _EC.onClick);

                this.DOM.dropdown[action]('mouseover', _EC.onMouseOver);
                //  this.DOM.dropdown[action]('click', _EC.onClick);
            },


            callbacks: {
                onKeyDown: function onKeyDown(e) {
                    var selectedElm = this.DOM.dropdown.querySelectorAll("[class$='--active']")[0];

                    if (e.key == 'ArrowDown' || e.key == 'ArrowUp') {
                        e.preventDefault();
                        if (selectedElm) {
                            selectedElm = selectedElm[e.key == 'ArrowUp' ? "previousElementSibling" : "nextElementSibling"];
                        }
                        // if no element was found, loop
                        if (!selectedElm) selectedElm = this.DOM.dropdown.children[e.key == 'ArrowUp' ? this.DOM.dropdown.children.length - 1 : 0];

                        this.dropdown.highlightOption.call(this, selectedElm);
                    }

                    if (e.key == 'Escape') {
                        this.dropdown.hide.call(this);
                    }

                    if (e.key == 'Enter') {
                        this.DOM.input.textContent = '';
                        selectedElm && this.addTags(selectedElm.textContent);
                        this.dropdown.hide.call(this);
                    }
                },
                onMouseOver: function onMouseOver(e) {
                    // event delegation check
                    if (e.target.className.includes('__item')) this.dropdown.highlightOption.call(this, e.target);
                },
                onClick: function onClick(e) {
                    if (e.target.className.includes('tagify__dropdown__item')) {
                        this.DOM.input.textContent = '';
                        this.addTags(e.target.textContent);
                    }
                    // clicked outside the dropdown, so just close it
                    this.dropdown.hide.call(this);
                }
            }
        },

        highlightOption: function highlightOption(elm) {
            if (!elm) return;
            var className = "tagify__dropdown__item--active";
            this.DOM.dropdown.querySelectorAll("[class$='--active']").forEach(function (activeElm) {
                return activeElm.classList.remove(className);
            });
            elm.classList.add(className);
        },


        /**
         * returns an HTML string of the suggestions' list items
         * @return {[type]} [description]
         */
        createListItems: function createListItems(value) {
            if (!value) return "";

            var list = "",
                className = "tagify__dropdown__item",
                suggestionsCount = this.settings.maxSuggestions || Infinity,
                i = 0;

            for (; i < this.settings.whitelist.length; i++) {
                var whitelistItem = this.settings.whitelist[i];
                // match for the value within each "whitelist" item
                if (whitelistItem.toLowerCase().indexOf(value.toLowerCase()) >= 0 && suggestionsCount--) list += '<div class=\'' + className + '\'>' + whitelistItem + '</div>'; // ${ list == "" ? className + "--active" : ""}
                if (suggestionsCount == 0) break;
            }

            return list;
        }
    }
};
return Tagify;
}));
