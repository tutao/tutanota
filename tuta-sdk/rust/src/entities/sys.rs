#![allow(non_snake_case, unused_imports)]
use super::*;
use serde::{Serialize, Deserialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AccountingInfo {
	pub _format: i64,
	pub _id: Id,
	pub _modified: Date,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub invoiceAddress: String,
	pub invoiceCountry: Option<String>,
	pub invoiceName: String,
	pub invoiceVatIdNo: String,
	pub lastInvoiceNbrOfSentSms: i64,
	pub lastInvoiceTimestamp: Option<Date>,
	pub paymentAccountIdentifier: Option<String>,
	pub paymentInterval: i64,
	pub paymentMethod: Option<i64>,
	pub paymentMethodInfo: Option<String>,
	pub paymentProviderCustomerId: Option<String>,
	pub paypalBillingAgreement: Option<String>,
	pub secondCountryInfo: i64,
	pub appStoreSubscription: Option<IdTuple>,
	pub invoiceInfo: Option<Id>,
}

impl Entity for AccountingInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AccountingInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AdminGroupKeyRotationPostIn {
	pub _format: i64,
	pub adminGroupKeyData: GroupKeyRotationData,
	pub userGroupKeyData: UserGroupKeyRotationData,
}

impl Entity for AdminGroupKeyRotationPostIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AdminGroupKeyRotationPostIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AdministratedGroupsRef {
	pub _id: Id,
	pub items: Id,
}

impl Entity for AdministratedGroupsRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AdministratedGroupsRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AlarmInfo {
	pub _id: Id,
	pub alarmIdentifier: String,
	pub trigger: String,
	pub calendarRef: CalendarEventRef,
}

impl Entity for AlarmInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AlarmInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AlarmNotification {
	pub _id: Id,
	pub eventEnd: Date,
	pub eventStart: Date,
	pub operation: i64,
	pub summary: String,
	pub alarmInfo: AlarmInfo,
	pub notificationSessionKeys: Vec<NotificationSessionKey>,
	pub repeatRule: Option<RepeatRule>,
	pub user: Id,
}

impl Entity for AlarmNotification {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AlarmNotification".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AlarmServicePost {
	pub _format: i64,
	pub alarmNotifications: Vec<AlarmNotification>,
}

impl Entity for AlarmServicePost {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AlarmServicePost".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ArchiveRef {
	pub _id: Id,
	pub archiveId: Id,
}

impl Entity for ArchiveRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ArchiveRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ArchiveType {
	pub _id: Id,
	pub active: ArchiveRef,
	pub inactive: Vec<ArchiveRef>,
	#[serde(rename = "type")]
	pub r#type: TypeInfo,
}

impl Entity for ArchiveType {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ArchiveType".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AuditLogEntry {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub action: String,
	pub actorIpAddress: Option<String>,
	pub actorMailAddress: String,
	pub date: Date,
	pub modifiedEntity: String,
	pub groupInfo: Option<IdTuple>,
	pub modifiedGroupInfo: Option<IdTuple>,
}

impl Entity for AuditLogEntry {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AuditLogEntry".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AuditLogRef {
	pub _id: Id,
	pub items: Id,
}

impl Entity for AuditLogRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AuditLogRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AuthenticatedDevice {
	pub _id: Id,
	pub authType: i64,
	#[serde(with = "serde_bytes")]
	pub deviceKey: Vec<u8>,
	pub deviceToken: String,
}

impl Entity for AuthenticatedDevice {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AuthenticatedDevice".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Authentication {
	pub _id: Id,
	pub accessToken: Option<String>,
	pub authVerifier: Option<String>,
	pub externalAuthToken: Option<String>,
	pub userId: Id,
}

impl Entity for Authentication {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Authentication".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AutoLoginDataDelete {
	pub _format: i64,
	pub deviceToken: String,
}

impl Entity for AutoLoginDataDelete {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AutoLoginDataDelete".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AutoLoginDataGet {
	pub _format: i64,
	pub deviceToken: String,
	pub userId: Id,
}

impl Entity for AutoLoginDataGet {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AutoLoginDataGet".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AutoLoginDataReturn {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub deviceKey: Vec<u8>,
}

impl Entity for AutoLoginDataReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AutoLoginDataReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AutoLoginPostReturn {
	pub _format: i64,
	pub deviceToken: String,
}

impl Entity for AutoLoginPostReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "AutoLoginPostReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Blob {
	pub _id: Id,
	pub archiveId: Id,
	pub blobId: Id,
	pub size: i64,
}

impl Entity for Blob {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Blob".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobReferenceTokenWrapper {
	pub _id: Id,
	pub blobReferenceToken: String,
}

impl Entity for BlobReferenceTokenWrapper {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "BlobReferenceTokenWrapper".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Booking {
	pub _area: i64,
	pub _format: i64,
	pub _id: IdTuple,
	pub _owner: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub bonusMonth: i64,
	pub createDate: Date,
	pub endDate: Option<Date>,
	pub paymentInterval: i64,
	pub paymentMonths: i64,
	pub items: Vec<BookingItem>,
}

impl Entity for Booking {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Booking".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BookingItem {
	pub _id: Id,
	pub currentCount: i64,
	pub currentInvoicedCount: i64,
	pub featureType: i64,
	pub maxCount: i64,
	pub price: i64,
	pub priceType: i64,
	pub totalInvoicedCount: i64,
}

impl Entity for BookingItem {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "BookingItem".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BookingsRef {
	pub _id: Id,
	pub items: Id,
}

impl Entity for BookingsRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "BookingsRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BootstrapFeature {
	pub _id: Id,
	pub feature: i64,
}

impl Entity for BootstrapFeature {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "BootstrapFeature".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Braintree3ds2Request {
	pub _id: Id,
	pub bin: String,
	pub clientToken: String,
	pub nonce: String,
}

impl Entity for Braintree3ds2Request {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Braintree3ds2Request".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Braintree3ds2Response {
	pub _id: Id,
	pub clientToken: String,
	pub nonce: String,
}

impl Entity for Braintree3ds2Response {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Braintree3ds2Response".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BrandingDomainData {
	pub _format: i64,
	pub domain: String,
	#[serde(with = "serde_bytes")]
	pub sessionEncPemCertificateChain: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub sessionEncPemPrivateKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub systemAdminPubEncSessionKey: Vec<u8>,
	pub systemAdminPubKeyVersion: i64,
	pub systemAdminPublicProtocolVersion: i64,
}

impl Entity for BrandingDomainData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "BrandingDomainData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BrandingDomainDeleteData {
	pub _format: i64,
	pub domain: String,
}

impl Entity for BrandingDomainDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "BrandingDomainDeleteData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BrandingDomainGetReturn {
	pub _format: i64,
	pub certificateInfo: Option<CertificateInfo>,
}

impl Entity for BrandingDomainGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "BrandingDomainGetReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Bucket {
	pub _id: Id,
	pub bucketPermissions: Id,
}

impl Entity for Bucket {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Bucket".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BucketKey {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub groupEncBucketKey: Option<Vec<u8>>,
	pub protocolVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pubEncBucketKey: Option<Vec<u8>>,
	pub recipientKeyVersion: i64,
	pub senderKeyVersion: Option<i64>,
	pub bucketEncSessionKeys: Vec<InstanceSessionKey>,
	pub keyGroup: Option<Id>,
}

impl Entity for BucketKey {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "BucketKey".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BucketPermission {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	#[serde(with = "serde_bytes")]
	pub ownerEncBucketKey: Option<Vec<u8>>,
	pub ownerKeyVersion: Option<i64>,
	pub protocolVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pubEncBucketKey: Option<Vec<u8>>,
	pub pubKeyVersion: Option<i64>,
	pub senderKeyVersion: Option<i64>,
	#[serde(with = "serde_bytes")]
	pub symEncBucketKey: Option<Vec<u8>>,
	pub symKeyVersion: Option<i64>,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub group: Id,
}

impl Entity for BucketPermission {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "BucketPermission".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CalendarEventRef {
	pub _id: Id,
	pub elementId: Id,
	pub listId: Id,
}

impl Entity for CalendarEventRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CalendarEventRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CertificateInfo {
	pub _id: Id,
	pub expiryDate: Option<Date>,
	pub state: i64,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub certificate: Option<Id>,
}

impl Entity for CertificateInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CertificateInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Challenge {
	pub _id: Id,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub otp: Option<OtpChallenge>,
	pub u2f: Option<U2fChallenge>,
}

impl Entity for Challenge {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Challenge".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ChangeKdfPostIn {
	pub _format: i64,
	pub kdfVersion: i64,
	#[serde(with = "serde_bytes")]
	pub oldVerifier: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub pwEncUserGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub salt: Vec<u8>,
	pub userGroupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
}

impl Entity for ChangeKdfPostIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ChangeKdfPostIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ChangePasswordPostIn {
	pub _format: i64,
	pub code: Option<String>,
	pub kdfVersion: i64,
	#[serde(with = "serde_bytes")]
	pub oldVerifier: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub pwEncUserGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub recoverCodeVerifier: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub salt: Vec<u8>,
	pub userGroupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
}

impl Entity for ChangePasswordPostIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ChangePasswordPostIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Chat {
	pub _id: Id,
	pub recipient: Id,
	pub sender: Id,
	pub text: String,
}

impl Entity for Chat {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Chat".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CloseSessionServicePost {
	pub _format: i64,
	pub accessToken: String,
	pub sessionId: IdTuple,
}

impl Entity for CloseSessionServicePost {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CloseSessionServicePost".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CreateCustomerServerPropertiesData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub adminGroupEncSessionKey: Vec<u8>,
	pub adminGroupKeyVersion: i64,
}

impl Entity for CreateCustomerServerPropertiesData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CreateCustomerServerPropertiesData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CreateCustomerServerPropertiesReturn {
	pub _format: i64,
	pub id: Id,
}

impl Entity for CreateCustomerServerPropertiesReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CreateCustomerServerPropertiesReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CreateSessionData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub accessKey: Option<Vec<u8>>,
	pub authToken: Option<String>,
	pub authVerifier: Option<String>,
	pub clientIdentifier: String,
	pub mailAddress: Option<String>,
	pub recoverCodeVerifier: Option<String>,
	pub user: Option<Id>,
}

impl Entity for CreateSessionData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CreateSessionData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CreateSessionReturn {
	pub _format: i64,
	pub accessToken: String,
	pub challenges: Vec<Challenge>,
	pub user: Id,
}

impl Entity for CreateSessionReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CreateSessionReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CreditCard {
	pub _id: Id,
	pub cardHolderName: String,
	pub cvv: String,
	pub expirationMonth: String,
	pub expirationYear: String,
	pub number: String,
}

impl Entity for CreditCard {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CreditCard".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomDomainCheckGetIn {
	pub _format: i64,
	pub domain: String,
	pub customer: Option<Id>,
}

impl Entity for CustomDomainCheckGetIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CustomDomainCheckGetIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomDomainCheckGetOut {
	pub _format: i64,
	pub checkResult: i64,
	pub invalidRecords: Vec<DnsRecord>,
	pub missingRecords: Vec<DnsRecord>,
	pub requiredRecords: Vec<DnsRecord>,
}

impl Entity for CustomDomainCheckGetOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CustomDomainCheckGetOut".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomDomainData {
	pub _format: i64,
	pub domain: String,
	pub catchAllMailGroup: Option<Id>,
}

impl Entity for CustomDomainData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CustomDomainData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomDomainReturn {
	pub _format: i64,
	pub validationResult: i64,
	pub invalidDnsRecords: Vec<StringWrapper>,
}

impl Entity for CustomDomainReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CustomDomainReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Customer {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub approvalStatus: i64,
	pub businessUse: bool,
	pub orderProcessingAgreementNeeded: bool,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub adminGroup: Id,
	pub adminGroups: Id,
	pub auditLog: Option<AuditLogRef>,
	pub customerGroup: Id,
	pub customerGroups: Id,
	pub customerInfo: IdTuple,
	pub customizations: Vec<Feature>,
	pub orderProcessingAgreement: Option<IdTuple>,
	pub properties: Option<Id>,
	pub referralCode: Option<Id>,
	pub rejectedSenders: Option<RejectedSendersRef>,
	pub serverProperties: Option<Id>,
	pub teamGroups: Id,
	pub userAreaGroups: Option<UserAreaGroups>,
	pub userGroups: Id,
	pub whitelabelChildren: Option<WhitelabelChildrenRef>,
	pub whitelabelParent: Option<WhitelabelParent>,
}

impl Entity for Customer {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Customer".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomerAccountTerminationPostIn {
	pub _format: i64,
	pub terminationDate: Option<Date>,
	pub surveyData: Option<SurveyData>,
}

impl Entity for CustomerAccountTerminationPostIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CustomerAccountTerminationPostIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomerAccountTerminationPostOut {
	pub _format: i64,
	pub terminationRequest: IdTuple,
}

impl Entity for CustomerAccountTerminationPostOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CustomerAccountTerminationPostOut".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomerAccountTerminationRequest {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub terminationDate: Date,
	pub terminationRequestDate: Date,
	pub customer: Id,
}

impl Entity for CustomerAccountTerminationRequest {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CustomerAccountTerminationRequest".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomerInfo {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub activationTime: Option<Date>,
	pub company: Option<String>,
	pub creationTime: Date,
	pub deletionReason: Option<String>,
	pub deletionTime: Option<Date>,
	pub domain: String,
	pub erased: bool,
	pub includedEmailAliases: i64,
	pub includedStorageCapacity: i64,
	pub perUserAliasCount: i64,
	pub perUserStorageCapacity: i64,
	pub plan: i64,
	pub promotionEmailAliases: i64,
	pub promotionStorageCapacity: i64,
	pub registrationMailAddress: String,
	pub source: String,
	pub testEndTime: Option<Date>,
	pub usedSharedEmailAliases: i64,
	pub accountingInfo: Id,
	pub bookings: Option<BookingsRef>,
	pub customPlan: Option<PlanConfiguration>,
	pub customer: Id,
	pub domainInfos: Vec<DomainInfo>,
	pub giftCards: Option<GiftCardsRef>,
	pub referredBy: Option<Id>,
	pub supportInfo: Option<Id>,
	pub takeoverCustomer: Option<Id>,
	pub terminationRequest: Option<IdTuple>,
}

impl Entity for CustomerInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CustomerInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomerProperties {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub externalUserWelcomeMessage: String,
	pub lastUpgradeReminder: Option<Date>,
	pub usageDataOptedOut: bool,
	pub bigLogo: Option<File>,
	pub notificationMailTemplates: Vec<NotificationMailTemplate>,
	pub smallLogo: Option<File>,
}

impl Entity for CustomerProperties {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CustomerProperties".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomerServerProperties {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub requirePasswordUpdateAfterReset: bool,
	pub saveEncryptedIpAddressInSession: bool,
	pub whitelabelCode: String,
	pub emailSenderList: Vec<EmailSenderListElement>,
	pub whitelabelRegistrationDomains: Vec<StringWrapper>,
	pub whitelistedDomains: Option<DomainsRef>,
}

impl Entity for CustomerServerProperties {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "CustomerServerProperties".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DateWrapper {
	pub _id: Id,
	pub date: Date,
}

impl Entity for DateWrapper {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "DateWrapper".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DebitServicePutData {
	pub _format: i64,
	pub invoice: Option<IdTuple>,
}

impl Entity for DebitServicePutData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "DebitServicePutData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DefaultAlarmInfo {
	pub _id: Id,
	pub trigger: String,
}

impl Entity for DefaultAlarmInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "DefaultAlarmInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DeleteCustomerData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub authVerifier: Option<Vec<u8>>,
	pub reason: Option<String>,
	pub takeoverMailAddress: Option<String>,
	pub undelete: bool,
	pub customer: Id,
	pub surveyData: Option<SurveyData>,
}

impl Entity for DeleteCustomerData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "DeleteCustomerData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DnsRecord {
	pub _id: Id,
	pub subdomain: Option<String>,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub value: String,
}

impl Entity for DnsRecord {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "DnsRecord".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DomainInfo {
	pub _id: Id,
	pub domain: String,
	pub validatedMxRecord: bool,
	pub catchAllMailGroup: Option<Id>,
	pub whitelabelConfig: Option<Id>,
}

impl Entity for DomainInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "DomainInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DomainMailAddressAvailabilityData {
	pub _format: i64,
	pub mailAddress: String,
}

impl Entity for DomainMailAddressAvailabilityData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "DomainMailAddressAvailabilityData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DomainMailAddressAvailabilityReturn {
	pub _format: i64,
	pub available: bool,
}

impl Entity for DomainMailAddressAvailabilityReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "DomainMailAddressAvailabilityReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DomainsRef {
	pub _id: Id,
	pub items: Id,
}

impl Entity for DomainsRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "DomainsRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct EmailSenderListElement {
	pub _id: Id,
	pub field: i64,
	pub hashedValue: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub value: String,
}

impl Entity for EmailSenderListElement {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "EmailSenderListElement".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct EntityEventBatch {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub events: Vec<EntityUpdate>,
}

impl Entity for EntityEventBatch {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "EntityEventBatch".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct EntityUpdate {
	pub _id: Id,
	pub application: String,
	pub instanceId: String,
	pub instanceListId: String,
	pub operation: i64,
	#[serde(rename = "type")]
	pub r#type: String,
}

impl Entity for EntityUpdate {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "EntityUpdate".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SysException {
	pub _id: Id,
	pub msg: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

impl Entity for SysException {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SysException".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ExternalPropertiesReturn {
	pub _format: i64,
	pub accountType: i64,
	pub message: String,
	pub bigLogo: Option<File>,
	pub smallLogo: Option<File>,
}

impl Entity for ExternalPropertiesReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ExternalPropertiesReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ExternalUserReference {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub user: Id,
	pub userGroup: Id,
}

impl Entity for ExternalUserReference {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ExternalUserReference".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Feature {
	pub _id: Id,
	pub feature: i64,
}

impl Entity for Feature {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Feature".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct File {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub data: Vec<u8>,
	pub mimeType: String,
	pub name: String,
}

impl Entity for File {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "File".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GeneratedIdWrapper {
	pub _id: Id,
	pub value: Id,
}

impl Entity for GeneratedIdWrapper {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GeneratedIdWrapper".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GiftCard {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub message: String,
	pub migrated: bool,
	pub orderDate: Date,
	pub status: i64,
	pub value: i64,
}

impl Entity for GiftCard {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GiftCard".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GiftCardCreateData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub keyHash: Vec<u8>,
	pub message: String,
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	pub value: i64,
}

impl Entity for GiftCardCreateData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GiftCardCreateData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GiftCardCreateReturn {
	pub _format: i64,
	pub giftCard: IdTuple,
}

impl Entity for GiftCardCreateReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GiftCardCreateReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GiftCardDeleteData {
	pub _format: i64,
	pub giftCard: IdTuple,
}

impl Entity for GiftCardDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GiftCardDeleteData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GiftCardGetReturn {
	pub _format: i64,
	pub maxPerPeriod: i64,
	pub period: i64,
	pub options: Vec<GiftCardOption>,
}

impl Entity for GiftCardGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GiftCardGetReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GiftCardOption {
	pub _id: Id,
	pub value: i64,
}

impl Entity for GiftCardOption {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GiftCardOption".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GiftCardRedeemData {
	pub _format: i64,
	pub countryCode: String,
	#[serde(with = "serde_bytes")]
	pub keyHash: Vec<u8>,
	pub giftCardInfo: Id,
}

impl Entity for GiftCardRedeemData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GiftCardRedeemData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GiftCardRedeemGetReturn {
	pub _format: i64,
	pub message: String,
	pub value: i64,
	pub giftCard: IdTuple,
}

impl Entity for GiftCardRedeemGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GiftCardRedeemGetReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GiftCardsRef {
	pub _id: Id,
	pub items: Id,
}

impl Entity for GiftCardsRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GiftCardsRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Group {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	#[serde(with = "serde_bytes")]
	pub adminGroupEncGKey: Option<Vec<u8>>,
	pub adminGroupKeyVersion: Option<i64>,
	pub enabled: bool,
	pub external: bool,
	pub groupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pubAdminGroupEncGKey: Option<Vec<u8>>,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub admin: Option<Id>,
	pub administratedGroups: Option<AdministratedGroupsRef>,
	pub archives: Vec<ArchiveType>,
	pub currentKeys: Option<KeyPair>,
	pub customer: Option<Id>,
	pub formerGroupKeys: Option<GroupKeysRef>,
	pub groupInfo: IdTuple,
	pub invitations: Id,
	pub members: Id,
	pub storageCounter: Option<Id>,
	pub user: Option<Id>,
}

impl Entity for Group {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Group".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupInfo {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _listEncSessionKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub created: Date,
	pub deleted: Option<Date>,
	pub groupType: Option<i64>,
	pub mailAddress: Option<String>,
	pub name: String,
	pub group: Id,
	pub localAdmin: Option<Id>,
	pub mailAddressAliases: Vec<MailAddressAlias>,
}

impl Entity for GroupInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupKey {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	#[serde(with = "serde_bytes")]
	pub adminGroupEncGKey: Option<Vec<u8>>,
	pub adminGroupKeyVersion: Option<i64>,
	#[serde(with = "serde_bytes")]
	pub ownerEncGKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pubAdminGroupEncGKey: Option<Vec<u8>>,
	pub keyPair: Option<KeyPair>,
}

impl Entity for GroupKey {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupKey".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupKeyRotationData {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub adminGroupEncGroupKey: Option<Vec<u8>>,
	pub adminGroupKeyVersion: Option<i64>,
	#[serde(with = "serde_bytes")]
	pub groupEncPreviousGroupKey: Vec<u8>,
	pub groupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub userEncGroupKey: Vec<u8>,
	pub userKeyVersion: i64,
	pub group: Id,
	pub groupKeyUpdatesForMembers: Vec<GroupKeyUpdateData>,
	pub keyPair: Option<KeyPair>,
}

impl Entity for GroupKeyRotationData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupKeyRotationData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupKeyRotationInfoGetOut {
	pub _format: i64,
	pub userOrAdminGroupKeyRotationScheduled: bool,
	pub groupKeyUpdates: Vec<IdTuple>,
}

impl Entity for GroupKeyRotationInfoGetOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupKeyRotationInfoGetOut".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupKeyRotationPostIn {
	pub _format: i64,
	pub groupKeyUpdates: Vec<GroupKeyRotationData>,
}

impl Entity for GroupKeyRotationPostIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupKeyRotationPostIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupKeyUpdate {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	#[serde(with = "serde_bytes")]
	pub groupKey: Vec<u8>,
	pub groupKeyVersion: i64,
	pub bucketKey: BucketKey,
}

impl Entity for GroupKeyUpdate {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupKeyUpdate".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupKeyUpdateData {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub bucketKeyEncSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub sessionKeyEncGroupKey: Vec<u8>,
	pub sessionKeyEncGroupKeyVersion: i64,
	pub pubEncBucketKeyData: PubEncKeyData,
}

impl Entity for GroupKeyUpdateData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupKeyUpdateData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupKeyUpdatesRef {
	pub _id: Id,
	pub list: Id,
}

impl Entity for GroupKeyUpdatesRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupKeyUpdatesRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupKeysRef {
	pub _id: Id,
	pub list: Id,
}

impl Entity for GroupKeysRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupKeysRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupMember {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub capability: Option<i64>,
	pub group: Id,
	pub user: Id,
	pub userGroupInfo: IdTuple,
}

impl Entity for GroupMember {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupMember".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupMembership {
	pub _id: Id,
	pub admin: bool,
	pub capability: Option<i64>,
	pub groupKeyVersion: i64,
	pub groupType: Option<i64>,
	#[serde(with = "serde_bytes")]
	pub symEncGKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub group: Id,
	pub groupInfo: IdTuple,
	pub groupMember: IdTuple,
}

impl Entity for GroupMembership {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupMembership".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupMembershipKeyData {
	pub _id: Id,
	pub groupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub symEncGKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub group: Id,
}

impl Entity for GroupMembershipKeyData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupMembershipKeyData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupRoot {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub externalGroupInfos: Id,
	pub externalUserAreaGroupInfos: Option<UserAreaGroups>,
	pub externalUserReferences: Id,
}

impl Entity for GroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "GroupRoot".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct IdTupleWrapper {
	pub _id: Id,
	pub listElementId: Id,
	pub listId: Id,
}

impl Entity for IdTupleWrapper {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "IdTupleWrapper".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct InstanceSessionKey {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub encryptionAuthStatus: Option<Vec<u8>>,
	pub instanceId: Id,
	pub instanceList: Id,
	#[serde(with = "serde_bytes")]
	pub symEncSessionKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub typeInfo: TypeInfo,
}

impl Entity for InstanceSessionKey {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "InstanceSessionKey".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Invoice {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub address: String,
	pub adminUser: Option<String>,
	pub business: bool,
	pub country: String,
	pub date: Date,
	pub grandTotal: i64,
	pub paymentMethod: i64,
	pub reason: Option<String>,
	pub subTotal: i64,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub vat: i64,
	pub vatIdNumber: Option<String>,
	pub vatRate: i64,
	pub bookings: Vec<IdTuple>,
	pub customer: Id,
	pub items: Vec<InvoiceItem>,
}

impl Entity for Invoice {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Invoice".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct InvoiceDataGetIn {
	pub _format: i64,
	pub invoiceNumber: String,
}

impl Entity for InvoiceDataGetIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "InvoiceDataGetIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct InvoiceDataGetOut {
	pub _format: i64,
	pub address: String,
	pub country: String,
	pub date: Date,
	pub grandTotal: i64,
	pub invoiceId: Id,
	pub invoiceType: i64,
	pub paymentMethod: i64,
	pub subTotal: i64,
	pub vat: i64,
	pub vatIdNumber: Option<String>,
	pub vatRate: i64,
	pub vatType: i64,
	pub items: Vec<InvoiceDataItem>,
}

impl Entity for InvoiceDataGetOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "InvoiceDataGetOut".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct InvoiceDataItem {
	pub _id: Id,
	pub amount: i64,
	pub endDate: Option<Date>,
	pub itemType: i64,
	pub singlePrice: Option<i64>,
	pub startDate: Option<Date>,
	pub totalPrice: i64,
}

impl Entity for InvoiceDataItem {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "InvoiceDataItem".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct InvoiceInfo {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub discountPercentage: Option<i64>,
	pub extendedPeriodOfPaymentDays: i64,
	pub persistentPaymentPeriodExtension: bool,
	pub publishInvoices: bool,
	pub reminderState: i64,
	pub specialPriceBrandingPerUser: Option<i64>,
	pub specialPriceBusinessPerUser: Option<i64>,
	pub specialPriceContactFormSingle: Option<i64>,
	pub specialPriceSharedGroupSingle: Option<i64>,
	pub specialPriceSharingPerUser: Option<i64>,
	pub specialPriceUserSingle: Option<i64>,
	pub specialPriceUserTotal: Option<i64>,
	pub invoices: Id,
	pub paymentErrorInfo: Option<PaymentErrorInfo>,
}

impl Entity for InvoiceInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "InvoiceInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct InvoiceItem {
	pub _id: Id,
	pub amount: i64,
	pub endDate: Option<Date>,
	pub singlePrice: Option<i64>,
	pub singleType: bool,
	pub startDate: Option<Date>,
	pub totalPrice: i64,
	#[serde(rename = "type")]
	pub r#type: i64,
}

impl Entity for InvoiceItem {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "InvoiceItem".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct KeyPair {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub pubEccKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub pubKyberKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub pubRsaKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub symEncPrivEccKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub symEncPrivKyberKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub symEncPrivRsaKey: Option<Vec<u8>>,
}

impl Entity for KeyPair {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "KeyPair".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct KeyRotation {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub groupKeyRotationType: i64,
	pub targetKeyVersion: i64,
}

impl Entity for KeyRotation {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "KeyRotation".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct KeyRotationsRef {
	pub _id: Id,
	pub list: Id,
}

impl Entity for KeyRotationsRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "KeyRotationsRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct LocationServiceGetReturn {
	pub _format: i64,
	pub country: String,
}

impl Entity for LocationServiceGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "LocationServiceGetReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Login {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub time: Date,
}

impl Entity for Login {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Login".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailAddressAlias {
	pub _id: Id,
	pub enabled: bool,
	pub mailAddress: String,
}

impl Entity for MailAddressAlias {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MailAddressAlias".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailAddressAliasGetIn {
	pub _format: i64,
	pub targetGroup: Id,
}

impl Entity for MailAddressAliasGetIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MailAddressAliasGetIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailAddressAliasServiceData {
	pub _format: i64,
	pub mailAddress: String,
	pub group: Id,
}

impl Entity for MailAddressAliasServiceData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MailAddressAliasServiceData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailAddressAliasServiceDataDelete {
	pub _format: i64,
	pub mailAddress: String,
	pub restore: bool,
	pub group: Id,
}

impl Entity for MailAddressAliasServiceDataDelete {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MailAddressAliasServiceDataDelete".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailAddressAliasServiceReturn {
	pub _format: i64,
	pub enabledAliases: i64,
	pub nbrOfFreeAliases: i64,
	pub totalAliases: i64,
	pub usedAliases: i64,
}

impl Entity for MailAddressAliasServiceReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MailAddressAliasServiceReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailAddressAvailability {
	pub _id: Id,
	pub available: bool,
	pub mailAddress: String,
}

impl Entity for MailAddressAvailability {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MailAddressAvailability".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailAddressToGroup {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub internalGroup: Option<Id>,
}

impl Entity for MailAddressToGroup {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MailAddressToGroup".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MembershipAddData {
	pub _format: i64,
	pub groupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub symEncGKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub group: Id,
	pub user: Id,
}

impl Entity for MembershipAddData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MembershipAddData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MembershipPutIn {
	pub _format: i64,
	pub groupKeyUpdates: Vec<GroupMembershipKeyData>,
}

impl Entity for MembershipPutIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MembershipPutIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MembershipRemoveData {
	pub _format: i64,
	pub group: Id,
	pub user: Id,
}

impl Entity for MembershipRemoveData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MembershipRemoveData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MissedNotification {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub changeTime: Date,
	pub confirmationId: Id,
	pub lastProcessedNotificationId: Option<Id>,
	pub alarmNotifications: Vec<AlarmNotification>,
	pub notificationInfos: Vec<NotificationInfo>,
}

impl Entity for MissedNotification {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MissedNotification".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MultipleMailAddressAvailabilityData {
	pub _format: i64,
	pub mailAddresses: Vec<StringWrapper>,
}

impl Entity for MultipleMailAddressAvailabilityData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MultipleMailAddressAvailabilityData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MultipleMailAddressAvailabilityReturn {
	pub _format: i64,
	pub availabilities: Vec<MailAddressAvailability>,
}

impl Entity for MultipleMailAddressAvailabilityReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "MultipleMailAddressAvailabilityReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct NotificationInfo {
	pub _id: Id,
	pub mailAddress: String,
	pub userId: Id,
	pub mailId: Option<IdTupleWrapper>,
}

impl Entity for NotificationInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "NotificationInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct NotificationMailTemplate {
	pub _id: Id,
	pub body: String,
	pub language: String,
	pub subject: String,
}

impl Entity for NotificationMailTemplate {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "NotificationMailTemplate".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct NotificationSessionKey {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub pushIdentifierSessionEncSessionKey: Vec<u8>,
	pub pushIdentifier: IdTuple,
}

impl Entity for NotificationSessionKey {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "NotificationSessionKey".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct OrderProcessingAgreement {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub customerAddress: String,
	pub signatureDate: Date,
	pub version: String,
	pub customer: Id,
	pub signerUserGroupInfo: IdTuple,
}

impl Entity for OrderProcessingAgreement {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "OrderProcessingAgreement".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct OtpChallenge {
	pub _id: Id,
	pub secondFactors: Vec<IdTuple>,
}

impl Entity for OtpChallenge {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "OtpChallenge".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PaymentDataServiceGetData {
	pub _format: i64,
	pub clientType: Option<i64>,
}

impl Entity for PaymentDataServiceGetData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PaymentDataServiceGetData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PaymentDataServiceGetReturn {
	pub _format: i64,
	pub loginUrl: String,
}

impl Entity for PaymentDataServiceGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PaymentDataServiceGetReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PaymentDataServicePostData {
	pub _format: i64,
	pub braintree3dsResponse: Braintree3ds2Response,
}

impl Entity for PaymentDataServicePostData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PaymentDataServicePostData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PaymentDataServicePutData {
	pub _format: i64,
	pub confirmedCountry: Option<String>,
	pub invoiceAddress: String,
	pub invoiceCountry: String,
	pub invoiceName: String,
	pub invoiceVatIdNo: String,
	pub paymentInterval: i64,
	pub paymentMethod: i64,
	pub paymentMethodInfo: Option<String>,
	pub paymentToken: Option<String>,
	pub creditCard: Option<CreditCard>,
}

impl Entity for PaymentDataServicePutData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PaymentDataServicePutData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PaymentDataServicePutReturn {
	pub _format: i64,
	pub result: i64,
	pub braintree3dsRequest: Option<Braintree3ds2Request>,
}

impl Entity for PaymentDataServicePutReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PaymentDataServicePutReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PaymentErrorInfo {
	pub _id: Id,
	pub errorCode: String,
	pub errorTime: Date,
	pub thirdPartyErrorId: String,
}

impl Entity for PaymentErrorInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PaymentErrorInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Permission {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	#[serde(with = "serde_bytes")]
	pub bucketEncSessionKey: Option<Vec<u8>>,
	pub listElementApplication: Option<String>,
	pub listElementTypeId: Option<i64>,
	pub ops: Option<String>,
	#[serde(with = "serde_bytes")]
	pub symEncSessionKey: Option<Vec<u8>>,
	pub symKeyVersion: Option<i64>,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub bucket: Option<Bucket>,
	pub group: Option<Id>,
}

impl Entity for Permission {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Permission".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PhoneNumber {
	pub _id: Id,
	pub number: String,
}

impl Entity for PhoneNumber {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PhoneNumber".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PlanConfiguration {
	pub _id: Id,
	pub autoResponder: bool,
	pub contactList: bool,
	pub customDomainType: i64,
	pub eventInvites: bool,
	pub multiUser: bool,
	pub nbrOfAliases: i64,
	pub sharing: bool,
	pub storageGb: i64,
	pub templates: bool,
	pub whitelabel: bool,
}

impl Entity for PlanConfiguration {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PlanConfiguration".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PlanPrices {
	pub _id: Id,
	pub additionalUserPriceMonthly: i64,
	pub business: bool,
	pub businessPlan: bool,
	pub customDomains: i64,
	pub firstYearDiscount: i64,
	pub includedAliases: i64,
	pub includedStorage: i64,
	pub monthlyPrice: i64,
	pub monthlyReferencePrice: i64,
	pub planName: String,
	pub sharing: bool,
	pub whitelabel: bool,
	pub planConfiguration: PlanConfiguration,
}

impl Entity for PlanPrices {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PlanPrices".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PlanServiceGetOut {
	pub _format: i64,
	pub config: PlanConfiguration,
}

impl Entity for PlanServiceGetOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PlanServiceGetOut".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PriceData {
	pub _id: Id,
	pub paymentInterval: i64,
	pub price: i64,
	pub taxIncluded: bool,
	pub items: Vec<PriceItemData>,
}

impl Entity for PriceData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PriceData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PriceItemData {
	pub _id: Id,
	pub count: i64,
	pub featureType: i64,
	pub price: i64,
	pub singleType: bool,
}

impl Entity for PriceItemData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PriceItemData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PriceRequestData {
	pub _id: Id,
	pub accountType: Option<i64>,
	pub business: Option<bool>,
	pub count: i64,
	pub featureType: i64,
	pub paymentInterval: Option<i64>,
	pub reactivate: bool,
}

impl Entity for PriceRequestData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PriceRequestData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PriceServiceData {
	pub _format: i64,
	pub date: Option<Date>,
	pub priceRequest: Option<PriceRequestData>,
}

impl Entity for PriceServiceData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PriceServiceData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PriceServiceReturn {
	pub _format: i64,
	pub currentPeriodAddedPrice: Option<i64>,
	pub periodEndDate: Date,
	pub currentPriceNextPeriod: Option<PriceData>,
	pub currentPriceThisPeriod: Option<PriceData>,
	pub futurePriceNextPeriod: Option<PriceData>,
}

impl Entity for PriceServiceReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PriceServiceReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PubEncKeyData {
	pub _id: Id,
	pub mailAddress: String,
	pub protocolVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pubEncBucketKey: Vec<u8>,
	pub recipientKeyVersion: i64,
	pub senderKeyVersion: Option<i64>,
}

impl Entity for PubEncKeyData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PubEncKeyData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PublicKeyGetIn {
	pub _format: i64,
	pub mailAddress: String,
	pub version: Option<i64>,
}

impl Entity for PublicKeyGetIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PublicKeyGetIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PublicKeyGetOut {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub pubEccKey: Option<Vec<u8>>,
	pub pubKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pubKyberKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub pubRsaKey: Option<Vec<u8>>,
}

impl Entity for PublicKeyGetOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PublicKeyGetOut".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PublicKeyPutIn {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub pubEccKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub symEncPrivEccKey: Vec<u8>,
	pub keyGroup: Id,
}

impl Entity for PublicKeyPutIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PublicKeyPutIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PushIdentifier {
	pub _area: i64,
	pub _format: i64,
	pub _id: IdTuple,
	pub _owner: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub app: i64,
	pub disabled: bool,
	pub displayName: String,
	pub identifier: String,
	pub language: String,
	pub lastNotificationDate: Option<Date>,
	pub lastUsageTime: Date,
	pub pushServiceType: i64,
}

impl Entity for PushIdentifier {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PushIdentifier".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PushIdentifierList {
	pub _id: Id,
	pub list: Id,
}

impl Entity for PushIdentifierList {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "PushIdentifierList".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ReceivedGroupInvitation {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub capability: i64,
	pub groupType: Option<i64>,
	pub inviteeMailAddress: String,
	pub inviterMailAddress: String,
	pub inviterName: String,
	#[serde(with = "serde_bytes")]
	pub sharedGroupKey: Vec<u8>,
	pub sharedGroupKeyVersion: i64,
	pub sharedGroupName: String,
	pub sentInvitation: IdTuple,
	pub sharedGroup: Id,
}

impl Entity for ReceivedGroupInvitation {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ReceivedGroupInvitation".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RecoverCode {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	#[serde(with = "serde_bytes")]
	pub recoverCodeEncUserGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userEncRecoverCode: Vec<u8>,
	pub userKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
}

impl Entity for RecoverCode {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "RecoverCode".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RecoverCodeData {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub recoveryCodeEncUserGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub recoveryCodeVerifier: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userEncRecoveryCode: Vec<u8>,
	pub userKeyVersion: i64,
}

impl Entity for RecoverCodeData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "RecoverCodeData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ReferralCodeGetIn {
	pub _format: i64,
	pub referralCode: Id,
}

impl Entity for ReferralCodeGetIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ReferralCodeGetIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ReferralCodePostIn {
	pub _format: i64,
}

impl Entity for ReferralCodePostIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ReferralCodePostIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ReferralCodePostOut {
	pub _format: i64,
	pub referralCode: Id,
}

impl Entity for ReferralCodePostOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ReferralCodePostOut".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RegistrationCaptchaServiceData {
	pub _format: i64,
	pub response: String,
	pub token: String,
}

impl Entity for RegistrationCaptchaServiceData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "RegistrationCaptchaServiceData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RegistrationCaptchaServiceGetData {
	pub _format: i64,
	pub businessUseSelected: bool,
	pub mailAddress: String,
	pub paidSubscriptionSelected: bool,
	pub signupToken: Option<String>,
	pub token: Option<String>,
}

impl Entity for RegistrationCaptchaServiceGetData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "RegistrationCaptchaServiceGetData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RegistrationCaptchaServiceReturn {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub challenge: Option<Vec<u8>>,
	pub token: String,
}

impl Entity for RegistrationCaptchaServiceReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "RegistrationCaptchaServiceReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RegistrationReturn {
	pub _format: i64,
	pub authToken: String,
}

impl Entity for RegistrationReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "RegistrationReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RegistrationServiceData {
	pub _format: i64,
	pub source: Option<String>,
	pub starterDomain: String,
	pub state: i64,
}

impl Entity for RegistrationServiceData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "RegistrationServiceData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RejectedSender {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub reason: String,
	pub recipientMailAddress: String,
	pub senderHostname: String,
	pub senderIp: String,
	pub senderMailAddress: String,
}

impl Entity for RejectedSender {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "RejectedSender".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RejectedSendersRef {
	pub _id: Id,
	pub items: Id,
}

impl Entity for RejectedSendersRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "RejectedSendersRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RepeatRule {
	pub _id: Id,
	pub endType: i64,
	pub endValue: Option<i64>,
	pub frequency: i64,
	pub interval: i64,
	pub timeZone: String,
	pub excludedDates: Vec<DateWrapper>,
}

impl Entity for RepeatRule {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "RepeatRule".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ResetFactorsDeleteData {
	pub _format: i64,
	pub authVerifier: String,
	pub mailAddress: String,
	pub recoverCodeVerifier: String,
}

impl Entity for ResetFactorsDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ResetFactorsDeleteData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ResetPasswordPostIn {
	pub _format: i64,
	pub kdfVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pwEncUserGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub salt: Vec<u8>,
	pub userGroupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
	pub user: Id,
}

impl Entity for ResetPasswordPostIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "ResetPasswordPostIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RootInstance {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub reference: Id,
}

impl Entity for RootInstance {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "RootInstance".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SaltData {
	pub _format: i64,
	pub mailAddress: String,
}

impl Entity for SaltData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SaltData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SaltReturn {
	pub _format: i64,
	pub kdfVersion: i64,
	#[serde(with = "serde_bytes")]
	pub salt: Vec<u8>,
}

impl Entity for SaltReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SaltReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SecondFactor {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub name: String,
	#[serde(with = "serde_bytes")]
	pub otpSecret: Option<Vec<u8>>,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub u2f: Option<U2fRegisteredDevice>,
}

impl Entity for SecondFactor {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SecondFactor".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SecondFactorAuthAllowedReturn {
	pub _format: i64,
	pub allowed: bool,
}

impl Entity for SecondFactorAuthAllowedReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SecondFactorAuthAllowedReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SecondFactorAuthData {
	pub _format: i64,
	pub otpCode: Option<i64>,
	#[serde(rename = "type")]
	pub r#type: Option<i64>,
	pub session: Option<IdTuple>,
	pub u2f: Option<U2fResponseData>,
	pub webauthn: Option<WebauthnResponseData>,
}

impl Entity for SecondFactorAuthData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SecondFactorAuthData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SecondFactorAuthDeleteData {
	pub _format: i64,
	pub session: IdTuple,
}

impl Entity for SecondFactorAuthDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SecondFactorAuthDeleteData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SecondFactorAuthGetData {
	pub _format: i64,
	pub accessToken: String,
}

impl Entity for SecondFactorAuthGetData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SecondFactorAuthGetData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SecondFactorAuthGetReturn {
	pub _format: i64,
	pub secondFactorPending: bool,
}

impl Entity for SecondFactorAuthGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SecondFactorAuthGetReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SecondFactorAuthentication {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub code: String,
	pub finished: bool,
	pub service: String,
	pub verifyCount: i64,
}

impl Entity for SecondFactorAuthentication {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SecondFactorAuthentication".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SendRegistrationCodeData {
	pub _format: i64,
	pub accountType: i64,
	pub authToken: String,
	pub language: String,
	pub mobilePhoneNumber: String,
}

impl Entity for SendRegistrationCodeData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SendRegistrationCodeData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SendRegistrationCodeReturn {
	pub _format: i64,
	pub authToken: String,
}

impl Entity for SendRegistrationCodeReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SendRegistrationCodeReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SentGroupInvitation {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub capability: i64,
	pub inviteeMailAddress: String,
	pub receivedInvitation: Option<IdTuple>,
	pub sharedGroup: Id,
}

impl Entity for SentGroupInvitation {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SentGroupInvitation".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Session {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	#[serde(with = "serde_bytes")]
	pub accessKey: Option<Vec<u8>>,
	pub clientIdentifier: String,
	pub lastAccessTime: Date,
	pub loginIpAddress: Option<String>,
	pub loginTime: Date,
	pub state: i64,
	pub challenges: Vec<Challenge>,
	pub user: Id,
}

impl Entity for Session {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Session".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SignOrderProcessingAgreementData {
	pub _format: i64,
	pub customerAddress: String,
	pub version: String,
}

impl Entity for SignOrderProcessingAgreementData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SignOrderProcessingAgreementData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SseConnectData {
	pub _format: i64,
	pub identifier: String,
	pub userIds: Vec<GeneratedIdWrapper>,
}

impl Entity for SseConnectData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SseConnectData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct StringConfigValue {
	pub _id: Id,
	pub name: String,
	pub value: String,
}

impl Entity for StringConfigValue {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "StringConfigValue".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct StringWrapper {
	pub _id: Id,
	pub value: String,
}

impl Entity for StringWrapper {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "StringWrapper".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SurveyData {
	pub _id: Id,
	pub category: i64,
	pub details: Option<String>,
	pub reason: i64,
	pub version: i64,
}

impl Entity for SurveyData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SurveyData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SwitchAccountTypePostIn {
	pub _format: i64,
	pub accountType: i64,
	pub customer: Option<Id>,
	pub date: Option<Date>,
	pub plan: i64,
	pub specialPriceUserSingle: Option<i64>,
	pub referralCode: Option<Id>,
	pub surveyData: Option<SurveyData>,
}

impl Entity for SwitchAccountTypePostIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SwitchAccountTypePostIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SystemKeysReturn {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub freeGroupKey: Vec<u8>,
	pub freeGroupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub premiumGroupKey: Vec<u8>,
	pub premiumGroupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub systemAdminPubEccKey: Option<Vec<u8>>,
	pub systemAdminPubKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub systemAdminPubKyberKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub systemAdminPubRsaKey: Option<Vec<u8>>,
	pub freeGroup: Option<Id>,
	pub premiumGroup: Option<Id>,
}

impl Entity for SystemKeysReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "SystemKeysReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct TakeOverDeletedAddressData {
	pub _format: i64,
	pub authVerifier: String,
	pub mailAddress: String,
	pub recoverCodeVerifier: Option<String>,
	pub targetAccountMailAddress: String,
}

impl Entity for TakeOverDeletedAddressData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "TakeOverDeletedAddressData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct TypeInfo {
	pub _id: Id,
	pub application: String,
	pub typeId: i64,
}

impl Entity for TypeInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "TypeInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct U2fChallenge {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub challenge: Vec<u8>,
	pub keys: Vec<U2fKey>,
}

impl Entity for U2fChallenge {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "U2fChallenge".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct U2fKey {
	pub _id: Id,
	pub appId: String,
	#[serde(with = "serde_bytes")]
	pub keyHandle: Vec<u8>,
	pub secondFactor: IdTuple,
}

impl Entity for U2fKey {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "U2fKey".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct U2fRegisteredDevice {
	pub _id: Id,
	pub appId: String,
	pub compromised: bool,
	pub counter: i64,
	#[serde(with = "serde_bytes")]
	pub keyHandle: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub publicKey: Vec<u8>,
}

impl Entity for U2fRegisteredDevice {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "U2fRegisteredDevice".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct U2fResponseData {
	pub _id: Id,
	pub clientData: String,
	pub keyHandle: String,
	pub signatureData: String,
}

impl Entity for U2fResponseData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "U2fResponseData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UpdatePermissionKeyData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	pub bucketPermission: IdTuple,
	pub permission: IdTuple,
}

impl Entity for UpdatePermissionKeyData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UpdatePermissionKeyData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UpdateSessionKeysPostIn {
	pub _format: i64,
	pub ownerEncSessionKeys: Vec<InstanceSessionKey>,
}

impl Entity for UpdateSessionKeysPostIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UpdateSessionKeysPostIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UpgradePriceServiceData {
	pub _format: i64,
	pub campaign: Option<String>,
	pub date: Option<Date>,
	pub referralCode: Option<Id>,
}

impl Entity for UpgradePriceServiceData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UpgradePriceServiceData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UpgradePriceServiceReturn {
	pub _format: i64,
	pub bonusMonthsForYearlyPlan: i64,
	pub business: bool,
	pub messageTextId: Option<String>,
	pub advancedPrices: PlanPrices,
	pub essentialPrices: PlanPrices,
	pub freePrices: PlanPrices,
	pub legendaryPrices: PlanPrices,
	pub plans: Vec<PlanPrices>,
	pub premiumBusinessPrices: PlanPrices,
	pub premiumPrices: PlanPrices,
	pub proPrices: PlanPrices,
	pub revolutionaryPrices: PlanPrices,
	pub teamsBusinessPrices: PlanPrices,
	pub teamsPrices: PlanPrices,
	pub unlimitedPrices: PlanPrices,
}

impl Entity for UpgradePriceServiceReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UpgradePriceServiceReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct User {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub accountType: i64,
	pub enabled: bool,
	pub kdfVersion: i64,
	pub requirePasswordUpdate: bool,
	#[serde(with = "serde_bytes")]
	pub salt: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
	pub alarmInfoList: Option<UserAlarmInfoListType>,
	pub auth: Option<UserAuthentication>,
	pub authenticatedDevices: Vec<AuthenticatedDevice>,
	pub customer: Option<Id>,
	pub externalAuthInfo: Option<UserExternalAuthInfo>,
	pub failedLogins: Id,
	pub memberships: Vec<GroupMembership>,
	pub phoneNumbers: Vec<PhoneNumber>,
	pub pushIdentifierList: Option<PushIdentifierList>,
	pub secondFactorAuthentications: Id,
	pub successfulLogins: Id,
	pub userGroup: GroupMembership,
}

impl Entity for User {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "User".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserAlarmInfo {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub alarmInfo: AlarmInfo,
}

impl Entity for UserAlarmInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UserAlarmInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserAlarmInfoListType {
	pub _id: Id,
	pub alarms: Id,
}

impl Entity for UserAlarmInfoListType {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UserAlarmInfoListType".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserAreaGroups {
	pub _id: Id,
	pub list: Id,
}

impl Entity for UserAreaGroups {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UserAreaGroups".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserAuthentication {
	pub _id: Id,
	pub recoverCode: Option<Id>,
	pub secondFactors: Id,
	pub sessions: Id,
}

impl Entity for UserAuthentication {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UserAuthentication".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserDataDelete {
	pub _format: i64,
	pub date: Option<Date>,
	pub restore: bool,
	pub user: Id,
}

impl Entity for UserDataDelete {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UserDataDelete".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserExternalAuthInfo {
	pub _id: Id,
	pub authUpdateCounter: i64,
	pub autoAuthenticationId: Id,
	pub autoTransmitPassword: Option<String>,
	#[serde(with = "serde_bytes")]
	pub latestSaltHash: Option<Vec<u8>>,
	pub variableAuthInfo: Id,
}

impl Entity for UserExternalAuthInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UserExternalAuthInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserGroupKeyDistribution {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	#[serde(with = "serde_bytes")]
	pub distributionEncUserGroupKey: Vec<u8>,
	pub userGroupKeyVersion: i64,
}

impl Entity for UserGroupKeyDistribution {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UserGroupKeyDistribution".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserGroupKeyRotationData {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub adminGroupEncUserGroupKey: Vec<u8>,
	pub adminGroupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub authVerifier: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub distributionKeyEncUserGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub passphraseEncUserGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userGroupEncPreviousGroupKey: Vec<u8>,
	pub userGroupKeyVersion: i64,
	pub group: Id,
	pub keyPair: KeyPair,
	pub recoverCodeData: Option<RecoverCodeData>,
}

impl Entity for UserGroupKeyRotationData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UserGroupKeyRotationData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserGroupRoot {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub groupKeyUpdates: Option<GroupKeyUpdatesRef>,
	pub invitations: Id,
	pub keyRotations: Option<KeyRotationsRef>,
}

impl Entity for UserGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "UserGroupRoot".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct VariableExternalAuthInfo {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub authUpdateCounter: i64,
	pub lastSentTimestamp: Date,
	#[serde(with = "serde_bytes")]
	pub loggedInIpAddressHash: Option<Vec<u8>>,
	pub loggedInTimestamp: Option<Date>,
	#[serde(with = "serde_bytes")]
	pub loggedInVerifier: Option<Vec<u8>>,
	pub sentCount: i64,
}

impl Entity for VariableExternalAuthInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "VariableExternalAuthInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct VerifyRegistrationCodeData {
	pub _format: i64,
	pub authToken: String,
	pub code: String,
}

impl Entity for VerifyRegistrationCodeData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "VerifyRegistrationCodeData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Version {
	pub _id: Id,
	pub operation: String,
	pub timestamp: Date,
	pub version: Id,
	pub author: Id,
	pub authorGroupInfo: IdTuple,
}

impl Entity for Version {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "Version".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct VersionData {
	pub _format: i64,
	pub application: String,
	pub id: Id,
	pub listId: Option<Id>,
	pub typeId: i64,
}

impl Entity for VersionData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "VersionData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct VersionInfo {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub app: String,
	pub operation: String,
	pub referenceList: Option<Id>,
	pub timestamp: Date,
	#[serde(rename = "type")]
	pub r#type: i64,
	#[serde(with = "serde_bytes")]
	pub versionData: Option<Vec<u8>>,
	pub author: Id,
	pub authorGroupInfo: IdTuple,
}

impl Entity for VersionInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "VersionInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct VersionReturn {
	pub _format: i64,
	pub versions: Vec<Version>,
}

impl Entity for VersionReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "VersionReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct WebauthnResponseData {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub authenticatorData: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub clientData: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub keyHandle: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub signature: Vec<u8>,
}

impl Entity for WebauthnResponseData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "WebauthnResponseData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct WebsocketCounterData {
	pub _format: i64,
	pub mailGroup: Id,
	pub counterValues: Vec<WebsocketCounterValue>,
}

impl Entity for WebsocketCounterData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "WebsocketCounterData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct WebsocketCounterValue {
	pub _id: Id,
	pub count: i64,
	pub mailListId: Id,
}

impl Entity for WebsocketCounterValue {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "WebsocketCounterValue".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct WebsocketEntityData {
	pub _format: i64,
	pub eventBatchId: Id,
	pub eventBatchOwner: Id,
	pub eventBatch: Vec<EntityUpdate>,
}

impl Entity for WebsocketEntityData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "WebsocketEntityData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct WebsocketLeaderStatus {
	pub _format: i64,
	pub leaderStatus: bool,
}

impl Entity for WebsocketLeaderStatus {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "WebsocketLeaderStatus".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct WhitelabelChild {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub comment: String,
	pub createdDate: Date,
	pub deletedDate: Option<Date>,
	pub mailAddress: String,
	pub customer: Id,
}

impl Entity for WhitelabelChild {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "WhitelabelChild".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct WhitelabelChildrenRef {
	pub _id: Id,
	pub items: Id,
}

impl Entity for WhitelabelChildrenRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "WhitelabelChildrenRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct WhitelabelConfig {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub germanLanguageCode: Option<String>,
	pub imprintUrl: Option<String>,
	pub jsonTheme: String,
	pub metaTags: String,
	pub privacyStatementUrl: Option<String>,
	pub whitelabelCode: String,
	pub bootstrapCustomizations: Vec<BootstrapFeature>,
	pub certificateInfo: Option<CertificateInfo>,
	pub whitelabelRegistrationDomains: Vec<StringWrapper>,
}

impl Entity for WhitelabelConfig {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "WhitelabelConfig".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct WhitelabelParent {
	pub _id: Id,
	pub customer: Id,
	pub whitelabelChildInParent: IdTuple,
}

impl Entity for WhitelabelParent {
	fn type_ref() -> TypeRef {
		TypeRef { app: "sys".to_owned(), type_: "WhitelabelParent".to_owned() }
	}
}
