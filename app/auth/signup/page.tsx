"use client"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { ArrowLeft } from "lucide-react"
import { createUser } from "@/lib/api/user"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const signupSchema = z.object({
  firstname: z.string().min(2, "⚠️ First name must be at least 2 characters").max(100, "⚠️ First name must be at most 100 characters"),
  lastname: z.string().min(2, "⚠️ Last name must be at least 2 characters").max(100, "⚠️ Last name must be at most 100 characters"),
  email: z.string().email("⚠️ Invalid email address"),
  username: z.string().min(2, "⚠️ Username must be at least 2 characters").max(100, "⚠️ Username must be at most 100 characters"),
  password: z.string().min(6, "⚠️ Password must be at least 6 characters").max(100, "⚠️ Password must be at most 100 characters"),

});

interface SignupFormData {
  firstname: string
  lastname: string
  email: string
  username: string
  password: string
  confirmPassword: string
}

export default function SignupPage() {
  const { handleSubmit, control, formState: { errors } } = useForm<SignupFormData>({
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    },
    resolver: zodResolver(signupSchema.extend({
      confirmPassword: z.string().min(6).max(100)
    }).refine((data) => data.password === data.confirmPassword, {
      message: "⚠️ Passwords don't match",
      path: ["confirmPassword"]
    }))
  })

  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true)
    try {
      // À adapter selon les champs backend attendus
      await createUser(data)
      toast.success('Compte créé avec succès !')
      // Rediriger ou vider le formulaire si besoin
      router.push('/auth/login')
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-10">
      <Link href="/" className="mb-8 flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to home
      </Link>

      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your information to create an account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <OAuthButtons />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First name</Label>
                <Controller
                  name="firstname"
                  control={control}
                  render={({ field }) => (
                    <Input control={control} id="firstname" placeholder="John" {...field} />
                  )}
                />
                {errors.firstname && <p className="text-sm text-red-600">{errors.firstname.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last name</Label>
                <Controller
                  name="lastname"
                  control={control}
                  render={({ field }) => (
                    <Input control={control} id="lastname" placeholder="Doe" {...field} />
                  )}
                />
                {errors.lastname && <p className="text-sm text-red-600">{errors.lastname.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input control={control} id="email" type="email" placeholder="m@example.com" {...field} />
                )}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <Input control={control} id="username" type="username" placeholder="username" {...field} />
                )}
              />
              {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input control={control} id="password" type="password" placeholder="password" {...field} />
                )}
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Input control={control} id="confirmPassword" type="password" placeholder="confirm password" {...field} />
                )}
              />
              {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
