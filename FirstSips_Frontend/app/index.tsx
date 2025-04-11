import { Slot, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { supabase } from './utils/supabase'
import { Session } from '@supabase/supabase-js'
import Landing from './(public)/LandingScreen'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  /*
  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace('/login') // redirect to login
      } else {
        router.replace('/home') // redirect to app
      }
    }
  }, [session, loading])
  */
  return <Landing />

  if (loading) return null
}
