import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

const PB_AUTH_KEY = 'pocketbase_auth'

function moveAuthToSession() {
  const raw = localStorage.getItem(PB_AUTH_KEY)
  if (raw) {
    sessionStorage.setItem(PB_AUTH_KEY, raw)
    localStorage.removeItem(PB_AUTH_KEY)
  }
}

function restoreFromSession(): boolean {
  const raw = sessionStorage.getItem(PB_AUTH_KEY)
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw)
    const token = parsed.token || ''
    const record = parsed.record || parsed.model || null
    if (token) {
      pb.authStore.save(token, record)
      localStorage.removeItem(PB_AUTH_KEY)
      return true
    }
  } catch {
    sessionStorage.removeItem(PB_AUTH_KEY)
  }
  return false
}

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.isValid ? pb.authStore.record : null)
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pb.authStore.isValid) {
      restoreFromSession()
    }

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (record && record.ativo === false) {
        pb.authStore.clear()
        sessionStorage.removeItem(PB_AUTH_KEY)
        setUser(null)
        setIsAuthenticated(false)
      } else {
        setUser(pb.authStore.isValid ? record : null)
        setIsAuthenticated(pb.authStore.isValid)
      }
    })

    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then((authData) => {
          if (authData.record.ativo === false) {
            pb.authStore.clear()
            sessionStorage.removeItem(PB_AUTH_KEY)
          }
          if (sessionStorage.getItem(PB_AUTH_KEY)) {
            moveAuthToSession()
          }
        })
        .catch(() => {
          pb.authStore.clear()
          sessionStorage.removeItem(PB_AUTH_KEY)
        })
        .finally(() => setLoading(false))
    } else {
      if (pb.authStore.record) pb.authStore.clear()
      setLoading(false)
    }

    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      await pb.collection('users').create({ email, password, passwordConfirm: password })
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      if (authData.record.ativo === false) {
        pb.authStore.clear()
        sessionStorage.removeItem(PB_AUTH_KEY)
        return { error: new Error('Usuário inativo. Contate um administrador.') }
      }
      if (!rememberMe) {
        moveAuthToSession()
      }
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    sessionStorage.removeItem(PB_AUTH_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        signUp,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
