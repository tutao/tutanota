// @flow

import o from "ospec"
import type {Theme, ThemeId, ThemeStorage} from "../../../src/gui/theme"
import {ThemeManager} from "../../../src/gui/theme"
import n from "../nodemocker"

o.spec("Theme Manager", function () {
	let themeManager: ThemeManager
	let themeStorageMock
	let htmlSanitizerMock
	o.beforeEach(function () {
		const themeStorage: ThemeStorage = {
			async getSelectedTheme(): Promise<?ThemeId> {
				return null
			},
			async setSelectedTheme(theme: ThemeId): Promise<void> {

			},
			async getThemes(): Promise<Array<Theme>> {
				return []
			},
			async setThemes(themes: $ReadOnlyArray<Theme>): Promise<void> {
			}
		}
		themeStorageMock = n.mock('__themeStorage', themeStorage).set()
		htmlSanitizerMock = n.mock('__htmlSanitizer', {
			sanitize: () => {
				return {
					text: "sanitized",
					externalContent: [],
					inlineImageCids: [],
					links: [],
				}
			}
		}).set()
		themeManager = new ThemeManager(themeStorageMock, () => Promise.resolve(htmlSanitizerMock))
	})

	o("updateCustomTheme", async function () {
		await themeManager.initialized
		const theme: $Shape<Theme> = {
			themeId: "HelloFancyId",
			content_bg: "#fffeee",
			logo: "unsanitized_logo"
		}
		await themeManager.updateCustomTheme(theme)

		const savedTheme = themeStorageMock.setThemes.args[0][0]

		o(savedTheme.themeId).equals("HelloFancyId")
		o(savedTheme.content_bg).equals("#fffeee")
		o(savedTheme.logo).equals("sanitized")
		o(savedTheme.content_fg).equals(themeManager.getDefaultTheme().content_fg)

		o(themeManager._theme.logo).equals("sanitized")
	})

})
