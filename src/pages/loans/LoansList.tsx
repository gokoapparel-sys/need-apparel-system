import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { loansService } from '../../services/loansService'
import { itemsService } from '../../services/itemsService'
import { Loan } from '../../types'

const LoansList: React.FC = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'borrowed' | 'returned'>('all')
  const [sortBy, setSortBy] = useState<'borrowDate' | 'staff'>('borrowDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [itemImages, setItemImages] = useState<Record<string, string>>({})

  useEffect(() => {
    loadLoans()
  }, [statusFilter, sortBy, sortOrder])

  const loadLoans = async () => {
    try {
      setLoading(true)
      const params = {
        sortBy,
        sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      }
      const { loans: data } = await loansService.listLoans(params)
      setLoans(data)

      // アイテム画像を非同期で取得
      if (data.length > 0) {
        const itemIds = Array.from(new Set(data.map(loan => loan.itemId)))
        try {
          const items = await itemsService.getItemsByIds(itemIds)
          const imageMap: Record<string, string> = {}
          items.forEach(item => {
            if (item.id && item.images && item.images.length > 0) {
              imageMap[item.id] = item.images[0].url
            }
          })
          setItemImages(imageMap)
        } catch {
          // 画像取得失敗はメインフローを止めない
        }
      } else {
        setItemImages({})
      }
    } catch (error) {
      console.error('貸出記録読み込みエラー:', error)
      alert('貸出記録の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChangeInline = async (id: string, newStatus: 'borrowed' | 'returned') => {
    try {
      if (newStatus === 'returned') {
        await loansService.returnLoan(id)
      } else {
        await loansService.reopenLoan(id)
      }
      loadLoans()
    } catch (error) {
      console.error('ステータス変更エラー:', error)
      alert('ステータスの変更に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('この貸出記録を削除してもよろしいですか？')) return
    try {
      await loansService.deleteLoan(id)
      alert('削除しました')
      loadLoans()
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return ''
    let date: Date
    if (timestamp.toDate) {
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      return ''
    }
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-lg border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* 左側：タイトル */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/loans')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 戻る
              </button>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">貸出アイテム一覧</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium hidden sm:block">{currentUser?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* フィルター・ソート */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">すべて</option>
                <option value="borrowed">貸出中</option>
                <option value="returned">返却済み</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">並び替え</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="borrowDate">貸出日</option>
                <option value="staff">担当者</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">順序</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="desc">降順</option>
                <option value="asc">昇順</option>
              </select>
            </div>
          </div>
        </div>

        {/* 貸出アイテム一覧 */}
        <div className="bg-white rounded-lg shadow-md" style={{ overflowX: 'auto' }}>
          <table className="min-w-max divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-14"></th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">品番</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">アイテム名</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">担当者</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">貸出先</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">貸出日</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">返却日</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">目的</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">ステータス</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">アクション</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    貸出記録がありません
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="w-10 h-10 flex-shrink-0">
                        {itemImages[loan.itemId] ? (
                          <img
                            src={itemImages[loan.itemId]}
                            alt=""
                            className="w-10 h-10 object-cover rounded border border-gray-200 bg-white cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => window.open(itemImages[loan.itemId], '_blank')}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-300 text-[9px]">
                            No Img
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{loan.itemNo}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 max-w-[130px]">
                      <span className="block truncate" title={loan.itemName || '-'}>{loan.itemName || '-'}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{loan.staff}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 max-w-[110px]">
                      <span className="block truncate" title={loan.borrowerName || '-'}>{loan.borrowerName || '-'}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{formatDate(loan.borrowDate)}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {loan.returnDate ? formatDate(loan.returnDate) : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900 max-w-[90px]">
                      <span className="block truncate" title={loan.purpose}>{loan.purpose}</span>
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      <select
                        value={loan.status}
                        onChange={(e) => handleStatusChangeInline(loan.id!, e.target.value as 'borrowed' | 'returned')}
                        className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer focus:outline-none ${
                          loan.status === 'borrowed'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            : 'bg-green-50 border-green-200 text-green-800'
                        }`}
                      >
                        <option value="borrowed">貸出中</option>
                        <option value="returned">返却済み</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 text-sm space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/loans/${loan.id}/detail`)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        詳細
                      </button>
                      <button
                        onClick={() => navigate(`/loans/${loan.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}

export default LoansList
