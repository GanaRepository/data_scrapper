// Universal scraper configurations for different website types
export const scraperConfigurations = {
  // E-commerce sites
  ecommerce: {
    name: 'E-commerce Generic',
    selectors: {
      productContainer: [
        '.product', '.product-item', '.product-card', '.card',
        '[data-product]', '.shop-item', '.listing-item'
      ],
      title: [
        'h1', 'h2', 'h3', '.title', '.name', '.product-title',
        '.product-name', '[data-title]', '.heading'
      ],
      price: [
        '.price', '.current-price', '.sale-price', '.discounted-price',
        '.amount', '.cost', '[data-price]'
      ],
      originalPrice: [
        '.original-price', '.regular-price', '.compare-price',
        'del', 's', '.was-price', '.old-price'
      ],
      image: ['img'],
      link: ['a'],
      description: [
        '.description', '.desc', '.summary', '.excerpt', 'p'
      ]
    },
    patterns: {
      price: /(?:Rs\.?\s*|₹\s*|\$\s*|€\s*|£\s*)(\d+(?:,\d+)*(?:\.\d+)?)/g,
      pagination: [
        '.next', '.pagination-next', 'a[aria-label*="next" i]',
        'a[title*="next" i]', '.page-numbers .next'
      ]
    }
  },

  // News/Blog sites
  news: {
    name: 'News/Blog Generic',
    selectors: {
      articleContainer: [
        'article', '.article', '.post', '.news-item',
        '.blog-post', '.entry', '.story'
      ],
      title: [
        'h1', 'h2', '.title', '.headline', '.article-title',
        '.post-title', '.entry-title'
      ],
      author: [
        '.author', '.byline', '.writer', '[rel="author"]',
        '.post-author', '.article-author'
      ],
      date: [
        '.date', '.published', '.timestamp', 'time',
        '.post-date', '.article-date'
      ],
      content: [
        '.content', '.article-content', '.post-content',
        '.entry-content', '.story-body'
      ],
      image: [
        '.featured-image img', '.article-image img',
        '.post-thumbnail img', 'img'
      ],
      category: [
        '.category', '.tag', '.section', '.topic'
      ]
    },
    patterns: {
      date: /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/g
    }
  },

  // Real estate sites
  realestate: {
    name: 'Real Estate Generic',
    selectors: {
      propertyContainer: [
        '.property', '.listing', '.property-card',
        '.real-estate-item', '.home-listing'
      ],
      title: [
        'h1', 'h2', 'h3', '.title', '.property-title',
        '.listing-title', '.address'
      ],
      price: [
        '.price', '.amount', '.cost', '.property-price',
        '.listing-price', '[data-price]'
      ],
      location: [
        '.location', '.address', '.area', '.neighborhood',
        '.city', '.region'
      ],
      details: [
        '.details', '.specs', '.features', '.amenities',
        '.property-details'
      ],
      bedrooms: [
        '.beds', '.bedrooms', '.bed-count', '[data-beds]'
      ],
      bathrooms: [
        '.baths', '.bathrooms', '.bath-count', '[data-baths]'
      ],
      area: [
        '.area', '.sqft', '.square-feet', '.size', '[data-area]'
      ]
    },
    patterns: {
      price: /(?:\$|₹|€|£)\s*(\d+(?:,\d+)*(?:\.\d+)?)/g,
      bedrooms: /(\d+)\s*(?:bed|bedroom|br)/gi,
      bathrooms: /(\d+)\s*(?:bath|bathroom|ba)/gi,
      area: /(\d+(?:,\d+)*)\s*(?:sq\.?\s*ft|sqft|square\s*feet)/gi
    }
  },

  // Job sites
  jobs: {
    name: 'Job Listing Generic',
    selectors: {
      jobContainer: [
        '.job', '.job-listing', '.job-card', '.position',
        '.opening', '.vacancy'
      ],
      title: [
        'h1', 'h2', 'h3', '.title', '.job-title',
        '.position-title', '.role'
      ],
      company: [
        '.company', '.employer', '.organization',
        '.company-name', '.firm'
      ],
      location: [
        '.location', '.city', '.area', '.region',
        '.job-location', '.workplace'
      ],
      salary: [
        '.salary', '.pay', '.compensation', '.wage',
        '.remuneration', '[data-salary]'
      ],
      type: [
        '.type', '.employment-type', '.job-type',
        '.contract-type', '.schedule'
      ],
      description: [
        '.description', '.job-description', '.summary',
        '.requirements', '.details'
      ]
    },
    patterns: {
      salary: /(?:\$|₹|€|£)\s*(\d+(?:,\d+)*(?:\.\d+)?)/g,
      experience: /(\d+)\s*(?:year|yr|experience)/gi
    }
  },

  // Recipe sites
  recipes: {
    name: 'Recipe Generic',
    selectors: {
      recipeContainer: [
        '.recipe', '.recipe-card', '.dish', '.meal',
        '[itemtype*="Recipe"]'
      ],
      title: [
        'h1', 'h2', '.title', '.recipe-title',
        '.dish-name', '[itemprop="name"]'
      ],
      ingredients: [
        '.ingredients', '.recipe-ingredients', '.ingredient-list',
        '[itemprop="recipeIngredient"]'
      ],
      instructions: [
        '.instructions', '.method', '.directions',
        '.recipe-instructions', '[itemprop="recipeInstructions"]'
      ],
      cookTime: [
        '.cook-time', '.cooking-time', '.prep-time',
        '[itemprop="cookTime"]', '[itemprop="totalTime"]'
      ],
      servings: [
        '.servings', '.serves', '.yield', '.portions',
        '[itemprop="recipeYield"]'
      ],
      image: [
        '.recipe-image img', '.dish-image img', 'img[itemprop="image"]'
      ]
    },
    patterns: {
      time: /(\d+)\s*(?:min|minute|hr|hour)/gi,
      servings: /(?:serves|yield|portions?)\s*:?\s*(\d+)/gi
    }
  }
};

export class UniversalScraper {
  constructor(configuration = 'ecommerce') {
    this.config = typeof configuration === 'string' 
      ? scraperConfigurations[configuration] 
      : configuration;
    
    if (!this.config) {
      throw new Error(`Configuration '${configuration}' not found`);
    }
  }

  async detectWebsiteType(page) {
    const analysis = await page.evaluate(() => {
      const text = document.body.textContent.toLowerCase();
      const htmlContent = document.documentElement.innerHTML.toLowerCase();
      
      const indicators = {
        ecommerce: [
          'add to cart', 'buy now', 'price', 'product', 'shop',
          'checkout', 'wishlist', 'rating', 'review'
        ],
        news: [
          'article', 'news', 'published', 'author', 'byline',
          'breaking', 'headline', 'story', 'journalist'
        ],
        realestate: [
          'bedroom', 'bathroom', 'sqft', 'property', 'listing',
          'real estate', 'rent', 'buy', 'apartment', 'house'
        ],
        jobs: [
          'job', 'career', 'employment', 'salary', 'apply',
          'position', 'hiring', 'company', 'work', 'resume'
        ],
        recipes: [
          'recipe', 'ingredients', 'cooking', 'cook time',
          'prep time', 'serves', 'directions', 'method'
        ]
      };

      const scores = {};
      
      Object.entries(indicators).forEach(([type, keywords]) => {
        scores[type] = keywords.reduce((score, keyword) => {
          const textMatches = (text.match(new RegExp(keyword, 'g')) || []).length;
          const htmlMatches = (htmlContent.match(new RegExp(keyword, 'g')) || []).length;
          return score + textMatches + (htmlMatches * 0.5);
        }, 0);
      });

      return scores;
    });

    // Return the type with the highest score
    return Object.entries(analysis).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  async extractWithConfig(page, config = this.config) {
    return await page.evaluate((cfg) => {
      const results = [];
      
      // Find container elements
      const containerSelectors = cfg.selectors.productContainer || 
                               cfg.selectors.articleContainer ||
                               cfg.selectors.propertyContainer ||
                               cfg.selectors.jobContainer ||
                               cfg.selectors.recipeContainer ||
                               ['.item', 'article', 'div'];

      let containers = [];
      
      for (const selector of containerSelectors) {
        containers = Array.from(document.querySelectorAll(selector));
        if (containers.length > 0) break;
      }

      containers.forEach(container => {
        const item = {};
        
        // Extract each field type
        Object.entries(cfg.selectors).forEach(([field, selectors]) => {
          if (field.includes('Container')) return; // Skip container selectors
          
          for (const selector of selectors) {
            const element = container.querySelector(selector);
            if (element) {
              if (field === 'image') {
                item[field] = element.src || element.getAttribute('data-src') || '';
              } else if (field === 'link') {
                item[field] = element.href || '';
              } else {
                item[field] = element.textContent?.trim() || '';
              }
              
              if (item[field]) break; // Found value, move to next field
            }
          }
        });

        // Apply pattern matching if configured
        if (cfg.patterns) {
          Object.entries(cfg.patterns).forEach(([field, pattern]) => {
            if (item[field] && pattern instanceof RegExp) {
              const matches = item[field].match(pattern);
              if (matches) {
                item[field + '_extracted'] = matches;
              }
            }
          });
        }

        // Only add items with meaningful content
        const hasContent = Object.values(item).some(value => 
          value && typeof value === 'string' && value.length > 2
        );
        
        if (hasContent) {
          item.scrapedAt = new Date().toISOString();
          results.push(item);
        }
      });

      return results;
    }, config);
  }

  async adaptToWebsite(page) {
    console.log('🔍 Analyzing website structure...');
    
    const detectedType = await this.detectWebsiteType(page);
    console.log(`📊 Detected website type: ${detectedType}`);
    
    if (detectedType !== this.config.name.toLowerCase().split(' ')[0]) {
      console.log(`🔄 Switching to ${detectedType} configuration`);
      this.config = scraperConfigurations[detectedType];
    }

    return detectedType;
  }

  // Method to create custom configuration
  static createCustomConfig(name, selectors, patterns = {}) {
    return {
      name,
      selectors,
      patterns
    };
  }
}

// Export configurations and scraper
export default {
  scraperConfigurations,
  UniversalScraper
};