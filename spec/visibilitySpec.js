describe('Visibility', function () {
    var document;

    beforeEach(function () {
        Visibility._chechedPrefix = null;
        Visibility._listening = false;
        Visibility._changeCallbacks = [];
        Visibility._lastTimer = 0;
        Visibility._timers = { };
        Visibility.__hiddenBefore = false;
        Visibility._doc = document = {
            addEventListener: function() { }
        };
        delete window.jQuery;
    });

    it('should detect, that browser use API without prefix', function () {
        document.visibilityState = 'visible';
        expect( Visibility._prefix() ).toEqual('');
    });

    it('should detect vendor prefix', function () {
        document.mozVisibilityState = 'visible';
        expect( Visibility._prefix() ).toEqual('moz');
    });

    it('should cache vendor prefix', function () {
        document.visibilityState = 'visible';
        expect( Visibility._prefix() ).toEqual('');

        delete document.visibilityState;
        document.webkitVisibilityState = 'visible';
        expect( Visibility._prefix() ).toEqual('');

        Visibility._chechedPrefix = null;
        expect( Visibility._prefix() ).toEqual('webkit');
    });

    it('should detect Page Visibility support', function () {
        expect( Visibility.support() ).toBeFalsy();

        document.webkitVisibilityState = 'visible';
        Visibility._chechedPrefix = null;
        expect( Visibility.support() ).toBeTruthy();
    });

    it('should use properties with vendor prefix', function () {
        Visibility._chechedPrefix = '';
        expect( Visibility._name('hidden') ).toEqual('hidden');

        Visibility._chechedPrefix = 'webkit';
        expect( Visibility._name('hidden') ).toEqual('webkitHidden');
    });

    it('should return value from property with vendor prefix', function () {
        document.hidden = 2;
        document.webkitHidden = 1;

        Visibility._chechedPrefix = 'webkit';
        expect( Visibility._prop('hidden') ).toEqual(1);

        Visibility._chechedPrefix = '';
        expect( Visibility._prop('hidden') ).toEqual(2);
    });

    it('should check, if page is hidden', function () {
        Visibility._chechedPrefix = 'webkit';
        document.webkitHidden = true;
        expect( Visibility.hidden() ).toBeTruthy();

        document.webkitHidden = false;
        expect( Visibility.hidden() ).toBeFalsy();
    });

    it('should return visibility state', function () {
        Visibility._chechedPrefix = 'webkit';
        document.webkitVisibilityState = 'visible';
        expect( Visibility.state() ).toEqual('visible');
    });

    it('should set listener only once', function () {
        Visibility._chechedPrefix = 'webkit';
        spyOn(document, 'addEventListener');

        Visibility._setListener();
        Visibility._setListener();

        expect( document.addEventListener ).toHaveBeenCalledWith(
            'webkitvisibilitychange', jasmine.any(Function), false);
        expect( document.addEventListener.callCount ).toEqual(1);
    });

    it('should set listener', function() {
        Visibility._chechedPrefix = 'webkit';
        var listener;
        document.addEventListener = function(a, b, c) {
            listener = b;
        };
        spyOn(Visibility, '_onVisibilityChange').andCallFake(function () {
            expect( this ).toBe(Visibility);
        });

        Visibility._setListener();
        listener();

        expect( Visibility._onVisibilityChange ).toHaveBeenCalled();
    });

    it('should return false on change method without API support', function () {
        spyOn(Visibility, 'support').andReturn(false);
        spyOn(Visibility, '_setListener');
        var callback = jasmine.createSpy();

        expect( Visibility.change(callback) ).toEqual(false);

        expect( callback ).not.toHaveBeenCalled();
        expect( Visibility._setListener ).not.toHaveBeenCalled();
    });

    it('should call callback on visible state shanges', function () {
        Visibility._chechedPrefix = 'webkit';
        spyOn(Visibility, '_setListener');
        var callback = jasmine.createSpy();

        expect( Visibility.change(callback) ).toEqual(true);
        expect( Visibility._setListener ).toHaveBeenCalled();

        var event = { };
        document.webkitVisibilityState = 'visible';
        Visibility._onVisibilityChange(event);
        expect( callback ).toHaveBeenCalledWith(event, 'visible');

        document.webkitVisibilityState = 'hidden';
        Visibility._onVisibilityChange(event);
        expect( callback.callCount ).toEqual(2);
        expect( callback.mostRecentCall.args ).toEqual([event, 'hidden']);
    });

    it('should call onVisible callback now without API support', function () {
        spyOn(Visibility, 'support').andReturn(false);
        spyOn(Visibility, '_setListener');
        var callback = jasmine.createSpy();

        Visibility.onVisible(callback);

        expect( callback ).toHaveBeenCalled();
        expect( Visibility._setListener ).not.toHaveBeenCalled();
    });

    it('should run onVisible callback now, if page is visible', function () {
        Visibility._chechedPrefix = 'webkit';
        document.webkitHidden = false;
        spyOn(Visibility, '_setListener');
        var callback = jasmine.createSpy();

        Visibility.onVisible(callback);

        expect( callback ).toHaveBeenCalled();
        expect( Visibility._setListener ).not.toHaveBeenCalled();
    });

    it('should run onVisible callback by listener on hidden page', function () {
        Visibility._chechedPrefix = 'webkit';
        document.webkitHidden = true;
        spyOn(Visibility, '_setListener');
        var callback = jasmine.createSpy();

        Visibility.onVisible(callback);

        expect( callback ).not.toHaveBeenCalled();
        expect( Visibility._setListener ).toHaveBeenCalled();

        Visibility._onVisibilityChange();
        expect( callback ).not.toHaveBeenCalled();

        document.webkitHidden = false;
        Visibility._onVisibilityChange();
        expect( callback ).toHaveBeenCalled();

        Visibility._onVisibilityChange();
        expect( callback.callCount ).toEqual(1);
    });

    it('should call system setInterval from internal method', function () {
        spyOn(window, 'setInterval').andReturn(102);
        var callback = function () { };
        expect( Visibility._originalSetInterval(callback, 1000) ).toEqual(102);
        expect( window.setInterval ).toHaveBeenCalledWith(callback, 1000);
    });

    it('should call jQuery Chrono plugin from internal method', function () {
        window.jQuery = { };
        jQuery.every = jasmine.createSpy().andReturn(102);
        var callback = function () { };
        expect( Visibility._chronoSetInterval(callback, '1 sec') ).toEqual(102);
        expect( jQuery.every ).toHaveBeenCalledWith('1 sec', callback);
    });

    it('should autodelect function to _setInterval', function () {
        Visibility._init();
        expect( Visibility._setInterval ).toBe(Visibility._originalSetInterval);

        window.jQuery = { };
        jQuery.every = function () { };
        Visibility._init();
        expect( Visibility._setInterval ).toBe(Visibility._chronoSetInterval);
    });

    it('should put timer from every method', function () {
        spyOn(Visibility, '_runTimer');

        var callback1 = function () { };
        var id1 = Visibility.every(1, 10, callback1);
        expect( Visibility._lastTimer ).toEqual(id1);

        var callback2 = function () { };
        var id2 = Visibility.every(2, callback2);
        expect( Visibility._lastTimer ).toEqual(id2);

        var right = { };
        right[id1] = { interval: 1, hiddenInterval: 10,   callback: callback1 };
        right[id2] = { interval: 2, hiddenInterval: null, callback: callback2 };
        expect( Visibility._timers ).toEqual(right);

        expect( Visibility._runTimer.callCount ).toEqual(2);
        expect( Visibility._runTimer.argsForCall[0] ).toEqual([id1, false]);
        expect( Visibility._runTimer.argsForCall[1] ).toEqual([id2, false]);
    });

    it('should execute timers', function () {
        Visibility._chechedPrefix = 'webkit';
        document.webkitHidden = true;
        var intervalID = 100;
        spyOn(Visibility, '_setInterval').andCallFake(function () {
            return intervalID += 1;
        });
        callback1 = jasmine.createSpy().andCallFake(function () {
            expect( this ).toBe(window);
        });
        callback2 = jasmine.createSpy();
        Visibility._timers = {
            1: { interval: 1, hiddenInterval: 10,   callback: callback1 },
            2: { interval: 2, hiddenInterval: null, callback: callback2 }
        };

        Visibility._runTimer(1, false);
        expect( Visibility._timers[1].intervalID ).toEqual(101);
        expect( Visibility._setInterval.callCount ).toEqual(1);
        expect( Visibility._setInterval.mostRecentCall.args ).
            toEqual([callback1, 10]);
        expect( callback1 ).not.toHaveBeenCalled();

        Visibility._runTimer(2, false);
        expect( Visibility._timers[2].intervalID ).not.toBeDefined();
        expect( Visibility._setInterval.callCount ).toEqual(1);

        document.webkitHidden = false;
        Visibility._runTimer(1, true);
        expect( Visibility._timers[1].intervalID ).toEqual(102);
        expect( Visibility._setInterval.callCount ).toEqual(2);
        expect( Visibility._setInterval.mostRecentCall.args ).
            toEqual([callback1, 1]);
        expect( callback1 ).toHaveBeenCalled();
    });

    it('should stop timer', function () {
        spyOn(window, 'clearInterval');
        Visibility._timers = {
            1: {
                interval:       1,
                hiddenInterval: 2,
                callback:       function () { },
                intervalID:     101
            },
        };

        Visibility._stopTimer(1);
        expect( window.clearInterval ).toHaveBeenCalledWith(101);
        expect( Visibility._timers[1].intervalID ).not.toBeDefined();
    });

    it('should remember is page is hidden on loading', function () {
        Visibility._chechedPrefix = 'webkit';

        document.webkitHidden= true;
        Visibility._init();
        expect( Visibility._hiddenBefore ).toBeTruthy();

        document.webkitHidden = false;
        Visibility._init();
        expect( Visibility._hiddenBefore ).toBeFalsy();
    });

    it('should remember is previous state is visible', function () {
        Visibility._chechedPrefix = 'webkit';
        document.webkitHidden  = true;

        Visibility._onVisibilityChange();
        expect( Visibility._hiddenBefore ).toBeTruthy();

        document.webkitHidden  = false;
        Visibility._onVisibilityChange();
        expect( Visibility._hiddenBefore ).toBeFalsy();
    });

    it('should stop and run timers on change state', function () {
        Visibility._chechedPrefix = 'webkit';
        document.webkitHidden  = true;
        Visibility._hiddenBefore = true;
        spyOn(Visibility, '_stopTimer');
        spyOn(Visibility, '_runTimer');
        callback = jasmine.createSpy();
        Visibility._timers = {
            1: { interval: 1, hiddenInterval: 10,   callback: callback },
            3: { interval: 2, hiddenInterval: null, callback: callback }
        };

        Visibility._onVisibilityChange();
        expect( Visibility._stopTimer ).not.toHaveBeenCalled();
        expect( Visibility._runTimer ).not.toHaveBeenCalled();

        document.webkitHidden = false;
        Visibility._onVisibilityChange();
        expect( Visibility._stopTimer.callCount ).toEqual(2);
        expect( Visibility._stopTimer.argsForCall[0] ).toEqual(['1']);
        expect( Visibility._stopTimer.argsForCall[1] ).toEqual(['3']);
        expect( Visibility._runTimer.callCount ).toEqual(2);
        expect( Visibility._runTimer.argsForCall[0] ).toEqual(['1', true]);
        expect( Visibility._runTimer.argsForCall[1] ).toEqual(['3', true]);

        Visibility._onVisibilityChange();
        expect( Visibility._stopTimer.callCount ).toEqual(2);
        expect( Visibility._runTimer.callCount ).toEqual(2);

        document.webkitHidden = true;
        Visibility._onVisibilityChange();
        expect( Visibility._stopTimer.callCount ).toEqual(4);
        expect( Visibility._stopTimer.argsForCall[2] ).toEqual(['1']);
        expect( Visibility._stopTimer.argsForCall[3] ).toEqual(['3']);
        expect( Visibility._runTimer.callCount ).toEqual(4);
        expect( Visibility._runTimer.argsForCall[2] ).toEqual(['1', false]);
        expect( Visibility._runTimer.argsForCall[3] ).toEqual(['3', false]);
    });

    it('should run notPrerender callback now without API support', function () {
        spyOn(Visibility, 'support').andReturn(false);
        spyOn(Visibility, '_setListener');
        var callback = jasmine.createSpy();

        Visibility.notPrerender(callback);

        expect( callback ).toHaveBeenCalled();
        expect( Visibility._setListener ).not.toHaveBeenCalled();
    });

    it('should run notPrerender now, if page isn’t prerended', function () {
        Visibility._chechedPrefix = 'webkit';
        document.webkitVisibilityState = 'hidden';
        spyOn(Visibility, '_setListener');
        var callback = jasmine.createSpy();

        Visibility.notPrerender(callback);

        expect( callback ).toHaveBeenCalled();
        expect( Visibility._setListener ).not.toHaveBeenCalled();
    });

    it('should run notPrerender by listener on prerended page', function () {
        Visibility._chechedPrefix = 'webkit';
        document.webkitVisibilityState = 'prerender';
        spyOn(Visibility, '_setListener');
        var callback = jasmine.createSpy();

        Visibility.notPrerender(callback);

        expect( callback ).not.toHaveBeenCalled();
        expect( Visibility._setListener ).toHaveBeenCalled();

        Visibility._onVisibilityChange();
        expect( callback ).not.toHaveBeenCalled();

        document.webkitVisibilityState = 'visible';
        Visibility._onVisibilityChange();
        expect( callback ).toHaveBeenCalled();

        Visibility._onVisibilityChange();
        expect( callback.callCount ).toEqual(1);
    });
});
