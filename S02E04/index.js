import fs from 'fs/promises'
import dotenv from 'dotenv';
import OpenAI from "openai";
import axios from 'axios';
import { createReadStream, readFileSync } from 'fs';
import { promises } from 'dns';


dotenv.config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const systemPrompt = `
Your role is to analyze provided content, base on two arguments:
- is content containing information about CURRENTLY captured/detained people or clear evidence of their recent presence (like personal belongings, signs of struggle, etc.)? return 'humans'
- is content containing information about repaired hardware faults, mechanical failure, repair machines and any other mechanical, manual repair (NON INCLUDED: related to software, updated software). return 'hardware'
in any other cases return: 'false'
`
async function ensureFolderExists(folderPath) {
    try {
        await fs.access(folderPath);
    } catch (err) {
        await fs.mkdir(folderPath, { recursive: true });
        console.log(`Utworzono folder: ${folderPath}`);
    }
} 

async function filterFiles(folder, format) {

    let filterRegex = ""

    switch (format) {
        case 'text':
            filterRegex = /\.txt$/;
            break;
        case 'audio':
            filterRegex = /\.mp3$/;
            break;
        case 'image':
            filterRegex = /\.png$/;
            break;
    }

    try {
        const files = await fs.readdir(folder);
        const filterFiles = files.filter(file => {
            return file.toLowerCase().match(filterRegex)
        })
        return filterFiles;
    } catch (error) {
        console.error('Błąd podczas odczytywania folderu:', error);
        return [];
    }
}

async function processTextData(array) {
    const responsesPromises = array.map(async fileName => {
        const doc = await fs.readFile(`./pliki_z_fabryki/${fileName}`, 'utf-8')

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: doc }
                ]
            })
            // console.log(completion.choices[0].message.content)
            return { file: fileName, classification: completion.choices[0].message.content }
        } catch (error) {
            console.error("Error during OpenAI request: ", error)
        }
    })

    const responses = await Promise.all(responsesPromises)
    // console.log(responses)
    return responses
}

async function processAudioData(array) {
    // make transcripts, save it in a file and return array of path of this files
    const responsesPromises = array.map(async fileName => {
        const fileStream = createReadStream(`./pliki_z_fabryki/${fileName}`)

        const transcription = await openai.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-1",
            language: "en"
        })

        await ensureFolderExists("./pliki_z_fabryki/transcription")
        const newPath = `./transcription/${fileName.split(".")[0]}-transcription.txt`
        await fs.writeFile(`./pliki_z_fabryki/${newPath}`, transcription.text, 'utf-8')
        return newPath
    })

    const transcribeFilesPaths = await Promise.all(responsesPromises)
    const analyzeAudioData = await processTextData(transcribeFilesPaths)
    const orginalPaths = analyzeAudioData.map((obj, index) => {
       return {
        ...obj,
        file: array[index]
       }
    })
    // console.log(orginalPaths)
    return orginalPaths
}

async function processImageData(array) {
    const responsesPromises = array.map(async fileName => {
        const imageBuffer = readFileSync(`./pliki_z_fabryki/${fileName}`)
        const imageBase64 = imageBuffer.toString('base64')

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analyze this image"
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBase64}`,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                temperature: 0
            })
            // console.log("Vision model response: ", response.choices[0].message.content)
            return { file: fileName, classification: response.choices[0].message.content }

        } catch (error) {
            console.error("Error during request vision model", error)
        }
    })

    const analyzeImageData = await Promise.all(responsesPromises)
    return analyzeImageData

}

function filterResults(array) {
    const people = array.filter(file => file.classification === 'humans').map(file => file.file).sort()
    const hardware = array.filter(file => file.classification === 'hardware').map(file => file.file).sort()

    return {
        people: people,
        hardware: hardware
    }
    
}

async function sendData(data) {
    
    const url = process.env.SECRET_ENDPOINT_REPORT

    const dataToSend = {
        task: "kategorie",
        apikey: process.env.USER_API_KEY,
        answer: data
    }
    
    axios.post(url, dataToSend)
        .then(function (response) {
            console.log(response.data);
        })
        .catch(function (error) {
            console.log(error);
        });
}



async function main() {
    const textFiles = await filterFiles('./pliki_z_fabryki', 'text');
    const audioFiles = await filterFiles('./pliki_z_fabryki', 'audio');
    const imageFiles = await filterFiles('./pliki_z_fabryki', 'image');

    const anazyleTextData = await processTextData(textFiles)
    const analyzeAudioData = await processAudioData(audioFiles)
    const analyzeImagedata = await processImageData(imageFiles)
    console.log("anazyleTextData", anazyleTextData)
    console.log("analyzeAudioData", analyzeAudioData)
    console.log("analyzeImagedata", analyzeImagedata)

    const allAnalyzeData = anazyleTextData.concat(analyzeAudioData, analyzeImagedata)

    const sortedData = filterResults(allAnalyzeData)
    console.log(sortedData)

    await sendData(sortedData)
}

main();
