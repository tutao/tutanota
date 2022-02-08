import m, {Children, Component, Vnode} from "mithril"
import {VariantRenderer, VariantsIndex} from "./VariantRenderer.js"

type VariantRendererAttrs = {
	variants: VariantsIndex<Children>,
	variant: number
}


export class MithrilVariantRenderer implements Component<VariantRendererAttrs>, VariantRenderer<Children> {
	render(variant: number, variants: VariantsIndex<Children>): Children {
		return m(this, {
			variant: variant,
			variants
		})
	}

	view({attrs}: Vnode<VariantRendererAttrs>): Children {
		const variant = attrs.variants[attrs.variant]
		return variant()
	}
}