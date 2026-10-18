export interface FounderSection {
  title: string;
  content: string[];
  bullets?: string[];
}

export interface FounderPhoto {
  url: string;
  caption: string;
  location: string;
}

export interface Founder {
  slug: string;
  name: string;
  role: "Founder";
  tagline: string;
  machine: string;
  photo: string;
  shortBio: string;
  stats: { label: string; value: string }[];
  headline: string;
  intro: string[];
  sections: FounderSection[];
  quote: string;
  expeditionPhotos: FounderPhoto[];
}

export const FOUNDERS: Founder[] = [
  {
    slug: "nagendra",
    name: "Rider VNB",
    role: "Founder",
    tagline: "Almost a Decade on the Road · 90% of India Explored",
    machine: "Royal Enfield Himalayan 450",
    photo: "https://assets.motobharat.co/about-us/vnb_01.jpg",
    shortBio: "With nearly a decade of riding experience, VNB has explored approximately 90% of India, covering diverse landscapes, challenging mountain roads, and long-distance highways.",
    stats: [
      { label: "India Explored", value: "~90%" },
      { label: "Riding Experience", value: "Nearly 10 Years" },
      { label: "Himalayan Expeditions", value: "2x Ladakh" },
      { label: "Endurance Milestone", value: "1,400 km / 24h" },
    ],
    headline: "Almost a Decade on the Road. 90% of India Explored. One Passion — Motorcycling.",
    intro: [
      "Rider VNB is one of the founding members of Moto Bharat, a Warangal-based riders community built around the passion for motorcycling, exploration, and brotherhood. With nearly a decade of riding experience, VNB has explored approximately 90% of India, covering diverse landscapes, challenging mountain roads, long-distance highways, and unforgettable riding destinations.",
    ],
    sections: [
      {
        title: "The Journey",
        content: [
          "VNB's riding journey began with the Yamaha YZF-R15, a motorcycle that became a trusted companion for years of exploration. After acquiring his own R15 in 2018, he continued riding it on numerous journeys until 2024. In May 2024, he upgraded to the Royal Enfield Himalayan 450, opening a new chapter of long-distance touring and Himalayan adventures.",
        ],
      },
      {
        title: "Major Expeditions",
        content: [
          "Over the years, VNB has completed major expeditions across the country:",
        ],
        bullets: [
          "2024 — Leh–Ladakh: Completed his first major Himalayan expedition, exploring the breathtaking landscapes of Ladakh.",
          "January 2025 — South India: Completed an extensive journey covering Telangana, Andhra Pradesh, Karnataka, Tamil Nadu, and Kerala.",
          "November 2025 — Northeast India: Completed a 40-day expedition through Northeast India, experiencing its diverse terrain, roads, and cultures.",
          "May–June 2026 — Leh–Ladakh: Returned to the Himalayas for a second major Ladakh expedition, completing an extensive 30-day overland journey by road.",
        ],
      },
      {
        title: "Endurance & Riding Experience",
        content: [
          "Beyond these major expeditions, VNB has participated in numerous local rides, night rides, and group rides, including multiple riding trips with fellow motorcyclists from Bengaluru towards Kerala.",
          "Among his most notable achievements are completing two major Leh–Ladakh expeditions, exploring South India and Northeast India, and undertaking extreme long-distance rides. His endurance riding experience includes covering 1,400 km in a single 24-hour period and completing another ride of approximately 1,200 km in a day.",
          "With extensive touring experience, full riding gear, and a strong understanding of long-distance motorcycle travel, VNB believes that every ride is an opportunity to learn, explore, and grow.",
        ],
      },
      {
        title: "The Moto Bharat Vision",
        content: [
          "For VNB, motorcycling is more than just travelling on two wheels — it is about freedom, discovery, discipline, and the connections built along the way.",
          "As a Founder and Admin of Moto Bharat, he aims to bring riders together, encourage responsible riding, promote road safety, and inspire more people to explore India, one ride at a time.",
          "Moto Bharat — Exploring India, One Ride at a Time.",
        ],
      },
    ],
    quote: "“Motorcycling is more than just travelling on two wheels — it is about freedom, discovery, discipline, and the connections built along the way. Moto Bharat — Exploring India, One Ride at a Time.”",
    expeditionPhotos: [
      {
        url: "https://assets.motobharat.co/about-us/vnb_01.jpg",
        caption: "Rider VNB — Founder, Moto Bharat",
        location: "Warangal, Telangana",
      },
      {
        url: "https://assets.motobharat.co/about-us/vnb_02.jpg",
        caption: "Overland Himalayan expedition on Royal Enfield Himalayan 450",
        location: "Leh–Ladakh",
      },
      {
        url: "https://assets.motobharat.co/about-us/vnb_03.jpg",
        caption: "1,400 KM in 24 Hours: Extreme endurance highway touring",
        location: "South India Highway Corridor",
      },
      {
        url: "https://assets.motobharat.co/about-us/vnb_04.jpg",
        caption: "40-Day Northeast India expedition through diverse terrain and cultures",
        location: "Northeast India",
      },
      {
        url: "https://assets.motobharat.co/about-us/vnb_05.jpg",
        caption: "High-altitude mountain passes and endurance touring",
        location: "Himalayas",
      },
    ],
  },
  {
    slug: "akhil",
    name: "Akhil Sanchari",
    role: "Founder",
    tagline: "From Telangana to the Northeast · A Journey of Adventure & Community",
    machine: "Long-Distance Touring Explorer",
    photo: "https://assets.motobharat.co/about-us/akh_01.jpg",
    shortBio: "Turning a passion for motorcycle travel into an inspiring journey across India — from South India, Spiti Valley, and the Northeast to building Warangal's riding community.",
    stats: [
      { label: "Northeast Expeditions", value: "7 States" },
      { label: "Himalayas", value: "Spiti Valley" },
      { label: "Coastline", value: "Murudeshwar & Goa" },
      { label: "Community Base", value: "Warangal" },
    ],
    headline: "From Telangana to the Northeast — A Journey of Adventure, Exploration and Community Building",
    intro: [
      "Akhil Sanchari, a travel creator and motovlogger from Warangal, Telangana, is turning his passion for motorcycle travel into an inspiring journey across India. From South India and the Northeast to Spiti Valley, Maharashtra, Goa, and parts of Karnataka, his adventures reflect a spirit of exploration and determination. Alongside his travels, he has also taken an initiative to bring motorcycle enthusiasts together through Moto Bharat, a riding community started in Warangal.",
    ],
    sections: [
      {
        title: "From a Regular Job to the Open Roads",
        content: [
          "Akhil Sanchari’s journey began with a simple realisation: there is a much bigger world beyond the boundaries of everyday life. After spending two years in a job, he started looking at life from a different perspective and wanted to explore the world beyond his familiar surroundings.",
          "His passion for motorcycles and travel gradually encouraged him to take long-distance rides, discover new destinations, and document his experiences through motovlogs and social media content.",
          "For Akhil, motorcycle travel is not just about reaching a destination. It is about experiencing different cultures, overcoming challenges, meeting new people, and collecting memories along the way.",
        ],
      },
      {
        title: "Exploring South India and the Northeast",
        content: [
          "Akhil has completed motorcycle journeys across South India and explored several destinations known for their natural beauty and cultural diversity.",
          "One of the most significant chapters of his travel journey has been his expedition to Northeast India. His route included Darjeeling, Gangtok, Lachung, Zero Point, Nathula Pass, and Zuluk, along with destinations across Arunachal Pradesh, Assam, Nagaland, Manipur, Mizoram, and Meghalaya.",
          "From the winding roads of the Himalayas to remote landscapes and unfamiliar cultures, the journey gave him an opportunity to experience a different side of India.",
          "The ride from Warangal to Northeast India stands out as a memorable milestone in his motorcycle travel journey, involving long distances, changing weather conditions, and numerous challenges along the way.",
        ],
      },
      {
        title: "Spiti Valley: An Adventure in the Himalayas",
        content: [
          "Spiti Valley in Himachal Pradesh is known for its rugged mountains, high-altitude roads, dramatic landscapes, and unpredictable weather. It is a destination that attracts motorcycle travellers seeking adventure and a deeper connection with nature.",
          "Akhil Sanchari has also completed a motorcycle journey to Spiti Valley, adding another remarkable destination to his travel experiences.",
          "For him, such journeys are about more than adventure. They offer opportunities to develop patience, confidence, and the determination to keep moving forward even when the road becomes difficult.",
        ],
      },
      {
        title: "Maharashtra, Goa and the Coastal Beauty of Karnataka",
        content: [
          "Akhil's travel experiences also include Maharashtra, Goa, and selected destinations in Karnataka.",
          "Among the notable places in Karnataka is Murudeshwar, a coastal destination famous for its towering Shiva statue, the Murudeshwar Temple, and its beautiful Arabian Sea coastline.",
          "The approximately 123-foot-tall Shiva statue is one of the region's most recognisable landmarks. The combination of spirituality, coastal scenery, and the open sea makes Murudeshwar a memorable stop for travellers.",
          "Through these journeys, Akhil continues to explore India's diverse landscapes and capture the experiences that make motorcycle travel special.",
        ],
      },
      {
        title: "Moto Bharat: Building a Riding Community in Warangal",
        content: [
          "Beyond his personal motorcycle journeys, Akhil Sanchari has taken another important step by starting Moto Bharat, a motorcycle riding community in Warangal, Telangana.",
          "The idea behind Moto Bharat is to bring motorcycle enthusiasts together, build connections among riders, and create opportunities for people who share a common passion for motorcycles and travel.",
          "The community aims to make riding more than an individual activity by encouraging group rides, shared experiences, friendship, and responsible riding practices.",
          "Through Moto Bharat, riders can come together to explore new destinations, participate in organised rides, learn from one another, and develop a stronger sense of community.",
          "The initiative also creates an opportunity for local riders to move beyond their usual routes and experience the excitement of organised motorcycle trips. From short local rides to longer journeys, the community seeks to make riding a shared experience rather than a solo pursuit.",
          "Starting a riding community in Warangal reflects Akhil's interest in connecting with people who share his passion. While his personal journeys allow him to explore the country, Moto Bharat gives him an opportunity to bring other riders along on that journey.",
          "For Akhil, the vision goes beyond riding motorcycles. It is about building a community where passion brings people together, friendships grow on the road, and every ride becomes a shared memory.",
        ],
      },
      {
        title: "Sharing Experiences Through Social Media",
        content: [
          "As a motovlogger and travel content creator, Akhil documents his adventures through travel videos, motorcycle vlogs, and Instagram Reels.",
          "His content showcases destinations, scenic routes, road experiences, and the realities of long-distance motorcycle travel. By sharing his journeys, he aims to help viewers discover new places and experience the excitement of travel through his perspective.",
          "His content also reflects the challenges behind every journey, including unpredictable weather, demanding roads, and the determination required to complete long-distance rides.",
          "Through his videos, Akhil hopes to inspire people to explore places beyond their comfort zones and see travel as an opportunity to learn and grow.",
        ],
      },
      {
        title: "Inspiring Others to Explore",
        content: [
          "Akhil Sanchari's journey represents the spirit of exploring beyond familiar boundaries. From travelling across different regions of India to building a riding community in his hometown, his efforts combine personal adventure with community engagement.",
          "His experiences highlight how a passion for motorcycles can open doors to new destinations, friendships, and opportunities.",
          "With more destinations to explore and a community to build, Akhil continues to pursue his passion for travel and motorcycle riding.",
          "From the roads of Telangana to the mountains of the Northeast, from the challenging terrain of Spiti Valley to the coastal beauty of Karnataka and Goa, and from solo adventures to leading Moto Bharat in Warangal, Akhil Sanchari's story is one of exploration, perseverance, and bringing people together through a shared love for the open road.",
        ],
      },
    ],
    quote: "“Building Moto Bharat is about creating a community where passion brings people together, friendships grow on the road, and every ride becomes a shared memory.”",
    expeditionPhotos: [
      {
        url: "https://assets.motobharat.co/about-us/akh_01.jpg",
        caption: "Akhil Sanchari — Travel Creator & Motovlogger, Warangal",
        location: "Warangal, Telangana",
      },
      {
        url: "https://assets.motobharat.co/about-us/akh_02.jpg",
        caption: "Northeast India expedition: Darjeeling to Zuluk & Nathula Pass",
        location: "Northeast India (7 States)",
      },
      {
        url: "https://assets.motobharat.co/about-us/akh_03.jpg",
        caption: "Spiti Valley: High-altitude roads, rugged landscapes and adventure",
        location: "Spiti Valley, Himachal Pradesh",
      },
      {
        url: "https://assets.motobharat.co/about-us/akh_04.jpg",
        caption: "Coastal touring route to Murudeshwar Shiva temple & Goa coastline",
        location: "Karnataka & Goa Coastline",
      },
      {
        url: "https://assets.motobharat.co/about-us/akh_05.jpg",
        caption: "Documenting long-distance motorcycle travel and highway experiences",
        location: "On The Open Road",
      },
    ],
  },
];

export function getFounderBySlug(slug: string): Founder | undefined {
  const normalized = slug.toLowerCase();
  return FOUNDERS.find(
    (f) =>
      f.slug.toLowerCase() === normalized ||
      (f.slug === "nagendra" && (normalized === "vnb" || normalized === "rider-vnb")) ||
      (f.slug === "vnb" && (normalized === "nagendra" || normalized === "rider-vnb"))
  );
}
