const path = require('path')
const moduleAlias = require('module-alias')

// Register module aliases for production
moduleAlias.addAliases({
  '~': path.join(__dirname),
  '~/generated/prisma/client': path.join(process.cwd(), 'node_modules', '.prisma', 'client')
})

console.log('✅ Module aliases registered successfully')
