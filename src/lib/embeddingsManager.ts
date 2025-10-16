/**
 * AI Embeddings Manager for Intelligent Product Matching
 *
 * This module provides semantic search capabilities using the all-MiniLM-L6-v2 model
 * from Hugging Face. It enables fuzzy matching of product names in voice orders by
 * converting text to 384-dimensional embeddings and comparing them using cosine similarity.
 *
 * Features:
 * - Offline-first: Model runs entirely in browser via WebAssembly
 * - Persistent cache: Embeddings stored in IndexedDB
 * - Fast inference: ~10ms per embedding generation
 * - Typo tolerant: Handles speech recognition errors
 *
 * @module lib/embeddingsManager
 */

import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

/**
 * Minimal product interface for embedding generation
 */
interface Product {
  id: string;
  name: string;
  index: string;
  base_price: number;
}

/**
 * Cached product embedding with metadata
 */
interface ProductEmbedding {
  productId: string;
  embedding: number[];
  name: string;
  index: string;
}

/**
 * Product similarity search result
 */
interface SimilarityResult {
  product: Product;
  similarity: number;
  confidence: number;
}

/**
 * Singleton manager for AI embeddings and semantic search.
 *
 * Usage:
 * ```typescript
 * await embeddingsManager.initialize();
 * await embeddingsManager.generateProductEmbeddings(products);
 * const results = await embeddingsManager.findSimilarProducts('schab', products, 5);
 * ```
 */
class EmbeddingsManager {
  private pipeline: any = null;
  private embeddingsCache: Map<string, ProductEmbedding> = new Map();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private dbName = 'rodeo-embeddings';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize the AI model and prepare for embedding generation.
   * This method is idempotent - calling multiple times is safe.
   *
   * Downloads ~25MB model on first run (cached by Service Worker).
   * Subsequent calls return immediately if already initialized.
   *
   * @throws {Error} If model fails to load or not in browser environment
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('[AI] Initializing embeddings manager...');

      // Sprawdź czy jesteśmy w środowisku przeglądarki
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }

      this.db = await this.openDatabase();

      console.log('[AI] Loading transformers pipeline...');

      // Załaduj pipeline z obsługą błędów
      this.pipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              console.log(`[AI] Loading: ${progress.file} - ${Math.round(progress.progress)}%`);
            }
          }
        }
      );

      console.log('[AI] Model loaded successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('[AI] Failed to initialize:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('embeddings')) {
          const store = db.createObjectStore('embeddings', { keyPath: 'productId' });
          store.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  /**
   * Generate a 384-dimensional embedding vector for input text.
   *
   * @param text - Input text to convert to embedding
   * @returns Promise resolving to embedding array (384 numbers)
   * @throws {Error} If model not initialized or generation fails
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const output = await this.pipeline(text, {
        pooling: 'mean',
        normalize: true,
      });

      return Array.from(output.data);
    } catch (error) {
      console.error('[AI] Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Generate and cache embeddings for all products.
   * Skips products that already have cached embeddings (unless name changed).
   *
   * @param products - Array of products to process
   * @throws {Error} If model not initialized
   */
  async generateProductEmbeddings(products: Product[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`[AI] Generating embeddings for ${products.length} products...`);
    const startTime = Date.now();

    for (const product of products) {
      const cached = await this.getStoredEmbedding(product.id);

      if (cached && cached.name === product.name) {
        this.embeddingsCache.set(product.id, cached);
        continue;
      }

      const embedding = await this.generateEmbedding(product.name);

      const productEmbedding: ProductEmbedding = {
        productId: product.id,
        embedding,
        name: product.name,
        index: product.index,
      };

      this.embeddingsCache.set(product.id, productEmbedding);
      await this.storeEmbedding(productEmbedding);
    }

    const duration = Date.now() - startTime;
    console.log(`[AI] Generated ${products.length} embeddings in ${duration}ms`);
  }

  private async storeEmbedding(embedding: ProductEmbedding): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['embeddings'], 'readwrite');
      const store = transaction.objectStore('embeddings');
      const request = store.put(embedding);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getStoredEmbedding(productId: string): Promise<ProductEmbedding | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['embeddings'], 'readonly');
      const store = transaction.objectStore('embeddings');
      const request = store.get(productId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Calculate cosine similarity between two embedding vectors.
   * Returns value between -1 and 1, where 1 = identical, 0 = orthogonal.
   *
   * @param a - First embedding vector
   * @param b - Second embedding vector
   * @returns Similarity score (0 to 1 in practice)
   * @throws {Error} If vectors have different lengths
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Find products most similar to search text using semantic search.
   * Filters results to >30% similarity (0.3 threshold).
   *
   * @param searchText - User's search query (e.g., "schab")
   * @param products - Array of products to search through
   * @param limit - Maximum number of results to return (default: 5)
   * @returns Array of products sorted by similarity (highest first)
   */
  async findSimilarProducts(
    searchText: string,
    products: Product[],
    limit: number = 5
  ): Promise<SimilarityResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const searchEmbedding = await this.generateEmbedding(searchText);

    const results: SimilarityResult[] = [];

    for (const product of products) {
      const cachedEmbedding = this.embeddingsCache.get(product.id);

      if (!cachedEmbedding) {
        continue;
      }

      const similarity = this.cosineSimilarity(searchEmbedding, cachedEmbedding.embedding);

      const confidence = Math.round(similarity * 100);

      if (similarity > 0.3) {
        results.push({
          product,
          similarity,
          confidence,
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, limit);
  }

  /**
   * Clear all cached embeddings from memory and IndexedDB.
   * Use when products have been updated or for troubleshooting.
   */
  async clearCache(): Promise<void> {
    this.embeddingsCache.clear();

    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['embeddings'], 'readwrite');
      const store = transaction.objectStore('embeddings');
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[AI] Cache cleared');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if AI model is initialized and ready to use.
   *
   * @returns true if initialized, false otherwise
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

export const embeddingsManager = new EmbeddingsManager();
export type { Product, SimilarityResult };
