'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";

interface ScrapedData {
  products?: Array<{
    title: string;
    price?: string;
    currentPrice?: string;
    imageUrl?: string;
    productUrl?: string;
    description?: string;
  }>;
  websiteType?: string;
  totalPages?: number;
  pages?: any[];
  siteStructure?: {
    allLinks?: string[];
    navigation?: any[];
    footerLinks?: any[];
  };
  designSystem?: {
    colorPalette?: string[];
    fonts?: string[];
    extractedCSS?: string[];
  };
}
interface GeneratedSite {
  id: string;
  url: string;
  name: string;
}

export default function Page() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState('');
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [generatedSite, setGeneratedSite] = useState<GeneratedSite | null>(null);
  const [recentClones, setRecentClones] = useState<any[]>([]);

  // Load recent clones from index.json
  useEffect(() => {
    async function fetchClones() {
      try {
        const res = await fetch('/clones/index.json');
        if (!res.ok) return;
        const data = await res.json();
        setRecentClones(Array.isArray(data) ? data.reverse() : []);
      } catch (e) {
        setRecentClones([]);
      }
    }
    fetchClones();
  }, []);

  const handleScrape = async () => {
    if (!url) return;
    
    setIsLoading(true);
    setScrapingStatus('🚀 Starting website analysis...');
    
    try {
      // Start scraping
      setScrapingStatus('🔍 Analyzing website structure...');
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) throw new Error('Scraping failed');
      
      const data = await response.json();
      setScrapedData(data);
      
      setScrapingStatus('🎨 Generating website clone...');
      
      // Generate clone
      const cloneResponse = await fetch('/api/generate-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scrapedData: data, originalUrl: url })
      });
      
      if (!cloneResponse.ok) throw new Error('Clone generation failed');
      
      const cloneData = await cloneResponse.json();
      setGeneratedSite(cloneData);
      
      setScrapingStatus('✅ Website clone generated successfully!');
      
    } catch (error) {
      setScrapingStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Scraping error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🏗️ Complete Website Replicator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced reverse engineering tool that creates pixel-perfect replicas of entire websites. 
            We crawl all pages, extract complete CSS, analyze design systems, and generate a fully functional local clone!
          </p>
          <div className="mt-6 flex justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Multi-page crawling
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Complete CSS extraction
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Internal link mapping
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              disabled={isLoading}
            />
            <button
              onClick={handleScrape}
              disabled={isLoading || !url}
              className={`px-8 py-3 rounded-lg font-semibold text-white text-lg transition-all ${
                isLoading || !url
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Scraping...
                </div>
              ) : (
                '🔥 Clone Website'
              )}
            </button>
          </div>

          {/* Status */}
          {scrapingStatus && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-lg font-medium text-gray-700">{scrapingStatus}</p>
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {['Discover Links', 'Extract Design', 'Scrape All Pages', 'Generate Clone'].map((step, index) => {
              let status = 'pending';
              if (scrapingStatus.includes('Discovering') && index === 0) status = 'active';
              else if (scrapingStatus.includes('Extracting') && index === 1) status = 'active';
              else if (scrapingStatus.includes('Scraping') && index === 2) status = 'active';
              else if (scrapingStatus.includes('Generating') && index === 3) status = 'active';
              else if (scrapingStatus.includes('successfully') && index === 3) status = 'completed';
              else if (scrapingStatus.includes('Error')) status = 'error';
              
              return (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-2 ${
                    status === 'completed' ? 'bg-green-500' :
                    status === 'active' ? 'bg-blue-500 animate-pulse' :
                    status === 'error' ? 'bg-red-500' :
                    'bg-gray-300'
                  }`}>
                    {status === 'completed' ? '✓' : index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-600">{step}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {scrapedData && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Scraped Data Preview */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📊 Scraped Data
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Reverse Engineering Results</h3>
                  <p className="text-sm text-blue-600">
                    📄 {scrapedData.totalPages || scrapedData.pages?.length || 0} pages discovered
                  </p>
                  <p className="text-sm text-blue-600">
                    🔗 {scrapedData.siteStructure?.allLinks?.length || 0} internal links found
                  </p>
                  <p className="text-sm text-blue-600">
                    🎨 {scrapedData.designSystem?.colorPalette?.length || 0} colors extracted
                  </p>
                </div>
                
                {scrapedData.products?.slice(0, 3).map((item, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-gray-800">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.price || item.currentPrice}</p>
                  </div>
                ))}
                
                {(scrapedData.products?.length || 0) > 3 && (
                  <p className="text-sm text-gray-500 italic">
                    + {(scrapedData.products?.length || 0) - 3} more items...
                  </p>
                )}
              </div>
            </div>

            {/* Generated Clone Preview */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                🎨 Generated Clone
              </h2>
              {generatedSite ? (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">Clone Ready!</h3>
                    <p className="text-sm text-green-600">
                      Your website clone has been generated
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <a
                      href={`/clone/${generatedSite.id}`}
                      className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold text-center transition-colors"
                    >
                      🚀 View Clone
                    </a>
                    
                    <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg font-medium transition-colors">
                      ⚙️ Customize
                    </button>
                    
                    <button className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg font-medium transition-colors">
                      📥 Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Clone will appear here after scraping</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Clones */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📂 Recent Clones</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recentClones.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                <p>No clones yet</p>
                <p className="text-sm">Start by cloning your first website!</p>
              </div>
            ) : (
              recentClones.map((clone) => (
                <div key={clone.id} className="border border-gray-200 rounded-lg p-5 bg-gray-50 flex flex-col gap-2 shadow-sm">
                  <div className="font-semibold text-lg text-blue-700 truncate" title={clone.title || clone.originalUrl}>
                    {clone.title && clone.title !== 'Untitled Clone' ? clone.title : clone.originalUrl}
                  </div>
                  <div className="text-xs text-gray-500 truncate" title={clone.originalUrl}>
                    {clone.originalUrl}
                  </div>
                  <div className="text-xs text-gray-400">{new Date(clone.createdAt).toLocaleString()}</div>
                  <a
                    href={`/clones/${clone.id}/index.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded text-center font-medium transition-colors"
                  >
                    🚀 View Clone
                  </a>
                  <div className="text-xs text-gray-400 mt-1">{clone.productCount || 0} products • {clone.websiteType}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
