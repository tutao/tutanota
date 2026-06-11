export function deepMapKeys<K extends string, V>(obj: Record<string, any>, keyMapper: (k: string) => K, valueMapper: (v: any) => V): Record<K, V> {
	return Object.keys(obj).reduce((acc: any, current: string) => {
		const key = keyMapper(current)
		const val = valueMapper(obj[current])
		acc[key] = val !== null && typeof val === "object" ? deepMapKeys(val, keyMapper, valueMapper) : val
		return acc
	}, {})
}
