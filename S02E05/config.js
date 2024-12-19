import dotenv from 'dotenv';
dotenv.config();

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  reportEndpoint: process.env.SECRET_ENDPOINT_REPORT,
  taskEndpoint: process.env.SECRET_ENDPOINT_TASK,
  userApiKey: process.env.USER_API_KEY,
  qdrantApiKey: process.env.QDRANT_API_KEY,
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY
};

