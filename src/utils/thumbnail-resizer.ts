// import sharp from 'sharp'; // Only used server-side

export interface ResizeOptions {
  width: number;
  height: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxSizeKB?: number;
}

export interface ThumbnailPreset {
  name: string;
  width: number;
  height: number;
  description: string;
}

export const YOUTUBE_THUMBNAIL_PRESETS: ThumbnailPreset[] = [
  {
    name: 'HD (16:9)',
    width: 1280,
    height: 720,
    description: 'Recommended YouTube thumbnail size'
  },
  {
    name: 'SD (16:9)',
    width: 640,
    height: 360,
    description: 'Smaller thumbnail option'
  },
  {
    name: 'Custom',
    width: 0,
    height: 0,
    description: 'Custom dimensions'
  }
];

// Server-side function - moved to Netlify Function
export async function resizeThumbnail(
  inputBuffer: Buffer,
  options: ResizeOptions
): Promise<Buffer> {
  // This function is now handled by the Netlify Function
  throw new Error('This function should only be called server-side');
}

// Client-side image metadata function
export function getImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
  sizeKB: number;
  sizeMB: number;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        format: file.type.split('/')[1],
        size: file.size,
        sizeKB: Math.round(file.size / 1024),
        sizeMB: Math.round(file.size / 1024 / 1024 * 100) / 100
      });
    };
    img.src = URL.createObjectURL(file);
  });
}

export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSizeMB = 50;

  if (!allowedTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, or WebP)';
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File size must be less than ${maxSizeMB}MB`;
  }

  return null;
}

export function generateFileName(originalName: string, preset: ThumbnailPreset, format: string): string {
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const dimensions = preset.name === 'Custom' ? `${preset.width}x${preset.height}` : preset.name.replace(/\s+/g, '_');
  return `${nameWithoutExt}_${dimensions}.${format}`;
}