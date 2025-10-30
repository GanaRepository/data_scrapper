import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DataStorage {
  constructor(options = {}) {
    this.options = {
      dataDir: options.dataDir || path.join(__dirname, '../data'),
      indexFile: options.indexFile || 'index.json',
      autoSave: options.autoSave ?? true,
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      ...options
    };

    this.index = {
      collections: {},
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    this.cache = new Map();
    this.init();
  }

  init() {
    // Ensure data directory exists
    if (!fs.existsSync(this.options.dataDir)) {
      fs.mkdirSync(this.options.dataDir, { recursive: true });
    }

    // Load existing index
    const indexPath = path.join(this.options.dataDir, this.options.indexFile);
    if (fs.existsSync(indexPath)) {
      try {
        const indexData = fs.readFileSync(indexPath, 'utf8');
        this.index = JSON.parse(indexData);
        console.log('📁 Loaded existing data index');
      } catch (error) {
        console.warn('⚠️ Could not load index file, creating new one');
        this.saveIndex();
      }
    } else {
      this.saveIndex();
    }
  }

  saveIndex() {
    const indexPath = path.join(this.options.dataDir, this.options.indexFile);
    this.index.metadata.lastModified = new Date().toISOString();
    fs.writeFileSync(indexPath, JSON.stringify(this.index, null, 2));
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async createCollection(name, schema = {}) {
    if (this.index.collections[name]) {
      throw new Error(`Collection '${name}' already exists`);
    }

    const collectionInfo = {
      name,
      schema,
      files: [],
      currentFile: 0,
      totalRecords: 0,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    this.index.collections[name] = collectionInfo;
    
    // Create first data file
    const fileName = `${name}_0.json`;
    const filePath = path.join(this.options.dataDir, fileName);
    
    const initialData = {
      metadata: {
        collection: name,
        fileIndex: 0,
        created: new Date().toISOString(),
        records: 0
      },
      data: []
    };

    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    collectionInfo.files.push(fileName);
    
    this.saveIndex();
    console.log(`✅ Created collection '${name}'`);
    
    return collectionInfo;
  }

  async insert(collectionName, data) {
    const collection = this.index.collections[collectionName];
    if (!collection) {
      throw new Error(`Collection '${collectionName}' does not exist`);
    }

    // Prepare data with ID and timestamps
    const record = {
      id: this.generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Get current file
    const currentFileName = collection.files[collection.currentFile];
    const currentFilePath = path.join(this.options.dataDir, currentFileName);
    
    // Check file size and create new file if needed
    if (fs.existsSync(currentFilePath)) {
      const stats = fs.statSync(currentFilePath);
      if (stats.size > this.options.maxFileSize) {
        // Create new file
        const newFileIndex = collection.files.length;
        const newFileName = `${collectionName}_${newFileIndex}.json`;
        const newFilePath = path.join(this.options.dataDir, newFileName);
        
        const newFileData = {
          metadata: {
            collection: collectionName,
            fileIndex: newFileIndex,
            created: new Date().toISOString(),
            records: 0
          },
          data: []
        };

        fs.writeFileSync(newFilePath, JSON.stringify(newFileData, null, 2));
        collection.files.push(newFileName);
        collection.currentFile = newFileIndex;
      }
    }

    // Load current file data
    const fileData = JSON.parse(fs.readFileSync(currentFilePath, 'utf8'));
    
    // Add record
    fileData.data.push(record);
    fileData.metadata.records = fileData.data.length;
    fileData.metadata.lastModified = new Date().toISOString();

    // Save file
    fs.writeFileSync(currentFilePath, JSON.stringify(fileData, null, 2));

    // Update collection info
    collection.totalRecords++;
    collection.lastModified = new Date().toISOString();
    
    if (this.options.autoSave) {
      this.saveIndex();
    }

    // Update cache
    this.invalidateCache(collectionName);

    return record;
  }

  async insertMany(collectionName, dataArray) {
    const results = [];
    
    for (const data of dataArray) {
      try {
        const result = await this.insert(collectionName, data);
        results.push(result);
      } catch (error) {
        console.warn(`Failed to insert record:`, error.message);
        results.push({ error: error.message, data });
      }
    }

    return results;
  }

  async find(collectionName, query = {}, options = {}) {
    const collection = this.index.collections[collectionName];
    if (!collection) {
      throw new Error(`Collection '${collectionName}' does not exist`);
    }

    const cacheKey = `${collectionName}_${JSON.stringify(query)}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let allRecords = [];

    // Load data from all files
    for (const fileName of collection.files) {
      const filePath = path.join(this.options.dataDir, fileName);
      if (fs.existsSync(filePath)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          allRecords.push(...fileData.data);
        } catch (error) {
          console.warn(`Error reading file ${fileName}:`, error.message);
        }
      }
    }

    // Apply query filters
    let results = allRecords;

    if (Object.keys(query).length > 0) {
      results = allRecords.filter(record => {
        return Object.entries(query).every(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // Handle operators like { $gt: 100 }, { $regex: /pattern/ }
            if (value.$gt !== undefined) return record[key] > value.$gt;
            if (value.$lt !== undefined) return record[key] < value.$lt;
            if (value.$gte !== undefined) return record[key] >= value.$gte;
            if (value.$lte !== undefined) return record[key] <= value.$lte;
            if (value.$regex !== undefined) {
              const regex = new RegExp(value.$regex, value.$flags || 'i');
              return regex.test(record[key]);
            }
            if (value.$in !== undefined) return value.$in.includes(record[key]);
            if (value.$ne !== undefined) return record[key] !== value.$ne;
            return false;
          }
          return record[key] === value;
        });
      });
    }

    // Apply sorting
    if (options.sort) {
      results.sort((a, b) => {
        for (const [field, direction] of Object.entries(options.sort)) {
          const aVal = a[field];
          const bVal = b[field];
          
          if (aVal < bVal) return direction === 1 ? -1 : 1;
          if (aVal > bVal) return direction === 1 ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply pagination
    if (options.limit) {
      const skip = options.skip || 0;
      results = results.slice(skip, skip + options.limit);
    }

    // Cache results
    this.cache.set(cacheKey, results);

    return results;
  }

  async findOne(collectionName, query = {}) {
    const results = await this.find(collectionName, query, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async update(collectionName, query, updateData) {
    const collection = this.index.collections[collectionName];
    if (!collection) {
      throw new Error(`Collection '${collectionName}' does not exist`);
    }

    let updatedCount = 0;

    // Update records in all files
    for (const fileName of collection.files) {
      const filePath = path.join(this.options.dataDir, fileName);
      if (fs.existsSync(filePath)) {
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let fileModified = false;

        fileData.data.forEach(record => {
          const matches = Object.entries(query).every(([key, value]) => record[key] === value);
          
          if (matches) {
            Object.assign(record, updateData, { updatedAt: new Date().toISOString() });
            updatedCount++;
            fileModified = true;
          }
        });

        if (fileModified) {
          fileData.metadata.lastModified = new Date().toISOString();
          fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
        }
      }
    }

    if (updatedCount > 0) {
      collection.lastModified = new Date().toISOString();
      if (this.options.autoSave) {
        this.saveIndex();
      }
      this.invalidateCache(collectionName);
    }

    return { modifiedCount: updatedCount };
  }

  async delete(collectionName, query) {
    const collection = this.index.collections[collectionName];
    if (!collection) {
      throw new Error(`Collection '${collectionName}' does not exist`);
    }

    let deletedCount = 0;

    // Delete records from all files
    for (const fileName of collection.files) {
      const filePath = path.join(this.options.dataDir, fileName);
      if (fs.existsSync(filePath)) {
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const originalLength = fileData.data.length;

        fileData.data = fileData.data.filter(record => {
          const matches = Object.entries(query).every(([key, value]) => record[key] === value);
          if (matches) deletedCount++;
          return !matches;
        });

        if (fileData.data.length !== originalLength) {
          fileData.metadata.records = fileData.data.length;
          fileData.metadata.lastModified = new Date().toISOString();
          fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
        }
      }
    }

    if (deletedCount > 0) {
      collection.totalRecords -= deletedCount;
      collection.lastModified = new Date().toISOString();
      if (this.options.autoSave) {
        this.saveIndex();
      }
      this.invalidateCache(collectionName);
    }

    return { deletedCount };
  }

  async aggregate(collectionName, pipeline) {
    const records = await this.find(collectionName);
    
    let result = records;

    for (const stage of pipeline) {
      if (stage.$match) {
        result = result.filter(record => {
          return Object.entries(stage.$match).every(([key, value]) => record[key] === value);
        });
      }

      if (stage.$group) {
        const groups = {};
        const groupBy = stage.$group._id;

        result.forEach(record => {
          const key = typeof groupBy === 'string' ? record[groupBy.replace('$', '')] : 'all';
          if (!groups[key]) {
            groups[key] = { _id: key, items: [] };
          }
          groups[key].items.push(record);
        });

        // Apply aggregation operations
        result = Object.values(groups).map(group => {
          const groupResult = { _id: group._id };
          
          Object.entries(stage.$group).forEach(([field, operation]) => {
            if (field === '_id') return;
            
            if (operation.$sum) {
              if (operation.$sum === 1) {
                groupResult[field] = group.items.length;
              } else {
                const fieldName = operation.$sum.replace('$', '');
                groupResult[field] = group.items.reduce((sum, item) => sum + (item[fieldName] || 0), 0);
              }
            }

            if (operation.$avg) {
              const fieldName = operation.$avg.replace('$', '');
              const sum = group.items.reduce((sum, item) => sum + (item[fieldName] || 0), 0);
              groupResult[field] = sum / group.items.length;
            }

            if (operation.$max) {
              const fieldName = operation.$max.replace('$', '');
              groupResult[field] = Math.max(...group.items.map(item => item[fieldName] || 0));
            }

            if (operation.$min) {
              const fieldName = operation.$min.replace('$', '');
              groupResult[field] = Math.min(...group.items.map(item => item[fieldName] || 0));
            }
          });

          return groupResult;
        });
      }

      if (stage.$sort) {
        result.sort((a, b) => {
          for (const [field, direction] of Object.entries(stage.$sort)) {
            const aVal = a[field];
            const bVal = b[field];
            
            if (aVal < bVal) return direction === 1 ? -1 : 1;
            if (aVal > bVal) return direction === 1 ? 1 : -1;
          }
          return 0;
        });
      }

      if (stage.$limit) {
        result = result.slice(0, stage.$limit);
      }
    }

    return result;
  }

  async exportCollection(collectionName, format = 'json') {
    const records = await this.find(collectionName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    let output;
    let extension;

    switch (format.toLowerCase()) {
      case 'json':
        output = JSON.stringify(records, null, 2);
        extension = 'json';
        break;
      
      case 'csv':
        if (records.length === 0) {
          output = '';
        } else {
          const headers = Object.keys(records[0]);
          const csvRows = [headers.join(',')];
          
          records.forEach(record => {
            const values = headers.map(header => {
              const value = record[header];
              return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvRows.push(values.join(','));
          });
          
          output = csvRows.join('\n');
        }
        extension = 'csv';
        break;
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const fileName = `${collectionName}_export_${timestamp}.${extension}`;
    const filePath = path.join(this.options.dataDir, fileName);
    
    fs.writeFileSync(filePath, output);
    console.log(`📤 Exported ${records.length} records to ${fileName}`);
    
    return filePath;
  }

  getCollectionInfo(collectionName) {
    return this.index.collections[collectionName] || null;
  }

  listCollections() {
    return Object.keys(this.index.collections);
  }

  async getStats() {
    const stats = {
      collections: {},
      totalRecords: 0,
      totalFiles: 0,
      diskUsage: 0
    };

    for (const [name, collection] of Object.entries(this.index.collections)) {
      stats.collections[name] = {
        records: collection.totalRecords,
        files: collection.files.length,
        created: collection.created,
        lastModified: collection.lastModified
      };

      stats.totalRecords += collection.totalRecords;
      stats.totalFiles += collection.files.length;

      // Calculate disk usage
      for (const fileName of collection.files) {
        const filePath = path.join(this.options.dataDir, fileName);
        if (fs.existsSync(filePath)) {
          const stats_file = fs.statSync(filePath);
          stats.diskUsage += stats_file.size;
        }
      }
    }

    return stats;
  }

  invalidateCache(collectionName = null) {
    if (collectionName) {
      // Remove cache entries for specific collection
      for (const key of this.cache.keys()) {
        if (key.startsWith(collectionName + '_')) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  async cleanup() {
    this.saveIndex();
    this.cache.clear();
    console.log('🧹 Data storage cleanup completed');
  }
}

// Example usage and utility functions
export const ScrapedDataManager = {
  async initializeCollections(dataStorage) {
    const collections = [
      {
        name: 'products',
        schema: {
          title: 'string',
          price: 'string',
          currentPrice: 'string',
          originalPrice: 'string',
          imageUrl: 'string',
          productUrl: 'string',
          description: 'string',
          category: 'string',
          source: 'string',
          scrapedAt: 'date'
        }
      },
      {
        name: 'scraping_sessions',
        schema: {
          url: 'string',
          startTime: 'date',
          endTime: 'date',
          productsFound: 'number',
          success: 'boolean',
          error: 'string',
          configuration: 'object'
        }
      },
      {
        name: 'categories',
        schema: {
          name: 'string',
          description: 'string',
          productCount: 'number',
          tags: 'array'
        }
      }
    ];

    for (const collection of collections) {
      try {
        const existing = dataStorage.getCollectionInfo(collection.name);
        if (!existing) {
          await dataStorage.createCollection(collection.name, collection.schema);
        }
      } catch (error) {
        console.warn(`Collection ${collection.name} might already exist:`, error.message);
      }
    }
  },

  async saveScrapingSession(dataStorage, sessionData) {
    return await dataStorage.insert('scraping_sessions', sessionData);
  },

  async saveProducts(dataStorage, products) {
    // Process products and ensure they have required fields
    const processedProducts = products.map(product => ({
      ...product,
      category: product.category || 'Uncategorized',
      source: product.source || 'Unknown',
      scrapedAt: product.scrapedAt || new Date().toISOString()
    }));

    return await dataStorage.insertMany('products', processedProducts);
  },

  async getProductsByCategory(dataStorage, category) {
    return await dataStorage.find('products', { category });
  },

  async searchProducts(dataStorage, searchTerm) {
    return await dataStorage.find('products', {
      $or: [
        { title: { $regex: searchTerm } },
        { description: { $regex: searchTerm } }
      ]
    });
  },

  async getProductStats(dataStorage) {
    return await dataStorage.aggregate('products', [
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }
};

export default DataStorage;