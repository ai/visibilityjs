describe('Visible', function () {
    var document;

    beforeEach(function () {
        Visible._chechedPrefix = null;
        Visible._doc = document = { };
    });

    it('should detect, that browser use API without prefix', function () {
        document.visibilityState = 'visible';
        expect( Visible._prefix() ).toEqual('');
    });

    it('should detect vendor prefix', function () {
        document.mozVisibilityState = 'visible';
        expect( Visible._prefix() ).toEqual('moz');
    });

    it('should cache vendor prefix', function () {
        document.visibilityState = 'visible';
        expect( Visible._prefix() ).toEqual('');

        delete document.visibilityState;
        document.webkitVisibilityState = 'visible';
        expect( Visible._prefix() ).toEqual('');

        Visible._chechedPrefix = null;
        expect( Visible._prefix() ).toEqual('webkit');
    });

    it('should detect Page Visibility support', function () {
        expect( Visible.support() ).toBeFalsy();

        document.webkitVisibilityState = 'visible';
        Visible._chechedPrefix = null;
        expect( Visible.support() ).toBeTruthy();
    });

    it('should use properties with vendor prefix', function () {
        Visible._chechedPrefix = '';
        expect( Visible._name('hidden') ).toEqual('hidden');

        Visible._chechedPrefix = 'webkit';
        expect( Visible._name('hidden') ).toEqual('webkitHidden');
    });

    it('should return value from property with vendor prefix', function () {
        document.hidden = 2;
        document.webkitHidden = 1;

        Visible._chechedPrefix = 'webkit';
        expect( Visible._prop('hidden') ).toEqual(1);

        Visible._chechedPrefix = '';
        expect( Visible._prop('hidden') ).toEqual(2);
    });

    it('should check, if page is hidden', function () {
        Visible._chechedPrefix = 'webkit';
        document.webkitHidden = true;
        expect( Visible.hidden() ).toBeTruthy();

        document.webkitHidden = false;
        expect( Visible.hidden() ).toBeFalsy();
    });
});
