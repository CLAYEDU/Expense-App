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