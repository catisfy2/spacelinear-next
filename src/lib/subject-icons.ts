// ── Categorized icons for subjects ───────────────────────────────────────
// Lucide icons: PascalCase name (e.g. "Brain")
// FontAwesome icons: "fa:" prefix + kebab-case name (e.g. "fa:flask")

export interface SubjectIconEntry {
  name: string; // Lucide icon name (e.g. "Brain") or FA ("fa:flask")
  keywords: string[]; // Subject keywords that match this icon
}

export const SUBJECT_ICONS: SubjectIconEntry[] = [
  // Science & Math
  {
    name: "Brain",
    keywords: ["brain", "neuroscience", "psychology", "cognitive", "mind"],
  },
  {
    name: "FlaskConical",
    keywords: ["chemistry", "science", "lab", "experiment", "chemical"],
  },
  { name: "FlaskRound", keywords: ["chemistry", "science", "lab"] },
  {
    name: "Microscope",
    keywords: ["biology", "microscope", "cell", "science", "laboratory"],
  },
  {
    name: "Dna",
    keywords: ["dna", "genetics", "biology", "gene", "molecular"],
  },
  {
    name: "Atom",
    keywords: ["physics", "atom", "nuclear", "quantum", "particle"],
  },
  {
    name: "Sigma",
    keywords: ["math", "mathematics", "calculus", "algebra", "statistics"],
  },
  {
    name: "Calculator",
    keywords: ["math", "arithmetic", "calculation", "numbers"],
  },
  {
    name: "FunctionSquare",
    keywords: ["math", "function", "algebra", "calculus"],
  },
  {
    name: "Percent",
    keywords: ["statistics", "math", "percentage", "probability"],
  },
  {
    name: "Space",
    keywords: ["astronomy", "space", "universe", "cosmos", "astrophysics"],
  },
  {
    name: "Globe",
    keywords: ["geography", "earth", "world", "global", "planet"],
  },
  {
    name: "Mountain",
    keywords: ["geology", "earth", "nature", "geography", "environmental"],
  },

  // Technology & Computing
  {
    name: "Monitor",
    keywords: ["computer", "computing", "it", "technology", "screen"],
  },
  {
    name: "Laptop",
    keywords: ["computer", "programming", "coding", "software"],
  },
  {
    name: "Code",
    keywords: [
      "programming",
      "coding",
      "software",
      "development",
      "engineering",
    ],
  },
  {
    name: "Terminal",
    keywords: ["command", "terminal", "shell", "linux", "devops"],
  },
  {
    name: "Database",
    keywords: ["database", "data", "sql", "storage", "backend"],
  },
  {
    name: "Server",
    keywords: ["server", "network", "hosting", "infrastructure", "cloud"],
  },
  { name: "Cloud", keywords: ["cloud", "aws", "devops", "deployment"] },
  {
    name: "Cpu",
    keywords: ["cpu", "hardware", "processor", "computer", "architecture"],
  },
  {
    name: "Smartphone",
    keywords: ["mobile", "app", "ios", "android", "smartphone"],
  },
  { name: "Earth", keywords: ["web", "internet", "www", "online", "network"] },
  {
    name: "Wifi",
    keywords: ["networking", "wireless", "communication", "signal"],
  },
  {
    name: "Shield",
    keywords: ["security", "cybersecurity", "protection", "privacy"],
  },
  {
    name: "Lock",
    keywords: ["security", "cryptography", "encryption", "privacy"],
  },
  {
    name: "Key",
    keywords: ["cryptography", "security", "encryption", "authentication"],
  },
  {
    name: "Bot",
    keywords: [
      "ai",
      "artificial intelligence",
      "chatbot",
      "automation",
      "robot",
    ],
  },
  {
    name: "BrainCircuit",
    keywords: ["ai", "machine learning", "deep learning", "neural"],
  },
  {
    name: "CircuitBoard",
    keywords: ["computer science", "algorithms", "data structures"],
  },
  {
    name: "Binary",
    keywords: ["binary", "digital", "computer science", "logic"],
  },

  // Engineering & Architecture
  {
    name: "Building",
    keywords: ["architecture", "building", "construction", "civil"],
  },
  {
    name: "Factory",
    keywords: ["engineering", "manufacturing", "industrial", "production"],
  },
  {
    name: "Wrench",
    keywords: ["mechanical", "engineering", "repair", "maintenance"],
  },
  { name: "Screwdriver", keywords: ["mechanical", "engineering", "tools"] },
  {
    name: "Cog",
    keywords: ["engineering", "systems", "mechanics", "mechanical"],
  },
  {
    name: "Ruler",
    keywords: ["design", "engineering", "drafting", "architecture"],
  },
  {
    name: "PencilRuler",
    keywords: ["design", "drafting", "architecture", "engineering"],
  },
  {
    name: "HardHat",
    keywords: ["construction", "safety", "engineering", "civil"],
  },
  {
    name: "Car",
    keywords: ["automotive", "mechanical", "transportation", "vehicle"],
  },
  {
    name: "Plane",
    keywords: ["aviation", "aeronautics", "flight", "aerospace"],
  },

  // Arts & Humanities
  {
    name: "Palette",
    keywords: ["art", "painting", "fine arts", "visual", "design"],
  },
  { name: "Paintbrush", keywords: ["art", "painting", "creative", "design"] },
  {
    name: "PenTool",
    keywords: ["design", "graphic", "illustration", "creative"],
  },
  { name: "Music", keywords: ["music", "sound", "audio", "composition"] },
  { name: "Radio", keywords: ["music", "audio", "broadcasting", "media"] },
  {
    name: "Film",
    keywords: ["film", "cinema", "movie", "video", "media studies"],
  },
  { name: "Clapperboard", keywords: ["film", "video", "media", "production"] },
  { name: "Camera", keywords: ["photography", "camera", "photo", "visual"] },
  {
    name: "BookOpen",
    keywords: ["literature", "english", "reading", "language"],
  },
  { name: "Book", keywords: ["literature", "reading", "textbook", "study"] },
  { name: "BookMarked", keywords: ["literature", "research", "reference"] },
  {
    name: "Feather",
    keywords: ["writing", "journalism", "creative writing", "poetry"],
  },
  { name: "Pen", keywords: ["writing", "composition", "essay", "notes"] },
  {
    name: "Languages",
    keywords: ["language", "linguistics", "translation", "spanish", "french"],
  },
  {
    name: "MessageCircle",
    keywords: ["communication", "speech", "debate", "rhetoric"],
  },
  {
    name: "Theater",
    keywords: ["theatre", "drama", "performing arts", "acting"],
  },
  {
    name: "History",
    keywords: ["history", "historical", "ancient", "civilization"],
  },
  {
    name: "Landmark",
    keywords: ["history", "monument", "heritage", "architecture"],
  },
  {
    name: "Scroll",
    keywords: ["history", "ancient", "document", "manuscript"],
  },

  // Business & Social Sciences
  {
    name: "Briefcase",
    keywords: ["business", "management", "career", "professional"],
  },
  {
    name: "Handshake",
    keywords: ["business", "negotiation", "partnership", "commerce"],
  },
  {
    name: "TrendingUp",
    keywords: ["economics", "finance", "business", "growth", "market"],
  },
  {
    name: "BarChart3",
    keywords: ["statistics", "analytics", "data", "economics", "business"],
  },
  {
    name: "PieChart",
    keywords: ["statistics", "analytics", "data", "economics"],
  },
  { name: "Wallet", keywords: ["finance", "accounting", "banking", "money"] },
  { name: "Coins", keywords: ["finance", "economics", "money", "investment"] },
  { name: "Scale", keywords: ["law", "justice", "legal", "constitutional"] },
  { name: "Gavel", keywords: ["law", "legal", "justice", "criminal"] },
  {
    name: "Users",
    keywords: ["sociology", "social", "community", "society", "group"],
  },
  {
    name: "HeartHandshake",
    keywords: ["social work", "psychology", "counseling"],
  },
  {
    name: "Flag",
    keywords: ["international", "politics", "diplomacy", "global"],
  },
  {
    name: "Newspaper",
    keywords: ["journalism", "news", "media", "current affairs"],
  },
  {
    name: "Vote",
    keywords: ["politics", "democracy", "election", "government", "civics"],
  },
  {
    name: "Building2",
    keywords: ["government", "public", "administration", "policy"],
  },
  { name: "Store", keywords: ["marketing", "retail", "commerce", "business"] },
  {
    name: "Megaphone",
    keywords: ["marketing", "advertising", "communication", "publicity"],
  },

  // Health & Medicine
  {
    name: "HeartPulse",
    keywords: ["medicine", "health", "cardiology", "medical"],
  },
  {
    name: "Stethoscope",
    keywords: ["medicine", "doctor", "healthcare", "clinical"],
  },
  { name: "Pill", keywords: ["pharmacy", "medicine", "pharmacology", "drug"] },
  {
    name: "Activity",
    keywords: ["fitness", "health", "exercise", "kinesiology"],
  },
  { name: "Apple", keywords: ["nutrition", "food", "health", "diet"] },
  {
    name: "Leaf",
    keywords: ["botany", "plants", "biology", "ecology", "environmental"],
  },

  // Education & Tools
  {
    name: "GraduationCap",
    keywords: ["education", "academic", "school", "university", "degree"],
  },
  { name: "Library", keywords: ["library", "research", "reference", "study"] },
  { name: "Backpack", keywords: ["school", "student", "education"] },
  { name: "Pencil", keywords: ["study", "notes", "writing", "learning"] },
  {
    name: "ClipboardList",
    keywords: ["checklist", "planning", "organization", "tasks"],
  },
  { name: "Target", keywords: ["goal", "objective", "aim", "focus"] },
  {
    name: "Lightbulb",
    keywords: ["ideas", "creativity", "innovation", "thinking"],
  },
  {
    name: "Star",
    keywords: ["excellence", "achievement", "award", "recognition"],
  },
  {
    name: "Trophy",
    keywords: ["competition", "achievement", "success", "award"],
  },
  {
    name: "Compass",
    keywords: ["navigation", "direction", "guidance", "exploration"],
  },
  {
    name: "Map",
    keywords: ["geography", "navigation", "travel", "exploration"],
  },
  {
    name: "Clock",
    keywords: ["time management", "scheduling", "history", "chronology"],
  },
  {
    name: "Calendar",
    keywords: ["planning", "scheduling", "event", "organization"],
  },
  { name: "Zap", keywords: ["energy", "electricity", "physics", "power"] },
  {
    name: "Wind",
    keywords: ["weather", "climate", "environment", "meteorology"],
  },
  { name: "Droplet", keywords: ["water", "marine", "ocean", "biology"] },
  { name: "Flame", keywords: ["energy", "thermodynamics", "heat", "fire"] },
  {
    name: "TreePine",
    keywords: ["forestry", "environment", "ecology", "nature"],
  },
  { name: "Sword", keywords: ["military", "history", "war", "strategy"] },
  { name: "Gamepad2", keywords: ["gaming", "game design", "entertainment"] },
  {
    name: "ChevronsRight",
    keywords: ["philosophy", "logic", "reasoning", "critical thinking"],
  },

  // ── FontAwesome Icons (prefixed with "fa:") ───────────────────────────
  { name: "fa:flask", keywords: ["chemistry", "science", "lab", "experiment"] },
  { name: "fa:dna", keywords: ["genetics", "dna", "biology", "gene"] },
  { name: "fa:atom", keywords: ["physics", "atom", "nuclear", "quantum"] },
  {
    name: "fa:calculator",
    keywords: ["math", "arithmetic", "numbers", "calculation"],
  },
  { name: "fa:globe", keywords: ["geography", "earth", "world", "planet"] },
  {
    name: "fa:mountain",
    keywords: ["geology", "nature", "earth", "environment"],
  },
  { name: "fa:microscope", keywords: ["biology", "science", "lab", "cell"] },
  {
    name: "fa:brain",
    keywords: ["neuroscience", "psychology", "brain", "mind"],
  },
  { name: "fa:square-root", keywords: ["math", "algebra", "calculus", "root"] },
  {
    name: "fa:chart-line",
    keywords: ["statistics", "analytics", "trend", "growth"],
  },
  { name: "fa:chart-pie", keywords: ["statistics", "analytics", "data"] },
  {
    name: "fa:chart-bar",
    keywords: ["statistics", "analytics", "bar", "data"],
  },
  { name: "fa:book", keywords: ["literature", "reading", "textbook", "study"] },
  { name: "fa:book-open", keywords: ["reading", "literature", "english"] },
  { name: "fa:bookmark", keywords: ["reference", "bookmark", "saved"] },
  { name: "fa:pen", keywords: ["writing", "composition", "essay", "notes"] },
  { name: "fa:pen-fancy", keywords: ["calligraphy", "writing", "creative"] },
  {
    name: "fa:feather",
    keywords: ["writing", "poetry", "journalism", "creative"],
  },
  {
    name: "fa:language",
    keywords: ["linguistics", "language", "translation", "spanish"],
  },
  {
    name: "fa:theater",
    keywords: ["theatre", "drama", "performing", "acting"],
  },
  { name: "fa:film", keywords: ["film", "cinema", "movie", "video"] },
  { name: "fa:camera", keywords: ["photography", "camera", "photo"] },
  { name: "fa:music", keywords: ["music", "sound", "audio", "composition"] },
  { name: "fa:palette", keywords: ["art", "painting", "visual", "design"] },
  {
    name: "fa:paint-brush",
    keywords: ["art", "painting", "creative", "design"],
  },
  { name: "fa:pencil-ruler", keywords: ["design", "drafting", "architecture"] },
  { name: "fa:ruler", keywords: ["design", "drafting", "measurement"] },
  {
    name: "fa:ruler-combined",
    keywords: ["design", "drafting", "architecture"],
  },
  { name: "fa:hard-hat", keywords: ["construction", "safety", "civil"] },
  { name: "fa:wrench", keywords: ["mechanical", "repair", "maintenance"] },
  { name: "fa:screwdriver", keywords: ["mechanical", "tools", "repair"] },
  { name: "fa:cogs", keywords: ["engineering", "systems", "mechanics"] },
  { name: "fa:car", keywords: ["automotive", "vehicle", "transportation"] },
  { name: "fa:plane", keywords: ["aviation", "flight", "aerospace"] },
  { name: "fa:rocket", keywords: ["space", "astronomy", "aerospace"] },
  {
    name: "fa:building",
    keywords: ["architecture", "building", "construction"],
  },
  {
    name: "fa:industry",
    keywords: ["industrial", "manufacturing", "engineering"],
  },
  { name: "fa:tools", keywords: ["tools", "workshop", "mechanical"] },
  { name: "fa:laptop", keywords: ["computer", "laptop", "technology"] },
  { name: "fa:laptop-code", keywords: ["programming", "coding", "developer"] },
  {
    name: "fa:computer",
    keywords: ["computer", "desktop", "it", "technology"],
  },
  { name: "fa:server", keywords: ["server", "network", "backend", "hosting"] },
  { name: "fa:database", keywords: ["database", "sql", "data", "storage"] },
  { name: "fa:cloud", keywords: ["cloud", "aws", "devops", "deployment"] },
  { name: "fa:wifi", keywords: ["networking", "wireless", "signal"] },
  { name: "fa:shield", keywords: ["security", "cybersecurity", "protection"] },
  { name: "fa:lock", keywords: ["security", "encryption", "privacy"] },
  { name: "fa:key", keywords: ["cryptography", "security", "authentication"] },
  { name: "fa:robot", keywords: ["ai", "robot", "automation", "chatbot"] },
  { name: "fa:microchip", keywords: ["cpu", "hardware", "processor", "chip"] },
  { name: "fa:code", keywords: ["programming", "coding", "development"] },
  { name: "fa:terminal", keywords: ["terminal", "command", "shell", "devops"] },
  { name: "fa:bolt", keywords: ["energy", "electricity", "power"] },
  { name: "fa:fire", keywords: ["energy", "thermodynamics", "heat"] },
  { name: "fa:leaf", keywords: ["botany", "plants", "ecology", "nature"] },
  { name: "fa:tree", keywords: ["forestry", "environment", "ecology"] },
  { name: "fa:droplet", keywords: ["water", "marine", "ocean", "biology"] },
  { name: "fa:wind", keywords: ["weather", "climate", "meteorology"] },
  { name: "fa:sun", keywords: ["astronomy", "solar", "energy", "light"] },
  { name: "fa:moon", keywords: ["astronomy", "space", "lunar"] },
  { name: "fa:star", keywords: ["astronomy", "achievement", "rating"] },
  { name: "fa:heart", keywords: ["health", "medicine", "cardiology"] },
  { name: "fa:heart-pulse", keywords: ["medicine", "health", "medical"] },
  { name: "fa:stethoscope", keywords: ["medicine", "doctor", "healthcare"] },
  { name: "fa:pills", keywords: ["pharmacy", "pharmacology", "drug"] },
  { name: "fa:apple-alt", keywords: ["nutrition", "food", "health", "diet"] },
  { name: "fa:user-md", keywords: ["doctor", "medical", "healthcare"] },
  { name: "fa:tooth", keywords: ["dentistry", "dental", "health"] },
  { name: "fa:eye", keywords: ["optometry", "vision", "ophthalmology"] },
  { name: "fa:user-graduate", keywords: ["graduate", "degree", "academic"] },
  { name: "fa:school", keywords: ["school", "education", "academic"] },
  { name: "fa:bag-shopping", keywords: ["student", "school", "education"] },
  { name: "fa:clipboard-list", keywords: ["checklist", "planning", "tasks"] },
  { name: "fa:lightbulb", keywords: ["ideas", "creativity", "innovation"] },
  { name: "fa:bullseye", keywords: ["goal", "objective", "aim", "focus"] },
  { name: "fa:trophy", keywords: ["competition", "achievement", "award"] },
  { name: "fa:compass", keywords: ["navigation", "direction", "guidance"] },
  { name: "fa:map", keywords: ["geography", "navigation", "travel"] },
  { name: "fa:map-pin", keywords: ["location", "geography", "pin"] },
  { name: "fa:clock", keywords: ["time", "schedule", "history"] },
  { name: "fa:calendar", keywords: ["planning", "scheduling", "event"] },
  { name: "fa:calendar-check", keywords: ["planning", "check", "completed"] },
  {
    name: "fa:graduation-cap",
    keywords: ["graduation", "degree", "education"],
  },
  { name: "fa:briefcase", keywords: ["business", "career", "professional"] },
  { name: "fa:handshake", keywords: ["business", "partnership", "commerce"] },
  { name: "fa:wallet", keywords: ["finance", "accounting", "money"] },
  { name: "fa:coins", keywords: ["finance", "economics", "money"] },
  { name: "fa:scale-balanced", keywords: ["law", "justice", "legal"] },
  { name: "fa:gavel", keywords: ["law", "legal", "justice", "court"] },
  { name: "fa:users", keywords: ["sociology", "community", "society"] },
  { name: "fa:flag", keywords: ["politics", "international", "diplomacy"] },
  { name: "fa:newspaper", keywords: ["journalism", "news", "media"] },
  { name: "fa:vote-yea", keywords: ["politics", "vote", "democracy"] },
  { name: "fa:landmark", keywords: ["history", "monument", "heritage"] },
  { name: "fa:store", keywords: ["marketing", "retail", "commerce"] },
  { name: "fa:bullhorn", keywords: ["marketing", "advertising", "publicity"] },
  { name: "fa:camera-retro", keywords: ["photography", "vintage", "retro"] },
  { name: "fa:headphones", keywords: ["audio", "music", "podcast", "sound"] },
  { name: "fa:gamepad", keywords: ["gaming", "game design", "entertainment"] },
  { name: "fa:chess", keywords: ["chess", "strategy", "logic", "game"] },
  { name: "fa:chess-knight", keywords: ["chess", "strategy", "tactics"] },
  {
    name: "fa:certificate",
    keywords: ["certification", "achievement", "award"],
  },
  { name: "fa:award", keywords: ["achievement", "award", "recognition"] },
  { name: "fa:scroll", keywords: ["history", "document", "manuscript"] },
  { name: "fa:history", keywords: ["history", "historical", "timeline"] },
  { name: "fa:infinity", keywords: ["infinity", "calculus", "math", "limit"] },
  { name: "fa:android", keywords: ["android", "mobile", "app", "robot"] },
  { name: "fa:comments", keywords: ["communication", "discussion", "forum"] },
  { name: "fa:comment-dots", keywords: ["communication", "chat", "message"] },
  { name: "fa:question-circle", keywords: ["questions", "quiz", "help"] },
  { name: "fa:search", keywords: ["research", "search", "explore"] },
  { name: "fa:chart-network", keywords: ["networking", "graph", "topology"] },
  { name: "fa:project-diagram", keywords: ["project", "diagram", "flowchart"] },
  { name: "fa:layer-group", keywords: ["layers", "organization", "structure"] },
  { name: "fa:balance-scale", keywords: ["law", "justice", "balance"] },
  { name: "fa:dice-d6", keywords: ["gaming", "dice", "rpg", "entertainment"] },
  { name: "fa:dragon", keywords: ["fantasy", "mythology", "literature"] },
  { name: "fa:hat-wizard", keywords: ["fantasy", "magic", "wizard"] },
  { name: "fa:skull", keywords: ["anatomy", "biology", "medical"] },
  { name: "fa:fist-raised", keywords: ["politics", "protest", "solidarity"] },
  { name: "fa:shield-alt", keywords: ["security", "defense", "protection"] },
  { name: "fa:magic", keywords: ["magic", "spell", "fantasy"] },
  { name: "fa:divide", keywords: ["math", "division", "arithmetic"] },
  { name: "fa:percentage", keywords: ["math", "percentage", "statistics"] },
  { name: "fa:fingerprint", keywords: ["biometrics", "security", "identity"] },
  { name: "fa:user-tie", keywords: ["business", "professional", "executive"] },
  {
    name: "fa:chalkboard-teacher",
    keywords: ["teaching", "education", "lecture"],
  },
  { name: "fa:business-time", keywords: ["business", "time", "management"] },
  { name: "fa:money-bill-wave", keywords: ["finance", "economics", "money"] },
  { name: "fa:piggy-bank", keywords: ["finance", "savings", "banking"] },
  {
    name: "fa:hand-holding-usd",
    keywords: ["finance", "investment", "funding"],
  },
  { name: "fa:gift", keywords: ["gift", "present", "celebration"] },
  { name: "fa:gem", keywords: ["gem", "jewel", "precious", "geology"] },
  { name: "fa:crown", keywords: ["royalty", "history", "monarchy"] },
  { name: "fa:walking", keywords: ["fitness", "health", "exercise", "walk"] },
  { name: "fa:running", keywords: ["fitness", "health", "exercise", "run"] },
  { name: "fa:bicycle", keywords: ["cycling", "fitness", "sport"] },
  { name: "fa:swimmer", keywords: ["swimming", "sport", "fitness"] },
];

// Flat list of icon names for quick lookups
export const SUBJECT_ICON_NAMES = SUBJECT_ICONS.map((e) => e.name);

// Default icon when nothing matches
export const DEFAULT_SUBJECT_ICON = "BookOpen";

/**
 * Pick the best matching icon for a given subject name.
 * Uses keyword matching against the subject name (lowercased).
 * Falls back to DEFAULT_SUBJECT_ICON if no match.
 */
export function pickIconForSubject(subjectName: string): string {
  const name = subjectName.toLowerCase();

  // Score each icon by how many keywords match
  let bestScore = 0;
  let bestIcon = DEFAULT_SUBJECT_ICON;

  for (const entry of SUBJECT_ICONS) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (name.includes(keyword)) {
        // Longer keyword match = higher confidence
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIcon = entry.name;
    }
  }

  return bestIcon;
}

/**
 * Pick a random icon from the available set.
 */
export function pickRandomIcon(): string {
  return SUBJECT_ICON_NAMES[
    Math.floor(Math.random() * SUBJECT_ICON_NAMES.length)
  ]!;
}
