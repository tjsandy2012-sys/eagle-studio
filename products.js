const products = JSON.parse(localStorage.getItem("products")) || [];
const selectedProductId = Number(localStorage.getItem("selectedProductId"));

const product = products.find(p => p.id === selectedProductId);
const detailsDiv = document.getElementById("productDetails");

if (product) {
  detailsDiv.innerHTML = `
    <div class="details-card">
      <img src="${product.image}" alt="${product.name}">

      <div class="details-info">
        <h1>${product.name}</h1>
        <h2>$${product.price}</h2>

        <p>${product.description}</p>

        <p><strong>Material:</strong> ${product.material}</p>
        <p><strong>Size:</strong> ${product.size}</p>
        <p><strong>Color:</strong> ${product.color}</p>
        <p><strong>Stock:</strong> ${product.stock}</p>

        <button onclick="addToCart()">Add to Cart</button>
      </div>
    </div>
  `;
} else {
  detailsDiv.innerHTML = `
    <h2>Product not found.</h2>
    <p>Please go back to the Products page and select a product.</p>
  `;
}

function addToCart() {
  if (!isLoggedIn()) {
    alert("Please login before adding products to cart.");
    window.location.href = "login.html";
    return;
  }

  const cart = getCart();
  cart.push(product);
  saveCart(cart);

  alert("Product added to cart.");
  window.location.href = "cart.html";
}
