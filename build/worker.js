import "./dist-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertWorkerOrNode, getWebsocketBaseUrl, isAdminClient, isAndroidApp, isApp, isBrowser, isIOSApp, isMainOrNode, isOfflineStorageAvailable, isTest } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { DAY_IN_MILLIS, LazyLoaded, TypeRef, arrayEquals, assertNotNull, base64ToBase64Url, base64ToUint8Array, byteArraysToBytes, bytesToByteArrays, clone, concat, debounce, deduplicate, defer, delay, downcast, first, getDayShifted, getFirstOrThrow, getFromMap, getStartOfDay, groupBy, groupByAndMap, isEmpty, isNotNull, isSameTypeRef, isSameTypeRefByAttr, lazyMemoized, neverNull, noOp, ofClass, pMap, remove, stringToUtf8Uint8Array, typedEntries, typedKeys, uint8ArrayToBase64, uint8ArrayToHex, utf8Uint8ArrayToString } from "./dist2-chunk.js";
import { AccountType, BlobAccessTokenKind, BucketPermissionType, Const, CryptoProtocolVersion, EncryptionAuthStatus, GroupKeyRotationType, GroupType, KdfType, OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS, OperationType, PermissionType, PublicKeyIdentifierType, SYSTEM_GROUP_MAIL_ADDRESS, asCryptoProtoocolVersion, assertEnumValue } from "./TutanotaConstants-chunk.js";
import { AssociationType, Cardinality, DEFAULT_MAILSET_ENTRY_CUSTOM_CUTOFF_TIMESTAMP, GENERATED_MAX_ID, GENERATED_MIN_ID, Type, ValueType, constructMailSetEntryId, customIdToString, customIdToUint8array, elementIdPart, firstBiggerThanSecond, getElementId, getListId, isSameId, listIdPart, stringToCustomId, timestampToGeneratedId } from "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import { CalendarEventTypeRef, CalendarEventUpdateTypeRef, CalendarGroupRootTypeRef, ContactListEntryTypeRef, ContactListGroupRootTypeRef, ContactListTypeRef, ContactTypeRef, EmailTemplateTypeRef, FileSystemTypeRef, FileTypeRef, InternalRecipientKeyDataTypeRef, KnowledgeBaseEntryTypeRef, MailBoxTypeRef, MailDetailsBlobTypeRef, MailDetailsDraftTypeRef, MailFolderTypeRef, MailSetEntryTypeRef, MailTypeRef, MailboxGroupRootTypeRef, MailboxPropertiesTypeRef, TemplateGroupRootTypeRef, TutanotaPropertiesTypeRef, UserSettingsGroupRootTypeRef, createEncryptTutanotaPropertiesData, createEntropyData, createInternalRecipientKeyData, createMail, createMailBox, createSymEncInternalRecipientKeyData } from "./TypeRefs-chunk.js";
import "./TypeModels2-chunk.js";
import { AccountingInfoTypeRef, AuditLogEntryTypeRef, BucketKeyTypeRef, BucketPermissionTypeRef, CustomerInfoTypeRef, CustomerServerPropertiesTypeRef, CustomerTypeRef, GiftCardTypeRef, GroupInfoTypeRef, GroupKeyTypeRef, GroupKeyUpdateTypeRef, GroupMemberTypeRef, GroupTypeRef, InvoiceTypeRef, KeyRotationTypeRef, MissedNotificationTypeRef, OrderProcessingAgreementTypeRef, PermissionTypeRef, PushIdentifierTypeRef, ReceivedGroupInvitationTypeRef, RecoverCodeTypeRef, SentGroupInvitationTypeRef, UserAlarmInfoTypeRef, UserGroupKeyDistributionTypeRef, UserGroupRootTypeRef, UserTypeRef, WhitelabelChildTypeRef, createAdminGroupKeyAuthenticationData, createAdminGroupKeyRotationPostIn, createCustomerInfo, createGroupKeyRotationData, createGroupKeyRotationPostIn, createGroupKeyUpdateData, createGroupMembershipKeyData, createGroupMembershipUpdateData, createInstanceSessionKey, createKeyPair, createMembershipPutIn, createPubEncKeyData, createPublicKeyGetIn, createPublicKeyPutIn, createRecoverCodeData, createUpdatePermissionKeyData, createUpdateSessionKeysPostIn, createUserGroupKeyRotationData, createUserGroupKeyRotationPostIn, createWebsocketLeaderStatus } from "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import { Logger, replaceNativeLogger } from "./Logger-chunk.js";
import "./ErrorHandler-chunk.js";
import { HttpMethod, MediaType, modelInfos, resolveTypeReference } from "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import { RecipientNotResolvedError, SessionKeyNotFoundError } from "./ErrorUtils-chunk.js";
import { ConnectionError, LockedError, NotAuthenticatedError, NotFoundError, PayloadTooLargeError, ServiceUnavailableError, TooManyRequestsError } from "./RestError-chunk.js";
import "./SetupMultipleError-chunk.js";
import { OutOfSyncError } from "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./EventQueue-chunk.js";
import { CustomCacheHandlerMap, DefaultEntityRestCache, EntityRestClient, EventBusClient, OfflineStorage, WebWorkerTransport, customIdToBase64Url, ensureBase64Ext, expandId, typeRefToPath } from "./EntityRestClient-chunk.js";
import "./SuspensionError-chunk.js";
import { LoginIncompleteError } from "./LoginIncompleteError-chunk.js";
import { CryptoError } from "./CryptoError-chunk.js";
import { RecipientsNotFoundError } from "./RecipientsNotFoundError-chunk.js";
import "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import "./DeviceStorageUnavailableError-chunk.js";
import "./MailBodyTooLargeError-chunk.js";
import "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import "./PermissionError-chunk.js";
import { MessageDispatcher, Request, errorToObj } from "./MessageDispatcher-chunk.js";
import { exposeLocalDelayed, exposeRemote } from "./WorkerProxy-chunk.js";
import "./EntityUpdateUtils-chunk.js";
import { SessionType } from "./SessionType-chunk.js";
import { AdminGroupKeyRotationService, GroupKeyRotationInfoService, GroupKeyRotationService, MembershipService, PublicKeyService, UpdatePermissionKeyService, UpdateSessionKeysService, UserGroupKeyRotationService } from "./Services-chunk.js";
import { EntityClient } from "./EntityClient-chunk.js";
import { ENABLE_MAC, IV_BYTE_LENGTH, KEY_LENGTH_BYTES_AES_256, KYBER_RAND_AMOUNT_OF_ENTROPY, KeyPairType, aes256RandomKey, aesDecrypt, aesEncrypt, authenticatedAesDecrypt, bitArrayToUint8Array, createAuthVerifier, decapsulate, decryptKey, decryptKeyPair, eccDecapsulate, eccEncapsulate, encapsulate, encryptKey, generateEccKeyPair, generateKeyFromPassphrase, generateKeyPair, getKeyLengthBytes, hexToRsaPublicKey, hkdf, isPqKeyPairs, isPqPublicKey, isRsaEccKeyPair, isRsaOrRsaEccKeyPair, isRsaPublicKey, keyToBase64, keyToUint8Array, kyberPublicKeyToBytes, pqKeyPairsToPublicKeys, random, rsaDecrypt, rsaEncrypt, sha256Hash, uint8ArrayToBitArray, uint8ArrayToKey } from "./dist3-chunk.js";
import "./PageContextLoginListener-chunk.js";
import "./CredentialType-chunk.js";
import { CryptoWrapper, encryptBytes, encryptKeyWithVersionedKey } from "./CryptoWrapper-chunk.js";
import { LoginFacade } from "./LoginFacade-chunk.js";
import { RestClient } from "./RestClient-chunk.js";
import { ExportFacadeSendDispatcher, FileFacadeSendDispatcher, InterWindowEventFacadeSendDispatcher, NativeFileApp, NativePushFacadeSendDispatcher } from "./InterWindowEventFacadeSendDispatcher-chunk.js";
import { birthdayToIsoDate, oldBirthdayToBirthday } from "./BirthdayUtils-chunk.js";
import { EncryptTutanotaPropertiesService, EntropyService } from "./Services2-chunk.js";
import { compress, uncompress } from "./Compression-chunk.js";
import { DomainConfigProvider, FolderSystem, NoZoneDateProvider, SchedulerImpl } from "./FolderSystem-chunk.js";
import { BlobAccessTokenService, createBlobAccessTokenPostIn, createBlobReadData, createBlobWriteData, createInstanceId } from "./Services3-chunk.js";
import { getUserGroupMemberships } from "./GroupUtils-chunk.js";
import { isDraft, isSpamOrTrashFolder } from "./MailChecks-chunk.js";

//#region src/common/api/worker/SuspensionHandler.ts
var SuspensionHandler = class {
	_isSuspended;
	_suspendedUntil;
	_deferredRequests;
	_hasSentInfoMessage;
	_timeout;
	constructor(infoMessageHandler, systemTimeout) {
		this.infoMessageHandler = infoMessageHandler;
		this._isSuspended = false;
		this._suspendedUntil = 0;
		this._deferredRequests = [];
		this._hasSentInfoMessage = false;
		this._timeout = systemTimeout;
	}
	/**
	* Activates suspension states for the given amount of seconds. After the end of the suspension time all deferred requests are executed.
	*/
	activateSuspensionIfInactive(suspensionDurationSeconds, resourceURL) {
		if (!this.isSuspended()) {
			console.log(`Activating suspension (${resourceURL}):  ${suspensionDurationSeconds}s`);
			this._isSuspended = true;
			const suspensionStartTime = Date.now();
			this._timeout.setTimeout(async () => {
				this._isSuspended = false;
				console.log(`Suspension released after ${(Date.now() - suspensionStartTime) / 1e3}s`);
				await this._onSuspensionComplete();
			}, suspensionDurationSeconds * 1e3);
			if (!this._hasSentInfoMessage) {
				this.infoMessageHandler.onInfoMessage({
					translationKey: "clientSuspensionWait_label",
					args: {}
				});
				this._hasSentInfoMessage = true;
			}
		}
	}
	isSuspended() {
		return this._isSuspended;
	}
	/**
	* Adds a request to the deferred queue.
	* @param request
	* @returns {Promise<T>}
	*/
	deferRequest(request) {
		if (this._isSuspended) {
			const deferredObject = defer();
			this._deferredRequests.push(deferredObject);
			deferredObject.promise = deferredObject.promise.then(() => request());
			return deferredObject.promise;
		} else return request();
	}
	async _onSuspensionComplete() {
		const deferredRequests = this._deferredRequests;
		this._deferredRequests = [];
		for (let deferredRequest of deferredRequests) {
			deferredRequest.resolve(null);
			await deferredRequest.promise.catch(noOp);
		}
	}
};

//#endregion
//#region src/common/api/worker/facades/DeviceEncryptionFacade.ts
var DeviceEncryptionFacade = class {
	/**
	* Generates an encryption key.
	*/
	async generateKey() {
		return bitArrayToUint8Array(aes256RandomKey());
	}
	/**
	* Encrypts {@param data} using {@param deviceKey}.
	* @param deviceKey Key used for encryption
	* @param data Data to encrypt.
	*/
	async encrypt(deviceKey, data) {
		return aesEncrypt(uint8ArrayToBitArray(deviceKey), data);
	}
	/**
	* Decrypts {@param encryptedData} using {@param deviceKey}.
	* @param deviceKey Key used for encryption
	* @param encryptedData Data to be decrypted.
	*/
	async decrypt(deviceKey, encryptedData) {
		return aesDecrypt(uint8ArrayToBitArray(deviceKey), encryptedData);
	}
};

//#endregion
//#region src/common/native/worker/AesApp.ts
var AesApp = class {
	constructor(nativeCryptoFacade, random$1) {
		this.nativeCryptoFacade = nativeCryptoFacade;
		this.random = random$1;
	}
	/**
	* Encrypts a file with the provided key
	* @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
	*/
	aesEncryptFile(key, fileUrl) {
		const iv = this.random.generateRandomData(IV_BYTE_LENGTH);
		const encodedKey = keyToUint8Array(key);
		return this.nativeCryptoFacade.aesEncryptFile(encodedKey, fileUrl, iv);
	}
	/**
	* Decrypt bytes with the provided key
	* @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
	*/
	aesDecryptFile(key, fileUrl) {
		const encodedKey = keyToUint8Array(key);
		return this.nativeCryptoFacade.aesDecryptFile(encodedKey, fileUrl);
	}
};

//#endregion
//#region src/common/native/common/generatedipc/NativeCryptoFacadeSendDispatcher.ts
var NativeCryptoFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async rsaEncrypt(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCryptoFacade",
			"rsaEncrypt",
			...args
		]);
	}
	async rsaDecrypt(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCryptoFacade",
			"rsaDecrypt",
			...args
		]);
	}
	async aesEncryptFile(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCryptoFacade",
			"aesEncryptFile",
			...args
		]);
	}
	async aesDecryptFile(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCryptoFacade",
			"aesDecryptFile",
			...args
		]);
	}
	async argon2idGeneratePassphraseKey(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCryptoFacade",
			"argon2idGeneratePassphraseKey",
			...args
		]);
	}
	async generateKyberKeypair(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCryptoFacade",
			"generateKyberKeypair",
			...args
		]);
	}
	async kyberEncapsulate(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCryptoFacade",
			"kyberEncapsulate",
			...args
		]);
	}
	async kyberDecapsulate(...args) {
		return this.transport.invokeNative("ipc", [
			"NativeCryptoFacade",
			"kyberDecapsulate",
			...args
		]);
	}
};

//#endregion
//#region src/common/api/worker/crypto/RsaImplementation.ts
async function createRsaImplementation(native) {
	if (isApp()) {
		const { RsaApp } = await import("./RsaApp-chunk.js");
		return new RsaApp(new NativeCryptoFacadeSendDispatcher(native), random);
	} else return new RsaWeb();
}
var RsaWeb = class {
	async encrypt(publicKey, bytes) {
		const seed = random.generateRandomData(32);
		return rsaEncrypt(publicKey, bytes, seed);
	}
	async decrypt(privateKey, bytes) {
		return rsaDecrypt(privateKey, bytes);
	}
};

//#endregion
//#region src/common/api/worker/crypto/AsymmetricCryptoFacade.ts
assertWorkerOrNode();
var AsymmetricCryptoFacade = class {
	constructor(rsa, pqFacade, keyLoaderFacade, cryptoWrapper, serviceExecutor) {
		this.rsa = rsa;
		this.pqFacade = pqFacade;
		this.keyLoaderFacade = keyLoaderFacade;
		this.cryptoWrapper = cryptoWrapper;
		this.serviceExecutor = serviceExecutor;
	}
	/**
	* Verifies whether the key that the public key service returns is the same as the one used for encryption.
	* When we have key verification we should stop verifying against the PublicKeyService but against the verified key.
	*
	* @param identifier the identifier to load the public key to verify that it matches the one used in the protocol run.
	* @param senderIdentityPubKey the senderIdentityPubKey that was used to encrypt/authenticate the data.
	* @param senderKeyVersion the version of the senderIdentityPubKey.
	*/
	async authenticateSender(identifier, senderIdentityPubKey, senderKeyVersion) {
		const keyData = createPublicKeyGetIn({
			identifier: identifier.identifier,
			identifierType: identifier.identifierType,
			version: senderKeyVersion.toString()
		});
		const publicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, keyData);
		return publicKeyGetOut.pubEccKey != null && arrayEquals(publicKeyGetOut.pubEccKey, senderIdentityPubKey) ? EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED : EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED;
	}
	/**
	* Decrypts the pubEncSymKey with the recipientKeyPair and authenticates it if the protocol supports authentication.
	* If the protocol does not support authentication this method will only decrypt.
	* @param recipientKeyPair the recipientKeyPair. Must match the cryptoProtocolVersion and must be of the required recipientKeyVersion.
	* @param pubEncKeyData the encrypted symKey with the metadata (versions, group identifier etc.) for decryption and authentication.
	* @param senderIdentifier the identifier for the sender's key group
	* @throws CryptoError in case the authentication fails.
	*/
	async decryptSymKeyWithKeyPairAndAuthenticate(recipientKeyPair, pubEncKeyData, senderIdentifier) {
		const cryptoProtocolVersion = asCryptoProtoocolVersion(pubEncKeyData.protocolVersion);
		const decapsulatedAesKey = await this.decryptSymKeyWithKeyPair(recipientKeyPair, cryptoProtocolVersion, pubEncKeyData.pubEncSymKey);
		if (cryptoProtocolVersion === CryptoProtocolVersion.TUTA_CRYPT) {
			const encryptionAuthStatus = await this.authenticateSender(senderIdentifier, assertNotNull(decapsulatedAesKey.senderIdentityPubKey), Number(assertNotNull(pubEncKeyData.senderKeyVersion)));
			if (encryptionAuthStatus !== EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED) throw new CryptoError("the provided public key could not be authenticated");
		}
		return decapsulatedAesKey;
	}
	/**
	* Decrypts the pubEncSymKey with the recipientKeyPair.
	* @param pubEncSymKey the asymmetrically encrypted session key
	* @param cryptoProtocolVersion asymmetric protocol to decrypt pubEncSymKey (RSA or TutaCrypt)
	* @param recipientKeyPair the recipientKeyPair. Must match the cryptoProtocolVersion.
	*/
	async decryptSymKeyWithKeyPair(recipientKeyPair, cryptoProtocolVersion, pubEncSymKey) {
		switch (cryptoProtocolVersion) {
			case CryptoProtocolVersion.RSA: {
				if (!isRsaOrRsaEccKeyPair(recipientKeyPair)) throw new CryptoError("wrong key type. expected rsa. got " + recipientKeyPair.keyPairType);
				const privateKey = recipientKeyPair.privateKey;
				const decryptedSymKey = await this.rsa.decrypt(privateKey, pubEncSymKey);
				return {
					decryptedAesKey: uint8ArrayToBitArray(decryptedSymKey),
					senderIdentityPubKey: null
				};
			}
			case CryptoProtocolVersion.TUTA_CRYPT: {
				if (!isPqKeyPairs(recipientKeyPair)) throw new CryptoError("wrong key type. expected TutaCrypt. got " + recipientKeyPair.keyPairType);
				const { decryptedSymKeyBytes, senderIdentityPubKey } = await this.pqFacade.decapsulateEncoded(pubEncSymKey, recipientKeyPair);
				return {
					decryptedAesKey: uint8ArrayToBitArray(decryptedSymKeyBytes),
					senderIdentityPubKey
				};
			}
			default: throw new CryptoError("invalid cryptoProtocolVersion: " + cryptoProtocolVersion);
		}
	}
	/**
	* Loads the recipient key pair in the required version and decrypts the pubEncSymKey with it.
	*/
	async loadKeyPairAndDecryptSymKey(recipientKeyPairGroupId, recipientKeyVersion, cryptoProtocolVersion, pubEncSymKey) {
		const keyPair = await this.keyLoaderFacade.loadKeypair(recipientKeyPairGroupId, recipientKeyVersion);
		return await this.decryptSymKeyWithKeyPair(keyPair, cryptoProtocolVersion, pubEncSymKey);
	}
	/**
	* Encrypts the symKey asymmetrically with the provided public keys.
	* @param symKey the symmetric key  to be encrypted
	* @param recipientPublicKeys the public key(s) of the recipient in the current version
	* @param senderGroupId the group id of the sender. will only be used in case we also need the sender's key pair, e.g. with TutaCrypt.
	*/
	async asymEncryptSymKey(symKey, recipientPublicKeys, senderGroupId) {
		const recipientPublicKey = this.extractRecipientPublicKey(recipientPublicKeys.object);
		const keyPairType = recipientPublicKey.keyPairType;
		if (isPqPublicKey(recipientPublicKey)) {
			const senderKeyPair = await this.keyLoaderFacade.loadCurrentKeyPair(senderGroupId);
			const senderEccKeyPair = await this.getOrMakeSenderIdentityKeyPair(senderKeyPair.object, senderGroupId);
			return this.tutaCryptEncryptSymKeyImpl({
				object: recipientPublicKey,
				version: recipientPublicKeys.version
			}, symKey, {
				object: senderEccKeyPair,
				version: senderKeyPair.version
			});
		} else if (isRsaPublicKey(recipientPublicKey)) {
			const pubEncSymKeyBytes = await this.rsa.encrypt(recipientPublicKey, bitArrayToUint8Array(symKey));
			return {
				pubEncSymKeyBytes,
				cryptoProtocolVersion: CryptoProtocolVersion.RSA,
				senderKeyVersion: null,
				recipientKeyVersion: recipientPublicKeys.version
			};
		}
		throw new CryptoError("unknown public key type: " + keyPairType);
	}
	/**
	* Encrypts the symKey asymmetrically with the provided public keys using the TutaCrypt protocol.
	* @param symKey the key to be encrypted
	* @param recipientPublicKeys MUST be a pq key pair
	* @param senderEccKeyPair the sender's key pair (needed for authentication)
	* @throws ProgrammingError if the recipientPublicKeys are not suitable for TutaCrypt
	*/
	async tutaCryptEncryptSymKey(symKey, recipientPublicKeys, senderEccKeyPair) {
		const recipientPublicKey = this.extractRecipientPublicKey(recipientPublicKeys.object);
		if (!isPqPublicKey(recipientPublicKey)) throw new ProgrammingError("the recipient does not have pq key pairs");
		return this.tutaCryptEncryptSymKeyImpl({
			object: recipientPublicKey,
			version: recipientPublicKeys.version
		}, symKey, senderEccKeyPair);
	}
	async tutaCryptEncryptSymKeyImpl(recipientPublicKey, symKey, senderEccKeyPair) {
		const ephemeralKeyPair = this.cryptoWrapper.generateEccKeyPair();
		const pubEncSymKeyBytes = await this.pqFacade.encapsulateAndEncode(senderEccKeyPair.object, ephemeralKeyPair, recipientPublicKey.object, bitArrayToUint8Array(symKey));
		const senderKeyVersion = senderEccKeyPair.version;
		return {
			pubEncSymKeyBytes,
			cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
			senderKeyVersion,
			recipientKeyVersion: recipientPublicKey.version
		};
	}
	extractRecipientPublicKey(publicKeys) {
		if (publicKeys.pubRsaKey) return hexToRsaPublicKey(uint8ArrayToHex(publicKeys.pubRsaKey));
else if (publicKeys.pubKyberKey && publicKeys.pubEccKey) {
			const eccPublicKey = publicKeys.pubEccKey;
			const kyberPublicKey = this.cryptoWrapper.bytesToKyberPublicKey(publicKeys.pubKyberKey);
			return {
				keyPairType: KeyPairType.TUTA_CRYPT,
				eccPublicKey,
				kyberPublicKey
			};
		} else throw new Error("Inconsistent Keypair");
	}
	/**
	* Returns the SenderIdentityKeyPair that is either already on the KeyPair that is being passed in,
	* or creates a new one and writes it to the respective Group.
	* @param senderKeyPair
	* @param keyGroupId Id for the Group that Public Key Service might write a new IdentityKeyPair for.
	* 						This is necessary as a User might send an E-Mail from a shared mailbox,
	* 						for which the KeyPair should be created.
	*/
	async getOrMakeSenderIdentityKeyPair(senderKeyPair, keyGroupId) {
		const algo = senderKeyPair.keyPairType;
		if (isPqKeyPairs(senderKeyPair)) return senderKeyPair.eccKeyPair;
else if (isRsaEccKeyPair(senderKeyPair)) return {
			publicKey: senderKeyPair.publicEccKey,
			privateKey: senderKeyPair.privateEccKey
		};
else if (isRsaOrRsaEccKeyPair(senderKeyPair)) {
			const symGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(keyGroupId);
			const newIdentityKeyPair = this.cryptoWrapper.generateEccKeyPair();
			const symEncPrivEccKey = this.cryptoWrapper.encryptEccKey(symGroupKey.object, newIdentityKeyPair.privateKey);
			const data = createPublicKeyPutIn({
				pubEccKey: newIdentityKeyPair.publicKey,
				symEncPrivEccKey,
				keyGroup: keyGroupId
			});
			await this.serviceExecutor.put(PublicKeyService, data);
			return newIdentityKeyPair;
		} else throw new CryptoError("unknown key pair type: " + algo);
	}
};
function convertToVersionedPublicKeys(publicKeyGetOut) {
	return {
		object: {
			pubRsaKey: publicKeyGetOut.pubRsaKey,
			pubKyberKey: publicKeyGetOut.pubKyberKey,
			pubEccKey: publicKeyGetOut.pubEccKey
		},
		version: Number(publicKeyGetOut.pubKeyVersion)
	};
}

//#endregion
//#region src/common/api/worker/crypto/CryptoFacade.ts
assertWorkerOrNode();
var CryptoFacade = class {
	constructor(userFacade, entityClient, restClient, serviceExecutor, instanceMapper, ownerEncSessionKeysUpdateQueue, cache, keyLoaderFacade, asymmetricCryptoFacade) {
		this.userFacade = userFacade;
		this.entityClient = entityClient;
		this.restClient = restClient;
		this.serviceExecutor = serviceExecutor;
		this.instanceMapper = instanceMapper;
		this.ownerEncSessionKeysUpdateQueue = ownerEncSessionKeysUpdateQueue;
		this.cache = cache;
		this.keyLoaderFacade = keyLoaderFacade;
		this.asymmetricCryptoFacade = asymmetricCryptoFacade;
	}
	async applyMigrationsForInstance(decryptedInstance) {
		const instanceType = downcast(decryptedInstance)._type;
		if (isSameTypeRef(instanceType, ContactTypeRef)) {
			const contact = downcast(decryptedInstance);
			try {
				if (!contact.birthdayIso && contact.oldBirthdayAggregate) {
					contact.birthdayIso = birthdayToIsoDate(contact.oldBirthdayAggregate);
					contact.oldBirthdayAggregate = null;
					contact.oldBirthdayDate = null;
					await this.entityClient.update(contact);
				} else if (!contact.birthdayIso && contact.oldBirthdayDate) {
					contact.birthdayIso = birthdayToIsoDate(oldBirthdayToBirthday(contact.oldBirthdayDate));
					contact.oldBirthdayDate = null;
					await this.entityClient.update(contact);
				} else if (contact.birthdayIso && (contact.oldBirthdayAggregate || contact.oldBirthdayDate)) {
					contact.oldBirthdayAggregate = null;
					contact.oldBirthdayDate = null;
					await this.entityClient.update(contact);
				}
			} catch (e) {
				if (!(e instanceof LockedError)) throw e;
			}
		}
		return decryptedInstance;
	}
	async resolveSessionKeyForInstance(instance) {
		const typeModel = await resolveTypeReference(instance._type);
		return this.resolveSessionKey(typeModel, instance);
	}
	/** Helper for the rare cases when we needed it on the client side. */
	async resolveSessionKeyForInstanceBinary(instance) {
		const key = await this.resolveSessionKeyForInstance(instance);
		return key == null ? null : bitArrayToUint8Array(key);
	}
	/** Resolve a session key an {@param instance} using an already known {@param ownerKey}. */
	resolveSessionKeyWithOwnerKey(instance, ownerKey) {
		let key = instance._ownerEncSessionKey;
		if (typeof key === "string") key = base64ToUint8Array(key);
		return decryptKey(ownerKey, key);
	}
	async decryptSessionKey(instance, ownerEncSessionKey) {
		const gk = await this.keyLoaderFacade.loadSymGroupKey(instance._ownerGroup, ownerEncSessionKey.encryptingKeyVersion);
		return decryptKey(gk, ownerEncSessionKey.key);
	}
	/**
	* Returns the session key for the provided type/instance:
	* * null, if the instance is unencrypted
	* * the decrypted _ownerEncSessionKey, if it is available
	* * the public decrypted session key, otherwise
	*
	* @param typeModel the type model of the instance
	* @param instance The unencrypted (client-side) instance or encrypted (server-side) object literal
	*/
	async resolveSessionKey(typeModel, instance) {
		try {
			if (!typeModel.encrypted) return null;
			if (instance.bucketKey) {
				const bucketKey = await this.convertBucketKeyToInstanceIfNecessary(instance.bucketKey);
				const resolvedSessionKeys = await this.resolveWithBucketKey(bucketKey, instance, typeModel);
				return resolvedSessionKeys.resolvedSessionKeyForInstance;
			} else if (instance._ownerEncSessionKey && this.userFacade.isFullyLoggedIn() && this.userFacade.hasGroup(instance._ownerGroup)) {
				const gk = await this.keyLoaderFacade.loadSymGroupKey(instance._ownerGroup, Number(instance._ownerKeyVersion ?? 0));
				return this.resolveSessionKeyWithOwnerKey(instance, gk);
			} else if (instance.ownerEncSessionKey) {
				const gk = await this.keyLoaderFacade.loadSymGroupKey(this.userFacade.getGroupId(GroupType.Mail), Number(instance.ownerKeyVersion ?? 0));
				return this.resolveSessionKeyWithOwnerKey(instance, gk);
			} else {
				const permissions = await this.entityClient.loadAll(PermissionTypeRef, instance._permissions);
				return await this.trySymmetricPermission(permissions) ?? await this.resolveWithPublicOrExternalPermission(permissions, instance, typeModel);
			}
		} catch (e) {
			if (e instanceof CryptoError) {
				console.log("failed to resolve session key", e);
				throw new SessionKeyNotFoundError("Crypto error while resolving session key for instance " + instance._id);
			} else throw e;
		}
	}
	/**
	* Takes a freshly JSON-parsed, unmapped object and apply migrations as necessary
	* @param typeRef
	* @param data
	* @return the unmapped and still encrypted instance
	*/
	async applyMigrations(typeRef, data) {
		if (isSameTypeRef(typeRef, GroupInfoTypeRef) && data._ownerGroup == null) return this.applyCustomerGroupOwnershipToGroupInfo(data);
else if (isSameTypeRef(typeRef, TutanotaPropertiesTypeRef) && data._ownerEncSessionKey == null) return this.encryptTutanotaProperties(data);
else if (isSameTypeRef(typeRef, PushIdentifierTypeRef) && data._ownerEncSessionKey == null) return this.addSessionKeyToPushIdentifier(data);
else return data;
	}
	/**
	* In case the given bucketKey is a literal the literal will be converted to an instance and return. In case the BucketKey is already an instance the
	* instance is returned.
	* @param bucketKeyInstanceOrLiteral The bucket key as literal or instance
	*/
	async convertBucketKeyToInstanceIfNecessary(bucketKeyInstanceOrLiteral) {
		if (this.isLiteralInstance(bucketKeyInstanceOrLiteral)) {
			const bucketKeyTypeModel = await resolveTypeReference(BucketKeyTypeRef);
			return await this.instanceMapper.decryptAndMapToInstance(bucketKeyTypeModel, bucketKeyInstanceOrLiteral, null);
		} else return bucketKeyInstanceOrLiteral;
	}
	async resolveWithBucketKey(bucketKey, instance, typeModel) {
		const instanceElementId = this.getElementIdFromInstance(instance);
		let decryptedBucketKey;
		let unencryptedSenderAuthStatus = null;
		let pqMessageSenderKey = null;
		if (bucketKey.keyGroup && bucketKey.pubEncBucketKey) {
			const { decryptedAesKey, senderIdentityPubKey } = await this.asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(bucketKey.keyGroup, Number(bucketKey.recipientKeyVersion), asCryptoProtoocolVersion(bucketKey.protocolVersion), bucketKey.pubEncBucketKey);
			decryptedBucketKey = decryptedAesKey;
			pqMessageSenderKey = senderIdentityPubKey;
		} else if (bucketKey.groupEncBucketKey) {
			let keyGroup;
			const groupKeyVersion = Number(bucketKey.recipientKeyVersion);
			if (bucketKey.keyGroup) keyGroup = bucketKey.keyGroup;
else keyGroup = neverNull(instance._ownerGroup);
			decryptedBucketKey = await this.resolveWithGroupReference(keyGroup, groupKeyVersion, bucketKey.groupEncBucketKey);
			unencryptedSenderAuthStatus = EncryptionAuthStatus.AES_NO_AUTHENTICATION;
		} else throw new SessionKeyNotFoundError(`encrypted bucket key not set on instance ${typeModel.name}`);
		const resolvedSessionKeys = await this.collectAllInstanceSessionKeysAndAuthenticate(bucketKey, decryptedBucketKey, instanceElementId, instance, typeModel, unencryptedSenderAuthStatus, pqMessageSenderKey);
		await this.ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(resolvedSessionKeys.instanceSessionKeys, typeModel);
		const groupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(instance._ownerGroup);
		this.setOwnerEncSessionKeyUnmapped(instance, encryptKeyWithVersionedKey(groupKey, resolvedSessionKeys.resolvedSessionKeyForInstance));
		return resolvedSessionKeys;
	}
	/**
	* Calculates the SHA-256 checksum of a string value as UTF-8 bytes and returns it as a base64-encoded string
	*/
	async sha256(value) {
		return uint8ArrayToBase64(sha256Hash(stringToUtf8Uint8Array(value)));
	}
	/**
	* Decrypts the given encrypted bucket key with the group key of the given group. In case the current user is not
	* member of the key group the function tries to resolve the group key using the adminEncGroupKey.
	* This is necessary for resolving the BucketKey when receiving a reply from an external Mailbox.
	* @param keyGroup The group that holds the encryption key.
	* @param groupKeyVersion the version of the key from the keyGroup
	* @param groupEncBucketKey The group key encrypted bucket key.
	*/
	async resolveWithGroupReference(keyGroup, groupKeyVersion, groupEncBucketKey) {
		if (this.userFacade.hasGroup(keyGroup)) {
			const groupKey = await this.keyLoaderFacade.loadSymGroupKey(keyGroup, groupKeyVersion);
			return decryptKey(groupKey, groupEncBucketKey);
		} else {
			const externalMailGroupId = keyGroup;
			const externalMailGroupKeyVersion = groupKeyVersion;
			const externalMailGroup = await this.entityClient.load(GroupTypeRef, externalMailGroupId);
			const externalUserGroupdId = externalMailGroup.admin;
			if (!externalUserGroupdId) throw new SessionKeyNotFoundError("no admin group on key group: " + externalMailGroupId);
			const externalUserGroupKeyVersion = Number(externalMailGroup.adminGroupKeyVersion ?? 0);
			const externalUserGroup = await this.entityClient.load(GroupTypeRef, externalUserGroupdId);
			const internalUserGroupId = externalUserGroup.admin;
			const internalUserGroupKeyVersion = Number(externalUserGroup.adminGroupKeyVersion ?? 0);
			if (!(internalUserGroupId && this.userFacade.hasGroup(internalUserGroupId))) throw new SessionKeyNotFoundError("no admin group or no membership of admin group: " + internalUserGroupId);
			const internalUserGroupKey = await this.keyLoaderFacade.loadSymGroupKey(internalUserGroupId, internalUserGroupKeyVersion);
			const currentExternalUserGroupKey = decryptKey(internalUserGroupKey, assertNotNull(externalUserGroup.adminGroupEncGKey));
			const externalUserGroupKey = await this.keyLoaderFacade.loadSymGroupKey(externalUserGroupdId, externalUserGroupKeyVersion, {
				object: currentExternalUserGroupKey,
				version: Number(externalUserGroup.groupKeyVersion)
			});
			const currentExternalMailGroupKey = decryptKey(externalUserGroupKey, assertNotNull(externalMailGroup.adminGroupEncGKey));
			const externalMailGroupKey = await this.keyLoaderFacade.loadSymGroupKey(externalMailGroupId, externalMailGroupKeyVersion, {
				object: currentExternalMailGroupKey,
				version: Number(externalMailGroup.groupKeyVersion)
			});
			return decryptKey(externalMailGroupKey, groupEncBucketKey);
		}
	}
	async addSessionKeyToPushIdentifier(data) {
		const userGroupKey = this.userFacade.getCurrentUserGroupKey();
		const typeModel = await resolveTypeReference(PushIdentifierTypeRef);
		await this.updateOwnerEncSessionKey(typeModel, data, userGroupKey, aes256RandomKey());
		return data;
	}
	async encryptTutanotaProperties(data) {
		const userGroupKey = this.userFacade.getCurrentUserGroupKey();
		const groupEncSessionKey = encryptKeyWithVersionedKey(userGroupKey, aes256RandomKey());
		this.setOwnerEncSessionKeyUnmapped(data, groupEncSessionKey, this.userFacade.getUserGroupId());
		const migrationData = createEncryptTutanotaPropertiesData({
			properties: data._id,
			symKeyVersion: String(groupEncSessionKey.encryptingKeyVersion),
			symEncSessionKey: groupEncSessionKey.key
		});
		await this.serviceExecutor.post(EncryptTutanotaPropertiesService, migrationData);
		return data;
	}
	async applyCustomerGroupOwnershipToGroupInfo(data) {
		const customerGroupMembership = assertNotNull(this.userFacade.getLoggedInUser().memberships.find((g) => g.groupType === GroupType.Customer));
		const listPermissions = await this.entityClient.loadAll(PermissionTypeRef, data._id[0]);
		const customerGroupPermission = listPermissions.find((p) => p.group === customerGroupMembership.group);
		if (!customerGroupPermission) throw new SessionKeyNotFoundError("Permission not found, could not apply OwnerGroup migration");
		const customerGroupKeyVersion = Number(customerGroupPermission.symKeyVersion ?? 0);
		const customerGroupKey = await this.keyLoaderFacade.loadSymGroupKey(customerGroupMembership.group, customerGroupKeyVersion);
		const versionedCustomerGroupKey = {
			object: customerGroupKey,
			version: customerGroupKeyVersion
		};
		const listKey = decryptKey(customerGroupKey, assertNotNull(customerGroupPermission.symEncSessionKey));
		const groupInfoSk = decryptKey(listKey, base64ToUint8Array(data._listEncSessionKey));
		this.setOwnerEncSessionKeyUnmapped(data, encryptKeyWithVersionedKey(versionedCustomerGroupKey, groupInfoSk), customerGroupMembership.group);
		return data;
	}
	setOwnerEncSessionKeyUnmapped(unmappedInstance, key, ownerGroup) {
		unmappedInstance._ownerEncSessionKey = uint8ArrayToBase64(key.key);
		unmappedInstance._ownerKeyVersion = key.encryptingKeyVersion.toString();
		if (ownerGroup) unmappedInstance._ownerGroup = ownerGroup;
	}
	setOwnerEncSessionKey(instance, key) {
		instance._ownerEncSessionKey = key.key;
		instance._ownerKeyVersion = key.encryptingKeyVersion.toString();
	}
	/**
	* @return Whether the {@param elementOrLiteral} is a unmapped type, as used in JSON for transport or if it's a runtime representation of a type.
	*/
	isLiteralInstance(elementOrLiteral) {
		return typeof elementOrLiteral._type === "undefined";
	}
	async trySymmetricPermission(listPermissions) {
		const symmetricPermission = listPermissions.find((p) => (p.type === PermissionType.Public_Symmetric || p.type === PermissionType.Symmetric) && p._ownerGroup && this.userFacade.hasGroup(p._ownerGroup)) ?? null;
		if (symmetricPermission) {
			const gk = await this.keyLoaderFacade.loadSymGroupKey(assertNotNull(symmetricPermission._ownerGroup), Number(symmetricPermission._ownerKeyVersion ?? 0));
			return decryptKey(gk, assertNotNull(symmetricPermission._ownerEncSessionKey));
		} else return null;
	}
	/**
	* Resolves the session key for the provided instance and collects all other instances'
	* session keys in order to update them.
	*/
	async collectAllInstanceSessionKeysAndAuthenticate(bucketKey, decBucketKey, instanceElementId, instance, typeModel, encryptionAuthStatus, pqMessageSenderKey) {
		let resolvedSessionKeyForInstance = undefined;
		const instanceSessionKeys = await pMap(bucketKey.bucketEncSessionKeys, async (instanceSessionKey) => {
			const decryptedSessionKey = decryptKey(decBucketKey, instanceSessionKey.symEncSessionKey);
			const groupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(instance._ownerGroup);
			const ownerEncSessionKey = encryptKeyWithVersionedKey(groupKey, decryptedSessionKey);
			const instanceSessionKeyWithOwnerEncSessionKey = createInstanceSessionKey(instanceSessionKey);
			if (instanceElementId == instanceSessionKey.instanceId) {
				resolvedSessionKeyForInstance = decryptedSessionKey;
				await this.authenticateMainInstance(typeModel, encryptionAuthStatus, pqMessageSenderKey, bucketKey.protocolVersion === CryptoProtocolVersion.TUTA_CRYPT ? Number(bucketKey.senderKeyVersion ?? 0) : null, instance, resolvedSessionKeyForInstance, instanceSessionKeyWithOwnerEncSessionKey, decryptedSessionKey);
			}
			instanceSessionKeyWithOwnerEncSessionKey.symEncSessionKey = ownerEncSessionKey.key;
			instanceSessionKeyWithOwnerEncSessionKey.symKeyVersion = String(ownerEncSessionKey.encryptingKeyVersion);
			return instanceSessionKeyWithOwnerEncSessionKey;
		});
		if (resolvedSessionKeyForInstance) return {
			resolvedSessionKeyForInstance,
			instanceSessionKeys
		};
else throw new SessionKeyNotFoundError("no session key for instance " + instance._id);
	}
	async authenticateMainInstance(typeModel, encryptionAuthStatus, pqMessageSenderKey, pqMessageSenderKeyVersion, instance, resolvedSessionKeyForInstance, instanceSessionKeyWithOwnerEncSessionKey, decryptedSessionKey) {
		const isMailInstance = isSameTypeRefByAttr(MailTypeRef, typeModel.app, typeModel.name);
		if (isMailInstance) {
			if (!encryptionAuthStatus) if (!pqMessageSenderKey) encryptionAuthStatus = EncryptionAuthStatus.RSA_NO_AUTHENTICATION;
else {
				const mail = this.isLiteralInstance(instance) ? await this.instanceMapper.decryptAndMapToInstance(typeModel, instance, resolvedSessionKeyForInstance) : instance;
				const senderMailAddress = mail.confidential ? mail.sender.address : SYSTEM_GROUP_MAIL_ADDRESS;
				encryptionAuthStatus = await this.tryAuthenticateSenderOfMainInstance(senderMailAddress, pqMessageSenderKey, pqMessageSenderKeyVersion);
			}
			instanceSessionKeyWithOwnerEncSessionKey.encryptionAuthStatus = aesEncrypt(decryptedSessionKey, stringToUtf8Uint8Array(encryptionAuthStatus));
		}
	}
	async tryAuthenticateSenderOfMainInstance(senderMailAddress, pqMessageSenderKey, pqMessageSenderKeyVersion) {
		try {
			return await this.asymmetricCryptoFacade.authenticateSender({
				identifier: senderMailAddress,
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS
			}, pqMessageSenderKey, assertNotNull(pqMessageSenderKeyVersion));
		} catch (e) {
			console.error("Could not authenticate sender", e);
			return EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED;
		}
	}
	async resolveWithPublicOrExternalPermission(listPermissions, instance, typeModel) {
		const pubOrExtPermission = listPermissions.find((p) => p.type === PermissionType.Public || p.type === PermissionType.External) ?? null;
		if (pubOrExtPermission == null) {
			const typeName = `${typeModel.app}/${typeModel.name}`;
			throw new SessionKeyNotFoundError(`could not find permission for instance of type ${typeName} with id ${this.getElementIdFromInstance(instance)}`);
		}
		const bucketPermissions = await this.entityClient.loadAll(BucketPermissionTypeRef, assertNotNull(pubOrExtPermission.bucket).bucketPermissions);
		const bucketPermission = bucketPermissions.find((bp) => (bp.type === BucketPermissionType.Public || bp.type === BucketPermissionType.External) && pubOrExtPermission._ownerGroup === bp._ownerGroup);
		if (bucketPermission == null) throw new SessionKeyNotFoundError("no corresponding bucket permission found");
		if (bucketPermission.type === BucketPermissionType.External) return this.decryptWithExternalBucket(bucketPermission, pubOrExtPermission, instance);
else return this.decryptWithPublicBucketWithoutAuthentication(bucketPermission, instance, pubOrExtPermission, typeModel);
	}
	async decryptWithExternalBucket(bucketPermission, pubOrExtPermission, instance) {
		let bucketKey;
		if (bucketPermission.ownerEncBucketKey != null) {
			const ownerGroupKey = await this.keyLoaderFacade.loadSymGroupKey(neverNull(bucketPermission._ownerGroup), Number(bucketPermission.ownerKeyVersion ?? 0));
			bucketKey = decryptKey(ownerGroupKey, bucketPermission.ownerEncBucketKey);
		} else if (bucketPermission.symEncBucketKey) {
			const userGroupKey = await this.keyLoaderFacade.loadSymUserGroupKey(Number(bucketPermission.symKeyVersion ?? 0));
			bucketKey = decryptKey(userGroupKey, bucketPermission.symEncBucketKey);
		} else throw new SessionKeyNotFoundError(`BucketEncSessionKey is not defined for Permission ${pubOrExtPermission._id.toString()} (Instance: ${JSON.stringify(instance)})`);
		return decryptKey(bucketKey, neverNull(pubOrExtPermission.bucketEncSessionKey));
	}
	async decryptWithPublicBucketWithoutAuthentication(bucketPermission, instance, pubOrExtPermission, typeModel) {
		const pubEncBucketKey = bucketPermission.pubEncBucketKey;
		if (pubEncBucketKey == null) throw new SessionKeyNotFoundError(`PubEncBucketKey is not defined for BucketPermission ${bucketPermission._id.toString()} (Instance: ${JSON.stringify(instance)})`);
		const bucketEncSessionKey = pubOrExtPermission.bucketEncSessionKey;
		if (bucketEncSessionKey == null) throw new SessionKeyNotFoundError(`BucketEncSessionKey is not defined for Permission ${pubOrExtPermission._id.toString()} (Instance: ${JSON.stringify(instance)})`);
		const { decryptedAesKey } = await this.asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(bucketPermission.group, Number(bucketPermission.pubKeyVersion ?? 0), asCryptoProtoocolVersion(bucketPermission.protocolVersion), pubEncBucketKey);
		const sk = decryptKey(decryptedAesKey, bucketEncSessionKey);
		if (bucketPermission._ownerGroup) {
			let bucketPermissionOwnerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(neverNull(bucketPermission._ownerGroup));
			await this.updateWithSymPermissionKey(typeModel, instance, pubOrExtPermission, bucketPermission, bucketPermissionOwnerGroupKey, sk).catch(ofClass(NotFoundError, () => {
				console.log("w> could not find instance to update permission");
			}));
		}
		return sk;
	}
	/**
	* Returns the session key for the provided service response:
	* * null, if the instance is unencrypted
	* * the decrypted _ownerPublicEncSessionKey, if it is available
	* @param instance The unencrypted (client-side) or encrypted (server-side) instance
	*
	*/
	async resolveServiceSessionKey(instance) {
		if (instance._ownerPublicEncSessionKey) {
			const keypair = await this.keyLoaderFacade.loadCurrentKeyPair(instance._ownerGroup);
			return (await this.asymmetricCryptoFacade.decryptSymKeyWithKeyPair(keypair.object, assertEnumValue(CryptoProtocolVersion, instance._publicCryptoProtocolVersion), base64ToUint8Array(instance._ownerPublicEncSessionKey))).decryptedAesKey;
		}
		return null;
	}
	/**
	* Creates a new _ownerEncSessionKey and assigns it to the provided entity
	* the entity must already have an _ownerGroup
	* @returns the generated key
	*/
	async setNewOwnerEncSessionKey(model, entity, keyToEncryptSessionKey) {
		if (!entity._ownerGroup) throw new Error(`no owner group set  ${JSON.stringify(entity)}`);
		if (model.encrypted) {
			if (entity._ownerEncSessionKey) throw new Error(`ownerEncSessionKey already set ${JSON.stringify(entity)}`);
			const sessionKey = aes256RandomKey();
			const effectiveKeyToEncryptSessionKey = keyToEncryptSessionKey ?? await this.keyLoaderFacade.getCurrentSymGroupKey(entity._ownerGroup);
			const encryptedSessionKey = encryptKeyWithVersionedKey(effectiveKeyToEncryptSessionKey, sessionKey);
			this.setOwnerEncSessionKey(entity, encryptedSessionKey);
			return sessionKey;
		} else return null;
	}
	async encryptBucketKeyForInternalRecipient(senderUserGroupId, bucketKey, recipientMailAddress, notFoundRecipients) {
		const keyData = createPublicKeyGetIn({
			identifier: recipientMailAddress,
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
			version: null
		});
		try {
			const publicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, keyData);
			if (notFoundRecipients.length !== 0) return null;
			const isExternalSender = this.userFacade.getUser()?.accountType === AccountType.EXTERNAL;
			if (publicKeyGetOut.pubKyberKey && isExternalSender) return this.createSymEncInternalRecipientKeyData(recipientMailAddress, bucketKey);
else return this.createPubEncInternalRecipientKeyData(bucketKey, recipientMailAddress, publicKeyGetOut, senderUserGroupId);
		} catch (e) {
			if (e instanceof NotFoundError) {
				notFoundRecipients.push(recipientMailAddress);
				return null;
			} else if (e instanceof TooManyRequestsError) throw new RecipientNotResolvedError("");
else throw e;
		}
	}
	async createPubEncInternalRecipientKeyData(bucketKey, recipientMailAddress, publicKeyGetOut, senderGroupId) {
		const recipientPublicKeys = convertToVersionedPublicKeys(publicKeyGetOut);
		const pubEncBucketKey = await this.asymmetricCryptoFacade.asymEncryptSymKey(bucketKey, recipientPublicKeys, senderGroupId);
		return createInternalRecipientKeyData({
			mailAddress: recipientMailAddress,
			pubEncBucketKey: pubEncBucketKey.pubEncSymKeyBytes,
			recipientKeyVersion: pubEncBucketKey.recipientKeyVersion.toString(),
			senderKeyVersion: pubEncBucketKey.senderKeyVersion != null ? pubEncBucketKey.senderKeyVersion.toString() : null,
			protocolVersion: pubEncBucketKey.cryptoProtocolVersion
		});
	}
	async createSymEncInternalRecipientKeyData(recipientMailAddress, bucketKey) {
		const keyGroup = this.userFacade.getGroupId(GroupType.Mail);
		const externalMailGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(keyGroup);
		return createSymEncInternalRecipientKeyData({
			mailAddress: recipientMailAddress,
			symEncBucketKey: encryptKey(externalMailGroupKey.object, bucketKey),
			keyGroup,
			symKeyVersion: String(externalMailGroupKey.version)
		});
	}
	/**
	* Updates the given public permission with the given symmetric key for faster access if the client is the leader and otherwise does nothing.
	* @param typeModel The type model of the instance
	* @param instance The unencrypted (client-side) or encrypted (server-side) instance
	* @param permission The permission.
	* @param bucketPermission The bucket permission.
	* @param permissionOwnerGroupKey The symmetric group key for the owner group on the permission.
	* @param sessionKey The symmetric session key.
	*/
	async updateWithSymPermissionKey(typeModel, instance, permission, bucketPermission, permissionOwnerGroupKey, sessionKey) {
		if (!this.isLiteralInstance(instance) || !this.userFacade.isLeader()) return;
		if (!instance._ownerEncSessionKey && permission._ownerGroup === instance._ownerGroup) return this.updateOwnerEncSessionKey(typeModel, instance, permissionOwnerGroupKey, sessionKey);
else {
			const encryptedKey = encryptKeyWithVersionedKey(permissionOwnerGroupKey, sessionKey);
			let updateService = createUpdatePermissionKeyData({
				ownerKeyVersion: String(encryptedKey.encryptingKeyVersion),
				ownerEncSessionKey: encryptedKey.key,
				permission: permission._id,
				bucketPermission: bucketPermission._id
			});
			await this.serviceExecutor.post(UpdatePermissionKeyService, updateService);
		}
	}
	/**
	* Resolves the ownerEncSessionKey of a mail. This might be needed if it wasn't updated yet
	* by the OwnerEncSessionKeysUpdateQueue but the file is already downloaded.
	* @param mainInstance the instance that has the bucketKey
	* @param childInstances the files that belong to the mainInstance
	*/
	async enforceSessionKeyUpdateIfNeeded(mainInstance, childInstances) {
		if (!childInstances.some((f) => f._ownerEncSessionKey == null)) return childInstances.slice();
		const typeModel = await resolveTypeReference(mainInstance._type);
		const outOfSyncInstances = childInstances.filter((f) => f._ownerEncSessionKey == null);
		if (mainInstance.bucketKey) {
			const bucketKey = await this.convertBucketKeyToInstanceIfNecessary(mainInstance.bucketKey);
			const resolvedSessionKeys = await this.resolveWithBucketKey(bucketKey, mainInstance, typeModel);
			await this.ownerEncSessionKeysUpdateQueue.postUpdateSessionKeysService(resolvedSessionKeys.instanceSessionKeys);
		} else console.warn("files are out of sync refreshing", outOfSyncInstances.map((f) => f._id).join(", "));
		for (const childInstance of outOfSyncInstances) await this.cache?.deleteFromCacheIfExists(FileTypeRef, getListId(childInstance), getElementId(childInstance));
		return await this.entityClient.loadMultiple(FileTypeRef, getListId(childInstances[0]), childInstances.map((childInstance) => getElementId(childInstance)));
	}
	updateOwnerEncSessionKey(typeModel, instance, ownerGroupKey, sessionKey) {
		this.setOwnerEncSessionKeyUnmapped(instance, encryptKeyWithVersionedKey(ownerGroupKey, sessionKey));
		const path = typeRefToPath(new TypeRef(typeModel.app, typeModel.name)) + "/" + (instance._id instanceof Array ? instance._id.join("/") : instance._id);
		const headers = this.userFacade.createAuthHeaders();
		headers.v = typeModel.version;
		return this.restClient.request(path, HttpMethod.PUT, {
			headers,
			body: JSON.stringify(instance),
			queryParams: { updateOwnerEncSessionKey: "true" }
		}).catch(ofClass(PayloadTooLargeError, (e) => {
			console.log("Could not update owner enc session key - PayloadTooLargeError", e);
		}));
	}
	getElementIdFromInstance(instance) {
		if (typeof instance._id === "string") return instance._id;
else {
			const idTuple = instance._id;
			return elementIdPart(idTuple);
		}
	}
};
if (!("toJSON" in Error.prototype)) Object.defineProperty(Error.prototype, "toJSON", {
	value: function() {
		const alt = {};
		for (let key of Object.getOwnPropertyNames(this)) alt[key] = this[key];
		return alt;
	},
	configurable: true,
	writable: true
});

//#endregion
//#region src/common/api/worker/crypto/InstanceMapper.ts
assertWorkerOrNode();
var InstanceMapper = class {
	/**
	* Decrypts an object literal as received from the DB and maps it to an entity class (e.g. Mail)
	* @param model The TypeModel of the instance
	* @param instance The object literal as received from the DB
	* @param sk The session key, must be provided for encrypted instances
	* @returns The decrypted and mapped instance
	*/
	decryptAndMapToInstance(model, instance, sk) {
		let decrypted = { _type: new TypeRef(model.app, model.name) };
		for (let key of Object.keys(model.values)) {
			let valueType = model.values[key];
			let value = instance[key];
			try {
				decrypted[key] = decryptValue(key, valueType, value, sk);
			} catch (e) {
				if (decrypted._errors == null) decrypted._errors = {};
				decrypted._errors[key] = JSON.stringify(e);
				console.log("error when decrypting value on type:", `[${model.app},${model.name}]`, "key:", key, e);
			} finally {
				if (valueType.encrypted) {
					if (valueType.final) decrypted["_finalEncrypted_" + key] = value;
else if (value === "") decrypted["_defaultEncrypted_" + key] = decrypted[key];
				}
			}
		}
		return pMap(Object.keys(model.associations), async (associationName) => {
			if (model.associations[associationName].type === AssociationType.Aggregation) {
				const dependency = model.associations[associationName].dependency;
				const aggregateTypeModel = await resolveTypeReference(new TypeRef(dependency || model.app, model.associations[associationName].refType));
				let aggregation = model.associations[associationName];
				if (aggregation.cardinality === Cardinality.ZeroOrOne && instance[associationName] == null) decrypted[associationName] = null;
else if (instance[associationName] == null) throw new ProgrammingError(`Undefined aggregation ${model.name}:${associationName}`);
else if (aggregation.cardinality === Cardinality.Any) return pMap(instance[associationName], (aggregate) => {
					return this.decryptAndMapToInstance(aggregateTypeModel, downcast(aggregate), sk);
				}).then((decryptedAggregates) => {
					decrypted[associationName] = decryptedAggregates;
				});
else return this.decryptAndMapToInstance(aggregateTypeModel, instance[associationName], sk).then((decryptedAggregate) => {
					decrypted[associationName] = decryptedAggregate;
				});
			} else decrypted[associationName] = instance[associationName];
		}).then(() => {
			return decrypted;
		});
	}
	encryptAndMapToLiteral(model, instance, sk) {
		if (model.encrypted && sk == null) throw new ProgrammingError(`Encrypting ${model.app}/${model.name} requires a session key!`);
		let encrypted = {};
		let i = instance;
		for (let key of Object.keys(model.values)) {
			let valueType = model.values[key];
			let value = i[key];
			let encryptedValue;
			if (valueType.encrypted && valueType.final && i["_finalEncrypted_" + key] != null) encryptedValue = i["_finalEncrypted_" + key];
else if (valueType.encrypted && (i["_finalIvs"]?.[key])?.length === 0 && isDefaultValue(valueType.type, value)) encryptedValue = "";
else if (valueType.encrypted && valueType.final && i["_finalIvs"]?.[key] != null) {
				const finalIv = i["_finalIvs"][key];
				encryptedValue = encryptValue(key, valueType, value, sk, finalIv);
			} else if (valueType.encrypted && i["_defaultEncrypted_" + key] === value) encryptedValue = "";
else encryptedValue = encryptValue(key, valueType, value, sk);
			encrypted[key] = encryptedValue;
		}
		if (model.type === Type.Aggregated && !encrypted._id) encrypted._id = base64ToBase64Url(uint8ArrayToBase64(random.generateRandomData(4)));
		return pMap(Object.keys(model.associations), async (associationName) => {
			if (model.associations[associationName].type === AssociationType.Aggregation) {
				const dependency = model.associations[associationName].dependency;
				const aggregateTypeModel = await resolveTypeReference(new TypeRef(dependency || model.app, model.associations[associationName].refType));
				let aggregation = model.associations[associationName];
				if (aggregation.cardinality === Cardinality.ZeroOrOne && i[associationName] == null) encrypted[associationName] = null;
else if (i[associationName] == null) throw new ProgrammingError(`Undefined attribute ${model.name}:${associationName}`);
else if (aggregation.cardinality === Cardinality.Any) return pMap(i[associationName], (aggregate) => {
					return this.encryptAndMapToLiteral(aggregateTypeModel, aggregate, sk);
				}).then((encryptedAggregates) => {
					encrypted[associationName] = encryptedAggregates;
				});
else return this.encryptAndMapToLiteral(aggregateTypeModel, i[associationName], sk).then((encryptedAggregate) => {
					encrypted[associationName] = encryptedAggregate;
				});
			} else encrypted[associationName] = i[associationName];
		}).then(() => {
			return encrypted;
		});
	}
};
function encryptValue(valueName, valueType, value, sk, iv = random.generateRandomData(IV_BYTE_LENGTH)) {
	if (valueName === "_id" || valueName === "_permissions") return value;
else if (value == null) if (valueType.cardinality === Cardinality.ZeroOrOne) return null;
else throw new ProgrammingError(`Value ${valueName} with cardinality ONE can not be null`);
else if (valueType.encrypted) {
		let bytes = value;
		if (valueType.type !== ValueType.Bytes) {
			const dbType = assertNotNull(convertJsToDbType(valueType.type, value));
			bytes = typeof dbType === "string" ? stringToUtf8Uint8Array(dbType) : dbType;
		}
		return uint8ArrayToBase64(aesEncrypt(assertNotNull(sk), bytes, iv, true, ENABLE_MAC));
	} else {
		const dbType = convertJsToDbType(valueType.type, value);
		if (typeof dbType === "string") return dbType;
else return uint8ArrayToBase64(dbType);
	}
}
function decryptValue(valueName, valueType, value, sk) {
	if (value == null) if (valueType.cardinality === Cardinality.ZeroOrOne) return null;
else throw new ProgrammingError(`Value ${valueName} with cardinality ONE can not be null`);
else if (valueType.cardinality === Cardinality.One && value === "") return valueToDefault(valueType.type);
else if (valueType.encrypted) {
		if (sk == null) throw new CryptoError("session key is null, but value is encrypted. valueName: " + valueName + " valueType: " + valueType);
		let decryptedBytes = aesDecrypt(sk, base64ToUint8Array(value));
		if (valueType.type === ValueType.Bytes) return decryptedBytes;
else if (valueType.type === ValueType.CompressedString) return decompressString(decryptedBytes);
else return convertDbToJsType(valueType.type, utf8Uint8ArrayToString(decryptedBytes));
	} else return convertDbToJsType(valueType.type, value);
}
/**
* Returns bytes when the type === Bytes or type === CompressedString, otherwise returns a string
* @param type
* @param value
* @returns {string|string|NodeJS.Global.Uint8Array|*}
*/
function convertJsToDbType(type, value) {
	if (type === ValueType.Bytes && value != null) return value;
else if (type === ValueType.Boolean) return value ? "1" : "0";
else if (type === ValueType.Date) return value.getTime().toString();
else if (type === ValueType.CompressedString) return compressString(value);
else return value;
}
function convertDbToJsType(type, value) {
	if (type === ValueType.Bytes) return base64ToUint8Array(value);
else if (type === ValueType.Boolean) return value !== "0";
else if (type === ValueType.Date) return new Date(parseInt(value));
else if (type === ValueType.CompressedString) return decompressString(base64ToUint8Array(value));
else return value;
}
function compressString(uncompressed) {
	return compress(stringToUtf8Uint8Array(uncompressed));
}
function decompressString(compressed) {
	if (compressed.length === 0) return "";
	const output = uncompress(compressed);
	return utf8Uint8ArrayToString(output);
}
function valueToDefault(type) {
	switch (type) {
		case ValueType.String: return "";
		case ValueType.Number: return "0";
		case ValueType.Bytes: return new Uint8Array(0);
		case ValueType.Date: return new Date(0);
		case ValueType.Boolean: return false;
		case ValueType.CompressedString: return "";
		default: throw new ProgrammingError(`${type} is not a valid value type`);
	}
}
function isDefaultValue(type, value) {
	switch (type) {
		case ValueType.String: return value === "";
		case ValueType.Number: return value === "0";
		case ValueType.Bytes: return value.length === 0;
		case ValueType.Date: return value.getTime() === 0;
		case ValueType.Boolean: return value === false;
		case ValueType.CompressedString: return value === "";
		default: throw new ProgrammingError(`${type} is not a valid value type`);
	}
}

//#endregion
//#region src/common/api/worker/rest/AdminClientDummyEntityRestCache.ts
var AdminClientDummyEntityRestCache = class {
	async entityEventsReceived(batch) {
		return batch.events;
	}
	async erase(instance) {
		throw new ProgrammingError("erase not implemented");
	}
	async load(_typeRef, _id, _opts) {
		throw new ProgrammingError("load not implemented");
	}
	async loadMultiple(typeRef, listId, elementIds) {
		throw new ProgrammingError("loadMultiple not implemented");
	}
	async loadRange(typeRef, listId, start, count, reverse) {
		throw new ProgrammingError("loadRange not implemented");
	}
	async purgeStorage() {
		return;
	}
	async setup(listId, instance, extraHeaders) {
		throw new ProgrammingError("setup not implemented");
	}
	async setupMultiple(listId, instances) {
		throw new ProgrammingError("setupMultiple not implemented");
	}
	async update(instance) {
		throw new ProgrammingError("update not implemented");
	}
	async getLastEntityEventBatchForGroup(groupId) {
		return null;
	}
	async setLastEntityEventBatchForGroup(groupId, batchId) {
		return;
	}
	async recordSyncTime() {
		return;
	}
	async timeSinceLastSyncMs() {
		return null;
	}
	async isOutOfSync() {
		return false;
	}
};

//#endregion
//#region src/common/api/worker/utils/SleepDetector.ts
const CHECK_INTERVAL = 5e3;
const SLEEP_INTERVAL = 15e3;
var SleepDetector = class {
	scheduledState = null;
	constructor(scheduler, dateProvider) {
		this.scheduler = scheduler;
		this.dateProvider = dateProvider;
	}
	start(onSleep) {
		this.stop();
		this.scheduledState = {
			scheduledId: this.scheduler.schedulePeriodic(() => this.check(), CHECK_INTERVAL),
			lastTime: this.dateProvider.now(),
			onSleep
		};
	}
	check() {
		if (this.scheduledState == null) return;
		const now = this.dateProvider.now();
		if (now - this.scheduledState.lastTime > SLEEP_INTERVAL) this.scheduledState.onSleep();
		this.scheduledState.lastTime = now;
	}
	stop() {
		if (this.scheduledState) {
			this.scheduler.unschedulePeriodic(this.scheduledState.scheduledId);
			this.scheduledState = null;
		}
	}
};

//#endregion
//#region src/common/api/worker/rest/EphemeralCacheStorage.ts
var EphemeralCacheStorage = class {
	/** Path to id to entity map. */
	entities = new Map();
	lists = new Map();
	blobEntities = new Map();
	customCacheHandlerMap = new CustomCacheHandlerMap();
	lastUpdateTime = null;
	userId = null;
	lastBatchIdPerGroup = new Map();
	init({ userId }) {
		this.userId = userId;
	}
	deinit() {
		this.userId = null;
		this.entities.clear();
		this.lists.clear();
		this.blobEntities.clear();
		this.lastUpdateTime = null;
		this.lastBatchIdPerGroup.clear();
	}
	/**
	* Get a given entity from the cache, expects that you have already checked for existence
	*/
	async get(typeRef, listId, elementId) {
		const path = typeRefToPath(typeRef);
		const typeModel = await resolveTypeReference(typeRef);
		elementId = ensureBase64Ext(typeModel, elementId);
		switch (typeModel.type) {
			case Type.Element: return clone(this.entities.get(path)?.get(elementId) ?? null);
			case Type.ListElement: return clone(this.lists.get(path)?.get(assertNotNull(listId))?.elements.get(elementId) ?? null);
			case Type.BlobElement: return clone(this.blobEntities.get(path)?.get(assertNotNull(listId))?.elements.get(elementId) ?? null);
			default: throw new ProgrammingError("must be a persistent type");
		}
	}
	async deleteIfExists(typeRef, listId, elementId) {
		const path = typeRefToPath(typeRef);
		let typeModel;
		typeModel = await resolveTypeReference(typeRef);
		elementId = ensureBase64Ext(typeModel, elementId);
		switch (typeModel.type) {
			case Type.Element:
				this.entities.get(path)?.delete(elementId);
				break;
			case Type.ListElement: {
				const cache = this.lists.get(path)?.get(assertNotNull(listId));
				if (cache != null) {
					cache.elements.delete(elementId);
					remove(cache.allRange, elementId);
				}
				break;
			}
			case Type.BlobElement:
				this.blobEntities.get(path)?.get(assertNotNull(listId))?.elements.delete(elementId);
				break;
			default: throw new ProgrammingError("must be a persistent type");
		}
	}
	addElementEntity(typeRef, id, entity) {
		getFromMap(this.entities, typeRefToPath(typeRef), () => new Map()).set(id, entity);
	}
	async isElementIdInCacheRange(typeRef, listId, elementId) {
		const typeModel = await resolveTypeReference(typeRef);
		elementId = ensureBase64Ext(typeModel, elementId);
		const cache = this.lists.get(typeRefToPath(typeRef))?.get(listId);
		return cache != null && !firstBiggerThanSecond(elementId, cache.upperRangeId) && !firstBiggerThanSecond(cache.lowerRangeId, elementId);
	}
	async put(originalEntity) {
		const entity = clone(originalEntity);
		const typeRef = entity._type;
		const typeModel = await resolveTypeReference(typeRef);
		let { listId, elementId } = expandId(originalEntity._id);
		elementId = ensureBase64Ext(typeModel, elementId);
		switch (typeModel.type) {
			case Type.Element: {
				const elementEntity = entity;
				this.addElementEntity(elementEntity._type, elementId, elementEntity);
				break;
			}
			case Type.ListElement: {
				const listElementEntity = entity;
				const listElementTypeRef = typeRef;
				listId = listId;
				await this.putListElement(listElementTypeRef, listId, elementId, listElementEntity);
				break;
			}
			case Type.BlobElement: {
				const blobElementEntity = entity;
				const blobTypeRef = typeRef;
				listId = listId;
				await this.putBlobElement(blobTypeRef, listId, elementId, blobElementEntity);
				break;
			}
			default: throw new ProgrammingError("must be a persistent type");
		}
	}
	async putBlobElement(typeRef, listId, elementId, entity) {
		const cache = this.blobEntities.get(typeRefToPath(typeRef))?.get(listId);
		if (cache == null) {
			const newCache = { elements: new Map([[elementId, entity]]) };
			getFromMap(this.blobEntities, typeRefToPath(typeRef), () => new Map()).set(listId, newCache);
		} else cache.elements.set(elementId, entity);
	}
	/** prcondition: elementId is converted to base64ext if necessary */
	async putListElement(typeRef, listId, elementId, entity) {
		const cache = this.lists.get(typeRefToPath(typeRef))?.get(listId);
		if (cache == null) {
			const newCache = {
				allRange: [elementId],
				lowerRangeId: elementId,
				upperRangeId: elementId,
				elements: new Map([[elementId, entity]])
			};
			getFromMap(this.lists, typeRefToPath(typeRef), () => new Map()).set(listId, newCache);
		} else {
			cache.elements.set(elementId, entity);
			const typeModel = await resolveTypeReference(typeRef);
			if (await this.isElementIdInCacheRange(typeRef, listId, customIdToBase64Url(typeModel, elementId))) this.insertIntoRange(cache.allRange, elementId);
		}
	}
	/** precondition: elementId is converted to base64ext if necessary */
	insertIntoRange(allRange, elementId) {
		for (let i = 0; i < allRange.length; i++) {
			const rangeElement = allRange[i];
			if (firstBiggerThanSecond(rangeElement, elementId)) {
				allRange.splice(i, 0, elementId);
				return;
			}
			if (rangeElement === elementId) return;
		}
		allRange.push(elementId);
	}
	async provideFromRange(typeRef, listId, startElementId, count, reverse) {
		const typeModel = await resolveTypeReference(typeRef);
		startElementId = ensureBase64Ext(typeModel, startElementId);
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId);
		if (listCache == null) return [];
		let range = listCache.allRange;
		let ids = [];
		if (reverse) {
			let i;
			for (i = range.length - 1; i >= 0; i--) if (firstBiggerThanSecond(startElementId, range[i])) break;
			if (i >= 0) {
				let startIndex = i + 1 - count;
				if (startIndex < 0) startIndex = 0;
				ids = range.slice(startIndex, i + 1);
				ids.reverse();
			} else ids = [];
		} else {
			const i = range.findIndex((id) => firstBiggerThanSecond(id, startElementId));
			ids = range.slice(i, i + count);
		}
		let result = [];
		for (let a = 0; a < ids.length; a++) result.push(clone(listCache.elements.get(ids[a])));
		return result;
	}
	async provideMultiple(typeRef, listId, elementIds) {
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId);
		const typeModel = await resolveTypeReference(typeRef);
		elementIds = elementIds.map((el) => ensureBase64Ext(typeModel, el));
		if (listCache == null) return [];
		let result = [];
		for (let a = 0; a < elementIds.length; a++) result.push(clone(listCache.elements.get(elementIds[a])));
		return result;
	}
	async getRangeForList(typeRef, listId) {
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId);
		if (listCache == null) return null;
		const typeModel = await resolveTypeReference(typeRef);
		return {
			lower: customIdToBase64Url(typeModel, listCache.lowerRangeId),
			upper: customIdToBase64Url(typeModel, listCache.upperRangeId)
		};
	}
	async setUpperRangeForList(typeRef, listId, upperId) {
		const typeModel = await resolveTypeReference(typeRef);
		upperId = ensureBase64Ext(typeModel, upperId);
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId);
		if (listCache == null) throw new Error("list does not exist");
		listCache.upperRangeId = upperId;
	}
	async setLowerRangeForList(typeRef, listId, lowerId) {
		const typeModel = await resolveTypeReference(typeRef);
		lowerId = ensureBase64Ext(typeModel, lowerId);
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId);
		if (listCache == null) throw new Error("list does not exist");
		listCache.lowerRangeId = lowerId;
	}
	/**
	* Creates a new list cache if there is none. Resets everything but elements.
	* @param typeRef
	* @param listId
	* @param lower
	* @param upper
	*/
	async setNewRangeForList(typeRef, listId, lower, upper) {
		const typeModel = await resolveTypeReference(typeRef);
		lower = ensureBase64Ext(typeModel, lower);
		upper = ensureBase64Ext(typeModel, upper);
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId);
		if (listCache == null) getFromMap(this.lists, typeRefToPath(typeRef), () => new Map()).set(listId, {
			allRange: [],
			lowerRangeId: lower,
			upperRangeId: upper,
			elements: new Map()
		});
else {
			listCache.lowerRangeId = lower;
			listCache.upperRangeId = upper;
			listCache.allRange = [];
		}
	}
	async getIdsInRange(typeRef, listId) {
		const typeModel = await resolveTypeReference(typeRef);
		return this.lists.get(typeRefToPath(typeRef))?.get(listId)?.allRange.map((elementId) => {
			return customIdToBase64Url(typeModel, elementId);
		}) ?? [];
	}
	async getLastBatchIdForGroup(groupId) {
		return this.lastBatchIdPerGroup.get(groupId) ?? null;
	}
	async putLastBatchIdForGroup(groupId, batchId) {
		this.lastBatchIdPerGroup.set(groupId, batchId);
	}
	purgeStorage() {
		return Promise.resolve();
	}
	async getLastUpdateTime() {
		return this.lastUpdateTime ? {
			type: "recorded",
			time: this.lastUpdateTime
		} : { type: "never" };
	}
	async putLastUpdateTime(value) {
		this.lastUpdateTime = value;
	}
	async getWholeList(typeRef, listId) {
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId);
		if (listCache == null) return [];
		return listCache.allRange.map((id) => clone(listCache.elements.get(id)));
	}
	getCustomCacheHandlerMap(entityRestClient) {
		return this.customCacheHandlerMap;
	}
	getUserId() {
		return assertNotNull(this.userId, "No user id, not initialized?");
	}
	async deleteAllOwnedBy(owner) {
		for (const typeMap of this.entities.values()) for (const [id, entity] of typeMap.entries()) if (entity._ownerGroup === owner) typeMap.delete(id);
		for (const cacheForType of this.lists.values()) this.deleteAllOwnedByFromCache(cacheForType, owner);
		for (const cacheForType of this.blobEntities.values()) this.deleteAllOwnedByFromCache(cacheForType, owner);
		this.lastBatchIdPerGroup.delete(owner);
	}
	async deleteWholeList(typeRef, listId) {
		this.lists.get(typeRef.type)?.delete(listId);
	}
	deleteAllOwnedByFromCache(cacheForType, owner) {
		const listIdsToDelete = [];
		for (const [listId, listCache] of cacheForType.entries()) for (const [id, element] of listCache.elements.entries()) if (element._ownerGroup === owner) {
			listIdsToDelete.push(listId);
			break;
		}
		for (const listId of listIdsToDelete) cacheForType.delete(listId);
	}
	clearExcludedData() {
		return Promise.resolve();
	}
	/**
	* We want to lock the access to the "ranges" db when updating / reading the
	* offline available mail list ranges for each mail list (referenced using the listId)
	* @param listId the mail list that we want to lock
	*/
	lockRangesDbAccess(listId) {
		return Promise.resolve();
	}
	/**
	* This is the counterpart to the function "lockRangesDbAccess(listId)"
	* @param listId the mail list that we want to unlock
	*/
	unlockRangesDbAccess(listId) {
		return Promise.resolve();
	}
};

//#endregion
//#region src/common/api/worker/rest/CacheStorageProxy.ts
var LateInitializedCacheStorageImpl = class {
	_inner = null;
	constructor(sendError, offlineStorageProvider) {
		this.sendError = sendError;
		this.offlineStorageProvider = offlineStorageProvider;
	}
	get inner() {
		if (this._inner == null) throw new ProgrammingError("Cache storage is not initialized");
		return this._inner;
	}
	async initialize(args) {
		const { storage, isPersistent, isNewOfflineDb } = await this.getStorage(args);
		this._inner = storage;
		return {
			isPersistent,
			isNewOfflineDb
		};
	}
	async deInitialize() {
		this._inner?.deinit();
	}
	async getStorage(args) {
		if (args.type === "offline") try {
			const storage$1 = await this.offlineStorageProvider();
			if (storage$1 != null) {
				const isNewOfflineDb = await storage$1.init(args);
				return {
					storage: storage$1,
					isPersistent: true,
					isNewOfflineDb
				};
			}
		} catch (e) {
			console.error("Error while initializing offline cache storage", e);
			this.sendError(e);
		}
		const storage = new EphemeralCacheStorage();
		await storage.init(args);
		return {
			storage,
			isPersistent: false,
			isNewOfflineDb: false
		};
	}
	deleteIfExists(typeRef, listId, id) {
		return this.inner.deleteIfExists(typeRef, listId, id);
	}
	get(typeRef, listId, id) {
		return this.inner.get(typeRef, listId, id);
	}
	getIdsInRange(typeRef, listId) {
		return this.inner.getIdsInRange(typeRef, listId);
	}
	getLastBatchIdForGroup(groupId) {
		return this.inner.getLastBatchIdForGroup(groupId);
	}
	async getLastUpdateTime() {
		return this._inner ? this.inner.getLastUpdateTime() : { type: "uninitialized" };
	}
	getRangeForList(typeRef, listId) {
		return this.inner.getRangeForList(typeRef, listId);
	}
	isElementIdInCacheRange(typeRef, listId, id) {
		return this.inner.isElementIdInCacheRange(typeRef, listId, id);
	}
	provideFromRange(typeRef, listId, start, count, reverse) {
		return this.inner.provideFromRange(typeRef, listId, start, count, reverse);
	}
	provideMultiple(typeRef, listId, elementIds) {
		return this.inner.provideMultiple(typeRef, listId, elementIds);
	}
	getWholeList(typeRef, listId) {
		return this.inner.getWholeList(typeRef, listId);
	}
	purgeStorage() {
		return this.inner.purgeStorage();
	}
	put(originalEntity) {
		return this.inner.put(originalEntity);
	}
	putLastBatchIdForGroup(groupId, batchId) {
		return this.inner.putLastBatchIdForGroup(groupId, batchId);
	}
	putLastUpdateTime(value) {
		return this.inner.putLastUpdateTime(value);
	}
	setLowerRangeForList(typeRef, listId, id) {
		return this.inner.setLowerRangeForList(typeRef, listId, id);
	}
	setNewRangeForList(typeRef, listId, lower, upper) {
		return this.inner.setNewRangeForList(typeRef, listId, lower, upper);
	}
	setUpperRangeForList(typeRef, listId, id) {
		return this.inner.setUpperRangeForList(typeRef, listId, id);
	}
	getCustomCacheHandlerMap(entityRestClient) {
		return this.inner.getCustomCacheHandlerMap(entityRestClient);
	}
	getUserId() {
		return this.inner.getUserId();
	}
	async deleteAllOwnedBy(owner) {
		return this.inner.deleteAllOwnedBy(owner);
	}
	async deleteWholeList(typeRef, listId) {
		return this.inner.deleteWholeList(typeRef, listId);
	}
	clearExcludedData() {
		return this.inner.clearExcludedData();
	}
	/**
	* We want to lock the access to the "ranges" db when updating / reading the
	* offline available mail list ranges for each mail list (referenced using the listId)
	* @param listId the mail list that we want to lock
	*/
	lockRangesDbAccess(listId) {
		return this.inner.lockRangesDbAccess(listId);
	}
	/**
	* This is the counterpart to the function "lockRangesDbAccess(listId)"
	* @param listId the mail list that we want to unlock
	*/
	unlockRangesDbAccess(listId) {
		return this.inner.unlockRangesDbAccess(listId);
	}
};

//#endregion
//#region src/common/api/worker/rest/ServiceExecutor.ts
assertWorkerOrNode();
var ServiceExecutor = class {
	constructor(restClient, authDataProvider, instanceMapper, cryptoFacade) {
		this.restClient = restClient;
		this.authDataProvider = authDataProvider;
		this.instanceMapper = instanceMapper;
		this.cryptoFacade = cryptoFacade;
	}
	get(service, data, params) {
		return this.executeServiceRequest(service, HttpMethod.GET, data, params);
	}
	post(service, data, params) {
		return this.executeServiceRequest(service, HttpMethod.POST, data, params);
	}
	put(service, data, params) {
		return this.executeServiceRequest(service, HttpMethod.PUT, data, params);
	}
	delete(service, data, params) {
		return this.executeServiceRequest(service, HttpMethod.DELETE, data, params);
	}
	async executeServiceRequest(service, method, requestEntity, params) {
		const methodDefinition = this.getMethodDefinition(service, method);
		if (methodDefinition.return && params?.sessionKey == null && (await resolveTypeReference(methodDefinition.return)).encrypted && !this.authDataProvider.isFullyLoggedIn()) throw new LoginIncompleteError(`Tried to make service request with encrypted return type but is not fully logged in yet, service: ${service.name}`);
		const modelVersion = await this.getModelVersion(methodDefinition);
		const path = `/rest/${service.app.toLowerCase()}/${service.name.toLowerCase()}`;
		const headers = {
			...this.authDataProvider.createAuthHeaders(),
			...params?.extraHeaders,
			v: modelVersion
		};
		const encryptedEntity = await this.encryptDataIfNeeded(methodDefinition, requestEntity, service, method, params ?? null);
		const data = await this.restClient.request(path, method, {
			queryParams: params?.queryParams,
			headers,
			responseType: MediaType.Json,
			body: encryptedEntity ?? undefined,
			suspensionBehavior: params?.suspensionBehavior,
			baseUrl: params?.baseUrl
		});
		if (methodDefinition.return) return await this.decryptResponse(methodDefinition.return, data, params);
	}
	getMethodDefinition(service, method) {
		switch (method) {
			case HttpMethod.GET: return service["get"];
			case HttpMethod.POST: return service["post"];
			case HttpMethod.PUT: return service["put"];
			case HttpMethod.DELETE: return service["delete"];
		}
	}
	async getModelVersion(methodDefinition) {
		const someTypeRef = methodDefinition.data ?? methodDefinition.return;
		if (someTypeRef == null) throw new ProgrammingError("Need either data or return for the service method!");
		const model = await resolveTypeReference(someTypeRef);
		return model.version;
	}
	async encryptDataIfNeeded(methodDefinition, requestEntity, service, method, params) {
		if (methodDefinition.data != null) {
			if (requestEntity == null || !isSameTypeRef(methodDefinition.data, requestEntity._type)) throw new ProgrammingError(`Invalid service data! ${service.name} ${method}`);
			const requestTypeModel = await resolveTypeReference(methodDefinition.data);
			if (requestTypeModel.encrypted && params?.sessionKey == null) throw new ProgrammingError("Must provide a session key for an encrypted data transfer type!: " + service);
			const encryptedEntity = await this.instanceMapper.encryptAndMapToLiteral(requestTypeModel, requestEntity, params?.sessionKey ?? null);
			return JSON.stringify(encryptedEntity);
		} else return null;
	}
	async decryptResponse(typeRef, data, params) {
		const responseTypeModel = await resolveTypeReference(typeRef);
		const instance = JSON.parse(data, (k, v) => k === "__proto__" ? undefined : v);
		const resolvedSessionKey = await this.cryptoFacade().resolveServiceSessionKey(instance);
		return this.instanceMapper.decryptAndMapToInstance(responseTypeModel, instance, resolvedSessionKey ?? params?.sessionKey ?? null);
	}
};

//#endregion
//#region src/common/api/worker/facades/UserFacade.ts
var UserFacade = class {
	user = null;
	accessToken = null;
	leaderStatus;
	constructor(keyCache, cryptoWrapper) {
		this.keyCache = keyCache;
		this.cryptoWrapper = cryptoWrapper;
		this.reset();
	}
	setAccessToken(accessToken) {
		this.accessToken = accessToken;
	}
	getAccessToken() {
		return this.accessToken;
	}
	setUser(user) {
		if (this.accessToken == null) throw new ProgrammingError("invalid state: no access token");
		this.user = user;
	}
	unlockUserGroupKey(userPassphraseKey) {
		if (this.user == null) throw new ProgrammingError("Invalid state: no user");
		const userGroupMembership = this.user.userGroup;
		const currentUserGroupKey = {
			version: Number(userGroupMembership.groupKeyVersion),
			object: decryptKey(userPassphraseKey, userGroupMembership.symEncGKey)
		};
		this.keyCache.setCurrentUserGroupKey(currentUserGroupKey);
		this.setUserGroupKeyDistributionKey(userPassphraseKey);
	}
	setUserGroupKeyDistributionKey(userPassphraseKey) {
		if (this.user == null) throw new ProgrammingError("Invalid state: no user");
		const userGroupMembership = this.user.userGroup;
		const userGroupKeyDistributionKey = this.deriveUserGroupKeyDistributionKey(userGroupMembership.group, userPassphraseKey);
		this.keyCache.setUserGroupKeyDistributionKey(userGroupKeyDistributionKey);
	}
	deriveUserGroupKeyDistributionKey(userGroupId, userPassphraseKey) {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: userGroupId,
			key: userPassphraseKey,
			context: "userGroupKeyDistributionKey"
		});
	}
	async updateUser(user) {
		if (this.user == null) throw new ProgrammingError("Update user is called without logging in. This function is not for you.");
		this.user = user;
		await this.keyCache.removeOutdatedGroupKeys(user);
	}
	getUser() {
		return this.user;
	}
	/**
	* @return The map which contains authentication data for the logged-in user.
	*/
	createAuthHeaders() {
		return this.accessToken ? { accessToken: this.accessToken } : {};
	}
	getUserGroupId() {
		return this.getLoggedInUser().userGroup.group;
	}
	getAllGroupIds() {
		let groups = this.getLoggedInUser().memberships.map((membership) => membership.group);
		groups.push(this.getLoggedInUser().userGroup.group);
		return groups;
	}
	getCurrentUserGroupKey() {
		const currentUserGroupKey = this.keyCache.getCurrentUserGroupKey();
		if (currentUserGroupKey == null) if (this.isPartiallyLoggedIn()) throw new LoginIncompleteError("userGroupKey not available");
else throw new ProgrammingError("Invalid state: userGroupKey is not available");
		return currentUserGroupKey;
	}
	getMembership(groupId) {
		let membership = this.getLoggedInUser().memberships.find((g) => isSameId(g.group, groupId));
		if (!membership) throw new Error(`No group with groupId ${groupId} found!`);
		return membership;
	}
	hasGroup(groupId) {
		if (!this.user) return false;
else return groupId === this.user.userGroup.group || this.user.memberships.some((m) => m.group === groupId);
	}
	getGroupId(groupType) {
		if (groupType === GroupType.User) return this.getUserGroupId();
else {
			let membership = this.getLoggedInUser().memberships.find((m) => m.groupType === groupType);
			if (!membership) throw new Error("could not find groupType " + groupType + " for user " + this.getLoggedInUser()._id);
			return membership.group;
		}
	}
	getGroupIds(groupType) {
		return this.getLoggedInUser().memberships.filter((m) => m.groupType === groupType).map((gm) => gm.group);
	}
	isPartiallyLoggedIn() {
		return this.user != null;
	}
	isFullyLoggedIn() {
		return this.keyCache.getCurrentUserGroupKey() != null;
	}
	getLoggedInUser() {
		return assertNotNull(this.user);
	}
	setLeaderStatus(status) {
		this.leaderStatus = status;
		console.log("New leader status set:", status.leaderStatus);
	}
	isLeader() {
		return this.leaderStatus.leaderStatus;
	}
	reset() {
		this.user = null;
		this.accessToken = null;
		this.keyCache.reset();
		this.leaderStatus = createWebsocketLeaderStatus({ leaderStatus: false });
	}
	updateUserGroupKey(userGroupKeyDistribution) {
		const userGroupKeyDistributionKey = this.keyCache.getUserGroupKeyDistributionKey();
		if (userGroupKeyDistributionKey == null) {
			console.log("could not update userGroupKey because distribution key is not available");
			return;
		}
		let newUserGroupKeyBytes;
		try {
			newUserGroupKeyBytes = decryptKey(userGroupKeyDistributionKey, userGroupKeyDistribution.distributionEncUserGroupKey);
		} catch (e) {
			console.log(`Could not decrypt userGroupKeyUpdate`, e);
			return;
		}
		const newUserGroupKey = {
			object: newUserGroupKeyBytes,
			version: Number(userGroupKeyDistribution.userGroupKeyVersion)
		};
		console.log(`updating userGroupKey. new version: ${userGroupKeyDistribution.userGroupKeyVersion}`);
		this.keyCache.setCurrentUserGroupKey(newUserGroupKey);
	}
};

//#endregion
//#region src/common/api/worker/offline/StandardMigrations.ts
async function migrateAllListElements(typeRef, storage, migrations) {
	let entities = await storage.getRawListElementsOfType(typeRef);
	for (const migration of migrations) entities = entities.map(migration);
	for (const entity of entities) {
		entity._type = typeRef;
		await storage.put(entity);
	}
}
async function migrateAllElements(typeRef, storage, migrations) {
	let entities = await storage.getRawElementsOfType(typeRef);
	for (const migration of migrations) entities = entities.map(migration);
	for (const entity of entities) {
		entity._type = typeRef;
		await storage.put(entity);
	}
}
function renameAttribute(oldName, newName) {
	return function(entity) {
		entity[newName] = entity[oldName];
		delete entity[oldName];
		return entity;
	};
}
function addOwnerKeyVersion() {
	return function(entity) {
		entity["_ownerKeyVersion"] = entity["_ownerEncSessionKey"] == null ? null : "0";
		return entity;
	};
}
function removeValue(valueName) {
	return function(entity) {
		delete entity[valueName];
		return entity;
	};
}
function addValue(valueName, value) {
	return function(entity) {
		entity[valueName] = value;
		return entity;
	};
}
function changeCardinalityFromAnyToZeroOrOne(attribute) {
	return function(entity) {
		const value = entity[attribute];
		if (!Array.isArray(value)) throw new ProgrammingError("Can only migrate from cardinality ANY.");
		const length = value.length;
		if (length === 0) entity[attribute] = null;
else if (length === 1) entity[attribute] = value[0];
else throw new ProgrammingError(`not possible to migrate ANY to ZERO_OR_ONE with array length > 1. actual length: ${length}`);
		return entity;
	};
}
function deleteInstancesOfType(storage, type) {
	return storage.deleteAllOfType(type);
}

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v94.ts
const sys94 = {
	app: "sys",
	version: 94,
	async migrate(storage) {
		await deleteInstancesOfType(storage, MailTypeRef);
		await deleteInstancesOfType(storage, UserTypeRef);
		await migrateAllListElements(CustomerInfoTypeRef, storage, [createCustomerInfo]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v66.ts
const tutanota66 = {
	app: "tutanota",
	version: 66,
	async migrate(storage) {
		await migrateAllListElements(MailTypeRef, storage, [createMail]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v92.ts
const sys92 = {
	app: "sys",
	version: 92,
	async migrate(storage) {
		await migrateAllListElements(BucketPermissionTypeRef, storage, [addProtocolVersion]);
		await migrateAllListElements(MailTypeRef, storage, [(e) => {
			if (e.bucketKey) addProtocolVersion(e.bucketKey);
			return e;
		}]);
		await deleteInstancesOfType(storage, GroupTypeRef);
		await deleteInstancesOfType(storage, UserTypeRef);
	}
};
function addProtocolVersion(entity) {
	if (entity.pubEncBucketKey) entity.protocolVersion = CryptoProtocolVersion.RSA;
else entity.protocolVersion = CryptoProtocolVersion.SYMMETRIC_ENCRYPTION;
	return entity;
}

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v65.ts
const tutanota65 = {
	app: "tutanota",
	version: 65,
	async migrate(storage) {
		migrateAllListElements(MailTypeRef, storage, [removeValue("restrictions")]);
		migrateAllElements(MailboxGroupRootTypeRef, storage, [
			removeValue("contactFormUserContactForm"),
			removeValue("targetMailGroupContactForm"),
			removeValue("participatingContactForms")
		]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v91.ts
const sys91 = {
	app: "sys",
	version: 91,
	async migrate(storage) {
		await migrateAllElements(CustomerTypeRef, storage, [removeValue("contactFormUserGroups"), removeValue("contactFormUserAreaGroups")]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v90.ts
const sys90 = {
	app: "sys",
	version: 90,
	async migrate(storage) {
		await migrateAllListElements(CustomerInfoTypeRef, storage, [(oldCustomerInfo) => {
			if (oldCustomerInfo.customPlan) oldCustomerInfo.customPlan.contactList = false;
			return oldCustomerInfo;
		}]);
		await migrateAllElements(UserTypeRef, storage, [(user) => {
			if (!user.kdfVersion) user.kdfVersion = KdfType.Bcrypt;
			return user;
		}]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v64.ts
const tutanota64 = {
	app: "tutanota",
	version: 64,
	async migrate(storage) {
		migrateAllListElements(FileTypeRef, storage, [removeValue("data")]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v67.ts
const tutanota67 = {
	app: "tutanota",
	version: 67,
	async migrate(storage) {
		await deleteInstancesOfType(storage, ContactTypeRef);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v96.ts
const sys96 = {
	app: "sys",
	version: 96,
	async migrate(storage) {
		const encryptedElementTypes = [
			AccountingInfoTypeRef,
			CustomerServerPropertiesTypeRef,
			InvoiceTypeRef,
			MissedNotificationTypeRef
		];
		const encryptedListElementTypes = [
			GroupInfoTypeRef,
			AuditLogEntryTypeRef,
			WhitelabelChildTypeRef,
			OrderProcessingAgreementTypeRef,
			UserAlarmInfoTypeRef,
			ReceivedGroupInvitationTypeRef,
			GiftCardTypeRef,
			PushIdentifierTypeRef
		];
		for (const type of encryptedElementTypes) await migrateAllElements(type, storage, [addOwnerKeyVersion()]);
		for (const type of encryptedListElementTypes) await migrateAllListElements(type, storage, [addOwnerKeyVersion()]);
		await migrateAllElements(GroupTypeRef, storage, [
			renameAttribute("keys", "currentKeys"),
			changeCardinalityFromAnyToZeroOrOne("currentKeys"),
			removeKeyPairVersion(),
			addValue("formerGroupKeys", null),
			addValue("pubAdminGroupEncGKey", null),
			addValue("groupKeyVersion", "0"),
			addAdminGroupKeyVersion()
		]);
		await migrateAllElements(UserTypeRef, storage, [addVersionsToGroupMemberships(), removeValue("userEncClientKey")]);
		await migrateAllListElements(ReceivedGroupInvitationTypeRef, storage, [addValue("sharedGroupKeyVersion", "0")]);
		await migrateAllElements(RecoverCodeTypeRef, storage, [addValue("userKeyVersion", "0")]);
		await migrateAllElements(UserGroupRootTypeRef, storage, [addValue("keyRotations", null)]);
	}
};
function addVersionsToGroupMemberships() {
	return function(entity) {
		const userGroupMembership = entity["userGroup"];
		userGroupMembership["groupKeyVersion"] = "0";
		userGroupMembership["symKeyVersion"] = "0";
		for (const membership of entity["memberships"]) {
			membership["groupKeyVersion"] = "0";
			membership["symKeyVersion"] = "0";
		}
		return entity;
	};
}
function addAdminGroupKeyVersion() {
	return function(entity) {
		entity["adminGroupKeyVersion"] = entity["adminGroupEncGKey"] == null ? null : "0";
		return entity;
	};
}
function removeKeyPairVersion() {
	return function(entity) {
		const currentKeys = entity["currentKeys"];
		if (currentKeys) delete currentKeys["version"];
		return entity;
	};
}

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v69.ts
const tutanota69 = {
	app: "tutanota",
	version: 69,
	async migrate(storage) {
		const encryptedElementTypes = [
			FileSystemTypeRef,
			MailBoxTypeRef,
			ContactListTypeRef,
			TutanotaPropertiesTypeRef,
			CalendarGroupRootTypeRef,
			UserSettingsGroupRootTypeRef,
			ContactListGroupRootTypeRef,
			MailboxPropertiesTypeRef,
			TemplateGroupRootTypeRef
		];
		const encryptedListElementTypes = [
			FileTypeRef,
			ContactTypeRef,
			MailTypeRef,
			MailFolderTypeRef,
			CalendarEventTypeRef,
			CalendarEventUpdateTypeRef,
			EmailTemplateTypeRef,
			MailDetailsDraftTypeRef,
			MailDetailsBlobTypeRef,
			ContactListEntryTypeRef,
			KnowledgeBaseEntryTypeRef
		];
		for (const type of encryptedElementTypes) await migrateAllElements(type, storage, [addOwnerKeyVersion()]);
		for (const type of encryptedListElementTypes) await migrateAllListElements(type, storage, [addOwnerKeyVersion()]);
		await migrateAllListElements(MailTypeRef, storage, [addVersionsToBucketKey()]);
		await migrateAllElements(TutanotaPropertiesTypeRef, storage, [renameAttribute("groupEncEntropy", "userEncEntropy"), addValue("userKeyVersion", null)]);
		await migrateAllElements(MailBoxTypeRef, storage, [removeValue("symEncShareBucketKey")]);
	}
};
function addVersionsToBucketKey() {
	return function(entity) {
		const bucketKey = entity["bucketKey"];
		if (bucketKey != null) {
			bucketKey["recipientKeyVersion"] = "0";
			bucketKey["senderKeyVersion"] = bucketKey["protocolVersion"] === CryptoProtocolVersion.TUTA_CRYPT ? "0" : null;
			for (const instanceSessionKey of bucketKey["bucketEncSessionKeys"]) instanceSessionKey["symKeyVersion"] = "0";
		}
		return entity;
	};
}

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v97.ts
const sys97 = {
	app: "sys",
	version: 97,
	async migrate(storage) {
		await migrateAllElements(CustomerTypeRef, storage, [removeValue("canceledPremiumAccount")]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v71.ts
const tutanota71 = {
	app: "tutanota",
	version: 71,
	async migrate(storage) {
		await deleteInstancesOfType(storage, UserGroupRootTypeRef);
		await deleteInstancesOfType(storage, ReceivedGroupInvitationTypeRef);
		await deleteInstancesOfType(storage, SentGroupInvitationTypeRef);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v99.ts
const sys99 = {
	app: "sys",
	version: 99,
	async migrate(storage) {}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v101.ts
const sys101 = {
	app: "sys",
	version: 101,
	async migrate(storage, sqlCipherFacade) {}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v102.ts
const sys102 = {
	app: "sys",
	version: 102,
	async migrate(storage, sqlCipherFacade) {
		await deleteInstancesOfType(storage, UserGroupRootTypeRef);
		await deleteInstancesOfType(storage, GroupTypeRef);
		await deleteInstancesOfType(storage, UserTypeRef);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v72.ts
const tutanota72 = {
	app: "tutanota",
	version: 72,
	async migrate(storage) {}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v103.ts
const sys103 = {
	app: "sys",
	version: 103,
	async migrate(storage, sqlCipherFacade) {
		await deleteInstancesOfType(storage, AccountingInfoTypeRef);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v73.ts
const tutanota73 = {
	app: "tutanota",
	version: 73,
	async migrate(storage) {
		await migrateAllListElements(MailTypeRef, storage, [
			removeValue("body"),
			removeValue("toRecipients"),
			removeValue("ccRecipients"),
			removeValue("bccRecipients"),
			removeValue("replyTos"),
			removeValue("headers"),
			removeValue("sentDate")
		]);
		await migrateAllElements(MailBoxTypeRef, storage, [removeValue("mails")]);
		await migrateAllListElements(MailFolderTypeRef, storage, [removeValue("subFolders")]);
		await migrateAllListElements(FileTypeRef, storage, [removeValue("_owner"), removeValue("_area")]);
		await migrateAllListElements(ContactTypeRef, storage, [
			removeValue("_owner"),
			removeValue("_area"),
			removeValue("autoTransmitPassword")
		]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v104.ts
const sys104 = {
	app: "sys",
	version: 104,
	async migrate(storage, _) {
		await migrateAllElements(UserTypeRef, storage, [removeValue("phoneNumbers")]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v105.ts
const sys105 = {
	app: "sys",
	version: 105,
	async migrate(storage, _) {
		await deleteInstancesOfType(storage, PushIdentifierTypeRef);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v106.ts
const sys106 = {
	app: "sys",
	version: 106,
	async migrate(storage) {}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v74.ts
const tutanota74 = {
	app: "tutanota",
	version: 74,
	async migrate(storage) {
		await migrateAllListElements(MailFolderTypeRef, storage, [
			addValue("isLabel", false),
			addValue("isMailSet", false),
			addValue("entries", GENERATED_MIN_ID)
		]);
		await migrateAllElements(MailBoxTypeRef, storage, [createMailBox]);
		await migrateAllListElements(MailTypeRef, storage, [createMail]);
		await deleteInstancesOfType(storage, CalendarEventTypeRef);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v107.ts
const sys107 = {
	app: "sys",
	version: 107,
	async migrate(storage) {}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v75.ts
const tutanota75 = {
	app: "tutanota",
	version: 75,
	async migrate(storage) {
		await deleteInstancesOfType(storage, UserSettingsGroupRootTypeRef);
		const groupInfos = await storage.getRawListElementsOfType(GroupInfoTypeRef);
		for (const groupInfo of groupInfos) {
			if (groupInfo.groupType !== GroupType.User) continue;
			await storage.deleteIfExists(GroupInfoTypeRef, getListId(groupInfo), getElementId(groupInfo));
		}
		await deleteInstancesOfType(storage, AuditLogEntryTypeRef);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v111.ts
const sys111 = {
	app: "sys",
	version: 111,
	async migrate(storage) {
		await migrateAllElements(GroupTypeRef, storage, [removeValue("pubAdminGroupEncGKey"), addValue("pubAdminGroupEncGKey", null)]);
		await migrateAllListElements(GroupKeyTypeRef, storage, [removeValue("pubAdminGroupEncGKey"), addValue("pubAdminGroupEncGKey", null)]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v76.ts
const tutanota76 = {
	app: "tutanota",
	version: 76,
	async migrate(storage) {
		await migrateAllElements(MailboxGroupRootTypeRef, storage, [removeValue("whitelistRequests")]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v112.ts
const sys112 = {
	app: "sys",
	version: 112,
	async migrate(storage) {
		await migrateAllElements(MailboxGroupRootTypeRef, storage, [removeValue("whitelistedDomains")]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v77.ts
const tutanota77 = {
	app: "tutanota",
	version: 77,
	async migrate(storage) {
		await migrateAllListElements(MailFolderTypeRef, storage, [removeValue("isLabel"), addValue("color", null)]);
		await deleteInstancesOfType(storage, TutanotaPropertiesTypeRef);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v114.ts
const sys114 = {
	app: "sys",
	version: 114,
	async migrate(storage) {
		await migrateAllListElements(CustomerInfoTypeRef, storage, [addUnlimitedLabelsToPlanConfiguration()]);
	}
};
function addUnlimitedLabelsToPlanConfiguration() {
	return function addUnlimitedLabelsToPlanConfigurationMigration(entity) {
		if (entity.customPlan != null) entity.customPlan.unlimitedLabels = false;
		return entity;
	};
}

//#endregion
//#region src/common/api/worker/offline/migrations/offline2.ts
const offline2 = {
	app: "offline",
	version: 2,
	async migrate(storage, _) {
		await migrateAllElements(TutanotaPropertiesTypeRef, storage, [addValue("defaultLabelCreated", false)]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v115.ts
const sys115 = {
	app: "sys",
	version: 115,
	async migrate(storage) {}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v78.ts
const tutanota78 = {
	app: "tutanota",
	version: 78,
	async migrate(storage) {}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v116.ts
const sys116 = {
	app: "sys",
	version: 116,
	async migrate(storage) {}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v79.ts
const tutanota79 = {
	app: "tutanota",
	version: 79,
	async migrate(storage) {
		await migrateAllElements(MailBoxTypeRef, storage, [addValue("importedAttachments", GENERATED_MIN_ID), addValue("mailImportStates", GENERATED_MIN_ID)]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/offline3.ts
const offline3 = {
	app: "offline",
	version: 3,
	async migrate(storage, _) {
		let mailboxes = await storage.getElementsOfType(MailBoxTypeRef);
		let needsOfflineDisable = false;
		for (const mailbox of mailboxes) {
			if (mailbox.importedAttachments !== GENERATED_MIN_ID && mailbox.mailImportStates !== GENERATED_MIN_ID) continue;
			await storage.deleteIfExists(MailBoxTypeRef, null, mailbox._id);
			needsOfflineDisable = true;
		}
		if (needsOfflineDisable) {
			await deleteInstancesOfType(storage, UserSettingsGroupRootTypeRef);
			const groupInfos = await storage.getRawListElementsOfType(GroupInfoTypeRef);
			for (const groupInfo of groupInfos) {
				if (groupInfo.groupType !== GroupType.User) continue;
				await storage.deleteIfExists(GroupInfoTypeRef, getListId(groupInfo), getElementId(groupInfo));
			}
		}
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/sys-v118.ts
const sys118 = {
	app: "sys",
	version: 118,
	async migrate(storage) {
		await migrateAllListElements(CalendarEventTypeRef, storage, [(calendarEvent) => {
			if (calendarEvent.repeatRule) calendarEvent.repeatRule.advancedRules = [];
			return calendarEvent;
		}]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/tutanota-v80.ts
const tutanota80 = {
	app: "tutanota",
	version: 80,
	async migrate(storage) {
		await migrateAllListElements(CalendarEventTypeRef, storage, [(calendarEvent) => {
			if (calendarEvent.repeatRule) calendarEvent.repeatRule.advancedRules = [];
			return calendarEvent;
		}]);
	}
};

//#endregion
//#region src/common/api/worker/offline/migrations/storage-v11.ts
const storage11 = {
	app: "storage",
	version: 11,
	async migrate(storage) {}
};

//#endregion
//#region src/common/api/worker/offline/OfflineStorageMigrator.ts
const OFFLINE_STORAGE_MIGRATIONS = [
	sys90,
	tutanota64,
	sys91,
	tutanota65,
	sys92,
	tutanota66,
	sys94,
	tutanota67,
	sys96,
	tutanota69,
	sys97,
	tutanota71,
	sys99,
	sys101,
	sys102,
	tutanota72,
	sys103,
	tutanota73,
	sys104,
	sys105,
	sys106,
	tutanota74,
	tutanota75,
	sys107,
	tutanota75,
	sys111,
	tutanota76,
	sys112,
	tutanota77,
	sys114,
	offline2,
	sys115,
	tutanota78,
	sys116,
	tutanota79,
	offline3,
	sys118,
	tutanota80,
	storage11
];
const CURRENT_OFFLINE_VERSION = 3;
var OfflineStorageMigrator = class {
	constructor(migrations, modelInfos$1) {
		this.migrations = migrations;
		this.modelInfos = modelInfos$1;
	}
	async migrate(storage, sqlCipherFacade) {
		const meta = await storage.dumpMetadata();
		if (Object.keys(meta).length === 1 && meta.lastUpdateTime != null) throw new OutOfSyncError("Invalid DB state, missing model versions");
		const populatedMeta = await this.populateModelVersions(meta, storage);
		if (this.isDbNewerThanCurrentClient(populatedMeta)) throw new OutOfSyncError(`offline database has newer schema than client`);
		await this.runMigrations(meta, storage, sqlCipherFacade);
		await this.checkStateAfterMigrations(storage);
	}
	async checkStateAfterMigrations(storage) {
		const meta = await storage.dumpMetadata();
		for (const app of typedKeys(this.modelInfos)) {
			const compatibleSince = this.modelInfos[app].compatibleSince;
			let metaVersion = meta[`${app}-version`];
			if (metaVersion < compatibleSince) throw new ProgrammingError(`You forgot to migrate your databases! ${app}.version should be >= ${this.modelInfos[app].compatibleSince} but in db it is ${metaVersion}`);
		}
	}
	async runMigrations(meta, storage, sqlCipherFacade) {
		for (const { app, version, migrate } of this.migrations) {
			const storedVersion = meta[`${app}-version`];
			if (storedVersion < version) {
				console.log(`running offline db migration for ${app} from ${storedVersion} to ${version}`);
				await migrate(storage, sqlCipherFacade);
				console.log("migration finished");
				await storage.setStoredModelVersion(app, version);
			}
		}
	}
	async populateModelVersions(meta, storage) {
		const newMeta = { ...meta };
		for (const app of typedKeys(this.modelInfos)) await this.prepopulateVersionIfAbsent(app, this.modelInfos[app].version, newMeta, storage);
		await this.prepopulateVersionIfAbsent("offline", CURRENT_OFFLINE_VERSION, newMeta, storage);
		return newMeta;
	}
	/**
	* update the metadata table to initialize the row of the app with the given model version
	*
	* NB: mutates meta
	*/
	async prepopulateVersionIfAbsent(app, version, meta, storage) {
		const key = `${app}-version`;
		const storedVersion = meta[key];
		if (storedVersion == null) {
			meta[key] = version;
			await storage.setStoredModelVersion(app, version);
		}
	}
	/**
	* it's possible that the user installed an older client over a newer one, and we don't have backwards migrations.
	* in that case, it's likely that the client can't even understand the contents of the db.
	* we're going to delete it and not migrate at all.
	* @private
	*
	* @returns true if the database we're supposed to migrate has any higher model versions than our highest migration for that model, false otherwise
	*/
	isDbNewerThanCurrentClient(meta) {
		for (const [app, { version }] of typedEntries(this.modelInfos)) {
			const storedVersion = meta[`${app}-version`];
			if (storedVersion > version) return true;
		}
		return assertNotNull(meta[`offline-version`]) > CURRENT_OFFLINE_VERSION;
	}
};

//#endregion
//#region src/common/native/common/generatedipc/SqlCipherFacadeSendDispatcher.ts
var SqlCipherFacadeSendDispatcher = class {
	constructor(transport) {
		this.transport = transport;
	}
	async openDb(...args) {
		return this.transport.invokeNative("ipc", [
			"SqlCipherFacade",
			"openDb",
			...args
		]);
	}
	async closeDb(...args) {
		return this.transport.invokeNative("ipc", [
			"SqlCipherFacade",
			"closeDb",
			...args
		]);
	}
	async deleteDb(...args) {
		return this.transport.invokeNative("ipc", [
			"SqlCipherFacade",
			"deleteDb",
			...args
		]);
	}
	async run(...args) {
		return this.transport.invokeNative("ipc", [
			"SqlCipherFacade",
			"run",
			...args
		]);
	}
	async get(...args) {
		return this.transport.invokeNative("ipc", [
			"SqlCipherFacade",
			"get",
			...args
		]);
	}
	async all(...args) {
		return this.transport.invokeNative("ipc", [
			"SqlCipherFacade",
			"all",
			...args
		]);
	}
	async lockRangesDbAccess(...args) {
		return this.transport.invokeNative("ipc", [
			"SqlCipherFacade",
			"lockRangesDbAccess",
			...args
		]);
	}
	async unlockRangesDbAccess(...args) {
		return this.transport.invokeNative("ipc", [
			"SqlCipherFacade",
			"unlockRangesDbAccess",
			...args
		]);
	}
};

//#endregion
//#region src/common/api/worker/facades/EntropyFacade.ts
var EntropyFacade = class {
	newEntropy = -1;
	lastEntropyUpdate = Date.now();
	constructor(userFacade, serviceExecutor, random$1, lazyKeyLoaderFacade) {
		this.userFacade = userFacade;
		this.serviceExecutor = serviceExecutor;
		this.random = random$1;
		this.lazyKeyLoaderFacade = lazyKeyLoaderFacade;
	}
	/**
	* Adds entropy to the randomizer. Updated the stored entropy for a user when enough entropy has been collected.
	*/
	addEntropy(entropy) {
		try {
			return this.random.addEntropy(entropy);
		} finally {
			this.newEntropy = this.newEntropy + entropy.reduce((sum, value) => value.entropy + sum, 0);
			const now = new Date().getTime();
			if (this.newEntropy > 5e3 && now - this.lastEntropyUpdate > 3e5) {
				this.lastEntropyUpdate = now;
				this.newEntropy = 0;
				this.storeEntropy();
			}
		}
	}
	storeEntropy() {
		if (!this.userFacade.isFullyLoggedIn() || !this.userFacade.isLeader()) return Promise.resolve();
		const userGroupKey = this.userFacade.getCurrentUserGroupKey();
		const entropyData = createEntropyData({
			userEncEntropy: encryptBytes(userGroupKey.object, this.random.generateRandomData(32)),
			userKeyVersion: userGroupKey.version.toString()
		});
		return this.serviceExecutor.put(EntropyService, entropyData).catch(ofClass(LockedError, noOp)).catch(ofClass(ConnectionError, (e) => {
			console.log("could not store entropy", e);
		})).catch(ofClass(ServiceUnavailableError, (e) => {
			console.log("could not store entropy", e);
		}));
	}
	/**
	* Loads entropy from the last logout.
	*/
	async loadEntropy(tutanotaProperties) {
		if (tutanotaProperties.userEncEntropy) try {
			const keyLoaderFacade = this.lazyKeyLoaderFacade();
			const userGroupKey = await keyLoaderFacade.loadSymUserGroupKey(Number(tutanotaProperties.userKeyVersion ?? 0));
			const entropy = authenticatedAesDecrypt(userGroupKey, tutanotaProperties.userEncEntropy);
			random.addStaticEntropy(entropy);
		} catch (error) {
			console.log("could not decrypt entropy", error);
		}
	}
};

//#endregion
//#region src/common/api/worker/facades/BlobAccessTokenFacade.ts
assertWorkerOrNode();
var BlobAccessTokenFacade = class {
	readCache;
	writeCache;
	constructor(serviceExecutor, authDataProvider, dateProvider) {
		this.serviceExecutor = serviceExecutor;
		this.authDataProvider = authDataProvider;
		this.readCache = new BlobAccessTokenCache(dateProvider);
		this.writeCache = new BlobAccessTokenCache(dateProvider);
	}
	/**
	* Requests a token that allows uploading blobs for the given ArchiveDataType and ownerGroup.
	* @param archiveDataType The type of data that should be stored.
	* @param ownerGroupId The ownerGroup were the data belongs to (e.g. group of type mail)
	*/
	async requestWriteToken(archiveDataType, ownerGroupId) {
		const requestNewToken = async () => {
			const tokenRequest = createBlobAccessTokenPostIn({
				archiveDataType,
				write: createBlobWriteData({ archiveOwnerGroup: ownerGroupId }),
				read: null
			});
			const { blobAccessInfo } = await this.serviceExecutor.post(BlobAccessTokenService, tokenRequest);
			return blobAccessInfo;
		};
		const key = this.makeWriteCacheKey(ownerGroupId, archiveDataType);
		return this.writeCache.getToken(key, [], requestNewToken);
	}
	makeWriteCacheKey(ownerGroupId, archiveDataType) {
		return ownerGroupId + archiveDataType;
	}
	/**
	* Remove a given write token from the cache.
	* @param archiveDataType
	* @param ownerGroupId
	*/
	evictWriteToken(archiveDataType, ownerGroupId) {
		const key = this.makeWriteCacheKey(ownerGroupId, archiveDataType);
		this.writeCache.evictArchiveOrGroupKey(key);
	}
	/**
	* Requests a token that grants read access to all blobs that are referenced by the given instances.
	* A user must be owner of the instance but must not be owner of the archive where the blobs are stored in.
	*
	* @param archiveDataType specify the data type
	* @param referencingInstances the instances that references the blobs
	* @param blobLoadOptions load options when loading blobs
	* @throws ProgrammingError if instances are not part of the same list or blobs are not part of the same archive.
	*/
	async requestReadTokenMultipleInstances(archiveDataType, referencingInstances, blobLoadOptions) {
		if (isEmpty(referencingInstances)) throw new ProgrammingError("Must pass at least one referencing instance");
		const instanceListId = referencingInstances[0].listId;
		if (!referencingInstances.every((instance) => instance.listId === instanceListId)) throw new ProgrammingError("All referencing instances must be part of the same list");
		const archiveId = this.getArchiveId(referencingInstances);
		const requestNewToken = lazyMemoized(async () => {
			const instanceIds = referencingInstances.map(({ elementId }) => createInstanceId({ instanceId: elementId }));
			const tokenRequest = createBlobAccessTokenPostIn({
				archiveDataType,
				read: createBlobReadData({
					archiveId,
					instanceListId,
					instanceIds
				}),
				write: null
			});
			const { blobAccessInfo } = await this.serviceExecutor.post(BlobAccessTokenService, tokenRequest, blobLoadOptions);
			return blobAccessInfo;
		});
		return this.readCache.getToken(archiveId, referencingInstances.map((instance) => instance.elementId), requestNewToken);
	}
	/**
	* Requests a token that grants read access to all blobs that are referenced by the given instance.
	* A user must be owner of the instance but must not be owner of the archive were the blobs are stored in.
	* @param archiveDataType specify the data type
	* @param referencingInstance the instance that references the blobs
	* @param blobLoadOptions load options when loading blobs
	*/
	async requestReadTokenBlobs(archiveDataType, referencingInstance, blobLoadOptions) {
		const archiveId = this.getArchiveId([referencingInstance]);
		const requestNewToken = async () => {
			const instanceListId = referencingInstance.listId;
			const instanceId = referencingInstance.elementId;
			const instanceIds = [createInstanceId({ instanceId })];
			const tokenRequest = createBlobAccessTokenPostIn({
				archiveDataType,
				read: createBlobReadData({
					archiveId,
					instanceListId,
					instanceIds
				}),
				write: null
			});
			const { blobAccessInfo } = await this.serviceExecutor.post(BlobAccessTokenService, tokenRequest, blobLoadOptions);
			return blobAccessInfo;
		};
		return this.readCache.getToken(archiveId, [referencingInstance.elementId], requestNewToken);
	}
	/**
	* Remove a given read blobs token from the cache.
	* @param referencingInstance
	*/
	evictReadBlobsToken(referencingInstance) {
		this.readCache.evictInstanceId(referencingInstance.elementId);
		const archiveId = this.getArchiveId([referencingInstance]);
		this.readCache.evictArchiveOrGroupKey(archiveId);
	}
	/**
	* Remove a given read blobs token from the cache.
	* @param referencingInstances
	*/
	evictReadBlobsTokenMultipleBlobs(referencingInstances) {
		this.readCache.evictAll(referencingInstances.map((instance) => instance.elementId));
		const archiveId = this.getArchiveId(referencingInstances);
		this.readCache.evictArchiveOrGroupKey(archiveId);
	}
	/**
	* Requests a token that grants access to all blobs stored in the given archive. The user must own the archive (member of group)
	* @param archiveId ID for the archive to read blobs from
	*/
	async requestReadTokenArchive(archiveId) {
		const requestNewToken = async () => {
			const tokenRequest = createBlobAccessTokenPostIn({
				archiveDataType: null,
				read: createBlobReadData({
					archiveId,
					instanceIds: [],
					instanceListId: null
				}),
				write: null
			});
			const { blobAccessInfo } = await this.serviceExecutor.post(BlobAccessTokenService, tokenRequest);
			return blobAccessInfo;
		};
		return this.readCache.getToken(archiveId, [], requestNewToken);
	}
	/**
	* Remove a given read archive token from the cache.
	* @param archiveId
	*/
	evictArchiveToken(archiveId) {
		this.readCache.evictArchiveOrGroupKey(archiveId);
	}
	getArchiveId(referencingInstances) {
		if (isEmpty(referencingInstances)) throw new ProgrammingError("Must pass at least one referencing instance");
		const archiveIds = new Set();
		for (const referencingInstance of referencingInstances) {
			if (isEmpty(referencingInstance.blobs)) throw new ProgrammingError("must pass blobs");
			for (const blob of referencingInstance.blobs) archiveIds.add(blob.archiveId);
		}
		if (archiveIds.size != 1) throw new Error(`only one archive id allowed, but was ${archiveIds}`);
		return referencingInstances[0].blobs[0].archiveId;
	}
	/**
	*
	* @param blobServerAccessInfo
	* @param additionalRequestParams
	* @param typeRef the typeRef that shall be used to determine the correct model version
	*/
	async createQueryParams(blobServerAccessInfo, additionalRequestParams, typeRef) {
		const typeModel = await resolveTypeReference(typeRef);
		return Object.assign(additionalRequestParams, {
			blobAccessToken: blobServerAccessInfo.blobAccessToken,
			v: typeModel.version
		}, this.authDataProvider.createAuthHeaders());
	}
};
/**
* Checks if the given access token can be used for another blob service requests.
* @param blobServerAccessInfo
* @param dateProvider
*/
function canBeUsedForAnotherRequest(blobServerAccessInfo, dateProvider) {
	return blobServerAccessInfo.expires.getTime() > dateProvider.now();
}
var BlobAccessTokenCache = class {
	instanceMap = new Map();
	archiveMap = new Map();
	constructor(dateProvider) {
		this.dateProvider = dateProvider;
	}
	/**
	* Get a token from the cache or from {@param loader}.
	* First will try to use the token keyed by {@param archiveOrGroupKey}, otherwise it will try to find a token valid for all of {@param instanceIds}.
	*/
	async getToken(archiveOrGroupKey, instanceIds, loader) {
		const archiveToken = archiveOrGroupKey ? this.archiveMap.get(archiveOrGroupKey) : null;
		if (archiveToken != null && canBeUsedForAnotherRequest(archiveToken, this.dateProvider)) return archiveToken;
		const tokens = deduplicate(instanceIds.map((id) => this.instanceMap.get(id) ?? null));
		const firstTokenFound = first(tokens);
		if (tokens.length != 1 || firstTokenFound == null || !canBeUsedForAnotherRequest(firstTokenFound, this.dateProvider)) {
			const newToken = await loader();
			if (archiveOrGroupKey != null && newToken.tokenKind === BlobAccessTokenKind.Archive) this.archiveMap.set(archiveOrGroupKey, newToken);
else for (const id of instanceIds) this.instanceMap.set(id, newToken);
			return newToken;
		} else return firstTokenFound;
	}
	evictInstanceId(id) {
		this.evictAll([id]);
	}
	evictArchiveOrGroupKey(id) {
		this.archiveMap.delete(id);
	}
	evictAll(ids) {
		for (const id of ids) this.instanceMap.delete(id);
	}
};

//#endregion
//#region src/common/api/worker/crypto/OwnerEncSessionKeysUpdateQueue.ts
assertWorkerOrNode();
const UPDATE_SESSION_KEYS_SERVICE_DEBOUNCE_MS = 50;
var OwnerEncSessionKeysUpdateQueue = class {
	updateInstanceSessionKeyQueue = [];
	invokeUpdateSessionKeyService;
	senderAuthStatusForMailInstance = null;
	constructor(userFacade, serviceExecutor, debounceTimeoutMs = UPDATE_SESSION_KEYS_SERVICE_DEBOUNCE_MS) {
		this.userFacade = userFacade;
		this.serviceExecutor = serviceExecutor;
		this.invokeUpdateSessionKeyService = debounce(debounceTimeoutMs, () => this.sendUpdateRequest());
	}
	/**
	* Add the ownerEncSessionKey updates to the queue and debounce the update request.
	*
	* @param instanceSessionKeys all instanceSessionKeys from one bucketKey containing the ownerEncSessionKey as symEncSessionKey
	* @param typeModel of the main instance that we are updating session keys for
	*/
	async updateInstanceSessionKeys(instanceSessionKeys, typeModel) {
		if (this.userFacade.isLeader()) {
			const groupKeyUpdateTypeModel = await resolveTypeReference(GroupKeyUpdateTypeRef);
			if (groupKeyUpdateTypeModel.id !== typeModel.id) {
				this.updateInstanceSessionKeyQueue.push(...instanceSessionKeys);
				this.invokeUpdateSessionKeyService();
			}
		}
	}
	async sendUpdateRequest() {
		const instanceSessionKeys = this.updateInstanceSessionKeyQueue;
		this.updateInstanceSessionKeyQueue = [];
		try {
			if (instanceSessionKeys.length > 0) await this.postUpdateSessionKeysService(instanceSessionKeys);
		} catch (e) {
			if (e instanceof LockedError) {
				this.updateInstanceSessionKeyQueue.push(...instanceSessionKeys);
				this.invokeUpdateSessionKeyService();
			} else {
				console.log("error during session key update:", e.name, instanceSessionKeys.length);
				throw e;
			}
		}
	}
	async postUpdateSessionKeysService(instanceSessionKeys) {
		const input = createUpdateSessionKeysPostIn({ ownerEncSessionKeys: instanceSessionKeys });
		await this.serviceExecutor.post(UpdateSessionKeysService, input);
	}
};

//#endregion
//#region src/common/api/worker/EventBusEventCoordinator.ts
var EventBusEventCoordinator = class {
	constructor(connectivityListener, mailFacade, userFacade, entityClient, eventController, configurationDatabase, keyRotationFacade, cacheManagementFacade, sendError, appSpecificBatchHandling) {
		this.connectivityListener = connectivityListener;
		this.mailFacade = mailFacade;
		this.userFacade = userFacade;
		this.entityClient = entityClient;
		this.eventController = eventController;
		this.configurationDatabase = configurationDatabase;
		this.keyRotationFacade = keyRotationFacade;
		this.cacheManagementFacade = cacheManagementFacade;
		this.sendError = sendError;
		this.appSpecificBatchHandling = appSpecificBatchHandling;
	}
	onWebsocketStateChanged(state) {
		this.connectivityListener.updateWebSocketState(state);
	}
	async onEntityEventsReceived(events, batchId, groupId) {
		await this.entityEventsReceived(events);
		await (await this.mailFacade()).entityEventsReceived(events);
		await this.eventController.onEntityUpdateReceived(events, groupId);
		if (!isTest() && !isAdminClient()) {
			const queuedBatch = {
				groupId,
				batchId,
				events
			};
			const configurationDatabase = await this.configurationDatabase();
			await configurationDatabase.onEntityEventsReceived(queuedBatch);
			this.appSpecificBatchHandling([queuedBatch]);
		}
	}
	/**
	* @param markers only phishing (not spam) marker will be sent as websocket updates
	*/
	async onPhishingMarkersReceived(markers) {
		(await this.mailFacade()).phishingMarkersUpdateReceived(markers);
	}
	onError(tutanotaError) {
		this.sendError(tutanotaError);
	}
	onLeaderStatusChanged(leaderStatus) {
		this.connectivityListener.onLeaderStatusChanged(leaderStatus);
		if (!isAdminClient()) {
			const user = this.userFacade.getUser();
			if (leaderStatus.leaderStatus && user && user.accountType !== AccountType.EXTERNAL) this.keyRotationFacade.processPendingKeyRotationsAndUpdates(user);
else this.keyRotationFacade.reset();
		}
	}
	onCounterChanged(counter) {
		this.eventController.onCountersUpdateReceived(counter);
	}
	async entityEventsReceived(data) {
		const groupKeyUpdates = [];
		const user = this.userFacade.getUser();
		if (user == null) return;
		for (const update of data) if (update.operation === OperationType.UPDATE && isSameTypeRefByAttr(UserTypeRef, update.application, update.type) && isSameId(user._id, update.instanceId)) await this.userFacade.updateUser(await this.entityClient.load(UserTypeRef, user._id));
else if ((update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) && isSameTypeRefByAttr(UserGroupKeyDistributionTypeRef, update.application, update.type) && isSameId(user.userGroup.group, update.instanceId)) await (await this.cacheManagementFacade()).tryUpdatingUserGroupKey();
else if (update.operation === OperationType.CREATE && isSameTypeRefByAttr(GroupKeyUpdateTypeRef, update.application, update.type)) groupKeyUpdates.push([update.instanceListId, update.instanceId]);
		await this.keyRotationFacade.updateGroupMemberships(groupKeyUpdates);
	}
};

//#endregion
//#region src/common/api/worker/facades/WorkerFacade.ts
var WorkerFacade = class {
	async generateSsePushIdentifer() {
		return keyToBase64(aes256RandomKey());
	}
	async getLog() {
		const global = self;
		const logger = global.logger;
		if (logger) return logger.getEntries();
else return [];
	}
	async urlify(html) {
		const { urlify } = await import("./Urlifier-chunk.js");
		return urlify(html);
	}
};

//#endregion
//#region \0wasm-loader:argon2.wasm
async function loadWasm$1(options) {
	const shouldForceFallback = options && options.forceFallback;
	if (typeof WebAssembly !== "object" || typeof WebAssembly.instantiate !== "function" || shouldForceFallback) return (() => {
		throw new TypeError("WASM is not supported");
	})();
else if (typeof process !== "undefined") {
		const { readFile } = await import("fs/promises");
		const { dirname, join } = await import("path");
		const { fileURLToPath } = await import("url");
		const __dirname = dirname(fileURLToPath(import.meta.url));
		const wasmPath = join(__dirname, "wasm/argon2.wasm");
		const wasmSource = await readFile(wasmPath);
		return (await WebAssembly.instantiate(wasmSource)).instance.exports;
	} else {
		const wasm = fetch("wasm/argon2.wasm");
		if (WebAssembly.instantiateStreaming) return (await WebAssembly.instantiateStreaming(wasm)).instance.exports;
else {
			const buffer = await (await wasm).arrayBuffer();
			return (await WebAssembly.instantiate(buffer)).instance.exports;
		}
	}
}

//#endregion
//#region src/common/api/worker/facades/Argon2idFacade.ts
assertWorkerOrNode();
var WASMArgon2idFacade = class {
	argon2 = new LazyLoaded(async () => {
		return await loadWasm$1();
	});
	async generateKeyFromPassphrase(passphrase, salt) {
		return generateKeyFromPassphrase(await this.argon2.getAsync(), passphrase, salt);
	}
};
var NativeArgon2idFacade = class {
	constructor(nativeCryptoFacade) {
		this.nativeCryptoFacade = nativeCryptoFacade;
	}
	async generateKeyFromPassphrase(passphrase, salt) {
		const hash = await this.nativeCryptoFacade.argon2idGeneratePassphraseKey(passphrase, salt);
		return uint8ArrayToBitArray(hash);
	}
};

//#endregion
//#region \0wasm-loader:liboqs.wasm
async function loadWasm(options) {
	const shouldForceFallback = options && options.forceFallback;
	if (typeof WebAssembly !== "object" || typeof WebAssembly.instantiate !== "function" || shouldForceFallback) return (() => {
		throw new TypeError("WASM is not supported");
	})();
else if (typeof process !== "undefined") {
		const { readFile } = await import("fs/promises");
		const { dirname, join } = await import("path");
		const { fileURLToPath } = await import("url");
		const __dirname = dirname(fileURLToPath(import.meta.url));
		const wasmPath = join(__dirname, "wasm/liboqs.wasm");
		const wasmSource = await readFile(wasmPath);
		return (await WebAssembly.instantiate(wasmSource)).instance.exports;
	} else {
		const wasm = fetch("wasm/liboqs.wasm");
		if (WebAssembly.instantiateStreaming) return (await WebAssembly.instantiateStreaming(wasm)).instance.exports;
else {
			const buffer = await (await wasm).arrayBuffer();
			return (await WebAssembly.instantiate(buffer)).instance.exports;
		}
	}
}

//#endregion
//#region src/common/api/worker/facades/KyberFacade.ts
assertWorkerOrNode();
var WASMKyberFacade = class {
	constructor(testWASM) {
		this.testWASM = testWASM;
	}
	liboqs = new LazyLoaded(async () => {
		if (this.testWASM) return this.testWASM;
		return await loadWasm();
	});
	async generateKeypair() {
		return generateKeyPair(await this.liboqs.getAsync(), random);
	}
	async encapsulate(publicKey) {
		return encapsulate(await this.liboqs.getAsync(), publicKey, random);
	}
	async decapsulate(privateKey, ciphertext) {
		return decapsulate(await this.liboqs.getAsync(), privateKey, ciphertext);
	}
};
var NativeKyberFacade = class {
	constructor(nativeCryptoFacade) {
		this.nativeCryptoFacade = nativeCryptoFacade;
	}
	generateKeypair() {
		return this.nativeCryptoFacade.generateKyberKeypair(random.generateRandomData(KYBER_RAND_AMOUNT_OF_ENTROPY));
	}
	encapsulate(publicKey) {
		return this.nativeCryptoFacade.kyberEncapsulate(publicKey, random.generateRandomData(KYBER_RAND_AMOUNT_OF_ENTROPY));
	}
	decapsulate(privateKey, ciphertext) {
		return this.nativeCryptoFacade.kyberDecapsulate(privateKey, ciphertext);
	}
};

//#endregion
//#region src/common/api/worker/facades/PQMessage.ts
function decodePQMessage(encoded) {
	const pqMessageParts = bytesToByteArrays(encoded, 4);
	return {
		senderIdentityPubKey: pqMessageParts[0],
		ephemeralPubKey: pqMessageParts[1],
		encapsulation: {
			kyberCipherText: pqMessageParts[2],
			kekEncBucketKey: pqMessageParts[3]
		}
	};
}
function encodePQMessage({ senderIdentityPubKey, ephemeralPubKey, encapsulation }) {
	return byteArraysToBytes([
		senderIdentityPubKey,
		ephemeralPubKey,
		encapsulation.kyberCipherText,
		encapsulation.kekEncBucketKey
	]);
}

//#endregion
//#region src/common/api/worker/facades/PQFacade.ts
var PQFacade = class {
	constructor(kyberFacade) {
		this.kyberFacade = kyberFacade;
	}
	async generateKeyPairs() {
		return {
			keyPairType: KeyPairType.TUTA_CRYPT,
			eccKeyPair: generateEccKeyPair(),
			kyberKeyPair: await this.kyberFacade.generateKeypair()
		};
	}
	async encapsulateAndEncode(senderIdentityKeyPair, ephemeralKeyPair, recipientPublicKeys, bucketKey) {
		const encapsulated = await this.encapsulate(senderIdentityKeyPair, ephemeralKeyPair, recipientPublicKeys, bucketKey);
		return encodePQMessage(encapsulated);
	}
	/**
	* @VisibleForTesting
	*/
	async encapsulate(senderIdentityKeyPair, ephemeralKeyPair, recipientPublicKeys, bucketKey) {
		const eccSharedSecret = eccEncapsulate(senderIdentityKeyPair.privateKey, ephemeralKeyPair.privateKey, recipientPublicKeys.eccPublicKey);
		const kyberEncapsulation = await this.kyberFacade.encapsulate(recipientPublicKeys.kyberPublicKey);
		const kyberCipherText = kyberEncapsulation.ciphertext;
		const kek = this.derivePQKEK(senderIdentityKeyPair.publicKey, ephemeralKeyPair.publicKey, recipientPublicKeys, kyberCipherText, kyberEncapsulation.sharedSecret, eccSharedSecret, CryptoProtocolVersion.TUTA_CRYPT);
		const kekEncBucketKey = aesEncrypt(kek, bucketKey);
		return {
			senderIdentityPubKey: senderIdentityKeyPair.publicKey,
			ephemeralPubKey: ephemeralKeyPair.publicKey,
			encapsulation: {
				kyberCipherText,
				kekEncBucketKey
			}
		};
	}
	async decapsulateEncoded(encodedPQMessage, recipientKeys) {
		const decoded = decodePQMessage(encodedPQMessage);
		return {
			decryptedSymKeyBytes: await this.decapsulate(decoded, recipientKeys),
			senderIdentityPubKey: decoded.senderIdentityPubKey
		};
	}
	/**
	* @VisibleForTesting
	*/
	async decapsulate(message, recipientKeys) {
		const kyberCipherText = message.encapsulation.kyberCipherText;
		const eccSharedSecret = eccDecapsulate(message.senderIdentityPubKey, message.ephemeralPubKey, recipientKeys.eccKeyPair.privateKey);
		const kyberSharedSecret = await this.kyberFacade.decapsulate(recipientKeys.kyberKeyPair.privateKey, kyberCipherText);
		const kek = this.derivePQKEK(message.senderIdentityPubKey, message.ephemeralPubKey, pqKeyPairsToPublicKeys(recipientKeys), kyberCipherText, kyberSharedSecret, eccSharedSecret, CryptoProtocolVersion.TUTA_CRYPT);
		return authenticatedAesDecrypt(kek, message.encapsulation.kekEncBucketKey);
	}
	derivePQKEK(senderIdentityPublicKey, ephemeralPublicKey, recipientPublicKeys, kyberCipherText, kyberSharedSecret, eccSharedSecret, cryptoProtocolVersion) {
		const context = concat(senderIdentityPublicKey, ephemeralPublicKey, recipientPublicKeys.eccPublicKey, kyberPublicKeyToBytes(recipientPublicKeys.kyberPublicKey), kyberCipherText, new Uint8Array([Number(cryptoProtocolVersion)]));
		const inputKeyMaterial = concat(eccSharedSecret.ephemeralSharedSecret, eccSharedSecret.authSharedSecret, kyberSharedSecret);
		const kekBytes = hkdf(context, inputKeyMaterial, stringToUtf8Uint8Array("kek"), KEY_LENGTH_BYTES_AES_256);
		return uint8ArrayToKey(kekBytes);
	}
};

//#endregion
//#region src/common/api/worker/facades/KeyLoaderFacade.ts
var KeyLoaderFacade = class {
	constructor(keyCache, userFacade, entityClient, cacheManagementFacade) {
		this.keyCache = keyCache;
		this.userFacade = userFacade;
		this.entityClient = entityClient;
		this.cacheManagementFacade = cacheManagementFacade;
	}
	/**
	* Load the symmetric group key for the groupId with the provided requestedVersion.
	* @param groupId the id of the group
	* @param requestedVersion the requestedVersion of the key to be loaded
	* @param currentGroupKey needs to be set if the user is not a member of the group (e.g. an admin)
	*/
	async loadSymGroupKey(groupId, requestedVersion, currentGroupKey) {
		if (currentGroupKey != null && currentGroupKey.version < requestedVersion) throw new Error(`Provided current group key is too old (${currentGroupKey.version}) to load the requested version ${requestedVersion} for group ${groupId}`);
		const groupKey = currentGroupKey ?? await this.getCurrentSymGroupKey(groupId);
		if (groupKey.version === requestedVersion) return groupKey.object;
else if (groupKey.version < requestedVersion) {
			await (await this.cacheManagementFacade()).refreshKeyCache(groupId);
			const refreshedGroupKey = await this.getCurrentSymGroupKey(groupId);
			return this.loadSymGroupKey(groupId, requestedVersion, refreshedGroupKey);
		} else {
			const group = await this.entityClient.load(GroupTypeRef, groupId);
			const { symmetricGroupKey } = await this.findFormerGroupKey(group, groupKey, requestedVersion);
			return symmetricGroupKey;
		}
	}
	async getCurrentSymGroupKey(groupId) {
		if (isSameId(groupId, this.userFacade.getUserGroupId())) return this.getCurrentSymUserGroupKey();
		return this.keyCache.getCurrentGroupKey(groupId, () => this.loadAndDecryptCurrentSymGroupKey(groupId));
	}
	async loadSymUserGroupKey(requestedVersion) {
		let currentUserGroupKey = this.getCurrentSymUserGroupKey();
		if (currentUserGroupKey.version < requestedVersion) {
			await (await this.cacheManagementFacade()).refreshKeyCache(this.userFacade.getUserGroupId());
			currentUserGroupKey = this.getCurrentSymUserGroupKey();
		}
		return this.loadSymGroupKey(this.userFacade.getUserGroupId(), requestedVersion, currentUserGroupKey);
	}
	getCurrentSymUserGroupKey() {
		return this.userFacade.getCurrentUserGroupKey();
	}
	async loadKeypair(keyPairGroupId, requestedVersion) {
		let group = await this.entityClient.load(GroupTypeRef, keyPairGroupId);
		let currentGroupKey = await this.getCurrentSymGroupKey(keyPairGroupId);
		if (requestedVersion > currentGroupKey.version) {
			group = (await (await this.cacheManagementFacade()).refreshKeyCache(keyPairGroupId)).group;
			currentGroupKey = await this.getCurrentSymGroupKey(keyPairGroupId);
		}
		return await this.loadKeyPairImpl(group, requestedVersion, currentGroupKey);
	}
	async loadCurrentKeyPair(groupId) {
		let group = await this.entityClient.load(GroupTypeRef, groupId);
		let currentGroupKey = await this.getCurrentSymGroupKey(groupId);
		if (Number(group.groupKeyVersion) !== currentGroupKey.version) {
			group = (await (await this.cacheManagementFacade()).refreshKeyCache(groupId)).group;
			currentGroupKey = await this.getCurrentSymGroupKey(groupId);
			if (Number(group.groupKeyVersion) !== currentGroupKey.version) throw new Error(`inconsistent key version state in cache and key cache for group ${groupId}`);
		}
		return {
			object: this.validateAndDecryptKeyPair(group.currentKeys, groupId, currentGroupKey.object),
			version: Number(group.groupKeyVersion)
		};
	}
	async loadKeyPairImpl(group, requestedVersion, currentGroupKey) {
		const keyPairGroupId = group._id;
		let keyPair;
		let symGroupKey;
		if (requestedVersion > currentGroupKey.version) throw new Error(`Not possible to get newer key version than is cached for group ${keyPairGroupId}`);
else if (requestedVersion === currentGroupKey.version) {
			symGroupKey = currentGroupKey.object;
			if (Number(group.groupKeyVersion) === currentGroupKey.version) keyPair = group.currentKeys;
else {
				const formerKeysList = assertNotNull(group.formerGroupKeys).list;
				const formerGroupKey = await this.entityClient.load(GroupKeyTypeRef, [formerKeysList, stringToCustomId(String(currentGroupKey.version))]);
				keyPair = formerGroupKey.keyPair;
			}
		} else {
			const { symmetricGroupKey, groupKeyInstance } = await this.findFormerGroupKey(group, currentGroupKey, requestedVersion);
			keyPair = groupKeyInstance.keyPair;
			symGroupKey = symmetricGroupKey;
		}
		return this.validateAndDecryptKeyPair(keyPair, keyPairGroupId, symGroupKey);
	}
	/**
	*
	* @param groupId MUST NOT be the user group id!
	* @private
	*/
	async loadAndDecryptCurrentSymGroupKey(groupId) {
		if (isSameId(groupId, this.userFacade.getUserGroupId())) throw new ProgrammingError("Must not add the user group to the regular group key cache");
		const groupMembership = this.userFacade.getMembership(groupId);
		const requiredUserGroupKey = await this.loadSymUserGroupKey(Number(groupMembership.symKeyVersion));
		return {
			version: Number(groupMembership.groupKeyVersion),
			object: decryptKey(requiredUserGroupKey, groupMembership.symEncGKey)
		};
	}
	async findFormerGroupKey(group, currentGroupKey, targetKeyVersion) {
		const formerKeysList = assertNotNull(group.formerGroupKeys).list;
		const startId = stringToCustomId(String(currentGroupKey.version));
		const amountOfKeysIncludingTarget = currentGroupKey.version - targetKeyVersion;
		const formerKeys = await this.entityClient.loadRange(GroupKeyTypeRef, formerKeysList, startId, amountOfKeysIncludingTarget, true);
		let lastVersion = currentGroupKey.version;
		let lastGroupKey = currentGroupKey.object;
		let lastGroupKeyInstance = null;
		for (const formerKey of formerKeys) {
			const version = this.decodeGroupKeyVersion(getElementId(formerKey));
			if (version + 1 > lastVersion) continue;
else if (version + 1 === lastVersion) {
				lastGroupKey = decryptKey(lastGroupKey, formerKey.ownerEncGKey);
				lastVersion = version;
				lastGroupKeyInstance = formerKey;
				if (lastVersion <= targetKeyVersion) break;
			} else throw new Error(`unexpected version ${version}; expected ${lastVersion}`);
		}
		if (lastVersion !== targetKeyVersion || !lastGroupKeyInstance) throw new Error(`could not get version (last version is ${lastVersion} of ${formerKeys.length} key(s) loaded from list ${formerKeysList})`);
		return {
			symmetricGroupKey: lastGroupKey,
			groupKeyInstance: lastGroupKeyInstance
		};
	}
	decodeGroupKeyVersion(id) {
		return Number(customIdToString(id));
	}
	validateAndDecryptKeyPair(keyPair, groupId, groupKey) {
		if (keyPair == null) throw new NotFoundError(`no key pair on group ${groupId}`);
		return decryptKeyPair(groupKey, keyPair);
	}
};

//#endregion
//#region src/common/api/worker/facades/KeyRotationFacade.ts
assertWorkerOrNode();
var KeyRotationFacade = class {
	/**
	* @VisibleForTesting
	*/
	pendingKeyRotations;
	facadeInitializedDeferredObject;
	pendingGroupKeyUpdateIds;
	constructor(entityClient, keyLoaderFacade, pqFacade, serviceExecutor, cryptoWrapper, recoverCodeFacade, userFacade, cryptoFacade, shareFacade, groupManagementFacade, asymmetricCryptoFacade) {
		this.entityClient = entityClient;
		this.keyLoaderFacade = keyLoaderFacade;
		this.pqFacade = pqFacade;
		this.serviceExecutor = serviceExecutor;
		this.cryptoWrapper = cryptoWrapper;
		this.recoverCodeFacade = recoverCodeFacade;
		this.userFacade = userFacade;
		this.cryptoFacade = cryptoFacade;
		this.shareFacade = shareFacade;
		this.groupManagementFacade = groupManagementFacade;
		this.asymmetricCryptoFacade = asymmetricCryptoFacade;
		this.pendingKeyRotations = {
			pwKey: null,
			adminOrUserGroupKeyRotation: null,
			teamOrCustomerGroupKeyRotations: [],
			userAreaGroupsKeyRotations: []
		};
		this.facadeInitializedDeferredObject = defer();
		this.pendingGroupKeyUpdateIds = [];
	}
	/**
	* Initialize the facade with the data it needs to perform rotations later.
	* Needs to be called during login when the password key is still available.
	* @param pwKey the user's passphrase key. May or may not be kept in memory, depending on whether a UserGroup key rotation is scheduled.
	* @param modernKdfType true if argon2id. no admin or user key rotation should be executed if false.
	*/
	async initialize(pwKey, modernKdfType) {
		const result = await this.serviceExecutor.get(GroupKeyRotationInfoService, null);
		if (result.userOrAdminGroupKeyRotationScheduled && modernKdfType) this.pendingKeyRotations.pwKey = pwKey;
		this.pendingGroupKeyUpdateIds = result.groupKeyUpdates;
		this.facadeInitializedDeferredObject.resolve();
	}
	/**
	* Processes pending key rotations and performs follow-up tasks such as updating memberships for groups rotated by another user.
	* @param user
	*/
	async processPendingKeyRotationsAndUpdates(user) {
		try {
			try {
				await this.loadPendingKeyRotations(user);
				await this.processPendingKeyRotation(user);
			} finally {
				await this.updateGroupMemberships(this.pendingGroupKeyUpdateIds);
			}
		} catch (e) {
			if (e instanceof LockedError) console.log("error when processing key rotation or group key update", e);
else throw e;
		}
	}
	/**
	* Queries the server for pending key rotations for a given user and saves them and optionally the given password key (in case an admin or user group needs to be rotated).
	*
	* Note that this function currently makes 2 server requests to load the key rotation list and check if a key rotation is needed.
	* This routine should be optimized in the future by saving a flag on the user to determine whether a key rotation is required or not.
	* @VisibleForTesting
	*/
	async loadPendingKeyRotations(user) {
		const userGroupRoot = await this.entityClient.load(UserGroupRootTypeRef, user.userGroup.group);
		if (userGroupRoot.keyRotations != null) {
			const pendingKeyRotations = await this.entityClient.loadAll(KeyRotationTypeRef, userGroupRoot.keyRotations.list);
			const keyRotationsByType = groupBy(pendingKeyRotations, (keyRotation) => keyRotation.groupKeyRotationType);
			let adminOrUserGroupKeyRotationArray = [
				keyRotationsByType.get(GroupKeyRotationType.AdminGroupKeyRotationSingleUserAccount),
				keyRotationsByType.get(GroupKeyRotationType.AdminGroupKeyRotationMultipleUserAccount),
				keyRotationsByType.get(GroupKeyRotationType.AdminGroupKeyRotationMultipleAdminAccount),
				keyRotationsByType.get(GroupKeyRotationType.User)
			].flat().filter(isNotNull);
			let customerGroupKeyRotationArray = keyRotationsByType.get(GroupKeyRotationType.Customer) || [];
			const adminOrUserGroupKeyRotation = adminOrUserGroupKeyRotationArray[0];
			this.pendingKeyRotations = {
				pwKey: this.pendingKeyRotations.pwKey,
				adminOrUserGroupKeyRotation: adminOrUserGroupKeyRotation ? adminOrUserGroupKeyRotation : null,
				teamOrCustomerGroupKeyRotations: customerGroupKeyRotationArray.concat(keyRotationsByType.get(GroupKeyRotationType.Team) || []),
				userAreaGroupsKeyRotations: keyRotationsByType.get(GroupKeyRotationType.UserArea) || []
			};
		}
	}
	/**
	* Processes the internal list of @PendingKeyRotation. Key rotations and (if existent) password keys are deleted after processing.
	* @VisibleForTesting
	*/
	async processPendingKeyRotation(user) {
		await this.facadeInitializedDeferredObject.promise;
		try {
			if (this.pendingKeyRotations.adminOrUserGroupKeyRotation && this.pendingKeyRotations.pwKey) {
				const groupKeyRotationType = assertEnumValue(GroupKeyRotationType, this.pendingKeyRotations.adminOrUserGroupKeyRotation.groupKeyRotationType);
				switch (groupKeyRotationType) {
					case GroupKeyRotationType.AdminGroupKeyRotationMultipleAdminAccount:
						console.log("Rotating the admin group with multiple members is not yet implemented");
						break;
					case GroupKeyRotationType.AdminGroupKeyRotationSingleUserAccount:
					case GroupKeyRotationType.AdminGroupKeyRotationMultipleUserAccount:
						await this.rotateAdminGroupKeys(user, this.pendingKeyRotations.pwKey, this.pendingKeyRotations.adminOrUserGroupKeyRotation);
						break;
					case GroupKeyRotationType.User:
						await this.rotateUserGroupKey(user, this.pendingKeyRotations.pwKey, this.pendingKeyRotations.adminOrUserGroupKeyRotation);
						break;
				}
				this.pendingKeyRotations.adminOrUserGroupKeyRotation = null;
			}
		} finally {
			this.pendingKeyRotations.pwKey = null;
		}
		const serviceData = createGroupKeyRotationPostIn({ groupKeyUpdates: [] });
		if (!isEmpty(this.pendingKeyRotations.teamOrCustomerGroupKeyRotations)) {
			const groupKeyRotationData = await this.rotateCustomerOrTeamGroupKeys(user);
			if (groupKeyRotationData != null) serviceData.groupKeyUpdates = groupKeyRotationData;
			this.pendingKeyRotations.teamOrCustomerGroupKeyRotations = [];
		}
		let invitationData = [];
		if (!isEmpty(this.pendingKeyRotations.userAreaGroupsKeyRotations)) {
			const { groupKeyRotationData, preparedReInvites } = await this.rotateUserAreaGroupKeys(user);
			invitationData = preparedReInvites;
			if (groupKeyRotationData != null) serviceData.groupKeyUpdates = serviceData.groupKeyUpdates.concat(groupKeyRotationData);
			this.pendingKeyRotations.userAreaGroupsKeyRotations = [];
		}
		if (serviceData.groupKeyUpdates.length <= 0) return;
		await this.serviceExecutor.post(GroupKeyRotationService, serviceData);
		if (!isEmpty(invitationData)) {
			const shareFacade = await this.shareFacade();
			await pMap(invitationData, (preparedInvite) => shareFacade.sendGroupInvitationRequest(preparedInvite));
		}
	}
	/**
	* @VisibleForTesting
	*/
	async rotateAdminGroupKeys(user, passphraseKey, keyRotation) {
		if (hasNonQuantumSafeKeys(passphraseKey)) {
			console.log("Not allowed to rotate admin group keys with a bcrypt password key");
			return;
		}
		const currentUserGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey();
		const adminGroupMembership = getFirstOrThrow(getUserGroupMemberships(user, GroupType.Admin));
		const currentAdminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupMembership.group);
		const adminKeyRotationData = await this.prepareKeyRotationForAdminGroup(keyRotation, user, currentUserGroupKey, currentAdminGroupKey, passphraseKey);
		return this.serviceExecutor.post(AdminGroupKeyRotationService, adminKeyRotationData);
	}
	async rotateUserAreaGroupKeys(user) {
		const currentUserGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey();
		if (hasNonQuantumSafeKeys(currentUserGroupKey.object)) {
			console.log("Keys cannot be rotated as the encrypting keys are not pq secure");
			return {
				groupKeyRotationData: [],
				preparedReInvites: []
			};
		}
		const groupKeyUpdates = new Array();
		let preparedReInvites = [];
		for (const keyRotation of this.pendingKeyRotations.userAreaGroupsKeyRotations) {
			const { groupKeyRotationData, preparedReInvitations } = await this.prepareKeyRotationForAreaGroup(keyRotation, currentUserGroupKey, user);
			groupKeyUpdates.push(groupKeyRotationData);
			preparedReInvites = preparedReInvites.concat(preparedReInvitations);
		}
		return {
			groupKeyRotationData: groupKeyUpdates,
			preparedReInvites
		};
	}
	async rotateCustomerOrTeamGroupKeys(user) {
		const adminGroupMembership = user.memberships.find((m) => m.groupType === GroupKeyRotationType.AdminGroupKeyRotationSingleUserAccount);
		if (adminGroupMembership == null) {
			console.log("Only admin user can rotate the group");
			return;
		}
		const currentUserGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey();
		const currentAdminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupMembership.group);
		if (hasNonQuantumSafeKeys(currentUserGroupKey.object, currentAdminGroupKey.object)) {
			console.log("Keys cannot be rotated as the encrypting keys are not pq secure");
			return;
		}
		const groupKeyUpdates = new Array();
		for (const keyRotation of this.pendingKeyRotations.teamOrCustomerGroupKeyRotations) {
			const groupKeyRotationData = await this.prepareKeyRotationForCustomerOrTeamGroup(keyRotation, currentUserGroupKey, currentAdminGroupKey, user);
			groupKeyUpdates.push(groupKeyRotationData);
		}
		return groupKeyUpdates;
	}
	async prepareKeyRotationForAdminGroup(keyRotation, user, currentUserGroupKey, currentAdminGroupKey, passphraseKey) {
		const adminGroupId = this.getTargetGroupId(keyRotation);
		const userGroupMembership = user.userGroup;
		const userGroupId = userGroupMembership.group;
		console.log(`KeyRotationFacade: rotate key for group: ${adminGroupId}, groupKeyRotationType: ${keyRotation.groupKeyRotationType}`);
		const adminGroup = await this.entityClient.load(GroupTypeRef, adminGroupId);
		const userGroup = await this.entityClient.load(GroupTypeRef, userGroupId);
		const newAdminGroupKeys = await this.generateGroupKeys(adminGroup);
		const adminKeyPair = assertNotNull(newAdminGroupKeys.encryptedKeyPair);
		const pubEccKey = assertNotNull(adminKeyPair.pubEccKey);
		const pubKyberKey = assertNotNull(adminKeyPair.pubKyberKey);
		const adminGroupKeyAuthenticationDataList = await this.generateEncryptedKeyHashes(pubEccKey, pubKyberKey, newAdminGroupKeys.symGroupKey.version, adminGroupId, assertNotNull(user.customer), userGroupId);
		const newUserGroupKeys = await this.generateGroupKeys(userGroup);
		const encryptedAdminKeys = await this.encryptGroupKeys(adminGroup, currentAdminGroupKey, newAdminGroupKeys, newAdminGroupKeys.symGroupKey);
		const encryptedUserKeys = await this.encryptUserGroupKey(userGroup, currentUserGroupKey, newUserGroupKeys, passphraseKey, newAdminGroupKeys, user);
		const membershipEncNewGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(newUserGroupKeys.symGroupKey, newAdminGroupKeys.symGroupKey.object);
		const adminGroupKeyData = createGroupKeyRotationData({
			adminGroupEncGroupKey: assertNotNull(encryptedAdminKeys.adminGroupKeyEncNewGroupKey).key,
			adminGroupKeyVersion: String(assertNotNull(encryptedAdminKeys.adminGroupKeyEncNewGroupKey).encryptingKeyVersion),
			groupEncPreviousGroupKey: encryptedAdminKeys.newGroupKeyEncCurrentGroupKey.key,
			groupKeyVersion: String(newAdminGroupKeys.symGroupKey.version),
			group: adminGroup._id,
			keyPair: makeKeyPair(encryptedAdminKeys.keyPair),
			groupKeyUpdatesForMembers: [],
			groupMembershipUpdateData: [createGroupMembershipUpdateData({
				userId: user._id,
				userEncGroupKey: membershipEncNewGroupKey.key,
				userKeyVersion: String(membershipEncNewGroupKey.encryptingKeyVersion)
			})]
		});
		const userGroupKeyData = createUserGroupKeyRotationData({
			recoverCodeData: encryptedUserKeys.recoverCodeData,
			distributionKeyEncUserGroupKey: encryptedUserKeys.distributionKeyEncNewUserGroupKey,
			authVerifier: encryptedUserKeys.authVerifier,
			group: userGroup._id,
			userGroupEncPreviousGroupKey: encryptedUserKeys.newUserGroupKeyEncCurrentGroupKey.key,
			userGroupKeyVersion: String(newUserGroupKeys.symGroupKey.version),
			keyPair: encryptedUserKeys.keyPair,
			adminGroupEncUserGroupKey: encryptedUserKeys.newAdminGroupKeyEncNewUserGroupKey.key,
			adminGroupKeyVersion: String(encryptedUserKeys.newAdminGroupKeyEncNewUserGroupKey.encryptingKeyVersion),
			passphraseEncUserGroupKey: encryptedUserKeys.passphraseKeyEncNewUserGroupKey.key,
			pubAdminGroupEncUserGroupKey: null
		});
		return createAdminGroupKeyRotationPostIn({
			adminGroupKeyData,
			userGroupKeyData,
			adminGroupKeyAuthenticationDataList
		});
	}
	async generateEncryptedKeyHashes(pubEccKey, pubKyberKey, adminGroupKeyVersion, adminGroupId, customerId, groupToExclude) {
		const keyHash = this.generateKeyHash(adminGroupKeyVersion, adminGroupId, pubEccKey, pubKyberKey);
		const keyHashes = [];
		const customer = await this.entityClient.load(CustomerTypeRef, customerId);
		const userGroupInfos = await this.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups);
		for (const userGroupInfo of userGroupInfos) {
			if (isSameId(userGroupInfo.group, groupToExclude)) continue;
			let gmf = await this.groupManagementFacade();
			const userGroupKey = await gmf.getCurrentGroupKeyViaAdminEncGKey(userGroupInfo.group);
			const authKey = this.deriveRotationHashKey(userGroupInfo.group, userGroupKey);
			const encryptedKeyHash = this.cryptoWrapper.aesEncrypt(authKey, keyHash);
			const publicKeyHash = createAdminGroupKeyAuthenticationData({
				userGroup: userGroupInfo.group,
				authKeyEncAdminRotationHash: encryptedKeyHash,
				version: String(adminGroupKeyVersion)
			});
			keyHashes.push(publicKeyHash);
		}
		return keyHashes;
	}
	deriveRotationHashKey(userGroupId, userGroupKey) {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: userGroupId,
			key: userGroupKey.object,
			context: "adminGroupKeyRotationHash"
		});
	}
	generateKeyHash(adminGroupKeyVersion, adminGroupId, pubEccKey, pubKyberKey) {
		const versionByte = Uint8Array.from([0]);
		const adminKeyVersion = Uint8Array.from([adminGroupKeyVersion]);
		const identifierType = Uint8Array.from([Number(PublicKeyIdentifierType.GROUP_ID)]);
		const identifier = customIdToUint8array(adminGroupId);
		const hashData = concat(versionByte, pubEccKey, pubKyberKey, adminKeyVersion, identifier, identifierType);
		return this.cryptoWrapper.sha256Hash(hashData);
	}
	async prepareKeyRotationForAreaGroup(keyRotation, currentUserGroupKey, user) {
		const targetGroupId = this.getTargetGroupId(keyRotation);
		console.log(`KeyRotationFacade: rotate key for group: ${targetGroupId}, groupKeyRotationType: ${keyRotation.groupKeyRotationType}`);
		const targetGroup = await this.entityClient.load(GroupTypeRef, targetGroupId);
		const currentGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(targetGroupId);
		const newGroupKeys = await this.generateGroupKeys(targetGroup);
		const groupEncPreviousGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(newGroupKeys.symGroupKey, currentGroupKey.object);
		const membershipSymEncNewGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(currentUserGroupKey, newGroupKeys.symGroupKey.object);
		const preparedReInvitations = await this.handlePendingInvitations(targetGroup, newGroupKeys.symGroupKey);
		const groupKeyUpdatesForMembers = await this.createGroupKeyUpdatesForMembers(targetGroup, newGroupKeys.symGroupKey);
		const groupKeyRotationData = createGroupKeyRotationData({
			adminGroupEncGroupKey: null,
			adminGroupKeyVersion: null,
			group: targetGroupId,
			groupKeyVersion: String(newGroupKeys.symGroupKey.version),
			groupEncPreviousGroupKey: groupEncPreviousGroupKey.key,
			keyPair: makeKeyPair(newGroupKeys.encryptedKeyPair),
			groupKeyUpdatesForMembers,
			groupMembershipUpdateData: [createGroupMembershipUpdateData({
				userId: user._id,
				userEncGroupKey: membershipSymEncNewGroupKey.key,
				userKeyVersion: String(currentUserGroupKey.version)
			})]
		});
		return {
			groupKeyRotationData,
			preparedReInvitations
		};
	}
	async prepareKeyRotationForCustomerOrTeamGroup(keyRotation, currentUserGroupKey, currentAdminGroupKey, user) {
		const targetGroupId = this.getTargetGroupId(keyRotation);
		console.log(`KeyRotationFacade: rotate key for group: ${targetGroupId}, groupKeyRotationType: ${keyRotation.groupKeyRotationType}`);
		const targetGroup = await this.entityClient.load(GroupTypeRef, targetGroupId);
		const members = await this.entityClient.loadAll(GroupMemberTypeRef, targetGroup.members);
		const ownMember = members.find((member) => member.user == user._id);
		const otherMembers = members.filter((member) => member.user != user._id);
		let currentGroupKey = await this.getCurrentGroupKey(targetGroupId, targetGroup);
		const newGroupKeys = await this.generateGroupKeys(targetGroup);
		const encryptedGroupKeys = await this.encryptGroupKeys(targetGroup, currentGroupKey, newGroupKeys, currentAdminGroupKey);
		const groupMembershipUpdateData = new Array();
		if (ownMember) {
			const membershipSymEncNewGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(currentUserGroupKey, newGroupKeys.symGroupKey.object);
			groupMembershipUpdateData.push(createGroupMembershipUpdateData({
				userId: user._id,
				userEncGroupKey: membershipSymEncNewGroupKey.key,
				userKeyVersion: String(currentUserGroupKey.version)
			}));
		}
		for (const member of otherMembers) {
			const userEncNewGroupKey = await this.encryptGroupKeyForOtherUsers(member.user, newGroupKeys.symGroupKey);
			let groupMembershipUpdate = createGroupMembershipUpdateData({
				userId: member.user,
				userEncGroupKey: userEncNewGroupKey.key,
				userKeyVersion: String(userEncNewGroupKey.encryptingKeyVersion)
			});
			groupMembershipUpdateData.push(groupMembershipUpdate);
		}
		return createGroupKeyRotationData({
			adminGroupEncGroupKey: encryptedGroupKeys.adminGroupKeyEncNewGroupKey ? encryptedGroupKeys.adminGroupKeyEncNewGroupKey.key : null,
			adminGroupKeyVersion: encryptedGroupKeys.adminGroupKeyEncNewGroupKey ? String(encryptedGroupKeys.adminGroupKeyEncNewGroupKey.encryptingKeyVersion) : null,
			group: targetGroupId,
			groupKeyVersion: String(newGroupKeys.symGroupKey.version),
			groupEncPreviousGroupKey: encryptedGroupKeys.newGroupKeyEncCurrentGroupKey.key,
			keyPair: makeKeyPair(encryptedGroupKeys.keyPair),
			groupKeyUpdatesForMembers: [],
			groupMembershipUpdateData
		});
	}
	async getCurrentGroupKey(targetGroupId, targetGroup) {
		try {
			return await this.keyLoaderFacade.getCurrentSymGroupKey(targetGroupId);
		} catch (e) {
			const groupManagementFacade = await this.groupManagementFacade();
			const currentKey = await groupManagementFacade.getGroupKeyViaAdminEncGKey(targetGroupId, Number(targetGroup.groupKeyVersion));
			return {
				object: currentKey,
				version: Number(targetGroup.groupKeyVersion)
			};
		}
	}
	async encryptUserGroupKey(userGroup, currentUserGroupKey, newUserGroupKeys, passphraseKey, newAdminGroupKeys, user) {
		const { membershipSymEncNewGroupKey, distributionKeyEncNewUserGroupKey, authVerifier } = this.encryptUserGroupKeyForUser(passphraseKey, newUserGroupKeys, userGroup, currentUserGroupKey);
		const encryptedUserKeys = await this.encryptGroupKeys(userGroup, currentUserGroupKey, newUserGroupKeys, newAdminGroupKeys.symGroupKey);
		const recoverCodeData = await this.reencryptRecoverCodeIfExists(user, passphraseKey, newUserGroupKeys);
		return {
			newUserGroupKeyEncCurrentGroupKey: encryptedUserKeys.newGroupKeyEncCurrentGroupKey,
			newAdminGroupKeyEncNewUserGroupKey: assertNotNull(encryptedUserKeys.adminGroupKeyEncNewGroupKey),
			keyPair: assertNotNull(makeKeyPair(encryptedUserKeys.keyPair)),
			passphraseKeyEncNewUserGroupKey: membershipSymEncNewGroupKey,
			recoverCodeData,
			distributionKeyEncNewUserGroupKey,
			authVerifier
		};
	}
	async reencryptRecoverCodeIfExists(user, passphraseKey, newUserGroupKeys) {
		let recoverCodeData = null;
		if (user.auth?.recoverCode != null) {
			const recoverCodeFacade = await this.recoverCodeFacade();
			const recoverCode = await recoverCodeFacade.getRawRecoverCode(passphraseKey);
			const recoverData = recoverCodeFacade.encryptRecoveryCode(recoverCode, newUserGroupKeys.symGroupKey);
			recoverCodeData = createRecoverCodeData({
				recoveryCodeVerifier: recoverData.recoveryCodeVerifier,
				userEncRecoveryCode: recoverData.userEncRecoverCode,
				userKeyVersion: String(recoverData.userKeyVersion),
				recoveryCodeEncUserGroupKey: recoverData.recoverCodeEncUserGroupKey
			});
		}
		return recoverCodeData;
	}
	encryptUserGroupKeyForUser(passphraseKey, newUserGroupKeys, userGroup, currentGroupKey) {
		const versionedPassphraseKey = {
			object: passphraseKey,
			version: 0
		};
		const membershipSymEncNewGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(versionedPassphraseKey, newUserGroupKeys.symGroupKey.object);
		const userGroupKeyDistributionKey = this.userFacade.deriveUserGroupKeyDistributionKey(userGroup._id, passphraseKey);
		const distributionKeyEncNewUserGroupKey = this.cryptoWrapper.encryptKey(userGroupKeyDistributionKey, newUserGroupKeys.symGroupKey.object);
		const authVerifier = createAuthVerifier(passphraseKey);
		const newGroupKeyEncCurrentGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(newUserGroupKeys.symGroupKey, currentGroupKey.object);
		return {
			membershipSymEncNewGroupKey,
			distributionKeyEncNewUserGroupKey,
			authVerifier,
			newGroupKeyEncCurrentGroupKey
		};
	}
	async handlePendingInvitations(targetGroup, newTargetGroupKey) {
		const preparedReInvitations = [];
		const targetGroupInfo = await this.entityClient.load(GroupInfoTypeRef, targetGroup.groupInfo);
		const pendingInvitations = await this.entityClient.loadAll(SentGroupInvitationTypeRef, targetGroup.invitations);
		const sentInvitationsByCapability = groupBy(pendingInvitations, (invitation) => invitation.capability);
		const shareFacade = await this.shareFacade();
		for (const [capability, sentInvitations] of sentInvitationsByCapability) {
			const inviteeMailAddresses = sentInvitations.map((invite) => invite.inviteeMailAddress);
			const prepareGroupReInvites = async (mailAddresses) => {
				const preparedInvitation = await shareFacade.prepareGroupInvitation(newTargetGroupKey, targetGroupInfo, mailAddresses, downcast(capability));
				preparedReInvitations.push(preparedInvitation);
			};
			try {
				await prepareGroupReInvites(inviteeMailAddresses);
			} catch (e) {
				if (e instanceof RecipientsNotFoundError) {
					const notFoundRecipients = e.message.split("\n");
					const reducedInviteeAddresses = inviteeMailAddresses.filter((address) => !notFoundRecipients.includes(address));
					if (reducedInviteeAddresses.length) await prepareGroupReInvites(reducedInviteeAddresses);
				} else throw e;
			}
		}
		return preparedReInvitations;
	}
	async createGroupKeyUpdatesForMembers(group, newGroupKey) {
		const members = await this.entityClient.loadAll(GroupMemberTypeRef, group.members);
		const otherMembers = members.filter((member) => member.user != this.userFacade.getUser()?._id);
		return await this.tryCreatingGroupKeyUpdatesForMembers(group._id, otherMembers, newGroupKey);
	}
	async tryCreatingGroupKeyUpdatesForMembers(groupId, otherMembers, newGroupKey) {
		const groupKeyUpdates = new Array();
		const groupedMembers = groupBy(otherMembers, (member) => listIdPart(member.userGroupInfo));
		const membersToRemove = new Array();
		for (const [listId, members] of groupedMembers) {
			const userGroupInfos = await this.entityClient.loadMultiple(GroupInfoTypeRef, listId, members.map((member) => elementIdPart(member.userGroupInfo)));
			for (const member of members) {
				const userGroupInfoForMember = userGroupInfos.find((ugi) => isSameId(ugi._id, member.userGroupInfo));
				const memberMailAddress = assertNotNull(userGroupInfoForMember?.mailAddress);
				const bucketKey = this.cryptoWrapper.aes256RandomKey();
				const sessionKey = this.cryptoWrapper.aes256RandomKey();
				const notFoundRecipients = [];
				const recipientKeyData = await this.cryptoFacade.encryptBucketKeyForInternalRecipient(this.userFacade.getUserGroupId(), bucketKey, memberMailAddress, notFoundRecipients);
				if (recipientKeyData != null && isSameTypeRef(recipientKeyData._type, InternalRecipientKeyDataTypeRef)) {
					const keyData = recipientKeyData;
					const pubEncKeyData = createPubEncKeyData({
						recipientIdentifier: keyData.mailAddress,
						recipientIdentifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
						pubEncSymKey: keyData.pubEncBucketKey,
						recipientKeyVersion: keyData.recipientKeyVersion,
						senderKeyVersion: keyData.senderKeyVersion,
						protocolVersion: keyData.protocolVersion
					});
					const groupKeyUpdateData = createGroupKeyUpdateData({
						sessionKeyEncGroupKey: this.cryptoWrapper.encryptBytes(sessionKey, bitArrayToUint8Array(newGroupKey.object)),
						sessionKeyEncGroupKeyVersion: String(newGroupKey.version),
						bucketKeyEncSessionKey: this.cryptoWrapper.encryptKey(bucketKey, sessionKey),
						pubEncBucketKeyData: pubEncKeyData
					});
					groupKeyUpdates.push(groupKeyUpdateData);
				} else membersToRemove.push(member);
			}
		}
		const groupManagementFacade = await this.groupManagementFacade();
		if (membersToRemove.length !== 0) {
			for (const member of membersToRemove) await groupManagementFacade.removeUserFromGroup(member.user, groupId);
			const reducedMembers = otherMembers.filter((member) => !membersToRemove.includes(member));
			return this.tryCreatingGroupKeyUpdatesForMembers(groupId, reducedMembers, newGroupKey);
		} else return groupKeyUpdates;
	}
	/**
	* Get the ID of the group we want to rotate the keys for.
	*/
	getTargetGroupId(keyRotation) {
		return elementIdPart(keyRotation._id);
	}
	async encryptGroupKeys(group, currentGroupKey, newKeys, adminGroupKeys) {
		const newGroupKeyEncCurrentGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(newKeys.symGroupKey, currentGroupKey.object);
		const adminGroupKeyEncNewGroupKey = (await this.groupManagementFacade()).hasAdminEncGKey(group) ? this.cryptoWrapper.encryptKeyWithVersionedKey(adminGroupKeys, newKeys.symGroupKey.object) : null;
		return {
			newGroupKeyEncCurrentGroupKey,
			keyPair: newKeys.encryptedKeyPair,
			adminGroupKeyEncNewGroupKey
		};
	}
	async encryptGroupKeyForOtherUsers(userId, newGroupKey) {
		const groupManagementFacade = await this.groupManagementFacade();
		const user = await this.entityClient.load(UserTypeRef, userId);
		const userGroupKey = await groupManagementFacade.getGroupKeyViaAdminEncGKey(user.userGroup.group, Number(user.userGroup.groupKeyVersion));
		const encrypteNewGroupKey = this.cryptoWrapper.encryptKey(userGroupKey, newGroupKey.object);
		return {
			key: encrypteNewGroupKey,
			encryptingKeyVersion: Number(user.userGroup.groupKeyVersion)
		};
	}
	async generateGroupKeys(group) {
		const symGroupKeyBytes = this.cryptoWrapper.aes256RandomKey();
		const keyPair = await this.createNewKeyPairValue(group, symGroupKeyBytes);
		return {
			symGroupKey: {
				object: symGroupKeyBytes,
				version: Number(group.groupKeyVersion) + 1
			},
			encryptedKeyPair: keyPair
		};
	}
	/**
	* Not all groups have key pairs, but if they do we need to rotate them as well.
	*/
	async createNewKeyPairValue(groupToRotate, newSymmetricGroupKey) {
		if (groupToRotate.currentKeys) {
			const newPqPairs = await this.pqFacade.generateKeyPairs();
			return {
				pubRsaKey: null,
				symEncPrivRsaKey: null,
				pubEccKey: newPqPairs.eccKeyPair.publicKey,
				symEncPrivEccKey: this.cryptoWrapper.encryptEccKey(newSymmetricGroupKey, newPqPairs.eccKeyPair.privateKey),
				pubKyberKey: this.cryptoWrapper.kyberPublicKeyToBytes(newPqPairs.kyberKeyPair.publicKey),
				symEncPrivKyberKey: this.cryptoWrapper.encryptKyberKey(newSymmetricGroupKey, newPqPairs.kyberKeyPair.privateKey)
			};
		} else return null;
	}
	/**
	* @VisibleForTesting
	* @private
	*/
	setPendingKeyRotations(pendingKeyRotations) {
		this.pendingKeyRotations = pendingKeyRotations;
		this.facadeInitializedDeferredObject.resolve();
	}
	async reset() {
		await this.facadeInitializedDeferredObject.promise;
		this.pendingKeyRotations = {
			pwKey: null,
			adminOrUserGroupKeyRotation: null,
			teamOrCustomerGroupKeyRotations: [],
			userAreaGroupsKeyRotations: []
		};
	}
	/**
	*
	* @param groupKeyUpdateIds MUST be in the same list
	*/
	async updateGroupMemberships(groupKeyUpdateIds) {
		if (groupKeyUpdateIds.length < 1) return;
		console.log("handling group key update for groups: ", groupKeyUpdateIds);
		const groupKeyUpdateInstances = await this.entityClient.loadMultiple(GroupKeyUpdateTypeRef, listIdPart(groupKeyUpdateIds[0]), groupKeyUpdateIds.map((id) => elementIdPart(id)));
		const groupKeyUpdates = groupKeyUpdateInstances.map((update) => this.prepareGroupMembershipUpdate(update));
		const membershipPutIn = createMembershipPutIn({ groupKeyUpdates });
		return this.serviceExecutor.put(MembershipService, membershipPutIn);
	}
	prepareGroupMembershipUpdate(groupKeyUpdate) {
		const userGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey();
		const symEncGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, uint8ArrayToKey(groupKeyUpdate.groupKey));
		return createGroupMembershipKeyData({
			group: elementIdPart(groupKeyUpdate._id),
			symEncGKey: symEncGroupKey.key,
			groupKeyVersion: groupKeyUpdate.groupKeyVersion,
			symKeyVersion: String(userGroupKey.version)
		});
	}
	/**
	* This function is responsible for upgrading the encryption keys of any user according to a GroupKeyRotation object
	* Before rotating the keys the user will check that the admin hash created by the admin and encrypted with this user
	* group key matches the hash generated by the user for this rotation.
	*
	* @param user
	* @param pwKey
	* @param userGroupKeyRotation
	* @private
	*/
	async rotateUserGroupKey(user, pwKey, userGroupKeyRotation) {
		const userGroupMembership = user.userGroup;
		const userGroupId = userGroupMembership.group;
		const currentUserGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey();
		console.log(`KeyRotationFacade: rotate key for group: ${userGroupId}, groupKeyRotationType: ${userGroupKeyRotation.groupKeyRotationType}`);
		if (userGroupKeyRotation.adminGroupKeyAuthenticationData == null) throw new Error("The hash encrypted by admin is not present in the user group key rotation !");
		const { version: adminGroupKeyVersion, authKeyEncAdminRotationHash } = userGroupKeyRotation.adminGroupKeyAuthenticationData;
		const authKey = this.deriveRotationHashKey(userGroupId, currentUserGroupKey);
		const decryptedAdminHash = this.cryptoWrapper.aesDecrypt(authKey, authKeyEncAdminRotationHash, true);
		const userGroup = await this.entityClient.load(GroupTypeRef, userGroupId);
		const adminGroupId = assertNotNull(userGroup.admin);
		const adminPublicKeyGetIn = createPublicKeyGetIn({
			identifier: adminGroupId,
			identifierType: PublicKeyIdentifierType.GROUP_ID,
			version: null
		});
		const adminPublicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, adminPublicKeyGetIn);
		const { pubEccKey, pubKyberKey } = adminPublicKeyGetOut;
		if (pubEccKey == null) throw new Error("tried to generate a keyhash when rotating but received an empty public ecc key!");
		if (pubKyberKey == null) throw new Error("tried to generate a keyhash when rotating but received an empty public kyber key!");
		const clientGeneratedKeyHash = this.generateKeyHash(Number(adminGroupKeyVersion), adminGroupId, pubEccKey, pubKyberKey);
		if (!arrayEquals(decryptedAdminHash, clientGeneratedKeyHash)) throw new Error("mismatch between client generated hash and encrypted admin hash, aborting rotation");
		const newUserGroupKeys = await this.generateGroupKeys(userGroup);
		const { membershipSymEncNewGroupKey, distributionKeyEncNewUserGroupKey, authVerifier, newGroupKeyEncCurrentGroupKey } = this.encryptUserGroupKeyForUser(pwKey, newUserGroupKeys, userGroup, currentUserGroupKey);
		const recoverCodeData = await this.reencryptRecoverCodeIfExists(user, pwKey, newUserGroupKeys);
		const pubAdminGroupEncUserGroupKey = await this.encryptUserGroupKeyForAdmin(newUserGroupKeys, adminPublicKeyGetOut, adminGroupId);
		const userGroupKeyData = createUserGroupKeyRotationData({
			userGroupKeyVersion: String(newUserGroupKeys.symGroupKey.version),
			userGroupEncPreviousGroupKey: newGroupKeyEncCurrentGroupKey.key,
			passphraseEncUserGroupKey: membershipSymEncNewGroupKey.key,
			group: userGroupId,
			distributionKeyEncUserGroupKey: distributionKeyEncNewUserGroupKey,
			keyPair: assertNotNull(makeKeyPair(newUserGroupKeys.encryptedKeyPair)),
			authVerifier,
			adminGroupKeyVersion: pubAdminGroupEncUserGroupKey.recipientKeyVersion,
			pubAdminGroupEncUserGroupKey,
			adminGroupEncUserGroupKey: null,
			recoverCodeData
		});
		await this.serviceExecutor.post(UserGroupKeyRotationService, createUserGroupKeyRotationPostIn({ userGroupKeyData }));
	}
	async encryptUserGroupKeyForAdmin(newUserGroupKeys, publicKeyGetOut, adminGroupId) {
		const adminPubKeys = {
			version: Number(publicKeyGetOut.pubKeyVersion),
			object: {
				pubEccKey: publicKeyGetOut.pubEccKey,
				pubKyberKey: publicKeyGetOut.pubKyberKey,
				pubRsaKey: null
			}
		};
		const pqKeyPair = this.cryptoWrapper.decryptKeyPair(newUserGroupKeys.symGroupKey.object, assertNotNull(newUserGroupKeys.encryptedKeyPair));
		const pubEncSymKey = await this.asymmetricCryptoFacade.tutaCryptEncryptSymKey(newUserGroupKeys.symGroupKey.object, adminPubKeys, {
			version: newUserGroupKeys.symGroupKey.version,
			object: pqKeyPair.eccKeyPair
		});
		return createPubEncKeyData({
			recipientIdentifier: adminGroupId,
			recipientIdentifierType: PublicKeyIdentifierType.GROUP_ID,
			pubEncSymKey: pubEncSymKey.pubEncSymKeyBytes,
			protocolVersion: pubEncSymKey.cryptoProtocolVersion,
			senderKeyVersion: pubEncSymKey.senderKeyVersion != null ? pubEncSymKey.senderKeyVersion.toString() : null,
			recipientKeyVersion: pubEncSymKey.recipientKeyVersion.toString()
		});
	}
};
/**
* We require AES keys to be 256-bit long to be quantum-safe because of Grover's algorithm.
*/
function isQuantumSafe(key) {
	return getKeyLengthBytes(key) === KEY_LENGTH_BYTES_AES_256;
}
function hasNonQuantumSafeKeys(...keys) {
	return keys.some((key) => !isQuantumSafe(key));
}
function makeKeyPair(keyPair) {
	return keyPair != null ? createKeyPair(keyPair) : null;
}

//#endregion
//#region src/common/api/worker/facades/KeyCache.ts
var KeyCache = class {
	currentGroupKeys = new Map();
	currentUserGroupKey = null;
	userGroupKeyDistributionKey = null;
	setCurrentUserGroupKey(newUserGroupKey) {
		if (this.currentUserGroupKey != null && this.currentUserGroupKey.version > newUserGroupKey.version) {
			console.log("Tried to set an outdated user group key");
			return;
		}
		this.currentUserGroupKey = newUserGroupKey;
	}
	getCurrentUserGroupKey() {
		return this.currentUserGroupKey;
	}
	setUserGroupKeyDistributionKey(userGroupKeyDistributionKey) {
		this.userGroupKeyDistributionKey = userGroupKeyDistributionKey;
	}
	getUserGroupKeyDistributionKey() {
		return this.userGroupKeyDistributionKey;
	}
	/**
	*
	* @param groupId MUST NOT be the user group id
	* @param keyLoader a function to load and decrypt the group key if it is not cached
	*/
	getCurrentGroupKey(groupId, keyLoader) {
		return getFromMap(this.currentGroupKeys, groupId, async () => {
			return keyLoader();
		});
	}
	reset() {
		this.currentGroupKeys = new Map();
		this.currentUserGroupKey = null;
		this.userGroupKeyDistributionKey = null;
	}
	/**
	* Clears keys from the cache which are outdated or where we do no longer hava a membership.
	* An outdated user membership is ignored and should be processed by the UserGroupKeyDistribution update.
	* @param user updated user with up-to-date memberships
	*/
	async removeOutdatedGroupKeys(user) {
		const currentUserGroupKeyVersion = neverNull(this.getCurrentUserGroupKey()).version;
		const receivedUserGroupKeyVersion = Number(user.userGroup.groupKeyVersion);
		if (receivedUserGroupKeyVersion > currentUserGroupKeyVersion) console.log(`Received user update with new user group key version: ${currentUserGroupKeyVersion} -> ${receivedUserGroupKeyVersion}`);
		const newCurrentGroupKeyCache = new Map();
		for (const membership of user.memberships) {
			const cachedGroupKey = this.currentGroupKeys.get(membership.group);
			if (cachedGroupKey != null && Number(membership.groupKeyVersion) === (await cachedGroupKey).version) await getFromMap(newCurrentGroupKeyCache, membership.group, () => cachedGroupKey);
		}
		this.currentGroupKeys = newCurrentGroupKeyCache;
	}
};

//#endregion
//#region src/mail-app/workerUtils/offline/MailOfflineCleaner.ts
var MailOfflineCleaner = class {
	async cleanOfflineDb(offlineStorage, timeRangeDays, userId, now) {
		const user = await offlineStorage.get(UserTypeRef, null, userId);
		const isFreeUser = user?.accountType === AccountType.FREE;
		const timeRange = isFreeUser || timeRangeDays == null ? OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS : timeRangeDays;
		const daysSinceDayAfterEpoch = now / DAY_IN_MILLIS - 1;
		const timeRangeMillisSafe = Math.min(daysSinceDayAfterEpoch, timeRange) * DAY_IN_MILLIS;
		const cutoffTimestamp = now - timeRangeMillisSafe;
		const mailBoxes = await offlineStorage.getElementsOfType(MailBoxTypeRef);
		const cutoffId = timestampToGeneratedId(cutoffTimestamp);
		for (const mailBox of mailBoxes) {
			const isMailsetMigrated = mailBox.currentMailBag != null;
			const folders = await offlineStorage.getWholeList(MailFolderTypeRef, mailBox.folders.folders);
			if (isMailsetMigrated) {
				const folderSystem = new FolderSystem(folders);
				for (const mailSet of folders) if (isSpamOrTrashFolder(folderSystem, mailSet)) await this.deleteMailSetEntries(offlineStorage, mailSet.entries, DEFAULT_MAILSET_ENTRY_CUSTOM_CUTOFF_TIMESTAMP);
else await this.deleteMailSetEntries(offlineStorage, mailSet.entries, cutoffTimestamp);
				const mailListIds = [mailBox.currentMailBag, ...mailBox.archivedMailBags].map((mailbag) => mailbag.mails);
				for (const mailListId of mailListIds) await this.deleteMailListLegacy(offlineStorage, mailListId, cutoffId);
			} else {
				const folderSystem = new FolderSystem(folders);
				for (const folder of folders) if (isSpamOrTrashFolder(folderSystem, folder)) await this.deleteMailListLegacy(offlineStorage, folder.mails, GENERATED_MAX_ID);
else await this.deleteMailListLegacy(offlineStorage, folder.mails, cutoffId);
			}
		}
	}
	/**
	* This method deletes mails from {@param listId} what are older than {@param cutoffId} as well as associated data.
	*
	* it's considered legacy because once we start importing mail into mail bags, maintaining mail list ranges doesn't make
	* sense anymore - mail order in a list is arbitrary at that point.
	*
	* For each mail we delete the mail, its body, headers, all references mail set entries and all referenced attachments.
	*
	* When we delete the Files, we also delete the whole range for the user's File list. We need to delete the whole
	* range because we only have one file list per mailbox, so if we delete something from the middle of it, the range
	* will no longer be valid. (this is future proofing, because as of now there is not going to be a Range set for the
	* File list anyway, since we currently do not do range requests for Files.
	*
	* 	We do not delete ConversationEntries because:
	* 	1. They are in the same list for the whole conversation so we can't adjust the range
	* 	2. We might need them in the future for showing the whole thread
	*/
	async deleteMailListLegacy(offlineStorage, listId, cutoffId) {
		await offlineStorage.lockRangesDbAccess(listId);
		try {
			await offlineStorage.updateRangeForListAndDeleteObsoleteData(MailTypeRef, listId, cutoffId);
		} finally {
			await offlineStorage.unlockRangesDbAccess(listId);
		}
		const mailsToDelete = [];
		const attachmentsToDelete = [];
		const mailDetailsBlobToDelete = [];
		const mailDetailsDraftToDelete = [];
		const mails = await offlineStorage.getWholeList(MailTypeRef, listId);
		for (let mail of mails) if (firstBiggerThanSecond(cutoffId, getElementId(mail))) {
			mailsToDelete.push(mail._id);
			for (const id of mail.attachments) attachmentsToDelete.push(id);
			if (isDraft(mail)) {
				const mailDetailsId = assertNotNull(mail.mailDetailsDraft);
				mailDetailsDraftToDelete.push(mailDetailsId);
			} else {
				const mailDetailsId = assertNotNull(mail.mailDetails);
				mailDetailsBlobToDelete.push(mailDetailsId);
			}
		}
		for (let [listId$1, elementIds] of groupByAndMap(mailDetailsBlobToDelete, listIdPart, elementIdPart).entries()) await offlineStorage.deleteIn(MailDetailsBlobTypeRef, listId$1, elementIds);
		for (let [listId$1, elementIds] of groupByAndMap(mailDetailsDraftToDelete, listIdPart, elementIdPart).entries()) await offlineStorage.deleteIn(MailDetailsDraftTypeRef, listId$1, elementIds);
		for (let [listId$1, elementIds] of groupByAndMap(attachmentsToDelete, listIdPart, elementIdPart).entries()) {
			await offlineStorage.deleteIn(FileTypeRef, listId$1, elementIds);
			await offlineStorage.deleteRange(FileTypeRef, listId$1);
		}
		await offlineStorage.deleteIn(MailTypeRef, listId, mailsToDelete.map(elementIdPart));
	}
	/**
	* delete all mail set entries of a mail set that reference some mail with a receivedDate older than
	* cutoffTimestamp. this doesn't clean up mails or their associated data because we could be breaking the
	* offline list range invariant by deleting data from the middle of a mail range. cleaning up mails is done
	* the legacy way currently even for mailset users.
	*/
	async deleteMailSetEntries(offlineStorage, entriesListId, cutoffTimestamp) {
		const cutoffId = constructMailSetEntryId(new Date(cutoffTimestamp), GENERATED_MAX_ID);
		await offlineStorage.lockRangesDbAccess(entriesListId);
		try {
			await offlineStorage.updateRangeForListAndDeleteObsoleteData(MailSetEntryTypeRef, entriesListId, cutoffId);
		} finally {
			await offlineStorage.unlockRangesDbAccess(entriesListId);
		}
		const mailSetEntriesToDelete = [];
		const mailSetEntries = await offlineStorage.getWholeList(MailSetEntryTypeRef, entriesListId);
		for (let mailSetEntry of mailSetEntries) if (firstBiggerThanSecond(cutoffId, getElementId(mailSetEntry))) mailSetEntriesToDelete.push(mailSetEntry._id);
		await offlineStorage.deleteIn(MailSetEntryTypeRef, entriesListId, mailSetEntriesToDelete.map(elementIdPart));
	}
};

//#endregion
//#region src/common/api/worker/DateProvider.ts
var LocalTimeDateProvider = class {
	getStartOfDayShiftedBy(shiftByDays) {
		return getStartOfDay(getDayShifted(new Date(), shiftByDays));
	}
};

//#endregion
//#region src/mail-app/workerUtils/worker/WorkerLocator.ts
assertWorkerOrNode();
const locator = {};
async function initLocator(worker, browserData) {
	locator._worker = worker;
	locator._browserData = browserData;
	locator.keyCache = new KeyCache();
	locator.cryptoWrapper = new CryptoWrapper();
	locator.user = new UserFacade(locator.keyCache, locator.cryptoWrapper);
	locator.workerFacade = new WorkerFacade();
	const dateProvider = new NoZoneDateProvider();
	const mainInterface = worker.getMainInterface();
	const suspensionHandler = new SuspensionHandler(mainInterface.infoMessageHandler, self);
	locator.instanceMapper = new InstanceMapper();
	locator.rsa = await createRsaImplementation(worker);
	const domainConfig = new DomainConfigProvider().getCurrentDomainConfig();
	locator.restClient = new RestClient(suspensionHandler, domainConfig);
	locator.serviceExecutor = new ServiceExecutor(locator.restClient, locator.user, locator.instanceMapper, () => locator.crypto);
	locator.entropyFacade = new EntropyFacade(locator.user, locator.serviceExecutor, random, () => locator.keyLoader);
	locator.blobAccessToken = new BlobAccessTokenFacade(locator.serviceExecutor, locator.user, dateProvider);
	const entityRestClient = new EntityRestClient(locator.user, locator.restClient, () => locator.crypto, locator.instanceMapper, locator.blobAccessToken);
	locator.native = worker;
	locator.booking = lazyMemoized(async () => {
		const { BookingFacade } = await import("./BookingFacade-chunk.js");
		return new BookingFacade(locator.serviceExecutor);
	});
	let offlineStorageProvider;
	if (isOfflineStorageAvailable() && !isAdminClient()) {
		locator.sqlCipherFacade = new SqlCipherFacadeSendDispatcher(locator.native);
		offlineStorageProvider = async () => {
			return new OfflineStorage(locator.sqlCipherFacade, new InterWindowEventFacadeSendDispatcher(worker), dateProvider, new OfflineStorageMigrator(OFFLINE_STORAGE_MIGRATIONS, modelInfos), new MailOfflineCleaner());
		};
	} else offlineStorageProvider = async () => null;
	locator.pdfWriter = async () => {
		const { PdfWriter } = await import("./PdfWriter-chunk.js");
		return new PdfWriter(new TextEncoder(), undefined);
	};
	const maybeUninitializedStorage = new LateInitializedCacheStorageImpl(async (error) => {
		await worker.sendError(error);
	}, offlineStorageProvider);
	locator.cacheStorage = maybeUninitializedStorage;
	const fileApp = new NativeFileApp(new FileFacadeSendDispatcher(worker), new ExportFacadeSendDispatcher(worker));
	let cache = null;
	if (!isAdminClient()) cache = new DefaultEntityRestCache(entityRestClient, maybeUninitializedStorage);
	locator.cache = cache ?? entityRestClient;
	locator.cachingEntityClient = new EntityClient(locator.cache);
	const nonCachingEntityClient = new EntityClient(entityRestClient);
	locator.cacheManagement = lazyMemoized(async () => {
		const { CacheManagementFacade } = await import("./CacheManagementFacade-chunk.js");
		return new CacheManagementFacade(locator.user, locator.cachingEntityClient, assertNotNull(cache));
	});
	/** Slightly annoying two-stage init: first import bulk loader, then we can have a factory for it. */
	const prepareBulkLoaderFactory = async () => {
		const { BulkMailLoader } = await import("./BulkMailLoader-chunk.js");
		return () => {
			if (isOfflineStorageAvailable()) return new BulkMailLoader(locator.cachingEntityClient, locator.cachingEntityClient, null);
else {
				const cacheStorage = new EphemeralCacheStorage();
				return new BulkMailLoader(new EntityClient(new DefaultEntityRestCache(entityRestClient, cacheStorage)), new EntityClient(entityRestClient), cacheStorage);
			}
		};
	};
	locator.bulkMailLoader = async () => {
		const factory = await prepareBulkLoaderFactory();
		return factory();
	};
	locator.indexer = lazyMemoized(async () => {
		const { Indexer } = await import("./Indexer-chunk.js");
		const { MailIndexer } = await import("./MailIndexer2-chunk.js");
		const mailFacade = await locator.mail();
		const bulkLoaderFactory = await prepareBulkLoaderFactory();
		return new Indexer(entityRestClient, mainInterface.infoMessageHandler, browserData, locator.cache, (core, db) => {
			const dateProvider$1 = new LocalTimeDateProvider();
			return new MailIndexer(core, db, mainInterface.infoMessageHandler, bulkLoaderFactory, locator.cachingEntityClient, dateProvider$1, mailFacade);
		});
	});
	if (isIOSApp() || isAndroidApp()) locator.kyberFacade = new NativeKyberFacade(new NativeCryptoFacadeSendDispatcher(worker));
else locator.kyberFacade = new WASMKyberFacade();
	locator.pqFacade = new PQFacade(locator.kyberFacade);
	locator.keyLoader = new KeyLoaderFacade(locator.keyCache, locator.user, locator.cachingEntityClient, locator.cacheManagement);
	locator.asymmetricCrypto = new AsymmetricCryptoFacade(locator.rsa, locator.pqFacade, locator.keyLoader, locator.cryptoWrapper, locator.serviceExecutor);
	locator.crypto = new CryptoFacade(locator.user, locator.cachingEntityClient, locator.restClient, locator.serviceExecutor, locator.instanceMapper, new OwnerEncSessionKeysUpdateQueue(locator.user, locator.serviceExecutor), cache, locator.keyLoader, locator.asymmetricCrypto);
	locator.recoverCode = lazyMemoized(async () => {
		const { RecoverCodeFacade } = await import("./RecoverCodeFacade-chunk.js");
		return new RecoverCodeFacade(locator.user, locator.cachingEntityClient, locator.login, locator.keyLoader);
	});
	locator.share = lazyMemoized(async () => {
		const { ShareFacade } = await import("./ShareFacade-chunk.js");
		return new ShareFacade(locator.user, locator.crypto, locator.serviceExecutor, locator.cachingEntityClient, locator.keyLoader);
	});
	locator.counters = lazyMemoized(async () => {
		const { CounterFacade } = await import("./CounterFacade-chunk.js");
		return new CounterFacade(locator.serviceExecutor);
	});
	locator.groupManagement = lazyMemoized(async () => {
		const { GroupManagementFacade } = await import("./GroupManagementFacade-chunk.js");
		return new GroupManagementFacade(locator.user, await locator.counters(), locator.cachingEntityClient, locator.serviceExecutor, locator.pqFacade, locator.keyLoader, await locator.cacheManagement(), locator.asymmetricCrypto, locator.cryptoWrapper);
	});
	locator.keyRotation = new KeyRotationFacade(locator.cachingEntityClient, locator.keyLoader, locator.pqFacade, locator.serviceExecutor, locator.cryptoWrapper, locator.recoverCode, locator.user, locator.crypto, locator.share, locator.groupManagement, locator.asymmetricCrypto);
	const loginListener = {
		onFullLoginSuccess(sessionType, cacheInfo, credentials) {
			if (!isTest() && sessionType !== SessionType.Temporary && !isAdminClient()) {
				console.log("initIndexer after log in");
				initIndexer(worker, cacheInfo, locator.keyLoader);
			}
			return mainInterface.loginListener.onFullLoginSuccess(sessionType, cacheInfo, credentials);
		},
		onLoginFailure(reason) {
			return mainInterface.loginListener.onLoginFailure(reason);
		},
		onSecondFactorChallenge(sessionId, challenges, mailAddress) {
			return mainInterface.loginListener.onSecondFactorChallenge(sessionId, challenges, mailAddress);
		}
	};
	let argon2idFacade;
	if (!isBrowser()) argon2idFacade = new NativeArgon2idFacade(new NativeCryptoFacadeSendDispatcher(worker));
else argon2idFacade = new WASMArgon2idFacade();
	locator.deviceEncryptionFacade = new DeviceEncryptionFacade();
	const { DatabaseKeyFactory } = await import("./DatabaseKeyFactory-chunk.js");
	locator.login = new LoginFacade(
		locator.restClient,
		/**
		* we don't want to try to use the cache in the login facade, because it may not be available (when no user is logged in)
		*/
		new EntityClient(locator.cache),
		loginListener,
		locator.instanceMapper,
		locator.crypto,
		locator.keyRotation,
		maybeUninitializedStorage,
		locator.serviceExecutor,
		locator.user,
		locator.blobAccessToken,
		locator.entropyFacade,
		new DatabaseKeyFactory(locator.deviceEncryptionFacade),
		argon2idFacade,
		nonCachingEntityClient,
		async (error) => {
			await worker.sendError(error);
		},
		locator.cacheManagement
);
	locator.search = lazyMemoized(async () => {
		const { SearchFacade } = await import("./SearchFacade-chunk.js");
		const indexer = await locator.indexer();
		const suggestionFacades = [indexer._contact.suggestionFacade];
		return new SearchFacade(locator.user, indexer.db, indexer._mail, suggestionFacades, browserData, locator.cachingEntityClient);
	});
	locator.userManagement = lazyMemoized(async () => {
		const { UserManagementFacade } = await import("./UserManagementFacade-chunk.js");
		return new UserManagementFacade(locator.user, await locator.groupManagement(), await locator.counters(), locator.cachingEntityClient, locator.serviceExecutor, mainInterface.operationProgressTracker, locator.login, locator.pqFacade, locator.keyLoader, await locator.recoverCode());
	});
	locator.customer = lazyMemoized(async () => {
		const { CustomerFacade } = await import("./CustomerFacade-chunk.js");
		return new CustomerFacade(locator.user, await locator.groupManagement(), await locator.userManagement(), await locator.counters(), locator.rsa, locator.cachingEntityClient, locator.serviceExecutor, await locator.booking(), locator.crypto, mainInterface.operationProgressTracker, locator.pdfWriter, locator.pqFacade, locator.keyLoader, await locator.recoverCode(), locator.asymmetricCrypto);
	});
	const aesApp = new AesApp(new NativeCryptoFacadeSendDispatcher(worker), random);
	locator.blob = lazyMemoized(async () => {
		const { BlobFacade } = await import("./BlobFacade-chunk.js");
		return new BlobFacade(locator.restClient, suspensionHandler, fileApp, aesApp, locator.instanceMapper, locator.crypto, locator.blobAccessToken);
	});
	locator.mail = lazyMemoized(async () => {
		const { MailFacade } = await import("./MailFacade-chunk.js");
		return new MailFacade(locator.user, locator.cachingEntityClient, locator.crypto, locator.serviceExecutor, await locator.blob(), fileApp, locator.login, locator.keyLoader);
	});
	const nativePushFacade = new NativePushFacadeSendDispatcher(worker);
	locator.calendar = lazyMemoized(async () => {
		const { CalendarFacade } = await import("./CalendarFacade2-chunk.js");
		return new CalendarFacade(locator.user, await locator.groupManagement(), assertNotNull(cache), nonCachingEntityClient, nativePushFacade, mainInterface.operationProgressTracker, locator.instanceMapper, locator.serviceExecutor, locator.crypto, mainInterface.infoMessageHandler);
	});
	locator.mailAddress = lazyMemoized(async () => {
		const { MailAddressFacade } = await import("./MailAddressFacade-chunk.js");
		return new MailAddressFacade(locator.user, await locator.groupManagement(), locator.serviceExecutor, nonCachingEntityClient);
	});
	const scheduler = new SchedulerImpl(dateProvider, self, self);
	locator.configFacade = lazyMemoized(async () => {
		const { ConfigurationDatabase } = await import("./ConfigurationDatabase2-chunk.js");
		return new ConfigurationDatabase(locator.keyLoader, locator.user);
	});
	const eventBusCoordinator = new EventBusEventCoordinator(mainInterface.wsConnectivityListener, locator.mail, locator.user, locator.cachingEntityClient, mainInterface.eventController, locator.configFacade, locator.keyRotation, locator.cacheManagement, async (error) => {
		await worker.sendError(error);
	}, async (queuedBatch) => {
		const indexer = await locator.indexer();
		indexer.addBatchesToQueue(queuedBatch);
		indexer.startProcessing();
	});
	locator.eventBusClient = new EventBusClient(eventBusCoordinator, cache ?? new AdminClientDummyEntityRestCache(), locator.user, locator.cachingEntityClient, locator.instanceMapper, (path) => new WebSocket(getWebsocketBaseUrl(domainConfig) + path), new SleepDetector(scheduler, dateProvider), mainInterface.progressTracker);
	locator.login.init(locator.eventBusClient);
	locator.Const = Const;
	locator.giftCards = lazyMemoized(async () => {
		const { GiftCardFacade } = await import("./GiftCardFacade-chunk.js");
		return new GiftCardFacade(locator.user, await locator.customer(), locator.serviceExecutor, locator.crypto, locator.keyLoader);
	});
	locator.contactFacade = lazyMemoized(async () => {
		const { ContactFacade } = await import("./ContactFacade-chunk.js");
		return new ContactFacade(new EntityClient(locator.cache));
	});
	locator.mailExportFacade = lazyMemoized(async () => {
		const { MailExportFacade } = await import("./MailExportFacade-chunk.js");
		const { MailExportTokenFacade } = await import("./MailExportTokenFacade-chunk.js");
		const mailExportTokenFacade = new MailExportTokenFacade(locator.serviceExecutor);
		return new MailExportFacade(mailExportTokenFacade, await locator.bulkMailLoader(), await locator.blob(), locator.crypto, locator.blobAccessToken);
	});
}
const RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS = 3e4;
async function initIndexer(worker, cacheInfo, keyLoaderFacade) {
	const indexer = await locator.indexer();
	try {
		await indexer.init({
			user: assertNotNull(locator.user.getUser()),
			cacheInfo,
			keyLoaderFacade
		});
	} catch (e) {
		if (e instanceof ServiceUnavailableError) {
			console.log("Retry init indexer in 30 seconds after ServiceUnavailableError");
			await delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS);
			console.log("_initIndexer after ServiceUnavailableError");
			return initIndexer(worker, cacheInfo, keyLoaderFacade);
		} else if (e instanceof ConnectionError) {
			console.log("Retry init indexer in 30 seconds after ConnectionError");
			await delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS);
			console.log("_initIndexer after ConnectionError");
			return initIndexer(worker, cacheInfo, keyLoaderFacade);
		} else {
			worker.sendError(e);
			return;
		}
	}
	if (cacheInfo.isPersistent && cacheInfo.isNewOfflineDb) indexer.enableMailIndexing();
}
async function resetLocator() {
	await locator.login.resetSession();
	await initLocator(locator._worker, locator._browserData);
}
if (typeof self !== "undefined") self.locator = locator;

//#endregion
//#region src/mail-app/workerUtils/worker/WorkerImpl.ts
assertWorkerOrNode();
var WorkerImpl = class {
	_scope;
	_dispatcher;
	constructor(self$1) {
		this._scope = self$1;
		this._dispatcher = new MessageDispatcher(new WebWorkerTransport(this._scope), this.queueCommands(this.exposedInterface), "worker-main");
	}
	async init(browserData) {
		await initLocator(this, browserData);
		const workerScope = this._scope;
		if (workerScope && !isMainOrNode()) {
			workerScope.addEventListener("unhandledrejection", (event) => {
				this.sendError(event.reason);
			});
			workerScope.onerror = (e, source, lineno, colno, error) => {
				console.error("workerImpl.onerror", e, source, lineno, colno, error);
				if (error instanceof Error) this.sendError(error);
else {
					const err = new Error(e);
					err.lineNumber = lineno;
					err.columnNumber = colno;
					err.fileName = source;
					this.sendError(err);
				}
				return true;
			};
		}
	}
	get exposedInterface() {
		return {
			async loginFacade() {
				return locator.login;
			},
			async customerFacade() {
				return locator.customer();
			},
			async giftCardFacade() {
				return locator.giftCards();
			},
			async groupManagementFacade() {
				return locator.groupManagement();
			},
			async configFacade() {
				return locator.configFacade();
			},
			async calendarFacade() {
				return locator.calendar();
			},
			async mailFacade() {
				return locator.mail();
			},
			async shareFacade() {
				return locator.share();
			},
			async cacheManagementFacade() {
				return locator.cacheManagement();
			},
			async counterFacade() {
				return locator.counters();
			},
			async indexerFacade() {
				return locator.indexer();
			},
			async searchFacade() {
				return locator.search();
			},
			async bookingFacade() {
				return locator.booking();
			},
			async mailAddressFacade() {
				return locator.mailAddress();
			},
			async blobAccessTokenFacade() {
				return locator.blobAccessToken;
			},
			async blobFacade() {
				return locator.blob();
			},
			async userManagementFacade() {
				return locator.userManagement();
			},
			async recoverCodeFacade() {
				return locator.recoverCode();
			},
			async restInterface() {
				return locator.cache;
			},
			async serviceExecutor() {
				return locator.serviceExecutor;
			},
			async cryptoWrapper() {
				return locator.cryptoWrapper;
			},
			async asymmetricCryptoFacade() {
				return locator.asymmetricCrypto;
			},
			async cryptoFacade() {
				return locator.crypto;
			},
			async cacheStorage() {
				return locator.cacheStorage;
			},
			async sqlCipherFacade() {
				return locator.sqlCipherFacade;
			},
			async random() {
				return { async generateRandomNumber(nbrOfBytes) {
					return random.generateRandomNumber(nbrOfBytes);
				} };
			},
			async eventBus() {
				return locator.eventBusClient;
			},
			async entropyFacade() {
				return locator.entropyFacade;
			},
			async workerFacade() {
				return locator.workerFacade;
			},
			async contactFacade() {
				return locator.contactFacade();
			},
			async bulkMailLoader() {
				return locator.bulkMailLoader();
			},
			async mailExportFacade() {
				return locator.mailExportFacade();
			}
		};
	}
	queueCommands(exposedWorker) {
		return {
			setup: async (message) => {
				console.error("WorkerImpl: setup was called after bootstrap! message: ", message);
			},
			testEcho: (message) => Promise.resolve({ msg: ">>> " + message.args[0].msg }),
			testError: (message) => {
				const errorTypes = {
					ProgrammingError,
					CryptoError,
					NotAuthenticatedError
				};
				let ErrorType = errorTypes[message.args[0].errorType];
				return Promise.reject(new ErrorType(`wtf: ${message.args[0].errorType}`));
			},
			reset: (message) => {
				return resetLocator();
			},
			restRequest: (message) => {
				const args = message.args;
				let [path, method, options] = args;
				options = options ?? {};
				options.headers = {
					...locator.user.createAuthHeaders(),
					...options.headers
				};
				return locator.restClient.request(path, method, options);
			},
			facade: exposeLocalDelayed(exposedWorker)
		};
	}
	invokeNative(requestType, args) {
		return this._dispatcher.postRequest(new Request("execNative", [requestType, args]));
	}
	getMainInterface() {
		return exposeRemote((request) => this._dispatcher.postRequest(request));
	}
	sendError(e) {
		return this._dispatcher.postRequest(new Request("error", [errorToObj(e)]));
	}
};

//#endregion
//#region src/mail-app/workerUtils/worker/mail-worker.ts
/**
* Receives the first message from the client and initializes the WorkerImpl to receive all future messages. Sends a response to the client on this first message.
*/
self.onmessage = function(msg) {
	const data = msg.data;
	if (data.requestType === "setup") {
		self.env = data.args[0];
		replaceNativeLogger(self, new Logger());
		Promise.resolve().then(async () => {
			const initialRandomizerEntropy = data.args[1];
			const browserData = data.args[2];
			if (initialRandomizerEntropy == null || browserData == null) throw new Error("Invalid Worker arguments");
			const workerImpl = new WorkerImpl(typeof self !== "undefined" ? self : null);
			await workerImpl.init(browserData);
			workerImpl.exposedInterface.entropyFacade().then((entropyFacade) => entropyFacade.addEntropy(initialRandomizerEntropy));
			self.postMessage({
				id: data.id,
				type: "response",
				value: {}
			});
		}).catch((e) => {
			self.postMessage({
				id: data.id,
				type: "error",
				error: JSON.stringify({
					name: "Error",
					message: e.message,
					stack: e.stack
				})
			});
		});
	} else throw new Error("worker not yet ready. Request type: " + data.requestType);
};

//#endregion
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLmpzIiwibmFtZXMiOlsiaW5mb01lc3NhZ2VIYW5kbGVyOiBJbmZvTWVzc2FnZUhhbmRsZXIiLCJzeXN0ZW1UaW1lb3V0OiBTeXN0ZW1UaW1lb3V0Iiwic3VzcGVuc2lvbkR1cmF0aW9uU2Vjb25kczogbnVtYmVyIiwicmVzb3VyY2VVUkw6IFVSTCIsInJlcXVlc3Q6ICgpID0+IFByb21pc2U8YW55PiIsImRldmljZUtleTogVWludDhBcnJheSIsImRhdGE6IFVpbnQ4QXJyYXkiLCJlbmNyeXB0ZWREYXRhOiBVaW50OEFycmF5IiwibmF0aXZlQ3J5cHRvRmFjYWRlOiBOYXRpdmVDcnlwdG9GYWNhZGUiLCJyYW5kb206IFJhbmRvbWl6ZXIiLCJrZXk6IEFlc0tleSIsImZpbGVVcmw6IEZpbGVVcmkiLCJ0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSIsIm5hdGl2ZTogTmF0aXZlSW50ZXJmYWNlIiwicHVibGljS2V5OiBSc2FQdWJsaWNLZXkiLCJieXRlczogVWludDhBcnJheSIsInByaXZhdGVLZXk6IFJzYVByaXZhdGVLZXkiLCJyc2E6IFJzYUltcGxlbWVudGF0aW9uIiwicHFGYWNhZGU6IFBRRmFjYWRlIiwia2V5TG9hZGVyRmFjYWRlOiBLZXlMb2FkZXJGYWNhZGUiLCJjcnlwdG9XcmFwcGVyOiBDcnlwdG9XcmFwcGVyIiwic2VydmljZUV4ZWN1dG9yOiBJU2VydmljZUV4ZWN1dG9yIiwiaWRlbnRpZmllcjogUHVibGljS2V5SWRlbnRpZmllciIsInNlbmRlcklkZW50aXR5UHViS2V5OiBVaW50OEFycmF5Iiwic2VuZGVyS2V5VmVyc2lvbjogbnVtYmVyIiwicmVjaXBpZW50S2V5UGFpcjogQXN5bW1ldHJpY0tleVBhaXIiLCJwdWJFbmNLZXlEYXRhOiBQdWJFbmNLZXlEYXRhIiwic2VuZGVySWRlbnRpZmllcjogUHVibGljS2V5SWRlbnRpZmllciIsImNyeXB0b1Byb3RvY29sVmVyc2lvbjogQ3J5cHRvUHJvdG9jb2xWZXJzaW9uIiwicHViRW5jU3ltS2V5OiBVaW50OEFycmF5IiwicHJpdmF0ZUtleTogUnNhUHJpdmF0ZUtleSIsInJlY2lwaWVudEtleVBhaXJHcm91cElkOiBJZCIsInJlY2lwaWVudEtleVZlcnNpb246IG51bWJlciIsImtleVBhaXI6IEFzeW1tZXRyaWNLZXlQYWlyIiwic3ltS2V5OiBBZXNLZXkiLCJyZWNpcGllbnRQdWJsaWNLZXlzOiBWZXJzaW9uZWQ8UHVibGljS2V5cz4iLCJzZW5kZXJHcm91cElkOiBJZCIsInNlbmRlckVjY0tleVBhaXI6IFZlcnNpb25lZDxFY2NLZXlQYWlyPiIsInJlY2lwaWVudFB1YmxpY0tleTogVmVyc2lvbmVkPFBRUHVibGljS2V5cz4iLCJwdWJsaWNLZXlzOiBQdWJsaWNLZXlzIiwic2VuZGVyS2V5UGFpcjogQXN5bW1ldHJpY0tleVBhaXIiLCJrZXlHcm91cElkOiBJZCIsInB1YmxpY0tleUdldE91dDogUHVibGljS2V5R2V0T3V0IiwidXNlckZhY2FkZTogVXNlckZhY2FkZSIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwicmVzdENsaWVudDogUmVzdENsaWVudCIsInNlcnZpY2VFeGVjdXRvcjogSVNlcnZpY2VFeGVjdXRvciIsImluc3RhbmNlTWFwcGVyOiBJbnN0YW5jZU1hcHBlciIsIm93bmVyRW5jU2Vzc2lvbktleXNVcGRhdGVRdWV1ZTogT3duZXJFbmNTZXNzaW9uS2V5c1VwZGF0ZVF1ZXVlIiwiY2FjaGU6IERlZmF1bHRFbnRpdHlSZXN0Q2FjaGUgfCBudWxsIiwia2V5TG9hZGVyRmFjYWRlOiBLZXlMb2FkZXJGYWNhZGUiLCJhc3ltbWV0cmljQ3J5cHRvRmFjYWRlOiBBc3ltbWV0cmljQ3J5cHRvRmFjYWRlIiwiZGVjcnlwdGVkSW5zdGFuY2U6IFQiLCJpbnN0YW5jZTogU29tZUVudGl0eSIsImluc3RhbmNlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+Iiwib3duZXJLZXk6IEFlc0tleSIsImtleTogVWludDhBcnJheSB8IHN0cmluZyIsIm93bmVyRW5jU2Vzc2lvbktleTogVmVyc2lvbmVkRW5jcnlwdGVkS2V5IiwidHlwZU1vZGVsOiBUeXBlTW9kZWwiLCJ0eXBlUmVmOiBUeXBlUmVmPFQ+IiwiZGF0YTogUmVjb3JkPHN0cmluZywgYW55PiIsImJ1Y2tldEtleUluc3RhbmNlT3JMaXRlcmFsOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IiwiYnVja2V0S2V5OiBCdWNrZXRLZXkiLCJkZWNyeXB0ZWRCdWNrZXRLZXk6IEFlc0tleSIsInVuZW5jcnlwdGVkU2VuZGVyQXV0aFN0YXR1czogRW5jcnlwdGlvbkF1dGhTdGF0dXMgfCBudWxsIiwicHFNZXNzYWdlU2VuZGVyS2V5OiBFY2NQdWJsaWNLZXkgfCBudWxsIiwidmFsdWU6IHN0cmluZyIsImtleUdyb3VwOiBJZCIsImdyb3VwS2V5VmVyc2lvbjogbnVtYmVyIiwiZ3JvdXBFbmNCdWNrZXRLZXk6IFVpbnQ4QXJyYXkiLCJnOiBHcm91cE1lbWJlcnNoaXAiLCJ1bm1hcHBlZEluc3RhbmNlOiBVbm1hcHBlZE93bmVyR3JvdXBJbnN0YW5jZSIsImtleTogVmVyc2lvbmVkRW5jcnlwdGVkS2V5Iiwib3duZXJHcm91cD86IElkIiwiaW5zdGFuY2U6IEluc3RhbmNlIiwiZWxlbWVudE9yTGl0ZXJhbDogUmVjb3JkPHN0cmluZywgYW55PiIsImxpc3RQZXJtaXNzaW9uczogUGVybWlzc2lvbltdIiwic3ltbWV0cmljUGVybWlzc2lvbjogUGVybWlzc2lvbiB8IG51bGwiLCJkZWNCdWNrZXRLZXk6IG51bWJlcltdIiwiaW5zdGFuY2VFbGVtZW50SWQ6IHN0cmluZyIsImVuY3J5cHRpb25BdXRoU3RhdHVzOiBFbmNyeXB0aW9uQXV0aFN0YXR1cyB8IG51bGwiLCJyZXNvbHZlZFNlc3Npb25LZXlGb3JJbnN0YW5jZTogQWVzS2V5IHwgdW5kZWZpbmVkIiwiZW5jcnlwdGlvbkF1dGhTdGF0dXM6XG5cdFx0XHR8IEVuY3J5cHRpb25BdXRoU3RhdHVzXG5cdFx0XHR8IG51bGxcblx0XHRcdHwgRW5jcnlwdGlvbkF1dGhTdGF0dXMuUlNBX05PX0FVVEhFTlRJQ0FUSU9OXG5cdFx0XHR8IEVuY3J5cHRpb25BdXRoU3RhdHVzLlRVVEFDUllQVF9BVVRIRU5USUNBVElPTl9TVUNDRUVERURcblx0XHRcdHwgRW5jcnlwdGlvbkF1dGhTdGF0dXMuVFVUQUNSWVBUX0FVVEhFTlRJQ0FUSU9OX0ZBSUxFRFxuXHRcdFx0fCBFbmNyeXB0aW9uQXV0aFN0YXR1cy5BRVNfTk9fQVVUSEVOVElDQVRJT04iLCJwcU1lc3NhZ2VTZW5kZXJLZXk6IFVpbnQ4QXJyYXkgfCBudWxsIiwicHFNZXNzYWdlU2VuZGVyS2V5VmVyc2lvbjogbnVtYmVyIHwgbnVsbCIsInJlc29sdmVkU2Vzc2lvbktleUZvckluc3RhbmNlOiBudW1iZXJbXSIsImluc3RhbmNlU2Vzc2lvbktleVdpdGhPd25lckVuY1Nlc3Npb25LZXk6IEluc3RhbmNlU2Vzc2lvbktleSIsImRlY3J5cHRlZFNlc3Npb25LZXk6IG51bWJlcltdIiwic2VuZGVyTWFpbEFkZHJlc3M6IHN0cmluZyIsInBxTWVzc2FnZVNlbmRlcktleTogVWludDhBcnJheSIsImJ1Y2tldFBlcm1pc3Npb246IEJ1Y2tldFBlcm1pc3Npb24iLCJwdWJPckV4dFBlcm1pc3Npb246IFBlcm1pc3Npb24iLCJtb2RlbDogVHlwZU1vZGVsIiwiZW50aXR5OiBSZWNvcmQ8c3RyaW5nLCBhbnk+Iiwia2V5VG9FbmNyeXB0U2Vzc2lvbktleT86IFZlcnNpb25lZEtleSIsInNlbmRlclVzZXJHcm91cElkOiBJZCIsImJ1Y2tldEtleTogQWVzS2V5IiwicmVjaXBpZW50TWFpbEFkZHJlc3M6IHN0cmluZyIsIm5vdEZvdW5kUmVjaXBpZW50czogQXJyYXk8c3RyaW5nPiIsInB1YmxpY0tleUdldE91dDogUHVibGljS2V5R2V0T3V0Iiwic2VuZGVyR3JvdXBJZDogSWQiLCJwZXJtaXNzaW9uOiBQZXJtaXNzaW9uIiwicGVybWlzc2lvbk93bmVyR3JvdXBLZXk6IFZlcnNpb25lZEtleSIsInNlc3Npb25LZXk6IEFlc0tleSIsIm1haW5JbnN0YW5jZTogUmVjb3JkPHN0cmluZywgYW55PiIsImNoaWxkSW5zdGFuY2VzOiByZWFkb25seSBGaWxlW10iLCJvd25lckdyb3VwS2V5OiBWZXJzaW9uZWRLZXkiLCJhbHQ6IFJlY29yZDxzdHJpbmcsIGFueT4iLCJtb2RlbDogVHlwZU1vZGVsIiwiaW5zdGFuY2U6IFJlY29yZDxzdHJpbmcsIGFueT4iLCJzazogQWVzS2V5IHwgbnVsbCIsImRlY3J5cHRlZDogYW55IiwiaW5zdGFuY2U6IFQiLCJlbmNyeXB0ZWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IiwidmFsdWVOYW1lOiBzdHJpbmciLCJ2YWx1ZVR5cGU6IE1vZGVsVmFsdWUiLCJ2YWx1ZTogYW55IiwiaXY6IFVpbnQ4QXJyYXkiLCJ2YWx1ZTogKEJhc2U2NCB8IG51bGwpIHwgc3RyaW5nIiwidHlwZTogVmFsdWVzPHR5cGVvZiBWYWx1ZVR5cGU+IiwidmFsdWU6IEJhc2U2NCB8IHN0cmluZyIsInVuY29tcHJlc3NlZDogc3RyaW5nIiwiY29tcHJlc3NlZDogVWludDhBcnJheSIsInZhbHVlOiB1bmtub3duIiwiYmF0Y2g6IFF1ZXVlZEJhdGNoIiwiaW5zdGFuY2U6IFQiLCJfdHlwZVJlZjogVHlwZVJlZjxUPiIsIl9pZDogUHJvcGVydHlUeXBlPFQsIFwiX2lkXCI+IiwiX29wdHM6IEVudGl0eVJlc3RDbGllbnRMb2FkT3B0aW9ucyIsInR5cGVSZWY6IFR5cGVSZWY8VD4iLCJsaXN0SWQ6IElkIHwgbnVsbCIsImVsZW1lbnRJZHM6IEFycmF5PElkPiIsImxpc3RJZDogSWQiLCJzdGFydDogSWQiLCJjb3VudDogbnVtYmVyIiwicmV2ZXJzZTogYm9vbGVhbiIsImV4dHJhSGVhZGVycz86IERpY3QiLCJpbnN0YW5jZXM6IEFycmF5PFQ+IiwiZ3JvdXBJZDogSWQiLCJiYXRjaElkOiBJZCIsInNjaGVkdWxlcjogU2NoZWR1bGVyIiwiZGF0ZVByb3ZpZGVyOiBEYXRlUHJvdmlkZXIiLCJvblNsZWVwOiBUaHVuayIsInR5cGVSZWY6IFR5cGVSZWY8VD4iLCJsaXN0SWQ6IElkIHwgbnVsbCIsImVsZW1lbnRJZDogSWQiLCJUeXBlSWQiLCJ0eXBlTW9kZWw6IFR5cGVNb2RlbCIsImlkOiBJZCIsImVudGl0eTogVCIsImxpc3RJZDogSWQiLCJvcmlnaW5hbEVudGl0eTogU29tZUVudGl0eSIsInR5cGVSZWY6IFR5cGVSZWY8QmxvYkVsZW1lbnRFbnRpdHk+IiwiZW50aXR5OiBCbG9iRWxlbWVudEVudGl0eSIsInR5cGVSZWY6IFR5cGVSZWY8TGlzdEVsZW1lbnRFbnRpdHk+IiwiZW50aXR5OiBMaXN0RWxlbWVudEVudGl0eSIsImFsbFJhbmdlOiBBcnJheTxJZD4iLCJzdGFydEVsZW1lbnRJZDogSWQiLCJjb3VudDogbnVtYmVyIiwicmV2ZXJzZTogYm9vbGVhbiIsImlkczogSWRbXSIsInJlc3VsdDogVFtdIiwiZWxlbWVudElkczogSWRbXSIsInVwcGVySWQ6IElkIiwibG93ZXJJZDogSWQiLCJsb3dlcjogSWQiLCJ1cHBlcjogSWQiLCJncm91cElkOiBJZCIsImJhdGNoSWQ6IElkIiwidmFsdWU6IG51bWJlciIsImVudGl0eVJlc3RDbGllbnQ6IEVudGl0eVJlc3RDbGllbnQiLCJvd25lcjogSWQiLCJjYWNoZUZvclR5cGU6IE1hcDxJZCwgTGlzdENhY2hlIHwgQmxvYkVsZW1lbnRDYWNoZT4iLCJvd25lcjogc3RyaW5nIiwibGlzdElkc1RvRGVsZXRlOiBzdHJpbmdbXSIsImxpc3RJZDogc3RyaW5nIiwic2VuZEVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiBQcm9taXNlPHZvaWQ+Iiwib2ZmbGluZVN0b3JhZ2VQcm92aWRlcjogKCkgPT4gUHJvbWlzZTxudWxsIHwgT2ZmbGluZVN0b3JhZ2U+IiwiYXJnczogT2ZmbGluZVN0b3JhZ2VBcmdzIHwgRXBoZW1lcmFsU3RvcmFnZUFyZ3MiLCJzdG9yYWdlIiwidHlwZVJlZjogVHlwZVJlZjxUPiIsImxpc3RJZDogSWQgfCBudWxsIiwiaWQ6IElkIiwibGlzdElkOiBJZCIsImdyb3VwSWQ6IElkIiwic3RhcnQ6IElkIiwiY291bnQ6IG51bWJlciIsInJldmVyc2U6IGJvb2xlYW4iLCJsaXN0SWQ6IHN0cmluZyIsImVsZW1lbnRJZHM6IHN0cmluZ1tdIiwib3JpZ2luYWxFbnRpdHk6IFNvbWVFbnRpdHkiLCJiYXRjaElkOiBJZCIsInZhbHVlOiBudW1iZXIiLCJsb3dlcjogSWQiLCJ1cHBlcjogSWQiLCJlbnRpdHlSZXN0Q2xpZW50OiBFbnRpdHlSZXN0Q2xpZW50Iiwib3duZXI6IElkIiwicmVzdENsaWVudDogUmVzdENsaWVudCIsImF1dGhEYXRhUHJvdmlkZXI6IEF1dGhEYXRhUHJvdmlkZXIiLCJpbnN0YW5jZU1hcHBlcjogSW5zdGFuY2VNYXBwZXIiLCJjcnlwdG9GYWNhZGU6IGxhenk8Q3J5cHRvRmFjYWRlPiIsInNlcnZpY2U6IFMiLCJkYXRhOiBQYXJhbVR5cGVGcm9tUmVmPFNbXCJnZXRcIl1bXCJkYXRhXCJdPiIsInBhcmFtcz86IEV4dHJhU2VydmljZVBhcmFtcyIsImRhdGE6IFBhcmFtVHlwZUZyb21SZWY8U1tcInBvc3RcIl1bXCJkYXRhXCJdPiIsImRhdGE6IFBhcmFtVHlwZUZyb21SZWY8U1tcInB1dFwiXVtcImRhdGFcIl0+IiwiZGF0YTogUGFyYW1UeXBlRnJvbVJlZjxTW1wiZGVsZXRlXCJdW1wiZGF0YVwiXT4iLCJzZXJ2aWNlOiBBbnlTZXJ2aWNlIiwibWV0aG9kOiBIdHRwTWV0aG9kIiwicmVxdWVzdEVudGl0eTogRW50aXR5IHwgbnVsbCIsInBhcmFtczogRXh0cmFTZXJ2aWNlUGFyYW1zIHwgdW5kZWZpbmVkIiwiZGF0YTogc3RyaW5nIHwgdW5kZWZpbmVkIiwibWV0aG9kRGVmaW5pdGlvbjogTWV0aG9kRGVmaW5pdGlvbiIsInBhcmFtczogRXh0cmFTZXJ2aWNlUGFyYW1zIHwgbnVsbCIsInR5cGVSZWY6IFR5cGVSZWY8VD4iLCJkYXRhOiBzdHJpbmciLCJrZXlDYWNoZTogS2V5Q2FjaGUiLCJjcnlwdG9XcmFwcGVyOiBDcnlwdG9XcmFwcGVyIiwiYWNjZXNzVG9rZW46IHN0cmluZyB8IG51bGwiLCJ1c2VyOiBVc2VyIiwidXNlclBhc3NwaHJhc2VLZXk6IEFlc0tleSIsInVzZXJQYXNzcGhyYXNlS2V5OiBudW1iZXJbXSIsInVzZXJHcm91cElkOiBJZCIsImdyb3VwSWQ6IElkIiwiZzogR3JvdXBNZW1iZXJzaGlwIiwiZ3JvdXBUeXBlOiBHcm91cFR5cGUiLCJzdGF0dXM6IFdlYnNvY2tldExlYWRlclN0YXR1cyIsInVzZXJHcm91cEtleURpc3RyaWJ1dGlvbjogVXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uIiwidHlwZVJlZjogVHlwZVJlZjxUPiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwibWlncmF0aW9uczogQXJyYXk8TWlncmF0aW9uPiIsIm9sZE5hbWU6IHN0cmluZyIsIm5ld05hbWU6IHN0cmluZyIsInZhbHVlTmFtZTogc3RyaW5nIiwidmFsdWU6IGFueSIsImF0dHJpYnV0ZTogc3RyaW5nIiwidHlwZTogVHlwZVJlZjxUPiIsInN5czk0OiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJ0dXRhbm90YTY2OiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJzeXM5MjogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwiZTogTWFpbCIsImVudGl0eTogVCIsInR1dGFub3RhNjU6IE9mZmxpbmVNaWdyYXRpb24iLCJzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsInN5czkxOiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJzeXM5MDogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwib2xkQ3VzdG9tZXJJbmZvOiBDdXN0b21lckluZm8iLCJ1c2VyOiBVc2VyIiwidHV0YW5vdGE2NDogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwidHV0YW5vdGE2NzogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwic3lzOTY6IE9mZmxpbmVNaWdyYXRpb24iLCJzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsImVuY3J5cHRlZEVsZW1lbnRUeXBlczogQXJyYXk8VHlwZVJlZjxFbGVtZW50RW50aXR5Pj4iLCJlbmNyeXB0ZWRMaXN0RWxlbWVudFR5cGVzOiBBcnJheTxUeXBlUmVmPExpc3RFbGVtZW50RW50aXR5Pj4iLCJ0dXRhbm90YTY5OiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJlbmNyeXB0ZWRFbGVtZW50VHlwZXM6IEFycmF5PFR5cGVSZWY8RWxlbWVudEVudGl0eT4+IiwiZW5jcnlwdGVkTGlzdEVsZW1lbnRUeXBlczogQXJyYXk8VHlwZVJlZjxMaXN0RWxlbWVudEVudGl0eT4+Iiwic3lzOTc6IE9mZmxpbmVNaWdyYXRpb24iLCJzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsInR1dGFub3RhNzE6IE9mZmxpbmVNaWdyYXRpb24iLCJzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsInN5czk5OiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJzeXMxMDE6IE9mZmxpbmVNaWdyYXRpb24iLCJzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsInNxbENpcGhlckZhY2FkZTogU3FsQ2lwaGVyRmFjYWRlIiwic3lzMTAyOiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJzcWxDaXBoZXJGYWNhZGU6IFNxbENpcGhlckZhY2FkZSIsInR1dGFub3RhNzI6IE9mZmxpbmVNaWdyYXRpb24iLCJzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsInN5czEwMzogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwic3FsQ2lwaGVyRmFjYWRlOiBTcWxDaXBoZXJGYWNhZGUiLCJ0dXRhbm90YTczOiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJzeXMxMDQ6IE9mZmxpbmVNaWdyYXRpb24iLCJzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsIl86IFNxbENpcGhlckZhY2FkZSIsInN5czEwNTogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwiXzogU3FsQ2lwaGVyRmFjYWRlIiwic3lzMTA2OiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJ0dXRhbm90YTc0OiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJzeXMxMDc6IE9mZmxpbmVNaWdyYXRpb24iLCJzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsInR1dGFub3RhNzU6IE9mZmxpbmVNaWdyYXRpb24iLCJzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsInN5czExMTogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwidHV0YW5vdGE3NjogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwic3lzMTEyOiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJ0dXRhbm90YTc3OiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJzeXMxMTQ6IE9mZmxpbmVNaWdyYXRpb24iLCJzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsImVudGl0eTogYW55Iiwib2ZmbGluZTI6IE9mZmxpbmVNaWdyYXRpb24iLCJzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsIl86IFNxbENpcGhlckZhY2FkZSIsInN5czExNTogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwidHV0YW5vdGE3ODogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwic3lzMTE2OiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJ0dXRhbm90YTc5OiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJvZmZsaW5lMzogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwiXzogU3FsQ2lwaGVyRmFjYWRlIiwic3lzMTE4OiBPZmZsaW5lTWlncmF0aW9uIiwic3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UiLCJjYWxlbmRhckV2ZW50OiBDYWxlbmRhckV2ZW50IiwidHV0YW5vdGE4MDogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwiY2FsZW5kYXJFdmVudDogQ2FsZW5kYXJFdmVudCIsInN0b3JhZ2UxMTogT2ZmbGluZU1pZ3JhdGlvbiIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwiT0ZGTElORV9TVE9SQUdFX01JR1JBVElPTlM6IFJlYWRvbmx5QXJyYXk8T2ZmbGluZU1pZ3JhdGlvbj4iLCJtaWdyYXRpb25zOiBSZWFkb25seUFycmF5PE9mZmxpbmVNaWdyYXRpb24+IiwibW9kZWxJbmZvczogTW9kZWxJbmZvcyIsInN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlIiwic3FsQ2lwaGVyRmFjYWRlOiBTcWxDaXBoZXJGYWNhZGUiLCJtZXRhOiBQYXJ0aWFsPE9mZmxpbmVEYk1ldGE+IiwibWV0YTogUmVhZG9ubHk8UGFydGlhbDxPZmZsaW5lRGJNZXRhPj4iLCJhcHA6IFZlcnNpb25NZXRhZGF0YUJhc2VLZXkiLCJ2ZXJzaW9uOiBudW1iZXIiLCJ0cmFuc3BvcnQ6IE5hdGl2ZUludGVyZmFjZSIsInVzZXJGYWNhZGU6IFVzZXJGYWNhZGUiLCJzZXJ2aWNlRXhlY3V0b3I6IElTZXJ2aWNlRXhlY3V0b3IiLCJyYW5kb206IFJhbmRvbWl6ZXIiLCJsYXp5S2V5TG9hZGVyRmFjYWRlOiBsYXp5PEtleUxvYWRlckZhY2FkZT4iLCJlbnRyb3B5OiBFbnRyb3B5RGF0YUNodW5rW10iLCJ0dXRhbm90YVByb3BlcnRpZXM6IFR1dGFub3RhUHJvcGVydGllcyIsInNlcnZpY2VFeGVjdXRvcjogSVNlcnZpY2VFeGVjdXRvciIsImF1dGhEYXRhUHJvdmlkZXI6IEF1dGhEYXRhUHJvdmlkZXIiLCJkYXRlUHJvdmlkZXI6IERhdGVQcm92aWRlciIsImFyY2hpdmVEYXRhVHlwZTogQXJjaGl2ZURhdGFUeXBlIiwib3duZXJHcm91cElkOiBJZCIsIm93bmVyR3JvdXBJZDogc3RyaW5nIiwicmVmZXJlbmNpbmdJbnN0YW5jZXM6IHJlYWRvbmx5IEJsb2JSZWZlcmVuY2luZ0luc3RhbmNlW10iLCJibG9iTG9hZE9wdGlvbnM6IEJsb2JMb2FkT3B0aW9ucyIsInJlZmVyZW5jaW5nSW5zdGFuY2U6IEJsb2JSZWZlcmVuY2luZ0luc3RhbmNlIiwicmVmZXJlbmNpbmdJbnN0YW5jZXM6IEJsb2JSZWZlcmVuY2luZ0luc3RhbmNlW10iLCJhcmNoaXZlSWQ6IElkIiwiYmxvYlNlcnZlckFjY2Vzc0luZm86IEJsb2JTZXJ2ZXJBY2Nlc3NJbmZvIiwiYWRkaXRpb25hbFJlcXVlc3RQYXJhbXM6IERpY3QiLCJ0eXBlUmVmOiBUeXBlUmVmPGFueT4iLCJhcmNoaXZlT3JHcm91cEtleTogSWQgfCBudWxsIiwiaW5zdGFuY2VJZHM6IHJlYWRvbmx5IElkW10iLCJsb2FkZXI6ICgpID0+IFByb21pc2U8QmxvYlNlcnZlckFjY2Vzc0luZm8+IiwiaWQ6IElkIiwiaWRzOiBJZFtdIiwidXNlckZhY2FkZTogVXNlckZhY2FkZSIsInNlcnZpY2VFeGVjdXRvcjogSVNlcnZpY2VFeGVjdXRvciIsImRlYm91bmNlVGltZW91dE1zOiBudW1iZXIiLCJpbnN0YW5jZVNlc3Npb25LZXlzOiBBcnJheTxJbnN0YW5jZVNlc3Npb25LZXk+IiwidHlwZU1vZGVsOiBUeXBlTW9kZWwiLCJjb25uZWN0aXZpdHlMaXN0ZW5lcjogV2Vic29ja2V0Q29ubmVjdGl2aXR5TGlzdGVuZXIiLCJtYWlsRmFjYWRlOiBsYXp5QXN5bmM8TWFpbEZhY2FkZT4iLCJ1c2VyRmFjYWRlOiBVc2VyRmFjYWRlIiwiZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQiLCJldmVudENvbnRyb2xsZXI6IEV4cG9zZWRFdmVudENvbnRyb2xsZXIiLCJjb25maWd1cmF0aW9uRGF0YWJhc2U6IGxhenlBc3luYzxDb25maWd1cmF0aW9uRGF0YWJhc2U+Iiwia2V5Um90YXRpb25GYWNhZGU6IEtleVJvdGF0aW9uRmFjYWRlIiwiY2FjaGVNYW5hZ2VtZW50RmFjYWRlOiBsYXp5QXN5bmM8Q2FjaGVNYW5hZ2VtZW50RmFjYWRlPiIsInNlbmRFcnJvcjogKGVycm9yOiBFcnJvcikgPT4gUHJvbWlzZTx2b2lkPiIsImFwcFNwZWNpZmljQmF0Y2hIYW5kbGluZzogKHF1ZXVlZEJhdGNoOiBRdWV1ZWRCYXRjaFtdKSA9PiB2b2lkIiwic3RhdGU6IFdzQ29ubmVjdGlvblN0YXRlIiwiZXZlbnRzOiBFbnRpdHlVcGRhdGVbXSIsImJhdGNoSWQ6IElkIiwiZ3JvdXBJZDogSWQiLCJtYXJrZXJzOiBSZXBvcnRlZE1haWxGaWVsZE1hcmtlcltdIiwidHV0YW5vdGFFcnJvcjogRXJyb3IiLCJsZWFkZXJTdGF0dXM6IFdlYnNvY2tldExlYWRlclN0YXR1cyIsImNvdW50ZXI6IFdlYnNvY2tldENvdW50ZXJEYXRhIiwiZGF0YTogRW50aXR5VXBkYXRlW10iLCJncm91cEtleVVwZGF0ZXM6IElkVHVwbGVbXSIsImh0bWw6IHN0cmluZyIsInBhc3NwaHJhc2U6IHN0cmluZyIsInNhbHQ6IFVpbnQ4QXJyYXkiLCJuYXRpdmVDcnlwdG9GYWNhZGU6IE5hdGl2ZUNyeXB0b0ZhY2FkZSIsInRlc3RXQVNNPzogTGliT1FTRXhwb3J0cyIsInB1YmxpY0tleTogS3liZXJQdWJsaWNLZXkiLCJwcml2YXRlS2V5OiBLeWJlclByaXZhdGVLZXkiLCJjaXBoZXJ0ZXh0OiBVaW50OEFycmF5IiwibmF0aXZlQ3J5cHRvRmFjYWRlOiBOYXRpdmVDcnlwdG9GYWNhZGUiLCJlbmNvZGVkOiBVaW50OEFycmF5Iiwia3liZXJGYWNhZGU6IEt5YmVyRmFjYWRlIiwic2VuZGVySWRlbnRpdHlLZXlQYWlyOiBFY2NLZXlQYWlyIiwiZXBoZW1lcmFsS2V5UGFpcjogRWNjS2V5UGFpciIsInJlY2lwaWVudFB1YmxpY0tleXM6IFBRUHVibGljS2V5cyIsImJ1Y2tldEtleTogVWludDhBcnJheSIsImVuY29kZWRQUU1lc3NhZ2U6IFVpbnQ4QXJyYXkiLCJyZWNpcGllbnRLZXlzOiBQUUtleVBhaXJzIiwibWVzc2FnZTogUFFNZXNzYWdlIiwic2VuZGVySWRlbnRpdHlQdWJsaWNLZXk6IEVjY1B1YmxpY0tleSIsImVwaGVtZXJhbFB1YmxpY0tleTogRWNjUHVibGljS2V5Iiwia3liZXJDaXBoZXJUZXh0OiBVaW50OEFycmF5Iiwia3liZXJTaGFyZWRTZWNyZXQ6IFVpbnQ4QXJyYXkiLCJlY2NTaGFyZWRTZWNyZXQ6IEVjY1NoYXJlZFNlY3JldHMiLCJjcnlwdG9Qcm90b2NvbFZlcnNpb246IENyeXB0b1Byb3RvY29sVmVyc2lvbiIsImtleUNhY2hlOiBLZXlDYWNoZSIsInVzZXJGYWNhZGU6IFVzZXJGYWNhZGUiLCJlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCIsImNhY2hlTWFuYWdlbWVudEZhY2FkZTogbGF6eUFzeW5jPENhY2hlTWFuYWdlbWVudEZhY2FkZT4iLCJncm91cElkOiBJZCIsInJlcXVlc3RlZFZlcnNpb246IG51bWJlciIsImN1cnJlbnRHcm91cEtleT86IFZlcnNpb25lZEtleSIsImtleVBhaXJHcm91cElkOiBJZCIsImdyb3VwOiBHcm91cCIsImN1cnJlbnRHcm91cEtleTogVmVyc2lvbmVkS2V5Iiwia2V5UGFpcjogS2V5UGFpciB8IG51bGwiLCJzeW1Hcm91cEtleTogQWVzS2V5IiwidGFyZ2V0S2V5VmVyc2lvbjogbnVtYmVyIiwiZm9ybWVyS2V5czogR3JvdXBLZXlbXSIsImxhc3RHcm91cEtleUluc3RhbmNlOiBHcm91cEtleSB8IG51bGwiLCJpZDogSWQiLCJncm91cEtleTogQWVzS2V5IiwiZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQiLCJrZXlMb2FkZXJGYWNhZGU6IEtleUxvYWRlckZhY2FkZSIsInBxRmFjYWRlOiBQUUZhY2FkZSIsInNlcnZpY2VFeGVjdXRvcjogSVNlcnZpY2VFeGVjdXRvciIsImNyeXB0b1dyYXBwZXI6IENyeXB0b1dyYXBwZXIiLCJyZWNvdmVyQ29kZUZhY2FkZTogbGF6eUFzeW5jPFJlY292ZXJDb2RlRmFjYWRlPiIsInVzZXJGYWNhZGU6IFVzZXJGYWNhZGUiLCJjcnlwdG9GYWNhZGU6IENyeXB0b0ZhY2FkZSIsInNoYXJlRmFjYWRlOiBsYXp5QXN5bmM8U2hhcmVGYWNhZGU+IiwiZ3JvdXBNYW5hZ2VtZW50RmFjYWRlOiBsYXp5QXN5bmM8R3JvdXBNYW5hZ2VtZW50RmFjYWRlPiIsImFzeW1tZXRyaWNDcnlwdG9GYWNhZGU6IEFzeW1tZXRyaWNDcnlwdG9GYWNhZGUiLCJwd0tleTogQWVzMjU2S2V5IiwibW9kZXJuS2RmVHlwZTogYm9vbGVhbiIsInVzZXI6IFVzZXIiLCJhZG1pbk9yVXNlckdyb3VwS2V5Um90YXRpb25BcnJheTogQXJyYXk8S2V5Um90YXRpb24+IiwiaW52aXRhdGlvbkRhdGE6IEdyb3VwSW52aXRhdGlvblBvc3REYXRhW10iLCJwYXNzcGhyYXNlS2V5OiBBZXMyNTZLZXkiLCJrZXlSb3RhdGlvbjogS2V5Um90YXRpb24iLCJwcmVwYXJlZFJlSW52aXRlczogR3JvdXBJbnZpdGF0aW9uUG9zdERhdGFbXSIsImN1cnJlbnRVc2VyR3JvdXBLZXk6IFZlcnNpb25lZEtleSIsImN1cnJlbnRBZG1pbkdyb3VwS2V5OiBWZXJzaW9uZWRLZXkiLCJwdWJFY2NLZXk6IFVpbnQ4QXJyYXkiLCJwdWJLeWJlcktleTogVWludDhBcnJheSIsImFkbWluR3JvdXBLZXlWZXJzaW9uOiBudW1iZXIiLCJhZG1pbkdyb3VwSWQ6IElkIiwiY3VzdG9tZXJJZDogSWQiLCJncm91cFRvRXhjbHVkZTogSWQiLCJrZXlIYXNoZXM6IEFkbWluR3JvdXBLZXlBdXRoZW50aWNhdGlvbkRhdGFbXSIsInVzZXJHcm91cElkOiBJZCIsInVzZXJHcm91cEtleTogVmVyc2lvbmVkS2V5IiwiYWRtaW5Hcm91cElkOiBzdHJpbmciLCJ1c2VyRW5jTmV3R3JvdXBLZXk6IFZlcnNpb25lZEVuY3J5cHRlZEtleSIsInRhcmdldEdyb3VwSWQ6IHN0cmluZyIsInRhcmdldEdyb3VwOiBHcm91cCIsInVzZXJHcm91cDogR3JvdXAiLCJuZXdVc2VyR3JvdXBLZXlzOiBHZW5lcmF0ZWRHcm91cEtleXMiLCJuZXdBZG1pbkdyb3VwS2V5czogR2VuZXJhdGVkR3JvdXBLZXlzIiwicGFzc3BocmFzZUtleTogQWVzS2V5IiwicmVjb3ZlckNvZGVEYXRhOiBSZWNvdmVyQ29kZURhdGEgfCBudWxsIiwiY3VycmVudEdyb3VwS2V5OiBWZXJzaW9uZWRLZXkiLCJuZXdUYXJnZXRHcm91cEtleTogVmVyc2lvbmVkS2V5IiwicHJlcGFyZWRSZUludml0YXRpb25zOiBBcnJheTxHcm91cEludml0YXRpb25Qb3N0RGF0YT4iLCJtYWlsQWRkcmVzc2VzOiBzdHJpbmdbXSIsImdyb3VwOiBHcm91cCIsIm5ld0dyb3VwS2V5OiBWZXJzaW9uZWRLZXkiLCJncm91cElkOiBJZCIsIm90aGVyTWVtYmVyczogR3JvdXBNZW1iZXJbXSIsIm5vdEZvdW5kUmVjaXBpZW50czogQXJyYXk8c3RyaW5nPiIsIm5ld0tleXM6IEdlbmVyYXRlZEdyb3VwS2V5cyIsImFkbWluR3JvdXBLZXlzOiBWZXJzaW9uZWRLZXkiLCJ1c2VySWQ6IElkIiwiZ3JvdXBUb1JvdGF0ZTogR3JvdXAiLCJuZXdTeW1tZXRyaWNHcm91cEtleTogQWVzMjU2S2V5IiwicGVuZGluZ0tleVJvdGF0aW9uczogUGVuZGluZ0tleVJvdGF0aW9uIiwiZ3JvdXBLZXlVcGRhdGVJZHM6IElkVHVwbGVbXSIsImdyb3VwS2V5VXBkYXRlOiBHcm91cEtleVVwZGF0ZSIsInB3S2V5OiBBZXNLZXkiLCJ1c2VyR3JvdXBLZXlSb3RhdGlvbjogS2V5Um90YXRpb24iLCJwdWJsaWNLZXlHZXRPdXQ6IFB1YmxpY0tleUdldE91dCIsImFkbWluUHViS2V5czogVmVyc2lvbmVkPFB1YmxpY0tleXM+IiwicHFLZXlQYWlyOiBQUUtleVBhaXJzIiwia2V5OiBBZXNLZXkiLCJrZXlQYWlyOiBFbmNyeXB0ZWRQcUtleVBhaXJzIHwgbnVsbCIsIm5ld1VzZXJHcm91cEtleTogVmVyc2lvbmVkS2V5IiwidXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5OiBBZXMyNTZLZXkiLCJncm91cElkOiBJZCIsImtleUxvYWRlcjogKCkgPT4gUHJvbWlzZTxWZXJzaW9uZWRLZXk+IiwidXNlcjogVXNlciIsIm9mZmxpbmVTdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSIsInRpbWVSYW5nZURheXM6IG51bWJlciB8IG51bGwiLCJ1c2VySWQ6IElkIiwibm93OiBudW1iZXIiLCJsaXN0SWQ6IElkIiwiY3V0b2ZmSWQ6IElkIiwibWFpbHNUb0RlbGV0ZTogSWRUdXBsZVtdIiwiYXR0YWNobWVudHNUb0RlbGV0ZTogSWRUdXBsZVtdIiwibWFpbERldGFpbHNCbG9iVG9EZWxldGU6IElkVHVwbGVbXSIsIm1haWxEZXRhaWxzRHJhZnRUb0RlbGV0ZTogSWRUdXBsZVtdIiwibGlzdElkIiwiZW50cmllc0xpc3RJZDogSWQiLCJjdXRvZmZUaW1lc3RhbXA6IG51bWJlciIsIm1haWxTZXRFbnRyaWVzVG9EZWxldGU6IElkVHVwbGVbXSIsInNoaWZ0QnlEYXlzOiBudW1iZXIiLCJsb2NhdG9yOiBXb3JrZXJMb2NhdG9yVHlwZSIsIndvcmtlcjogV29ya2VySW1wbCIsImJyb3dzZXJEYXRhOiBCcm93c2VyRGF0YSIsImVycm9yOiBFcnJvciIsImNhY2hlOiBEZWZhdWx0RW50aXR5UmVzdENhY2hlIHwgbnVsbCIsImRhdGVQcm92aWRlciIsImxvZ2luTGlzdGVuZXI6IExvZ2luTGlzdGVuZXIiLCJzZXNzaW9uVHlwZTogU2Vzc2lvblR5cGUiLCJjYWNoZUluZm86IENhY2hlSW5mbyIsImNyZWRlbnRpYWxzOiBDcmVkZW50aWFscyIsInJlYXNvbjogTG9naW5GYWlsUmVhc29uIiwic2Vzc2lvbklkOiBJZFR1cGxlIiwiY2hhbGxlbmdlczogUmVhZG9ubHlBcnJheTxDaGFsbGVuZ2U+IiwibWFpbEFkZHJlc3M6IHN0cmluZyB8IG51bGwiLCJhcmdvbjJpZEZhY2FkZTogQXJnb24yaWRGYWNhZGUiLCJxdWV1ZWRCYXRjaDogUXVldWVkQmF0Y2hbXSIsImtleUxvYWRlckZhY2FkZTogS2V5TG9hZGVyRmFjYWRlIiwic2VsZjogRGVkaWNhdGVkV29ya2VyR2xvYmFsU2NvcGUiLCJzZWxmIiwiYnJvd3NlckRhdGE6IEJyb3dzZXJEYXRhIiwiZXZlbnQ6IFByb21pc2VSZWplY3Rpb25FdmVudCIsImU6IHN0cmluZyB8IEV2ZW50IiwibmJyT2ZCeXRlczogbnVtYmVyIiwiZXhwb3NlZFdvcmtlcjogRGVsYXllZEltcGxzPFdvcmtlckludGVyZmFjZT4iLCJtZXNzYWdlOiBXb3JrZXJSZXF1ZXN0IiwicmVxdWVzdFR5cGU6IHN0cmluZyIsImFyZ3M6IFJlYWRvbmx5QXJyYXk8dW5rbm93bj4iLCJlOiBFcnJvciJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9TdXNwZW5zaW9uSGFuZGxlci50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL0RldmljZUVuY3J5cHRpb25GYWNhZGUudHMiLCIuLi9zcmMvY29tbW9uL25hdGl2ZS93b3JrZXIvQWVzQXBwLnRzIiwiLi4vc3JjL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9OYXRpdmVDcnlwdG9GYWNhZGVTZW5kRGlzcGF0Y2hlci50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9jcnlwdG8vUnNhSW1wbGVtZW50YXRpb24udHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvY3J5cHRvL0FzeW1tZXRyaWNDcnlwdG9GYWNhZGUudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvY3J5cHRvL0NyeXB0b0ZhY2FkZS50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9jcnlwdG8vSW5zdGFuY2VNYXBwZXIudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvcmVzdC9BZG1pbkNsaWVudER1bW15RW50aXR5UmVzdENhY2hlLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL3V0aWxzL1NsZWVwRGV0ZWN0b3IudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvcmVzdC9FcGhlbWVyYWxDYWNoZVN0b3JhZ2UudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvcmVzdC9DYWNoZVN0b3JhZ2VQcm94eS50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9yZXN0L1NlcnZpY2VFeGVjdXRvci50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL1VzZXJGYWNhZGUudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9TdGFuZGFyZE1pZ3JhdGlvbnMudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3N5cy12OTQudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3R1dGFub3RhLXY2Ni50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL21pZ3JhdGlvbnMvc3lzLXY5Mi50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL21pZ3JhdGlvbnMvdHV0YW5vdGEtdjY1LnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy9zeXMtdjkxLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy9zeXMtdjkwLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy90dXRhbm90YS12NjQudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3R1dGFub3RhLXY2Ny50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL21pZ3JhdGlvbnMvc3lzLXY5Ni50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL21pZ3JhdGlvbnMvdHV0YW5vdGEtdjY5LnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy9zeXMtdjk3LnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy90dXRhbm90YS12NzEudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3N5cy12OTkudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3N5cy12MTAxLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy9zeXMtdjEwMi50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL21pZ3JhdGlvbnMvdHV0YW5vdGEtdjcyLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy9zeXMtdjEwMy50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL21pZ3JhdGlvbnMvdHV0YW5vdGEtdjczLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy9zeXMtdjEwNC50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL21pZ3JhdGlvbnMvc3lzLXYxMDUudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3N5cy12MTA2LnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy90dXRhbm90YS12NzQudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3N5cy12MTA3LnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy90dXRhbm90YS12NzUudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3N5cy12MTExLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy90dXRhbm90YS12NzYudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3N5cy12MTEyLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy90dXRhbm90YS12NzcudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3N5cy12MTE0LnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy9vZmZsaW5lMi50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL21pZ3JhdGlvbnMvc3lzLXYxMTUudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3R1dGFub3RhLXY3OC50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL21pZ3JhdGlvbnMvc3lzLXYxMTYudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3R1dGFub3RhLXY3OS50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL21pZ3JhdGlvbnMvb2ZmbGluZTMudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3N5cy12MTE4LnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvbWlncmF0aW9ucy90dXRhbm90YS12ODAudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvb2ZmbGluZS9taWdyYXRpb25zL3N0b3JhZ2UtdjExLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvT2ZmbGluZVN0b3JhZ2VNaWdyYXRvci50cyIsIi4uL3NyYy9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvU3FsQ2lwaGVyRmFjYWRlU2VuZERpc3BhdGNoZXIudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9FbnRyb3B5RmFjYWRlLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvQmxvYkFjY2Vzc1Rva2VuRmFjYWRlLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL2NyeXB0by9Pd25lckVuY1Nlc3Npb25LZXlzVXBkYXRlUXVldWUudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvRXZlbnRCdXNFdmVudENvb3JkaW5hdG9yLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvV29ya2VyRmFjYWRlLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvQXJnb24yaWRGYWNhZGUudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9LeWJlckZhY2FkZS50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL1BRTWVzc2FnZS50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL1BRRmFjYWRlLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvS2V5TG9hZGVyRmFjYWRlLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvS2V5Um90YXRpb25GYWNhZGUudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9LZXlDYWNoZS50cyIsIi4uL3NyYy9tYWlsLWFwcC93b3JrZXJVdGlscy9vZmZsaW5lL01haWxPZmZsaW5lQ2xlYW5lci50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9EYXRlUHJvdmlkZXIudHMiLCIuLi9zcmMvbWFpbC1hcHAvd29ya2VyVXRpbHMvd29ya2VyL1dvcmtlckxvY2F0b3IudHMiLCIuLi9zcmMvbWFpbC1hcHAvd29ya2VyVXRpbHMvd29ya2VyL1dvcmtlckltcGwudHMiLCIuLi9zcmMvbWFpbC1hcHAvd29ya2VyVXRpbHMvd29ya2VyL21haWwtd29ya2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRGVmZXJyZWRPYmplY3QgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGRlZmVyLCBub09wIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgdHlwZSB7IFN5c3RlbVRpbWVvdXQgfSBmcm9tIFwiLi4vY29tbW9uL3V0aWxzL1NjaGVkdWxlci5qc1wiXG5pbXBvcnQgeyBJbmZvTWVzc2FnZUhhbmRsZXIgfSBmcm9tIFwiLi4vLi4vZ3VpL0luZm9NZXNzYWdlSGFuZGxlci5qc1wiXG5cbmV4cG9ydCBjbGFzcyBTdXNwZW5zaW9uSGFuZGxlciB7XG5cdF9pc1N1c3BlbmRlZDogYm9vbGVhblxuXHRfc3VzcGVuZGVkVW50aWw6IG51bWJlclxuXHRfZGVmZXJyZWRSZXF1ZXN0czogQXJyYXk8RGVmZXJyZWRPYmplY3Q8YW55Pj5cblx0X2hhc1NlbnRJbmZvTWVzc2FnZTogYm9vbGVhblxuXHRfdGltZW91dDogU3lzdGVtVGltZW91dFxuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgaW5mb01lc3NhZ2VIYW5kbGVyOiBJbmZvTWVzc2FnZUhhbmRsZXIsIHN5c3RlbVRpbWVvdXQ6IFN5c3RlbVRpbWVvdXQpIHtcblx0XHR0aGlzLl9pc1N1c3BlbmRlZCA9IGZhbHNlXG5cdFx0dGhpcy5fc3VzcGVuZGVkVW50aWwgPSAwXG5cdFx0dGhpcy5fZGVmZXJyZWRSZXF1ZXN0cyA9IFtdXG5cdFx0dGhpcy5faGFzU2VudEluZm9NZXNzYWdlID0gZmFsc2Vcblx0XHR0aGlzLl90aW1lb3V0ID0gc3lzdGVtVGltZW91dFxuXHR9XG5cblx0LyoqXG5cdCAqIEFjdGl2YXRlcyBzdXNwZW5zaW9uIHN0YXRlcyBmb3IgdGhlIGdpdmVuIGFtb3VudCBvZiBzZWNvbmRzLiBBZnRlciB0aGUgZW5kIG9mIHRoZSBzdXNwZW5zaW9uIHRpbWUgYWxsIGRlZmVycmVkIHJlcXVlc3RzIGFyZSBleGVjdXRlZC5cblx0ICovXG5cdC8vIGlmIGFscmVhZHkgc3VzcGVuZGVkIGRvIHdlIHdhbnQgdG8gaWdub3JlIGluY29taW5nIHN1c3BlbnNpb25zP1xuXHRhY3RpdmF0ZVN1c3BlbnNpb25JZkluYWN0aXZlKHN1c3BlbnNpb25EdXJhdGlvblNlY29uZHM6IG51bWJlciwgcmVzb3VyY2VVUkw6IFVSTCkge1xuXHRcdGlmICghdGhpcy5pc1N1c3BlbmRlZCgpKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhgQWN0aXZhdGluZyBzdXNwZW5zaW9uICgke3Jlc291cmNlVVJMfSk6ICAke3N1c3BlbnNpb25EdXJhdGlvblNlY29uZHN9c2ApXG5cdFx0XHR0aGlzLl9pc1N1c3BlbmRlZCA9IHRydWVcblx0XHRcdGNvbnN0IHN1c3BlbnNpb25TdGFydFRpbWUgPSBEYXRlLm5vdygpXG5cblx0XHRcdHRoaXMuX3RpbWVvdXQuc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG5cdFx0XHRcdHRoaXMuX2lzU3VzcGVuZGVkID0gZmFsc2Vcblx0XHRcdFx0Y29uc29sZS5sb2coYFN1c3BlbnNpb24gcmVsZWFzZWQgYWZ0ZXIgJHsoRGF0ZS5ub3coKSAtIHN1c3BlbnNpb25TdGFydFRpbWUpIC8gMTAwMH1zYClcblx0XHRcdFx0YXdhaXQgdGhpcy5fb25TdXNwZW5zaW9uQ29tcGxldGUoKVxuXHRcdFx0fSwgc3VzcGVuc2lvbkR1cmF0aW9uU2Vjb25kcyAqIDEwMDApXG5cblx0XHRcdGlmICghdGhpcy5faGFzU2VudEluZm9NZXNzYWdlKSB7XG5cdFx0XHRcdHRoaXMuaW5mb01lc3NhZ2VIYW5kbGVyLm9uSW5mb01lc3NhZ2Uoe1xuXHRcdFx0XHRcdHRyYW5zbGF0aW9uS2V5OiBcImNsaWVudFN1c3BlbnNpb25XYWl0X2xhYmVsXCIsXG5cdFx0XHRcdFx0YXJnczoge30sXG5cdFx0XHRcdH0pXG5cblx0XHRcdFx0dGhpcy5faGFzU2VudEluZm9NZXNzYWdlID0gdHJ1ZVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlzU3VzcGVuZGVkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLl9pc1N1c3BlbmRlZFxuXHR9XG5cblx0LyoqXG5cdCAqIEFkZHMgYSByZXF1ZXN0IHRvIHRoZSBkZWZlcnJlZCBxdWV1ZS5cblx0ICogQHBhcmFtIHJlcXVlc3Rcblx0ICogQHJldHVybnMge1Byb21pc2U8VD59XG5cdCAqL1xuXHRkZWZlclJlcXVlc3QocmVxdWVzdDogKCkgPT4gUHJvbWlzZTxhbnk+KTogUHJvbWlzZTxhbnk+IHtcblx0XHRpZiAodGhpcy5faXNTdXNwZW5kZWQpIHtcblx0XHRcdGNvbnN0IGRlZmVycmVkT2JqZWN0ID0gZGVmZXIoKVxuXG5cdFx0XHR0aGlzLl9kZWZlcnJlZFJlcXVlc3RzLnB1c2goZGVmZXJyZWRPYmplY3QpXG5cblx0XHRcdC8vIGFzc2lnbiByZXF1ZXN0IHByb21pc2UgdG8gZGVmZXJyZWQgb2JqZWN0XG5cdFx0XHRkZWZlcnJlZE9iamVjdC5wcm9taXNlID0gZGVmZXJyZWRPYmplY3QucHJvbWlzZS50aGVuKCgpID0+IHJlcXVlc3QoKSlcblx0XHRcdHJldHVybiBkZWZlcnJlZE9iamVjdC5wcm9taXNlXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGlmIHN1c3BlbnNpb24gaXMgbm90IGFjdGl2YXRlZCB0aGVuIGltbWVkaWF0ZWx5IGV4ZWN1dGUgdGhlIHJlcXVlc3Rcblx0XHRcdHJldHVybiByZXF1ZXN0KClcblx0XHR9XG5cdH1cblxuXHRhc3luYyBfb25TdXNwZW5zaW9uQ29tcGxldGUoKSB7XG5cdFx0Y29uc3QgZGVmZXJyZWRSZXF1ZXN0cyA9IHRoaXMuX2RlZmVycmVkUmVxdWVzdHNcblx0XHR0aGlzLl9kZWZlcnJlZFJlcXVlc3RzID0gW11cblxuXHRcdC8vIGRvIHdlZSBuZWVkIHRvIGRlbGF5IHRob3NlIHJlcXVlc3RzP1xuXHRcdGZvciAobGV0IGRlZmVycmVkUmVxdWVzdCBvZiBkZWZlcnJlZFJlcXVlc3RzKSB7XG5cdFx0XHRkZWZlcnJlZFJlcXVlc3QucmVzb2x2ZShudWxsKVxuXHRcdFx0Ly8gSWdub3JlIGFsbCBlcnJvcnMgaGVyZSwgYW55IGVycm9ycyBzaG91bGQgYmUgY2F1Z2h0IGJ5IHdob2V2ZXIgaXMgaGFuZGxpbmcgdGhlIGRlZmVycmVkIHJlcXVlc3Rcblx0XHRcdGF3YWl0IGRlZmVycmVkUmVxdWVzdC5wcm9taXNlLmNhdGNoKG5vT3ApXG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgeyBhZXMyNTZSYW5kb21LZXksIGFlc0RlY3J5cHQsIGFlc0VuY3J5cHQsIGJpdEFycmF5VG9VaW50OEFycmF5LCB1aW50OEFycmF5VG9CaXRBcnJheSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtY3J5cHRvXCJcblxuZXhwb3J0IGNsYXNzIERldmljZUVuY3J5cHRpb25GYWNhZGUge1xuXHQvKipcblx0ICogR2VuZXJhdGVzIGFuIGVuY3J5cHRpb24ga2V5LlxuXHQgKi9cblx0YXN5bmMgZ2VuZXJhdGVLZXkoKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG5cdFx0cmV0dXJuIGJpdEFycmF5VG9VaW50OEFycmF5KGFlczI1NlJhbmRvbUtleSgpKVxuXHR9XG5cblx0LyoqXG5cdCAqIEVuY3J5cHRzIHtAcGFyYW0gZGF0YX0gdXNpbmcge0BwYXJhbSBkZXZpY2VLZXl9LlxuXHQgKiBAcGFyYW0gZGV2aWNlS2V5IEtleSB1c2VkIGZvciBlbmNyeXB0aW9uXG5cdCAqIEBwYXJhbSBkYXRhIERhdGEgdG8gZW5jcnlwdC5cblx0ICovXG5cdGFzeW5jIGVuY3J5cHQoZGV2aWNlS2V5OiBVaW50OEFycmF5LCBkYXRhOiBVaW50OEFycmF5KTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG5cdFx0cmV0dXJuIGFlc0VuY3J5cHQodWludDhBcnJheVRvQml0QXJyYXkoZGV2aWNlS2V5KSwgZGF0YSlcblx0fVxuXG5cdC8qKlxuXHQgKiBEZWNyeXB0cyB7QHBhcmFtIGVuY3J5cHRlZERhdGF9IHVzaW5nIHtAcGFyYW0gZGV2aWNlS2V5fS5cblx0ICogQHBhcmFtIGRldmljZUtleSBLZXkgdXNlZCBmb3IgZW5jcnlwdGlvblxuXHQgKiBAcGFyYW0gZW5jcnlwdGVkRGF0YSBEYXRhIHRvIGJlIGRlY3J5cHRlZC5cblx0ICovXG5cdGFzeW5jIGRlY3J5cHQoZGV2aWNlS2V5OiBVaW50OEFycmF5LCBlbmNyeXB0ZWREYXRhOiBVaW50OEFycmF5KTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG5cdFx0cmV0dXJuIGFlc0RlY3J5cHQodWludDhBcnJheVRvQml0QXJyYXkoZGV2aWNlS2V5KSwgZW5jcnlwdGVkRGF0YSlcblx0fVxufVxuIiwiaW1wb3J0IHsgQWVzS2V5LCBJVl9CWVRFX0xFTkdUSCwga2V5VG9VaW50OEFycmF5LCBSYW5kb21pemVyIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS1jcnlwdG9cIlxuaW1wb3J0IHsgRmlsZVVyaSB9IGZyb20gXCIuLi9jb21tb24vRmlsZUFwcFwiXG5pbXBvcnQgeyBOYXRpdmVDcnlwdG9GYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9OYXRpdmVDcnlwdG9GYWNhZGVcIlxuaW1wb3J0IHsgRW5jcnlwdGVkRmlsZUluZm8gfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9FbmNyeXB0ZWRGaWxlSW5mb1wiXG5cbmV4cG9ydCBjbGFzcyBBZXNBcHAge1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IG5hdGl2ZUNyeXB0b0ZhY2FkZTogTmF0aXZlQ3J5cHRvRmFjYWRlLCBwcml2YXRlIHJlYWRvbmx5IHJhbmRvbTogUmFuZG9taXplcikge31cblxuXHQvKipcblx0ICogRW5jcnlwdHMgYSBmaWxlIHdpdGggdGhlIHByb3ZpZGVkIGtleVxuXHQgKiBAcmV0dXJuIFJldHVybnMgdGhlIFVSSSBvZiB0aGUgZGVjcnlwdGVkIGZpbGUuIFJlc29sdmVzIHRvIGFuIGV4Y2VwdGlvbiBpZiB0aGUgZW5jcnlwdGlvbiBmYWlsZWQuXG5cdCAqL1xuXHRhZXNFbmNyeXB0RmlsZShrZXk6IEFlc0tleSwgZmlsZVVybDogRmlsZVVyaSk6IFByb21pc2U8RW5jcnlwdGVkRmlsZUluZm8+IHtcblx0XHRjb25zdCBpdiA9IHRoaXMucmFuZG9tLmdlbmVyYXRlUmFuZG9tRGF0YShJVl9CWVRFX0xFTkdUSClcblx0XHRjb25zdCBlbmNvZGVkS2V5ID0ga2V5VG9VaW50OEFycmF5KGtleSlcblx0XHRyZXR1cm4gdGhpcy5uYXRpdmVDcnlwdG9GYWNhZGUuYWVzRW5jcnlwdEZpbGUoZW5jb2RlZEtleSwgZmlsZVVybCwgaXYpXG5cdH1cblxuXHQvKipcblx0ICogRGVjcnlwdCBieXRlcyB3aXRoIHRoZSBwcm92aWRlZCBrZXlcblx0ICogQHJldHVybiBSZXR1cm5zIHRoZSBVUkkgb2YgdGhlIGRlY3J5cHRlZCBmaWxlLiBSZXNvbHZlcyB0byBhbiBleGNlcHRpb24gaWYgdGhlIGVuY3J5cHRpb24gZmFpbGVkLlxuXHQgKi9cblx0YWVzRGVjcnlwdEZpbGUoa2V5OiBBZXNLZXksIGZpbGVVcmw6IEZpbGVVcmkpOiBQcm9taXNlPEZpbGVVcmk+IHtcblx0XHRjb25zdCBlbmNvZGVkS2V5ID0ga2V5VG9VaW50OEFycmF5KGtleSlcblx0XHRyZXR1cm4gdGhpcy5uYXRpdmVDcnlwdG9GYWNhZGUuYWVzRGVjcnlwdEZpbGUoZW5jb2RlZEtleSwgZmlsZVVybClcblx0fVxufVxuIiwiLyogZ2VuZXJhdGVkIGZpbGUsIGRvbid0IGVkaXQuICovXG5cbmltcG9ydCB7IE5hdGl2ZUNyeXB0b0ZhY2FkZSB9IGZyb20gXCIuL05hdGl2ZUNyeXB0b0ZhY2FkZS5qc1wiXG5cbmludGVyZmFjZSBOYXRpdmVJbnRlcmZhY2Uge1xuXHRpbnZva2VOYXRpdmUocmVxdWVzdFR5cGU6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogUHJvbWlzZTxhbnk+XG59XG5leHBvcnQgY2xhc3MgTmF0aXZlQ3J5cHRvRmFjYWRlU2VuZERpc3BhdGNoZXIgaW1wbGVtZW50cyBOYXRpdmVDcnlwdG9GYWNhZGUge1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHRyYW5zcG9ydDogTmF0aXZlSW50ZXJmYWNlKSB7fVxuXHRhc3luYyByc2FFbmNyeXB0KC4uLmFyZ3M6IFBhcmFtZXRlcnM8TmF0aXZlQ3J5cHRvRmFjYWRlW1wicnNhRW5jcnlwdFwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk5hdGl2ZUNyeXB0b0ZhY2FkZVwiLCBcInJzYUVuY3J5cHRcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgcnNhRGVjcnlwdCguLi5hcmdzOiBQYXJhbWV0ZXJzPE5hdGl2ZUNyeXB0b0ZhY2FkZVtcInJzYURlY3J5cHRcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJOYXRpdmVDcnlwdG9GYWNhZGVcIiwgXCJyc2FEZWNyeXB0XCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGFlc0VuY3J5cHRGaWxlKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TmF0aXZlQ3J5cHRvRmFjYWRlW1wiYWVzRW5jcnlwdEZpbGVcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJOYXRpdmVDcnlwdG9GYWNhZGVcIiwgXCJhZXNFbmNyeXB0RmlsZVwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBhZXNEZWNyeXB0RmlsZSguLi5hcmdzOiBQYXJhbWV0ZXJzPE5hdGl2ZUNyeXB0b0ZhY2FkZVtcImFlc0RlY3J5cHRGaWxlXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiTmF0aXZlQ3J5cHRvRmFjYWRlXCIsIFwiYWVzRGVjcnlwdEZpbGVcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgYXJnb24yaWRHZW5lcmF0ZVBhc3NwaHJhc2VLZXkoLi4uYXJnczogUGFyYW1ldGVyczxOYXRpdmVDcnlwdG9GYWNhZGVbXCJhcmdvbjJpZEdlbmVyYXRlUGFzc3BocmFzZUtleVwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk5hdGl2ZUNyeXB0b0ZhY2FkZVwiLCBcImFyZ29uMmlkR2VuZXJhdGVQYXNzcGhyYXNlS2V5XCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGdlbmVyYXRlS3liZXJLZXlwYWlyKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TmF0aXZlQ3J5cHRvRmFjYWRlW1wiZ2VuZXJhdGVLeWJlcktleXBhaXJcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJOYXRpdmVDcnlwdG9GYWNhZGVcIiwgXCJnZW5lcmF0ZUt5YmVyS2V5cGFpclwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBreWJlckVuY2Fwc3VsYXRlKC4uLmFyZ3M6IFBhcmFtZXRlcnM8TmF0aXZlQ3J5cHRvRmFjYWRlW1wia3liZXJFbmNhcHN1bGF0ZVwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIk5hdGl2ZUNyeXB0b0ZhY2FkZVwiLCBcImt5YmVyRW5jYXBzdWxhdGVcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMga3liZXJEZWNhcHN1bGF0ZSguLi5hcmdzOiBQYXJhbWV0ZXJzPE5hdGl2ZUNyeXB0b0ZhY2FkZVtcImt5YmVyRGVjYXBzdWxhdGVcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJOYXRpdmVDcnlwdG9GYWNhZGVcIiwgXCJreWJlckRlY2Fwc3VsYXRlXCIsIC4uLmFyZ3NdKVxuXHR9XG59XG4iLCJpbXBvcnQgdHlwZSB7IE5hdGl2ZUludGVyZmFjZSB9IGZyb20gXCIuLi8uLi8uLi9uYXRpdmUvY29tbW9uL05hdGl2ZUludGVyZmFjZVwiXG5pbXBvcnQgeyBpc0FwcCB9IGZyb20gXCIuLi8uLi9jb21tb24vRW52XCJcbmltcG9ydCB0eXBlIHsgUnNhUHJpdmF0ZUtleSwgUnNhUHVibGljS2V5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS1jcnlwdG9cIlxuaW1wb3J0IHsgcmFuZG9tLCByc2FEZWNyeXB0LCByc2FFbmNyeXB0IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS1jcnlwdG9cIlxuaW1wb3J0IHsgTmF0aXZlQ3J5cHRvRmFjYWRlU2VuZERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vLi4vLi4vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTmF0aXZlQ3J5cHRvRmFjYWRlU2VuZERpc3BhdGNoZXJcIlxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlUnNhSW1wbGVtZW50YXRpb24obmF0aXZlOiBOYXRpdmVJbnRlcmZhY2UpOiBQcm9taXNlPFJzYUltcGxlbWVudGF0aW9uPiB7XG5cdGlmIChpc0FwcCgpKSB7XG5cdFx0Y29uc3QgeyBSc2FBcHAgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uL25hdGl2ZS93b3JrZXIvUnNhQXBwXCIpXG5cdFx0cmV0dXJuIG5ldyBSc2FBcHAobmV3IE5hdGl2ZUNyeXB0b0ZhY2FkZVNlbmREaXNwYXRjaGVyKG5hdGl2ZSksIHJhbmRvbSlcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gbmV3IFJzYVdlYigpXG5cdH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBSc2FJbXBsZW1lbnRhdGlvbiB7XG5cdGVuY3J5cHQocHVibGljS2V5OiBSc2FQdWJsaWNLZXksIGJ5dGVzOiBVaW50OEFycmF5KTogUHJvbWlzZTxVaW50OEFycmF5PlxuXG5cdGRlY3J5cHQocHJpdmF0ZUtleTogUnNhUHJpdmF0ZUtleSwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPFVpbnQ4QXJyYXk+XG59XG5cbmV4cG9ydCBjbGFzcyBSc2FXZWIgaW1wbGVtZW50cyBSc2FJbXBsZW1lbnRhdGlvbiB7XG5cdGFzeW5jIGVuY3J5cHQocHVibGljS2V5OiBSc2FQdWJsaWNLZXksIGJ5dGVzOiBVaW50OEFycmF5KTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG5cdFx0Y29uc3Qgc2VlZCA9IHJhbmRvbS5nZW5lcmF0ZVJhbmRvbURhdGEoMzIpXG5cdFx0cmV0dXJuIHJzYUVuY3J5cHQocHVibGljS2V5LCBieXRlcywgc2VlZClcblx0fVxuXG5cdGFzeW5jIGRlY3J5cHQocHJpdmF0ZUtleTogUnNhUHJpdmF0ZUtleSwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcblx0XHRyZXR1cm4gcnNhRGVjcnlwdChwcml2YXRlS2V5LCBieXRlcylcblx0fVxufVxuIiwiaW1wb3J0IHsgYXNzZXJ0V29ya2VyT3JOb2RlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHtcblx0QWVzS2V5LFxuXHRBc3ltbWV0cmljS2V5UGFpcixcblx0QXN5bW1ldHJpY1B1YmxpY0tleSxcblx0Yml0QXJyYXlUb1VpbnQ4QXJyYXksXG5cdEVjY0tleVBhaXIsXG5cdEVjY1B1YmxpY0tleSxcblx0aGV4VG9Sc2FQdWJsaWNLZXksXG5cdGlzUHFLZXlQYWlycyxcblx0aXNQcVB1YmxpY0tleSxcblx0aXNSc2FFY2NLZXlQYWlyLFxuXHRpc1JzYU9yUnNhRWNjS2V5UGFpcixcblx0aXNSc2FQdWJsaWNLZXksXG5cdEtleVBhaXJUeXBlLFxuXHRQUVB1YmxpY0tleXMsXG5cdFJzYVByaXZhdGVLZXksXG5cdHVpbnQ4QXJyYXlUb0JpdEFycmF5LFxufSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLWNyeXB0b1wiXG5pbXBvcnQgdHlwZSB7IFJzYUltcGxlbWVudGF0aW9uIH0gZnJvbSBcIi4vUnNhSW1wbGVtZW50YXRpb25cIlxuaW1wb3J0IHsgUFFGYWNhZGUgfSBmcm9tIFwiLi4vZmFjYWRlcy9QUUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBDcnlwdG9FcnJvciB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtY3J5cHRvL2Vycm9yLmpzXCJcbmltcG9ydCB7IGFzQ3J5cHRvUHJvdG9vY29sVmVyc2lvbiwgQ3J5cHRvUHJvdG9jb2xWZXJzaW9uLCBFbmNyeXB0aW9uQXV0aFN0YXR1cywgUHVibGljS2V5SWRlbnRpZmllclR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGFycmF5RXF1YWxzLCBhc3NlcnROb3ROdWxsLCB1aW50OEFycmF5VG9IZXgsIFZlcnNpb25lZCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgS2V5TG9hZGVyRmFjYWRlIH0gZnJvbSBcIi4uL2ZhY2FkZXMvS2V5TG9hZGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgY3JlYXRlUHVibGljS2V5R2V0SW4sIGNyZWF0ZVB1YmxpY0tleVB1dEluLCBQdWJFbmNLZXlEYXRhLCB0eXBlIFB1YmxpY0tleUdldE91dCB9IGZyb20gXCIuLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgQ3J5cHRvV3JhcHBlciB9IGZyb20gXCIuL0NyeXB0b1dyYXBwZXIuanNcIlxuaW1wb3J0IHsgUHVibGljS2V5U2VydmljZSB9IGZyb20gXCIuLi8uLi9lbnRpdGllcy9zeXMvU2VydmljZXMuanNcIlxuaW1wb3J0IHsgSVNlcnZpY2VFeGVjdXRvciB9IGZyb20gXCIuLi8uLi9jb21tb24vU2VydmljZVJlcXVlc3QuanNcIlxuXG5hc3NlcnRXb3JrZXJPck5vZGUoKVxuXG5leHBvcnQgdHlwZSBEZWNhcHN1bGF0ZWRBZXNLZXkgPSB7XG5cdGRlY3J5cHRlZEFlc0tleTogQWVzS2V5XG5cdHNlbmRlcklkZW50aXR5UHViS2V5OiBFY2NQdWJsaWNLZXkgfCBudWxsIC8vIGZvciBhdXRoZW50aWNhdGlvbjogbnVsbCBmb3IgcnNhIG9ubHlcbn1cblxuZXhwb3J0IHR5cGUgUHVibGljS2V5SWRlbnRpZmllciA9IHtcblx0aWRlbnRpZmllcjogc3RyaW5nXG5cdGlkZW50aWZpZXJUeXBlOiBQdWJsaWNLZXlJZGVudGlmaWVyVHlwZVxufVxuXG5leHBvcnQgdHlwZSBQdWJFbmNTeW1LZXkgPSB7XG5cdHB1YkVuY1N5bUtleUJ5dGVzOiBVaW50OEFycmF5XG5cdGNyeXB0b1Byb3RvY29sVmVyc2lvbjogQ3J5cHRvUHJvdG9jb2xWZXJzaW9uXG5cdHNlbmRlcktleVZlcnNpb246IG51bWJlciB8IG51bGxcblx0cmVjaXBpZW50S2V5VmVyc2lvbjogbnVtYmVyXG59XG5leHBvcnQgdHlwZSBQdWJsaWNLZXlzID0ge1xuXHRwdWJSc2FLZXk6IG51bGwgfCBVaW50OEFycmF5XG5cdHB1YkVjY0tleTogbnVsbCB8IFVpbnQ4QXJyYXlcblx0cHViS3liZXJLZXk6IG51bGwgfCBVaW50OEFycmF5XG59XG5cbi8qKlxuICogVGhpcyBjbGFzcyBpcyByZXNwb25zaWJsZSBmb3IgYXN5bW1ldHJpYyBlbmNyeXB0aW9uIGFuZCBkZWNyeXB0aW9uLlxuICogSXQgdHJpZXMgdG8gaGlkZSB0aGUgY29tcGxleGl0eSBiZWhpbmQgaGFuZGxpbmcgZGlmZmVyZW50IGFzeW1tZXRyaWMgcHJvdG9jb2wgdmVyc2lvbnMgc3VjaCBhcyBSU0EgYW5kIFR1dGFDcnlwdC5cbiAqL1xuZXhwb3J0IGNsYXNzIEFzeW1tZXRyaWNDcnlwdG9GYWNhZGUge1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IHJzYTogUnNhSW1wbGVtZW50YXRpb24sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBwcUZhY2FkZTogUFFGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBrZXlMb2FkZXJGYWNhZGU6IEtleUxvYWRlckZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNyeXB0b1dyYXBwZXI6IENyeXB0b1dyYXBwZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzZXJ2aWNlRXhlY3V0b3I6IElTZXJ2aWNlRXhlY3V0b3IsXG5cdCkge31cblxuXHQvKipcblx0ICogVmVyaWZpZXMgd2hldGhlciB0aGUga2V5IHRoYXQgdGhlIHB1YmxpYyBrZXkgc2VydmljZSByZXR1cm5zIGlzIHRoZSBzYW1lIGFzIHRoZSBvbmUgdXNlZCBmb3IgZW5jcnlwdGlvbi5cblx0ICogV2hlbiB3ZSBoYXZlIGtleSB2ZXJpZmljYXRpb24gd2Ugc2hvdWxkIHN0b3AgdmVyaWZ5aW5nIGFnYWluc3QgdGhlIFB1YmxpY0tleVNlcnZpY2UgYnV0IGFnYWluc3QgdGhlIHZlcmlmaWVkIGtleS5cblx0ICpcblx0ICogQHBhcmFtIGlkZW50aWZpZXIgdGhlIGlkZW50aWZpZXIgdG8gbG9hZCB0aGUgcHVibGljIGtleSB0byB2ZXJpZnkgdGhhdCBpdCBtYXRjaGVzIHRoZSBvbmUgdXNlZCBpbiB0aGUgcHJvdG9jb2wgcnVuLlxuXHQgKiBAcGFyYW0gc2VuZGVySWRlbnRpdHlQdWJLZXkgdGhlIHNlbmRlcklkZW50aXR5UHViS2V5IHRoYXQgd2FzIHVzZWQgdG8gZW5jcnlwdC9hdXRoZW50aWNhdGUgdGhlIGRhdGEuXG5cdCAqIEBwYXJhbSBzZW5kZXJLZXlWZXJzaW9uIHRoZSB2ZXJzaW9uIG9mIHRoZSBzZW5kZXJJZGVudGl0eVB1YktleS5cblx0ICovXG5cdGFzeW5jIGF1dGhlbnRpY2F0ZVNlbmRlcihpZGVudGlmaWVyOiBQdWJsaWNLZXlJZGVudGlmaWVyLCBzZW5kZXJJZGVudGl0eVB1YktleTogVWludDhBcnJheSwgc2VuZGVyS2V5VmVyc2lvbjogbnVtYmVyKTogUHJvbWlzZTxFbmNyeXB0aW9uQXV0aFN0YXR1cz4ge1xuXHRcdGNvbnN0IGtleURhdGEgPSBjcmVhdGVQdWJsaWNLZXlHZXRJbih7XG5cdFx0XHRpZGVudGlmaWVyOiBpZGVudGlmaWVyLmlkZW50aWZpZXIsXG5cdFx0XHRpZGVudGlmaWVyVHlwZTogaWRlbnRpZmllci5pZGVudGlmaWVyVHlwZSxcblx0XHRcdHZlcnNpb246IHNlbmRlcktleVZlcnNpb24udG9TdHJpbmcoKSxcblx0XHR9KVxuXHRcdGNvbnN0IHB1YmxpY0tleUdldE91dCA9IGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLmdldChQdWJsaWNLZXlTZXJ2aWNlLCBrZXlEYXRhKVxuXHRcdHJldHVybiBwdWJsaWNLZXlHZXRPdXQucHViRWNjS2V5ICE9IG51bGwgJiYgYXJyYXlFcXVhbHMocHVibGljS2V5R2V0T3V0LnB1YkVjY0tleSwgc2VuZGVySWRlbnRpdHlQdWJLZXkpXG5cdFx0XHQ/IEVuY3J5cHRpb25BdXRoU3RhdHVzLlRVVEFDUllQVF9BVVRIRU5USUNBVElPTl9TVUNDRUVERURcblx0XHRcdDogRW5jcnlwdGlvbkF1dGhTdGF0dXMuVFVUQUNSWVBUX0FVVEhFTlRJQ0FUSU9OX0ZBSUxFRFxuXHR9XG5cblx0LyoqXG5cdCAqIERlY3J5cHRzIHRoZSBwdWJFbmNTeW1LZXkgd2l0aCB0aGUgcmVjaXBpZW50S2V5UGFpciBhbmQgYXV0aGVudGljYXRlcyBpdCBpZiB0aGUgcHJvdG9jb2wgc3VwcG9ydHMgYXV0aGVudGljYXRpb24uXG5cdCAqIElmIHRoZSBwcm90b2NvbCBkb2VzIG5vdCBzdXBwb3J0IGF1dGhlbnRpY2F0aW9uIHRoaXMgbWV0aG9kIHdpbGwgb25seSBkZWNyeXB0LlxuXHQgKiBAcGFyYW0gcmVjaXBpZW50S2V5UGFpciB0aGUgcmVjaXBpZW50S2V5UGFpci4gTXVzdCBtYXRjaCB0aGUgY3J5cHRvUHJvdG9jb2xWZXJzaW9uIGFuZCBtdXN0IGJlIG9mIHRoZSByZXF1aXJlZCByZWNpcGllbnRLZXlWZXJzaW9uLlxuXHQgKiBAcGFyYW0gcHViRW5jS2V5RGF0YSB0aGUgZW5jcnlwdGVkIHN5bUtleSB3aXRoIHRoZSBtZXRhZGF0YSAodmVyc2lvbnMsIGdyb3VwIGlkZW50aWZpZXIgZXRjLikgZm9yIGRlY3J5cHRpb24gYW5kIGF1dGhlbnRpY2F0aW9uLlxuXHQgKiBAcGFyYW0gc2VuZGVySWRlbnRpZmllciB0aGUgaWRlbnRpZmllciBmb3IgdGhlIHNlbmRlcidzIGtleSBncm91cFxuXHQgKiBAdGhyb3dzIENyeXB0b0Vycm9yIGluIGNhc2UgdGhlIGF1dGhlbnRpY2F0aW9uIGZhaWxzLlxuXHQgKi9cblx0YXN5bmMgZGVjcnlwdFN5bUtleVdpdGhLZXlQYWlyQW5kQXV0aGVudGljYXRlKFxuXHRcdHJlY2lwaWVudEtleVBhaXI6IEFzeW1tZXRyaWNLZXlQYWlyLFxuXHRcdHB1YkVuY0tleURhdGE6IFB1YkVuY0tleURhdGEsXG5cdFx0c2VuZGVySWRlbnRpZmllcjogUHVibGljS2V5SWRlbnRpZmllcixcblx0KTogUHJvbWlzZTxEZWNhcHN1bGF0ZWRBZXNLZXk+IHtcblx0XHRjb25zdCBjcnlwdG9Qcm90b2NvbFZlcnNpb24gPSBhc0NyeXB0b1Byb3Rvb2NvbFZlcnNpb24ocHViRW5jS2V5RGF0YS5wcm90b2NvbFZlcnNpb24pXG5cdFx0Y29uc3QgZGVjYXBzdWxhdGVkQWVzS2V5ID0gYXdhaXQgdGhpcy5kZWNyeXB0U3ltS2V5V2l0aEtleVBhaXIocmVjaXBpZW50S2V5UGFpciwgY3J5cHRvUHJvdG9jb2xWZXJzaW9uLCBwdWJFbmNLZXlEYXRhLnB1YkVuY1N5bUtleSlcblx0XHRpZiAoY3J5cHRvUHJvdG9jb2xWZXJzaW9uID09PSBDcnlwdG9Qcm90b2NvbFZlcnNpb24uVFVUQV9DUllQVCkge1xuXHRcdFx0Y29uc3QgZW5jcnlwdGlvbkF1dGhTdGF0dXMgPSBhd2FpdCB0aGlzLmF1dGhlbnRpY2F0ZVNlbmRlcihcblx0XHRcdFx0c2VuZGVySWRlbnRpZmllcixcblx0XHRcdFx0YXNzZXJ0Tm90TnVsbChkZWNhcHN1bGF0ZWRBZXNLZXkuc2VuZGVySWRlbnRpdHlQdWJLZXkpLFxuXHRcdFx0XHROdW1iZXIoYXNzZXJ0Tm90TnVsbChwdWJFbmNLZXlEYXRhLnNlbmRlcktleVZlcnNpb24pKSxcblx0XHRcdClcblx0XHRcdGlmIChlbmNyeXB0aW9uQXV0aFN0YXR1cyAhPT0gRW5jcnlwdGlvbkF1dGhTdGF0dXMuVFVUQUNSWVBUX0FVVEhFTlRJQ0FUSU9OX1NVQ0NFRURFRCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgQ3J5cHRvRXJyb3IoXCJ0aGUgcHJvdmlkZWQgcHVibGljIGtleSBjb3VsZCBub3QgYmUgYXV0aGVudGljYXRlZFwiKVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZGVjYXBzdWxhdGVkQWVzS2V5XG5cdH1cblxuXHQvKipcblx0ICogRGVjcnlwdHMgdGhlIHB1YkVuY1N5bUtleSB3aXRoIHRoZSByZWNpcGllbnRLZXlQYWlyLlxuXHQgKiBAcGFyYW0gcHViRW5jU3ltS2V5IHRoZSBhc3ltbWV0cmljYWxseSBlbmNyeXB0ZWQgc2Vzc2lvbiBrZXlcblx0ICogQHBhcmFtIGNyeXB0b1Byb3RvY29sVmVyc2lvbiBhc3ltbWV0cmljIHByb3RvY29sIHRvIGRlY3J5cHQgcHViRW5jU3ltS2V5IChSU0Egb3IgVHV0YUNyeXB0KVxuXHQgKiBAcGFyYW0gcmVjaXBpZW50S2V5UGFpciB0aGUgcmVjaXBpZW50S2V5UGFpci4gTXVzdCBtYXRjaCB0aGUgY3J5cHRvUHJvdG9jb2xWZXJzaW9uLlxuXHQgKi9cblx0YXN5bmMgZGVjcnlwdFN5bUtleVdpdGhLZXlQYWlyKFxuXHRcdHJlY2lwaWVudEtleVBhaXI6IEFzeW1tZXRyaWNLZXlQYWlyLFxuXHRcdGNyeXB0b1Byb3RvY29sVmVyc2lvbjogQ3J5cHRvUHJvdG9jb2xWZXJzaW9uLFxuXHRcdHB1YkVuY1N5bUtleTogVWludDhBcnJheSxcblx0KTogUHJvbWlzZTxEZWNhcHN1bGF0ZWRBZXNLZXk+IHtcblx0XHRzd2l0Y2ggKGNyeXB0b1Byb3RvY29sVmVyc2lvbikge1xuXHRcdFx0Y2FzZSBDcnlwdG9Qcm90b2NvbFZlcnNpb24uUlNBOiB7XG5cdFx0XHRcdGlmICghaXNSc2FPclJzYUVjY0tleVBhaXIocmVjaXBpZW50S2V5UGFpcikpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgQ3J5cHRvRXJyb3IoXCJ3cm9uZyBrZXkgdHlwZS4gZXhwZWN0ZWQgcnNhLiBnb3QgXCIgKyByZWNpcGllbnRLZXlQYWlyLmtleVBhaXJUeXBlKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnN0IHByaXZhdGVLZXk6IFJzYVByaXZhdGVLZXkgPSByZWNpcGllbnRLZXlQYWlyLnByaXZhdGVLZXlcblx0XHRcdFx0Y29uc3QgZGVjcnlwdGVkU3ltS2V5ID0gYXdhaXQgdGhpcy5yc2EuZGVjcnlwdChwcml2YXRlS2V5LCBwdWJFbmNTeW1LZXkpXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0ZGVjcnlwdGVkQWVzS2V5OiB1aW50OEFycmF5VG9CaXRBcnJheShkZWNyeXB0ZWRTeW1LZXkpLFxuXHRcdFx0XHRcdHNlbmRlcklkZW50aXR5UHViS2V5OiBudWxsLFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjYXNlIENyeXB0b1Byb3RvY29sVmVyc2lvbi5UVVRBX0NSWVBUOiB7XG5cdFx0XHRcdGlmICghaXNQcUtleVBhaXJzKHJlY2lwaWVudEtleVBhaXIpKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IENyeXB0b0Vycm9yKFwid3Jvbmcga2V5IHR5cGUuIGV4cGVjdGVkIFR1dGFDcnlwdC4gZ290IFwiICsgcmVjaXBpZW50S2V5UGFpci5rZXlQYWlyVHlwZSlcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCB7IGRlY3J5cHRlZFN5bUtleUJ5dGVzLCBzZW5kZXJJZGVudGl0eVB1YktleSB9ID0gYXdhaXQgdGhpcy5wcUZhY2FkZS5kZWNhcHN1bGF0ZUVuY29kZWQocHViRW5jU3ltS2V5LCByZWNpcGllbnRLZXlQYWlyKVxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGRlY3J5cHRlZEFlc0tleTogdWludDhBcnJheVRvQml0QXJyYXkoZGVjcnlwdGVkU3ltS2V5Qnl0ZXMpLFxuXHRcdFx0XHRcdHNlbmRlcklkZW50aXR5UHViS2V5LFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgQ3J5cHRvRXJyb3IoXCJpbnZhbGlkIGNyeXB0b1Byb3RvY29sVmVyc2lvbjogXCIgKyBjcnlwdG9Qcm90b2NvbFZlcnNpb24pXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIExvYWRzIHRoZSByZWNpcGllbnQga2V5IHBhaXIgaW4gdGhlIHJlcXVpcmVkIHZlcnNpb24gYW5kIGRlY3J5cHRzIHRoZSBwdWJFbmNTeW1LZXkgd2l0aCBpdC5cblx0ICovXG5cdGFzeW5jIGxvYWRLZXlQYWlyQW5kRGVjcnlwdFN5bUtleShcblx0XHRyZWNpcGllbnRLZXlQYWlyR3JvdXBJZDogSWQsXG5cdFx0cmVjaXBpZW50S2V5VmVyc2lvbjogbnVtYmVyLFxuXHRcdGNyeXB0b1Byb3RvY29sVmVyc2lvbjogQ3J5cHRvUHJvdG9jb2xWZXJzaW9uLFxuXHRcdHB1YkVuY1N5bUtleTogVWludDhBcnJheSxcblx0KTogUHJvbWlzZTxEZWNhcHN1bGF0ZWRBZXNLZXk+IHtcblx0XHRjb25zdCBrZXlQYWlyOiBBc3ltbWV0cmljS2V5UGFpciA9IGF3YWl0IHRoaXMua2V5TG9hZGVyRmFjYWRlLmxvYWRLZXlwYWlyKHJlY2lwaWVudEtleVBhaXJHcm91cElkLCByZWNpcGllbnRLZXlWZXJzaW9uKVxuXHRcdHJldHVybiBhd2FpdCB0aGlzLmRlY3J5cHRTeW1LZXlXaXRoS2V5UGFpcihrZXlQYWlyLCBjcnlwdG9Qcm90b2NvbFZlcnNpb24sIHB1YkVuY1N5bUtleSlcblx0fVxuXG5cdC8qKlxuXHQgKiBFbmNyeXB0cyB0aGUgc3ltS2V5IGFzeW1tZXRyaWNhbGx5IHdpdGggdGhlIHByb3ZpZGVkIHB1YmxpYyBrZXlzLlxuXHQgKiBAcGFyYW0gc3ltS2V5IHRoZSBzeW1tZXRyaWMga2V5ICB0byBiZSBlbmNyeXB0ZWRcblx0ICogQHBhcmFtIHJlY2lwaWVudFB1YmxpY0tleXMgdGhlIHB1YmxpYyBrZXkocykgb2YgdGhlIHJlY2lwaWVudCBpbiB0aGUgY3VycmVudCB2ZXJzaW9uXG5cdCAqIEBwYXJhbSBzZW5kZXJHcm91cElkIHRoZSBncm91cCBpZCBvZiB0aGUgc2VuZGVyLiB3aWxsIG9ubHkgYmUgdXNlZCBpbiBjYXNlIHdlIGFsc28gbmVlZCB0aGUgc2VuZGVyJ3Mga2V5IHBhaXIsIGUuZy4gd2l0aCBUdXRhQ3J5cHQuXG5cdCAqL1xuXHRhc3luYyBhc3ltRW5jcnlwdFN5bUtleShzeW1LZXk6IEFlc0tleSwgcmVjaXBpZW50UHVibGljS2V5czogVmVyc2lvbmVkPFB1YmxpY0tleXM+LCBzZW5kZXJHcm91cElkOiBJZCk6IFByb21pc2U8UHViRW5jU3ltS2V5PiB7XG5cdFx0Y29uc3QgcmVjaXBpZW50UHVibGljS2V5ID0gdGhpcy5leHRyYWN0UmVjaXBpZW50UHVibGljS2V5KHJlY2lwaWVudFB1YmxpY0tleXMub2JqZWN0KVxuXHRcdGNvbnN0IGtleVBhaXJUeXBlID0gcmVjaXBpZW50UHVibGljS2V5LmtleVBhaXJUeXBlXG5cblx0XHRpZiAoaXNQcVB1YmxpY0tleShyZWNpcGllbnRQdWJsaWNLZXkpKSB7XG5cdFx0XHRjb25zdCBzZW5kZXJLZXlQYWlyID0gYXdhaXQgdGhpcy5rZXlMb2FkZXJGYWNhZGUubG9hZEN1cnJlbnRLZXlQYWlyKHNlbmRlckdyb3VwSWQpXG5cdFx0XHRjb25zdCBzZW5kZXJFY2NLZXlQYWlyID0gYXdhaXQgdGhpcy5nZXRPck1ha2VTZW5kZXJJZGVudGl0eUtleVBhaXIoc2VuZGVyS2V5UGFpci5vYmplY3QsIHNlbmRlckdyb3VwSWQpXG5cdFx0XHRyZXR1cm4gdGhpcy50dXRhQ3J5cHRFbmNyeXB0U3ltS2V5SW1wbCh7IG9iamVjdDogcmVjaXBpZW50UHVibGljS2V5LCB2ZXJzaW9uOiByZWNpcGllbnRQdWJsaWNLZXlzLnZlcnNpb24gfSwgc3ltS2V5LCB7XG5cdFx0XHRcdG9iamVjdDogc2VuZGVyRWNjS2V5UGFpcixcblx0XHRcdFx0dmVyc2lvbjogc2VuZGVyS2V5UGFpci52ZXJzaW9uLFxuXHRcdFx0fSlcblx0XHR9IGVsc2UgaWYgKGlzUnNhUHVibGljS2V5KHJlY2lwaWVudFB1YmxpY0tleSkpIHtcblx0XHRcdGNvbnN0IHB1YkVuY1N5bUtleUJ5dGVzID0gYXdhaXQgdGhpcy5yc2EuZW5jcnlwdChyZWNpcGllbnRQdWJsaWNLZXksIGJpdEFycmF5VG9VaW50OEFycmF5KHN5bUtleSkpXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRwdWJFbmNTeW1LZXlCeXRlcyxcblx0XHRcdFx0Y3J5cHRvUHJvdG9jb2xWZXJzaW9uOiBDcnlwdG9Qcm90b2NvbFZlcnNpb24uUlNBLFxuXHRcdFx0XHRzZW5kZXJLZXlWZXJzaW9uOiBudWxsLFxuXHRcdFx0XHRyZWNpcGllbnRLZXlWZXJzaW9uOiByZWNpcGllbnRQdWJsaWNLZXlzLnZlcnNpb24sXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRocm93IG5ldyBDcnlwdG9FcnJvcihcInVua25vd24gcHVibGljIGtleSB0eXBlOiBcIiArIGtleVBhaXJUeXBlKVxuXHR9XG5cblx0LyoqXG5cdCAqIEVuY3J5cHRzIHRoZSBzeW1LZXkgYXN5bW1ldHJpY2FsbHkgd2l0aCB0aGUgcHJvdmlkZWQgcHVibGljIGtleXMgdXNpbmcgdGhlIFR1dGFDcnlwdCBwcm90b2NvbC5cblx0ICogQHBhcmFtIHN5bUtleSB0aGUga2V5IHRvIGJlIGVuY3J5cHRlZFxuXHQgKiBAcGFyYW0gcmVjaXBpZW50UHVibGljS2V5cyBNVVNUIGJlIGEgcHEga2V5IHBhaXJcblx0ICogQHBhcmFtIHNlbmRlckVjY0tleVBhaXIgdGhlIHNlbmRlcidzIGtleSBwYWlyIChuZWVkZWQgZm9yIGF1dGhlbnRpY2F0aW9uKVxuXHQgKiBAdGhyb3dzIFByb2dyYW1taW5nRXJyb3IgaWYgdGhlIHJlY2lwaWVudFB1YmxpY0tleXMgYXJlIG5vdCBzdWl0YWJsZSBmb3IgVHV0YUNyeXB0XG5cdCAqL1xuXHRhc3luYyB0dXRhQ3J5cHRFbmNyeXB0U3ltS2V5KHN5bUtleTogQWVzS2V5LCByZWNpcGllbnRQdWJsaWNLZXlzOiBWZXJzaW9uZWQ8UHVibGljS2V5cz4sIHNlbmRlckVjY0tleVBhaXI6IFZlcnNpb25lZDxFY2NLZXlQYWlyPik6IFByb21pc2U8UHViRW5jU3ltS2V5PiB7XG5cdFx0Y29uc3QgcmVjaXBpZW50UHVibGljS2V5ID0gdGhpcy5leHRyYWN0UmVjaXBpZW50UHVibGljS2V5KHJlY2lwaWVudFB1YmxpY0tleXMub2JqZWN0KVxuXHRcdGlmICghaXNQcVB1YmxpY0tleShyZWNpcGllbnRQdWJsaWNLZXkpKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcInRoZSByZWNpcGllbnQgZG9lcyBub3QgaGF2ZSBwcSBrZXkgcGFpcnNcIilcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMudHV0YUNyeXB0RW5jcnlwdFN5bUtleUltcGwoXG5cdFx0XHR7XG5cdFx0XHRcdG9iamVjdDogcmVjaXBpZW50UHVibGljS2V5LFxuXHRcdFx0XHR2ZXJzaW9uOiByZWNpcGllbnRQdWJsaWNLZXlzLnZlcnNpb24sXG5cdFx0XHR9LFxuXHRcdFx0c3ltS2V5LFxuXHRcdFx0c2VuZGVyRWNjS2V5UGFpcixcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHR1dGFDcnlwdEVuY3J5cHRTeW1LZXlJbXBsKFxuXHRcdHJlY2lwaWVudFB1YmxpY0tleTogVmVyc2lvbmVkPFBRUHVibGljS2V5cz4sXG5cdFx0c3ltS2V5OiBBZXNLZXksXG5cdFx0c2VuZGVyRWNjS2V5UGFpcjogVmVyc2lvbmVkPEVjY0tleVBhaXI+LFxuXHQpOiBQcm9taXNlPFB1YkVuY1N5bUtleT4ge1xuXHRcdGNvbnN0IGVwaGVtZXJhbEtleVBhaXIgPSB0aGlzLmNyeXB0b1dyYXBwZXIuZ2VuZXJhdGVFY2NLZXlQYWlyKClcblx0XHRjb25zdCBwdWJFbmNTeW1LZXlCeXRlcyA9IGF3YWl0IHRoaXMucHFGYWNhZGUuZW5jYXBzdWxhdGVBbmRFbmNvZGUoXG5cdFx0XHRzZW5kZXJFY2NLZXlQYWlyLm9iamVjdCxcblx0XHRcdGVwaGVtZXJhbEtleVBhaXIsXG5cdFx0XHRyZWNpcGllbnRQdWJsaWNLZXkub2JqZWN0LFxuXHRcdFx0Yml0QXJyYXlUb1VpbnQ4QXJyYXkoc3ltS2V5KSxcblx0XHQpXG5cdFx0Y29uc3Qgc2VuZGVyS2V5VmVyc2lvbiA9IHNlbmRlckVjY0tleVBhaXIudmVyc2lvblxuXHRcdHJldHVybiB7IHB1YkVuY1N5bUtleUJ5dGVzLCBjcnlwdG9Qcm90b2NvbFZlcnNpb246IENyeXB0b1Byb3RvY29sVmVyc2lvbi5UVVRBX0NSWVBULCBzZW5kZXJLZXlWZXJzaW9uLCByZWNpcGllbnRLZXlWZXJzaW9uOiByZWNpcGllbnRQdWJsaWNLZXkudmVyc2lvbiB9XG5cdH1cblxuXHRwcml2YXRlIGV4dHJhY3RSZWNpcGllbnRQdWJsaWNLZXkocHVibGljS2V5czogUHVibGljS2V5cyk6IEFzeW1tZXRyaWNQdWJsaWNLZXkge1xuXHRcdGlmIChwdWJsaWNLZXlzLnB1YlJzYUtleSkge1xuXHRcdFx0Ly8gd2UgaWdub3JlIGVjYyBrZXlzIGFzIHRoaXMgaXMgb25seSB1c2VkIGZvciB0aGUgcmVjaXBpZW50IGtleXNcblx0XHRcdHJldHVybiBoZXhUb1JzYVB1YmxpY0tleSh1aW50OEFycmF5VG9IZXgocHVibGljS2V5cy5wdWJSc2FLZXkpKVxuXHRcdH0gZWxzZSBpZiAocHVibGljS2V5cy5wdWJLeWJlcktleSAmJiBwdWJsaWNLZXlzLnB1YkVjY0tleSkge1xuXHRcdFx0Y29uc3QgZWNjUHVibGljS2V5ID0gcHVibGljS2V5cy5wdWJFY2NLZXlcblx0XHRcdGNvbnN0IGt5YmVyUHVibGljS2V5ID0gdGhpcy5jcnlwdG9XcmFwcGVyLmJ5dGVzVG9LeWJlclB1YmxpY0tleShwdWJsaWNLZXlzLnB1Ykt5YmVyS2V5KVxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0a2V5UGFpclR5cGU6IEtleVBhaXJUeXBlLlRVVEFfQ1JZUFQsXG5cdFx0XHRcdGVjY1B1YmxpY0tleSxcblx0XHRcdFx0a3liZXJQdWJsaWNLZXksXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkluY29uc2lzdGVudCBLZXlwYWlyXCIpXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIFNlbmRlcklkZW50aXR5S2V5UGFpciB0aGF0IGlzIGVpdGhlciBhbHJlYWR5IG9uIHRoZSBLZXlQYWlyIHRoYXQgaXMgYmVpbmcgcGFzc2VkIGluLFxuXHQgKiBvciBjcmVhdGVzIGEgbmV3IG9uZSBhbmQgd3JpdGVzIGl0IHRvIHRoZSByZXNwZWN0aXZlIEdyb3VwLlxuXHQgKiBAcGFyYW0gc2VuZGVyS2V5UGFpclxuXHQgKiBAcGFyYW0ga2V5R3JvdXBJZCBJZCBmb3IgdGhlIEdyb3VwIHRoYXQgUHVibGljIEtleSBTZXJ2aWNlIG1pZ2h0IHdyaXRlIGEgbmV3IElkZW50aXR5S2V5UGFpciBmb3IuXG5cdCAqIFx0XHRcdFx0XHRcdFRoaXMgaXMgbmVjZXNzYXJ5IGFzIGEgVXNlciBtaWdodCBzZW5kIGFuIEUtTWFpbCBmcm9tIGEgc2hhcmVkIG1haWxib3gsXG5cdCAqIFx0XHRcdFx0XHRcdGZvciB3aGljaCB0aGUgS2V5UGFpciBzaG91bGQgYmUgY3JlYXRlZC5cblx0ICovXG5cdHByaXZhdGUgYXN5bmMgZ2V0T3JNYWtlU2VuZGVySWRlbnRpdHlLZXlQYWlyKHNlbmRlcktleVBhaXI6IEFzeW1tZXRyaWNLZXlQYWlyLCBrZXlHcm91cElkOiBJZCk6IFByb21pc2U8RWNjS2V5UGFpcj4ge1xuXHRcdGNvbnN0IGFsZ28gPSBzZW5kZXJLZXlQYWlyLmtleVBhaXJUeXBlXG5cdFx0aWYgKGlzUHFLZXlQYWlycyhzZW5kZXJLZXlQYWlyKSkge1xuXHRcdFx0cmV0dXJuIHNlbmRlcktleVBhaXIuZWNjS2V5UGFpclxuXHRcdH0gZWxzZSBpZiAoaXNSc2FFY2NLZXlQYWlyKHNlbmRlcktleVBhaXIpKSB7XG5cdFx0XHRyZXR1cm4geyBwdWJsaWNLZXk6IHNlbmRlcktleVBhaXIucHVibGljRWNjS2V5LCBwcml2YXRlS2V5OiBzZW5kZXJLZXlQYWlyLnByaXZhdGVFY2NLZXkgfVxuXHRcdH0gZWxzZSBpZiAoaXNSc2FPclJzYUVjY0tleVBhaXIoc2VuZGVyS2V5UGFpcikpIHtcblx0XHRcdC8vIHRoZXJlIGlzIG5vIGVjYyBrZXkgcGFpciB5ZXQsIHNvIHdlIGhhdmUgdG8gZ2VucmF0ZSBhbmQgdXBsb2FkIG9uZVxuXHRcdFx0Y29uc3Qgc3ltR3JvdXBLZXkgPSBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5nZXRDdXJyZW50U3ltR3JvdXBLZXkoa2V5R3JvdXBJZClcblx0XHRcdGNvbnN0IG5ld0lkZW50aXR5S2V5UGFpciA9IHRoaXMuY3J5cHRvV3JhcHBlci5nZW5lcmF0ZUVjY0tleVBhaXIoKVxuXHRcdFx0Y29uc3Qgc3ltRW5jUHJpdkVjY0tleSA9IHRoaXMuY3J5cHRvV3JhcHBlci5lbmNyeXB0RWNjS2V5KHN5bUdyb3VwS2V5Lm9iamVjdCwgbmV3SWRlbnRpdHlLZXlQYWlyLnByaXZhdGVLZXkpXG5cdFx0XHRjb25zdCBkYXRhID0gY3JlYXRlUHVibGljS2V5UHV0SW4oeyBwdWJFY2NLZXk6IG5ld0lkZW50aXR5S2V5UGFpci5wdWJsaWNLZXksIHN5bUVuY1ByaXZFY2NLZXksIGtleUdyb3VwOiBrZXlHcm91cElkIH0pXG5cdFx0XHRhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5wdXQoUHVibGljS2V5U2VydmljZSwgZGF0YSlcblx0XHRcdHJldHVybiBuZXdJZGVudGl0eUtleVBhaXJcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IENyeXB0b0Vycm9yKFwidW5rbm93biBrZXkgcGFpciB0eXBlOiBcIiArIGFsZ28pXG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0VG9WZXJzaW9uZWRQdWJsaWNLZXlzKHB1YmxpY0tleUdldE91dDogUHVibGljS2V5R2V0T3V0KTogVmVyc2lvbmVkPFB1YmxpY0tleXM+IHtcblx0cmV0dXJuIHtcblx0XHRvYmplY3Q6IHtcblx0XHRcdHB1YlJzYUtleTogcHVibGljS2V5R2V0T3V0LnB1YlJzYUtleSxcblx0XHRcdHB1Ykt5YmVyS2V5OiBwdWJsaWNLZXlHZXRPdXQucHViS3liZXJLZXksXG5cdFx0XHRwdWJFY2NLZXk6IHB1YmxpY0tleUdldE91dC5wdWJFY2NLZXksXG5cdFx0fSxcblx0XHR2ZXJzaW9uOiBOdW1iZXIocHVibGljS2V5R2V0T3V0LnB1YktleVZlcnNpb24pLFxuXHR9XG59XG4iLCJpbXBvcnQge1xuXHRhc3NlcnROb3ROdWxsLFxuXHRiYXNlNjRUb1VpbnQ4QXJyYXksXG5cdGRvd25jYXN0LFxuXHRpc1NhbWVUeXBlUmVmLFxuXHRpc1NhbWVUeXBlUmVmQnlBdHRyLFxuXHRuZXZlck51bGwsXG5cdG9mQ2xhc3MsXG5cdHByb21pc2VNYXAsXG5cdHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXksXG5cdFR5cGVSZWYsXG5cdHVpbnQ4QXJyYXlUb0Jhc2U2NCxcbn0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQge1xuXHRBY2NvdW50VHlwZSxcblx0YXNDcnlwdG9Qcm90b29jb2xWZXJzaW9uLFxuXHRhc3NlcnRFbnVtVmFsdWUsXG5cdEJ1Y2tldFBlcm1pc3Npb25UeXBlLFxuXHRDcnlwdG9Qcm90b2NvbFZlcnNpb24sXG5cdEVuY3J5cHRpb25BdXRoU3RhdHVzLFxuXHRHcm91cFR5cGUsXG5cdFBlcm1pc3Npb25UeXBlLFxuXHRQdWJsaWNLZXlJZGVudGlmaWVyVHlwZSxcblx0U1lTVEVNX0dST1VQX01BSUxfQUREUkVTUyxcbn0gZnJvbSBcIi4uLy4uL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBIdHRwTWV0aG9kLCByZXNvbHZlVHlwZVJlZmVyZW5jZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5RnVuY3Rpb25zXCJcbmltcG9ydCB0eXBlIHsgQnVja2V0S2V5LCBCdWNrZXRQZXJtaXNzaW9uLCBHcm91cE1lbWJlcnNoaXAsIEluc3RhbmNlU2Vzc2lvbktleSwgUGVybWlzc2lvbiwgUHVibGljS2V5R2V0T3V0IH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQge1xuXHRCdWNrZXRLZXlUeXBlUmVmLFxuXHRCdWNrZXRQZXJtaXNzaW9uVHlwZVJlZixcblx0Y3JlYXRlSW5zdGFuY2VTZXNzaW9uS2V5LFxuXHRjcmVhdGVQdWJsaWNLZXlHZXRJbixcblx0Y3JlYXRlVXBkYXRlUGVybWlzc2lvbktleURhdGEsXG5cdEdyb3VwSW5mb1R5cGVSZWYsXG5cdEdyb3VwVHlwZVJlZixcblx0UGVybWlzc2lvblR5cGVSZWYsXG5cdFB1c2hJZGVudGlmaWVyVHlwZVJlZixcbn0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQge1xuXHRDb250YWN0LFxuXHRDb250YWN0VHlwZVJlZixcblx0Y3JlYXRlRW5jcnlwdFR1dGFub3RhUHJvcGVydGllc0RhdGEsXG5cdGNyZWF0ZUludGVybmFsUmVjaXBpZW50S2V5RGF0YSxcblx0Y3JlYXRlU3ltRW5jSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhLFxuXHRGaWxlLFxuXHRGaWxlVHlwZVJlZixcblx0SW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhLFxuXHRNYWlsLFxuXHRNYWlsVHlwZVJlZixcblx0U3ltRW5jSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhLFxuXHRUdXRhbm90YVByb3BlcnRpZXNUeXBlUmVmLFxufSBmcm9tIFwiLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgdHlwZVJlZlRvUGF0aCB9IGZyb20gXCIuLi9yZXN0L0VudGl0eVJlc3RDbGllbnRcIlxuaW1wb3J0IHsgTG9ja2VkRXJyb3IsIE5vdEZvdW5kRXJyb3IsIFBheWxvYWRUb29MYXJnZUVycm9yLCBUb29NYW55UmVxdWVzdHNFcnJvciB9IGZyb20gXCIuLi8uLi9jb21tb24vZXJyb3IvUmVzdEVycm9yXCJcbmltcG9ydCB7IFNlc3Npb25LZXlOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9TZXNzaW9uS2V5Tm90Rm91bmRFcnJvclwiXG5pbXBvcnQgeyBiaXJ0aGRheVRvSXNvRGF0ZSwgb2xkQmlydGhkYXlUb0JpcnRoZGF5IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi91dGlscy9CaXJ0aGRheVV0aWxzXCJcbmltcG9ydCB0eXBlIHsgRW50aXR5LCBJbnN0YW5jZSwgU29tZUVudGl0eSwgVHlwZU1vZGVsIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnRpdHlUeXBlc1wiXG5pbXBvcnQgeyBhc3NlcnRXb3JrZXJPck5vZGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0VudlwiXG5pbXBvcnQgdHlwZSB7IEVudGl0eUNsaWVudCB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5Q2xpZW50XCJcbmltcG9ydCB7IFJlc3RDbGllbnQgfSBmcm9tIFwiLi4vcmVzdC9SZXN0Q2xpZW50XCJcbmltcG9ydCB7IEFlczI1NktleSwgYWVzMjU2UmFuZG9tS2V5LCBhZXNFbmNyeXB0LCBBZXNLZXksIGJpdEFycmF5VG9VaW50OEFycmF5LCBkZWNyeXB0S2V5LCBFY2NQdWJsaWNLZXksIGVuY3J5cHRLZXksIHNoYTI1Nkhhc2ggfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLWNyeXB0b1wiXG5pbXBvcnQgeyBSZWNpcGllbnROb3RSZXNvbHZlZEVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9SZWNpcGllbnROb3RSZXNvbHZlZEVycm9yXCJcbmltcG9ydCB7IElTZXJ2aWNlRXhlY3V0b3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL1NlcnZpY2VSZXF1ZXN0XCJcbmltcG9ydCB7IEVuY3J5cHRUdXRhbm90YVByb3BlcnRpZXNTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1NlcnZpY2VzXCJcbmltcG9ydCB7IFB1YmxpY0tleVNlcnZpY2UsIFVwZGF0ZVBlcm1pc3Npb25LZXlTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3N5cy9TZXJ2aWNlc1wiXG5pbXBvcnQgeyBVc2VyRmFjYWRlIH0gZnJvbSBcIi4uL2ZhY2FkZXMvVXNlckZhY2FkZVwiXG5pbXBvcnQgeyBlbGVtZW50SWRQYXJ0LCBnZXRFbGVtZW50SWQsIGdldExpc3RJZCB9IGZyb20gXCIuLi8uLi9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgSW5zdGFuY2VNYXBwZXIgfSBmcm9tIFwiLi9JbnN0YW5jZU1hcHBlci5qc1wiXG5pbXBvcnQgeyBPd25lckVuY1Nlc3Npb25LZXlzVXBkYXRlUXVldWUgfSBmcm9tIFwiLi9Pd25lckVuY1Nlc3Npb25LZXlzVXBkYXRlUXVldWUuanNcIlxuaW1wb3J0IHsgRGVmYXVsdEVudGl0eVJlc3RDYWNoZSB9IGZyb20gXCIuLi9yZXN0L0RlZmF1bHRFbnRpdHlSZXN0Q2FjaGUuanNcIlxuaW1wb3J0IHsgQ3J5cHRvRXJyb3IgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLWNyeXB0by9lcnJvci5qc1wiXG5pbXBvcnQgeyBLZXlMb2FkZXJGYWNhZGUgfSBmcm9tIFwiLi4vZmFjYWRlcy9LZXlMb2FkZXJGYWNhZGUuanNcIlxuaW1wb3J0IHsgZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXksIFZlcnNpb25lZEVuY3J5cHRlZEtleSwgVmVyc2lvbmVkS2V5IH0gZnJvbSBcIi4vQ3J5cHRvV3JhcHBlci5qc1wiXG5pbXBvcnQgeyBBc3ltbWV0cmljQ3J5cHRvRmFjYWRlLCBjb252ZXJ0VG9WZXJzaW9uZWRQdWJsaWNLZXlzIH0gZnJvbSBcIi4vQXN5bW1ldHJpY0NyeXB0b0ZhY2FkZS5qc1wiXG5cbmFzc2VydFdvcmtlck9yTm9kZSgpXG5cbi8vIFVubWFwcGVkIGVuY3J5cHRlZCBvd25lciBncm91cCBpbnN0YW5jZVxudHlwZSBVbm1hcHBlZE93bmVyR3JvdXBJbnN0YW5jZSA9IHtcblx0X293bmVyRW5jU2Vzc2lvbktleTogc3RyaW5nXG5cdF9vd25lcktleVZlcnNpb246IE51bWJlclN0cmluZ1xuXHRfb3duZXJHcm91cDogSWRcbn1cblxudHlwZSBSZXNvbHZlZFNlc3Npb25LZXlzID0ge1xuXHRyZXNvbHZlZFNlc3Npb25LZXlGb3JJbnN0YW5jZTogQWVzS2V5XG5cdGluc3RhbmNlU2Vzc2lvbktleXM6IEFycmF5PEluc3RhbmNlU2Vzc2lvbktleT5cbn1cblxuZXhwb3J0IGNsYXNzIENyeXB0b0ZhY2FkZSB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdXNlckZhY2FkZTogVXNlckZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgcmVzdENsaWVudDogUmVzdENsaWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IHNlcnZpY2VFeGVjdXRvcjogSVNlcnZpY2VFeGVjdXRvcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGluc3RhbmNlTWFwcGVyOiBJbnN0YW5jZU1hcHBlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IG93bmVyRW5jU2Vzc2lvbktleXNVcGRhdGVRdWV1ZTogT3duZXJFbmNTZXNzaW9uS2V5c1VwZGF0ZVF1ZXVlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY2FjaGU6IERlZmF1bHRFbnRpdHlSZXN0Q2FjaGUgfCBudWxsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkga2V5TG9hZGVyRmFjYWRlOiBLZXlMb2FkZXJGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBhc3ltbWV0cmljQ3J5cHRvRmFjYWRlOiBBc3ltbWV0cmljQ3J5cHRvRmFjYWRlLFxuXHQpIHt9XG5cblx0YXN5bmMgYXBwbHlNaWdyYXRpb25zRm9ySW5zdGFuY2U8VD4oZGVjcnlwdGVkSW5zdGFuY2U6IFQpOiBQcm9taXNlPFQ+IHtcblx0XHRjb25zdCBpbnN0YW5jZVR5cGUgPSBkb3duY2FzdDxFbnRpdHk+KGRlY3J5cHRlZEluc3RhbmNlKS5fdHlwZVxuXG5cdFx0aWYgKGlzU2FtZVR5cGVSZWYoaW5zdGFuY2VUeXBlLCBDb250YWN0VHlwZVJlZikpIHtcblx0XHRcdGNvbnN0IGNvbnRhY3QgPSBkb3duY2FzdDxDb250YWN0PihkZWNyeXB0ZWRJbnN0YW5jZSlcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0aWYgKCFjb250YWN0LmJpcnRoZGF5SXNvICYmIGNvbnRhY3Qub2xkQmlydGhkYXlBZ2dyZWdhdGUpIHtcblx0XHRcdFx0XHRjb250YWN0LmJpcnRoZGF5SXNvID0gYmlydGhkYXlUb0lzb0RhdGUoY29udGFjdC5vbGRCaXJ0aGRheUFnZ3JlZ2F0ZSlcblx0XHRcdFx0XHRjb250YWN0Lm9sZEJpcnRoZGF5QWdncmVnYXRlID0gbnVsbFxuXHRcdFx0XHRcdGNvbnRhY3Qub2xkQmlydGhkYXlEYXRlID0gbnVsbFxuXHRcdFx0XHRcdGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LnVwZGF0ZShjb250YWN0KVxuXHRcdFx0XHR9IGVsc2UgaWYgKCFjb250YWN0LmJpcnRoZGF5SXNvICYmIGNvbnRhY3Qub2xkQmlydGhkYXlEYXRlKSB7XG5cdFx0XHRcdFx0Y29udGFjdC5iaXJ0aGRheUlzbyA9IGJpcnRoZGF5VG9Jc29EYXRlKG9sZEJpcnRoZGF5VG9CaXJ0aGRheShjb250YWN0Lm9sZEJpcnRoZGF5RGF0ZSkpXG5cdFx0XHRcdFx0Y29udGFjdC5vbGRCaXJ0aGRheURhdGUgPSBudWxsXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5lbnRpdHlDbGllbnQudXBkYXRlKGNvbnRhY3QpXG5cdFx0XHRcdH0gZWxzZSBpZiAoY29udGFjdC5iaXJ0aGRheUlzbyAmJiAoY29udGFjdC5vbGRCaXJ0aGRheUFnZ3JlZ2F0ZSB8fCBjb250YWN0Lm9sZEJpcnRoZGF5RGF0ZSkpIHtcblx0XHRcdFx0XHRjb250YWN0Lm9sZEJpcnRoZGF5QWdncmVnYXRlID0gbnVsbFxuXHRcdFx0XHRcdGNvbnRhY3Qub2xkQmlydGhkYXlEYXRlID0gbnVsbFxuXHRcdFx0XHRcdGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LnVwZGF0ZShjb250YWN0KVxuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmICghKGUgaW5zdGFuY2VvZiBMb2NrZWRFcnJvcikpIHtcblx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZGVjcnlwdGVkSW5zdGFuY2Vcblx0fVxuXG5cdGFzeW5jIHJlc29sdmVTZXNzaW9uS2V5Rm9ySW5zdGFuY2UoaW5zdGFuY2U6IFNvbWVFbnRpdHkpOiBQcm9taXNlPEFlc0tleSB8IG51bGw+IHtcblx0XHRjb25zdCB0eXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZShpbnN0YW5jZS5fdHlwZSlcblx0XHRyZXR1cm4gdGhpcy5yZXNvbHZlU2Vzc2lvbktleSh0eXBlTW9kZWwsIGluc3RhbmNlKVxuXHR9XG5cblx0LyoqIEhlbHBlciBmb3IgdGhlIHJhcmUgY2FzZXMgd2hlbiB3ZSBuZWVkZWQgaXQgb24gdGhlIGNsaWVudCBzaWRlLiAqL1xuXHRhc3luYyByZXNvbHZlU2Vzc2lvbktleUZvckluc3RhbmNlQmluYXJ5KGluc3RhbmNlOiBTb21lRW50aXR5KTogUHJvbWlzZTxVaW50OEFycmF5IHwgbnVsbD4ge1xuXHRcdGNvbnN0IGtleSA9IGF3YWl0IHRoaXMucmVzb2x2ZVNlc3Npb25LZXlGb3JJbnN0YW5jZShpbnN0YW5jZSlcblx0XHRyZXR1cm4ga2V5ID09IG51bGwgPyBudWxsIDogYml0QXJyYXlUb1VpbnQ4QXJyYXkoa2V5KVxuXHR9XG5cblx0LyoqIFJlc29sdmUgYSBzZXNzaW9uIGtleSBhbiB7QHBhcmFtIGluc3RhbmNlfSB1c2luZyBhbiBhbHJlYWR5IGtub3duIHtAcGFyYW0gb3duZXJLZXl9LiAqL1xuXHRyZXNvbHZlU2Vzc2lvbktleVdpdGhPd25lcktleShpbnN0YW5jZTogUmVjb3JkPHN0cmluZywgYW55Piwgb3duZXJLZXk6IEFlc0tleSk6IEFlc0tleSB7XG5cdFx0bGV0IGtleTogVWludDhBcnJheSB8IHN0cmluZyA9IGluc3RhbmNlLl9vd25lckVuY1Nlc3Npb25LZXlcblx0XHRpZiAodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIikge1xuXHRcdFx0a2V5ID0gYmFzZTY0VG9VaW50OEFycmF5KGtleSlcblx0XHR9XG5cblx0XHRyZXR1cm4gZGVjcnlwdEtleShvd25lcktleSwga2V5KVxuXHR9XG5cblx0YXN5bmMgZGVjcnlwdFNlc3Npb25LZXkoaW5zdGFuY2U6IFJlY29yZDxzdHJpbmcsIGFueT4sIG93bmVyRW5jU2Vzc2lvbktleTogVmVyc2lvbmVkRW5jcnlwdGVkS2V5KTogUHJvbWlzZTxBZXNLZXk+IHtcblx0XHRjb25zdCBnayA9IGF3YWl0IHRoaXMua2V5TG9hZGVyRmFjYWRlLmxvYWRTeW1Hcm91cEtleShpbnN0YW5jZS5fb3duZXJHcm91cCwgb3duZXJFbmNTZXNzaW9uS2V5LmVuY3J5cHRpbmdLZXlWZXJzaW9uKVxuXHRcdHJldHVybiBkZWNyeXB0S2V5KGdrLCBvd25lckVuY1Nlc3Npb25LZXkua2V5KVxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHNlc3Npb24ga2V5IGZvciB0aGUgcHJvdmlkZWQgdHlwZS9pbnN0YW5jZTpcblx0ICogKiBudWxsLCBpZiB0aGUgaW5zdGFuY2UgaXMgdW5lbmNyeXB0ZWRcblx0ICogKiB0aGUgZGVjcnlwdGVkIF9vd25lckVuY1Nlc3Npb25LZXksIGlmIGl0IGlzIGF2YWlsYWJsZVxuXHQgKiAqIHRoZSBwdWJsaWMgZGVjcnlwdGVkIHNlc3Npb24ga2V5LCBvdGhlcndpc2Vcblx0ICpcblx0ICogQHBhcmFtIHR5cGVNb2RlbCB0aGUgdHlwZSBtb2RlbCBvZiB0aGUgaW5zdGFuY2Vcblx0ICogQHBhcmFtIGluc3RhbmNlIFRoZSB1bmVuY3J5cHRlZCAoY2xpZW50LXNpZGUpIGluc3RhbmNlIG9yIGVuY3J5cHRlZCAoc2VydmVyLXNpZGUpIG9iamVjdCBsaXRlcmFsXG5cdCAqL1xuXHRhc3luYyByZXNvbHZlU2Vzc2lvbktleSh0eXBlTW9kZWw6IFR5cGVNb2RlbCwgaW5zdGFuY2U6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPEFlc0tleSB8IG51bGw+IHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKCF0eXBlTW9kZWwuZW5jcnlwdGVkKSB7XG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHR9XG5cdFx0XHRpZiAoaW5zdGFuY2UuYnVja2V0S2V5KSB7XG5cdFx0XHRcdC8vIGlmIHdlIGhhdmUgYSBidWNrZXQga2V5LCB0aGVuIHdlIG5lZWQgdG8gY2FjaGUgdGhlIHNlc3Npb24ga2V5cyBzdG9yZWQgaW4gdGhlIGJ1Y2tldCBrZXkgZm9yIGRldGFpbHMsIGZpbGVzLCBldGMuXG5cdFx0XHRcdC8vIHdlIG5lZWQgdG8gZG8gdGhpcyBCRUZPUkUgd2UgY2hlY2sgdGhlIG93bmVyIGVuYyBzZXNzaW9uIGtleVxuXHRcdFx0XHRjb25zdCBidWNrZXRLZXkgPSBhd2FpdCB0aGlzLmNvbnZlcnRCdWNrZXRLZXlUb0luc3RhbmNlSWZOZWNlc3NhcnkoaW5zdGFuY2UuYnVja2V0S2V5KVxuXHRcdFx0XHRjb25zdCByZXNvbHZlZFNlc3Npb25LZXlzID0gYXdhaXQgdGhpcy5yZXNvbHZlV2l0aEJ1Y2tldEtleShidWNrZXRLZXksIGluc3RhbmNlLCB0eXBlTW9kZWwpXG5cdFx0XHRcdHJldHVybiByZXNvbHZlZFNlc3Npb25LZXlzLnJlc29sdmVkU2Vzc2lvbktleUZvckluc3RhbmNlXG5cdFx0XHR9IGVsc2UgaWYgKGluc3RhbmNlLl9vd25lckVuY1Nlc3Npb25LZXkgJiYgdGhpcy51c2VyRmFjYWRlLmlzRnVsbHlMb2dnZWRJbigpICYmIHRoaXMudXNlckZhY2FkZS5oYXNHcm91cChpbnN0YW5jZS5fb3duZXJHcm91cCkpIHtcblx0XHRcdFx0Y29uc3QgZ2sgPSBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5sb2FkU3ltR3JvdXBLZXkoaW5zdGFuY2UuX293bmVyR3JvdXAsIE51bWJlcihpbnN0YW5jZS5fb3duZXJLZXlWZXJzaW9uID8/IDApKVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5yZXNvbHZlU2Vzc2lvbktleVdpdGhPd25lcktleShpbnN0YW5jZSwgZ2spXG5cdFx0XHR9IGVsc2UgaWYgKGluc3RhbmNlLm93bmVyRW5jU2Vzc2lvbktleSkge1xuXHRcdFx0XHQvLyBMaWtlbHkgYSBEYXRhVHJhbnNmZXJUeXBlLCBzbyB0aGlzIGlzIGEgc2VydmljZS5cblx0XHRcdFx0Y29uc3QgZ2sgPSBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5sb2FkU3ltR3JvdXBLZXkodGhpcy51c2VyRmFjYWRlLmdldEdyb3VwSWQoR3JvdXBUeXBlLk1haWwpLCBOdW1iZXIoaW5zdGFuY2Uub3duZXJLZXlWZXJzaW9uID8/IDApKVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5yZXNvbHZlU2Vzc2lvbktleVdpdGhPd25lcktleShpbnN0YW5jZSwgZ2spXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBTZWUgUGVybWlzc2lvblR5cGUganNkb2MgZm9yIG1vcmUgaW5mbyBvbiBwZXJtaXNzaW9uc1xuXHRcdFx0XHRjb25zdCBwZXJtaXNzaW9ucyA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRBbGwoUGVybWlzc2lvblR5cGVSZWYsIGluc3RhbmNlLl9wZXJtaXNzaW9ucylcblx0XHRcdFx0cmV0dXJuIChhd2FpdCB0aGlzLnRyeVN5bW1ldHJpY1Blcm1pc3Npb24ocGVybWlzc2lvbnMpKSA/PyAoYXdhaXQgdGhpcy5yZXNvbHZlV2l0aFB1YmxpY09yRXh0ZXJuYWxQZXJtaXNzaW9uKHBlcm1pc3Npb25zLCBpbnN0YW5jZSwgdHlwZU1vZGVsKSlcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIENyeXB0b0Vycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiZmFpbGVkIHRvIHJlc29sdmUgc2Vzc2lvbiBrZXlcIiwgZSlcblx0XHRcdFx0dGhyb3cgbmV3IFNlc3Npb25LZXlOb3RGb3VuZEVycm9yKFwiQ3J5cHRvIGVycm9yIHdoaWxlIHJlc29sdmluZyBzZXNzaW9uIGtleSBmb3IgaW5zdGFuY2UgXCIgKyBpbnN0YW5jZS5faWQpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFRha2VzIGEgZnJlc2hseSBKU09OLXBhcnNlZCwgdW5tYXBwZWQgb2JqZWN0IGFuZCBhcHBseSBtaWdyYXRpb25zIGFzIG5lY2Vzc2FyeVxuXHQgKiBAcGFyYW0gdHlwZVJlZlxuXHQgKiBAcGFyYW0gZGF0YVxuXHQgKiBAcmV0dXJuIHRoZSB1bm1hcHBlZCBhbmQgc3RpbGwgZW5jcnlwdGVkIGluc3RhbmNlXG5cdCAqL1xuXHRhc3luYyBhcHBseU1pZ3JhdGlvbnM8VCBleHRlbmRzIFNvbWVFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIGFueT4+IHtcblx0XHRpZiAoaXNTYW1lVHlwZVJlZih0eXBlUmVmLCBHcm91cEluZm9UeXBlUmVmKSAmJiBkYXRhLl9vd25lckdyb3VwID09IG51bGwpIHtcblx0XHRcdHJldHVybiB0aGlzLmFwcGx5Q3VzdG9tZXJHcm91cE93bmVyc2hpcFRvR3JvdXBJbmZvKGRhdGEpXG5cdFx0fSBlbHNlIGlmIChpc1NhbWVUeXBlUmVmKHR5cGVSZWYsIFR1dGFub3RhUHJvcGVydGllc1R5cGVSZWYpICYmIGRhdGEuX293bmVyRW5jU2Vzc2lvbktleSA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5lbmNyeXB0VHV0YW5vdGFQcm9wZXJ0aWVzKGRhdGEpXG5cdFx0fSBlbHNlIGlmIChpc1NhbWVUeXBlUmVmKHR5cGVSZWYsIFB1c2hJZGVudGlmaWVyVHlwZVJlZikgJiYgZGF0YS5fb3duZXJFbmNTZXNzaW9uS2V5ID09IG51bGwpIHtcblx0XHRcdHJldHVybiB0aGlzLmFkZFNlc3Npb25LZXlUb1B1c2hJZGVudGlmaWVyKGRhdGEpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBkYXRhXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEluIGNhc2UgdGhlIGdpdmVuIGJ1Y2tldEtleSBpcyBhIGxpdGVyYWwgdGhlIGxpdGVyYWwgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gYW4gaW5zdGFuY2UgYW5kIHJldHVybi4gSW4gY2FzZSB0aGUgQnVja2V0S2V5IGlzIGFscmVhZHkgYW4gaW5zdGFuY2UgdGhlXG5cdCAqIGluc3RhbmNlIGlzIHJldHVybmVkLlxuXHQgKiBAcGFyYW0gYnVja2V0S2V5SW5zdGFuY2VPckxpdGVyYWwgVGhlIGJ1Y2tldCBrZXkgYXMgbGl0ZXJhbCBvciBpbnN0YW5jZVxuXHQgKi9cblx0YXN5bmMgY29udmVydEJ1Y2tldEtleVRvSW5zdGFuY2VJZk5lY2Vzc2FyeShidWNrZXRLZXlJbnN0YW5jZU9yTGl0ZXJhbDogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8QnVja2V0S2V5PiB7XG5cdFx0aWYgKHRoaXMuaXNMaXRlcmFsSW5zdGFuY2UoYnVja2V0S2V5SW5zdGFuY2VPckxpdGVyYWwpKSB7XG5cdFx0XHQvLyBkZWNyeXB0QW5kTWFwVG9JbnN0YW5jZSBpcyBtaXNsZWFkaW5nIGhlcmUgKGl0J3Mgbm90IGdvaW5nIHRvIGJlIGRlY3J5cHRlZCksIGJ1dCB3ZSB3YW50IHRvIG1hcCB0aGUgQnVja2V0S2V5IGFnZ3JlZ2F0ZSBhbmQgaXRzIHNlc3Npb24ga2V5IGZyb21cblx0XHRcdC8vIGEgbGl0ZXJhbCB0byBhbiBpbnN0YW5jZSB0byBoYXZlIHRoZSBlbmNyeXB0ZWQga2V5cyBpbiBiaW5hcnkgZm9ybWF0IGFuZCBub3QgYXMgYmFzZSA2NC4gVGhlcmUgaXMgYWN0dWFsbHkgbm8gZGVjcnlwdGlvbiBvbmdvaW5nLCBqdXN0XG5cdFx0XHQvLyBtYXBUb0luc3RhbmNlLlxuXHRcdFx0Y29uc3QgYnVja2V0S2V5VHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UoQnVja2V0S2V5VHlwZVJlZilcblx0XHRcdHJldHVybiAoYXdhaXQgdGhpcy5pbnN0YW5jZU1hcHBlci5kZWNyeXB0QW5kTWFwVG9JbnN0YW5jZShidWNrZXRLZXlUeXBlTW9kZWwsIGJ1Y2tldEtleUluc3RhbmNlT3JMaXRlcmFsLCBudWxsKSkgYXMgQnVja2V0S2V5XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGJ1Y2tldCBrZXkgd2FzIGFscmVhZHkgZGVjb2RlZFxuXHRcdFx0cmV0dXJuIGJ1Y2tldEtleUluc3RhbmNlT3JMaXRlcmFsIGFzIEJ1Y2tldEtleVxuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyByZXNvbHZlV2l0aEJ1Y2tldEtleShidWNrZXRLZXk6IEJ1Y2tldEtleSwgaW5zdGFuY2U6IFJlY29yZDxzdHJpbmcsIGFueT4sIHR5cGVNb2RlbDogVHlwZU1vZGVsKTogUHJvbWlzZTxSZXNvbHZlZFNlc3Npb25LZXlzPiB7XG5cdFx0Y29uc3QgaW5zdGFuY2VFbGVtZW50SWQgPSB0aGlzLmdldEVsZW1lbnRJZEZyb21JbnN0YW5jZShpbnN0YW5jZSlcblx0XHRsZXQgZGVjcnlwdGVkQnVja2V0S2V5OiBBZXNLZXlcblx0XHRsZXQgdW5lbmNyeXB0ZWRTZW5kZXJBdXRoU3RhdHVzOiBFbmNyeXB0aW9uQXV0aFN0YXR1cyB8IG51bGwgPSBudWxsXG5cdFx0bGV0IHBxTWVzc2FnZVNlbmRlcktleTogRWNjUHVibGljS2V5IHwgbnVsbCA9IG51bGxcblx0XHRpZiAoYnVja2V0S2V5LmtleUdyb3VwICYmIGJ1Y2tldEtleS5wdWJFbmNCdWNrZXRLZXkpIHtcblx0XHRcdC8vIGJ1Y2tldCBrZXkgaXMgZW5jcnlwdGVkIHdpdGggcHVibGljIGtleSBmb3IgaW50ZXJuYWwgcmVjaXBpZW50XG5cdFx0XHRjb25zdCB7IGRlY3J5cHRlZEFlc0tleSwgc2VuZGVySWRlbnRpdHlQdWJLZXkgfSA9IGF3YWl0IHRoaXMuYXN5bW1ldHJpY0NyeXB0b0ZhY2FkZS5sb2FkS2V5UGFpckFuZERlY3J5cHRTeW1LZXkoXG5cdFx0XHRcdGJ1Y2tldEtleS5rZXlHcm91cCxcblx0XHRcdFx0TnVtYmVyKGJ1Y2tldEtleS5yZWNpcGllbnRLZXlWZXJzaW9uKSxcblx0XHRcdFx0YXNDcnlwdG9Qcm90b29jb2xWZXJzaW9uKGJ1Y2tldEtleS5wcm90b2NvbFZlcnNpb24pLFxuXHRcdFx0XHRidWNrZXRLZXkucHViRW5jQnVja2V0S2V5LFxuXHRcdFx0KVxuXHRcdFx0ZGVjcnlwdGVkQnVja2V0S2V5ID0gZGVjcnlwdGVkQWVzS2V5XG5cdFx0XHRwcU1lc3NhZ2VTZW5kZXJLZXkgPSBzZW5kZXJJZGVudGl0eVB1YktleVxuXHRcdH0gZWxzZSBpZiAoYnVja2V0S2V5Lmdyb3VwRW5jQnVja2V0S2V5KSB7XG5cdFx0XHQvLyByZWNlaXZlZCBhcyBzZWN1cmUgZXh0ZXJuYWwgcmVjaXBpZW50IG9yIHJlcGx5IGZyb20gc2VjdXJlIGV4dGVybmFsIHNlbmRlclxuXHRcdFx0bGV0IGtleUdyb3VwXG5cdFx0XHRjb25zdCBncm91cEtleVZlcnNpb24gPSBOdW1iZXIoYnVja2V0S2V5LnJlY2lwaWVudEtleVZlcnNpb24pXG5cdFx0XHRpZiAoYnVja2V0S2V5LmtleUdyb3VwKSB7XG5cdFx0XHRcdC8vIDEuIFVzZXMgd2hlbiByZWNlaXZpbmcgY29uZmlkZW50aWFsIHJlcGxpZXMgZnJvbSBleHRlcm5hbCB1c2Vycy5cblx0XHRcdFx0Ly8gMi4gbGVnYWN5IGNvZGUgcGF0aCBmb3Igb2xkIGV4dGVybmFsIGNsaWVudHMgdGhhdCB1c2VkIHRvIGVuY3J5cHQgYnVja2V0IGtleXMgd2l0aCB1c2VyIGdyb3VwIGtleXMuXG5cdFx0XHRcdGtleUdyb3VwID0gYnVja2V0S2V5LmtleUdyb3VwXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBieSBkZWZhdWx0LCB3ZSB0cnkgdG8gZGVjcnlwdCB0aGUgYnVja2V0IGtleSB3aXRoIHRoZSBvd25lckdyb3VwS2V5IChlLmcuIHNlY3VyZSBleHRlcm5hbCByZWNpcGllbnQpXG5cdFx0XHRcdGtleUdyb3VwID0gbmV2ZXJOdWxsKGluc3RhbmNlLl9vd25lckdyb3VwKVxuXHRcdFx0fVxuXG5cdFx0XHRkZWNyeXB0ZWRCdWNrZXRLZXkgPSBhd2FpdCB0aGlzLnJlc29sdmVXaXRoR3JvdXBSZWZlcmVuY2Uoa2V5R3JvdXAsIGdyb3VwS2V5VmVyc2lvbiwgYnVja2V0S2V5Lmdyb3VwRW5jQnVja2V0S2V5KVxuXHRcdFx0dW5lbmNyeXB0ZWRTZW5kZXJBdXRoU3RhdHVzID0gRW5jcnlwdGlvbkF1dGhTdGF0dXMuQUVTX05PX0FVVEhFTlRJQ0FUSU9OXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBTZXNzaW9uS2V5Tm90Rm91bmRFcnJvcihgZW5jcnlwdGVkIGJ1Y2tldCBrZXkgbm90IHNldCBvbiBpbnN0YW5jZSAke3R5cGVNb2RlbC5uYW1lfWApXG5cdFx0fVxuXHRcdGNvbnN0IHJlc29sdmVkU2Vzc2lvbktleXMgPSBhd2FpdCB0aGlzLmNvbGxlY3RBbGxJbnN0YW5jZVNlc3Npb25LZXlzQW5kQXV0aGVudGljYXRlKFxuXHRcdFx0YnVja2V0S2V5LFxuXHRcdFx0ZGVjcnlwdGVkQnVja2V0S2V5LFxuXHRcdFx0aW5zdGFuY2VFbGVtZW50SWQsXG5cdFx0XHRpbnN0YW5jZSxcblx0XHRcdHR5cGVNb2RlbCxcblx0XHRcdHVuZW5jcnlwdGVkU2VuZGVyQXV0aFN0YXR1cyxcblx0XHRcdHBxTWVzc2FnZVNlbmRlcktleSxcblx0XHQpXG5cblx0XHRhd2FpdCB0aGlzLm93bmVyRW5jU2Vzc2lvbktleXNVcGRhdGVRdWV1ZS51cGRhdGVJbnN0YW5jZVNlc3Npb25LZXlzKHJlc29sdmVkU2Vzc2lvbktleXMuaW5zdGFuY2VTZXNzaW9uS2V5cywgdHlwZU1vZGVsKVxuXG5cdFx0Ly8gZm9yIHN5bW1ldHJpY2FsbHkgZW5jcnlwdGVkIGluc3RhbmNlcyBfb3duZXJFbmNTZXNzaW9uS2V5IGlzIHNlbnQgZnJvbSB0aGUgc2VydmVyLlxuXHRcdC8vIGluIHRoaXMgY2FzZSBpdCBpcyBub3QgeWV0IGFuZCB3ZSBuZWVkIHRvIHNldCBpdCBiZWNhdXNlIHRoZSByZXN0IG9mIHRoZSBhcHAgZXhwZWN0cyBpdC5cblx0XHRjb25zdCBncm91cEtleSA9IGF3YWl0IHRoaXMua2V5TG9hZGVyRmFjYWRlLmdldEN1cnJlbnRTeW1Hcm91cEtleShpbnN0YW5jZS5fb3duZXJHcm91cCkgLy8gZ2V0IGN1cnJlbnQga2V5IGZvciBlbmNyeXB0aW5nXG5cdFx0dGhpcy5zZXRPd25lckVuY1Nlc3Npb25LZXlVbm1hcHBlZChcblx0XHRcdGluc3RhbmNlIGFzIFVubWFwcGVkT3duZXJHcm91cEluc3RhbmNlLFxuXHRcdFx0ZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkoZ3JvdXBLZXksIHJlc29sdmVkU2Vzc2lvbktleXMucmVzb2x2ZWRTZXNzaW9uS2V5Rm9ySW5zdGFuY2UpLFxuXHRcdClcblx0XHRyZXR1cm4gcmVzb2x2ZWRTZXNzaW9uS2V5c1xuXHR9XG5cblx0LyoqXG5cdCAqIENhbGN1bGF0ZXMgdGhlIFNIQS0yNTYgY2hlY2tzdW0gb2YgYSBzdHJpbmcgdmFsdWUgYXMgVVRGLTggYnl0ZXMgYW5kIHJldHVybnMgaXQgYXMgYSBiYXNlNjQtZW5jb2RlZCBzdHJpbmdcblx0ICovXG5cdHB1YmxpYyBhc3luYyBzaGEyNTYodmFsdWU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0cmV0dXJuIHVpbnQ4QXJyYXlUb0Jhc2U2NChzaGEyNTZIYXNoKHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkodmFsdWUpKSlcblx0fVxuXG5cdC8qKlxuXHQgKiBEZWNyeXB0cyB0aGUgZ2l2ZW4gZW5jcnlwdGVkIGJ1Y2tldCBrZXkgd2l0aCB0aGUgZ3JvdXAga2V5IG9mIHRoZSBnaXZlbiBncm91cC4gSW4gY2FzZSB0aGUgY3VycmVudCB1c2VyIGlzIG5vdFxuXHQgKiBtZW1iZXIgb2YgdGhlIGtleSBncm91cCB0aGUgZnVuY3Rpb24gdHJpZXMgdG8gcmVzb2x2ZSB0aGUgZ3JvdXAga2V5IHVzaW5nIHRoZSBhZG1pbkVuY0dyb3VwS2V5LlxuXHQgKiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgcmVzb2x2aW5nIHRoZSBCdWNrZXRLZXkgd2hlbiByZWNlaXZpbmcgYSByZXBseSBmcm9tIGFuIGV4dGVybmFsIE1haWxib3guXG5cdCAqIEBwYXJhbSBrZXlHcm91cCBUaGUgZ3JvdXAgdGhhdCBob2xkcyB0aGUgZW5jcnlwdGlvbiBrZXkuXG5cdCAqIEBwYXJhbSBncm91cEtleVZlcnNpb24gdGhlIHZlcnNpb24gb2YgdGhlIGtleSBmcm9tIHRoZSBrZXlHcm91cFxuXHQgKiBAcGFyYW0gZ3JvdXBFbmNCdWNrZXRLZXkgVGhlIGdyb3VwIGtleSBlbmNyeXB0ZWQgYnVja2V0IGtleS5cblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcmVzb2x2ZVdpdGhHcm91cFJlZmVyZW5jZShrZXlHcm91cDogSWQsIGdyb3VwS2V5VmVyc2lvbjogbnVtYmVyLCBncm91cEVuY0J1Y2tldEtleTogVWludDhBcnJheSk6IFByb21pc2U8QWVzS2V5PiB7XG5cdFx0aWYgKHRoaXMudXNlckZhY2FkZS5oYXNHcm91cChrZXlHcm91cCkpIHtcblx0XHRcdC8vIHRoZSBsb2dnZWQtaW4gdXNlciAobW9zdCBsaWtlbHkgZXh0ZXJuYWwpIGlzIGEgbWVtYmVyIG9mIHRoYXQgZ3JvdXAuIFRoZW4gd2UgaGF2ZSB0aGUgZ3JvdXAga2V5IGZyb20gdGhlIG1lbWJlcnNoaXBzXG5cdFx0XHRjb25zdCBncm91cEtleSA9IGF3YWl0IHRoaXMua2V5TG9hZGVyRmFjYWRlLmxvYWRTeW1Hcm91cEtleShrZXlHcm91cCwgZ3JvdXBLZXlWZXJzaW9uKVxuXHRcdFx0cmV0dXJuIGRlY3J5cHRLZXkoZ3JvdXBLZXksIGdyb3VwRW5jQnVja2V0S2V5KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBpbnRlcm5hbCB1c2VyIHJlY2VpdmluZyBhIG1haWwgZnJvbSBzZWN1cmUgZXh0ZXJuYWw6XG5cdFx0XHQvLyBpbnRlcm5hbCB1c2VyIGdyb3VwIGtleSAtPiBleHRlcm5hbCB1c2VyIGdyb3VwIGtleSAtPiBleHRlcm5hbCBtYWlsIGdyb3VwIGtleSAtPiBidWNrZXQga2V5XG5cdFx0XHRjb25zdCBleHRlcm5hbE1haWxHcm91cElkID0ga2V5R3JvdXBcblx0XHRcdGNvbnN0IGV4dGVybmFsTWFpbEdyb3VwS2V5VmVyc2lvbiA9IGdyb3VwS2V5VmVyc2lvblxuXHRcdFx0Y29uc3QgZXh0ZXJuYWxNYWlsR3JvdXAgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEdyb3VwVHlwZVJlZiwgZXh0ZXJuYWxNYWlsR3JvdXBJZClcblxuXHRcdFx0Y29uc3QgZXh0ZXJuYWxVc2VyR3JvdXBkSWQgPSBleHRlcm5hbE1haWxHcm91cC5hZG1pblxuXHRcdFx0aWYgKCFleHRlcm5hbFVzZXJHcm91cGRJZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgU2Vzc2lvbktleU5vdEZvdW5kRXJyb3IoXCJubyBhZG1pbiBncm91cCBvbiBrZXkgZ3JvdXA6IFwiICsgZXh0ZXJuYWxNYWlsR3JvdXBJZClcblx0XHRcdH1cblx0XHRcdGNvbnN0IGV4dGVybmFsVXNlckdyb3VwS2V5VmVyc2lvbiA9IE51bWJlcihleHRlcm5hbE1haWxHcm91cC5hZG1pbkdyb3VwS2V5VmVyc2lvbiA/PyAwKVxuXHRcdFx0Y29uc3QgZXh0ZXJuYWxVc2VyR3JvdXAgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEdyb3VwVHlwZVJlZiwgZXh0ZXJuYWxVc2VyR3JvdXBkSWQpXG5cblx0XHRcdGNvbnN0IGludGVybmFsVXNlckdyb3VwSWQgPSBleHRlcm5hbFVzZXJHcm91cC5hZG1pblxuXHRcdFx0Y29uc3QgaW50ZXJuYWxVc2VyR3JvdXBLZXlWZXJzaW9uID0gTnVtYmVyKGV4dGVybmFsVXNlckdyb3VwLmFkbWluR3JvdXBLZXlWZXJzaW9uID8/IDApXG5cdFx0XHRpZiAoIShpbnRlcm5hbFVzZXJHcm91cElkICYmIHRoaXMudXNlckZhY2FkZS5oYXNHcm91cChpbnRlcm5hbFVzZXJHcm91cElkKSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IFNlc3Npb25LZXlOb3RGb3VuZEVycm9yKFwibm8gYWRtaW4gZ3JvdXAgb3Igbm8gbWVtYmVyc2hpcCBvZiBhZG1pbiBncm91cDogXCIgKyBpbnRlcm5hbFVzZXJHcm91cElkKVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBpbnRlcm5hbFVzZXJHcm91cEtleSA9IGF3YWl0IHRoaXMua2V5TG9hZGVyRmFjYWRlLmxvYWRTeW1Hcm91cEtleShpbnRlcm5hbFVzZXJHcm91cElkLCBpbnRlcm5hbFVzZXJHcm91cEtleVZlcnNpb24pXG5cblx0XHRcdGNvbnN0IGN1cnJlbnRFeHRlcm5hbFVzZXJHcm91cEtleSA9IGRlY3J5cHRLZXkoaW50ZXJuYWxVc2VyR3JvdXBLZXksIGFzc2VydE5vdE51bGwoZXh0ZXJuYWxVc2VyR3JvdXAuYWRtaW5Hcm91cEVuY0dLZXkpKVxuXHRcdFx0Y29uc3QgZXh0ZXJuYWxVc2VyR3JvdXBLZXkgPSBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5sb2FkU3ltR3JvdXBLZXkoZXh0ZXJuYWxVc2VyR3JvdXBkSWQsIGV4dGVybmFsVXNlckdyb3VwS2V5VmVyc2lvbiwge1xuXHRcdFx0XHRvYmplY3Q6IGN1cnJlbnRFeHRlcm5hbFVzZXJHcm91cEtleSxcblx0XHRcdFx0dmVyc2lvbjogTnVtYmVyKGV4dGVybmFsVXNlckdyb3VwLmdyb3VwS2V5VmVyc2lvbiksXG5cdFx0XHR9KVxuXG5cdFx0XHRjb25zdCBjdXJyZW50RXh0ZXJuYWxNYWlsR3JvdXBLZXkgPSBkZWNyeXB0S2V5KGV4dGVybmFsVXNlckdyb3VwS2V5LCBhc3NlcnROb3ROdWxsKGV4dGVybmFsTWFpbEdyb3VwLmFkbWluR3JvdXBFbmNHS2V5KSlcblx0XHRcdGNvbnN0IGV4dGVybmFsTWFpbEdyb3VwS2V5ID0gYXdhaXQgdGhpcy5rZXlMb2FkZXJGYWNhZGUubG9hZFN5bUdyb3VwS2V5KGV4dGVybmFsTWFpbEdyb3VwSWQsIGV4dGVybmFsTWFpbEdyb3VwS2V5VmVyc2lvbiwge1xuXHRcdFx0XHRvYmplY3Q6IGN1cnJlbnRFeHRlcm5hbE1haWxHcm91cEtleSxcblx0XHRcdFx0dmVyc2lvbjogTnVtYmVyKGV4dGVybmFsTWFpbEdyb3VwLmdyb3VwS2V5VmVyc2lvbiksXG5cdFx0XHR9KVxuXG5cdFx0XHRyZXR1cm4gZGVjcnlwdEtleShleHRlcm5hbE1haWxHcm91cEtleSwgZ3JvdXBFbmNCdWNrZXRLZXkpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBhZGRTZXNzaW9uS2V5VG9QdXNoSWRlbnRpZmllcihkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBhbnk+PiB7XG5cdFx0Y29uc3QgdXNlckdyb3VwS2V5ID0gdGhpcy51c2VyRmFjYWRlLmdldEN1cnJlbnRVc2VyR3JvdXBLZXkoKVxuXG5cdFx0Ly8gc2V0IHNlc3Npb25LZXkgZm9yIGFsbG93aW5nIGVuY3J5cHRpb24gd2hlbiBvbGQgaW5zdGFuY2UgKDwgdjQzKSBpcyB1cGRhdGVkXG5cdFx0Y29uc3QgdHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UoUHVzaElkZW50aWZpZXJUeXBlUmVmKVxuXHRcdGF3YWl0IHRoaXMudXBkYXRlT3duZXJFbmNTZXNzaW9uS2V5KHR5cGVNb2RlbCwgZGF0YSwgdXNlckdyb3VwS2V5LCBhZXMyNTZSYW5kb21LZXkoKSlcblx0XHRyZXR1cm4gZGF0YVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBlbmNyeXB0VHV0YW5vdGFQcm9wZXJ0aWVzKGRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIGFueT4+IHtcblx0XHRjb25zdCB1c2VyR3JvdXBLZXkgPSB0aGlzLnVzZXJGYWNhZGUuZ2V0Q3VycmVudFVzZXJHcm91cEtleSgpXG5cblx0XHQvLyBFbmNyeXB0VHV0YW5vdGFQcm9wZXJ0aWVzU2VydmljZSBjb3VsZCBiZSByZW1vdmVkIGFuZCByZXBsYWNlZCB3aXRoIGEgTWlncmF0aW9uIHRoYXQgd3JpdGVzIHRoZSBrZXlcblx0XHRjb25zdCBncm91cEVuY1Nlc3Npb25LZXkgPSBlbmNyeXB0S2V5V2l0aFZlcnNpb25lZEtleSh1c2VyR3JvdXBLZXksIGFlczI1NlJhbmRvbUtleSgpKVxuXHRcdHRoaXMuc2V0T3duZXJFbmNTZXNzaW9uS2V5VW5tYXBwZWQoZGF0YSBhcyBVbm1hcHBlZE93bmVyR3JvdXBJbnN0YW5jZSwgZ3JvdXBFbmNTZXNzaW9uS2V5LCB0aGlzLnVzZXJGYWNhZGUuZ2V0VXNlckdyb3VwSWQoKSlcblx0XHRjb25zdCBtaWdyYXRpb25EYXRhID0gY3JlYXRlRW5jcnlwdFR1dGFub3RhUHJvcGVydGllc0RhdGEoe1xuXHRcdFx0cHJvcGVydGllczogZGF0YS5faWQsXG5cdFx0XHRzeW1LZXlWZXJzaW9uOiBTdHJpbmcoZ3JvdXBFbmNTZXNzaW9uS2V5LmVuY3J5cHRpbmdLZXlWZXJzaW9uKSxcblx0XHRcdHN5bUVuY1Nlc3Npb25LZXk6IGdyb3VwRW5jU2Vzc2lvbktleS5rZXksXG5cdFx0fSlcblx0XHRhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5wb3N0KEVuY3J5cHRUdXRhbm90YVByb3BlcnRpZXNTZXJ2aWNlLCBtaWdyYXRpb25EYXRhKVxuXHRcdHJldHVybiBkYXRhXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGFwcGx5Q3VzdG9tZXJHcm91cE93bmVyc2hpcFRvR3JvdXBJbmZvKGRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIGFueT4+IHtcblx0XHRjb25zdCBjdXN0b21lckdyb3VwTWVtYmVyc2hpcCA9IGFzc2VydE5vdE51bGwoXG5cdFx0XHR0aGlzLnVzZXJGYWNhZGUuZ2V0TG9nZ2VkSW5Vc2VyKCkubWVtYmVyc2hpcHMuZmluZCgoZzogR3JvdXBNZW1iZXJzaGlwKSA9PiBnLmdyb3VwVHlwZSA9PT0gR3JvdXBUeXBlLkN1c3RvbWVyKSxcblx0XHQpXG5cdFx0Y29uc3QgbGlzdFBlcm1pc3Npb25zID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZEFsbChQZXJtaXNzaW9uVHlwZVJlZiwgZGF0YS5faWRbMF0pXG5cdFx0Y29uc3QgY3VzdG9tZXJHcm91cFBlcm1pc3Npb24gPSBsaXN0UGVybWlzc2lvbnMuZmluZCgocCkgPT4gcC5ncm91cCA9PT0gY3VzdG9tZXJHcm91cE1lbWJlcnNoaXAuZ3JvdXApXG5cblx0XHRpZiAoIWN1c3RvbWVyR3JvdXBQZXJtaXNzaW9uKSB0aHJvdyBuZXcgU2Vzc2lvbktleU5vdEZvdW5kRXJyb3IoXCJQZXJtaXNzaW9uIG5vdCBmb3VuZCwgY291bGQgbm90IGFwcGx5IE93bmVyR3JvdXAgbWlncmF0aW9uXCIpXG5cdFx0Y29uc3QgY3VzdG9tZXJHcm91cEtleVZlcnNpb24gPSBOdW1iZXIoY3VzdG9tZXJHcm91cFBlcm1pc3Npb24uc3ltS2V5VmVyc2lvbiA/PyAwKVxuXHRcdGNvbnN0IGN1c3RvbWVyR3JvdXBLZXkgPSBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5sb2FkU3ltR3JvdXBLZXkoY3VzdG9tZXJHcm91cE1lbWJlcnNoaXAuZ3JvdXAsIGN1c3RvbWVyR3JvdXBLZXlWZXJzaW9uKVxuXHRcdGNvbnN0IHZlcnNpb25lZEN1c3RvbWVyR3JvdXBLZXkgPSB7IG9iamVjdDogY3VzdG9tZXJHcm91cEtleSwgdmVyc2lvbjogY3VzdG9tZXJHcm91cEtleVZlcnNpb24gfVxuXHRcdGNvbnN0IGxpc3RLZXkgPSBkZWNyeXB0S2V5KGN1c3RvbWVyR3JvdXBLZXksIGFzc2VydE5vdE51bGwoY3VzdG9tZXJHcm91cFBlcm1pc3Npb24uc3ltRW5jU2Vzc2lvbktleSkpXG5cdFx0Y29uc3QgZ3JvdXBJbmZvU2sgPSBkZWNyeXB0S2V5KGxpc3RLZXksIGJhc2U2NFRvVWludDhBcnJheShkYXRhLl9saXN0RW5jU2Vzc2lvbktleSkpXG5cblx0XHR0aGlzLnNldE93bmVyRW5jU2Vzc2lvbktleVVubWFwcGVkKFxuXHRcdFx0ZGF0YSBhcyBVbm1hcHBlZE93bmVyR3JvdXBJbnN0YW5jZSxcblx0XHRcdGVuY3J5cHRLZXlXaXRoVmVyc2lvbmVkS2V5KHZlcnNpb25lZEN1c3RvbWVyR3JvdXBLZXksIGdyb3VwSW5mb1NrKSxcblx0XHRcdGN1c3RvbWVyR3JvdXBNZW1iZXJzaGlwLmdyb3VwLFxuXHRcdClcblx0XHRyZXR1cm4gZGF0YVxuXHR9XG5cblx0cHJpdmF0ZSBzZXRPd25lckVuY1Nlc3Npb25LZXlVbm1hcHBlZCh1bm1hcHBlZEluc3RhbmNlOiBVbm1hcHBlZE93bmVyR3JvdXBJbnN0YW5jZSwga2V5OiBWZXJzaW9uZWRFbmNyeXB0ZWRLZXksIG93bmVyR3JvdXA/OiBJZCkge1xuXHRcdHVubWFwcGVkSW5zdGFuY2UuX293bmVyRW5jU2Vzc2lvbktleSA9IHVpbnQ4QXJyYXlUb0Jhc2U2NChrZXkua2V5KVxuXHRcdHVubWFwcGVkSW5zdGFuY2UuX293bmVyS2V5VmVyc2lvbiA9IGtleS5lbmNyeXB0aW5nS2V5VmVyc2lvbi50b1N0cmluZygpXG5cdFx0aWYgKG93bmVyR3JvdXApIHtcblx0XHRcdHVubWFwcGVkSW5zdGFuY2UuX293bmVyR3JvdXAgPSBvd25lckdyb3VwXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBzZXRPd25lckVuY1Nlc3Npb25LZXkoaW5zdGFuY2U6IEluc3RhbmNlLCBrZXk6IFZlcnNpb25lZEVuY3J5cHRlZEtleSkge1xuXHRcdGluc3RhbmNlLl9vd25lckVuY1Nlc3Npb25LZXkgPSBrZXkua2V5XG5cdFx0aW5zdGFuY2UuX293bmVyS2V5VmVyc2lvbiA9IGtleS5lbmNyeXB0aW5nS2V5VmVyc2lvbi50b1N0cmluZygpXG5cdH1cblxuXHQvKipcblx0ICogQHJldHVybiBXaGV0aGVyIHRoZSB7QHBhcmFtIGVsZW1lbnRPckxpdGVyYWx9IGlzIGEgdW5tYXBwZWQgdHlwZSwgYXMgdXNlZCBpbiBKU09OIGZvciB0cmFuc3BvcnQgb3IgaWYgaXQncyBhIHJ1bnRpbWUgcmVwcmVzZW50YXRpb24gb2YgYSB0eXBlLlxuXHQgKi9cblx0cHJpdmF0ZSBpc0xpdGVyYWxJbnN0YW5jZShlbGVtZW50T3JMaXRlcmFsOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHR5cGVvZiBlbGVtZW50T3JMaXRlcmFsLl90eXBlID09PSBcInVuZGVmaW5lZFwiXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHRyeVN5bW1ldHJpY1Blcm1pc3Npb24obGlzdFBlcm1pc3Npb25zOiBQZXJtaXNzaW9uW10pOiBQcm9taXNlPEFlc0tleSB8IG51bGw+IHtcblx0XHRjb25zdCBzeW1tZXRyaWNQZXJtaXNzaW9uOiBQZXJtaXNzaW9uIHwgbnVsbCA9XG5cdFx0XHRsaXN0UGVybWlzc2lvbnMuZmluZChcblx0XHRcdFx0KHApID0+XG5cdFx0XHRcdFx0KHAudHlwZSA9PT0gUGVybWlzc2lvblR5cGUuUHVibGljX1N5bW1ldHJpYyB8fCBwLnR5cGUgPT09IFBlcm1pc3Npb25UeXBlLlN5bW1ldHJpYykgJiZcblx0XHRcdFx0XHRwLl9vd25lckdyb3VwICYmXG5cdFx0XHRcdFx0dGhpcy51c2VyRmFjYWRlLmhhc0dyb3VwKHAuX293bmVyR3JvdXApLFxuXHRcdFx0KSA/PyBudWxsXG5cblx0XHRpZiAoc3ltbWV0cmljUGVybWlzc2lvbikge1xuXHRcdFx0Y29uc3QgZ2sgPSBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5sb2FkU3ltR3JvdXBLZXkoXG5cdFx0XHRcdGFzc2VydE5vdE51bGwoc3ltbWV0cmljUGVybWlzc2lvbi5fb3duZXJHcm91cCksXG5cdFx0XHRcdE51bWJlcihzeW1tZXRyaWNQZXJtaXNzaW9uLl9vd25lcktleVZlcnNpb24gPz8gMCksXG5cdFx0XHQpXG5cdFx0XHRyZXR1cm4gZGVjcnlwdEtleShnaywgYXNzZXJ0Tm90TnVsbChzeW1tZXRyaWNQZXJtaXNzaW9uLl9vd25lckVuY1Nlc3Npb25LZXkpKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXNvbHZlcyB0aGUgc2Vzc2lvbiBrZXkgZm9yIHRoZSBwcm92aWRlZCBpbnN0YW5jZSBhbmQgY29sbGVjdHMgYWxsIG90aGVyIGluc3RhbmNlcydcblx0ICogc2Vzc2lvbiBrZXlzIGluIG9yZGVyIHRvIHVwZGF0ZSB0aGVtLlxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBjb2xsZWN0QWxsSW5zdGFuY2VTZXNzaW9uS2V5c0FuZEF1dGhlbnRpY2F0ZShcblx0XHRidWNrZXRLZXk6IEJ1Y2tldEtleSxcblx0XHRkZWNCdWNrZXRLZXk6IG51bWJlcltdLFxuXHRcdGluc3RhbmNlRWxlbWVudElkOiBzdHJpbmcsXG5cdFx0aW5zdGFuY2U6IFJlY29yZDxzdHJpbmcsIGFueT4sXG5cdFx0dHlwZU1vZGVsOiBUeXBlTW9kZWwsXG5cdFx0ZW5jcnlwdGlvbkF1dGhTdGF0dXM6IEVuY3J5cHRpb25BdXRoU3RhdHVzIHwgbnVsbCxcblx0XHRwcU1lc3NhZ2VTZW5kZXJLZXk6IEVjY1B1YmxpY0tleSB8IG51bGwsXG5cdCk6IFByb21pc2U8UmVzb2x2ZWRTZXNzaW9uS2V5cz4ge1xuXHRcdGxldCByZXNvbHZlZFNlc3Npb25LZXlGb3JJbnN0YW5jZTogQWVzS2V5IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkXG5cdFx0Y29uc3QgaW5zdGFuY2VTZXNzaW9uS2V5cyA9IGF3YWl0IHByb21pc2VNYXAoYnVja2V0S2V5LmJ1Y2tldEVuY1Nlc3Npb25LZXlzLCBhc3luYyAoaW5zdGFuY2VTZXNzaW9uS2V5KSA9PiB7XG5cdFx0XHRjb25zdCBkZWNyeXB0ZWRTZXNzaW9uS2V5ID0gZGVjcnlwdEtleShkZWNCdWNrZXRLZXksIGluc3RhbmNlU2Vzc2lvbktleS5zeW1FbmNTZXNzaW9uS2V5KVxuXHRcdFx0Y29uc3QgZ3JvdXBLZXkgPSBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5nZXRDdXJyZW50U3ltR3JvdXBLZXkoaW5zdGFuY2UuX293bmVyR3JvdXApXG5cdFx0XHRjb25zdCBvd25lckVuY1Nlc3Npb25LZXkgPSBlbmNyeXB0S2V5V2l0aFZlcnNpb25lZEtleShncm91cEtleSwgZGVjcnlwdGVkU2Vzc2lvbktleSlcblx0XHRcdGNvbnN0IGluc3RhbmNlU2Vzc2lvbktleVdpdGhPd25lckVuY1Nlc3Npb25LZXkgPSBjcmVhdGVJbnN0YW5jZVNlc3Npb25LZXkoaW5zdGFuY2VTZXNzaW9uS2V5KVxuXHRcdFx0aWYgKGluc3RhbmNlRWxlbWVudElkID09IGluc3RhbmNlU2Vzc2lvbktleS5pbnN0YW5jZUlkKSB7XG5cdFx0XHRcdHJlc29sdmVkU2Vzc2lvbktleUZvckluc3RhbmNlID0gZGVjcnlwdGVkU2Vzc2lvbktleVxuXHRcdFx0XHQvLyB3ZSBjYW4gb25seSBhdXRoZW50aWNhdGUgb25jZSB3ZSBoYXZlIHRoZSBzZXNzaW9uIGtleVxuXHRcdFx0XHQvLyBiZWNhdXNlIHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIGNvbmZpZGVudGlhbCBmbGFnIGlzIHNldCwgd2hpY2ggaXMgZW5jcnlwdGVkIHN0aWxsXG5cdFx0XHRcdC8vIHdlIG5lZWQgdG8gZG8gaXQgaGVyZSBhdCB0aGUgbGF0ZXN0IGJlY2F1c2Ugd2UgbXVzdCB3cml0ZSB0aGUgZmxhZyB3aGVuIHVwZGF0aW5nIHRoZSBzZXNzaW9uIGtleSBvbiB0aGUgaW5zdGFuY2Vcblx0XHRcdFx0YXdhaXQgdGhpcy5hdXRoZW50aWNhdGVNYWluSW5zdGFuY2UoXG5cdFx0XHRcdFx0dHlwZU1vZGVsLFxuXHRcdFx0XHRcdGVuY3J5cHRpb25BdXRoU3RhdHVzLFxuXHRcdFx0XHRcdHBxTWVzc2FnZVNlbmRlcktleSxcblx0XHRcdFx0XHRidWNrZXRLZXkucHJvdG9jb2xWZXJzaW9uID09PSBDcnlwdG9Qcm90b2NvbFZlcnNpb24uVFVUQV9DUllQVCA/IE51bWJlcihidWNrZXRLZXkuc2VuZGVyS2V5VmVyc2lvbiA/PyAwKSA6IG51bGwsXG5cdFx0XHRcdFx0aW5zdGFuY2UsXG5cdFx0XHRcdFx0cmVzb2x2ZWRTZXNzaW9uS2V5Rm9ySW5zdGFuY2UsXG5cdFx0XHRcdFx0aW5zdGFuY2VTZXNzaW9uS2V5V2l0aE93bmVyRW5jU2Vzc2lvbktleSxcblx0XHRcdFx0XHRkZWNyeXB0ZWRTZXNzaW9uS2V5LFxuXHRcdFx0XHQpXG5cdFx0XHR9XG5cdFx0XHRpbnN0YW5jZVNlc3Npb25LZXlXaXRoT3duZXJFbmNTZXNzaW9uS2V5LnN5bUVuY1Nlc3Npb25LZXkgPSBvd25lckVuY1Nlc3Npb25LZXkua2V5XG5cdFx0XHRpbnN0YW5jZVNlc3Npb25LZXlXaXRoT3duZXJFbmNTZXNzaW9uS2V5LnN5bUtleVZlcnNpb24gPSBTdHJpbmcob3duZXJFbmNTZXNzaW9uS2V5LmVuY3J5cHRpbmdLZXlWZXJzaW9uKVxuXHRcdFx0cmV0dXJuIGluc3RhbmNlU2Vzc2lvbktleVdpdGhPd25lckVuY1Nlc3Npb25LZXlcblx0XHR9KVxuXG5cdFx0aWYgKHJlc29sdmVkU2Vzc2lvbktleUZvckluc3RhbmNlKSB7XG5cdFx0XHRyZXR1cm4geyByZXNvbHZlZFNlc3Npb25LZXlGb3JJbnN0YW5jZSwgaW5zdGFuY2VTZXNzaW9uS2V5cyB9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBTZXNzaW9uS2V5Tm90Rm91bmRFcnJvcihcIm5vIHNlc3Npb24ga2V5IGZvciBpbnN0YW5jZSBcIiArIGluc3RhbmNlLl9pZClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGF1dGhlbnRpY2F0ZU1haW5JbnN0YW5jZShcblx0XHR0eXBlTW9kZWw6IFR5cGVNb2RlbCxcblx0XHRlbmNyeXB0aW9uQXV0aFN0YXR1czpcblx0XHRcdHwgRW5jcnlwdGlvbkF1dGhTdGF0dXNcblx0XHRcdHwgbnVsbFxuXHRcdFx0fCBFbmNyeXB0aW9uQXV0aFN0YXR1cy5SU0FfTk9fQVVUSEVOVElDQVRJT05cblx0XHRcdHwgRW5jcnlwdGlvbkF1dGhTdGF0dXMuVFVUQUNSWVBUX0FVVEhFTlRJQ0FUSU9OX1NVQ0NFRURFRFxuXHRcdFx0fCBFbmNyeXB0aW9uQXV0aFN0YXR1cy5UVVRBQ1JZUFRfQVVUSEVOVElDQVRJT05fRkFJTEVEXG5cdFx0XHR8IEVuY3J5cHRpb25BdXRoU3RhdHVzLkFFU19OT19BVVRIRU5USUNBVElPTixcblx0XHRwcU1lc3NhZ2VTZW5kZXJLZXk6IFVpbnQ4QXJyYXkgfCBudWxsLFxuXHRcdHBxTWVzc2FnZVNlbmRlcktleVZlcnNpb246IG51bWJlciB8IG51bGwsXG5cdFx0aW5zdGFuY2U6IFJlY29yZDxzdHJpbmcsIGFueT4sXG5cdFx0cmVzb2x2ZWRTZXNzaW9uS2V5Rm9ySW5zdGFuY2U6IG51bWJlcltdLFxuXHRcdGluc3RhbmNlU2Vzc2lvbktleVdpdGhPd25lckVuY1Nlc3Npb25LZXk6IEluc3RhbmNlU2Vzc2lvbktleSxcblx0XHRkZWNyeXB0ZWRTZXNzaW9uS2V5OiBudW1iZXJbXSxcblx0KSB7XG5cdFx0Ly8gd2Ugb25seSBhdXRoZW50aWNhdGUgbWFpbCBpbnN0YW5jZXNcblx0XHRjb25zdCBpc01haWxJbnN0YW5jZSA9IGlzU2FtZVR5cGVSZWZCeUF0dHIoTWFpbFR5cGVSZWYsIHR5cGVNb2RlbC5hcHAsIHR5cGVNb2RlbC5uYW1lKVxuXHRcdGlmIChpc01haWxJbnN0YW5jZSkge1xuXHRcdFx0aWYgKCFlbmNyeXB0aW9uQXV0aFN0YXR1cykge1xuXHRcdFx0XHRpZiAoIXBxTWVzc2FnZVNlbmRlcktleSkge1xuXHRcdFx0XHRcdGVuY3J5cHRpb25BdXRoU3RhdHVzID0gRW5jcnlwdGlvbkF1dGhTdGF0dXMuUlNBX05PX0FVVEhFTlRJQ0FUSU9OXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc3QgbWFpbCA9IHRoaXMuaXNMaXRlcmFsSW5zdGFuY2UoaW5zdGFuY2UpXG5cdFx0XHRcdFx0XHQ/ICgoYXdhaXQgdGhpcy5pbnN0YW5jZU1hcHBlci5kZWNyeXB0QW5kTWFwVG9JbnN0YW5jZSh0eXBlTW9kZWwsIGluc3RhbmNlLCByZXNvbHZlZFNlc3Npb25LZXlGb3JJbnN0YW5jZSkpIGFzIE1haWwpXG5cdFx0XHRcdFx0XHQ6IChpbnN0YW5jZSBhcyBNYWlsKVxuXHRcdFx0XHRcdGNvbnN0IHNlbmRlck1haWxBZGRyZXNzID0gbWFpbC5jb25maWRlbnRpYWwgPyBtYWlsLnNlbmRlci5hZGRyZXNzIDogU1lTVEVNX0dST1VQX01BSUxfQUREUkVTU1xuXHRcdFx0XHRcdGVuY3J5cHRpb25BdXRoU3RhdHVzID0gYXdhaXQgdGhpcy50cnlBdXRoZW50aWNhdGVTZW5kZXJPZk1haW5JbnN0YW5jZShzZW5kZXJNYWlsQWRkcmVzcywgcHFNZXNzYWdlU2VuZGVyS2V5LCBwcU1lc3NhZ2VTZW5kZXJLZXlWZXJzaW9uKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpbnN0YW5jZVNlc3Npb25LZXlXaXRoT3duZXJFbmNTZXNzaW9uS2V5LmVuY3J5cHRpb25BdXRoU3RhdHVzID0gYWVzRW5jcnlwdChkZWNyeXB0ZWRTZXNzaW9uS2V5LCBzdHJpbmdUb1V0ZjhVaW50OEFycmF5KGVuY3J5cHRpb25BdXRoU3RhdHVzKSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHRyeUF1dGhlbnRpY2F0ZVNlbmRlck9mTWFpbkluc3RhbmNlKHNlbmRlck1haWxBZGRyZXNzOiBzdHJpbmcsIHBxTWVzc2FnZVNlbmRlcktleTogVWludDhBcnJheSwgcHFNZXNzYWdlU2VuZGVyS2V5VmVyc2lvbjogbnVtYmVyIHwgbnVsbCkge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5hc3ltbWV0cmljQ3J5cHRvRmFjYWRlLmF1dGhlbnRpY2F0ZVNlbmRlcihcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlkZW50aWZpZXI6IHNlbmRlck1haWxBZGRyZXNzLFxuXHRcdFx0XHRcdGlkZW50aWZpZXJUeXBlOiBQdWJsaWNLZXlJZGVudGlmaWVyVHlwZS5NQUlMX0FERFJFU1MsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHBxTWVzc2FnZVNlbmRlcktleSxcblx0XHRcdFx0YXNzZXJ0Tm90TnVsbChwcU1lc3NhZ2VTZW5kZXJLZXlWZXJzaW9uKSxcblx0XHRcdClcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHQvLyB3ZSBkbyBub3Qgd2FudCB0byBmYWlsIG1haWwgZGVjcnlwdGlvbiBoZXJlLCBlLmcuIGluIGNhc2UgYW4gYWxpYXMgd2FzIHJlbW92ZWQgd2Ugd291bGQgZ2V0IGEgcGVybWFuZW50IE5vdEZvdW5kRXJyb3IuXG5cdFx0XHQvLyBpbiB0aG9zZSBjYXNlcyB3ZSB3aWxsIGp1c3Qgc2hvdyBhIHdhcm5pbmcgYmFubmVyIGJ1dCBzdGlsbCB3YW50IHRvIGRpc3BsYXkgdGhlIG1haWxcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJDb3VsZCBub3QgYXV0aGVudGljYXRlIHNlbmRlclwiLCBlKVxuXHRcdFx0cmV0dXJuIEVuY3J5cHRpb25BdXRoU3RhdHVzLlRVVEFDUllQVF9BVVRIRU5USUNBVElPTl9GQUlMRURcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHJlc29sdmVXaXRoUHVibGljT3JFeHRlcm5hbFBlcm1pc3Npb24obGlzdFBlcm1pc3Npb25zOiBQZXJtaXNzaW9uW10sIGluc3RhbmNlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCB0eXBlTW9kZWw6IFR5cGVNb2RlbCk6IFByb21pc2U8QWVzS2V5PiB7XG5cdFx0Y29uc3QgcHViT3JFeHRQZXJtaXNzaW9uID0gbGlzdFBlcm1pc3Npb25zLmZpbmQoKHApID0+IHAudHlwZSA9PT0gUGVybWlzc2lvblR5cGUuUHVibGljIHx8IHAudHlwZSA9PT0gUGVybWlzc2lvblR5cGUuRXh0ZXJuYWwpID8/IG51bGxcblxuXHRcdGlmIChwdWJPckV4dFBlcm1pc3Npb24gPT0gbnVsbCkge1xuXHRcdFx0Y29uc3QgdHlwZU5hbWUgPSBgJHt0eXBlTW9kZWwuYXBwfS8ke3R5cGVNb2RlbC5uYW1lfWBcblx0XHRcdHRocm93IG5ldyBTZXNzaW9uS2V5Tm90Rm91bmRFcnJvcihgY291bGQgbm90IGZpbmQgcGVybWlzc2lvbiBmb3IgaW5zdGFuY2Ugb2YgdHlwZSAke3R5cGVOYW1lfSB3aXRoIGlkICR7dGhpcy5nZXRFbGVtZW50SWRGcm9tSW5zdGFuY2UoaW5zdGFuY2UpfWApXG5cdFx0fVxuXG5cdFx0Y29uc3QgYnVja2V0UGVybWlzc2lvbnMgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkQWxsKEJ1Y2tldFBlcm1pc3Npb25UeXBlUmVmLCBhc3NlcnROb3ROdWxsKHB1Yk9yRXh0UGVybWlzc2lvbi5idWNrZXQpLmJ1Y2tldFBlcm1pc3Npb25zKVxuXHRcdGNvbnN0IGJ1Y2tldFBlcm1pc3Npb24gPSBidWNrZXRQZXJtaXNzaW9ucy5maW5kKFxuXHRcdFx0KGJwKSA9PiAoYnAudHlwZSA9PT0gQnVja2V0UGVybWlzc2lvblR5cGUuUHVibGljIHx8IGJwLnR5cGUgPT09IEJ1Y2tldFBlcm1pc3Npb25UeXBlLkV4dGVybmFsKSAmJiBwdWJPckV4dFBlcm1pc3Npb24uX293bmVyR3JvdXAgPT09IGJwLl9vd25lckdyb3VwLFxuXHRcdClcblxuXHRcdC8vIGZpbmQgdGhlIGJ1Y2tldCBwZXJtaXNzaW9uIHdpdGggdGhlIHNhbWUgZ3JvdXAgYXMgdGhlIHBlcm1pc3Npb24gYW5kIHB1YmxpYyB0eXBlXG5cdFx0aWYgKGJ1Y2tldFBlcm1pc3Npb24gPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFNlc3Npb25LZXlOb3RGb3VuZEVycm9yKFwibm8gY29ycmVzcG9uZGluZyBidWNrZXQgcGVybWlzc2lvbiBmb3VuZFwiKVxuXHRcdH1cblxuXHRcdGlmIChidWNrZXRQZXJtaXNzaW9uLnR5cGUgPT09IEJ1Y2tldFBlcm1pc3Npb25UeXBlLkV4dGVybmFsKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5kZWNyeXB0V2l0aEV4dGVybmFsQnVja2V0KGJ1Y2tldFBlcm1pc3Npb24sIHB1Yk9yRXh0UGVybWlzc2lvbiwgaW5zdGFuY2UpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLmRlY3J5cHRXaXRoUHVibGljQnVja2V0V2l0aG91dEF1dGhlbnRpY2F0aW9uKGJ1Y2tldFBlcm1pc3Npb24sIGluc3RhbmNlLCBwdWJPckV4dFBlcm1pc3Npb24sIHR5cGVNb2RlbClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGRlY3J5cHRXaXRoRXh0ZXJuYWxCdWNrZXQoXG5cdFx0YnVja2V0UGVybWlzc2lvbjogQnVja2V0UGVybWlzc2lvbixcblx0XHRwdWJPckV4dFBlcm1pc3Npb246IFBlcm1pc3Npb24sXG5cdFx0aW5zdGFuY2U6IFJlY29yZDxzdHJpbmcsIGFueT4sXG5cdCk6IFByb21pc2U8QWVzS2V5PiB7XG5cdFx0bGV0IGJ1Y2tldEtleVxuXG5cdFx0aWYgKGJ1Y2tldFBlcm1pc3Npb24ub3duZXJFbmNCdWNrZXRLZXkgIT0gbnVsbCkge1xuXHRcdFx0Y29uc3Qgb3duZXJHcm91cEtleSA9IGF3YWl0IHRoaXMua2V5TG9hZGVyRmFjYWRlLmxvYWRTeW1Hcm91cEtleShcblx0XHRcdFx0bmV2ZXJOdWxsKGJ1Y2tldFBlcm1pc3Npb24uX293bmVyR3JvdXApLFxuXHRcdFx0XHROdW1iZXIoYnVja2V0UGVybWlzc2lvbi5vd25lcktleVZlcnNpb24gPz8gMCksXG5cdFx0XHQpXG5cdFx0XHRidWNrZXRLZXkgPSBkZWNyeXB0S2V5KG93bmVyR3JvdXBLZXksIGJ1Y2tldFBlcm1pc3Npb24ub3duZXJFbmNCdWNrZXRLZXkpXG5cdFx0fSBlbHNlIGlmIChidWNrZXRQZXJtaXNzaW9uLnN5bUVuY0J1Y2tldEtleSkge1xuXHRcdFx0Ly8gbGVnYWN5IGNhc2U6IGZvciB2ZXJ5IG9sZCBlbWFpbCBzZW50IHRvIGV4dGVybmFsIHVzZXIgd2UgdXNlZCBzeW1FbmNCdWNrZXRLZXkgb24gdGhlIGJ1Y2tldCBwZXJtaXNzaW9uLlxuXHRcdFx0Ly8gVGhlIGJ1Y2tldCBrZXkgaXMgZW5jcnlwdGVkIHdpdGggdGhlIHVzZXIgZ3JvdXAga2V5IG9mIHRoZSBleHRlcm5hbCB1c2VyLlxuXHRcdFx0Ly8gV2UgbWFpbnRhaW4gdGhpcyBjb2RlIGFzIHdlIHN0aWxsIGhhdmUgc29tZSBvbGQgQnVja2V0S2V5cyBpbiBzb21lIGV4dGVybmFsIG1haWxib3hlcy5cblx0XHRcdC8vIENhbiBiZSByZW1vdmVkIGlmIHdlIGZpbmlzaGVkIG1haWwgZGV0YWlscyBtaWdyYXRpb24gb3Igd2hlbiB3ZSBkbyBjbGVhbnVwIG9mIGV4dGVybmFsIG1haWxib3hlcy5cblx0XHRcdGNvbnN0IHVzZXJHcm91cEtleSA9IGF3YWl0IHRoaXMua2V5TG9hZGVyRmFjYWRlLmxvYWRTeW1Vc2VyR3JvdXBLZXkoTnVtYmVyKGJ1Y2tldFBlcm1pc3Npb24uc3ltS2V5VmVyc2lvbiA/PyAwKSlcblx0XHRcdGJ1Y2tldEtleSA9IGRlY3J5cHRLZXkodXNlckdyb3VwS2V5LCBidWNrZXRQZXJtaXNzaW9uLnN5bUVuY0J1Y2tldEtleSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IFNlc3Npb25LZXlOb3RGb3VuZEVycm9yKFxuXHRcdFx0XHRgQnVja2V0RW5jU2Vzc2lvbktleSBpcyBub3QgZGVmaW5lZCBmb3IgUGVybWlzc2lvbiAke3B1Yk9yRXh0UGVybWlzc2lvbi5faWQudG9TdHJpbmcoKX0gKEluc3RhbmNlOiAke0pTT04uc3RyaW5naWZ5KGluc3RhbmNlKX0pYCxcblx0XHRcdClcblx0XHR9XG5cblx0XHRyZXR1cm4gZGVjcnlwdEtleShidWNrZXRLZXksIG5ldmVyTnVsbChwdWJPckV4dFBlcm1pc3Npb24uYnVja2V0RW5jU2Vzc2lvbktleSkpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGRlY3J5cHRXaXRoUHVibGljQnVja2V0V2l0aG91dEF1dGhlbnRpY2F0aW9uKFxuXHRcdGJ1Y2tldFBlcm1pc3Npb246IEJ1Y2tldFBlcm1pc3Npb24sXG5cdFx0aW5zdGFuY2U6IFJlY29yZDxzdHJpbmcsIGFueT4sXG5cdFx0cHViT3JFeHRQZXJtaXNzaW9uOiBQZXJtaXNzaW9uLFxuXHRcdHR5cGVNb2RlbDogVHlwZU1vZGVsLFxuXHQpOiBQcm9taXNlPEFlc0tleT4ge1xuXHRcdGNvbnN0IHB1YkVuY0J1Y2tldEtleSA9IGJ1Y2tldFBlcm1pc3Npb24ucHViRW5jQnVja2V0S2V5XG5cdFx0aWYgKHB1YkVuY0J1Y2tldEtleSA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgU2Vzc2lvbktleU5vdEZvdW5kRXJyb3IoXG5cdFx0XHRcdGBQdWJFbmNCdWNrZXRLZXkgaXMgbm90IGRlZmluZWQgZm9yIEJ1Y2tldFBlcm1pc3Npb24gJHtidWNrZXRQZXJtaXNzaW9uLl9pZC50b1N0cmluZygpfSAoSW5zdGFuY2U6ICR7SlNPTi5zdHJpbmdpZnkoaW5zdGFuY2UpfSlgLFxuXHRcdFx0KVxuXHRcdH1cblx0XHRjb25zdCBidWNrZXRFbmNTZXNzaW9uS2V5ID0gcHViT3JFeHRQZXJtaXNzaW9uLmJ1Y2tldEVuY1Nlc3Npb25LZXlcblx0XHRpZiAoYnVja2V0RW5jU2Vzc2lvbktleSA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgU2Vzc2lvbktleU5vdEZvdW5kRXJyb3IoXG5cdFx0XHRcdGBCdWNrZXRFbmNTZXNzaW9uS2V5IGlzIG5vdCBkZWZpbmVkIGZvciBQZXJtaXNzaW9uICR7cHViT3JFeHRQZXJtaXNzaW9uLl9pZC50b1N0cmluZygpfSAoSW5zdGFuY2U6ICR7SlNPTi5zdHJpbmdpZnkoaW5zdGFuY2UpfSlgLFxuXHRcdFx0KVxuXHRcdH1cblxuXHRcdGNvbnN0IHsgZGVjcnlwdGVkQWVzS2V5IH0gPSBhd2FpdCB0aGlzLmFzeW1tZXRyaWNDcnlwdG9GYWNhZGUubG9hZEtleVBhaXJBbmREZWNyeXB0U3ltS2V5KFxuXHRcdFx0YnVja2V0UGVybWlzc2lvbi5ncm91cCxcblx0XHRcdE51bWJlcihidWNrZXRQZXJtaXNzaW9uLnB1YktleVZlcnNpb24gPz8gMCksXG5cdFx0XHRhc0NyeXB0b1Byb3Rvb2NvbFZlcnNpb24oYnVja2V0UGVybWlzc2lvbi5wcm90b2NvbFZlcnNpb24pLFxuXHRcdFx0cHViRW5jQnVja2V0S2V5LFxuXHRcdClcblxuXHRcdGNvbnN0IHNrID0gZGVjcnlwdEtleShkZWNyeXB0ZWRBZXNLZXksIGJ1Y2tldEVuY1Nlc3Npb25LZXkpXG5cblx0XHRpZiAoYnVja2V0UGVybWlzc2lvbi5fb3duZXJHcm91cCkge1xuXHRcdFx0Ly8gaXMgbm90IGRlZmluZWQgZm9yIHNvbWUgb2xkIEFjY291bnRpbmdJbmZvc1xuXHRcdFx0bGV0IGJ1Y2tldFBlcm1pc3Npb25Pd25lckdyb3VwS2V5ID0gYXdhaXQgdGhpcy5rZXlMb2FkZXJGYWNhZGUuZ2V0Q3VycmVudFN5bUdyb3VwS2V5KG5ldmVyTnVsbChidWNrZXRQZXJtaXNzaW9uLl9vd25lckdyb3VwKSkgLy8gZ2V0IGN1cnJlbnQga2V5IGZvciBlbmNyeXB0aW5nXG5cdFx0XHRhd2FpdCB0aGlzLnVwZGF0ZVdpdGhTeW1QZXJtaXNzaW9uS2V5KHR5cGVNb2RlbCwgaW5zdGFuY2UsIHB1Yk9yRXh0UGVybWlzc2lvbiwgYnVja2V0UGVybWlzc2lvbiwgYnVja2V0UGVybWlzc2lvbk93bmVyR3JvdXBLZXksIHNrKS5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhOb3RGb3VuZEVycm9yLCAoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJ3PiBjb3VsZCBub3QgZmluZCBpbnN0YW5jZSB0byB1cGRhdGUgcGVybWlzc2lvblwiKVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHR9XG5cdFx0cmV0dXJuIHNrXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgc2Vzc2lvbiBrZXkgZm9yIHRoZSBwcm92aWRlZCBzZXJ2aWNlIHJlc3BvbnNlOlxuXHQgKiAqIG51bGwsIGlmIHRoZSBpbnN0YW5jZSBpcyB1bmVuY3J5cHRlZFxuXHQgKiAqIHRoZSBkZWNyeXB0ZWQgX293bmVyUHVibGljRW5jU2Vzc2lvbktleSwgaWYgaXQgaXMgYXZhaWxhYmxlXG5cdCAqIEBwYXJhbSBpbnN0YW5jZSBUaGUgdW5lbmNyeXB0ZWQgKGNsaWVudC1zaWRlKSBvciBlbmNyeXB0ZWQgKHNlcnZlci1zaWRlKSBpbnN0YW5jZVxuXHQgKlxuXHQgKi9cblx0YXN5bmMgcmVzb2x2ZVNlcnZpY2VTZXNzaW9uS2V5KGluc3RhbmNlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxBZXMyNTZLZXkgfCBudWxsPiB7XG5cdFx0aWYgKGluc3RhbmNlLl9vd25lclB1YmxpY0VuY1Nlc3Npb25LZXkpIHtcblx0XHRcdC8vIHdlIGFzc3VtZSB0aGUgc2VydmVyIHVzZXMgdGhlIGN1cnJlbnQga2V5IHBhaXIgb2YgdGhlIHJlY2lwaWVudFxuXHRcdFx0Y29uc3Qga2V5cGFpciA9IGF3YWl0IHRoaXMua2V5TG9hZGVyRmFjYWRlLmxvYWRDdXJyZW50S2V5UGFpcihpbnN0YW5jZS5fb3duZXJHcm91cClcblx0XHRcdC8vIHdlIGRvIG5vdCBhdXRoZW50aWNhdGUgYXMgd2UgY291bGQgcmVtb3ZlIGRhdGEgdHJhbnNmZXIgdHlwZSBlbmNyeXB0aW9uIGFsdG9nZXRoZXIgYW5kIG9ubHkgcmVseSBvbiB0bHNcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdGF3YWl0IHRoaXMuYXN5bW1ldHJpY0NyeXB0b0ZhY2FkZS5kZWNyeXB0U3ltS2V5V2l0aEtleVBhaXIoXG5cdFx0XHRcdFx0a2V5cGFpci5vYmplY3QsXG5cdFx0XHRcdFx0YXNzZXJ0RW51bVZhbHVlKENyeXB0b1Byb3RvY29sVmVyc2lvbiwgaW5zdGFuY2UuX3B1YmxpY0NyeXB0b1Byb3RvY29sVmVyc2lvbiksXG5cdFx0XHRcdFx0YmFzZTY0VG9VaW50OEFycmF5KGluc3RhbmNlLl9vd25lclB1YmxpY0VuY1Nlc3Npb25LZXkpLFxuXHRcdFx0XHQpXG5cdFx0XHQpLmRlY3J5cHRlZEFlc0tleVxuXHRcdH1cblx0XHRyZXR1cm4gbnVsbFxuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYSBuZXcgX293bmVyRW5jU2Vzc2lvbktleSBhbmQgYXNzaWducyBpdCB0byB0aGUgcHJvdmlkZWQgZW50aXR5XG5cdCAqIHRoZSBlbnRpdHkgbXVzdCBhbHJlYWR5IGhhdmUgYW4gX293bmVyR3JvdXBcblx0ICogQHJldHVybnMgdGhlIGdlbmVyYXRlZCBrZXlcblx0ICovXG5cdGFzeW5jIHNldE5ld093bmVyRW5jU2Vzc2lvbktleShtb2RlbDogVHlwZU1vZGVsLCBlbnRpdHk6IFJlY29yZDxzdHJpbmcsIGFueT4sIGtleVRvRW5jcnlwdFNlc3Npb25LZXk/OiBWZXJzaW9uZWRLZXkpOiBQcm9taXNlPEFlc0tleSB8IG51bGw+IHtcblx0XHRpZiAoIWVudGl0eS5fb3duZXJHcm91cCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBubyBvd25lciBncm91cCBzZXQgICR7SlNPTi5zdHJpbmdpZnkoZW50aXR5KX1gKVxuXHRcdH1cblxuXHRcdGlmIChtb2RlbC5lbmNyeXB0ZWQpIHtcblx0XHRcdGlmIChlbnRpdHkuX293bmVyRW5jU2Vzc2lvbktleSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYG93bmVyRW5jU2Vzc2lvbktleSBhbHJlYWR5IHNldCAke0pTT04uc3RyaW5naWZ5KGVudGl0eSl9YClcblx0XHRcdH1cblxuXHRcdFx0Y29uc3Qgc2Vzc2lvbktleSA9IGFlczI1NlJhbmRvbUtleSgpXG5cdFx0XHRjb25zdCBlZmZlY3RpdmVLZXlUb0VuY3J5cHRTZXNzaW9uS2V5ID0ga2V5VG9FbmNyeXB0U2Vzc2lvbktleSA/PyAoYXdhaXQgdGhpcy5rZXlMb2FkZXJGYWNhZGUuZ2V0Q3VycmVudFN5bUdyb3VwS2V5KGVudGl0eS5fb3duZXJHcm91cCkpXG5cdFx0XHRjb25zdCBlbmNyeXB0ZWRTZXNzaW9uS2V5ID0gZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkoZWZmZWN0aXZlS2V5VG9FbmNyeXB0U2Vzc2lvbktleSwgc2Vzc2lvbktleSlcblx0XHRcdHRoaXMuc2V0T3duZXJFbmNTZXNzaW9uS2V5KGVudGl0eSBhcyBJbnN0YW5jZSwgZW5jcnlwdGVkU2Vzc2lvbktleSlcblx0XHRcdHJldHVybiBzZXNzaW9uS2V5XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgZW5jcnlwdEJ1Y2tldEtleUZvckludGVybmFsUmVjaXBpZW50KFxuXHRcdHNlbmRlclVzZXJHcm91cElkOiBJZCxcblx0XHRidWNrZXRLZXk6IEFlc0tleSxcblx0XHRyZWNpcGllbnRNYWlsQWRkcmVzczogc3RyaW5nLFxuXHRcdG5vdEZvdW5kUmVjaXBpZW50czogQXJyYXk8c3RyaW5nPixcblx0KTogUHJvbWlzZTxJbnRlcm5hbFJlY2lwaWVudEtleURhdGEgfCBTeW1FbmNJbnRlcm5hbFJlY2lwaWVudEtleURhdGEgfCBudWxsPiB7XG5cdFx0Y29uc3Qga2V5RGF0YSA9IGNyZWF0ZVB1YmxpY0tleUdldEluKHtcblx0XHRcdGlkZW50aWZpZXI6IHJlY2lwaWVudE1haWxBZGRyZXNzLFxuXHRcdFx0aWRlbnRpZmllclR5cGU6IFB1YmxpY0tleUlkZW50aWZpZXJUeXBlLk1BSUxfQUREUkVTUyxcblx0XHRcdHZlcnNpb246IG51bGwsXG5cdFx0fSlcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcHVibGljS2V5R2V0T3V0ID0gYXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IuZ2V0KFB1YmxpY0tleVNlcnZpY2UsIGtleURhdGEpXG5cdFx0XHQvLyBXZSBkbyBub3QgY3JlYXRlIGFueSBrZXkgZGF0YSBpbiBjYXNlIHRoZXJlIGlzIG9uZSBub3QgZm91bmQgcmVjaXBpZW50LCBidXQgd2Ugd2FudCB0b1xuXHRcdFx0Ly8gY29sbGVjdCBBTEwgbm90IGZvdW5kIHJlY2lwaWVudHMgd2hlbiBpdGVyYXRpbmcgYSByZWNpcGllbnQgbGlzdC5cblx0XHRcdGlmIChub3RGb3VuZFJlY2lwaWVudHMubGVuZ3RoICE9PSAwKSB7XG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHR9XG5cdFx0XHRjb25zdCBpc0V4dGVybmFsU2VuZGVyID0gdGhpcy51c2VyRmFjYWRlLmdldFVzZXIoKT8uYWNjb3VudFR5cGUgPT09IEFjY291bnRUeXBlLkVYVEVSTkFMXG5cdFx0XHQvLyB3ZSBvbmx5IGVuY3J5cHQgc3ltbWV0cmljIGFzIGV4dGVybmFsIHNlbmRlciBpZiB0aGUgcmVjaXBpZW50IHN1cHBvcnRzIHR1dGEtY3J5cHQuXG5cdFx0XHQvLyBDbGllbnRzIG5lZWQgdG8gc3VwcG9ydCBzeW1tZXRyaWMgZGVjcnlwdGlvbiBmcm9tIGV4dGVybmFsIHVzZXJzLiBXZSBjYW4gYWx3YXlzIGVuY3J5cHQgc3ltbWV0cmljbHkgd2hlbiBvbGQgY2xpZW50cyBhcmUgZGVhY3RpdmF0ZWQgdGhhdCBkb24ndCBzdXBwb3J0IHR1dGEtY3J5cHQuXG5cdFx0XHRpZiAocHVibGljS2V5R2V0T3V0LnB1Ykt5YmVyS2V5ICYmIGlzRXh0ZXJuYWxTZW5kZXIpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuY3JlYXRlU3ltRW5jSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhKHJlY2lwaWVudE1haWxBZGRyZXNzLCBidWNrZXRLZXkpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5jcmVhdGVQdWJFbmNJbnRlcm5hbFJlY2lwaWVudEtleURhdGEoYnVja2V0S2V5LCByZWNpcGllbnRNYWlsQWRkcmVzcywgcHVibGljS2V5R2V0T3V0LCBzZW5kZXJVc2VyR3JvdXBJZClcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0bm90Rm91bmRSZWNpcGllbnRzLnB1c2gocmVjaXBpZW50TWFpbEFkZHJlc3MpXG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHR9IGVsc2UgaWYgKGUgaW5zdGFuY2VvZiBUb29NYW55UmVxdWVzdHNFcnJvcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgUmVjaXBpZW50Tm90UmVzb2x2ZWRFcnJvcihcIlwiKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgY3JlYXRlUHViRW5jSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhKGJ1Y2tldEtleTogQWVzS2V5LCByZWNpcGllbnRNYWlsQWRkcmVzczogc3RyaW5nLCBwdWJsaWNLZXlHZXRPdXQ6IFB1YmxpY0tleUdldE91dCwgc2VuZGVyR3JvdXBJZDogSWQpIHtcblx0XHRjb25zdCByZWNpcGllbnRQdWJsaWNLZXlzID0gY29udmVydFRvVmVyc2lvbmVkUHVibGljS2V5cyhwdWJsaWNLZXlHZXRPdXQpXG5cdFx0Y29uc3QgcHViRW5jQnVja2V0S2V5ID0gYXdhaXQgdGhpcy5hc3ltbWV0cmljQ3J5cHRvRmFjYWRlLmFzeW1FbmNyeXB0U3ltS2V5KGJ1Y2tldEtleSwgcmVjaXBpZW50UHVibGljS2V5cywgc2VuZGVyR3JvdXBJZClcblx0XHRyZXR1cm4gY3JlYXRlSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhKHtcblx0XHRcdG1haWxBZGRyZXNzOiByZWNpcGllbnRNYWlsQWRkcmVzcyxcblx0XHRcdHB1YkVuY0J1Y2tldEtleTogcHViRW5jQnVja2V0S2V5LnB1YkVuY1N5bUtleUJ5dGVzLFxuXHRcdFx0cmVjaXBpZW50S2V5VmVyc2lvbjogcHViRW5jQnVja2V0S2V5LnJlY2lwaWVudEtleVZlcnNpb24udG9TdHJpbmcoKSxcblx0XHRcdHNlbmRlcktleVZlcnNpb246IHB1YkVuY0J1Y2tldEtleS5zZW5kZXJLZXlWZXJzaW9uICE9IG51bGwgPyBwdWJFbmNCdWNrZXRLZXkuc2VuZGVyS2V5VmVyc2lvbi50b1N0cmluZygpIDogbnVsbCxcblx0XHRcdHByb3RvY29sVmVyc2lvbjogcHViRW5jQnVja2V0S2V5LmNyeXB0b1Byb3RvY29sVmVyc2lvbixcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBjcmVhdGVTeW1FbmNJbnRlcm5hbFJlY2lwaWVudEtleURhdGEocmVjaXBpZW50TWFpbEFkZHJlc3M6IHN0cmluZywgYnVja2V0S2V5OiBBZXNLZXkpIHtcblx0XHRjb25zdCBrZXlHcm91cCA9IHRoaXMudXNlckZhY2FkZS5nZXRHcm91cElkKEdyb3VwVHlwZS5NYWlsKVxuXHRcdGNvbnN0IGV4dGVybmFsTWFpbEdyb3VwS2V5ID0gYXdhaXQgdGhpcy5rZXlMb2FkZXJGYWNhZGUuZ2V0Q3VycmVudFN5bUdyb3VwS2V5KGtleUdyb3VwKVxuXHRcdHJldHVybiBjcmVhdGVTeW1FbmNJbnRlcm5hbFJlY2lwaWVudEtleURhdGEoe1xuXHRcdFx0bWFpbEFkZHJlc3M6IHJlY2lwaWVudE1haWxBZGRyZXNzLFxuXHRcdFx0c3ltRW5jQnVja2V0S2V5OiBlbmNyeXB0S2V5KGV4dGVybmFsTWFpbEdyb3VwS2V5Lm9iamVjdCwgYnVja2V0S2V5KSxcblx0XHRcdGtleUdyb3VwLFxuXHRcdFx0c3ltS2V5VmVyc2lvbjogU3RyaW5nKGV4dGVybmFsTWFpbEdyb3VwS2V5LnZlcnNpb24pLFxuXHRcdH0pXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyB0aGUgZ2l2ZW4gcHVibGljIHBlcm1pc3Npb24gd2l0aCB0aGUgZ2l2ZW4gc3ltbWV0cmljIGtleSBmb3IgZmFzdGVyIGFjY2VzcyBpZiB0aGUgY2xpZW50IGlzIHRoZSBsZWFkZXIgYW5kIG90aGVyd2lzZSBkb2VzIG5vdGhpbmcuXG5cdCAqIEBwYXJhbSB0eXBlTW9kZWwgVGhlIHR5cGUgbW9kZWwgb2YgdGhlIGluc3RhbmNlXG5cdCAqIEBwYXJhbSBpbnN0YW5jZSBUaGUgdW5lbmNyeXB0ZWQgKGNsaWVudC1zaWRlKSBvciBlbmNyeXB0ZWQgKHNlcnZlci1zaWRlKSBpbnN0YW5jZVxuXHQgKiBAcGFyYW0gcGVybWlzc2lvbiBUaGUgcGVybWlzc2lvbi5cblx0ICogQHBhcmFtIGJ1Y2tldFBlcm1pc3Npb24gVGhlIGJ1Y2tldCBwZXJtaXNzaW9uLlxuXHQgKiBAcGFyYW0gcGVybWlzc2lvbk93bmVyR3JvdXBLZXkgVGhlIHN5bW1ldHJpYyBncm91cCBrZXkgZm9yIHRoZSBvd25lciBncm91cCBvbiB0aGUgcGVybWlzc2lvbi5cblx0ICogQHBhcmFtIHNlc3Npb25LZXkgVGhlIHN5bW1ldHJpYyBzZXNzaW9uIGtleS5cblx0ICovXG5cdHByaXZhdGUgYXN5bmMgdXBkYXRlV2l0aFN5bVBlcm1pc3Npb25LZXkoXG5cdFx0dHlwZU1vZGVsOiBUeXBlTW9kZWwsXG5cdFx0aW5zdGFuY2U6IFJlY29yZDxzdHJpbmcsIGFueT4sXG5cdFx0cGVybWlzc2lvbjogUGVybWlzc2lvbixcblx0XHRidWNrZXRQZXJtaXNzaW9uOiBCdWNrZXRQZXJtaXNzaW9uLFxuXHRcdHBlcm1pc3Npb25Pd25lckdyb3VwS2V5OiBWZXJzaW9uZWRLZXksXG5cdFx0c2Vzc2lvbktleTogQWVzS2V5LFxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoIXRoaXMuaXNMaXRlcmFsSW5zdGFuY2UoaW5zdGFuY2UpIHx8ICF0aGlzLnVzZXJGYWNhZGUuaXNMZWFkZXIoKSkge1xuXHRcdFx0Ly8gZG8gbm90IHVwZGF0ZSB0aGUgc2Vzc2lvbiBrZXkgaW4gY2FzZSBvZiBhbiB1bmVuY3J5cHRlZCAoY2xpZW50LXNpZGUpIGluc3RhbmNlXG5cdFx0XHQvLyBvciBpbiBjYXNlIHdlIGFyZSBub3QgdGhlIGxlYWRlciBjbGllbnRcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGlmICghaW5zdGFuY2UuX293bmVyRW5jU2Vzc2lvbktleSAmJiBwZXJtaXNzaW9uLl9vd25lckdyb3VwID09PSBpbnN0YW5jZS5fb3duZXJHcm91cCkge1xuXHRcdFx0cmV0dXJuIHRoaXMudXBkYXRlT3duZXJFbmNTZXNzaW9uS2V5KHR5cGVNb2RlbCwgaW5zdGFuY2UsIHBlcm1pc3Npb25Pd25lckdyb3VwS2V5LCBzZXNzaW9uS2V5KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBpbnN0YW5jZXMgc2hhcmVkIHZpYSBwZXJtaXNzaW9ucyAoZS5nLiBib2R5KVxuXHRcdFx0Y29uc3QgZW5jcnlwdGVkS2V5ID0gZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkocGVybWlzc2lvbk93bmVyR3JvdXBLZXksIHNlc3Npb25LZXkpXG5cdFx0XHRsZXQgdXBkYXRlU2VydmljZSA9IGNyZWF0ZVVwZGF0ZVBlcm1pc3Npb25LZXlEYXRhKHtcblx0XHRcdFx0b3duZXJLZXlWZXJzaW9uOiBTdHJpbmcoZW5jcnlwdGVkS2V5LmVuY3J5cHRpbmdLZXlWZXJzaW9uKSxcblx0XHRcdFx0b3duZXJFbmNTZXNzaW9uS2V5OiBlbmNyeXB0ZWRLZXkua2V5LFxuXHRcdFx0XHRwZXJtaXNzaW9uOiBwZXJtaXNzaW9uLl9pZCxcblx0XHRcdFx0YnVja2V0UGVybWlzc2lvbjogYnVja2V0UGVybWlzc2lvbi5faWQsXG5cdFx0XHR9KVxuXHRcdFx0YXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChVcGRhdGVQZXJtaXNzaW9uS2V5U2VydmljZSwgdXBkYXRlU2VydmljZSlcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogUmVzb2x2ZXMgdGhlIG93bmVyRW5jU2Vzc2lvbktleSBvZiBhIG1haWwuIFRoaXMgbWlnaHQgYmUgbmVlZGVkIGlmIGl0IHdhc24ndCB1cGRhdGVkIHlldFxuXHQgKiBieSB0aGUgT3duZXJFbmNTZXNzaW9uS2V5c1VwZGF0ZVF1ZXVlIGJ1dCB0aGUgZmlsZSBpcyBhbHJlYWR5IGRvd25sb2FkZWQuXG5cdCAqIEBwYXJhbSBtYWluSW5zdGFuY2UgdGhlIGluc3RhbmNlIHRoYXQgaGFzIHRoZSBidWNrZXRLZXlcblx0ICogQHBhcmFtIGNoaWxkSW5zdGFuY2VzIHRoZSBmaWxlcyB0aGF0IGJlbG9uZyB0byB0aGUgbWFpbkluc3RhbmNlXG5cdCAqL1xuXHRhc3luYyBlbmZvcmNlU2Vzc2lvbktleVVwZGF0ZUlmTmVlZGVkKG1haW5JbnN0YW5jZTogUmVjb3JkPHN0cmluZywgYW55PiwgY2hpbGRJbnN0YW5jZXM6IHJlYWRvbmx5IEZpbGVbXSk6IFByb21pc2U8RmlsZVtdPiB7XG5cdFx0aWYgKCFjaGlsZEluc3RhbmNlcy5zb21lKChmKSA9PiBmLl9vd25lckVuY1Nlc3Npb25LZXkgPT0gbnVsbCkpIHtcblx0XHRcdHJldHVybiBjaGlsZEluc3RhbmNlcy5zbGljZSgpXG5cdFx0fVxuXHRcdGNvbnN0IHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKG1haW5JbnN0YW5jZS5fdHlwZSlcblx0XHRjb25zdCBvdXRPZlN5bmNJbnN0YW5jZXMgPSBjaGlsZEluc3RhbmNlcy5maWx0ZXIoKGYpID0+IGYuX293bmVyRW5jU2Vzc2lvbktleSA9PSBudWxsKVxuXHRcdGlmIChtYWluSW5zdGFuY2UuYnVja2V0S2V5KSB7XG5cdFx0XHQvLyBpbnZva2UgdXBkYXRlU2Vzc2lvbktleXMgc2VydmljZSBpbiBjYXNlIGEgYnVja2V0IGtleSBpcyBzdGlsbCBhdmFpbGFibGVcblx0XHRcdGNvbnN0IGJ1Y2tldEtleSA9IGF3YWl0IHRoaXMuY29udmVydEJ1Y2tldEtleVRvSW5zdGFuY2VJZk5lY2Vzc2FyeShtYWluSW5zdGFuY2UuYnVja2V0S2V5KVxuXHRcdFx0Y29uc3QgcmVzb2x2ZWRTZXNzaW9uS2V5cyA9IGF3YWl0IHRoaXMucmVzb2x2ZVdpdGhCdWNrZXRLZXkoYnVja2V0S2V5LCBtYWluSW5zdGFuY2UsIHR5cGVNb2RlbClcblx0XHRcdGF3YWl0IHRoaXMub3duZXJFbmNTZXNzaW9uS2V5c1VwZGF0ZVF1ZXVlLnBvc3RVcGRhdGVTZXNzaW9uS2V5c1NlcnZpY2UocmVzb2x2ZWRTZXNzaW9uS2V5cy5pbnN0YW5jZVNlc3Npb25LZXlzKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLndhcm4oXCJmaWxlcyBhcmUgb3V0IG9mIHN5bmMgcmVmcmVzaGluZ1wiLCBvdXRPZlN5bmNJbnN0YW5jZXMubWFwKChmKSA9PiBmLl9pZCkuam9pbihcIiwgXCIpKVxuXHRcdH1cblx0XHRmb3IgKGNvbnN0IGNoaWxkSW5zdGFuY2Ugb2Ygb3V0T2ZTeW5jSW5zdGFuY2VzKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmNhY2hlPy5kZWxldGVGcm9tQ2FjaGVJZkV4aXN0cyhGaWxlVHlwZVJlZiwgZ2V0TGlzdElkKGNoaWxkSW5zdGFuY2UpLCBnZXRFbGVtZW50SWQoY2hpbGRJbnN0YW5jZSkpXG5cdFx0fVxuXHRcdC8vIHdlIGhhdmUgYSBjYWNoaW5nIGVudGl0eSBjbGllbnQsIHNvIHRoaXMgcmUtaW5zZXJ0cyB0aGUgZGVsZXRlZCBpbnN0YW5jZXNcblx0XHRyZXR1cm4gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZE11bHRpcGxlKFxuXHRcdFx0RmlsZVR5cGVSZWYsXG5cdFx0XHRnZXRMaXN0SWQoY2hpbGRJbnN0YW5jZXNbMF0pLFxuXHRcdFx0Y2hpbGRJbnN0YW5jZXMubWFwKChjaGlsZEluc3RhbmNlKSA9PiBnZXRFbGVtZW50SWQoY2hpbGRJbnN0YW5jZSkpLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgdXBkYXRlT3duZXJFbmNTZXNzaW9uS2V5KHR5cGVNb2RlbDogVHlwZU1vZGVsLCBpbnN0YW5jZTogUmVjb3JkPHN0cmluZywgYW55Piwgb3duZXJHcm91cEtleTogVmVyc2lvbmVkS2V5LCBzZXNzaW9uS2V5OiBBZXNLZXkpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLnNldE93bmVyRW5jU2Vzc2lvbktleVVubWFwcGVkKGluc3RhbmNlIGFzIFVubWFwcGVkT3duZXJHcm91cEluc3RhbmNlLCBlbmNyeXB0S2V5V2l0aFZlcnNpb25lZEtleShvd25lckdyb3VwS2V5LCBzZXNzaW9uS2V5KSlcblx0XHQvLyB3ZSBoYXZlIHRvIGNhbGwgdGhlIHJlc3QgY2xpZW50IGRpcmVjdGx5IGJlY2F1c2UgaW5zdGFuY2UgaXMgc3RpbGwgdGhlIGVuY3J5cHRlZCBzZXJ2ZXItc2lkZSB2ZXJzaW9uXG5cdFx0Y29uc3QgcGF0aCA9IHR5cGVSZWZUb1BhdGgobmV3IFR5cGVSZWYodHlwZU1vZGVsLmFwcCwgdHlwZU1vZGVsLm5hbWUpKSArIFwiL1wiICsgKGluc3RhbmNlLl9pZCBpbnN0YW5jZW9mIEFycmF5ID8gaW5zdGFuY2UuX2lkLmpvaW4oXCIvXCIpIDogaW5zdGFuY2UuX2lkKVxuXHRcdGNvbnN0IGhlYWRlcnMgPSB0aGlzLnVzZXJGYWNhZGUuY3JlYXRlQXV0aEhlYWRlcnMoKVxuXHRcdGhlYWRlcnMudiA9IHR5cGVNb2RlbC52ZXJzaW9uXG5cdFx0cmV0dXJuIHRoaXMucmVzdENsaWVudFxuXHRcdFx0LnJlcXVlc3QocGF0aCwgSHR0cE1ldGhvZC5QVVQsIHtcblx0XHRcdFx0aGVhZGVycyxcblx0XHRcdFx0Ym9keTogSlNPTi5zdHJpbmdpZnkoaW5zdGFuY2UpLFxuXHRcdFx0XHRxdWVyeVBhcmFtczogeyB1cGRhdGVPd25lckVuY1Nlc3Npb25LZXk6IFwidHJ1ZVwiIH0sXG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKFBheWxvYWRUb29MYXJnZUVycm9yLCAoZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiQ291bGQgbm90IHVwZGF0ZSBvd25lciBlbmMgc2Vzc2lvbiBrZXkgLSBQYXlsb2FkVG9vTGFyZ2VFcnJvclwiLCBlKVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0fVxuXG5cdHByaXZhdGUgZ2V0RWxlbWVudElkRnJvbUluc3RhbmNlKGluc3RhbmNlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogSWQge1xuXHRcdGlmICh0eXBlb2YgaW5zdGFuY2UuX2lkID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRyZXR1cm4gaW5zdGFuY2UuX2lkXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IGlkVHVwbGUgPSBpbnN0YW5jZS5faWQgYXMgSWRUdXBsZVxuXHRcdFx0cmV0dXJuIGVsZW1lbnRJZFBhcnQoaWRUdXBsZSlcblx0XHR9XG5cdH1cbn1cblxuaWYgKCEoXCJ0b0pTT05cIiBpbiBFcnJvci5wcm90b3R5cGUpKSB7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFcnJvci5wcm90b3R5cGUgYXMgYW55LCBcInRvSlNPTlwiLCB7XG5cdFx0dmFsdWU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdGNvbnN0IGFsdDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9XG5cdFx0XHRmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGhpcykpIHtcblx0XHRcdFx0YWx0W2tleV0gPSB0aGlzW2tleV1cblx0XHRcdH1cblx0XHRcdHJldHVybiBhbHRcblx0XHR9LFxuXHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcblx0XHR3cml0YWJsZTogdHJ1ZSxcblx0fSlcbn1cbiIsImltcG9ydCB7IHJlc29sdmVUeXBlUmVmZXJlbmNlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnRpdHlGdW5jdGlvbnNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvclwiXG5pbXBvcnQgdHlwZSB7IEJhc2U2NCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHtcblx0YXNzZXJ0Tm90TnVsbCxcblx0YmFzZTY0VG9CYXNlNjRVcmwsXG5cdGJhc2U2NFRvVWludDhBcnJheSxcblx0ZG93bmNhc3QsXG5cdHByb21pc2VNYXAsXG5cdHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXksXG5cdFR5cGVSZWYsXG5cdHVpbnQ4QXJyYXlUb0Jhc2U2NCxcblx0dXRmOFVpbnQ4QXJyYXlUb1N0cmluZyxcbn0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBBc3NvY2lhdGlvblR5cGUsIENhcmRpbmFsaXR5LCBUeXBlLCBWYWx1ZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0VudGl0eUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBjb21wcmVzcywgdW5jb21wcmVzcyB9IGZyb20gXCIuLi9Db21wcmVzc2lvblwiXG5pbXBvcnQgdHlwZSB7IE1vZGVsVmFsdWUsIFR5cGVNb2RlbCB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5VHlwZXNcIlxuaW1wb3J0IHsgYXNzZXJ0V29ya2VyT3JOb2RlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgYWVzRGVjcnlwdCwgYWVzRW5jcnlwdCwgQWVzS2V5LCBFTkFCTEVfTUFDLCBJVl9CWVRFX0xFTkdUSCwgcmFuZG9tIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS1jcnlwdG9cIlxuaW1wb3J0IHsgQ3J5cHRvRXJyb3IgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLWNyeXB0by9lcnJvci5qc1wiXG5cbmFzc2VydFdvcmtlck9yTm9kZSgpXG5cbmV4cG9ydCBjbGFzcyBJbnN0YW5jZU1hcHBlciB7XG5cdC8qKlxuXHQgKiBEZWNyeXB0cyBhbiBvYmplY3QgbGl0ZXJhbCBhcyByZWNlaXZlZCBmcm9tIHRoZSBEQiBhbmQgbWFwcyBpdCB0byBhbiBlbnRpdHkgY2xhc3MgKGUuZy4gTWFpbClcblx0ICogQHBhcmFtIG1vZGVsIFRoZSBUeXBlTW9kZWwgb2YgdGhlIGluc3RhbmNlXG5cdCAqIEBwYXJhbSBpbnN0YW5jZSBUaGUgb2JqZWN0IGxpdGVyYWwgYXMgcmVjZWl2ZWQgZnJvbSB0aGUgREJcblx0ICogQHBhcmFtIHNrIFRoZSBzZXNzaW9uIGtleSwgbXVzdCBiZSBwcm92aWRlZCBmb3IgZW5jcnlwdGVkIGluc3RhbmNlc1xuXHQgKiBAcmV0dXJucyBUaGUgZGVjcnlwdGVkIGFuZCBtYXBwZWQgaW5zdGFuY2Vcblx0ICovXG5cdGRlY3J5cHRBbmRNYXBUb0luc3RhbmNlPFQ+KG1vZGVsOiBUeXBlTW9kZWwsIGluc3RhbmNlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCBzazogQWVzS2V5IHwgbnVsbCk6IFByb21pc2U8VD4ge1xuXHRcdGxldCBkZWNyeXB0ZWQ6IGFueSA9IHtcblx0XHRcdF90eXBlOiBuZXcgVHlwZVJlZihtb2RlbC5hcHAsIG1vZGVsLm5hbWUpLFxuXHRcdH1cblxuXHRcdGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhtb2RlbC52YWx1ZXMpKSB7XG5cdFx0XHRsZXQgdmFsdWVUeXBlID0gbW9kZWwudmFsdWVzW2tleV1cblx0XHRcdGxldCB2YWx1ZSA9IGluc3RhbmNlW2tleV1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZGVjcnlwdGVkW2tleV0gPSBkZWNyeXB0VmFsdWUoa2V5LCB2YWx1ZVR5cGUsIHZhbHVlLCBzaylcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKGRlY3J5cHRlZC5fZXJyb3JzID09IG51bGwpIHtcblx0XHRcdFx0XHRkZWNyeXB0ZWQuX2Vycm9ycyA9IHt9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRkZWNyeXB0ZWQuX2Vycm9yc1trZXldID0gSlNPTi5zdHJpbmdpZnkoZSlcblx0XHRcdFx0Y29uc29sZS5sb2coXCJlcnJvciB3aGVuIGRlY3J5cHRpbmcgdmFsdWUgb24gdHlwZTpcIiwgYFske21vZGVsLmFwcH0sJHttb2RlbC5uYW1lfV1gLCBcImtleTpcIiwga2V5LCBlKVxuXHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0aWYgKHZhbHVlVHlwZS5lbmNyeXB0ZWQpIHtcblx0XHRcdFx0XHRpZiAodmFsdWVUeXBlLmZpbmFsKSB7XG5cdFx0XHRcdFx0XHQvLyB3ZSBoYXZlIHRvIHN0b3JlIHRoZSBlbmNyeXB0ZWQgdmFsdWUgdG8gYmUgYWJsZSB0byByZXN0b3JlIGl0IHdoZW4gdXBkYXRpbmcgdGhlIGluc3RhbmNlLiB0aGlzIGlzIG5vdCBuZWVkZWQgZm9yIGRhdGEgdHJhbnNmZXIgdHlwZXMsIGJ1dCBpdCBkb2VzIG5vdCBodXJ0XG5cdFx0XHRcdFx0XHRkZWNyeXB0ZWRbXCJfZmluYWxFbmNyeXB0ZWRfXCIgKyBrZXldID0gdmFsdWVcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHZhbHVlID09PSBcIlwiKSB7XG5cdFx0XHRcdFx0XHQvLyB3ZSBoYXZlIHRvIHN0b3JlIHRoZSBkZWZhdWx0IHZhbHVlIHRvIG1ha2Ugc3VyZSB0aGF0IHVwZGF0ZXMgZG8gbm90IGNhdXNlIG1vcmUgc3RvcmFnZSB1c2Vcblx0XHRcdFx0XHRcdGRlY3J5cHRlZFtcIl9kZWZhdWx0RW5jcnlwdGVkX1wiICsga2V5XSA9IGRlY3J5cHRlZFtrZXldXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHByb21pc2VNYXAoT2JqZWN0LmtleXMobW9kZWwuYXNzb2NpYXRpb25zKSwgYXN5bmMgKGFzc29jaWF0aW9uTmFtZSkgPT4ge1xuXHRcdFx0aWYgKG1vZGVsLmFzc29jaWF0aW9uc1thc3NvY2lhdGlvbk5hbWVdLnR5cGUgPT09IEFzc29jaWF0aW9uVHlwZS5BZ2dyZWdhdGlvbikge1xuXHRcdFx0XHRjb25zdCBkZXBlbmRlbmN5ID0gbW9kZWwuYXNzb2NpYXRpb25zW2Fzc29jaWF0aW9uTmFtZV0uZGVwZW5kZW5jeVxuXHRcdFx0XHRjb25zdCBhZ2dyZWdhdGVUeXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZShuZXcgVHlwZVJlZihkZXBlbmRlbmN5IHx8IG1vZGVsLmFwcCwgbW9kZWwuYXNzb2NpYXRpb25zW2Fzc29jaWF0aW9uTmFtZV0ucmVmVHlwZSkpXG5cdFx0XHRcdGxldCBhZ2dyZWdhdGlvbiA9IG1vZGVsLmFzc29jaWF0aW9uc1thc3NvY2lhdGlvbk5hbWVdXG5cblx0XHRcdFx0aWYgKGFnZ3JlZ2F0aW9uLmNhcmRpbmFsaXR5ID09PSBDYXJkaW5hbGl0eS5aZXJvT3JPbmUgJiYgaW5zdGFuY2VbYXNzb2NpYXRpb25OYW1lXSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0ZGVjcnlwdGVkW2Fzc29jaWF0aW9uTmFtZV0gPSBudWxsXG5cdFx0XHRcdH0gZWxzZSBpZiAoaW5zdGFuY2VbYXNzb2NpYXRpb25OYW1lXSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoYFVuZGVmaW5lZCBhZ2dyZWdhdGlvbiAke21vZGVsLm5hbWV9OiR7YXNzb2NpYXRpb25OYW1lfWApXG5cdFx0XHRcdH0gZWxzZSBpZiAoYWdncmVnYXRpb24uY2FyZGluYWxpdHkgPT09IENhcmRpbmFsaXR5LkFueSkge1xuXHRcdFx0XHRcdHJldHVybiBwcm9taXNlTWFwKGluc3RhbmNlW2Fzc29jaWF0aW9uTmFtZV0sIChhZ2dyZWdhdGUpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmRlY3J5cHRBbmRNYXBUb0luc3RhbmNlKGFnZ3JlZ2F0ZVR5cGVNb2RlbCwgZG93bmNhc3Q8UmVjb3JkPHN0cmluZywgYW55Pj4oYWdncmVnYXRlKSwgc2spXG5cdFx0XHRcdFx0fSkudGhlbigoZGVjcnlwdGVkQWdncmVnYXRlcykgPT4ge1xuXHRcdFx0XHRcdFx0ZGVjcnlwdGVkW2Fzc29jaWF0aW9uTmFtZV0gPSBkZWNyeXB0ZWRBZ2dyZWdhdGVzXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kZWNyeXB0QW5kTWFwVG9JbnN0YW5jZShhZ2dyZWdhdGVUeXBlTW9kZWwsIGluc3RhbmNlW2Fzc29jaWF0aW9uTmFtZV0sIHNrKS50aGVuKChkZWNyeXB0ZWRBZ2dyZWdhdGUpID0+IHtcblx0XHRcdFx0XHRcdGRlY3J5cHRlZFthc3NvY2lhdGlvbk5hbWVdID0gZGVjcnlwdGVkQWdncmVnYXRlXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVjcnlwdGVkW2Fzc29jaWF0aW9uTmFtZV0gPSBpbnN0YW5jZVthc3NvY2lhdGlvbk5hbWVdXG5cdFx0XHR9XG5cdFx0fSkudGhlbigoKSA9PiB7XG5cdFx0XHRyZXR1cm4gZGVjcnlwdGVkXG5cdFx0fSlcblx0fVxuXG5cdGVuY3J5cHRBbmRNYXBUb0xpdGVyYWw8VD4obW9kZWw6IFR5cGVNb2RlbCwgaW5zdGFuY2U6IFQsIHNrOiBBZXNLZXkgfCBudWxsKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ge1xuXHRcdGlmIChtb2RlbC5lbmNyeXB0ZWQgJiYgc2sgPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoYEVuY3J5cHRpbmcgJHttb2RlbC5hcHB9LyR7bW9kZWwubmFtZX0gcmVxdWlyZXMgYSBzZXNzaW9uIGtleSFgKVxuXHRcdH1cblx0XHRsZXQgZW5jcnlwdGVkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9XG5cdFx0bGV0IGkgPSBpbnN0YW5jZSBhcyBhbnlcblxuXHRcdGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhtb2RlbC52YWx1ZXMpKSB7XG5cdFx0XHRsZXQgdmFsdWVUeXBlID0gbW9kZWwudmFsdWVzW2tleV1cblx0XHRcdGxldCB2YWx1ZSA9IGlba2V5XVxuXG5cdFx0XHRsZXQgZW5jcnlwdGVkVmFsdWVcblx0XHRcdC8vIHJlc3RvcmUgdGhlIG9yaWdpbmFsIGVuY3J5cHRlZCB2YWx1ZSBpZiBpdCBleGlzdHMuIGl0IGRvZXMgbm90IGV4aXN0IGlmIHRoaXMgaXMgYSBkYXRhIHRyYW5zZmVyIHR5cGUgb3IgYSBuZXdseSBjcmVhdGVkIGVudGl0eS4gY2hlY2sgYWdhaW5zdCBudWxsIGV4cGxpY2l0ZWx5IGJlY2F1c2UgXCJcIiBpcyBhbGxvd2VkXG5cdFx0XHRpZiAodmFsdWVUeXBlLmVuY3J5cHRlZCAmJiB2YWx1ZVR5cGUuZmluYWwgJiYgaVtcIl9maW5hbEVuY3J5cHRlZF9cIiArIGtleV0gIT0gbnVsbCkge1xuXHRcdFx0XHRlbmNyeXB0ZWRWYWx1ZSA9IGlbXCJfZmluYWxFbmNyeXB0ZWRfXCIgKyBrZXldXG5cdFx0XHR9IGVsc2UgaWYgKHZhbHVlVHlwZS5lbmNyeXB0ZWQgJiYgKGlbXCJfZmluYWxJdnNcIl0/LltrZXldIGFzIFVpbnQ4QXJyYXkgfCBudWxsKT8ubGVuZ3RoID09PSAwICYmIGlzRGVmYXVsdFZhbHVlKHZhbHVlVHlwZS50eXBlLCB2YWx1ZSkpIHtcblx0XHRcdFx0Ly8gcmVzdG9yZSB0aGUgZGVmYXVsdCBlbmNyeXB0ZWQgdmFsdWUgYmVjYXVzZSBpdCBoYXMgbm90IGNoYW5nZWRcblx0XHRcdFx0Ly8gbm90ZTogdGhpcyBicnVuY2ggbXVzdCBiZSBjaGVja2VkICpiZWZvcmUqIHRoZSBvbmUgd2hpY2ggcmV1c2VzIElWcyBhcyB0aGlzIG9uZSBjaGVja3Ncblx0XHRcdFx0Ly8gdGhlIGxlbmd0aC5cblx0XHRcdFx0ZW5jcnlwdGVkVmFsdWUgPSBcIlwiXG5cdFx0XHR9IGVsc2UgaWYgKHZhbHVlVHlwZS5lbmNyeXB0ZWQgJiYgdmFsdWVUeXBlLmZpbmFsICYmIGlbXCJfZmluYWxJdnNcIl0/LltrZXldICE9IG51bGwpIHtcblx0XHRcdFx0Y29uc3QgZmluYWxJdiA9IGlbXCJfZmluYWxJdnNcIl1ba2V5XVxuXHRcdFx0XHRlbmNyeXB0ZWRWYWx1ZSA9IGVuY3J5cHRWYWx1ZShrZXksIHZhbHVlVHlwZSwgdmFsdWUsIHNrLCBmaW5hbEl2KVxuXHRcdFx0fSBlbHNlIGlmICh2YWx1ZVR5cGUuZW5jcnlwdGVkICYmIGlbXCJfZGVmYXVsdEVuY3J5cHRlZF9cIiArIGtleV0gPT09IHZhbHVlKSB7XG5cdFx0XHRcdC8vIHJlc3RvcmUgdGhlIGRlZmF1bHQgZW5jcnlwdGVkIHZhbHVlIGJlY2F1c2UgaXQgaGFzIG5vdCBjaGFuZ2VkXG5cdFx0XHRcdGVuY3J5cHRlZFZhbHVlID0gXCJcIlxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZW5jcnlwdGVkVmFsdWUgPSBlbmNyeXB0VmFsdWUoa2V5LCB2YWx1ZVR5cGUsIHZhbHVlLCBzaylcblx0XHRcdH1cblx0XHRcdGVuY3J5cHRlZFtrZXldID0gZW5jcnlwdGVkVmFsdWVcblx0XHR9XG5cblx0XHRpZiAobW9kZWwudHlwZSA9PT0gVHlwZS5BZ2dyZWdhdGVkICYmICFlbmNyeXB0ZWQuX2lkKSB7XG5cdFx0XHRlbmNyeXB0ZWQuX2lkID0gYmFzZTY0VG9CYXNlNjRVcmwodWludDhBcnJheVRvQmFzZTY0KHJhbmRvbS5nZW5lcmF0ZVJhbmRvbURhdGEoNCkpKVxuXHRcdH1cblxuXHRcdHJldHVybiBwcm9taXNlTWFwKE9iamVjdC5rZXlzKG1vZGVsLmFzc29jaWF0aW9ucyksIGFzeW5jIChhc3NvY2lhdGlvbk5hbWUpID0+IHtcblx0XHRcdGlmIChtb2RlbC5hc3NvY2lhdGlvbnNbYXNzb2NpYXRpb25OYW1lXS50eXBlID09PSBBc3NvY2lhdGlvblR5cGUuQWdncmVnYXRpb24pIHtcblx0XHRcdFx0Y29uc3QgZGVwZW5kZW5jeSA9IG1vZGVsLmFzc29jaWF0aW9uc1thc3NvY2lhdGlvbk5hbWVdLmRlcGVuZGVuY3lcblx0XHRcdFx0Y29uc3QgYWdncmVnYXRlVHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UobmV3IFR5cGVSZWYoZGVwZW5kZW5jeSB8fCBtb2RlbC5hcHAsIG1vZGVsLmFzc29jaWF0aW9uc1thc3NvY2lhdGlvbk5hbWVdLnJlZlR5cGUpKVxuXHRcdFx0XHRsZXQgYWdncmVnYXRpb24gPSBtb2RlbC5hc3NvY2lhdGlvbnNbYXNzb2NpYXRpb25OYW1lXVxuXHRcdFx0XHRpZiAoYWdncmVnYXRpb24uY2FyZGluYWxpdHkgPT09IENhcmRpbmFsaXR5Llplcm9Pck9uZSAmJiBpW2Fzc29jaWF0aW9uTmFtZV0gPT0gbnVsbCkge1xuXHRcdFx0XHRcdGVuY3J5cHRlZFthc3NvY2lhdGlvbk5hbWVdID0gbnVsbFxuXHRcdFx0XHR9IGVsc2UgaWYgKGlbYXNzb2NpYXRpb25OYW1lXSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoYFVuZGVmaW5lZCBhdHRyaWJ1dGUgJHttb2RlbC5uYW1lfToke2Fzc29jaWF0aW9uTmFtZX1gKVxuXHRcdFx0XHR9IGVsc2UgaWYgKGFnZ3JlZ2F0aW9uLmNhcmRpbmFsaXR5ID09PSBDYXJkaW5hbGl0eS5BbnkpIHtcblx0XHRcdFx0XHRyZXR1cm4gcHJvbWlzZU1hcChpW2Fzc29jaWF0aW9uTmFtZV0sIChhZ2dyZWdhdGUpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmVuY3J5cHRBbmRNYXBUb0xpdGVyYWwoYWdncmVnYXRlVHlwZU1vZGVsLCBhZ2dyZWdhdGUsIHNrKVxuXHRcdFx0XHRcdH0pLnRoZW4oKGVuY3J5cHRlZEFnZ3JlZ2F0ZXMpID0+IHtcblx0XHRcdFx0XHRcdGVuY3J5cHRlZFthc3NvY2lhdGlvbk5hbWVdID0gZW5jcnlwdGVkQWdncmVnYXRlc1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZW5jcnlwdEFuZE1hcFRvTGl0ZXJhbChhZ2dyZWdhdGVUeXBlTW9kZWwsIGlbYXNzb2NpYXRpb25OYW1lXSwgc2spLnRoZW4oKGVuY3J5cHRlZEFnZ3JlZ2F0ZSkgPT4ge1xuXHRcdFx0XHRcdFx0ZW5jcnlwdGVkW2Fzc29jaWF0aW9uTmFtZV0gPSBlbmNyeXB0ZWRBZ2dyZWdhdGVcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRlbmNyeXB0ZWRbYXNzb2NpYXRpb25OYW1lXSA9IGlbYXNzb2NpYXRpb25OYW1lXVxuXHRcdFx0fVxuXHRcdH0pLnRoZW4oKCkgPT4ge1xuXHRcdFx0cmV0dXJuIGVuY3J5cHRlZFxuXHRcdH0pXG5cdH1cbn1cblxuLy8gRXhwb3J0ZWQgZm9yIHRlc3RpbmdcbmV4cG9ydCBmdW5jdGlvbiBlbmNyeXB0VmFsdWUoXG5cdHZhbHVlTmFtZTogc3RyaW5nLFxuXHR2YWx1ZVR5cGU6IE1vZGVsVmFsdWUsXG5cdHZhbHVlOiBhbnksXG5cdHNrOiBBZXNLZXkgfCBudWxsLFxuXHRpdjogVWludDhBcnJheSA9IHJhbmRvbS5nZW5lcmF0ZVJhbmRvbURhdGEoSVZfQllURV9MRU5HVEgpLFxuKTogc3RyaW5nIHwgQmFzZTY0IHwgbnVsbCB7XG5cdGlmICh2YWx1ZU5hbWUgPT09IFwiX2lkXCIgfHwgdmFsdWVOYW1lID09PSBcIl9wZXJtaXNzaW9uc1wiKSB7XG5cdFx0cmV0dXJuIHZhbHVlXG5cdH0gZWxzZSBpZiAodmFsdWUgPT0gbnVsbCkge1xuXHRcdGlmICh2YWx1ZVR5cGUuY2FyZGluYWxpdHkgPT09IENhcmRpbmFsaXR5Llplcm9Pck9uZSkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoYFZhbHVlICR7dmFsdWVOYW1lfSB3aXRoIGNhcmRpbmFsaXR5IE9ORSBjYW4gbm90IGJlIG51bGxgKVxuXHRcdH1cblx0fSBlbHNlIGlmICh2YWx1ZVR5cGUuZW5jcnlwdGVkKSB7XG5cdFx0bGV0IGJ5dGVzID0gdmFsdWVcblxuXHRcdGlmICh2YWx1ZVR5cGUudHlwZSAhPT0gVmFsdWVUeXBlLkJ5dGVzKSB7XG5cdFx0XHRjb25zdCBkYlR5cGUgPSBhc3NlcnROb3ROdWxsKGNvbnZlcnRKc1RvRGJUeXBlKHZhbHVlVHlwZS50eXBlLCB2YWx1ZSkpXG5cdFx0XHRieXRlcyA9IHR5cGVvZiBkYlR5cGUgPT09IFwic3RyaW5nXCIgPyBzdHJpbmdUb1V0ZjhVaW50OEFycmF5KGRiVHlwZSkgOiBkYlR5cGVcblx0XHR9XG5cblx0XHRyZXR1cm4gdWludDhBcnJheVRvQmFzZTY0KGFlc0VuY3J5cHQoYXNzZXJ0Tm90TnVsbChzayksIGJ5dGVzLCBpdiwgdHJ1ZSwgRU5BQkxFX01BQykpXG5cdH0gZWxzZSB7XG5cdFx0Y29uc3QgZGJUeXBlID0gY29udmVydEpzVG9EYlR5cGUodmFsdWVUeXBlLnR5cGUsIHZhbHVlKVxuXG5cdFx0aWYgKHR5cGVvZiBkYlR5cGUgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdHJldHVybiBkYlR5cGVcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHVpbnQ4QXJyYXlUb0Jhc2U2NChkYlR5cGUpXG5cdFx0fVxuXHR9XG59XG5cbi8vIEV4cG9ydGVkIGZvciB0ZXN0aW5nXG5leHBvcnQgZnVuY3Rpb24gZGVjcnlwdFZhbHVlKHZhbHVlTmFtZTogc3RyaW5nLCB2YWx1ZVR5cGU6IE1vZGVsVmFsdWUsIHZhbHVlOiAoQmFzZTY0IHwgbnVsbCkgfCBzdHJpbmcsIHNrOiBBZXNLZXkgfCBudWxsKTogYW55IHtcblx0aWYgKHZhbHVlID09IG51bGwpIHtcblx0XHRpZiAodmFsdWVUeXBlLmNhcmRpbmFsaXR5ID09PSBDYXJkaW5hbGl0eS5aZXJvT3JPbmUpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKGBWYWx1ZSAke3ZhbHVlTmFtZX0gd2l0aCBjYXJkaW5hbGl0eSBPTkUgY2FuIG5vdCBiZSBudWxsYClcblx0XHR9XG5cdH0gZWxzZSBpZiAodmFsdWVUeXBlLmNhcmRpbmFsaXR5ID09PSBDYXJkaW5hbGl0eS5PbmUgJiYgdmFsdWUgPT09IFwiXCIpIHtcblx0XHRyZXR1cm4gdmFsdWVUb0RlZmF1bHQodmFsdWVUeXBlLnR5cGUpIC8vIE1pZ3JhdGlvbiBmb3IgdmFsdWVzIGFkZGVkIGFmdGVyIHRoZSBUeXBlIGhhcyBiZWVuIGRlZmluZWQgaW5pdGlhbGx5XG5cdH0gZWxzZSBpZiAodmFsdWVUeXBlLmVuY3J5cHRlZCkge1xuXHRcdGlmIChzayA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgQ3J5cHRvRXJyb3IoXCJzZXNzaW9uIGtleSBpcyBudWxsLCBidXQgdmFsdWUgaXMgZW5jcnlwdGVkLiB2YWx1ZU5hbWU6IFwiICsgdmFsdWVOYW1lICsgXCIgdmFsdWVUeXBlOiBcIiArIHZhbHVlVHlwZSlcblx0XHR9XG5cdFx0bGV0IGRlY3J5cHRlZEJ5dGVzID0gYWVzRGVjcnlwdChzaywgYmFzZTY0VG9VaW50OEFycmF5KHZhbHVlKSlcblxuXHRcdGlmICh2YWx1ZVR5cGUudHlwZSA9PT0gVmFsdWVUeXBlLkJ5dGVzKSB7XG5cdFx0XHRyZXR1cm4gZGVjcnlwdGVkQnl0ZXNcblx0XHR9IGVsc2UgaWYgKHZhbHVlVHlwZS50eXBlID09PSBWYWx1ZVR5cGUuQ29tcHJlc3NlZFN0cmluZykge1xuXHRcdFx0cmV0dXJuIGRlY29tcHJlc3NTdHJpbmcoZGVjcnlwdGVkQnl0ZXMpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBjb252ZXJ0RGJUb0pzVHlwZSh2YWx1ZVR5cGUudHlwZSwgdXRmOFVpbnQ4QXJyYXlUb1N0cmluZyhkZWNyeXB0ZWRCeXRlcykpXG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBjb252ZXJ0RGJUb0pzVHlwZSh2YWx1ZVR5cGUudHlwZSwgdmFsdWUpXG5cdH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGJ5dGVzIHdoZW4gdGhlIHR5cGUgPT09IEJ5dGVzIG9yIHR5cGUgPT09IENvbXByZXNzZWRTdHJpbmcsIG90aGVyd2lzZSByZXR1cm5zIGEgc3RyaW5nXG4gKiBAcGFyYW0gdHlwZVxuICogQHBhcmFtIHZhbHVlXG4gKiBAcmV0dXJucyB7c3RyaW5nfHN0cmluZ3xOb2RlSlMuR2xvYmFsLlVpbnQ4QXJyYXl8Kn1cbiAqL1xuZnVuY3Rpb24gY29udmVydEpzVG9EYlR5cGUodHlwZTogVmFsdWVzPHR5cGVvZiBWYWx1ZVR5cGU+LCB2YWx1ZTogYW55KTogVWludDhBcnJheSB8IHN0cmluZyB7XG5cdGlmICh0eXBlID09PSBWYWx1ZVR5cGUuQnl0ZXMgJiYgdmFsdWUgIT0gbnVsbCkge1xuXHRcdHJldHVybiB2YWx1ZVxuXHR9IGVsc2UgaWYgKHR5cGUgPT09IFZhbHVlVHlwZS5Cb29sZWFuKSB7XG5cdFx0cmV0dXJuIHZhbHVlID8gXCIxXCIgOiBcIjBcIlxuXHR9IGVsc2UgaWYgKHR5cGUgPT09IFZhbHVlVHlwZS5EYXRlKSB7XG5cdFx0cmV0dXJuIHZhbHVlLmdldFRpbWUoKS50b1N0cmluZygpXG5cdH0gZWxzZSBpZiAodHlwZSA9PT0gVmFsdWVUeXBlLkNvbXByZXNzZWRTdHJpbmcpIHtcblx0XHRyZXR1cm4gY29tcHJlc3NTdHJpbmcodmFsdWUpXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIHZhbHVlXG5cdH1cbn1cblxuZnVuY3Rpb24gY29udmVydERiVG9Kc1R5cGUodHlwZTogVmFsdWVzPHR5cGVvZiBWYWx1ZVR5cGU+LCB2YWx1ZTogQmFzZTY0IHwgc3RyaW5nKTogYW55IHtcblx0aWYgKHR5cGUgPT09IFZhbHVlVHlwZS5CeXRlcykge1xuXHRcdHJldHVybiBiYXNlNjRUb1VpbnQ4QXJyYXkodmFsdWUgYXMgYW55KVxuXHR9IGVsc2UgaWYgKHR5cGUgPT09IFZhbHVlVHlwZS5Cb29sZWFuKSB7XG5cdFx0cmV0dXJuIHZhbHVlICE9PSBcIjBcIlxuXHR9IGVsc2UgaWYgKHR5cGUgPT09IFZhbHVlVHlwZS5EYXRlKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRlKHBhcnNlSW50KHZhbHVlKSlcblx0fSBlbHNlIGlmICh0eXBlID09PSBWYWx1ZVR5cGUuQ29tcHJlc3NlZFN0cmluZykge1xuXHRcdHJldHVybiBkZWNvbXByZXNzU3RyaW5nKGJhc2U2NFRvVWludDhBcnJheSh2YWx1ZSkpXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIHZhbHVlXG5cdH1cbn1cblxuZnVuY3Rpb24gY29tcHJlc3NTdHJpbmcodW5jb21wcmVzc2VkOiBzdHJpbmcpOiBVaW50OEFycmF5IHtcblx0cmV0dXJuIGNvbXByZXNzKHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkodW5jb21wcmVzc2VkKSlcbn1cblxuZnVuY3Rpb24gZGVjb21wcmVzc1N0cmluZyhjb21wcmVzc2VkOiBVaW50OEFycmF5KTogc3RyaW5nIHtcblx0aWYgKGNvbXByZXNzZWQubGVuZ3RoID09PSAwKSB7XG5cdFx0cmV0dXJuIFwiXCJcblx0fVxuXG5cdGNvbnN0IG91dHB1dCA9IHVuY29tcHJlc3MoY29tcHJlc3NlZClcblx0cmV0dXJuIHV0ZjhVaW50OEFycmF5VG9TdHJpbmcob3V0cHV0KVxufVxuXG5mdW5jdGlvbiB2YWx1ZVRvRGVmYXVsdCh0eXBlOiBWYWx1ZXM8dHlwZW9mIFZhbHVlVHlwZT4pOiBEYXRlIHwgVWludDhBcnJheSB8IHN0cmluZyB8IGJvb2xlYW4ge1xuXHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRjYXNlIFZhbHVlVHlwZS5TdHJpbmc6XG5cdFx0XHRyZXR1cm4gXCJcIlxuXG5cdFx0Y2FzZSBWYWx1ZVR5cGUuTnVtYmVyOlxuXHRcdFx0cmV0dXJuIFwiMFwiXG5cblx0XHRjYXNlIFZhbHVlVHlwZS5CeXRlczpcblx0XHRcdHJldHVybiBuZXcgVWludDhBcnJheSgwKVxuXG5cdFx0Y2FzZSBWYWx1ZVR5cGUuRGF0ZTpcblx0XHRcdHJldHVybiBuZXcgRGF0ZSgwKVxuXG5cdFx0Y2FzZSBWYWx1ZVR5cGUuQm9vbGVhbjpcblx0XHRcdHJldHVybiBmYWxzZVxuXG5cdFx0Y2FzZSBWYWx1ZVR5cGUuQ29tcHJlc3NlZFN0cmluZzpcblx0XHRcdHJldHVybiBcIlwiXG5cblx0XHRkZWZhdWx0OlxuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoYCR7dHlwZX0gaXMgbm90IGEgdmFsaWQgdmFsdWUgdHlwZWApXG5cdH1cbn1cblxuZnVuY3Rpb24gaXNEZWZhdWx0VmFsdWUodHlwZTogVmFsdWVzPHR5cGVvZiBWYWx1ZVR5cGU+LCB2YWx1ZTogdW5rbm93bik6IGJvb2xlYW4ge1xuXHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRjYXNlIFZhbHVlVHlwZS5TdHJpbmc6XG5cdFx0XHRyZXR1cm4gdmFsdWUgPT09IFwiXCJcblxuXHRcdGNhc2UgVmFsdWVUeXBlLk51bWJlcjpcblx0XHRcdHJldHVybiB2YWx1ZSA9PT0gXCIwXCJcblxuXHRcdGNhc2UgVmFsdWVUeXBlLkJ5dGVzOlxuXHRcdFx0cmV0dXJuICh2YWx1ZSBhcyBVaW50OEFycmF5KS5sZW5ndGggPT09IDBcblxuXHRcdGNhc2UgVmFsdWVUeXBlLkRhdGU6XG5cdFx0XHRyZXR1cm4gKHZhbHVlIGFzIERhdGUpLmdldFRpbWUoKSA9PT0gMFxuXG5cdFx0Y2FzZSBWYWx1ZVR5cGUuQm9vbGVhbjpcblx0XHRcdHJldHVybiB2YWx1ZSA9PT0gZmFsc2VcblxuXHRcdGNhc2UgVmFsdWVUeXBlLkNvbXByZXNzZWRTdHJpbmc6XG5cdFx0XHRyZXR1cm4gdmFsdWUgPT09IFwiXCJcblxuXHRcdGRlZmF1bHQ6XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihgJHt0eXBlfSBpcyBub3QgYSB2YWxpZCB2YWx1ZSB0eXBlYClcblx0fVxufVxuIiwiaW1wb3J0IHsgUXVldWVkQmF0Y2ggfSBmcm9tIFwiLi4vRXZlbnRRdWV1ZS5qc1wiXG5pbXBvcnQgeyBFbnRpdHlVcGRhdGUgfSBmcm9tIFwiLi4vLi4vZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IExpc3RFbGVtZW50RW50aXR5LCBTb21lRW50aXR5IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnRpdHlUeXBlc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yXCJcbmltcG9ydCB7IFR5cGVSZWYgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEVudGl0eVJlc3RDYWNoZSB9IGZyb20gXCIuL0RlZmF1bHRFbnRpdHlSZXN0Q2FjaGUuanNcIlxuaW1wb3J0IHsgRW50aXR5UmVzdENsaWVudExvYWRPcHRpb25zIH0gZnJvbSBcIi4vRW50aXR5UmVzdENsaWVudC5qc1wiXG5cbmV4cG9ydCBjbGFzcyBBZG1pbkNsaWVudER1bW15RW50aXR5UmVzdENhY2hlIGltcGxlbWVudHMgRW50aXR5UmVzdENhY2hlIHtcblx0YXN5bmMgZW50aXR5RXZlbnRzUmVjZWl2ZWQoYmF0Y2g6IFF1ZXVlZEJhdGNoKTogUHJvbWlzZTxBcnJheTxFbnRpdHlVcGRhdGU+PiB7XG5cdFx0cmV0dXJuIGJhdGNoLmV2ZW50c1xuXHR9XG5cblx0YXN5bmMgZXJhc2U8VCBleHRlbmRzIFNvbWVFbnRpdHk+KGluc3RhbmNlOiBUKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJlcmFzZSBub3QgaW1wbGVtZW50ZWRcIilcblx0fVxuXG5cdGFzeW5jIGxvYWQ8VCBleHRlbmRzIFNvbWVFbnRpdHk+KF90eXBlUmVmOiBUeXBlUmVmPFQ+LCBfaWQ6IFByb3BlcnR5VHlwZTxULCBcIl9pZFwiPiwgX29wdHM6IEVudGl0eVJlc3RDbGllbnRMb2FkT3B0aW9ucyk6IFByb21pc2U8VD4ge1xuXHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwibG9hZCBub3QgaW1wbGVtZW50ZWRcIilcblx0fVxuXG5cdGFzeW5jIGxvYWRNdWx0aXBsZTxUIGV4dGVuZHMgU29tZUVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCB8IG51bGwsIGVsZW1lbnRJZHM6IEFycmF5PElkPik6IFByb21pc2U8QXJyYXk8VD4+IHtcblx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcImxvYWRNdWx0aXBsZSBub3QgaW1wbGVtZW50ZWRcIilcblx0fVxuXG5cdGFzeW5jIGxvYWRSYW5nZTxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIHN0YXJ0OiBJZCwgY291bnQ6IG51bWJlciwgcmV2ZXJzZTogYm9vbGVhbik6IFByb21pc2U8VFtdPiB7XG5cdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJsb2FkUmFuZ2Ugbm90IGltcGxlbWVudGVkXCIpXG5cdH1cblxuXHRhc3luYyBwdXJnZVN0b3JhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuXG5cdH1cblxuXHRhc3luYyBzZXR1cDxUIGV4dGVuZHMgU29tZUVudGl0eT4obGlzdElkOiBJZCB8IG51bGwsIGluc3RhbmNlOiBULCBleHRyYUhlYWRlcnM/OiBEaWN0KTogUHJvbWlzZTxJZD4ge1xuXHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwic2V0dXAgbm90IGltcGxlbWVudGVkXCIpXG5cdH1cblxuXHRhc3luYyBzZXR1cE11bHRpcGxlPFQgZXh0ZW5kcyBTb21lRW50aXR5PihsaXN0SWQ6IElkIHwgbnVsbCwgaW5zdGFuY2VzOiBBcnJheTxUPik6IFByb21pc2U8QXJyYXk8SWQ+PiB7XG5cdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJzZXR1cE11bHRpcGxlIG5vdCBpbXBsZW1lbnRlZFwiKVxuXHR9XG5cblx0YXN5bmMgdXBkYXRlPFQgZXh0ZW5kcyBTb21lRW50aXR5PihpbnN0YW5jZTogVCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwidXBkYXRlIG5vdCBpbXBsZW1lbnRlZFwiKVxuXHR9XG5cblx0YXN5bmMgZ2V0TGFzdEVudGl0eUV2ZW50QmF0Y2hGb3JHcm91cChncm91cElkOiBJZCk6IFByb21pc2U8SWQgfCBudWxsPiB7XG5cdFx0cmV0dXJuIG51bGxcblx0fVxuXG5cdGFzeW5jIHNldExhc3RFbnRpdHlFdmVudEJhdGNoRm9yR3JvdXAoZ3JvdXBJZDogSWQsIGJhdGNoSWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuXG5cdH1cblxuXHRhc3luYyByZWNvcmRTeW5jVGltZSgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm5cblx0fVxuXG5cdGFzeW5jIHRpbWVTaW5jZUxhc3RTeW5jTXMoKTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG5cdFx0cmV0dXJuIG51bGxcblx0fVxuXG5cdGFzeW5jIGlzT3V0T2ZTeW5jKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHJldHVybiBmYWxzZVxuXHR9XG59XG4iLCJpbXBvcnQgeyBUaHVuayB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgU2NoZWR1bGVyIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi91dGlscy9TY2hlZHVsZXIuanNcIlxuaW1wb3J0IHsgRGF0ZVByb3ZpZGVyIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9EYXRlUHJvdmlkZXIuanNcIlxuXG4vLyBleHBvcnRlZCBmb3IgdGVzdGluZ1xuLyoqIEhvdyBvZnRlbiBkbyB3ZSBjaGVjayBmb3Igc2xlZXAuICovXG5leHBvcnQgY29uc3QgQ0hFQ0tfSU5URVJWQUwgPSA1MDAwXG4vKiogSG93IG11Y2ggdGltZSBzaG91bGQgaGF2ZSBwYXNzZWQgZm9yIHVzIHRvIGFzc3VtZSB0aGF0IHRoZSBhcHAgd2FzIHN1c3BlbmRlZC4gKi9cbmV4cG9ydCBjb25zdCBTTEVFUF9JTlRFUlZBTCA9IDE1MDAwXG5cbmludGVyZmFjZSBTY2hlZHVsZWRTdGF0ZSB7XG5cdHNjaGVkdWxlZElkOiBudW1iZXJcblx0bGFzdFRpbWU6IG51bWJlclxuXHRyZWFkb25seSBvblNsZWVwOiBUaHVua1xufVxuXG4vKipcbiAqIENsYXNzIGZvciBkZXRlY3Rpbmcgc3VzcGVuc2lvbiBzdGF0ZSBvZiB0aGUgYXBwL2RldmljZS5cbiAqIFdoZW4gdGhlIGRldmljZSBpcyBlbnRlcmluZyB0aGUgc2xlZXAgbW9kZSB0aGUgYnJvd3NlciB3b3VsZCBwYXVzZSB0aGUgcGFnZS4gRm9yIG1vc3Qgb2YgdGhlIGFwcCBpdCBsb29rcyBsaWtlIG5vIHRpbWUgaGFzIHBhc3NlZCBhdCBhbGwgYnV0IHdoZW4gdGhlcmVcbiAqIGFyZSBleHRlcm5hbCBmYWN0b3JzIGUuZy4gd2Vic29ja2V0IGNvbm5lY3Rpb24gd2UgbWlnaHQgbmVlZCB0byBrbm93IHdoZXRoZXIgaXQgaGFwcGVucy5cbiAqXG4gKiBXZSBkZXRlY3Qgc3VjaCBzaXR1YXRpb24gYnkgc2NoZWR1bGluZyBwZXJpb2RpYyB0aW1lciBhbmQgbWVhc3VyaW5nIHRoZSB0aW1lIGluIGJldHdlZW4uXG4gKlxuICogQ3VycmVudGx5IGlzIG9ubHkgY2FwYWJsZSBvZiBoYXZpbmcgb25lIHNsZWVwIGFjdGlvbiBhdCBhIHRpbWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBTbGVlcERldGVjdG9yIHtcblx0cHJpdmF0ZSBzY2hlZHVsZWRTdGF0ZTogU2NoZWR1bGVkU3RhdGUgfCBudWxsID0gbnVsbFxuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgc2NoZWR1bGVyOiBTY2hlZHVsZXIsIHByaXZhdGUgcmVhZG9ubHkgZGF0ZVByb3ZpZGVyOiBEYXRlUHJvdmlkZXIpIHt9XG5cblx0c3RhcnQob25TbGVlcDogVGh1bmspOiB2b2lkIHtcblx0XHR0aGlzLnN0b3AoKVxuXHRcdHRoaXMuc2NoZWR1bGVkU3RhdGUgPSB7XG5cdFx0XHRzY2hlZHVsZWRJZDogdGhpcy5zY2hlZHVsZXIuc2NoZWR1bGVQZXJpb2RpYygoKSA9PiB0aGlzLmNoZWNrKCksIENIRUNLX0lOVEVSVkFMKSxcblx0XHRcdGxhc3RUaW1lOiB0aGlzLmRhdGVQcm92aWRlci5ub3coKSxcblx0XHRcdG9uU2xlZXAsXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBjaGVjaygpIHtcblx0XHRpZiAodGhpcy5zY2hlZHVsZWRTdGF0ZSA9PSBudWxsKSByZXR1cm5cblxuXHRcdGNvbnN0IG5vdyA9IHRoaXMuZGF0ZVByb3ZpZGVyLm5vdygpXG5cdFx0aWYgKG5vdyAtIHRoaXMuc2NoZWR1bGVkU3RhdGUubGFzdFRpbWUgPiBTTEVFUF9JTlRFUlZBTCkge1xuXHRcdFx0dGhpcy5zY2hlZHVsZWRTdGF0ZS5vblNsZWVwKClcblx0XHR9XG5cdFx0dGhpcy5zY2hlZHVsZWRTdGF0ZS5sYXN0VGltZSA9IG5vd1xuXHR9XG5cblx0c3RvcCgpOiB2b2lkIHtcblx0XHRpZiAodGhpcy5zY2hlZHVsZWRTdGF0ZSkge1xuXHRcdFx0dGhpcy5zY2hlZHVsZXIudW5zY2hlZHVsZVBlcmlvZGljKHRoaXMuc2NoZWR1bGVkU3RhdGUuc2NoZWR1bGVkSWQpXG5cdFx0XHR0aGlzLnNjaGVkdWxlZFN0YXRlID0gbnVsbFxuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgQmxvYkVsZW1lbnRFbnRpdHksIEVsZW1lbnRFbnRpdHksIExpc3RFbGVtZW50RW50aXR5LCBTb21lRW50aXR5LCBUeXBlTW9kZWwgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0VudGl0eVR5cGVzLmpzXCJcbmltcG9ydCB7IEVudGl0eVJlc3RDbGllbnQsIHR5cGVSZWZUb1BhdGggfSBmcm9tIFwiLi9FbnRpdHlSZXN0Q2xpZW50LmpzXCJcbmltcG9ydCB7IGZpcnN0QmlnZ2VyVGhhblNlY29uZCB9IGZyb20gXCIuLi8uLi9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgQ2FjaGVTdG9yYWdlLCBleHBhbmRJZCwgRXhwb3NlZENhY2hlU3RvcmFnZSwgTGFzdFVwZGF0ZVRpbWUgfSBmcm9tIFwiLi9EZWZhdWx0RW50aXR5UmVzdENhY2hlLmpzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGNsb25lLCBnZXRGcm9tTWFwLCByZW1vdmUsIFR5cGVSZWYgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEN1c3RvbUNhY2hlSGFuZGxlck1hcCB9IGZyb20gXCIuL0N1c3RvbUNhY2hlSGFuZGxlci5qc1wiXG5pbXBvcnQgeyByZXNvbHZlVHlwZVJlZmVyZW5jZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5RnVuY3Rpb25zLmpzXCJcbmltcG9ydCB7IFR5cGUgYXMgVHlwZUlkIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnRpdHlDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBjdXN0b21JZFRvQmFzZTY0VXJsLCBlbnN1cmVCYXNlNjRFeHQgfSBmcm9tIFwiLi4vb2ZmbGluZS9PZmZsaW5lU3RvcmFnZS5qc1wiXG5cbi8qKiBDYWNoZSBmb3IgYSBzaW5nbGUgbGlzdC4gKi9cbnR5cGUgTGlzdENhY2hlID0ge1xuXHQvKiogQWxsIGVudGl0aWVzIGxvYWRlZCBpbnNpZGUgdGhlIHJhbmdlLiAqL1xuXHRhbGxSYW5nZTogSWRbXVxuXHRsb3dlclJhbmdlSWQ6IElkXG5cdHVwcGVyUmFuZ2VJZDogSWRcblx0LyoqIEFsbCB0aGUgZW50aXRpZXMgbG9hZGVkLCBpbnNpZGUgb3Igb3V0c2lkZSB0aGUgcmFuZ2UgKGUuZy4gbG9hZCBmb3IgYSBzaW5nbGUgZW50aXR5KS4gKi9cblx0ZWxlbWVudHM6IE1hcDxJZCwgTGlzdEVsZW1lbnRFbnRpdHk+XG59XG5cbi8qKiBNYXAgZnJvbSBsaXN0IGlkIHRvIGxpc3QgY2FjaGUuICovXG50eXBlIExpc3RUeXBlQ2FjaGUgPSBNYXA8SWQsIExpc3RDYWNoZT5cblxudHlwZSBCbG9iRWxlbWVudENhY2hlID0ge1xuXHQvKiogQWxsIHRoZSBlbnRpdGllcyBsb2FkZWQsIGluc2lkZSBvciBvdXRzaWRlIHRoZSByYW5nZSAoZS5nLiBsb2FkIGZvciBhIHNpbmdsZSBlbnRpdHkpLiAqL1xuXHRlbGVtZW50czogTWFwPElkLCBCbG9iRWxlbWVudEVudGl0eT5cbn1cblxuLyoqIE1hcCBmcm9tIGxpc3QgaWQgdG8gbGlzdCBjYWNoZS4gKi9cbnR5cGUgQmxvYkVsZW1lbnRUeXBlQ2FjaGUgPSBNYXA8SWQsIEJsb2JFbGVtZW50Q2FjaGU+XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXBoZW1lcmFsU3RvcmFnZUluaXRBcmdzIHtcblx0dXNlcklkOiBJZFxufVxuXG5leHBvcnQgY2xhc3MgRXBoZW1lcmFsQ2FjaGVTdG9yYWdlIGltcGxlbWVudHMgQ2FjaGVTdG9yYWdlIHtcblx0LyoqIFBhdGggdG8gaWQgdG8gZW50aXR5IG1hcC4gKi9cblx0cHJpdmF0ZSByZWFkb25seSBlbnRpdGllczogTWFwPHN0cmluZywgTWFwPElkLCBFbGVtZW50RW50aXR5Pj4gPSBuZXcgTWFwKClcblx0cHJpdmF0ZSByZWFkb25seSBsaXN0czogTWFwPHN0cmluZywgTGlzdFR5cGVDYWNoZT4gPSBuZXcgTWFwKClcblx0cHJpdmF0ZSByZWFkb25seSBibG9iRW50aXRpZXM6IE1hcDxzdHJpbmcsIEJsb2JFbGVtZW50VHlwZUNhY2hlPiA9IG5ldyBNYXAoKVxuXHRwcml2YXRlIHJlYWRvbmx5IGN1c3RvbUNhY2hlSGFuZGxlck1hcDogQ3VzdG9tQ2FjaGVIYW5kbGVyTWFwID0gbmV3IEN1c3RvbUNhY2hlSGFuZGxlck1hcCgpXG5cdHByaXZhdGUgbGFzdFVwZGF0ZVRpbWU6IG51bWJlciB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgdXNlcklkOiBJZCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgbGFzdEJhdGNoSWRQZXJHcm91cCA9IG5ldyBNYXA8SWQsIElkPigpXG5cblx0aW5pdCh7IHVzZXJJZCB9OiBFcGhlbWVyYWxTdG9yYWdlSW5pdEFyZ3MpIHtcblx0XHR0aGlzLnVzZXJJZCA9IHVzZXJJZFxuXHR9XG5cblx0ZGVpbml0KCkge1xuXHRcdHRoaXMudXNlcklkID0gbnVsbFxuXHRcdHRoaXMuZW50aXRpZXMuY2xlYXIoKVxuXHRcdHRoaXMubGlzdHMuY2xlYXIoKVxuXHRcdHRoaXMuYmxvYkVudGl0aWVzLmNsZWFyKClcblx0XHR0aGlzLmxhc3RVcGRhdGVUaW1lID0gbnVsbFxuXHRcdHRoaXMubGFzdEJhdGNoSWRQZXJHcm91cC5jbGVhcigpXG5cdH1cblxuXHQvKipcblx0ICogR2V0IGEgZ2l2ZW4gZW50aXR5IGZyb20gdGhlIGNhY2hlLCBleHBlY3RzIHRoYXQgeW91IGhhdmUgYWxyZWFkeSBjaGVja2VkIGZvciBleGlzdGVuY2Vcblx0ICovXG5cdGFzeW5jIGdldDxUIGV4dGVuZHMgU29tZUVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCB8IG51bGwsIGVsZW1lbnRJZDogSWQpOiBQcm9taXNlPFQgfCBudWxsPiB7XG5cdFx0Ly8gV2UgZG93bmNhc3QgYmVjYXVzZSB3ZSBjYW4ndCBwcm92ZSB0aGF0IG1hcCBoYXMgY29ycmVjdCBlbnRpdHkgb24gdGhlIHR5cGUgbGV2ZWxcblx0XHRjb25zdCBwYXRoID0gdHlwZVJlZlRvUGF0aCh0eXBlUmVmKVxuXHRcdGNvbnN0IHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKHR5cGVSZWYpXG5cdFx0ZWxlbWVudElkID0gZW5zdXJlQmFzZTY0RXh0KHR5cGVNb2RlbCwgZWxlbWVudElkKVxuXHRcdHN3aXRjaCAodHlwZU1vZGVsLnR5cGUpIHtcblx0XHRcdGNhc2UgVHlwZUlkLkVsZW1lbnQ6XG5cdFx0XHRcdHJldHVybiBjbG9uZSgodGhpcy5lbnRpdGllcy5nZXQocGF0aCk/LmdldChlbGVtZW50SWQpIGFzIFQgfCB1bmRlZmluZWQpID8/IG51bGwpXG5cdFx0XHRjYXNlIFR5cGVJZC5MaXN0RWxlbWVudDpcblx0XHRcdFx0cmV0dXJuIGNsb25lKCh0aGlzLmxpc3RzLmdldChwYXRoKT8uZ2V0KGFzc2VydE5vdE51bGwobGlzdElkKSk/LmVsZW1lbnRzLmdldChlbGVtZW50SWQpIGFzIFQgfCB1bmRlZmluZWQpID8/IG51bGwpXG5cdFx0XHRjYXNlIFR5cGVJZC5CbG9iRWxlbWVudDpcblx0XHRcdFx0cmV0dXJuIGNsb25lKCh0aGlzLmJsb2JFbnRpdGllcy5nZXQocGF0aCk/LmdldChhc3NlcnROb3ROdWxsKGxpc3RJZCkpPy5lbGVtZW50cy5nZXQoZWxlbWVudElkKSBhcyBUIHwgdW5kZWZpbmVkKSA/PyBudWxsKVxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJtdXN0IGJlIGEgcGVyc2lzdGVudCB0eXBlXCIpXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgZGVsZXRlSWZFeGlzdHM8VD4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCB8IG51bGwsIGVsZW1lbnRJZDogSWQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBwYXRoID0gdHlwZVJlZlRvUGF0aCh0eXBlUmVmKVxuXHRcdGxldCB0eXBlTW9kZWw6IFR5cGVNb2RlbFxuXHRcdHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKHR5cGVSZWYpXG5cdFx0ZWxlbWVudElkID0gZW5zdXJlQmFzZTY0RXh0KHR5cGVNb2RlbCwgZWxlbWVudElkKVxuXHRcdHN3aXRjaCAodHlwZU1vZGVsLnR5cGUpIHtcblx0XHRcdGNhc2UgVHlwZUlkLkVsZW1lbnQ6XG5cdFx0XHRcdHRoaXMuZW50aXRpZXMuZ2V0KHBhdGgpPy5kZWxldGUoZWxlbWVudElkKVxuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSBUeXBlSWQuTGlzdEVsZW1lbnQ6IHtcblx0XHRcdFx0Y29uc3QgY2FjaGUgPSB0aGlzLmxpc3RzLmdldChwYXRoKT8uZ2V0KGFzc2VydE5vdE51bGwobGlzdElkKSlcblx0XHRcdFx0aWYgKGNhY2hlICE9IG51bGwpIHtcblx0XHRcdFx0XHRjYWNoZS5lbGVtZW50cy5kZWxldGUoZWxlbWVudElkKVxuXHRcdFx0XHRcdHJlbW92ZShjYWNoZS5hbGxSYW5nZSwgZWxlbWVudElkKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cdFx0XHRjYXNlIFR5cGVJZC5CbG9iRWxlbWVudDpcblx0XHRcdFx0dGhpcy5ibG9iRW50aXRpZXMuZ2V0KHBhdGgpPy5nZXQoYXNzZXJ0Tm90TnVsbChsaXN0SWQpKT8uZWxlbWVudHMuZGVsZXRlKGVsZW1lbnRJZClcblx0XHRcdFx0YnJlYWtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwibXVzdCBiZSBhIHBlcnNpc3RlbnQgdHlwZVwiKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYWRkRWxlbWVudEVudGl0eTxUIGV4dGVuZHMgRWxlbWVudEVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgaWQ6IElkLCBlbnRpdHk6IFQpIHtcblx0XHRnZXRGcm9tTWFwKHRoaXMuZW50aXRpZXMsIHR5cGVSZWZUb1BhdGgodHlwZVJlZiksICgpID0+IG5ldyBNYXAoKSkuc2V0KGlkLCBlbnRpdHkpXG5cdH1cblxuXHRhc3luYyBpc0VsZW1lbnRJZEluQ2FjaGVSYW5nZTxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIGVsZW1lbnRJZDogSWQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCB0eXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKVxuXHRcdGVsZW1lbnRJZCA9IGVuc3VyZUJhc2U2NEV4dCh0eXBlTW9kZWwsIGVsZW1lbnRJZClcblxuXHRcdGNvbnN0IGNhY2hlID0gdGhpcy5saXN0cy5nZXQodHlwZVJlZlRvUGF0aCh0eXBlUmVmKSk/LmdldChsaXN0SWQpXG5cdFx0cmV0dXJuIGNhY2hlICE9IG51bGwgJiYgIWZpcnN0QmlnZ2VyVGhhblNlY29uZChlbGVtZW50SWQsIGNhY2hlLnVwcGVyUmFuZ2VJZCkgJiYgIWZpcnN0QmlnZ2VyVGhhblNlY29uZChjYWNoZS5sb3dlclJhbmdlSWQsIGVsZW1lbnRJZClcblx0fVxuXG5cdGFzeW5jIHB1dChvcmlnaW5hbEVudGl0eTogU29tZUVudGl0eSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGVudGl0eSA9IGNsb25lKG9yaWdpbmFsRW50aXR5KVxuXHRcdGNvbnN0IHR5cGVSZWYgPSBlbnRpdHkuX3R5cGVcblx0XHRjb25zdCB0eXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKVxuXHRcdGxldCB7IGxpc3RJZCwgZWxlbWVudElkIH0gPSBleHBhbmRJZChvcmlnaW5hbEVudGl0eS5faWQpXG5cdFx0ZWxlbWVudElkID0gZW5zdXJlQmFzZTY0RXh0KHR5cGVNb2RlbCwgZWxlbWVudElkKVxuXHRcdHN3aXRjaCAodHlwZU1vZGVsLnR5cGUpIHtcblx0XHRcdGNhc2UgVHlwZUlkLkVsZW1lbnQ6IHtcblx0XHRcdFx0Y29uc3QgZWxlbWVudEVudGl0eSA9IGVudGl0eSBhcyBFbGVtZW50RW50aXR5XG5cdFx0XHRcdHRoaXMuYWRkRWxlbWVudEVudGl0eShlbGVtZW50RW50aXR5Ll90eXBlLCBlbGVtZW50SWQsIGVsZW1lbnRFbnRpdHkpXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cdFx0XHRjYXNlIFR5cGVJZC5MaXN0RWxlbWVudDoge1xuXHRcdFx0XHRjb25zdCBsaXN0RWxlbWVudEVudGl0eSA9IGVudGl0eSBhcyBMaXN0RWxlbWVudEVudGl0eVxuXHRcdFx0XHRjb25zdCBsaXN0RWxlbWVudFR5cGVSZWYgPSB0eXBlUmVmIGFzIFR5cGVSZWY8TGlzdEVsZW1lbnRFbnRpdHk+XG5cdFx0XHRcdGxpc3RJZCA9IGxpc3RJZCBhcyBJZFxuXHRcdFx0XHRhd2FpdCB0aGlzLnB1dExpc3RFbGVtZW50KGxpc3RFbGVtZW50VHlwZVJlZiwgbGlzdElkLCBlbGVtZW50SWQsIGxpc3RFbGVtZW50RW50aXR5KVxuXHRcdFx0XHRicmVha1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSBUeXBlSWQuQmxvYkVsZW1lbnQ6IHtcblx0XHRcdFx0Y29uc3QgYmxvYkVsZW1lbnRFbnRpdHkgPSBlbnRpdHkgYXMgQmxvYkVsZW1lbnRFbnRpdHlcblx0XHRcdFx0Y29uc3QgYmxvYlR5cGVSZWYgPSB0eXBlUmVmIGFzIFR5cGVSZWY8QmxvYkVsZW1lbnRFbnRpdHk+XG5cdFx0XHRcdGxpc3RJZCA9IGxpc3RJZCBhcyBJZFxuXHRcdFx0XHRhd2FpdCB0aGlzLnB1dEJsb2JFbGVtZW50KGJsb2JUeXBlUmVmLCBsaXN0SWQsIGVsZW1lbnRJZCwgYmxvYkVsZW1lbnRFbnRpdHkpXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIm11c3QgYmUgYSBwZXJzaXN0ZW50IHR5cGVcIilcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHB1dEJsb2JFbGVtZW50KHR5cGVSZWY6IFR5cGVSZWY8QmxvYkVsZW1lbnRFbnRpdHk+LCBsaXN0SWQ6IElkLCBlbGVtZW50SWQ6IElkLCBlbnRpdHk6IEJsb2JFbGVtZW50RW50aXR5KSB7XG5cdFx0Y29uc3QgY2FjaGUgPSB0aGlzLmJsb2JFbnRpdGllcy5nZXQodHlwZVJlZlRvUGF0aCh0eXBlUmVmKSk/LmdldChsaXN0SWQpXG5cdFx0aWYgKGNhY2hlID09IG51bGwpIHtcblx0XHRcdC8vIGZpcnN0IGVsZW1lbnQgaW4gdGhpcyBsaXN0XG5cdFx0XHRjb25zdCBuZXdDYWNoZSA9IHtcblx0XHRcdFx0ZWxlbWVudHM6IG5ldyBNYXAoW1tlbGVtZW50SWQsIGVudGl0eV1dKSxcblx0XHRcdH1cblx0XHRcdGdldEZyb21NYXAodGhpcy5ibG9iRW50aXRpZXMsIHR5cGVSZWZUb1BhdGgodHlwZVJlZiksICgpID0+IG5ldyBNYXAoKSkuc2V0KGxpc3RJZCwgbmV3Q2FjaGUpXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGlmIHRoZSBlbGVtZW50IGFscmVhZHkgZXhpc3RzIGluIHRoZSBjYWNoZSwgb3ZlcndyaXRlIGl0XG5cdFx0XHRjYWNoZS5lbGVtZW50cy5zZXQoZWxlbWVudElkLCBlbnRpdHkpXG5cdFx0fVxuXHR9XG5cblx0LyoqIHByY29uZGl0aW9uOiBlbGVtZW50SWQgaXMgY29udmVydGVkIHRvIGJhc2U2NGV4dCBpZiBuZWNlc3NhcnkgKi9cblx0cHJpdmF0ZSBhc3luYyBwdXRMaXN0RWxlbWVudCh0eXBlUmVmOiBUeXBlUmVmPExpc3RFbGVtZW50RW50aXR5PiwgbGlzdElkOiBJZCwgZWxlbWVudElkOiBJZCwgZW50aXR5OiBMaXN0RWxlbWVudEVudGl0eSkge1xuXHRcdGNvbnN0IGNhY2hlID0gdGhpcy5saXN0cy5nZXQodHlwZVJlZlRvUGF0aCh0eXBlUmVmKSk/LmdldChsaXN0SWQpXG5cdFx0aWYgKGNhY2hlID09IG51bGwpIHtcblx0XHRcdC8vIGZpcnN0IGVsZW1lbnQgaW4gdGhpcyBsaXN0XG5cdFx0XHRjb25zdCBuZXdDYWNoZSA9IHtcblx0XHRcdFx0YWxsUmFuZ2U6IFtlbGVtZW50SWRdLFxuXHRcdFx0XHRsb3dlclJhbmdlSWQ6IGVsZW1lbnRJZCxcblx0XHRcdFx0dXBwZXJSYW5nZUlkOiBlbGVtZW50SWQsXG5cdFx0XHRcdGVsZW1lbnRzOiBuZXcgTWFwKFtbZWxlbWVudElkLCBlbnRpdHldXSksXG5cdFx0XHR9XG5cdFx0XHRnZXRGcm9tTWFwKHRoaXMubGlzdHMsIHR5cGVSZWZUb1BhdGgodHlwZVJlZiksICgpID0+IG5ldyBNYXAoKSkuc2V0KGxpc3RJZCwgbmV3Q2FjaGUpXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGlmIHRoZSBlbGVtZW50IGFscmVhZHkgZXhpc3RzIGluIHRoZSBjYWNoZSwgb3ZlcndyaXRlIGl0XG5cdFx0XHQvLyBhZGQgbmV3IGVsZW1lbnQgdG8gZXhpc3RpbmcgbGlzdCBpZiBuZWNlc3Nhcnlcblx0XHRcdGNhY2hlLmVsZW1lbnRzLnNldChlbGVtZW50SWQsIGVudGl0eSlcblx0XHRcdGNvbnN0IHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKHR5cGVSZWYpXG5cdFx0XHRpZiAoYXdhaXQgdGhpcy5pc0VsZW1lbnRJZEluQ2FjaGVSYW5nZSh0eXBlUmVmLCBsaXN0SWQsIGN1c3RvbUlkVG9CYXNlNjRVcmwodHlwZU1vZGVsLCBlbGVtZW50SWQpKSkge1xuXHRcdFx0XHR0aGlzLmluc2VydEludG9SYW5nZShjYWNoZS5hbGxSYW5nZSwgZWxlbWVudElkKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKiBwcmVjb25kaXRpb246IGVsZW1lbnRJZCBpcyBjb252ZXJ0ZWQgdG8gYmFzZTY0ZXh0IGlmIG5lY2Vzc2FyeSAqL1xuXHRwcml2YXRlIGluc2VydEludG9SYW5nZShhbGxSYW5nZTogQXJyYXk8SWQ+LCBlbGVtZW50SWQ6IElkKSB7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBhbGxSYW5nZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgcmFuZ2VFbGVtZW50ID0gYWxsUmFuZ2VbaV1cblx0XHRcdGlmIChmaXJzdEJpZ2dlclRoYW5TZWNvbmQocmFuZ2VFbGVtZW50LCBlbGVtZW50SWQpKSB7XG5cdFx0XHRcdGFsbFJhbmdlLnNwbGljZShpLCAwLCBlbGVtZW50SWQpXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXHRcdFx0aWYgKHJhbmdlRWxlbWVudCA9PT0gZWxlbWVudElkKSB7XG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXHRcdH1cblx0XHRhbGxSYW5nZS5wdXNoKGVsZW1lbnRJZClcblx0fVxuXG5cdGFzeW5jIHByb3ZpZGVGcm9tUmFuZ2U8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkLCBzdGFydEVsZW1lbnRJZDogSWQsIGNvdW50OiBudW1iZXIsIHJldmVyc2U6IGJvb2xlYW4pOiBQcm9taXNlPFRbXT4ge1xuXHRcdGNvbnN0IHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKHR5cGVSZWYpXG5cdFx0c3RhcnRFbGVtZW50SWQgPSBlbnN1cmVCYXNlNjRFeHQodHlwZU1vZGVsLCBzdGFydEVsZW1lbnRJZClcblxuXHRcdGNvbnN0IGxpc3RDYWNoZSA9IHRoaXMubGlzdHMuZ2V0KHR5cGVSZWZUb1BhdGgodHlwZVJlZikpPy5nZXQobGlzdElkKVxuXG5cdFx0aWYgKGxpc3RDYWNoZSA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gW11cblx0XHR9XG5cblx0XHRsZXQgcmFuZ2UgPSBsaXN0Q2FjaGUuYWxsUmFuZ2Vcblx0XHRsZXQgaWRzOiBJZFtdID0gW11cblx0XHRpZiAocmV2ZXJzZSkge1xuXHRcdFx0bGV0IGlcblx0XHRcdGZvciAoaSA9IHJhbmdlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdGlmIChmaXJzdEJpZ2dlclRoYW5TZWNvbmQoc3RhcnRFbGVtZW50SWQsIHJhbmdlW2ldKSkge1xuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmIChpID49IDApIHtcblx0XHRcdFx0bGV0IHN0YXJ0SW5kZXggPSBpICsgMSAtIGNvdW50XG5cdFx0XHRcdGlmIChzdGFydEluZGV4IDwgMCkge1xuXHRcdFx0XHRcdC8vIHN0YXJ0RWxlbWVudElkIGluZGV4IG1heSBiZSBuZWdhdGl2ZSBpZiBtb3JlIGVsZW1lbnRzIGhhdmUgYmVlbiByZXF1ZXN0ZWQgdGhhbiBhdmFpbGFibGUgd2hlbiBnZXR0aW5nIGVsZW1lbnRzIHJldmVyc2UuXG5cdFx0XHRcdFx0c3RhcnRJbmRleCA9IDBcblx0XHRcdFx0fVxuXHRcdFx0XHRpZHMgPSByYW5nZS5zbGljZShzdGFydEluZGV4LCBpICsgMSlcblx0XHRcdFx0aWRzLnJldmVyc2UoKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWRzID0gW11cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgaSA9IHJhbmdlLmZpbmRJbmRleCgoaWQpID0+IGZpcnN0QmlnZ2VyVGhhblNlY29uZChpZCwgc3RhcnRFbGVtZW50SWQpKVxuXHRcdFx0aWRzID0gcmFuZ2Uuc2xpY2UoaSwgaSArIGNvdW50KVxuXHRcdH1cblx0XHRsZXQgcmVzdWx0OiBUW10gPSBbXVxuXHRcdGZvciAobGV0IGEgPSAwOyBhIDwgaWRzLmxlbmd0aDsgYSsrKSB7XG5cdFx0XHRyZXN1bHQucHVzaChjbG9uZShsaXN0Q2FjaGUuZWxlbWVudHMuZ2V0KGlkc1thXSkgYXMgVCkpXG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHRcblx0fVxuXG5cdGFzeW5jIHByb3ZpZGVNdWx0aXBsZTxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIGVsZW1lbnRJZHM6IElkW10pOiBQcm9taXNlPEFycmF5PFQ+PiB7XG5cdFx0Y29uc3QgbGlzdENhY2hlID0gdGhpcy5saXN0cy5nZXQodHlwZVJlZlRvUGF0aCh0eXBlUmVmKSk/LmdldChsaXN0SWQpXG5cblx0XHRjb25zdCB0eXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKVxuXHRcdGVsZW1lbnRJZHMgPSBlbGVtZW50SWRzLm1hcCgoZWwpID0+IGVuc3VyZUJhc2U2NEV4dCh0eXBlTW9kZWwsIGVsKSlcblxuXHRcdGlmIChsaXN0Q2FjaGUgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIFtdXG5cdFx0fVxuXHRcdGxldCByZXN1bHQ6IFRbXSA9IFtdXG5cdFx0Zm9yIChsZXQgYSA9IDA7IGEgPCBlbGVtZW50SWRzLmxlbmd0aDsgYSsrKSB7XG5cdFx0XHRyZXN1bHQucHVzaChjbG9uZShsaXN0Q2FjaGUuZWxlbWVudHMuZ2V0KGVsZW1lbnRJZHNbYV0pIGFzIFQpKVxuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0XG5cdH1cblxuXHRhc3luYyBnZXRSYW5nZUZvckxpc3Q8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkKTogUHJvbWlzZTx7IGxvd2VyOiBJZDsgdXBwZXI6IElkIH0gfCBudWxsPiB7XG5cdFx0Y29uc3QgbGlzdENhY2hlID0gdGhpcy5saXN0cy5nZXQodHlwZVJlZlRvUGF0aCh0eXBlUmVmKSk/LmdldChsaXN0SWQpXG5cblx0XHRpZiAobGlzdENhY2hlID09IG51bGwpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0Y29uc3QgdHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UodHlwZVJlZilcblx0XHRyZXR1cm4ge1xuXHRcdFx0bG93ZXI6IGN1c3RvbUlkVG9CYXNlNjRVcmwodHlwZU1vZGVsLCBsaXN0Q2FjaGUubG93ZXJSYW5nZUlkKSxcblx0XHRcdHVwcGVyOiBjdXN0b21JZFRvQmFzZTY0VXJsKHR5cGVNb2RlbCwgbGlzdENhY2hlLnVwcGVyUmFuZ2VJZCksXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgc2V0VXBwZXJSYW5nZUZvckxpc3Q8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkLCB1cHBlcklkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKHR5cGVSZWYpXG5cdFx0dXBwZXJJZCA9IGVuc3VyZUJhc2U2NEV4dCh0eXBlTW9kZWwsIHVwcGVySWQpXG5cdFx0Y29uc3QgbGlzdENhY2hlID0gdGhpcy5saXN0cy5nZXQodHlwZVJlZlRvUGF0aCh0eXBlUmVmKSk/LmdldChsaXN0SWQpXG5cdFx0aWYgKGxpc3RDYWNoZSA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJsaXN0IGRvZXMgbm90IGV4aXN0XCIpXG5cdFx0fVxuXHRcdGxpc3RDYWNoZS51cHBlclJhbmdlSWQgPSB1cHBlcklkXG5cdH1cblxuXHRhc3luYyBzZXRMb3dlclJhbmdlRm9yTGlzdDxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIGxvd2VySWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgdHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UodHlwZVJlZilcblx0XHRsb3dlcklkID0gZW5zdXJlQmFzZTY0RXh0KHR5cGVNb2RlbCwgbG93ZXJJZClcblx0XHRjb25zdCBsaXN0Q2FjaGUgPSB0aGlzLmxpc3RzLmdldCh0eXBlUmVmVG9QYXRoKHR5cGVSZWYpKT8uZ2V0KGxpc3RJZClcblx0XHRpZiAobGlzdENhY2hlID09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcImxpc3QgZG9lcyBub3QgZXhpc3RcIilcblx0XHR9XG5cdFx0bGlzdENhY2hlLmxvd2VyUmFuZ2VJZCA9IGxvd2VySWRcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgbmV3IGxpc3QgY2FjaGUgaWYgdGhlcmUgaXMgbm9uZS4gUmVzZXRzIGV2ZXJ5dGhpbmcgYnV0IGVsZW1lbnRzLlxuXHQgKiBAcGFyYW0gdHlwZVJlZlxuXHQgKiBAcGFyYW0gbGlzdElkXG5cdCAqIEBwYXJhbSBsb3dlclxuXHQgKiBAcGFyYW0gdXBwZXJcblx0ICovXG5cdGFzeW5jIHNldE5ld1JhbmdlRm9yTGlzdDxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIGxvd2VyOiBJZCwgdXBwZXI6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgdHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UodHlwZVJlZilcblx0XHRsb3dlciA9IGVuc3VyZUJhc2U2NEV4dCh0eXBlTW9kZWwsIGxvd2VyKVxuXHRcdHVwcGVyID0gZW5zdXJlQmFzZTY0RXh0KHR5cGVNb2RlbCwgdXBwZXIpXG5cblx0XHRjb25zdCBsaXN0Q2FjaGUgPSB0aGlzLmxpc3RzLmdldCh0eXBlUmVmVG9QYXRoKHR5cGVSZWYpKT8uZ2V0KGxpc3RJZClcblx0XHRpZiAobGlzdENhY2hlID09IG51bGwpIHtcblx0XHRcdGdldEZyb21NYXAodGhpcy5saXN0cywgdHlwZVJlZlRvUGF0aCh0eXBlUmVmKSwgKCkgPT4gbmV3IE1hcCgpKS5zZXQobGlzdElkLCB7XG5cdFx0XHRcdGFsbFJhbmdlOiBbXSxcblx0XHRcdFx0bG93ZXJSYW5nZUlkOiBsb3dlcixcblx0XHRcdFx0dXBwZXJSYW5nZUlkOiB1cHBlcixcblx0XHRcdFx0ZWxlbWVudHM6IG5ldyBNYXAoKSxcblx0XHRcdH0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdGxpc3RDYWNoZS5sb3dlclJhbmdlSWQgPSBsb3dlclxuXHRcdFx0bGlzdENhY2hlLnVwcGVyUmFuZ2VJZCA9IHVwcGVyXG5cdFx0XHRsaXN0Q2FjaGUuYWxsUmFuZ2UgPSBbXVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGdldElkc0luUmFuZ2U8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkKTogUHJvbWlzZTxBcnJheTxJZD4+IHtcblx0XHRjb25zdCB0eXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKVxuXHRcdHJldHVybiAoXG5cdFx0XHR0aGlzLmxpc3RzXG5cdFx0XHRcdC5nZXQodHlwZVJlZlRvUGF0aCh0eXBlUmVmKSlcblx0XHRcdFx0Py5nZXQobGlzdElkKVxuXHRcdFx0XHQ/LmFsbFJhbmdlLm1hcCgoZWxlbWVudElkKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIGN1c3RvbUlkVG9CYXNlNjRVcmwodHlwZU1vZGVsLCBlbGVtZW50SWQpXG5cdFx0XHRcdH0pID8/IFtdXG5cdFx0KVxuXHR9XG5cblx0YXN5bmMgZ2V0TGFzdEJhdGNoSWRGb3JHcm91cChncm91cElkOiBJZCk6IFByb21pc2U8SWQgfCBudWxsPiB7XG5cdFx0cmV0dXJuIHRoaXMubGFzdEJhdGNoSWRQZXJHcm91cC5nZXQoZ3JvdXBJZCkgPz8gbnVsbFxuXHR9XG5cblx0YXN5bmMgcHV0TGFzdEJhdGNoSWRGb3JHcm91cChncm91cElkOiBJZCwgYmF0Y2hJZDogSWQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxhc3RCYXRjaElkUGVyR3JvdXAuc2V0KGdyb3VwSWQsIGJhdGNoSWQpXG5cdH1cblxuXHRwdXJnZVN0b3JhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG5cdH1cblxuXHRhc3luYyBnZXRMYXN0VXBkYXRlVGltZSgpOiBQcm9taXNlPExhc3RVcGRhdGVUaW1lPiB7XG5cdFx0cmV0dXJuIHRoaXMubGFzdFVwZGF0ZVRpbWUgPyB7IHR5cGU6IFwicmVjb3JkZWRcIiwgdGltZTogdGhpcy5sYXN0VXBkYXRlVGltZSB9IDogeyB0eXBlOiBcIm5ldmVyXCIgfVxuXHR9XG5cblx0YXN5bmMgcHV0TGFzdFVwZGF0ZVRpbWUodmFsdWU6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubGFzdFVwZGF0ZVRpbWUgPSB2YWx1ZVxuXHR9XG5cblx0YXN5bmMgZ2V0V2hvbGVMaXN0PFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCk6IFByb21pc2U8QXJyYXk8VD4+IHtcblx0XHRjb25zdCBsaXN0Q2FjaGUgPSB0aGlzLmxpc3RzLmdldCh0eXBlUmVmVG9QYXRoKHR5cGVSZWYpKT8uZ2V0KGxpc3RJZClcblxuXHRcdGlmIChsaXN0Q2FjaGUgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIFtdXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGxpc3RDYWNoZS5hbGxSYW5nZS5tYXAoKGlkKSA9PiBjbG9uZShsaXN0Q2FjaGUuZWxlbWVudHMuZ2V0KGlkKSBhcyBUKSlcblx0fVxuXG5cdGdldEN1c3RvbUNhY2hlSGFuZGxlck1hcChlbnRpdHlSZXN0Q2xpZW50OiBFbnRpdHlSZXN0Q2xpZW50KTogQ3VzdG9tQ2FjaGVIYW5kbGVyTWFwIHtcblx0XHRyZXR1cm4gdGhpcy5jdXN0b21DYWNoZUhhbmRsZXJNYXBcblx0fVxuXG5cdGdldFVzZXJJZCgpOiBJZCB7XG5cdFx0cmV0dXJuIGFzc2VydE5vdE51bGwodGhpcy51c2VySWQsIFwiTm8gdXNlciBpZCwgbm90IGluaXRpYWxpemVkP1wiKVxuXHR9XG5cblx0YXN5bmMgZGVsZXRlQWxsT3duZWRCeShvd25lcjogSWQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRmb3IgKGNvbnN0IHR5cGVNYXAgb2YgdGhpcy5lbnRpdGllcy52YWx1ZXMoKSkge1xuXHRcdFx0Zm9yIChjb25zdCBbaWQsIGVudGl0eV0gb2YgdHlwZU1hcC5lbnRyaWVzKCkpIHtcblx0XHRcdFx0aWYgKGVudGl0eS5fb3duZXJHcm91cCA9PT0gb3duZXIpIHtcblx0XHRcdFx0XHR0eXBlTWFwLmRlbGV0ZShpZClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRmb3IgKGNvbnN0IGNhY2hlRm9yVHlwZSBvZiB0aGlzLmxpc3RzLnZhbHVlcygpKSB7XG5cdFx0XHR0aGlzLmRlbGV0ZUFsbE93bmVkQnlGcm9tQ2FjaGUoY2FjaGVGb3JUeXBlLCBvd25lcilcblx0XHR9XG5cdFx0Zm9yIChjb25zdCBjYWNoZUZvclR5cGUgb2YgdGhpcy5ibG9iRW50aXRpZXMudmFsdWVzKCkpIHtcblx0XHRcdHRoaXMuZGVsZXRlQWxsT3duZWRCeUZyb21DYWNoZShjYWNoZUZvclR5cGUsIG93bmVyKVxuXHRcdH1cblx0XHR0aGlzLmxhc3RCYXRjaElkUGVyR3JvdXAuZGVsZXRlKG93bmVyKVxuXHR9XG5cblx0YXN5bmMgZGVsZXRlV2hvbGVMaXN0PFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubGlzdHMuZ2V0KHR5cGVSZWYudHlwZSk/LmRlbGV0ZShsaXN0SWQpXG5cdH1cblxuXHRwcml2YXRlIGRlbGV0ZUFsbE93bmVkQnlGcm9tQ2FjaGUoY2FjaGVGb3JUeXBlOiBNYXA8SWQsIExpc3RDYWNoZSB8IEJsb2JFbGVtZW50Q2FjaGU+LCBvd25lcjogc3RyaW5nKSB7XG5cdFx0Ly8gSWYgd2UgZmluZCBhdCBsZWFzdCBvbmUgZWxlbWVudCBpbiB0aGUgbGlzdCB0aGF0IGlzIG93bmVkIGJ5IG91ciB0YXJnZXQgb3duZXIsIHdlIGRlbGV0ZSB0aGUgZW50aXJlIGxpc3QuXG5cdFx0Ly8gVGhpcyBpcyBPSyBpbiBtb3N0IGNhc2VzIGJlY2F1c2UgdGhlIHZhc3QgbWFqb3JpdHkgb2YgbGlzdHMgYXJlIHNpbmdsZSBvd25lci5cblx0XHQvLyBGb3IgdGhlIG90aGVyIGNhc2VzLCB3ZSBhcmUganVzdCBjbGVhcmluZyB0aGUgY2FjaGUgYSBiaXQgc29vbmVyIHRoYW4gbmVlZGVkLlxuXHRcdGNvbnN0IGxpc3RJZHNUb0RlbGV0ZTogc3RyaW5nW10gPSBbXVxuXHRcdGZvciAoY29uc3QgW2xpc3RJZCwgbGlzdENhY2hlXSBvZiBjYWNoZUZvclR5cGUuZW50cmllcygpKSB7XG5cdFx0XHRmb3IgKGNvbnN0IFtpZCwgZWxlbWVudF0gb2YgbGlzdENhY2hlLmVsZW1lbnRzLmVudHJpZXMoKSkge1xuXHRcdFx0XHRpZiAoZWxlbWVudC5fb3duZXJHcm91cCA9PT0gb3duZXIpIHtcblx0XHRcdFx0XHRsaXN0SWRzVG9EZWxldGUucHVzaChsaXN0SWQpXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRmb3IgKGNvbnN0IGxpc3RJZCBvZiBsaXN0SWRzVG9EZWxldGUpIHtcblx0XHRcdGNhY2hlRm9yVHlwZS5kZWxldGUobGlzdElkKVxuXHRcdH1cblx0fVxuXG5cdGNsZWFyRXhjbHVkZWREYXRhKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHR9XG5cblx0LyoqXG5cdCAqIFdlIHdhbnQgdG8gbG9jayB0aGUgYWNjZXNzIHRvIHRoZSBcInJhbmdlc1wiIGRiIHdoZW4gdXBkYXRpbmcgLyByZWFkaW5nIHRoZVxuXHQgKiBvZmZsaW5lIGF2YWlsYWJsZSBtYWlsIGxpc3QgcmFuZ2VzIGZvciBlYWNoIG1haWwgbGlzdCAocmVmZXJlbmNlZCB1c2luZyB0aGUgbGlzdElkKVxuXHQgKiBAcGFyYW0gbGlzdElkIHRoZSBtYWlsIGxpc3QgdGhhdCB3ZSB3YW50IHRvIGxvY2tcblx0ICovXG5cdGxvY2tSYW5nZXNEYkFjY2VzcyhsaXN0SWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHR9XG5cblx0LyoqXG5cdCAqIFRoaXMgaXMgdGhlIGNvdW50ZXJwYXJ0IHRvIHRoZSBmdW5jdGlvbiBcImxvY2tSYW5nZXNEYkFjY2VzcyhsaXN0SWQpXCJcblx0ICogQHBhcmFtIGxpc3RJZCB0aGUgbWFpbCBsaXN0IHRoYXQgd2Ugd2FudCB0byB1bmxvY2tcblx0ICovXG5cdHVubG9ja1Jhbmdlc0RiQWNjZXNzKGxpc3RJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG5cdH1cbn1cbiIsImltcG9ydCB7IENhY2hlU3RvcmFnZSwgTGFzdFVwZGF0ZVRpbWUsIFJhbmdlIH0gZnJvbSBcIi4vRGVmYXVsdEVudGl0eVJlc3RDYWNoZS5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yXCJcbmltcG9ydCB7IExpc3RFbGVtZW50RW50aXR5LCBTb21lRW50aXR5IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnRpdHlUeXBlc1wiXG5pbXBvcnQgeyBUeXBlUmVmIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSwgT2ZmbGluZVN0b3JhZ2VJbml0QXJncyB9IGZyb20gXCIuLi9vZmZsaW5lL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IEVwaGVtZXJhbENhY2hlU3RvcmFnZSwgRXBoZW1lcmFsU3RvcmFnZUluaXRBcmdzIH0gZnJvbSBcIi4vRXBoZW1lcmFsQ2FjaGVTdG9yYWdlXCJcbmltcG9ydCB7IEVudGl0eVJlc3RDbGllbnQgfSBmcm9tIFwiLi9FbnRpdHlSZXN0Q2xpZW50LmpzXCJcbmltcG9ydCB7IEN1c3RvbUNhY2hlSGFuZGxlck1hcCB9IGZyb20gXCIuL0N1c3RvbUNhY2hlSGFuZGxlci5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgRXBoZW1lcmFsU3RvcmFnZUFyZ3MgZXh0ZW5kcyBFcGhlbWVyYWxTdG9yYWdlSW5pdEFyZ3Mge1xuXHR0eXBlOiBcImVwaGVtZXJhbFwiXG59XG5cbmV4cG9ydCB0eXBlIE9mZmxpbmVTdG9yYWdlQXJncyA9IE9mZmxpbmVTdG9yYWdlSW5pdEFyZ3MgJiB7XG5cdHR5cGU6IFwib2ZmbGluZVwiXG59XG5cbmludGVyZmFjZSBDYWNoZVN0b3JhZ2VJbml0UmV0dXJuIHtcblx0LyoqIElmIHRoZSBjcmVhdGVkIHN0b3JhZ2UgaXMgYW4gT2ZmbGluZVN0b3JhZ2UgKi9cblx0aXNQZXJzaXN0ZW50OiBib29sZWFuXG5cdC8qKiBJZiBhIE9mZmxpbmVTdG9yYWdlIHdhcyBjcmVhdGVkLCB3aGV0aGVyIG9yIG5vdCB0aGUgYmFja2luZyBkYXRhYmFzZSB3YXMgY3JlYXRlZCBmcmVzaCBvciBhbHJlYWR5IGV4aXN0ZWQgKi9cblx0aXNOZXdPZmZsaW5lRGI6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGludGVyZmFjZSBDYWNoZVN0b3JhZ2VMYXRlSW5pdGlhbGl6ZXIge1xuXHRpbml0aWFsaXplKGFyZ3M6IE9mZmxpbmVTdG9yYWdlQXJncyB8IEVwaGVtZXJhbFN0b3JhZ2VBcmdzKTogUHJvbWlzZTxDYWNoZVN0b3JhZ2VJbml0UmV0dXJuPlxuXG5cdGRlSW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+XG59XG5cbnR5cGUgU29tZVN0b3JhZ2UgPSBPZmZsaW5lU3RvcmFnZSB8IEVwaGVtZXJhbENhY2hlU3RvcmFnZVxuXG4vKipcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IHNvIHRoYXQgd2UgY2FuIHJlbGVhc2Ugb2ZmbGluZSBzdG9yYWdlIG1vZGUgd2l0aG91dCBoYXZpbmcgdG8gcmV3cml0ZSB0aGUgY3JlZGVudGlhbHMgaGFuZGxpbmcgc3lzdGVtLiBTaW5jZSBpdCdzIHBvc3NpYmxlIHRoYXRcbiAqIGEgZGVza3RvcCB1c2VyIG1pZ2h0IG5vdCB1c2UgYSBwZXJzaXN0ZW50IHNlc3Npb24sIGFuZCB3ZSB3b24ndCBrbm93IHVudGlsIHRoZXkgdHJ5IHRvIGxvZyBpbiwgd2UgY2FuIG9ubHkgZGVjaWRlIHdoYXQga2luZCBvZiBjYWNoZSBzdG9yYWdlIHRvIHVzZSBhdCBsb2dpblxuICogVGhpcyBpbXBsZW1lbnRhdGlvbiBhbGxvd3MgdXMgdG8gYXZvaWQgbW9kaWZ5aW5nIHRvbyBtdWNoIG9mIHRoZSB3b3JrZXIgcHVibGljIEFQSS4gT25jZSB3ZSBtYWtlIHRoaXMgb2Jzb2xldGUsIGFsbCB3ZSB3aWxsIGhhdmUgdG8gZG8gaXNcbiAqIHJlbW92ZSB0aGUgaW5pdGlhbGl6ZSBwYXJhbWV0ZXIgZnJvbSB0aGUgTG9naW5GYWNhZGUsIGFuZCB0aWR5IHVwIHRoZSBXb3JrZXJMb2NhdG9yIGluaXRcbiAqXG4gKiBDcmVhdGUgYSBwcm94eSB0byBhIGNhY2hlIHN0b3JhZ2Ugb2JqZWN0LlxuICogSXQgd2lsbCBiZSB1bmluaXRpYWxpemVkLCBhbmQgdW51c2FibGUgdW50aWwge0BtZXRob2QgQ2FjaGVTdG9yYWdlTGF0ZUluaXRpYWxpemVyLmluaXRpYWxpemVDYWNoZVN0b3JhZ2V9IGhhcyBiZWVuIGNhbGxlZCBvbiB0aGUgcmV0dXJuZWQgb2JqZWN0XG4gKiBPbmNlIGl0IGlzIGluaXRpYWxpemVkLCB0aGVuIGl0IGlzIHNhZmUgdG8gdXNlXG4gKiBAcGFyYW0gZmFjdG9yeSBBIGZhY3RvcnkgZnVuY3Rpb24gdG8gZ2V0IGEgQ2FjaGVTdG9yYWdlIGltcGxlbWVudGF0aW9uIHdoZW4gaW5pdGlhbGl6ZSBpcyBjYWxsZWRcbiAqIEByZXR1cm4ge0NhY2hlU3RvcmFnZUxhdGVJbml0aWFsaXplcn0gVGhlIHVuaW5pdGlhbGl6ZWQgcHJveHkgYW5kIGEgZnVuY3Rpb24gdG8gaW5pdGlhbGl6ZSBpdFxuICovXG5leHBvcnQgY2xhc3MgTGF0ZUluaXRpYWxpemVkQ2FjaGVTdG9yYWdlSW1wbCBpbXBsZW1lbnRzIENhY2hlU3RvcmFnZUxhdGVJbml0aWFsaXplciwgQ2FjaGVTdG9yYWdlIHtcblx0cHJpdmF0ZSBfaW5uZXI6IFNvbWVTdG9yYWdlIHwgbnVsbCA9IG51bGxcblxuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHNlbmRFcnJvcjogKGVycm9yOiBFcnJvcikgPT4gUHJvbWlzZTx2b2lkPiwgcHJpdmF0ZSByZWFkb25seSBvZmZsaW5lU3RvcmFnZVByb3ZpZGVyOiAoKSA9PiBQcm9taXNlPG51bGwgfCBPZmZsaW5lU3RvcmFnZT4pIHt9XG5cblx0cHJpdmF0ZSBnZXQgaW5uZXIoKTogQ2FjaGVTdG9yYWdlIHtcblx0XHRpZiAodGhpcy5faW5uZXIgPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJDYWNoZSBzdG9yYWdlIGlzIG5vdCBpbml0aWFsaXplZFwiKVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLl9pbm5lclxuXHR9XG5cblx0YXN5bmMgaW5pdGlhbGl6ZShhcmdzOiBPZmZsaW5lU3RvcmFnZUFyZ3MgfCBFcGhlbWVyYWxTdG9yYWdlQXJncyk6IFByb21pc2U8Q2FjaGVTdG9yYWdlSW5pdFJldHVybj4ge1xuXHRcdC8vIFdlIG1pZ2h0IGNhbGwgdGhpcyBtdWx0aXBsZSB0aW1lcy5cblx0XHQvLyBUaGlzIGhhcHBlbnMgd2hlbiBwZXJzaXN0ZW50IGNyZWRlbnRpYWxzIGxvZ2luIGZhaWxzIGFuZCB3ZSBuZWVkIHRvIHN0YXJ0IHdpdGggbmV3IGNhY2hlIGZvciBuZXcgbG9naW4uXG5cdFx0Y29uc3QgeyBzdG9yYWdlLCBpc1BlcnNpc3RlbnQsIGlzTmV3T2ZmbGluZURiIH0gPSBhd2FpdCB0aGlzLmdldFN0b3JhZ2UoYXJncylcblx0XHR0aGlzLl9pbm5lciA9IHN0b3JhZ2Vcblx0XHRyZXR1cm4ge1xuXHRcdFx0aXNQZXJzaXN0ZW50LFxuXHRcdFx0aXNOZXdPZmZsaW5lRGIsXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgZGVJbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMuX2lubmVyPy5kZWluaXQoKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBnZXRTdG9yYWdlKFxuXHRcdGFyZ3M6IE9mZmxpbmVTdG9yYWdlQXJncyB8IEVwaGVtZXJhbFN0b3JhZ2VBcmdzLFxuXHQpOiBQcm9taXNlPHsgc3RvcmFnZTogU29tZVN0b3JhZ2U7IGlzUGVyc2lzdGVudDogYm9vbGVhbjsgaXNOZXdPZmZsaW5lRGI6IGJvb2xlYW4gfT4ge1xuXHRcdGlmIChhcmdzLnR5cGUgPT09IFwib2ZmbGluZVwiKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCBzdG9yYWdlID0gYXdhaXQgdGhpcy5vZmZsaW5lU3RvcmFnZVByb3ZpZGVyKClcblx0XHRcdFx0aWYgKHN0b3JhZ2UgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGNvbnN0IGlzTmV3T2ZmbGluZURiID0gYXdhaXQgc3RvcmFnZS5pbml0KGFyZ3MpXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHN0b3JhZ2UsXG5cdFx0XHRcdFx0XHRpc1BlcnNpc3RlbnQ6IHRydWUsXG5cdFx0XHRcdFx0XHRpc05ld09mZmxpbmVEYixcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0Ly8gUHJlY2F1dGlvbiBpbiBjYXNlIHNvbWV0aGluZyBiYWQgaGFwcGVucyB0byBvZmZsaW5lIGRhdGFiYXNlLiBXZSB3YW50IHVzZXJzIHRvIHN0aWxsIGJlIGFibGUgdG8gbG9nIGluLlxuXHRcdFx0XHRjb25zb2xlLmVycm9yKFwiRXJyb3Igd2hpbGUgaW5pdGlhbGl6aW5nIG9mZmxpbmUgY2FjaGUgc3RvcmFnZVwiLCBlKVxuXHRcdFx0XHR0aGlzLnNlbmRFcnJvcihlKVxuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBib3RoIFwiZWxzZVwiIGNhc2UgYW5kIGZhbGxiYWNrIGZvciB1bmF2YWlsYWJsZSBzdG9yYWdlIGFuZCBlcnJvciBjYXNlc1xuXHRcdGNvbnN0IHN0b3JhZ2UgPSBuZXcgRXBoZW1lcmFsQ2FjaGVTdG9yYWdlKClcblx0XHRhd2FpdCBzdG9yYWdlLmluaXQoYXJncylcblx0XHRyZXR1cm4ge1xuXHRcdFx0c3RvcmFnZSxcblx0XHRcdGlzUGVyc2lzdGVudDogZmFsc2UsXG5cdFx0XHRpc05ld09mZmxpbmVEYjogZmFsc2UsXG5cdFx0fVxuXHR9XG5cblx0ZGVsZXRlSWZFeGlzdHM8VCBleHRlbmRzIFNvbWVFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQgfCBudWxsLCBpZDogSWQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gdGhpcy5pbm5lci5kZWxldGVJZkV4aXN0cyh0eXBlUmVmLCBsaXN0SWQsIGlkKVxuXHR9XG5cblx0Z2V0PFQgZXh0ZW5kcyBTb21lRW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkIHwgbnVsbCwgaWQ6IElkKTogUHJvbWlzZTxUIHwgbnVsbD4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLmdldCh0eXBlUmVmLCBsaXN0SWQsIGlkKVxuXHR9XG5cblx0Z2V0SWRzSW5SYW5nZTxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQpOiBQcm9taXNlPEFycmF5PElkPj4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLmdldElkc0luUmFuZ2UodHlwZVJlZiwgbGlzdElkKVxuXHR9XG5cblx0Z2V0TGFzdEJhdGNoSWRGb3JHcm91cChncm91cElkOiBJZCk6IFByb21pc2U8SWQgfCBudWxsPiB7XG5cdFx0cmV0dXJuIHRoaXMuaW5uZXIuZ2V0TGFzdEJhdGNoSWRGb3JHcm91cChncm91cElkKVxuXHR9XG5cblx0YXN5bmMgZ2V0TGFzdFVwZGF0ZVRpbWUoKTogUHJvbWlzZTxMYXN0VXBkYXRlVGltZT4ge1xuXHRcdHJldHVybiB0aGlzLl9pbm5lciA/IHRoaXMuaW5uZXIuZ2V0TGFzdFVwZGF0ZVRpbWUoKSA6IHsgdHlwZTogXCJ1bmluaXRpYWxpemVkXCIgfVxuXHR9XG5cblx0Z2V0UmFuZ2VGb3JMaXN0PFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCk6IFByb21pc2U8UmFuZ2UgfCBudWxsPiB7XG5cdFx0cmV0dXJuIHRoaXMuaW5uZXIuZ2V0UmFuZ2VGb3JMaXN0KHR5cGVSZWYsIGxpc3RJZClcblx0fVxuXG5cdGlzRWxlbWVudElkSW5DYWNoZVJhbmdlPFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCwgaWQ6IElkKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0cmV0dXJuIHRoaXMuaW5uZXIuaXNFbGVtZW50SWRJbkNhY2hlUmFuZ2UodHlwZVJlZiwgbGlzdElkLCBpZClcblx0fVxuXG5cdHByb3ZpZGVGcm9tUmFuZ2U8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkLCBzdGFydDogSWQsIGNvdW50OiBudW1iZXIsIHJldmVyc2U6IGJvb2xlYW4pOiBQcm9taXNlPFRbXT4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLnByb3ZpZGVGcm9tUmFuZ2UodHlwZVJlZiwgbGlzdElkLCBzdGFydCwgY291bnQsIHJldmVyc2UpXG5cdH1cblxuXHRwcm92aWRlTXVsdGlwbGU8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IHN0cmluZywgZWxlbWVudElkczogc3RyaW5nW10pOiBQcm9taXNlPFRbXT4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLnByb3ZpZGVNdWx0aXBsZSh0eXBlUmVmLCBsaXN0SWQsIGVsZW1lbnRJZHMpXG5cdH1cblxuXHRnZXRXaG9sZUxpc3Q8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkKTogUHJvbWlzZTxBcnJheTxUPj4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLmdldFdob2xlTGlzdCh0eXBlUmVmLCBsaXN0SWQpXG5cdH1cblxuXHRwdXJnZVN0b3JhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMuaW5uZXIucHVyZ2VTdG9yYWdlKClcblx0fVxuXG5cdHB1dChvcmlnaW5hbEVudGl0eTogU29tZUVudGl0eSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLnB1dChvcmlnaW5hbEVudGl0eSlcblx0fVxuXG5cdHB1dExhc3RCYXRjaElkRm9yR3JvdXAoZ3JvdXBJZDogSWQsIGJhdGNoSWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMuaW5uZXIucHV0TGFzdEJhdGNoSWRGb3JHcm91cChncm91cElkLCBiYXRjaElkKVxuXHR9XG5cblx0cHV0TGFzdFVwZGF0ZVRpbWUodmFsdWU6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLnB1dExhc3RVcGRhdGVUaW1lKHZhbHVlKVxuXHR9XG5cblx0c2V0TG93ZXJSYW5nZUZvckxpc3Q8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkLCBpZDogSWQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gdGhpcy5pbm5lci5zZXRMb3dlclJhbmdlRm9yTGlzdCh0eXBlUmVmLCBsaXN0SWQsIGlkKVxuXHR9XG5cblx0c2V0TmV3UmFuZ2VGb3JMaXN0PFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCwgbG93ZXI6IElkLCB1cHBlcjogSWQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gdGhpcy5pbm5lci5zZXROZXdSYW5nZUZvckxpc3QodHlwZVJlZiwgbGlzdElkLCBsb3dlciwgdXBwZXIpXG5cdH1cblxuXHRzZXRVcHBlclJhbmdlRm9yTGlzdDxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIGlkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLnNldFVwcGVyUmFuZ2VGb3JMaXN0KHR5cGVSZWYsIGxpc3RJZCwgaWQpXG5cdH1cblxuXHRnZXRDdXN0b21DYWNoZUhhbmRsZXJNYXAoZW50aXR5UmVzdENsaWVudDogRW50aXR5UmVzdENsaWVudCk6IEN1c3RvbUNhY2hlSGFuZGxlck1hcCB7XG5cdFx0cmV0dXJuIHRoaXMuaW5uZXIuZ2V0Q3VzdG9tQ2FjaGVIYW5kbGVyTWFwKGVudGl0eVJlc3RDbGllbnQpXG5cdH1cblxuXHRnZXRVc2VySWQoKTogSWQge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLmdldFVzZXJJZCgpXG5cdH1cblxuXHRhc3luYyBkZWxldGVBbGxPd25lZEJ5KG93bmVyOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLmRlbGV0ZUFsbE93bmVkQnkob3duZXIpXG5cdH1cblxuXHRhc3luYyBkZWxldGVXaG9sZUxpc3Q8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMuaW5uZXIuZGVsZXRlV2hvbGVMaXN0KHR5cGVSZWYsIGxpc3RJZClcblx0fVxuXG5cdGNsZWFyRXhjbHVkZWREYXRhKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLmNsZWFyRXhjbHVkZWREYXRhKClcblx0fVxuXG5cdC8qKlxuXHQgKiBXZSB3YW50IHRvIGxvY2sgdGhlIGFjY2VzcyB0byB0aGUgXCJyYW5nZXNcIiBkYiB3aGVuIHVwZGF0aW5nIC8gcmVhZGluZyB0aGVcblx0ICogb2ZmbGluZSBhdmFpbGFibGUgbWFpbCBsaXN0IHJhbmdlcyBmb3IgZWFjaCBtYWlsIGxpc3QgKHJlZmVyZW5jZWQgdXNpbmcgdGhlIGxpc3RJZClcblx0ICogQHBhcmFtIGxpc3RJZCB0aGUgbWFpbCBsaXN0IHRoYXQgd2Ugd2FudCB0byBsb2NrXG5cdCAqL1xuXHRsb2NrUmFuZ2VzRGJBY2Nlc3MobGlzdElkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLmxvY2tSYW5nZXNEYkFjY2VzcyhsaXN0SWQpXG5cdH1cblxuXHQvKipcblx0ICogVGhpcyBpcyB0aGUgY291bnRlcnBhcnQgdG8gdGhlIGZ1bmN0aW9uIFwibG9ja1Jhbmdlc0RiQWNjZXNzKGxpc3RJZClcIlxuXHQgKiBAcGFyYW0gbGlzdElkIHRoZSBtYWlsIGxpc3QgdGhhdCB3ZSB3YW50IHRvIHVubG9ja1xuXHQgKi9cblx0dW5sb2NrUmFuZ2VzRGJBY2Nlc3MobGlzdElkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmlubmVyLnVubG9ja1Jhbmdlc0RiQWNjZXNzKGxpc3RJZClcblx0fVxufVxuIiwiaW1wb3J0IHsgSHR0cE1ldGhvZCwgTWVkaWFUeXBlLCByZXNvbHZlVHlwZVJlZmVyZW5jZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5RnVuY3Rpb25zXCJcbmltcG9ydCB7XG5cdERlbGV0ZVNlcnZpY2UsXG5cdEV4dHJhU2VydmljZVBhcmFtcyxcblx0R2V0U2VydmljZSxcblx0SVNlcnZpY2VFeGVjdXRvcixcblx0TWV0aG9kRGVmaW5pdGlvbixcblx0UGFyYW1UeXBlRnJvbVJlZixcblx0UG9zdFNlcnZpY2UsXG5cdFB1dFNlcnZpY2UsXG5cdFJldHVyblR5cGVGcm9tUmVmLFxufSBmcm9tIFwiLi4vLi4vY29tbW9uL1NlcnZpY2VSZXF1ZXN0LmpzXCJcbmltcG9ydCB7IEVudGl0eSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5VHlwZXNcIlxuaW1wb3J0IHsgaXNTYW1lVHlwZVJlZiwgbGF6eSwgVHlwZVJlZiB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgUmVzdENsaWVudCB9IGZyb20gXCIuL1Jlc3RDbGllbnRcIlxuaW1wb3J0IHsgSW5zdGFuY2VNYXBwZXIgfSBmcm9tIFwiLi4vY3J5cHRvL0luc3RhbmNlTWFwcGVyXCJcbmltcG9ydCB7IENyeXB0b0ZhY2FkZSB9IGZyb20gXCIuLi9jcnlwdG8vQ3J5cHRvRmFjYWRlXCJcbmltcG9ydCB7IGFzc2VydFdvcmtlck9yTm9kZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW52XCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3JcIlxuaW1wb3J0IHsgQXV0aERhdGFQcm92aWRlciB9IGZyb20gXCIuLi9mYWNhZGVzL1VzZXJGYWNhZGVcIlxuaW1wb3J0IHsgTG9naW5JbmNvbXBsZXRlRXJyb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2Vycm9yL0xvZ2luSW5jb21wbGV0ZUVycm9yLmpzXCJcblxuYXNzZXJ0V29ya2VyT3JOb2RlKClcblxudHlwZSBBbnlTZXJ2aWNlID0gR2V0U2VydmljZSB8IFBvc3RTZXJ2aWNlIHwgUHV0U2VydmljZSB8IERlbGV0ZVNlcnZpY2VcblxuZXhwb3J0IGNsYXNzIFNlcnZpY2VFeGVjdXRvciBpbXBsZW1lbnRzIElTZXJ2aWNlRXhlY3V0b3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IHJlc3RDbGllbnQ6IFJlc3RDbGllbnQsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBhdXRoRGF0YVByb3ZpZGVyOiBBdXRoRGF0YVByb3ZpZGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgaW5zdGFuY2VNYXBwZXI6IEluc3RhbmNlTWFwcGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY3J5cHRvRmFjYWRlOiBsYXp5PENyeXB0b0ZhY2FkZT4sXG5cdCkge31cblxuXHRnZXQ8UyBleHRlbmRzIEdldFNlcnZpY2U+KFxuXHRcdHNlcnZpY2U6IFMsXG5cdFx0ZGF0YTogUGFyYW1UeXBlRnJvbVJlZjxTW1wiZ2V0XCJdW1wiZGF0YVwiXT4sXG5cdFx0cGFyYW1zPzogRXh0cmFTZXJ2aWNlUGFyYW1zLFxuXHQpOiBQcm9taXNlPFJldHVyblR5cGVGcm9tUmVmPFNbXCJnZXRcIl1bXCJyZXR1cm5cIl0+PiB7XG5cdFx0cmV0dXJuIHRoaXMuZXhlY3V0ZVNlcnZpY2VSZXF1ZXN0KHNlcnZpY2UsIEh0dHBNZXRob2QuR0VULCBkYXRhLCBwYXJhbXMpXG5cdH1cblxuXHRwb3N0PFMgZXh0ZW5kcyBQb3N0U2VydmljZT4oXG5cdFx0c2VydmljZTogUyxcblx0XHRkYXRhOiBQYXJhbVR5cGVGcm9tUmVmPFNbXCJwb3N0XCJdW1wiZGF0YVwiXT4sXG5cdFx0cGFyYW1zPzogRXh0cmFTZXJ2aWNlUGFyYW1zLFxuXHQpOiBQcm9taXNlPFJldHVyblR5cGVGcm9tUmVmPFNbXCJwb3N0XCJdW1wicmV0dXJuXCJdPj4ge1xuXHRcdHJldHVybiB0aGlzLmV4ZWN1dGVTZXJ2aWNlUmVxdWVzdChzZXJ2aWNlLCBIdHRwTWV0aG9kLlBPU1QsIGRhdGEsIHBhcmFtcylcblx0fVxuXG5cdHB1dDxTIGV4dGVuZHMgUHV0U2VydmljZT4oXG5cdFx0c2VydmljZTogUyxcblx0XHRkYXRhOiBQYXJhbVR5cGVGcm9tUmVmPFNbXCJwdXRcIl1bXCJkYXRhXCJdPixcblx0XHRwYXJhbXM/OiBFeHRyYVNlcnZpY2VQYXJhbXMsXG5cdCk6IFByb21pc2U8UmV0dXJuVHlwZUZyb21SZWY8U1tcInB1dFwiXVtcInJldHVyblwiXT4+IHtcblx0XHRyZXR1cm4gdGhpcy5leGVjdXRlU2VydmljZVJlcXVlc3Qoc2VydmljZSwgSHR0cE1ldGhvZC5QVVQsIGRhdGEsIHBhcmFtcylcblx0fVxuXG5cdGRlbGV0ZTxTIGV4dGVuZHMgRGVsZXRlU2VydmljZT4oXG5cdFx0c2VydmljZTogUyxcblx0XHRkYXRhOiBQYXJhbVR5cGVGcm9tUmVmPFNbXCJkZWxldGVcIl1bXCJkYXRhXCJdPixcblx0XHRwYXJhbXM/OiBFeHRyYVNlcnZpY2VQYXJhbXMsXG5cdCk6IFByb21pc2U8UmV0dXJuVHlwZUZyb21SZWY8U1tcImRlbGV0ZVwiXVtcInJldHVyblwiXT4+IHtcblx0XHRyZXR1cm4gdGhpcy5leGVjdXRlU2VydmljZVJlcXVlc3Qoc2VydmljZSwgSHR0cE1ldGhvZC5ERUxFVEUsIGRhdGEsIHBhcmFtcylcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZXhlY3V0ZVNlcnZpY2VSZXF1ZXN0KFxuXHRcdHNlcnZpY2U6IEFueVNlcnZpY2UsXG5cdFx0bWV0aG9kOiBIdHRwTWV0aG9kLFxuXHRcdHJlcXVlc3RFbnRpdHk6IEVudGl0eSB8IG51bGwsXG5cdFx0cGFyYW1zOiBFeHRyYVNlcnZpY2VQYXJhbXMgfCB1bmRlZmluZWQsXG5cdCk6IFByb21pc2U8YW55PiB7XG5cdFx0Y29uc3QgbWV0aG9kRGVmaW5pdGlvbiA9IHRoaXMuZ2V0TWV0aG9kRGVmaW5pdGlvbihzZXJ2aWNlLCBtZXRob2QpXG5cdFx0aWYgKFxuXHRcdFx0bWV0aG9kRGVmaW5pdGlvbi5yZXR1cm4gJiZcblx0XHRcdHBhcmFtcz8uc2Vzc2lvbktleSA9PSBudWxsICYmXG5cdFx0XHQoYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UobWV0aG9kRGVmaW5pdGlvbi5yZXR1cm4pKS5lbmNyeXB0ZWQgJiZcblx0XHRcdCF0aGlzLmF1dGhEYXRhUHJvdmlkZXIuaXNGdWxseUxvZ2dlZEluKClcblx0XHQpIHtcblx0XHRcdC8vIFNob3J0LWNpcmN1aXQgYmVmb3JlIHdlIGRvIGFuIGFjdHVhbCByZXF1ZXN0IHdoaWNoIHdlIGNhbid0IGRlY3J5cHRcblx0XHRcdC8vIElmIHdlIGhhdmUgYSBzZXNzaW9uIGtleSBwYXNzZWQgaXQgZG9lc24ndCBtZWFuIHRoYXQgaXQgaXMgZm9yIHRoZSByZXR1cm4gdHlwZSBidXQgaXQgaXMgbGlrZWx5XG5cdFx0XHQvLyBzbyB3ZSBhbGxvdyB0aGUgcmVxdWVzdC5cblx0XHRcdHRocm93IG5ldyBMb2dpbkluY29tcGxldGVFcnJvcihgVHJpZWQgdG8gbWFrZSBzZXJ2aWNlIHJlcXVlc3Qgd2l0aCBlbmNyeXB0ZWQgcmV0dXJuIHR5cGUgYnV0IGlzIG5vdCBmdWxseSBsb2dnZWQgaW4geWV0LCBzZXJ2aWNlOiAke3NlcnZpY2UubmFtZX1gKVxuXHRcdH1cblxuXHRcdGNvbnN0IG1vZGVsVmVyc2lvbiA9IGF3YWl0IHRoaXMuZ2V0TW9kZWxWZXJzaW9uKG1ldGhvZERlZmluaXRpb24pXG5cblx0XHRjb25zdCBwYXRoID0gYC9yZXN0LyR7c2VydmljZS5hcHAudG9Mb3dlckNhc2UoKX0vJHtzZXJ2aWNlLm5hbWUudG9Mb3dlckNhc2UoKX1gXG5cdFx0Y29uc3QgaGVhZGVycyA9IHsgLi4udGhpcy5hdXRoRGF0YVByb3ZpZGVyLmNyZWF0ZUF1dGhIZWFkZXJzKCksIC4uLnBhcmFtcz8uZXh0cmFIZWFkZXJzLCB2OiBtb2RlbFZlcnNpb24gfVxuXG5cdFx0Y29uc3QgZW5jcnlwdGVkRW50aXR5ID0gYXdhaXQgdGhpcy5lbmNyeXB0RGF0YUlmTmVlZGVkKG1ldGhvZERlZmluaXRpb24sIHJlcXVlc3RFbnRpdHksIHNlcnZpY2UsIG1ldGhvZCwgcGFyYW1zID8/IG51bGwpXG5cblx0XHRjb25zdCBkYXRhOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBhd2FpdCB0aGlzLnJlc3RDbGllbnQucmVxdWVzdChwYXRoLCBtZXRob2QsIHtcblx0XHRcdHF1ZXJ5UGFyYW1zOiBwYXJhbXM/LnF1ZXJ5UGFyYW1zLFxuXHRcdFx0aGVhZGVycyxcblx0XHRcdHJlc3BvbnNlVHlwZTogTWVkaWFUeXBlLkpzb24sXG5cdFx0XHRib2R5OiBlbmNyeXB0ZWRFbnRpdHkgPz8gdW5kZWZpbmVkLFxuXHRcdFx0c3VzcGVuc2lvbkJlaGF2aW9yOiBwYXJhbXM/LnN1c3BlbnNpb25CZWhhdmlvcixcblx0XHRcdGJhc2VVcmw6IHBhcmFtcz8uYmFzZVVybCxcblx0XHR9KVxuXG5cdFx0aWYgKG1ldGhvZERlZmluaXRpb24ucmV0dXJuKSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5kZWNyeXB0UmVzcG9uc2UobWV0aG9kRGVmaW5pdGlvbi5yZXR1cm4sIGRhdGEgYXMgc3RyaW5nLCBwYXJhbXMpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRNZXRob2REZWZpbml0aW9uKHNlcnZpY2U6IEFueVNlcnZpY2UsIG1ldGhvZDogSHR0cE1ldGhvZCk6IE1ldGhvZERlZmluaXRpb24ge1xuXHRcdHN3aXRjaCAobWV0aG9kKSB7XG5cdFx0XHRjYXNlIEh0dHBNZXRob2QuR0VUOlxuXHRcdFx0XHRyZXR1cm4gKHNlcnZpY2UgYXMgR2V0U2VydmljZSlbXCJnZXRcIl1cblx0XHRcdGNhc2UgSHR0cE1ldGhvZC5QT1NUOlxuXHRcdFx0XHRyZXR1cm4gKHNlcnZpY2UgYXMgUG9zdFNlcnZpY2UpW1wicG9zdFwiXVxuXHRcdFx0Y2FzZSBIdHRwTWV0aG9kLlBVVDpcblx0XHRcdFx0cmV0dXJuIChzZXJ2aWNlIGFzIFB1dFNlcnZpY2UpW1wicHV0XCJdXG5cdFx0XHRjYXNlIEh0dHBNZXRob2QuREVMRVRFOlxuXHRcdFx0XHRyZXR1cm4gKHNlcnZpY2UgYXMgRGVsZXRlU2VydmljZSlbXCJkZWxldGVcIl1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGdldE1vZGVsVmVyc2lvbihtZXRob2REZWZpbml0aW9uOiBNZXRob2REZWZpbml0aW9uKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHQvLyBUaGlzIGlzIHNvbWUga2luZCBvZiBhIGhhY2sgYmVjYXVzZSB3ZSBkb24ndCBnZW5lcmF0ZSBkYXRhIGZvciB0aGUgd2hvbGUgbW9kZWwgYW55d2hlcmUgKHVuZm9ydHVuYXRlbHkpLlxuXHRcdGNvbnN0IHNvbWVUeXBlUmVmID0gbWV0aG9kRGVmaW5pdGlvbi5kYXRhID8/IG1ldGhvZERlZmluaXRpb24ucmV0dXJuXG5cdFx0aWYgKHNvbWVUeXBlUmVmID09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwiTmVlZCBlaXRoZXIgZGF0YSBvciByZXR1cm4gZm9yIHRoZSBzZXJ2aWNlIG1ldGhvZCFcIilcblx0XHR9XG5cdFx0Y29uc3QgbW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZShzb21lVHlwZVJlZilcblx0XHRyZXR1cm4gbW9kZWwudmVyc2lvblxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBlbmNyeXB0RGF0YUlmTmVlZGVkKFxuXHRcdG1ldGhvZERlZmluaXRpb246IE1ldGhvZERlZmluaXRpb24sXG5cdFx0cmVxdWVzdEVudGl0eTogRW50aXR5IHwgbnVsbCxcblx0XHRzZXJ2aWNlOiBBbnlTZXJ2aWNlLFxuXHRcdG1ldGhvZDogSHR0cE1ldGhvZCxcblx0XHRwYXJhbXM6IEV4dHJhU2VydmljZVBhcmFtcyB8IG51bGwsXG5cdCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuXHRcdGlmIChtZXRob2REZWZpbml0aW9uLmRhdGEgIT0gbnVsbCkge1xuXHRcdFx0aWYgKHJlcXVlc3RFbnRpdHkgPT0gbnVsbCB8fCAhaXNTYW1lVHlwZVJlZihtZXRob2REZWZpbml0aW9uLmRhdGEsIHJlcXVlc3RFbnRpdHkuX3R5cGUpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKGBJbnZhbGlkIHNlcnZpY2UgZGF0YSEgJHtzZXJ2aWNlLm5hbWV9ICR7bWV0aG9kfWApXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHJlcXVlc3RUeXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZShtZXRob2REZWZpbml0aW9uLmRhdGEpXG5cdFx0XHRpZiAocmVxdWVzdFR5cGVNb2RlbC5lbmNyeXB0ZWQgJiYgcGFyYW1zPy5zZXNzaW9uS2V5ID09IG51bGwpIHtcblx0XHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJNdXN0IHByb3ZpZGUgYSBzZXNzaW9uIGtleSBmb3IgYW4gZW5jcnlwdGVkIGRhdGEgdHJhbnNmZXIgdHlwZSE6IFwiICsgc2VydmljZSlcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgZW5jcnlwdGVkRW50aXR5ID0gYXdhaXQgdGhpcy5pbnN0YW5jZU1hcHBlci5lbmNyeXB0QW5kTWFwVG9MaXRlcmFsKHJlcXVlc3RUeXBlTW9kZWwsIHJlcXVlc3RFbnRpdHksIHBhcmFtcz8uc2Vzc2lvbktleSA/PyBudWxsKVxuXHRcdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KGVuY3J5cHRlZEVudGl0eSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGRlY3J5cHRSZXNwb25zZTxUIGV4dGVuZHMgRW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBkYXRhOiBzdHJpbmcsIHBhcmFtczogRXh0cmFTZXJ2aWNlUGFyYW1zIHwgdW5kZWZpbmVkKTogUHJvbWlzZTxUPiB7XG5cdFx0Y29uc3QgcmVzcG9uc2VUeXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKVxuXHRcdC8vIEZpbHRlciBvdXQgX19wcm90b19fIHRvIGF2b2lkIHByb3RvdHlwZSBwb2xsdXRpb24uXG5cdFx0Y29uc3QgaW5zdGFuY2UgPSBKU09OLnBhcnNlKGRhdGEsIChrLCB2KSA9PiAoayA9PT0gXCJfX3Byb3RvX19cIiA/IHVuZGVmaW5lZCA6IHYpKVxuXHRcdGNvbnN0IHJlc29sdmVkU2Vzc2lvbktleSA9IGF3YWl0IHRoaXMuY3J5cHRvRmFjYWRlKCkucmVzb2x2ZVNlcnZpY2VTZXNzaW9uS2V5KGluc3RhbmNlKVxuXHRcdHJldHVybiB0aGlzLmluc3RhbmNlTWFwcGVyLmRlY3J5cHRBbmRNYXBUb0luc3RhbmNlKHJlc3BvbnNlVHlwZU1vZGVsLCBpbnN0YW5jZSwgcmVzb2x2ZWRTZXNzaW9uS2V5ID8/IHBhcmFtcz8uc2Vzc2lvbktleSA/PyBudWxsKVxuXHR9XG59XG4iLCJpbXBvcnQgeyBHcm91cFR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IEFlc0tleSwgZGVjcnlwdEtleSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtY3J5cHRvXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3JcIlxuaW1wb3J0IHsgY3JlYXRlV2Vic29ja2V0TGVhZGVyU3RhdHVzLCBHcm91cE1lbWJlcnNoaXAsIFVzZXIsIFVzZXJHcm91cEtleURpc3RyaWJ1dGlvbiwgV2Vic29ja2V0TGVhZGVyU3RhdHVzIH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmc1wiXG5pbXBvcnQgeyBMb2dpbkluY29tcGxldGVFcnJvciB9IGZyb20gXCIuLi8uLi9jb21tb24vZXJyb3IvTG9naW5JbmNvbXBsZXRlRXJyb3JcIlxuaW1wb3J0IHsgaXNTYW1lSWQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcbmltcG9ydCB7IEtleUNhY2hlIH0gZnJvbSBcIi4vS2V5Q2FjaGUuanNcIlxuaW1wb3J0IHsgQ3J5cHRvV3JhcHBlciwgVmVyc2lvbmVkS2V5IH0gZnJvbSBcIi4uL2NyeXB0by9DcnlwdG9XcmFwcGVyLmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSBBdXRoRGF0YVByb3ZpZGVyIHtcblx0LyoqXG5cdCAqIEByZXR1cm4gVGhlIG1hcCB3aGljaCBjb250YWlucyBhdXRoZW50aWNhdGlvbiBkYXRhIGZvciB0aGUgbG9nZ2VkLWluIHVzZXIuXG5cdCAqL1xuXHRjcmVhdGVBdXRoSGVhZGVycygpOiBEaWN0XG5cblx0aXNGdWxseUxvZ2dlZEluKCk6IGJvb2xlYW5cbn1cblxuLyoqIEhvbGRlciBmb3IgdGhlIHVzZXIgYW5kIHNlc3Npb24tcmVsYXRlZCBkYXRhIG9uIHRoZSB3b3JrZXIgc2lkZS4gKi9cbmV4cG9ydCBjbGFzcyBVc2VyRmFjYWRlIGltcGxlbWVudHMgQXV0aERhdGFQcm92aWRlciB7XG5cdHByaXZhdGUgdXNlcjogVXNlciB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgYWNjZXNzVG9rZW46IHN0cmluZyB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgbGVhZGVyU3RhdHVzITogV2Vic29ja2V0TGVhZGVyU3RhdHVzXG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBrZXlDYWNoZTogS2V5Q2FjaGUsIHByaXZhdGUgcmVhZG9ubHkgY3J5cHRvV3JhcHBlcjogQ3J5cHRvV3JhcHBlcikge1xuXHRcdHRoaXMucmVzZXQoKVxuXHR9XG5cblx0Ly8gTG9naW4gcHJvY2VzcyBpcyBzb21laG93IG11bHRpLXN0ZXAsIGFuZCB3ZSBkb24ndCB1c2UgYSBzZXBhcmF0ZSBuZXR3b3JrIHN0YWNrIGZvciBpdC4gU28gd2UgaGF2ZSB0byBicmVhayB1cCBzZXR0ZXJzLlxuXHQvLyAxLiBXZSBuZWVkIHRvIGRvd25sb2FkIHVzZXIuIEZvciB0aGF0IHdlIG5lZWQgdG8gc2V0IGFjY2VzcyB0b2tlbiBhbHJlYWR5ICh0byBhdXRoZW50aWNhdGUgdGhlIHJlcXVlc3QgZm9yIHRoZSBzZXJ2ZXIgYXMgaXQgaXMgcGFzc2VkIGluIGhlYWRlcnMpLlxuXHQvLyAyLiBXZSBuZWVkIHRvIGdldCBncm91cCBrZXlzLiBGb3IgdGhhdCB3ZSBuZWVkIHRvIHVubG9jayB1c2VyR3JvdXBLZXkgd2l0aCB1c2VyUGFzc3BocmFzZUtleVxuXHQvLyBzbyB0aGlzIGxlYWRzIHRvIHRoaXMgc3RlcHMgaW4gVXNlckZhY2FkZTpcblx0Ly8gMS4gQWNjZXNzIHRva2VuIGlzIHNldFxuXHQvLyAyLiBVc2VyIGlzIHNldFxuXHQvLyAzLiBVc2VyR3JvdXBLZXkgaXMgdW5sb2NrZWRcblx0c2V0QWNjZXNzVG9rZW4oYWNjZXNzVG9rZW46IHN0cmluZyB8IG51bGwpIHtcblx0XHR0aGlzLmFjY2Vzc1Rva2VuID0gYWNjZXNzVG9rZW5cblx0fVxuXG5cdGdldEFjY2Vzc1Rva2VuKCk6IHN0cmluZyB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLmFjY2Vzc1Rva2VuXG5cdH1cblxuXHRzZXRVc2VyKHVzZXI6IFVzZXIpIHtcblx0XHRpZiAodGhpcy5hY2Nlc3NUb2tlbiA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcImludmFsaWQgc3RhdGU6IG5vIGFjY2VzcyB0b2tlblwiKVxuXHRcdH1cblx0XHR0aGlzLnVzZXIgPSB1c2VyXG5cdH1cblxuXHR1bmxvY2tVc2VyR3JvdXBLZXkodXNlclBhc3NwaHJhc2VLZXk6IEFlc0tleSkge1xuXHRcdGlmICh0aGlzLnVzZXIgPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJJbnZhbGlkIHN0YXRlOiBubyB1c2VyXCIpXG5cdFx0fVxuXHRcdGNvbnN0IHVzZXJHcm91cE1lbWJlcnNoaXAgPSB0aGlzLnVzZXIudXNlckdyb3VwXG5cdFx0Y29uc3QgY3VycmVudFVzZXJHcm91cEtleSA9IHtcblx0XHRcdHZlcnNpb246IE51bWJlcih1c2VyR3JvdXBNZW1iZXJzaGlwLmdyb3VwS2V5VmVyc2lvbiksXG5cdFx0XHRvYmplY3Q6IGRlY3J5cHRLZXkodXNlclBhc3NwaHJhc2VLZXksIHVzZXJHcm91cE1lbWJlcnNoaXAuc3ltRW5jR0tleSksXG5cdFx0fVxuXHRcdHRoaXMua2V5Q2FjaGUuc2V0Q3VycmVudFVzZXJHcm91cEtleShjdXJyZW50VXNlckdyb3VwS2V5KVxuXHRcdHRoaXMuc2V0VXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5KHVzZXJQYXNzcGhyYXNlS2V5KVxuXHR9XG5cblx0c2V0VXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5KHVzZXJQYXNzcGhyYXNlS2V5OiBudW1iZXJbXSkge1xuXHRcdGlmICh0aGlzLnVzZXIgPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJJbnZhbGlkIHN0YXRlOiBubyB1c2VyXCIpXG5cdFx0fVxuXHRcdGNvbnN0IHVzZXJHcm91cE1lbWJlcnNoaXAgPSB0aGlzLnVzZXIudXNlckdyb3VwXG5cdFx0Y29uc3QgdXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5ID0gdGhpcy5kZXJpdmVVc2VyR3JvdXBLZXlEaXN0cmlidXRpb25LZXkodXNlckdyb3VwTWVtYmVyc2hpcC5ncm91cCwgdXNlclBhc3NwaHJhc2VLZXkpXG5cdFx0dGhpcy5rZXlDYWNoZS5zZXRVc2VyR3JvdXBLZXlEaXN0cmlidXRpb25LZXkodXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5KVxuXHR9XG5cblx0ZGVyaXZlVXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5KHVzZXJHcm91cElkOiBJZCwgdXNlclBhc3NwaHJhc2VLZXk6IEFlc0tleSk6IEFlc0tleSB7XG5cdFx0Ly8gd2UgcHJlcGFyZSBhIGtleSB0byBlbmNyeXB0IHBvdGVudGlhbCB1c2VyIGdyb3VwIGtleSByb3RhdGlvbnMgd2l0aFxuXHRcdC8vIHdoZW4gcGFzc3dvcmRzIGFyZSBjaGFuZ2VkIGNsaWVudHMgYXJlIGxvZ2dlZC1vdXQgb2Ygb3RoZXIgc2Vzc2lvbnNcblx0XHQvLyB0aGlzIGtleSBpcyBvbmx5IG5lZWRlZCBieSB0aGUgbG9nZ2VkLWluIGNsaWVudHMsIHNvIGl0IHNob3VsZCBiZSByZWxpYWJsZSBlbm91Z2ggdG8gYXNzdW1lIHRoYXQgdXNlclBhc3NwaHJhc2VLZXkgaXMgaW4gc3luY1xuXG5cdFx0Ly8gd2UgYmluZCB0aGlzIHRvIHVzZXJHcm91cElkIGFuZCB0aGUgZG9tYWluIHNlcGFyYXRvciB1c2VyR3JvdXBLZXlEaXN0cmlidXRpb25LZXkgZnJvbSBjcnlwdG8gcGFja2FnZVxuXHRcdC8vIHRoZSBoa2RmIHNhbHQgZG9lcyBub3QgaGF2ZSB0byBiZSBzZWNyZXQgYnV0IHNob3VsZCBiZSB1bmlxdWUgcGVyIHVzZXIgYW5kIGNhcnJ5IHNvbWUgYWRkaXRpb25hbCBlbnRyb3B5IHdoaWNoIHNoYTI1NiBlbnN1cmVzXG5cblx0XHRyZXR1cm4gdGhpcy5jcnlwdG9XcmFwcGVyLmRlcml2ZUtleVdpdGhIa2RmKHtcblx0XHRcdHNhbHQ6IHVzZXJHcm91cElkLFxuXHRcdFx0a2V5OiB1c2VyUGFzc3BocmFzZUtleSxcblx0XHRcdGNvbnRleHQ6IFwidXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5XCIsXG5cdFx0fSlcblx0fVxuXG5cdGFzeW5jIHVwZGF0ZVVzZXIodXNlcjogVXNlcikge1xuXHRcdGlmICh0aGlzLnVzZXIgPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJVcGRhdGUgdXNlciBpcyBjYWxsZWQgd2l0aG91dCBsb2dnaW5nIGluLiBUaGlzIGZ1bmN0aW9uIGlzIG5vdCBmb3IgeW91LlwiKVxuXHRcdH1cblx0XHR0aGlzLnVzZXIgPSB1c2VyXG5cdFx0YXdhaXQgdGhpcy5rZXlDYWNoZS5yZW1vdmVPdXRkYXRlZEdyb3VwS2V5cyh1c2VyKVxuXHR9XG5cblx0Z2V0VXNlcigpOiBVc2VyIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMudXNlclxuXHR9XG5cblx0LyoqXG5cdCAqIEByZXR1cm4gVGhlIG1hcCB3aGljaCBjb250YWlucyBhdXRoZW50aWNhdGlvbiBkYXRhIGZvciB0aGUgbG9nZ2VkLWluIHVzZXIuXG5cdCAqL1xuXHRjcmVhdGVBdXRoSGVhZGVycygpOiBEaWN0IHtcblx0XHRyZXR1cm4gdGhpcy5hY2Nlc3NUb2tlblxuXHRcdFx0PyB7XG5cdFx0XHRcdFx0YWNjZXNzVG9rZW46IHRoaXMuYWNjZXNzVG9rZW4sXG5cdFx0XHQgIH1cblx0XHRcdDoge31cblx0fVxuXG5cdGdldFVzZXJHcm91cElkKCk6IElkIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRMb2dnZWRJblVzZXIoKS51c2VyR3JvdXAuZ3JvdXBcblx0fVxuXG5cdGdldEFsbEdyb3VwSWRzKCk6IElkW10ge1xuXHRcdGxldCBncm91cHMgPSB0aGlzLmdldExvZ2dlZEluVXNlcigpLm1lbWJlcnNoaXBzLm1hcCgobWVtYmVyc2hpcCkgPT4gbWVtYmVyc2hpcC5ncm91cClcblx0XHRncm91cHMucHVzaCh0aGlzLmdldExvZ2dlZEluVXNlcigpLnVzZXJHcm91cC5ncm91cClcblx0XHRyZXR1cm4gZ3JvdXBzXG5cdH1cblxuXHRnZXRDdXJyZW50VXNlckdyb3VwS2V5KCk6IFZlcnNpb25lZEtleSB7XG5cdFx0Ly8gdGhlIHVzZXJHcm91cEtleSBpcyBhbHdheXMgd3JpdHRlbiBhZnRlciB0aGUgbG9naW4gdG8gdGhpcy5jdXJyZW50VXNlckdyb3VwS2V5XG5cdFx0Ly9pZiB0aGUgdXNlciBoYXMgb25seSBsb2dnZWQgaW4gb2ZmbGluZSB0aGlzIGhhcyBub3QgaGFwcGVuZWRcblx0XHRjb25zdCBjdXJyZW50VXNlckdyb3VwS2V5ID0gdGhpcy5rZXlDYWNoZS5nZXRDdXJyZW50VXNlckdyb3VwS2V5KClcblx0XHRpZiAoY3VycmVudFVzZXJHcm91cEtleSA9PSBudWxsKSB7XG5cdFx0XHRpZiAodGhpcy5pc1BhcnRpYWxseUxvZ2dlZEluKCkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IExvZ2luSW5jb21wbGV0ZUVycm9yKFwidXNlckdyb3VwS2V5IG5vdCBhdmFpbGFibGVcIilcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwiSW52YWxpZCBzdGF0ZTogdXNlckdyb3VwS2V5IGlzIG5vdCBhdmFpbGFibGVcIilcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGN1cnJlbnRVc2VyR3JvdXBLZXlcblx0fVxuXG5cdGdldE1lbWJlcnNoaXAoZ3JvdXBJZDogSWQpOiBHcm91cE1lbWJlcnNoaXAge1xuXHRcdGxldCBtZW1iZXJzaGlwID0gdGhpcy5nZXRMb2dnZWRJblVzZXIoKS5tZW1iZXJzaGlwcy5maW5kKChnOiBHcm91cE1lbWJlcnNoaXApID0+IGlzU2FtZUlkKGcuZ3JvdXAsIGdyb3VwSWQpKVxuXG5cdFx0aWYgKCFtZW1iZXJzaGlwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE5vIGdyb3VwIHdpdGggZ3JvdXBJZCAke2dyb3VwSWR9IGZvdW5kIWApXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1lbWJlcnNoaXBcblx0fVxuXG5cdGhhc0dyb3VwKGdyb3VwSWQ6IElkKTogYm9vbGVhbiB7XG5cdFx0aWYgKCF0aGlzLnVzZXIpIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZ3JvdXBJZCA9PT0gdGhpcy51c2VyLnVzZXJHcm91cC5ncm91cCB8fCB0aGlzLnVzZXIubWVtYmVyc2hpcHMuc29tZSgobSkgPT4gbS5ncm91cCA9PT0gZ3JvdXBJZClcblx0XHR9XG5cdH1cblxuXHRnZXRHcm91cElkKGdyb3VwVHlwZTogR3JvdXBUeXBlKTogSWQge1xuXHRcdGlmIChncm91cFR5cGUgPT09IEdyb3VwVHlwZS5Vc2VyKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRVc2VyR3JvdXBJZCgpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGxldCBtZW1iZXJzaGlwID0gdGhpcy5nZXRMb2dnZWRJblVzZXIoKS5tZW1iZXJzaGlwcy5maW5kKChtKSA9PiBtLmdyb3VwVHlwZSA9PT0gZ3JvdXBUeXBlKVxuXG5cdFx0XHRpZiAoIW1lbWJlcnNoaXApIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiY291bGQgbm90IGZpbmQgZ3JvdXBUeXBlIFwiICsgZ3JvdXBUeXBlICsgXCIgZm9yIHVzZXIgXCIgKyB0aGlzLmdldExvZ2dlZEluVXNlcigpLl9pZClcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG1lbWJlcnNoaXAuZ3JvdXBcblx0XHR9XG5cdH1cblxuXHRnZXRHcm91cElkcyhncm91cFR5cGU6IEdyb3VwVHlwZSk6IElkW10ge1xuXHRcdHJldHVybiB0aGlzLmdldExvZ2dlZEluVXNlcigpXG5cdFx0XHQubWVtYmVyc2hpcHMuZmlsdGVyKChtKSA9PiBtLmdyb3VwVHlwZSA9PT0gZ3JvdXBUeXBlKVxuXHRcdFx0Lm1hcCgoZ20pID0+IGdtLmdyb3VwKVxuXHR9XG5cblx0aXNQYXJ0aWFsbHlMb2dnZWRJbigpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy51c2VyICE9IG51bGxcblx0fVxuXG5cdGlzRnVsbHlMb2dnZWRJbigpOiBib29sZWFuIHtcblx0XHQvLyBXZSBoYXZlIHVzZXJHcm91cEtleSwgYW5kIHdlIGNhbiBkZWNyeXB0IGFueSBvdGhlciBrZXkgLSB3ZSBhcmUgZ29vZCB0byBnb1xuXHRcdHJldHVybiB0aGlzLmtleUNhY2hlLmdldEN1cnJlbnRVc2VyR3JvdXBLZXkoKSAhPSBudWxsXG5cdH1cblxuXHRnZXRMb2dnZWRJblVzZXIoKTogVXNlciB7XG5cdFx0cmV0dXJuIGFzc2VydE5vdE51bGwodGhpcy51c2VyKVxuXHR9XG5cblx0c2V0TGVhZGVyU3RhdHVzKHN0YXR1czogV2Vic29ja2V0TGVhZGVyU3RhdHVzKSB7XG5cdFx0dGhpcy5sZWFkZXJTdGF0dXMgPSBzdGF0dXNcblx0XHRjb25zb2xlLmxvZyhcIk5ldyBsZWFkZXIgc3RhdHVzIHNldDpcIiwgc3RhdHVzLmxlYWRlclN0YXR1cylcblx0fVxuXG5cdGlzTGVhZGVyKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmxlYWRlclN0YXR1cy5sZWFkZXJTdGF0dXNcblx0fVxuXG5cdHJlc2V0KCkge1xuXHRcdHRoaXMudXNlciA9IG51bGxcblx0XHR0aGlzLmFjY2Vzc1Rva2VuID0gbnVsbFxuXHRcdHRoaXMua2V5Q2FjaGUucmVzZXQoKVxuXHRcdHRoaXMubGVhZGVyU3RhdHVzID0gY3JlYXRlV2Vic29ja2V0TGVhZGVyU3RhdHVzKHtcblx0XHRcdGxlYWRlclN0YXR1czogZmFsc2UsXG5cdFx0fSlcblx0fVxuXG5cdHVwZGF0ZVVzZXJHcm91cEtleSh1c2VyR3JvdXBLZXlEaXN0cmlidXRpb246IFVzZXJHcm91cEtleURpc3RyaWJ1dGlvbikge1xuXHRcdGNvbnN0IHVzZXJHcm91cEtleURpc3RyaWJ1dGlvbktleSA9IHRoaXMua2V5Q2FjaGUuZ2V0VXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5KClcblx0XHRpZiAodXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5ID09IG51bGwpIHtcblx0XHRcdGNvbnNvbGUubG9nKFwiY291bGQgbm90IHVwZGF0ZSB1c2VyR3JvdXBLZXkgYmVjYXVzZSBkaXN0cmlidXRpb24ga2V5IGlzIG5vdCBhdmFpbGFibGVcIilcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRsZXQgbmV3VXNlckdyb3VwS2V5Qnl0ZXNcblx0XHR0cnkge1xuXHRcdFx0bmV3VXNlckdyb3VwS2V5Qnl0ZXMgPSBkZWNyeXB0S2V5KHVzZXJHcm91cEtleURpc3RyaWJ1dGlvbktleSwgdXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkVuY1VzZXJHcm91cEtleSlcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHQvLyB0aGlzIG1heSBoYXBwZW4gZHVyaW5nIG9mZmxpbmUgc3RvcmFnZSBzeW5jaHJvbmlzYXRpb24gd2hlbiB0aGUgZXZlbnQgcXVldWUgY29udGFpbnMgdXNlciBncm91cCBrZXkgcm90YXRpb24gYW5kIGEgcGFzc3dvcmQgY2hhbmdlLlxuXHRcdFx0Ly8gV2UgY2FuIGlnbm9yZSB0aGlzIGVycm9yIGFzIHdlIGFscmVhZHkgaGF2ZSB0aGUgbGF0ZXN0IHVzZXIgZ3JvdXAga2V5IGFmdGVyIGNvbm5lY3RpbmcgdGhlIG9mZmxpbmUgY2xpZW50XG5cdFx0XHRjb25zb2xlLmxvZyhgQ291bGQgbm90IGRlY3J5cHQgdXNlckdyb3VwS2V5VXBkYXRlYCwgZSlcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRjb25zdCBuZXdVc2VyR3JvdXBLZXkgPSB7XG5cdFx0XHRvYmplY3Q6IG5ld1VzZXJHcm91cEtleUJ5dGVzLFxuXHRcdFx0dmVyc2lvbjogTnVtYmVyKHVzZXJHcm91cEtleURpc3RyaWJ1dGlvbi51c2VyR3JvdXBLZXlWZXJzaW9uKSxcblx0XHR9XG5cdFx0Y29uc29sZS5sb2coYHVwZGF0aW5nIHVzZXJHcm91cEtleS4gbmV3IHZlcnNpb246ICR7dXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uLnVzZXJHcm91cEtleVZlcnNpb259YClcblx0XHR0aGlzLmtleUNhY2hlLnNldEN1cnJlbnRVc2VyR3JvdXBLZXkobmV3VXNlckdyb3VwS2V5KVxuXHR9XG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IG1vZGVsSW5mb3MgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0VudGl0eUZ1bmN0aW9ucy5qc1wiXG5pbXBvcnQgeyB0eXBlZEtleXMsIFR5cGVSZWYgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEVsZW1lbnRFbnRpdHksIExpc3RFbGVtZW50RW50aXR5LCBTb21lRW50aXR5IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnRpdHlUeXBlcy5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yLmpzXCJcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGVBbGxMaXN0RWxlbWVudHM8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSwgbWlncmF0aW9uczogQXJyYXk8TWlncmF0aW9uPikge1xuXHRsZXQgZW50aXRpZXMgPSBhd2FpdCBzdG9yYWdlLmdldFJhd0xpc3RFbGVtZW50c09mVHlwZSh0eXBlUmVmKVxuXG5cdGZvciAoY29uc3QgbWlncmF0aW9uIG9mIG1pZ3JhdGlvbnMpIHtcblx0XHQvLyBAdHMtaWdub3JlIG5lZWQgYmV0dGVyIHR5cGVzIGZvciBtaWdyYXRpb25zXG5cdFx0ZW50aXRpZXMgPSBlbnRpdGllcy5tYXAobWlncmF0aW9uKVxuXHR9XG5cblx0Zm9yIChjb25zdCBlbnRpdHkgb2YgZW50aXRpZXMpIHtcblx0XHRlbnRpdHkuX3R5cGUgPSB0eXBlUmVmIGFzIFR5cGVSZWY8dHlwZW9mIGVudGl0eT5cblx0XHRhd2FpdCBzdG9yYWdlLnB1dChlbnRpdHkpXG5cdH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGVBbGxFbGVtZW50czxUIGV4dGVuZHMgRWxlbWVudEVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UsIG1pZ3JhdGlvbnM6IEFycmF5PE1pZ3JhdGlvbj4pIHtcblx0bGV0IGVudGl0aWVzID0gYXdhaXQgc3RvcmFnZS5nZXRSYXdFbGVtZW50c09mVHlwZSh0eXBlUmVmKVxuXG5cdGZvciAoY29uc3QgbWlncmF0aW9uIG9mIG1pZ3JhdGlvbnMpIHtcblx0XHQvLyBAdHMtaWdub3JlIG5lZWQgYmV0dGVyIHR5cGVzIGZvciBtaWdyYXRpb25zXG5cdFx0ZW50aXRpZXMgPSBlbnRpdGllcy5tYXAobWlncmF0aW9uKVxuXHR9XG5cblx0Zm9yIChjb25zdCBlbnRpdHkgb2YgZW50aXRpZXMpIHtcblx0XHRlbnRpdHkuX3R5cGUgPSB0eXBlUmVmIGFzIFR5cGVSZWY8dHlwZW9mIGVudGl0eT5cblx0XHRhd2FpdCBzdG9yYWdlLnB1dChlbnRpdHkpXG5cdH1cbn1cblxuZXhwb3J0IHR5cGUgTWlncmF0aW9uID0gKGVudGl0eTogYW55KSA9PiBTb21lRW50aXR5XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5hbWVBdHRyaWJ1dGUob2xkTmFtZTogc3RyaW5nLCBuZXdOYW1lOiBzdHJpbmcpOiBNaWdyYXRpb24ge1xuXHRyZXR1cm4gZnVuY3Rpb24gKGVudGl0eSkge1xuXHRcdGVudGl0eVtuZXdOYW1lXSA9IGVudGl0eVtvbGROYW1lXVxuXHRcdGRlbGV0ZSBlbnRpdHlbb2xkTmFtZV1cblx0XHRyZXR1cm4gZW50aXR5XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZE93bmVyS2V5VmVyc2lvbigpOiBNaWdyYXRpb24ge1xuXHRyZXR1cm4gZnVuY3Rpb24gKGVudGl0eSkge1xuXHRcdGVudGl0eVtcIl9vd25lcktleVZlcnNpb25cIl0gPSBlbnRpdHlbXCJfb3duZXJFbmNTZXNzaW9uS2V5XCJdID09IG51bGwgPyBudWxsIDogXCIwXCJcblx0XHRyZXR1cm4gZW50aXR5XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVZhbHVlKHZhbHVlTmFtZTogc3RyaW5nKTogTWlncmF0aW9uIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChlbnRpdHkpIHtcblx0XHRkZWxldGUgZW50aXR5W3ZhbHVlTmFtZV1cblx0XHRyZXR1cm4gZW50aXR5XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZFZhbHVlKHZhbHVlTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KTogTWlncmF0aW9uIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChlbnRpdHkpIHtcblx0XHRlbnRpdHlbdmFsdWVOYW1lXSA9IHZhbHVlXG5cdFx0cmV0dXJuIGVudGl0eVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBib29sZWFuVG9OdW1iZXJWYWx1ZShhdHRyaWJ1dGU6IHN0cmluZyk6IE1pZ3JhdGlvbiB7XG5cdHJldHVybiBmdW5jdGlvbiAoZW50aXR5KSB7XG5cdFx0Ly8gc2FtZSBkZWZhdWx0IHZhbHVlIG1hcHBpbmcgYXMgaW4gdGhlIHR1dGFkYiBtaWdyYXRpb25cblx0XHRlbnRpdHlbYXR0cmlidXRlXSA9IGVudGl0eVthdHRyaWJ1dGVdID8gXCIxXCIgOiBcIjBcIlxuXHRcdHJldHVybiBlbnRpdHlcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlQ2FyZGluYWxpdHlGcm9tQW55VG9aZXJvT3JPbmUoYXR0cmlidXRlOiBzdHJpbmcpOiBNaWdyYXRpb24ge1xuXHRyZXR1cm4gZnVuY3Rpb24gKGVudGl0eSkge1xuXHRcdGNvbnN0IHZhbHVlID0gZW50aXR5W2F0dHJpYnV0ZV1cblx0XHRpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIkNhbiBvbmx5IG1pZ3JhdGUgZnJvbSBjYXJkaW5hbGl0eSBBTlkuXCIpXG5cdFx0fVxuXHRcdGNvbnN0IGxlbmd0aCA9IHZhbHVlLmxlbmd0aFxuXHRcdGlmIChsZW5ndGggPT09IDApIHtcblx0XHRcdGVudGl0eVthdHRyaWJ1dGVdID0gbnVsbFxuXHRcdH0gZWxzZSBpZiAobGVuZ3RoID09PSAxKSB7XG5cdFx0XHRlbnRpdHlbYXR0cmlidXRlXSA9IHZhbHVlWzBdXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKGBub3QgcG9zc2libGUgdG8gbWlncmF0ZSBBTlkgdG8gWkVST19PUl9PTkUgd2l0aCBhcnJheSBsZW5ndGggPiAxLiBhY3R1YWwgbGVuZ3RoOiAke2xlbmd0aH1gKVxuXHRcdH1cblx0XHRyZXR1cm4gZW50aXR5XG5cdH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyRGF0YWJhc2Uoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UpIHtcblx0YXdhaXQgc3RvcmFnZS5wdXJnZVN0b3JhZ2UoKVxuXHRhd2FpdCB3cml0ZU1vZGVsVmVyc2lvbnMoc3RvcmFnZSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUluc3RhbmNlc09mVHlwZTxUIGV4dGVuZHMgU29tZUVudGl0eT4oc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UsIHR5cGU6IFR5cGVSZWY8VD4pOiBQcm9taXNlPHZvaWQ+IHtcblx0cmV0dXJuIHN0b3JhZ2UuZGVsZXRlQWxsT2ZUeXBlKHR5cGUpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHdyaXRlTW9kZWxWZXJzaW9ucyhzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRmb3IgKGNvbnN0IGFwcCBvZiB0eXBlZEtleXMobW9kZWxJbmZvcykpIHtcblx0XHRjb25zdCBrZXkgPSBgJHthcHB9LXZlcnNpb25gIGFzIGNvbnN0XG5cdFx0bGV0IHZlcnNpb24gPSBtb2RlbEluZm9zW2FwcF0udmVyc2lvblxuXHRcdGF3YWl0IHN0b3JhZ2Uuc2V0U3RvcmVkTW9kZWxWZXJzaW9uKGFwcCwgdmVyc2lvbilcblx0fVxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IGRlbGV0ZUluc3RhbmNlc09mVHlwZSwgbWlncmF0ZUFsbExpc3RFbGVtZW50cyB9IGZyb20gXCIuLi9TdGFuZGFyZE1pZ3JhdGlvbnMuanNcIlxuaW1wb3J0IHsgTWFpbFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgY3JlYXRlQ3VzdG9tZXJJbmZvLCBDdXN0b21lckluZm9UeXBlUmVmLCBVc2VyVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuXG5leHBvcnQgY29uc3Qgc3lzOTQ6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJzeXNcIixcblx0dmVyc2lvbjogOTQsXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UpIHtcblx0XHQvLyB0aGVzZSBhcmUgZHVlIHRvIHRoZSBtYWlsYm9keSBtaWdyYXRpb25cblx0XHRhd2FpdCBkZWxldGVJbnN0YW5jZXNPZlR5cGUoc3RvcmFnZSwgTWFpbFR5cGVSZWYpXG5cdFx0YXdhaXQgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlKHN0b3JhZ2UsIFVzZXJUeXBlUmVmKVxuXHRcdC8vIHRoaXMgaXMgdG8gYWRkIHRoZSBjdXN0b21lckluZm8uc3VwcG9ydEluZm8gZmllbGQgKHN5czk0KVxuXHRcdGF3YWl0IG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMoQ3VzdG9tZXJJbmZvVHlwZVJlZiwgc3RvcmFnZSwgW2NyZWF0ZUN1c3RvbWVySW5mb10pXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgbWlncmF0ZUFsbExpc3RFbGVtZW50cyB9IGZyb20gXCIuLi9TdGFuZGFyZE1pZ3JhdGlvbnMuanNcIlxuaW1wb3J0IHsgY3JlYXRlTWFpbCwgTWFpbFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuXG5leHBvcnQgY29uc3QgdHV0YW5vdGE2NjogT2ZmbGluZU1pZ3JhdGlvbiA9IHtcblx0YXBwOiBcInR1dGFub3RhXCIsXG5cdHZlcnNpb246IDY2LFxuXHRhc3luYyBtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0YXdhaXQgbWlncmF0ZUFsbExpc3RFbGVtZW50cyhNYWlsVHlwZVJlZiwgc3RvcmFnZSwgW2NyZWF0ZU1haWxdKSAvLyBpbml0aWFsaXplcyBlbmNyeXB0aW9uQXV0aFN0YXR1c1xuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IGRlbGV0ZUluc3RhbmNlc09mVHlwZSwgbWlncmF0ZUFsbExpc3RFbGVtZW50cyB9IGZyb20gXCIuLi9TdGFuZGFyZE1pZ3JhdGlvbnMuanNcIlxuaW1wb3J0IHsgQnVja2V0S2V5LCBCdWNrZXRQZXJtaXNzaW9uLCBCdWNrZXRQZXJtaXNzaW9uVHlwZVJlZiwgR3JvdXBUeXBlUmVmLCBVc2VyVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgQ3J5cHRvUHJvdG9jb2xWZXJzaW9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBNYWlsLCBNYWlsVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5cbmV4cG9ydCBjb25zdCBzeXM5MjogT2ZmbGluZU1pZ3JhdGlvbiA9IHtcblx0YXBwOiBcInN5c1wiLFxuXHR2ZXJzaW9uOiA5Mixcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRcdGF3YWl0IG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMoQnVja2V0UGVybWlzc2lvblR5cGVSZWYsIHN0b3JhZ2UsIFthZGRQcm90b2NvbFZlcnNpb25dKVxuXHRcdGF3YWl0IG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMoTWFpbFR5cGVSZWYsIHN0b3JhZ2UsIFtcblx0XHRcdChlOiBNYWlsKSA9PiB7XG5cdFx0XHRcdGlmIChlLmJ1Y2tldEtleSkge1xuXHRcdFx0XHRcdGFkZFByb3RvY29sVmVyc2lvbihlLmJ1Y2tldEtleSlcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gZVxuXHRcdFx0fSxcblx0XHRdKVxuXHRcdC8vIEtleVBhaXIgd2FzIGNoYW5nZWRcblx0XHRhd2FpdCBkZWxldGVJbnN0YW5jZXNPZlR5cGUoc3RvcmFnZSwgR3JvdXBUeXBlUmVmKVxuXHRcdC8vIFdlIGFsc28gZGVsZXRlIFVzZXJUeXBlIHJlZiB0byBkaXNhYmxlIG9mZmxpbmUgbG9naW4uIE90aGVyd2lzZSwgY2xpZW50cyB3aWxsIHNlZSBhbiB1bmV4cGVjdGVkIGVycm9yIG1lc3NhZ2Ugd2l0aCBwdXJlIG9mZmxpbmUgbG9naW4uXG5cdFx0YXdhaXQgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlKHN0b3JhZ2UsIFVzZXJUeXBlUmVmKVxuXHR9LFxufVxuXG5mdW5jdGlvbiBhZGRQcm90b2NvbFZlcnNpb248VCBleHRlbmRzIEJ1Y2tldEtleSB8IEJ1Y2tldFBlcm1pc3Npb24+KGVudGl0eTogVCk6IFQge1xuXHRpZiAoZW50aXR5LnB1YkVuY0J1Y2tldEtleSkge1xuXHRcdGVudGl0eS5wcm90b2NvbFZlcnNpb24gPSBDcnlwdG9Qcm90b2NvbFZlcnNpb24uUlNBXG5cdH0gZWxzZSB7XG5cdFx0ZW50aXR5LnByb3RvY29sVmVyc2lvbiA9IENyeXB0b1Byb3RvY29sVmVyc2lvbi5TWU1NRVRSSUNfRU5DUllQVElPTlxuXHR9XG5cdHJldHVybiBlbnRpdHlcbn1cbiIsImltcG9ydCB7IE9mZmxpbmVNaWdyYXRpb24gfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2VNaWdyYXRvci5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZS5qc1wiXG5pbXBvcnQgeyBkZWxldGVJbnN0YW5jZXNPZlR5cGUsIG1pZ3JhdGVBbGxFbGVtZW50cywgbWlncmF0ZUFsbExpc3RFbGVtZW50cywgcmVtb3ZlVmFsdWUgfSBmcm9tIFwiLi4vU3RhbmRhcmRNaWdyYXRpb25zLmpzXCJcbmltcG9ydCB7IEN1c3RvbWVyVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgTWFpbGJveEdyb3VwUm9vdFR5cGVSZWYsIE1haWxUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcblxuZXhwb3J0IGNvbnN0IHR1dGFub3RhNjU6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJ0dXRhbm90YVwiLFxuXHR2ZXJzaW9uOiA2NSxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRcdG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMoTWFpbFR5cGVSZWYsIHN0b3JhZ2UsIFtyZW1vdmVWYWx1ZShcInJlc3RyaWN0aW9uc1wiKV0pXG5cdFx0bWlncmF0ZUFsbEVsZW1lbnRzKE1haWxib3hHcm91cFJvb3RUeXBlUmVmLCBzdG9yYWdlLCBbXG5cdFx0XHRyZW1vdmVWYWx1ZShcImNvbnRhY3RGb3JtVXNlckNvbnRhY3RGb3JtXCIpLFxuXHRcdFx0cmVtb3ZlVmFsdWUoXCJ0YXJnZXRNYWlsR3JvdXBDb250YWN0Rm9ybVwiKSxcblx0XHRcdHJlbW92ZVZhbHVlKFwicGFydGljaXBhdGluZ0NvbnRhY3RGb3Jtc1wiKSxcblx0XHRdKVxuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IG1pZ3JhdGVBbGxFbGVtZW50cywgcmVtb3ZlVmFsdWUgfSBmcm9tIFwiLi4vU3RhbmRhcmRNaWdyYXRpb25zLmpzXCJcbmltcG9ydCB7IEN1c3RvbWVyVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuXG5leHBvcnQgY29uc3Qgc3lzOTE6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJzeXNcIixcblx0dmVyc2lvbjogOTEsXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UpIHtcblx0XHRhd2FpdCBtaWdyYXRlQWxsRWxlbWVudHMoQ3VzdG9tZXJUeXBlUmVmLCBzdG9yYWdlLCBbcmVtb3ZlVmFsdWUoXCJjb250YWN0Rm9ybVVzZXJHcm91cHNcIiksIHJlbW92ZVZhbHVlKFwiY29udGFjdEZvcm1Vc2VyQXJlYUdyb3Vwc1wiKV0pXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgbWlncmF0ZUFsbEVsZW1lbnRzLCBtaWdyYXRlQWxsTGlzdEVsZW1lbnRzIH0gZnJvbSBcIi4uL1N0YW5kYXJkTWlncmF0aW9ucy5qc1wiXG5pbXBvcnQgeyBDdXN0b21lckluZm8sIEN1c3RvbWVySW5mb1R5cGVSZWYsIFVzZXIsIFVzZXJUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBLZGZUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5cbmV4cG9ydCBjb25zdCBzeXM5MDogT2ZmbGluZU1pZ3JhdGlvbiA9IHtcblx0YXBwOiBcInN5c1wiLFxuXHR2ZXJzaW9uOiA5MCxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRcdC8vIHdlJ3ZlIGFkZGVkIGEgbmV3IGZpZWxkIHRvIFBsYW5Db25maWcgYW5kIHdlIHdhbnQgdG8gbWFrZSBzdXJlIHRoYXQgaXQncyBjb3JyZWN0IGluIHRoZSBmdXR1cmVcblx0XHQvLyBhbnlvbmUgd2hvIGhhcyBhIGN1c3RvbSBwbGFuIGF0IHRoZSBtb21lbnQgZG9lcyBub3QgaGF2ZSB0aGUgY29udGFjdCBsaXN0XG5cdFx0YXdhaXQgbWlncmF0ZUFsbExpc3RFbGVtZW50cyhDdXN0b21lckluZm9UeXBlUmVmLCBzdG9yYWdlLCBbXG5cdFx0XHQob2xkQ3VzdG9tZXJJbmZvOiBDdXN0b21lckluZm8pID0+IHtcblx0XHRcdFx0aWYgKG9sZEN1c3RvbWVySW5mby5jdXN0b21QbGFuKSB7XG5cdFx0XHRcdFx0b2xkQ3VzdG9tZXJJbmZvLmN1c3RvbVBsYW4uY29udGFjdExpc3QgPSBmYWxzZVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBvbGRDdXN0b21lckluZm9cblx0XHRcdH0sXG5cdFx0XSlcblxuXHRcdC8vIHdlIGZvcmdvdCB0byBpbmNsdWRlIHRoaXMgaW4gdjg5IG1pZ3JhdGlvblxuXHRcdGF3YWl0IG1pZ3JhdGVBbGxFbGVtZW50cyhVc2VyVHlwZVJlZiwgc3RvcmFnZSwgW1xuXHRcdFx0KHVzZXI6IFVzZXIpID0+IHtcblx0XHRcdFx0aWYgKCF1c2VyLmtkZlZlcnNpb24pIHtcblx0XHRcdFx0XHR1c2VyLmtkZlZlcnNpb24gPSBLZGZUeXBlLkJjcnlwdFxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB1c2VyXG5cdFx0XHR9LFxuXHRcdF0pXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgbWlncmF0ZUFsbExpc3RFbGVtZW50cywgcmVtb3ZlVmFsdWUgfSBmcm9tIFwiLi4vU3RhbmRhcmRNaWdyYXRpb25zLmpzXCJcbmltcG9ydCB7IEZpbGVUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcblxuZXhwb3J0IGNvbnN0IHR1dGFub3RhNjQ6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJ0dXRhbm90YVwiLFxuXHR2ZXJzaW9uOiA2NCxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRcdC8vIFdlIGhhdmUgZnVsbHkgcmVtb3ZlZCBGaWxlRGF0YVxuXHRcdG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMoRmlsZVR5cGVSZWYsIHN0b3JhZ2UsIFtyZW1vdmVWYWx1ZShcImRhdGFcIildKVxuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IGRlbGV0ZUluc3RhbmNlc09mVHlwZSB9IGZyb20gXCIuLi9TdGFuZGFyZE1pZ3JhdGlvbnMuanNcIlxuaW1wb3J0IHsgQ29udGFjdFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuXG5leHBvcnQgY29uc3QgdHV0YW5vdGE2NzogT2ZmbGluZU1pZ3JhdGlvbiA9IHtcblx0YXBwOiBcInR1dGFub3RhXCIsXG5cdHZlcnNpb246IDY3LFxuXHRhc3luYyBtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0YXdhaXQgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlKHN0b3JhZ2UsIENvbnRhY3RUeXBlUmVmKVxuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7XG5cdEFjY291bnRpbmdJbmZvVHlwZVJlZixcblx0QXVkaXRMb2dFbnRyeVR5cGVSZWYsXG5cdEN1c3RvbWVyU2VydmVyUHJvcGVydGllc1R5cGVSZWYsXG5cdEdpZnRDYXJkVHlwZVJlZixcblx0R3JvdXBJbmZvVHlwZVJlZixcblx0R3JvdXBUeXBlUmVmLFxuXHRJbnZvaWNlVHlwZVJlZixcblx0TWlzc2VkTm90aWZpY2F0aW9uVHlwZVJlZixcblx0T3JkZXJQcm9jZXNzaW5nQWdyZWVtZW50VHlwZVJlZixcblx0UHVzaElkZW50aWZpZXJUeXBlUmVmLFxuXHRSZWNlaXZlZEdyb3VwSW52aXRhdGlvblR5cGVSZWYsXG5cdFJlY292ZXJDb2RlVHlwZVJlZixcblx0VXNlckFsYXJtSW5mb1R5cGVSZWYsXG5cdFVzZXJHcm91cFJvb3RUeXBlUmVmLFxuXHRVc2VyVHlwZVJlZixcblx0V2hpdGVsYWJlbENoaWxkVHlwZVJlZixcbn0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQge1xuXHRhZGRPd25lcktleVZlcnNpb24sXG5cdGFkZFZhbHVlLFxuXHRjaGFuZ2VDYXJkaW5hbGl0eUZyb21BbnlUb1plcm9Pck9uZSxcblx0bWlncmF0ZUFsbEVsZW1lbnRzLFxuXHRtaWdyYXRlQWxsTGlzdEVsZW1lbnRzLFxuXHRNaWdyYXRpb24sXG5cdHJlbW92ZVZhbHVlLFxuXHRyZW5hbWVBdHRyaWJ1dGUsXG59IGZyb20gXCIuLi9TdGFuZGFyZE1pZ3JhdGlvbnMuanNcIlxuaW1wb3J0IHsgRWxlbWVudEVudGl0eSwgTGlzdEVsZW1lbnRFbnRpdHkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL0VudGl0eVR5cGVzLmpzXCJcbmltcG9ydCB7IFR5cGVSZWYgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcblxuZXhwb3J0IGNvbnN0IHN5czk2OiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwic3lzXCIsXG5cdHZlcnNpb246IDk2LFxuXHRhc3luYyBtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0Y29uc3QgZW5jcnlwdGVkRWxlbWVudFR5cGVzOiBBcnJheTxUeXBlUmVmPEVsZW1lbnRFbnRpdHk+PiA9IFtcblx0XHRcdEFjY291bnRpbmdJbmZvVHlwZVJlZixcblx0XHRcdEN1c3RvbWVyU2VydmVyUHJvcGVydGllc1R5cGVSZWYsXG5cdFx0XHRJbnZvaWNlVHlwZVJlZixcblx0XHRcdE1pc3NlZE5vdGlmaWNhdGlvblR5cGVSZWYsXG5cdFx0XVxuXHRcdGNvbnN0IGVuY3J5cHRlZExpc3RFbGVtZW50VHlwZXM6IEFycmF5PFR5cGVSZWY8TGlzdEVsZW1lbnRFbnRpdHk+PiA9IFtcblx0XHRcdEdyb3VwSW5mb1R5cGVSZWYsXG5cdFx0XHRBdWRpdExvZ0VudHJ5VHlwZVJlZixcblx0XHRcdFdoaXRlbGFiZWxDaGlsZFR5cGVSZWYsXG5cdFx0XHRPcmRlclByb2Nlc3NpbmdBZ3JlZW1lbnRUeXBlUmVmLFxuXHRcdFx0VXNlckFsYXJtSW5mb1R5cGVSZWYsXG5cdFx0XHRSZWNlaXZlZEdyb3VwSW52aXRhdGlvblR5cGVSZWYsXG5cdFx0XHRHaWZ0Q2FyZFR5cGVSZWYsXG5cdFx0XHRQdXNoSWRlbnRpZmllclR5cGVSZWYsXG5cdFx0XVxuXG5cdFx0Zm9yIChjb25zdCB0eXBlIG9mIGVuY3J5cHRlZEVsZW1lbnRUeXBlcykge1xuXHRcdFx0YXdhaXQgbWlncmF0ZUFsbEVsZW1lbnRzKHR5cGUsIHN0b3JhZ2UsIFthZGRPd25lcktleVZlcnNpb24oKV0pXG5cdFx0fVxuXHRcdGZvciAoY29uc3QgdHlwZSBvZiBlbmNyeXB0ZWRMaXN0RWxlbWVudFR5cGVzKSB7XG5cdFx0XHRhd2FpdCBtaWdyYXRlQWxsTGlzdEVsZW1lbnRzKHR5cGUsIHN0b3JhZ2UsIFthZGRPd25lcktleVZlcnNpb24oKV0pXG5cdFx0fVxuXG5cdFx0YXdhaXQgbWlncmF0ZUFsbEVsZW1lbnRzKEdyb3VwVHlwZVJlZiwgc3RvcmFnZSwgW1xuXHRcdFx0cmVuYW1lQXR0cmlidXRlKFwia2V5c1wiLCBcImN1cnJlbnRLZXlzXCIpLFxuXHRcdFx0Y2hhbmdlQ2FyZGluYWxpdHlGcm9tQW55VG9aZXJvT3JPbmUoXCJjdXJyZW50S2V5c1wiKSxcblx0XHRcdHJlbW92ZUtleVBhaXJWZXJzaW9uKCksXG5cdFx0XHRhZGRWYWx1ZShcImZvcm1lckdyb3VwS2V5c1wiLCBudWxsKSxcblx0XHRcdGFkZFZhbHVlKFwicHViQWRtaW5Hcm91cEVuY0dLZXlcIiwgbnVsbCksXG5cdFx0XHRhZGRWYWx1ZShcImdyb3VwS2V5VmVyc2lvblwiLCBcIjBcIiksXG5cdFx0XHRhZGRBZG1pbkdyb3VwS2V5VmVyc2lvbigpLFxuXHRcdF0pXG5cblx0XHRhd2FpdCBtaWdyYXRlQWxsRWxlbWVudHMoVXNlclR5cGVSZWYsIHN0b3JhZ2UsIFthZGRWZXJzaW9uc1RvR3JvdXBNZW1iZXJzaGlwcygpLCByZW1vdmVWYWx1ZShcInVzZXJFbmNDbGllbnRLZXlcIildKVxuXHRcdGF3YWl0IG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMoUmVjZWl2ZWRHcm91cEludml0YXRpb25UeXBlUmVmLCBzdG9yYWdlLCBbYWRkVmFsdWUoXCJzaGFyZWRHcm91cEtleVZlcnNpb25cIiwgXCIwXCIpXSlcblx0XHRhd2FpdCBtaWdyYXRlQWxsRWxlbWVudHMoUmVjb3ZlckNvZGVUeXBlUmVmLCBzdG9yYWdlLCBbYWRkVmFsdWUoXCJ1c2VyS2V5VmVyc2lvblwiLCBcIjBcIildKVxuXHRcdGF3YWl0IG1pZ3JhdGVBbGxFbGVtZW50cyhVc2VyR3JvdXBSb290VHlwZVJlZiwgc3RvcmFnZSwgW2FkZFZhbHVlKFwia2V5Um90YXRpb25zXCIsIG51bGwpXSlcblx0fSxcbn1cblxuZnVuY3Rpb24gYWRkVmVyc2lvbnNUb0dyb3VwTWVtYmVyc2hpcHMoKTogTWlncmF0aW9uIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChlbnRpdHkpIHtcblx0XHRjb25zdCB1c2VyR3JvdXBNZW1iZXJzaGlwID0gZW50aXR5W1widXNlckdyb3VwXCJdXG5cdFx0dXNlckdyb3VwTWVtYmVyc2hpcFtcImdyb3VwS2V5VmVyc2lvblwiXSA9IFwiMFwiXG5cdFx0dXNlckdyb3VwTWVtYmVyc2hpcFtcInN5bUtleVZlcnNpb25cIl0gPSBcIjBcIlxuXHRcdGZvciAoY29uc3QgbWVtYmVyc2hpcCBvZiBlbnRpdHlbXCJtZW1iZXJzaGlwc1wiXSkge1xuXHRcdFx0bWVtYmVyc2hpcFtcImdyb3VwS2V5VmVyc2lvblwiXSA9IFwiMFwiXG5cdFx0XHRtZW1iZXJzaGlwW1wic3ltS2V5VmVyc2lvblwiXSA9IFwiMFwiXG5cdFx0fVxuXHRcdHJldHVybiBlbnRpdHlcblx0fVxufVxuXG5mdW5jdGlvbiBhZGRBZG1pbkdyb3VwS2V5VmVyc2lvbigpOiBNaWdyYXRpb24ge1xuXHRyZXR1cm4gZnVuY3Rpb24gKGVudGl0eSkge1xuXHRcdGVudGl0eVtcImFkbWluR3JvdXBLZXlWZXJzaW9uXCJdID0gZW50aXR5W1wiYWRtaW5Hcm91cEVuY0dLZXlcIl0gPT0gbnVsbCA/IG51bGwgOiBcIjBcIlxuXHRcdHJldHVybiBlbnRpdHlcblx0fVxufVxuXG5mdW5jdGlvbiByZW1vdmVLZXlQYWlyVmVyc2lvbigpOiBNaWdyYXRpb24ge1xuXHRyZXR1cm4gZnVuY3Rpb24gKGVudGl0eSkge1xuXHRcdGNvbnN0IGN1cnJlbnRLZXlzID0gZW50aXR5W1wiY3VycmVudEtleXNcIl1cblx0XHRpZiAoY3VycmVudEtleXMpIHtcblx0XHRcdGRlbGV0ZSBjdXJyZW50S2V5c1tcInZlcnNpb25cIl1cblx0XHR9XG5cdFx0cmV0dXJuIGVudGl0eVxuXHR9XG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgYWRkT3duZXJLZXlWZXJzaW9uLCBhZGRWYWx1ZSwgbWlncmF0ZUFsbEVsZW1lbnRzLCBtaWdyYXRlQWxsTGlzdEVsZW1lbnRzLCBNaWdyYXRpb24sIHJlbW92ZVZhbHVlLCByZW5hbWVBdHRyaWJ1dGUgfSBmcm9tIFwiLi4vU3RhbmRhcmRNaWdyYXRpb25zLmpzXCJcbmltcG9ydCB7IEVsZW1lbnRFbnRpdHksIExpc3RFbGVtZW50RW50aXR5LCBTb21lRW50aXR5IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9FbnRpdHlUeXBlcy5qc1wiXG5pbXBvcnQgeyBUeXBlUmVmIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQge1xuXHRDYWxlbmRhckV2ZW50VHlwZVJlZixcblx0Q2FsZW5kYXJFdmVudFVwZGF0ZVR5cGVSZWYsXG5cdENhbGVuZGFyR3JvdXBSb290VHlwZVJlZixcblx0Q29udGFjdExpc3RFbnRyeVR5cGVSZWYsXG5cdENvbnRhY3RMaXN0R3JvdXBSb290VHlwZVJlZixcblx0Q29udGFjdExpc3RUeXBlUmVmLFxuXHRDb250YWN0VHlwZVJlZixcblx0RW1haWxUZW1wbGF0ZVR5cGVSZWYsXG5cdEZpbGVTeXN0ZW1UeXBlUmVmLFxuXHRGaWxlVHlwZVJlZixcblx0S25vd2xlZGdlQmFzZUVudHJ5VHlwZVJlZixcblx0TWFpbGJveFByb3BlcnRpZXNUeXBlUmVmLFxuXHRNYWlsQm94VHlwZVJlZixcblx0TWFpbERldGFpbHNCbG9iVHlwZVJlZixcblx0TWFpbERldGFpbHNEcmFmdFR5cGVSZWYsXG5cdE1haWxGb2xkZXJUeXBlUmVmLFxuXHRNYWlsVHlwZVJlZixcblx0VGVtcGxhdGVHcm91cFJvb3RUeXBlUmVmLFxuXHRUdXRhbm90YVByb3BlcnRpZXNUeXBlUmVmLFxuXHRVc2VyU2V0dGluZ3NHcm91cFJvb3RUeXBlUmVmLFxufSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgQ3J5cHRvUHJvdG9jb2xWZXJzaW9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5cbmV4cG9ydCBjb25zdCB0dXRhbm90YTY5OiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwidHV0YW5vdGFcIixcblx0dmVyc2lvbjogNjksXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UpIHtcblx0XHRjb25zdCBlbmNyeXB0ZWRFbGVtZW50VHlwZXM6IEFycmF5PFR5cGVSZWY8RWxlbWVudEVudGl0eT4+ID0gW1xuXHRcdFx0RmlsZVN5c3RlbVR5cGVSZWYsXG5cdFx0XHRNYWlsQm94VHlwZVJlZixcblx0XHRcdENvbnRhY3RMaXN0VHlwZVJlZixcblx0XHRcdFR1dGFub3RhUHJvcGVydGllc1R5cGVSZWYsXG5cdFx0XHRDYWxlbmRhckdyb3VwUm9vdFR5cGVSZWYsXG5cdFx0XHRVc2VyU2V0dGluZ3NHcm91cFJvb3RUeXBlUmVmLFxuXHRcdFx0Q29udGFjdExpc3RHcm91cFJvb3RUeXBlUmVmLFxuXHRcdFx0TWFpbGJveFByb3BlcnRpZXNUeXBlUmVmLFxuXHRcdFx0VGVtcGxhdGVHcm91cFJvb3RUeXBlUmVmLFxuXHRcdF1cblxuXHRcdGNvbnN0IGVuY3J5cHRlZExpc3RFbGVtZW50VHlwZXM6IEFycmF5PFR5cGVSZWY8TGlzdEVsZW1lbnRFbnRpdHk+PiA9IFtcblx0XHRcdEZpbGVUeXBlUmVmLFxuXHRcdFx0Q29udGFjdFR5cGVSZWYsXG5cdFx0XHRNYWlsVHlwZVJlZixcblx0XHRcdE1haWxGb2xkZXJUeXBlUmVmLFxuXHRcdFx0Q2FsZW5kYXJFdmVudFR5cGVSZWYsXG5cdFx0XHRDYWxlbmRhckV2ZW50VXBkYXRlVHlwZVJlZixcblx0XHRcdEVtYWlsVGVtcGxhdGVUeXBlUmVmLFxuXHRcdFx0TWFpbERldGFpbHNEcmFmdFR5cGVSZWYsXG5cdFx0XHRNYWlsRGV0YWlsc0Jsb2JUeXBlUmVmLFxuXHRcdFx0Q29udGFjdExpc3RFbnRyeVR5cGVSZWYsXG5cdFx0XHRLbm93bGVkZ2VCYXNlRW50cnlUeXBlUmVmLFxuXHRcdF1cblxuXHRcdGZvciAoY29uc3QgdHlwZSBvZiBlbmNyeXB0ZWRFbGVtZW50VHlwZXMpIHtcblx0XHRcdGF3YWl0IG1pZ3JhdGVBbGxFbGVtZW50cyh0eXBlLCBzdG9yYWdlLCBbYWRkT3duZXJLZXlWZXJzaW9uKCldKVxuXHRcdH1cblx0XHRmb3IgKGNvbnN0IHR5cGUgb2YgZW5jcnlwdGVkTGlzdEVsZW1lbnRUeXBlcykge1xuXHRcdFx0YXdhaXQgbWlncmF0ZUFsbExpc3RFbGVtZW50cyh0eXBlLCBzdG9yYWdlLCBbYWRkT3duZXJLZXlWZXJzaW9uKCldKVxuXHRcdH1cblxuXHRcdGF3YWl0IG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMoTWFpbFR5cGVSZWYsIHN0b3JhZ2UsIFthZGRWZXJzaW9uc1RvQnVja2V0S2V5KCldKVxuXHRcdGF3YWl0IG1pZ3JhdGVBbGxFbGVtZW50cyhUdXRhbm90YVByb3BlcnRpZXNUeXBlUmVmLCBzdG9yYWdlLCBbcmVuYW1lQXR0cmlidXRlKFwiZ3JvdXBFbmNFbnRyb3B5XCIsIFwidXNlckVuY0VudHJvcHlcIiksIGFkZFZhbHVlKFwidXNlcktleVZlcnNpb25cIiwgbnVsbCldKVxuXHRcdGF3YWl0IG1pZ3JhdGVBbGxFbGVtZW50cyhNYWlsQm94VHlwZVJlZiwgc3RvcmFnZSwgW3JlbW92ZVZhbHVlKFwic3ltRW5jU2hhcmVCdWNrZXRLZXlcIildKVxuXHR9LFxufVxuXG5mdW5jdGlvbiBhZGRWZXJzaW9uc1RvQnVja2V0S2V5KCk6IE1pZ3JhdGlvbiB7XG5cdHJldHVybiBmdW5jdGlvbiAoZW50aXR5KSB7XG5cdFx0Y29uc3QgYnVja2V0S2V5ID0gZW50aXR5W1wiYnVja2V0S2V5XCJdXG5cdFx0aWYgKGJ1Y2tldEtleSAhPSBudWxsKSB7XG5cdFx0XHRidWNrZXRLZXlbXCJyZWNpcGllbnRLZXlWZXJzaW9uXCJdID0gXCIwXCJcblx0XHRcdGJ1Y2tldEtleVtcInNlbmRlcktleVZlcnNpb25cIl0gPSBidWNrZXRLZXlbXCJwcm90b2NvbFZlcnNpb25cIl0gPT09IENyeXB0b1Byb3RvY29sVmVyc2lvbi5UVVRBX0NSWVBUID8gXCIwXCIgOiBudWxsXG5cdFx0XHRmb3IgKGNvbnN0IGluc3RhbmNlU2Vzc2lvbktleSBvZiBidWNrZXRLZXlbXCJidWNrZXRFbmNTZXNzaW9uS2V5c1wiXSkge1xuXHRcdFx0XHRpbnN0YW5jZVNlc3Npb25LZXlbXCJzeW1LZXlWZXJzaW9uXCJdID0gXCIwXCJcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGVudGl0eVxuXHR9XG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgQ3VzdG9tZXJUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBtaWdyYXRlQWxsRWxlbWVudHMsIHJlbW92ZVZhbHVlIH0gZnJvbSBcIi4uL1N0YW5kYXJkTWlncmF0aW9ucy5qc1wiXG5cbmV4cG9ydCBjb25zdCBzeXM5NzogT2ZmbGluZU1pZ3JhdGlvbiA9IHtcblx0YXBwOiBcInN5c1wiLFxuXHR2ZXJzaW9uOiA5Nyxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRcdC8vIEFzIG9mIDIwMjAgdGhlIGNhbmNlbGVkUHJlbWl1bUFjY291bnQgYm9vbGVhbiB2YWx1ZSBoYXMgYWx3YXlzIGJlZW4gc2V0IHRvXG5cdFx0Ly8gZmFsc2UgdGhlcmVmb3JlIHRoaXMgdmFsdWUgaXMgbm8gbG9uZ2VyIG5lZWRlZCwgYW5kIHdlIGNhbiByZW1vdmUgaXQuXG5cdFx0YXdhaXQgbWlncmF0ZUFsbEVsZW1lbnRzKEN1c3RvbWVyVHlwZVJlZiwgc3RvcmFnZSwgW3JlbW92ZVZhbHVlKFwiY2FuY2VsZWRQcmVtaXVtQWNjb3VudFwiKV0pXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlIH0gZnJvbSBcIi4uL1N0YW5kYXJkTWlncmF0aW9ucy5qc1wiXG5pbXBvcnQgeyBSZWNlaXZlZEdyb3VwSW52aXRhdGlvblR5cGVSZWYsIFNlbnRHcm91cEludml0YXRpb25UeXBlUmVmLCBVc2VyR3JvdXBSb290VHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuXG5leHBvcnQgY29uc3QgdHV0YW5vdGE3MTogT2ZmbGluZU1pZ3JhdGlvbiA9IHtcblx0YXBwOiBcInR1dGFub3RhXCIsXG5cdHZlcnNpb246IDcxLFxuXHRhc3luYyBtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0YXdhaXQgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlKHN0b3JhZ2UsIFVzZXJHcm91cFJvb3RUeXBlUmVmKVxuXHRcdGF3YWl0IGRlbGV0ZUluc3RhbmNlc09mVHlwZShzdG9yYWdlLCBSZWNlaXZlZEdyb3VwSW52aXRhdGlvblR5cGVSZWYpXG5cdFx0YXdhaXQgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlKHN0b3JhZ2UsIFNlbnRHcm91cEludml0YXRpb25UeXBlUmVmKVxuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcblxuZXhwb3J0IGNvbnN0IHN5czk5OiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwic3lzXCIsXG5cdHZlcnNpb246IDk5LFxuXHRhc3luYyBtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0Ly8gb25seSBjaGFuZ2VzIE1pc3NlZE5vdGlmaWNhdGlvbiB3aGljaCB3ZSBkbyBub3QgbG9hZCBub3IgY2FjaGVcblx0fSxcbn1cbiIsImltcG9ydCB7IE9mZmxpbmVNaWdyYXRpb24gfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2VNaWdyYXRvci5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZS5qc1wiXG5pbXBvcnQgeyBTcWxDaXBoZXJGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvU3FsQ2lwaGVyRmFjYWRlLmpzXCJcblxuZXhwb3J0IGNvbnN0IHN5czEwMTogT2ZmbGluZU1pZ3JhdGlvbiA9IHtcblx0YXBwOiBcInN5c1wiLFxuXHR2ZXJzaW9uOiAxMDEsXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UsIHNxbENpcGhlckZhY2FkZTogU3FsQ2lwaGVyRmFjYWRlKSB7XG5cdFx0Ly8gbm8gY2FjaGVkIHR5cGVzIGhhdmUgYmVlbiBtb2RpZmllZFxuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IFNxbENpcGhlckZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9TcWxDaXBoZXJGYWNhZGUuanNcIlxuaW1wb3J0IHsgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlIH0gZnJvbSBcIi4uL1N0YW5kYXJkTWlncmF0aW9ucy5qc1wiXG5pbXBvcnQgeyBHcm91cFR5cGVSZWYsIFVzZXJHcm91cFJvb3RUeXBlUmVmLCBVc2VyVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuXG5leHBvcnQgY29uc3Qgc3lzMTAyOiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwic3lzXCIsXG5cdHZlcnNpb246IDEwMixcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSwgc3FsQ2lwaGVyRmFjYWRlOiBTcWxDaXBoZXJGYWNhZGUpIHtcblx0XHRhd2FpdCBkZWxldGVJbnN0YW5jZXNPZlR5cGUoc3RvcmFnZSwgVXNlckdyb3VwUm9vdFR5cGVSZWYpIC8vIHRvIGVuc3VyZSBrZXlSb3RhdGlvbnMgaXMgcG9wdWxhdGVkXG5cdFx0YXdhaXQgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlKHN0b3JhZ2UsIEdyb3VwVHlwZVJlZikgLy8gdG8gZW5zdXJlIGZvcm1lckdyb3VwS2V5cyBpcyBwb3B1bGF0ZWRcblx0XHQvLyBXZSBhbHNvIGRlbGV0ZSBVc2VyVHlwZSByZWYgdG8gZGlzYWJsZSBvZmZsaW5lIGxvZ2luLiBPdGhlcndpc2UsIGNsaWVudHMgd2lsbCBzZWUgYW4gdW5leHBlY3RlZCBlcnJvciBtZXNzYWdlIHdpdGggcHVyZSBvZmZsaW5lIGxvZ2luLlxuXHRcdGF3YWl0IGRlbGV0ZUluc3RhbmNlc09mVHlwZShzdG9yYWdlLCBVc2VyVHlwZVJlZilcblx0fSxcbn1cbiIsImltcG9ydCB7IE9mZmxpbmVNaWdyYXRpb24gfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2VNaWdyYXRvci5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZS5qc1wiXG5cbmV4cG9ydCBjb25zdCB0dXRhbm90YTcyOiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwidHV0YW5vdGFcIixcblx0dmVyc2lvbjogNzIsXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UpIHtcblx0XHQvLyBvbmx5IGRhdGEgdHJhbnNmZXIgdHlwZXMgaGF2ZSBiZWVuIG1vZGlmaWVkXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgU3FsQ2lwaGVyRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1NxbENpcGhlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBkZWxldGVJbnN0YW5jZXNPZlR5cGUgfSBmcm9tIFwiLi4vU3RhbmRhcmRNaWdyYXRpb25zLmpzXCJcbmltcG9ydCB7IEFjY291bnRpbmdJbmZvVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuXG5leHBvcnQgY29uc3Qgc3lzMTAzOiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwic3lzXCIsXG5cdHZlcnNpb246IDEwMyxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSwgc3FsQ2lwaGVyRmFjYWRlOiBTcWxDaXBoZXJGYWNhZGUpIHtcblx0XHQvLyBkZWxldGUgQWNjb3VudGluZ0luZm8gdG8gbWFrZSBzdXJlIGFwcFN0b3JlU3Vic2NyaXB0aW9uIGlzIG5vdCBtaXNzaW5nIGZyb20gb2ZmbG5lIGRiXG5cdFx0YXdhaXQgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlKHN0b3JhZ2UsIEFjY291bnRpbmdJbmZvVHlwZVJlZilcblx0fSxcbn1cbiIsImltcG9ydCB7IE9mZmxpbmVNaWdyYXRpb24gfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2VNaWdyYXRvci5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZS5qc1wiXG5pbXBvcnQgeyBtaWdyYXRlQWxsRWxlbWVudHMsIG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMsIHJlbW92ZVZhbHVlIH0gZnJvbSBcIi4uL1N0YW5kYXJkTWlncmF0aW9ucy5qc1wiXG5pbXBvcnQgeyBDb250YWN0VHlwZVJlZiwgRmlsZVR5cGVSZWYsIE1haWxCb3hUeXBlUmVmLCBNYWlsRm9sZGVyVHlwZVJlZiwgTWFpbFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuXG5leHBvcnQgY29uc3QgdHV0YW5vdGE3MzogT2ZmbGluZU1pZ3JhdGlvbiA9IHtcblx0YXBwOiBcInR1dGFub3RhXCIsXG5cdHZlcnNpb246IDczLFxuXHRhc3luYyBtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0Ly8gdGhlIFR1dGFub3RhTW9kZWxWNzMgZmluYWxseSByZW1vdmVzIGFsbCBsZWdhY3kgbWFpbCAod2l0aG91dCBNYWlsRGV0YWlscykgYXR0cmlidXRlcyBhbmQgdHlwZXNcblx0XHQvLyBhbGwgbWFpbHMgbXVzdCB1c2UgTWFpbERldGFpbHMgbm93XG5cdFx0YXdhaXQgbWlncmF0ZUFsbExpc3RFbGVtZW50cyhNYWlsVHlwZVJlZiwgc3RvcmFnZSwgW1xuXHRcdFx0cmVtb3ZlVmFsdWUoXCJib2R5XCIpLFxuXHRcdFx0cmVtb3ZlVmFsdWUoXCJ0b1JlY2lwaWVudHNcIiksXG5cdFx0XHRyZW1vdmVWYWx1ZShcImNjUmVjaXBpZW50c1wiKSxcblx0XHRcdHJlbW92ZVZhbHVlKFwiYmNjUmVjaXBpZW50c1wiKSxcblx0XHRcdHJlbW92ZVZhbHVlKFwicmVwbHlUb3NcIiksXG5cdFx0XHRyZW1vdmVWYWx1ZShcImhlYWRlcnNcIiksXG5cdFx0XHRyZW1vdmVWYWx1ZShcInNlbnREYXRlXCIpLFxuXHRcdF0pXG5cblx0XHQvLyBjbGVhbnVwIFR1dGFub3RhTW9kZWxcblx0XHRhd2FpdCBtaWdyYXRlQWxsRWxlbWVudHMoTWFpbEJveFR5cGVSZWYsIHN0b3JhZ2UsIFtyZW1vdmVWYWx1ZShcIm1haWxzXCIpXSlcblx0XHRhd2FpdCBtaWdyYXRlQWxsTGlzdEVsZW1lbnRzKE1haWxGb2xkZXJUeXBlUmVmLCBzdG9yYWdlLCBbcmVtb3ZlVmFsdWUoXCJzdWJGb2xkZXJzXCIpXSlcblxuXHRcdC8vIHJlbW92aW5nIFZhbHVlLk9MRF9PV05FUl9HUk9VUF9OQU1FLCBhbmQgVmFsdWUuT0xEX0FSRUFfSURfTkFNRSBmcm9tIEZJTEVfVFlQRSBhbmQgQ09OVEFDVF9UWVBFXG5cdFx0YXdhaXQgbWlncmF0ZUFsbExpc3RFbGVtZW50cyhGaWxlVHlwZVJlZiwgc3RvcmFnZSwgW3JlbW92ZVZhbHVlKFwiX293bmVyXCIpLCByZW1vdmVWYWx1ZShcIl9hcmVhXCIpXSlcblx0XHRhd2FpdCBtaWdyYXRlQWxsTGlzdEVsZW1lbnRzKENvbnRhY3RUeXBlUmVmLCBzdG9yYWdlLCBbXG5cdFx0XHRyZW1vdmVWYWx1ZShcIl9vd25lclwiKSxcblx0XHRcdHJlbW92ZVZhbHVlKFwiX2FyZWFcIiksXG5cdFx0XHRyZW1vdmVWYWx1ZShcImF1dG9UcmFuc21pdFBhc3N3b3JkXCIpLCAvLyBhdXRvVHJhbnNtaXRQYXNzd29yZCBoYXMgYmVlbiByZW1vdmVkIGZyb20gQ29udGFjdFR5cGVcblx0XHRdKVxuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IFNxbENpcGhlckZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9TcWxDaXBoZXJGYWNhZGUuanNcIlxuaW1wb3J0IHsgbWlncmF0ZUFsbEVsZW1lbnRzLCByZW1vdmVWYWx1ZSB9IGZyb20gXCIuLi9TdGFuZGFyZE1pZ3JhdGlvbnMuanNcIlxuaW1wb3J0IHsgVXNlclR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcblxuZXhwb3J0IGNvbnN0IHN5czEwNDogT2ZmbGluZU1pZ3JhdGlvbiA9IHtcblx0YXBwOiBcInN5c1wiLFxuXHR2ZXJzaW9uOiAxMDQsXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UsIF86IFNxbENpcGhlckZhY2FkZSkge1xuXHRcdC8vIFN5c3RlbU1vZGVsVjEwNCByZW1vdmVzIHBob25lTnVtYmVycyBmcm9tIHRoZSBVU0VSX1RZUEVcblx0XHRhd2FpdCBtaWdyYXRlQWxsRWxlbWVudHMoVXNlclR5cGVSZWYsIHN0b3JhZ2UsIFtyZW1vdmVWYWx1ZShcInBob25lTnVtYmVyc1wiKV0pXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgU3FsQ2lwaGVyRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1NxbENpcGhlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBkZWxldGVJbnN0YW5jZXNPZlR5cGUgfSBmcm9tIFwiLi4vU3RhbmRhcmRNaWdyYXRpb25zLmpzXCJcbmltcG9ydCB7IFB1c2hJZGVudGlmaWVyVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuXG5leHBvcnQgY29uc3Qgc3lzMTA1OiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwic3lzXCIsXG5cdHZlcnNpb246IDEwNSxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSwgXzogU3FsQ2lwaGVyRmFjYWRlKSB7XG5cdFx0YXdhaXQgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlKHN0b3JhZ2UsIFB1c2hJZGVudGlmaWVyVHlwZVJlZilcblx0fSxcbn1cbiIsImltcG9ydCB7IE9mZmxpbmVNaWdyYXRpb24gfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2VNaWdyYXRvci5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZS5qc1wiXG5cbmV4cG9ydCBjb25zdCBzeXMxMDY6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJzeXNcIixcblx0dmVyc2lvbjogMTA2LFxuXHRhc3luYyBtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0Ly8gb25seSBjaGFuZ2VzIGRhdGEgdHJhbnNmZXIgdHlwZVxuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IGFkZFZhbHVlLCBkZWxldGVJbnN0YW5jZXNPZlR5cGUsIG1pZ3JhdGVBbGxFbGVtZW50cywgbWlncmF0ZUFsbExpc3RFbGVtZW50cyB9IGZyb20gXCIuLi9TdGFuZGFyZE1pZ3JhdGlvbnMuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudFR5cGVSZWYsIGNyZWF0ZU1haWwsIGNyZWF0ZU1haWxCb3gsIE1haWxCb3hUeXBlUmVmLCBNYWlsRm9sZGVyVHlwZVJlZiwgTWFpbFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgR0VORVJBVEVEX01JTl9JRCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuXG5leHBvcnQgY29uc3QgdHV0YW5vdGE3NDogT2ZmbGluZU1pZ3JhdGlvbiA9IHtcblx0YXBwOiBcInR1dGFub3RhXCIsXG5cdHZlcnNpb246IDc0LFxuXHRhc3luYyBtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0Ly8gdGhlIFR1dGFub3RhTW9kZWxWNzQgaW50cm9kdWNlcyBNYWlsU2V0cyB0byBzdXBwb3J0IGltcG9ydCBhbmQgbGFiZWxzXG5cdFx0YXdhaXQgbWlncmF0ZUFsbExpc3RFbGVtZW50cyhNYWlsRm9sZGVyVHlwZVJlZiwgc3RvcmFnZSwgW1xuXHRcdFx0YWRkVmFsdWUoXCJpc0xhYmVsXCIsIGZhbHNlKSxcblx0XHRcdGFkZFZhbHVlKFwiaXNNYWlsU2V0XCIsIGZhbHNlKSxcblx0XHRcdGFkZFZhbHVlKFwiZW50cmllc1wiLCBHRU5FUkFURURfTUlOX0lEKSxcblx0XHRdKVxuXHRcdGF3YWl0IG1pZ3JhdGVBbGxFbGVtZW50cyhNYWlsQm94VHlwZVJlZiwgc3RvcmFnZSwgW2NyZWF0ZU1haWxCb3hdKSAvLyBpbml0aWFsaXplIG1haWxiYWdzXG5cdFx0YXdhaXQgbWlncmF0ZUFsbExpc3RFbGVtZW50cyhNYWlsVHlwZVJlZiwgc3RvcmFnZSwgW2NyZWF0ZU1haWxdKSAvLyBpbml0aWFsaXplIHNldHNcblxuXHRcdC8vIHdlIG5lZWQgdG8gZGVsZXRlIGFsbCBDYWxlbmRhckV2ZW50cyBzaW5jZSB3ZSBjaGFuZ2VkIHRoZSBmb3JtYXQgZm9yIHN0b3JpbmcgY3VzdG9tSWRzIChDYWxlbmRhckV2ZW50cyB1c2UgY3VzdG9tSWRzKSBpbiB0aGUgb2ZmbGluZSBkYXRhYmFzZVxuXHRcdC8vIGFsbCBlbnRpdGllcyB3aXRoIGN1c3RvbUlkcywgdGhhdCBhcmUgc3RvcmVkIGluIHRoZSBvZmZsaW5lIGRhdGFiYXNlIChlLmcuIENhbGVuZGFyRXZlbnQsIE1haWxTZXRFbnRyeSksXG5cdFx0Ly8gYXJlIGZyb20gbm93IG9uIHN0b3JlZCBpbiB0aGUgb2ZmbGluZSBkYXRhYmFzZSB1c2luZyBhICoqYmFzZTY0RXh0KiogZW5jb2RlZCBpZCBzdHJpbmdcblx0XHRhd2FpdCBkZWxldGVJbnN0YW5jZXNPZlR5cGUoc3RvcmFnZSwgQ2FsZW5kYXJFdmVudFR5cGVSZWYpXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuXG5leHBvcnQgY29uc3Qgc3lzMTA3OiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwic3lzXCIsXG5cdHZlcnNpb246IDEwNyxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRcdC8vIG9ubHkgY2hhbmdlcyBkYXRhIHRyYW5zZmVyIHR5cGVcblx0fSxcbn1cbiIsImltcG9ydCB7IE9mZmxpbmVNaWdyYXRpb24gfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2VNaWdyYXRvci5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZS5qc1wiXG5pbXBvcnQgeyBkZWxldGVJbnN0YW5jZXNPZlR5cGUgfSBmcm9tIFwiLi4vU3RhbmRhcmRNaWdyYXRpb25zLmpzXCJcbmltcG9ydCB7IFVzZXJTZXR0aW5nc0dyb3VwUm9vdFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgQXVkaXRMb2dFbnRyeVR5cGVSZWYsIEdyb3VwSW5mb1R5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEdyb3VwVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgZ2V0RWxlbWVudElkLCBnZXRMaXN0SWQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcblxuZXhwb3J0IGNvbnN0IHR1dGFub3RhNzU6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJ0dXRhbm90YVwiLFxuXHR2ZXJzaW9uOiA3NSxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRcdGF3YWl0IGRlbGV0ZUluc3RhbmNlc09mVHlwZShzdG9yYWdlLCBVc2VyU2V0dGluZ3NHcm91cFJvb3RUeXBlUmVmKVxuXHRcdC8vIHJlcXVpcmVkIHRvIHRocm93IHRoZSBMb2dpbkluY29tcGxldGVFcnJvciB3aGVuIHRyeWluZyBhc3luYyBsb2dpblxuXHRcdGNvbnN0IGdyb3VwSW5mb3MgPSBhd2FpdCBzdG9yYWdlLmdldFJhd0xpc3RFbGVtZW50c09mVHlwZShHcm91cEluZm9UeXBlUmVmKVxuXHRcdGZvciAoY29uc3QgZ3JvdXBJbmZvIG9mIGdyb3VwSW5mb3MpIHtcblx0XHRcdGlmICgoZ3JvdXBJbmZvIGFzIGFueSkuZ3JvdXBUeXBlICE9PSBHcm91cFR5cGUuVXNlcikgY29udGludWVcblx0XHRcdGF3YWl0IHN0b3JhZ2UuZGVsZXRlSWZFeGlzdHMoR3JvdXBJbmZvVHlwZVJlZiwgZ2V0TGlzdElkKGdyb3VwSW5mbyksIGdldEVsZW1lbnRJZChncm91cEluZm8pKVxuXHRcdH1cblx0XHRhd2FpdCBkZWxldGVJbnN0YW5jZXNPZlR5cGUoc3RvcmFnZSwgQXVkaXRMb2dFbnRyeVR5cGVSZWYpXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgYWRkVmFsdWUsIG1pZ3JhdGVBbGxFbGVtZW50cywgbWlncmF0ZUFsbExpc3RFbGVtZW50cywgcmVtb3ZlVmFsdWUgfSBmcm9tIFwiLi4vU3RhbmRhcmRNaWdyYXRpb25zLmpzXCJcbmltcG9ydCB7IEdyb3VwS2V5VHlwZVJlZiwgR3JvdXBUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5cbmV4cG9ydCBjb25zdCBzeXMxMTE6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJzeXNcIixcblx0dmVyc2lvbjogMTExLFxuXHRhc3luYyBtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0YXdhaXQgbWlncmF0ZUFsbEVsZW1lbnRzKEdyb3VwVHlwZVJlZiwgc3RvcmFnZSwgW3JlbW92ZVZhbHVlKFwicHViQWRtaW5Hcm91cEVuY0dLZXlcIiksIGFkZFZhbHVlKFwicHViQWRtaW5Hcm91cEVuY0dLZXlcIiwgbnVsbCldKVxuXHRcdGF3YWl0IG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMoR3JvdXBLZXlUeXBlUmVmLCBzdG9yYWdlLCBbcmVtb3ZlVmFsdWUoXCJwdWJBZG1pbkdyb3VwRW5jR0tleVwiKSwgYWRkVmFsdWUoXCJwdWJBZG1pbkdyb3VwRW5jR0tleVwiLCBudWxsKV0pXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlLCBtaWdyYXRlQWxsRWxlbWVudHMsIHJlbW92ZVZhbHVlIH0gZnJvbSBcIi4uL1N0YW5kYXJkTWlncmF0aW9uc1wiXG5pbXBvcnQgeyBNYWlsYm94R3JvdXBSb290VHlwZVJlZiwgTWFpbEJveFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnNcIlxuaW1wb3J0IHsgVXNlckdyb3VwUm9vdFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvc3lzL1R5cGVSZWZzXCJcblxuZXhwb3J0IGNvbnN0IHR1dGFub3RhNzY6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJ0dXRhbm90YVwiLFxuXHR2ZXJzaW9uOiA3Nixcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRcdGF3YWl0IG1pZ3JhdGVBbGxFbGVtZW50cyhNYWlsYm94R3JvdXBSb290VHlwZVJlZiwgc3RvcmFnZSwgW3JlbW92ZVZhbHVlKFwid2hpdGVsaXN0UmVxdWVzdHNcIildKVxuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IG1pZ3JhdGVBbGxFbGVtZW50cywgcmVtb3ZlVmFsdWUgfSBmcm9tIFwiLi4vU3RhbmRhcmRNaWdyYXRpb25zXCJcbmltcG9ydCB7IE1haWxib3hHcm91cFJvb3RUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzXCJcblxuZXhwb3J0IGNvbnN0IHN5czExMjogT2ZmbGluZU1pZ3JhdGlvbiA9IHtcblx0YXBwOiBcInN5c1wiLFxuXHR2ZXJzaW9uOiAxMTIsXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UpIHtcblx0XHRhd2FpdCBtaWdyYXRlQWxsRWxlbWVudHMoTWFpbGJveEdyb3VwUm9vdFR5cGVSZWYsIHN0b3JhZ2UsIFtyZW1vdmVWYWx1ZShcIndoaXRlbGlzdGVkRG9tYWluc1wiKV0pXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgYWRkVmFsdWUsIGRlbGV0ZUluc3RhbmNlc09mVHlwZSwgbWlncmF0ZUFsbExpc3RFbGVtZW50cywgcmVtb3ZlVmFsdWUgfSBmcm9tIFwiLi4vU3RhbmRhcmRNaWdyYXRpb25zXCJcbmltcG9ydCB7IE1haWxGb2xkZXJUeXBlUmVmLCBUdXRhbm90YVByb3BlcnRpZXNUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzXCJcblxuZXhwb3J0IGNvbnN0IHR1dGFub3RhNzc6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJ0dXRhbm90YVwiLFxuXHR2ZXJzaW9uOiA3Nyxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRcdGF3YWl0IG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMoTWFpbEZvbGRlclR5cGVSZWYsIHN0b3JhZ2UsIFtyZW1vdmVWYWx1ZShcImlzTGFiZWxcIiksIGFkZFZhbHVlKFwiY29sb3JcIiwgbnVsbCldKVxuXHRcdGF3YWl0IGRlbGV0ZUluc3RhbmNlc09mVHlwZShzdG9yYWdlLCBUdXRhbm90YVByb3BlcnRpZXNUeXBlUmVmKVxuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMsIE1pZ3JhdGlvbiB9IGZyb20gXCIuLi9TdGFuZGFyZE1pZ3JhdGlvbnNcIlxuaW1wb3J0IHsgQ3VzdG9tZXJJbmZvVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgU29tZUVudGl0eSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vRW50aXR5VHlwZXMuanNcIlxuXG5leHBvcnQgY29uc3Qgc3lzMTE0OiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwic3lzXCIsXG5cdHZlcnNpb246IDExNCxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRcdGF3YWl0IG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMoQ3VzdG9tZXJJbmZvVHlwZVJlZiwgc3RvcmFnZSwgW2FkZFVubGltaXRlZExhYmVsc1RvUGxhbkNvbmZpZ3VyYXRpb24oKV0pXG5cdH0sXG59XG5cbmZ1bmN0aW9uIGFkZFVubGltaXRlZExhYmVsc1RvUGxhbkNvbmZpZ3VyYXRpb24oKTogTWlncmF0aW9uIHtcblx0cmV0dXJuIGZ1bmN0aW9uIGFkZFVubGltaXRlZExhYmVsc1RvUGxhbkNvbmZpZ3VyYXRpb25NaWdyYXRpb24oZW50aXR5OiBhbnkpOiBTb21lRW50aXR5IHtcblx0XHRpZiAoZW50aXR5LmN1c3RvbVBsYW4gIT0gbnVsbCkge1xuXHRcdFx0ZW50aXR5LmN1c3RvbVBsYW4udW5saW1pdGVkTGFiZWxzID0gZmFsc2Vcblx0XHR9XG5cdFx0cmV0dXJuIGVudGl0eVxuXHR9XG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZS5qc1wiXG5pbXBvcnQgeyBTcWxDaXBoZXJGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvU3FsQ2lwaGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IGFkZFZhbHVlLCBkZWxldGVJbnN0YW5jZXNPZlR5cGUsIG1pZ3JhdGVBbGxFbGVtZW50cyB9IGZyb20gXCIuLi9TdGFuZGFyZE1pZ3JhdGlvbnMuanNcIlxuaW1wb3J0IHsgVHV0YW5vdGFQcm9wZXJ0aWVzVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuXG4vKipcbiAqIE1pZ3JhdGlvbiB0byBwYXRjaCB1cCB0aGUgYnJva2VuIHR1dGFub3RhLXY3NyBtaWdyYXRpb24uXG4gKlxuICogV2Ugd3JpdGUgZGVmYXVsdCB2YWx1ZSB3aGljaCBtaWdodCBiZSBvdXQgb2Ygc3luYyB3aXRoIHRoZSBzZXJ2ZXIgYnV0IHdlIGhhdmUgYW4gZXh0cmEgY2hlY2sgZm9yIHRoYXQgd2hlcmVcbiAqIHdlIHVzZSB0aGlzIHByb3BlcnR5LlxuICovXG5leHBvcnQgY29uc3Qgb2ZmbGluZTI6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJvZmZsaW5lXCIsXG5cdHZlcnNpb246IDIsXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UsIF86IFNxbENpcGhlckZhY2FkZSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGF3YWl0IG1pZ3JhdGVBbGxFbGVtZW50cyhUdXRhbm90YVByb3BlcnRpZXNUeXBlUmVmLCBzdG9yYWdlLCBbYWRkVmFsdWUoXCJkZWZhdWx0TGFiZWxDcmVhdGVkXCIsIGZhbHNlKV0pXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuXG5leHBvcnQgY29uc3Qgc3lzMTE1OiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwic3lzXCIsXG5cdHZlcnNpb246IDExNSxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge1xuXHRcdC8vIE5vdGhpbmcgdG8gbWlncmF0ZSBoZXJlLCBvbmx5IEFwcCBTdG9yZSBzdWJzY3JpcHRpb24gY2hhbmdlc1xuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IGFkZFZhbHVlLCBkZWxldGVJbnN0YW5jZXNPZlR5cGUsIG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMsIHJlbW92ZVZhbHVlIH0gZnJvbSBcIi4uL1N0YW5kYXJkTWlncmF0aW9uc1wiXG5pbXBvcnQgeyBNYWlsRm9sZGVyVHlwZVJlZiwgVHV0YW5vdGFQcm9wZXJ0aWVzVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmc1wiXG5cbmV4cG9ydCBjb25zdCB0dXRhbm90YTc4OiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwidHV0YW5vdGFcIixcblx0dmVyc2lvbjogNzgsXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UpIHt9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmV4cG9ydCBjb25zdCBzeXMxMTY6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJzeXNcIixcblx0dmVyc2lvbjogMTE2LFxuXHRhc3luYyBtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0Ly8gb25seSBEb3duZ3JhZGVkIGN1c3RvbWVyIHdhcyBhZGRlZCBzbyBub3RoaW5nIHRvIG1pZ3JhdGVcblx0fSxcbn1cbiIsImltcG9ydCB7IE9mZmxpbmVNaWdyYXRpb24gfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2VNaWdyYXRvci5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZS5qc1wiXG5pbXBvcnQgeyBhZGRWYWx1ZSwgbWlncmF0ZUFsbEVsZW1lbnRzIH0gZnJvbSBcIi4uL1N0YW5kYXJkTWlncmF0aW9uc1wiXG5pbXBvcnQgeyBNYWlsQm94VHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmc1wiXG5pbXBvcnQgeyBHRU5FUkFURURfTUlOX0lEIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5cbmV4cG9ydCBjb25zdCB0dXRhbm90YTc5OiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwidHV0YW5vdGFcIixcblx0dmVyc2lvbjogNzksXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UpIHtcblx0XHRhd2FpdCBtaWdyYXRlQWxsRWxlbWVudHMoTWFpbEJveFR5cGVSZWYsIHN0b3JhZ2UsIFthZGRWYWx1ZShcImltcG9ydGVkQXR0YWNobWVudHNcIiwgR0VORVJBVEVEX01JTl9JRCksIGFkZFZhbHVlKFwibWFpbEltcG9ydFN0YXRlc1wiLCBHRU5FUkFURURfTUlOX0lEKV0pXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZS5qc1wiXG5pbXBvcnQgeyBTcWxDaXBoZXJGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvU3FsQ2lwaGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVNaWdyYXRpb24gfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2VNaWdyYXRvci5qc1wiXG5pbXBvcnQgeyBNYWlsQm94VHlwZVJlZiwgVXNlclNldHRpbmdzR3JvdXBSb290VHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmc1wiXG5pbXBvcnQgeyBHRU5FUkFURURfTUlOX0lELCBnZXRFbGVtZW50SWQsIGdldExpc3RJZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vdXRpbHMvRW50aXR5VXRpbHNcIlxuaW1wb3J0IHsgR3JvdXBJbmZvVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnNcIlxuaW1wb3J0IHsgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlIH0gZnJvbSBcIi4uL1N0YW5kYXJkTWlncmF0aW9uc1wiXG5pbXBvcnQgeyBHcm91cFR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcblxuLyoqXG4gKiBNaWdyYXRpb24gdG8gcmUtZG93bmxvYWQgbWFpbGJveGVzIHdpdGggaW1wb3J0TWFpbFN0YXRlcyBhbmQgaW1wb3J0ZWRBdHRhY2htZW50XG4gKiBsaXN0cyBwb2ludGluZyB0byBhIHdyb25nIHZhbHVlLlxuICovXG5leHBvcnQgY29uc3Qgb2ZmbGluZTM6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJvZmZsaW5lXCIsXG5cdHZlcnNpb246IDMsXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UsIF86IFNxbENpcGhlckZhY2FkZSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGxldCBtYWlsYm94ZXMgPSBhd2FpdCBzdG9yYWdlLmdldEVsZW1lbnRzT2ZUeXBlKE1haWxCb3hUeXBlUmVmKVxuXHRcdGxldCBuZWVkc09mZmxpbmVEaXNhYmxlID0gZmFsc2Vcblx0XHRmb3IgKGNvbnN0IG1haWxib3ggb2YgbWFpbGJveGVzKSB7XG5cdFx0XHRpZiAobWFpbGJveC5pbXBvcnRlZEF0dGFjaG1lbnRzICE9PSBHRU5FUkFURURfTUlOX0lEICYmIG1haWxib3gubWFpbEltcG9ydFN0YXRlcyAhPT0gR0VORVJBVEVEX01JTl9JRCkge1xuXHRcdFx0XHRjb250aW51ZVxuXHRcdFx0fVxuXHRcdFx0Ly8gZGVsZXRlIHRoZSBvZmZlbmRpbmcgaW5zdGFuY2Vcblx0XHRcdGF3YWl0IHN0b3JhZ2UuZGVsZXRlSWZFeGlzdHMoTWFpbEJveFR5cGVSZWYsIG51bGwsIG1haWxib3guX2lkKVxuXHRcdFx0bmVlZHNPZmZsaW5lRGlzYWJsZSA9IHRydWVcblx0XHR9XG5cblx0XHRpZiAobmVlZHNPZmZsaW5lRGlzYWJsZSkge1xuXHRcdFx0Ly8gYWxzbyBwcmV2ZW50IHRoZSB1c2VyJ3Mgb2ZmbGluZSBsb2dpbiBmcm9tIHJlcXVlc3RpbmcgdGhlIG1haWxib3hcblx0XHRcdC8vIGJlZm9yZSBpdCdzIGZ1bGx5IGxvZ2dlZCBpblxuXHRcdFx0YXdhaXQgZGVsZXRlSW5zdGFuY2VzT2ZUeXBlKHN0b3JhZ2UsIFVzZXJTZXR0aW5nc0dyb3VwUm9vdFR5cGVSZWYpXG5cdFx0XHQvLyByZXF1aXJlZCB0byB0aHJvdyB0aGUgTG9naW5JbmNvbXBsZXRlRXJyb3Igd2hlbiB0cnlpbmcgYXN5bmMgbG9naW5cblx0XHRcdGNvbnN0IGdyb3VwSW5mb3MgPSBhd2FpdCBzdG9yYWdlLmdldFJhd0xpc3RFbGVtZW50c09mVHlwZShHcm91cEluZm9UeXBlUmVmKVxuXHRcdFx0Zm9yIChjb25zdCBncm91cEluZm8gb2YgZ3JvdXBJbmZvcykge1xuXHRcdFx0XHRpZiAoKGdyb3VwSW5mbyBhcyBhbnkpLmdyb3VwVHlwZSAhPT0gR3JvdXBUeXBlLlVzZXIpIGNvbnRpbnVlXG5cdFx0XHRcdGF3YWl0IHN0b3JhZ2UuZGVsZXRlSWZFeGlzdHMoR3JvdXBJbmZvVHlwZVJlZiwgZ2V0TGlzdElkKGdyb3VwSW5mbyksIGdldEVsZW1lbnRJZChncm91cEluZm8pKVxuXHRcdFx0fVxuXHRcdH1cblx0fSxcbn1cbiIsImltcG9ydCB7IE9mZmxpbmVNaWdyYXRpb24gfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2VNaWdyYXRvci5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZS5qc1wiXG5pbXBvcnQgeyBtaWdyYXRlQWxsTGlzdEVsZW1lbnRzIH0gZnJvbSBcIi4uL1N0YW5kYXJkTWlncmF0aW9ucy5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50LCBDYWxlbmRhckV2ZW50VHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5cbmV4cG9ydCBjb25zdCBzeXMxMTg6IE9mZmxpbmVNaWdyYXRpb24gPSB7XG5cdGFwcDogXCJzeXNcIixcblx0dmVyc2lvbjogMTE4LFxuXHRhc3luYyBtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0YXdhaXQgbWlncmF0ZUFsbExpc3RFbGVtZW50cyhDYWxlbmRhckV2ZW50VHlwZVJlZiwgc3RvcmFnZSwgW1xuXHRcdFx0KGNhbGVuZGFyRXZlbnQ6IENhbGVuZGFyRXZlbnQpID0+IHtcblx0XHRcdFx0aWYgKGNhbGVuZGFyRXZlbnQucmVwZWF0UnVsZSkge1xuXHRcdFx0XHRcdGNhbGVuZGFyRXZlbnQucmVwZWF0UnVsZS5hZHZhbmNlZFJ1bGVzID0gW11cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gY2FsZW5kYXJFdmVudFxuXHRcdFx0fSxcblx0XHRdKVxuXHR9LFxufVxuIiwiaW1wb3J0IHsgT2ZmbGluZU1pZ3JhdGlvbiB9IGZyb20gXCIuLi9PZmZsaW5lU3RvcmFnZU1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVTdG9yYWdlIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IG1pZ3JhdGVBbGxMaXN0RWxlbWVudHMgfSBmcm9tIFwiLi4vU3RhbmRhcmRNaWdyYXRpb25zXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnQsIENhbGVuZGFyRXZlbnRUeXBlUmVmLCBNYWlsQm94VHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmc1wiXG5cbmV4cG9ydCBjb25zdCB0dXRhbm90YTgwOiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwidHV0YW5vdGFcIixcblx0dmVyc2lvbjogODAsXG5cdGFzeW5jIG1pZ3JhdGUoc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UpIHtcblx0XHRhd2FpdCBtaWdyYXRlQWxsTGlzdEVsZW1lbnRzKENhbGVuZGFyRXZlbnRUeXBlUmVmLCBzdG9yYWdlLCBbXG5cdFx0XHQoY2FsZW5kYXJFdmVudDogQ2FsZW5kYXJFdmVudCkgPT4ge1xuXHRcdFx0XHRpZiAoY2FsZW5kYXJFdmVudC5yZXBlYXRSdWxlKSB7XG5cdFx0XHRcdFx0Y2FsZW5kYXJFdmVudC5yZXBlYXRSdWxlLmFkdmFuY2VkUnVsZXMgPSBbXVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBjYWxlbmRhckV2ZW50XG5cdFx0XHR9LFxuXHRcdF0pXG5cdH0sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lTWlncmF0aW9uIH0gZnJvbSBcIi4uL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2UgfSBmcm9tIFwiLi4vT2ZmbGluZVN0b3JhZ2UuanNcIlxuXG5leHBvcnQgY29uc3Qgc3RvcmFnZTExOiBPZmZsaW5lTWlncmF0aW9uID0ge1xuXHRhcHA6IFwic3RvcmFnZVwiLFxuXHR2ZXJzaW9uOiAxMSxcblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSkge30sXG59XG4iLCJpbXBvcnQgeyBPZmZsaW5lRGJNZXRhLCBPZmZsaW5lU3RvcmFnZSwgVmVyc2lvbk1ldGFkYXRhQmFzZUtleSB9IGZyb20gXCIuL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IE1vZGVsSW5mb3MgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0VudGl0eUZ1bmN0aW9ucy5qc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCB0eXBlZEVudHJpZXMsIHR5cGVkS2V5cyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBTcWxDaXBoZXJGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvU3FsQ2lwaGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IE91dE9mU3luY0Vycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9PdXRPZlN5bmNFcnJvci5qc1wiXG5pbXBvcnQgeyBzeXM5NCB9IGZyb20gXCIuL21pZ3JhdGlvbnMvc3lzLXY5NC5qc1wiXG5pbXBvcnQgeyB0dXRhbm90YTY2IH0gZnJvbSBcIi4vbWlncmF0aW9ucy90dXRhbm90YS12NjYuanNcIlxuaW1wb3J0IHsgc3lzOTIgfSBmcm9tIFwiLi9taWdyYXRpb25zL3N5cy12OTIuanNcIlxuaW1wb3J0IHsgdHV0YW5vdGE2NSB9IGZyb20gXCIuL21pZ3JhdGlvbnMvdHV0YW5vdGEtdjY1LmpzXCJcbmltcG9ydCB7IHN5czkxIH0gZnJvbSBcIi4vbWlncmF0aW9ucy9zeXMtdjkxLmpzXCJcbmltcG9ydCB7IHN5czkwIH0gZnJvbSBcIi4vbWlncmF0aW9ucy9zeXMtdjkwLmpzXCJcbmltcG9ydCB7IHR1dGFub3RhNjQgfSBmcm9tIFwiLi9taWdyYXRpb25zL3R1dGFub3RhLXY2NC5qc1wiXG5pbXBvcnQgeyB0dXRhbm90YTY3IH0gZnJvbSBcIi4vbWlncmF0aW9ucy90dXRhbm90YS12NjcuanNcIlxuaW1wb3J0IHsgc3lzOTYgfSBmcm9tIFwiLi9taWdyYXRpb25zL3N5cy12OTYuanNcIlxuaW1wb3J0IHsgdHV0YW5vdGE2OSB9IGZyb20gXCIuL21pZ3JhdGlvbnMvdHV0YW5vdGEtdjY5LmpzXCJcbmltcG9ydCB7IHN5czk3IH0gZnJvbSBcIi4vbWlncmF0aW9ucy9zeXMtdjk3LmpzXCJcbmltcG9ydCB7IHR1dGFub3RhNzEgfSBmcm9tIFwiLi9taWdyYXRpb25zL3R1dGFub3RhLXY3MS5qc1wiXG5pbXBvcnQgeyBzeXM5OSB9IGZyb20gXCIuL21pZ3JhdGlvbnMvc3lzLXY5OS5qc1wiXG5pbXBvcnQgeyBzeXMxMDEgfSBmcm9tIFwiLi9taWdyYXRpb25zL3N5cy12MTAxLmpzXCJcbmltcG9ydCB7IHN5czEwMiB9IGZyb20gXCIuL21pZ3JhdGlvbnMvc3lzLXYxMDIuanNcIlxuaW1wb3J0IHsgdHV0YW5vdGE3MiB9IGZyb20gXCIuL21pZ3JhdGlvbnMvdHV0YW5vdGEtdjcyLmpzXCJcbmltcG9ydCB7IHN5czEwMyB9IGZyb20gXCIuL21pZ3JhdGlvbnMvc3lzLXYxMDMuanNcIlxuaW1wb3J0IHsgdHV0YW5vdGE3MyB9IGZyb20gXCIuL21pZ3JhdGlvbnMvdHV0YW5vdGEtdjczLmpzXCJcbmltcG9ydCB7IHN5czEwNCB9IGZyb20gXCIuL21pZ3JhdGlvbnMvc3lzLXYxMDQuanNcIlxuaW1wb3J0IHsgc3lzMTA1IH0gZnJvbSBcIi4vbWlncmF0aW9ucy9zeXMtdjEwNS5qc1wiXG5pbXBvcnQgeyBzeXMxMDYgfSBmcm9tIFwiLi9taWdyYXRpb25zL3N5cy12MTA2LmpzXCJcbmltcG9ydCB7IHR1dGFub3RhNzQgfSBmcm9tIFwiLi9taWdyYXRpb25zL3R1dGFub3RhLXY3NC5qc1wiXG5pbXBvcnQgeyBzeXMxMDcgfSBmcm9tIFwiLi9taWdyYXRpb25zL3N5cy12MTA3LmpzXCJcbmltcG9ydCB7IHR1dGFub3RhNzUgfSBmcm9tIFwiLi9taWdyYXRpb25zL3R1dGFub3RhLXY3NS5qc1wiXG5pbXBvcnQgeyBzeXMxMTEgfSBmcm9tIFwiLi9taWdyYXRpb25zL3N5cy12MTExLmpzXCJcbmltcG9ydCB7IHR1dGFub3RhNzYgfSBmcm9tIFwiLi9taWdyYXRpb25zL3R1dGFub3RhLXY3Ni5qc1wiXG5pbXBvcnQgeyBzeXMxMTIgfSBmcm9tIFwiLi9taWdyYXRpb25zL3N5cy12MTEyLmpzXCJcbmltcG9ydCB7IHR1dGFub3RhNzcgfSBmcm9tIFwiLi9taWdyYXRpb25zL3R1dGFub3RhLXY3Ny5qc1wiXG5pbXBvcnQgeyBzeXMxMTQgfSBmcm9tIFwiLi9taWdyYXRpb25zL3N5cy12MTE0LmpzXCJcbmltcG9ydCB7IG9mZmxpbmUyIH0gZnJvbSBcIi4vbWlncmF0aW9ucy9vZmZsaW5lMi5qc1wiXG5pbXBvcnQgeyBzeXMxMTUgfSBmcm9tIFwiLi9taWdyYXRpb25zL3N5cy12MTE1LmpzXCJcbmltcG9ydCB7IHR1dGFub3RhNzggfSBmcm9tIFwiLi9taWdyYXRpb25zL3R1dGFub3RhLXY3OC5qc1wiXG5pbXBvcnQgeyBzeXMxMTYgfSBmcm9tIFwiLi9taWdyYXRpb25zL3N5cy12MTE2LmpzXCJcbmltcG9ydCB7IHR1dGFub3RhNzkgfSBmcm9tIFwiLi9taWdyYXRpb25zL3R1dGFub3RhLXY3OS5qc1wiXG5pbXBvcnQgeyBvZmZsaW5lMyB9IGZyb20gXCIuL21pZ3JhdGlvbnMvb2ZmbGluZTNcIlxuaW1wb3J0IHsgc3lzMTE4IH0gZnJvbSBcIi4vbWlncmF0aW9ucy9zeXMtdjExOC5qc1wiXG5pbXBvcnQgeyB0dXRhbm90YTgwIH0gZnJvbSBcIi4vbWlncmF0aW9ucy90dXRhbm90YS12ODAuanNcIlxuaW1wb3J0IHsgc3RvcmFnZTExIH0gZnJvbSBcIi4vbWlncmF0aW9ucy9zdG9yYWdlLXYxMVwiXG5cbmV4cG9ydCBpbnRlcmZhY2UgT2ZmbGluZU1pZ3JhdGlvbiB7XG5cdHJlYWRvbmx5IGFwcDogVmVyc2lvbk1ldGFkYXRhQmFzZUtleVxuXHRyZWFkb25seSB2ZXJzaW9uOiBudW1iZXJcblxuXHRtaWdyYXRlKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlLCBzcWxDaXBoZXJGYWNhZGU6IFNxbENpcGhlckZhY2FkZSk6IFByb21pc2U8dm9pZD5cbn1cblxuLyoqXG4gKiBMaXN0IG9mIG1pZ3JhdGlvbnMgdGhhdCB3aWxsIGJlIHJ1biB3aGVuIG5lZWRlZC4gUGxlYXNlIGFkZCB5b3VyIG1pZ3JhdGlvbnMgdG8gdGhlIGxpc3QuXG4gKlxuICogTm9ybWFsbHkgeW91IHNob3VsZCBvbmx5IGFkZCB0aGVtIHRvIHRoZSBlbmQgb2YgdGhlIGxpc3QgYnV0IHdpdGggb2ZmbGluZSBvbmVzIGl0IGNhbiBiZSBhIGJpdCB0cmlja3kgc2luY2UgdGhleSBjaGFuZ2UgdGhlIGRiIHN0cnVjdHVyZSBpdHNlbGYgc28gc29tZXRpbWVzXG4gKiB0aGV5IHNob3VsZCByYXRoZXIgYmUgaW4gdGhlIGJlZ2lubmluZy5cbiAqL1xuZXhwb3J0IGNvbnN0IE9GRkxJTkVfU1RPUkFHRV9NSUdSQVRJT05TOiBSZWFkb25seUFycmF5PE9mZmxpbmVNaWdyYXRpb24+ID0gW1xuXHRzeXM5MCxcblx0dHV0YW5vdGE2NCxcblx0c3lzOTEsXG5cdHR1dGFub3RhNjUsXG5cdHN5czkyLFxuXHR0dXRhbm90YTY2LFxuXHRzeXM5NCxcblx0dHV0YW5vdGE2Nyxcblx0c3lzOTYsXG5cdHR1dGFub3RhNjksXG5cdHN5czk3LFxuXHR0dXRhbm90YTcxLFxuXHRzeXM5OSxcblx0c3lzMTAxLFxuXHRzeXMxMDIsXG5cdHR1dGFub3RhNzIsXG5cdHN5czEwMyxcblx0dHV0YW5vdGE3Myxcblx0c3lzMTA0LFxuXHRzeXMxMDUsXG5cdHN5czEwNixcblx0dHV0YW5vdGE3NCxcblx0dHV0YW5vdGE3NSxcblx0c3lzMTA3LFxuXHR0dXRhbm90YTc1LFxuXHRzeXMxMTEsXG5cdHR1dGFub3RhNzYsXG5cdHN5czExMixcblx0dHV0YW5vdGE3Nyxcblx0c3lzMTE0LFxuXHRvZmZsaW5lMixcblx0c3lzMTE1LFxuXHR0dXRhbm90YTc4LFxuXHRzeXMxMTYsXG5cdHR1dGFub3RhNzksXG5cdG9mZmxpbmUzLFxuXHRzeXMxMTgsXG5cdHR1dGFub3RhODAsXG5cdHN0b3JhZ2UxMSxcbl1cblxuLy8gaW4gY2FzZXMgd2hlcmUgdGhlIGFjdHVhbCBtaWdyYXRpb24gaXMgbm90IHRoZXJlIGFueW1vcmUgKHdlIGNsZWFuIHVwIG9sZCBtaWdyYXRpb25zIG5vIGNsaWVudCB3b3VsZCBhcHBseSBhbnltb3JlKVxuLy8gYW5kIHdlIGNyZWF0ZSBhIG5ldyBvZmZsaW5lIGRhdGFiYXNlLCB3ZSBzdGlsbCBuZWVkIHRvIHNldCB0aGUgb2ZmbGluZSB2ZXJzaW9uIHRvIHRoZSBjdXJyZW50IHZhbHVlLlxuY29uc3QgQ1VSUkVOVF9PRkZMSU5FX1ZFUlNJT04gPSAzXG5cbi8qKlxuICogTWlncmF0b3IgZm9yIHRoZSBvZmZsaW5lIHN0b3JhZ2UgYmV0d2VlbiBkaWZmZXJlbnQgdmVyc2lvbnMgb2YgbW9kZWwuIEl0IGlzIHRpZ2h0bHkgY291cGxlcyB0byB0aGUgdmVyc2lvbnMgb2YgQVBJIGVudGl0aWVzOiBldmVyeSB0aW1lIHdlIG1ha2UgYW5cbiAqIFwiaW5jb21wYXRpYmxlXCIgY2hhbmdlIHRvIHRoZSBBUEkgbW9kZWwgd2UgbmVlZCB0byB1cGRhdGUgb2ZmbGluZSBkYXRhYmFzZSBzb21laG93LlxuICpcbiAqIE1pZ3JhdGlvbnMgYXJlIGRvbmUgbWFudWFsbHkgYnV0IHRoZXJlIGFyZSBhIGZldyBjaGVja3MgZG9uZTpcbiAqICAtIGNvbXBpbGUgdGltZSBjaGVjayB0aGF0IG1pZ3JhdGlvbiBleGlzdHMgYW5kIGlzIHVzZWQgaW4gdGhpcyBmaWxlXG4gKiAgLSBydW50aW1lIGNoZWNrIHRoYXQgcnVudGltZSBtb2RlbCBpcyBjb21wYXRpYmxlIHRvIHRoZSBzdG9yZWQgb25lIGFmdGVyIGFsbCB0aGUgbWlncmF0aW9ucyBhcmUgZG9uZS5cbiAqXG4gKiAgVG8gYWRkIGEgbmV3IG1pZ3JhdGlvbiBjcmVhdGUgYSBtaWdyYXRpb24gd2l0aCB0aGUgZmlsZW5hbWUgbWF0Y2hpbmcgLi9taWdyYXRpb25zL3thcHB9LXZ7dmVyc2lvbn0udHMgYW5kIHVzZSBpdCBpbiB0aGUgYG1pZ3JhdGlvbnNgIGZpZWxkIG9uIHRoaXNcbiAqICBtaWdyYXRvci5cbiAqXG4gKiAgTWlncmF0aW9ucyBtaWdodCByZWFkIGFuZCB3cml0ZSB0byB0aGUgZGF0YWJhc2UgYW5kIHRoZXkgc2hvdWxkIHVzZSBTdGFuZGFyZE1pZ3JhdGlvbnMgd2hlbiBuZWVkZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBPZmZsaW5lU3RvcmFnZU1pZ3JhdG9yIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBtaWdyYXRpb25zOiBSZWFkb25seUFycmF5PE9mZmxpbmVNaWdyYXRpb24+LCBwcml2YXRlIHJlYWRvbmx5IG1vZGVsSW5mb3M6IE1vZGVsSW5mb3MpIHt9XG5cblx0YXN5bmMgbWlncmF0ZShzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSwgc3FsQ2lwaGVyRmFjYWRlOiBTcWxDaXBoZXJGYWNhZGUpIHtcblx0XHRjb25zdCBtZXRhID0gYXdhaXQgc3RvcmFnZS5kdW1wTWV0YWRhdGEoKVxuXG5cdFx0Ly8gV2UgZGlkIG5vdCB3cml0ZSBkb3duIHRoZSBcIm9mZmxpbmVcIiB2ZXJzaW9uIGZyb20gdGhlIGJlZ2lubmluZywgc28gd2UgbmVlZCB0byBmaWd1cmUgb3V0IGlmIHdlIG5lZWQgdG8gcnVuIHRoZSBtaWdyYXRpb24gZm9yIHRoZSBkYiBzdHJ1Y3R1cmUgb3Jcblx0XHQvLyBub3QuIFByZXZpb3VzbHkgd2UndmUgYmVlbiBjaGVja2luZyB0aGF0IHRoZXJlJ3Mgc29tZXRoaW5nIGluIHRoZSBtZXRhIHRhYmxlIHdoaWNoIGlzIGEgcHJldHR5IGRlY2VudCBjaGVjay4gVW5mb3J0dW5hdGVseSB3ZSBoYWQgbXVsdGlwbGUgYnVnc1xuXHRcdC8vIHdoaWNoIHJlc3VsdGVkIGluIGEgc3RhdGUgd2hlcmUgd2Ugd291bGQgcmUtY3JlYXRlIHRoZSBvZmZsaW5lIGRiIGJ1dCBub3QgcG9wdWxhdGUgdGhlIG1ldGEgdGFibGUgd2l0aCB0aGUgdmVyc2lvbnMsIHRoZSBvbmx5IHRoaW5nIHRoYXQgd291bGQgYmVcblx0XHQvLyB3cml0dGVuIGlzIGxhc3RVcGRhdGVUaW1lLlxuXHRcdC8vIHt9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IGRiLCBkbyBub3QgbWlncmF0ZSBvZmZsaW5lXG5cdFx0Ly8ge1wiYmFzZS12ZXJzaW9uXCI6IDEsIFwibGFzdFVwZGF0ZVRpbWVcIjogMTIzLCBcIm9mZmxpbmUtdmVyc2lvblwiOiAxfSAtPiB1cC10by1kYXRlIGRiLCBkbyBub3QgbWlncmF0ZSBvZmZsaW5lXG5cdFx0Ly8ge1wibGFzdFVwZGF0ZVRpbWVcIjogMTIzfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IGJyb2tlbiBzdGF0ZSBhZnRlciB0aGUgYnVnZ3kgcmVjcmVhdGlvbiBvZiBkYiwgZGVsZXRlIHRoZSBkYlxuXHRcdC8vIHtcImJhc2UtdmVyc2lvblwiOiAxLCBcImxhc3RVcGRhdGVUaW1lXCI6IDEyM30gICAgICAgICAgICAgICAgICAgICAgIC0+IHNvbWUgdmVyeSBvbGQgc3RhdGUgd2hlcmUgd2Ugd291bGQgYWN0dWFsbHkgaGF2ZSB0byBtaWdyYXRlIG9mZmxpbmVcblx0XHRpZiAoT2JqZWN0LmtleXMobWV0YSkubGVuZ3RoID09PSAxICYmIG1ldGEubGFzdFVwZGF0ZVRpbWUgIT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IE91dE9mU3luY0Vycm9yKFwiSW52YWxpZCBEQiBzdGF0ZSwgbWlzc2luZyBtb2RlbCB2ZXJzaW9uc1wiKVxuXHRcdH1cblxuXHRcdGNvbnN0IHBvcHVsYXRlZE1ldGEgPSBhd2FpdCB0aGlzLnBvcHVsYXRlTW9kZWxWZXJzaW9ucyhtZXRhLCBzdG9yYWdlKVxuXG5cdFx0aWYgKHRoaXMuaXNEYk5ld2VyVGhhbkN1cnJlbnRDbGllbnQocG9wdWxhdGVkTWV0YSkpIHtcblx0XHRcdHRocm93IG5ldyBPdXRPZlN5bmNFcnJvcihgb2ZmbGluZSBkYXRhYmFzZSBoYXMgbmV3ZXIgc2NoZW1hIHRoYW4gY2xpZW50YClcblx0XHR9XG5cblx0XHRhd2FpdCB0aGlzLnJ1bk1pZ3JhdGlvbnMobWV0YSwgc3RvcmFnZSwgc3FsQ2lwaGVyRmFjYWRlKVxuXHRcdGF3YWl0IHRoaXMuY2hlY2tTdGF0ZUFmdGVyTWlncmF0aW9ucyhzdG9yYWdlKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBjaGVja1N0YXRlQWZ0ZXJNaWdyYXRpb25zKHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlKSB7XG5cdFx0Ly8gQ2hlY2sgdGhhdCBhbGwgdGhlIG5lY2Vzc2FyeSBtaWdyYXRpb25zIGhhdmUgYmVlbiBydW4sIGF0IGxlYXN0IHRvIHRoZSBwb2ludCB3aGVyZSB3ZSBhcmUgY29tcGF0aWJsZS5cblx0XHRjb25zdCBtZXRhID0gYXdhaXQgc3RvcmFnZS5kdW1wTWV0YWRhdGEoKVxuXHRcdGZvciAoY29uc3QgYXBwIG9mIHR5cGVkS2V5cyh0aGlzLm1vZGVsSW5mb3MpKSB7XG5cdFx0XHRjb25zdCBjb21wYXRpYmxlU2luY2UgPSB0aGlzLm1vZGVsSW5mb3NbYXBwXS5jb21wYXRpYmxlU2luY2Vcblx0XHRcdGxldCBtZXRhVmVyc2lvbiA9IG1ldGFbYCR7YXBwfS12ZXJzaW9uYF0hXG5cdFx0XHRpZiAobWV0YVZlcnNpb24gPCBjb21wYXRpYmxlU2luY2UpIHtcblx0XHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXG5cdFx0XHRcdFx0YFlvdSBmb3Jnb3QgdG8gbWlncmF0ZSB5b3VyIGRhdGFiYXNlcyEgJHthcHB9LnZlcnNpb24gc2hvdWxkIGJlID49ICR7dGhpcy5tb2RlbEluZm9zW2FwcF0uY29tcGF0aWJsZVNpbmNlfSBidXQgaW4gZGIgaXQgaXMgJHttZXRhVmVyc2lvbn1gLFxuXHRcdFx0XHQpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBydW5NaWdyYXRpb25zKG1ldGE6IFBhcnRpYWw8T2ZmbGluZURiTWV0YT4sIHN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlLCBzcWxDaXBoZXJGYWNhZGU6IFNxbENpcGhlckZhY2FkZSkge1xuXHRcdGZvciAoY29uc3QgeyBhcHAsIHZlcnNpb24sIG1pZ3JhdGUgfSBvZiB0aGlzLm1pZ3JhdGlvbnMpIHtcblx0XHRcdGNvbnN0IHN0b3JlZFZlcnNpb24gPSBtZXRhW2Ake2FwcH0tdmVyc2lvbmBdIVxuXHRcdFx0aWYgKHN0b3JlZFZlcnNpb24gPCB2ZXJzaW9uKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBydW5uaW5nIG9mZmxpbmUgZGIgbWlncmF0aW9uIGZvciAke2FwcH0gZnJvbSAke3N0b3JlZFZlcnNpb259IHRvICR7dmVyc2lvbn1gKVxuXHRcdFx0XHRhd2FpdCBtaWdyYXRlKHN0b3JhZ2UsIHNxbENpcGhlckZhY2FkZSlcblx0XHRcdFx0Y29uc29sZS5sb2coXCJtaWdyYXRpb24gZmluaXNoZWRcIilcblx0XHRcdFx0YXdhaXQgc3RvcmFnZS5zZXRTdG9yZWRNb2RlbFZlcnNpb24oYXBwLCB2ZXJzaW9uKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgcG9wdWxhdGVNb2RlbFZlcnNpb25zKG1ldGE6IFJlYWRvbmx5PFBhcnRpYWw8T2ZmbGluZURiTWV0YT4+LCBzdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSk6IFByb21pc2U8UGFydGlhbDxPZmZsaW5lRGJNZXRhPj4ge1xuXHRcdC8vIGNvcHkgbWV0YWRhdGEgYmVjYXVzZSBpdCdzIGdvaW5nIHRvIGJlIG11dGF0ZWRcblx0XHRjb25zdCBuZXdNZXRhID0geyAuLi5tZXRhIH1cblx0XHQvLyBQb3B1bGF0ZSBtb2RlbCB2ZXJzaW9ucyBpZiB0aGV5IGhhdmVuJ3QgYmVlbiB3cml0dGVuIGFscmVhZHlcblx0XHRmb3IgKGNvbnN0IGFwcCBvZiB0eXBlZEtleXModGhpcy5tb2RlbEluZm9zKSkge1xuXHRcdFx0YXdhaXQgdGhpcy5wcmVwb3B1bGF0ZVZlcnNpb25JZkFic2VudChhcHAsIHRoaXMubW9kZWxJbmZvc1thcHBdLnZlcnNpb24sIG5ld01ldGEsIHN0b3JhZ2UpXG5cdFx0fVxuXG5cdFx0YXdhaXQgdGhpcy5wcmVwb3B1bGF0ZVZlcnNpb25JZkFic2VudChcIm9mZmxpbmVcIiwgQ1VSUkVOVF9PRkZMSU5FX1ZFUlNJT04sIG5ld01ldGEsIHN0b3JhZ2UpXG5cdFx0cmV0dXJuIG5ld01ldGFcblx0fVxuXG5cdC8qKlxuXHQgKiB1cGRhdGUgdGhlIG1ldGFkYXRhIHRhYmxlIHRvIGluaXRpYWxpemUgdGhlIHJvdyBvZiB0aGUgYXBwIHdpdGggdGhlIGdpdmVuIG1vZGVsIHZlcnNpb25cblx0ICpcblx0ICogTkI6IG11dGF0ZXMgbWV0YVxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBwcmVwb3B1bGF0ZVZlcnNpb25JZkFic2VudChhcHA6IFZlcnNpb25NZXRhZGF0YUJhc2VLZXksIHZlcnNpb246IG51bWJlciwgbWV0YTogUGFydGlhbDxPZmZsaW5lRGJNZXRhPiwgc3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UpIHtcblx0XHRjb25zdCBrZXkgPSBgJHthcHB9LXZlcnNpb25gIGFzIGNvbnN0XG5cdFx0Y29uc3Qgc3RvcmVkVmVyc2lvbiA9IG1ldGFba2V5XVxuXHRcdGlmIChzdG9yZWRWZXJzaW9uID09IG51bGwpIHtcblx0XHRcdG1ldGFba2V5XSA9IHZlcnNpb25cblx0XHRcdGF3YWl0IHN0b3JhZ2Uuc2V0U3RvcmVkTW9kZWxWZXJzaW9uKGFwcCwgdmVyc2lvbilcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogaXQncyBwb3NzaWJsZSB0aGF0IHRoZSB1c2VyIGluc3RhbGxlZCBhbiBvbGRlciBjbGllbnQgb3ZlciBhIG5ld2VyIG9uZSwgYW5kIHdlIGRvbid0IGhhdmUgYmFja3dhcmRzIG1pZ3JhdGlvbnMuXG5cdCAqIGluIHRoYXQgY2FzZSwgaXQncyBsaWtlbHkgdGhhdCB0aGUgY2xpZW50IGNhbid0IGV2ZW4gdW5kZXJzdGFuZCB0aGUgY29udGVudHMgb2YgdGhlIGRiLlxuXHQgKiB3ZSdyZSBnb2luZyB0byBkZWxldGUgaXQgYW5kIG5vdCBtaWdyYXRlIGF0IGFsbC5cblx0ICogQHByaXZhdGVcblx0ICpcblx0ICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgZGF0YWJhc2Ugd2UncmUgc3VwcG9zZWQgdG8gbWlncmF0ZSBoYXMgYW55IGhpZ2hlciBtb2RlbCB2ZXJzaW9ucyB0aGFuIG91ciBoaWdoZXN0IG1pZ3JhdGlvbiBmb3IgdGhhdCBtb2RlbCwgZmFsc2Ugb3RoZXJ3aXNlXG5cdCAqL1xuXHRwcml2YXRlIGlzRGJOZXdlclRoYW5DdXJyZW50Q2xpZW50KG1ldGE6IFBhcnRpYWw8T2ZmbGluZURiTWV0YT4pOiBib29sZWFuIHtcblx0XHRmb3IgKGNvbnN0IFthcHAsIHsgdmVyc2lvbiB9XSBvZiB0eXBlZEVudHJpZXModGhpcy5tb2RlbEluZm9zKSkge1xuXHRcdFx0Y29uc3Qgc3RvcmVkVmVyc2lvbiA9IG1ldGFbYCR7YXBwfS12ZXJzaW9uYF0hXG5cdFx0XHRpZiAoc3RvcmVkVmVyc2lvbiA+IHZlcnNpb24pIHtcblx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gYXNzZXJ0Tm90TnVsbChtZXRhW2BvZmZsaW5lLXZlcnNpb25gXSkgPiBDVVJSRU5UX09GRkxJTkVfVkVSU0lPTlxuXHR9XG59XG4iLCIvKiBnZW5lcmF0ZWQgZmlsZSwgZG9uJ3QgZWRpdC4gKi9cblxuaW1wb3J0IHsgU3FsQ2lwaGVyRmFjYWRlIH0gZnJvbSBcIi4vU3FsQ2lwaGVyRmFjYWRlLmpzXCJcblxuaW50ZXJmYWNlIE5hdGl2ZUludGVyZmFjZSB7XG5cdGludm9rZU5hdGl2ZShyZXF1ZXN0VHlwZTogc3RyaW5nLCBhcmdzOiB1bmtub3duW10pOiBQcm9taXNlPGFueT5cbn1cbmV4cG9ydCBjbGFzcyBTcWxDaXBoZXJGYWNhZGVTZW5kRGlzcGF0Y2hlciBpbXBsZW1lbnRzIFNxbENpcGhlckZhY2FkZSB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgdHJhbnNwb3J0OiBOYXRpdmVJbnRlcmZhY2UpIHt9XG5cdGFzeW5jIG9wZW5EYiguLi5hcmdzOiBQYXJhbWV0ZXJzPFNxbENpcGhlckZhY2FkZVtcIm9wZW5EYlwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlNxbENpcGhlckZhY2FkZVwiLCBcIm9wZW5EYlwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBjbG9zZURiKC4uLmFyZ3M6IFBhcmFtZXRlcnM8U3FsQ2lwaGVyRmFjYWRlW1wiY2xvc2VEYlwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlNxbENpcGhlckZhY2FkZVwiLCBcImNsb3NlRGJcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgZGVsZXRlRGIoLi4uYXJnczogUGFyYW1ldGVyczxTcWxDaXBoZXJGYWNhZGVbXCJkZWxldGVEYlwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlNxbENpcGhlckZhY2FkZVwiLCBcImRlbGV0ZURiXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIHJ1biguLi5hcmdzOiBQYXJhbWV0ZXJzPFNxbENpcGhlckZhY2FkZVtcInJ1blwiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlNxbENpcGhlckZhY2FkZVwiLCBcInJ1blwiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyBnZXQoLi4uYXJnczogUGFyYW1ldGVyczxTcWxDaXBoZXJGYWNhZGVbXCJnZXRcIl0+KSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhbnNwb3J0Lmludm9rZU5hdGl2ZShcImlwY1wiLCBbXCJTcWxDaXBoZXJGYWNhZGVcIiwgXCJnZXRcIiwgLi4uYXJnc10pXG5cdH1cblx0YXN5bmMgYWxsKC4uLmFyZ3M6IFBhcmFtZXRlcnM8U3FsQ2lwaGVyRmFjYWRlW1wiYWxsXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiU3FsQ2lwaGVyRmFjYWRlXCIsIFwiYWxsXCIsIC4uLmFyZ3NdKVxuXHR9XG5cdGFzeW5jIGxvY2tSYW5nZXNEYkFjY2VzcyguLi5hcmdzOiBQYXJhbWV0ZXJzPFNxbENpcGhlckZhY2FkZVtcImxvY2tSYW5nZXNEYkFjY2Vzc1wiXT4pIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc3BvcnQuaW52b2tlTmF0aXZlKFwiaXBjXCIsIFtcIlNxbENpcGhlckZhY2FkZVwiLCBcImxvY2tSYW5nZXNEYkFjY2Vzc1wiLCAuLi5hcmdzXSlcblx0fVxuXHRhc3luYyB1bmxvY2tSYW5nZXNEYkFjY2VzcyguLi5hcmdzOiBQYXJhbWV0ZXJzPFNxbENpcGhlckZhY2FkZVtcInVubG9ja1Jhbmdlc0RiQWNjZXNzXCJdPikge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zcG9ydC5pbnZva2VOYXRpdmUoXCJpcGNcIiwgW1wiU3FsQ2lwaGVyRmFjYWRlXCIsIFwidW5sb2NrUmFuZ2VzRGJBY2Nlc3NcIiwgLi4uYXJnc10pXG5cdH1cbn1cbiIsImltcG9ydCB7IGF1dGhlbnRpY2F0ZWRBZXNEZWNyeXB0LCBFbnRyb3B5U291cmNlLCByYW5kb20sIFJhbmRvbWl6ZXIgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLWNyeXB0b1wiXG5pbXBvcnQgeyBVc2VyRmFjYWRlIH0gZnJvbSBcIi4vVXNlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBjcmVhdGVFbnRyb3B5RGF0YSwgVHV0YW5vdGFQcm9wZXJ0aWVzIH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEVudHJvcHlTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1NlcnZpY2VzLmpzXCJcbmltcG9ydCB7IGxhenksIG5vT3AsIG9mQ2xhc3MgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IENvbm5lY3Rpb25FcnJvciwgTG9ja2VkRXJyb3IsIFNlcnZpY2VVbmF2YWlsYWJsZUVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9SZXN0RXJyb3IuanNcIlxuaW1wb3J0IHsgSVNlcnZpY2VFeGVjdXRvciB9IGZyb20gXCIuLi8uLi9jb21tb24vU2VydmljZVJlcXVlc3QuanNcIlxuaW1wb3J0IHsgS2V5TG9hZGVyRmFjYWRlIH0gZnJvbSBcIi4vS2V5TG9hZGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IGVuY3J5cHRCeXRlcyB9IGZyb20gXCIuLi9jcnlwdG8vQ3J5cHRvV3JhcHBlci5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgRW50cm9weURhdGFDaHVuayB7XG5cdHNvdXJjZTogRW50cm9weVNvdXJjZVxuXHRlbnRyb3B5OiBudW1iZXJcblx0ZGF0YTogbnVtYmVyIHwgQXJyYXk8bnVtYmVyPlxufVxuXG4vKiogQSBjbGFzcyB3aGljaCBhY2N1bXVsYXRlcyB0aGUgZW50cm9weSBhbmQgc3RvcmVzIGl0IG9uIHRoZSBzZXJ2ZXIuICovXG5leHBvcnQgY2xhc3MgRW50cm9weUZhY2FkZSB7XG5cdHByaXZhdGUgbmV3RW50cm9weTogbnVtYmVyID0gLTFcblx0cHJpdmF0ZSBsYXN0RW50cm9weVVwZGF0ZTogbnVtYmVyID0gRGF0ZS5ub3coKVxuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdXNlckZhY2FkZTogVXNlckZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IHNlcnZpY2VFeGVjdXRvcjogSVNlcnZpY2VFeGVjdXRvcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IHJhbmRvbTogUmFuZG9taXplcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxhenlLZXlMb2FkZXJGYWNhZGU6IGxhenk8S2V5TG9hZGVyRmFjYWRlPixcblx0KSB7fVxuXG5cdC8qKlxuXHQgKiBBZGRzIGVudHJvcHkgdG8gdGhlIHJhbmRvbWl6ZXIuIFVwZGF0ZWQgdGhlIHN0b3JlZCBlbnRyb3B5IGZvciBhIHVzZXIgd2hlbiBlbm91Z2ggZW50cm9weSBoYXMgYmVlbiBjb2xsZWN0ZWQuXG5cdCAqL1xuXHRhZGRFbnRyb3B5KGVudHJvcHk6IEVudHJvcHlEYXRhQ2h1bmtbXSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5yYW5kb20uYWRkRW50cm9weShlbnRyb3B5KVxuXHRcdH0gZmluYWxseSB7XG5cdFx0XHR0aGlzLm5ld0VudHJvcHkgPSB0aGlzLm5ld0VudHJvcHkgKyBlbnRyb3B5LnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gdmFsdWUuZW50cm9weSArIHN1bSwgMClcblx0XHRcdGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG5cblx0XHRcdGlmICh0aGlzLm5ld0VudHJvcHkgPiA1MDAwICYmIG5vdyAtIHRoaXMubGFzdEVudHJvcHlVcGRhdGUgPiAxMDAwICogNjAgKiA1KSB7XG5cdFx0XHRcdHRoaXMubGFzdEVudHJvcHlVcGRhdGUgPSBub3dcblx0XHRcdFx0dGhpcy5uZXdFbnRyb3B5ID0gMFxuXHRcdFx0XHR0aGlzLnN0b3JlRW50cm9weSgpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0c3RvcmVFbnRyb3B5KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIFdlIG9ubHkgc3RvcmUgZW50cm9weSB0byB0aGUgc2VydmVyIGlmIHdlIGFyZSB0aGUgbGVhZGVyXG5cdFx0aWYgKCF0aGlzLnVzZXJGYWNhZGUuaXNGdWxseUxvZ2dlZEluKCkgfHwgIXRoaXMudXNlckZhY2FkZS5pc0xlYWRlcigpKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcblx0XHRjb25zdCB1c2VyR3JvdXBLZXkgPSB0aGlzLnVzZXJGYWNhZGUuZ2V0Q3VycmVudFVzZXJHcm91cEtleSgpXG5cdFx0Y29uc3QgZW50cm9weURhdGEgPSBjcmVhdGVFbnRyb3B5RGF0YSh7XG5cdFx0XHR1c2VyRW5jRW50cm9weTogZW5jcnlwdEJ5dGVzKHVzZXJHcm91cEtleS5vYmplY3QsIHRoaXMucmFuZG9tLmdlbmVyYXRlUmFuZG9tRGF0YSgzMikpLFxuXHRcdFx0dXNlcktleVZlcnNpb246IHVzZXJHcm91cEtleS52ZXJzaW9uLnRvU3RyaW5nKCksXG5cdFx0fSlcblx0XHRyZXR1cm4gdGhpcy5zZXJ2aWNlRXhlY3V0b3Jcblx0XHRcdC5wdXQoRW50cm9weVNlcnZpY2UsIGVudHJvcHlEYXRhKVxuXHRcdFx0LmNhdGNoKG9mQ2xhc3MoTG9ja2VkRXJyb3IsIG5vT3ApKVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKENvbm5lY3Rpb25FcnJvciwgKGUpID0+IHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcImNvdWxkIG5vdCBzdG9yZSBlbnRyb3B5XCIsIGUpXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKFNlcnZpY2VVbmF2YWlsYWJsZUVycm9yLCAoZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiY291bGQgbm90IHN0b3JlIGVudHJvcHlcIiwgZSlcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdH1cblxuXHQvKipcblx0ICogTG9hZHMgZW50cm9weSBmcm9tIHRoZSBsYXN0IGxvZ291dC5cblx0ICovXG5cdHB1YmxpYyBhc3luYyBsb2FkRW50cm9weSh0dXRhbm90YVByb3BlcnRpZXM6IFR1dGFub3RhUHJvcGVydGllcyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0dXRhbm90YVByb3BlcnRpZXMudXNlckVuY0VudHJvcHkpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGtleUxvYWRlckZhY2FkZSA9IHRoaXMubGF6eUtleUxvYWRlckZhY2FkZSgpXG5cdFx0XHRcdGNvbnN0IHVzZXJHcm91cEtleSA9IGF3YWl0IGtleUxvYWRlckZhY2FkZS5sb2FkU3ltVXNlckdyb3VwS2V5KE51bWJlcih0dXRhbm90YVByb3BlcnRpZXMudXNlcktleVZlcnNpb24gPz8gMCkpXG5cdFx0XHRcdGNvbnN0IGVudHJvcHkgPSBhdXRoZW50aWNhdGVkQWVzRGVjcnlwdCh1c2VyR3JvdXBLZXksIHR1dGFub3RhUHJvcGVydGllcy51c2VyRW5jRW50cm9weSlcblx0XHRcdFx0cmFuZG9tLmFkZFN0YXRpY0VudHJvcHkoZW50cm9weSlcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiY291bGQgbm90IGRlY3J5cHQgZW50cm9weVwiLCBlcnJvcilcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCB7IEFyY2hpdmVEYXRhVHlwZSwgQmxvYkFjY2Vzc1Rva2VuS2luZCB9IGZyb20gXCIuLi8uLi9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgYXNzZXJ0V29ya2VyT3JOb2RlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgQmxvYkFjY2Vzc1Rva2VuU2VydmljZSB9IGZyb20gXCIuLi8uLi9lbnRpdGllcy9zdG9yYWdlL1NlcnZpY2VzXCJcbmltcG9ydCB7IElTZXJ2aWNlRXhlY3V0b3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL1NlcnZpY2VSZXF1ZXN0XCJcbmltcG9ydCB7IEJsb2JTZXJ2ZXJBY2Nlc3NJbmZvLCBjcmVhdGVCbG9iQWNjZXNzVG9rZW5Qb3N0SW4sIGNyZWF0ZUJsb2JSZWFkRGF0YSwgY3JlYXRlQmxvYldyaXRlRGF0YSwgY3JlYXRlSW5zdGFuY2VJZCB9IGZyb20gXCIuLi8uLi9lbnRpdGllcy9zdG9yYWdlL1R5cGVSZWZzXCJcbmltcG9ydCB7IERhdGVQcm92aWRlciB9IGZyb20gXCIuLi8uLi9jb21tb24vRGF0ZVByb3ZpZGVyLmpzXCJcbmltcG9ydCB7IHJlc29sdmVUeXBlUmVmZXJlbmNlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnRpdHlGdW5jdGlvbnMuanNcIlxuaW1wb3J0IHsgQXV0aERhdGFQcm92aWRlciB9IGZyb20gXCIuL1VzZXJGYWNhZGUuanNcIlxuaW1wb3J0IHsgZGVkdXBsaWNhdGUsIGZpcnN0LCBpc0VtcHR5LCBsYXp5TWVtb2l6ZWQsIFR5cGVSZWYgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgQmxvYkxvYWRPcHRpb25zIH0gZnJvbSBcIi4vbGF6eS9CbG9iRmFjYWRlLmpzXCJcbmltcG9ydCB7IEJsb2JSZWZlcmVuY2luZ0luc3RhbmNlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi91dGlscy9CbG9iVXRpbHMuanNcIlxuXG5hc3NlcnRXb3JrZXJPck5vZGUoKVxuXG4vKipcbiAqIFRoZSBCbG9iQWNjZXNzVG9rZW5GYWNhZGUgcmVxdWVzdHMgYmxvYkFjY2Vzc1Rva2VucyBmcm9tIHRoZSBCbG9iQWNjZXNzVG9rZW5TZXJ2aWNlIHRvIGdldCBvciBwb3N0IHRvIHRoZSBCbG9iU2VydmljZSAoYmluYXJ5IGJsb2JzKVxuICogb3IgRGVmYXVsdEJsb2JFbGVtZW50UmVzb3VyY2UgKGluc3RhbmNlcykuXG4gKlxuICogQWxsIHRva2VucyBhcmUgY2FjaGVkLlxuICovXG5leHBvcnQgY2xhc3MgQmxvYkFjY2Vzc1Rva2VuRmFjYWRlIHtcblx0Ly8gY2FjaGUgZm9yIGJsb2IgYWNjZXNzIHRva2VucyB0aGF0IGFyZSB2YWxpZCBmb3IgdGhlIHdob2xlIGFyY2hpdmUgKGtleTo8YXJjaGl2ZUlkPilcblx0Ly8gY2FjaGUgZm9yIGJsb2IgYWNjZXNzIHRva2VucyB0aGF0IGFyZSB2YWxpZCBmb3IgYmxvYnMgZnJvbSBhIGdpdmVuIGluc3RhbmNlIHdlcmUgdGhlIHVzZXIgZG9lcyBub3Qgb3duIHRoZSBhcmNoaXZlIChrZXk6PGluc3RhbmNlRWxlbWVudElkPikuXG5cdHByaXZhdGUgcmVhZG9ubHkgcmVhZENhY2hlOiBCbG9iQWNjZXNzVG9rZW5DYWNoZVxuXHQvLyBjYWNoZSBmb3IgdXBsb2FkIHJlcXVlc3RzIGFyZSB2YWxpZCBmb3IgdGhlIHdob2xlIGFyY2hpdmUgKGtleTo8b3duZXJHcm91cCArIGFyY2hpdmVEYXRhVHlwZT4pLlxuXHRwcml2YXRlIHJlYWRvbmx5IHdyaXRlQ2FjaGU6IEJsb2JBY2Nlc3NUb2tlbkNhY2hlXG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBzZXJ2aWNlRXhlY3V0b3I6IElTZXJ2aWNlRXhlY3V0b3IsIHByaXZhdGUgcmVhZG9ubHkgYXV0aERhdGFQcm92aWRlcjogQXV0aERhdGFQcm92aWRlciwgZGF0ZVByb3ZpZGVyOiBEYXRlUHJvdmlkZXIpIHtcblx0XHR0aGlzLnJlYWRDYWNoZSA9IG5ldyBCbG9iQWNjZXNzVG9rZW5DYWNoZShkYXRlUHJvdmlkZXIpXG5cdFx0dGhpcy53cml0ZUNhY2hlID0gbmV3IEJsb2JBY2Nlc3NUb2tlbkNhY2hlKGRhdGVQcm92aWRlcilcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXF1ZXN0cyBhIHRva2VuIHRoYXQgYWxsb3dzIHVwbG9hZGluZyBibG9icyBmb3IgdGhlIGdpdmVuIEFyY2hpdmVEYXRhVHlwZSBhbmQgb3duZXJHcm91cC5cblx0ICogQHBhcmFtIGFyY2hpdmVEYXRhVHlwZSBUaGUgdHlwZSBvZiBkYXRhIHRoYXQgc2hvdWxkIGJlIHN0b3JlZC5cblx0ICogQHBhcmFtIG93bmVyR3JvdXBJZCBUaGUgb3duZXJHcm91cCB3ZXJlIHRoZSBkYXRhIGJlbG9uZ3MgdG8gKGUuZy4gZ3JvdXAgb2YgdHlwZSBtYWlsKVxuXHQgKi9cblx0YXN5bmMgcmVxdWVzdFdyaXRlVG9rZW4oYXJjaGl2ZURhdGFUeXBlOiBBcmNoaXZlRGF0YVR5cGUsIG93bmVyR3JvdXBJZDogSWQpOiBQcm9taXNlPEJsb2JTZXJ2ZXJBY2Nlc3NJbmZvPiB7XG5cdFx0Y29uc3QgcmVxdWVzdE5ld1Rva2VuID0gYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgdG9rZW5SZXF1ZXN0ID0gY3JlYXRlQmxvYkFjY2Vzc1Rva2VuUG9zdEluKHtcblx0XHRcdFx0YXJjaGl2ZURhdGFUeXBlLFxuXHRcdFx0XHR3cml0ZTogY3JlYXRlQmxvYldyaXRlRGF0YSh7XG5cdFx0XHRcdFx0YXJjaGl2ZU93bmVyR3JvdXA6IG93bmVyR3JvdXBJZCxcblx0XHRcdFx0fSksXG5cdFx0XHRcdHJlYWQ6IG51bGwsXG5cdFx0XHR9KVxuXHRcdFx0Y29uc3QgeyBibG9iQWNjZXNzSW5mbyB9ID0gYXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChCbG9iQWNjZXNzVG9rZW5TZXJ2aWNlLCB0b2tlblJlcXVlc3QpXG5cdFx0XHRyZXR1cm4gYmxvYkFjY2Vzc0luZm9cblx0XHR9XG5cdFx0Y29uc3Qga2V5ID0gdGhpcy5tYWtlV3JpdGVDYWNoZUtleShvd25lckdyb3VwSWQsIGFyY2hpdmVEYXRhVHlwZSlcblx0XHRyZXR1cm4gdGhpcy53cml0ZUNhY2hlLmdldFRva2VuKGtleSwgW10sIHJlcXVlc3ROZXdUb2tlbilcblx0fVxuXG5cdHByaXZhdGUgbWFrZVdyaXRlQ2FjaGVLZXkob3duZXJHcm91cElkOiBzdHJpbmcsIGFyY2hpdmVEYXRhVHlwZTogQXJjaGl2ZURhdGFUeXBlKSB7XG5cdFx0cmV0dXJuIG93bmVyR3JvdXBJZCArIGFyY2hpdmVEYXRhVHlwZVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlbW92ZSBhIGdpdmVuIHdyaXRlIHRva2VuIGZyb20gdGhlIGNhY2hlLlxuXHQgKiBAcGFyYW0gYXJjaGl2ZURhdGFUeXBlXG5cdCAqIEBwYXJhbSBvd25lckdyb3VwSWRcblx0ICovXG5cdGV2aWN0V3JpdGVUb2tlbihhcmNoaXZlRGF0YVR5cGU6IEFyY2hpdmVEYXRhVHlwZSwgb3duZXJHcm91cElkOiBJZCk6IHZvaWQge1xuXHRcdGNvbnN0IGtleSA9IHRoaXMubWFrZVdyaXRlQ2FjaGVLZXkob3duZXJHcm91cElkLCBhcmNoaXZlRGF0YVR5cGUpXG5cdFx0dGhpcy53cml0ZUNhY2hlLmV2aWN0QXJjaGl2ZU9yR3JvdXBLZXkoa2V5KVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlcXVlc3RzIGEgdG9rZW4gdGhhdCBncmFudHMgcmVhZCBhY2Nlc3MgdG8gYWxsIGJsb2JzIHRoYXQgYXJlIHJlZmVyZW5jZWQgYnkgdGhlIGdpdmVuIGluc3RhbmNlcy5cblx0ICogQSB1c2VyIG11c3QgYmUgb3duZXIgb2YgdGhlIGluc3RhbmNlIGJ1dCBtdXN0IG5vdCBiZSBvd25lciBvZiB0aGUgYXJjaGl2ZSB3aGVyZSB0aGUgYmxvYnMgYXJlIHN0b3JlZCBpbi5cblx0ICpcblx0ICogQHBhcmFtIGFyY2hpdmVEYXRhVHlwZSBzcGVjaWZ5IHRoZSBkYXRhIHR5cGVcblx0ICogQHBhcmFtIHJlZmVyZW5jaW5nSW5zdGFuY2VzIHRoZSBpbnN0YW5jZXMgdGhhdCByZWZlcmVuY2VzIHRoZSBibG9ic1xuXHQgKiBAcGFyYW0gYmxvYkxvYWRPcHRpb25zIGxvYWQgb3B0aW9ucyB3aGVuIGxvYWRpbmcgYmxvYnNcblx0ICogQHRocm93cyBQcm9ncmFtbWluZ0Vycm9yIGlmIGluc3RhbmNlcyBhcmUgbm90IHBhcnQgb2YgdGhlIHNhbWUgbGlzdCBvciBibG9icyBhcmUgbm90IHBhcnQgb2YgdGhlIHNhbWUgYXJjaGl2ZS5cblx0ICovXG5cdGFzeW5jIHJlcXVlc3RSZWFkVG9rZW5NdWx0aXBsZUluc3RhbmNlcyhcblx0XHRhcmNoaXZlRGF0YVR5cGU6IEFyY2hpdmVEYXRhVHlwZSxcblx0XHRyZWZlcmVuY2luZ0luc3RhbmNlczogcmVhZG9ubHkgQmxvYlJlZmVyZW5jaW5nSW5zdGFuY2VbXSxcblx0XHRibG9iTG9hZE9wdGlvbnM6IEJsb2JMb2FkT3B0aW9ucyxcblx0KTogUHJvbWlzZTxCbG9iU2VydmVyQWNjZXNzSW5mbz4ge1xuXHRcdGlmIChpc0VtcHR5KHJlZmVyZW5jaW5nSW5zdGFuY2VzKSkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJNdXN0IHBhc3MgYXQgbGVhc3Qgb25lIHJlZmVyZW5jaW5nIGluc3RhbmNlXCIpXG5cdFx0fVxuXHRcdGNvbnN0IGluc3RhbmNlTGlzdElkID0gcmVmZXJlbmNpbmdJbnN0YW5jZXNbMF0ubGlzdElkXG5cdFx0aWYgKCFyZWZlcmVuY2luZ0luc3RhbmNlcy5ldmVyeSgoaW5zdGFuY2UpID0+IGluc3RhbmNlLmxpc3RJZCA9PT0gaW5zdGFuY2VMaXN0SWQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIkFsbCByZWZlcmVuY2luZyBpbnN0YW5jZXMgbXVzdCBiZSBwYXJ0IG9mIHRoZSBzYW1lIGxpc3RcIilcblx0XHR9XG5cblx0XHRjb25zdCBhcmNoaXZlSWQgPSB0aGlzLmdldEFyY2hpdmVJZChyZWZlcmVuY2luZ0luc3RhbmNlcylcblxuXHRcdGNvbnN0IHJlcXVlc3ROZXdUb2tlbiA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBpbnN0YW5jZUlkcyA9IHJlZmVyZW5jaW5nSW5zdGFuY2VzLm1hcCgoeyBlbGVtZW50SWQgfSkgPT4gY3JlYXRlSW5zdGFuY2VJZCh7IGluc3RhbmNlSWQ6IGVsZW1lbnRJZCB9KSlcblx0XHRcdGNvbnN0IHRva2VuUmVxdWVzdCA9IGNyZWF0ZUJsb2JBY2Nlc3NUb2tlblBvc3RJbih7XG5cdFx0XHRcdGFyY2hpdmVEYXRhVHlwZSxcblx0XHRcdFx0cmVhZDogY3JlYXRlQmxvYlJlYWREYXRhKHtcblx0XHRcdFx0XHRhcmNoaXZlSWQsXG5cdFx0XHRcdFx0aW5zdGFuY2VMaXN0SWQsXG5cdFx0XHRcdFx0aW5zdGFuY2VJZHMsXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHR3cml0ZTogbnVsbCxcblx0XHRcdH0pXG5cdFx0XHRjb25zdCB7IGJsb2JBY2Nlc3NJbmZvIH0gPSBhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5wb3N0KEJsb2JBY2Nlc3NUb2tlblNlcnZpY2UsIHRva2VuUmVxdWVzdCwgYmxvYkxvYWRPcHRpb25zKVxuXHRcdFx0cmV0dXJuIGJsb2JBY2Nlc3NJbmZvXG5cdFx0fSlcblxuXHRcdHJldHVybiB0aGlzLnJlYWRDYWNoZS5nZXRUb2tlbihcblx0XHRcdGFyY2hpdmVJZCxcblx0XHRcdHJlZmVyZW5jaW5nSW5zdGFuY2VzLm1hcCgoaW5zdGFuY2UpID0+IGluc3RhbmNlLmVsZW1lbnRJZCksXG5cdFx0XHRyZXF1ZXN0TmV3VG9rZW4sXG5cdFx0KVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlcXVlc3RzIGEgdG9rZW4gdGhhdCBncmFudHMgcmVhZCBhY2Nlc3MgdG8gYWxsIGJsb2JzIHRoYXQgYXJlIHJlZmVyZW5jZWQgYnkgdGhlIGdpdmVuIGluc3RhbmNlLlxuXHQgKiBBIHVzZXIgbXVzdCBiZSBvd25lciBvZiB0aGUgaW5zdGFuY2UgYnV0IG11c3Qgbm90IGJlIG93bmVyIG9mIHRoZSBhcmNoaXZlIHdlcmUgdGhlIGJsb2JzIGFyZSBzdG9yZWQgaW4uXG5cdCAqIEBwYXJhbSBhcmNoaXZlRGF0YVR5cGUgc3BlY2lmeSB0aGUgZGF0YSB0eXBlXG5cdCAqIEBwYXJhbSByZWZlcmVuY2luZ0luc3RhbmNlIHRoZSBpbnN0YW5jZSB0aGF0IHJlZmVyZW5jZXMgdGhlIGJsb2JzXG5cdCAqIEBwYXJhbSBibG9iTG9hZE9wdGlvbnMgbG9hZCBvcHRpb25zIHdoZW4gbG9hZGluZyBibG9ic1xuXHQgKi9cblx0YXN5bmMgcmVxdWVzdFJlYWRUb2tlbkJsb2JzKFxuXHRcdGFyY2hpdmVEYXRhVHlwZTogQXJjaGl2ZURhdGFUeXBlLFxuXHRcdHJlZmVyZW5jaW5nSW5zdGFuY2U6IEJsb2JSZWZlcmVuY2luZ0luc3RhbmNlLFxuXHRcdGJsb2JMb2FkT3B0aW9uczogQmxvYkxvYWRPcHRpb25zLFxuXHQpOiBQcm9taXNlPEJsb2JTZXJ2ZXJBY2Nlc3NJbmZvPiB7XG5cdFx0Y29uc3QgYXJjaGl2ZUlkID0gdGhpcy5nZXRBcmNoaXZlSWQoW3JlZmVyZW5jaW5nSW5zdGFuY2VdKVxuXHRcdGNvbnN0IHJlcXVlc3ROZXdUb2tlbiA9IGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGluc3RhbmNlTGlzdElkID0gcmVmZXJlbmNpbmdJbnN0YW5jZS5saXN0SWRcblx0XHRcdGNvbnN0IGluc3RhbmNlSWQgPSByZWZlcmVuY2luZ0luc3RhbmNlLmVsZW1lbnRJZFxuXHRcdFx0Y29uc3QgaW5zdGFuY2VJZHMgPSBbY3JlYXRlSW5zdGFuY2VJZCh7IGluc3RhbmNlSWQgfSldXG5cdFx0XHRjb25zdCB0b2tlblJlcXVlc3QgPSBjcmVhdGVCbG9iQWNjZXNzVG9rZW5Qb3N0SW4oe1xuXHRcdFx0XHRhcmNoaXZlRGF0YVR5cGUsXG5cdFx0XHRcdHJlYWQ6IGNyZWF0ZUJsb2JSZWFkRGF0YSh7XG5cdFx0XHRcdFx0YXJjaGl2ZUlkLFxuXHRcdFx0XHRcdGluc3RhbmNlTGlzdElkLFxuXHRcdFx0XHRcdGluc3RhbmNlSWRzLFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0d3JpdGU6IG51bGwsXG5cdFx0XHR9KVxuXHRcdFx0Y29uc3QgeyBibG9iQWNjZXNzSW5mbyB9ID0gYXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChCbG9iQWNjZXNzVG9rZW5TZXJ2aWNlLCB0b2tlblJlcXVlc3QsIGJsb2JMb2FkT3B0aW9ucylcblx0XHRcdHJldHVybiBibG9iQWNjZXNzSW5mb1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5yZWFkQ2FjaGUuZ2V0VG9rZW4oYXJjaGl2ZUlkLCBbcmVmZXJlbmNpbmdJbnN0YW5jZS5lbGVtZW50SWRdLCByZXF1ZXN0TmV3VG9rZW4pXG5cdH1cblxuXHQvKipcblx0ICogUmVtb3ZlIGEgZ2l2ZW4gcmVhZCBibG9icyB0b2tlbiBmcm9tIHRoZSBjYWNoZS5cblx0ICogQHBhcmFtIHJlZmVyZW5jaW5nSW5zdGFuY2Vcblx0ICovXG5cdGV2aWN0UmVhZEJsb2JzVG9rZW4ocmVmZXJlbmNpbmdJbnN0YW5jZTogQmxvYlJlZmVyZW5jaW5nSW5zdGFuY2UpOiB2b2lkIHtcblx0XHR0aGlzLnJlYWRDYWNoZS5ldmljdEluc3RhbmNlSWQocmVmZXJlbmNpbmdJbnN0YW5jZS5lbGVtZW50SWQpXG5cdFx0Y29uc3QgYXJjaGl2ZUlkID0gdGhpcy5nZXRBcmNoaXZlSWQoW3JlZmVyZW5jaW5nSW5zdGFuY2VdKVxuXHRcdHRoaXMucmVhZENhY2hlLmV2aWN0QXJjaGl2ZU9yR3JvdXBLZXkoYXJjaGl2ZUlkKVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlbW92ZSBhIGdpdmVuIHJlYWQgYmxvYnMgdG9rZW4gZnJvbSB0aGUgY2FjaGUuXG5cdCAqIEBwYXJhbSByZWZlcmVuY2luZ0luc3RhbmNlc1xuXHQgKi9cblx0ZXZpY3RSZWFkQmxvYnNUb2tlbk11bHRpcGxlQmxvYnMocmVmZXJlbmNpbmdJbnN0YW5jZXM6IEJsb2JSZWZlcmVuY2luZ0luc3RhbmNlW10pOiB2b2lkIHtcblx0XHR0aGlzLnJlYWRDYWNoZS5ldmljdEFsbChyZWZlcmVuY2luZ0luc3RhbmNlcy5tYXAoKGluc3RhbmNlKSA9PiBpbnN0YW5jZS5lbGVtZW50SWQpKVxuXHRcdGNvbnN0IGFyY2hpdmVJZCA9IHRoaXMuZ2V0QXJjaGl2ZUlkKHJlZmVyZW5jaW5nSW5zdGFuY2VzKVxuXHRcdHRoaXMucmVhZENhY2hlLmV2aWN0QXJjaGl2ZU9yR3JvdXBLZXkoYXJjaGl2ZUlkKVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlcXVlc3RzIGEgdG9rZW4gdGhhdCBncmFudHMgYWNjZXNzIHRvIGFsbCBibG9icyBzdG9yZWQgaW4gdGhlIGdpdmVuIGFyY2hpdmUuIFRoZSB1c2VyIG11c3Qgb3duIHRoZSBhcmNoaXZlIChtZW1iZXIgb2YgZ3JvdXApXG5cdCAqIEBwYXJhbSBhcmNoaXZlSWQgSUQgZm9yIHRoZSBhcmNoaXZlIHRvIHJlYWQgYmxvYnMgZnJvbVxuXHQgKi9cblx0YXN5bmMgcmVxdWVzdFJlYWRUb2tlbkFyY2hpdmUoYXJjaGl2ZUlkOiBJZCk6IFByb21pc2U8QmxvYlNlcnZlckFjY2Vzc0luZm8+IHtcblx0XHRjb25zdCByZXF1ZXN0TmV3VG9rZW4gPSBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCB0b2tlblJlcXVlc3QgPSBjcmVhdGVCbG9iQWNjZXNzVG9rZW5Qb3N0SW4oe1xuXHRcdFx0XHRhcmNoaXZlRGF0YVR5cGU6IG51bGwsXG5cdFx0XHRcdHJlYWQ6IGNyZWF0ZUJsb2JSZWFkRGF0YSh7XG5cdFx0XHRcdFx0YXJjaGl2ZUlkLFxuXHRcdFx0XHRcdGluc3RhbmNlSWRzOiBbXSxcblx0XHRcdFx0XHRpbnN0YW5jZUxpc3RJZDogbnVsbCxcblx0XHRcdFx0fSksXG5cdFx0XHRcdHdyaXRlOiBudWxsLFxuXHRcdFx0fSlcblx0XHRcdGNvbnN0IHsgYmxvYkFjY2Vzc0luZm8gfSA9IGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoQmxvYkFjY2Vzc1Rva2VuU2VydmljZSwgdG9rZW5SZXF1ZXN0KVxuXHRcdFx0cmV0dXJuIGJsb2JBY2Nlc3NJbmZvXG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnJlYWRDYWNoZS5nZXRUb2tlbihhcmNoaXZlSWQsIFtdLCByZXF1ZXN0TmV3VG9rZW4pXG5cdH1cblxuXHQvKipcblx0ICogUmVtb3ZlIGEgZ2l2ZW4gcmVhZCBhcmNoaXZlIHRva2VuIGZyb20gdGhlIGNhY2hlLlxuXHQgKiBAcGFyYW0gYXJjaGl2ZUlkXG5cdCAqL1xuXHRldmljdEFyY2hpdmVUb2tlbihhcmNoaXZlSWQ6IElkKTogdm9pZCB7XG5cdFx0dGhpcy5yZWFkQ2FjaGUuZXZpY3RBcmNoaXZlT3JHcm91cEtleShhcmNoaXZlSWQpXG5cdH1cblxuXHRwcml2YXRlIGdldEFyY2hpdmVJZChyZWZlcmVuY2luZ0luc3RhbmNlczogcmVhZG9ubHkgQmxvYlJlZmVyZW5jaW5nSW5zdGFuY2VbXSk6IElkIHtcblx0XHRpZiAoaXNFbXB0eShyZWZlcmVuY2luZ0luc3RhbmNlcykpIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwiTXVzdCBwYXNzIGF0IGxlYXN0IG9uZSByZWZlcmVuY2luZyBpbnN0YW5jZVwiKVxuXHRcdH1cblx0XHRjb25zdCBhcmNoaXZlSWRzID0gbmV3IFNldDxJZD4oKVxuXHRcdGZvciAoY29uc3QgcmVmZXJlbmNpbmdJbnN0YW5jZSBvZiByZWZlcmVuY2luZ0luc3RhbmNlcykge1xuXHRcdFx0aWYgKGlzRW1wdHkocmVmZXJlbmNpbmdJbnN0YW5jZS5ibG9icykpIHtcblx0XHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJtdXN0IHBhc3MgYmxvYnNcIilcblx0XHRcdH1cblx0XHRcdGZvciAoY29uc3QgYmxvYiBvZiByZWZlcmVuY2luZ0luc3RhbmNlLmJsb2JzKSB7XG5cdFx0XHRcdGFyY2hpdmVJZHMuYWRkKGJsb2IuYXJjaGl2ZUlkKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChhcmNoaXZlSWRzLnNpemUgIT0gMSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBvbmx5IG9uZSBhcmNoaXZlIGlkIGFsbG93ZWQsIGJ1dCB3YXMgJHthcmNoaXZlSWRzfWApXG5cdFx0fVxuXHRcdHJldHVybiByZWZlcmVuY2luZ0luc3RhbmNlc1swXS5ibG9ic1swXS5hcmNoaXZlSWRcblx0fVxuXG5cdC8qKlxuXHQgKlxuXHQgKiBAcGFyYW0gYmxvYlNlcnZlckFjY2Vzc0luZm9cblx0ICogQHBhcmFtIGFkZGl0aW9uYWxSZXF1ZXN0UGFyYW1zXG5cdCAqIEBwYXJhbSB0eXBlUmVmIHRoZSB0eXBlUmVmIHRoYXQgc2hhbGwgYmUgdXNlZCB0byBkZXRlcm1pbmUgdGhlIGNvcnJlY3QgbW9kZWwgdmVyc2lvblxuXHQgKi9cblx0cHVibGljIGFzeW5jIGNyZWF0ZVF1ZXJ5UGFyYW1zKGJsb2JTZXJ2ZXJBY2Nlc3NJbmZvOiBCbG9iU2VydmVyQWNjZXNzSW5mbywgYWRkaXRpb25hbFJlcXVlc3RQYXJhbXM6IERpY3QsIHR5cGVSZWY6IFR5cGVSZWY8YW55Pik6IFByb21pc2U8RGljdD4ge1xuXHRcdGNvbnN0IHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKHR5cGVSZWYpXG5cdFx0cmV0dXJuIE9iamVjdC5hc3NpZ24oXG5cdFx0XHRhZGRpdGlvbmFsUmVxdWVzdFBhcmFtcyxcblx0XHRcdHtcblx0XHRcdFx0YmxvYkFjY2Vzc1Rva2VuOiBibG9iU2VydmVyQWNjZXNzSW5mby5ibG9iQWNjZXNzVG9rZW4sXG5cdFx0XHRcdHY6IHR5cGVNb2RlbC52ZXJzaW9uLFxuXHRcdFx0fSxcblx0XHRcdHRoaXMuYXV0aERhdGFQcm92aWRlci5jcmVhdGVBdXRoSGVhZGVycygpLFxuXHRcdClcblx0fVxufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gYWNjZXNzIHRva2VuIGNhbiBiZSB1c2VkIGZvciBhbm90aGVyIGJsb2Igc2VydmljZSByZXF1ZXN0cy5cbiAqIEBwYXJhbSBibG9iU2VydmVyQWNjZXNzSW5mb1xuICogQHBhcmFtIGRhdGVQcm92aWRlclxuICovXG5mdW5jdGlvbiBjYW5CZVVzZWRGb3JBbm90aGVyUmVxdWVzdChibG9iU2VydmVyQWNjZXNzSW5mbzogQmxvYlNlcnZlckFjY2Vzc0luZm8sIGRhdGVQcm92aWRlcjogRGF0ZVByb3ZpZGVyKTogYm9vbGVhbiB7XG5cdHJldHVybiBibG9iU2VydmVyQWNjZXNzSW5mby5leHBpcmVzLmdldFRpbWUoKSA+IGRhdGVQcm92aWRlci5ub3coKVxufVxuXG5jbGFzcyBCbG9iQWNjZXNzVG9rZW5DYWNoZSB7XG5cdHByaXZhdGUgcmVhZG9ubHkgaW5zdGFuY2VNYXA6IE1hcDxJZCwgQmxvYlNlcnZlckFjY2Vzc0luZm8+ID0gbmV3IE1hcCgpXG5cdHByaXZhdGUgcmVhZG9ubHkgYXJjaGl2ZU1hcDogTWFwPElkLCBCbG9iU2VydmVyQWNjZXNzSW5mbz4gPSBuZXcgTWFwKClcblxuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGRhdGVQcm92aWRlcjogRGF0ZVByb3ZpZGVyKSB7fVxuXG5cdC8qKlxuXHQgKiBHZXQgYSB0b2tlbiBmcm9tIHRoZSBjYWNoZSBvciBmcm9tIHtAcGFyYW0gbG9hZGVyfS5cblx0ICogRmlyc3Qgd2lsbCB0cnkgdG8gdXNlIHRoZSB0b2tlbiBrZXllZCBieSB7QHBhcmFtIGFyY2hpdmVPckdyb3VwS2V5fSwgb3RoZXJ3aXNlIGl0IHdpbGwgdHJ5IHRvIGZpbmQgYSB0b2tlbiB2YWxpZCBmb3IgYWxsIG9mIHtAcGFyYW0gaW5zdGFuY2VJZHN9LlxuXHQgKi9cblx0cHVibGljIGFzeW5jIGdldFRva2VuKFxuXHRcdGFyY2hpdmVPckdyb3VwS2V5OiBJZCB8IG51bGwsXG5cdFx0aW5zdGFuY2VJZHM6IHJlYWRvbmx5IElkW10sXG5cdFx0bG9hZGVyOiAoKSA9PiBQcm9taXNlPEJsb2JTZXJ2ZXJBY2Nlc3NJbmZvPixcblx0KTogUHJvbWlzZTxCbG9iU2VydmVyQWNjZXNzSW5mbz4ge1xuXHRcdGNvbnN0IGFyY2hpdmVUb2tlbiA9IGFyY2hpdmVPckdyb3VwS2V5ID8gdGhpcy5hcmNoaXZlTWFwLmdldChhcmNoaXZlT3JHcm91cEtleSkgOiBudWxsXG5cdFx0aWYgKGFyY2hpdmVUb2tlbiAhPSBudWxsICYmIGNhbkJlVXNlZEZvckFub3RoZXJSZXF1ZXN0KGFyY2hpdmVUb2tlbiwgdGhpcy5kYXRlUHJvdmlkZXIpKSB7XG5cdFx0XHRyZXR1cm4gYXJjaGl2ZVRva2VuXG5cdFx0fVxuXG5cdFx0Y29uc3QgdG9rZW5zID0gZGVkdXBsaWNhdGUoaW5zdGFuY2VJZHMubWFwKChpZCkgPT4gdGhpcy5pbnN0YW5jZU1hcC5nZXQoaWQpID8/IG51bGwpKVxuXHRcdGNvbnN0IGZpcnN0VG9rZW5Gb3VuZCA9IGZpcnN0KHRva2Vucylcblx0XHRpZiAodG9rZW5zLmxlbmd0aCAhPSAxIHx8IGZpcnN0VG9rZW5Gb3VuZCA9PSBudWxsIHx8ICFjYW5CZVVzZWRGb3JBbm90aGVyUmVxdWVzdChmaXJzdFRva2VuRm91bmQsIHRoaXMuZGF0ZVByb3ZpZGVyKSkge1xuXHRcdFx0Y29uc3QgbmV3VG9rZW4gPSBhd2FpdCBsb2FkZXIoKVxuXHRcdFx0aWYgKGFyY2hpdmVPckdyb3VwS2V5ICE9IG51bGwgJiYgbmV3VG9rZW4udG9rZW5LaW5kID09PSBCbG9iQWNjZXNzVG9rZW5LaW5kLkFyY2hpdmUpIHtcblx0XHRcdFx0dGhpcy5hcmNoaXZlTWFwLnNldChhcmNoaXZlT3JHcm91cEtleSwgbmV3VG9rZW4pXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmb3IgKGNvbnN0IGlkIG9mIGluc3RhbmNlSWRzKSB7XG5cdFx0XHRcdFx0dGhpcy5pbnN0YW5jZU1hcC5zZXQoaWQsIG5ld1Rva2VuKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbmV3VG9rZW5cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZpcnN0VG9rZW5Gb3VuZFxuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBldmljdEluc3RhbmNlSWQoaWQ6IElkKTogdm9pZCB7XG5cdFx0dGhpcy5ldmljdEFsbChbaWRdKVxuXHR9XG5cblx0cHVibGljIGV2aWN0QXJjaGl2ZU9yR3JvdXBLZXkoaWQ6IElkKTogdm9pZCB7XG5cdFx0dGhpcy5hcmNoaXZlTWFwLmRlbGV0ZShpZClcblx0fVxuXG5cdHB1YmxpYyBldmljdEFsbChpZHM6IElkW10pOiB2b2lkIHtcblx0XHRmb3IgKGNvbnN0IGlkIG9mIGlkcykge1xuXHRcdFx0dGhpcy5pbnN0YW5jZU1hcC5kZWxldGUoaWQpXG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgeyBkZWJvdW5jZSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgY3JlYXRlVXBkYXRlU2Vzc2lvbktleXNQb3N0SW4sIEdyb3VwS2V5VXBkYXRlVHlwZVJlZiwgSW5zdGFuY2VTZXNzaW9uS2V5IH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBMb2NrZWRFcnJvciB9IGZyb20gXCIuLi8uLi9jb21tb24vZXJyb3IvUmVzdEVycm9yXCJcbmltcG9ydCB7IGFzc2VydFdvcmtlck9yTm9kZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW52XCJcbmltcG9ydCB7IElTZXJ2aWNlRXhlY3V0b3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL1NlcnZpY2VSZXF1ZXN0XCJcbmltcG9ydCB7IFVwZGF0ZVNlc3Npb25LZXlzU2VydmljZSB9IGZyb20gXCIuLi8uLi9lbnRpdGllcy9zeXMvU2VydmljZXNcIlxuaW1wb3J0IHsgVXNlckZhY2FkZSB9IGZyb20gXCIuLi9mYWNhZGVzL1VzZXJGYWNhZGVcIlxuaW1wb3J0IHsgVHlwZU1vZGVsIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnRpdHlUeXBlcy5qc1wiXG5pbXBvcnQgeyByZXNvbHZlVHlwZVJlZmVyZW5jZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5RnVuY3Rpb25zLmpzXCJcblxuYXNzZXJ0V29ya2VyT3JOb2RlKClcblxuZXhwb3J0IGNvbnN0IFVQREFURV9TRVNTSU9OX0tFWVNfU0VSVklDRV9ERUJPVU5DRV9NUyA9IDUwXG5cbi8qKlxuICogVGhpcyBxdWV1ZSBjb2xsZWN0cyB1cGRhdGVzIGZvciBvd25lckVuY1Nlc3Npb25LZXlzIGFuZCBkZWJvdW5jZXMgdGhlIHVwZGF0ZSByZXF1ZXN0IHRvIHRoZSBVcGRhdGVTZXNzaW9uS2V5c1NlcnZpY2UsXG4gKiBpbiBvcmRlciB0byB1cGRhdGUgYXMgbWFueSBpbnN0YW5jZXMgaW4gb25lIHJlcXVlc3QgYXMgcG9zc2libGUuXG4gKlxuICogSW4gY2FzZSBvZiBMb2NrZWRFcnJvcnMgaXQgd2lsbCByZXRyeS4gSW4gY2FzZSBvZiBvdGhlciBlcnJvcnMgaXQgd2lsbCBkaXNjYXJkIHRoZSB1cGRhdGUuXG4gKiAoVGhlIG5leHQgdGltZSB0aGUgaW5zdGFuY2Ugc2Vzc2lvbiBrZXkgaXMgcmVzb2x2ZWQgdXNpbmcgdGhlIGJ1Y2tldCBrZXkgYSBuZXcgdXBkYXRlIGF0dGVtcHQgd2lsbCBiZSBtYWRlIGZvciB0aG9zZSBpbnN0YW5jZXMuKVxuICovXG5leHBvcnQgY2xhc3MgT3duZXJFbmNTZXNzaW9uS2V5c1VwZGF0ZVF1ZXVlIHtcblx0cHJpdmF0ZSB1cGRhdGVJbnN0YW5jZVNlc3Npb25LZXlRdWV1ZTogQXJyYXk8SW5zdGFuY2VTZXNzaW9uS2V5PiA9IFtdXG5cdHByaXZhdGUgcmVhZG9ubHkgaW52b2tlVXBkYXRlU2Vzc2lvbktleVNlcnZpY2U6ICgpID0+IFByb21pc2U8dm9pZD5cblx0cHJpdmF0ZSBzZW5kZXJBdXRoU3RhdHVzRm9yTWFpbEluc3RhbmNlOiB7IGF1dGhlbnRpY2F0ZWQ6IGJvb2xlYW47IGluc3RhbmNlRWxlbWVudElkOiBJZCB9IHwgbnVsbCA9IG51bGxcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IHVzZXJGYWNhZGU6IFVzZXJGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzZXJ2aWNlRXhlY3V0b3I6IElTZXJ2aWNlRXhlY3V0b3IsXG5cdFx0Ly8gYWxsb3cgcGFzc2luZyB0aGUgdGltZW91dCBmb3IgdGVzdGFiaWxpdHlcblx0XHRkZWJvdW5jZVRpbWVvdXRNczogbnVtYmVyID0gVVBEQVRFX1NFU1NJT05fS0VZU19TRVJWSUNFX0RFQk9VTkNFX01TLFxuXHQpIHtcblx0XHR0aGlzLmludm9rZVVwZGF0ZVNlc3Npb25LZXlTZXJ2aWNlID0gZGVib3VuY2UoZGVib3VuY2VUaW1lb3V0TXMsICgpID0+IHRoaXMuc2VuZFVwZGF0ZVJlcXVlc3QoKSlcblx0fVxuXG5cdC8qKlxuXHQgKiBBZGQgdGhlIG93bmVyRW5jU2Vzc2lvbktleSB1cGRhdGVzIHRvIHRoZSBxdWV1ZSBhbmQgZGVib3VuY2UgdGhlIHVwZGF0ZSByZXF1ZXN0LlxuXHQgKlxuXHQgKiBAcGFyYW0gaW5zdGFuY2VTZXNzaW9uS2V5cyBhbGwgaW5zdGFuY2VTZXNzaW9uS2V5cyBmcm9tIG9uZSBidWNrZXRLZXkgY29udGFpbmluZyB0aGUgb3duZXJFbmNTZXNzaW9uS2V5IGFzIHN5bUVuY1Nlc3Npb25LZXlcblx0ICogQHBhcmFtIHR5cGVNb2RlbCBvZiB0aGUgbWFpbiBpbnN0YW5jZSB0aGF0IHdlIGFyZSB1cGRhdGluZyBzZXNzaW9uIGtleXMgZm9yXG5cdCAqL1xuXHRhc3luYyB1cGRhdGVJbnN0YW5jZVNlc3Npb25LZXlzKGluc3RhbmNlU2Vzc2lvbktleXM6IEFycmF5PEluc3RhbmNlU2Vzc2lvbktleT4sIHR5cGVNb2RlbDogVHlwZU1vZGVsKSB7XG5cdFx0aWYgKHRoaXMudXNlckZhY2FkZS5pc0xlYWRlcigpKSB7XG5cdFx0XHRjb25zdCBncm91cEtleVVwZGF0ZVR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKEdyb3VwS2V5VXBkYXRlVHlwZVJlZilcblx0XHRcdGlmIChncm91cEtleVVwZGF0ZVR5cGVNb2RlbC5pZCAhPT0gdHlwZU1vZGVsLmlkKSB7XG5cdFx0XHRcdHRoaXMudXBkYXRlSW5zdGFuY2VTZXNzaW9uS2V5UXVldWUucHVzaCguLi5pbnN0YW5jZVNlc3Npb25LZXlzKVxuXHRcdFx0XHR0aGlzLmludm9rZVVwZGF0ZVNlc3Npb25LZXlTZXJ2aWNlKClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNlbmRVcGRhdGVSZXF1ZXN0KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGluc3RhbmNlU2Vzc2lvbktleXMgPSB0aGlzLnVwZGF0ZUluc3RhbmNlU2Vzc2lvbktleVF1ZXVlXG5cdFx0dGhpcy51cGRhdGVJbnN0YW5jZVNlc3Npb25LZXlRdWV1ZSA9IFtdXG5cdFx0dHJ5IHtcblx0XHRcdGlmIChpbnN0YW5jZVNlc3Npb25LZXlzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5wb3N0VXBkYXRlU2Vzc2lvbktleXNTZXJ2aWNlKGluc3RhbmNlU2Vzc2lvbktleXMpXG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBMb2NrZWRFcnJvcikge1xuXHRcdFx0XHR0aGlzLnVwZGF0ZUluc3RhbmNlU2Vzc2lvbktleVF1ZXVlLnB1c2goLi4uaW5zdGFuY2VTZXNzaW9uS2V5cylcblx0XHRcdFx0dGhpcy5pbnZva2VVcGRhdGVTZXNzaW9uS2V5U2VydmljZSgpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcImVycm9yIGR1cmluZyBzZXNzaW9uIGtleSB1cGRhdGU6XCIsIGUubmFtZSwgaW5zdGFuY2VTZXNzaW9uS2V5cy5sZW5ndGgpXG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRhc3luYyBwb3N0VXBkYXRlU2Vzc2lvbktleXNTZXJ2aWNlKGluc3RhbmNlU2Vzc2lvbktleXM6IEFycmF5PEluc3RhbmNlU2Vzc2lvbktleT4pIHtcblx0XHRjb25zdCBpbnB1dCA9IGNyZWF0ZVVwZGF0ZVNlc3Npb25LZXlzUG9zdEluKHsgb3duZXJFbmNTZXNzaW9uS2V5czogaW5zdGFuY2VTZXNzaW9uS2V5cyB9KVxuXHRcdGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoVXBkYXRlU2Vzc2lvbktleXNTZXJ2aWNlLCBpbnB1dClcblx0fVxufVxuIiwiaW1wb3J0IHsgRXZlbnRCdXNMaXN0ZW5lciB9IGZyb20gXCIuL0V2ZW50QnVzQ2xpZW50LmpzXCJcbmltcG9ydCB7IFdzQ29ubmVjdGlvblN0YXRlIH0gZnJvbSBcIi4uL21haW4vV29ya2VyQ2xpZW50LmpzXCJcbmltcG9ydCB7XG5cdEVudGl0eVVwZGF0ZSxcblx0R3JvdXBLZXlVcGRhdGVUeXBlUmVmLFxuXHRVc2VyR3JvdXBLZXlEaXN0cmlidXRpb25UeXBlUmVmLFxuXHRVc2VyVHlwZVJlZixcblx0V2Vic29ja2V0Q291bnRlckRhdGEsXG5cdFdlYnNvY2tldExlYWRlclN0YXR1cyxcbn0gZnJvbSBcIi4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBSZXBvcnRlZE1haWxGaWVsZE1hcmtlciB9IGZyb20gXCIuLi9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBXZWJzb2NrZXRDb25uZWN0aXZpdHlMaXN0ZW5lciB9IGZyb20gXCIuLi8uLi9taXNjL1dlYnNvY2tldENvbm5lY3Rpdml0eU1vZGVsLmpzXCJcbmltcG9ydCB7IGlzQWRtaW5DbGllbnQsIGlzVGVzdCB9IGZyb20gXCIuLi9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IE1haWxGYWNhZGUgfSBmcm9tIFwiLi9mYWNhZGVzL2xhenkvTWFpbEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBVc2VyRmFjYWRlIH0gZnJvbSBcIi4vZmFjYWRlcy9Vc2VyRmFjYWRlLmpzXCJcbmltcG9ydCB7IEVudGl0eUNsaWVudCB9IGZyb20gXCIuLi9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IEFjY291bnRUeXBlLCBPcGVyYXRpb25UeXBlIH0gZnJvbSBcIi4uL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBpc1NhbWVUeXBlUmVmQnlBdHRyLCBsYXp5QXN5bmMgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGlzU2FtZUlkIH0gZnJvbSBcIi4uL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQgeyBFeHBvc2VkRXZlbnRDb250cm9sbGVyIH0gZnJvbSBcIi4uL21haW4vRXZlbnRDb250cm9sbGVyLmpzXCJcbmltcG9ydCB7IENvbmZpZ3VyYXRpb25EYXRhYmFzZSB9IGZyb20gXCIuL2ZhY2FkZXMvbGF6eS9Db25maWd1cmF0aW9uRGF0YWJhc2UuanNcIlxuaW1wb3J0IHsgS2V5Um90YXRpb25GYWNhZGUgfSBmcm9tIFwiLi9mYWNhZGVzL0tleVJvdGF0aW9uRmFjYWRlLmpzXCJcbmltcG9ydCB7IENhY2hlTWFuYWdlbWVudEZhY2FkZSB9IGZyb20gXCIuL2ZhY2FkZXMvbGF6eS9DYWNoZU1hbmFnZW1lbnRGYWNhZGUuanNcIlxuaW1wb3J0IHR5cGUgeyBRdWV1ZWRCYXRjaCB9IGZyb20gXCIuL0V2ZW50UXVldWUuanNcIlxuXG4vKiogQSBiaXQgb2YgZ2x1ZSB0byBkaXN0cmlidXRlIGV2ZW50IGJ1cyBldmVudHMgYWNyb3NzIHRoZSBhcHAuICovXG5leHBvcnQgY2xhc3MgRXZlbnRCdXNFdmVudENvb3JkaW5hdG9yIGltcGxlbWVudHMgRXZlbnRCdXNMaXN0ZW5lciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY29ubmVjdGl2aXR5TGlzdGVuZXI6IFdlYnNvY2tldENvbm5lY3Rpdml0eUxpc3RlbmVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbWFpbEZhY2FkZTogbGF6eUFzeW5jPE1haWxGYWNhZGU+LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdXNlckZhY2FkZTogVXNlckZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZXZlbnRDb250cm9sbGVyOiBFeHBvc2VkRXZlbnRDb250cm9sbGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY29uZmlndXJhdGlvbkRhdGFiYXNlOiBsYXp5QXN5bmM8Q29uZmlndXJhdGlvbkRhdGFiYXNlPixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGtleVJvdGF0aW9uRmFjYWRlOiBLZXlSb3RhdGlvbkZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNhY2hlTWFuYWdlbWVudEZhY2FkZTogbGF6eUFzeW5jPENhY2hlTWFuYWdlbWVudEZhY2FkZT4sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzZW5kRXJyb3I6IChlcnJvcjogRXJyb3IpID0+IFByb21pc2U8dm9pZD4sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBhcHBTcGVjaWZpY0JhdGNoSGFuZGxpbmc6IChxdWV1ZWRCYXRjaDogUXVldWVkQmF0Y2hbXSkgPT4gdm9pZCxcblx0KSB7fVxuXG5cdG9uV2Vic29ja2V0U3RhdGVDaGFuZ2VkKHN0YXRlOiBXc0Nvbm5lY3Rpb25TdGF0ZSkge1xuXHRcdHRoaXMuY29ubmVjdGl2aXR5TGlzdGVuZXIudXBkYXRlV2ViU29ja2V0U3RhdGUoc3RhdGUpXG5cdH1cblxuXHRhc3luYyBvbkVudGl0eUV2ZW50c1JlY2VpdmVkKGV2ZW50czogRW50aXR5VXBkYXRlW10sIGJhdGNoSWQ6IElkLCBncm91cElkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGF3YWl0IHRoaXMuZW50aXR5RXZlbnRzUmVjZWl2ZWQoZXZlbnRzKVxuXHRcdGF3YWl0IChhd2FpdCB0aGlzLm1haWxGYWNhZGUoKSkuZW50aXR5RXZlbnRzUmVjZWl2ZWQoZXZlbnRzKVxuXHRcdGF3YWl0IHRoaXMuZXZlbnRDb250cm9sbGVyLm9uRW50aXR5VXBkYXRlUmVjZWl2ZWQoZXZlbnRzLCBncm91cElkKVxuXHRcdC8vIENhbGwgdGhlIGluZGV4ZXIgaW4gdGhpcyBsYXN0IHN0ZXAgYmVjYXVzZSBub3cgdGhlIHByb2Nlc3NlZCBldmVudCBpcyBzdG9yZWQgYW5kIHRoZSBpbmRleGVyIGhhcyBhIHNlcGFyYXRlIGV2ZW50IHF1ZXVlIHRoYXRcblx0XHQvLyBzaGFsbCBub3QgcmVjZWl2ZSB0aGUgZXZlbnQgdHdpY2UuXG5cdFx0aWYgKCFpc1Rlc3QoKSAmJiAhaXNBZG1pbkNsaWVudCgpKSB7XG5cdFx0XHRjb25zdCBxdWV1ZWRCYXRjaCA9IHsgZ3JvdXBJZCwgYmF0Y2hJZCwgZXZlbnRzIH1cblx0XHRcdGNvbnN0IGNvbmZpZ3VyYXRpb25EYXRhYmFzZSA9IGF3YWl0IHRoaXMuY29uZmlndXJhdGlvbkRhdGFiYXNlKClcblx0XHRcdGF3YWl0IGNvbmZpZ3VyYXRpb25EYXRhYmFzZS5vbkVudGl0eUV2ZW50c1JlY2VpdmVkKHF1ZXVlZEJhdGNoKVxuXHRcdFx0dGhpcy5hcHBTcGVjaWZpY0JhdGNoSGFuZGxpbmcoW3F1ZXVlZEJhdGNoXSlcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIG1hcmtlcnMgb25seSBwaGlzaGluZyAobm90IHNwYW0pIG1hcmtlciB3aWxsIGJlIHNlbnQgYXMgd2Vic29ja2V0IHVwZGF0ZXNcblx0ICovXG5cdGFzeW5jIG9uUGhpc2hpbmdNYXJrZXJzUmVjZWl2ZWQobWFya2VyczogUmVwb3J0ZWRNYWlsRmllbGRNYXJrZXJbXSkge1xuXHRcdDsoYXdhaXQgdGhpcy5tYWlsRmFjYWRlKCkpLnBoaXNoaW5nTWFya2Vyc1VwZGF0ZVJlY2VpdmVkKG1hcmtlcnMpXG5cdH1cblxuXHRvbkVycm9yKHR1dGFub3RhRXJyb3I6IEVycm9yKSB7XG5cdFx0dGhpcy5zZW5kRXJyb3IodHV0YW5vdGFFcnJvcilcblx0fVxuXG5cdG9uTGVhZGVyU3RhdHVzQ2hhbmdlZChsZWFkZXJTdGF0dXM6IFdlYnNvY2tldExlYWRlclN0YXR1cykge1xuXHRcdHRoaXMuY29ubmVjdGl2aXR5TGlzdGVuZXIub25MZWFkZXJTdGF0dXNDaGFuZ2VkKGxlYWRlclN0YXR1cylcblx0XHRpZiAoIWlzQWRtaW5DbGllbnQoKSkge1xuXHRcdFx0Y29uc3QgdXNlciA9IHRoaXMudXNlckZhY2FkZS5nZXRVc2VyKClcblx0XHRcdGlmIChsZWFkZXJTdGF0dXMubGVhZGVyU3RhdHVzICYmIHVzZXIgJiYgdXNlci5hY2NvdW50VHlwZSAhPT0gQWNjb3VudFR5cGUuRVhURVJOQUwpIHtcblx0XHRcdFx0dGhpcy5rZXlSb3RhdGlvbkZhY2FkZS5wcm9jZXNzUGVuZGluZ0tleVJvdGF0aW9uc0FuZFVwZGF0ZXModXNlcilcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMua2V5Um90YXRpb25GYWNhZGUucmVzZXQoKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdG9uQ291bnRlckNoYW5nZWQoY291bnRlcjogV2Vic29ja2V0Q291bnRlckRhdGEpIHtcblx0XHR0aGlzLmV2ZW50Q29udHJvbGxlci5vbkNvdW50ZXJzVXBkYXRlUmVjZWl2ZWQoY291bnRlcilcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZW50aXR5RXZlbnRzUmVjZWl2ZWQoZGF0YTogRW50aXR5VXBkYXRlW10pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBUaGlzIGlzIGEgY29tcHJvbWlzZSB0byBub3QgYWRkIGVudGl0eUNsaWVudCB0byBVc2VyRmFjYWRlIHdoaWNoIHdvdWxkIGludHJvZHVjZSBhIGNpcmN1bGFyIGRlcC5cblx0XHRjb25zdCBncm91cEtleVVwZGF0ZXM6IElkVHVwbGVbXSA9IFtdIC8vIEdyb3VwS2V5VXBkYXRlcyBhbGwgaW4gdGhlIHNhbWUgbGlzdFxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLnVzZXJGYWNhZGUuZ2V0VXNlcigpXG5cdFx0aWYgKHVzZXIgPT0gbnVsbCkgcmV0dXJuXG5cdFx0Zm9yIChjb25zdCB1cGRhdGUgb2YgZGF0YSkge1xuXHRcdFx0aWYgKFxuXHRcdFx0XHR1cGRhdGUub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLlVQREFURSAmJlxuXHRcdFx0XHRpc1NhbWVUeXBlUmVmQnlBdHRyKFVzZXJUeXBlUmVmLCB1cGRhdGUuYXBwbGljYXRpb24sIHVwZGF0ZS50eXBlKSAmJlxuXHRcdFx0XHRpc1NhbWVJZCh1c2VyLl9pZCwgdXBkYXRlLmluc3RhbmNlSWQpXG5cdFx0XHQpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy51c2VyRmFjYWRlLnVwZGF0ZVVzZXIoYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChVc2VyVHlwZVJlZiwgdXNlci5faWQpKVxuXHRcdFx0fSBlbHNlIGlmIChcblx0XHRcdFx0KHVwZGF0ZS5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuQ1JFQVRFIHx8IHVwZGF0ZS5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuVVBEQVRFKSAmJlxuXHRcdFx0XHRpc1NhbWVUeXBlUmVmQnlBdHRyKFVzZXJHcm91cEtleURpc3RyaWJ1dGlvblR5cGVSZWYsIHVwZGF0ZS5hcHBsaWNhdGlvbiwgdXBkYXRlLnR5cGUpICYmXG5cdFx0XHRcdGlzU2FtZUlkKHVzZXIudXNlckdyb3VwLmdyb3VwLCB1cGRhdGUuaW5zdGFuY2VJZClcblx0XHRcdCkge1xuXHRcdFx0XHRhd2FpdCAoYXdhaXQgdGhpcy5jYWNoZU1hbmFnZW1lbnRGYWNhZGUoKSkudHJ5VXBkYXRpbmdVc2VyR3JvdXBLZXkoKVxuXHRcdFx0fSBlbHNlIGlmICh1cGRhdGUub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLkNSRUFURSAmJiBpc1NhbWVUeXBlUmVmQnlBdHRyKEdyb3VwS2V5VXBkYXRlVHlwZVJlZiwgdXBkYXRlLmFwcGxpY2F0aW9uLCB1cGRhdGUudHlwZSkpIHtcblx0XHRcdFx0Z3JvdXBLZXlVcGRhdGVzLnB1c2goW3VwZGF0ZS5pbnN0YW5jZUxpc3RJZCwgdXBkYXRlLmluc3RhbmNlSWRdKVxuXHRcdFx0fVxuXHRcdH1cblx0XHRhd2FpdCB0aGlzLmtleVJvdGF0aW9uRmFjYWRlLnVwZGF0ZUdyb3VwTWVtYmVyc2hpcHMoZ3JvdXBLZXlVcGRhdGVzKVxuXHR9XG59XG4iLCJpbXBvcnQgeyBhZXMyNTZSYW5kb21LZXksIGtleVRvQmFzZTY0IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS1jcnlwdG9cIlxuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9Mb2dnZXIuanNcIlxuXG4vKipcbiAqICBMb29zZSBjb2xsZWN0aW9uIG9mIGZ1bmN0aW9ucyB0aGF0IHNob3VsZCBiZSBydW4gb24gdGhlIHdvcmtlciBzaWRlIGUuZy4gYmVjYXVzZSB0aGV5IHRha2UgdG9vIG11Y2ggdGltZSBhbmQgZG9uJ3QgYmVsb25nIGFueXdoZXJlIGVsc2UuXG4gKiAgKHJlYWQ6IGtpdGNoZW4gc2luaykuXG4gKi9cbmV4cG9ydCBjbGFzcyBXb3JrZXJGYWNhZGUge1xuXHRhc3luYyBnZW5lcmF0ZVNzZVB1c2hJZGVudGlmZXIoKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRyZXR1cm4ga2V5VG9CYXNlNjQoYWVzMjU2UmFuZG9tS2V5KCkpXG5cdH1cblxuXHRhc3luYyBnZXRMb2coKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuXHRcdGNvbnN0IGdsb2JhbCA9IHNlbGYgYXMgYW55XG5cdFx0Y29uc3QgbG9nZ2VyID0gZ2xvYmFsLmxvZ2dlciBhcyBMb2dnZXIgfCB1bmRlZmluZWRcblxuXHRcdGlmIChsb2dnZXIpIHtcblx0XHRcdHJldHVybiBsb2dnZXIuZ2V0RW50cmllcygpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBbXVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIHVybGlmeShodG1sOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGNvbnN0IHsgdXJsaWZ5IH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9VcmxpZmllci5qc1wiKVxuXHRcdHJldHVybiB1cmxpZnkoaHRtbClcblx0fVxufVxuIiwiaW1wb3J0IHsgQWVzMjU2S2V5LCBBcmdvbjJJREV4cG9ydHMsIGdlbmVyYXRlS2V5RnJvbVBhc3NwaHJhc2VBcmdvbjJpZCwgdWludDhBcnJheVRvQml0QXJyYXkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLWNyeXB0b1wiXG5pbXBvcnQgeyBMYXp5TG9hZGVkLCBzdHJpbmdUb1V0ZjhVaW50OEFycmF5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBOYXRpdmVDcnlwdG9GYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTmF0aXZlQ3J5cHRvRmFjYWRlLmpzXCJcbmltcG9ydCB7IGFzc2VydFdvcmtlck9yTm9kZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IGxvYWRXYXNtIH0gZnJvbSBcImFyZ29uMi53YXNtXCJcblxuYXNzZXJ0V29ya2VyT3JOb2RlKClcblxuLyoqXG4gKiBBYnN0cmFjdCBpbnRlcmZhY2UgZm9yIGdlbmVyYXRpbmcgQXJnb24yaWQgcGFzc3BocmFzZSBrZXlzIHVzaW5nIHRoZSBwcmVmZXJyZWQgaW1wbGVtZW50YXRpb24gKGkuZS4gbmF0aXZlIG9yIFdBU00pXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQXJnb24yaWRGYWNhZGUge1xuXHQvKipcblx0ICogR2VuZXJhdGUgYSBrZXkgZnJvbSBhIHBhc3NwaHJhc2Vcblx0ICogQHBhcmFtIHBhc3NwaHJhc2Vcblx0ICogQHBhcmFtIHNhbHRcblx0ICogQHJldHVybiBiaXQgYXJyYXkgb2YgdGhlIHJlc3VsdGluZyBrZXlcblx0ICovXG5cdGdlbmVyYXRlS2V5RnJvbVBhc3NwaHJhc2UocGFzc3BocmFzZTogc3RyaW5nLCBzYWx0OiBVaW50OEFycmF5KTogUHJvbWlzZTxBZXMyNTZLZXk+XG59XG5cbi8qKlxuICogV2ViQXNzZW1ibHkgaW1wbGVtZW50YXRpb24gb2YgQXJnb24yaWRcbiAqL1xuZXhwb3J0IGNsYXNzIFdBU01BcmdvbjJpZEZhY2FkZSBpbXBsZW1lbnRzIEFyZ29uMmlkRmFjYWRlIHtcblx0Ly8gbG9hZHMgYXJnb24yIFdBU01cblx0cHJpdmF0ZSBhcmdvbjI6IExhenlMb2FkZWQ8QXJnb24ySURFeHBvcnRzPiA9IG5ldyBMYXp5TG9hZGVkKGFzeW5jICgpID0+IHtcblx0XHRyZXR1cm4gYXdhaXQgbG9hZFdhc20oKVxuXHR9KVxuXG5cdGFzeW5jIGdlbmVyYXRlS2V5RnJvbVBhc3NwaHJhc2UocGFzc3BocmFzZTogc3RyaW5nLCBzYWx0OiBVaW50OEFycmF5KTogUHJvbWlzZTxBZXMyNTZLZXk+IHtcblx0XHRyZXR1cm4gZ2VuZXJhdGVLZXlGcm9tUGFzc3BocmFzZUFyZ29uMmlkKGF3YWl0IHRoaXMuYXJnb24yLmdldEFzeW5jKCksIHBhc3NwaHJhc2UsIHNhbHQpXG5cdH1cbn1cblxuLyoqXG4gKiBOYXRpdmUgaW1wbGVtZW50YXRpb24gb2YgQXJnb24yaWRcbiAqL1xuZXhwb3J0IGNsYXNzIE5hdGl2ZUFyZ29uMmlkRmFjYWRlIGltcGxlbWVudHMgQXJnb24yaWRGYWNhZGUge1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IG5hdGl2ZUNyeXB0b0ZhY2FkZTogTmF0aXZlQ3J5cHRvRmFjYWRlKSB7fVxuXG5cdGFzeW5jIGdlbmVyYXRlS2V5RnJvbVBhc3NwaHJhc2UocGFzc3BocmFzZTogc3RyaW5nLCBzYWx0OiBVaW50OEFycmF5KTogUHJvbWlzZTxBZXMyNTZLZXk+IHtcblx0XHRjb25zdCBoYXNoID0gYXdhaXQgdGhpcy5uYXRpdmVDcnlwdG9GYWNhZGUuYXJnb24yaWRHZW5lcmF0ZVBhc3NwaHJhc2VLZXkocGFzc3BocmFzZSwgc2FsdClcblx0XHRyZXR1cm4gdWludDhBcnJheVRvQml0QXJyYXkoaGFzaClcblx0fVxufVxuIiwiaW1wb3J0IHsgTGF6eUxvYWRlZCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgTmF0aXZlQ3J5cHRvRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL05hdGl2ZUNyeXB0b0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBhc3NlcnRXb3JrZXJPck5vZGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0Vudi5qc1wiXG5pbXBvcnQge1xuXHRkZWNhcHN1bGF0ZUt5YmVyLFxuXHRlbmNhcHN1bGF0ZUt5YmVyLFxuXHRnZW5lcmF0ZUtleVBhaXJLeWJlcixcblx0S1lCRVJfUkFORF9BTU9VTlRfT0ZfRU5UUk9QWSxcblx0S3liZXJFbmNhcHN1bGF0aW9uLFxuXHRLeWJlcktleVBhaXIsXG5cdEt5YmVyUHJpdmF0ZUtleSxcblx0S3liZXJQdWJsaWNLZXksXG5cdExpYk9RU0V4cG9ydHMsXG5cdHJhbmRvbSxcbn0gZnJvbSBcIkB0dXRhby90dXRhbm90YS1jcnlwdG9cIlxuaW1wb3J0IHsgbG9hZFdhc20gfSBmcm9tIFwibGlib3FzLndhc21cIlxuXG5hc3NlcnRXb3JrZXJPck5vZGUoKVxuXG4vKipcbiAqIEFic3RyYWN0IGludGVyZmFjZSBmb3IgdGhlIExpYm9xcyBjcnlwdG8gc3lzdGVtLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEt5YmVyRmFjYWRlIHtcblx0LyoqXG5cdCAqIEdlbmVyYXRlIGEga2V5IG5ldyByYW5kb20ga2V5IHBhaXJcblx0ICovXG5cdGdlbmVyYXRlS2V5cGFpcigpOiBQcm9taXNlPEt5YmVyS2V5UGFpcj5cblxuXHQvKipcblx0ICpcblx0ICogQHBhcmFtIHB1YmxpY0tleSB0aGUgcHVibGljIGtleSB0byBlbmNhcHN1bGF0ZSB0aGUgc2VjcmV0IHdpdGhcblx0ICogQHJldHVybnMgdGhlIGNpcGhlcnRleHQgYW5kIHRoZSBzaGFyZWQgc2VjcmV0XG5cdCAqL1xuXHRlbmNhcHN1bGF0ZShwdWJsaWNLZXk6IEt5YmVyUHVibGljS2V5KTogUHJvbWlzZTxLeWJlckVuY2Fwc3VsYXRpb24+XG5cblx0LyoqXG5cdCAqXG5cdCAqIEBwYXJhbSBwcml2YXRlS2V5IHRoZSBjb3JyZXNwb25kaW5nIHByaXZhdGUga2V5IHRvIHRoZSBwdWJsaWMga2V5IHVzZWQgdG8gZW5jYXBzdWxhdGUgdGhlIGNpcGhlciB0ZXh0XG5cdCAqIEBwYXJhbSBjaXBoZXJ0ZXh0IHRoZSBlbmNhcHN1bGF0ZWQgY2lwaGVydGV4dFxuXHQgKiBAcmV0dXJucyB0aGUgc2hhcmVkIHNlY3JldFxuXHQgKi9cblx0ZGVjYXBzdWxhdGUocHJpdmF0ZUtleTogS3liZXJQcml2YXRlS2V5LCBjaXBoZXJ0ZXh0OiBVaW50OEFycmF5KTogUHJvbWlzZTxVaW50OEFycmF5PlxufVxuXG4vKipcbiAqIFdlYkFzc2VtYmx5IGltcGxlbWVudGF0aW9uIG9mIExpYm9xc1xuICovXG5leHBvcnQgY2xhc3MgV0FTTUt5YmVyRmFjYWRlIGltcGxlbWVudHMgS3liZXJGYWNhZGUge1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHRlc3RXQVNNPzogTGliT1FTRXhwb3J0cykge31cblxuXHQvLyBsb2FkcyBsaWJvcXMgV0FTTVxuXHRwcml2YXRlIGxpYm9xczogTGF6eUxvYWRlZDxMaWJPUVNFeHBvcnRzPiA9IG5ldyBMYXp5TG9hZGVkKGFzeW5jICgpID0+IHtcblx0XHRpZiAodGhpcy50ZXN0V0FTTSkge1xuXHRcdFx0cmV0dXJuIHRoaXMudGVzdFdBU01cblx0XHR9XG5cblx0XHRyZXR1cm4gYXdhaXQgbG9hZFdhc20oKVxuXHR9KVxuXG5cdGFzeW5jIGdlbmVyYXRlS2V5cGFpcigpOiBQcm9taXNlPEt5YmVyS2V5UGFpcj4ge1xuXHRcdHJldHVybiBnZW5lcmF0ZUtleVBhaXJLeWJlcihhd2FpdCB0aGlzLmxpYm9xcy5nZXRBc3luYygpLCByYW5kb20pXG5cdH1cblxuXHRhc3luYyBlbmNhcHN1bGF0ZShwdWJsaWNLZXk6IEt5YmVyUHVibGljS2V5KTogUHJvbWlzZTxLeWJlckVuY2Fwc3VsYXRpb24+IHtcblx0XHRyZXR1cm4gZW5jYXBzdWxhdGVLeWJlcihhd2FpdCB0aGlzLmxpYm9xcy5nZXRBc3luYygpLCBwdWJsaWNLZXksIHJhbmRvbSlcblx0fVxuXG5cdGFzeW5jIGRlY2Fwc3VsYXRlKHByaXZhdGVLZXk6IEt5YmVyUHJpdmF0ZUtleSwgY2lwaGVydGV4dDogVWludDhBcnJheSk6IFByb21pc2U8VWludDhBcnJheT4ge1xuXHRcdHJldHVybiBkZWNhcHN1bGF0ZUt5YmVyKGF3YWl0IHRoaXMubGlib3FzLmdldEFzeW5jKCksIHByaXZhdGVLZXksIGNpcGhlcnRleHQpXG5cdH1cbn1cblxuLyoqXG4gKiBOYXRpdmUgaW1wbGVtZW50YXRpb24gb2YgTGlib3FzXG4gKi9cbmV4cG9ydCBjbGFzcyBOYXRpdmVLeWJlckZhY2FkZSBpbXBsZW1lbnRzIEt5YmVyRmFjYWRlIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBuYXRpdmVDcnlwdG9GYWNhZGU6IE5hdGl2ZUNyeXB0b0ZhY2FkZSkge31cblxuXHRnZW5lcmF0ZUtleXBhaXIoKTogUHJvbWlzZTxLeWJlcktleVBhaXI+IHtcblx0XHRyZXR1cm4gdGhpcy5uYXRpdmVDcnlwdG9GYWNhZGUuZ2VuZXJhdGVLeWJlcktleXBhaXIocmFuZG9tLmdlbmVyYXRlUmFuZG9tRGF0YShLWUJFUl9SQU5EX0FNT1VOVF9PRl9FTlRST1BZKSlcblx0fVxuXG5cdGVuY2Fwc3VsYXRlKHB1YmxpY0tleTogS3liZXJQdWJsaWNLZXkpOiBQcm9taXNlPEt5YmVyRW5jYXBzdWxhdGlvbj4ge1xuXHRcdHJldHVybiB0aGlzLm5hdGl2ZUNyeXB0b0ZhY2FkZS5reWJlckVuY2Fwc3VsYXRlKHB1YmxpY0tleSwgcmFuZG9tLmdlbmVyYXRlUmFuZG9tRGF0YShLWUJFUl9SQU5EX0FNT1VOVF9PRl9FTlRST1BZKSlcblx0fVxuXG5cdGRlY2Fwc3VsYXRlKHByaXZhdGVLZXk6IEt5YmVyUHJpdmF0ZUtleSwgY2lwaGVydGV4dDogVWludDhBcnJheSk6IFByb21pc2U8VWludDhBcnJheT4ge1xuXHRcdHJldHVybiB0aGlzLm5hdGl2ZUNyeXB0b0ZhY2FkZS5reWJlckRlY2Fwc3VsYXRlKHByaXZhdGVLZXksIGNpcGhlcnRleHQpXG5cdH1cbn1cbiIsImltcG9ydCB7IEVjY1B1YmxpY0tleSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtY3J5cHRvXCJcbmltcG9ydCB7IGJ5dGVBcnJheXNUb0J5dGVzLCBieXRlc1RvQnl0ZUFycmF5cyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHMvZGlzdC9FbmNvZGluZy5qc1wiXG5cbmV4cG9ydCB0eXBlIFBRTWVzc2FnZSA9IHtcblx0c2VuZGVySWRlbnRpdHlQdWJLZXk6IEVjY1B1YmxpY0tleVxuXHRlcGhlbWVyYWxQdWJLZXk6IEVjY1B1YmxpY0tleVxuXHRlbmNhcHN1bGF0aW9uOiBQUUJ1Y2tldEtleUVuY2Fwc3VsYXRpb25cbn1cblxuZXhwb3J0IHR5cGUgUFFCdWNrZXRLZXlFbmNhcHN1bGF0aW9uID0ge1xuXHRreWJlckNpcGhlclRleHQ6IFVpbnQ4QXJyYXlcblx0a2VrRW5jQnVja2V0S2V5OiBVaW50OEFycmF5XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVQUU1lc3NhZ2UoZW5jb2RlZDogVWludDhBcnJheSk6IFBRTWVzc2FnZSB7XG5cdGNvbnN0IHBxTWVzc2FnZVBhcnRzID0gYnl0ZXNUb0J5dGVBcnJheXMoZW5jb2RlZCwgNClcblx0cmV0dXJuIHtcblx0XHRzZW5kZXJJZGVudGl0eVB1YktleTogcHFNZXNzYWdlUGFydHNbMF0sXG5cdFx0ZXBoZW1lcmFsUHViS2V5OiBwcU1lc3NhZ2VQYXJ0c1sxXSxcblx0XHRlbmNhcHN1bGF0aW9uOiB7XG5cdFx0XHRreWJlckNpcGhlclRleHQ6IHBxTWVzc2FnZVBhcnRzWzJdLFxuXHRcdFx0a2VrRW5jQnVja2V0S2V5OiBwcU1lc3NhZ2VQYXJ0c1szXSxcblx0XHR9LFxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVQUU1lc3NhZ2UoeyBzZW5kZXJJZGVudGl0eVB1YktleSwgZXBoZW1lcmFsUHViS2V5LCBlbmNhcHN1bGF0aW9uIH06IFBRTWVzc2FnZSk6IFVpbnQ4QXJyYXkge1xuXHRyZXR1cm4gYnl0ZUFycmF5c1RvQnl0ZXMoW3NlbmRlcklkZW50aXR5UHViS2V5LCBlcGhlbWVyYWxQdWJLZXksIGVuY2Fwc3VsYXRpb24ua3liZXJDaXBoZXJUZXh0LCBlbmNhcHN1bGF0aW9uLmtla0VuY0J1Y2tldEtleV0pXG59XG4iLCJpbXBvcnQgeyBLeWJlckZhY2FkZSB9IGZyb20gXCIuL0t5YmVyRmFjYWRlLmpzXCJcbmltcG9ydCB7XG5cdEFlczI1NktleSxcblx0YWVzRW5jcnlwdCxcblx0YXV0aGVudGljYXRlZEFlc0RlY3J5cHQsXG5cdGVjY0RlY2Fwc3VsYXRlLFxuXHRlY2NFbmNhcHN1bGF0ZSxcblx0RWNjS2V5UGFpcixcblx0RWNjUHVibGljS2V5LFxuXHRFY2NTaGFyZWRTZWNyZXRzLFxuXHRnZW5lcmF0ZUVjY0tleVBhaXIsXG5cdGhrZGYsXG5cdEtFWV9MRU5HVEhfQllURVNfQUVTXzI1Nixcblx0S2V5UGFpclR5cGUsXG5cdGt5YmVyUHVibGljS2V5VG9CeXRlcyxcblx0UFFLZXlQYWlycyxcblx0cHFLZXlQYWlyc1RvUHVibGljS2V5cyxcblx0UFFQdWJsaWNLZXlzLFxuXHR1aW50OEFycmF5VG9LZXksXG59IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtY3J5cHRvXCJcbmltcG9ydCB7IGNvbmNhdCwgc3RyaW5nVG9VdGY4VWludDhBcnJheSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgZGVjb2RlUFFNZXNzYWdlLCBlbmNvZGVQUU1lc3NhZ2UsIFBRTWVzc2FnZSB9IGZyb20gXCIuL1BRTWVzc2FnZS5qc1wiXG5pbXBvcnQgeyBDcnlwdG9Qcm90b2NvbFZlcnNpb24gfSBmcm9tIFwiLi4vLi4vY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcblxuZXhwb3J0IHR5cGUgRGVjYXBzdWxhdGVkU3ltS2V5ID0ge1xuXHRzZW5kZXJJZGVudGl0eVB1YktleTogRWNjUHVibGljS2V5XG5cdGRlY3J5cHRlZFN5bUtleUJ5dGVzOiBVaW50OEFycmF5XG59XG5cbmV4cG9ydCBjbGFzcyBQUUZhY2FkZSB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkga3liZXJGYWNhZGU6IEt5YmVyRmFjYWRlKSB7fVxuXG5cdHB1YmxpYyBhc3luYyBnZW5lcmF0ZUtleVBhaXJzKCk6IFByb21pc2U8UFFLZXlQYWlycz4ge1xuXHRcdHJldHVybiB7XG5cdFx0XHRrZXlQYWlyVHlwZTogS2V5UGFpclR5cGUuVFVUQV9DUllQVCxcblx0XHRcdGVjY0tleVBhaXI6IGdlbmVyYXRlRWNjS2V5UGFpcigpLFxuXHRcdFx0a3liZXJLZXlQYWlyOiBhd2FpdCB0aGlzLmt5YmVyRmFjYWRlLmdlbmVyYXRlS2V5cGFpcigpLFxuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBlbmNhcHN1bGF0ZUFuZEVuY29kZShcblx0XHRzZW5kZXJJZGVudGl0eUtleVBhaXI6IEVjY0tleVBhaXIsXG5cdFx0ZXBoZW1lcmFsS2V5UGFpcjogRWNjS2V5UGFpcixcblx0XHRyZWNpcGllbnRQdWJsaWNLZXlzOiBQUVB1YmxpY0tleXMsXG5cdFx0YnVja2V0S2V5OiBVaW50OEFycmF5LFxuXHQpOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcblx0XHRjb25zdCBlbmNhcHN1bGF0ZWQgPSBhd2FpdCB0aGlzLmVuY2Fwc3VsYXRlKHNlbmRlcklkZW50aXR5S2V5UGFpciwgZXBoZW1lcmFsS2V5UGFpciwgcmVjaXBpZW50UHVibGljS2V5cywgYnVja2V0S2V5KVxuXHRcdHJldHVybiBlbmNvZGVQUU1lc3NhZ2UoZW5jYXBzdWxhdGVkKVxuXHR9XG5cblx0LyoqXG5cdCAqIEBWaXNpYmxlRm9yVGVzdGluZ1xuXHQgKi9cblx0YXN5bmMgZW5jYXBzdWxhdGUoXG5cdFx0c2VuZGVySWRlbnRpdHlLZXlQYWlyOiBFY2NLZXlQYWlyLFxuXHRcdGVwaGVtZXJhbEtleVBhaXI6IEVjY0tleVBhaXIsXG5cdFx0cmVjaXBpZW50UHVibGljS2V5czogUFFQdWJsaWNLZXlzLFxuXHRcdGJ1Y2tldEtleTogVWludDhBcnJheSxcblx0KTogUHJvbWlzZTxQUU1lc3NhZ2U+IHtcblx0XHRjb25zdCBlY2NTaGFyZWRTZWNyZXQgPSBlY2NFbmNhcHN1bGF0ZShzZW5kZXJJZGVudGl0eUtleVBhaXIucHJpdmF0ZUtleSwgZXBoZW1lcmFsS2V5UGFpci5wcml2YXRlS2V5LCByZWNpcGllbnRQdWJsaWNLZXlzLmVjY1B1YmxpY0tleSlcblx0XHRjb25zdCBreWJlckVuY2Fwc3VsYXRpb24gPSBhd2FpdCB0aGlzLmt5YmVyRmFjYWRlLmVuY2Fwc3VsYXRlKHJlY2lwaWVudFB1YmxpY0tleXMua3liZXJQdWJsaWNLZXkpXG5cdFx0Y29uc3Qga3liZXJDaXBoZXJUZXh0ID0ga3liZXJFbmNhcHN1bGF0aW9uLmNpcGhlcnRleHRcblxuXHRcdGNvbnN0IGtlayA9IHRoaXMuZGVyaXZlUFFLRUsoXG5cdFx0XHRzZW5kZXJJZGVudGl0eUtleVBhaXIucHVibGljS2V5LFxuXHRcdFx0ZXBoZW1lcmFsS2V5UGFpci5wdWJsaWNLZXksXG5cdFx0XHRyZWNpcGllbnRQdWJsaWNLZXlzLFxuXHRcdFx0a3liZXJDaXBoZXJUZXh0LFxuXHRcdFx0a3liZXJFbmNhcHN1bGF0aW9uLnNoYXJlZFNlY3JldCxcblx0XHRcdGVjY1NoYXJlZFNlY3JldCxcblx0XHRcdENyeXB0b1Byb3RvY29sVmVyc2lvbi5UVVRBX0NSWVBULFxuXHRcdClcblxuXHRcdGNvbnN0IGtla0VuY0J1Y2tldEtleSA9IGFlc0VuY3J5cHQoa2VrLCBidWNrZXRLZXkpXG5cdFx0cmV0dXJuIHtcblx0XHRcdHNlbmRlcklkZW50aXR5UHViS2V5OiBzZW5kZXJJZGVudGl0eUtleVBhaXIucHVibGljS2V5LFxuXHRcdFx0ZXBoZW1lcmFsUHViS2V5OiBlcGhlbWVyYWxLZXlQYWlyLnB1YmxpY0tleSxcblx0XHRcdGVuY2Fwc3VsYXRpb246IHtcblx0XHRcdFx0a3liZXJDaXBoZXJUZXh0LFxuXHRcdFx0XHRrZWtFbmNCdWNrZXRLZXk6IGtla0VuY0J1Y2tldEtleSxcblx0XHRcdH0sXG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGRlY2Fwc3VsYXRlRW5jb2RlZChlbmNvZGVkUFFNZXNzYWdlOiBVaW50OEFycmF5LCByZWNpcGllbnRLZXlzOiBQUUtleVBhaXJzKTogUHJvbWlzZTxEZWNhcHN1bGF0ZWRTeW1LZXk+IHtcblx0XHRjb25zdCBkZWNvZGVkID0gZGVjb2RlUFFNZXNzYWdlKGVuY29kZWRQUU1lc3NhZ2UpXG5cdFx0cmV0dXJuIHsgZGVjcnlwdGVkU3ltS2V5Qnl0ZXM6IGF3YWl0IHRoaXMuZGVjYXBzdWxhdGUoZGVjb2RlZCwgcmVjaXBpZW50S2V5cyksIHNlbmRlcklkZW50aXR5UHViS2V5OiBkZWNvZGVkLnNlbmRlcklkZW50aXR5UHViS2V5IH1cblx0fVxuXG5cdC8qKlxuXHQgKiBAVmlzaWJsZUZvclRlc3Rpbmdcblx0ICovXG5cdGFzeW5jIGRlY2Fwc3VsYXRlKG1lc3NhZ2U6IFBRTWVzc2FnZSwgcmVjaXBpZW50S2V5czogUFFLZXlQYWlycyk6IFByb21pc2U8VWludDhBcnJheT4ge1xuXHRcdGNvbnN0IGt5YmVyQ2lwaGVyVGV4dCA9IG1lc3NhZ2UuZW5jYXBzdWxhdGlvbi5reWJlckNpcGhlclRleHRcblx0XHRjb25zdCBlY2NTaGFyZWRTZWNyZXQgPSBlY2NEZWNhcHN1bGF0ZShtZXNzYWdlLnNlbmRlcklkZW50aXR5UHViS2V5LCBtZXNzYWdlLmVwaGVtZXJhbFB1YktleSwgcmVjaXBpZW50S2V5cy5lY2NLZXlQYWlyLnByaXZhdGVLZXkpXG5cdFx0Y29uc3Qga3liZXJTaGFyZWRTZWNyZXQgPSBhd2FpdCB0aGlzLmt5YmVyRmFjYWRlLmRlY2Fwc3VsYXRlKHJlY2lwaWVudEtleXMua3liZXJLZXlQYWlyLnByaXZhdGVLZXksIGt5YmVyQ2lwaGVyVGV4dClcblxuXHRcdGNvbnN0IGtlayA9IHRoaXMuZGVyaXZlUFFLRUsoXG5cdFx0XHRtZXNzYWdlLnNlbmRlcklkZW50aXR5UHViS2V5LFxuXHRcdFx0bWVzc2FnZS5lcGhlbWVyYWxQdWJLZXksXG5cdFx0XHRwcUtleVBhaXJzVG9QdWJsaWNLZXlzKHJlY2lwaWVudEtleXMpLFxuXHRcdFx0a3liZXJDaXBoZXJUZXh0LFxuXHRcdFx0a3liZXJTaGFyZWRTZWNyZXQsXG5cdFx0XHRlY2NTaGFyZWRTZWNyZXQsXG5cdFx0XHRDcnlwdG9Qcm90b2NvbFZlcnNpb24uVFVUQV9DUllQVCxcblx0XHQpXG5cblx0XHRyZXR1cm4gYXV0aGVudGljYXRlZEFlc0RlY3J5cHQoa2VrLCBtZXNzYWdlLmVuY2Fwc3VsYXRpb24ua2VrRW5jQnVja2V0S2V5KVxuXHR9XG5cblx0cHJpdmF0ZSBkZXJpdmVQUUtFSyhcblx0XHRzZW5kZXJJZGVudGl0eVB1YmxpY0tleTogRWNjUHVibGljS2V5LFxuXHRcdGVwaGVtZXJhbFB1YmxpY0tleTogRWNjUHVibGljS2V5LFxuXHRcdHJlY2lwaWVudFB1YmxpY0tleXM6IFBRUHVibGljS2V5cyxcblx0XHRreWJlckNpcGhlclRleHQ6IFVpbnQ4QXJyYXksXG5cdFx0a3liZXJTaGFyZWRTZWNyZXQ6IFVpbnQ4QXJyYXksXG5cdFx0ZWNjU2hhcmVkU2VjcmV0OiBFY2NTaGFyZWRTZWNyZXRzLFxuXHRcdGNyeXB0b1Byb3RvY29sVmVyc2lvbjogQ3J5cHRvUHJvdG9jb2xWZXJzaW9uLFxuXHQpOiBBZXMyNTZLZXkge1xuXHRcdGNvbnN0IGNvbnRleHQgPSBjb25jYXQoXG5cdFx0XHRzZW5kZXJJZGVudGl0eVB1YmxpY0tleSxcblx0XHRcdGVwaGVtZXJhbFB1YmxpY0tleSxcblx0XHRcdHJlY2lwaWVudFB1YmxpY0tleXMuZWNjUHVibGljS2V5LFxuXHRcdFx0a3liZXJQdWJsaWNLZXlUb0J5dGVzKHJlY2lwaWVudFB1YmxpY0tleXMua3liZXJQdWJsaWNLZXkpLFxuXHRcdFx0a3liZXJDaXBoZXJUZXh0LFxuXHRcdFx0bmV3IFVpbnQ4QXJyYXkoW051bWJlcihjcnlwdG9Qcm90b2NvbFZlcnNpb24pXSksXG5cdFx0KVxuXG5cdFx0Y29uc3QgaW5wdXRLZXlNYXRlcmlhbCA9IGNvbmNhdChlY2NTaGFyZWRTZWNyZXQuZXBoZW1lcmFsU2hhcmVkU2VjcmV0LCBlY2NTaGFyZWRTZWNyZXQuYXV0aFNoYXJlZFNlY3JldCwga3liZXJTaGFyZWRTZWNyZXQpXG5cblx0XHRjb25zdCBrZWtCeXRlcyA9IGhrZGYoY29udGV4dCwgaW5wdXRLZXlNYXRlcmlhbCwgc3RyaW5nVG9VdGY4VWludDhBcnJheShcImtla1wiKSwgS0VZX0xFTkdUSF9CWVRFU19BRVNfMjU2KVxuXHRcdHJldHVybiB1aW50OEFycmF5VG9LZXkoa2VrQnl0ZXMpXG5cdH1cbn1cbiIsImltcG9ydCB7IEVudGl0eUNsaWVudCB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IEFlc0tleSwgQXN5bW1ldHJpY0tleVBhaXIsIGRlY3J5cHRLZXksIGRlY3J5cHRLZXlQYWlyLCBFbmNyeXB0ZWRLZXlQYWlycyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtY3J5cHRvXCJcbmltcG9ydCB7IEdyb3VwLCBHcm91cEtleSwgR3JvdXBLZXlUeXBlUmVmLCBHcm91cFR5cGVSZWYsIEtleVBhaXIgfSBmcm9tIFwiLi4vLi4vZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IFZlcnNpb25lZCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHMvZGlzdC9VdGlscy5qc1wiXG5pbXBvcnQgeyBVc2VyRmFjYWRlIH0gZnJvbSBcIi4vVXNlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9SZXN0RXJyb3IuanNcIlxuaW1wb3J0IHsgY3VzdG9tSWRUb1N0cmluZywgZ2V0RWxlbWVudElkLCBpc1NhbWVJZCwgc3RyaW5nVG9DdXN0b21JZCB9IGZyb20gXCIuLi8uLi9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgS2V5Q2FjaGUgfSBmcm9tIFwiLi9LZXlDYWNoZS5qc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBsYXp5QXN5bmMgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IENhY2hlTWFuYWdlbWVudEZhY2FkZSB9IGZyb20gXCIuL2xhenkvQ2FjaGVNYW5hZ2VtZW50RmFjYWRlLmpzXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgVmVyc2lvbmVkS2V5IH0gZnJvbSBcIi4uL2NyeXB0by9DcnlwdG9XcmFwcGVyLmpzXCJcblxuLyoqXG4gKiBMb2FkIHN5bW1ldHJpYyBhbmQgYXN5bW1ldHJpYyBrZXlzIGFuZCBkZWNyeXB0IHRoZW0uXG4gKiBIYW5kbGUgZ3JvdXAga2V5IHZlcnNpb25pbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBLZXlMb2FkZXJGYWNhZGUge1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IGtleUNhY2hlOiBLZXlDYWNoZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IHVzZXJGYWNhZGU6IFVzZXJGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNhY2hlTWFuYWdlbWVudEZhY2FkZTogbGF6eUFzeW5jPENhY2hlTWFuYWdlbWVudEZhY2FkZT4sXG5cdCkge31cblxuXHQvKipcblx0ICogTG9hZCB0aGUgc3ltbWV0cmljIGdyb3VwIGtleSBmb3IgdGhlIGdyb3VwSWQgd2l0aCB0aGUgcHJvdmlkZWQgcmVxdWVzdGVkVmVyc2lvbi5cblx0ICogQHBhcmFtIGdyb3VwSWQgdGhlIGlkIG9mIHRoZSBncm91cFxuXHQgKiBAcGFyYW0gcmVxdWVzdGVkVmVyc2lvbiB0aGUgcmVxdWVzdGVkVmVyc2lvbiBvZiB0aGUga2V5IHRvIGJlIGxvYWRlZFxuXHQgKiBAcGFyYW0gY3VycmVudEdyb3VwS2V5IG5lZWRzIHRvIGJlIHNldCBpZiB0aGUgdXNlciBpcyBub3QgYSBtZW1iZXIgb2YgdGhlIGdyb3VwIChlLmcuIGFuIGFkbWluKVxuXHQgKi9cblx0YXN5bmMgbG9hZFN5bUdyb3VwS2V5KGdyb3VwSWQ6IElkLCByZXF1ZXN0ZWRWZXJzaW9uOiBudW1iZXIsIGN1cnJlbnRHcm91cEtleT86IFZlcnNpb25lZEtleSk6IFByb21pc2U8QWVzS2V5PiB7XG5cdFx0aWYgKGN1cnJlbnRHcm91cEtleSAhPSBudWxsICYmIGN1cnJlbnRHcm91cEtleS52ZXJzaW9uIDwgcmVxdWVzdGVkVmVyc2lvbikge1xuXHRcdFx0Ly8gd2UgbWlnaHQgbm90IGhhdmUgdGhlIG1lbWJlcnNoaXAgZm9yIHRoaXMgZ3JvdXAuIHNvIHRoZSBjYWxsZXIgbmVlZHMgdG8gaGFuZGxlIGl0IGJ5IHJlZnJlc2hpbmcgdGhlIGNhY2hlXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdGBQcm92aWRlZCBjdXJyZW50IGdyb3VwIGtleSBpcyB0b28gb2xkICgke2N1cnJlbnRHcm91cEtleS52ZXJzaW9ufSkgdG8gbG9hZCB0aGUgcmVxdWVzdGVkIHZlcnNpb24gJHtyZXF1ZXN0ZWRWZXJzaW9ufSBmb3IgZ3JvdXAgJHtncm91cElkfWAsXG5cdFx0XHQpXG5cdFx0fVxuXHRcdGNvbnN0IGdyb3VwS2V5ID0gY3VycmVudEdyb3VwS2V5ID8/IChhd2FpdCB0aGlzLmdldEN1cnJlbnRTeW1Hcm91cEtleShncm91cElkKSlcblxuXHRcdGlmIChncm91cEtleS52ZXJzaW9uID09PSByZXF1ZXN0ZWRWZXJzaW9uKSB7XG5cdFx0XHRyZXR1cm4gZ3JvdXBLZXkub2JqZWN0XG5cdFx0fSBlbHNlIGlmIChncm91cEtleS52ZXJzaW9uIDwgcmVxdWVzdGVkVmVyc2lvbikge1xuXHRcdFx0Ly8gdGhlIGxhdGVzdCBrZXkgaXMgbm90IGNhY2hlZCwgc28gd2UgdXBkYXRlIHRoZSB1c2VyIGFuZCB0cnkgYWdhaW5cblx0XHRcdC8vIHRoaXMgY2FuIHN0aWxsIGZhaWwgYXMgd2UgbWlnaHQgYmUgdG9vIHNsb3cgd2l0aCBwcm9jZXNzaW5nIHNvbWUgdXBkYXRlIGUuZy4gYSBHcm91cEtleVVwZGF0ZVxuXHRcdFx0Ly8gKHdlIGFyZSBtZW1iZXIgb2YgYSBzaGFyZWQgZ3JvdXAgcm90YXRlZCBieSBzb21lb25lIGVsc2UgYW5kIHRoZSBuZXcgbWVtYmVyc2hpcCBpcyBub3QgeWV0IG9uIHRoZSB1c2VyKVxuXHRcdFx0YXdhaXQgKGF3YWl0IHRoaXMuY2FjaGVNYW5hZ2VtZW50RmFjYWRlKCkpLnJlZnJlc2hLZXlDYWNoZShncm91cElkKVxuXHRcdFx0Ly8gVGhlcmUgaXMgbm8gcG9pbnQgaW4gcmUtdHJ5aW5nIHdpdGggdGhlIG91dGRhdGVkIGN1cnJlbnQgZ3JvdXAga2V5XG5cdFx0XHRjb25zdCByZWZyZXNoZWRHcm91cEtleSA9IGF3YWl0IHRoaXMuZ2V0Q3VycmVudFN5bUdyb3VwS2V5KGdyb3VwSWQpIC8vIHdlIHBhc3MgdGhlIGN1cnJlbnRHcm91cEtleSB0byBicmVhayB0aGUgcmVjdXJzaW9uXG5cdFx0XHRyZXR1cm4gdGhpcy5sb2FkU3ltR3JvdXBLZXkoZ3JvdXBJZCwgcmVxdWVzdGVkVmVyc2lvbiwgcmVmcmVzaGVkR3JvdXBLZXkpXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIHdlIGxvYWQgYSBmb3JtZXIga2V5IGFzIHRoZSBjYWNoZWQgb25lIGlzIG5ld2VyOiBncm91cEtleS5yZXF1ZXN0ZWRWZXJzaW9uID4gcmVxdWVzdGVkVmVyc2lvblxuXHRcdFx0Y29uc3QgZ3JvdXAgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEdyb3VwVHlwZVJlZiwgZ3JvdXBJZClcblx0XHRcdGNvbnN0IHsgc3ltbWV0cmljR3JvdXBLZXkgfSA9IGF3YWl0IHRoaXMuZmluZEZvcm1lckdyb3VwS2V5KGdyb3VwLCBncm91cEtleSwgcmVxdWVzdGVkVmVyc2lvbilcblx0XHRcdHJldHVybiBzeW1tZXRyaWNHcm91cEtleVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGdldEN1cnJlbnRTeW1Hcm91cEtleShncm91cElkOiBJZCk6IFByb21pc2U8VmVyc2lvbmVkS2V5PiB7XG5cdFx0Ly8gVGhlIGN1cnJlbnQgdXNlciBncm91cCBrZXkgc2hvdWxkIG5vdCBiZSBpbmNsdWRlZCBpbiB0aGUgbWFwIG9mIGN1cnJlbnQga2V5cywgYmVjYXVzZSB3ZSBvbmx5IGtlZXAgYSBjb3B5IGluIHVzZXJGYWNhZGVcblx0XHRpZiAoaXNTYW1lSWQoZ3JvdXBJZCwgdGhpcy51c2VyRmFjYWRlLmdldFVzZXJHcm91cElkKCkpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRDdXJyZW50U3ltVXNlckdyb3VwS2V5KClcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMua2V5Q2FjaGUuZ2V0Q3VycmVudEdyb3VwS2V5KGdyb3VwSWQsICgpID0+IHRoaXMubG9hZEFuZERlY3J5cHRDdXJyZW50U3ltR3JvdXBLZXkoZ3JvdXBJZCkpXG5cdH1cblxuXHRhc3luYyBsb2FkU3ltVXNlckdyb3VwS2V5KHJlcXVlc3RlZFZlcnNpb246IG51bWJlcik6IFByb21pc2U8QWVzS2V5PiB7XG5cdFx0Ly8gd2UgcHJvdmlkZSB0aGUgY3VycmVudCB1c2VyIGdyb3VwIGtleSB0byBicmVhayBhIHBvc3NpYmx5IGluZmluaXRlIHJlY3Vyc2lvblxuXHRcdGxldCBjdXJyZW50VXNlckdyb3VwS2V5ID0gdGhpcy5nZXRDdXJyZW50U3ltVXNlckdyb3VwS2V5KClcblx0XHRpZiAoY3VycmVudFVzZXJHcm91cEtleS52ZXJzaW9uIDwgcmVxdWVzdGVkVmVyc2lvbikge1xuXHRcdFx0YXdhaXQgKGF3YWl0IHRoaXMuY2FjaGVNYW5hZ2VtZW50RmFjYWRlKCkpLnJlZnJlc2hLZXlDYWNoZSh0aGlzLnVzZXJGYWNhZGUuZ2V0VXNlckdyb3VwSWQoKSlcblx0XHRcdGN1cnJlbnRVc2VyR3JvdXBLZXkgPSB0aGlzLmdldEN1cnJlbnRTeW1Vc2VyR3JvdXBLZXkoKVxuXHRcdFx0Ly8gaWYgdGhlIGtleSBpcyBzdGlsbCBvdXRkYXRlZCBsb2FkU3ltR3JvdXBLZXkgd2lsbCB0aHJvdyAtIHdlIHRyaWVkIG91ciBiZXN0LlxuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5sb2FkU3ltR3JvdXBLZXkodGhpcy51c2VyRmFjYWRlLmdldFVzZXJHcm91cElkKCksIHJlcXVlc3RlZFZlcnNpb24sIGN1cnJlbnRVc2VyR3JvdXBLZXkpXG5cdH1cblxuXHRnZXRDdXJyZW50U3ltVXNlckdyb3VwS2V5KCk6IFZlcnNpb25lZEtleSB7XG5cdFx0cmV0dXJuIHRoaXMudXNlckZhY2FkZS5nZXRDdXJyZW50VXNlckdyb3VwS2V5KClcblx0fVxuXG5cdGFzeW5jIGxvYWRLZXlwYWlyKGtleVBhaXJHcm91cElkOiBJZCwgcmVxdWVzdGVkVmVyc2lvbjogbnVtYmVyKTogUHJvbWlzZTxBc3ltbWV0cmljS2V5UGFpcj4ge1xuXHRcdGxldCBncm91cCA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoR3JvdXBUeXBlUmVmLCBrZXlQYWlyR3JvdXBJZClcblx0XHRsZXQgY3VycmVudEdyb3VwS2V5ID0gYXdhaXQgdGhpcy5nZXRDdXJyZW50U3ltR3JvdXBLZXkoa2V5UGFpckdyb3VwSWQpXG5cblx0XHRpZiAocmVxdWVzdGVkVmVyc2lvbiA+IGN1cnJlbnRHcm91cEtleS52ZXJzaW9uKSB7XG5cdFx0XHRncm91cCA9IChhd2FpdCAoYXdhaXQgdGhpcy5jYWNoZU1hbmFnZW1lbnRGYWNhZGUoKSkucmVmcmVzaEtleUNhY2hlKGtleVBhaXJHcm91cElkKSkuZ3JvdXBcblx0XHRcdGN1cnJlbnRHcm91cEtleSA9IGF3YWl0IHRoaXMuZ2V0Q3VycmVudFN5bUdyb3VwS2V5KGtleVBhaXJHcm91cElkKVxuXHRcdH1cblx0XHRyZXR1cm4gYXdhaXQgdGhpcy5sb2FkS2V5UGFpckltcGwoZ3JvdXAsIHJlcXVlc3RlZFZlcnNpb24sIGN1cnJlbnRHcm91cEtleSlcblx0fVxuXG5cdGFzeW5jIGxvYWRDdXJyZW50S2V5UGFpcihncm91cElkOiBJZCk6IFByb21pc2U8VmVyc2lvbmVkPEFzeW1tZXRyaWNLZXlQYWlyPj4ge1xuXHRcdGxldCBncm91cCA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoR3JvdXBUeXBlUmVmLCBncm91cElkKVxuXG5cdFx0bGV0IGN1cnJlbnRHcm91cEtleSA9IGF3YWl0IHRoaXMuZ2V0Q3VycmVudFN5bUdyb3VwS2V5KGdyb3VwSWQpXG5cdFx0aWYgKE51bWJlcihncm91cC5ncm91cEtleVZlcnNpb24pICE9PSBjdXJyZW50R3JvdXBLZXkudmVyc2lvbikge1xuXHRcdFx0Ly8gVGhlcmUgaXMgYSByYWNlIGNvbmRpdGlvbiBhZnRlciByb3RhdGluZyB0aGUgZ3JvdXAga2V5IHdlcmUgdGhlIGdyb3VwIGVudGl0eSBpbiB0aGUgY2FjaGUgaXMgbm90IGluIHN5bmMgd2l0aCBjdXJyZW50IGtleSB2ZXJzaW9uIGluIHRoZSBrZXkgY2FjaGUuXG5cdFx0XHQvLyBncm91cC5ncm91cEtleVZlcnNpb24gbWlnaHQgYmUgbmV3ZXIgdGhhbiBjdXJyZW50R3JvdXBLZXkudmVyc2lvbi5cblx0XHRcdC8vIFdlIHJlbG9hZCBncm91cCBhbmQgdXNlciBhbmQgcmVmcmVzaCBlbnRpdHkgYW5kIGtleSBjYWNoZSB0byBzeW5jaHJvbml6ZSBib3RoIGNhY2hlcy5cblx0XHRcdGdyb3VwID0gKGF3YWl0IChhd2FpdCB0aGlzLmNhY2hlTWFuYWdlbWVudEZhY2FkZSgpKS5yZWZyZXNoS2V5Q2FjaGUoZ3JvdXBJZCkpLmdyb3VwXG5cdFx0XHRjdXJyZW50R3JvdXBLZXkgPSBhd2FpdCB0aGlzLmdldEN1cnJlbnRTeW1Hcm91cEtleShncm91cElkKVxuXHRcdFx0aWYgKE51bWJlcihncm91cC5ncm91cEtleVZlcnNpb24pICE9PSBjdXJyZW50R3JvdXBLZXkudmVyc2lvbikge1xuXHRcdFx0XHQvLyB3ZSBzdGlsbCBkbyBub3QgaGF2ZSB0aGUgcHJvcGVyIHN0YXRlIHRvIGdldCB0aGUgY3VycmVudCBrZXkgcGFpclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYGluY29uc2lzdGVudCBrZXkgdmVyc2lvbiBzdGF0ZSBpbiBjYWNoZSBhbmQga2V5IGNhY2hlIGZvciBncm91cCAke2dyb3VwSWR9YClcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHsgb2JqZWN0OiB0aGlzLnZhbGlkYXRlQW5kRGVjcnlwdEtleVBhaXIoZ3JvdXAuY3VycmVudEtleXMsIGdyb3VwSWQsIGN1cnJlbnRHcm91cEtleS5vYmplY3QpLCB2ZXJzaW9uOiBOdW1iZXIoZ3JvdXAuZ3JvdXBLZXlWZXJzaW9uKSB9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGxvYWRLZXlQYWlySW1wbChncm91cDogR3JvdXAsIHJlcXVlc3RlZFZlcnNpb246IG51bWJlciwgY3VycmVudEdyb3VwS2V5OiBWZXJzaW9uZWRLZXkpIHtcblx0XHRjb25zdCBrZXlQYWlyR3JvdXBJZCA9IGdyb3VwLl9pZFxuXHRcdGxldCBrZXlQYWlyOiBLZXlQYWlyIHwgbnVsbFxuXHRcdGxldCBzeW1Hcm91cEtleTogQWVzS2V5XG5cdFx0aWYgKHJlcXVlc3RlZFZlcnNpb24gPiBjdXJyZW50R3JvdXBLZXkudmVyc2lvbikge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBOb3QgcG9zc2libGUgdG8gZ2V0IG5ld2VyIGtleSB2ZXJzaW9uIHRoYW4gaXMgY2FjaGVkIGZvciBncm91cCAke2tleVBhaXJHcm91cElkfWApXG5cdFx0fSBlbHNlIGlmIChyZXF1ZXN0ZWRWZXJzaW9uID09PSBjdXJyZW50R3JvdXBLZXkudmVyc2lvbikge1xuXHRcdFx0c3ltR3JvdXBLZXkgPSBjdXJyZW50R3JvdXBLZXkub2JqZWN0XG5cdFx0XHRpZiAoTnVtYmVyKGdyb3VwLmdyb3VwS2V5VmVyc2lvbikgPT09IGN1cnJlbnRHcm91cEtleS52ZXJzaW9uKSB7XG5cdFx0XHRcdGtleVBhaXIgPSBncm91cC5jdXJyZW50S2V5c1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgZm9ybWVyS2V5c0xpc3QgPSBhc3NlcnROb3ROdWxsKGdyb3VwLmZvcm1lckdyb3VwS2V5cykubGlzdFxuXHRcdFx0XHQvLyB3ZSBsb2FkIGJ5IHRoZSB2ZXJzaW9uIGFuZCB0aHVzIGNhbiBiZSBzdXJlIHRoYXQgd2UgYXJlIGFibGUgdG8gZGVjcnlwdCB0aGlzIGtleVxuXHRcdFx0XHRjb25zdCBmb3JtZXJHcm91cEtleSA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoR3JvdXBLZXlUeXBlUmVmLCBbZm9ybWVyS2V5c0xpc3QsIHN0cmluZ1RvQ3VzdG9tSWQoU3RyaW5nKGN1cnJlbnRHcm91cEtleS52ZXJzaW9uKSldKVxuXHRcdFx0XHRrZXlQYWlyID0gZm9ybWVyR3JvdXBLZXkua2V5UGFpclxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBsb2FkIGEgZm9ybWVyIGtleSBwYWlyOiBncm91cEtleVZlcnNpb24gPCBncm91cEtleS52ZXJzaW9uXG5cdFx0XHRjb25zdCB7IHN5bW1ldHJpY0dyb3VwS2V5LCBncm91cEtleUluc3RhbmNlIH0gPSBhd2FpdCB0aGlzLmZpbmRGb3JtZXJHcm91cEtleShncm91cCwgY3VycmVudEdyb3VwS2V5LCByZXF1ZXN0ZWRWZXJzaW9uKVxuXHRcdFx0a2V5UGFpciA9IGdyb3VwS2V5SW5zdGFuY2Uua2V5UGFpclxuXHRcdFx0c3ltR3JvdXBLZXkgPSBzeW1tZXRyaWNHcm91cEtleVxuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy52YWxpZGF0ZUFuZERlY3J5cHRLZXlQYWlyKGtleVBhaXIsIGtleVBhaXJHcm91cElkLCBzeW1Hcm91cEtleSlcblx0fVxuXG5cdC8qKlxuXHQgKlxuXHQgKiBAcGFyYW0gZ3JvdXBJZCBNVVNUIE5PVCBiZSB0aGUgdXNlciBncm91cCBpZCFcblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgbG9hZEFuZERlY3J5cHRDdXJyZW50U3ltR3JvdXBLZXkoZ3JvdXBJZDogSWQpIHtcblx0XHRpZiAoaXNTYW1lSWQoZ3JvdXBJZCwgdGhpcy51c2VyRmFjYWRlLmdldFVzZXJHcm91cElkKCkpKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIk11c3Qgbm90IGFkZCB0aGUgdXNlciBncm91cCB0byB0aGUgcmVndWxhciBncm91cCBrZXkgY2FjaGVcIilcblx0XHR9XG5cdFx0Y29uc3QgZ3JvdXBNZW1iZXJzaGlwID0gdGhpcy51c2VyRmFjYWRlLmdldE1lbWJlcnNoaXAoZ3JvdXBJZClcblx0XHRjb25zdCByZXF1aXJlZFVzZXJHcm91cEtleSA9IGF3YWl0IHRoaXMubG9hZFN5bVVzZXJHcm91cEtleShOdW1iZXIoZ3JvdXBNZW1iZXJzaGlwLnN5bUtleVZlcnNpb24pKVxuXHRcdHJldHVybiB7XG5cdFx0XHR2ZXJzaW9uOiBOdW1iZXIoZ3JvdXBNZW1iZXJzaGlwLmdyb3VwS2V5VmVyc2lvbiksXG5cdFx0XHRvYmplY3Q6IGRlY3J5cHRLZXkocmVxdWlyZWRVc2VyR3JvdXBLZXksIGdyb3VwTWVtYmVyc2hpcC5zeW1FbmNHS2V5KSxcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGZpbmRGb3JtZXJHcm91cEtleShcblx0XHRncm91cDogR3JvdXAsXG5cdFx0Y3VycmVudEdyb3VwS2V5OiBWZXJzaW9uZWRLZXksXG5cdFx0dGFyZ2V0S2V5VmVyc2lvbjogbnVtYmVyLFxuXHQpOiBQcm9taXNlPHsgc3ltbWV0cmljR3JvdXBLZXk6IEFlc0tleTsgZ3JvdXBLZXlJbnN0YW5jZTogR3JvdXBLZXkgfT4ge1xuXHRcdGNvbnN0IGZvcm1lcktleXNMaXN0ID0gYXNzZXJ0Tm90TnVsbChncm91cC5mb3JtZXJHcm91cEtleXMpLmxpc3Rcblx0XHQvLyBzdGFydCBpZCBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIHJlc3VsdCBvZiB0aGUgcmFuZ2UgcmVxdWVzdCwgc28gd2UgbmVlZCB0byBzdGFydCBhdCBjdXJyZW50IHZlcnNpb24uXG5cdFx0Y29uc3Qgc3RhcnRJZCA9IHN0cmluZ1RvQ3VzdG9tSWQoU3RyaW5nKGN1cnJlbnRHcm91cEtleS52ZXJzaW9uKSlcblx0XHRjb25zdCBhbW91bnRPZktleXNJbmNsdWRpbmdUYXJnZXQgPSBjdXJyZW50R3JvdXBLZXkudmVyc2lvbiAtIHRhcmdldEtleVZlcnNpb25cblxuXHRcdGNvbnN0IGZvcm1lcktleXM6IEdyb3VwS2V5W10gPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkUmFuZ2UoR3JvdXBLZXlUeXBlUmVmLCBmb3JtZXJLZXlzTGlzdCwgc3RhcnRJZCwgYW1vdW50T2ZLZXlzSW5jbHVkaW5nVGFyZ2V0LCB0cnVlKVxuXG5cdFx0bGV0IGxhc3RWZXJzaW9uID0gY3VycmVudEdyb3VwS2V5LnZlcnNpb25cblx0XHRsZXQgbGFzdEdyb3VwS2V5ID0gY3VycmVudEdyb3VwS2V5Lm9iamVjdFxuXHRcdGxldCBsYXN0R3JvdXBLZXlJbnN0YW5jZTogR3JvdXBLZXkgfCBudWxsID0gbnVsbFxuXG5cdFx0Zm9yIChjb25zdCBmb3JtZXJLZXkgb2YgZm9ybWVyS2V5cykge1xuXHRcdFx0Y29uc3QgdmVyc2lvbiA9IHRoaXMuZGVjb2RlR3JvdXBLZXlWZXJzaW9uKGdldEVsZW1lbnRJZChmb3JtZXJLZXkpKVxuXHRcdFx0aWYgKHZlcnNpb24gKyAxID4gbGFzdFZlcnNpb24pIHtcblx0XHRcdFx0Y29udGludWVcblx0XHRcdH0gZWxzZSBpZiAodmVyc2lvbiArIDEgPT09IGxhc3RWZXJzaW9uKSB7XG5cdFx0XHRcdGxhc3RHcm91cEtleSA9IGRlY3J5cHRLZXkobGFzdEdyb3VwS2V5LCBmb3JtZXJLZXkub3duZXJFbmNHS2V5KVxuXHRcdFx0XHRsYXN0VmVyc2lvbiA9IHZlcnNpb25cblx0XHRcdFx0bGFzdEdyb3VwS2V5SW5zdGFuY2UgPSBmb3JtZXJLZXlcblx0XHRcdFx0aWYgKGxhc3RWZXJzaW9uIDw9IHRhcmdldEtleVZlcnNpb24pIHtcblx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYHVuZXhwZWN0ZWQgdmVyc2lvbiAke3ZlcnNpb259OyBleHBlY3RlZCAke2xhc3RWZXJzaW9ufWApXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGxhc3RWZXJzaW9uICE9PSB0YXJnZXRLZXlWZXJzaW9uIHx8ICFsYXN0R3JvdXBLZXlJbnN0YW5jZSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBjb3VsZCBub3QgZ2V0IHZlcnNpb24gKGxhc3QgdmVyc2lvbiBpcyAke2xhc3RWZXJzaW9ufSBvZiAke2Zvcm1lcktleXMubGVuZ3RofSBrZXkocykgbG9hZGVkIGZyb20gbGlzdCAke2Zvcm1lcktleXNMaXN0fSlgKVxuXHRcdH1cblxuXHRcdHJldHVybiB7IHN5bW1ldHJpY0dyb3VwS2V5OiBsYXN0R3JvdXBLZXksIGdyb3VwS2V5SW5zdGFuY2U6IGxhc3RHcm91cEtleUluc3RhbmNlIH1cblx0fVxuXG5cdHByaXZhdGUgZGVjb2RlR3JvdXBLZXlWZXJzaW9uKGlkOiBJZCk6IG51bWJlciB7XG5cdFx0cmV0dXJuIE51bWJlcihjdXN0b21JZFRvU3RyaW5nKGlkKSlcblx0fVxuXG5cdHByaXZhdGUgdmFsaWRhdGVBbmREZWNyeXB0S2V5UGFpcihrZXlQYWlyOiBLZXlQYWlyIHwgbnVsbCwgZ3JvdXBJZDogSWQsIGdyb3VwS2V5OiBBZXNLZXkpIHtcblx0XHRpZiAoa2V5UGFpciA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgTm90Rm91bmRFcnJvcihgbm8ga2V5IHBhaXIgb24gZ3JvdXAgJHtncm91cElkfWApXG5cdFx0fVxuXHRcdC8vIHRoaXMgY2FzdCBpcyBhY2NlcHRhYmxlIGFzIHRob3NlIGFyZSB0aGUgY29uc3RyYWludHMgd2UgaGF2ZSBvbiBLZXlQYWlyLiB3ZSBqdXN0IGNhbm5vdCBrbm93IHdoaWNoIG9uZSB3ZSBoYXZlIHN0YXRpY2FsbHlcblx0XHRyZXR1cm4gZGVjcnlwdEtleVBhaXIoZ3JvdXBLZXksIGtleVBhaXIgYXMgRW5jcnlwdGVkS2V5UGFpcnMpXG5cdH1cbn1cbiIsImltcG9ydCB7IEVudGl0eUNsaWVudCB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7XG5cdEFkbWluR3JvdXBLZXlBdXRoZW50aWNhdGlvbkRhdGEsXG5cdEFkbWluR3JvdXBLZXlSb3RhdGlvblBvc3RJbixcblx0Y3JlYXRlQWRtaW5Hcm91cEtleUF1dGhlbnRpY2F0aW9uRGF0YSxcblx0Y3JlYXRlQWRtaW5Hcm91cEtleVJvdGF0aW9uUG9zdEluLFxuXHRjcmVhdGVHcm91cEtleVJvdGF0aW9uRGF0YSxcblx0Y3JlYXRlR3JvdXBLZXlSb3RhdGlvblBvc3RJbixcblx0Y3JlYXRlR3JvdXBLZXlVcGRhdGVEYXRhLFxuXHRjcmVhdGVHcm91cE1lbWJlcnNoaXBLZXlEYXRhLFxuXHRjcmVhdGVHcm91cE1lbWJlcnNoaXBVcGRhdGVEYXRhLFxuXHRjcmVhdGVLZXlQYWlyLFxuXHRjcmVhdGVNZW1iZXJzaGlwUHV0SW4sXG5cdGNyZWF0ZVB1YkVuY0tleURhdGEsXG5cdGNyZWF0ZVB1YmxpY0tleUdldEluLFxuXHRjcmVhdGVSZWNvdmVyQ29kZURhdGEsXG5cdGNyZWF0ZVVzZXJHcm91cEtleVJvdGF0aW9uRGF0YSxcblx0Y3JlYXRlVXNlckdyb3VwS2V5Um90YXRpb25Qb3N0SW4sXG5cdEN1c3RvbWVyVHlwZVJlZixcblx0R3JvdXAsXG5cdEdyb3VwSW5mb1R5cGVSZWYsXG5cdEdyb3VwS2V5Um90YXRpb25EYXRhLFxuXHRHcm91cEtleVVwZGF0ZSxcblx0R3JvdXBLZXlVcGRhdGVEYXRhLFxuXHRHcm91cEtleVVwZGF0ZVR5cGVSZWYsXG5cdEdyb3VwTWVtYmVyLFxuXHRHcm91cE1lbWJlcnNoaXBLZXlEYXRhLFxuXHRHcm91cE1lbWJlcnNoaXBVcGRhdGVEYXRhLFxuXHRHcm91cE1lbWJlclR5cGVSZWYsXG5cdEdyb3VwVHlwZVJlZixcblx0S2V5UGFpcixcblx0S2V5Um90YXRpb24sXG5cdEtleVJvdGF0aW9uVHlwZVJlZixcblx0UHViRW5jS2V5RGF0YSxcblx0UHVibGljS2V5R2V0T3V0LFxuXHRSZWNvdmVyQ29kZURhdGEsXG5cdFNlbnRHcm91cEludml0YXRpb25UeXBlUmVmLFxuXHRVc2VyLFxuXHRVc2VyR3JvdXBSb290VHlwZVJlZixcblx0VXNlclR5cGVSZWYsXG59IGZyb20gXCIuLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgYXNzZXJ0RW51bVZhbHVlLCBHcm91cEtleVJvdGF0aW9uVHlwZSwgR3JvdXBUeXBlLCBQdWJsaWNLZXlJZGVudGlmaWVyVHlwZSB9IGZyb20gXCIuLi8uLi9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHtcblx0YXJyYXlFcXVhbHMsXG5cdGFzc2VydE5vdE51bGwsXG5cdGNvbmNhdCxcblx0ZGVmZXIsXG5cdERlZmVycmVkT2JqZWN0LFxuXHRkb3duY2FzdCxcblx0Z2V0Rmlyc3RPclRocm93LFxuXHRncm91cEJ5LFxuXHRpc0VtcHR5LFxuXHRpc05vdE51bGwsXG5cdGlzU2FtZVR5cGVSZWYsXG5cdGxhenlBc3luYyxcblx0cHJvbWlzZU1hcCxcblx0VmVyc2lvbmVkLFxufSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGN1c3RvbUlkVG9VaW50OGFycmF5LCBlbGVtZW50SWRQYXJ0LCBpc1NhbWVJZCwgbGlzdElkUGFydCB9IGZyb20gXCIuLi8uLi9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgS2V5TG9hZGVyRmFjYWRlIH0gZnJvbSBcIi4vS2V5TG9hZGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7XG5cdEFlczI1NktleSxcblx0QWVzS2V5LFxuXHRiaXRBcnJheVRvVWludDhBcnJheSxcblx0Y3JlYXRlQXV0aFZlcmlmaWVyLFxuXHRFbmNyeXB0ZWRQcUtleVBhaXJzLFxuXHRnZXRLZXlMZW5ndGhCeXRlcyxcblx0S0VZX0xFTkdUSF9CWVRFU19BRVNfMjU2LFxuXHRQUUtleVBhaXJzLFxuXHR1aW50OEFycmF5VG9LZXksXG59IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtY3J5cHRvXCJcbmltcG9ydCB7IFBRRmFjYWRlIH0gZnJvbSBcIi4vUFFGYWNhZGUuanNcIlxuaW1wb3J0IHtcblx0QWRtaW5Hcm91cEtleVJvdGF0aW9uU2VydmljZSxcblx0R3JvdXBLZXlSb3RhdGlvbkluZm9TZXJ2aWNlLFxuXHRHcm91cEtleVJvdGF0aW9uU2VydmljZSxcblx0TWVtYmVyc2hpcFNlcnZpY2UsXG5cdFB1YmxpY0tleVNlcnZpY2UsXG5cdFVzZXJHcm91cEtleVJvdGF0aW9uU2VydmljZSxcbn0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3N5cy9TZXJ2aWNlcy5qc1wiXG5pbXBvcnQgeyBJU2VydmljZUV4ZWN1dG9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9TZXJ2aWNlUmVxdWVzdC5qc1wiXG5pbXBvcnQgeyBDcnlwdG9GYWNhZGUgfSBmcm9tIFwiLi4vY3J5cHRvL0NyeXB0b0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBhc3NlcnRXb3JrZXJPck5vZGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0Vudi5qc1wiXG5pbXBvcnQgeyBDcnlwdG9XcmFwcGVyLCBWZXJzaW9uZWRFbmNyeXB0ZWRLZXksIFZlcnNpb25lZEtleSB9IGZyb20gXCIuLi9jcnlwdG8vQ3J5cHRvV3JhcHBlci5qc1wiXG5pbXBvcnQgeyBnZXRVc2VyR3JvdXBNZW1iZXJzaGlwcyB9IGZyb20gXCIuLi8uLi9jb21tb24vdXRpbHMvR3JvdXBVdGlscy5qc1wiXG5pbXBvcnQgeyBSZWNvdmVyQ29kZUZhY2FkZSB9IGZyb20gXCIuL2xhenkvUmVjb3ZlckNvZGVGYWNhZGUuanNcIlxuaW1wb3J0IHsgVXNlckZhY2FkZSB9IGZyb20gXCIuL1VzZXJGYWNhZGUuanNcIlxuaW1wb3J0IHsgR3JvdXBJbnZpdGF0aW9uUG9zdERhdGEsIHR5cGUgSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhLCBJbnRlcm5hbFJlY2lwaWVudEtleURhdGFUeXBlUmVmIH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IFNoYXJlRmFjYWRlIH0gZnJvbSBcIi4vbGF6eS9TaGFyZUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBHcm91cE1hbmFnZW1lbnRGYWNhZGUgfSBmcm9tIFwiLi9sYXp5L0dyb3VwTWFuYWdlbWVudEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBSZWNpcGllbnRzTm90Rm91bmRFcnJvciB9IGZyb20gXCIuLi8uLi9jb21tb24vZXJyb3IvUmVjaXBpZW50c05vdEZvdW5kRXJyb3IuanNcIlxuaW1wb3J0IHsgTG9ja2VkRXJyb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2Vycm9yL1Jlc3RFcnJvci5qc1wiXG5pbXBvcnQgeyBBc3ltbWV0cmljQ3J5cHRvRmFjYWRlLCBQdWJsaWNLZXlzIH0gZnJvbSBcIi4uL2NyeXB0by9Bc3ltbWV0cmljQ3J5cHRvRmFjYWRlLmpzXCJcblxuYXNzZXJ0V29ya2VyT3JOb2RlKClcblxuLyoqXG4gKiBUeXBlIHRvIGtlZXAgYSBwZW5kaW5nIGtleSByb3RhdGlvbiBhbmQgdGhlIHBhc3N3b3JkIGtleSBpbiBtZW1vcnkgYXMgbG9uZyBhcyB0aGUga2V5IHJvdGF0aW9uIGhhcyBub3QgYmVlbiBwcm9jZXNzZWQuXG4gKi9cbnR5cGUgUGVuZGluZ0tleVJvdGF0aW9uID0ge1xuXHRwd0tleTogQWVzMjU2S2V5IHwgbnVsbFxuXHQvL0lmIHdlIHJvdGF0ZSB0aGUgYWRtaW4gZ3JvdXAgd2UgYWx3YXlzIHdhbnQgdG8gcm90YXRlIHRoZSB1c2VyIGdyb3VwIGZvciB0aGUgYWRtaW4gdXNlci5cblx0Ly8gVGhlcmVmb3JlLCB3ZSBkbyBub3QgbmVlZCB0byBzYXZlIHR3byBkaWZmZXJlbnQga2V5IHJvdGF0aW9ucyBmb3IgdGhpcyBjYXNlLlxuXHRhZG1pbk9yVXNlckdyb3VwS2V5Um90YXRpb246IEtleVJvdGF0aW9uIHwgbnVsbFxuXHR0ZWFtT3JDdXN0b21lckdyb3VwS2V5Um90YXRpb25zOiBBcnJheTxLZXlSb3RhdGlvbj5cblx0dXNlckFyZWFHcm91cHNLZXlSb3RhdGlvbnM6IEFycmF5PEtleVJvdGF0aW9uPlxufVxuXG50eXBlIFByZXBhcmVkVXNlckFyZWFHcm91cEtleVJvdGF0aW9uID0ge1xuXHRncm91cEtleVJvdGF0aW9uRGF0YTogR3JvdXBLZXlSb3RhdGlvbkRhdGFcblx0cHJlcGFyZWRSZUludml0YXRpb25zOiBHcm91cEludml0YXRpb25Qb3N0RGF0YVtdXG59XG5cbnR5cGUgR2VuZXJhdGVkR3JvdXBLZXlzID0ge1xuXHRzeW1Hcm91cEtleTogVmVyc2lvbmVkS2V5XG5cdGVuY3J5cHRlZEtleVBhaXI6IEVuY3J5cHRlZFBxS2V5UGFpcnMgfCBudWxsXG59XG5cbnR5cGUgRW5jcnlwdGVkR3JvdXBLZXlzID0ge1xuXHRuZXdHcm91cEtleUVuY0N1cnJlbnRHcm91cEtleTogVmVyc2lvbmVkRW5jcnlwdGVkS2V5XG5cdGtleVBhaXI6IEVuY3J5cHRlZFBxS2V5UGFpcnMgfCBudWxsXG5cdGFkbWluR3JvdXBLZXlFbmNOZXdHcm91cEtleTogVmVyc2lvbmVkRW5jcnlwdGVkS2V5IHwgbnVsbFxufVxuXG50eXBlIEVuY3J5cHRlZFVzZXJHcm91cEtleXMgPSB7XG5cdG5ld1VzZXJHcm91cEtleUVuY0N1cnJlbnRHcm91cEtleTogVmVyc2lvbmVkRW5jcnlwdGVkS2V5XG5cdHBhc3NwaHJhc2VLZXlFbmNOZXdVc2VyR3JvdXBLZXk6IFZlcnNpb25lZEVuY3J5cHRlZEtleVxuXHRrZXlQYWlyOiBLZXlQYWlyXG5cdHJlY292ZXJDb2RlRGF0YTogUmVjb3ZlckNvZGVEYXRhIHwgbnVsbFxuXHRuZXdBZG1pbkdyb3VwS2V5RW5jTmV3VXNlckdyb3VwS2V5OiBWZXJzaW9uZWRFbmNyeXB0ZWRLZXlcblx0ZGlzdHJpYnV0aW9uS2V5RW5jTmV3VXNlckdyb3VwS2V5OiBVaW50OEFycmF5XG5cdGF1dGhWZXJpZmllcjogVWludDhBcnJheVxufVxuXG4vKipcbiAqIEZhY2FkZSB0byBoYW5kbGUga2V5IHJvdGF0aW9uIHJlcXVlc3RzLiBNYWludGFpbnMgYW5kIHByb2Nlc3NlcyBAUGVuZGluZ0tleVJvdGF0aW9uXG4gKi9cbmV4cG9ydCBjbGFzcyBLZXlSb3RhdGlvbkZhY2FkZSB7XG5cdC8qKlxuXHQgKiBAVmlzaWJsZUZvclRlc3Rpbmdcblx0ICovXG5cdHBlbmRpbmdLZXlSb3RhdGlvbnM6IFBlbmRpbmdLZXlSb3RhdGlvblxuXHRwcml2YXRlIHJlYWRvbmx5IGZhY2FkZUluaXRpYWxpemVkRGVmZXJyZWRPYmplY3Q6IERlZmVycmVkT2JqZWN0PHZvaWQ+XG5cdHByaXZhdGUgcGVuZGluZ0dyb3VwS2V5VXBkYXRlSWRzOiBJZFR1cGxlW10gLy8gYWxyZWFkeSByb3RhdGVkIGdyb3VwcyBmb3Igd2hpY2ggd2UgbmVlZCB0byB1cGRhdGUgdGhlIG1lbWJlcnNoaXBzIChHcm91cEtleVVwZGF0ZUlkcyBhbGwgaW4gb25lIGxpc3QpXG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSBlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGtleUxvYWRlckZhY2FkZTogS2V5TG9hZGVyRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgcHFGYWNhZGU6IFBRRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgc2VydmljZUV4ZWN1dG9yOiBJU2VydmljZUV4ZWN1dG9yLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY3J5cHRvV3JhcHBlcjogQ3J5cHRvV3JhcHBlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IHJlY292ZXJDb2RlRmFjYWRlOiBsYXp5QXN5bmM8UmVjb3ZlckNvZGVGYWNhZGU+LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdXNlckZhY2FkZTogVXNlckZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNyeXB0b0ZhY2FkZTogQ3J5cHRvRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgc2hhcmVGYWNhZGU6IGxhenlBc3luYzxTaGFyZUZhY2FkZT4sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBncm91cE1hbmFnZW1lbnRGYWNhZGU6IGxhenlBc3luYzxHcm91cE1hbmFnZW1lbnRGYWNhZGU+LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgYXN5bW1ldHJpY0NyeXB0b0ZhY2FkZTogQXN5bW1ldHJpY0NyeXB0b0ZhY2FkZSxcblx0KSB7XG5cdFx0dGhpcy5wZW5kaW5nS2V5Um90YXRpb25zID0ge1xuXHRcdFx0cHdLZXk6IG51bGwsXG5cdFx0XHRhZG1pbk9yVXNlckdyb3VwS2V5Um90YXRpb246IG51bGwsXG5cdFx0XHR0ZWFtT3JDdXN0b21lckdyb3VwS2V5Um90YXRpb25zOiBbXSxcblx0XHRcdHVzZXJBcmVhR3JvdXBzS2V5Um90YXRpb25zOiBbXSxcblx0XHR9XG5cdFx0dGhpcy5mYWNhZGVJbml0aWFsaXplZERlZmVycmVkT2JqZWN0ID0gZGVmZXI8dm9pZD4oKVxuXHRcdHRoaXMucGVuZGluZ0dyb3VwS2V5VXBkYXRlSWRzID0gW11cblx0fVxuXG5cdC8qKlxuXHQgKiBJbml0aWFsaXplIHRoZSBmYWNhZGUgd2l0aCB0aGUgZGF0YSBpdCBuZWVkcyB0byBwZXJmb3JtIHJvdGF0aW9ucyBsYXRlci5cblx0ICogTmVlZHMgdG8gYmUgY2FsbGVkIGR1cmluZyBsb2dpbiB3aGVuIHRoZSBwYXNzd29yZCBrZXkgaXMgc3RpbGwgYXZhaWxhYmxlLlxuXHQgKiBAcGFyYW0gcHdLZXkgdGhlIHVzZXIncyBwYXNzcGhyYXNlIGtleS4gTWF5IG9yIG1heSBub3QgYmUga2VwdCBpbiBtZW1vcnksIGRlcGVuZGluZyBvbiB3aGV0aGVyIGEgVXNlckdyb3VwIGtleSByb3RhdGlvbiBpcyBzY2hlZHVsZWQuXG5cdCAqIEBwYXJhbSBtb2Rlcm5LZGZUeXBlIHRydWUgaWYgYXJnb24yaWQuIG5vIGFkbWluIG9yIHVzZXIga2V5IHJvdGF0aW9uIHNob3VsZCBiZSBleGVjdXRlZCBpZiBmYWxzZS5cblx0ICovXG5cdHB1YmxpYyBhc3luYyBpbml0aWFsaXplKHB3S2V5OiBBZXMyNTZLZXksIG1vZGVybktkZlR5cGU6IGJvb2xlYW4pIHtcblx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5nZXQoR3JvdXBLZXlSb3RhdGlvbkluZm9TZXJ2aWNlLCBudWxsKVxuXHRcdGlmIChyZXN1bHQudXNlck9yQWRtaW5Hcm91cEtleVJvdGF0aW9uU2NoZWR1bGVkICYmIG1vZGVybktkZlR5cGUpIHtcblx0XHRcdC8vIElmIHdlIGhhdmUgbm90IG1pZ3JhdGVkIHRvIGFyZ29uMiB3ZSBwb3N0cG9uZSBrZXkgcm90YXRpb24gdW50aWwgbmV4dCBsb2dpbi5cblx0XHRcdHRoaXMucGVuZGluZ0tleVJvdGF0aW9ucy5wd0tleSA9IHB3S2V5XG5cdFx0fVxuXHRcdHRoaXMucGVuZGluZ0dyb3VwS2V5VXBkYXRlSWRzID0gcmVzdWx0Lmdyb3VwS2V5VXBkYXRlc1xuXHRcdHRoaXMuZmFjYWRlSW5pdGlhbGl6ZWREZWZlcnJlZE9iamVjdC5yZXNvbHZlKClcblx0fVxuXG5cdC8qKlxuXHQgKiBQcm9jZXNzZXMgcGVuZGluZyBrZXkgcm90YXRpb25zIGFuZCBwZXJmb3JtcyBmb2xsb3ctdXAgdGFza3Mgc3VjaCBhcyB1cGRhdGluZyBtZW1iZXJzaGlwcyBmb3IgZ3JvdXBzIHJvdGF0ZWQgYnkgYW5vdGhlciB1c2VyLlxuXHQgKiBAcGFyYW0gdXNlclxuXHQgKi9cblx0YXN5bmMgcHJvY2Vzc1BlbmRpbmdLZXlSb3RhdGlvbnNBbmRVcGRhdGVzKHVzZXI6IFVzZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgdGhpcy5sb2FkUGVuZGluZ0tleVJvdGF0aW9ucyh1c2VyKVxuXHRcdFx0XHRhd2FpdCB0aGlzLnByb2Nlc3NQZW5kaW5nS2V5Um90YXRpb24odXNlcilcblx0XHRcdH0gZmluYWxseSB7XG5cdFx0XHRcdC8vIHdlIHN0aWxsIHRyeSB1cGRhdGluZyBtZW1iZXJzaGlwcyBpZiB0aGVyZSB3YXMgYW4gZXJyb3Igd2l0aCByb3RhdGlvbnNcblx0XHRcdFx0YXdhaXQgdGhpcy51cGRhdGVHcm91cE1lbWJlcnNoaXBzKHRoaXMucGVuZGluZ0dyb3VwS2V5VXBkYXRlSWRzKVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgTG9ja2VkRXJyb3IpIHtcblx0XHRcdFx0Ly8gd2UgY2F0Y2ggaGVyZSBzbyB0aGF0IHdlIGFsc28gY2F0Y2ggZXJyb3JzIGluIHRoZSBmaW5hbGx5IGJsb2NrXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiZXJyb3Igd2hlbiBwcm9jZXNzaW5nIGtleSByb3RhdGlvbiBvciBncm91cCBrZXkgdXBkYXRlXCIsIGUpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFF1ZXJpZXMgdGhlIHNlcnZlciBmb3IgcGVuZGluZyBrZXkgcm90YXRpb25zIGZvciBhIGdpdmVuIHVzZXIgYW5kIHNhdmVzIHRoZW0gYW5kIG9wdGlvbmFsbHkgdGhlIGdpdmVuIHBhc3N3b3JkIGtleSAoaW4gY2FzZSBhbiBhZG1pbiBvciB1c2VyIGdyb3VwIG5lZWRzIHRvIGJlIHJvdGF0ZWQpLlxuXHQgKlxuXHQgKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBjdXJyZW50bHkgbWFrZXMgMiBzZXJ2ZXIgcmVxdWVzdHMgdG8gbG9hZCB0aGUga2V5IHJvdGF0aW9uIGxpc3QgYW5kIGNoZWNrIGlmIGEga2V5IHJvdGF0aW9uIGlzIG5lZWRlZC5cblx0ICogVGhpcyByb3V0aW5lIHNob3VsZCBiZSBvcHRpbWl6ZWQgaW4gdGhlIGZ1dHVyZSBieSBzYXZpbmcgYSBmbGFnIG9uIHRoZSB1c2VyIHRvIGRldGVybWluZSB3aGV0aGVyIGEga2V5IHJvdGF0aW9uIGlzIHJlcXVpcmVkIG9yIG5vdC5cblx0ICogQFZpc2libGVGb3JUZXN0aW5nXG5cdCAqL1xuXHRhc3luYyBsb2FkUGVuZGluZ0tleVJvdGF0aW9ucyh1c2VyOiBVc2VyKSB7XG5cdFx0Y29uc3QgdXNlckdyb3VwUm9vdCA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoVXNlckdyb3VwUm9vdFR5cGVSZWYsIHVzZXIudXNlckdyb3VwLmdyb3VwKVxuXHRcdGlmICh1c2VyR3JvdXBSb290LmtleVJvdGF0aW9ucyAhPSBudWxsKSB7XG5cdFx0XHRjb25zdCBwZW5kaW5nS2V5Um90YXRpb25zID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZEFsbChLZXlSb3RhdGlvblR5cGVSZWYsIHVzZXJHcm91cFJvb3Qua2V5Um90YXRpb25zLmxpc3QpXG5cdFx0XHRjb25zdCBrZXlSb3RhdGlvbnNCeVR5cGUgPSBncm91cEJ5KHBlbmRpbmdLZXlSb3RhdGlvbnMsIChrZXlSb3RhdGlvbikgPT4ga2V5Um90YXRpb24uZ3JvdXBLZXlSb3RhdGlvblR5cGUpXG5cdFx0XHRsZXQgYWRtaW5PclVzZXJHcm91cEtleVJvdGF0aW9uQXJyYXk6IEFycmF5PEtleVJvdGF0aW9uPiA9IFtcblx0XHRcdFx0a2V5Um90YXRpb25zQnlUeXBlLmdldChHcm91cEtleVJvdGF0aW9uVHlwZS5BZG1pbkdyb3VwS2V5Um90YXRpb25TaW5nbGVVc2VyQWNjb3VudCksXG5cdFx0XHRcdGtleVJvdGF0aW9uc0J5VHlwZS5nZXQoR3JvdXBLZXlSb3RhdGlvblR5cGUuQWRtaW5Hcm91cEtleVJvdGF0aW9uTXVsdGlwbGVVc2VyQWNjb3VudCksXG5cdFx0XHRcdGtleVJvdGF0aW9uc0J5VHlwZS5nZXQoR3JvdXBLZXlSb3RhdGlvblR5cGUuQWRtaW5Hcm91cEtleVJvdGF0aW9uTXVsdGlwbGVBZG1pbkFjY291bnQpLFxuXHRcdFx0XHRrZXlSb3RhdGlvbnNCeVR5cGUuZ2V0KEdyb3VwS2V5Um90YXRpb25UeXBlLlVzZXIpLFxuXHRcdFx0XVxuXHRcdFx0XHQuZmxhdCgpXG5cdFx0XHRcdC5maWx0ZXIoaXNOb3ROdWxsKVxuXHRcdFx0bGV0IGN1c3RvbWVyR3JvdXBLZXlSb3RhdGlvbkFycmF5ID0ga2V5Um90YXRpb25zQnlUeXBlLmdldChHcm91cEtleVJvdGF0aW9uVHlwZS5DdXN0b21lcikgfHwgW11cblx0XHRcdGNvbnN0IGFkbWluT3JVc2VyR3JvdXBLZXlSb3RhdGlvbiA9IGFkbWluT3JVc2VyR3JvdXBLZXlSb3RhdGlvbkFycmF5WzBdXG5cdFx0XHR0aGlzLnBlbmRpbmdLZXlSb3RhdGlvbnMgPSB7XG5cdFx0XHRcdHB3S2V5OiB0aGlzLnBlbmRpbmdLZXlSb3RhdGlvbnMucHdLZXksXG5cdFx0XHRcdGFkbWluT3JVc2VyR3JvdXBLZXlSb3RhdGlvbjogYWRtaW5PclVzZXJHcm91cEtleVJvdGF0aW9uID8gYWRtaW5PclVzZXJHcm91cEtleVJvdGF0aW9uIDogbnVsbCxcblx0XHRcdFx0dGVhbU9yQ3VzdG9tZXJHcm91cEtleVJvdGF0aW9uczogY3VzdG9tZXJHcm91cEtleVJvdGF0aW9uQXJyYXkuY29uY2F0KGtleVJvdGF0aW9uc0J5VHlwZS5nZXQoR3JvdXBLZXlSb3RhdGlvblR5cGUuVGVhbSkgfHwgW10pLFxuXHRcdFx0XHR1c2VyQXJlYUdyb3Vwc0tleVJvdGF0aW9uczoga2V5Um90YXRpb25zQnlUeXBlLmdldChHcm91cEtleVJvdGF0aW9uVHlwZS5Vc2VyQXJlYSkgfHwgW10sXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFByb2Nlc3NlcyB0aGUgaW50ZXJuYWwgbGlzdCBvZiBAUGVuZGluZ0tleVJvdGF0aW9uLiBLZXkgcm90YXRpb25zIGFuZCAoaWYgZXhpc3RlbnQpIHBhc3N3b3JkIGtleXMgYXJlIGRlbGV0ZWQgYWZ0ZXIgcHJvY2Vzc2luZy5cblx0ICogQFZpc2libGVGb3JUZXN0aW5nXG5cdCAqL1xuXHRhc3luYyBwcm9jZXNzUGVuZGluZ0tleVJvdGF0aW9uKHVzZXI6IFVzZXIpIHtcblx0XHRhd2FpdCB0aGlzLmZhY2FkZUluaXRpYWxpemVkRGVmZXJyZWRPYmplY3QucHJvbWlzZVxuXHRcdC8vIGZpcnN0IGFkbWluLCB0aGVuIHVzZXIgYW5kIHRoZW4gdXNlciBhcmVhXG5cdFx0dHJ5IHtcblx0XHRcdGlmICh0aGlzLnBlbmRpbmdLZXlSb3RhdGlvbnMuYWRtaW5PclVzZXJHcm91cEtleVJvdGF0aW9uICYmIHRoaXMucGVuZGluZ0tleVJvdGF0aW9ucy5wd0tleSkge1xuXHRcdFx0XHRjb25zdCBncm91cEtleVJvdGF0aW9uVHlwZSA9IGFzc2VydEVudW1WYWx1ZShHcm91cEtleVJvdGF0aW9uVHlwZSwgdGhpcy5wZW5kaW5nS2V5Um90YXRpb25zLmFkbWluT3JVc2VyR3JvdXBLZXlSb3RhdGlvbi5ncm91cEtleVJvdGF0aW9uVHlwZSlcblx0XHRcdFx0c3dpdGNoIChncm91cEtleVJvdGF0aW9uVHlwZSkge1xuXHRcdFx0XHRcdGNhc2UgR3JvdXBLZXlSb3RhdGlvblR5cGUuQWRtaW5Hcm91cEtleVJvdGF0aW9uTXVsdGlwbGVBZG1pbkFjY291bnQ6XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIlJvdGF0aW5nIHRoZSBhZG1pbiBncm91cCB3aXRoIG11bHRpcGxlIG1lbWJlcnMgaXMgbm90IHlldCBpbXBsZW1lbnRlZFwiKVxuXHRcdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0XHRjYXNlIEdyb3VwS2V5Um90YXRpb25UeXBlLkFkbWluR3JvdXBLZXlSb3RhdGlvblNpbmdsZVVzZXJBY2NvdW50OlxuXHRcdFx0XHRcdGNhc2UgR3JvdXBLZXlSb3RhdGlvblR5cGUuQWRtaW5Hcm91cEtleVJvdGF0aW9uTXVsdGlwbGVVc2VyQWNjb3VudDpcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucm90YXRlQWRtaW5Hcm91cEtleXModXNlciwgdGhpcy5wZW5kaW5nS2V5Um90YXRpb25zLnB3S2V5LCB0aGlzLnBlbmRpbmdLZXlSb3RhdGlvbnMuYWRtaW5PclVzZXJHcm91cEtleVJvdGF0aW9uKVxuXHRcdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0XHRjYXNlIEdyb3VwS2V5Um90YXRpb25UeXBlLlVzZXI6XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnJvdGF0ZVVzZXJHcm91cEtleSh1c2VyLCB0aGlzLnBlbmRpbmdLZXlSb3RhdGlvbnMucHdLZXksIHRoaXMucGVuZGluZ0tleVJvdGF0aW9ucy5hZG1pbk9yVXNlckdyb3VwS2V5Um90YXRpb24pXG5cdFx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMucGVuZGluZ0tleVJvdGF0aW9ucy5hZG1pbk9yVXNlckdyb3VwS2V5Um90YXRpb24gPSBudWxsXG5cdFx0XHR9XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHRoaXMucGVuZGluZ0tleVJvdGF0aW9ucy5wd0tleSA9IG51bGxcblx0XHR9XG5cblx0XHQvL3VzZXIgYXJlYSwgdGVhbSBhbmQgY3VzdG9tZXIga2V5IHJvdGF0aW9ucyBhcmUgc2VuZCBpbiBhIHNpbmdsZSByZXF1ZXN0LCBzbyB0aGF0IHRoZXkgY2FuIGJlIHByb2Nlc3NlZCBpbiBwYXJhbGxlbFxuXHRcdGNvbnN0IHNlcnZpY2VEYXRhID0gY3JlYXRlR3JvdXBLZXlSb3RhdGlvblBvc3RJbih7IGdyb3VwS2V5VXBkYXRlczogW10gfSlcblx0XHRpZiAoIWlzRW1wdHkodGhpcy5wZW5kaW5nS2V5Um90YXRpb25zLnRlYW1PckN1c3RvbWVyR3JvdXBLZXlSb3RhdGlvbnMpKSB7XG5cdFx0XHRjb25zdCBncm91cEtleVJvdGF0aW9uRGF0YSA9IGF3YWl0IHRoaXMucm90YXRlQ3VzdG9tZXJPclRlYW1Hcm91cEtleXModXNlcilcblx0XHRcdGlmIChncm91cEtleVJvdGF0aW9uRGF0YSAhPSBudWxsKSB7XG5cdFx0XHRcdHNlcnZpY2VEYXRhLmdyb3VwS2V5VXBkYXRlcyA9IGdyb3VwS2V5Um90YXRpb25EYXRhXG5cdFx0XHR9XG5cdFx0XHR0aGlzLnBlbmRpbmdLZXlSb3RhdGlvbnMudGVhbU9yQ3VzdG9tZXJHcm91cEtleVJvdGF0aW9ucyA9IFtdXG5cdFx0fVxuXG5cdFx0bGV0IGludml0YXRpb25EYXRhOiBHcm91cEludml0YXRpb25Qb3N0RGF0YVtdID0gW11cblx0XHRpZiAoIWlzRW1wdHkodGhpcy5wZW5kaW5nS2V5Um90YXRpb25zLnVzZXJBcmVhR3JvdXBzS2V5Um90YXRpb25zKSkge1xuXHRcdFx0Y29uc3QgeyBncm91cEtleVJvdGF0aW9uRGF0YSwgcHJlcGFyZWRSZUludml0ZXMgfSA9IGF3YWl0IHRoaXMucm90YXRlVXNlckFyZWFHcm91cEtleXModXNlcilcblx0XHRcdGludml0YXRpb25EYXRhID0gcHJlcGFyZWRSZUludml0ZXNcblx0XHRcdGlmIChncm91cEtleVJvdGF0aW9uRGF0YSAhPSBudWxsKSB7XG5cdFx0XHRcdHNlcnZpY2VEYXRhLmdyb3VwS2V5VXBkYXRlcyA9IHNlcnZpY2VEYXRhLmdyb3VwS2V5VXBkYXRlcy5jb25jYXQoZ3JvdXBLZXlSb3RhdGlvbkRhdGEpXG5cdFx0XHR9XG5cdFx0XHR0aGlzLnBlbmRpbmdLZXlSb3RhdGlvbnMudXNlckFyZWFHcm91cHNLZXlSb3RhdGlvbnMgPSBbXVxuXHRcdH1cblx0XHRpZiAoc2VydmljZURhdGEuZ3JvdXBLZXlVcGRhdGVzLmxlbmd0aCA8PSAwKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0YXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChHcm91cEtleVJvdGF0aW9uU2VydmljZSwgc2VydmljZURhdGEpXG5cblx0XHRpZiAoIWlzRW1wdHkoaW52aXRhdGlvbkRhdGEpKSB7XG5cdFx0XHRjb25zdCBzaGFyZUZhY2FkZSA9IGF3YWl0IHRoaXMuc2hhcmVGYWNhZGUoKVxuXHRcdFx0YXdhaXQgcHJvbWlzZU1hcChpbnZpdGF0aW9uRGF0YSwgKHByZXBhcmVkSW52aXRlKSA9PiBzaGFyZUZhY2FkZS5zZW5kR3JvdXBJbnZpdGF0aW9uUmVxdWVzdChwcmVwYXJlZEludml0ZSkpXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBWaXNpYmxlRm9yVGVzdGluZ1xuXHQgKi9cblx0YXN5bmMgcm90YXRlQWRtaW5Hcm91cEtleXModXNlcjogVXNlciwgcGFzc3BocmFzZUtleTogQWVzMjU2S2V5LCBrZXlSb3RhdGlvbjogS2V5Um90YXRpb24pIHtcblx0XHRpZiAoaGFzTm9uUXVhbnR1bVNhZmVLZXlzKHBhc3NwaHJhc2VLZXkpKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIk5vdCBhbGxvd2VkIHRvIHJvdGF0ZSBhZG1pbiBncm91cCBrZXlzIHdpdGggYSBiY3J5cHQgcGFzc3dvcmQga2V5XCIpXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0Y29uc3QgY3VycmVudFVzZXJHcm91cEtleSA9IHRoaXMua2V5TG9hZGVyRmFjYWRlLmdldEN1cnJlbnRTeW1Vc2VyR3JvdXBLZXkoKVxuXHRcdGNvbnN0IGFkbWluR3JvdXBNZW1iZXJzaGlwID0gZ2V0Rmlyc3RPclRocm93KGdldFVzZXJHcm91cE1lbWJlcnNoaXBzKHVzZXIsIEdyb3VwVHlwZS5BZG1pbikpXG5cdFx0Y29uc3QgY3VycmVudEFkbWluR3JvdXBLZXkgPSBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5nZXRDdXJyZW50U3ltR3JvdXBLZXkoYWRtaW5Hcm91cE1lbWJlcnNoaXAuZ3JvdXApXG5cdFx0Y29uc3QgYWRtaW5LZXlSb3RhdGlvbkRhdGEgPSBhd2FpdCB0aGlzLnByZXBhcmVLZXlSb3RhdGlvbkZvckFkbWluR3JvdXAoa2V5Um90YXRpb24sIHVzZXIsIGN1cnJlbnRVc2VyR3JvdXBLZXksIGN1cnJlbnRBZG1pbkdyb3VwS2V5LCBwYXNzcGhyYXNlS2V5KVxuXHRcdHJldHVybiB0aGlzLnNlcnZpY2VFeGVjdXRvci5wb3N0KEFkbWluR3JvdXBLZXlSb3RhdGlvblNlcnZpY2UsIGFkbWluS2V5Um90YXRpb25EYXRhKVxuXHR9XG5cblx0Ly9XZSBhc3N1bWUgdGhhdCB0aGUgbG9nZ2VkLWluIHVzZXIgaXMgYW4gYWRtaW4gdXNlciBhbmQgdGhhdCB0aGUga2V5IGVuY3J5cHRpbmcgdGhlIGdyb3VwIGtleSBhcmUgYWxyZWFkeSBwcSBzZWN1cmVcblx0cHJpdmF0ZSBhc3luYyByb3RhdGVVc2VyQXJlYUdyb3VwS2V5cyh1c2VyOiBVc2VyKTogUHJvbWlzZTx7XG5cdFx0Z3JvdXBLZXlSb3RhdGlvbkRhdGE6IEdyb3VwS2V5Um90YXRpb25EYXRhW11cblx0XHRwcmVwYXJlZFJlSW52aXRlczogR3JvdXBJbnZpdGF0aW9uUG9zdERhdGFbXVxuXHR9PiB7XG5cdFx0Ly8gKiB0aGUgZW5jcnlwdGluZyBrZXlzIGFyZSAxMjgtYml0IGtleXMuICh1c2VyIGdyb3VwIGtleSlcblx0XHRjb25zdCBjdXJyZW50VXNlckdyb3VwS2V5ID0gdGhpcy5rZXlMb2FkZXJGYWNhZGUuZ2V0Q3VycmVudFN5bVVzZXJHcm91cEtleSgpXG5cdFx0aWYgKGhhc05vblF1YW50dW1TYWZlS2V5cyhjdXJyZW50VXNlckdyb3VwS2V5Lm9iamVjdCkpIHtcblx0XHRcdC8vIHVzZXIgb3IgYWRtaW4gZ3JvdXAga2V5IHJvdGF0aW9uIHNob3VsZCBiZSBzY2hlZHVsZWQgZmlyc3Qgb24gdGhlIHNlcnZlciwgc28gdGhpcyBzaG91bGQgbm90IGhhcHBlblxuXHRcdFx0Y29uc29sZS5sb2coXCJLZXlzIGNhbm5vdCBiZSByb3RhdGVkIGFzIHRoZSBlbmNyeXB0aW5nIGtleXMgYXJlIG5vdCBwcSBzZWN1cmVcIilcblx0XHRcdHJldHVybiB7IGdyb3VwS2V5Um90YXRpb25EYXRhOiBbXSwgcHJlcGFyZWRSZUludml0ZXM6IFtdIH1cblx0XHR9XG5cblx0XHRjb25zdCBncm91cEtleVVwZGF0ZXMgPSBuZXcgQXJyYXk8R3JvdXBLZXlSb3RhdGlvbkRhdGE+KClcblx0XHRsZXQgcHJlcGFyZWRSZUludml0ZXM6IEdyb3VwSW52aXRhdGlvblBvc3REYXRhW10gPSBbXVxuXHRcdGZvciAoY29uc3Qga2V5Um90YXRpb24gb2YgdGhpcy5wZW5kaW5nS2V5Um90YXRpb25zLnVzZXJBcmVhR3JvdXBzS2V5Um90YXRpb25zKSB7XG5cdFx0XHRjb25zdCB7IGdyb3VwS2V5Um90YXRpb25EYXRhLCBwcmVwYXJlZFJlSW52aXRhdGlvbnMgfSA9IGF3YWl0IHRoaXMucHJlcGFyZUtleVJvdGF0aW9uRm9yQXJlYUdyb3VwKGtleVJvdGF0aW9uLCBjdXJyZW50VXNlckdyb3VwS2V5LCB1c2VyKVxuXHRcdFx0Z3JvdXBLZXlVcGRhdGVzLnB1c2goZ3JvdXBLZXlSb3RhdGlvbkRhdGEpXG5cdFx0XHRwcmVwYXJlZFJlSW52aXRlcyA9IHByZXBhcmVkUmVJbnZpdGVzLmNvbmNhdChwcmVwYXJlZFJlSW52aXRhdGlvbnMpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgZ3JvdXBLZXlSb3RhdGlvbkRhdGE6IGdyb3VwS2V5VXBkYXRlcywgcHJlcGFyZWRSZUludml0ZXMgfVxuXHR9XG5cblx0Ly9XZSBhc3N1bWUgdGhhdCB0aGUgbG9nZ2VkLWluIHVzZXIgaXMgYW4gYWRtaW4gdXNlciBhbmQgdGhhdCB0aGUga2V5IGVuY3J5cHRpbmcgdGhlIGdyb3VwIGtleSBhcmUgYWxyZWFkeSBwcSBzZWN1cmVcblx0cHJpdmF0ZSBhc3luYyByb3RhdGVDdXN0b21lck9yVGVhbUdyb3VwS2V5cyh1c2VyOiBVc2VyKSB7XG5cdFx0Ly9ncm91cCBrZXkgcm90YXRpb24gaXMgc2tpcHBlZCBpZlxuXHRcdC8vICogdXNlciBpcyBub3QgYW4gYWRtaW4gdXNlclxuXHRcdGNvbnN0IGFkbWluR3JvdXBNZW1iZXJzaGlwID0gdXNlci5tZW1iZXJzaGlwcy5maW5kKChtKSA9PiBtLmdyb3VwVHlwZSA9PT0gR3JvdXBLZXlSb3RhdGlvblR5cGUuQWRtaW5Hcm91cEtleVJvdGF0aW9uU2luZ2xlVXNlckFjY291bnQpXG5cdFx0aWYgKGFkbWluR3JvdXBNZW1iZXJzaGlwID09IG51bGwpIHtcblx0XHRcdGNvbnNvbGUubG9nKFwiT25seSBhZG1pbiB1c2VyIGNhbiByb3RhdGUgdGhlIGdyb3VwXCIpXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHQvLyAqIHRoZSBlbmNyeXB0aW5nIGtleXMgYXJlIDEyOC1iaXQga2V5cy4gKHVzZXIgZ3JvdXAga2V5LCBhZG1pbiBncm91cCBrZXkpXG5cdFx0Y29uc3QgY3VycmVudFVzZXJHcm91cEtleSA9IHRoaXMua2V5TG9hZGVyRmFjYWRlLmdldEN1cnJlbnRTeW1Vc2VyR3JvdXBLZXkoKVxuXHRcdGNvbnN0IGN1cnJlbnRBZG1pbkdyb3VwS2V5ID0gYXdhaXQgdGhpcy5rZXlMb2FkZXJGYWNhZGUuZ2V0Q3VycmVudFN5bUdyb3VwS2V5KGFkbWluR3JvdXBNZW1iZXJzaGlwLmdyb3VwKVxuXHRcdGlmIChoYXNOb25RdWFudHVtU2FmZUtleXMoY3VycmVudFVzZXJHcm91cEtleS5vYmplY3QsIGN1cnJlbnRBZG1pbkdyb3VwS2V5Lm9iamVjdCkpIHtcblx0XHRcdC8vIGFkbWluIGdyb3VwIGtleSByb3RhdGlvbiBzaG91bGQgYmUgc2NoZWR1bGVkIGZpcnN0IG9uIHRoZSBzZXJ2ZXIsIHNvIHRoaXMgc2hvdWxkIG5vdCBoYXBwZW5cblx0XHRcdGNvbnNvbGUubG9nKFwiS2V5cyBjYW5ub3QgYmUgcm90YXRlZCBhcyB0aGUgZW5jcnlwdGluZyBrZXlzIGFyZSBub3QgcHEgc2VjdXJlXCIpXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHRjb25zdCBncm91cEtleVVwZGF0ZXMgPSBuZXcgQXJyYXk8R3JvdXBLZXlSb3RhdGlvbkRhdGE+KClcblx0XHRmb3IgKGNvbnN0IGtleVJvdGF0aW9uIG9mIHRoaXMucGVuZGluZ0tleVJvdGF0aW9ucy50ZWFtT3JDdXN0b21lckdyb3VwS2V5Um90YXRpb25zKSB7XG5cdFx0XHRjb25zdCBncm91cEtleVJvdGF0aW9uRGF0YSA9IGF3YWl0IHRoaXMucHJlcGFyZUtleVJvdGF0aW9uRm9yQ3VzdG9tZXJPclRlYW1Hcm91cChrZXlSb3RhdGlvbiwgY3VycmVudFVzZXJHcm91cEtleSwgY3VycmVudEFkbWluR3JvdXBLZXksIHVzZXIpXG5cdFx0XHRncm91cEtleVVwZGF0ZXMucHVzaChncm91cEtleVJvdGF0aW9uRGF0YSlcblx0XHR9XG5cdFx0cmV0dXJuIGdyb3VwS2V5VXBkYXRlc1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBwcmVwYXJlS2V5Um90YXRpb25Gb3JBZG1pbkdyb3VwKFxuXHRcdGtleVJvdGF0aW9uOiBLZXlSb3RhdGlvbixcblx0XHR1c2VyOiBVc2VyLFxuXHRcdGN1cnJlbnRVc2VyR3JvdXBLZXk6IFZlcnNpb25lZEtleSxcblx0XHRjdXJyZW50QWRtaW5Hcm91cEtleTogVmVyc2lvbmVkS2V5LFxuXHRcdHBhc3NwaHJhc2VLZXk6IEFlczI1NktleSxcblx0KTogUHJvbWlzZTxBZG1pbkdyb3VwS2V5Um90YXRpb25Qb3N0SW4+IHtcblx0XHRjb25zdCBhZG1pbkdyb3VwSWQgPSB0aGlzLmdldFRhcmdldEdyb3VwSWQoa2V5Um90YXRpb24pXG5cdFx0Y29uc3QgdXNlckdyb3VwTWVtYmVyc2hpcCA9IHVzZXIudXNlckdyb3VwXG5cdFx0Y29uc3QgdXNlckdyb3VwSWQgPSB1c2VyR3JvdXBNZW1iZXJzaGlwLmdyb3VwXG5cdFx0Y29uc29sZS5sb2coYEtleVJvdGF0aW9uRmFjYWRlOiByb3RhdGUga2V5IGZvciBncm91cDogJHthZG1pbkdyb3VwSWR9LCBncm91cEtleVJvdGF0aW9uVHlwZTogJHtrZXlSb3RhdGlvbi5ncm91cEtleVJvdGF0aW9uVHlwZX1gKVxuXG5cdFx0Y29uc3QgYWRtaW5Hcm91cCA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoR3JvdXBUeXBlUmVmLCBhZG1pbkdyb3VwSWQpXG5cdFx0Y29uc3QgdXNlckdyb3VwID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChHcm91cFR5cGVSZWYsIHVzZXJHcm91cElkKVxuXG5cdFx0Y29uc3QgbmV3QWRtaW5Hcm91cEtleXMgPSBhd2FpdCB0aGlzLmdlbmVyYXRlR3JvdXBLZXlzKGFkbWluR3JvdXApXG5cdFx0Y29uc3QgYWRtaW5LZXlQYWlyID0gYXNzZXJ0Tm90TnVsbChuZXdBZG1pbkdyb3VwS2V5cy5lbmNyeXB0ZWRLZXlQYWlyKVxuXHRcdGNvbnN0IHB1YkVjY0tleSA9IGFzc2VydE5vdE51bGwoYWRtaW5LZXlQYWlyLnB1YkVjY0tleSlcblx0XHRjb25zdCBwdWJLeWJlcktleSA9IGFzc2VydE5vdE51bGwoYWRtaW5LZXlQYWlyLnB1Ykt5YmVyS2V5KVxuXHRcdGNvbnN0IGFkbWluR3JvdXBLZXlBdXRoZW50aWNhdGlvbkRhdGFMaXN0ID0gYXdhaXQgdGhpcy5nZW5lcmF0ZUVuY3J5cHRlZEtleUhhc2hlcyhcblx0XHRcdHB1YkVjY0tleSxcblx0XHRcdHB1Ykt5YmVyS2V5LFxuXHRcdFx0bmV3QWRtaW5Hcm91cEtleXMuc3ltR3JvdXBLZXkudmVyc2lvbixcblx0XHRcdGFkbWluR3JvdXBJZCxcblx0XHRcdGFzc2VydE5vdE51bGwodXNlci5jdXN0b21lciksXG5cdFx0XHR1c2VyR3JvdXBJZCxcblx0XHQpXG5cblx0XHRjb25zdCBuZXdVc2VyR3JvdXBLZXlzID0gYXdhaXQgdGhpcy5nZW5lcmF0ZUdyb3VwS2V5cyh1c2VyR3JvdXApXG5cdFx0Y29uc3QgZW5jcnlwdGVkQWRtaW5LZXlzID0gYXdhaXQgdGhpcy5lbmNyeXB0R3JvdXBLZXlzKGFkbWluR3JvdXAsIGN1cnJlbnRBZG1pbkdyb3VwS2V5LCBuZXdBZG1pbkdyb3VwS2V5cywgbmV3QWRtaW5Hcm91cEtleXMuc3ltR3JvdXBLZXkpXG5cdFx0Y29uc3QgZW5jcnlwdGVkVXNlcktleXMgPSBhd2FpdCB0aGlzLmVuY3J5cHRVc2VyR3JvdXBLZXkodXNlckdyb3VwLCBjdXJyZW50VXNlckdyb3VwS2V5LCBuZXdVc2VyR3JvdXBLZXlzLCBwYXNzcGhyYXNlS2V5LCBuZXdBZG1pbkdyb3VwS2V5cywgdXNlcilcblx0XHRjb25zdCBtZW1iZXJzaGlwRW5jTmV3R3JvdXBLZXkgPSB0aGlzLmNyeXB0b1dyYXBwZXIuZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkobmV3VXNlckdyb3VwS2V5cy5zeW1Hcm91cEtleSwgbmV3QWRtaW5Hcm91cEtleXMuc3ltR3JvdXBLZXkub2JqZWN0KVxuXG5cdFx0Y29uc3QgYWRtaW5Hcm91cEtleURhdGEgPSBjcmVhdGVHcm91cEtleVJvdGF0aW9uRGF0YSh7XG5cdFx0XHRhZG1pbkdyb3VwRW5jR3JvdXBLZXk6IGFzc2VydE5vdE51bGwoZW5jcnlwdGVkQWRtaW5LZXlzLmFkbWluR3JvdXBLZXlFbmNOZXdHcm91cEtleSkua2V5LFxuXHRcdFx0YWRtaW5Hcm91cEtleVZlcnNpb246IFN0cmluZyhhc3NlcnROb3ROdWxsKGVuY3J5cHRlZEFkbWluS2V5cy5hZG1pbkdyb3VwS2V5RW5jTmV3R3JvdXBLZXkpLmVuY3J5cHRpbmdLZXlWZXJzaW9uKSxcblx0XHRcdGdyb3VwRW5jUHJldmlvdXNHcm91cEtleTogZW5jcnlwdGVkQWRtaW5LZXlzLm5ld0dyb3VwS2V5RW5jQ3VycmVudEdyb3VwS2V5LmtleSxcblx0XHRcdGdyb3VwS2V5VmVyc2lvbjogU3RyaW5nKG5ld0FkbWluR3JvdXBLZXlzLnN5bUdyb3VwS2V5LnZlcnNpb24pLFxuXHRcdFx0Z3JvdXA6IGFkbWluR3JvdXAuX2lkLFxuXHRcdFx0a2V5UGFpcjogbWFrZUtleVBhaXIoZW5jcnlwdGVkQWRtaW5LZXlzLmtleVBhaXIpLFxuXHRcdFx0Z3JvdXBLZXlVcGRhdGVzRm9yTWVtYmVyczogW10sIC8vIHdlIG9ubHkgcm90YXRlZCBmb3IgYWRtaW4gZ3JvdXBzIHdpdGggb25seSBvbmUgbWVtYmVyLFxuXHRcdFx0Z3JvdXBNZW1iZXJzaGlwVXBkYXRlRGF0YTogW1xuXHRcdFx0XHRjcmVhdGVHcm91cE1lbWJlcnNoaXBVcGRhdGVEYXRhKHtcblx0XHRcdFx0XHR1c2VySWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHRcdHVzZXJFbmNHcm91cEtleTogbWVtYmVyc2hpcEVuY05ld0dyb3VwS2V5LmtleSxcblx0XHRcdFx0XHR1c2VyS2V5VmVyc2lvbjogU3RyaW5nKG1lbWJlcnNoaXBFbmNOZXdHcm91cEtleS5lbmNyeXB0aW5nS2V5VmVyc2lvbiksXG5cdFx0XHRcdH0pLFxuXHRcdFx0XSxcblx0XHR9KVxuXG5cdFx0Y29uc3QgdXNlckdyb3VwS2V5RGF0YSA9IGNyZWF0ZVVzZXJHcm91cEtleVJvdGF0aW9uRGF0YSh7XG5cdFx0XHRyZWNvdmVyQ29kZURhdGE6IGVuY3J5cHRlZFVzZXJLZXlzLnJlY292ZXJDb2RlRGF0YSxcblx0XHRcdGRpc3RyaWJ1dGlvbktleUVuY1VzZXJHcm91cEtleTogZW5jcnlwdGVkVXNlcktleXMuZGlzdHJpYnV0aW9uS2V5RW5jTmV3VXNlckdyb3VwS2V5LFxuXHRcdFx0YXV0aFZlcmlmaWVyOiBlbmNyeXB0ZWRVc2VyS2V5cy5hdXRoVmVyaWZpZXIsXG5cdFx0XHRncm91cDogdXNlckdyb3VwLl9pZCxcblx0XHRcdHVzZXJHcm91cEVuY1ByZXZpb3VzR3JvdXBLZXk6IGVuY3J5cHRlZFVzZXJLZXlzLm5ld1VzZXJHcm91cEtleUVuY0N1cnJlbnRHcm91cEtleS5rZXksXG5cdFx0XHR1c2VyR3JvdXBLZXlWZXJzaW9uOiBTdHJpbmcobmV3VXNlckdyb3VwS2V5cy5zeW1Hcm91cEtleS52ZXJzaW9uKSxcblx0XHRcdGtleVBhaXI6IGVuY3J5cHRlZFVzZXJLZXlzLmtleVBhaXIsXG5cdFx0XHRhZG1pbkdyb3VwRW5jVXNlckdyb3VwS2V5OiBlbmNyeXB0ZWRVc2VyS2V5cy5uZXdBZG1pbkdyb3VwS2V5RW5jTmV3VXNlckdyb3VwS2V5LmtleSxcblx0XHRcdGFkbWluR3JvdXBLZXlWZXJzaW9uOiBTdHJpbmcoZW5jcnlwdGVkVXNlcktleXMubmV3QWRtaW5Hcm91cEtleUVuY05ld1VzZXJHcm91cEtleS5lbmNyeXB0aW5nS2V5VmVyc2lvbiksXG5cdFx0XHRwYXNzcGhyYXNlRW5jVXNlckdyb3VwS2V5OiBlbmNyeXB0ZWRVc2VyS2V5cy5wYXNzcGhyYXNlS2V5RW5jTmV3VXNlckdyb3VwS2V5LmtleSxcblx0XHRcdHB1YkFkbWluR3JvdXBFbmNVc2VyR3JvdXBLZXk6IG51bGwsXG5cdFx0fSlcblxuXHRcdHJldHVybiBjcmVhdGVBZG1pbkdyb3VwS2V5Um90YXRpb25Qb3N0SW4oeyBhZG1pbkdyb3VwS2V5RGF0YSwgdXNlckdyb3VwS2V5RGF0YSwgYWRtaW5Hcm91cEtleUF1dGhlbnRpY2F0aW9uRGF0YUxpc3QgfSlcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVFbmNyeXB0ZWRLZXlIYXNoZXMoXG5cdFx0cHViRWNjS2V5OiBVaW50OEFycmF5LFxuXHRcdHB1Ykt5YmVyS2V5OiBVaW50OEFycmF5LFxuXHRcdGFkbWluR3JvdXBLZXlWZXJzaW9uOiBudW1iZXIsXG5cdFx0YWRtaW5Hcm91cElkOiBJZCxcblx0XHRjdXN0b21lcklkOiBJZCxcblx0XHRncm91cFRvRXhjbHVkZTogSWQsXG5cdCk6IFByb21pc2U8QXJyYXk8QWRtaW5Hcm91cEtleUF1dGhlbnRpY2F0aW9uRGF0YT4+IHtcblx0XHRjb25zdCBrZXlIYXNoID0gdGhpcy5nZW5lcmF0ZUtleUhhc2goYWRtaW5Hcm91cEtleVZlcnNpb24sIGFkbWluR3JvdXBJZCwgcHViRWNjS2V5LCBwdWJLeWJlcktleSlcblx0XHRjb25zdCBrZXlIYXNoZXM6IEFkbWluR3JvdXBLZXlBdXRoZW50aWNhdGlvbkRhdGFbXSA9IFtdXG5cblx0XHRjb25zdCBjdXN0b21lciA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoQ3VzdG9tZXJUeXBlUmVmLCBjdXN0b21lcklkKVxuXHRcdGNvbnN0IHVzZXJHcm91cEluZm9zID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZEFsbChHcm91cEluZm9UeXBlUmVmLCBjdXN0b21lci51c2VyR3JvdXBzKVxuXG5cdFx0Zm9yIChjb25zdCB1c2VyR3JvdXBJbmZvIG9mIHVzZXJHcm91cEluZm9zKSB7XG5cdFx0XHRpZiAoaXNTYW1lSWQodXNlckdyb3VwSW5mby5ncm91cCwgZ3JvdXBUb0V4Y2x1ZGUpKSBjb250aW51ZVxuXHRcdFx0bGV0IGdtZiA9IGF3YWl0IHRoaXMuZ3JvdXBNYW5hZ2VtZW50RmFjYWRlKClcblx0XHRcdGNvbnN0IHVzZXJHcm91cEtleSA9IGF3YWl0IGdtZi5nZXRDdXJyZW50R3JvdXBLZXlWaWFBZG1pbkVuY0dLZXkodXNlckdyb3VwSW5mby5ncm91cClcblx0XHRcdGNvbnN0IGF1dGhLZXkgPSB0aGlzLmRlcml2ZVJvdGF0aW9uSGFzaEtleSh1c2VyR3JvdXBJbmZvLmdyb3VwLCB1c2VyR3JvdXBLZXkpXG5cdFx0XHRjb25zdCBlbmNyeXB0ZWRLZXlIYXNoID0gdGhpcy5jcnlwdG9XcmFwcGVyLmFlc0VuY3J5cHQoYXV0aEtleSwga2V5SGFzaClcblx0XHRcdGNvbnN0IHB1YmxpY0tleUhhc2ggPSBjcmVhdGVBZG1pbkdyb3VwS2V5QXV0aGVudGljYXRpb25EYXRhKHtcblx0XHRcdFx0dXNlckdyb3VwOiB1c2VyR3JvdXBJbmZvLmdyb3VwLFxuXHRcdFx0XHRhdXRoS2V5RW5jQWRtaW5Sb3RhdGlvbkhhc2g6IGVuY3J5cHRlZEtleUhhc2gsXG5cdFx0XHRcdHZlcnNpb246IFN0cmluZyhhZG1pbkdyb3VwS2V5VmVyc2lvbiksXG5cdFx0XHR9KVxuXHRcdFx0a2V5SGFzaGVzLnB1c2gocHVibGljS2V5SGFzaClcblx0XHR9XG5cblx0XHRyZXR1cm4ga2V5SGFzaGVzXG5cdH1cblxuXHRwcml2YXRlIGRlcml2ZVJvdGF0aW9uSGFzaEtleSh1c2VyR3JvdXBJZDogSWQsIHVzZXJHcm91cEtleTogVmVyc2lvbmVkS2V5KSB7XG5cdFx0cmV0dXJuIHRoaXMuY3J5cHRvV3JhcHBlci5kZXJpdmVLZXlXaXRoSGtkZih7XG5cdFx0XHRzYWx0OiB1c2VyR3JvdXBJZCxcblx0XHRcdGtleTogdXNlckdyb3VwS2V5Lm9iamVjdCxcblx0XHRcdGNvbnRleHQ6IFwiYWRtaW5Hcm91cEtleVJvdGF0aW9uSGFzaFwiLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGdlbmVyYXRlS2V5SGFzaChhZG1pbkdyb3VwS2V5VmVyc2lvbjogbnVtYmVyLCBhZG1pbkdyb3VwSWQ6IHN0cmluZywgcHViRWNjS2V5OiBVaW50OEFycmF5LCBwdWJLeWJlcktleTogVWludDhBcnJheSkge1xuXHRcdGNvbnN0IHZlcnNpb25CeXRlID0gVWludDhBcnJheS5mcm9tKFswXSlcblx0XHRjb25zdCBhZG1pbktleVZlcnNpb24gPSBVaW50OEFycmF5LmZyb20oW2FkbWluR3JvdXBLZXlWZXJzaW9uXSlcblx0XHRjb25zdCBpZGVudGlmaWVyVHlwZSA9IFVpbnQ4QXJyYXkuZnJvbShbTnVtYmVyKFB1YmxpY0tleUlkZW50aWZpZXJUeXBlLkdST1VQX0lEKV0pXG5cdFx0Y29uc3QgaWRlbnRpZmllciA9IGN1c3RvbUlkVG9VaW50OGFycmF5KGFkbWluR3JvdXBJZCkgLy8gYWxzbyB3b3JrcyBmb3IgZ2VuZXJhdGVkIElEc1xuXHRcdC8vRm9ybWF0OiAgdmVyc2lvbmJ5dGUsIHB1YkVjY0tleSwgcHViS3liZXJLZXksIGdyb3VwS2V5VmVyc2lvbiwgaWRlbnRpZmllciwgaWRlbnRpZmllclR5cGVcblx0XHRjb25zdCBoYXNoRGF0YSA9IGNvbmNhdCh2ZXJzaW9uQnl0ZSwgcHViRWNjS2V5LCBwdWJLeWJlcktleSwgYWRtaW5LZXlWZXJzaW9uLCBpZGVudGlmaWVyLCBpZGVudGlmaWVyVHlwZSlcblx0XHRyZXR1cm4gdGhpcy5jcnlwdG9XcmFwcGVyLnNoYTI1Nkhhc2goaGFzaERhdGEpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHByZXBhcmVLZXlSb3RhdGlvbkZvckFyZWFHcm91cChcblx0XHRrZXlSb3RhdGlvbjogS2V5Um90YXRpb24sXG5cdFx0Y3VycmVudFVzZXJHcm91cEtleTogVmVyc2lvbmVkS2V5LFxuXHRcdHVzZXI6IFVzZXIsXG5cdCk6IFByb21pc2U8UHJlcGFyZWRVc2VyQXJlYUdyb3VwS2V5Um90YXRpb24+IHtcblx0XHRjb25zdCB0YXJnZXRHcm91cElkID0gdGhpcy5nZXRUYXJnZXRHcm91cElkKGtleVJvdGF0aW9uKVxuXHRcdGNvbnNvbGUubG9nKGBLZXlSb3RhdGlvbkZhY2FkZTogcm90YXRlIGtleSBmb3IgZ3JvdXA6ICR7dGFyZ2V0R3JvdXBJZH0sIGdyb3VwS2V5Um90YXRpb25UeXBlOiAke2tleVJvdGF0aW9uLmdyb3VwS2V5Um90YXRpb25UeXBlfWApXG5cdFx0Y29uc3QgdGFyZ2V0R3JvdXAgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEdyb3VwVHlwZVJlZiwgdGFyZ2V0R3JvdXBJZClcblx0XHRjb25zdCBjdXJyZW50R3JvdXBLZXkgPSBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5nZXRDdXJyZW50U3ltR3JvdXBLZXkodGFyZ2V0R3JvdXBJZClcblxuXHRcdGNvbnN0IG5ld0dyb3VwS2V5cyA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVHcm91cEtleXModGFyZ2V0R3JvdXApXG5cdFx0Y29uc3QgZ3JvdXBFbmNQcmV2aW91c0dyb3VwS2V5ID0gdGhpcy5jcnlwdG9XcmFwcGVyLmVuY3J5cHRLZXlXaXRoVmVyc2lvbmVkS2V5KG5ld0dyb3VwS2V5cy5zeW1Hcm91cEtleSwgY3VycmVudEdyb3VwS2V5Lm9iamVjdClcblx0XHRjb25zdCBtZW1iZXJzaGlwU3ltRW5jTmV3R3JvdXBLZXkgPSB0aGlzLmNyeXB0b1dyYXBwZXIuZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkoY3VycmVudFVzZXJHcm91cEtleSwgbmV3R3JvdXBLZXlzLnN5bUdyb3VwS2V5Lm9iamVjdClcblx0XHRjb25zdCBwcmVwYXJlZFJlSW52aXRhdGlvbnMgPSBhd2FpdCB0aGlzLmhhbmRsZVBlbmRpbmdJbnZpdGF0aW9ucyh0YXJnZXRHcm91cCwgbmV3R3JvdXBLZXlzLnN5bUdyb3VwS2V5KVxuXG5cdFx0Y29uc3QgZ3JvdXBLZXlVcGRhdGVzRm9yTWVtYmVycyA9IGF3YWl0IHRoaXMuY3JlYXRlR3JvdXBLZXlVcGRhdGVzRm9yTWVtYmVycyh0YXJnZXRHcm91cCwgbmV3R3JvdXBLZXlzLnN5bUdyb3VwS2V5KVxuXG5cdFx0Y29uc3QgZ3JvdXBLZXlSb3RhdGlvbkRhdGEgPSBjcmVhdGVHcm91cEtleVJvdGF0aW9uRGF0YSh7XG5cdFx0XHRhZG1pbkdyb3VwRW5jR3JvdXBLZXk6IG51bGwsIC8vIGZvciB1c2VyIGFyZWEgZ3JvdXBzIHdlIGRvIG5vdCBoYXZlIGFuIGFkbWluR3JvdXBFbmNHcm91cEtleSBzbyB3ZSBzZXQgaXQgYWx3YXlzIHRvIG51bGwuXG5cdFx0XHRhZG1pbkdyb3VwS2V5VmVyc2lvbjogbnVsbCxcblx0XHRcdGdyb3VwOiB0YXJnZXRHcm91cElkLFxuXHRcdFx0Z3JvdXBLZXlWZXJzaW9uOiBTdHJpbmcobmV3R3JvdXBLZXlzLnN5bUdyb3VwS2V5LnZlcnNpb24pLFxuXHRcdFx0Z3JvdXBFbmNQcmV2aW91c0dyb3VwS2V5OiBncm91cEVuY1ByZXZpb3VzR3JvdXBLZXkua2V5LFxuXHRcdFx0a2V5UGFpcjogbWFrZUtleVBhaXIobmV3R3JvdXBLZXlzLmVuY3J5cHRlZEtleVBhaXIpLFxuXHRcdFx0Z3JvdXBLZXlVcGRhdGVzRm9yTWVtYmVycyxcblx0XHRcdGdyb3VwTWVtYmVyc2hpcFVwZGF0ZURhdGE6IFtcblx0XHRcdFx0Y3JlYXRlR3JvdXBNZW1iZXJzaGlwVXBkYXRlRGF0YSh7XG5cdFx0XHRcdFx0dXNlcklkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHR1c2VyRW5jR3JvdXBLZXk6IG1lbWJlcnNoaXBTeW1FbmNOZXdHcm91cEtleS5rZXksXG5cdFx0XHRcdFx0dXNlcktleVZlcnNpb246IFN0cmluZyhjdXJyZW50VXNlckdyb3VwS2V5LnZlcnNpb24pLFxuXHRcdFx0XHR9KSxcblx0XHRcdF0sXG5cdFx0fSlcblx0XHRyZXR1cm4ge1xuXHRcdFx0Z3JvdXBLZXlSb3RhdGlvbkRhdGEsXG5cdFx0XHRwcmVwYXJlZFJlSW52aXRhdGlvbnMsXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBwcmVwYXJlS2V5Um90YXRpb25Gb3JDdXN0b21lck9yVGVhbUdyb3VwKFxuXHRcdGtleVJvdGF0aW9uOiBLZXlSb3RhdGlvbixcblx0XHRjdXJyZW50VXNlckdyb3VwS2V5OiBWZXJzaW9uZWRLZXksXG5cdFx0Y3VycmVudEFkbWluR3JvdXBLZXk6IFZlcnNpb25lZEtleSxcblx0XHR1c2VyOiBVc2VyLFxuXHQpIHtcblx0XHRjb25zdCB0YXJnZXRHcm91cElkID0gdGhpcy5nZXRUYXJnZXRHcm91cElkKGtleVJvdGF0aW9uKVxuXHRcdGNvbnNvbGUubG9nKGBLZXlSb3RhdGlvbkZhY2FkZTogcm90YXRlIGtleSBmb3IgZ3JvdXA6ICR7dGFyZ2V0R3JvdXBJZH0sIGdyb3VwS2V5Um90YXRpb25UeXBlOiAke2tleVJvdGF0aW9uLmdyb3VwS2V5Um90YXRpb25UeXBlfWApXG5cdFx0Y29uc3QgdGFyZ2V0R3JvdXAgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEdyb3VwVHlwZVJlZiwgdGFyZ2V0R3JvdXBJZClcblxuXHRcdGNvbnN0IG1lbWJlcnMgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkQWxsKEdyb3VwTWVtYmVyVHlwZVJlZiwgdGFyZ2V0R3JvdXAubWVtYmVycylcblx0XHRjb25zdCBvd25NZW1iZXIgPSBtZW1iZXJzLmZpbmQoKG1lbWJlcikgPT4gbWVtYmVyLnVzZXIgPT0gdXNlci5faWQpXG5cdFx0Y29uc3Qgb3RoZXJNZW1iZXJzID0gbWVtYmVycy5maWx0ZXIoKG1lbWJlcikgPT4gbWVtYmVyLnVzZXIgIT0gdXNlci5faWQpXG5cdFx0bGV0IGN1cnJlbnRHcm91cEtleSA9IGF3YWl0IHRoaXMuZ2V0Q3VycmVudEdyb3VwS2V5KHRhcmdldEdyb3VwSWQsIHRhcmdldEdyb3VwKVxuXHRcdGNvbnN0IG5ld0dyb3VwS2V5cyA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVHcm91cEtleXModGFyZ2V0R3JvdXApXG5cdFx0Y29uc3QgZW5jcnlwdGVkR3JvdXBLZXlzID0gYXdhaXQgdGhpcy5lbmNyeXB0R3JvdXBLZXlzKHRhcmdldEdyb3VwLCBjdXJyZW50R3JvdXBLZXksIG5ld0dyb3VwS2V5cywgY3VycmVudEFkbWluR3JvdXBLZXkpXG5cblx0XHRjb25zdCBncm91cE1lbWJlcnNoaXBVcGRhdGVEYXRhID0gbmV3IEFycmF5PEdyb3VwTWVtYmVyc2hpcFVwZGF0ZURhdGE+KClcblxuXHRcdC8vZm9yIHRlYW0gZ3JvdXBzIHRoZSBhZG1pbiB1c2VyIG1pZ2h0IG5vdCBiZSBhIG1lbWJlciBvZiB0aGUgZ3JvdXBcblx0XHRpZiAob3duTWVtYmVyKSB7XG5cdFx0XHRjb25zdCBtZW1iZXJzaGlwU3ltRW5jTmV3R3JvdXBLZXkgPSB0aGlzLmNyeXB0b1dyYXBwZXIuZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkoY3VycmVudFVzZXJHcm91cEtleSwgbmV3R3JvdXBLZXlzLnN5bUdyb3VwS2V5Lm9iamVjdClcblx0XHRcdGdyb3VwTWVtYmVyc2hpcFVwZGF0ZURhdGEucHVzaChcblx0XHRcdFx0Y3JlYXRlR3JvdXBNZW1iZXJzaGlwVXBkYXRlRGF0YSh7XG5cdFx0XHRcdFx0dXNlcklkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHR1c2VyRW5jR3JvdXBLZXk6IG1lbWJlcnNoaXBTeW1FbmNOZXdHcm91cEtleS5rZXksXG5cdFx0XHRcdFx0dXNlcktleVZlcnNpb246IFN0cmluZyhjdXJyZW50VXNlckdyb3VwS2V5LnZlcnNpb24pLFxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHR9XG5cdFx0Zm9yIChjb25zdCBtZW1iZXIgb2Ygb3RoZXJNZW1iZXJzKSB7XG5cdFx0XHRjb25zdCB1c2VyRW5jTmV3R3JvdXBLZXk6IFZlcnNpb25lZEVuY3J5cHRlZEtleSA9IGF3YWl0IHRoaXMuZW5jcnlwdEdyb3VwS2V5Rm9yT3RoZXJVc2VycyhtZW1iZXIudXNlciwgbmV3R3JvdXBLZXlzLnN5bUdyb3VwS2V5KVxuXHRcdFx0bGV0IGdyb3VwTWVtYmVyc2hpcFVwZGF0ZSA9IGNyZWF0ZUdyb3VwTWVtYmVyc2hpcFVwZGF0ZURhdGEoe1xuXHRcdFx0XHR1c2VySWQ6IG1lbWJlci51c2VyLFxuXHRcdFx0XHR1c2VyRW5jR3JvdXBLZXk6IHVzZXJFbmNOZXdHcm91cEtleS5rZXksXG5cdFx0XHRcdHVzZXJLZXlWZXJzaW9uOiBTdHJpbmcodXNlckVuY05ld0dyb3VwS2V5LmVuY3J5cHRpbmdLZXlWZXJzaW9uKSxcblx0XHRcdH0pXG5cdFx0XHRncm91cE1lbWJlcnNoaXBVcGRhdGVEYXRhLnB1c2goZ3JvdXBNZW1iZXJzaGlwVXBkYXRlKVxuXHRcdH1cblxuXHRcdHJldHVybiBjcmVhdGVHcm91cEtleVJvdGF0aW9uRGF0YSh7XG5cdFx0XHRhZG1pbkdyb3VwRW5jR3JvdXBLZXk6IGVuY3J5cHRlZEdyb3VwS2V5cy5hZG1pbkdyb3VwS2V5RW5jTmV3R3JvdXBLZXkgPyBlbmNyeXB0ZWRHcm91cEtleXMuYWRtaW5Hcm91cEtleUVuY05ld0dyb3VwS2V5LmtleSA6IG51bGwsXG5cdFx0XHRhZG1pbkdyb3VwS2V5VmVyc2lvbjogZW5jcnlwdGVkR3JvdXBLZXlzLmFkbWluR3JvdXBLZXlFbmNOZXdHcm91cEtleVxuXHRcdFx0XHQ/IFN0cmluZyhlbmNyeXB0ZWRHcm91cEtleXMuYWRtaW5Hcm91cEtleUVuY05ld0dyb3VwS2V5LmVuY3J5cHRpbmdLZXlWZXJzaW9uKVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRncm91cDogdGFyZ2V0R3JvdXBJZCxcblx0XHRcdGdyb3VwS2V5VmVyc2lvbjogU3RyaW5nKG5ld0dyb3VwS2V5cy5zeW1Hcm91cEtleS52ZXJzaW9uKSxcblx0XHRcdGdyb3VwRW5jUHJldmlvdXNHcm91cEtleTogZW5jcnlwdGVkR3JvdXBLZXlzLm5ld0dyb3VwS2V5RW5jQ3VycmVudEdyb3VwS2V5LmtleSxcblx0XHRcdGtleVBhaXI6IG1ha2VLZXlQYWlyKGVuY3J5cHRlZEdyb3VwS2V5cy5rZXlQYWlyKSxcblx0XHRcdGdyb3VwS2V5VXBkYXRlc0Zvck1lbWJlcnM6IFtdLFxuXHRcdFx0Z3JvdXBNZW1iZXJzaGlwVXBkYXRlRGF0YTogZ3JvdXBNZW1iZXJzaGlwVXBkYXRlRGF0YSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBnZXRDdXJyZW50R3JvdXBLZXkodGFyZ2V0R3JvdXBJZDogc3RyaW5nLCB0YXJnZXRHcm91cDogR3JvdXApOiBQcm9taXNlPFZlcnNpb25lZEtleT4ge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5rZXlMb2FkZXJGYWNhZGUuZ2V0Q3VycmVudFN5bUdyb3VwS2V5KHRhcmdldEdyb3VwSWQpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Ly9pZiB3ZSBjYW5ub3QgZ2V0L2RlY3J5cHQgdGhlIGdyb3VwIGtleSB2aWEgbWVtYmVyc2hpcCB3ZSB0cnkgdmlhIGFkbWluRW5jR3JvdXBLZXlcblx0XHRcdGNvbnN0IGdyb3VwTWFuYWdlbWVudEZhY2FkZSA9IGF3YWl0IHRoaXMuZ3JvdXBNYW5hZ2VtZW50RmFjYWRlKClcblx0XHRcdGNvbnN0IGN1cnJlbnRLZXkgPSBhd2FpdCBncm91cE1hbmFnZW1lbnRGYWNhZGUuZ2V0R3JvdXBLZXlWaWFBZG1pbkVuY0dLZXkodGFyZ2V0R3JvdXBJZCwgTnVtYmVyKHRhcmdldEdyb3VwLmdyb3VwS2V5VmVyc2lvbikpXG5cdFx0XHRyZXR1cm4geyBvYmplY3Q6IGN1cnJlbnRLZXksIHZlcnNpb246IE51bWJlcih0YXJnZXRHcm91cC5ncm91cEtleVZlcnNpb24pIH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGVuY3J5cHRVc2VyR3JvdXBLZXkoXG5cdFx0dXNlckdyb3VwOiBHcm91cCxcblx0XHRjdXJyZW50VXNlckdyb3VwS2V5OiBWZXJzaW9uZWRLZXksXG5cdFx0bmV3VXNlckdyb3VwS2V5czogR2VuZXJhdGVkR3JvdXBLZXlzLFxuXHRcdHBhc3NwaHJhc2VLZXk6IEFlczI1NktleSxcblx0XHRuZXdBZG1pbkdyb3VwS2V5czogR2VuZXJhdGVkR3JvdXBLZXlzLFxuXHRcdHVzZXI6IFVzZXIsXG5cdCk6IFByb21pc2U8RW5jcnlwdGVkVXNlckdyb3VwS2V5cz4ge1xuXHRcdGNvbnN0IHsgbWVtYmVyc2hpcFN5bUVuY05ld0dyb3VwS2V5LCBkaXN0cmlidXRpb25LZXlFbmNOZXdVc2VyR3JvdXBLZXksIGF1dGhWZXJpZmllciB9ID0gdGhpcy5lbmNyeXB0VXNlckdyb3VwS2V5Rm9yVXNlcihcblx0XHRcdHBhc3NwaHJhc2VLZXksXG5cdFx0XHRuZXdVc2VyR3JvdXBLZXlzLFxuXHRcdFx0dXNlckdyb3VwLFxuXHRcdFx0Y3VycmVudFVzZXJHcm91cEtleSxcblx0XHQpXG5cblx0XHRjb25zdCBlbmNyeXB0ZWRVc2VyS2V5cyA9IGF3YWl0IHRoaXMuZW5jcnlwdEdyb3VwS2V5cyh1c2VyR3JvdXAsIGN1cnJlbnRVc2VyR3JvdXBLZXksIG5ld1VzZXJHcm91cEtleXMsIG5ld0FkbWluR3JvdXBLZXlzLnN5bUdyb3VwS2V5KVxuXHRcdGNvbnN0IHJlY292ZXJDb2RlRGF0YSA9IGF3YWl0IHRoaXMucmVlbmNyeXB0UmVjb3ZlckNvZGVJZkV4aXN0cyh1c2VyLCBwYXNzcGhyYXNlS2V5LCBuZXdVc2VyR3JvdXBLZXlzKVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdG5ld1VzZXJHcm91cEtleUVuY0N1cnJlbnRHcm91cEtleTogZW5jcnlwdGVkVXNlcktleXMubmV3R3JvdXBLZXlFbmNDdXJyZW50R3JvdXBLZXksXG5cdFx0XHRuZXdBZG1pbkdyb3VwS2V5RW5jTmV3VXNlckdyb3VwS2V5OiBhc3NlcnROb3ROdWxsKGVuY3J5cHRlZFVzZXJLZXlzLmFkbWluR3JvdXBLZXlFbmNOZXdHcm91cEtleSksXG5cdFx0XHRrZXlQYWlyOiBhc3NlcnROb3ROdWxsKG1ha2VLZXlQYWlyKGVuY3J5cHRlZFVzZXJLZXlzLmtleVBhaXIpKSxcblx0XHRcdHBhc3NwaHJhc2VLZXlFbmNOZXdVc2VyR3JvdXBLZXk6IG1lbWJlcnNoaXBTeW1FbmNOZXdHcm91cEtleSxcblx0XHRcdHJlY292ZXJDb2RlRGF0YSxcblx0XHRcdGRpc3RyaWJ1dGlvbktleUVuY05ld1VzZXJHcm91cEtleSxcblx0XHRcdGF1dGhWZXJpZmllcixcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHJlZW5jcnlwdFJlY292ZXJDb2RlSWZFeGlzdHModXNlcjogVXNlciwgcGFzc3BocmFzZUtleTogQWVzS2V5LCBuZXdVc2VyR3JvdXBLZXlzOiBHZW5lcmF0ZWRHcm91cEtleXMpOiBQcm9taXNlPFJlY292ZXJDb2RlRGF0YSB8IG51bGw+IHtcblx0XHRsZXQgcmVjb3ZlckNvZGVEYXRhOiBSZWNvdmVyQ29kZURhdGEgfCBudWxsID0gbnVsbFxuXHRcdGlmICh1c2VyLmF1dGg/LnJlY292ZXJDb2RlICE9IG51bGwpIHtcblx0XHRcdGNvbnN0IHJlY292ZXJDb2RlRmFjYWRlID0gYXdhaXQgdGhpcy5yZWNvdmVyQ29kZUZhY2FkZSgpXG5cdFx0XHRjb25zdCByZWNvdmVyQ29kZSA9IGF3YWl0IHJlY292ZXJDb2RlRmFjYWRlLmdldFJhd1JlY292ZXJDb2RlKHBhc3NwaHJhc2VLZXkpXG5cdFx0XHRjb25zdCByZWNvdmVyRGF0YSA9IHJlY292ZXJDb2RlRmFjYWRlLmVuY3J5cHRSZWNvdmVyeUNvZGUocmVjb3ZlckNvZGUsIG5ld1VzZXJHcm91cEtleXMuc3ltR3JvdXBLZXkpXG5cdFx0XHRyZWNvdmVyQ29kZURhdGEgPSBjcmVhdGVSZWNvdmVyQ29kZURhdGEoe1xuXHRcdFx0XHRyZWNvdmVyeUNvZGVWZXJpZmllcjogcmVjb3ZlckRhdGEucmVjb3ZlcnlDb2RlVmVyaWZpZXIsXG5cdFx0XHRcdHVzZXJFbmNSZWNvdmVyeUNvZGU6IHJlY292ZXJEYXRhLnVzZXJFbmNSZWNvdmVyQ29kZSxcblx0XHRcdFx0dXNlcktleVZlcnNpb246IFN0cmluZyhyZWNvdmVyRGF0YS51c2VyS2V5VmVyc2lvbiksXG5cdFx0XHRcdHJlY292ZXJ5Q29kZUVuY1VzZXJHcm91cEtleTogcmVjb3ZlckRhdGEucmVjb3ZlckNvZGVFbmNVc2VyR3JvdXBLZXksXG5cdFx0XHR9KVxuXHRcdH1cblx0XHRyZXR1cm4gcmVjb3ZlckNvZGVEYXRhXG5cdH1cblxuXHRwcml2YXRlIGVuY3J5cHRVc2VyR3JvdXBLZXlGb3JVc2VyKHBhc3NwaHJhc2VLZXk6IEFlc0tleSwgbmV3VXNlckdyb3VwS2V5czogR2VuZXJhdGVkR3JvdXBLZXlzLCB1c2VyR3JvdXA6IEdyb3VwLCBjdXJyZW50R3JvdXBLZXk6IFZlcnNpb25lZEtleSkge1xuXHRcdGNvbnN0IHZlcnNpb25lZFBhc3NwaHJhc2VLZXkgPSB7XG5cdFx0XHRvYmplY3Q6IHBhc3NwaHJhc2VLZXksXG5cdFx0XHR2ZXJzaW9uOiAwLCAvLyBkdW1teVxuXHRcdH1cblx0XHRjb25zdCBtZW1iZXJzaGlwU3ltRW5jTmV3R3JvdXBLZXkgPSB0aGlzLmNyeXB0b1dyYXBwZXIuZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkodmVyc2lvbmVkUGFzc3BocmFzZUtleSwgbmV3VXNlckdyb3VwS2V5cy5zeW1Hcm91cEtleS5vYmplY3QpXG5cdFx0Y29uc3QgdXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5ID0gdGhpcy51c2VyRmFjYWRlLmRlcml2ZVVzZXJHcm91cEtleURpc3RyaWJ1dGlvbktleSh1c2VyR3JvdXAuX2lkLCBwYXNzcGhyYXNlS2V5KVxuXHRcdGNvbnN0IGRpc3RyaWJ1dGlvbktleUVuY05ld1VzZXJHcm91cEtleSA9IHRoaXMuY3J5cHRvV3JhcHBlci5lbmNyeXB0S2V5KHVzZXJHcm91cEtleURpc3RyaWJ1dGlvbktleSwgbmV3VXNlckdyb3VwS2V5cy5zeW1Hcm91cEtleS5vYmplY3QpXG5cdFx0Y29uc3QgYXV0aFZlcmlmaWVyID0gY3JlYXRlQXV0aFZlcmlmaWVyKHBhc3NwaHJhc2VLZXkpXG5cdFx0Y29uc3QgbmV3R3JvdXBLZXlFbmNDdXJyZW50R3JvdXBLZXkgPSB0aGlzLmNyeXB0b1dyYXBwZXIuZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkobmV3VXNlckdyb3VwS2V5cy5zeW1Hcm91cEtleSwgY3VycmVudEdyb3VwS2V5Lm9iamVjdClcblx0XHRyZXR1cm4geyBtZW1iZXJzaGlwU3ltRW5jTmV3R3JvdXBLZXksIGRpc3RyaWJ1dGlvbktleUVuY05ld1VzZXJHcm91cEtleSwgYXV0aFZlcmlmaWVyLCBuZXdHcm91cEtleUVuY0N1cnJlbnRHcm91cEtleSB9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGhhbmRsZVBlbmRpbmdJbnZpdGF0aW9ucyh0YXJnZXRHcm91cDogR3JvdXAsIG5ld1RhcmdldEdyb3VwS2V5OiBWZXJzaW9uZWRLZXkpIHtcblx0XHRjb25zdCBwcmVwYXJlZFJlSW52aXRhdGlvbnM6IEFycmF5PEdyb3VwSW52aXRhdGlvblBvc3REYXRhPiA9IFtdXG5cdFx0Y29uc3QgdGFyZ2V0R3JvdXBJbmZvID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChHcm91cEluZm9UeXBlUmVmLCB0YXJnZXRHcm91cC5ncm91cEluZm8pXG5cdFx0Y29uc3QgcGVuZGluZ0ludml0YXRpb25zID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZEFsbChTZW50R3JvdXBJbnZpdGF0aW9uVHlwZVJlZiwgdGFyZ2V0R3JvdXAuaW52aXRhdGlvbnMpXG5cdFx0Y29uc3Qgc2VudEludml0YXRpb25zQnlDYXBhYmlsaXR5ID0gZ3JvdXBCeShwZW5kaW5nSW52aXRhdGlvbnMsIChpbnZpdGF0aW9uKSA9PiBpbnZpdGF0aW9uLmNhcGFiaWxpdHkpXG5cdFx0Y29uc3Qgc2hhcmVGYWNhZGUgPSBhd2FpdCB0aGlzLnNoYXJlRmFjYWRlKClcblx0XHRmb3IgKGNvbnN0IFtjYXBhYmlsaXR5LCBzZW50SW52aXRhdGlvbnNdIG9mIHNlbnRJbnZpdGF0aW9uc0J5Q2FwYWJpbGl0eSkge1xuXHRcdFx0Y29uc3QgaW52aXRlZU1haWxBZGRyZXNzZXMgPSBzZW50SW52aXRhdGlvbnMubWFwKChpbnZpdGUpID0+IGludml0ZS5pbnZpdGVlTWFpbEFkZHJlc3MpXG5cdFx0XHRjb25zdCBwcmVwYXJlR3JvdXBSZUludml0ZXMgPSBhc3luYyAobWFpbEFkZHJlc3Nlczogc3RyaW5nW10pID0+IHtcblx0XHRcdFx0Y29uc3QgcHJlcGFyZWRJbnZpdGF0aW9uID0gYXdhaXQgc2hhcmVGYWNhZGUucHJlcGFyZUdyb3VwSW52aXRhdGlvbihuZXdUYXJnZXRHcm91cEtleSwgdGFyZ2V0R3JvdXBJbmZvLCBtYWlsQWRkcmVzc2VzLCBkb3duY2FzdChjYXBhYmlsaXR5KSlcblx0XHRcdFx0cHJlcGFyZWRSZUludml0YXRpb25zLnB1c2gocHJlcGFyZWRJbnZpdGF0aW9uKVxuXHRcdFx0fVxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgcHJlcGFyZUdyb3VwUmVJbnZpdGVzKGludml0ZWVNYWlsQWRkcmVzc2VzKVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHQvLyB3ZSBhY2NlcHQgcmVtb3ZpbmcgcGVuZGluZyBpbnZpdGF0aW9ucyB0aGF0IHdlIGNhbm5vdCBzZW5kIGFnYWluIChlLmcuIGJlY2F1c2UgdGhlIHVzZXIgd2FzIGRlYWN0aXZhdGVkKVxuXHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFJlY2lwaWVudHNOb3RGb3VuZEVycm9yKSB7XG5cdFx0XHRcdFx0Y29uc3Qgbm90Rm91bmRSZWNpcGllbnRzID0gZS5tZXNzYWdlLnNwbGl0KFwiXFxuXCIpXG5cdFx0XHRcdFx0Y29uc3QgcmVkdWNlZEludml0ZWVBZGRyZXNzZXMgPSBpbnZpdGVlTWFpbEFkZHJlc3Nlcy5maWx0ZXIoKGFkZHJlc3MpID0+ICFub3RGb3VuZFJlY2lwaWVudHMuaW5jbHVkZXMoYWRkcmVzcykpXG5cdFx0XHRcdFx0aWYgKHJlZHVjZWRJbnZpdGVlQWRkcmVzc2VzLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0YXdhaXQgcHJlcGFyZUdyb3VwUmVJbnZpdGVzKHJlZHVjZWRJbnZpdGVlQWRkcmVzc2VzKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHByZXBhcmVkUmVJbnZpdGF0aW9uc1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBjcmVhdGVHcm91cEtleVVwZGF0ZXNGb3JNZW1iZXJzKGdyb3VwOiBHcm91cCwgbmV3R3JvdXBLZXk6IFZlcnNpb25lZEtleSk6IFByb21pc2U8QXJyYXk8R3JvdXBLZXlVcGRhdGVEYXRhPj4ge1xuXHRcdGNvbnN0IG1lbWJlcnMgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkQWxsKEdyb3VwTWVtYmVyVHlwZVJlZiwgZ3JvdXAubWVtYmVycylcblx0XHRjb25zdCBvdGhlck1lbWJlcnMgPSBtZW1iZXJzLmZpbHRlcigobWVtYmVyKSA9PiBtZW1iZXIudXNlciAhPSB0aGlzLnVzZXJGYWNhZGUuZ2V0VXNlcigpPy5faWQpXG5cdFx0cmV0dXJuIGF3YWl0IHRoaXMudHJ5Q3JlYXRpbmdHcm91cEtleVVwZGF0ZXNGb3JNZW1iZXJzKGdyb3VwLl9pZCwgb3RoZXJNZW1iZXJzLCBuZXdHcm91cEtleSlcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgdHJ5Q3JlYXRpbmdHcm91cEtleVVwZGF0ZXNGb3JNZW1iZXJzKGdyb3VwSWQ6IElkLCBvdGhlck1lbWJlcnM6IEdyb3VwTWVtYmVyW10sIG5ld0dyb3VwS2V5OiBWZXJzaW9uZWRLZXkpOiBQcm9taXNlPEdyb3VwS2V5VXBkYXRlRGF0YVtdPiB7XG5cdFx0Y29uc3QgZ3JvdXBLZXlVcGRhdGVzID0gbmV3IEFycmF5PEdyb3VwS2V5VXBkYXRlRGF0YT4oKVxuXHRcdC8vIHRyeSB0byByZWR1Y2UgdGhlIGFtb3VudCBvZiByZXF1ZXN0c1xuXHRcdGNvbnN0IGdyb3VwZWRNZW1iZXJzID0gZ3JvdXBCeShvdGhlck1lbWJlcnMsIChtZW1iZXIpID0+IGxpc3RJZFBhcnQobWVtYmVyLnVzZXJHcm91cEluZm8pKVxuXHRcdGNvbnN0IG1lbWJlcnNUb1JlbW92ZSA9IG5ldyBBcnJheTxHcm91cE1lbWJlcj4oKVxuXHRcdGZvciAoY29uc3QgW2xpc3RJZCwgbWVtYmVyc10gb2YgZ3JvdXBlZE1lbWJlcnMpIHtcblx0XHRcdGNvbnN0IHVzZXJHcm91cEluZm9zID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZE11bHRpcGxlKFxuXHRcdFx0XHRHcm91cEluZm9UeXBlUmVmLFxuXHRcdFx0XHRsaXN0SWQsXG5cdFx0XHRcdG1lbWJlcnMubWFwKChtZW1iZXIpID0+IGVsZW1lbnRJZFBhcnQobWVtYmVyLnVzZXJHcm91cEluZm8pKSxcblx0XHRcdClcblx0XHRcdGZvciAoY29uc3QgbWVtYmVyIG9mIG1lbWJlcnMpIHtcblx0XHRcdFx0Y29uc3QgdXNlckdyb3VwSW5mb0Zvck1lbWJlciA9IHVzZXJHcm91cEluZm9zLmZpbmQoKHVnaSkgPT4gaXNTYW1lSWQodWdpLl9pZCwgbWVtYmVyLnVzZXJHcm91cEluZm8pKVxuXHRcdFx0XHRjb25zdCBtZW1iZXJNYWlsQWRkcmVzcyA9IGFzc2VydE5vdE51bGwodXNlckdyb3VwSW5mb0Zvck1lbWJlcj8ubWFpbEFkZHJlc3MpIC8vIHVzZXIgZ3JvdXAgaW5mbyBtdXN0IGFsd2F5cyBoYXZlIGEgbWFpbCBhZGRyZXNzXG5cdFx0XHRcdGNvbnN0IGJ1Y2tldEtleSA9IHRoaXMuY3J5cHRvV3JhcHBlci5hZXMyNTZSYW5kb21LZXkoKVxuXHRcdFx0XHRjb25zdCBzZXNzaW9uS2V5ID0gdGhpcy5jcnlwdG9XcmFwcGVyLmFlczI1NlJhbmRvbUtleSgpXG5cdFx0XHRcdC8vIGFsd2F5cyBwYXNzIGFuIGVtcHR5IGxpc3QgYmVjYXVzZSB3ZSBkb24ndCB3YW50IHRoZSBlbmNyeXB0aW9uIHRvIGJlIHNraXBwZWQgaW4gY2FzZSBvdGhlciByZWNpcGllbnRzIHdlcmVuJ3QgZm91bmRcblx0XHRcdFx0Ly8gcmVjaXBpZW50cyB0aGF0IGFyZSBub3QgZm91bmQgd2lsbCBiZSBudWxsIGFueXdheSwgYW5kIGFkZGVkIHRvIG1lbWJlcnNUb1JlbW92ZVxuXHRcdFx0XHRjb25zdCBub3RGb3VuZFJlY2lwaWVudHM6IEFycmF5PHN0cmluZz4gPSBbXVxuXHRcdFx0XHRjb25zdCByZWNpcGllbnRLZXlEYXRhID0gYXdhaXQgdGhpcy5jcnlwdG9GYWNhZGUuZW5jcnlwdEJ1Y2tldEtleUZvckludGVybmFsUmVjaXBpZW50KFxuXHRcdFx0XHRcdHRoaXMudXNlckZhY2FkZS5nZXRVc2VyR3JvdXBJZCgpLFxuXHRcdFx0XHRcdGJ1Y2tldEtleSxcblx0XHRcdFx0XHRtZW1iZXJNYWlsQWRkcmVzcyxcblx0XHRcdFx0XHRub3RGb3VuZFJlY2lwaWVudHMsXG5cdFx0XHRcdClcblx0XHRcdFx0aWYgKHJlY2lwaWVudEtleURhdGEgIT0gbnVsbCAmJiBpc1NhbWVUeXBlUmVmKHJlY2lwaWVudEtleURhdGEuX3R5cGUsIEludGVybmFsUmVjaXBpZW50S2V5RGF0YVR5cGVSZWYpKSB7XG5cdFx0XHRcdFx0Y29uc3Qga2V5RGF0YSA9IHJlY2lwaWVudEtleURhdGEgYXMgSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhXG5cdFx0XHRcdFx0Y29uc3QgcHViRW5jS2V5RGF0YSA9IGNyZWF0ZVB1YkVuY0tleURhdGEoe1xuXHRcdFx0XHRcdFx0cmVjaXBpZW50SWRlbnRpZmllcjoga2V5RGF0YS5tYWlsQWRkcmVzcyxcblx0XHRcdFx0XHRcdHJlY2lwaWVudElkZW50aWZpZXJUeXBlOiBQdWJsaWNLZXlJZGVudGlmaWVyVHlwZS5NQUlMX0FERFJFU1MsXG5cdFx0XHRcdFx0XHRwdWJFbmNTeW1LZXk6IGtleURhdGEucHViRW5jQnVja2V0S2V5LFxuXHRcdFx0XHRcdFx0cmVjaXBpZW50S2V5VmVyc2lvbjoga2V5RGF0YS5yZWNpcGllbnRLZXlWZXJzaW9uLFxuXHRcdFx0XHRcdFx0c2VuZGVyS2V5VmVyc2lvbjoga2V5RGF0YS5zZW5kZXJLZXlWZXJzaW9uLFxuXHRcdFx0XHRcdFx0cHJvdG9jb2xWZXJzaW9uOiBrZXlEYXRhLnByb3RvY29sVmVyc2lvbixcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdGNvbnN0IGdyb3VwS2V5VXBkYXRlRGF0YSA9IGNyZWF0ZUdyb3VwS2V5VXBkYXRlRGF0YSh7XG5cdFx0XHRcdFx0XHRzZXNzaW9uS2V5RW5jR3JvdXBLZXk6IHRoaXMuY3J5cHRvV3JhcHBlci5lbmNyeXB0Qnl0ZXMoc2Vzc2lvbktleSwgYml0QXJyYXlUb1VpbnQ4QXJyYXkobmV3R3JvdXBLZXkub2JqZWN0KSksXG5cdFx0XHRcdFx0XHRzZXNzaW9uS2V5RW5jR3JvdXBLZXlWZXJzaW9uOiBTdHJpbmcobmV3R3JvdXBLZXkudmVyc2lvbiksXG5cdFx0XHRcdFx0XHRidWNrZXRLZXlFbmNTZXNzaW9uS2V5OiB0aGlzLmNyeXB0b1dyYXBwZXIuZW5jcnlwdEtleShidWNrZXRLZXksIHNlc3Npb25LZXkpLFxuXHRcdFx0XHRcdFx0cHViRW5jQnVja2V0S2V5RGF0YTogcHViRW5jS2V5RGF0YSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdGdyb3VwS2V5VXBkYXRlcy5wdXNoKGdyb3VwS2V5VXBkYXRlRGF0YSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRtZW1iZXJzVG9SZW1vdmUucHVzaChtZW1iZXIpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0Y29uc3QgZ3JvdXBNYW5hZ2VtZW50RmFjYWRlID0gYXdhaXQgdGhpcy5ncm91cE1hbmFnZW1lbnRGYWNhZGUoKVxuXHRcdGlmIChtZW1iZXJzVG9SZW1vdmUubGVuZ3RoICE9PSAwKSB7XG5cdFx0XHRmb3IgKGNvbnN0IG1lbWJlciBvZiBtZW1iZXJzVG9SZW1vdmUpIHtcblx0XHRcdFx0YXdhaXQgZ3JvdXBNYW5hZ2VtZW50RmFjYWRlLnJlbW92ZVVzZXJGcm9tR3JvdXAobWVtYmVyLnVzZXIsIGdyb3VwSWQpXG5cdFx0XHR9XG5cdFx0XHRjb25zdCByZWR1Y2VkTWVtYmVycyA9IG90aGVyTWVtYmVycy5maWx0ZXIoKG1lbWJlcikgPT4gIW1lbWJlcnNUb1JlbW92ZS5pbmNsdWRlcyhtZW1iZXIpKVxuXHRcdFx0Ly8gcmV0cnkgd2l0aG91dCB0aGUgcmVtb3ZlZCBtZW1iZXJzXG5cdFx0XHRyZXR1cm4gdGhpcy50cnlDcmVhdGluZ0dyb3VwS2V5VXBkYXRlc0Zvck1lbWJlcnMoZ3JvdXBJZCwgcmVkdWNlZE1lbWJlcnMsIG5ld0dyb3VwS2V5KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZ3JvdXBLZXlVcGRhdGVzXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEdldCB0aGUgSUQgb2YgdGhlIGdyb3VwIHdlIHdhbnQgdG8gcm90YXRlIHRoZSBrZXlzIGZvci5cblx0ICovXG5cdHByaXZhdGUgZ2V0VGFyZ2V0R3JvdXBJZChrZXlSb3RhdGlvbjogS2V5Um90YXRpb24pIHtcblx0XHQvLyBUaGUgS2V5Um90YXRpb24gaXMgYSBsaXN0IGVsZW1lbnQgdHlwZSB3aG9zZSBsaXN0IGVsZW1lbnQgSUQgcGFydCBpcyB0aGUgdGFyZ2V0IGdyb3VwIElELFxuXHRcdC8vIGkuZS4sIGFuIGluZGlyZWN0IHJlZmVyZW5jZSB0byBHcm91cC5cblx0XHRyZXR1cm4gZWxlbWVudElkUGFydChrZXlSb3RhdGlvbi5faWQpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGVuY3J5cHRHcm91cEtleXMoXG5cdFx0Z3JvdXA6IEdyb3VwLFxuXHRcdGN1cnJlbnRHcm91cEtleTogVmVyc2lvbmVkS2V5LFxuXHRcdG5ld0tleXM6IEdlbmVyYXRlZEdyb3VwS2V5cyxcblx0XHRhZG1pbkdyb3VwS2V5czogVmVyc2lvbmVkS2V5LFxuXHQpOiBQcm9taXNlPEVuY3J5cHRlZEdyb3VwS2V5cz4ge1xuXHRcdGNvbnN0IG5ld0dyb3VwS2V5RW5jQ3VycmVudEdyb3VwS2V5ID0gdGhpcy5jcnlwdG9XcmFwcGVyLmVuY3J5cHRLZXlXaXRoVmVyc2lvbmVkS2V5KG5ld0tleXMuc3ltR3JvdXBLZXksIGN1cnJlbnRHcm91cEtleS5vYmplY3QpXG5cdFx0Y29uc3QgYWRtaW5Hcm91cEtleUVuY05ld0dyb3VwS2V5ID0gKGF3YWl0IHRoaXMuZ3JvdXBNYW5hZ2VtZW50RmFjYWRlKCkpLmhhc0FkbWluRW5jR0tleShncm91cClcblx0XHRcdD8gdGhpcy5jcnlwdG9XcmFwcGVyLmVuY3J5cHRLZXlXaXRoVmVyc2lvbmVkS2V5KGFkbWluR3JvdXBLZXlzLCBuZXdLZXlzLnN5bUdyb3VwS2V5Lm9iamVjdClcblx0XHRcdDogbnVsbFxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdG5ld0dyb3VwS2V5RW5jQ3VycmVudEdyb3VwS2V5OiBuZXdHcm91cEtleUVuY0N1cnJlbnRHcm91cEtleSxcblx0XHRcdGtleVBhaXI6IG5ld0tleXMuZW5jcnlwdGVkS2V5UGFpcixcblx0XHRcdGFkbWluR3JvdXBLZXlFbmNOZXdHcm91cEtleTogYWRtaW5Hcm91cEtleUVuY05ld0dyb3VwS2V5LFxuXHRcdH1cblx0fVxuXG5cdC8qXG5cdEdldHMgdGhlIHVzZXJHcm91cEtleSBmb3IgdGhlIGdpdmVuIHVzZXJJZCB2aWEgdGhlIGFkbWluRW5jR0tleSBhbmQgc3ltbWV0cmljYWxseSBlbmNyeXB0cyB0aGUgZ2l2ZW4gbmV3R3JvdXBLZXkgd2l0aCBpdC4gTm90ZSB0aGF0IHRoZSBsb2dnZWQtaW4gdXNlciBuZWVkc1xuXHQgdG8gYmUgdGhlIGFkbWluIG9mIHRoZSBzYW1lIGN1c3RvbWVyIHRoYXQgdGhlIHVlciB3aXRoIHVzZXJJZCBiZWxvbmdzIHRvLlxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBlbmNyeXB0R3JvdXBLZXlGb3JPdGhlclVzZXJzKHVzZXJJZDogSWQsIG5ld0dyb3VwS2V5OiBWZXJzaW9uZWRLZXkpOiBQcm9taXNlPFZlcnNpb25lZEVuY3J5cHRlZEtleT4ge1xuXHRcdGNvbnN0IGdyb3VwTWFuYWdlbWVudEZhY2FkZSA9IGF3YWl0IHRoaXMuZ3JvdXBNYW5hZ2VtZW50RmFjYWRlKClcblx0XHRjb25zdCB1c2VyID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChVc2VyVHlwZVJlZiwgdXNlcklkKVxuXHRcdGNvbnN0IHVzZXJHcm91cEtleSA9IGF3YWl0IGdyb3VwTWFuYWdlbWVudEZhY2FkZS5nZXRHcm91cEtleVZpYUFkbWluRW5jR0tleSh1c2VyLnVzZXJHcm91cC5ncm91cCwgTnVtYmVyKHVzZXIudXNlckdyb3VwLmdyb3VwS2V5VmVyc2lvbikpXG5cdFx0Y29uc3QgZW5jcnlwdGVOZXdHcm91cEtleSA9IHRoaXMuY3J5cHRvV3JhcHBlci5lbmNyeXB0S2V5KHVzZXJHcm91cEtleSwgbmV3R3JvdXBLZXkub2JqZWN0KVxuXHRcdHJldHVybiB7IGtleTogZW5jcnlwdGVOZXdHcm91cEtleSwgZW5jcnlwdGluZ0tleVZlcnNpb246IE51bWJlcih1c2VyLnVzZXJHcm91cC5ncm91cEtleVZlcnNpb24pIH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVHcm91cEtleXMoZ3JvdXA6IEdyb3VwKTogUHJvbWlzZTxHZW5lcmF0ZWRHcm91cEtleXM+IHtcblx0XHRjb25zdCBzeW1Hcm91cEtleUJ5dGVzID0gdGhpcy5jcnlwdG9XcmFwcGVyLmFlczI1NlJhbmRvbUtleSgpXG5cdFx0Y29uc3Qga2V5UGFpciA9IGF3YWl0IHRoaXMuY3JlYXRlTmV3S2V5UGFpclZhbHVlKGdyb3VwLCBzeW1Hcm91cEtleUJ5dGVzKVxuXHRcdHJldHVybiB7XG5cdFx0XHRzeW1Hcm91cEtleToge1xuXHRcdFx0XHRvYmplY3Q6IHN5bUdyb3VwS2V5Qnl0ZXMsXG5cdFx0XHRcdHZlcnNpb246IE51bWJlcihncm91cC5ncm91cEtleVZlcnNpb24pICsgMSxcblx0XHRcdH0sXG5cdFx0XHRlbmNyeXB0ZWRLZXlQYWlyOiBrZXlQYWlyLFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBOb3QgYWxsIGdyb3VwcyBoYXZlIGtleSBwYWlycywgYnV0IGlmIHRoZXkgZG8gd2UgbmVlZCB0byByb3RhdGUgdGhlbSBhcyB3ZWxsLlxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBjcmVhdGVOZXdLZXlQYWlyVmFsdWUoZ3JvdXBUb1JvdGF0ZTogR3JvdXAsIG5ld1N5bW1ldHJpY0dyb3VwS2V5OiBBZXMyNTZLZXkpOiBQcm9taXNlPEVuY3J5cHRlZFBxS2V5UGFpcnMgfCBudWxsPiB7XG5cdFx0aWYgKGdyb3VwVG9Sb3RhdGUuY3VycmVudEtleXMpIHtcblx0XHRcdGNvbnN0IG5ld1BxUGFpcnMgPSBhd2FpdCB0aGlzLnBxRmFjYWRlLmdlbmVyYXRlS2V5UGFpcnMoKVxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cHViUnNhS2V5OiBudWxsLFxuXHRcdFx0XHRzeW1FbmNQcml2UnNhS2V5OiBudWxsLFxuXHRcdFx0XHRwdWJFY2NLZXk6IG5ld1BxUGFpcnMuZWNjS2V5UGFpci5wdWJsaWNLZXksXG5cdFx0XHRcdHN5bUVuY1ByaXZFY2NLZXk6IHRoaXMuY3J5cHRvV3JhcHBlci5lbmNyeXB0RWNjS2V5KG5ld1N5bW1ldHJpY0dyb3VwS2V5LCBuZXdQcVBhaXJzLmVjY0tleVBhaXIucHJpdmF0ZUtleSksXG5cdFx0XHRcdHB1Ykt5YmVyS2V5OiB0aGlzLmNyeXB0b1dyYXBwZXIua3liZXJQdWJsaWNLZXlUb0J5dGVzKG5ld1BxUGFpcnMua3liZXJLZXlQYWlyLnB1YmxpY0tleSksXG5cdFx0XHRcdHN5bUVuY1ByaXZLeWJlcktleTogdGhpcy5jcnlwdG9XcmFwcGVyLmVuY3J5cHRLeWJlcktleShuZXdTeW1tZXRyaWNHcm91cEtleSwgbmV3UHFQYWlycy5reWJlcktleVBhaXIucHJpdmF0ZUtleSksXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBWaXNpYmxlRm9yVGVzdGluZ1xuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0c2V0UGVuZGluZ0tleVJvdGF0aW9ucyhwZW5kaW5nS2V5Um90YXRpb25zOiBQZW5kaW5nS2V5Um90YXRpb24pIHtcblx0XHR0aGlzLnBlbmRpbmdLZXlSb3RhdGlvbnMgPSBwZW5kaW5nS2V5Um90YXRpb25zXG5cdFx0dGhpcy5mYWNhZGVJbml0aWFsaXplZERlZmVycmVkT2JqZWN0LnJlc29sdmUoKVxuXHR9XG5cblx0YXN5bmMgcmVzZXQoKSB7XG5cdFx0YXdhaXQgdGhpcy5mYWNhZGVJbml0aWFsaXplZERlZmVycmVkT2JqZWN0LnByb21pc2Vcblx0XHR0aGlzLnBlbmRpbmdLZXlSb3RhdGlvbnMgPSB7XG5cdFx0XHRwd0tleTogbnVsbCxcblx0XHRcdGFkbWluT3JVc2VyR3JvdXBLZXlSb3RhdGlvbjogbnVsbCxcblx0XHRcdHRlYW1PckN1c3RvbWVyR3JvdXBLZXlSb3RhdGlvbnM6IFtdLFxuXHRcdFx0dXNlckFyZWFHcm91cHNLZXlSb3RhdGlvbnM6IFtdLFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKlxuXHQgKiBAcGFyYW0gZ3JvdXBLZXlVcGRhdGVJZHMgTVVTVCBiZSBpbiB0aGUgc2FtZSBsaXN0XG5cdCAqL1xuXHRhc3luYyB1cGRhdGVHcm91cE1lbWJlcnNoaXBzKGdyb3VwS2V5VXBkYXRlSWRzOiBJZFR1cGxlW10pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoZ3JvdXBLZXlVcGRhdGVJZHMubGVuZ3RoIDwgMSkgcmV0dXJuXG5cdFx0Y29uc29sZS5sb2coXCJoYW5kbGluZyBncm91cCBrZXkgdXBkYXRlIGZvciBncm91cHM6IFwiLCBncm91cEtleVVwZGF0ZUlkcylcblx0XHRjb25zdCBncm91cEtleVVwZGF0ZUluc3RhbmNlcyA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRNdWx0aXBsZShcblx0XHRcdEdyb3VwS2V5VXBkYXRlVHlwZVJlZixcblx0XHRcdGxpc3RJZFBhcnQoZ3JvdXBLZXlVcGRhdGVJZHNbMF0pLFxuXHRcdFx0Z3JvdXBLZXlVcGRhdGVJZHMubWFwKChpZCkgPT4gZWxlbWVudElkUGFydChpZCkpLFxuXHRcdClcblx0XHRjb25zdCBncm91cEtleVVwZGF0ZXMgPSBncm91cEtleVVwZGF0ZUluc3RhbmNlcy5tYXAoKHVwZGF0ZSkgPT4gdGhpcy5wcmVwYXJlR3JvdXBNZW1iZXJzaGlwVXBkYXRlKHVwZGF0ZSkpXG5cdFx0Y29uc3QgbWVtYmVyc2hpcFB1dEluID0gY3JlYXRlTWVtYmVyc2hpcFB1dEluKHtcblx0XHRcdGdyb3VwS2V5VXBkYXRlcyxcblx0XHR9KVxuXHRcdHJldHVybiB0aGlzLnNlcnZpY2VFeGVjdXRvci5wdXQoTWVtYmVyc2hpcFNlcnZpY2UsIG1lbWJlcnNoaXBQdXRJbilcblx0fVxuXG5cdHByaXZhdGUgcHJlcGFyZUdyb3VwTWVtYmVyc2hpcFVwZGF0ZShncm91cEtleVVwZGF0ZTogR3JvdXBLZXlVcGRhdGUpOiBHcm91cE1lbWJlcnNoaXBLZXlEYXRhIHtcblx0XHRjb25zdCB1c2VyR3JvdXBLZXkgPSB0aGlzLmtleUxvYWRlckZhY2FkZS5nZXRDdXJyZW50U3ltVXNlckdyb3VwS2V5KClcblx0XHRjb25zdCBzeW1FbmNHcm91cEtleSA9IHRoaXMuY3J5cHRvV3JhcHBlci5lbmNyeXB0S2V5V2l0aFZlcnNpb25lZEtleSh1c2VyR3JvdXBLZXksIHVpbnQ4QXJyYXlUb0tleShncm91cEtleVVwZGF0ZS5ncm91cEtleSkpXG5cdFx0cmV0dXJuIGNyZWF0ZUdyb3VwTWVtYmVyc2hpcEtleURhdGEoe1xuXHRcdFx0Z3JvdXA6IGVsZW1lbnRJZFBhcnQoZ3JvdXBLZXlVcGRhdGUuX2lkKSxcblx0XHRcdHN5bUVuY0dLZXk6IHN5bUVuY0dyb3VwS2V5LmtleSxcblx0XHRcdGdyb3VwS2V5VmVyc2lvbjogZ3JvdXBLZXlVcGRhdGUuZ3JvdXBLZXlWZXJzaW9uLFxuXHRcdFx0c3ltS2V5VmVyc2lvbjogU3RyaW5nKHVzZXJHcm91cEtleS52ZXJzaW9uKSxcblx0XHR9KVxuXHR9XG5cblx0LyoqXG5cdCAqIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHVwZ3JhZGluZyB0aGUgZW5jcnlwdGlvbiBrZXlzIG9mIGFueSB1c2VyIGFjY29yZGluZyB0byBhIEdyb3VwS2V5Um90YXRpb24gb2JqZWN0XG5cdCAqIEJlZm9yZSByb3RhdGluZyB0aGUga2V5cyB0aGUgdXNlciB3aWxsIGNoZWNrIHRoYXQgdGhlIGFkbWluIGhhc2ggY3JlYXRlZCBieSB0aGUgYWRtaW4gYW5kIGVuY3J5cHRlZCB3aXRoIHRoaXMgdXNlclxuXHQgKiBncm91cCBrZXkgbWF0Y2hlcyB0aGUgaGFzaCBnZW5lcmF0ZWQgYnkgdGhlIHVzZXIgZm9yIHRoaXMgcm90YXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB1c2VyXG5cdCAqIEBwYXJhbSBwd0tleVxuXHQgKiBAcGFyYW0gdXNlckdyb3VwS2V5Um90YXRpb25cblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcm90YXRlVXNlckdyb3VwS2V5KHVzZXI6IFVzZXIsIHB3S2V5OiBBZXNLZXksIHVzZXJHcm91cEtleVJvdGF0aW9uOiBLZXlSb3RhdGlvbikge1xuXHRcdGNvbnN0IHVzZXJHcm91cE1lbWJlcnNoaXAgPSB1c2VyLnVzZXJHcm91cFxuXHRcdGNvbnN0IHVzZXJHcm91cElkID0gdXNlckdyb3VwTWVtYmVyc2hpcC5ncm91cFxuXHRcdGNvbnN0IGN1cnJlbnRVc2VyR3JvdXBLZXkgPSB0aGlzLmtleUxvYWRlckZhY2FkZS5nZXRDdXJyZW50U3ltVXNlckdyb3VwS2V5KClcblx0XHRjb25zb2xlLmxvZyhgS2V5Um90YXRpb25GYWNhZGU6IHJvdGF0ZSBrZXkgZm9yIGdyb3VwOiAke3VzZXJHcm91cElkfSwgZ3JvdXBLZXlSb3RhdGlvblR5cGU6ICR7dXNlckdyb3VwS2V5Um90YXRpb24uZ3JvdXBLZXlSb3RhdGlvblR5cGV9YClcblx0XHQvLyBjaGVjayBoYXNoZXNcblx0XHRpZiAodXNlckdyb3VwS2V5Um90YXRpb24uYWRtaW5Hcm91cEtleUF1dGhlbnRpY2F0aW9uRGF0YSA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJUaGUgaGFzaCBlbmNyeXB0ZWQgYnkgYWRtaW4gaXMgbm90IHByZXNlbnQgaW4gdGhlIHVzZXIgZ3JvdXAga2V5IHJvdGF0aW9uICFcIilcblx0XHR9XG5cdFx0Y29uc3QgeyB2ZXJzaW9uOiBhZG1pbkdyb3VwS2V5VmVyc2lvbiwgYXV0aEtleUVuY0FkbWluUm90YXRpb25IYXNoIH0gPSB1c2VyR3JvdXBLZXlSb3RhdGlvbi5hZG1pbkdyb3VwS2V5QXV0aGVudGljYXRpb25EYXRhXG5cblx0XHRjb25zdCBhdXRoS2V5ID0gdGhpcy5kZXJpdmVSb3RhdGlvbkhhc2hLZXkodXNlckdyb3VwSWQsIGN1cnJlbnRVc2VyR3JvdXBLZXkpXG5cdFx0Y29uc3QgZGVjcnlwdGVkQWRtaW5IYXNoID0gdGhpcy5jcnlwdG9XcmFwcGVyLmFlc0RlY3J5cHQoYXV0aEtleSwgYXV0aEtleUVuY0FkbWluUm90YXRpb25IYXNoLCB0cnVlKVxuXG5cdFx0Y29uc3QgdXNlckdyb3VwOiBHcm91cCA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoR3JvdXBUeXBlUmVmLCB1c2VyR3JvdXBJZClcblxuXHRcdC8vIGdldCBhZG1pbiBncm91cCBwdWJsaWMga2V5c1xuXHRcdGNvbnN0IGFkbWluR3JvdXBJZCA9IGFzc2VydE5vdE51bGwodXNlckdyb3VwLmFkbWluKVxuXHRcdGNvbnN0IGFkbWluUHVibGljS2V5R2V0SW4gPSBjcmVhdGVQdWJsaWNLZXlHZXRJbih7XG5cdFx0XHRpZGVudGlmaWVyOiBhZG1pbkdyb3VwSWQsXG5cdFx0XHRpZGVudGlmaWVyVHlwZTogUHVibGljS2V5SWRlbnRpZmllclR5cGUuR1JPVVBfSUQsXG5cdFx0XHR2ZXJzaW9uOiBudWxsLFxuXHRcdH0pXG5cdFx0Y29uc3QgYWRtaW5QdWJsaWNLZXlHZXRPdXQgPSBhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5nZXQoUHVibGljS2V5U2VydmljZSwgYWRtaW5QdWJsaWNLZXlHZXRJbilcblx0XHRjb25zdCB7IHB1YkVjY0tleSwgcHViS3liZXJLZXkgfSA9IGFkbWluUHVibGljS2V5R2V0T3V0XG5cdFx0aWYgKHB1YkVjY0tleSA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJ0cmllZCB0byBnZW5lcmF0ZSBhIGtleWhhc2ggd2hlbiByb3RhdGluZyBidXQgcmVjZWl2ZWQgYW4gZW1wdHkgcHVibGljIGVjYyBrZXkhXCIpXG5cdFx0fVxuXHRcdGlmIChwdWJLeWJlcktleSA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJ0cmllZCB0byBnZW5lcmF0ZSBhIGtleWhhc2ggd2hlbiByb3RhdGluZyBidXQgcmVjZWl2ZWQgYW4gZW1wdHkgcHVibGljIGt5YmVyIGtleSFcIilcblx0XHR9XG5cdFx0Y29uc3QgY2xpZW50R2VuZXJhdGVkS2V5SGFzaCA9IHRoaXMuZ2VuZXJhdGVLZXlIYXNoKE51bWJlcihhZG1pbkdyb3VwS2V5VmVyc2lvbiksIGFkbWluR3JvdXBJZCwgcHViRWNjS2V5LCBwdWJLeWJlcktleSlcblx0XHQvLyBhdCB0aGlzIHBvaW50IHRoZSBkZWNyeXB0ZWQgYWRtaW4ga2V5IGhhc2ggTVVTVCBlcXVhbCB0aGUgb25lIHRoYXQgd2UgZ2VuZXJhdGVkIGZvciB0aGlzIGtleSByb3RhdGlvblxuXHRcdGlmICghYXJyYXlFcXVhbHMoZGVjcnlwdGVkQWRtaW5IYXNoLCBjbGllbnRHZW5lcmF0ZWRLZXlIYXNoKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwibWlzbWF0Y2ggYmV0d2VlbiBjbGllbnQgZ2VuZXJhdGVkIGhhc2ggYW5kIGVuY3J5cHRlZCBhZG1pbiBoYXNoLCBhYm9ydGluZyByb3RhdGlvblwiKVxuXHRcdH1cblx0XHRjb25zdCBuZXdVc2VyR3JvdXBLZXlzID0gYXdhaXQgdGhpcy5nZW5lcmF0ZUdyb3VwS2V5cyh1c2VyR3JvdXApXG5cblx0XHRjb25zdCB7IG1lbWJlcnNoaXBTeW1FbmNOZXdHcm91cEtleSwgZGlzdHJpYnV0aW9uS2V5RW5jTmV3VXNlckdyb3VwS2V5LCBhdXRoVmVyaWZpZXIsIG5ld0dyb3VwS2V5RW5jQ3VycmVudEdyb3VwS2V5IH0gPSB0aGlzLmVuY3J5cHRVc2VyR3JvdXBLZXlGb3JVc2VyKFxuXHRcdFx0cHdLZXksXG5cdFx0XHRuZXdVc2VyR3JvdXBLZXlzLFxuXHRcdFx0dXNlckdyb3VwLFxuXHRcdFx0Y3VycmVudFVzZXJHcm91cEtleSxcblx0XHQpXG5cdFx0Y29uc3QgcmVjb3ZlckNvZGVEYXRhID0gYXdhaXQgdGhpcy5yZWVuY3J5cHRSZWNvdmVyQ29kZUlmRXhpc3RzKHVzZXIsIHB3S2V5LCBuZXdVc2VyR3JvdXBLZXlzKVxuXG5cdFx0Y29uc3QgcHViQWRtaW5Hcm91cEVuY1VzZXJHcm91cEtleSA9IGF3YWl0IHRoaXMuZW5jcnlwdFVzZXJHcm91cEtleUZvckFkbWluKG5ld1VzZXJHcm91cEtleXMsIGFkbWluUHVibGljS2V5R2V0T3V0LCBhZG1pbkdyb3VwSWQpXG5cblx0XHRjb25zdCB1c2VyR3JvdXBLZXlEYXRhID0gY3JlYXRlVXNlckdyb3VwS2V5Um90YXRpb25EYXRhKHtcblx0XHRcdHVzZXJHcm91cEtleVZlcnNpb246IFN0cmluZyhuZXdVc2VyR3JvdXBLZXlzLnN5bUdyb3VwS2V5LnZlcnNpb24pLFxuXHRcdFx0dXNlckdyb3VwRW5jUHJldmlvdXNHcm91cEtleTogbmV3R3JvdXBLZXlFbmNDdXJyZW50R3JvdXBLZXkua2V5LFxuXHRcdFx0cGFzc3BocmFzZUVuY1VzZXJHcm91cEtleTogbWVtYmVyc2hpcFN5bUVuY05ld0dyb3VwS2V5LmtleSxcblx0XHRcdGdyb3VwOiB1c2VyR3JvdXBJZCxcblx0XHRcdGRpc3RyaWJ1dGlvbktleUVuY1VzZXJHcm91cEtleTogZGlzdHJpYnV0aW9uS2V5RW5jTmV3VXNlckdyb3VwS2V5LFxuXHRcdFx0a2V5UGFpcjogYXNzZXJ0Tm90TnVsbChtYWtlS2V5UGFpcihuZXdVc2VyR3JvdXBLZXlzLmVuY3J5cHRlZEtleVBhaXIpKSxcblx0XHRcdGF1dGhWZXJpZmllcixcblx0XHRcdGFkbWluR3JvdXBLZXlWZXJzaW9uOiBwdWJBZG1pbkdyb3VwRW5jVXNlckdyb3VwS2V5LnJlY2lwaWVudEtleVZlcnNpb24sXG5cdFx0XHRwdWJBZG1pbkdyb3VwRW5jVXNlckdyb3VwS2V5LFxuXHRcdFx0YWRtaW5Hcm91cEVuY1VzZXJHcm91cEtleTogbnVsbCxcblx0XHRcdHJlY292ZXJDb2RlRGF0YTogcmVjb3ZlckNvZGVEYXRhLFxuXHRcdH0pXG5cblx0XHRhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5wb3N0KFVzZXJHcm91cEtleVJvdGF0aW9uU2VydmljZSwgY3JlYXRlVXNlckdyb3VwS2V5Um90YXRpb25Qb3N0SW4oeyB1c2VyR3JvdXBLZXlEYXRhIH0pKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBlbmNyeXB0VXNlckdyb3VwS2V5Rm9yQWRtaW4oXG5cdFx0bmV3VXNlckdyb3VwS2V5czogR2VuZXJhdGVkR3JvdXBLZXlzLFxuXHRcdHB1YmxpY0tleUdldE91dDogUHVibGljS2V5R2V0T3V0LFxuXHRcdGFkbWluR3JvdXBJZDogSWQsXG5cdCk6IFByb21pc2U8UHViRW5jS2V5RGF0YT4ge1xuXHRcdGNvbnN0IGFkbWluUHViS2V5czogVmVyc2lvbmVkPFB1YmxpY0tleXM+ID0ge1xuXHRcdFx0dmVyc2lvbjogTnVtYmVyKHB1YmxpY0tleUdldE91dC5wdWJLZXlWZXJzaW9uKSxcblx0XHRcdG9iamVjdDoge1xuXHRcdFx0XHRwdWJFY2NLZXk6IHB1YmxpY0tleUdldE91dC5wdWJFY2NLZXksXG5cdFx0XHRcdHB1Ykt5YmVyS2V5OiBwdWJsaWNLZXlHZXRPdXQucHViS3liZXJLZXksXG5cdFx0XHRcdHB1YlJzYUtleTogbnVsbCxcblx0XHRcdH0sXG5cdFx0fVxuXG5cdFx0Ly8gd2Ugd2FudCB0byBhdXRoZW50aWNhdGUgd2l0aCBuZXcgc2VuZGVyIGtleSBwYWlyLiBzbyB3ZSBqdXN0IGRlY3J5cHQgaXQgYWdhaW5cblx0XHRjb25zdCBwcUtleVBhaXI6IFBRS2V5UGFpcnMgPSB0aGlzLmNyeXB0b1dyYXBwZXIuZGVjcnlwdEtleVBhaXIobmV3VXNlckdyb3VwS2V5cy5zeW1Hcm91cEtleS5vYmplY3QsIGFzc2VydE5vdE51bGwobmV3VXNlckdyb3VwS2V5cy5lbmNyeXB0ZWRLZXlQYWlyKSlcblxuXHRcdGNvbnN0IHB1YkVuY1N5bUtleSA9IGF3YWl0IHRoaXMuYXN5bW1ldHJpY0NyeXB0b0ZhY2FkZS50dXRhQ3J5cHRFbmNyeXB0U3ltS2V5KG5ld1VzZXJHcm91cEtleXMuc3ltR3JvdXBLZXkub2JqZWN0LCBhZG1pblB1YktleXMsIHtcblx0XHRcdHZlcnNpb246IG5ld1VzZXJHcm91cEtleXMuc3ltR3JvdXBLZXkudmVyc2lvbixcblx0XHRcdG9iamVjdDogcHFLZXlQYWlyLmVjY0tleVBhaXIsXG5cdFx0fSlcblxuXHRcdHJldHVybiBjcmVhdGVQdWJFbmNLZXlEYXRhKHtcblx0XHRcdHJlY2lwaWVudElkZW50aWZpZXI6IGFkbWluR3JvdXBJZCxcblx0XHRcdHJlY2lwaWVudElkZW50aWZpZXJUeXBlOiBQdWJsaWNLZXlJZGVudGlmaWVyVHlwZS5HUk9VUF9JRCxcblx0XHRcdHB1YkVuY1N5bUtleTogcHViRW5jU3ltS2V5LnB1YkVuY1N5bUtleUJ5dGVzLFxuXHRcdFx0cHJvdG9jb2xWZXJzaW9uOiBwdWJFbmNTeW1LZXkuY3J5cHRvUHJvdG9jb2xWZXJzaW9uLFxuXHRcdFx0c2VuZGVyS2V5VmVyc2lvbjogcHViRW5jU3ltS2V5LnNlbmRlcktleVZlcnNpb24gIT0gbnVsbCA/IHB1YkVuY1N5bUtleS5zZW5kZXJLZXlWZXJzaW9uLnRvU3RyaW5nKCkgOiBudWxsLFxuXHRcdFx0cmVjaXBpZW50S2V5VmVyc2lvbjogcHViRW5jU3ltS2V5LnJlY2lwaWVudEtleVZlcnNpb24udG9TdHJpbmcoKSxcblx0XHR9KVxuXHR9XG59XG5cbi8qKlxuICogV2UgcmVxdWlyZSBBRVMga2V5cyB0byBiZSAyNTYtYml0IGxvbmcgdG8gYmUgcXVhbnR1bS1zYWZlIGJlY2F1c2Ugb2YgR3JvdmVyJ3MgYWxnb3JpdGhtLlxuICovXG5mdW5jdGlvbiBpc1F1YW50dW1TYWZlKGtleTogQWVzS2V5KSB7XG5cdHJldHVybiBnZXRLZXlMZW5ndGhCeXRlcyhrZXkpID09PSBLRVlfTEVOR1RIX0JZVEVTX0FFU18yNTZcbn1cblxuZnVuY3Rpb24gaGFzTm9uUXVhbnR1bVNhZmVLZXlzKC4uLmtleXM6IEFlc0tleVtdKSB7XG5cdHJldHVybiBrZXlzLnNvbWUoKGtleSkgPT4gIWlzUXVhbnR1bVNhZmUoa2V5KSlcbn1cblxuZnVuY3Rpb24gbWFrZUtleVBhaXIoa2V5UGFpcjogRW5jcnlwdGVkUHFLZXlQYWlycyB8IG51bGwpOiBLZXlQYWlyIHwgbnVsbCB7XG5cdHJldHVybiBrZXlQYWlyICE9IG51bGwgPyBjcmVhdGVLZXlQYWlyKGtleVBhaXIpIDogbnVsbFxufVxuIiwiaW1wb3J0IHsgZ2V0RnJvbU1hcCwgbmV2ZXJOdWxsIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBVc2VyIH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBWZXJzaW9uZWRLZXkgfSBmcm9tIFwiLi4vY3J5cHRvL0NyeXB0b1dyYXBwZXIuanNcIlxuaW1wb3J0IHsgQWVzMjU2S2V5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS1jcnlwdG9cIlxuXG4vKipcbiAqIEEgY2FjaGUgZm9yIGRlY3J5cHRlZCBjdXJyZW50IGtleXMgb2YgZWFjaCBncm91cC4gRW5jcnlwdGVkIGtleXMgYXJlIHN0b3JlZCBvbiBtZW1iZXJzaGlwLnN5bUVuY0dLZXkuXG4gKiAqL1xuZXhwb3J0IGNsYXNzIEtleUNhY2hlIHtcblx0cHJpdmF0ZSBjdXJyZW50R3JvdXBLZXlzOiBNYXA8SWQsIFByb21pc2U8VmVyc2lvbmVkS2V5Pj4gPSBuZXcgTWFwPElkLCBQcm9taXNlPFZlcnNpb25lZEtleT4+KClcblx0Ly8gdGhlIHVzZXIgZ3JvdXAga2V5IGlzIHBhc3N3b3JkIGVuY3J5cHRlZCBhbmQgc3RvcmVkIG9uIGEgc3BlY2lhbCBtZW1iZXJzaGlwXG5cdC8vIGFsc28gaXQgaXMgdXNlZCB0byBkZWNyeXB0IHRoZSByZXN0IG9mIHRoZSBrZXlzIHRoZXJlZm9yZSBpdCByZXF1aXJlcyBzb21lIHNwZWNpYWwgaGFuZGxpbmdcblx0cHJpdmF0ZSBjdXJyZW50VXNlckdyb3VwS2V5OiBWZXJzaW9uZWRLZXkgfCBudWxsID0gbnVsbFxuXHQvLyB0aGUgbmV3IHVzZXIgZ3JvdXAga2V5IHdpbGwgYmUgcmUtZW5jcnlwdGVkIHdpdGggdGhpcyBrZXkgdG8gZGlzdHJpYnV0ZSB0aGUgcm90YXRlZCB1c2VyIGdyb3VwIGtleSB3aXRob3V0IGFza2luZyBmb3IgdGhlIHBhc3N3b3JkXG5cdHByaXZhdGUgdXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5OiBBZXMyNTZLZXkgfCBudWxsID0gbnVsbFxuXG5cdHNldEN1cnJlbnRVc2VyR3JvdXBLZXkobmV3VXNlckdyb3VwS2V5OiBWZXJzaW9uZWRLZXkpIHtcblx0XHRpZiAodGhpcy5jdXJyZW50VXNlckdyb3VwS2V5ICE9IG51bGwgJiYgdGhpcy5jdXJyZW50VXNlckdyb3VwS2V5LnZlcnNpb24gPiBuZXdVc2VyR3JvdXBLZXkudmVyc2lvbikge1xuXHRcdFx0Y29uc29sZS5sb2coXCJUcmllZCB0byBzZXQgYW4gb3V0ZGF0ZWQgdXNlciBncm91cCBrZXlcIilcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHR0aGlzLmN1cnJlbnRVc2VyR3JvdXBLZXkgPSBuZXdVc2VyR3JvdXBLZXlcblx0fVxuXG5cdGdldEN1cnJlbnRVc2VyR3JvdXBLZXkoKTogVmVyc2lvbmVkS2V5IHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuY3VycmVudFVzZXJHcm91cEtleVxuXHR9XG5cblx0c2V0VXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uS2V5KHVzZXJHcm91cEtleURpc3RyaWJ1dGlvbktleTogQWVzMjU2S2V5KSB7XG5cdFx0dGhpcy51c2VyR3JvdXBLZXlEaXN0cmlidXRpb25LZXkgPSB1c2VyR3JvdXBLZXlEaXN0cmlidXRpb25LZXlcblx0fVxuXG5cdGdldFVzZXJHcm91cEtleURpc3RyaWJ1dGlvbktleSgpOiBBZXMyNTZLZXkgfCBudWxsIHtcblx0XHRyZXR1cm4gdGhpcy51c2VyR3JvdXBLZXlEaXN0cmlidXRpb25LZXlcblx0fVxuXG5cdC8qKlxuXHQgKlxuXHQgKiBAcGFyYW0gZ3JvdXBJZCBNVVNUIE5PVCBiZSB0aGUgdXNlciBncm91cCBpZFxuXHQgKiBAcGFyYW0ga2V5TG9hZGVyIGEgZnVuY3Rpb24gdG8gbG9hZCBhbmQgZGVjcnlwdCB0aGUgZ3JvdXAga2V5IGlmIGl0IGlzIG5vdCBjYWNoZWRcblx0ICovXG5cdGdldEN1cnJlbnRHcm91cEtleShncm91cElkOiBJZCwga2V5TG9hZGVyOiAoKSA9PiBQcm9taXNlPFZlcnNpb25lZEtleT4pOiBQcm9taXNlPFZlcnNpb25lZEtleT4ge1xuXHRcdHJldHVybiBnZXRGcm9tTWFwKHRoaXMuY3VycmVudEdyb3VwS2V5cywgZ3JvdXBJZCwgYXN5bmMgKCkgPT4ge1xuXHRcdFx0cmV0dXJuIGtleUxvYWRlcigpXG5cdFx0fSlcblx0fVxuXG5cdHJlc2V0KCkge1xuXHRcdHRoaXMuY3VycmVudEdyb3VwS2V5cyA9IG5ldyBNYXA8SWQsIFByb21pc2U8VmVyc2lvbmVkS2V5Pj4oKVxuXHRcdHRoaXMuY3VycmVudFVzZXJHcm91cEtleSA9IG51bGxcblx0XHR0aGlzLnVzZXJHcm91cEtleURpc3RyaWJ1dGlvbktleSA9IG51bGxcblx0fVxuXG5cdC8qKlxuXHQgKiBDbGVhcnMga2V5cyBmcm9tIHRoZSBjYWNoZSB3aGljaCBhcmUgb3V0ZGF0ZWQgb3Igd2hlcmUgd2UgZG8gbm8gbG9uZ2VyIGhhdmEgYSBtZW1iZXJzaGlwLlxuXHQgKiBBbiBvdXRkYXRlZCB1c2VyIG1lbWJlcnNoaXAgaXMgaWdub3JlZCBhbmQgc2hvdWxkIGJlIHByb2Nlc3NlZCBieSB0aGUgVXNlckdyb3VwS2V5RGlzdHJpYnV0aW9uIHVwZGF0ZS5cblx0ICogQHBhcmFtIHVzZXIgdXBkYXRlZCB1c2VyIHdpdGggdXAtdG8tZGF0ZSBtZW1iZXJzaGlwc1xuXHQgKi9cblx0YXN5bmMgcmVtb3ZlT3V0ZGF0ZWRHcm91cEtleXModXNlcjogVXNlcikge1xuXHRcdGNvbnN0IGN1cnJlbnRVc2VyR3JvdXBLZXlWZXJzaW9uID0gbmV2ZXJOdWxsKHRoaXMuZ2V0Q3VycmVudFVzZXJHcm91cEtleSgpKS52ZXJzaW9uXG5cdFx0Y29uc3QgcmVjZWl2ZWRVc2VyR3JvdXBLZXlWZXJzaW9uID0gTnVtYmVyKHVzZXIudXNlckdyb3VwLmdyb3VwS2V5VmVyc2lvbilcblx0XHRpZiAocmVjZWl2ZWRVc2VyR3JvdXBLZXlWZXJzaW9uID4gY3VycmVudFVzZXJHcm91cEtleVZlcnNpb24pIHtcblx0XHRcdC8vd2UganVzdCBpZ25vcmUgdGhpcyBhcyB0aGUgc2FtZSBiYXRjaCBNVVNUIGhhdmUgYSBVc2VyR3JvdXBLZXlEaXN0cmlidXRpb24gZW50aXR5IGV2ZW50IHVwZGF0ZVxuXHRcdFx0Y29uc29sZS5sb2coYFJlY2VpdmVkIHVzZXIgdXBkYXRlIHdpdGggbmV3IHVzZXIgZ3JvdXAga2V5IHZlcnNpb246ICR7Y3VycmVudFVzZXJHcm91cEtleVZlcnNpb259IC0+ICR7cmVjZWl2ZWRVc2VyR3JvdXBLZXlWZXJzaW9ufWApXG5cdFx0fVxuXG5cdFx0Y29uc3QgbmV3Q3VycmVudEdyb3VwS2V5Q2FjaGUgPSBuZXcgTWFwPElkLCBQcm9taXNlPFZlcnNpb25lZEtleT4+KClcblx0XHRmb3IgKGNvbnN0IG1lbWJlcnNoaXAgb2YgdXNlci5tZW1iZXJzaGlwcykge1xuXHRcdFx0Y29uc3QgY2FjaGVkR3JvdXBLZXkgPSB0aGlzLmN1cnJlbnRHcm91cEtleXMuZ2V0KG1lbWJlcnNoaXAuZ3JvdXApXG5cdFx0XHRpZiAoY2FjaGVkR3JvdXBLZXkgIT0gbnVsbCAmJiBOdW1iZXIobWVtYmVyc2hpcC5ncm91cEtleVZlcnNpb24pID09PSAoYXdhaXQgY2FjaGVkR3JvdXBLZXkpLnZlcnNpb24pIHtcblx0XHRcdFx0YXdhaXQgZ2V0RnJvbU1hcChuZXdDdXJyZW50R3JvdXBLZXlDYWNoZSwgbWVtYmVyc2hpcC5ncm91cCwgKCkgPT4gY2FjaGVkR3JvdXBLZXkpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMuY3VycmVudEdyb3VwS2V5cyA9IG5ld0N1cnJlbnRHcm91cEtleUNhY2hlXG5cdH1cbn1cbiIsImltcG9ydCB7IFVzZXJUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEFjY291bnRUeXBlLCBPRkZMSU5FX1NUT1JBR0VfREVGQVVMVF9USU1FX1JBTkdFX0RBWVMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgREFZX0lOX01JTExJUywgZ3JvdXBCeUFuZE1hcCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHtcblx0Y29uc3RydWN0TWFpbFNldEVudHJ5SWQsXG5cdERFRkFVTFRfTUFJTFNFVF9FTlRSWV9DVVNUT01fQ1VUT0ZGX1RJTUVTVEFNUCxcblx0ZWxlbWVudElkUGFydCxcblx0Zmlyc3RCaWdnZXJUaGFuU2Vjb25kLFxuXHRHRU5FUkFURURfTUFYX0lELFxuXHRnZXRFbGVtZW50SWQsXG5cdGxpc3RJZFBhcnQsXG5cdHRpbWVzdGFtcFRvR2VuZXJhdGVkSWQsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQge1xuXHRGaWxlVHlwZVJlZixcblx0TWFpbEJveFR5cGVSZWYsXG5cdE1haWxEZXRhaWxzQmxvYlR5cGVSZWYsXG5cdE1haWxEZXRhaWxzRHJhZnRUeXBlUmVmLFxuXHRNYWlsRm9sZGVyVHlwZVJlZixcblx0TWFpbFNldEVudHJ5VHlwZVJlZixcblx0TWFpbFR5cGVSZWYsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEZvbGRlclN5c3RlbSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9tYWlsL0ZvbGRlclN5c3RlbS5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSwgT2ZmbGluZVN0b3JhZ2VDbGVhbmVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvT2ZmbGluZVN0b3JhZ2UuanNcIlxuaW1wb3J0IHsgaXNEcmFmdCwgaXNTcGFtT3JUcmFzaEZvbGRlciB9IGZyb20gXCIuLi8uLi9tYWlsL21vZGVsL01haWxDaGVja3MuanNcIlxuXG5leHBvcnQgY2xhc3MgTWFpbE9mZmxpbmVDbGVhbmVyIGltcGxlbWVudHMgT2ZmbGluZVN0b3JhZ2VDbGVhbmVyIHtcblx0YXN5bmMgY2xlYW5PZmZsaW5lRGIob2ZmbGluZVN0b3JhZ2U6IE9mZmxpbmVTdG9yYWdlLCB0aW1lUmFuZ2VEYXlzOiBudW1iZXIgfCBudWxsLCB1c2VySWQ6IElkLCBub3c6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHVzZXIgPSBhd2FpdCBvZmZsaW5lU3RvcmFnZS5nZXQoVXNlclR5cGVSZWYsIG51bGwsIHVzZXJJZClcblxuXHRcdC8vIEZyZWUgdXNlcnMgYWx3YXlzIGhhdmUgZGVmYXVsdCB0aW1lIHJhbmdlIHJlZ2FyZGxlc3Mgb2Ygd2hhdCBpcyBzdG9yZWRcblx0XHRjb25zdCBpc0ZyZWVVc2VyID0gdXNlcj8uYWNjb3VudFR5cGUgPT09IEFjY291bnRUeXBlLkZSRUVcblx0XHRjb25zdCB0aW1lUmFuZ2UgPSBpc0ZyZWVVc2VyIHx8IHRpbWVSYW5nZURheXMgPT0gbnVsbCA/IE9GRkxJTkVfU1RPUkFHRV9ERUZBVUxUX1RJTUVfUkFOR0VfREFZUyA6IHRpbWVSYW5nZURheXNcblx0XHRjb25zdCBkYXlzU2luY2VEYXlBZnRlckVwb2NoID0gbm93IC8gREFZX0lOX01JTExJUyAtIDFcblx0XHRjb25zdCB0aW1lUmFuZ2VNaWxsaXNTYWZlID0gTWF0aC5taW4oZGF5c1NpbmNlRGF5QWZ0ZXJFcG9jaCwgdGltZVJhbmdlKSAqIERBWV9JTl9NSUxMSVNcblx0XHQvLyBmcm9tIE1heSAxNXRoIDIxMDkgb253YXJkLCBleGNlZWRpbmcgZGF5c1NpbmNlRGF5QWZ0ZXJFcG9jaCBpbiB0aGUgdGltZSByYW5nZSBzZXR0aW5nIHdpbGxcblx0XHQvLyBsZWFkIHRvIGFuIG92ZXJmbG93IGluIG91ciA0MiBiaXQgdGltZXN0YW1wIGluIHRoZSBpZC5cblx0XHRjb25zdCBjdXRvZmZUaW1lc3RhbXAgPSBub3cgLSB0aW1lUmFuZ2VNaWxsaXNTYWZlXG5cblx0XHRjb25zdCBtYWlsQm94ZXMgPSBhd2FpdCBvZmZsaW5lU3RvcmFnZS5nZXRFbGVtZW50c09mVHlwZShNYWlsQm94VHlwZVJlZilcblx0XHRjb25zdCBjdXRvZmZJZCA9IHRpbWVzdGFtcFRvR2VuZXJhdGVkSWQoY3V0b2ZmVGltZXN0YW1wKVxuXHRcdGZvciAoY29uc3QgbWFpbEJveCBvZiBtYWlsQm94ZXMpIHtcblx0XHRcdGNvbnN0IGlzTWFpbHNldE1pZ3JhdGVkID0gbWFpbEJveC5jdXJyZW50TWFpbEJhZyAhPSBudWxsXG5cdFx0XHRjb25zdCBmb2xkZXJzID0gYXdhaXQgb2ZmbGluZVN0b3JhZ2UuZ2V0V2hvbGVMaXN0KE1haWxGb2xkZXJUeXBlUmVmLCBtYWlsQm94LmZvbGRlcnMhLmZvbGRlcnMpXG5cdFx0XHRpZiAoaXNNYWlsc2V0TWlncmF0ZWQpIHtcblx0XHRcdFx0Ly8gZGVsZXRpbmcgbWFpbHNldGVudHJpZXMgZmlyc3QgdG8gbWFrZSBzdXJlIHRoYXQgb25jZSB3ZSBzdGFydCBkZWxldGluZyBtYWlsXG5cdFx0XHRcdC8vIHdlIGRvbid0IGhhdmUgYW55IGVudHJpZXMgdGhhdCByZWZlcmVuY2UgdGhhdCBtYWlsXG5cdFx0XHRcdGNvbnN0IGZvbGRlclN5c3RlbSA9IG5ldyBGb2xkZXJTeXN0ZW0oZm9sZGVycylcblx0XHRcdFx0Zm9yIChjb25zdCBtYWlsU2V0IG9mIGZvbGRlcnMpIHtcblx0XHRcdFx0XHRpZiAoaXNTcGFtT3JUcmFzaEZvbGRlcihmb2xkZXJTeXN0ZW0sIG1haWxTZXQpKSB7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmRlbGV0ZU1haWxTZXRFbnRyaWVzKG9mZmxpbmVTdG9yYWdlLCBtYWlsU2V0LmVudHJpZXMsIERFRkFVTFRfTUFJTFNFVF9FTlRSWV9DVVNUT01fQ1VUT0ZGX1RJTUVTVEFNUClcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5kZWxldGVNYWlsU2V0RW50cmllcyhvZmZsaW5lU3RvcmFnZSwgbWFpbFNldC5lbnRyaWVzLCBjdXRvZmZUaW1lc3RhbXApXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgbWFpbExpc3RJZHMgPSBbbWFpbEJveC5jdXJyZW50TWFpbEJhZyEsIC4uLm1haWxCb3guYXJjaGl2ZWRNYWlsQmFnc10ubWFwKChtYWlsYmFnKSA9PiBtYWlsYmFnLm1haWxzKVxuXHRcdFx0XHRmb3IgKGNvbnN0IG1haWxMaXN0SWQgb2YgbWFpbExpc3RJZHMpIHtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLmRlbGV0ZU1haWxMaXN0TGVnYWN5KG9mZmxpbmVTdG9yYWdlLCBtYWlsTGlzdElkLCBjdXRvZmZJZClcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgZm9sZGVyU3lzdGVtID0gbmV3IEZvbGRlclN5c3RlbShmb2xkZXJzKVxuXHRcdFx0XHRmb3IgKGNvbnN0IGZvbGRlciBvZiBmb2xkZXJzKSB7XG5cdFx0XHRcdFx0aWYgKGlzU3BhbU9yVHJhc2hGb2xkZXIoZm9sZGVyU3lzdGVtLCBmb2xkZXIpKSB7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmRlbGV0ZU1haWxMaXN0TGVnYWN5KG9mZmxpbmVTdG9yYWdlLCBmb2xkZXIubWFpbHMsIEdFTkVSQVRFRF9NQVhfSUQpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMuZGVsZXRlTWFpbExpc3RMZWdhY3kob2ZmbGluZVN0b3JhZ2UsIGZvbGRlci5tYWlscywgY3V0b2ZmSWQpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFRoaXMgbWV0aG9kIGRlbGV0ZXMgbWFpbHMgZnJvbSB7QHBhcmFtIGxpc3RJZH0gd2hhdCBhcmUgb2xkZXIgdGhhbiB7QHBhcmFtIGN1dG9mZklkfSBhcyB3ZWxsIGFzIGFzc29jaWF0ZWQgZGF0YS5cblx0ICpcblx0ICogaXQncyBjb25zaWRlcmVkIGxlZ2FjeSBiZWNhdXNlIG9uY2Ugd2Ugc3RhcnQgaW1wb3J0aW5nIG1haWwgaW50byBtYWlsIGJhZ3MsIG1haW50YWluaW5nIG1haWwgbGlzdCByYW5nZXMgZG9lc24ndCBtYWtlXG5cdCAqIHNlbnNlIGFueW1vcmUgLSBtYWlsIG9yZGVyIGluIGEgbGlzdCBpcyBhcmJpdHJhcnkgYXQgdGhhdCBwb2ludC5cblx0ICpcblx0ICogRm9yIGVhY2ggbWFpbCB3ZSBkZWxldGUgdGhlIG1haWwsIGl0cyBib2R5LCBoZWFkZXJzLCBhbGwgcmVmZXJlbmNlcyBtYWlsIHNldCBlbnRyaWVzIGFuZCBhbGwgcmVmZXJlbmNlZCBhdHRhY2htZW50cy5cblx0ICpcblx0ICogV2hlbiB3ZSBkZWxldGUgdGhlIEZpbGVzLCB3ZSBhbHNvIGRlbGV0ZSB0aGUgd2hvbGUgcmFuZ2UgZm9yIHRoZSB1c2VyJ3MgRmlsZSBsaXN0LiBXZSBuZWVkIHRvIGRlbGV0ZSB0aGUgd2hvbGVcblx0ICogcmFuZ2UgYmVjYXVzZSB3ZSBvbmx5IGhhdmUgb25lIGZpbGUgbGlzdCBwZXIgbWFpbGJveCwgc28gaWYgd2UgZGVsZXRlIHNvbWV0aGluZyBmcm9tIHRoZSBtaWRkbGUgb2YgaXQsIHRoZSByYW5nZVxuXHQgKiB3aWxsIG5vIGxvbmdlciBiZSB2YWxpZC4gKHRoaXMgaXMgZnV0dXJlIHByb29maW5nLCBiZWNhdXNlIGFzIG9mIG5vdyB0aGVyZSBpcyBub3QgZ29pbmcgdG8gYmUgYSBSYW5nZSBzZXQgZm9yIHRoZVxuXHQgKiBGaWxlIGxpc3QgYW55d2F5LCBzaW5jZSB3ZSBjdXJyZW50bHkgZG8gbm90IGRvIHJhbmdlIHJlcXVlc3RzIGZvciBGaWxlcy5cblx0ICpcblx0ICogXHRXZSBkbyBub3QgZGVsZXRlIENvbnZlcnNhdGlvbkVudHJpZXMgYmVjYXVzZTpcblx0ICogXHQxLiBUaGV5IGFyZSBpbiB0aGUgc2FtZSBsaXN0IGZvciB0aGUgd2hvbGUgY29udmVyc2F0aW9uIHNvIHdlIGNhbid0IGFkanVzdCB0aGUgcmFuZ2Vcblx0ICogXHQyLiBXZSBtaWdodCBuZWVkIHRoZW0gaW4gdGhlIGZ1dHVyZSBmb3Igc2hvd2luZyB0aGUgd2hvbGUgdGhyZWFkXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGRlbGV0ZU1haWxMaXN0TGVnYWN5KG9mZmxpbmVTdG9yYWdlOiBPZmZsaW5lU3RvcmFnZSwgbGlzdElkOiBJZCwgY3V0b2ZmSWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gV2UgbG9jayBhY2Nlc3MgdG8gdGhlIFwicmFuZ2VzXCIgZGIgaGVyZSBpbiBvcmRlciB0byBwcmV2ZW50IHJhY2UgY29uZGl0aW9ucyB3aGVuIGFjY2Vzc2luZyB0aGUgXCJyYW5nZXNcIiBkYXRhYmFzZS5cblx0XHRhd2FpdCBvZmZsaW5lU3RvcmFnZS5sb2NrUmFuZ2VzRGJBY2Nlc3MobGlzdElkKVxuXHRcdHRyeSB7XG5cdFx0XHQvLyBUaGlzIG11c3QgYmUgZG9uZSBiZWZvcmUgZGVsZXRpbmcgbWFpbHMgdG8ga25vdyB3aGF0IHRoZSBuZXcgcmFuZ2UgaGFzIHRvIGJlXG5cdFx0XHRhd2FpdCBvZmZsaW5lU3RvcmFnZS51cGRhdGVSYW5nZUZvckxpc3RBbmREZWxldGVPYnNvbGV0ZURhdGEoTWFpbFR5cGVSZWYsIGxpc3RJZCwgY3V0b2ZmSWQpXG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdC8vIFdlIHVubG9jayBhY2Nlc3MgdG8gdGhlIFwicmFuZ2VzXCIgZGIgaGVyZS4gV2UgbG9jayBpdCBpbiBvcmRlciB0byBwcmV2ZW50IHJhY2UgY29uZGl0aW9ucyB3aGVuIGFjY2Vzc2luZyB0aGUgXCJyYW5nZXNcIiBkYXRhYmFzZS5cblx0XHRcdGF3YWl0IG9mZmxpbmVTdG9yYWdlLnVubG9ja1Jhbmdlc0RiQWNjZXNzKGxpc3RJZClcblx0XHR9XG5cblx0XHRjb25zdCBtYWlsc1RvRGVsZXRlOiBJZFR1cGxlW10gPSBbXVxuXHRcdGNvbnN0IGF0dGFjaG1lbnRzVG9EZWxldGU6IElkVHVwbGVbXSA9IFtdXG5cdFx0Y29uc3QgbWFpbERldGFpbHNCbG9iVG9EZWxldGU6IElkVHVwbGVbXSA9IFtdXG5cdFx0Y29uc3QgbWFpbERldGFpbHNEcmFmdFRvRGVsZXRlOiBJZFR1cGxlW10gPSBbXVxuXG5cdFx0Y29uc3QgbWFpbHMgPSBhd2FpdCBvZmZsaW5lU3RvcmFnZS5nZXRXaG9sZUxpc3QoTWFpbFR5cGVSZWYsIGxpc3RJZClcblx0XHRmb3IgKGxldCBtYWlsIG9mIG1haWxzKSB7XG5cdFx0XHRpZiAoZmlyc3RCaWdnZXJUaGFuU2Vjb25kKGN1dG9mZklkLCBnZXRFbGVtZW50SWQobWFpbCkpKSB7XG5cdFx0XHRcdG1haWxzVG9EZWxldGUucHVzaChtYWlsLl9pZClcblx0XHRcdFx0Zm9yIChjb25zdCBpZCBvZiBtYWlsLmF0dGFjaG1lbnRzKSB7XG5cdFx0XHRcdFx0YXR0YWNobWVudHNUb0RlbGV0ZS5wdXNoKGlkKVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGlzRHJhZnQobWFpbCkpIHtcblx0XHRcdFx0XHRjb25zdCBtYWlsRGV0YWlsc0lkID0gYXNzZXJ0Tm90TnVsbChtYWlsLm1haWxEZXRhaWxzRHJhZnQpXG5cdFx0XHRcdFx0bWFpbERldGFpbHNEcmFmdFRvRGVsZXRlLnB1c2gobWFpbERldGFpbHNJZClcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBtYWlsRGV0YWlsc0Jsb2Jcblx0XHRcdFx0XHRjb25zdCBtYWlsRGV0YWlsc0lkID0gYXNzZXJ0Tm90TnVsbChtYWlsLm1haWxEZXRhaWxzKVxuXHRcdFx0XHRcdG1haWxEZXRhaWxzQmxvYlRvRGVsZXRlLnB1c2gobWFpbERldGFpbHNJZClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRmb3IgKGxldCBbbGlzdElkLCBlbGVtZW50SWRzXSBvZiBncm91cEJ5QW5kTWFwKG1haWxEZXRhaWxzQmxvYlRvRGVsZXRlLCBsaXN0SWRQYXJ0LCBlbGVtZW50SWRQYXJ0KS5lbnRyaWVzKCkpIHtcblx0XHRcdGF3YWl0IG9mZmxpbmVTdG9yYWdlLmRlbGV0ZUluKE1haWxEZXRhaWxzQmxvYlR5cGVSZWYsIGxpc3RJZCwgZWxlbWVudElkcylcblx0XHR9XG5cdFx0Zm9yIChsZXQgW2xpc3RJZCwgZWxlbWVudElkc10gb2YgZ3JvdXBCeUFuZE1hcChtYWlsRGV0YWlsc0RyYWZ0VG9EZWxldGUsIGxpc3RJZFBhcnQsIGVsZW1lbnRJZFBhcnQpLmVudHJpZXMoKSkge1xuXHRcdFx0YXdhaXQgb2ZmbGluZVN0b3JhZ2UuZGVsZXRlSW4oTWFpbERldGFpbHNEcmFmdFR5cGVSZWYsIGxpc3RJZCwgZWxlbWVudElkcylcblx0XHR9XG5cdFx0Zm9yIChsZXQgW2xpc3RJZCwgZWxlbWVudElkc10gb2YgZ3JvdXBCeUFuZE1hcChhdHRhY2htZW50c1RvRGVsZXRlLCBsaXN0SWRQYXJ0LCBlbGVtZW50SWRQYXJ0KS5lbnRyaWVzKCkpIHtcblx0XHRcdGF3YWl0IG9mZmxpbmVTdG9yYWdlLmRlbGV0ZUluKEZpbGVUeXBlUmVmLCBsaXN0SWQsIGVsZW1lbnRJZHMpXG5cdFx0XHRhd2FpdCBvZmZsaW5lU3RvcmFnZS5kZWxldGVSYW5nZShGaWxlVHlwZVJlZiwgbGlzdElkKVxuXHRcdH1cblxuXHRcdGF3YWl0IG9mZmxpbmVTdG9yYWdlLmRlbGV0ZUluKE1haWxUeXBlUmVmLCBsaXN0SWQsIG1haWxzVG9EZWxldGUubWFwKGVsZW1lbnRJZFBhcnQpKVxuXHR9XG5cblx0LyoqXG5cdCAqIGRlbGV0ZSBhbGwgbWFpbCBzZXQgZW50cmllcyBvZiBhIG1haWwgc2V0IHRoYXQgcmVmZXJlbmNlIHNvbWUgbWFpbCB3aXRoIGEgcmVjZWl2ZWREYXRlIG9sZGVyIHRoYW5cblx0ICogY3V0b2ZmVGltZXN0YW1wLiB0aGlzIGRvZXNuJ3QgY2xlYW4gdXAgbWFpbHMgb3IgdGhlaXIgYXNzb2NpYXRlZCBkYXRhIGJlY2F1c2Ugd2UgY291bGQgYmUgYnJlYWtpbmcgdGhlXG5cdCAqIG9mZmxpbmUgbGlzdCByYW5nZSBpbnZhcmlhbnQgYnkgZGVsZXRpbmcgZGF0YSBmcm9tIHRoZSBtaWRkbGUgb2YgYSBtYWlsIHJhbmdlLiBjbGVhbmluZyB1cCBtYWlscyBpcyBkb25lXG5cdCAqIHRoZSBsZWdhY3kgd2F5IGN1cnJlbnRseSBldmVuIGZvciBtYWlsc2V0IHVzZXJzLlxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBkZWxldGVNYWlsU2V0RW50cmllcyhvZmZsaW5lU3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UsIGVudHJpZXNMaXN0SWQ6IElkLCBjdXRvZmZUaW1lc3RhbXA6IG51bWJlcikge1xuXHRcdGNvbnN0IGN1dG9mZklkID0gY29uc3RydWN0TWFpbFNldEVudHJ5SWQobmV3IERhdGUoY3V0b2ZmVGltZXN0YW1wKSwgR0VORVJBVEVEX01BWF9JRClcblx0XHRhd2FpdCBvZmZsaW5lU3RvcmFnZS5sb2NrUmFuZ2VzRGJBY2Nlc3MoZW50cmllc0xpc3RJZClcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgb2ZmbGluZVN0b3JhZ2UudXBkYXRlUmFuZ2VGb3JMaXN0QW5kRGVsZXRlT2Jzb2xldGVEYXRhKE1haWxTZXRFbnRyeVR5cGVSZWYsIGVudHJpZXNMaXN0SWQsIGN1dG9mZklkKVxuXHRcdH0gZmluYWxseSB7XG5cdFx0XHQvLyBXZSB1bmxvY2sgYWNjZXNzIHRvIHRoZSBcInJhbmdlc1wiIGRiIGhlcmUuIFdlIGxvY2sgaXQgaW4gb3JkZXIgdG8gcHJldmVudCByYWNlIGNvbmRpdGlvbnMgd2hlbiBhY2Nlc3NpbmcgdGhlIFwicmFuZ2VzXCIgZGF0YWJhc2UuXG5cdFx0XHRhd2FpdCBvZmZsaW5lU3RvcmFnZS51bmxvY2tSYW5nZXNEYkFjY2VzcyhlbnRyaWVzTGlzdElkKVxuXHRcdH1cblxuXHRcdGNvbnN0IG1haWxTZXRFbnRyaWVzVG9EZWxldGU6IElkVHVwbGVbXSA9IFtdXG5cdFx0Y29uc3QgbWFpbFNldEVudHJpZXMgPSBhd2FpdCBvZmZsaW5lU3RvcmFnZS5nZXRXaG9sZUxpc3QoTWFpbFNldEVudHJ5VHlwZVJlZiwgZW50cmllc0xpc3RJZClcblx0XHRmb3IgKGxldCBtYWlsU2V0RW50cnkgb2YgbWFpbFNldEVudHJpZXMpIHtcblx0XHRcdGlmIChmaXJzdEJpZ2dlclRoYW5TZWNvbmQoY3V0b2ZmSWQsIGdldEVsZW1lbnRJZChtYWlsU2V0RW50cnkpKSkge1xuXHRcdFx0XHRtYWlsU2V0RW50cmllc1RvRGVsZXRlLnB1c2gobWFpbFNldEVudHJ5Ll9pZClcblx0XHRcdH1cblx0XHR9XG5cdFx0YXdhaXQgb2ZmbGluZVN0b3JhZ2UuZGVsZXRlSW4oTWFpbFNldEVudHJ5VHlwZVJlZiwgZW50cmllc0xpc3RJZCwgbWFpbFNldEVudHJpZXNUb0RlbGV0ZS5tYXAoZWxlbWVudElkUGFydCkpXG5cdH1cbn1cbiIsImltcG9ydCB7IGdldERheVNoaWZ0ZWQsIGdldFN0YXJ0T2ZEYXkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcblxuZXhwb3J0IGludGVyZmFjZSBEYXRlUHJvdmlkZXIge1xuXHRnZXRTdGFydE9mRGF5U2hpZnRlZEJ5KHNoaWZ0QnlEYXlzOiBudW1iZXIpOiBEYXRlXG59XG5cbmV4cG9ydCBjbGFzcyBMb2NhbFRpbWVEYXRlUHJvdmlkZXIgaW1wbGVtZW50cyBEYXRlUHJvdmlkZXIge1xuXHRnZXRTdGFydE9mRGF5U2hpZnRlZEJ5KHNoaWZ0QnlEYXlzOiBudW1iZXIpOiBEYXRlIHtcblx0XHRyZXR1cm4gZ2V0U3RhcnRPZkRheShnZXREYXlTaGlmdGVkKG5ldyBEYXRlKCksIHNoaWZ0QnlEYXlzKSlcblx0fVxufVxuIiwiaW1wb3J0IHsgQ2FjaGVJbmZvLCBMb2dpbkZhY2FkZSwgTG9naW5MaXN0ZW5lciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL0xvZ2luRmFjYWRlLmpzXCJcbmltcG9ydCB0eXBlIHsgV29ya2VySW1wbCB9IGZyb20gXCIuL1dvcmtlckltcGwuanNcIlxuaW1wb3J0IHR5cGUgeyBJbmRleGVyIH0gZnJvbSBcIi4uL2luZGV4L0luZGV4ZXIuanNcIlxuaW1wb3J0IHR5cGUgeyBFbnRpdHlSZXN0SW50ZXJmYWNlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL3Jlc3QvRW50aXR5UmVzdENsaWVudC5qc1wiXG5pbXBvcnQgeyBFbnRpdHlSZXN0Q2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL3Jlc3QvRW50aXR5UmVzdENsaWVudC5qc1wiXG5pbXBvcnQgdHlwZSB7IFVzZXJNYW5hZ2VtZW50RmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Vc2VyTWFuYWdlbWVudEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBDYWNoZVN0b3JhZ2UsIERlZmF1bHRFbnRpdHlSZXN0Q2FjaGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvcmVzdC9EZWZhdWx0RW50aXR5UmVzdENhY2hlLmpzXCJcbmltcG9ydCB0eXBlIHsgR3JvdXBNYW5hZ2VtZW50RmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Hcm91cE1hbmFnZW1lbnRGYWNhZGUuanNcIlxuaW1wb3J0IHR5cGUgeyBNYWlsRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsRmFjYWRlLmpzXCJcbmltcG9ydCB0eXBlIHsgTWFpbEFkZHJlc3NGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L01haWxBZGRyZXNzRmFjYWRlLmpzXCJcbmltcG9ydCB0eXBlIHsgQ3VzdG9tZXJGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0N1c3RvbWVyRmFjYWRlLmpzXCJcbmltcG9ydCB0eXBlIHsgQ291bnRlckZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ291bnRlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBFdmVudEJ1c0NsaWVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9FdmVudEJ1c0NsaWVudC5qc1wiXG5pbXBvcnQge1xuXHRhc3NlcnRXb3JrZXJPck5vZGUsXG5cdGdldFdlYnNvY2tldEJhc2VVcmwsXG5cdGlzQWRtaW5DbGllbnQsXG5cdGlzQW5kcm9pZEFwcCxcblx0aXNCcm93c2VyLFxuXHRpc0lPU0FwcCxcblx0aXNPZmZsaW5lU3RvcmFnZUF2YWlsYWJsZSxcblx0aXNUZXN0LFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IENvbnN0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB0eXBlIHsgQnJvd3NlckRhdGEgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50Q29uc3RhbnRzLmpzXCJcbmltcG9ydCB0eXBlIHsgQ2FsZW5kYXJGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NhbGVuZGFyRmFjYWRlLmpzXCJcbmltcG9ydCB0eXBlIHsgU2hhcmVGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L1NoYXJlRmFjYWRlLmpzXCJcbmltcG9ydCB7IFJlc3RDbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvcmVzdC9SZXN0Q2xpZW50LmpzXCJcbmltcG9ydCB7IFN1c3BlbnNpb25IYW5kbGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL1N1c3BlbnNpb25IYW5kbGVyLmpzXCJcbmltcG9ydCB7IEVudGl0eUNsaWVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9FbnRpdHlDbGllbnQuanNcIlxuaW1wb3J0IHR5cGUgeyBHaWZ0Q2FyZEZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvR2lmdENhcmRGYWNhZGUuanNcIlxuaW1wb3J0IHR5cGUgeyBDb25maWd1cmF0aW9uRGF0YWJhc2UgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NvbmZpZ3VyYXRpb25EYXRhYmFzZS5qc1wiXG5pbXBvcnQgeyBEZXZpY2VFbmNyeXB0aW9uRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvRGV2aWNlRW5jcnlwdGlvbkZhY2FkZS5qc1wiXG5pbXBvcnQgdHlwZSB7IE5hdGl2ZUludGVyZmFjZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbmF0aXZlL2NvbW1vbi9OYXRpdmVJbnRlcmZhY2UuanNcIlxuaW1wb3J0IHsgTmF0aXZlRmlsZUFwcCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbmF0aXZlL2NvbW1vbi9GaWxlQXBwLmpzXCJcbmltcG9ydCB7IEFlc0FwcCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbmF0aXZlL3dvcmtlci9BZXNBcHAuanNcIlxuaW1wb3J0IHR5cGUgeyBSc2FJbXBsZW1lbnRhdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9jcnlwdG8vUnNhSW1wbGVtZW50YXRpb24uanNcIlxuaW1wb3J0IHsgY3JlYXRlUnNhSW1wbGVtZW50YXRpb24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvY3J5cHRvL1JzYUltcGxlbWVudGF0aW9uLmpzXCJcbmltcG9ydCB7IENyeXB0b0ZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9jcnlwdG8vQ3J5cHRvRmFjYWRlLmpzXCJcbmltcG9ydCB7IEluc3RhbmNlTWFwcGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2NyeXB0by9JbnN0YW5jZU1hcHBlci5qc1wiXG5pbXBvcnQgeyBBZG1pbkNsaWVudER1bW15RW50aXR5UmVzdENhY2hlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL3Jlc3QvQWRtaW5DbGllbnREdW1teUVudGl0eVJlc3RDYWNoZS5qc1wiXG5pbXBvcnQgeyBTbGVlcERldGVjdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL3V0aWxzL1NsZWVwRGV0ZWN0b3IuanNcIlxuaW1wb3J0IHsgU2NoZWR1bGVySW1wbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9TY2hlZHVsZXIuanNcIlxuaW1wb3J0IHsgTm9ab25lRGF0ZVByb3ZpZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL05vWm9uZURhdGVQcm92aWRlci5qc1wiXG5pbXBvcnQgeyBMYXRlSW5pdGlhbGl6ZWRDYWNoZVN0b3JhZ2VJbXBsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL3Jlc3QvQ2FjaGVTdG9yYWdlUHJveHkuanNcIlxuaW1wb3J0IHsgSVNlcnZpY2VFeGVjdXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9TZXJ2aWNlUmVxdWVzdC5qc1wiXG5pbXBvcnQgeyBTZXJ2aWNlRXhlY3V0b3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvcmVzdC9TZXJ2aWNlRXhlY3V0b3IuanNcIlxuaW1wb3J0IHR5cGUgeyBCb29raW5nRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Cb29raW5nRmFjYWRlLmpzXCJcbmltcG9ydCB0eXBlIHsgQmxvYkZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQmxvYkZhY2FkZS5qc1wiXG5pbXBvcnQgeyBVc2VyRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvVXNlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lU3RvcmFnZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL09mZmxpbmVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IE9GRkxJTkVfU1RPUkFHRV9NSUdSQVRJT05TLCBPZmZsaW5lU3RvcmFnZU1pZ3JhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvT2ZmbGluZVN0b3JhZ2VNaWdyYXRvci5qc1wiXG5pbXBvcnQgeyBtb2RlbEluZm9zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudGl0eUZ1bmN0aW9ucy5qc1wiXG5pbXBvcnQgeyBGaWxlRmFjYWRlU2VuZERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0ZpbGVGYWNhZGVTZW5kRGlzcGF0Y2hlci5qc1wiXG5pbXBvcnQgeyBOYXRpdmVQdXNoRmFjYWRlU2VuZERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL05hdGl2ZVB1c2hGYWNhZGVTZW5kRGlzcGF0Y2hlci5qc1wiXG5pbXBvcnQgeyBOYXRpdmVDcnlwdG9GYWNhZGVTZW5kRGlzcGF0Y2hlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTmF0aXZlQ3J5cHRvRmFjYWRlU2VuZERpc3BhdGNoZXIuanNcIlxuaW1wb3J0IHsgcmFuZG9tIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS1jcnlwdG9cIlxuaW1wb3J0IHsgRXhwb3J0RmFjYWRlU2VuZERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0V4cG9ydEZhY2FkZVNlbmREaXNwYXRjaGVyLmpzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGRlbGF5LCBsYXp5QXN5bmMsIGxhenlNZW1vaXplZCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgSW50ZXJXaW5kb3dFdmVudEZhY2FkZVNlbmREaXNwYXRjaGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9JbnRlcldpbmRvd0V2ZW50RmFjYWRlU2VuZERpc3BhdGNoZXIuanNcIlxuaW1wb3J0IHsgU3FsQ2lwaGVyRmFjYWRlU2VuZERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1NxbENpcGhlckZhY2FkZVNlbmREaXNwYXRjaGVyLmpzXCJcbmltcG9ydCB7IEVudHJvcHlGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9FbnRyb3B5RmFjYWRlLmpzXCJcbmltcG9ydCB7IEJsb2JBY2Nlc3NUb2tlbkZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL0Jsb2JBY2Nlc3NUb2tlbkZhY2FkZS5qc1wiXG5pbXBvcnQgeyBPd25lckVuY1Nlc3Npb25LZXlzVXBkYXRlUXVldWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvY3J5cHRvL093bmVyRW5jU2Vzc2lvbktleXNVcGRhdGVRdWV1ZS5qc1wiXG5pbXBvcnQgeyBFdmVudEJ1c0V2ZW50Q29vcmRpbmF0b3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvRXZlbnRCdXNFdmVudENvb3JkaW5hdG9yLmpzXCJcbmltcG9ydCB7IFdvcmtlckZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL1dvcmtlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBTcWxDaXBoZXJGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1NxbENpcGhlckZhY2FkZS5qc1wiXG5pbXBvcnQgdHlwZSB7IFNlYXJjaEZhY2FkZSB9IGZyb20gXCIuLi9pbmRleC9TZWFyY2hGYWNhZGUuanNcIlxuaW1wb3J0IHsgQ2hhbGxlbmdlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IExvZ2luRmFpbFJlYXNvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vUGFnZUNvbnRleHRMb2dpbkxpc3RlbmVyLmpzXCJcbmltcG9ydCB7IENvbm5lY3Rpb25FcnJvciwgU2VydmljZVVuYXZhaWxhYmxlRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yLmpzXCJcbmltcG9ydCB7IFNlc3Npb25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1Nlc3Npb25UeXBlLmpzXCJcbmltcG9ydCB7IEFyZ29uMmlkRmFjYWRlLCBOYXRpdmVBcmdvbjJpZEZhY2FkZSwgV0FTTUFyZ29uMmlkRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvQXJnb24yaWRGYWNhZGUuanNcIlxuaW1wb3J0IHsgRG9tYWluQ29uZmlnUHJvdmlkZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRG9tYWluQ29uZmlnUHJvdmlkZXIuanNcIlxuaW1wb3J0IHsgS3liZXJGYWNhZGUsIE5hdGl2ZUt5YmVyRmFjYWRlLCBXQVNNS3liZXJGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9LeWJlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBQUUZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL1BRRmFjYWRlLmpzXCJcbmltcG9ydCB7IFBkZldyaXRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9wZGYvUGRmV3JpdGVyLmpzXCJcbmltcG9ydCB7IENvbnRhY3RGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NvbnRhY3RGYWNhZGUuanNcIlxuaW1wb3J0IHsgS2V5TG9hZGVyRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvS2V5TG9hZGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IEtleVJvdGF0aW9uRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvS2V5Um90YXRpb25GYWNhZGUuanNcIlxuaW1wb3J0IHsgS2V5Q2FjaGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9LZXlDYWNoZS5qc1wiXG5pbXBvcnQgeyBDcnlwdG9XcmFwcGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2NyeXB0by9DcnlwdG9XcmFwcGVyLmpzXCJcbmltcG9ydCB7IFJlY292ZXJDb2RlRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9SZWNvdmVyQ29kZUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBDYWNoZU1hbmFnZW1lbnRGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NhY2hlTWFuYWdlbWVudEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBNYWlsT2ZmbGluZUNsZWFuZXIgfSBmcm9tIFwiLi4vb2ZmbGluZS9NYWlsT2ZmbGluZUNsZWFuZXIuanNcIlxuaW1wb3J0IHR5cGUgeyBRdWV1ZWRCYXRjaCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9FdmVudFF1ZXVlLmpzXCJcbmltcG9ydCB7IENyZWRlbnRpYWxzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL2NyZWRlbnRpYWxzL0NyZWRlbnRpYWxzLmpzXCJcbmltcG9ydCB7IEFzeW1tZXRyaWNDcnlwdG9GYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvY3J5cHRvL0FzeW1tZXRyaWNDcnlwdG9GYWNhZGUuanNcIlxuaW1wb3J0IHsgRXBoZW1lcmFsQ2FjaGVTdG9yYWdlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL3Jlc3QvRXBoZW1lcmFsQ2FjaGVTdG9yYWdlLmpzXCJcbmltcG9ydCB7IExvY2FsVGltZURhdGVQcm92aWRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9EYXRlUHJvdmlkZXIuanNcIlxuaW1wb3J0IHsgQnVsa01haWxMb2FkZXIgfSBmcm9tIFwiLi4vaW5kZXgvQnVsa01haWxMb2FkZXIuanNcIlxuaW1wb3J0IHR5cGUgeyBNYWlsRXhwb3J0RmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsRXhwb3J0RmFjYWRlXCJcblxuYXNzZXJ0V29ya2VyT3JOb2RlKClcblxuZXhwb3J0IHR5cGUgV29ya2VyTG9jYXRvclR5cGUgPSB7XG5cdC8vIG5ldHdvcmsgJiBlbmNyeXB0aW9uXG5cdHJlc3RDbGllbnQ6IFJlc3RDbGllbnRcblx0c2VydmljZUV4ZWN1dG9yOiBJU2VydmljZUV4ZWN1dG9yXG5cdGNyeXB0b1dyYXBwZXI6IENyeXB0b1dyYXBwZXJcblx0YXN5bW1ldHJpY0NyeXB0bzogQXN5bW1ldHJpY0NyeXB0b0ZhY2FkZVxuXHRjcnlwdG86IENyeXB0b0ZhY2FkZVxuXHRpbnN0YW5jZU1hcHBlcjogSW5zdGFuY2VNYXBwZXJcblx0Y2FjaGVTdG9yYWdlOiBDYWNoZVN0b3JhZ2Vcblx0Y2FjaGU6IEVudGl0eVJlc3RJbnRlcmZhY2Vcblx0Y2FjaGluZ0VudGl0eUNsaWVudDogRW50aXR5Q2xpZW50XG5cdGV2ZW50QnVzQ2xpZW50OiBFdmVudEJ1c0NsaWVudFxuXHRyc2E6IFJzYUltcGxlbWVudGF0aW9uXG5cdGt5YmVyRmFjYWRlOiBLeWJlckZhY2FkZVxuXHRwcUZhY2FkZTogUFFGYWNhZGVcblx0ZW50cm9weUZhY2FkZTogRW50cm9weUZhY2FkZVxuXHRibG9iQWNjZXNzVG9rZW46IEJsb2JBY2Nlc3NUb2tlbkZhY2FkZVxuXHRrZXlDYWNoZTogS2V5Q2FjaGVcblx0a2V5TG9hZGVyOiBLZXlMb2FkZXJGYWNhZGVcblx0a2V5Um90YXRpb246IEtleVJvdGF0aW9uRmFjYWRlXG5cblx0Ly8gbG9naW5cblx0dXNlcjogVXNlckZhY2FkZVxuXHRsb2dpbjogTG9naW5GYWNhZGVcblxuXHQvLyBkb21haW5zXG5cdGJsb2I6IGxhenlBc3luYzxCbG9iRmFjYWRlPlxuXHRtYWlsOiBsYXp5QXN5bmM8TWFpbEZhY2FkZT5cblx0Y2FsZW5kYXI6IGxhenlBc3luYzxDYWxlbmRhckZhY2FkZT5cblx0Y291bnRlcnM6IGxhenlBc3luYzxDb3VudGVyRmFjYWRlPlxuXHRDb25zdDogUmVjb3JkPHN0cmluZywgYW55PlxuXG5cdC8vIHNlYXJjaCAmIGluZGV4aW5nXG5cdGluZGV4ZXI6IGxhenlBc3luYzxJbmRleGVyPlxuXHRzZWFyY2g6IGxhenlBc3luYzxTZWFyY2hGYWNhZGU+XG5cblx0Ly8gbWFuYWdlbWVudCBmYWNhZGVzXG5cdGdyb3VwTWFuYWdlbWVudDogbGF6eUFzeW5jPEdyb3VwTWFuYWdlbWVudEZhY2FkZT5cblx0dXNlck1hbmFnZW1lbnQ6IGxhenlBc3luYzxVc2VyTWFuYWdlbWVudEZhY2FkZT5cblx0cmVjb3ZlckNvZGU6IGxhenlBc3luYzxSZWNvdmVyQ29kZUZhY2FkZT5cblx0Y3VzdG9tZXI6IGxhenlBc3luYzxDdXN0b21lckZhY2FkZT5cblx0Z2lmdENhcmRzOiBsYXp5QXN5bmM8R2lmdENhcmRGYWNhZGU+XG5cdG1haWxBZGRyZXNzOiBsYXp5QXN5bmM8TWFpbEFkZHJlc3NGYWNhZGU+XG5cdGJvb2tpbmc6IGxhenlBc3luYzxCb29raW5nRmFjYWRlPlxuXHRzaGFyZTogbGF6eUFzeW5jPFNoYXJlRmFjYWRlPlxuXHRjYWNoZU1hbmFnZW1lbnQ6IGxhenlBc3luYzxDYWNoZU1hbmFnZW1lbnRGYWNhZGU+XG5cblx0Ly8gbWlzYyAmIG5hdGl2ZVxuXHRjb25maWdGYWNhZGU6IGxhenlBc3luYzxDb25maWd1cmF0aW9uRGF0YWJhc2U+XG5cdGRldmljZUVuY3J5cHRpb25GYWNhZGU6IERldmljZUVuY3J5cHRpb25GYWNhZGVcblx0bmF0aXZlOiBOYXRpdmVJbnRlcmZhY2Vcblx0d29ya2VyRmFjYWRlOiBXb3JrZXJGYWNhZGVcblx0c3FsQ2lwaGVyRmFjYWRlOiBTcWxDaXBoZXJGYWNhZGVcblx0cGRmV3JpdGVyOiBsYXp5QXN5bmM8UGRmV3JpdGVyPlxuXHRidWxrTWFpbExvYWRlcjogbGF6eUFzeW5jPEJ1bGtNYWlsTG9hZGVyPlxuXHRtYWlsRXhwb3J0RmFjYWRlOiBsYXp5QXN5bmM8TWFpbEV4cG9ydEZhY2FkZT5cblxuXHQvLyB1c2VkIHRvIGNhY2hlIGJldHdlZW4gcmVzZXRzXG5cdF93b3JrZXI6IFdvcmtlckltcGxcblx0X2Jyb3dzZXJEYXRhOiBCcm93c2VyRGF0YVxuXG5cdC8vY29udGFjdFxuXHRjb250YWN0RmFjYWRlOiBsYXp5QXN5bmM8Q29udGFjdEZhY2FkZT5cbn1cbmV4cG9ydCBjb25zdCBsb2NhdG9yOiBXb3JrZXJMb2NhdG9yVHlwZSA9IHt9IGFzIGFueVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdExvY2F0b3Iod29ya2VyOiBXb3JrZXJJbXBsLCBicm93c2VyRGF0YTogQnJvd3NlckRhdGEpIHtcblx0bG9jYXRvci5fd29ya2VyID0gd29ya2VyXG5cdGxvY2F0b3IuX2Jyb3dzZXJEYXRhID0gYnJvd3NlckRhdGFcblx0bG9jYXRvci5rZXlDYWNoZSA9IG5ldyBLZXlDYWNoZSgpXG5cdGxvY2F0b3IuY3J5cHRvV3JhcHBlciA9IG5ldyBDcnlwdG9XcmFwcGVyKClcblx0bG9jYXRvci51c2VyID0gbmV3IFVzZXJGYWNhZGUobG9jYXRvci5rZXlDYWNoZSwgbG9jYXRvci5jcnlwdG9XcmFwcGVyKVxuXHRsb2NhdG9yLndvcmtlckZhY2FkZSA9IG5ldyBXb3JrZXJGYWNhZGUoKVxuXHRjb25zdCBkYXRlUHJvdmlkZXIgPSBuZXcgTm9ab25lRGF0ZVByb3ZpZGVyKClcblxuXHRjb25zdCBtYWluSW50ZXJmYWNlID0gd29ya2VyLmdldE1haW5JbnRlcmZhY2UoKVxuXG5cdGNvbnN0IHN1c3BlbnNpb25IYW5kbGVyID0gbmV3IFN1c3BlbnNpb25IYW5kbGVyKG1haW5JbnRlcmZhY2UuaW5mb01lc3NhZ2VIYW5kbGVyLCBzZWxmKVxuXHRsb2NhdG9yLmluc3RhbmNlTWFwcGVyID0gbmV3IEluc3RhbmNlTWFwcGVyKClcblx0bG9jYXRvci5yc2EgPSBhd2FpdCBjcmVhdGVSc2FJbXBsZW1lbnRhdGlvbih3b3JrZXIpXG5cblx0Y29uc3QgZG9tYWluQ29uZmlnID0gbmV3IERvbWFpbkNvbmZpZ1Byb3ZpZGVyKCkuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpXG5cblx0bG9jYXRvci5yZXN0Q2xpZW50ID0gbmV3IFJlc3RDbGllbnQoc3VzcGVuc2lvbkhhbmRsZXIsIGRvbWFpbkNvbmZpZylcblx0bG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IgPSBuZXcgU2VydmljZUV4ZWN1dG9yKGxvY2F0b3IucmVzdENsaWVudCwgbG9jYXRvci51c2VyLCBsb2NhdG9yLmluc3RhbmNlTWFwcGVyLCAoKSA9PiBsb2NhdG9yLmNyeXB0bylcblx0bG9jYXRvci5lbnRyb3B5RmFjYWRlID0gbmV3IEVudHJvcHlGYWNhZGUobG9jYXRvci51c2VyLCBsb2NhdG9yLnNlcnZpY2VFeGVjdXRvciwgcmFuZG9tLCAoKSA9PiBsb2NhdG9yLmtleUxvYWRlcilcblx0bG9jYXRvci5ibG9iQWNjZXNzVG9rZW4gPSBuZXcgQmxvYkFjY2Vzc1Rva2VuRmFjYWRlKGxvY2F0b3Iuc2VydmljZUV4ZWN1dG9yLCBsb2NhdG9yLnVzZXIsIGRhdGVQcm92aWRlcilcblx0Y29uc3QgZW50aXR5UmVzdENsaWVudCA9IG5ldyBFbnRpdHlSZXN0Q2xpZW50KGxvY2F0b3IudXNlciwgbG9jYXRvci5yZXN0Q2xpZW50LCAoKSA9PiBsb2NhdG9yLmNyeXB0bywgbG9jYXRvci5pbnN0YW5jZU1hcHBlciwgbG9jYXRvci5ibG9iQWNjZXNzVG9rZW4pXG5cblx0bG9jYXRvci5uYXRpdmUgPSB3b3JrZXJcblx0bG9jYXRvci5ib29raW5nID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IEJvb2tpbmdGYWNhZGUgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Cb29raW5nRmFjYWRlLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBCb29raW5nRmFjYWRlKGxvY2F0b3Iuc2VydmljZUV4ZWN1dG9yKVxuXHR9KVxuXG5cdGxldCBvZmZsaW5lU3RvcmFnZVByb3ZpZGVyXG5cdGlmIChpc09mZmxpbmVTdG9yYWdlQXZhaWxhYmxlKCkgJiYgIWlzQWRtaW5DbGllbnQoKSkge1xuXHRcdGxvY2F0b3Iuc3FsQ2lwaGVyRmFjYWRlID0gbmV3IFNxbENpcGhlckZhY2FkZVNlbmREaXNwYXRjaGVyKGxvY2F0b3IubmF0aXZlKVxuXHRcdG9mZmxpbmVTdG9yYWdlUHJvdmlkZXIgPSBhc3luYyAoKSA9PiB7XG5cdFx0XHRyZXR1cm4gbmV3IE9mZmxpbmVTdG9yYWdlKFxuXHRcdFx0XHRsb2NhdG9yLnNxbENpcGhlckZhY2FkZSxcblx0XHRcdFx0bmV3IEludGVyV2luZG93RXZlbnRGYWNhZGVTZW5kRGlzcGF0Y2hlcih3b3JrZXIpLFxuXHRcdFx0XHRkYXRlUHJvdmlkZXIsXG5cdFx0XHRcdG5ldyBPZmZsaW5lU3RvcmFnZU1pZ3JhdG9yKE9GRkxJTkVfU1RPUkFHRV9NSUdSQVRJT05TLCBtb2RlbEluZm9zKSxcblx0XHRcdFx0bmV3IE1haWxPZmZsaW5lQ2xlYW5lcigpLFxuXHRcdFx0KVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRvZmZsaW5lU3RvcmFnZVByb3ZpZGVyID0gYXN5bmMgKCkgPT4gbnVsbFxuXHR9XG5cdGxvY2F0b3IucGRmV3JpdGVyID0gYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgUGRmV3JpdGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9wZGYvUGRmV3JpdGVyLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBQZGZXcml0ZXIobmV3IFRleHRFbmNvZGVyKCksIHVuZGVmaW5lZClcblx0fVxuXG5cdGNvbnN0IG1heWJlVW5pbml0aWFsaXplZFN0b3JhZ2UgPSBuZXcgTGF0ZUluaXRpYWxpemVkQ2FjaGVTdG9yYWdlSW1wbChhc3luYyAoZXJyb3I6IEVycm9yKSA9PiB7XG5cdFx0YXdhaXQgd29ya2VyLnNlbmRFcnJvcihlcnJvcilcblx0fSwgb2ZmbGluZVN0b3JhZ2VQcm92aWRlcilcblxuXHRsb2NhdG9yLmNhY2hlU3RvcmFnZSA9IG1heWJlVW5pbml0aWFsaXplZFN0b3JhZ2VcblxuXHRjb25zdCBmaWxlQXBwID0gbmV3IE5hdGl2ZUZpbGVBcHAobmV3IEZpbGVGYWNhZGVTZW5kRGlzcGF0Y2hlcih3b3JrZXIpLCBuZXcgRXhwb3J0RmFjYWRlU2VuZERpc3BhdGNoZXIod29ya2VyKSlcblxuXHQvLyBXZSBkb24ndCB3YW50IHRvIGNhY2hlIHdpdGhpbiB0aGUgYWRtaW4gY2xpZW50XG5cdGxldCBjYWNoZTogRGVmYXVsdEVudGl0eVJlc3RDYWNoZSB8IG51bGwgPSBudWxsXG5cdGlmICghaXNBZG1pbkNsaWVudCgpKSB7XG5cdFx0Y2FjaGUgPSBuZXcgRGVmYXVsdEVudGl0eVJlc3RDYWNoZShlbnRpdHlSZXN0Q2xpZW50LCBtYXliZVVuaW5pdGlhbGl6ZWRTdG9yYWdlKVxuXHR9XG5cblx0bG9jYXRvci5jYWNoZSA9IGNhY2hlID8/IGVudGl0eVJlc3RDbGllbnRcblxuXHRsb2NhdG9yLmNhY2hpbmdFbnRpdHlDbGllbnQgPSBuZXcgRW50aXR5Q2xpZW50KGxvY2F0b3IuY2FjaGUpXG5cdGNvbnN0IG5vbkNhY2hpbmdFbnRpdHlDbGllbnQgPSBuZXcgRW50aXR5Q2xpZW50KGVudGl0eVJlc3RDbGllbnQpXG5cblx0bG9jYXRvci5jYWNoZU1hbmFnZW1lbnQgPSBsYXp5TWVtb2l6ZWQoYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgQ2FjaGVNYW5hZ2VtZW50RmFjYWRlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ2FjaGVNYW5hZ2VtZW50RmFjYWRlLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBDYWNoZU1hbmFnZW1lbnRGYWNhZGUobG9jYXRvci51c2VyLCBsb2NhdG9yLmNhY2hpbmdFbnRpdHlDbGllbnQsIGFzc2VydE5vdE51bGwoY2FjaGUpKVxuXHR9KVxuXG5cdC8qKiBTbGlnaHRseSBhbm5veWluZyB0d28tc3RhZ2UgaW5pdDogZmlyc3QgaW1wb3J0IGJ1bGsgbG9hZGVyLCB0aGVuIHdlIGNhbiBoYXZlIGEgZmFjdG9yeSBmb3IgaXQuICovXG5cdGNvbnN0IHByZXBhcmVCdWxrTG9hZGVyRmFjdG9yeSA9IGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IEJ1bGtNYWlsTG9hZGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9pbmRleC9CdWxrTWFpbExvYWRlci5qc1wiKVxuXHRcdHJldHVybiAoKSA9PiB7XG5cdFx0XHQvLyBPbiBwbGF0Zm9ybXMgd2l0aCBvZmZsaW5lIGNhY2hlIHdlIGp1c3QgdXNlIGNhY2hlIGFzIHdlIGFyZSBub3QgYm91bmRlZCBieSBtZW1vcnkuXG5cdFx0XHRpZiAoaXNPZmZsaW5lU3RvcmFnZUF2YWlsYWJsZSgpKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgQnVsa01haWxMb2FkZXIobG9jYXRvci5jYWNoaW5nRW50aXR5Q2xpZW50LCBsb2NhdG9yLmNhY2hpbmdFbnRpdHlDbGllbnQsIG51bGwpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBPbiBwbGF0Zm9ybXMgd2l0aG91dCBvZmZsaW5lIGNhY2hlIHdlIHVzZSBuZXcgZXBoZW1lcmFsIGNhY2hlIHN0b3JhZ2UgZm9yIG1haWxzIG9ubHkgYW5kIHVuY2FjaGVkIHN0b3JhZ2UgZm9yIHRoZSByZXN0XG5cdFx0XHRcdGNvbnN0IGNhY2hlU3RvcmFnZSA9IG5ldyBFcGhlbWVyYWxDYWNoZVN0b3JhZ2UoKVxuXHRcdFx0XHRyZXR1cm4gbmV3IEJ1bGtNYWlsTG9hZGVyKFxuXHRcdFx0XHRcdG5ldyBFbnRpdHlDbGllbnQobmV3IERlZmF1bHRFbnRpdHlSZXN0Q2FjaGUoZW50aXR5UmVzdENsaWVudCwgY2FjaGVTdG9yYWdlKSksXG5cdFx0XHRcdFx0bmV3IEVudGl0eUNsaWVudChlbnRpdHlSZXN0Q2xpZW50KSxcblx0XHRcdFx0XHRjYWNoZVN0b3JhZ2UsXG5cdFx0XHRcdClcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0bG9jYXRvci5idWxrTWFpbExvYWRlciA9IGFzeW5jICgpID0+IHtcblx0XHRjb25zdCBmYWN0b3J5ID0gYXdhaXQgcHJlcGFyZUJ1bGtMb2FkZXJGYWN0b3J5KClcblx0XHRyZXR1cm4gZmFjdG9yeSgpXG5cdH1cblxuXHRsb2NhdG9yLmluZGV4ZXIgPSBsYXp5TWVtb2l6ZWQoYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgSW5kZXhlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vaW5kZXgvSW5kZXhlci5qc1wiKVxuXHRcdGNvbnN0IHsgTWFpbEluZGV4ZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2luZGV4L01haWxJbmRleGVyLmpzXCIpXG5cdFx0Y29uc3QgbWFpbEZhY2FkZSA9IGF3YWl0IGxvY2F0b3IubWFpbCgpXG5cdFx0Y29uc3QgYnVsa0xvYWRlckZhY3RvcnkgPSBhd2FpdCBwcmVwYXJlQnVsa0xvYWRlckZhY3RvcnkoKVxuXHRcdHJldHVybiBuZXcgSW5kZXhlcihlbnRpdHlSZXN0Q2xpZW50LCBtYWluSW50ZXJmYWNlLmluZm9NZXNzYWdlSGFuZGxlciwgYnJvd3NlckRhdGEsIGxvY2F0b3IuY2FjaGUgYXMgRGVmYXVsdEVudGl0eVJlc3RDYWNoZSwgKGNvcmUsIGRiKSA9PiB7XG5cdFx0XHRjb25zdCBkYXRlUHJvdmlkZXIgPSBuZXcgTG9jYWxUaW1lRGF0ZVByb3ZpZGVyKClcblx0XHRcdHJldHVybiBuZXcgTWFpbEluZGV4ZXIoY29yZSwgZGIsIG1haW5JbnRlcmZhY2UuaW5mb01lc3NhZ2VIYW5kbGVyLCBidWxrTG9hZGVyRmFjdG9yeSwgbG9jYXRvci5jYWNoaW5nRW50aXR5Q2xpZW50LCBkYXRlUHJvdmlkZXIsIG1haWxGYWNhZGUpXG5cdFx0fSlcblx0fSlcblxuXHRpZiAoaXNJT1NBcHAoKSB8fCBpc0FuZHJvaWRBcHAoKSkge1xuXHRcdGxvY2F0b3Iua3liZXJGYWNhZGUgPSBuZXcgTmF0aXZlS3liZXJGYWNhZGUobmV3IE5hdGl2ZUNyeXB0b0ZhY2FkZVNlbmREaXNwYXRjaGVyKHdvcmtlcikpXG5cdH0gZWxzZSB7XG5cdFx0bG9jYXRvci5reWJlckZhY2FkZSA9IG5ldyBXQVNNS3liZXJGYWNhZGUoKVxuXHR9XG5cblx0bG9jYXRvci5wcUZhY2FkZSA9IG5ldyBQUUZhY2FkZShsb2NhdG9yLmt5YmVyRmFjYWRlKVxuXG5cdGxvY2F0b3Iua2V5TG9hZGVyID0gbmV3IEtleUxvYWRlckZhY2FkZShsb2NhdG9yLmtleUNhY2hlLCBsb2NhdG9yLnVzZXIsIGxvY2F0b3IuY2FjaGluZ0VudGl0eUNsaWVudCwgbG9jYXRvci5jYWNoZU1hbmFnZW1lbnQpXG5cblx0bG9jYXRvci5hc3ltbWV0cmljQ3J5cHRvID0gbmV3IEFzeW1tZXRyaWNDcnlwdG9GYWNhZGUobG9jYXRvci5yc2EsIGxvY2F0b3IucHFGYWNhZGUsIGxvY2F0b3Iua2V5TG9hZGVyLCBsb2NhdG9yLmNyeXB0b1dyYXBwZXIsIGxvY2F0b3Iuc2VydmljZUV4ZWN1dG9yKVxuXG5cdGxvY2F0b3IuY3J5cHRvID0gbmV3IENyeXB0b0ZhY2FkZShcblx0XHRsb2NhdG9yLnVzZXIsXG5cdFx0bG9jYXRvci5jYWNoaW5nRW50aXR5Q2xpZW50LFxuXHRcdGxvY2F0b3IucmVzdENsaWVudCxcblx0XHRsb2NhdG9yLnNlcnZpY2VFeGVjdXRvcixcblx0XHRsb2NhdG9yLmluc3RhbmNlTWFwcGVyLFxuXHRcdG5ldyBPd25lckVuY1Nlc3Npb25LZXlzVXBkYXRlUXVldWUobG9jYXRvci51c2VyLCBsb2NhdG9yLnNlcnZpY2VFeGVjdXRvciksXG5cdFx0Y2FjaGUsXG5cdFx0bG9jYXRvci5rZXlMb2FkZXIsXG5cdFx0bG9jYXRvci5hc3ltbWV0cmljQ3J5cHRvLFxuXHQpXG5cblx0bG9jYXRvci5yZWNvdmVyQ29kZSA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBSZWNvdmVyQ29kZUZhY2FkZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L1JlY292ZXJDb2RlRmFjYWRlLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBSZWNvdmVyQ29kZUZhY2FkZShsb2NhdG9yLnVzZXIsIGxvY2F0b3IuY2FjaGluZ0VudGl0eUNsaWVudCwgbG9jYXRvci5sb2dpbiwgbG9jYXRvci5rZXlMb2FkZXIpXG5cdH0pXG5cdGxvY2F0b3Iuc2hhcmUgPSBsYXp5TWVtb2l6ZWQoYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgU2hhcmVGYWNhZGUgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9TaGFyZUZhY2FkZS5qc1wiKVxuXHRcdHJldHVybiBuZXcgU2hhcmVGYWNhZGUobG9jYXRvci51c2VyLCBsb2NhdG9yLmNyeXB0bywgbG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IsIGxvY2F0b3IuY2FjaGluZ0VudGl0eUNsaWVudCwgbG9jYXRvci5rZXlMb2FkZXIpXG5cdH0pXG5cdGxvY2F0b3IuY291bnRlcnMgPSBsYXp5TWVtb2l6ZWQoYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgQ291bnRlckZhY2FkZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NvdW50ZXJGYWNhZGUuanNcIilcblx0XHRyZXR1cm4gbmV3IENvdW50ZXJGYWNhZGUobG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IpXG5cdH0pXG5cdGxvY2F0b3IuZ3JvdXBNYW5hZ2VtZW50ID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IEdyb3VwTWFuYWdlbWVudEZhY2FkZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0dyb3VwTWFuYWdlbWVudEZhY2FkZS5qc1wiKVxuXHRcdHJldHVybiBuZXcgR3JvdXBNYW5hZ2VtZW50RmFjYWRlKFxuXHRcdFx0bG9jYXRvci51c2VyLFxuXHRcdFx0YXdhaXQgbG9jYXRvci5jb3VudGVycygpLFxuXHRcdFx0bG9jYXRvci5jYWNoaW5nRW50aXR5Q2xpZW50LFxuXHRcdFx0bG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IsXG5cdFx0XHRsb2NhdG9yLnBxRmFjYWRlLFxuXHRcdFx0bG9jYXRvci5rZXlMb2FkZXIsXG5cdFx0XHRhd2FpdCBsb2NhdG9yLmNhY2hlTWFuYWdlbWVudCgpLFxuXHRcdFx0bG9jYXRvci5hc3ltbWV0cmljQ3J5cHRvLFxuXHRcdFx0bG9jYXRvci5jcnlwdG9XcmFwcGVyLFxuXHRcdClcblx0fSlcblx0bG9jYXRvci5rZXlSb3RhdGlvbiA9IG5ldyBLZXlSb3RhdGlvbkZhY2FkZShcblx0XHRsb2NhdG9yLmNhY2hpbmdFbnRpdHlDbGllbnQsXG5cdFx0bG9jYXRvci5rZXlMb2FkZXIsXG5cdFx0bG9jYXRvci5wcUZhY2FkZSxcblx0XHRsb2NhdG9yLnNlcnZpY2VFeGVjdXRvcixcblx0XHRsb2NhdG9yLmNyeXB0b1dyYXBwZXIsXG5cdFx0bG9jYXRvci5yZWNvdmVyQ29kZSxcblx0XHRsb2NhdG9yLnVzZXIsXG5cdFx0bG9jYXRvci5jcnlwdG8sXG5cdFx0bG9jYXRvci5zaGFyZSxcblx0XHRsb2NhdG9yLmdyb3VwTWFuYWdlbWVudCxcblx0XHRsb2NhdG9yLmFzeW1tZXRyaWNDcnlwdG8sXG5cdClcblxuXHRjb25zdCBsb2dpbkxpc3RlbmVyOiBMb2dpbkxpc3RlbmVyID0ge1xuXHRcdG9uRnVsbExvZ2luU3VjY2VzcyhzZXNzaW9uVHlwZTogU2Vzc2lvblR5cGUsIGNhY2hlSW5mbzogQ2FjaGVJbmZvLCBjcmVkZW50aWFsczogQ3JlZGVudGlhbHMpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRcdGlmICghaXNUZXN0KCkgJiYgc2Vzc2lvblR5cGUgIT09IFNlc3Npb25UeXBlLlRlbXBvcmFyeSAmJiAhaXNBZG1pbkNsaWVudCgpKSB7XG5cdFx0XHRcdC8vIGluZGV4IG5ldyBpdGVtcyBpbiBiYWNrZ3JvdW5kXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiaW5pdEluZGV4ZXIgYWZ0ZXIgbG9nIGluXCIpXG5cblx0XHRcdFx0aW5pdEluZGV4ZXIod29ya2VyLCBjYWNoZUluZm8sIGxvY2F0b3Iua2V5TG9hZGVyKVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbWFpbkludGVyZmFjZS5sb2dpbkxpc3RlbmVyLm9uRnVsbExvZ2luU3VjY2VzcyhzZXNzaW9uVHlwZSwgY2FjaGVJbmZvLCBjcmVkZW50aWFscylcblx0XHR9LFxuXG5cdFx0b25Mb2dpbkZhaWx1cmUocmVhc29uOiBMb2dpbkZhaWxSZWFzb24pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRcdHJldHVybiBtYWluSW50ZXJmYWNlLmxvZ2luTGlzdGVuZXIub25Mb2dpbkZhaWx1cmUocmVhc29uKVxuXHRcdH0sXG5cblx0XHRvblNlY29uZEZhY3RvckNoYWxsZW5nZShzZXNzaW9uSWQ6IElkVHVwbGUsIGNoYWxsZW5nZXM6IFJlYWRvbmx5QXJyYXk8Q2hhbGxlbmdlPiwgbWFpbEFkZHJlc3M6IHN0cmluZyB8IG51bGwpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRcdHJldHVybiBtYWluSW50ZXJmYWNlLmxvZ2luTGlzdGVuZXIub25TZWNvbmRGYWN0b3JDaGFsbGVuZ2Uoc2Vzc2lvbklkLCBjaGFsbGVuZ2VzLCBtYWlsQWRkcmVzcylcblx0XHR9LFxuXHR9XG5cblx0bGV0IGFyZ29uMmlkRmFjYWRlOiBBcmdvbjJpZEZhY2FkZVxuXHRpZiAoIWlzQnJvd3NlcigpKSB7XG5cdFx0YXJnb24yaWRGYWNhZGUgPSBuZXcgTmF0aXZlQXJnb24yaWRGYWNhZGUobmV3IE5hdGl2ZUNyeXB0b0ZhY2FkZVNlbmREaXNwYXRjaGVyKHdvcmtlcikpXG5cdH0gZWxzZSB7XG5cdFx0YXJnb24yaWRGYWNhZGUgPSBuZXcgV0FTTUFyZ29uMmlkRmFjYWRlKClcblx0fVxuXG5cdGxvY2F0b3IuZGV2aWNlRW5jcnlwdGlvbkZhY2FkZSA9IG5ldyBEZXZpY2VFbmNyeXB0aW9uRmFjYWRlKClcblx0Y29uc3QgeyBEYXRhYmFzZUtleUZhY3RvcnkgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uL2NvbW1vbi9taXNjL2NyZWRlbnRpYWxzL0RhdGFiYXNlS2V5RmFjdG9yeS5qc1wiKVxuXG5cdGxvY2F0b3IubG9naW4gPSBuZXcgTG9naW5GYWNhZGUoXG5cdFx0bG9jYXRvci5yZXN0Q2xpZW50LFxuXHRcdC8qKlxuXHRcdCAqIHdlIGRvbid0IHdhbnQgdG8gdHJ5IHRvIHVzZSB0aGUgY2FjaGUgaW4gdGhlIGxvZ2luIGZhY2FkZSwgYmVjYXVzZSBpdCBtYXkgbm90IGJlIGF2YWlsYWJsZSAod2hlbiBubyB1c2VyIGlzIGxvZ2dlZCBpbilcblx0XHQgKi9cblx0XHRuZXcgRW50aXR5Q2xpZW50KGxvY2F0b3IuY2FjaGUpLFxuXHRcdGxvZ2luTGlzdGVuZXIsXG5cdFx0bG9jYXRvci5pbnN0YW5jZU1hcHBlcixcblx0XHRsb2NhdG9yLmNyeXB0byxcblx0XHRsb2NhdG9yLmtleVJvdGF0aW9uLFxuXHRcdG1heWJlVW5pbml0aWFsaXplZFN0b3JhZ2UsXG5cdFx0bG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IsXG5cdFx0bG9jYXRvci51c2VyLFxuXHRcdGxvY2F0b3IuYmxvYkFjY2Vzc1Rva2VuLFxuXHRcdGxvY2F0b3IuZW50cm9weUZhY2FkZSxcblx0XHRuZXcgRGF0YWJhc2VLZXlGYWN0b3J5KGxvY2F0b3IuZGV2aWNlRW5jcnlwdGlvbkZhY2FkZSksXG5cdFx0YXJnb24yaWRGYWNhZGUsXG5cdFx0bm9uQ2FjaGluZ0VudGl0eUNsaWVudCxcblx0XHRhc3luYyAoZXJyb3I6IEVycm9yKSA9PiB7XG5cdFx0XHRhd2FpdCB3b3JrZXIuc2VuZEVycm9yKGVycm9yKVxuXHRcdH0sXG5cdFx0bG9jYXRvci5jYWNoZU1hbmFnZW1lbnQsXG5cdClcblxuXHRsb2NhdG9yLnNlYXJjaCA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBTZWFyY2hGYWNhZGUgfSA9IGF3YWl0IGltcG9ydChcIi4uL2luZGV4L1NlYXJjaEZhY2FkZS5qc1wiKVxuXHRcdGNvbnN0IGluZGV4ZXIgPSBhd2FpdCBsb2NhdG9yLmluZGV4ZXIoKVxuXHRcdGNvbnN0IHN1Z2dlc3Rpb25GYWNhZGVzID0gW2luZGV4ZXIuX2NvbnRhY3Quc3VnZ2VzdGlvbkZhY2FkZV1cblx0XHRyZXR1cm4gbmV3IFNlYXJjaEZhY2FkZShsb2NhdG9yLnVzZXIsIGluZGV4ZXIuZGIsIGluZGV4ZXIuX21haWwsIHN1Z2dlc3Rpb25GYWNhZGVzLCBicm93c2VyRGF0YSwgbG9jYXRvci5jYWNoaW5nRW50aXR5Q2xpZW50KVxuXHR9KVxuXHRsb2NhdG9yLnVzZXJNYW5hZ2VtZW50ID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IFVzZXJNYW5hZ2VtZW50RmFjYWRlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvVXNlck1hbmFnZW1lbnRGYWNhZGUuanNcIilcblx0XHRyZXR1cm4gbmV3IFVzZXJNYW5hZ2VtZW50RmFjYWRlKFxuXHRcdFx0bG9jYXRvci51c2VyLFxuXHRcdFx0YXdhaXQgbG9jYXRvci5ncm91cE1hbmFnZW1lbnQoKSxcblx0XHRcdGF3YWl0IGxvY2F0b3IuY291bnRlcnMoKSxcblx0XHRcdGxvY2F0b3IuY2FjaGluZ0VudGl0eUNsaWVudCxcblx0XHRcdGxvY2F0b3Iuc2VydmljZUV4ZWN1dG9yLFxuXHRcdFx0bWFpbkludGVyZmFjZS5vcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIsXG5cdFx0XHRsb2NhdG9yLmxvZ2luLFxuXHRcdFx0bG9jYXRvci5wcUZhY2FkZSxcblx0XHRcdGxvY2F0b3Iua2V5TG9hZGVyLFxuXHRcdFx0YXdhaXQgbG9jYXRvci5yZWNvdmVyQ29kZSgpLFxuXHRcdClcblx0fSlcblx0bG9jYXRvci5jdXN0b21lciA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBDdXN0b21lckZhY2FkZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0N1c3RvbWVyRmFjYWRlLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBDdXN0b21lckZhY2FkZShcblx0XHRcdGxvY2F0b3IudXNlcixcblx0XHRcdGF3YWl0IGxvY2F0b3IuZ3JvdXBNYW5hZ2VtZW50KCksXG5cdFx0XHRhd2FpdCBsb2NhdG9yLnVzZXJNYW5hZ2VtZW50KCksXG5cdFx0XHRhd2FpdCBsb2NhdG9yLmNvdW50ZXJzKCksXG5cdFx0XHRsb2NhdG9yLnJzYSxcblx0XHRcdGxvY2F0b3IuY2FjaGluZ0VudGl0eUNsaWVudCxcblx0XHRcdGxvY2F0b3Iuc2VydmljZUV4ZWN1dG9yLFxuXHRcdFx0YXdhaXQgbG9jYXRvci5ib29raW5nKCksXG5cdFx0XHRsb2NhdG9yLmNyeXB0byxcblx0XHRcdG1haW5JbnRlcmZhY2Uub3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyLFxuXHRcdFx0bG9jYXRvci5wZGZXcml0ZXIsXG5cdFx0XHRsb2NhdG9yLnBxRmFjYWRlLFxuXHRcdFx0bG9jYXRvci5rZXlMb2FkZXIsXG5cdFx0XHRhd2FpdCBsb2NhdG9yLnJlY292ZXJDb2RlKCksXG5cdFx0XHRsb2NhdG9yLmFzeW1tZXRyaWNDcnlwdG8sXG5cdFx0KVxuXHR9KVxuXHRjb25zdCBhZXNBcHAgPSBuZXcgQWVzQXBwKG5ldyBOYXRpdmVDcnlwdG9GYWNhZGVTZW5kRGlzcGF0Y2hlcih3b3JrZXIpLCByYW5kb20pXG5cdGxvY2F0b3IuYmxvYiA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBCbG9iRmFjYWRlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQmxvYkZhY2FkZS5qc1wiKVxuXHRcdHJldHVybiBuZXcgQmxvYkZhY2FkZShsb2NhdG9yLnJlc3RDbGllbnQsIHN1c3BlbnNpb25IYW5kbGVyLCBmaWxlQXBwLCBhZXNBcHAsIGxvY2F0b3IuaW5zdGFuY2VNYXBwZXIsIGxvY2F0b3IuY3J5cHRvLCBsb2NhdG9yLmJsb2JBY2Nlc3NUb2tlbilcblx0fSlcblx0bG9jYXRvci5tYWlsID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IE1haWxGYWNhZGUgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsRmFjYWRlLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBNYWlsRmFjYWRlKFxuXHRcdFx0bG9jYXRvci51c2VyLFxuXHRcdFx0bG9jYXRvci5jYWNoaW5nRW50aXR5Q2xpZW50LFxuXHRcdFx0bG9jYXRvci5jcnlwdG8sXG5cdFx0XHRsb2NhdG9yLnNlcnZpY2VFeGVjdXRvcixcblx0XHRcdGF3YWl0IGxvY2F0b3IuYmxvYigpLFxuXHRcdFx0ZmlsZUFwcCxcblx0XHRcdGxvY2F0b3IubG9naW4sXG5cdFx0XHRsb2NhdG9yLmtleUxvYWRlcixcblx0XHQpXG5cdH0pXG5cdGNvbnN0IG5hdGl2ZVB1c2hGYWNhZGUgPSBuZXcgTmF0aXZlUHVzaEZhY2FkZVNlbmREaXNwYXRjaGVyKHdvcmtlcilcblx0bG9jYXRvci5jYWxlbmRhciA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBDYWxlbmRhckZhY2FkZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NhbGVuZGFyRmFjYWRlLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBDYWxlbmRhckZhY2FkZShcblx0XHRcdGxvY2F0b3IudXNlcixcblx0XHRcdGF3YWl0IGxvY2F0b3IuZ3JvdXBNYW5hZ2VtZW50KCksXG5cdFx0XHRhc3NlcnROb3ROdWxsKGNhY2hlKSxcblx0XHRcdG5vbkNhY2hpbmdFbnRpdHlDbGllbnQsIC8vIHdpdGhvdXQgY2FjaGVcblx0XHRcdG5hdGl2ZVB1c2hGYWNhZGUsXG5cdFx0XHRtYWluSW50ZXJmYWNlLm9wZXJhdGlvblByb2dyZXNzVHJhY2tlcixcblx0XHRcdGxvY2F0b3IuaW5zdGFuY2VNYXBwZXIsXG5cdFx0XHRsb2NhdG9yLnNlcnZpY2VFeGVjdXRvcixcblx0XHRcdGxvY2F0b3IuY3J5cHRvLFxuXHRcdFx0bWFpbkludGVyZmFjZS5pbmZvTWVzc2FnZUhhbmRsZXIsXG5cdFx0KVxuXHR9KVxuXG5cdGxvY2F0b3IubWFpbEFkZHJlc3MgPSBsYXp5TWVtb2l6ZWQoYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgTWFpbEFkZHJlc3NGYWNhZGUgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsQWRkcmVzc0ZhY2FkZS5qc1wiKVxuXHRcdHJldHVybiBuZXcgTWFpbEFkZHJlc3NGYWNhZGUoXG5cdFx0XHRsb2NhdG9yLnVzZXIsXG5cdFx0XHRhd2FpdCBsb2NhdG9yLmdyb3VwTWFuYWdlbWVudCgpLFxuXHRcdFx0bG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IsXG5cdFx0XHRub25DYWNoaW5nRW50aXR5Q2xpZW50LCAvLyB3aXRob3V0IGNhY2hlXG5cdFx0KVxuXHR9KVxuXHRjb25zdCBzY2hlZHVsZXIgPSBuZXcgU2NoZWR1bGVySW1wbChkYXRlUHJvdmlkZXIsIHNlbGYsIHNlbGYpXG5cblx0bG9jYXRvci5jb25maWdGYWNhZGUgPSBsYXp5TWVtb2l6ZWQoYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgQ29uZmlndXJhdGlvbkRhdGFiYXNlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ29uZmlndXJhdGlvbkRhdGFiYXNlLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBDb25maWd1cmF0aW9uRGF0YWJhc2UobG9jYXRvci5rZXlMb2FkZXIsIGxvY2F0b3IudXNlcilcblx0fSlcblxuXHRjb25zdCBldmVudEJ1c0Nvb3JkaW5hdG9yID0gbmV3IEV2ZW50QnVzRXZlbnRDb29yZGluYXRvcihcblx0XHRtYWluSW50ZXJmYWNlLndzQ29ubmVjdGl2aXR5TGlzdGVuZXIsXG5cdFx0bG9jYXRvci5tYWlsLFxuXHRcdGxvY2F0b3IudXNlcixcblx0XHRsb2NhdG9yLmNhY2hpbmdFbnRpdHlDbGllbnQsXG5cdFx0bWFpbkludGVyZmFjZS5ldmVudENvbnRyb2xsZXIsXG5cdFx0bG9jYXRvci5jb25maWdGYWNhZGUsXG5cdFx0bG9jYXRvci5rZXlSb3RhdGlvbixcblx0XHRsb2NhdG9yLmNhY2hlTWFuYWdlbWVudCxcblx0XHRhc3luYyAoZXJyb3I6IEVycm9yKSA9PiB7XG5cdFx0XHRhd2FpdCB3b3JrZXIuc2VuZEVycm9yKGVycm9yKVxuXHRcdH0sXG5cdFx0YXN5bmMgKHF1ZXVlZEJhdGNoOiBRdWV1ZWRCYXRjaFtdKSA9PiB7XG5cdFx0XHRjb25zdCBpbmRleGVyID0gYXdhaXQgbG9jYXRvci5pbmRleGVyKClcblx0XHRcdGluZGV4ZXIuYWRkQmF0Y2hlc1RvUXVldWUocXVldWVkQmF0Y2gpXG5cdFx0XHRpbmRleGVyLnN0YXJ0UHJvY2Vzc2luZygpXG5cdFx0fSxcblx0KVxuXG5cdGxvY2F0b3IuZXZlbnRCdXNDbGllbnQgPSBuZXcgRXZlbnRCdXNDbGllbnQoXG5cdFx0ZXZlbnRCdXNDb29yZGluYXRvcixcblx0XHRjYWNoZSA/PyBuZXcgQWRtaW5DbGllbnREdW1teUVudGl0eVJlc3RDYWNoZSgpLFxuXHRcdGxvY2F0b3IudXNlcixcblx0XHRsb2NhdG9yLmNhY2hpbmdFbnRpdHlDbGllbnQsXG5cdFx0bG9jYXRvci5pbnN0YW5jZU1hcHBlcixcblx0XHQocGF0aCkgPT4gbmV3IFdlYlNvY2tldChnZXRXZWJzb2NrZXRCYXNlVXJsKGRvbWFpbkNvbmZpZykgKyBwYXRoKSxcblx0XHRuZXcgU2xlZXBEZXRlY3RvcihzY2hlZHVsZXIsIGRhdGVQcm92aWRlciksXG5cdFx0bWFpbkludGVyZmFjZS5wcm9ncmVzc1RyYWNrZXIsXG5cdClcblx0bG9jYXRvci5sb2dpbi5pbml0KGxvY2F0b3IuZXZlbnRCdXNDbGllbnQpXG5cdGxvY2F0b3IuQ29uc3QgPSBDb25zdFxuXHRsb2NhdG9yLmdpZnRDYXJkcyA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBHaWZ0Q2FyZEZhY2FkZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0dpZnRDYXJkRmFjYWRlLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBHaWZ0Q2FyZEZhY2FkZShsb2NhdG9yLnVzZXIsIGF3YWl0IGxvY2F0b3IuY3VzdG9tZXIoKSwgbG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IsIGxvY2F0b3IuY3J5cHRvLCBsb2NhdG9yLmtleUxvYWRlcilcblx0fSlcblx0bG9jYXRvci5jb250YWN0RmFjYWRlID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IENvbnRhY3RGYWNhZGUgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Db250YWN0RmFjYWRlLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBDb250YWN0RmFjYWRlKG5ldyBFbnRpdHlDbGllbnQobG9jYXRvci5jYWNoZSkpXG5cdH0pXG5cdGxvY2F0b3IubWFpbEV4cG9ydEZhY2FkZSA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBNYWlsRXhwb3J0RmFjYWRlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvTWFpbEV4cG9ydEZhY2FkZS5qc1wiKVxuXHRcdGNvbnN0IHsgTWFpbEV4cG9ydFRva2VuRmFjYWRlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvTWFpbEV4cG9ydFRva2VuRmFjYWRlLmpzXCIpXG5cdFx0Y29uc3QgbWFpbEV4cG9ydFRva2VuRmFjYWRlID0gbmV3IE1haWxFeHBvcnRUb2tlbkZhY2FkZShsb2NhdG9yLnNlcnZpY2VFeGVjdXRvcilcblx0XHRyZXR1cm4gbmV3IE1haWxFeHBvcnRGYWNhZGUobWFpbEV4cG9ydFRva2VuRmFjYWRlLCBhd2FpdCBsb2NhdG9yLmJ1bGtNYWlsTG9hZGVyKCksIGF3YWl0IGxvY2F0b3IuYmxvYigpLCBsb2NhdG9yLmNyeXB0bywgbG9jYXRvci5ibG9iQWNjZXNzVG9rZW4pXG5cdH0pXG59XG5cbmNvbnN0IFJFVFJZX1RJTU9VVF9BRlRFUl9JTklUX0lOREVYRVJfRVJST1JfTVMgPSAzMDAwMFxuXG5hc3luYyBmdW5jdGlvbiBpbml0SW5kZXhlcih3b3JrZXI6IFdvcmtlckltcGwsIGNhY2hlSW5mbzogQ2FjaGVJbmZvLCBrZXlMb2FkZXJGYWNhZGU6IEtleUxvYWRlckZhY2FkZSk6IFByb21pc2U8dm9pZD4ge1xuXHRjb25zdCBpbmRleGVyID0gYXdhaXQgbG9jYXRvci5pbmRleGVyKClcblx0dHJ5IHtcblx0XHRhd2FpdCBpbmRleGVyLmluaXQoe1xuXHRcdFx0dXNlcjogYXNzZXJ0Tm90TnVsbChsb2NhdG9yLnVzZXIuZ2V0VXNlcigpKSxcblx0XHRcdGNhY2hlSW5mbyxcblx0XHRcdGtleUxvYWRlckZhY2FkZSxcblx0XHR9KVxuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKGUgaW5zdGFuY2VvZiBTZXJ2aWNlVW5hdmFpbGFibGVFcnJvcikge1xuXHRcdFx0Y29uc29sZS5sb2coXCJSZXRyeSBpbml0IGluZGV4ZXIgaW4gMzAgc2Vjb25kcyBhZnRlciBTZXJ2aWNlVW5hdmFpbGFibGVFcnJvclwiKVxuXHRcdFx0YXdhaXQgZGVsYXkoUkVUUllfVElNT1VUX0FGVEVSX0lOSVRfSU5ERVhFUl9FUlJPUl9NUylcblx0XHRcdGNvbnNvbGUubG9nKFwiX2luaXRJbmRleGVyIGFmdGVyIFNlcnZpY2VVbmF2YWlsYWJsZUVycm9yXCIpXG5cdFx0XHRyZXR1cm4gaW5pdEluZGV4ZXIod29ya2VyLCBjYWNoZUluZm8sIGtleUxvYWRlckZhY2FkZSlcblx0XHR9IGVsc2UgaWYgKGUgaW5zdGFuY2VvZiBDb25uZWN0aW9uRXJyb3IpIHtcblx0XHRcdGNvbnNvbGUubG9nKFwiUmV0cnkgaW5pdCBpbmRleGVyIGluIDMwIHNlY29uZHMgYWZ0ZXIgQ29ubmVjdGlvbkVycm9yXCIpXG5cdFx0XHRhd2FpdCBkZWxheShSRVRSWV9USU1PVVRfQUZURVJfSU5JVF9JTkRFWEVSX0VSUk9SX01TKVxuXHRcdFx0Y29uc29sZS5sb2coXCJfaW5pdEluZGV4ZXIgYWZ0ZXIgQ29ubmVjdGlvbkVycm9yXCIpXG5cdFx0XHRyZXR1cm4gaW5pdEluZGV4ZXIod29ya2VyLCBjYWNoZUluZm8sIGtleUxvYWRlckZhY2FkZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gbm90IGF3YWl0aW5nXG5cdFx0XHR3b3JrZXIuc2VuZEVycm9yKGUpXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdH1cblx0aWYgKGNhY2hlSW5mby5pc1BlcnNpc3RlbnQgJiYgY2FjaGVJbmZvLmlzTmV3T2ZmbGluZURiKSB7XG5cdFx0Ly8gbm90IGF3YWl0aW5nXG5cdFx0aW5kZXhlci5lbmFibGVNYWlsSW5kZXhpbmcoKVxuXHR9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNldExvY2F0b3IoKTogUHJvbWlzZTx2b2lkPiB7XG5cdGF3YWl0IGxvY2F0b3IubG9naW4ucmVzZXRTZXNzaW9uKClcblx0YXdhaXQgaW5pdExvY2F0b3IobG9jYXRvci5fd29ya2VyLCBsb2NhdG9yLl9icm93c2VyRGF0YSlcbn1cblxuaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdDsoc2VsZiBhcyB1bmtub3duIGFzIFdvcmtlckdsb2JhbFNjb3BlKS5sb2NhdG9yID0gbG9jYXRvciAvLyBleHBvcnQgaW4gd29ya2VyIHNjb3BlXG59XG5cbi8qXG4gKiBAcmV0dXJucyB0cnVlIGlmIHdlYmFzc2VtYmx5IGlzIHN1cHBvcnRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNXZWJBc3NlbWJseVN1cHBvcnRlZCgpIHtcblx0cmV0dXJuIHR5cGVvZiBXZWJBc3NlbWJseSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUgPT09IFwiZnVuY3Rpb25cIlxufVxuIiwiaW1wb3J0IHR5cGUgeyBDb21tYW5kcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi90aHJlYWRpbmcvTWVzc2FnZURpc3BhdGNoZXIuanNcIlxuaW1wb3J0IHsgZXJyb3JUb09iaiwgTWVzc2FnZURpc3BhdGNoZXIsIFJlcXVlc3QgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdGhyZWFkaW5nL01lc3NhZ2VEaXNwYXRjaGVyLmpzXCJcbmltcG9ydCB7IEJvb2tpbmdGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0Jvb2tpbmdGYWNhZGUuanNcIlxuaW1wb3J0IHsgTm90QXV0aGVudGljYXRlZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvci5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgaW5pdExvY2F0b3IsIGxvY2F0b3IsIHJlc2V0TG9jYXRvciB9IGZyb20gXCIuL1dvcmtlckxvY2F0b3IuanNcIlxuaW1wb3J0IHsgYXNzZXJ0V29ya2VyT3JOb2RlLCBpc01haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB0eXBlIHsgQnJvd3NlckRhdGEgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50Q29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IENyeXB0b0ZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9jcnlwdG8vQ3J5cHRvRmFjYWRlLmpzXCJcbmltcG9ydCB0eXBlIHsgR2lmdENhcmRGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0dpZnRDYXJkRmFjYWRlLmpzXCJcbmltcG9ydCB0eXBlIHsgTG9naW5GYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9Mb2dpbkZhY2FkZS5qc1wiXG5pbXBvcnQgdHlwZSB7IEN1c3RvbWVyRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9DdXN0b21lckZhY2FkZS5qc1wiXG5pbXBvcnQgdHlwZSB7IEdyb3VwTWFuYWdlbWVudEZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvR3JvdXBNYW5hZ2VtZW50RmFjYWRlLmpzXCJcbmltcG9ydCB7IENvbmZpZ3VyYXRpb25EYXRhYmFzZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ29uZmlndXJhdGlvbkRhdGFiYXNlLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9DYWxlbmRhckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBNYWlsRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsRmFjYWRlLmpzXCJcbmltcG9ydCB7IFNoYXJlRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9TaGFyZUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBDb3VudGVyRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Db3VudGVyRmFjYWRlLmpzXCJcbmltcG9ydCB0eXBlIHsgSW5kZXhlciB9IGZyb20gXCIuLi9pbmRleC9JbmRleGVyLmpzXCJcbmltcG9ydCB7IFNlYXJjaEZhY2FkZSB9IGZyb20gXCIuLi9pbmRleC9TZWFyY2hGYWNhZGUuanNcIlxuaW1wb3J0IHsgTWFpbEFkZHJlc3NGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L01haWxBZGRyZXNzRmFjYWRlLmpzXCJcbmltcG9ydCB7IFVzZXJNYW5hZ2VtZW50RmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Vc2VyTWFuYWdlbWVudEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBEZWxheWVkSW1wbHMsIGV4cG9zZUxvY2FsRGVsYXllZCwgZXhwb3NlUmVtb3RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1dvcmtlclByb3h5LmpzXCJcbmltcG9ydCB7IHJhbmRvbSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtY3J5cHRvXCJcbmltcG9ydCB0eXBlIHsgTmF0aXZlSW50ZXJmYWNlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL05hdGl2ZUludGVyZmFjZS5qc1wiXG5pbXBvcnQgdHlwZSB7IEVudGl0eVJlc3RJbnRlcmZhY2UgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvcmVzdC9FbnRpdHlSZXN0Q2xpZW50LmpzXCJcbmltcG9ydCB7IFJlc3RDbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvcmVzdC9SZXN0Q2xpZW50LmpzXCJcbmltcG9ydCB7IElTZXJ2aWNlRXhlY3V0b3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vU2VydmljZVJlcXVlc3QuanNcIlxuaW1wb3J0IHsgQmxvYkZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQmxvYkZhY2FkZS5qc1wiXG5pbXBvcnQgeyBFeHBvc2VkQ2FjaGVTdG9yYWdlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL3Jlc3QvRGVmYXVsdEVudGl0eVJlc3RDYWNoZS5qc1wiXG5pbXBvcnQgeyBCbG9iQWNjZXNzVG9rZW5GYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9CbG9iQWNjZXNzVG9rZW5GYWNhZGUuanNcIlxuaW1wb3J0IHsgRW50cm9weUZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL0VudHJvcHlGYWNhZGUuanNcIlxuaW1wb3J0IHsgV29ya2VyRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvV29ya2VyRmFjYWRlLmpzXCJcbmltcG9ydCB7IFNxbENpcGhlckZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvU3FsQ2lwaGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IFdlYldvcmtlclRyYW5zcG9ydCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi90aHJlYWRpbmcvVHJhbnNwb3J0LmpzXCJcbmltcG9ydCB7IENvbnRhY3RGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NvbnRhY3RGYWNhZGUuanNcIlxuaW1wb3J0IHsgUmVjb3ZlckNvZGVGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L1JlY292ZXJDb2RlRmFjYWRlLmpzXCJcbmltcG9ydCB7IENhY2hlTWFuYWdlbWVudEZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ2FjaGVNYW5hZ2VtZW50RmFjYWRlLmpzXCJcbmltcG9ydCB7IEV4cG9zZWRFdmVudEJ1cywgTWFpbkludGVyZmFjZSwgV29ya2VyUmFuZG9taXplciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci93b3JrZXJJbnRlcmZhY2VzLmpzXCJcbmltcG9ydCB7IENyeXB0b0Vycm9yIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS1jcnlwdG8vZXJyb3IuanNcIlxuaW1wb3J0IHsgQ3J5cHRvV3JhcHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9jcnlwdG8vQ3J5cHRvV3JhcHBlci5qc1wiXG5pbXBvcnQgeyBBc3ltbWV0cmljQ3J5cHRvRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2NyeXB0by9Bc3ltbWV0cmljQ3J5cHRvRmFjYWRlLmpzXCJcbmltcG9ydCB7IE1haWxFeHBvcnRGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L01haWxFeHBvcnRGYWNhZGVcIlxuaW1wb3J0IHsgQnVsa01haWxMb2FkZXIgfSBmcm9tIFwiLi4vaW5kZXgvQnVsa01haWxMb2FkZXIuanNcIlxuXG5hc3NlcnRXb3JrZXJPck5vZGUoKVxuXG4vKiogSW50ZXJmYWNlIG9mIHRoZSBmYWNhZGVzIGV4cG9zZWQgYnkgdGhlIHdvcmtlciwgYmFzaWNhbGx5IGludGVyZmFjZSBmb3IgdGhlIHdvcmtlciBpdHNlbGYgKi9cbmV4cG9ydCBpbnRlcmZhY2UgV29ya2VySW50ZXJmYWNlIHtcblx0cmVhZG9ubHkgbG9naW5GYWNhZGU6IExvZ2luRmFjYWRlXG5cdHJlYWRvbmx5IGN1c3RvbWVyRmFjYWRlOiBDdXN0b21lckZhY2FkZVxuXHRyZWFkb25seSBnaWZ0Q2FyZEZhY2FkZTogR2lmdENhcmRGYWNhZGVcblx0cmVhZG9ubHkgZ3JvdXBNYW5hZ2VtZW50RmFjYWRlOiBHcm91cE1hbmFnZW1lbnRGYWNhZGVcblx0cmVhZG9ubHkgY29uZmlnRmFjYWRlOiBDb25maWd1cmF0aW9uRGF0YWJhc2Vcblx0cmVhZG9ubHkgY2FsZW5kYXJGYWNhZGU6IENhbGVuZGFyRmFjYWRlXG5cdHJlYWRvbmx5IG1haWxGYWNhZGU6IE1haWxGYWNhZGVcblx0cmVhZG9ubHkgc2hhcmVGYWNhZGU6IFNoYXJlRmFjYWRlXG5cdHJlYWRvbmx5IGNhY2hlTWFuYWdlbWVudEZhY2FkZTogQ2FjaGVNYW5hZ2VtZW50RmFjYWRlXG5cdHJlYWRvbmx5IGNvdW50ZXJGYWNhZGU6IENvdW50ZXJGYWNhZGVcblx0cmVhZG9ubHkgaW5kZXhlckZhY2FkZTogSW5kZXhlclxuXHRyZWFkb25seSBzZWFyY2hGYWNhZGU6IFNlYXJjaEZhY2FkZVxuXHRyZWFkb25seSBib29raW5nRmFjYWRlOiBCb29raW5nRmFjYWRlXG5cdHJlYWRvbmx5IG1haWxBZGRyZXNzRmFjYWRlOiBNYWlsQWRkcmVzc0ZhY2FkZVxuXHRyZWFkb25seSBibG9iQWNjZXNzVG9rZW5GYWNhZGU6IEJsb2JBY2Nlc3NUb2tlbkZhY2FkZVxuXHRyZWFkb25seSBibG9iRmFjYWRlOiBCbG9iRmFjYWRlXG5cdHJlYWRvbmx5IHVzZXJNYW5hZ2VtZW50RmFjYWRlOiBVc2VyTWFuYWdlbWVudEZhY2FkZVxuXHRyZWFkb25seSByZWNvdmVyQ29kZUZhY2FkZTogUmVjb3ZlckNvZGVGYWNhZGVcblx0cmVhZG9ubHkgcmVzdEludGVyZmFjZTogRW50aXR5UmVzdEludGVyZmFjZVxuXHRyZWFkb25seSBzZXJ2aWNlRXhlY3V0b3I6IElTZXJ2aWNlRXhlY3V0b3Jcblx0cmVhZG9ubHkgY3J5cHRvV3JhcHBlcjogQ3J5cHRvV3JhcHBlclxuXHRyZWFkb25seSBhc3ltbWV0cmljQ3J5cHRvRmFjYWRlOiBBc3ltbWV0cmljQ3J5cHRvRmFjYWRlXG5cdHJlYWRvbmx5IGNyeXB0b0ZhY2FkZTogQ3J5cHRvRmFjYWRlXG5cdHJlYWRvbmx5IGNhY2hlU3RvcmFnZTogRXhwb3NlZENhY2hlU3RvcmFnZVxuXHRyZWFkb25seSBzcWxDaXBoZXJGYWNhZGU6IFNxbENpcGhlckZhY2FkZVxuXHRyZWFkb25seSByYW5kb206IFdvcmtlclJhbmRvbWl6ZXJcblx0cmVhZG9ubHkgZXZlbnRCdXM6IEV4cG9zZWRFdmVudEJ1c1xuXHRyZWFkb25seSBlbnRyb3B5RmFjYWRlOiBFbnRyb3B5RmFjYWRlXG5cdHJlYWRvbmx5IHdvcmtlckZhY2FkZTogV29ya2VyRmFjYWRlXG5cdHJlYWRvbmx5IGNvbnRhY3RGYWNhZGU6IENvbnRhY3RGYWNhZGVcblx0cmVhZG9ubHkgbWFpbEV4cG9ydEZhY2FkZTogTWFpbEV4cG9ydEZhY2FkZVxuXHRyZWFkb25seSBidWxrTWFpbExvYWRlcjogQnVsa01haWxMb2FkZXJcbn1cblxudHlwZSBXb3JrZXJSZXF1ZXN0ID0gUmVxdWVzdDxXb3JrZXJSZXF1ZXN0VHlwZT5cblxuZXhwb3J0IGNsYXNzIFdvcmtlckltcGwgaW1wbGVtZW50cyBOYXRpdmVJbnRlcmZhY2Uge1xuXHRwcml2YXRlIHJlYWRvbmx5IF9zY29wZTogRGVkaWNhdGVkV29ya2VyR2xvYmFsU2NvcGVcblx0cHJpdmF0ZSByZWFkb25seSBfZGlzcGF0Y2hlcjogTWVzc2FnZURpc3BhdGNoZXI8TWFpblJlcXVlc3RUeXBlLCBXb3JrZXJSZXF1ZXN0VHlwZT5cblxuXHRjb25zdHJ1Y3RvcihzZWxmOiBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZSkge1xuXHRcdHRoaXMuX3Njb3BlID0gc2VsZlxuXHRcdHRoaXMuX2Rpc3BhdGNoZXIgPSBuZXcgTWVzc2FnZURpc3BhdGNoZXIobmV3IFdlYldvcmtlclRyYW5zcG9ydCh0aGlzLl9zY29wZSksIHRoaXMucXVldWVDb21tYW5kcyh0aGlzLmV4cG9zZWRJbnRlcmZhY2UpLCBcIndvcmtlci1tYWluXCIpXG5cdH1cblxuXHRhc3luYyBpbml0KGJyb3dzZXJEYXRhOiBCcm93c2VyRGF0YSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIGltcG9ydChcInR1dGEtc2RrXCIpLnRoZW4oYXN5bmMgKG1vZHVsZSkgPT4ge1xuXHRcdC8vIFx0Ly8gYXdhaXQgbW9kdWxlLmRlZmF1bHQoXCJ3YXNtL3R1dGFzZGsud2FzbVwiKVxuXHRcdC8vIFx0Y29uc3QgZW50aXR5Q2xpZW50ID0gbmV3IG1vZHVsZS5FbnRpdHlDbGllbnQoKVxuXHRcdC8vIFx0Y29uc3QgdHlwZVJlZiA9IG5ldyBtb2R1bGUuVHlwZVJlZihcInR1dGFub3RhXCIsIFwiTWFpbFwiKVxuXHRcdC8vIFx0Y29uc29sZS5sb2coXCJyZXN1bHQgZnJvbSBydXN0OiBcIiwgYXdhaSB0IGVudGl0eUNsaWVudC5sb2FkX2VsZW1lbnQodHlwZVJlZiwgXCJteUlkXCIpKVxuXHRcdC8vIFx0dHlwZVJlZi5mcmVlKClcblx0XHQvLyBcdGVudGl0eUNsaWVudC5mcmVlKClcblx0XHQvLyB9KVxuXG5cdFx0YXdhaXQgaW5pdExvY2F0b3IodGhpcywgYnJvd3NlckRhdGEpXG5cdFx0Y29uc3Qgd29ya2VyU2NvcGUgPSB0aGlzLl9zY29wZVxuXG5cdFx0Ly8gb25seSByZWdpc3RlciBvbmNhdWdodCBlcnJvciBoYW5kbGVyIGlmIHdlIGFyZSBpbiB0aGUgKnJlYWwqIHdvcmtlciBzY29wZVxuXHRcdC8vIE90aGVyd2lzZSB1bmNhdWdodCBlcnJvciBoYW5kbGVyIG1pZ2h0IGVuZCB1cCBpbiBhbiBpbmZpbml0ZSBsb29wIGZvciB0ZXN0IGNhc2VzLlxuXHRcdGlmICh3b3JrZXJTY29wZSAmJiAhaXNNYWluT3JOb2RlKCkpIHtcblx0XHRcdHdvcmtlclNjb3BlLmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmhhbmRsZWRyZWplY3Rpb25cIiwgKGV2ZW50OiBQcm9taXNlUmVqZWN0aW9uRXZlbnQpID0+IHtcblx0XHRcdFx0dGhpcy5zZW5kRXJyb3IoZXZlbnQucmVhc29uKVxuXHRcdFx0fSlcblxuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0d29ya2VyU2NvcGUub25lcnJvciA9IChlOiBzdHJpbmcgfCBFdmVudCwgc291cmNlLCBsaW5lbm8sIGNvbG5vLCBlcnJvcikgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKFwid29ya2VySW1wbC5vbmVycm9yXCIsIGUsIHNvdXJjZSwgbGluZW5vLCBjb2xubywgZXJyb3IpXG5cblx0XHRcdFx0aWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcblx0XHRcdFx0XHR0aGlzLnNlbmRFcnJvcihlcnJvcilcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0Y29uc3QgZXJyID0gbmV3IEVycm9yKGUpXG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdGVyci5saW5lTnVtYmVyID0gbGluZW5vXG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdGVyci5jb2x1bW5OdW1iZXIgPSBjb2xub1xuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRlcnIuZmlsZU5hbWUgPSBzb3VyY2Vcblx0XHRcdFx0XHR0aGlzLnNlbmRFcnJvcihlcnIpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGdldCBleHBvc2VkSW50ZXJmYWNlKCk6IERlbGF5ZWRJbXBsczxXb3JrZXJJbnRlcmZhY2U+IHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YXN5bmMgbG9naW5GYWNhZGUoKSB7XG5cdFx0XHRcdHJldHVybiBsb2NhdG9yLmxvZ2luXG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyBjdXN0b21lckZhY2FkZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IuY3VzdG9tZXIoKVxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgZ2lmdENhcmRGYWNhZGUoKSB7XG5cdFx0XHRcdHJldHVybiBsb2NhdG9yLmdpZnRDYXJkcygpXG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyBncm91cE1hbmFnZW1lbnRGYWNhZGUoKSB7XG5cdFx0XHRcdHJldHVybiBsb2NhdG9yLmdyb3VwTWFuYWdlbWVudCgpXG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyBjb25maWdGYWNhZGUoKSB7XG5cdFx0XHRcdHJldHVybiBsb2NhdG9yLmNvbmZpZ0ZhY2FkZSgpXG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyBjYWxlbmRhckZhY2FkZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IuY2FsZW5kYXIoKVxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgbWFpbEZhY2FkZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IubWFpbCgpXG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyBzaGFyZUZhY2FkZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3Iuc2hhcmUoKVxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgY2FjaGVNYW5hZ2VtZW50RmFjYWRlKCkge1xuXHRcdFx0XHRyZXR1cm4gbG9jYXRvci5jYWNoZU1hbmFnZW1lbnQoKVxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgY291bnRlckZhY2FkZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IuY291bnRlcnMoKVxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgaW5kZXhlckZhY2FkZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IuaW5kZXhlcigpXG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyBzZWFyY2hGYWNhZGUoKSB7XG5cdFx0XHRcdHJldHVybiBsb2NhdG9yLnNlYXJjaCgpXG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyBib29raW5nRmFjYWRlKCkge1xuXHRcdFx0XHRyZXR1cm4gbG9jYXRvci5ib29raW5nKClcblx0XHRcdH0sXG5cblx0XHRcdGFzeW5jIG1haWxBZGRyZXNzRmFjYWRlKCkge1xuXHRcdFx0XHRyZXR1cm4gbG9jYXRvci5tYWlsQWRkcmVzcygpXG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyBibG9iQWNjZXNzVG9rZW5GYWNhZGUoKSB7XG5cdFx0XHRcdHJldHVybiBsb2NhdG9yLmJsb2JBY2Nlc3NUb2tlblxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgYmxvYkZhY2FkZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IuYmxvYigpXG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyB1c2VyTWFuYWdlbWVudEZhY2FkZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IudXNlck1hbmFnZW1lbnQoKVxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgcmVjb3ZlckNvZGVGYWNhZGUoKSB7XG5cdFx0XHRcdHJldHVybiBsb2NhdG9yLnJlY292ZXJDb2RlKClcblx0XHRcdH0sXG5cblx0XHRcdGFzeW5jIHJlc3RJbnRlcmZhY2UoKSB7XG5cdFx0XHRcdHJldHVybiBsb2NhdG9yLmNhY2hlXG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyBzZXJ2aWNlRXhlY3V0b3IoKSB7XG5cdFx0XHRcdHJldHVybiBsb2NhdG9yLnNlcnZpY2VFeGVjdXRvclxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgY3J5cHRvV3JhcHBlcigpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IuY3J5cHRvV3JhcHBlclxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgYXN5bW1ldHJpY0NyeXB0b0ZhY2FkZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IuYXN5bW1ldHJpY0NyeXB0b1xuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgY3J5cHRvRmFjYWRlKCkge1xuXHRcdFx0XHRyZXR1cm4gbG9jYXRvci5jcnlwdG9cblx0XHRcdH0sXG5cblx0XHRcdGFzeW5jIGNhY2hlU3RvcmFnZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IuY2FjaGVTdG9yYWdlXG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyBzcWxDaXBoZXJGYWNhZGUoKSB7XG5cdFx0XHRcdHJldHVybiBsb2NhdG9yLnNxbENpcGhlckZhY2FkZVxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgcmFuZG9tKCkge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGFzeW5jIGdlbmVyYXRlUmFuZG9tTnVtYmVyKG5ick9mQnl0ZXM6IG51bWJlcikge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJhbmRvbS5nZW5lcmF0ZVJhbmRvbU51bWJlcihuYnJPZkJ5dGVzKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdGFzeW5jIGV2ZW50QnVzKCkge1xuXHRcdFx0XHRyZXR1cm4gbG9jYXRvci5ldmVudEJ1c0NsaWVudFxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgZW50cm9weUZhY2FkZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IuZW50cm9weUZhY2FkZVxuXHRcdFx0fSxcblxuXHRcdFx0YXN5bmMgd29ya2VyRmFjYWRlKCkge1xuXHRcdFx0XHRyZXR1cm4gbG9jYXRvci53b3JrZXJGYWNhZGVcblx0XHRcdH0sXG5cblx0XHRcdGFzeW5jIGNvbnRhY3RGYWNhZGUoKSB7XG5cdFx0XHRcdHJldHVybiBsb2NhdG9yLmNvbnRhY3RGYWNhZGUoKVxuXHRcdFx0fSxcblx0XHRcdGFzeW5jIGJ1bGtNYWlsTG9hZGVyKCkge1xuXHRcdFx0XHRyZXR1cm4gbG9jYXRvci5idWxrTWFpbExvYWRlcigpXG5cdFx0XHR9LFxuXHRcdFx0YXN5bmMgbWFpbEV4cG9ydEZhY2FkZSgpIHtcblx0XHRcdFx0cmV0dXJuIGxvY2F0b3IubWFpbEV4cG9ydEZhY2FkZSgpXG5cdFx0XHR9LFxuXHRcdH1cblx0fVxuXG5cdHF1ZXVlQ29tbWFuZHMoZXhwb3NlZFdvcmtlcjogRGVsYXllZEltcGxzPFdvcmtlckludGVyZmFjZT4pOiBDb21tYW5kczxXb3JrZXJSZXF1ZXN0VHlwZT4ge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZXR1cDogYXN5bmMgKG1lc3NhZ2UpID0+IHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihcIldvcmtlckltcGw6IHNldHVwIHdhcyBjYWxsZWQgYWZ0ZXIgYm9vdHN0cmFwISBtZXNzYWdlOiBcIiwgbWVzc2FnZSlcblx0XHRcdH0sXG5cdFx0XHR0ZXN0RWNobzogKG1lc3NhZ2UpID0+XG5cdFx0XHRcdFByb21pc2UucmVzb2x2ZSh7XG5cdFx0XHRcdFx0bXNnOiBcIj4+PiBcIiArIG1lc3NhZ2UuYXJnc1swXS5tc2csXG5cdFx0XHRcdH0pLFxuXHRcdFx0dGVzdEVycm9yOiAobWVzc2FnZSkgPT4ge1xuXHRcdFx0XHRjb25zdCBlcnJvclR5cGVzID0ge1xuXHRcdFx0XHRcdFByb2dyYW1taW5nRXJyb3IsXG5cdFx0XHRcdFx0Q3J5cHRvRXJyb3IsXG5cdFx0XHRcdFx0Tm90QXV0aGVudGljYXRlZEVycm9yLFxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0bGV0IEVycm9yVHlwZSA9IGVycm9yVHlwZXNbbWVzc2FnZS5hcmdzWzBdLmVycm9yVHlwZV1cblx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvclR5cGUoYHd0ZjogJHttZXNzYWdlLmFyZ3NbMF0uZXJyb3JUeXBlfWApKVxuXHRcdFx0fSxcblx0XHRcdHJlc2V0OiAobWVzc2FnZTogV29ya2VyUmVxdWVzdCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gcmVzZXRMb2NhdG9yKClcblx0XHRcdH0sXG5cdFx0XHRyZXN0UmVxdWVzdDogKG1lc3NhZ2U6IFdvcmtlclJlcXVlc3QpID0+IHtcblx0XHRcdFx0Ly8gVGhpcyBob3Jyb3IgaXMgdG8gYWRkIGF1dGggaGVhZGVycyB0byB0aGUgYWRtaW4gY2xpZW50XG5cdFx0XHRcdGNvbnN0IGFyZ3MgPSBtZXNzYWdlLmFyZ3MgYXMgUGFyYW1ldGVyczxSZXN0Q2xpZW50W1wicmVxdWVzdFwiXT5cblx0XHRcdFx0bGV0IFtwYXRoLCBtZXRob2QsIG9wdGlvbnNdID0gYXJnc1xuXHRcdFx0XHRvcHRpb25zID0gb3B0aW9ucyA/PyB7fVxuXHRcdFx0XHRvcHRpb25zLmhlYWRlcnMgPSB7IC4uLmxvY2F0b3IudXNlci5jcmVhdGVBdXRoSGVhZGVycygpLCAuLi5vcHRpb25zLmhlYWRlcnMgfVxuXHRcdFx0XHRyZXR1cm4gbG9jYXRvci5yZXN0Q2xpZW50LnJlcXVlc3QocGF0aCwgbWV0aG9kLCBvcHRpb25zKVxuXHRcdFx0fSxcblxuXHRcdFx0ZmFjYWRlOiBleHBvc2VMb2NhbERlbGF5ZWQ8RGVsYXllZEltcGxzPFdvcmtlckludGVyZmFjZT4sIFdvcmtlclJlcXVlc3RUeXBlPihleHBvc2VkV29ya2VyKSxcblx0XHR9XG5cdH1cblxuXHRpbnZva2VOYXRpdmUocmVxdWVzdFR5cGU6IHN0cmluZywgYXJnczogUmVhZG9ubHlBcnJheTx1bmtub3duPik6IFByb21pc2U8YW55PiB7XG5cdFx0cmV0dXJuIHRoaXMuX2Rpc3BhdGNoZXIucG9zdFJlcXVlc3QobmV3IFJlcXVlc3QoXCJleGVjTmF0aXZlXCIsIFtyZXF1ZXN0VHlwZSwgYXJnc10pKVxuXHR9XG5cblx0Z2V0TWFpbkludGVyZmFjZSgpOiBNYWluSW50ZXJmYWNlIHtcblx0XHRyZXR1cm4gZXhwb3NlUmVtb3RlPE1haW5JbnRlcmZhY2U+KChyZXF1ZXN0KSA9PiB0aGlzLl9kaXNwYXRjaGVyLnBvc3RSZXF1ZXN0KHJlcXVlc3QpKVxuXHR9XG5cblx0c2VuZEVycm9yKGU6IEVycm9yKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMuX2Rpc3BhdGNoZXIucG9zdFJlcXVlc3QobmV3IFJlcXVlc3QoXCJlcnJvclwiLCBbZXJyb3JUb09iaihlKV0pKVxuXHR9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJJbXBsIH0gZnJvbSBcIi4vV29ya2VySW1wbC5qc1wiXG5pbXBvcnQgeyBMb2dnZXIsIHJlcGxhY2VOYXRpdmVMb2dnZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vTG9nZ2VyLmpzXCJcblxuLyoqXG4gKiBSZWNlaXZlcyB0aGUgZmlyc3QgbWVzc2FnZSBmcm9tIHRoZSBjbGllbnQgYW5kIGluaXRpYWxpemVzIHRoZSBXb3JrZXJJbXBsIHRvIHJlY2VpdmUgYWxsIGZ1dHVyZSBtZXNzYWdlcy4gU2VuZHMgYSByZXNwb25zZSB0byB0aGUgY2xpZW50IG9uIHRoaXMgZmlyc3QgbWVzc2FnZS5cbiAqL1xuc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAobXNnKSB7XG5cdGNvbnN0IGRhdGEgPSBtc2cuZGF0YVxuXG5cdGlmIChkYXRhLnJlcXVlc3RUeXBlID09PSBcInNldHVwXCIpIHtcblx0XHRzZWxmLmVudiA9IGRhdGEuYXJnc1swXVxuXHRcdHJlcGxhY2VOYXRpdmVMb2dnZXIoc2VsZiwgbmV3IExvZ2dlcigpKVxuXHRcdFByb21pc2UucmVzb2x2ZSgpXG5cdFx0XHQudGhlbihhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGluaXRpYWxSYW5kb21pemVyRW50cm9weSA9IGRhdGEuYXJnc1sxXVxuXHRcdFx0XHRjb25zdCBicm93c2VyRGF0YSA9IGRhdGEuYXJnc1syXVxuXG5cdFx0XHRcdGlmIChpbml0aWFsUmFuZG9taXplckVudHJvcHkgPT0gbnVsbCB8fCBicm93c2VyRGF0YSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBXb3JrZXIgYXJndW1lbnRzXCIpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdGNvbnN0IHdvcmtlckltcGwgPSBuZXcgV29ya2VySW1wbCh0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiBudWxsKVxuXHRcdFx0XHRhd2FpdCB3b3JrZXJJbXBsLmluaXQoYnJvd3NlckRhdGEpXG5cdFx0XHRcdHdvcmtlckltcGwuZXhwb3NlZEludGVyZmFjZS5lbnRyb3B5RmFjYWRlKCkudGhlbigoZW50cm9weUZhY2FkZSkgPT4gZW50cm9weUZhY2FkZS5hZGRFbnRyb3B5KGluaXRpYWxSYW5kb21pemVyRW50cm9weSkpXG5cdFx0XHRcdHNlbGYucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRcdGlkOiBkYXRhLmlkLFxuXHRcdFx0XHRcdHR5cGU6IFwicmVzcG9uc2VcIixcblx0XHRcdFx0XHR2YWx1ZToge30sXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKChlKSA9PiB7XG5cdFx0XHRcdHNlbGYucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRcdGlkOiBkYXRhLmlkLFxuXHRcdFx0XHRcdHR5cGU6IFwiZXJyb3JcIixcblx0XHRcdFx0XHRlcnJvcjogSlNPTi5zdHJpbmdpZnkoe1xuXHRcdFx0XHRcdFx0bmFtZTogXCJFcnJvclwiLFxuXHRcdFx0XHRcdFx0bWVzc2FnZTogZS5tZXNzYWdlLFxuXHRcdFx0XHRcdFx0c3RhY2s6IGUuc3RhY2ssXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIndvcmtlciBub3QgeWV0IHJlYWR5LiBSZXF1ZXN0IHR5cGU6IFwiICsgZGF0YS5yZXF1ZXN0VHlwZSlcblx0fVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFLYSxvQkFBTixNQUF3QjtDQUM5QjtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBRUEsWUFB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