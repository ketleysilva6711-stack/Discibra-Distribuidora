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
        <div className="absolute left-3.5 sm:left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#15803D] transition-colors">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="search"
          name="q"
          autoComplete="off"
          value={q}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscar cimento, aço, ferramentas..."
          className="h-12 w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] pl-10 sm:pl-12 pr-14 sm:pr-16 text-sm font-semibold text-slate-900 placeholder:text-xs sm:placeholder:text-sm placeholder:font-normal placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-[#15803D]/30 focus:ring-4 focus:ring-[#15803D]/5"
        />
        <button
          type="submit"
          className="absolute right-1 sm:right-1.5 h-10 w-10 rounded-[4px] bg-[#15803D] text-white flex items-center justify-center transition-colors hover:bg-[#166534] active:scale-95"
          aria-label="Buscar"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
}
