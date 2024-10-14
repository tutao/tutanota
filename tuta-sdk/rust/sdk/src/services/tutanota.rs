#![allow(unused_imports, dead_code, unused_variables)]
use crate::entities::tutanota::CalendarDeleteData;
use crate::entities::tutanota::CreateGroupPostReturn;
use crate::entities::tutanota::CreateMailFolderData;
use crate::entities::tutanota::CreateMailFolderReturn;
use crate::entities::tutanota::CreateMailGroupData;
use crate::entities::tutanota::CustomerAccountCreateData;
use crate::entities::tutanota::DeleteGroupData;
use crate::entities::tutanota::DeleteMailData;
use crate::entities::tutanota::DeleteMailFolderData;
use crate::entities::tutanota::DraftCreateData;
use crate::entities::tutanota::DraftCreateReturn;
use crate::entities::tutanota::DraftUpdateData;
use crate::entities::tutanota::DraftUpdateReturn;
use crate::entities::tutanota::EncryptTutanotaPropertiesData;
use crate::entities::tutanota::EntropyData;
use crate::entities::tutanota::ExternalUserData;
use crate::entities::tutanota::GroupInvitationDeleteData;
use crate::entities::tutanota::GroupInvitationPostData;
use crate::entities::tutanota::GroupInvitationPostReturn;
use crate::entities::tutanota::GroupInvitationPutData;
use crate::entities::tutanota::ListUnsubscribeData;
use crate::entities::tutanota::MoveMailData;
use crate::entities::tutanota::NewsIn;
use crate::entities::tutanota::NewsOut;
use crate::entities::tutanota::ReceiveInfoServiceData;
use crate::entities::tutanota::ReportMailPostData;
use crate::entities::tutanota::SendDraftData;
use crate::entities::tutanota::SendDraftReturn;
use crate::entities::tutanota::TranslationGetIn;
use crate::entities::tutanota::TranslationGetOut;
use crate::entities::tutanota::UpdateMailFolderData;
use crate::entities::tutanota::UserAccountCreateData;
use crate::entities::tutanota::UserAreaGroupDeleteData;
use crate::entities::tutanota::UserAreaGroupPostData;
use crate::entities::Entity;
use crate::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::services::{
	DeleteService, Executor, ExtraServiceParams, GetService, PostService, PutService, Service,
};
use crate::ApiCallError;
pub struct CalendarService;

crate::service_impl!(declare, CalendarService, "tutanota/calendarservice", 75);
crate::service_impl!(
	POST,
	CalendarService,
	UserAreaGroupPostData,
	CreateGroupPostReturn
);
crate::service_impl!(DELETE, CalendarService, CalendarDeleteData, ());

pub struct ContactListGroupService;

crate::service_impl!(
	declare,
	ContactListGroupService,
	"tutanota/contactlistgroupservice",
	75
);
crate::service_impl!(
	POST,
	ContactListGroupService,
	UserAreaGroupPostData,
	CreateGroupPostReturn
);
crate::service_impl!(DELETE, ContactListGroupService, UserAreaGroupDeleteData, ());

pub struct CustomerAccountService;

crate::service_impl!(
	declare,
	CustomerAccountService,
	"tutanota/customeraccountservice",
	75
);
crate::service_impl!(POST, CustomerAccountService, CustomerAccountCreateData, ());

pub struct DraftService;

crate::service_impl!(declare, DraftService, "tutanota/draftservice", 75);
crate::service_impl!(POST, DraftService, DraftCreateData, DraftCreateReturn);
crate::service_impl!(PUT, DraftService, DraftUpdateData, DraftUpdateReturn);

pub struct EncryptTutanotaPropertiesService;

crate::service_impl!(
	declare,
	EncryptTutanotaPropertiesService,
	"tutanota/encrypttutanotapropertiesservice",
	75
);
crate::service_impl!(
	POST,
	EncryptTutanotaPropertiesService,
	EncryptTutanotaPropertiesData,
	()
);

pub struct EntropyService;

crate::service_impl!(declare, EntropyService, "tutanota/entropyservice", 75);
crate::service_impl!(PUT, EntropyService, EntropyData, ());

pub struct ExternalUserService;

crate::service_impl!(
	declare,
	ExternalUserService,
	"tutanota/externaluserservice",
	75
);
crate::service_impl!(POST, ExternalUserService, ExternalUserData, ());

pub struct GroupInvitationService;

crate::service_impl!(
	declare,
	GroupInvitationService,
	"tutanota/groupinvitationservice",
	75
);
crate::service_impl!(
	POST,
	GroupInvitationService,
	GroupInvitationPostData,
	GroupInvitationPostReturn
);
crate::service_impl!(PUT, GroupInvitationService, GroupInvitationPutData, ());
crate::service_impl!(
	DELETE,
	GroupInvitationService,
	GroupInvitationDeleteData,
	()
);

pub struct ListUnsubscribeService;

crate::service_impl!(
	declare,
	ListUnsubscribeService,
	"tutanota/listunsubscribeservice",
	75
);
crate::service_impl!(POST, ListUnsubscribeService, ListUnsubscribeData, ());

pub struct MailFolderService;

crate::service_impl!(declare, MailFolderService, "tutanota/mailfolderservice", 75);
crate::service_impl!(
	POST,
	MailFolderService,
	CreateMailFolderData,
	CreateMailFolderReturn
);
crate::service_impl!(PUT, MailFolderService, UpdateMailFolderData, ());
crate::service_impl!(DELETE, MailFolderService, DeleteMailFolderData, ());

pub struct MailGroupService;

crate::service_impl!(declare, MailGroupService, "tutanota/mailgroupservice", 75);
crate::service_impl!(POST, MailGroupService, CreateMailGroupData, ());
crate::service_impl!(DELETE, MailGroupService, DeleteGroupData, ());

pub struct MailService;

crate::service_impl!(declare, MailService, "tutanota/mailservice", 75);
crate::service_impl!(DELETE, MailService, DeleteMailData, ());

pub struct MoveMailService;

crate::service_impl!(declare, MoveMailService, "tutanota/movemailservice", 75);
crate::service_impl!(POST, MoveMailService, MoveMailData, ());

pub struct NewsService;

crate::service_impl!(declare, NewsService, "tutanota/newsservice", 75);
crate::service_impl!(POST, NewsService, NewsIn, ());
crate::service_impl!(GET, NewsService, (), NewsOut);

pub struct ReceiveInfoService;

crate::service_impl!(
	declare,
	ReceiveInfoService,
	"tutanota/receiveinfoservice",
	75
);
crate::service_impl!(POST, ReceiveInfoService, ReceiveInfoServiceData, ());

pub struct ReportMailService;

crate::service_impl!(declare, ReportMailService, "tutanota/reportmailservice", 75);
crate::service_impl!(POST, ReportMailService, ReportMailPostData, ());

pub struct SendDraftService;

crate::service_impl!(declare, SendDraftService, "tutanota/senddraftservice", 75);
crate::service_impl!(POST, SendDraftService, SendDraftData, SendDraftReturn);

pub struct TemplateGroupService;

crate::service_impl!(
	declare,
	TemplateGroupService,
	"tutanota/templategroupservice",
	75
);
crate::service_impl!(
	POST,
	TemplateGroupService,
	UserAreaGroupPostData,
	CreateGroupPostReturn
);
crate::service_impl!(DELETE, TemplateGroupService, UserAreaGroupDeleteData, ());

pub struct TranslationService;

crate::service_impl!(
	declare,
	TranslationService,
	"tutanota/translationservice",
	75
);
crate::service_impl!(GET, TranslationService, TranslationGetIn, TranslationGetOut);

pub struct UserAccountService;

crate::service_impl!(
	declare,
	UserAccountService,
	"tutanota/useraccountservice",
	75
);
crate::service_impl!(POST, UserAccountService, UserAccountCreateData, ());
