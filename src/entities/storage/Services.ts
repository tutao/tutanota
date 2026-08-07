import { BlobAccessTokenPostIn, BlobAccessTokenPostInTypeRef } from "./TypeRefs.js"
import { BlobAccessTokenPostOut, BlobAccessTokenPostOutTypeRef } from "./TypeRefs.js"
import { BlobReferencePutIn, BlobReferencePutInTypeRef } from "./TypeRefs.js"
import { BlobReferenceDeleteIn, BlobReferenceDeleteInTypeRef } from "./TypeRefs.js"
import { BlobGetIn, BlobGetInTypeRef } from "./TypeRefs.js"
import { BlobPostOut, BlobPostOutTypeRef } from "./TypeRefs.js"
import { GetService, PostService, PutService, DeleteService, NonExistentDataTransferEntity, NonExistentDataTransferEntityTypeRef } from "@tutao/meta"

export const BlobAccessTokenService_POST = new PostService<BlobAccessTokenPostIn, BlobAccessTokenPostOut>("storage", "BlobAccessTokenService", BlobAccessTokenPostInTypeRef, BlobAccessTokenPostOutTypeRef)

export const BlobReferenceService_PUT = new PutService<BlobReferencePutIn, NonExistentDataTransferEntity>("storage", "BlobReferenceService", BlobReferencePutInTypeRef, NonExistentDataTransferEntityTypeRef)
export const BlobReferenceService_DELETE = new DeleteService<BlobReferenceDeleteIn, NonExistentDataTransferEntity>("storage", "BlobReferenceService", BlobReferenceDeleteInTypeRef, NonExistentDataTransferEntityTypeRef)

export const BlobService_GET = new GetService<BlobGetIn, NonExistentDataTransferEntity>("storage", "BlobService", BlobGetInTypeRef, NonExistentDataTransferEntityTypeRef)
export const BlobService_POST = new PostService<NonExistentDataTransferEntity, BlobPostOut>("storage", "BlobService", NonExistentDataTransferEntityTypeRef, BlobPostOutTypeRef)