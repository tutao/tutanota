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
	| 'signup'
	| 'createSession'
	| 'createExternalSession'
	| 'loadExternalPasswordChannels'
	| 'sendExternalPasswordSms'
	| 'retrieveExternalSmsPassword'
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
type MainRequestType = 'execNative'
	| 'entityEvent'
	| 'error'
	| 'progress'
	| 'updateIndexState'
	| 'updateWebSocketState'
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
type JsRequestType = 'createMailEditor'
	| 'handleBackPress'
	| 'showAlertDialog'
	| 'openMailbox'
	| 'keyboardSizeChanged'


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
	platformId: ?"ios" | ?"android",
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

type RecipientInfoTypeEnum = 'unknown' | 'internal' | 'external'

type RecipientInfoName = 'RecipientInfo'
type RecipientInfo = {
	_type: RecipientInfoName,
	type: RecipientInfoTypeEnum,
	mailAddress: string,
	name: string, // empty string if no name is available
	contact: ?Contact, // The resolved contact or a new contact instance with the given email address and name. A new contact is used to store a shared password if applicable. Null if no contact shall be resolved.
	resolveContactPromise: ?Promise<?Contact> // Null if resolving contact is finished
}

type DataFile = {
	_type: 'DataFile',
	name: string,
	mimeType: string,
	data: Uint8Array,
	size: number,
	id: ?IdTuple
}

type FileReference = {
	_type: 'FileReference',
	name: string,
	mimeType: string,
	location: string,
	size: number
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
	moreResultsEntries: MoreResultsIndexEntry[];
}

type SearchIndexStateInfo = {
	initializing: boolean;
	indexingSupported: boolean;
	mailIndexEnabled: boolean;
	progress: number;
	currentMailIndexTimestamp: number;
}

type SubscriptionOptions = {
	businessUse: boolean,
	paymentInterval: number,
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