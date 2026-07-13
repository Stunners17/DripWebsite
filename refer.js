import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

let currentUser = null;
let referralCode = "";

const referralLink = document.getElementById("referralLink");
const friendName = document.getElementById("friendName");
const friendEmail = document.getElementById("friendEmail");
const referForm = document.getElementById("referForm");

const pendingCount = document.getElementById("pendingCount");
const completedCount = document.getElementById("completedCount");
const rewardCount = document.getElementById("rewardCount");

const historyTable = document.getElementById("historyTable");

onAuthStateChanged(auth, async (user)=>{

    if(!user){

        window.location.href="login.html";
        return;

    }

    currentUser = user;

    await loadReferralCode();

});

function generateReferralCode(){

    return "PLUGSA-" +

    Math.random()

    .toString(36)

    .substring(2,8)

    .toUpperCase();

}
async function loadReferralCode(){

    const ref = doc(db,"users",currentUser.uid);

    const snap = await getDoc(ref);

    if(snap.exists()){

        if(snap.data().referralCode){

            referralCode = snap.data().referralCode;

        }

    }

    if(!referralCode){

        referralCode = generateReferralCode();

        await setDoc(ref,{

            referralCode:referralCode,

            email:currentUser.email

        },{merge:true});

    }

    referralLink.value =
    window.location.origin +
    "/?ref=" +
    referralCode;

}