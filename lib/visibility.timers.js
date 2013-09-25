;(function () {
    "use strict";

    var defined = function(variable) {
        return ('undefined' != typeof(variable));
    };

    var self = Visibility;

    var timers = {

      // Run callback every `interval` milliseconds if page is visible and
      // every `hiddenInterval` milliseconds if page is hidden.
      //
      //   Visibility.every(60 * 1000, 5 * 60 * 1000, function () {
      //       checkNewMails();
      //   });
      //
      // You can skip `hiddenInterval` and callback will be called only if
      // page is visible.
      //
      //   Visibility.every(1000, function () {
      //       updateCountdown();
      //   });
      //
      // It is analog of `setInterval(callback, interval)` but use visibility
      // state.
      //
      // It return timer ID, that you can use in `Visibility.stop(id)` to stop
      // timer (`clearInterval` analog).
      // Warning: timer ID is different from interval ID from `setInterval`,
      // so don’t use it in `clearInterval`.
      //
      // On change state from hidden to visible timers will be execute.
      every: function (interval, hiddenInterval, callback) {
          self._initTimers();

          if ( !defined(callback) ) {
              callback = hiddenInterval;
              hiddenInterval = null;
          }
          self._lastTimer += 1;
          var number = self._lastTimer;
          self._timers[number] = ({
              interval:       interval,
              hiddenInterval: hiddenInterval,
              callback:       callback
          });
          self._runTimer(number, false);

          if ( self.isSupported() ) {
              self._setListener();
          }
          return number;
      },

      // Stop timer from `every` method by it ID (`every` method return it).
      //
      //   slideshow = Visibility.every(5 * 1000, function () {
      //       changeSlide();
      //   });
      //   $('.stopSlideshow').click(function () {
      //       Visibility.stop(slideshow);
      //   });
      stop: function(id) {
          var timer = self._timers[id]
          if ( !defined(timer) ) {
              return false;
          }
          self._stopTimer(id);
          delete self._timers[id];
          return timer;
      },

      // Last timer number.
      _lastTimer: -1,

      // Callbacks and intervals added by `every` method.
      _timers: { },

      // Is setInterval method detected and listener is binded.
      _timersInitialized: false,

      // Initialize variables on page loading.
      _initTimers: function () {
          if ( self._timersInitialized ) {
              return;
          }
          self._timersInitialized = true;

          self.change(function () {
              self._timersStopRun()
          });
      },

      // Set interval by `setInterval`. Allow to change function for tests or
      // syntax sugar in `interval` arguments.
      _setInterval: function (callback, interval) {
          return setInterval(callback, interval);
      },

      // Try to run timer from every method by it’s ID. It will be use
      // `interval` or `hiddenInterval` depending on visibility state.
      // If page is hidden and `hiddenInterval` is null,
      // it will not run timer.
      //
      // Argument `now` say, that timers must be execute now too.
      _runTimer: function (id, now) {
          var interval,
              timer = self._timers[id];
          if ( self.hidden() ) {
              if ( null === timer.hiddenInterval ) {
                  return;
              }
              interval = timer.hiddenInterval;
          } else {
              interval = timer.interval;
          }
          if ( now ) {
              timer.callback.call(window);
          }
          timer.id = self._setInterval(timer.callback, interval);
      },

      // Stop timer from `every` method by it’s ID.
      _stopTimer: function (id) {
          var timer = self._timers[id];
          clearInterval(timer.id);
          delete timer.id;
      },

      // Listener for `visibilitychange` event.
      _timersStopRun: function (event) {
          var isHidden = self.hidden(),
              hiddenBefore = self._hiddenBefore;

          if ( (isHidden && !hiddenBefore) || (!isHidden && hiddenBefore) ) {
              for ( var i in self._timers ) {
                  self._stopTimer(i);
                  self._runTimer(i, !isHidden);
              }
          }
      }

    };

    for ( var prop in timers ) {
        Visibility[prop] = timers[prop];
    }

})();
