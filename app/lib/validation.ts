import { VolumeTier, ValidationError } from '../types/volume-pricing';

export const validateTier = (tier: VolumeTier, allTiers: VolumeTier[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate minQty
  if (!tier.minQty || tier.minQty < 1) {
    errors.push({ field: 'minQty', message: 'Minimum quantity must be at least 1' });
  }

  // Validate discountValue
  if (!tier.discountValue || tier.discountValue <= 0) {
    errors.push({ field: 'discountValue', message: 'Discount value must be greater than 0' });
  }

  // Validate maxQty if provided
  if (tier.maxQty !== undefined && tier.maxQty <= tier.minQty) {
    errors.push({ field: 'maxQty', message: 'Maximum quantity must be greater than minimum quantity' });
  }

  // Check for overlaps with other tiers
  const otherTiers = allTiers.filter(t => t !== tier);
  for (const otherTier of otherTiers) {
    const tierStart = tier.minQty;
    const tierEnd = tier.maxQty ?? Infinity;
    const otherStart = otherTier.minQty;
    const otherEnd = otherTier.maxQty ?? Infinity;

    // Check for overlap
    if (tierStart <= otherEnd && otherStart <= tierEnd) {
      errors.push({ 
        field: 'minQty', 
        message: `Overlaps with existing tier (${otherStart}${otherEnd === Infinity ? '+' : `-${otherEnd}`})` 
      });
      break;
    }
  }

  return errors;
};

export const validateAllTiers = (tiers: VolumeTier[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Sort tiers by minQty to check for proper ordering
  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);
  
  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];
    const tierErrors = validateTier(tier, sortedTiers);
    errors.push(...tierErrors.map(error => ({
      ...error,
      field: `tiers[${i}].${error.field}`
    })));
  }

  return errors;
};

export const validateModelName = (name: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Model name is required' });
  } else if (name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Model name must be at least 3 characters' });
  }
  
  return errors;
};

export const validateProducts = (products: any[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!products || products.length === 0) {
    errors.push({ field: 'products', message: 'At least one product must be selected' });
  }
  
  return errors;
};

export const formatTierSummary = (tiers: VolumeTier[]): string => {
  if (tiers.length === 0) return 'No tiers configured';
  
  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);
  const summaries = sortedTiers.map(tier => {
    const range = tier.maxQty ? `${tier.minQty}-${tier.maxQty}` : `${tier.minQty}+`;
    const discount = tier.discountType === 'PERCENT' 
      ? `${tier.discountValue}% off`
      : tier.discountType === 'AMOUNT'
      ? `$${tier.discountValue} off`
      : `$${tier.discountValue}/unit`;
    
    return `${range} → ${discount}`;
  });
  
  return summaries.join('; ');
};

