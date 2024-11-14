// map test-data array
// exctract x i y from question value 
// check if answer is correct if not - replace the value
// check if test properity exists 
// if true -> send request to GPT and save the answer to a variable

// import data from 'S01E03.json' assert {type: 'json'};

// const { default: data } = await import("./S01E03.json", {
//     assert: {
//       type: "json",
//     },
//   });
import axios from "axios";
import { createRequire } from "module";
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const require = createRequire(import.meta.url);
const data = require('./S01E03.json')

console.log(data.copyright)
const endpoint = process.env.SECRET_ENDPOINT_REPORT


const newData = await Promise.all(
    data["test-data"].map(async item => {
        const [x, y] = item.question.split(" + ").map(Number)
        const sum = x + y

        const result = {
            question: item.question,
            answer: sum,
          };
    
        if ("test" in item) {
            const question = item.test.q
            const answer = await processQuestion(question)
            result.test = {
                q: question,
                a: answer
            }
            console.log(answer)
        }
        return result
    })
)

data["test-data"] = newData


async function processQuestion(question) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Your role is to answer the user's question. Answer in one word" },
                {
                    role: "user",
                    content: `Question: ${question}`,
                },
            ],
        });

        console.log("Odpowiedź OpenAI:", completion.choices[0].message.content);
        return completion.choices[0].message.content
    } catch (error) {
        console.error("Wystąpił błąd:", error);
    }
}

const dataToSend = {
    task: "JSON",
    apikey: process.env.USER_API_KEY,
    answer: data
}

async function sendData(url, data) {
    axios.post(url, data)
        .then(function (response) {
            console.log(response.data);
        })
        .catch(function (error) {
            console.log(error);
        });
}

sendData(endpoint,dataToSend)