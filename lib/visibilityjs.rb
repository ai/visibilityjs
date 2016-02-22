# Used only for Ruby on Rails gem to tell, that gem contain `lib/assets` with
# visibility.js file.
module VisibilityJs

  module Rails
    class Engine < ::Rails::Engine
      initializer 'visibilityjs' do |app|
        root = Pathname(__FILE__).dirname.expand_path
        
        app.config.assets.prepend_path(root)
      end
    end
  end
end
