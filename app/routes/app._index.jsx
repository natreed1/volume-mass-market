import { useState, useEffect } from "react";
import { useFetcher, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  // Get existing products for volume pricing setup
  const response = await admin.graphql(
    `#graphql
      query getProducts {
        products(first: 50) {
          edges {
            node {
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
                    compareAtPrice
                  }
                }
              }
            }
          }
        }
      }`
  );
  
  const responseJson = await response.json();
  return {
    products: responseJson.data.products.edges.map(edge => edge.node)
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.products) {
      shopify.toast.show("Products loaded successfully");
    }
  }, [fetcher.data?.products, shopify]);

  const loadProducts = () => fetcher.submit({}, { method: "POST" });

  const selectProduct = (product) => {
    navigate("/app/volume-pricing", { 
      state: { selectedProduct: product } 
    });
  };

  return (
    <s-page heading="Volume Pricing Manager">
      <s-button slot="primary-action" onClick={() => navigate("/app/volume-pricing")}>
        Create New Rule
      </s-button>
      <s-button slot="secondary-actions" onClick={loadProducts}>
        Load Products
      </s-button>

      {/* Welcome Section */}
      <s-section>
        <s-grid gap="base">
          <s-heading>Welcome to Volume Pricing Manager</s-heading>
          <s-paragraph>
            Create volume pricing rules to encourage customers to buy more and increase your average order value.
          </s-paragraph>
        </s-grid>
      </s-section>

      {/* Quick Stats */}
      <s-section>
        <s-grid
          gridTemplateColumns="@container (inline-size <= 400px) 1fr, 1fr auto 1fr auto 1fr"
          gap="small"
        >
          <s-box
            paddingBlock="small-400"
            paddingInline="small-100"
            borderRadius="base"
            border="base"
          >
            <s-grid gap="small-300">
              <s-heading>Products Available</s-heading>
              <s-text>{fetcher.data?.products?.length || 0}</s-text>
            </s-grid>
          </s-box>
          <s-divider direction="block"></s-divider>
          <s-box
            paddingBlock="small-400"
            paddingInline="small-100"
            borderRadius="base"
            border="base"
          >
            <s-grid gap="small-300">
              <s-heading>Active Rules</s-heading>
              <s-text>0</s-text>
            </s-grid>
          </s-box>
          <s-divider direction="block"></s-divider>
          <s-box
            paddingBlock="small-400"
            paddingInline="small-100"
            borderRadius="base"
            border="base"
          >
            <s-grid gap="small-300">
              <s-heading>Avg. Order Value</s-heading>
              <s-text>$0</s-text>
            </s-grid>
          </s-box>
        </s-grid>
      </s-section>

      {/* Product List (if loaded) */}
      {fetcher.data?.products && fetcher.data.products.length > 0 && (
        <s-section>
          <s-heading>Your Products ({fetcher.data.products.length})</s-heading>
          <s-grid
            gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
            gap="base"
          >
            {fetcher.data.products.slice(0, 6).map((product) => {
              const firstVariant = product.variants.edges[0]?.node;
              const sellingPrice = parseFloat(firstVariant?.price || 0);
              // Cost data would come from Shopify's cost field - for now showing as not available
              const cost = 0; // parseFloat(firstVariant?.cost || 0);
              const margin = cost > 0 ? ((sellingPrice - cost) / sellingPrice * 100).toFixed(1) : 'N/A';
              const profit = cost > 0 ? (sellingPrice - cost).toFixed(2) : 'N/A';
              
              return (
                <s-box
                  key={product.id}
                  border="base"
                  borderRadius="base"
                  padding="base"
                  background="base"
                >
                  <s-grid gap="small-400">
                    <s-heading level="3">{product.title}</s-heading>
                    <s-text variant="bodyMd" tone="subdued">
                      {product.variants.edges.length} variant{product.variants.edges.length !== 1 ? 's' : ''}
                    </s-text>
                    <s-text variant="bodyMd" tone="subdued">
                      Status: {product.status}
                    </s-text>
                    
                    {/* Cost and Margin Information */}
                    <s-box
                      padding="small"
                      background="subdued"
                      borderRadius="base"
                    >
                      <s-grid gap="small-200">
                        <s-text variant="bodySm" fontWeight="semibold">Pricing Info:</s-text>
                        <s-grid gap="small-100">
                          <s-stack direction="inline" gap="small-200" style={{ justifyContent: 'space-between' }}>
                            <s-text variant="bodySm">Selling Price:</s-text>
                            <s-text variant="bodySm" fontWeight="semibold">${sellingPrice.toFixed(2)}</s-text>
                          </s-stack>
                          <s-stack direction="inline" gap="small-200" style={{ justifyContent: 'space-between' }}>
                            <s-text variant="bodySm">Cost:</s-text>
                            <s-text variant="bodySm" fontWeight="semibold">
                              {cost > 0 ? `$${cost.toFixed(2)}` : 'Not set'}
                            </s-text>
                          </s-stack>
                          <s-stack direction="inline" gap="small-200" style={{ justifyContent: 'space-between' }}>
                            <s-text variant="bodySm">Margin:</s-text>
                            <s-text variant="bodySm" fontWeight="semibold" tone={margin !== 'N/A' ? (margin >= 50 ? 'success' : margin >= 30 ? 'warning' : 'critical') : 'neutral'}>
                              {margin !== 'N/A' ? `${margin}%` : 'N/A'}
                            </s-text>
                          </s-stack>
                          <s-stack direction="inline" gap="small-200" style={{ justifyContent: 'space-between' }}>
                            <s-text variant="bodySm">Profit:</s-text>
                            <s-text variant="bodySm" fontWeight="semibold" tone={profit !== 'N/A' ? (parseFloat(profit) > 0 ? 'success' : 'critical') : 'neutral'}>
                              {profit !== 'N/A' ? `$${profit}` : 'N/A'}
                            </s-text>
                          </s-stack>
                        </s-grid>
                      </s-grid>
                    </s-box>
                    
                    <s-stack direction="inline" gap="small-200">
                      <s-button 
                        size="micro" 
                        variant="primary"
                        onClick={() => selectProduct(product)}
                      >
                        Setup Pricing
                      </s-button>
                      <s-button
                        size="micro"
                        variant="tertiary"
                        onClick={() => {
                          shopify.intents.invoke?.("edit:shopify/Product", {
                            value: product.id,
                          });
                        }}
                      >
                        Edit Product
                      </s-button>
                    </s-stack>
                  </s-grid>
                </s-box>
              );
            })}
          </s-grid>
          {fetcher.data.products.length > 6 && (
            <s-stack
              direction="inline"
              alignItems="center"
              justifyContent="center"
              paddingBlockStart="base"
            >
              <s-link href="#" onClick={() => shopify.toast.show("Load more products feature coming soon!")}>
                View all {fetcher.data.products.length} products
              </s-link>
            </s-stack>
          )}
        </s-section>
      )}

      {/* Pricing Rules Section */}
      <s-section>
        <s-grid
          gridTemplateColumns="1fr auto"
          gap="small-300"
          alignItems="center"
        >
          <s-heading>Pricing Rules</s-heading>
          <s-button
            variant="primary"
            onClick={() => navigate("/app/volume-pricing")}
          >
            Manage Rules
          </s-button>
        </s-grid>
        
        <s-box
          border="base"
          borderRadius="base"
          padding="large"
          background="subdued"
          textAlign="center"
        >
          <s-grid gap="small-400" alignItems="center">
            <s-icon type="discount" size="large" />
            <s-heading level="3">No Pricing Rules Yet</s-heading>
            <s-paragraph>
              Create your first volume pricing rule to start boosting sales with bulk discounts.
            </s-paragraph>
            <s-button 
              variant="primary"
              onClick={() => navigate("/app/volume-pricing")}
            >
              Create First Rule
            </s-button>
          </s-grid>
        </s-box>
      </s-section>

      {/* Features Section */}
      <s-section>
        <s-heading>Why Volume Pricing?</s-heading>
        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))"
          gap="base"
        >
          <s-grid
            background="base"
            border="base"
            borderRadius="base"
            padding="base"
            gap="small-400"
          >
            <s-icon type="discount" size="large" />
            <s-heading level="3">Increase Sales</s-heading>
            <s-paragraph>
              Encourage customers to buy more with attractive bulk discounts that increase your average order value.
            </s-paragraph>
          </s-grid>
          <s-grid
            background="base"
            border="base"
            borderRadius="base"
            padding="base"
            gap="small-400"
          >
            <s-icon type="chart-line" size="large" />
            <s-heading level="3">Boost Revenue</s-heading>
            <s-paragraph>
              Higher order values mean more revenue per customer and better inventory turnover for your business.
            </s-paragraph>
          </s-grid>
          <s-grid
            background="base"
            border="base"
            borderRadius="base"
            padding="base"
            gap="small-400"
          >
            <s-icon type="check-circle" size="large" />
            <s-heading level="3">Easy Setup</s-heading>
            <s-paragraph>
              Simple configuration with automatic discount application at checkout - no coding required.
            </s-paragraph>
          </s-grid>
        </s-grid>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};