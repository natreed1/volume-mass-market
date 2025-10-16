export type VolumeTier = {
  id?: string;
  minQty: number;
  maxQty?: number;   // undefined = open-ended
  discountType: 'PERCENT' | 'AMOUNT' | 'FIXED_PRICE';
  discountValue: number;
};

export type VolumeModel = {
  id: string;
  name: string;
  productIds: string[];   // Shopify product/variant GIDs
  tiers: VolumeTier[];
  style: {
    preset: 'BADGE_ROW' | 'TIER_TABLE' | 'INLINE_BANNER';
    showPerUnit: boolean;
    showCompareAt: boolean;
    badgeTone?: 'success'|'attention'|'info'|'subdued';
    customCopy?: string;
  };
  active: boolean;
  updatedAt: string;
};

export type ApiResponse<T> = {
  items: T[];
  page: number;
  total: number;
};

export type PaginationParams = {
  query?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
};

export type Product = {
  id: string;
  title: string;
  handle: string;
  variants: {
    id: string;
    title: string;
    price: string;
  }[];
};

export type ValidationError = {
  field: string;
  message: string;
};

export type WizardStep = 1 | 2 | 3 | 4;

export type WizardData = {
  step: WizardStep;
  products: Product[];
  name: string;
  discountType: 'PERCENT' | 'AMOUNT' | 'FIXED_PRICE';
  tiers: VolumeTier[];
  style: VolumeModel['style'];
  active: boolean;
  errors: ValidationError[];
};

