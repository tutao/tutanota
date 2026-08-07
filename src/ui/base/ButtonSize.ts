/**
 * Buttons have an interactive area that is larger than the visual size
 * this size is too large to fit into some injections, so we have
 * a compact size for that.
 * Large = 56px button, 32px icon
 * Normal = 44px button, 24px icon
 * Small = 32px button, 24px icon
 * Compact = 30px button, 24px icon
 */
export const enum ButtonSize {
	ExtraSmall,
	Small,
	Normal,
	Compact,
	Large,
}
