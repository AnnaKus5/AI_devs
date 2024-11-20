//prepare contex for indexing chunks
// -> save facts in one variable contex, save also filename
// create reportcontex
// save filespaths into array

// expected structure:
// {
//     "nazwa-pliku-01.txt":"lista, słów, kluczowych 1",
//     "nazwa-pliku-02.txt":"lista, słów, kluczowych 2",
//     "nazwa-pliku-03.txt":"lista, słów, kluczowych 3",
//     "nazwa-pliku-NN.txt":"lista, słów, kluczowych N"
//     }

import fs from 'fs/promises'
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from "openai";
import axios from 'axios';

dotenv.config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })


async function getFilesPaths(folder) {

    try {
        const files = await fs.readdir(folder);
        // console.log(`files, getFilesPath`, files)
        const filterFiles = files
            .filter(file => path.extname(file) === '.txt')
            // .map(file => path.join(folder, file))
            .map(file => `${folder}/${file}`)
        return filterFiles;
    } catch (error) {
        console.error('Błąd podczas odczytywania folderu:', error);
    }
}

async function saveContextFromFiles(array) {
    let context = ""
    for (const filePath of array) {
        const fileContent = await fs.readFile(filePath, 'utf-8')
        context += (`${filePath} \n ${fileContent}\n`)
    }
    return context
}

async function processTextData(array, context, reports) {

    const systemPrompt = `
    <facts>
    ${context}
    </facts>
    <all_reports>
    ${reports}
    </all_reports>
    Your role is to meticulously analyze the provided user report and extract the most relevant keywords.

    Analysis instructions, act step by step:
    1. Initial keyword extraction from report:
       - Identify key names of people and organizations
       - Extract locations and places mentioned
       - Note technical terms and specifications
       - Capture main events and actions
       - List status changes and decisions
       
    2. Context analysis:
       - Read through all provided facts in <facts> and <all_report> sections
       - Look for matching names, events, or locations
       - Identify related incidents or background information
       - Find additional context about people mentioned
       
    3. Keyword refinement using context:
       - Update initial keywords with more specific terms found in context
       - Describe who are people mention in keywords
       - Add relevant background information as keywords
       - Include relationship keywords between report and context
       - Ensure keywords capture both specific details and broader themes
       
    4. Final review:
       - Verify keywords accurately represent both report and context
       - Confirm keywords are specific enough to be useful
       - Check that critical connections between report and facts are captured

    Return only 5-7 of the most precise and relevant keywords that capture the essence of the report.
    Keywords should be specific rather than general. But add some general keyword to improve indexing and searching report.
    Do not include any explanations or additional text - only the keywords separated by commas.
`
    const responsesPromises = array.map(async filePath => {
        const doc = await fs.readFile(filePath, 'utf-8')

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: doc }
                ]
            })
            console.log(completion.choices[0].message.content)
            return { file: filePath, keywords: completion.choices[0].message.content }
        } catch (error) {
            console.error("Error during OpenAI request: ", error)
        }
    })

    const responses = await Promise.all(responsesPromises)
    // console.log(responses)
    return responses
}

function transformData (array) {
    let solution = {}
    for (const item of array) {  
    const fileName = item.file.split('/').pop();
    const keywords = item.keywords
    solution[fileName] = keywords
}
return solution
}

async function sendData(data) {

    const url = process.env.SECRET_ENDPOINT_REPORT

    const dataToSend = {
        task: "dokumenty",
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
    const filePathsFacts = await getFilesPaths('./pliki_z_fabryki/facts')
    const filePathsReports = await getFilesPaths("./pliki_z_fabryki")
    const contextFacts = await saveContextFromFiles(filePathsFacts)
    const contextReports = await saveContextFromFiles(filePathsReports)
    const response = await processTextData(filePathsReports, contextFacts, contextReports)
    const solution = transformData(response)
    // console.log(solution)
    sendData(solution)

    
}

main()