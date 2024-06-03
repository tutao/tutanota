#![allow(non_snake_case)]
use super::*;

pub struct AccountingInfo {
	pub _format: String,
	pub _id: Id,
	pub _modified: Date,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub invoiceAddress: String,
	pub invoiceCountry: String,
	pub invoiceName: String,
	pub invoiceVatIdNo: String,
	pub lastInvoiceNbrOfSentSms: String,
	pub lastInvoiceTimestamp: Date,
	pub paymentAccountIdentifier: String,
	pub paymentInterval: String,
	pub paymentMethod: String,
	pub paymentMethodInfo: String,
	pub paymentProviderCustomerId: String,
	pub paypalBillingAgreement: String,
	pub secondCountryInfo: String,
	pub invoiceInfo: Option<Id>,
}

pub struct AdministratedGroupsRef {
	pub _id: Id,
	pub items: Id,
}

pub struct AlarmInfo {
	pub _id: Id,
	pub alarmIdentifier: String,
	pub trigger: String,
	pub calendarRef: CalendarEventRef,
}

pub struct AlarmNotification {
	pub _id: Id,
	pub eventEnd: Date,
	pub eventStart: Date,
	pub operation: String,
	pub summary: String,
	pub alarmInfo: AlarmInfo,
	pub notificationSessionKeys: Vec<NotificationSessionKey>,
	pub repeatRule: Option<RepeatRule>,
	pub user: Id,
}

pub struct AlarmServicePost {
	pub _format: String,
	pub alarmNotifications: Vec<AlarmNotification>,
}

pub struct ArchiveRef {
	pub _id: Id,
	pub archiveId: Id,
}

pub struct ArchiveType {
	pub _id: Id,
	pub active: ArchiveRef,
	pub inactive: Vec<ArchiveRef>,
	pub type: TypeInfo,
}

pub struct AuditLogEntry {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub action: String,
	pub actorIpAddress: String,
	pub actorMailAddress: String,
	pub date: Date,
	pub modifiedEntity: String,
	pub groupInfo: Option<IdTuple>,
	pub modifiedGroupInfo: Option<IdTuple>,
}

pub struct AuditLogRef {
	pub _id: Id,
	pub items: Id,
}

pub struct AuthenticatedDevice {
	pub _id: Id,
	pub authType: String,
	pub deviceKey: Vec<u8>,
	pub deviceToken: String,
}

pub struct Authentication {
	pub _id: Id,
	pub accessToken: String,
	pub authVerifier: String,
	pub externalAuthToken: String,
	pub userId: Id,
}

pub struct AutoLoginDataDelete {
	pub _format: String,
	pub deviceToken: String,
}

pub struct AutoLoginDataGet {
	pub _format: String,
	pub deviceToken: String,
	pub userId: Id,
}

pub struct AutoLoginDataReturn {
	pub _format: String,
	pub deviceKey: Vec<u8>,
}

pub struct AutoLoginPostReturn {
	pub _format: String,
	pub deviceToken: String,
}

pub struct Blob {
	pub _id: Id,
	pub archiveId: Id,
	pub blobId: Id,
	pub size: String,
}

pub struct BlobReferenceTokenWrapper {
	pub _id: Id,
	pub blobReferenceToken: String,
}

pub struct Booking {
	pub _area: String,
	pub _format: String,
	pub _id: IdTuple,
	pub _owner: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub bonusMonth: String,
	pub createDate: Date,
	pub endDate: Date,
	pub paymentInterval: String,
	pub paymentMonths: String,
	pub items: Vec<BookingItem>,
}

pub struct BookingItem {
	pub _id: Id,
	pub currentCount: String,
	pub currentInvoicedCount: String,
	pub featureType: String,
	pub maxCount: String,
	pub price: String,
	pub priceType: String,
	pub totalInvoicedCount: String,
}

pub struct BookingsRef {
	pub _id: Id,
	pub items: Id,
}

pub struct BootstrapFeature {
	pub _id: Id,
	pub feature: String,
}

pub struct Braintree3ds2Request {
	pub _id: Id,
	pub bin: String,
	pub clientToken: String,
	pub nonce: String,
}

pub struct Braintree3ds2Response {
	pub _id: Id,
	pub clientToken: String,
	pub nonce: String,
}

pub struct BrandingDomainData {
	pub _format: String,
	pub domain: String,
	pub sessionEncPemCertificateChain: Vec<u8>,
	pub sessionEncPemPrivateKey: Vec<u8>,
	pub systemAdminPubEncSessionKey: Vec<u8>,
	pub systemAdminPubKeyVersion: String,
	pub systemAdminPublicProtocolVersion: String,
}

pub struct BrandingDomainDeleteData {
	pub _format: String,
	pub domain: String,
}

pub struct BrandingDomainGetReturn {
	pub _format: String,
	pub certificateInfo: Option<CertificateInfo>,
}

pub struct Bucket {
	pub _id: Id,
	pub bucketPermissions: Id,
}

pub struct BucketKey {
	pub _id: Id,
	pub groupEncBucketKey: Vec<u8>,
	pub protocolVersion: String,
	pub pubEncBucketKey: Vec<u8>,
	pub recipientKeyVersion: String,
	pub senderKeyVersion: String,
	pub bucketEncSessionKeys: Vec<InstanceSessionKey>,
	pub keyGroup: Option<Id>,
}

pub struct BucketPermission {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub ownerEncBucketKey: Vec<u8>,
	pub ownerKeyVersion: String,
	pub protocolVersion: String,
	pub pubEncBucketKey: Vec<u8>,
	pub pubKeyVersion: String,
	pub senderKeyVersion: String,
	pub symEncBucketKey: Vec<u8>,
	pub symKeyVersion: String,
	#[serde(rename = "type")]
	pub r#type: String,
	pub group: Id,
}

pub struct CalendarEventRef {
	pub _id: Id,
	pub elementId: Id,
	pub listId: Id,
}

pub struct CertificateInfo {
	pub _id: Id,
	pub expiryDate: Date,
	pub state: String,
	#[serde(rename = "type")]
	pub r#type: String,
	pub certificate: Option<Id>,
}

pub struct Challenge {
	pub _id: Id,
	#[serde(rename = "type")]
	pub r#type: String,
	pub otp: Option<OtpChallenge>,
	pub u2f: Option<U2fChallenge>,
}

pub struct ChangeKdfPostIn {
	pub _format: String,
	pub kdfVersion: String,
	pub oldVerifier: Vec<u8>,
	pub pwEncUserGroupKey: Vec<u8>,
	pub salt: Vec<u8>,
	pub verifier: Vec<u8>,
}

pub struct ChangePasswordData {
	pub _format: String,
	pub code: String,
	pub kdfVersion: String,
	pub oldVerifier: Vec<u8>,
	pub pwEncUserGroupKey: Vec<u8>,
	pub recoverCodeVerifier: Vec<u8>,
	pub salt: Vec<u8>,
	pub verifier: Vec<u8>,
}

pub struct Chat {
	pub _id: Id,
	pub recipient: Id,
	pub sender: Id,
	pub text: String,
}

pub struct CloseSessionServicePost {
	pub _format: String,
	pub accessToken: String,
	pub sessionId: IdTuple,
}

pub struct CreateCustomerServerPropertiesData {
	pub _format: String,
	pub adminGroupEncSessionKey: Vec<u8>,
	pub adminGroupKeyVersion: String,
}

pub struct CreateCustomerServerPropertiesReturn {
	pub _format: String,
	pub id: Id,
}

pub struct CreateSessionData {
	pub _format: String,
	pub accessKey: Vec<u8>,
	pub authToken: String,
	pub authVerifier: String,
	pub clientIdentifier: String,
	pub mailAddress: String,
	pub recoverCodeVerifier: String,
	pub user: Option<Id>,
}

pub struct CreateSessionReturn {
	pub _format: String,
	pub accessToken: String,
	pub challenges: Vec<Challenge>,
	pub user: Id,
}

pub struct CreditCard {
	pub _id: Id,
	pub cardHolderName: String,
	pub cvv: String,
	pub expirationMonth: String,
	pub expirationYear: String,
	pub number: String,
}

pub struct CustomDomainCheckGetIn {
	pub _format: String,
	pub domain: String,
	pub customer: Option<Id>,
}

pub struct CustomDomainCheckGetOut {
	pub _format: String,
	pub checkResult: String,
	pub invalidRecords: Vec<DnsRecord>,
	pub missingRecords: Vec<DnsRecord>,
	pub requiredRecords: Vec<DnsRecord>,
}

pub struct CustomDomainData {
	pub _format: String,
	pub domain: String,
	pub catchAllMailGroup: Option<Id>,
}

pub struct CustomDomainReturn {
	pub _format: String,
	pub validationResult: String,
	pub invalidDnsRecords: Vec<StringWrapper>,
}

pub struct Customer {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub approvalStatus: String,
	pub businessUse: bool,
	pub orderProcessingAgreementNeeded: bool,
	#[serde(rename = "type")]
	pub r#type: String,
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

pub struct CustomerAccountTerminationPostIn {
	pub _format: String,
	pub terminationDate: Date,
	pub surveyData: Option<SurveyData>,
}

pub struct CustomerAccountTerminationPostOut {
	pub _format: String,
	pub terminationRequest: IdTuple,
}

pub struct CustomerAccountTerminationRequest {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub terminationDate: Date,
	pub terminationRequestDate: Date,
	pub customer: Id,
}

pub struct CustomerInfo {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub activationTime: Date,
	pub company: String,
	pub creationTime: Date,
	pub deletionReason: String,
	pub deletionTime: Date,
	pub domain: String,
	pub erased: bool,
	pub includedEmailAliases: String,
	pub includedStorageCapacity: String,
	pub perUserAliasCount: String,
	pub perUserStorageCapacity: String,
	pub plan: String,
	pub promotionEmailAliases: String,
	pub promotionStorageCapacity: String,
	pub registrationMailAddress: String,
	pub source: String,
	pub testEndTime: Date,
	pub usedSharedEmailAliases: String,
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

pub struct CustomerProperties {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub externalUserWelcomeMessage: String,
	pub lastUpgradeReminder: Date,
	pub usageDataOptedOut: bool,
	pub bigLogo: Option<File>,
	pub notificationMailTemplates: Vec<NotificationMailTemplate>,
	pub smallLogo: Option<File>,
}

pub struct CustomerServerProperties {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub requirePasswordUpdateAfterReset: bool,
	pub saveEncryptedIpAddressInSession: bool,
	pub whitelabelCode: String,
	pub emailSenderList: Vec<EmailSenderListElement>,
	pub whitelabelRegistrationDomains: Vec<StringWrapper>,
	pub whitelistedDomains: Option<DomainsRef>,
}

pub struct DateWrapper {
	pub _id: Id,
	pub date: Date,
}

pub struct DebitServicePutData {
	pub _format: String,
	pub invoice: Option<IdTuple>,
}

pub struct DeleteCustomerData {
	pub _format: String,
	pub authVerifier: Vec<u8>,
	pub reason: String,
	pub takeoverMailAddress: String,
	pub undelete: bool,
	pub customer: Id,
	pub surveyData: Option<SurveyData>,
}

pub struct DnsRecord {
	pub _id: Id,
	pub subdomain: String,
	#[serde(rename = "type")]
	pub r#type: String,
	pub value: String,
}

pub struct DomainInfo {
	pub _id: Id,
	pub domain: String,
	pub validatedMxRecord: bool,
	pub catchAllMailGroup: Option<Id>,
	pub whitelabelConfig: Option<Id>,
}

pub struct DomainMailAddressAvailabilityData {
	pub _format: String,
	pub mailAddress: String,
}

pub struct DomainMailAddressAvailabilityReturn {
	pub _format: String,
	pub available: bool,
}

pub struct DomainsRef {
	pub _id: Id,
	pub items: Id,
}

pub struct EmailSenderListElement {
	pub _id: Id,
	pub field: String,
	pub hashedValue: String,
	#[serde(rename = "type")]
	pub r#type: String,
	pub value: String,
}

pub struct EntityEventBatch {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub events: Vec<EntityUpdate>,
}

pub struct EntityUpdate {
	pub _id: Id,
	pub application: String,
	pub instanceId: String,
	pub instanceListId: String,
	pub operation: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

pub struct Exception {
	pub _id: Id,
	pub msg: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

pub struct ExternalPropertiesReturn {
	pub _format: String,
	pub accountType: String,
	pub message: String,
	pub bigLogo: Option<File>,
	pub smallLogo: Option<File>,
}

pub struct ExternalUserReference {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub user: Id,
	pub userGroup: Id,
}

pub struct Feature {
	pub _id: Id,
	pub feature: String,
}

pub struct File {
	pub _id: Id,
	pub data: Vec<u8>,
	pub mimeType: String,
	pub name: String,
}

pub struct GeneratedIdWrapper {
	pub _id: Id,
	pub value: Id,
}

pub struct GiftCard {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub message: String,
	pub migrated: bool,
	pub orderDate: Date,
	pub status: String,
	pub value: String,
}

pub struct GiftCardCreateData {
	pub _format: String,
	pub keyHash: Vec<u8>,
	pub message: String,
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerKeyVersion: String,
	pub value: String,
}

pub struct GiftCardCreateReturn {
	pub _format: String,
	pub giftCard: IdTuple,
}

pub struct GiftCardDeleteData {
	pub _format: String,
	pub giftCard: IdTuple,
}

pub struct GiftCardGetReturn {
	pub _format: String,
	pub maxPerPeriod: String,
	pub period: String,
	pub options: Vec<GiftCardOption>,
}

pub struct GiftCardOption {
	pub _id: Id,
	pub value: String,
}

pub struct GiftCardRedeemData {
	pub _format: String,
	pub countryCode: String,
	pub keyHash: Vec<u8>,
	pub giftCardInfo: Id,
}

pub struct GiftCardRedeemGetReturn {
	pub _format: String,
	pub message: String,
	pub value: String,
	pub giftCard: IdTuple,
}

pub struct GiftCardsRef {
	pub _id: Id,
	pub items: Id,
}

pub struct Group {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub adminGroupEncGKey: Vec<u8>,
	pub adminGroupKeyVersion: String,
	pub enabled: bool,
	pub external: bool,
	pub groupKeyVersion: String,
	pub pubAdminGroupEncGKey: Vec<u8>,
	#[serde(rename = "type")]
	pub r#type: String,
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

pub struct GroupInfo {
	pub _format: String,
	pub _id: IdTuple,
	pub _listEncSessionKey: Vec<u8>,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub created: Date,
	pub deleted: Date,
	pub groupType: String,
	pub mailAddress: String,
	pub name: String,
	pub group: Id,
	pub localAdmin: Option<Id>,
	pub mailAddressAliases: Vec<MailAddressAlias>,
}

pub struct GroupKey {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub adminGroupEncGKey: Vec<u8>,
	pub adminGroupKeyVersion: String,
	pub ownerEncGKey: Vec<u8>,
	pub ownerKeyVersion: String,
	pub pubAdminGroupEncGKey: Vec<u8>,
	pub keyPair: Option<KeyPair>,
}

pub struct GroupKeysRef {
	pub _id: Id,
	pub list: Id,
}

pub struct GroupMember {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub capability: String,
	pub group: Id,
	pub user: Id,
	pub userGroupInfo: IdTuple,
}

pub struct GroupMembership {
	pub _id: Id,
	pub admin: bool,
	pub capability: String,
	pub groupKeyVersion: String,
	pub groupType: String,
	pub symEncGKey: Vec<u8>,
	pub symKeyVersion: String,
	pub group: Id,
	pub groupInfo: IdTuple,
	pub groupMember: IdTuple,
}

pub struct GroupRoot {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub externalGroupInfos: Id,
	pub externalUserAreaGroupInfos: Option<UserAreaGroups>,
	pub externalUserReferences: Id,
}

pub struct IdTupleWrapper {
	pub _id: Id,
	pub listElementId: Id,
	pub listId: Id,
}

pub struct InstanceSessionKey {
	pub _id: Id,
	pub encryptionAuthStatus: Vec<u8>,
	pub instanceId: Id,
	pub instanceList: Id,
	pub symEncSessionKey: Vec<u8>,
	pub symKeyVersion: String,
	pub typeInfo: TypeInfo,
}

pub struct Invoice {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub address: String,
	pub adminUser: String,
	pub business: bool,
	pub country: String,
	pub date: Date,
	pub grandTotal: String,
	pub paymentMethod: String,
	pub reason: String,
	pub subTotal: String,
	#[serde(rename = "type")]
	pub r#type: String,
	pub vat: String,
	pub vatIdNumber: String,
	pub vatRate: String,
	pub bookings: Vec<IdTuple>,
	pub customer: Id,
	pub items: Vec<InvoiceItem>,
}

pub struct InvoiceDataGetIn {
	pub _format: String,
	pub invoiceNumber: String,
}

pub struct InvoiceDataGetOut {
	pub _format: String,
	pub address: String,
	pub country: String,
	pub date: Date,
	pub grandTotal: String,
	pub invoiceId: Id,
	pub invoiceType: String,
	pub paymentMethod: String,
	pub subTotal: String,
	pub vat: String,
	pub vatIdNumber: String,
	pub vatRate: String,
	pub vatType: String,
	pub items: Vec<InvoiceDataItem>,
}

pub struct InvoiceDataItem {
	pub _id: Id,
	pub amount: String,
	pub endDate: Date,
	pub itemType: String,
	pub singlePrice: String,
	pub startDate: Date,
	pub totalPrice: String,
}

pub struct InvoiceInfo {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub discountPercentage: String,
	pub extendedPeriodOfPaymentDays: String,
	pub persistentPaymentPeriodExtension: bool,
	pub publishInvoices: bool,
	pub reminderState: String,
	pub specialPriceBrandingPerUser: String,
	pub specialPriceBusinessPerUser: String,
	pub specialPriceContactFormSingle: String,
	pub specialPriceSharedGroupSingle: String,
	pub specialPriceSharingPerUser: String,
	pub specialPriceUserSingle: String,
	pub specialPriceUserTotal: String,
	pub invoices: Id,
	pub paymentErrorInfo: Option<PaymentErrorInfo>,
}

pub struct InvoiceItem {
	pub _id: Id,
	pub amount: String,
	pub endDate: Date,
	pub singlePrice: String,
	pub singleType: bool,
	pub startDate: Date,
	pub totalPrice: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

pub struct KeyPair {
	pub _id: Id,
	pub pubEccKey: Vec<u8>,
	pub pubKyberKey: Vec<u8>,
	pub pubRsaKey: Vec<u8>,
	pub symEncPrivEccKey: Vec<u8>,
	pub symEncPrivKyberKey: Vec<u8>,
	pub symEncPrivRsaKey: Vec<u8>,
}

pub struct KeyRotation {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub groupType: String,
	pub targetKeyVersion: String,
}

pub struct KeyRotationsRef {
	pub _id: Id,
	pub list: Id,
}

pub struct LocationServiceGetReturn {
	pub _format: String,
	pub country: String,
}

pub struct Login {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub time: Date,
}

pub struct MailAddressAlias {
	pub _id: Id,
	pub enabled: bool,
	pub mailAddress: String,
}

pub struct MailAddressAliasGetIn {
	pub _format: String,
	pub targetGroup: Id,
}

pub struct MailAddressAliasServiceData {
	pub _format: String,
	pub mailAddress: String,
	pub group: Id,
}

pub struct MailAddressAliasServiceDataDelete {
	pub _format: String,
	pub mailAddress: String,
	pub restore: bool,
	pub group: Id,
}

pub struct MailAddressAliasServiceReturn {
	pub _format: String,
	pub enabledAliases: String,
	pub nbrOfFreeAliases: String,
	pub totalAliases: String,
	pub usedAliases: String,
}

pub struct MailAddressAvailability {
	pub _id: Id,
	pub available: bool,
	pub mailAddress: String,
}

pub struct MailAddressToGroup {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub internalGroup: Option<Id>,
}

pub struct MembershipAddData {
	pub _format: String,
	pub groupKeyVersion: String,
	pub symEncGKey: Vec<u8>,
	pub symKeyVersion: String,
	pub group: Id,
	pub user: Id,
}

pub struct MembershipRemoveData {
	pub _format: String,
	pub group: Id,
	pub user: Id,
}

pub struct MissedNotification {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub changeTime: Date,
	pub confirmationId: Id,
	pub lastProcessedNotificationId: Id,
	pub alarmNotifications: Vec<AlarmNotification>,
	pub notificationInfos: Vec<NotificationInfo>,
}

pub struct MultipleMailAddressAvailabilityData {
	pub _format: String,
	pub mailAddresses: Vec<StringWrapper>,
}

pub struct MultipleMailAddressAvailabilityReturn {
	pub _format: String,
	pub availabilities: Vec<MailAddressAvailability>,
}

pub struct NotificationInfo {
	pub _id: Id,
	pub mailAddress: String,
	pub userId: Id,
	pub mailId: Option<IdTupleWrapper>,
}

pub struct NotificationMailTemplate {
	pub _id: Id,
	pub body: String,
	pub language: String,
	pub subject: String,
}

pub struct NotificationSessionKey {
	pub _id: Id,
	pub pushIdentifierSessionEncSessionKey: Vec<u8>,
	pub pushIdentifier: IdTuple,
}

pub struct OrderProcessingAgreement {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub customerAddress: String,
	pub signatureDate: Date,
	pub version: String,
	pub customer: Id,
	pub signerUserGroupInfo: IdTuple,
}

pub struct OtpChallenge {
	pub _id: Id,
	pub secondFactors: Vec<IdTuple>,
}

pub struct PaymentDataServiceGetData {
	pub _format: String,
	pub clientType: String,
}

pub struct PaymentDataServiceGetReturn {
	pub _format: String,
	pub loginUrl: String,
}

pub struct PaymentDataServicePostData {
	pub _format: String,
	pub braintree3dsResponse: Braintree3ds2Response,
}

pub struct PaymentDataServicePutData {
	pub _format: String,
	pub confirmedCountry: String,
	pub invoiceAddress: String,
	pub invoiceCountry: String,
	pub invoiceName: String,
	pub invoiceVatIdNo: String,
	pub paymentInterval: String,
	pub paymentMethod: String,
	pub paymentMethodInfo: String,
	pub paymentToken: String,
	pub creditCard: Option<CreditCard>,
}

pub struct PaymentDataServicePutReturn {
	pub _format: String,
	pub result: String,
	pub braintree3dsRequest: Option<Braintree3ds2Request>,
}

pub struct PaymentErrorInfo {
	pub _id: Id,
	pub errorCode: String,
	pub errorTime: Date,
	pub thirdPartyErrorId: String,
}

pub struct Permission {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub bucketEncSessionKey: Vec<u8>,
	pub listElementApplication: String,
	pub listElementTypeId: String,
	pub ops: String,
	pub symEncSessionKey: Vec<u8>,
	pub symKeyVersion: String,
	#[serde(rename = "type")]
	pub r#type: String,
	pub bucket: Option<Bucket>,
	pub group: Option<Id>,
}

pub struct PhoneNumber {
	pub _id: Id,
	pub number: String,
}

pub struct PlanConfiguration {
	pub _id: Id,
	pub autoResponder: bool,
	pub contactList: bool,
	pub customDomainType: String,
	pub eventInvites: bool,
	pub multiUser: bool,
	pub nbrOfAliases: String,
	pub sharing: bool,
	pub storageGb: String,
	pub templates: bool,
	pub whitelabel: bool,
}

pub struct PlanPrices {
	pub _id: Id,
	pub additionalUserPriceMonthly: String,
	pub business: bool,
	pub businessPlan: bool,
	pub customDomains: String,
	pub firstYearDiscount: String,
	pub includedAliases: String,
	pub includedStorage: String,
	pub monthlyPrice: String,
	pub monthlyReferencePrice: String,
	pub planName: String,
	pub sharing: bool,
	pub whitelabel: bool,
	pub planConfiguration: PlanConfiguration,
}

pub struct PlanServiceGetOut {
	pub _format: String,
	pub config: PlanConfiguration,
}

pub struct PriceData {
	pub _id: Id,
	pub paymentInterval: String,
	pub price: String,
	pub taxIncluded: bool,
	pub items: Vec<PriceItemData>,
}

pub struct PriceItemData {
	pub _id: Id,
	pub count: String,
	pub featureType: String,
	pub price: String,
	pub singleType: bool,
}

pub struct PriceRequestData {
	pub _id: Id,
	pub accountType: String,
	pub business: bool,
	pub count: String,
	pub featureType: String,
	pub paymentInterval: String,
	pub reactivate: bool,
}

pub struct PriceServiceData {
	pub _format: String,
	pub date: Date,
	pub priceRequest: Option<PriceRequestData>,
}

pub struct PriceServiceReturn {
	pub _format: String,
	pub currentPeriodAddedPrice: String,
	pub periodEndDate: Date,
	pub currentPriceNextPeriod: Option<PriceData>,
	pub currentPriceThisPeriod: Option<PriceData>,
	pub futurePriceNextPeriod: Option<PriceData>,
}

pub struct PublicKeyGetIn {
	pub _format: String,
	pub mailAddress: String,
	pub version: String,
}

pub struct PublicKeyGetOut {
	pub _format: String,
	pub pubEccKey: Vec<u8>,
	pub pubKeyVersion: String,
	pub pubKyberKey: Vec<u8>,
	pub pubRsaKey: Vec<u8>,
}

pub struct PublicKeyPutIn {
	pub _format: String,
	pub pubEccKey: Vec<u8>,
	pub symEncPrivEccKey: Vec<u8>,
	pub keyGroup: Id,
}

pub struct PushIdentifier {
	pub _area: String,
	pub _format: String,
	pub _id: IdTuple,
	pub _owner: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub disabled: bool,
	pub displayName: String,
	pub identifier: String,
	pub language: String,
	pub lastNotificationDate: Date,
	pub lastUsageTime: Date,
	pub pushServiceType: String,
}

pub struct PushIdentifierList {
	pub _id: Id,
	pub list: Id,
}

pub struct ReceivedGroupInvitation {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub capability: String,
	pub groupType: String,
	pub inviteeMailAddress: String,
	pub inviterMailAddress: String,
	pub inviterName: String,
	pub sharedGroupKey: Vec<u8>,
	pub sharedGroupKeyVersion: String,
	pub sharedGroupName: String,
	pub sentInvitation: IdTuple,
	pub sharedGroup: Id,
}

pub struct RecoverCode {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub recoverCodeEncUserGroupKey: Vec<u8>,
	pub userEncRecoverCode: Vec<u8>,
	pub userKeyVersion: String,
	pub verifier: Vec<u8>,
}

pub struct ReferralCodeGetIn {
	pub _format: String,
	pub referralCode: Id,
}

pub struct ReferralCodePostIn {
	pub _format: String,
}

pub struct ReferralCodePostOut {
	pub _format: String,
	pub referralCode: Id,
}

pub struct RegistrationCaptchaServiceData {
	pub _format: String,
	pub response: String,
	pub token: String,
}

pub struct RegistrationCaptchaServiceGetData {
	pub _format: String,
	pub businessUseSelected: bool,
	pub mailAddress: String,
	pub paidSubscriptionSelected: bool,
	pub signupToken: String,
	pub token: String,
}

pub struct RegistrationCaptchaServiceReturn {
	pub _format: String,
	pub challenge: Vec<u8>,
	pub token: String,
}

pub struct RegistrationReturn {
	pub _format: String,
	pub authToken: String,
}

pub struct RegistrationServiceData {
	pub _format: String,
	pub source: String,
	pub starterDomain: String,
	pub state: String,
}

pub struct RejectedSender {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub reason: String,
	pub recipientMailAddress: String,
	pub senderHostname: String,
	pub senderIp: String,
	pub senderMailAddress: String,
}

pub struct RejectedSendersRef {
	pub _id: Id,
	pub items: Id,
}

pub struct RepeatRule {
	pub _id: Id,
	pub endType: String,
	pub endValue: String,
	pub frequency: String,
	pub interval: String,
	pub timeZone: String,
	pub excludedDates: Vec<DateWrapper>,
}

pub struct ResetFactorsDeleteData {
	pub _format: String,
	pub authVerifier: String,
	pub mailAddress: String,
	pub recoverCodeVerifier: String,
}

pub struct ResetPasswordData {
	pub _format: String,
	pub kdfVersion: String,
	pub pwEncUserGroupKey: Vec<u8>,
	pub salt: Vec<u8>,
	pub verifier: Vec<u8>,
	pub user: Id,
}

pub struct RootInstance {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub reference: Id,
}

pub struct SaltData {
	pub _format: String,
	pub mailAddress: String,
}

pub struct SaltReturn {
	pub _format: String,
	pub kdfVersion: String,
	pub salt: Vec<u8>,
}

pub struct SecondFactor {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub name: String,
	pub otpSecret: Vec<u8>,
	#[serde(rename = "type")]
	pub r#type: String,
	pub u2f: Option<U2fRegisteredDevice>,
}

pub struct SecondFactorAuthAllowedReturn {
	pub _format: String,
	pub allowed: bool,
}

pub struct SecondFactorAuthData {
	pub _format: String,
	pub otpCode: String,
	#[serde(rename = "type")]
	pub r#type: String,
	pub session: Option<IdTuple>,
	pub u2f: Option<U2fResponseData>,
	pub webauthn: Option<WebauthnResponseData>,
}

pub struct SecondFactorAuthDeleteData {
	pub _format: String,
	pub session: IdTuple,
}

pub struct SecondFactorAuthGetData {
	pub _format: String,
	pub accessToken: String,
}

pub struct SecondFactorAuthGetReturn {
	pub _format: String,
	pub secondFactorPending: bool,
}

pub struct SecondFactorAuthentication {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub code: String,
	pub finished: bool,
	pub service: String,
	pub verifyCount: String,
}

pub struct SendRegistrationCodeData {
	pub _format: String,
	pub accountType: String,
	pub authToken: String,
	pub language: String,
	pub mobilePhoneNumber: String,
}

pub struct SendRegistrationCodeReturn {
	pub _format: String,
	pub authToken: String,
}

pub struct SentGroupInvitation {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub capability: String,
	pub inviteeMailAddress: String,
	pub receivedInvitation: Option<IdTuple>,
	pub sharedGroup: Id,
}

pub struct Session {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub accessKey: Vec<u8>,
	pub clientIdentifier: String,
	pub lastAccessTime: Date,
	pub loginIpAddress: String,
	pub loginTime: Date,
	pub state: String,
	pub challenges: Vec<Challenge>,
	pub user: Id,
}

pub struct SignOrderProcessingAgreementData {
	pub _format: String,
	pub customerAddress: String,
	pub version: String,
}

pub struct SseConnectData {
	pub _format: String,
	pub identifier: String,
	pub userIds: Vec<GeneratedIdWrapper>,
}

pub struct StringConfigValue {
	pub _id: Id,
	pub name: String,
	pub value: String,
}

pub struct StringWrapper {
	pub _id: Id,
	pub value: String,
}

pub struct SurveyData {
	pub _id: Id,
	pub category: String,
	pub details: String,
	pub reason: String,
	pub version: String,
}

pub struct SwitchAccountTypePostIn {
	pub _format: String,
	pub accountType: String,
	pub customer: Id,
	pub date: Date,
	pub plan: String,
	pub specialPriceUserSingle: String,
	pub referralCode: Option<Id>,
	pub surveyData: Option<SurveyData>,
}

pub struct SystemKeysReturn {
	pub _format: String,
	pub freeGroupKey: Vec<u8>,
	pub freeGroupKeyVersion: String,
	pub premiumGroupKey: Vec<u8>,
	pub premiumGroupKeyVersion: String,
	pub systemAdminPubEccKey: Vec<u8>,
	pub systemAdminPubKeyVersion: String,
	pub systemAdminPubKyberKey: Vec<u8>,
	pub systemAdminPubRsaKey: Vec<u8>,
	pub freeGroup: Option<Id>,
	pub premiumGroup: Option<Id>,
}

pub struct TakeOverDeletedAddressData {
	pub _format: String,
	pub authVerifier: String,
	pub mailAddress: String,
	pub recoverCodeVerifier: String,
	pub targetAccountMailAddress: String,
}

pub struct TypeInfo {
	pub _id: Id,
	pub application: String,
	pub typeId: String,
}

pub struct U2fChallenge {
	pub _id: Id,
	pub challenge: Vec<u8>,
	pub keys: Vec<U2fKey>,
}

pub struct U2fKey {
	pub _id: Id,
	pub appId: String,
	pub keyHandle: Vec<u8>,
	pub secondFactor: IdTuple,
}

pub struct U2fRegisteredDevice {
	pub _id: Id,
	pub appId: String,
	pub compromised: bool,
	pub counter: String,
	pub keyHandle: Vec<u8>,
	pub publicKey: Vec<u8>,
}

pub struct U2fResponseData {
	pub _id: Id,
	pub clientData: String,
	pub keyHandle: String,
	pub signatureData: String,
}

pub struct UpdatePermissionKeyData {
	pub _format: String,
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerKeyVersion: String,
	pub bucketPermission: IdTuple,
	pub permission: IdTuple,
}

pub struct UpdateSessionKeysPostIn {
	pub _format: String,
	pub ownerEncSessionKeys: Vec<InstanceSessionKey>,
}

pub struct UpgradePriceServiceData {
	pub _format: String,
	pub campaign: String,
	pub date: Date,
	pub referralCode: Option<Id>,
}

pub struct UpgradePriceServiceReturn {
	pub _format: String,
	pub bonusMonthsForYearlyPlan: String,
	pub business: bool,
	pub messageTextId: String,
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

pub struct User {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub accountType: String,
	pub enabled: bool,
	pub kdfVersion: String,
	pub requirePasswordUpdate: bool,
	pub salt: Vec<u8>,
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

pub struct UserAlarmInfo {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub alarmInfo: AlarmInfo,
}

pub struct UserAlarmInfoListType {
	pub _id: Id,
	pub alarms: Id,
}

pub struct UserAreaGroups {
	pub _id: Id,
	pub list: Id,
}

pub struct UserAuthentication {
	pub _id: Id,
	pub recoverCode: Option<Id>,
	pub secondFactors: Id,
	pub sessions: Id,
}

pub struct UserDataDelete {
	pub _format: String,
	pub date: Date,
	pub restore: bool,
	pub user: Id,
}

pub struct UserExternalAuthInfo {
	pub _id: Id,
	pub authUpdateCounter: String,
	pub autoAuthenticationId: Id,
	pub autoTransmitPassword: String,
	pub latestSaltHash: Vec<u8>,
	pub variableAuthInfo: Id,
}

pub struct UserGroupRoot {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub invitations: Id,
	pub keyRotations: Option<KeyRotationsRef>,
}

pub struct VariableExternalAuthInfo {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub authUpdateCounter: String,
	pub lastSentTimestamp: Date,
	pub loggedInIpAddressHash: Vec<u8>,
	pub loggedInTimestamp: Date,
	pub loggedInVerifier: Vec<u8>,
	pub sentCount: String,
}

pub struct VerifyRegistrationCodeData {
	pub _format: String,
	pub authToken: String,
	pub code: String,
}

pub struct Version {
	pub _id: Id,
	pub operation: String,
	pub timestamp: Date,
	pub version: Id,
	pub author: Id,
	pub authorGroupInfo: IdTuple,
}

pub struct VersionData {
	pub _format: String,
	pub application: String,
	pub id: Id,
	pub listId: Id,
	pub typeId: String,
}

pub struct VersionInfo {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub app: String,
	pub operation: String,
	pub referenceList: Id,
	pub timestamp: Date,
	#[serde(rename = "type")]
	pub r#type: String,
	pub versionData: Vec<u8>,
	pub author: Id,
	pub authorGroupInfo: IdTuple,
}

pub struct VersionReturn {
	pub _format: String,
	pub versions: Vec<Version>,
}

pub struct WebauthnResponseData {
	pub _id: Id,
	pub authenticatorData: Vec<u8>,
	pub clientData: Vec<u8>,
	pub keyHandle: Vec<u8>,
	pub signature: Vec<u8>,
}

pub struct WebsocketCounterData {
	pub _format: String,
	pub mailGroup: Id,
	pub counterValues: Vec<WebsocketCounterValue>,
}

pub struct WebsocketCounterValue {
	pub _id: Id,
	pub count: String,
	pub mailListId: Id,
}

pub struct WebsocketEntityData {
	pub _format: String,
	pub eventBatchId: Id,
	pub eventBatchOwner: Id,
	pub eventBatch: Vec<EntityUpdate>,
}

pub struct WebsocketLeaderStatus {
	pub _format: String,
	pub leaderStatus: bool,
}

pub struct WhitelabelChild {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub comment: String,
	pub createdDate: Date,
	pub deletedDate: Date,
	pub mailAddress: String,
	pub customer: Id,
}

pub struct WhitelabelChildrenRef {
	pub _id: Id,
	pub items: Id,
}

pub struct WhitelabelConfig {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub germanLanguageCode: String,
	pub imprintUrl: String,
	pub jsonTheme: String,
	pub metaTags: String,
	pub privacyStatementUrl: String,
	pub whitelabelCode: String,
	pub bootstrapCustomizations: Vec<BootstrapFeature>,
	pub certificateInfo: Option<CertificateInfo>,
	pub whitelabelRegistrationDomains: Vec<StringWrapper>,
}

pub struct WhitelabelParent {
	pub _id: Id,
	pub customer: Id,
	pub whitelabelChildInParent: IdTuple,
}