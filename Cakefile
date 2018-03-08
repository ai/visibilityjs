fs   = require('fs-extra')
url  = require('url')
exec = require('child_process').exec
http = require('http')
path = require('path')

project =

  package: ->
    JSON.parse(fs.readFileSync('package.json'))

  name: ->
    @package().name

  version: ->
    @package().version

  tests: ->
    fs.readdirSync('test/')
      .filter (i) -> i.match /\.coffee$/
      .map    (i) -> "test/#{i}"

  libs: ->
    fs.readdirSync('lib/').sort()
      .filter (i) -> i.indexOf('.js') != -1
      .map    (i) -> "lib/#{i}"

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
                #integration {
                  position: absolute;
                  top: 22px;
                  left: 66px;
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
              'node_modules/sinon/pkg/sinon.js',
              'node_modules/sinon-chai/lib/sinon-chai.js']

task 'server', 'Run test server', ->
  coffee = require('coffeescript')

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
  fs.removeSync('pkg/') if fs.existsSync('pkg/')
  for file in fs.readdirSync('./')
    fs.removeSync(file) if file.match(/\.gem$/)

task 'min', 'Create minimized version of library', ->
  uglify = require('uglify-js')

  invoke('clean')
  fs.mkdirsSync('pkg/')

  for file in project.libs()
    continue if file == 'visibility.js'
    name = file.replace(/^lib\//, '').replace(/\.js$/, '')
    fs.copySync(file, "pkg/#{name}-#{project.version()}.min.js")

  core   = fs.readFileSync('lib/visibility.core.js').toString()
  timers = fs.readFileSync('lib/visibility.timers.js').toString()
  fs.writeFileSync("pkg/visibility-#{project.version()}.min.js", core + timers)

  packages = fs.readdirSync('pkg/').filter( (i) -> i.match(/\.js$/) )
  for file in packages
    continue unless file.match(/\.js$/)
    min = uglify.minify('pkg/' + file)
    fs.writeFileSync('pkg/' + file, min.code)
