import { PhotoProcessingService } from './photoProcessingService.js';
import { OpenAIService } from './openAIService.js';

export class PhotoAgent {
    constructor(apiKey) {
      this.photoService = new PhotoProcessingService(apiKey);
      this.openAIService = new OpenAIService();
      this.photos = new Map();
    }

  
    async start() {
      const initialResponse = await this.photoService.start();
      
      const processedResponse = await this.openAIService.analyzeResponse(initialResponse, null, 'initial');
      
      this.initializePhotos(processedResponse.images);

      //SOULD RETURN AN OBJECT WITH ALL PHOTOS AND THEIR RESULTS
      await this.processAllPhotos();
      const description = await this.generateFinalDescription();
      return this.photoService.submitDescription(description);
    }
  
    initializePhotos(photos) {
      console.log("Initializing photos:", photos);
      photos.forEach(photo => {
        this.photos.set(photo.filename, {
          filename: photo.filename,
          baseUrl: photo.baseUrl,
          url: photo.url,
          smallUrl: photo.smallUrl,
          status: 'NEW',
          actions: [],
          // need to update processed dynamically
          finishProcessed: photo.finishProcessed,
          processed: false,
          analysis: null,
          version: 0
        });
      });
    }
  
    async processAllPhotos() {
      for (const [filename, photo] of this.photos) {
        console.log("photo", photo)
        let version = 0;
        while (!photo.finishProcessed) {
          console.log(`Processing ${filename} (version ${version})`);

          const imageBuffer = await fetch(photo.smallUrl).then(res => res.arrayBuffer());
          const imageBase64 = Buffer.from(imageBuffer).toString('base64');

          const analysis = await this.openAIService.analyzeImage(imageBase64);
          console.log(`Analysis for ${filename}:`, analysis);
          photo.analysis = analysis;

          if (analysis.actions.length === 0) {
            // photo.finishProcessed = true;
            continue;
          }

          for (const action of analysis.actions) {
            console.log(`Applying ${action} to ${filename}`);
            const result = await this.photoService.processImage(action, photo.filename);
            
            version++;
            
            console.log("photo.baseUrl", photo.baseUrl)
            const processedResult = await this.openAIService.analyzeResponse(result, photo.baseUrl, 'processing');
            
            //IMPORTANT: ANALYZEIMAGE DOESN'T RETURN VALID OBJECT - not true
            // processedResult doesn't contain images array so if doesn't work 
            // after process image we have analyzeResonse, whitch should return vaild obj
            
            if (processedResult.images && processedResult.images.length > 0) {
              console.log("#########processedResult", processedResult)
              photo.filename = processedResult.images[0].filename;
              photo.url = processedResult.images[0].url;
              photo.smallUrl = processedResult.images[0].smallUrl;
              photo.version = version;
              photo.finishProcessed = processedResult.finishProcessed;
              
              console.log(`Updated ${filename} to version ${version}`);
              console.log(`New URLs:`, {
                url: photo.url,
                smallUrl: photo.smallUrl
              });
            } else {
              console.warn(`No new image URLs found in response for ${filename}`);
            }

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