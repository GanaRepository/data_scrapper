'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  currentPrice?: string;
  originalPrice?: string;
  price?: string;
  imageUrl?: string;
  productUrl?: string;
  description?: string;
  category?: string;
  source?: string;
  scrapedAt: string;
}

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  isSelected?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onSelect, 
  isSelected = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const displayPrice = product.currentPrice || product.price || 'Price not available';
  const hasDiscount = product.originalPrice && product.originalPrice !== displayPrice;

  const extractNumericPrice = (priceStr: string) => {
    const match = priceStr.match(/[\d,]+(?:\.\d+)?/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  };

  const calculateDiscount = () => {
    if (!hasDiscount || !product.originalPrice) return 0;
    const original = extractNumericPrice(product.originalPrice);
    const current = extractNumericPrice(displayPrice);
    return original > 0 ? Math.round(((original - current) / original) * 100) : 0;
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer border-2 ${
        isSelected ? 'border-blue-500' : 'border-transparent'
      }`}
      onClick={() => onSelect?.(product)}
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100">
        {product.imageUrl && !imageError ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-200">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{calculateDiscount()}%
          </div>
        )}

        {/* Category Badge */}
        {product.category && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
            {product.category}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
          {product.title}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price Section */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-green-600">
              {displayPrice}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                {product.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {product.source && `From ${product.source}`}
          </span>
          <span>
            {new Date(product.scrapedAt).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex space-x-2">
          {product.productUrl && product.productUrl !== 'javascript:void(0)' && (
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center text-sm font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View Original
            </a>
          )}
          <button
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded text-sm font-medium transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Add to favorites or wishlist functionality
            }}
          >
            ♡ Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Grid component for displaying multiple products
interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onProductSelect?: (product: Product) => void;
  selectedProducts?: string[];
  columns?: 1 | 2 | 3 | 4;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onProductSelect,
  selectedProducts = [],
  columns = 3
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  if (loading) {
    return (
      <div className={`grid ${gridCols[columns]} gap-6`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-300"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-6 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m14 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m14 0H6m0 0l3-3m-3 3l3 3m8-3l-3-3m3 3l-3 3" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onProductSelect}
          isSelected={selectedProducts.includes(product.id)}
        />
      ))}
    </div>
  );
};

export default ProductCard;