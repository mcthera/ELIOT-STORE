import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

let db = null;
let productsCollection = null;
let allProducts = [];

const firebaseConfig = {
  apiKey: "AIzaSyC17ICJyRwrG0BqyxiArz92M2i2uNDF8u4",
  authDomain: "eliot-store-67443.firebaseapp.com",
  projectId: "eliot-store-67443",
  storageBucket: "eliot-store-67443.firebasestorage.app",
  messagingSenderId: "326684460197",
  appId: "1:326684460197:web:9ed0d63efdddbd17d1394c",
  measurementId: "G-VKXMK7M1GX"
};

// Initialize Firebase
function initFirebase() {
  if (!db) {
    const app = initializeApp(firebaseConfig);
    try {
      getAnalytics(app);
    } catch (error) {
      console.warn("Firebase Analytics initialization failed:", error);
    }
    db = getFirestore(app);
    productsCollection = collection(db, "products");
  }
}

// Admin Protection Logic
function isAdminMode() {
  return sessionStorage.getItem('isAdmin') === 'true';
}

function ensureAdminAccess() {
  if (!isAdminMode()) {
    window.location.href = 'login.html';
  }
}

function logoutAdmin(event) {
  if (event) {
    event.preventDefault();
  }

  sessionStorage.removeItem('isAdmin');
  window.location.href = 'login.html';
}

function setupAdminNavigation() {
  const navLogoutLink = document.getElementById('nav-logout-link');
  if (navLogoutLink) {
    navLogoutLink.addEventListener('click', logoutAdmin);
  }
}

// Add New Product
// REPLACE your current logic for handling images with this:
async function addNewProduct(e) {
  e.preventDefault();
  initFirebase();
  
  const name = document.getElementById('prod-name').value;
  const price = parseFloat(document.getElementById('prod-price').value);
  const category = document.getElementById('prod-category').value;
  const description = document.getElementById('prod-description').value;
  
  // Use the text input for the URL instead of trying to upload the file
  const imageUrl = document.getElementById('prod-image').value;

  if (!name || !price || !imageUrl) {
    alert("Please enter a name, price, and an Image URL.");
    return;
  }

  await addDoc(productsCollection, {
    name,
    price,
    category,
    description,
    image: imageUrl
  });

  alert("Product added successfully!");
  document.getElementById('admin-tool-form').reset();
}

// Edit/Update Logic
function openEditModal(id, name, price, category, description) {
  document.getElementById('edit-id').value = id;
  document.getElementById('edit-name').value = name;
  document.getElementById('edit-price').value = price;
  document.getElementById('edit-category').value = category;
  document.getElementById('edit-description').value = description;
  document.getElementById('edit-modal').style.display = 'block';
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

async function saveEditProduct() {
  initFirebase();
  const id = document.getElementById('edit-id').value;
  await updateDoc(doc(productsCollection, id), {
    name: document.getElementById('edit-name').value,
    price: parseFloat(document.getElementById('edit-price').value),
    category: document.getElementById('edit-category').value,
    description: document.getElementById('edit-description').value
  });
  closeEditModal();
  alert("Product updated!");
}

// Delete Logic
async function deleteProduct(id) {
  if (confirm("Delete this product?")) {
    await deleteDoc(doc(productsCollection, id));
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openImageModal(imageUrl, altText) {
  const modal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');

  if (!modal || !modalImage) return;

  modalImage.src = imageUrl;
  modalImage.alt = altText;
  modal.classList.add('show');
}

function closeImageModal() {
  const modal = document.getElementById('image-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function buildWhatsAppOrderUrl(product) {
  const name = product.name || 'this item';
  const price = product.price ?? '0';
  const message = `Hello, I would like to order ${name} for ₵${price}.`;
  return `https://wa.me/+233200500804?text=${encodeURIComponent(message)}`;
}

function renderProducts(products) {
  const container = document.getElementById('product-container');
  if (!container) return;

  container.innerHTML = '';

  if (!products.length) {
    container.innerHTML = '<p class="product-count">No products found.</p>';
    return;
  }

  const isAdmin = isAdminMode();

  products.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'product-card-image';

    if (product.image) {
      const imageLink = document.createElement('a');
      imageLink.href = product.image;
      imageLink.target = '_blank';
      imageLink.rel = 'noopener noreferrer';

      const image = document.createElement('img');
      image.src = product.image;
      image.alt = product.name || 'Product image';
      image.loading = 'lazy';
      image.addEventListener('click', (event) => {
        event.preventDefault();
        openImageModal(product.image, product.name || 'Product image');
      });
      image.onerror = function () {
        this.remove();
        imageWrapper.innerHTML = '<div class="product-card-image-placeholder">No image available</div>';
      };

      imageLink.appendChild(image);
      imageWrapper.appendChild(imageLink);
    } else {
      imageWrapper.innerHTML = '<div class="product-card-image-placeholder">No image available</div>';
    }

    const info = document.createElement('div');
    info.className = 'product-card-info';

    const title = document.createElement('h3');
    title.innerHTML = escapeHtml(product.name || 'Unnamed product');

    const category = document.createElement('span');
    category.className = 'category-pill';
    category.textContent = product.category || 'Others';

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = `₵${Number(product.price || 0).toFixed(2)}`;

    const description = document.createElement('p');
    description.className = 'product-card-description';
    description.textContent = product.description || 'Fresh quality product ready to order.';

    info.appendChild(title);
    info.appendChild(category);
    info.appendChild(price);
    info.appendChild(description);

    const actions = document.createElement('div');
    actions.className = 'product-card-actions';

    const orderLink = document.createElement('a');
    orderLink.className = 'whatsapp-btn';
    orderLink.href = buildWhatsAppOrderUrl(product);
    orderLink.target = '_blank';
    orderLink.rel = 'noopener noreferrer';
    orderLink.textContent = 'Order on WhatsApp';

    actions.appendChild(orderLink);

    if (isAdmin) {
      const editButton = document.createElement('button');
      editButton.className = 'edit-btn';
      editButton.type = 'button';
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', () => {
        openEditModal(product.id, product.name, product.price, product.category, product.description);
      });

      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-btn';
      deleteButton.type = 'button';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => deleteProduct(product.id));

      actions.appendChild(editButton);
      actions.appendChild(deleteButton);
    }

    card.appendChild(imageWrapper);
    card.appendChild(info);
    card.appendChild(actions);
    container.appendChild(card);
  });
}

function updateProductCount(count) {
  const countEl = document.getElementById('product-count');
  if (countEl) {
    countEl.textContent = `${count} product${count === 1 ? '' : 's'} found`;
  }
}

function filterProducts() {
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-filter');
  const searchTerm = (searchInput?.value || '').trim().toLowerCase();
  const selectedCategory = (categorySelect?.value || 'All');

  const filteredProducts = allProducts.filter((product) => {
    const name = (product.name || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const category = (product.category || '').toLowerCase();

    const matchesSearch = !searchTerm || name.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || category === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  renderProducts(filteredProducts);
  updateProductCount(filteredProducts.length);
}

// Main Load/Render (Shared between admin and index)
function loadProducts() {
  initFirebase();
  const container = document.getElementById('product-container');
  if (!container) return;

  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-filter');

  if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', filterProducts);
  }

  onSnapshot(productsCollection, (snapshot) => {
    allProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    filterProducts();
  });
}

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  loadProducts();
  setupAdminNavigation();
  document.getElementById('admin-tool-form')?.addEventListener('submit', addNewProduct);
  document.getElementById('logout-btn')?.addEventListener('click', logoutAdmin);
});

window.filterProducts = filterProducts;
window.closeImageModal = closeImageModal;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEditProduct = saveEditProduct;
window.ensureAdminAccess = ensureAdminAccess;
