
export interface VideoMetadata {
  title: string;
  author_name: string;
  thumbnail_url?: string;
}

export async function fetchVideoMetadata(url: string): Promise<VideoMetadata | null> {
  try {
    // specific logic for mobile youtube links to ensure oembed works
    const cleanUrl = url.replace('m.youtube.com', 'www.youtube.com');
    
    // Using noembed.com as a public CORS-friendly proxy for YouTube oEmbed
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`);
    const data = await response.json();
    
    if (data.error || !data.title) {
      return null;
    }

    return {
      title: data.title,
      author_name: data.author_name,
      thumbnail_url: data.thumbnail_url
    };
  } catch (error) {
    console.warn("Failed to fetch oEmbed metadata:", error);
    return null;
  }
}
