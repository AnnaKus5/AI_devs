import { createReadStream } from 'fs';
import fs from 'fs/promises';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

export class AudioServices {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    async splitAudio(audioFilePath) {
        try {
            // Get file size in MB
            const stats = await fs.stat(audioFilePath);
            const fileSizeInMB = stats.size / (1024 * 1024);
            
            if (fileSizeInMB <= 25) {
                return [audioFilePath];
            }

            // Create output directory for chunks if it doesn't exist
            const chunksDir = `${__dirname}/../../chunks`;
            await fs.mkdir(chunksDir, { recursive: true });

            // Calculate chunk duration (9 minutes with 30 seconds overlap)
            const chunkDuration = '540'; // 9 minutes in seconds
            const overlap = '30'; // 30 seconds overlap
            
            return new Promise((resolve, reject) => {
                const chunks = [];
                let startTime = 0;

                // Get total duration first
                ffmpeg.ffprobe(audioFilePath, (err, metadata) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const totalDuration = metadata.format.duration;
                    const processChunk = () => {
                        if (startTime >= totalDuration) {
                            resolve(chunks);
                            return;
                        }

                        const outputPath = `${chunksDir}/chunk-${startTime}.mp3`;
                        chunks.push(outputPath);

                        ffmpeg(audioFilePath)
                            .setStartTime(startTime)
                            .setDuration(chunkDuration)
                            .audioFilters([
                                // Detect silence at the end of the chunk
                                'silencedetect=noise=-30dB:d=0.5',
                                // Fade out at the end of each chunk
                                `afade=t=out:st=${chunkDuration-5}:d=5`
                            ])
                            .output(outputPath)
                            .on('end', () => {
                                // Subtract overlap from next start time to create overlapping chunks
                                startTime += parseInt(chunkDuration) - parseInt(overlap);
                                processChunk();
                            })
                            .on('error', reject)
                            .run();
                    };

                    processChunk();
                });
            });
        } catch (error) {
            console.error("Error splitting audio file:", error);
            throw error;
        }
    }
    
    async transcribeAudio(audioFilePath, language) {
        try {
            const chunks = await this.splitAudio(audioFilePath);
            let fullTranscription = '';
            
            // Process each chunk
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const fileStream = createReadStream(chunk);
                
                const transcription = await this.openai.audio.transcriptions.create({
                    file: fileStream,
                    model: "whisper-1",
                    language: language
                });
                
                // Remove potential duplicate phrases from overlap
                if (i > 0) {
                    const overlap = this.findOverlappingText(fullTranscription, transcription.text);
                    fullTranscription += transcription.text.slice(overlap);
                } else {
                    fullTranscription += transcription.text;
                }
                
                // Clean up chunk file
                await fs.unlink(chunk);
            }

            const newPath = `./output/${audioFilePath.split(".")[0]}-transcription.txt`;
            await fs.writeFile(newPath, fullTranscription, 'utf-8');
            console.log("Transcription saved to: ", newPath);
            
            return fullTranscription;
        } catch (error) {
            console.error("Error during transcription: ", error);
            throw error;
        }
    }

    // Helper method to find overlapping text between chunks
    findOverlappingText(previous, current) {
        // Convert to lowercase for better matching
        previous = previous.toLowerCase();
        current = current.toLowerCase();
        
        // Get last few words from previous chunk
        const lastWords = previous.split(/\s+/).slice(-20).join(' ');
        
        // Find the longest matching sequence
        let maxOverlap = 0;
        for (let i = 0; i < lastWords.length; i++) {
            const sequence = lastWords.slice(i);
            if (current.startsWith(sequence)) {
                maxOverlap = sequence.length;
            }
        }
        
        return maxOverlap;
    }
}

//process video format to audio
