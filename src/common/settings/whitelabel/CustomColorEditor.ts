import m, { Child, Children, Component, Vnode, VnodeDOM } from "mithril"
import type { TextFieldAttrs } from "../../gui/base/TextField.js"
import { TextField } from "../../gui/base/TextField.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { DropDownSelector } from "../../gui/base/DropDownSelector.js"
import { lang } from "../../misc/LanguageViewModel"
import { CustomColorsEditorViewModel } from "./CustomColorsEditorViewModel"
import { CustomColorEditorPreview } from "./CustomColorEditorPreview"
import { downcast } from "@tutao/tutanota-utils"
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
		const simpleColorPickerAttrs: TextFieldAttrs = {
			label: "sourceColor_label",
			value: vnode.attrs.model.sourceColor,
			injectionsRight: () =>
				renderColorPicker((inputEvent) => {
					vnode.attrs.model.changeSourceColor(downcast<HTMLInputElement>(inputEvent.target).value).then(() => m.redraw())
				}, vnode.attrs.model.sourceColor),
			maxWidth: COLOR_PICKER_WIDTH,
			isReadOnly: true,
		}

		return m("", [
			m("", [
				m(".flex", [
					m(".flex-grow", m(TextField, simpleColorPickerAttrs)),
					m(
						".ml-8.flex-grow",
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
		])
	}
}

function renderColorPicker(onInput: (arg0: Event) => unknown, value: string, oncreate?: (vnode: VnodeDOM<void>) => void): Child {
	return m("input.color-picker.mb-4", {
		type: "color",
		value: value,
		oninput: onInput,
		oncreate,
	})
}
