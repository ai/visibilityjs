# Used only for Ruby on Rails gem to tell, that gem contain `lib/assets` with
# visibility.js file.
module VisibilityJs

  def self.install(sprockets)
    sprockets.append_path(Pathname(__FILE__).dirname)
  end

  module Rails
    class Engine < ::Rails::Engine
      initializer 'visibilityjs' do |app|
        VisibilityJs.install(app.config.assets)
      end
    end
  end
end
