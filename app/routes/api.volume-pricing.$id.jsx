import { json } from "@remix-run/node";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { VolumePricingService } from "../lib/db.service";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// API route for individual volume pricing model operations
export async function action({ request, params }) {
  try {
    const { session } = await authenticate.admin(request);
    const volumeService = new VolumePricingService(session.shop);
    
    const method = request.method;
    const modelId = params.id;
    
    if (!modelId) {
      return json({ error: 'Model ID is required' }, { status: 400 });
    }
    
    if (method === 'PUT') {
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
      
      // Update product associations if provided
      if (body.productIds && Array.isArray(body.productIds)) {
        // First, remove existing associations for this model
        await prisma.productVolumeAssociation.deleteMany({
          where: { volumeModelId: modelId }
        });
        // Then, create new associations
        if (body.productIds.length > 0) {
          await volumeService.bulkApplyVolumePricing(body.productIds, modelId, true);
        }
      }
      
      return json({ success: true });
    }
    
    if (method === 'PATCH') {
      // Toggle active status or other partial updates
      const body = await request.json();
      
      if (body.active !== undefined) {
        await volumeService.updateVolumeModel(modelId, { active: body.active });
      }
      
      return json({ success: true });
    }
    
    if (method === 'DELETE') {
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
