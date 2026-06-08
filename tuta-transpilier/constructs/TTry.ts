import { ConstructOut, TConstruct } from "./TConstruct"
import { CatchClause, TryStatement } from "ts-morph"
import { TBlock } from "./TBlock"
import { TIdentitider } from "./TIdentitider"
import * as Assert from "node:assert"

class TCatchClause extends TConstruct {
	private readonly catchedName: TIdentitider
	private readonly catchBlock: TBlock
	constructor(catchClause: CatchClause) {
		super()
		this.catchedName = new TIdentitider(catchClause.getVariableDeclarationOrThrow("Catch must always define a variable").getName())
		this.catchBlock = new TBlock(catchClause.getBlock())
	}

	generateKotlin(): ConstructOut {
		const catchedName = this.catchedName.generateKotlin()
		const catchBlock = this.catchBlock.generateKotlin()
		return `catch (${catchedName}: Throwable) ${catchBlock}`
	}
}
export class TTry extends TConstruct {
	private readonly tryBlock: TBlock
	private readonly catchClause: TCatchClause | null
	private readonly finallyBlock: TBlock | null

	constructor(tryStatement: TryStatement) {
		super()
		const tryBlock = tryStatement.getTryBlock()
		const finallyBlock = tryStatement.getFinallyBlock() ?? null
		const catchClause = tryStatement.getCatchClause() ?? null

		this.tryBlock = new TBlock(tryBlock)
		this.catchClause = catchClause ? new TCatchClause(catchClause) : null
		this.finallyBlock = finallyBlock ? new TBlock(finallyBlock) : null
		Assert.equal(this.catchClause == null && this.finallyBlock == null, false, "Either catch or finally must be defined")
	}

	generateKotlin(): ConstructOut {
		const tryBlock = this.tryBlock.generateKotlin()
		const catchClause = this.catchClause?.generateKotlin() ?? ""
		const finallyBlock = this.finallyBlock?.generateKotlin() ?? "{}"

		return `try ${tryBlock} ${catchClause} finally ${finallyBlock}`
	}
}
