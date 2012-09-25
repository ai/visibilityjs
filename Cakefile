fs     = require('fs-extra')
exec   = require('child_process').exec
http   = require('http')
path   = require('path')
glob   = require('glob')
coffee = require('coffee-script')
uglify = require('uglify-js')

mocha =

  template: """
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Visibility.js Tests</title>
              <style>#style#</style>
              <script>#script#</script>
              <script src="/visibility.core.js"></script>
              <script src="/visibility.timers.js"></script>
              <script>#tests#</script>
              <style>
                body {
                  padding: 0;
                }
              </style>
            <body>
              <div id="mocha"></div>
              <script>
                document.body.onload = function() {
                  mocha.setup({
                    ui: 'bdd',
                    ignoreLeaks: true
                  });
                  mocha.run();
                };
              </script>
            </body>
            </html>
            """

  html: ->
    @render @template,
      style:  @cdata(@style())
      script: @cdata(@script())
      tests:  @cdata(@tests())

  render: (template, params) ->
    html = template
    for name, value of params
      html = html.replace("##{name}#", value.replace(/\$/g, '$$$$'))
    html

  cdata: (text) ->
    "/*<![CDATA[*/\n" +
    text + "\n" +
    "/*]]>*/"

  style: ->
    fs.readFileSync('node_modules/mocha/mocha.css')

  script: ->
    @testLibs() +
    "chai.should();\n" +
    "mocha.setup('bdd');\n"

  testLibs: ->
    fs.readFileSync('node_modules/mocha/mocha.js') +
    fs.readFileSync('node_modules/chai/chai.js') +
    fs.readFileSync('node_modules/sinon/lib/sinon.js') +
    fs.readFileSync('node_modules/sinon/lib/sinon/spy.js') +
    fs.readFileSync('node_modules/sinon/lib/sinon/stub.js') +
    fs.readFileSync('node_modules/sinon-chai/lib/sinon-chai.js')

  lib: ->

  tests: ->
    files  = fs.readdirSync('test/').
      filter( (i) -> i.match /\.coffee$/ ).map( (i) -> "test/#{i}" )
    src = files.reduce ( (all, i) -> all + fs.readFileSync(i) ), ''
    coffee.compile(src)

task 'test', 'Run specs server', ->
  server = http.createServer (req, res) ->
    if req.url == '/'
      res.writeHead 200, { 'Content-Type': 'text/html' }
      res.write mocha.html()

    else if req.url == '/visibility.core.js'
      res.writeHead 200, { 'Content-Type': 'text/javascript' }
      res.write fs.readFileSync('lib/visibility.core.js')

    else if req.url == '/visibility.timers.js'
      res.writeHead 200, { 'Content-Type': 'text/javascript' }
      res.write fs.readFileSync('lib/visibility.timers.js')

    else if req.url == '/visibility.fallback.js'
      res.writeHead 200, { 'Content-Type': 'text/javascript' }
      res.write fs.readFileSync('lib/visibility.fallback.js')

    else if req.url == '/integration'
      html = fs.readFileSync('test/integration.html').toString()
      html = html.replace(/\.\.\/lib/g, '')
      res.writeHead 200, { 'Content-Type': 'text/html' }
      res.write(html)

    else
      res.writeHead 404, { 'Content-Type': 'text/plain' }
      res.write 'Not Found'

    res.end()
  server.listen 8000
  console.log('Open http://localhost:8000/')

task 'clean', 'Remove all generated files', ->
  fs.removeSync('build/') if path.existsSync('build/')
  fs.removeSync('pkg/')   if path.existsSync('pkg/')

fullPack = (file) ->
  core = fs.readFileSync('lib/visibility.core.js').toString()
  core = core.replace('})();', '')

  timers = fs.readFileSync('lib/visibility.timers.js').toString()
  timers = timers.replace(/[\w\W]*var timers/, '    var timers')

  fs.writeFileSync(file, core + timers)

task 'min', 'Create minimized version of library', ->
  fs.mkdirSync('pkg/') unless path.existsSync('pkg/')
  version = JSON.parse(fs.readFileSync('package.json')).version
  copy = require('fs-extra/lib/copy').copyFileSync

  files = ['lib/visibility.core.js', 'lib/visibility.timers.js',
           'lib/visibility.fallback.js']
  for file in files
    name = file.replace(/^lib\//, '').replace(/\.js$/, '')
    copy(file, "pkg/#{name}-#{version}.min.js")
  fullPack("pkg/visibility-#{version}.min.js")

  packages = glob.sync('pkg/*.js')
  for file in packages
    source = fs.readFileSync(file).toString()

    ast = uglify.parser.parse(source)
    ast = uglify.uglify.ast_mangle(ast)
    ast = uglify.uglify.ast_squeeze(ast)
    min = uglify.uglify.gen_code(ast)

    fs.writeFileSync(file, min)

task 'gem', 'Build RubyGem package', ->
  fs.removeSync('build/') if path.existsSync('build/')
  fs.mkdirSync('build/lib/assets/javascripts/')

  copy = require('fs-extra/lib/copy').copyFileSync
  copy('gem/visibilityjs.gemspec', 'build/visibilityjs.gemspec')
  copy('gem/visibilityjs.rb',      'build/lib/visibilityjs.rb')
  copy('lib/visibility.core.js',
       'build/lib/assets/javascripts/visibility.core.js')
  copy('lib/visibility.timers.js',
       'build/lib/assets/javascripts/visibility.timers.js')
  copy('lib/visibility.fallback.js',
       'build/lib/assets/javascripts/visibility.fallback.js')
  copy('README.md', 'build/README.md')
  copy('LICENSE',   'build/LICENSE')
  copy('ChangeLog', 'build/ChangeLog')
  fullPack('build/lib/assets/javascripts/visibility.js')

  exec 'cd build/; gem build visibilityjs.gemspec', (error, message) ->
    if error
      process.stderr.write(error.message)
      process.exit(1)
    else
      fs.mkdirSync('pkg/') unless path.existsSync('pkg/')
      gem = glob.sync('build/*.gem')[0]
      copy(gem, gem.replace(/^build\//, 'pkg/'))
      fs.removeSync('build/')
