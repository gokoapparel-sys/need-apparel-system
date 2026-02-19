import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { loansService } from '../../services/loansService'
import { loanSharesService } from '../../services/loanSharesService'
import { itemsService } from '../../services/itemsService'
import { exhibitionsService } from '../../services/exhibitionsService'
import { Loan, Item, Exhibition } from '../../types'
import { Timestamp } from 'firebase/firestore'

const LoanForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [formData, setFormData] = useState({
    itemId: '',
    itemNo: '',
    itemName: '',
    staff: '',
    borrowerName: '',
    borrowDate: '',
    purpose: '',
    notes: '',
    status: 'borrowed' as 'borrowed' | 'returned',
  })

  // 新規作成用追加フィールド
  const [cardName, setCardName] = useState('')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')

  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [selectedExhibitionId, setSelectedExhibitionId] = useState('')
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [selectedItems, setSelectedItems] = useState<Item[]>([])

  // 新規作成後の成功パネル用
  const [successPanel, setSuccessPanel] = useState<{ shareUrl: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)

      // 展示会一覧を読み込み
      const { exhibitions: exData } = await exhibitionsService.listExhibitions()
      setExhibitions(exData)

      // 貸出中のアイテム一覧を取得
      const { loans: loansData } = await loansService.listLoans({ status: 'borrowed' })
      setActiveLoans(loansData)

      // 編集モードの場合、既存データを読み込み
      if (id) {
        const loan = await loansService.getLoan(id)
        if (loan) {
          setFormData({
            itemId: loan.itemId,
            itemNo: loan.itemNo,
            itemName: loan.itemName || '',
            staff: loan.staff,
            borrowerName: loan.borrowerName || '',
            borrowDate: loan.borrowDate
              ? new Date(loan.borrowDate.toDate()).toISOString().split('T')[0]
              : '',
            purpose: loan.purpose,
            notes: loan.notes || '',
            status: loan.status,
          })

          // 編集時は対象のアイテム情報を取得してセット
          const itemData = await itemsService.getItem(loan.itemId)
          if (itemData) {
            setSelectedItems([itemData])
          }

          // 既存の貸出アイテムが含まれる展示会を自動選択
          const foundEx = exData.find(ex => ex.catalogItemIds?.includes(loan.itemId))
          if (foundEx) {
            setSelectedExhibitionId(foundEx.id!)
          }
        } else {
          alert('貸出記録が見つかりません')
          navigate('/loans')
        }
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true)
      try {
        if (!selectedExhibitionId) {
          const allItems = await itemsService.listAllItems({ status: 'active' })
          setAvailableItems(allItems)
        } else {
          const ex = exhibitions.find(e => e.id === selectedExhibitionId)
          if (ex && ex.catalogItemIds && ex.catalogItemIds.length > 0) {
            const items = await itemsService.getItemsByIds(ex.catalogItemIds)
            setAvailableItems(items)
          } else {
            setAvailableItems([])
          }
        }
      } catch (error) {
        console.error('アイテム取得エラー:', error)
        alert('アイテムリストの取得に失敗しました')
      } finally {
        setLoadingItems(false)
      }
    }

    fetchItems()
  }, [selectedExhibitionId, exhibitions])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleItemClick = (item: Item) => {
    if (submitting) return

    const activeLoan = activeLoans.find(l => l.itemId === item.id && l.status === 'borrowed')
    const isSelfLoan = isEditMode && activeLoan && activeLoan.itemId === formData.itemId
    if (activeLoan && !isSelfLoan) {
      return
    }

    if (isEditMode) {
      setSelectedItems([item])
      setFormData(prev => ({
        ...prev,
        itemId: item.id!,
        itemNo: item.itemNo,
        itemName: item.name,
      }))
    } else {
      setSelectedItems(prev => {
        const exists = prev.find(i => i.id === item.id)
        if (exists) {
          return prev.filter(i => i.id !== item.id)
        } else {
          return [...prev, item]
        }
      })
    }
  }

  const handleRemoveItem = (itemId: string) => {
    if (submitting) return
    setSelectedItems(prev => prev.filter(i => i.id !== itemId))

    if (isEditMode && formData.itemId === itemId) {
      setFormData(prev => ({ ...prev, itemId: '', itemNo: '', itemName: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedItems.length === 0) {
      alert('アイテムを選択してください')
      return
    }

    if (!formData.staff.trim()) {
      alert('担当者を入力してください')
      return
    }

    if (!formData.borrowDate) {
      alert('貸出日を入力してください')
      return
    }

    if (!formData.purpose.trim()) {
      alert('目的を入力してください')
      return
    }

    // 新規作成時の追加バリデーション
    if (!isEditMode) {
      if (!formData.borrowerName.trim()) {
        alert('貸出先を入力してください')
        return
      }
    }

    try {
      setSubmitting(true)

      const baseData: Record<string, any> = {
        staff: formData.staff,
        borrowDate: Timestamp.fromDate(new Date(formData.borrowDate)),
        purpose: formData.purpose,
        notes: formData.notes,
        status: formData.status,
      }
      if (formData.borrowerName) baseData.borrowerName = formData.borrowerName
      if (currentUser?.email) baseData.createdBy = currentUser.email

      if (isEditMode) {
        // 更新：単一レコード
        const targetItem = selectedItems[0]
        const loanData = {
          ...baseData,
          itemId: targetItem.id!,
          itemNo: targetItem.itemNo,
          itemName: targetItem.name,
        } as any
        await loansService.updateLoan(id, loanData)
        alert('貸出記録を更新しました')
        navigate('/loans')
      } else {
        // 新規：複数レコード作成 + LoanShare作成
        const loanIds = await Promise.all(
          selectedItems.map(item => {
            const loanData = {
              ...baseData,
              itemId: item.id!,
              itemNo: item.itemNo,
              itemName: item.name,
            } as any
            return loansService.createLoan(loanData)
          })
        )

        // LoanShare作成
        const shareData: Record<string, any> = {
          cardName: cardName.trim(),
          borrowerName: formData.borrowerName.trim(),
          staff: formData.staff.trim(),
          loanIds,
        }
        if (expectedReturnDate) {
          shareData.expectedReturnDate = Timestamp.fromDate(new Date(expectedReturnDate))
        }
        if (currentUser?.email) shareData.createdBy = currentUser.email

        const shareId = await loanSharesService.createLoanShare(shareData as any)
        const shareUrl = loanSharesService.generateShareUrl(shareId)

        setSuccessPanel({ shareUrl })
      }
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // 成功パネル表示
  if (successPanel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">貸出カードを作成しました</h2>
            <p className="text-gray-500 mt-2 text-sm">{selectedItems.length}件の貸出記録と貸出カードが作成されました</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 mb-2 font-medium">公開URL（このURLを貸出先に共有してください）</p>
            <p className="text-sm font-mono text-gray-900 break-all select-all bg-white rounded p-2 border border-green-100">{successPanel.shareUrl}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(successPanel.shareUrl)
                alert('URLをクリップボードにコピーしました')
              }}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow"
            >
              URLをコピー
            </button>
            <button
              onClick={() => window.open(successPanel.shareUrl, '_blank')}
              className="w-full px-4 py-3 bg-white text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 font-bold"
            >
              プレビューを開く
            </button>
            <button
              onClick={() => navigate('/loans')}
              className="w-full px-4 py-3 text-gray-600 hover:text-gray-800 font-medium text-sm"
            >
              サンプル貸出トップに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/loans')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg"
              >
                ← 戻る
              </button>
              <h1 className="text-xl font-bold text-primary-700 ml-6">
                {isEditMode ? '貸出記録編集' : '新規貸出'}
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">{currentUser?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="card">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">貸出情報</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* 左カラム：入力フォーム群 */}
              <div className="space-y-5">

                {/* カード名（新規作成のみ） */}
                {!isEditMode && (
                  <div>
                    <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                      カード名 <span className="text-gray-500 text-xs">(任意)</span>
                    </label>
                    <input
                      id="cardName"
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="例: 2024秋冬展示会サンプル"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={submitting}
                    />
                  </div>
                )}

                {/* 貸出先（新規作成のみ） */}
                {!isEditMode && (
                  <div>
                    <label htmlFor="borrowerNameNew" className="block text-sm font-medium text-gray-700 mb-1">
                      貸出先 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="borrowerNameNew"
                      type="text"
                      value={formData.borrowerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, borrowerName: e.target.value }))}
                      placeholder="例: 田中花子"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={submitting}
                    />
                  </div>
                )}

                {/* 担当者 */}
                <div>
                  <label htmlFor="staff" className="block text-sm font-medium text-gray-700 mb-1">
                    担当者 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="staff"
                    name="staff"
                    type="text"
                    value={formData.staff}
                    onChange={handleChange}
                    placeholder="例: 山田太郎"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* 貸出先名（編集モードのみ） */}
                {isEditMode && (
                  <div>
                    <label htmlFor="borrowerName" className="block text-sm font-medium text-gray-700 mb-1">
                      貸出先名
                    </label>
                    <input
                      id="borrowerName"
                      name="borrowerName"
                      type="text"
                      value={formData.borrowerName}
                      onChange={handleChange}
                      placeholder="例: 田中花子"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={submitting}
                    />
                  </div>
                )}

                {/* 貸出日 */}
                <div>
                  <label htmlFor="borrowDate" className="block text-sm font-medium text-gray-700 mb-1">
                    貸出日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="borrowDate"
                    name="borrowDate"
                    type="date"
                    value={formData.borrowDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* 返却予定日（新規作成のみ） */}
                {!isEditMode && (
                  <div>
                    <label htmlFor="expectedReturnDate" className="block text-sm font-medium text-gray-700 mb-1">
                      返却予定日 <span className="text-gray-500 text-xs">(任意)</span>
                    </label>
                    <input
                      id="expectedReturnDate"
                      type="date"
                      value={expectedReturnDate}
                      onChange={(e) => setExpectedReturnDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={submitting}
                    />
                  </div>
                )}

                {/* 目的 */}
                <div>
                  <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                    目的 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="purpose"
                    name="purpose"
                    type="text"
                    value={formData.purpose}
                    onChange={handleChange}
                    placeholder="例: 展示会での使用"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* 備考 */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    備考
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="その他の情報"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={submitting}
                  />
                </div>

                {/* ステータス（編集モードのみ） */}
                {isEditMode && (
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      ステータス
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={submitting}
                    >
                      <option value="borrowed">貸出中</option>
                      <option value="returned">返却済み</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 右カラム：アイテム選択 */}
              <div className="flex flex-col h-full">
                {/* 展示会絞り込み */}
                <div className="mb-3">
                  <label htmlFor="exhibitionId" className="block text-sm font-medium text-gray-700 mb-1">
                    展示会で絞り込み <span className="text-gray-500 text-xs">(任意)</span>
                  </label>
                  <select
                    id="exhibitionId"
                    value={selectedExhibitionId}
                    onChange={(e) => setSelectedExhibitionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={submitting}
                  >
                    <option value="">すべてのアイテムから選択</option>
                    {exhibitions.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.exhibitionName} ({ex.exhibitionCode})
                      </option>
                    ))}
                  </select>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  アイテム選択 <span className="text-red-500">*</span>
                </label>

                {/* 検索ボックス */}
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="品番、名前、企画ID、作成者IDで検索..."
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* 選択済みアイテム表示エリア（コンパクト） */}
                {selectedItems.length > 0 && (
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-blue-900">選択中: {selectedItems.length}件</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditMode) return
                          setSelectedItems([])
                        }}
                        className={`text-xs text-red-500 hover:text-red-700 underline ${isEditMode ? 'hidden' : ''}`}
                      >
                        すべて解除
                      </button>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded max-h-32 overflow-y-auto divide-y divide-blue-100">
                      {selectedItems.map(item => (
                        <div key={item.id} className="p-2 flex justify-between items-center transition-colors hover:bg-blue-100">
                          <div className="flex items-center gap-2">
                            {item.images?.[0]?.url ? (
                              <img
                                src={item.images[0].url}
                                alt=""
                                className="w-8 h-8 object-cover rounded border border-blue-200 bg-white"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-white rounded border border-blue-200 flex items-center justify-center text-[10px] text-blue-400">NoImg</div>
                            )}
                            <div className="overflow-hidden">
                              <div className="font-bold text-blue-900 text-xs truncate">{item.itemNo}</div>
                              <div className="text-blue-700 text-[10px] truncate">{item.name}</div>
                            </div>
                          </div>
                          {!isEditMode && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id!)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="削除"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* アイテムリスト（メイン） */}
                <div className="border border-gray-300 rounded-md flex-grow overflow-y-auto bg-white min-h-[500px] max-h-[800px]">
                  {loadingItems ? (
                    <div className="p-4 text-center text-gray-500">読み込み中...</div>
                  ) : availableItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">アイテムが見つかりません</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {availableItems
                        .filter(item => {
                          if (!itemSearchQuery) return true
                          const query = itemSearchQuery.toLowerCase()
                          return (
                            item.itemNo.toLowerCase().includes(query) ||
                            item.name.toLowerCase().includes(query) ||
                            (item.plannerId && item.plannerId.toLowerCase().includes(query)) ||
                            (item.createdBy && item.createdBy.toLowerCase().includes(query))
                          )
                        })
                        .map((item) => {
                          const activeLoan = activeLoans.find(
                            (l) => l.itemId === item.id && l.status === 'borrowed'
                          )
                          const isSelfLoan = isEditMode && activeLoan && activeLoan.itemId === formData.itemId
                          const isBorrowed = !!activeLoan && !isSelfLoan
                          const isSelected = selectedItems.some(i => i.id === item.id)

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (submitting || isBorrowed) return
                                handleItemClick(item)
                              }}
                              className={`relative p-3 transition-colors ${isBorrowed
                                  ? 'bg-gray-50 cursor-not-allowed opacity-75'
                                  : 'cursor-pointer hover:bg-gray-50'
                                } ${isSelected ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                                }`}
                            >
                              <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                  {item.images && item.images.length > 0 ? (
                                    <img
                                      src={item.images[0].url}
                                      alt=""
                                      className="w-20 h-20 object-contain rounded border border-gray-200 bg-gray-50"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-20 h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-300 text-xs">
                                      No Img
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <div className="flex justify-between items-start">
                                    <span className={`font-medium text-base truncate ${isBorrowed ? 'text-gray-500' : 'text-gray-900'}`}>{item.itemNo}</span>
                                    {isBorrowed ? (
                                      <span className="text-xs text-white bg-red-500 px-2 py-1 rounded whitespace-nowrap ml-2 font-bold shadow-sm">
                                        貸出中
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap ml-2">
                                        {item.composition || '混率なし'}
                                      </span>
                                    )}
                                  </div>

                                  {isBorrowed && activeLoan ? (
                                    <div className="text-xs text-red-600 font-medium mt-1 bg-red-50 p-1 rounded border border-red-100">
                                      担当: {activeLoan.staff} <br />
                                      ({new Date(activeLoan.borrowDate.toDate()).toLocaleDateString()})
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-sm text-gray-600 truncate mt-0.5">{item.name}</div>
                                      <div className="flex justify-between items-center mt-1">
                                        <div className="text-xs text-gray-400">
                                          {!!item.price && `¥${item.price.toLocaleString()}`}
                                        </div>
                                        {item.plannerId && (
                                          <div className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                            {item.plannerId}
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      {availableItems.filter(item => {
                        if (!itemSearchQuery) return true
                        const query = itemSearchQuery.toLowerCase()
                        return (
                          item.itemNo.toLowerCase().includes(query) ||
                          item.name.toLowerCase().includes(query) ||
                          (item.plannerId && item.plannerId.toLowerCase().includes(query)) ||
                          (item.createdBy && item.createdBy.toLowerCase().includes(query))
                        )
                      }).length === 0 && (
                          <div className="p-4 text-center text-gray-500">
                            検索結果なし
                          </div>
                        )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  全 {availableItems.length} 件中 {availableItems.filter(item => {
                    if (!itemSearchQuery) return true
                    const query = itemSearchQuery.toLowerCase()
                    return (
                      item.itemNo.toLowerCase().includes(query) ||
                      item.name.toLowerCase().includes(query) ||
                      (item.plannerId && item.plannerId.toLowerCase().includes(query)) ||
                      (item.createdBy && item.createdBy.toLowerCase().includes(query))
                    )
                  }).length
                  } 件を表示
                </p>
              </div>
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="mt-8 pt-8 border-t flex justify-between">
            <button type="button" onClick={() => navigate('/loans')} className="btn-secondary">
              キャンセル
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? '保存中...' : isEditMode ? '更新' : '上記の内容でカードを作成する'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default LoanForm
