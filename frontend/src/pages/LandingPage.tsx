import { Shield, Activity, Lock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"

export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="container mx-auto px-4 py-6 flex justify-between items-center z-10 relative">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">DeepGuard<span className="text-primary">IDS</span></span>
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={() => navigate("/login")}>
                        Login
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" onClick={() => navigate("/signup")}>
                        Get Started
                        <Zap className="ml-2 h-4 w-4 fill-current" />
                    </Button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-24 text-center flex-1 flex flex-col justify-center items-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none -z-10" />
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                        Next Gen Security Logic
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-300 pb-2">
                        AI-Powered Network Intelligence
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Real-time intrusion detection powered by advanced machine learning.
                        Protect your infrastructure with predictive threat analysis.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                        <Button size="lg" className="h-12 px-8 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105" onClick={() => navigate("/signup")}>
                            Start Monitoring Now
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 px-8 text-lg backdrop-blur-sm bg-background/50 border-primary/20 hover:bg-primary/10" onClick={() => window.open('https://github.com', '_blank')}>
                            View Documentation
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-4 py-24 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Advanced Defense Mechanisms</h2>
                    <p className="text-muted-foreground text-lg">Built for the modern threat landscape</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="bg-card/40 backdrop-blur-md border-border/50 hover:bg-card/60 transition-colors group">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                <Activity className="h-6 w-6 text-blue-500" />
                            </div>
                            <CardTitle>Real-Time Telemetry</CardTitle>
                            <CardDescription>
                                Instant visualization of packet flows and network anomalies as they happen.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-md border-border/50 hover:bg-card/60 transition-colors group">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                                <Shield className="h-6 w-6 text-emerald-500" />
                            </div>
                            <CardTitle>AI Inference Engine</CardTitle>
                            <CardDescription>
                                Deep learning models trained on NSL-KDD for high-accuracy threat classification.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-md border-border/50 hover:bg-card/60 transition-colors group">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                                <Lock className="h-6 w-6 text-purple-500" />
                            </div>
                            <CardTitle>Forensic Logging</CardTitle>
                            <CardDescription>
                                Immutable audit logs of every detected event for post-incident analysis.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border/40">
                <p className="text-sm">&copy; 2025 DeepGuard-IDS. Secure by Design.</p>
            </footer>
        </div>
    )
}
