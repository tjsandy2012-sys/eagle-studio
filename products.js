const products = [
    {
        id:1,
        name:"Lord Murugan Idol",
        price:"$15",
        image:"images/murugan.jpg",
        description:"Beautiful devotional idol.",
        material:"PLA",
        size:"Small",
        color:"Gold",
        stock:"Available"
    },
    {
        id:2,
        name:"Lord Balaji Idol",
        price:"$18",
        image:"images/balaji.jpg",
        description:"Premium devotional idol.",
        material:"PLA",
        size:"Medium",
        color:"Black",
        stock:"Available"
    }
];

const productsList = document.getElementById("productsList");

products.forEach(product => {

const card=document.createElement("div");

card.className="product-card";

card.innerHTML=`

<img src="${product.image}">
<h3>${product.name}</h3>
<p>${product.price}</p>

<button onclick="viewDetails(${product.id})">
View Details
</button>

`;

card.onclick=function(e){

if(e.target.tagName!="BUTTON"){

viewDetails(product.id);

}

}

productsList.appendChild(card);

});

function viewDetails(id){

localStorage.setItem("selectedProductId",id);

localStorage.setItem("products",JSON.stringify(products));

window.location.href="product-details.html";

}
