import workerThreads from 'worker_threads'
import { promises as fs } from 'fs'

const workerData = JSON.parse(workerThreads.workerData)

try {
  await fs.writeFile(workerData.path, JSON.stringify(workerData.data))
} catch (error) {
  console.log(`An error occured while writing games data: ${error.message}`)
}
