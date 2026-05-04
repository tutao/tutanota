import { hslToHex, normalizeHueAngle } from "../Color.js"

type NumberTuple<L extends number> = readonly number[] & { length: L }

interface PaletteSchema<L extends number> {
	readonly hueShift: NumberTuple<L>
	readonly saturation: NumberTuple<L>
	readonly lightness: NumberTuple<L>
}

export class ColorPickerModel {
	static readonly PALETTE_SIZE = 8
	readonly paletteSchema: PaletteSchema<typeof ColorPickerModel.PALETTE_SIZE>
	private readonly variantIndexBySL: Map<string, number> = new Map()

	constructor(private readonly isDarkTheme: boolean) {
		const { hueShift: hueWindowH, saturation: hueWindowS, lightness: hueWindowL } = this.getHueWindowSchema()

		this.paletteSchema = Object.freeze({
			hueShift: [hueWindowH, 0, 0, -1, -1, 0, 0, 0],
			saturation: [hueWindowS, 100, 54, 36, 27, 25, 28, 31],
			lightness: [hueWindowL, 87, 77, 66, 55, 46, 41, 36],
		} as const)
	}

	getHueWindowColor(hue: number) {
		const { saturation, lightness } = this.getHueWindowSchema()
		return hslToHex({ h: hue, s: saturation, l: lightness })
	}

	private getHueWindowSchema() {
		return {
			hueShift: 0,
			saturation: this.isDarkTheme ? 50 : 100,
			lightness: this.isDarkTheme ? 50 : 40,
		}
	}

	getColor(hue: number, variant: number): { h: number; s: number; l: number } {
		const h = normalizeHueAngle(hue + this.paletteSchema.hueShift[variant])
		const s = this.paletteSchema.saturation[variant]
		const l = this.paletteSchema.lightness[variant]

		return { h, s, l }
	}

	getVariantIndexBySL(saturation: number, lightness: number) {
		if (this.variantIndexBySL.size === 0) {
			for (let i = 0; i < ColorPickerModel.PALETTE_SIZE; i++) {
				this.variantIndexBySL.set(this.slKey(this.paletteSchema.saturation[i], this.paletteSchema.lightness[i]), i)
			}
		}

		return this.variantIndexBySL.get(this.slKey(saturation, lightness))
	}

	private slKey(s: number, l: number) {
		return `${s}_${l}`
	}
}
