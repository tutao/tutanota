import { BaseThemeId, Theme } from "./theme"

/**
 * Whitelabel theme customizations that can be set
 */
export interface WhitelabelThemeSettings {
	/**
	 * Primary color in hexadecimal
	 */
	accentColor: string

	/**
	 * Theme to use
	 */
	theme: BaseThemeId

	/**
	 * Optional logo (if unspecified, the app's respective default grayscale logo for that theme will be used)
	 */
	logo?: string
}

export class WhitelabelThemeGenerator {
	constructor() {}

	async generateMaterialTheme(themeParams: WhitelabelThemeSettings): Promise<Partial<Theme>> {
		const { argbFromHex, DynamicScheme, Hct, hexFromArgb, themeFromSourceColor } = await import("@material/material-color-utilities")

		const primaryArgb = argbFromHex(themeParams.accentColor)
		const materialTheme = themeFromSourceColor(primaryArgb)

		const isDark = themeParams.theme === "dark"
		const scheme = new DynamicScheme({
			sourceColorHct: Hct.fromInt(primaryArgb),
			contrastLevel: 0.25,
			isDark,
			primaryPalette: materialTheme.palettes.primary,
			secondaryPalette: materialTheme.palettes.secondary,
			tertiaryPalette: materialTheme.palettes.tertiary,
			neutralPalette: materialTheme.palettes.neutral,
			neutralVariantPalette: materialTheme.palettes.neutralVariant,
		})

		return {
			// this will often not actually match the original accent color (and we don't have a place to put it), but
			// provided you use the same theme (dark/light), using the new primary color as the accent color should
			// result in the same color palettes
			primary: hexFromArgb(scheme.primary),

			on_primary: hexFromArgb(scheme.onPrimary),
			primary_container: hexFromArgb(scheme.primaryContainer),
			on_primary_container: hexFromArgb(scheme.onPrimaryContainer),
			secondary: hexFromArgb(scheme.secondary),
			on_secondary: hexFromArgb(scheme.onSecondary),
			secondary_container: hexFromArgb(scheme.secondaryContainer),
			on_secondary_container: hexFromArgb(scheme.onSecondaryContainer),
			tertiary: hexFromArgb(scheme.tertiary),
			on_tertiary: hexFromArgb(scheme.onTertiary),
			tertiary_container: hexFromArgb(scheme.tertiaryContainer),
			on_tertiary_container: hexFromArgb(scheme.onTertiaryContainer),
			surface: hexFromArgb(scheme.surface),
			surface_container: hexFromArgb(scheme.surfaceContainer),
			surface_container_high: hexFromArgb(scheme.surfaceContainerHigh),
			surface_container_highest: hexFromArgb(scheme.surfaceContainerHighest),
			on_surface: hexFromArgb(scheme.onSurface),
			on_surface_variant: hexFromArgb(scheme.onSurfaceVariant),
			outline: hexFromArgb(scheme.outline),
			outline_variant: hexFromArgb(scheme.outlineVariant),
			scrim: hexFromArgb(scheme.scrim),
		}
	}
}
