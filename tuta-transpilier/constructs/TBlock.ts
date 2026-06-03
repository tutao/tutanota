import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { Block } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"

export class TBlock extends TConstruct {
	private blockBody: Array<TConstruct>
	constructor(block: Block) {
		super()
		this.blockBody = block.forEachChildAsArray().map((ch) => NodeRedirector.redirectNode(ch))
	}

	removeStatements(predicate: (_: TConstruct) => boolean): Array<TConstruct> {
		const removedStatements = new Array<TConstruct>()
		this.blockBody = this.blockBody
			.flatMap((b) => {
				if (b instanceof TConstructMultiple) return b.constructs
				else return [b]
			})
			.filter((v) => {
				if (predicate(v) === true) {
					removedStatements.push(v)
					return false
				}
				return true
			})
		return removedStatements
	}

	findStatements(predicate: (_: TConstruct) => boolean): TConstruct | null {
		return this.blockBody.find((v) => predicate(v))
	}

	generateKotlin(): ConstructOut {
		const blockBody = new TConstructMultiple(...this.blockBody).withSeparator(";\n").generateKotlin()
		return `{\n${blockBody}\n}`
	}
}
