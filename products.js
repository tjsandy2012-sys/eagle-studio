const products = [
  {
    id: 1,
    name: "Lord Balaji Premium Idol",
    price: 11,
    description: "Perfect for car dashboards, home temples, office desks, and devotional gifts.",
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
    description: "Perfect for car dashboards, home temples, office desks, and devotional gifts.",
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
    description: "Perfect for car dashboards, home temples, office desks, and devotional gifts.",
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
    description: "Perfect for car dashboards, home temples, office desks, and devotional gifts.",
    image: "images/1000109572.png",
    material: "PLA",
    size: "8 Inch",
    color: "Premium Jet Black",
    stock: "Available"
  },
    {
    id: 5,
    name: "Shiva lingam Idol(Shiva Ling)",
    price: 12,
    description: "Ideal for car dashboards, home temples, office desks, return gifts, and devotional gifting.",
    image: "images/Shivalinga1.png",
    material: "PLA",
    size: "4 Inch",
    color: "Premium Jet Black",
    stock: "Available"
  },
  {
    id: 6,
    name: "Ganesha Decorative Idol",
    price: 5,
    description: "Ganesha Moon Lamp - A beautiful decorative idol suitable for home décor, devotional spaces, and gifting.",
    image: "images/Ganesha2.png",
    material: "PLA",
    size: "4 Inch",
    color: "Premium White",
    stock: "Available"
  }
];

localStorage.setItem("products", JSON.stringify(products));

const productsList = document.getElementById("productsList");

productsList.innerHTML = products.map(product => `
  <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="price">$${product.price}</p>

      <button onclick="viewDetails(${product.id})">
        View Details
      </button>
  </div>
`).join("");

function viewDetails(id) {
    localStorage.setItem("selectedProductId", id);
    window.location.href = "product-details.html";
}
