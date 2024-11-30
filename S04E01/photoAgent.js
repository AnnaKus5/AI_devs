import { PhotoProcessingService } from './photoProcessingService.js';
import { OpenAIService } from './openAIService.js';

export class PhotoAgent {
    constructor(apiKey) {
      this.photoService = new PhotoProcessingService(apiKey);
      this.openAIService = new OpenAIService();
      this.photos = new Map();
    }
  
    async analyzeResponse(response) {
      const prompt = `Analyze this API response and extract relevant information about images and instructions.
Input response: "${JSON.stringify(response)}"

Please identify:
1. Base URL for images (if any)
2. List of image filenames
3. Available commands
4. Any special instructions

Respond in this JSON format:
{
  "_thinking": "explanation of your analysis",
  "baseUrl": "extracted base url or null",
  "images": ["list", "of", "image", "filenames"],
  "commands": ["available", "commands"],
  "instructions": "any special instructions",
  "isValid": boolean
}`;

      try {
        const analysis = await this.openAIService.completion({
          messages: [
            { role: "system", content: "You are a response analyzer specialized in extracting structured data from natural language API responses." },
            { role: "user", content: prompt }
          ]
        });

        const parsedAnalysis = JSON.parse(analysis.choices[0].message.content);
        
        if (!parsedAnalysis.isValid) {
          throw new Error("Could not extract valid image information from response");
        }

        // Transform the analyzed response into the expected format
        return {
          images: parsedAnalysis.images.map(filename => ({
            filename,
            url: `${parsedAnalysis.baseUrl}${filename}`,
            smallUrl: `${parsedAnalysis.baseUrl}${filename.replace('.PNG', '-small.PNG')}`
          }))
        };
      } catch (error) {
        console.error('Error analyzing response:', error);
        throw new Error('Failed to analyze API response');
      }
    }
  
    async start() {
      const initialResponse = await this.photoService.start();
      
      // Add the new analysis step
      const processedResponse = await this.analyzeResponse(initialResponse);
      
      // Continue with existing flow
      this.initializePhotos(processedResponse.images);
      await this.processAllPhotos();
      const description = await this.generateFinalDescription();
      return this.photoService.submitDescription(description);
    }
  
    initializePhotos(photos) {
      photos.forEach(photo => {
        this.photos.set(photo.filename, {
          filename: photo.filename,
          url: photo.url,
          status: 'NEW',
          actions: [],
          processed: false,
          analysis: null
        });
      });
    }
  
    async processAllPhotos() {
      for (const [filename, photo] of this.photos) {
        while (!photo.processed) {
          const analysis = await this.openAIService.analyzeImage(photo.url);
          photo.analysis = analysis;
  
          if (analysis.actions.length === 0) {
            photo.processed = true;
            continue;
          }
  
          for (const action of analysis.actions) {
            const result = await this.photoService.processImage(action, photo.filename);
            photo.url = result.url;
          }
        }
      }
    }
  
    async generateFinalDescription() {
      const barbaraPhotos = Array.from(this.photos.values())
        .filter(photo => photo.analysis.couldBeBarbara && photo.analysis.confidence > 70);
  
      if (barbaraPhotos.length === 0) {
        throw new Error('No confident matches for Barbara found');
      }
  
      return this.openAIService.generateDescription(barbaraPhotos);
    }
  }