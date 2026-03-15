import { createContext, useContext, useState, ReactNode } from "react";

interface TourSpotlightContextValue {
  spotlightHref: string | null;
  setSpotlightHref: (href: string | null) => void;
}

const TourSpotlightContext = createContext<TourSpotlightContextValue>({
  spotlightHref: null,
  setSpotlightHref: () => {},
});

export function TourSpotlightProvider({ children }: { children: ReactNode }) {
  const [spotlightHref, setSpotlightHref] = useState<string | null>(null);
  return (
    <TourSpotlightContext.Provider value={{ spotlightHref, setSpotlightHref }}>
      {children}
    </TourSpotlightContext.Provider>
  );
}

export function useTourSpotlight() {
  return useContext(TourSpotlightContext);
}
