// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct KeyPair {
	#[serde(rename = "1")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2")]
	#[serde(with = "serde_bytes")]
	pub pubRsaKey: Option<Vec<u8>>,
	#[serde(rename = "3")]
	#[serde(with = "serde_bytes")]
	pub symEncPrivRsaKey: Option<Vec<u8>>,
	#[serde(rename = "2144")]
	#[serde(with = "serde_bytes")]
	pub pubEccKey: Option<Vec<u8>>,
	#[serde(rename = "2145")]
	#[serde(with = "serde_bytes")]
	pub symEncPrivEccKey: Option<Vec<u8>>,
	#[serde(rename = "2146")]
	#[serde(with = "serde_bytes")]
	pub pubKyberKey: Option<Vec<u8>>,
	#[serde(rename = "2147")]
	#[serde(with = "serde_bytes")]
	pub symEncPrivKyberKey: Option<Vec<u8>>,
}

impl Entity for KeyPair {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 0,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Group {
	#[serde(rename = "7")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "8")]
	pub _permissions: GeneratedId,
	#[serde(rename = "9")]
	pub _format: i64,
	#[serde(rename = "10")]
	pub r#type: i64,
	#[serde(rename = "11")]
	#[serde(with = "serde_bytes")]
	pub adminGroupEncGKey: Option<Vec<u8>>,
	#[serde(rename = "12")]
	pub enabled: bool,
	#[serde(rename = "981")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "982")]
	pub external: bool,
	#[serde(rename = "2270")]
	pub adminGroupKeyVersion: Option<i64>,
	#[serde(rename = "2271")]
	pub groupKeyVersion: i64,
	#[serde(rename = "13")]
	pub currentKeys: Option<KeyPair>,
	#[serde(rename = "224")]
	pub admin: Option<GeneratedId>,
	#[serde(rename = "225")]
	pub user: Option<GeneratedId>,
	#[serde(rename = "226")]
	pub customer: Option<GeneratedId>,
	#[serde(rename = "227")]
	pub groupInfo: IdTupleGenerated,
	#[serde(rename = "228")]
	pub invitations: GeneratedId,
	#[serde(rename = "229")]
	pub members: GeneratedId,
	#[serde(rename = "1881")]
	pub archives: Vec<ArchiveType>,
	#[serde(rename = "2092")]
	pub storageCounter: Option<GeneratedId>,
	#[serde(rename = "2273")]
	pub formerGroupKeys: Option<GroupKeysRef>,
	#[serde(rename = "2475")]
	pub pubAdminGroupEncGKey: Option<PubEncKeyData>,
}

impl Entity for Group {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 5,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupInfo {
	#[serde(rename = "16")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "17")]
	pub _permissions: GeneratedId,
	#[serde(rename = "18")]
	pub _format: i64,
	#[serde(rename = "19")]
	#[serde(with = "serde_bytes")]
	pub _listEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "21")]
	pub name: String,
	#[serde(rename = "22")]
	pub mailAddress: Option<String>,
	#[serde(rename = "23")]
	pub created: DateTime,
	#[serde(rename = "24")]
	pub deleted: Option<DateTime>,
	#[serde(rename = "983")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "984")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1286")]
	pub groupType: Option<i64>,
	#[serde(rename = "2225")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "20")]
	pub group: GeneratedId,
	#[serde(rename = "687")]
	pub mailAddressAliases: Vec<MailAddressAlias>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for GroupInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 14,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupMembership {
	#[serde(rename = "26")]
	pub _id: Option<CustomId>,
	#[serde(rename = "27")]
	#[serde(with = "serde_bytes")]
	pub symEncGKey: Vec<u8>,
	#[serde(rename = "28")]
	pub admin: bool,
	#[serde(rename = "1030")]
	pub groupType: Option<i64>,
	#[serde(rename = "1626")]
	pub capability: Option<i64>,
	#[serde(rename = "2246")]
	pub groupKeyVersion: i64,
	#[serde(rename = "2247")]
	pub symKeyVersion: i64,
	#[serde(rename = "29")]
	pub group: GeneratedId,
	#[serde(rename = "30")]
	pub groupInfo: IdTupleGenerated,
	#[serde(rename = "230")]
	pub groupMember: IdTupleGenerated,
}

impl Entity for GroupMembership {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 25,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Customer {
	#[serde(rename = "33")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "34")]
	pub _permissions: GeneratedId,
	#[serde(rename = "35")]
	pub _format: i64,
	#[serde(rename = "36")]
	pub r#type: i64,
	#[serde(rename = "926")]
	pub approvalStatus: i64,
	#[serde(rename = "991")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1347")]
	pub orderProcessingAgreementNeeded: bool,
	#[serde(rename = "1754")]
	pub businessUse: bool,
	#[serde(rename = "37")]
	pub adminGroup: GeneratedId,
	#[serde(rename = "38")]
	pub customerGroup: GeneratedId,
	#[serde(rename = "39")]
	pub adminGroups: GeneratedId,
	#[serde(rename = "40")]
	pub customerGroups: GeneratedId,
	#[serde(rename = "41")]
	pub userGroups: GeneratedId,
	#[serde(rename = "42")]
	pub teamGroups: GeneratedId,
	#[serde(rename = "160")]
	pub customerInfo: IdTupleGenerated,
	#[serde(rename = "662")]
	pub properties: Option<GeneratedId>,
	#[serde(rename = "960")]
	pub serverProperties: Option<GeneratedId>,
	#[serde(rename = "992")]
	pub userAreaGroups: Option<UserAreaGroups>,
	#[serde(rename = "1161")]
	pub auditLog: Option<AuditLogRef>,
	#[serde(rename = "1256")]
	pub customizations: Vec<Feature>,
	#[serde(rename = "1276")]
	pub whitelabelParent: Option<WhitelabelParent>,
	#[serde(rename = "1277")]
	pub whitelabelChildren: Option<WhitelabelChildrenRef>,
	#[serde(rename = "1348")]
	pub orderProcessingAgreement: Option<IdTupleGenerated>,
	#[serde(rename = "1750")]
	pub rejectedSenders: Option<RejectedSendersRef>,
	#[serde(rename = "2061")]
	pub referralCode: Option<GeneratedId>,
}

impl Entity for Customer {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 31,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AuthenticatedDevice {
	#[serde(rename = "44")]
	pub _id: Option<CustomId>,
	#[serde(rename = "45")]
	pub authType: i64,
	#[serde(rename = "46")]
	pub deviceToken: String,
	#[serde(rename = "47")]
	#[serde(with = "serde_bytes")]
	pub deviceKey: Vec<u8>,
}

impl Entity for AuthenticatedDevice {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 43,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Login {
	#[serde(rename = "50")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "51")]
	pub _permissions: GeneratedId,
	#[serde(rename = "52")]
	pub _format: i64,
	#[serde(rename = "53")]
	pub time: DateTime,
	#[serde(rename = "993")]
	pub _ownerGroup: Option<GeneratedId>,
}

impl Entity for Login {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 48,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SecondFactorAuthentication {
	#[serde(rename = "56")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "57")]
	pub _permissions: GeneratedId,
	#[serde(rename = "58")]
	pub _format: i64,
	#[serde(rename = "59")]
	pub code: String,
	#[serde(rename = "60")]
	pub verifyCount: i64,
	#[serde(rename = "61")]
	pub finished: bool,
	#[serde(rename = "62")]
	pub service: String,
	#[serde(rename = "994")]
	pub _ownerGroup: Option<GeneratedId>,
}

impl Entity for SecondFactorAuthentication {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 54,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct VariableExternalAuthInfo {
	#[serde(rename = "68")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "69")]
	pub _permissions: GeneratedId,
	#[serde(rename = "70")]
	pub _format: i64,
	#[serde(rename = "71")]
	#[serde(with = "serde_bytes")]
	pub loggedInVerifier: Option<Vec<u8>>,
	#[serde(rename = "72")]
	pub loggedInTimestamp: Option<DateTime>,
	#[serde(rename = "73")]
	#[serde(with = "serde_bytes")]
	pub loggedInIpAddressHash: Option<Vec<u8>>,
	#[serde(rename = "74")]
	pub sentCount: i64,
	#[serde(rename = "75")]
	pub lastSentTimestamp: DateTime,
	#[serde(rename = "76")]
	pub authUpdateCounter: i64,
	#[serde(rename = "995")]
	pub _ownerGroup: Option<GeneratedId>,
}

impl Entity for VariableExternalAuthInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 66,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserExternalAuthInfo {
	#[serde(rename = "78")]
	pub _id: Option<CustomId>,
	#[serde(rename = "79")]
	pub autoAuthenticationId: GeneratedId,
	#[serde(rename = "80")]
	#[serde(with = "serde_bytes")]
	pub latestSaltHash: Option<Vec<u8>>,
	#[serde(rename = "81")]
	pub autoTransmitPassword: Option<String>,
	#[serde(rename = "82")]
	pub authUpdateCounter: i64,
	#[serde(rename = "83")]
	pub variableAuthInfo: GeneratedId,
}

impl Entity for UserExternalAuthInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 77,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct User {
	#[serde(rename = "86")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "87")]
	pub _permissions: GeneratedId,
	#[serde(rename = "88")]
	pub _format: i64,
	#[serde(rename = "90")]
	#[serde(with = "serde_bytes")]
	pub salt: Option<Vec<u8>>,
	#[serde(rename = "91")]
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
	#[serde(rename = "92")]
	pub accountType: i64,
	#[serde(rename = "93")]
	pub enabled: bool,
	#[serde(rename = "996")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1117")]
	pub requirePasswordUpdate: bool,
	#[serde(rename = "2132")]
	pub kdfVersion: i64,
	#[serde(rename = "95")]
	pub userGroup: GroupMembership,
	#[serde(rename = "96")]
	pub memberships: Vec<GroupMembership>,
	#[serde(rename = "97")]
	pub authenticatedDevices: Vec<AuthenticatedDevice>,
	#[serde(rename = "98")]
	pub externalAuthInfo: Option<UserExternalAuthInfo>,
	#[serde(rename = "99")]
	pub customer: Option<GeneratedId>,
	#[serde(rename = "100")]
	pub successfulLogins: GeneratedId,
	#[serde(rename = "101")]
	pub failedLogins: GeneratedId,
	#[serde(rename = "102")]
	pub secondFactorAuthentications: GeneratedId,
	#[serde(rename = "638")]
	pub pushIdentifierList: Option<PushIdentifierList>,
	#[serde(rename = "1210")]
	pub auth: Option<UserAuthentication>,
	#[serde(rename = "1552")]
	pub alarmInfoList: Option<UserAlarmInfoListType>,
}

impl Entity for User {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 84,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ExternalUserReference {
	#[serde(rename = "105")]
	pub _id: Option<IdTupleCustom>,
	#[serde(rename = "106")]
	pub _permissions: GeneratedId,
	#[serde(rename = "107")]
	pub _format: i64,
	#[serde(rename = "997")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "108")]
	pub user: GeneratedId,
	#[serde(rename = "109")]
	pub userGroup: GeneratedId,
}

impl Entity for ExternalUserReference {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 103,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupRoot {
	#[serde(rename = "112")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "113")]
	pub _permissions: GeneratedId,
	#[serde(rename = "114")]
	pub _format: i64,
	#[serde(rename = "998")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "116")]
	pub externalGroupInfos: GeneratedId,
	#[serde(rename = "117")]
	pub externalUserReferences: GeneratedId,
	#[serde(rename = "999")]
	pub externalUserAreaGroupInfos: Option<UserAreaGroups>,
}

impl Entity for GroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 110,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BucketPermission {
	#[serde(rename = "120")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "121")]
	pub _permissions: GeneratedId,
	#[serde(rename = "122")]
	pub _format: i64,
	#[serde(rename = "123")]
	pub r#type: i64,
	#[serde(rename = "124")]
	#[serde(with = "serde_bytes")]
	pub symEncBucketKey: Option<Vec<u8>>,
	#[serde(rename = "125")]
	#[serde(with = "serde_bytes")]
	pub pubEncBucketKey: Option<Vec<u8>>,
	#[serde(rename = "126")]
	pub pubKeyVersion: Option<i64>,
	#[serde(rename = "1000")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1001")]
	#[serde(with = "serde_bytes")]
	pub ownerEncBucketKey: Option<Vec<u8>>,
	#[serde(rename = "2157")]
	pub protocolVersion: i64,
	#[serde(rename = "2248")]
	pub ownerKeyVersion: Option<i64>,
	#[serde(rename = "2249")]
	pub symKeyVersion: Option<i64>,
	#[serde(rename = "2250")]
	pub senderKeyVersion: Option<i64>,
	#[serde(rename = "128")]
	pub group: GeneratedId,
}

impl Entity for BucketPermission {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 118,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Bucket {
	#[serde(rename = "130")]
	pub _id: Option<CustomId>,
	#[serde(rename = "131")]
	pub bucketPermissions: GeneratedId,
}

impl Entity for Bucket {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 129,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Permission {
	#[serde(rename = "134")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "135")]
	pub _permissions: GeneratedId,
	#[serde(rename = "136")]
	pub _format: i64,
	#[serde(rename = "137")]
	pub r#type: i64,
	#[serde(rename = "138")]
	#[serde(with = "serde_bytes")]
	pub symEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "139")]
	#[serde(with = "serde_bytes")]
	pub bucketEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "140")]
	pub ops: Option<String>,
	#[serde(rename = "1002")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1003")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1523")]
	pub listElementTypeId: Option<i64>,
	#[serde(rename = "1524")]
	pub listElementApplication: Option<String>,
	#[serde(rename = "2242")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "2251")]
	pub symKeyVersion: Option<i64>,
	#[serde(rename = "141")]
	pub group: Option<GeneratedId>,
	#[serde(rename = "142")]
	pub bucket: Option<Bucket>,
}

impl Entity for Permission {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 132,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AccountingInfo {
	#[serde(rename = "145")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "146")]
	pub _permissions: GeneratedId,
	#[serde(rename = "147")]
	pub _format: i64,
	#[serde(rename = "592")]
	pub lastInvoiceTimestamp: Option<DateTime>,
	#[serde(rename = "593")]
	pub lastInvoiceNbrOfSentSms: i64,
	#[serde(rename = "762")]
	pub invoiceName: String,
	#[serde(rename = "763")]
	pub invoiceAddress: String,
	#[serde(rename = "764")]
	pub invoiceCountry: Option<String>,
	#[serde(rename = "765")]
	pub secondCountryInfo: i64,
	#[serde(rename = "766")]
	pub invoiceVatIdNo: String,
	#[serde(rename = "767")]
	pub paymentMethod: Option<i64>,
	#[serde(rename = "768")]
	pub paymentMethodInfo: Option<String>,
	#[serde(rename = "769")]
	pub paymentInterval: i64,
	#[serde(rename = "770")]
	pub paymentProviderCustomerId: Option<String>,
	#[serde(rename = "1009")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1010")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1060")]
	pub paymentAccountIdentifier: Option<String>,
	#[serde(rename = "1312")]
	pub paypalBillingAgreement: Option<String>,
	#[serde(rename = "1499")]
	pub _modified: DateTime,
	#[serde(rename = "2223")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "771")]
	pub invoiceInfo: Option<GeneratedId>,
	#[serde(rename = "2424")]
	pub appStoreSubscription: Option<IdTupleGenerated>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for AccountingInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 143,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomerInfo {
	#[serde(rename = "150")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "151")]
	pub _permissions: GeneratedId,
	#[serde(rename = "152")]
	pub _format: i64,
	#[serde(rename = "153")]
	pub company: Option<String>,
	#[serde(rename = "154")]
	pub domain: String,
	#[serde(rename = "155")]
	pub creationTime: DateTime,
	#[serde(rename = "156")]
	pub testEndTime: Option<DateTime>,
	#[serde(rename = "157")]
	pub activationTime: Option<DateTime>,
	#[serde(rename = "597")]
	pub registrationMailAddress: String,
	#[serde(rename = "639")]
	pub deletionTime: Option<DateTime>,
	#[serde(rename = "640")]
	pub deletionReason: Option<String>,
	#[serde(rename = "650")]
	pub promotionStorageCapacity: i64,
	#[serde(rename = "725")]
	pub source: String,
	#[serde(rename = "976")]
	pub promotionEmailAliases: i64,
	#[serde(rename = "977")]
	pub usedSharedEmailAliases: i64,
	#[serde(rename = "1011")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1067")]
	pub includedEmailAliases: i64,
	#[serde(rename = "1068")]
	pub includedStorageCapacity: i64,
	#[serde(rename = "1381")]
	pub erased: bool,
	#[serde(rename = "2093")]
	pub perUserStorageCapacity: i64,
	#[serde(rename = "2094")]
	pub perUserAliasCount: i64,
	#[serde(rename = "2098")]
	pub plan: i64,
	#[serde(rename = "158")]
	pub customer: GeneratedId,
	#[serde(rename = "159")]
	pub accountingInfo: GeneratedId,
	#[serde(rename = "726")]
	pub domainInfos: Vec<DomainInfo>,
	#[serde(rename = "727")]
	pub bookings: Option<BookingsRef>,
	#[serde(rename = "1076")]
	pub takeoverCustomer: Option<GeneratedId>,
	#[serde(rename = "1794")]
	pub giftCards: Option<GiftCardsRef>,
	#[serde(rename = "2014")]
	pub terminationRequest: Option<IdTupleGenerated>,
	#[serde(rename = "2072")]
	pub referredBy: Option<GeneratedId>,
	#[serde(rename = "2114")]
	pub customPlan: Option<PlanConfiguration>,
	#[serde(rename = "2197")]
	pub supportInfo: Option<GeneratedId>,
}

impl Entity for CustomerInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 148,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SentGroupInvitation {
	#[serde(rename = "197")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "198")]
	pub _permissions: GeneratedId,
	#[serde(rename = "199")]
	pub _format: i64,
	#[serde(rename = "1018")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1600")]
	pub inviteeMailAddress: String,
	#[serde(rename = "1601")]
	pub capability: i64,
	#[serde(rename = "203")]
	pub sharedGroup: GeneratedId,
	#[serde(rename = "1617")]
	pub receivedInvitation: Option<IdTupleGenerated>,
}

impl Entity for SentGroupInvitation {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 195,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailAddressToGroup {
	#[serde(rename = "206")]
	pub _id: Option<CustomId>,
	#[serde(rename = "207")]
	pub _permissions: GeneratedId,
	#[serde(rename = "208")]
	pub _format: i64,
	#[serde(rename = "1019")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "209")]
	pub internalGroup: Option<GeneratedId>,
}

impl Entity for MailAddressToGroup {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 204,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupMember {
	#[serde(rename = "218")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "219")]
	pub _permissions: GeneratedId,
	#[serde(rename = "220")]
	pub _format: i64,
	#[serde(rename = "1021")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1625")]
	pub capability: Option<i64>,
	#[serde(rename = "221")]
	pub userGroupInfo: IdTupleGenerated,
	#[serde(rename = "222")]
	pub group: GeneratedId,
	#[serde(rename = "223")]
	pub user: GeneratedId,
}

impl Entity for GroupMember {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 216,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RootInstance {
	#[serde(rename = "233")]
	pub _id: Option<IdTupleCustom>,
	#[serde(rename = "234")]
	pub _permissions: GeneratedId,
	#[serde(rename = "235")]
	pub _format: i64,
	#[serde(rename = "236")]
	pub reference: GeneratedId,
	#[serde(rename = "1022")]
	pub _ownerGroup: Option<GeneratedId>,
}

impl Entity for RootInstance {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 231,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct VersionInfo {
	#[serde(rename = "239")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "240")]
	pub _permissions: GeneratedId,
	#[serde(rename = "241")]
	pub _format: i64,
	#[serde(rename = "242")]
	pub app: String,
	#[serde(rename = "243")]
	pub r#type: i64,
	#[serde(rename = "244")]
	pub referenceList: Option<GeneratedId>,
	#[serde(rename = "245")]
	pub timestamp: DateTime,
	#[serde(rename = "246")]
	pub operation: String,
	#[serde(rename = "247")]
	#[serde(with = "serde_bytes")]
	pub versionData: Option<Vec<u8>>,
	#[serde(rename = "1023")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "248")]
	pub author: GeneratedId,
	#[serde(rename = "249")]
	pub authorGroupInfo: IdTupleGenerated,
}

impl Entity for VersionInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 237,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SystemKeysReturn {
	#[serde(rename = "302")]
	pub _format: i64,
	#[serde(rename = "303")]
	#[serde(with = "serde_bytes")]
	pub systemAdminPubRsaKey: Option<Vec<u8>>,
	#[serde(rename = "304")]
	pub systemAdminPubKeyVersion: i64,
	#[serde(rename = "305")]
	#[serde(with = "serde_bytes")]
	pub freeGroupKey: Vec<u8>,
	#[serde(rename = "306")]
	#[serde(with = "serde_bytes")]
	pub premiumGroupKey: Vec<u8>,
	#[serde(rename = "2155")]
	#[serde(with = "serde_bytes")]
	pub systemAdminPubEccKey: Option<Vec<u8>>,
	#[serde(rename = "2156")]
	#[serde(with = "serde_bytes")]
	pub systemAdminPubKyberKey: Option<Vec<u8>>,
	#[serde(rename = "2278")]
	pub freeGroupKeyVersion: i64,
	#[serde(rename = "2279")]
	pub premiumGroupKeyVersion: i64,
	#[serde(rename = "880")]
	pub freeGroup: Option<GeneratedId>,
	#[serde(rename = "881")]
	pub premiumGroup: Option<GeneratedId>,
}

impl Entity for SystemKeysReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 301,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RegistrationServiceData {
	#[serde(rename = "317")]
	pub _format: i64,
	#[serde(rename = "325")]
	pub state: i64,
	#[serde(rename = "874")]
	pub source: Option<String>,
}

impl Entity for RegistrationServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 316,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RegistrationReturn {
	#[serde(rename = "327")]
	pub _format: i64,
	#[serde(rename = "328")]
	pub authToken: String,
}

impl Entity for RegistrationReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 326,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SendRegistrationCodeData {
	#[serde(rename = "342")]
	pub _format: i64,
	#[serde(rename = "343")]
	pub authToken: String,
	#[serde(rename = "344")]
	pub language: String,
	#[serde(rename = "345")]
	pub accountType: i64,
	#[serde(rename = "346")]
	pub mobilePhoneNumber: String,
}

impl Entity for SendRegistrationCodeData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 341,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SendRegistrationCodeReturn {
	#[serde(rename = "348")]
	pub _format: i64,
	#[serde(rename = "349")]
	pub authToken: String,
}

impl Entity for SendRegistrationCodeReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 347,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct VerifyRegistrationCodeData {
	#[serde(rename = "352")]
	pub _format: i64,
	#[serde(rename = "353")]
	pub authToken: String,
	#[serde(rename = "354")]
	pub code: String,
}

impl Entity for VerifyRegistrationCodeData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 351,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserDataDelete {
	#[serde(rename = "405")]
	pub _format: i64,
	#[serde(rename = "406")]
	pub restore: bool,
	#[serde(rename = "879")]
	pub date: Option<DateTime>,
	#[serde(rename = "407")]
	pub user: GeneratedId,
}

impl Entity for UserDataDelete {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 404,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PublicKeyGetIn {
	#[serde(rename = "410")]
	pub _format: i64,
	#[serde(rename = "411")]
	pub identifier: String,
	#[serde(rename = "2244")]
	pub version: Option<i64>,
	#[serde(rename = "2468")]
	pub identifierType: i64,
}

impl Entity for PublicKeyGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 409,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PublicKeyGetOut {
	#[serde(rename = "413")]
	pub _format: i64,
	#[serde(rename = "414")]
	#[serde(with = "serde_bytes")]
	pub pubRsaKey: Option<Vec<u8>>,
	#[serde(rename = "415")]
	pub pubKeyVersion: i64,
	#[serde(rename = "2148")]
	#[serde(with = "serde_bytes")]
	pub pubEccKey: Option<Vec<u8>>,
	#[serde(rename = "2149")]
	#[serde(with = "serde_bytes")]
	pub pubKyberKey: Option<Vec<u8>>,
}

impl Entity for PublicKeyGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 412,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SaltData {
	#[serde(rename = "418")]
	pub _format: i64,
	#[serde(rename = "419")]
	pub mailAddress: String,
}

impl Entity for SaltData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 417,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SaltReturn {
	#[serde(rename = "421")]
	pub _format: i64,
	#[serde(rename = "422")]
	#[serde(with = "serde_bytes")]
	pub salt: Vec<u8>,
	#[serde(rename = "2133")]
	pub kdfVersion: i64,
}

impl Entity for SaltReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 420,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AutoLoginDataGet {
	#[serde(rename = "432")]
	pub _format: i64,
	#[serde(rename = "434")]
	pub deviceToken: String,
	#[serde(rename = "433")]
	pub userId: GeneratedId,
}

impl Entity for AutoLoginDataGet {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 431,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AutoLoginDataDelete {
	#[serde(rename = "436")]
	pub _format: i64,
	#[serde(rename = "437")]
	pub deviceToken: String,
}

impl Entity for AutoLoginDataDelete {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 435,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AutoLoginDataReturn {
	#[serde(rename = "439")]
	pub _format: i64,
	#[serde(rename = "440")]
	#[serde(with = "serde_bytes")]
	pub deviceKey: Vec<u8>,
}

impl Entity for AutoLoginDataReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 438,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AutoLoginPostReturn {
	#[serde(rename = "442")]
	pub _format: i64,
	#[serde(rename = "443")]
	pub deviceToken: String,
}

impl Entity for AutoLoginPostReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 441,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UpdatePermissionKeyData {
	#[serde(rename = "446")]
	pub _format: i64,
	#[serde(rename = "1031")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "2245")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "450")]
	pub permission: IdTupleGenerated,
	#[serde(rename = "451")]
	pub bucketPermission: IdTupleGenerated,
}

impl Entity for UpdatePermissionKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 445,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Authentication {
	#[serde(rename = "454")]
	pub _id: Option<CustomId>,
	#[serde(rename = "456")]
	pub authVerifier: Option<String>,
	#[serde(rename = "968")]
	pub externalAuthToken: Option<String>,
	#[serde(rename = "1239")]
	pub accessToken: Option<String>,
	#[serde(rename = "455")]
	pub userId: GeneratedId,
}

impl Entity for Authentication {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 453,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Chat {
	#[serde(rename = "458")]
	pub _id: Option<CustomId>,
	#[serde(rename = "459")]
	pub sender: GeneratedId,
	#[serde(rename = "460")]
	pub recipient: GeneratedId,
	#[serde(rename = "461")]
	pub text: String,
}

impl Entity for Chat {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 457,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EntityUpdate {
	#[serde(rename = "463")]
	pub _id: Option<CustomId>,
	#[serde(rename = "464")]
	pub application: String,
	#[serde(rename = "465")]
	pub r#type: String,
	#[serde(rename = "466")]
	pub instanceListId: String,
	#[serde(rename = "467")]
	pub instanceId: String,
	#[serde(rename = "624")]
	pub operation: i64,
	#[serde(rename = "2554")]
	pub typeId: i64,
}

impl Entity for EntityUpdate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 462,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SysException {
	#[serde(rename = "469")]
	pub _id: Option<CustomId>,
	#[serde(rename = "470")]
	pub r#type: String,
	#[serde(rename = "471")]
	pub msg: String,
}

impl Entity for SysException {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 468,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Version {
	#[serde(rename = "481")]
	pub _id: Option<CustomId>,
	#[serde(rename = "482")]
	pub version: GeneratedId,
	#[serde(rename = "483")]
	pub timestamp: DateTime,
	#[serde(rename = "484")]
	pub operation: String,
	#[serde(rename = "485")]
	pub author: GeneratedId,
	#[serde(rename = "486")]
	pub authorGroupInfo: IdTupleGenerated,
}

impl Entity for Version {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 480,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct VersionData {
	#[serde(rename = "488")]
	pub _format: i64,
	#[serde(rename = "489")]
	pub application: String,
	#[serde(rename = "490")]
	pub typeId: i64,
	#[serde(rename = "491")]
	pub id: GeneratedId,
	#[serde(rename = "492")]
	pub listId: Option<GeneratedId>,
}

impl Entity for VersionData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 487,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct VersionReturn {
	#[serde(rename = "494")]
	pub _format: i64,
	#[serde(rename = "495")]
	pub versions: Vec<Version>,
}

impl Entity for VersionReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 493,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MembershipAddData {
	#[serde(rename = "506")]
	pub _format: i64,
	#[serde(rename = "507")]
	#[serde(with = "serde_bytes")]
	pub symEncGKey: Vec<u8>,
	#[serde(rename = "2276")]
	pub symKeyVersion: i64,
	#[serde(rename = "2277")]
	pub groupKeyVersion: i64,
	#[serde(rename = "508")]
	pub user: GeneratedId,
	#[serde(rename = "509")]
	pub group: GeneratedId,
}

impl Entity for MembershipAddData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 505,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ChangePasswordPostIn {
	#[serde(rename = "535")]
	pub _format: i64,
	#[serde(rename = "536")]
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
	#[serde(rename = "537")]
	#[serde(with = "serde_bytes")]
	pub salt: Vec<u8>,
	#[serde(rename = "538")]
	#[serde(with = "serde_bytes")]
	pub pwEncUserGroupKey: Vec<u8>,
	#[serde(rename = "539")]
	pub code: Option<String>,
	#[serde(rename = "1240")]
	#[serde(with = "serde_bytes")]
	pub oldVerifier: Option<Vec<u8>>,
	#[serde(rename = "1418")]
	#[serde(with = "serde_bytes")]
	pub recoverCodeVerifier: Option<Vec<u8>>,
	#[serde(rename = "2134")]
	pub kdfVersion: i64,
	#[serde(rename = "2408")]
	pub userGroupKeyVersion: i64,
}

impl Entity for ChangePasswordPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 534,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SecondFactorAuthData {
	#[serde(rename = "542")]
	pub _format: i64,
	#[serde(rename = "1230")]
	pub r#type: Option<i64>,
	#[serde(rename = "1243")]
	pub otpCode: Option<i64>,
	#[serde(rename = "1231")]
	pub u2f: Option<U2fResponseData>,
	#[serde(rename = "1232")]
	pub session: Option<IdTupleCustom>,
	#[serde(rename = "1905")]
	pub webauthn: Option<WebauthnResponseData>,
}

impl Entity for SecondFactorAuthData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 541,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SecondFactorAuthAllowedReturn {
	#[serde(rename = "547")]
	pub _format: i64,
	#[serde(rename = "548")]
	pub allowed: bool,
}

impl Entity for SecondFactorAuthAllowedReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 546,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ResetPasswordPostIn {
	#[serde(rename = "585")]
	pub _format: i64,
	#[serde(rename = "586")]
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
	#[serde(rename = "587")]
	#[serde(with = "serde_bytes")]
	pub salt: Vec<u8>,
	#[serde(rename = "588")]
	#[serde(with = "serde_bytes")]
	pub pwEncUserGroupKey: Vec<u8>,
	#[serde(rename = "2135")]
	pub kdfVersion: i64,
	#[serde(rename = "2409")]
	pub userGroupKeyVersion: i64,
	#[serde(rename = "589")]
	pub user: GeneratedId,
}

impl Entity for ResetPasswordPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 584,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DomainMailAddressAvailabilityData {
	#[serde(rename = "600")]
	pub _format: i64,
	#[serde(rename = "601")]
	pub mailAddress: String,
}

impl Entity for DomainMailAddressAvailabilityData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 599,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DomainMailAddressAvailabilityReturn {
	#[serde(rename = "603")]
	pub _format: i64,
	#[serde(rename = "604")]
	pub available: bool,
}

impl Entity for DomainMailAddressAvailabilityReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 602,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PushIdentifier {
	#[serde(rename = "627")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "628")]
	pub _permissions: GeneratedId,
	#[serde(rename = "629")]
	pub _format: i64,
	#[serde(rename = "630")]
	pub _owner: GeneratedId,
	#[serde(rename = "631")]
	pub _area: i64,
	#[serde(rename = "632")]
	pub pushServiceType: i64,
	#[serde(rename = "633")]
	pub identifier: String,
	#[serde(rename = "634")]
	pub language: String,
	#[serde(rename = "1029")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1248")]
	pub lastNotificationDate: Option<DateTime>,
	#[serde(rename = "1476")]
	pub disabled: bool,
	#[serde(rename = "1497")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1498")]
	pub displayName: String,
	#[serde(rename = "1704")]
	pub lastUsageTime: DateTime,
	#[serde(rename = "2241")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "2426")]
	pub app: i64,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for PushIdentifier {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 625,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PushIdentifierList {
	#[serde(rename = "636")]
	pub _id: Option<CustomId>,
	#[serde(rename = "637")]
	pub list: GeneratedId,
}

impl Entity for PushIdentifierList {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 635,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DeleteCustomerData {
	#[serde(rename = "642")]
	pub _format: i64,
	#[serde(rename = "643")]
	pub undelete: bool,
	#[serde(rename = "644")]
	pub reason: Option<String>,
	#[serde(rename = "1077")]
	pub takeoverMailAddress: Option<String>,
	#[serde(rename = "1325")]
	#[serde(with = "serde_bytes")]
	pub authVerifier: Option<Vec<u8>>,
	#[serde(rename = "645")]
	pub customer: GeneratedId,
	#[serde(rename = "2312")]
	pub surveyData: Option<SurveyData>,
}

impl Entity for DeleteCustomerData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 641,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomerProperties {
	#[serde(rename = "658")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "659")]
	pub _permissions: GeneratedId,
	#[serde(rename = "660")]
	pub _format: i64,
	#[serde(rename = "661")]
	pub externalUserWelcomeMessage: String,
	#[serde(rename = "975")]
	pub lastUpgradeReminder: Option<DateTime>,
	#[serde(rename = "985")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "2025")]
	pub usageDataOptedOut: bool,
	#[serde(rename = "922")]
	pub smallLogo: Option<File>,
	#[serde(rename = "923")]
	pub bigLogo: Option<File>,
	#[serde(rename = "1522")]
	pub notificationMailTemplates: Vec<NotificationMailTemplate>,
}

impl Entity for CustomerProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 656,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ExternalPropertiesReturn {
	#[serde(rename = "664")]
	pub _format: i64,
	#[serde(rename = "665")]
	pub message: String,
	#[serde(rename = "666")]
	pub accountType: i64,
	#[serde(rename = "924")]
	pub smallLogo: Option<File>,
	#[serde(rename = "925")]
	pub bigLogo: Option<File>,
}

impl Entity for ExternalPropertiesReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 663,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RegistrationCaptchaServiceData {
	#[serde(rename = "675")]
	pub _format: i64,
	#[serde(rename = "676")]
	pub token: String,
	#[serde(rename = "677")]
	pub response: String,
}

impl Entity for RegistrationCaptchaServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 674,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RegistrationCaptchaServiceReturn {
	#[serde(rename = "679")]
	pub _format: i64,
	#[serde(rename = "680")]
	pub token: String,
	#[serde(rename = "681")]
	#[serde(with = "serde_bytes")]
	pub challenge: Option<Vec<u8>>,
}

impl Entity for RegistrationCaptchaServiceReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 678,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailAddressAlias {
	#[serde(rename = "685")]
	pub _id: Option<CustomId>,
	#[serde(rename = "686")]
	pub mailAddress: String,
	#[serde(rename = "784")]
	pub enabled: bool,
}

impl Entity for MailAddressAlias {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 684,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailAddressAliasServiceData {
	#[serde(rename = "689")]
	pub _format: i64,
	#[serde(rename = "690")]
	pub mailAddress: String,
	#[serde(rename = "691")]
	pub group: GeneratedId,
}

impl Entity for MailAddressAliasServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 688,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailAddressAliasServiceReturn {
	#[serde(rename = "693")]
	pub _format: i64,
	#[serde(rename = "694")]
	pub nbrOfFreeAliases: i64,
	#[serde(rename = "1069")]
	pub totalAliases: i64,
	#[serde(rename = "1070")]
	pub usedAliases: i64,
	#[serde(rename = "1071")]
	pub enabledAliases: i64,
}

impl Entity for MailAddressAliasServiceReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 692,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DomainInfo {
	#[serde(rename = "697")]
	pub _id: Option<CustomId>,
	#[serde(rename = "698")]
	pub domain: String,
	#[serde(rename = "1044")]
	pub catchAllMailGroup: Option<GeneratedId>,
	#[serde(rename = "1136")]
	pub whitelabelConfig: Option<GeneratedId>,
}

impl Entity for DomainInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 696,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BookingItem {
	#[serde(rename = "701")]
	pub _id: Option<CustomId>,
	#[serde(rename = "702")]
	pub featureType: i64,
	#[serde(rename = "703")]
	pub currentCount: i64,
	#[serde(rename = "704")]
	pub maxCount: i64,
	#[serde(rename = "705")]
	pub totalInvoicedCount: i64,
	#[serde(rename = "706")]
	pub currentInvoicedCount: i64,
	#[serde(rename = "707")]
	pub price: i64,
	#[serde(rename = "708")]
	pub priceType: i64,
}

impl Entity for BookingItem {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 700,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Booking {
	#[serde(rename = "711")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "712")]
	pub _permissions: GeneratedId,
	#[serde(rename = "713")]
	pub _format: i64,
	#[serde(rename = "714")]
	pub _owner: GeneratedId,
	#[serde(rename = "715")]
	pub _area: i64,
	#[serde(rename = "716")]
	pub createDate: DateTime,
	#[serde(rename = "717")]
	pub paymentMonths: i64,
	#[serde(rename = "718")]
	pub endDate: Option<DateTime>,
	#[serde(rename = "719")]
	pub paymentInterval: i64,
	#[serde(rename = "1004")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "2103")]
	pub bonusMonth: i64,
	#[serde(rename = "721")]
	pub items: Vec<BookingItem>,
}

impl Entity for Booking {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 709,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BookingsRef {
	#[serde(rename = "723")]
	pub _id: Option<CustomId>,
	#[serde(rename = "724")]
	pub items: GeneratedId,
}

impl Entity for BookingsRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 722,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct StringWrapper {
	#[serde(rename = "729")]
	pub _id: Option<CustomId>,
	#[serde(rename = "730")]
	pub value: String,
}

impl Entity for StringWrapper {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 728,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomDomainReturn {
	#[serde(rename = "732")]
	pub _format: i64,
	#[serde(rename = "733")]
	pub validationResult: i64,
	#[serde(rename = "734")]
	pub invalidDnsRecords: Vec<StringWrapper>,
}

impl Entity for CustomDomainReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 731,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomDomainData {
	#[serde(rename = "736")]
	pub _format: i64,
	#[serde(rename = "737")]
	pub domain: String,
	#[serde(rename = "1045")]
	pub catchAllMailGroup: Option<GeneratedId>,
}

impl Entity for CustomDomainData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 735,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InvoiceInfo {
	#[serde(rename = "754")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "755")]
	pub _permissions: GeneratedId,
	#[serde(rename = "756")]
	pub _format: i64,
	#[serde(rename = "757")]
	pub specialPriceUserTotal: Option<i64>,
	#[serde(rename = "758")]
	pub specialPriceUserSingle: Option<i64>,
	#[serde(rename = "759")]
	pub publishInvoices: bool,
	#[serde(rename = "1008")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1282")]
	pub specialPriceBrandingPerUser: Option<i64>,
	#[serde(rename = "1283")]
	pub specialPriceSharedGroupSingle: Option<i64>,
	#[serde(rename = "1284")]
	pub specialPriceContactFormSingle: Option<i64>,
	#[serde(rename = "1627")]
	pub specialPriceSharingPerUser: Option<i64>,
	#[serde(rename = "1637")]
	pub reminderState: i64,
	#[serde(rename = "1638")]
	pub extendedPeriodOfPaymentDays: i64,
	#[serde(rename = "1639")]
	pub persistentPaymentPeriodExtension: bool,
	#[serde(rename = "1864")]
	pub specialPriceBusinessPerUser: Option<i64>,
	#[serde(rename = "2126")]
	pub discountPercentage: Option<i64>,
	#[serde(rename = "1640")]
	pub paymentErrorInfo: Option<PaymentErrorInfo>,
}

impl Entity for InvoiceInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 752,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SwitchAccountTypePostIn {
	#[serde(rename = "773")]
	pub _format: i64,
	#[serde(rename = "774")]
	pub accountType: i64,
	#[serde(rename = "775")]
	pub date: Option<DateTime>,
	#[serde(rename = "1310")]
	pub plan: i64,
	#[serde(rename = "2123")]
	pub customer: Option<GeneratedId>,
	#[serde(rename = "2124")]
	pub specialPriceUserSingle: Option<i64>,
	#[serde(rename = "2496")]
	pub app: Option<i64>,
	#[serde(rename = "2071")]
	pub referralCode: Option<GeneratedId>,
	#[serde(rename = "2314")]
	pub surveyData: Option<SurveyData>,
}

impl Entity for SwitchAccountTypePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 772,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailAddressAliasServiceDataDelete {
	#[serde(rename = "786")]
	pub _format: i64,
	#[serde(rename = "787")]
	pub mailAddress: String,
	#[serde(rename = "788")]
	pub restore: bool,
	#[serde(rename = "789")]
	pub group: GeneratedId,
}

impl Entity for MailAddressAliasServiceDataDelete {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 785,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PaymentDataServiceGetReturn {
	#[serde(rename = "791")]
	pub _format: i64,
	#[serde(rename = "792")]
	pub loginUrl: String,
}

impl Entity for PaymentDataServiceGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 790,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PaymentDataServicePutData {
	#[serde(rename = "794")]
	pub _format: i64,
	#[serde(rename = "796")]
	pub invoiceName: String,
	#[serde(rename = "797")]
	pub invoiceAddress: String,
	#[serde(rename = "798")]
	pub invoiceCountry: String,
	#[serde(rename = "799")]
	pub invoiceVatIdNo: String,
	#[serde(rename = "800")]
	pub paymentMethod: i64,
	#[serde(rename = "801")]
	pub paymentMethodInfo: Option<String>,
	#[serde(rename = "802")]
	pub paymentInterval: i64,
	#[serde(rename = "803")]
	pub paymentToken: Option<String>,
	#[serde(rename = "804")]
	pub confirmedCountry: Option<String>,
	#[serde(rename = "1320")]
	pub creditCard: Option<CreditCard>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for PaymentDataServicePutData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 793,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PaymentDataServicePutReturn {
	#[serde(rename = "806")]
	pub _format: i64,
	#[serde(rename = "807")]
	pub result: i64,
	#[serde(rename = "1840")]
	pub braintree3dsRequest: Option<Braintree3ds2Request>,
}

impl Entity for PaymentDataServicePutReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 805,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PriceRequestData {
	#[serde(rename = "837")]
	pub _id: Option<CustomId>,
	#[serde(rename = "838")]
	pub featureType: i64,
	#[serde(rename = "839")]
	pub count: i64,
	#[serde(rename = "840")]
	pub business: Option<bool>,
	#[serde(rename = "841")]
	pub paymentInterval: Option<i64>,
	#[serde(rename = "842")]
	pub accountType: Option<i64>,
	#[serde(rename = "1285")]
	pub reactivate: bool,
}

impl Entity for PriceRequestData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 836,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PriceServiceData {
	#[serde(rename = "844")]
	pub _format: i64,
	#[serde(rename = "846")]
	pub date: Option<DateTime>,
	#[serde(rename = "845")]
	pub priceRequest: Option<PriceRequestData>,
}

impl Entity for PriceServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 843,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PriceItemData {
	#[serde(rename = "848")]
	pub _id: Option<CustomId>,
	#[serde(rename = "849")]
	pub featureType: i64,
	#[serde(rename = "850")]
	pub count: i64,
	#[serde(rename = "851")]
	pub price: i64,
	#[serde(rename = "852")]
	pub singleType: bool,
}

impl Entity for PriceItemData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 847,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PriceData {
	#[serde(rename = "854")]
	pub _id: Option<CustomId>,
	#[serde(rename = "855")]
	pub price: i64,
	#[serde(rename = "856")]
	pub taxIncluded: bool,
	#[serde(rename = "857")]
	pub paymentInterval: i64,
	#[serde(rename = "858")]
	pub items: Vec<PriceItemData>,
}

impl Entity for PriceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 853,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PriceServiceReturn {
	#[serde(rename = "860")]
	pub _format: i64,
	#[serde(rename = "861")]
	pub periodEndDate: DateTime,
	#[serde(rename = "862")]
	pub currentPeriodAddedPrice: Option<i64>,
	#[serde(rename = "863")]
	pub currentPriceThisPeriod: Option<PriceData>,
	#[serde(rename = "864")]
	pub currentPriceNextPeriod: Option<PriceData>,
	#[serde(rename = "865")]
	pub futurePriceNextPeriod: Option<PriceData>,
}

impl Entity for PriceServiceReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 859,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MembershipRemoveData {
	#[serde(rename = "868")]
	pub _format: i64,
	#[serde(rename = "869")]
	pub user: GeneratedId,
	#[serde(rename = "870")]
	pub group: GeneratedId,
}

impl Entity for MembershipRemoveData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 867,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct File {
	#[serde(rename = "918")]
	pub _id: Option<CustomId>,
	#[serde(rename = "919")]
	pub name: String,
	#[serde(rename = "920")]
	pub mimeType: String,
	#[serde(rename = "921")]
	#[serde(with = "serde_bytes")]
	pub data: Vec<u8>,
}

impl Entity for File {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 917,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EmailSenderListElement {
	#[serde(rename = "950")]
	pub _id: Option<CustomId>,
	#[serde(rename = "951")]
	pub hashedValue: String,
	#[serde(rename = "952")]
	pub value: String,
	#[serde(rename = "953")]
	pub r#type: i64,
	#[serde(rename = "1705")]
	pub field: i64,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for EmailSenderListElement {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 949,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomerServerProperties {
	#[serde(rename = "956")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "957")]
	pub _permissions: GeneratedId,
	#[serde(rename = "958")]
	pub _format: i64,
	#[serde(rename = "986")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "987")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1100")]
	pub requirePasswordUpdateAfterReset: bool,
	#[serde(rename = "1406")]
	pub saveEncryptedIpAddressInSession: bool,
	#[serde(rename = "2224")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "959")]
	pub emailSenderList: Vec<EmailSenderListElement>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for CustomerServerProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 954,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateCustomerServerPropertiesData {
	#[serde(rename = "962")]
	pub _format: i64,
	#[serde(rename = "963")]
	#[serde(with = "serde_bytes")]
	pub adminGroupEncSessionKey: Vec<u8>,
	#[serde(rename = "2274")]
	pub adminGroupKeyVersion: i64,
}

impl Entity for CreateCustomerServerPropertiesData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 961,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateCustomerServerPropertiesReturn {
	#[serde(rename = "965")]
	pub _format: i64,
	#[serde(rename = "966")]
	pub id: GeneratedId,
}

impl Entity for CreateCustomerServerPropertiesReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 964,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAreaGroups {
	#[serde(rename = "989")]
	pub _id: Option<CustomId>,
	#[serde(rename = "990")]
	pub list: GeneratedId,
}

impl Entity for UserAreaGroups {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 988,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DebitServicePutData {
	#[serde(rename = "1042")]
	pub _format: i64,
}

impl Entity for DebitServicePutData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1041,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EntityEventBatch {
	#[serde(rename = "1081")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1082")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1083")]
	pub _format: i64,
	#[serde(rename = "1084")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1085")]
	pub events: Vec<EntityUpdate>,
}

impl Entity for EntityEventBatch {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1079,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AuditLogEntry {
	#[serde(rename = "1103")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1104")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1105")]
	pub _format: i64,
	#[serde(rename = "1106")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1107")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1108")]
	pub actorMailAddress: String,
	#[serde(rename = "1109")]
	pub actorIpAddress: Option<String>,
	#[serde(rename = "1110")]
	pub action: String,
	#[serde(rename = "1111")]
	pub modifiedEntity: String,
	#[serde(rename = "1112")]
	pub date: DateTime,
	#[serde(rename = "2227")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1113")]
	pub groupInfo: Option<IdTupleGenerated>,
	#[serde(rename = "1307")]
	pub modifiedGroupInfo: Option<IdTupleGenerated>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for AuditLogEntry {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1101,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AuditLogRef {
	#[serde(rename = "1115")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1116")]
	pub items: GeneratedId,
}

impl Entity for AuditLogRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1114,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct WhitelabelConfig {
	#[serde(rename = "1129")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "1130")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1131")]
	pub _format: i64,
	#[serde(rename = "1132")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1133")]
	pub jsonTheme: String,
	#[serde(rename = "1281")]
	pub metaTags: String,
	#[serde(rename = "1308")]
	pub germanLanguageCode: Option<String>,
	#[serde(rename = "1425")]
	pub imprintUrl: Option<String>,
	#[serde(rename = "1496")]
	pub privacyStatementUrl: Option<String>,
	#[serde(rename = "1727")]
	pub whitelabelCode: String,
	#[serde(rename = "1252")]
	pub bootstrapCustomizations: Vec<BootstrapFeature>,
	#[serde(rename = "1728")]
	pub whitelabelRegistrationDomains: Vec<StringWrapper>,
}

impl Entity for WhitelabelConfig {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1127,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BrandingDomainData {
	#[serde(rename = "1150")]
	pub _format: i64,
	#[serde(rename = "1151")]
	pub domain: String,
	#[serde(rename = "1152")]
	#[serde(with = "serde_bytes")]
	pub sessionEncPemCertificateChain: Option<Vec<u8>>,
	#[serde(rename = "1153")]
	#[serde(with = "serde_bytes")]
	pub sessionEncPemPrivateKey: Option<Vec<u8>>,
	#[serde(rename = "1154")]
	#[serde(with = "serde_bytes")]
	pub systemAdminPubEncSessionKey: Vec<u8>,
	#[serde(rename = "2161")]
	pub systemAdminPublicProtocolVersion: i64,
	#[serde(rename = "2282")]
	pub systemAdminPubKeyVersion: i64,
}

impl Entity for BrandingDomainData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1149,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BrandingDomainDeleteData {
	#[serde(rename = "1156")]
	pub _format: i64,
	#[serde(rename = "1157")]
	pub domain: String,
}

impl Entity for BrandingDomainDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1155,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct U2fRegisteredDevice {
	#[serde(rename = "1163")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1164")]
	#[serde(with = "serde_bytes")]
	pub keyHandle: Vec<u8>,
	#[serde(rename = "1165")]
	pub appId: String,
	#[serde(rename = "1166")]
	#[serde(with = "serde_bytes")]
	pub publicKey: Vec<u8>,
	#[serde(rename = "1167")]
	pub counter: i64,
	#[serde(rename = "1168")]
	pub compromised: bool,
}

impl Entity for U2fRegisteredDevice {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1162,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SecondFactor {
	#[serde(rename = "1171")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1172")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1173")]
	pub _format: i64,
	#[serde(rename = "1174")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1175")]
	pub r#type: i64,
	#[serde(rename = "1176")]
	pub name: String,
	#[serde(rename = "1242")]
	#[serde(with = "serde_bytes")]
	pub otpSecret: Option<Vec<u8>>,
	#[serde(rename = "1177")]
	pub u2f: Option<U2fRegisteredDevice>,
}

impl Entity for SecondFactor {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1169,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct U2fKey {
	#[serde(rename = "1179")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1180")]
	#[serde(with = "serde_bytes")]
	pub keyHandle: Vec<u8>,
	#[serde(rename = "1181")]
	pub appId: String,
	#[serde(rename = "1182")]
	pub secondFactor: IdTupleGenerated,
}

impl Entity for U2fKey {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1178,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct U2fChallenge {
	#[serde(rename = "1184")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1185")]
	#[serde(with = "serde_bytes")]
	pub challenge: Vec<u8>,
	#[serde(rename = "1186")]
	pub keys: Vec<U2fKey>,
}

impl Entity for U2fChallenge {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1183,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Challenge {
	#[serde(rename = "1188")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1189")]
	pub r#type: i64,
	#[serde(rename = "1190")]
	pub u2f: Option<U2fChallenge>,
	#[serde(rename = "1247")]
	pub otp: Option<OtpChallenge>,
}

impl Entity for Challenge {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1187,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Session {
	#[serde(rename = "1193")]
	pub _id: Option<IdTupleCustom>,
	#[serde(rename = "1194")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1195")]
	pub _format: i64,
	#[serde(rename = "1196")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1197")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1198")]
	pub clientIdentifier: String,
	#[serde(rename = "1199")]
	pub loginTime: DateTime,
	#[serde(rename = "1200")]
	pub loginIpAddress: Option<String>,
	#[serde(rename = "1201")]
	pub lastAccessTime: DateTime,
	#[serde(rename = "1202")]
	#[serde(with = "serde_bytes")]
	pub accessKey: Option<Vec<u8>>,
	#[serde(rename = "1203")]
	pub state: i64,
	#[serde(rename = "2229")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1204")]
	pub challenges: Vec<Challenge>,
	#[serde(rename = "1205")]
	pub user: GeneratedId,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for Session {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1191,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAuthentication {
	#[serde(rename = "1207")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1208")]
	pub sessions: GeneratedId,
	#[serde(rename = "1209")]
	pub secondFactors: GeneratedId,
	#[serde(rename = "1416")]
	pub recoverCode: Option<GeneratedId>,
}

impl Entity for UserAuthentication {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1206,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateSessionData {
	#[serde(rename = "1212")]
	pub _format: i64,
	#[serde(rename = "1213")]
	pub mailAddress: Option<String>,
	#[serde(rename = "1214")]
	pub authVerifier: Option<String>,
	#[serde(rename = "1215")]
	pub clientIdentifier: String,
	#[serde(rename = "1216")]
	#[serde(with = "serde_bytes")]
	pub accessKey: Option<Vec<u8>>,
	#[serde(rename = "1217")]
	pub authToken: Option<String>,
	#[serde(rename = "1417")]
	pub recoverCodeVerifier: Option<String>,
	#[serde(rename = "1218")]
	pub user: Option<GeneratedId>,
}

impl Entity for CreateSessionData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1211,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateSessionReturn {
	#[serde(rename = "1220")]
	pub _format: i64,
	#[serde(rename = "1221")]
	pub accessToken: String,
	#[serde(rename = "1222")]
	pub challenges: Vec<Challenge>,
	#[serde(rename = "1223")]
	pub user: GeneratedId,
}

impl Entity for CreateSessionReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1219,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct U2fResponseData {
	#[serde(rename = "1226")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1227")]
	pub keyHandle: String,
	#[serde(rename = "1228")]
	pub clientData: String,
	#[serde(rename = "1229")]
	pub signatureData: String,
}

impl Entity for U2fResponseData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1225,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SecondFactorAuthGetData {
	#[serde(rename = "1234")]
	pub _format: i64,
	#[serde(rename = "1235")]
	pub accessToken: String,
}

impl Entity for SecondFactorAuthGetData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1233,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SecondFactorAuthGetReturn {
	#[serde(rename = "1237")]
	pub _format: i64,
	#[serde(rename = "1238")]
	pub secondFactorPending: bool,
}

impl Entity for SecondFactorAuthGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1236,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct OtpChallenge {
	#[serde(rename = "1245")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1246")]
	pub secondFactors: Vec<IdTupleGenerated>,
}

impl Entity for OtpChallenge {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1244,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BootstrapFeature {
	#[serde(rename = "1250")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1309")]
	pub feature: i64,
}

impl Entity for BootstrapFeature {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1249,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Feature {
	#[serde(rename = "1254")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1255")]
	pub feature: i64,
}

impl Entity for Feature {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1253,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct WhitelabelChild {
	#[serde(rename = "1259")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1260")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1261")]
	pub _format: i64,
	#[serde(rename = "1262")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1263")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1264")]
	pub mailAddress: String,
	#[serde(rename = "1265")]
	pub createdDate: DateTime,
	#[serde(rename = "1266")]
	pub deletedDate: Option<DateTime>,
	#[serde(rename = "1267")]
	pub comment: String,
	#[serde(rename = "2230")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1268")]
	pub customer: GeneratedId,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for WhitelabelChild {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1257,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct WhitelabelChildrenRef {
	#[serde(rename = "1270")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1271")]
	pub items: GeneratedId,
}

impl Entity for WhitelabelChildrenRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1269,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct WhitelabelParent {
	#[serde(rename = "1273")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1274")]
	pub customer: GeneratedId,
	#[serde(rename = "1275")]
	pub whitelabelChildInParent: IdTupleGenerated,
}

impl Entity for WhitelabelParent {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1272,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreditCard {
	#[serde(rename = "1314")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1315")]
	pub cardHolderName: String,
	#[serde(rename = "1316")]
	pub number: String,
	#[serde(rename = "1317")]
	pub cvv: String,
	#[serde(rename = "1318")]
	pub expirationMonth: String,
	#[serde(rename = "1319")]
	pub expirationYear: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for CreditCard {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1313,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct LocationServiceGetReturn {
	#[serde(rename = "1322")]
	pub _format: i64,
	#[serde(rename = "1323")]
	pub country: String,
}

impl Entity for LocationServiceGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1321,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct OrderProcessingAgreement {
	#[serde(rename = "1328")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1329")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1330")]
	pub _format: i64,
	#[serde(rename = "1331")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1332")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1333")]
	pub version: String,
	#[serde(rename = "1334")]
	pub customerAddress: String,
	#[serde(rename = "1335")]
	pub signatureDate: DateTime,
	#[serde(rename = "2231")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1336")]
	pub signerUserGroupInfo: IdTupleGenerated,
	#[serde(rename = "1337")]
	pub customer: GeneratedId,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for OrderProcessingAgreement {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1326,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SignOrderProcessingAgreementData {
	#[serde(rename = "1343")]
	pub _format: i64,
	#[serde(rename = "1344")]
	pub version: String,
	#[serde(rename = "1345")]
	pub customerAddress: String,
}

impl Entity for SignOrderProcessingAgreementData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1342,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GeneratedIdWrapper {
	#[serde(rename = "1350")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1351")]
	pub value: GeneratedId,
}

impl Entity for GeneratedIdWrapper {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1349,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SseConnectData {
	#[serde(rename = "1353")]
	pub _format: i64,
	#[serde(rename = "1354")]
	pub identifier: String,
	#[serde(rename = "1355")]
	pub userIds: Vec<GeneratedIdWrapper>,
}

impl Entity for SseConnectData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1352,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NotificationInfo {
	#[serde(rename = "1365")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1366")]
	pub mailAddress: String,
	#[serde(rename = "1368")]
	pub userId: GeneratedId,
	#[serde(rename = "2319")]
	pub mailId: Option<IdTupleWrapper>,
}

impl Entity for NotificationInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1364,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RecoverCode {
	#[serde(rename = "1409")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "1410")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1411")]
	pub _format: i64,
	#[serde(rename = "1412")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1413")]
	#[serde(with = "serde_bytes")]
	pub userEncRecoverCode: Vec<u8>,
	#[serde(rename = "1414")]
	#[serde(with = "serde_bytes")]
	pub recoverCodeEncUserGroupKey: Vec<u8>,
	#[serde(rename = "1415")]
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
	#[serde(rename = "2281")]
	pub userKeyVersion: i64,
}

impl Entity for RecoverCode {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1407,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ResetFactorsDeleteData {
	#[serde(rename = "1420")]
	pub _format: i64,
	#[serde(rename = "1421")]
	pub mailAddress: String,
	#[serde(rename = "1422")]
	pub authVerifier: String,
	#[serde(rename = "1423")]
	pub recoverCodeVerifier: String,
}

impl Entity for ResetFactorsDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1419,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UpgradePriceServiceData {
	#[serde(rename = "1457")]
	pub _format: i64,
	#[serde(rename = "1458")]
	pub date: Option<DateTime>,
	#[serde(rename = "1459")]
	pub campaign: Option<String>,
	#[serde(rename = "2077")]
	pub referralCode: Option<GeneratedId>,
}

impl Entity for UpgradePriceServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1456,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PlanPrices {
	#[serde(rename = "1461")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1462")]
	pub monthlyReferencePrice: i64,
	#[serde(rename = "1463")]
	pub monthlyPrice: i64,
	#[serde(rename = "1464")]
	pub firstYearDiscount: i64,
	#[serde(rename = "1465")]
	pub additionalUserPriceMonthly: i64,
	#[serde(rename = "1467")]
	pub includedAliases: i64,
	#[serde(rename = "1468")]
	pub includedStorage: i64,
	#[serde(rename = "2099")]
	pub sharing: bool,
	#[serde(rename = "2100")]
	pub business: bool,
	#[serde(rename = "2101")]
	pub whitelabel: bool,
	#[serde(rename = "2102")]
	pub customDomains: i64,
	#[serde(rename = "2128")]
	pub planName: String,
	#[serde(rename = "2129")]
	pub businessPlan: bool,
	#[serde(rename = "2127")]
	pub planConfiguration: PlanConfiguration,
}

impl Entity for PlanPrices {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1460,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UpgradePriceServiceReturn {
	#[serde(rename = "1470")]
	pub _format: i64,
	#[serde(rename = "1471")]
	pub messageTextId: Option<String>,
	#[serde(rename = "1472")]
	pub business: bool,
	#[serde(rename = "2084")]
	pub bonusMonthsForYearlyPlan: i64,
	#[serde(rename = "1473")]
	pub premiumPrices: PlanPrices,
	#[serde(rename = "1474")]
	pub proPrices: PlanPrices,
	#[serde(rename = "1729")]
	pub teamsPrices: PlanPrices,
	#[serde(rename = "1866")]
	pub premiumBusinessPrices: PlanPrices,
	#[serde(rename = "1867")]
	pub teamsBusinessPrices: PlanPrices,
	#[serde(rename = "2078")]
	pub freePrices: PlanPrices,
	#[serde(rename = "2079")]
	pub revolutionaryPrices: PlanPrices,
	#[serde(rename = "2080")]
	pub legendaryPrices: PlanPrices,
	#[serde(rename = "2081")]
	pub essentialPrices: PlanPrices,
	#[serde(rename = "2082")]
	pub advancedPrices: PlanPrices,
	#[serde(rename = "2083")]
	pub unlimitedPrices: PlanPrices,
	#[serde(rename = "2131")]
	pub plans: Vec<PlanPrices>,
}

impl Entity for UpgradePriceServiceReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1469,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RegistrationCaptchaServiceGetData {
	#[serde(rename = "1480")]
	pub _format: i64,
	#[serde(rename = "1481")]
	pub token: Option<String>,
	#[serde(rename = "1482")]
	pub mailAddress: String,
	#[serde(rename = "1731")]
	pub signupToken: Option<String>,
	#[serde(rename = "1751")]
	pub paidSubscriptionSelected: bool,
	#[serde(rename = "1752")]
	pub businessUseSelected: bool,
}

impl Entity for RegistrationCaptchaServiceGetData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1479,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct WebsocketEntityData {
	#[serde(rename = "1484")]
	pub _format: i64,
	#[serde(rename = "1485")]
	pub eventBatchId: GeneratedId,
	#[serde(rename = "1486")]
	pub eventBatchOwner: GeneratedId,
	#[serde(rename = "1487")]
	pub eventBatch: Vec<EntityUpdate>,
}

impl Entity for WebsocketEntityData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1483,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct WebsocketCounterValue {
	#[serde(rename = "1489")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1490")]
	pub counterId: GeneratedId,
	#[serde(rename = "1491")]
	pub count: i64,
}

impl Entity for WebsocketCounterValue {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1488,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct WebsocketCounterData {
	#[serde(rename = "1493")]
	pub _format: i64,
	#[serde(rename = "1494")]
	pub mailGroup: GeneratedId,
	#[serde(rename = "1495")]
	pub counterValues: Vec<WebsocketCounterValue>,
}

impl Entity for WebsocketCounterData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1492,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CertificateInfo {
	#[serde(rename = "1501")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1502")]
	pub expiryDate: Option<DateTime>,
	#[serde(rename = "1503")]
	pub state: i64,
	#[serde(rename = "1504")]
	pub r#type: i64,
	#[serde(rename = "1505")]
	pub certificate: Option<GeneratedId>,
}

impl Entity for CertificateInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1500,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NotificationMailTemplate {
	#[serde(rename = "1518")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1519")]
	pub language: String,
	#[serde(rename = "1520")]
	pub body: String,
	#[serde(rename = "1521")]
	pub subject: String,
}

impl Entity for NotificationMailTemplate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1517,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEventRef {
	#[serde(rename = "1533")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1534")]
	pub elementId: CustomId,
	#[serde(rename = "1535")]
	pub listId: GeneratedId,
}

impl Entity for CalendarEventRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1532,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AlarmInfo {
	#[serde(rename = "1537")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1538")]
	pub trigger: String,
	#[serde(rename = "1539")]
	pub alarmIdentifier: String,
	#[serde(rename = "1540")]
	pub calendarRef: CalendarEventRef,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for AlarmInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1536,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAlarmInfo {
	#[serde(rename = "1543")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1544")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1545")]
	pub _format: i64,
	#[serde(rename = "1546")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1547")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "2233")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1548")]
	pub alarmInfo: AlarmInfo,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for UserAlarmInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1541,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAlarmInfoListType {
	#[serde(rename = "1550")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1551")]
	pub alarms: GeneratedId,
}

impl Entity for UserAlarmInfoListType {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1549,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NotificationSessionKey {
	#[serde(rename = "1554")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1556")]
	#[serde(with = "serde_bytes")]
	pub pushIdentifierSessionEncSessionKey: Vec<u8>,
	#[serde(rename = "1555")]
	pub pushIdentifier: IdTupleGenerated,
}

impl Entity for NotificationSessionKey {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1553,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RepeatRule {
	#[serde(rename = "1558")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1559")]
	pub frequency: i64,
	#[serde(rename = "1560")]
	pub endType: i64,
	#[serde(rename = "1561")]
	pub endValue: Option<i64>,
	#[serde(rename = "1562")]
	pub interval: i64,
	#[serde(rename = "1563")]
	pub timeZone: String,
	#[serde(rename = "2076")]
	pub excludedDates: Vec<DateWrapper>,
	#[serde(rename = "2525")]
	pub advancedRules: Vec<CalendarAdvancedRepeatRule>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for RepeatRule {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1557,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AlarmNotification {
	#[serde(rename = "1565")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1566")]
	pub operation: i64,
	#[serde(rename = "1567")]
	pub summary: String,
	#[serde(rename = "1568")]
	pub eventStart: DateTime,
	#[serde(rename = "1569")]
	pub eventEnd: DateTime,
	#[serde(rename = "1570")]
	pub alarmInfo: AlarmInfo,
	#[serde(rename = "1571")]
	pub repeatRule: Option<RepeatRule>,
	#[serde(rename = "1572")]
	pub notificationSessionKeys: Vec<NotificationSessionKey>,
	#[serde(rename = "1573")]
	pub user: GeneratedId,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for AlarmNotification {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1564,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AlarmServicePost {
	#[serde(rename = "1577")]
	pub _format: i64,
	#[serde(rename = "1578")]
	pub alarmNotifications: Vec<AlarmNotification>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for AlarmServicePost {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1576,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DnsRecord {
	#[serde(rename = "1582")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1583")]
	pub subdomain: Option<String>,
	#[serde(rename = "1584")]
	pub r#type: i64,
	#[serde(rename = "1585")]
	pub value: String,
}

impl Entity for DnsRecord {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1581,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomDomainCheckGetIn {
	#[serde(rename = "1587")]
	pub _format: i64,
	#[serde(rename = "1588")]
	pub domain: String,
	#[serde(rename = "2053")]
	pub customer: Option<GeneratedId>,
}

impl Entity for CustomDomainCheckGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1586,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomDomainCheckGetOut {
	#[serde(rename = "1590")]
	pub _format: i64,
	#[serde(rename = "1591")]
	pub checkResult: i64,
	#[serde(rename = "1592")]
	pub missingRecords: Vec<DnsRecord>,
	#[serde(rename = "1593")]
	pub invalidRecords: Vec<DnsRecord>,
	#[serde(rename = "1758")]
	pub requiredRecords: Vec<DnsRecord>,
}

impl Entity for CustomDomainCheckGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1589,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CloseSessionServicePost {
	#[serde(rename = "1596")]
	pub _format: i64,
	#[serde(rename = "1597")]
	pub accessToken: String,
	#[serde(rename = "1598")]
	pub sessionId: IdTupleCustom,
}

impl Entity for CloseSessionServicePost {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1595,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReceivedGroupInvitation {
	#[serde(rename = "1604")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1605")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1606")]
	pub _format: i64,
	#[serde(rename = "1607")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1608")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1609")]
	#[serde(with = "serde_bytes")]
	pub sharedGroupKey: Vec<u8>,
	#[serde(rename = "1610")]
	pub sharedGroupName: String,
	#[serde(rename = "1611")]
	pub inviterMailAddress: String,
	#[serde(rename = "1612")]
	pub inviterName: String,
	#[serde(rename = "1613")]
	pub inviteeMailAddress: String,
	#[serde(rename = "1614")]
	pub capability: i64,
	#[serde(rename = "1868")]
	pub groupType: Option<i64>,
	#[serde(rename = "2234")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "2280")]
	pub sharedGroupKeyVersion: i64,
	#[serde(rename = "1615")]
	pub sharedGroup: GeneratedId,
	#[serde(rename = "1616")]
	pub sentInvitation: IdTupleGenerated,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ReceivedGroupInvitation {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1602,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserGroupRoot {
	#[serde(rename = "1620")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "1621")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1622")]
	pub _format: i64,
	#[serde(rename = "1623")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1624")]
	pub invitations: GeneratedId,
	#[serde(rename = "2294")]
	pub keyRotations: Option<KeyRotationsRef>,
	#[serde(rename = "2383")]
	pub groupKeyUpdates: Option<GroupKeyUpdatesRef>,
}

impl Entity for UserGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1618,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PaymentErrorInfo {
	#[serde(rename = "1633")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1634")]
	pub errorTime: DateTime,
	#[serde(rename = "1635")]
	pub errorCode: String,
	#[serde(rename = "1636")]
	pub thirdPartyErrorId: String,
}

impl Entity for PaymentErrorInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1632,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InvoiceItem {
	#[serde(rename = "1642")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1643")]
	pub amount: i64,
	#[serde(rename = "1644")]
	pub r#type: i64,
	#[serde(rename = "1645")]
	pub singlePrice: Option<i64>,
	#[serde(rename = "1646")]
	pub totalPrice: i64,
	#[serde(rename = "1647")]
	pub startDate: Option<DateTime>,
	#[serde(rename = "1648")]
	pub endDate: Option<DateTime>,
	#[serde(rename = "1649")]
	pub singleType: bool,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for InvoiceItem {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1641,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Invoice {
	#[serde(rename = "1652")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "1653")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1654")]
	pub _format: i64,
	#[serde(rename = "1655")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1656")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1657")]
	pub r#type: i64,
	#[serde(rename = "1658")]
	pub date: DateTime,
	#[serde(rename = "1659")]
	pub paymentMethod: i64,
	#[serde(rename = "1660")]
	pub country: String,
	#[serde(rename = "1661")]
	pub address: String,
	#[serde(rename = "1662")]
	pub business: bool,
	#[serde(rename = "1663")]
	pub vatIdNumber: Option<String>,
	#[serde(rename = "1664")]
	pub vatRate: i64,
	#[serde(rename = "1665")]
	pub vat: i64,
	#[serde(rename = "1666")]
	pub subTotal: i64,
	#[serde(rename = "1667")]
	pub grandTotal: i64,
	#[serde(rename = "1668")]
	pub adminUser: Option<String>,
	#[serde(rename = "1669")]
	pub reason: Option<String>,
	#[serde(rename = "2235")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1670")]
	pub items: Vec<InvoiceItem>,
	#[serde(rename = "1671")]
	pub customer: GeneratedId,
	#[serde(rename = "1672")]
	pub bookings: Vec<IdTupleGenerated>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for Invoice {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1650,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MissedNotification {
	#[serde(rename = "1695")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1696")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1697")]
	pub _format: i64,
	#[serde(rename = "1698")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1699")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1722")]
	pub lastProcessedNotificationId: Option<GeneratedId>,
	#[serde(rename = "2236")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1702")]
	pub notificationInfos: Vec<NotificationInfo>,
	#[serde(rename = "1703")]
	pub alarmNotifications: Vec<AlarmNotification>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for MissedNotification {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1693,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BrandingDomainGetReturn {
	#[serde(rename = "1724")]
	pub _format: i64,
	#[serde(rename = "1725")]
	pub certificateInfo: Option<CertificateInfo>,
}

impl Entity for BrandingDomainGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1723,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RejectedSender {
	#[serde(rename = "1738")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1739")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1740")]
	pub _format: i64,
	#[serde(rename = "1741")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1742")]
	pub senderMailAddress: String,
	#[serde(rename = "1743")]
	pub senderIp: String,
	#[serde(rename = "1744")]
	pub senderHostname: String,
	#[serde(rename = "1745")]
	pub recipientMailAddress: String,
	#[serde(rename = "1746")]
	pub reason: String,
}

impl Entity for RejectedSender {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1736,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RejectedSendersRef {
	#[serde(rename = "1748")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1749")]
	pub items: GeneratedId,
}

impl Entity for RejectedSendersRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1747,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SecondFactorAuthDeleteData {
	#[serde(rename = "1756")]
	pub _format: i64,
	#[serde(rename = "1757")]
	pub session: IdTupleCustom,
}

impl Entity for SecondFactorAuthDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1755,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TakeOverDeletedAddressData {
	#[serde(rename = "1760")]
	pub _format: i64,
	#[serde(rename = "1761")]
	pub mailAddress: String,
	#[serde(rename = "1762")]
	pub authVerifier: String,
	#[serde(rename = "1763")]
	pub recoverCodeVerifier: Option<String>,
	#[serde(rename = "1764")]
	pub targetAccountMailAddress: String,
}

impl Entity for TakeOverDeletedAddressData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1759,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct WebsocketLeaderStatus {
	#[serde(rename = "1767")]
	pub _format: i64,
	#[serde(rename = "1768")]
	pub leaderStatus: bool,
}

impl Entity for WebsocketLeaderStatus {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1766,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GiftCard {
	#[serde(rename = "1771")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1772")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1773")]
	pub _format: i64,
	#[serde(rename = "1774")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1775")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1776")]
	pub status: i64,
	#[serde(rename = "1777")]
	pub value: i64,
	#[serde(rename = "1778")]
	pub message: String,
	#[serde(rename = "1779")]
	pub orderDate: DateTime,
	#[serde(rename = "1993")]
	pub migrated: bool,
	#[serde(rename = "2238")]
	pub _ownerKeyVersion: Option<i64>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for GiftCard {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1769,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GiftCardsRef {
	#[serde(rename = "1792")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1793")]
	pub items: GeneratedId,
}

impl Entity for GiftCardsRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1791,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GiftCardOption {
	#[serde(rename = "1796")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1797")]
	pub value: i64,
}

impl Entity for GiftCardOption {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1795,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GiftCardGetReturn {
	#[serde(rename = "1799")]
	pub _format: i64,
	#[serde(rename = "1800")]
	pub maxPerPeriod: i64,
	#[serde(rename = "1801")]
	pub period: i64,
	#[serde(rename = "1802")]
	pub options: Vec<GiftCardOption>,
}

impl Entity for GiftCardGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1798,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GiftCardCreateData {
	#[serde(rename = "1804")]
	pub _format: i64,
	#[serde(rename = "1805")]
	pub message: String,
	#[serde(rename = "1806")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "1807")]
	pub value: i64,
	#[serde(rename = "1809")]
	#[serde(with = "serde_bytes")]
	pub keyHash: Vec<u8>,
	#[serde(rename = "2275")]
	pub ownerKeyVersion: i64,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for GiftCardCreateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1803,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GiftCardDeleteData {
	#[serde(rename = "1811")]
	pub _format: i64,
	#[serde(rename = "1812")]
	pub giftCard: IdTupleGenerated,
}

impl Entity for GiftCardDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1810,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GiftCardCreateReturn {
	#[serde(rename = "1814")]
	pub _format: i64,
	#[serde(rename = "1815")]
	pub giftCard: IdTupleGenerated,
}

impl Entity for GiftCardCreateReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1813,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GiftCardRedeemData {
	#[serde(rename = "1818")]
	pub _format: i64,
	#[serde(rename = "1820")]
	#[serde(with = "serde_bytes")]
	pub keyHash: Vec<u8>,
	#[serde(rename = "1995")]
	pub countryCode: String,
	#[serde(rename = "1819")]
	pub giftCardInfo: GeneratedId,
}

impl Entity for GiftCardRedeemData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1817,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GiftCardRedeemGetReturn {
	#[serde(rename = "1822")]
	pub _format: i64,
	#[serde(rename = "1824")]
	pub message: String,
	#[serde(rename = "1825")]
	pub value: i64,
	#[serde(rename = "1823")]
	pub giftCard: IdTupleGenerated,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for GiftCardRedeemGetReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1821,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Braintree3ds2Request {
	#[serde(rename = "1829")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1830")]
	pub clientToken: String,
	#[serde(rename = "1831")]
	pub nonce: String,
	#[serde(rename = "1832")]
	pub bin: String,
}

impl Entity for Braintree3ds2Request {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1828,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Braintree3ds2Response {
	#[serde(rename = "1834")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1835")]
	pub clientToken: String,
	#[serde(rename = "1836")]
	pub nonce: String,
}

impl Entity for Braintree3ds2Response {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1833,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PaymentDataServicePostData {
	#[serde(rename = "1838")]
	pub _format: i64,
	#[serde(rename = "1839")]
	pub braintree3dsResponse: Braintree3ds2Response,
}

impl Entity for PaymentDataServicePostData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1837,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PaymentDataServiceGetData {
	#[serde(rename = "1862")]
	pub _format: i64,
	#[serde(rename = "1863")]
	pub clientType: Option<i64>,
}

impl Entity for PaymentDataServiceGetData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1861,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TypeInfo {
	#[serde(rename = "1870")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1871")]
	pub application: String,
	#[serde(rename = "1872")]
	pub typeId: i64,
}

impl Entity for TypeInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1869,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ArchiveRef {
	#[serde(rename = "1874")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1875")]
	pub archiveId: GeneratedId,
}

impl Entity for ArchiveRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1873,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ArchiveType {
	#[serde(rename = "1877")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1878")]
	pub r#type: TypeInfo,
	#[serde(rename = "1879")]
	pub active: ArchiveRef,
	#[serde(rename = "1880")]
	pub inactive: Vec<ArchiveRef>,
}

impl Entity for ArchiveType {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1876,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Blob {
	#[serde(rename = "1883")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1884")]
	pub archiveId: GeneratedId,
	#[serde(rename = "1898")]
	pub size: i64,
	#[serde(rename = "1906")]
	pub blobId: GeneratedId,
}

impl Entity for Blob {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1882,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct WebauthnResponseData {
	#[serde(rename = "1900")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1901")]
	#[serde(with = "serde_bytes")]
	pub keyHandle: Vec<u8>,
	#[serde(rename = "1902")]
	#[serde(with = "serde_bytes")]
	pub clientData: Vec<u8>,
	#[serde(rename = "1903")]
	#[serde(with = "serde_bytes")]
	pub authenticatorData: Vec<u8>,
	#[serde(rename = "1904")]
	#[serde(with = "serde_bytes")]
	pub signature: Vec<u8>,
}

impl Entity for WebauthnResponseData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1899,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobReferenceTokenWrapper {
	#[serde(rename = "1991")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1992")]
	pub blobReferenceToken: String,
}

impl Entity for BlobReferenceTokenWrapper {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 1990,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomerAccountTerminationRequest {
	#[serde(rename = "2007")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "2008")]
	pub _permissions: GeneratedId,
	#[serde(rename = "2009")]
	pub _format: i64,
	#[serde(rename = "2010")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "2012")]
	pub terminationDate: DateTime,
	#[serde(rename = "2013")]
	pub terminationRequestDate: DateTime,
	#[serde(rename = "2011")]
	pub customer: GeneratedId,
}

impl Entity for CustomerAccountTerminationRequest {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2005,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomerAccountTerminationPostIn {
	#[serde(rename = "2016")]
	pub _format: i64,
	#[serde(rename = "2017")]
	pub terminationDate: Option<DateTime>,
	#[serde(rename = "2313")]
	pub surveyData: Option<SurveyData>,
}

impl Entity for CustomerAccountTerminationPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2015,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomerAccountTerminationPostOut {
	#[serde(rename = "2019")]
	pub _format: i64,
	#[serde(rename = "2020")]
	pub terminationRequest: IdTupleGenerated,
}

impl Entity for CustomerAccountTerminationPostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2018,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailAddressAvailability {
	#[serde(rename = "2027")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2028")]
	pub mailAddress: String,
	#[serde(rename = "2029")]
	pub available: bool,
}

impl Entity for MailAddressAvailability {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2026,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MultipleMailAddressAvailabilityData {
	#[serde(rename = "2031")]
	pub _format: i64,
	#[serde(rename = "2032")]
	pub mailAddresses: Vec<StringWrapper>,
}

impl Entity for MultipleMailAddressAvailabilityData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2030,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MultipleMailAddressAvailabilityReturn {
	#[serde(rename = "2034")]
	pub _format: i64,
	#[serde(rename = "2035")]
	pub availabilities: Vec<MailAddressAvailability>,
}

impl Entity for MultipleMailAddressAvailabilityReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2033,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InstanceSessionKey {
	#[serde(rename = "2038")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2040")]
	pub instanceList: GeneratedId,
	#[serde(rename = "2041")]
	pub instanceId: GeneratedId,
	#[serde(rename = "2042")]
	#[serde(with = "serde_bytes")]
	pub symEncSessionKey: Vec<u8>,
	#[serde(rename = "2159")]
	#[serde(with = "serde_bytes")]
	pub encryptionAuthStatus: Option<Vec<u8>>,
	#[serde(rename = "2254")]
	pub symKeyVersion: i64,
	#[serde(rename = "2039")]
	pub typeInfo: TypeInfo,
}

impl Entity for InstanceSessionKey {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2037,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BucketKey {
	#[serde(rename = "2044")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2045")]
	#[serde(with = "serde_bytes")]
	pub pubEncBucketKey: Option<Vec<u8>>,
	#[serde(rename = "2046")]
	#[serde(with = "serde_bytes")]
	pub groupEncBucketKey: Option<Vec<u8>>,
	#[serde(rename = "2158")]
	pub protocolVersion: i64,
	#[serde(rename = "2252")]
	pub recipientKeyVersion: i64,
	#[serde(rename = "2253")]
	pub senderKeyVersion: Option<i64>,
	#[serde(rename = "2047")]
	pub keyGroup: Option<GeneratedId>,
	#[serde(rename = "2048")]
	pub bucketEncSessionKeys: Vec<InstanceSessionKey>,
}

impl Entity for BucketKey {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2043,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UpdateSessionKeysPostIn {
	#[serde(rename = "2050")]
	pub _format: i64,
	#[serde(rename = "2051")]
	pub ownerEncSessionKeys: Vec<InstanceSessionKey>,
}

impl Entity for UpdateSessionKeysPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2049,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReferralCodeGetIn {
	#[serde(rename = "2063")]
	pub _format: i64,
	#[serde(rename = "2064")]
	pub referralCode: GeneratedId,
}

impl Entity for ReferralCodeGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2062,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReferralCodePostIn {
	#[serde(rename = "2066")]
	pub _format: i64,
}

impl Entity for ReferralCodePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2065,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReferralCodePostOut {
	#[serde(rename = "2068")]
	pub _format: i64,
	#[serde(rename = "2069")]
	pub referralCode: GeneratedId,
}

impl Entity for ReferralCodePostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2067,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DateWrapper {
	#[serde(rename = "2074")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2075")]
	pub date: DateTime,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for DateWrapper {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2073,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailAddressAliasGetIn {
	#[serde(rename = "2096")]
	pub _format: i64,
	#[serde(rename = "2097")]
	pub targetGroup: GeneratedId,
}

impl Entity for MailAddressAliasGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2095,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PlanConfiguration {
	#[serde(rename = "2105")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2106")]
	pub nbrOfAliases: i64,
	#[serde(rename = "2107")]
	pub storageGb: i64,
	#[serde(rename = "2108")]
	pub sharing: bool,
	#[serde(rename = "2109")]
	pub eventInvites: bool,
	#[serde(rename = "2110")]
	pub whitelabel: bool,
	#[serde(rename = "2111")]
	pub customDomainType: i64,
	#[serde(rename = "2112")]
	pub multiUser: bool,
	#[serde(rename = "2113")]
	pub templates: bool,
	#[serde(rename = "2130")]
	pub autoResponder: bool,
	#[serde(rename = "2136")]
	pub contactList: bool,
	#[serde(rename = "2526")]
	pub maxLabels: i64,
}

impl Entity for PlanConfiguration {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2104,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PlanServiceGetOut {
	#[serde(rename = "2116")]
	pub _format: i64,
	#[serde(rename = "2117")]
	pub config: PlanConfiguration,
}

impl Entity for PlanServiceGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2115,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PublicKeyPutIn {
	#[serde(rename = "2151")]
	pub _format: i64,
	#[serde(rename = "2152")]
	#[serde(with = "serde_bytes")]
	pub pubEccKey: Vec<u8>,
	#[serde(rename = "2153")]
	#[serde(with = "serde_bytes")]
	pub symEncPrivEccKey: Vec<u8>,
	#[serde(rename = "2154")]
	pub keyGroup: GeneratedId,
}

impl Entity for PublicKeyPutIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2150,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InvoiceDataItem {
	#[serde(rename = "2163")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2164")]
	pub amount: i64,
	#[serde(rename = "2165")]
	pub itemType: i64,
	#[serde(rename = "2166")]
	pub singlePrice: Option<i64>,
	#[serde(rename = "2167")]
	pub totalPrice: i64,
	#[serde(rename = "2168")]
	pub startDate: Option<DateTime>,
	#[serde(rename = "2169")]
	pub endDate: Option<DateTime>,
}

impl Entity for InvoiceDataItem {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2162,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InvoiceDataGetOut {
	#[serde(rename = "2171")]
	pub _format: i64,
	#[serde(rename = "2172")]
	pub invoiceId: GeneratedId,
	#[serde(rename = "2173")]
	pub invoiceType: i64,
	#[serde(rename = "2174")]
	pub date: DateTime,
	#[serde(rename = "2175")]
	pub paymentMethod: i64,
	#[serde(rename = "2176")]
	pub country: String,
	#[serde(rename = "2177")]
	pub address: String,
	#[serde(rename = "2178")]
	pub vatIdNumber: Option<String>,
	#[serde(rename = "2179")]
	pub vatRate: i64,
	#[serde(rename = "2180")]
	pub vat: i64,
	#[serde(rename = "2181")]
	pub subTotal: i64,
	#[serde(rename = "2182")]
	pub grandTotal: i64,
	#[serde(rename = "2183")]
	pub vatType: i64,
	#[serde(rename = "2184")]
	pub items: Vec<InvoiceDataItem>,
}

impl Entity for InvoiceDataGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2170,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InvoiceDataGetIn {
	#[serde(rename = "2186")]
	pub _format: i64,
	#[serde(rename = "2187")]
	pub invoiceNumber: String,
}

impl Entity for InvoiceDataGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2185,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ChangeKdfPostIn {
	#[serde(rename = "2199")]
	pub _format: i64,
	#[serde(rename = "2200")]
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
	#[serde(rename = "2201")]
	#[serde(with = "serde_bytes")]
	pub salt: Vec<u8>,
	#[serde(rename = "2202")]
	#[serde(with = "serde_bytes")]
	pub pwEncUserGroupKey: Vec<u8>,
	#[serde(rename = "2203")]
	#[serde(with = "serde_bytes")]
	pub oldVerifier: Vec<u8>,
	#[serde(rename = "2204")]
	pub kdfVersion: i64,
	#[serde(rename = "2410")]
	pub userGroupKeyVersion: i64,
}

impl Entity for ChangeKdfPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2198,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupKey {
	#[serde(rename = "2257")]
	pub _id: Option<IdTupleCustom>,
	#[serde(rename = "2258")]
	pub _permissions: GeneratedId,
	#[serde(rename = "2259")]
	pub _format: i64,
	#[serde(rename = "2260")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "2261")]
	#[serde(with = "serde_bytes")]
	pub ownerEncGKey: Vec<u8>,
	#[serde(rename = "2262")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "2263")]
	#[serde(with = "serde_bytes")]
	pub adminGroupEncGKey: Option<Vec<u8>>,
	#[serde(rename = "2265")]
	pub adminGroupKeyVersion: Option<i64>,
	#[serde(rename = "2266")]
	pub keyPair: Option<KeyPair>,
	#[serde(rename = "2476")]
	pub pubAdminGroupEncGKey: Option<PubEncKeyData>,
}

impl Entity for GroupKey {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2255,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupKeysRef {
	#[serde(rename = "2268")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2269")]
	pub list: GeneratedId,
}

impl Entity for GroupKeysRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2267,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct KeyRotation {
	#[serde(rename = "2285")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "2286")]
	pub _permissions: GeneratedId,
	#[serde(rename = "2287")]
	pub _format: i64,
	#[serde(rename = "2288")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "2289")]
	pub targetKeyVersion: i64,
	#[serde(rename = "2290")]
	pub groupKeyRotationType: i64,
	#[serde(rename = "2482")]
	pub adminPubKeyMac: Option<KeyMac>,
	#[serde(rename = "2528")]
	pub distEncAdminGroupSymKey: Option<PubEncKeyData>,
	#[serde(rename = "2529")]
	pub distKeyMac: Option<KeyMac>,
	#[serde(rename = "2530")]
	pub adminDistKeyPair: Option<KeyPair>,
}

impl Entity for KeyRotation {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2283,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct KeyRotationsRef {
	#[serde(rename = "2292")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2293")]
	pub list: GeneratedId,
}

impl Entity for KeyRotationsRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2291,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SurveyData {
	#[serde(rename = "2296")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2297")]
	pub category: i64,
	#[serde(rename = "2298")]
	pub reason: i64,
	#[serde(rename = "2299")]
	pub details: Option<String>,
	#[serde(rename = "2300")]
	pub version: i64,
}

impl Entity for SurveyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2295,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct IdTupleWrapper {
	#[serde(rename = "2316")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2317")]
	pub listId: GeneratedId,
	#[serde(rename = "2318")]
	pub listElementId: GeneratedId,
}

impl Entity for IdTupleWrapper {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2315,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserGroupKeyDistribution {
	#[serde(rename = "2322")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "2323")]
	pub _permissions: GeneratedId,
	#[serde(rename = "2324")]
	pub _format: i64,
	#[serde(rename = "2325")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "2326")]
	#[serde(with = "serde_bytes")]
	pub distributionEncUserGroupKey: Vec<u8>,
	#[serde(rename = "2327")]
	pub userGroupKeyVersion: i64,
}

impl Entity for UserGroupKeyDistribution {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2320,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupKeyRotationData {
	#[serde(rename = "2329")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2332")]
	pub groupKeyVersion: i64,
	#[serde(rename = "2333")]
	#[serde(with = "serde_bytes")]
	pub groupEncPreviousGroupKey: Vec<u8>,
	#[serde(rename = "2334")]
	#[serde(with = "serde_bytes")]
	pub adminGroupEncGroupKey: Option<Vec<u8>>,
	#[serde(rename = "2335")]
	pub adminGroupKeyVersion: Option<i64>,
	#[serde(rename = "2336")]
	pub group: GeneratedId,
	#[serde(rename = "2337")]
	pub keyPair: Option<KeyPair>,
	#[serde(rename = "2397")]
	pub groupKeyUpdatesForMembers: Vec<GroupKeyUpdateData>,
	#[serde(rename = "2432")]
	pub groupMembershipUpdateData: Vec<GroupMembershipUpdateData>,
}

impl Entity for GroupKeyRotationData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2328,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupKeyRotationPostIn {
	#[serde(rename = "2339")]
	pub _format: i64,
	#[serde(rename = "2340")]
	pub groupKeyUpdates: Vec<GroupKeyRotationData>,
}

impl Entity for GroupKeyRotationPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2338,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupKeyRotationInfoGetOut {
	#[serde(rename = "2343")]
	pub _format: i64,
	#[serde(rename = "2344")]
	pub userOrAdminGroupKeyRotationScheduled: bool,
	#[serde(rename = "2407")]
	pub groupKeyUpdates: Vec<IdTupleGenerated>,
}

impl Entity for GroupKeyRotationInfoGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2342,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RecoverCodeData {
	#[serde(rename = "2347")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2348")]
	pub userKeyVersion: i64,
	#[serde(rename = "2349")]
	#[serde(with = "serde_bytes")]
	pub recoveryCodeEncUserGroupKey: Vec<u8>,
	#[serde(rename = "2350")]
	#[serde(with = "serde_bytes")]
	pub userEncRecoveryCode: Vec<u8>,
	#[serde(rename = "2351")]
	#[serde(with = "serde_bytes")]
	pub recoveryCodeVerifier: Vec<u8>,
}

impl Entity for RecoverCodeData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2346,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserGroupKeyRotationData {
	#[serde(rename = "2353")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2354")]
	#[serde(with = "serde_bytes")]
	pub passphraseEncUserGroupKey: Vec<u8>,
	#[serde(rename = "2355")]
	#[serde(with = "serde_bytes")]
	pub distributionKeyEncUserGroupKey: Vec<u8>,
	#[serde(rename = "2356")]
	pub userGroupKeyVersion: i64,
	#[serde(rename = "2357")]
	#[serde(with = "serde_bytes")]
	pub userGroupEncPreviousGroupKey: Vec<u8>,
	#[serde(rename = "2359")]
	#[serde(with = "serde_bytes")]
	pub adminGroupEncUserGroupKey: Option<Vec<u8>>,
	#[serde(rename = "2360")]
	pub adminGroupKeyVersion: i64,
	#[serde(rename = "2362")]
	#[serde(with = "serde_bytes")]
	pub authVerifier: Vec<u8>,
	#[serde(rename = "2550")]
	#[serde(with = "serde_bytes")]
	pub userGroupEncAdminGroupKey: Option<Vec<u8>>,
	#[serde(rename = "2358")]
	pub keyPair: KeyPair,
	#[serde(rename = "2361")]
	pub group: GeneratedId,
	#[serde(rename = "2363")]
	pub recoverCodeData: Option<RecoverCodeData>,
	#[serde(rename = "2470")]
	pub pubAdminGroupEncUserGroupKey: Option<PubEncKeyData>,
}

impl Entity for UserGroupKeyRotationData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2352,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AdminGroupKeyRotationPostIn {
	#[serde(rename = "2365")]
	pub _format: i64,
	#[serde(rename = "2366")]
	pub adminGroupKeyData: GroupKeyRotationData,
	#[serde(rename = "2367")]
	pub userGroupKeyData: UserGroupKeyRotationData,
	#[serde(rename = "2483")]
	pub adminPubKeyMacList: Vec<KeyMac>,
	#[serde(rename = "2535")]
	pub distribution: Vec<AdminGroupKeyDistributionElement>,
}

impl Entity for AdminGroupKeyRotationPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2364,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupKeyUpdate {
	#[serde(rename = "2371")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "2372")]
	pub _permissions: GeneratedId,
	#[serde(rename = "2373")]
	pub _format: i64,
	#[serde(rename = "2374")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "2375")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "2376")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "2377")]
	#[serde(with = "serde_bytes")]
	pub groupKey: Vec<u8>,
	#[serde(rename = "2378")]
	pub groupKeyVersion: i64,
	#[serde(rename = "2379")]
	pub bucketKey: BucketKey,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for GroupKeyUpdate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2369,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupKeyUpdatesRef {
	#[serde(rename = "2381")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2382")]
	pub list: GeneratedId,
}

impl Entity for GroupKeyUpdatesRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2380,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PubEncKeyData {
	#[serde(rename = "2385")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2386")]
	pub recipientIdentifier: String,
	#[serde(rename = "2387")]
	#[serde(with = "serde_bytes")]
	pub pubEncSymKey: Vec<u8>,
	#[serde(rename = "2388")]
	pub recipientKeyVersion: i64,
	#[serde(rename = "2389")]
	pub senderKeyVersion: Option<i64>,
	#[serde(rename = "2390")]
	pub protocolVersion: i64,
	#[serde(rename = "2469")]
	pub recipientIdentifierType: i64,
	#[serde(rename = "2551")]
	pub senderIdentifier: Option<String>,
	#[serde(rename = "2552")]
	pub senderIdentifierType: Option<i64>,
	#[serde(rename = "2553")]
	pub symKeyMac: Option<KeyMac>,
}

impl Entity for PubEncKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2384,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupKeyUpdateData {
	#[serde(rename = "2392")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2393")]
	pub sessionKeyEncGroupKeyVersion: i64,
	#[serde(rename = "2394")]
	#[serde(with = "serde_bytes")]
	pub sessionKeyEncGroupKey: Vec<u8>,
	#[serde(rename = "2395")]
	#[serde(with = "serde_bytes")]
	pub bucketKeyEncSessionKey: Vec<u8>,
	#[serde(rename = "2396")]
	pub pubEncBucketKeyData: PubEncKeyData,
}

impl Entity for GroupKeyUpdateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2391,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupMembershipKeyData {
	#[serde(rename = "2399")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2401")]
	pub groupKeyVersion: i64,
	#[serde(rename = "2402")]
	pub symKeyVersion: i64,
	#[serde(rename = "2403")]
	#[serde(with = "serde_bytes")]
	pub symEncGKey: Vec<u8>,
	#[serde(rename = "2400")]
	pub group: GeneratedId,
}

impl Entity for GroupMembershipKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2398,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MembershipPutIn {
	#[serde(rename = "2405")]
	pub _format: i64,
	#[serde(rename = "2406")]
	pub groupKeyUpdates: Vec<GroupMembershipKeyData>,
}

impl Entity for MembershipPutIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2404,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupMembershipUpdateData {
	#[serde(rename = "2428")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2430")]
	#[serde(with = "serde_bytes")]
	pub userEncGroupKey: Vec<u8>,
	#[serde(rename = "2431")]
	pub userKeyVersion: i64,
	#[serde(rename = "2429")]
	pub userId: GeneratedId,
}

impl Entity for GroupMembershipUpdateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2427,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AffiliatePartnerKpiMonthSummary {
	#[serde(rename = "2454")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2455")]
	pub monthTimestamp: i64,
	#[serde(rename = "2456")]
	pub newFree: i64,
	#[serde(rename = "2457")]
	pub newPaid: i64,
	#[serde(rename = "2458")]
	pub totalFree: i64,
	#[serde(rename = "2459")]
	pub totalPaid: i64,
	#[serde(rename = "2460")]
	pub commission: i64,
}

impl Entity for AffiliatePartnerKpiMonthSummary {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2453,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AffiliatePartnerKpiServiceGetOut {
	#[serde(rename = "2462")]
	pub _format: i64,
	#[serde(rename = "2463")]
	pub promotionId: String,
	#[serde(rename = "2464")]
	pub accumulatedCommission: i64,
	#[serde(rename = "2465")]
	pub creditedCommission: i64,
	#[serde(rename = "2466")]
	pub kpis: Vec<AffiliatePartnerKpiMonthSummary>,
}

impl Entity for AffiliatePartnerKpiServiceGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2461,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserGroupKeyRotationPostIn {
	#[serde(rename = "2472")]
	pub _format: i64,
	#[serde(rename = "2473")]
	pub userGroupKeyData: UserGroupKeyRotationData,
}

impl Entity for UserGroupKeyRotationPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2471,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct KeyMac {
	#[serde(rename = "2478")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2480")]
	pub taggedKeyVersion: i64,
	#[serde(rename = "2481")]
	#[serde(with = "serde_bytes")]
	pub tag: Vec<u8>,
	#[serde(rename = "2527")]
	pub taggingKeyVersion: i64,
	#[serde(rename = "2479")]
	pub taggingGroup: GeneratedId,
}

impl Entity for KeyMac {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2477,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AppStoreSubscriptionGetOut {
	#[serde(rename = "2498")]
	pub _format: i64,
	#[serde(rename = "2499")]
	pub app: i64,
}

impl Entity for AppStoreSubscriptionGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2497,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AppStoreSubscriptionGetIn {
	#[serde(rename = "2501")]
	pub _format: i64,
	#[serde(rename = "2502")]
	pub subscriptionId: String,
}

impl Entity for AppStoreSubscriptionGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2500,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct VerifierTokenServiceOut {
	#[serde(rename = "2511")]
	pub _format: i64,
	#[serde(rename = "2512")]
	pub token: String,
}

impl Entity for VerifierTokenServiceOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2510,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct VerifierTokenServiceIn {
	#[serde(rename = "2518")]
	pub _format: i64,
	#[serde(rename = "2519")]
	#[serde(with = "serde_bytes")]
	pub authVerifier: Vec<u8>,
}

impl Entity for VerifierTokenServiceIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2517,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarAdvancedRepeatRule {
	#[serde(rename = "2522")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2523")]
	pub ruleType: i64,
	#[serde(rename = "2524")]
	pub interval: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for CalendarAdvancedRepeatRule {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2521,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AdminGroupKeyDistributionElement {
	#[serde(rename = "2532")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2533")]
	pub userGroupId: GeneratedId,
	#[serde(rename = "2534")]
	pub distEncAdminGroupKey: PubEncKeyData,
}

impl Entity for AdminGroupKeyDistributionElement {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2531,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AdminGroupKeyRotationPutIn {
	#[serde(rename = "2537")]
	pub _format: i64,
	#[serde(rename = "2538")]
	pub distKeyMac: KeyMac,
	#[serde(rename = "2539")]
	pub adminDistKeyPair: KeyPair,
}

impl Entity for AdminGroupKeyRotationPutIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2536,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PubDistributionKey {
	#[serde(rename = "2541")]
	pub _id: Option<CustomId>,
	#[serde(rename = "2544")]
	#[serde(with = "serde_bytes")]
	pub pubEccKey: Vec<u8>,
	#[serde(rename = "2545")]
	#[serde(with = "serde_bytes")]
	pub pubKyberKey: Vec<u8>,
	#[serde(rename = "2542")]
	pub userGroupId: GeneratedId,
	#[serde(rename = "2543")]
	pub pubKeyMac: KeyMac,
}

impl Entity for PubDistributionKey {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2540,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AdminGroupKeyRotationGetOut {
	#[serde(rename = "2547")]
	pub _format: i64,
	#[serde(rename = "2548")]
	pub userGroupIdsMissingDistributionKeys: Vec<GeneratedId>,
	#[serde(rename = "2549")]
	pub distributionKeys: Vec<PubDistributionKey>,
}

impl Entity for AdminGroupKeyRotationGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "sys",
			type_id: 2546,
		}
	}
}
