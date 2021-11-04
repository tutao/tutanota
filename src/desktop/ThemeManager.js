// @flow

import type {Theme, ThemeId} from "../gui/theme"
import {DesktopConfig} from "./config/DesktopConfig"
import {DesktopConfigKey} from "./config/ConfigKeys"
import {downcast} from "@tutao/tutanota-utils"

/**
 * ThemeManager impl like in other native parts.
 * 4 methods correspond to ThemeStorage from web plus two convenience methods getCurrentTheme() and getCurrentThemeWithFallback().
 */
export class ThemeManager {
	+_confg: DesktopConfig;

	constructor(config: DesktopConfig) {
		this._confg = config
	}

	getSelectedThemeId(): Promise<?ThemeId> {
		return this._confg.getVar(DesktopConfigKey.selectedTheme)
	}

	async setSelectedThemeId(themeId: ThemeId) {
		await this._confg.setVar(DesktopConfigKey.selectedTheme, themeId)
	}

	async getThemes(): Promise<Array<Theme>> {
		return (await this._confg.getVar(DesktopConfigKey.themes)) || []
	}

	async setThemes(themes: Array<Theme>) {
		await this._confg.setVar(DesktopConfigKey.themes, themes)
	}

	async getCurrentTheme(): Promise<?Theme> {
		const themeId = await this.getSelectedThemeId() || "light"
		const themes = await this.getThemes()
		return themes.find(t => t.themeId === themeId)
	}

	async getCurrentThemeWithFallback(): Promise<Theme> {
		let theme = await this.getCurrentTheme()
		if (theme == null) {
			theme = {
				themeId: "light-fallback",
				content_bg: "#ffffff",
				header_bg: "#ffffff",
			}
		}
		return downcast<Theme>(theme)
	}
}
