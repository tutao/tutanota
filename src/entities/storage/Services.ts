import { BlobAccessTokenPostIn, BlobAccessTokenPostInTypeRef } from "./TypeRefs.js"
import { BlobAccessTokenPostOut, BlobAccessTokenPostOutTypeRef } from "./TypeRefs.js"
import { BlobCopyServicePostIn, BlobCopyServicePostInTypeRef } from "./TypeRefs.js"
import { BlobCopyServicePostOut, BlobCopyServicePostOutTypeRef } from "./TypeRefs.js"
import { BlobReferencePutIn, BlobReferencePutInTypeRef } from "./TypeRefs.js"
import { BlobReferenceDeleteIn, BlobReferenceDeleteInTypeRef } from "./TypeRefs.js"
import { BlobGetIn, BlobGetInTypeRef } from "./TypeRefs.js"
import { BlobPostOut, BlobPostOutTypeRef } from "./TypeRefs.js"
import { GetService, PostService, PutService, DeleteService, NullEntityTypeRef, NullEntity } from "@tutao/meta"

export const BlobAccessTokenService_POST = new PostService<BlobAccessTokenPostIn, BlobAccessTokenPostOut>(
	"storage",
	"BlobAccessTokenService",
	BlobAccessTokenPostInTypeRef,
	BlobAccessTokenPostOutTypeRef,
)

export const BlobCopyService_POST = new PostService<BlobCopyServicePostIn, BlobCopyServicePostOut>(
	"storage",
	"BlobCopyService",
	BlobCopyServicePostInTypeRef,
	BlobCopyServicePostOutTypeRef,
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
