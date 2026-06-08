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
  'auth/user-disabled': 'Esta conta foi desativada. Fale com a administracao.',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Falha de rede ao acessar o Firebase. Verifique sua conexao e tente novamente.',
  'permission-denied': 'O Firebase bloqueou esta operacao pelas regras de seguranca.',
  'firestore/permission-denied': 'O Firebase bloqueou esta operacao pelas regras de seguranca.',
  unavailable: 'O Firebase esta temporariamente indisponivel. Verifique sua conexao e tente novamente.',
  'firestore/unavailable': 'O Firebase esta temporariamente indisponivel. Verifique sua conexao e tente novamente.',
  'failed-precondition': 'Esta operacao ainda nao esta disponivel porque falta uma configuracao no Firebase.',
  'firestore/failed-precondition': 'Esta operacao ainda nao esta disponivel porque falta uma configuracao no Firebase.',
  'auth/weak-password': 'Use uma senha mais forte, com pelo menos 6 caracteres.',
}

export function getFriendlyFirebaseError(error: unknown, fallback = 'Nao foi possivel concluir a operacao.') {
  if (!(error instanceof Error)) return fallback

  const code = 'code' in error && typeof error.code === 'string' ? error.code : ''

  if (code && firebaseAuthMessages[code]) {
    return firebaseAuthMessages[code]
  }

  if (/network|offline|failed to fetch/i.test(error.message)) {
    return 'Falha de rede. Verifique sua conexao e tente novamente.'
  }

  if (/firebase(error)?:/i.test(error.message)) {
    return fallback
  }

  return error.message || fallback
}
