import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Page,
  Card,
  Text,
  Button,
  LegacyStack,
  EmptyState,
  Banner,
  TextField,
  Select,
  ButtonGroup,
  Badge,
  Toast,
  Frame
} from '@shopify/polaris';
// import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { useVolumeStore } from '../store/volumeStore';
import { CreateModelForm } from '../components/CreateModelForm';
// import { VolumeModel } from '../types/volume-pricing';

export default function VolumePricingPageSimple() {
  const navigate = useNavigate();
  // const shopify = useAppBridge();
  
  const {
    models,
    products,
    loading,
    error,
    pagination,
    filters,
    loadModels,
    loadProducts,
    createModel,
    updateModel,
    deleteModel,
    toggleActive,
    duplicateModel,
    setFilters,
    setPage,
    clearError
  } = useVolumeStore();

  const [mounted, setMounted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);

  useEffect(() => {
    setMounted(true);
    loadModels();
    loadProducts();
  }, []);

  // Don't render Polaris components until after hydration
  if (!mounted) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Volume Pricing</h1>
        <p>Loading...</p>
      </div>
    );
  }

  const handleToggleActive = async (id, active) => {
    try {
      await toggleActive(id, active);
      setToastMessage(`Model ${active ? 'activated' : 'deactivated'} successfully!`);
      setToastError(false);
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to toggle model');
      setToastError(true);
      setShowToast(true);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this volume pricing model?')) {
      try {
        await deleteModel(id);
        setToastMessage('Model deleted successfully!');
        setToastError(false);
        setShowToast(true);
      } catch (err) {
        setToastMessage('Failed to delete model');
        setToastError(true);
        setShowToast(true);
      }
    }
  };

  const handleDuplicate = async (id) => {
    const newId = await duplicateModel(id);
    if (newId) {
      setToastMessage('Model duplicated successfully!');
      setToastError(false);
      setShowToast(true);
    } else {
      setToastMessage('Failed to duplicate model');
      setToastError(true);
      setShowToast(true);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
  };

  const handleEditModel = (model) => {
    setEditingModel(model);
    setEditFormOpen(true);
  };

  const handleEditFormClose = () => {
    setEditFormOpen(false);
    setEditingModel(null);
  };

  const handleFormSubmit = async (modelData) => {
    try {
      const result = await createModel(modelData);
      if (result) {
        setToastMessage('Volume pricing model created successfully!');
        setToastError(false);
        setShowToast(true);
        setFormOpen(false);
      } else {
        setToastMessage('Failed to create volume pricing model');
        setToastError(true);
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Failed to create volume pricing model');
      setToastError(true);
      setShowToast(true);
    }
  };

  const handleEditFormSubmit = async (modelData) => {
    try {
      await updateModel(editingModel.id, modelData);
      setToastMessage('Volume pricing model updated successfully!');
      setToastError(false);
      setShowToast(true);
      setEditFormOpen(false);
      setEditingModel(null);
    } catch (error) {
      setToastMessage('Failed to update volume pricing model');
      setToastError(true);
      setShowToast(true);
    }
  };

  const primaryAction = {
    content: 'Create Pricing Model',
    onAction: () => {
      setFormOpen(true);
    }
  };

  const secondaryActions = [
    {
      content: 'Learn how it works',
      onAction: () => {
        setToastMessage('Help modal coming soon!');
        setToastError(false);
        setShowToast(true);
      }
    }
  ];

  const toastMarkup = showToast ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setShowToast(false)}
    />
  ) : null;

  const renderModelRow = (model, index) => {
    const getProductNames = () => {
      return model.productIds.map(id => {
        const product = products.find(p => p.id === id);
        return product?.title || 'Unknown Product';
      }).join(', ');
    };

    const getTierSummary = () => {
      if (model.tiers.length === 0) return 'No tiers';
      
      const sortedTiers = [...model.tiers].sort((a, b) => a.minQty - b.minQty);
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

    const getDisplayStyleInfo = () => {
      const style = model.style || {};
      const displayType = style.preset || 'BADGE_ROW';
      const displayTypes = {
        'BADGE_ROW': 'Badge Row',
        'TIER_TABLE': 'Tier Table',
        'INLINE_BANNER': 'Inline Banner',
        'SLIDER': 'Quantity Slider',
        'DROPDOWN': 'Dropdown Select',
        'GRID': 'Grid Layout'
      };
      return displayTypes[displayType] || 'Badge Row';
    };

    return (
      <Card key={model.id} sectioned>
        <LegacyStack distribution="equalSpacing" alignment="center">
          <LegacyStack vertical spacing="tight">
            <LegacyStack spacing="tight" alignment="center">
              <Text variant="headingSm" as="h3">
                {model.name}
              </Text>
              <Badge tone={model.active ? 'success' : 'info'}>
                {model.active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge tone="subdued">
                {getDisplayStyleInfo()}
              </Badge>
            </LegacyStack>
            <Text variant="bodySm" tone="subdued" as="p">
              Products: {getProductNames()}
            </Text>
            <Text variant="bodySm" as="p">
              Tiers: {getTierSummary()}
            </Text>
            <Text variant="bodySm" tone="subdued" as="p">
              Display: {getDisplayStyleInfo()} • {model.active ? 'Live on store' : 'Draft'}
            </Text>
          </LegacyStack>
          
          <LegacyStack spacing="tight">
            <Button
              size="micro"
              variant={model.active ? 'primary' : 'secondary'}
              onClick={() => handleToggleActive(model.id, !model.active)}
              disabled={loading}
            >
              {model.active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              size="micro"
              variant="tertiary"
              onClick={() => handleEditModel(model)}
              disabled={loading}
            >
              Edit
            </Button>
            <Button
              size="micro"
              variant="tertiary"
              onClick={() => handleDuplicate(model.id)}
              disabled={loading}
            >
              Duplicate
            </Button>
            <Button
              size="micro"
              variant="tertiary"
              tone="critical"
              onClick={() => handleDelete(model.id)}
              disabled={loading}
            >
              Delete
            </Button>
          </LegacyStack>
        </LegacyStack>
      </Card>
    );
  };

  return (
    <Frame>
      <Page
        title="Volume Pricing"
        subtitle="1. Link a Product  2. Create Pricing Model  3. Select Style  4. Save it"
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      >
        <LegacyStack vertical spacing="loose">
          {error && (
            <Banner status="critical" onDismiss={clearError}>
              <Text variant="bodyMd" as="p">{error}</Text>
            </Banner>
          )}

          {models.length === 0 && !loading ? (
            <Card>
              <div style={{ padding: '64px 32px', textAlign: 'center' }}>
                <EmptyState
                  heading="Start Here"
                  action={{
                    content: 'Create Pricing Model',
                    onAction: () => {
                      setFormOpen(true);
                    }
                  }}
                  secondaryAction={{
                    content: 'Learn how it works',
                    onAction: () => {
                      setToastMessage('Help modal coming soon!');
                      setToastError(false);
                      setShowToast(true);
                    }
                  }}
                >
                  <Text variant="bodyMd" as="p">
                    Create tiered discounts that auto-apply when customers buy more.
                  </Text>
                </EmptyState>
              </div>
            </Card>
          ) : (
            <LegacyStack vertical spacing="base">
              <Card>
                <div style={{ padding: '16px' }}>
                  <LegacyStack distribution="equalSpacing" alignment="center">
                    <LegacyStack spacing="tight">
                      <TextField
                        label="Search models"
                        labelHidden
                        value={filters.query}
                        onChange={(value) => setFilters({ query: value })}
                        placeholder="Search by name or product..."
                        autoComplete="off"
                      />
                      <Select
                        label="Status"
                        labelHidden
                        options={[
                          { label: 'All models', value: 'all' },
                          { label: 'Active only', value: 'active' },
                          { label: 'Inactive only', value: 'inactive' }
                        ]}
                        value={filters.status}
                        onChange={(value) => setFilters({ status: value })}
                      />
                    </LegacyStack>
                    <LegacyStack spacing="tight">
                      <Button
                        variant="tertiary"
                        onClick={() => {
                          setToastMessage('Create model wizard coming soon!');
                          setToastError(false);
                          setShowToast(true);
                        }}
                      >
                        New Model
                      </Button>
                      <Button
                        variant="tertiary"
                        onClick={() => {
                          setToastMessage('Help modal coming soon!');
                          setToastError(false);
                          setShowToast(true);
                        }}
                      >
                        Help
                      </Button>
                    </LegacyStack>
                  </LegacyStack>
                </div>
              </Card>
              
              {loading ? (
                <Card>
                  <div style={{ padding: '32px', textAlign: 'center' }}>
                    <Text variant="bodyMd" as="p">Loading models...</Text>
                  </div>
                </Card>
              ) : (
                <LegacyStack vertical spacing="base">
                  {models.map((model, index) => renderModelRow(model, index))}
                </LegacyStack>
              )}
              
              {pagination.total > pagination.limit && (
                <Card>
                  <div style={{ padding: '16px', textAlign: 'center' }}>
                    <ButtonGroup>
                      <Button
                        disabled={pagination.page === 1}
                        onClick={() => setPage(pagination.page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        disabled={pagination.page * pagination.limit >= pagination.total}
                        onClick={() => setPage(pagination.page + 1)}
                      >
                        Next
                      </Button>
                    </ButtonGroup>
                    <div style={{ marginTop: '8px' }}>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} models
                      </Text>
                    </div>
                  </div>
                </Card>
              )}
            </LegacyStack>
          )}
        </LegacyStack>
      </Page>

      {toastMarkup}
      
      <CreateModelForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        products={products}
      />
      
      <CreateModelForm
        open={editFormOpen}
        onClose={handleEditFormClose}
        onSubmit={handleEditFormSubmit}
        products={products}
        editingModel={editingModel}
        isEdit={true}
      />
    </Frame>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
