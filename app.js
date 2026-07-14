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
  if (!nav) return;

  const user = getLoggedInUser();

  if (user) {
    nav.innerHTML = `
      <a href="index.html">Home</a>
      <a href="products.html">Products</a>
      <a href="cart.html">Cart</a>
      <span class="welcome-user">Welcome, ${escapeHtml(user.firstName || "Customer")}</span>
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

    const order = {
      customer_id: user.customerId,
      first_name: firstName,
      last_name: lastName,
      customer_name: `${firstName} ${lastName}`,
      phone,
      email,
      delivery_address: address,
      notes,
      items: cart,
      total_amount: cart.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
        0
      ),
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
      alert("Order placed successfully. Cash only. Payment will be collected separately.");
      window.location.href = "products.html";
    } catch (error) {
      alert("Order failed: " + error.message);
    }
  });
}

updateHeader();
renderCart();
populateCheckoutCustomerDetails();
