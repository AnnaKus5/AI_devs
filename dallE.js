import axios from 'axios';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();    

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });  


async function getData() {
    const url = process.env.SECRET_ENDPOINT_ROBOTID
    const response = await axios.get(url);
    // console.log(response.data);
    return response.data.description;
}

async function generatePrompt(data) {
    try {
       const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "Your role is to generate a prompt for DALL-E 3 based on the given description." },
            { role: "user", content: `Description: ${data}` },
        ],
       })
       return completion.choices[0].message.content
    } catch (error) {
        console.error("Error during prompt generation:", error);
    }
}

async function generateImage(prompt) {
    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
        })
        return response.data[0].url
    } catch (error) {
        console.error("Error during image generation:", error);
    }
}   


async function sendData(imageUrl) {

    const url = process.env.SECRET_ENDPOINT_REPORT
    
    const dataToSend = {
        task: "robotid",
        apikey: process.env.USER_API_KEY,
        answer: imageUrl
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
        const description = await getData();
        console.log(description);
        const prompt = await generatePrompt(description);
        
        const imageUrl = await generateImage(prompt);
        console.log(imageUrl);
    
        await sendData(imageUrl);
    }
    
    main()