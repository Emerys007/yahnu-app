
"use client"

export default function myImageLoader({ src, width, quality }) {
  if (process.env.NODE_ENV === "development") {
    return src;
  }

  // Ensure width is properly handled
  const targetWidth = width || 1920;
  const targetQuality = quality || 75;

  const operations = [
    {
      operation: "input",
      type: "url",
      url: src,
    },
    { 
      operation: "resize", 
      width: targetWidth 
    },
    { 
      operation: "output", 
      format: "webp", 
      quality: targetQuality 
    },
  ];

  const encodedOperations = encodeURIComponent(JSON.stringify(operations));

  return `/_fah/image/process?operations=${encodedOperations}`;
}
