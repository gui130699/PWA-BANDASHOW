const firebaseAuthMessages: Record<string, string> = {
  'auth/configuration-not-found':
    'Firebase Authentication ainda nao foi ativado neste projeto. No Firebase Console, abra Authentication, clique em Get started e habilite Email/Password.',
  'auth/operation-not-allowed':
    'Login por e-mail e senha ainda nao esta habilitado no Firebase Authentication.',
  'auth/unauthorized-domain':
    'Este dominio ainda nao esta autorizado no Firebase Authentication. Adicione gui130699.github.io em Authorized domains.',
  'auth/email-already-in-use': 'Este e-mail ja esta cadastrado. Entre com sua senha ou use outro e-mail.',
  'auth/invalid-email': 'Informe um e-mail valido.',
  'auth/invalid-credential': 'E-mail ou senha invalidos.',
  'auth/requires-recent-login': 'Entre novamente na conta admin e tente excluir o cadastro outra vez.',
  'permission-denied': 'O Firebase bloqueou esta operacao pelas regras de seguranca.',
  'auth/weak-password': 'Use uma senha mais forte, com pelo menos 6 caracteres.',
}

export function getFriendlyFirebaseError(error: unknown, fallback = 'Nao foi possivel concluir a operacao.') {
  if (!(error instanceof Error)) return fallback

  const code = 'code' in error && typeof error.code === 'string' ? error.code : ''

  if (code && firebaseAuthMessages[code]) {
    return firebaseAuthMessages[code]
  }

  return error.message || fallback
}
