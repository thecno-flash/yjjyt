
import { GoogleGenAI, Modality } from "@google/genai";

const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [mimePart, dataPart] = result.split(';base64,');
      if (!mimePart || !dataPart) {
          reject(new Error("Invalid data URL format"));
          return;
      }
      const mimeType = mimePart.split(':')[1];
      if (!mimeType) {
          reject(new Error("Could not extract MIME type"));
          return;
      }
      resolve({ mimeType, data: dataPart });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const removeBackground = async (file: File): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const { mimeType, data: base64ImageData } = await fileToBase64(file);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType: mimeType,
                    },
                },
                {
                    text: 'أزل الخلفية واجعلها شفافة. أخرج الصورة فقط.',
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const resultMimeType = part.inlineData.mimeType;
            const resultBase64Data = part.inlineData.data;
            return `data:${resultMimeType};base64,${resultBase64Data}`;
        }
    }

    throw new Error("No image was returned from the API.");
};