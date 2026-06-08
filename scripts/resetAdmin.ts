import { FieldValue } from 'firebase-admin/firestore'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { adminAuth, adminDb } from './firebaseAdmin.js'

async function main() {
  const ownerRef = adminDb.collection('system').doc('adminOwner')
  const setupRef = adminDb.collection('system').doc('adminSetup')
  const ownerSnapshot = await ownerRef.get()

  if (!ownerSnapshot.exists) {
    console.log('Nenhum admin primario encontrado em system/adminOwner.')
    return
  }

  const uid = ownerSnapshot.data()?.uid as string | undefined
  if (!uid) {
    throw new Error('Documento system/adminOwner nao possui uid.')
  }

  const authUser = await adminAuth.getUser(uid).catch(() => null)
  const rl = createInterface({ input, output })
  const answer = await rl.question(
    `Digite RESETAR para remover o admin ${authUser?.email || uid} e liberar novo cadastro: `,
  )
  rl.close()

  if (answer.trim() !== 'RESETAR') {
    console.log('Operacao cancelada.')
    return
  }

  const batch = adminDb.batch()
  batch.delete(adminDb.collection('users').doc(uid))
  batch.delete(ownerRef)
  batch.delete(setupRef)
  batch.set(adminDb.collection('auditLogs').doc(), {
    userId: 'local-script',
    userName: 'Script reset-admin',
    action: 'admin_reset',
    entity: 'system',
    entityId: uid,
    description: 'Cadastro admin primario removido por script local.',
    metadata: {
      email: authUser?.email || null,
    },
    createdAt: FieldValue.serverTimestamp(),
  })
  await batch.commit()

  if (authUser) {
    await adminAuth.deleteUser(uid)
  }

  console.log('Admin removido com sucesso. O proximo acesso em /admin/acesso podera criar um novo primeiro admin.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
