import axios from 'axios';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const url = "https://centrala.ag3nts.org/data/86cf405b-cfa7-4ef0-a55c-c23aceacbe68/cenzura.txt"
const verifyUrl = "https://centrala.ag3nts.org/report "

async function getData(url) {
    const response = await axios.get(url);

    console.log(response.data);
    return response.data;
}

// async function startVerify() {
//     const msg = {
//         text: "READY",
//         msgID: msgID
//     }
//     try {
//         const response = await axios.post(url, msg);
//         console.log(response.data);
//         msgID = response.data.msgID;
//         const question = response.data.text;
//         return question; 
//     } catch (error) {
//         console.log(error);
//         throw error;  
//     }
// }


async function censoreData() {
    const dataToCensore = await getData(url)
    const systemPrompt = `
        You are an AI assistant designed to censor sensitive data. Your role is to replace all sensitive data (like name, surname, age, city, street, numbers) to word "CENZURA". 
        Use only word "CENZURA", words like "CENZURie" are not acceptable.  
        <example>
        Data to censore:
        Informacje o podejrzanym: Marek Jankowski. Mieszka w Białymstoku na ulicy Lipowej 9. Wiek: 26 lat.
        Expected output:
        Informacje o podejrzanym: CENZURA CENZURA. Mieszka w CENZURA na ulicy CENZURA. Wiek: CENZURA lat.
        </example>
        Return ONLY censored data, without any additional information. Don't miss any punctuation mark(like , or .). 
        <dataToCensore>
        ${dataToCensore}
        </dataToCensore>
        `
    // console.log("Data do censore: ", dataToCensore)
    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: "llama3.2:3b",
            prompt: systemPrompt,
            stream: false
        })
        console.log("Llama response: ", response.data.response)
        return response.data.response
    }
    catch (error) {
        console.log(error)
    }

}

// censoreData()


async function sendData(url) {

    const data = await censoreData()

    const dataToSend = {
        task: "CENZURA",
        apikey: "86cf405b-cfa7-4ef0-a55c-c23aceacbe68",
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

sendData(verifyUrl)
