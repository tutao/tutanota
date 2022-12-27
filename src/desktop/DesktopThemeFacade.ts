import type { Theme, ThemeId } from "../gui/theme"
import { DesktopConfig } from "./config/DesktopConfig"
import { DesktopConfigKey } from "./config/ConfigKeys"
import { downcast } from "@tutao/tutanota-utils"
import { ThemeFacade } from "../native/common/generatedipc/ThemeFacade"
import { WindowManager } from "./DesktopWindowManager"

/**
 * ThemeManager impl like in other native parts.
 * 4 methods correspond to ThemeFacade from web plus two convenience methods getCurrentTheme() and getCurrentThemeWithFallback().
 */
export class DesktopThemeFacade implements ThemeFacade {
	constructor(private readonly config: DesktopConfig, private readonly wm: WindowManager) {}

	getSelectedTheme(): Promise<ThemeId | null> {
		return this.config.getVar(DesktopConfigKey.selectedTheme)
	}

	async setSelectedTheme(themeId: ThemeId) {
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
		const themeId = (await this.getSelectedTheme()) || "light"
		const themes = await this.getThemes()
		return themes.find((t) => t.themeId === themeId) ?? null
	}

	async getCurrentThemeWithFallback(): Promise<Theme> {
		let theme = await this.getCurrentTheme()

		if (theme == null) {
			const fallback = {
				themeId: "light-fallback",
				content_bg: "#ffffff",
				header_bg: "#ffffff",
			} as Partial<Theme>
			return downcast<Theme>(fallback)
		} else {
			return theme
		}
	}

	private async applyTheme() {
		for (const window of this.wm.getAll()) {
			await window.updateBackgroundColor()
		}
	}
}
