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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAdminLoginStatus() {
  return sessionStorage.getItem("eagleStudioAdmin") === "true";
}

function showAdminDashboard() {
  const loginSection = document.getElementById("adminLoginSection");
  const dashboard = document.getElementById("adminDashboard");

  if (loginSection) {
    loginSection.classList.add("hidden");
  }

  if (dashboard) {
    dashboard.classList.remove("hidden");
  }
}

function showAdminLogin() {
  const loginSection = document.getElementById("adminLoginSection");
  const dashboard = document.getElementById("adminDashboard");

  if (loginSection) {
    loginSection.classList.remove("hidden");
  }

  if (dashboard) {
    dashboard.classList.add("hidden");
  }
}

function adminLogout() {
  sessionStorage.removeItem("eagleStudioAdmin");

  showAdminLogin();

  const passwordInput = document.getElementById("adminPassword");

  if (passwordInput) {
    passwordInput.value = "";
  }

  const adminOrders = document.getElementById("adminOrders");

  if (adminOrders) {
    adminOrders.innerHTML = "";
  }
}

function normalizeOrderItems(items) {
  if (Array.isArray(items)) {
    return items;
  }

  if (typeof items === "string") {
    try {
      const parsedItems = JSON.parse(items);
      return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
      console.error("Unable to read order items:", error);
      return [];
    }
  }

  return [];
}

function createCustomerId(order) {
  /*
    Use the Supabase order ID as the unique customer/order reference.

    Examples:
    ES-000012
    ES-A31F67D2
  */

  if (order.id === undefined || order.id === null) {
    return "ES-NOT-AVAILABLE";
  }

  const rawId = String(order.id);

  if (/^\d+$/.test(rawId)) {
    return `ES-${rawId.padStart(6, "0")}`;
  }

  return `ES-${rawId.substring(0, 8).toUpperCase()}`;
}

function formatOrderDate(createdAt) {
  if (!createdAt) {
    return "Date not available";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(createdAt);
  }

  return date.toLocaleString();
}

function renderOrderProducts(items) {
  const normalizedItems = normalizeOrderItems(items);

  if (normalizedItems.length === 0) {
    return `
      <tr>
        <td colspan="5">No product information available.</td>
      </tr>
    `;
  }

  return normalizedItems
    .map((item) => {
      const productName =
        item.name ||
        item.product_name ||
        item.title ||
        "Product";

      const quantity = Math.max(
        1,
        Number(item.quantity) || 1
      );

      const unitPrice = Number(item.price) || 0;
      const itemTotal = unitPrice * quantity;

      return `
        <tr>
          <td>${escapeHtml(productName)}</td>
          <td>${quantity}</td>
          <td>$${unitPrice.toFixed(2)}</td>
          <td>$${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadAdminOrders() {
  const adminOrders = document.getElementById("adminOrders");

  if (!adminOrders) {
    return;
  }

  if (!getAdminLoginStatus()) {
    showAdminLogin();
    return;
  }

  showAdminDashboard();

  adminOrders.innerHTML = `
    <div class="admin-loading">
      Loading customer orders...
    </div>
  `;

  try {
    const orders = await supabaseRequest(
      "orders?select=*&order=created_at.desc"
    );

    if (!Array.isArray(orders) || orders.length === 0) {
      adminOrders.innerHTML = `
        <div class="no-orders">
          <h2>No orders received</h2>
          <p>New customer orders will appear here.</p>
        </div>
      `;

      return;
    }

    adminOrders.innerHTML = orders
      .map((order) => {
        const items = normalizeOrderItems(order.items);

        const calculatedTotal = items.reduce((sum, item) => {
          const price = Number(item.price) || 0;
          const quantity = Math.max(
            1,
            Number(item.quantity) || 1
          );

          return sum + price * quantity;
        }, 0);

        const savedTotal = Number(order.total_amount);

        const orderTotal = Number.isFinite(savedTotal)
          ? savedTotal
          : calculatedTotal;

        return `
          <article class="admin-order-card">

            <div class="order-title-row">
              <div>
                <h2>
                  Order ${escapeHtml(createCustomerId(order))}
                </h2>

                <p class="order-date">
                  ${formatOrderDate(order.created_at)}
                </p>
              </div>

              <div class="order-total-badge">
                $${orderTotal.toFixed(2)}
              </div>
            </div>

            <div class="customer-information">

              <div class="customer-field">
                <span class="customer-field-label">
                  Customer Name
                </span>

                <span>
                  ${escapeHtml(order.customer_name || "Not provided")}
                </span>
              </div>

              <div class="customer-field">
                <span class="customer-field-label">
                  Customer ID
                </span>

                <span>
                  ${escapeHtml(createCustomerId(order))}
                </span>
              </div>

              <div class="customer-field">
                <span class="customer-field-label">
                  Phone Number
                </span>

                <span>
                  ${escapeHtml(order.phone || "Not provided")}
                </span>
              </div>

              <div class="customer-field">
                <span class="customer-field-label">
                  Email
                </span>

                <span>
                  ${escapeHtml(order.email || "Not provided")}
                </span>
              </div>

              <div class="customer-field customer-address">
                <span class="customer-field-label">
                  Customer Address
                </span>

                <span>
                  ${escapeHtml(
                    order.delivery_address || "Not provided"
                  )}
                </span>
              </div>

            </div>

            <h3>Products Ordered</h3>

            <div class="order-table-wrapper">
              <table class="order-products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Product Total</th>
                  </tr>
                </thead>

                <tbody>
                  ${renderOrderProducts(order.items)}
                </tbody>

                <tfoot>
                  <tr>
                    <th colspan="3">Order Total</th>
                    <th>$${orderTotal.toFixed(2)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>

            ${
              order.notes
                ? `
                  <div class="order-notes">
                    <strong>Customer Notes:</strong>
                    ${escapeHtml(order.notes)}
                  </div>
                `
                : ""
            }

            <div class="payment-status">
              <strong>Payment:</strong>
              ${escapeHtml(
                order.payment_status ||
                "Cash only - pending collection"
              )}
            </div>

          </article>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Unable to load admin orders:", error);

    adminOrders.innerHTML = `
      <div class="admin-error">
        <h2>Unable to load orders</h2>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
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
