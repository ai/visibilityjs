# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name        = 'visibility'
  s.version     = '0.1'
  s.platform    = Gem::Platform::RUBY
  s.authors     = ['Andrey “A.I.” Sitnik']
  s.email       = ['andrey@sitnik.ru']
  s.homepage    = 'https://github.com/evilmartians/visibility.js'
  s.summary     = 'Visibility.js allow you to know, that your web page ' +
                  'is visible to the user or hidden in background tab or ' +
                  'prerendering.'
  s.description = 'Visibility.js allow you to depend JS logic on ' +
                  'page visibility state and save browser performance or ' +
                  'create careful UI.'
  
  s.add_dependency 'sprockets', '>= 2.0.0.beta.5'

  s.files            = Dir.glob('vendor/**/*') + %w(LICENSE README.md)
  s.extra_rdoc_files = %w(LICENSE README.md)
end
