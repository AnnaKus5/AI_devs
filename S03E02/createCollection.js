import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv'

const embeddingModel = "text-embedding-ada-002"
const FOLDER = "./weapons_tests/do-not-share"
const COLLECTION_NAME = "weapons_tests"

dotenv.config()

const client = new QdrantClient({ host: "localhost", port: 6333 });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })


const exists = await client.collectionExists(COLLECTION_NAME);
if (!exists) {
  await client.createCollection(COLLECTION_NAME, {
    vectors: { size: 1536, distance: "Cosine" },
  });
}

async function createEmbedding(text) {

    try {
        const embedding = await openai.embeddings.create({
          model: embeddingModel,
          input: text,
          encoding_format: "float",
        });
        return embedding.data[0].embedding
    } 
    catch (e) {
        console.error("Error during embedding", e)
    }
}

async function createPoints(fileName) {

    const filePath = path.join(FOLDER, fileName)
    const text = await fs.readFile(filePath, 'utf-8')
    const embedding =  await createEmbedding(text)

    const point = {
        id: uuidv4(), 
        vector: embedding,
        payload: {
            fileName: fileName, 
            content: text
        }
    }
    return point 
}

async function getFilesPaths(folder) {
    try {
        const files = await fs.readdir(folder);
        return files
    } catch (error) {
        console.error('Error during read directory:', error);
    }
}

async function upsertPoints(points) {
    await client.upsert(COLLECTION_NAME, {
      points: points
    });
  }

async function updateCollection() {
    const fileNames = await getFilesPaths(FOLDER)
    const points = await Promise.all(fileNames.map(async path => createPoints(path)))
    console.log(points)
    await upsertPoints(points)
}

// updateCollection()
    


