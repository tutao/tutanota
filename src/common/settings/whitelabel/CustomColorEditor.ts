import m, { Child, Children, Component, Vnode, VnodeDOM } from "mithril"
import type { TextFieldAttrs } from "../../gui/base/TextField.js"
import { TextField } from "../../gui/base/TextField.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { DropDownSelector } from "../../gui/base/DropDownSelector.js"
import { lang } from "../../misc/LanguageViewModel"
import type { CustomColor } from "./CustomColorsEditorViewModel"
import { CustomColorsEditorViewModel } from "./CustomColorsEditorViewModel"
import { ExpanderButton, ExpanderPanel } from "../../gui/base/Expander"
import { CustomColorEditorPreview } from "./CustomColorEditorPreview"
import { downcast } from "@tutao/tutanota-utils"
import { expandHexTriplet } from "../../gui/base/Color"
import { px } from "../../gui/size"
import { BaseThemeId } from "../../gui/theme"

export type SimpleCustomColorEditorAttrs = {
	model: CustomColorsEditorViewModel
}
export const COLOR_PICKER_WIDTH = 400
export const ADVANCED_TEXTFIELD_WIDTH = 344
export const CATEGORY_WIDTH = 750

/**
 *  Editor that simplifies the existing whitelabel editor, allowing for easy changes to accent color and base theme, also showing a preview
 */
export class CustomColorEditor implements Component<SimpleCustomColorEditorAttrs> {
	private _colorPickerDom: HTMLInputElement | null = null
	private readonly _advancedSettingsEnabled: Stream<boolean>

	constructor() {
		this._advancedSettingsEnabled = stream<boolean>(false)
	}

	view(vnode: Vnode<SimpleCustomColorEditorAttrs>): Children {
		const { model } = vnode.attrs
		const simpleColorPickerAttrs: TextFieldAttrs = {
			label: "accentColor_label",
			value: vnode.attrs.model.accentColor,
			injectionsRight: () =>
				renderColorPicker((inputEvent) => {
					vnode.attrs.model.changeAccentColor(downcast<HTMLInputElement>(inputEvent.target).value)
					m.redraw()
				}, vnode.attrs.model.accentColor),
			maxWidth: COLOR_PICKER_WIDTH,
			isReadOnly: true,
		}

		return m("", [
			m("", [
				m(".flex", [
					m(".flex-grow", m(TextField, simpleColorPickerAttrs)),
					m(
						".ml-s.flex-grow",
						m(DropDownSelector, {
							label: "baseTheme_label",
							items: [
								{
									name: lang.get("light_label"),
									value: "light",
								},
								{
									name: lang.get("dark_label"),
									value: "dark",
								},
							],
							selectedValue: vnode.attrs.model.baseThemeId,
							selectionChangedHandler: (v: BaseThemeId) => {
								vnode.attrs.model.changeBaseTheme(v)
							},
						}),
					),
				]),
				m(CustomColorEditorPreview),
			]),
			m("", [
				m(ExpanderButton, {
					label: "advanced_label",
					expanded: this._advancedSettingsEnabled(),
					onExpandedChange: this._advancedSettingsEnabled,
				}),
				m(
					ExpanderPanel,
					{
						expanded: this._advancedSettingsEnabled(),
					},
					[
						m(".small.mt", lang.get("customColorsInfo_msg")),
						m(".flex.flex-column", [
							m("", [
								m(
									".editor-border.text-break.wrapping-row",
									{
										style: {
											maxWidth: px(CATEGORY_WIDTH),
										},
									},
									[model.customColors.map((c) => renderCustomColorField(model, c))],
								),
							]),
						]),
					],
				),
			]),
		])
	}
}

function renderCustomColorField(model: CustomColorsEditorViewModel, { name, value, defaultValue, valid }: CustomColor): Child {
	return m(
		"",
		{
			style: {
				maxWidth: px(ADVANCED_TEXTFIELD_WIDTH),
			},
		},
		[
			m(TextField, {
				label: lang.makeTranslation(name, name),
				value: value,
				injectionsRight: () =>
					renderColorPicker((event) => model.addCustomization(name, downcast<HTMLInputElement>(event.target).value), processColorInputValue(value)),
				oninput: (val) => {
					model.addCustomization(name, val)
				},
			}),
			renderDefaultColorLine(defaultValue, valid),
		],
	)
}

function renderColorPicker(onInput: (arg0: Event) => unknown, value: string, oncreate?: (vnode: VnodeDOM<void>) => void): Child {
	return m("input.color-picker.mb-xs", {
		type: "color",
		value: value,
		oninput: onInput,
		oncreate,
	})
}

function renderDefaultColorLine(defaultColor: string, valid: boolean): Child {
	if (valid) {
		return m(".small.flex-space-between", [
			m(
				"",
				lang.get("defaultColor_label", {
					"{1}": defaultColor,
				}),
			),
			m("", {
				style: {
					width: "100px",
					height: "10px",
					"margin-top": "2px",
					"background-color": defaultColor,
				},
			}),
		])
	} else {
		return m(".small", lang.get("invalidInputFormat_msg"))
	}
}

/**
 * If the provided value is a 3-digit hex string, it expands it to a 6-digit one (#RGB #RRGGBB)
 * Otherwise, it returns the provided value
 */
function processColorInputValue(value: string) {
	const isHexTriplet = /^#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]$/.test(value)

	if (isHexTriplet) {
		const withoutHash = value.slice(1)
		return "#" + expandHexTriplet(withoutHash)
	} else {
		return value
	}
}

function capitalizeFirstLetterOfString(string: string): string {
	return string.charAt(0).toUpperCase() + string.slice(1)
}
