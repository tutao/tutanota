// @flow

import {lang} from "../../misc/LanguageViewModel"
import {Dialog} from "../../gui/base/Dialog"
import {downcast, neverNull} from "../../api/common/utils/Utils"
import type {Theme} from "../../gui/theme"
import {Icons} from "../../gui/base/icons/Icons"
import {fileController} from "../../file/FileController"
import {ALLOWED_IMAGE_FORMATS, MAX_LOGO_SIZE} from "../../api/common/TutanotaConstants"
import {contains} from "../../api/common/utils/ArrayUtils"
import {uint8ArrayToBase64, utf8Uint8ArrayToString} from "../../api/common/utils/Encoding"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {ButtonN} from "../../gui/base/ButtonN"
import {TextFieldN} from "../../gui/base/TextFieldN"
import * as EditCustomColorsDialog from "../EditCustomColorsDialog"

export type WhitelabelThemeSettingsAttrs = {
	customTheme: ?Theme,
	onThemeChanged: (Theme) => mixed
}

export class WhitelabelThemeSettings implements MComponent<WhitelabelThemeSettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelThemeSettingsAttrs>) {}

	view(vnode: Vnode<WhitelabelThemeSettingsAttrs>): Children {
		const {customTheme, onThemeChanged} = vnode.attrs
		return [this._renderCustomColorsConfig(customTheme, onThemeChanged), this._renderCustomLogoConfig(customTheme, onThemeChanged)]
	}

	_renderCustomLogoConfig(customTheme: ?Theme, onThemeChanged: (Theme) => mixed): Children {
		const customLogoDefined = customTheme && customTheme.logo

		let deleteCustomLogoAttrs = null
		if (customLogoDefined) {
			deleteCustomLogoAttrs = {
				label: "deactivate_action",
				click: () => {
					Dialog.confirm("confirmDeactivateCustomLogo_msg").then(ok => {
						if (ok) {
							if (neverNull(customTheme).logo) {
								delete downcast(customTheme).logo
							}
							onThemeChanged(neverNull(customTheme))
						}
					})
				},
				icon: () => Icons.Cancel
			}
		}

		let customLogoTextFieldValue = lang.get(customLogoDefined ? "activated_label" : "deactivated_label")
		let chooseLogoButtonAttrs = null
		if (customTheme) {
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
							customTheme.logo = imageData
							onThemeChanged(customTheme)
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

	_renderCustomColorsConfig(customTheme: ?Theme, onThemeChanged: (Theme) => mixed): Children {
		const customColorsDefined = this._areCustomColorsDefined(customTheme)

		let deactivateColorThemeAttrs = null
		if (customColorsDefined && customTheme) {
			deactivateColorThemeAttrs = {
				label: "deactivate_action",
				click: () => {
					Dialog.confirm("confirmDeactivateCustomColors_msg").then(ok => {
						if (ok) {
							Object.keys(customTheme).forEach(key => {
								if (key !== "logo") {
									delete downcast(customTheme)[key]
								}
							})
							onThemeChanged(customTheme)
						}
					})
				},
				icon: () => Icons.Cancel,
			}
		}

		let editCustomColorButtonAttrs = null
		if (customTheme) {
			editCustomColorButtonAttrs = {
				label: "edit_action",
				click: () => EditCustomColorsDialog.show(customTheme, onThemeChanged),
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

	_areCustomColorsDefined(theme: ? Theme): boolean {
		if (theme) {
			return Object.keys(theme).find(key => key !== "logo" && neverNull(theme)[key]) != null
		} else {
			return false
		}
	}
}