import { config } from './config.js';
import OpenAI from 'openai';

//there should another prompts
// one to analyze response from endpoint: 
// -we have few image, we have one repair image or we have error - bad action was call

// one to analyze the image 

export class OpenAIService {
    constructor() {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    }

    async analyzeResponse(response, baseUrl = 'not provided', status) {

        const prompt = status === 'initial' ? this.getInitialResponsePrompt(response) : this.getProcessingResponsePrompt(response, baseUrl);
  
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
          
          if (!parsedAnalysis.isValid) {
            throw new Error("Could not extract valid image information from response");
          }
          console.log("parsedAnalysis", parsedAnalysis)
          // Transform the analyzed response into the expected format
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
                  text: this.getAnalysisPrompt()
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
    "instructions": "any special instructions",
    "isValid": boolean, 
    "finishProcessed": false
  }`
    }


    getProcessingResponsePrompt(response, baseUrl) {
        return `Analyze this API response from an image processing command.
    Input response: "${response}"
    
    Context: This is a response after applying REPAIR, DARKEN, or BRIGHTEN to an image.
    
    Please extract:
    1. Success status
    2. New image filename (if any)
    3. Base URL: "${baseUrl}"
    
    Response format as JSON:
    {
      "_thinking": "explanation of how you interpreted the processing result",
      "success": true/false,
      "images": ["list", "of", "image", "filenames"],
      "baseUrl": "${baseUrl}",
      "url": "complete URL to the processed image",
      "smallUrl": "URL to the small version of processed image",
      "isProcessingResponse": true,
      "isValid": boolean, 
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
  
    getAnalysisPrompt() {
      return `Analyze this image and determine:
  1. Image quality (good/bad)
  2. Required improvements (REPAIR/DARKEN/BRIGHTEN) if you couldn't recognize the image
  3. Is there a woman in the photo?
  4. Confidence level that this could be Barbara
  5. Key identifying features
  6. If you identify what is on photo, the processed action should be equal true
  
  Respond in JSON format:
  {
    "_thinking": "your reasoning about the image",
    "quality": "good/bad",
    "actions": ["REPAIR", "DARKEN", "BRIGHTEN"],
    "hasWoman": true/false,
    "couldBeBarbara": true/false,
    "confidence": 0-100,
    "features": []
    "finishProcessed": true/false (false if image needs to be processed to improve quality and readability)
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