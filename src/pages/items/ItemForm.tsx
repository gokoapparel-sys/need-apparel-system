import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { itemsService } from '../../services/itemsService'
import { patternsService } from '../../services/patternsService'
import { Pattern } from '../../types'

const ItemForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const isEditMode = !!id

  // フォームデータ
  const [formData, setFormData] = useState({
    itemNo: '',
    name: '',
    sku: '', // 後方互換性
    fabricNo: '',
    fabricName: '',
    composition: '',
    fabricSpec: '',
    dollarPrice: 0,
    moq: '',
    referencePrice: 0,
    fabricCost: 0, // 生地値
    fabricCostCurrency: 'USD' as 'USD' | 'CNY', // 生地値通貨
    requiredFabricLength: 0, // 要尺
    factory: '',
    color: '', // 後方互換性
    size: '', // 後方互換性
    status: 'active' as 'active' | 'archived',
    patternId: '',
    patternNo: '',
    createdBy: '',
    plannerId: '', // 企画担当者ID
    appealPoint: '',
  })

  const [existingImages, setExistingImages] = useState<{ url: string; path: string }[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [existingFabricImages, setExistingFabricImages] = useState<{ url: string; path: string }[]>([])
  const [newFabricImages, setNewFabricImages] = useState<File[]>([])
  const [fabricPreviewUrls, setFabricPreviewUrls] = useState<string[]>([])
  const [existingSpecFiles, setExistingSpecFiles] = useState<{ url: string; path: string; name?: string }[]>([])
  const [newSpecFiles, setNewSpecFiles] = useState<File[]>([])
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // カメラ関連
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [activeCameraTarget, setActiveCameraTarget] = useState<'product' | 'fabric' | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)


  // 型紙一覧を読み込み
  useEffect(() => {
    loadPatterns()
  }, [])

  // 編集モード時にデータをロード
  useEffect(() => {
    if (isEditMode && id) {
      loadItem(id)
    }
  }, [id, isEditMode])

  const loadPatterns = async () => {
    try {
      const { patterns: patternsList } = await patternsService.listPatterns()
      // activeステータスの型紙のみフィルタリング
      const activePatterns = patternsList.filter(p => p.status === 'active')
      setPatterns(activePatterns)
    } catch (error) {
      console.error('型紙一覧読み込みエラー:', error)
    }
  }

  const loadItem = async (itemId: string) => {
    try {
      setLoading(true)
      const item = await itemsService.getItem(itemId)
      if (item) {
        setFormData({
          itemNo: item.itemNo || item.sku, // 後方互換性
          name: item.name,
          sku: item.sku,
          fabricNo: item.fabricNo || '',
          fabricName: item.fabricName || '',
          composition: item.composition || '',
          fabricSpec: item.fabricSpec || '',
          dollarPrice: item.dollarPrice || 0,
          moq: item.moq || '',
          referencePrice: item.referencePrice || 0,
          fabricCost: item.fabricCost || 0,
          fabricCostCurrency: item.fabricCostCurrency || 'USD',
          requiredFabricLength: item.requiredFabricLength || 0,
          factory: item.factory || '',
          color: item.color || '',
          size: item.size || '',
          status: item.status,
          patternId: item.patternId || '',
          patternNo: item.patternNo || '',
          createdBy: item.createdBy || '',
          plannerId: item.plannerId || '',
          appealPoint: item.appealPoint || '',
        })
        setExistingImages(item.images || [])
        setExistingFabricImages(item.fabricImages || [])
        setExistingSpecFiles(item.specFiles || [])
      } else {
        alert('アイテムが見つかりません')
        navigate('/items')
      }
    } catch (error) {
      console.error('アイテム読み込みエラー:', error)
      alert('アイテムの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // フォーム入力の変更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const numericFields = ['dollarPrice', 'referencePrice', 'fabricCost', 'requiredFabricLength']

    // 型紙選択の場合、patternIdとpatternNoを自動設定
    if (name === 'patternId') {
      const selectedPattern = patterns.find(p => p.id === value)
      setFormData((prev) => ({
        ...prev,
        patternId: value,
        patternNo: selectedPattern?.patternCode || '',
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value,
      }))
    }

    // エラーをクリア
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // 新しい画像の選択
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // バリデーション
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const invalidFiles = files.filter((f) => !validImageTypes.includes(f.type))
    if (invalidFiles.length > 0) {
      alert('画像ファイル（JPEG、PNG、GIF、WebP）のみ選択してください')
      e.target.value = ''
      return
    }

    const oversizedFiles = files.filter((f) => f.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('ファイルサイズは10MB以下にしてください')
      e.target.value = ''
      return
    }

    setNewImages((prev) => [...prev, ...files])

    // プレビュー生成
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrls((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }


  // 新しい画像のプレビューを削除
  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // 既存画像を削除
  const handleRemoveExistingImage = async (path: string) => {
    if (!id) return
    if (!confirm('この画像を削除しますか？')) return

    try {
      await itemsService.removeImage(id, path)
      setExistingImages((prev) => prev.filter((img) => img.path !== path))
      alert('画像を削除しました')
    } catch (error) {
      console.error('画像削除エラー:', error)
      alert('画像の削除に失敗しました')
    }
  }

  // 新しい生地画像の選択
  const handleFabricImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // バリデーション
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const invalidFiles = files.filter((f) => !validImageTypes.includes(f.type))
    if (invalidFiles.length > 0) {
      alert('画像ファイル（JPEG、PNG、GIF、WebP）のみ選択してください')
      e.target.value = ''
      return
    }

    const oversizedFiles = files.filter((f) => f.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('ファイルサイズは10MB以下にしてください')
      e.target.value = ''
      return
    }

    setNewFabricImages((prev) => [...prev, ...files])

    // プレビュー生成
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFabricPreviewUrls((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  // 新しい生地画像のプレビューを削除
  const handleRemoveNewFabricImage = (index: number) => {
    setNewFabricImages((prev) => prev.filter((_, i) => i !== index))
    setFabricPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // 既存生地画像を削除
  const handleRemoveExistingFabricImage = async (path: string) => {
    if (!id) return
    if (!confirm('この画像を削除しますか？')) return

    try {
      await itemsService.removeFabricImage(id, path)
      setExistingFabricImages((prev) => prev.filter((img) => img.path !== path))
      alert('画像を削除しました')
    } catch (error) {
      console.error('画像削除エラー:', error)
      alert('画像の削除に失敗しました')
    }
  }

  // 新しい仕様書の選択
  const handleSpecFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // バリデーション（サイズのみ、形式は自由）
    const oversizedFiles = files.filter((f) => f.size > 20 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('ファイルサイズは20MB以下にしてください')
      e.target.value = ''
      return
    }

    setNewSpecFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  // 新しい仕様書をリストから削除
  const handleRemoveNewSpecFile = (index: number) => {
    setNewSpecFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // 既存仕様書を削除
  const handleRemoveExistingSpecFile = async (path: string) => {
    if (!id) return
    if (!confirm('このファイルを削除しますか？')) return

    try {
      await itemsService.removeSpecFile(id, path)
      setExistingSpecFiles((prev) => prev.filter((f) => f.path !== path))
      alert('ファイルを削除しました')
    } catch (error) {
      console.error('ファイル削除エラー:', error)
      alert('ファイルの削除に失敗しました')
    }
  }

  // カメラ起動
  const startCamera = async (target: 'product' | 'fabric') => {
    try {
      setActiveCameraTarget(target)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      setIsCameraOpen(true)
    } catch (error) {
      console.error('Camera error:', error)
      alert('カメラの起動に失敗しました。カメラへのアクセスを許可してください。\nまたは、ファイル選択をご利用ください。')
    }
  }

  // カメラ停止
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
    setActiveCameraTarget(null)
  }

  // 写真撮影
  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `camera-${new Date().getTime()}.jpg`
            const file = new File([blob], fileName, { type: 'image/jpeg' })

            // プレビュー生成
            const reader = new FileReader()
            reader.onloadend = () => {
              const result = reader.result as string
              if (activeCameraTarget === 'product') {
                setNewImages((prev) => [...prev, file])
                setPreviewUrls((prev) => [...prev, result])
              } else if (activeCameraTarget === 'fabric') {
                setNewFabricImages((prev) => [...prev, file])
                setFabricPreviewUrls((prev) => [...prev, result])
              }
            }
            reader.readAsDataURL(file)

            stopCamera()
          }
        }, 'image/jpeg')
      }
    }
  }

  // コンポーネントのアンマウント時にストリームを停止
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // モーダルが開いている時にビデオ要素にストリームをセット
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [isCameraOpen])

  // バリデーション
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.itemNo.trim()) {
      newErrors.itemNo = 'アイテムNo.は必須です'
    }
    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です'
    }
    if (!formData.createdBy.trim()) {
      newErrors.createdBy = '入力者IDは必須です'
    }
    if (!formData.plannerId.trim()) {
      newErrors.plannerId = '企画担当者IDは必須です'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      alert('入力内容を確認してください')
      return
    }

    try {
      setSubmitting(true)

      // skuフィールドに後方互換性のためitemNoを設定
      const itemData = {
        ...formData,
        sku: formData.itemNo, // 後方互換性
      }

      if (isEditMode && id) {
        // 更新
        await itemsService.updateItem(id, itemData)

        // 新しい画像をアップロード
        if (newImages.length > 0) {
          await itemsService.attachImages(id, newImages)
        }
        // 新しい生地画像をアップロード
        if (newFabricImages.length > 0) {
          await itemsService.attachFabricImages(id, newFabricImages)
        }
        // 新しい仕様書をアップロード
        if (newSpecFiles.length > 0) {
          await itemsService.attachSpecFiles(id, newSpecFiles)
        }

        alert('アイテムを更新しました')
        navigate('/items')
      } else {
        // 新規作成
        const itemId = await itemsService.createItem(itemData)

        // 画像をアップロード
        if (newImages.length > 0) {
          await itemsService.attachImages(itemId, newImages)
        }
        // 生地画像をアップロード
        if (newFabricImages.length > 0) {
          await itemsService.attachFabricImages(itemId, newFabricImages)
        }
        // 仕様書をアップロード
        if (newSpecFiles.length > 0) {
          await itemsService.attachSpecFiles(itemId, newSpecFiles)
        }

        alert('アイテムを作成しました')
        navigate('/items')
      }
    } catch (error: any) {
      console.error('保存エラー:', error)
      alert(`保存に失敗しました: ${error.message || error}`)
    } finally {
      setSubmitting(false)
    }
  }

  // 削除
  const handleDelete = async () => {
    if (!id) return
    if (!confirm('このアイテムを削除しますか？この操作は取り消せません。')) return

    try {
      setSubmitting(true)
      await itemsService.deleteItem(id)
      alert('アイテムを削除しました')
      navigate('/items')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-lg border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/items')}
                className="inline-flex items-center px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-bold rounded-lg hover:from-emerald-900 hover:to-black transition-all shadow-lg whitespace-nowrap text-sm sm:text-base border border-transparent"
              >
                ← <span className="hidden sm:inline">一覧</span>
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-primary-700 ml-3 sm:ml-6 whitespace-nowrap">
                {isEditMode ? '編集' : '新規登録'}
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 hidden sm:block truncate max-w-[150px]">{currentUser?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="card">
          {/* 基本情報 */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">基本情報</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* アイテムNo. */}
              <div>
                <label htmlFor="itemNo" className="block text-sm font-medium text-gray-700 mb-1">
                  アイテムNo. <span className="text-red-500">*</span>
                </label>
                <input
                  id="itemNo"
                  name="itemNo"
                  type="text"
                  value={formData.itemNo}
                  onChange={handleChange}
                  placeholder="例: IT-001"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.itemNo ? 'border-red-500' : 'border-gray-300'
                    }`}
                  disabled={submitting}
                />
                {errors.itemNo && <p className="mt-1 text-sm text-red-500">{errors.itemNo}</p>}
              </div>

              {/* アイテム名 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  アイテム名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  disabled={submitting}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* 生地No. */}
              <div>
                <label htmlFor="fabricNo" className="block text-sm font-medium text-gray-700 mb-1">
                  生地No.
                </label>
                <input
                  id="fabricNo"
                  name="fabricNo"
                  type="text"
                  value={formData.fabricNo}
                  onChange={handleChange}
                  placeholder="例: FB-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 生地名 */}
              <div>
                <label htmlFor="fabricName" className="block text-sm font-medium text-gray-700 mb-1">
                  生地名
                </label>
                <input
                  id="fabricName"
                  name="fabricName"
                  type="text"
                  value={formData.fabricName}
                  onChange={handleChange}
                  placeholder="例: コットンツイル"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 混率 */}
              <div>
                <label htmlFor="composition" className="block text-sm font-medium text-gray-700 mb-1">
                  混率
                </label>
                <input
                  id="composition"
                  name="composition"
                  type="text"
                  value={formData.composition}
                  onChange={handleChange}
                  placeholder="例: 綿100%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 生地規格 */}
              <div>
                <label htmlFor="fabricSpec" className="block text-sm font-medium text-gray-700 mb-1">
                  生地規格
                </label>
                <input
                  id="fabricSpec"
                  name="fabricSpec"
                  type="text"
                  value={formData.fabricSpec}
                  onChange={handleChange}
                  placeholder="例: 40/-天竺 170g/m² 生産生地"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                  生地の規格や目付、生産生地か市場生地か等を入力してください
                </p>
              </div>

              {/* ＄単価 */}
              <div>
                <label htmlFor="dollarPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  ＄単価
                </label>
                <input
                  id="dollarPrice"
                  name="dollarPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.dollarPrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>



              {/* 生地値 */}
              {/* 生地値 */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="fabricCost" className="block text-sm font-medium text-gray-700 mb-1">
                    生地値
                  </label>
                  <input
                    id="fabricCost"
                    name="fabricCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fabricCost}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={submitting}
                  />
                </div>
                <div className="w-32">
                  <label htmlFor="fabricCostCurrency" className="block text-sm font-medium text-gray-700 mb-1">
                    通貨
                  </label>
                  <select
                    id="fabricCostCurrency"
                    name="fabricCostCurrency"
                    value={formData.fabricCostCurrency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={submitting}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CNY">CNY (元)</option>
                  </select>
                </div>
              </div>

              {/* 要尺（ｍ） */}
              <div>
                <label htmlFor="requiredFabricLength" className="block text-sm font-medium text-gray-700 mb-1">
                  要尺（ｍ）
                </label>
                <input
                  id="requiredFabricLength"
                  name="requiredFabricLength"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.requiredFabricLength}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 単価枚数条件 */}
              <div>
                <label htmlFor="moq" className="block text-sm font-medium text-gray-700 mb-1">
                  単価枚数条件
                </label>
                <input
                  id="moq"
                  name="moq"
                  type="text"
                  value={formData.moq}
                  onChange={handleChange}
                  placeholder="例: 100枚以上"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 売単価（参考） */}
              <div>
                <label htmlFor="referencePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  売単価（参考）
                </label>
                <input
                  id="referencePrice"
                  name="referencePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.referencePrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 工場名 */}
              <div>
                <label htmlFor="factory" className="block text-sm font-medium text-gray-700 mb-1">
                  工場名
                </label>
                <input
                  id="factory"
                  name="factory"
                  type="text"
                  value={formData.factory}
                  onChange={handleChange}
                  placeholder="例: ○○工場"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>

              {/* 型紙選択 */}
              <div>
                <label htmlFor="patternId" className="block text-sm font-medium text-gray-700 mb-1">
                  型紙
                </label>
                <select
                  id="patternId"
                  name="patternId"
                  value={formData.patternId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                >
                  <option value="">型紙を選択してください</option>
                  {patterns.map((pattern) => (
                    <option key={pattern.id} value={pattern.id}>
                      {pattern.patternCode} - {pattern.patternName}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  型紙を選択すると、自動的に型紙No.が設定されます
                </p>
                {formData.patternNo && (
                  <p className="mt-1 text-xs text-emerald-600">
                    選択中の型紙No.: {formData.patternNo}
                  </p>
                )}
              </div>

              {/* ステータス */}
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
                  <option value="active">有効</option>
                  <option value="archived">アーカイブ</option>
                </select>
              </div>

              {/* アピールポイント */}
              <div className="md:col-span-2">
                <label htmlFor="appealPoint" className="block text-sm font-medium text-gray-700 mb-1">
                  アピールポイント
                </label>
                <textarea
                  id="appealPoint"
                  name="appealPoint"
                  rows={3}
                  value={formData.appealPoint}
                  onChange={handleChange}
                  placeholder="例: 軽量で通気性に優れた素材を使用。ストレッチ性があり着心地抜群です。"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* 入力者 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">入力者情報</h2>
            <div>
              <label htmlFor="createdBy" className="block text-sm font-medium text-gray-700 mb-1">
                入力者ID <span className="text-red-500">*</span>
              </label>
              <input
                id="createdBy"
                name="createdBy"
                type="text"
                value={formData.createdBy}
                onChange={handleChange}
                placeholder="例: tanaka@company.co.jp"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.createdBy ? 'border-red-500' : 'border-gray-300'
                  }`}
                disabled={submitting}
              />
              {errors.createdBy && <p className="mt-1 text-sm text-red-500">{errors.createdBy}</p>}
              <p className="mt-1 text-xs text-gray-500">
                ※必須：社内メールアドレスを入力してください。分類しない場合は『free』と入力してください
              </p>
            </div>
            <div className="mt-4">
              <label htmlFor="plannerId" className="block text-sm font-medium text-gray-700 mb-1">
                企画担当者ID <span className="text-red-500">*</span>
              </label>
              <input
                id="plannerId"
                name="plannerId"
                type="text"
                value={formData.plannerId}
                onChange={handleChange}
                placeholder="例: yamada@company.co.jp"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.plannerId ? 'border-red-500' : 'border-gray-300'
                  }`}
                disabled={submitting}
              />
              {errors.plannerId && <p className="mt-1 text-sm text-red-500">{errors.plannerId}</p>}
              <p className="mt-1 text-xs text-gray-500">
                ※必須：企画担当者のIDを入力してください
              </p>
            </div>
          </div>

          {/* 画像管理 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">画像</h2>

            {/* 既存画像 */}
            {isEditMode && existingImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">現在の画像</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={`画像 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img.path)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={submitting}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 新しい画像のプレビュー */}
            {previewUrls.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">追加する画像</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`プレビュー ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={submitting}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 画像アップロード */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                画像を追加
              </label>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ファイル選択 */}
                <div className="border border-gray-200 rounded-lg bg-white p-4">
                  <span className="block text-sm font-medium text-gray-700 mb-3">ファイルから選択</span>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mb-1 text-sm text-gray-500 font-semibold">クリックして画像を選択</p>
                      <p className="text-xs text-gray-400">複数選択可</p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleImageSelect}
                      className="opacity-0 w-full h-full absolute top-0 left-0 cursor-pointer"
                      disabled={submitting}
                    />
                  </label>
                </div>

                {/* カメラ撮影 */}
                <div className="border border-gray-200 rounded-lg bg-white p-4">
                  <span className="block text-sm font-medium text-gray-700 mb-3">カメラで撮影</span>
                  <button
                    type="button"
                    onClick={() => startCamera('product')}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-400 rounded-lg cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition-colors relative"
                    disabled={submitting}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="mb-1 text-sm text-emerald-700 font-bold">カメラを起動</p>
                    </div>
                  </button>
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    ※カメラの使用許可が必要です
                  </p>
                </div>
              </div>

              <p className="mt-1 text-xs text-gray-500">
                対応形式: JPEG, PNG, GIF, WebP（最大10MB）
              </p>
            </div>
          </div>

          {/* 生地資料画像管理 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">生地資料画像</h2>

            {/* 既存生地画像 */}
            {isEditMode && existingFabricImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">現在の画像</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingFabricImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={`生地資料画像 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingFabricImage(img.path)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={submitting}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 新しい生地画像のプレビュー */}
            {fabricPreviewUrls.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">追加する画像</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fabricPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`プレビュー ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFabricImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={submitting}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 画像アップロード */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                画像を追加
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ファイル選択 */}
                <div className="border border-gray-200 rounded-lg bg-white p-4">
                  <span className="block text-sm font-medium text-gray-700 mb-3">ファイルから選択</span>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mb-1 text-sm text-gray-500 font-semibold">クリックして画像を選択</p>
                      <p className="text-xs text-gray-400">複数選択可</p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleFabricImageSelect}
                      className="opacity-0 w-full h-full absolute top-0 left-0 cursor-pointer"
                      disabled={submitting}
                    />
                  </label>
                </div>

                {/* カメラ撮影 */}
                <div className="border border-gray-200 rounded-lg bg-white p-4">
                  <span className="block text-sm font-medium text-gray-700 mb-3">カメラで撮影</span>
                  <button
                    type="button"
                    onClick={() => startCamera('fabric')}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-400 rounded-lg cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition-colors relative"
                    disabled={submitting}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="mb-1 text-sm text-emerald-700 font-bold">カメラを起動</p>
                    </div>
                  </button>
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    ※カメラの使用許可が必要です
                  </p>
                </div>
              </div>

              <p className="mt-1 text-xs text-gray-500">
                対応形式: JPEG, PNG, GIF, WebP（最大10MB）
              </p>
            </div>
          </div>

          {/* 仕様書管理 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">仕様書ファイル</h2>

            <div className="space-y-4">
              {/* 既存の仕様書リスト */}
              {isEditMode && existingSpecFiles.length > 0 && (
                <ul className="divide-y divide-gray-200 border rounded-md">
                  {existingSpecFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center p-3 hover:bg-gray-50">
                      <div className="flex items-center overflow-hidden">
                        <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 hover:text-emerald-800 truncate">
                          {file.name || '仕様書ファイル ' + (index + 1)}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingSpecFile(file.path)}
                        className="text-red-600 hover:text-red-800 p-1"
                        disabled={submitting}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* 新規追加ファイルリスト */}
              {newSpecFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">追加するファイル:</h4>
                  <ul className="divide-y divide-gray-200 border rounded-md border-emerald-100 bg-emerald-50">
                    {newSpecFiles.map((file, index) => (
                      <li key={index} className="flex justify-between items-center p-3">
                        <div className="flex items-center overflow-hidden">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="ml-2 text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewSpecFile(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          disabled={submitting}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ファイルアップロードUI */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  onChange={handleSpecFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={submitting}
                />
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">
                    クリックしてファイルを選択
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, Excel, 画像など（最大20MB）
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* ボタン */}
          <div className="mt-8 pt-8 border-t flex flex-wrap justify-between gap-2">
            <div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-4 py-2 sm:px-6 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base whitespace-nowrap"
                >
                  削除
                </button>
              )}
            </div>
            <div className="flex flex-wrap space-x-2 sm:space-x-4 gap-2">
              <button
                type="button"
                onClick={() => navigate('/items')}
                disabled={submitting}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-base whitespace-nowrap"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 sm:px-8 sm:py-3 text-xs sm:text-base whitespace-nowrap"
              >
                {submitting ? '保存中...' : isEditMode ? '更新' : '作成'}
              </button>
            </div>
          </div>
        </form>
      </main>
      {/* カメラモーダル */}
      {
        isCameraOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col justify-center items-center overflow-hidden">
            <div className="relative w-full max-w-lg mx-auto h-full max-h-[80vh] bg-black flex flex-col">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover flex-1"
              ></video>

              <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center space-x-8 pb-4">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-white text-gray-800 rounded-full p-4 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-white border-4 border-gray-300 rounded-full p-6 shadow-xl active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 bg-red-600 rounded-full" />
                </button>

                <div className="w-14"></div> {/* スペース調整用 */}
              </div>

              <div className="absolute top-4 left-0 right-0 text-center">
                <span className="bg-black bg-opacity-50 text-white px-4 py-1 rounded-full text-sm">
                  {activeCameraTarget === 'product' ? '製品画像を撮影' : '生地画像を撮影'}
                </span>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default ItemForm
