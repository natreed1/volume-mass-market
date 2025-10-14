import { useState } from "react";
import { useNavigate, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";

export default function VolumePricingConfig() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
  const [globalDiscountType, setGlobalDiscountType] = useState("percentage");
  const [pricingRules, setPricingRules] = useState([
    { quantity: 1, discountValue: 0 },
    { quantity: 5, discountValue: 10 },
    { quantity: 10, discountValue: 15 },
  ]);
  
  const [displayType, setDisplayType] = useState("dropdown");
  const [colorScheme, setColorScheme] = useState("blue");
  
  // Mock product data - in real app this would come from the selected product
  const [productData] = useState({
    id: "gid://shopify/Product/123456789",
    title: "Premium Widget",
    sellingPrice: 29.99,
    cost: 15.00, // This would come from Shopify product cost field
    variants: [
      { id: "variant1", title: "Default", price: "29.99", cost: "15.00" }
    ]
  });

  const addPricingRule = () => {
    setPricingRules([...pricingRules, { quantity: "", discountValue: "" }]);
  };

  const updatePricingRule = (index, field, value) => {
    const updated = [...pricingRules];
    updated[index][field] = value;
    setPricingRules(updated);
  };

  const removePricingRule = (index) => {
    setPricingRules(pricingRules.filter((_, i) => i !== index));
  };

  // Calculate margin for a given discount
  const calculateMargin = (discountValue) => {
    const sellingPrice = productData.sellingPrice;
    const cost = productData.cost;
    
    if (cost <= 0) return { margin: 'N/A', profit: 'N/A', discountedPrice: sellingPrice };
    
    let discountedPrice;
    if (globalDiscountType === "percentage") {
      discountedPrice = sellingPrice * (1 - discountValue / 100);
    } else {
      discountedPrice = sellingPrice - discountValue;
    }
    
    const profit = discountedPrice - cost;
    const margin = (profit / discountedPrice) * 100;
    
    return {
      margin: margin.toFixed(1),
      profit: profit.toFixed(2),
      discountedPrice: discountedPrice.toFixed(2)
    };
  };

  const savePricingRules = () => {
    const formData = new FormData();
    formData.append("action", "save_pricing_rules");
    formData.append("rules", JSON.stringify(pricingRules));
    formData.append("displayType", displayType);
    formData.append("discountType", globalDiscountType);
    formData.append("colorScheme", colorScheme);
    
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <s-page heading="Volume Pricing Configuration">
      <s-button 
        slot="primary-action" 
        onClick={savePricingRules}
        loading={fetcher.state === "submitting"}
      >
        Save Pricing Rules
      </s-button>

      <s-button 
        slot="secondary-action" 
        variant="tertiary"
        onClick={() => navigate("/app")}
      >
        Back to Products
      </s-button>

      <s-section heading="Product Information">
        <s-paragraph>
          Review and update product cost information to calculate accurate margins for your volume pricing.
        </s-paragraph>
        
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-stack direction="block" gap="base">
            <s-heading level="3">Current Product: {productData.title}</s-heading>
            
            <s-grid gap="base">
              <s-grid gap="small-200">
                <s-text variant="bodyMd" fontWeight="semibold">Selling Price:</s-text>
                <s-text variant="bodyMd">${productData.sellingPrice}</s-text>
              </s-grid>
              
              <s-grid gap="small-200">
                <s-text variant="bodyMd" fontWeight="semibold">Product Cost:</s-text>
                <s-text variant="bodyMd" tone={productData.cost > 0 ? 'success' : 'warning'}>
                  {productData.cost > 0 ? `$${productData.cost}` : 'Not set - Add cost to see margin calculations'}
                </s-text>
              </s-grid>
              
              <s-grid gap="small-200">
                <s-text variant="bodyMd" fontWeight="semibold">Current Margin:</s-text>
                <s-text variant="bodyMd" tone={productData.cost > 0 ? ((productData.sellingPrice - productData.cost) / productData.sellingPrice * 100 >= 30 ? 'success' : 'warning') : 'neutral'}>
                  {productData.cost > 0 ? `${((productData.sellingPrice - productData.cost) / productData.sellingPrice * 100).toFixed(1)}%` : 'N/A'}
                </s-text>
              </s-grid>
            </s-grid>
            
            <s-stack direction="inline" gap="small-200">
              <s-button 
                variant="tertiary"
                onClick={() => {
                  shopify.intents.invoke?.("edit:shopify/Product", {
                    value: productData.id,
                  });
                }}
              >
                Edit Product Cost in Shopify
              </s-button>
              <s-button 
                variant="tertiary"
                onClick={() => shopify.toast.show("Manual cost entry feature coming soon!")}
              >
                Add Cost Manually
              </s-button>
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Volume Pricing Rules">
        <s-paragraph>
          Set up tiered pricing rules based on quantity. Customers will see these discounts when purchasing multiple items.
        </s-paragraph>

        <s-stack direction="block" gap="base">
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="base">
              <s-heading level="3">Pricing Tiers</s-heading>
              
              {/* Global Discount Type Selection */}
              <s-box padding="base" borderWidth="base" borderRadius="base" background="base">
                <s-stack direction="block" gap="tight">
                  <s-text variant="bodyMd" fontWeight="semibold">Discount Type for All Tiers:</s-text>
                  <s-radio-group
                    value={globalDiscountType}
                    onChange={(e) => setGlobalDiscountType(e.target.value)}
                  >
                    <s-radio value="percentage">
                      <s-text variant="bodyMd" fontWeight="semibold">Percentage Off (%)</s-text>
                    </s-radio>
                    <s-radio value="amount">
                      <s-text variant="bodyMd" fontWeight="semibold">Amount Off ($)</s-text>
                    </s-radio>
                  </s-radio-group>
                </s-stack>
              </s-box>
              
              <s-table>
                <s-table-head>
                  <s-table-row>
                    <s-table-header>Quantity</s-table-header>
                    <s-table-header>
                      Discount Value {globalDiscountType === "amount" ? "($)" : "(%)"}
                    </s-table-header>
                    <s-table-header>Discounted Price</s-table-header>
                    <s-table-header>Margin Impact</s-table-header>
                    <s-table-header>Actions</s-table-header>
                  </s-table-row>
                </s-table-head>
                <s-table-body>
                  {pricingRules.map((rule, index) => {
                    const marginData = calculateMargin(rule.discountValue);
                    return (
                      <s-table-row key={index}>
                        <s-table-cell>
                          <s-text-field
                            type="number"
                            value={rule.quantity}
                            onChange={(e) => updatePricingRule(index, "quantity", parseInt(e.target.value) || "")}
                            placeholder="Quantity"
                          />
                        </s-table-cell>
                        <s-table-cell>
                          <s-text-field
                            type="number"
                            value={rule.discountValue}
                            onChange={(e) => updatePricingRule(index, "discountValue", parseFloat(e.target.value) || "")}
                            placeholder={globalDiscountType === "amount" ? "0.00" : "0"}
                            prefix={globalDiscountType === "amount" ? "$" : ""}
                            suffix={globalDiscountType === "percentage" ? "%" : ""}
                          />
                        </s-table-cell>
                        <s-table-cell>
                          <s-text variant="bodySm" fontWeight="semibold">
                            ${marginData.discountedPrice}
                          </s-text>
                        </s-table-cell>
                        <s-table-cell>
                          <s-grid gap="small-100">
                            <s-text variant="bodySm" tone={marginData.margin !== 'N/A' ? (parseFloat(marginData.margin) >= 30 ? 'success' : parseFloat(marginData.margin) >= 15 ? 'warning' : 'critical') : 'neutral'}>
                              {marginData.margin !== 'N/A' ? `${marginData.margin}%` : 'N/A'}
                            </s-text>
                            <s-text variant="bodySm" tone="subdued">
                              Profit: ${marginData.profit}
                            </s-text>
                          </s-grid>
                        </s-table-cell>
                        <s-table-cell>
                          <s-button
                            size="micro"
                            variant="tertiary"
                            onClick={() => removePricingRule(index)}
                          >
                            Remove
                          </s-button>
                        </s-table-cell>
                      </s-table-row>
                    );
                  })}
                </s-table-body>
              </s-table>

              <s-button onClick={addPricingRule} variant="tertiary">
                Add Pricing Tier
              </s-button>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      <s-section heading="Display Options">
        <s-paragraph>
          Choose how volume pricing will be displayed to customers on your website.
        </s-paragraph>

        <s-stack direction="block" gap="base">
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="base">
              <s-heading level="3">Display Settings</s-heading>
              
              {/* Display Type Selection */}
              <s-stack direction="block" gap="tight">
                <s-text variant="bodyMd" fontWeight="semibold">Display Type:</s-text>
                <s-radio-group
                  value={displayType}
                  onChange={(e) => setDisplayType(e.target.value)}
                >
                  <s-radio value="dropdown">
                    <s-text variant="bodyMd" fontWeight="semibold">Dropdown Table</s-text>
                    <s-text variant="bodyMd" tone="subdued">
                      Show pricing tiers in a clean dropdown/table format
                    </s-text>
                  </s-radio>
                  <s-radio value="slider">
                    <s-text variant="bodyMd" fontWeight="semibold">Interactive Slider</s-text>
                    <s-text variant="bodyMd" tone="subdued">
                      Let customers slide to see pricing changes in real-time
                    </s-text>
                  </s-radio>
                </s-radio-group>
              </s-stack>

              {/* Color Scheme Selection */}
              <s-stack direction="block" gap="tight">
                <s-text variant="bodyMd" fontWeight="semibold">Color Scheme:</s-text>
                <s-select
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value)}
                >
                  <s-option value="blue">Blue Theme</s-option>
                  <s-option value="green">Green Theme</s-option>
                  <s-option value="purple">Purple Theme</s-option>
                  <s-option value="orange">Orange Theme</s-option>
                  <s-option value="red">Red Theme</s-option>
                </s-select>
              </s-stack>
            </s-stack>
          </s-box>

          {/* Live Preview Section */}
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="base"
          >
            <s-stack direction="block" gap="base">
              <s-heading level="3">Live Preview</s-heading>
              <s-text variant="bodyMd" tone="subdued">
                This is how your volume pricing will appear to customers:
              </s-text>
              
              {/* Realistic Website Preview Container */}
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="base"
                style={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e1e5e9',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                <s-stack direction="block" gap="base">
                  {/* Website Header Simulation */}
                  <s-box
                    padding="tight"
                    style={{
                      backgroundColor: colorScheme === 'blue' ? '#1e40af' : 
                                      colorScheme === 'green' ? '#059669' :
                                      colorScheme === 'purple' ? '#7c3aed' :
                                      colorScheme === 'orange' ? '#ea580c' :
                                      colorScheme === 'red' ? '#dc2626' : '#1e40af',
                      borderRadius: '4px 4px 0 0',
                      color: 'white'
                    }}
                  >
                    <s-text variant="bodySm" style={{ color: 'white', fontWeight: '600' }}>
                      📦 Your Store - Product Page Preview
                    </s-text>
                  </s-box>

                  {/* Product Info Section */}
                  <s-box padding="base" style={{ backgroundColor: '#f8fafc' }}>
                    <s-stack direction="block" gap="tight">
                      <s-text variant="bodyMd" fontWeight="semibold" style={{ color: '#1f2937' }}>
                        Premium Widget - $29.99
                      </s-text>
                      <s-text variant="bodySm" style={{ color: '#6b7280' }}>
                        Save more when you buy in bulk!
                      </s-text>
                    </s-stack>
                  </s-box>

                  {/* Volume Pricing Display */}
                  {displayType === "dropdown" ? (
                    <s-box style={{ backgroundColor: '#ffffff' }}>
                      <s-stack direction="block" gap="tight">
                        <s-text variant="bodySm" fontWeight="semibold" style={{ 
                          color: colorScheme === 'blue' ? '#1e40af' : 
                                 colorScheme === 'green' ? '#059669' :
                                 colorScheme === 'purple' ? '#7c3aed' :
                                 colorScheme === 'orange' ? '#ea580c' :
                                 colorScheme === 'red' ? '#dc2626' : '#1e40af',
                          marginBottom: '8px'
                        }}>
                          🎯 Volume Discounts
                        </s-text>
                        
                        {/* Realistic Dropdown Interface */}
                        <s-box
                          style={{
                            border: `1px solid #d1d5db`,
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          {/* Dropdown Header */}
                          <s-box
                            style={{
                              backgroundColor: colorScheme === 'blue' ? '#dbeafe' : 
                                              colorScheme === 'green' ? '#d1fae5' :
                                              colorScheme === 'purple' ? '#e9d5ff' :
                                              colorScheme === 'orange' ? '#fed7aa' :
                                              colorScheme === 'red' ? '#fecaca' : '#dbeafe',
                              padding: '12px',
                              borderBottom: '1px solid #e5e7eb',
                              cursor: 'pointer'
                            }}
                          >
                            <s-stack direction="inline" gap="base" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <s-text variant="bodySm" fontWeight="semibold" style={{ color: '#374151' }}>
                                Select Quantity & See Savings
                              </s-text>
                              <s-text variant="bodySm" style={{ color: '#6b7280' }}>
                                ▼
                              </s-text>
                            </s-stack>
                          </s-box>
                          
                          {/* Dropdown Options */}
                          {pricingRules.filter(rule => rule.quantity && rule.discountValue).map((rule, index) => (
                            <s-box
                              key={index}
                              style={{
                                padding: '12px',
                                borderBottom: index < pricingRules.filter(rule => rule.quantity && rule.discountValue).length - 1 ? '1px solid #f3f4f6' : 'none',
                                backgroundColor: '#ffffff',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = colorScheme === 'blue' ? '#f0f9ff' : 
                                                                                    colorScheme === 'green' ? '#f0fdf4' :
                                                                                    colorScheme === 'purple' ? '#faf5ff' :
                                                                                    colorScheme === 'orange' ? '#fff7ed' :
                                                                                    colorScheme === 'red' ? '#fef2f2' : '#f0f9ff'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                            >
                              <s-stack direction="inline" gap="base" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <s-stack direction="inline" gap="small-200" style={{ alignItems: 'center' }}>
                                  <s-box
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      backgroundColor: colorScheme === 'blue' ? '#3b82f6' : 
                                                      colorScheme === 'green' ? '#10b981' :
                                                      colorScheme === 'purple' ? '#8b5cf6' :
                                                      colorScheme === 'orange' ? '#f97316' :
                                                      colorScheme === 'red' ? '#ef4444' : '#3b82f6'
                                    }}
                                  />
                                  <s-text variant="bodySm" style={{ color: '#374151', fontWeight: '500' }}>
                                    {rule.quantity}+ items
                                  </s-text>
                                </s-stack>
                                <s-stack direction="inline" gap="small-200" style={{ alignItems: 'center' }}>
                                  <s-text variant="bodySm" style={{ 
                                    color: colorScheme === 'blue' ? '#1e40af' : 
                                           colorScheme === 'green' ? '#059669' :
                                           colorScheme === 'purple' ? '#7c3aed' :
                                           colorScheme === 'orange' ? '#ea580c' :
                                           colorScheme === 'red' ? '#dc2626' : '#1e40af',
                                    fontWeight: '600'
                                  }}>
                                    {globalDiscountType === "amount" ? "$" : ""}{rule.discountValue}{globalDiscountType === "percentage" ? "%" : ""} off
                                  </s-text>
                                  <s-box
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      backgroundColor: colorScheme === 'blue' ? '#dbeafe' : 
                                                      colorScheme === 'green' ? '#d1fae5' :
                                                      colorScheme === 'purple' ? '#e9d5ff' :
                                                      colorScheme === 'orange' ? '#fed7aa' :
                                                      colorScheme === 'red' ? '#fecaca' : '#dbeafe',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px',
                                      color: colorScheme === 'blue' ? '#1e40af' : 
                                             colorScheme === 'green' ? '#059669' :
                                             colorScheme === 'purple' ? '#7c3aed' :
                                             colorScheme === 'orange' ? '#ea580c' :
                                             colorScheme === 'red' ? '#dc2626' : '#1e40af'
                                    }}
                                  >
                                    ✓
                                  </s-box>
                                </s-stack>
                              </s-stack>
                            </s-box>
                          ))}
                          
                          {/* Selected State Example */}
                          <s-box
                            style={{
                              padding: '12px',
                              backgroundColor: colorScheme === 'blue' ? '#eff6ff' : 
                                              colorScheme === 'green' ? '#ecfdf5' :
                                              colorScheme === 'purple' ? '#f3e8ff' :
                                              colorScheme === 'orange' ? '#fff7ed' :
                                              colorScheme === 'red' ? '#fef2f2' : '#eff6ff',
                              borderTop: `2px solid ${colorScheme === 'blue' ? '#3b82f6' : 
                                                           colorScheme === 'green' ? '#10b981' :
                                                           colorScheme === 'purple' ? '#8b5cf6' :
                                                           colorScheme === 'orange' ? '#f97316' :
                                                           colorScheme === 'red' ? '#ef4444' : '#3b82f6'}`
                            }}
                          >
                            <s-stack direction="inline" gap="base" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <s-stack direction="inline" gap="small-200" style={{ alignItems: 'center' }}>
                                <s-box
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: colorScheme === 'blue' ? '#3b82f6' : 
                                                    colorScheme === 'green' ? '#10b981' :
                                                    colorScheme === 'purple' ? '#8b5cf6' :
                                                    colorScheme === 'orange' ? '#f97316' :
                                                    colorScheme === 'red' ? '#ef4444' : '#3b82f6'
                                  }}
                                />
                                <s-text variant="bodySm" style={{ color: '#374151', fontWeight: '600' }}>
                                  {pricingRules[1]?.quantity || 5}+ items (Selected)
                                </s-text>
                              </s-stack>
                              <s-stack direction="inline" gap="small-200" style={{ alignItems: 'center' }}>
                                <s-text variant="bodySm" style={{ 
                                  color: colorScheme === 'blue' ? '#1e40af' : 
                                         colorScheme === 'green' ? '#059669' :
                                         colorScheme === 'purple' ? '#7c3aed' :
                                         colorScheme === 'orange' ? '#ea580c' :
                                         colorScheme === 'red' ? '#dc2626' : '#1e40af',
                                  fontWeight: '600'
                                }}>
                                  Save {globalDiscountType === "amount" ? "$" : ""}{pricingRules[1]?.discountValue || 10}{globalDiscountType === "percentage" ? "%" : ""}!
                                </s-text>
                              </s-stack>
                            </s-stack>
                          </s-box>
                        </s-box>
                      </s-stack>
                    </s-box>
                  ) : (
                    <s-box style={{ backgroundColor: '#ffffff' }}>
                      <s-stack direction="block" gap="tight">
                        <s-text variant="bodySm" fontWeight="semibold" style={{ 
                          color: colorScheme === 'blue' ? '#1e40af' : 
                                 colorScheme === 'green' ? '#059669' :
                                 colorScheme === 'purple' ? '#7c3aed' :
                                 colorScheme === 'orange' ? '#ea580c' :
                                 colorScheme === 'red' ? '#dc2626' : '#1e40af',
                          marginBottom: '8px'
                        }}>
                          🎛️ Interactive Pricing
                        </s-text>
                        
                        {/* Realistic Slider Interface */}
                        <s-box
                          style={{
                            border: `2px solid ${colorScheme === 'blue' ? '#3b82f6' : 
                                                   colorScheme === 'green' ? '#10b981' :
                                                   colorScheme === 'purple' ? '#8b5cf6' :
                                                   colorScheme === 'orange' ? '#f97316' :
                                                   colorScheme === 'red' ? '#ef4444' : '#3b82f6'}`,
                            borderRadius: '8px',
                            padding: '16px',
                            backgroundColor: colorScheme === 'blue' ? '#f0f9ff' : 
                                           colorScheme === 'green' ? '#f0fdf4' :
                                           colorScheme === 'purple' ? '#faf5ff' :
                                           colorScheme === 'orange' ? '#fff7ed' :
                                           colorScheme === 'red' ? '#fef2f2' : '#f0f9ff'
                          }}
                        >
                          <s-stack direction="block" gap="tight">
                            <s-text variant="bodySm" style={{ color: '#374151', textAlign: 'center' }}>
                              Quantity: <span style={{ fontWeight: '600' }}>5</span> items
                            </s-text>
                            
                            {/* Slider Visual */}
                            <s-box
                              style={{
                                height: '8px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                position: 'relative',
                                margin: '8px 0'
                              }}
                            >
                              <s-box
                                style={{
                                  width: '40%',
                                  height: '100%',
                                  backgroundColor: colorScheme === 'blue' ? '#3b82f6' : 
                                                 colorScheme === 'green' ? '#10b981' :
                                                 colorScheme === 'purple' ? '#8b5cf6' :
                                                 colorScheme === 'orange' ? '#f97316' :
                                                 colorScheme === 'red' ? '#ef4444' : '#3b82f6',
                                  borderRadius: '4px'
                                }}
                              />
                              <s-box
                                style={{
                                  position: 'absolute',
                                  top: '-4px',
                                  left: '40%',
                                  width: '16px',
                                  height: '16px',
                                  backgroundColor: colorScheme === 'blue' ? '#3b82f6' : 
                                                 colorScheme === 'green' ? '#10b981' :
                                                 colorScheme === 'purple' ? '#8b5cf6' :
                                                 colorScheme === 'orange' ? '#f97316' :
                                                 colorScheme === 'red' ? '#ef4444' : '#3b82f6',
                                  borderRadius: '50%',
                                  border: '2px solid white',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                              />
                            </s-box>
                            
                            <s-text variant="bodySm" style={{ 
                              color: colorScheme === 'blue' ? '#1e40af' : 
                                     colorScheme === 'green' ? '#059669' :
                                     colorScheme === 'purple' ? '#7c3aed' :
                                     colorScheme === 'orange' ? '#ea580c' :
                                     colorScheme === 'red' ? '#dc2626' : '#1e40af',
                              textAlign: 'center',
                              fontWeight: '600'
                            }}>
                              You save: {globalDiscountType === "amount" ? "$" : ""}{pricingRules[1]?.discountValue || 0}{globalDiscountType === "percentage" ? "%" : ""} per item!
                            </s-text>
                          </s-stack>
                        </s-box>
                      </s-stack>
                    </s-box>
                  )}
                </s-stack>
              </s-box>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      {fetcher.data?.success && (
        <s-banner status="success">
          <s-text variant="bodyMd">Volume pricing rules saved successfully!</s-text>
        </s-banner>
      )}
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
