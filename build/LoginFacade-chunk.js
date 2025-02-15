import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertWorkerOrNode, isAdminClient } from "./Env-chunk.js";
import { arrayEquals, assertNotNull, base64ToBase64Ext, base64ToBase64Url, base64ToUint8Array, base64UrlToBase64, defer, hexToUint8Array, neverNull, ofClass, uint8ArrayToBase64, utf8Uint8ArrayToString } from "./dist2-chunk.js";
import { AccountType, CloseEventBusOption, Const, DEFAULT_KDF_TYPE, KdfType, asKdfType } from "./TutanotaConstants-chunk.js";
import { GENERATED_ID_BYTES_LENGTH, isSameId } from "./EntityUtils-chunk.js";
import { TutanotaPropertiesTypeRef } from "./TypeRefs-chunk.js";
import { GroupInfoTypeRef, RecoverCodeTypeRef, SessionTypeRef, UserTypeRef, createChangeKdfPostIn, createChangePasswordPostIn, createCreateSessionData, createDeleteCustomerData, createResetFactorsDeleteData, createSaltData, createSecondFactorAuthDeleteData, createSecondFactorAuthGetData, createTakeOverDeletedAddressData, createVerifierTokenServiceIn } from "./TypeRefs2-chunk.js";
import { HttpMethod, MediaType, resolveTypeReference } from "./EntityFunctions-chunk.js";
import { AccessExpiredError, ConnectionError, LockedError, NotAuthenticatedError, NotFoundError, SessionExpiredError } from "./RestError-chunk.js";
import { CancelledError } from "./CancelledError-chunk.js";
import { ConnectMode, EntityRestClient, typeRefToPath } from "./EntityRestClient-chunk.js";
import { LoginIncompleteError } from "./LoginIncompleteError-chunk.js";
import { SessionType } from "./SessionType-chunk.js";
import { ChangeKdfService, ChangePasswordService, CustomerService, ResetFactorsService, SaltService, SecondFactorAuthService, SessionService, TakeOverDeletedAddressService, VerifierTokenService } from "./Services-chunk.js";
import { EntityClient } from "./EntityClient-chunk.js";
import { KeyLength, TotpVerifier, aes256DecryptWithRecoveryKey, aes256RandomKey, aesDecrypt, base64ToKey, createAuthVerifier, createAuthVerifierAsBase64Url, encryptKey, generateKeyFromPassphrase$1 as generateKeyFromPassphrase, generateRandomSalt, keyToUint8Array, sha256Hash, uint8ArrayToBitArray } from "./dist3-chunk.js";
import { LoginFailReason } from "./PageContextLoginListener-chunk.js";
import { CredentialType } from "./CredentialType-chunk.js";
import { encryptString } from "./CryptoWrapper-chunk.js";

//#region src/common/api/worker/facades/LoginFacade.ts
assertWorkerOrNode();
let ResumeSessionErrorReason = function(ResumeSessionErrorReason$1) {
	ResumeSessionErrorReason$1[ResumeSessionErrorReason$1["OfflineNotAvailableForFree"] = 0] = "OfflineNotAvailableForFree";
	return ResumeSessionErrorReason$1;
}({});
var LoginFacade = class {
	eventBusClient;
	/**
	* Used for cancelling second factor and to not mix different attempts
	*/
	loginRequestSessionId = null;
	/**
	* Used for cancelling second factor immediately
	*/
	loggingInPromiseWrapper = null;
	/** On platforms with offline cache we do the actual login asynchronously and we can retry it. This is the state of such async login. */
	asyncLoginState = { state: "idle" };
	constructor(restClient, entityClient, loginListener, instanceMapper, cryptoFacade, keyRotationFacade, cacheInitializer, serviceExecutor, userFacade, blobAccessTokenFacade, entropyFacade, databaseKeyFactory, argon2idFacade, noncachingEntityClient, sendError, cacheManagementFacade) {
		this.restClient = restClient;
		this.entityClient = entityClient;
		this.loginListener = loginListener;
		this.instanceMapper = instanceMapper;
		this.cryptoFacade = cryptoFacade;
		this.keyRotationFacade = keyRotationFacade;
		this.cacheInitializer = cacheInitializer;
		this.serviceExecutor = serviceExecutor;
		this.userFacade = userFacade;
		this.blobAccessTokenFacade = blobAccessTokenFacade;
		this.entropyFacade = entropyFacade;
		this.databaseKeyFactory = databaseKeyFactory;
		this.argon2idFacade = argon2idFacade;
		this.noncachingEntityClient = noncachingEntityClient;
		this.sendError = sendError;
		this.cacheManagementFacade = cacheManagementFacade;
	}
	init(eventBusClient) {
		this.eventBusClient = eventBusClient;
	}
	async resetSession() {
		this.eventBusClient.close(CloseEventBusOption.Terminate);
		await this.deInitCache();
		this.userFacade.reset();
	}
	/**
	* Create session and log in. Changes internal state to refer to the logged in user.
	*/
	async createSession(mailAddress, passphrase, clientIdentifier, sessionType, databaseKey) {
		if (this.userFacade.isPartiallyLoggedIn()) console.log("session already exists, reuse data");
		const { userPassphraseKey, kdfType } = await this.loadUserPassphraseKey(mailAddress, passphrase);
		const authVerifier = createAuthVerifierAsBase64Url(userPassphraseKey);
		const createSessionData = createCreateSessionData({
			accessKey: null,
			authToken: null,
			authVerifier,
			clientIdentifier,
			mailAddress: mailAddress.toLowerCase().trim(),
			recoverCodeVerifier: null,
			user: null
		});
		let accessKey = null;
		if (sessionType === SessionType.Persistent) {
			accessKey = aes256RandomKey();
			createSessionData.accessKey = keyToUint8Array(accessKey);
		}
		const createSessionReturn = await this.serviceExecutor.post(SessionService, createSessionData);
		const sessionData = await this.waitUntilSecondFactorApprovedOrCancelled(createSessionReturn, mailAddress);
		const forceNewDatabase = sessionType === SessionType.Persistent && databaseKey == null;
		if (forceNewDatabase) {
			console.log("generating new database key for persistent session");
			databaseKey = await this.databaseKeyFactory.generateKey();
		}
		const cacheInfo = await this.initCache({
			userId: sessionData.userId,
			databaseKey,
			timeRangeDays: null,
			forceNewDatabase
		});
		const { user, userGroupInfo, accessToken } = await this.initSession(sessionData.userId, sessionData.accessToken, userPassphraseKey);
		const modernKdfType = this.isModernKdfType(kdfType);
		if (!modernKdfType) await this.migrateKdfType(KdfType.Argon2id, passphrase, user);
		const credentials = {
			login: mailAddress,
			accessToken,
			encryptedPassword: sessionType === SessionType.Persistent ? uint8ArrayToBase64(encryptString(neverNull(accessKey), passphrase)) : null,
			encryptedPassphraseKey: sessionType === SessionType.Persistent ? encryptKey(neverNull(accessKey), userPassphraseKey) : null,
			userId: sessionData.userId,
			type: CredentialType.Internal
		};
		this.loginListener.onFullLoginSuccess(sessionType, cacheInfo, credentials);
		if (!isAdminClient()) await this.keyRotationFacade.initialize(userPassphraseKey, modernKdfType);
		return {
			user,
			userGroupInfo,
			sessionId: sessionData.sessionId,
			credentials,
			databaseKey: cacheInfo.isPersistent ? databaseKey : null
		};
	}
	/**
	* Ensure that the user is using a modern KDF type, migrating if not.
	* @param targetKdfType the current KDF type
	* @param passphrase either the plaintext passphrase or the encrypted passphrase with the access token necessary to decrypt it
	* @param user the user we are updating
	*/
	async migrateKdfType(targetKdfType, passphrase, user) {
		if (!Const.EXECUTE_KDF_MIGRATION) return;
		const currentPassphraseKeyData = {
			passphrase,
			kdfType: asKdfType(user.kdfVersion),
			salt: assertNotNull(user.salt, `current salt for user ${user._id} not found`)
		};
		const currentUserPassphraseKey = await this.deriveUserPassphraseKey(currentPassphraseKeyData);
		const currentAuthVerifier = createAuthVerifier(currentUserPassphraseKey);
		const newPassphraseKeyData = {
			passphrase,
			kdfType: targetKdfType,
			salt: generateRandomSalt()
		};
		const newUserPassphraseKey = await this.deriveUserPassphraseKey(newPassphraseKeyData);
		const currentUserGroupKey = this.userFacade.getCurrentUserGroupKey();
		const pwEncUserGroupKey = encryptKey(newUserPassphraseKey, currentUserGroupKey.object);
		const newAuthVerifier = createAuthVerifier(newUserPassphraseKey);
		const changeKdfPostIn = createChangeKdfPostIn({
			kdfVersion: newPassphraseKeyData.kdfType,
			salt: newPassphraseKeyData.salt,
			pwEncUserGroupKey,
			verifier: newAuthVerifier,
			oldVerifier: currentAuthVerifier,
			userGroupKeyVersion: String(currentUserGroupKey.version)
		});
		console.log("Migrate KDF from:", user.kdfVersion, "to", targetKdfType);
		await this.serviceExecutor.post(ChangeKdfService, changeKdfPostIn);
		await (await this.cacheManagementFacade()).reloadUser();
		this.userFacade.setUserGroupKeyDistributionKey(newUserPassphraseKey);
	}
	/**
	* Checks if the given KDF type is phased out.
	* @param kdfType
	* @private
	*/
	isModernKdfType(kdfType) {
		return kdfType !== KdfType.Bcrypt;
	}
	/**
	* If the second factor login has been cancelled a CancelledError is thrown.
	*/
	waitUntilSecondFactorApprovedOrCancelled(createSessionReturn, mailAddress) {
		let p = Promise.resolve();
		let sessionId = [this.getSessionListId(createSessionReturn.accessToken), this.getSessionElementId(createSessionReturn.accessToken)];
		this.loginRequestSessionId = sessionId;
		if (createSessionReturn.challenges.length > 0) {
			this.loginListener.onSecondFactorChallenge(sessionId, createSessionReturn.challenges, mailAddress);
			p = this.waitUntilSecondFactorApproved(createSessionReturn.accessToken, sessionId, 0);
		}
		this.loggingInPromiseWrapper = defer();
		return Promise.race([this.loggingInPromiseWrapper.promise, p]).then(() => ({
			sessionId,
			accessToken: createSessionReturn.accessToken,
			userId: createSessionReturn.user
		}));
	}
	async waitUntilSecondFactorApproved(accessToken, sessionId, retryOnNetworkError) {
		let secondFactorAuthGetData = createSecondFactorAuthGetData({ accessToken });
		try {
			const secondFactorAuthGetReturn = await this.serviceExecutor.get(SecondFactorAuthService, secondFactorAuthGetData);
			if (!this.loginRequestSessionId || !isSameId(this.loginRequestSessionId, sessionId)) throw new CancelledError("login cancelled");
			if (secondFactorAuthGetReturn.secondFactorPending) return this.waitUntilSecondFactorApproved(accessToken, sessionId, 0);
		} catch (e) {
			if (e instanceof ConnectionError && retryOnNetworkError < 10) return this.waitUntilSecondFactorApproved(accessToken, sessionId, retryOnNetworkError + 1);
			throw e;
		}
	}
	/**
	* Create external (temporary mailbox for passphrase-protected emails) session and log in.
	* Changes internal state to refer to the logged-in user.
	*/
	async createExternalSession(userId, passphrase, salt, kdfType, clientIdentifier, persistentSession) {
		if (this.userFacade.isPartiallyLoggedIn()) throw new Error("user already logged in");
		const userPassphraseKey = await this.deriveUserPassphraseKey({
			kdfType,
			passphrase,
			salt
		});
		const authVerifier = createAuthVerifierAsBase64Url(userPassphraseKey);
		const authToken = base64ToBase64Url(uint8ArrayToBase64(sha256Hash(salt)));
		const sessionData = createCreateSessionData({
			accessKey: null,
			authToken,
			authVerifier,
			clientIdentifier,
			mailAddress: null,
			recoverCodeVerifier: null,
			user: userId
		});
		let accessKey = null;
		if (persistentSession) {
			accessKey = aes256RandomKey();
			sessionData.accessKey = keyToUint8Array(accessKey);
		}
		const createSessionReturn = await this.serviceExecutor.post(SessionService, sessionData);
		let sessionId = [this.getSessionListId(createSessionReturn.accessToken), this.getSessionElementId(createSessionReturn.accessToken)];
		const cacheInfo = await this.initCache({
			userId,
			databaseKey: null,
			timeRangeDays: null,
			forceNewDatabase: true
		});
		const { user, userGroupInfo, accessToken } = await this.initSession(createSessionReturn.user, createSessionReturn.accessToken, userPassphraseKey);
		const credentials = {
			login: userId,
			accessToken,
			encryptedPassword: accessKey ? uint8ArrayToBase64(encryptString(accessKey, passphrase)) : null,
			encryptedPassphraseKey: accessKey ? encryptKey(accessKey, userPassphraseKey) : null,
			userId,
			type: CredentialType.External
		};
		this.loginListener.onFullLoginSuccess(SessionType.Login, cacheInfo, credentials);
		return {
			user,
			userGroupInfo,
			sessionId,
			credentials,
			databaseKey: null
		};
	}
	/**
	* Derive a key given a KDF type, passphrase, and salt
	*/
	async deriveUserPassphraseKey({ kdfType, passphrase, salt }) {
		switch (kdfType) {
			case KdfType.Bcrypt: return generateKeyFromPassphrase(passphrase, salt, KeyLength.b128);
			case KdfType.Argon2id: return this.argon2idFacade.generateKeyFromPassphrase(passphrase, salt);
		}
	}
	/** Cancels 2FA process. */
	async cancelCreateSession(sessionId) {
		if (!this.loginRequestSessionId || !isSameId(this.loginRequestSessionId, sessionId)) throw new Error("Trying to cancel session creation but the state is invalid");
		const secondFactorAuthDeleteData = createSecondFactorAuthDeleteData({ session: sessionId });
		await this.serviceExecutor.delete(SecondFactorAuthService, secondFactorAuthDeleteData).catch(ofClass(NotFoundError, (e) => {
			console.warn("Tried to cancel second factor but it was not there anymore", e);
		})).catch(ofClass(LockedError, (e) => {
			console.warn("Tried to cancel second factor but it is currently locked", e);
		}));
		this.loginRequestSessionId = null;
		this.loggingInPromiseWrapper?.reject(new CancelledError("login cancelled"));
	}
	/** Finishes 2FA process either using second factor or approving session on another client. */
	async authenticateWithSecondFactor(data, host) {
		await this.serviceExecutor.post(SecondFactorAuthService, data, { baseUrl: host });
	}
	/**
	* Resumes previously created session (using persisted credentials).
	* @param credentials the saved credentials to use
	* @param externalUserKeyDeriver information for deriving a key (if external user)
	* @param databaseKey key to unlock the local database (if enabled)
	* @param timeRangeDays the user configured time range for the offline database
	*/
	async resumeSession(credentials, externalUserKeyDeriver, databaseKey, timeRangeDays) {
		if (this.userFacade.getUser() != null) throw new ProgrammingError(`Trying to resume the session for user ${credentials.userId} while already logged in for ${this.userFacade.getUser()?._id}`);
		if (this.asyncLoginState.state !== "idle") throw new ProgrammingError(`Trying to resume the session for user ${credentials.userId} while the asyncLoginState is ${this.asyncLoginState.state}`);
		this.userFacade.setAccessToken(credentials.accessToken);
		const cacheInfo = await this.initCache({
			userId: credentials.userId,
			databaseKey,
			timeRangeDays,
			forceNewDatabase: false
		});
		const sessionId = this.getSessionId(credentials);
		try {
			if (cacheInfo?.isPersistent && !cacheInfo.isNewOfflineDb) {
				const user = await this.entityClient.load(UserTypeRef, credentials.userId);
				if (user.accountType !== AccountType.PAID) return await this.finishResumeSession(credentials, externalUserKeyDeriver, cacheInfo).catch(ofClass(ConnectionError, async () => {
					await this.resetSession();
					return {
						type: "error",
						reason: ResumeSessionErrorReason.OfflineNotAvailableForFree
					};
				}));
				this.userFacade.setUser(user);
				let userGroupInfo;
				try {
					userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo);
				} catch (e) {
					console.log("Could not do start login, groupInfo is not cached, falling back to sync login");
					if (e instanceof LoginIncompleteError) return await this.finishResumeSession(credentials, externalUserKeyDeriver, cacheInfo);
else throw e;
				}
				Promise.resolve().then(() => this.asyncResumeSession(credentials, cacheInfo));
				const data = {
					user,
					userGroupInfo,
					sessionId
				};
				return {
					type: "success",
					data
				};
			} else return await this.finishResumeSession(credentials, externalUserKeyDeriver, cacheInfo);
		} catch (e) {
			await this.resetSession();
			throw e;
		}
	}
	getSessionId(credentials) {
		return [this.getSessionListId(credentials.accessToken), this.getSessionElementId(credentials.accessToken)];
	}
	async asyncResumeSession(credentials, cacheInfo) {
		if (this.asyncLoginState.state === "running") throw new Error("finishLoginResume run in parallel");
		this.asyncLoginState = { state: "running" };
		try {
			await this.finishResumeSession(credentials, null, cacheInfo);
		} catch (e) {
			if (e instanceof NotAuthenticatedError || e instanceof SessionExpiredError) {
				this.asyncLoginState = { state: "idle" };
				await this.loginListener.onLoginFailure(LoginFailReason.SessionExpired);
			} else {
				this.asyncLoginState = {
					state: "failed",
					credentials,
					cacheInfo
				};
				if (!(e instanceof ConnectionError)) await this.sendError(e);
				await this.loginListener.onLoginFailure(LoginFailReason.Error);
			}
		}
	}
	async finishResumeSession(credentials, externalUserKeyDeriver, cacheInfo) {
		const sessionId = this.getSessionId(credentials);
		const sessionData = await this.loadSessionData(credentials.accessToken);
		const accessKey = assertNotNull(sessionData.accessKey, "no access key on session data!");
		const isExternalUser = externalUserKeyDeriver != null;
		let userPassphraseKey;
		let credentialsWithPassphraseKey;
		if (credentials.encryptedPassword) {
			const passphrase = utf8Uint8ArrayToString(aesDecrypt(accessKey, base64ToUint8Array(credentials.encryptedPassword)));
			if (isExternalUser) {
				await this.checkOutdatedExternalSalt(credentials, sessionData, externalUserKeyDeriver.salt);
				userPassphraseKey = await this.deriveUserPassphraseKey({
					...externalUserKeyDeriver,
					passphrase
				});
			} else {
				const passphraseData = await this.loadUserPassphraseKey(credentials.login, passphrase);
				userPassphraseKey = passphraseData.userPassphraseKey;
			}
			const encryptedPassphraseKey = encryptKey(accessKey, userPassphraseKey);
			credentialsWithPassphraseKey = {
				...credentials,
				encryptedPassphraseKey
			};
		} else throw new ProgrammingError("no key or password stored in credentials!");
		const { user, userGroupInfo } = await this.initSession(sessionData.userId, credentials.accessToken, userPassphraseKey);
		this.loginListener.onFullLoginSuccess(SessionType.Persistent, cacheInfo, credentialsWithPassphraseKey);
		this.asyncLoginState = { state: "idle" };
		const data = {
			user,
			userGroupInfo,
			sessionId
		};
		const modernKdfType = this.isModernKdfType(asKdfType(user.kdfVersion));
		if (!isExternalUser && credentials.encryptedPassword != null && !modernKdfType) {
			const passphrase = utf8Uint8ArrayToString(aesDecrypt(accessKey, base64ToUint8Array(credentials.encryptedPassword)));
			await this.migrateKdfType(KdfType.Argon2id, passphrase, user);
		}
		if (!isExternalUser && !isAdminClient()) await this.keyRotationFacade.initialize(userPassphraseKey, modernKdfType);
		return {
			type: "success",
			data
		};
	}
	async initSession(userId, accessToken, userPassphraseKey) {
		const userIdFromFormerLogin = this.userFacade.getUser()?._id ?? null;
		if (userIdFromFormerLogin && userId !== userIdFromFormerLogin) throw new Error("different user is tried to login in existing other user's session");
		this.userFacade.setAccessToken(accessToken);
		try {
			const user = await this.noncachingEntityClient.load(UserTypeRef, userId);
			await this.checkOutdatedVerifier(user, accessToken, userPassphraseKey);
			this.userFacade.setUser(user);
			const wasFullyLoggedIn = this.userFacade.isFullyLoggedIn();
			this.userFacade.unlockUserGroupKey(userPassphraseKey);
			const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo);
			await this.loadEntropy();
			if (wasFullyLoggedIn) this.eventBusClient.connect(ConnectMode.Reconnect);
else this.eventBusClient.connect(ConnectMode.Initial);
			await this.entropyFacade.storeEntropy();
			return {
				user,
				accessToken,
				userGroupInfo
			};
		} catch (e) {
			this.resetSession();
			throw e;
		}
	}
	/**
	* init an appropriate cache implementation. we will always try to create a persistent cache for persistent sessions and fall back to an ephemeral cache
	* in the browser.
	*
	* @param userId the user for which the cache is created
	* @param databaseKey the key to use
	* @param timeRangeDays how far into the past the cache keeps data around
	* @param forceNewDatabase true if the old database should be deleted if there is one
	* @private
	*/
	async initCache({ userId, databaseKey, timeRangeDays, forceNewDatabase }) {
		if (databaseKey != null) return {
			databaseKey,
			...await this.cacheInitializer.initialize({
				type: "offline",
				userId,
				databaseKey,
				timeRangeDays,
				forceNewDatabase
			})
		};
else return {
			databaseKey: null,
			...await this.cacheInitializer.initialize({
				type: "ephemeral",
				userId
			})
		};
	}
	async deInitCache() {
		return this.cacheInitializer.deInitialize();
	}
	/**
	* Check whether the passed salt for external user is up-to-date (whether an outdated link was used).
	*/
	async checkOutdatedExternalSalt(credentials, sessionData, externalUserSalt) {
		this.userFacade.setAccessToken(credentials.accessToken);
		const user = await this.entityClient.load(UserTypeRef, sessionData.userId);
		const latestSaltHash = assertNotNull(user.externalAuthInfo.latestSaltHash, "latestSaltHash is not set!");
		if (!arrayEquals(latestSaltHash, sha256Hash(externalUserSalt))) {
			this.resetSession();
			throw new AccessExpiredError("Salt changed, outdated link?");
		}
	}
	/**
	* Check that the auth verifier is not changed e.g. due to the password change.
	* Normally this won't happen for internal users as all sessions are closed on password change. This may happen for external users when the sender has
	* changed the password.
	* We do not delete all sessions on the server when changing the external password to avoid that an external user is immediately logged out.
	*
	* @param user Should be up-to-date, i.e., not loaded from cache, but fresh from the server, otherwise an outdated verifier will cause a logout.
	*/
	async checkOutdatedVerifier(user, accessToken, userPassphraseKey) {
		if (uint8ArrayToBase64(user.verifier) !== uint8ArrayToBase64(sha256Hash(createAuthVerifier(userPassphraseKey)))) {
			console.log("Auth verifier has changed");
			await this.deleteSession(accessToken).catch((e) => console.error("Could not delete session", e));
			await this.resetSession();
			throw new NotAuthenticatedError("Auth verifier has changed");
		}
	}
	async loadUserPassphraseKey(mailAddress, passphrase) {
		mailAddress = mailAddress.toLowerCase().trim();
		const saltRequest = createSaltData({ mailAddress });
		const saltReturn = await this.serviceExecutor.get(SaltService, saltRequest);
		const kdfType = asKdfType(saltReturn.kdfVersion);
		return {
			userPassphraseKey: await this.deriveUserPassphraseKey({
				kdfType,
				passphrase,
				salt: saltReturn.salt
			}),
			kdfType
		};
	}
	/**
	* We use the accessToken that should be deleted for authentication. Therefore it can be invoked while logged in or logged out.
	*
	* @param pushIdentifier identifier associated with this device, if any, to delete PushIdentifier on the server
	*/
	async deleteSession(accessToken, pushIdentifier = null) {
		let path = typeRefToPath(SessionTypeRef) + "/" + this.getSessionListId(accessToken) + "/" + this.getSessionElementId(accessToken);
		const sessionTypeModel = await resolveTypeReference(SessionTypeRef);
		const headers = {
			accessToken: neverNull(accessToken),
			v: sessionTypeModel.version
		};
		const queryParams = pushIdentifier == null ? {} : { pushIdentifier };
		return this.restClient.request(path, HttpMethod.DELETE, {
			headers,
			responseType: MediaType.Json,
			queryParams
		}).catch(ofClass(NotAuthenticatedError, () => {
			console.log("authentication failed => session is already closed");
		})).catch(ofClass(NotFoundError, () => {
			console.log("authentication failed => session instance is already deleted");
		}));
	}
	getSessionElementId(accessToken) {
		let byteAccessToken = base64ToUint8Array(base64UrlToBase64(neverNull(accessToken)));
		return base64ToBase64Url(uint8ArrayToBase64(sha256Hash(byteAccessToken.slice(GENERATED_ID_BYTES_LENGTH))));
	}
	getSessionListId(accessToken) {
		let byteAccessToken = base64ToUint8Array(base64UrlToBase64(neverNull(accessToken)));
		return base64ToBase64Ext(uint8ArrayToBase64(byteAccessToken.slice(0, GENERATED_ID_BYTES_LENGTH)));
	}
	async loadSessionData(accessToken) {
		const path = typeRefToPath(SessionTypeRef) + "/" + this.getSessionListId(accessToken) + "/" + this.getSessionElementId(accessToken);
		const SessionTypeModel = await resolveTypeReference(SessionTypeRef);
		let headers = {
			accessToken,
			v: SessionTypeModel.version
		};
		return this.restClient.request(path, HttpMethod.GET, {
			headers,
			responseType: MediaType.Json
		}).then((instance) => {
			let session = JSON.parse(instance);
			return {
				userId: session.user,
				accessKey: session.accessKey ? base64ToKey(session.accessKey) : null
			};
		});
	}
	/**
	* Loads entropy from the last logout.
	*/
	async loadEntropy() {
		const tutanotaProperties = await this.entityClient.loadRoot(TutanotaPropertiesTypeRef, this.userFacade.getUserGroupId());
		return this.entropyFacade.loadEntropy(tutanotaProperties);
	}
	/**
	* Change password and/or KDF type for the current user. This will cause all other sessions to be closed.
	* @return New password encrypted with accessKey if this is a persistent session or {@code null}  if it's an ephemeral one.
	*/
	async changePassword(currentPasswordKeyData, newPasswordKeyDataTemplate) {
		const currentUserPassphraseKey = await this.deriveUserPassphraseKey(currentPasswordKeyData);
		const currentAuthVerifier = createAuthVerifier(currentUserPassphraseKey);
		const newPasswordKeyData = {
			...newPasswordKeyDataTemplate,
			salt: generateRandomSalt()
		};
		const newUserPassphraseKey = await this.deriveUserPassphraseKey(newPasswordKeyData);
		const currentUserGroupKey = this.userFacade.getCurrentUserGroupKey();
		const pwEncUserGroupKey = encryptKey(newUserPassphraseKey, currentUserGroupKey.object);
		const authVerifier = createAuthVerifier(newUserPassphraseKey);
		const service = createChangePasswordPostIn({
			code: null,
			kdfVersion: newPasswordKeyDataTemplate.kdfType,
			oldVerifier: currentAuthVerifier,
			pwEncUserGroupKey,
			recoverCodeVerifier: null,
			salt: newPasswordKeyData.salt,
			verifier: authVerifier,
			userGroupKeyVersion: String(currentUserGroupKey.version)
		});
		await this.serviceExecutor.post(ChangePasswordService, service);
		this.userFacade.setUserGroupKeyDistributionKey(newUserPassphraseKey);
		const accessToken = assertNotNull(this.userFacade.getAccessToken());
		const sessionData = await this.loadSessionData(accessToken);
		if (sessionData.accessKey != null) {
			const newEncryptedPassphrase = uint8ArrayToBase64(encryptString(sessionData.accessKey, newPasswordKeyDataTemplate.passphrase));
			const newEncryptedPassphraseKey = encryptKey(sessionData.accessKey, newUserPassphraseKey);
			return {
				newEncryptedPassphrase,
				newEncryptedPassphraseKey
			};
		} else return null;
	}
	async deleteAccount(password, takeover, surveyData = null) {
		const userSalt = assertNotNull(this.userFacade.getLoggedInUser().salt);
		const passphraseKeyData = {
			kdfType: asKdfType(this.userFacade.getLoggedInUser().kdfVersion),
			passphrase: password,
			salt: userSalt
		};
		const passwordKey = await this.deriveUserPassphraseKey(passphraseKeyData);
		const deleteCustomerData = createDeleteCustomerData({
			authVerifier: createAuthVerifier(passwordKey),
			reason: null,
			takeoverMailAddress: null,
			undelete: false,
			customer: neverNull(neverNull(this.userFacade.getLoggedInUser()).customer),
			surveyData
		});
		if (takeover !== "") deleteCustomerData.takeoverMailAddress = takeover;
else deleteCustomerData.takeoverMailAddress = null;
		await this.serviceExecutor.delete(CustomerService, deleteCustomerData);
	}
	/** Changes user password to another one using recoverCode instead of the old password. */
	async recoverLogin(mailAddress, recoverCode, newPassword, clientIdentifier) {
		const recoverCodeKey = uint8ArrayToBitArray(hexToUint8Array(recoverCode));
		const recoverCodeVerifier = createAuthVerifier(recoverCodeKey);
		const recoverCodeVerifierBase64 = base64ToBase64Url(uint8ArrayToBase64(recoverCodeVerifier));
		const sessionData = createCreateSessionData({
			accessKey: null,
			authToken: null,
			authVerifier: null,
			clientIdentifier,
			mailAddress: mailAddress.toLowerCase().trim(),
			recoverCodeVerifier: recoverCodeVerifierBase64,
			user: null
		});
		const tempAuthDataProvider = {
			createAuthHeaders() {
				return {};
			},
			isFullyLoggedIn() {
				return false;
			}
		};
		const eventRestClient = new EntityRestClient(tempAuthDataProvider, this.restClient, () => this.cryptoFacade, this.instanceMapper, this.blobAccessTokenFacade);
		const entityClient = new EntityClient(eventRestClient);
		const createSessionReturn = await this.serviceExecutor.post(SessionService, sessionData);
		const { userId, accessToken } = await this.waitUntilSecondFactorApprovedOrCancelled(createSessionReturn, null);
		const user = await entityClient.load(UserTypeRef, userId, { extraHeaders: { accessToken } });
		if (user.auth == null || user.auth.recoverCode == null) throw new Error("missing recover code");
		const recoverCodeExtraHeaders = {
			accessToken,
			recoverCodeVerifier: recoverCodeVerifierBase64
		};
		const recoverCodeData = await entityClient.load(RecoverCodeTypeRef, user.auth.recoverCode, { extraHeaders: recoverCodeExtraHeaders });
		try {
			const groupKey = aes256DecryptWithRecoveryKey(recoverCodeKey, recoverCodeData.recoverCodeEncUserGroupKey);
			const salt = generateRandomSalt();
			const newKdfType = DEFAULT_KDF_TYPE;
			const newPassphraseKeyData = {
				kdfType: newKdfType,
				passphrase: newPassword,
				salt
			};
			const userPassphraseKey = await this.deriveUserPassphraseKey(newPassphraseKeyData);
			const pwEncUserGroupKey = encryptKey(userPassphraseKey, groupKey);
			const newPasswordVerifier = createAuthVerifier(userPassphraseKey);
			const postData = createChangePasswordPostIn({
				code: null,
				kdfVersion: newKdfType,
				oldVerifier: null,
				salt,
				pwEncUserGroupKey,
				verifier: newPasswordVerifier,
				recoverCodeVerifier,
				userGroupKeyVersion: recoverCodeData.userKeyVersion
			});
			const extraHeaders = { accessToken };
			await this.serviceExecutor.post(ChangePasswordService, postData, { extraHeaders });
		} finally {
			this.deleteSession(accessToken);
		}
	}
	/** Deletes second factors using recoverCode as second factor. */
	resetSecondFactors(mailAddress, password, recoverCode) {
		return this.loadUserPassphraseKey(mailAddress, password).then((passphraseReturn) => {
			const authVerifier = createAuthVerifierAsBase64Url(passphraseReturn.userPassphraseKey);
			const recoverCodeKey = uint8ArrayToBitArray(hexToUint8Array(recoverCode));
			const recoverCodeVerifier = createAuthVerifierAsBase64Url(recoverCodeKey);
			const deleteData = createResetFactorsDeleteData({
				mailAddress,
				authVerifier,
				recoverCodeVerifier
			});
			return this.serviceExecutor.delete(ResetFactorsService, deleteData);
		});
	}
	takeOverDeletedAddress(mailAddress, password, recoverCode, targetAccountMailAddress) {
		return this.loadUserPassphraseKey(mailAddress, password).then((passphraseReturn) => {
			const authVerifier = createAuthVerifierAsBase64Url(passphraseReturn.userPassphraseKey);
			let recoverCodeVerifier = null;
			if (recoverCode) {
				const recoverCodeKey = uint8ArrayToBitArray(hexToUint8Array(recoverCode));
				recoverCodeVerifier = createAuthVerifierAsBase64Url(recoverCodeKey);
			}
			let data = createTakeOverDeletedAddressData({
				mailAddress,
				authVerifier,
				recoverCodeVerifier,
				targetAccountMailAddress
			});
			return this.serviceExecutor.post(TakeOverDeletedAddressService, data);
		});
	}
	generateTotpSecret() {
		return this.getTotpVerifier().then((totp) => totp.generateSecret());
	}
	generateTotpCode(time, key) {
		return this.getTotpVerifier().then((totp) => totp.generateTotp(time, key));
	}
	getTotpVerifier() {
		return Promise.resolve(new TotpVerifier());
	}
	async retryAsyncLogin() {
		if (this.asyncLoginState.state === "running") return;
else if (this.asyncLoginState.state === "failed") await this.asyncResumeSession(this.asyncLoginState.credentials, this.asyncLoginState.cacheInfo);
else throw new Error("credentials went missing");
	}
	/**
	* Returns a verifier token, which is proof of password authentication and is valid for a limited time.
	* This token will have to be passed back to the server with the appropriate call.
	*/
	async getVerifierToken(passphrase) {
		const user = this.userFacade.getLoggedInUser();
		const passphraseKey = await this.deriveUserPassphraseKey({
			kdfType: asKdfType(user.kdfVersion),
			passphrase,
			salt: assertNotNull(user.salt)
		});
		const authVerifier = createAuthVerifier(passphraseKey);
		const out = await this.serviceExecutor.post(VerifierTokenService, createVerifierTokenServiceIn({ authVerifier }));
		return out.token;
	}
};

//#endregion
export { LoginFacade, ResumeSessionErrorReason };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTG9naW5GYWNhZGUtY2h1bmsuanMiLCJuYW1lcyI6WyJyZXN0Q2xpZW50OiBSZXN0Q2xpZW50IiwiZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQiLCJsb2dpbkxpc3RlbmVyOiBMb2dpbkxpc3RlbmVyIiwiaW5zdGFuY2VNYXBwZXI6IEluc3RhbmNlTWFwcGVyIiwiY3J5cHRvRmFjYWRlOiBDcnlwdG9GYWNhZGUiLCJrZXlSb3RhdGlvbkZhY2FkZTogS2V5Um90YXRpb25GYWNhZGUiLCJjYWNoZUluaXRpYWxpemVyOiBDYWNoZVN0b3JhZ2VMYXRlSW5pdGlhbGl6ZXIiLCJzZXJ2aWNlRXhlY3V0b3I6IElTZXJ2aWNlRXhlY3V0b3IiLCJ1c2VyRmFjYWRlOiBVc2VyRmFjYWRlIiwiYmxvYkFjY2Vzc1Rva2VuRmFjYWRlOiBCbG9iQWNjZXNzVG9rZW5GYWNhZGUiLCJlbnRyb3B5RmFjYWRlOiBFbnRyb3B5RmFjYWRlIiwiZGF0YWJhc2VLZXlGYWN0b3J5OiBEYXRhYmFzZUtleUZhY3RvcnkiLCJhcmdvbjJpZEZhY2FkZTogQXJnb24yaWRGYWNhZGUiLCJub25jYWNoaW5nRW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQiLCJzZW5kRXJyb3I6IChlcnJvcjogRXJyb3IpID0+IFByb21pc2U8dm9pZD4iLCJjYWNoZU1hbmFnZW1lbnRGYWNhZGU6IGxhenlBc3luYzxDYWNoZU1hbmFnZW1lbnRGYWNhZGU+IiwiZXZlbnRCdXNDbGllbnQ6IEV2ZW50QnVzQ2xpZW50IiwibWFpbEFkZHJlc3M6IHN0cmluZyIsInBhc3NwaHJhc2U6IHN0cmluZyIsImNsaWVudElkZW50aWZpZXI6IHN0cmluZyIsInNlc3Npb25UeXBlOiBTZXNzaW9uVHlwZSIsImRhdGFiYXNlS2V5OiBVaW50OEFycmF5IHwgbnVsbCIsImFjY2Vzc0tleTogQWVzS2V5IHwgbnVsbCIsInRhcmdldEtkZlR5cGU6IEtkZlR5cGUiLCJ1c2VyOiBVc2VyIiwia2RmVHlwZTogS2RmVHlwZSIsImNyZWF0ZVNlc3Npb25SZXR1cm46IENyZWF0ZVNlc3Npb25SZXR1cm4iLCJtYWlsQWRkcmVzczogc3RyaW5nIHwgbnVsbCIsImFjY2Vzc1Rva2VuOiBCYXNlNjRVcmwiLCJzZXNzaW9uSWQ6IElkVHVwbGUiLCJyZXRyeU9uTmV0d29ya0Vycm9yOiBudW1iZXIiLCJ1c2VySWQ6IElkIiwic2FsdDogVWludDhBcnJheSIsInBlcnNpc3RlbnRTZXNzaW9uOiBib29sZWFuIiwiYWNjZXNzS2V5OiBBZXMyNTZLZXkgfCBudWxsIiwiZGF0YTogU2Vjb25kRmFjdG9yQXV0aERhdGEiLCJob3N0Pzogc3RyaW5nIiwiY3JlZGVudGlhbHM6IENyZWRlbnRpYWxzIiwiZXh0ZXJuYWxVc2VyS2V5RGVyaXZlcjogRXh0ZXJuYWxVc2VyS2V5RGVyaXZlciB8IG51bGwiLCJ0aW1lUmFuZ2VEYXlzOiBudW1iZXIgfCBudWxsIiwidXNlckdyb3VwSW5mbzogR3JvdXBJbmZvIiwiY2FjaGVJbmZvOiBDYWNoZUluZm8iLCJ1c2VyUGFzc3BocmFzZUtleTogQWVzS2V5IiwiY3JlZGVudGlhbHNXaXRoUGFzc3BocmFzZUtleTogQ3JlZGVudGlhbHMiLCJzZXNzaW9uRGF0YToge1xuXHRcdFx0dXNlcklkOiBJZFxuXHRcdFx0YWNjZXNzS2V5OiBBZXNLZXkgfCBudWxsXG5cdFx0fSIsImV4dGVybmFsVXNlclNhbHQ6IFVpbnQ4QXJyYXkiLCJhY2Nlc3NUb2tlbjogc3RyaW5nIiwidXNlclBhc3NwaHJhc2VLZXk6IEFlczEyOEtleSIsInB1c2hJZGVudGlmaWVyOiBzdHJpbmcgfCBudWxsIiwicXVlcnlQYXJhbXM6IERpY3QiLCJjdXJyZW50UGFzc3dvcmRLZXlEYXRhOiBQYXNzcGhyYXNlS2V5RGF0YSIsIm5ld1Bhc3N3b3JkS2V5RGF0YVRlbXBsYXRlOiBPbWl0PFBhc3NwaHJhc2VLZXlEYXRhLCBcInNhbHRcIj4iLCJwYXNzd29yZDogc3RyaW5nIiwidGFrZW92ZXI6IHN0cmluZyIsInN1cnZleURhdGE6IFN1cnZleURhdGEgfCBudWxsIiwicmVjb3ZlckNvZGU6IHN0cmluZyIsIm5ld1Bhc3N3b3JkOiBzdHJpbmciLCJ0ZW1wQXV0aERhdGFQcm92aWRlcjogQXV0aERhdGFQcm92aWRlciIsInJlY292ZXJDb2RlOiBIZXgiLCJyZWNvdmVyQ29kZTogSGV4IHwgbnVsbCIsInRhcmdldEFjY291bnRNYWlsQWRkcmVzczogc3RyaW5nIiwicmVjb3ZlckNvZGVWZXJpZmllcjogQmFzZTY0IHwgbnVsbCIsInRpbWU6IG51bWJlciIsImtleTogVWludDhBcnJheSJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL0xvZ2luRmFjYWRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdGFycmF5RXF1YWxzLFxuXHRhc3NlcnROb3ROdWxsLFxuXHRCYXNlNjQsXG5cdGJhc2U2NFRvQmFzZTY0RXh0LFxuXHRiYXNlNjRUb0Jhc2U2NFVybCxcblx0YmFzZTY0VG9VaW50OEFycmF5LFxuXHRCYXNlNjRVcmwsXG5cdGJhc2U2NFVybFRvQmFzZTY0LFxuXHRkZWZlcixcblx0RGVmZXJyZWRPYmplY3QsXG5cdEhleCxcblx0aGV4VG9VaW50OEFycmF5LFxuXHRsYXp5QXN5bmMsXG5cdG5ldmVyTnVsbCxcblx0b2ZDbGFzcyxcblx0dWludDhBcnJheVRvQmFzZTY0LFxuXHR1dGY4VWludDhBcnJheVRvU3RyaW5nLFxufSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7XG5cdENoYW5nZUtkZlNlcnZpY2UsXG5cdENoYW5nZVBhc3N3b3JkU2VydmljZSxcblx0Q3VzdG9tZXJTZXJ2aWNlLFxuXHRSZXNldEZhY3RvcnNTZXJ2aWNlLFxuXHRTYWx0U2VydmljZSxcblx0U2Vjb25kRmFjdG9yQXV0aFNlcnZpY2UsXG5cdFNlc3Npb25TZXJ2aWNlLFxuXHRUYWtlT3ZlckRlbGV0ZWRBZGRyZXNzU2VydmljZSxcblx0VmVyaWZpZXJUb2tlblNlcnZpY2UsXG59IGZyb20gXCIuLi8uLi9lbnRpdGllcy9zeXMvU2VydmljZXNcIlxuaW1wb3J0IHsgQWNjb3VudFR5cGUsIGFzS2RmVHlwZSwgQ2xvc2VFdmVudEJ1c09wdGlvbiwgQ29uc3QsIERFRkFVTFRfS0RGX1RZUEUsIEtkZlR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7XG5cdENoYWxsZW5nZSxcblx0Y3JlYXRlQ2hhbmdlS2RmUG9zdEluLFxuXHRjcmVhdGVDaGFuZ2VQYXNzd29yZFBvc3RJbixcblx0Y3JlYXRlQ3JlYXRlU2Vzc2lvbkRhdGEsXG5cdGNyZWF0ZURlbGV0ZUN1c3RvbWVyRGF0YSxcblx0Y3JlYXRlUmVzZXRGYWN0b3JzRGVsZXRlRGF0YSxcblx0Y3JlYXRlU2FsdERhdGEsXG5cdGNyZWF0ZVNlY29uZEZhY3RvckF1dGhEZWxldGVEYXRhLFxuXHRjcmVhdGVTZWNvbmRGYWN0b3JBdXRoR2V0RGF0YSxcblx0Q3JlYXRlU2Vzc2lvblJldHVybixcblx0Y3JlYXRlVGFrZU92ZXJEZWxldGVkQWRkcmVzc0RhdGEsXG5cdGNyZWF0ZVZlcmlmaWVyVG9rZW5TZXJ2aWNlSW4sXG5cdEdyb3VwSW5mbyxcblx0R3JvdXBJbmZvVHlwZVJlZixcblx0UmVjb3ZlckNvZGVUeXBlUmVmLFxuXHRTZWNvbmRGYWN0b3JBdXRoRGF0YSxcblx0U2Vzc2lvblR5cGVSZWYsXG5cdFN1cnZleURhdGEsXG5cdFVzZXIsXG5cdFVzZXJUeXBlUmVmLFxufSBmcm9tIFwiLi4vLi4vZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IFR1dGFub3RhUHJvcGVydGllc1R5cGVSZWYgfSBmcm9tIFwiLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgSHR0cE1ldGhvZCwgTWVkaWFUeXBlLCByZXNvbHZlVHlwZVJlZmVyZW5jZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5RnVuY3Rpb25zXCJcbmltcG9ydCB7IGFzc2VydFdvcmtlck9yTm9kZSwgaXNBZG1pbkNsaWVudCB9IGZyb20gXCIuLi8uLi9jb21tb24vRW52XCJcbmltcG9ydCB7IENvbm5lY3RNb2RlLCBFdmVudEJ1c0NsaWVudCB9IGZyb20gXCIuLi9FdmVudEJ1c0NsaWVudFwiXG5pbXBvcnQgeyBFbnRpdHlSZXN0Q2xpZW50LCB0eXBlUmVmVG9QYXRoIH0gZnJvbSBcIi4uL3Jlc3QvRW50aXR5UmVzdENsaWVudFwiXG5pbXBvcnQgeyBBY2Nlc3NFeHBpcmVkRXJyb3IsIENvbm5lY3Rpb25FcnJvciwgTG9ja2VkRXJyb3IsIE5vdEF1dGhlbnRpY2F0ZWRFcnJvciwgTm90Rm91bmRFcnJvciwgU2Vzc2lvbkV4cGlyZWRFcnJvciB9IGZyb20gXCIuLi8uLi9jb21tb24vZXJyb3IvUmVzdEVycm9yXCJcbmltcG9ydCB7IENhbmNlbGxlZEVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9DYW5jZWxsZWRFcnJvclwiXG5pbXBvcnQgeyBSZXN0Q2xpZW50IH0gZnJvbSBcIi4uL3Jlc3QvUmVzdENsaWVudFwiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0VudGl0eUNsaWVudFwiXG5pbXBvcnQgeyBHRU5FUkFURURfSURfQllURVNfTEVOR1RILCBpc1NhbWVJZCB9IGZyb20gXCIuLi8uLi9jb21tb24vdXRpbHMvRW50aXR5VXRpbHNcIlxuaW1wb3J0IHR5cGUgeyBDcmVkZW50aWFscyB9IGZyb20gXCIuLi8uLi8uLi9taXNjL2NyZWRlbnRpYWxzL0NyZWRlbnRpYWxzXCJcbmltcG9ydCB7XG5cdEFlczEyOEtleSxcblx0YWVzMjU2RGVjcnlwdFdpdGhSZWNvdmVyeUtleSxcblx0QWVzMjU2S2V5LFxuXHRhZXMyNTZSYW5kb21LZXksXG5cdGFlc0RlY3J5cHQsXG5cdEFlc0tleSxcblx0YmFzZTY0VG9LZXksXG5cdGNyZWF0ZUF1dGhWZXJpZmllcixcblx0Y3JlYXRlQXV0aFZlcmlmaWVyQXNCYXNlNjRVcmwsXG5cdGVuY3J5cHRLZXksXG5cdGdlbmVyYXRlS2V5RnJvbVBhc3NwaHJhc2VCY3J5cHQsXG5cdGdlbmVyYXRlUmFuZG9tU2FsdCxcblx0S2V5TGVuZ3RoLFxuXHRrZXlUb1VpbnQ4QXJyYXksXG5cdHNoYTI1Nkhhc2gsXG5cdFRvdHBTZWNyZXQsXG5cdFRvdHBWZXJpZmllcixcblx0dWludDhBcnJheVRvQml0QXJyYXksXG59IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtY3J5cHRvXCJcbmltcG9ydCB7IENyeXB0b0ZhY2FkZSB9IGZyb20gXCIuLi9jcnlwdG8vQ3J5cHRvRmFjYWRlXCJcbmltcG9ydCB7IEluc3RhbmNlTWFwcGVyIH0gZnJvbSBcIi4uL2NyeXB0by9JbnN0YW5jZU1hcHBlclwiXG5pbXBvcnQgeyBJU2VydmljZUV4ZWN1dG9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9TZXJ2aWNlUmVxdWVzdFwiXG5pbXBvcnQgeyBTZXNzaW9uVHlwZSB9IGZyb20gXCIuLi8uLi9jb21tb24vU2Vzc2lvblR5cGVcIlxuaW1wb3J0IHsgQ2FjaGVTdG9yYWdlTGF0ZUluaXRpYWxpemVyIH0gZnJvbSBcIi4uL3Jlc3QvQ2FjaGVTdG9yYWdlUHJveHlcIlxuaW1wb3J0IHsgQXV0aERhdGFQcm92aWRlciwgVXNlckZhY2FkZSB9IGZyb20gXCIuL1VzZXJGYWNhZGVcIlxuaW1wb3J0IHsgTG9naW5GYWlsUmVhc29uIH0gZnJvbSBcIi4uLy4uL21haW4vUGFnZUNvbnRleHRMb2dpbkxpc3RlbmVyLmpzXCJcbmltcG9ydCB7IExvZ2luSW5jb21wbGV0ZUVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9Mb2dpbkluY29tcGxldGVFcnJvci5qc1wiXG5pbXBvcnQgeyBFbnRyb3B5RmFjYWRlIH0gZnJvbSBcIi4vRW50cm9weUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBCbG9iQWNjZXNzVG9rZW5GYWNhZGUgfSBmcm9tIFwiLi9CbG9iQWNjZXNzVG9rZW5GYWNhZGUuanNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBEYXRhYmFzZUtleUZhY3RvcnkgfSBmcm9tIFwiLi4vLi4vLi4vbWlzYy9jcmVkZW50aWFscy9EYXRhYmFzZUtleUZhY3RvcnkuanNcIlxuaW1wb3J0IHsgRXh0ZXJuYWxVc2VyS2V5RGVyaXZlciB9IGZyb20gXCIuLi8uLi8uLi9taXNjL0xvZ2luVXRpbHMuanNcIlxuaW1wb3J0IHsgQXJnb24yaWRGYWNhZGUgfSBmcm9tIFwiLi9BcmdvbjJpZEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9taXNjL2NyZWRlbnRpYWxzL0NyZWRlbnRpYWxUeXBlLmpzXCJcbmltcG9ydCB7IEtleVJvdGF0aW9uRmFjYWRlIH0gZnJvbSBcIi4vS2V5Um90YXRpb25GYWNhZGUuanNcIlxuaW1wb3J0IHsgZW5jcnlwdFN0cmluZyB9IGZyb20gXCIuLi9jcnlwdG8vQ3J5cHRvV3JhcHBlci5qc1wiXG5pbXBvcnQgeyBDYWNoZU1hbmFnZW1lbnRGYWNhZGUgfSBmcm9tIFwiLi9sYXp5L0NhY2hlTWFuYWdlbWVudEZhY2FkZS5qc1wiXG5cbmFzc2VydFdvcmtlck9yTm9kZSgpXG5cbmV4cG9ydCB0eXBlIE5ld1Nlc3Npb25EYXRhID0ge1xuXHR1c2VyOiBVc2VyXG5cdHVzZXJHcm91cEluZm86IEdyb3VwSW5mb1xuXHRzZXNzaW9uSWQ6IElkVHVwbGVcblx0Y3JlZGVudGlhbHM6IENyZWRlbnRpYWxzXG5cdGRhdGFiYXNlS2V5OiBVaW50OEFycmF5IHwgbnVsbFxufVxuXG5leHBvcnQgdHlwZSBDYWNoZUluZm8gPSB7XG5cdGlzUGVyc2lzdGVudDogYm9vbGVhblxuXHRpc05ld09mZmxpbmVEYjogYm9vbGVhblxuXHRkYXRhYmFzZUtleTogVWludDhBcnJheSB8IG51bGxcbn1cblxuaW50ZXJmYWNlIFJlc3VtZVNlc3Npb25SZXN1bHREYXRhIHtcblx0dXNlcjogVXNlclxuXHR1c2VyR3JvdXBJbmZvOiBHcm91cEluZm9cblx0c2Vzc2lvbklkOiBJZFR1cGxlXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFJlc3VtZVNlc3Npb25FcnJvclJlYXNvbiB7XG5cdE9mZmxpbmVOb3RBdmFpbGFibGVGb3JGcmVlLFxufVxuXG5leHBvcnQgdHlwZSBJbml0Q2FjaGVPcHRpb25zID0ge1xuXHR1c2VySWQ6IElkXG5cdGRhdGFiYXNlS2V5OiBVaW50OEFycmF5IHwgbnVsbFxuXHR0aW1lUmFuZ2VEYXlzOiBudW1iZXIgfCBudWxsXG5cdGZvcmNlTmV3RGF0YWJhc2U6IGJvb2xlYW5cbn1cblxudHlwZSBSZXN1bWVTZXNzaW9uU3VjY2VzcyA9IHsgdHlwZTogXCJzdWNjZXNzXCI7IGRhdGE6IFJlc3VtZVNlc3Npb25SZXN1bHREYXRhIH1cbnR5cGUgUmVzdW1lU2Vzc2lvbkZhaWx1cmUgPSB7IHR5cGU6IFwiZXJyb3JcIjsgcmVhc29uOiBSZXN1bWVTZXNzaW9uRXJyb3JSZWFzb24gfVxudHlwZSBSZXN1bWVTZXNzaW9uUmVzdWx0ID0gUmVzdW1lU2Vzc2lvblN1Y2Nlc3MgfCBSZXN1bWVTZXNzaW9uRmFpbHVyZVxuXG50eXBlIEFzeW5jTG9naW5TdGF0ZSA9XG5cdHwgeyBzdGF0ZTogXCJpZGxlXCIgfVxuXHR8IHsgc3RhdGU6IFwicnVubmluZ1wiIH1cblx0fCB7XG5cdFx0XHRzdGF0ZTogXCJmYWlsZWRcIlxuXHRcdFx0Y3JlZGVudGlhbHM6IENyZWRlbnRpYWxzXG5cdFx0XHRjYWNoZUluZm86IENhY2hlSW5mb1xuXHQgIH1cblxuLyoqXG4gKiBBbGwgYXR0cmlidXRlcyB0aGF0IGFyZSByZXF1aXJlZCB0byBkZXJpdmUgdGhlIHBhc3NwaHJhc2Uga2V5LlxuICovXG5leHBvcnQgdHlwZSBQYXNzcGhyYXNlS2V5RGF0YSA9IHtcblx0a2RmVHlwZTogS2RmVHlwZVxuXHRzYWx0OiBVaW50OEFycmF5XG5cdHBhc3NwaHJhc2U6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ2luTGlzdGVuZXIge1xuXHQvKipcblx0ICogRnVsbCBsb2dpbiByZWFjaGVkOiBhbnkgbmV0d29yayByZXF1ZXN0cyBjYW4gYmUgbWFkZVxuXHQgKi9cblx0b25GdWxsTG9naW5TdWNjZXNzKHNlc3Npb25UeXBlOiBTZXNzaW9uVHlwZSwgY2FjaGVJbmZvOiBDYWNoZUluZm8sIGNyZWRlbnRpYWxzOiBDcmVkZW50aWFscyk6IFByb21pc2U8dm9pZD5cblxuXHQvKipcblx0ICogY2FsbCB3aGVuIHRoZSBsb2dpbiBmYWlscyBmb3IgaW52YWxpZCBzZXNzaW9uIG9yIG90aGVyIHJlYXNvbnNcblx0ICovXG5cdG9uTG9naW5GYWlsdXJlKHJlYXNvbjogTG9naW5GYWlsUmVhc29uKTogUHJvbWlzZTx2b2lkPlxuXG5cdC8qKlxuXHQgKiBTaG93cyBhIGRpYWxvZyB3aXRoIHBvc3NpYmlsaXR5IHRvIHVzZSBzZWNvbmQgZmFjdG9yIGFuZCB3aXRoIGEgbWVzc2FnZSB0aGF0IHRoZSBsb2dpbiBjYW4gYmUgYXBwcm92ZWQgZnJvbSBhbm90aGVyIGNsaWVudC5cblx0ICovXG5cdG9uU2Vjb25kRmFjdG9yQ2hhbGxlbmdlKHNlc3Npb25JZDogSWRUdXBsZSwgY2hhbGxlbmdlczogUmVhZG9ubHlBcnJheTxDaGFsbGVuZ2U+LCBtYWlsQWRkcmVzczogc3RyaW5nIHwgbnVsbCk6IFByb21pc2U8dm9pZD5cbn1cblxuZXhwb3J0IGNsYXNzIExvZ2luRmFjYWRlIHtcblx0cHJpdmF0ZSBldmVudEJ1c0NsaWVudCE6IEV2ZW50QnVzQ2xpZW50XG5cdC8qKlxuXHQgKiBVc2VkIGZvciBjYW5jZWxsaW5nIHNlY29uZCBmYWN0b3IgYW5kIHRvIG5vdCBtaXggZGlmZmVyZW50IGF0dGVtcHRzXG5cdCAqL1xuXHRwcml2YXRlIGxvZ2luUmVxdWVzdFNlc3Npb25JZDogSWRUdXBsZSB8IG51bGwgPSBudWxsXG5cblx0LyoqXG5cdCAqIFVzZWQgZm9yIGNhbmNlbGxpbmcgc2Vjb25kIGZhY3RvciBpbW1lZGlhdGVseVxuXHQgKi9cblx0cHJpdmF0ZSBsb2dnaW5nSW5Qcm9taXNlV3JhcHBlcjogRGVmZXJyZWRPYmplY3Q8dm9pZD4gfCBudWxsID0gbnVsbFxuXG5cdC8qKiBPbiBwbGF0Zm9ybXMgd2l0aCBvZmZsaW5lIGNhY2hlIHdlIGRvIHRoZSBhY3R1YWwgbG9naW4gYXN5bmNocm9ub3VzbHkgYW5kIHdlIGNhbiByZXRyeSBpdC4gVGhpcyBpcyB0aGUgc3RhdGUgb2Ygc3VjaCBhc3luYyBsb2dpbi4gKi9cblx0YXN5bmNMb2dpblN0YXRlOiBBc3luY0xvZ2luU3RhdGUgPSB7IHN0YXRlOiBcImlkbGVcIiB9XG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSByZXN0Q2xpZW50OiBSZXN0Q2xpZW50LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBsb2dpbkxpc3RlbmVyOiBMb2dpbkxpc3RlbmVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgaW5zdGFuY2VNYXBwZXI6IEluc3RhbmNlTWFwcGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY3J5cHRvRmFjYWRlOiBDcnlwdG9GYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBrZXlSb3RhdGlvbkZhY2FkZTogS2V5Um90YXRpb25GYWNhZGUsXG5cdFx0LyoqXG5cdFx0ICogIE9ubHkgbmVlZGVkIHNvIHRoYXQgd2UgY2FuIGluaXRpYWxpemUgdGhlIG9mZmxpbmUgc3RvcmFnZSBhZnRlciBsb2dpbi5cblx0XHQgKiAgVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSB3ZSBkb24ndCBrbm93IGlmIHdlJ2xsIGJlIHBlcnNpc3RlbnQgb3Igbm90IHVudGlsIHRoZSB1c2VyIHRyaWVzIHRvIGxvZ2luXG5cdFx0ICogIE9uY2UgdGhlIGNyZWRlbnRpYWxzIGhhbmRsaW5nIGhhcyBiZWVuIGNoYW5nZWQgdG8gKmFsd2F5cyogc2F2ZSBpbiBkZXNrdG9wLCB0aGVuIHRoaXMgc2hvdWxkIGJlY29tZSBvYnNvbGV0ZVxuXHRcdCAqL1xuXHRcdHByaXZhdGUgcmVhZG9ubHkgY2FjaGVJbml0aWFsaXplcjogQ2FjaGVTdG9yYWdlTGF0ZUluaXRpYWxpemVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgc2VydmljZUV4ZWN1dG9yOiBJU2VydmljZUV4ZWN1dG9yLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdXNlckZhY2FkZTogVXNlckZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGJsb2JBY2Nlc3NUb2tlbkZhY2FkZTogQmxvYkFjY2Vzc1Rva2VuRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZW50cm9weUZhY2FkZTogRW50cm9weUZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGRhdGFiYXNlS2V5RmFjdG9yeTogRGF0YWJhc2VLZXlGYWN0b3J5LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgYXJnb24yaWRGYWNhZGU6IEFyZ29uMmlkRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbm9uY2FjaGluZ0VudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgc2VuZEVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiBQcm9taXNlPHZvaWQ+LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY2FjaGVNYW5hZ2VtZW50RmFjYWRlOiBsYXp5QXN5bmM8Q2FjaGVNYW5hZ2VtZW50RmFjYWRlPixcblx0KSB7fVxuXG5cdGluaXQoZXZlbnRCdXNDbGllbnQ6IEV2ZW50QnVzQ2xpZW50KSB7XG5cdFx0dGhpcy5ldmVudEJ1c0NsaWVudCA9IGV2ZW50QnVzQ2xpZW50XG5cdH1cblxuXHRhc3luYyByZXNldFNlc3Npb24oKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5ldmVudEJ1c0NsaWVudC5jbG9zZShDbG9zZUV2ZW50QnVzT3B0aW9uLlRlcm1pbmF0ZSlcblx0XHRhd2FpdCB0aGlzLmRlSW5pdENhY2hlKClcblx0XHR0aGlzLnVzZXJGYWNhZGUucmVzZXQoKVxuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBzZXNzaW9uIGFuZCBsb2cgaW4uIENoYW5nZXMgaW50ZXJuYWwgc3RhdGUgdG8gcmVmZXIgdG8gdGhlIGxvZ2dlZCBpbiB1c2VyLlxuXHQgKi9cblx0YXN5bmMgY3JlYXRlU2Vzc2lvbihcblx0XHRtYWlsQWRkcmVzczogc3RyaW5nLFxuXHRcdHBhc3NwaHJhc2U6IHN0cmluZyxcblx0XHRjbGllbnRJZGVudGlmaWVyOiBzdHJpbmcsXG5cdFx0c2Vzc2lvblR5cGU6IFNlc3Npb25UeXBlLFxuXHRcdGRhdGFiYXNlS2V5OiBVaW50OEFycmF5IHwgbnVsbCxcblx0KTogUHJvbWlzZTxOZXdTZXNzaW9uRGF0YT4ge1xuXHRcdGlmICh0aGlzLnVzZXJGYWNhZGUuaXNQYXJ0aWFsbHlMb2dnZWRJbigpKSB7XG5cdFx0XHQvLyBkbyBub3QgcmVzZXQgaGVyZSBiZWNhdXNlIHRoZSBldmVudCBidXMgY2xpZW50IG5lZWRzIHRvIGJlIGtlcHQgaWYgdGhlIHNhbWUgdXNlciBpcyBsb2dnZWQgaW4gYXMgYmVmb3JlXG5cdFx0XHRjb25zb2xlLmxvZyhcInNlc3Npb24gYWxyZWFkeSBleGlzdHMsIHJldXNlIGRhdGFcIilcblx0XHRcdC8vIGNoZWNrIGlmIGl0IGlzIHRoZSBzYW1lIHVzZXIgaW4gX2luaXRTZXNzaW9uKClcblx0XHR9XG5cblx0XHRjb25zdCB7IHVzZXJQYXNzcGhyYXNlS2V5LCBrZGZUeXBlIH0gPSBhd2FpdCB0aGlzLmxvYWRVc2VyUGFzc3BocmFzZUtleShtYWlsQWRkcmVzcywgcGFzc3BocmFzZSlcblx0XHQvLyB0aGUgdmVyaWZpZXIgaXMgYWx3YXlzIHNlbnQgYXMgdXJsIHBhcmFtZXRlciwgc28gaXQgbXVzdCBiZSB1cmwgZW5jb2RlZFxuXHRcdGNvbnN0IGF1dGhWZXJpZmllciA9IGNyZWF0ZUF1dGhWZXJpZmllckFzQmFzZTY0VXJsKHVzZXJQYXNzcGhyYXNlS2V5KVxuXHRcdGNvbnN0IGNyZWF0ZVNlc3Npb25EYXRhID0gY3JlYXRlQ3JlYXRlU2Vzc2lvbkRhdGEoe1xuXHRcdFx0YWNjZXNzS2V5OiBudWxsLFxuXHRcdFx0YXV0aFRva2VuOiBudWxsLFxuXHRcdFx0YXV0aFZlcmlmaWVyLFxuXHRcdFx0Y2xpZW50SWRlbnRpZmllcixcblx0XHRcdG1haWxBZGRyZXNzOiBtYWlsQWRkcmVzcy50b0xvd2VyQ2FzZSgpLnRyaW0oKSxcblx0XHRcdHJlY292ZXJDb2RlVmVyaWZpZXI6IG51bGwsXG5cdFx0XHR1c2VyOiBudWxsLFxuXHRcdH0pXG5cblx0XHRsZXQgYWNjZXNzS2V5OiBBZXNLZXkgfCBudWxsID0gbnVsbFxuXG5cdFx0aWYgKHNlc3Npb25UeXBlID09PSBTZXNzaW9uVHlwZS5QZXJzaXN0ZW50KSB7XG5cdFx0XHRhY2Nlc3NLZXkgPSBhZXMyNTZSYW5kb21LZXkoKVxuXHRcdFx0Y3JlYXRlU2Vzc2lvbkRhdGEuYWNjZXNzS2V5ID0ga2V5VG9VaW50OEFycmF5KGFjY2Vzc0tleSlcblx0XHR9XG5cdFx0Y29uc3QgY3JlYXRlU2Vzc2lvblJldHVybiA9IGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoU2Vzc2lvblNlcnZpY2UsIGNyZWF0ZVNlc3Npb25EYXRhKVxuXHRcdGNvbnN0IHNlc3Npb25EYXRhID0gYXdhaXQgdGhpcy53YWl0VW50aWxTZWNvbmRGYWN0b3JBcHByb3ZlZE9yQ2FuY2VsbGVkKGNyZWF0ZVNlc3Npb25SZXR1cm4sIG1haWxBZGRyZXNzKVxuXG5cdFx0Y29uc3QgZm9yY2VOZXdEYXRhYmFzZSA9IHNlc3Npb25UeXBlID09PSBTZXNzaW9uVHlwZS5QZXJzaXN0ZW50ICYmIGRhdGFiYXNlS2V5ID09IG51bGxcblx0XHRpZiAoZm9yY2VOZXdEYXRhYmFzZSkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJnZW5lcmF0aW5nIG5ldyBkYXRhYmFzZSBrZXkgZm9yIHBlcnNpc3RlbnQgc2Vzc2lvblwiKVxuXHRcdFx0ZGF0YWJhc2VLZXkgPSBhd2FpdCB0aGlzLmRhdGFiYXNlS2V5RmFjdG9yeS5nZW5lcmF0ZUtleSgpXG5cdFx0fVxuXG5cdFx0Y29uc3QgY2FjaGVJbmZvID0gYXdhaXQgdGhpcy5pbml0Q2FjaGUoe1xuXHRcdFx0dXNlcklkOiBzZXNzaW9uRGF0YS51c2VySWQsXG5cdFx0XHRkYXRhYmFzZUtleSxcblx0XHRcdHRpbWVSYW5nZURheXM6IG51bGwsXG5cdFx0XHRmb3JjZU5ld0RhdGFiYXNlLFxuXHRcdH0pXG5cdFx0Y29uc3QgeyB1c2VyLCB1c2VyR3JvdXBJbmZvLCBhY2Nlc3NUb2tlbiB9ID0gYXdhaXQgdGhpcy5pbml0U2Vzc2lvbihzZXNzaW9uRGF0YS51c2VySWQsIHNlc3Npb25EYXRhLmFjY2Vzc1Rva2VuLCB1c2VyUGFzc3BocmFzZUtleSlcblxuXHRcdGNvbnN0IG1vZGVybktkZlR5cGUgPSB0aGlzLmlzTW9kZXJuS2RmVHlwZShrZGZUeXBlKVxuXHRcdGlmICghbW9kZXJuS2RmVHlwZSkge1xuXHRcdFx0YXdhaXQgdGhpcy5taWdyYXRlS2RmVHlwZShLZGZUeXBlLkFyZ29uMmlkLCBwYXNzcGhyYXNlLCB1c2VyKVxuXHRcdH1cblxuXHRcdGNvbnN0IGNyZWRlbnRpYWxzID0ge1xuXHRcdFx0bG9naW46IG1haWxBZGRyZXNzLFxuXHRcdFx0YWNjZXNzVG9rZW4sXG5cdFx0XHRlbmNyeXB0ZWRQYXNzd29yZDogc2Vzc2lvblR5cGUgPT09IFNlc3Npb25UeXBlLlBlcnNpc3RlbnQgPyB1aW50OEFycmF5VG9CYXNlNjQoZW5jcnlwdFN0cmluZyhuZXZlck51bGwoYWNjZXNzS2V5KSwgcGFzc3BocmFzZSkpIDogbnVsbCxcblx0XHRcdGVuY3J5cHRlZFBhc3NwaHJhc2VLZXk6IHNlc3Npb25UeXBlID09PSBTZXNzaW9uVHlwZS5QZXJzaXN0ZW50ID8gZW5jcnlwdEtleShuZXZlck51bGwoYWNjZXNzS2V5KSwgdXNlclBhc3NwaHJhc2VLZXkpIDogbnVsbCxcblx0XHRcdHVzZXJJZDogc2Vzc2lvbkRhdGEudXNlcklkLFxuXHRcdFx0dHlwZTogQ3JlZGVudGlhbFR5cGUuSW50ZXJuYWwsXG5cdFx0fVxuXHRcdHRoaXMubG9naW5MaXN0ZW5lci5vbkZ1bGxMb2dpblN1Y2Nlc3Moc2Vzc2lvblR5cGUsIGNhY2hlSW5mbywgY3JlZGVudGlhbHMpXG5cblx0XHRpZiAoIWlzQWRtaW5DbGllbnQoKSkge1xuXHRcdFx0YXdhaXQgdGhpcy5rZXlSb3RhdGlvbkZhY2FkZS5pbml0aWFsaXplKHVzZXJQYXNzcGhyYXNlS2V5LCBtb2Rlcm5LZGZUeXBlKVxuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHR1c2VyLFxuXHRcdFx0dXNlckdyb3VwSW5mbyxcblx0XHRcdHNlc3Npb25JZDogc2Vzc2lvbkRhdGEuc2Vzc2lvbklkLFxuXHRcdFx0Y3JlZGVudGlhbHM6IGNyZWRlbnRpYWxzLFxuXHRcdFx0Ly8gd2UgYWx3YXlzIHRyeSB0byBtYWtlIGEgcGVyc2lzdGVudCBjYWNoZSB3aXRoIGEga2V5IGZvciBwZXJzaXN0ZW50IHNlc3Npb24sIGJ1dCB0aGlzXG5cdFx0XHQvLyBmYWxscyBiYWNrIHRvIGVwaGVtZXJhbCBjYWNoZSBpbiBicm93c2Vycy4gbm8gcG9pbnQgc3RvcmluZyB0aGUga2V5IHRoZW4uXG5cdFx0XHRkYXRhYmFzZUtleTogY2FjaGVJbmZvLmlzUGVyc2lzdGVudCA/IGRhdGFiYXNlS2V5IDogbnVsbCxcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogRW5zdXJlIHRoYXQgdGhlIHVzZXIgaXMgdXNpbmcgYSBtb2Rlcm4gS0RGIHR5cGUsIG1pZ3JhdGluZyBpZiBub3QuXG5cdCAqIEBwYXJhbSB0YXJnZXRLZGZUeXBlIHRoZSBjdXJyZW50IEtERiB0eXBlXG5cdCAqIEBwYXJhbSBwYXNzcGhyYXNlIGVpdGhlciB0aGUgcGxhaW50ZXh0IHBhc3NwaHJhc2Ugb3IgdGhlIGVuY3J5cHRlZCBwYXNzcGhyYXNlIHdpdGggdGhlIGFjY2VzcyB0b2tlbiBuZWNlc3NhcnkgdG8gZGVjcnlwdCBpdFxuXHQgKiBAcGFyYW0gdXNlciB0aGUgdXNlciB3ZSBhcmUgdXBkYXRpbmdcblx0ICovXG5cdHB1YmxpYyBhc3luYyBtaWdyYXRlS2RmVHlwZSh0YXJnZXRLZGZUeXBlOiBLZGZUeXBlLCBwYXNzcGhyYXNlOiBzdHJpbmcsIHVzZXI6IFVzZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoIUNvbnN0LkVYRUNVVEVfS0RGX01JR1JBVElPTikge1xuXHRcdFx0Ly8gTWlncmF0aW9uIGlzIG5vdCB5ZXQgZW5hYmxlZCBvbiB0aGlzIHZlcnNpb24uXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0Y29uc3QgY3VycmVudFBhc3NwaHJhc2VLZXlEYXRhID0ge1xuXHRcdFx0cGFzc3BocmFzZSxcblx0XHRcdGtkZlR5cGU6IGFzS2RmVHlwZSh1c2VyLmtkZlZlcnNpb24pLFxuXHRcdFx0c2FsdDogYXNzZXJ0Tm90TnVsbCh1c2VyLnNhbHQsIGBjdXJyZW50IHNhbHQgZm9yIHVzZXIgJHt1c2VyLl9pZH0gbm90IGZvdW5kYCksXG5cdFx0fVxuXG5cdFx0Y29uc3QgY3VycmVudFVzZXJQYXNzcGhyYXNlS2V5ID0gYXdhaXQgdGhpcy5kZXJpdmVVc2VyUGFzc3BocmFzZUtleShjdXJyZW50UGFzc3BocmFzZUtleURhdGEpXG5cdFx0Y29uc3QgY3VycmVudEF1dGhWZXJpZmllciA9IGNyZWF0ZUF1dGhWZXJpZmllcihjdXJyZW50VXNlclBhc3NwaHJhc2VLZXkpXG5cblx0XHRjb25zdCBuZXdQYXNzcGhyYXNlS2V5RGF0YSA9IHtcblx0XHRcdHBhc3NwaHJhc2UsXG5cdFx0XHRrZGZUeXBlOiB0YXJnZXRLZGZUeXBlLFxuXHRcdFx0c2FsdDogZ2VuZXJhdGVSYW5kb21TYWx0KCksXG5cdFx0fVxuXHRcdGNvbnN0IG5ld1VzZXJQYXNzcGhyYXNlS2V5ID0gYXdhaXQgdGhpcy5kZXJpdmVVc2VyUGFzc3BocmFzZUtleShuZXdQYXNzcGhyYXNlS2V5RGF0YSlcblxuXHRcdGNvbnN0IGN1cnJlbnRVc2VyR3JvdXBLZXkgPSB0aGlzLnVzZXJGYWNhZGUuZ2V0Q3VycmVudFVzZXJHcm91cEtleSgpXG5cdFx0Y29uc3QgcHdFbmNVc2VyR3JvdXBLZXkgPSBlbmNyeXB0S2V5KG5ld1VzZXJQYXNzcGhyYXNlS2V5LCBjdXJyZW50VXNlckdyb3VwS2V5Lm9iamVjdClcblx0XHRjb25zdCBuZXdBdXRoVmVyaWZpZXIgPSBjcmVhdGVBdXRoVmVyaWZpZXIobmV3VXNlclBhc3NwaHJhc2VLZXkpXG5cblx0XHRjb25zdCBjaGFuZ2VLZGZQb3N0SW4gPSBjcmVhdGVDaGFuZ2VLZGZQb3N0SW4oe1xuXHRcdFx0a2RmVmVyc2lvbjogbmV3UGFzc3BocmFzZUtleURhdGEua2RmVHlwZSxcblx0XHRcdHNhbHQ6IG5ld1Bhc3NwaHJhc2VLZXlEYXRhLnNhbHQsXG5cdFx0XHRwd0VuY1VzZXJHcm91cEtleSxcblx0XHRcdHZlcmlmaWVyOiBuZXdBdXRoVmVyaWZpZXIsXG5cdFx0XHRvbGRWZXJpZmllcjogY3VycmVudEF1dGhWZXJpZmllcixcblx0XHRcdHVzZXJHcm91cEtleVZlcnNpb246IFN0cmluZyhjdXJyZW50VXNlckdyb3VwS2V5LnZlcnNpb24pLFxuXHRcdH0pXG5cdFx0Y29uc29sZS5sb2coXCJNaWdyYXRlIEtERiBmcm9tOlwiLCB1c2VyLmtkZlZlcnNpb24sIFwidG9cIiwgdGFyZ2V0S2RmVHlwZSlcblx0XHRhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5wb3N0KENoYW5nZUtkZlNlcnZpY2UsIGNoYW5nZUtkZlBvc3RJbilcblx0XHQvLyBXZSByZWxvYWQgdGhlIHVzZXIgYmVjYXVzZSB3ZSBleHBlcmllbmNlZCBhIHJhY2UgY29uZGl0aW9uXG5cdFx0Ly8gd2VyZSB3ZSBkbyBub3QgcHJvY2VzcyB0aGUgVXNlciB1cGRhdGUgYWZ0ZXIgZG9pbmcgdGhlIGFyZ29uMiBtaWdyYXRpb24gZnJvbSB0aGUgd2ViIGNsaWVudC7CtFxuXHRcdC8vIEluIG9yZGVyIGRvIG5vdCByZXdvcmsgdGhlIGVudGl0eSBwcm9jZXNzaW5nIGFuZCBpdHMgaW5pdGlhbGl6YXRpb24gZm9yIG5ldyBjbGllbnRzIHdlXG5cdFx0Ly8gcmVwbGFjZSB0aGUgY2FjaGVkIGluc3RhbmNlcyBhZnRlciBkb2luZyB0aGUgbWlncmF0aW9uXG5cdFx0YXdhaXQgKGF3YWl0IHRoaXMuY2FjaGVNYW5hZ2VtZW50RmFjYWRlKCkpLnJlbG9hZFVzZXIoKVxuXHRcdHRoaXMudXNlckZhY2FkZS5zZXRVc2VyR3JvdXBLZXlEaXN0cmlidXRpb25LZXkobmV3VXNlclBhc3NwaHJhc2VLZXkpXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2tzIGlmIHRoZSBnaXZlbiBLREYgdHlwZSBpcyBwaGFzZWQgb3V0LlxuXHQgKiBAcGFyYW0ga2RmVHlwZVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0cHJpdmF0ZSBpc01vZGVybktkZlR5cGUoa2RmVHlwZTogS2RmVHlwZSk6IGJvb2xlYW4ge1xuXHRcdC8vIHJlc2lzdCB0aGUgdGVtcHRhdGlvbiB0byBqdXN0IGNoZWNrIGlmIGl0IGlzIGVxdWFsIHRvIHRoZSBkZWZhdWx0LCBiZWNhdXNlIHRoYXQgd2lsbCB5aWVsZCBmYWxzZSBmb3IgS0RGIHR5cGVzIHdlIGRvbid0IGtub3cgYWJvdXQgeWV0XG5cdFx0cmV0dXJuIGtkZlR5cGUgIT09IEtkZlR5cGUuQmNyeXB0XG5cdH1cblxuXHQvKipcblx0ICogSWYgdGhlIHNlY29uZCBmYWN0b3IgbG9naW4gaGFzIGJlZW4gY2FuY2VsbGVkIGEgQ2FuY2VsbGVkRXJyb3IgaXMgdGhyb3duLlxuXHQgKi9cblx0cHJpdmF0ZSB3YWl0VW50aWxTZWNvbmRGYWN0b3JBcHByb3ZlZE9yQ2FuY2VsbGVkKFxuXHRcdGNyZWF0ZVNlc3Npb25SZXR1cm46IENyZWF0ZVNlc3Npb25SZXR1cm4sXG5cdFx0bWFpbEFkZHJlc3M6IHN0cmluZyB8IG51bGwsXG5cdCk6IFByb21pc2U8e1xuXHRcdHNlc3Npb25JZDogSWRUdXBsZVxuXHRcdHVzZXJJZDogSWRcblx0XHRhY2Nlc3NUb2tlbjogQmFzZTY0VXJsXG5cdH0+IHtcblx0XHRsZXQgcCA9IFByb21pc2UucmVzb2x2ZSgpXG5cdFx0bGV0IHNlc3Npb25JZCA9IFt0aGlzLmdldFNlc3Npb25MaXN0SWQoY3JlYXRlU2Vzc2lvblJldHVybi5hY2Nlc3NUb2tlbiksIHRoaXMuZ2V0U2Vzc2lvbkVsZW1lbnRJZChjcmVhdGVTZXNzaW9uUmV0dXJuLmFjY2Vzc1Rva2VuKV0gYXMgY29uc3Rcblx0XHR0aGlzLmxvZ2luUmVxdWVzdFNlc3Npb25JZCA9IHNlc3Npb25JZFxuXG5cdFx0aWYgKGNyZWF0ZVNlc3Npb25SZXR1cm4uY2hhbGxlbmdlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHQvLyBTaG93IGEgbWVzc2FnZSB0byB0aGUgdXNlciBhbmQgZ2l2ZSB0aGVtIGEgY2hhbmNlIHRvIGNvbXBsZXRlIHRoZSBjaGFsbGVuZ2VzLlxuXHRcdFx0dGhpcy5sb2dpbkxpc3RlbmVyLm9uU2Vjb25kRmFjdG9yQ2hhbGxlbmdlKHNlc3Npb25JZCwgY3JlYXRlU2Vzc2lvblJldHVybi5jaGFsbGVuZ2VzLCBtYWlsQWRkcmVzcylcblxuXHRcdFx0cCA9IHRoaXMud2FpdFVudGlsU2Vjb25kRmFjdG9yQXBwcm92ZWQoY3JlYXRlU2Vzc2lvblJldHVybi5hY2Nlc3NUb2tlbiwgc2Vzc2lvbklkLCAwKVxuXHRcdH1cblxuXHRcdHRoaXMubG9nZ2luZ0luUHJvbWlzZVdyYXBwZXIgPSBkZWZlcigpXG5cdFx0Ly8gV2FpdCBmb3IgZWl0aGVyIGxvZ2luIG9yIGNhbmNlbFxuXHRcdHJldHVybiBQcm9taXNlLnJhY2UoW3RoaXMubG9nZ2luZ0luUHJvbWlzZVdyYXBwZXIucHJvbWlzZSwgcF0pLnRoZW4oKCkgPT4gKHtcblx0XHRcdHNlc3Npb25JZCxcblx0XHRcdGFjY2Vzc1Rva2VuOiBjcmVhdGVTZXNzaW9uUmV0dXJuLmFjY2Vzc1Rva2VuLFxuXHRcdFx0dXNlcklkOiBjcmVhdGVTZXNzaW9uUmV0dXJuLnVzZXIsXG5cdFx0fSkpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHdhaXRVbnRpbFNlY29uZEZhY3RvckFwcHJvdmVkKGFjY2Vzc1Rva2VuOiBCYXNlNjRVcmwsIHNlc3Npb25JZDogSWRUdXBsZSwgcmV0cnlPbk5ldHdvcmtFcnJvcjogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0bGV0IHNlY29uZEZhY3RvckF1dGhHZXREYXRhID0gY3JlYXRlU2Vjb25kRmFjdG9yQXV0aEdldERhdGEoe1xuXHRcdFx0YWNjZXNzVG9rZW4sXG5cdFx0fSlcblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc2Vjb25kRmFjdG9yQXV0aEdldFJldHVybiA9IGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLmdldChTZWNvbmRGYWN0b3JBdXRoU2VydmljZSwgc2Vjb25kRmFjdG9yQXV0aEdldERhdGEpXG5cdFx0XHRpZiAoIXRoaXMubG9naW5SZXF1ZXN0U2Vzc2lvbklkIHx8ICFpc1NhbWVJZCh0aGlzLmxvZ2luUmVxdWVzdFNlc3Npb25JZCwgc2Vzc2lvbklkKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgQ2FuY2VsbGVkRXJyb3IoXCJsb2dpbiBjYW5jZWxsZWRcIilcblx0XHRcdH1cblxuXHRcdFx0aWYgKHNlY29uZEZhY3RvckF1dGhHZXRSZXR1cm4uc2Vjb25kRmFjdG9yUGVuZGluZykge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy53YWl0VW50aWxTZWNvbmRGYWN0b3JBcHByb3ZlZChhY2Nlc3NUb2tlbiwgc2Vzc2lvbklkLCAwKVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgQ29ubmVjdGlvbkVycm9yICYmIHJldHJ5T25OZXR3b3JrRXJyb3IgPCAxMCkge1xuXHRcdFx0XHQvLyBDb25uZWN0aW9uIGVycm9yIGNhbiBvY2N1ciBvbiBpb3Mgd2hlbiBzd2l0Y2hpbmcgYmV0d2VlbiBhcHBzIG9yIGp1c3QgYXMgYSB0aW1lb3V0IChvdXIgcmVxdWVzdCB0aW1lb3V0IGlzIHNob3J0ZXIgdGhhbiB0aGUgb3ZlcmFsbFxuXHRcdFx0XHQvLyBhdXRoIGZsb3cgdGltZW91dCkuIEp1c3QgcmV0cnkgaW4gdGhpcyBjYXNlLlxuXHRcdFx0XHRyZXR1cm4gdGhpcy53YWl0VW50aWxTZWNvbmRGYWN0b3JBcHByb3ZlZChhY2Nlc3NUb2tlbiwgc2Vzc2lvbklkLCByZXRyeU9uTmV0d29ya0Vycm9yICsgMSlcblx0XHRcdH1cblx0XHRcdHRocm93IGVcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlIGV4dGVybmFsICh0ZW1wb3JhcnkgbWFpbGJveCBmb3IgcGFzc3BocmFzZS1wcm90ZWN0ZWQgZW1haWxzKSBzZXNzaW9uIGFuZCBsb2cgaW4uXG5cdCAqIENoYW5nZXMgaW50ZXJuYWwgc3RhdGUgdG8gcmVmZXIgdG8gdGhlIGxvZ2dlZC1pbiB1c2VyLlxuXHQgKi9cblx0YXN5bmMgY3JlYXRlRXh0ZXJuYWxTZXNzaW9uKFxuXHRcdHVzZXJJZDogSWQsXG5cdFx0cGFzc3BocmFzZTogc3RyaW5nLFxuXHRcdHNhbHQ6IFVpbnQ4QXJyYXksXG5cdFx0a2RmVHlwZTogS2RmVHlwZSxcblx0XHRjbGllbnRJZGVudGlmaWVyOiBzdHJpbmcsXG5cdFx0cGVyc2lzdGVudFNlc3Npb246IGJvb2xlYW4sXG5cdCk6IFByb21pc2U8TmV3U2Vzc2lvbkRhdGE+IHtcblx0XHRpZiAodGhpcy51c2VyRmFjYWRlLmlzUGFydGlhbGx5TG9nZ2VkSW4oKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwidXNlciBhbHJlYWR5IGxvZ2dlZCBpblwiKVxuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXJQYXNzcGhyYXNlS2V5ID0gYXdhaXQgdGhpcy5kZXJpdmVVc2VyUGFzc3BocmFzZUtleSh7IGtkZlR5cGUsIHBhc3NwaHJhc2UsIHNhbHQgfSlcblx0XHQvLyB0aGUgdmVyaWZpZXIgaXMgYWx3YXlzIHNlbnQgYXMgdXJsIHBhcmFtZXRlciwgc28gaXQgbXVzdCBiZSB1cmwgZW5jb2RlZFxuXHRcdGNvbnN0IGF1dGhWZXJpZmllciA9IGNyZWF0ZUF1dGhWZXJpZmllckFzQmFzZTY0VXJsKHVzZXJQYXNzcGhyYXNlS2V5KVxuXHRcdGNvbnN0IGF1dGhUb2tlbiA9IGJhc2U2NFRvQmFzZTY0VXJsKHVpbnQ4QXJyYXlUb0Jhc2U2NChzaGEyNTZIYXNoKHNhbHQpKSlcblx0XHRjb25zdCBzZXNzaW9uRGF0YSA9IGNyZWF0ZUNyZWF0ZVNlc3Npb25EYXRhKHtcblx0XHRcdGFjY2Vzc0tleTogbnVsbCxcblx0XHRcdGF1dGhUb2tlbixcblx0XHRcdGF1dGhWZXJpZmllcixcblx0XHRcdGNsaWVudElkZW50aWZpZXIsXG5cdFx0XHRtYWlsQWRkcmVzczogbnVsbCxcblx0XHRcdHJlY292ZXJDb2RlVmVyaWZpZXI6IG51bGwsXG5cdFx0XHR1c2VyOiB1c2VySWQsXG5cdFx0fSlcblx0XHRsZXQgYWNjZXNzS2V5OiBBZXMyNTZLZXkgfCBudWxsID0gbnVsbFxuXG5cdFx0aWYgKHBlcnNpc3RlbnRTZXNzaW9uKSB7XG5cdFx0XHRhY2Nlc3NLZXkgPSBhZXMyNTZSYW5kb21LZXkoKVxuXHRcdFx0c2Vzc2lvbkRhdGEuYWNjZXNzS2V5ID0ga2V5VG9VaW50OEFycmF5KGFjY2Vzc0tleSlcblx0XHR9XG5cblx0XHRjb25zdCBjcmVhdGVTZXNzaW9uUmV0dXJuID0gYXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChTZXNzaW9uU2VydmljZSwgc2Vzc2lvbkRhdGEpXG5cblx0XHRsZXQgc2Vzc2lvbklkID0gW3RoaXMuZ2V0U2Vzc2lvbkxpc3RJZChjcmVhdGVTZXNzaW9uUmV0dXJuLmFjY2Vzc1Rva2VuKSwgdGhpcy5nZXRTZXNzaW9uRWxlbWVudElkKGNyZWF0ZVNlc3Npb25SZXR1cm4uYWNjZXNzVG9rZW4pXSBhcyBjb25zdFxuXHRcdGNvbnN0IGNhY2hlSW5mbyA9IGF3YWl0IHRoaXMuaW5pdENhY2hlKHtcblx0XHRcdHVzZXJJZCxcblx0XHRcdGRhdGFiYXNlS2V5OiBudWxsLFxuXHRcdFx0dGltZVJhbmdlRGF5czogbnVsbCxcblx0XHRcdGZvcmNlTmV3RGF0YWJhc2U6IHRydWUsXG5cdFx0fSlcblx0XHRjb25zdCB7IHVzZXIsIHVzZXJHcm91cEluZm8sIGFjY2Vzc1Rva2VuIH0gPSBhd2FpdCB0aGlzLmluaXRTZXNzaW9uKGNyZWF0ZVNlc3Npb25SZXR1cm4udXNlciwgY3JlYXRlU2Vzc2lvblJldHVybi5hY2Nlc3NUb2tlbiwgdXNlclBhc3NwaHJhc2VLZXkpXG5cdFx0Y29uc3QgY3JlZGVudGlhbHMgPSB7XG5cdFx0XHRsb2dpbjogdXNlcklkLFxuXHRcdFx0YWNjZXNzVG9rZW4sXG5cdFx0XHRlbmNyeXB0ZWRQYXNzd29yZDogYWNjZXNzS2V5ID8gdWludDhBcnJheVRvQmFzZTY0KGVuY3J5cHRTdHJpbmcoYWNjZXNzS2V5LCBwYXNzcGhyYXNlKSkgOiBudWxsLFxuXHRcdFx0ZW5jcnlwdGVkUGFzc3BocmFzZUtleTogYWNjZXNzS2V5ID8gZW5jcnlwdEtleShhY2Nlc3NLZXksIHVzZXJQYXNzcGhyYXNlS2V5KSA6IG51bGwsXG5cdFx0XHR1c2VySWQsXG5cdFx0XHR0eXBlOiBDcmVkZW50aWFsVHlwZS5FeHRlcm5hbCxcblx0XHR9XG5cdFx0dGhpcy5sb2dpbkxpc3RlbmVyLm9uRnVsbExvZ2luU3VjY2VzcyhTZXNzaW9uVHlwZS5Mb2dpbiwgY2FjaGVJbmZvLCBjcmVkZW50aWFscylcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXNlcixcblx0XHRcdHVzZXJHcm91cEluZm8sXG5cdFx0XHRzZXNzaW9uSWQsXG5cdFx0XHRjcmVkZW50aWFsczogY3JlZGVudGlhbHMsXG5cdFx0XHRkYXRhYmFzZUtleTogbnVsbCxcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogRGVyaXZlIGEga2V5IGdpdmVuIGEgS0RGIHR5cGUsIHBhc3NwaHJhc2UsIGFuZCBzYWx0XG5cdCAqL1xuXHRhc3luYyBkZXJpdmVVc2VyUGFzc3BocmFzZUtleSh7IGtkZlR5cGUsIHBhc3NwaHJhc2UsIHNhbHQgfTogUGFzc3BocmFzZUtleURhdGEpOiBQcm9taXNlPEFlc0tleT4ge1xuXHRcdHN3aXRjaCAoa2RmVHlwZSkge1xuXHRcdFx0Y2FzZSBLZGZUeXBlLkJjcnlwdDoge1xuXHRcdFx0XHRyZXR1cm4gZ2VuZXJhdGVLZXlGcm9tUGFzc3BocmFzZUJjcnlwdChwYXNzcGhyYXNlLCBzYWx0LCBLZXlMZW5ndGguYjEyOClcblx0XHRcdH1cblx0XHRcdGNhc2UgS2RmVHlwZS5BcmdvbjJpZDoge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5hcmdvbjJpZEZhY2FkZS5nZW5lcmF0ZUtleUZyb21QYXNzcGhyYXNlKHBhc3NwaHJhc2UsIHNhbHQpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqIENhbmNlbHMgMkZBIHByb2Nlc3MuICovXG5cdGFzeW5jIGNhbmNlbENyZWF0ZVNlc3Npb24oc2Vzc2lvbklkOiBJZFR1cGxlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKCF0aGlzLmxvZ2luUmVxdWVzdFNlc3Npb25JZCB8fCAhaXNTYW1lSWQodGhpcy5sb2dpblJlcXVlc3RTZXNzaW9uSWQsIHNlc3Npb25JZCkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlRyeWluZyB0byBjYW5jZWwgc2Vzc2lvbiBjcmVhdGlvbiBidXQgdGhlIHN0YXRlIGlzIGludmFsaWRcIilcblx0XHR9XG5cblx0XHRjb25zdCBzZWNvbmRGYWN0b3JBdXRoRGVsZXRlRGF0YSA9IGNyZWF0ZVNlY29uZEZhY3RvckF1dGhEZWxldGVEYXRhKHtcblx0XHRcdHNlc3Npb246IHNlc3Npb25JZCxcblx0XHR9KVxuXHRcdGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yXG5cdFx0XHQuZGVsZXRlKFNlY29uZEZhY3RvckF1dGhTZXJ2aWNlLCBzZWNvbmRGYWN0b3JBdXRoRGVsZXRlRGF0YSlcblx0XHRcdC5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhOb3RGb3VuZEVycm9yLCAoZSkgPT4ge1xuXHRcdFx0XHRcdC8vIFRoaXMgY2FuIGhhcHBlbiBkdXJpbmcgc29tZSBvZGQgYmVoYXZpb3IgaW4gYnJvd3NlciB3aGVyZSBtYWluIGxvb3Agd291bGQgYmUgYmxvY2tlZCBieSB3ZWJhdXRobiAoaGVsbG8sIEZGKSBhbmQgdGhlbiB3ZSB3b3VsZCB0cnkgdG9cblx0XHRcdFx0XHQvLyBjYW5jZWwgdG9vIGxhdGUuIE5vIGhhcm0gaGVyZSBhbnl3YXkgaWYgdGhlIHNlc3Npb24gaXMgYWxyZWFkeSBnb25lLlxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihcIlRyaWVkIHRvIGNhbmNlbCBzZWNvbmQgZmFjdG9yIGJ1dCBpdCB3YXMgbm90IHRoZXJlIGFueW1vcmVcIiwgZSlcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0XHQuY2F0Y2goXG5cdFx0XHRcdG9mQ2xhc3MoTG9ja2VkRXJyb3IsIChlKSA9PiB7XG5cdFx0XHRcdFx0Ly8gTWlnaHQgaGFwcGVuIGlmIHdlIHRyaWdnZXIgY2FuY2VsIGFuZCBjb25maXJtIGF0IHRoZSBzYW1lIHRpbWUuXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKFwiVHJpZWQgdG8gY2FuY2VsIHNlY29uZCBmYWN0b3IgYnV0IGl0IGlzIGN1cnJlbnRseSBsb2NrZWRcIiwgZSlcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0dGhpcy5sb2dpblJlcXVlc3RTZXNzaW9uSWQgPSBudWxsXG5cdFx0dGhpcy5sb2dnaW5nSW5Qcm9taXNlV3JhcHBlcj8ucmVqZWN0KG5ldyBDYW5jZWxsZWRFcnJvcihcImxvZ2luIGNhbmNlbGxlZFwiKSlcblx0fVxuXG5cdC8qKiBGaW5pc2hlcyAyRkEgcHJvY2VzcyBlaXRoZXIgdXNpbmcgc2Vjb25kIGZhY3RvciBvciBhcHByb3Zpbmcgc2Vzc2lvbiBvbiBhbm90aGVyIGNsaWVudC4gKi9cblx0YXN5bmMgYXV0aGVudGljYXRlV2l0aFNlY29uZEZhY3RvcihkYXRhOiBTZWNvbmRGYWN0b3JBdXRoRGF0YSwgaG9zdD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoU2Vjb25kRmFjdG9yQXV0aFNlcnZpY2UsIGRhdGEsIHsgYmFzZVVybDogaG9zdCB9KVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlc3VtZXMgcHJldmlvdXNseSBjcmVhdGVkIHNlc3Npb24gKHVzaW5nIHBlcnNpc3RlZCBjcmVkZW50aWFscykuXG5cdCAqIEBwYXJhbSBjcmVkZW50aWFscyB0aGUgc2F2ZWQgY3JlZGVudGlhbHMgdG8gdXNlXG5cdCAqIEBwYXJhbSBleHRlcm5hbFVzZXJLZXlEZXJpdmVyIGluZm9ybWF0aW9uIGZvciBkZXJpdmluZyBhIGtleSAoaWYgZXh0ZXJuYWwgdXNlcilcblx0ICogQHBhcmFtIGRhdGFiYXNlS2V5IGtleSB0byB1bmxvY2sgdGhlIGxvY2FsIGRhdGFiYXNlIChpZiBlbmFibGVkKVxuXHQgKiBAcGFyYW0gdGltZVJhbmdlRGF5cyB0aGUgdXNlciBjb25maWd1cmVkIHRpbWUgcmFuZ2UgZm9yIHRoZSBvZmZsaW5lIGRhdGFiYXNlXG5cdCAqL1xuXHRhc3luYyByZXN1bWVTZXNzaW9uKFxuXHRcdGNyZWRlbnRpYWxzOiBDcmVkZW50aWFscyxcblx0XHRleHRlcm5hbFVzZXJLZXlEZXJpdmVyOiBFeHRlcm5hbFVzZXJLZXlEZXJpdmVyIHwgbnVsbCxcblx0XHRkYXRhYmFzZUtleTogVWludDhBcnJheSB8IG51bGwsXG5cdFx0dGltZVJhbmdlRGF5czogbnVtYmVyIHwgbnVsbCxcblx0KTogUHJvbWlzZTxSZXN1bWVTZXNzaW9uUmVzdWx0PiB7XG5cdFx0aWYgKHRoaXMudXNlckZhY2FkZS5nZXRVc2VyKCkgIT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXG5cdFx0XHRcdGBUcnlpbmcgdG8gcmVzdW1lIHRoZSBzZXNzaW9uIGZvciB1c2VyICR7Y3JlZGVudGlhbHMudXNlcklkfSB3aGlsZSBhbHJlYWR5IGxvZ2dlZCBpbiBmb3IgJHt0aGlzLnVzZXJGYWNhZGUuZ2V0VXNlcigpPy5faWR9YCxcblx0XHRcdClcblx0XHR9XG5cdFx0aWYgKHRoaXMuYXN5bmNMb2dpblN0YXRlLnN0YXRlICE9PSBcImlkbGVcIikge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoYFRyeWluZyB0byByZXN1bWUgdGhlIHNlc3Npb24gZm9yIHVzZXIgJHtjcmVkZW50aWFscy51c2VySWR9IHdoaWxlIHRoZSBhc3luY0xvZ2luU3RhdGUgaXMgJHt0aGlzLmFzeW5jTG9naW5TdGF0ZS5zdGF0ZX1gKVxuXHRcdH1cblx0XHR0aGlzLnVzZXJGYWNhZGUuc2V0QWNjZXNzVG9rZW4oY3JlZGVudGlhbHMuYWNjZXNzVG9rZW4pXG5cdFx0Ly8gaW1wb3J0YW50OiBhbnkgZXhpdCBwb2ludCBmcm9tIGhlcmUgb24gc2hvdWxkIGRlaW5pdCB0aGUgY2FjaGUgaWYgdGhlIGxvZ2luIGhhc24ndCBzdWNjZWVkZWRcblx0XHRjb25zdCBjYWNoZUluZm8gPSBhd2FpdCB0aGlzLmluaXRDYWNoZSh7XG5cdFx0XHR1c2VySWQ6IGNyZWRlbnRpYWxzLnVzZXJJZCxcblx0XHRcdGRhdGFiYXNlS2V5LFxuXHRcdFx0dGltZVJhbmdlRGF5cyxcblx0XHRcdGZvcmNlTmV3RGF0YWJhc2U6IGZhbHNlLFxuXHRcdH0pXG5cdFx0Y29uc3Qgc2Vzc2lvbklkID0gdGhpcy5nZXRTZXNzaW9uSWQoY3JlZGVudGlhbHMpXG5cdFx0dHJ5IHtcblx0XHRcdC8vIHVzaW5nIG9mZmxpbmUsIGZyZWUsIGhhdmUgY29ubmVjdGlvbiAgICAgICAgIC0+IHN5bmMgbG9naW5cblx0XHRcdC8vIHVzaW5nIG9mZmxpbmUsIGZyZWUsIG5vIGNvbm5lY3Rpb24gICAgICAgICAgIC0+IGluZGljYXRlIHRoYXQgb2ZmbGluZSBsb2dpbiBpcyBub3QgZm9yIGZyZWUgY3VzdG9tZXJzXG5cdFx0XHQvLyB1c2luZyBvZmZsaW5lLCBwcmVtaXVtLCBoYXZlIGNvbm5lY3Rpb24gICAgICAtPiBhc3luYyBsb2dpblxuXHRcdFx0Ly8gdXNpbmcgb2ZmbGluZSwgcHJlbWl1bSwgbm8gY29ubmVjdGlvbiAgICAgICAgLT4gYXN5bmMgbG9naW4gdy8gbGF0ZXIgcmV0cnlcblx0XHRcdC8vIG5vIG9mZmxpbmUsIGZyZWUsIGhhdmUgY29ubmVjdGlvbiAgICAgICAgICAgIC0+IHN5bmMgbG9naW5cblx0XHRcdC8vIG5vIG9mZmxpbmUsIGZyZWUsIG5vIGNvbm5lY3Rpb24gICAgICAgICAgICAgIC0+IHN5bmMgbG9naW4sIGZhaWwgd2l0aCBjb25uZWN0aW9uIGVycm9yXG5cdFx0XHQvLyBubyBvZmZsaW5lLCBwcmVtaXVtLCBoYXZlIGNvbm5lY3Rpb24gICAgICAgICAtPiBzeW5jIGxvZ2luXG5cdFx0XHQvLyBubyBvZmZsaW5lLCBwcmVtaXVtLCBubyBjb25uZWN0aW9uICAgICAgICAgICAtPiBzeW5jIGxvZ2luLCBmYWlsIHdpdGggY29ubmVjdGlvbiBlcnJvclxuXG5cdFx0XHQvLyBJZiBhIHVzZXIgZW5hYmxlcyBvZmZsaW5lIHN0b3JhZ2UgZm9yIHRoZSBmaXJzdCB0aW1lLCBhZnRlciBhbHJlYWR5IGhhdmluZyBzYXZlZCBjcmVkZW50aWFsc1xuXHRcdFx0Ly8gdGhlbiB1cG9uIHRoZWlyIG5leHQgbG9naW4sIHRoZXkgd29uJ3QgaGF2ZSBhbiBvZmZsaW5lIGRhdGFiYXNlIGF2YWlsYWJsZSwgbWVhbmluZyB3ZSBoYXZlIHRvIGRvXG5cdFx0XHQvLyBzeW5jaHJvbm91cyBsb2dpbiBpbiBvcmRlciB0byBsb2FkIGFsbCB0aGUgbmVjZXNzYXJ5IGtleXMgYW5kIHN1Y2hcblx0XHRcdC8vIHRoZSBuZXh0IHRpbWUgdGhleSBsb2cgaW4gdGhleSB3aWxsIGJlIGFibGUgdG8gZG8gYXN5bmNocm9ub3VzIGxvZ2luXG5cdFx0XHRpZiAoY2FjaGVJbmZvPy5pc1BlcnNpc3RlbnQgJiYgIWNhY2hlSW5mby5pc05ld09mZmxpbmVEYikge1xuXHRcdFx0XHRjb25zdCB1c2VyID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChVc2VyVHlwZVJlZiwgY3JlZGVudGlhbHMudXNlcklkKVxuXHRcdFx0XHRpZiAodXNlci5hY2NvdW50VHlwZSAhPT0gQWNjb3VudFR5cGUuUEFJRCkge1xuXHRcdFx0XHRcdC8vIGlmIGFjY291bnQgaXMgZnJlZSBkbyBub3Qgc3RhcnQgb2ZmbGluZSBsb2dpbi9hc3luYyBsb2dpbiB3b3JrZmxvdy5cblx0XHRcdFx0XHQvLyBhd2FpdCBiZWZvcmUgcmV0dXJuIHRvIGNhdGNoIGVycm9ycyBoZXJlXG5cdFx0XHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMuZmluaXNoUmVzdW1lU2Vzc2lvbihjcmVkZW50aWFscywgZXh0ZXJuYWxVc2VyS2V5RGVyaXZlciwgY2FjaGVJbmZvKS5jYXRjaChcblx0XHRcdFx0XHRcdG9mQ2xhc3MoQ29ubmVjdGlvbkVycm9yLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucmVzZXRTZXNzaW9uKClcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHsgdHlwZTogXCJlcnJvclwiLCByZWFzb246IFJlc3VtZVNlc3Npb25FcnJvclJlYXNvbi5PZmZsaW5lTm90QXZhaWxhYmxlRm9yRnJlZSB9XG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy51c2VyRmFjYWRlLnNldFVzZXIodXNlcilcblxuXHRcdFx0XHQvLyBUZW1wb3Jhcnkgd29ya2Fyb3VuZCBmb3IgdGhlIHRyYW5zaXRpb25hbCBwZXJpb2Rcblx0XHRcdFx0Ly8gQmVmb3JlIG9mZmxpbmUgbG9naW4gd2FzIGVuYWJsZWQgKGluIDMuOTYuNCkgd2UgZGlkbid0IHVzZSBjYWNoZSBmb3IgdGhlIGxvZ2luIHByb2Nlc3MsIG9ubHkgYWZ0ZXJ3YXJkcy5cblx0XHRcdFx0Ly8gVGhpcyBjb3VsZCBsZWFkIHRvIGEgc2l0dWF0aW9uIHdoZXJlIHdlIG5ldmVyIGxvYWRlZCBvciBzYXZlZCB1c2VyIGdyb3VwSW5mbyBidXQgd291bGQgdHJ5IHRvIHVzZSBpdCBub3cuXG5cdFx0XHRcdC8vIFdlIGNhbiByZW1vdmUgdGhpcyBhZnRlciBhIGZldyB2ZXJzaW9ucyB3aGVuIHRoZSBidWxrIG9mIHBlb3BsZSB3aG8gZW5hYmxlZCBvZmZsaW5lIHdpbGwgdXBncmFkZS5cblx0XHRcdFx0bGV0IHVzZXJHcm91cEluZm86IEdyb3VwSW5mb1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHVzZXJHcm91cEluZm8gPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEdyb3VwSW5mb1R5cGVSZWYsIHVzZXIudXNlckdyb3VwLmdyb3VwSW5mbylcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiQ291bGQgbm90IGRvIHN0YXJ0IGxvZ2luLCBncm91cEluZm8gaXMgbm90IGNhY2hlZCwgZmFsbGluZyBiYWNrIHRvIHN5bmMgbG9naW5cIilcblx0XHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIExvZ2luSW5jb21wbGV0ZUVycm9yKSB7XG5cdFx0XHRcdFx0XHQvLyBhd2FpdCBiZWZvcmUgcmV0dXJuIHRvIGNhdGNoIHRoZSBlcnJvcnMgaGVyZVxuXHRcdFx0XHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMuZmluaXNoUmVzdW1lU2Vzc2lvbihjcmVkZW50aWFscywgZXh0ZXJuYWxVc2VyS2V5RGVyaXZlciwgY2FjaGVJbmZvKVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyBub2luc3BlY3Rpb24gRXhjZXB0aW9uQ2F1Z2h0TG9jYWxseUpTOiB3ZSB3YW50IHRvIG1ha2Ugc3VyZSB3ZSBnbyB0aHJvdyB0aGUgc2FtZSBleGl0IHBvaW50XG5cdFx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gU3RhcnQgZnVsbCBsb2dpbiBhc3luY1xuXHRcdFx0XHRQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHRoaXMuYXN5bmNSZXN1bWVTZXNzaW9uKGNyZWRlbnRpYWxzLCBjYWNoZUluZm8pKVxuXHRcdFx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0XHRcdHVzZXIsXG5cdFx0XHRcdFx0dXNlckdyb3VwSW5mbyxcblx0XHRcdFx0XHRzZXNzaW9uSWQsXG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHsgdHlwZTogXCJzdWNjZXNzXCIsIGRhdGEgfVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gYXdhaXQgYmVmb3JlIHJldHVybiB0byBjYXRjaCBlcnJvcnMgaGVyZVxuXHRcdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5maW5pc2hSZXN1bWVTZXNzaW9uKGNyZWRlbnRpYWxzLCBleHRlcm5hbFVzZXJLZXlEZXJpdmVyLCBjYWNoZUluZm8pXG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Ly8gSWYgd2UgaW5pdGlhbGl6ZWQgdGhlIGNhY2hlLCBidXQgdGhlbiB3ZSBjb3VsZG4ndCBhdXRoZW50aWNhdGUgd2Ugc2hvdWxkIGRlLWluaXRpYWxpemVcblx0XHRcdC8vIHRoZSBjYWNoZSBhZ2FpbiBiZWNhdXNlIHdlIHdpbGwgaW5pdGlhbGl6ZSBpdCBmb3IgdGhlIG5leHQgYXR0ZW1wdC5cblx0XHRcdC8vIEl0IG1pZ2h0IGJlIGFsc28gY2FsbGVkIGluIGluaXRTZXNzaW9uIGJ1dCB0aGUgZXJyb3IgY2FuIGJlIHRocm93biBldmVuIGJlZm9yZSB0aGF0IChlLmcuIGlmIHRoZSBkYiBpcyBlbXB0eSBmb3Igc29tZSByZWFzb24pIHNvIHdlIHJlc2V0XG5cdFx0XHQvLyB0aGUgc2Vzc2lvbiBoZXJlIGFzIHdlbGwsIG90aGVyd2lzZSB3ZSBtaWdodCB0cnkgdG8gb3BlbiB0aGUgREIgdHdpY2UuXG5cdFx0XHRhd2FpdCB0aGlzLnJlc2V0U2Vzc2lvbigpXG5cdFx0XHR0aHJvdyBlXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRTZXNzaW9uSWQoY3JlZGVudGlhbHM6IENyZWRlbnRpYWxzKTogSWRUdXBsZSB7XG5cdFx0cmV0dXJuIFt0aGlzLmdldFNlc3Npb25MaXN0SWQoY3JlZGVudGlhbHMuYWNjZXNzVG9rZW4pLCB0aGlzLmdldFNlc3Npb25FbGVtZW50SWQoY3JlZGVudGlhbHMuYWNjZXNzVG9rZW4pXVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBhc3luY1Jlc3VtZVNlc3Npb24oY3JlZGVudGlhbHM6IENyZWRlbnRpYWxzLCBjYWNoZUluZm86IENhY2hlSW5mbyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0aGlzLmFzeW5jTG9naW5TdGF0ZS5zdGF0ZSA9PT0gXCJydW5uaW5nXCIpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcImZpbmlzaExvZ2luUmVzdW1lIHJ1biBpbiBwYXJhbGxlbFwiKVxuXHRcdH1cblx0XHR0aGlzLmFzeW5jTG9naW5TdGF0ZSA9IHsgc3RhdGU6IFwicnVubmluZ1wiIH1cblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5maW5pc2hSZXN1bWVTZXNzaW9uKGNyZWRlbnRpYWxzLCBudWxsLCBjYWNoZUluZm8pXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBOb3RBdXRoZW50aWNhdGVkRXJyb3IgfHwgZSBpbnN0YW5jZW9mIFNlc3Npb25FeHBpcmVkRXJyb3IpIHtcblx0XHRcdFx0Ly8gRm9yIHRoaXMgdHlwZSBvZiBlcnJvcnMgd2UgY2Fubm90IHVzZSBjcmVkZW50aWFscyBhbnltb3JlLlxuXHRcdFx0XHR0aGlzLmFzeW5jTG9naW5TdGF0ZSA9IHsgc3RhdGU6IFwiaWRsZVwiIH1cblx0XHRcdFx0YXdhaXQgdGhpcy5sb2dpbkxpc3RlbmVyLm9uTG9naW5GYWlsdXJlKExvZ2luRmFpbFJlYXNvbi5TZXNzaW9uRXhwaXJlZClcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuYXN5bmNMb2dpblN0YXRlID0geyBzdGF0ZTogXCJmYWlsZWRcIiwgY3JlZGVudGlhbHMsIGNhY2hlSW5mbyB9XG5cdFx0XHRcdGlmICghKGUgaW5zdGFuY2VvZiBDb25uZWN0aW9uRXJyb3IpKSBhd2FpdCB0aGlzLnNlbmRFcnJvcihlKVxuXHRcdFx0XHRhd2FpdCB0aGlzLmxvZ2luTGlzdGVuZXIub25Mb2dpbkZhaWx1cmUoTG9naW5GYWlsUmVhc29uLkVycm9yKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZmluaXNoUmVzdW1lU2Vzc2lvbihcblx0XHRjcmVkZW50aWFsczogQ3JlZGVudGlhbHMsXG5cdFx0ZXh0ZXJuYWxVc2VyS2V5RGVyaXZlcjogRXh0ZXJuYWxVc2VyS2V5RGVyaXZlciB8IG51bGwsXG5cdFx0Y2FjaGVJbmZvOiBDYWNoZUluZm8sXG5cdCk6IFByb21pc2U8UmVzdW1lU2Vzc2lvblN1Y2Nlc3M+IHtcblx0XHRjb25zdCBzZXNzaW9uSWQgPSB0aGlzLmdldFNlc3Npb25JZChjcmVkZW50aWFscylcblx0XHRjb25zdCBzZXNzaW9uRGF0YSA9IGF3YWl0IHRoaXMubG9hZFNlc3Npb25EYXRhKGNyZWRlbnRpYWxzLmFjY2Vzc1Rva2VuKVxuXG5cdFx0Y29uc3QgYWNjZXNzS2V5ID0gYXNzZXJ0Tm90TnVsbChzZXNzaW9uRGF0YS5hY2Nlc3NLZXksIFwibm8gYWNjZXNzIGtleSBvbiBzZXNzaW9uIGRhdGEhXCIpXG5cdFx0Y29uc3QgaXNFeHRlcm5hbFVzZXIgPSBleHRlcm5hbFVzZXJLZXlEZXJpdmVyICE9IG51bGxcblxuXHRcdGxldCB1c2VyUGFzc3BocmFzZUtleTogQWVzS2V5XG5cdFx0bGV0IGNyZWRlbnRpYWxzV2l0aFBhc3NwaHJhc2VLZXk6IENyZWRlbnRpYWxzXG5cblx0XHQvLyBQcmV2aW91c2x5IG9ubHkgdGhlIGVuY3J5cHRlZFBhc3N3b3JkIHdhcyBzdG9yZWQsIG5vdyB3ZSBwcmVmZXIgdG8gdXNlIHRoZSBrZXkgaWYgaXQncyBhbHJlYWR5IHRoZXJlXG5cdFx0Ly8gYW5kIGtlZXAgcGFzc3BocmFzZSBmb3IgbWlncmF0aW5nIEtERiBmb3Igbm93LlxuXHRcdGlmIChjcmVkZW50aWFscy5lbmNyeXB0ZWRQYXNzd29yZCkge1xuXHRcdFx0Y29uc3QgcGFzc3BocmFzZSA9IHV0ZjhVaW50OEFycmF5VG9TdHJpbmcoYWVzRGVjcnlwdChhY2Nlc3NLZXksIGJhc2U2NFRvVWludDhBcnJheShjcmVkZW50aWFscy5lbmNyeXB0ZWRQYXNzd29yZCkpKVxuXHRcdFx0aWYgKGlzRXh0ZXJuYWxVc2VyKSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuY2hlY2tPdXRkYXRlZEV4dGVybmFsU2FsdChjcmVkZW50aWFscywgc2Vzc2lvbkRhdGEsIGV4dGVybmFsVXNlcktleURlcml2ZXIuc2FsdClcblx0XHRcdFx0dXNlclBhc3NwaHJhc2VLZXkgPSBhd2FpdCB0aGlzLmRlcml2ZVVzZXJQYXNzcGhyYXNlS2V5KHsgLi4uZXh0ZXJuYWxVc2VyS2V5RGVyaXZlciwgcGFzc3BocmFzZSB9KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgcGFzc3BocmFzZURhdGEgPSBhd2FpdCB0aGlzLmxvYWRVc2VyUGFzc3BocmFzZUtleShjcmVkZW50aWFscy5sb2dpbiwgcGFzc3BocmFzZSlcblx0XHRcdFx0dXNlclBhc3NwaHJhc2VLZXkgPSBwYXNzcGhyYXNlRGF0YS51c2VyUGFzc3BocmFzZUtleVxuXHRcdFx0fVxuXHRcdFx0Y29uc3QgZW5jcnlwdGVkUGFzc3BocmFzZUtleSA9IGVuY3J5cHRLZXkoYWNjZXNzS2V5LCB1c2VyUGFzc3BocmFzZUtleSlcblx0XHRcdGNyZWRlbnRpYWxzV2l0aFBhc3NwaHJhc2VLZXkgPSB7IC4uLmNyZWRlbnRpYWxzLCBlbmNyeXB0ZWRQYXNzcGhyYXNlS2V5IH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJubyBrZXkgb3IgcGFzc3dvcmQgc3RvcmVkIGluIGNyZWRlbnRpYWxzIVwiKVxuXHRcdH1cblxuXHRcdGNvbnN0IHsgdXNlciwgdXNlckdyb3VwSW5mbyB9ID0gYXdhaXQgdGhpcy5pbml0U2Vzc2lvbihzZXNzaW9uRGF0YS51c2VySWQsIGNyZWRlbnRpYWxzLmFjY2Vzc1Rva2VuLCB1c2VyUGFzc3BocmFzZUtleSlcblx0XHR0aGlzLmxvZ2luTGlzdGVuZXIub25GdWxsTG9naW5TdWNjZXNzKFNlc3Npb25UeXBlLlBlcnNpc3RlbnQsIGNhY2hlSW5mbywgY3JlZGVudGlhbHNXaXRoUGFzc3BocmFzZUtleSlcblxuXHRcdHRoaXMuYXN5bmNMb2dpblN0YXRlID0geyBzdGF0ZTogXCJpZGxlXCIgfVxuXG5cdFx0Y29uc3QgZGF0YSA9IHtcblx0XHRcdHVzZXIsXG5cdFx0XHR1c2VyR3JvdXBJbmZvLFxuXHRcdFx0c2Vzc2lvbklkLFxuXHRcdH1cblxuXHRcdC8vIFdlIG9ubHkgbmVlZCB0byBtaWdyYXRlIHRoZSBrZGYgaW4gY2FzZSBhbiBpbnRlcm5hbCB1c2VyIHJlc3VtZXMgdGhlIHNlc3Npb24uXG5cdFx0Y29uc3QgbW9kZXJuS2RmVHlwZSA9IHRoaXMuaXNNb2Rlcm5LZGZUeXBlKGFzS2RmVHlwZSh1c2VyLmtkZlZlcnNpb24pKVxuXHRcdGlmICghaXNFeHRlcm5hbFVzZXIgJiYgY3JlZGVudGlhbHMuZW5jcnlwdGVkUGFzc3dvcmQgIT0gbnVsbCAmJiAhbW9kZXJuS2RmVHlwZSkge1xuXHRcdFx0Y29uc3QgcGFzc3BocmFzZSA9IHV0ZjhVaW50OEFycmF5VG9TdHJpbmcoYWVzRGVjcnlwdChhY2Nlc3NLZXksIGJhc2U2NFRvVWludDhBcnJheShjcmVkZW50aWFscy5lbmNyeXB0ZWRQYXNzd29yZCkpKVxuXHRcdFx0YXdhaXQgdGhpcy5taWdyYXRlS2RmVHlwZShLZGZUeXBlLkFyZ29uMmlkLCBwYXNzcGhyYXNlLCB1c2VyKVxuXHRcdH1cblx0XHRpZiAoIWlzRXh0ZXJuYWxVc2VyICYmICFpc0FkbWluQ2xpZW50KCkpIHtcblx0XHRcdC8vIFdlIHRyaWdnZXIgZ3JvdXAga2V5IHJvdGF0aW9uIG9ubHkgZm9yIGludGVybmFsIHVzZXJzLlxuXHRcdFx0Ly8gSWYgd2UgaGF2ZSBub3QgbWlncmF0ZWQgdG8gYXJnb24yIHdlIHBvc3Rwb25lIGtleSByb3RhdGlvbiB1bnRpbCBuZXh0IGxvZ2luXG5cdFx0XHQvLyBpbnN0ZWFkIG9mIHJlbG9hZGluZyB0aGUgcHdLZXksIHdoaWNoIHdvdWxkIGJlIHVwZGF0ZWQgYnkgdGhlIEtERiBtaWdyYXRpb24uXG5cdFx0XHRhd2FpdCB0aGlzLmtleVJvdGF0aW9uRmFjYWRlLmluaXRpYWxpemUodXNlclBhc3NwaHJhc2VLZXksIG1vZGVybktkZlR5cGUpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgdHlwZTogXCJzdWNjZXNzXCIsIGRhdGEgfVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbml0U2Vzc2lvbihcblx0XHR1c2VySWQ6IElkLFxuXHRcdGFjY2Vzc1Rva2VuOiBCYXNlNjRVcmwsXG5cdFx0dXNlclBhc3NwaHJhc2VLZXk6IEFlc0tleSxcblx0KTogUHJvbWlzZTx7IHVzZXI6IFVzZXI7IGFjY2Vzc1Rva2VuOiBzdHJpbmc7IHVzZXJHcm91cEluZm86IEdyb3VwSW5mbyB9PiB7XG5cdFx0Ly8gV2UgbWlnaHQgaGF2ZSB1c2VySWQgYWxyZWFkeSBpZjpcblx0XHQvLyAtIHNlc3Npb24gaGFzIGV4cGlyZWQgYW5kIGEgbmV3IG9uZSB3YXMgY3JlYXRlZFxuXHRcdC8vIC0gaWYgaXQncyBhIHBhcnRpYWwgbG9naW5cblx0XHRjb25zdCB1c2VySWRGcm9tRm9ybWVyTG9naW4gPSB0aGlzLnVzZXJGYWNhZGUuZ2V0VXNlcigpPy5faWQgPz8gbnVsbFxuXG5cdFx0aWYgKHVzZXJJZEZyb21Gb3JtZXJMb2dpbiAmJiB1c2VySWQgIT09IHVzZXJJZEZyb21Gb3JtZXJMb2dpbikge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiZGlmZmVyZW50IHVzZXIgaXMgdHJpZWQgdG8gbG9naW4gaW4gZXhpc3Rpbmcgb3RoZXIgdXNlcidzIHNlc3Npb25cIilcblx0XHR9XG5cblx0XHR0aGlzLnVzZXJGYWNhZGUuc2V0QWNjZXNzVG9rZW4oYWNjZXNzVG9rZW4pXG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gV2UgbmVlZCB0byB1c2UgdXAtdG8tZGF0ZSB1c2VyIHRvIG1ha2Ugc3VyZSB0aGF0IHdlIGFyZSBub3QgY2hlY2tpbmcgZm9yIG91dGRhdGVkIHZlcmlmaWVkIGFnYWluc3QgY2FjaGVkIHVzZXIuXG5cdFx0XHRjb25zdCB1c2VyID0gYXdhaXQgdGhpcy5ub25jYWNoaW5nRW50aXR5Q2xpZW50LmxvYWQoVXNlclR5cGVSZWYsIHVzZXJJZClcblx0XHRcdGF3YWl0IHRoaXMuY2hlY2tPdXRkYXRlZFZlcmlmaWVyKHVzZXIsIGFjY2Vzc1Rva2VuLCB1c2VyUGFzc3BocmFzZUtleSlcblxuXHRcdFx0Ly8gdGhpcyBtYXkgYmUgdGhlIHNlY29uZCB0aW1lIHdlIHNldCB1c2VyIGluIGNhc2Ugd2UgaGFkIGEgcGFydGlhbCBvZmZsaW5lIGxvZ2luIGJlZm9yZVxuXHRcdFx0Ly8gd2UgZG8gaXQgdW5jb25kaXRpb25hbGx5IGhlcmUsIHRvIG1ha2Ugc3VyZSB3ZSB1bmxvY2sgdGhlIGxhdGVzdCB1c2VyIGdyb3VwIGtleSByaWdodCBiZWxvd1xuXHRcdFx0dGhpcy51c2VyRmFjYWRlLnNldFVzZXIodXNlcilcblx0XHRcdGNvbnN0IHdhc0Z1bGx5TG9nZ2VkSW4gPSB0aGlzLnVzZXJGYWNhZGUuaXNGdWxseUxvZ2dlZEluKClcblxuXHRcdFx0dGhpcy51c2VyRmFjYWRlLnVubG9ja1VzZXJHcm91cEtleSh1c2VyUGFzc3BocmFzZUtleSlcblx0XHRcdGNvbnN0IHVzZXJHcm91cEluZm8gPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEdyb3VwSW5mb1R5cGVSZWYsIHVzZXIudXNlckdyb3VwLmdyb3VwSW5mbylcblxuXHRcdFx0YXdhaXQgdGhpcy5sb2FkRW50cm9weSgpXG5cblx0XHRcdC8vIElmIHdlIGhhdmUgYmVlbiBmdWxseSBsb2dnZWQgaW4gYXQgbGVhc3Qgb25jZSBhbHJlYWR5IChwcm9iYWJseSBleHBpcmVkIGVwaGVtZXJhbCBzZXNzaW9uKVxuXHRcdFx0Ly8gdGhlbiB3ZSBqdXN0IHJlY29ubmVjdCBhbmQgcmUtZG93bmxvYWQgbWlzc2luZyBldmVudHMuXG5cdFx0XHQvLyBGb3IgbmV3IGNvbm5lY3Rpb25zIHdlIGhhdmUgc3BlY2lhbCBoYW5kbGluZy5cblx0XHRcdGlmICh3YXNGdWxseUxvZ2dlZEluKSB7XG5cdFx0XHRcdHRoaXMuZXZlbnRCdXNDbGllbnQuY29ubmVjdChDb25uZWN0TW9kZS5SZWNvbm5lY3QpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLmV2ZW50QnVzQ2xpZW50LmNvbm5lY3QoQ29ubmVjdE1vZGUuSW5pdGlhbClcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgdGhpcy5lbnRyb3B5RmFjYWRlLnN0b3JlRW50cm9weSgpXG5cdFx0XHRyZXR1cm4geyB1c2VyLCBhY2Nlc3NUb2tlbiwgdXNlckdyb3VwSW5mbyB9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhpcy5yZXNldFNlc3Npb24oKVxuXHRcdFx0dGhyb3cgZVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBpbml0IGFuIGFwcHJvcHJpYXRlIGNhY2hlIGltcGxlbWVudGF0aW9uLiB3ZSB3aWxsIGFsd2F5cyB0cnkgdG8gY3JlYXRlIGEgcGVyc2lzdGVudCBjYWNoZSBmb3IgcGVyc2lzdGVudCBzZXNzaW9ucyBhbmQgZmFsbCBiYWNrIHRvIGFuIGVwaGVtZXJhbCBjYWNoZVxuXHQgKiBpbiB0aGUgYnJvd3Nlci5cblx0ICpcblx0ICogQHBhcmFtIHVzZXJJZCB0aGUgdXNlciBmb3Igd2hpY2ggdGhlIGNhY2hlIGlzIGNyZWF0ZWRcblx0ICogQHBhcmFtIGRhdGFiYXNlS2V5IHRoZSBrZXkgdG8gdXNlXG5cdCAqIEBwYXJhbSB0aW1lUmFuZ2VEYXlzIGhvdyBmYXIgaW50byB0aGUgcGFzdCB0aGUgY2FjaGUga2VlcHMgZGF0YSBhcm91bmRcblx0ICogQHBhcmFtIGZvcmNlTmV3RGF0YWJhc2UgdHJ1ZSBpZiB0aGUgb2xkIGRhdGFiYXNlIHNob3VsZCBiZSBkZWxldGVkIGlmIHRoZXJlIGlzIG9uZVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBpbml0Q2FjaGUoeyB1c2VySWQsIGRhdGFiYXNlS2V5LCB0aW1lUmFuZ2VEYXlzLCBmb3JjZU5ld0RhdGFiYXNlIH06IEluaXRDYWNoZU9wdGlvbnMpOiBQcm9taXNlPENhY2hlSW5mbz4ge1xuXHRcdGlmIChkYXRhYmFzZUtleSAhPSBudWxsKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRkYXRhYmFzZUtleSxcblx0XHRcdFx0Li4uKGF3YWl0IHRoaXMuY2FjaGVJbml0aWFsaXplci5pbml0aWFsaXplKHtcblx0XHRcdFx0XHR0eXBlOiBcIm9mZmxpbmVcIixcblx0XHRcdFx0XHR1c2VySWQsXG5cdFx0XHRcdFx0ZGF0YWJhc2VLZXksXG5cdFx0XHRcdFx0dGltZVJhbmdlRGF5cyxcblx0XHRcdFx0XHRmb3JjZU5ld0RhdGFiYXNlLFxuXHRcdFx0XHR9KSksXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7IGRhdGFiYXNlS2V5OiBudWxsLCAuLi4oYXdhaXQgdGhpcy5jYWNoZUluaXRpYWxpemVyLmluaXRpYWxpemUoeyB0eXBlOiBcImVwaGVtZXJhbFwiLCB1c2VySWQgfSkpIH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGRlSW5pdENhY2hlKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmNhY2hlSW5pdGlhbGl6ZXIuZGVJbml0aWFsaXplKClcblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVjayB3aGV0aGVyIHRoZSBwYXNzZWQgc2FsdCBmb3IgZXh0ZXJuYWwgdXNlciBpcyB1cC10by1kYXRlICh3aGV0aGVyIGFuIG91dGRhdGVkIGxpbmsgd2FzIHVzZWQpLlxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBjaGVja091dGRhdGVkRXh0ZXJuYWxTYWx0KFxuXHRcdGNyZWRlbnRpYWxzOiBDcmVkZW50aWFscyxcblx0XHRzZXNzaW9uRGF0YToge1xuXHRcdFx0dXNlcklkOiBJZFxuXHRcdFx0YWNjZXNzS2V5OiBBZXNLZXkgfCBudWxsXG5cdFx0fSxcblx0XHRleHRlcm5hbFVzZXJTYWx0OiBVaW50OEFycmF5LFxuXHQpIHtcblx0XHR0aGlzLnVzZXJGYWNhZGUuc2V0QWNjZXNzVG9rZW4oY3JlZGVudGlhbHMuYWNjZXNzVG9rZW4pXG5cdFx0Y29uc3QgdXNlciA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoVXNlclR5cGVSZWYsIHNlc3Npb25EYXRhLnVzZXJJZClcblx0XHRjb25zdCBsYXRlc3RTYWx0SGFzaCA9IGFzc2VydE5vdE51bGwodXNlci5leHRlcm5hbEF1dGhJbmZvIS5sYXRlc3RTYWx0SGFzaCwgXCJsYXRlc3RTYWx0SGFzaCBpcyBub3Qgc2V0IVwiKVxuXHRcdGlmICghYXJyYXlFcXVhbHMobGF0ZXN0U2FsdEhhc2gsIHNoYTI1Nkhhc2goZXh0ZXJuYWxVc2VyU2FsdCkpKSB7XG5cdFx0XHQvLyBEbyBub3QgZGVsZXRlIHNlc3Npb24gb3IgY3JlZGVudGlhbHMsIHdlIGNhbiBzdGlsbCB1c2UgdGhlbSBpZiB0aGUgcGFzc3dvcmRcblx0XHRcdC8vIGhhc24ndCBiZWVuIGNoYW5nZWQuXG5cdFx0XHR0aGlzLnJlc2V0U2Vzc2lvbigpXG5cdFx0XHR0aHJvdyBuZXcgQWNjZXNzRXhwaXJlZEVycm9yKFwiU2FsdCBjaGFuZ2VkLCBvdXRkYXRlZCBsaW5rP1wiKVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVjayB0aGF0IHRoZSBhdXRoIHZlcmlmaWVyIGlzIG5vdCBjaGFuZ2VkIGUuZy4gZHVlIHRvIHRoZSBwYXNzd29yZCBjaGFuZ2UuXG5cdCAqIE5vcm1hbGx5IHRoaXMgd29uJ3QgaGFwcGVuIGZvciBpbnRlcm5hbCB1c2VycyBhcyBhbGwgc2Vzc2lvbnMgYXJlIGNsb3NlZCBvbiBwYXNzd29yZCBjaGFuZ2UuIFRoaXMgbWF5IGhhcHBlbiBmb3IgZXh0ZXJuYWwgdXNlcnMgd2hlbiB0aGUgc2VuZGVyIGhhc1xuXHQgKiBjaGFuZ2VkIHRoZSBwYXNzd29yZC5cblx0ICogV2UgZG8gbm90IGRlbGV0ZSBhbGwgc2Vzc2lvbnMgb24gdGhlIHNlcnZlciB3aGVuIGNoYW5naW5nIHRoZSBleHRlcm5hbCBwYXNzd29yZCB0byBhdm9pZCB0aGF0IGFuIGV4dGVybmFsIHVzZXIgaXMgaW1tZWRpYXRlbHkgbG9nZ2VkIG91dC5cblx0ICpcblx0ICogQHBhcmFtIHVzZXIgU2hvdWxkIGJlIHVwLXRvLWRhdGUsIGkuZS4sIG5vdCBsb2FkZWQgZnJvbSBjYWNoZSwgYnV0IGZyZXNoIGZyb20gdGhlIHNlcnZlciwgb3RoZXJ3aXNlIGFuIG91dGRhdGVkIHZlcmlmaWVyIHdpbGwgY2F1c2UgYSBsb2dvdXQuXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGNoZWNrT3V0ZGF0ZWRWZXJpZmllcih1c2VyOiBVc2VyLCBhY2Nlc3NUb2tlbjogc3RyaW5nLCB1c2VyUGFzc3BocmFzZUtleTogQWVzMTI4S2V5KSB7XG5cdFx0aWYgKHVpbnQ4QXJyYXlUb0Jhc2U2NCh1c2VyLnZlcmlmaWVyKSAhPT0gdWludDhBcnJheVRvQmFzZTY0KHNoYTI1Nkhhc2goY3JlYXRlQXV0aFZlcmlmaWVyKHVzZXJQYXNzcGhyYXNlS2V5KSkpKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIkF1dGggdmVyaWZpZXIgaGFzIGNoYW5nZWRcIilcblx0XHRcdC8vIGRlbGV0ZSB0aGUgb2Jzb2xldGUgc2Vzc2lvbiB0byBtYWtlIHN1cmUgaXQgY2FuIG5vdCBiZSB1c2VkIGFueSBtb3JlXG5cdFx0XHRhd2FpdCB0aGlzLmRlbGV0ZVNlc3Npb24oYWNjZXNzVG9rZW4pLmNhdGNoKChlKSA9PiBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IGRlbGV0ZSBzZXNzaW9uXCIsIGUpKVxuXHRcdFx0YXdhaXQgdGhpcy5yZXNldFNlc3Npb24oKVxuXHRcdFx0dGhyb3cgbmV3IE5vdEF1dGhlbnRpY2F0ZWRFcnJvcihcIkF1dGggdmVyaWZpZXIgaGFzIGNoYW5nZWRcIilcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGxvYWRVc2VyUGFzc3BocmFzZUtleShcblx0XHRtYWlsQWRkcmVzczogc3RyaW5nLFxuXHRcdHBhc3NwaHJhc2U6IHN0cmluZyxcblx0KTogUHJvbWlzZTx7XG5cdFx0a2RmVHlwZTogS2RmVHlwZVxuXHRcdHVzZXJQYXNzcGhyYXNlS2V5OiBBZXNLZXlcblx0fT4ge1xuXHRcdG1haWxBZGRyZXNzID0gbWFpbEFkZHJlc3MudG9Mb3dlckNhc2UoKS50cmltKClcblx0XHRjb25zdCBzYWx0UmVxdWVzdCA9IGNyZWF0ZVNhbHREYXRhKHsgbWFpbEFkZHJlc3MgfSlcblx0XHRjb25zdCBzYWx0UmV0dXJuID0gYXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IuZ2V0KFNhbHRTZXJ2aWNlLCBzYWx0UmVxdWVzdClcblx0XHRjb25zdCBrZGZUeXBlID0gYXNLZGZUeXBlKHNhbHRSZXR1cm4ua2RmVmVyc2lvbilcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXNlclBhc3NwaHJhc2VLZXk6IGF3YWl0IHRoaXMuZGVyaXZlVXNlclBhc3NwaHJhc2VLZXkoeyBrZGZUeXBlLCBwYXNzcGhyYXNlLCBzYWx0OiBzYWx0UmV0dXJuLnNhbHQgfSksXG5cdFx0XHRrZGZUeXBlLFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBXZSB1c2UgdGhlIGFjY2Vzc1Rva2VuIHRoYXQgc2hvdWxkIGJlIGRlbGV0ZWQgZm9yIGF1dGhlbnRpY2F0aW9uLiBUaGVyZWZvcmUgaXQgY2FuIGJlIGludm9rZWQgd2hpbGUgbG9nZ2VkIGluIG9yIGxvZ2dlZCBvdXQuXG5cdCAqXG5cdCAqIEBwYXJhbSBwdXNoSWRlbnRpZmllciBpZGVudGlmaWVyIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGRldmljZSwgaWYgYW55LCB0byBkZWxldGUgUHVzaElkZW50aWZpZXIgb24gdGhlIHNlcnZlclxuXHQgKi9cblx0YXN5bmMgZGVsZXRlU2Vzc2lvbihhY2Nlc3NUb2tlbjogQmFzZTY0VXJsLCBwdXNoSWRlbnRpZmllcjogc3RyaW5nIHwgbnVsbCA9IG51bGwpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRsZXQgcGF0aCA9IHR5cGVSZWZUb1BhdGgoU2Vzc2lvblR5cGVSZWYpICsgXCIvXCIgKyB0aGlzLmdldFNlc3Npb25MaXN0SWQoYWNjZXNzVG9rZW4pICsgXCIvXCIgKyB0aGlzLmdldFNlc3Npb25FbGVtZW50SWQoYWNjZXNzVG9rZW4pXG5cdFx0Y29uc3Qgc2Vzc2lvblR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKFNlc3Npb25UeXBlUmVmKVxuXG5cdFx0Y29uc3QgaGVhZGVycyA9IHtcblx0XHRcdGFjY2Vzc1Rva2VuOiBuZXZlck51bGwoYWNjZXNzVG9rZW4pLFxuXHRcdFx0djogc2Vzc2lvblR5cGVNb2RlbC52ZXJzaW9uLFxuXHRcdH1cblx0XHRjb25zdCBxdWVyeVBhcmFtczogRGljdCA9IHB1c2hJZGVudGlmaWVyID09IG51bGwgPyB7fSA6IHsgcHVzaElkZW50aWZpZXIgfVxuXHRcdHJldHVybiB0aGlzLnJlc3RDbGllbnRcblx0XHRcdC5yZXF1ZXN0KHBhdGgsIEh0dHBNZXRob2QuREVMRVRFLCB7XG5cdFx0XHRcdGhlYWRlcnMsXG5cdFx0XHRcdHJlc3BvbnNlVHlwZTogTWVkaWFUeXBlLkpzb24sXG5cdFx0XHRcdHF1ZXJ5UGFyYW1zLFxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhOb3RBdXRoZW50aWNhdGVkRXJyb3IsICgpID0+IHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcImF1dGhlbnRpY2F0aW9uIGZhaWxlZCA9PiBzZXNzaW9uIGlzIGFscmVhZHkgY2xvc2VkXCIpXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKE5vdEZvdW5kRXJyb3IsICgpID0+IHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcImF1dGhlbnRpY2F0aW9uIGZhaWxlZCA9PiBzZXNzaW9uIGluc3RhbmNlIGlzIGFscmVhZHkgZGVsZXRlZFwiKVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0fVxuXG5cdHByaXZhdGUgZ2V0U2Vzc2lvbkVsZW1lbnRJZChhY2Nlc3NUb2tlbjogQmFzZTY0VXJsKTogSWQge1xuXHRcdGxldCBieXRlQWNjZXNzVG9rZW4gPSBiYXNlNjRUb1VpbnQ4QXJyYXkoYmFzZTY0VXJsVG9CYXNlNjQobmV2ZXJOdWxsKGFjY2Vzc1Rva2VuKSkpXG5cdFx0cmV0dXJuIGJhc2U2NFRvQmFzZTY0VXJsKHVpbnQ4QXJyYXlUb0Jhc2U2NChzaGEyNTZIYXNoKGJ5dGVBY2Nlc3NUb2tlbi5zbGljZShHRU5FUkFURURfSURfQllURVNfTEVOR1RIKSkpKVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRTZXNzaW9uTGlzdElkKGFjY2Vzc1Rva2VuOiBCYXNlNjRVcmwpOiBJZCB7XG5cdFx0bGV0IGJ5dGVBY2Nlc3NUb2tlbiA9IGJhc2U2NFRvVWludDhBcnJheShiYXNlNjRVcmxUb0Jhc2U2NChuZXZlck51bGwoYWNjZXNzVG9rZW4pKSlcblx0XHRyZXR1cm4gYmFzZTY0VG9CYXNlNjRFeHQodWludDhBcnJheVRvQmFzZTY0KGJ5dGVBY2Nlc3NUb2tlbi5zbGljZSgwLCBHRU5FUkFURURfSURfQllURVNfTEVOR1RIKSkpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGxvYWRTZXNzaW9uRGF0YShhY2Nlc3NUb2tlbjogQmFzZTY0VXJsKTogUHJvbWlzZTx7XG5cdFx0dXNlcklkOiBJZFxuXHRcdGFjY2Vzc0tleTogQWVzS2V5IHwgbnVsbFxuXHR9PiB7XG5cdFx0Y29uc3QgcGF0aCA9IHR5cGVSZWZUb1BhdGgoU2Vzc2lvblR5cGVSZWYpICsgXCIvXCIgKyB0aGlzLmdldFNlc3Npb25MaXN0SWQoYWNjZXNzVG9rZW4pICsgXCIvXCIgKyB0aGlzLmdldFNlc3Npb25FbGVtZW50SWQoYWNjZXNzVG9rZW4pXG5cdFx0Y29uc3QgU2Vzc2lvblR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKFNlc3Npb25UeXBlUmVmKVxuXG5cdFx0bGV0IGhlYWRlcnMgPSB7XG5cdFx0XHRhY2Nlc3NUb2tlbjogYWNjZXNzVG9rZW4sXG5cdFx0XHR2OiBTZXNzaW9uVHlwZU1vZGVsLnZlcnNpb24sXG5cdFx0fVxuXHRcdC8vIHdlIGNhbm5vdCB1c2UgdGhlIGVudGl0eSBjbGllbnQgeWV0IGJlY2F1c2UgdGhpcyB0eXBlIGlzIGVuY3J5cHRlZCBhbmQgd2UgZG9uJ3QgaGF2ZSBhbiBvd25lciBrZXkgeWV0XG5cdFx0cmV0dXJuIHRoaXMucmVzdENsaWVudFxuXHRcdFx0LnJlcXVlc3QocGF0aCwgSHR0cE1ldGhvZC5HRVQsIHtcblx0XHRcdFx0aGVhZGVycyxcblx0XHRcdFx0cmVzcG9uc2VUeXBlOiBNZWRpYVR5cGUuSnNvbixcblx0XHRcdH0pXG5cdFx0XHQudGhlbigoaW5zdGFuY2UpID0+IHtcblx0XHRcdFx0bGV0IHNlc3Npb24gPSBKU09OLnBhcnNlKGluc3RhbmNlKVxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHVzZXJJZDogc2Vzc2lvbi51c2VyLFxuXHRcdFx0XHRcdGFjY2Vzc0tleTogc2Vzc2lvbi5hY2Nlc3NLZXkgPyBiYXNlNjRUb0tleShzZXNzaW9uLmFjY2Vzc0tleSkgOiBudWxsLFxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHR9XG5cblx0LyoqXG5cdCAqIExvYWRzIGVudHJvcHkgZnJvbSB0aGUgbGFzdCBsb2dvdXQuXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGxvYWRFbnRyb3B5KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHR1dGFub3RhUHJvcGVydGllcyA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRSb290KFR1dGFub3RhUHJvcGVydGllc1R5cGVSZWYsIHRoaXMudXNlckZhY2FkZS5nZXRVc2VyR3JvdXBJZCgpKVxuXHRcdHJldHVybiB0aGlzLmVudHJvcHlGYWNhZGUubG9hZEVudHJvcHkodHV0YW5vdGFQcm9wZXJ0aWVzKVxuXHR9XG5cblx0LyoqXG5cdCAqIENoYW5nZSBwYXNzd29yZCBhbmQvb3IgS0RGIHR5cGUgZm9yIHRoZSBjdXJyZW50IHVzZXIuIFRoaXMgd2lsbCBjYXVzZSBhbGwgb3RoZXIgc2Vzc2lvbnMgdG8gYmUgY2xvc2VkLlxuXHQgKiBAcmV0dXJuIE5ldyBwYXNzd29yZCBlbmNyeXB0ZWQgd2l0aCBhY2Nlc3NLZXkgaWYgdGhpcyBpcyBhIHBlcnNpc3RlbnQgc2Vzc2lvbiBvciB7QGNvZGUgbnVsbH0gIGlmIGl0J3MgYW4gZXBoZW1lcmFsIG9uZS5cblx0ICovXG5cdGFzeW5jIGNoYW5nZVBhc3N3b3JkKFxuXHRcdGN1cnJlbnRQYXNzd29yZEtleURhdGE6IFBhc3NwaHJhc2VLZXlEYXRhLFxuXHRcdG5ld1Bhc3N3b3JkS2V5RGF0YVRlbXBsYXRlOiBPbWl0PFBhc3NwaHJhc2VLZXlEYXRhLCBcInNhbHRcIj4sXG5cdCk6IFByb21pc2U8e1xuXHRcdG5ld0VuY3J5cHRlZFBhc3NwaHJhc2U6IEJhc2U2NFxuXHRcdG5ld0VuY3J5cHRlZFBhc3NwaHJhc2VLZXk6IFVpbnQ4QXJyYXlcblx0fSB8IG51bGw+IHtcblx0XHRjb25zdCBjdXJyZW50VXNlclBhc3NwaHJhc2VLZXkgPSBhd2FpdCB0aGlzLmRlcml2ZVVzZXJQYXNzcGhyYXNlS2V5KGN1cnJlbnRQYXNzd29yZEtleURhdGEpXG5cdFx0Y29uc3QgY3VycmVudEF1dGhWZXJpZmllciA9IGNyZWF0ZUF1dGhWZXJpZmllcihjdXJyZW50VXNlclBhc3NwaHJhc2VLZXkpXG5cdFx0Y29uc3QgbmV3UGFzc3dvcmRLZXlEYXRhID0geyAuLi5uZXdQYXNzd29yZEtleURhdGFUZW1wbGF0ZSwgc2FsdDogZ2VuZXJhdGVSYW5kb21TYWx0KCkgfVxuXG5cdFx0Y29uc3QgbmV3VXNlclBhc3NwaHJhc2VLZXkgPSBhd2FpdCB0aGlzLmRlcml2ZVVzZXJQYXNzcGhyYXNlS2V5KG5ld1Bhc3N3b3JkS2V5RGF0YSlcblx0XHRjb25zdCBjdXJyZW50VXNlckdyb3VwS2V5ID0gdGhpcy51c2VyRmFjYWRlLmdldEN1cnJlbnRVc2VyR3JvdXBLZXkoKVxuXHRcdGNvbnN0IHB3RW5jVXNlckdyb3VwS2V5ID0gZW5jcnlwdEtleShuZXdVc2VyUGFzc3BocmFzZUtleSwgY3VycmVudFVzZXJHcm91cEtleS5vYmplY3QpXG5cdFx0Y29uc3QgYXV0aFZlcmlmaWVyID0gY3JlYXRlQXV0aFZlcmlmaWVyKG5ld1VzZXJQYXNzcGhyYXNlS2V5KVxuXHRcdGNvbnN0IHNlcnZpY2UgPSBjcmVhdGVDaGFuZ2VQYXNzd29yZFBvc3RJbih7XG5cdFx0XHRjb2RlOiBudWxsLFxuXHRcdFx0a2RmVmVyc2lvbjogbmV3UGFzc3dvcmRLZXlEYXRhVGVtcGxhdGUua2RmVHlwZSxcblx0XHRcdG9sZFZlcmlmaWVyOiBjdXJyZW50QXV0aFZlcmlmaWVyLFxuXHRcdFx0cHdFbmNVc2VyR3JvdXBLZXk6IHB3RW5jVXNlckdyb3VwS2V5LFxuXHRcdFx0cmVjb3ZlckNvZGVWZXJpZmllcjogbnVsbCxcblx0XHRcdHNhbHQ6IG5ld1Bhc3N3b3JkS2V5RGF0YS5zYWx0LFxuXHRcdFx0dmVyaWZpZXI6IGF1dGhWZXJpZmllcixcblx0XHRcdHVzZXJHcm91cEtleVZlcnNpb246IFN0cmluZyhjdXJyZW50VXNlckdyb3VwS2V5LnZlcnNpb24pLFxuXHRcdH0pXG5cblx0XHRhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5wb3N0KENoYW5nZVBhc3N3b3JkU2VydmljZSwgc2VydmljZSlcblxuXHRcdHRoaXMudXNlckZhY2FkZS5zZXRVc2VyR3JvdXBLZXlEaXN0cmlidXRpb25LZXkobmV3VXNlclBhc3NwaHJhc2VLZXkpXG5cdFx0Y29uc3QgYWNjZXNzVG9rZW4gPSBhc3NlcnROb3ROdWxsKHRoaXMudXNlckZhY2FkZS5nZXRBY2Nlc3NUb2tlbigpKVxuXHRcdGNvbnN0IHNlc3Npb25EYXRhID0gYXdhaXQgdGhpcy5sb2FkU2Vzc2lvbkRhdGEoYWNjZXNzVG9rZW4pXG5cdFx0aWYgKHNlc3Npb25EYXRhLmFjY2Vzc0tleSAhPSBudWxsKSB7XG5cdFx0XHQvLyBpZiB3ZSBoYXZlIGFuIGFjY2Vzc0tleSwgdGhpcyBtZWFucyB3ZSBhcmUgc3RvcmluZyB0aGUgZW5jcnlwdGVkIHBhc3N3b3JkIGxvY2FsbHksIGluIHdoaWNoIGNhc2Ugd2UgbmVlZCB0byBzdG9yZSB0aGUgbmV3IG9uZVxuXHRcdFx0Y29uc3QgbmV3RW5jcnlwdGVkUGFzc3BocmFzZSA9IHVpbnQ4QXJyYXlUb0Jhc2U2NChlbmNyeXB0U3RyaW5nKHNlc3Npb25EYXRhLmFjY2Vzc0tleSwgbmV3UGFzc3dvcmRLZXlEYXRhVGVtcGxhdGUucGFzc3BocmFzZSkpXG5cdFx0XHRjb25zdCBuZXdFbmNyeXB0ZWRQYXNzcGhyYXNlS2V5ID0gZW5jcnlwdEtleShzZXNzaW9uRGF0YS5hY2Nlc3NLZXksIG5ld1VzZXJQYXNzcGhyYXNlS2V5KVxuXHRcdFx0cmV0dXJuIHsgbmV3RW5jcnlwdGVkUGFzc3BocmFzZSwgbmV3RW5jcnlwdGVkUGFzc3BocmFzZUtleSB9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgZGVsZXRlQWNjb3VudChwYXNzd29yZDogc3RyaW5nLCB0YWtlb3Zlcjogc3RyaW5nLCBzdXJ2ZXlEYXRhOiBTdXJ2ZXlEYXRhIHwgbnVsbCA9IG51bGwpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCB1c2VyU2FsdCA9IGFzc2VydE5vdE51bGwodGhpcy51c2VyRmFjYWRlLmdldExvZ2dlZEluVXNlcigpLnNhbHQpXG5cblx0XHRjb25zdCBwYXNzcGhyYXNlS2V5RGF0YSA9IHtcblx0XHRcdGtkZlR5cGU6IGFzS2RmVHlwZSh0aGlzLnVzZXJGYWNhZGUuZ2V0TG9nZ2VkSW5Vc2VyKCkua2RmVmVyc2lvbiksXG5cdFx0XHRwYXNzcGhyYXNlOiBwYXNzd29yZCxcblx0XHRcdHNhbHQ6IHVzZXJTYWx0LFxuXHRcdH1cblx0XHRjb25zdCBwYXNzd29yZEtleSA9IGF3YWl0IHRoaXMuZGVyaXZlVXNlclBhc3NwaHJhc2VLZXkocGFzc3BocmFzZUtleURhdGEpXG5cdFx0Y29uc3QgZGVsZXRlQ3VzdG9tZXJEYXRhID0gY3JlYXRlRGVsZXRlQ3VzdG9tZXJEYXRhKHtcblx0XHRcdGF1dGhWZXJpZmllcjogY3JlYXRlQXV0aFZlcmlmaWVyKHBhc3N3b3JkS2V5KSxcblx0XHRcdHJlYXNvbjogbnVsbCxcblx0XHRcdHRha2VvdmVyTWFpbEFkZHJlc3M6IG51bGwsXG5cdFx0XHR1bmRlbGV0ZTogZmFsc2UsXG5cdFx0XHRjdXN0b21lcjogbmV2ZXJOdWxsKG5ldmVyTnVsbCh0aGlzLnVzZXJGYWNhZGUuZ2V0TG9nZ2VkSW5Vc2VyKCkpLmN1c3RvbWVyKSxcblx0XHRcdHN1cnZleURhdGE6IHN1cnZleURhdGEsXG5cdFx0fSlcblxuXHRcdGlmICh0YWtlb3ZlciAhPT0gXCJcIikge1xuXHRcdFx0ZGVsZXRlQ3VzdG9tZXJEYXRhLnRha2VvdmVyTWFpbEFkZHJlc3MgPSB0YWtlb3ZlclxuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGVDdXN0b21lckRhdGEudGFrZW92ZXJNYWlsQWRkcmVzcyA9IG51bGxcblx0XHR9XG5cdFx0YXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IuZGVsZXRlKEN1c3RvbWVyU2VydmljZSwgZGVsZXRlQ3VzdG9tZXJEYXRhKVxuXHR9XG5cblx0LyoqIENoYW5nZXMgdXNlciBwYXNzd29yZCB0byBhbm90aGVyIG9uZSB1c2luZyByZWNvdmVyQ29kZSBpbnN0ZWFkIG9mIHRoZSBvbGQgcGFzc3dvcmQuICovXG5cdGFzeW5jIHJlY292ZXJMb2dpbihtYWlsQWRkcmVzczogc3RyaW5nLCByZWNvdmVyQ29kZTogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nLCBjbGllbnRJZGVudGlmaWVyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCByZWNvdmVyQ29kZUtleSA9IHVpbnQ4QXJyYXlUb0JpdEFycmF5KGhleFRvVWludDhBcnJheShyZWNvdmVyQ29kZSkpXG5cdFx0Y29uc3QgcmVjb3ZlckNvZGVWZXJpZmllciA9IGNyZWF0ZUF1dGhWZXJpZmllcihyZWNvdmVyQ29kZUtleSlcblx0XHRjb25zdCByZWNvdmVyQ29kZVZlcmlmaWVyQmFzZTY0ID0gYmFzZTY0VG9CYXNlNjRVcmwodWludDhBcnJheVRvQmFzZTY0KHJlY292ZXJDb2RlVmVyaWZpZXIpKVxuXHRcdGNvbnN0IHNlc3Npb25EYXRhID0gY3JlYXRlQ3JlYXRlU2Vzc2lvbkRhdGEoe1xuXHRcdFx0YWNjZXNzS2V5OiBudWxsLFxuXHRcdFx0YXV0aFRva2VuOiBudWxsLFxuXHRcdFx0YXV0aFZlcmlmaWVyOiBudWxsLFxuXHRcdFx0Y2xpZW50SWRlbnRpZmllcjogY2xpZW50SWRlbnRpZmllcixcblx0XHRcdG1haWxBZGRyZXNzOiBtYWlsQWRkcmVzcy50b0xvd2VyQ2FzZSgpLnRyaW0oKSxcblx0XHRcdHJlY292ZXJDb2RlVmVyaWZpZXI6IHJlY292ZXJDb2RlVmVyaWZpZXJCYXNlNjQsXG5cdFx0XHR1c2VyOiBudWxsLFxuXHRcdH0pXG5cdFx0Ly8gd2UgbmVlZCBhIHNlcGFyYXRlIGVudGl0eSByZXN0IGNsaWVudCBiZWNhdXNlIHRvIGF2b2lkIGNhY2hpbmcgb2YgdGhlIHVzZXIgaW5zdGFuY2Ugd2hpY2ggaXMgdXBkYXRlZCBvbiBwYXNzd29yZCBjaGFuZ2UuIHRoZSB3ZWIgc29ja2V0IGlzIG5vdCBjb25uZWN0ZWQgYmVjYXVzZSB3ZVxuXHRcdC8vIGRvbid0IGRvIGEgbm9ybWFsIGxvZ2luLCBhbmQgdGhlcmVmb3JlIHdlIHdvdWxkIG5vdCBnZXQgYW55IHVzZXIgdXBkYXRlIGV2ZW50cy4gd2UgY2FuIG5vdCB1c2UgcGVybWFuZW50TG9naW49ZmFsc2Ugd2l0aCBpbml0U2Vzc2lvbiBiZWNhdXNlIGNhY2hpbmcgd291bGQgYmUgZW5hYmxlZCxcblx0XHQvLyBhbmQgdGhlcmVmb3JlIHdlIHdvdWxkIG5vdCBiZSBhYmxlIHRvIHJlYWQgdGhlIHVwZGF0ZWQgdXNlclxuXHRcdC8vIGFkZGl0aW9uYWxseSB3ZSBkbyBub3Qgd2FudCB0byB1c2UgaW5pdFNlc3Npb24oKSB0byBrZWVwIHRoZSBMb2dpbkZhY2FkZSBzdGF0ZWxlc3MgKGV4Y2VwdCBzZWNvbmQgZmFjdG9yIGhhbmRsaW5nKSBiZWNhdXNlIHdlIGRvIG5vdCB3YW50IHRvIGhhdmUgYW55IHJhY2UgY29uZGl0aW9uc1xuXHRcdC8vIHdoZW4gbG9nZ2luZyBpbiBub3JtYWxseSBhZnRlciByZXNldHRpbmcgdGhlIHBhc3N3b3JkXG5cdFx0Y29uc3QgdGVtcEF1dGhEYXRhUHJvdmlkZXI6IEF1dGhEYXRhUHJvdmlkZXIgPSB7XG5cdFx0XHRjcmVhdGVBdXRoSGVhZGVycygpOiBEaWN0IHtcblx0XHRcdFx0cmV0dXJuIHt9XG5cdFx0XHR9LFxuXHRcdFx0aXNGdWxseUxvZ2dlZEluKCk6IGJvb2xlYW4ge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH0sXG5cdFx0fVxuXHRcdGNvbnN0IGV2ZW50UmVzdENsaWVudCA9IG5ldyBFbnRpdHlSZXN0Q2xpZW50KFxuXHRcdFx0dGVtcEF1dGhEYXRhUHJvdmlkZXIsXG5cdFx0XHR0aGlzLnJlc3RDbGllbnQsXG5cdFx0XHQoKSA9PiB0aGlzLmNyeXB0b0ZhY2FkZSxcblx0XHRcdHRoaXMuaW5zdGFuY2VNYXBwZXIsXG5cdFx0XHR0aGlzLmJsb2JBY2Nlc3NUb2tlbkZhY2FkZSxcblx0XHQpXG5cdFx0Y29uc3QgZW50aXR5Q2xpZW50ID0gbmV3IEVudGl0eUNsaWVudChldmVudFJlc3RDbGllbnQpXG5cdFx0Y29uc3QgY3JlYXRlU2Vzc2lvblJldHVybiA9IGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoU2Vzc2lvblNlcnZpY2UsIHNlc3Npb25EYXRhKSAvLyBEb24ndCBwYXNzIGVtYWlsIGFkZHJlc3MgdG8gYXZvaWQgcHJvcG9zaW5nIHRvIHJlc2V0IHNlY29uZCBmYWN0b3Igd2hlbiB3ZSdyZSByZXNldHRpbmcgcGFzc3dvcmRcblxuXHRcdGNvbnN0IHsgdXNlcklkLCBhY2Nlc3NUb2tlbiB9ID0gYXdhaXQgdGhpcy53YWl0VW50aWxTZWNvbmRGYWN0b3JBcHByb3ZlZE9yQ2FuY2VsbGVkKGNyZWF0ZVNlc3Npb25SZXR1cm4sIG51bGwpXG5cdFx0Y29uc3QgdXNlciA9IGF3YWl0IGVudGl0eUNsaWVudC5sb2FkKFVzZXJUeXBlUmVmLCB1c2VySWQsIHtcblx0XHRcdGV4dHJhSGVhZGVyczoge1xuXHRcdFx0XHRhY2Nlc3NUb2tlbixcblx0XHRcdH0sXG5cdFx0fSlcblx0XHRpZiAodXNlci5hdXRoID09IG51bGwgfHwgdXNlci5hdXRoLnJlY292ZXJDb2RlID09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIm1pc3NpbmcgcmVjb3ZlciBjb2RlXCIpXG5cdFx0fVxuXHRcdGNvbnN0IHJlY292ZXJDb2RlRXh0cmFIZWFkZXJzID0ge1xuXHRcdFx0YWNjZXNzVG9rZW4sXG5cdFx0XHRyZWNvdmVyQ29kZVZlcmlmaWVyOiByZWNvdmVyQ29kZVZlcmlmaWVyQmFzZTY0LFxuXHRcdH1cblxuXHRcdGNvbnN0IHJlY292ZXJDb2RlRGF0YSA9IGF3YWl0IGVudGl0eUNsaWVudC5sb2FkKFJlY292ZXJDb2RlVHlwZVJlZiwgdXNlci5hdXRoLnJlY292ZXJDb2RlLCB7IGV4dHJhSGVhZGVyczogcmVjb3ZlckNvZGVFeHRyYUhlYWRlcnMgfSlcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgZ3JvdXBLZXkgPSBhZXMyNTZEZWNyeXB0V2l0aFJlY292ZXJ5S2V5KHJlY292ZXJDb2RlS2V5LCByZWNvdmVyQ29kZURhdGEucmVjb3ZlckNvZGVFbmNVc2VyR3JvdXBLZXkpXG5cdFx0XHRjb25zdCBzYWx0ID0gZ2VuZXJhdGVSYW5kb21TYWx0KClcblx0XHRcdGNvbnN0IG5ld0tkZlR5cGUgPSBERUZBVUxUX0tERl9UWVBFXG5cblx0XHRcdGNvbnN0IG5ld1Bhc3NwaHJhc2VLZXlEYXRhID0geyBrZGZUeXBlOiBuZXdLZGZUeXBlLCBwYXNzcGhyYXNlOiBuZXdQYXNzd29yZCwgc2FsdCB9XG5cdFx0XHRjb25zdCB1c2VyUGFzc3BocmFzZUtleSA9IGF3YWl0IHRoaXMuZGVyaXZlVXNlclBhc3NwaHJhc2VLZXkobmV3UGFzc3BocmFzZUtleURhdGEpXG5cdFx0XHRjb25zdCBwd0VuY1VzZXJHcm91cEtleSA9IGVuY3J5cHRLZXkodXNlclBhc3NwaHJhc2VLZXksIGdyb3VwS2V5KVxuXHRcdFx0Y29uc3QgbmV3UGFzc3dvcmRWZXJpZmllciA9IGNyZWF0ZUF1dGhWZXJpZmllcih1c2VyUGFzc3BocmFzZUtleSlcblx0XHRcdGNvbnN0IHBvc3REYXRhID0gY3JlYXRlQ2hhbmdlUGFzc3dvcmRQb3N0SW4oe1xuXHRcdFx0XHRjb2RlOiBudWxsLFxuXHRcdFx0XHRrZGZWZXJzaW9uOiBuZXdLZGZUeXBlLFxuXHRcdFx0XHRvbGRWZXJpZmllcjogbnVsbCxcblx0XHRcdFx0c2FsdDogc2FsdCxcblx0XHRcdFx0cHdFbmNVc2VyR3JvdXBLZXk6IHB3RW5jVXNlckdyb3VwS2V5LFxuXHRcdFx0XHR2ZXJpZmllcjogbmV3UGFzc3dvcmRWZXJpZmllcixcblx0XHRcdFx0cmVjb3ZlckNvZGVWZXJpZmllcjogcmVjb3ZlckNvZGVWZXJpZmllcixcblx0XHRcdFx0dXNlckdyb3VwS2V5VmVyc2lvbjogcmVjb3ZlckNvZGVEYXRhLnVzZXJLZXlWZXJzaW9uLFxuXHRcdFx0fSlcblxuXHRcdFx0Y29uc3QgZXh0cmFIZWFkZXJzID0ge1xuXHRcdFx0XHRhY2Nlc3NUb2tlbixcblx0XHRcdH1cblx0XHRcdGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoQ2hhbmdlUGFzc3dvcmRTZXJ2aWNlLCBwb3N0RGF0YSwgeyBleHRyYUhlYWRlcnMgfSlcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0dGhpcy5kZWxldGVTZXNzaW9uKGFjY2Vzc1Rva2VuKVxuXHRcdH1cblx0fVxuXG5cdC8qKiBEZWxldGVzIHNlY29uZCBmYWN0b3JzIHVzaW5nIHJlY292ZXJDb2RlIGFzIHNlY29uZCBmYWN0b3IuICovXG5cdHJlc2V0U2Vjb25kRmFjdG9ycyhtYWlsQWRkcmVzczogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nLCByZWNvdmVyQ29kZTogSGV4KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMubG9hZFVzZXJQYXNzcGhyYXNlS2V5KG1haWxBZGRyZXNzLCBwYXNzd29yZCkudGhlbigocGFzc3BocmFzZVJldHVybikgPT4ge1xuXHRcdFx0Y29uc3QgYXV0aFZlcmlmaWVyID0gY3JlYXRlQXV0aFZlcmlmaWVyQXNCYXNlNjRVcmwocGFzc3BocmFzZVJldHVybi51c2VyUGFzc3BocmFzZUtleSlcblx0XHRcdGNvbnN0IHJlY292ZXJDb2RlS2V5ID0gdWludDhBcnJheVRvQml0QXJyYXkoaGV4VG9VaW50OEFycmF5KHJlY292ZXJDb2RlKSlcblx0XHRcdGNvbnN0IHJlY292ZXJDb2RlVmVyaWZpZXIgPSBjcmVhdGVBdXRoVmVyaWZpZXJBc0Jhc2U2NFVybChyZWNvdmVyQ29kZUtleSlcblx0XHRcdGNvbnN0IGRlbGV0ZURhdGEgPSBjcmVhdGVSZXNldEZhY3RvcnNEZWxldGVEYXRhKHtcblx0XHRcdFx0bWFpbEFkZHJlc3MsXG5cdFx0XHRcdGF1dGhWZXJpZmllcixcblx0XHRcdFx0cmVjb3ZlckNvZGVWZXJpZmllcixcblx0XHRcdH0pXG5cdFx0XHRyZXR1cm4gdGhpcy5zZXJ2aWNlRXhlY3V0b3IuZGVsZXRlKFJlc2V0RmFjdG9yc1NlcnZpY2UsIGRlbGV0ZURhdGEpXG5cdFx0fSlcblx0fVxuXG5cdHRha2VPdmVyRGVsZXRlZEFkZHJlc3MobWFpbEFkZHJlc3M6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgcmVjb3ZlckNvZGU6IEhleCB8IG51bGwsIHRhcmdldEFjY291bnRNYWlsQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMubG9hZFVzZXJQYXNzcGhyYXNlS2V5KG1haWxBZGRyZXNzLCBwYXNzd29yZCkudGhlbigocGFzc3BocmFzZVJldHVybikgPT4ge1xuXHRcdFx0Y29uc3QgYXV0aFZlcmlmaWVyID0gY3JlYXRlQXV0aFZlcmlmaWVyQXNCYXNlNjRVcmwocGFzc3BocmFzZVJldHVybi51c2VyUGFzc3BocmFzZUtleSlcblx0XHRcdGxldCByZWNvdmVyQ29kZVZlcmlmaWVyOiBCYXNlNjQgfCBudWxsID0gbnVsbFxuXG5cdFx0XHRpZiAocmVjb3ZlckNvZGUpIHtcblx0XHRcdFx0Y29uc3QgcmVjb3ZlckNvZGVLZXkgPSB1aW50OEFycmF5VG9CaXRBcnJheShoZXhUb1VpbnQ4QXJyYXkocmVjb3ZlckNvZGUpKVxuXHRcdFx0XHRyZWNvdmVyQ29kZVZlcmlmaWVyID0gY3JlYXRlQXV0aFZlcmlmaWVyQXNCYXNlNjRVcmwocmVjb3ZlckNvZGVLZXkpXG5cdFx0XHR9XG5cblx0XHRcdGxldCBkYXRhID0gY3JlYXRlVGFrZU92ZXJEZWxldGVkQWRkcmVzc0RhdGEoe1xuXHRcdFx0XHRtYWlsQWRkcmVzcyxcblx0XHRcdFx0YXV0aFZlcmlmaWVyLFxuXHRcdFx0XHRyZWNvdmVyQ29kZVZlcmlmaWVyLFxuXHRcdFx0XHR0YXJnZXRBY2NvdW50TWFpbEFkZHJlc3MsXG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoVGFrZU92ZXJEZWxldGVkQWRkcmVzc1NlcnZpY2UsIGRhdGEpXG5cdFx0fSlcblx0fVxuXG5cdGdlbmVyYXRlVG90cFNlY3JldCgpOiBQcm9taXNlPFRvdHBTZWNyZXQ+IHtcblx0XHRyZXR1cm4gdGhpcy5nZXRUb3RwVmVyaWZpZXIoKS50aGVuKCh0b3RwKSA9PiB0b3RwLmdlbmVyYXRlU2VjcmV0KCkpXG5cdH1cblxuXHRnZW5lcmF0ZVRvdHBDb2RlKHRpbWU6IG51bWJlciwga2V5OiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXI+IHtcblx0XHRyZXR1cm4gdGhpcy5nZXRUb3RwVmVyaWZpZXIoKS50aGVuKCh0b3RwKSA9PiB0b3RwLmdlbmVyYXRlVG90cCh0aW1lLCBrZXkpKVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRUb3RwVmVyaWZpZXIoKTogUHJvbWlzZTxUb3RwVmVyaWZpZXI+IHtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBUb3RwVmVyaWZpZXIoKSlcblx0fVxuXG5cdGFzeW5jIHJldHJ5QXN5bmNMb2dpbigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAodGhpcy5hc3luY0xvZ2luU3RhdGUuc3RhdGUgPT09IFwicnVubmluZ1wiKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9IGVsc2UgaWYgKHRoaXMuYXN5bmNMb2dpblN0YXRlLnN0YXRlID09PSBcImZhaWxlZFwiKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmFzeW5jUmVzdW1lU2Vzc2lvbih0aGlzLmFzeW5jTG9naW5TdGF0ZS5jcmVkZW50aWFscywgdGhpcy5hc3luY0xvZ2luU3RhdGUuY2FjaGVJbmZvKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJjcmVkZW50aWFscyB3ZW50IG1pc3NpbmdcIilcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyBhIHZlcmlmaWVyIHRva2VuLCB3aGljaCBpcyBwcm9vZiBvZiBwYXNzd29yZCBhdXRoZW50aWNhdGlvbiBhbmQgaXMgdmFsaWQgZm9yIGEgbGltaXRlZCB0aW1lLlxuXHQgKiBUaGlzIHRva2VuIHdpbGwgaGF2ZSB0byBiZSBwYXNzZWQgYmFjayB0byB0aGUgc2VydmVyIHdpdGggdGhlIGFwcHJvcHJpYXRlIGNhbGwuXG5cdCAqL1xuXHRhc3luYyBnZXRWZXJpZmllclRva2VuKHBhc3NwaHJhc2U6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMudXNlckZhY2FkZS5nZXRMb2dnZWRJblVzZXIoKVxuXHRcdGNvbnN0IHBhc3NwaHJhc2VLZXkgPSBhd2FpdCB0aGlzLmRlcml2ZVVzZXJQYXNzcGhyYXNlS2V5KHtcblx0XHRcdGtkZlR5cGU6IGFzS2RmVHlwZSh1c2VyLmtkZlZlcnNpb24pLFxuXHRcdFx0cGFzc3BocmFzZSxcblx0XHRcdHNhbHQ6IGFzc2VydE5vdE51bGwodXNlci5zYWx0KSxcblx0XHR9KVxuXG5cdFx0Y29uc3QgYXV0aFZlcmlmaWVyID0gY3JlYXRlQXV0aFZlcmlmaWVyKHBhc3NwaHJhc2VLZXkpXG5cdFx0Y29uc3Qgb3V0ID0gYXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChWZXJpZmllclRva2VuU2VydmljZSwgY3JlYXRlVmVyaWZpZXJUb2tlblNlcnZpY2VJbih7IGF1dGhW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