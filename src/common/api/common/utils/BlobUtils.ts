import { File as TutanotaFile } from "../../entities/tutanota/TypeRefs.js"
import { elementIdPart, listIdPart } from "./EntityUtils.js"
import { Blob } from "../../entities/sys/TypeRefs.js"
import { SomeEntity } from "../EntityTypes.js"

/**
 * Common interface for instances that are referencing blobs. Main purpose is to have a proper way to access the attribute for the Blob aggregated type
 * because the name of the attribute can be different for each instance.
 *
 */
export type BlobReferencingInstance = {
	elementId: Id

	listId: Id | null

	blobs: Blob[]

	entity: SomeEntity
}

export function createReferencingInstance(tutanotaFile: TutanotaFile): BlobReferencingInstance {
	return {
		blobs: tutanotaFile.blobs,
		elementId: elementIdPart(tutanotaFile._id),
		listId: listIdPart(tutanotaFile._id),
		entity: tutanotaFile,
	}
}
