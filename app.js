function isLoggedIn() {
  return localStorage.getItem("loggedInUser") !== null;
}

function getCart() {
  let storedCart = [];

  try {
    storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
  } catch (error) {
    console.error("Unable to read cart:", error);
    storedCart = [];
  }

  const normalizedCart = [];

  // Merge old duplicate cart rows into one row with a quantity.
  storedCart.forEach((item) => {
    if (!item || item.id === undefined || item.id === null) return;

    const existingItem = normalizedCart.find(
      (cartItem) => String(cartItem.id) === String(item.id)
    );

    const quantity = Math.max(1, Number(item.quantity) || 1);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      normalizedCart.push({
        ...item,
        price: Number(item.price) || 0,
        quantity
      });
    }
  });

  return normalizedCart;
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateHeader() {
  const nav = document.querySelector("header nav");
  if (!nav) return;

  const loggedInUser = localStorage.getItem("loggedInUser");

  if (loggedInUser) {
    const firstName = loggedInUser.split("@")[0];

    nav.innerHTML = `
      <a href="index.html">Home</a>
      <a href="products.html">Products</a>
      <a href="cart.html">Cart</a>
      <span>Welcome, ${firstName}</span>
      <a href="#" onclick="logoutUser(); return false;">Sign Out</a>
      <a href="admin.html">Admin</a>
    `;
  }
}

function logoutUser() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

function renderCart() {
  const cartContainer = document.getElementById("cartItems");
  if (!cartContainer) return;

  const cart = getCart();

  // Save the normalized cart so older duplicate items are permanently fixed.
  saveCart(cart);

  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="empty-cart">
        <p>Your cart is empty.</p>
        <a class="button" href="products.html">Continue Shopping</a>
      </div>
    `;
    return;
  }

  const grandTotal = cart.reduce((sum, item) => {
    return sum + Number(item.price) * Number(item.quantity);
  }, 0);

  cartContainer.innerHTML = `
    ${cart.map((item, index) => {
      const unitPrice = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const itemTotal = unitPrice * quantity;

      return `
        <div class="cart-row">
          <div class="cart-product">
            ${
              item.image
                ? `<img class="cart-image" src="${item.image}" alt="${item.name || "Product"}">`
                : ""
            }

            <div>
              <div class="cart-product-name">${item.name || "Product"}</div>
              <div class="cart-unit-price">$${unitPrice.toFixed(2)} each</div>
            </div>
          </div>

          <div class="quantity-controls">
            <button
              type="button"
              class="quantity-button"
              onclick="decreaseQuantity(${index})"
              aria-label="Decrease quantity"
            >−</button>

            <span class="quantity-value">${quantity}</span>

            <button
              type="button"
              class="quantity-button"
              onclick="increaseQuantity(${index})"
              aria-label="Increase quantity"
            >+</button>
          </div>

          <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>

          <button
            type="button"
            class="remove-button"
            onclick="removeFromCart(${index})"
          >Remove</button>
        </div>
      `;
    }).join("")}

    <div class="cart-total">
      <span>Order Total</span>
      <strong>$${grandTotal.toFixed(2)}</strong>
    </div>
  `;
}

function increaseQuantity(index) {
  const cart = getCart();
  if (!cart[index]) return;

  cart[index].quantity = Number(cart[index].quantity || 1) + 1;
  saveCart(cart);
  renderCart();
}

function decreaseQuantity(index) {
  const cart = getCart();
  if (!cart[index]) return;

  const currentQuantity = Number(cart[index].quantity || 1);

  // When quantity is 1, the minus button removes the product.
  if (currentQuantity <= 1) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = currentQuantity - 1;
  }

  saveCart(cart);
  renderCart();
}

function removeFromCart(index) {
  const cart = getCart();
  if (!cart[index]) return;

  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

async function supabaseRequest(path, method = "GET", body = null) {
  if (
    typeof SUPABASE_URL === "undefined" ||
    typeof SUPABASE_ANON_KEY === "undefined" ||
    SUPABASE_URL.includes("PASTE_YOUR")
  ) {
    throw new Error(
      "Please update supabase-config.js with your Supabase URL and anon key."
    );
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

const orderForm = document.getElementById("orderForm");

if (orderForm) {
  orderForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const cart = getCart();

    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }

    const order = {
      customer_name: document.getElementById("customerName").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      delivery_address: document.getElementById("address").value,
      notes: document.getElementById("notes").value,
      items: cart,
      total_amount: cart.reduce((sum, item) => {
        return sum + Number(item.price) * Number(item.quantity || 1);
      }, 0),
      payment_status: "Cash only - pending collection"
    };

    try {
      await supabaseRequest("orders", "POST", order);
      localStorage.removeItem("cart");
      alert("Order placed successfully.");
      window.location.href = "products.html";
    } catch (error) {
      alert("Order failed: " + error.message);
    }
  });
}

async function loadAdminOrders() {
  const passwordInput = document.getElementById("adminPassword");
  const adminOrders = document.getElementById("adminOrders");

  if (!passwordInput || !adminOrders) return;

  if (passwordInput.value !== ADMIN_PASSWORD) {
    alert("Wrong admin password.");
    return;
  }

  try {
    const orders = await supabaseRequest(
      "orders?select=*&order=created_at.desc"
    );

    adminOrders.innerHTML = orders.map((order) => `
      <div class="order-card">
        <h3>
          ${order.customer_name} -
          $${Number(order.total_amount).toFixed(2)}
        </h3>
        <p>${order.phone} | ${order.email}</p>
        <p>${order.delivery_address}</p>
        <pre>${JSON.stringify(order.items, null, 2)}</pre>
        <p>${order.notes || ""}</p>
      </div>
    `).join("");
  } catch (error) {
    adminOrders.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    localStorage.setItem("loggedInUser", email);
    window.location.href = "products.html";
  });
}

updateHeader();
renderCart();
