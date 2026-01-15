"use client";

import {
  ChevronDown,
  DollarSign,
  Heart,
  Loader2,
  LogIn,
  LogOut,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
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
import { getAllGames } from "@/actions/get-all-games";
import { getAllStreamings } from "@/actions/get-all-streamings";
// IMPORTANTE: Importe a action que criamos no Passo 1
import { searchProductsAction } from "@/actions/search-products";
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
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

// --- BOTÃO SIMPLIFICADO ---
function HeaderIconButton({
  icon: Icon,
  onClick,
  badgeCount,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  onClick?: () => void;
  badgeCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
    >
      <Icon className="h-4 w-4" />
      {!!badgeCount && badgeCount > 0 && (
        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D00000] text-[10px] font-bold text-white shadow-sm">
          {badgeCount}
        </div>
      )}
    </button>
  );
}

// Componente simples para Links
function HeaderLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium text-neutral-400 transition-colors hover:text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

// --- COMPONENTE PRINCIPAL ---

export function Header() {
  const [isHidden, setIsHidden] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // ESTADOS DE DADOS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [games, setGames] = useState<any[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [streamings, setStreamings] = useState<any[]>([]);
  const [isLoadingStreamings, setIsLoadingStreamings] = useState(true);

  // NOVO: Estado de Afiliado
  const [isAffiliate, setIsAffiliate] = useState(false);

  // --- NOVOS ESTADOS PARA A BARRA DE PESQUISA ---
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

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
        setIsLoadingCategories(true);
        const cats = await getAllCategories();
        if (Array.isArray(cats)) setCategories(cats);
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
      } finally {
        setIsLoadingCategories(false);
      }

      try {
        setIsLoadingGames(true);
        const gms = await getAllGames();
        if (Array.isArray(gms)) setGames(gms);
      } catch (error) {
        console.error("Erro ao buscar jogos:", error);
      } finally {
        setIsLoadingGames(false);
      }

      try {
        setIsLoadingStreamings(true);
        const strms = await getAllStreamings();
        if (Array.isArray(strms)) setStreamings(strms);
      } catch (error) {
        console.error("Erro ao buscar streamings:", error);
      } finally {
        setIsLoadingStreamings(false);
      }

      try {
        const status = await checkAffiliateStatus();
        setIsAffiliate(status);
      } catch (error) {
        console.error("Erro ao verificar afiliado:", error);
      }
    };

    fetchData();
  }, [session]);

  useEffect(() => {
    const verifyStock = async () => {
      if (cartItems.length === 0) return;
      try {
        const { outOfStockItems } = await checkStockAvailability(
          cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
        );

        if (outOfStockItems.length > 0) {
          outOfStockItems.forEach((item) => removeCartItem(item.id));
          toast.error(
            `Item removido por falta de estoque: ${outOfStockItems[0].name}`,
          );
        }
      } catch (e) {
        console.error(e);
      }
    };

    verifyStock();
  }, []);

  // --- LÓGICA DE PESQUISA (DEBOUNCE) ---
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
    }, 500); // Espera 500ms após o usuário parar de digitar

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Fechar resultados ao clicar fora
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.refresh();
        },
      },
    });
  };

  async function handleCheckout() {
    if (!session) {
      toast.error("Você precisa estar logado para finalizar a compra.");
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
        toast.success("Pedido realizado com sucesso!");
        router.push("/checkout/success");
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao processar o pedido. Tente novamente.");
      }
    } finally {
      setIsCheckingOut(false);
    }
  }

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsHidden(false);
        lastScrollY = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex w-full flex-col transition-all duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)]">
      {/* --- RETÂNGULO 1: BARRA SUPERIOR --- */}
      <div
        className={cn(
          "w-full overflow-hidden bg-black/30 backdrop-blur-lg transition-all duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)]",
          isHidden
            ? "pointer-events-none max-h-0 border-b-0 opacity-0"
            : "max-h-24 border-b border-white/10 opacity-100",
        )}
      >
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          {/* Logo Grande */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 duration-300 hover:scale-105"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg">
                <Image
                  src="/images/icons/logo.png"
                  alt="Logo Sub Mind"
                  width={150}
                  height={150}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-clash-display text-xl font-semibold text-white">
                SubMind
              </span>
            </Link>
          </div>

          {/* Navegação Principal */}
          <nav className="hidden items-center gap-8 md:flex">
            {/* CATEGORIAS */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex cursor-pointer items-center gap-1 text-sm font-medium text-neutral-400 transition-colors hover:text-white focus:outline-none data-[state=open]:text-white">
                  Categorias
                  <ChevronDown className="h-4 w-4 duration-300 group-hover:-rotate-90 group-data-[state=open]:-rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="z-[100] w-48 border-white/10 bg-black/80 text-white backdrop-blur-xl"
              >
                {isLoadingCategories ? (
                  <DropdownMenuItem disabled className="opacity-50">
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />{" "}
                    Carregando...
                  </DropdownMenuItem>
                ) : categories.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  categories.map((category: any, index: number) => (
                    <DropdownMenuItem
                      key={index}
                      className="cursor-pointer focus:bg-white/10 focus:text-white"
                    >
                      <Link href={category.href || "#"} className="w-full">
                        {category.label}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    Nenhuma categoria
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* JOGOS */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex cursor-pointer items-center gap-1 text-sm font-medium text-neutral-400 transition-colors hover:text-white focus:outline-none data-[state=open]:text-white">
                  Jogos
                  <ChevronDown className="h-4 w-4 duration-300 group-hover:-rotate-90 group-data-[state=open]:-rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="z-[100] w-48 border-white/10 bg-black/80 text-white backdrop-blur-xl"
              >
                {isLoadingGames ? (
                  <DropdownMenuItem disabled className="opacity-50">
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />{" "}
                    Carregando...
                  </DropdownMenuItem>
                ) : games.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  games.map((game: any, index: number) => (
                    <DropdownMenuItem
                      key={index}
                      className="cursor-pointer focus:bg-white/10 focus:text-white"
                    >
                      <Link href={game.href || "#"} className="w-full">
                        {game.label}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    Nenhum jogo cadastrado
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* STREAMINGS */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex cursor-pointer items-center gap-1 text-sm font-medium text-neutral-400 transition-colors hover:text-white focus:outline-none data-[state=open]:text-white">
                  Streamings
                  <ChevronDown className="h-4 w-4 duration-300 group-hover:-rotate-90 group-data-[state=open]:-rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="z-[100] w-48 border-white/10 bg-black/80 text-white backdrop-blur-xl"
              >
                {isLoadingStreamings ? (
                  <DropdownMenuItem disabled className="opacity-50">
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />{" "}
                    Carregando...
                  </DropdownMenuItem>
                ) : streamings.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  streamings.map((stream: any, index: number) => (
                    <DropdownMenuItem
                      key={index}
                      className="cursor-pointer focus:bg-white/10 focus:text-white"
                    >
                      <Link href={stream.href || "#"} className="w-full">
                        {stream.label}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>Nenhum streaming</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {isAffiliate ? (
              <HeaderLink href="/afiliados/painel">Painel Afiliado</HeaderLink>
            ) : (
              <HeaderLink href="/afiliados">Seja Afiliado</HeaderLink>
            )}
          </nav>

          {/* Área de Autenticação e Ícones */}
          <div className="flex items-center gap-3">
            {!isPending && session ? (
              <>
                <Sheet>
                  <SheetTrigger asChild>
                    <div>
                      <HeaderIconButton
                        icon={Heart}
                        badgeCount={wishlistItems.length}
                      />
                    </div>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="z-[150] w-full border-l border-white/10 bg-[#050505]/95 p-0 text-white backdrop-blur-xl sm:max-w-[400px]"
                  >
                    <SheetHeader className="border-b border-white/10 p-6">
                      <SheetTitle className="font-clash-display text-xl font-medium text-white">
                        Meus Favoritos
                      </SheetTitle>
                    </SheetHeader>

                    {wishlistItems.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-neutral-500">
                        <Heart className="h-10 w-10 opacity-20" />
                        <p>Sua lista de favoritos está vazia.</p>
                        <SheetTrigger asChild>
                          <Link href="/">
                            <Button
                              variant="outline"
                              className="mt-4 border-white/10 text-white hover:bg-white/5"
                            >
                              Ver Produtos
                            </Button>
                          </Link>
                        </SheetTrigger>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col overflow-y-auto p-6">
                        <div className="flex flex-col gap-4">
                          {wishlistItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4 border-b border-white/5 pb-4 last:border-0"
                            >
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5">
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Heart className="h-6 w-6 text-neutral-600" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-1 flex-col gap-1">
                                <Link
                                  href={`/produto/${item.id}`}
                                  className="hover:underline"
                                >
                                  <h4 className="line-clamp-1 text-sm font-medium text-white">
                                    {item.name}
                                  </h4>
                                </Link>
                                <p className="font-mono text-xs text-[#D00000]">
                                  {formatPrice(item.price)}
                                </p>
                              </div>
                              <button
                                onClick={() => removeWishlistItem(item.id)}
                                className="p-2 text-neutral-500 transition-colors hover:text-white"
                                title="Remover dos favoritos"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>

                <Sheet>
                  <SheetTrigger asChild>
                    <div>
                      <HeaderIconButton
                        icon={ShoppingCart}
                        badgeCount={cartItems.length}
                      />
                    </div>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="z-[150] flex h-full w-full flex-col border-l border-white/10 bg-[#050505]/95 p-0 text-white backdrop-blur-xl sm:max-w-[400px]"
                  >
                    <SheetHeader className="border-b border-white/10 p-6">
                      <SheetTitle className="font-clash-display text-xl font-medium text-white">
                        Meu Carrinho
                      </SheetTitle>
                    </SheetHeader>

                    {cartItems.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-neutral-500">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                          <ShoppingCart className="h-10 w-10 opacity-30" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-white">
                            Seu carrinho está vazio
                          </p>
                          <p className="text-sm">
                            Parece que você ainda não adicionou nada.
                          </p>
                        </div>
                        <SheetTrigger asChild>
                          <Link href="/">
                            <Button
                              variant="outline"
                              className="mt-4 border-white/10 text-white hover:bg-white/5"
                            >
                              Ver Produtos
                            </Button>
                          </Link>
                        </SheetTrigger>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 overflow-y-auto p-6">
                          <div className="flex flex-col gap-6">
                            {cartItems.map((item) => (
                              <div key={item.id} className="flex gap-4">
                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5">
                                  {item.image ? (
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <ShoppingBag className="h-6 w-6 text-neutral-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-1 flex-col justify-between">
                                  <div className="space-y-1">
                                    <h4 className="line-clamp-2 text-sm font-medium text-white">
                                      {item.name}
                                    </h4>
                                    <p className="font-mono text-sm font-bold text-[#D00000]">
                                      {formatPrice(item.price)}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex h-8 items-center rounded-md border border-white/10 bg-white/5">
                                      <button
                                        onClick={() =>
                                          updateQuantity(item.id, "decrease")
                                        }
                                        className="flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-white disabled:opacity-50"
                                        disabled={item.quantity <= 1}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <span className="min-w-[1.5rem] text-center text-xs font-medium">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateQuantity(item.id, "increase")
                                        }
                                        className="flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-white"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => removeCartItem(item.id)}
                                      className="p-2 text-neutral-500 transition-colors hover:text-red-500"
                                      title="Remover item"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="border-t border-white/10 bg-[#050505] p-6 pb-8">
                          <div className="mb-4 flex items-center justify-between">
                            <span className="text-neutral-400">Total</span>
                            <span className="font-mono text-xl font-bold text-white">
                              {formatPrice(getTotalPrice())}
                            </span>
                          </div>
                          <Button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="h-12 w-full bg-[#D00000] text-base font-bold text-white shadow-[0_0_20px_rgba(208,0,0,0.2)] hover:bg-[#a00000] disabled:opacity-70"
                          >
                            {isCheckingOut ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              "Finalizar Compra"
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </SheetContent>
                </Sheet>

                <Sheet>
                  <SheetTrigger asChild>
                    <button className="group flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 pr-2 pl-1 transition-all hover:border-white/20 hover:bg-white/10 active:scale-95">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={session.user.image || ""} />
                        <AvatarFallback className="bg-[#D00000] text-[10px] font-bold text-white">
                          {session.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-3 w-3 text-neutral-400 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="z-[150] w-full border-l border-white/10 bg-[#050505]/95 p-0 text-white backdrop-blur-xl sm:max-w-[30vw]"
                  >
                    <SheetHeader className="p-6 pb-2 text-left">
                      <SheetTitle className="font-clash-display text-2xl font-medium tracking-wide text-white">
                        Minha Conta
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex h-full flex-col gap-6 p-6 pt-2">
                      <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4">
                        <Avatar className="h-14 w-14 border border-white/10">
                          <AvatarImage src={session.user.image || ""} />
                          <AvatarFallback className="bg-[#D00000] text-lg font-bold text-white">
                            {session.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-clash-display truncate text-lg font-medium text-white">
                            {session.user.name}
                          </span>
                          <span className="font-montserrat truncate text-xs text-neutral-400">
                            {session.user.email}
                          </span>
                        </div>
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="flex flex-col gap-2">
                        <Link href="/minha-conta/favoritos" className="w-full">
                          <Button
                            variant="ghost"
                            className="h-12 w-full justify-start gap-3 text-neutral-300 hover:bg-white/5 hover:text-white"
                          >
                            <Heart className="h-5 w-5" /> Meus Favoritos
                          </Button>
                        </Link>
                        <Link href="/minha-conta/compras" className="w-full">
                          <Button
                            variant="ghost"
                            className="h-12 w-full justify-start gap-3 text-neutral-300 hover:bg-white/5 hover:text-white"
                          >
                            <ShoppingCart className="h-5 w-5" /> Meus Pedidos
                          </Button>
                        </Link>
                        {isAffiliate && (
                          <Link href="/afiliados/painel" className="w-full">
                            <Button
                              variant="ghost"
                              className="h-12 w-full justify-start gap-3 text-neutral-300 hover:bg-white/5 hover:text-white"
                            >
                              <DollarSign className="h-5 w-5" /> Painel de
                              Afiliado
                            </Button>
                          </Link>
                        )}
                      </div>
                      <div className="flex-1"></div>
                      <Button
                        onClick={handleSignOut}
                        className="mb-10 h-12 w-full gap-2 border border-red-900/30 bg-[#1a0505] text-red-500 hover:bg-[#330606] hover:text-red-400"
                      >
                        <LogOut className="h-4 w-4" /> Sair da conta
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/authentication"
                  className="hidden items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white md:flex"
                >
                  <LogIn className="h-4 w-4" /> Entrar
                </Link>
                <Link href="/authentication">
                  <Button className="h-9 rounded-full bg-white px-5 text-sm font-medium text-black hover:bg-neutral-200">
                    Criar Conta
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- RETÂNGULO 2: BARRA INFERIOR --- */}
      <div className="relative w-full border-b border-white/10 bg-black/30 px-4 backdrop-blur-lg transition-all duration-300 md:px-8">
        <div className="mx-auto grid h-14 max-w-7xl grid-cols-3 items-center">
          <div className="flex justify-start">
            <div
              className={cn(
                "flex items-center overflow-hidden transition-all duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)]",
                isHidden ? "w-40 opacity-100" : "w-0 opacity-0",
              )}
            >
              <Link
                href="/"
                className="flex items-center gap-2 whitespace-nowrap duration-300 hover:scale-105"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg">
                  <Image
                    src="/images/icons/logo.png"
                    alt="Logo Mini"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="font-clash-display text-lg font-semibold text-white">
                  SubMind
                </span>
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <nav className="hidden items-center gap-6 lg:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex cursor-pointer items-center gap-1 text-sm font-medium text-neutral-400 transition-colors hover:text-white focus:outline-none data-[state=open]:text-white">
                    Conta
                    <ChevronDown className="h-4 w-4 duration-300 group-hover:-rotate-90 group-data-[state=open]:-rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="z-[100] w-48 border-white/10 bg-black/80 text-white backdrop-blur-xl"
                >
                  {[
                    { label: "Minha conta", href: "/minha-conta" },
                    { label: "Minhas Compras", href: "/minha-conta/compras" },
                    { label: "Favoritos", href: "/minha-conta/favoritos" },
                    { label: "Carrinho", href: "/minha-conta/carrinho" },
                    { label: "Admin", href: "/admin" },
                  ].map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      className="cursor-pointer focus:bg-white/10 focus:text-white"
                    >
                      <Link href={item.href} className="w-full">
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <HeaderLink
                href="https://discord.com/invite/RTahhx6Pvp"
                className="text-neutral-400"
              >
                Discord
              </HeaderLink>
              <HeaderLink href="/faq" className="text-neutral-400">
                FAQ
              </HeaderLink>
              <HeaderLink href="/avaliacoes" className="text-neutral-400">
                Avaliações
              </HeaderLink>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex cursor-pointer items-center gap-1 text-sm font-medium text-neutral-400 transition-colors hover:text-white focus:outline-none data-[state=open]:text-white">
                    Empresa
                    <ChevronDown className="h-4 w-4 duration-300 group-hover:-rotate-90 group-data-[state=open]:-rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="z-[100] w-48 border-white/10 bg-black/80 text-white backdrop-blur-xl"
                >
                  {[
                    { label: "Sobre Nós", href: "/sobre" },
                    { label: "Contato", href: "/contato" },
                    { label: "Termos de Uso", href: "/termos" },
                    { label: "Política de Privacidade", href: "/privacidade" },
                  ].map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      className="cursor-pointer focus:bg-white/10 focus:text-white"
                    >
                      <Link href={item.href} className="w-full">
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          {/* COLUNA 3: DIREITA (Barra de Pesquisa ATUALIZADA) */}
          <div className="flex justify-end">
            <div
              className="relative w-full max-w-[280px] transition-all duration-300 md:w-[240px] lg:w-[280px]"
              ref={searchRef}
            >
              <div className="relative">
                {isSearching ? (
                  <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-500" />
                ) : searchQuery.length > 0 ? (
                  <X
                    className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 cursor-pointer text-neutral-500 hover:text-white"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowResults(false);
                    }}
                  />
                ) : (
                  <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500 transition-colors group-focus-within:text-white" />
                )}
                <input
                  type="text"
                  placeholder="O que você procura?"
                  className="h-9 w-full rounded-full border border-white/10 bg-white/5 pr-10 pl-4 text-sm text-white placeholder:text-neutral-600 focus:border-white/20 focus:bg-white/10 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowResults(true);
                  }}
                />
              </div>

              {/* DROPDOWN DE RESULTADOS */}
              {showResults && searchQuery.length >= 2 && (
                <div className="absolute top-12 left-0 z-50 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] shadow-xl">
                  {searchResults.length > 0 ? (
                    <div className="flex flex-col">
                      {searchResults.map((product) => {
                        const finalPrice =
                          product.discountPrice || product.price;
                        return (
                          <Link
                            key={product.id}
                            href={`/produto/${product.id}`}
                            className="flex items-center gap-3 border-b border-white/5 p-3 transition-colors last:border-0 hover:bg-white/5"
                            onClick={() => setShowResults(false)}
                          >
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-white/5">
                              {product.images && product.images[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <ShoppingBag className="h-4 w-4 text-neutral-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-1 flex-col overflow-hidden">
                              <span className="truncate text-sm font-medium text-white">
                                {product.name}
                              </span>
                              <span className="text-xs font-bold text-[#D00000]">
                                {finalPrice === 0
                                  ? "Gratuito"
                                  : formatPrice(finalPrice)}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-neutral-500">
                      Nenhum produto encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
