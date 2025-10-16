# Volume Pricing Integration Test

## 🧪 **Testing Your Volume Pricing Integration**

### **Step 1: Verify Your Volume Pricing Model**

1. **Go to your admin**: `/app/volume-pricing`
2. **Check that you have an active model** for your gift card product
3. **Make sure the model is toggled "ON"** (green status)

### **Step 2: Test the API Endpoint**

Test if the API is working by visiting this URL in your browser:
```
https://your-app-url.com/apps/volume-pricing/api/display?productId=gid://shopify/Product/YOUR_GIFT_CARD_PRODUCT_ID
```

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

### **Step 3: Quick Theme Integration Test**

Add this simple test code to your product template to see if it works:

```html
<!-- Add this to your product template (product.liquid) -->
<div id="volume-pricing-test"></div>

<script>
// Quick test script
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
            <h3>Volume Pricing Found!</h3>
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
        testDiv.innerHTML = '<p style="color: #ef4444;">No active volume pricing found for this product.</p>';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      testDiv.innerHTML = '<p style="color: #ef4444;">Error loading volume pricing: ' + error.message + '</p>';
    });
});
</script>
```

### **Step 4: Check Browser Console**

1. **Open your browser's developer tools** (F12)
2. **Go to the Console tab**
3. **Look for any errors** related to volume pricing
4. **Check the Network tab** to see if the API call is being made

### **Step 5: Common Issues & Solutions**

#### **Issue: "No active volume pricing found"**
- **Solution**: Make sure your volume pricing model is active and associated with the gift card product

#### **Issue: "Error loading volume pricing"**
- **Solution**: Check that the API endpoint is accessible and the app is properly deployed

#### **Issue: "No product ID found"**
- **Solution**: The script can't find the product ID. Try adding this to your product template:
  ```liquid
  <script>
    window.Shopify = window.Shopify || {};
    window.Shopify.product = window.Shopify.product || { id: {{ product.id }} };
  </script>
  ```

#### **Issue: API returns 404 or 500 error**
- **Solution**: Check that your app is properly deployed and the API route is accessible

### **Step 6: Full Integration**

Once the test works, replace the test code with the full integration code from `THEME_INTEGRATION.md`.

## 🎯 **Expected Result**

When everything is working correctly, you should see:
- Volume pricing badges/table/slider on your gift card product page
- Real-time price calculations based on quantity
- Responsive design that works on mobile and desktop
- No JavaScript errors in the console

## 🚨 **Still Not Working?**

If you're still having issues:

1. **Check the browser console** for specific error messages
2. **Verify the API endpoint** is returning data
3. **Make sure the product is associated** with an active volume pricing model
4. **Check that the model is active** in the admin interface
5. **Try the simple test code first** before implementing the full integration

The most common issue is that the volume pricing model isn't properly associated with the product or isn't active.
