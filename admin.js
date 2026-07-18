import { auth, db, storage } from "./firebase.js";
import { protectPage } from "./auth-guard.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getDownloadURL, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

// Change this value if the store owner uses a different Firebase login.
const ADMIN_EMAIL = "ntando.lawrance@gmail.com";

await protectPage();

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[char]));

let allProducts = [];

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    signOut(auth);
    window.location.replace("index.html");
    return;
  }

  document.getElementById("adminEmail").textContent = user.email;
  loadOrders();
  loadProducts();
});

document.getElementById("logoutBtn").addEventListener("click", async event => {
  event.preventDefault();
  await signOut(auth);
  window.location.replace("login.html");
});

function loadOrders() {
  onSnapshot(collection(db, "orders"), snapshot => {
    const rows = [];
    let revenue = 0;
    let pending = 0;
    const customers = new Set();

    snapshot.docs
      .sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0))
      .forEach(orderDoc => {
        const order = orderDoc.data();
        const total = Number(order.total || 0);
        const status = order.status || "Pending Confirmation";
        revenue += total;
        if (order.email) customers.add(order.email.toLowerCase());
        if (status === "Pending Confirmation") pending++;

        rows.push(`<tr>
          <td>${escapeHtml(order.name || "-")}</td>
          <td>${escapeHtml(order.phone || "-")}</td>
          <td>${escapeHtml(order.email || "-")}</td>
          <td>R${total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
          <td><span class="status pending">${escapeHtml(status)}</span></td>
          <td>${order.createdAt?.toDate?.().toLocaleDateString("en-ZA") || "-"}</td>
        </tr>`);
      });

    document.getElementById("ordersTable").innerHTML = rows.length
      ? rows.join("")
      : '<tr><td colspan="6" class="empty-state">No orders yet.</td></tr>';
    document.getElementById("totalOrders").textContent = snapshot.size;
    document.getElementById("pendingOrders").textContent = pending;
    document.getElementById("revenue").textContent = `R${revenue.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
    document.getElementById("customers").textContent = customers.size;
  }, error => showMessage(`Could not load orders: ${error.message}`, true));
}

function loadProducts() {
  onSnapshot(collection(db, "products"), snapshot => {
    allProducts = snapshot.docs.map(productDoc => ({ id: productDoc.id, ...productDoc.data() }));
    renderProducts();
  }, error => showMessage(`Could not load products: ${error.message}`, true));
}

function renderProducts() {
  const search = document.getElementById("searchProducts").value.trim().toLowerCase();
  const products = allProducts.filter(product =>
    `${product.name || ""} ${product.category || ""}`.toLowerCase().includes(search)
  );
  const table = document.getElementById("productsTable");

  table.innerHTML = products.length ? products.map(product => `<tr>
    <td>${product.image ? `<img src="${escapeHtml(product.image)}" alt="" class="product-thumb">` : "-"}</td>
    <td>${escapeHtml(product.name || "-")}</td>
    <td>${escapeHtml(product.category || "-")}</td>
    <td>R${Number(product.price || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
    <td>${escapeHtml(product.stock ?? 0)}</td>
    <td><button type="button" class="delete-product" data-id="${product.id}">Delete</button></td>
  </tr>`).join("") : '<tr><td colspan="6" class="empty-state">No products found.</td></tr>';
}

document.getElementById("searchProducts").addEventListener("input", renderProducts);

document.getElementById("productsTable").addEventListener("click", async event => {
  const button = event.target.closest(".delete-product");
  if (!button || !confirm("Delete this product? This cannot be undone.")) return;
  try {
    await deleteDoc(doc(db, "products", button.dataset.id));
    showMessage("Product deleted.");
  } catch (error) {
    showMessage(`Could not delete product: ${error.message}`, true);
  }
});

document.getElementById("productForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector("button[type=submit]");
  const data = new FormData(form);
  const imageFile = data.get("imageFile");
  let image = data.get("imageUrl").trim();

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";
    if (imageFile?.size) {
      const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const imageRef = ref(storage, `products/${Date.now()}-${safeName}`);
      await uploadBytes(imageRef, imageFile);
      image = await getDownloadURL(imageRef);
    }
    if (!image) throw new Error("Add an image file or image URL.");

    await addDoc(collection(db, "products"), {
      name: data.get("name").trim(),
      category: data.get("category").trim(),
      price: Number(data.get("price")),
      stock: Number(data.get("stock")),
      image,
      sizes: data.get("sizes").split(",").map(size => size.trim()).filter(Boolean),
      colors: data.get("colors").split(",").map(color => color.trim()).filter(Boolean),
      brand: "PLUGSA",
      status: "active",
      createdAt: serverTimestamp()
    });
    form.reset();
    showMessage("Product uploaded successfully.");
  } catch (error) {
    showMessage(`Could not upload product: ${error.message}`, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Upload product";
  }
});

function showMessage(message, isError = false) {
  const element = document.getElementById("adminMessage");
  element.textContent = message;
  element.className = isError ? "message error" : "message";
}
