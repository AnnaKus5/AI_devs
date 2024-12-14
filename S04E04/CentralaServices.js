import { config } from './config.js';
import axios from 'axios';
// import { FileServices } from './FileServices.js';

export default class CentralaServices {
    constructor() {
        this.userApiKey = config.userApiKey;
        // this.fileService = new FileServices();
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


    async sendAnswer(taskName, answer) {
        const url = config.reportEndpoint;

        const dataToSend = {
            apikey: this.userApiKey,
            answer: answer,
            task: taskName,
        };
    
        console.log("dataToSend", dataToSend);
        try {
            const response = await axios.post(url, dataToSend);
            console.log("response", response.data);
        } catch (error) {
            console.log(error);
        }
    }
}