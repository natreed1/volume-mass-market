import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

// Re-export the complete volume pricing page
export { default } from './app.volume-pricing-simple.jsx';

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};