// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {Dialog} from "../gui/base/Dialog"
import {ButtonType} from "../gui/base/ButtonN"
import type {Theme} from "../gui/theme"
import {defaultTheme, theme, updateCustomTheme} from "../gui/theme"
import {Keys} from "../misc/KeyManager"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {update} from "../api/main/Entity"

assertMainOrNode()

let COLOR_FORMAT = new RegExp("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")

export function show(whitelabelConfig: WhitelabelConfig, themeToEdit: Theme) {
	let colorFields = Object.keys(defaultTheme)
	                        .filter(name => name !== "logo")
	                        .sort((a, b) => a.localeCompare(b))
	                        .map(colorName => {
		                        let value = themeToEdit[colorName]
		                        let field = new TextField(() => colorName).setValue(value ? value : "")
		                        field._injectionsRight = () => {
			                        return [
				                        m("", {
					                        style: {
						                        width: "106px", // 100 + 6px negative margin
						                        height: "20px",
						                        "margin-bottom": "2px",
						                        "background-color": getValidColorValue(field) || theme.content_bg
					                        }
				                        })
			                        ]
		                        }
		                        return field
	                        })

	let nbrOfLeftColors = Math.ceil(colorFields.length / 2.0)
	let leftColumns = colorFields.slice(0, nbrOfLeftColors)
	let rightColumns = colorFields.slice(nbrOfLeftColors)

	let form = {
		view: () => {
			return m(".pb", [
				m(".small.mt", lang.get('customColorsInfo_msg')),
				m(".wrapping-row", [
					m("", leftColumns.map(c => {
						return m("", [
							m(c),
							_getDefaultColorLine(c)
						])
					})),
					m("", rightColumns.map(c => {
						return m("", [
							m(c),
							_getDefaultColorLine(c)
						])
					})),
				])
			])
		}
	}

	const cancelAction = () => dialog.close()
	const okAction = () => {
		let newTheme = themeToEdit.logo ? {"logo": themeToEdit.logo} : {}
		for (let i = 0; i < colorFields.length; i++) {
			let colorValue = colorFields[i].value().trim()
			if (colorValue) {
				if (COLOR_FORMAT.test(colorValue)) {
					newTheme[(colorFields[i]: any).label()] = colorValue
				} else {
					Dialog.error("correctValues_msg")
					return
				}
			}
		}
		whitelabelConfig.jsonTheme = JSON.stringify(newTheme)
		update(whitelabelConfig)
		updateCustomTheme(newTheme)
		dialog.close()
	}

	let actionBarAttrs: DialogHeaderBarAttrs = {
		left: [{label: "cancel_action", click: cancelAction, type: ButtonType.Secondary}],
		right: [{label: "ok_action", click: okAction, type: ButtonType.Primary}],
		middle: () => lang.get("customColors_label")
	}

	let dialog = Dialog.largeDialog(actionBarAttrs, form)
	                   .addShortcut({
		                   key: Keys.ESC,
		                   exec: cancelAction,
		                   help: "close_alt"
	                   }).setCloseHandler(cancelAction)
	                   .show()
}

function getValidColorValue(field: TextField): ?string {
	let colorValue = field.value().trim()
	if (colorValue && COLOR_FORMAT.test(colorValue)) {
		return colorValue
	} else {
		return null
	}
}

function _getDefaultColorLine(field: TextField): VirtualElement {
	let colorValue = getValidColorValue(field)
	if (!field.value().trim() || colorValue) {
		let colorName = (field: any).label()
		return m(".small.flex-space-between", [
			m("", lang.get("defaultColor_label", {"{1}": defaultTheme[colorName]})),
			m("", {
				style: {
					width: '100px',
					height: '10px',
					"margin-top": "2px",
					"background-color": defaultTheme[colorName]
				}
			})
		])
	} else {
		return m(".small", lang.get("invalidInputFormat_msg"))
	}
}