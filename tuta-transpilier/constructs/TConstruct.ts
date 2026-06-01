import { EmptyStatement, Node as TsMorphNode } from "ts-morph"
import { Type } from "cborg"
import undefined = Type.undefined
import { TEmpty } from "./TEmpty"

export type TsNode = TsMorphNode

export type ConstructOut = string | Array<string>

export class TConstructMultiple extends TConstruct {
	private readonly constructs: Array<TConstruct>

	constructor(...constructs: TConstruct[]) {
		super()
		this.constructs = constructs
	}

	generateKotlin(): ConstructOut {
		return new TEmpty()
	}
}

export abstract class TConstruct {
	abstract generateKotlin(): ConstructOut
	generateSwift(): ConstructOut {
		throw new Error("Not yet implemented!")
	}

	public andThen(others: TConstruct | Array<TConstruct>): Array<TConstruct> {
		if (others instanceof Array) {
			return [this, ...others]
		} else if (others instanceof TConstruct) {
			return [this, others]
		} else {
			throw new Error("Unknown type")
		}
	}
}
