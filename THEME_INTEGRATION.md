# Volume Pricing Theme Integration Guide

## 🚀 **Quick Integration Steps**

To get volume pricing working on your storefront, follow these steps:

### **Step 1: Add the JavaScript File**

1. **Download the volume pricing script**:
   - Go to: `https://your-app-url.com/volume-pricing.js`
   - Save it as `volume-pricing.js` in your theme's `assets` folder

2. **Add to your theme's `theme.liquid` file**:
   ```liquid
   <!-- Add this before the closing </head> tag -->
   <link rel="stylesheet" href="{{ 'volume-pricing.css' | asset_url }}">
   <script src="{{ 'volume-pricing.js' | asset_url }}" defer></script>
   ```

### **Step 2: Add the CSS File**

1. **Download the volume pricing styles**:
   - Go to: `https://your-app-url.com/volume-pricing.css`
   - Save it as `volume-pricing.css` in your theme's `assets` folder

### **Step 3: Alternative - Direct Integration**

If you prefer to add the code directly to your theme, add this to your product template:

```liquid
<!-- Add this in your product template (product.liquid or product-form.liquid) -->
<div id="volume-pricing-container"></div>

<script>
// Volume Pricing Integration
(function() {
  'use strict';
  
  const CONFIG = {
    apiEndpoint: '/apps/volume-pricing/api/display',
    displayStyle: 'BADGE_ROW', // Change to: BADGE_ROW, TIER_TABLE, SLIDER, DROPDOWN, GRID, INLINE_BANNER
    showPerUnit: true,
    showCompareAt: false,
    badgeTone: 'success' // success, attention, info, subdued
  };
  
  document.addEventListener('DOMContentLoaded', function() {
    initVolumePricing();
  });
  
  function initVolumePricing() {
    const productContainer = document.querySelector('[data-product-id]') || 
                           document.querySelector('.product-form') ||
                           document.querySelector('.product-single');
    
    if (!productContainer) return;
    
    const productId = window.Shopify?.product?.id ||
                     document.querySelector('[data-product-id]')?.dataset.productId;
    
    if (!productId) return;
    
    const volumeContainer = createVolumeContainer(productId);
    const addToCartButton = productContainer.querySelector('[name="add"]') ||
                           productContainer.querySelector('.btn-cart');
    
    if (addToCartButton) {
      addToCartButton.parentNode.insertBefore(volumeContainer, addToCartButton);
    } else {
      productContainer.appendChild(volumeContainer);
    }
    
    loadVolumePricing(productId, volumeContainer);
  }
  
  function createVolumeContainer(productId) {
    const container = document.createElement('div');
    container.id = `volume-pricing-${productId}`;
    container.className = 'volume-pricing-container';
    container.innerHTML = `
      <div class="volume-pricing-loading">
        <div class="loading-spinner"></div>
        <span>Loading volume pricing...</span>
      </div>
    `;
    return container;
  }
  
  function loadVolumePricing(productId, container) {
    const apiUrl = `${CONFIG.apiEndpoint}?productId=gid://shopify/Product/${productId}`;
    
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        if (data.active && data.tiers && data.tiers.length > 0) {
          renderVolumePricing(container, data);
        } else {
          container.style.display = 'none';
        }
      })
      .catch(error => {
        console.error('Volume Pricing Error:', error);
        container.style.display = 'none';
      });
  }
  
  function renderVolumePricing(container, data) {
    const style = data.displaySettings?.style || CONFIG.displayStyle;
    const showPerUnit = data.displaySettings?.showPerUnit ?? CONFIG.showPerUnit;
    const badgeTone = data.displaySettings?.badgeTone || CONFIG.badgeTone;
    
    container.innerHTML = '';
    
    if (style === 'BADGE_ROW') {
      container.innerHTML = renderBadgeRow(data.tiers, showPerUnit, badgeTone);
    } else if (style === 'TIER_TABLE') {
      container.innerHTML = renderTierTable(data.tiers, showPerUnit);
    } else if (style === 'INLINE_BANNER') {
      container.innerHTML = renderInlineBanner(data.tiers);
    }
  }
  
  function renderBadgeRow(tiers, showPerUnit, badgeTone) {
    const badgeColors = {
      success: '#008060',
      attention: '#FF8C00',
      info: '#0066CC',
      subdued: '#6B7280'
    };
    
    const color = badgeColors[badgeTone] || badgeColors.success;
    
    return `
      <div class="volume-pricing-badge-row">
        ${tiers.map(tier => `
          <div class="volume-pricing-badge" style="background-color: ${color}; color: white; padding: 0.75rem; border-radius: 8px; text-align: center; min-width: 120px;">
            <div style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem;">${tier.minQty}+ units</div>
            <div style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.25rem;">
              ${formatPrice(calculatePrice(tier))}
              ${showPerUnit ? '<span style="font-size: 0.75rem; opacity: 0.8;">/unit</span>' : ''}
            </div>
            <div style="font-size: 0.75rem; font-weight: 500; opacity: 0.9;">Save ${formatPrice(getSavings(tier))}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  function renderTierTable(tiers, showPerUnit) {
    return `
      <div style="margin: 1rem 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <h4 style="margin: 0; padding: 1rem; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 1rem; font-weight: 600;">Volume Pricing</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; font-size: 0.875rem; color: #374151;">Quantity</th>
              <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; font-size: 0.875rem; color: #374151;">Price</th>
              ${showPerUnit ? '<th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; font-size: 0.875rem; color: #374151;">Per Unit</th>' : ''}
              <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; font-size: 0.875rem; color: #374151;">You Save</th>
            </tr>
          </thead>
          <tbody>
            ${tiers.map(tier => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 0.75rem 1rem;">${tier.minQty}+</td>
                <td style="padding: 0.75rem 1rem;">${formatPrice(calculatePrice(tier))}</td>
                ${showPerUnit ? `<td style="padding: 0.75rem 1rem;">${formatPrice(calculatePrice(tier) / tier.minQty)}</td>` : ''}
                <td style="padding: 0.75rem 1rem;">${formatPrice(getSavings(tier))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  function renderInlineBanner(tiers) {
    const bestTier = tiers.reduce((best, tier) => 
      getSavings(tier) > getSavings(best) ? tier : best
    );
    
    return `
      <div style="margin: 1rem 0; padding: 0.75rem 1rem; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border-radius: 8px; text-align: center;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-weight: 600; font-size: 0.875rem;">
            Buy ${bestTier.minQty}+ and save ${formatPrice(getSavings(bestTier))}!
          </span>
          <span style="background-color: rgba(255, 255, 255, 0.2); padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer;">
            View Details
          </span>
        </div>
      </div>
    `;
  }
  
  function getBasePrice() {
    const priceElement = document.querySelector('.price .money') ||
                        document.querySelector('.product-price .money') ||
                        document.querySelector('[data-price]');
    
    if (priceElement) {
      const priceText = priceElement.textContent || priceElement.dataset.price;
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      return isNaN(price) ? 29.99 : price;
    }
    
    return 29.99;
  }
  
  function calculatePrice(tier) {
    if (!tier) return getBasePrice();
    
    const basePrice = getBasePrice();
    if (tier.discountType === 'PERCENT') {
      return basePrice * (1 - tier.discountValue / 100);
    } else if (tier.discountType === 'AMOUNT') {
      return Math.max(0, basePrice - tier.discountValue);
    } else if (tier.discountType === 'FIXED_PRICE') {
      return tier.discountValue;
    }
    return basePrice;
  }
  
  function getSavings(tier) {
    if (!tier) return 0;
    const basePrice = getBasePrice();
    const discountedPrice = calculatePrice(tier);
    return basePrice - discountedPrice;
  }
  
  function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }
})();
</script>

<style>
/* Add this CSS to your theme's stylesheet */
.volume-pricing-container {
  margin: 1rem 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.volume-pricing-loading {
  text-align: center;
  padding: 1rem;
  color: #6b7280;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.volume-pricing-badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}

.volume-pricing-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
  min-width: 120px;
  text-align: center;
}

.volume-pricing-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
  .volume-pricing-badge-row {
    flex-direction: column;
  }
  
  .volume-pricing-badge {
    min-width: auto;
  }
}
</style>
```

## 🔧 **Configuration Options**

You can customize the display by changing these values in the script:

- **`displayStyle`**: `'BADGE_ROW'`, `'TIER_TABLE'`, `'SLIDER'`, `'DROPDOWN'`, `'GRID'`, `'INLINE_BANNER'`
- **`showPerUnit`**: `true` or `false`
- **`showCompareAt`**: `true` or `false`
- **`badgeTone`**: `'success'`, `'attention'`, `'info'`, `'subdued'`

## 🎯 **Testing**

1. **Create a volume pricing model** in your admin
2. **Associate it with your gift card product**
3. **Activate the model**
4. **Visit the product page** - you should see the volume pricing display

## 🚨 **Troubleshooting**

If volume pricing doesn't show up:

1. **Check the browser console** for JavaScript errors
2. **Verify the API endpoint** is accessible: `https://your-app-url.com/apps/volume-pricing/api/display?productId=gid://shopify/Product/YOUR_PRODUCT_ID`
3. **Make sure the product is associated** with an active volume pricing model
4. **Check that the model is active** in the admin interface

## 📱 **Mobile Responsive**

The volume pricing display is fully responsive and will adapt to mobile devices automatically.
