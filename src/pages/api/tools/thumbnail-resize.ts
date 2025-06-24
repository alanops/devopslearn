import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import { resizeThumbnail, getImageMetadata, ResizeOptions } from '../../../utils/thumbnail-resizer';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Read the uploaded file
    const fileBuffer = await fs.readFile(file.filepath);
    
    // Get resize options from form fields
    const width = parseInt(fields.width?.[0] || '1280');
    const height = parseInt(fields.height?.[0] || '720');
    const quality = parseInt(fields.quality?.[0] || '90');
    const format = (fields.format?.[0] || 'jpeg') as ResizeOptions['format'];
    const maxSizeKB = parseInt(fields.maxSizeKB?.[0] || '2048');

    // Get original image metadata
    const originalMetadata = await getImageMetadata(fileBuffer);

    // Resize the image
    const resizedBuffer = await resizeThumbnail(fileBuffer, {
      width,
      height,
      quality,
      format,
      maxSizeKB
    });

    // Get resized image metadata
    const resizedMetadata = await getImageMetadata(resizedBuffer);

    // Clean up temp file
    await fs.unlink(file.filepath);

    // Send the resized image back
    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Disposition', `attachment; filename="thumbnail.${format}"`);
    res.setHeader('X-Original-Size', originalMetadata.sizeKB.toString());
    res.setHeader('X-Resized-Size', resizedMetadata.sizeKB.toString());
    res.setHeader('X-Original-Dimensions', `${originalMetadata.width}x${originalMetadata.height}`);
    res.setHeader('X-Resized-Dimensions', `${resizedMetadata.width}x${resizedMetadata.height}`);
    
    res.send(resizedBuffer);
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
}