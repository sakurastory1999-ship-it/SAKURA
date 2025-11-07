
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { SEOContent, YouTubeVideo, YouTubeSearchResponse } from './types';

// --- HELPER & UI COMPONENTS (Defined outside App to prevent re-creation on re-renders) ---

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = "h-8 w-8" }) => (
  <svg className={className} viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M27.3528 3.11421C27.0294 1.88591 26.0423 0.913079 24.7928 0.59508C22.6185 0 14 0 14 0C14 0 5.38152 0 3.20721 0.59508C1.95774 0.913079 0.970634 1.88591 0.647181 3.11421C0 5.33439 0 10 0 10C0 10 0 14.6656 0.647181 16.8858C0.970634 18.1141 1.95774 19.0869 3.20721 19.4049C5.38152 20 14 20 14 20C14 20 22.6185 20 24.7928 19.4049C26.0423 19.0869 27.0294 18.1141 27.3528 16.8858C28 14.6656 28 10 28 10C28 10 28 5.33439 27.3528 3.11421Z" fill="#FF0000"/>
    <path d="M11.2 14.2857L18.4 10L11.2 5.71429V14.2857Z" fill="white"/>
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const ClipboardIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25h-1.5a2.25 2.25 0 0 1-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
);

const Loader: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-gray-800/50 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
        <p className="text-lg text-purple-300 font-medium">Generating SEO Magic...</p>
        <p className="text-sm text-gray-400">Analyzing top videos & crafting content.</p>
    </div>
);

interface ApiKeyModalProps {
    onSave: (key: string) => void;
    onClose: () => void;
}
const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, onClose }) => {
    const [key, setKey] = useState('');

    const handleSave = () => {
        if (key.trim()) {
            onSave(key.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-center text-white">Enter YouTube Data API Key</h2>
                <p className="text-gray-400 mb-6 text-center text-sm">
                    You need a YouTube Data API v3 key to fetch video data. This key will be saved securely in your browser's local storage.
                </p>
                <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Paste your API key here"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                />
                <div className="flex justify-end mt-6 space-x-4">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg text-white hover:bg-gray-700 transition">Cancel</button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!key.trim()}
                    >
                        Save & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

interface SEOOutputDisplayProps {
    content: SEOContent;
    originalTitle: string;
}

const SEOOutputDisplay: React.FC<SEOOutputDisplayProps> = ({ content, originalTitle }) => {
    const [copied, setCopied] = useState(false);
    
    const fullText = useMemo(() => {
        return `
🎬 Title:
${originalTitle}

📝 Description:
${content.description}

📖 Story Summary:
${content.summary}

#️⃣ Hashtags:
${content.hashtags}

🏷️ Tags:
${content.tags.join(', ')}

🔑 Keywords:
${content.keywords.join(', ')}
        `.trim();
    }, [content, originalTitle]);

    const handleCopy = () => {
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const OutputSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-2">{title}</h3>
            <div className="bg-gray-900 p-4 rounded-lg text-gray-300 whitespace-pre-wrap text-sm">{children}</div>
        </div>
    );

    return (
        <div id="outputBox" className="w-full bg-gray-800 p-6 rounded-lg border border-gray-700 mt-8 relative">
            <button
                onClick={handleCopy}
                className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition flex items-center gap-2"
            >
                <ClipboardIcon className="h-5 w-5" />
                {copied ? 'Copied!' : 'Copy All'}
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Generated SEO Content</h2>
            <OutputSection title="🎬 Title">{originalTitle}</OutputSection>
            <OutputSection title="📝 Description">{content.description}</OutputSection>
            <OutputSection title="📖 Story Summary">{content.summary}</OutputSection>
            <OutputSection title="#️⃣ Hashtags">{content.hashtags}</OutputSection>
            <OutputSection title="🏷️ Tags">{content.tags.join(', ')}</OutputSection>
            <OutputSection title="🔑 Keywords">{content.keywords.join(', ')}</OutputSection>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

export default function App() {
    const [youtubeApiKey, setYoutubeApiKey] = useState<string | null>(null);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [seoContent, setSeoContent] = useState<SEOContent | null>(null);

    const geminiAI = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    useEffect(() => {
        const storedKey = localStorage.getItem('YT_API_KEY');
        if (storedKey) {
            setYoutubeApiKey(storedKey);
        } else {
            setShowApiKeyModal(true);
        }
    }, []);

    const handleApiKeySave = (key: string) => {
        localStorage.setItem('YT_API_KEY', key);
        setYoutubeApiKey(key);
        setShowApiKeyModal(false);
    };

    const handleChangeApiKey = () => {
        localStorage.removeItem('YT_API_KEY');
        setYoutubeApiKey(null);
        setSeoContent(null);
        setError(null);
        setShowApiKeyModal(true);
    };

    const detectLanguage = useCallback(async (text: string): Promise<string> => {
        const prompt = `Detect the language of this text: "${text}". Respond with only the two-letter ISO 639-1 language code (e.g., 'en' for English, 'bn' for Bengali). If you are unsure, default to 'en'.`;
        const response = await geminiAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return response.text.trim().toLowerCase();
    }, [geminiAI]);

    const fetchTopVideos = useCallback(async (query: string, lang: string, apiKey: string): Promise<string> => {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodedQuery}&relevanceLanguage=${lang}&maxResults=10&key=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`YouTube API Error: ${errorData.error.message || 'Failed to fetch videos'}`);
        }
        const data: YouTubeSearchResponse = await response.json();
        
        return data.items.map(item => `Title: ${item.snippet.title}\nDescription: ${item.snippet.description}`).join('\n\n---\n\n');
    }, []);

    const generateSeo = useCallback(async (userTitle: string, lang: string, context: string): Promise<SEOContent> => {
        const prompt = `
            You are an expert YouTube SEO specialist fluent in multiple languages.
            The user wants to create SEO content for their video with the title: "${userTitle}".
            The language of the video is ${lang}. All your output MUST be in this language.

            Here is data from top-ranking videos with similar titles for inspiration:
            ---
            ${context}
            ---

            Based on the user's title and the inspiration from top videos, generate the following SEO content.

            Your response MUST be a single, valid JSON object with these exact keys and value types:
            - "description": (string) A highly optimized, engaging, and keyword-rich description of about 200-300 words. Start with a strong hook.
            - "summary": (string) A very short, one or two-sentence story summary of what the video is about.
            - "hashtags": (string) A string of 10-15 relevant hashtags, starting with '#', separated by spaces.
            - "tags": (string[]) An array of 20-30 single or multi-word SEO tags (without '#').
            - "keywords": (string[]) An array of 15-20 single or multi-word keywords for search optimization.

            Do not include any text, markdown formatting, or explanations outside the JSON object.
        `;
        
        const response = await geminiAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        try {
            // Gemini with responseMimeType: 'application/json' should return a parsable string
            const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedJson = JSON.parse(cleanedText);
            return parsedJson;
        } catch (e) {
            console.error("Failed to parse Gemini JSON response:", response.text);
            throw new Error("AI failed to generate valid content. Please try again.");
        }
    }, [geminiAI]);


    const handleGenerate = async () => {
        if (!title.trim() || !youtubeApiKey) return;
        
        setIsLoading(true);
        setError(null);
        setSeoContent(null);

        try {
            const lang = await detectLanguage(title);
            const videoContext = await fetchTopVideos(title, lang, youtubeApiKey);
            const content = await generateSeo(title, lang, videoContext);
            setSeoContent(content);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
            {showApiKeyModal && !youtubeApiKey && (
                <ApiKeyModal 
                    onSave={handleApiKeySave} 
                    onClose={() => { if(youtubeApiKey) setShowApiKeyModal(false) }} 
                />
            )}
            
            <div className="w-full max-w-4xl mx-auto">
                <header className="text-center mb-8">
                     <div className="flex items-center justify-center gap-4 mb-2">
                        <YouTubeIcon className="h-12 w-12" />
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                            YouTube AI SEO Generator
                        </h1>
                    </div>
                    <p className="text-gray-400">by NUR ISLAM MASUD</p>
                </header>

                <main>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter your YouTube video title here..."
                                className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={!title.trim() || isLoading}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <SparklesIcon />
                                {isLoading ? 'Generating...' : 'Generate SEO'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 text-right">
                        <button onClick={handleChangeApiKey} className="text-sm text-gray-400 hover:text-purple-400 transition">
                            Change API Key
                        </button>
                    </div>

                    <div className="mt-8">
                        {isLoading && <Loader />}
                        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">{error}</div>}
                        {seoContent && <SEOOutputDisplay content={seoContent} originalTitle={title} />}
                    </div>
                </main>

                 <footer className="text-center mt-12 text-gray-500 text-sm">
                    <p>Powered by Gemini & YouTube Data API. Designed for content creators.</p>
                </footer>
            </div>
        </div>
    );
}
