const sharp = require('sharp');
const multipart = require('lambda-multipart-parser');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Parse multipart form data
    const result = await multipart.parse(event);
    
    if (!result.files || !result.files.length) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'No image file provided' })
      };
    }

    const file = result.files[0];
    const fileBuffer = Buffer.from(file.content, 'base64');
    
    // Get resize options from form fields
    const width = parseInt(result.width || '1280');
    const height = parseInt(result.height || '720');
    const quality = parseInt(result.quality || '90');
    const format = result.format || 'jpeg';
    const maxSizeKB = parseInt(result.maxSizeKB || '2048');

    // Get original image metadata
    const originalMetadata = await sharp(fileBuffer).metadata();
    const originalSizeKB = Math.round(fileBuffer.length / 1024);

    // Resize the image
    let resizedBuffer = await sharp(fileBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'centre'
      })
      .toFormat(format, { quality })
      .toBuffer();

    // If the file is still too large, reduce quality iteratively
    let currentQuality = quality;
    while (resizedBuffer.length > maxSizeKB * 1024 && currentQuality > 10) {
      currentQuality -= 10;
      resizedBuffer = await sharp(fileBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'centre'
        })
        .toFormat(format, { quality: currentQuality })
        .toBuffer();
    }

    const resizedSizeKB = Math.round(resizedBuffer.length / 1024);

    // Return the resized image
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': `image/${format}`,
        'Content-Disposition': `attachment; filename="thumbnail.${format}"`,
        'X-Original-Size': originalSizeKB.toString(),
        'X-Resized-Size': resizedSizeKB.toString(),
        'X-Original-Dimensions': `${originalMetadata.width}x${originalMetadata.height}`,
        'X-Resized-Dimensions': `${width}x${height}`
      },
      body: resizedBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to process image' })
    };
  }
};