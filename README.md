# Visibility.js – sugar for Page Visibility API

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
