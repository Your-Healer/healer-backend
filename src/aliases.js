const path = require('path')
const moduleAlias = require('module-alias')

// Log current directory for debugging
console.log('Current working directory:', process.cwd())
console.log('__dirname:', __dirname)

// Register module aliases for production
moduleAlias.addAliases({
  '~': path.join(__dirname)
})

console.log('✅ Module aliases registered successfully')
console.log('Path for ~ alias:', path.join(__dirname))
