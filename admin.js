import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const ADMIN_EMAIL = "ntando.lawrance@gmail.com";
if(!ADMIN_EMAIL){
    console.log("Logged in as",user.email);
}

// Protect Admin Dashboard
onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (user.email !== ADMIN_EMAIL) {
        alert("Access Denied!");
        window.location.href = "index.html";
        return;
    }

    loadOrders();

});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async (e) => {

    e.preventDefault();

    await signOut(auth);

    window.location.href = "login.html";

});

// Load Orders
function loadOrders() {

    const tbody = document.getElementById("ordersTable");

    onSnapshot(collection(db, "orders"), (snapshot) => {

        tbody.innerHTML = "";

        let revenue = 0;
        let pending = 0;

        const customers = new Set();

        document.getElementById("totalOrders").textContent =
            snapshot.docs.length;

        snapshot.forEach(doc => {

            const order = doc.data();

            revenue += Number(order.total || 0);

            customers.add(order.email);

            if (order.status === "Pending Confirmation") {
                pending++;
            }

            tbody.innerHTML += `

<tr>

<td>${order.name}</td>

<td>${order.phone}</td>

<td>R${Number(order.total).toLocaleString("en-ZA")}</td>

<td>

<span class="status pending">

${order.status}

</span>

</td>

<td>

${order.createdAt?.toDate().toLocaleDateString() || "-"}

</td>

</tr>

`;

        });

        document.getElementById("pendingOrders").textContent = pending;

        document.getElementById("revenue").textContent =
            "R" + revenue.toLocaleString("en-ZA");

        document.getElementById("customers").textContent =
            customers.size;

    });

}