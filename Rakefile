require 'pathname'
root = Pathname(__FILE__).dirname

desc 'Create minimized version of library'
task :min do
  require 'uglifier'
  lib = root.join('lib')
  %w(visibility visibility.fallback).each do |name|
    js = File.read(lib + "#{name}.js")
    File.open(lib + "#{name}.min.js", 'w') do |file|
      file << Uglifier.new(:copyright => false).compile(js)
    end
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

docs = %w(LICENSE README.md ChangeLog)

directory 'gem/vendor/assets/javascripts/'

task :copy_vendor => 'gem/vendor/assets/javascripts/' do
  cp 'lib/visibility.js',          'gem/vendor/assets/javascripts/'
  cp 'lib/visibility.fallback.js', 'gem/vendor/assets/javascripts/'
end

task :copy_docs do
  docs.each { |i| cp i, 'gem/' }
end

directory 'pkg'

task :build => [:copy_vendor, :copy_docs, 'pkg'] do
  FileUtils.cd 'gem'
  spec = Gem::Specification.load(root.join('gem/visibilityjs.gemspec').to_s)
  Gem::Builder.new(spec).build
  mv spec.file_name, root.join("pkg/#{spec.file_name}").to_s
  FileUtils.cd '..'
end

task :clobber_gem do
  rm_r 'gem/vendor' if File.exists? 'gem/vendor'
  docs.each { |i| rm "gem/#{i}" if File.exists? "gem/#{i}" }
end

desc 'Build the visibility gem'
task :gem => [:build, :clobber_gem]

task :clobber_package do
  rm_r 'pkg' rescue nil
end

desc 'Delete temporal files'
task :clobber => [:clobber_package]
