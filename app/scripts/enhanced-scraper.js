import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class EnhancedWebScraper {
  constructor(options = {}) {
    this.options = {
      headless: options.headless ?? true,
      timeout: options.timeout ?? 60000,
      retryAttempts: options.retryAttempts ?? 3,
      delayBetweenRequests: options.delayBetweenRequests ?? 1000,
      outputDir: options.outputDir ?? path.join(__dirname, 'scraped-data'),
      userAgent: options.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options
    };

    this.browser = null;
    this.page = null;
    this.scrapedData = [];
    
    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  async initialize() {
    console.log('🚀 Initializing Enhanced Web Scraper...');
    
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent(this.options.userAgent);
    
    // Block unnecessary resources to speed up scraping
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log('✅ Scraper initialized successfully');
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async retryOperation(operation, maxRetries = this.options.retryAttempts) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
        if (attempt === maxRetries) {
          throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`);
        }
        await this.delay(this.options.delayBetweenRequests * attempt);
      }
    }
  }

  async navigateToPage(url) {
    return await this.retryOperation(async () => {
      console.log(`🌐 Navigating to: ${url}`);
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.options.timeout
      });
      
      // Wait for page to be fully loaded
      await this.delay(2000);
    });
  }

  async autoDetectProducts() {
    return await this.page.evaluate(() => {
      const products = [];
      
      // Multiple strategies to find products
      const strategies = [
        // Strategy 1: Look for common product selectors
        () => document.querySelectorAll('.product, .product-item, .product-card, .card, [data-product]'),
        
        // Strategy 2: Look for price elements and find their containers
        () => {
          const priceElements = Array.from(document.querySelectorAll('*')).filter(el => 
            /\$|₹|€|£|Rs\.?\s*\d+/.test(el.textContent) && 
            el.children.length === 0 // Leaf nodes only
          );
          
          return priceElements.map(el => {
            // Find the nearest container with an image
            let container = el.parentElement;
            for (let i = 0; i < 5 && container; i++) {
              if (container.querySelector('img')) {
                return container;
              }
              container = container.parentElement;
            }
            return el.parentElement;
          }).filter(Boolean);
        },
        
        // Strategy 3: Look for elements with both image and text
        () => {
          return Array.from(document.querySelectorAll('div, article, section')).filter(el => 
            el.querySelector('img') && 
            el.textContent.trim().length > 10 &&
            /\$|₹|€|£|Rs\.?\s*\d+/.test(el.textContent)
          );
        }
      ];

      let productElements = [];
      
      // Try each strategy until we find products
      for (const strategy of strategies) {
        try {
          productElements = Array.from(strategy());
          if (productElements.length > 0) {
            console.log(`Found ${productElements.length} products using detection strategy`);
            break;
          }
        } catch (e) {
          console.warn('Strategy failed:', e.message);
        }
      }

      // Extract data from found elements
      for (const element of productElements) {
        try {
          const product = this.extractProductData(element);
          if (product && product.title && (product.price || product.currentPrice)) {
            products.push(product);
          }
        } catch (e) {
          console.warn('Failed to extract product data:', e.message);
        }
      }

      return products;
    });
  }

  async extractProductData(element) {
    return await this.page.evaluate((el) => {
      // Title extraction
      const titleSelectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        '.title', '.name', '.product-title', '.product-name',
        '[data-title]', '.heading'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        const titleEl = el.querySelector(selector);
        if (titleEl && titleEl.textContent.trim()) {
          title = titleEl.textContent.trim();
          break;
        }
      }

      // If no title found with selectors, look for meaningful text
      if (!title) {
        const textNodes = Array.from(el.querySelectorAll('*')).filter(node => 
          node.children.length === 0 && 
          node.textContent.trim().length > 5 &&
          node.textContent.trim().length < 100 &&
          !/^\d+$/.test(node.textContent.trim()) &&
          !node.textContent.includes('Rs') &&
          !node.textContent.includes('$')
        );
        
        if (textNodes.length > 0) {
          title = textNodes[0].textContent.trim();
        }
      }

      // Price extraction
      const priceRegex = /(?:Rs\.?\s*|₹\s*|\$\s*|€\s*|£\s*)(\d+(?:,\d+)*(?:\.\d+)?)/g;
      const priceText = el.textContent;
      const priceMatches = Array.from(priceText.matchAll(priceRegex));
      
      let currentPrice = '';
      let originalPrice = '';
      
      if (priceMatches.length > 0) {
        currentPrice = priceMatches[priceMatches.length - 1][0]; // Last price is usually current
        if (priceMatches.length > 1) {
          originalPrice = priceMatches[0][0]; // First price is usually original
        }
      }

      // Image extraction
      let imageUrl = '';
      const img = el.querySelector('img');
      if (img) {
        imageUrl = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
        // Convert relative URLs to absolute
        if (imageUrl && imageUrl.startsWith('/')) {
          imageUrl = window.location.origin + imageUrl;
        }
      }

      // Link extraction
      let productUrl = '';
      const link = el.querySelector('a');
      if (link) {
        productUrl = link.href || '';
        // Convert relative URLs to absolute
        if (productUrl && productUrl.startsWith('/')) {
          productUrl = window.location.origin + productUrl;
        }
      }

      // Description extraction
      let description = '';
      const descSelectors = ['.description', '.desc', '.summary', '.excerpt', 'p'];
      for (const selector of descSelectors) {
        const descEl = el.querySelector(selector);
        if (descEl && descEl.textContent.trim().length > 10) {
          description = descEl.textContent.trim().substring(0, 200);
          break;
        }
      }

      // Category extraction (try to infer from page structure or text)
      let category = '';
      const breadcrumbs = document.querySelector('.breadcrumb, .breadcrumbs, nav[aria-label="breadcrumb"]');
      if (breadcrumbs) {
        const breadcrumbText = breadcrumbs.textContent.trim();
        const parts = breadcrumbText.split(/[>\/]/).map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length > 1) {
          category = parts[parts.length - 2]; // Second to last is usually the category
        }
      }

      return {
        title,
        currentPrice,
        originalPrice,
        price: currentPrice, // Alias for compatibility
        imageUrl,
        productUrl,
        description,
        category,
        scrapedAt: new Date().toISOString(),
        source: window.location.hostname
      };
    }, element);
  }

  async scrapeWebsite(url, options = {}) {
    try {
      if (!this.browser) {
        await this.initialize();
      }

      await this.navigateToPage(url);
      
      // Take screenshot for debugging
      const screenshotPath = path.join(this.options.outputDir, `screenshot-${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Screenshot saved: ${screenshotPath}`);

      // Auto-detect and extract products
      console.log('🔍 Auto-detecting products...');
      const products = await this.autoDetectProducts();
      
      console.log(`✅ Found ${products.length} products`);
      
      // Handle pagination if requested
      if (options.followPagination) {
        const paginatedProducts = await this.handlePagination(products);
        this.scrapedData.push(...paginatedProducts);
      } else {
        this.scrapedData.push(...products);
      }

      return products;

    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      throw error;
    }
  }

  async handlePagination(initialProducts) {
    const allProducts = [...initialProducts];
    let currentPage = 1;
    const maxPages = 10; // Safety limit

    while (currentPage < maxPages) {
      try {
        // Look for next page button
        const hasNextPage = await this.page.evaluate(() => {
          const nextSelectors = [
            'a[aria-label*="next" i]',
            'a[title*="next" i]',
            '.next', '.pagination-next',
            'a:contains("Next")', 'button:contains("Next")',
            '.page-numbers .next'
          ];

          for (const selector of nextSelectors) {
            const element = document.querySelector(selector);
            if (element && !element.disabled && !element.classList.contains('disabled')) {
              element.click();
              return true;
            }
          }
          return false;
        });

        if (!hasNextPage) {
          console.log('📄 No more pages found');
          break;
        }

        currentPage++;
        console.log(`📄 Moving to page ${currentPage}...`);
        
        // Wait for page to load
        await this.delay(3000);
        
        // Extract products from new page
        const newProducts = await this.autoDetectProducts();
        
        if (newProducts.length === 0) {
          console.log('📄 No products found on new page, stopping pagination');
          break;
        }

        allProducts.push(...newProducts);
        console.log(`✅ Found ${newProducts.length} more products (Total: ${allProducts.length})`);

      } catch (error) {
        console.warn(`⚠️ Pagination failed on page ${currentPage}:`, error.message);
        break;
      }
    }

    return allProducts;
  }

  async scrapeMultipleUrls(urls, options = {}) {
    const results = [];
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n🌐 Scraping ${i + 1}/${urls.length}: ${url}`);
      
      try {
        const products = await this.scrapeWebsite(url, options);
        results.push({
          url,
          products,
          success: true,
          scrapedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Failed to scrape ${url}:`, error.message);
        results.push({
          url,
          products: [],
          success: false,
          error: error.message,
          scrapedAt: new Date().toISOString()
        });
      }

      // Delay between requests to be respectful
      if (i < urls.length - 1) {
        await this.delay(this.options.delayBetweenRequests);
      }
    }

    return results;
  }

  async saveData(filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `scraped-data-${timestamp}.json`;
    const filePath = path.join(this.options.outputDir, filename || defaultFilename);

    const dataToSave = {
      metadata: {
        scrapedAt: new Date().toISOString(),
        totalProducts: this.scrapedData.length,
        scraper: 'Enhanced Web Scraper v2.0'
      },
      products: this.scrapedData
    };

    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    console.log(`💾 Data saved to: ${filePath}`);
    
    return filePath;
  }

  async generateReport() {
    const report = {
      totalProducts: this.scrapedData.length,
      categories: {},
      priceRange: { min: Infinity, max: 0 },
      sources: {},
    };

    this.scrapedData.forEach(product => {
      // Count categories
      if (product.category) {
        report.categories[product.category] = (report.categories[product.category] || 0) + 1;
      }

      // Track price range (extract numeric value)
      if (product.currentPrice || product.price) {
        const priceStr = product.currentPrice || product.price;
        const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        if (!isNaN(numericPrice)) {
          report.priceRange.min = Math.min(report.priceRange.min, numericPrice);
          report.priceRange.max = Math.max(report.priceRange.max, numericPrice);
        }
      }

      // Count sources
      if (product.source) {
        report.sources[product.source] = (report.sources[product.source] || 0) + 1;
      }
    });

    // Fix infinite min price
    if (report.priceRange.min === Infinity) {
      report.priceRange.min = 0;
    }

    const reportPath = path.join(this.options.outputDir, `scraping-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 SCRAPING REPORT:');
    console.log(`Total Products: ${report.totalProducts}`);
    console.log(`Categories:`, Object.keys(report.categories).length);
    console.log(`Price Range: $${report.priceRange.min} - $${report.priceRange.max}`);
    console.log(`Sources:`, Object.keys(report.sources));
    console.log(`Report saved to: ${reportPath}`);

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser cleanup completed');
    }
  }
}

// Example usage and CLI interface
async function main() {
  const scraper = new EnhancedWebScraper({
    headless: false, // Set to true in production
    timeout: 60000,
    retryAttempts: 3,
    delayBetweenRequests: 2000
  });

  try {
    // Example URLs to scrape
    const urlsToScrape = [
      'https://nityamoils.com/categories',
      // Add more URLs here
    ];

    console.log('🚀 Starting enhanced web scraping...');
    
    const results = await scraper.scrapeMultipleUrls(urlsToScrape, {
      followPagination: true
    });

    // Save all data
    await scraper.saveData();
    
    // Generate report
    await scraper.generateReport();

    console.log('✅ Scraping completed successfully!');

  } catch (error) {
    console.error('❌ Scraping failed:', error);
  } finally {
    await scraper.cleanup();
  }
}

// Export for use as module
export { EnhancedWebScraper };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}