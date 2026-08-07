import { GetService, PostService, PutService, DeleteService, NullEntityTypeRef, NullEntity } from "@tutao/meta"

export const ApplicationTypesService_GET = new GetService<NullEntity, NullEntity>("base", "ApplicationTypesService", NullEntityTypeRef, NullEntityTypeRef)