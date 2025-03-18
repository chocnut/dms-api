import fs from 'fs'
import path from 'path'
import swaggerSpec from '../lib/swagger'

async function generateSwaggerDocs() {
  try {
    const outputDir = path.join(__dirname, '../../swagger')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputPath = path.join(outputDir, 'swagger.json')
    fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf8')

    console.log(`✅ Swagger documentation generated at ${outputPath}`)
    return true
  } catch (error) {
    console.error('❌ Error generating Swagger documentation:', error)
    return false
  }
}

if (require.main === module) {
  generateSwaggerDocs()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error)
      process.exit(1)
    })
}

export default generateSwaggerDocs
