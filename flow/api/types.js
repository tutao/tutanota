// see https://bitwiseshiftleft.github.io/sjcl/doc/symbols/sjcl.bitArray.html

// type that is used by sjcl for any encryption/decryption operation
type BitArray = number[]

type Aes128Key = BitArray
type Aes256Key = BitArray
type SignedBytes = number[]

type Base32 = string
type Base64 = string
type Base64Ext = string
type Base64Url = string
type Hex = string
type NumberString = string

type Id = string
type IdTuple = [string, string]
type Params = {[key: string]: string}

type RsaKeyPair = {
	publicKey: PublicKey,
	privateKey: PrivateKey,
}

type PrivateKey = {
	version: number,

	keyLength: number,
	modulus: Base64,
	privateExponent: Base64,
	primeP: Base64,
	primeQ: Base64,
	primeExponentP: Base64,
	primeExponentQ: Base64,
	crtCoefficient: Base64,
}

type PublicKey = {
	version: number,
	keyLength: number,
	modulus: Base64,
	publicExponent: number,
}

/** Requests from main web thread to worker */
type WorkerRequestType = 'setup'
	| 'generateSignupKeys'
	| 'signup'
	| 'createSession'
	| 'createExternalSession'
	| 'loadExternalPasswordChannels'
	| 'sendExternalPasswordSms'
	| 'reset'
	| 'resumeSession'
	| 'testEcho'
	| 'testError'
	| 'deleteSession'
	| 'restRequest'
	| 'entityRequest'
	| 'serviceRequest'
	| 'createMailFolder'
	| 'readAvailableCustomerStorage'
	| 'readUsedCustomerStorage'
	| 'createMailDraft'
	| 'updateMailDraft'
	| 'sendMailDraft'
	| 'downloadFileContent'
	| 'entropy'
	| 'tryReconnectEventBus'
	| 'changePassword'
	| 'deleteAccount'
	| 'setMailAliasStatus'
	| 'addMailAlias'
	| 'isMailAddressAvailable'
	| 'getAliasCounters'
	| 'changeUserPassword'
	| 'changeAdminFlag'
	| 'readUsedUserStorage'
	| 'deleteUser'
	| 'getPrice'
	| 'getCurrentPrice'
	| 'loadCustomerServerProperties'
	| 'addSpamRule'
	| 'createUser'
	| 'readUsedGroupStorage'
	| 'createMailGroup'
	| 'createLocalAdminGroup'
	| 'addUserToGroup'
	| 'removeUserFromGroup'
	| 'deactivateGroup'
	| 'loadContactFormByPath'
	| 'addDomain'
	| 'removeDomain'
	| 'setCatchAllGroup'
	| 'orderWhitelabelCertificate'
	| 'deleteCertificate'
	| 'createContactFormUserGroupData'
	| 'createContactFormUser'
	| 'generateTotpCode'
	| 'generateTotpSecret'
	| 'search'
	| 'enableMailIndexing'
	| 'disableMailIndexing'
	| 'cancelMailIndexing'
	| 'updateAdminship'
	| 'switchFreeToPremiumGroup'
	| 'switchPremiumToFreeGroup'
	| 'updatePaymentData'
	| 'downloadInvoice'
	| 'generateSsePushIdentifer'
	| 'decryptUserPassword'
	| 'closeEventBus'
	| 'readCounterValue'
	| 'getMoreSearchResults'
	| 'cancelCreateSession'
	| 'getRecoveryCode'
	| 'createRecoveryCode'
	| 'recoverLogin'
	| 'resetSecondFactors'
	| 'takeOverDeletedAddress'
	| 'extendMailIndex'
	| 'resetSession'
	| 'downloadFileContentNative'
	| 'createCalendarEvent'
	| 'updateCalendarEvent'
	| 'resolveSessionKey'
	| 'addCalendar'
	| 'scheduleAlarmsForNewDevice'
	| 'loadAlarmEvents'
	| 'getDomainValidationRecord'
	| 'visibilityChange'
	| 'getLog'
	| 'acceptGroupInvitation'
	| 'rejectGroupInvitation'
	| 'editSpamRule'
	| 'checkMailForPhishing'
	| 'addExternalImageRule'
	| 'getExternalImageRule'
	| 'getEventByUid'
	| 'generateGiftCard'
	| 'redeemGiftCard'
	| 'getGiftCardInfo'
	| 'createTemplateGroup'
	| 'urlify'
	| 'uploadBlob'
	| 'downloadBlob'

/** Requests from worker web thread to main web thread */
type MainRequestType = 'execNative'
	| 'entityEvent'
	| 'error'
	| 'progress'
	| 'updateIndexState'
	| 'updateWebSocketState'
	| 'counterUpdate'
	| 'updateLeaderStatus'
	| 'infoMessage'
	| 'createProgressMonitor'
	| 'progressWorkDone'
	| 'writeIndexerDebugLog'

/** Requests from web to native */
type NativeRequestType = 'init'
	| 'generateRsaKey'
	| 'rsaEncrypt'
	| 'rsaDecrypt'
	| 'aesEncryptFile'
	| 'aesDecryptFile'
	| 'open'
	| 'openFileChooser'
	| 'deleteFile'
	| 'getName'
	| 'getMimeType'
	| 'getSize'
	| 'upload'
	| 'download'
	| 'clearFileData'
	| 'findSuggestions'
	| 'initPushNotifications'
	| 'openLink'
	| 'shareText'
	| 'reload'
	| 'getPushIdentifier'
	| 'storePushIdentifierLocally'
	| 'closePushNotifications'
	| 'readFile'
	| 'saveBlob'
	| 'putFileIntoDownloads'
	| 'findInPage'
	| 'stopFindInPage'
	| 'registerMailto'
	| 'unregisterMailto'
	| 'openNewWindow'
	| 'setConfigValue'
	| 'enableAutoLaunch'
	| 'disableAutoLaunch'
	| 'sendSocketMessage'
	| 'getDeviceLog' // for mobile apps
	| 'getLog' // for desktop
	| 'sendGroupInvitation'
	| 'shareGroup'
	| 'integrateDesktop'
	| 'unIntegrateDesktop'
	| 'unscheduleAlarms'
	| 'setSearchOverlayState'
	| 'changeLanguage'
	| 'isUpdateAvailable' // check if update is ready to install
	| 'manualUpdate' // progress update process (check, dl, install)
	| 'startNativeDrag'
	| 'mailToMsg'
	| 'focusApplicationWindow'
	| 'saveToExportDir'
	| 'checkFileExistsInExportDirectory'
	| 'scheduleAlarms'
	| 'getConfigValue'
	| 'getIntegrationInfo'
	| 'getSpellcheckLanguages'
	| 'getSelectedTheme'
	| 'setSelectedTheme'
	| 'getThemes'
	| 'setThemes'

/** Requests from native to web */
type JsRequestType = 'createMailEditor'
	| 'handleBackPress'
	| 'showAlertDialog'
	| 'openMailbox'
	| 'keyboardSizeChanged'
	| 'print'
	| 'openFindInPage'
	| 'reportError'
	| 'openCalendar'
	| 'visibilityChange'
	| 'invalidateAlarms'
	| 'applySearchResultToOverlay'
	| 'addShortcuts'
	| 'appUpdateDownloaded'
	| 'openCustomer' // only for admin clients
	| 'updateTargetUrl'
	| 'showSpellcheckDropdown'

type Callback<T> = (err: ?Error, data?: T) => void

type EnvMode = "Browser" | "App" | "Test" | "Playground" | "Desktop" | "Admin"

type EnvType = {
	staticUrl: ?string, // if null the url from the browser is used
	mode: EnvMode,
	platformId: ?"ios" | ?"android" | ?"darwin" | ?"linux" | ?"win32",
	dist: boolean,
	versionNumber: string,
	timeout: number,
	systemConfig: any,
}

declare var env: EnvType

type Credentials = {
	mailAddress: string,
	encryptedPassword: ?Base64, // only set for persistent sessions
	accessToken: Base64Url,
	userId: Id
}

declare function browser(f: Function): Function

declare function node(f: Function): Function


type DataFile = {
	+_type: 'DataFile',
	name: string,
	mimeType: string,
	data: Uint8Array,
	size: number,
	id: ?IdTuple,
	cid?: ?string
}

type FileReference = {
	+_type: 'FileReference',
	name: string,
	mimeType: string,
	location: string,
	size: number,
	cid?: ?string
}

type KeyListener = {
	modifier: number,
	callback: Function
}

type WsConnectionState = "connecting" | "connected" | "terminated"