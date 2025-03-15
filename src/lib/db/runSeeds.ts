import { db } from './config'
import { seed } from './seeds/initial_data'

async function runSeeds() {
  try {
    console.log('Starting seed process...')
    await seed(db)
    console.log('Seed completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

runSeeds()
