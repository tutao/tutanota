import {UserAreaGroupPostDataTypeRef} from "./TypeRefs.js"
import {CreateGroupPostReturnTypeRef} from "./TypeRefs.js"
import {CalendarDeleteDataTypeRef} from "./TypeRefs.js"
import {ContactFormAccountDataTypeRef} from "./TypeRefs.js"
import {ContactFormAccountReturnTypeRef} from "./TypeRefs.js"
import {CustomerAccountCreateDataTypeRef} from "./TypeRefs.js"
import {DraftCreateDataTypeRef} from "./TypeRefs.js"
import {DraftCreateReturnTypeRef} from "./TypeRefs.js"
import {DraftUpdateDataTypeRef} from "./TypeRefs.js"
import {DraftUpdateReturnTypeRef} from "./TypeRefs.js"
import {EncryptTutanotaPropertiesDataTypeRef} from "./TypeRefs.js"
import {EntropyDataTypeRef} from "./TypeRefs.js"
import {ExternalUserDataTypeRef} from "./TypeRefs.js"
import {FileDataDataGetTypeRef} from "./TypeRefs.js"
import {FileDataDataPostTypeRef} from "./TypeRefs.js"
import {FileDataReturnPostTypeRef} from "./TypeRefs.js"
import {FileDataDataReturnTypeRef} from "./TypeRefs.js"
import {GroupInvitationPostDataTypeRef} from "./TypeRefs.js"
import {GroupInvitationPostReturnTypeRef} from "./TypeRefs.js"
import {GroupInvitationPutDataTypeRef} from "./TypeRefs.js"
import {GroupInvitationDeleteDataTypeRef} from "./TypeRefs.js"
import {ImportImapFolderPostInTypeRef} from "./TypeRefs.js"
import {ImportImapFolderPostOutTypeRef} from "./TypeRefs.js"
import {ImportImapFolderDeleteInTypeRef} from "./TypeRefs.js"
import {ImportImapPostInTypeRef} from "./TypeRefs.js"
import {ImportImapPostOutTypeRef} from "./TypeRefs.js"
import {ImportImapDeleteInTypeRef} from "./TypeRefs.js"
import {ImportMailPostInTypeRef} from "./TypeRefs.js"
import {ImportMailPostOutTypeRef} from "./TypeRefs.js"
import {ListUnsubscribeDataTypeRef} from "./TypeRefs.js"
import {CreateLocalAdminGroupDataTypeRef} from "./TypeRefs.js"
import {DeleteGroupDataTypeRef} from "./TypeRefs.js"
import {CreateMailFolderDataTypeRef} from "./TypeRefs.js"
import {CreateMailFolderReturnTypeRef} from "./TypeRefs.js"
import {UpdateMailFolderDataTypeRef} from "./TypeRefs.js"
import {DeleteMailFolderDataTypeRef} from "./TypeRefs.js"
import {CreateMailGroupDataTypeRef} from "./TypeRefs.js"
import {DeleteMailDataTypeRef} from "./TypeRefs.js"
import {MoveMailDataTypeRef} from "./TypeRefs.js"
import {NewsOutTypeRef} from "./TypeRefs.js"
import {NewsInTypeRef} from "./TypeRefs.js"
import {ReceiveInfoServiceDataTypeRef} from "./TypeRefs.js"
import {ReportMailPostDataTypeRef} from "./TypeRefs.js"
import {SendDraftDataTypeRef} from "./TypeRefs.js"
import {SendDraftReturnTypeRef} from "./TypeRefs.js"
import {UserAreaGroupDeleteDataTypeRef} from "./TypeRefs.js"
import {UserAccountCreateDataTypeRef} from "./TypeRefs.js"

export const CalendarService = Object.freeze({
	app: "tutanota",
	name: "CalendarService",
	get: null,
	post: {data: UserAreaGroupPostDataTypeRef, return: CreateGroupPostReturnTypeRef},
	put: null,
	delete: {data: CalendarDeleteDataTypeRef, return: null},
} as const)

export const ContactFormAccountService = Object.freeze({
	app: "tutanota",
	name: "ContactFormAccountService",
	get: null,
	post: {data: ContactFormAccountDataTypeRef, return: ContactFormAccountReturnTypeRef},
	put: null,
	delete: null,
} as const)

export const CustomerAccountService = Object.freeze({
	app: "tutanota",
	name: "CustomerAccountService",
	get: null,
	post: {data: CustomerAccountCreateDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const DraftService = Object.freeze({
	app: "tutanota",
	name: "DraftService",
	get: null,
	post: {data: DraftCreateDataTypeRef, return: DraftCreateReturnTypeRef},
	put: {data: DraftUpdateDataTypeRef, return: DraftUpdateReturnTypeRef},
	delete: null,
} as const)

export const EncryptTutanotaPropertiesService = Object.freeze({
	app: "tutanota",
	name: "EncryptTutanotaPropertiesService",
	get: null,
	post: {data: EncryptTutanotaPropertiesDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const EntropyService = Object.freeze({
	app: "tutanota",
	name: "EntropyService",
	get: null,
	post: null,
	put: {data: EntropyDataTypeRef, return: null},
	delete: null,
} as const)

export const ExternalUserService = Object.freeze({
	app: "tutanota",
	name: "ExternalUserService",
	get: null,
	post: {data: ExternalUserDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const FileDataService = Object.freeze({
	app: "tutanota",
	name: "FileDataService",
	get: {data: FileDataDataGetTypeRef, return: null},
	post: {data: FileDataDataPostTypeRef, return: FileDataReturnPostTypeRef},
	put: {data: FileDataDataReturnTypeRef, return: null},
	delete: null,
} as const)

export const GroupInvitationService = Object.freeze({
	app: "tutanota",
	name: "GroupInvitationService",
	get: null,
	post: {data: GroupInvitationPostDataTypeRef, return: GroupInvitationPostReturnTypeRef},
	put: {data: GroupInvitationPutDataTypeRef, return: null},
	delete: {data: GroupInvitationDeleteDataTypeRef, return: null},
} as const)

export const ImportImapFolderService = Object.freeze({
	app: "tutanota",
	name: "ImportImapFolderService",
	get: null,
	post: {data: ImportImapFolderPostInTypeRef, return: ImportImapFolderPostOutTypeRef},
	put: null,
	delete: {data: ImportImapFolderDeleteInTypeRef, return: null},
} as const)

export const ImportImapService = Object.freeze({
	app: "tutanota",
	name: "ImportImapService",
	get: null,
	post: {data: ImportImapPostInTypeRef, return: ImportImapPostOutTypeRef},
	put: null,
	delete: {data: ImportImapDeleteInTypeRef, return: null},
} as const)

export const ImportMailService = Object.freeze({
	app: "tutanota",
	name: "ImportMailService",
	get: null,
	post: {data: ImportMailPostInTypeRef, return: ImportMailPostOutTypeRef},
	put: null,
	delete: null,
} as const)

export const ListUnsubscribeService = Object.freeze({
	app: "tutanota",
	name: "ListUnsubscribeService",
	get: null,
	post: {data: ListUnsubscribeDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const LocalAdminGroupService = Object.freeze({
	app: "tutanota",
	name: "LocalAdminGroupService",
	get: null,
	post: {data: CreateLocalAdminGroupDataTypeRef, return: null},
	put: null,
	delete: {data: DeleteGroupDataTypeRef, return: null},
} as const)

export const MailFolderService = Object.freeze({
	app: "tutanota",
	name: "MailFolderService",
	get: null,
	post: {data: CreateMailFolderDataTypeRef, return: CreateMailFolderReturnTypeRef},
	put: {data: UpdateMailFolderDataTypeRef, return: null},
	delete: {data: DeleteMailFolderDataTypeRef, return: null},
} as const)

export const MailGroupService = Object.freeze({
	app: "tutanota",
	name: "MailGroupService",
	get: null,
	post: {data: CreateMailGroupDataTypeRef, return: null},
	put: null,
	delete: {data: DeleteGroupDataTypeRef, return: null},
} as const)

export const MailService = Object.freeze({
	app: "tutanota",
	name: "MailService",
	get: null,
	post: null,
	put: null,
	delete: {data: DeleteMailDataTypeRef, return: null},
} as const)

export const MoveMailService = Object.freeze({
	app: "tutanota",
	name: "MoveMailService",
	get: null,
	post: {data: MoveMailDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const NewsService = Object.freeze({
	app: "tutanota",
	name: "NewsService",
	get: {data: null, return: NewsOutTypeRef},
	post: {data: NewsInTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const ReceiveInfoService = Object.freeze({
	app: "tutanota",
	name: "ReceiveInfoService",
	get: null,
	post: {data: ReceiveInfoServiceDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const ReportMailService = Object.freeze({
	app: "tutanota",
	name: "ReportMailService",
	get: null,
	post: {data: ReportMailPostDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)

export const SendDraftService = Object.freeze({
	app: "tutanota",
	name: "SendDraftService",
	get: null,
	post: {data: SendDraftDataTypeRef, return: SendDraftReturnTypeRef},
	put: null,
	delete: null,
} as const)

export const TemplateGroupService = Object.freeze({
	app: "tutanota",
	name: "TemplateGroupService",
	get: null,
	post: {data: UserAreaGroupPostDataTypeRef, return: CreateGroupPostReturnTypeRef},
	put: null,
	delete: {data: UserAreaGroupDeleteDataTypeRef, return: null},
} as const)

export const UserAccountService = Object.freeze({
	app: "tutanota",
	name: "UserAccountService",
	get: null,
	post: {data: UserAccountCreateDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)