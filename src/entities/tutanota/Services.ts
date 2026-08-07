import { ApplyLabelServicePostIn, ApplyLabelServicePostInTypeRef } from "./TypeRefs.js"
import { UserAreaGroupPostData, UserAreaGroupPostDataTypeRef } from "./TypeRefs.js"
import { CreateGroupPostReturn, CreateGroupPostReturnTypeRef } from "./TypeRefs.js"
import { CalendarDeleteIn, CalendarDeleteInTypeRef } from "./TypeRefs.js"
import { ChangePrimaryAddressServicePutIn, ChangePrimaryAddressServicePutInTypeRef } from "./TypeRefs.js"
import { ClientClassifierResultPostIn, ClientClassifierResultPostInTypeRef } from "./TypeRefs.js"
import { UserAreaGroupDeleteData, UserAreaGroupDeleteDataTypeRef } from "./TypeRefs.js"
import { CustomerAccountCreateData, CustomerAccountCreateDataTypeRef } from "./TypeRefs.js"
import { DraftCreateData, DraftCreateDataTypeRef } from "./TypeRefs.js"
import { DraftCreateReturn, DraftCreateReturnTypeRef } from "./TypeRefs.js"
import { DraftUpdateData, DraftUpdateDataTypeRef } from "./TypeRefs.js"
import { DraftUpdateReturn, DraftUpdateReturnTypeRef } from "./TypeRefs.js"
import { EncryptTutanotaPropertiesData, EncryptTutanotaPropertiesDataTypeRef } from "./TypeRefs.js"
import { EntropyData, EntropyDataTypeRef } from "./TypeRefs.js"
import { ExternalUserData, ExternalUserDataTypeRef } from "./TypeRefs.js"
import { GroupInvitationPostData, GroupInvitationPostDataTypeRef } from "./TypeRefs.js"
import { GroupInvitationPostReturn, GroupInvitationPostReturnTypeRef } from "./TypeRefs.js"
import { GroupInvitationPutData, GroupInvitationPutDataTypeRef } from "./TypeRefs.js"
import { GroupInvitationDeleteData, GroupInvitationDeleteDataTypeRef } from "./TypeRefs.js"
import { ImapFolderPostIn, ImapFolderPostInTypeRef } from "./TypeRefs.js"
import { ImapFolderPostOut, ImapFolderPostOutTypeRef } from "./TypeRefs.js"
import { ImapFolderDeleteIn, ImapFolderDeleteInTypeRef } from "./TypeRefs.js"
import { ImapOauthConfigGetIn, ImapOauthConfigGetInTypeRef } from "./TypeRefs.js"
import { ImapOauthConfigGetOut, ImapOauthConfigGetOutTypeRef } from "./TypeRefs.js"
import { ImapPostIn, ImapPostInTypeRef } from "./TypeRefs.js"
import { ImapPostOut, ImapPostOutTypeRef } from "./TypeRefs.js"
import { ImapPutIn, ImapPutInTypeRef } from "./TypeRefs.js"
import { ImapDeleteIn, ImapDeleteInTypeRef } from "./TypeRefs.js"
import { ImportMailGetIn, ImportMailGetInTypeRef } from "./TypeRefs.js"
import { ImportMailGetOut, ImportMailGetOutTypeRef } from "./TypeRefs.js"
import { ImportMailPostIn, ImportMailPostInTypeRef } from "./TypeRefs.js"
import { ImportMailPostOut, ImportMailPostOutTypeRef } from "./TypeRefs.js"
import { ListUnsubscribeData, ListUnsubscribeDataTypeRef } from "./TypeRefs.js"
import { MailExportTokenServicePostOut, MailExportTokenServicePostOutTypeRef } from "./TypeRefs.js"
import { CreateMailFolderData, CreateMailFolderDataTypeRef } from "./TypeRefs.js"
import { CreateMailFolderReturn, CreateMailFolderReturnTypeRef } from "./TypeRefs.js"
import { UpdateMailFolderData, UpdateMailFolderDataTypeRef } from "./TypeRefs.js"
import { DeleteMailFolderData, DeleteMailFolderDataTypeRef } from "./TypeRefs.js"
import { CreateMailGroupData, CreateMailGroupDataTypeRef } from "./TypeRefs.js"
import { MailGroupPostOut, MailGroupPostOutTypeRef } from "./TypeRefs.js"
import { DeleteGroupData, DeleteGroupDataTypeRef } from "./TypeRefs.js"
import { DeleteMailData, DeleteMailDataTypeRef } from "./TypeRefs.js"
import { ManageLabelServicePostIn, ManageLabelServicePostInTypeRef } from "./TypeRefs.js"
import { ManageLabelServicePostOut, ManageLabelServicePostOutTypeRef } from "./TypeRefs.js"
import { ManageLabelServicePutIn, ManageLabelServicePutInTypeRef } from "./TypeRefs.js"
import { ManageLabelServiceDeleteIn, ManageLabelServiceDeleteInTypeRef } from "./TypeRefs.js"
import { MoveMailData, MoveMailDataTypeRef } from "./TypeRefs.js"
import { MoveMailPostOut, MoveMailPostOutTypeRef } from "./TypeRefs.js"
import { NewsOut, NewsOutTypeRef } from "./TypeRefs.js"
import { NewsIn, NewsInTypeRef } from "./TypeRefs.js"
import { PopulateClientSpamTrainingDataPostIn, PopulateClientSpamTrainingDataPostInTypeRef } from "./TypeRefs.js"
import { ProcessInboxPostIn, ProcessInboxPostInTypeRef } from "./TypeRefs.js"
import { ReceiveInfoServiceData, ReceiveInfoServiceDataTypeRef } from "./TypeRefs.js"
import { ReceiveInfoServicePostOut, ReceiveInfoServicePostOutTypeRef } from "./TypeRefs.js"
import { ReportMailPostData, ReportMailPostDataTypeRef } from "./TypeRefs.js"
import { ResolveConversationsServiceGetIn, ResolveConversationsServiceGetInTypeRef } from "./TypeRefs.js"
import { ResolveConversationsServiceGetOut, ResolveConversationsServiceGetOutTypeRef } from "./TypeRefs.js"
import { SendDraftData, SendDraftDataTypeRef } from "./TypeRefs.js"
import { SendDraftReturn, SendDraftReturnTypeRef } from "./TypeRefs.js"
import { SendDraftDeleteIn, SendDraftDeleteInTypeRef } from "./TypeRefs.js"
import { SimpleMoveMailPostIn, SimpleMoveMailPostInTypeRef } from "./TypeRefs.js"
import { TranslationGetIn, TranslationGetInTypeRef } from "./TypeRefs.js"
import { TranslationGetOut, TranslationGetOutTypeRef } from "./TypeRefs.js"
import { UnreadMailStatePostIn, UnreadMailStatePostInTypeRef } from "./TypeRefs.js"
import { UserAccountCreateData, UserAccountCreateDataTypeRef } from "./TypeRefs.js"
import { UserAccountPostOut, UserAccountPostOutTypeRef } from "./TypeRefs.js"
import { GetService, PostService, PutService, DeleteService, NonExistentDataTransferEntity, NonExistentDataTransferEntityTypeRef } from "@tutao/meta"

export const ApplyLabelService_POST = new PostService<ApplyLabelServicePostIn, NonExistentDataTransferEntity>("tutanota", "ApplyLabelService", ApplyLabelServicePostInTypeRef, NonExistentDataTransferEntityTypeRef)

export const CalendarService_POST = new PostService<UserAreaGroupPostData, CreateGroupPostReturn>("tutanota", "CalendarService", UserAreaGroupPostDataTypeRef, CreateGroupPostReturnTypeRef)
export const CalendarService_DELETE = new DeleteService<CalendarDeleteIn, NonExistentDataTransferEntity>("tutanota", "CalendarService", CalendarDeleteInTypeRef, NonExistentDataTransferEntityTypeRef)

export const ChangePrimaryAddressService_PUT = new PutService<ChangePrimaryAddressServicePutIn, NonExistentDataTransferEntity>("tutanota", "ChangePrimaryAddressService", ChangePrimaryAddressServicePutInTypeRef, NonExistentDataTransferEntityTypeRef)

export const ClientClassifierResultService_POST = new PostService<ClientClassifierResultPostIn, NonExistentDataTransferEntity>("tutanota", "ClientClassifierResultService", ClientClassifierResultPostInTypeRef, NonExistentDataTransferEntityTypeRef)

export const ContactListGroupService_POST = new PostService<UserAreaGroupPostData, CreateGroupPostReturn>("tutanota", "ContactListGroupService", UserAreaGroupPostDataTypeRef, CreateGroupPostReturnTypeRef)
export const ContactListGroupService_DELETE = new DeleteService<UserAreaGroupDeleteData, NonExistentDataTransferEntity>("tutanota", "ContactListGroupService", UserAreaGroupDeleteDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const CustomerAccountService_POST = new PostService<CustomerAccountCreateData, NonExistentDataTransferEntity>("tutanota", "CustomerAccountService", CustomerAccountCreateDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const DraftService_POST = new PostService<DraftCreateData, DraftCreateReturn>("tutanota", "DraftService", DraftCreateDataTypeRef, DraftCreateReturnTypeRef)
export const DraftService_PUT = new PutService<DraftUpdateData, DraftUpdateReturn>("tutanota", "DraftService", DraftUpdateDataTypeRef, DraftUpdateReturnTypeRef)

export const EncryptTutanotaPropertiesService_POST = new PostService<EncryptTutanotaPropertiesData, NonExistentDataTransferEntity>("tutanota", "EncryptTutanotaPropertiesService", EncryptTutanotaPropertiesDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const EntropyService_PUT = new PutService<EntropyData, NonExistentDataTransferEntity>("tutanota", "EntropyService", EntropyDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const ExternalUserService_POST = new PostService<ExternalUserData, NonExistentDataTransferEntity>("tutanota", "ExternalUserService", ExternalUserDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const GroupInvitationService_POST = new PostService<GroupInvitationPostData, GroupInvitationPostReturn>("tutanota", "GroupInvitationService", GroupInvitationPostDataTypeRef, GroupInvitationPostReturnTypeRef)
export const GroupInvitationService_PUT = new PutService<GroupInvitationPutData, NonExistentDataTransferEntity>("tutanota", "GroupInvitationService", GroupInvitationPutDataTypeRef, NonExistentDataTransferEntityTypeRef)
export const GroupInvitationService_DELETE = new DeleteService<GroupInvitationDeleteData, NonExistentDataTransferEntity>("tutanota", "GroupInvitationService", GroupInvitationDeleteDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const ImapFolderService_POST = new PostService<ImapFolderPostIn, ImapFolderPostOut>("tutanota", "ImapFolderService", ImapFolderPostInTypeRef, ImapFolderPostOutTypeRef)
export const ImapFolderService_DELETE = new DeleteService<ImapFolderDeleteIn, NonExistentDataTransferEntity>("tutanota", "ImapFolderService", ImapFolderDeleteInTypeRef, NonExistentDataTransferEntityTypeRef)

export const ImapOauthConfigService_GET = new GetService<ImapOauthConfigGetIn, ImapOauthConfigGetOut>("tutanota", "ImapOauthConfigService", ImapOauthConfigGetInTypeRef, ImapOauthConfigGetOutTypeRef)

export const ImapService_POST = new PostService<ImapPostIn, ImapPostOut>("tutanota", "ImapService", ImapPostInTypeRef, ImapPostOutTypeRef)
export const ImapService_PUT = new PutService<ImapPutIn, NonExistentDataTransferEntity>("tutanota", "ImapService", ImapPutInTypeRef, NonExistentDataTransferEntityTypeRef)
export const ImapService_DELETE = new DeleteService<ImapDeleteIn, NonExistentDataTransferEntity>("tutanota", "ImapService", ImapDeleteInTypeRef, NonExistentDataTransferEntityTypeRef)

export const ImportMailService_GET = new GetService<ImportMailGetIn, ImportMailGetOut>("tutanota", "ImportMailService", ImportMailGetInTypeRef, ImportMailGetOutTypeRef)
export const ImportMailService_POST = new PostService<ImportMailPostIn, ImportMailPostOut>("tutanota", "ImportMailService", ImportMailPostInTypeRef, ImportMailPostOutTypeRef)

export const ListUnsubscribeService_POST = new PostService<ListUnsubscribeData, NonExistentDataTransferEntity>("tutanota", "ListUnsubscribeService", ListUnsubscribeDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const MailExportTokenService_POST = new PostService<NonExistentDataTransferEntity, MailExportTokenServicePostOut>("tutanota", "MailExportTokenService", NonExistentDataTransferEntityTypeRef, MailExportTokenServicePostOutTypeRef)

export const MailFolderService_POST = new PostService<CreateMailFolderData, CreateMailFolderReturn>("tutanota", "MailFolderService", CreateMailFolderDataTypeRef, CreateMailFolderReturnTypeRef)
export const MailFolderService_PUT = new PutService<UpdateMailFolderData, NonExistentDataTransferEntity>("tutanota", "MailFolderService", UpdateMailFolderDataTypeRef, NonExistentDataTransferEntityTypeRef)
export const MailFolderService_DELETE = new DeleteService<DeleteMailFolderData, NonExistentDataTransferEntity>("tutanota", "MailFolderService", DeleteMailFolderDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const MailGroupService_POST = new PostService<CreateMailGroupData, MailGroupPostOut>("tutanota", "MailGroupService", CreateMailGroupDataTypeRef, MailGroupPostOutTypeRef)
export const MailGroupService_DELETE = new DeleteService<DeleteGroupData, NonExistentDataTransferEntity>("tutanota", "MailGroupService", DeleteGroupDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const MailService_DELETE = new DeleteService<DeleteMailData, NonExistentDataTransferEntity>("tutanota", "MailService", DeleteMailDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const ManageLabelService_POST = new PostService<ManageLabelServicePostIn, ManageLabelServicePostOut>("tutanota", "ManageLabelService", ManageLabelServicePostInTypeRef, ManageLabelServicePostOutTypeRef)
export const ManageLabelService_PUT = new PutService<ManageLabelServicePutIn, NonExistentDataTransferEntity>("tutanota", "ManageLabelService", ManageLabelServicePutInTypeRef, NonExistentDataTransferEntityTypeRef)
export const ManageLabelService_DELETE = new DeleteService<ManageLabelServiceDeleteIn, NonExistentDataTransferEntity>("tutanota", "ManageLabelService", ManageLabelServiceDeleteInTypeRef, NonExistentDataTransferEntityTypeRef)

export const MoveMailService_POST = new PostService<MoveMailData, MoveMailPostOut>("tutanota", "MoveMailService", MoveMailDataTypeRef, MoveMailPostOutTypeRef)

export const NewsService_GET = new GetService<NonExistentDataTransferEntity, NewsOut>("tutanota", "NewsService", NonExistentDataTransferEntityTypeRef, NewsOutTypeRef)
export const NewsService_POST = new PostService<NewsIn, NonExistentDataTransferEntity>("tutanota", "NewsService", NewsInTypeRef, NonExistentDataTransferEntityTypeRef)

export const PopulateClientSpamTrainingDataService_POST = new PostService<PopulateClientSpamTrainingDataPostIn, NonExistentDataTransferEntity>("tutanota", "PopulateClientSpamTrainingDataService", PopulateClientSpamTrainingDataPostInTypeRef, NonExistentDataTransferEntityTypeRef)

export const ProcessInboxService_POST = new PostService<ProcessInboxPostIn, NonExistentDataTransferEntity>("tutanota", "ProcessInboxService", ProcessInboxPostInTypeRef, NonExistentDataTransferEntityTypeRef)

export const ReceiveInfoService_POST = new PostService<ReceiveInfoServiceData, ReceiveInfoServicePostOut>("tutanota", "ReceiveInfoService", ReceiveInfoServiceDataTypeRef, ReceiveInfoServicePostOutTypeRef)

export const ReportMailService_POST = new PostService<ReportMailPostData, NonExistentDataTransferEntity>("tutanota", "ReportMailService", ReportMailPostDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const ResolveConversationsService_GET = new GetService<ResolveConversationsServiceGetIn, ResolveConversationsServiceGetOut>("tutanota", "ResolveConversationsService", ResolveConversationsServiceGetInTypeRef, ResolveConversationsServiceGetOutTypeRef)

export const SendDraftService_POST = new PostService<SendDraftData, SendDraftReturn>("tutanota", "SendDraftService", SendDraftDataTypeRef, SendDraftReturnTypeRef)
export const SendDraftService_DELETE = new DeleteService<SendDraftDeleteIn, NonExistentDataTransferEntity>("tutanota", "SendDraftService", SendDraftDeleteInTypeRef, NonExistentDataTransferEntityTypeRef)

export const SimpleMoveMailService_POST = new PostService<SimpleMoveMailPostIn, MoveMailPostOut>("tutanota", "SimpleMoveMailService", SimpleMoveMailPostInTypeRef, MoveMailPostOutTypeRef)

export const TemplateGroupService_POST = new PostService<UserAreaGroupPostData, CreateGroupPostReturn>("tutanota", "TemplateGroupService", UserAreaGroupPostDataTypeRef, CreateGroupPostReturnTypeRef)
export const TemplateGroupService_DELETE = new DeleteService<UserAreaGroupDeleteData, NonExistentDataTransferEntity>("tutanota", "TemplateGroupService", UserAreaGroupDeleteDataTypeRef, NonExistentDataTransferEntityTypeRef)

export const TranslationService_GET = new GetService<TranslationGetIn, TranslationGetOut>("tutanota", "TranslationService", TranslationGetInTypeRef, TranslationGetOutTypeRef)

export const UnreadMailStateService_POST = new PostService<UnreadMailStatePostIn, NonExistentDataTransferEntity>("tutanota", "UnreadMailStateService", UnreadMailStatePostInTypeRef, NonExistentDataTransferEntityTypeRef)

export const UserAccountService_POST = new PostService<UserAccountCreateData, UserAccountPostOut>("tutanota", "UserAccountService", UserAccountCreateDataTypeRef, UserAccountPostOutTypeRef)