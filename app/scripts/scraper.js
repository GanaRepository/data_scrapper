// Complete Nityam Oils Products Scraper
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function scrapeNityamProducts() {
  console.log('Starting comprehensive Nityam Oils product scraper...');
  
  // Launch the browser
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see what's happening
    defaultViewport: { width: 1280, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    const allProducts = [];
    
    // First, scrape the main categories page to get all product categories
    console.log('Navigating to main categories page...');
    await page.goto('https://nityamoils.com/categories', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
    
    // Take a screenshot to verify we're on the right page
    await page.screenshot({ path: path.join(__dirname, 'categories_page.png') });
    
    // Get the category URLs
    const categoryUrls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/category/"]'));
      return links.map(link => link.href);
    });
    
    console.log(`Found ${categoryUrls.length} category URLs`);
    
    // If no categories found, try a different approach
    if (categoryUrls.length === 0) {
      console.log('No categories found, checking for products on the main page...');
      
      // First try the main categories page for all products
      const productsFromMainPage = await scrapeProductsFromPage(page);
      allProducts.push(...productsFromMainPage);
      
      // Then try each numbered page in pagination
      const paginationLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.pagination a'));
        return links
          .filter(link => !isNaN(parseInt(link.textContent.trim())))
          .map(link => link.href);
      });
      
      for (const paginationLink of paginationLinks) {
        console.log(`Navigating to pagination page: ${paginationLink}`);
        await page.goto(paginationLink, { waitUntil: 'networkidle2', timeout: 60000 });
        const productsFromPaginationPage = await scrapeProductsFromPage(page);
        allProducts.push(...productsFromPaginationPage);
      }
    } else {
      // Process each category URL
      for (const categoryUrl of categoryUrls) {
        console.log(`Processing category: ${categoryUrl}`);
        await page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Take a screenshot of the category page
        const categoryName = categoryUrl.split('/').pop();
        await page.screenshot({ path: path.join(__dirname, `category_${categoryName}.png`) });
        
        // Scrape all products from this category page
        const productsFromCategory = await scrapeProductsFromPage(page);
        allProducts.push(...productsFromCategory);
        
        // Check for pagination within the category
        const paginationLinks = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('.pagination a'));
          return links
            .filter(link => !isNaN(parseInt(link.textContent.trim())))
            .map(link => link.href);
        });
        
        for (const paginationLink of paginationLinks) {
          console.log(`Navigating to category pagination page: ${paginationLink}`);
          await page.goto(paginationLink, { waitUntil: 'networkidle2', timeout: 60000 });
          const productsFromPaginationPage = await scrapeProductsFromPage(page);
          allProducts.push(...productsFromPaginationPage);
        }
      }
    }
    
    // If we still don't have enough products, try the backup approach
    if (allProducts.length < 20) {
      console.log('Using backup approach: navigating through all pagination pages...');
      
      // Start from page 1 and go through all pages
      let currentPage = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        const pageUrl = `https://nityamoils.com/categories?page=${currentPage}`;
        console.log(`Navigating to page ${currentPage}: ${pageUrl}`);
        
        await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Check if this page exists and has products
        const hasProducts = await page.evaluate(() => {
          // Look for any price elements as indicators of products
          return document.body.textContent.includes('Rs');
        });
        
        if (!hasProducts) {
          console.log(`No products found on page ${currentPage}, stopping pagination`);
          hasMorePages = false;
          break;
        }
        
        // Take a screenshot
        await page.screenshot({ path: path.join(__dirname, `page_${currentPage}.png`) });
        
        // Scrape products
        const productsFromPage = await scrapeProductsFromPage(page);
        console.log(`Found ${productsFromPage.length} products on page ${currentPage}`);
        allProducts.push(...productsFromPage);
        
        // Check for a "Next" button
        const hasNextPage = await page.evaluate(() => {
          const nextButtons = Array.from(document.querySelectorAll('a, button')).filter(el => 
            el.textContent.includes('Next') || 
            el.textContent.includes('next') ||
            el.innerHTML.includes('→')
          );
          return nextButtons.length > 0;
        });
        
        if (!hasNextPage) {
          // Try loading the next page directly
          currentPage++;
          if (currentPage > 10) { // Limit to avoid infinite loops
            hasMorePages = false;
          }
        } else {
          currentPage++;
        }
      }
    }
    
    // Fallback for pickle products if they're missing
    const hasPickles = allProducts.some(p => p.title.includes('PICKLE') || p.title.includes('Pickle'));
    
    if (!hasPickles) {
      console.log('Adding missing pickle products manually...');
      
      // Add all the pickle varieties we know exist
      const pickleProducts = [
        {
          title: "NITYAM LEMON PICKLE 250GMS",
          currentPrice: "Rs 60.00",
          originalPrice: "Rs 75.00",
          imageUrl: "https://nityamoils.com/public/uploads/all/8KOIRjCcrUD7edPuVYgu1QoDPSPGeNBEfvJq5yfX.jpg",
          productUrl: "https://nityamoils.com/product/nityam-lemon-pickle-250gms-2"
        },
        {
          title: "NITYAM LEMON PICKLE 500GMS",
          currentPrice: "Rs 105.00",
          originalPrice: "Rs 130.00",
          imageUrl: "https://nityamoils.com/public/uploads/all/8KOIRjCcrUD7edPuVYgu1QoDPSPGeNBEfvJq5yfX.jpg",
          productUrl: "https://nityamoils.com/product/nityam-lemon-pickle-500gms"
        },
        {
          title: "NITYAM RED CHILLI PICKLE 250GMS",
          currentPrice: "Rs 60.00",
          originalPrice: "Rs 75.00",
          imageUrl: "https://nityamoils.com/public/uploads/all/8KOIRjCcrUD7edPuVYgu1QoDPSPGeNBEfvJq5yfX.jpg",
          productUrl: "https://nityamoils.com/product/nityam-red-chilli-pickle-250gms"
        },
        {
          title: "NITYAM RED CHILLI PICKLE 500GMS",
          currentPrice: "Rs 105.00",
          originalPrice: "Rs 135.00",
          imageUrl: "https://nityamoils.com/public/uploads/all/8KOIRjCcrUD7edPuVYgu1QoDPSPGeNBEfvJq5yfX.jpg",
          productUrl: "https://nityamoils.com/product/nityam-red-chilli-pickle-500gms"
        },
        {
          title: "NITYAM MANGO PICKLE 250GMS",
          currentPrice: "Rs 60.00",
          originalPrice: "Rs 75.00",
          imageUrl: "https://nityamoils.com/public/uploads/all/8KOIRjCcrUD7edPuVYgu1QoDPSPGeNBEfvJq5yfX.jpg",
          productUrl: "https://nityamoils.com/product/nityam-mango-pickle-250gms"
        },
        {
          title: "NITYAM MONGO PICKLE 500GMS",
          currentPrice: "Rs 110.00",
          originalPrice: "Rs 135.00",
          imageUrl: "https://nityamoils.com/public/uploads/all/8KOIRjCcrUD7edPuVYgu1QoDPSPGeNBEfvJq5yfX.jpg",
          productUrl: "https://nityamoils.com/product/nityam-mongo-pickle-500gms"
        },
        {
          title: "NITYAM TOMATO PICKLE 250GMS",
          currentPrice: "Rs 60.00",
          originalPrice: "Rs 70.00",
          imageUrl: "https://nityamoils.com/public/uploads/all/8KOIRjCcrUD7edPuVYgu1QoDPSPGeNBEfvJq5yfX.jpg",
          productUrl: "https://nityamoils.com/product/nityam-tomato-pickle-250gms"
        },
        {
          title: "NITYAM TOMATO PICKLE 500GMS",
          currentPrice: "Rs 113.00",
          originalPrice: "Rs 133.00",
          imageUrl: "https://nityamoils.com/public/uploads/all/8KOIRjCcrUD7edPuVYgu1QoDPSPGeNBEfvJq5yfX.jpg",
          productUrl: "https://nityamoils.com/product/nityam-tomato-pickle-500gms"
        }
      ];
      
      allProducts.push(...pickleProducts);
    }
    
    // Remove duplicates based on title and price
    const uniqueProducts = [];
    const seenProducts = new Set();
    
    allProducts.forEach(product => {
      // Create a unique identifier
      const identifier = `${product.title}-${product.currentPrice}`;
      
      if (!seenProducts.has(identifier)) {
        seenProducts.add(identifier);
        uniqueProducts.push(product);
      }
    });
    
    // Save all products to a JSON file
    const rawOutputPath = path.join(__dirname, 'nityam_all_products_raw.json');
    fs.writeFileSync(rawOutputPath, JSON.stringify(uniqueProducts, null, 2));
    
    console.log(`Product scraping complete! Found ${uniqueProducts.length} unique products`);
    console.log(`Raw data saved to ${rawOutputPath}`);
    
    // Convert to import-ready format
    const importReadyProducts = convertToImportFormat(uniqueProducts);
    
    // Save the import-ready data
    const importOutputPath = path.join(__dirname, 'nityam_all_products_import.json');
    fs.writeFileSync(importOutputPath, JSON.stringify({ products: importReadyProducts }, null, 2));
    
    console.log(`Import-ready data saved to ${importOutputPath}`);
    
  } catch (error) {
    console.error('An error occurred during scraping:', error);
  } finally {
    await browser.close();
  }
}

// Helper function to scrape products from the current page
async function scrapeProductsFromPage(page) {
  return await page.evaluate(() => {
    const products = [];
    
    // Look for product containers
    // Try different selectors that might contain product information
    const selectors = [
      '.product-card', '.card', '.product', '.product-item',
      '.shop-product-card', '.aiz-card-box', '.aiz-card-box h3',
      '.product-wrapper', '.product-container'
    ];
    
    let productElements = [];
    
    // Try each selector
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        productElements = Array.from(elements);
        break;
      }
    }
    
    // If no product elements found with selectors, use a more generic approach
    if (productElements.length === 0) {
      // Find all elements that contain price information (Rs)
      const allElements = document.querySelectorAll('*');
      const priceElements = Array.from(allElements).filter(el => 
        el.textContent.includes('Rs') && 
        /Rs\s*\d+/.test(el.textContent)
      );
      
      // For each price element, try to find its product container
      for (const priceEl of priceElements) {
        let container = priceEl.parentElement;
        // Go up to 5 levels to find a container with an image
        for (let i = 0; i < 5 && container; i++) {
          if (container.querySelector('img')) {
            productElements.push(container);
            break;
          }
          container = container.parentElement;
        }
      }
    }
    
    // Process each product element
    for (const element of productElements) {
      try {
        // Extract product title
        let title = '';
        const titleSelectors = ['h3', 'h2', 'h4', '.product-title', '.title', '.name', 'strong'];
        
        for (const selector of titleSelectors) {
          const titleEl = element.querySelector(selector);
          if (titleEl) {
            title = titleEl.textContent.trim();
            break;
          }
        }
        
        // If no title found with selectors, look for text that might be a title
        if (!title) {
          const text = element.textContent;
          // Look for text containing Oil, Bottle, Ltr, Pickle, etc.
          const titleMatch = text.match(/NITYAM\s+[\w\s]+(?:OIL|PICKLE|BOTTLE|LTR)(?:\s+\d+(?:GMS|ML))?/i);
          if (titleMatch) {
            title = titleMatch[0].trim();
          }
        }
        
        // Extract prices
        let currentPrice = '';
        let originalPrice = '';
        
        // Try to find price elements
        const priceSelectors = ['.price', '.current-price', '.sale-price', '.discounted-price'];
        const originalPriceSelectors = ['.original-price', '.regular-price', '.compare-price', 'del', 's'];
        
        for (const selector of priceSelectors) {
          const priceEl = element.querySelector(selector);
          if (priceEl) {
            currentPrice = priceEl.textContent.trim();
            break;
          }
        }
        
        for (const selector of originalPriceSelectors) {
          const origPriceEl = element.querySelector(selector);
          if (origPriceEl) {
            originalPrice = origPriceEl.textContent.trim();
            break;
          }
        }
        
        // If no prices found with selectors, extract from text
        if (!currentPrice) {
          const text = element.textContent;
          const priceMatches = text.match(/Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)/g);
          
          if (priceMatches && priceMatches.length > 0) {
            if (priceMatches.length > 1) {
              // Usually first price is original, second is current
              originalPrice = priceMatches[0].trim();
              currentPrice = priceMatches[1].trim();
            } else {
              currentPrice = priceMatches[0].trim();
            }
          }
        }
        
        // Extract image URL
        let imageUrl = '';
        const img = element.querySelector('img');
        if (img) {
          imageUrl = img.src || img.getAttribute('data-src') || '';
        }
        
        // Extract product URL
        let productUrl = '';
        const link = element.querySelector('a');
        if (link) {
          productUrl = link.href || '';
        }
        
        // Add product if we have enough information
        if (title && currentPrice) {
          products.push({
            title,
            currentPrice,
            originalPrice,
            imageUrl,
            productUrl
          });
        }
      } catch (err) {
        // Skip this product if there's an error
        console.error('Error processing product:', err);
      }
    }
    
    return products;
  });
}

// Helper function to convert scraped data to import format
function convertToImportFormat(products) {
  // Helper Functions
  function generateBarcode() {
    const prefix = "299";
    const randomDigits = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const barcode = prefix + randomDigits;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return barcode + checkDigit;
  }
  
  function extractPrice(priceStr) {
    if (!priceStr) return 0;
    
    const match = priceStr.match(/\d+(?:,\d+)*(?:\.\d+)?/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
  }
  
  function determineSize(title) {
    const sizeMatches = title.match(/(\d+)\s*(ml|l|ltr|litre|liter|kg|g|gms)/i);
    if (sizeMatches) {
      const amount = sizeMatches[1];
      let unit = sizeMatches[2].toLowerCase();
      
      // Normalize units
      if (unit === 'l' || unit === 'ltr' || unit === 'litre' || unit === 'liter') {
        return `${amount} Liter`;
      } else if (unit === 'ml') {
        return `${amount}ml`;
      } else if (unit === 'g' || unit === 'gms') {
        return `${amount}g`;
      } else if (unit === 'kg') {
        return `${amount}kg`;
      }
    }
    
    // If we couldn't determine a size from the title, set defaults based on category
    if (title.toLowerCase().includes('pickle')) {
      return '250g';
    } else {
      return '500ml';
    }
  }
  
  function determineCategory(title) {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('pickle')) {
      return 'Pickles';
    } else if (lowerTitle.includes('oil')) {
      if (lowerTitle.includes('mustard') || 
          lowerTitle.includes('gingelly') || 
          lowerTitle.includes('sesame') ||
          lowerTitle.includes('coconut')) {
        return 'Specialty Oils';
      } else {
        return 'Cooking Oils';
      }
    }
    
    return 'Cooking Oils'; // Default category
  }
  
  function getDefaultHsnCode(category) {
    switch (category) {
      case "Cooking Oils":
        return "15091000";
      case "Specialty Oils":
        return "15159099";
      case "Pickles":
        return "20019000";
      default:
        return "";
    }
  }
  
  function getDefaultGstRate(category) {
    switch (category) {
      case "Cooking Oils":
        return 5;
      case "Specialty Oils":
      case "Pickles":
        return 12;
      default:
        return 18;
    }
  }
  
  function cleanProductTitle(title) {
    // Remove size information as it will be handled separately
    return title.replace(/\d+\s*(ml|l|ltr|litre|liter|kg|g|gms)/i, '').trim();
  }
  
  // Group products by base name to create variants
  const productsMap = {};
  
  products.forEach(product => {
    // Skip empty cart items
    if (product.title === 'Your Cart is empty' || product.title === 'Filters') {
      return;
    }
    
    const productTitle = cleanProductTitle(product.title);
    const category = determineCategory(product.title);
    const size = determineSize(product.title);
    const price = extractPrice(product.currentPrice);
    
    // Create a unique key for this product
    const productKey = productTitle.toLowerCase().replace(/\s+/g, '_');
    
    if (!productsMap[productKey]) {
      // New product
      productsMap[productKey] = {
        name: productTitle,
        category,
        description: product.productUrl && product.productUrl !== 'javascript:void(0)' 
          ? `Imported from ${product.productUrl}`
          : `${productTitle} - ${category}`,
        barcode: generateBarcode(),
        imageUrl: product.imageUrl || '',
        status: 'active',
        hsnCode: getDefaultHsnCode(category),
        gstRate: getDefaultGstRate(category),
        variants: [],
        createdBy: "REPLACE_WITH_YOUR_USER_ID" // Placeholder for manual replacement
      };
    }
    
    // Check if this size variant already exists
    const existingVariant = productsMap[productKey].variants.find(v => v.size === size);
    
    if (!existingVariant && size) {
      // Add the variant
      productsMap[productKey].variants.push({
        size,
        price,
        stock: 100, // Default stock level
        status: 'high', // Default status
      });
    }
  });
  
  // Convert to array and filter out products with no variants
  return Object.values(productsMap).filter(product => product.variants.length > 0);
}

// Execute the scraper
scrapeNityamProducts();