describe 'Visibility', ->
  document = null

  beforeEach ->
    Visibility._cached    = null
    Visibility._enable    = false
    Visibility._timed     = false
    Visibility._lastId    = -1
    Visibility._callbacks = []
    Visibility._lastTimer = -1
    Visibility._timers    = { }
    Visibility._wasHidden = false
    Visibility._doc = document = { addEventListener: -> }

    sinon.stub window, 'setInterval', -> 102

  afterEach ->
    delete window.jQuery

    for method of Visibility
      Visibility[method]?.restore?()
    window.setInterval.restore?()

  describe 'Core', ->

    describe '.onVisible()', ->

      it 'calls onVisible immediately when API is not supported', ->
        sinon.stub Visibility, 'isSupported', -> false
        sinon.spy(Visibility, '_listen')
        callback = sinon.spy()

        Visibility.onVisible(callback).should.be.false

        callback.should.have.been.called
        Visibility._listen.should.not.have.been.called

      it 'runs onVisible callback immediately if page is visible', ->
        Visibility._cached    = 'webkit'
        document.webkitHidden = false
        sinon.spy(Visibility, '_listen')
        callback = sinon.spy()

        Visibility.onVisible(callback).should.be.true

        callback.should.have.been.called
        Visibility._listen.should.not.have.been.called

      it 'runs onVisible callback by listener on hidden page', ->
        Visibility._cached    = 'webkit'
        document.webkitHidden = true
        sinon.spy(Visibility, '_listen')
        callback = sinon.spy()

        Visibility.onVisible(callback).should.be.a('number')

        callback.should.not.have.been.called
        Visibility._listen.should.have.been.called

        Visibility._change()
        callback.should.not.have.been.called

        document.webkitHidden = false
        Visibility._change()
        callback.should.have.been.calledOnce

        Visibility._change()
        callback.should.have.been.calledOnce

    describe '.change()', ->

      it 'returns false on `change` call when API is not supported', ->
        sinon.stub Visibility, 'isSupported', -> false
        sinon.spy(Visibility, '_listen')
        callback = sinon.spy()

        Visibility.change(callback).should.be.false

        callback.should.not.have.been.called
        Visibility._listen.should.not.have.been.called

      it 'calls callback on visibility state changes', ->
        Visibility._cached = 'webkit'
        sinon.spy(Visibility, '_listen')
        callback = sinon.spy()

        Visibility.change(callback).should.not.be.false
        Visibility._listen.should.have.been.called

        event = { }
        document.webkitVisibilityState = 'visible'
        Visibility._change(event)
        callback.should.have.been.calledWith(event, 'visible')

        document.webkitVisibilityState = 'hidden'
        Visibility._change(event)
        callback.should.have.been.calledTwice
        callback.getCall(1).calledWith(event, 'hidden').should.be.true

    describe '.unbind()', ->

      it 'removes listener', ->
        Visibility._cached = 'webkit'
        sinon.spy(Visibility, '_listen')

        callback1 = sinon.spy()
        callback2 = sinon.spy()

        id1 = Visibility.change(callback1)
        id2 = Visibility.change(callback2)

        Visibility.unbind(id2)

        Visibility._change({ })
        callback1.should.have.been.called
        callback2.should.not.have.been.called

    describe '.afterPrerendering()', ->

      it 'runs afterPrerendering callback immediately without API', ->
        sinon.stub Visibility, 'isSupported', -> false
        sinon.stub(Visibility, '_listen')
        callback = sinon.spy()

        Visibility.afterPrerendering(callback).should.be.false

        callback.should.have.been.called
        Visibility._listen.should.not.have.been.called

      it 'runs afterPrerendering immediately if page isn’t prerended', ->
        Visibility._cached             = 'webkit'
        document.webkitVisibilityState = 'hidden'
        sinon.stub(Visibility, '_listen')
        callback = sinon.spy()

        Visibility.afterPrerendering(callback).should.be.true

        callback.should.have.been.called
        Visibility._listen.should.not.have.been.called

      it 'runs afterPrerendering listeners on prerended page', ->
        Visibility._cached             = 'webkit'
        document.webkitVisibilityState = 'prerender'
        sinon.stub(Visibility, '_listen')
        callback = sinon.spy()

        Visibility.afterPrerendering(callback).should.be.a('number')

        callback.should.not.have.been.called
        Visibility._listen.should.have.been.called

        Visibility._change()
        callback.should.not.have.been.called

        document.webkitVisibilityState = 'visible'
        Visibility._change()
        callback.should.have.been.called

        Visibility._change()
        callback.should.have.been.calledOnce

    describe '.hidden()', ->

      it 'checks if the page is hidden', ->
        Visibility._cached    = 'webkit'
        document.webkitHidden = true
        Visibility.hidden().should.be.true

        document.webkitHidden = false
        Visibility.hidden().should.be.false

    describe '.state()', ->

      it 'returns visibility state', ->
        Visibility._cached             = 'webkit'
        document.webkitVisibilityState = 'visible'
        Visibility.state().should.eql('visible')

    describe '.isSupported()', ->

      it 'detects whether the Page Visibility API is supported', ->
        Visibility.isSupported().should.be.false

        document.webkitVisibilityState = 'visible'
        Visibility._cached = null
        Visibility.isSupported().should.be.true

    describe '._wasHidden', ->

      it 'remembers if page is hidden on loading', ->
        Visibility._cached    = 'webkit'
        document.webkitHidden = true

        Visibility._init()
        Visibility._wasHidden.should.be.true

        document.webkitHidden = false
        Visibility._init()
        Visibility._wasHidden.should.be.false

      it 'remembers if previous state is `visible`', ->
        Visibility._cached    = 'webkit'
        document.webkitHidden = true

        Visibility._change()
        Visibility._wasHidden.should.be.true

        document.webkitHidden  = false
        Visibility._change()
        Visibility._wasHidden.should.be.false

    describe '._prefix()', ->

      it 'detects a browser with non-prefixed API', ->
        document.visibilityState = 'visible'
        Visibility._prefix().should.eql('')

      it 'detects vendor prefix', ->
        document.webkitVisibilityState = 'visible'
        Visibility._prefix().should.eql('webkit')

      it 'caches vendor prefix', ->
        document.visibilityState = 'visible'
        Visibility._prefix().should.eql('')

        delete document.visibilityState
        document.webkitVisibilityState = 'visible'
        Visibility._prefix().should.eql('')

        Visibility._cached = null
        Visibility._prefix().should.eql('webkit')

    describe '._name()', ->

      it 'uses properties with vendor prefix', ->
        Visibility._cached = ''
        Visibility._name('hidden').should.eql('hidden')

        Visibility._cached = 'webkit'
        Visibility._name('hidden').should.eql('webkitHidden')

    describe '._prop()', ->

      it 'returns value from property with vendor prefix', ->
        document.hidden       = 2
        document.webkitHidden = 1

        Visibility._cached = 'webkit'
        Visibility._prop('hidden').should.eql(1)

        Visibility._cached = ''
        Visibility._prop('hidden').should.eql(2)

      it 'returns default value, when API is not supported', ->
        document.hidden    = 'supported'
        Visibility._cached = null
        Visibility._prop('hidden', 'unsupported').should.eql('unsupported')

        Visibility._cached = ''
        Visibility._prop('hidden', 'unsupported').should.eql('supported')

    describe '._listen()', ->

      it 'sets listener only once', ->
        Visibility._cached = 'webkit'
        sinon.spy(document, 'addEventListener')

        Visibility._listen()
        Visibility._listen()

        document.addEventListener.should.have.been.calledOnce

      it 'sets listener', ->
        Visibility._cached = 'webkit'
        listener = null
        document.addEventListener = (a, b, c) -> listener = b
        sinon.spy(Visibility, '_change')

        Visibility._listen()
        listener()

        Visibility._change.should.have.been.called
        Visibility._change.should.have.been.calledOn(Visibility)

      it 'sets listener in IE', ->
        Visibility._cached = 'ms'
        Visibility._doc = document = { attachEvent: -> }
        sinon.spy(document, 'attachEvent')

        Visibility._listen()

        document.attachEvent.should.have.been.called

  describe 'Timers', ->

    describe '.every()', ->

      it 'creates a new timer from every method', ->
        Visibility._cached    = 'webkit'
        document.webkitHidden = true
        sinon.stub(Visibility, '_run')
        sinon.stub(Visibility, '_time')

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

        Visibility._run.should.have.been.calledTwice
        Visibility._run.args[0].should.eql([id1, false])
        Visibility._run.args[1].should.eql([id2, false])

        Visibility._time.should.have.been.called

      it 'sets visible timer from every method without API', ->
        Visibility._time()
        sinon.stub(Visibility, '_setInterval')
        sinon.stub(Visibility, '_listen')
        callback = ->
        Visibility.every(1, 10, callback)

        Visibility._setInterval.should.have.been.calledWith(callback, 1)
        Visibility._listen.should.not.have.been.called

      it 'executes timers', ->
        Visibility._cached    = 'webkit'
        document.webkitHidden = true
        lastID = 100
        sinon.stub Visibility, '_setInterval', -> lastID += 1

        callback1 = sinon.spy()
        callback2 = sinon.spy()

        Visibility._timers =
          1: { interval: 1, hiddenInterval: 10,   callback: callback1 }
          2: { interval: 2, hiddenInterval: null, callback: callback2 }

        Visibility._run(1, false)
        Visibility._timers[1].id.should.eql(101)
        Visibility._setInterval.should.have.been.calledOnce
        Visibility._setInterval.should.have.been.calledWith(callback1, 10)
        callback1.should.not.have.been.called

        Visibility._run(2, false)
        Visibility._timers[2].should.eql
          interval:       2
          callback:       callback2
          hiddenInterval: null
        Visibility._setInterval.should.have.been.calledOnce

        document.webkitHidden = false
        Visibility._run(1, true)
        Visibility._timers[1].id.should.eql(102)
        Visibility._setInterval.callCount.should.eql(2)
        Visibility._setInterval.should.be.calledWith(callback1, 1)
        callback1.should.have.been.calledOn(window)

      it 'stops and run timers on state changes', ->
        Visibility._cached    = 'webkit'
        document.webkitHidden = true
        Visibility._wasHidden = true
        sinon.stub(Visibility, '_stop')
        sinon.stub(Visibility, '_run')
        callback = sinon.spy
        Visibility._timers =
          1: { interval: 1, hiddenInterval: 10,   callback: callback }
          3: { interval: 2, hiddenInterval: null, callback: callback }
        Visibility._time()

        Visibility._change()
        Visibility._stop.should.not.have.been.called
        Visibility._run.should.not.have.been.called

        document.webkitHidden = false
        Visibility._change()
        Visibility._stop.should.have.been.calledTwice
        Visibility._stop.args[0].should.eql(['1'])
        Visibility._stop.args[1].should.eql(['3'])
        Visibility._run.should.have.been.calledTwice
        Visibility._run.args[0].should.eql(['1', true])
        Visibility._run.args[1].should.eql(['3', true])

        Visibility._change()
        Visibility._stop.should.have.been.calledTwice
        Visibility._run.should.have.been.calledTwice

        document.webkitHidden = true
        Visibility._change()
        Visibility._stop.callCount.should.eql(4)
        Visibility._stop.args[2].should.eql(['1'])
        Visibility._stop.args[3].should.eql(['3'])
        Visibility._run.callCount.should.eql(4)
        Visibility._run.args[2].should.eql(['1', false])
        Visibility._run.args[3].should.eql(['3', false])

    describe '._time()', ->

      it 'initlializes only once', ->
        sinon.stub(Visibility, 'change')

        Visibility._time()
        Visibility._timed.should.be.true
        Visibility.change.should.have.been.calledOnce

        Visibility._time()
        Visibility.change.should.have.been.calledOnce

        Visibility._timed = false
        Visibility._time()
        Visibility.change.should.have.been.calledTwice

      it 'calls DOM setInterval from internal method', ->
        callback = ->
        Visibility._setInterval(callback, 1000).should.eql(102)
        window.setInterval.should.have.been.calledWith(callback, 1000)

    describe '._stop()', ->

      afterEach ->
        window.clearInterval.restore?()

      it 'stops timer', ->
        sinon.stub(window, 'clearInterval')
        callback = ->
        Visibility._timers =
          1:
            interval:       1
            hiddenInterval: 2
            callback:       callback
            id:             101

        Visibility._stop(1)
        window.clearInterval.should.have.been.calledWith(101)
        Visibility._timers[1].should.eql
          interval:       1
          hiddenInterval: 2
          callback:       callback
