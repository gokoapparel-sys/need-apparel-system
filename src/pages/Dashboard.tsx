import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Dashboard: React.FC = () => {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b-4 border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center min-h-[5rem] py-2">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img src="/need-logo.svg" alt="NEED" className="h-8 sm:h-10" />
              <div>
                <h1 className="text-sm sm:text-xl font-black text-gray-900 tracking-tight whitespace-nowrap">
                  ニード商品管理システム
                </h1>
                <p className="text-xs text-gray-600 font-medium">NEED Co., Ltd.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-6">
              <span className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block">{currentUser?.email}</span>
              <div className="h-10 w-px bg-gray-300 hidden sm:block"></div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg text-xs sm:text-base whitespace-nowrap"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* アイテム管理 - Pastel Blue */}
          <div
            onClick={() => navigate('/items')}
            className="relative overflow-hidden rounded-2xl bg-blue-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-b-4 border-blue-300 hover:bg-blue-200"
          >
            <h2 className="text-xl font-bold text-blue-800 mb-2">アイテム管理</h2>
            <p className="text-blue-700 text-sm font-medium">商品情報の登録・編集・検索</p>
          </div>

          {/* 展示会管理 - Pastel Pink */}
          <div
            onClick={() => navigate('/exhibitions')}
            className="relative overflow-hidden rounded-2xl bg-pink-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-b-4 border-pink-300 hover:bg-pink-200"
          >
            <h2 className="text-xl font-bold text-pink-800 mb-2">展示会管理</h2>
            <p className="text-pink-700 text-sm font-medium">展示会の管理とカタログ作成</p>
          </div>

          {/* ピックアップリスト - Pastel Yellow */}
          <div
            onClick={() => navigate('/pickups')}
            className="relative overflow-hidden rounded-2xl bg-amber-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-b-4 border-amber-300 hover:bg-amber-200"
          >
            <h2 className="text-xl font-bold text-amber-800 mb-2">ピックアップリスト</h2>
            <p className="text-amber-700 text-sm font-medium">展示会での商品選定とWeb共有</p>
          </div>

          {/* 生地マスタ - Pastel Green */}
          <div
            onClick={() => navigate('/fabrics')}
            className="relative overflow-hidden rounded-2xl bg-emerald-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-b-4 border-emerald-300 hover:bg-emerald-200"
          >
            <h2 className="text-xl font-bold text-emerald-800 mb-2">生地マスタ</h2>
            <p className="text-emerald-700 text-sm font-medium">生地情報の一元管理</p>
          </div>

          {/* 型紙マスタ - Pastel Purple */}
          <div
            onClick={() => navigate('/patterns')}
            className="relative overflow-hidden rounded-2xl bg-purple-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-b-4 border-purple-300 hover:bg-purple-200"
          >
            <h2 className="text-xl font-bold text-purple-800 mb-2">型紙マスタ</h2>
            <p className="text-purple-700 text-sm font-medium">型紙・仕様書・展開図の管理</p>
          </div>

          {/* 画像アップロード - Pastel Orange */}
          <div
            onClick={() => navigate('/uploads')}
            className="relative overflow-hidden rounded-2xl bg-orange-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-b-4 border-orange-300 hover:bg-orange-200"
          >
            <h2 className="text-xl font-bold text-orange-800 mb-2">画像アップロード</h2>
            <p className="text-orange-700 text-sm font-medium">商品画像のアップロードと管理</p>
          </div>

          {/* サンプル貸出 - Blue Gray */}
          <div
            onClick={() => navigate('/loans')}
            className="relative overflow-hidden rounded-2xl bg-slate-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-b-4 border-slate-300 hover:bg-slate-200"
          >
            <h2 className="text-xl font-bold text-slate-700 mb-2">サンプル貸出</h2>
            <p className="text-slate-600 text-sm font-medium">貸出・返却のシンプルな管理</p>
          </div>

          {/* ピックアップランキング - Primary (Rose) */}
          <div
            onClick={() => navigate('/pickup-rankings')}
            className="relative overflow-hidden rounded-2xl bg-rose-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-b-4 border-rose-300 hover:bg-rose-200"
          >
            <h2 className="text-xl font-bold text-rose-800 mb-2">ピックアップランキング</h2>
            <p className="text-rose-700 text-sm font-medium">人気アイテムのランキング分析</p>
          </div>
        </div>

        <div className="mt-8 card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ようこそ</h2>
          <p className="text-gray-700">
            ニード商品管理システムにログインしました。
            <br />
            各機能のカードをクリックして開始してください。
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>初期設定:</strong> Firebaseの設定が完了し、認証機能が動作しています。
              <br />
              次のステップでは、各マスタデータの登録と管理機能を実装していきます。
            </p>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <p className="text-xs text-gray-400">
          Need Apparel System v1.3.1
        </p>
        <p className="text-xs text-gray-400">
          &copy; 2026 kozakura All Rights Reserved.
        </p>
        <button
          onClick={() => navigate('/about')}
          className="text-xs text-gray-400 hover:text-gray-600 underline mt-1"
        >
          このシステムについて
        </button>
      </footer>
    </div>
  )
}

export default Dashboard
