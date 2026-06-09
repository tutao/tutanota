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

	generateSwift(): ConstructOut {
		/**
		 * In swift, the pattern is:
		 * do {
		 *     someNonFailingStatement()
		 *     try failingStatement()
		 * } catch {}
		 *
		 * We need to figure out which statement throws. which might be bit challenging
		 * to do the exception is not part of function signature in kotlin/ts
		 *
		 * One approach might be to use a noOp decorator in all throwing function:
		 * ```ts
		 * @Throws
		 * function someThrowing() {}
		 * ```
		 * and while generating, we can put `try` on the statement that throws,
		 * We can do that in `TCall` construct. While outputting TCall, we can
		 * check if the identifier is a function and if so check if have `@Throws`
		 * annotation, if so prepend `try` keyword.
		 * this means everything that can throw inside do {} block have to
		 * be a functionCall. non-function call statements should not throw.
		 *
		 * This is also what kotlin does for swift interops ( NOT in multiplatform ):
		 * https://github.com/kotlin-hands-on/kotlin-swift-interopedia/blob/main/docs/overview/Exceptions.md
		 */
		return ""
	}
}
