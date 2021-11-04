// @flow

import {lang} from "../../misc/LanguageViewModel"
import {Dialog} from "../../gui/base/Dialog"
import {assertNotNull, downcast, neverNull} from "../../api/common/utils/Utils"
import {themeController} from "../../gui/theme"
import {Icons} from "../../gui/base/icons/Icons"
import {fileController} from "../../file/FileController"
import {ALLOWED_IMAGE_FORMATS, MAX_LOGO_SIZE} from "../../api/common/TutanotaConstants"
import {contains} from "../../api/common/utils/ArrayUtils"
import {uint8ArrayToBase64, utf8Uint8ArrayToString} from "../../api/common/utils/Encoding"
import m from "mithril"
import {ButtonN} from "../../gui/base/ButtonN"
import {TextFieldN} from "../../gui/base/TextFieldN"
import * as EditCustomColorsDialog from "./EditCustomColorsDialog"
import {CustomColorsEditorViewModel} from "./CustomColorsEditorViewModel"
import type {WhitelabelConfig} from "../../api/entities/sys/WhitelabelConfig"
import type {DomainInfo} from "../../api/entities/sys/DomainInfo"
import {update} from "../../api/main/Entity"
import type {ThemeCustomizations} from "../../misc/WhitelabelCustomizations"
import {locator} from "../../api/main/MainLocator"
import {logins} from "../../api/main/LoginController"

export type WhitelabelData = {
	customTheme: ThemeCustomizations,
	whitelabelConfig: WhitelabelConfig,
	whitelabelDomainInfo: DomainInfo,
}

export type WhitelabelThemeSettingsAttrs = {
	whitelabelData: null | WhitelabelData
}

export class WhitelabelThemeSettings implements MComponent<WhitelabelThemeSettingsAttrs> {

	view(vnode: Vnode<WhitelabelThemeSettingsAttrs>): Children {
		const {whitelabelData} = vnode.attrs
		return [
			this._renderCustomColorsField(whitelabelData),
			this.renderCustomLogoField(whitelabelData)
		]
	}

	_renderCustomColorsField(data: ?WhitelabelData): Children {
		return m(TextFieldN, {
				label: "customColors_label",
				value: () => this.areCustomColorsDefined(data?.customTheme)
					? lang.get("activated_label")
					: lang.get("deactivated_label"),
				disabled: true,
				injectionsRight: () => data ? this.renderCustomColorsFieldButtons(data) : null

			}
		)
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
				icon: () => Icons.Edit
			})
		]
	}

	renderCustomLogoField(data: ?WhitelabelData): Children {

		const customLogoTextfieldAttrs = {
			label: "customLogo_label",
			helpLabel: () => lang.get("customLogoInfo_msg"),
			value: () => lang.get(data?.customTheme.logo != null
				? "activated_label"
				: "deactivated_label"
			),
			disabled: true,
			injectionsRight: () => data ? this.renderCustomLogoFieldButtons(data) : null
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
							// flow doesn't seem to realize that ThemeCustomizations does in fact have logo
							delete downcast(customTheme).logo
							this.saveCustomTheme(customTheme, whitelabelConfig, whitelabelDomainInfo)
							if (logins.isWhitelabel()) {
								await themeController.updateCustomTheme(customTheme)
							}
						}
					},
					icon: () => Icons.Cancel
				})
				: null,
			m(ButtonN, {
				label: "edit_action",
				click: async () => {
					const files = await fileController.showFileChooser(false)
					let extension = files[0]
						.name
						.toLowerCase()
						.substring(files[0].name.lastIndexOf(".") + 1)

					if (files[0].size > MAX_LOGO_SIZE || !contains(ALLOWED_IMAGE_FORMATS, extension)) {
						Dialog.error("customLogoInfo_msg")
					} else {
						let imageData = null
						if (extension === "svg") {
							imageData = utf8Uint8ArrayToString(files[0].data)
						} else {
							imageData = "<img src=\"data:image/" +
								((extension === "jpeg") ? "jpg" : extension)
								+ ";base64," + uint8ArrayToBase64(files[0].data) + "\">"
						}
						customTheme.logo = imageData
						this.saveCustomTheme(customTheme, whitelabelConfig, whitelabelDomainInfo)
						if (logins.isWhitelabel()) {
							await themeController.updateCustomTheme(customTheme)
						}
					}
				},
				icon: () => Icons.Edit
			})
		]
	}

	async showCustomColorsDialog(customTheme: ThemeCustomizations, whitelabelConfig: WhitelabelConfig, whitelabelDomainInfo: ?DomainInfo) {
		const currentTheme = themeController.getCurrentTheme()
		const viewModel = new CustomColorsEditorViewModel(
			currentTheme,
			customTheme,
			whitelabelConfig,
			assertNotNull(whitelabelDomainInfo),
			themeController,
			locator.entityClient,
			logins
		)
		EditCustomColorsDialog.show(viewModel)
	}

	areCustomColorsDefined(theme: ?ThemeCustomizations): boolean {
		if (theme) {
			return Object.keys(theme).find(key => key !== "logo" && neverNull(theme)[key]) != null
		} else {
			return false
		}
	}

	saveCustomTheme(customTheme: ThemeCustomizations, whitelabelConfig: WhitelabelConfig, whitelabelDomainInfo: DomainInfo) {
		whitelabelConfig.jsonTheme = JSON.stringify(customTheme)
		update(whitelabelConfig)
		customTheme.themeId = whitelabelDomainInfo.domain
	}
}