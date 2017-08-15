type DataBlock = {
	_type: TypeRef<DataBlock>;
	_id:Id;
	blockData:Id;
	size:NumberString;

}

type FileData = {
	_type: TypeRef<FileData>;
	_format:NumberString;
	_id:Id;
	_ownerGroup:?Id;
	_permissions:Id;
	size:NumberString;
	unreferenced:boolean;

	blocks:DataBlock[];
}

type Subfiles = {
	_type: TypeRef<Subfiles>;
	_id:Id;

	files:Id;
}

type TutanotaFile = {
	_type: TypeRef<TutanotaFile>;
	_errors: Object;
	_area:NumberString;
	_format:NumberString;
	_id:IdTuple;
	_ownerEncSessionKey:?Uint8Array;
	_owner:Id;
	_ownerGroup:?Id;
	_permissions:Id;
	mimeType:?string;
	name:string;
	size:NumberString;

	subFiles:?Subfiles;
	data:?Id;
	parent:?IdTuple;
}

type FileSystem = {
	_type: TypeRef<FileSystem>;
	_errors: Object;
	_format:NumberString;
	_id:Id;
	_ownerEncSessionKey:?Uint8Array;
	_ownerGroup:?Id;
	_permissions:Id;

	files:Id;
}

type MailBody = {
	_type: TypeRef<MailBody>;
	_errors: Object;
	_area:NumberString;
	_format:NumberString;
	_id:Id;
	_owner:Id;
	_ownerEncSessionKey:?Uint8Array;
	_ownerGroup:?Id;
	_permissions:Id;
	text:string;

}

type ContactMailAddress = {
	_type: TypeRef<ContactMailAddress>;
	_id:Id;
	address:string;
	customTypeName:string;
	type:NumberString;

}

type ContactPhoneNumber = {
	_type: TypeRef<ContactPhoneNumber>;
	_id:Id;
	customTypeName:string;
	number:string;
	type:NumberString;

}

type ContactAddress = {
	_type: TypeRef<ContactAddress>;
	_id:Id;
	address:string;
	customTypeName:string;
	type:NumberString;

}

type ContactSocialId = {
	_type: TypeRef<ContactSocialId>;
	_id:Id;
	customTypeName:string;
	socialId:string;
	type:NumberString;

}

type Contact = {
	_type: TypeRef<Contact>;
	_errors: Object;
	_area:NumberString;
	_format:NumberString;
	_id:IdTuple;
	_ownerEncSessionKey:?Uint8Array;
	_owner:Id;
	_ownerGroup:?Id;
	_permissions:Id;
	autoTransmitPassword:string;
	birthday:?Date;
	comment:string;
	company:string;
	firstName:string;
	lastName:string;
	presharedPassword:?string;
	title:string;

	addresses:ContactAddress[];
	mailAddresses:ContactMailAddress[];
	phoneNumbers:ContactPhoneNumber[];
	socialIds:ContactSocialId[];
}

type ConversationEntry = {
	_type: TypeRef<ConversationEntry>;
	_format:NumberString;
	_id:IdTuple;
	_ownerGroup:?Id;
	_permissions:Id;
	conversationType:NumberString;
	messageId:string;

	mail:?IdTuple;
	previous:?IdTuple;
}

type MailAddress = {
	_type: TypeRef<MailAddress>;
	_id:Id;
	address:string;
	name:string;

	contact:?IdTuple;
}

type Mail = {
	_type: TypeRef<Mail>;
	_errors: Object;
	_area:NumberString;
	_format:NumberString;
	_id:IdTuple;
	_owner:Id;
	_ownerEncSessionKey:?Uint8Array;
	_ownerGroup:?Id;
	_permissions:Id;
	confidential:boolean;
	differentEnvelopeSender:?string;
	receivedDate:Date;
	replyType:NumberString;
	sentDate:Date;
	state:NumberString;
	subject:string;
	trashed:boolean;
	unread:boolean;

	bccRecipients:MailAddress[];
	ccRecipients:MailAddress[];
	replyTos:EncryptedMailAddress[];
	restrictions:?MailRestriction;
	sender:MailAddress;
	toRecipients:MailAddress[];
	attachments:IdTuple[];
	body:Id;
	conversationEntry:IdTuple;
	headers:?Id;
}

type MailBox = {
	_type: TypeRef<MailBox>;
	_errors: Object;
	_format:NumberString;
	_id:Id;
	_ownerEncSessionKey:?Uint8Array;
	_ownerGroup:?Id;
	_permissions:Id;
	lastInfoDate:Date;
	symEncShareBucketKey:?Uint8Array;

	systemFolders:?MailFolderRef;
	mails:Id;
	receivedAttachments:Id;
	sentAttachments:Id;
}

type PasswordChannelPhoneNumber = {
	_type: TypeRef<PasswordChannelPhoneNumber>;
	_id:Id;
	number:string;

}

type CreateExternalUserGroupData = {
	_type: TypeRef<CreateExternalUserGroupData>;
	_id:Id;
	internalUserEncUserGroupKey:Uint8Array;
	mailAddress:string;
	externalPwEncUserGroupKey:Uint8Array;

}

type ExternalUserData = {
	_type: TypeRef<ExternalUserData>;
	_format:NumberString;
	externalMailEncMailBoxSessionKey:Uint8Array;
	externalMailEncMailGroupInfoSessionKey:Uint8Array;
	externalUserEncEntropy:Uint8Array;
	externalUserEncMailGroupKey:Uint8Array;
	externalUserEncTutanotaPropertiesSessionKey:Uint8Array;
	externalUserEncUserGroupInfoSessionKey:Uint8Array;
	internalMailEncMailGroupInfoSessionKey:Uint8Array;
	internalMailEncUserGroupInfoSessionKey:Uint8Array;
	userEncClientKey:Uint8Array;
	verifier:Uint8Array;

	userGroupData:CreateExternalUserGroupData;
}

type ContactList = {
	_type: TypeRef<ContactList>;
	_errors: Object;
	_format:NumberString;
	_id:Id;
	_ownerEncSessionKey:?Uint8Array;
	_ownerGroup:?Id;
	_permissions:Id;

	contacts:Id;
}

type RemoteImapSyncInfo = {
	_type: TypeRef<RemoteImapSyncInfo>;
	_format:NumberString;
	_id:IdTuple;
	_ownerGroup:?Id;
	_permissions:Id;
	seen:boolean;

	message:IdTuple;
}

type ImapFolder = {
	_type: TypeRef<ImapFolder>;
	_id:Id;
	lastseenuid:string;
	name:string;
	uidvalidity:string;

	syncInfo:Id;
}

type ImapSyncState = {
	_type: TypeRef<ImapSyncState>;
	_format:NumberString;
	_id:Id;
	_ownerGroup:?Id;
	_permissions:Id;

	folders:ImapFolder[];
}

type ImapSyncConfiguration = {
	_type: TypeRef<ImapSyncConfiguration>;
	_id:Id;
	host:string;
	password:string;
	port:NumberString;
	user:string;

	imapSyncState:?Id;
}

type TutanotaProperties = {
	_type: TypeRef<TutanotaProperties>;
	_errors: Object;
	_format:NumberString;
	_id:Id;
	_ownerEncSessionKey:?Uint8Array;
	_ownerGroup:?Id;
	_permissions:Id;
	customEmailSignature:string;
	defaultSender:?string;
	defaultUnconfidential:boolean;
	emailSignatureType:NumberString;
	groupEncEntropy:?Uint8Array;
	noAutomaticContacts:boolean;
	notificationMailLanguage:?string;
	sendPlaintextOnly:boolean;

	imapSyncConfig:ImapSyncConfiguration[];
	inboxRules:InboxRule[];
	lastPushedMail:?IdTuple;
}

type NotificationMail = {
	_type: TypeRef<NotificationMail>;
	_id:Id;
	bodyText:string;
	mailboxLink:string;
	recipientMailAddress:string;
	recipientName:string;
	subject:string;

}

type PasswordMessagingData = {
	_type: TypeRef<PasswordMessagingData>;
	_format:NumberString;
	language:string;
	numberId:Id;
	symKeyForPasswordTransmission:Uint8Array;

}

type PasswordMessagingReturn = {
	_type: TypeRef<PasswordMessagingReturn>;
	_format:NumberString;
	autoAuthenticationId:Id;

}

type PasswordAutoAuthenticationReturn = {
	_type: TypeRef<PasswordAutoAuthenticationReturn>;
	_format:NumberString;

}

type PasswordRetrievalData = {
	_type: TypeRef<PasswordRetrievalData>;
	_format:NumberString;
	autoAuthenticationId:Id;

}

type PasswordRetrievalReturn = {
	_type: TypeRef<PasswordRetrievalReturn>;
	_format:NumberString;
	transmissionKeyEncryptedPassword:string;

}

type PasswordChannelReturn = {
	_type: TypeRef<PasswordChannelReturn>;
	_format:NumberString;

	phoneNumberChannels:PasswordChannelPhoneNumber[];
}

type FileDataDataGet = {
	_type: TypeRef<FileDataDataGet>;
	_errors: Object;
	_format:NumberString;
	base64:boolean;

	file:IdTuple;
}

type FileDataDataPost = {
	_type: TypeRef<FileDataDataPost>;
	_errors: Object;
	_format:NumberString;
	group:Id;
	size:NumberString;

}

type FileDataDataReturn = {
	_type: TypeRef<FileDataDataReturn>;
	_errors: Object;
	_format:NumberString;
	size:NumberString;

}

type FileDataReturnPost = {
	_type: TypeRef<FileDataReturnPost>;
	_errors: Object;
	_format:NumberString;

	fileData:Id;
}

type CreateFileData = {
	_type: TypeRef<CreateFileData>;
	_errors: Object;
	_format:NumberString;
	fileName:string;
	group:Id;
	ownerEncSessionKey:Uint8Array;
	mimeType:string;

	fileData:Id;
	parentFolder:?IdTuple;
}

type CreateFileReturn = {
	_type: TypeRef<CreateFileReturn>;
	_errors: Object;
	_format:NumberString;

	file:IdTuple;
}

type CreateFolderData = {
	_type: TypeRef<CreateFolderData>;
	_errors: Object;
	_format:NumberString;
	fileName:string;
	group:Id;
	ownerEncSessionKey:Uint8Array;
	symEncSessionKey:Uint8Array;

	parentFolder:?IdTuple;
}

type CreateFolderReturn = {
	_type: TypeRef<CreateFolderReturn>;
	_errors: Object;
	_format:NumberString;

	file:IdTuple;
}

type UpdateFileData = {
	_type: TypeRef<UpdateFileData>;
	_format:NumberString;

	file:IdTuple;
	fileData:Id;
}

type DeleteFileData = {
	_type: TypeRef<DeleteFileData>;
	_format:NumberString;

	file:IdTuple;
}

type DeleteMailData = {
	_type: TypeRef<DeleteMailData>;
	_format:NumberString;

	folder:?IdTuple;
	mails:IdTuple[];
}

type MailFolder = {
	_type: TypeRef<MailFolder>;
	_errors: Object;
	_format:NumberString;
	_id:IdTuple;
	_ownerEncSessionKey:?Uint8Array;
	_ownerGroup:?Id;
	_permissions:Id;
	folderType:NumberString;
	name:string;

	mails:Id;
	parentFolder:?IdTuple;
	subFolders:Id;
}

type MailFolderRef = {
	_type: TypeRef<MailFolderRef>;
	_id:Id;

	folders:Id;
}

type MoveMailData = {
	_type: TypeRef<MoveMailData>;
	_format:NumberString;

	mails:IdTuple[];
	targetFolder:IdTuple;
}

type CreateMailFolderData = {
	_type: TypeRef<CreateMailFolderData>;
	_errors: Object;
	_format:NumberString;
	folderName:string;
	ownerEncSessionKey:Uint8Array;

	parentFolder:IdTuple;
}

type CreateMailFolderReturn = {
	_type: TypeRef<CreateMailFolderReturn>;
	_errors: Object;
	_format:NumberString;

	newFolder:IdTuple;
}

type DeleteMailFolderData = {
	_type: TypeRef<DeleteMailFolderData>;
	_errors: Object;
	_format:NumberString;

	folders:IdTuple[];
}

type EncryptTutanotaPropertiesData = {
	_type: TypeRef<EncryptTutanotaPropertiesData>;
	_format:NumberString;
	symEncSessionKey:Uint8Array;

	properties:Id;
}

type DraftRecipient = {
	_type: TypeRef<DraftRecipient>;
	_id:Id;
	mailAddress:string;
	name:string;

}

type NewDraftAttachment = {
	_type: TypeRef<NewDraftAttachment>;
	_id:Id;
	encFileName:Uint8Array;
	encMimeType:Uint8Array;

	fileData:Id;
}

type DraftAttachment = {
	_type: TypeRef<DraftAttachment>;
	_id:Id;
	ownerEncFileSessionKey:Uint8Array;

	newFile:?NewDraftAttachment;
	existingFile:?IdTuple;
}

type DraftData = {
	_type: TypeRef<DraftData>;
	_id:Id;
	bodyText:string;
	confidential:boolean;
	senderMailAddress:string;
	senderName:string;
	subject:string;

	addedAttachments:DraftAttachment[];
	bccRecipients:DraftRecipient[];
	ccRecipients:DraftRecipient[];
	replyTos:EncryptedMailAddress[];
	toRecipients:DraftRecipient[];
	removedAttachments:IdTuple[];
}

type DraftCreateData = {
	_type: TypeRef<DraftCreateData>;
	_errors: Object;
	_format:NumberString;
	conversationType:NumberString;
	ownerEncSessionKey:Uint8Array;
	previousMessageId:?string;
	symEncSessionKey:Uint8Array;

	draftData:DraftData;
}

type DraftCreateReturn = {
	_type: TypeRef<DraftCreateReturn>;
	_format:NumberString;

	draft:IdTuple;
}

type DraftUpdateData = {
	_type: TypeRef<DraftUpdateData>;
	_errors: Object;
	_format:NumberString;

	draftData:DraftData;
	draft:IdTuple;
}

type DraftUpdateReturn = {
	_type: TypeRef<DraftUpdateReturn>;
	_errors: Object;
	_format:NumberString;

	attachments:IdTuple[];
}

type InternalRecipientKeyData = {
	_type: TypeRef<InternalRecipientKeyData>;
	_id:Id;
	mailAddress:string;
	pubEncBucketKey:Uint8Array;
	pubKeyVersion:NumberString;

}

type SecureExternalRecipientKeyData = {
	_type: TypeRef<SecureExternalRecipientKeyData>;
	_id:Id;
	autoTransmitPassword:?string;
	mailAddress:string;
	ownerEncBucketKey:?Uint8Array;
	passwordVerifier:Uint8Array;
	pwEncCommunicationKey:?Uint8Array;
	salt:?Uint8Array;
	saltHash:?Uint8Array;
	symEncBucketKey:?Uint8Array;

	passwordChannelPhoneNumbers:PasswordChannelPhoneNumber[];
}

type AttachmentKeyData = {
	_type: TypeRef<AttachmentKeyData>;
	_id:Id;
	bucketEncFileSessionKey:?Uint8Array;
	fileSessionKey:?Uint8Array;

	file:IdTuple;
}

type SendDraftData = {
	_type: TypeRef<SendDraftData>;
	_format:NumberString;
	bucketEncMailSessionKey:?Uint8Array;
	language:string;
	mailSessionKey:?Uint8Array;
	plaintext:boolean;
	senderNameUnencrypted:?string;

	attachmentKeyData:AttachmentKeyData[];
	internalRecipientKeyData:InternalRecipientKeyData[];
	secureExternalRecipientKeyData:SecureExternalRecipientKeyData[];
	mail:IdTuple;
}

type SendDraftReturn = {
	_type: TypeRef<SendDraftReturn>;
	_format:NumberString;
	messageId:string;
	sentDate:Date;

	notifications:NotificationMail[];
	sentMail:IdTuple;
}

type ReceiveInfoServiceData = {
	_type: TypeRef<ReceiveInfoServiceData>;
	_format:NumberString;

}

type InboxRule = {
	_type: TypeRef<InboxRule>;
	_id:Id;
	type:string;
	value:string;

	targetFolder:IdTuple;
}

type MailHeaders = {
	_type: TypeRef<MailHeaders>;
	_errors: Object;
	_format:NumberString;
	_id:Id;
	_ownerEncSessionKey:?Uint8Array;
	_ownerGroup:?Id;
	_permissions:Id;
	headers:string;

}

type EncryptedMailAddress = {
	_type: TypeRef<EncryptedMailAddress>;
	_id:Id;
	address:string;
	name:string;

}

type UserAccountUserData = {
	_type: TypeRef<UserAccountUserData>;
	_id:Id;
	contactEncContactListSessionKey:Uint8Array;
	customerEncContactGroupInfoSessionKey:Uint8Array;
	customerEncFileGroupInfoSessionKey:Uint8Array;
	customerEncMailGroupInfoSessionKey:Uint8Array;
	encryptedName:Uint8Array;
	fileEncFileSystemSessionKey:Uint8Array;
	mailAddress:string;
	mailEncMailBoxSessionKey:Uint8Array;
	pwEncUserGroupKey:Uint8Array;
	salt:Uint8Array;
	userEncClientKey:Uint8Array;
	userEncContactGroupKey:Uint8Array;
	userEncCustomerGroupKey:Uint8Array;
	userEncEntropy:Uint8Array;
	userEncFileGroupKey:Uint8Array;
	userEncMailGroupKey:Uint8Array;
	userEncTutanotaPropertiesSessionKey:Uint8Array;
	verifier:Uint8Array;

}

type InternalGroupData = {
	_type: TypeRef<InternalGroupData>;
	_id:Id;
	adminEncGroupKey:Uint8Array;
	ownerEncGroupInfoSessionKey:Uint8Array;
	groupEncPrivateKey:Uint8Array;
	publicKey:Uint8Array;

}

type CustomerAccountCreateData = {
	_type: TypeRef<CustomerAccountCreateData>;
	_format:NumberString;
	adminEncAccountingInfoSessionKey:Uint8Array;
	adminEncCustomerServerPropertiesSessionKey:Uint8Array;
	authToken:string;
	date:?Date;
	lang:string;
	systemAdminPubEncAccountingInfoSessionKey:Uint8Array;
	userEncAccountGroupKey:Uint8Array;
	userEncAdminGroupKey:Uint8Array;

	adminGroupData:InternalGroupData;
	customerGroupData:InternalGroupData;
	userData:UserAccountUserData;
	userGroupData:InternalGroupData;
}

type UserAccountCreateData = {
	_type: TypeRef<UserAccountCreateData>;
	_format:NumberString;
	date:?Date;

	userData:UserAccountUserData;
	userGroupData:InternalGroupData;
}

type MailboxServerProperties = {
	_type: TypeRef<MailboxServerProperties>;
	_format:NumberString;
	_id:Id;
	_ownerGroup:?Id;
	_permissions:Id;
	whitelistProtectionEnabled:boolean;

}

type MailboxGroupRoot = {
	_type: TypeRef<MailboxGroupRoot>;
	_format:NumberString;
	_id:Id;
	_ownerGroup:?Id;
	_permissions:Id;

	contactFormUserContactForm:?IdTuple;
	mailbox:Id;
	serverProperties:Id;
	targetMailGroupContactForm:?IdTuple;
	whitelistRequests:Id;
}

type CreateTeamGroupData = {
	_type: TypeRef<CreateTeamGroupData>;
	_format:NumberString;
	encryptedName:Uint8Array;

	groupData:InternalGroupData;
}

type CreateMailGroupData = {
	_type: TypeRef<CreateMailGroupData>;
	_format:NumberString;
	encryptedName:Uint8Array;
	mailAddress:string;
	mailEncMailboxSessionKey:Uint8Array;

	groupData:InternalGroupData;
}

type DeleteGroupData = {
	_type: TypeRef<DeleteGroupData>;
	_format:NumberString;
	restore:boolean;

	group:Id;
}

type MailRestriction = {
	_type: TypeRef<MailRestriction>;
	_id:Id;

	delegationGroups_removed:Id[];
	participantGroupInfos:IdTuple[];
}

type Name = {
	_type: TypeRef<Name>;
	_id:Id;
	name:string;

}

type InputField = {
	_type: TypeRef<InputField>;
	_id:Id;
	name:string;
	type:NumberString;

	enumValues:Name[];
}

type ContactForm = {
	_type: TypeRef<ContactForm>;
	_format:NumberString;
	_id:IdTuple;
	_ownerGroup:?Id;
	_permissions:Id;
	footerHtml:string;
	headerHtml:string;
	helpHtml:string;
	pageTitle:string;
	path:string;

	statisticsFields:InputField[];
	delegationGroups_removed:Id[];
	participantGroupInfos:IdTuple[];
	targetGroupInfo:?IdTuple;
	targetMailGroup_removed:Id;
}

type ContactFormAccountReturn = {
	_type: TypeRef<ContactFormAccountReturn>;
	_format:NumberString;
	requestMailAddress:string;
	responseMailAddress:string;

}

type ContactFormUserData = {
	_type: TypeRef<ContactFormUserData>;
	_id:Id;
	mailEncMailBoxSessionKey:Uint8Array;
	ownerEncMailGroupInfoSessionKey:Uint8Array;
	pwEncUserGroupKey:Uint8Array;
	salt:Uint8Array;
	userEncClientKey:Uint8Array;
	userEncEntropy:Uint8Array;
	userEncMailGroupKey:Uint8Array;
	userEncTutanotaPropertiesSessionKey:Uint8Array;
	verifier:Uint8Array;

}

type ContactFormStatisticField = {
	_type: TypeRef<ContactFormStatisticField>;
	_id:Id;
	name:string;
	value:string;

}

type ContactFormEncryptedStatisticsField = {
	_type: TypeRef<ContactFormEncryptedStatisticsField>;
	_id:Id;
	name:string;
	value:string;

}

type CustomerContactFormGroupRoot = {
	_type: TypeRef<CustomerContactFormGroupRoot>;
	_format:NumberString;
	_id:Id;
	_ownerGroup:?Id;
	_permissions:Id;

	contactForms:Id;
	statisticsLog:Id;
}

type ContactFormAccountData = {
	_type: TypeRef<ContactFormAccountData>;
	_format:NumberString;

	statisticFields:ContactFormStatisticField[];
	userData:ContactFormUserData;
	userGroupData:InternalGroupData;
	contactForm:IdTuple;
}
