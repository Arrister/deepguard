import { useState, useEffect } from "react"
import { Shield, Download, LogOut, Flag } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"

interface Log {
    id: number
    timestamp: string
    source_ip: string
    destination_ip: string
    protocol: string
    prediction: string
    confidence: number
    details: string | null
    is_false_positive: boolean
}

export default function LogsPage() {
    const navigate = useNavigate()
    const [logs, setLogs] = useState<Log[]>([])
    const [filter, setFilter] = useState<"all" | "normal" | "attack">("all")
    const [devices, setDevices] = useState<Record<string, string>>({})

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            navigate("/login")
            return
        }

        fetchLogs()
        fetchDevices()
    }, [])

    const fetchLogs = async () => {
        try {
            const response = await api.get("/logs?limit=1000")
            setLogs(response.data)
        } catch (err) {
            console.error("Failed to fetch logs", err)
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

    const toggleFalsePositive = async (log: Log) => {
        try {
            const newValue = !log.is_false_positive
            await api.put(`/logs/${log.id}/false-positive?is_false_positive=${newValue}`)

            // Optimistic update
            setLogs(logs.map(l => l.id === log.id ? { ...l, is_false_positive: newValue } : l))
        } catch (err) {
            console.error("Failed to update log", err)
        }
    }

    const getDeviceName = (ip: string) => {
        return devices[ip] || ip
    }

    const filteredLogs = logs.filter((log) => {
        if (filter === "all") return true
        if (filter === "normal") return log.prediction === "Normal"
        if (filter === "attack") return log.prediction === "Attack"
        return true
    })

    const exportToCSV = () => {
        const headers = ["Timestamp", "Source", "Destination", "Protocol", "Prediction", "Confidence", "Details", "False Positive"]
        const rows = filteredLogs.map((log) => [
            new Date(log.timestamp).toISOString(),
            getDeviceName(log.source_ip),
            getDeviceName(log.destination_ip),
            log.protocol,
            log.prediction,
            log.confidence.toString(),
            log.details || "",
            log.is_false_positive ? "Yes" : "No"
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `deepguard-logs-${new Date().toISOString()}.csv`
        a.click()
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        navigate("/")
    }

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
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                            Dashboard
                        </Button>
                        <Button variant="ghost" onClick={() => navigate("/devices")}>
                            Devices
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Card className="bg-card/40 backdrop-blur-md border-border/50">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-2xl">Network Logs</CardTitle>
                                <CardDescription>
                                    Complete history of network activity
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={exportToCSV}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex gap-2 mb-6">
                            <Button
                                variant={filter === "all" ? "default" : "outline"}
                                className={filter === "all" ? "bg-primary hover:bg-primary/90" : ""}
                                onClick={() => setFilter("all")}
                            >
                                All ({logs.length})
                            </Button>
                            <Button
                                variant={filter === "normal" ? "default" : "outline"}
                                className={
                                    filter === "normal"
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : ""
                                }
                                onClick={() => setFilter("normal")}
                            >
                                Normal ({logs.filter((l) => l.prediction === "Normal").length})
                            </Button>
                            <Button
                                variant={filter === "attack" ? "default" : "outline"}
                                className={
                                    filter === "attack"
                                        ? "bg-destructive hover:bg-destructive/90 text-white"
                                        : ""
                                }
                                onClick={() => setFilter("attack")}
                            >
                                Attacks ({logs.filter((l) => l.prediction === "Attack").length})
                            </Button>
                        </div>

                        {/* Logs Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">ID</th>
                                        <th className="px-4 py-3">Timestamp</th>
                                        <th className="px-4 py-3">Source</th>
                                        <th className="px-4 py-3">Destination</th>
                                        <th className="px-4 py-3">Protocol</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Confidence</th>
                                        <th className="px-4 py-3">Details</th>
                                        <th className="px-4 py-3 rounded-tr-lg">Feedback</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className={`hover:bg-muted/30 transition-colors ${log.is_false_positive ? 'opacity-50' : ''}`}>
                                            <td className="px-4 py-3 text-muted-foreground">{log.id}</td>
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                                {new Date(log.timestamp).toLocaleString()}
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
                                                    {log.prediction}
                                                </span>
                                                {log.is_false_positive && (
                                                    <span className="ml-2 text-xs text-yellow-500 font-mono">(FP)</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {(log.confidence * 100).toFixed(1)}%
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={log.details || ""}>{log.details || "-"}</td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => toggleFalsePositive(log)}
                                                    className={`h-8 px-2 ${log.is_false_positive ? 'text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20' : 'text-muted-foreground hover:text-foreground'}`}
                                                    title={log.is_false_positive ? "Marked as False Positive" : "Mark as False Positive"}
                                                >
                                                    <Flag className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredLogs.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No log records matching your criteria.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
