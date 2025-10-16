// Volume Pricing Display Script
// Add this to your theme's product template

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    apiEndpoint: '/apps/volume-pricing/api/display',
    displayStyle: 'BADGE_ROW', // Change this to your preferred style
    showPerUnit: true,
    showCompareAt: false,
    badgeTone: 'success'
  };
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initVolumePricing();
  });
  
  function initVolumePricing() {
    // Find the product container
    const productContainer = document.querySelector('[data-product-id]') || 
                           document.querySelector('.product-form') ||
                           document.querySelector('.product-single');
    
    if (!productContainer) {
      console.log('Volume Pricing: Product container not found');
      return;
    }
    
    // Get product ID from various possible sources
    const productId = getProductId();
    if (!productId) {
      console.log('Volume Pricing: Product ID not found');
      return;
    }
    
    // Create volume pricing container
    const volumePricingContainer = createVolumePricingContainer(productId);
    
    // Insert before the add to cart button
    const addToCartButton = productContainer.querySelector('[name="add"]') ||
                           productContainer.querySelector('.btn-cart') ||
                           productContainer.querySelector('.product-form__cart-submit');
    
    if (addToCartButton) {
      addToCartButton.parentNode.insertBefore(volumePricingContainer, addToCartButton);
    } else {
      productContainer.appendChild(volumePricingContainer);
    }
    
    // Load volume pricing data
    loadVolumePricing(productId, volumePricingContainer);
  }
  
  function getProductId() {
    // Try multiple ways to get the product ID
    const productId = window.Shopify?.product?.id ||
                     document.querySelector('[data-product-id]')?.dataset.productId ||
                     document.querySelector('meta[property="product:id"]')?.content ||
                     document.querySelector('meta[name="product:id"]')?.content;
    
    return productId ? `gid://shopify/Product/${productId}` : null;
  }
  
  function createVolumePricingContainer(productId) {
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
    const apiUrl = `${CONFIG.apiEndpoint}?productId=${encodeURIComponent(productId)}`;
    
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
    const showCompareAt = data.displaySettings?.showCompareAt ?? CONFIG.showCompareAt;
    const badgeTone = data.displaySettings?.badgeTone || CONFIG.badgeTone;
    
    container.innerHTML = '';
    
    switch (style) {
      case 'TIER_TABLE':
        container.innerHTML = renderTierTable(data.tiers, showPerUnit);
        break;
      case 'SLIDER':
        container.innerHTML = renderSlider(data.tiers, showPerUnit);
        break;
      case 'DROPDOWN':
        container.innerHTML = renderDropdown(data.tiers, showPerUnit);
        break;
      case 'GRID':
        container.innerHTML = renderGrid(data.tiers, showPerUnit, badgeTone);
        break;
      case 'INLINE_BANNER':
        container.innerHTML = renderInlineBanner(data.tiers);
        break;
      case 'BADGE_ROW':
      default:
        container.innerHTML = renderBadgeRow(data.tiers, showPerUnit, badgeTone);
        break;
    }
    
    // Add event listeners for interactive elements
    addEventListeners(container, data.tiers);
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
          <div class="volume-pricing-badge" style="background-color: ${color}; color: white;">
            <div class="badge-quantity">${tier.minQty}+ units</div>
            <div class="badge-price">
              ${formatPrice(calculatePrice(tier))}
              ${showPerUnit ? '<span class="per-unit">/unit</span>' : ''}
            </div>
            <div class="badge-savings">Save ${formatPrice(getSavings(tier))}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  function renderTierTable(tiers, showPerUnit) {
    return `
      <div class="volume-pricing-table">
        <h4>Volume Pricing</h4>
        <table>
          <thead>
            <tr>
              <th>Quantity</th>
              <th>Price</th>
              ${showPerUnit ? '<th>Per Unit</th>' : ''}
              <th>You Save</th>
            </tr>
          </thead>
          <tbody>
            ${tiers.map(tier => `
              <tr>
                <td>${tier.minQty}+</td>
                <td>${formatPrice(calculatePrice(tier))}</td>
                ${showPerUnit ? `<td>${formatPrice(calculatePrice(tier) / tier.minQty)}</td>` : ''}
                <td>${formatPrice(getSavings(tier))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  function renderSlider(tiers, showPerUnit) {
    return `
      <div class="volume-pricing-slider">
        <h4>Quantity Discount</h4>
        <div class="slider-container">
          <input type="range" min="1" max="100" value="1" class="quantity-slider" id="quantity-slider">
          <div class="slider-labels">
            <span>1</span>
            <span>100+</span>
          </div>
        </div>
        <div class="current-pricing">
          <div class="quantity-display">Quantity: <span id="current-quantity">1</span></div>
          <div class="price-display">
            <span class="current-price" id="current-price">${formatPrice(getBasePrice())}</span>
            <span class="savings" id="current-savings" style="display: none;"></span>
          </div>
        </div>
      </div>
    `;
  }
  
  function renderDropdown(tiers, showPerUnit) {
    return `
      <div class="volume-pricing-dropdown">
        <h4>Select Quantity</h4>
        <select class="quantity-select" id="quantity-select">
          ${Array.from({ length: 50 }, (_, i) => i + 1).map(qty => 
            `<option value="${qty}">${qty} ${qty === 1 ? 'unit' : 'units'}</option>`
          ).join('')}
          <option value="100">100+ units</option>
        </select>
        <div class="pricing-info">
          <div class="price" id="dropdown-price">${formatPrice(getBasePrice())}</div>
          <div class="savings" id="dropdown-savings" style="display: none;"></div>
        </div>
      </div>
    `;
  }
  
  function renderGrid(tiers, showPerUnit, badgeTone) {
    const badgeColors = {
      success: '#008060',
      attention: '#FF8C00',
      info: '#0066CC',
      subdued: '#6B7280'
    };
    
    const color = badgeColors[badgeTone] || badgeColors.success;
    
    return `
      <div class="volume-pricing-grid">
        <h4>Choose Your Quantity</h4>
        <div class="pricing-grid">
          ${tiers.map(tier => `
            <div class="pricing-option" data-quantity="${tier.minQty}">
              <div class="option-quantity">${tier.minQty}+</div>
              <div class="option-price">${formatPrice(calculatePrice(tier))}</div>
              <div class="option-savings">Save ${formatPrice(getSavings(tier))}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  function renderInlineBanner(tiers) {
    const bestTier = tiers.reduce((best, tier) => 
      getSavings(tier) > getSavings(best) ? tier : best
    );
    
    return `
      <div class="volume-pricing-banner">
        <div class="banner-content">
          <span class="banner-text">
            Buy ${bestTier.minQty}+ and save ${formatPrice(getSavings(bestTier))}!
          </span>
          <span class="banner-cta">View Details</span>
        </div>
      </div>
    `;
  }
  
  function addEventListeners(container, tiers) {
    // Slider functionality
    const slider = container.querySelector('.quantity-slider');
    if (slider) {
      slider.addEventListener('input', function() {
        updateSliderPricing(this.value, tiers);
      });
    }
    
    // Dropdown functionality
    const dropdown = container.querySelector('.quantity-select');
    if (dropdown) {
      dropdown.addEventListener('change', function() {
        updateDropdownPricing(this.value, tiers);
      });
    }
    
    // Grid option selection
    const options = container.querySelectorAll('.pricing-option');
    options.forEach(option => {
      option.addEventListener('click', function() {
        options.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }
  
  function updateSliderPricing(quantity, tiers) {
    const currentQuantity = document.getElementById('current-quantity');
    const currentPrice = document.getElementById('current-price');
    const currentSavings = document.getElementById('current-savings');
    
    if (currentQuantity) currentQuantity.textContent = quantity;
    
    const tier = getApplicableTier(parseInt(quantity), tiers);
    const price = calculatePrice(tier);
    const savings = getSavings(tier);
    
    if (currentPrice) currentPrice.textContent = formatPrice(price);
    if (currentSavings) {
      if (savings > 0) {
        currentSavings.textContent = `Save ${formatPrice(savings)} (${Math.round((savings / getBasePrice()) * 100)}%)`;
        currentSavings.style.display = 'block';
      } else {
        currentSavings.style.display = 'none';
      }
    }
  }
  
  function updateDropdownPricing(quantity, tiers) {
    const dropdownPrice = document.getElementById('dropdown-price');
    const dropdownSavings = document.getElementById('dropdown-savings');
    
    const tier = getApplicableTier(parseInt(quantity), tiers);
    const price = calculatePrice(tier);
    const savings = getSavings(tier);
    
    if (dropdownPrice) dropdownPrice.textContent = formatPrice(price);
    if (dropdownSavings) {
      if (savings > 0) {
        dropdownSavings.textContent = `Save ${formatPrice(savings)}`;
        dropdownSavings.style.display = 'block';
      } else {
        dropdownSavings.style.display = 'none';
      }
    }
  }
  
  // Helper functions
  function getBasePrice() {
    // Try to get the current product price
    const priceElement = document.querySelector('.price .money') ||
                        document.querySelector('.product-price .money') ||
                        document.querySelector('[data-price]');
    
    if (priceElement) {
      const priceText = priceElement.textContent || priceElement.dataset.price;
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      return isNaN(price) ? 29.99 : price;
    }
    
    return 29.99; // Fallback price
  }
  
  function getApplicableTier(quantity, tiers) {
    const sortedTiers = [...tiers].sort((a, b) => b.minQty - a.minQty);
    return sortedTiers.find(tier => quantity >= tier.minQty && (!tier.maxQty || quantity <= tier.maxQty));
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
