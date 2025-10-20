import { json } from "@remix-run/node";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { VolumePricingService } from "../lib/db.service";

// API route for toggling volume pricing model active status
export async function action({ request, params }) {
  try {
    const { session } = await authenticate.admin(request);
    const volumeService = new VolumePricingService(session.shop);
    
    const method = request.method;
    const modelId = params.id;
    
    if (!modelId) {
      return json({ error: 'Model ID is required' }, { status: 400 });
    }
    
    if (method === 'PATCH') {
      // Toggle active status
      const body = await request.json();
      await volumeService.updateVolumeModel(modelId, { active: body.active });
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
