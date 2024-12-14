import { config } from './config.js';
import OpenAI from 'openai';

export class OpenAIServices {
    
    constructor() {
        this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    }

    async completion(query, systemPrompt, model = 'gpt-4o', jsonMode = true) {
        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: query
        }];
        try {
          const chatCompletion = await this.openai.chat.completions.create({
            messages,
            model,      
            response_format: jsonMode ? { type: "json_object" } : { type: "text" }
          });
          console.log(chatCompletion.choices[0].message.content)
          return JSON.parse(chatCompletion.choices[0].message.content);
          
        } catch (error) {
          console.error("Error in OpenAI completion:", error);
          throw error;
        }
      }
}