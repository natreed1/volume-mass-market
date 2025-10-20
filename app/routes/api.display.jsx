import { json } from "@remix-run/node";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { VolumePricingService } from "../lib/db.service";

// API endpoint for customer-facing volume pricing display
export async function loader({ request }) {
  try {
    console.log('API display route called');
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');

    console.log('Product ID:', productId);
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));

    if (!productId) {
      return json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Extract shop from the request headers
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = request.headers.get('host');
    
    let shop = 'volumeteststore'; // default fallback
    
    if (forwardedHost && forwardedHost.includes('.myshopify.com')) {
      shop = forwardedHost.replace('.myshopify.com', '');
    } else if (host && host.includes('.myshopify.com')) {
      shop = host.replace('.myshopify.com', '');
    }
    
    console.log('Using shop:', shop, 'for product:', productId);
    console.log('Forwarded host:', forwardedHost);
    console.log('Host:', host);

    const volumeService = new VolumePricingService(shop);

    // Get volume pricing settings for this product
    const settings = await volumeService.getProductVolumeSettings(productId);
    console.log('Settings:', settings);

    if (!settings.enabled || !settings.model) {
      return json({
        active: false,
        message: 'No volume pricing configured for this product'
      });
    }

    const model = settings.model;

    // Transform the data for customer-facing display
    const displayData = {
      active: model.active,
      name: model.name,
      tiers: model.tiers.map(tier => ({
        minQty: tier.minQty,
        maxQty: tier.maxQty,
        discountType: tier.discountType,
        discountValue: tier.discountValue
      })),
      displaySettings: {
        style: settings.displaySettings?.style || 'BADGE_ROW',
        showPerUnit: settings.displaySettings?.showPerUnit ?? true,
        showCompareAt: settings.displaySettings?.showCompareAt ?? false,
        badgeTone: settings.displaySettings?.badgeTone || 'success'
      }
    };

    console.log('Returning display data:', displayData);
    return json(displayData);
  } catch (error) {
    console.error('Volume pricing display API error:', error);
    return json({
      active: false,
      error: 'Failed to load volume pricing data'
    }, { status: 500 });
  }
}

export const headers = (headersArgs) => {
  return {
    ...boundary.headers(headersArgs),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
};