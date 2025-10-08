import o from "@tutao/otest"
import { ThemeController } from "../../../src/common/gui/ThemeController.js"
import { ThemeCustomizations, WHITELABEL_CUSTOMIZATION_VERSION } from "../../../src/common/misc/WhitelabelCustomizations.js"
import { downcast } from "@tutao/tutanota-utils"
import { ThemeFacade } from "../../../src/common/native/common/generatedipc/ThemeFacade"
import { HtmlSanitizer } from "../../../src/common/misc/HtmlSanitizer.js"
import { matchers, object, when } from "testdouble"
import { spy, verify } from "@tutao/tutanota-test-utils"
import { Theme } from "../../../src/common/gui/theme.js"
import { AppType } from "../../../src/common/misc/ClientConstants.js"
import { WhitelabelThemeGenerator } from "../../../src/common/gui/WhitelabelThemeGenerator"

o.spec("ThemeController", () => {
	let themeManager: ThemeController
	let themeFacadeMock: ThemeFacade
	let htmlSanitizerMock: HtmlSanitizer
	let theme: Partial<Theme>
	let whitelabelGenerator: WhitelabelThemeGenerator

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
		whitelabelGenerator = object()
		themeManager = new ThemeController(theme, themeFacadeMock, () => Promise.resolve(htmlSanitizerMock), AppType.Integrated, whitelabelGenerator)
		await themeManager.initialized
	})

	o.test("updateCustomTheme", async () => {
		const theme: ThemeCustomizations = downcast({
			themeId: "HelloFancyId",
			surface: "#fffeee",
			logo: "unsanitized_logo",
			base: "light",
		})

		await themeManager.applyCustomizations(theme)

		const captor = matchers.captor()
		verify(themeFacadeMock.setThemes(captor.capture()))
		const savedTheme = captor.values![0][4]
		o.check(savedTheme.themeId).equals("HelloFancyId")
		o.check(savedTheme.surface).equals("#fffeee")
		o.check(savedTheme.logo).equals("sanitized")
		o.check(savedTheme.on_surface).equals(themeManager.getDefaultTheme().on_surface)
		o.check(themeManager.getCurrentTheme().logo).equals("sanitized")
	})

	o.spec("map new color tokens to old tokens", () => {
		o.test("light base theme", () => {
			const newTokenTheme: ThemeCustomizations = downcast({
				themeId: "HelloFancyId",
				base: "light",
				secondary: "secondary",
				on_secondary: "on_secondary",
				surface: "surface",
				on_surface: "on_surface",
				on_surface_variant: "on_surface_variant",
				primary: "primary",
				on_primary: "on_primary",
				outline: "outline",
				surface_container: "surface_container",
				surface_container_high: "surface_container_high",
				outline_variant: "outline_variant",
				scrim: "scrim",
				error: "error",

				// old token should be ignored and not overwrite generated ones
				navigation_menu_icon: "old_ignored",
				content_bg: "old_ignored",
				button_bubble_fg: "old_ignored",
			})

			o.check(ThemeController.mapNewToOldColorTokens(newTokenTheme)).deepEquals({
				themeId: "HelloFancyId",
				base: "light",
				secondary: "secondary",
				on_secondary: "on_secondary",
				surface: "surface",
				on_surface: "on_surface",
				on_surface_variant: "on_surface_variant",
				primary: "primary",
				on_primary: "on_primary",
				outline: "outline",
				surface_container: "surface_container",
				surface_container_high: "surface_container_high",
				outline_variant: "outline_variant",
				scrim: "scrim",
				error: "error",
				navigation_menu_icon: "on_secondary",
				content_bg: "surface",
				header_bg: "surface",
				list_bg: "surface",
				elevated_bg: "surface",
				content_fg: "on_surface",
				button_bubble_fg: "on_surface",
				content_button: "on_surface_variant",
				header_button: "on_surface_variant",
				navigation_button: "on_surface_variant",
				content_message_bg: "on_surface_variant",
				list_message_bg: "on_surface_variant",
				navigation_button_icon_bg: "on_surface_variant",
				content_accent: "primary",
				content_button_selected: "primary",
				header_button_selected: "primary",
				list_accent_fg: "primary",
				navigation_button_selected: "primary",
				content_button_icon: "on_primary",
				content_button_icon_selected: "on_primary",
				navigation_button_icon_selected: "on_primary",
				content_border: "outline",
				header_box_shadow_bg: "outline",
				list_alternate_bg: "surface_container",
				navigation_bg: "surface_container",
				navigation_button_icon: "surface_container",
				button_bubble_bg: "surface_container_high",
				navigation_menu_bg: "surface_container_high",
				list_border: "outline_variant",
				navigation_border: "outline_variant",
				modal_bg: "scrim",
			})
		})

		o.test("dark base theme", () => {
			const newTokenTheme: ThemeCustomizations = downcast({
				themeId: "HelloFancyId",
				base: "dark",
				secondary: "secondary",
				on_secondary: "on_secondary",
				surface: "surface",
				on_surface: "on_surface",
				on_surface_variant: "on_surface_variant",
				primary: "primary",
				on_primary: "on_primary",
				outline: "outline",
				surface_container: "surface_container",
				surface_container_high: "surface_container_high",
				outline_variant: "outline_variant",
				scrim: "scrim",
				error: "error",

				// old token should be ignored and not overwrite generated ones
				navigation_menu_icon: "old_ignored",
				content_bg: "old_ignored",
				button_bubble_fg: "old_ignored",
			})

			o.check(ThemeController.mapNewToOldColorTokens(newTokenTheme)).deepEquals({
				themeId: "HelloFancyId",
				base: "dark",
				secondary: "secondary",
				on_secondary: "on_secondary",
				surface: "surface",
				on_surface: "on_surface",
				on_surface_variant: "on_surface_variant",
				primary: "primary",
				on_primary: "on_primary",
				outline: "outline",
				surface_container: "surface_container",
				surface_container_high: "surface_container_high",
				outline_variant: "outline_variant",
				scrim: "scrim",
				error: "error",
				navigation_menu_icon: "on_secondary",
				content_bg: "surface",
				header_bg: "surface",
				list_bg: "surface",
				navigation_menu_bg: "surface",
				content_fg: "on_surface",
				button_bubble_fg: "on_surface",
				content_button: "on_surface_variant",
				header_button: "on_surface_variant",
				navigation_button: "on_surface_variant",
				content_message_bg: "on_surface_variant",
				list_message_bg: "on_surface_variant",
				navigation_button_icon_bg: "on_surface_variant",
				content_accent: "primary",
				content_button_selected: "primary",
				header_button_selected: "primary",
				list_accent_fg: "primary",
				navigation_button_selected: "primary",
				content_button_icon: "on_primary",
				content_button_icon_selected: "on_primary",
				navigation_button_icon_selected: "on_primary",
				content_border: "outline",
				header_box_shadow_bg: "outline",
				list_alternate_bg: "surface_container",
				navigation_bg: "surface_container",
				navigation_button_icon: "surface_container",
				elevated_bg: "surface_container",
				button_bubble_bg: "surface_container_high",
				list_border: "outline_variant",
				navigation_border: "outline_variant",
				modal_bg: "scrim",
			})
		})
	})

	o.test("when using automatic theme and preferring dark, dark theme is applied, and themeId is automatic", async () => {
		when(themeFacadeMock.getThemePreference()).thenResolve("auto:light|dark")
		when(themeFacadeMock.prefersDark()).thenResolve(true)

		await themeManager.reloadTheme()

		o.check(themeManager.getCurrentTheme().themeId).equals("dark")
		o.check(themeManager.themeId).equals("dark")
		o.check(themeManager.themePreference).equals("auto:light|dark")
	})

	o.test("when using automatic theme and preferring light, light theme is applied, and themeId is automatic", async () => {
		when(themeFacadeMock.getThemePreference()).thenResolve("auto:light|dark")
		when(themeFacadeMock.prefersDark()).thenResolve(false)

		await themeManager.reloadTheme()

		o.check(themeManager.getCurrentTheme().themeId).equals("light")
		o.check(themeManager.themeId).equals("light")
		o.check(themeManager.themePreference).equals("auto:light|dark")
	})

	o.test("when switching to automatic and preferring the light theme, light theme is applied, and themeId is automatic", async () => {
		when(themeFacadeMock.getThemePreference()).thenResolve("dark")
		await themeManager._initializeTheme()

		when(themeFacadeMock.prefersDark()).thenResolve(false)
		await themeManager.setThemePreference("automatic")

		o.check(themeManager.getCurrentTheme().themeId).equals("light")
		o.check(themeManager.themeId).equals("automatic")
	})

	o.spec("getMaterial3Customizations", () => {
		o.test("when theme has no color customization, material palette is not generated", async () => {
			const customizations = {
				logo: "nice_logo",
			}
			whitelabelGenerator = {
				generateMaterialPalette: spy(),
			}

			const material3Customizations = await themeManager.getMaterial3Customizations(customizations)
			o.check(whitelabelGenerator.generateMaterialPalette.callCount).equals(0)
			o.check(material3Customizations).deepEquals(downcast(customizations))
		})
		o.test("when theme is new, material palette is not generated", async () => {
			const customizations = {
				logo: "nice_logo",
				primary: "#ff00cc",
				content_accent: "#0ccfff",
				version: "1",
			}
			whitelabelGenerator = {
				generateMaterialPalette: spy(),
			}

			const material3Customizations = await themeManager.getMaterial3Customizations(downcast(customizations))
			o.check(whitelabelGenerator.generateMaterialPalette.callCount).equals(0)
			o.check(material3Customizations).deepEquals(downcast(customizations))
		})
		o.test("when old theme has color customization, material palette is generated", async () => {
			const customizations = {
				base: "light",
				content_accent: "#0ccfff",
				logo: "nice_logo",
			}
			when(whitelabelGenerator.generateMaterialPalette(matchers.anything())).thenResolve({
				primary: "#ffcc22",
				surface: "#cccccc",
			})

			const material3Theme = await themeManager.getMaterial3Customizations(customizations)
			o.check(material3Theme).deepEquals({
				base: "light",
				logo: "nice_logo",
				sourceColor: "#0ccfff",
				primary: "#ffcc22",
				surface: "#cccccc",
				version: WHITELABEL_CUSTOMIZATION_VERSION,
			})
		})
	})
})
