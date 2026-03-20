const { readdirSync, lstatSync } = require('fs')

const sassPlugin = require('esbuild-sass-plugin').default

const esbuild = require('esbuild')

let config = {
  entryPointSass: 'src/scss/_styles.scss',
  entryPointJs: 'src/js/scripts.js',
  outFileSass: 'Content/css/styles.css',
  outFileJs: 'Content/js/scripts.js',
  bundle: false,
  minify: true,
  watch: false,
  sourcemap: false,
  splitting: false
}

if (process.argv[2] && process.argv[2] === '-d') {
  console.log('Running dev mode')
  config.bundle = false
  config.minify = false
  config.splitting = false
  config.sourcemap = true
  config.watch = true
}

const getEntryPoints = (dirName) => {
  let files = [];
  const items = readdirSync(dirName)
    .map(item => {
      const path = `${dirName}/${item}`
      const isDirectory = lstatSync(path).isDirectory()
      return {
        name: item,
        path: path,
        isDirectory: isDirectory
      }
    }).filter(item => item.isDirectory || item.path.endsWith('.js') || item.path.endsWith('.scss'))
  
  for (const item of items) {
    if (item.isDirectory) 
      files = [...files, ...getEntryPoints(`${dirName}/${item.name}`)]
    else 
      files.push(item.path)
  }
  return files
}

const externalItemsForBundle = []

if (config.bundle) {
  externalItemsForBundle[0] = "*.png";
  externalItemsForBundle[1] = "*.gif";
  externalItemsForBundle[2] = "*.woff2";
  externalItemsForBundle[3] = "*.woff";
}

esbuild.build({
  entryPoints: [config.entryPointSass],
  bundle: config.bundle,
  external: externalItemsForBundle,
  minify: config.minify,
  watch: config.watch && {
    onRebuild(error, _) {
      if (error) console.error('watch build failed:', error)
      else console.log('watch build succeeded:')
    },
  },
  outfile: config.outFileSass,
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  target: ['safari14'],
  format: 'esm',
  sourcemap: config.sourcemap,
  splitting: config.splitting,
  plugins: [
    sassPlugin()
  ]
}).catch((err) => {
  console.log(err) // eslint-disable-line no-console
  process.exit(1)
})

