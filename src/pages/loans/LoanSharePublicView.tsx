import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { loanSharesService } from '../../services/loanSharesService'
import { loansService } from '../../services/loansService'
import { itemsService } from '../../services/itemsService'
import { LoanShare, Loan, Item } from '../../types'
import { generateLoanShareCatalogHTML } from '../../utils/pdfGenerators/loanShareCatalogHTML'
import { generatePDFFromHTML } from '../../utils/pdfGenerators/htmlToPdfGenerator'
import { convertImagesToBase64 } from '../../utils/imageUtils'

interface LoanItemData {
  loan: Loan
  item: Item | null
}

const LoanSharePublicView: React.FC = () => {
  const { id } = useParams<{ id: string }>()

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

  const handleExportPDF = async () => {
    if (!loanShare || loanItems.length === 0) return

    try {
      setIsExporting(true)

      // 画像URLを収集
      const imageUrls: string[] = []
      loanItems.forEach(loanItem => {
        if (loanItem.item?.images && loanItem.item.images.length > 0) {
          imageUrls.push(loanItem.item.images[0].url)
        }
      })

      // 画像をBase64に変換
      const imageBase64Map = await convertImagesToBase64(imageUrls)

      // HTML生成
      const htmlContent = generateLoanShareCatalogHTML({
        loanShare,
        items: loanItems.map(li => li.item).filter(Boolean) as Item[], // 型互換性のためにキャスト
        imageBase64Map
      })

      // PDF生成 & ダウンロード
      const filename = `SampleLoanCard_${loanShare.borrowerName}.pdf`
      await generatePDFFromHTML(htmlContent, filename, 'landscape')

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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ヘッダー */}
      <header className="relative bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-xl overflow-hidden min-h-[400px] flex items-center justify-center">

        {/* PDFダウンロードボタン */}
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md border border-white/40 rounded-full font-bold text-white shadow-lg hover:bg-white/30 transition-all ${isExporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>DOWNLOAD PDF</span>
              </>
            )}
          </button>
        </div>
        {/* 背景装飾 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-white/20 rounded-full blur-[80px] animate-pulse"></div>
          <div className="absolute bottom-[0%] -left-[10%] w-[500px] h-[500px] bg-cyan-300/30 rounded-full blur-[60px]"></div>
          <div className="absolute top-[40%] left-[30%] w-[200px] h-[200px] bg-yellow-200/20 rounded-full blur-[40px]"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-16 z-10 w-full">
          {/* ロゴ & タイトルエリア */}
          <div className="text-center mb-12">
            <div className="inline-block mb-6 bg-white p-4 rounded-xl shadow-lg">
              <img src="/need-logo.svg" alt="NEED" className="h-12 w-auto" />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2 drop-shadow-md">
                Sample Pickup Card
              </h1>
              <p className="text-emerald-50 text-sm tracking-[0.2em] uppercase font-medium">
                Official Loan Documentation
              </p>
            </div>
          </div>

          {/* 貸出情報カード (Glassmorphism) */}
          <div className="backdrop-blur-md bg-white/30 border-2 border-white/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:bg-white/35 transition-all duration-500">
            {/* カード背景の光沢 */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
              {/* 左側: メイン情報 */}
              <div className="text-center md:text-left space-y-4 border-b md:border-b-0 md:border-r border-white/30 pb-6 md:pb-0 md:pr-8">
                <div>
                  <p className="text-white text-xs font-black tracking-wider uppercase mb-2 drop-shadow-md">Client Name</p>
                  <h2 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-lg filter">
                    {loanShare.borrowerName} <span className="text-lg font-bold">様</span>
                  </h2>
                  {loanShare.borrowerCompany && (
                    <p className="text-xl text-white mt-2 font-bold drop-shadow-md">
                      {loanShare.borrowerCompany}
                    </p>
                  )}
                </div>
              </div>

              {/* 右側: 詳細スタッツ */}
              <div className="grid grid-cols-2 gap-6 pl-0 md:pl-4">
                <div className="bg-emerald-900/30 rounded-2xl p-4 border border-white/40 shadow-lg text-center backdrop-blur-md hover:bg-emerald-900/40 transition-colors">
                  <p className="text-white text-[10px] font-black uppercase tracking-widest mb-1 drop-shadow-md">Total Items</p>
                  <p className="text-4xl font-black text-white drop-shadow-xl">{loanItems.length}<span className="text-sm font-bold text-white ml-1">items</span></p>
                </div>
                <div className="bg-emerald-900/30 rounded-2xl p-4 border border-white/40 shadow-lg text-center backdrop-blur-md hover:bg-emerald-900/40 transition-colors">
                  <p className="text-white text-[10px] font-black uppercase tracking-widest mb-1 drop-shadow-md">Date</p>
                  <p className="text-xl font-black text-white mt-1 drop-shadow-xl">{formatDate(loanShare.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-emerald-100/70 text-xs tracking-widest">
              株式会社 ニード | NEED Co.,Ltd.
            </p>
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
                  className="aspect-square w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 relative"
                  onClick={() => {
                    if (item?.images && item.images.length > 0) {
                      setSelectedImage(item.images[0].url)
                      setSelectedItem(item)
                    }
                  }}
                >
                  {item?.images && item.images.length > 0 ? (
                    <>
                      <img
                        src={item.images[0].url}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-2 left-[67.5%] transform -translate-x-1/2 text-lg font-black text-white/50 drop-shadow-sm pointer-events-none select-none z-10 tracking-widest whitespace-nowrap">
                        NEED
                      </div>
                    </>
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

            <div className="flex-1 flex items-center justify-center relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedImage}
                alt={selectedItem?.name || '商品画像'}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl relative z-10"
              />
              <div className="absolute bottom-8 left-[67.5%] transform -translate-x-1/2 text-5xl font-black text-white/50 drop-shadow-md select-none pointer-events-none whitespace-nowrap z-20 tracking-widest">
                NEED
              </div>
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
      )
      }
    </div >
  )
}

export default LoanSharePublicView
