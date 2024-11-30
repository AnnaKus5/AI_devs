import { config } from './config.js';
import OpenAI from 'openai';

export class OpenAIService {
    constructor() {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    }
  
    async analyzeImage(imageUrl) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: this.getAnalysisPrompt()
                },
                {
                  type: "image_url",
                  image_url: imageUrl
                }
              ],
            },
          ],
          max_tokens: 1000,
        });
        return JSON.parse(response.choices[0].message.content);
      } catch (error) {
        console.error('Error analyzing image:', error);
        throw error;
      }
    }
  
    async generateDescription(images) {
      try {
        const messages = [
          {
            role: "system",
            content: this.getDescriptionPrompt()
          },
          {
            role: "user",
            content: images.map(img => ({
              type: "image_url",
              image_url: img.url
            }))
          }
        ];
  
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          max_tokens: 1000,
        });
  
        return response.choices[0].message.content;
      } catch (error) {
        console.error('Error generating description:', error);
        throw error;
      }
    }
  
    getAnalysisPrompt() {
      return `Analyze this image and determine:
  1. Image quality (good/bad)
  2. Required improvements (REPAIR/DARKEN/BRIGHTEN)
  3. Is there a woman in the photo?
  4. Confidence level that this could be Barbara
  5. Key identifying features
  
  Respond in JSON format:
  {
    "_thinking": "your reasoning about the image",
    "quality": "good/bad",
    "actions": ["REPAIR", "DARKEN", "BRIGHTEN"],
    "hasWoman": true/false,
    "couldBeBarbara": true/false,
    "confidence": 0-100,
    "features": []
  }`;
    }
  
    getDescriptionPrompt() {
      return `Based on the provided images of Barbara, create a detailed description in Polish. Include:
  1. Physical characteristics
  2. Distinctive features
  3. Clothing style
  4. Any other identifying details
  
  The description should be detailed enough for identification purposes.`;
    }
  }