export const CATEGORY_ICONS = {
  Plumbing: "🚰",
  Electrical: "⚡",
  Housekeeping: "🧹",
  Security: "🛡️",
  Lift: "🛗",
  Parking: "🅿️",
  "Common Area": "🌳",
  Other: "📦",
};

export function categoryIcon(category) {
  return CATEGORY_ICONS[category] || "📋";
}
