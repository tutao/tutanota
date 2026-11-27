export const TsPromise = Object.assign(Promise, {
	resolvedVoid: () => Promise.resolve(),
})
