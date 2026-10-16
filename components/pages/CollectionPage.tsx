"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, Link } from "@/lib/router";
import {
  Heart,
  Video,
  ShoppingBag,
  ArrowUpDown,
  LayoutGrid,
  Grid2X2,
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api";
import { DEFAULT_PRODUCT_IMAGE, STATIC_ASSETS, resolveProductAsset } from "@/lib/assets";

const resolveAsset = (pth = "") => {
  if (!pth) return DEFAULT_PRODUCT_IMAGE;
  return resolveProductAsset(pth, DEFAULT_PRODUCT_IMAGE);
};

type ShadeItem = {
  id?: string;
  name?: string;
  hexColor?: string;
  sku?: string;
  thumb?: string;
  quantity?: number;
  isOutOfStock?: boolean;
};

type CollectionProduct = {
  id: string;
  name: string;
  slug: string;
  finish?: string | null;
  productType?: string | null;
  basePrice?: number | string | null;
  pricing?: {
    price?: number | string | null;
    originalValue?: number | string | null;
    currency?: string | null;
  } | null;
  media?: {
    heroImage?: string | null;
    gallery?: Array<{ url?: string; id?: string }>;
  } | null;
  images?: Array<{ url: string }> | null;
  shades?: ShadeItem[] | null;
  tags?: string[] | null;
};

type CollectionData = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  media?: Array<{ kind?: string; url?: string }> | null;
  products?: CollectionProduct[];
};

// High-resolution dedicated luxury split partition campaign banners per collection (LV style 50/50 product & application)
const COLLECTION_BANNERS: Record<string, string> = {
  "everyday-essentials": "/assets/banners/split_everyday_essentials.jpg",
  "everyday_essentials": "/assets/banners/split_everyday_essentials.jpg",
  "satin-finish": "/assets/banners/split_satin_finish.jpg",
  "satin_finish": "/assets/banners/split_satin_finish.jpg",
  "matte-essentials": "/assets/banners/split_matte_essentials.jpg",
  "matte_essentials": "/assets/banners/split_matte_essentials.jpg",
  "lip-gloss": "/assets/banners/split_lip_gloss.jpg",
  "lip_gloss": "/assets/banners/split_lip_gloss.jpg",
  "lip-color": "/assets/banners/split_lip_color.jpg",
  "lip_color": "/assets/banners/split_lip_color.jpg",
  "lip-care": "/assets/banners/split_lip_care.jpg",
  "lip_care": "/assets/banners/split_lip_care.jpg",
  "the-campaign": "/assets/banners/split_the_campaign.jpg",
  "the_campaign": "/assets/banners/split_the_campaign.jpg",
  "new-arrival": "/assets/banners/split_new_arrival.jpg",
  "new_arrival": "/assets/banners/split_new_arrival.jpg",
};

interface CollectionPageProps {
  slug?: string;
}

export default function CollectionPage({ slug: propSlug }: CollectionPageProps) {
  const params = useParams() as { slug?: string };
  const location = useLocation();

  const querySlug = useMemo(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("collection");
    }
    return null;
  }, [location.search]);

  const activeSlug = (propSlug || params?.slug || querySlug || "everyday-essentials").toLowerCase();

  const [allCollections, setAllCollections] = useState<CollectionData[]>([]);
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & layout state
  const [selectedFinish, setSelectedFinish] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");
  const [gridCols, setGridCols] = useState<2 | 4>(4);

  // Active shade selections per product: { [productId]: shadeIndex }
  const [selectedShadeMap, setSelectedShadeMap] = useState<Record<string, number>>({});
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const { wishlist, toggleWishlist, addToCart, openDrawer } = useShop();

  // Load collections for navigation
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/collections`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : data?.data || [];
          setAllCollections(list);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch strictly the products belonging to this collection from the database
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchCollection = async () => {
      try {
        const res = await fetch(`${API_BASE}/collections/${encodeURIComponent(activeSlug)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data) {
            setCollection(data);
            setProducts(Array.isArray(data.products) ? data.products : []);
          }
        } else {
          if (!cancelled) {
            setCollection({
              id: activeSlug,
              name: activeSlug
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" "),
              slug: activeSlug,
              products: [],
            });
            setProducts([]);
          }
        }
      } catch (err) {
        console.error("Error fetching collection:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchCollection();

    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedFinish !== "ALL") {
      list = list.filter((p) => {
        const f = (p.finish || "").toUpperCase();
        const n = (p.name || "").toUpperCase();
        const t = (p.tags || []).join(" ").toUpperCase();
        if (selectedFinish === "MATTE") return f.includes("MATTE") || n.includes("MATTE") || t.includes("MATTE");
        if (selectedFinish === "SATIN") return f.includes("SATIN") || n.includes("VELVET") || n.includes("BULLET") || t.includes("SATIN");
        if (selectedFinish === "GLOSS") return f.includes("GLOSS") || n.includes("GLOSS") || t.includes("GLOSS");
        return true;
      });
    }

    if (sortBy === "price-asc") {
      list.sort((a, b) => {
        const pa = Number(a.pricing?.price ?? a.basePrice ?? 899);
        const pb = Number(b.pricing?.price ?? b.basePrice ?? 899);
        return pa - pb;
      });
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => {
        const pa = Number(a.pricing?.price ?? a.basePrice ?? 899);
        const pb = Number(b.pricing?.price ?? b.basePrice ?? 899);
        return pb - pa;
      });
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [products, selectedFinish, sortBy]);

  const handleToggleProductWishlist = (product: CollectionProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const priceNum = Number(product.pricing?.price ?? product.basePrice ?? 899);
    const heroImg =
      product.media?.heroImage ||
      product.images?.[0]?.url ||
      DEFAULT_PRODUCT_IMAGE;

    const status = toggleWishlist({
      key: product.slug || product.id,
      id: product.id,
      slug: product.slug,
      name: product.name,
      productName: product.name,
      price: priceNum > 0 ? priceNum : 899,
      currency: "₹",
      image: resolveAsset(heroImg),
      thumb: resolveAsset(heroImg),
    });

    if (status === "added") {
      toast.success(`${product.name} saved to wishlist`);
      openDrawer("wishlist");
    } else {
      toast(`${product.name} removed from wishlist`);
    }
  };

  const handleAddToCart = (product: CollectionProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const priceNum = Number(product.pricing?.price ?? product.basePrice ?? 899);
    const heroImg =
      product.media?.heroImage ||
      product.images?.[0]?.url ||
      DEFAULT_PRODUCT_IMAGE;

    const shadeIndex = selectedShadeMap[product.id] ?? 0;
    const activeShade = product.shades?.[shadeIndex];
    const isShadeOutOfStock = Boolean(
      activeShade &&
      (activeShade.isOutOfStock || (activeShade.quantity !== undefined && activeShade.quantity <= 0))
    );

    if (isShadeOutOfStock) {
      toast.error(`${activeShade?.name || product.name} is currently out of stock`);
      return;
    }

    addToCart({
      key: `${product.slug || product.id}${activeShade?.sku ? `-${activeShade.sku}` : ""}`,
      id: product.id,
      slug: product.slug,
      name: product.name,
      productName: product.name,
      shade: activeShade?.name,
      price: priceNum > 0 ? priceNum : 899,
      currency: "₹",
      image: resolveAsset(activeShade?.thumb || heroImg),
      quantity: 1,
    });

    toast.success(`${product.name} added to bag!`);
    openDrawer("cart");
  };

  const normalizedSlug = activeSlug.replace(/_/g, "-");
  const heroBannerImage =
    COLLECTION_BANNERS[normalizedSlug] ||
    COLLECTION_BANNERS[activeSlug] ||
    collection?.imageUrl ||
    "/assets/banners/the_campaign.jpg";

  return (
    <div className="w-full min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* ===== 50/50 PARTITION EDITORIAL HERO BANNER (Full Screen 100vh) ===== */}
      <section className="relative w-full h-screen min-h-[640px] overflow-hidden bg-[#e8e6e3]">
        {/* Split Partition Image (50% Cevonne luxury lipstick packshot | 50% model application) */}
        <img
          src={heroBannerImage}
          alt={collection?.name || "Collection"}
          className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.97] transition-transform duration-1000 ease-out hover:scale-102"
        />

        {/* Elegant Center Hairline Partition Divider (50/50 split seam like LV) */}
        <div className="hidden md:block absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-white/50 backdrop-blur-sm z-10 pointer-events-none" />

        {/* Scrim Gradients: Top for transparent navbar readability + gentle bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/35 pointer-events-none" />

        {/* Bottom Minimal Luxury Title Overlay */}
        <div className="absolute bottom-8 sm:bottom-12 inset-x-0 z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal uppercase tracking-[0.16em] text-white drop-shadow-xl">
            {collection?.name || "Collection"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-light tracking-[0.35em] uppercase text-neutral-200 drop-shadow-md">
            Haute Beauté Atelier
          </p>
        </div>
      </section>

      {/* ===== REFINED LUXURY TOOLBAR (Clean High-Fashion Palette Matching Site) ===== */}
      <section className="sticky top-16 md:top-20 z-30 border-y border-neutral-200 bg-white/95 text-neutral-900 backdrop-blur-xl shadow-xs transition-all duration-300">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-8">
          {/* Left: Refined Filter Trigger & Finish Select */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setShowFilterDrawer(true)}
              className="group inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-xs uppercase tracking-[0.16em] text-neutral-900 hover:border-black hover:bg-neutral-950 hover:text-white transition-all duration-300 shadow-xs active:scale-95"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-700 transition-transform group-hover:rotate-90 group-hover:text-white duration-300" />
              <span className="font-medium">Filters</span>
              {selectedFinish !== "ALL" && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white animate-scale-in">
                  1
                </span>
              )}
            </button>

            <div className="hidden h-4 w-px bg-neutral-200 sm:block" />

            {/* Custom Pill Finish Select */}
            <div className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-wider">
              <span className="text-[11px] text-neutral-500 font-light tracking-[0.14em]">Finish:</span>
              <div className="relative">
                <select
                  value={selectedFinish}
                  onChange={(e) => setSelectedFinish(e.target.value)}
                  className="appearance-none rounded-full border border-neutral-300 bg-white pl-3.5 pr-8 py-1.5 text-xs uppercase tracking-wider text-neutral-800 outline-none hover:border-black cursor-pointer transition-colors shadow-xs"
                  aria-label="Filter by finish"
                >
                  <option value="ALL">All Finishes</option>
                  <option value="MATTE">Velvet Matte</option>
                  <option value="SATIN">Luminous Satin</option>
                  <option value="GLOSS">Glass Gloss</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              </div>
            </div>
          </div>

          {/* Center: Luxury Badge with Subtle Minimal Dot */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-neutral-800 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-950"></span>
              <span className="font-medium text-neutral-900">
                {filteredProducts.length} {filteredProducts.length === 1 ? "Creation" : "Creations"}
              </span>
            </div>
          </div>

          {/* Right: Sort, View Switcher, and Sleek Virtual Try-On */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Sort Pill */}
            <div className="relative hidden sm:flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none rounded-full border border-neutral-300 bg-white pl-4 pr-8 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-800 outline-none hover:border-black cursor-pointer transition-colors shadow-xs"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            </div>

            {/* Grid Toggle Buttons */}
            <div className="hidden items-center gap-1 border-l border-neutral-200 pl-3 md:flex">
              <button
                type="button"
                onClick={() => setGridCols(2)}
                className={`p-1.5 rounded-md transition-colors ${
                  gridCols === 2 ? "bg-neutral-900 text-white" : "text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
                aria-label="2 Columns large view"
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setGridCols(4)}
                className={`p-1.5 rounded-md transition-colors ${
                  gridCols === 4 ? "bg-neutral-900 text-white" : "text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
                aria-label="4 Columns grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {/* Sleek Luxury Black Virtual Try-On Pill (High Fashion Editorial Style) */}
            <Link
              to="/ar/lipstick"
              className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-white hover:bg-neutral-800 transition-colors shadow-xs active:scale-95"
            >
              <Video className="h-3.5 w-3.5 text-white" />
              <span>Virtual Try On</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Slide-over Filter Drawer (Louis Vuitton Style) */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="relative h-full w-full max-w-md bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <h3 className="font-serif text-lg font-normal uppercase tracking-wider text-black">
                  Filters &amp; Refinements
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFilterDrawer(false)}
                  className="rounded-full p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Finish Options */}
              <div className="mt-6">
                <h4 className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-medium">
                  Formula &amp; Finish
                </h4>
                <div className="mt-3 space-y-2">
                  {[
                    { label: "All Finishes", value: "ALL", desc: "View full collection catalog" },
                    { label: "Velvet Matte", value: "MATTE", desc: "Intense, powdery-soft matte pigment" },
                    { label: "Luminous Satin", value: "SATIN", desc: "Creamy silky finish with golden sheen" },
                    { label: "Glass Gloss", value: "GLOSS", desc: "Micro-reflective high-shine dimension" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setSelectedFinish(item.value);
                        setShowFilterDrawer(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors ${
                        selectedFinish === item.value
                          ? "bg-neutral-100 font-medium text-black border border-black/10"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <div>
                        <div className="text-xs uppercase tracking-wider">{item.label}</div>
                        <div className="text-[11px] text-neutral-500 font-light mt-0.5">{item.desc}</div>
                      </div>
                      {selectedFinish === item.value && <Check className="h-4 w-4 text-black" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By Options */}
              <div className="mt-8 border-t border-neutral-200 pt-6">
                <h4 className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-medium">
                  Sort Order
                </h4>
                <div className="mt-3 space-y-2">
                  {[
                    { label: "Featured", value: "featured" },
                    { label: "Price: Low to High", value: "price-asc" },
                    { label: "Price: High to Low", value: "price-desc" },
                    { label: "Name: A to Z", value: "name" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setSortBy(item.value as any);
                        setShowFilterDrawer(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors ${
                        sortBy === item.value
                          ? "bg-neutral-100 font-medium text-black border border-black/10"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <span className="text-xs uppercase tracking-wider">{item.label}</span>
                      {sortBy === item.value && <Check className="h-4 w-4 text-black" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedFinish("ALL");
                  setSortBy("featured");
                  setShowFilterDrawer(false);
                }}
                className="w-full py-2.5 text-xs uppercase tracking-widest text-neutral-500 hover:text-black transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== STRICT DATABASE PRODUCTS GRID (Seamless Edge-to-Edge Louis Vuitton Style) ===== */}
      <section className="w-full px-0">
        {loading ? (
          <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-neutral-200">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse p-8 border-r border-b border-neutral-200 aspect-[3/4] bg-neutral-50 flex flex-col justify-end">
                <div className="h-4 w-3/4 bg-neutral-200 mx-auto mb-2" />
                <div className="h-3 w-1/2 bg-neutral-200 mx-auto" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div
            className={`w-full grid gap-0 border-t border-neutral-200 ${
              gridCols === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {filteredProducts.map((product, index) => {
              const productKey = product.slug || product.id;
              const isWishlisted = wishlist.some(
                (w) => w.key === productKey || w.id === product.id || w.slug === product.slug
              );

              const priceNum = Number(product.pricing?.price ?? product.basePrice ?? 899);
              const mrpNum = Number(product.pricing?.originalValue ?? 1299);
              const hasDiscount = mrpNum > priceNum && priceNum > 0;

              const shadeIndex = selectedShadeMap[product.id] ?? 0;
              const shades = Array.isArray(product.shades) ? product.shades : [];
              const activeShade = shades[shadeIndex];
              const isCardShadeOutOfStock = Boolean(
                activeShade &&
                (activeShade.isOutOfStock || (activeShade.quantity !== undefined && activeShade.quantity <= 0))
              );
              const activeShadeQty = activeShade?.quantity !== undefined && activeShade?.quantity !== null ? Number(activeShade.quantity) : undefined;
              const isCardShadeLowStock = Boolean(
                !isCardShadeOutOfStock &&
                activeShadeQty !== undefined &&
                activeShadeQty > 0 &&
                activeShadeQty <= 5
              );

              const heroImg =
                activeShade?.thumb ||
                product.media?.heroImage ||
                product.images?.[0]?.url ||
                DEFAULT_PRODUCT_IMAGE;

              return (
                <div
                  key={product.id || index}
                  className="group relative flex flex-col justify-between overflow-hidden border-r border-b border-neutral-200 bg-white p-5 sm:p-7 lg:p-8 transition-colors"
                >
                  {/* Website Signature Theme Card Background (warm studio light grey/beige gradient) */}
                  <img
                    src={STATIC_ASSETS.cardBackground}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover pointer-events-none transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Top action row: Try On & Wishlist */}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <Link
                      to="/ar/lipstick"
                      onClickCapture={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200 px-2.5 py-1 text-[9px] font-medium tracking-wider uppercase text-neutral-800 hover:bg-black hover:text-white transition-colors shadow-xs"
                    >
                      <Video className="h-3 w-3" />
                      Try On
                    </Link>

                    <button
                      type="button"
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      onClick={(e) => handleToggleProductWishlist(product, e)}
                      className="rounded-full p-1.5 bg-white/70 hover:bg-white backdrop-blur-sm text-neutral-600 transition-transform active:scale-90 hover:text-black shadow-xs"
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          isWishlisted ? "fill-rose-500 text-rose-500" : "text-neutral-700 hover:text-rose-500"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Packshot Image Center */}
                  <div className="relative z-10 aspect-[3/4] w-full my-3 flex items-center justify-center overflow-hidden">
                    <Link
                      to={`/product/${encodeURIComponent(product.slug || product.id)}`}
                      className="flex h-full w-full items-center justify-center p-3"
                    >
                      <img
                        src={resolveAsset(heroImg)}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-108"
                      />
                    </Link>
                  </div>

                  {/* Multi-shade dots */}
                  {shades.length > 0 && (
                    <div className="relative z-10 mb-3 flex items-center justify-center gap-1.5">
                      {shades.slice(0, 5).map((shade, sIdx) => {
                        const isDotOutOfStock = Boolean(
                          shade.isOutOfStock ||
                          (shade.quantity !== undefined && shade.quantity <= 0)
                        );
                        const dotQty = shade.quantity !== undefined && shade.quantity !== null ? Number(shade.quantity) : undefined;
                        const isDotLowStock = !isDotOutOfStock && dotQty !== undefined && dotQty > 0 && dotQty <= 5;
                        return (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedShadeMap((prev) => ({ ...prev, [product.id]: sIdx }));
                            }}
                            style={{ backgroundColor: shade.hexColor || "#8E0F1E" }}
                            className={`relative h-3 w-3 rounded-full border transition-transform ${
                              shadeIndex === sIdx
                                ? "scale-125 border-black ring-1 ring-black ring-offset-1"
                                : "border-black/20 hover:scale-110"
                            } ${isDotOutOfStock ? "opacity-60" : ""}`}
                            title={`${shade.name || `Shade ${sIdx + 1}`}${isDotOutOfStock ? " (Out of Stock)" : isDotLowStock ? ` (Only ${dotQty} left)` : ""}`}
                            aria-label={`Select shade ${shade.name || `Shade ${sIdx + 1}`}`}
                          >
                            {isDotOutOfStock && (
                              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="w-full h-[1px] bg-white/90 rotate-45" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                      {shades.length > 5 && (
                        <span className="text-[10px] text-neutral-400">+{shades.length - 5}</span>
                      )}
                    </div>
                  )}

                  {/* Clean Typography Metadata & Add to Bag */}
                  <div className="relative z-10 space-y-1.5 text-center">
                    <Link
                      to={`/product/${encodeURIComponent(product.slug || product.id)}`}
                      className="block font-sans text-xs sm:text-sm font-normal tracking-[0.02em] text-neutral-900 hover:opacity-75 transition-opacity line-clamp-1"
                    >
                      {product.name}
                    </Link>

                    <div className="flex items-center justify-center gap-1.5">
                      <p className="text-[11px] font-light uppercase tracking-wider text-neutral-500">
                        {activeShade?.name || product.finish || "Velvet"}
                      </p>
                      {isCardShadeOutOfStock ? (
                        <span className="text-[9px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-200">
                          Out of Stock
                        </span>
                      ) : isCardShadeLowStock ? (
                        <span className="text-[9px] font-medium text-[#4b0d4b] bg-[#f6edf7] px-2 py-0.5 rounded-full border border-[#ead2ef]">
                          Only {activeShadeQty} left!
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-0.5">
                      <span className="text-xs sm:text-sm font-medium text-neutral-900">
                        ₹{priceNum}
                      </span>
                      {hasDiscount && (
                        <span className="text-[11px] text-neutral-400 line-through">
                          ₹{mrpNum}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isCardShadeOutOfStock}
                      onClick={(e) => handleAddToCart(product, e)}
                      className={`mt-3 w-full border py-2.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] transition-all shadow-xs ${
                        isCardShadeOutOfStock
                          ? "border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed"
                          : "border-neutral-300 bg-white/90 backdrop-blur-xs text-neutral-900 hover:border-black hover:bg-black hover:text-white"
                      }`}
                    >
                      {isCardShadeOutOfStock ? "Out of Stock" : "Add to Bag"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-sm uppercase tracking-widest text-neutral-400">
              No products available in this collection yet.
            </p>
          </div>
        )}
      </section>


      {/* ===== MINIMAL LUXURY SERVICES BAR ===== */}
      <section className="w-full border-t border-neutral-200 bg-white py-12">
        <div className="w-full px-4 sm:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-center">
            <div className="flex flex-col items-center">
              <Truck className="h-5 w-5 text-neutral-800 mb-2" strokeWidth={1.5} />
              <h4 className="text-xs font-medium uppercase tracking-widest text-neutral-900">
                Complimentary Shipping
              </h4>
              <p className="mt-1 text-[11px] text-neutral-500 font-light">
                On all prepaid orders across India
              </p>
            </div>

            <div className="flex flex-col items-center">
              <ShieldCheck className="h-5 w-5 text-neutral-800 mb-2" strokeWidth={1.5} />
              <h4 className="text-xs font-medium uppercase tracking-widest text-neutral-900">
                Pure Formulation
              </h4>
              <p className="mt-1 text-[11px] text-neutral-500 font-light">
                Clean, vegan, and dermatologically tested
              </p>
            </div>

            <div className="flex flex-col items-center">
              <RotateCcw className="h-5 w-5 text-neutral-800 mb-2" strokeWidth={1.5} />
              <h4 className="text-xs font-medium uppercase tracking-widest text-neutral-900">
                7-Day Returns
              </h4>
              <p className="mt-1 text-[11px] text-neutral-500 font-light">
                Hassle-free support on unopened items
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
