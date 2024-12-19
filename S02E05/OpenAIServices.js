import { config } from './config.js';
import OpenAI from 'openai';

export class OpenAIServices {
    
    constructor() {
        this.openai = new OpenAI({ apiKey: config.openaiApiKey });
        this.embeddingModel = "text-embedding-ada-002"
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

      async createEmbedding(text) {

        try {
            const embedding = await this.openai.embeddings.create({
              model: this.embeddingModel,
              input: text,
              encoding_format: "float",
            });
            return embedding.data[0].embedding
        } 
        catch (e) {
            console.error("Error during embedding", e)
        }
    }

    async analyzeImage(imageBase64) {
        const prompt = `
        Your role is to analyze image provided by user, and return a description in few sentences. Describe in details. Return response in Polish.
        Response in valid JSON format {
            "text": "description"
        }
        `;
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",  // Make sure to use vision model
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageBase64,
                                    detail: "high"
                                }
                            }
                        ],
                    },
                ],
                max_tokens: 1000,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            
            // Add error checking
            if (!result || !result.text) {
                console.error('Invalid response format from OpenAI:', result);
                throw new Error('Invalid response format from OpenAI');
            }
            
            return result;
        } catch (error) {
            console.error('Error analyzing image:', error);
            throw error;
        }
    }
}