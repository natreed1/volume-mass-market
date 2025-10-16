import { json } from "@remix-run/node";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { VolumePricingService } from "../lib/db.service";

// Extension API routes for volume pricing functionality
export async function loader({ request }) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  try {
    // Get shop information from authentication
    const { session } = await authenticate.admin(request);
    const volumeService = new VolumePricingService(session.shop);
    
    switch (action) {
      case 'get-models':
        return await getVolumeModels(volumeService, request);
      case 'get-product-settings':
        return await getProductSettings(volumeService, request);
      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Extension API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function action({ request }) {
  try {
    // Get shop information from authentication
    const { session } = await authenticate.admin(request);
    const volumeService = new VolumePricingService(session.shop);
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const body = await request.json();
    
    switch (action) {
      case 'update-product-settings':
        return await updateProductSettings(volumeService, body);
      case 'bulk-apply-pricing':
        return await bulkApplyPricing(volumeService, body);
      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Extension API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get available volume pricing models
async function getVolumeModels(volumeService, request) {
  const url = new URL(request.url);
  const active = url.searchParams.get('active');
  
  const options = {
    active: active ? active === 'true' : undefined,
    includeTiers: true,
    includeProductCount: true
  };
  
  const models = await volumeService.getVolumeModels(options);
  return json({ items: models });
}

// Get volume pricing settings for a specific product
async function getProductSettings(volumeService, request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('productId');
  
  if (!productId) {
    return json({ error: 'Product ID is required' }, { status: 400 });
  }

  const settings = await volumeService.getProductVolumeSettings(productId);
  return json(settings);
}

// Update volume pricing settings for a product
async function updateProductSettings(volumeService, body) {
  const { productId, enabled, selectedModelId, displaySettings } = body;
  
  if (!productId) {
    return json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    await volumeService.updateProductVolumeSettings(productId, {
      enabled,
      selectedModelId,
      displaySettings
    });
    
    return json({ 
      success: true, 
      message: `Volume pricing ${enabled ? 'enabled' : 'disabled'} for product`,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating product settings:', error);
    return json({ error: 'Failed to update product settings' }, { status: 500 });
  }
}

// Bulk apply volume pricing to multiple products
async function bulkApplyPricing(volumeService, body) {
  const { productIds, volumeModelId, enabled = true } = body;
  
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return json({ error: 'Product IDs array is required' }, { status: 400 });
  }

  if (!volumeModelId) {
    return json({ error: 'Volume model ID is required' }, { status: 400 });
  }

  try {
    await volumeService.bulkApplyVolumePricing(productIds, volumeModelId, enabled);
    
    return json({ 
      success: true, 
      message: `Volume pricing ${enabled ? 'applied to' : 'removed from'} ${productIds.length} products successfully`,
      appliedCount: productIds.length,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error bulk applying pricing:', error);
    return json({ error: 'Failed to bulk apply volume pricing' }, { status: 500 });
  }
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
