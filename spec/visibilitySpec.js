describe('Visibility', function () {
    var document;

    beforeEach(function () {
        Visibility._chechedPrefix = null;
        Visibility._doc = document = { };
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
});
