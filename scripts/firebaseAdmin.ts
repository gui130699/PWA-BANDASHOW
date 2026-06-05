import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import 'dotenv/config'

function getServiceAccount() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

  if (inline) return JSON.parse(inline)
  if (filePath) return JSON.parse(readFileSync(filePath, 'utf8'))

  throw new Error('Defina FIREBASE_SERVICE_ACCOUNT_PATH ou FIREBASE_SERVICE_ACCOUNT_JSON no .env.')
}

if (!getApps().length) {
  initializeApp({
    credential: cert(getServiceAccount()),
    projectId: process.env.FIREBASE_PROJECT_ID || 'pwa-bandashow',
  })
}

export const adminAuth = getAuth()
export const adminDb = getFirestore()
