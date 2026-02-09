import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { loanSharesService } from '../../services/loanSharesService'
import { loansService } from '../../services/loansService'
import { itemsService } from '../../services/itemsService'
import { LoanShare, Loan, Item } from '../../types'

interface LoanItemData {
  loan: Loan
  item: Item | null
}

const LoanSharePublicView: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const [loanShare, setLoanShare] = useState<LoanShare | null>(null)
  const [loanItems, setLoanItems] = useState<LoanItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  useEffect(() => {
    if (id) {
      loadData(id)
    }
  }, [id])

  const loadData = async (shareId: string) => {
    try {
      setLoading(true)
      const share = await loanSharesService.getLoanShare(shareId)

      if (!share) {
        setError(true)
        return
      }

      setLoanShare(share)

      // 貸出データを取得
      const loanPromises = share.loanIds.map(loanId => loansService.getLoan(loanId))
      const loans = (await Promise.all(loanPromises)).filter(Boolean) as Loan[]

      // アイテムデータを取得
      const itemIds = Array.from(new Set(loans.map(l => l.itemId)))
      const items = itemIds.length > 0 ? await itemsService.getItemsByIds(itemIds) : []
      const itemMap = new Map(items.map(item => [item.id!, item]))

      const data: LoanItemData[] = loans.map(loan => ({
        loan,
        item: itemMap.get(loan.itemId) || null,
      }))

      setLoanItems(data)
    } catch (error) {
      console.error('貸出カード読み込みエラー:', error)
      setError(true)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error || !loanShare) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">貸出カードが見つかりません</h2>
          <p className="text-gray-600">
            このリンクは無効か、すでに削除されています。
            <br />
            担当者にお問い合わせください。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ヘッダー */}
      <header className="relative bg-gradient-to-br from-emerald-800 via-emerald-600 to-emerald-500 text-white shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-amber-400/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-emerald-400/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* ロゴ */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-900 font-black text-4xl px-8 py-3 rounded-xl shadow-lg">
              NEED
            </div>
          </div>

          {/* 会社名 */}
          <div className="text-center mb-6">
            <p className="text-lg font-medium tracking-wider opacity-95">
              株式会社 ニード | NEED Co.,Ltd.
            </p>
          </div>

          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight drop-shadow-lg">
              Sample Pickup Card
            </h1>
          </div>

          {/* 貸出先情報 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-3xl mx-auto border border-white/20 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center sm:text-left">
              <div>
                <p className="text-emerald-100 text-sm mb-1 font-medium">貸出先</p>
                <p className="text-xl font-bold">{loanShare.borrowerName} 様</p>
              </div>
              {loanShare.borrowerCompany && (
                <div>
                  <p className="text-emerald-100 text-sm mb-1 font-medium">会社名</p>
                  <p className="text-xl font-semibold">{loanShare.borrowerCompany}</p>
                </div>
              )}
              <div>
                <p className="text-emerald-100 text-sm mb-1 font-medium">貸出アイテム数</p>
                <p className="text-xl font-bold">{loanItems.length} 件</p>
              </div>
              <div>
                <p className="text-emerald-100 text-sm mb-1 font-medium">作成日</p>
                <p className="text-xl font-semibold">{formatDate(loanShare.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* アイテムグリッド */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loanItems.map(({ loan, item }) => (
            <div key={loan.id} className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-amber-400"></div>

              <div className="p-5">
                {/* 画像 */}
                <div
                  className="aspect-square w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    if (item?.images && item.images.length > 0) {
                      setSelectedImage(item.images[0].url)
                      setSelectedItem(item)
                    }
                  }}
                >
                  {item?.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0].url}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📷</div>
                        <div className="text-xs">画像なし</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 商品情報 */}
                <div className="space-y-3">
                  <div className="border-b border-emerald-100 pb-2">
                    <p className="text-xs text-emerald-700 font-semibold mb-1">品番</p>
                    <p className="text-lg font-bold text-emerald-900">{loan.itemNo}</p>
                  </div>

                  <div className="pb-2">
                    <p className="text-xs text-gray-500 mb-1">アイテム名</p>
                    <p className="text-base font-semibold text-gray-900 leading-snug">{loan.itemName || item?.name || '-'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">貸出日</p>
                    <p className="text-sm text-gray-700">{formatDate(loan.borrowDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loanItems.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto border border-emerald-100">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">アイテムがありません</p>
              <p className="text-sm text-gray-500">
                この貸出カードにはアイテムが含まれていません
              </p>
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white mt-16 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-900 font-black text-2xl px-6 py-2 rounded-lg shadow-lg">
                NEED
              </div>
            </div>
            <p className="text-lg font-medium mb-2 tracking-wide">
              株式会社 ニード | NEED Co.,Ltd.
            </p>
            <p className="text-emerald-100 opacity-90">
              ご不明な点がございましたら、担当者までお問い合わせください。
            </p>
          </div>
        </div>
      </footer>

      {/* 画像拡大モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedImage(null)
            setSelectedItem(null)
          }}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex flex-col">
            <button
              className="absolute top-4 right-4 z-10 bg-white text-gray-900 rounded-full p-3 hover:bg-gray-100 transition-colors shadow-lg"
              onClick={() => {
                setSelectedImage(null)
                setSelectedItem(null)
              }}
            >
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            <div className="flex-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedImage}
                alt={selectedItem?.name || '商品画像'}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            {selectedItem && (
              <div className="bg-white rounded-lg p-6 mt-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-emerald-700 font-semibold mb-1">品番</p>
                    <p className="text-lg font-bold text-emerald-900">{selectedItem.itemNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">アイテム名</p>
                    <p className="text-base font-semibold text-gray-900">{selectedItem.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LoanSharePublicView
