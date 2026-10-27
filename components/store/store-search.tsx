"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"

const DEBOUNCE_MS = 280

export default function StoreSearch() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const onBusca = pathname === "/busca"
  const [q, setQ] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (onBusca) {
      setQ(searchParams.get("q") || "")
    } else {
      setQ("")
    }
  }, [onBusca, searchParams])

  const pushBusca = useCallback(
    (next: string) => {
      const trimmed = next.trim()
      const url = trimmed ? `/busca?q=${encodeURIComponent(trimmed)}` : "/busca"
      router.replace(url)
    },
    [router],
  )

  const handleChange = (value: string) => {
    setQ(value)
    if (!onBusca) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushBusca(value)
    }, DEBOUNCE_MS)
  }

  return (
    <form
      method="get"
      action="/busca"
      className="relative w-full"
      onSubmit={(e) => {
        if (onBusca) {
          e.preventDefault()
          if (debounceRef.current) clearTimeout(debounceRef.current)
          pushBusca(q)
        }
      }}
    >
      <div className="group relative flex items-center">
        <div className="absolute left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="search"
          name="q"
          autoComplete="off"
          value={q}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscar cimento, aço, ferramentas..."
          className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 pl-14 pr-20 sm:pr-24 text-sm font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5"
        />
        <div className="absolute right-1.5 p-1">
          <button
            type="submit"
            className="h-11 px-3 sm:px-5 rounded-xl bg-secondary text-white text-xs sm:text-sm font-black uppercase tracking-widest transition-all hover:bg-slate-800 active:scale-95 shadow-md shadow-secondary/10"
            aria-label="Buscar"
          >
            Buscar
          </button>
        </div>
      </div>
    </form>
  )
}
