"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Link, useNavigate } from "@/lib/router";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  Camera,
  ShoppingBag,
  RotateCcw,
  Check,
  Send,
  Heart,
  Share2,
  ShieldCheck,
  Flame,
  Star,
} from "lucide-react";

import { useShop } from "@/context/ShopContext";
import { AR_STATIC_SHADES, type ArShade } from "@/data/arShades";

// Quiz Option Types
type SkinToneOption = {
  id: string;
  label: string;
  sub: string;
  swatchColor: string;
};

type UndertoneOption = {
  id: string;
  label: string;
  cue: string;
  veins: string;
  jewelry: string;
  accentColor: string;
};

type FinishOption = {
  id: string;
  label: string;
  sub: string;
  feel: string;
  tag: string;
};

type VibeOption = {
  id: string;
  label: string;
  sub: string;
  icon: string;
  palette: string[];
};

const SKIN_TONES: SkinToneOption[] = [
  {
    id: "fair_light",
    label: "Fair to Porcelain",
    sub: "Alabaster, ivory, or pale peach. Tans slowly or burns easily in sun.",
    swatchColor: "#F7DFD4",
  },
  {
    id: "light_medium",
    label: "Light to Medium",
    sub: "Warm golden beige, light olive, or biscuit wheatish. Tans naturally.",
    swatchColor: "#E0B79B",
  },
  {
    id: "medium_tan",
    label: "Tan to Warm Olive",
    sub: "Golden bronze, rich caramel, or warm honey. Glowing golden warmth.",
    swatchColor: "#C38E68",
  },
  {
    id: "deep_rich",
    label: "Deep to Rich Espresso",
    sub: "Warm cocoa, mahogany, or deep bronze. High melanin richness.",
    swatchColor: "#7D4E38",
  },
];

const UNDERTONES: UndertoneOption[] = [
  {
    id: "warm",
    label: "Warm & Golden",
    cue: "Veins look olive/green in natural sunlight",
    veins: "Greenish veins",
    jewelry: "Gold jewelry makes your skin glow",
    accentColor: "#D4AF37",
  },
  {
    id: "cool",
    label: "Cool & Rosy",
    cue: "Veins look blue or violet in daylight",
    veins: "Blue/violet veins",
    jewelry: "Silver jewelry flatters your skin instantly",
    accentColor: "#E06D83",
  },
  {
    id: "neutral",
    label: "Neutral & Balanced",
    cue: "Veins appear blue-green; equally gorgeous in both gold & silver",
    veins: "Blue-green blend",
    jewelry: "Both gold and silver look effortless",
    accentColor: "#9E7B9B",
  },
];

const FINISHES: FinishOption[] = [
  {
    id: "velvet_matte",
    label: "Velvet Couture Matte",
    sub: "Ultra-pigmented, transfer-resistant 12-hr bullet with zero flaking.",
    feel: "Weightless Silk Veil",
    tag: "Bestseller",
  },
  {
    id: "satin_creme",
    label: "Hydrating Satin Crème",
    sub: "Infused with botanical oils & hyaluronic sphere for soft, luminous lips.",
    feel: "Buttery Nourishing",
    tag: "Luminous",
  },
  {
    id: "liquid_matte",
    label: "Air Couture Liquid Matte",
    sub: "Smudge-proof liquid couture that locks intense color in a single glide.",
    feel: "Featherlight Longwear",
    tag: "Transferproof",
  },
  {
    id: "high_shine",
    label: "Glass Veil Gloss",
    sub: "Mirror-glaze reflective shine with subtle volume-plumping glow.",
    feel: "Non-Sticky Shine",
    tag: "Plumping",
  },
];

const VIBES: VibeOption[] = [
  {
    id: "everyday_nude",
    label: "Everyday Signature Nude",
    sub: "Clean girl elegance, boardrooms, daily confidence & brunch.",
    icon: "☕",
    palette: ["#AC807F", "#BD919F", "#5F302C"],
  },
  {
    id: "romantic_rose",
    label: "Romantic Mauve & Petal Rose",
    sub: "Feminine dusk flush, date nights, weddings & soft editorial glam.",
    icon: "🥀",
    palette: ["#B34661", "#8F3651", "#B15A67"],
  },
  {
    id: "power_red",
    label: "The Iconic Statement Red",
    sub: "Unapologetic power, red-carpet entrances, high glam & gala events.",
    icon: "💋",
    palette: ["#CF1435", "#991C42", "#8B1228"],
  },
  {
    id: "dusk_berry",
    label: "Deep Dusk Berry & Wine",
    sub: "Moody luxury, cocktail soirees, autumn depth & velvet mystery.",
    icon: "🍷",
    palette: ["#5E1F37", "#A0174C", "#732D2C"],
  },
];

interface QuizAnswers {
  skinTone: string | null;
  undertone: string | null;
  finish: string | null;
  vibe: string | null;
}

export default function ShadeQuizPage() {
  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, openDrawer } = useShop();

  const isInstagramTraffic = useMemo(() => {
    const src = searchParams.get("utm_source") || searchParams.get("ref") || "";
    return /instagram|ig|insta/i.test(src);
  }, [searchParams]);

  const [step, setStep] = useState<number>(0); // 0 = Intro, 1..4 = Questions, 5 = Analyzing, 6 = Results
  const [answers, setAnswers] = useState<QuizAnswers>({
    skinTone: null,
    undertone: null,
    finish: null,
    vibe: null,
  });

  // Result state
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedToWhatsapp, setSubmittedToWhatsapp] = useState(false);

  // Match Calculation
  const matchedShade = useMemo(() => {
    const { skinTone, undertone, finish, vibe } = answers;

    // Default hero
    let primaryShadeId = 2; // Bare Grace #24
    let sisterShadeId = 3; // Rose Veil #32
    let matchReason =
      "A universally flattering nude-rose created to elevate natural undertones with subtle, luminous depth.";
    let matchScore = 98;

    if (vibe === "power_red") {
      if (finish === "liquid_matte") {
        primaryShadeId = 11; // Ruby Banarasi
        sisterShadeId = 12; // Runway Rani
        matchReason =
          "Royal scarlet red with blue undertones that makes teeth look instantly whiter and commands pure attention.";
        matchScore = 99;
      } else {
        primaryShadeId = 8; // Velvet Rose #46
        sisterShadeId = 5; // Rouge Mystral #41
        matchReason =
          "Rich crimson red balanced with velvet satin warmth to deliver opulent, non-drying Hollywood glamour.";
        matchScore = 98;
      }
    } else if (vibe === "dusk_berry") {
      if (skinTone === "deep_rich" || skinTone === "medium_tan") {
        primaryShadeId = 12; // Runway Rani
        sisterShadeId = 14; // Mulberry Luxe
        matchReason =
          "Rich mulberry plum engineered specifically for deep and warm olive undertones without ever looking ashy.";
        matchScore = 99;
      } else {
        primaryShadeId = 4; // Velvet Mira #37
        sisterShadeId = 14; // Mulberry Luxe
        matchReason =
          "A refined dusk plum that wraps lips in velvet mystery with balanced cool-warm undertone harmony.";
        matchScore = 97;
      }
    } else if (vibe === "romantic_rose") {
      if (undertone === "warm") {
        primaryShadeId = 6; // Spiced Ember #42
        sisterShadeId = 9; // Desert Dream
        matchReason =
          "Terracotta rose infused with warm cinnamon warmth that lifts wheatish and tan skin tones with a healthy flush.";
        matchScore = 98;
      } else {
        primaryShadeId = 3; // Rose Veil #32
        sisterShadeId = 10; // Marvellè Crush
        matchReason =
          "A classic petal rose designed with subtle mauve undertones that never turn grey or muddy.";
        matchScore = 99;
      }
    } else {
      // everyday_nude
      if (skinTone === "deep_rich") {
        primaryShadeId = 7; // Cocoa Poise #45
        sisterShadeId = 1; // Silk Élan #23
        matchReason =
          "A decadent warm espresso brown that acts as the ultimate nude for deep, melanin-rich skin.";
        matchScore = 99;
      } else if (skinTone === "medium_tan" && undertone === "warm") {
        primaryShadeId = 1; // Silk Élan #23
        sisterShadeId = 13; // Toffee Veil
        matchReason =
          "Couture chocolate-nude with warm hazelnut undertones that gives an effortless sculpt to tan lips.";
        matchScore = 98;
      } else if (finish === "liquid_matte") {
        primaryShadeId = 9; // Desert Dream
        sisterShadeId = 13; // Toffee Veil
        matchReason =
          "Weightless peach-nude liquid formula that defines and hydrates lips all day long.";
        matchScore = 98;
      } else {
        primaryShadeId = 2; // Bare Grace #24
        sisterShadeId = 3; // Rose Veil #32
        matchReason =
          "The signature Cevonne bare nude. Balances soft rose and neutral beige for timeless, everyday elegance.";
        matchScore = 99;
      }
    }

    const hero = AR_STATIC_SHADES.find((s) => s.id === primaryShadeId) || AR_STATIC_SHADES[1];
    const sister = AR_STATIC_SHADES.find((s) => s.id === sisterShadeId) || AR_STATIC_SHADES[2];

    return {
      hero,
      sister,
      matchReason,
      matchScore,
    };
  }, [answers]);

  // Handle Analyzing Screen
  useEffect(() => {
    if (step === 5) {
      const timer = setTimeout(() => {
        setStep(6);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const selectOption = (key: keyof QuizAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (step === 4) {
      setStep(5); // Go to Analyzing
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = leadPhone.replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit WhatsApp phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName || "Beauty Lover",
          phone: cleanPhone,
          email: leadEmail,
          source: isInstagramTraffic ? "instagram_story" : "website_quiz",
          answers,
          matchedShade: {
            id: matchedShade.hero.id,
            name: matchedShade.hero.name,
            code: matchedShade.hero.code,
            color: matchedShade.hero.color,
            finish: matchedShade.hero.finish,
            category: matchedShade.hero.category,
            pantone: matchedShade.hero.pantone,
            matchScore: matchedShade.matchScore,
            tryOnUrl: `https://www.cevonne.com/ar/lipstick?shade=${matchedShade.hero.id}`,
            productUrl: "https://www.cevonne.com/collections/lip-color",
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to dispatch WhatsApp match.");
      }

      setSubmittedToWhatsapp(true);
      toast.success("💄 Your shade match & 10% VIP code sent to WhatsApp!");
    } catch (err: any) {
      toast.error(err.message || "Unable to send to WhatsApp right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    const item = {
      key: `quiz-matched-${matchedShade.hero.id}-${Date.now()}`,
      id: `shade-${matchedShade.hero.id}`,
      name: `${matchedShade.hero.name} (Shade #${matchedShade.hero.code || matchedShade.hero.id})`,
      productName: matchedShade.hero.category,
      price: 999,
      color: matchedShade.hero.color,
      shade: matchedShade.hero.name,
      shadeName: matchedShade.hero.name,
      shadeId: String(matchedShade.hero.id),
      quantity: 1,
      stock: 50,
      currency: "₹",
      image: "https://cdn.cevonne.com/assets/images/product1.png",
    };

    addToCart(item);
    openDrawer("cart");
    toast.success(`${matchedShade.hero.name} added to your luxury bag!`);
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "https://www.cevonne.com/quiz";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Cevonne Signature Shade Match",
          text: `I found my signature lipstick shade: ${matchedShade.hero.name}! Find yours here:`,
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Quiz link copied to clipboard!");
    }
  };

  const restartQuiz = () => {
    setStep(1);
    setSubmittedToWhatsapp(false);
    setAnswers({
      skinTone: null,
      undertone: null,
      finish: null,
      vibe: null,
    });
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#181614] pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8 selection:bg-rose-100 selection:text-rose-900">
      <div className="max-w-2xl mx-auto">
        {/* Instagram / Story VIP Banner */}
        {isInstagramTraffic && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-rose-900 via-[#4b0d4b] to-neutral-900 p-3.5 text-white flex items-center justify-between text-xs shadow-md animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
                💋
              </span>
              <span>
                <strong>Instagram VIP:</strong> Instant Shade Match + 10% Welcome Gift
              </span>
            </div>
            <span className="rounded-full bg-rose-500/30 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border border-rose-300/30">
              Exclusive
            </span>
          </div>
        )}

        {/* STEP 0: LUXURY INTRO */}
        {step === 0 && (
          <div className="text-center py-6 sm:py-10 space-y-6 animate-fade-in">
            <div className="inline-flex items-center rounded-full border border-neutral-300 bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#9c897f] shadow-xs">
              The Cevonne Atelier Shade Match
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-neutral-900 leading-[1.15]">
              Find your <span className="italic font-normal">signature</span> lip shade.
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 max-w-lg mx-auto leading-relaxed">
              No more guessing games. Discover the couture lipstick formula engineered to celebrate
              your skin tone and undertone in 4 quick, visual questions.
            </p>

            {/* Quick Proof Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 font-medium">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> 10,000+ Matches
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 font-medium">
                <Camera className="h-3 w-3 text-rose-600" /> Virtual AR Live Try-On
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 font-medium">
                ⏱️ 30 Seconds
              </span>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-3 rounded-full bg-neutral-950 px-8 py-4 text-sm font-semibold tracking-wider uppercase text-white shadow-lg hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Start The Quiz <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* PROGRESS BAR (Shown during Questions 1-4) */}
        {step >= 1 && step <= 4 && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <span className="font-semibold text-neutral-400 uppercase tracking-widest text-[10px]">
                Question {step} of 4
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full bg-neutral-900 transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 1: SKIN COMPLEXION */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9c897f]">
                Step 01
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-neutral-900">
                What is your skin complexion?
              </h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Select the shade range that closest mirrors your natural bare skin tone.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {SKIN_TONES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectOption("skinTone", option.id)}
                  className="group relative flex items-start gap-4 p-4 rounded-2xl border border-neutral-200 bg-white text-left hover:border-neutral-900 hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <div
                    className="h-12 w-12 rounded-full shrink-0 shadow-inner border border-black/10 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: option.swatchColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base font-medium text-neutral-900 group-hover:text-[var(--primary,#4b0d4b)] transition-colors">
                      {option.label}
                    </h3>
                    <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">
                      {option.sub}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: UNDERTONE TEST */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9c897f]">
                Step 02
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-neutral-900">
                What is your undertone?
              </h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Check your wrist veins in natural daylight or think of your best jewelry match.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-2">
              {UNDERTONES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectOption("undertone", option.id)}
                  className="group relative flex items-center justify-between p-5 rounded-2xl border border-neutral-200 bg-white text-left hover:border-neutral-900 hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: option.accentColor }}
                      />
                      <h3 className="font-serif text-lg font-medium text-neutral-900 group-hover:text-[var(--primary,#4b0d4b)] transition-colors">
                        {option.label}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-600 pl-6">{option.cue}</p>
                    <div className="flex items-center gap-3 pl-6 pt-1 text-[11px] text-neutral-400">
                      <span>• {option.veins}</span>
                      <span>• {option.jewelry}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: PREFERRED FINISH */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9c897f]">
                Step 03
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-neutral-900">
                Choose your desired finish &amp; texture
              </h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                How do you love your lipsticks to feel and look on your lips?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {FINISHES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectOption("finish", option.id)}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl border border-neutral-200 bg-white text-left hover:border-neutral-900 hover:shadow-md transition-all active:scale-[0.99] min-h-[140px]"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">
                      {option.tag}
                    </span>
                    <span className="text-[11px] font-medium text-neutral-400">{option.feel}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-medium text-neutral-900 group-hover:text-[var(--primary,#4b0d4b)] transition-colors">
                      {option.label}
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">{option.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: SIGNATURE VIBE & OCCASION */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9c897f]">
                Step 04
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-neutral-900">
                What is your signature vibe?
              </h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Select the mood or aesthetic you reach for the most.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {VIBES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectOption("vibe", option.id)}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl border border-neutral-200 bg-white text-left hover:border-neutral-900 hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex items-center -space-x-1.5">
                      {option.palette.map((c, i) => (
                        <div
                          key={i}
                          className="h-4 w-4 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-medium text-neutral-900 group-hover:text-[var(--primary,#4b0d4b)] transition-colors">
                      {option.label}
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">{option.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: LUXURY ANALYZING TRANSITION */}
        {step === 5 && (
          <div className="text-center py-20 space-y-6 animate-fade-in">
            <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-neutral-200 animate-ping opacity-30" />
              <div className="h-16 w-16 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
              <div className="h-3 w-3 rounded-full bg-neutral-900 absolute" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-light text-neutral-900">
                Calibrating your couture pigment match...
              </h2>
              <p className="text-xs text-neutral-500 tracking-wide">
                Balancing undertone harmony, skin contrast, and pigment opacity.
              </p>
            </div>
          </div>
        )}

        {/* STEP 6: MATCH REVEAL & CONVERSION CARD */}
        {step === 6 && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Match Hero Card */}
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-radial from-rose-100/50 to-transparent pointer-events-none rounded-bl-full" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Big Swatch Indicator */}
                <div className="relative shrink-0 text-center">
                  <div
                    className="h-28 w-28 sm:h-32 sm:w-32 rounded-full shadow-2xl border-4 border-white ring-1 ring-black/10 flex items-center justify-center mx-auto"
                    style={{ backgroundColor: matchedShade.hero.color }}
                  >
                    <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white text-xs font-serif font-bold drop-shadow-md">
                      #{matchedShade.hero.code || matchedShade.hero.id}
                    </div>
                  </div>
                  <span className="inline-block mt-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                    Pantone {matchedShade.hero.pantone || "Couture"}
                  </span>
                </div>

                {/* Match Information */}
                <div className="flex-1 text-center sm:text-left space-y-2.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      ★ {matchedShade.matchScore}% Match Formula
                    </span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                      {matchedShade.hero.finish}
                    </span>
                  </div>

                  <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-900">
                    {matchedShade.hero.name}
                  </h2>

                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    {matchedShade.matchReason}
                  </p>

                  <div className="pt-2 flex items-baseline justify-center sm:justify-start gap-2">
                    <span className="text-2xl font-bold text-neutral-900">₹999</span>
                    <span className="text-xs text-emerald-600 font-medium">Free standard delivery</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to={`/ar/lipstick?shade=${matchedShade.hero.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-neutral-800 transition-all"
                >
                  <Camera className="h-4 w-4 text-rose-400" /> Try On Live (AR Camera)
                </Link>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-neutral-900 shadow-xs hover:bg-neutral-50 transition-all"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to Luxury Bag
                </button>
              </div>
            </div>

            {/* SISTER SHADE / SECOND CHOICE */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="h-10 w-10 rounded-full shrink-0 shadow-sm border-2 border-white ring-1 ring-black/10"
                  style={{ backgroundColor: matchedShade.sister.color }}
                />
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Alternative Sister Match
                  </span>
                  <h4 className="font-serif text-base font-medium text-neutral-900">
                    {matchedShade.sister.name} (#{matchedShade.sister.code || matchedShade.sister.id})
                  </h4>
                  <span className="text-xs text-neutral-500">{matchedShade.sister.finish}</span>
                </div>
              </div>

              <Link
                to={`/ar/lipstick?shade=${matchedShade.sister.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary,#4b0d4b)] hover:underline shrink-0"
              >
                Try Sister Shade &rarr;
              </Link>
            </div>

            {/* SEND TO WHATSAPP & UNLOCK 10% VIP DISCOUNT (n8n G6 Webhook Intake) */}
            <div className="rounded-3xl border border-rose-200/80 bg-gradient-to-br from-white via-rose-50/30 to-amber-50/20 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shrink-0">
                  <Send className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif text-xl font-normal text-neutral-900">
                    Send My Shade Formula to WhatsApp
                  </h3>
                  <p className="text-xs text-neutral-600">
                    Receive your exact match link + a complimentary <strong>10% VIP Welcome Code</strong>.
                  </p>
                </div>
              </div>

              {submittedToWhatsapp ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center text-xs text-emerald-800 space-y-1">
                  <p className="font-bold text-sm">✅ Dispatched to your WhatsApp!</p>
                  <p className="text-emerald-700">
                    Check your messages for your bespoke shade card and promo code: <strong>CEVONNE10</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWhatsAppSubmit} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp Number (e.g. 9876543210)"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-xs font-bold uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Dispatching..." : "Send Match to WhatsApp 💬"}
                  </button>

                  <p className="text-[10px] text-center text-neutral-400">
                    🔒 Zero spam guarantee. Powered by Cevonne official verified WhatsApp channel.
                  </p>
                </form>
              )}
            </div>

            {/* Bottom Actions: Retake & Share */}
            <div className="flex items-center justify-between pt-4 text-xs">
              <button
                type="button"
                onClick={restartQuiz}
                className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Retake Quiz
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 font-medium"
              >
                <Share2 className="h-3.5 w-3.5" /> Share Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

