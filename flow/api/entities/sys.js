
type KeyPair = {
    _type: TypeRef<KeyPair>;
    _id:Id;
    pubKey:Uint8Array;
    symEncPrivKey:Uint8Array;
    version:NumberString;

 }

type Group = {
    _type: TypeRef<Group>;
    _format:NumberString;
    _id:Id;
    _ownerGroup:?Id;
    _permissions:Id;
    adminGroupEncGKey:?Uint8Array;
    enabled:boolean;
    external:boolean;
    type:NumberString;

    administratedGroups:?AdministratedGroupsRef;
    keys:KeyPair[];
    admin:?Id;
    customer:?Id;
    groupInfo:IdTuple;
    invitations:Id;
    members:Id;
    user:?Id;
 }

type GroupInfo = {
    _type: TypeRef<GroupInfo>;
    _errors: Object;
    _format:NumberString;
    _id:IdTuple;
    _listEncSessionKey:?Uint8Array;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    created:Date;
    deleted:?Date;
    groupType:?NumberString;
    mailAddress:?string;
    name:string;

    mailAddressAliases:MailAddressAlias[];
    group:Id;
    localAdmin:?Id;
 }

type GroupMembership = {
    _type: TypeRef<GroupMembership>;
    _id:Id;
    admin:boolean;
    capability:?NumberString;
    groupType:?NumberString;
    symEncGKey:Uint8Array;

    group:Id;
    groupInfo:IdTuple;
    groupMember:IdTuple;
 }

type Customer = {
    _type: TypeRef<Customer>;
    _format:NumberString;
    _id:Id;
    _ownerGroup:?Id;
    _permissions:Id;
    approvalStatus:NumberString;
    canceledPremiumAccount:boolean;
    orderProcessingAgreementNeeded:boolean;
    type:NumberString;

    auditLog:?AuditLogRef;
    contactFormUserAreaGroups:?UserAreaGroups;
    contactFormUserGroups:?UserAreaGroups;
    customizations:Feature[];
    userAreaGroups:?UserAreaGroups;
    whitelabelChildren:?WhitelabelChildrenRef;
    whitelabelParent:?WhitelabelParent;
    adminGroup:Id;
    adminGroups:Id;
    customerGroup:Id;
    customerGroups:Id;
    customerInfo:IdTuple;
    orderProcessingAgreement:?IdTuple;
    properties:?Id;
    serverProperties:?Id;
    teamGroups:Id;
    userGroups:Id;
 }

type AuthenticatedDevice = {
    _type: TypeRef<AuthenticatedDevice>;
    _id:Id;
    authType:NumberString;
    deviceKey:Uint8Array;
    deviceToken:string;

 }

type Login = {
    _type: TypeRef<Login>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;
    time:Date;

 }

type SecondFactorAuthentication = {
    _type: TypeRef<SecondFactorAuthentication>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;
    code:string;
    finished:boolean;
    service:string;
    verifyCount:NumberString;

 }

type PhoneNumber = {
    _type: TypeRef<PhoneNumber>;
    _id:Id;
    number:string;

 }

type VariableExternalAuthInfo = {
    _type: TypeRef<VariableExternalAuthInfo>;
    _format:NumberString;
    _id:Id;
    _ownerGroup:?Id;
    _permissions:Id;
    authUpdateCounter:NumberString;
    lastSentTimestamp:Date;
    loggedInIpAddressHash:?Uint8Array;
    loggedInTimestamp:?Date;
    loggedInVerifier:?Uint8Array;
    sentCount:NumberString;

 }

type UserExternalAuthInfo = {
    _type: TypeRef<UserExternalAuthInfo>;
    _id:Id;
    authUpdateCounter:NumberString;
    autoAuthenticationId:Id;
    autoTransmitPassword:?string;
    latestSaltHash:?Uint8Array;

    variableAuthInfo:Id;
 }

type User = {
    _type: TypeRef<User>;
    _format:NumberString;
    _id:Id;
    _ownerGroup:?Id;
    _permissions:Id;
    accountType:NumberString;
    enabled:boolean;
    requirePasswordUpdate:boolean;
    salt:?Uint8Array;
    userEncClientKey:Uint8Array;
    verifier:Uint8Array;

    alarmInfoList:?UserAlarmInfoListType;
    auth:?UserAuthentication;
    authenticatedDevices:AuthenticatedDevice[];
    externalAuthInfo:?UserExternalAuthInfo;
    memberships:GroupMembership[];
    phoneNumbers:PhoneNumber[];
    pushIdentifierList:?PushIdentifierList;
    userGroup:GroupMembership;
    customer:?Id;
    failedLogins:Id;
    secondFactorAuthentications:Id;
    successfulLogins:Id;
 }

type ExternalUserReference = {
    _type: TypeRef<ExternalUserReference>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;

    user:Id;
    userGroup:Id;
 }

type GroupRoot = {
    _type: TypeRef<GroupRoot>;
    _format:NumberString;
    _id:Id;
    _ownerGroup:?Id;
    _permissions:Id;

    externalUserAreaGroupInfos:?UserAreaGroups;
    externalGroupInfos:Id;
    externalUserReferences:Id;
 }

type BucketPermission = {
    _type: TypeRef<BucketPermission>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;
    ownerEncBucketKey:?Uint8Array;
    pubEncBucketKey:?Uint8Array;
    pubKeyVersion:?NumberString;
    symEncBucketKey:?Uint8Array;
    type:NumberString;

    group:Id;
 }

type Bucket = {
    _type: TypeRef<Bucket>;
    _id:Id;

    bucketPermissions:Id;
 }

type Permission = {
    _type: TypeRef<Permission>;
    _format:NumberString;
    _id:IdTuple;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    bucketEncSessionKey:?Uint8Array;
    listElementApplication:?string;
    listElementTypeId:?NumberString;
    ops:?string;
    symEncSessionKey:?Uint8Array;
    type:NumberString;

    bucket:?Bucket;
    group:?Id;
 }

type AccountingInfo = {
    _type: TypeRef<AccountingInfo>;
    _errors: Object;
    _format:NumberString;
    _id:Id;
    _modified:Date;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    business:boolean;
    invoiceAddress:string;
    invoiceCountry:?string;
    invoiceName:string;
    invoiceVatIdNo:string;
    lastInvoiceNbrOfSentSms:NumberString;
    lastInvoiceTimestamp:?Date;
    paymentAccountIdentifier:?string;
    paymentInterval:NumberString;
    paymentMethod:?NumberString;
    paymentMethodInfo:?string;
    paymentProviderCustomerId:?string;
    paypalBillingAgreement:?string;
    secondCountryInfo:NumberString;

    invoiceInfo:?Id;
 }

type CustomerInfo = {
    _type: TypeRef<CustomerInfo>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;
    activationTime:?Date;
    company:?string;
    creationTime:Date;
    deletionReason:?string;
    deletionTime:?Date;
    domain:string;
    erased:boolean;
    includedEmailAliases:NumberString;
    includedStorageCapacity:NumberString;
    promotionEmailAliases:NumberString;
    promotionStorageCapacity:NumberString;
    registrationMailAddress:string;
    source:string;
    testEndTime:?Date;
    usedSharedEmailAliases:NumberString;

    bookings:?BookingsRef;
    domainInfos:DomainInfo[];
    accountingInfo:Id;
    customer:Id;
    takeoverCustomer:?Id;
 }

type SentGroupInvitation = {
    _type: TypeRef<SentGroupInvitation>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;
    capability:NumberString;
    inviteeMailAddress:string;

    receivedInvitation:?IdTuple;
    sharedGroup:Id;
 }

type MailAddressToGroup = {
    _type: TypeRef<MailAddressToGroup>;
    _format:NumberString;
    _id:Id;
    _ownerGroup:?Id;
    _permissions:Id;

    internalGroup:?Id;
 }

type GroupMember = {
    _type: TypeRef<GroupMember>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;
    capability:?NumberString;

    group:Id;
    user:Id;
    userGroupInfo:IdTuple;
 }

type RootInstance = {
    _type: TypeRef<RootInstance>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;
    reference:Id;

 }

type VersionInfo = {
    _type: TypeRef<VersionInfo>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;
    app:string;
    operation:string;
    referenceList:?Id;
    timestamp:Date;
    type:NumberString;
    versionData:?Uint8Array;

    author:Id;
    authorGroupInfo:IdTuple;
 }

type SystemKeysReturn = {
    _type: TypeRef<SystemKeysReturn>;
    _format:NumberString;
    freeGroupKey:Uint8Array;
    premiumGroupKey:Uint8Array;
    starterGroupKey:Uint8Array;
    systemAdminPubKey:Uint8Array;
    systemAdminPubKeyVersion:NumberString;

    freeGroup:?Id;
    premiumGroup:?Id;
 }

type MailAddressAvailabilityData = {
    _type: TypeRef<MailAddressAvailabilityData>;
    _format:NumberString;
    mailAddress:string;

 }

type MailAddressAvailabilityReturn = {
    _type: TypeRef<MailAddressAvailabilityReturn>;
    _format:NumberString;
    available:boolean;

 }

type RegistrationServiceData = {
    _type: TypeRef<RegistrationServiceData>;
    _format:NumberString;
    starterDomain:string;
    source:?string;
    state:NumberString;

 }

type RegistrationReturn = {
    _type: TypeRef<RegistrationReturn>;
    _format:NumberString;
    authToken:string;

 }

type SendRegistrationCodeData = {
    _type: TypeRef<SendRegistrationCodeData>;
    _format:NumberString;
    accountType:NumberString;
    authToken:string;
    language:string;
    mobilePhoneNumber:string;

 }

type SendRegistrationCodeReturn = {
    _type: TypeRef<SendRegistrationCodeReturn>;
    _format:NumberString;
    authToken:string;

 }

type VerifyRegistrationCodeData = {
    _type: TypeRef<VerifyRegistrationCodeData>;
    _format:NumberString;
    authToken:string;
    code:string;

 }

type CreateGroupData = {
    _type: TypeRef<CreateGroupData>;
    _id:Id;
    adminEncGKey:Uint8Array;
    customerEncUserGroupInfoSessionKey:?Uint8Array;
    encryptedName:Uint8Array;
    listEncSessionKey:Uint8Array;
    mailAddress:?string;
    pubKey:Uint8Array;
    symEncGKey:Uint8Array;
    symEncPrivKey:Uint8Array;

 }

type CreateGroupListData = {
    _type: TypeRef<CreateGroupListData>;
    _id:Id;
    adminEncGroupInfoListKey:Uint8Array;
    customerEncGroupInfoListKey:Uint8Array;

    createGroupData:?CreateGroupData;
 }

type CustomerReturn = {
    _type: TypeRef<CustomerReturn>;
    _format:NumberString;

    adminUser:Id;
    adminUserGroup:Id;
 }

type CustomerData = {
    _type: TypeRef<CustomerData>;
    _format:NumberString;
    accountingInfoBucketEncAccountingInfoSessionKey:Uint8Array;
    adminEncAccountingInfoSessionKey:Uint8Array;
    authToken:string;
    company:string;
    date:?Date;
    domain:string;
    salt:Uint8Array;
    symEncAccountGroupKey:Uint8Array;
    systemCustomerPubEncAccountingInfoBucketKey:Uint8Array;
    systemCustomerPubKeyVersion:NumberString;
    userEncClientKey:Uint8Array;
    verifier:Uint8Array;

    adminGroupList:CreateGroupListData;
    customerGroupList:CreateGroupListData;
    teamGroupList:CreateGroupListData;
    userGroupList:CreateGroupListData;
 }

type UserReturn = {
    _type: TypeRef<UserReturn>;
    _format:NumberString;

    user:Id;
    userGroup:Id;
 }

type UserData = {
    _type: TypeRef<UserData>;
    _format:NumberString;
    date:?Date;
    mobilePhoneNumber:string;
    salt:Uint8Array;
    userEncClientKey:Uint8Array;
    userEncCustomerGroupKey:Uint8Array;
    verifier:Uint8Array;

    userGroupData:?CreateGroupData;
 }

type UserDataDelete = {
    _type: TypeRef<UserDataDelete>;
    _format:NumberString;
    date:?Date;
    restore:boolean;

    user:Id;
 }

type PublicKeyData = {
    _type: TypeRef<PublicKeyData>;
    _format:NumberString;
    mailAddress:string;

 }

type PublicKeyReturn = {
    _type: TypeRef<PublicKeyReturn>;
    _format:NumberString;
    pubKey:Uint8Array;
    pubKeyVersion:NumberString;

 }

type SaltData = {
    _type: TypeRef<SaltData>;
    _format:NumberString;
    mailAddress:string;

 }

type SaltReturn = {
    _type: TypeRef<SaltReturn>;
    _format:NumberString;
    salt:Uint8Array;

 }

type UserIdData = {
    _type: TypeRef<UserIdData>;
    _format:NumberString;
    mailAddress:string;

 }

type UserIdReturn = {
    _type: TypeRef<UserIdReturn>;
    _format:NumberString;

    userId:Id;
 }

type AutoLoginDataGet = {
    _type: TypeRef<AutoLoginDataGet>;
    _format:NumberString;
    deviceToken:string;

    userId:Id;
 }

type AutoLoginDataDelete = {
    _type: TypeRef<AutoLoginDataDelete>;
    _format:NumberString;
    deviceToken:string;

 }

type AutoLoginDataReturn = {
    _type: TypeRef<AutoLoginDataReturn>;
    _format:NumberString;
    deviceKey:Uint8Array;

 }

type AutoLoginPostReturn = {
    _type: TypeRef<AutoLoginPostReturn>;
    _format:NumberString;
    deviceToken:string;

 }

type UpdatePermissionKeyData = {
    _type: TypeRef<UpdatePermissionKeyData>;
    _format:NumberString;
    ownerEncSessionKey:?Uint8Array;
    symEncSessionKey:?Uint8Array;

    bucketPermission:IdTuple;
    permission:IdTuple;
 }

type Authentication = {
    _type: TypeRef<Authentication>;
    _id:Id;
    accessToken:?string;
    authVerifier:?string;
    externalAuthToken:?string;

    userId:Id;
 }

type Chat = {
    _type: TypeRef<Chat>;
    _id:Id;
    recipient:Id;
    sender:Id;
    text:string;

 }

type EntityUpdate = {
    _type: TypeRef<EntityUpdate>;
    _id:Id;
    application:string;
    instanceId:string;
    instanceListId:string;
    operation:NumberString;
    type:string;

 }

type Exception = {
    _type: TypeRef<Exception>;
    _id:Id;
    msg:string;
    type:string;

 }

type Version = {
    _type: TypeRef<Version>;
    _id:Id;
    operation:string;
    timestamp:Date;
    version:Id;

    author:Id;
    authorGroupInfo:IdTuple;
 }

type VersionData = {
    _type: TypeRef<VersionData>;
    _format:NumberString;
    application:string;
    id:Id;
    listId:?Id;
    typeId:NumberString;

 }

type VersionReturn = {
    _type: TypeRef<VersionReturn>;
    _format:NumberString;

    versions:Version[];
 }

type MembershipAddData = {
    _type: TypeRef<MembershipAddData>;
    _format:NumberString;
    symEncGKey:Uint8Array;

    group:Id;
    user:Id;
 }

type StringConfigValue = {
    _type: TypeRef<StringConfigValue>;
    _id:Id;
    name:string;
    value:string;

 }

type ChangePasswordData = {
    _type: TypeRef<ChangePasswordData>;
    _format:NumberString;
    code:?string;
    oldVerifier:?Uint8Array;
    pwEncUserGroupKey:Uint8Array;
    recoverCodeVerifier:?Uint8Array;
    salt:Uint8Array;
    verifier:Uint8Array;

 }

type SecondFactorAuthData = {
    _type: TypeRef<SecondFactorAuthData>;
    _format:NumberString;
    otpCode:?NumberString;
    type:?NumberString;

    u2f:?U2fResponseData;
    session:?IdTuple;
 }

type SecondFactorAuthAllowedReturn = {
    _type: TypeRef<SecondFactorAuthAllowedReturn>;
    _format:NumberString;
    allowed:boolean;

 }

type CustomerInfoReturn = {
    _type: TypeRef<CustomerInfoReturn>;
    _format:NumberString;
    sendMailDisabled:boolean;

 }

type ResetPasswordData = {
    _type: TypeRef<ResetPasswordData>;
    _format:NumberString;
    pwEncUserGroupKey:Uint8Array;
    salt:Uint8Array;
    verifier:Uint8Array;

    user:Id;
 }

type DomainMailAddressAvailabilityData = {
    _type: TypeRef<DomainMailAddressAvailabilityData>;
    _format:NumberString;
    mailAddress:string;

 }

type DomainMailAddressAvailabilityReturn = {
    _type: TypeRef<DomainMailAddressAvailabilityReturn>;
    _format:NumberString;
    available:boolean;

 }

type RegistrationConfigReturn = {
    _type: TypeRef<RegistrationConfigReturn>;
    _format:NumberString;
    freeEnabled:boolean;
    starterEnabled:boolean;

 }

type PushIdentifier = {
    _type: TypeRef<PushIdentifier>;
    _errors: Object;
    _area:NumberString;
    _format:NumberString;
    _id:IdTuple;
    _owner:Id;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    disabled:boolean;
    displayName:string;
    identifier:string;
    language:string;
    lastNotificationDate:?Date;
    lastUsageTime:Date;
    pushServiceType:NumberString;

 }

type PushIdentifierList = {
    _type: TypeRef<PushIdentifierList>;
    _id:Id;

    list:Id;
 }

type DeleteCustomerData = {
    _type: TypeRef<DeleteCustomerData>;
    _format:NumberString;
    authVerifier:?Uint8Array;
    reason:string;
    takeoverMailAddress:?string;
    undelete:boolean;

    customer:Id;
 }

type PremiumFeatureData = {
    _type: TypeRef<PremiumFeatureData>;
    _format:NumberString;
    activationCode:string;
    featureName:string;

 }

type CustomerProperties = {
    _type: TypeRef<CustomerProperties>;
    _format:NumberString;
    _id:Id;
    _ownerGroup:?Id;
    _permissions:Id;
    externalUserWelcomeMessage:string;
    lastUpgradeReminder:?Date;

    bigLogo:?SysFile;
    notificationMailTemplates:NotificationMailTemplate[];
    smallLogo:?SysFile;
 }

type ExternalPropertiesReturn = {
    _type: TypeRef<ExternalPropertiesReturn>;
    _format:NumberString;
    accountType:NumberString;
    message:string;

    bigLogo:?SysFile;
    smallLogo:?SysFile;
 }

type RegistrationCaptchaServiceData = {
    _type: TypeRef<RegistrationCaptchaServiceData>;
    _format:NumberString;
    response:string;
    token:string;

 }

type RegistrationCaptchaServiceReturn = {
    _type: TypeRef<RegistrationCaptchaServiceReturn>;
    _format:NumberString;
    challenge:?Uint8Array;
    token:string;

 }

type MailAddressAlias = {
    _type: TypeRef<MailAddressAlias>;
    _id:Id;
    enabled:boolean;
    mailAddress:string;

 }

type MailAddressAliasServiceData = {
    _type: TypeRef<MailAddressAliasServiceData>;
    _format:NumberString;
    mailAddress:string;

    group:Id;
 }

type MailAddressAliasServiceReturn = {
    _type: TypeRef<MailAddressAliasServiceReturn>;
    _format:NumberString;
    enabledAliases:NumberString;
    nbrOfFreeAliases:NumberString;
    totalAliases:NumberString;
    usedAliases:NumberString;

 }

type DomainInfo = {
    _type: TypeRef<DomainInfo>;
    _id:Id;
    domain:string;
    validatedMxRecord:boolean;

    catchAllMailGroup:?Id;
    whitelabelConfig:?Id;
 }

type BookingItem = {
    _type: TypeRef<BookingItem>;
    _id:Id;
    currentCount:NumberString;
    currentInvoicedCount:NumberString;
    featureType:NumberString;
    maxCount:NumberString;
    price:NumberString;
    priceType:NumberString;
    totalInvoicedCount:NumberString;

 }

type Booking = {
    _type: TypeRef<Booking>;
    _area:NumberString;
    _format:NumberString;
    _id:IdTuple;
    _owner:Id;
    _ownerGroup:?Id;
    _permissions:Id;
    business:boolean;
    createDate:Date;
    endDate:?Date;
    paymentInterval:NumberString;
    paymentMonths:NumberString;

    items:BookingItem[];
 }

type BookingsRef = {
    _type: TypeRef<BookingsRef>;
    _id:Id;

    items:Id;
 }

type StringWrapper = {
    _type: TypeRef<StringWrapper>;
    _id:Id;
    value:string;

 }

type CustomDomainReturn = {
    _type: TypeRef<CustomDomainReturn>;
    _format:NumberString;
    validationResult:NumberString;

    invalidDnsRecords:StringWrapper[];
 }

type CustomDomainData = {
    _type: TypeRef<CustomDomainData>;
    _format:NumberString;
    domain:string;

    catchAllMailGroup:?Id;
 }

type InvoiceInfo = {
    _type: TypeRef<InvoiceInfo>;
    _format:NumberString;
    _id:Id;
    _ownerGroup:?Id;
    _permissions:Id;
    extendedPeriodOfPaymentDays:NumberString;
    persistentPaymentPeriodExtension:boolean;
    publishInvoices:boolean;
    reminderState:NumberString;
    specialPriceBrandingPerUser:?NumberString;
    specialPriceContactFormSingle:?NumberString;
    specialPriceSharedGroupSingle:?NumberString;
    specialPriceSharingPerUser:?NumberString;
    specialPriceUserSingle:?NumberString;
    specialPriceUserTotal:?NumberString;

    paymentErrorInfo:?PaymentErrorInfo;
    invoices:Id;
 }

type SwitchAccountTypeData = {
    _type: TypeRef<SwitchAccountTypeData>;
    _format:NumberString;
    accountType:NumberString;
    campaign:?string;
    date:?Date;
    subscriptionType:NumberString;

 }

type PdfInvoiceServiceData = {
    _type: TypeRef<PdfInvoiceServiceData>;
    _format:NumberString;
    invoiceNumber:string;

    invoice:?IdTuple;
 }

type PdfInvoiceServiceReturn = {
    _type: TypeRef<PdfInvoiceServiceReturn>;
    _errors: Object;
    _format:NumberString;
    _ownerGroup:?Id;
    _ownerPublicEncSessionKey:?Uint8Array;
    data:Uint8Array;

 }

type MailAddressAliasServiceDataDelete = {
    _type: TypeRef<MailAddressAliasServiceDataDelete>;
    _format:NumberString;
    mailAddress:string;
    restore:boolean;

    group:Id;
 }

type PaymentDataServiceGetReturn = {
    _type: TypeRef<PaymentDataServiceGetReturn>;
    _format:NumberString;
    loginUrl:string;

 }

type PaymentDataServicePutData = {
    _type: TypeRef<PaymentDataServicePutData>;
    _errors: Object;
    _format:NumberString;
    business:boolean;
    confirmedCountry:?string;
    invoiceAddress:string;
    invoiceCountry:string;
    invoiceName:string;
    invoiceVatIdNo:string;
    paymentInterval:NumberString;
    paymentMethod:NumberString;
    paymentMethodInfo:?string;
    paymentToken:?string;

    creditCard:?CreditCard;
 }

type PaymentDataServicePutReturn = {
    _type: TypeRef<PaymentDataServicePutReturn>;
    _format:NumberString;
    result:NumberString;

 }

type PriceRequestData = {
    _type: TypeRef<PriceRequestData>;
    _id:Id;
    accountType:?NumberString;
    business:?boolean;
    count:NumberString;
    featureType:NumberString;
    paymentInterval:?NumberString;
    reactivate:boolean;

 }

type PriceServiceData = {
    _type: TypeRef<PriceServiceData>;
    _format:NumberString;
    campaign:?string;
    date:?Date;

    priceRequest:?PriceRequestData;
 }

type PriceItemData = {
    _type: TypeRef<PriceItemData>;
    _id:Id;
    count:NumberString;
    featureType:NumberString;
    price:NumberString;
    singleType:boolean;

 }

type PriceData = {
    _type: TypeRef<PriceData>;
    _id:Id;
    paymentInterval:NumberString;
    price:NumberString;
    taxIncluded:boolean;

    items:PriceItemData[];
 }

type PriceServiceReturn = {
    _type: TypeRef<PriceServiceReturn>;
    _format:NumberString;
    currentPeriodAddedPrice:?NumberString;
    periodEndDate:Date;

    currentPriceNextPeriod:?PriceData;
    currentPriceThisPeriod:?PriceData;
    futurePriceNextPeriod:?PriceData;
 }

type MembershipRemoveData = {
    _type: TypeRef<MembershipRemoveData>;
    _format:NumberString;

    group:Id;
    user:Id;
 }

type SysFile = {
    _type: TypeRef<SysFile>;
    _id:Id;
    data:Uint8Array;
    mimeType:string;
    name:string;

 }

type EmailSenderListElement = {
    _type: TypeRef<EmailSenderListElement>;
    _id:Id;
    field:NumberString;
    hashedValue:string;
    type:NumberString;
    value:string;

 }

type CustomerServerProperties = {
    _type: TypeRef<CustomerServerProperties>;
    _errors: Object;
    _format:NumberString;
    _id:Id;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    requirePasswordUpdateAfterReset:boolean;
    saveEncryptedIpAddressInSession:boolean;
    whitelabelCode:string;

    emailSenderList:EmailSenderListElement[];
    whitelabelRegistrationDomains:StringWrapper[];
    whitelistedDomains:?DomainsRef;
 }

type CreateCustomerServerPropertiesData = {
    _type: TypeRef<CreateCustomerServerPropertiesData>;
    _format:NumberString;
    adminGroupEncSessionKey:Uint8Array;

 }

type CreateCustomerServerPropertiesReturn = {
    _type: TypeRef<CreateCustomerServerPropertiesReturn>;
    _format:NumberString;

    id:Id;
 }

type PremiumFeatureReturn = {
    _type: TypeRef<PremiumFeatureReturn>;
    _format:NumberString;
    activatedFeature:NumberString;

 }

type UserAreaGroups = {
    _type: TypeRef<UserAreaGroups>;
    _id:Id;

    list:Id;
 }

type DebitServicePutData = {
    _type: TypeRef<DebitServicePutData>;
    _format:NumberString;

    invoice:?IdTuple;
 }

type BookingServiceData = {
    _type: TypeRef<BookingServiceData>;
    _format:NumberString;
    amount:NumberString;
    date:?Date;
    featureType:NumberString;

 }

type EntityEventBatch = {
    _type: TypeRef<EntityEventBatch>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;

    events:EntityUpdate[];
 }

type DomainsRef = {
    _type: TypeRef<DomainsRef>;
    _id:Id;

    items:Id;
 }

type AuditLogEntry = {
    _type: TypeRef<AuditLogEntry>;
    _errors: Object;
    _format:NumberString;
    _id:IdTuple;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    action:string;
    actorIpAddress:?string;
    actorMailAddress:string;
    date:Date;
    modifiedEntity:string;

    groupInfo:?IdTuple;
    modifiedGroupInfo:?IdTuple;
 }

type AuditLogRef = {
    _type: TypeRef<AuditLogRef>;
    _id:Id;

    items:Id;
 }

type WhitelabelConfig = {
    _type: TypeRef<WhitelabelConfig>;
    _format:NumberString;
    _id:Id;
    _ownerGroup:?Id;
    _permissions:Id;
    germanLanguageCode:?string;
    imprintUrl:?string;
    jsonTheme:string;
    metaTags:string;
    privacyStatementUrl:?string;
    whitelabelCode:string;

    bootstrapCustomizations:BootstrapFeature[];
    certificateInfo:?CertificateInfo;
    whitelabelRegistrationDomains:StringWrapper[];
 }

type BrandingDomainData = {
    _type: TypeRef<BrandingDomainData>;
    _format:NumberString;
    domain:string;
    sessionEncPemCertificateChain:?Uint8Array;
    sessionEncPemPrivateKey:?Uint8Array;
    systemAdminPubEncSessionKey:Uint8Array;

 }

type BrandingDomainDeleteData = {
    _type: TypeRef<BrandingDomainDeleteData>;
    _format:NumberString;
    domain:string;

 }

type U2fRegisteredDevice = {
    _type: TypeRef<U2fRegisteredDevice>;
    _id:Id;
    appId:string;
    compromised:boolean;
    counter:NumberString;
    keyHandle:Uint8Array;
    publicKey:Uint8Array;

 }

type SecondFactor = {
    _type: TypeRef<SecondFactor>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;
    name:string;
    otpSecret:?Uint8Array;
    type:NumberString;

    u2f:?U2fRegisteredDevice;
 }

type U2fKey = {
    _type: TypeRef<U2fKey>;
    _id:Id;
    appId:string;
    keyHandle:Uint8Array;

    secondFactor:IdTuple;
 }

type U2fChallenge = {
    _type: TypeRef<U2fChallenge>;
    _id:Id;
    challenge:Uint8Array;

    keys:U2fKey[];
 }

type Challenge = {
    _type: TypeRef<Challenge>;
    _id:Id;
    type:NumberString;

    otp:?OtpChallenge;
    u2f:?U2fChallenge;
 }

type Session = {
    _type: TypeRef<Session>;
    _errors: Object;
    _format:NumberString;
    _id:IdTuple;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    accessKey:?Uint8Array;
    clientIdentifier:string;
    lastAccessTime:Date;
    loginIpAddress:?string;
    loginTime:Date;
    state:NumberString;

    challenges:Challenge[];
    user:Id;
 }

type UserAuthentication = {
    _type: TypeRef<UserAuthentication>;
    _id:Id;

    recoverCode:?Id;
    secondFactors:Id;
    sessions:Id;
 }

type CreateSessionData = {
    _type: TypeRef<CreateSessionData>;
    _format:NumberString;
    accessKey:?Uint8Array;
    authToken:?string;
    authVerifier:?string;
    clientIdentifier:string;
    mailAddress:?string;
    recoverCodeVerifier:?string;

    user:?Id;
 }

type CreateSessionReturn = {
    _type: TypeRef<CreateSessionReturn>;
    _format:NumberString;
    accessToken:string;

    challenges:Challenge[];
    user:Id;
 }

type U2fResponseData = {
    _type: TypeRef<U2fResponseData>;
    _id:Id;
    clientData:string;
    keyHandle:string;
    signatureData:string;

 }

type SecondFactorAuthGetData = {
    _type: TypeRef<SecondFactorAuthGetData>;
    _format:NumberString;
    accessToken:string;

 }

type SecondFactorAuthGetReturn = {
    _type: TypeRef<SecondFactorAuthGetReturn>;
    _format:NumberString;
    secondFactorPending:boolean;

 }

type OtpChallenge = {
    _type: TypeRef<OtpChallenge>;
    _id:Id;

    secondFactors:IdTuple[];
 }

type BootstrapFeature = {
    _type: TypeRef<BootstrapFeature>;
    _id:Id;
    feature:NumberString;

 }

type Feature = {
    _type: TypeRef<Feature>;
    _id:Id;
    feature:NumberString;

 }

type WhitelabelChild = {
    _type: TypeRef<WhitelabelChild>;
    _errors: Object;
    _format:NumberString;
    _id:IdTuple;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    comment:string;
    createdDate:Date;
    deletedDate:?Date;
    mailAddress:string;

    customer:Id;
 }

type WhitelabelChildrenRef = {
    _type: TypeRef<WhitelabelChildrenRef>;
    _id:Id;

    items:Id;
 }

type WhitelabelParent = {
    _type: TypeRef<WhitelabelParent>;
    _id:Id;

    customer:Id;
    whitelabelChildInParent:IdTuple;
 }

type UpdateAdminshipData = {
    _type: TypeRef<UpdateAdminshipData>;
    _format:NumberString;
    newAdminGroupEncGKey:Uint8Array;

    group:Id;
    newAdminGroup:Id;
 }

type AdministratedGroup = {
    _type: TypeRef<AdministratedGroup>;
    _format:NumberString;
    _id:IdTuple;
    _ownerGroup:?Id;
    _permissions:Id;
    groupType:NumberString;

    groupInfo:IdTuple;
    localAdminGroup:Id;
 }

type AdministratedGroupsRef = {
    _type: TypeRef<AdministratedGroupsRef>;
    _id:Id;

    items:Id;
 }

type CreditCard = {
    _type: TypeRef<CreditCard>;
    _id:Id;
    cardHolderName:string;
    cvv:string;
    expirationMonth:string;
    expirationYear:string;
    number:string;

 }

type LocationServiceGetReturn = {
    _type: TypeRef<LocationServiceGetReturn>;
    _format:NumberString;
    country:string;

 }

type OrderProcessingAgreement = {
    _type: TypeRef<OrderProcessingAgreement>;
    _errors: Object;
    _format:NumberString;
    _id:IdTuple;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    customerAddress:string;
    signatureDate:Date;
    version:string;

    customer:Id;
    signerUserGroupInfo:IdTuple;
 }

type SignOrderProcessingAgreementData = {
    _type: TypeRef<SignOrderProcessingAgreementData>;
    _format:NumberString;
    customerAddress:string;
    version:string;

 }

type GeneratedIdWrapper = {
    _type: TypeRef<GeneratedIdWrapper>;
    _id:Id;
    value:Id;

 }

type SseConnectData = {
    _type: TypeRef<SseConnectData>;
    _format:NumberString;
    identifier:string;

    userIds:GeneratedIdWrapper[];
 }

type NotificationInfo = {
    _type: TypeRef<NotificationInfo>;
    _id:Id;
    counter:NumberString;
    mailAddress:string;
    userId:Id;

 }

type RecoverCode = {
    _type: TypeRef<RecoverCode>;
    _format:NumberString;
    _id:Id;
    _ownerGroup:?Id;
    _permissions:Id;
    recoverCodeEncUserGroupKey:Uint8Array;
    userEncRecoverCode:Uint8Array;
    verifier:Uint8Array;

 }

type ResetFactorsDeleteData = {
    _type: TypeRef<ResetFactorsDeleteData>;
    _format:NumberString;
    authVerifier:string;
    mailAddress:string;
    recoverCodeVerifier:string;

 }

type UpgradePriceServiceData = {
    _type: TypeRef<UpgradePriceServiceData>;
    _format:NumberString;
    campaign:?string;
    date:?Date;

 }

type PlanPrices = {
    _type: TypeRef<PlanPrices>;
    _id:Id;
    additionalUserPriceMonthly:NumberString;
    contactFormPriceMonthly:NumberString;
    firstYearDiscount:NumberString;
    includedAliases:NumberString;
    includedStorage:NumberString;
    monthlyPrice:NumberString;
    monthlyReferencePrice:NumberString;

 }

type UpgradePriceServiceReturn = {
    _type: TypeRef<UpgradePriceServiceReturn>;
    _format:NumberString;
    business:boolean;
    messageTextId:?string;

    premiumPrices:PlanPrices;
    proPrices:PlanPrices;
    teamsPrices:PlanPrices;
 }

type RegistrationCaptchaServiceGetData = {
    _type: TypeRef<RegistrationCaptchaServiceGetData>;
    _format:NumberString;
    mailAddress:string;
    token:?string;

 }

type WebsocketEntityData = {
    _type: TypeRef<WebsocketEntityData>;
    _format:NumberString;
    eventBatchId:Id;
    eventBatchOwner:Id;

    eventBatch:EntityUpdate[];
 }

type WebsocketCounterValue = {
    _type: TypeRef<WebsocketCounterValue>;
    _id:Id;
    count:NumberString;
    mailListId:Id;

 }

type WebsocketCounterData = {
    _type: TypeRef<WebsocketCounterData>;
    _format:NumberString;
    mailGroup:Id;

    counterValues:WebsocketCounterValue[];
 }

type CertificateInfo = {
    _type: TypeRef<CertificateInfo>;
    _id:Id;
    expiryDate:?Date;
    state:NumberString;
    type:NumberString;

    certificate:?Id;
 }

type NotificationMailTemplate = {
    _type: TypeRef<NotificationMailTemplate>;
    _id:Id;
    body:string;
    language:string;
    subject:string;

 }

type CalendarEventRef = {
    _type: TypeRef<CalendarEventRef>;
    _id:Id;
    elementId:Id;
    listId:Id;

 }

type AlarmInfo = {
    _type: TypeRef<AlarmInfo>;
    _id:Id;
    alarmIdentifier:string;
    trigger:string;

    calendarRef:CalendarEventRef;
 }

type UserAlarmInfo = {
    _type: TypeRef<UserAlarmInfo>;
    _errors: Object;
    _format:NumberString;
    _id:IdTuple;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;

    alarmInfo:AlarmInfo;
 }

type UserAlarmInfoListType = {
    _type: TypeRef<UserAlarmInfoListType>;
    _id:Id;

    alarms:Id;
 }

type NotificationSessionKey = {
    _type: TypeRef<NotificationSessionKey>;
    _id:Id;
    pushIdentifierSessionEncSessionKey:Uint8Array;

    pushIdentifier:IdTuple;
 }

type RepeatRule = {
    _type: TypeRef<RepeatRule>;
    _id:Id;
    endType:NumberString;
    endValue:?NumberString;
    frequency:NumberString;
    interval:NumberString;
    timeZone:string;

 }

type AlarmNotification = {
    _type: TypeRef<AlarmNotification>;
    _id:Id;
    eventEnd:Date;
    eventStart:Date;
    operation:NumberString;
    summary:string;

    alarmInfo:AlarmInfo;
    notificationSessionKeys:NotificationSessionKey[];
    repeatRule:?RepeatRule;
    user:Id;
 }

type AlarmServicePost = {
    _type: TypeRef<AlarmServicePost>;
    _errors: Object;
    _format:NumberString;

    alarmNotifications:AlarmNotification[];
 }

type DnsRecord = {
    _type: TypeRef<DnsRecord>;
    _id:Id;
    subdomain:?string;
    type:NumberString;
    value:string;

 }

type CustomDomainCheckData = {
    _type: TypeRef<CustomDomainCheckData>;
    _format:NumberString;
    domain:string;

 }

type CustomDomainCheckReturn = {
    _type: TypeRef<CustomDomainCheckReturn>;
    _format:NumberString;
    checkResult:NumberString;

    invalidRecords:DnsRecord[];
    missingRecords:DnsRecord[];
 }

type CloseSessionServicePost = {
    _type: TypeRef<CloseSessionServicePost>;
    _format:NumberString;
    accessToken:string;

    sessionId:IdTuple;
 }

type ReceivedGroupInvitation = {
    _type: TypeRef<ReceivedGroupInvitation>;
    _errors: Object;
    _format:NumberString;
    _id:IdTuple;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    capability:NumberString;
    inviteeMailAddress:string;
    inviterMailAddress:string;
    inviterName:string;
    sharedGroupKey:Uint8Array;
    sharedGroupName:string;

    sentInvitation:IdTuple;
    sharedGroup:Id;
 }

type UserGroupRoot = {
    _type: TypeRef<UserGroupRoot>;
    _format:NumberString;
    _id:Id;
    _ownerGroup:?Id;
    _permissions:Id;

    invitations:Id;
 }

type PaymentErrorInfo = {
    _type: TypeRef<PaymentErrorInfo>;
    _id:Id;
    errorCode:string;
    errorTime:Date;
    thirdPartyErrorId:string;

 }

type InvoiceItem = {
    _type: TypeRef<InvoiceItem>;
    _id:Id;
    amount:NumberString;
    endDate:?Date;
    singlePrice:?NumberString;
    singleType:boolean;
    startDate:?Date;
    totalPrice:NumberString;
    type:NumberString;

 }

type Invoice = {
    _type: TypeRef<Invoice>;
    _errors: Object;
    _format:NumberString;
    _id:Id;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    address:string;
    adminUser:?string;
    business:boolean;
    country:string;
    date:Date;
    grandTotal:NumberString;
    paymentMethod:NumberString;
    reason:?string;
    subTotal:NumberString;
    type:NumberString;
    vat:NumberString;
    vatIdNumber:?string;
    vatRate:NumberString;

    items:InvoiceItem[];
    bookings:IdTuple[];
    customer:Id;
 }

type MissedNotification = {
    _type: TypeRef<MissedNotification>;
    _errors: Object;
    _format:NumberString;
    _id:Id;
    _ownerEncSessionKey:?Uint8Array;
    _ownerGroup:?Id;
    _permissions:Id;
    changeTime:Date;
    confirmationId:Id;
    lastProcessedNotificationId:?Id;

    alarmNotifications:AlarmNotification[];
    notificationInfos:NotificationInfo[];
 }

type BrandingDomainGetReturn = {
    _type: TypeRef<BrandingDomainGetReturn>;
    _format:NumberString;

    certificateInfo:?CertificateInfo;
 }
