import { json } from "@remix-run/node";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { VolumePricingService } from "../lib/db.service";

// Main API route for volume pricing functionality
export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const volumeService = new VolumePricingService(session.shop);
    
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const status = url.searchParams.get('status') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
  // Get volume models with filters
  const options = {
    active: status === 'all' ? undefined : status === 'active',
    includeTiers: true,
    includeProductCount: true
  };
  
  const models = await volumeService.getVolumeModels(options);
  
  // Fetch product details for all models
  const { admin } = await authenticate.admin(request);
  const productDetails = new Map();
  
  // Get all unique product IDs
  const allProductIds = new Set();
  models.forEach(model => {
    if (model.productAssociations) {
      model.productAssociations.forEach(assoc => {
        allProductIds.add(assoc.productId);
      });
    }
  });
  
  // Fetch product details from Shopify
  if (allProductIds.size > 0) {
    try {
      const productIds = Array.from(allProductIds);
      
      const response = await admin.graphql(`
        query getProducts($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
              handle
            }
          }
        }
      `, {
        variables: { ids: productIds }
      });
      
      const data = await response.json();
      
      if (data.data?.nodes) {
        data.data.nodes.forEach(product => {
          if (product) {
            productDetails.set(product.id, {
              id: product.id,
              title: product.title,
              handle: product.handle
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  }
  
  // Transform models to match store expectations
  const transformedModels = models.map(model => ({
    id: model.id,
    name: model.name,
    productIds: model.productAssociations?.map(assoc => assoc.productId) || [],
    products: model.productAssociations?.map(assoc => {
      const product = productDetails.get(assoc.productId);
      return product || { id: assoc.productId, title: 'Unknown Product', handle: '' };
    }) || [],
    tiers: model.tiers || [],
    style: {
      preset: model.themeSettings?.displayStyle || 'BADGE_ROW',
      showPerUnit: model.themeSettings?.showPerUnit ?? true,
      showCompareAt: model.themeSettings?.showCompareAt ?? false,
      badgeTone: model.themeSettings?.badgeTone || 'success'
    },
    active: model.active,
    updatedAt: model.updatedAt
  }));
    
    // Apply client-side filtering for query
    let filteredModels = transformedModels;
    if (query) {
      const searchQuery = query.toLowerCase();
      filteredModels = transformedModels.filter(model => 
        model.name.toLowerCase().includes(searchQuery)
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = filteredModels.slice(startIndex, endIndex);
    
    return json({
      items,
      page,
      total: filteredModels.length
    });
  } catch (error) {
    console.error('Volume pricing API error:', error);
    return json({ error: 'Failed to fetch volume pricing models' }, { status: 500 });
  }
}

export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const volumeService = new VolumePricingService(session.shop);
    
    const method = request.method;
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const modelId = pathSegments[pathSegments.length - 1];
    
    if (method === 'POST') {
      // Create new volume model
      const body = await request.json();
      const { name, products, productIds, discountType, tiers, active = false, style } = body;
      
      // Use products or productIds (both should work)
      const productList = products || productIds || [];
      
      // Transform the data to match database schema
      const modelData = {
        name,
        active,
        tiers: tiers || [],
        themeSettings: {
          displayStyle: style?.preset || 'BADGE_ROW',
          showPerUnit: style?.showPerUnit ?? true,
          showCompareAt: style?.showCompareAt ?? false,
          badgeTone: style?.badgeTone || 'success'
        },
        adminSettings: {
          showInProductList: true,
          bulkActionsEnabled: true,
          analyticsEnabled: true
        }
      };
      
      const newModel = await volumeService.createVolumeModel(modelData);
      
      // Create product associations
      if (productList && productList.length > 0) {
        await volumeService.bulkApplyVolumePricing(productList, newModel.id, true);
      }
      
      return json({ id: newModel.id });
    }
    
    if (method === 'PUT' && modelId) {
      // Update volume model
      const body = await request.json();
      const updates = {
        name: body.name,
        active: body.active,
        tiers: body.tiers,
        themeSettings: body.themeSettings,
        adminSettings: body.adminSettings
      };
      
      await volumeService.updateVolumeModel(modelId, updates);
      return json({ success: true });
    }
    
    if (method === 'PATCH' && modelId && url.pathname.includes('/active')) {
      // Toggle active status
      const body = await request.json();
      await volumeService.updateVolumeModel(modelId, { active: body.active });
      return json({ success: true });
    }
    
    if (method === 'DELETE' && modelId) {
      // Delete volume model
      await volumeService.deleteVolumeModel(modelId);
      return json({ success: true });
    }
    
    return json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Volume pricing API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
