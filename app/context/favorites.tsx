// This directive makes the file a Client Component. Favorites use localStorage,
// window events, and React browser hooks, none of which are available on the server.
"use client";

import {
    // Creates a shared container that deeply nested components can read.
    createContext,

    // Describes any valid content placed inside FavoritesProvider.
    ReactNode,

    // Reads the closest FavoritesContext.Provider value.
    useContext,

    // Reuses the parsed array until the stored JSON string changes.
    useMemo,

    // Keeps React synchronized with data stored outside React itself.
    useSyncExternalStore,
} from "react";

// This type describes everything components receive from useFavorites().
type FavoritesContextType = {
    // The MongoDB listing IDs currently saved in this browser.
    favorites: string[];

    // Adds an ID when absent or removes it when already saved.
    toggleFavorite: (builderId: string) => void;

    // Answers whether one particular listing ID is currently saved.
    isFavorite: (builderId: string) => boolean;

    // Distinguishes the server's empty snapshot from browser data after hydration.
    isLoaded: boolean;
};

// The default is undefined so useFavorites can detect incorrect usage outside
// FavoritesProvider instead of silently returning a fake empty favorites list.
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// This is the localStorage key. The browser stores data under "favorites".
const FAVORITES_KEY = "favorites";

// This custom browser event notifies React about changes made in the current tab.
const FAVORITES_CHANGED_EVENT = "favorites-changed";

// localStorage only stores strings, so an empty array is represented as JSON text.
const EMPTY_FAVORITES = "[]";

// React calls this function when it wants to subscribe to the external store.
// callback tells useSyncExternalStore that it should request a fresh snapshot.
function subscribeToFavorites(callback: () => void) {
    // Browsers emit a StorageEvent in other open tabs when localStorage changes.
    function handleStorage(event: StorageEvent) {
        // Ignore changes to unrelated localStorage keys. When the favorites key
        // changes, call React's callback so all favorite consumers re-render.
        if (event.key === FAVORITES_KEY) callback();
    }

    // Listen for favorites changes made by another tab on the same website.
    window.addEventListener("storage", handleStorage);

    // Listen for the custom event dispatched by this tab's toggleFavorite().
    window.addEventListener(FAVORITES_CHANGED_EVENT, callback);

    // React calls this cleanup function when it no longer needs the subscription.
    // Removing both listeners prevents duplicate callbacks and memory leaks.
    return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(FAVORITES_CHANGED_EVENT, callback);
    };
}

// useSyncExternalStore calls this in the browser whenever it needs current data.
function getFavoritesSnapshot() {
    // Return the saved JSON string, or "[]" when nothing has been saved yet.
    // A string is used as the snapshot because React can compare strings by value;
    // returning a newly parsed array here would look "new" on every call.
    return localStorage.getItem(FAVORITES_KEY) ?? EMPTY_FAVORITES;
}

// Next.js also renders Client Components on the server for the initial HTML.
function getServerFavoritesSnapshot() {
    // localStorage does not exist on the server, so begin with an empty JSON array.
    // React replaces this snapshot with browser storage during hydration.
    return EMPTY_FAVORITES;
}

// isLoaded needs a subscription function even though hydration never changes
// again after the browser takes control, so this returns an empty cleanup function.
function subscribeToHydration() {
    return () => {};
}

// Wrapping the app with this provider makes favorite data/functions available to
// BuilderCard, FavoriteListings, and any future component that calls useFavorites.
export function FavoritesProvider({ children }: { children: ReactNode }) {
    // Subscribe to localStorage as an external data source. The three arguments are:
    // 1. how to subscribe, 2. how to read in the browser, 3. how to read on the server.
    // This replaces the previous useEffect + setState implementation and avoids
    // triggering an additional synchronous state update immediately after rendering.
    const storedFavorites = useSyncExternalStore(
        subscribeToFavorites,
        getFavoritesSnapshot,
        getServerFavoritesSnapshot,
    );

    // On the server this returns false; once hydrated in a browser it returns true.
    // FavoriteListings uses it to show a loading message instead of briefly showing
    // an incorrect "no favorites" state while browser storage is being restored.
    const isLoaded = useSyncExternalStore(
        subscribeToHydration,
        () => true,
        () => false,
    );

    // Convert the JSON string from localStorage into the string array used by the UI.
    // useMemo avoids parsing it again during renders where the string did not change.
    const favorites = useMemo(() => {
        try {
            // Treat parsed browser data as unknown until its shape is checked.
            const parsed: unknown = JSON.parse(storedFavorites);

            // Accept only an array in which every value is a string listing ID.
            // If a user/extension corrupted localStorage, safely use an empty array.
            return Array.isArray(parsed) && parsed.every((id) => typeof id === "string")
                ? parsed
                : [];
        } catch {
            // JSON.parse throws for malformed text, so invalid data becomes empty.
            return [];
        }
    // Recalculate only when useSyncExternalStore reports a different JSON string.
    }, [storedFavorites]);

    // Called when the heart button receives one listing's string ID.
    function toggleFavorite(builderId: string) {
        // If the ID exists, filter it out. Otherwise copy the current array with
        // the spread operator and append the new ID, without mutating the old array.
        const nextFavorites = favorites.includes(builderId)
            ? favorites.filter((id) => id !== builderId)
            : [...favorites, builderId];

        // Convert the array to JSON because localStorage cannot store arrays directly.
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites));

        // The native storage event only fires in other tabs. Dispatch this custom
        // event so the current tab's subscription also reads the new snapshot.
        window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
    }

    // Return true when this listing ID appears in the current favorites array.
    function isFavorite(builderId: string) {
        return favorites.includes(builderId);
    }

    // Provide the current data and helper functions to every nested component.
    return (
        <FavoritesContext.Provider
            value={{ favorites, toggleFavorite, isFavorite, isLoaded }}
        >
            {children}
        </FavoritesContext.Provider>
    );
}

// This custom hook gives components a concise, correctly typed way to read context.
export function useFavorites() {
    // Read the closest provider value above the calling component in the React tree.
    const context = useContext(FavoritesContext);

    // A missing value means the component was rendered outside FavoritesProvider.
    // Throwing gives the developer a clear configuration error immediately.
    if (!context) {
        throw new Error("useFavorites must be used inside FavoritesProvider");
    }

    // Return all favorites data and helper functions to the calling component.
    return context;
}
