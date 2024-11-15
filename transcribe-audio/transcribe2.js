import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from "openai";
import axios from 'axios';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const endpoint = process.env.SECRET_ENDPOINT_REPORT

const sourceFolder = './przesluchania';
const destinationFolder = './transcripts';

async function ensureFolderExists(folderPath) {
    try {
        await fs.access(folderPath);
    } catch (err) {
        await fs.mkdir(folderPath, { recursive: true });
        console.log(`Utworzono folder: ${folderPath}`);
    }
}

async function getFiles(folder) {
    try {
        const files = await fs.readdir(folder);
        console.log("Pliki do przetworzenia:", files);
        return files;
    } catch (error) {
        console.error('Błąd podczas odczytywania folderu:', error);
        return [];
    }
}

async function transcribe() {
    const pathsToFiles = await getFiles(sourceFolder);
    if (pathsToFiles.length === 0) {
        console.log("Brak plików do przetworzenia.");
        return;
    }

    for (const filePath of pathsToFiles) {
        const fullPath = path.join(sourceFolder, filePath);
        console.log(`Przetwarzanie pliku: ${fullPath}`);

        try {
            // Tworzymy strumień do przesłania pliku
            const fileStream = createReadStream(fullPath);

            const transcription = await openai.audio.transcriptions.create({
                file: fileStream,
                model: "whisper-1",
                language: "pl"
            });

            const fileName = filePath.split(".")[0];
            console.log(`Transkrypcja dla ${fileName}:`, transcription.text);
            await saveTranscription(fileName, transcription.text);
        } catch (error) {
            console.error("Error during transcription:", error);
        }
    }
}

async function saveTranscription(fileName, transcriptionText) {
    const filePath = path.join(destinationFolder, `${fileName}.txt`);
    try {
        await fs.writeFile(filePath, transcriptionText, 'utf8');
        console.log(`Zapisano transkrypcję w pliku: ${filePath}`);
    } catch (error) {
        console.error('Błąd zapisu transkrypcji:', error);
    }
}

// (async () => {
//     await ensureFolderExists(destinationFolder);
//     await transcribe();
// })()



async function readTxtFile(filePath) {
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        // console.log(`Zawartość pliku ${filePath}:`, fileContent);
        return fileContent;
    } catch (error) {
        console.error(`Błąd podczas odczytywania pliku ${filePath}:`, error);
        return null;
    }
}

async function prepareContextFromFiles(folder) {
    const pathsToFiles = await getFiles(folder)
    let context = ""
    for (const filePath of pathsToFiles) {
        const fullPath = path.join(folder, filePath);
        const fileName = filePath.split(".")[0];
        const fileContent = await readTxtFile(fullPath)
        context += "Zeznania " + fileName + "\n\n" + fileContent + "\n\n"
    }
    // console.log(context)
    return context
}

async function processQuestion() {

    const context = await prepareContextFromFiles(destinationFolder)
    const systemPrompt = `
        Wcielisz się w rolę detektywa. Twoim zadaniem będzie przeanalizowanie zezań świadków i
        znaleźć odpowiedź na pytanie: na jakiej ulicy znajduje się uczelnia, na której wykłada Andrzej Maj? Chodzi o adres konkretnego instytutu.
        Pamiętaj, że zeznania świadków mogą być sprzeczne, niektórzy z nich mogą się mylić, a inni odpowiadać w dość dziwaczny sposób.
        Nazwa ulicy prawdopodobnie nie pada w treści transkrypcji. Musisz ją wydedukować na podstawie zeznań świadków.
        Przygotuj odpowiedź w formacie json o podanej strukturze, nie używaj żadnych ozdobników, NIE używaj tagów markdown, zwróć TYLKO obiekt JSON:
        {
            "_thinking":  twoja dokładna analiza zeznań świadków, która doprowadzi Cię do odkrycia nazwy ulicy konkretnego instytutu na którym wykłada Andrzej Maj
            "street": nazwa ulicy na której znajduje się instytut uczelni na której wykłada Andrzej Maj
        }
        `
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Zeznania świadków: ${context}`,
                },
            ],
        });

        console.log("Odpowiedź OpenAI:", completion.choices[0].message.content);
        return completion.choices[0].message.content
    } catch (error) {
        console.error("Wystąpił błąd:", error);
    }
}


async function sendData(url) {
    
    const answer = JSON.parse(await processQuestion())
    console.log("Answer", answer)


    
    const dataToSend = {
        task: "mp3",
        apikey: process.env.USER_API_KEY,
        answer: answer.street
    }
    
    axios.post(url, dataToSend)
        .then(function (response) {
            console.log(response.data);
        })
        .catch(function (error) {
            console.log(error);
        });
}

// processQuestion()

sendData(endpoint)