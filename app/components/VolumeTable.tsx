import React from 'react';
import {
  IndexTable,
  Text,
  Badge,
  Button,
  ButtonGroup,
  LegacyStack,
  Tooltip,
  Icon,
  Thumbnail,
  Card,
  SkeletonBodyText,
  EmptyState
} from '@shopify/polaris';
import { VolumeModel, Product } from '../types/volume-pricing';
import { formatTierSummary } from '../lib/validation';

interface VolumeTableProps {
  models: VolumeModel[];
  products: Product[];
  loading: boolean;
  onToggleActive: (id: string, active: boolean) => void;
  onEdit: (model: VolumeModel) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkToggle?: (active: boolean) => void;
}

export function VolumeTable({
  models,
  products,
  loading,
  onToggleActive,
  onEdit,
  onDuplicate,
  onDelete,
  onBulkToggle
}: VolumeTableProps) {
  const getProductName = (productId: string): string => {
    const product = products.find(p => p.id === productId);
    return product?.title || 'Unknown Product';
  };

  const getProductThumbnail = (productId: string): string => {
    // In a real app, you'd fetch actual product images
    return 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png';
  };

  const rowMarkup = models.map((model, index) => {
    const productNames = model.productIds.map(getProductName);
    const productThumbnails = model.productIds.slice(0, 3).map(getProductId => ({
      source: getProductThumbnail(getProductId),
      alt: getProductName(getProductId)
    }));

    return (
      <IndexTable.Row id={model.id} key={model.id} position={index}>
        <IndexTable.Cell>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text variant="bodyMd" fontWeight="semibold" as="span">
              {model.name}
            </Text>
            <Badge tone={model.active ? 'success' : 'info'}>
              {model.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </IndexTable.Cell>
        
        <IndexTable.Cell>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {productThumbnails.map((thumb, idx) => (
                <Thumbnail key={idx} source={thumb.source} alt={thumb.alt} size="small" />
              ))}
              {model.productIds.length > 3 && (
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '4px',
                  backgroundColor: '#f6f6f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text variant="bodySm" as="span">+{model.productIds.length - 3}</Text>
                </div>
              )}
            </div>
            <div>
              {productNames.slice(0, 2).map((name, idx) => (
                <div key={idx}>
                  <Text variant="bodySm" as="span">
                    {name}
                    {idx === 0 && productNames.length > 1 && ' +'}
                  </Text>
                </div>
              ))}
              {productNames.length > 2 && (
                <Text variant="bodySm" tone="subdued" as="span">
                  +{productNames.length - 2} more
                </Text>
              )}
            </div>
          </div>
        </IndexTable.Cell>
        
        <IndexTable.Cell>
          <Text variant="bodySm" as="span">
            {formatTierSummary(model.tiers)}
          </Text>
        </IndexTable.Cell>
        
        <IndexTable.Cell>
          <Button
            variant={model.active ? 'primary' : 'secondary'}
            size="micro"
            onClick={() => onToggleActive(model.id, !model.active)}
            disabled={loading}
          >
            {model.active ? 'Active' : 'Inactive'}
          </Button>
        </IndexTable.Cell>
        
        <IndexTable.Cell>
          <ButtonGroup>
            <Button
              size="micro"
              onClick={() => onEdit(model)}
              disabled={loading}
            >
              Edit
            </Button>
            <ButtonGroup>
              <Tooltip content="More actions">
                <Button
                  size="micro"
                  onClick={() => {
                    // In a real implementation, this would open a dropdown menu
                    // For now, we'll show a simple alert
                    const action = window.prompt('Choose action: duplicate, delete');
                    if (action === 'duplicate') onDuplicate(model.id);
                    if (action === 'delete') onDelete(model.id);
                  }}
                  disabled={loading}
                >
                  ⋯
                </Button>
              </Tooltip>
            </ButtonGroup>
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  if (loading && models.length === 0) {
    return (
      <Card>
        <div style={{ padding: '16px' }}>
          <SkeletonBodyText lines={5} />
        </div>
      </Card>
    );
  }

  if (models.length === 0) {
    return (
      <Card>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <EmptyState
            heading="No volume pricing models yet"
            image="https://cdn.shopify.com/s/files/1/0533/2089/files/empty-state.svg"
            action={{
              content: 'Create your first model',
              onAction: () => {
                // This will be handled by the parent component
                console.log('Create first model');
              }
            }}
          >
            <p>Create tiered discounts that auto-apply when customers buy more.</p>
          </EmptyState>
        </div>
      </Card>
    );
  }

  return (
    <IndexTable
      resourceName={{ singular: 'model', plural: 'models' }}
      itemCount={models.length}
      headings={[
        { title: 'Active Pricing Models' },
        { title: 'Products' },
        { title: 'Pricing Tiers' },
        { title: 'Toggle On/Off' },
        { title: 'Edit' }
      ]}
      selectable={false}
      bulkActions={onBulkToggle ? [
        {
          content: 'Activate selected',
          onAction: () => onBulkToggle(true),
        },
        {
          content: 'Deactivate selected',
          onAction: () => onBulkToggle(false),
        },
      ] : undefined}
    >
      {rowMarkup}
    </IndexTable>
  );
}
