# Used only for Ruby on Rails gem to tell, that gem contain `lib/assets` with
# visibility.js file.

module VisibilityJs

  # Path where is the visibility.js located.
  def self.assets_path
    Pathname(__FILE__).dirname
  end

  # Add assets path to standalone Sprockets environment.
  def self.install(sprockets)
    sprockets.append_path(assets_path)
  end
end

if defined?(Rails)
  require 'visibilityjs/railtie'
end
