/** Ambient types. Include in tests only! */

/** Modifies each function interface to add spy attributes (for convenience). */
interface Function {
	readonly callCount: number
	readonly args: any[]
	readonly calls: any[][]
	readonly invocations: any[][]
}

/**
 * Function which is defined in bootstrap files. Will return noop in node and f itself in browser.
 * Declaration is imprecise but it's easier to use this way.
 */
declare function browser<F>(f: F): F

/**
 * Function which is defined in bootstrap files. Will return f in node and noop in browser.
 * Declaration is imprecise but it's easier to use this way.
 */
declare function node<F>(f: F): F

/**
 * Should be injected during build time.
 * See sqliteNativeBannerPlugin.
 */
declare const buildOptions: {
	readonly sqliteNativePath: string
	readonly mimimiNativePath: string
}
