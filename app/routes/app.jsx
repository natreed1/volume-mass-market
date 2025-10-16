import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppBridgeProvider } from "../components/AppBridgeProvider";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop: session.shop
  };
};

export default function App() {
  const { apiKey, shop } = useLoaderData();

  return (
    <AppProvider 
      embedded 
      apiKey={apiKey}
      shop={shop}
    >
      <AppBridgeProvider apiKey={apiKey} shop={shop}>
        <s-app-nav>
          <s-link href="/app">Home</s-link>
          <s-link href="/app/volume-pricing">Volume Pricing</s-link>
        </s-app-nav>
        <Outlet />
      </AppBridgeProvider>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
