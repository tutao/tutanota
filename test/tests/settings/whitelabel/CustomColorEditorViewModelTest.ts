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
import { WhitelabelThemeGenerator } from "../../../../src/common/gui/WhitelabelThemeGenerator"
import { matchers, object, when } from "testdouble"

o.spec("CustomColorEditorViewModel", function () {
	let model: CustomColorsEditorViewModel
	let themeController: ThemeController
	let whitelabelConfig
	let whitelabelDomainInfo
	let defaultTheme
	let whitelabelThemeGenerator: WhitelabelThemeGenerator
	// These customizations should always be set if no changes are made
	const defaultCustomizations: ThemeCustomizations = downcast({
		primary: "#8F4A4E",
		base: "light",
		version: 1,
	})
	let entityClient: EntityClient
	let loginController: LoginController
	let isWhitelabelEnabled: boolean = false
	o.beforeEach(function () {
		isWhitelabelEnabled = false
		themeController = {
			applyCustomizations: spy(),
			resetTheme: spy(),
			getDefaultTheme: () => {
				return themes()["light"]
			},
		} as Partial<ThemeController> as ThemeController
		whitelabelThemeGenerator = object()
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
		o("open Editor without custom theme, default values should be applied no matter what", async () => {
			const customizations: ThemeCustomizations = downcast({})
			when(whitelabelThemeGenerator.generateMaterialTheme(matchers.anything())).thenResolve({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
				whitelabelThemeGenerator,
			)
			await model._waitInited()
			o(model.accentColor).equals("#8F4A4E")
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
			when(whitelabelThemeGenerator.generateMaterialTheme(matchers.anything())).thenResolve({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
				whitelabelThemeGenerator,
			)
			o(model.accentColor).equals(customizations.primary!)
			o(model.baseThemeId).equals(customizations.base!)
			await model.save()
			o(entityClient.update.callCount).equals(1)
			o(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(ThemeController.mapNewToOldColorTokens(customizations))
		})
	})
	o.spec("closeEditor", function () {
		o("pressed cancel, all values should reset", async function () {
			const customizations: ThemeCustomizations = downcast({})
			when(whitelabelThemeGenerator.generateMaterialTheme(matchers.anything())).thenResolve({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
				whitelabelThemeGenerator,
			)
			await model._waitInited()
			await model.resetActiveClientTheme()
			o(themeController.applyCustomizations.callCount).equals(1)
			o(themeController.resetTheme.callCount).equals(1)
		})
		o("pressed save, all custom values should be saved", async function () {
			const customizations: ThemeCustomizations = downcast({})
			when(whitelabelThemeGenerator.generateMaterialTheme(matchers.anything())).thenResolve({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
				whitelabelThemeGenerator,
			)
			await model._waitInited()
			model.customizations["scrim"] = "#fedcba"
			model.customizations["on_surface"] = "#deffed"
			model.changeBaseTheme("dark")
			model.changeAccentColor("#aaaaaa")
			await model.save()
			o(entityClient.update.callCount).equals(1)
			o(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(
				ThemeController.mapNewToOldColorTokens(
					Object.assign({}, defaultCustomizations, {
						scrim: "#fedcba",
						on_surface: "#deffed",
						base: "dark",
						primary: "#aaaaaa",
						themeId: "test.domain.com",
					}),
				),
			)
		})
		o("pressed save when on whitelabelDomain, should not revert back to initial theme", async function () {
			const customizations: ThemeCustomizations = downcast({})
			isWhitelabelEnabled = true
			when(whitelabelThemeGenerator.generateMaterialTheme(matchers.anything())).thenResolve({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
				whitelabelThemeGenerator,
			)
			await model._waitInited()
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
			when(whitelabelThemeGenerator.generateMaterialTheme(matchers.anything())).thenResolve({
				primary_container: "blah",
			})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
				whitelabelThemeGenerator,
			)
			await model._waitInited()
			await model.changeAccentColor("#ff00f2")
			o(themeController.applyCustomizations.callCount).equals(2) // inited and then changed accent color
			await model.save()
			o(entityClient.update.callCount).equals(1)
			o(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(
				Object.assign({}, ThemeController.mapNewToOldColorTokens(expectedCustomizations), {
					base: "light",
					version: 1,
					primary_container: "blah",
				}),
			)
			o(themeController.applyCustomizations.callCount).equals(2) // unchanged
			o(themeController.resetTheme.callCount).equals(1)
		})
	})
	o.spec("changeBaseTheme", function () {
		o("does not overwrite custom colors and changes preview", async function () {
			const customizations: ThemeCustomizations = downcast({})
			const expectedCustomizations = {
				themeId: "test.domain.com",
				base: "dark",
			}
			when(whitelabelThemeGenerator.generateMaterialTheme(matchers.anything())).thenResolve({})
			model = new CustomColorsEditorViewModel(
				defaultTheme,
				customizations,
				whitelabelConfig,
				whitelabelDomainInfo,
				themeController,
				entityClient,
				loginController,
				whitelabelThemeGenerator,
			)
			await model._waitInited()
			model.changeBaseTheme("dark")
			await model.save()
			o(entityClient.update.callCount).equals(1)
			// We have to do base -> customizations because otherwise we would overwrite the 'base' key
			o(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(
				ThemeController.mapNewToOldColorTokens(Object.assign({}, defaultCustomizations, expectedCustomizations)),
			)
		})
	})
})
