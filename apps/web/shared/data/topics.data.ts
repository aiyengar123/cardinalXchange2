/**
 * Static topic / rail data. Build-time only — no runtime fetch.
 *
 * Two surfaces:
 *   1. `railTopics`  — the four entries in the left rail (CXC AI / Questions /
 *                      Topics / Trending). The rail order is canonical and
 *                      matches the visual spec.
 *   2. `topicTags`   — the canonical tag list surfaced under `/questions?tag=…`.
 *                      Stays small per the brief: generic Stanford topics, no
 *                      course names (courses are explicitly out of scope).
 */

export type RailTopic = {
  /** stable id used for active-state matching against the route. */
  id: "home" | "questions" | "ask" | "cxc-ai" | "tags";
  label: string;
  href: string;
};

/**
 * The left rail is split into sections separated by hairline dividers
 * (Stack Overflow style). Currently three groups: landing, forum core,
 * and the AI mode.
 */
export type RailSection = {
  items: ReadonlyArray<RailTopic>;
};

export const railSections: ReadonlyArray<RailSection> = [
  {
    items: [{ id: "home", label: "Home", href: "/" }],
  },
  {
    items: [
      { id: "questions", label: "Questions", href: "/questions" },
      { id: "ask", label: "Ask", href: "/ask" },
      { id: "tags", label: "Tags", href: "/tags" },
    ],
  },
  {
    items: [{ id: "cxc-ai", label: "CXC AI", href: "/cxc-ai" }],
  },
];

/** Flat view of every rail item, in render order. Kept for backward
 * compatibility with code that doesn't care about grouping. */
export const railTopics: ReadonlyArray<RailTopic> = railSections.flatMap(
  (section) => section.items,
);

export type TopicTag = {
  slug: string;
  label: string;
};

export const topicTags: ReadonlyArray<TopicTag> = [
  { slug: "academic-life", label: "Academic Life" },
  { slug: "advising", label: "Advising" },
  { slug: "housing", label: "Housing" },
  { slug: "dining", label: "Dining" },
  { slug: "research", label: "Research" },
  { slug: "internships", label: "Internships" },
  { slug: "financial-aid", label: "Financial Aid" },
  { slug: "campus-life", label: "Campus Life" },
];
