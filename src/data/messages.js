// Bouchique — cute preset messages + romantic sign-offs
// Messages are plain text (they ride along in the share link + OG card);
// each preset's `doodle` is drawn beside the message on the site as a
// hand-drawn SVG bloom matching the wish's theme colors.

export const PRESET_MESSAGES = [
  { label: "Girlfriends Day", text: "Happy Girlfriends Day!", doodle: "tulip" },
  { label: "Valentine", text: "Happy Valentine's Day, my love!", doodle: "heart" },
  { label: "Just because", text: "Just because you're amazing.", doodle: "daisy" },
  { label: "Thinking of you", text: "Thinking of you always.", doodle: "sparkle" },
  { label: "Birthday", text: "Happy Birthday, sunshine!", doodle: "sunflower" },
  { label: "Good morning", text: "Good morning, beautiful!", doodle: "sun" },
  { label: "Goodnight", text: "Sweet dreams, gorgeous.", doodle: "moon" },
  { label: "Miss you", text: "Missing you a little extra today.", doodle: "star" },
];

export function doodleFor(label) {
  return PRESET_MESSAGES.find((p) => p.label === label)?.doodle || "sparkle";
}

export const SIGN_OFFS = [
  "with love",
  "yours forever",
  "all my love",
  "forever and always",
  "xoxo",
  "adoringly yours",
];
