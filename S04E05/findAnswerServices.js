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

    async processQuestion(question, documents, collectionName) {
        let isAnswerFound = false
        let answer = ""
        let context = ''
        let transformedQuery = ''
        let attempt = 0

        documents.map(doc => context += doc.payload.content + '\n' )

        
        while (!isAnswerFound && attempt < 3) {
            console.log("############## atempt ##############" , attempt)
            console.log("isAnswerFound", isAnswerFound)
            console.log("answer", answer)
            console.log(context)

            const systemPrompt = `You are a helpful assistant that can answer questions provided by the user. 
            You are given a relavant documents and a question. You need to answer the question based on the provided content. 
            Analyze every detail in documents and match facts and events. Sometimes answer won't be clear, but it is high possibility, that you can find the answer in provided documents, if you are not sure, try to guess.
            Take account of all the facts given in the text, in particular the references to events, look for threads of cause and effect, try to reconstruct the structure of events on the basis of the information you have.
            Sometimes maybe you have to use your own knowleage, about happend events, this can suplement the timeline. 
            If you cannot find the answer in the context, and there is no possibility to guess, just return empty string.
            Your answer should be short, answer in just a few words. 
            You you don't find the answer, transform user query to ask our database for relevant documents. 
            Documents are store in vector database, so query has to be meaningfull for the problem, we are looking for solution. Incude events and other importat detail in the query. Use informaction, that you can find in provided documents to preparare the query.
            <relavant documents>
            ${context}
            </relavant documents>
            Return the answer in JSON format:
            {   
                "thinking": your thoughts about the question and the website content, analyze each detail and event to find right answer, add your thought about the events and timeline
                "answer": short answer to the question, return empty string if you cannot find the answer, respond in Polish
                "answerFound": true if the answer is found, false otherwise,
                "transformedQuery": if you don't find the answer transform user query for searching in database, if you find the answer, return empty string
            }
            `;

            const completion = await this.openai.completion(question, systemPrompt);
            answer = completion.answer
            isAnswerFound = completion.answerFound
            attempt += 1
            transformedQuery = completion.transformedQuery
            if (!isAnswerFound) {
                const newDocs = await this.databaseServices.findRevelantDocuments(transformedQuery, collectionName)
                context = ""
                context = newDocs.map(doc => doc.payload.content).join('\n')
            }
        }
        return answer;
    }
}
