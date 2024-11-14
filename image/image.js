import { OpenAIService } from "./OpenAIService";
import { readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const folderPath = "/images/"
const imagePaths = getFiles(folderPath)

async function getFiles(folder) {
    try {
        const files = await fs.readdir(folder);
        console.log("Files in directory:", files);
        return files;
    } catch (error) {
        console.error('Error reading folder:', error);
        return [];
    }
}