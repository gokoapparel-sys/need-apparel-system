import React, { useState, useEffect } from 'react'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import Exhibition2026AWPDF from './Exhibition2026AWPDF'

const Exhibition2026AWPDFViewer: React.FC = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const DownloadButton = () => (
    <PDFDownloadLink
      document={<Exhibition2026AWPDF />}
      fileName="GOKO_EXHIBITION_2026_AW.pdf"
      style={{
        padding: '12px 24px',
        backgroundColor: '#DAA520',
        color: '#1a1a1a',
        textDecoration: 'none',
        borderRadius: '50px',
        fontWeight: 700,
        fontSize: '1rem',
      }}
    >
      PDFをダウンロード
    </PDFDownloadLink>
  )

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <div
        style={{
          padding: '20px',
          backgroundColor: '#1a1a1a',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
          GOKO EXHIBITION 2026 AW - 展示会案内
        </h1>
        {isClient && <DownloadButton />}
      </div>

      {/* PDFビューアー */}
      {isClient ? (
        <PDFViewer style={{ flex: 1, border: 'none' }} showToolbar={true}>
          <Exhibition2026AWPDF />
        </PDFViewer>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            color: '#666',
          }}
        >
          PDF読み込み中...
        </div>
      )}
    </div>
  )
}

export default Exhibition2026AWPDFViewer
