import { useState, useEffect } from "react"
import { Shield, Activity, AlertTriangle, Network, LogOut, Server } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

interface Log {
    id: number
    timestamp: string
    source_ip: string
    destination_ip: string
    protocol: string
    prediction: string
    confidence: number
    details: string | null
}

interface Stats {
    total_packets: number
    total_attacks: number
    attack_rate: number
    recent_attacks: Log[]
}

export default function DashboardPage() {
    const navigate = useNavigate()
    const [stats, setStats] = useState<Stats | null>(null)
    const [logs, setLogs] = useState<Log[]>([])
    const [devices, setDevices] = useState<Record<string, string>>({})
    const [snifferRunning, setSnifferRunning] = useState(false)

    const [systemStats, setSystemStats] = useState<{ cpu_usage: number; memory_usage: number } | null>(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            navigate("/login")
            return
        }

        fetchStats()
        fetchLogs()
        fetchDevices()
        fetchSystemStats()
        checkSnifferStatus()

        const interval = setInterval(() => {
            fetchStats()
            fetchLogs()
            fetchSystemStats()
        }, 2000) // Faster update for system stats

        return () => clearInterval(interval)
    }, [])

    const fetchSystemStats = async () => {
        try {
            const response = await api.get("/system/stats")
            setSystemStats(response.data)
        } catch (err) {
            console.error("Failed to fetch system stats", err)
        }
    }

    const fetchDevices = async () => {
        try {
            const response = await api.get("/devices")
            const deviceMap: Record<string, string> = {}
            response.data.forEach((dev: any) => {
                if (dev.name) {
                    deviceMap[dev.ip_address] = dev.name
                }
            })
            setDevices(deviceMap)
        } catch (err) {
            console.error("Failed to fetch devices", err)
        }
    }

    const getDeviceName = (ip: string) => {
        return devices[ip] || ip
    }

    const fetchStats = async () => {
        try {
            const response = await api.get("/stats")
            setStats(response.data)
        } catch (err) {
            console.error("Failed to fetch stats", err)
        }
    }

    const fetchLogs = async () => {
        try {
            const response = await api.get("/logs?limit=50")
            setLogs(response.data)
        } catch (err) {
            console.error("Failed to fetch logs", err)
        }
    }

    const checkSnifferStatus = async () => {
        try {
            const response = await api.get("/sniffer/status")
            setSnifferRunning(response.data.running)
        } catch (err) {
            console.error("Failed to check sniffer status", err)
        }
    }

    const toggleSniffer = async () => {
        try {
            if (snifferRunning) {
                await api.post("/sniffer/stop")
            } else {
                await api.post("/sniffer/start")
            }
            checkSnifferStatus()
        } catch (err) {
            console.error("Failed to toggle sniffer", err)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        navigate("/")
    }

    const pieData = [
        { name: "Normal", value: stats ? stats.total_packets - stats.total_attacks : 0 },
        { name: "Attacks", value: stats?.total_attacks || 0 },
    ]

    const COLORS = ["#10b981", "#ef4444"]

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">DeepGuard<span className="text-primary">IDS</span></span>

                        {stats && (
                            <div className={`ml-4 flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${stats.attack_rate > 10 || stats.recent_attacks.length > 5
                                ? "bg-red-500/10 border-red-500/20 text-red-500"
                                : stats.attack_rate > 0 || stats.recent_attacks.length > 0
                                    ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                    : "bg-green-500/10 border-green-500/20 text-green-500"
                                }`}>
                                <Activity className="h-3.5 w-3.5" />
                                <span>
                                    {stats.attack_rate > 10 || stats.recent_attacks.length > 5
                                        ? "CRITICAL"
                                        : stats.attack_rate > 0 || stats.recent_attacks.length > 0
                                            ? "WARNING"
                                            : "It's Quiet"
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant={snifferRunning ? "destructive" : "default"}
                            onClick={toggleSniffer}
                            className={snifferRunning ? "shadow-lg shadow-red-900/20" : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"}
                        >
                            {snifferRunning ? (
                                <><Activity className="mr-2 h-4 w-4 animate-pulse" /> Stop Monitoring</>
                            ) : (
                                <><Activity className="mr-2 h-4 w-4" /> Start Monitoring</>
                            )}
                        </Button>
                        <nav className="flex items-center gap-1">
                            <Button variant="ghost" onClick={() => navigate("/devices")}>
                                Devices
                            </Button>
                            <Button variant="ghost" onClick={() => navigate("/logs")}>
                                Logs
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Unknown Device Alert */}
                {Object.entries(devices).some(([, name]) => name.startsWith("Device-") || name === "Unknown") && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3 shadow-sm">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-yellow-500">Unknown Devices Detected</h3>
                            <p className="text-sm text-muted-foreground">
                                Detailed analysis requires device identification.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10" onClick={() => navigate("/devices")}>
                            Review
                        </Button>
                    </div>
                )}

                {/* System Health */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Server className="h-5 w-5 text-muted-foreground" />
                        System Status
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-card/40 backdrop-blur-sm border-border/50">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">CPU Load</CardTitle>
                                    <Activity className="h-4 w-4 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{systemStats?.cpu_usage || 0}%</div>
                                <div className="w-full bg-secondary h-2 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${systemStats?.cpu_usage || 0}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/40 backdrop-blur-sm border-border/50">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Memory Usage</CardTitle>
                                    <Server className="h-4 w-4 text-purple-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{systemStats?.memory_usage || 0}%</div>
                                <div className="w-full bg-secondary h-2 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-purple-500 h-full rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${systemStats?.memory_usage || 0}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="bg-card/40 backdrop-blur-sm border-border/50">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Packets</CardTitle>
                                <Network className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.total_packets.toLocaleString() || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Packets analyzed this session</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-sm border-border/50">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Attacks Detected</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-destructive">{stats?.total_attacks || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Malicious activities blocked</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-sm border-border/50">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Attack Rate</CardTitle>
                                <Activity className="h-4 w-4 text-yellow-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-yellow-500">
                                {stats?.attack_rate.toFixed(2) || 0}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Of total network traffic</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-card/40 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <CardTitle>Traffic Distribution</CardTitle>
                            <CardDescription>Real-time analysis of network flow classification</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-sm text-muted-foreground">Normal</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-sm text-muted-foreground">Attacks</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <CardTitle>Recent Threats</CardTitle>
                            <CardDescription>Latest high-confidence security events</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {stats?.recent_attacks?.slice(0, 5).map((attack) => (
                                    <div
                                        key={attack.id}
                                        className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20 transition-colors hover:bg-destructive/20"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {getDeviceName(attack.source_ip)} <span className="text-muted-foreground">→</span> {getDeviceName(attack.destination_ip)}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                    <span className="bg-background/50 px-1.5 py-0.5 rounded uppercase font-mono">{attack.protocol}</span>
                                                    <span>{new Date(attack.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-destructive">
                                                {(attack.confidence * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase">Confidence</div>
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.recent_attacks || stats.recent_attacks.length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <Shield className="h-12 w-12 mb-4 opacity-20" />
                                        <p>No threats detected recently</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Logs Table */}
                <Card className="bg-card/40 backdrop-blur-sm border-border/50">
                    <CardHeader>
                        <CardTitle>Network Activity Log</CardTitle>
                        <CardDescription>Live stream of analyzed packets and decisions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Time</th>
                                        <th className="px-4 py-3">Source</th>
                                        <th className="px-4 py-3">Destination</th>
                                        <th className="px-4 py-3">Protocol</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 rounded-tr-lg">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {logs.slice(0, 10).map((log) => (
                                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-4 py-3" title={log.source_ip}>{getDeviceName(log.source_ip)}</td>
                                            <td className="px-4 py-3" title={log.destination_ip}>{getDeviceName(log.destination_ip)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{log.protocol.toUpperCase()}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${log.prediction === "Attack"
                                                        ? "bg-red-500/10 text-red-500"
                                                        : "bg-emerald-500/10 text-emerald-500"
                                                        }`}
                                                >
                                                    {log.prediction === "Attack" && <AlertTriangle className="h-3 w-3 mr-1" />}
                                                    {log.prediction}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {(log.confidence * 100).toFixed(0)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {logs.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Network className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Waiting for network traffic...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
