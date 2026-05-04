/**
 * `Tag` is the same component as `Badge` — see `04-design.md` (Badge / Tag are
 * a single primitive). We re-export both names so consumers can import the
 * label that reads best in context.
 */
export { Badge as Tag } from "./badge";
export type { BadgeProps as TagProps, BadgeTone as TagTone } from "./badge";
export { default } from "./badge";
