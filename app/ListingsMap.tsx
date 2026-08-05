// client component, component must run in the browser
"use client";
import { useEffect, useRef } from "react";

// describes the min listing data needed by the map
type MapListing = {
  _id: string;
  name: string;
  address: string;
  price: number;
  img: string;

  // ?: meaning it might not contain this value
  mapLocation?: {
    // type: "Point" means that the location follows GeoJSON's point format
    type: "Point";
    // stores exactly 2 numbers in GeoJSON order
    coordinates: [number, number];
  };
};

type ListingsMapProps = {
  listings: MapListing[];
  activeListingId: string | null;
  selectedListingId: string | null;
  onMarkerHover: (listingId: string | null) => void;
  onMarkerSelect: (listingId: string | null) => void;
};

// function receives an array of map listings
export default function ListingsMap({
  listings,
  activeListingId,
  selectedListingId,
  onMarkerHover,
  onMarkerSelect,
}: ListingsMapProps) {
  // creates a ref that will point to the map's div
  // HTMLDivElement says which element is expected
  // (null) is the initial value
  const container = useRef<HTMLDivElement>(null);

  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef(new Map<string, import("leaflet").CircleMarker>());

  // runs after React places the map container into the DOM
  useEffect(() => {
    // tracks whether React has already cleaned up this effect
    // matters because loading Leaflet is async, the component could disappear before the import is done
    let cancelled = false;

    // stores the Leaflet map so it can be removed later
    // the import("leaflet").Map references Leaflet's Map TypeScript type w/o loading Leaflet immediately
    let map: import("leaflet").Map | undefined;

    // dynamically load Leaflet in the browser
    async function createMap() {
      // L provides:
      /**
       * L.map()
       * L.tileLayer()
       * L.latLng()
       * L.circleMarker()
       * L.latLngBounds()
       */
      const L = await import("leaflet");

      // stops map creation if the effect has been cleaned up
      // or the map container does not exist
      if (cancelled || !container.current) {
        return;
      }

      // creates a map centered in Southern Ontario
      // Leaflet accepts coordinates in [latitude, longitude]
      // 8 is the zoom level
      const leafletMap = L.map(container.current).setView([43.7, -79.4], 8);

      mapRef.current = leafletMap;
      markersRef.current.clear();

      // saves the map for effect cleanup
      // effect cleanup for Leaflet is needed because Leaflet directly creates things that React doesn't know how to remove
      map = leafletMap;

      // adds OpenStreetMap's visual tiles
      // Leaflet replaces {z} with zoom, {x} with horizontal tile, {y} with vertical tile
      // a web map is loaded as many small square images called map tiles instead of one big picture
      // {z} identifies the zoom level, as zoom increases more tiles are required to cover the world
      // {x} identifies the tile's horizontal column, the value increases as you move east
      // {y} identifies the tile's vertical row, the value increases as you move south
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        // maxZoom: 19 allows zoom levels up to 19
        maxZoom: 19,

        // displays the attribution required when using OpenStreetMap data
        attribution: `&copy <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`,

        // adds the tile layer to the map
      }).addTo(leafletMap);

      // creates an initially empty geographic boundary
      // every valid marker is added to it, later Leaflet adjusts the map so all markers are visible
      const bounds = L.latLngBounds([]);

      // runs the callback once for each listing
      listings.forEach((listing) => {
        // skips listings that don't have coordinates
        // because this is inside forEach, return only skips the current listing
        if (!listing.mapLocation) {
          return;
        }

        // reads the GeoJSON (coordinates) values in the stored order
        const [longitude, latitude] = listing.mapLocation.coordinates;

        // skips invalid numeric values like (NaN, Infinity, -Infinity)
        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
          return;
        }

        // reverses GeoJSON's coordinate order because Leaflet expects latitude, longitude
        const point = L.latLng(latitude, longitude);

        // expands the bound so it includes this marker
        // after all listings are processed, bounds represents the area containing every marker
        bounds.extend(point);

        // creates a marker at the listing location
        const marker = L.circleMarker(point, {
          // set radius to 8 px
          radius: 8,
          // border color is white
          color: "#ffffff",
          // border is 2px wide
          weight: 2,
          // fill color is teal
          fillColor: "#0f766e",
          // fill color is 100%
          fillOpacity: 1,
        });

        // add the marker to the map
        marker.addTo(leafletMap);

        markersRef.current.set(listing._id, marker);

        // creates a DOM container for the marker popup
        // a DOM container is an HTML element in the browser that holds other elements or content
        const popup = document.createElement("div");
        popup.style.width = "220px";

        // creates the listing image displayed at the top of the popup
        const image = document.createElement("img");
        image.src = listing.img;
        image.alt = listing.name;
        image.loading = "lazy";
        image.style.display = "block";
        image.style.width = "100%";
        image.style.height = "130px";
        image.style.marginBottom = "10px";
        image.style.borderRadius = "6px";
        image.style.objectFit = "cover";

        // remove a broken image instead of displaying the browser's broken-image icon
        image.addEventListener("error", () => image.remove());

        // creates a clickable link
        const listingLink = document.createElement("a");

        // links to the listing detail's page
        listingLink.href = `/builders/${listing._id}`;
        // displays the listing name
        listingLink.textContent = listing.name;
        // makes the name bold
        listingLink.style.fontWeight = "700";
        listingLink.style.display = "block";

        // adds the listing's street address below its name
        const address = document.createElement("p");
        address.textContent = listing.address;
        address.style.margin = "4px 0 0";
        address.style.color = "#64748b";
        address.style.fontSize = "13px";

        // adds the price, creates a paragraph
        const price = document.createElement("p");
        // formats the price as Canadian currency
        price.textContent = `Starting at ${listing.price.toLocaleString(
          "en-CA",
          {
            style: "currency",
            currency: "CAD",
            maximumFractionDigits: 0,
          },
        )}`;
        price.style.margin = "4px 0 0";

        // adds the image and listing information to the popup container
        popup.append(image, listingLink, address, price);
        // connects the popup to the marker, click to open
        marker.bindPopup(popup, {
          maxWidth: 240,
        });

        // tracks whether the popup was clicked so moving the pointer away
        // does not immediately close a popup the user chose to keep open
        let clicked = false;
        let closeTimer: ReturnType<typeof setTimeout> | undefined;

        // stop a scheduled close when the cursor reaches the marker or popup
        function cancelClose() {
          if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = undefined;
          }
        }

        // wait briefly so the cursor has time to move from the marker to the popup
        function scheduleClose() {
          cancelClose();

          closeTimer = setTimeout(() => {
            if (!clicked) {
              marker.closePopup();
              onMarkerHover(null);
            }
          }, 250);
        }

        // temporarily show the popup when the marker is hovered
        marker.on("mouseover", () => {
          cancelClose();
          onMarkerHover(listing._id);
          marker.openPopup();
        });

        // schedule closing instead of making the popup disappear immediately
        marker.on("mouseout", () => {
          scheduleClose();
        });

        // keep the popup open while the cursor is over its content
        popup.addEventListener("mouseenter", cancelClose);
        popup.addEventListener("mouseleave", scheduleClose);

        // clicking pins the popup open
        marker.on("click", () => {
          cancelClose();
          clicked = true;
          onMarkerSelect(listing._id);
          marker.openPopup();
        });

        // reset the pinned state when Leaflet closes the popup
        marker.on("popupclose", () => {
          cancelClose();
          clicked = false;
        });

        // clear any remaining timer if Leaflet removes this marker
        marker.on("remove", cancelClose);
      });

      // checks if at least one valid marker was added
      if (bounds.isValid()) {
        // adjusts the map so every marker is visible
        // if there are no valid markers, the map keeps its initial Ontario view
        leafletMap.fitBounds(bounds, {
          // leaves 32 pixels around the markers
          padding: [32, 32],
          // prevents one marker from being zoomed in too closely
          maxZoom: 14,
        });
      }
    }

    // calls the async function
    // void intentionally ignores its returned Promise because useEffect cannot itself return a Promise
    void createMap();

    // React runs this when the component is removed or listings changes and the effect must rerun
    return () => {
      // stops an unfinished async setup
      cancelled = true;

      markersRef.current.clear();
      mapRef.current = null;

      // removes the Leaflet map and the event listeneres if it was created
      map?.remove();
    };
    // recreates the map whenever the listings array changes
    // [listings] is a dependancy array
  }, [listings]);

  useEffect(() => {
    // Return every marker to its normal appearance.
    markersRef.current.forEach((marker) => {
      marker.setRadius(8);

      marker.setStyle({
        color: "#ffffff",
        weight: 2,
        fillColor: "#0f766e",
        fillOpacity: 1,
      });
    });

    if (!activeListingId) {
      mapRef.current?.closePopup();
      return;
    }

    const activeMarker = markersRef.current.get(activeListingId);

    if (!activeMarker) {
      return;
    }

    // Highlight the marker matching the active card.
    activeMarker.setRadius(11);

    activeMarker.setStyle({
      color: "#ffffff",
      weight: 3,
      fillColor: "#14b8a6",
      fillOpacity: 1,
    });

    activeMarker.openPopup();

    // Only move the map after a click, not every hover.
    if (selectedListingId === activeListingId) {
      mapRef.current?.panTo(activeMarker.getLatLng(), {
        animate: true,
      });
    }
  }, [activeListingId, selectedListingId]);

  // connects the DOM element to the container.current
  return (
    <div
      ref={container}
      className="h-full min-h-[26rem] w-full border-l border-border lg:min-h-0"
      aria-label="Map showing property listings"
    />
  );
}
