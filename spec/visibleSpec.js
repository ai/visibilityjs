describe('Visible', function() {
    var document

    beforeEach(function() {
        Visible._chechedPrefix = null
        Visible._doc = document = { }
    })

    it('should detect, that browser use API without prefix', function () {
        document.visibilityState = 'visible'
        expect(Visible._prefix()).toEqual('')
    })

    it('should detect vendor prefix', function() {
        document.mozVisibilityState = 'visible'
        expect(Visible._prefix()).toEqual('moz')
    })

    it('should cache vendor prefix', function() {
        document.mozVisibilityState = 'visible'
        expect(Visible._prefix()).toEqual('moz')

        delete document.mozVisibilityState
        document.webkitVisibilityState = 'visible'
        expect(Visible._prefix()).toEqual('moz')

        Visible._chechedPrefix = null
        expect(Visible._prefix()).toEqual('webkit')
    })

    it('should detect Page Visibility support', function() {
        expect(Visible.support()).toBeFalsy()

        document.webkitVisibilityState = 'visible'
        Visible._chechedPrefix = null
        expect(Visible.support()).toBeTruthy()
    })
})
