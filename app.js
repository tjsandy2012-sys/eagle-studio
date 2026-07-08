function isLoggedIn() {
  return localStorage.getItem("loggedInUser") !== null;
}

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
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
      <a href="#" onclick="logoutUser()">Sign Out</a>
      <a href="admin.html">Admin</a>
    `;
  }
}

function logoutUser() {
  localStorage.removeItem("loggedInUser");
  alert("Signed out successfully");
  window.location.href = "login.html";
}

updateHeader();
function renderCart() {
  const el = document.getElementById("cartItems");
  if (!el) return;

  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + Number(item.price), 0);

  if (cart.length === 0) {
    el.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  el.innerHTML =
    cart.map(item => `
      <div class="cart-row">
        ${item.name} - $${item.price}
      </div>
    `).join("") +
    `<h3>Total: $${total}</h3>`;
}

async function supabaseRequest(path, method = "GET", body = null) {
  if (
    typeof SUPABASE_URL === "undefined" ||
    typeof SUPABASE_ANON_KEY === "undefined" ||
    SUPABASE_URL.includes("PASTE_YOUR")
  ) {
    throw new Error("Please update supabase-config.js with your Supabase URL and anon key.");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: method,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

const orderForm = document.getElementById("orderForm");

if (orderForm) {
  orderForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const cart = getCart();

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const order = {
      customer_name: document.getElementById("customerName").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      delivery_address: document.getElementById("address").value,
      notes: document.getElementById("notes").value,
      items: cart,
      total_amount: cart.reduce((sum, item) => sum + Number(item.price), 0),
      payment_status: "Cash only - pending collection"
    };

    try {
      await supabaseRequest("orders", "POST", order);
      localStorage.removeItem("cart");
      alert("Order placed successfully.");
      window.location.href = "products.html";
    } catch (err) {
      alert("Order failed: " + err.message);
    }
  });
}

async function loadAdminOrders() {
  const passwordInput = document.getElementById("adminPassword");
  const adminOrders = document.getElementById("adminOrders");

  if (!passwordInput || !adminOrders) return;

  if (passwordInput.value !== ADMIN_PASSWORD) {
    alert("Wrong admin password");
    return;
  }

  try {
    const orders = await supabaseRequest("orders?select=*&order=created_at.desc");

    adminOrders.innerHTML = orders.map(order => `
      <div class="order-card">
        <h3>${order.customer_name} - $${order.total_amount}</h3>
        <p>${order.phone} | ${order.email}</p>
        <p>${order.delivery_address}</p>
        <pre>${JSON.stringify(order.items, null, 2)}</pre>
        <p>${order.notes || ""}</p>
      </div>
    `).join("");
  } catch (err) {
    adminOrders.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;

    localStorage.setItem("loggedInUser", email);

    alert("Login successful");
    window.location.href = "products.html";
  });
}

renderCart();
