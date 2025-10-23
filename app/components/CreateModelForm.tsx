import React, { useState } from 'react';
import {
  Modal,
  Button,
  LegacyStack,
  Text,
  Card,
  TextField,
  Select,
  ButtonGroup,
  Badge,
  Divider
} from '@shopify/polaris';

interface CreateModelFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  products: any[];
  editingModel?: any;
  isEdit?: boolean;
}

interface PricingTier {
  id: string;
  minQty: number;
  maxQty: number | null;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
}

export function CreateModelForm({ open, onClose, onSubmit, products, editingModel, isEdit = false }: CreateModelFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    selectedProducts: [] as string[],
    discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
    isActive: true
  });

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    {
      id: '1',
      minQty: 5,
      maxQty: 9,
      discountType: 'PERCENT',
      discountValue: 10
    },
    {
      id: '2',
      minQty: 10,
      maxQty: null,
      discountType: 'PERCENT',
      discountValue: 15
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  React.useEffect(() => {
    if (isEdit && editingModel) {
      setFormData({
        name: editingModel.name || '',
        selectedProducts: editingModel.productIds || [],
        discountType: editingModel.discountType || 'PERCENT',
        isActive: editingModel.active || false
      });
      setPricingTiers(editingModel.tiers || []);
    }
  }, [isEdit, editingModel]);

  // Product selection options
  const productOptions = products.map(product => ({
    label: product.title,
    value: product.id.toString()
  }));

  const selectedProductLabels = formData.selectedProducts.map(id => {
    const product = products.find(p => p.id.toString() === id);
    return product?.title || id;
  });

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle product selection
  const handleProductSelection = (selectedIds: string[]) => {
    setFormData(prev => ({ ...prev, selectedProducts: selectedIds }));
    if (errors.products) {
      setErrors(prev => ({ ...prev, products: '' }));
    }
  };

  // Handle pricing tier changes
  const updatePricingTier = (tierId: string, field: keyof PricingTier, value: any) => {
    setPricingTiers(prev => prev.map(tier => 
      tier.id === tierId ? { ...tier, [field]: value } : tier
    ));
  };

  // Add new pricing tier
  const addPricingTier = () => {
    const newId = (pricingTiers.length + 1).toString();
    setPricingTiers(prev => [...prev, {
      id: newId,
      minQty: 20,
      maxQty: null,
      discountType: 'PERCENT',
      discountValue: 20
    }]);
  };

  // Remove pricing tier
  const removePricingTier = (tierId: string) => {
    if (pricingTiers.length > 1) {
      setPricingTiers(prev => prev.filter(tier => tier.id !== tierId));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Model name is required';
    }

    if (formData.selectedProducts.length === 0) {
      newErrors.products = 'Please select at least one product';
    }

    // Validate pricing tiers
    pricingTiers.forEach((tier, index) => {
      if (tier.minQty <= 0) {
        newErrors[`tier_${tier.id}_min`] = 'Minimum quantity must be greater than 0';
      }
      if (tier.discountValue <= 0) {
        newErrors[`tier_${tier.id}_discount`] = 'Discount value must be greater than 0';
      }
      if (tier.discountType === 'PERCENT' && tier.discountValue > 100) {
        newErrors[`tier_${tier.id}_discount`] = 'Percentage discount cannot exceed 100%';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const modelData = {
        name: formData.name,
        productIds: formData.selectedProducts,
        discountType: formData.discountType,
        tiers: pricingTiers.map(tier => ({
          minQty: tier.minQty,
          maxQty: tier.maxQty,
          discountType: tier.discountType,
          discountValue: tier.discountValue
        })),
        active: formData.isActive
      };

      await onSubmit(modelData);
      onClose();
    } catch (error) {
      console.error('Error creating model:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleClose = () => {
    setFormData({
      name: '',
      selectedProducts: [],
      discountType: 'PERCENT',
      isActive: true
    });
    setPricingTiers([
      {
        id: '1',
        minQty: 5,
        maxQty: 9,
        discountType: 'PERCENT',
        discountValue: 10
      },
      {
        id: '2',
        minQty: 10,
        maxQty: null,
        discountType: 'PERCENT',
        discountValue: 15
      }
    ]);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Volume Pricing Model" : "Create Volume Pricing Model"}
      size="large"
      primaryAction={{
        content: isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Model' : 'Create Model'),
        onAction: handleSubmit,
        loading: isSubmitting,
        disabled: !formData.name.trim() || formData.selectedProducts.length === 0
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: handleClose,
          disabled: isSubmitting
        }
      ]}
    >
      <Modal.Section>
        <LegacyStack vertical spacing="loose">
          {/* Model Name */}
          <Card>
            <LegacyStack vertical spacing="loose">
              <Text variant="headingMd" as="h3">Model Information</Text>
              <TextField
                label="Model Name"
                value={formData.name}
                onChange={(value) => handleFieldChange('name', value)}
                placeholder="e.g., Bulk Discount for Electronics"
                error={errors.name}
                autoComplete="off"
              />
              <Text variant="bodySm" tone="subdued" as="p">
                Give your volume pricing model a descriptive name
              </Text>
            </LegacyStack>
          </Card>

          {/* Product Selection */}
          <Card>
            <LegacyStack vertical spacing="loose">
              <Text variant="headingMd" as="h3">Select Products</Text>
              <Select
                label="Products"
                options={[
                  { label: 'Select products...', value: '' },
                  ...productOptions
                ]}
                value=""
                onChange={(value) => {
                  if (value && !formData.selectedProducts.includes(value)) {
                    handleProductSelection([...formData.selectedProducts, value]);
                  }
                }}
                error={errors.products}
              />
              
              {selectedProductLabels.length > 0 && (
                <LegacyStack vertical spacing="tight">
                  <Text variant="bodySm" fontWeight="semibold" as="p">Selected Products:</Text>
                  <LegacyStack spacing="tight" wrap>
                    {selectedProductLabels.map((label, index) => (
                      <LegacyStack key={index} spacing="tight" alignment="center">
                        <Badge>{label}</Badge>
                        <Button
                          size="slim"
                          tone="critical"
                          onClick={() => {
                            const product = products.find(p => p.title === label);
                            if (product) {
                              handleProductSelection(
                                formData.selectedProducts.filter(id => id !== product.id.toString())
                              );
                            }
                          }}
                        >
                          ×
                        </Button>
                      </LegacyStack>
                    ))}
                  </LegacyStack>
                </LegacyStack>
              )}
              
              <Text variant="bodySm" tone="subdued" as="p">
                Choose which products should have volume pricing applied
              </Text>
            </LegacyStack>
          </Card>

          {/* Pricing Rules */}
          <Card>
            <LegacyStack vertical spacing="loose">
              <LegacyStack alignment="center" distribution="equalSpacing">
                <Text variant="headingMd" as="h3">Pricing Rules</Text>
                <Button size="slim" onClick={addPricingTier}>
                  Add Tier
                </Button>
              </LegacyStack>
              
              {pricingTiers.map((tier, index) => (
                <Card key={tier.id} background="bg-surface-secondary">
                  <LegacyStack vertical spacing="loose">
                    <LegacyStack alignment="center" distribution="equalSpacing">
                      <Text variant="bodyMd" fontWeight="semibold" as="h4">
                        Tier {index + 1}
                      </Text>
                      {pricingTiers.length > 1 && (
                        <Button
                          size="slim"
                          tone="critical"
                          onClick={() => removePricingTier(tier.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </LegacyStack>
                    
                    <LegacyStack spacing="loose">
                      <TextField
                        label="Min Quantity"
                        type="number"
                        value={tier.minQty.toString()}
                        onChange={(value) => updatePricingTier(tier.id, 'minQty', parseInt(value) || 0)}
                        error={errors[`tier_${tier.id}_min`]}
                        autoComplete="off"
                      />
                      
                      <TextField
                        label="Max Quantity (optional)"
                        type="number"
                        value={tier.maxQty?.toString() || ''}
                        onChange={(value) => updatePricingTier(tier.id, 'maxQty', value ? parseInt(value) : null)}
                        placeholder="Leave empty for unlimited"
                        autoComplete="off"
                      />
                      
                      <Select
                        label="Discount Type"
                        options={[
                          { label: 'Percentage', value: 'PERCENT' },
                          { label: 'Fixed Amount', value: 'FIXED' }
                        ]}
                        value={tier.discountType}
                        onChange={(value) => updatePricingTier(tier.id, 'discountType', value)}
                      />
                      
                      <TextField
                        label="Discount Value"
                        type="number"
                        value={tier.discountValue.toString()}
                        onChange={(value) => updatePricingTier(tier.id, 'discountValue', parseFloat(value) || 0)}
                        suffix={tier.discountType === 'PERCENT' ? '%' : '$'}
                        error={errors[`tier_${tier.id}_discount`]}
                        autoComplete="off"
                      />
                    </LegacyStack>
                  </LegacyStack>
                </Card>
              ))}
              
              <Text variant="bodySm" tone="subdued" as="p">
                Set up tiered pricing rules. Customers get better discounts when they buy more.
              </Text>
            </LegacyStack>
          </Card>

        </LegacyStack>
      </Modal.Section>
    </Modal>
  );
}
