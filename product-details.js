const products = JSON.parse(localStorage.getItem("products") || "[]");
const selectedProductId = Number(localStorage.getItem("selectedProductId"));
const product = products.find(
  (item) => Number(item.id) === selectedProductId
);
const container = document.getElementById("productDetails");

if (!container) {
  console.error("productDetails div not found");
} else if (!product) {
  container.innerHTML = `
    <h2>Product not found</h2>
    <a href="products.html">← Back to Products</a>
  `;
} else {
  container.innerHTML = `
    <div class="details-card">
      <div class="details-image">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <div class="details-info">
        <h1>${product.name}</h1>
        <h2>$${Number(product.price).toFixed(2)}</h2>
        <p>${product.description || ""}</p>
        <p><strong>Material:</strong> ${product.material || "Not specified"}</p>
        <p><strong>Size:</strong> ${product.size || "Not specified"}</p>
        <p><strong>Color:</strong> ${product.color || "Not specified"}</p>
        <p><strong>Stock:</strong> ${product.stock ?? "Available"}</p>

        <button id="addCartBtn" type="button">Add to Cart</button>
      </div>
    </div>
  `;

  document
    .getElementById("addCartBtn")
    .addEventListener("click", addToCart);
}

function addToCart() {
  if (!localStorage.getItem("loggedInUser")) {
    alert("Please login before adding to cart.");
    window.location.href = "login.html";
    return;
  }

  let cart = [];

  try {
    cart = JSON.parse(localStorage.getItem("cart") || "[]");
  } catch (error) {
    cart = [];
  }

  const existingItem = cart.find(
    (item) => String(item.id) === String(product.id)
  );

  if (existingItem) {
    existingItem.quantity = Number(existingItem.quantity || 1) + 1;
  } else {
    cart.push({
      ...product,
      price: Number(product.price) || 0,
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  window.location.href = "cart.html";
}
