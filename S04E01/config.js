import dotenv from 'dotenv';
dotenv.config();

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  secretEndpoint: process.env.SECRET_ENDPOINT_REPORT,
  userApiKey: process.env.USER_API_KEY
};

