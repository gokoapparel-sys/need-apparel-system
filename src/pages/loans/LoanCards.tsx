import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { loansService } from '../../services/loansService'
import { loanSharesService } from '../../services/loanSharesService'
import { Loan, LoanShare } from '../../types'

const LoanCards: React.FC = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [loanShares, setLoanShares] = useState<LoanShare[]>([])
  const [allLoans, setAllLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [shares, { loans }] = await Promise.all([
        loanSharesService.listLoanShares(),
        loansService.listLoans({ sortBy: 'borrowDate', sortOrder: 'desc' }),
      ])
      setLoanShares(shares)
      setAllLoans(loans)
    } catch (error) {
      console.error('読み込みエラー:', error)
    } finally {
      setLoading(false)
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

  const getShareStatus = (share: LoanShare): 'borrowed' | 'returned' => {
    const ids = new Set(share.loanIds)
    const related = allLoans.filter(l => l.id && ids.has(l.id))
    if (related.length === 0) return 'borrowed'
    return related.every(l => l.status === 'returned') ? 'returned' : 'borrowed'
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
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/loans')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 戻る
              </button>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">作成済みカード一覧</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium hidden sm:block">{currentUser?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          {loanShares.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-base font-medium">作成済みのカードはありません</p>
              <button
                onClick={() => navigate('/loans/new')}
                className="mt-6 btn-primary"
              >
                最初のカードを作成する
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {loanShares.map(share => {
                const url = loanSharesService.generateShareUrl(share.id!)
                const shareStatus = getShareStatus(share)
                return (
                  <div
                    key={share.id}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-gray-900 text-base">
                          {share.cardName || share.borrowerName}
                        </span>
                        {share.cardName && (
                          <span className="text-sm text-gray-500">{share.borrowerName}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          shareStatus === 'returned'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {shareStatus === 'returned' ? '返却済み' : '貸出中'}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {share.loanIds.length}件
                        </span>
                        {share.expectedReturnDate && (
                          <span className="text-xs text-gray-500">
                            返却予定: {formatDate(share.expectedReturnDate)}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(share.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-1 truncate">{url}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(url)
                          alert('URLをコピーしました')
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100"
                      >
                        コピー
                      </button>
                      <button
                        onClick={() => navigate(`/loans/share/${share.id}`)}
                        className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                      >
                        管理
                      </button>
                      <button
                        onClick={() => window.open(url, '_blank')}
                        className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
                      >
                        共有URL
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm('この貸出カードを削除しますか？')) return
                          try {
                            await loanSharesService.deleteLoanShare(share.id!)
                            loadData()
                          } catch (error) {
                            console.error('削除エラー:', error)
                            alert('削除に失敗しました')
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default LoanCards
