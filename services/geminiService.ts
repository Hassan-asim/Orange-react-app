import { GoogleGenAI } from "@google/genai";
import { LanguageDetails } from '../types';

if (!process.env.API_KEY) {
  }

const ai = new GoogleGenAI({ apiKey: "AIzaSyArhNl6vQ8ePYqhVjjNCJCWzloKXMyRjMg" });

export const translateText = async (
  text: string,
  targetLanguageDetails: LanguageDetails
): Promise<string> => {
  try {
    const prompt = `Translate the following text to ${targetLanguageDetails.name}. Only return the translated text, nothing else, no quotes:\n\n"${text}"`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    const translatedText = response.text.trim();
    // Simple cleanup to remove potential quotation marks from the model's response
    return translatedText.replace(/^"|"$/g, '');

  } catch (error) {
    console.error('Error translating text:', error);
    throw new Error('Failed to translate message.');
  }
};
