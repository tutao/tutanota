import { ArchiveEnumerationGetIn, ArchiveEnumerationGetInTypeRef } from "./TypeRefs.js"
import { ArchiveEnumerationGetOut, ArchiveEnumerationGetOutTypeRef } from "./TypeRefs.js"
import { BlobAccessTokenPostIn, BlobAccessTokenPostInTypeRef } from "./TypeRefs.js"
import { BlobAccessTokenPostOut, BlobAccessTokenPostOutTypeRef } from "./TypeRefs.js"
import { BlobReferencePutIn, BlobReferencePutInTypeRef } from "./TypeRefs.js"
import { BlobReferenceDeleteIn, BlobReferenceDeleteInTypeRef } from "./TypeRefs.js"
import { BlobGetIn, BlobGetInTypeRef } from "./TypeRefs.js"
import { BlobPostOut, BlobPostOutTypeRef } from "./TypeRefs.js"
import { GetService, PostService, PutService, DeleteService, NullEntityTypeRef, NullEntity } from "@tutao/meta"

export const ArchiveEnumerationService_GET = new GetService<ArchiveEnumerationGetIn, ArchiveEnumerationGetOut>(
	"storage",
	"ArchiveEnumerationService",
	ArchiveEnumerationGetInTypeRef,
	ArchiveEnumerationGetOutTypeRef,
)

export const BlobAccessTokenService_POST = new PostService<BlobAccessTokenPostIn, BlobAccessTokenPostOut>(
	"storage",
	"BlobAccessTokenService",
	BlobAccessTokenPostInTypeRef,
	BlobAccessTokenPostOutTypeRef,
)

export const BlobReferenceService_PUT = new PutService<BlobReferencePutIn, NullEntity>(
	"storage",
	"BlobReferenceService",
	BlobReferencePutInTypeRef,
	NullEntityTypeRef,
)
export const BlobReferenceService_DELETE = new DeleteService<BlobReferenceDeleteIn, NullEntity>(
	"storage",
	"BlobReferenceService",
	BlobReferenceDeleteInTypeRef,
	NullEntityTypeRef,
)

export const BlobService_GET = new GetService<BlobGetIn, NullEntity>("storage", "BlobService", BlobGetInTypeRef, NullEntityTypeRef)
export const BlobService_POST = new PostService<NullEntity, BlobPostOut>("storage", "BlobService", NullEntityTypeRef, BlobPostOutTypeRef)
