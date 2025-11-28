export enum AspectRatio {
  Square = "1:1",
  Portrait = "3:4",
  Landscape = "4:3",
  Wide = "16:9",
  Tall = "9:16",
  Wide219 = "21:9",
  Standard32 = "3:2",
  Standard23 = "2:3",
}

export enum AppMode {
  TextToImage = "text-to-image",
  ImageToImage = "image-to-image",
  TextToVideo = "text-to-video",
  ImageToVideo = "image-to-video",
}

export enum ImageModel {
  Flash = "gemini-2.5-flash-image",
  Pro = "gemini-3-pro-image-preview",
}

export enum VideoModel {
  VeoFast = "veo-3.1-fast-generate-preview",
}

export enum ImageResolution {
  Res1K = "1K",
  Res2K = "2K",
  Res4K = "4K",
}

export interface GeneratedContent {
  id: string;
  data: string; // Base64 string for images, or URI for videos
  mimeType: string;
  prompt: string;
  timestamp: number;
  isVideo?: boolean;
}
