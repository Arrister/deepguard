import { useState } from "react"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"

export default function SignupPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setLoading(true)

        try {
            await api.post("/auth/signup", {
                email,
                password,
            })

            // Auto login after signup
            const loginResponse = await api.post("/auth/login", {
                email,
                password,
            })

            localStorage.setItem("token", loginResponse.data.access_token)
            navigate("/dashboard")
        } catch (err: any) {
            setError(err.response?.data?.detail || "Signup failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

            <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl shadow-black/40">
                <CardHeader className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/20 rounded-xl">
                            <Shield className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
                    <CardDescription>
                        Get started with DeepGuard-IDS
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-secondary/50 border-border/50 focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-secondary/50 border-border/50 focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Confirm Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-secondary/50 border-border/50 focus-visible:ring-primary"
                            />
                        </div>
                        {error && (
                            <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Sign Up"}
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <button
                            onClick={() => navigate("/login")}
                            className="text-primary hover:underline font-medium"
                        >
                            Sign in
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
