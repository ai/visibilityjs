fs     = require('fs-extra')
exec   = require('child_process').exec
http   = require('http')
path   = require('path')
glob   = require('glob')
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

  libs: ->
    fs.readdirSync('lib/').map( (i) -> "lib/#{i}" )

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
    if req.url == '/'
      res.writeHead 200, 'Content-Type': 'text/html'
      res.write mocha.html()

    else if req.url == '/style.css'
      res.writeHead 200, 'Content-Type': 'text/css'
      res.write mocha.style()

    else if req.url == '/integration'
      res.writeHead 200, 'Content-Type': 'text/html'
      res.write fs.readFileSync('test/integration.html')

    else if fs.existsSync('.' + req.url)
      file = fs.readFileSync('.' + req.url).toString()
      if req.url.match(/\.coffee$/)
        file = coffee.compile(file)
      if req.url.match(/\.(js|coffee)$/)
        res.writeHead 200, 'Content-Type': 'application/javascript'
      res.write file

    else
      res.writeHead 404, 'Content-Type': 'text/plain'
      res.write 'Not Found'
    res.end()

  server.listen 8000
  console.log('Open http://localhost:8000/')

task 'test', 'Run tests in node', ->
  files   = ['test/mocha.js'].concat(project.libs()).concat(project.tests())
  options =
    ui:         'bdd'
    reporter:   'spec'
    compilers:  'coffee:coffee-script'
    ignoreLeaks: true
    colors:      true

  command = 'node_modules/.bin/mocha '
  for name, value of options
    name = name.replace /[A-Z]/, (letter) -> '-' + letter.toLowerCase()
    command += "--#{name} " + if value == true then '' else " #{value} "
  command += files.join(' ')
  exec command, (error, stdout, stderr) ->
    console.log(stdout)   if stdout?
    console.error(stderr) if stderr?
    process.exit(1)       if error

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
  copy = require('fs-extra/lib/copy').copyFileSync

  fs.mkdirsSync('pkg/') unless fs.existsSync('pkg/')
  for file in project.libs()
    name = file.replace(/^lib\//, '').replace(/\.js$/, '')
    copy(file, "pkg/#{name}-#{project.version()}.min.js")
  fullPack("pkg/visibility-#{project.version()}.min.js")

  packages = glob.sync('pkg/*.js')
  for file in packages
    minified = uglify.minify(file)
    fs.writeFileSync(file, minified.code)

task 'gem', 'Build RubyGem package', ->
  fs.removeSync('build/') if fs.existsSync('build/')
  fs.mkdirsSync('build/lib/assets/javascripts/')

  copy = require('fs-extra/lib/copy').copyFileSync
  gem  = project.name().replace('.', '')

  gemspec = fs.readFileSync("gem/#{gem}.gemspec").toString()
  gemspec = gemspec.replace('VERSION', "'#{project.version()}'")
  fs.writeFileSync("build/#{gem}.gemspec", gemspec)

  copy("gem/#{gem}.rb",      "build/lib/#{gem}.rb")
  copy('README.md',          'build/README.md')
  copy('ChangeLog',          'build/ChangeLog')
  copy('LICENSE',            'build/LICENSE')
  for file in project.libs()
    copy(file, file.replace('lib/', 'build/lib/assets/javascripts/'))
  fullPack('build/lib/assets/javascripts/visibility.js')

  exec "cd build/; gem build #{gem}.gemspec", (error, message) ->
    if error
      process.stderr.write(error.message)
      process.exit(1)
    else
      fs.mkdirsSync('pkg/') unless fs.existsSync('pkg/')
      gemFile = glob.sync('build/*.gem')[0]
      copy(gemFile, gemFile.replace(/^build\//, 'pkg/'))
      fs.removeSync('build/')
