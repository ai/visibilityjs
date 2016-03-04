# Add visibility.js path to the Rails assets paths.

module VisibilityJs
  class Railtie < Rails::Railtie
    config.assets.configure { |env| VisibilityJs.install(env) }
  end
end
