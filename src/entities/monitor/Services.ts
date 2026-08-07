import { ReadCounterData, ReadCounterDataTypeRef } from "./TypeRefs.js"
import { ReadCounterReturn, ReadCounterReturnTypeRef } from "./TypeRefs.js"
import { WriteCounterData, WriteCounterDataTypeRef } from "./TypeRefs.js"
import { ReportErrorIn, ReportErrorInTypeRef } from "./TypeRefs.js"
import { GetService, PostService, PutService, DeleteService, NullEntityTypeRef, NullEntity } from "@tutao/meta"

export const CounterService_GET = new GetService<ReadCounterData, ReadCounterReturn>("monitor", "CounterService", ReadCounterDataTypeRef, ReadCounterReturnTypeRef)
export const CounterService_POST = new PostService<WriteCounterData, NullEntity>("monitor", "CounterService", WriteCounterDataTypeRef, NullEntityTypeRef)

export const ReportErrorService_POST = new PostService<ReportErrorIn, NullEntity>("monitor", "ReportErrorService", ReportErrorInTypeRef, NullEntityTypeRef)