//import databases services
import { OpenAIServices } from './OpenAIServices.js';
import { FileServices } from './FileServices.js';
import { DatabaseServices } from './DatabaseServices.js';


export class FindAnswerServices {
    constructor() {
        this.openai = new OpenAIServices();
        this.fileService = new FileServices();
        this.databaseServices = new DatabaseServices()
    }

    async processQuestion(question, documents) {

        console.log(question)

            const systemPrompt = `You are a helpful assistant that can answer questions provided by the user. 
            You are given a relavant documents and a question. You need to answer the question based on the provided content. 
            Analyze every detail in documents and match facts and events. 
            Your answer should be short, answer in just a few words. You HAVE TO FIND THE ANSWER!!! Use your own knowleage to analyze the facts if you can't find the answer.
            <relavant documents>
            ${documents}
            </relavant documents>
            Return the answer in JSON format:
            {   
                "thinking": analyze every detail that could be helpfull 
                "thinking2": if you don't find the answer in documents: combine facts, and use your own knowleage to analyze detailis to find the right answer
                "answer": short answer to the question, return empty string if you cannot find the answer, respond in Polish
            }
            `;

            const completion = await this.openai.completion(question, systemPrompt);
            const answer = completion.answer
            return answer;
        }
    }
