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
import stream from "mithril/stream/stream.js"
import {ButtonN} from "../../gui/base/ButtonN"
import {TextFieldN} from "../../gui/base/TextFieldN"
import * as EditCustomColorsDialog from "./EditCustomColorsDialog"
import {CustomColorsEditorViewModel} from "./CustomColorsEditorViewModel"
import type {WhitelabelConfig} from "../../api/entities/sys/WhitelabelConfig"
import type {DomainInfo} from "../../api/entities/sys/DomainInfo"
import {update} from "../../api/main/Entity"
import type {ThemeCustomizations} from "../../misc/WhitelabelCustomizations"
import {locator} from "../../api/main/MainLocator"
import {EntityClient} from "../../api/common/EntityClient"
import type {LoginController} from "../../api/main/LoginController"
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
			this._renderCustomColorsConfig(whitelabelData),
			this._renderCustomLogoConfig(whitelabelData)
		]
	}

	_renderCustomLogoConfig(data: ?WhitelabelData): Children {
		const customLogoDefined = data?.customTheme.logo != null

		let deleteCustomLogoAttrs = null
		if (customLogoDefined && data) {
			deleteCustomLogoAttrs = {
				label: "deactivate_action",
				click: () => {
					Dialog.confirm("confirmDeactivateCustomLogo_msg").then(ok => {
						if (ok) {
							delete downcast(data.customTheme).logo
							this.saveCustomTheme(data.customTheme, data.whitelabelConfig, data.whitelabelDomainInfo)
							if (logins.isWhitelabel()) {
								themeController.updateCustomTheme(data.customTheme)
							}
						}
					})
				},
				icon: () => Icons.Cancel
			}
		}

		let customLogoTextFieldValue = lang.get(customLogoDefined ? "activated_label" : "deactivated_label")
		let chooseLogoButtonAttrs = null
		if (data?.customTheme) {
			chooseLogoButtonAttrs = {
				label: "edit_action",
				click: () => {
					fileController.showFileChooser(false).then(files => {
						let extension = files[0].name.toLowerCase()
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
							data.customTheme.logo = imageData
							this.saveCustomTheme(data.customTheme, data.whitelabelConfig, data.whitelabelDomainInfo)
							if (logins.isWhitelabel()) {
								themeController.updateCustomTheme(data.customTheme)
							}
							customLogoTextFieldValue = lang.get("activated_label")
						}
					})
				},
				icon: () => Icons.Edit
			}
		}

		const customLogoTextfieldAttrs = {
			label: "customLogo_label",
			helpLabel: () => lang.get("customLogoInfo_msg"),
			value: stream(customLogoTextFieldValue),
			disabled: true,
			injectionsRight: () => [
				(deleteCustomLogoAttrs) ? m(ButtonN, deleteCustomLogoAttrs) : null,
				(chooseLogoButtonAttrs) ? m(ButtonN, chooseLogoButtonAttrs) : null
			]
		}
		return m(TextFieldN, customLogoTextfieldAttrs)
	}

	_renderCustomColorsConfig(data: ?WhitelabelData): Children {

		const customColorsDefined = data ? this._areCustomColorsDefined(data.customTheme) : false

		let deactivateColorThemeAttrs = null
		if (customColorsDefined && data) {
			deactivateColorThemeAttrs = {
				label: "deactivate_action",
				click: () => {
					Dialog.confirm("confirmDeactivateCustomColors_msg").then(ok => {
						if (ok) {
							Object.keys(data.customTheme).forEach(key => {
								if (key !== "logo") {
									delete downcast(data.customTheme)[key]
								}
							})
							this.saveCustomTheme(data.customTheme, data.whitelabelConfig, data.whitelabelDomainInfo)
							if (logins.isWhitelabel()) {
								themeController.updateCustomTheme(data.customTheme)
							}
						}
					})
				},
				icon: () => Icons.Cancel,
			}
		}

		let editCustomColorButtonAttrs = null
		if (data && data.customTheme) {
			editCustomColorButtonAttrs = {
				label: "edit_action",
				click: () => {
					this.showCustomColorsDialog(data.customTheme, data.whitelabelConfig, data.whitelabelDomainInfo)
				},
				icon: () => Icons.Edit
			}
		}

		const customColorsTextfieldAttrs = {
			label: "customColors_label",
			value: stream((customColorsDefined) ? lang.get("activated_label") : lang.get("deactivated_label")),
			disabled: true,
			injectionsRight: () =>
				[
					(deactivateColorThemeAttrs) ? m(ButtonN, deactivateColorThemeAttrs) : null,
					(editCustomColorButtonAttrs) ? m(ButtonN, editCustomColorButtonAttrs) : null
				]

		}
		return m(TextFieldN, customColorsTextfieldAttrs)
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

	_areCustomColorsDefined(theme: ?ThemeCustomizations): boolean {
		if (theme) {
			return Object.keys(theme).find(key => key !== "logo" && neverNull(theme)[key]) != null
		} else {
			return false
		}
	}

	/**
	 *  duplicate code to not invoke model earlier
	 */
	saveCustomTheme(customTheme: ThemeCustomizations, whitelabelConfig: WhitelabelConfig, whitelabelDomainInfo: DomainInfo) {
		neverNull(whitelabelConfig).jsonTheme = JSON.stringify(downcast(customTheme))
		update(neverNull(whitelabelConfig))
		customTheme.themeId = assertNotNull(whitelabelDomainInfo).domain
	}
}