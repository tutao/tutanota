import { UsageTestAssignmentIn, UsageTestAssignmentInTypeRef } from "./TypeRefs.js"
import { UsageTestAssignmentOut, UsageTestAssignmentOutTypeRef } from "./TypeRefs.js"
import { UsageTestParticipationIn, UsageTestParticipationInTypeRef } from "./TypeRefs.js"
import { UsageTestParticipationOut, UsageTestParticipationOutTypeRef } from "./TypeRefs.js"
import { UsageTestParticipationDeleteIn, UsageTestParticipationDeleteInTypeRef } from "./TypeRefs.js"
import { GetService, PostService, PutService, DeleteService, NullEntityTypeRef, NullEntity } from "@tutao/meta"

export const UsageTestAssignmentService_POST = new PostService<UsageTestAssignmentIn, UsageTestAssignmentOut>(
	"usage",
	"UsageTestAssignmentService",
	UsageTestAssignmentInTypeRef,
	UsageTestAssignmentOutTypeRef,
)
export const UsageTestAssignmentService_PUT = new PutService<UsageTestAssignmentIn, UsageTestAssignmentOut>(
	"usage",
	"UsageTestAssignmentService",
	UsageTestAssignmentInTypeRef,
	UsageTestAssignmentOutTypeRef,
)

export const UsageTestParticipationService_POST = new PostService<UsageTestParticipationIn, UsageTestParticipationOut>(
	"usage",
	"UsageTestParticipationService",
	UsageTestParticipationInTypeRef,
	UsageTestParticipationOutTypeRef,
)
export const UsageTestParticipationService_DELETE = new DeleteService<UsageTestParticipationDeleteIn, NullEntity>(
	"usage",
	"UsageTestParticipationService",
	UsageTestParticipationDeleteInTypeRef,
	NullEntityTypeRef,
)
