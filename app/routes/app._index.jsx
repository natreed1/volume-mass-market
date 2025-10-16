import { useEffect } from "react";
import { useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the volume pricing page
    navigate("/app/volume-pricing");
  }, [navigate]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <p>Redirecting to Volume Pricing...</p>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};