import { Bell, Moon, Search, Sun, User, LogOut, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth-store'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export function TopNavbar() {
  const navigate = useNavigate()
  const { project, logout } = useAuthStore()
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleLogoClick = () => {
    navigate({ to: '/' })
  }

  const handleLogout = () => {
    logout()
    navigate({ to: '/' })
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // TODO: Implement actual dark mode toggle
  }

  return (
    <header className="relative border-b border-sepia/30 bg-gradient-to-b from-[#f9f5ed] to-[#f5f0e5] shadow-[0_2px_8px_rgba(92,64,51,0.08)]">
      {/* Decorative top border */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="absolute inset-x-0 top-0.5 h-px bg-gradient-to-r from-transparent via-sepia/30 to-transparent" />

      {/* Subtle paper texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto flex h-16 max-w-[2000px] items-center justify-between gap-6 px-6">
        {/* Left: Logo/Masthead */}
        <div className="flex items-center">
          <button
            onClick={handleLogoClick}
            className="group relative transition-all duration-300 hover:scale-[1.02]"
            aria-label="Navigate to home"
          >
            {/* Decorative flourish - left */}
            <div className="absolute -left-6 top-1/2 hidden -translate-y-1/2 opacity-60 transition-all duration-300 group-hover:opacity-100 lg:block">
              <svg width="20" height="24" viewBox="0 0 20 24" fill="none" className="text-gold">
                <path
                  d="M2 12C2 12 6 8 10 12C10 12 10 4 2 2"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  fill="none"
                  opacity="0.7"
                />
                <path
                  d="M2 12C2 12 6 16 10 12C10 12 10 20 2 22"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  fill="none"
                  opacity="0.7"
                />
              </svg>
            </div>

            <div className="flex flex-col items-center">
              {/* Ornamental top line */}
              <div className="mb-1 flex items-center gap-1.5">
                <div className="h-px w-8 bg-gradient-to-r from-transparent via-sepia/40 to-sepia/40" />
                <div className="h-1 w-1 rotate-45 bg-gold/60" />
                <div className="h-px w-8 bg-gradient-to-l from-transparent via-sepia/40 to-sepia/40" />
              </div>

              {/* Main masthead title */}
              <h1 className="font-masthead text-2xl font-bold leading-none tracking-tight text-sepia transition-colors duration-300 group-hover:text-gold lg:text-3xl">
                <span className="relative inline-block">
                  La Gazette
                  {/* Underline decoration */}
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </span>
                <span className="mx-1.5 font-serif text-lg font-normal italic opacity-70">de la</span>
                <span className="relative inline-block">
                  Vie
                  {/* Underline decoration */}
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </span>
              </h1>

              {/* Subtitle/tagline */}
              <div className="mt-0.5 font-body text-[10px] uppercase tracking-[0.2em] text-sepia/50 lg:text-[11px]">
                <span className="hidden sm:inline">Journal Visuel &amp; Créatif</span>
                <span className="sm:hidden">Éditeur</span>
              </div>
            </div>

            {/* Decorative flourish - right */}
            <div className="absolute -right-6 top-1/2 hidden -translate-y-1/2 opacity-60 transition-all duration-300 group-hover:opacity-100 lg:block">
              <svg width="20" height="24" viewBox="0 0 20 24" fill="none" className="text-gold">
                <path
                  d="M18 12C18 12 14 8 10 12C10 12 10 4 18 2"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  fill="none"
                  opacity="0.7"
                />
                <path
                  d="M18 12C18 12 14 16 10 12C10 12 10 20 18 22"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  fill="none"
                  opacity="0.7"
                />
              </svg>
            </div>
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden flex-1 max-w-md md:block lg:max-w-xl">
          <div className="group relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50 transition-colors duration-200 group-focus-within:text-gold" />
            <Input
              type="search"
              placeholder="Rechercher dans votre gazette..."
              className="h-9 w-full border-sepia/20 bg-white/60 pl-10 pr-4 font-body text-sm text-ink placeholder:font-ui placeholder:text-sm placeholder:text-muted/40 focus-visible:border-gold/40 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-gold/20"
            />
            {/* Decorative bottom border */}
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-sepia/10 to-transparent opacity-0 transition-opacity duration-200 group-focus-within:opacity-100" />
          </div>
        </div>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="group relative h-9 w-9 text-muted transition-colors hover:bg-sepia/5 hover:text-sepia"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="group relative h-9 w-9 text-muted transition-colors hover:bg-sepia/5 hover:text-sepia"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 min-w-4 border border-[#f9f5ed] bg-aged-red px-1 text-[10px] font-medium leading-none text-cream shadow-sm"
            >
              3
            </Badge>
          </Button>

          {/* Vertical separator */}
          <div className="mx-1 h-6 w-px bg-gradient-to-b from-transparent via-sepia/20 to-transparent" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="group relative h-9 gap-2 rounded-md border border-sepia/15 bg-white/40 px-3 transition-all duration-200 hover:border-gold/30 hover:bg-white/80 hover:shadow-sm"
              >
                <Avatar className="h-6 w-6 border border-sepia/20 transition-all duration-200 group-hover:border-gold/40">
                  <AvatarFallback className="bg-gradient-to-br from-parchment to-cream font-masthead text-xs font-semibold text-sepia">
                    {project?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden font-body text-sm font-medium text-sepia lg:inline-block">
                  {project?.name || 'User'}
                </span>
                <User className="h-3.5 w-3.5 text-muted/60 transition-transform duration-200 group-hover:scale-110" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-sepia/20 bg-gradient-to-b from-white to-cream/30 shadow-lg"
            >
              <DropdownMenuLabel className="font-body">
                <div className="flex flex-col space-y-1">
                  <p className="font-masthead text-sm font-semibold leading-none text-sepia">
                    {project?.name || 'Mon Projet'}
                  </p>
                  <p className="font-ui text-xs leading-none text-muted">
                    {project?.slug || 'projet'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-sepia/10" />
              <DropdownMenuItem className="group cursor-pointer font-body transition-colors focus:bg-sepia/5">
                <FileText className="mr-2 h-4 w-4 text-muted transition-colors group-hover:text-gold" />
                <span className="text-sm">Mes Projets</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-sepia/10" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="group cursor-pointer font-body text-aged-red transition-colors focus:bg-aged-red/5 focus:text-aged-red"
              >
                <LogOut className="mr-2 h-4 w-4 transition-colors" />
                <span className="text-sm">Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sepia/20 to-transparent" />
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    </header>
  )
}
