import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// ニード商品管理システムの設定
const firebaseConfig = {
    apiKey: "AIzaSyBfm9qvmYsY4voQhtznw02-O2Oj1Mg0qNk",
    authDomain: "need-apparel-system.firebaseapp.com",
    projectId: "need-apparel-system",
    storageBucket: "need-apparel-system.firebasestorage.app",
    messagingSenderId: "830635700483",
    appId: "1:830635700483:web:0ad9d2624d06179693b936",
    measurementId: "G-WWWND5WJP4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testItems = [
    {
        itemNo: "N-24SS-001",
        name: "シフォンブラウス",
        season: "2024SS",
        brand: "L'Amour",
        category: "Tops",
        color: "Pink",
        size: "M",
        price: 12000,
        cost: 4500,
        material: "Polyester 100%",
        status: "sample",
        fabricName: "シフォンジョーゼット",
        factory: "第一縫製",
        description: "春らしい軽やかなシフォン素材のブラウス。袖口のフリルがポイント。",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "System Admin"
    },
    {
        itemNo: "N-24SS-002",
        name: "フレアスカート",
        season: "2024SS",
        brand: "L'Amour",
        category: "Bottoms",
        color: "Lavender",
        size: "M",
        price: 15000,
        cost: 5500,
        material: "Cotton 60%, Polyester 40%",
        status: "pattern",
        fabricName: "ストレッチツイル",
        factory: "第二工場",
        description: "広がりすぎない上品なフレアシルエット。ウエストゴムで履き心地も快適。",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "System Admin"
    },
    {
        itemNo: "N-24SS-003",
        name: "リネンワンピース",
        season: "2024SS",
        brand: "L'Amour",
        category: "One-piece",
        color: "Beige",
        size: "Free",
        price: 22000,
        cost: 8000,
        material: "Linen 100%",
        status: "product",
        fabricName: "フレンチリネン",
        factory: "第一縫製",
        description: "夏まで着られる涼しいリネン素材。一枚で決まる主役級ワンピ。",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "System Admin"
    }
];

async function addTestItems() {
    console.log("🚀 テストデータの登録を開始します...");
    const collectionRef = collection(db, "items");

    try {
        for (const item of testItems) {
            const docRef = await addDoc(collectionRef, item);
            console.log(`✅ アイテム登録完了: ${item.name} (ID: ${docRef.id})`);
        }
        console.log("🎉 すべてのテストデータの登録が完了しました！");
    } catch (error) {
        console.error("❌ エラーが発生しました:", error);
    } finally {
        // 少し待ってから終了（ログ出力のため）
        setTimeout(() => process.exit(0), 1000);
    }
}

addTestItems();
