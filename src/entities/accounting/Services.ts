import { CustomerAccountReturn, CustomerAccountReturnTypeRef } from "./TypeRefs.js"
import { GetService, PostService, PutService, DeleteService, NullEntityTypeRef, NullEntity } from "@tutao/meta"

export const CustomerAccountService_GET = new GetService<NullEntity, CustomerAccountReturn>("accounting", "CustomerAccountService", NullEntityTypeRef, CustomerAccountReturnTypeRef)