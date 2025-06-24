import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Download, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { YOUTUBE_THUMBNAIL_PRESETS, ThumbnailPreset, validateImageFile } from '../../utils/thumbnail-resizer';

interface ProcessedImage {
  url: string;
  originalSize: number;
  resizedSize: number;
  originalDimensions: string;
  resizedDimensions: string;
  filename: string;
}

export default function ThumbnailResizer() {
  const [selectedPreset, setSelectedPreset] = useState<ThumbnailPreset>(YOUTUBE_THUMBNAIL_PRESETS[0]);
  const [customWidth, setCustomWidth] = useState(1280);
  const [customHeight, setCustomHeight] = useState(720);
  const [quality, setQuality] = useState(90);
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    
    for (const file of acceptedFiles) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      setIsProcessing(true);
      
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('width', selectedPreset.name === 'Custom' ? customWidth.toString() : selectedPreset.width.toString());
        formData.append('height', selectedPreset.name === 'Custom' ? customHeight.toString() : selectedPreset.height.toString());
        formData.append('quality', quality.toString());
        formData.append('format', format);
        formData.append('maxSizeKB', '2048');

        const response = await fetch('/.netlify/functions/thumbnail-resize', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to process image');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const processedImage: ProcessedImage = {
          url,
          originalSize: parseInt(response.headers.get('X-Original-Size') || '0'),
          resizedSize: parseInt(response.headers.get('X-Resized-Size') || '0'),
          originalDimensions: response.headers.get('X-Original-Dimensions') || '',
          resizedDimensions: response.headers.get('X-Resized-Dimensions') || '',
          filename: `${file.name.split('.')[0]}_thumbnail.${format}`
        };

        setProcessedImages(prev => [...prev, processedImage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process image');
      } finally {
        setIsProcessing(false);
      }
    }
  }, [selectedPreset, customWidth, customHeight, quality, format]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: true
  });

  const downloadImage = (processedImage: ProcessedImage) => {
    const link = document.createElement('a');
    link.href = processedImage.url;
    link.download = processedImage.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearImages = () => {
    processedImages.forEach(img => URL.revokeObjectURL(img.url));
    setProcessedImages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            YouTube Thumbnail Resizer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Resize your images to the perfect YouTube thumbnail size (under 2MB)
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preset Size
                </label>
                <select
                  value={selectedPreset.name}
                  onChange={(e) => {
                    const preset = YOUTUBE_THUMBNAIL_PRESETS.find(p => p.name === e.target.value)!;
                    setSelectedPreset(preset);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  {YOUTUBE_THUMBNAIL_PRESETS.map(preset => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name} - {preset.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'jpeg' | 'png' | 'webp')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
            </div>

            {selectedPreset.name === 'Custom' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quality: {quality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {isDragActive
                ? 'Drop the images here...'
                : 'Drag & drop images here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Supports JPG, PNG, and WebP formats (max 50MB)
            </p>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {isProcessing && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-blue-600 dark:text-blue-400">Processing image...</p>
            </div>
          )}

          {processedImages.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Processed Images ({processedImages.length})
                </h2>
                <button
                  onClick={clearImages}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedImages.map((img, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="aspect-video relative bg-gray-100 dark:bg-gray-700">
                      <img
                        src={img.url}
                        alt={`Processed thumbnail ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {img.originalDimensions} → {img.resizedDimensions}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {img.originalSize}KB → {img.resizedSize}KB
                      </p>
                      <button
                        onClick={() => downloadImage(img)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}