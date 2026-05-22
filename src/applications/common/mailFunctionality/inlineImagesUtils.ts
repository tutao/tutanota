// map of inline image cid to InlineImageReference
export type InlineImages = Map<string, InlineImageReference>

export type InlineImageReference = {
	cid: string
	objectUrl: string
	blob: Blob
}

export function cloneInlineImages(inlineImages: InlineImages): InlineImages {
	const newMap = new Map()
	for (const [k, v] of inlineImages.entries()) {
		const blob = new Blob([v.blob])
		const objectUrl = URL.createObjectURL(blob)
		newMap.set(k, {
			cid: v.cid,
			objectUrl,
			blob,
		})
	}
	return newMap
}

export function revokeInlineImages(inlineImages: InlineImages): void {
	for (const v of inlineImages.values()) {
		URL.revokeObjectURL(v.objectUrl)
	}
}
