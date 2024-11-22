// @generated
#![allow(unused_imports, dead_code, unused_variables)]
use crate::ApiCallError;
use crate::entities::Entity;
use crate::services::{PostService, GetService, PutService, DeleteService, Service, Executor, ExtraServiceParams};
use crate::bindings::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::entities::generated::sys::AdminGroupKeyRotationPostIn;
use crate::entities::generated::sys::AffiliatePartnerKpiServiceGetOut;
use crate::entities::generated::sys::AlarmServicePost;
use crate::entities::generated::sys::AppStoreSubscriptionGetIn;
use crate::entities::generated::sys::AppStoreSubscriptionGetOut;
use crate::entities::generated::sys::AutoLoginDataReturn;
use crate::entities::generated::sys::AutoLoginPostReturn;
use crate::entities::generated::sys::AutoLoginDataGet;
use crate::entities::generated::sys::AutoLoginDataDelete;
use crate::entities::generated::sys::BrandingDomainData;
use crate::entities::generated::sys::BrandingDomainGetReturn;
use crate::entities::generated::sys::BrandingDomainDeleteData;
use crate::entities::generated::sys::ChangeKdfPostIn;
use crate::entities::generated::sys::ChangePasswordPostIn;
use crate::entities::generated::sys::CloseSessionServicePost;
use crate::entities::generated::sys::CreateCustomerServerPropertiesData;
use crate::entities::generated::sys::CreateCustomerServerPropertiesReturn;
use crate::entities::generated::sys::CustomDomainCheckGetIn;
use crate::entities::generated::sys::CustomDomainCheckGetOut;
use crate::entities::generated::sys::CustomDomainData;
use crate::entities::generated::sys::CustomDomainReturn;
use crate::entities::generated::sys::CustomerAccountTerminationPostIn;
use crate::entities::generated::sys::CustomerAccountTerminationPostOut;
use crate::entities::generated::sys::PublicKeyGetOut;
use crate::entities::generated::sys::DeleteCustomerData;
use crate::entities::generated::sys::DebitServicePutData;
use crate::entities::generated::sys::DomainMailAddressAvailabilityData;
use crate::entities::generated::sys::DomainMailAddressAvailabilityReturn;
use crate::entities::generated::sys::ExternalPropertiesReturn;
use crate::entities::generated::sys::GiftCardRedeemData;
use crate::entities::generated::sys::GiftCardRedeemGetReturn;
use crate::entities::generated::sys::GiftCardCreateData;
use crate::entities::generated::sys::GiftCardCreateReturn;
use crate::entities::generated::sys::GiftCardGetReturn;
use crate::entities::generated::sys::GiftCardDeleteData;
use crate::entities::generated::sys::GroupKeyRotationInfoGetOut;
use crate::entities::generated::sys::GroupKeyRotationPostIn;
use crate::entities::generated::sys::InvoiceDataGetIn;
use crate::entities::generated::sys::InvoiceDataGetOut;
use crate::entities::generated::sys::LocalAdminRemovalPostIn;
use crate::entities::generated::sys::LocationServiceGetReturn;
use crate::entities::generated::sys::MailAddressAliasServiceData;
use crate::entities::generated::sys::MailAddressAliasGetIn;
use crate::entities::generated::sys::MailAddressAliasServiceReturn;
use crate::entities::generated::sys::MailAddressAliasServiceDataDelete;
use crate::entities::generated::sys::MembershipAddData;
use crate::entities::generated::sys::MembershipPutIn;
use crate::entities::generated::sys::MembershipRemoveData;
use crate::entities::generated::sys::MultipleMailAddressAvailabilityData;
use crate::entities::generated::sys::MultipleMailAddressAvailabilityReturn;
use crate::entities::generated::sys::PaymentDataServicePostData;
use crate::entities::generated::sys::PaymentDataServiceGetData;
use crate::entities::generated::sys::PaymentDataServiceGetReturn;
use crate::entities::generated::sys::PaymentDataServicePutData;
use crate::entities::generated::sys::PaymentDataServicePutReturn;
use crate::entities::generated::sys::PlanServiceGetOut;
use crate::entities::generated::sys::PriceServiceData;
use crate::entities::generated::sys::PriceServiceReturn;
use crate::entities::generated::sys::PublicKeyGetIn;
use crate::entities::generated::sys::PublicKeyPutIn;
use crate::entities::generated::sys::ReferralCodePostIn;
use crate::entities::generated::sys::ReferralCodePostOut;
use crate::entities::generated::sys::ReferralCodeGetIn;
use crate::entities::generated::sys::RegistrationCaptchaServiceData;
use crate::entities::generated::sys::RegistrationCaptchaServiceGetData;
use crate::entities::generated::sys::RegistrationCaptchaServiceReturn;
use crate::entities::generated::sys::RegistrationServiceData;
use crate::entities::generated::sys::RegistrationReturn;
use crate::entities::generated::sys::ResetFactorsDeleteData;
use crate::entities::generated::sys::ResetPasswordPostIn;
use crate::entities::generated::sys::SaltData;
use crate::entities::generated::sys::SaltReturn;
use crate::entities::generated::sys::SecondFactorAuthAllowedReturn;
use crate::entities::generated::sys::SecondFactorAuthData;
use crate::entities::generated::sys::SecondFactorAuthGetData;
use crate::entities::generated::sys::SecondFactorAuthGetReturn;
use crate::entities::generated::sys::SecondFactorAuthDeleteData;
use crate::entities::generated::sys::CreateSessionData;
use crate::entities::generated::sys::CreateSessionReturn;
use crate::entities::generated::sys::SignOrderProcessingAgreementData;
use crate::entities::generated::sys::SwitchAccountTypePostIn;
use crate::entities::generated::sys::SystemKeysReturn;
use crate::entities::generated::sys::TakeOverDeletedAddressData;
use crate::entities::generated::sys::UpdatePermissionKeyData;
use crate::entities::generated::sys::UpdateSessionKeysPostIn;
use crate::entities::generated::sys::UpgradePriceServiceData;
use crate::entities::generated::sys::UpgradePriceServiceReturn;
use crate::entities::generated::sys::UserGroupKeyRotationPostIn;
use crate::entities::generated::sys::UserDataDelete;
use crate::entities::generated::sys::VersionData;
use crate::entities::generated::sys::VersionReturn;
pub struct AdminGroupKeyRotationService;

crate::service_impl!(declare, AdminGroupKeyRotationService, "sys/admingroupkeyrotationservice", 116);
crate::service_impl!(POST, AdminGroupKeyRotationService, AdminGroupKeyRotationPostIn, ());


pub struct AffiliatePartnerKpiService;

crate::service_impl!(declare, AffiliatePartnerKpiService, "sys/affiliatepartnerkpiservice", 116);
crate::service_impl!(GET, AffiliatePartnerKpiService, (), AffiliatePartnerKpiServiceGetOut);


pub struct AlarmService;

crate::service_impl!(declare, AlarmService, "sys/alarmservice", 116);
crate::service_impl!(POST, AlarmService, AlarmServicePost, ());


pub struct AppStoreSubscriptionService;

crate::service_impl!(declare, AppStoreSubscriptionService, "sys/appstoresubscriptionservice", 116);
crate::service_impl!(GET, AppStoreSubscriptionService, AppStoreSubscriptionGetIn, AppStoreSubscriptionGetOut);


pub struct AutoLoginService;

crate::service_impl!(declare, AutoLoginService, "sys/autologinservice", 116);
crate::service_impl!(POST, AutoLoginService, AutoLoginDataReturn, AutoLoginPostReturn);
crate::service_impl!(GET, AutoLoginService, AutoLoginDataGet, AutoLoginDataReturn);
crate::service_impl!(DELETE, AutoLoginService, AutoLoginDataDelete, ());


pub struct BrandingDomainService;

crate::service_impl!(declare, BrandingDomainService, "sys/brandingdomainservice", 116);
crate::service_impl!(POST, BrandingDomainService, BrandingDomainData, ());
crate::service_impl!(GET, BrandingDomainService, (), BrandingDomainGetReturn);
crate::service_impl!(PUT, BrandingDomainService, BrandingDomainData, ());
crate::service_impl!(DELETE, BrandingDomainService, BrandingDomainDeleteData, ());


pub struct ChangeKdfService;

crate::service_impl!(declare, ChangeKdfService, "sys/changekdfservice", 116);
crate::service_impl!(POST, ChangeKdfService, ChangeKdfPostIn, ());


pub struct ChangePasswordService;

crate::service_impl!(declare, ChangePasswordService, "sys/changepasswordservice", 116);
crate::service_impl!(POST, ChangePasswordService, ChangePasswordPostIn, ());


pub struct CloseSessionService;

crate::service_impl!(declare, CloseSessionService, "sys/closesessionservice", 116);
crate::service_impl!(POST, CloseSessionService, CloseSessionServicePost, ());


pub struct CreateCustomerServerProperties;

crate::service_impl!(declare, CreateCustomerServerProperties, "sys/createcustomerserverproperties", 116);
crate::service_impl!(POST, CreateCustomerServerProperties, CreateCustomerServerPropertiesData, CreateCustomerServerPropertiesReturn);


pub struct CustomDomainCheckService;

crate::service_impl!(declare, CustomDomainCheckService, "sys/customdomaincheckservice", 116);
crate::service_impl!(GET, CustomDomainCheckService, CustomDomainCheckGetIn, CustomDomainCheckGetOut);


pub struct CustomDomainService;

crate::service_impl!(declare, CustomDomainService, "sys/customdomainservice", 116);
crate::service_impl!(POST, CustomDomainService, CustomDomainData, CustomDomainReturn);
crate::service_impl!(PUT, CustomDomainService, CustomDomainData, ());
crate::service_impl!(DELETE, CustomDomainService, CustomDomainData, ());


pub struct CustomerAccountTerminationService;

crate::service_impl!(declare, CustomerAccountTerminationService, "sys/customeraccountterminationservice", 116);
crate::service_impl!(POST, CustomerAccountTerminationService, CustomerAccountTerminationPostIn, CustomerAccountTerminationPostOut);


pub struct CustomerPublicKeyService;

crate::service_impl!(declare, CustomerPublicKeyService, "sys/customerpublickeyservice", 116);
crate::service_impl!(GET, CustomerPublicKeyService, (), PublicKeyGetOut);


pub struct CustomerService;

crate::service_impl!(declare, CustomerService, "sys/customerservice", 116);
crate::service_impl!(DELETE, CustomerService, DeleteCustomerData, ());


pub struct DebitService;

crate::service_impl!(declare, DebitService, "sys/debitservice", 116);
crate::service_impl!(PUT, DebitService, DebitServicePutData, ());


pub struct DomainMailAddressAvailabilityService;

crate::service_impl!(declare, DomainMailAddressAvailabilityService, "sys/domainmailaddressavailabilityservice", 116);
crate::service_impl!(GET, DomainMailAddressAvailabilityService, DomainMailAddressAvailabilityData, DomainMailAddressAvailabilityReturn);


pub struct ExternalPropertiesService;

crate::service_impl!(declare, ExternalPropertiesService, "sys/externalpropertiesservice", 116);
crate::service_impl!(GET, ExternalPropertiesService, (), ExternalPropertiesReturn);


pub struct GiftCardRedeemService;

crate::service_impl!(declare, GiftCardRedeemService, "sys/giftcardredeemservice", 116);
crate::service_impl!(POST, GiftCardRedeemService, GiftCardRedeemData, ());
crate::service_impl!(GET, GiftCardRedeemService, GiftCardRedeemData, GiftCardRedeemGetReturn);


pub struct GiftCardService;

crate::service_impl!(declare, GiftCardService, "sys/giftcardservice", 116);
crate::service_impl!(POST, GiftCardService, GiftCardCreateData, GiftCardCreateReturn);
crate::service_impl!(GET, GiftCardService, (), GiftCardGetReturn);
crate::service_impl!(DELETE, GiftCardService, GiftCardDeleteData, ());


pub struct GroupKeyRotationInfoService;

crate::service_impl!(declare, GroupKeyRotationInfoService, "sys/groupkeyrotationinfoservice", 116);
crate::service_impl!(GET, GroupKeyRotationInfoService, (), GroupKeyRotationInfoGetOut);


pub struct GroupKeyRotationService;

crate::service_impl!(declare, GroupKeyRotationService, "sys/groupkeyrotationservice", 116);
crate::service_impl!(POST, GroupKeyRotationService, GroupKeyRotationPostIn, ());


pub struct InvoiceDataService;

crate::service_impl!(declare, InvoiceDataService, "sys/invoicedataservice", 116);
crate::service_impl!(GET, InvoiceDataService, InvoiceDataGetIn, InvoiceDataGetOut);


pub struct LocalAdminRemovalService;

crate::service_impl!(declare, LocalAdminRemovalService, "sys/localadminremovalservice", 116);
crate::service_impl!(POST, LocalAdminRemovalService, LocalAdminRemovalPostIn, ());


pub struct LocationService;

crate::service_impl!(declare, LocationService, "sys/locationservice", 116);
crate::service_impl!(GET, LocationService, (), LocationServiceGetReturn);


pub struct MailAddressAliasService;

crate::service_impl!(declare, MailAddressAliasService, "sys/mailaddressaliasservice", 116);
crate::service_impl!(POST, MailAddressAliasService, MailAddressAliasServiceData, ());
crate::service_impl!(GET, MailAddressAliasService, MailAddressAliasGetIn, MailAddressAliasServiceReturn);
crate::service_impl!(DELETE, MailAddressAliasService, MailAddressAliasServiceDataDelete, ());


pub struct MembershipService;

crate::service_impl!(declare, MembershipService, "sys/membershipservice", 116);
crate::service_impl!(POST, MembershipService, MembershipAddData, ());
crate::service_impl!(PUT, MembershipService, MembershipPutIn, ());
crate::service_impl!(DELETE, MembershipService, MembershipRemoveData, ());


pub struct MultipleMailAddressAvailabilityService;

crate::service_impl!(declare, MultipleMailAddressAvailabilityService, "sys/multiplemailaddressavailabilityservice", 116);
crate::service_impl!(GET, MultipleMailAddressAvailabilityService, MultipleMailAddressAvailabilityData, MultipleMailAddressAvailabilityReturn);


pub struct PaymentDataService;

crate::service_impl!(declare, PaymentDataService, "sys/paymentdataservice", 116);
crate::service_impl!(POST, PaymentDataService, PaymentDataServicePostData, ());
crate::service_impl!(GET, PaymentDataService, PaymentDataServiceGetData, PaymentDataServiceGetReturn);
crate::service_impl!(PUT, PaymentDataService, PaymentDataServicePutData, PaymentDataServicePutReturn);


pub struct PlanService;

crate::service_impl!(declare, PlanService, "sys/planservice", 116);
crate::service_impl!(GET, PlanService, (), PlanServiceGetOut);


pub struct PriceService;

crate::service_impl!(declare, PriceService, "sys/priceservice", 116);
crate::service_impl!(GET, PriceService, PriceServiceData, PriceServiceReturn);


pub struct PublicKeyService;

crate::service_impl!(declare, PublicKeyService, "sys/publickeyservice", 116);
crate::service_impl!(GET, PublicKeyService, PublicKeyGetIn, PublicKeyGetOut);
crate::service_impl!(PUT, PublicKeyService, PublicKeyPutIn, ());


pub struct ReferralCodeService;

crate::service_impl!(declare, ReferralCodeService, "sys/referralcodeservice", 116);
crate::service_impl!(POST, ReferralCodeService, ReferralCodePostIn, ReferralCodePostOut);
crate::service_impl!(GET, ReferralCodeService, ReferralCodeGetIn, ());


pub struct RegistrationCaptchaService;

crate::service_impl!(declare, RegistrationCaptchaService, "sys/registrationcaptchaservice", 116);
crate::service_impl!(POST, RegistrationCaptchaService, RegistrationCaptchaServiceData, ());
crate::service_impl!(GET, RegistrationCaptchaService, RegistrationCaptchaServiceGetData, RegistrationCaptchaServiceReturn);


pub struct RegistrationService;

crate::service_impl!(declare, RegistrationService, "sys/registrationservice", 116);
crate::service_impl!(POST, RegistrationService, RegistrationServiceData, RegistrationReturn);
crate::service_impl!(GET, RegistrationService, (), RegistrationServiceData);


pub struct ResetFactorsService;

crate::service_impl!(declare, ResetFactorsService, "sys/resetfactorsservice", 116);
crate::service_impl!(DELETE, ResetFactorsService, ResetFactorsDeleteData, ());


pub struct ResetPasswordService;

crate::service_impl!(declare, ResetPasswordService, "sys/resetpasswordservice", 116);
crate::service_impl!(POST, ResetPasswordService, ResetPasswordPostIn, ());


pub struct SaltService;

crate::service_impl!(declare, SaltService, "sys/saltservice", 116);
crate::service_impl!(GET, SaltService, SaltData, SaltReturn);


pub struct SecondFactorAuthAllowedService;

crate::service_impl!(declare, SecondFactorAuthAllowedService, "sys/secondfactorauthallowedservice", 116);
crate::service_impl!(GET, SecondFactorAuthAllowedService, (), SecondFactorAuthAllowedReturn);


pub struct SecondFactorAuthService;

crate::service_impl!(declare, SecondFactorAuthService, "sys/secondfactorauthservice", 116);
crate::service_impl!(POST, SecondFactorAuthService, SecondFactorAuthData, ());
crate::service_impl!(GET, SecondFactorAuthService, SecondFactorAuthGetData, SecondFactorAuthGetReturn);
crate::service_impl!(DELETE, SecondFactorAuthService, SecondFactorAuthDeleteData, ());


pub struct SessionService;

crate::service_impl!(declare, SessionService, "sys/sessionservice", 116);
crate::service_impl!(POST, SessionService, CreateSessionData, CreateSessionReturn);


pub struct SignOrderProcessingAgreementService;

crate::service_impl!(declare, SignOrderProcessingAgreementService, "sys/signorderprocessingagreementservice", 116);
crate::service_impl!(POST, SignOrderProcessingAgreementService, SignOrderProcessingAgreementData, ());


pub struct SwitchAccountTypeService;

crate::service_impl!(declare, SwitchAccountTypeService, "sys/switchaccounttypeservice", 116);
crate::service_impl!(POST, SwitchAccountTypeService, SwitchAccountTypePostIn, ());


pub struct SystemKeysService;

crate::service_impl!(declare, SystemKeysService, "sys/systemkeysservice", 116);
crate::service_impl!(GET, SystemKeysService, (), SystemKeysReturn);


pub struct TakeOverDeletedAddressService;

crate::service_impl!(declare, TakeOverDeletedAddressService, "sys/takeoverdeletedaddressservice", 116);
crate::service_impl!(POST, TakeOverDeletedAddressService, TakeOverDeletedAddressData, ());


pub struct UpdatePermissionKeyService;

crate::service_impl!(declare, UpdatePermissionKeyService, "sys/updatepermissionkeyservice", 116);
crate::service_impl!(POST, UpdatePermissionKeyService, UpdatePermissionKeyData, ());


pub struct UpdateSessionKeysService;

crate::service_impl!(declare, UpdateSessionKeysService, "sys/updatesessionkeysservice", 116);
crate::service_impl!(POST, UpdateSessionKeysService, UpdateSessionKeysPostIn, ());


pub struct UpgradePriceService;

crate::service_impl!(declare, UpgradePriceService, "sys/upgradepriceservice", 116);
crate::service_impl!(GET, UpgradePriceService, UpgradePriceServiceData, UpgradePriceServiceReturn);


pub struct UserGroupKeyRotationService;

crate::service_impl!(declare, UserGroupKeyRotationService, "sys/usergroupkeyrotationservice", 116);
crate::service_impl!(POST, UserGroupKeyRotationService, UserGroupKeyRotationPostIn, ());


pub struct UserService;

crate::service_impl!(declare, UserService, "sys/userservice", 116);
crate::service_impl!(DELETE, UserService, UserDataDelete, ());


pub struct VersionService;

crate::service_impl!(declare, VersionService, "sys/versionservice", 116);
crate::service_impl!(GET, VersionService, VersionData, VersionReturn);
