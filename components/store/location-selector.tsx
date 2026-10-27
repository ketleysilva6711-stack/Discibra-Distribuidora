"use client"

import { useState, useEffect } from "react"
import { MapPin, Navigation, ChevronDown, Loader2, Target } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LocationSelector() {
  const [location, setLocation] = useState<string>("Ribeirão Preto, SP")
  const [isDetecting, setIsDetecting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Auto detect on mount to ensure "Região de Entrega" is always accurate
  useEffect(() => {
    const saved = localStorage.getItem("user-location")
    if (!saved || saved === "Ribeirão Preto, SP") {
      detectLocation()
    }
  }, [])

  const detectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return

    setIsDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          )
          const data = await response.json()
          
          const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "Brasil"
          const state = data.address.state_code || data.address.state || ""
          
          const formattedLocation = state ? `${city}, ${state}` : city
          setLocation(formattedLocation)
          localStorage.setItem("user-location", formattedLocation)
          
          // Dispatch custom event for real-time UI updates
          window.dispatchEvent(new Event("user-location-updated"))
          setIsOpen(false)
        } catch (error) {
          console.error("Error fetching location details:", error)
        } finally {
          setIsDetecting(false)
        }
      },
      (error) => {
        // Silent fail for automatic detection to avoid annoying users
        console.warn("Geolocation detection skipped/failed:", error.message)
        setIsDetecting(false)
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white shadow-sm border border-border/10 hover:border-[#F47920]/30 hover:shadow-lg transition-all group active:scale-95"
      >
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-[#0055FF]/5 group-hover:bg-[#F47920]/10 transition-colors">
          <MapPin className="w-4 h-4 text-[#F47920] group-hover:animate-bounce" />
          <span className="absolute inset-0 rounded-xl border border-[#F47920]/20 animate-ping opacity-20" />
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#0047AB]/40">Região de entrega</span>
          <div className="flex items-center gap-1">
            <span className="text-xs font-black text-[#0047AB] truncate max-w-[120px]">{location}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-[#0055FF]/20 transition-transform", isOpen && "rotate-180")} />
          </div>
        </div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full right-0 lg:left-0 lg:right-auto mt-3 w-72 p-5 bg-white rounded-[2rem] shadow-2xl border border-border/40 z-[70] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-black text-[#0047AB] mb-1">Onde você está?</h3>
            <p className="text-[11px] text-muted-foreground mb-6">Mostraremos as ofertas e prazos para sua região.</p>
            
            <div className="space-y-3">
              <button
                onClick={detectLocation}
                disabled={isDetecting}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#0055FF] hover:bg-[#0047AB] shadow-md shadow-[#0055FF]/20 transition-all disabled:opacity-50"
              >
                {isDetecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                {isDetecting ? "Detectando..." : "Detectar Automaticamente"}
              </button>

              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
                <span className="relative px-3 bg-white text-[10px] font-black text-muted-foreground uppercase tracking-widest">ou</span>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Capitais Populares</p>
                <div className="grid grid-cols-2 gap-2">
                  {["São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR"].map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setLocation(city)
                        localStorage.setItem("user-location", city)
                        setIsOpen(false)
                      }}
                      className="px-3 py-2 rounded-xl border border-border/60 text-[11px] font-bold text-[#0047AB] hover:bg-[#F47920]/5 hover:border-[#F47920]/30 transition-colors text-left"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
