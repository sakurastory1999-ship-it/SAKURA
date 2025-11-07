
export interface SEOContent {
  description: string;
  summary: string;
  hashtags: string;
  tags: string[];
  keywords: string[];
}

export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
  };
}

export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
}
