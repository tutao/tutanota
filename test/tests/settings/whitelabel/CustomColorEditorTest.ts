import o from "@tutao/otest"
import { CustomColorsEditorViewModel } from "../../../../src/common/settings/whitelabel/CustomColorsEditorViewModel.js"
import { ThemeController } from "../../../../src/common/gui/ThemeController.js"
import { DomainInfoTypeRef, WhitelabelConfigTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { downcast } from "@tutao/tutanota-utils"
import type { ThemeCustomizations } from "../../../../src/common/misc/WhitelabelCustomizations.js"
import { EntityClient } from "../../../../src/common/api/common/EntityClient.js"
import { themes } from "../../../../src/common/gui/builtinThemes.js"
import type { LoginController } from "../../../../src/common/api/main/LoginController.js"
import { spy } from "@tutao/tutanota-test-utils"
import { createTestEntity } from "../../TestUtils.js"

o.spec("SimpleColorEditor", function () {
	let model: CustomColorsEditorViewModel
	let themeController: ThemeController
	let whitelabelConfig
	let whitelabelDomainInfo
	let defaultTheme
	// These customizations should always be set if no changes are made
	const defaultCustomizations: ThemeCustomizations = downcast({
		primary: "#850122",
		base: "light",
	})
	let entityClient: EntityClient
	let loginController: LoginController
	let isWhitelabelEnabled: boolean = false
	o.beforeEach(function () {
		isWhitelabelEnabled = false
		themeController = {
			applyCustomizations: spy(),
			getDefaultTheme: () => {
				return themes()["light"]
			},
		} as Partial<ThemeController> as ThemeController
		whitelabelConfig = createTestEntity(WhitelabelConfigTypeRef)
		whitelabelDomainInfo = createTestEntity(DomainInfoTypeRef)
		whitelabelDomainInfo.domain = "test.domain.com"
		defaultTheme = themeController.getDefaultTheme()
		entityClient = downcast({
			update: spy(),
		})
		loginController = downcast({
			isWhitelabel: () => {
				return isWhitelabelEnabled
			},
		})
	})
	o.spec("openEditor", function () {
		o("open Editor without custom theme, default values should be applied no matter what", function () {
			const customizations: ThemeCustomizations = downcast({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
			)
			o(model.accentColor).equals("#850122")
			o(model.baseThemeId).equals("light")
			o(themeController.applyCustomizations.callCount).equals(1)
		})
		o("open Editor with custom theme, all customizations should be applied", async function () {
			const customizations: ThemeCustomizations = downcast({
				themeId: "test.domain.com",
				primary: "#ee051f",
				base: "dark",
				surface: "#1df3ed",
				scrim: "#1aa1aa",
			})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
			)
			o(model.accentColor).equals(customizations.primary!)
			o(model.baseThemeId).equals(customizations.base!)
			await model.save()
			o(entityClient.update.callCount).equals(1)
			o(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(customizations)
		})
	})
	o.spec("addCustomization", function () {
		o("valid value is applied", async function () {
			const customizations: ThemeCustomizations = downcast({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
			)
			model.addCustomization("on_surface_variant", "#abcdef")
			model.addCustomization("scrim", "#fedcba")
			// should only contain 2 customizations here
			o(model.customizations).deepEquals(
				downcast(
					Object.assign({}, defaultCustomizations, {
						on_surface_variant: "#abcdef",
						scrim: "#fedcba",
					}),
				),
			)
			await model.save()
			o(entityClient.update.callCount).equals(1)
			// should now equal the themeCustomizations including accentColor and baseTheme
			o(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(
				Object.assign({}, defaultCustomizations, {
					on_surface_variant: "#abcdef",
					scrim: "#fedcba",
					themeId: "test.domain.com",
				}),
			)
		})
		// Invalid practically means 'empty' as well but I created a separate test just for that
		o("invalid value is not applied", function () {
			const customizations: ThemeCustomizations = downcast({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
			)
			model.addCustomization("scrim", "#false")
			model.addCustomization("secondary", "#69")
			model.addCustomization("on_surface", "#zzzzzz")
			model.addCustomization("surface_container", "#abcdefghi")
			// Customizations should hold the wrong key
			o(model.customizations).deepEquals(
				downcast(
					Object.assign({}, defaultCustomizations, {
						scrim: "#false",
						secondary: "#69",
						on_surface: "#zzzzzz",
						surface_container: "#abcdefghi",
					}),
				),
			)
			//	When assembling it should however remove the wrong key
			o(model._filterAndReturnCustomizations()).deepEquals(defaultCustomizations)
		})
		o("valid and invalid, only valid is applied", function () {
			const customizations: ThemeCustomizations = downcast({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
			)
			model.addCustomization("scrim", "#fedcba")
			model.addCustomization("secondary", "#69")
			model.addCustomization("on_surface", "#deffed")
			model.addCustomization("surface_container", "#abcdefghi")
			model.addCustomization("on_surface_variant", "#abcdef")
			o(model.customizations).deepEquals(
				downcast(
					Object.assign({}, defaultCustomizations, {
						scrim: "#fedcba",
						secondary: "#69",
						on_surface: "#deffed",
						surface_container: "#abcdefghi",
						on_surface_variant: "#abcdef",
					}),
				),
			)
			o(model._filterAndReturnCustomizations()).deepEquals(
				Object.assign({}, defaultCustomizations, {
					scrim: "#fedcba",
					on_surface: "#deffed",
					on_surface_variant: "#abcdef",
				}),
			)
		})
		o("empty customizations should be cleared out", function () {
			const customizations: ThemeCustomizations = downcast({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
			)
			model.addCustomization("scrim", "")
			model.addCustomization("on_surface", "")
			model.addCustomization("on_surface_variant", "")

			// usually this is called on its own, since theres a debounce however it doesnt work in this test
			model._removeEmptyCustomizations()

			o(model.customizations).deepEquals(defaultCustomizations)
		})
	})
	o.spec("closeEditor", function () {
		o("pressed cancel, all values should reset", async function () {
			const customizations: ThemeCustomizations = downcast({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
			)
			await model.resetActiveClientTheme()
			// Should equal 2 since we call it once upon opening and then once when closing
			o(themeController.applyCustomizations.callCount).equals(2)
			o(themeController.applyCustomizations.args[0]).deepEquals(
				Object.assign({}, defaultTheme, {
					base: null,
				}),
			)
		})
		o("pressed save, all custom values should be saved", async function () {
			const customizations: ThemeCustomizations = downcast({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
			)
			model.addCustomization("scrim", "#fedcba")
			model.addCustomization("on_surface", "#deffed")
			model.changeBaseTheme("dark")
			model.changeAccentColor("#aaaaaa")
			await model.save()
			o(entityClient.update.callCount).equals(1)
			o(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(
				Object.assign({}, defaultCustomizations, {
					scrim: "#fedcba",
					on_surface: "#deffed",
					base: "dark",
					primary: "#aaaaaa",
					themeId: "test.domain.com",
				}),
			)
		})
		o("pressed save when on whitelabelDomain, should not revert back to initial theme", async function () {
			const customizations: ThemeCustomizations = downcast({})
			isWhitelabelEnabled = true
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
			)
			await model.save()
			// Should equal 1 here since we call updateCustomTheme once when initializing the viewModel, and then not anymore when saving
			o(themeController.applyCustomizations.callCount).equals(1)
		})
	})
	o.spec("changeAccentColor", function () {
		o("changing accent changed preview", async function () {
			const customizations: ThemeCustomizations = downcast({})
			const expectedCustomizations = {
				primary: "#ff00f2",
				themeId: "test.domain.com",
			}
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
			)
			model.changeAccentColor("#ff00f2")
			o(themeController.applyCustomizations.callCount).equals(1)
			await model.save()
			o(entityClient.update.callCount).equals(1)
			o(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(
				Object.assign({}, expectedCustomizations, {
					base: "light",
				}),
			)
			o(themeController.applyCustomizations.callCount).equals(2) // called twice since we a) set the preview and b) return to previous theme
		})
	})
	o.spec("changeBaseTheme", function () {
		o("does not overwrite custom colors and changes preview", async function () {
			const customizations: ThemeCustomizations = downcast({})
			const expectedCustomizations = {
				themeId: "test.domain.com",
				base: "dark",
			}
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
			)
			model.changeBaseTheme("dark")
			await model.save()
			o(entityClient.update.callCount).equals(1)
			// We have to do base -> customizations because otherwise we would overwrite the 'base' key
			o(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(Object.assign({}, defaultCustomizations, expectedCustomizations))
		})
	})
})
