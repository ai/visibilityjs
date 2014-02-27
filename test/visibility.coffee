describe 'Visibility', ->
  document = null
  clock    = null

  webkitSet = (state) ->
    document.webkitHidden = state == 'hidden'
    document.webkitVisibilityState = state

  set = (state) ->
    document.hidden = state == 'hidden'
    document.visibilityState = state

  beforeEach ->
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
        set('visible')
        sinon.spy(Visibility, '_listen')
        callback = sinon.spy()

        Visibility.onVisible(callback).should.be.true

        callback.should.have.been.called
        Visibility._listen.should.not.have.been.called

      it 'runs onVisible callback by listener on hidden page', ->
        webkitSet('hidden')
        sinon.spy(Visibility, '_listen')
        callback = sinon.spy()

        Visibility.onVisible(callback).should.be.a('number')

        callback.should.not.have.been.called
        Visibility._listen.should.have.been.called

        Visibility._change()
        callback.should.not.have.been.called

        webkitSet('visible')
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
        webkitSet('visible')
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
        set('visible')
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
        webkitSet('hidden')
        sinon.stub(Visibility, '_listen')
        callback = sinon.spy()

        Visibility.afterPrerendering(callback).should.be.true

        callback.should.have.been.called
        Visibility._listen.should.not.have.been.called

      it 'runs afterPrerendering listeners on prerended page', ->
        webkitSet('prerender')
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
        webkitSet('hidden')
        Visibility.hidden().should.be.true

        webkitSet('visible')
        Visibility.hidden().should.be.false

    describe '.state()', ->

      it 'returns visibility state', ->
        webkitSet('visible')
        Visibility.state().should.eql('visible')

    describe '.isSupported()', ->

      it 'detects whether the Page Visibility API is supported', ->
        Visibility.isSupported().should.be.false

        webkitSet('visible')
        Visibility.isSupported().should.be.true

    describe '._wasHidden', ->

      it 'remembers if page is hidden on loading', ->
        webkitSet('hidden')

        Visibility._init()
        Visibility._wasHidden.should.be.true

        webkitSet('visible')
        Visibility._init()
        Visibility._wasHidden.should.be.false

      it 'remembers if previous state is `visible`', ->
        webkitSet('hidden')

        Visibility._change()
        Visibility._wasHidden.should.be.true

        webkitSet('visible')
        Visibility._change()
        Visibility._wasHidden.should.be.false

    describe '._listen()', ->

      it 'sets listener only once', ->
        webkitSet('hidden')
        sinon.spy(document, 'addEventListener')

        Visibility._listen()
        Visibility._listen()

        document.addEventListener.should.have.been.calledOnce

      it 'sets listener', ->
        webkitSet('hidden')
        listener = null
        document.addEventListener = (a, b, c) -> listener = b
        sinon.spy(Visibility, '_change')

        Visibility._listen()
        listener()

        Visibility._change.should.have.been.called
        Visibility._change.should.have.been.calledOn(Visibility)

      it 'sets listener in IE', ->
        set('hidden')
        Visibility._doc = document = { attachEvent: -> }
        sinon.spy(document, 'attachEvent')

        Visibility._listen()

        document.attachEvent.should.have.been.called

  describe 'Timers', ->

    describe '.every()', ->

      before ->
        @clock = sinon.useFakeTimers()

      after ->
        @clock.restore()

      it 'creates a new timer from every method', ->
        webkitSet('hidden')
        sinon.stub(Visibility, '_run')
        sinon.stub(Visibility, '_time')

        callback1 = ->
        id1 = Visibility.every(1, 10, callback1)
        Visibility._lastTimer.should.eql(id1)

        callback2 = ->
        id2 = Visibility.every(2, callback2)
        Visibility._lastTimer.should.eql(id2)

        right = { }
        right[id1] = { visible: 1, hidden: 10,   callback: callback1 }
        right[id2] = { visible: 2, hidden: null, callback: callback2 }
        Visibility._timers.should.eql(right)

        Visibility._run.should.have.been.calledTwice
        Visibility._run.args[0].should.eql([id1, false])
        Visibility._run.args[1].should.eql([id2, false])

        Visibility._time.should.have.been.called

      it 'sets visible timer from every method without API', ->
        Visibility._time()
        sinon.stub(Visibility, '_listen')
        callback = ->
        Visibility.every(1, 10, callback)

        window.setInterval.should.have.been.calledWith(sinon.match.func, 1)
        Visibility._listen.should.not.have.been.called

      it 'stores last called time', ->
        runner = null
        window.setInterval.restore()
        sinon.stub window, 'setInterval', (callback, ms) -> runner = callback

        now   = new Date()
        Visibility.every(1, 10, ->)

        Visibility._timers[0].should.not.have.property('last')

        runner()
        Visibility._timers[0].last.should.eql(new Date(0))

        @clock.tick(100)
        runner()
        Visibility._timers[0].last.should.eql(new Date(100))

      it 'executes timers', ->
        webkitSet('hidden')
        lastID = 100

        window.setInterval.restore()
        sinon.stub window, 'setInterval', -> lastID += 1

        callback1 = sinon.spy()
        callback2 = sinon.spy()

        Visibility._timers =
          1: { visible: 1, hidden: 10,   callback: callback1 }
          2: { visible: 2, hidden: null, callback: callback2 }

        Visibility._run(1, false)
        Visibility._timers[1].id.should.eql(101)
        window.setInterval.should.have.been.calledOnce
        window.setInterval.should.have.been.calledWith(sinon.match.func, 10)
        callback1.should.not.have.been.called

        Visibility._run(2, false)
        Visibility._timers[2].should.eql
          visible:  2
          callback: callback2
          hidden:   null
        window.setInterval.should.have.been.calledOnce

        webkitSet('visible')
        Visibility._run(1, true)
        Visibility._timers[1].id.should.eql(102)
        window.setInterval.callCount.should.eql(2)
        window.setInterval.should.be.calledWith(sinon.match.func, 1)
        callback1.should.have.been.calledOn(window)

      it 'stops and run timers on state changes', ->
        webkitSet('hidden')
        Visibility._wasHidden = true
        sinon.stub(Visibility, '_stop')
        sinon.stub(Visibility, '_run')
        callback = sinon.spy
        Visibility._timers =
          1: { visible: 1, hidden: 10,   callback: callback }
          3: { visible: 2, hidden: null, callback: callback }
        Visibility._time()

        Visibility._change()
        Visibility._stop.should.not.have.been.called
        Visibility._run.should.not.have.been.called

        webkitSet('visible')
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

        webkitSet('hidden')
        Visibility._change()
        Visibility._stop.callCount.should.eql(4)
        Visibility._stop.args[2].should.eql(['1'])
        Visibility._stop.args[3].should.eql(['3'])
        Visibility._run.callCount.should.eql(4)
        Visibility._run.args[2].should.eql(['1', false])
        Visibility._run.args[3].should.eql(['3', false])

      it 'prevents too fast calls on visibility change', ->
        window.setInterval.restore()
        webkitSet('visible')

        callback = sinon.spy()
        Visibility.every(1000, callback)

        callback.should.have.not.been.called

        @clock.tick(1100)
        callback.should.have.been.calledOnce

        webkitSet('hidden')
        Visibility._change()
        callback.should.have.been.calledOnce

        @clock.tick(400)
        webkitSet('visible')
        Visibility._change()
        callback.should.have.been.calledOnce

        @clock.tick(500)
        callback.should.have.been.calledTwice

        @clock.tick(1000)
        callback.should.have.been.calledThrice

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
