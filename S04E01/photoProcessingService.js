import { config } from './config.js';
import axios from 'axios';

export class PhotoProcessingService {
    constructor(apiKey) {
      this.apiKey = config.userApiKey;
      this.baseUrl = config.secretEndpoint;
    }
  
    async start() {
    //   const response = await fetch(this.baseUrl, {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       task: 'photos',
    //       apikey: this.apiKey,
    //       answer: 'START'
    //     })
    //   });

    console.log(this.apiKey)
        const response = await axios.post(this.baseUrl, {
            task: 'photos',
            apikey: this.apiKey,
            answer: 'START'
        })
      console.log(response)
      return response.data.message;
    }
  
    async processImage(command, filename) {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'photos',
          apikey: this.apiKey,
          answer: `${command} ${filename}`
        })
      });
      return response.json();
    }
  
    async submitDescription(description) {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'photos',
          apikey: this.apiKey,
          answer: description
        })
      });
      return response.json();
    }
  }
  