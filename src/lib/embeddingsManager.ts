import { pipeline, env } from '@xenova/transformers';

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

class EmbeddingsManager {
  private pipeline: any = null;
  private embeddingsCache: Map<string, ProductEmbedding> = new Map();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private dbName = 'rodeo-embeddings';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

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

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const embeddingsManager = new EmbeddingsManager();
export type { Product, SimilarityResult };
