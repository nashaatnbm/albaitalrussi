// ===== CART STATE =====
let cart = JSON.parse(sessionStorage.getItem(‘cart’) || ‘[]’);

const saveCart = () => sessionStorage.setItem(‘cart’, JSON.stringify(cart));

const updateCartUI = () => {
const count = cart.reduce((s, i) => s + i.qty, 0);
const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

const countEl = document.getElementById(‘cart-count’);
const totalEl = document.getElementById(‘cart-total’);
const itemsEl = document.getElementById(‘cart-items’);
const footerEl = document.getElementById(‘cart-footer’);

if (countEl) countEl.textContent = count;
if (totalEl) totalEl.textContent = total + ’ ريال’;

if (!itemsEl) return;

if (cart.length === 0) {
itemsEl.innerHTML = ‘<div class="cart-empty">السلة فارغة 🛒</div>’;
if (footerEl) footerEl.style.display = ‘none’;
return;
}

if (footerEl) footerEl.style.display = ‘block’;

itemsEl.innerHTML = cart.map((item, idx) => `<div class="cart-item"> <div class="cart-item-emoji">${item.emoji}</div> <div class="cart-item-info"> <div class="cart-item-name">${item.name}</div> <div class="cart-item-price">${item.price * item.qty} ريال</div> <div class="cart-item-controls"> <button class="cart-qty-btn" onclick="changeCartQty(${idx}, -1)">−</button> <span class="cart-item-qty">${item.qty}</span> <button class="cart-qty-btn" onclick="changeCartQty(${idx}, 1)">+</button> <button class="cart-item-remove" onclick="removeFromCart(${idx})">🗑️</button> </div> </div> </div>`).join(’’);
};

window.changeCartQty = (idx, delta) => {
cart[idx].qty += delta;
if (cart[idx].qty <= 0) cart.splice(idx, 1);
saveCart();
updateCartUI();
};

window.removeFromCart = (idx) => {
cart.splice(idx, 1);
saveCart();
updateCartUI();
};

document.addEventListener(‘DOMContentLoaded’, () => {
updateCartUI();

// ===== PRODUCT CARDS: qty control + add to cart =====
document.querySelectorAll(’.product-card’).forEach(card => {
const minusBtn = card.querySelector(’.qty-btn.minus’);
const plusBtn = card.querySelector(’.qty-btn.plus’);
const qtyDisplay = card.querySelector(’.qty-display’);
const addBtn = card.querySelector(’.btn-add-cart’);

```
if (!addBtn) return;

let qty = 1;

minusBtn.addEventListener('click', () => {
  if (qty > 1) { qty--; qtyDisplay.textContent = qty; }
});

plusBtn.addEventListener('click', () => {
  qty++;
  qtyDisplay.textContent = qty;
});

addBtn.addEventListener('click', () => {
  const id = parseInt(card.dataset.id);
  const name = card.dataset.name;
  const price = parseInt(card.dataset.price);
  const emoji = card.dataset.emoji;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, name, price, emoji, qty });
  }

  saveCart();
  updateCartUI();

  // Flash button
  addBtn.textContent = '✅ تمت الإضافة!';
  addBtn.classList.add('added');
  setTimeout(() => {
    addBtn.textContent = '🛒 أضف للسلة';
    addBtn.classList.remove('added');
    qty = 1;
    qtyDisplay.textContent = 1;
  }, 1200);

  // Open cart
  openCart();
});
```

});

// ===== CART SIDEBAR =====
const sidebar = document.getElementById(‘cart-sidebar’);
const overlay = document.getElementById(‘cart-overlay’);
const floatBtn = document.getElementById(‘cart-float-btn’);
const closeBtn = document.getElementById(‘cart-close’);

const openCart = () => {
sidebar && sidebar.classList.add(‘open’);
overlay && overlay.classList.add(‘open’);
};
window.openCart = openCart;

const closeCart = () => {
sidebar && sidebar.classList.remove(‘open’);
overlay && overlay.classList.remove(‘open’);
};

if (floatBtn) floatBtn.addEventListener(‘click’, openCart);
if (closeBtn) closeBtn.addEventListener(‘click’, closeCart);
if (overlay) overlay.addEventListener(‘click’, closeCart);

// ===== GOTO CHECKOUT =====
const checkoutBtn = document.getElementById(‘btn-goto-checkout’);
if (checkoutBtn) {
checkoutBtn.addEventListener(‘click’, () => {
if (cart.length === 0) return;
// Build form and submit
const form = document.createElement(‘form’);
form.method = ‘POST’;
form.action = ‘/checkout/from-cart’;
form.style.display = ‘none’;

```
  cart.forEach((item, i) => {
    const addField = (name, val) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = val;
      form.appendChild(input);
    };
    addField(`items[${i}][productId]`, item.id);
    addField(`items[${i}][quantity]`, item.qty);
  });

  document.body.appendChild(form);
  form.submit();
});
```

}

// ===== ADMIN: Update Order Status =====
document.querySelectorAll(’.status-select’).forEach(select => {
select.addEventListener(‘change’, async function() {
const orderId = this.dataset.id;
const status = this.value;
const badge = this.closest(‘tr’)?.querySelector(’.status-badge’) ||
this.closest(’.order-list-card’)?.querySelector(’.status-badge’);

```
  try {
    const res = await fetch(`/admin/order/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      if (badge) {
        badge.className = 'status-badge status-' + status;
        const labels = { pending: 'قيد الانتظار', processing: 'قيد التنفيذ', completed: 'مكتمل', cancelled: 'ملغي' };
        badge.textContent = labels[status] || status;
      }
      showToast('✅ تم تحديث حالة الطلب');
    }
  } catch (e) {
    showToast('❌ فشل في التحديث', true);
  }
});
```

});

// ===== Toast =====
window.showToast = (msg, isError = false) => {
const toast = document.createElement(‘div’);
toast.style.cssText = `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: ${isError ? '#e05252' : '#4a9c5d'}; color: #fff; padding: 12px 24px; border-radius: 10px; font-size: 14px; z-index: 9999; font-family: 'Tajawal', sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.3);`;
toast.textContent = msg;
document.body.appendChild(toast);
setTimeout(() => toast.remove(), 2500);
};

// ===== AUTH TABS =====
const tabs = document.querySelectorAll(’.tab’);
const forms = document.querySelectorAll(’.auth-form’);
tabs.forEach(tab => {
tab.addEventListener(‘click’, () => {
tabs.forEach(t => t.classList.remove(‘active’));
forms.forEach(f => f.style.display = ‘none’);
tab.classList.add(‘active’);
const target = document.getElementById(‘form-’ + tab.dataset.tab);
if (target) target.style.display = ‘block’;
});
});
});