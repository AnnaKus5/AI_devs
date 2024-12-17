import { DatabaseServices } from "./DatabaseServices.js"
import { OpenAIServices } from "./OpenAIServices.js"
import { FileServices } from "./FileServices.js"
import { config } from "./config.js"

const databaseServices = new DatabaseServices()
const openai = new OpenAIServices()

const FOLDER = "./data/output_txt"
const COLLECTION_NAME = "rafal_notes"

async function createDatabase() {
    await databaseServices.createCollection(COLLECTION_NAME)
    await databaseServices.updateCollection(FOLDER, COLLECTION_NAME)
}

// createDatabase()

async function addImageContext() {
    const fileServices = new FileServices();
    const inputFolder = './data/output_img';
    const outputFolder = './data/output_img/txt';
    
    try {
        // const imageFiles = await fileServices.getFilesPaths(inputFolder);
        
        // for (const imageFile of imageFiles) {
        //     const imagePath = `${inputFolder}/${imageFile}`;
        //     const imageBase64 = await fileServices.getBase64(imagePath)            
        //     const analysis = await openai.analyzeImage(imageBase64);
            
        //     const textFileName = imageFile.replace(/\.(jpg|jpeg|png)$/i, '.txt');
        //     const textFilePath = `${outputFolder}/${textFileName}`;
        //     await fileServices.saveFile(analysis.text, textFilePath);
        // }
        await databaseServices.updateCollection(outputFolder, COLLECTION_NAME);
        
        console.log('Successfully processed images and updated collection');
    } catch (error) {
        console.error('Error in addImageContext:', error);
        throw error;
    }
}

addImageContext()


