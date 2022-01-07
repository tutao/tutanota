import m, {Children, Component, Vnode} from "mithril"
import Stream from "mithril/stream";

export type ColorPickerAttrs = {
	value: Stream<string>
}

export class ColorPicker implements Component<ColorPickerAttrs> {
	view(vnode: Vnode<ColorPickerAttrs>): Children {
		const a = vnode.attrs
		return m("input.color-picker", {
			type: "color",
			value: a.value(),
			oninput: (event: InputEvent) => a.value((event.target as HTMLInputElement).value),
		})
	}
}