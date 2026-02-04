"use client";

import {
  ChevronDown,
  Flame,
  Heart,
  HeartHandshake,
  LayoutGrid,
  Loader2,
  LogOut,
  Moon, 
  Search,
  ShieldQuestionMark,
  ShoppingBag,
  Sun,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes"; // 1. ADICIONADO: Import do next-themes
import { Suspense, useEffect, useRef, useState } from "react";

import { checkAffiliateStatus } from "@/actions/check-affiliate-status";
import { checkStockAvailability } from "@/actions/check-stock";
import { getAllCategories } from "@/actions/get-all-categories";
import { searchProductsAction } from "@/actions/search-products";
import { CartSheet } from "@/components/cart-sheet";
import { MobileMenu } from "@/components/mobile-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/language-context";
import { authClient } from "@/lib/auth-client";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

// --- INTERFACES ---
export interface CategoryLink {
  label: string;
  href: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  images: string[] | null;
}

// --- COMPONENTE DE ÍCONE ---
function HeaderIconButton({
  icon: Icon,
  onClick,
  badgeCount,
  label,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  onClick?: () => void;
  badgeCount?: number;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex items-center gap-2 text-neutral-700 transition-colors hover:text-black"
    >
      <div className="relative">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
        {!!badgeCount && badgeCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white shadow-sm">
            {badgeCount}
          </div>
        )}
      </div>
      {label && (
        <span className="hidden text-sm font-medium lg:block">{label}</span>
      )}
    </button>
  );
}

// --- CONTEÚDO DO HEADER ---
export function HeaderContent() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme } = useTheme(); // 2. ADICIONADO: Hook do tema

  // ESTADOS UNIFICADOS
  const [categories, setCategories] = useState<CategoryLink[]>([]);
  const [isAffiliate, setIsAffiliate] = useState(false);

  // ESTADOS DE UI (DROPDOWNS)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  // PESQUISA
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { t, language, setLanguage } = useLanguage();
  const { items: cartItems, removeItem: removeCartItem } = useCartStore();
  const { items: wishlistItems, removeItem: removeWishlistItem } =
    useWishlistStore();

  // 1. CARREGAMENTO DE DADOS INICIAIS (CATEGORIAS E AFILIADO)
  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const [cats, affStatus] = await Promise.all([
          getAllCategories(),
          checkAffiliateStatus().catch(() => false),
        ]);

        if (cats && cats.length > 0) {
          setCategories(cats);
        }

        setIsAffiliate(affStatus);
      } catch (error) {
        console.error("Erro ao carregar dados do header", error);
      }
    };
    fetchData();
  }, []);

  // 2. VERIFICAÇÃO DE ESTOQUE
  useEffect(() => {
    const verifyStock = async () => {
      if (cartItems.length === 0) return;
      try {
        const { outOfStockItems } = await checkStockAvailability(
          cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
        );
        if (outOfStockItems.length > 0) {
          outOfStockItems.forEach((item) => removeCartItem(item.id));
        }
      } catch (e) {
        console.error(e);
      }
    };
    verifyStock();
  }, [cartItems, removeCartItem]);

  // 3. PESQUISA (DEBOUNCE)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchProductsAction(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 4. FECHAR DROPDOWNS AO CLICAR FORA
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setIsCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatPrice = (value: number) => {
    const lang = language as string;
    let currency = "BRL";
    let locale = "pt-BR";

    if (lang === "en") {
      currency = "USD";
      locale = "en-US";
    } else if (lang === "es") {
      currency = "EUR";
      locale = "es-ES";
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(value / 100);
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.refresh() },
    });
  };

  // 3. ADICIONADO: Função de alternar tema
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) return null;

  const lang = language as string;
  let currentFlag = "https://flagcdn.com/w40/br.png";
  let currentLabel = "BR / BRL";

  if (lang === "en") {
    currentFlag = "https://flagcdn.com/w40/us.png";
    currentLabel = "EN / USD";
  } else if (lang === "es") {
    currentFlag = "https://flagcdn.com/w40/es.png";
    currentLabel = "ES / EUR";
  }

  return (
    <header className="fixed top-0 z-50 w-full flex-col shadow-sm">
      {/* --- BARRA LARANJA (TOP BAR) --- */}
      <div className="w-full bg-orange-600 px-4 py-3 text-xs font-medium text-white transition-colors duration-300 md:px-8 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex cursor-pointer items-center gap-2 transition-opacity outline-none hover:text-white/80">
                  <div className="rounded- relative h-3 w-4 overflow-hidden shadow-sm">
                    <Image
                      src={currentFlag}
                      alt="Flag"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span>{currentLabel}</span>
                  <ChevronDown className="h-3 w-3 opacity-80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="animate-in fade-in zoom-in-95 min-w-[140px] rounded-md border border-neutral-100 bg-white p-1 text-black shadow-lg">
                <DropdownMenuItem
                  onClick={() => setLanguage("pt")}
                  className="cursor-pointer gap-3 rounded-sm px-3 py-2 transition-colors hover:bg-neutral-50 focus:bg-neutral-50"
                >
                  <div className="relative h-3 w-4 overflow-hidden border border-neutral-200 shadow-sm">
                    <Image
                      src="https://flagcdn.com/w40/br.png"
                      alt="BR"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium">Português</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className="cursor-pointer gap-3 rounded-sm px-3 py-2 transition-colors hover:bg-neutral-50 focus:bg-neutral-50"
                >
                  <div className="relative h-3 w-4 overflow-hidden border border-neutral-200 shadow-sm">
                    <Image
                      src="https://flagcdn.com/w40/us.png"
                      alt="US"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium">English</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setLanguage("es")}
                  className="cursor-pointer gap-3 rounded-sm px-3 py-2 transition-colors hover:bg-neutral-50 focus:bg-neutral-50"
                >
                  <div className="relative h-3 w-4 overflow-hidden border border-neutral-200 shadow-sm">
                    <Image
                      src="https://flagcdn.com/w40/es.png"
                      alt="ES"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium">Español</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <span className="text-[14px] font-medium">{t.topBar.promo}</span>
          </div>

          <div className="flex items-center gap-6">
            {/* <div className="flex cursor-pointer items-center gap-1 duration-300 hover:text-white/80">
              <button
                onClick={toggleTheme}
                className="flex cursor-pointer items-center gap-1 transition-opacity outline-none hover:text-white/80"
                aria-label="Alternar tema"
              >
                {mounted && theme === "dark" ? (
                  <>
                    <Moon className="h-3.5 w-3.5" />
                    <span>Escuro</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5" />
                    <span>Claro</span>
                  </>
                )}
              </button>
            </div> */}
            <div className="hidden h-3 w-[1px] bg-white/30 md:block"></div>
            <Link
              href="/sobre"
              className="flex cursor-pointer items-center gap-1 duration-300 hover:text-white/80"
            >
              <ShieldQuestionMark className="h-4 w-4" /> {t.topBar.storeLocator}
            </Link>
            <div className="hidden h-3 w-[1px] bg-white/30 md:block"></div>
            <Link
              href="/faq"
              className="flex cursor-pointer items-center gap-1 duration-300 hover:text-white/80"
            >
              <HeartHandshake className="h-4 w-4" />
              {t.topBar.help}
            </Link>
          </div>
        </div>
      </div>

      {/* --- BARRA PRINCIPAL (BRANCA) --- */}
      <div className="w-full border-b border-neutral-200 bg-white px-4 py-4 shadow-sm md:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 lg:gap-8">
          <div className="flex items-center justify-center gap-4">
            <MobileMenu categories={categories} isAffiliate={isAffiliate} />

            <Link
              href="/"
              className="group flex items-center justify-center gap-1"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                <Image
                  src="/images/logo.png"
                  alt="Logo ESG Group"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover duration-300 group-hover:scale-105 group-active:scale-95"
                />
              </div>
              <span className="font-montserrat text-2xl font-bold text-neutral-700 duration-200 group-hover:text-black group-active:scale-95">
                ESG Group
              </span>
            </Link>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {session && (session.user as any).role === "admin" && (
              <Link href="/admin">
                <h1 className="hidden translate-y-0.5 font-semibold text-orange-500 duration-200 hover:underline md:block">
                  Admin
                </h1>
              </Link>
            )}
          </div>

          {/* BARRA DE PESQUISA E CATEGORIAS */}
          <div className="relative max-w-2xl flex-1" ref={searchRef}>
            <div className="flex h-11 w-full items-center rounded-full border border-neutral-300 bg-neutral-50 transition-all focus-within:border-orange-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100/50">
              {/* --- BOTÃO DE CATEGORIAS (COM DROPDOWN FUNCIONAL) --- */}
              <div
                className="relative hidden h-full sm:block"
                ref={categoryRef}
              >
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="flex h-full items-center gap-2 rounded-l-full border-r border-neutral-200 px-4 text-sm font-medium whitespace-nowrap text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <LayoutGrid className="h-4 w-4 text-neutral-400" />
                  Todas as Categorias
                  <ChevronDown
                    className={`h-3 w-3 opacity-50 transition-transform duration-200 ${
                      isCategoriesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* --- DROPDOWN LIST --- */}
                {isCategoriesOpen && (
                  <div className="animate-in fade-in zoom-in-95 absolute top-14 left-0 z-50 min-w-[220px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
                    <div className="flex flex-col p-2">
                      <h1 className="mb-2 border-b border-neutral-100 p-3 text-xs font-bold text-neutral-700 uppercase">
                        Categorias:
                      </h1>
                      {categories.length > 0 ? (
                        categories.map(
                          (
                            cat,
                            index, // Usando index como key se não houver ID
                          ) => (
                            <Link
                              key={index}
                              href={cat.href || "#"}
                              onClick={() => setIsCategoriesOpen(false)}
                              className="flex items-center justify-between rounded-md px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-600"
                            >
                              {cat.label}
                            </Link>
                          ),
                        )
                      ) : (
                        <div className="px-4 py-3 text-center text-xs text-neutral-400">
                          Nenhuma categoria encontrada.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* --- INPUT DE PESQUISA --- */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que você procura hoje?"
                className="h-full w-full bg-transparent px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />

              <button className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-orange-600">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* --- RESULTADOS DA PESQUISA --- */}
            {showResults && searchQuery.length >= 2 && (
              <div className="animate-in fade-in zoom-in-95 absolute top-14 right-0 left-0 z-50 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl duration-200">
                {searchResults.length > 0 ? (
                  <div className="flex flex-col py-2">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/produto/${product.id}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-neutral-50"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <ShoppingBag className="m-auto mt-3 h-5 w-5 text-neutral-300" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="line-clamp-1 font-medium text-neutral-900">
                            {product.name}
                          </span>
                          <span className="text-sm font-bold text-orange-600">
                            {formatPrice(
                              product.discountPrice || product.price,
                            )}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-neutral-500">
                    Nenhum produto encontrado.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <Link
              href="/categorias/promocoes"
              className="hidden items-center gap-2 text-neutral-700 transition-colors hover:text-orange-600 xl:flex"
            >
              <Flame className="h-5 w-5" />
              <span className="text-sm font-bold">{t.header.bestDeals}</span>
            </Link>

            {/* FAVORITOS */}
            <Sheet>
              <SheetTrigger asChild>
                <div className="hidden sm:block">
                  <HeaderIconButton
                    icon={Heart}
                    badgeCount={wishlistItems.length}
                  />
                </div>
              </SheetTrigger>
              <SheetContent className="bg-white text-neutral-900 sm:max-w-[400px]">
                <SheetHeader className="border-b border-neutral-100 pb-4">
                  <SheetTitle>{t.header.wishlist.title}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex h-full flex-col gap-4 overflow-y-auto">
                  {wishlistItems.length === 0 && (
                    <div className="flex h-40 flex-col items-center justify-center text-neutral-500">
                      <Heart className="mb-2 h-10 w-10 opacity-20" />
                      <p>{t.header.wishlist.empty}</p>
                    </div>
                  )}
                  {wishlistItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 border-b border-neutral-100 pb-4 last:border-0"
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded border border-neutral-200 bg-neutral-100">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-neutral-900">
                          {item.name}
                        </p>
                        <p className="text-sm font-bold text-orange-600">
                          {formatPrice(item.price)}
                        </p>
                        <button
                          onClick={() => removeWishlistItem(item.id)}
                          className="mt-1 text-xs font-medium text-red-500 hover:underline"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            {/* CARRINHO */}
            <CartSheet />

            {/* USER/MINHA CONTA */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 outline-none">
                    <Avatar className="h-9 w-9 cursor-pointer border border-neutral-200 transition-transform hover:scale-105">
                      <AvatarImage src={session.user.image || ""} />
                      <AvatarFallback className="bg-orange-100 font-bold text-orange-700">
                        {session.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-[150] w-56 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
                >
                  <DropdownMenuItem
                    disabled
                    className="mb-1 rounded-md bg-neutral-50 px-3 py-2 font-semibold text-neutral-900 opacity-100"
                  >
                    {session.user.name}
                  </DropdownMenuItem>
                  <Separator className="my-1 bg-neutral-100" />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-sm px-3 py-2 hover:bg-neutral-50"
                    onClick={() => router.push("/minha-conta")}
                  >
                    {t.header.account.myAccount}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-sm px-3 py-2 hover:bg-neutral-50"
                    onClick={() => router.push("/minha-conta/compras")}
                  >
                    {t.header.account.orders}
                  </DropdownMenuItem>
                  <Separator className="my-1 bg-neutral-100" />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-sm px-3 py-2 text-red-600 focus:bg-red-50 focus:text-red-700"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />{" "}
                    {t.header.account.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/authentication">
                <HeaderIconButton icon={User} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// --- EXPORTAR O COMPONENTE PRINCIPAL ENVOLVIDO EM SUSPENSE ---
export function Header() {
  return (
    <Suspense
      fallback={<div className="fixed top-0 z-50 h-[120px] w-full shadow-sm" />}
    >
      <HeaderContent />
    </Suspense>
  );
}
