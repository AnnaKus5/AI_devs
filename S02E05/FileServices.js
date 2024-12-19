import fs from 'fs/promises';
import { readFileSync } from 'fs';

export class FileServices {
    constructor() {
    }

    async saveFile(content, filePath) {
        try {
            await fs.writeFile(filePath, content, 'utf-8');
        } catch (error) {
            console.error('Error saving file:', error);
        }
    }

    async readFile(path) {
        try {
            const content = await fs.readFile(path, 'utf8');
            return content;
        } catch (error) {
            console.error('Error reading file:', error);
        }
    }

    async getBase64(imagePath) {
        console.log(imagePath)
        try {
            const imageBuffer = readFileSync(imagePath)
            const imageBase64 = Buffer.from(imageBuffer).toString('base64');
            const extension = imagePath.split('.').pop().toLowerCase();
            let mimeType;
            switch (extension) {
                case 'png':
                    mimeType = 'image/png';
                    break;
                case 'jpg':
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    break;
                default:
                    mimeType = 'image/jpeg';
            }
            return `data:${mimeType};base64,${imageBase64}`;
        } catch (error) {
            console.error('Error reading image buffer:', error);
            throw error;
        }
    }

    async deleteFile(filePath) {
        const path = filePath.replace(/\//g, '-')
        try {
            await fs.unlink(path);
            console.log(`File deleted: ${filePath}`);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    async checkFileExists(path) {
        try {
            await fs.access(path);
            return true;
        } catch (err) {
            return false;
        }
    }

    async getFilesPaths(folder) {
        try {
            const files = await fs.readdir(folder);
            return files
        } catch (error) {
            console.error('Error during read directory:', error);
        }
    }
}