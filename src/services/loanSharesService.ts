import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase/config'
import { LoanShare } from '../types'

const COLLECTION_NAME = 'loanShares'

export const loanSharesService = {
  // 一覧取得
  async listLoanShares() {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as LoanShare[]
  },

  // 1件取得
  async getLoanShare(id: string): Promise<LoanShare | null> {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as LoanShare
  },

  // 新規作成
  async createLoanShare(data: Omit<LoanShare, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  // 削除
  async deleteLoanShare(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  },

  // 公開URL生成
  generateShareUrl(id: string): string {
    return `${window.location.origin}/loan-share/${id}`
  },
}
