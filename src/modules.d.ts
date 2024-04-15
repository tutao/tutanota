declare module "*.wasm" {
	const loadWasm: () => Argon2IDExports | LibOQSExports

	export { loadWasm }
}
