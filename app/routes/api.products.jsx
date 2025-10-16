import { json } from "@remix-run/node";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

// Products API route for fetching Shopify products
export async function loader({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    
    // Fetch products from Shopify
    const response = await admin.graphql(`
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                  }
                }
              }
            }
          }
        }
      }
    `, {
      variables: { first: 50 }
    });
    
    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return json({ error: 'Failed to fetch products' }, { status: 500 });
    }
    
    const products = data.data.products.edges.map(edge => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      variants: edge.node.variants.edges.map(variantEdge => ({
        id: variantEdge.node.id,
        title: variantEdge.node.title,
        price: variantEdge.node.price
      }))
    }));
    
    return json(products);
  } catch (error) {
    console.error('Products API error:', error);
    return json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
