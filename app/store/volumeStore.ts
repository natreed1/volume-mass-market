import { create } from 'zustand';
import { VolumeModel, PaginationParams, Product, ValidationError } from '../types/volume-pricing';
import { api, optimisticUpdate } from '../lib/api';

interface VolumeStore {
  // State
  models: VolumeModel[];
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    total: number;
    limit: number;
  };
  filters: {
    query: string;
    status: 'active' | 'inactive' | 'all';
  };

  // Actions
  loadModels: (params?: PaginationParams) => Promise<void>;
  createModel: (model: Omit<VolumeModel, 'id' | 'updatedAt'>) => Promise<string | null>;
  updateModel: (id: string, updates: Partial<VolumeModel>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  toggleActive: (id: string, active: boolean) => Promise<void>;
  loadProducts: () => Promise<void>;
  setFilters: (filters: Partial<VolumeStore['filters']>) => void;
  setPage: (page: number) => void;
  clearError: () => void;
  duplicateModel: (id: string) => Promise<string | null>;
}

export const useVolumeStore = create<VolumeStore>((set, get) => ({
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
  loadModels: async (params?: PaginationParams) => {
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
    const { models } = get();
    
    // Optimistic update
    set({
      models: await optimisticUpdate.updateModel(models, id, updates),
      error: null
    });
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
    const { models } = get();
    
    // Optimistic update
    set({
      models: await optimisticUpdate.toggleActive(models, id, active),
      error: null
    });
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

    const duplicatedModel: Omit<VolumeModel, 'id' | 'updatedAt'> = {
      ...originalModel,
      name: `${originalModel.name} (Copy)`,
      active: false // Start as inactive
    };

    return await get().createModel(duplicatedModel);
  }
}));

