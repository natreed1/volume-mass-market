import { create } from 'zustand';

const USE_MOCK = false; // Use real API

// Mock data store
class MockStore {
  constructor() {
    this.models = [
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

    this.products = [
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
  }

  getModels(params = {}) {
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

  createModel(model) {
    const newModel = {
      ...model,
      id: Date.now().toString(),
      updatedAt: new Date().toISOString()
    };
    this.models.push(newModel);
    return { id: newModel.id };
  }

  updateModel(id, updates) {
    const index = this.models.findIndex(model => model.id === id);
    if (index === -1) return false;
    
    this.models[index] = {
      ...this.models[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return true;
  }

  deleteModel(id) {
    const index = this.models.findIndex(model => model.id === id);
    if (index === -1) return false;
    
    this.models.splice(index, 1);
    return true;
  }

  getProducts() {
    return [...this.products];
  }
}

const mockStore = new MockStore();

// API functions
const api = {
  async getModels(params = {}) {
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

  async createModel(model) {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockStore.createModel(model);
    }

    // Transform the model data to match API expectations
    const apiModel = {
      name: model.name,
      products: model.productIds || model.products || [],
      discountType: model.discountType,
      tiers: model.tiers || [],
      active: model.active || false
    };

    const response = await fetch('/api/volume-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiModel)
    });
    if (!response.ok) throw new Error('Failed to create model');
    return response.json();
  },

  async updateModel(id, updates) {
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

  async toggleActive(id, active) {
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

  async deleteModel(id) {
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

  async getProducts() {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockStore.getProducts();
    }

    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  }
};

export const useVolumeStore = create((set, get) => ({
  // Initial state
  models: [],
  products: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    total: 0,
    limit: 10
  },
  filters: {
    query: '',
    status: 'all'
  },

  // Load models with current filters and pagination
  loadModels: async (params) => {
    set({ loading: true, error: null });
    
    try {
      const { filters, pagination } = get();
      const searchParams = {
        ...params,
        query: params?.query ?? filters.query,
        status: params?.status ?? filters.status,
        page: params?.page ?? pagination.page,
        limit: params?.limit ?? pagination.limit
      };

      const response = await api.getModels(searchParams);
      
      set({
        models: response.items,
        pagination: {
          page: response.page,
          total: response.total,
          limit: searchParams.limit ?? 10
        },
        loading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load models',
        loading: false
      });
    }
  },

  // Create a new model
  createModel: async (model) => {
    set({ loading: true, error: null });
    
    try {
      const result = await api.createModel(model);
      // Reload models to get the new one
      await get().loadModels();
      return result.id;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create model',
        loading: false
      });
      return null;
    }
  },

  // Update an existing model
  updateModel: async (id, updates) => {
    try {
      await api.updateModel(id, updates);
      // Update local state
      set(state => ({
        models: state.models.map(model => 
          model.id === id ? { ...model, ...updates, updatedAt: new Date().toISOString() } : model
        )
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update model'
      });
    }
  },

  // Delete a model
  deleteModel: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await api.deleteModel(id);
      // Remove from local state
      set(state => ({
        models: state.models.filter(model => model.id !== id),
        loading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete model',
        loading: false
      });
    }
  },

  // Toggle model active status
  toggleActive: async (id, active) => {
    try {
      await api.toggleActive(id, active);
      // Update local state
      set(state => ({
        models: state.models.map(model => 
          model.id === id ? { ...model, active } : model
        )
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to toggle model'
      });
    }
  },

  // Load available products
  loadProducts: async () => {
    try {
      const products = await api.getProducts();
      set({ products });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load products'
      });
    }
  },

  // Update filters and reload models
  setFilters: (newFilters) => {
    const { filters } = get();
    const updatedFilters = { ...filters, ...newFilters };
    
    set({ 
      filters: updatedFilters,
      pagination: { ...get().pagination, page: 1 } // Reset to first page
    });
    
    // Reload models with new filters
    get().loadModels({
      query: updatedFilters.query,
      status: updatedFilters.status,
      page: 1
    });
  },

  // Set page and reload models
  setPage: (page) => {
    set(state => ({
      pagination: { ...state.pagination, page }
    }));
    
    get().loadModels({ page });
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },

  // Duplicate a model
  duplicateModel: async (id) => {
    const { models } = get();
    const originalModel = models.find(model => model.id === id);
    
    if (!originalModel) {
      set({ error: 'Model not found' });
      return null;
    }

    const duplicatedModel = {
      ...originalModel,
      name: `${originalModel.name} (Copy)`,
      active: false // Start as inactive
    };

    return await get().createModel(duplicatedModel);
  }
}));
