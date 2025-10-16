-- CreateTable
CREATE TABLE "VolumeModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductVolumeAssociation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "volumeModelId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductVolumeAssociation_volumeModelId_fkey" FOREIGN KEY ("volumeModelId") REFERENCES "VolumeModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductVariantAssociation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productVolumeAssociationId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductVariantAssociation_productVolumeAssociationId_fkey" FOREIGN KEY ("productVolumeAssociationId") REFERENCES "ProductVolumeAssociation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VolumeTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "volumeModelId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "maxQty" INTEGER,
    "discountType" TEXT NOT NULL,
    "discountValue" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VolumeTier_volumeModelId_fkey" FOREIGN KEY ("volumeModelId") REFERENCES "VolumeModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThemeExtensionSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "volumeModelId" TEXT NOT NULL,
    "displayStyle" TEXT NOT NULL,
    "showPerUnit" BOOLEAN NOT NULL DEFAULT true,
    "showCompareAt" BOOLEAN NOT NULL DEFAULT false,
    "badgeTone" TEXT,
    "customCopy" TEXT,
    "cssOverrides" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ThemeExtensionSettings_volumeModelId_fkey" FOREIGN KEY ("volumeModelId") REFERENCES "VolumeModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminExtensionSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "volumeModelId" TEXT NOT NULL,
    "showInProductList" BOOLEAN NOT NULL DEFAULT true,
    "bulkActionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "analyticsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminExtensionSettings_volumeModelId_fkey" FOREIGN KEY ("volumeModelId") REFERENCES "VolumeModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VolumePricingCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "pricingData" JSONB NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "VolumeModel_shopId_idx" ON "VolumeModel"("shopId");

-- CreateIndex
CREATE INDEX "VolumeModel_shopId_active_idx" ON "VolumeModel"("shopId", "active");

-- CreateIndex
CREATE INDEX "ProductVolumeAssociation_productId_idx" ON "ProductVolumeAssociation"("productId");

-- CreateIndex
CREATE INDEX "ProductVolumeAssociation_volumeModelId_idx" ON "ProductVolumeAssociation"("volumeModelId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVolumeAssociation_volumeModelId_productId_key" ON "ProductVolumeAssociation"("volumeModelId", "productId");

-- CreateIndex
CREATE INDEX "ProductVariantAssociation_variantId_idx" ON "ProductVariantAssociation"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantAssociation_productVolumeAssociationId_variantId_key" ON "ProductVariantAssociation"("productVolumeAssociationId", "variantId");

-- CreateIndex
CREATE INDEX "VolumeTier_volumeModelId_idx" ON "VolumeTier"("volumeModelId");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeExtensionSettings_volumeModelId_key" ON "ThemeExtensionSettings"("volumeModelId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminExtensionSettings_volumeModelId_key" ON "AdminExtensionSettings"("volumeModelId");

-- CreateIndex
CREATE INDEX "VolumePricingCache_shopId_productId_idx" ON "VolumePricingCache"("shopId", "productId");

-- CreateIndex
CREATE INDEX "VolumePricingCache_cacheKey_idx" ON "VolumePricingCache"("cacheKey");

-- CreateIndex
CREATE INDEX "VolumePricingCache_expiresAt_idx" ON "VolumePricingCache"("expiresAt");
