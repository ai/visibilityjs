# Visibility.js – sugar for Page Visibility API

Visibility.js allow you to know, that your web page is visible to the user or
hidden in background tab or prerendering. It allow you to depend JS logic on
page visibility state and save browser performance (disable unnecessary timers
and AJAX requests) or create careful UI (for example, you can stop video or
slideshow, when user switch tab to answer for urgent email).

Also you can detect, that browser just [prerendering] page, and don’t count
visitor (before user will not really click on estimated link) or run heavy
calculations (which can disable prerendering).

This library is wrap under [Page Visibility API]. It fix problems with different
vendor prefixes and add high-level useful functions.

You don’t need to check Page Visibility API support in browser for common cases,
because library without API support will just assume, that page is always
visible and your logic will be work correctly.

[Page Visibility API]: http://www.w3.org/TR/2011/WD-page-visibility-20110602/
[prerendering]: http://code.google.com/chrome/whitepapers/prerender.html

## States

Now Page Visibility API support 3 visibility states:

* `visible` – user open page and work with it.
* `hidden` – user switch to another tab or minimize browser window.
* `prerender` – browser just prerendering estimated next page to
  instantly open it.

## Timers

The main user case is to run some timers only, when content is visible to user.
For example, show countdown animation.

`Visibility.every(interval, callback)` is a analog of
`setInterval(callback, interval)`, but call `callback` every `interval` ms only
if page is visible. For example, let create countdown:

```js
Visibility.every(1000, function() {
    updateCountdownAnimation();
});
```

You can set in second argument another interval, which will be used, when page
is hidden. For example, lets check inbox updates every 1 minute for visible
page and every 5 minutes for hidden:

```js
var minute = 60 * 1000;
Visibility.every(minute, 5 * minute, function() {
    checkNewMails();
});
```

Note, that callback will be execute also on every state changing from hidden to
visible (to update old content).

You can add some really useful syntax sugar for interval formats, if you include
[jQuery Chrono plugin] *before* Visibility.js:

```js
Visibility.every('minute', '5 minutes', function() {
    checkNewMails();
});
```

`Visibility.every` return timer ID. It is **not** same ID, that return
`clearInterval`, so you must use only `Visibility.stop(id)` to stop timer:

```js
slideshow = Visibility.every(5 * 1000, function() {
    changeSlide();
});

$('.stopSlideshow').click(function() {
    Visibility.stop(slideshow);
});
```

If browser doesn’t support Page Visibility API, `Visibility.every` will be
just full analog of `setInterval` and just run `callback` every `interval` ms
for visible and hidden pages.

[jQuery Chrono plugin]: https://github.com/avk/jQuery-Chrono

## Initializers

Another common user case is when we need to check visibility state and wait for
some value.

### Wait until state will be visible

`Visibility.onVisible(callback)` check current state. If it visible now, it
will run `callback`, else it will wait until state changes to visible and then
run `callback`.

For example, lets show new notification animation only when page is visible
(so if user open page directly in background tab, animation will be wait until
user open tab):

```js
Visibility.onVisible(function() {
    Notification.animateNotice("Hello");
});
```

If browser doesn’t support Page Visibility API, `Visibility.onVisible` will run
`callback` at once.

### Wait until state will be not prerender

Web developer can say by Prerender API, that user is likely to open next link
(for example, when a user is reading a multi-page article). So browser will
fetch and render this link and when user click link, he will see content
instantly.

But when browser will prerendering page, you may decide that is really
(not probably) visitor. Also, browser will turn off prerendering, if you have
heavy computation or video/audio tags on page. So it will be better,
if your JS will not run some code in prerendering and wait until
user really open link.

You can use `Visibility.notPrerender(callback)` for this cases. For example,
lets count statistics only for real visitor, not for prerendering:

```js
Visibility.notPrerender(function() {
    Statistics.countVisitor();
});
```

Or we can add audio and video tags or start heavy computation in
non-prerendering states.

If browser doesn’t support Page Visibility API, `Visibility.notPrerender` will
run `callback` at once.

## Low-level tools

For some special cases you can need more low-level methods. For example, if you
want to count background and foreground time of page using.

`Visibility.support()` will return `true`, if browser support
Page Visibility API:

```js
if ( Visibility.support() ) {
    Statistics.startTrackingVisibility();
}
```

`Visibility.state()` will return string with visibility state name. States can
be extend in future, so in common cases use more simpler and general
`Visibility.hidden()`, that will return `true`, if page is hidden by any reason.
For example, in prerendering `Visibility.state()` will return `"prerender"`, but
`Visibility.hidden()` will return `true`.

Lets collect in what state user open our page:

```js
$(document).load(function () {

    if ( 'hidden' == Visibility.state() ) {
        Statistics.userOpenPageInBackgroundTab();
    }
    if ( 'prerender' == Visibility.state() ) {
        Statistics.pageIsPrerendering();
    }

});
```

Or lets enable auto-playing only when page opening in current tab
(not, when user open page in background tab):

```js
$(document).load(function () {

   if ( !Visibility.hidden() ) {
       VideoPlayer.play();
   }

});
```

By `Visibility.change(callback)` you can listen visibility state changing event.
First argument in callback will be event object, second will be state name.

Lets collect visibility changes to statistics, how user use our site:

```js
Visibility.change(function(e, state) {
    Statistics.visibilityChange(state);
});
```

## Install

### Rails 3.1

In Rails 3.1 (or another project with Sprockets 2) just add `visibility` to
`Gemfile`:

```ruby
gem 'visibility'
```

and add require to `app/assets/javascripts/application.js.coffee`:

```coffee
#= require "visibility"
```

### Jammit

If you use Jammit or another package manager just copy `lib/visibility.js` to
`public/javascripts/lib` in your project and add library to `config/assets.yml`:

```yaml
javascripts:
  application:
    - public/javascripts/lib/visibility.js
```

### Other

If you didn’t use Rails 3.1 or assets packaging manager you can use already
minimized version of library at `lib/visibility.min.js`.

## Contributing

To run project tests and minimize source you must have Ruby and Bundler.
For example, on Ubuntu:

```
sudo apt-get install ruby rubygems
sudo gem install bundler
```

Next you need install Jasmine, UglifyJS and other dependencies by Bundler.
Run in project root:

```
bundle install --path=.bundle
```

That’s all. To run tests, start server and open <http://localhost:8888/>:

```
bundle exec rake server
```

Before commit minimize project source:

```
bundle exec rake min
```
