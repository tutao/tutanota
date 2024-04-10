import {
	CalendarDeleteDataTypeRef,
	CreateGroupPostReturnTypeRef,
	CreateMailFolderDataTypeRef,
	CreateMailFolderReturnTypeRef,
	CreateMailGroupDataTypeRef,
	CustomerAccountCreateDataTypeRef,
	DeleteGroupDataTypeRef,
	DeleteMailDataTypeRef,
	DeleteMailFolderDataTypeRef,
	DraftCreateDataTypeRef,
	DraftCreateReturnTypeRef,
	DraftUpdateDataTypeRef,
	DraftUpdateReturnTypeRef,
	EncryptTutanotaPropertiesDataTypeRef,
	EntropyDataTypeRef,
	ExternalUserDataTypeRef,
	GroupInvitationDeleteDataTypeRef,
	GroupInvitationPostDataTypeRef,
	GroupInvitationPostReturnTypeRef,
	GroupInvitationPutDataTypeRef,
	ListUnsubscribeDataTypeRef,
	MoveMailDataTypeRef,
	NewsInTypeRef,
	NewsOutTypeRef,
	ReceiveInfoServiceDataTypeRef,
	ReportMailPostDataTypeRef,
	SendDraftDataTypeRef,
	SendDraftReturnTypeRef,
	UpdateMailFolderDataTypeRef,
	UserAccountCreateDataTypeRef,
	UserAreaGroupDeleteDataTypeRef,
	UserAreaGroupPostDataTypeRef
} from "./TypeRefs.js"

export const CalendarService = Object.freeze({
	app: "tutanota",
	name: "CalendarService",
	get: null,
	post: {data: UserAreaGroupPostDataTypeRef, return: CreateGroupPostReturnTypeRef},
	put: null,
	delete: {data: CalendarDeleteDataTypeRef, return: null},
} as const)

export const ContactListGroupService = Object.freeze({
	app: "tutanota",
	name: "ContactListGroupService",
	get: null,
	post: {data: UserAreaGroupPostDataTypeRef, return: CreateGroupPostReturnTypeRef},
	put: null,
	delete: {data: UserAreaGroupDeleteDataTypeRef, return: null},
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