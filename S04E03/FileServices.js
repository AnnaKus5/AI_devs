import fs from 'fs/promises';

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

    async readFile(filePath) {
        const path = filePath.replace(/\//g, '-')
        try {
            const content = await fs.readFile(path, 'utf8');
            return content;
        } catch (error) {
            console.error('Error reading file:', error);
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

    async checkFileExists(filePath) {
        const path = filePath.replace(/\//g, '-')
        try {
            await fs.access(path);
            return true;
        } catch (err) {
            return false;
        }
    }
}