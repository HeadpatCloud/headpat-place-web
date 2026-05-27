import { genericOAuthClient, twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  plugins: [twoFactorClient(), genericOAuthClient()],
})

export const { signIn, signUp, signOut, useSession, twoFactor } = authClient
