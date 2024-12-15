//import databases services
import { OpenAIServices } from './OpenAIServices.js';
import { FileServices } from './FileServices.js';
export class FindAnswerServices {
    constructor() {
        this.openai = new OpenAIServices();
        this.fileService = new FileServices();
    }

    async processQuestion(question, mainUrl) {
        let isAnswerFound = false
        let answer = ""

        while (!isAnswerFound) {
            console.log("isAnswerFound", isAnswerFound)
            console.log("answer", answer)

        // const chunks = await databaseServices.
            
            const systemPrompt = `You are a helpful assistant that can answer questions provided by the user. 
            You are given a website content and a question. You need to answer the question based on the website content. 
            If you cannot find the answer in the context, DON'T answer the question, just return empty string.
            If you don't have the answer, select the most relevant url from the list of links and return it.
            <website content>
            ${markdown}
            </website content>
            <website links>
            ${links}
            </website links>
            Return the answer in JSON format:
            {   
                "thinking": your thoughts about the question and the website content,
                "answer": short answer to the question, return empty string if you cannot find the answer
                "answerFound": true if the answer is found, false otherwise
                "selectedUrl": url of the page that could contains the answer, only one most relevant url; empty string if you find the answer
            }
            `;

            const completion = await this.openai.completion(question, systemPrompt);
            answer = completion.answer
            selectedUrl = completion.selectedUrl
            isAnswerFound = completion.answerFound
        }
        return answer;
    }
}
