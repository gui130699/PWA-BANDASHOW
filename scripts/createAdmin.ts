import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from './firebaseAdmin.js'

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Administrador Grupo Dvanera'

  if (!email || !password) {
    throw new Error('Preencha ADMIN_EMAIL e ADMIN_PASSWORD no .env.')
  }

  const adminOwnerRef = adminDb.collection('system').doc('adminOwner')
  const adminOwnerSnapshot = await adminOwnerRef.get()

  let user = await adminAuth.getUserByEmail(email).catch(() => null)

  if (adminOwnerSnapshot.exists && adminOwnerSnapshot.data()?.uid !== user?.uid) {
    throw new Error('Ja existe um cadastro admin neste projeto.')
  }

  if (!user) {
    user = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    })
  }

  await adminDb.collection('users').doc(user.uid).set(
    {
      uid: user.uid,
      name,
      email,
      role: 'admin',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  await adminDb.collection('system').doc('adminSetup').set(
    {
      configured: true,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  await adminOwnerRef.set(
    {
      uid: user.uid,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  console.log(`Admin pronto: ${email} (${user.uid})`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
