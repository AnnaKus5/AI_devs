import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv'
import axios from 'axios';
import { accessSync } from 'fs';

dotenv.config()

const ENDPOINT_BAZA = process.env.SECRET_ENDPOINT_BAZA

const client = new QdrantClient({ host: "localhost", port: 6333 });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function queryDatabase(query) {

    const data = {
        task: "database",
        apikey: process.env.USER_API_KEY,
        query: query
    }
    try {
        const response = await axios.post(ENDPOINT_BAZA, data)
        console.log("Response from DB ", response.data)
        return response.data
    }
    catch (e) {
        console.error("Error during queryDatabase ", e)
    }
}

async function generateSelect() {

    const systemPrompt = `
    You are a SQL specialist. Your role is analyze provided problem, find the best solution and return the best SQL request.

    <rules>
    </rules>

    <task>
    1. Analyze provided tabels's structure.
    2. Analize user query: think about steps needs to execute to solve users problem.
    </task>

    <tables_structure>
    tables: connections, correct_order, datacenters, users

    Table: 'datacenters',
    Table: 'datacenters'
    Structure:
    - dc_id: int(11), nullable
    - location: varchar(30), not null 
    - manager: int(11), not null, default 31
    - is_active: int(11), default 0

    Table: 'users'
    Structure:
    - id: int(11), not null, auto increment, primary key
    - username: varchar(20), nullable
    - access_level: varchar(20), default 'user'
    - is_active: int(11), default 1
    - lastlog: date, nullable

  </tabls_structure>


    Return JSON object {
        "thinking": "analyze table structure, and think step by step what you have to do to solve users problem"
        "SQL_request": ""
    }
    `
    
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: {type: "json_object"},
            messages: [
                {role: "system", content: systemPrompt},
                {role: "user", content: "I need the ID numbers of the active datacentres, which are managed by managers who are currently on leave (inactive)."}
            ]
        })

        console.log(completion.choices[0].message.content)
        return JSON.parse(completion.choices[0].message.content).SQL_request
    }
    catch (error) {
        console.error("Error during generateSelect ", error)
    }
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

async function main() {
    const tableList = await queryDatabase("show create table connections")
    console.log(tableList)
}

async function getTheAnswer(params) {
    const query = await generateSelect()
    const answerDB = await queryDatabase(query)
    console.log(answerDB)
    const answer = answerDB.reply.map(id => id.dc_id)

    sendData("database", answer)
}

getTheAnswer()

