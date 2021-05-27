// @flow

import m from "mithril"
import type {TextFieldAttrs} from "../../gui/base/TextFieldN"
import {TextFieldN} from "../../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import {lang} from "../../misc/LanguageViewModel"
import type {CustomColor} from "./CustomColorsEditorViewModel"
import {CustomColorsEditorViewModel} from "./CustomColorsEditorViewModel"
import {ExpanderButtonN, ExpanderPanelN} from "../../gui/base/Expander"
import {CustomColorEditorPreview} from "./CustomColorEditorPreview"
import {downcast} from "../../api/common/utils/Utils"
import {expandHexTriplet} from "../../gui/base/Color"

export type SimpleCustomColorEditorAttrs = {
	model: CustomColorsEditorViewModel,
}

export const COLOR_PICKER_WIDTH = 400

/**
 *  Editor that simplifies the existing whitelabel editor, allowing for easy changes to accent color and base theme, also showing a preview
 */

export class CustomColorEditor implements MComponent<SimpleCustomColorEditorAttrs> {
	_colorPickerDom: ?HTMLInputElement;
	_advancedSettingsEnabled: Stream<boolean>

	constructor() {
		this._advancedSettingsEnabled = stream(false)
	}

	view(vnode: Vnode<SimpleCustomColorEditorAttrs>): Children {

		const {model} = vnode.attrs

		const simpleColorPickerAttrs: TextFieldAttrs = {
			label: "accentColor_label",
			value: stream(vnode.attrs.model.accentColor),
			injectionsRight: () => renderColorPicker(
				(inputEvent) => {
					vnode.attrs.model.changeAccentColor(downcast<HTMLInputElement>(inputEvent.target).value)
					m.redraw()
				},
				vnode.attrs.model.accentColor,
				({dom}) => this._colorPickerDom = downcast(dom),
			),
			maxWidth: COLOR_PICKER_WIDTH,
			disabled: true
		}

		const colorFields = model.customColors
		const nbrOfLeftColors = Math.ceil(colorFields.length / 2.0)
		const leftColumnColors = colorFields.slice(0, nbrOfLeftColors)
		const rightColumnColors = colorFields.slice(nbrOfLeftColors)

		return m("", [
			m("", [
				m(".flex", [
					m(".mr-s.flex-grow",
						m(TextFieldN, simpleColorPickerAttrs)),
					m(".ml-s.flex-grow",
						m(DropDownSelectorN, {
							label: "baseTheme_label",
							items: [
								{name: lang.get("light_label"), value: 'light'},
								{name: lang.get("dark_label"), value: 'dark'}
							],
							selectedValue: stream(vnode.attrs.model.baseThemeId),
							selectionChangedHandler: (v) => {
								vnode.attrs.model.changeBaseTheme(v)
							}
						}))
				]),
				m(CustomColorEditorPreview, {})
			]),
			m("", [
				m(ExpanderButtonN, {
					label: "advanced_label",
					expanded: this._advancedSettingsEnabled,
				}),
				m(ExpanderPanelN, {
					expanded: this._advancedSettingsEnabled,
				}, [
					m(".small.mt", lang.get('customColorsInfo_msg')),
					m(".wrapping-row", [
						m("", leftColumnColors.map(color => renderCustomColorField(model, color))),
						m("", rightColumnColors.map(color => renderCustomColorField(model, color)))
					])
				])
			])
		])
	}
}


function renderCustomColorField(model: CustomColorsEditorViewModel, {name, value, defaultValue, valid}: CustomColor): Child {
	const attrs = {
		label: () => name,
		value: stream(value),
		injectionsRight:
			() => renderColorPicker(event => model.addCustomization(name, downcast<HTMLInputElement>(event.target).value),
				processColorInputValue(value)
		),
		oninput: (val) => {
			model.addCustomization(name, val)
		}
	}
	return m("", [
		m(TextFieldN, attrs),
		renderDefaultColorLine(defaultValue, valid)
	])
}


function renderColorPicker(onInput: (Event) => mixed, value: string, oncreate?: Vnode<void> => void): Child {
	return m("input.color-picker.mb-xs.mr-s", {
		type: "color",
		value: value,
		oninput: onInput,
		oncreate
	})
}

function renderDefaultColorLine(defaultColor: string, valid: boolean): Child {
	if (valid) {
		return m(".small.flex-space-between", [
			m("", lang.get("defaultColor_label", {
				"{1}": defaultColor
			})),
			m("", {
				style: {
					width: '100px',
					height: '10px',
					"margin-top": "2px",
					"background-color": defaultColor
				}
			})
		])
	} else {
		return m(".small", lang.get("invalidInputFormat_msg"))
	}
}

/**
 * If the provided value is a 3-digit hex string, it expands it to a 6-digit one (#RGB #RRGGBB)
 * Otherwise, it returns the provided value
 */
function processColorInputValue(value) {
	const isHexTriplet = /^#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]$/.test(value)
	if(isHexTriplet) {
		const withoutHash = value.slice(1)
		return '#' + expandHexTriplet(withoutHash)
	} else {
		return value
	}
}

