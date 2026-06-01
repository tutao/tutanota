import { ConstructOut, TConstruct, TsNode } from "./TConstruct"

export class TNotSupported extends TConstruct {
	constructor(private readonly node: TsNode) {
		super()
		console.error("Not supported: " + node.getKindName())
	}

	generateKotlin(): ConstructOut {
		return `NOT_SUPPORTED`
	}

	generateSwift(): ConstructOut {
		return `NOT_SUPPORTED`
	}
}
