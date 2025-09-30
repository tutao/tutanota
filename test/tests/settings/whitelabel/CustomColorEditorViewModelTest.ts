import o from "@tutao/otest"
import { CustomColorsEditorViewModel } from "../../../../src/common/settings/whitelabel/CustomColorsEditorViewModel.js"
import { ThemeController } from "../../../../src/common/gui/ThemeController.js"
import { DomainInfoTypeRef, WhitelabelConfigTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { downcast } from "@tutao/tutanota-utils"
import type { ThemeCustomizations } from "../../../../src/common/misc/WhitelabelCustomizations.js"
import { WHITELABEL_CUSTOMIZATION_VERSION } from "../../../../src/common/misc/WhitelabelCustomizations.js"
import { EntityClient } from "../../../../src/common/api/common/EntityClient.js"
import { themes } from "../../../../src/common/gui/builtinThemes.js"
import type { LoginController } from "../../../../src/common/api/main/LoginController.js"
import { spy } from "@tutao/tutanota-test-utils"
import { createTestEntity } from "../../TestUtils.js"
import { WhitelabelThemeGenerator } from "../../../../src/common/gui/WhitelabelThemeGenerator"
import { matchers, object, when } from "testdouble"
import { BaseThemeId, MaterialPalette, Theme } from "../../../../src/common/gui/theme"

o.spec("CustomColorEditorViewModel", () => {
	let model: CustomColorsEditorViewModel
	let themeController: ThemeController
	let whitelabelConfig
	let whitelabelDomainInfo
	let defaultTheme
	let whitelabelThemeGenerator: WhitelabelThemeGenerator
	// These customizations should always be set if no changes are made
	const defaultCustomizations: Readonly<ThemeCustomizations> = downcast(
		Object.freeze({
			sourceColor: "#8F4A4E",
			base: "light",
			version: WHITELABEL_CUSTOMIZATION_VERSION,
		}),
	)
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
			getBaseTheme(baseId: BaseThemeId): Theme {
				return themes()[baseId]
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
	o.spec("openEditor", () => {
		o.test("open Editor without custom theme, default values should be applied no matter what", async () => {
			const customizations: ThemeCustomizations = downcast({})
			when(whitelabelThemeGenerator.generateMaterialPalette(matchers.anything())).thenResolve({ outline_variant: "#aabbcc" })
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
			await model.init()
			o.check(model.sourceColor).equals(defaultCustomizations.sourceColor)
			o.check(model.baseThemeId).equals(defaultCustomizations.base)
			o.check(themeController.applyCustomizations.callCount).equals(1)
		})
		o.test("open Editor with custom theme, all customizations should be applied", async () => {
			const customizations: ThemeCustomizations = downcast({
				themeId: "test.domain.com",
				sourceColor: "#ee051f",
				base: "dark",
			})
			const materialPalette: Partial<MaterialPalette> = {
				surface: "#1df3ed",
				scrim: "#1aa1aa",
				outline_variant: "#a8b89a",
			}
			when(whitelabelThemeGenerator.generateMaterialPalette(matchers.anything())).thenResolve(materialPalette)
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
			await model.init()
			o.check(model.sourceColor).equals(customizations.sourceColor)
			o.check(model.baseThemeId).equals(customizations.base)
			await model.save()
			o.check(entityClient.update.callCount).equals(1)
			o.check(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(
				ThemeController.mapNewToOldColorTokens(
					Object.assign({}, defaultCustomizations, customizations, materialPalette, {
						themeId: "test.domain.com",
						state_bg_hover: "#a8b89a77",
						state_bg_focus: "#a8b89a99",
						state_bg_active: "#a8b89aaa",
					}),
				),
			)
		})
	})
	o.spec("closeEditor", () => {
		o.test("pressed cancel, all values should reset", async () => {
			const customizations: ThemeCustomizations = downcast({})
			when(whitelabelThemeGenerator.generateMaterialPalette(matchers.anything())).thenResolve({ outline_variant: "#aabbcc" })
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
			await model.init()
			await model.resetActiveClientTheme()
			o.check(themeController.applyCustomizations.callCount).equals(1)
			o.check(themeController.resetTheme.callCount).equals(1)
		})
		o.test("pressed save, all custom values should be saved", async () => {
			const customizations: ThemeCustomizations = downcast({})
			const expectedCustomizations: Partial<ThemeCustomizations> = {
				scrim: "#fedcba",
				on_surface: "#deffed",
				base: "dark",
				sourceColor: "#aaaaaa",
				themeId: "test.domain.com",
				outline_variant: "#a8b89a",
				state_bg_hover: "#a8b89a77",
				state_bg_focus: "#a8b89a99",
				state_bg_active: "#a8b89aaa",
			}
			when(whitelabelThemeGenerator.generateMaterialPalette(matchers.anything())).thenResolve({ outline_variant: "#a8b89a" })
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
			await model.init()
			await model.changeBaseTheme("dark")
			await model.changeSourceColor("#aaaaaa")
			model.customizations["scrim"] = "#fedcba"
			model.customizations["on_surface"] = "#deffed"
			await model.save()
			o.check(entityClient.update.callCount).equals(1)
			o.check(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(
				ThemeController.mapNewToOldColorTokens(Object.assign({}, defaultCustomizations, expectedCustomizations)),
			)
		})
		o.test("pressed save when on non-whitelabel domain, should not revert back to initial theme", async () => {
			const customizations: ThemeCustomizations = downcast({})
			when(whitelabelThemeGenerator.generateMaterialPalette(matchers.anything())).thenResolve({ outline_variant: "#aabbcc" })
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
			await model.init()
			await model.save()
			o.check(themeController.applyCustomizations.callCount).equals(1)
			o.check(themeController.resetTheme.callCount).equals(1)
		})
		o.test("pressed save when on whitelabel domain, should not revert back to initial theme", async () => {
			const customizations: ThemeCustomizations = downcast({})
			isWhitelabelEnabled = true
			when(whitelabelThemeGenerator.generateMaterialPalette(matchers.anything())).thenResolve({ outline_variant: "#aabbcc" })
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
			await model.init()
			await model.save()
			// Should equal 1 here since we call updateCustomTheme once when initializing the viewModel, and then not anymore when saving
			o.check(themeController.applyCustomizations.callCount).equals(1)
		})
	})
	o.spec("changeSourceColor", () => {
		o.test("changing sourceColor changed preview", async () => {
			const customizations: ThemeCustomizations = downcast({})
			const expectedCustomizations: Partial<ThemeCustomizations> = {
				sourceColor: "#ffccf2",
				primary_container: "blah",
				themeId: "test.domain.com",
				outline_variant: "#aa7863",
				state_bg_hover: "#aa786344",
				state_bg_focus: "#aa786355",
				state_bg_active: "#aa786366",
			}
			when(whitelabelThemeGenerator.generateMaterialPalette(matchers.anything())).thenResolve({
				primary_container: "blah",
				outline_variant: "#aa7863",
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
			await model.init()
			await model.changeSourceColor("#ffccf2")
			o.check(themeController.applyCustomizations.callCount).equals(2) // inited and then changed source color
			await model.save()
			o.check(entityClient.update.callCount).equals(1)
			o.check(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(
				ThemeController.mapNewToOldColorTokens(Object.assign({}, defaultCustomizations, expectedCustomizations)),
			)
			o.check(themeController.applyCustomizations.callCount).equals(2) // unchanged
			o.check(themeController.resetTheme.callCount).equals(1)
		})
	})
	o.spec("changeBaseTheme", () => {
		o.test("does not overwrite custom colors and changes preview", async () => {
			const customizations: ThemeCustomizations = downcast({})
			const expectedCustomizations: Partial<ThemeCustomizations> = {
				themeId: "test.domain.com",
				base: "dark",
				outline_variant: "#aa7863",
				state_bg_hover: "#aa786377",
				state_bg_focus: "#aa786399",
				state_bg_active: "#aa7863aa",
			}
			when(whitelabelThemeGenerator.generateMaterialPalette(matchers.anything())).thenResolve({
				outline_variant: "#aa7863",
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
			await model.init()
			await model.changeBaseTheme("dark")
			await model.save()
			o.check(entityClient.update.callCount).equals(1)
			// We have to do base -> customizations because otherwise we would overwrite the 'base' key
			o.check(JSON.parse(entityClient.update.args[0].jsonTheme)).deepEquals(
				ThemeController.mapNewToOldColorTokens(Object.assign({}, defaultCustomizations, expectedCustomizations)),
			)
		})
	})
	o.spec("set state colors", () => {
		o.test("generate state bg colors from outline_variant for light theme", async () => {
			const customizations: ThemeCustomizations = downcast({})
			when(whitelabelThemeGenerator.generateMaterialPalette(matchers.anything())).thenResolve({
				outline_variant: "#aef643",
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
			await model.init()
			o.check(model.customizations.state_bg_hover).equals("#aef64344")
			o.check(model.customizations.state_bg_focus).equals("#aef64355")
			o.check(model.customizations.state_bg_active).equals("#aef64366")
		})
		o.test("generate state bg colors from outline_variant for dark theme", async () => {
			const customizations: ThemeCustomizations = downcast({})
			when(whitelabelThemeGenerator.generateMaterialPalette(matchers.anything())).thenResolve({
				outline_variant: "#aef643",
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
			await model.init()
			await model.changeBaseTheme("dark")
			o.check(model.customizations.state_bg_hover).equals("#aef64377")
			o.check(model.customizations.state_bg_focus).equals("#aef64399")
			o.check(model.customizations.state_bg_active).equals("#aef643aa")
		})
	})
})
