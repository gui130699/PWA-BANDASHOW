import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import type { AppUser } from '../types'

type RegisterClientInput = {
  name: string
  document: string
  phone: string
  email: string
  city: string
  state: string
  notes?: string
  password: string
}

type AuthContextValue = {
  user: User | null
  profile: AppUser | null
  loading: boolean
  firebaseReady: boolean
  login: (email: string, password: string) => Promise<void>
  registerClient: (data: RegisterClientInput) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function loadProfile(uid: string) {
  if (!db) return null

  const snapshot = await getDoc(doc(db, 'users', uid))
  return snapshot.exists() ? (snapshot.data() as AppUser) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }

    setProfile(await loadProfile(user.uid))
  }, [user])

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return undefined
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setProfile(currentUser ? await loadProfile(currentUser.uid) : null)
      setLoading(false)
    })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth nao configurado.')
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const registerClient = useCallback(async (data: RegisterClientInput) => {
    if (!auth || !db) throw new Error('Firebase nao configurado.')

    const credential = await createUserWithEmailAndPassword(auth, data.email, data.password)
    const userDoc = {
      uid: credential.user.uid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'client',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(doc(db, 'users', credential.user.uid), userDoc)
    await setDoc(doc(db, 'clients', credential.user.uid), {
      userId: credential.user.uid,
      name: data.name,
      document: data.document,
      phone: data.phone,
      email: data.email,
      city: data.city,
      state: data.state,
      notes: data.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    setProfile({
      uid: credential.user.uid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'client',
    })
  }, [])

  const logout = useCallback(async () => {
    if (!auth) return
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      firebaseReady: isFirebaseConfigured,
      login,
      registerClient,
      logout,
      refreshProfile,
    }),
    [loading, login, logout, profile, refreshProfile, registerClient, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.')
  return context
}
