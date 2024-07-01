import m, { Children, Component, Vnode } from "mithril"

export type ColorPickerAttrs = {
	value: string
	onValueChange: (value: string) => unknown
}

export class ColorPicker implements Component<ColorPickerAttrs> {
	view(vnode: Vnode<ColorPickerAttrs>): Children {
		const a = vnode.attrs
		return m("input.color-picker", {
			type: "color",
			value: a.value,
			oninput: (event: InputEvent) => a.onValueChange((event.target as HTMLInputElement).value),
		})
	}
}
