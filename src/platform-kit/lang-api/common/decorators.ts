// These types and enums are used by the tuta-transpiler to represent parsed JSDoc tags.
// Use JSDoc tags in source code instead of decorators, e.g.:
//   /** @TTranspileIgnore reason text */
//   /** @TMutableStaticSafety MainThreadInitialized */
//   /** @TSwUncheckedSendable reasoning text */

export type TTranspileIgnoreOpts = { reason: string }

export const enum TMutableStaticSafetyKind {
	/// - must be a singleton
	/// - must be initialized in main thread
	/// - must be private
	MainThreadInitialized = "MainThreadInitialized",
}

export type TMutableStaticSafetyOpts = { kind: TMutableStaticSafetyKind }

export type TSwUncheckedSendableOpts = { reasoning: string }
