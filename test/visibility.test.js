describe('Visibility', function() {
  var clock, document, set, webkitSet;
  document = null;
  clock = null;
  webkitSet = function(state) {
    document.webkitHidden = state === 'hidden';
    return document.webkitVisibilityState = state;
  };
  set = function(state) {
    document.hidden = state === 'hidden';
    return document.visibilityState = state;
  };
  beforeEach(function() {
    Visibility._init = false;
    Visibility._timed = false;
    Visibility._timers = {};
    Visibility._wasHidden = false;
    Visibility._callbacks = [];
    Visibility._doc = document = {
      addEventListener: function() {}
    };
    return sinon.stub(window, 'setInterval').returns(102);
  });
  afterEach(function() {
    var base, method, ref;
    delete window.jQuery;
    for (method in Visibility) {
      if ((ref = Visibility[method]) != null) {
        if (typeof ref.restore === "function") {
          ref.restore();
        }
      }
    }
    return typeof (base = window.setInterval).restore === "function" ? base.restore() : void 0;
  });
  describe('Core', function() {
    describe('.onVisible()', function() {
      it('calls onVisible immediately when API is not supported', function() {
        var callback;
        sinon.stub(Visibility, 'isSupported').returns(false);
        sinon.spy(Visibility, '_listen');
        callback = sinon.spy();
        Visibility.onVisible(callback).should.be.false;
        callback.should.have.been.called;
        return Visibility._listen.should.not.have.been.called;
      });
      it('runs onVisible callback immediately if page is visible', function() {
        var callback;
        set('visible');
        sinon.spy(Visibility, '_listen');
        callback = sinon.spy();
        Visibility.onVisible(callback).should.be.true;
        callback.should.have.been.called;
        return Visibility._listen.should.not.have.been.called;
      });
      return it('runs onVisible callback by listener on hidden page', function() {
        var callback;
        webkitSet('hidden');
        sinon.spy(Visibility, '_listen');
        callback = sinon.spy();
        Visibility.onVisible(callback).should.be.a('number');
        callback.should.not.have.been.called;
        Visibility._listen.should.have.been.called;
        Visibility._change();
        callback.should.not.have.been.called;
        webkitSet('visible');
        Visibility._change();
        callback.should.have.been.calledOnce;
        Visibility._change();
        return callback.should.have.been.calledOnce;
      });
    });
    describe('.change()', function() {
      it('returns false on `change` call when API is not supported', function() {
        var callback;
        sinon.stub(Visibility, 'isSupported').returns(false);
        sinon.spy(Visibility, '_listen');
        callback = sinon.spy();
        Visibility.change(callback).should.be.false;
        callback.should.not.have.been.called;
        return Visibility._listen.should.not.have.been.called;
      });
      return it('calls callback on visibility state changes', function() {
        var callback, event;
        webkitSet('visible');
        sinon.spy(Visibility, '_listen');
        callback = sinon.spy();
        Visibility.change(callback).should.not.be.false;
        Visibility._listen.should.have.been.called;
        event = {};
        document.webkitVisibilityState = 'visible';
        Visibility._change(event);
        callback.should.have.been.calledWith(event, 'visible');
        document.webkitVisibilityState = 'hidden';
        Visibility._change(event);
        callback.should.have.been.calledTwice;
        return callback.getCall(1).calledWith(event, 'hidden').should.be.true;
      });
    });
    describe('.unbind()', function() {
      return it('removes listener', function() {
        var callback1, callback2, id1, id2;
        set('visible');
        sinon.spy(Visibility, '_listen');
        callback1 = sinon.spy();
        callback2 = sinon.spy();
        id1 = Visibility.change(callback1);
        id2 = Visibility.change(callback2);
        Visibility.unbind(id2);
        Visibility._change({});
        callback1.should.have.been.called;
        return callback2.should.not.have.been.called;
      });
    });
    describe('.afterPrerendering()', function() {
      it('runs afterPrerendering callback immediately without API', function() {
        var callback;
        sinon.stub(Visibility, 'isSupported').returns(false);
        sinon.stub(Visibility, '_listen');
        callback = sinon.spy();
        Visibility.afterPrerendering(callback).should.be.false;
        callback.should.have.been.called;
        return Visibility._listen.should.not.have.been.called;
      });
      it('runs afterPrerendering immediately if page isn’t prerended', function() {
        var callback;
        webkitSet('hidden');
        sinon.stub(Visibility, '_listen');
        callback = sinon.spy();
        Visibility.afterPrerendering(callback).should.be.true;
        callback.should.have.been.called;
        return Visibility._listen.should.not.have.been.called;
      });
      return it('runs afterPrerendering listeners on prerended page', function() {
        var callback;
        webkitSet('prerender');
        sinon.stub(Visibility, '_listen');
        callback = sinon.spy();
        Visibility.afterPrerendering(callback).should.be.a('number');
        callback.should.not.have.been.called;
        Visibility._listen.should.have.been.called;
        Visibility._change();
        callback.should.not.have.been.called;
        document.webkitVisibilityState = 'visible';
        Visibility._change();
        callback.should.have.been.called;
        Visibility._change();
        return callback.should.have.been.calledOnce;
      });
    });
    describe('.hidden()', function() {
      it('always returns boolean', function() {
        return Visibility.hidden().should.be.false;
      });
      return it('checks if the page is hidden', function() {
        webkitSet('hidden');
        Visibility.hidden().should.be.true;
        webkitSet('visible');
        return Visibility.hidden().should.be.false;
      });
    });
    describe('.state()', function() {
      return it('returns visibility state', function() {
        webkitSet('visible');
        return Visibility.state().should.eql('visible');
      });
    });
    describe('.isSupported()', function() {
      return it('detects whether the Page Visibility API is supported', function() {
        Visibility.isSupported().should.be.false;
        webkitSet('visible');
        return Visibility.isSupported().should.be.true;
      });
    });
    return describe('._listen()', function() {
      it('sets listener only once', function() {
        webkitSet('hidden');
        sinon.spy(document, 'addEventListener');
        Visibility._listen();
        Visibility._listen();
        return document.addEventListener.should.have.been.calledOnce;
      });
      it('sets listener', function() {
        var listener;
        webkitSet('hidden');
        listener = null;
        document.addEventListener = function(a, b, c) {
          return listener = b;
        };
        sinon.spy(Visibility, '_change');
        Visibility._listen();
        listener();
        Visibility._change.should.have.been.called;
        return Visibility._change.should.have.been.calledOn(Visibility);
      });
      return it('sets listener in IE', function() {
        set('hidden');
        Visibility._doc = document = {
          attachEvent: function() {}
        };
        sinon.spy(document, 'attachEvent');
        Visibility._listen();
        return document.attachEvent.should.have.been.called;
      });
    });
  });
  return describe('Timers', function() {
    describe('.every()', function() {
      before(function() {
        return this.clock = sinon.useFakeTimers();
      });
      after(function() {
        return this.clock.restore();
      });
      it('creates a new timer from every method', function() {
        var callback1, callback2, id1, id2, right;
        webkitSet('hidden');
        sinon.stub(Visibility, '_run');
        sinon.stub(Visibility, '_time');
        callback1 = function() {};
        id1 = Visibility.every(1, 10, callback1);
        callback2 = function() {};
        id2 = Visibility.every(2, callback2);
        right = {};
        right[id1] = {
          visible: 1,
          hidden: 10,
          callback: callback1
        };
        right[id2] = {
          visible: 2,
          hidden: null,
          callback: callback2
        };
        Visibility._timers.should.eql(right);
        Visibility._run.should.have.been.calledTwice;
        Visibility._run.args[0].should.eql([id1, false]);
        Visibility._run.args[1].should.eql([id2, false]);
        return Visibility._time.should.have.been.called;
      });
      it('sets visible timer from every method without API', function() {
        var callback;
        Visibility._time();
        sinon.stub(Visibility, '_listen');
        callback = function() {};
        Visibility.every(1, 10, callback);
        window.setInterval.should.have.been.calledWith(sinon.match.func, 1);
        return Visibility._listen.should.not.have.been.called;
      });
      it('stores last called time', function() {
        var id, now, runner;
        runner = null;
        window.setInterval.restore();
        sinon.stub(window, 'setInterval').callsFake(function(callback, ms) {
          return runner = callback;
        });
        now = new Date();
        id = Visibility.every(1, 10, function() {});
        Visibility._timers[id].should.not.have.property('last');
        runner();
        Visibility._timers[id].last.should.eql(new Date(0));
        this.clock.tick(100);
        runner();
        return Visibility._timers[id].last.should.eql(new Date(100));
      });
      it('executes timers', function() {
        var callback1, callback2, lastID;
        webkitSet('hidden');
        lastID = 100;
        window.setInterval.restore();
        sinon.stub(window, 'setInterval').callsFake(function() {
          return lastID += 1;
        });
        callback1 = sinon.spy();
        callback2 = sinon.spy();
        Visibility._timers = {
          1: {
            visible: 1,
            hidden: 10,
            callback: callback1
          },
          2: {
            visible: 2,
            hidden: null,
            callback: callback2
          }
        };
        Visibility._run(1, false);
        Visibility._timers[1].id.should.eql(101);
        window.setInterval.should.have.been.calledOnce;
        window.setInterval.should.have.been.calledWith(sinon.match.func, 10);
        callback1.should.not.have.been.called;
        Visibility._run(2, false);
        Visibility._timers[2].should.eql({
          visible: 2,
          callback: callback2,
          hidden: null
        });
        window.setInterval.should.have.been.calledOnce;
        webkitSet('visible');
        Visibility._run(1, true);
        Visibility._timers[1].id.should.eql(102);
        window.setInterval.callCount.should.eql(2);
        window.setInterval.should.be.calledWith(sinon.match.func, 1);
        return callback1.should.have.been.calledOn(window);
      });
      it('stops and run timers on state changes', function() {
        var callback;
        webkitSet('hidden');
        Visibility._wasHidden = true;
        sinon.stub(Visibility, '_stop');
        sinon.stub(Visibility, '_run');
        callback = sinon.spy;
        Visibility._timers = {
          1: {
            visible: 1,
            hidden: 10,
            callback: callback
          },
          3: {
            visible: 2,
            hidden: null,
            callback: callback
          }
        };
        Visibility._time();
        Visibility._change();
        Visibility._stop.should.not.have.been.called;
        Visibility._run.should.not.have.been.called;
        webkitSet('visible');
        Visibility._change();
        Visibility._stop.should.have.been.calledTwice;
        Visibility._stop.args[0].should.eql(['1']);
        Visibility._stop.args[1].should.eql(['3']);
        Visibility._run.should.have.been.calledTwice;
        Visibility._run.args[0].should.eql(['1', true]);
        Visibility._run.args[1].should.eql(['3', true]);
        Visibility._change();
        Visibility._stop.should.have.been.calledTwice;
        Visibility._run.should.have.been.calledTwice;
        webkitSet('hidden');
        Visibility._change();
        Visibility._stop.callCount.should.eql(4);
        Visibility._stop.args[2].should.eql(['1']);
        Visibility._stop.args[3].should.eql(['3']);
        Visibility._run.callCount.should.eql(4);
        Visibility._run.args[2].should.eql(['1', false]);
        return Visibility._run.args[3].should.eql(['3', false]);
      });
      it('prevents too fast calls on visibility change', function() {
        var callback;
        window.setInterval.restore();
        webkitSet('visible');
        callback = sinon.spy();
        Visibility.every(1000, callback);
        callback.should.have.not.been.called;
        this.clock.tick(1100);
        callback.should.have.been.calledOnce;
        webkitSet('hidden');
        Visibility._change();
        callback.should.have.been.calledOnce;
        this.clock.tick(400);
        webkitSet('visible');
        Visibility._change();
        callback.should.have.been.calledOnce;
        this.clock.tick(500);
        callback.should.have.been.calledTwice;
        this.clock.tick(1000);
        return callback.should.have.been.calledThrice;
      });
      return it('checks race condition on visibility change and .stop() call in callback', function() {
        var callback, timer;
        window.setInterval.restore();
        sinon.spy(Visibility, 'stop');
        callback = sinon.spy(function() {
          if (callback.callCount === 2) {
            return Visibility.stop(timer);
          }
        });
        webkitSet('visible');
        timer = Visibility.every(1000, callback);
        callback.should.have.not.been.called;
        this.clock.tick(1100);
        callback.should.have.been.calledOnce;
        webkitSet('hidden');
        Visibility._change();
        callback.should.have.been.calledOnce;
        this.clock.tick(1100);
        callback.should.have.been.calledOnce;
        Visibility.stop.should.have.not.been.called;
        webkitSet('visible');
        Visibility._change();
        callback.should.have.been.calledTwice;
        Visibility.stop.should.have.been.calledOnce;
        this.clock.tick(1100);
        callback.should.have.been.calledTwice;
        this.clock.tick(1100);
        return callback.should.have.been.calledTwice;
      });
    });
    describe('._wasHidden', function() {
      return it('remembers if previous state is `visible`', function() {
        webkitSet('hidden');
        Visibility._time();
        Visibility._wasHidden.should.be.true;
        Visibility._change();
        Visibility._wasHidden.should.be.true;
        webkitSet('visible');
        Visibility._change();
        return Visibility._wasHidden.should.be.false;
      });
    });
    describe('._time()', function() {
      return it('initlializes only once', function() {
        sinon.stub(Visibility, 'change');
        Visibility._time();
        Visibility._timed.should.be.true;
        Visibility.change.should.have.been.calledOnce;
        Visibility._time();
        Visibility.change.should.have.been.calledOnce;
        Visibility._timed = false;
        Visibility._time();
        return Visibility.change.should.have.been.calledTwice;
      });
    });
    return describe('._stop()', function() {
      afterEach(function() {
        var base;
        return typeof (base = window.clearInterval).restore === "function" ? base.restore() : void 0;
      });
      return it('stops timer', function() {
        var callback;
        sinon.stub(window, 'clearInterval');
        callback = function() {};
        Visibility._timers = {
          1: {
            interval: 1,
            hiddenInterval: 2,
            callback: callback,
            id: 101
          }
        };
        Visibility._stop(1);
        window.clearInterval.should.have.been.calledWith(101);
        return Visibility._timers[1].should.eql({
          interval: 1,
          hiddenInterval: 2,
          callback: callback
        });
      });
    });
  });
});
