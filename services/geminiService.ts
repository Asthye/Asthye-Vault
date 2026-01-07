import { GoogleGenAI, Type } from "@google/genai";

export const suggestMetadata = async (description: string, existingCategories: string[]) => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found in process.env");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Given this user description of a 3D model/mod: "${description}", 
                suggest a concise title, pick the best category from this list: [${existingCategories.join(', ')}],
                and suggest 3-5 relevant thematic tags (e.g., Sci-fi, Fantasy, Modern, Military, Realistic, Cyberpunk, Stylized). 
                If no category matches perfectly, suggest a new single-word category name.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy title for the asset" },
            category: { type: Type.STRING, description: "The most relevant category name" },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3-5 relevant thematic tags" 
            },
            reasoning: { type: Type.STRING, description: "Why this category and tags were chosen" }
          },
          required: ["title", "category", "tags"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini metadata suggestion failed:", error);
    return null;
  }
};