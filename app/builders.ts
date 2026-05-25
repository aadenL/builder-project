export type Builder = {
  _id: string;
  developer: string;
  name: string;
  location: string;
  address: string;
  type: string;
  conStatus: string;
  ceilings: string;
  deposit: string;
  price: number;
  beds: number;
  baths: number;
  garage: number;
  sqft: number;
  desc: string;
  listStatus: string;
  img: string;
  features: string[];
};

export const builders: Builder[] = [
  {
    _id: "1",
    developer: "Fairgate Homes",
    name: "Upper Stouffville",
    location: "Whitchurch-Stouffville, Ontario",
    address: "Baker Hill Boulevard & West Lawn Crescent, L4A 7X3",
    type: "Single Family Home",
    conStatus: "Construction",
    ceilings: "8 feet",
    deposit:
      "Deposit Structure of $200,000: $40,000 with Offer, $40,000 in 30 days, $40,000 in 60 days, $40,000 in 90 days, $40,000 in 120 days",
    price: 2229990,
    beds: 4,
    baths: 4,
    garage: 2,
    sqft: 3553,
    desc: "Luxury detached home with spacious open-concept layout and premium finishes.",
    listStatus: "Selling",
    img: "https://prodlisting.livabl.com/imageSponsors/xlarge/2021_10_13_01_07_07_40_2c_p25_1920.webp",
    features: [
      "Double car garage",
      "Open concept kitchen",
      "Large primary bedroom",
      "Modern exterior",
      "Family-friendly community",
    ],
  },
  {
    _id: "2",
    developer: "Fieldgate Homes",
    name: "Cityside - Phase 3",
    location: "Whitchurch-Stouffville, Ontario",
    address: "York Durham Line & McKean Drive, L4A 0S1",
    type: "Single Family Home",
    conStatus: "Building",
    ceilings: "9+ feet",
    deposit: "none",
    price: 1499990,
    beds: 4,
    baths: 4,
    garage: 2,
    sqft: 3205,
    desc: "Luxury single-family homes featuring premium finishes, high-end construction details, and thoughtfully designed interior and exterior appointments throughout.",
    listStatus: "Selling",
    img: "https://prodlisting.livabl.com/imageSponsors/xlarge/2024_03_01_05_13_21_barkley-b.webp",
    features: [
      "Gas fireplace in family room",
      "Central air/ventilation rough-in with HRV system",
      "Hardwood flooring on main level",
      "Attached garage with insulated steel door",
    ],
  },
  {
    _id: "3",
    developer: "Fairgate Homes",
    name: "William St. Exhibit",
    location: "Whitchurch-Stouffville, Ontario",
    address: "Harold Avenue & William Street, L4A 1B6",
    type: "Single Family Home",
    conStatus: "Complete",
    ceilings: "unknown",
    deposit: "none",
    price: 2349000,
    beds: 4,
    baths: 6,
    garage: 2,
    sqft: 3414,
    desc: "An exclusive collection of luxury 50' single-family homes in Upper Stouffville, offering spacious family-focused living, premium craftsmanship, nearby nature destinations, and convenient access to GO Transit, Highway 404, Richmond Hill, Markham, and Toronto.",
    listStatus: "Selling",
    img: "https://prodlisting.livabl.com/imageSponsors/xlarge/2024_02_20_07_05_38_101.webp",
    features: [
      "Luxury 50' single-family homes",
      "Family-friendly neighbourhood",
      "Close to Bruce's Mill Conservation Area and local nature destinations",
      "Convenient access to GO Transit and Highway 404",
    ],
  },
];
