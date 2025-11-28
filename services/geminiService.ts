import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageModel, ImageResolution, VideoModel } from "../types";

// Helper to get client with fresh key (crucial for Veo/Pro which require user selected keys)
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

/**
 * Generates an image based on a text prompt.
 * Supports both Flash (Nano Banana) and Pro models.
 */
export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  model: ImageModel,
  resolution: ImageResolution = ImageResolution.Res1K
): Promise<{ data: string; mimeType: string }> => {
  const ai = getClient();
  
  try {
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    };

    // Only Pro model supports explicit imageSize
    if (model === ImageModel.Pro) {
      config.imageConfig.imageSize = resolution;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: config,
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png",
          };
        }
      }
    }

    throw new Error("No image data found in response.");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

/**
 * Edits an existing image based on a text prompt using Flash.
 */
export const editImage = async (
  base64Image: string,
  prompt: string,
  mimeType: string = "image/png"
): Promise<{ data: string; mimeType: string }> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png",
          };
        }
      }
    }

    throw new Error("No edited image returned.");
  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
};

/**
 * Generates a video from text using Veo.
 */
export const generateVideo = async (
  prompt: string,
  aspectRatio: AspectRatio
): Promise<{ data: string; mimeType: string }> => {
  const ai = getClient();
  
  // Veo strictly supports 16:9 or 9:16
  let validAspectRatio = "16:9";
  if (aspectRatio === AspectRatio.Tall) {
    validAspectRatio = "9:16";
  }

  try {
    let operation = await ai.models.generateVideos({
      model: VideoModel.VeoFast,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: validAspectRatio,
      } as any // cast to any to avoid strict type issues with SDK versions if slight mismatch
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed to return a URI.");

    // Fetch the actual video bytes
    const apiKey = process.env.API_KEY;
    const videoResponse = await fetch(`${videoUri}&key=${apiKey}`);
    const arrayBuffer = await videoResponse.arrayBuffer();
    
    // Convert to Base64
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);

    return {
      data: base64Data,
      mimeType: "video/mp4"
    };

  } catch (error) {
    console.error("Veo Generation Error:", error);
    throw error;
  }
};

/**
 * Animates an image (Image-to-Video) using Veo.
 */
export const animateImage = async (
  base64Image: string,
  prompt: string,
  aspectRatio: AspectRatio,
  mimeType: string = "image/png"
): Promise<{ data: string; mimeType: string }> => {
  const ai = getClient();

  // Veo strictly supports 16:9 or 9:16
  let validAspectRatio = "16:9";
  if (aspectRatio === AspectRatio.Tall) {
    validAspectRatio = "9:16";
  }

  try {
    let operation = await ai.models.generateVideos({
      model: VideoModel.VeoFast,
      prompt: prompt || "Animate this image", // Prompt is technically optional for some flows but good to have
      image: {
        imageBytes: base64Image,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: validAspectRatio,
      } as any
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video animation failed.");

    const apiKey = process.env.API_KEY;
    const videoResponse = await fetch(`${videoUri}&key=${apiKey}`);
    const arrayBuffer = await videoResponse.arrayBuffer();
    
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);

    return {
      data: base64Data,
      mimeType: "video/mp4"
    };
  } catch (error) {
    console.error("Veo Animation Error:", error);
    throw error;
  }
};
