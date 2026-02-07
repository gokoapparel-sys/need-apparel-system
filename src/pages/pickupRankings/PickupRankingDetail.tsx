import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { exhibitionsService } from '../../services/exhibitionsService'
import { pickupsService } from '../../services/pickupsService'
import { itemsService } from '../../services/itemsService'
import { Exhibition, Item } from '../../types'


interface RankingItem {
  item: Item
  pickupCount: number
  customers: Array<{ pickupCode: string; customerName: string }>
}

const PickupRankingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [rankings, setRankings] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<RankingItem | null>(null)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    if (!id) return

    try {
      setLoading(true)

      // 展示会データを取得
      const exhibitionData = await exhibitionsService.getExhibition(id)
      setExhibition(exhibitionData)

      // この展示会のピックアップリストを取得
      const pickupsResult = await pickupsService.listPickups({ exhibitionId: id })
      const pickups = pickupsResult.pickups

      // アイテムごとに集計
      const itemPickupMap = new Map<string, { count: number; customers: Array<{ pickupCode: string; customerName: string }> }>()

      pickups.forEach(pickup => {
        if (pickup.itemIds && pickup.itemIds.length > 0) {
          pickup.itemIds.forEach(itemId => {
            const current = itemPickupMap.get(itemId) || { count: 0, customers: [] }
            current.count += 1
            current.customers.push({
              pickupCode: pickup.pickupCode,
              customerName: pickup.customerName
            })
            itemPickupMap.set(itemId, current)
          })
        }
      })

      // アイテム情報を取得（ピックアップされたアイテムのみを直接取得）
      const itemIds = Array.from(itemPickupMap.keys())
      const items = await itemsService.getItemsByIds(itemIds)

      // ランキングデータを作成
      const rankingData: RankingItem[] = items.map(item => {
        const data = itemPickupMap.get(item.id!)!
        return {
          item,
          pickupCount: data.count,
          customers: data.customers
        }
      })

      // ピックアップ数でソート
      rankingData.sort((a, b) => b.pickupCount - a.pickupCount)

      setRankings(rankingData)

    } catch (error) {
      console.error('データ読み込みエラー:', error)
      alert('データの読み込みに失敗しました')
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!exhibition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">展示会が見つかりません</p>
          <button
            onClick={() => navigate('/pickup-rankings')}
            className="btn-secondary"
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-lg border-b-4 border-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center min-h-[5rem] py-2 gap-2">
            {/* 左側：タイトル */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/pickup-rankings')}
                className="inline-flex items-center px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg text-xs sm:text-base whitespace-nowrap"
              >
                ← 一覧
              </button>
              <h1 className="text-sm sm:text-xl font-bold text-slate-700 whitespace-nowrap">ピックアップランキング</h1>
            </div>

            {/* 右側：ユーザー情報 */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-700 hidden sm:block">{currentUser?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 展示会情報 */}
        <div className="card mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{exhibition.exhibitionName}</h2>
              <p className="text-gray-600">
                {formatDate(exhibition.startDate)} ~ {formatDate(exhibition.endDate)} / {exhibition.location}
              </p>
              <p className="text-sm text-gray-500 mt-2">展示会コード: {exhibition.exhibitionCode}</p>
            </div>

          </div>
        </div>

        {/* ランキング表示 */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">ピックアップランキング（全{rankings.length}アイテム）</h3>

          {rankings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">ピックアップデータがありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankings.map((ranking, index) => (
                <div
                  key={ranking.item.id}
                  className="relative bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-300 rounded-xl p-5 hover:shadow-xl hover:border-gray-400 transition-all"
                >
                  {/* ランキングバッジ */}
                  <div
                    className="absolute top-3 left-3 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 text-white px-6 py-3 font-black text-2xl z-10 shadow-2xl border-4 border-white rounded-lg transform hover:scale-110 transition-transform"
                    style={{ boxShadow: '0 10px 40px rgba(37, 99, 235, 0.6), 0 0 20px rgba(59, 130, 246, 0.4)' }}
                  >
                    No.{index + 1}
                  </div>

                  {/* アイテム画像 */}
                  <div className="mt-12 mb-4">
                    {ranking.item.images && ranking.item.images.length > 0 ? (
                      <img
                        src={ranking.item.images[0].url}
                        alt={ranking.item.name}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEnlargedImage(ranking.item.images![0].url)
                        }}
                        className="w-full h-56 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity bg-white p-2"
                      />
                    ) : (
                      <div className="w-full h-56 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                        画像なし
                      </div>
                    )}
                  </div>

                  {/* アイテム情報 */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-600">{ranking.item.itemNo}</p>
                    <p className="text-base font-bold text-gray-900">{ranking.item.name}</p>

                    {/* ピックアップ回数表示 */}
                    <div className="pt-2 border-t-2 border-gray-300">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-600">ピックアップ回数</span>
                        <span className="text-2xl font-black text-slate-800">{ranking.pickupCount}回</span>
                      </div>

                      {/* 詳細ボタン */}
                      <button
                        onClick={() => setSelectedItem(ranking)}
                        className="w-full bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-950 hover:to-slate-950 text-white font-black py-4 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.02] text-base tracking-wide"
                        style={{ boxShadow: '0 8px 24px rgba(30, 58, 138, 0.5)' }}
                      >
                        ピックアップデータを見る
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 顧客リストモーダル */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-4">
              <h3 className="text-xl font-bold">ピックアップしたお客様</h3>
              <p className="text-sm mt-1">{selectedItem.item.itemNo} / {selectedItem.item.name}</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedItem.customers.length === 0 ? (
                <p className="text-gray-500 text-center">データがありません</p>
              ) : (
                <div className="space-y-3">
                  {selectedItem.customers.map((customer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{customer.customerName}</p>
                        <p className="text-sm text-gray-500">{customer.pickupCode}</p>
                      </div>
                      <div className="text-sm text-gray-400">
                        {index + 1}件目
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-all"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 画像拡大モーダル */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedImage(null)}
          style={{ cursor: 'pointer' }}
        >
          <img
            src={enlargedImage}
            alt="拡大画像"
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setEnlargedImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default PickupRankingDetail
