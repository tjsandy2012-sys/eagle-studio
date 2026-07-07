const products = [
  { id: 1, name: "Lord Balaji Premium Dashboard Idol", price: $11, description: "Perfect for car dashboards, home temples, office desks, and devotional gifts. Premium 3D printed with fine details.", image: "images/1000109054.png" },
  { id: 2, name: "Lord Murugan Idol", price: $15, description: "Perfect for car dashboards, home temples, office desks, and devotional gifts. Premium 3D printed with fine details.", image: "images/1000110560.png" },
  { id: 3, name: "Sri Venkateshwara Premium Statue", price: $16, description: "Perfect for car dashboards, home temples, office desks, and devotional gifts. Premium 3D printed with fine details.", image: "images/1000110555.png" },
  { id: 4, name: "Lord Shiva(Mahadev) Bust", price: $13, description: "Perfect for car dashboards, home temples, office desks, and devotional gifts. Premium 3D printed with fine details.", image: "assets/images/1000109572.png" }
];

function getCart() { return JSON.parse(localStorage.getItem("cart") || "[]"); }
function saveCart(cart) { localStorage.setItem("cart", JSON.stringify(cart)); }

function addToCart(id) {
  const item = products.find(p => p.id === id);
  const cart = getCart();
  cart.push(item);
  saveCart(cart);
  alert("Added to cart");
}

function renderProducts() {
  const list = document.getElementById("productList");
  if (!list) return;
  list.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <strong>$${p.price}</strong>
      <button onclick="addToCart(${p.id})">Add to Cart</button>
    </div>`).join("");
}

function renderCart() {
  const el = document.getElementById("cartItems");
  if (!el) return;
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  el.innerHTML = cart.length ? cart.map(i => `<div class="cart-row">${i.name} - $${i.price}</div>`).join("") + `<h3>Total: $${total}</h3>` : "<p>Your cart is empty.</p>";
}

async function supabaseRequest(path, method = "GET", body = null) {
  if (SUPABASE_URL.includes("PASTE_YOUR")) {
    throw new Error("Please update supabase-config.js with your Project URL and anon key.");
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: body ? JSON.stringify(body) : null
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const orderForm = document.getElementById("orderForm");
if (orderForm) {
  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cart = getCart();
    if (!cart.length) return alert("Cart is empty");
    const order = {
      customer_name: document.getElementById("customerName").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      delivery_address: document.getElementById("address").value,
      notes: document.getElementById("notes").value,
      items: cart,
      total_amount: cart.reduce((sum, item) => sum + item.price, 0),
      payment_status: "Cash only - pending collection"
    };
    try {
      await supabaseRequest("orders", "POST", order);
      localStorage.removeItem("cart");
      alert("Order placed successfully. Cash only. Payment will be collected separately.");
      location.href = "products.html";
    } catch (err) { alert("Order failed: " + err.message); }
  });
}

async function loadAdminOrders() {
  const pass = document.getElementById("adminPassword").value;
  if (pass !== ADMIN_PASSWORD) return alert("Wrong admin password");
  const el = document.getElementById("adminOrders");
  try {
    const orders = await supabaseRequest("orders?select=*&order=created_at.desc");
    el.innerHTML = orders.map(o => `<div class="order-card"><h3>${o.customer_name} - $${o.total_amount}</h3><p>${o.phone} | ${o.email}</p><p>${o.delivery_address}</p><pre>${JSON.stringify(o.items, null, 2)}</pre><p>${o.notes || ""}</p></div>`).join("");
  } catch (err) { el.innerHTML = `<p class="error">${err.message}</p>`; }
}

renderProducts();
renderCart();
