import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const LoansHub: React.FC = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-lg border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">サンプル貸出</h1>
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-600 font-medium hidden sm:block">{currentUser?.email}</span>
              <div className="h-10 w-px bg-gray-300"></div>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← ホーム
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-5">

          {/* 1. 貸出アイテム一覧 */}
          <div
            onClick={() => navigate('/loans/items')}
            className="relative overflow-hidden rounded-2xl bg-slate-100 p-8 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-b-4 border-slate-300 hover:bg-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">📋</div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">貸出アイテム一覧</h2>
                <p className="text-slate-600 text-sm mt-1">現在の貸出記録を確認・管理する</p>
              </div>
            </div>
          </div>

          {/* 2. 貸出カード作成 */}
          <div
            onClick={() => navigate('/loans/new')}
            className="relative overflow-hidden rounded-2xl bg-emerald-100 p-8 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-b-4 border-emerald-300 hover:bg-emerald-200"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">➕</div>
              <div>
                <h2 className="text-xl font-bold text-emerald-800">貸出カード作成</h2>
                <p className="text-emerald-700 text-sm mt-1">貸出先・アイテムを選択して共有カードを作成する</p>
              </div>
            </div>
          </div>

          {/* 3. 作成済みカードの一覧 */}
          <div
            onClick={() => navigate('/loans/cards')}
            className="relative overflow-hidden rounded-2xl bg-blue-100 p-8 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-b-4 border-blue-300 hover:bg-blue-200"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🗂️</div>
              <div>
                <h2 className="text-xl font-bold text-blue-800">作成済みカードの一覧</h2>
                <p className="text-blue-700 text-sm mt-1">これまでに作成した貸出カードを確認・共有する</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default LoansHub
