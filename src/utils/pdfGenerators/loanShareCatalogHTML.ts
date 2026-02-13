import { Item, LoanShare } from '../../types'

interface LoanShareCatalogHTMLProps {
  loanShare: LoanShare
  items: Item[]
  imageBase64Map?: Record<string, string>
}

export function generateLoanShareCatalogHTML({ loanShare, items, imageBase64Map }: LoanShareCatalogHTMLProps): string {
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

  // ページごとにアイテムを分割
  // 全てのページにヘッダーがあるため、全ページ10アイテムずつ（5列×2段）
  const itemsPerPage = 10
  const pages: Item[][] = []

  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage))
  }

  // 最新のデザインに合わせたカラー定義
  // Emerald-500: #10b981
  // Teal-400: #2dd4bf
  // Teal-500: #14b8a6
  // Slate-700: #334155

  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Hiragino Kaku Gothic Pro', 'メイリオ', 'MS PGothic', sans-serif;
        }

        .pdf-page {
          width: 1123px;
          height: 794px;
          position: relative;
          background: white;
          page-break-after: always;
        }

        /* 表紙スタイル */
        .cover-page {
          /* Emerald Gradient */
          background: linear-gradient(135deg, #10b981 0%, #2dd4bf 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px;
          overflow: hidden;
          position: relative;
        }

        .cover-page::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
          border-radius: 50%;
        }

        .cover-page::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
          border-radius: 50%;
        }

        .cover-content {
          text-align: center;
          color: white;
          position: relative;
          z-index: 1;
          width: 80%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 60px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .cover-logo {
          width: 240px;
          height: auto;
          background: white;
          margin: 0 auto 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        
        .cover-logo img {
            width: 100%;
            height: auto;
        }

        .cover-logo-text {
             font-size: 36px;
             font-weight: 900;
             color: #10b981;
             letter-spacing: 4px;
        }

        .cover-company {
          font-size: 14px;
          margin-bottom: 20px;
          opacity: 0.9;
          letter-spacing: 2px;
          color: white;
          text-align: center;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .cover-title {
          font-size: 56px;
          font-weight: 900;
          margin-bottom: 10px;
          text-shadow: 0 2px 5px rgba(0,0,0,0.2);
          line-height: 1.2;
          letter-spacing: 1px;
        }

        .cover-subtitle-en {
            font-size: 16px;
            letter-spacing: 4px;
            text-transform: uppercase;
            opacity: 0.9;
            margin-bottom: 40px;
            font-weight: 700;
        }

        .cover-client-name {
          font-size: 36px;
          margin-bottom: 15px;
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .cover-client-company {
            font-size: 24px;
            margin-bottom: 40px;
            font-weight: 500;
            opacity: 0.95;
        }

        .cover-info {
          font-size: 18px;
          margin-bottom: 8px;
          line-height: 1.6;
          font-weight: 500;
        }

        .cover-footer {
          position: absolute;
          bottom: 30px;
          text-align: center;
          color: rgba(255,255,255,0.8);
          font-size: 12px;
          width: 100%;
        }

        /* コンテンツページスタイル */
        .content-page {
          padding: 15px 20px;
          background: #f8fafc; /* Slate-50 */
        }

        .page-header {
          margin-bottom: 10px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); /* Emerald to Teal */
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }

        .page-title {
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 1px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .page-subtitle {
          font-size: 12px;
          opacity: 0.9;
          font-weight: 500;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .item-card {
          border: none;
          padding: 8px;
          border-radius: 8px;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
          height: 310px; /* Reduced height to prevent footer overlap */
        }
        
        .item-card-header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
            margin-bottom: 5px;
        }

        .item-image {
          width: 100%;
          height: 160px; /* Reduced height */
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 10px;
          margin-bottom: 8px;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }

        .watermark {
          position: absolute;
          bottom: 15px;
          left: 67.5%;
          transform: translateX(-50%);
          font-size: 12px;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.6);
          text-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
          pointer-events: none;
          z-index: 10;
          letter-spacing: 2px;
          user-select: none;
        }

        .item-image img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
        }

        .item-no {
          font-size: 16px;
          font-weight: bold;
          color: #0f172a; /* Slate-900 */
          letter-spacing: 0.5px;
        }

        .item-name {
          font-size: 11px;
          font-weight: 500;
          color: #334155; /* Slate-700 */
          margin-bottom: 6px;
          line-height: 1.4;
          height: 32px; /* 2行分確保 */
          overflow: hidden;
        }

        .item-field {
          font-size: 10px;
          margin-bottom: 2px;
          line-height: 1.5;
          display: flex;
        }

        .field-label {
          min-width: 50px;
          font-weight: bold;
          color: #64748b; /* Slate-500 */
        }

        .field-value {
          color: #0f172a; /* Slate-900 */
          font-weight: 500;
        }

        .page-footer {
          position: absolute;
          bottom: 15px;
          left: 20px;
          right: 20px;
          text-align: center;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          color: #94a3b8;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <!-- 表紙 -->
      <div class="pdf-page cover-page">
        <div class="cover-content">
          <div class="cover-logo">
             <div class="cover-logo-text">NEED</div>
          </div>
          
          <div class="cover-title">Sample Pickup Card</div>
          <div class="cover-subtitle-en">Official Loan Documentation</div>
          
          <div class="cover-client-name">${loanShare.borrowerName} 様</div>
          ${loanShare.borrowerCompany ? `<div class="cover-client-company">${loanShare.borrowerCompany}</div>` : ''}
          
          <div style="margin-top: 30px; display: flex; justify-content: center; gap: 40px;">
             <div style="background: rgba(255,255,255,0.2); padding: 15px 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.3);">
                <div style="font-size: 12px; font-weight: bold; letter-spacing: 2px; margin-bottom: 5px;">TOTAL ITEMS</div>
                <div style="font-size: 32px; font-weight: 900; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${items.length} <span style="font-size: 14px; font-weight: normal;">items</span></div>
             </div>
             <div style="background: rgba(255,255,255,0.2); padding: 15px 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.3);">
                <div style="font-size: 12px; font-weight: bold; letter-spacing: 2px; margin-bottom: 5px;">DATE</div>
                <div style="font-size: 24px; font-weight: 900; margin-top: 5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${formatDate(loanShare.createdAt)}</div>
             </div>
          </div>
        </div>
        <div class="cover-footer">株式会社ニード | NEED Co., Ltd.</div>
      </div>

      <!-- 商品ページ -->
      ${pages.map((pageItems, pageIndex) => `
        <div class="pdf-page content-page">
          <div class="page-header">
            <div class="page-title">Sample Pickup Card</div>
            <div class="page-subtitle">${loanShare.borrowerName} 様 | ${formatDate(loanShare.createdAt)}</div>
          </div>

          <div class="items-grid">
            ${pageItems.map(item => `
              <div class="item-card">
                <div class="item-card-header">
                    <div class="item-no">${item.itemNo}</div>
                </div>
                
                <div class="item-image">
            ${(() => {
      if (item.images && item.images.length > 0) {
        const imageUrl = item.images[0].url
        const base64Image = imageBase64Map && imageBase64Map[imageUrl]

        if (base64Image && base64Image.startsWith('data:image/')) {
          return `<img src="${base64Image}" alt="${item.name}" />`
        } else {
          return '<div style="color: #999; font-size: 10px;">画像なし</div>'
        }
      } else {
        return '<div style="color: #999; font-size: 10px;">画像なし</div>'
      }
    })()}
                  <div class="watermark">NEED</div>
                </div>
                
                <div class="item-name">${item.name.replace(/[\s\u3000（(]/g, (match) => match === ' ' || match === '　' ? '' : '<br />' + match)}</div>
                
                <div class="item-field">
                  <span class="field-label">混率:</span>
                  <span class="field-value">${item.composition || '-'}</span>
                </div>
                <div class="item-field">
                  <span class="field-label">生地No:</span>
                  <span class="field-value">${item.fabricNo || '-'}</span>
                </div>
                <div class="item-field">
                  <span class="field-label">価格:</span>
                  <span class="field-value">${item.referencePrice ? `¥${item.referencePrice.toLocaleString()}` : (item.dollarPrice ? `$${item.dollarPrice}` : '-')}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="page-footer">
            株式会社ニード NEED Co., Ltd. | Page ${pageIndex + 1} of ${pages.length}
          </div>
        </div>
      `).join('')}
    </body>
    </html>
  `
}
