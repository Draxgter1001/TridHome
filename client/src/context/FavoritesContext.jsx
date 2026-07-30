import { createContext, useContext, useEffect, useState } from "react";
import * as favApi from "../api/favorites";
import { useAuth } from "./AuthContext";

const Ctx = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [listingIds, setListingIds] = useState(new Set());
  const [agencyIds, setAgencyIds] = useState(new Set());

  useEffect(() => {
    if (!user) {
      setListingIds(new Set());
      setAgencyIds(new Set());
      return;
    }
    favApi
      .fetchFavoriteIds()
      .then((d) => {
        setListingIds(new Set(d.listings));
        setAgencyIds(new Set(d.agencies));
      })
      .catch(() => {});
  }, [user]);

  const toggle = async (body) => {
    const { favorited } = await favApi.toggleFavorite(body);
    const [set, setSet, id] = body.listing
      ? [listingIds, setListingIds, body.listing]
      : [agencyIds, setAgencyIds, body.agency];
    const next = new Set(set);
    favorited ? next.add(id) : next.delete(id);
    setSet(next);
    return favorited;
  };

  return (
    <Ctx.Provider value={{ listingIds, agencyIds, toggle }}>{children}</Ctx.Provider>
  );
}

export const useFavorites = () => useContext(Ctx);
