import { getStorage, ref, getBlob } from 'firebase/storage'

/**
 * Firebase Storage URLからストレージパスを抽出
 */
function extractStoragePathFromUrl(url: string): string | null {
  try {
    // Firebase Storage URLのパターン: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const matches = url.match(/\/o\/([^?]+)/)
    if (matches && matches[1]) {
      return decodeURIComponent(matches[1])
    }
    return null
  } catch (error) {
    console.error('URLからパスを抽出できません:', url, error)
    return null
  }
}

/**
 * 画像URLをbase64データURLに変換（Firebase Storage SDK使用）
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  // URLからストレージパスを抽出
  const storagePath = extractStoragePathFromUrl(url)
  if (!storagePath) {
    throw new Error('Invalid Firebase Storage URL')
  }

  console.log('画像を変換中:', storagePath)

  // Firebase Storageから画像を取得
  const storage = getStorage()
  const imageRef = ref(storage, storagePath)

  try {
    const blob = await getBlob(imageRef)

    // FileReaderでbase64に変換
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        console.log('✓ 画像変換成功:', storagePath)
        resolve(base64)
      }
      reader.onerror = () => {
        reject(new Error('FileReader error'))
      }
      reader.readAsDataURL(blob)
    })
  } catch (error: any) {
    // CORSエラーまたはその他のエラー
    console.warn('✗ 画像変換失敗:', storagePath, error?.message || error)
    throw error
  }
}

/**
 * プレースホルダー画像を生成（グラデーション背景）
 */
function generatePlaceholderImage(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 400

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // グラデーション背景
  const gradient = ctx.createLinearGradient(0, 0, 400, 400)
  gradient.addColorStop(0, '#1e3a8a')
  gradient.addColorStop(0.5, '#2563eb')
  gradient.addColorStop(1, '#3b82f6')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 400, 400)

  // テキスト
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.font = '24px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('画像読み込みエラー', 200, 200)

  return canvas.toDataURL('image/jpeg', 0.8)
}

/**
 * タイムアウト付きPromise
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ])
}

/**
 * 複数の画像URLをBlob URLに変換（Base64より大幅にメモリ効率が高い）
 * 使用後は必ず revoke() を呼び出してメモリを解放すること
 */
export async function convertImagesToBlobUrls(
  imageUrls: string[]
): Promise<{ urlMap: Record<string, string>; revoke: () => void }> {
  console.log('=== 画像変換開始 (Blob URL) ===')
  console.log('変換する画像数:', imageUrls.length)

  const urlMap: Record<string, string> = {}
  const blobUrls: string[] = []
  const placeholderImage = generatePlaceholderImage()
  let successCount = 0
  let errorCount = 0

  const storage = getStorage()
  const BATCH_SIZE = 10

  for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
    const batch = imageUrls.slice(i, i + BATCH_SIZE)
    console.log(`バッチ処理中: ${i + 1}〜${Math.min(i + BATCH_SIZE, imageUrls.length)} / ${imageUrls.length}`)

    await Promise.all(
      batch.map(async (url) => {
        try {
          const storagePath = extractStoragePathFromUrl(url)
          if (!storagePath) throw new Error('Invalid Firebase Storage URL')

          const imageRef = ref(storage, storagePath)
          const blob = await withTimeout(getBlob(imageRef), 15000)
          const blobUrl = URL.createObjectURL(blob)
          urlMap[url] = blobUrl
          blobUrls.push(blobUrl)
          successCount++
        } catch (error: any) {
          if (error?.message === 'Timeout') {
            console.error(`画像変換タイムアウト: ${url}`)
          } else {
            console.error(`画像変換失敗: ${url}`, error)
          }
          errorCount++
          urlMap[url] = placeholderImage
        }
      })
    )
  }

  console.log('=== 画像変換完了 ===')
  console.log('成功:', successCount, '/ 失敗:', errorCount)

  return {
    urlMap,
    revoke: () => blobUrls.forEach(blobUrl => URL.revokeObjectURL(blobUrl)),
  }
}

/**
 * 複数の画像URLをbase64に変換
 */
export async function convertImagesToBase64(
  imageUrls: string[]
): Promise<Record<string, string>> {
  console.log('=== 画像変換開始 ===')
  console.log('変換する画像数:', imageUrls.length)

  const results: Record<string, string> = {}
  let successCount = 0
  let errorCount = 0

  // プレースホルダー画像を事前に生成
  const placeholderImage = generatePlaceholderImage()

  for (const url of imageUrls) {
    try {
      // 5秒のタイムアウトを設定
      results[url] = await withTimeout(imageUrlToBase64(url), 15000)
      successCount++
    } catch (error: any) {
      if (error?.message === 'Timeout') {
        console.error(`画像変換タイムアウト: ${url}`)
      } else {
        console.error(`画像変換失敗: ${url}`, error)
      }
      errorCount++
      // エラーの場合はプレースホルダー画像を使用
      results[url] = placeholderImage
    }
  }

  console.log('=== 画像変換完了 ===')
  console.log('成功:', successCount, '/ 失敗:', errorCount)

  if (errorCount > 0) {
    console.warn('⚠️ 一部の画像の読み込みに失敗しました。Firebase StorageのCORS設定を確認してください。')
  }

  return results
}
