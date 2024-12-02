import { config } from './config.js';
import OpenAI from 'openai';

export class OpenAIService {
    constructor() {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    }

    async analyzeResponse(response, baseUrl = 'not provided', status, fileName) {

        const prompt = status === 'initial' ? this.getInitialResponsePrompt(response) : this.getProcessingResponsePrompt(response, baseUrl, fileName);
  
        try {
          const analysis = await this.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are a response analyzer specialized in extracting structured data from natural language API responses." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          });
  
          const parsedAnalysis = JSON.parse(analysis.choices[0].message.content);
          
          console.log("parsedAnalysis", parsedAnalysis)
          return {
            images: parsedAnalysis.images.map(filename => ({
              filename,
              baseUrl: parsedAnalysis.baseUrl,
              url: `${parsedAnalysis.baseUrl}${filename}`,
              smallUrl: `${parsedAnalysis.baseUrl}${filename.replace('.PNG', '-small.PNG')}`,
              finishProcessed: parsedAnalysis.finishProcessed
            }))
          };
        } catch (error) {
          console.error('Error analyzing response:', error);
          throw new Error('Failed to analyze API response');
        }
      }
  
    async analyzeImage(imageBase64) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: this.getAnalysisImagePrompt()
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: "high"
                  }
                }
              ],
            },
          ],
          max_tokens: 1000,
          response_format: { type: "json_object" }
        });
        console.log("response in analyzeImage", response.choices[0].message.content)
        return JSON.parse(response.choices[0].message.content);
      } catch (error) {
        console.error('Error analyzing image:', error);
        throw error;
      }
    }
  
    async generateDescription(images) {

      const imagesBufferMessagesPromises = await images.map(async image => {
        const imageBuffer = await fetch(image.imageUrl).then(res => res.arrayBuffer());
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        return {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "high"
          }
        }

      })
      const imagesBufferMessages = await Promise.all(imagesBufferMessagesPromises)

      try {
        const messages = [
          {
            role: "system",
            content: this.getDescriptionPrompt()
          },
          {
            role: "user",
            content: imagesBufferMessages
          }
        ];
  
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          max_tokens: 1000
        });
  
        return response.choices[0].message.content;
      } catch (error) {
        console.error('Error generating description:', error);
        throw error;
      }
    }

    getInitialResponsePrompt(response) {
      return `Analyze this API response and extract relevant information about images and instructions.
  Input response: "${JSON.stringify(response)}"
  
  Please identify:
  1. Base URL for images - baseUrl is url without filename
  2. List of image filenames
  3. List of imagesUrls (if any)
  4. Available commands
  5. Any special instructions
  
  Respond in this JSON format:
  {
    "_thinking": "explanation of your analysis",
    "baseUrl": "extracted base url or null",
    "images": ["list", "of", "image", "filenames"],
    "imagesUrls": ["list", "of", "image", "urls"],
    "commands": ["available", "commands"],
    "isValid": boolean, 
    "finishProcessed": false
  }`
    }


    getProcessingResponsePrompt(response, baseUrl, fileName) {
        return `Analyze this API response from an image processing command.
    Input response: "${response}"
    
    Context: This is a response after applying REPAIR, DARKEN, or BRIGHTEN to an image.
    
    Please extract:
    1. Success status
    2. New image filename (if any)
    3. Base URL: "${baseUrl}"
    4. If there is no filename in response, return previous image filename: "${fileName}"
    
    Response format as JSON:
    {
      "_thinking": "explanation of how you interpreted the processing result",
      "success": true/false,
      "images": ["list", "of", "image", "filenames"],
      "baseUrl": "${baseUrl}",
      "url": "complete URL to the processed image",
      "smallUrl": "URL to the small version of processed image",
      "finishProcessed": false
    }
    
    Example successful response:
    {
      "_thinking": "The response indicates successful repair of IMG_559.PNG, resulting in new file IMG_559_FGR4.PNG",
      "success": true,
      "images": ["IMG_559_FGR4.PNG"],
      "baseUrl": "${baseUrl}",
      "url": "${baseUrl}/IMG_559_FGR4.PNG",
      "smallUrl": "${baseUrl}/IMG_559_FGR4-small.PNG",
      "isValid": true,
      "isProcessingResponse": true,
      "finishProcessed": false
    }`;
      }
  
    getAnalysisImagePrompt() {
      return `Analyze this image and determine:
1. Image quality (good/bad)
2. Required improvements (REPAIR/DARKEN/BRIGHTEN)
3. Presence of a woman
4. If a woman is clearly visible in good quality photo, assume it could be Barbara

Important: If the image is good quality AND shows a clearly visible woman, set:
- couldBeBarbara: true
- confidence: 80
- finishProcessed: true

Return in JSON format:
{
  "_thinking": "your analysis process",
  "quality": "good/bad",
  "actions": ["needed actions"],
  "hasWoman": boolean,
  "couldBeBarbara": boolean (true if good quality image shows a woman),
  "confidence": number (80 if woman is visible, 0 otherwise),
  "features": ["list", "of", "visible", "features"],
  "finishProcessed": boolean (true if good quality)
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