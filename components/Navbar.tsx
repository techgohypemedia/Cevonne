"use client";

import React, { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "@/lib/router"
import {
  Menu,
  Search,
  Heart,
  User,
  Phone,
  ShoppingCart,
  ChevronRight,
  Truck,
  ShieldCheck,
} from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useShop } from "@/context/ShopContext"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { STATIC_ASSETS } from "@/lib/assets"

const NAV_H_MOBILE = "h-16"     // 64px
const NAV_H_DESKTOP = "md:h-20" // 80px

const Navbar = () => {
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const THRESHOLD = 24
  const location = useLocation()
  const navigate = useNavigate()
  const isHomePage = location.pathname === "/"
  const isCollectionPage =
    location.pathname === "/collections" ||
    location.pathname.startsWith("/collections/") ||
    location.pathname.startsWith("/collection/")
  const hasHeroBanner = isHomePage || isCollectionPage

  // Transparent at top for hero pages (Home & Collections), solid everywhere else
  const [solid, setSolid] = useState(!hasHeroBanner)
  const ticking = useRef(false)

  const { cartItems, wishlist, openDrawer, totalCount } = useShop()
  const { isAuthenticated } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!hasHeroBanner) {
      setSolid(true)
      return
    }

    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        setSolid(window.scrollY > THRESHOLD)
        ticking.current = false
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [hasHeroBanner])

  const handleMenuSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setMenuOpen(false)
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const textClass = solid ? "text-neutral-900" : "text-white"

  return (
    <>
      <header
        className={`hidden md:block fixed inset-x-0 top-0 z-50 w-full transition-[background-color,backdrop-filter,border-color,box-shadow] duration-200
        ${solid
            ? "bg-white/95 border-b border-neutral-200/80 backdrop-blur-md shadow-xs"
            : "bg-transparent border-transparent shadow-none"
          }`}
        style={{
          backgroundColor: solid ? "rgba(255,255,255,0.95)" : "transparent",
        }}
      >
        <div
          className={`flex w-full items-center justify-between px-3 font-normal md:px-6 lg:px-[54px] ${NAV_H_MOBILE} ${NAV_H_DESKTOP}`}
        >
          {/* Left: Menu + Search */}
          <div className="flex items-center gap-4 md:gap-6">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className={`group flex items-center gap-2 text-sm hover:opacity-80 transition-colors duration-300 ${textClass}`}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" strokeWidth={1.5} />
                  <span className="hidden sm:inline font-medium tracking-wide">{t("nav.menu")}</span>
                </button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-[90vw] max-w-[380px] sm:max-w-[410px] p-0 bg-white border-r border-neutral-200/80 shadow-2xl flex flex-col justify-between"
              >
                <SheetTitle className="sr-only">Main navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Cevonne luxury beauty catalog, AR virtual try-on studio, and brand discovery.
                </SheetDescription>

                {/* Top Section: Brand Header & Search */}
                <div className="border-b border-neutral-100 px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between">
                    <Link
                      to="/"
                      onClick={() => setMenuOpen(false)}
                      className="group flex flex-col"
                    >
                      <img
                        src={STATIC_ASSETS.logoNavbar}
                        alt="Cevonne"
                        className="h-5 w-auto object-contain brightness-0 transition-opacity group-hover:opacity-80"
                      />
                      <span className="text-[9px] font-semibold tracking-[0.26em] text-neutral-400 uppercase mt-1">
                        Haute Beauté · Paris &amp; New York
                      </span>
                    </Link>
                  </div>

                  {/* Minimalist Search inside drawer */}
                  <form onSubmit={handleMenuSearch} className="relative mt-4">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search shades, formulas, finishes..."
                      className="w-full rounded-xl bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200/80 focus:border-neutral-900 pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-all"
                    />
                  </form>
                </div>

                {/* Center Scrollable Nav: Curated Categories & AR Studio */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-none">
                  {/* Category Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
                        Collections
                      </span>
                      <span className="text-[10px] font-medium text-neutral-400">Pure Vegan</span>
                    </div>

                    <nav className="space-y-1">
                      {/* Shop All */}
                      <Link
                        to="/collections/everyday-essentials"
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl hover:bg-neutral-50 transition-colors"
                      >
                        <div>
                          <div className="text-base font-serif font-medium tracking-wide text-neutral-900 group-hover:text-[var(--primary)] transition-colors">
                            {t("nav.shopAll")}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-sans">
                            Explore all formulas &amp; curated collections
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
                      </Link>

                      {/* Lip Color (Bestseller) */}
                      <Link
                        to="/collections/lip-color"
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl hover:bg-neutral-50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-serif font-medium tracking-wide text-neutral-900 group-hover:text-[var(--primary)] transition-colors">
                              {t("nav.lips")}
                            </span>
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-semibold text-rose-700 border border-rose-200/60 uppercase tracking-wider">
                              Bestseller
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 font-sans">
                            Velvet matte, weightless 12-hour pigment
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
                      </Link>

                      {/* Face */}
                      <Link
                        to="/search"
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl hover:bg-neutral-50 transition-colors"
                      >
                        <div>
                          <div className="text-base font-serif font-medium tracking-wide text-neutral-900 group-hover:text-[var(--primary)] transition-colors">
                            {t("nav.face")}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-sans">
                            Radiant coverage &amp; luminous complexion
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
                      </Link>

                      {/* Eyes */}
                      <Link
                        to="/search"
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl hover:bg-neutral-50 transition-colors"
                      >
                        <div>
                          <div className="text-base font-serif font-medium tracking-wide text-neutral-900 group-hover:text-[var(--primary)] transition-colors">
                            {t("nav.eyes")}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-sans">
                            Ultra-precision liners &amp; intense drama
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </nav>
                  </div>

                  {/* High-Fashion AR Try-On Banner */}
                  <div>
                    <Link
                      to="/ar/lipstick"
                      onClick={() => setMenuOpen(false)}
                      className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-950 via-[#340b3b] to-neutral-900 p-4 text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.01]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-md px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-200 border border-white/20">
                          Virtual AR Studio
                        </span>
                        <span className="text-[11px] font-medium text-white/80 group-hover:text-white transition-colors">
                          Try Live &rarr;
                        </span>
                      </div>
                      <div className="mt-3">
                        <h4 className="text-base font-serif font-semibold tracking-wide text-white">
                          {t("nav.virtualTryOn")}
                        </h4>
                        <p className="mt-1 text-xs text-neutral-300 leading-relaxed font-sans">
                          Test every shade live on your lips with our high-definition AR camera.
                        </p>
                      </div>
                    </Link>
                  </div>

                  {/* Brand & Editorial */}
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
                      The Brand
                    </span>
                    <nav className="mt-2 space-y-1">
                      <Link
                        to="/about"
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between py-2 text-sm text-neutral-700 hover:text-neutral-950 transition-colors"
                      >
                        <span className="font-serif font-medium">{t("nav.aboutUs")}</span>
                        <span className="text-xs text-neutral-400 group-hover:text-neutral-600">Our Story &rarr;</span>
                      </Link>
                    </nav>
                  </div>

                  {/* Quick User Utilities: Account & Wishlist */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to={isAuthenticated ? "/profile" : "/login"}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/70 py-2.5 px-3 text-xs font-medium text-neutral-800 hover:bg-neutral-100 transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-neutral-600" />
                      <span>{isAuthenticated ? "My Profile" : "Sign In"}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        openDrawer("wishlist")
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/70 py-2.5 px-3 text-xs font-medium text-neutral-800 hover:bg-neutral-100 transition-colors"
                    >
                      <Heart className="h-3.5 w-3.5 text-neutral-600" />
                      <span>Wishlist {mounted && wishlist.length > 0 && `(${wishlist.length})`}</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Section: Concierge & Brand Assurance */}
                <div className="border-t border-neutral-100 bg-neutral-50/60 p-5 space-y-3">
                  <a
                    href="https://wa.me/917061009669?text=Hi%20Cevonne,%20I%20would%20like%20assistance%20with%20choosing%20a%20shade."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl bg-white border border-neutral-200/80 px-3.5 py-2.5 shadow-2xs hover:border-neutral-300 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-900">Shade Concierge</div>
                        <div className="text-[10px] text-neutral-500">Chat with a beauty advisor on WhatsApp</div>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                  </a>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Truck className="h-3 w-3 text-neutral-400" />
                      Free Delivery &gt; ₹999
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-neutral-400" />
                      100% Cruelty-Free
                    </span>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link
              to="/search"
              className={`group flex items-center gap-2 text-sm hover:opacity-80 transition-colors duration-300 ${textClass}`}
              aria-label="Search"
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t("nav.search")}</span>
            </Link>
          </div>

          {/* Center brand */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link to="/">
              <img
                src={STATIC_ASSETS.logoNavbar}
                alt="Cevonne"
                draggable={false}
                className="h-5 w-auto select-none object-contain lg:h-7"
                style={{ filter: solid ? "brightness(0)" : "brightness(0) invert(1)" }}
              />
            </Link>
          </div>

          {/* Right: Call + icons */}
          <div className="flex items-center gap-4 md:gap-6">
            <a
              href="https://wa.me/917061009669"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden md:inline text-sm hover:opacity-80 transition-colors duration-300 ${textClass}`}
              aria-label="Call Us"
            >
              {t("nav.callUs")}
            </a>

            <Separator
              orientation="vertical"
              className={`hidden md:block h-4 bg-[var(--border)] transition-opacity duration-300 ${solid ? "opacity-100" : "opacity-0"
                }`}
            />

            <button
              type="button"
              onClick={() => openDrawer("wishlist")}
              className={`relative inline-flex items-center justify-center hover:opacity-80 transition-colors duration-300 ${textClass}`}
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" strokeWidth={1.5} />
              {mounted && wishlist.length > 0 && (
                <span className="pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold uppercase leading-none text-white">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => openDrawer("cart")}
              className={`relative inline-flex items-center justify-center hover:opacity-80 transition-colors duration-300 ${textClass}`}
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
              {mounted && totalCount > 0 && (
                <span className="pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-semibold uppercase leading-none text-white">
                  {totalCount}
                </span>
              )}
            </button>
            <Link
              to={isAuthenticated ? "/profile" : "/login"}
              className={`inline-flex items-center justify-center hover:opacity-80 transition-colors duration-300 ${textClass}`}
              aria-label={isAuthenticated ? "Account" : "Sign In"}
            >
              <User className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}

export default Navbar
