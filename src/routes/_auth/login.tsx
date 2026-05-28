import {
  SiApple,
  SiDiscord,
  SiGithub,
  SiGoogle,
  SiSpotify,
  SiTwitch,
} from "@icons-pack/react-simple-icons"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import CheckboxField from "@/components/fields/CheckboxField"
import InputField from "@/components/fields/InputField"
import { Button } from "@/components/ui/button"
import { Form, FormField } from "@/components/ui/form"
import { authClient, signIn, signUp, useSession } from "@/lib/auth-client"

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
})

type LoginFormData = { email: string; password: string }
type RegisterFormData = {
  username: string
  email: string
  password: string
  acceptedTerms: boolean
}

const loginSchema = z.object({
  email: z.string().email("Invalid email").trim(),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .max(256, "Password must be at most 256 characters"),
})

const registerSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email").trim(),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .max(256, "Password must be at most 256 characters"),
  acceptedTerms: z.boolean().refine((v) => v === true, {
    message: "You must accept the terms",
  }),
})

async function startOAuth(provider: string) {
  if (provider === "eurofurence") {
    await authClient.signIn.oauth2({
      providerId: "eurofurence",
      callbackURL: "/account",
    })
    return
  }
  await signIn.social({
    provider: provider as Parameters<typeof signIn.social>[0]["provider"],
    callbackURL: "/account",
  })
}

function LoginPage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const [isRegistering, setIsRegistering] = useState(false)

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", acceptedTerms: false },
  })

  useEffect(() => {
    if (session?.user) navigate({ to: "/account" as never })
  }, [session, navigate])

  async function submitLogin(data: LoginFormData) {
    const r = await signIn.email({ email: data.email, password: data.password })
    if (r.error) {
      if (
        r.error.code === "TWO_FACTOR_REQUIRED" ||
        r.error.message?.toLowerCase().includes("factor")
      ) {
        navigate({ to: "/login/mfa" as never })
        return
      }
      toast.error(r.error.message ?? "Login failed")
      return
    }
    toast.success("Logged in successfully.")
    navigate({ to: "/account" as never })
  }

  async function submitRegister(data: RegisterFormData) {
    const r = await signUp.email({
      email: data.email,
      password: data.password,
      name: data.username,
    })
    if (r.error) {
      toast.error(r.error.message ?? "Sign up failed")
      return
    }
    toast.success("Logged in successfully.")
    navigate({ to: "/account" as never })
  }

  return (
    <div className="flex items-center justify-center">
      <div className="min-w-1/3 mx-auto rounded-2xl dark:ring-white">
        <div className="text-center">
          <h4 className="mt-8 text-2xl font-bold leading-9 tracking-tight">
            Welcome to Headpat!
          </h4>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {isRegistering ? "Already registered?" : "Not yet registered?"}{" "}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-link hover:text-link/80 font-semibold"
            >
              Click here!
            </button>
          </p>
        </div>

        <div className="mt-4">
          {isRegistering ? (
            <Form {...registerForm}>
              <form
                className="space-y-6"
                onSubmit={registerForm.handleSubmit(submitRegister)}
              >
                <div className="mx-auto max-w-4xl space-y-6 p-6">
                  <div className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <InputField
                          label="Username"
                          description=""
                          placeholder=""
                          field={field}
                        />
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <InputField
                          label="E-Mail"
                          description=""
                          placeholder=""
                          field={field}
                        />
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <InputField
                          label="Password"
                          description=""
                          placeholder=""
                          field={field}
                          type="password"
                        />
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="acceptedTerms"
                      render={({ field }) => (
                        <CheckboxField
                          label="Accept terms and conditions"
                          description=""
                          field={field}
                        />
                      )}
                    />
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Register</Button>
                    <Link to={"/forgot-password" as never}>
                      <Button variant="link" type="button" className="p-0">
                        Forgot password?
                      </Button>
                    </Link>
                  </div>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...loginForm}>
              <form
                className="space-y-6"
                onSubmit={loginForm.handleSubmit(submitLogin)}
              >
                <div className="mx-auto max-w-4xl space-y-6 p-6">
                  <div className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <InputField
                          label="E-Mail"
                          description=""
                          placeholder=""
                          field={field}
                        />
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <InputField
                          label="Password"
                          description=""
                          placeholder=""
                          field={field}
                          type="password"
                        />
                      )}
                    />
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
                    <Link to={"/forgot-password" as never}>
                      <Button variant="link" type="button" className="p-0">
                        Forgot password?
                      </Button>
                    </Link>
                  </div>
                </div>
              </form>
            </Form>
          )}

          <div className="mt-8">
            <div className="relative">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-background rounded-xl px-6">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => startOAuth("discord")}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#5865F2] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#1D9BF0] dark:border-white/20"
              >
                <SiDiscord className="h-5" />
                <span className="text-sm font-semibold leading-6">Discord</span>
              </button>

              <button
                onClick={() => startOAuth("eurofurence")}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#005953] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#1D9BF0] dark:border-white/20"
              >
                <img
                  src="/logos/eurofurence.webp"
                  alt="Eurofurence"
                  className="rounded-xl"
                  width={20}
                  height={20}
                />
                <span className="text-sm font-semibold leading-6">Eurofurence</span>
              </button>

              <button
                onClick={() => startOAuth("github")}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#24292F] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
              >
                <SiGithub className="h-5" />
                <span className="text-sm font-semibold leading-6">GitHub</span>
              </button>

              <button
                onClick={() => startOAuth("apple")}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#000000] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
              >
                <SiApple className="h-5" />
                <span className="text-sm font-semibold leading-6">Apple</span>
              </button>

              <button
                onClick={() => startOAuth("google")}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#131314] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
              >
                <SiGoogle className="h-4" />
                <span className="text-sm font-semibold leading-6">Google</span>
              </button>

              <button
                onClick={() => startOAuth("spotify")}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#1DB954] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
              >
                <SiSpotify className="h-5" />
                <span className="text-sm font-semibold leading-6">Spotify</span>
              </button>

              <button
                onClick={() => startOAuth("microsoft")}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#01A6F0] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
              >
                <img
                  src="/logos/Microsoft_logo.svg.png"
                  alt="Microsoft"
                  className="h-5"
                />
                <span className="text-sm font-semibold leading-6">Microsoft</span>
              </button>

              <button
                onClick={() => startOAuth("twitch")}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#6441A5] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
              >
                <SiTwitch className="h-5" />
                <span className="text-sm font-semibold leading-6">Twitch</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
