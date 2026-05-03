import { useState, useEffect } from "react"
import { Shield, Laptop, Smartphone, Server, HelpCircle, RefreshCw, Save, LogOut } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"

interface Device {
    id: number
    ip_address: string
    mac_address: string
    name: string | null
    type: string
    vendor: string | null
    is_active: boolean
    last_seen: string
}

export default function DevicesPage() {
    const navigate = useNavigate()
    const [devices, setDevices] = useState<Device[]>([])
    const [loading, setLoading] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState("")
    const [editType, setEditType] = useState("")

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            navigate("/login")
            return
        }
        fetchDevices()
    }, [])

    const fetchDevices = async () => {
        try {
            setLoading(true)
            const response = await api.get("/devices")
            setDevices(response.data)
        } catch (err) {
            console.error("Failed to fetch devices", err)
        } finally {
            setLoading(false)
        }
    }

    const triggerScan = async () => {
        try {
            setScanning(true)
            await api.post("/scan")
            // Poll for updates or just wait a bit
            setTimeout(fetchDevices, 3000)
        } catch (err) {
            console.error("Failed to trigger scan", err)
        } finally {
            setScanning(false)
        }
    }

    const startEdit = (device: Device) => {
        setEditingId(device.id)
        setEditName(device.name || "")
        setEditType(device.type || "Unknown")
    }

    const saveEdit = async (id: number) => {
        try {
            await api.put(`/devices/${id}`, {
                name: editName,
                type: editType
            })
            setEditingId(null)
            fetchDevices()
        } catch (err) {
            console.error("Failed to update device", err)
        }
    }

    const deleteDevice = async (id: number) => {
        if (!confirm("Are you sure you want to delete this device?")) return
        try {
            await api.delete(`/devices/${id}`)
            fetchDevices()
        } catch (err) {
            console.error("Failed to delete device", err)
        }
    }

    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "pc": return <Laptop className="h-5 w-5 text-blue-500" />
            case "mobile": return <Smartphone className="h-5 w-5 text-emerald-500" />
            case "server": return <Server className="h-5 w-5 text-purple-500" />
            default: return <HelpCircle className="h-5 w-5 text-muted-foreground" />
        }
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
                        <Button variant="ghost" onClick={() => navigate("/logs")}>
                            Logs
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
                                <CardTitle className="text-2xl">Network Devices</CardTitle>
                                <CardDescription>
                                    Manage and configure connected devices
                                </CardDescription>
                            </div>
                            <Button
                                onClick={triggerScan}
                                disabled={scanning}
                                className={scanning ? "bg-primary/80" : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
                                {scanning ? "Scanning..." : "Scan Network"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Type</th>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">IP Address</th>
                                        <th className="px-4 py-3">MAC Address</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Last Seen</th>
                                        <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {devices.map((device) => (
                                        <tr key={device.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                {editingId === device.id ? (
                                                    <select
                                                        value={editType}
                                                        onChange={(e) => setEditType(e.target.value)}
                                                        className="bg-secondary text-foreground border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                    >
                                                        <option value="Unknown">Unknown</option>
                                                        <option value="PC">PC</option>
                                                        <option value="Mobile">Mobile</option>
                                                        <option value="Server">Server</option>
                                                        <option value="IoT">IoT</option>
                                                    </select>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {getIcon(device.type)}
                                                        <span className="text-sm font-medium">{device.type}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {editingId === device.id ? (
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8 bg-secondary border-input"
                                                    />
                                                ) : (
                                                    <span className="font-medium">{device.name || "Unnamed Device"}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-muted-foreground">{device.ip_address}</td>
                                            <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{device.mac_address}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${device.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                                                    {device.is_active ? 'Active' : 'Offline'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                                {new Date(device.last_seen).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {editingId === device.id ? (
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={() => saveEdit(device.id)} className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700">
                                                            <Save className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                            X
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline" onClick={() => startEdit(device)} className="h-8 text-xs">
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => deleteDevice(device.id)}
                                                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                                        >
                                                            <LogOut className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {devices.length === 0 && !loading && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No devices found. Try scanning the network.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
