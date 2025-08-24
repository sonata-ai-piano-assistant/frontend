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
import { verifyUserCredentials } from "@/lib/api/user"
import { useUser } from "@/context/UserContext"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface LoginFormData {
  email: string
  password: string
}
const loginSchema = z.object({
  email: z.string().email("⚠️ Invalid email address"),
  password: z.string().min(6, "⚠️ Password must be between 6 and 100 characters").max(100),
});

export default function LoginPage() {
  const { login } = useUser();
  const { handleSubmit, control, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: ''
    },
    resolver: zodResolver(loginSchema)
  })

  const [loading, setLoading] = useState(false)
  const router = useRouter();


  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await verifyUserCredentials(data);
      login(res.token);
      toast.success('Connexion réussie !');
      // Rediriger si besoin
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
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
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Enter your credentials to sign in to your account</CardDescription>
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input id="email" type="email" placeholder="m@example.com" control={control} {...field} />
                )}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input id="password" type="password" placeholder="password" control={control} {...field} />
                )}
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
