function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem("registeredUsers") || "[]");
  } catch (error) {
    console.error("Unable to read registered users:", error);
    return [];
  }
}

function saveRegisteredUsers(users) {
  localStorage.setItem("registeredUsers", JSON.stringify(users));
}

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("loggedInUser") || "null");
  } catch (error) {
    return null;
  }
}

function saveLoggedInUser(user) {
  localStorage.setItem("loggedInUser", JSON.stringify(user));
}

function isLoggedIn() {
  return getLoggedInUser() !== null;
}

function getCart() {
  let storedCart = [];

  try {
    storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
  } catch (error) {
    storedCart = [];
  }

  const normalizedCart = [];

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

  if (!nav) {
    return;
  }

  const user = getLoggedInUser();

  if (user) {
    nav.innerHTML = `
      <a href="index.html">Home</a>

      <a href="products.html">
        Products
      </a>

      <a href="cart.html">
        Cart
      </a>

      <a href="my-orders.html">
        My Orders
      </a>

      <span class="welcome-user">
        Welcome, ${escapeHtml(
          user.firstName || "Customer"
        )}
      </span>

      <a
        href="#"
        onclick="logoutUser(); return false;"
      >
        Sign Out
      </a>

      <a href="admin.html">
        Admin
      </a>
    `;
  } else {
    nav.innerHTML = `
      <a href="index.html">Home</a>

      <a href="products.html">
        Products
      </a>

      <a href="cart.html">
        Cart
      </a>

      <a href="login.html">
        Login
      </a>

      <a href="admin.html">
        Admin
      </a>
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
            ${item.image ? `<img class="cart-image" src="${item.image}" alt="${escapeHtml(item.name || "Product")}">` : ""}
            <div>
              <div class="cart-product-name">${escapeHtml(item.name || "Product")}</div>
              <div class="cart-unit-price">$${unitPrice.toFixed(2)} each</div>
            </div>
          </div>

          <div class="quantity-controls">
            <button type="button" class="quantity-button" onclick="decreaseQuantity(${index})">−</button>
            <span class="quantity-value">${quantity}</span>
            <button type="button" class="quantity-button" onclick="increaseQuantity(${index})">+</button>
          </div>

          <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
          <button type="button" class="remove-button" onclick="removeFromCart(${index})">Remove</button>
        </div>
      `;
    }).join("")}
    <div class="cart-grand-total">Total: $${grandTotal.toFixed(2)}</div>
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

  if (currentQuantity > 1) {
    cart[index].quantity = currentQuantity - 1;
  } else {
    cart.splice(index, 1);
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
    throw new Error("Please update supabase-config.js with your Supabase URL and anon key.");
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

function populateCheckoutCustomerDetails() {
  const orderForm = document.getElementById("orderForm");
  if (!orderForm) return;

  const user = getLoggedInUser();

  if (!user) {
    alert("Please login before placing an order.");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("checkoutFirstName").value = user.firstName || "";
  document.getElementById("checkoutLastName").value = user.lastName || "";
  document.getElementById("phone").value = user.phone || "";
  document.getElementById("email").value = user.email || "";
}

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const firstName = document.getElementById("registerFirstName").value.trim();
    const lastName = document.getElementById("registerLastName").value.trim();
    const phone = document.getElementById("registerPhone").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;
    const errorElement = document.getElementById("registerError");

    if (!firstName || !lastName || !phone || !email || !password) {
      errorElement.textContent = "First name, last name, phone number, email and password are required.";
      return;
    }

    if (phone.replace(/\D/g, "").length < 10) {
      errorElement.textContent = "Please enter a valid phone number.";
      return;
    }

    if (password.length < 6) {
      errorElement.textContent = "Password must contain at least 6 characters.";
      return;
    }

    if (password !== confirmPassword) {
      errorElement.textContent = "Passwords do not match.";
      return;
    }

    const users = getRegisteredUsers();

    if (users.some((user) => user.email.toLowerCase() === email)) {
      errorElement.textContent = "An account already exists with this email address.";
      return;
    }

    const newUser = {
      customerId: "CUS-" + Date.now().toString().slice(-8),
      firstName,
      lastName,
      phone,
      email,
      password
    };

    users.push(newUser);
    saveRegisteredUsers(users);

    saveLoggedInUser({
      customerId: newUser.customerId,
      firstName,
      lastName,
      phone,
      email
    });

    window.location.href = "products.html";
  });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const errorElement = document.getElementById("loginError");

    const matchedUser = getRegisteredUsers().find(
      (user) => user.email.toLowerCase() === email && user.password === password
    );

    if (!matchedUser) {
      errorElement.textContent = "Incorrect email address or password.";
      return;
    }

    saveLoggedInUser({
      customerId: matchedUser.customerId,
      firstName: matchedUser.firstName,
      lastName: matchedUser.lastName,
      phone: matchedUser.phone,
      email: matchedUser.email
    });

    window.location.href = "products.html";
  });
}

const orderForm = document.getElementById("orderForm");

if (orderForm) {
  orderForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const user = getLoggedInUser();
    const cart = getCart();

    if (!user) {
      alert("Please login before placing an order.");
      window.location.href = "login.html";
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }

    const firstName = document.getElementById("checkoutFirstName").value.trim();
    const lastName = document.getElementById("checkoutLastName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const address = document.getElementById("address").value.trim();
    const notes = document.getElementById("notes").value.trim();

    if (!firstName || !lastName || !phone || !email || !address) {
      alert("Please complete all required customer and delivery information.");
      return;
    }

    const total = cart.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      return sum + price * quantity;
    }, 0);

    const order = {
    customer_id: user.customerId,

    first_name: firstName,

    last_name: lastName,

    customer_name: `${firstName} ${lastName}`.trim(),

    phone: phone,

    email: email,

    delivery_address: address,

    notes: notes,

    items: cart,

    total_amount: Number(total.toFixed(2)),

    payment_status: "Cash only - pending collection"
};
    try {
      await supabaseRequest("orders", "POST", order);

      const users = getRegisteredUsers();
      const userIndex = users.findIndex(
        (savedUser) => savedUser.email.toLowerCase() === user.email.toLowerCase()
      );

      if (userIndex >= 0) {
        users[userIndex].firstName = firstName;
        users[userIndex].lastName = lastName;
        users[userIndex].phone = phone;
        users[userIndex].email = email;
        saveRegisteredUsers(users);
      }

      saveLoggedInUser({
        customerId: user.customerId,
        firstName,
        lastName,
        phone,
        email
      });

      localStorage.removeItem("cart");
      alert("Order placed successfully. Payment will be collected during the delivery. Thank you!!");
      window.location.href = "products.html";
    } catch (error) {
      alert("Order failed: " + error.message);
    }
  });
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
      return [];
    }
  }

  return [];
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
  adminOrders.innerHTML = "<p>Loading orders...</p>";

  try {
    const orders = await supabaseRequest(
      "orders?select=*&order=created_at.desc"
    );

    if (!Array.isArray(orders) || orders.length === 0) {
      adminOrders.innerHTML = "<p>No orders received yet.</p>";
      return;
    }

    adminOrders.innerHTML = orders.map((order) => {
      const items = normalizeOrderItems(order.items);

      const productRows = items.length
        ? items.map((item) => {
            const quantity = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;

            return `
              <tr>
                <td>${escapeHtml(item.name || "Product")}</td>
                <td>${quantity}</td>
                <td>$${price.toFixed(2)}</td>
                <td>$${(price * quantity).toFixed(2)}</td>
              </tr>
            `;
          }).join("")
        : `
            <tr>
              <td colspan="4">No product details available</td>
            </tr>
          `;

      return `
        <article class="admin-order-card">
          <h2>
            ${escapeHtml(order.customer_name || "Customer")}
          </h2>

          <p>
            <strong>Customer ID:</strong>
            ${escapeHtml(order.customer_id || order.id || "Not available")}
          </p>

          <p>
            <strong>Phone:</strong>
            ${escapeHtml(order.phone || "Not provided")}
          </p>

          <p>
            <strong>Email:</strong>
            ${escapeHtml(order.email || "Not provided")}
          </p>

          <p>
            <strong>Address:</strong>
            ${escapeHtml(order.delivery_address || "Not provided")}
          </p>

          <table class="order-products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              ${productRows}
            </tbody>
          </table>

          <h3>
            Order Total:
            $${Number(order.total_amount || 0).toFixed(2)}
          </h3>
        </article>
      `;
    }).join("");
  } catch (error) {
    adminOrders.innerHTML = `
      <p class="error-message">
        Unable to load orders: ${escapeHtml(error.message)}
      </p>
    `;
  }
}

const adminLoginForm =
  document.getElementById("adminLoginForm");

if (adminLoginForm) {
  adminLoginForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const passwordInput =
        document.getElementById("adminPassword");

      const errorElement =
        document.getElementById("adminLoginError");

      if (!passwordInput) {
        return;
      }

      if (passwordInput.value.trim() !== ADMIN_PASSWORD) {
        if (errorElement) {
          errorElement.textContent =
            "Incorrect admin password.";
        }

        passwordInput.value = "";
        passwordInput.focus();
        return;
      }

      if (errorElement) {
        errorElement.textContent = "";
      }

      sessionStorage.setItem(
        "eagleStudioAdmin",
        "true"
      );

      passwordInput.value = "";

      showAdminDashboard();
      await loadAdminOrders();
    }
  );
}

if (document.getElementById("adminDashboard")) {
  if (getAdminLoginStatus()) {
    showAdminDashboard();
    loadAdminOrders();
  } else {
    showAdminLogin();
  }
}
function normalizeCustomerOrderItems(items) {
  if (Array.isArray(items)) {
    return items;
  }

  if (typeof items === "string") {
    try {
      const parsedItems = JSON.parse(items);

      return Array.isArray(parsedItems)
        ? parsedItems
        : [];
    } catch (error) {
      console.error(
        "Unable to read order products:",
        error
      );

      return [];
    }
  }

  return [];
}

function formatCustomerOrderDate(createdAt) {
  if (!createdAt) {
    return "Order date unavailable";
  }

  const orderDate = new Date(createdAt);

  if (Number.isNaN(orderDate.getTime())) {
    return escapeHtml(createdAt);
  }

  return orderDate.toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

function createOrderReference(order) {
  if (
    order.id === undefined ||
    order.id === null
  ) {
    return "ES-ORDER";
  }

  const orderId = String(order.id);

  if (/^\d+$/.test(orderId)) {
    return `ES-${orderId.padStart(6, "0")}`;
  }

  return `ES-${orderId
    .substring(0, 8)
    .toUpperCase()}`;
}

function renderCustomerOrderProducts(items) {
  const products =
    normalizeCustomerOrderItems(items);

  if (products.length === 0) {
    return `
      <tr>
        <td colspan="4">
          Product information is unavailable.
        </td>
      </tr>
    `;
  }

  return products
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

      const unitPrice =
        Number(item.price) || 0;

      const productTotal =
        unitPrice * quantity;

      return `
        <tr>
          <td>
            ${escapeHtml(productName)}
          </td>

          <td>
            ${quantity}
          </td>

          <td>
            $${unitPrice.toFixed(2)}
          </td>

          <td>
            $${productTotal.toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join("");
}

async function loadMyOrders() {
  const myOrdersContainer =
    document.getElementById("myOrders");

  if (!myOrdersContainer) {
    return;
  }

  const user = getLoggedInUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (!user.customerId) {
    myOrdersContainer.innerHTML = `
      <div class="my-orders-message">
        <h2>Account update required</h2>

        <p>
          Please sign out and create a new account
          so your orders can be connected to your
          customer profile.
        </p>

        <a
          href="register.html"
          class="button"
        >
          Create Account
        </a>
      </div>
    `;

    return;
  }

  myOrdersContainer.innerHTML = `
    <div class="my-orders-loading">
      Loading your orders...
    </div>
  `;

  try {
    const encodedCustomerId =
      encodeURIComponent(user.customerId);

    const orders = await supabaseRequest(
      `orders?select=*&customer_id=eq.${encodedCustomerId}&order=created_at.desc`
    );

    if (
      !Array.isArray(orders) ||
      orders.length === 0
    ) {
      myOrdersContainer.innerHTML = `
        <div class="my-orders-message">
          <h2>No orders yet</h2>

          <p>
            Your completed orders will appear here.
          </p>

          <a
            href="products.html"
            class="button"
          >
            Browse Products
          </a>
        </div>
      `;

      return;
    }

    myOrdersContainer.innerHTML =
      orders
        .map((order) => {
          const products =
            normalizeCustomerOrderItems(
              order.items
            );

          const calculatedTotal =
            products.reduce(
              (total, item) => {
                const price =
                  Number(item.price) || 0;

                const quantity =
                  Math.max(
                    1,
                    Number(item.quantity) || 1
                  );

                return (
                  total +
                  price * quantity
                );
              },
              0
            );

          const savedTotal =
            Number(order.total_amount);

          const orderTotal =
            Number.isFinite(savedTotal)
              ? savedTotal
              : calculatedTotal;

          return `
            <article class="customer-order-card">

              <div class="customer-order-header">

                <div>
                  <h2>
                    Order
                    ${escapeHtml(
                      createOrderReference(order)
                    )}
                  </h2>

                  <p class="customer-order-date">
                    ${formatCustomerOrderDate(
                      order.created_at
                    )}
                  </p>
                </div>

                <div class="customer-order-total">
                  $${orderTotal.toFixed(2)}
                </div>

              </div>

              <div class="customer-order-summary">

                <div>
                  <span class="order-summary-label">
                    Customer
                  </span>

                  <span>
                    ${escapeHtml(
                      order.customer_name ||
                      `${user.firstName || ""} ${
                        user.lastName || ""
                      }`.trim() ||
                      "Customer"
                    )}
                  </span>
                </div>

                <div>
                  <span class="order-summary-label">
                    Phone
                  </span>

                  <span>
                    ${escapeHtml(
                      order.phone ||
                      user.phone ||
                      "Not provided"
                    )}
                  </span>
                </div>

                <div>
                  <span class="order-summary-label">
                    Email
                  </span>

                  <span>
                    ${escapeHtml(
                      order.email ||
                      user.email ||
                      "Not provided"
                    )}
                  </span>
                </div>

                <div>
                  <span class="order-summary-label">
                    Payment
                  </span>

                  <span>
                    ${escapeHtml(
                      order.payment_status ||
                      "Cash only - pending collection"
                    )}
                  </span>
                </div>

                <div class="order-delivery-address">
                  <span class="order-summary-label">
                    Delivery Address
                  </span>

                  <span>
                    ${escapeHtml(
                      order.delivery_address ||
                      "Not provided"
                    )}
                  </span>
                </div>

              </div>

              <h3>Products</h3>

              <div class="customer-order-table-wrapper">

                <table class="customer-order-table">

                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${renderCustomerOrderProducts(
                      order.items
                    )}
                  </tbody>

                  <tfoot>
                    <tr>
                      <th colspan="3">
                        Order Total
                      </th>

                      <th>
                        $${orderTotal.toFixed(2)}
                      </th>
                    </tr>
                  </tfoot>

                </table>

              </div>

              ${
                order.notes
                  ? `
                    <div class="customer-order-notes">
                      <strong>
                        Order Notes:
                      </strong>

                      ${escapeHtml(order.notes)}
                    </div>
                  `
                  : ""
              }

            </article>
          `;
        })
        .join("");

  } catch (error) {
    console.error(
      "Unable to load customer orders:",
      error
    );

    myOrdersContainer.innerHTML = `
      <div class="my-orders-error">

        <h2>
          Unable to load your orders
        </h2>

        <p>
          ${escapeHtml(error.message)}
        </p>

      </div>
    `;
  }
}
updateHeader();
renderCart();
populateCheckoutCustomerDetails();
loadMyOrders();
