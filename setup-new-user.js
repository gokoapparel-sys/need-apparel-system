// 新しいプロジェクト用の初期ユーザー作成スクリプト (Client SDK版)
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// 正しい設定情報（ユーザー提供）
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
const auth = getAuth(app);

async function createInitialUser() {
    const email = "goko.apparel@gmail.com";
    const password = "goko1953";

    console.log(`\n🚀 ユーザー作成を開始します: ${email}`);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("✅ ユーザー作成成功！");
        console.log(`UID: ${user.uid}`);
        console.log("-----------------------------------------");
        console.log("新しいログイン情報:");
        console.log(`メール: ${email}`);
        console.log(`パスワード: ${password}`);
        console.log("-----------------------------------------");
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("⚠️ このメールアドレスは既に登録されています。");
        } else {
            console.error("❌ エラーが発生しました:", error.message);
        }
    }

    // プロセス終了
    setTimeout(() => process.exit(0), 1000);
}

createInitialUser();
