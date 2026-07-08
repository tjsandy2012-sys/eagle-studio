const products = [
  {
    id: 1,
    name: "Lord Balaji Premium Idol",
    price: 11,
    description: "Perfect for car dashboards, home temples, office desks, and devotional gifts. Premium 3D printed with fine details.",
    image: "images/1000109054.png",
    material: "PLA",
    size: "10 Inch",
    color: "Premium Jet Black",
    stock: "Available"
  },
  {
    id: 2,
    name: "Lord Murugan Idol",
    price: 15,
    description: "Perfect for car dashboards, home temples, office desks, and devotional gifts. Premium 3D printed with fine details.",
    image: "images/1000110560.jpg",
    material: "PLA",
    size: "9 Inch",
    color: "Premium Jet Black",
    stock: "Available"
  },
  {
    id: 3,
    name: "Sri Venkateshwara Premium Statue",
    price: 16,
    description: "Perfect for car dashboards, home temples, office desks, and devotional gifts. Premium 3D printed with fine details.",
    image: "images/1000110555.jpg",
    material: "PLA",
    size: "10 Inch",
    color: "Premium Jet Black",
    stock: "Available"
  },
  {
    id: 4,
    name: "Lord Shiva Mahadev Bust",
    price: 13,
    description: "Perfect for car dashboards, home temples, office desks, and devotional gifts. Premium 3D printed with fine details.",
    image: "images/1000109572.png",
    material: "PLA",
    size: "8 Inch",
    color: "Premium Jet Black",
    stock: "Available"
  }
];

localStorage.setItem("products", JSON.stringify(products));

const productsList = document.getElementById("productsList");

if (productsList) {
  productsList.innerHTML = products.map(product => `
    <div class="product-card" onclick="viewDetails(${product.id})">
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="price">$${product.price}</p>
      <button onclick="event.stopPropagation(); viewDetails(${product.id})">
        View Details
      </button>
    </div>
  `).join("");
}

function viewDetails(id) {
  localStorage.setItem("selectedProductId", id);
  window.location.href = "product-details.html";
}
