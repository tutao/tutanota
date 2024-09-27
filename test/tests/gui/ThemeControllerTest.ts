import o from "@tutao/otest"
import { ThemeController } from "../../../src/common/gui/ThemeController.js"
import type { ThemeCustomizations } from "../../../src/common/misc/WhitelabelCustomizations.js"
import { downcast } from "@tutao/tutanota-utils"
import { ThemeFacade } from "../../../src/common/native/common/generatedipc/ThemeFacade"
import { HtmlSanitizer } from "../../../src/common/misc/HtmlSanitizer.js"
import { matchers, object, when } from "testdouble"
import { verify } from "@tutao/tutanota-test-utils"
import { Theme } from "../../../src/common/gui/theme.js"
import { AppType } from "../../../src/common/misc/ClientConstants.js"

o.spec("ThemeController", function () {
	let themeManager: ThemeController
	let themeFacadeMock: ThemeFacade
	let htmlSanitizerMock: HtmlSanitizer
	let theme: Partial<Theme>

	o.beforeEach(async function () {
		theme = {}
		themeFacadeMock = object()
		when(themeFacadeMock.getThemes()).thenResolve([])

		htmlSanitizerMock = object()
		// this is called in the constructor. Eh!
		when(htmlSanitizerMock.sanitizeHTML(matchers.anything())).thenReturn({
			html: "sanitized",
			blockedExternalContent: 0,
			inlineImageCids: [],
			links: [],
		})
		themeManager = new ThemeController(theme, themeFacadeMock, () => Promise.resolve(htmlSanitizerMock), AppType.Integrated)
		await themeManager.initialized
	})

	o("updateCustomTheme", async function () {
		const theme: ThemeCustomizations = downcast({
			themeId: "HelloFancyId",
			content_bg: "#fffeee",
			logo: "unsanitized_logo",
			base: "light",
		})

		await themeManager.applyCustomizations(theme)

		const captor = matchers.captor()
		verify(themeFacadeMock.setThemes(captor.capture()))
		const savedTheme = captor.values![0][4]
		o(savedTheme.themeId).equals("HelloFancyId")
		o(savedTheme.content_bg).equals("#fffeee")
		o(savedTheme.logo).equals("sanitized")
		o(savedTheme.content_fg).equals(themeManager.getDefaultTheme().content_fg)
		o(themeManager.getCurrentTheme().logo).equals("sanitized")
	})

	o("when using automatic theme and preferring dark, dark theme is applied, and themeId is automatic", async function () {
		when(themeFacadeMock.getThemePreference()).thenResolve("auto:light|dark")
		when(themeFacadeMock.prefersDark()).thenResolve(true)

		await themeManager.reloadTheme()

		o(themeManager.getCurrentTheme().themeId).equals("dark")
		o(themeManager.themeId).equals("dark")
		o(themeManager.themePreference).equals("auto:light|dark")
	})

	o("when using automatic theme and preferring light, light theme is applied, and themeId is automatic", async function () {
		when(themeFacadeMock.getThemePreference()).thenResolve("auto:light|dark")
		when(themeFacadeMock.prefersDark()).thenResolve(false)

		await themeManager.reloadTheme()

		o(themeManager.getCurrentTheme().themeId).equals("light")
		o(themeManager.themeId).equals("light")
		o(themeManager.themePreference).equals("auto:light|dark")
	})

	o("when switching to automatic and preferring the light theme, light theme is applied, and themeId is automatic", async function () {
		when(themeFacadeMock.getThemePreference()).thenResolve("dark")
		await themeManager._initializeTheme()

		when(themeFacadeMock.prefersDark()).thenResolve(false)
		await themeManager.setThemePreference("automatic")

		o(themeManager.getCurrentTheme().themeId).equals("light")
		o(themeManager.themeId).equals("automatic")
	})
})
