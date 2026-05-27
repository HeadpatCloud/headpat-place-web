import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"
import { signIn, signOut, signUp, useSession } from "@/lib/auth-client"
import { orpc } from "@/lib/orpc"

/**
 * Compatibility shim that maps the existing `useUser()` shape to the new
 * Better Auth + oRPC stack. Keeps copied headpat-web components compiling
 * without changes. Replace gradually as components are rewritten properly.
 */

export type AccountPrefs = {
  $id: string
  email: string
  name: string
  emailVerification: boolean
  prefs: { nsfw: boolean; indexingEnabled: boolean }
}

export type UserDataDocumentsType = {
  $id: string
  profileUrl: string
  displayName: string | null
  bio: string | null
  avatarId: string | null
  profileBannerId: string | null
  followersCount: number
  followingCount: number
  badges: string[]
}

export function useUser() {
  const { data: session } = useSession()
  const navigate = useNavigate()

  const current: AccountPrefs | null = session?.user
    ? {
        $id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? "",
        emailVerification: Boolean(
          (session.user as { emailVerified?: boolean }).emailVerified,
        ),
        prefs: { nsfw: false, indexingEnabled: true },
      }
    : null

  const profileQuery = useQuery({
    ...orpc.profile.me.queryOptions({ input: undefined }),
    enabled: !!session?.user,
  })

  const userData: UserDataDocumentsType | null = profileQuery.data
    ? {
        $id: profileQuery.data.userId,
        profileUrl: profileQuery.data.profileUrl,
        displayName: profileQuery.data.displayName,
        bio: profileQuery.data.bio,
        avatarId: profileQuery.data.avatarFileId,
        profileBannerId: profileQuery.data.bannerFileId,
        followersCount: profileQuery.data.followersCount,
        followingCount: profileQuery.data.followingCount,
        badges: profileQuery.data.badges ?? [],
      }
    : null

  const login = useCallback(async (email: string, password: string) => {
    const r = await signIn.email({ email, password })
    if (r.error) throw new Error(r.error.message ?? "Login failed")
  }, [])

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const r = await signUp.email({ email, password, name })
      if (r.error) throw new Error(r.error.message ?? "Registration failed")
    },
    [],
  )

  const logout = useCallback(
    async (redirect: boolean) => {
      await signOut()
      if (redirect) navigate({ to: "/" })
    },
    [navigate],
  )

  return {
    current,
    userData,
    login,
    logout,
    register,
    // The original surface had setUser/setUserData/init/loginOAuth — these are
    // mostly unused in components we'll touch. Provide stubs to avoid crashes.
    setUser: () => {},
    setUserData: () => {},
    init: async () => current,
    loginOAuth: async () => {},
  }
}
