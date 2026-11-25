/**
 * Festival and occasion idea packs for Indian (and especially Kerala) creators.
 *
 * Dates are only given where they are fixed or can be calculated exactly (Easter, Mother's Day).
 * Festivals that follow the lunar or Malayalam calendar (Onam, Diwali, Eid, ...) change every
 * year, so the creator picks the date instead of the app guessing a wrong one.
 */

export type FestivalRule =
  | { kind: "fixed"; month: number; day: number }
  | { kind: "nth-weekday"; month: number; weekday: number; nth: number }
  | { kind: "easter"; offsetDays?: number }
  | { kind: "varies"; season: string };

export type FestivalIdea = { title: string; howTo: string };

export type Festival = {
  id: string;
  name: string;
  region: "Kerala" | "India" | "Global";
  rule: FestivalRule;
  note?: string;
  ideas: FestivalIdea[];
};

export const FESTIVALS: Festival[] = [
  {
    id: "new-year",
    name: "New Year",
    region: "Global",
    rule: { kind: "fixed", month: 1, day: 1 },
    ideas: [
      { title: "My year in 60 seconds", howTo: "Cut the best 1-second clip from each month into one fast montage with a countdown overlay." },
      { title: "3 goals for this year (hold me to it)", howTo: "Talk to camera, write each goal on screen, and ask viewers to comment theirs." },
      { title: "What I would tell myself one year ago", howTo: "Split-screen an old clip of you with today's reaction." },
    ],
  },
  {
    id: "republic-day",
    name: "Republic Day",
    region: "India",
    rule: { kind: "fixed", month: 1, day: 26 },
    ideas: [
      { title: "5 facts about the Constitution most people get wrong", howTo: "Quick myth-versus-fact cards with tricolour accents." },
      { title: "Unsung heroes from my state", howTo: "One minute on a local freedom fighter, with archive photos and voiceover." },
      { title: "Tricolour recipe or craft", howTo: "Top-down shot, three layers, finish with the final reveal." },
    ],
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    region: "Global",
    rule: { kind: "fixed", month: 2, day: 14 },
    ideas: [
      { title: "Gift ideas under ₹500", howTo: "Show 5 products with price tags on screen; add affiliate links if you have them." },
      { title: "Couples vs singles on Valentine's Day", howTo: "Comedy split-screen skit with the same situation played both ways." },
      { title: "Self-love day routine", howTo: "A calm vlog: coffee, a walk, a favourite meal, ending with a note to yourself." },
    ],
  },
  {
    id: "womens-day",
    name: "International Women's Day",
    region: "Global",
    rule: { kind: "fixed", month: 3, day: 8 },
    ideas: [
      { title: "The women who raised me", howTo: "Photos of mother, grandmother, teachers, with one line each about what they taught you." },
      { title: "Women-led local businesses to support", howTo: "Visit or feature 3 businesses with a short clip and their handle on screen." },
      { title: "Questions women are tired of hearing", howTo: "Fast cuts of friends reacting to each question, then a better question to ask." },
    ],
  },
  {
    id: "vishu",
    name: "Vishu",
    region: "Kerala",
    rule: { kind: "fixed", month: 4, day: 14 },
    note: "Usually 14 April; occasionally the 15th. Check the date for this year.",
    ideas: [
      { title: "Setting up the Vishukkani, step by step", howTo: "Time-lapse of arranging the kani, then the reveal at dawn from the doorway." },
      { title: "Vishu sadya at home vs at a restaurant", howTo: "Side-by-side comparison of taste, price, and effort, with a verdict." },
      { title: "Vishukaineetam memories", howTo: "Family members share their first kaineetam story; end with this year's moment." },
    ],
  },
  {
    id: "easter",
    name: "Easter",
    region: "Global",
    rule: { kind: "easter" },
    ideas: [
      { title: "Kerala Easter breakfast: appam and stew", howTo: "Recipe reel with the finished table shot first as the hook." },
      { title: "Easter morning at church, in 30 seconds", howTo: "Respectful wide shots, bells, and family greetings afterwards." },
      { title: "Easter egg decorating with kids", howTo: "Top-down craft video with a before-and-after reveal." },
    ],
  },
  {
    id: "mothers-day",
    name: "Mother's Day",
    region: "Global",
    rule: { kind: "nth-weekday", month: 5, weekday: 0, nth: 2 },
    ideas: [
      { title: "Things my mother says, recreated", howTo: "Act out 5 classic lines in her voice; end with a real hug clip." },
      { title: "Cooking her recipe for her", howTo: "Follow her recipe on camera, then film her first taste." },
      { title: "Asking my mother 5 questions I never asked", howTo: "Simple two-shot interview with subtitles." },
    ],
  },
  {
    id: "environment-day",
    name: "World Environment Day",
    region: "Global",
    rule: { kind: "fixed", month: 6, day: 5 },
    ideas: [
      { title: "One week without plastic: how it went", howTo: "Daily 5-second check-ins, ending with the honest result." },
      { title: "Planting a tree and checking it every month", howTo: "Start a series: plant today, and pin the plan for monthly updates." },
      { title: "Kerala's monsoon and why it is changing", howTo: "Explainer with simple charts and rain footage." },
    ],
  },
  {
    id: "fathers-day",
    name: "Father's Day",
    region: "Global",
    rule: { kind: "nth-weekday", month: 6, weekday: 0, nth: 3 },
    ideas: [
      { title: "Dad's advice that turned out right", howTo: "Text-on-screen list over old family photos." },
      { title: "Teaching my father a social media trend", howTo: "Comedy attempt with bloopers left in." },
      { title: "A day doing my father's job", howTo: "Shadow him for a day and show what surprised you." },
    ],
  },
  {
    id: "yoga-day",
    name: "International Yoga Day",
    region: "Global",
    rule: { kind: "fixed", month: 6, day: 21 },
    ideas: [
      { title: "5-minute morning yoga for beginners", howTo: "Follow-along video with a timer on screen." },
      { title: "Yoga poses for people who sit all day", howTo: "Desk-friendly stretches filmed at an actual desk." },
      { title: "I did yoga every day for 30 days", howTo: "Start the challenge today; post the result next month." },
    ],
  },
  {
    id: "friendship-day",
    name: "Friendship Day",
    region: "India",
    rule: { kind: "nth-weekday", month: 8, weekday: 0, nth: 1 },
    ideas: [
      { title: "Types of friends everyone has", howTo: "Comedy skit, one friend type per scene, tag your friends." },
      { title: "School friends, 10 years later", howTo: "Recreate an old group photo and show both side by side." },
      { title: "How well does my best friend know me?", howTo: "Quiz format with a scoreboard on screen." },
    ],
  },
  {
    id: "independence-day",
    name: "Independence Day",
    region: "India",
    rule: { kind: "fixed", month: 8, day: 15 },
    ideas: [
      { title: "What freedom means to three generations", howTo: "Ask a grandparent, a parent, and a child the same question." },
      { title: "Made-in-India products I actually use", howTo: "Quick product roll with honest one-line reviews." },
      { title: "Flag hoisting at my old school", howTo: "Revisit, film the ceremony, and add a memory voiceover." },
    ],
  },
  {
    id: "onam",
    name: "Onam",
    region: "Kerala",
    rule: { kind: "varies", season: "August or September (Chingam month)" },
    note: "Thiruvonam follows the Malayalam calendar. Pick this year's date.",
    ideas: [
      { title: "Onam sadya: every dish explained", howTo: "Top-down banana leaf, label each item as it is served, in serving order." },
      { title: "Pookalam in 60 seconds", howTo: "Time-lapse from above, from the first ring to the finished design." },
      { title: "Onam then vs now", howTo: "Old family photos side by side with this year's celebration." },
      { title: "Onam shopping haul under a budget", howTo: "Kasavu, flowers, and sadya items with prices on screen." },
    ],
  },
  {
    id: "teachers-day",
    name: "Teachers' Day",
    region: "India",
    rule: { kind: "fixed", month: 9, day: 5 },
    ideas: [
      { title: "The teacher who changed my life", howTo: "Story to camera, ending with a message to them (or a visit)." },
      { title: "Types of teachers we all had", howTo: "Comedy skit, one character per scene." },
      { title: "Teaching my teacher something new", howTo: "Swap roles for a day and film the lesson." },
    ],
  },
  {
    id: "gandhi-jayanti",
    name: "Gandhi Jayanti",
    region: "India",
    rule: { kind: "fixed", month: 10, day: 2 },
    ideas: [
      { title: "Gandhi's ideas that still work today", howTo: "Three ideas, one modern example each." },
      { title: "A day of simple living", howTo: "Try one day with minimal spending and screens; share what changed." },
      { title: "Clean-up drive in my area", howTo: "Before-and-after shots of the same spot." },
    ],
  },
  {
    id: "navaratri",
    name: "Navaratri and Vidyarambham",
    region: "Kerala",
    rule: { kind: "varies", season: "September or October" },
    note: "Dates follow the lunar calendar. Pick this year's dates.",
    ideas: [
      { title: "Vidyarambham: a child's first letters", howTo: "Gentle close-ups of writing on rice; get the family's consent first." },
      { title: "Bommakolu display tour", howTo: "Slow pan across each step with short stories about the dolls." },
      { title: "Nine days, nine colours outfits", howTo: "One outfit per day in a fast transition reel." },
    ],
  },
  {
    id: "diwali",
    name: "Diwali",
    region: "India",
    rule: { kind: "varies", season: "October or November" },
    note: "Dates follow the lunar calendar. Pick this year's date.",
    ideas: [
      { title: "Diwali home decor on a budget", howTo: "Before-and-after room transformation with prices on screen." },
      { title: "Sweets I make every Diwali", howTo: "Recipe reel with the plated sweets as the opening shot." },
      { title: "Green Diwali ideas", howTo: "Five ways to celebrate with less smoke and waste." },
    ],
  },
  {
    id: "kerala-piravi",
    name: "Kerala Piravi",
    region: "Kerala",
    rule: { kind: "fixed", month: 11, day: 1 },
    ideas: [
      { title: "Things only Keralites understand", howTo: "Relatable comedy list with quick cuts." },
      { title: "14 districts, 14 foods", howTo: "One dish per district with a map animation." },
      { title: "Malayalam words with no English translation", howTo: "Word on screen, meaning, and an example in a skit." },
    ],
  },
  {
    id: "childrens-day",
    name: "Children's Day",
    region: "India",
    rule: { kind: "fixed", month: 11, day: 14 },
    ideas: [
      { title: "Games we played as kids in the 90s", howTo: "Recreate each game with friends; ask viewers which they played." },
      { title: "Kids react to old technology", howTo: "Let children try a cassette, a landline, or a film camera." },
      { title: "Letter to my younger self", howTo: "Read it over childhood photos." },
    ],
  },
  {
    id: "christmas",
    name: "Christmas",
    region: "Global",
    rule: { kind: "fixed", month: 12, day: 25 },
    ideas: [
      { title: "Kerala plum cake, from mixing to slicing", howTo: "Recipe reel with the slice as the hook shot." },
      { title: "Making a star lantern at home", howTo: "Step-by-step craft with the lit-up reveal at night." },
      { title: "Carol night in my neighbourhood", howTo: "Atmosphere vlog: lights, singing, and snacks." },
    ],
  },
  {
    id: "eid",
    name: "Eid al-Fitr",
    region: "India",
    rule: { kind: "varies", season: "Moves about 11 days earlier each year" },
    note: "Depends on the moon sighting. Pick this year's date.",
    ideas: [
      { title: "Eid biryani, family recipe", howTo: "Recipe reel ending with the family meal." },
      { title: "Mehendi designs for Eid", howTo: "Top-down time-lapse of three designs, easy to hard." },
      { title: "What Ramadan taught me this year", howTo: "Reflective talk to camera with iftar footage." },
    ],
  },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function iso(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Western Easter Sunday (Anonymous Gregorian algorithm). */
export function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(year, month, day);
}

function nthWeekday(year: number, month: number, weekday: number, nth: number) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const day = 1 + ((weekday - first + 7) % 7) + (nth - 1) * 7;
  return iso(year, month, day);
}

export function festivalDate(rule: FestivalRule, year: number): string | null {
  switch (rule.kind) {
    case "fixed":
      return iso(year, rule.month, rule.day);
    case "nth-weekday":
      return nthWeekday(year, rule.month, rule.weekday, rule.nth);
    case "easter": {
      const base = new Date(`${easterSunday(year)}T00:00:00Z`);
      base.setUTCDate(base.getUTCDate() + (rule.offsetDays ?? 0));
      return base.toISOString().slice(0, 10);
    }
    case "varies":
      return null;
  }
}

/** The next date on or after `today` (YYYY-MM-DD), or null when the date varies. */
export function nextFestivalDate(rule: FestivalRule, today: string) {
  const year = Number(today.slice(0, 4));
  const thisYear = festivalDate(rule, year);
  if (!thisYear) return null;
  return thisYear >= today ? thisYear : festivalDate(rule, year + 1);
}

/** Post a few days ahead so the video is live before the day itself. */
export function suggestedPostDate(festival: string, leadDays = 3, today?: string) {
  const date = new Date(`${festival}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - leadDays);
  const value = date.toISOString().slice(0, 10);
  return today && value < today ? today : value;
}

export function upcomingFestivals(today: string) {
  return FESTIVALS.map((festival) => ({ festival, date: nextFestivalDate(festival.rule, today) })).sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.festival.name.localeCompare(b.festival.name);
  });
}
