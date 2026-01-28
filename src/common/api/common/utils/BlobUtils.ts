import { elementIdPart, listIdPart } from "./EntityUtils.js"
import { Blob } from "../../entities/sys/TypeRefs.js"
import { ListElementEntity, SomeEntity } from "../EntityTypes.js"

/**
 * Common interface for instances that are referencing blobs. Main purpose is to have a proper way to access the attribute for the Blob aggregated type
 * because the name of the attribute can be different for each instance.
 *
 */
export type BlobReferencingInstance = {
	elementId: Id

	listId: Id | null

	blobs: readonly Blob[]

	entity: SomeEntity
}

/**
 * Another abstraction over various entities that can be downloaded as data. This one is not a concrete type but
 * rather a common denominator for entity before the conversion.
 */
export interface DownloadableFileEntity extends ListElementEntity {
	_id: IdTuple
	name: string
	size: NumberString
	mimeType: null | string
	cid?: string | null

	blobs: readonly Blob[]
}

export function createReferencingInstance(tutanotaFile: DownloadableFileEntity): BlobReferencingInstance {
	return {
		blobs: tutanotaFile.blobs,
		elementId: elementIdPart(tutanotaFile._id),
		listId: listIdPart(tutanotaFile._id),
		entity: tutanotaFile,
	}
}
