import * as tutanotaTypeRefs from "./TypeRefs.js"
export const ApplyLabelService = Object.freeze({
	app: "tutanota",
	name: "ApplyLabelService",
	get: null,
	post: { data: tutanotaTypeRefs.ApplyLabelServicePostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const CalendarService = Object.freeze({
	app: "tutanota",
	name: "CalendarService",
	get: null,
	post: { data: tutanotaTypeRefs.UserAreaGroupPostDataTypeRef, return: tutanotaTypeRefs.CreateGroupPostReturnTypeRef },
	put: null,
	delete: { data: tutanotaTypeRefs.CalendarDeleteInTypeRef, return: null },
} as const)

export const ChangePrimaryAddressService = Object.freeze({
	app: "tutanota",
	name: "ChangePrimaryAddressService",
	get: null,
	post: null,
	put: { data: tutanotaTypeRefs.ChangePrimaryAddressServicePutInTypeRef, return: null },
	delete: null,
} as const)

export const ClientClassifierResultService = Object.freeze({
	app: "tutanota",
	name: "ClientClassifierResultService",
	get: null,
	post: { data: tutanotaTypeRefs.ClientClassifierResultPostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const ContactListGroupService = Object.freeze({
	app: "tutanota",
	name: "ContactListGroupService",
	get: null,
	post: { data: tutanotaTypeRefs.UserAreaGroupPostDataTypeRef, return: tutanotaTypeRefs.CreateGroupPostReturnTypeRef },
	put: null,
	delete: { data: tutanotaTypeRefs.UserAreaGroupDeleteDataTypeRef, return: null },
} as const)

export const CustomerAccountService = Object.freeze({
	app: "tutanota",
	name: "CustomerAccountService",
	get: null,
	post: { data: tutanotaTypeRefs.CustomerAccountCreateDataTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const DraftService = Object.freeze({
	app: "tutanota",
	name: "DraftService",
	get: null,
	post: { data: tutanotaTypeRefs.DraftCreateDataTypeRef, return: tutanotaTypeRefs.DraftCreateReturnTypeRef },
	put: { data: tutanotaTypeRefs.DraftUpdateDataTypeRef, return: tutanotaTypeRefs.DraftUpdateReturnTypeRef },
	delete: null,
} as const)

export const EncryptTutanotaPropertiesService = Object.freeze({
	app: "tutanota",
	name: "EncryptTutanotaPropertiesService",
	get: null,
	post: { data: tutanotaTypeRefs.EncryptTutanotaPropertiesDataTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const EntropyService = Object.freeze({
	app: "tutanota",
	name: "EntropyService",
	get: null,
	post: null,
	put: { data: tutanotaTypeRefs.EntropyDataTypeRef, return: null },
	delete: null,
} as const)

export const ExternalUserService = Object.freeze({
	app: "tutanota",
	name: "ExternalUserService",
	get: null,
	post: { data: tutanotaTypeRefs.ExternalUserDataTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const GroupInvitationService = Object.freeze({
	app: "tutanota",
	name: "GroupInvitationService",
	get: null,
	post: { data: tutanotaTypeRefs.GroupInvitationPostDataTypeRef, return: tutanotaTypeRefs.GroupInvitationPostReturnTypeRef },
	put: { data: tutanotaTypeRefs.GroupInvitationPutDataTypeRef, return: null },
	delete: { data: tutanotaTypeRefs.GroupInvitationDeleteDataTypeRef, return: null },
} as const)

export const ImportMailService = Object.freeze({
	app: "tutanota",
	name: "ImportMailService",
	get: { data: tutanotaTypeRefs.ImportMailGetInTypeRef, return: tutanotaTypeRefs.ImportMailGetOutTypeRef },
	post: { data: tutanotaTypeRefs.ImportMailPostInTypeRef, return: tutanotaTypeRefs.ImportMailPostOutTypeRef },
	put: null,
	delete: null,
} as const)

export const ListUnsubscribeService = Object.freeze({
	app: "tutanota",
	name: "ListUnsubscribeService",
	get: null,
	post: { data: tutanotaTypeRefs.ListUnsubscribeDataTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const MailExportTokenService = Object.freeze({
	app: "tutanota",
	name: "MailExportTokenService",
	get: null,
	post: { data: null, return: tutanotaTypeRefs.MailExportTokenServicePostOutTypeRef },
	put: null,
	delete: null,
} as const)

export const MailFolderService = Object.freeze({
	app: "tutanota",
	name: "MailFolderService",
	get: null,
	post: { data: tutanotaTypeRefs.CreateMailFolderDataTypeRef, return: tutanotaTypeRefs.CreateMailFolderReturnTypeRef },
	put: { data: tutanotaTypeRefs.UpdateMailFolderDataTypeRef, return: null },
	delete: { data: tutanotaTypeRefs.DeleteMailFolderDataTypeRef, return: null },
} as const)

export const MailGroupService = Object.freeze({
	app: "tutanota",
	name: "MailGroupService",
	get: null,
	post: { data: tutanotaTypeRefs.CreateMailGroupDataTypeRef, return: tutanotaTypeRefs.MailGroupPostOutTypeRef },
	put: null,
	delete: { data: tutanotaTypeRefs.DeleteGroupDataTypeRef, return: null },
} as const)

export const MailService = Object.freeze({
	app: "tutanota",
	name: "MailService",
	get: null,
	post: null,
	put: null,
	delete: { data: tutanotaTypeRefs.DeleteMailDataTypeRef, return: null },
} as const)

export const ManageLabelService = Object.freeze({
	app: "tutanota",
	name: "ManageLabelService",
	get: null,
	post: { data: tutanotaTypeRefs.ManageLabelServicePostInTypeRef, return: null },
	put: null,
	delete: { data: tutanotaTypeRefs.ManageLabelServiceDeleteInTypeRef, return: null },
} as const)

export const MoveMailService = Object.freeze({
	app: "tutanota",
	name: "MoveMailService",
	get: null,
	post: { data: tutanotaTypeRefs.MoveMailDataTypeRef, return: tutanotaTypeRefs.MoveMailPostOutTypeRef },
	put: null,
	delete: null,
} as const)

export const NewsService = Object.freeze({
	app: "tutanota",
	name: "NewsService",
	get: { data: null, return: tutanotaTypeRefs.NewsOutTypeRef },
	post: { data: tutanotaTypeRefs.NewsInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const PopulateClientSpamTrainingDataService = Object.freeze({
	app: "tutanota",
	name: "PopulateClientSpamTrainingDataService",
	get: null,
	post: { data: tutanotaTypeRefs.PopulateClientSpamTrainingDataPostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const ProcessInboxService = Object.freeze({
	app: "tutanota",
	name: "ProcessInboxService",
	get: null,
	post: { data: tutanotaTypeRefs.ProcessInboxPostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const ReceiveInfoService = Object.freeze({
	app: "tutanota",
	name: "ReceiveInfoService",
	get: null,
	post: { data: tutanotaTypeRefs.ReceiveInfoServiceDataTypeRef, return: tutanotaTypeRefs.ReceiveInfoServicePostOutTypeRef },
	put: null,
	delete: null,
} as const)

export const ReportMailService = Object.freeze({
	app: "tutanota",
	name: "ReportMailService",
	get: null,
	post: { data: tutanotaTypeRefs.ReportMailPostDataTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const ResolveConversationsService = Object.freeze({
	app: "tutanota",
	name: "ResolveConversationsService",
	get: { data: tutanotaTypeRefs.ResolveConversationsServiceGetInTypeRef, return: tutanotaTypeRefs.ResolveConversationsServiceGetOutTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const SendDraftService = Object.freeze({
	app: "tutanota",
	name: "SendDraftService",
	get: null,
	post: { data: tutanotaTypeRefs.SendDraftDataTypeRef, return: tutanotaTypeRefs.SendDraftReturnTypeRef },
	put: null,
	delete: { data: tutanotaTypeRefs.SendDraftDeleteInTypeRef, return: null },
} as const)

export const SimpleMoveMailService = Object.freeze({
	app: "tutanota",
	name: "SimpleMoveMailService",
	get: null,
	post: { data: tutanotaTypeRefs.SimpleMoveMailPostInTypeRef, return: tutanotaTypeRefs.MoveMailPostOutTypeRef },
	put: null,
	delete: null,
} as const)

export const TemplateGroupService = Object.freeze({
	app: "tutanota",
	name: "TemplateGroupService",
	get: null,
	post: { data: tutanotaTypeRefs.UserAreaGroupPostDataTypeRef, return: tutanotaTypeRefs.CreateGroupPostReturnTypeRef },
	put: null,
	delete: { data: tutanotaTypeRefs.UserAreaGroupDeleteDataTypeRef, return: null },
} as const)

export const TranslationService = Object.freeze({
	app: "tutanota",
	name: "TranslationService",
	get: { data: tutanotaTypeRefs.TranslationGetInTypeRef, return: tutanotaTypeRefs.TranslationGetOutTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)

export const UnreadMailStateService = Object.freeze({
	app: "tutanota",
	name: "UnreadMailStateService",
	get: null,
	post: { data: tutanotaTypeRefs.UnreadMailStatePostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const UserAccountService = Object.freeze({
	app: "tutanota",
	name: "UserAccountService",
	get: null,
	post: { data: tutanotaTypeRefs.UserAccountCreateDataTypeRef, return: tutanotaTypeRefs.UserAccountPostOutTypeRef },
	put: null,
	delete: null,
} as const)