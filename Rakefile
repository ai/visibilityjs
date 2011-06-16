require 'pathname'
root = Pathname(__FILE__).dirname

desc 'Run server with library tests'
task :server do
  require 'rack'
  require 'jasmine'
  require 'json'

  config = Jasmine::Config.new
  config.instance_eval do
    def simple_config
      { 'spec_dir'  => 'spec' }
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
