import { json } from "@remix-run/node";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { VolumePricingService } from "../lib/db.service";

// API endpoint for customer-facing volume pricing display
export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');

    if (!productId) {
      return json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Extract shop from the request host
    const host = request.headers.get('host') || '';
    let shop = '';
    
    if (host.includes('.myshopify.com')) {
      shop = host.replace('.myshopify.com', '');
    } else if (host.includes('.trycloudflare.com')) {
      // For development, we might need to extract from the URL or use a default
      shop = 'volumeteststore'; // Default for development
    }

    if (!shop) {
      return json({
        active: false,
        error: 'Unable to determine shop'
      }, { status: 400 });
    }

    const volumeService = new VolumePricingService(shop);

    // Get volume pricing settings for this product
    const settings = await volumeService.getProductVolumeSettings(productId);

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
  return boundary.headers(headersArgs);
};