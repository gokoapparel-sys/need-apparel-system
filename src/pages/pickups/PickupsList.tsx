import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { pickupsService } from '../../services/pickupsService'
import { itemsService } from '../../services/itemsService'
import { Pickup } from '../../types'
import { generatePickupCatalogHTML } from '../../utils/pdfGenerators/pickupCatalogHTML'
import { generatePDFFromHTML } from '../../utils/pdfGenerators/htmlToPdfGenerator'
import { convertImagesToBlobUrls } from '../../utils/imageUtils'

const PickupsList: React.FC = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [pickups, setPickups] = useState<Pickup[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [sortBy, setSortBy] = useState<'createdDate' | 'customerName'>('createdDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadPickups()
  }, [statusFilter, sortBy, sortOrder])

  const loadPickups = async () => {
    try {
      setLoading(true)
      const params = {
        sortBy,
        sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      }
      const { pickups: data } = await pickupsService.listPickups(params)

      // 共有URLがないピックアップリストに自動的に共有URLを生成・保存
      const updatedPickups = await Promise.all(
        data.map(async (pickup) => {
          if (!pickup.shareUrl && pickup.id) {
            const shareUrl = pickupsService.generateShareUrl(pickup.id)
            try {
              await pickupsService.updatePickup(pickup.id, { shareUrl })
              return { ...pickup, shareUrl }
            } catch (error) {
              console.error('共有URL保存エラー:', pickup.id, error)
              return pickup
            }
          }
          return pickup
        })
      )

      setPickups(updatedPickups)
    } catch (error) {
      console.error('ピックアップリスト読み込みエラー:', error)
      alert('ピックアップリストの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('このピックアップリストを削除してもよろしいですか？')) {
      return
    }

    try {
      await pickupsService.deletePickup(id)
      alert('削除しました')
      loadPickups()
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

  const copyShareUrl = (shareUrl: string) => {
    navigator.clipboard.writeText(shareUrl)
    alert('共有URLをコピーしました')
  }

  const handleExportPDF = async (pickup: Pickup) => {
    try {
      console.log('=== ピックアップリストPDF出力開始 ===')
      console.log('お客様名:', pickup.customerName)

      // アイテムデータを読み込み
      const allItems = await itemsService.listAllItems({ status: 'active' })
      const selectedItems = allItems.filter((item) => pickup.itemIds?.includes(item.id!))

      if (selectedItems.length === 0) {
        alert('アイテムが選択されていません')
        return
      }

      console.log('アイテム数:', selectedItems.length)

      // 画像URLを収集
      const imageUrls: string[] = []
      selectedItems.forEach(item => {
        if (item.images && item.images.length > 0) {
          imageUrls.push(item.images[0].url)
        }
      })

      console.log('画像URL数:', imageUrls.length)

      // 画像をBlob URLに変換
      const { urlMap: imageBase64Map, revoke } = await convertImagesToBlobUrls(imageUrls)

      console.log('画像変換完了')

      try {
        // HTMLを生成
        const htmlContent = generatePickupCatalogHTML({
          pickup,
          items: selectedItems,
          imageBase64Map
        })

        console.log('HTML生成完了')

        // PDFを生成してダウンロード
        const filename = `ピックアップリスト_${pickup.pickupCode}_${pickup.customerName}.pdf`
        await generatePDFFromHTML(htmlContent, filename, 'landscape')

        console.log('=== PDF出力完了 ===')
      } finally {
        revoke()
      }
    } catch (error) {
      console.error('PDF出力エラー:', error)
      alert('PDF出力に失敗しました')
    }
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
          <div className="flex flex-wrap justify-between items-center min-h-[5rem] py-2 gap-2">
            {/* 左側：タイトルと新規作成 */}
            <div className="flex items-center space-x-2 sm:space-x-6">
              <h1 className="text-sm sm:text-2xl font-black text-gray-900 tracking-tight whitespace-nowrap">ピックアップリスト管理</h1>
              <button
                onClick={() => navigate('/pickups/new')}
                className="inline-flex items-center px-3 py-2 sm:px-8 sm:py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl hover:shadow-2xl border-2 border-emerald-500 text-xs sm:text-base whitespace-nowrap"
              >
                + 新規作成
              </button>
            </div>

            {/* 右側：ユーザー情報とホームボタン */}
            <div className="flex items-center space-x-2 sm:space-x-6">
              <span className="text-xs sm:text-sm text-gray-600 font-medium hidden md:block">{currentUser?.email}</span>
              <div className="h-10 w-px bg-gray-300 hidden md:block"></div>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg text-xs sm:text-base whitespace-nowrap"
              >
                ← ホーム
              </button>
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
                <option value="active">有効</option>
                <option value="archived">アーカイブ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">並び替え</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="createdDate">作成日</option>
                <option value="customerName">お客様名</option>
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

        {/* ピックアップリスト一覧 */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    ピックアップコード
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    お客様名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    展示会
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    アイテム数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    作成日
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    ステータス
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pickups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      ピックアップリストがありません
                    </td>
                  </tr>
                ) : (
                  pickups.map((pickup) => (
                    <tr key={pickup.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{pickup.pickupCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{pickup.customerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {pickup.exhibitionName || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{pickup.itemIds?.length ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(pickup.createdDate)}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            pickup.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {pickup.status === 'active' ? '有効' : 'アーカイブ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-nowrap gap-1">
                          {/* 主要アクション */}
                          <button
                            onClick={() => handleExportPDF(pickup)}
                            disabled={!pickup.itemIds || pickup.itemIds.length === 0}
                            className="inline-flex items-center px-2 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-md hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            title="PDF出力"
                          >
                            📄 PDF
                          </button>
                          <button
                            onClick={() => copyShareUrl(pickup.shareUrl || pickupsService.generateShareUrl(pickup.id!))}
                            className="inline-flex items-center px-2 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-md hover:bg-green-100 transition-colors whitespace-nowrap"
                            title="共有URLをコピー"
                          >
                            🔗 URL
                          </button>
                          {/* セカンダリアクション */}
                          <button
                            onClick={() => navigate(`/pickups/${pickup.id}/detail`)}
                            className="inline-flex items-center px-2 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap"
                            title="詳細を表示"
                          >
                            📋 詳細
                          </button>
                          <button
                            onClick={() => navigate(`/pickups/${pickup.id}`)}
                            className="inline-flex items-center px-2 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
                            title="編集"
                          >
                            ✏️ 編集
                          </button>
                          <button
                            onClick={() => handleDelete(pickup.id!)}
                            className="inline-flex items-center px-2 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-md hover:bg-red-100 transition-colors whitespace-nowrap"
                            title="削除"
                          >
                            🗑️ 削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PickupsList
