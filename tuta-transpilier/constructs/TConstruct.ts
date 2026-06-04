import { Node as TsMorphNode } from "ts-morph"

export type TsNode = TsMorphNode

export type UnitConstructOut = string

export type ConstructOut = UnitConstructOut | Array<UnitConstructOut>

export abstract class TConstruct {
	abstract generateKotlin(): ConstructOut
	generateSwift(): ConstructOut {
		throw new Error("Not yet implemented!")
	}
}

export class TConstructMultiple<V extends TConstruct = TConstruct> extends TConstruct {
	private readonly constructs: V[]
	private separator: string

	constructor(...constructs: V[]) {
		super()
		this.constructs = constructs
		this.separator = " "
	}

	getAsArray(): V[] {
		return this.constructs
	}

	withSeparator(separator: string): this {
		this.separator = separator
		return this
	}

	generateKotlin(): ConstructOut {
		return this.constructs
			.map((c) => {
				if (c == null) {
					const a = this.constructs
					const b = 1
				}
				return c.generateKotlin()
			})
			.join(this.separator)
	}
}
