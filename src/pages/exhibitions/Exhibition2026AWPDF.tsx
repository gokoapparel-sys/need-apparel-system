import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { COMPANY_INFO } from '../../constants/companyInfo'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: 3,
    borderBottomColor: '#DAA520',
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  badge: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#DAA520',
    letterSpacing: 2,
    marginBottom: 10,
  },
  mainTitle: {
    marginTop: 30,
    marginBottom: 40,
    textAlign: 'center',
  },
  titleLine1: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    letterSpacing: 3,
    marginBottom: 8,
  },
  titleLine2: {
    fontSize: 42,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    letterSpacing: 6,
    marginBottom: 8,
  },
  titleLine3: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    letterSpacing: 4,
  },
  divider: {
    width: 80,
    height: 3,
    backgroundColor: '#DAA520',
    marginHorizontal: 'auto',
    marginVertical: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: 2,
    borderBottom: 2,
    borderBottomColor: '#DAA520',
    paddingBottom: 5,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  infoCard: {
    width: '30%',
    padding: 15,
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  infoCardTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: 1,
  },
  infoCardText: {
    fontSize: 11,
    color: '#333',
    lineHeight: 1.6,
  },
  infoNote: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
  },
  accessSection: {
    marginBottom: 20,
  },
  accessItem: {
    marginBottom: 12,
  },
  accessTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  accessText: {
    fontSize: 10,
    color: '#333',
    lineHeight: 1.6,
  },
  accessAlternative: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: 1,
    borderTopColor: '#e5e5e5',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: 2,
    borderTopColor: '#DAA520',
    paddingTop: 15,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCompany: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  footerText: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  footerWebsite: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#DAA520',
  },
})

const Exhibition2026AWPDF: React.FC = () => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
          <Text style={styles.badge}>EXHIBITION 2025</Text>
        </View>

        {/* メインタイトル */}
        <View style={styles.mainTitle}>
          <Text style={styles.titleLine1}>GOKO EXHIBITION</Text>
          <Text style={styles.titleLine2}>2026</Text>
          <Text style={styles.titleLine3}>Autumn & Winter</Text>
        </View>

        <View style={styles.divider} />

        {/* 開催情報グリッド */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>開催期間</Text>
            <Text style={styles.infoCardText}>
              2025年12月22日（月）{'\n'}～ 12月26日（金）
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>開催時間</Text>
            <Text style={styles.infoCardText}>
              10:00 ～ 18:00{'\n'}
              <Text style={styles.infoNote}>※最終日は17:00まで</Text>
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>開催場所</Text>
            <Text style={styles.infoCardText}>
              株式会社 互興{'\n'}本社ショールーム
            </Text>
          </View>
        </View>

        {/* アクセス情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アクセス</Text>
          <View style={styles.accessSection}>
            <View style={styles.accessItem}>
              <Text style={styles.accessTitle}>住所</Text>
              <Text style={styles.accessText}>{COMPANY_INFO.fullAddress}</Text>
            </View>

            <View style={styles.accessItem}>
              <Text style={styles.accessTitle}>最寄駅</Text>
              <Text style={styles.accessText}>
                東京メトロ 銀座線・半蔵門線・千代田線{'\n'}
                「表参道」駅 A2出口より徒歩7分
              </Text>
              <View style={styles.accessAlternative}>
                <Text style={styles.accessText}>
                  東京メトロ 銀座線{'\n'}
                  「外苑前」駅 3番出口より徒歩8分
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* お問い合わせ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>お問い合わせ</Text>
          <View style={styles.accessItem}>
            <Text style={styles.accessText}>
              {COMPANY_INFO.fullAddress}{'\n'}
              {COMPANY_INFO.phoneFormatted}{'\n'}
              展示会に関するお問い合わせは、お気軽にご連絡ください。
            </Text>
          </View>
        </View>

        {/* フッター */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View>
              <Text style={styles.footerCompany}>{COMPANY_INFO.name}</Text>
              <Text style={styles.footerText}>{COMPANY_INFO.nameEn}</Text>
            </View>
            <View>
              <Text style={styles.footerWebsite}>www.goko-group.co.jp</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default Exhibition2026AWPDF
