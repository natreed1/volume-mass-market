import { VolumeModel, ApiResponse, PaginationParams, Product } from '../types/volume-pricing';

const USE_MOCK = true; // Force mock for now - can be changed to false when backend is ready

// Mock data store
class MockStore {
  private models: VolumeModel[] = [
    {
      id: '1',
      name: 'Bulk Widget Discount',
      productIds: ['gid://shopify/Product/123456789'],
      tiers: [
        { id: 't1', minQty: 5, maxQty: 9, discountType: 'PERCENT', discountValue: 10 },
        { id: 't2', minQty: 10, discountType: 'PERCENT', discountValue: 15 }
      ],
      style: {
        preset: 'BADGE_ROW',
        showPerUnit: true,
        showCompareAt: false,
        badgeTone: 'success'
      },
      active: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Volume T-Shirt Pricing',
      productIds: ['gid://shopify/Product/987654321', 'gid://shopify/Product/456789123'],
      tiers: [
        { id: 't3', minQty: 10, maxQty: 24, discountType: 'AMOUNT', discountValue: 2.50 },
        { id: 't4', minQty: 25, maxQty: 49, discountType: 'AMOUNT', discountValue: 3.00 },
        { id: 't5', minQty: 50, discountType: 'AMOUNT', discountValue: 4.00 }
      ],
      style: {
        preset: 'TIER_TABLE',
        showPerUnit: false,
        showCompareAt: true,
        badgeTone: 'info'
      },
      active: false,
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  private products: Product[] = [
    {
      id: 'gid://shopify/Product/123456789',
      title: 'Premium Widget',
      handle: 'premium-widget',
      variants: [
        { id: 'gid://shopify/ProductVariant/111', title: 'Default', price: '29.99' }
      ]
    },
    {
      id: 'gid://shopify/Product/987654321',
      title: 'Basic T-Shirt',
      handle: 'basic-tshirt',
      variants: [
        { id: 'gid://shopify/ProductVariant/222', title: 'Small', price: '19.99' },
        { id: 'gid://shopify/ProductVariant/333', title: 'Medium', price: '19.99' }
      ]
    },
    {
      id: 'gid://shopify/Product/456789123',
      title: 'Deluxe T-Shirt',
      handle: 'deluxe-tshirt',
      variants: [
        { id: 'gid://shopify/ProductVariant/444', title: 'Small', price: '24.99' },
        { id: 'gid://shopify/ProductVariant/555', title: 'Medium', price: '24.99' }
      ]
    }
  ];

  getModels(params: PaginationParams = {}): ApiResponse<VolumeModel> {
    let filteredModels = [...this.models];

    // Filter by status
    if (params.status && params.status !== 'all') {
      filteredModels = filteredModels.filter(model => 
        params.status === 'active' ? model.active : !model.active
      );
    }

    // Filter by query
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredModels = filteredModels.filter(model => 
        model.name.toLowerCase().includes(query) ||
        this.products.find(p => model.productIds.includes(p.id))?.title.toLowerCase().includes(query)
      );
    }

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = filteredModels.slice(startIndex, endIndex);

    return {
      items,
      page,
      total: filteredModels.length
    };
  }

  createModel(model: Omit<VolumeModel, 'id' | 'updatedAt'>): { id: string } {
    const newModel: VolumeModel = {
      ...model,
      id: Date.now().toString(),
      updatedAt: new Date().toISOString()
    };
    this.models.push(newModel);
    return { id: newModel.id };
  }

  updateModel(id: string, updates: Partial<VolumeModel>): boolean {
    const index = this.models.findIndex(model => model.id === id);
    if (index === -1) return false;
    
    this.models[index] = {
      ...this.models[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return true;
  }

  deleteModel(id: string): boolean {
    const index = this.models.findIndex(model => model.id === id);
    if (index === -1) return false;
    
    this.models.splice(index, 1);
    return true;
  }

  getProducts(): Product[] {
    return [...this.products];
  }
}

const mockStore = new MockStore();

// API functions
export const api = {
  async getModels(params: PaginationParams = {}): Promise<ApiResponse<VolumeModel>> {
    if (USE_MOCK) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockStore.getModels(params);
    }

    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`/api/volume-pricing?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch models');
    return response.json();
  },

  async createModel(model: Omit<VolumeModel, 'id' | 'updatedAt'>): Promise<{ id: string }> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockStore.createModel(model);
    }

    const response = await fetch('/api/volume-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model)
    });
    if (!response.ok) throw new Error('Failed to create model');
    return response.json();
  },

  async updateModel(id: string, updates: Partial<VolumeModel>): Promise<void> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!mockStore.updateModel(id, updates)) {
        throw new Error('Model not found');
      }
      return;
    }

    const response = await fetch(`/api/volume-pricing/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update model');
  },

  async toggleActive(id: string, active: boolean): Promise<void> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!mockStore.updateModel(id, { active })) {
        throw new Error('Model not found');
      }
      return;
    }

    const response = await fetch(`/api/volume-pricing/${id}/active`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    if (!response.ok) throw new Error('Failed to toggle model');
  },

  async deleteModel(id: string): Promise<void> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!mockStore.deleteModel(id)) {
        throw new Error('Model not found');
      }
      return;
    }

    const response = await fetch(`/api/volume-pricing/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete model');
  },

  async getProducts(): Promise<Product[]> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockStore.getProducts();
    }

    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  }
};

// Optimistic update helpers
export const optimisticUpdate = {
  async toggleActive(models: VolumeModel[], id: string, active: boolean): Promise<VolumeModel[]> {
    const updated = models.map(model => 
      model.id === id ? { ...model, active } : model
    );
    
    try {
      await api.toggleActive(id, active);
      return updated;
    } catch (error) {
      // Rollback on error
      return models;
    }
  },

  async updateModel(models: VolumeModel[], id: string, updates: Partial<VolumeModel>): Promise<VolumeModel[]> {
    const updated = models.map(model => 
      model.id === id ? { ...model, ...updates, updatedAt: new Date().toISOString() } : model
    );
    
    try {
      await api.updateModel(id, updates);
      return updated;
    } catch (error) {
      // Rollback on error
      return models;
    }
  }
};
