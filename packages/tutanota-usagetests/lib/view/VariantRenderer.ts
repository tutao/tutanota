export type VariantsIndex<ReturnT> = {
	[key: number]: () => ReturnT
}

export interface VariantRenderer<ReturnT> {
	render(variant: number, variants: VariantsIndex<ReturnT>): ReturnT
}

export class ArbitraryVariantRenderer implements VariantRenderer<any> {
	render(variant: number, variants: VariantsIndex<any>): any {
		return variants[variant]()
	}
}
