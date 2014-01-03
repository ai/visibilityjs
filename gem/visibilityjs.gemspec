Gem::Specification.new do |s|
  s.platform    = Gem::Platform::RUBY
  s.name        = 'visibilityjs'
  s.version     = VERSION
  s.summary     = 'Visibility.js - a wrapper for the Page Visibility API.'
  s.description = 'Visibility.js allow you to determine whether ' +
                  'your web page is visible to an user, is hidden in ' +
                  'background tab or is prerendering. It allows you use ' +
                  'the page visibility state in JavaScript logic and improve ' +
                  'browser performance or improve user interface experience.'

  s.files            = ['lib/assets/javascripts/visibility.js',
                        'lib/assets/javascripts/visibility.core.js',
                        'lib/assets/javascripts/visibility.timers.js',
                        'lib/assets/javascripts/visibility.fallback.js',
                        'lib/visibilityjs.rb',
                        'LICENSE', 'README.md', 'ChangeLog']
  s.extra_rdoc_files = ['LICENSE', 'README.md', 'ChangeLog']
  s.require_path     = 'lib'

  s.author   = 'Andrey Sitnik'
  s.email    = 'andrey@sitnik.ru'
  s.homepage = 'https://github.com/ai/visibility.js'
  s.license  = 'MIT'

  s.add_dependency 'sprockets', '>= 2'
end
