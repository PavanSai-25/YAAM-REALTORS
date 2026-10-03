import {
  BadgeIndianRupee,
  Briefcase,
  HardHat,
  HeartHandshake,
  House,
  KeyRound,
  Landmark,
  type LucideIcon,
} from "lucide-react"

/** Services are admin-editable text, so pick an icon by keyword with a neutral fallback. */
const RULES: [RegExp, LucideIcon][] = [
  [/buy/i, House],
  [/sell/i, BadgeIndianRupee],
  [/rent|lease|tenant/i, KeyRound],
  [/construct|develop|build/i, HardHat],
  [/loan|financ|mortgage/i, Landmark],
  [/care|maint|manage/i, HeartHandshake],
]

export function serviceIcon(title: string): LucideIcon {
  return RULES.find(([re]) => re.test(title))?.[1] ?? Briefcase
}
