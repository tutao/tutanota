import {Request} from "../../src/api/common/WorkerProtocol"
import {AssociationType, Cardinality, Type, ValueType} from "../../src/api/common/EntityConstants"
import type {BootstrapFeatureTypeEnum, PaymentMethodTypeEnum} from "../../src/api/common/TutanotaConstans"
import type {Theme} from "../../src/gui/theme"
import {Country} from "../../src/api/common/CountryList"
import type {MoreResultsIndexEntry} from "../../src/api/worker/search/SearchTypes"
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
	| 'uploadCertificate'
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
	| 'getEventByUid'
type MainRequestType = 'execNative'
	| 'entityEvent'
	| 'error'
	| 'progress'
	| 'updateIndexState'
	| 'updateWebSocketState'
	| 'updateEntityEventProgress'
	| 'counterUpdate'
	| 'infoMessage'

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
	| 'reload'
	| 'getPushIdentifier'
	| 'storePushIdentifierLocally'
	| 'closePushNotifications'
	| 'readFile'
	| 'changeTheme'
	| 'saveBlob'
	| 'putFileIntoDownloads'
	| 'findInPage'
	| 'stopFindInPage'
	| 'registerMailto'
	| 'unregisterMailto'
	| 'openNewWindow'
	| 'showWindow'
	| 'sendDesktopConfig'
	| 'updateDesktopConfig'
	| 'enableAutoLaunch'
	| 'disableAutoLaunch'
	| 'sendSocketMessage'
	| 'getDeviceLog' // for mobile apps
	| 'getLog' // for desktop
	| 'sendGroupInvitation'
	| 'calendarInvitationProgress_msg'
	| 'shareGroup'
	| 'sendGroupInvitation'
	| 'integrateDesktop'
	| 'unIntegrateDesktop'
	| 'unscheduleAlarms'
	| 'setSearchOverlayState'
	| 'unload' // desktop
	| 'changeLanguage'
	| 'isUpdateAvailable' // check if update is ready to install
	| 'manualUpdate' // progress update process (check, dl, install)
	| 'dragExport'


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

type WebContentsMessage
	= 'initialize-ipc'
	| 'set-zoom-factor'
	| 'open-customer'

type Callback<T> = (err: ?Error, data?: T) => void
type Command = (msg: Request) => Promise<any>


// EntityConstants
type TypeEnum = $Keys<typeof Type>;
type AssociationTypeEnum = $Keys<typeof AssociationType>;
type CardinalityEnum = $Keys<typeof Cardinality>;
type ValueTypeEnum = $Keys<typeof ValueType>;

type TypeModel = {
	id: number,
	app: string,
	version: string,
	name: string,
	type: TypeEnum,
	versioned: boolean,
	encrypted: boolean,
	rootId: string,
	values: {[key: string]: ModelValue},
	associations: {[key: string]: ModelAssociation}
}

type ModelValue = {
	id: number,
	name: string,
	type: ValueTypeEnum,
	cardinality: CardinalityEnum,
	final: boolean,
	encrypted: boolean
}

type ModelAssociation = {
	id: number,
	type: AssociationTypeEnum,
	cardinality: CardinalityEnum,
	refType: string
}

type EnvType = {
	staticUrl: ?string, // if null the url from the browser is used
	mode: "Browser" | "App" | "Test" | "Playground",
	platformId: ?"ios" | ?"android" | ?"darwin" | ?"linux" | ?"win32",
	dist: boolean,
	versionNumber: string,
	timeout: number,
	rootPathPrefix: string,
	adminTypes: string[],
	systemConfig: any
}

declare var env: EnvType

type WhitelabelCustomizations = {
	theme: ?Theme,
	bootstrapCustomizations: BootstrapFeatureTypeEnum[],
	germanLanguageCode: string,
	registrationDomains: ?string[],
	imprintUrl: ?string,
	privacyStatementUrl: ?string,
}

declare var whitelabelCustomizations: ?WhitelabelCustomizations

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

type SearchRestriction = {
	type: TypeRef<any>;
	start: ?number; // timestamp
	end: ?number; // timestamp
	field: ?string; // must be kept in sync with attributeIds
	attributeIds: ?number[]; // must be kept in sync with field
	listId: ?Id;
}

type SearchResult = {
	query: string,
	restriction: SearchRestriction,
	results: IdTuple[];
	currentIndexTimestamp: number;
	moreResults: Array<MoreResultsIndexEntry>,
	lastReadSearchIndexRow: Array<[string, ?number]>; // array of pairs (token, lastReadSearchIndexRowOldestElementTimestamp) lastRowReadSearchIndexRow: null = no result read, 0 = no more search results????
	matchWordOrder: boolean;
}

type SearchIndexStateInfo = {
	initializing: boolean;
	mailIndexEnabled: boolean;
	progress: number;
	currentMailIndexTimestamp: number;
	indexedMailCount: number;
	failedIndexingUpTo: ?number;
}

type CreditCardData = {
	number: string,
	cvv: string,
	expirationDate: string
}

type PayPalData = {
	account: string
}
type InvoiceData = {
	invoiceAddress: string;
	country: ?Country;
	vatNumber: string; // only for EU countries otherwise empty
}
type PaymentData = {
	paymentMethod: PaymentMethodTypeEnum;
	creditCardData: ?CreditCard;
}

type WsConnectionState = "connecting" | "connected" | "terminated"