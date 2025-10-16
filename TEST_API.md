# Test Your Volume Pricing API

## 🧪 **Direct API Test**

Test if your volume pricing API is working by visiting this URL in your browser:

```
https://your-app-url.com/apps/volume-pricing/api/display?productId=gid://shopify/Product/YOUR_GIFT_CARD_PRODUCT_ID
```

Replace `YOUR_GIFT_CARD_PRODUCT_ID` with your actual gift card product ID.

**Expected Response:**
```json
{
  "active": true,
  "name": "Your Model Name",
  "tiers": [
    {
      "minQty": 5,
      "maxQty": null,
      "discountType": "PERCENT",
      "discountValue": 10
    }
  ],
  "displaySettings": {
    "style": "BADGE_ROW",
    "showPerUnit": true,
    "showCompareAt": false,
    "badgeTone": "success"
  }
}
```

## 🔍 **Quick Manual Test**

Add this simple test code to your product template to see if it works:

```html
<div id="volume-pricing-test"></div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const productId = window.Shopify?.product?.id;
  if (!productId) {
    console.log('No product ID found');
    return;
  }
  
  const testDiv = document.getElementById('volume-pricing-test');
  testDiv.innerHTML = '<p>Testing volume pricing for product: ' + productId + '</p>';
  
  fetch(`/apps/volume-pricing/api/display?productId=gid://shopify/Product/${productId}`)
    .then(response => response.json())
    .then(data => {
      console.log('Volume pricing data:', data);
      if (data.active) {
        testDiv.innerHTML = `
          <div style="background: #f0f9ff; padding: 1rem; border: 1px solid #3b82f6; border-radius: 8px; margin: 1rem 0;">
            <h3>✅ Volume Pricing Found!</h3>
            <p><strong>Model:</strong> ${data.name}</p>
            <p><strong>Tiers:</strong> ${data.tiers.length}</p>
            <p><strong>Style:</strong> ${data.displaySettings.style}</p>
            <div style="margin-top: 1rem;">
              ${data.tiers.map(tier => `
                <div style="background: #059669; color: white; padding: 0.5rem; margin: 0.25rem; border-radius: 4px; display: inline-block;">
                  ${tier.minQty}+ units: ${tier.discountValue}${tier.discountType === 'PERCENT' ? '%' : '$'} off
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        testDiv.innerHTML = '<p style="color: #ef4444;">❌ No active volume pricing found for this product.</p>';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      testDiv.innerHTML = '<p style="color: #ef4444;">❌ Error loading volume pricing: ' + error.message + '</p>';
    });
});
</script>
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "No active volume pricing found"**
**Solution:** 
1. Go to `/app/volume-pricing` in your admin
2. Make sure you have a model for your gift card product
3. Toggle the model to "Active" (green)

### **Issue 2: "Error loading volume pricing"**
**Solution:**
1. Check that your app is properly deployed
2. Verify the API endpoint is accessible
3. Make sure the app is installed in your store

### **Issue 3: "No product ID found"**
**Solution:**
Add this to your product template:
```liquid
<script>
  window.Shopify = window.Shopify || {};
  window.Shopify.product = window.Shopify.product || { id: {{ product.id }} };
</script>
```

## 🎯 **Expected Result**

If everything is working, you should see:
- ✅ Volume pricing data in the console
- ✅ Green success message with your pricing tiers
- ✅ Volume pricing badges displayed on the product page

The console errors you're seeing are **not related to our volume pricing extension** - they're theme and Shopify admin interface issues that don't affect our functionality.
