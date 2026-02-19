import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loanSharesService } from '../../services/loanSharesService'
import { loansService } from '../../services/loansService'
import { itemsService } from '../../services/itemsService'
import { LoanShare, Loan, Item } from '../../types'
import { generateLoanShareCatalogHTML } from '../../utils/pdfGenerators/loanShareCatalogHTML'
import { generatePDFFromHTML } from '../../utils/pdfGenerators/htmlToPdfGenerator'
import { convertImagesToBlobUrls } from '../../utils/imageUtils'

interface LoanItemData {
  loan: Loan
  item: Item | null
}

const LoanShareAdminView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loanShare, setLoanShare] = useState<LoanShare | null>(null)
  const [loanItems, setLoanItems] = useState<LoanItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | boolean>(false)
  const [isExporting, setIsExporting] = useState(false)
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

      const loanPromises = share.loanIds.map(loanId => loansService.getLoan(loanId))
      const loans = (await Promise.all(loanPromises)).filter(Boolean) as Loan[]

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
      setError('データの読み込み中にエラーが発生しました。')
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

  const allReturned = loanItems.length > 0 && loanItems.every(li => li.loan.status === 'returned')

  const handleStatusChange = async (loanId: string, newStatus: 'borrowed' | 'returned') => {
    try {
      if (newStatus === 'returned') {
        await loansService.returnLoan(loanId)
      } else {
        await loansService.reopenLoan(loanId)
      }
      setLoanItems(prev =>
        prev.map(li =>
          li.loan.id === loanId
            ? { ...li, loan: { ...li.loan, status: newStatus } }
            : li
        )
      )
    } catch (error) {
      console.error('ステータス変更エラー:', error)
      alert('ステータスの変更に失敗しました。')
    }
  }

  const handleExportPDF = async () => {
    if (!loanShare || loanItems.length === 0) return
    try {
      setIsExporting(true)
      const imageUrls: string[] = []
      loanItems.forEach(loanItem => {
        if (loanItem.item?.images && loanItem.item.images.length > 0) {
          imageUrls.push(loanItem.item.images[0].url)
        }
      })
      const { urlMap: imageBase64Map, revoke } = await convertImagesToBlobUrls(imageUrls)
      try {
        const htmlContent = generateLoanShareCatalogHTML({
          loanShare,
          loanItems,
          imageBase64Map,
        })
        const filename = `SampleLoanCard_${loanShare.borrowerName}.pdf`
        await generatePDFFromHTML(htmlContent, filename, 'landscape')
      } finally {
        revoke()
      }
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('PDFの出力に失敗しました。')
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error || !loanShare) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">エラーが発生しました</h1>
          <p className="text-gray-600">{error || 'データが見つかりません'}</p>
          <button onClick={() => navigate('/loans/cards')} className="mt-4 btn-primary">
            カード一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 管理者ナビバー */}
      <nav className="bg-white shadow-md border-b-4 border-emerald-600 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/loans/cards')}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow text-sm"
              >
                ← カード一覧
              </button>
              <div>
                <span className="font-bold text-gray-900 text-base">
                  {loanShare.cardName || loanShare.borrowerName}
                </span>
                {loanShare.cardName && (
                  <span className="ml-2 text-sm text-gray-500">{loanShare.borrowerName}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                allReturned ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {allReturned ? '✓ 全返却済み' : '● 貸出中'}
              </span>
              {loanShare.expectedReturnDate && (
                <span className="text-xs text-gray-500">
                  返却予定: {formatDate(loanShare.expectedReturnDate)}
                </span>
              )}
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 text-sm disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                    生成中...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    PDF出力
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* アイテムグリッド */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loanItems.map(({ loan, item }) => (
            <div
              key={loan.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100"
            >
              <div className={`h-1.5 ${loan.status === 'returned' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>

              <div className="p-5">
                {/* 画像 */}
                <div
                  className="aspect-square w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200 relative"
                  onClick={() => {
                    if (item?.images && item.images.length > 0) {
                      setSelectedImage(item.images[0].url)
                      setSelectedItem(item)
                    }
                  }}
                >
                  {/* ステータスバッジ（右上） */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold shadow ${
                      loan.status === 'returned' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {loan.status === 'returned' ? '返却済み' : '貸出中'}
                    </span>
                  </div>

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
                <div className="space-y-2">
                  <div className="border-b border-emerald-100 pb-2">
                    <p className="text-xs text-emerald-700 font-semibold mb-0.5">品番</p>
                    <p className="text-base font-bold text-emerald-900">{loan.itemNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">アイテム名</p>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{loan.itemName || item?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">貸出日</p>
                    <p className="text-sm text-gray-700">{formatDate(loan.borrowDate)}</p>
                  </div>

                  {/* ステータス変更プルダウン */}
                  <select
                    value={loan.status}
                    onChange={(e) => handleStatusChange(loan.id!, e.target.value as 'borrowed' | 'returned')}
                    className={`w-full mt-1 px-2 py-1.5 border rounded-lg text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                      loan.status === 'returned'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    }`}
                  >
                    <option value="borrowed">貸出中</option>
                    <option value="returned">返却済み</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loanItems.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow p-12 max-w-md mx-auto border border-gray-100">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-lg font-semibold text-gray-700">アイテムがありません</p>
            </div>
          </div>
        )}
      </main>

      {/* 画像拡大モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => { setSelectedImage(null); setSelectedItem(null) }}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex flex-col">
            <button
              className="absolute top-4 right-4 z-10 bg-white text-gray-900 rounded-full p-3 hover:bg-gray-100 transition-colors shadow-lg"
              onClick={() => { setSelectedImage(null); setSelectedItem(null) }}
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
              <div className="bg-white rounded-lg p-4 mt-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-emerald-700 font-semibold mb-1">品番</p>
                    <p className="text-base font-bold text-emerald-900">{selectedItem.itemNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">アイテム名</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedItem.name}</p>
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

export default LoanShareAdminView
