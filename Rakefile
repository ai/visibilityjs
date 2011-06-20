require 'pathname'
root = Pathname(__FILE__).dirname

desc 'Create minimized version of library'
task :min do
  require 'uglifier'

  lib = root.join('lib')
  js  = File.read(lib + 'visibility.js')

  File.open(lib + 'visibility.min.js', 'w') do |file|
    file << Uglifier.new(:copyright => false).compile(js)
  end
end

desc 'Run server with library tests'
task :server do
  require 'rack'
  require 'jasmine'

  config = Jasmine::Config.new
  config.instance_eval do
    def simple_config
      { 'spec_dir' => 'spec' }
    end
    def src_files
      ['lib/visibility.js']
    end
  end

  app = Rack::Builder.app do
    map('/') { run Jasmine.app(config) }
  end

  Rack::Server.start :app => app, :Port => 8888
end

directory 'vendor/assets/javascripts/'

task :copy_vendor => 'vendor/assets/javascripts/' do
  cp_r 'lib/visibility.js', 'vendor/assets/javascripts/'
end

directory 'pkg'

task :build => [:copy_vendor, 'pkg'] do
  spec = Gem::Specification.load(root + 'visibility.gemspec')
  Gem::Builder.new(spec).build
  mv spec.file_name, "pkg/#{spec.file_name}"
end

task :clobber_vendor do
  rm_r 'vendor' if File.exists? 'vendor'
end

desc 'Build the visibility gem'
task :gem => [:build, :clobber_vendor]

task :clobber_package do
  rm_r 'pkg' rescue nil
end

desc 'Delete temporal files'
task :clobber => [:clobber_package]
