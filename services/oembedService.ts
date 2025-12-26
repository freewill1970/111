
export interface VideoMetadata {
  title: string;
  author_name: string;
  thumbnail_url?: string;
}

export async function fetchVideoMetadata(url: string): Promise<VideoMetadata | null> {
  try {
    // 1. Normalize URL for noembed (handle m.youtube and youtu.be)
    let cleanUrl = url;
    if (url.includes('m.youtube.com')) {
        cleanUrl = url.replace('m.youtube.com', 'www.youtube.com');
    }
    
    // 2. Fetch from noembed
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