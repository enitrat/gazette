import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bell, Moon, Search, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DEFAULT_NOTIFICATION_COUNT = 3;

type TopNavbarProps = {
  notificationCount?: number;
  userName?: string;
  userImageUrl?: string;
};

export function TopNavbar({
  notificationCount,
  userName = "test123456",
  userImageUrl,
}: TopNavbarProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return document.documentElement.classList.contains("dark");
  });
  const [mode, setMode] = useState("editor");
  const [notifications, setNotifications] = useState(
    notificationCount ?? DEFAULT_NOTIFICATION_COUNT
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (notificationCount === undefined) return;
    setNotifications(notificationCount);
  }, [notificationCount]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea") return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="w-full border-b border-sepia/20 bg-cream px-6">
      <div className="flex min-h-[64px] w-full flex-wrap items-center justify-between gap-4 py-2 md:flex-nowrap md:py-0">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center font-masthead text-xl text-sepia text-ink-effect no-underline"
          >
            La Gazette de la Vie
          </Link>

          <div className="relative w-full max-w-full sm:max-w-[220px] md:max-w-[250px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search"
              className="h-9 border-sepia/20 bg-muted/15 pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-muted" />
            <Switch
              checked={isDarkMode}
              onCheckedChange={setIsDarkMode}
              aria-label="Toggle dark mode"
            />
            <Moon className="h-4 w-4 text-muted" />
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {notifications > 0 ? (
                    <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full p-0 text-[10px]">
                      {notifications}
                    </Badge>
                  ) : null}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Notifications</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-cream/70"
                aria-label="Open user menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userImageUrl} alt={userName} />
                  <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-ui text-sm text-ink">{userName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Editor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
