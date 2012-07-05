/*
 * Copyright 2011 Andrey “A.I.” Sitnik <andrey@sitnik.ru>,
 * sponsored by Evil Martians.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

;(function () {
    "use strict";

    var defined = function (variable) {
        return ('undefined' != typeof(variable));
    };

    // Visibility.js allow you to know, that your web page is in the background
    // tab and thus not visible to the user. This library is wrap under
    // Page Visibility API. It fix problems with different vendor prefixes and
    // add high-level useful functions.
    window.Visibility = {

        // Call callback only when page become to visible for user or
        // call it now if page is visible now or Page Visibility API
        // doesn’t supported.
        //
        // Return true if callback if called now.
        //
        //   Visibility.onVisible(function () {
        //       Notification.animateNotice("Hello");
        //   });
        onVisible: function (callback) {
            if ( !this.isSupported() || !this.hidden() ) {
                callback();
                return true;
            }

            var listener = this.change(function (e, state) {
                if ( !Visibility.hidden() ) {
                    Visibility.unbind(listener);
                    callback();
                }
            });
        },

        // Call callback when visibility will be changed. First argument for
        // callback will be original event object, second will be visibility
        // state name.
        //
        // Return listener ID to unbind listener by `unbind` method.
        //
        // If Page Visibility API doesn’t supported method will be return false
        // and callback never will be called.
        //
        //   Visibility.change(function(e, state) {
        //       Statistics.visibilityChange(state);
        //   });
        //
        // It is just proxy to `visibilitychange` event, but use vendor prefix.
        change: function (callback) {
            if ( !this.isSupported() ) {
                return false;
            }
            this._lastCallback += 1;
            var number = this._lastCallback;
            this._callbacks[number] = callback;
            this._setListener();
            return number;
        },

        // Remove `change` listener by it ID.
        //
        //   var id = Visibility.change(function(e, state) {
        //       firstChangeCallback();
        //       Visibility.unbind(id);
        //   });
        unbind: function (id) {
            delete this._callbacks[id];
        },

        // Call `callback` in any state, expect “prerender”. If current state
        // is “prerender” it will wait until state will be changed.
        // If Page Visibility API doesn’t supported, it will call `callback`
        // immediately.
        //
        //   Visibility.afterPrerendering(function () {
        //       Statistics.countVisitor();
        //   });
        afterPrerendering: function (callback) {
            if ( !this.isSupported() || 'prerender' != this.state() ) {
                callback();
                return true;
            }

            var listener = this.change(function (e, state) {
                if ( 'prerender' != state ) {
                    Visibility.unbind(listener);
                    callback();
                }
            });
        },

        // Return true if page now isn’t visible to user.
        //
        //   if ( !Visibility.hidden() ) {
        //       VideoPlayer.play();
        //   }
        //
        // It is just proxy to `document.hidden`, but use vendor prefix.
        hidden: function () {
            return this._prop('hidden', false);
        },

        // Return visibility state: 'visible', 'hidden' or 'prerender'.
        //
        //   if ( 'prerender' == Visibility.state() ) {
        //       Statistics.pageIsPrerendering();
        //   }
        //
        // Don’t use `Visibility.state()` to detect, is page visible, because
        // visibility states can extend in next API versions.
        // Use more simpler and general `Visibility.hidden()` for this cases.
        //
        // It is just proxy to `document.visibilityState`, but use
        // vendor prefix.
        state: function () {
            return this._prop('visibilityState', 'visible');
        },

        // Return true if browser support Page Visibility API.
        //
        //   if ( Visibility.isSupported() ) {
        //       Statistics.startTrackingVisibility();
        //       Visibility.change(function(e, state)) {
        //           Statistics.trackVisibility(state);
        //       });
        //   }
        isSupported: function () {
            return defined(this._prefix());
        },

        // Link to document object to change it in tests.
        _doc: window.document,

        // Vendor prefixes to create event and properties names.
        _prefixes: ['webkit', 'moz', 'o', 'ms'],

        // Vendor prefix cached by `_prefix` function.
        _chechedPrefix: null,

        // Is listener for `visibilitychange` event is already added
        // by `_setListener` method.
        _listening: false,

        // Last timer number.
        _lastCallback: -1,

        // Callbacks from `change` method, that wait visibility changes.
        _callbacks: { },

        // Variable to check hidden-visible state changes.
        _hiddenBefore: false,

        // Initialize variables on page loading.
        _init: function () {
            this._hiddenBefore = this.hidden();
        },

        // Detect vendor prefix and return it.
        _prefix: function () {
            if ( null !== this._chechedPrefix ) {
                return this._chechedPrefix;
            }
            if ( defined(this._doc.visibilityState) ) {
                return this._chechedPrefix = '';
            }
            var name;
            for ( var i = 0; i < this._prefixes.length; i++ ) {
                name = this._prefixes[i] + 'VisibilityState';
                if ( defined(this._doc[name]) ) {
                    return this._chechedPrefix = this._prefixes[i];
                }
            }
        },

        // Return property name with vendor prefix.
        _name: function (name) {
            var prefix = this._prefix();
            if ( '' == prefix ) {
                return name;
            } else {
                return prefix +
                    name.substr(0, 1).toUpperCase() + name.substr(1);
            }
        },

        // Return document’s property value with name with vendor prefix.
        // If API is not support, it will retun `unsupported` value.
        _prop: function (name, unsupported) {
            if ( !this.isSupported() ) {
                return unsupported;
            }
            return this._doc[this._name(name)];
        },

        // Listener for `visibilitychange` event.
        _onChange: function(event) {
            var state = this.state();

            for ( var i in this._callbacks ) {
                this._callbacks[i].call(this._doc, event, state);
            }

            this._hiddenBefore = this.hidden();
        },

        // Set listener for `visibilitychange` event.
        _setListener: function () {
            if ( this._listening ) {
                return;
            }
            var event = this._prefix() + 'visibilitychange';
            var listener = function () {
                Visibility._onChange.apply(Visibility, arguments);
            };
            if ( this._doc.addEventListener ) {
                this._doc.addEventListener(event, listener, false);
            } else {
                this._doc.attachEvent(event, listener);
            }
            this._listening = true;
            this._hiddenBefore = this.hidden();
        }

    };

    Visibility._init();

})();
