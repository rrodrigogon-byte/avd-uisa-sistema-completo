import { useState, useEffect } from "react";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Star, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Favorite {
  url: string;
  title: string;
  addedAt: number;
}

const FAVORITES_KEY = "avd-uisa-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error("Erro ao carregar favoritos:", e);
      }
    }
  }, []);

  const addFavorite = (url: string, title: string) => {
    const newFavorite: Favorite = {
      url,
      title,
      addedAt: Date.now(),
    };

    const updated = [...favorites.filter((f) => f.url !== url), newFavorite];
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    toast.success("Adicionado aos favoritos");
  };

  const removeFavorite = (url: string) => {
    const updated = favorites.filter((f) => f.url !== url);
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    toast.success("Removido dos favoritos");
  };

  const isFavorite = (url: string) => {
    return favorites.some((f) => f.url === url);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}

export function FavoritesDropdown() {
  const { favorites, removeFavorite } = useFavorites();

  if (favorites.length === 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Star className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Favoritos</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-4 text-sm text-muted-foreground text-center">
            Nenhum favorito ainda.
            <br />
            Clique na estrela em qualquer página para adicionar.
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          {favorites.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {favorites.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Favoritos ({favorites.length})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {favorites.map((fav) => (
            <DropdownMenuItem key={fav.url} className="flex items-center justify-between p-2">
              <Link href={fav.url} className="flex-1 truncate hover:text-primary">
                {fav.title}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(fav.url);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FavoriteButton({ url, title }: { url: string; title: string }) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorite = isFavorite(url);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        if (favorite) {
          removeFavorite(url);
        } else {
          addFavorite(url, title);
        }
      }}
      title={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Star className={favorite ? "h-5 w-5 fill-yellow-400 text-yellow-400" : "h-5 w-5"} />
    </Button>
  );
}
