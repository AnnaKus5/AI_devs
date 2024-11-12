import axios from 'axios';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getQuestion() {
    const response = await axios.get('https://xyz.ag3nts.org');
    const $ = cheerio.load(response.data);
    const questionText = $('#human-question').text();

    console.log("Treść pytania:", questionText);
    return questionText;
}


async function processQuestion() {
    const question = await getQuestion()
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Your role is to answer the user's question. Answer should be as short as possible. Answer just a year" },
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

async function sendData() {
    const answer = await processQuestion()

    const dataToSend = new URLSearchParams();
    dataToSend.append('username', 'tester');
    dataToSend.append('password', '574e112a');
    dataToSend.append('answer', answer); 


    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html, application/xhtml+xml, application/xml;q=0.9, image/webp, */*;q=0.8'
        }
    }

    axios.post("https://xyz.ag3nts.org/", dataToSend, config)
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
}

// sendData()


// {{FLG:FIRMWARE}}