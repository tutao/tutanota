#![allow(non_snake_case, unused_imports)]
use super::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AccountingInfo {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _modified: DateTime,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub invoiceAddress: String,
	pub invoiceCountry: Option<String>,
	pub invoiceName: String,
	pub invoiceVatIdNo: String,
	pub lastInvoiceNbrOfSentSms: i64,
	pub lastInvoiceTimestamp: Option<DateTime>,
	pub paymentAccountIdentifier: Option<String>,
	pub paymentInterval: i64,
	pub paymentMethod: Option<i64>,
	pub paymentMethodInfo: Option<String>,
	pub paymentProviderCustomerId: Option<String>,
	pub paypalBillingAgreement: Option<String>,
	pub secondCountryInfo: i64,
	pub appStoreSubscription: Option<IdTuple>,
	pub invoiceInfo: Option<GeneratedId>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for AccountingInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AccountingInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AdminGroupKeyAuthenticationData {
	pub _id: CustomId,
	#[serde(with = "serde_bytes")]
	pub authKeyEncAdminRotationHash: Vec<u8>,
	pub version: i64,
	pub userGroup: GeneratedId,
}
impl Entity for AdminGroupKeyAuthenticationData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AdminGroupKeyAuthenticationData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AdminGroupKeyRotationPostIn {
	pub _format: i64,
	pub adminGroupKeyAuthenticationDataList: Vec<AdminGroupKeyAuthenticationData>,
	pub adminGroupKeyData: GroupKeyRotationData,
	pub userGroupKeyData: UserGroupKeyRotationData,
}
impl Entity for AdminGroupKeyRotationPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AdminGroupKeyRotationPostIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AdministratedGroupsRef {
	pub _id: CustomId,
	pub items: GeneratedId,
}
impl Entity for AdministratedGroupsRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AdministratedGroupsRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AffiliatePartnerKpiMonthSummary {
	pub _id: CustomId,
	pub commission: i64,
	pub monthTimestamp: i64,
	pub newFree: i64,
	pub newPaid: i64,
	pub totalFree: i64,
	pub totalPaid: i64,
}
impl Entity for AffiliatePartnerKpiMonthSummary {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AffiliatePartnerKpiMonthSummary",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AffiliatePartnerKpiServiceGetOut {
	pub _format: i64,
	pub accumulatedCommission: i64,
	pub creditedCommission: i64,
	pub promotionId: String,
	pub kpis: Vec<AffiliatePartnerKpiMonthSummary>,
}
impl Entity for AffiliatePartnerKpiServiceGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AffiliatePartnerKpiServiceGetOut",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AlarmInfo {
	pub _id: CustomId,
	pub alarmIdentifier: String,
	pub trigger: String,
	pub calendarRef: CalendarEventRef,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for AlarmInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AlarmInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AlarmNotification {
	pub _id: CustomId,
	pub eventEnd: DateTime,
	pub eventStart: DateTime,
	pub operation: i64,
	pub summary: String,
	pub alarmInfo: AlarmInfo,
	pub notificationSessionKeys: Vec<NotificationSessionKey>,
	pub repeatRule: Option<RepeatRule>,
	pub user: GeneratedId,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for AlarmNotification {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AlarmNotification",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AlarmServicePost {
	pub _format: i64,
	pub alarmNotifications: Vec<AlarmNotification>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for AlarmServicePost {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AlarmServicePost",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct ArchiveRef {
	pub _id: CustomId,
	pub archiveId: GeneratedId,
}
impl Entity for ArchiveRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "ArchiveRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct ArchiveType {
	pub _id: CustomId,
	pub active: ArchiveRef,
	pub inactive: Vec<ArchiveRef>,
	#[serde(rename = "type")]
	pub r#type: TypeInfo,
}
impl Entity for ArchiveType {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "ArchiveType",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AuditLogEntry {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub action: String,
	pub actorIpAddress: Option<String>,
	pub actorMailAddress: String,
	pub date: DateTime,
	pub modifiedEntity: String,
	pub groupInfo: Option<IdTuple>,
	pub modifiedGroupInfo: Option<IdTuple>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for AuditLogEntry {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AuditLogEntry",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AuditLogRef {
	pub _id: CustomId,
	pub items: GeneratedId,
}
impl Entity for AuditLogRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AuditLogRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AuthenticatedDevice {
	pub _id: CustomId,
	pub authType: i64,
	#[serde(with = "serde_bytes")]
	pub deviceKey: Vec<u8>,
	pub deviceToken: String,
}
impl Entity for AuthenticatedDevice {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AuthenticatedDevice",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Authentication {
	pub _id: CustomId,
	pub accessToken: Option<String>,
	pub authVerifier: Option<String>,
	pub externalAuthToken: Option<String>,
	pub userId: GeneratedId,
}
impl Entity for Authentication {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Authentication",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AutoLoginDataDelete {
	pub _format: i64,
	pub deviceToken: String,
}
impl Entity for AutoLoginDataDelete {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AutoLoginDataDelete",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AutoLoginDataGet {
	pub _format: i64,
	pub deviceToken: String,
	pub userId: GeneratedId,
}
impl Entity for AutoLoginDataGet {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AutoLoginDataGet",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AutoLoginDataReturn {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub deviceKey: Vec<u8>,
}
impl Entity for AutoLoginDataReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AutoLoginDataReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct AutoLoginPostReturn {
	pub _format: i64,
	pub deviceToken: String,
}
impl Entity for AutoLoginPostReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "AutoLoginPostReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Blob {
	pub _id: CustomId,
	pub archiveId: GeneratedId,
	pub blobId: GeneratedId,
	pub size: i64,
}
impl Entity for Blob {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Blob",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct BlobReferenceTokenWrapper {
	pub _id: CustomId,
	pub blobReferenceToken: String,
}
impl Entity for BlobReferenceTokenWrapper {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "BlobReferenceTokenWrapper",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Booking {
	pub _area: i64,
	pub _format: i64,
	pub _id: IdTuple,
	pub _owner: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub bonusMonth: i64,
	pub createDate: DateTime,
	pub endDate: Option<DateTime>,
	pub paymentInterval: i64,
	pub paymentMonths: i64,
	pub items: Vec<BookingItem>,
}
impl Entity for Booking {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Booking",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct BookingItem {
	pub _id: CustomId,
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
		TypeRef {
			app: "sys",
			type_: "BookingItem",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct BookingsRef {
	pub _id: CustomId,
	pub items: GeneratedId,
}
impl Entity for BookingsRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "BookingsRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct BootstrapFeature {
	pub _id: CustomId,
	pub feature: i64,
}
impl Entity for BootstrapFeature {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "BootstrapFeature",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Braintree3ds2Request {
	pub _id: CustomId,
	pub bin: String,
	pub clientToken: String,
	pub nonce: String,
}
impl Entity for Braintree3ds2Request {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Braintree3ds2Request",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Braintree3ds2Response {
	pub _id: CustomId,
	pub clientToken: String,
	pub nonce: String,
}
impl Entity for Braintree3ds2Response {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Braintree3ds2Response",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
		TypeRef {
			app: "sys",
			type_: "BrandingDomainData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct BrandingDomainDeleteData {
	pub _format: i64,
	pub domain: String,
}
impl Entity for BrandingDomainDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "BrandingDomainDeleteData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct BrandingDomainGetReturn {
	pub _format: i64,
	pub certificateInfo: Option<CertificateInfo>,
}
impl Entity for BrandingDomainGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "BrandingDomainGetReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Bucket {
	pub _id: CustomId,
	pub bucketPermissions: GeneratedId,
}
impl Entity for Bucket {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Bucket",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct BucketKey {
	pub _id: CustomId,
	#[serde(with = "serde_bytes")]
	pub groupEncBucketKey: Option<Vec<u8>>,
	pub protocolVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pubEncBucketKey: Option<Vec<u8>>,
	pub recipientKeyVersion: i64,
	pub senderKeyVersion: Option<i64>,
	pub bucketEncSessionKeys: Vec<InstanceSessionKey>,
	pub keyGroup: Option<GeneratedId>,
}
impl Entity for BucketKey {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "BucketKey",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct BucketPermission {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
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
	pub group: GeneratedId,
}
impl Entity for BucketPermission {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "BucketPermission",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CalendarEventRef {
	pub _id: CustomId,
	pub elementId: CustomId,
	pub listId: GeneratedId,
}
impl Entity for CalendarEventRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CalendarEventRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CertificateInfo {
	pub _id: CustomId,
	pub expiryDate: Option<DateTime>,
	pub state: i64,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub certificate: Option<GeneratedId>,
}
impl Entity for CertificateInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CertificateInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Challenge {
	pub _id: CustomId,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub otp: Option<OtpChallenge>,
	pub u2f: Option<U2fChallenge>,
}
impl Entity for Challenge {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Challenge",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
		TypeRef {
			app: "sys",
			type_: "ChangeKdfPostIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
		TypeRef {
			app: "sys",
			type_: "ChangePasswordPostIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Chat {
	pub _id: CustomId,
	pub recipient: GeneratedId,
	pub sender: GeneratedId,
	pub text: String,
}
impl Entity for Chat {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Chat",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CloseSessionServicePost {
	pub _format: i64,
	pub accessToken: String,
	pub sessionId: IdTuple,
}
impl Entity for CloseSessionServicePost {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CloseSessionServicePost",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CreateCustomerServerPropertiesData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub adminGroupEncSessionKey: Vec<u8>,
	pub adminGroupKeyVersion: i64,
}
impl Entity for CreateCustomerServerPropertiesData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CreateCustomerServerPropertiesData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CreateCustomerServerPropertiesReturn {
	pub _format: i64,
	pub id: GeneratedId,
}
impl Entity for CreateCustomerServerPropertiesReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CreateCustomerServerPropertiesReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CreateSessionData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub accessKey: Option<Vec<u8>>,
	pub authToken: Option<String>,
	pub authVerifier: Option<String>,
	pub clientIdentifier: String,
	pub mailAddress: Option<String>,
	pub recoverCodeVerifier: Option<String>,
	pub user: Option<GeneratedId>,
}
impl Entity for CreateSessionData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CreateSessionData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CreateSessionReturn {
	pub _format: i64,
	pub accessToken: String,
	pub challenges: Vec<Challenge>,
	pub user: GeneratedId,
}
impl Entity for CreateSessionReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CreateSessionReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CreditCard {
	pub _id: CustomId,
	pub cardHolderName: String,
	pub cvv: String,
	pub expirationMonth: String,
	pub expirationYear: String,
	pub number: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for CreditCard {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CreditCard",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CustomDomainCheckGetIn {
	pub _format: i64,
	pub domain: String,
	pub customer: Option<GeneratedId>,
}
impl Entity for CustomDomainCheckGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CustomDomainCheckGetIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CustomDomainCheckGetOut {
	pub _format: i64,
	pub checkResult: i64,
	pub invalidRecords: Vec<DnsRecord>,
	pub missingRecords: Vec<DnsRecord>,
	pub requiredRecords: Vec<DnsRecord>,
}
impl Entity for CustomDomainCheckGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CustomDomainCheckGetOut",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CustomDomainData {
	pub _format: i64,
	pub domain: String,
	pub catchAllMailGroup: Option<GeneratedId>,
}
impl Entity for CustomDomainData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CustomDomainData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CustomDomainReturn {
	pub _format: i64,
	pub validationResult: i64,
	pub invalidDnsRecords: Vec<StringWrapper>,
}
impl Entity for CustomDomainReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CustomDomainReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Customer {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub approvalStatus: i64,
	pub businessUse: bool,
	pub orderProcessingAgreementNeeded: bool,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub adminGroup: GeneratedId,
	pub adminGroups: GeneratedId,
	pub auditLog: Option<AuditLogRef>,
	pub customerGroup: GeneratedId,
	pub customerGroups: GeneratedId,
	pub customerInfo: IdTuple,
	pub customizations: Vec<Feature>,
	pub orderProcessingAgreement: Option<IdTuple>,
	pub properties: Option<GeneratedId>,
	pub referralCode: Option<GeneratedId>,
	pub rejectedSenders: Option<RejectedSendersRef>,
	pub serverProperties: Option<GeneratedId>,
	pub teamGroups: GeneratedId,
	pub userAreaGroups: Option<UserAreaGroups>,
	pub userGroups: GeneratedId,
	pub whitelabelChildren: Option<WhitelabelChildrenRef>,
	pub whitelabelParent: Option<WhitelabelParent>,
}
impl Entity for Customer {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Customer",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CustomerAccountTerminationPostIn {
	pub _format: i64,
	pub terminationDate: Option<DateTime>,
	pub surveyData: Option<SurveyData>,
}
impl Entity for CustomerAccountTerminationPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CustomerAccountTerminationPostIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CustomerAccountTerminationPostOut {
	pub _format: i64,
	pub terminationRequest: IdTuple,
}
impl Entity for CustomerAccountTerminationPostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CustomerAccountTerminationPostOut",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CustomerAccountTerminationRequest {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub terminationDate: DateTime,
	pub terminationRequestDate: DateTime,
	pub customer: GeneratedId,
}
impl Entity for CustomerAccountTerminationRequest {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CustomerAccountTerminationRequest",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CustomerInfo {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub activationTime: Option<DateTime>,
	pub company: Option<String>,
	pub creationTime: DateTime,
	pub deletionReason: Option<String>,
	pub deletionTime: Option<DateTime>,
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
	pub testEndTime: Option<DateTime>,
	pub usedSharedEmailAliases: i64,
	pub accountingInfo: GeneratedId,
	pub bookings: Option<BookingsRef>,
	pub customPlan: Option<PlanConfiguration>,
	pub customer: GeneratedId,
	pub domainInfos: Vec<DomainInfo>,
	pub giftCards: Option<GiftCardsRef>,
	pub referredBy: Option<GeneratedId>,
	pub supportInfo: Option<GeneratedId>,
	pub takeoverCustomer: Option<GeneratedId>,
	pub terminationRequest: Option<IdTuple>,
}
impl Entity for CustomerInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CustomerInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CustomerProperties {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub externalUserWelcomeMessage: String,
	pub lastUpgradeReminder: Option<DateTime>,
	pub usageDataOptedOut: bool,
	pub bigLogo: Option<File>,
	pub notificationMailTemplates: Vec<NotificationMailTemplate>,
	pub smallLogo: Option<File>,
}
impl Entity for CustomerProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CustomerProperties",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct CustomerServerProperties {
	pub _format: i64,
	pub _id: GeneratedId,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub requirePasswordUpdateAfterReset: bool,
	pub saveEncryptedIpAddressInSession: bool,
	pub whitelabelCode: String,
	pub emailSenderList: Vec<EmailSenderListElement>,
	pub whitelabelRegistrationDomains: Vec<StringWrapper>,
	pub whitelistedDomains: Option<DomainsRef>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for CustomerServerProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "CustomerServerProperties",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct DateWrapper {
	pub _id: CustomId,
	pub date: DateTime,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for DateWrapper {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "DateWrapper",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct DebitServicePutData {
	pub _format: i64,
	pub invoice: Option<IdTuple>,
}
impl Entity for DebitServicePutData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "DebitServicePutData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct DeleteCustomerData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub authVerifier: Option<Vec<u8>>,
	pub reason: Option<String>,
	pub takeoverMailAddress: Option<String>,
	pub undelete: bool,
	pub customer: GeneratedId,
	pub surveyData: Option<SurveyData>,
}
impl Entity for DeleteCustomerData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "DeleteCustomerData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct DnsRecord {
	pub _id: CustomId,
	pub subdomain: Option<String>,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub value: String,
}
impl Entity for DnsRecord {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "DnsRecord",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct DomainInfo {
	pub _id: CustomId,
	pub domain: String,
	pub validatedMxRecord: bool,
	pub catchAllMailGroup: Option<GeneratedId>,
	pub whitelabelConfig: Option<GeneratedId>,
}
impl Entity for DomainInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "DomainInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct DomainMailAddressAvailabilityData {
	pub _format: i64,
	pub mailAddress: String,
}
impl Entity for DomainMailAddressAvailabilityData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "DomainMailAddressAvailabilityData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct DomainMailAddressAvailabilityReturn {
	pub _format: i64,
	pub available: bool,
}
impl Entity for DomainMailAddressAvailabilityReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "DomainMailAddressAvailabilityReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct DomainsRef {
	pub _id: CustomId,
	pub items: GeneratedId,
}
impl Entity for DomainsRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "DomainsRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct EmailSenderListElement {
	pub _id: CustomId,
	pub field: i64,
	pub hashedValue: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub value: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for EmailSenderListElement {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "EmailSenderListElement",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct EntityEventBatch {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub events: Vec<EntityUpdate>,
}
impl Entity for EntityEventBatch {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "EntityEventBatch",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct EntityUpdate {
	pub _id: CustomId,
	pub application: String,
	pub instanceId: String,
	pub instanceListId: String,
	pub operation: i64,
	#[serde(rename = "type")]
	pub r#type: String,
}
impl Entity for EntityUpdate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "EntityUpdate",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SysException {
	pub _id: CustomId,
	pub msg: String,
	#[serde(rename = "type")]
	pub r#type: String,
}
impl Entity for SysException {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SysException",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct ExternalPropertiesReturn {
	pub _format: i64,
	pub accountType: i64,
	pub message: String,
	pub bigLogo: Option<File>,
	pub smallLogo: Option<File>,
}
impl Entity for ExternalPropertiesReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "ExternalPropertiesReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct ExternalUserReference {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub user: GeneratedId,
	pub userGroup: GeneratedId,
}
impl Entity for ExternalUserReference {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "ExternalUserReference",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Feature {
	pub _id: CustomId,
	pub feature: i64,
}
impl Entity for Feature {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Feature",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct File {
	pub _id: CustomId,
	#[serde(with = "serde_bytes")]
	pub data: Vec<u8>,
	pub mimeType: String,
	pub name: String,
}
impl Entity for File {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "File",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GeneratedIdWrapper {
	pub _id: CustomId,
	pub value: GeneratedId,
}
impl Entity for GeneratedIdWrapper {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GeneratedIdWrapper",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GiftCard {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub message: String,
	pub migrated: bool,
	pub orderDate: DateTime,
	pub status: i64,
	pub value: i64,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for GiftCard {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GiftCard",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GiftCardCreateData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub keyHash: Vec<u8>,
	pub message: String,
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	pub value: i64,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for GiftCardCreateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GiftCardCreateData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GiftCardCreateReturn {
	pub _format: i64,
	pub giftCard: IdTuple,
}
impl Entity for GiftCardCreateReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GiftCardCreateReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GiftCardDeleteData {
	pub _format: i64,
	pub giftCard: IdTuple,
}
impl Entity for GiftCardDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GiftCardDeleteData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GiftCardGetReturn {
	pub _format: i64,
	pub maxPerPeriod: i64,
	pub period: i64,
	pub options: Vec<GiftCardOption>,
}
impl Entity for GiftCardGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GiftCardGetReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GiftCardOption {
	pub _id: CustomId,
	pub value: i64,
}
impl Entity for GiftCardOption {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GiftCardOption",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GiftCardRedeemData {
	pub _format: i64,
	pub countryCode: String,
	#[serde(with = "serde_bytes")]
	pub keyHash: Vec<u8>,
	pub giftCardInfo: GeneratedId,
}
impl Entity for GiftCardRedeemData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GiftCardRedeemData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GiftCardRedeemGetReturn {
	pub _format: i64,
	pub message: String,
	pub value: i64,
	pub giftCard: IdTuple,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for GiftCardRedeemGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GiftCardRedeemGetReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GiftCardsRef {
	pub _id: CustomId,
	pub items: GeneratedId,
}
impl Entity for GiftCardsRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GiftCardsRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Group {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	#[serde(with = "serde_bytes")]
	pub adminGroupEncGKey: Option<Vec<u8>>,
	pub adminGroupKeyVersion: Option<i64>,
	pub enabled: bool,
	pub external: bool,
	pub groupKeyVersion: i64,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub admin: Option<GeneratedId>,
	pub administratedGroups: Option<AdministratedGroupsRef>,
	pub archives: Vec<ArchiveType>,
	pub currentKeys: Option<KeyPair>,
	pub customer: Option<GeneratedId>,
	pub formerGroupKeys: Option<GroupKeysRef>,
	pub groupInfo: IdTuple,
	pub invitations: GeneratedId,
	pub members: GeneratedId,
	pub pubAdminGroupEncGKey: Option<PubEncKeyData>,
	pub storageCounter: Option<GeneratedId>,
	pub user: Option<GeneratedId>,
}
impl Entity for Group {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Group",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupInfo {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _listEncSessionKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub created: DateTime,
	pub deleted: Option<DateTime>,
	pub groupType: Option<i64>,
	pub mailAddress: Option<String>,
	pub name: String,
	pub group: GeneratedId,
	pub localAdmin: Option<GeneratedId>,
	pub mailAddressAliases: Vec<MailAddressAlias>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for GroupInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupKey {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	#[serde(with = "serde_bytes")]
	pub adminGroupEncGKey: Option<Vec<u8>>,
	pub adminGroupKeyVersion: Option<i64>,
	#[serde(with = "serde_bytes")]
	pub ownerEncGKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	pub keyPair: Option<KeyPair>,
	pub pubAdminGroupEncGKey: Option<PubEncKeyData>,
}
impl Entity for GroupKey {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupKey",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupKeyRotationData {
	pub _id: CustomId,
	#[serde(with = "serde_bytes")]
	pub adminGroupEncGroupKey: Option<Vec<u8>>,
	pub adminGroupKeyVersion: Option<i64>,
	#[serde(with = "serde_bytes")]
	pub groupEncPreviousGroupKey: Vec<u8>,
	pub groupKeyVersion: i64,
	pub group: GeneratedId,
	pub groupKeyUpdatesForMembers: Vec<GroupKeyUpdateData>,
	pub groupMembershipUpdateData: Vec<GroupMembershipUpdateData>,
	pub keyPair: Option<KeyPair>,
}
impl Entity for GroupKeyRotationData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupKeyRotationData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupKeyRotationInfoGetOut {
	pub _format: i64,
	pub userOrAdminGroupKeyRotationScheduled: bool,
	pub groupKeyUpdates: Vec<IdTuple>,
}
impl Entity for GroupKeyRotationInfoGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupKeyRotationInfoGetOut",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupKeyRotationPostIn {
	pub _format: i64,
	pub groupKeyUpdates: Vec<GroupKeyRotationData>,
}
impl Entity for GroupKeyRotationPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupKeyRotationPostIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupKeyUpdate {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	#[serde(with = "serde_bytes")]
	pub groupKey: Vec<u8>,
	pub groupKeyVersion: i64,
	pub bucketKey: BucketKey,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for GroupKeyUpdate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupKeyUpdate",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupKeyUpdateData {
	pub _id: CustomId,
	#[serde(with = "serde_bytes")]
	pub bucketKeyEncSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub sessionKeyEncGroupKey: Vec<u8>,
	pub sessionKeyEncGroupKeyVersion: i64,
	pub pubEncBucketKeyData: PubEncKeyData,
}
impl Entity for GroupKeyUpdateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupKeyUpdateData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupKeyUpdatesRef {
	pub _id: CustomId,
	pub list: GeneratedId,
}
impl Entity for GroupKeyUpdatesRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupKeyUpdatesRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupKeysRef {
	pub _id: CustomId,
	pub list: GeneratedId,
}
impl Entity for GroupKeysRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupKeysRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupMember {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub capability: Option<i64>,
	pub group: GeneratedId,
	pub user: GeneratedId,
	pub userGroupInfo: IdTuple,
}
impl Entity for GroupMember {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupMember",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupMembership {
	pub _id: CustomId,
	pub admin: bool,
	pub capability: Option<i64>,
	pub groupKeyVersion: i64,
	pub groupType: Option<i64>,
	#[serde(with = "serde_bytes")]
	pub symEncGKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub group: GeneratedId,
	pub groupInfo: IdTuple,
	pub groupMember: IdTuple,
}
impl Entity for GroupMembership {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupMembership",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupMembershipKeyData {
	pub _id: CustomId,
	pub groupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub symEncGKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub group: GeneratedId,
}
impl Entity for GroupMembershipKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupMembershipKeyData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupMembershipUpdateData {
	pub _id: CustomId,
	#[serde(with = "serde_bytes")]
	pub userEncGroupKey: Vec<u8>,
	pub userKeyVersion: i64,
	pub userId: GeneratedId,
}
impl Entity for GroupMembershipUpdateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupMembershipUpdateData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct GroupRoot {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub externalGroupInfos: GeneratedId,
	pub externalUserAreaGroupInfos: Option<UserAreaGroups>,
	pub externalUserReferences: GeneratedId,
}
impl Entity for GroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "GroupRoot",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct IdTupleWrapper {
	pub _id: CustomId,
	pub listElementId: GeneratedId,
	pub listId: GeneratedId,
}
impl Entity for IdTupleWrapper {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "IdTupleWrapper",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct InstanceSessionKey {
	pub _id: CustomId,
	#[serde(with = "serde_bytes")]
	pub encryptionAuthStatus: Option<Vec<u8>>,
	pub instanceId: GeneratedId,
	pub instanceList: GeneratedId,
	#[serde(with = "serde_bytes")]
	pub symEncSessionKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub typeInfo: TypeInfo,
}
impl Entity for InstanceSessionKey {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "InstanceSessionKey",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Invoice {
	pub _format: i64,
	pub _id: GeneratedId,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub address: String,
	pub adminUser: Option<String>,
	pub business: bool,
	pub country: String,
	pub date: DateTime,
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
	pub customer: GeneratedId,
	pub items: Vec<InvoiceItem>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for Invoice {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Invoice",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct InvoiceDataGetIn {
	pub _format: i64,
	pub invoiceNumber: String,
}
impl Entity for InvoiceDataGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "InvoiceDataGetIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct InvoiceDataGetOut {
	pub _format: i64,
	pub address: String,
	pub country: String,
	pub date: DateTime,
	pub grandTotal: i64,
	pub invoiceId: GeneratedId,
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
		TypeRef {
			app: "sys",
			type_: "InvoiceDataGetOut",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct InvoiceDataItem {
	pub _id: CustomId,
	pub amount: i64,
	pub endDate: Option<DateTime>,
	pub itemType: i64,
	pub singlePrice: Option<i64>,
	pub startDate: Option<DateTime>,
	pub totalPrice: i64,
}
impl Entity for InvoiceDataItem {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "InvoiceDataItem",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct InvoiceInfo {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
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
	pub invoices: GeneratedId,
	pub paymentErrorInfo: Option<PaymentErrorInfo>,
}
impl Entity for InvoiceInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "InvoiceInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct InvoiceItem {
	pub _id: CustomId,
	pub amount: i64,
	pub endDate: Option<DateTime>,
	pub singlePrice: Option<i64>,
	pub singleType: bool,
	pub startDate: Option<DateTime>,
	pub totalPrice: i64,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for InvoiceItem {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "InvoiceItem",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct KeyPair {
	pub _id: CustomId,
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
		TypeRef {
			app: "sys",
			type_: "KeyPair",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct KeyRotation {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub groupKeyRotationType: i64,
	pub targetKeyVersion: i64,
	pub adminGroupKeyAuthenticationData: Option<AdminGroupKeyAuthenticationData>,
}
impl Entity for KeyRotation {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "KeyRotation",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct KeyRotationsRef {
	pub _id: CustomId,
	pub list: GeneratedId,
}
impl Entity for KeyRotationsRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "KeyRotationsRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct LocationServiceGetReturn {
	pub _format: i64,
	pub country: String,
}
impl Entity for LocationServiceGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "LocationServiceGetReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Login {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub time: DateTime,
}
impl Entity for Login {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Login",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MailAddressAlias {
	pub _id: CustomId,
	pub enabled: bool,
	pub mailAddress: String,
}
impl Entity for MailAddressAlias {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MailAddressAlias",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MailAddressAliasGetIn {
	pub _format: i64,
	pub targetGroup: GeneratedId,
}
impl Entity for MailAddressAliasGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MailAddressAliasGetIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MailAddressAliasServiceData {
	pub _format: i64,
	pub mailAddress: String,
	pub group: GeneratedId,
}
impl Entity for MailAddressAliasServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MailAddressAliasServiceData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MailAddressAliasServiceDataDelete {
	pub _format: i64,
	pub mailAddress: String,
	pub restore: bool,
	pub group: GeneratedId,
}
impl Entity for MailAddressAliasServiceDataDelete {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MailAddressAliasServiceDataDelete",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MailAddressAliasServiceReturn {
	pub _format: i64,
	pub enabledAliases: i64,
	pub nbrOfFreeAliases: i64,
	pub totalAliases: i64,
	pub usedAliases: i64,
}
impl Entity for MailAddressAliasServiceReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MailAddressAliasServiceReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MailAddressAvailability {
	pub _id: CustomId,
	pub available: bool,
	pub mailAddress: String,
}
impl Entity for MailAddressAvailability {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MailAddressAvailability",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MailAddressToGroup {
	pub _format: i64,
	pub _id: CustomId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub internalGroup: Option<GeneratedId>,
}
impl Entity for MailAddressToGroup {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MailAddressToGroup",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MembershipAddData {
	pub _format: i64,
	pub groupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub symEncGKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub group: GeneratedId,
	pub user: GeneratedId,
}
impl Entity for MembershipAddData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MembershipAddData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MembershipPutIn {
	pub _format: i64,
	pub groupKeyUpdates: Vec<GroupMembershipKeyData>,
}
impl Entity for MembershipPutIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MembershipPutIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MembershipRemoveData {
	pub _format: i64,
	pub group: GeneratedId,
	pub user: GeneratedId,
}
impl Entity for MembershipRemoveData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MembershipRemoveData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MissedNotification {
	pub _format: i64,
	pub _id: CustomId,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub changeTime: DateTime,
	pub confirmationId: GeneratedId,
	pub lastProcessedNotificationId: Option<GeneratedId>,
	pub alarmNotifications: Vec<AlarmNotification>,
	pub notificationInfos: Vec<NotificationInfo>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for MissedNotification {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MissedNotification",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MultipleMailAddressAvailabilityData {
	pub _format: i64,
	pub mailAddresses: Vec<StringWrapper>,
}
impl Entity for MultipleMailAddressAvailabilityData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MultipleMailAddressAvailabilityData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct MultipleMailAddressAvailabilityReturn {
	pub _format: i64,
	pub availabilities: Vec<MailAddressAvailability>,
}
impl Entity for MultipleMailAddressAvailabilityReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "MultipleMailAddressAvailabilityReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct NotificationInfo {
	pub _id: CustomId,
	pub mailAddress: String,
	pub userId: GeneratedId,
	pub mailId: Option<IdTupleWrapper>,
}
impl Entity for NotificationInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "NotificationInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct NotificationMailTemplate {
	pub _id: CustomId,
	pub body: String,
	pub language: String,
	pub subject: String,
}
impl Entity for NotificationMailTemplate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "NotificationMailTemplate",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct NotificationSessionKey {
	pub _id: CustomId,
	#[serde(with = "serde_bytes")]
	pub pushIdentifierSessionEncSessionKey: Vec<u8>,
	pub pushIdentifier: IdTuple,
}
impl Entity for NotificationSessionKey {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "NotificationSessionKey",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct OrderProcessingAgreement {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub customerAddress: String,
	pub signatureDate: DateTime,
	pub version: String,
	pub customer: GeneratedId,
	pub signerUserGroupInfo: IdTuple,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for OrderProcessingAgreement {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "OrderProcessingAgreement",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct OtpChallenge {
	pub _id: CustomId,
	pub secondFactors: Vec<IdTuple>,
}
impl Entity for OtpChallenge {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "OtpChallenge",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PaymentDataServiceGetData {
	pub _format: i64,
	pub clientType: Option<i64>,
}
impl Entity for PaymentDataServiceGetData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PaymentDataServiceGetData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PaymentDataServiceGetReturn {
	pub _format: i64,
	pub loginUrl: String,
}
impl Entity for PaymentDataServiceGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PaymentDataServiceGetReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PaymentDataServicePostData {
	pub _format: i64,
	pub braintree3dsResponse: Braintree3ds2Response,
}
impl Entity for PaymentDataServicePostData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PaymentDataServicePostData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for PaymentDataServicePutData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PaymentDataServicePutData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PaymentDataServicePutReturn {
	pub _format: i64,
	pub result: i64,
	pub braintree3dsRequest: Option<Braintree3ds2Request>,
}
impl Entity for PaymentDataServicePutReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PaymentDataServicePutReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PaymentErrorInfo {
	pub _id: CustomId,
	pub errorCode: String,
	pub errorTime: DateTime,
	pub thirdPartyErrorId: String,
}
impl Entity for PaymentErrorInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PaymentErrorInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Permission {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
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
	pub group: Option<GeneratedId>,
}
impl Entity for Permission {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Permission",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PlanConfiguration {
	pub _id: CustomId,
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
		TypeRef {
			app: "sys",
			type_: "PlanConfiguration",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PlanPrices {
	pub _id: CustomId,
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
		TypeRef {
			app: "sys",
			type_: "PlanPrices",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PlanServiceGetOut {
	pub _format: i64,
	pub config: PlanConfiguration,
}
impl Entity for PlanServiceGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PlanServiceGetOut",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PriceData {
	pub _id: CustomId,
	pub paymentInterval: i64,
	pub price: i64,
	pub taxIncluded: bool,
	pub items: Vec<PriceItemData>,
}
impl Entity for PriceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PriceData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PriceItemData {
	pub _id: CustomId,
	pub count: i64,
	pub featureType: i64,
	pub price: i64,
	pub singleType: bool,
}
impl Entity for PriceItemData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PriceItemData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PriceRequestData {
	pub _id: CustomId,
	pub accountType: Option<i64>,
	pub business: Option<bool>,
	pub count: i64,
	pub featureType: i64,
	pub paymentInterval: Option<i64>,
	pub reactivate: bool,
}
impl Entity for PriceRequestData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PriceRequestData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PriceServiceData {
	pub _format: i64,
	pub date: Option<DateTime>,
	pub priceRequest: Option<PriceRequestData>,
}
impl Entity for PriceServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PriceServiceData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PriceServiceReturn {
	pub _format: i64,
	pub currentPeriodAddedPrice: Option<i64>,
	pub periodEndDate: DateTime,
	pub currentPriceNextPeriod: Option<PriceData>,
	pub currentPriceThisPeriod: Option<PriceData>,
	pub futurePriceNextPeriod: Option<PriceData>,
}
impl Entity for PriceServiceReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PriceServiceReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PubEncKeyData {
	pub _id: CustomId,
	pub protocolVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pubEncSymKey: Vec<u8>,
	pub recipientIdentifier: String,
	pub recipientIdentifierType: i64,
	pub recipientKeyVersion: i64,
	pub senderKeyVersion: Option<i64>,
}
impl Entity for PubEncKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PubEncKeyData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PublicKeyGetIn {
	pub _format: i64,
	pub identifier: String,
	pub identifierType: i64,
	pub version: Option<i64>,
}
impl Entity for PublicKeyGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PublicKeyGetIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
		TypeRef {
			app: "sys",
			type_: "PublicKeyGetOut",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PublicKeyPutIn {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub pubEccKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub symEncPrivEccKey: Vec<u8>,
	pub keyGroup: GeneratedId,
}
impl Entity for PublicKeyPutIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PublicKeyPutIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PushIdentifier {
	pub _area: i64,
	pub _format: i64,
	pub _id: IdTuple,
	pub _owner: GeneratedId,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub app: i64,
	pub disabled: bool,
	pub displayName: String,
	pub identifier: String,
	pub language: String,
	pub lastNotificationDate: Option<DateTime>,
	pub lastUsageTime: DateTime,
	pub pushServiceType: i64,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for PushIdentifier {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PushIdentifier",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PushIdentifierList {
	pub _id: CustomId,
	pub list: GeneratedId,
}
impl Entity for PushIdentifierList {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "PushIdentifierList",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct ReceivedGroupInvitation {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
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
	pub sharedGroup: GeneratedId,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for ReceivedGroupInvitation {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "ReceivedGroupInvitation",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct RecoverCode {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
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
		TypeRef {
			app: "sys",
			type_: "RecoverCode",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct RecoverCodeData {
	pub _id: CustomId,
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
		TypeRef {
			app: "sys",
			type_: "RecoverCodeData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct ReferralCodeGetIn {
	pub _format: i64,
	pub referralCode: GeneratedId,
}
impl Entity for ReferralCodeGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "ReferralCodeGetIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct ReferralCodePostIn {
	pub _format: i64,
}
impl Entity for ReferralCodePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "ReferralCodePostIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct ReferralCodePostOut {
	pub _format: i64,
	pub referralCode: GeneratedId,
}
impl Entity for ReferralCodePostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "ReferralCodePostOut",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct RegistrationCaptchaServiceData {
	pub _format: i64,
	pub response: String,
	pub token: String,
}
impl Entity for RegistrationCaptchaServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "RegistrationCaptchaServiceData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
		TypeRef {
			app: "sys",
			type_: "RegistrationCaptchaServiceGetData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct RegistrationCaptchaServiceReturn {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub challenge: Option<Vec<u8>>,
	pub token: String,
}
impl Entity for RegistrationCaptchaServiceReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "RegistrationCaptchaServiceReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct RegistrationReturn {
	pub _format: i64,
	pub authToken: String,
}
impl Entity for RegistrationReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "RegistrationReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct RegistrationServiceData {
	pub _format: i64,
	pub source: Option<String>,
	pub starterDomain: String,
	pub state: i64,
}
impl Entity for RegistrationServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "RegistrationServiceData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct RejectedSender {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub reason: String,
	pub recipientMailAddress: String,
	pub senderHostname: String,
	pub senderIp: String,
	pub senderMailAddress: String,
}
impl Entity for RejectedSender {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "RejectedSender",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct RejectedSendersRef {
	pub _id: CustomId,
	pub items: GeneratedId,
}
impl Entity for RejectedSendersRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "RejectedSendersRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct RepeatRule {
	pub _id: CustomId,
	pub endType: i64,
	pub endValue: Option<i64>,
	pub frequency: i64,
	pub interval: i64,
	pub timeZone: String,
	pub excludedDates: Vec<DateWrapper>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for RepeatRule {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "RepeatRule",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct ResetFactorsDeleteData {
	pub _format: i64,
	pub authVerifier: String,
	pub mailAddress: String,
	pub recoverCodeVerifier: String,
}
impl Entity for ResetFactorsDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "ResetFactorsDeleteData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
	pub user: GeneratedId,
}
impl Entity for ResetPasswordPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "ResetPasswordPostIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct RootInstance {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub reference: GeneratedId,
}
impl Entity for RootInstance {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "RootInstance",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SaltData {
	pub _format: i64,
	pub mailAddress: String,
}
impl Entity for SaltData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SaltData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SaltReturn {
	pub _format: i64,
	pub kdfVersion: i64,
	#[serde(with = "serde_bytes")]
	pub salt: Vec<u8>,
}
impl Entity for SaltReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SaltReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SecondFactor {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub name: String,
	#[serde(with = "serde_bytes")]
	pub otpSecret: Option<Vec<u8>>,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub u2f: Option<U2fRegisteredDevice>,
}
impl Entity for SecondFactor {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SecondFactor",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SecondFactorAuthAllowedReturn {
	pub _format: i64,
	pub allowed: bool,
}
impl Entity for SecondFactorAuthAllowedReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SecondFactorAuthAllowedReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
		TypeRef {
			app: "sys",
			type_: "SecondFactorAuthData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SecondFactorAuthDeleteData {
	pub _format: i64,
	pub session: IdTuple,
}
impl Entity for SecondFactorAuthDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SecondFactorAuthDeleteData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SecondFactorAuthGetData {
	pub _format: i64,
	pub accessToken: String,
}
impl Entity for SecondFactorAuthGetData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SecondFactorAuthGetData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SecondFactorAuthGetReturn {
	pub _format: i64,
	pub secondFactorPending: bool,
}
impl Entity for SecondFactorAuthGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SecondFactorAuthGetReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SecondFactorAuthentication {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub code: String,
	pub finished: bool,
	pub service: String,
	pub verifyCount: i64,
}
impl Entity for SecondFactorAuthentication {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SecondFactorAuthentication",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SendRegistrationCodeData {
	pub _format: i64,
	pub accountType: i64,
	pub authToken: String,
	pub language: String,
	pub mobilePhoneNumber: String,
}
impl Entity for SendRegistrationCodeData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SendRegistrationCodeData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SendRegistrationCodeReturn {
	pub _format: i64,
	pub authToken: String,
}
impl Entity for SendRegistrationCodeReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SendRegistrationCodeReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SentGroupInvitation {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub capability: i64,
	pub inviteeMailAddress: String,
	pub receivedInvitation: Option<IdTuple>,
	pub sharedGroup: GeneratedId,
}
impl Entity for SentGroupInvitation {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SentGroupInvitation",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Session {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	#[serde(with = "serde_bytes")]
	pub accessKey: Option<Vec<u8>>,
	pub clientIdentifier: String,
	pub lastAccessTime: DateTime,
	pub loginIpAddress: Option<String>,
	pub loginTime: DateTime,
	pub state: i64,
	pub challenges: Vec<Challenge>,
	pub user: GeneratedId,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for Session {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Session",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SignOrderProcessingAgreementData {
	pub _format: i64,
	pub customerAddress: String,
	pub version: String,
}
impl Entity for SignOrderProcessingAgreementData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SignOrderProcessingAgreementData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SseConnectData {
	pub _format: i64,
	pub identifier: String,
	pub userIds: Vec<GeneratedIdWrapper>,
}
impl Entity for SseConnectData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SseConnectData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct StringConfigValue {
	pub _id: CustomId,
	pub name: String,
	pub value: String,
}
impl Entity for StringConfigValue {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "StringConfigValue",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct StringWrapper {
	pub _id: CustomId,
	pub value: String,
}
impl Entity for StringWrapper {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "StringWrapper",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SurveyData {
	pub _id: CustomId,
	pub category: i64,
	pub details: Option<String>,
	pub reason: i64,
	pub version: i64,
}
impl Entity for SurveyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SurveyData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct SwitchAccountTypePostIn {
	pub _format: i64,
	pub accountType: i64,
	pub customer: Option<GeneratedId>,
	pub date: Option<DateTime>,
	pub plan: i64,
	pub specialPriceUserSingle: Option<i64>,
	pub referralCode: Option<GeneratedId>,
	pub surveyData: Option<SurveyData>,
}
impl Entity for SwitchAccountTypePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SwitchAccountTypePostIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
	pub freeGroup: Option<GeneratedId>,
	pub premiumGroup: Option<GeneratedId>,
}
impl Entity for SystemKeysReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "SystemKeysReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct TakeOverDeletedAddressData {
	pub _format: i64,
	pub authVerifier: String,
	pub mailAddress: String,
	pub recoverCodeVerifier: Option<String>,
	pub targetAccountMailAddress: String,
}
impl Entity for TakeOverDeletedAddressData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "TakeOverDeletedAddressData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct TypeInfo {
	pub _id: CustomId,
	pub application: String,
	pub typeId: i64,
}
impl Entity for TypeInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "TypeInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct U2fChallenge {
	pub _id: CustomId,
	#[serde(with = "serde_bytes")]
	pub challenge: Vec<u8>,
	pub keys: Vec<U2fKey>,
}
impl Entity for U2fChallenge {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "U2fChallenge",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct U2fKey {
	pub _id: CustomId,
	pub appId: String,
	#[serde(with = "serde_bytes")]
	pub keyHandle: Vec<u8>,
	pub secondFactor: IdTuple,
}
impl Entity for U2fKey {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "U2fKey",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct U2fRegisteredDevice {
	pub _id: CustomId,
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
		TypeRef {
			app: "sys",
			type_: "U2fRegisteredDevice",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct U2fResponseData {
	pub _id: CustomId,
	pub clientData: String,
	pub keyHandle: String,
	pub signatureData: String,
}
impl Entity for U2fResponseData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "U2fResponseData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
		TypeRef {
			app: "sys",
			type_: "UpdatePermissionKeyData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UpdateSessionKeysPostIn {
	pub _format: i64,
	pub ownerEncSessionKeys: Vec<InstanceSessionKey>,
}
impl Entity for UpdateSessionKeysPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UpdateSessionKeysPostIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UpgradePriceServiceData {
	pub _format: i64,
	pub campaign: Option<String>,
	pub date: Option<DateTime>,
	pub referralCode: Option<GeneratedId>,
}
impl Entity for UpgradePriceServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UpgradePriceServiceData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
		TypeRef {
			app: "sys",
			type_: "UpgradePriceServiceReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct User {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
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
	pub customer: Option<GeneratedId>,
	pub externalAuthInfo: Option<UserExternalAuthInfo>,
	pub failedLogins: GeneratedId,
	pub memberships: Vec<GroupMembership>,
	pub pushIdentifierList: Option<PushIdentifierList>,
	pub secondFactorAuthentications: GeneratedId,
	pub successfulLogins: GeneratedId,
	pub userGroup: GroupMembership,
}
impl Entity for User {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "User",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UserAlarmInfo {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub alarmInfo: AlarmInfo,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for UserAlarmInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UserAlarmInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UserAlarmInfoListType {
	pub _id: CustomId,
	pub alarms: GeneratedId,
}
impl Entity for UserAlarmInfoListType {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UserAlarmInfoListType",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UserAreaGroups {
	pub _id: CustomId,
	pub list: GeneratedId,
}
impl Entity for UserAreaGroups {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UserAreaGroups",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UserAuthentication {
	pub _id: CustomId,
	pub recoverCode: Option<GeneratedId>,
	pub secondFactors: GeneratedId,
	pub sessions: GeneratedId,
}
impl Entity for UserAuthentication {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UserAuthentication",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UserDataDelete {
	pub _format: i64,
	pub date: Option<DateTime>,
	pub restore: bool,
	pub user: GeneratedId,
}
impl Entity for UserDataDelete {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UserDataDelete",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UserExternalAuthInfo {
	pub _id: CustomId,
	pub authUpdateCounter: i64,
	pub autoAuthenticationId: GeneratedId,
	pub autoTransmitPassword: Option<String>,
	#[serde(with = "serde_bytes")]
	pub latestSaltHash: Option<Vec<u8>>,
	pub variableAuthInfo: GeneratedId,
}
impl Entity for UserExternalAuthInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UserExternalAuthInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UserGroupKeyDistribution {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	#[serde(with = "serde_bytes")]
	pub distributionEncUserGroupKey: Vec<u8>,
	pub userGroupKeyVersion: i64,
}
impl Entity for UserGroupKeyDistribution {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UserGroupKeyDistribution",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UserGroupKeyRotationData {
	pub _id: CustomId,
	#[serde(with = "serde_bytes")]
	pub adminGroupEncUserGroupKey: Option<Vec<u8>>,
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
	pub group: GeneratedId,
	pub keyPair: KeyPair,
	pub pubAdminGroupEncUserGroupKey: Option<PubEncKeyData>,
	pub recoverCodeData: Option<RecoverCodeData>,
}
impl Entity for UserGroupKeyRotationData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UserGroupKeyRotationData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UserGroupKeyRotationPostIn {
	pub _format: i64,
	pub userGroupKeyData: UserGroupKeyRotationData,
}
impl Entity for UserGroupKeyRotationPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UserGroupKeyRotationPostIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UserGroupRoot {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub groupKeyUpdates: Option<GroupKeyUpdatesRef>,
	pub invitations: GeneratedId,
	pub keyRotations: Option<KeyRotationsRef>,
}
impl Entity for UserGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "UserGroupRoot",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct VariableExternalAuthInfo {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub authUpdateCounter: i64,
	pub lastSentTimestamp: DateTime,
	#[serde(with = "serde_bytes")]
	pub loggedInIpAddressHash: Option<Vec<u8>>,
	pub loggedInTimestamp: Option<DateTime>,
	#[serde(with = "serde_bytes")]
	pub loggedInVerifier: Option<Vec<u8>>,
	pub sentCount: i64,
}
impl Entity for VariableExternalAuthInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "VariableExternalAuthInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct VerifyRegistrationCodeData {
	pub _format: i64,
	pub authToken: String,
	pub code: String,
}
impl Entity for VerifyRegistrationCodeData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "VerifyRegistrationCodeData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct Version {
	pub _id: CustomId,
	pub operation: String,
	pub timestamp: DateTime,
	pub version: GeneratedId,
	pub author: GeneratedId,
	pub authorGroupInfo: IdTuple,
}
impl Entity for Version {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "Version",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct VersionData {
	pub _format: i64,
	pub application: String,
	pub id: GeneratedId,
	pub listId: Option<GeneratedId>,
	pub typeId: i64,
}
impl Entity for VersionData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "VersionData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct VersionInfo {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub app: String,
	pub operation: String,
	pub referenceList: Option<GeneratedId>,
	pub timestamp: DateTime,
	#[serde(rename = "type")]
	pub r#type: i64,
	#[serde(with = "serde_bytes")]
	pub versionData: Option<Vec<u8>>,
	pub author: GeneratedId,
	pub authorGroupInfo: IdTuple,
}
impl Entity for VersionInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "VersionInfo",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct VersionReturn {
	pub _format: i64,
	pub versions: Vec<Version>,
}
impl Entity for VersionReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "VersionReturn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct WebauthnResponseData {
	pub _id: CustomId,
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
		TypeRef {
			app: "sys",
			type_: "WebauthnResponseData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct WebsocketCounterData {
	pub _format: i64,
	pub mailGroup: GeneratedId,
	pub counterValues: Vec<WebsocketCounterValue>,
}
impl Entity for WebsocketCounterData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "WebsocketCounterData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct WebsocketCounterValue {
	pub _id: CustomId,
	pub count: i64,
	pub counterId: GeneratedId,
}
impl Entity for WebsocketCounterValue {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "WebsocketCounterValue",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct WebsocketEntityData {
	pub _format: i64,
	pub eventBatchId: GeneratedId,
	pub eventBatchOwner: GeneratedId,
	pub eventBatch: Vec<EntityUpdate>,
}
impl Entity for WebsocketEntityData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "WebsocketEntityData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct WebsocketLeaderStatus {
	pub _format: i64,
	pub leaderStatus: bool,
}
impl Entity for WebsocketLeaderStatus {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "WebsocketLeaderStatus",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct WhitelabelChild {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub comment: String,
	pub createdDate: DateTime,
	pub deletedDate: Option<DateTime>,
	pub mailAddress: String,
	pub customer: GeneratedId,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}
impl Entity for WhitelabelChild {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "WhitelabelChild",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct WhitelabelChildrenRef {
	pub _id: CustomId,
	pub items: GeneratedId,
}
impl Entity for WhitelabelChildrenRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "WhitelabelChildrenRef",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct WhitelabelConfig {
	pub _format: i64,
	pub _id: GeneratedId,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
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
		TypeRef {
			app: "sys",
			type_: "WhitelabelConfig",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct WhitelabelParent {
	pub _id: CustomId,
	pub customer: GeneratedId,
	pub whitelabelChildInParent: IdTuple,
}
impl Entity for WhitelabelParent {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_: "WhitelabelParent",
		}
	}
}
