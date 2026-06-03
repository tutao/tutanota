import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { Block } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"

export class TBlock extends TConstruct {
	private readonly blockBody: TConstructMultiple
	constructor(block: Block) {
		super()
		const blockStatements = block.forEachChildAsArray().map((ch) => NodeRedirector.redirectNode(ch))
		this.blockBody = new TConstructMultiple(...blockStatements)
	}

	generateKotlin(): ConstructOut {
		const blockBody = this.blockBody.withSeperator(";\n").generateKotlin()
		return `{\n${blockBody}\n}`
	}
}
