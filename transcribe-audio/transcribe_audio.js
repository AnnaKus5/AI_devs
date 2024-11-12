// import fs from 'fs/promises';
import fs from 'fs'
import { Readable } from 'stream';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sourceFolder = './przesluchania';
const destinationFolder = './transcripts';

//remove async
function ensureFolderExists(folderPath) {
    try {
        fs.access(folderPath);
    } catch (err) {
        fs.mkdir(folderPath);
        console.log(`Utworzono folder: ${folderPath}`);
    }
}

function bufferToStream(buffer) {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null); // Oznacza koniec strumienia
    return readable;
}

//remove async
function getAudioFiles() {
    try {
        const files = fs.readdir(sourceFolder);
        console.log(files)
        return files
    } catch (error) {
        console.error('Błąd podczas odczytywania folderu:', error);
        return [];
    }
}

async function transcribe() {
    const pathsToFiles = getAudioFiles()
    for (const filePath of pathsToFiles) {
        const fullPath = `${sourceFolder}/${filePath}`
        const fileBuffer = fs.readFile(fullPath);
        console.log(`Przetwarzanie pliku: ${fullPath}`);
        // const fileStream = bufferToStream(fileBuffer);
        // console.log(fileBuffer)
        try {
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(fullPath),
                model: "whisper-1",
                language: "pl"
            });
            const fileName = path.split(".")[0]
            console.log(transcription.text)
            saveTranscription(fileName, transcription.text)
        }
        catch (error) {
            console.log("Error during transcription: ", error)
        }
    }
}

function saveTranscription(fileName, transcriptionText) {
    const filePath = path.join(destinationFolder, `/${fileName}.txt`);
    try {
        fs.writeFile(filePath, transcriptionText, 'utf8');
        console.log(`Zapisano transkrypcję w pliku: ${filePath}`);
    } catch (error) {
        console.error('Błąd zapisu transkrypcji:', error);
    }
}

ensureFolderExists(destinationFolder)
transcribe()