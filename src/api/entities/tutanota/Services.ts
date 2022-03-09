import {UserAreaGroupPostDataTypeRef} from "./UserAreaGroupPostData.js"
import {CreateGroupPostReturnTypeRef} from "./CreateGroupPostReturn.js"
import {CalendarDeleteDataTypeRef} from "./CalendarDeleteData.js"
import {ContactFormAccountDataTypeRef} from "./ContactFormAccountData.js"
import {ContactFormAccountReturnTypeRef} from "./ContactFormAccountReturn.js"
import {CustomerAccountCreateDataTypeRef} from "./CustomerAccountCreateData.js"
import {DraftCreateDataTypeRef} from "./DraftCreateData.js"
import {DraftCreateReturnTypeRef} from "./DraftCreateReturn.js"
import {DraftUpdateDataTypeRef} from "./DraftUpdateData.js"
import {DraftUpdateReturnTypeRef} from "./DraftUpdateReturn.js"
import {EncryptTutanotaPropertiesDataTypeRef} from "./EncryptTutanotaPropertiesData.js"
import {EntropyDataTypeRef} from "./EntropyData.js"
import {ExternalUserDataTypeRef} from "./ExternalUserData.js"
import {FileDataDataGetTypeRef} from "./FileDataDataGet.js"
import {FileDataDataPostTypeRef} from "./FileDataDataPost.js"
import {FileDataReturnPostTypeRef} from "./FileDataReturnPost.js"
import {FileDataDataReturnTypeRef} from "./FileDataDataReturn.js"
import {GroupInvitationPostDataTypeRef} from "./GroupInvitationPostData.js"
import {GroupInvitationPostReturnTypeRef} from "./GroupInvitationPostReturn.js"
import {GroupInvitationPutDataTypeRef} from "./GroupInvitationPutData.js"
import {GroupInvitationDeleteDataTypeRef} from "./GroupInvitationDeleteData.js"
import {ListUnsubscribeDataTypeRef} from "./ListUnsubscribeData.js"
import {CreateLocalAdminGroupDataTypeRef} from "./CreateLocalAdminGroupData.js"
import {DeleteGroupDataTypeRef} from "./DeleteGroupData.js"
import {CreateMailFolderDataTypeRef} from "./CreateMailFolderData.js"
import {CreateMailFolderReturnTypeRef} from "./CreateMailFolderReturn.js"
import {DeleteMailFolderDataTypeRef} from "./DeleteMailFolderData.js"
import {CreateMailGroupDataTypeRef} from "./CreateMailGroupData.js"
import {DeleteMailDataTypeRef} from "./DeleteMailData.js"
import {MoveMailDataTypeRef} from "./MoveMailData.js"
import {ReceiveInfoServiceDataTypeRef} from "./ReceiveInfoServiceData.js"
import {ReportMailPostDataTypeRef} from "./ReportMailPostData.js"
import {SendDraftDataTypeRef} from "./SendDraftData.js"
import {SendDraftReturnTypeRef} from "./SendDraftReturn.js"
import {UserAreaGroupDeleteDataTypeRef} from "./UserAreaGroupDeleteData.js"
import {UserAccountCreateDataTypeRef} from "./UserAccountCreateData.js"

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
	put: null,
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