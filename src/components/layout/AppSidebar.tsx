import { useState } from "react";
import { useTitleFont } from "@/hooks/useTitleFont";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Heart,
  Settings,
  Pencil,
  RefreshCw,
  Bell,
  X,
  FileText,
  CheckSquare,
  ChevronDown,
  Clock,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { useNotes, Note } from "@/contexts/NoteContext";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/sonner";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { NoteType } from "@/types/sharing";

export function AppSidebar() {
  const titleFont = useTitleFont();
  const { notes, addNote, setCurrentNote, syncNotes } = useNotes();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { state, toggleSidebar } = useSidebar();

  const filteredNotes = searchTerm
    ? notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : notes;

  const handleCreateNote = async (noteType: NoteType = "note") => {
    try {
      const newNote = await addNote(noteType);
      setCurrentNote(newNote);

      // On mobile, wait for sidebar animation to complete before navigating
      if (isMobile && state === "expanded") {
        toggleSidebar();
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      navigate(`/note/${newNote.id}`);

      // Delay toast to prevent render blocking during navigation
      setTimeout(() => {
        toast.success(noteType === "checklist" ? "Checklist created" : "Note created");
      }, 150);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleSync = async () => {
    // Hide sidebar first
    if (isMobile && state === "expanded") {
      toggleSidebar();
    }

    // Then sync notes
    await syncNotes();
  };

  const handleSelectNote = (note: Note) => {
    setCurrentNote(note);
    navigate(`/note/${note.id}`);

    // Auto-hide sidebar on mobile after selecting a note
    if (isMobile && state === "expanded") {
      toggleSidebar();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Sidebar
      className="transition-all duration-350 ease-bounce-out bg-sidebar/70 backdrop-blur-2xl border-r border-border/30"
      collapsible="offcanvas"
    >
      <SidebarHeader className="flex flex-row items-center justify-between px-5 py-5 gap-0 apple-pwa-sidebar-header">
        <div className={`flex items-center space-x-3 flex-1 ${state === "collapsed" ? "justify-center" : ""}`}>
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
            <Heart className="h-5 w-5 text-accent" fill="currentColor" />
          </div>
          {state !== "collapsed" && (
            <div className="flex items-center">
              <h1 className="text-xl font-display font-medium tracking-tight dynamic-title-font">Arcana Notes</h1>
              <span className="text-[10px] text-muted-foreground ml-0.5 -mt-2 font-medium">TM</span>
            </div>
          )}
        </div>
        {state !== "collapsed" && (
          <div className="flex items-center gap-1">
            {user && (
              <NotificationsPanel>
                <Button
                  variant="ghost"
                  size="sm"
                  className="btn-accessible h-9 w-9 rounded-full flex-shrink-0 relative bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </NotificationsPanel>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="btn-accessible h-9 w-9 rounded-full flex-shrink-0 bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm hidden md:flex"
              title="Hide sidebar"
              onClick={toggleSidebar}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarHeader>

      {state !== "collapsed" && (
        <SidebarContent className="pt-2 px-3">
          <div className="mb-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2.5 h-11 group
                    bg-accent/10 hover:bg-accent/20
                    border-2 border-accent
                    text-accent font-medium
                    rounded-full shadow-glow-sm hover:shadow-glow
                    transition-all duration-250 ease-bounce-out
                    hover:scale-[1.02] active:scale-[0.98]
                    apple-pwa-button-spacing"
                >
                  <Plus className="h-4 w-4 transition-transform duration-250 group-hover:rotate-90" />
                  <span>New</span>
                  <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-[200px] bg-popover border border-border shadow-lg z-1000"
              >
                <DropdownMenuItem
                  onClick={() => handleCreateNote("note")}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  <FileText className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Note</span>
                    <span className="text-xs opacity-80">Free-form writing</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCreateNote("checklist")}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  <CheckSquare className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Checklist</span>
                    <span className="text-xs opacity-80">Task list with checkboxes</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              {/* Horizontal navigation buttons */}
              <div className="flex justify-center mb-5">
                <div className="flex gap-1 w-full p-1 bg-secondary/30 rounded-xl">
                  <Button
                    variant={isActive("/home") ? "default" : "ghost"}
                    size="sm"
                    asChild
                    className={`flex-1 h-9 rounded-lg font-medium text-sm transition-all duration-250
                      ${isActive("/home") ? "bg-card shadow-md text-foreground" : "text-muted-foreground/70 hover:text-foreground hover:bg-card/30"}
                    `}
                  >
                    <a href="/home" className="flex items-center justify-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>All</span>
                    </a>
                  </Button>
                  <Button
                    variant={isActive("/prompts") ? "default" : "ghost"}
                    size="sm"
                    asChild
                    className={`flex-1 h-9 rounded-lg font-medium text-sm transition-all duration-250
                      ${isActive("/prompts") ? "bg-card shadow-md text-foreground" : "text-muted-foreground/70 hover:text-foreground hover:bg-card/30"}
                    `}
                  >
                    <a href="/prompts" className="flex items-center justify-center gap-2">
                      <Pencil className="h-4 w-4" />
                      <span>Ideas</span>
                    </a>
                  </Button>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="py-2">
            {/* Recent Notes Header */}
            <div className="w-full px-4 py-2.5 font-medium text-foreground h-10">
              <div className="flex items-center justify-center gap-2.5 w-full">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Recent Notes</span>
              </div>
            </div>
            <SidebarGroupContent>
              <div
                className="h-[calc(100dvh-380px)] overflow-y-auto scrollbar-hide pr-1"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <style>{`
                        .scrollbar-hide::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                <div className="space-y-1">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map((note, index) => (
                      <div
                        key={note.id}
                        className={`
                                px-3 py-2.5 rounded-lg cursor-pointer
                                transition-all duration-250 ease-bounce-out
                                hover:bg-secondary/60
                                ${location.pathname === `/note/${note.id}` ? "sidebar-menu-active" : ""}
                              `}
                        onClick={() => handleSelectNote(note)}
                        style={{
                          animationDelay: `${index * 0.03}s`,
                          animationFillMode: "both",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {note.note_type === "checklist" && (
                            <CheckSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <h3 className="text-sm font-medium truncate dynamic-title-font text-foreground/90">
                            {note.title || (note.note_type === "checklist" ? "Untitled Checklist" : "Untitled Note")}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
                          {note.content
                            ? note.content
                                .replace(/<[^>]*>?/gm, "")
                                .replace(/&nbsp;/g, " ")
                                .replace(/&[a-z]+;/gi, " ")
                                .trim()
                                .substring(0, 50)
                            : "No content"}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1.5 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center text-muted-foreground">
                      <p className="text-sm">No notes found</p>
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 btn-accessible rounded-full text-xs bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm"
                          onClick={() => setSearchTerm("")}
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      )}

      <SidebarFooter className="px-4 py-4 border-t border-border/20 apple-pwa-sidebar-footer">
        <div className="flex justify-between items-center w-full gap-1 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            className="btn-accessible h-9 w-9 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm"
            title="Sync notes"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <ThemeToggle variant="settings" />

          <Button
            variant="ghost"
            size="sm"
            className={`btn-accessible h-9 w-9 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm ${isActive("/settings") ? "bg-secondary/80 text-accent" : ""}`}
            asChild
            title="Settings"
          >
            <a href="/settings">
              <Settings className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
