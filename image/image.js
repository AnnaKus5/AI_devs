import { readFileSync } from "fs";
import { join } from "path";
import fs from 'fs/promises'
import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FOLDER_PATH = "./images"

async function getFiles(folder) {
    try {
        const files = await fs.readdir(folder);
        // console.log("Files in directory:", files);
        return files;
    } catch (error) {
        console.error('Error reading folder:', error);
        return [];
    }
}

function processImagesToBuffer(paths) {
    const imagesBuffer = []

    for (const path of paths) {
        const filePath = join(FOLDER_PATH, path)
        const imageBuffer = readFileSync(filePath)
        const imageBase64 = imageBuffer.toString('base64')

        imagesBuffer.push({
            type: "image_url",
            image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high"
            }
        })
    }

    return imagesBuffer
}

async function requestVisionModel(imagesBuffer) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: "system",
                    content: `Your role is to analyze images and find the answer from witch city they are? Cities are located in Poland.                              
                            Act step by step, analyze each image separately: analyze streets name, main points, crossovers, find the city where this crossovers and streets exists.
                            Three maps are from one city. One image is probably from another city.
                            Be specific and response: which city is most likely? 
                            `
                },
                {
                    role: "user",
                    content: imagesBuffer
                    
                }
            ], 
            temperature: 0
        })

        console.log(response.choices[0].message.content)
    }
    catch (error) {
        console.error("Error making request to GPT-4o Vision Model:", error)
    }
}

async function main() {
    const imagePaths = await getFiles(FOLDER_PATH)
    const imageData = processImagesToBuffer(imagePaths)
    // console.log(imageData)
    requestVisionModel(imageData)
    
}

main()

