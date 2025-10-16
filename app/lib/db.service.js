import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Volume Pricing Database Service
export class VolumePricingService {
  constructor(shopId) {
    this.shopId = shopId;
  }

  // Volume Models
  async getVolumeModels(options = {}) {
    const { active, includeTiers = true, includeProductCount = false } = options;
    
    const where = { shopId: this.shopId };
    if (active !== undefined) {
      where.active = active;
    }

    const models = await prisma.volumeModel.findMany({
      where,
      include: {
        tiers: includeTiers ? {
          orderBy: { sortOrder: 'asc' }
        } : false,
        productAssociations: includeProductCount ? {
          where: { active: true },
          select: { id: true }
        } : false,
        themeSettings: true,
        adminSettings: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add product count if requested
    if (includeProductCount) {
      return models.map(model => ({
        ...model,
        productCount: model.productAssociations?.length || 0
      }));
    }

    return models;
  }

  async getVolumeModel(id) {
    return await prisma.volumeModel.findFirst({
      where: {
        id,
        shopId: this.shopId
      },
      include: {
        tiers: {
          orderBy: { sortOrder: 'asc' }
        },
        productAssociations: {
          include: {
            variants: true
          }
        },
        themeSettings: true,
        adminSettings: true
      }
    });
  }

  async createVolumeModel(modelData) {
    const { name, active = false, tiers = [], themeSettings = {}, adminSettings = {} } = modelData;
    
    return await prisma.volumeModel.create({
      data: {
        shopId: this.shopId,
        name,
        active,
        tiers: {
          create: tiers.map((tier, index) => ({
            minQty: tier.minQty,
            maxQty: tier.maxQty,
            discountType: tier.discountType,
            discountValue: tier.discountValue,
            sortOrder: index
          }))
        },
        themeSettings: {
          create: {
            displayStyle: themeSettings.displayStyle || 'BADGE_ROW',
            showPerUnit: themeSettings.showPerUnit ?? true,
            showCompareAt: themeSettings.showCompareAt ?? false,
            badgeTone: themeSettings.badgeTone,
            customCopy: themeSettings.customCopy,
            cssOverrides: themeSettings.cssOverrides
          }
        },
        adminSettings: {
          create: {
            showInProductList: adminSettings.showInProductList ?? true,
            bulkActionsEnabled: adminSettings.bulkActionsEnabled ?? true,
            analyticsEnabled: adminSettings.analyticsEnabled ?? true
          }
        }
      },
      include: {
        tiers: true,
        themeSettings: true,
        adminSettings: true
      }
    });
  }

  async updateVolumeModel(id, updates) {
    const { name, active, tiers, themeSettings, adminSettings, ...otherUpdates } = updates;
    
    const updateData = { ...otherUpdates };
    if (name !== undefined) updateData.name = name;
    if (active !== undefined) updateData.active = active;

    // Handle tiers update
    if (tiers) {
      updateData.tiers = {
        deleteMany: {},
        create: tiers.map((tier, index) => ({
          minQty: tier.minQty,
          maxQty: tier.maxQty,
          discountType: tier.discountType,
          discountValue: tier.discountValue,
          sortOrder: index
        }))
      };
    }

    // Handle theme settings update
    if (themeSettings) {
      updateData.themeSettings = {
        upsert: {
          create: {
            displayStyle: themeSettings.displayStyle || 'BADGE_ROW',
            showPerUnit: themeSettings.showPerUnit ?? true,
            showCompareAt: themeSettings.showCompareAt ?? false,
            badgeTone: themeSettings.badgeTone,
            customCopy: themeSettings.customCopy,
            cssOverrides: themeSettings.cssOverrides
          },
          update: {
            displayStyle: themeSettings.displayStyle,
            showPerUnit: themeSettings.showPerUnit,
            showCompareAt: themeSettings.showCompareAt,
            badgeTone: themeSettings.badgeTone,
            customCopy: themeSettings.customCopy,
            cssOverrides: themeSettings.cssOverrides
          }
        }
      };
    }

    // Handle admin settings update
    if (adminSettings) {
      updateData.adminSettings = {
        upsert: {
          create: {
            showInProductList: adminSettings.showInProductList ?? true,
            bulkActionsEnabled: adminSettings.bulkActionsEnabled ?? true,
            analyticsEnabled: adminSettings.analyticsEnabled ?? true
          },
          update: {
            showInProductList: adminSettings.showInProductList,
            bulkActionsEnabled: adminSettings.bulkActionsEnabled,
            analyticsEnabled: adminSettings.analyticsEnabled
          }
        }
      };
    }

    return await prisma.volumeModel.update({
      where: {
        id,
        shopId: this.shopId
      },
      data: updateData,
      include: {
        tiers: {
          orderBy: { sortOrder: 'asc' }
        },
        themeSettings: true,
        adminSettings: true
      }
    });
  }

  async deleteVolumeModel(id) {
    return await prisma.volumeModel.delete({
      where: {
        id,
        shopId: this.shopId
      }
    });
  }

  // Product Associations
  async getProductVolumeSettings(productId) {
    const association = await prisma.productVolumeAssociation.findFirst({
      where: {
        productId,
        active: true,
        volumeModel: {
          shopId: this.shopId
        }
      },
      include: {
        volumeModel: {
          include: {
            tiers: {
              orderBy: { sortOrder: 'asc' }
            },
            themeSettings: true,
            adminSettings: true
          }
        },
        variants: true
      }
    });

    if (!association) {
      return {
        enabled: false,
        selectedModelId: null,
        displaySettings: {
          style: 'BADGE_ROW',
          showPerUnit: true,
          showCompareAt: false,
          badgeTone: 'success'
        }
      };
    }

    return {
      enabled: true,
      selectedModelId: association.volumeModelId,
      displaySettings: {
        style: association.volumeModel.themeSettings?.displayStyle || 'BADGE_ROW',
        showPerUnit: association.volumeModel.themeSettings?.showPerUnit ?? true,
        showCompareAt: association.volumeModel.themeSettings?.showCompareAt ?? false,
        badgeTone: association.volumeModel.themeSettings?.badgeTone || 'success'
      },
      model: association.volumeModel
    };
  }

  async updateProductVolumeSettings(productId, settings) {
    const { enabled, selectedModelId, displaySettings } = settings;

    if (!enabled || !selectedModelId) {
      // Disable volume pricing for this product
      return await prisma.productVolumeAssociation.updateMany({
        where: {
          productId,
          volumeModel: {
            shopId: this.shopId
          }
        },
        data: {
          active: false
        }
      });
    }

    // Enable volume pricing for this product
    const association = await prisma.productVolumeAssociation.upsert({
      where: {
        volumeModelId_productId: {
          volumeModelId: selectedModelId,
          productId
        }
      },
      create: {
        volumeModelId: selectedModelId,
        productId,
        active: true
      },
      update: {
        active: true
      },
      include: {
        volumeModel: {
          include: {
            tiers: true,
            themeSettings: true,
            adminSettings: true
          }
        }
      }
    });

    // Update theme settings if provided
    if (displaySettings) {
      await prisma.themeExtensionSettings.upsert({
        where: {
          volumeModelId: selectedModelId
        },
        create: {
          volumeModelId: selectedModelId,
          displayStyle: displaySettings.style || 'BADGE_ROW',
          showPerUnit: displaySettings.showPerUnit ?? true,
          showCompareAt: displaySettings.showCompareAt ?? false,
          badgeTone: displaySettings.badgeTone,
          customCopy: displaySettings.customCopy,
          cssOverrides: displaySettings.cssOverrides
        },
        update: {
          displayStyle: displaySettings.style,
          showPerUnit: displaySettings.showPerUnit,
          showCompareAt: displaySettings.showCompareAt,
          badgeTone: displaySettings.badgeTone,
          customCopy: displaySettings.customCopy,
          cssOverrides: displaySettings.cssOverrides
        }
      });
    }

    return association;
  }

  async bulkApplyVolumePricing(productIds, modelId, enabled = true) {
    if (!enabled) {
      // Disable volume pricing for all products
      return await prisma.productVolumeAssociation.updateMany({
        where: {
          productId: { in: productIds },
          volumeModel: {
            shopId: this.shopId
          }
        },
        data: {
          active: false
        }
      });
    }

    // Enable volume pricing for all products
    const associations = [];
    for (const productId of productIds) {
      const association = await prisma.productVolumeAssociation.upsert({
        where: {
          volumeModelId_productId: {
            volumeModelId: modelId,
            productId
          }
        },
        create: {
          volumeModelId: modelId,
          productId,
          active: true
        },
        update: {
          active: true
        }
      });
      associations.push(association);
    }

    return associations;
  }

  // Cache Management
  async getCachedPricing(shopId, productId) {
    const cache = await prisma.volumePricingCache.findFirst({
      where: {
        shopId,
        productId,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    return cache?.pricingData || null;
  }

  async setCachedPricing(shopId, productId, pricingData, expiresInHours = 24) {
    const cacheKey = `${shopId}-${productId}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    return await prisma.volumePricingCache.upsert({
      where: {
        shopId_productId: {
          shopId,
          productId
        }
      },
      create: {
        shopId,
        productId,
        cacheKey,
        pricingData,
        expiresAt
      },
      update: {
        cacheKey,
        pricingData,
        expiresAt
      }
    });
  }

  async clearExpiredCache() {
    return await prisma.volumePricingCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }

  // Analytics
  async getVolumePricingStats() {
    const stats = await prisma.$queryRaw`
      SELECT 
        vm.id,
        vm.name,
        vm.active,
        COUNT(pva.id) as product_count,
        vm.created_at,
        vm.updated_at
      FROM VolumeModel vm
      LEFT JOIN ProductVolumeAssociation pva ON vm.id = pva.volume_model_id AND pva.active = true
      WHERE vm.shop_id = ${this.shopId}
      GROUP BY vm.id, vm.name, vm.active, vm.created_at, vm.updated_at
      ORDER BY vm.created_at DESC
    `;

    return stats;
  }
}

export default VolumePricingService;
