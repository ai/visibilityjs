fs     = require('fs-extra')
url    = require('url')
exec   = require('child_process').exec
http   = require('http')
path   = require('path')
coffee = require('coffee-script')
uglify = require('uglify-js')

project =

  package: ->
    JSON.parse(fs.readFileSync('package.json'))

  name: ->
    @package().name

  version: ->
    @package().version

  tests: ->
    fs.readdirSync('test/').
      filter( (i) -> i.match /\.coffee$/ ).
      map( (i) -> "test/#{i}" )

  files: ->
    fs.readdirSync('lib/').map( (i) -> "lib/#{i}" ).sort()

  libs: ->
    @files().filter (file) -> !file.match(/fallback/)

  title: ->
    @name()[0].toUpperCase() + @name()[1..-1]

mocha =

  template: """
            <html>
            <head>
              <meta charset="UTF-8">
              <title>#title# Tests</title>
              <link rel="stylesheet" href="/style.css">
              <style>
                body {
                  padding: 0;
                }
                #integration {
                  position: absolute;
                  top: 1.45em;
                  margin-left: 120px;
                  font-weight: 200;
                  font-size: 0.7em;
                }
              </style>
              #system#
              <script>
                chai.should();
                mocha.setup({ ui: 'bdd', ignoreLeaks: true });
                window.onload = function() {
                  mocha.run();
                };
              </script>
              #libs#
              #tests#
            <body>
              <a href="/integration" id="integration" target="_blank">
                see also integration test →
              </a>
              <div id="mocha"></div>
            </body>
            </html>
            """

  html: ->
    @render @template,
      system: @system()
      libs:   @scripts project.libs()
      tests:  @scripts project.tests()
      title:  project.title()

  render: (template, params) ->
    html = template
    for name, value of params
      html = html.replace("##{name}#", value.replace(/\$/g, '$$$$'))
    html

  scripts: (files) ->
    files.map( (i) -> "<script src=\"/#{i}\"></script>" ).join("\n  ")

  style: ->
    fs.readFileSync('node_modules/mocha/mocha.css')

  system: ->
    @scripts ['node_modules/mocha/mocha.js',
              'node_modules/chai/chai.js',
              'node_modules/sinon/lib/sinon.js',
              'node_modules/sinon/lib/sinon/spy.js',
              'node_modules/sinon/lib/sinon/stub.js',
              'node_modules/sinon-chai/lib/sinon-chai.js']

task 'server', 'Run test server', ->
  server = http.createServer (req, res) ->
    pathname = url.parse(req.url).pathname

    if pathname == '/'
      res.writeHead 200, 'Content-Type': 'text/html'
      res.write mocha.html()

    else if pathname == '/style.css'
      res.writeHead 200, 'Content-Type': 'text/css'
      res.write mocha.style()

    else if pathname == '/integration'
      res.writeHead 200, 'Content-Type': 'text/html'
      res.write fs.readFileSync('test/integration.html')

    else if fs.existsSync('.' + pathname)
      file = fs.readFileSync('.' + pathname).toString()
      if pathname.match(/\.coffee$/)
        file = coffee.compile(file)
      if pathname.match(/\.(js|coffee)$/)
        res.writeHead 200, 'Content-Type': 'application/javascript'
      res.write file

    else
      res.writeHead 404, 'Content-Type': 'text/plain'
      res.write 'Not Found'
    res.end()

  server.listen 8000
  console.log('Open http://localhost:8000/')

task 'clean', 'Remove all generated files', ->
  fs.removeSync('build/') if fs.existsSync('build/')
  fs.removeSync('pkg/')   if fs.existsSync('pkg/')

fullPack = (file) ->
  core = fs.readFileSync('lib/visibility.core.js').toString()
  core = core.replace('})();', '')

  timers = fs.readFileSync('lib/visibility.timers.js').toString()
  timers = timers.replace(/[\w\W]*var timers/, '    var timers')

  fs.writeFileSync(file, core + timers)

task 'min', 'Create minimized version of library', ->
  copy = require('fs-extra/lib/copy').copySync

  fs.mkdirsSync('pkg/') unless fs.existsSync('pkg/')
  for file in project.files()
    name = file.replace(/^lib\//, '').replace(/\.js$/, '')
    copy(file, "pkg/#{name}-#{project.version()}.min.js")
  fullPack("pkg/visibility-#{project.version()}.min.js")

  packages = fs.readdirSync('pkg/').filter( (i) -> i.match(/\.js$/) )
  for file in packages
    min = uglify.minify('pkg/' + file)
    fs.writeFileSync('pkg/' + file, min.code)

task 'gem', 'Build RubyGem package', ->
  fs.removeSync('build/') if fs.existsSync('build/')
  fs.mkdirsSync('build/lib/assets/javascripts/')

  copy = require('fs-extra/lib/copy').copySync
  gem  = project.name().replace('.', '')

  gemspec = fs.readFileSync("#{gem}.gemspec").toString()
  gemspec = gemspec.replace('VERSION', "'#{project.version()}'")
  fs.writeFileSync("build/#{gem}.gemspec", gemspec)

  copy("ruby/#{gem}.rb",     "build/lib/#{gem}.rb")
  copy('README.md',          'build/README.md')
  copy('ChangeLog.md',       'build/ChangeLog.md')
  copy('LICENSE',            'build/LICENSE')
  for file in project.files()
    copy(file, file.replace('lib/', 'build/lib/assets/javascripts/'))
  fullPack('build/lib/assets/javascripts/visibility.js')

  exec "cd build/; gem build #{gem}.gemspec", (error, message) ->
    if error
      console.error(error.message)
      process.exit(1)
    else
      fs.mkdirsSync('pkg/') unless fs.existsSync('pkg/')
      gemFile = fs.readdirSync('build/').filter( (i) -> i.match(/\.gem$/) )[0]
      copy('build/' + gemFile, 'pkg/' + gemFile)
      fs.removeSync('build/')
