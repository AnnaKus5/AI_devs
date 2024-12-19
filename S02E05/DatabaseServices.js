import { QdrantClient } from '@qdrant/js-client-rest';
import { OpenAIServices } from './OpenAIServices.js';
import { FileServices } from './FileServices.js';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';

export class DatabaseServices {
    constructor() {
        this.openai = new OpenAIServices()
        this.client = new QdrantClient({ host: "localhost", port: 6333 });
        this.fileServices = new FileServices()
    }

    async createCollection(collectionName) {
        const existsResponse = await this.client.collectionExists(collectionName);
        console.log(collectionName, existsResponse)
        if (!existsResponse.exists) {
            try {
                await this.client.createCollection(collectionName, {
                    vectors: { size: 1536, distance: "Cosine" },
                });
                console.log(collectionName, " was successful created")
            } catch (error) {
                console.log("Error during create collection ", error)
            }
        }
    }

    async createPoints(folder, name) {
        const filePath = `${folder}/${name}`
        const text = await this.fileServices.readFile(filePath)
        const embedding =  await this.openai.createEmbedding(text)
    
        const point = {
            id: uuidv4(), 
            vector: embedding,
            payload: {
                fileName: filePath, 
                content: text
            }
        }
        return point 
    }

    async upsertPoints(points, collectionName) {
        await this.client.upsert(collectionName, {
          points: points
        });
      }
    
    async updateCollection(folder, collectionName) {
        const fileNames = await this.fileServices.getFilesPaths(folder)
        const points = await Promise.all(fileNames.map(async name => this.createPoints(folder, name)))
        console.log(points)
        await this.upsertPoints(points, collectionName)
    }

    async findRevelantDocuments(query, collectionName) {

        const queryEmbedding = await this.openai.createEmbedding(query)
        try {
            const response = await this.client.search(collectionName, {
                vector: queryEmbedding,
                limit: 5,  
                with_payload: true, 
                with_vector: false 
            });
            
            // console.log('Search results:', response);
            return response;
        } catch (error) {
            console.error('Error searching in Qdrant:', error);
            throw error;
        }
    }

}



