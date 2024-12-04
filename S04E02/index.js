import fs from 'fs/promises';
import OpenAI from 'openai'
import dotenv from 'dotenv'
import axios from 'axios';

dotenv.config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const PATHS = {
    CORRECT_DATA: './data/correct.txt', 
    INCORRECT_DATA: './data/incorrect.txt',
    VERYFY_DATA: './data/verify.txt'
}

async function readFile(path) {

    try {
        const data = await fs.readFile(path, 'utf-8')
        return data
    } catch (error) {
        console.log("Error during read a file: ", error)
    }
}

async function processData(path, type) {
    const correctData = await readFile(path)
    const array = correctData.trim().split('\n')
    const processedData = array.map(number => {
        return {
            messages: [
                {role: "system", content: "Validate user input"}, 
                {role: "user", content: `${number}`}, 
                {role: "assistant", content: `${type}`}
        ]
        }})

    return processedData
}


async function getJSONLData() {
    const correct = await processData(PATHS.CORRECT_DATA, 'correct')
    const incorrect = await processData(PATHS.INCORRECT_DATA, 'incorrect')

    const allData = [...correct, ...incorrect]
    
    const jsonlData = allData.map(item => JSON.stringify(item)).join("\n");
    try {
        fs.writeFile('fine_tuning_data.jsonl', jsonlData)
    } catch (error) {
        console.log("Error during writing data", error)
    }
}

// getJSONLData()


async function openAIRequest(systemPrompt, userQuery, model) {
    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: userQuery,
                },
            ],
        });

        console.log("OpenAI:", completion.choices[0].message.content);
        return completion.choices[0].message.content
    } catch (error) {
        console.error("Error during openAIRequest: ", error);
    }
}

async function prepareVerifyData() {
    const data = await readFile(PATHS.VERYFY_DATA)
    const array = data.trim().split('\n')
    const dataToVerify = array.map(data => {
        const [id, numbers] = data.split('=')
        return {
            id: id,
            data: numbers,
            check: ""
        }
    })
    return dataToVerify
}

async function sendData(taskName, answer) {
    const url = process.env.SECRET_ENDPOINT_REPORT;
    const dataToSend = {
        task: taskName,
        apikey: process.env.USER_API_KEY,
        answer: answer
    };

    try {
        const response = await axios.post(url, dataToSend);
        console.log(response.data);
    } catch (error) {
        console.log(error);
    }
}

async function verifyData() {
    const dataToVerify = await prepareVerifyData()
    const checkedDataPromices = dataToVerify.map(async record => {
        const answer = await openAIRequest("Validate user input", record.data, "ft:gpt-4o-mini-2024-07-18:personal:aidevs:AaTImPoP")
        return {
            ...record,
            answer: answer
        }
    })
    const checkedData = await Promise.all(checkedDataPromices)
    const answer = checkedData.filter(record => record.answer === 'correct').map(record => record.id)
    console.log(answer)
    sendData("research", answer)
}

verifyData()