import type {TypeRef, HttpMethodEnum} from "../../src/api/common/EntityFunctions"
import type {OperationTypeEnum, EntropySrcEnum} from "../../src/api/common/TutanotaConstants"

/**
 * This Interface provides an abstraction of the random number generator implementation.
 */
interface ClientRandomizer {
	/**
	 * Adds entropy to the random number generator algorithm
	 * @param number Any number value.
	 * @param entropy The amount of entropy in the number in bit.
	 * @param source The source of the number. One of RandomizerInterface.ENTROPY_SRC_*.
	 */
	addEntropy(number: number, entropy: number, source: EntropySrcEnum):void;

	/**
	 * Verifies if the randomizer is ready to serve.
	 * @return true, if it is ready, false otherwise.
	 */
	isReady():boolean;

	/**
	 * Generates random data. The function initRandomDataGenerator must have been called prior to the first call to this function.
	 * @param nbrOfBytes The number of bytes the random data shall have.
	 * @return A hex coded string of random data.
	 * @throws {CryptoError} if the randomizer is not seeded (isReady == false)
	 */
	generateRandomData(nbrOfBytes: number):Uint8Array;
}

/**
 * The EntityRestInterface provides a convenient interface for invoking server side REST services.
 */
interface EntityRestInterface {

	/**
	 * Creates, reads, updates or deletes (CRUD) data on/from the server. Provided entities are encrypted before they are
	 * sent to the server and decrypted before they are returned.
	 * @param typeRef
	 * @param method
	 * @param id
	 * @param entity
	 * @param queryParams
	 * @return Resolves the entity / list of Entities delivered by the server or the elementId of the created entity.
	 */
	entityRequest<T>(typeRef: TypeRef<T>, method: HttpMethodEnum, listId: ?Id, id: ?Id, entity: ?T, queryParameter: ?Params):Promise<?T | T[] | Id>

}

interface ProgressListener {
	upload(percent: number): void;
	download(percent: number): void;
}

interface LoginInterface {
	createSession(username: string, password: string, clientIdentifier: string, returnCredentials: boolean): Promise<?Credentials|{user:User, userGroupInfo: GroupInfo, sessionElementId: Id, credentials: ?Credentials}>;
	createExternalSession(userId: Id, password: string, salt: Uint8Array, clientIdentifier: string, returnCredentials: boolean): Promise<?Credentials|{user:User, userGroupInfo: GroupInfo, sessionElementId: Id, credentials: ?Credentials}>;
	resumeSession(credentials: Credentials, externalUserSalt: ?Uint8Array): Promise<{user:User, userGroupInfo: GroupInfo, sessionElementId: Id}|void>;
	logout():Promise<void>;
	deleteSession(accessToken: Base64Url): Promise<void>;
	changePassword(oldPassword: string, newPassword: string): Promise<void>;
}

declare function EntityEventReceived(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void;

interface EventBusListener {
	/**
	 * Notifies the listener that new data has been received.
	 * @param data The update notification.
	 */
	notifyNewDataReceived(data: EntityUpdate):void;

	/**
	 * Notifies a listener about the reconnect event,
	 */
	notifyReconnected():void;
}


