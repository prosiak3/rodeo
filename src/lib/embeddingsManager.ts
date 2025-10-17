import { pipeline, env } from '@xenova/transformers';
import { supabase } from './supabase';

env.allowLocalModels = false;
env.useBrowserCache = true;

interface Product {
  id: string;
  name: string;
  index: string;
  base_price: number;
}

interface ProductEmbedding {
  productId: string;
  embedding: number[];
  name: string;
  index: string;
}

interface SimilarityResult {
  product: Product;
  similarity: number;
  confidence: number;
}

interface AIMetric {
  metric_type: 'embedding_generation' | 'clustering_operation' | 'similarity_search';
  operation_name: string;
  duration_ms: number;
  input_size: number;
  output_size: number;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

class EmbeddingsManager {
  private pipeline: any = null;
  private embeddingsCache: Map<string, ProductEmbedding> = new Map();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private dbName = 'rodeo-embeddings';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private async trackMetric(metric: AIMetric): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('ai_metrics').insert({
        ...metric,
        user_id: user?.id || null,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('[AI] Failed to track metric:', error);
    }
  }

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

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    let success = true;
    let errorMessage: string | undefined;
    let result: number[] = [];

    try {
      const output = await this.pipeline(text, {
        pooling: 'mean',
        normalize: true,
      });

      result = Array.from(output.data);
      return result;
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AI] Failed to generate embedding:', error);
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      await this.trackMetric({
        metric_type: 'embedding_generation',
        operation_name: 'generate_single_embedding',
        duration_ms: duration,
        input_size: text.length,
        output_size: result.length,
        success,
        error_message: errorMessage,
        metadata: { text_preview: text.substring(0, 50) }
      });
    }
  }

  async generateProductEmbeddings(products: Product[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`[AI] Generating embeddings for ${products.length} products...`);
    const startTime = Date.now();
    let generatedCount = 0;
    let cachedCount = 0;
    let success = true;
    let errorMessage: string | undefined;

    try {
      for (const product of products) {
        const cached = await this.getStoredEmbedding(product.id);

        if (cached && cached.name === product.name) {
          this.embeddingsCache.set(product.id, cached);
          cachedCount++;
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
        generatedCount++;
      }

      const duration = Date.now() - startTime;
      console.log(`[AI] Generated ${products.length} embeddings in ${duration}ms`);
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      await this.trackMetric({
        metric_type: 'embedding_generation',
        operation_name: 'generate_product_embeddings_batch',
        duration_ms: duration,
        input_size: products.length,
        output_size: generatedCount,
        success,
        error_message: errorMessage,
        metadata: {
          generated: generatedCount,
          cached: cachedCount,
          total: products.length
        }
      });
    }
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

  async findSimilarProducts(
    searchText: string,
    products: Product[],
    limit: number = 5
  ): Promise<SimilarityResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    let success = true;
    let errorMessage: string | undefined;
    let results: SimilarityResult[] = [];

    try {
      const searchEmbedding = await this.generateEmbedding(searchText);

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
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      await this.trackMetric({
        metric_type: 'similarity_search',
        operation_name: 'find_similar_products',
        duration_ms: duration,
        input_size: products.length,
        output_size: results.length,
        success,
        error_message: errorMessage,
        metadata: {
          search_text: searchText,
          limit,
          results_found: results.length
        }
      });
    }
  }

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

  async getAllCachedEmbeddings(): Promise<ProductEmbedding[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['embeddings'], 'readonly');
      const store = transaction.objectStore('embeddings');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateCachedEmbedding(embedding: ProductEmbedding): Promise<void> {
    this.embeddingsCache.set(embedding.productId, embedding);
    await this.storeEmbedding(embedding);
  }

  async deleteCachedEmbedding(productId: string): Promise<void> {
    this.embeddingsCache.delete(productId);

    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['embeddings'], 'readwrite');
      const store = transaction.objectStore('embeddings');
      const request = store.delete(productId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async exportCache(): Promise<string> {
    const embeddings = await this.getAllCachedEmbeddings();
    return JSON.stringify(embeddings, null, 2);
  }

  async importCache(jsonData: string): Promise<{ success: number; failed: number }> {
    try {
      const embeddings: ProductEmbedding[] = JSON.parse(jsonData);
      let success = 0;
      let failed = 0;

      for (const embedding of embeddings) {
        try {
          if (embedding.productId && embedding.embedding && embedding.name && embedding.index) {
            await this.updateCachedEmbedding(embedding);
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error('[AI] Failed to import embedding:', error);
          failed++;
        }
      }

      return { success, failed };
    } catch (error) {
      console.error('[AI] Failed to parse import data:', error);
      throw new Error('Invalid JSON format');
    }
  }

  getCacheStats(): { size: number; products: string[] } {
    return {
      size: this.embeddingsCache.size,
      products: Array.from(this.embeddingsCache.keys())
    };
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const embeddingsManager = new EmbeddingsManager();
export type { Product, SimilarityResult, ProductEmbedding };
