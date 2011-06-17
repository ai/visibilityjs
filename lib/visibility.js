/*
 * Copyright 2011 Andrey “A.I.” Sitnik <andrey@sitnik.ru>.
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

;(function() {
    "use strict";

    window.Visibility = {

        // Link to document object to change it in tests.
        _doc: window.document,

        // Vendor prefixes to create event and properties names.
        _prefixes: ['webkit', 'moz', 'o', 'ms'],

        // Vendor prefix cached by _prefix function.
        _chechedPrefix: null,

        // Detect vendor prefix and return it.
        _prefix: function () {
            if ( null !== this._chechedPrefix ) {
                return this._chechedPrefix;
            }
            if ( 'undefined' != typeof(this._doc.visibilityState) ) {
                return this._chechedPrefix = '';
            }
            var name;
            for ( var i = 0; i < this._prefixes.length; i++ ) {
                name = this._prefixes[i] + 'VisibilityState';
                if ( 'undefined' != typeof(this._doc[name]) ) {
                    return this._chechedPrefix = this._prefixes[i];
                }
            }
        },

        // Return property name with vendor prefix
        _name: function (name) {
            var prefix = this._prefix();
            if ( '' == prefix ) {
                return name;
            } else {
                return prefix +
                    name.substr(0, 1).toUpperCase() + name.substr(1);
            }
        },

        // Return document's property value with name with vendor prefix.
        _prop: function (name) {
            return this._doc[this._name(name)]
        },

        // Callbacks from onVisible method, that wait when page become to be
        // visible.
        _onVisibleCallbacks: [],

        // Is listener for visibilitychange event is already added
        // by _setListener method.
        _listening: false,

        // Listener for visibilitychange event.
        _onVisibilityChange: function() {
            if ( !this.hidden() ) {
                for ( var i = 0; i < this._onVisibleCallbacks.length; i++ ) {
                    this._onVisibleCallbacks[i]()
                }
                this._onVisibleCallbacks = []
            }
        },

        // Set listener for visibilitychange event for onVisible method.
        _setListener: function () {
            if ( this._listening ) {
                return;
            }
            var event = this._prefix() + 'visibilitychange';
            this._doc.addEventListener(event, function () {
                Visibility._onVisibilityChange.apply(Visibility, arguments);
            }, false);
            this._listening = true;
        },

        // Return true if browser support Page Visibility API.
        support: function () {
            return ('undefined' != typeof(this._prefix()));
        },

        // Return true if page now isn't visible to user.
        // It is just proxy to document.hidden, but use vendor prefix.
        hidden: function () {
            if ( !this.support() ) {
                return false;
            }
            return this._prop('hidden');
        },

        // Return visibility state: 'visible', 'hidden' or 'prerender'.
        // It is just proxy to document.visibilityState, but use
        // vendor prefix.
        state: function () {
            if ( !this.support() ) {
                return 'visible';
            }
            return this._prop('visibilityState');
        },

        // Call callback only when page become to visible for user or
        // call it now if page is visible now or Page Visibility API
        // doesn't supported.
        //
        // Return true if callback if called now.
        onVisible: function (callback) {
            if ( !this.support() || !this.hidden() ) {
                callback();
                return true;
            }
            this._onVisibleCallbacks.push(callback);
            this._setListener()
        }

    };

})();
