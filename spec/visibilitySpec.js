describe('Visibility', function () {
    var document;

    beforeEach(function () {
        Visibility._chechedPrefix = null;
        Visibility._listening = false;
        Visibility._doc = document = {
            addEventListener: function() { }
        };
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
});
