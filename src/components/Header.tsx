"use client";

import {
  ChevronDown,
  Flame,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sun,
  ThumbsUp,
  Trash2,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { checkAffiliateStatus } from "@/actions/check-affiliate-status";
import { checkStockAvailability } from "@/actions/check-stock";
import { createCheckoutSession } from "@/actions/checkout";
import { getAllCategories } from "@/actions/get-all-categories";
import { searchProductsAction } from "@/actions/search-products";
// IMPORTANTE: Importe o novo componente
import { MobileMenu } from "@/components/mobile-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

// --- INTERFACES LIMPAS ---
interface Category {
  label: string;
  href: string;
}

// Removidas interfaces Game e Streaming

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

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // ESTADOS (Removidos games/streamings)
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAffiliate, setIsAffiliate] = useState(false);

  // PESQUISA
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { data: session } = authClient.useSession();

  const { t, language, setLanguage } = useLanguage();

  const {
    items: cartItems,
    removeItem: removeCartItem,
    updateQuantity,
    getTotalPrice,
  } = useCartStore();

  const { items: wishlistItems, removeItem: removeWishlistItem } =
    useWishlistStore();

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        // Removidas chamadas para getAllGames e getAllStreamings
        const [cats, affStatus] = await Promise.all([
          getAllCategories(),
          checkAffiliateStatus().catch(() => false),
        ]);

        if (Array.isArray(cats)) setCategories(cats);
        setIsAffiliate(affStatus);
      } catch (error) {
        console.error("Erro ao carregar dados do header", error);
      }
    };
    fetchData();
  }, []);

  // ... (Restante do código de estoque, pesquisa e renderização permanece igual)
  // APENAS GARANTINDO QUE O MOBILE MENU NÃO RECEBA PROPS QUE NÃO EXISTEM MAIS

  useEffect(() => {
    const verifyStock = async () => {
      if (cartItems.length === 0) return;
      try {
        const { outOfStockItems } = await checkStockAvailability(
          cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
        );
        if (outOfStockItems.length > 0) {
          outOfStockItems.forEach((item) => removeCartItem(item.id));
          toast.error(`Item removido: ${outOfStockItems[0].name}`);
        }
      } catch (e) {
        console.error(e);
      }
    };
    verifyStock();
  });

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat(language === "pt" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: language === "pt" ? "BRL" : "USD",
    }).format(value / 100);
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.refresh() },
    });
  };

  async function handleCheckout() {
    if (!session) {
      toast.error(
        language === "pt"
          ? "Faça login para continuar."
          : "Please login to continue.",
      );
      router.push("/authentication");
      return;
    }
    try {
      setIsCheckingOut(true);
      const checkoutItems = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));
      const result = await createCheckoutSession(checkoutItems);
      if ("url" in result && result.url) {
        window.location.href = result.url;
      } else if ("success" in result && result.success) {
        toast.success(
          language === "pt" ? "Pedido realizado!" : "Order placed!",
        );
        router.push("/checkout/success");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        language === "pt" ? "Erro ao processar." : "Error processing.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (!mounted) return null;

  return (
    <header className="fixed top-0 z-50 w-full flex-col shadow-sm">
      {/* ... (Barra Laranja igual) ... */}
      <div className="w-full bg-orange-600 px-4 py-2 text-xs font-medium text-white md:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex cursor-pointer items-center gap-1 hover:text-white/80 focus:outline-none">
                  <div className="relative h-3 w-4 overflow-hidden rounded-sm">
                    {language === "pt" ? (
                      <div className="h-full w-full bg-green-600">
                        <div className="mx-auto h-full w-1 bg-yellow-400"></div>
                      </div>
                    ) : (
                      <div className="h-full w-full bg-red-600">
                        <div className="flex h-full w-full flex-col justify-between py-[1px]">
                          <div className="h-[1px] bg-white"></div>
                          <div className="h-[1px] bg-white"></div>
                          <div className="h-[1px] bg-white"></div>
                        </div>
                        <div className="absolute -top-0 -left-0 h-1.5 w-2 bg-blue-700"></div>
                      </div>
                    )}
                  </div>
                  <span>{language === "pt" ? "BR / BRL" : "EN / USD"}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[100px] bg-white text-black">
                <DropdownMenuItem
                  onClick={() => setLanguage("pt")}
                  className="cursor-pointer gap-2"
                >
                  <span>🇧🇷 Português</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className="cursor-pointer gap-2"
                >
                  <span>🇺🇸 English</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <span className="opacity-90">{t.topBar.promo}</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex cursor-pointer items-center gap-1 hover:text-white/80">
              <Sun className="h-3 w-3" />
            </div>
            <div className="hidden h-3 w-[1px] bg-white/30 md:block"></div>
            <Link
              href="#"
              className="hidden items-center gap-1 hover:text-white/80 md:flex"
            >
              <MapPin className="h-3 w-3" /> {t.topBar.storeLocator}
            </Link>
            <div className="hidden h-3 w-[1px] bg-white/30 md:block"></div>
            <Link
              href="#"
              className="flex items-center gap-1 hover:text-white/80"
            >
              {t.topBar.help}
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full border-b border-neutral-200 bg-white px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 lg:gap-8">
          <div className="flex items-center gap-4">
            {/* CORREÇÃO NO MOBILE MENU:
                Removemos as props games={} e streamings={} pois não existem mais.
                Você precisará ir no arquivo mobile-menu.tsx e remover essas props da interface também se der erro lá.
            */}
            <MobileMenu
              categories={categories}
              games={[]} // Passando array vazio para compatibilidade se o componente ainda exigir
              streamings={[]} // Passando array vazio
              isAffiliate={isAffiliate}
            />

            <Link href="/" className="group flex items-center gap-1">
              <span className="font-sans text-2xl font-black tracking-tight text-neutral-900 group-hover:opacity-80">
                ESG Group
              </span>
            </Link>
          </div>

          {/* ... (Resto do Header igual: Barra de Pesquisa, Ícones, etc) ... */}
          {/* Mantenha o código original daqui para baixo, ele está correto */}

          <div className="relative max-w-2xl flex-1" ref={searchRef}>
            <div className="flex h-11 w-full items-center rounded-full border border-neutral-300 bg-neutral-50 transition-all focus-within:border-orange-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
              <button className="hidden h-full items-center gap-2 border-r border-neutral-200 px-4 text-sm font-medium whitespace-nowrap text-neutral-600 hover:text-neutral-900 sm:flex">
                {t.header.allCategories}{" "}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.header.searchPlaceholder}
                className="h-full w-full bg-transparent px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
              <button className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-orange-600">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>

            {showResults && searchQuery.length >= 2 && (
              <div className="animate-in fade-in zoom-in-95 absolute top-14 right-0 left-0 z-50 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl duration-200">
                {searchResults.length > 0 ? (
                  <div className="flex flex-col py-2">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/produto/${product.id}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-100">
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
              href="#"
              className="hidden items-center gap-2 text-neutral-700 hover:text-orange-600 xl:flex"
            >
              <Flame className="h-5 w-5" />
              <span className="text-sm font-bold">{t.header.bestDeals}</span>
            </Link>
            <Link
              href="#"
              className="hidden items-center gap-2 text-neutral-700 hover:text-orange-600 xl:flex"
            >
              <ThumbsUp className="h-5 w-5" />
              <span className="text-sm font-medium">{t.header.sale}</span>
            </Link>

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
                <div className="mt-4 flex flex-col gap-4">
                  {wishlistItems.length === 0 && (
                    <p className="text-center text-neutral-500">
                      {t.header.wishlist.empty}
                    </p>
                  )}
                  {wishlistItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 border-b border-neutral-100 pb-4"
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded bg-neutral-100">
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
                        <p className="line-clamp-1 text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-sm font-bold text-orange-600">
                          {formatPrice(item.price)}
                        </p>
                        <button
                          onClick={() => removeWishlistItem(item.id)}
                          className="mt-1 text-xs text-red-500 hover:underline"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

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
                  className="z-[150] w-56 bg-white"
                >
                  <DropdownMenuItem
                    disabled
                    className="font-medium text-black opacity-100"
                  >
                    {session.user.name}
                  </DropdownMenuItem>
                  <Separator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/minha-conta")}
                  >
                    {t.header.account.myAccount}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/minha-conta/compras")}
                  >
                    {t.header.account.orders}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
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

            <Sheet>
              <SheetTrigger asChild>
                <div>
                  <HeaderIconButton
                    icon={ShoppingBag}
                    badgeCount={cartItems.length}
                  />
                </div>
              </SheetTrigger>
              <SheetContent className="flex h-full flex-col bg-white text-neutral-900 sm:max-w-[400px]">
                <SheetHeader className="border-b border-neutral-100 pb-4">
                  <SheetTitle>{t.header.cart.title}</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  {cartItems.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-neutral-500">
                      <ShoppingBag className="h-12 w-12 opacity-20" />
                      <p>{t.header.cart.empty}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                            {item.image && (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <h4 className="line-clamp-2 text-sm font-medium text-neutral-900">
                                {item.name}
                              </h4>
                              <p className="mt-1 text-sm font-bold text-orange-600">
                                {formatPrice(item.price)}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center rounded border border-neutral-200">
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, "decrease")
                                  }
                                  disabled={item.quantity <= 1}
                                  className="p-1 px-2 hover:bg-neutral-100 disabled:opacity-50"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, "increase")
                                  }
                                  className="p-1 px-2 hover:bg-neutral-100"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => removeCartItem(item.id)}
                                className="text-neutral-400 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {cartItems.length > 0 && (
                  <div className="border-t border-neutral-100 pt-6">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-neutral-600">
                        {t.header.cart.total}
                      </span>
                      <span className="text-xl font-bold text-neutral-900">
                        {formatPrice(getTotalPrice())}
                      </span>
                    </div>
                    <Button
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                      className="h-12 w-full bg-orange-600 text-base font-bold text-white hover:bg-orange-700"
                    >
                      {isCheckingOut ? (
                        <Loader2 className="mr-2 animate-spin" />
                      ) : (
                        t.header.cart.checkout
                      )}
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
