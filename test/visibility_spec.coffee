describe 'Visibility', ->
  document = null

  beforeEach ->
    Visibility._chechedPrefix     = null
    Visibility._listening         = false
    Visibility._timersInitialized = false
    Visibility._changeCallbacks   = []
    Visibility._lastTimer         = 0
    Visibility._timers            = { }
    Visibility._hiddenBefore      = false
    Visibility._setInterval       = ->
    Visibility._doc = document    = { addEventListener: -> }
    for method of Visibility
      Visibility[method]?.restore?()

  afterEach ->
    delete window.jQuery

  describe 'Core', ->

    describe '.onVisible()', ->

      it 'should call onVisible immediately when API is not supported', ->
        sinon.stub Visibility, 'isSupported', -> false
        sinon.spy(Visibility, '_setListener')
        callback = sinon.spy()

        Visibility.onVisible(callback)

        callback.should.have.been.called
        Visibility._setListener.should.not.have.been.called

      it 'should run onVisible callback immediately if page is visible', ->
        Visibility._chechedPrefix = 'webkit'
        document.webkitHidden = false
        sinon.spy(Visibility, '_setListener')
        callback = sinon.spy()

        Visibility.onVisible(callback)

        callback.should.have.been.called
        Visibility._setListener.should.not.have.been.called

      it 'should run onVisible callback by listener on hidden page', ->
        Visibility._chechedPrefix = 'webkit'
        document.webkitHidden = true
        sinon.spy(Visibility, '_setListener')
        callback = sinon.spy()

        Visibility.onVisible(callback)

        callback.should.not.have.been.called
        Visibility._setListener.should.have.been.called

        Visibility._onVisibilityChange()
        callback.should.not.have.been.called

        document.webkitHidden = false
        Visibility._onVisibilityChange()
        callback.should.have.been.calledOnce

        Visibility._onVisibilityChange()
        callback.should.have.been.calledOnce

    describe '.change()', ->

      it 'should return false on `change` call when API is not supported', ->
        sinon.stub Visibility, 'isSupported', -> false
        sinon.spy(Visibility, '_setListener')
        callback = sinon.spy()

        Visibility.change(callback).should.be.false

        callback.should.not.have.been.called
        Visibility._setListener.should.not.have.been.called

      it 'should call callback on visibility state changes', ->
        Visibility._chechedPrefix = 'webkit'
        sinon.spy(Visibility, '_setListener')
        callback = sinon.spy()

        Visibility.change(callback).should.be.true
        Visibility._setListener.should.have.been.called

        event = { }
        document.webkitVisibilityState = 'visible'
        Visibility._onVisibilityChange(event)
        callback.should.have.been.calledWith(event, 'visible')

        document.webkitVisibilityState = 'hidden'
        Visibility._onVisibilityChange(event)
        callback.should.have.been.calledTwice
        callback.getCall(1).calledWith(event, 'hidden').should.be.true

    describe '.afterPrerendering()', ->

      it 'should run afterPrerendering callback immediately without API', ->
        sinon.stub Visibility, 'isSupported', -> false
        sinon.stub(Visibility, '_setListener')
        callback = sinon.spy()

        Visibility.afterPrerendering(callback)

        callback.should.have.been.called
        Visibility._setListener.should.not.have.been.called

      it 'should run afterPrerendering immediately if page isn’t prerended', ->
        Visibility._chechedPrefix      = 'webkit'
        document.webkitVisibilityState = 'hidden'
        sinon.stub(Visibility, '_setListener')
        callback = sinon.spy()

        Visibility.afterPrerendering(callback)

        callback.should.have.been.called
        Visibility._setListener.should.not.have.been.called

      it 'should run afterPrerendering listeners on prerended page', ->
        Visibility._chechedPrefix      = 'webkit'
        document.webkitVisibilityState = 'prerender'
        sinon.stub(Visibility, '_setListener')
        callback = sinon.spy()

        Visibility.afterPrerendering(callback)

        callback.should.not.have.been.called
        Visibility._setListener.should.have.been.called

        Visibility._onVisibilityChange()
        callback.should.not.have.been.called

        document.webkitVisibilityState = 'visible'
        Visibility._onVisibilityChange()
        callback.should.have.been.called

        Visibility._onVisibilityChange()
        callback.should.have.been.calledOnce

    describe '.hidden()', ->

      it 'should check if the page is hidden', ->
        Visibility._chechedPrefix = 'webkit'
        document.webkitHidden     = true
        Visibility.hidden().should.be.true

        document.webkitHidden = false
        Visibility.hidden().should.be.false

    describe '.state()', ->

      it 'should return visibility state', ->
        Visibility._chechedPrefix      = 'webkit'
        document.webkitVisibilityState = 'visible'
        Visibility.state().should.eql('visible')

    describe '.isSupported()', ->

      it 'should detect whether the Page Visibility API is supported', ->
        Visibility.isSupported().should.be.false

        document.webkitVisibilityState = 'visible'
        Visibility._chechedPrefix = null
        Visibility.isSupported().should.be.true

    describe '._hiddenBefore', ->

      it 'should remember if page is hidden on loading', ->
        Visibility._chechedPrefix = 'webkit'
        document.webkitHidden     = true

        Visibility._init()
        Visibility._hiddenBefore.should.be.true

        document.webkitHidden = false
        Visibility._init()
        Visibility._hiddenBefore.should.be.false

      it 'should remember if previous state is `visible`', ->
        Visibility._chechedPrefix = 'webkit'
        document.webkitHidden     = true

        Visibility._onVisibilityChange()
        Visibility._hiddenBefore.should.be.true

        document.webkitHidden  = false
        Visibility._onVisibilityChange()
        Visibility._hiddenBefore.should.be.false

    describe '._prefix()', ->

      it 'should detect a browser with non-prefixed API', ->
        document.visibilityState = 'visible'
        Visibility._prefix().should.eql('')

      it 'should detect vendor prefix', ->
        document.mozVisibilityState = 'visible'
        Visibility._prefix().should.eql('moz')

      it 'should cache vendor prefix', ->
        document.visibilityState = 'visible'
        Visibility._prefix().should.eql('')

        delete document.visibilityState
        document.webkitVisibilityState = 'visible'
        Visibility._prefix().should.eql('')

        Visibility._chechedPrefix = null
        Visibility._prefix().should.eql('webkit')

    describe '._name()', ->

      it 'should use properties with vendor prefix', ->
        Visibility._chechedPrefix = ''
        Visibility._name('hidden').should.eql('hidden')

        Visibility._chechedPrefix = 'webkit'
        Visibility._name('hidden').should.eql('webkitHidden')

    describe '._prop()', ->

      it 'should return value from property with vendor prefix', ->
        document.hidden       = 2
        document.webkitHidden = 1

        Visibility._chechedPrefix = 'webkit'
        Visibility._prop('hidden').should.eql(1)

        Visibility._chechedPrefix = ''
        Visibility._prop('hidden').should.eql(2)

    describe '._setListener()', ->

      it 'should set listener only once', ->
        Visibility._chechedPrefix = 'webkit'
        sinon.spy(document, 'addEventListener')

        Visibility._setListener()
        Visibility._setListener()

        document.addEventListener.should.have.been.calledOnce

      it 'should set listener', ->
        Visibility._chechedPrefix = 'webkit'
        listener = null
        document.addEventListener = (a, b, c) -> listener = b
        sinon.spy(Visibility, '_onVisibilityChange')

        Visibility._setListener()
        listener()

        Visibility._onVisibilityChange.should.have.been.called
        Visibility._onVisibilityChange.should.have.been.calledOn(Visibility)

      it 'should set listener in IE', ->
        Visibility._chechedPrefix = 'ms'
        Visibility._doc = document = { attachEvent: -> }
        sinon.spy(document, 'attachEvent')

        Visibility._setListener()

        document.attachEvent.should.have.been.called

  describe 'Timers', ->

    describe '.every()', ->

      it 'should create a new timer from every method', ->
        Visibility._chechedPrefix = 'webkit'
        document.webkitHidden = true
        sinon.stub(Visibility, '_runTimer')
        sinon.stub(Visibility, '_initTimers')

        callback1 = ->
        id1 = Visibility.every(1, 10, callback1)
        Visibility._lastTimer.should.eql(id1)

        callback2 = ->
        id2 = Visibility.every(2, callback2)
        Visibility._lastTimer.should.eql(id2)

        right = { }
        right[id1] = { interval: 1, hiddenInterval: 10,   callback: callback1 }
        right[id2] = { interval: 2, hiddenInterval: null, callback: callback2 }
        Visibility._timers.should.eql(right)

        Visibility._runTimer.should.have.been.calledTwice
        Visibility._runTimer.args[0].should.eql([id1, false])
        Visibility._runTimer.args[1].should.eql([id2, false])

        Visibility._initTimers.should.have.been.called

      it 'should set visible timer from every method without API', ->
        Visibility._initTimers()
        sinon.stub(Visibility, '_setInterval')
        sinon.stub(Visibility, '_setListener')
        callback = ->
        Visibility.every(1, 10, callback)

        Visibility._setInterval.should.have.been.calledWith(callback, 1)
        Visibility._setListener.should.not.have.been.called

      it 'should execute timers', ->
        Visibility._chechedPrefix = 'webkit'
        document.webkitHidden     = true
        intervalID = 100
        sinon.stub Visibility, '_setInterval', -> intervalID += 1

        callback1 = sinon.spy()
        callback2 = sinon.spy()

        Visibility._timers =
          1: { interval: 1, hiddenInterval: 10,   callback: callback1 }
          2: { interval: 2, hiddenInterval: null, callback: callback2 }

        Visibility._runTimer(1, false)
        Visibility._timers[1].intervalID.should.eql(101)
        Visibility._setInterval.should.have.been.calledOnce
        Visibility._setInterval.should.have.been.calledWith(callback1, 10)
        callback1.should.not.have.been.called

        Visibility._runTimer(2, false)
        Visibility._timers[2].should.eql
          interval:       2
          callback:       callback2
          hiddenInterval: null
        Visibility._setInterval.should.have.been.calledOnce

        document.webkitHidden = false
        Visibility._runTimer(1, true)
        Visibility._timers[1].intervalID.should.eql(102)
        Visibility._setInterval.callCount.should.eql(2)
        Visibility._setInterval.should.be.calledWith(callback1, 1)
        callback1.should.have.been.calledOn(window)

      it 'should stop and run timers on state changes', ->
        Visibility._chechedPrefix = 'webkit'
        document.webkitHidden     = true
        Visibility._hiddenBefore  = true
        sinon.stub(Visibility, '_stopTimer')
        sinon.stub(Visibility, '_runTimer')
        callback = sinon.spy
        Visibility._timers =
          1: { interval: 1, hiddenInterval: 10,   callback: callback }
          3: { interval: 2, hiddenInterval: null, callback: callback }
        Visibility._initTimers()

        Visibility._onVisibilityChange()
        Visibility._stopTimer.should.not.have.been.called
        Visibility._runTimer.should.not.have.been.called

        document.webkitHidden = false
        Visibility._onVisibilityChange()
        Visibility._stopTimer.should.have.been.calledTwice
        Visibility._stopTimer.args[0].should.eql(['1'])
        Visibility._stopTimer.args[1].should.eql(['3'])
        Visibility._runTimer.should.have.been.calledTwice
        Visibility._runTimer.args[0].should.eql(['1', true])
        Visibility._runTimer.args[1].should.eql(['3', true])

        Visibility._onVisibilityChange()
        Visibility._stopTimer.should.have.been.calledTwice
        Visibility._runTimer.should.have.been.calledTwice

        document.webkitHidden = true
        Visibility._onVisibilityChange()
        Visibility._stopTimer.callCount.should.eql(4)
        Visibility._stopTimer.args[2].should.eql(['1'])
        Visibility._stopTimer.args[3].should.eql(['3'])
        Visibility._runTimer.callCount.should.eql(4)
        Visibility._runTimer.args[2].should.eql(['1', false])
        Visibility._runTimer.args[3].should.eql(['3', false])

    describe '._initTimers()', ->

      it 'should initlialize only once', ->
        sinon.stub(Visibility, 'change')

        Visibility._initTimers()
        Visibility._timersInitialized.should.be.true
        Visibility.change.should.have.been.calledOnce

        Visibility._initTimers()
        Visibility.change.should.have.been.calledOnce

        Visibility._timersInitialized = false
        Visibility._initTimers()
        Visibility.change.should.have.been.calledTwice

      it 'should autodetect the function to use as _setInterval', ->
        Visibility._initTimers()
        Visibility._setInterval.should.have.eql(Visibility._originalInterval)

        window.jQuery = { every: -> }
        Visibility._timersInitialized = false
        Visibility._initTimers()
        Visibility._setInterval.should.eql(Visibility._chronoInterval)

    describe '._originalInterval()', ->

      afterEach ->
        window.setInterval.restore?()

      it 'should call DOM setInterval from internal method', ->
        sinon.stub window, 'setInterval', -> 102
        callback = ->
        Visibility._originalInterval(callback, 1000).should.eql(102)
        window.setInterval.should.have.been.calledWith(callback, 1000)

    describe '._chronoInterval()', ->

      it 'should call jQuery Chrono plugin from internal method', ->
        window.jQuery = { every: -> 102 }
        sinon.spy(jQuery, 'every')
        callback = ->
        Visibility._chronoInterval(callback, '1 sec').should.eql(102)
        jQuery.every.should.have.been.calledWith('1 sec', callback)

    describe '._stopTimer()', ->

      afterEach ->
        window.clearInterval.restore?()

      it 'should stop timer', ->
        sinon.stub(window, 'clearInterval')
        callback = ->
        Visibility._timers =
          1:
            interval:       1
            hiddenInterval: 2
            callback:       callback
            intervalID:     101

        Visibility._stopTimer(1)
        window.clearInterval.should.have.been.calledWith(101)
        Visibility._timers[1].should.eql
          interval:       1
          hiddenInterval: 2
          callback:       callback
