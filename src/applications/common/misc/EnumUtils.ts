type ObjectPropertyKey = string | number | symbol
export const reverse = <K extends ObjectPropertyKey, V extends ObjectPropertyKey>(objectMap: Record<K, V>): Record<V, K> =>
	Object.keys(objectMap).reduce(
		(r, k) => {
			const v = objectMap[k as any as K]
			return Object.assign(r, { [v]: k })
		},
		{} as Record<V, K>,
	)
