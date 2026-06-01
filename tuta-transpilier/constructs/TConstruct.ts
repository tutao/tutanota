import { Node as TsMorphNode } from "ts-morph"

export type TsNode = TsMorphNode

export type ConstructOut = string | Array<string>

export abstract class TConstruct {
	abstract generateKotlin(): ConstructOut
	generateSwift(): ConstructOut {
		throw new Error("Not yet implemented!")
	}
}

export class TConstructMultiple extends TConstruct {
	private readonly constructs: TConstruct[]
	private seperator: string

	constructor(...constructs: TConstruct[]) {
		super()
		this.constructs = constructs
		this.seperator = " "
	}

	withSeperator(seperator: string): this {
		this.seperator = seperator
		return this
	}

	generateKotlin(): ConstructOut {
		return this.constructs.map((c) => c.generateKotlin()).join(this.seperator)
	}
}
