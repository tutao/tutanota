import m, { Children, Component, Vnode } from "mithril"
import { size } from "../size"
import { theme } from "../theme"

const HUE_MAX = 360

type ColorPickerAttrs = {
	// FIXME: received value will be in hex and should be converted into HSL
	value: string
	onSelect: (color: string) => void
}

type PaletteSchema<L extends number> = {
	readonly [k in "hueShift" | "saturation" | "lightness"]: readonly number[] & { readonly length: L }
}

export class ColorPicker implements Component<ColorPickerAttrs> {
	private static readonly defaultVariantIndex = 4
	private static readonly paletteSize = 8
	private static readonly paletteSchema: PaletteSchema<typeof ColorPicker.paletteSize> = Object.freeze({
		hueShift: [4, 1, 0, -1, -1, 0, 0, 0],
		saturation: [100, 100, 54, 36, 27, 25, 28, 31],
		lightness: [94, 88, 77, 66, 55, 46, 41, 36],
	} as const)

	private readonly theme = theme.themeId.includes("dark") ? "dark" : "light"
	private palette = Array(ColorPicker.paletteSize).fill(null)
	private selectedHue = Math.floor(Math.random() * HUE_MAX)
	private selectedVariantIndex = ColorPicker.defaultVariantIndex

	private huePickerDom: HTMLElement | null = null
	private hueSliderDom: HTMLElement | null = null
	private hueWindowDom: HTMLElement | null = null

	private static getColor(hue: number, variant: number) {
		let h = hue + this.paletteSchema.hueShift[variant]
		const s = this.paletteSchema.saturation[variant]
		const l = this.paletteSchema.lightness[variant]

		if (h < 0 || h > HUE_MAX) {
			h = h < 0 ? h + HUE_MAX : h % HUE_MAX
		}

		return `hsl(${h},${s}%,${l}%)`
	}

	private getHue(hue: number) {
		const saturation = this.theme === "dark" ? 50 : 100
		const lightness = this.theme === "dark" ? 50 : 40
		return `hsl(${hue},${saturation}%,${lightness}%)`
	}

	private generatePalette() {
		for (let i = 0; i < ColorPicker.paletteSize; i++) {
			this.palette[i] = ColorPicker.getColor(this.selectedHue, i)
		}
	}

	private handleHueChange = (e: MouseEvent) => {
		const hueImgDomRect = (e.target as HTMLElement).getBoundingClientRect()
		const posX = Math.floor(e.clientX - hueImgDomRect.left + size.hue_gradient_border_width)
		this.selectedHue = Math.floor((posX / hueImgDomRect.width) * HUE_MAX)

		if (this.hueSliderDom) {
			this.hueSliderDom.style.left = `${posX}px`
		}
		if (this.hueWindowDom) {
			this.hueWindowDom.style.backgroundColor = this.getHue(this.selectedHue)
		}
	}

	view(vnode: Vnode<ColorPickerAttrs>): Children {
		this.generatePalette()

		const huePicker = m(
			".hue-picker",
			{
				oncreate: (vnode) => {
					this.huePickerDom = vnode.dom as HTMLElement
				},
			},
			[
				m(
					".hue-gradient",
					m("img", {
						src: `${window.tutao.appState.prefixWithoutFile}/images/color-hue-picker/hue-gradient-${this.theme}.png`,
						alt: "",
						draggable: false,
						onupdate: (vnode) => {
							if (this.hueSliderDom != null && !this.hueSliderDom.style.left) {
								// only set's the position of the hueSlider on first render
								const hueGradientWidth = vnode.dom.getBoundingClientRect().width
								this.hueSliderDom.style.left = `${Math.floor((this.selectedHue / HUE_MAX) * hueGradientWidth)}px`
							}
						},
						onmousedown: (e: MouseEvent) => {
							const abortController = new AbortController()
							const hueImgDom = e.target as HTMLElement

							hueImgDom.addEventListener("mousemove", this.handleHueChange, { signal: abortController.signal })

							document.addEventListener("mouseup", () => {
								abortController.abort()
								this.huePickerDom!.style.removeProperty("overflow")
								m.redraw()
							})

							this.handleHueChange(e)
							this.huePickerDom!.style.overflow = "visible"
						},
					}),
				),
				m(
					".hue-slider",
					{
						oncreate: (vnode) => {
							this.hueSliderDom = vnode.dom as HTMLElement
						},
					},
					[
						m(".hue-window", {
							style: {
								backgroundColor: this.getHue(this.selectedHue),
							},
							oncreate: (vnode) => {
								this.hueWindowDom = vnode.dom as HTMLElement
							},
						}),
						m(".hue-stem"),
					],
				),
			],
		)

		return m(".color-picker", [
			huePicker,
			m(
				".palette-container",
				this.palette.map((color, i) =>
					m(
						".palette-color-wrapper",
						{ className: this.selectedVariantIndex === i ? "selected" : "" },
						m(".palette-color", {
							onclick: () => {
								this.selectedVariantIndex = i

								// FIXME: selected should be converted to HEX
								// vnode.attrs.onSelect(color)
							},
							style: {
								backgroundColor: color,
							},
						}),
					),
				),
			),
		])
	}
}
