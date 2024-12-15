import { DatabaseServices } from "./DatabaseServices.js"

const databaseServices = new DatabaseServices()

const FOLDER = "./data/output_txt"
const COLLECTION_NAME = "rafal_notes"

async function createDatabase() {
    await databaseServices.createCollection(COLLECTION_NAME)
    await databaseServices.updateCollection(FOLDER, COLLECTION_NAME)
}

createDatabase()