/// Do not transpile this statement/expression
function _transpileIgnore(target: any): void {
	return
}

export function TTranspileIgnore(opts: { reason: string }) {
	return _transpileIgnore
}
