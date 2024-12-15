import { config } from './config.js';
import axios from 'axios';
import { FileServices } from './FileServices.js';

export class CentralaServices {
    constructor() {
        this.userApiKey = config.userApiKey;
        this.fileService = new FileServices();
    }

    async getDataFromCentrala() {
        const url = config.taskEndpoint;
        
        if (!url) {
            throw new Error('Task endpoint not configured');
        }

        try {
            const response = await axios.post(url);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get data from Centrala: ${error.message}`);
        }
    }

    async getQuestions() {

        let questions
        const isQuestionsFileExists = await this.fileService.checkFileExists('./data/questions.json');

        if (!isQuestionsFileExists) {
            questions = await this.getDataFromCentrala();
            this.fileService.saveFile(JSON.stringify(questions), './data/questions.json');
        }
        else {
            questions = JSON.parse(await this.fileService.readFile('./data/questions.json'));
        }
        console.log(questions)
        return questions;
    }

    async sendAnswer(taskName, answer) {
        const url = config.reportEndpoint;

        const dataToSend = {
            task: taskName,
            apikey: this.userApiKey,
            answer: answer
        };
    
        try {
            const response = await axios.post(url, dataToSend);
            console.log(response.data);
        } catch (error) {
            console.log(error);
        }
    }
}