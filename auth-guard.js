import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const LOGIN_PAGE = "login.html";
const LOGIN_MESSAGE = "Please login to continue.";

function currentDestination() {
  return `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search}${window.location.hash}`;
}

function validReturnTo(value) {
  return value && !value.startsWith("//") && !/^[a-z][a-z\d+.-]*:/i.test(value) ? value : "index.html";
}

function showLoginMessage() {
  let message = document.getElementById("auth-login-message");
  if (!message) {
    message = document.createElement("div");
    message.id = "auth-login-message";
    message.setAttribute("role", "status");
    message.style.cssText = "position:fixed;z-index:10000;left:50%;bottom:24px;transform:translateX(-50%);max-width:calc(100% - 32px);padding:12px 18px;border-radius:999px;background:#f7ff00;color:#050505;font:700 14px/1.2 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);text-align:center;";
    document.body.appendChild(message);
  }
  message.textContent = LOGIN_MESSAGE;
}

export function redirectToLogin(returnTo = currentDestination()) {
  showLoginMessage();
  const loginUrl = `${LOGIN_PAGE}?returnTo=${encodeURIComponent(returnTo)}&notice=login`;
  window.setTimeout(() => window.location.assign(loginUrl), 700);
}

export function requireAuth(event, returnTo) {
  if (auth.currentUser) return true;
  event?.preventDefault();
  redirectToLogin(returnTo);
  return false;
}

export function protectPage() {
  return new Promise(resolve => onAuthStateChanged(auth, user => {
    if (user) {
      resolve(user);
      return;
    }
    redirectToLogin();
  }));
}

export function getPostLoginDestination() {
  return validReturnTo(new URLSearchParams(window.location.search).get("returnTo"));
}

export function showLoginNotice() {
  if (new URLSearchParams(window.location.search).get("notice") === "login") showLoginMessage();
}

document.addEventListener("click", event => {
  const protectedControl = event.target.closest("[data-requires-auth]");
  if (!protectedControl) return;
  const destination = protectedControl.getAttribute("href") || currentDestination();
  requireAuth(event, destination);
});
