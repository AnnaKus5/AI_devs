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
      console.log(response.data)
      return response.data.message;
    }
  
    async processImage(command, filename) {
      console.log("processImage", command, filename)
    const response = await axios.post(this.baseUrl, {
        task: 'photos',
        apikey: this.apiKey,
        answer: `${command} ${filename}`
    })

      console.log("processImage response", response.data.message)
      //miss base url
      return response.data.message;
    }
  
    async submitDescription(description) {
      console.log("submitDescription", description)
      const response = await axios.post(this.baseUrl, {
          task: 'photos',
          apikey: this.apiKey,
          answer: description
        })
        console.log("submitDescription response", response.data.message)
      return response.data.message;
    }
  }
  