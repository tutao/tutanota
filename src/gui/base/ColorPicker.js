// @flow

import m from "mithril"

export type ColorPickerAttrs = {
	value: Stream<string>
}

export class ColorPicker implements MComponent<ColorPickerAttrs> {
	view(vnode: Vnode<ColorPickerAttrs>): Children {
		const a = vnode.attrs
		return m("input.color-picker", {
			type: "color",
			value: a.value(),
			oninput: event => a.value(event.target.value)
		})
	}
}

