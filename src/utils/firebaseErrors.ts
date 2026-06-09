const firebaseAuthMessages: Record<string, string> = {
  'auth/configuration-not-found':
    'Firebase Authentication ainda não foi ativado neste projeto. No Firebase Console, abra Authentication, clique em Get started e habilite Email/Password.',
  'auth/operation-not-allowed':
    'Login por e-mail e senha ainda não está habilitado no Firebase Authentication.',
  'auth/unauthorized-domain':
    'Este domínio ainda não está autorizado no Firebase Authentication. Adicione gui130699.github.io em Authorized domains.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado. Entre com sua senha ou use outro e-mail.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/user-disabled': 'Esta conta foi desativada. Fale com a administração.',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Falha de rede ao acessar o Firebase. Verifique sua conexão e tente novamente.',
  'permission-denied': 'O Firebase bloqueou esta operação pelas regras de segurança.',
  'firestore/permission-denied': 'O Firebase bloqueou esta operação pelas regras de segurança.',
  unavailable: 'O Firebase está temporariamente indisponível. Verifique sua conexão e tente novamente.',
  'firestore/unavailable': 'O Firebase está temporariamente indisponível. Verifique sua conexão e tente novamente.',
  'failed-precondition': 'Esta operação ainda não está disponível porque falta uma configuração no Firebase.',
  'firestore/failed-precondition': 'Esta operação ainda não está disponível porque falta uma configuração no Firebase.',
  'auth/weak-password': 'Use uma senha mais forte, com pelo menos 6 caracteres.',
}

export function getFriendlyFirebaseError(error: unknown, fallback = 'Não foi possível concluir a operação.') {
  if (!(error instanceof Error)) return fallback

  const code = 'code' in error && typeof error.code === 'string' ? error.code : ''

  if (code && firebaseAuthMessages[code]) {
    return firebaseAuthMessages[code]
  }

  if (/network|offline|failed to fetch/i.test(error.message)) {
    return 'Falha de rede. Verifique sua conexão e tente novamente.'
  }

  if (/firebase(error)?:/i.test(error.message)) {
    return fallback
  }

  return error.message || fallback
}
