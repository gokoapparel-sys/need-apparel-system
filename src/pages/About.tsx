import React from 'react'
import { useNavigate } from 'react-router-dom'

const About: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                &larr; ホーム
              </button>
              <h1 className="text-xl font-bold text-primary-700 ml-6">このシステムについて</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="card">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Need Apparel System</h2>
            <p className="text-lg text-emerald-600 font-semibold">v1.3.1</p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">概要</h3>
              <p className="text-gray-700">
                アパレル商品の管理、展示会カタログ作成、ピックアップリスト共有、サンプル貸出管理などを一元的に行うWebシステムです。
              </p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">システム情報</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-xs text-gray-500 mb-1">システム名</dt>
                  <dd className="text-base font-semibold text-gray-900">Need Apparel System</dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-xs text-gray-500 mb-1">バージョン</dt>
                  <dd className="text-base font-semibold text-gray-900">v1.3.1</dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-xs text-gray-500 mb-1">著作権</dt>
                  <dd className="text-base font-semibold text-gray-900">&copy; 2026 kozakura</dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-xs text-gray-500 mb-1">ライセンス</dt>
                  <dd className="text-base font-semibold text-gray-900">All Rights Reserved</dd>
                </div>
              </dl>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">主な機能</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#9679;</span>
                  <span>アイテム管理 — 商品情報の登録・編集・検索</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#9679;</span>
                  <span>展示会管理 — 展示会の管理とWebカタログ作成</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#9679;</span>
                  <span>ピックアップリスト — 展示会での商品選定とWeb共有</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#9679;</span>
                  <span>生地マスタ — 生地情報の一元管理</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#9679;</span>
                  <span>型紙マスタ — 型紙・仕様書・展開図の管理</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#9679;</span>
                  <span>サンプル貸出 — 貸出・返却管理と貸出カード共有</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#9679;</span>
                  <span>ピックアップランキング — 人気アイテムのランキング分析</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            Need Apparel System v1.3.1 &mdash; &copy; 2026 kozakura All Rights Reserved.
          </p>
        </div>
      </main>
    </div>
  )
}

export default About
