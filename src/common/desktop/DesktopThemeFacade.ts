import type { Theme, ThemeId, ThemePreference } from "../gui/theme"
import { DesktopConfig } from "./config/DesktopConfig"
import { DesktopConfigKey } from "./config/ConfigKeys"
import { ThemeFacade } from "../native/common/generatedipc/ThemeFacade"
import { WindowManager } from "./DesktopWindowManager"
import electron from "electron"

const LIGHT_FALLBACK_THEME: Partial<Theme> = {
	themeId: "light-fallback",
	content_bg: "#ffffff",
	header_bg: "#ffffff",
	navigation_bg: "#f6f6f6",
}

/**
 * ThemeManager impl like in other native parts.
 * 4 methods correspond to ThemeFacade from web plus two convenience methods getCurrentTheme() and getCurrentThemeWithFallback().
 */
export class DesktopThemeFacade implements ThemeFacade {
	constructor(private readonly config: DesktopConfig, private readonly wm: WindowManager, private readonly nativeTheme: Electron.NativeTheme) {}

	init() {
		electron.nativeTheme.on("updated", () => {
			for (const window of this.wm.getAll()) {
				window.commonNativeFacade.updateTheme()
				window.updateBackgroundColor()
			}
		})
	}

	getThemePreference(): Promise<ThemePreference | null> {
		return this.config.getVar(DesktopConfigKey.selectedTheme)
	}

	async setThemePreference(themeId: ThemePreference) {
		await this.config.setVar(DesktopConfigKey.selectedTheme, themeId)
		await this.applyTheme()
	}

	async getThemes(): Promise<Array<Theme>> {
		return (await this.config.getVar(DesktopConfigKey.themes)) || []
	}

	async setThemes(themes: Array<Theme>) {
		await this.config.setVar(DesktopConfigKey.themes, themes)
		await this.applyTheme()
	}

	async getCurrentTheme(): Promise<Theme | null> {
		const themeId = await this.resolveThemePreference()
		const themes = await this.getThemes()
		return themes.find((t) => t.themeId === themeId) ?? null
	}

	async getCurrentThemeWithFallback(): Promise<Theme> {
		const theme = await this.getCurrentTheme()
		return theme ? { ...LIGHT_FALLBACK_THEME, ...theme } : (LIGHT_FALLBACK_THEME as Theme)
	}

	async prefersDark(): Promise<boolean> {
		return this.nativeTheme.shouldUseDarkColors
	}

	private async applyTheme() {
		for (const window of this.wm.getAll()) {
			await window.updateBackgroundColor()
		}
	}

	private async resolveThemePreference(): Promise<ThemeId> {
		const pref = await this.getThemePreference()
		if (pref === "auto:light|dark") {
			return this.nativeTheme.shouldUseDarkColors ? "dark" : "light"
		} else {
			return pref ?? "light"
		}
	}
}
