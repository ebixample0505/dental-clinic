import { db } from './firebase';
import {
  doc, getDoc, setDoc, updateDoc
} from 'firebase/firestore';

export type Customer = {
  lineUserId: string;
  name: string;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

// 顧客情報を取得
export const getCustomer = async (lineUserId: string): Promise<Customer | null> => {
  try {
    const ref = doc(db, 'customers', lineUserId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as Customer;
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

// 顧客情報を保存・更新
export const saveCustomer = async (customer: Omit<Customer, 'createdAt' | 'updatedAt'>) => {
  try {
    const ref = doc(db, 'customers', customer.lineUserId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      // 既存顧客は更新
      await updateDoc(ref, {
        ...customer,
        updatedAt: new Date(),
      });
    } else {
      // 新規顧客は作成
      await setDoc(ref, {
        ...customer,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch (e) {
    console.error(e);
  }
};