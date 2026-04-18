'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import type { Provider } from '@supabase/supabase-js'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null)
  const [sent, setSent] = useState(false)

  async function handleMagicLink() {
    if (!email) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        toast.error('Too many emails sent — use social sign-in below or wait an hour')
      } else {
        toast.error(error.message)
      }
    } else {
      setSent(true)
    }
  }

  async function handleOAuth(provider: Provider) {
    setOauthLoading(provider)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
      setOauthLoading(null)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-6 space-y-3">
            <div className="text-4xl">📬</div>
            <h2 className="font-bold text-lg">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              Magic link sent to <strong>{email}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't get it?{' '}
              <button className="underline" onClick={() => setSent(false)}>Try again</button>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">TEN<span className="text-primary">x10</span></CardTitle>
          <CardDescription>AI-powered artist management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">

          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'google' ? 'Redirecting...' : (
              <>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          {/* Spotify OAuth */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuth('spotify')}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'spotify' ? 'Redirecting...' : (
              <>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="#1DB954">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Sign in with Spotify
              </>
            )}
          </Button>

          {/* Facebook OAuth */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuth('facebook')}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'facebook' ? 'Redirecting...' : (
              <>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Sign in with Facebook
              </>
            )}
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Magic link */}
          <div className="space-y-2">
            <Label htmlFor="email">Email magic link</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@label.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
            />
          </div>
          <Button className="w-full" variant="outline" onClick={handleMagicLink} disabled={loading || !email}>
            {loading ? 'Sending...' : 'Send magic link'}
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}
