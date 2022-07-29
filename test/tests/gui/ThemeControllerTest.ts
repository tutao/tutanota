import o from "ospec"
import {ThemeController} from "../../../src/gui/ThemeController.js"
import type {ThemeCustomizations} from "../../../src/misc/WhitelabelCustomizations.js"
import {downcast} from "@tutao/tutanota-utils"
import {ThemeFacade} from "../../../src/native/common/generatedipc/ThemeFacade"
import {HtmlSanitizer} from "../../../src/misc/HtmlSanitizer.js"
import {matchers, object, when} from "testdouble"
import {verify} from "@tutao/tutanota-test-utils"

o.spec("Theme Controller", function () {
	let themeManager: ThemeController
	let themeFacadeMock: ThemeFacade
	let htmlSanitizerMock: HtmlSanitizer

	o.beforeEach(async function () {
		themeFacadeMock = object()
		when(themeFacadeMock.getThemes()).thenResolve([])

		htmlSanitizerMock = object()
		// this is called in the constructor. Eh!
		when(htmlSanitizerMock.sanitizeHTML(matchers.anything())).thenReturn({
			html: "sanitized",
			externalContent: [],
			inlineImageCids: [],
			links: [],
		})
		themeManager = new ThemeController(themeFacadeMock, () => Promise.resolve(htmlSanitizerMock))
		await themeManager.initialized
	})

	o("updateCustomTheme", async function () {
		const theme: ThemeCustomizations = downcast({
			themeId: "HelloFancyId",
			content_bg: "#fffeee",
			logo: "unsanitized_logo",
			base: "light",
		})

		await themeManager.updateCustomTheme(theme)

		const captor = matchers.captor()
		verify(themeFacadeMock.setThemes(captor.capture()))
		const savedTheme = captor.values![0][3]
		o(savedTheme.themeId).equals("HelloFancyId")
		o(savedTheme.content_bg).equals("#fffeee")
		o(savedTheme.logo).equals("sanitized")
		o(savedTheme.content_fg).equals(themeManager.getDefaultTheme().content_fg)
		o(themeManager._theme.logo).equals("sanitized")
	})
})