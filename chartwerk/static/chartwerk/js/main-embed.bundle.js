(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*! pym.js - v1.3.2 - 2017-08-13 */
/*
* Pym.js is library that resizes an iframe based on the width of the parent and the resulting height of the child.
* Check out the docs at http://blog.apps.npr.org/pym.js/ or the readme at README.md for usage.
*/

/** @module pym */
(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    }
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
      if (typeof window.pym === 'undefined') {
        window.pym = factory.call(this);
      }
    }
})(function() {
    var MESSAGE_DELIMITER = 'xPYMx';

    var lib = {};

    /**
    * Create and dispatch a custom pym event
    *
    * @method _raiseCustomEvent
    * @inner
    *
    * @param {String} eventName
    */
   var _raiseCustomEvent = function(eventName) {
     var event = document.createEvent('Event');
     event.initEvent('pym:' + eventName, true, true);
     document.dispatchEvent(event);
   };

    /**
    * Generic function for parsing URL params.
    * Via http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
    *
    * @method _getParameterByName
    * @inner
    *
    * @param {String} name The name of the paramter to get from the URL.
    */
    var _getParameterByName = function(name) {
        var regex = new RegExp("[\\?&]" + name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]') + '=([^&#]*)');
        var results = regex.exec(location.search);

        if (results === null) {
            return '';
        }

        return decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    /**
     * Check the message to make sure it comes from an acceptable xdomain.
     * Defaults to '*' but can be overriden in config.
     *
     * @method _isSafeMessage
     * @inner
     *
     * @param {Event} e The message event.
     * @param {Object} settings Configuration.
     */
    var _isSafeMessage = function(e, settings) {
        if (settings.xdomain !== '*') {
            // If origin doesn't match our xdomain, return.
            if (!e.origin.match(new RegExp(settings.xdomain + '$'))) { return; }
        }

        // Ignore events that do not carry string data #151
        if (typeof e.data !== 'string') { return; }

        return true;
    };

    /**
     * Construct a message to send between frames.
     *
     * NB: We use string-building here because JSON message passing is
     * not supported in all browsers.
     *
     * @method _makeMessage
     * @inner
     *
     * @param {String} id The unique id of the message recipient.
     * @param {String} messageType The type of message to send.
     * @param {String} message The message to send.
     */
    var _makeMessage = function(id, messageType, message) {
        var bits = ['pym', id, messageType, message];

        return bits.join(MESSAGE_DELIMITER);
    };

    /**
     * Construct a regex to validate and parse messages.
     *
     * @method _makeMessageRegex
     * @inner
     *
     * @param {String} id The unique id of the message recipient.
     */
    var _makeMessageRegex = function(id) {
        var bits = ['pym', id, '(\\S+)', '(.*)'];

        return new RegExp('^' + bits.join(MESSAGE_DELIMITER) + '$');
    };

    /**
    * Underscore implementation of getNow
    *
    * @method _getNow
    * @inner
    *
    */
    var _getNow = Date.now || function() {
        return new Date().getTime();
    };

    /**
    * Underscore implementation of throttle
    *
    * @method _throttle
    * @inner
    *
    * @param {function} func Throttled function
    * @param {number} wait Throttle wait time
    * @param {object} options Throttle settings
    */

    var _throttle = function(func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (!options) {options = {};}
        var later = function() {
            previous = options.leading === false ? 0 : _getNow();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) {context = args = null;}
        };
        return function() {
            var now = _getNow();
            if (!previous && options.leading === false) {previous = now;}
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) {context = args = null;}
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    };

    /**
     * Clean autoInit Instances: those that point to contentless iframes
     * @method _cleanAutoInitInstances
     * @inner
     */
    var _cleanAutoInitInstances = function() {
        var length = lib.autoInitInstances.length;

        // Loop backwards to avoid index issues
        for (var idx = length - 1; idx >= 0; idx--) {
            var instance = lib.autoInitInstances[idx];
            // If instance has been removed or is contentless then remove it
            if (instance.el.getElementsByTagName('iframe').length &&
                instance.el.getElementsByTagName('iframe')[0].contentWindow) {
                continue;
            }
            else {
                // Remove the reference to the removed or orphan instance
                lib.autoInitInstances.splice(idx,1);
            }
        }
    };

    /**
     * Store auto initialized Pym instances for further reference
     * @name module:pym#autoInitInstances
     * @type Array
     * @default []
     */
    lib.autoInitInstances = [];

    /**
     * Initialize Pym for elements on page that have data-pym attributes.
     * Expose autoinit in case we need to call it from the outside
     * @instance
     * @method autoInit
     * @param {Boolean} doNotRaiseEvents flag to avoid sending custom events
     */
    lib.autoInit = function(doNotRaiseEvents) {
        var elements = document.querySelectorAll('[data-pym-src]:not([data-pym-auto-initialized])');
        var length = elements.length;

        // Clean stored instances in case needed
        _cleanAutoInitInstances();
        for (var idx = 0; idx < length; ++idx) {
            var element = elements[idx];
            /*
            * Mark automatically-initialized elements so they are not
            * re-initialized if the user includes pym.js more than once in the
            * same document.
            */
            element.setAttribute('data-pym-auto-initialized', '');

            // Ensure elements have an id
            if (element.id === '') {
                element.id = 'pym-' + idx + "-" + Math.random().toString(36).substr(2,5);
            }

            var src = element.getAttribute('data-pym-src');

            // List of data attributes to configure the component
            // structure: {'attribute name': 'type'}
            var settings = {'xdomain': 'string', 'title': 'string', 'name': 'string', 'id': 'string',
                            'sandbox': 'string', 'allowfullscreen': 'boolean',
                            'parenturlparam': 'string', 'parenturlvalue': 'string',
                            'optionalparams': 'boolean', 'trackscroll': 'boolean',
                            'scrollwait': 'number'};

            var config = {};

            for (var attribute in settings) {
                // via https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute#Notes
               if (element.getAttribute('data-pym-'+attribute) !== null) {
                  switch (settings[attribute]) {
                    case 'boolean':
                       config[attribute] = !(element.getAttribute('data-pym-'+attribute) === 'false'); // jshint ignore:line
                       break;
                    case 'string':
                       config[attribute] = element.getAttribute('data-pym-'+attribute);
                       break;
                    case 'number':
                        var n = Number(element.getAttribute('data-pym-'+attribute));
                        if (!isNaN(n)) {
                            config[attribute] = n;
                        }
                        break;
                    default:
                       console.err('unrecognized attribute type');
                  }
               }
            }

            // Store references to autoinitialized pym instances
            var parent = new lib.Parent(element.id, src, config);
            lib.autoInitInstances.push(parent);
        }

        // Fire customEvent
        if (!doNotRaiseEvents) {
            _raiseCustomEvent("pym-initialized");
        }
        // Return stored autoinitalized pym instances
        return lib.autoInitInstances;
    };

    /**
     * The Parent half of a response iframe.
     *
     * @memberof module:pym
     * @class Parent
     * @param {String} id The id of the div into which the iframe will be rendered. sets {@link module:pym.Parent~id}
     * @param {String} url The url of the iframe source. sets {@link module:pym.Parent~url}
     * @param {Object} [config] Configuration for the parent instance. sets {@link module:pym.Parent~settings}
     * @param {string} [config.xdomain='*'] - xdomain to validate messages received
     * @param {string} [config.title] - if passed it will be assigned to the iframe title attribute
     * @param {string} [config.name] - if passed it will be assigned to the iframe name attribute
     * @param {string} [config.id] - if passed it will be assigned to the iframe id attribute
     * @param {boolean} [config.allowfullscreen] - if passed and different than false it will be assigned to the iframe allowfullscreen attribute
     * @param {string} [config.sandbox] - if passed it will be assigned to the iframe sandbox attribute (we do not validate the syntax so be careful!!)
     * @param {string} [config.parenturlparam] - if passed it will be override the default parentUrl query string parameter name passed to the iframe src
     * @param {string} [config.parenturlvalue] - if passed it will be override the default parentUrl query string parameter value passed to the iframe src
     * @param {string} [config.optionalparams] - if passed and different than false it will strip the querystring params parentUrl and parentTitle passed to the iframe src
     * @param {boolean} [config.trackscroll] - if passed it will activate scroll tracking on the parent
     * @param {number} [config.scrollwait] - if passed it will set the throttle wait in order to fire scroll messaging. Defaults to 100 ms.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe iFrame}
     */
    lib.Parent = function(id, url, config) {
        /**
         * The id of the container element
         *
         * @memberof module:pym.Parent
         * @member {string} id
         * @inner
         */
        this.id = id;
        /**
         * The url that will be set as the iframe's src
         *
         * @memberof module:pym.Parent
         * @member {String} url
         * @inner
         */
        this.url = url;

        /**
         * The container DOM object
         *
         * @memberof module:pym.Parent
         * @member {HTMLElement} el
         * @inner
         */
        this.el = document.getElementById(id);
        /**
         * The contained child iframe
         *
         * @memberof module:pym.Parent
         * @member {HTMLElement} iframe
         * @inner
         * @default null
         */
        this.iframe = null;
        /**
         * The parent instance settings, updated by the values passed in the config object
         *
         * @memberof module:pym.Parent
         * @member {Object} settings
         * @inner
         */
        this.settings = {
            xdomain: '*',
            optionalparams: true,
            parenturlparam: 'parentUrl',
            parenturlvalue: window.location.href,
            trackscroll: false,
            scrollwait: 100,
        };
        /**
         * RegularExpression to validate the received messages
         *
         * @memberof module:pym.Parent
         * @member {String} messageRegex
         * @inner
         */
        this.messageRegex = _makeMessageRegex(this.id);
        /**
         * Stores the registered messageHandlers for each messageType
         *
         * @memberof module:pym.Parent
         * @member {Object} messageHandlers
         * @inner
         */
        this.messageHandlers = {};

        // ensure a config object
        config = (config || {});

        /**
         * Construct the iframe.
         *
         * @memberof module:pym.Parent
         * @method _constructIframe
         * @inner
         */
        this._constructIframe = function() {
            // Calculate the width of this element.
            var width = this.el.offsetWidth.toString();

            // Create an iframe element attached to the document.
            this.iframe = document.createElement('iframe');

            // Save fragment id
            var hash = '';
            var hashIndex = this.url.indexOf('#');

            if (hashIndex > -1) {
                hash = this.url.substring(hashIndex, this.url.length);
                this.url = this.url.substring(0, hashIndex);
            }

            // If the URL contains querystring bits, use them.
            // Otherwise, just create a set of valid params.
            if (this.url.indexOf('?') < 0) {
                this.url += '?';
            } else {
                this.url += '&';
            }

            // Append the initial width as a querystring parameter
            // and optional params if configured to do so
            this.iframe.src = this.url + 'initialWidth=' + width +
                                         '&childId=' + this.id;

            if (this.settings.optionalparams) {
                this.iframe.src += '&parentTitle=' + encodeURIComponent(document.title);
                this.iframe.src += '&'+ this.settings.parenturlparam + '=' + encodeURIComponent(this.settings.parenturlvalue);
            }
            this.iframe.src +=hash;

            // Set some attributes to this proto-iframe.
            this.iframe.setAttribute('width', '100%');
            this.iframe.setAttribute('scrolling', 'no');
            this.iframe.setAttribute('marginheight', '0');
            this.iframe.setAttribute('frameborder', '0');

            if (this.settings.title) {
                this.iframe.setAttribute('title', this.settings.title);
            }

            if (this.settings.allowfullscreen !== undefined && this.settings.allowfullscreen !== false) {
                this.iframe.setAttribute('allowfullscreen','');
            }

            if (this.settings.sandbox !== undefined && typeof this.settings.sandbox === 'string') {
                this.iframe.setAttribute('sandbox', this.settings.sandbox);
            }

            if (this.settings.id) {
                if (!document.getElementById(this.settings.id)) {
                    this.iframe.setAttribute('id', this.settings.id);
                }
            }

            if (this.settings.name) {
                this.iframe.setAttribute('name', this.settings.name);
            }

            // Replace the child content if needed
            // (some CMSs might strip out empty elements)
            while(this.el.firstChild) { this.el.removeChild(this.el.firstChild); }
            // Append the iframe to our element.
            this.el.appendChild(this.iframe);

            // Add an event listener that will handle redrawing the child on resize.
            window.addEventListener('resize', this._onResize);

            // Add an event listener that will send the child the viewport.
            if (this.settings.trackscroll) {
                window.addEventListener('scroll', this._throttleOnScroll);
            }
        };

        /**
         * Send width on resize.
         *
         * @memberof module:pym.Parent
         * @method _onResize
         * @inner
         */
        this._onResize = function() {
            this.sendWidth();
            if (this.settings.trackscroll) {
                this.sendViewportAndIFramePosition();
            }
        }.bind(this);

        /**
         * Send viewport and iframe info on scroll.
         *
         * @memberof module:pym.Parent
         * @method _onScroll
         * @inner
         */
        this._onScroll = function() {
            this.sendViewportAndIFramePosition();
        }.bind(this);

        /**
         * Fire all event handlers for a given message type.
         *
         * @memberof module:pym.Parent
         * @method _fire
         * @inner
         *
         * @param {String} messageType The type of message.
         * @param {String} message The message data.
         */
        this._fire = function(messageType, message) {
            if (messageType in this.messageHandlers) {
                for (var i = 0; i < this.messageHandlers[messageType].length; i++) {
                   this.messageHandlers[messageType][i].call(this, message);
                }
            }
        };

        /**
         * Remove this parent from the page and unbind it's event handlers.
         *
         * @memberof module:pym.Parent
         * @method remove
         * @instance
         */
        this.remove = function() {
            window.removeEventListener('message', this._processMessage);
            window.removeEventListener('resize', this._onResize);

            this.el.removeChild(this.iframe);
            // _cleanAutoInitInstances in case this parent was autoInitialized
            _cleanAutoInitInstances();
        };

        /**
         * Process a new message from the child.
         *
         * @memberof module:pym.Parent
         * @method _processMessage
         * @inner
         *
         * @param {Event} e A message event.
         */
        this._processMessage = function(e) {
            // First, punt if this isn't from an acceptable xdomain.
            if (!_isSafeMessage(e, this.settings)) {
                return;
            }

            // Discard object messages, we only care about strings
            if (typeof e.data !== 'string') {
                return;
            }

            // Grab the message from the child and parse it.
            var match = e.data.match(this.messageRegex);

            // If there's no match or too many matches in the message, punt.
            if (!match || match.length !== 3) {
                return false;
            }

            var messageType = match[1];
            var message = match[2];

            this._fire(messageType, message);
        }.bind(this);

        /**
         * Resize iframe in response to new height message from child.
         *
         * @memberof module:pym.Parent
         * @method _onHeightMessage
         * @inner
         *
         * @param {String} message The new height.
         */
        this._onHeightMessage = function(message) {
            /*
             * Handle parent height message from child.
             */
            var height = parseInt(message);

            this.iframe.setAttribute('height', height + 'px');
        };

        /**
         * Navigate parent to a new url.
         *
         * @memberof module:pym.Parent
         * @method _onNavigateToMessage
         * @inner
         *
         * @param {String} message The url to navigate to.
         */
        this._onNavigateToMessage = function(message) {
            /*
             * Handle parent scroll message from child.
             */
            document.location.href = message;
        };

        /**
         * Scroll parent to a given child position.
         *
         * @memberof module:pym.Parent
         * @method _onScrollToChildPosMessage
         * @inner
         *
         * @param {String} message The offset inside the child page.
         */
        this._onScrollToChildPosMessage = function(message) {
            // Get the child container position using getBoundingClientRect + pageYOffset
            // via https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
            var iframePos = document.getElementById(this.id).getBoundingClientRect().top + window.pageYOffset;

            var totalOffset = iframePos + parseInt(message);
            window.scrollTo(0, totalOffset);
        };

        /**
         * Bind a callback to a given messageType from the child.
         *
         * Reserved message names are: "height", "scrollTo" and "navigateTo".
         *
         * @memberof module:pym.Parent
         * @method onMessage
         * @instance
         *
         * @param {String} messageType The type of message being listened for.
         * @param {module:pym.Parent~onMessageCallback} callback The callback to invoke when a message of the given type is received.
         */
        this.onMessage = function(messageType, callback) {
            if (!(messageType in this.messageHandlers)) {
                this.messageHandlers[messageType] = [];
            }

            this.messageHandlers[messageType].push(callback);
        };

        /**
         * @callback module:pym.Parent~onMessageCallback
         * @param {String} message The message data.
         */

        /**
         * Send a message to the the child.
         *
         * @memberof module:pym.Parent
         * @method sendMessage
         * @instance
         *
         * @param {String} messageType The type of message to send.
         * @param {String} message The message data to send.
         */
        this.sendMessage = function(messageType, message) {
            // When used alongside with pjax some references are lost
            if (this.el.getElementsByTagName('iframe').length) {
                if (this.el.getElementsByTagName('iframe')[0].contentWindow) {
                    this.el.getElementsByTagName('iframe')[0].contentWindow
                        .postMessage(_makeMessage(this.id, messageType, message), '*');
                }
                else {
                    // Contentless child detected remove listeners and iframe
                    this.remove();
                }
            }
        };

        /**
         * Transmit the current iframe width to the child.
         *
         * You shouldn't need to call this directly.
         *
         * @memberof module:pym.Parent
         * @method sendWidth
         * @instance
         */
        this.sendWidth = function() {
            var width = this.el.offsetWidth.toString();
            this.sendMessage('width', width);
        };

        /**
         * Transmit the current viewport and iframe position to the child.
         * Sends viewport width, viewport height
         * and iframe bounding rect top-left-bottom-right
         * all separated by spaces
         *
         * You shouldn't need to call this directly.
         *
         * @memberof module:pym.Parent
         * @method sendViewportAndIFramePosition
         * @instance
         */
        this.sendViewportAndIFramePosition = function() {
            var iframeRect = this.iframe.getBoundingClientRect();
            var vWidth   = window.innerWidth || document.documentElement.clientWidth;
            var vHeight  = window.innerHeight || document.documentElement.clientHeight;
            var payload = vWidth + ' ' + vHeight;
            payload += ' ' + iframeRect.top + ' ' + iframeRect.left;
            payload += ' ' + iframeRect.bottom + ' ' + iframeRect.right;
            this.sendMessage('viewport-iframe-position', payload);
        };

        // Add any overrides to settings coming from config.
        for (var key in config) {
            this.settings[key] = config[key];
        }

        /**
         * Throttled scroll function.
         *
         * @memberof module:pym.Parent
         * @method _throttleOnScroll
         * @inner
         */
        this._throttleOnScroll = _throttle(this._onScroll.bind(this), this.settings.scrollwait);

        // Bind required message handlers
        this.onMessage('height', this._onHeightMessage);
        this.onMessage('navigateTo', this._onNavigateToMessage);
        this.onMessage('scrollToChildPos', this._onScrollToChildPosMessage);
        this.onMessage('parentPositionInfo', this.sendViewportAndIFramePosition);

        // Add a listener for processing messages from the child.
        window.addEventListener('message', this._processMessage, false);

        // Construct the iframe in the container element.
        this._constructIframe();

        return this;
    };

    /**
     * The Child half of a responsive iframe.
     *
     * @memberof module:pym
     * @class Child
     * @param {Object} [config] Configuration for the child instance. sets {@link module:pym.Child~settings}
     * @param {function} [config.renderCallback=null] Callback invoked after receiving a resize event from the parent, sets {@link module:pym.Child#settings.renderCallback}
     * @param {string} [config.xdomain='*'] - xdomain to validate messages received
     * @param {number} [config.polling=0] - polling frequency in milliseconds to send height to parent
     * @param {number} [config.id] - parent container id used when navigating the child iframe to a new page but we want to keep it responsive.
     * @param {string} [config.parenturlparam] - if passed it will be override the default parentUrl query string parameter name expected on the iframe src
     */
    lib.Child = function(config) {
        /**
         * The initial width of the parent page
         *
         * @memberof module:pym.Child
         * @member {string} parentWidth
         * @inner
         */
        this.parentWidth = null;
        /**
         * The id of the parent container
         *
         * @memberof module:pym.Child
         * @member {String} id
         * @inner
         */
        this.id = null;
        /**
         * The title of the parent page from document.title.
         *
         * @memberof module:pym.Child
         * @member {String} parentTitle
         * @inner
         */
        this.parentTitle = null;
        /**
         * The URL of the parent page from window.location.href.
         *
         * @memberof module:pym.Child
         * @member {String} parentUrl
         * @inner
         */
        this.parentUrl = null;
        /**
         * The settings for the child instance. Can be overriden by passing a config object to the child constructor
         * i.e.: var pymChild = new pym.Child({renderCallback: render, xdomain: "\\*\.npr\.org"})
         *
         * @memberof module:pym.Child.settings
         * @member {Object} settings - default settings for the child instance
         * @inner
         */
        this.settings = {
            renderCallback: null,
            xdomain: '*',
            polling: 0,
            parenturlparam: 'parentUrl'
        };

        /**
         * The timerId in order to be able to stop when polling is enabled
         *
         * @memberof module:pym.Child
         * @member {String} timerId
         * @inner
         */
        this.timerId = null;
        /**
         * RegularExpression to validate the received messages
         *
         * @memberof module:pym.Child
         * @member {String} messageRegex
         * @inner
         */
        this.messageRegex = null;
        /**
         * Stores the registered messageHandlers for each messageType
         *
         * @memberof module:pym.Child
         * @member {Object} messageHandlers
         * @inner
         */
        this.messageHandlers = {};

        // Ensure a config object
        config = (config || {});

        /**
         * Bind a callback to a given messageType from the child.
         *
         * Reserved message names are: "width".
         *
         * @memberof module:pym.Child
         * @method onMessage
         * @instance
         *
         * @param {String} messageType The type of message being listened for.
         * @param {module:pym.Child~onMessageCallback} callback The callback to invoke when a message of the given type is received.
         */
        this.onMessage = function(messageType, callback) {

            if (!(messageType in this.messageHandlers)) {
                this.messageHandlers[messageType] = [];
            }

            this.messageHandlers[messageType].push(callback);
        };

        /**
         * @callback module:pym.Child~onMessageCallback
         * @param {String} message The message data.
         */


        /**
         * Fire all event handlers for a given message type.
         *
         * @memberof module:pym.Child
         * @method _fire
         * @inner
         *
         * @param {String} messageType The type of message.
         * @param {String} message The message data.
         */
        this._fire = function(messageType, message) {
            /*
             * Fire all event handlers for a given message type.
             */
            if (messageType in this.messageHandlers) {
                for (var i = 0; i < this.messageHandlers[messageType].length; i++) {
                   this.messageHandlers[messageType][i].call(this, message);
                }
            }
        };

        /**
         * Process a new message from the parent.
         *
         * @memberof module:pym.Child
         * @method _processMessage
         * @inner
         *
         * @param {Event} e A message event.
         */
        this._processMessage = function(e) {
            /*
            * Process a new message from parent frame.
            */
            // First, punt if this isn't from an acceptable xdomain.
            if (!_isSafeMessage(e, this.settings)) {
                return;
            }

            // Discard object messages, we only care about strings
            if (typeof e.data !== 'string') {
                return;
            }

            // Get the message from the parent.
            var match = e.data.match(this.messageRegex);

            // If there's no match or it's a bad format, punt.
            if (!match || match.length !== 3) { return; }

            var messageType = match[1];
            var message = match[2];

            this._fire(messageType, message);
        }.bind(this);

        /**
         * Resize iframe in response to new width message from parent.
         *
         * @memberof module:pym.Child
         * @method _onWidthMessage
         * @inner
         *
         * @param {String} message The new width.
         */
        this._onWidthMessage = function(message) {
            /*
             * Handle width message from the child.
             */
            var width = parseInt(message);

            // Change the width if it's different.
            if (width !== this.parentWidth) {
                this.parentWidth = width;

                // Call the callback function if it exists.
                if (this.settings.renderCallback) {
                    this.settings.renderCallback(width);
                }

                // Send the height back to the parent.
                this.sendHeight();
            }
        };

        /**
         * Send a message to the the Parent.
         *
         * @memberof module:pym.Child
         * @method sendMessage
         * @instance
         *
         * @param {String} messageType The type of message to send.
         * @param {String} message The message data to send.
         */
        this.sendMessage = function(messageType, message) {
            /*
             * Send a message to the parent.
             */
            window.parent.postMessage(_makeMessage(this.id, messageType, message), '*');
        };

        /**
         * Transmit the current iframe height to the parent.
         *
         * Call this directly in cases where you manually alter the height of the iframe contents.
         *
         * @memberof module:pym.Child
         * @method sendHeight
         * @instance
         */
        this.sendHeight = function() {
            // Get the child's height.
            var height = document.getElementsByTagName('body')[0].offsetHeight.toString();

            // Send the height to the parent.
            this.sendMessage('height', height);

            return height;
        }.bind(this);

        /**
         * Ask parent to send the current viewport and iframe position information
         *
         * @memberof module:pym.Child
         * @method sendHeight
         * @instance
         */
        this.getParentPositionInfo = function() {
            // Send the height to the parent.
            this.sendMessage('parentPositionInfo');
        };

        /**
         * Scroll parent to a given element id.
         *
         * @memberof module:pym.Child
         * @method scrollParentTo
         * @instance
         *
         * @param {String} hash The id of the element to scroll to.
         */
        this.scrollParentTo = function(hash) {
            this.sendMessage('navigateTo', '#' + hash);
        };

        /**
         * Navigate parent to a given url.
         *
         * @memberof module:pym.Child
         * @method navigateParentTo
         * @instance
         *
         * @param {String} url The url to navigate to.
         */
        this.navigateParentTo = function(url) {
            this.sendMessage('navigateTo', url);
        };

        /**
         * Scroll parent to a given child element id.
         *
         * @memberof module:pym.Child
         * @method scrollParentToChildEl
         * @instance
         *
         * @param {String} id The id of the child element to scroll to.
         */
        this.scrollParentToChildEl = function(id) {
            // Get the child element position using getBoundingClientRect + pageYOffset
            // via https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
            var topPos = document.getElementById(id).getBoundingClientRect().top + window.pageYOffset;
            this.scrollParentToChildPos(topPos);
        };

        /**
         * Scroll parent to a particular child offset.
         *
         * @memberof module:pym.Child
         * @method scrollParentToChildPos
         * @instance
         *
         * @param {Number} pos The offset of the child element to scroll to.
         */
        this.scrollParentToChildPos = function(pos) {
            this.sendMessage('scrollToChildPos', pos.toString());
        };

        /**
         * Mark Whether the child is embedded or not
         * executes a callback in case it was passed to the config
         *
         * @memberof module:pym.Child
         * @method _markWhetherEmbedded
         * @inner
         *
         * @param {module:pym.Child~onMarkedEmbeddedStatus} The callback to execute after determining whether embedded or not.
         */
        var _markWhetherEmbedded = function(onMarkedEmbeddedStatus) {
          var htmlElement = document.getElementsByTagName('html')[0],
              newClassForHtml,
              originalHtmlClasses = htmlElement.className;
          try {
            if(window.self !== window.top) {
              newClassForHtml = "embedded";
            }else{
              newClassForHtml = "not-embedded";
            }
          }catch(e) {
            newClassForHtml = "embedded";
          }
          if(originalHtmlClasses.indexOf(newClassForHtml) < 0) {
            htmlElement.className = originalHtmlClasses ? originalHtmlClasses + ' ' + newClassForHtml : newClassForHtml;
            if(onMarkedEmbeddedStatus){
              onMarkedEmbeddedStatus(newClassForHtml);
            }
            _raiseCustomEvent("marked-embedded");
          }
        };

        /**
         * @callback module:pym.Child~onMarkedEmbeddedStatus
         * @param {String} classname "embedded" or "not-embedded".
         */

        /**
         * Unbind child event handlers and timers.
         *
         * @memberof module:pym.Child
         * @method remove
         * @instance
         */
        this.remove = function() {
            window.removeEventListener('message', this._processMessage);
            if (this.timerId) {
                clearInterval(this.timerId);
            }
        };

        // Initialize settings with overrides.
        for (var key in config) {
            this.settings[key] = config[key];
        }

        // Identify what ID the parent knows this child as.
        this.id = _getParameterByName('childId') || config.id;
        this.messageRegex = new RegExp('^pym' + MESSAGE_DELIMITER + this.id + MESSAGE_DELIMITER + '(\\S+)' + MESSAGE_DELIMITER + '(.*)$');

        // Get the initial width from a URL parameter.
        var width = parseInt(_getParameterByName('initialWidth'));

        // Get the url of the parent frame
        this.parentUrl = _getParameterByName(this.settings.parenturlparam);

        // Get the title of the parent frame
        this.parentTitle = _getParameterByName('parentTitle');

        // Bind the required message handlers
        this.onMessage('width', this._onWidthMessage);

        // Set up a listener to handle any incoming messages.
        window.addEventListener('message', this._processMessage, false);

        // If there's a callback function, call it.
        if (this.settings.renderCallback) {
            this.settings.renderCallback(width);
        }

        // Send the initial height to the parent.
        this.sendHeight();

        // If we're configured to poll, create a setInterval to handle that.
        if (this.settings.polling) {
            this.timerId = window.setInterval(this.sendHeight, this.settings.polling);
        }

        _markWhetherEmbedded(config.onMarkedEmbeddedStatus);

        return this;
    };

    // Initialize elements with pym data attributes
    // if we are not in server configuration
    if(typeof document !== "undefined") {
        lib.autoInit(true);
    }

    return lib;
});

},{}],2:[function(require,module,exports){
'use strict';

var _pym = require('pym.js');

var _pym2 = _interopRequireDefault(_pym);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var werks = document.querySelectorAll('.chartwerk'); // Uses POLITICO fork of pym.js: https://github.com/The-Politico/pym.js
// Checks for existence of pym before setting global.


for (var i = 0; i < werks.length; i++) {
  var werk = werks[i];
  var id = werk.dataset.id;
  var chartPath = werk.dataset.src;
  var paths = {
    single: '' + chartPath + id + '_single.html',
    double: '' + chartPath + id + '.html'
  };
  var dimensions = JSON.parse(werk.dataset.dimensions);
  var size = werk.dataset.size;
  var viewportWidth = werk.parentElement.clientWidth;
  var pymParent = void 0;
  // Check if iframe already embedded. (Handles for multiple embedded charts...)
  if (werk.querySelectorAll('iframe').length < 1) {
    // double-wide
    if (size === 'double') {
      if (viewportWidth > dimensions.double.width) {
        werk.style.width = '100%';
        pymParent = new _pym2.default.Parent(werk.id, paths.double, {});
      } else {
        werk.style.width = dimensions.single.width + 'px';
        pymParent = new _pym2.default.Parent(werk.id, paths.single, {});
        // Add a class which can be used to float div
        if (viewportWidth > dimensions.single.width * 1.75) {
          werk.classList.add('floated');
        }
      }
      // single-wide
    } else {
      werk.style.width = dimensions.single.width + 'px';
      pymParent = new _pym2.default.Parent(werk.id, paths.single, {});
      // Add a class which can be used to float div
      if (viewportWidth > dimensions.single.width * 1.75) {
        werk.classList.add('floated');
      }
    }
  }
}


},{"pym.js":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcHltLmpzL2Rpc3QvcHltLnYxLmpzIiwiL1VzZXJzL2FjaGF2ZXovQ29kZS9kamFuZ28tY2hhcnR3ZXJrL2NoYXJ0d2Vyay9zdGF0aWNhcHAvc3JjL2pzL21haW4tZW1iZWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0bENBLFlBQVksQ0FBQzs7QUFFYixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRTdCLElBQUksS0FBSyxHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDOztBQUV6QyxTQUFTLHNCQUFzQixDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRyxHQUFHLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7O0FBRS9GLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLHVFQUF1RTtBQUM1SCxxREFBcUQ7QUFDckQ7O0FBRUEsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDckMsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO0VBQ3pCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO0VBQ2pDLElBQUksS0FBSyxHQUFHO0lBQ1YsTUFBTSxFQUFFLEVBQUUsR0FBRyxTQUFTLEdBQUcsRUFBRSxHQUFHLGNBQWM7SUFDNUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxTQUFTLEdBQUcsRUFBRSxHQUFHLE9BQU87R0FDdEMsQ0FBQztFQUNGLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztFQUNyRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztFQUM3QixJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQztBQUNyRCxFQUFFLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDOztBQUV6QixFQUFFLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7O0lBRTlDLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtNQUNyQixJQUFJLGFBQWEsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUMzQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7UUFDMUIsU0FBUyxHQUFHLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO09BQ2pFLE1BQU07UUFDTCxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDMUQsUUFBUSxTQUFTLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7O1FBRWhFLElBQUksYUFBYSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRTtVQUNsRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUMvQjtBQUNULE9BQU87O0tBRUYsTUFBTTtNQUNMLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztBQUN4RCxNQUFNLFNBQVMsR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQzs7TUFFaEUsSUFBSSxhQUFhLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFO1FBQ2xELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO09BQy9CO0tBQ0Y7R0FDRjtDQUNGO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohIHB5bS5qcyAtIHYxLjMuMiAtIDIwMTctMDgtMTMgKi9cbi8qXG4qIFB5bS5qcyBpcyBsaWJyYXJ5IHRoYXQgcmVzaXplcyBhbiBpZnJhbWUgYmFzZWQgb24gdGhlIHdpZHRoIG9mIHRoZSBwYXJlbnQgYW5kIHRoZSByZXN1bHRpbmcgaGVpZ2h0IG9mIHRoZSBjaGlsZC5cbiogQ2hlY2sgb3V0IHRoZSBkb2NzIGF0IGh0dHA6Ly9ibG9nLmFwcHMubnByLm9yZy9weW0uanMvIG9yIHRoZSByZWFkbWUgYXQgUkVBRE1FLm1kIGZvciB1c2FnZS5cbiovXG5cbi8qKiBAbW9kdWxlIHB5bSAqL1xuKGZ1bmN0aW9uKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShmYWN0b3J5KTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0eXBlb2Ygd2luZG93LnB5bSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgd2luZG93LnB5bSA9IGZhY3RvcnkuY2FsbCh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG59KShmdW5jdGlvbigpIHtcbiAgICB2YXIgTUVTU0FHRV9ERUxJTUlURVIgPSAneFBZTXgnO1xuXG4gICAgdmFyIGxpYiA9IHt9O1xuXG4gICAgLyoqXG4gICAgKiBDcmVhdGUgYW5kIGRpc3BhdGNoIGEgY3VzdG9tIHB5bSBldmVudFxuICAgICpcbiAgICAqIEBtZXRob2QgX3JhaXNlQ3VzdG9tRXZlbnRcbiAgICAqIEBpbm5lclxuICAgICpcbiAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWVcbiAgICAqL1xuICAgdmFyIF9yYWlzZUN1c3RvbUV2ZW50ID0gZnVuY3Rpb24oZXZlbnROYW1lKSB7XG4gICAgIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgICBldmVudC5pbml0RXZlbnQoJ3B5bTonICsgZXZlbnROYW1lLCB0cnVlLCB0cnVlKTtcbiAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICB9O1xuXG4gICAgLyoqXG4gICAgKiBHZW5lcmljIGZ1bmN0aW9uIGZvciBwYXJzaW5nIFVSTCBwYXJhbXMuXG4gICAgKiBWaWEgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85MDExMTUvaG93LWNhbi1pLWdldC1xdWVyeS1zdHJpbmctdmFsdWVzLWluLWphdmFzY3JpcHRcbiAgICAqXG4gICAgKiBAbWV0aG9kIF9nZXRQYXJhbWV0ZXJCeU5hbWVcbiAgICAqIEBpbm5lclxuICAgICpcbiAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwYXJhbXRlciB0byBnZXQgZnJvbSB0aGUgVVJMLlxuICAgICovXG4gICAgdmFyIF9nZXRQYXJhbWV0ZXJCeU5hbWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoXCJbXFxcXD8mXVwiICsgbmFtZS5yZXBsYWNlKC9bXFxbXS8sICdcXFxcWycpLnJlcGxhY2UoL1tcXF1dLywgJ1xcXFxdJykgKyAnPShbXiYjXSopJyk7XG4gICAgICAgIHZhciByZXN1bHRzID0gcmVnZXguZXhlYyhsb2NhdGlvbi5zZWFyY2gpO1xuXG4gICAgICAgIGlmIChyZXN1bHRzID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMV0ucmVwbGFjZSgvXFwrL2csIFwiIFwiKSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoZSBtZXNzYWdlIHRvIG1ha2Ugc3VyZSBpdCBjb21lcyBmcm9tIGFuIGFjY2VwdGFibGUgeGRvbWFpbi5cbiAgICAgKiBEZWZhdWx0cyB0byAnKicgYnV0IGNhbiBiZSBvdmVycmlkZW4gaW4gY29uZmlnLlxuICAgICAqXG4gICAgICogQG1ldGhvZCBfaXNTYWZlTWVzc2FnZVxuICAgICAqIEBpbm5lclxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZSBUaGUgbWVzc2FnZSBldmVudC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc2V0dGluZ3MgQ29uZmlndXJhdGlvbi5cbiAgICAgKi9cbiAgICB2YXIgX2lzU2FmZU1lc3NhZ2UgPSBmdW5jdGlvbihlLCBzZXR0aW5ncykge1xuICAgICAgICBpZiAoc2V0dGluZ3MueGRvbWFpbiAhPT0gJyonKSB7XG4gICAgICAgICAgICAvLyBJZiBvcmlnaW4gZG9lc24ndCBtYXRjaCBvdXIgeGRvbWFpbiwgcmV0dXJuLlxuICAgICAgICAgICAgaWYgKCFlLm9yaWdpbi5tYXRjaChuZXcgUmVnRXhwKHNldHRpbmdzLnhkb21haW4gKyAnJCcpKSkgeyByZXR1cm47IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElnbm9yZSBldmVudHMgdGhhdCBkbyBub3QgY2Fycnkgc3RyaW5nIGRhdGEgIzE1MVxuICAgICAgICBpZiAodHlwZW9mIGUuZGF0YSAhPT0gJ3N0cmluZycpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdCBhIG1lc3NhZ2UgdG8gc2VuZCBiZXR3ZWVuIGZyYW1lcy5cbiAgICAgKlxuICAgICAqIE5COiBXZSB1c2Ugc3RyaW5nLWJ1aWxkaW5nIGhlcmUgYmVjYXVzZSBKU09OIG1lc3NhZ2UgcGFzc2luZyBpc1xuICAgICAqIG5vdCBzdXBwb3J0ZWQgaW4gYWxsIGJyb3dzZXJzLlxuICAgICAqXG4gICAgICogQG1ldGhvZCBfbWFrZU1lc3NhZ2VcbiAgICAgKiBAaW5uZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBUaGUgdW5pcXVlIGlkIG9mIHRoZSBtZXNzYWdlIHJlY2lwaWVudC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVR5cGUgVGhlIHR5cGUgb2YgbWVzc2FnZSB0byBzZW5kLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNlbmQuXG4gICAgICovXG4gICAgdmFyIF9tYWtlTWVzc2FnZSA9IGZ1bmN0aW9uKGlkLCBtZXNzYWdlVHlwZSwgbWVzc2FnZSkge1xuICAgICAgICB2YXIgYml0cyA9IFsncHltJywgaWQsIG1lc3NhZ2VUeXBlLCBtZXNzYWdlXTtcblxuICAgICAgICByZXR1cm4gYml0cy5qb2luKE1FU1NBR0VfREVMSU1JVEVSKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgcmVnZXggdG8gdmFsaWRhdGUgYW5kIHBhcnNlIG1lc3NhZ2VzLlxuICAgICAqXG4gICAgICogQG1ldGhvZCBfbWFrZU1lc3NhZ2VSZWdleFxuICAgICAqIEBpbm5lclxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlkIFRoZSB1bmlxdWUgaWQgb2YgdGhlIG1lc3NhZ2UgcmVjaXBpZW50LlxuICAgICAqL1xuICAgIHZhciBfbWFrZU1lc3NhZ2VSZWdleCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHZhciBiaXRzID0gWydweW0nLCBpZCwgJyhcXFxcUyspJywgJyguKiknXTtcblxuICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cCgnXicgKyBiaXRzLmpvaW4oTUVTU0FHRV9ERUxJTUlURVIpICsgJyQnKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgKiBVbmRlcnNjb3JlIGltcGxlbWVudGF0aW9uIG9mIGdldE5vd1xuICAgICpcbiAgICAqIEBtZXRob2QgX2dldE5vd1xuICAgICogQGlubmVyXG4gICAgKlxuICAgICovXG4gICAgdmFyIF9nZXROb3cgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAqIFVuZGVyc2NvcmUgaW1wbGVtZW50YXRpb24gb2YgdGhyb3R0bGVcbiAgICAqXG4gICAgKiBAbWV0aG9kIF90aHJvdHRsZVxuICAgICogQGlubmVyXG4gICAgKlxuICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZnVuYyBUaHJvdHRsZWQgZnVuY3Rpb25cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB3YWl0IFRocm90dGxlIHdhaXQgdGltZVxuICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgVGhyb3R0bGUgc2V0dGluZ3NcbiAgICAqL1xuXG4gICAgdmFyIF90aHJvdHRsZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGNvbnRleHQsIGFyZ3MsIHJlc3VsdDtcbiAgICAgICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHtvcHRpb25zID0ge307fVxuICAgICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBfZ2V0Tm93KCk7XG4gICAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICBpZiAoIXRpbWVvdXQpIHtjb250ZXh0ID0gYXJncyA9IG51bGw7fVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbm93ID0gX2dldE5vdygpO1xuICAgICAgICAgICAgaWYgKCFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlKSB7cHJldmlvdXMgPSBub3c7fVxuICAgICAgICAgICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuICAgICAgICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgaWYgKHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGlmICghdGltZW91dCkge2NvbnRleHQgPSBhcmdzID0gbnVsbDt9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDbGVhbiBhdXRvSW5pdCBJbnN0YW5jZXM6IHRob3NlIHRoYXQgcG9pbnQgdG8gY29udGVudGxlc3MgaWZyYW1lc1xuICAgICAqIEBtZXRob2QgX2NsZWFuQXV0b0luaXRJbnN0YW5jZXNcbiAgICAgKiBAaW5uZXJcbiAgICAgKi9cbiAgICB2YXIgX2NsZWFuQXV0b0luaXRJbnN0YW5jZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGxpYi5hdXRvSW5pdEluc3RhbmNlcy5sZW5ndGg7XG5cbiAgICAgICAgLy8gTG9vcCBiYWNrd2FyZHMgdG8gYXZvaWQgaW5kZXggaXNzdWVzXG4gICAgICAgIGZvciAodmFyIGlkeCA9IGxlbmd0aCAtIDE7IGlkeCA+PSAwOyBpZHgtLSkge1xuICAgICAgICAgICAgdmFyIGluc3RhbmNlID0gbGliLmF1dG9Jbml0SW5zdGFuY2VzW2lkeF07XG4gICAgICAgICAgICAvLyBJZiBpbnN0YW5jZSBoYXMgYmVlbiByZW1vdmVkIG9yIGlzIGNvbnRlbnRsZXNzIHRoZW4gcmVtb3ZlIGl0XG4gICAgICAgICAgICBpZiAoaW5zdGFuY2UuZWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIGluc3RhbmNlLmVsLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHJlZmVyZW5jZSB0byB0aGUgcmVtb3ZlZCBvciBvcnBoYW4gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICBsaWIuYXV0b0luaXRJbnN0YW5jZXMuc3BsaWNlKGlkeCwxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTdG9yZSBhdXRvIGluaXRpYWxpemVkIFB5bSBpbnN0YW5jZXMgZm9yIGZ1cnRoZXIgcmVmZXJlbmNlXG4gICAgICogQG5hbWUgbW9kdWxlOnB5bSNhdXRvSW5pdEluc3RhbmNlc1xuICAgICAqIEB0eXBlIEFycmF5XG4gICAgICogQGRlZmF1bHQgW11cbiAgICAgKi9cbiAgICBsaWIuYXV0b0luaXRJbnN0YW5jZXMgPSBbXTtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgUHltIGZvciBlbGVtZW50cyBvbiBwYWdlIHRoYXQgaGF2ZSBkYXRhLXB5bSBhdHRyaWJ1dGVzLlxuICAgICAqIEV4cG9zZSBhdXRvaW5pdCBpbiBjYXNlIHdlIG5lZWQgdG8gY2FsbCBpdCBmcm9tIHRoZSBvdXRzaWRlXG4gICAgICogQGluc3RhbmNlXG4gICAgICogQG1ldGhvZCBhdXRvSW5pdFxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gZG9Ob3RSYWlzZUV2ZW50cyBmbGFnIHRvIGF2b2lkIHNlbmRpbmcgY3VzdG9tIGV2ZW50c1xuICAgICAqL1xuICAgIGxpYi5hdXRvSW5pdCA9IGZ1bmN0aW9uKGRvTm90UmFpc2VFdmVudHMpIHtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtcHltLXNyY106bm90KFtkYXRhLXB5bS1hdXRvLWluaXRpYWxpemVkXSknKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGVsZW1lbnRzLmxlbmd0aDtcblxuICAgICAgICAvLyBDbGVhbiBzdG9yZWQgaW5zdGFuY2VzIGluIGNhc2UgbmVlZGVkXG4gICAgICAgIF9jbGVhbkF1dG9Jbml0SW5zdGFuY2VzKCk7XG4gICAgICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IGxlbmd0aDsgKytpZHgpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZWxlbWVudHNbaWR4XTtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAqIE1hcmsgYXV0b21hdGljYWxseS1pbml0aWFsaXplZCBlbGVtZW50cyBzbyB0aGV5IGFyZSBub3RcbiAgICAgICAgICAgICogcmUtaW5pdGlhbGl6ZWQgaWYgdGhlIHVzZXIgaW5jbHVkZXMgcHltLmpzIG1vcmUgdGhhbiBvbmNlIGluIHRoZVxuICAgICAgICAgICAgKiBzYW1lIGRvY3VtZW50LlxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLXB5bS1hdXRvLWluaXRpYWxpemVkJywgJycpO1xuXG4gICAgICAgICAgICAvLyBFbnN1cmUgZWxlbWVudHMgaGF2ZSBhbiBpZFxuICAgICAgICAgICAgaWYgKGVsZW1lbnQuaWQgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5pZCA9ICdweW0tJyArIGlkeCArIFwiLVwiICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsNSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzcmMgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1weW0tc3JjJyk7XG5cbiAgICAgICAgICAgIC8vIExpc3Qgb2YgZGF0YSBhdHRyaWJ1dGVzIHRvIGNvbmZpZ3VyZSB0aGUgY29tcG9uZW50XG4gICAgICAgICAgICAvLyBzdHJ1Y3R1cmU6IHsnYXR0cmlidXRlIG5hbWUnOiAndHlwZSd9XG4gICAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB7J3hkb21haW4nOiAnc3RyaW5nJywgJ3RpdGxlJzogJ3N0cmluZycsICduYW1lJzogJ3N0cmluZycsICdpZCc6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzYW5kYm94JzogJ3N0cmluZycsICdhbGxvd2Z1bGxzY3JlZW4nOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3BhcmVudHVybHBhcmFtJzogJ3N0cmluZycsICdwYXJlbnR1cmx2YWx1ZSc6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdvcHRpb25hbHBhcmFtcyc6ICdib29sZWFuJywgJ3RyYWNrc2Nyb2xsJzogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzY3JvbGx3YWl0JzogJ251bWJlcid9O1xuXG4gICAgICAgICAgICB2YXIgY29uZmlnID0ge307XG5cbiAgICAgICAgICAgIGZvciAodmFyIGF0dHJpYnV0ZSBpbiBzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIC8vIHZpYSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9nZXRBdHRyaWJ1dGUjTm90ZXNcbiAgICAgICAgICAgICAgIGlmIChlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1weW0tJythdHRyaWJ1dGUpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBzd2l0Y2ggKHNldHRpbmdzW2F0dHJpYnV0ZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ1thdHRyaWJ1dGVdID0gIShlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1weW0tJythdHRyaWJ1dGUpID09PSAnZmFsc2UnKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgICAgICAgICBjb25maWdbYXR0cmlidXRlXSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXB5bS0nK2F0dHJpYnV0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG4gPSBOdW1iZXIoZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHltLScrYXR0cmlidXRlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKG4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnW2F0dHJpYnV0ZV0gPSBuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyKCd1bnJlY29nbml6ZWQgYXR0cmlidXRlIHR5cGUnKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU3RvcmUgcmVmZXJlbmNlcyB0byBhdXRvaW5pdGlhbGl6ZWQgcHltIGluc3RhbmNlc1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IG5ldyBsaWIuUGFyZW50KGVsZW1lbnQuaWQsIHNyYywgY29uZmlnKTtcbiAgICAgICAgICAgIGxpYi5hdXRvSW5pdEluc3RhbmNlcy5wdXNoKHBhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaXJlIGN1c3RvbUV2ZW50XG4gICAgICAgIGlmICghZG9Ob3RSYWlzZUV2ZW50cykge1xuICAgICAgICAgICAgX3JhaXNlQ3VzdG9tRXZlbnQoXCJweW0taW5pdGlhbGl6ZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmV0dXJuIHN0b3JlZCBhdXRvaW5pdGFsaXplZCBweW0gaW5zdGFuY2VzXG4gICAgICAgIHJldHVybiBsaWIuYXV0b0luaXRJbnN0YW5jZXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBQYXJlbnQgaGFsZiBvZiBhIHJlc3BvbnNlIGlmcmFtZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6cHltXG4gICAgICogQGNsYXNzIFBhcmVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBUaGUgaWQgb2YgdGhlIGRpdiBpbnRvIHdoaWNoIHRoZSBpZnJhbWUgd2lsbCBiZSByZW5kZXJlZC4gc2V0cyB7QGxpbmsgbW9kdWxlOnB5bS5QYXJlbnR+aWR9XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHVybCBUaGUgdXJsIG9mIHRoZSBpZnJhbWUgc291cmNlLiBzZXRzIHtAbGluayBtb2R1bGU6cHltLlBhcmVudH51cmx9XG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb25maWddIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBwYXJlbnQgaW5zdGFuY2UuIHNldHMge0BsaW5rIG1vZHVsZTpweW0uUGFyZW50fnNldHRpbmdzfVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnhkb21haW49JyonXSAtIHhkb21haW4gdG8gdmFsaWRhdGUgbWVzc2FnZXMgcmVjZWl2ZWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy50aXRsZV0gLSBpZiBwYXNzZWQgaXQgd2lsbCBiZSBhc3NpZ25lZCB0byB0aGUgaWZyYW1lIHRpdGxlIGF0dHJpYnV0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLm5hbWVdIC0gaWYgcGFzc2VkIGl0IHdpbGwgYmUgYXNzaWduZWQgdG8gdGhlIGlmcmFtZSBuYW1lIGF0dHJpYnV0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmlkXSAtIGlmIHBhc3NlZCBpdCB3aWxsIGJlIGFzc2lnbmVkIHRvIHRoZSBpZnJhbWUgaWQgYXR0cmlidXRlXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLmFsbG93ZnVsbHNjcmVlbl0gLSBpZiBwYXNzZWQgYW5kIGRpZmZlcmVudCB0aGFuIGZhbHNlIGl0IHdpbGwgYmUgYXNzaWduZWQgdG8gdGhlIGlmcmFtZSBhbGxvd2Z1bGxzY3JlZW4gYXR0cmlidXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2FuZGJveF0gLSBpZiBwYXNzZWQgaXQgd2lsbCBiZSBhc3NpZ25lZCB0byB0aGUgaWZyYW1lIHNhbmRib3ggYXR0cmlidXRlICh3ZSBkbyBub3QgdmFsaWRhdGUgdGhlIHN5bnRheCBzbyBiZSBjYXJlZnVsISEpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGFyZW50dXJscGFyYW1dIC0gaWYgcGFzc2VkIGl0IHdpbGwgYmUgb3ZlcnJpZGUgdGhlIGRlZmF1bHQgcGFyZW50VXJsIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXIgbmFtZSBwYXNzZWQgdG8gdGhlIGlmcmFtZSBzcmNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXJlbnR1cmx2YWx1ZV0gLSBpZiBwYXNzZWQgaXQgd2lsbCBiZSBvdmVycmlkZSB0aGUgZGVmYXVsdCBwYXJlbnRVcmwgcXVlcnkgc3RyaW5nIHBhcmFtZXRlciB2YWx1ZSBwYXNzZWQgdG8gdGhlIGlmcmFtZSBzcmNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5vcHRpb25hbHBhcmFtc10gLSBpZiBwYXNzZWQgYW5kIGRpZmZlcmVudCB0aGFuIGZhbHNlIGl0IHdpbGwgc3RyaXAgdGhlIHF1ZXJ5c3RyaW5nIHBhcmFtcyBwYXJlbnRVcmwgYW5kIHBhcmVudFRpdGxlIHBhc3NlZCB0byB0aGUgaWZyYW1lIHNyY1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy50cmFja3Njcm9sbF0gLSBpZiBwYXNzZWQgaXQgd2lsbCBhY3RpdmF0ZSBzY3JvbGwgdHJhY2tpbmcgb24gdGhlIHBhcmVudFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnNjcm9sbHdhaXRdIC0gaWYgcGFzc2VkIGl0IHdpbGwgc2V0IHRoZSB0aHJvdHRsZSB3YWl0IGluIG9yZGVyIHRvIGZpcmUgc2Nyb2xsIG1lc3NhZ2luZy4gRGVmYXVsdHMgdG8gMTAwIG1zLlxuICAgICAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUTUwvRWxlbWVudC9pZnJhbWUgaUZyYW1lfVxuICAgICAqL1xuICAgIGxpYi5QYXJlbnQgPSBmdW5jdGlvbihpZCwgdXJsLCBjb25maWcpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBpZCBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnRcbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uUGFyZW50XG4gICAgICAgICAqIEBtZW1iZXIge3N0cmluZ30gaWRcbiAgICAgICAgICogQGlubmVyXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgdXJsIHRoYXQgd2lsbCBiZSBzZXQgYXMgdGhlIGlmcmFtZSdzIHNyY1xuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5QYXJlbnRcbiAgICAgICAgICogQG1lbWJlciB7U3RyaW5nfSB1cmxcbiAgICAgICAgICogQGlubmVyXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVybCA9IHVybDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGNvbnRhaW5lciBET00gb2JqZWN0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6cHltLlBhcmVudFxuICAgICAgICAgKiBAbWVtYmVyIHtIVE1MRWxlbWVudH0gZWxcbiAgICAgICAgICogQGlubmVyXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGNvbnRhaW5lZCBjaGlsZCBpZnJhbWVcbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uUGFyZW50XG4gICAgICAgICAqIEBtZW1iZXIge0hUTUxFbGVtZW50fSBpZnJhbWVcbiAgICAgICAgICogQGlubmVyXG4gICAgICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaWZyYW1lID0gbnVsbDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwYXJlbnQgaW5zdGFuY2Ugc2V0dGluZ3MsIHVwZGF0ZWQgYnkgdGhlIHZhbHVlcyBwYXNzZWQgaW4gdGhlIGNvbmZpZyBvYmplY3RcbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uUGFyZW50XG4gICAgICAgICAqIEBtZW1iZXIge09iamVjdH0gc2V0dGluZ3NcbiAgICAgICAgICogQGlubmVyXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgICAgICAgeGRvbWFpbjogJyonLFxuICAgICAgICAgICAgb3B0aW9uYWxwYXJhbXM6IHRydWUsXG4gICAgICAgICAgICBwYXJlbnR1cmxwYXJhbTogJ3BhcmVudFVybCcsXG4gICAgICAgICAgICBwYXJlbnR1cmx2YWx1ZTogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgICB0cmFja3Njcm9sbDogZmFsc2UsXG4gICAgICAgICAgICBzY3JvbGx3YWl0OiAxMDAsXG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWd1bGFyRXhwcmVzc2lvbiB0byB2YWxpZGF0ZSB0aGUgcmVjZWl2ZWQgbWVzc2FnZXNcbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uUGFyZW50XG4gICAgICAgICAqIEBtZW1iZXIge1N0cmluZ30gbWVzc2FnZVJlZ2V4XG4gICAgICAgICAqIEBpbm5lclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tZXNzYWdlUmVnZXggPSBfbWFrZU1lc3NhZ2VSZWdleCh0aGlzLmlkKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0b3JlcyB0aGUgcmVnaXN0ZXJlZCBtZXNzYWdlSGFuZGxlcnMgZm9yIGVhY2ggbWVzc2FnZVR5cGVcbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uUGFyZW50XG4gICAgICAgICAqIEBtZW1iZXIge09iamVjdH0gbWVzc2FnZUhhbmRsZXJzXG4gICAgICAgICAqIEBpbm5lclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tZXNzYWdlSGFuZGxlcnMgPSB7fTtcblxuICAgICAgICAvLyBlbnN1cmUgYSBjb25maWcgb2JqZWN0XG4gICAgICAgIGNvbmZpZyA9IChjb25maWcgfHwge30pO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb25zdHJ1Y3QgdGhlIGlmcmFtZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uUGFyZW50XG4gICAgICAgICAqIEBtZXRob2QgX2NvbnN0cnVjdElmcmFtZVxuICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2NvbnN0cnVjdElmcmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSB3aWR0aCBvZiB0aGlzIGVsZW1lbnQuXG4gICAgICAgICAgICB2YXIgd2lkdGggPSB0aGlzLmVsLm9mZnNldFdpZHRoLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhbiBpZnJhbWUgZWxlbWVudCBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAgICB0aGlzLmlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuXG4gICAgICAgICAgICAvLyBTYXZlIGZyYWdtZW50IGlkXG4gICAgICAgICAgICB2YXIgaGFzaCA9ICcnO1xuICAgICAgICAgICAgdmFyIGhhc2hJbmRleCA9IHRoaXMudXJsLmluZGV4T2YoJyMnKTtcblxuICAgICAgICAgICAgaWYgKGhhc2hJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgaGFzaCA9IHRoaXMudXJsLnN1YnN0cmluZyhoYXNoSW5kZXgsIHRoaXMudXJsLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cmwgPSB0aGlzLnVybC5zdWJzdHJpbmcoMCwgaGFzaEluZGV4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgdGhlIFVSTCBjb250YWlucyBxdWVyeXN0cmluZyBiaXRzLCB1c2UgdGhlbS5cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSwganVzdCBjcmVhdGUgYSBzZXQgb2YgdmFsaWQgcGFyYW1zLlxuICAgICAgICAgICAgaWYgKHRoaXMudXJsLmluZGV4T2YoJz8nKSA8IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVybCArPSAnPyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXJsICs9ICcmJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXBwZW5kIHRoZSBpbml0aWFsIHdpZHRoIGFzIGEgcXVlcnlzdHJpbmcgcGFyYW1ldGVyXG4gICAgICAgICAgICAvLyBhbmQgb3B0aW9uYWwgcGFyYW1zIGlmIGNvbmZpZ3VyZWQgdG8gZG8gc29cbiAgICAgICAgICAgIHRoaXMuaWZyYW1lLnNyYyA9IHRoaXMudXJsICsgJ2luaXRpYWxXaWR0aD0nICsgd2lkdGggK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJmNoaWxkSWQ9JyArIHRoaXMuaWQ7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLm9wdGlvbmFscGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pZnJhbWUuc3JjICs9ICcmcGFyZW50VGl0bGU9JyArIGVuY29kZVVSSUNvbXBvbmVudChkb2N1bWVudC50aXRsZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pZnJhbWUuc3JjICs9ICcmJysgdGhpcy5zZXR0aW5ncy5wYXJlbnR1cmxwYXJhbSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnNldHRpbmdzLnBhcmVudHVybHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaWZyYW1lLnNyYyArPWhhc2g7XG5cbiAgICAgICAgICAgIC8vIFNldCBzb21lIGF0dHJpYnV0ZXMgdG8gdGhpcyBwcm90by1pZnJhbWUuXG4gICAgICAgICAgICB0aGlzLmlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgJzEwMCUnKTtcbiAgICAgICAgICAgIHRoaXMuaWZyYW1lLnNldEF0dHJpYnV0ZSgnc2Nyb2xsaW5nJywgJ25vJyk7XG4gICAgICAgICAgICB0aGlzLmlmcmFtZS5zZXRBdHRyaWJ1dGUoJ21hcmdpbmhlaWdodCcsICcwJyk7XG4gICAgICAgICAgICB0aGlzLmlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lYm9yZGVyJywgJzAnKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudGl0bGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3RpdGxlJywgdGhpcy5zZXR0aW5ncy50aXRsZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmFsbG93ZnVsbHNjcmVlbiAhPT0gdW5kZWZpbmVkICYmIHRoaXMuc2V0dGluZ3MuYWxsb3dmdWxsc2NyZWVuICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaWZyYW1lLnNldEF0dHJpYnV0ZSgnYWxsb3dmdWxsc2NyZWVuJywnJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnNhbmRib3ggIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGhpcy5zZXR0aW5ncy5zYW5kYm94ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRoaXMuaWZyYW1lLnNldEF0dHJpYnV0ZSgnc2FuZGJveCcsIHRoaXMuc2V0dGluZ3Muc2FuZGJveCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLnNldHRpbmdzLmlkKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2lkJywgdGhpcy5zZXR0aW5ncy5pZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5uYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pZnJhbWUuc2V0QXR0cmlidXRlKCduYW1lJywgdGhpcy5zZXR0aW5ncy5uYW1lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUmVwbGFjZSB0aGUgY2hpbGQgY29udGVudCBpZiBuZWVkZWRcbiAgICAgICAgICAgIC8vIChzb21lIENNU3MgbWlnaHQgc3RyaXAgb3V0IGVtcHR5IGVsZW1lbnRzKVxuICAgICAgICAgICAgd2hpbGUodGhpcy5lbC5maXJzdENoaWxkKSB7IHRoaXMuZWwucmVtb3ZlQ2hpbGQodGhpcy5lbC5maXJzdENoaWxkKTsgfVxuICAgICAgICAgICAgLy8gQXBwZW5kIHRoZSBpZnJhbWUgdG8gb3VyIGVsZW1lbnQuXG4gICAgICAgICAgICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMuaWZyYW1lKTtcblxuICAgICAgICAgICAgLy8gQWRkIGFuIGV2ZW50IGxpc3RlbmVyIHRoYXQgd2lsbCBoYW5kbGUgcmVkcmF3aW5nIHRoZSBjaGlsZCBvbiByZXNpemUuXG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5fb25SZXNpemUpO1xuXG4gICAgICAgICAgICAvLyBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgdGhhdCB3aWxsIHNlbmQgdGhlIGNoaWxkIHRoZSB2aWV3cG9ydC5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRyYWNrc2Nyb2xsKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMuX3Rocm90dGxlT25TY3JvbGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kIHdpZHRoIG9uIHJlc2l6ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uUGFyZW50XG4gICAgICAgICAqIEBtZXRob2QgX29uUmVzaXplXG4gICAgICAgICAqIEBpbm5lclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25SZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZFdpZHRoKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy50cmFja3Njcm9sbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VuZFZpZXdwb3J0QW5kSUZyYW1lUG9zaXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kIHZpZXdwb3J0IGFuZCBpZnJhbWUgaW5mbyBvbiBzY3JvbGwuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6cHltLlBhcmVudFxuICAgICAgICAgKiBAbWV0aG9kIF9vblNjcm9sbFxuICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX29uU2Nyb2xsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRWaWV3cG9ydEFuZElGcmFtZVBvc2l0aW9uKCk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmlyZSBhbGwgZXZlbnQgaGFuZGxlcnMgZm9yIGEgZ2l2ZW4gbWVzc2FnZSB0eXBlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5QYXJlbnRcbiAgICAgICAgICogQG1ldGhvZCBfZmlyZVxuICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VUeXBlIFRoZSB0eXBlIG9mIG1lc3NhZ2UuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIFRoZSBtZXNzYWdlIGRhdGEuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9maXJlID0gZnVuY3Rpb24obWVzc2FnZVR5cGUsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlVHlwZSBpbiB0aGlzLm1lc3NhZ2VIYW5kbGVycykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tZXNzYWdlSGFuZGxlcnNbbWVzc2FnZVR5cGVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlSGFuZGxlcnNbbWVzc2FnZVR5cGVdW2ldLmNhbGwodGhpcywgbWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgdGhpcyBwYXJlbnQgZnJvbSB0aGUgcGFnZSBhbmQgdW5iaW5kIGl0J3MgZXZlbnQgaGFuZGxlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6cHltLlBhcmVudFxuICAgICAgICAgKiBAbWV0aG9kIHJlbW92ZVxuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMuX3Byb2Nlc3NNZXNzYWdlKTtcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLl9vblJlc2l6ZSk7XG5cbiAgICAgICAgICAgIHRoaXMuZWwucmVtb3ZlQ2hpbGQodGhpcy5pZnJhbWUpO1xuICAgICAgICAgICAgLy8gX2NsZWFuQXV0b0luaXRJbnN0YW5jZXMgaW4gY2FzZSB0aGlzIHBhcmVudCB3YXMgYXV0b0luaXRpYWxpemVkXG4gICAgICAgICAgICBfY2xlYW5BdXRvSW5pdEluc3RhbmNlcygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm9jZXNzIGEgbmV3IG1lc3NhZ2UgZnJvbSB0aGUgY2hpbGQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6cHltLlBhcmVudFxuICAgICAgICAgKiBAbWV0aG9kIF9wcm9jZXNzTWVzc2FnZVxuICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSBBIG1lc3NhZ2UgZXZlbnQuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9wcm9jZXNzTWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIC8vIEZpcnN0LCBwdW50IGlmIHRoaXMgaXNuJ3QgZnJvbSBhbiBhY2NlcHRhYmxlIHhkb21haW4uXG4gICAgICAgICAgICBpZiAoIV9pc1NhZmVNZXNzYWdlKGUsIHRoaXMuc2V0dGluZ3MpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBEaXNjYXJkIG9iamVjdCBtZXNzYWdlcywgd2Ugb25seSBjYXJlIGFib3V0IHN0cmluZ3NcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZS5kYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gR3JhYiB0aGUgbWVzc2FnZSBmcm9tIHRoZSBjaGlsZCBhbmQgcGFyc2UgaXQuXG4gICAgICAgICAgICB2YXIgbWF0Y2ggPSBlLmRhdGEubWF0Y2godGhpcy5tZXNzYWdlUmVnZXgpO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIG1hdGNoIG9yIHRvbyBtYW55IG1hdGNoZXMgaW4gdGhlIG1lc3NhZ2UsIHB1bnQuXG4gICAgICAgICAgICBpZiAoIW1hdGNoIHx8IG1hdGNoLmxlbmd0aCAhPT0gMykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG1lc3NhZ2VUeXBlID0gbWF0Y2hbMV07XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IG1hdGNoWzJdO1xuXG4gICAgICAgICAgICB0aGlzLl9maXJlKG1lc3NhZ2VUeXBlLCBtZXNzYWdlKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXNpemUgaWZyYW1lIGluIHJlc3BvbnNlIHRvIG5ldyBoZWlnaHQgbWVzc2FnZSBmcm9tIGNoaWxkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5QYXJlbnRcbiAgICAgICAgICogQG1ldGhvZCBfb25IZWlnaHRNZXNzYWdlXG4gICAgICAgICAqIEBpbm5lclxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBUaGUgbmV3IGhlaWdodC5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX29uSGVpZ2h0TWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgKiBIYW5kbGUgcGFyZW50IGhlaWdodCBtZXNzYWdlIGZyb20gY2hpbGQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBwYXJzZUludChtZXNzYWdlKTtcblxuICAgICAgICAgICAgdGhpcy5pZnJhbWUuc2V0QXR0cmlidXRlKCdoZWlnaHQnLCBoZWlnaHQgKyAncHgnKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTmF2aWdhdGUgcGFyZW50IHRvIGEgbmV3IHVybC5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uUGFyZW50XG4gICAgICAgICAqIEBtZXRob2QgX29uTmF2aWdhdGVUb01lc3NhZ2VcbiAgICAgICAgICogQGlubmVyXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIFRoZSB1cmwgdG8gbmF2aWdhdGUgdG8uXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vbk5hdmlnYXRlVG9NZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAqIEhhbmRsZSBwYXJlbnQgc2Nyb2xsIG1lc3NhZ2UgZnJvbSBjaGlsZC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IG1lc3NhZ2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNjcm9sbCBwYXJlbnQgdG8gYSBnaXZlbiBjaGlsZCBwb3NpdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uUGFyZW50XG4gICAgICAgICAqIEBtZXRob2QgX29uU2Nyb2xsVG9DaGlsZFBvc01lc3NhZ2VcbiAgICAgICAgICogQGlubmVyXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIFRoZSBvZmZzZXQgaW5zaWRlIHRoZSBjaGlsZCBwYWdlLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25TY3JvbGxUb0NoaWxkUG9zTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIEdldCB0aGUgY2hpbGQgY29udGFpbmVyIHBvc2l0aW9uIHVzaW5nIGdldEJvdW5kaW5nQ2xpZW50UmVjdCArIHBhZ2VZT2Zmc2V0XG4gICAgICAgICAgICAvLyB2aWEgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvZ2V0Qm91bmRpbmdDbGllbnRSZWN0XG4gICAgICAgICAgICB2YXIgaWZyYW1lUG9zID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5pZCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgd2luZG93LnBhZ2VZT2Zmc2V0O1xuXG4gICAgICAgICAgICB2YXIgdG90YWxPZmZzZXQgPSBpZnJhbWVQb3MgKyBwYXJzZUludChtZXNzYWdlKTtcbiAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCB0b3RhbE9mZnNldCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJpbmQgYSBjYWxsYmFjayB0byBhIGdpdmVuIG1lc3NhZ2VUeXBlIGZyb20gdGhlIGNoaWxkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBSZXNlcnZlZCBtZXNzYWdlIG5hbWVzIGFyZTogXCJoZWlnaHRcIiwgXCJzY3JvbGxUb1wiIGFuZCBcIm5hdmlnYXRlVG9cIi5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uUGFyZW50XG4gICAgICAgICAqIEBtZXRob2Qgb25NZXNzYWdlXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVR5cGUgVGhlIHR5cGUgb2YgbWVzc2FnZSBiZWluZyBsaXN0ZW5lZCBmb3IuXG4gICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnB5bS5QYXJlbnR+b25NZXNzYWdlQ2FsbGJhY2t9IGNhbGxiYWNrIFRoZSBjYWxsYmFjayB0byBpbnZva2Ugd2hlbiBhIG1lc3NhZ2Ugb2YgdGhlIGdpdmVuIHR5cGUgaXMgcmVjZWl2ZWQuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm9uTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2VUeXBlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKCEobWVzc2FnZVR5cGUgaW4gdGhpcy5tZXNzYWdlSGFuZGxlcnMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlSGFuZGxlcnNbbWVzc2FnZVR5cGVdID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMubWVzc2FnZUhhbmRsZXJzW21lc3NhZ2VUeXBlXS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGNhbGxiYWNrIG1vZHVsZTpweW0uUGFyZW50fm9uTWVzc2FnZUNhbGxiYWNrXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIFRoZSBtZXNzYWdlIGRhdGEuXG4gICAgICAgICAqL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kIGEgbWVzc2FnZSB0byB0aGUgdGhlIGNoaWxkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5QYXJlbnRcbiAgICAgICAgICogQG1ldGhvZCBzZW5kTWVzc2FnZVxuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VUeXBlIFRoZSB0eXBlIG9mIG1lc3NhZ2UgdG8gc2VuZC5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgZGF0YSB0byBzZW5kLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2VUeXBlLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBXaGVuIHVzZWQgYWxvbmdzaWRlIHdpdGggcGpheCBzb21lIHJlZmVyZW5jZXMgYXJlIGxvc3RcbiAgICAgICAgICAgIGlmICh0aGlzLmVsLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93XG4gICAgICAgICAgICAgICAgICAgICAgICAucG9zdE1lc3NhZ2UoX21ha2VNZXNzYWdlKHRoaXMuaWQsIG1lc3NhZ2VUeXBlLCBtZXNzYWdlKSwgJyonKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENvbnRlbnRsZXNzIGNoaWxkIGRldGVjdGVkIHJlbW92ZSBsaXN0ZW5lcnMgYW5kIGlmcmFtZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJhbnNtaXQgdGhlIGN1cnJlbnQgaWZyYW1lIHdpZHRoIHRvIHRoZSBjaGlsZC5cbiAgICAgICAgICpcbiAgICAgICAgICogWW91IHNob3VsZG4ndCBuZWVkIHRvIGNhbGwgdGhpcyBkaXJlY3RseS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uUGFyZW50XG4gICAgICAgICAqIEBtZXRob2Qgc2VuZFdpZHRoXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZW5kV2lkdGggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IHRoaXMuZWwub2Zmc2V0V2lkdGgudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIHRoaXMuc2VuZE1lc3NhZ2UoJ3dpZHRoJywgd2lkdGgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmFuc21pdCB0aGUgY3VycmVudCB2aWV3cG9ydCBhbmQgaWZyYW1lIHBvc2l0aW9uIHRvIHRoZSBjaGlsZC5cbiAgICAgICAgICogU2VuZHMgdmlld3BvcnQgd2lkdGgsIHZpZXdwb3J0IGhlaWdodFxuICAgICAgICAgKiBhbmQgaWZyYW1lIGJvdW5kaW5nIHJlY3QgdG9wLWxlZnQtYm90dG9tLXJpZ2h0XG4gICAgICAgICAqIGFsbCBzZXBhcmF0ZWQgYnkgc3BhY2VzXG4gICAgICAgICAqXG4gICAgICAgICAqIFlvdSBzaG91bGRuJ3QgbmVlZCB0byBjYWxsIHRoaXMgZGlyZWN0bHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6cHltLlBhcmVudFxuICAgICAgICAgKiBAbWV0aG9kIHNlbmRWaWV3cG9ydEFuZElGcmFtZVBvc2l0aW9uXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZW5kVmlld3BvcnRBbmRJRnJhbWVQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGlmcmFtZVJlY3QgPSB0aGlzLmlmcmFtZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIHZhciB2V2lkdGggICA9IHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgIHZhciB2SGVpZ2h0ICA9IHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSB2V2lkdGggKyAnICcgKyB2SGVpZ2h0O1xuICAgICAgICAgICAgcGF5bG9hZCArPSAnICcgKyBpZnJhbWVSZWN0LnRvcCArICcgJyArIGlmcmFtZVJlY3QubGVmdDtcbiAgICAgICAgICAgIHBheWxvYWQgKz0gJyAnICsgaWZyYW1lUmVjdC5ib3R0b20gKyAnICcgKyBpZnJhbWVSZWN0LnJpZ2h0O1xuICAgICAgICAgICAgdGhpcy5zZW5kTWVzc2FnZSgndmlld3BvcnQtaWZyYW1lLXBvc2l0aW9uJywgcGF5bG9hZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQWRkIGFueSBvdmVycmlkZXMgdG8gc2V0dGluZ3MgY29taW5nIGZyb20gY29uZmlnLlxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY29uZmlnKSB7XG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzW2tleV0gPSBjb25maWdba2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaHJvdHRsZWQgc2Nyb2xsIGZ1bmN0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5QYXJlbnRcbiAgICAgICAgICogQG1ldGhvZCBfdGhyb3R0bGVPblNjcm9sbFxuICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3Rocm90dGxlT25TY3JvbGwgPSBfdGhyb3R0bGUodGhpcy5fb25TY3JvbGwuYmluZCh0aGlzKSwgdGhpcy5zZXR0aW5ncy5zY3JvbGx3YWl0KTtcblxuICAgICAgICAvLyBCaW5kIHJlcXVpcmVkIG1lc3NhZ2UgaGFuZGxlcnNcbiAgICAgICAgdGhpcy5vbk1lc3NhZ2UoJ2hlaWdodCcsIHRoaXMuX29uSGVpZ2h0TWVzc2FnZSk7XG4gICAgICAgIHRoaXMub25NZXNzYWdlKCduYXZpZ2F0ZVRvJywgdGhpcy5fb25OYXZpZ2F0ZVRvTWVzc2FnZSk7XG4gICAgICAgIHRoaXMub25NZXNzYWdlKCdzY3JvbGxUb0NoaWxkUG9zJywgdGhpcy5fb25TY3JvbGxUb0NoaWxkUG9zTWVzc2FnZSk7XG4gICAgICAgIHRoaXMub25NZXNzYWdlKCdwYXJlbnRQb3NpdGlvbkluZm8nLCB0aGlzLnNlbmRWaWV3cG9ydEFuZElGcmFtZVBvc2l0aW9uKTtcblxuICAgICAgICAvLyBBZGQgYSBsaXN0ZW5lciBmb3IgcHJvY2Vzc2luZyBtZXNzYWdlcyBmcm9tIHRoZSBjaGlsZC5cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLl9wcm9jZXNzTWVzc2FnZSwgZmFsc2UpO1xuXG4gICAgICAgIC8vIENvbnN0cnVjdCB0aGUgaWZyYW1lIGluIHRoZSBjb250YWluZXIgZWxlbWVudC5cbiAgICAgICAgdGhpcy5fY29uc3RydWN0SWZyYW1lKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBDaGlsZCBoYWxmIG9mIGEgcmVzcG9uc2l2ZSBpZnJhbWUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bVxuICAgICAqIEBjbGFzcyBDaGlsZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnXSBDb25maWd1cmF0aW9uIGZvciB0aGUgY2hpbGQgaW5zdGFuY2UuIHNldHMge0BsaW5rIG1vZHVsZTpweW0uQ2hpbGR+c2V0dGluZ3N9XG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NvbmZpZy5yZW5kZXJDYWxsYmFjaz1udWxsXSBDYWxsYmFjayBpbnZva2VkIGFmdGVyIHJlY2VpdmluZyBhIHJlc2l6ZSBldmVudCBmcm9tIHRoZSBwYXJlbnQsIHNldHMge0BsaW5rIG1vZHVsZTpweW0uQ2hpbGQjc2V0dGluZ3MucmVuZGVyQ2FsbGJhY2t9XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcueGRvbWFpbj0nKiddIC0geGRvbWFpbiB0byB2YWxpZGF0ZSBtZXNzYWdlcyByZWNlaXZlZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnBvbGxpbmc9MF0gLSBwb2xsaW5nIGZyZXF1ZW5jeSBpbiBtaWxsaXNlY29uZHMgdG8gc2VuZCBoZWlnaHQgdG8gcGFyZW50XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuaWRdIC0gcGFyZW50IGNvbnRhaW5lciBpZCB1c2VkIHdoZW4gbmF2aWdhdGluZyB0aGUgY2hpbGQgaWZyYW1lIHRvIGEgbmV3IHBhZ2UgYnV0IHdlIHdhbnQgdG8ga2VlcCBpdCByZXNwb25zaXZlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhcmVudHVybHBhcmFtXSAtIGlmIHBhc3NlZCBpdCB3aWxsIGJlIG92ZXJyaWRlIHRoZSBkZWZhdWx0IHBhcmVudFVybCBxdWVyeSBzdHJpbmcgcGFyYW1ldGVyIG5hbWUgZXhwZWN0ZWQgb24gdGhlIGlmcmFtZSBzcmNcbiAgICAgKi9cbiAgICBsaWIuQ2hpbGQgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBpbml0aWFsIHdpZHRoIG9mIHRoZSBwYXJlbnQgcGFnZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5DaGlsZFxuICAgICAgICAgKiBAbWVtYmVyIHtzdHJpbmd9IHBhcmVudFdpZHRoXG4gICAgICAgICAqIEBpbm5lclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wYXJlbnRXaWR0aCA9IG51bGw7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgaWQgb2YgdGhlIHBhcmVudCBjb250YWluZXJcbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uQ2hpbGRcbiAgICAgICAgICogQG1lbWJlciB7U3RyaW5nfSBpZFxuICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHRpdGxlIG9mIHRoZSBwYXJlbnQgcGFnZSBmcm9tIGRvY3VtZW50LnRpdGxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5DaGlsZFxuICAgICAgICAgKiBAbWVtYmVyIHtTdHJpbmd9IHBhcmVudFRpdGxlXG4gICAgICAgICAqIEBpbm5lclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wYXJlbnRUaXRsZSA9IG51bGw7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgVVJMIG9mIHRoZSBwYXJlbnQgcGFnZSBmcm9tIHdpbmRvdy5sb2NhdGlvbi5ocmVmLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5DaGlsZFxuICAgICAgICAgKiBAbWVtYmVyIHtTdHJpbmd9IHBhcmVudFVybFxuICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucGFyZW50VXJsID0gbnVsbDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBzZXR0aW5ncyBmb3IgdGhlIGNoaWxkIGluc3RhbmNlLiBDYW4gYmUgb3ZlcnJpZGVuIGJ5IHBhc3NpbmcgYSBjb25maWcgb2JqZWN0IHRvIHRoZSBjaGlsZCBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBpLmUuOiB2YXIgcHltQ2hpbGQgPSBuZXcgcHltLkNoaWxkKHtyZW5kZXJDYWxsYmFjazogcmVuZGVyLCB4ZG9tYWluOiBcIlxcXFwqXFwubnByXFwub3JnXCJ9KVxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5DaGlsZC5zZXR0aW5nc1xuICAgICAgICAgKiBAbWVtYmVyIHtPYmplY3R9IHNldHRpbmdzIC0gZGVmYXVsdCBzZXR0aW5ncyBmb3IgdGhlIGNoaWxkIGluc3RhbmNlXG4gICAgICAgICAqIEBpbm5lclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHtcbiAgICAgICAgICAgIHJlbmRlckNhbGxiYWNrOiBudWxsLFxuICAgICAgICAgICAgeGRvbWFpbjogJyonLFxuICAgICAgICAgICAgcG9sbGluZzogMCxcbiAgICAgICAgICAgIHBhcmVudHVybHBhcmFtOiAncGFyZW50VXJsJ1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgdGltZXJJZCBpbiBvcmRlciB0byBiZSBhYmxlIHRvIHN0b3Agd2hlbiBwb2xsaW5nIGlzIGVuYWJsZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uQ2hpbGRcbiAgICAgICAgICogQG1lbWJlciB7U3RyaW5nfSB0aW1lcklkXG4gICAgICAgICAqIEBpbm5lclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50aW1lcklkID0gbnVsbDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZ3VsYXJFeHByZXNzaW9uIHRvIHZhbGlkYXRlIHRoZSByZWNlaXZlZCBtZXNzYWdlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5DaGlsZFxuICAgICAgICAgKiBAbWVtYmVyIHtTdHJpbmd9IG1lc3NhZ2VSZWdleFxuICAgICAgICAgKiBAaW5uZXJcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubWVzc2FnZVJlZ2V4ID0gbnVsbDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0b3JlcyB0aGUgcmVnaXN0ZXJlZCBtZXNzYWdlSGFuZGxlcnMgZm9yIGVhY2ggbWVzc2FnZVR5cGVcbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uQ2hpbGRcbiAgICAgICAgICogQG1lbWJlciB7T2JqZWN0fSBtZXNzYWdlSGFuZGxlcnNcbiAgICAgICAgICogQGlubmVyXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1lc3NhZ2VIYW5kbGVycyA9IHt9O1xuXG4gICAgICAgIC8vIEVuc3VyZSBhIGNvbmZpZyBvYmplY3RcbiAgICAgICAgY29uZmlnID0gKGNvbmZpZyB8fCB7fSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJpbmQgYSBjYWxsYmFjayB0byBhIGdpdmVuIG1lc3NhZ2VUeXBlIGZyb20gdGhlIGNoaWxkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBSZXNlcnZlZCBtZXNzYWdlIG5hbWVzIGFyZTogXCJ3aWR0aFwiLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5DaGlsZFxuICAgICAgICAgKiBAbWV0aG9kIG9uTWVzc2FnZVxuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VUeXBlIFRoZSB0eXBlIG9mIG1lc3NhZ2UgYmVpbmcgbGlzdGVuZWQgZm9yLlxuICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTpweW0uQ2hpbGR+b25NZXNzYWdlQ2FsbGJhY2t9IGNhbGxiYWNrIFRoZSBjYWxsYmFjayB0byBpbnZva2Ugd2hlbiBhIG1lc3NhZ2Ugb2YgdGhlIGdpdmVuIHR5cGUgaXMgcmVjZWl2ZWQuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm9uTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2VUeXBlLCBjYWxsYmFjaykge1xuXG4gICAgICAgICAgICBpZiAoIShtZXNzYWdlVHlwZSBpbiB0aGlzLm1lc3NhZ2VIYW5kbGVycykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VIYW5kbGVyc1ttZXNzYWdlVHlwZV0gPSBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlSGFuZGxlcnNbbWVzc2FnZVR5cGVdLnB1c2goY2FsbGJhY2spO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAY2FsbGJhY2sgbW9kdWxlOnB5bS5DaGlsZH5vbk1lc3NhZ2VDYWxsYmFja1xuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBUaGUgbWVzc2FnZSBkYXRhLlxuICAgICAgICAgKi9cblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaXJlIGFsbCBldmVudCBoYW5kbGVycyBmb3IgYSBnaXZlbiBtZXNzYWdlIHR5cGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6cHltLkNoaWxkXG4gICAgICAgICAqIEBtZXRob2QgX2ZpcmVcbiAgICAgICAgICogQGlubmVyXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlVHlwZSBUaGUgdHlwZSBvZiBtZXNzYWdlLlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBUaGUgbWVzc2FnZSBkYXRhLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZmlyZSA9IGZ1bmN0aW9uKG1lc3NhZ2VUeXBlLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICogRmlyZSBhbGwgZXZlbnQgaGFuZGxlcnMgZm9yIGEgZ2l2ZW4gbWVzc2FnZSB0eXBlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAobWVzc2FnZVR5cGUgaW4gdGhpcy5tZXNzYWdlSGFuZGxlcnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWVzc2FnZUhhbmRsZXJzW21lc3NhZ2VUeXBlXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZUhhbmRsZXJzW21lc3NhZ2VUeXBlXVtpXS5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJvY2VzcyBhIG5ldyBtZXNzYWdlIGZyb20gdGhlIHBhcmVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uQ2hpbGRcbiAgICAgICAgICogQG1ldGhvZCBfcHJvY2Vzc01lc3NhZ2VcbiAgICAgICAgICogQGlubmVyXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgQSBtZXNzYWdlIGV2ZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcHJvY2Vzc01lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgKiBQcm9jZXNzIGEgbmV3IG1lc3NhZ2UgZnJvbSBwYXJlbnQgZnJhbWUuXG4gICAgICAgICAgICAqL1xuICAgICAgICAgICAgLy8gRmlyc3QsIHB1bnQgaWYgdGhpcyBpc24ndCBmcm9tIGFuIGFjY2VwdGFibGUgeGRvbWFpbi5cbiAgICAgICAgICAgIGlmICghX2lzU2FmZU1lc3NhZ2UoZSwgdGhpcy5zZXR0aW5ncykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERpc2NhcmQgb2JqZWN0IG1lc3NhZ2VzLCB3ZSBvbmx5IGNhcmUgYWJvdXQgc3RyaW5nc1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlLmRhdGEgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBHZXQgdGhlIG1lc3NhZ2UgZnJvbSB0aGUgcGFyZW50LlxuICAgICAgICAgICAgdmFyIG1hdGNoID0gZS5kYXRhLm1hdGNoKHRoaXMubWVzc2FnZVJlZ2V4KTtcblxuICAgICAgICAgICAgLy8gSWYgdGhlcmUncyBubyBtYXRjaCBvciBpdCdzIGEgYmFkIGZvcm1hdCwgcHVudC5cbiAgICAgICAgICAgIGlmICghbWF0Y2ggfHwgbWF0Y2gubGVuZ3RoICE9PSAzKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICB2YXIgbWVzc2FnZVR5cGUgPSBtYXRjaFsxXTtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gbWF0Y2hbMl07XG5cbiAgICAgICAgICAgIHRoaXMuX2ZpcmUobWVzc2FnZVR5cGUsIG1lc3NhZ2UpO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlc2l6ZSBpZnJhbWUgaW4gcmVzcG9uc2UgdG8gbmV3IHdpZHRoIG1lc3NhZ2UgZnJvbSBwYXJlbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6cHltLkNoaWxkXG4gICAgICAgICAqIEBtZXRob2QgX29uV2lkdGhNZXNzYWdlXG4gICAgICAgICAqIEBpbm5lclxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBUaGUgbmV3IHdpZHRoLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25XaWR0aE1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICogSGFuZGxlIHdpZHRoIG1lc3NhZ2UgZnJvbSB0aGUgY2hpbGQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAvLyBDaGFuZ2UgdGhlIHdpZHRoIGlmIGl0J3MgZGlmZmVyZW50LlxuICAgICAgICAgICAgaWYgKHdpZHRoICE9PSB0aGlzLnBhcmVudFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRXaWR0aCA9IHdpZHRoO1xuXG4gICAgICAgICAgICAgICAgLy8gQ2FsbCB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gaWYgaXQgZXhpc3RzLlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnJlbmRlckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MucmVuZGVyQ2FsbGJhY2sod2lkdGgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFNlbmQgdGhlIGhlaWdodCBiYWNrIHRvIHRoZSBwYXJlbnQuXG4gICAgICAgICAgICAgICAgdGhpcy5zZW5kSGVpZ2h0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbmQgYSBtZXNzYWdlIHRvIHRoZSB0aGUgUGFyZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5DaGlsZFxuICAgICAgICAgKiBAbWV0aG9kIHNlbmRNZXNzYWdlXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVR5cGUgVGhlIHR5cGUgb2YgbWVzc2FnZSB0byBzZW5kLlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBUaGUgbWVzc2FnZSBkYXRhIHRvIHNlbmQuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZVR5cGUsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgKiBTZW5kIGEgbWVzc2FnZSB0byB0aGUgcGFyZW50LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKF9tYWtlTWVzc2FnZSh0aGlzLmlkLCBtZXNzYWdlVHlwZSwgbWVzc2FnZSksICcqJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyYW5zbWl0IHRoZSBjdXJyZW50IGlmcmFtZSBoZWlnaHQgdG8gdGhlIHBhcmVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogQ2FsbCB0aGlzIGRpcmVjdGx5IGluIGNhc2VzIHdoZXJlIHlvdSBtYW51YWxseSBhbHRlciB0aGUgaGVpZ2h0IG9mIHRoZSBpZnJhbWUgY29udGVudHMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6cHltLkNoaWxkXG4gICAgICAgICAqIEBtZXRob2Qgc2VuZEhlaWdodFxuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2VuZEhlaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gR2V0IHRoZSBjaGlsZCdzIGhlaWdodC5cbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdLm9mZnNldEhlaWdodC50b1N0cmluZygpO1xuXG4gICAgICAgICAgICAvLyBTZW5kIHRoZSBoZWlnaHQgdG8gdGhlIHBhcmVudC5cbiAgICAgICAgICAgIHRoaXMuc2VuZE1lc3NhZ2UoJ2hlaWdodCcsIGhlaWdodCk7XG5cbiAgICAgICAgICAgIHJldHVybiBoZWlnaHQ7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQXNrIHBhcmVudCB0byBzZW5kIHRoZSBjdXJyZW50IHZpZXdwb3J0IGFuZCBpZnJhbWUgcG9zaXRpb24gaW5mb3JtYXRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uQ2hpbGRcbiAgICAgICAgICogQG1ldGhvZCBzZW5kSGVpZ2h0XG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5nZXRQYXJlbnRQb3NpdGlvbkluZm8gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFNlbmQgdGhlIGhlaWdodCB0byB0aGUgcGFyZW50LlxuICAgICAgICAgICAgdGhpcy5zZW5kTWVzc2FnZSgncGFyZW50UG9zaXRpb25JbmZvJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNjcm9sbCBwYXJlbnQgdG8gYSBnaXZlbiBlbGVtZW50IGlkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5DaGlsZFxuICAgICAgICAgKiBAbWV0aG9kIHNjcm9sbFBhcmVudFRvXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gaGFzaCBUaGUgaWQgb2YgdGhlIGVsZW1lbnQgdG8gc2Nyb2xsIHRvLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnRUbyA9IGZ1bmN0aW9uKGhhc2gpIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZE1lc3NhZ2UoJ25hdmlnYXRlVG8nLCAnIycgKyBoYXNoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTmF2aWdhdGUgcGFyZW50IHRvIGEgZ2l2ZW4gdXJsLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5DaGlsZFxuICAgICAgICAgKiBAbWV0aG9kIG5hdmlnYXRlUGFyZW50VG9cbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgVGhlIHVybCB0byBuYXZpZ2F0ZSB0by5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubmF2aWdhdGVQYXJlbnRUbyA9IGZ1bmN0aW9uKHVybCkge1xuICAgICAgICAgICAgdGhpcy5zZW5kTWVzc2FnZSgnbmF2aWdhdGVUbycsIHVybCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNjcm9sbCBwYXJlbnQgdG8gYSBnaXZlbiBjaGlsZCBlbGVtZW50IGlkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOnB5bS5DaGlsZFxuICAgICAgICAgKiBAbWV0aG9kIHNjcm9sbFBhcmVudFRvQ2hpbGRFbFxuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGlkIFRoZSBpZCBvZiB0aGUgY2hpbGQgZWxlbWVudCB0byBzY3JvbGwgdG8uXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnNjcm9sbFBhcmVudFRvQ2hpbGRFbCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICAvLyBHZXQgdGhlIGNoaWxkIGVsZW1lbnQgcG9zaXRpb24gdXNpbmcgZ2V0Qm91bmRpbmdDbGllbnRSZWN0ICsgcGFnZVlPZmZzZXRcbiAgICAgICAgICAgIC8vIHZpYSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9nZXRCb3VuZGluZ0NsaWVudFJlY3RcbiAgICAgICAgICAgIHZhciB0b3BQb3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgd2luZG93LnBhZ2VZT2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnRUb0NoaWxkUG9zKHRvcFBvcyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNjcm9sbCBwYXJlbnQgdG8gYSBwYXJ0aWN1bGFyIGNoaWxkIG9mZnNldC5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uQ2hpbGRcbiAgICAgICAgICogQG1ldGhvZCBzY3JvbGxQYXJlbnRUb0NoaWxkUG9zXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gcG9zIFRoZSBvZmZzZXQgb2YgdGhlIGNoaWxkIGVsZW1lbnQgdG8gc2Nyb2xsIHRvLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnRUb0NoaWxkUG9zID0gZnVuY3Rpb24ocG9zKSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRNZXNzYWdlKCdzY3JvbGxUb0NoaWxkUG9zJywgcG9zLnRvU3RyaW5nKCkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYXJrIFdoZXRoZXIgdGhlIGNoaWxkIGlzIGVtYmVkZGVkIG9yIG5vdFxuICAgICAgICAgKiBleGVjdXRlcyBhIGNhbGxiYWNrIGluIGNhc2UgaXQgd2FzIHBhc3NlZCB0byB0aGUgY29uZmlnXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6cHltLkNoaWxkXG4gICAgICAgICAqIEBtZXRob2QgX21hcmtXaGV0aGVyRW1iZWRkZWRcbiAgICAgICAgICogQGlubmVyXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7bW9kdWxlOnB5bS5DaGlsZH5vbk1hcmtlZEVtYmVkZGVkU3RhdHVzfSBUaGUgY2FsbGJhY2sgdG8gZXhlY3V0ZSBhZnRlciBkZXRlcm1pbmluZyB3aGV0aGVyIGVtYmVkZGVkIG9yIG5vdC5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfbWFya1doZXRoZXJFbWJlZGRlZCA9IGZ1bmN0aW9uKG9uTWFya2VkRW1iZWRkZWRTdGF0dXMpIHtcbiAgICAgICAgICB2YXIgaHRtbEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaHRtbCcpWzBdLFxuICAgICAgICAgICAgICBuZXdDbGFzc0Zvckh0bWwsXG4gICAgICAgICAgICAgIG9yaWdpbmFsSHRtbENsYXNzZXMgPSBodG1sRWxlbWVudC5jbGFzc05hbWU7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmKHdpbmRvdy5zZWxmICE9PSB3aW5kb3cudG9wKSB7XG4gICAgICAgICAgICAgIG5ld0NsYXNzRm9ySHRtbCA9IFwiZW1iZWRkZWRcIjtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICBuZXdDbGFzc0Zvckh0bWwgPSBcIm5vdC1lbWJlZGRlZFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1jYXRjaChlKSB7XG4gICAgICAgICAgICBuZXdDbGFzc0Zvckh0bWwgPSBcImVtYmVkZGVkXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKG9yaWdpbmFsSHRtbENsYXNzZXMuaW5kZXhPZihuZXdDbGFzc0Zvckh0bWwpIDwgMCkge1xuICAgICAgICAgICAgaHRtbEVsZW1lbnQuY2xhc3NOYW1lID0gb3JpZ2luYWxIdG1sQ2xhc3NlcyA/IG9yaWdpbmFsSHRtbENsYXNzZXMgKyAnICcgKyBuZXdDbGFzc0Zvckh0bWwgOiBuZXdDbGFzc0Zvckh0bWw7XG4gICAgICAgICAgICBpZihvbk1hcmtlZEVtYmVkZGVkU3RhdHVzKXtcbiAgICAgICAgICAgICAgb25NYXJrZWRFbWJlZGRlZFN0YXR1cyhuZXdDbGFzc0Zvckh0bWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3JhaXNlQ3VzdG9tRXZlbnQoXCJtYXJrZWQtZW1iZWRkZWRcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAY2FsbGJhY2sgbW9kdWxlOnB5bS5DaGlsZH5vbk1hcmtlZEVtYmVkZGVkU3RhdHVzXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc25hbWUgXCJlbWJlZGRlZFwiIG9yIFwibm90LWVtYmVkZGVkXCIuXG4gICAgICAgICAqL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVbmJpbmQgY2hpbGQgZXZlbnQgaGFuZGxlcnMgYW5kIHRpbWVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIG1vZHVsZTpweW0uQ2hpbGRcbiAgICAgICAgICogQG1ldGhvZCByZW1vdmVcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLl9wcm9jZXNzTWVzc2FnZSk7XG4gICAgICAgICAgICBpZiAodGhpcy50aW1lcklkKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgc2V0dGluZ3Mgd2l0aCBvdmVycmlkZXMuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjb25maWcpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3Nba2V5XSA9IGNvbmZpZ1trZXldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWRlbnRpZnkgd2hhdCBJRCB0aGUgcGFyZW50IGtub3dzIHRoaXMgY2hpbGQgYXMuXG4gICAgICAgIHRoaXMuaWQgPSBfZ2V0UGFyYW1ldGVyQnlOYW1lKCdjaGlsZElkJykgfHwgY29uZmlnLmlkO1xuICAgICAgICB0aGlzLm1lc3NhZ2VSZWdleCA9IG5ldyBSZWdFeHAoJ15weW0nICsgTUVTU0FHRV9ERUxJTUlURVIgKyB0aGlzLmlkICsgTUVTU0FHRV9ERUxJTUlURVIgKyAnKFxcXFxTKyknICsgTUVTU0FHRV9ERUxJTUlURVIgKyAnKC4qKSQnKTtcblxuICAgICAgICAvLyBHZXQgdGhlIGluaXRpYWwgd2lkdGggZnJvbSBhIFVSTCBwYXJhbWV0ZXIuXG4gICAgICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KF9nZXRQYXJhbWV0ZXJCeU5hbWUoJ2luaXRpYWxXaWR0aCcpKTtcblxuICAgICAgICAvLyBHZXQgdGhlIHVybCBvZiB0aGUgcGFyZW50IGZyYW1lXG4gICAgICAgIHRoaXMucGFyZW50VXJsID0gX2dldFBhcmFtZXRlckJ5TmFtZSh0aGlzLnNldHRpbmdzLnBhcmVudHVybHBhcmFtKTtcblxuICAgICAgICAvLyBHZXQgdGhlIHRpdGxlIG9mIHRoZSBwYXJlbnQgZnJhbWVcbiAgICAgICAgdGhpcy5wYXJlbnRUaXRsZSA9IF9nZXRQYXJhbWV0ZXJCeU5hbWUoJ3BhcmVudFRpdGxlJyk7XG5cbiAgICAgICAgLy8gQmluZCB0aGUgcmVxdWlyZWQgbWVzc2FnZSBoYW5kbGVyc1xuICAgICAgICB0aGlzLm9uTWVzc2FnZSgnd2lkdGgnLCB0aGlzLl9vbldpZHRoTWVzc2FnZSk7XG5cbiAgICAgICAgLy8gU2V0IHVwIGEgbGlzdGVuZXIgdG8gaGFuZGxlIGFueSBpbmNvbWluZyBtZXNzYWdlcy5cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLl9wcm9jZXNzTWVzc2FnZSwgZmFsc2UpO1xuXG4gICAgICAgIC8vIElmIHRoZXJlJ3MgYSBjYWxsYmFjayBmdW5jdGlvbiwgY2FsbCBpdC5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MucmVuZGVyQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MucmVuZGVyQ2FsbGJhY2sod2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2VuZCB0aGUgaW5pdGlhbCBoZWlnaHQgdG8gdGhlIHBhcmVudC5cbiAgICAgICAgdGhpcy5zZW5kSGVpZ2h0KCk7XG5cbiAgICAgICAgLy8gSWYgd2UncmUgY29uZmlndXJlZCB0byBwb2xsLCBjcmVhdGUgYSBzZXRJbnRlcnZhbCB0byBoYW5kbGUgdGhhdC5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MucG9sbGluZykge1xuICAgICAgICAgICAgdGhpcy50aW1lcklkID0gd2luZG93LnNldEludGVydmFsKHRoaXMuc2VuZEhlaWdodCwgdGhpcy5zZXR0aW5ncy5wb2xsaW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9tYXJrV2hldGhlckVtYmVkZGVkKGNvbmZpZy5vbk1hcmtlZEVtYmVkZGVkU3RhdHVzKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLy8gSW5pdGlhbGl6ZSBlbGVtZW50cyB3aXRoIHB5bSBkYXRhIGF0dHJpYnV0ZXNcbiAgICAvLyBpZiB3ZSBhcmUgbm90IGluIHNlcnZlciBjb25maWd1cmF0aW9uXG4gICAgaWYodHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGxpYi5hdXRvSW5pdCh0cnVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbGliO1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfcHltID0gcmVxdWlyZSgncHltLmpzJyk7XG5cbnZhciBfcHltMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3B5bSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbnZhciB3ZXJrcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5jaGFydHdlcmsnKTsgLy8gVXNlcyBQT0xJVElDTyBmb3JrIG9mIHB5bS5qczogaHR0cHM6Ly9naXRodWIuY29tL1RoZS1Qb2xpdGljby9weW0uanNcbi8vIENoZWNrcyBmb3IgZXhpc3RlbmNlIG9mIHB5bSBiZWZvcmUgc2V0dGluZyBnbG9iYWwuXG5cblxuZm9yICh2YXIgaSA9IDA7IGkgPCB3ZXJrcy5sZW5ndGg7IGkrKykge1xuICB2YXIgd2VyayA9IHdlcmtzW2ldO1xuICB2YXIgaWQgPSB3ZXJrLmRhdGFzZXQuaWQ7XG4gIHZhciBjaGFydFBhdGggPSB3ZXJrLmRhdGFzZXQuc3JjO1xuICB2YXIgcGF0aHMgPSB7XG4gICAgc2luZ2xlOiAnJyArIGNoYXJ0UGF0aCArIGlkICsgJ19zaW5nbGUuaHRtbCcsXG4gICAgZG91YmxlOiAnJyArIGNoYXJ0UGF0aCArIGlkICsgJy5odG1sJ1xuICB9O1xuICB2YXIgZGltZW5zaW9ucyA9IEpTT04ucGFyc2Uod2Vyay5kYXRhc2V0LmRpbWVuc2lvbnMpO1xuICB2YXIgc2l6ZSA9IHdlcmsuZGF0YXNldC5zaXplO1xuICB2YXIgdmlld3BvcnRXaWR0aCA9IHdlcmsucGFyZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgdmFyIHB5bVBhcmVudCA9IHZvaWQgMDtcbiAgLy8gQ2hlY2sgaWYgaWZyYW1lIGFscmVhZHkgZW1iZWRkZWQuIChIYW5kbGVzIGZvciBtdWx0aXBsZSBlbWJlZGRlZCBjaGFydHMuLi4pXG4gIGlmICh3ZXJrLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lmcmFtZScpLmxlbmd0aCA8IDEpIHtcbiAgICAvLyBkb3VibGUtd2lkZVxuICAgIGlmIChzaXplID09PSAnZG91YmxlJykge1xuICAgICAgaWYgKHZpZXdwb3J0V2lkdGggPiBkaW1lbnNpb25zLmRvdWJsZS53aWR0aCkge1xuICAgICAgICB3ZXJrLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgICAgICBweW1QYXJlbnQgPSBuZXcgX3B5bTIuZGVmYXVsdC5QYXJlbnQod2Vyay5pZCwgcGF0aHMuZG91YmxlLCB7fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3ZXJrLnN0eWxlLndpZHRoID0gZGltZW5zaW9ucy5zaW5nbGUud2lkdGggKyAncHgnO1xuICAgICAgICBweW1QYXJlbnQgPSBuZXcgX3B5bTIuZGVmYXVsdC5QYXJlbnQod2Vyay5pZCwgcGF0aHMuc2luZ2xlLCB7fSk7XG4gICAgICAgIC8vIEFkZCBhIGNsYXNzIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGZsb2F0IGRpdlxuICAgICAgICBpZiAodmlld3BvcnRXaWR0aCA+IGRpbWVuc2lvbnMuc2luZ2xlLndpZHRoICogMS43NSkge1xuICAgICAgICAgIHdlcmsuY2xhc3NMaXN0LmFkZCgnZmxvYXRlZCcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBzaW5nbGUtd2lkZVxuICAgIH0gZWxzZSB7XG4gICAgICB3ZXJrLnN0eWxlLndpZHRoID0gZGltZW5zaW9ucy5zaW5nbGUud2lkdGggKyAncHgnO1xuICAgICAgcHltUGFyZW50ID0gbmV3IF9weW0yLmRlZmF1bHQuUGFyZW50KHdlcmsuaWQsIHBhdGhzLnNpbmdsZSwge30pO1xuICAgICAgLy8gQWRkIGEgY2xhc3Mgd2hpY2ggY2FuIGJlIHVzZWQgdG8gZmxvYXQgZGl2XG4gICAgICBpZiAodmlld3BvcnRXaWR0aCA+IGRpbWVuc2lvbnMuc2luZ2xlLndpZHRoICogMS43NSkge1xuICAgICAgICB3ZXJrLmNsYXNzTGlzdC5hZGQoJ2Zsb2F0ZWQnKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltMWhhVzR0WlcxaVpXUXVhbk1pWFN3aWJtRnRaWE1pT2xzaWQyVnlhM01pTENKa2IyTjFiV1Z1ZENJc0luRjFaWEo1VTJWc1pXTjBiM0pCYkd3aUxDSnBJaXdpYkdWdVozUm9JaXdpZDJWeWF5SXNJbWxrSWl3aVpHRjBZWE5sZENJc0ltTm9ZWEowVUdGMGFDSXNJbk55WXlJc0luQmhkR2h6SWl3aWMybHVaMnhsSWl3aVpHOTFZbXhsSWl3aVpHbHRaVzV6YVc5dWN5SXNJa3BUVDA0aUxDSndZWEp6WlNJc0luTnBlbVVpTENKMmFXVjNjRzl5ZEZkcFpIUm9JaXdpY0dGeVpXNTBSV3hsYldWdWRDSXNJbU5zYVdWdWRGZHBaSFJvSWl3aWNIbHRVR0Z5Wlc1MElpd2lkMmxrZEdnaUxDSnpkSGxzWlNJc0lsQmhjbVZ1ZENJc0ltTnNZWE56VEdsemRDSXNJbUZrWkNKZExDSnRZWEJ3YVc1bmN5STZJanM3UVVGRlFUczdPenM3TzBGQlJVRXNTVUZCVFVFc1VVRkJVVU1zVTBGQlUwTXNaMEpCUVZRc1EwRkJNRUlzV1VGQk1VSXNRMEZCWkN4RExFTkJTa0U3UVVGRFFUczdPMEZCUzBFc1MwRkJTeXhKUVVGSlF5eEpRVUZKTEVOQlFXSXNSVUZCWjBKQkxFbEJRVWxJTEUxQlFVMUpMRTFCUVRGQ0xFVkJRV3REUkN4SFFVRnNReXhGUVVGMVF6dEJRVU55UXl4TlFVRk5SU3hQUVVGUFRDeE5RVUZOUnl4RFFVRk9MRU5CUVdJN1FVRkRRU3hOUVVGTlJ5eExRVUZMUkN4TFFVRkxSU3hQUVVGTUxFTkJRV0ZFTEVWQlFYaENPMEZCUTBFc1RVRkJUVVVzV1VGQldVZ3NTMEZCUzBVc1QwRkJUQ3hEUVVGaFJTeEhRVUV2UWp0QlFVTkJMRTFCUVUxRExGRkJRVkU3UVVGRFdrTXNhVUpCUVZkSUxGTkJRVmdzUjBGQmRVSkdMRVZCUVhaQ0xHbENRVVJaTzBGQlJWcE5MR2xDUVVGWFNpeFRRVUZZTEVkQlFYVkNSaXhGUVVGMlFqdEJRVVpaTEVkQlFXUTdRVUZKUVN4TlFVRk5UeXhoUVVGaFF5eExRVUZMUXl4TFFVRk1MRU5CUVZkV0xFdEJRVXRGTEU5QlFVd3NRMEZCWVUwc1ZVRkJlRUlzUTBGQmJrSTdRVUZEUVN4TlFVRk5SeXhQUVVGUFdDeExRVUZMUlN4UFFVRk1MRU5CUVdGVExFbEJRVEZDTzBGQlEwRXNUVUZCVFVNc1owSkJRV2RDV2l4TFFVRkxZU3hoUVVGTUxFTkJRVzFDUXl4WFFVRjZRenRCUVVOQkxFMUJRVWxETEd0Q1FVRktPMEZCUTBFN1FVRkRRU3hOUVVGSlppeExRVUZMU0N4blFrRkJUQ3hEUVVGelFpeFJRVUYwUWl4RlFVRm5RMFVzVFVGQmFFTXNSMEZCZVVNc1EwRkJOME1zUlVGQlowUTdRVUZET1VNN1FVRkRRU3hSUVVGSldTeFRRVUZUTEZGQlFXSXNSVUZCZFVJN1FVRkRja0lzVlVGQlNVTXNaMEpCUVdkQ1NpeFhRVUZYUkN4TlFVRllMRU5CUVd0Q1V5eExRVUYwUXl4RlFVRTJRenRCUVVNelEyaENMR0ZCUVV0cFFpeExRVUZNTEVOQlFWZEVMRXRCUVZnc1IwRkJiVUlzVFVGQmJrSTdRVUZEUVVRc2IwSkJRVmtzU1VGQlNTeGpRVUZKUnl4TlFVRlNMRU5CUVdWc1FpeExRVUZMUXl4RlFVRndRaXhGUVVGM1Fra3NUVUZCVFVVc1RVRkJPVUlzUlVGQmMwTXNSVUZCZEVNc1EwRkJXanRCUVVORUxFOUJTRVFzVFVGSFR6dEJRVU5NVUN4aFFVRkxhVUlzUzBGQlRDeERRVUZYUkN4TFFVRllMRWRCUVhOQ1VpeFhRVUZYUml4TlFVRllMRU5CUVd0Q1ZTeExRVUY0UXp0QlFVTkJSQ3h2UWtGQldTeEpRVUZKTEdOQlFVbEhMRTFCUVZJc1EwRkJaV3hDTEV0QlFVdERMRVZCUVhCQ0xFVkJRWGRDU1N4TlFVRk5ReXhOUVVFNVFpeEZRVUZ6UXl4RlFVRjBReXhEUVVGYU8wRkJRMEU3UVVGRFFTeFpRVUZKVFN4blFrRkJhVUpLTEZkQlFWZEdMRTFCUVZnc1EwRkJhMEpWTEV0QlFXeENMRWRCUVRCQ0xFbEJRUzlETEVWQlFYTkVPMEZCUTNCRWFFSXNaVUZCUzIxQ0xGTkJRVXdzUTBGQlpVTXNSMEZCWml4RFFVRnRRaXhUUVVGdVFqdEJRVU5FTzBGQlEwWTdRVUZEU0R0QlFVTkRMRXRCWWtRc1RVRmhUenRCUVVOTWNFSXNWMEZCUzJsQ0xFdEJRVXdzUTBGQlYwUXNTMEZCV0N4SFFVRnpRbElzVjBGQlYwWXNUVUZCV0N4RFFVRnJRbFVzUzBGQmVFTTdRVUZEUVVRc2EwSkJRVmtzU1VGQlNTeGpRVUZKUnl4TlFVRlNMRU5CUVdWc1FpeExRVUZMUXl4RlFVRndRaXhGUVVGM1Fra3NUVUZCVFVNc1RVRkJPVUlzUlVGQmMwTXNSVUZCZEVNc1EwRkJXanRCUVVOQk8wRkJRMEVzVlVGQlNVMHNaMEpCUVdsQ1NpeFhRVUZYUml4TlFVRllMRU5CUVd0Q1ZTeExRVUZzUWl4SFFVRXdRaXhKUVVFdlF5eEZRVUZ6UkR0QlFVTndSR2hDTEdGQlFVdHRRaXhUUVVGTUxFTkJRV1ZETEVkQlFXWXNRMEZCYlVJc1UwRkJia0k3UVVGRFJEdEJRVU5HTzBGQlEwWTdRVUZEUmlJc0ltWnBiR1VpT2lKdFlXbHVMV1Z0WW1Wa0xtcHpJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpTHk4Z1ZYTmxjeUJRVDB4SlZFbERUeUJtYjNKcklHOW1JSEI1YlM1cWN6b2dhSFIwY0hNNkx5OW5hWFJvZFdJdVkyOXRMMVJvWlMxUWIyeHBkR2xqYnk5d2VXMHVhbk5jYmk4dklFTm9aV05yY3lCbWIzSWdaWGhwYzNSbGJtTmxJRzltSUhCNWJTQmlaV1p2Y21VZ2MyVjBkR2x1WnlCbmJHOWlZV3d1WEc1cGJYQnZjblFnY0hsdElHWnliMjBnSjNCNWJTNXFjeWM3WEc1Y2JtTnZibk4wSUhkbGNtdHpJRDBnWkc5amRXMWxiblF1Y1hWbGNubFRaV3hsWTNSdmNrRnNiQ2duTG1Ob1lYSjBkMlZ5YXljcE8xeHVYRzVtYjNJZ0tHeGxkQ0JwSUQwZ01Ec2dhU0E4SUhkbGNtdHpMbXhsYm1kMGFEc2dhU3NyS1NCN1hHNGdJR052Ym5OMElIZGxjbXNnUFNCM1pYSnJjMXRwWFR0Y2JpQWdZMjl1YzNRZ2FXUWdQU0IzWlhKckxtUmhkR0Z6WlhRdWFXUTdYRzRnSUdOdmJuTjBJR05vWVhKMFVHRjBhQ0E5SUhkbGNtc3VaR0YwWVhObGRDNXpjbU03WEc0Z0lHTnZibk4wSUhCaGRHaHpJRDBnZTF4dUlDQWdJSE5wYm1kc1pUb2dZQ1I3WTJoaGNuUlFZWFJvZlNSN2FXUjlYM05wYm1kc1pTNW9kRzFzWUN4Y2JpQWdJQ0JrYjNWaWJHVTZJR0FrZTJOb1lYSjBVR0YwYUgwa2UybGtmUzVvZEcxc1lDeGNiaUFnZlR0Y2JpQWdZMjl1YzNRZ1pHbHRaVzV6YVc5dWN5QTlJRXBUVDA0dWNHRnljMlVvZDJWeWF5NWtZWFJoYzJWMExtUnBiV1Z1YzJsdmJuTXBPMXh1SUNCamIyNXpkQ0J6YVhwbElEMGdkMlZ5YXk1a1lYUmhjMlYwTG5OcGVtVTdYRzRnSUdOdmJuTjBJSFpwWlhkd2IzSjBWMmxrZEdnZ1BTQjNaWEpyTG5CaGNtVnVkRVZzWlcxbGJuUXVZMnhwWlc1MFYybGtkR2c3WEc0Z0lHeGxkQ0J3ZVcxUVlYSmxiblE3WEc0Z0lDOHZJRU5vWldOcklHbG1JR2xtY21GdFpTQmhiSEpsWVdSNUlHVnRZbVZrWkdWa0xpQW9TR0Z1Wkd4bGN5Qm1iM0lnYlhWc2RHbHdiR1VnWlcxaVpXUmtaV1FnWTJoaGNuUnpMaTR1S1Z4dUlDQnBaaUFvZDJWeWF5NXhkV1Z5ZVZObGJHVmpkRzl5UVd4c0tDZHBabkpoYldVbktTNXNaVzVuZEdnZ1BDQXhLU0I3WEc0Z0lDQWdMeThnWkc5MVlteGxMWGRwWkdWY2JpQWdJQ0JwWmlBb2MybDZaU0E5UFQwZ0oyUnZkV0pzWlNjcElIdGNiaUFnSUNBZ0lHbG1JQ2gyYVdWM2NHOXlkRmRwWkhSb0lENGdaR2x0Wlc1emFXOXVjeTVrYjNWaWJHVXVkMmxrZEdncElIdGNiaUFnSUNBZ0lDQWdkMlZ5YXk1emRIbHNaUzUzYVdSMGFDQTlJQ2N4TURBbEp6dGNiaUFnSUNBZ0lDQWdjSGx0VUdGeVpXNTBJRDBnYm1WM0lIQjViUzVRWVhKbGJuUW9kMlZ5YXk1cFpDd2djR0YwYUhNdVpHOTFZbXhsTENCN2ZTazdYRzRnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQjNaWEpyTG5OMGVXeGxMbmRwWkhSb0lEMGdZQ1I3WkdsdFpXNXphVzl1Y3k1emFXNW5iR1V1ZDJsa2RHaDljSGhnTzF4dUlDQWdJQ0FnSUNCd2VXMVFZWEpsYm5RZ1BTQnVaWGNnY0hsdExsQmhjbVZ1ZENoM1pYSnJMbWxrTENCd1lYUm9jeTV6YVc1bmJHVXNJSHQ5S1R0Y2JpQWdJQ0FnSUNBZ0x5OGdRV1JrSUdFZ1kyeGhjM01nZDJocFkyZ2dZMkZ1SUdKbElIVnpaV1FnZEc4Z1pteHZZWFFnWkdsMlhHNGdJQ0FnSUNBZ0lHbG1JQ2gyYVdWM2NHOXlkRmRwWkhSb0lENGdLR1JwYldWdWMybHZibk11YzJsdVoyeGxMbmRwWkhSb0lDb2dNUzQzTlNrcElIdGNiaUFnSUNBZ0lDQWdJQ0IzWlhKckxtTnNZWE56VEdsemRDNWhaR1FvSjJac2IyRjBaV1FuS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUM4dklITnBibWRzWlMxM2FXUmxYRzRnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUhkbGNtc3VjM1I1YkdVdWQybGtkR2dnUFNCZ0pIdGthVzFsYm5OcGIyNXpMbk5wYm1kc1pTNTNhV1IwYUgxd2VHQTdYRzRnSUNBZ0lDQndlVzFRWVhKbGJuUWdQU0J1WlhjZ2NIbHRMbEJoY21WdWRDaDNaWEpyTG1sa0xDQndZWFJvY3k1emFXNW5iR1VzSUh0OUtUdGNiaUFnSUNBZ0lDOHZJRUZrWkNCaElHTnNZWE56SUhkb2FXTm9JR05oYmlCaVpTQjFjMlZrSUhSdklHWnNiMkYwSUdScGRseHVJQ0FnSUNBZ2FXWWdLSFpwWlhkd2IzSjBWMmxrZEdnZ1BpQW9aR2x0Wlc1emFXOXVjeTV6YVc1bmJHVXVkMmxrZEdnZ0tpQXhMamMxS1NrZ2UxeHVJQ0FnSUNBZ0lDQjNaWEpyTG1Oc1lYTnpUR2x6ZEM1aFpHUW9KMlpzYjJGMFpXUW5LVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQjlYRzRnSUgxY2JuMWNiaUpkZlE9PSJdfQ==
