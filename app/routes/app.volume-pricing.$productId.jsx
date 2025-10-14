import { useState } from "react";
import { useLoaderData, useNavigate, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const { productId } = params;

  // Get the specific product details
  const response = await admin.graphql(
    `#graphql
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          status
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                sku
              }
            }
          }
        }
      }`,
    {
      variables: { id: productId }
    }
  );

  const responseJson = await response.json();
  const product = responseJson.data.product;

  return {
    product,
    // TODO: Load existing volume pricing rules for this product
    existingRules: []
  };
};

export const action = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const { productId } = params;
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "save_pricing_rules") {
    // TODO: Save volume pricing rules to database
    const rules = JSON.parse(formData.get("rules"));
    const displayType = formData.get("displayType");
    
    // For now, just return success
    return { success: true, rules, displayType };
  }

  return { success: false };
};

export default function VolumePricingConfig() {
  const { product, existingRules } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
  const [pricingRules, setPricingRules] = useState([
    { quantity: 1, discountType: "amount", discountValue: 0 },
    { quantity: 5, discountType: "percentage", discountValue: 10 },
    { quantity: 10, discountType: "percentage", discountValue: 15 },
  ]);
  
  const [displayType, setDisplayType] = useState("dropdown");

  const addPricingRule = () => {
    setPricingRules([...pricingRules, { quantity: "", discountType: "amount", discountValue: "" }]);
  };

  const updatePricingRule = (index, field, value) => {
    const updated = [...pricingRules];
    updated[index][field] = value;
    setPricingRules(updated);
  };

  const removePricingRule = (index) => {
    setPricingRules(pricingRules.filter((_, i) => i !== index));
  };

  const savePricingRules = () => {
    const formData = new FormData();
    formData.append("action", "save_pricing_rules");
    formData.append("rules", JSON.stringify(pricingRules));
    formData.append("displayType", displayType);
    
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <s-page heading={`Volume Pricing - ${product.title}`}>
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
        <s-stack direction="block" gap="base">
          <s-text variant="bodyLg" fontWeight="semibold">{product.title}</s-text>
          <s-text variant="bodyMd" tone="subdued">Handle: {product.handle}</s-text>
          <s-text variant="bodyMd">Variants: {product.variants.edges.length}</s-text>
        </s-stack>
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
              
              <s-table>
                <s-table-head>
                  <s-table-row>
                    <s-table-header>Quantity</s-table-header>
                    <s-table-header>Discount Type</s-table-header>
                    <s-table-header>Discount Value</s-table-header>
                    <s-table-header>Actions</s-table-header>
                  </s-table-row>
                </s-table-head>
                <s-table-body>
                  {pricingRules.map((rule, index) => (
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
                        <s-select
                          value={rule.discountType}
                          onChange={(e) => updatePricingRule(index, "discountType", e.target.value)}
                        >
                          <s-option value="amount">$ Amount Off</s-option>
                          <s-option value="percentage">% Percentage Off</s-option>
                        </s-select>
                      </s-table-cell>
                      <s-table-cell>
                        <s-text-field
                          type="number"
                          value={rule.discountValue}
                          onChange={(e) => updatePricingRule(index, "discountValue", parseFloat(e.target.value) || "")}
                          placeholder={rule.discountType === "amount" ? "0.00" : "0"}
                          prefix={rule.discountType === "amount" ? "$" : ""}
                          suffix={rule.discountType === "percentage" ? "%" : ""}
                        />
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
                  ))}
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

        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-stack direction="block" gap="base">
            <s-heading level="3">Customer Experience</s-heading>
            
            <s-stack direction="block" gap="tight">
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

            <s-box
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="base"
            >
              <s-text variant="bodyMd" fontWeight="semibold">Preview:</s-text>
              <s-text variant="bodyMd" tone="subdued">
                {displayType === "dropdown" 
                  ? "Customers will see a dropdown table with quantity and corresponding prices"
                  : "Customers will see an interactive slider that updates pricing as they adjust quantity"
                }
              </s-text>
            </s-box>
          </s-stack>
        </s-box>
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