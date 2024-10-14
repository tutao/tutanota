#![allow(unused_imports, dead_code, unused_variables)]
use crate::entities::sys::AdminGroupKeyRotationPostIn;
use crate::entities::sys::AffiliatePartnerKpiServiceGetOut;
use crate::entities::sys::AlarmServicePost;
use crate::entities::sys::AutoLoginDataDelete;
use crate::entities::sys::AutoLoginDataGet;
use crate::entities::sys::AutoLoginDataReturn;
use crate::entities::sys::AutoLoginPostReturn;
use crate::entities::sys::BrandingDomainData;
use crate::entities::sys::BrandingDomainDeleteData;
use crate::entities::sys::BrandingDomainGetReturn;
use crate::entities::sys::ChangeKdfPostIn;
use crate::entities::sys::ChangePasswordPostIn;
use crate::entities::sys::CloseSessionServicePost;
use crate::entities::sys::CreateCustomerServerPropertiesData;
use crate::entities::sys::CreateCustomerServerPropertiesReturn;
use crate::entities::sys::CreateSessionData;
use crate::entities::sys::CreateSessionReturn;
use crate::entities::sys::CustomDomainCheckGetIn;
use crate::entities::sys::CustomDomainCheckGetOut;
use crate::entities::sys::CustomDomainData;
use crate::entities::sys::CustomDomainReturn;
use crate::entities::sys::CustomerAccountTerminationPostIn;
use crate::entities::sys::CustomerAccountTerminationPostOut;
use crate::entities::sys::DebitServicePutData;
use crate::entities::sys::DeleteCustomerData;
use crate::entities::sys::DomainMailAddressAvailabilityData;
use crate::entities::sys::DomainMailAddressAvailabilityReturn;
use crate::entities::sys::ExternalPropertiesReturn;
use crate::entities::sys::GiftCardCreateData;
use crate::entities::sys::GiftCardCreateReturn;
use crate::entities::sys::GiftCardDeleteData;
use crate::entities::sys::GiftCardGetReturn;
use crate::entities::sys::GiftCardRedeemData;
use crate::entities::sys::GiftCardRedeemGetReturn;
use crate::entities::sys::GroupKeyRotationInfoGetOut;
use crate::entities::sys::GroupKeyRotationPostIn;
use crate::entities::sys::InvoiceDataGetIn;
use crate::entities::sys::InvoiceDataGetOut;
use crate::entities::sys::LocationServiceGetReturn;
use crate::entities::sys::MailAddressAliasGetIn;
use crate::entities::sys::MailAddressAliasServiceData;
use crate::entities::sys::MailAddressAliasServiceDataDelete;
use crate::entities::sys::MailAddressAliasServiceReturn;
use crate::entities::sys::MembershipAddData;
use crate::entities::sys::MembershipPutIn;
use crate::entities::sys::MembershipRemoveData;
use crate::entities::sys::MultipleMailAddressAvailabilityData;
use crate::entities::sys::MultipleMailAddressAvailabilityReturn;
use crate::entities::sys::PaymentDataServiceGetData;
use crate::entities::sys::PaymentDataServiceGetReturn;
use crate::entities::sys::PaymentDataServicePostData;
use crate::entities::sys::PaymentDataServicePutData;
use crate::entities::sys::PaymentDataServicePutReturn;
use crate::entities::sys::PlanServiceGetOut;
use crate::entities::sys::PriceServiceData;
use crate::entities::sys::PriceServiceReturn;
use crate::entities::sys::PublicKeyGetIn;
use crate::entities::sys::PublicKeyGetOut;
use crate::entities::sys::PublicKeyPutIn;
use crate::entities::sys::ReferralCodeGetIn;
use crate::entities::sys::ReferralCodePostIn;
use crate::entities::sys::ReferralCodePostOut;
use crate::entities::sys::RegistrationCaptchaServiceData;
use crate::entities::sys::RegistrationCaptchaServiceGetData;
use crate::entities::sys::RegistrationCaptchaServiceReturn;
use crate::entities::sys::RegistrationReturn;
use crate::entities::sys::RegistrationServiceData;
use crate::entities::sys::ResetFactorsDeleteData;
use crate::entities::sys::ResetPasswordPostIn;
use crate::entities::sys::SaltData;
use crate::entities::sys::SaltReturn;
use crate::entities::sys::SecondFactorAuthAllowedReturn;
use crate::entities::sys::SecondFactorAuthData;
use crate::entities::sys::SecondFactorAuthDeleteData;
use crate::entities::sys::SecondFactorAuthGetData;
use crate::entities::sys::SecondFactorAuthGetReturn;
use crate::entities::sys::SignOrderProcessingAgreementData;
use crate::entities::sys::SwitchAccountTypePostIn;
use crate::entities::sys::SystemKeysReturn;
use crate::entities::sys::TakeOverDeletedAddressData;
use crate::entities::sys::UpdatePermissionKeyData;
use crate::entities::sys::UpdateSessionKeysPostIn;
use crate::entities::sys::UpgradePriceServiceData;
use crate::entities::sys::UpgradePriceServiceReturn;
use crate::entities::sys::UserDataDelete;
use crate::entities::sys::UserGroupKeyRotationPostIn;
use crate::entities::sys::VersionData;
use crate::entities::sys::VersionReturn;
use crate::entities::Entity;
use crate::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::services::{
	DeleteService, Executor, ExtraServiceParams, GetService, PostService, PutService, Service,
};
use crate::ApiCallError;
pub struct AdminGroupKeyRotationService;

crate::service_impl!(
	declare,
	AdminGroupKeyRotationService,
	"sys/admingroupkeyrotationservice",
	111
);
crate::service_impl!(
	POST,
	AdminGroupKeyRotationService,
	AdminGroupKeyRotationPostIn,
	()
);

pub struct AffiliatePartnerKpiService;

crate::service_impl!(
	declare,
	AffiliatePartnerKpiService,
	"sys/affiliatepartnerkpiservice",
	111
);
crate::service_impl!(
	GET,
	AffiliatePartnerKpiService,
	(),
	AffiliatePartnerKpiServiceGetOut
);

pub struct AlarmService;

crate::service_impl!(declare, AlarmService, "sys/alarmservice", 111);
crate::service_impl!(POST, AlarmService, AlarmServicePost, ());

pub struct AutoLoginService;

crate::service_impl!(declare, AutoLoginService, "sys/autologinservice", 111);
crate::service_impl!(
	POST,
	AutoLoginService,
	AutoLoginDataReturn,
	AutoLoginPostReturn
);
crate::service_impl!(GET, AutoLoginService, AutoLoginDataGet, AutoLoginDataReturn);
crate::service_impl!(DELETE, AutoLoginService, AutoLoginDataDelete, ());

pub struct BrandingDomainService;

crate::service_impl!(
	declare,
	BrandingDomainService,
	"sys/brandingdomainservice",
	111
);
crate::service_impl!(POST, BrandingDomainService, BrandingDomainData, ());
crate::service_impl!(GET, BrandingDomainService, (), BrandingDomainGetReturn);
crate::service_impl!(PUT, BrandingDomainService, BrandingDomainData, ());
crate::service_impl!(DELETE, BrandingDomainService, BrandingDomainDeleteData, ());

pub struct ChangeKdfService;

crate::service_impl!(declare, ChangeKdfService, "sys/changekdfservice", 111);
crate::service_impl!(POST, ChangeKdfService, ChangeKdfPostIn, ());

pub struct ChangePasswordService;

crate::service_impl!(
	declare,
	ChangePasswordService,
	"sys/changepasswordservice",
	111
);
crate::service_impl!(POST, ChangePasswordService, ChangePasswordPostIn, ());

pub struct CloseSessionService;

crate::service_impl!(declare, CloseSessionService, "sys/closesessionservice", 111);
crate::service_impl!(POST, CloseSessionService, CloseSessionServicePost, ());

pub struct CreateCustomerServerProperties;

crate::service_impl!(
	declare,
	CreateCustomerServerProperties,
	"sys/createcustomerserverproperties",
	111
);
crate::service_impl!(
	POST,
	CreateCustomerServerProperties,
	CreateCustomerServerPropertiesData,
	CreateCustomerServerPropertiesReturn
);

pub struct CustomDomainCheckService;

crate::service_impl!(
	declare,
	CustomDomainCheckService,
	"sys/customdomaincheckservice",
	111
);
crate::service_impl!(
	GET,
	CustomDomainCheckService,
	CustomDomainCheckGetIn,
	CustomDomainCheckGetOut
);

pub struct CustomDomainService;

crate::service_impl!(declare, CustomDomainService, "sys/customdomainservice", 111);
crate::service_impl!(
	POST,
	CustomDomainService,
	CustomDomainData,
	CustomDomainReturn
);
crate::service_impl!(PUT, CustomDomainService, CustomDomainData, ());
crate::service_impl!(DELETE, CustomDomainService, CustomDomainData, ());

pub struct CustomerAccountTerminationService;

crate::service_impl!(
	declare,
	CustomerAccountTerminationService,
	"sys/customeraccountterminationservice",
	111
);
crate::service_impl!(
	POST,
	CustomerAccountTerminationService,
	CustomerAccountTerminationPostIn,
	CustomerAccountTerminationPostOut
);

pub struct CustomerPublicKeyService;

crate::service_impl!(
	declare,
	CustomerPublicKeyService,
	"sys/customerpublickeyservice",
	111
);
crate::service_impl!(GET, CustomerPublicKeyService, (), PublicKeyGetOut);

pub struct CustomerService;

crate::service_impl!(declare, CustomerService, "sys/customerservice", 111);
crate::service_impl!(DELETE, CustomerService, DeleteCustomerData, ());

pub struct DebitService;

crate::service_impl!(declare, DebitService, "sys/debitservice", 111);
crate::service_impl!(PUT, DebitService, DebitServicePutData, ());

pub struct DomainMailAddressAvailabilityService;

crate::service_impl!(
	declare,
	DomainMailAddressAvailabilityService,
	"sys/domainmailaddressavailabilityservice",
	111
);
crate::service_impl!(
	GET,
	DomainMailAddressAvailabilityService,
	DomainMailAddressAvailabilityData,
	DomainMailAddressAvailabilityReturn
);

pub struct ExternalPropertiesService;

crate::service_impl!(
	declare,
	ExternalPropertiesService,
	"sys/externalpropertiesservice",
	111
);
crate::service_impl!(GET, ExternalPropertiesService, (), ExternalPropertiesReturn);

pub struct GiftCardRedeemService;

crate::service_impl!(
	declare,
	GiftCardRedeemService,
	"sys/giftcardredeemservice",
	111
);
crate::service_impl!(POST, GiftCardRedeemService, GiftCardRedeemData, ());
crate::service_impl!(
	GET,
	GiftCardRedeemService,
	GiftCardRedeemData,
	GiftCardRedeemGetReturn
);

pub struct GiftCardService;

crate::service_impl!(declare, GiftCardService, "sys/giftcardservice", 111);
crate::service_impl!(
	POST,
	GiftCardService,
	GiftCardCreateData,
	GiftCardCreateReturn
);
crate::service_impl!(GET, GiftCardService, (), GiftCardGetReturn);
crate::service_impl!(DELETE, GiftCardService, GiftCardDeleteData, ());

pub struct GroupKeyRotationInfoService;

crate::service_impl!(
	declare,
	GroupKeyRotationInfoService,
	"sys/groupkeyrotationinfoservice",
	111
);
crate::service_impl!(
	GET,
	GroupKeyRotationInfoService,
	(),
	GroupKeyRotationInfoGetOut
);

pub struct GroupKeyRotationService;

crate::service_impl!(
	declare,
	GroupKeyRotationService,
	"sys/groupkeyrotationservice",
	111
);
crate::service_impl!(POST, GroupKeyRotationService, GroupKeyRotationPostIn, ());

pub struct InvoiceDataService;

crate::service_impl!(declare, InvoiceDataService, "sys/invoicedataservice", 111);
crate::service_impl!(GET, InvoiceDataService, InvoiceDataGetIn, InvoiceDataGetOut);

pub struct LocationService;

crate::service_impl!(declare, LocationService, "sys/locationservice", 111);
crate::service_impl!(GET, LocationService, (), LocationServiceGetReturn);

pub struct MailAddressAliasService;

crate::service_impl!(
	declare,
	MailAddressAliasService,
	"sys/mailaddressaliasservice",
	111
);
crate::service_impl!(
	POST,
	MailAddressAliasService,
	MailAddressAliasServiceData,
	()
);
crate::service_impl!(
	GET,
	MailAddressAliasService,
	MailAddressAliasGetIn,
	MailAddressAliasServiceReturn
);
crate::service_impl!(
	DELETE,
	MailAddressAliasService,
	MailAddressAliasServiceDataDelete,
	()
);

pub struct MembershipService;

crate::service_impl!(declare, MembershipService, "sys/membershipservice", 111);
crate::service_impl!(POST, MembershipService, MembershipAddData, ());
crate::service_impl!(PUT, MembershipService, MembershipPutIn, ());
crate::service_impl!(DELETE, MembershipService, MembershipRemoveData, ());

pub struct MultipleMailAddressAvailabilityService;

crate::service_impl!(
	declare,
	MultipleMailAddressAvailabilityService,
	"sys/multiplemailaddressavailabilityservice",
	111
);
crate::service_impl!(
	GET,
	MultipleMailAddressAvailabilityService,
	MultipleMailAddressAvailabilityData,
	MultipleMailAddressAvailabilityReturn
);

pub struct PaymentDataService;

crate::service_impl!(declare, PaymentDataService, "sys/paymentdataservice", 111);
crate::service_impl!(POST, PaymentDataService, PaymentDataServicePostData, ());
crate::service_impl!(
	GET,
	PaymentDataService,
	PaymentDataServiceGetData,
	PaymentDataServiceGetReturn
);
crate::service_impl!(
	PUT,
	PaymentDataService,
	PaymentDataServicePutData,
	PaymentDataServicePutReturn
);

pub struct PlanService;

crate::service_impl!(declare, PlanService, "sys/planservice", 111);
crate::service_impl!(GET, PlanService, (), PlanServiceGetOut);

pub struct PriceService;

crate::service_impl!(declare, PriceService, "sys/priceservice", 111);
crate::service_impl!(GET, PriceService, PriceServiceData, PriceServiceReturn);

pub struct PublicKeyService;

crate::service_impl!(declare, PublicKeyService, "sys/publickeyservice", 111);
crate::service_impl!(GET, PublicKeyService, PublicKeyGetIn, PublicKeyGetOut);
crate::service_impl!(PUT, PublicKeyService, PublicKeyPutIn, ());

pub struct ReferralCodeService;

crate::service_impl!(declare, ReferralCodeService, "sys/referralcodeservice", 111);
crate::service_impl!(
	POST,
	ReferralCodeService,
	ReferralCodePostIn,
	ReferralCodePostOut
);
crate::service_impl!(GET, ReferralCodeService, ReferralCodeGetIn, ());

pub struct RegistrationCaptchaService;

crate::service_impl!(
	declare,
	RegistrationCaptchaService,
	"sys/registrationcaptchaservice",
	111
);
crate::service_impl!(
	POST,
	RegistrationCaptchaService,
	RegistrationCaptchaServiceData,
	()
);
crate::service_impl!(
	GET,
	RegistrationCaptchaService,
	RegistrationCaptchaServiceGetData,
	RegistrationCaptchaServiceReturn
);

pub struct RegistrationService;

crate::service_impl!(declare, RegistrationService, "sys/registrationservice", 111);
crate::service_impl!(
	POST,
	RegistrationService,
	RegistrationServiceData,
	RegistrationReturn
);
crate::service_impl!(GET, RegistrationService, (), RegistrationServiceData);

pub struct ResetFactorsService;

crate::service_impl!(declare, ResetFactorsService, "sys/resetfactorsservice", 111);
crate::service_impl!(DELETE, ResetFactorsService, ResetFactorsDeleteData, ());

pub struct ResetPasswordService;

crate::service_impl!(
	declare,
	ResetPasswordService,
	"sys/resetpasswordservice",
	111
);
crate::service_impl!(POST, ResetPasswordService, ResetPasswordPostIn, ());

pub struct SaltService;

crate::service_impl!(declare, SaltService, "sys/saltservice", 111);
crate::service_impl!(GET, SaltService, SaltData, SaltReturn);

pub struct SecondFactorAuthAllowedService;

crate::service_impl!(
	declare,
	SecondFactorAuthAllowedService,
	"sys/secondfactorauthallowedservice",
	111
);
crate::service_impl!(
	GET,
	SecondFactorAuthAllowedService,
	(),
	SecondFactorAuthAllowedReturn
);

pub struct SecondFactorAuthService;

crate::service_impl!(
	declare,
	SecondFactorAuthService,
	"sys/secondfactorauthservice",
	111
);
crate::service_impl!(POST, SecondFactorAuthService, SecondFactorAuthData, ());
crate::service_impl!(
	GET,
	SecondFactorAuthService,
	SecondFactorAuthGetData,
	SecondFactorAuthGetReturn
);
crate::service_impl!(
	DELETE,
	SecondFactorAuthService,
	SecondFactorAuthDeleteData,
	()
);

pub struct SessionService;

crate::service_impl!(declare, SessionService, "sys/sessionservice", 111);
crate::service_impl!(POST, SessionService, CreateSessionData, CreateSessionReturn);

pub struct SignOrderProcessingAgreementService;

crate::service_impl!(
	declare,
	SignOrderProcessingAgreementService,
	"sys/signorderprocessingagreementservice",
	111
);
crate::service_impl!(
	POST,
	SignOrderProcessingAgreementService,
	SignOrderProcessingAgreementData,
	()
);

pub struct SwitchAccountTypeService;

crate::service_impl!(
	declare,
	SwitchAccountTypeService,
	"sys/switchaccounttypeservice",
	111
);
crate::service_impl!(POST, SwitchAccountTypeService, SwitchAccountTypePostIn, ());

pub struct SystemKeysService;

crate::service_impl!(declare, SystemKeysService, "sys/systemkeysservice", 111);
crate::service_impl!(GET, SystemKeysService, (), SystemKeysReturn);

pub struct TakeOverDeletedAddressService;

crate::service_impl!(
	declare,
	TakeOverDeletedAddressService,
	"sys/takeoverdeletedaddressservice",
	111
);
crate::service_impl!(
	POST,
	TakeOverDeletedAddressService,
	TakeOverDeletedAddressData,
	()
);

pub struct UpdatePermissionKeyService;

crate::service_impl!(
	declare,
	UpdatePermissionKeyService,
	"sys/updatepermissionkeyservice",
	111
);
crate::service_impl!(
	POST,
	UpdatePermissionKeyService,
	UpdatePermissionKeyData,
	()
);

pub struct UpdateSessionKeysService;

crate::service_impl!(
	declare,
	UpdateSessionKeysService,
	"sys/updatesessionkeysservice",
	111
);
crate::service_impl!(POST, UpdateSessionKeysService, UpdateSessionKeysPostIn, ());

pub struct UpgradePriceService;

crate::service_impl!(declare, UpgradePriceService, "sys/upgradepriceservice", 111);
crate::service_impl!(
	GET,
	UpgradePriceService,
	UpgradePriceServiceData,
	UpgradePriceServiceReturn
);

pub struct UserGroupKeyRotationService;

crate::service_impl!(
	declare,
	UserGroupKeyRotationService,
	"sys/usergroupkeyrotationservice",
	111
);
crate::service_impl!(
	POST,
	UserGroupKeyRotationService,
	UserGroupKeyRotationPostIn,
	()
);

pub struct UserService;

crate::service_impl!(declare, UserService, "sys/userservice", 111);
crate::service_impl!(DELETE, UserService, UserDataDelete, ());

pub struct VersionService;

crate::service_impl!(declare, VersionService, "sys/versionservice", 111);
crate::service_impl!(GET, VersionService, VersionData, VersionReturn);
