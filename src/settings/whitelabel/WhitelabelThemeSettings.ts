import {lang} from "../../misc/LanguageViewModel"
import {Dialog} from "../../gui/base/Dialog"
import {assertNotNull, downcast, neverNull} from "@tutao/tutanota-utils"
import {themeController} from "../../gui/theme"
import {Icons} from "../../gui/base/icons/Icons"
import {ALLOWED_IMAGE_FORMATS, MAX_LOGO_SIZE} from "../../api/common/TutanotaConstants"
import {contains} from "@tutao/tutanota-utils"
import {uint8ArrayToBase64, utf8Uint8ArrayToString} from "@tutao/tutanota-utils"
import m, {Children, Component, Vnode} from "mithril"
import {ButtonN} from "../../gui/base/ButtonN"
import {TextFieldAttrs, TextFieldN} from "../../gui/base/TextFieldN"
import * as EditCustomColorsDialog from "./EditCustomColorsDialog"
import {CustomColorsEditorViewModel} from "./CustomColorsEditorViewModel"
import type {WhitelabelConfig} from "../../api/entities/sys/TypeRefs.js"
import type {DomainInfo} from "../../api/entities/sys/TypeRefs.js"
import type {ThemeCustomizations} from "../../misc/WhitelabelCustomizations"
import {locator} from "../../api/main/MainLocator"
import {logins} from "../../api/main/LoginController"
import Stream from "mithril/stream";

export type WhitelabelData = {
	customTheme: ThemeCustomizations
	whitelabelConfig: WhitelabelConfig
	whitelabelDomainInfo: DomainInfo
}
export type WhitelabelThemeSettingsAttrs = {
	whitelabelData: null | WhitelabelData
}

export class WhitelabelThemeSettings implements Component<WhitelabelThemeSettingsAttrs> {
	view(vnode: Vnode<WhitelabelThemeSettingsAttrs>): Children {
		const {whitelabelData} = vnode.attrs
		return [this._renderCustomColorsField(whitelabelData), this.renderCustomLogoField(whitelabelData)]
	}

	_renderCustomColorsField(data: WhitelabelData | null): Children {
		return m(TextFieldN, {
			label: "customColors_label",
			value: this.areCustomColorsDefined(data?.customTheme ?? null)
				? lang.get("activated_label")
				: lang.get("deactivated_label"),
			disabled: true,
			injectionsRight: () => (data ? this.renderCustomColorsFieldButtons(data) : null),
		})
	}

	renderCustomColorsFieldButtons({customTheme, whitelabelConfig, whitelabelDomainInfo}: WhitelabelData): Children {
		return [
			this.areCustomColorsDefined(customTheme)
				? m(ButtonN, {
					label: "deactivate_action",
					click: async () => {
						const confirmed = await Dialog.confirm("confirmDeactivateCustomColors_msg")

						if (confirmed) {
							Object.keys(customTheme).forEach(key => {
								if (key !== "logo") {
									delete downcast(customTheme)[key]
								}
							})
							this.saveCustomTheme(customTheme, whitelabelConfig, whitelabelDomainInfo)

							if (logins.isWhitelabel()) {
								await themeController.updateCustomTheme(customTheme)
							}
						}
					},
					icon: () => Icons.Cancel,
				})
				: null,
			m(ButtonN, {
				label: "edit_action",
				click: () => this.showCustomColorsDialog(customTheme, whitelabelConfig, whitelabelDomainInfo),
				icon: () => Icons.Edit,
			}),
		]
	}

	renderCustomLogoField(data: WhitelabelData | null): Children {
		const customLogoTextfieldAttrs: TextFieldAttrs = {
			label: "customLogo_label",
			helpLabel: () => lang.get("customLogoInfo_msg"),
			value: lang.get(data?.customTheme.logo != null ? "activated_label" : "deactivated_label"),
			disabled: true,
			injectionsRight: () => (data ? this.renderCustomLogoFieldButtons(data) : null),
		}
		return m(TextFieldN, customLogoTextfieldAttrs)
	}

	renderCustomLogoFieldButtons({customTheme, whitelabelDomainInfo, whitelabelConfig}: WhitelabelData): Children {
		return [
			customTheme.logo
				? m(ButtonN, {
					label: "deactivate_action",
					click: async () => {
						const confirmed = await Dialog.confirm("confirmDeactivateCustomLogo_msg")

						if (confirmed) {
							delete customTheme.logo
							this.saveCustomTheme(customTheme, whitelabelConfig, whitelabelDomainInfo)

							if (logins.isWhitelabel()) {
								await themeController.updateCustomTheme(customTheme)
							}
						}
					},
					icon: () => Icons.Cancel,
				})
				: null,
			m(ButtonN, {
				label: "edit_action",
				click: async () => {
					const files = await locator.fileController.showFileChooser(false)
					let extension = files[0].name.toLowerCase().substring(files[0].name.lastIndexOf(".") + 1)

					if (files[0].size > MAX_LOGO_SIZE || !contains(ALLOWED_IMAGE_FORMATS, extension)) {
						Dialog.message("customLogoInfo_msg")
					} else {
						let imageData: string

						if (extension === "svg") {
							imageData = utf8Uint8ArrayToString(files[0].data)
						} else {
							imageData =
								'<img src="data:image/' + (extension === "jpeg" ? "jpg" : extension) + ";base64," + uint8ArrayToBase64(files[0].data) + '">'
						}

						customTheme.logo = imageData
						this.saveCustomTheme(customTheme, whitelabelConfig, whitelabelDomainInfo)

						if (logins.isWhitelabel()) {
							await themeController.updateCustomTheme(customTheme)
						}
					}
				},
				icon: () => Icons.Edit,
			}),
		]
	}

	async showCustomColorsDialog(customTheme: ThemeCustomizations, whitelabelConfig: WhitelabelConfig, whitelabelDomainInfo: DomainInfo | null) {
		const currentTheme = themeController.getCurrentTheme()
		const viewModel = new CustomColorsEditorViewModel(
			currentTheme,
			customTheme,
			whitelabelConfig,
			assertNotNull(whitelabelDomainInfo),
			themeController,
			locator.entityClient,
			logins,
		)
		EditCustomColorsDialog.show(viewModel)
	}

	areCustomColorsDefined(theme: ThemeCustomizations | null): boolean {
		if (theme) {
			return Object.keys(theme).some(key =>
				key !== "logo"
				// @ts-ignore
				&& theme?.[key]
			)
		} else {
			return false
		}
	}

	saveCustomTheme(customTheme: ThemeCustomizations, whitelabelConfig: WhitelabelConfig, whitelabelDomainInfo: DomainInfo) {
		whitelabelConfig.jsonTheme = JSON.stringify(customTheme)
		locator.entityClient.update(whitelabelConfig)
		customTheme.themeId = whitelabelDomainInfo.domain
	}
}