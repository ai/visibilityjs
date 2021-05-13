// Add Page Visibility API support to old browsers by focus/blur hack.
//
// Include this script _before_ Visibility.js.
//
// Note, that this hack doesn’t correctly emulate Page Visibility API:
// when user change focus from browser to another window (browser and your
// page may stay visible), this hack will decide, that you page is hidden.
//
// For Firefox 5–9 it will be better to use MozVisibility hack without
// this issue. See <https://github.com/private-face/mozvisibility>.
;(function (global, doc) {
    if ( doc.visibilityState || doc.webkitVisibilityState ) {
        return;
    }

    doc.hidden = false;
    doc.visibilityState = 'visible';

    var event = null
    var i = 0
    var fireEvent = function () {
        if( doc.createEvent ) {
            if ( !event ) {
                event = doc.createEvent('HTMLEvents');
                event.initEvent('visibilitychange', true, true);
            }
            doc.dispatchEvent(event);
        } else {
            if ( typeof(Visibility) == 'object' ) {
                Visibility._change.call(Visibility, { });
            }
        }
    }

    var onFocus = function () {
        doc.hidden = false;
        doc.visibilityState = 'visible';
        fireEvent();
    };
    var onBlur  = function () {
        doc.hidden = true;
        doc.visibilityState = 'hidden';
        fireEvent();
    }

    if ( doc.addEventListener ) {
        global.addEventListener('focus', onFocus, true);
        global.addEventListener('blur',  onBlur,  true);
    } else {
        doc.attachEvent('onfocusin',  onFocus);
        doc.attachEvent('onfocusout', onBlur);
    }
})(this, typeof document !=='undefined'? document: {});
