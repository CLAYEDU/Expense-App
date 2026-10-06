import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";
import type { FinancialProfile } from "@/types/finance";

function getProfileRef(uid: string) {
  return doc(
    db,
    "users",
    uid,
    "settings",
    "financialProfile"
  );
}

export async function saveFinancialProfile(
  uid: string,
  profile: FinancialProfile
) {
  await setDoc(
    getProfileRef(uid),
    {
      ...profile,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}

export async function getFinancialProfile(
  uid: string
): Promise<FinancialProfile | null> {
  const snapshot = await getDoc(
    getProfileRef(uid)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as FinancialProfile;
}

export interface ReserveUpdates {
  currentSavings?: number;
  currentInvestments?: number;
  currentEmergencyFund?: number;
  emiAmount?: number;
}

export async function updateFinancialReserves(
  uid: string,
  updates: ReserveUpdates
): Promise<void> {
  const payload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.currentSavings !== undefined) {
    const val = Number(updates.currentSavings);
    payload.currentSavings = val;
    payload.savings = val;
  }
  if (updates.currentInvestments !== undefined) {
    const val = Number(updates.currentInvestments);
    payload.currentInvestments = val;
    payload.monthlyInvestments = val;
  }
  if (updates.currentEmergencyFund !== undefined) {
    const val = Number(updates.currentEmergencyFund);
    payload.currentEmergencyFund = val;
    payload.emergencyFund = val;
  }
  if (updates.emiAmount !== undefined) {
    const val = Number(updates.emiAmount);
    payload.emiAmount = val;
    payload.monthlyEmi = val;
    payload.emi = val;
  }

  // Save directly to the exact profile reference used by getFinancialProfile
  await setDoc(getProfileRef(uid), payload, { merge: true });
}