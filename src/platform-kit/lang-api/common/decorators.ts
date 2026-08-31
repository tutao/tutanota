/// Do not transpile this statement/expression

export type TTranspileIgnoreOpts = { reason: string }

export function TTranspileIgnore(opts: TTranspileIgnoreOpts) {
	return function (target: any, ctx: ClassMethodDecoratorContext | ClassFieldDecoratorContext): void {
		return
	}
}

export const enum TMutableStaticSafetyKind {
	/// - must be a singleton
	/// - must be initialized in main thread
	/// - must be private
	MainThreadInitialized = "MainThreadInitialized",
}

export type TMutableStaticSafetyOpts = { kind: TMutableStaticSafetyKind }

export function TMutableStaticSafety(opts: TMutableStaticSafetyOpts) {
	return function (target: any, ctx: ClassFieldDecoratorContext | ClassMethodDecoratorContext) {
		// FIXME:
		// this assertion is correct. pls do not just remove it while reviewing :)
		// assert(ctx.static && ctx.private && ctx.name === "singleton", "Must be a private static field with name 'singleton'")
	}
}

export type TSwUncheckedSendableOpts = { reasoning: string }
export function TSwUncheckedSendable(opts: TSwUncheckedSendableOpts) {
	return function (target: any, ctx: ClassDecoratorContext) {}
}
