// Get products and selected product
const products = JSON.parse(localStorage.getItem("products")) || [];
const selectedProductId = Number(localStorage.getItem("selectedProductId"));

const product = products.find(p => p.id === selectedProductId);

const container = document.getElementById("productDetails");

if (!container) {
    console.error("productDetails div not found");
}

if (!product) {
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

                <h2>$${product.price}</h2>

                <p>${product.description}</p>

                <p><strong>Material:</strong> ${product.material}</p>

                <p><strong>Size:</strong> ${product.size}</p>

                <p><strong>Color:</strong> ${product.color}</p>

                <p><strong>Stock:</strong> ${product.stock}</p>

                <button id="addCartBtn">
                    Add to Cart
                </button>

            </div>

        </div>
    `;

    document
        .getElementById("addCartBtn")
        .addEventListener("click", addToCart);
}

function addToCart() {

    const loggedInUser = localStorage.getItem("loggedInUser");

    if (!loggedInUser) {
        alert("Please login before adding to cart.");
        window.location.href = "login.html";
        return;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.push(product);

    localStorage.setItem("cart", JSON.stringify(cart));

    alert("Product added to cart.");

    window.location.href = "cart.html";
}
