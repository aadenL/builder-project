"use client";

import {
    // context is a way to share data between components without having to pass it down manually through prop
    // it is a global storage area for a specific part of an app, in this case the favorites page

    // createContext creates a shared storage space that components can access without having to pass 
    // through many diff levels
    createContext,

    // reads data from context 
    useContext,

    // runs code after React renders a component
    useEffect,

    // useState creates a piece of state that React will remember.
    // It returns two things:
    // 1. The current value of the state (favorites)
    // 2. A function to update that value (setFavorites)
    // The initial value is an empty array because there are no favorited builders when the app first loads.
    // When setFavorites is called, React updates the state and re-renders any components that use this value.
    useState,

    // ReactNode is a TypeScript type that represents anything React can render on the screen.
    // This includes:
    // - JSX elements (<div>Hello</div>)
    // - Components (<BuilderCard />)
    // - Strings ("Hello")
    // - Numbers (123)
    // - Arrays of elements
    // - null or undefined
    // In this case, ReactNode is used to type the children prop.
    // The children prop represents whatever components are placed inside the FavoritesProvider component.
    // Example:
    // <FavoritesProvider>
    //    <BuilderCard />
    // </FavoritesProvider>
    //
    // The <BuilderCard /> becomes the "children" value.
    ReactNode,
} from "react";

// creating a TypeScript type that describes what data and functions your favorites context will contain
// any value that is stored in FavoritesContext must have a favorites array, a toggle function, and a checking function.

// creates a custom TypeScript type called FavoritesContextType, defining the shape of an object
type FavoritesContextType = {
    // favorites must be an array of strings because it will contain builder ids which are stored as strings
    favorites: string[];

    // means create a function called toggleFavorite that recieves a builderId and returns nothing. 
    // (builderId: string) means the function takes 1 param that is a string
    // => means the function doesn't return anything, only changes a state
    toggleFavorite: (builderId: string) => void;

    // means create a function called isFavorite that recieves a builderId and returns a boolean. 
    // same thing as earlier for (builderId: string)
    // => means the function returns a boolean
    isFavorite: (builderId: string) => boolean;
    isLoaded: boolean;
};

// creates FavoritesContext and tells TypeScript what kind of data it can store
// createContext creates a shared container where you can put data that many components need
const FavoritesContext = createContext<

    // This context could either contain a FavoritesContextType object or it can be undefined
    FavoritesContextType | undefined

// (undefined) at the end means if there is no value provided, use undefined. The value inside <> is the default value.
>(undefined);

// creating a react component named FavoritesProvider, it wraps other components and gives them access to favorites.
export function FavoritesProvider({
    children,
}: {
    // this means that this component can contain any valid react content
    children: ReactNode;
}) {
    // creates the main data storage
    // useState<string[]>([]) means the state is an array, every item in the array must be a string, and to start with an empty array
    // the initial state is favorites = [], and later it will contain builder ids.
    // setFavorites is the function that changes it to contain builder ids. setFavorites(["builder123"]) will update the favorites array to contain that id
    const [favorites, setFavorites] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    //loads favorites from localStorage when the app starts. This runs when the app first starts up
    useEffect(() => {
        // KSON.parse converts the strings returned from the line inside back to an array
        try {
            const savedFavorites = JSON.parse(
                // get the items under favorites from the browser, returns strings
                localStorage.getItem("favorites") || "[]"
            );

            // Only accept the ID list shape this context expects.
            if (Array.isArray(savedFavorites) && savedFavorites.every((id) => typeof id === "string")) {
                setFavorites(savedFavorites);
            }
        } catch {
            localStorage.removeItem("favorites");
        } finally {
            setIsLoaded(true);
        }

    // the [] means run this once when the component appears
    }, []);

    // saves the React state to the browser
    useEffect(() => {
        // saves whatever changes to favorites were made, so if the user hearted a new property then it will update
        if (!isLoaded) return;

        localStorage.setItem(
            "favorites",
            // localStorage.setItem() saves data in the browser's local storage. The first argument is the key (the name of the storage item).
            // In this case, "favorites" is the label where the data is stored.
            // The second argument is the value that will be saved. 
            // localStorage can only store strings, so JSON.stringify() converts the favorites array into a string before saving.
            // If a "favorites" item already exists, setItem() replaces the old value with the new one.
            JSON.stringify(favorites)
        );
    
    // [favorites] means run this anytime the favorites array changes
    }, [favorites, isLoaded]);

    // handles the clicking of the favorite button
    function toggleFavorite(builderId: string) {
        // prev is designated as the current favorites array
        setFavorites((prev) => {
            // if the builderId is already favorited
            if (prev.includes(builderId)) {
                // remove it
                return prev.filter((id) => id !== builderId);
            }
            
            //if it's not already favorited, the spread operator (...prev) will copy the existing array and add the new id (builderId)
            return [...prev, builderId];
        });
    }

    // checking if the builder is already in the favorites list, returns true or false
    function isFavorite(builderId: string) {
        return favorites.includes(builderId);
    }

    //providing the context, where the info is actually shared
    return (
        // the previously created FavoritesContext container is empty, .Provider inputs info into the container
        <FavoritesContext.Provider
            // any component that uses this context can access these 3 things
            value={{
                // gives components access to favorites, which is the current array of favorite builders
                favorites,
                // gives components access to the function that adds/removes favorite builders
                toggleFavorite,
                // gives components access to the function that checks whether a builder has already been favorited
                isFavorite,
                isLoaded,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    
    if (!context) {
        throw new Error(
            "useFavorites must be used inside FavoritesProvider"
        );
    }

    return context;
}
