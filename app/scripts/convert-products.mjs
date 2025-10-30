import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function convertProducts() {
  try {
    // Define the directory containing your JSON files
    const scriptsDir = __dirname;
    const outputDir = path.join(scriptsDir, 'converted');
    
    console.log(`Current directory: ${scriptsDir}`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    // Get JSON files that match the pattern 'products_page_*.json'
    const files = fs.readdirSync(scriptsDir).filter(file => 
      file.match(/products_page_\d+\.json/) || 
      file.match(/products\.json/)
    );
    
    if (files.length === 0) {
      console.log('No product JSON files found in the scripts directory.');
      return;
    }
    
    console.log(`Found ${files.length} JSON files to process`);
    
    // Process all valid product entries
    let productsMap = {}; // To track unique products and combine variants
    
    // First, read all files and collect data
    for (const file of files) {
      const filePath = path.join(scriptsDir, file);
      console.log(`Processing ${file}...`);
      
      try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(rawData);
        
        // Handle array or object with nested array format
        const items = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        for (const item of items) {
          // Skip empty cart items and filters
          if (!item.title || 
              item.title === 'Your Cart is empty' || 
              item.title === 'Filters' ||
              item.productUrl === 'javascript:void(0)') {
            continue;
          }
          
          const productTitle = cleanProductTitle(item.title);
          const category = determineCategory(item.title);
          const size = determineSize(item.title);
          const price = extractPrice(item.currentPrice);
          
          // Create a unique key for this product
          const productKey = productTitle.toLowerCase().replace(/\s+/g, '_');
          
          if (!productsMap[productKey]) {
            // New product
            productsMap[productKey] = {
              name: productTitle,
              category,
              description: item.productUrl && item.productUrl !== 'javascript:void(0)' 
                ? `Imported from ${item.productUrl}`
                : `${productTitle} - ${category}`,
              barcode: generateBarcode(),
              imageUrl: item.imageUrl || '',
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
              // No need to specify gstRate at variant level unless it differs from product
            });
          }
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
    
    // Convert to array
    const allProducts = Object.values(productsMap);
    
    // Filter out products with no variants
    const validProducts = allProducts.filter(product => product.variants.length > 0);
    
    console.log(`Identified ${validProducts.length} unique products with a total of ${validProducts.reduce((sum, p) => sum + p.variants.length, 0)} variants`);
    
    // Save the converted products to a new JSON file
    const outputPath = path.join(outputDir, 'converted_products.json');
    fs.writeFileSync(outputPath, JSON.stringify(validProducts, null, 2));
    
    console.log(`Successfully saved converted products to ${outputPath}`);
    
    // Create a second file with the format for the /api/products/import endpoint
    const apiFormatPath = path.join(outputDir, 'import_ready_products.json');
    fs.writeFileSync(apiFormatPath, JSON.stringify({ products: validProducts }, null, 2));
    
    console.log(`Successfully saved API-ready format to ${apiFormatPath}`);
    
  } catch (error) {
    console.error('Conversion process failed:', error);
    console.error(error.stack);
  }
}

// Run the conversion function
convertProducts();