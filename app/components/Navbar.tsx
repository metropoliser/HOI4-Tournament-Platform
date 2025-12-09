'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home, Trophy, Settings, LogOut, Shield, LayoutDashboard, Gamepad2, Menu, Newspaper } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);

    if (paths.length === 0) {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="text-zinc-400">Home</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }

    if (paths[0] === 'tournaments' && paths.length === 1) {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="text-zinc-400">Tournaments</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }

    if (paths[0] === 'casual') {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="text-zinc-400">Casual Games</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }

    if (paths[0] === 'news') {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="text-zinc-400">News</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }

    if (paths[0] === 'admin') {
      return (
        <>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="text-zinc-400 hover:text-zinc-200">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-zinc-200">Admin Panel</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      );
    }

    if (paths[0] === 'tournaments') {
      if (paths[1] === 'create') {
        return (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-zinc-400 hover:text-zinc-200">Tournaments</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-zinc-200">Create Tournament</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        );
      } else if (paths[1]) {
        return (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-zinc-400 hover:text-zinc-200">Tournaments</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-zinc-200">Tournament Bracket</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        );
      }
    }

    return (
      <BreadcrumbItem>
        <BreadcrumbPage className="text-zinc-400">Tournaments</BreadcrumbPage>
      </BreadcrumbItem>
    );
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b-2 border-zinc-800 bg-zinc-900 sticky top-0 z-50">
        <div className="flex items-center gap-2 px-2 sm:px-4 w-full">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 px-0">
                <Menu className="size-5 text-zinc-400" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-zinc-900 border-r-2 border-zinc-800">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-zinc-100">
                  <div className="bg-amber-600 text-white flex aspect-square size-8 items-center justify-center">
                    <Trophy className="size-4" />
                  </div>
                  <span className="font-semibold">HOI4 Tournaments</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-10 ${
                      pathname === '/'
                        ? 'text-amber-400 bg-zinc-800 border border-amber-900/50'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <Home className="size-5" />
                    <span>Home</span>
                  </Button>
                </Link>
                <Link href="/news" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-10 ${
                      pathname === '/news'
                        ? 'text-amber-400 bg-zinc-800 border border-amber-900/50'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <Newspaper className="size-5" />
                    <span>News</span>
                  </Button>
                </Link>
                <Link href="/tournaments" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-10 ${
                      pathname === '/tournaments'
                        ? 'text-amber-400 bg-zinc-800 border border-amber-900/50'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <Trophy className="size-5" />
                    <span>Tournaments</span>
                  </Button>
                </Link>
                <Link href="/casual" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-10 ${
                      pathname === '/casual'
                        ? 'text-amber-400 bg-zinc-800 border border-amber-900/50'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <Gamepad2 className="size-5" />
                    <span>Casual Games</span>
                  </Button>
                </Link>

                {session && ['admin', 'matchmaker'].includes((session.user as any)?.role) && (
                  <>
                    <Separator className="my-2 bg-zinc-800" />
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-10 ${
                          pathname === '/admin'
                            ? 'text-amber-400 bg-zinc-800 border border-amber-900/50'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                        }`}
                      >
                        <LayoutDashboard className="size-5" />
                        <span>Admin Panel</span>
                      </Button>
                    </Link>
                    <Link href="/admin/news" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-10 ${
                          pathname === '/admin/news'
                            ? 'text-amber-400 bg-zinc-800 border border-amber-900/50'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                        }`}
                      >
                        <Newspaper className="size-5" />
                        <span>News</span>
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-amber-600 text-white flex aspect-square size-8 items-center justify-center md:hidden">
              <Trophy className="size-4" />
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="bg-amber-600 text-white flex aspect-square size-8 items-center justify-center">
                <Trophy className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-zinc-100">Hearts of Iron Tools</span>
                <span className="text-[10px] text-zinc-500">Competitive Tools</span>
              </div>
            </div>
          </Link>

          <Separator orientation="vertical" className="mx-2 h-4 hidden md:block" />

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 h-8 transition-all duration-200 ${
                  pathname === '/'
                    ? 'text-amber-400 bg-zinc-800 border border-amber-900/50'
                    : 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 hover:border hover:border-zinc-700'
                }`}
              >
                <Home className="size-4 transition-transform duration-200 group-hover:scale-110" />
                <span>Home</span>
              </Button>
            </Link>
            <Link href="/news">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 h-8 transition-all duration-200 ${
                  pathname === '/news'
                    ? 'text-amber-400 bg-zinc-800 border border-amber-900/50'
                    : 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 hover:border hover:border-zinc-700'
                }`}
              >
                <Newspaper className="size-4 transition-transform duration-200 group-hover:scale-110" />
                <span>News</span>
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 h-8 transition-all duration-200 ${
                  pathname === '/tournaments'
                    ? 'text-amber-400 bg-zinc-800 border border-amber-900/50'
                    : 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 hover:border hover:border-zinc-700'
                }`}
              >
                <Trophy className="size-4 transition-transform duration-200 group-hover:scale-110" />
                <span>Tournaments</span>
              </Button>
            </Link>
            <Link href="/casual">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 h-8 transition-all duration-200 ${
                  pathname === '/casual'
                    ? 'text-amber-400 bg-zinc-800 border border-amber-900/50'
                    : 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 hover:border hover:border-zinc-700'
                }`}
              >
                <Gamepad2 className="size-4 transition-transform duration-200 group-hover:scale-110" />
                <span>Casual Games</span>
              </Button>
            </Link>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right Side - Auth & Navigation */}
          <div className="flex items-center gap-2">
            {status === 'loading' ? (
              <div className="text-zinc-500 text-sm">Loading...</div>
            ) : session ? (
              <>
                {/* Admin Panel Button */}
                {['admin', 'matchmaker'].includes((session.user as any)?.role) && (
                  <>
                    <Link href="/admin">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`gap-2 h-8 border-2 transition-all duration-200 ${
                          pathname === '/admin'
                            ? 'border-amber-600 bg-amber-900/30 text-amber-400 hover:bg-amber-900/40 hover:text-amber-300 hover:border-amber-500'
                            : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-600 hover:shadow-lg hover:shadow-zinc-900/50'
                        }`}
                      >
                        <LayoutDashboard className="size-4 transition-transform duration-200 group-hover:rotate-6" />
                        <span className="hidden md:inline">Admin Panel</span>
                      </Button>
                    </Link>
                    <Link href="/admin/news">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`gap-2 h-8 border-2 transition-all duration-200 ${
                          pathname === '/admin/news'
                            ? 'border-amber-600 bg-amber-900/30 text-amber-400 hover:bg-amber-900/40 hover:text-amber-300 hover:border-amber-500'
                            : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-600 hover:shadow-lg hover:shadow-zinc-900/50'
                        }`}
                      >
                        <Newspaper className="size-4 transition-transform duration-200 group-hover:scale-110" />
                        <span className="hidden md:inline">News</span>
                      </Button>
                    </Link>
                  </>
                )}

                {/* User Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2 h-8 hover:bg-zinc-800 transition-all duration-200 hover:border hover:border-zinc-700">
                      <Avatar className="h-6 w-6 ring-1 ring-zinc-700 transition-all duration-200 hover:ring-2 hover:ring-amber-600">
                        <AvatarImage src={session.user?.image || ''} alt={session.user?.name || 'User'} />
                        <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
                          {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline text-sm font-medium text-zinc-200 transition-colors duration-200 group-hover:text-amber-300">{session.user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-2 border-zinc-800">
                    <DropdownMenuLabel className="text-zinc-300">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                        <p className="text-xs leading-none text-zinc-500">{session.user?.email || 'Discord User'}</p>
                        <Badge variant="outline" className="w-fit mt-1 h-4 text-[9px] border-zinc-600 text-zinc-400 px-1.5 capitalize">
                          {(session.user as any)?.role || 'player'}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem asChild className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                      <Link href="/" className="flex items-center gap-2">
                        <Home className="size-4" />
                        <span>Tournaments</span>
                      </Link>
                    </DropdownMenuItem>
                    {['admin', 'matchmaker'].includes((session.user as any)?.role) && (
                      <DropdownMenuItem asChild className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                        <Link href="/admin" className="flex items-center gap-2">
                          <Settings className="size-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="text-red-400 focus:bg-red-900/20 focus:text-red-300 cursor-pointer"
                    >
                      <LogOut className="size-4 mr-2" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Sign In Button */
              <Button
                onClick={() => signIn('discord')}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold h-8 px-4 gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-[#5865F2]/50 hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="hidden sm:inline">Sign in with Discord</span>
                <span className="sm:hidden">Sign in</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumbs Bar - Hidden on home page */}
      {pathname !== '/' && (
        <div className="hidden md:flex h-12 items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-4 sticky top-14 z-40">
          <Breadcrumb>
            <BreadcrumbList>
              {generateBreadcrumbs()}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
    </>
  );
}
