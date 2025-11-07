
import { GoogleGenAI, Type, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMeditationDetails = async (prompt: string): Promise<{ script: string; visualTheme: string; }> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the user's request, create a guided meditation script. The user's request is: "${prompt}". Also, extract a concise, descriptive visual theme for an accompanying image (e.g., "enchanted forest at twilight", "serene minimalist zen garden").`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        script: {
                            type: Type.STRING,
                            description: "The full guided meditation script, with pauses indicated like [pause].",
                        },
                        visualTheme: {
                            type: Type.STRING,
                            description: "A concise, descriptive visual theme for an accompanying image.",
                        },
                    },
                    required: ["script", "visualTheme"],
                },
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error generating meditation script:", error);
        throw new Error("Failed to generate meditation script. Please try again.");
    }
};

export const generateMeditationImage = async (theme: string): Promise<string> => {
    try {
        const fullPrompt = `Create a serene, calming, photorealistic, and meditative image of: ${theme}. High resolution, peaceful atmosphere.`;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });
        
        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error generating meditation image:", error);
        throw new Error("Failed to create the visual for your session.");
    }
};

export const generateMeditationAudio = async (script: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script.replace(/\[pause\]/g, '...') }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            return base64Audio;
        } else {
            throw new Error("No audio data received from API.");
        }
    } catch (error) {
        console.error("Error generating meditation audio:", error);
        throw new Error("Failed to synthesize the voice for your session.");
    }
};
