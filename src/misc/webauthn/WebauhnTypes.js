// @flow

/** @file Types from Credential Management API. */

export interface AuthenticatorResponse {
	clientDataJSON: ArrayBuffer
}

export interface AuthenticatorAttestationResponse extends AuthenticatorResponse {
	attestationObject: ArrayBuffer,
}

export interface AuthenticatorAssertionResponse extends AuthenticatorResponse {
	authenticatorData: ArrayBuffer;
	signature: ArrayBuffer;
	userHandle?: ?ArrayBuffer
}

export interface CredMgmtPublicKeyCredential extends CredMgmtCredential {
	response: AuthenticatorAttestationResponse,
}

export interface PublicKeyCredentialEntity {
	name: string;
}

interface PublicKeyCredentialRpEntity extends PublicKeyCredentialEntity {
	id: string;
}

export interface PublicKeyCredentialUserEntity extends PublicKeyCredentialEntity {
	id: BufferSource;
	displayName: string;
}

export type COSEAlgorithmIdentifier =
	| -7 // ES256
	| -35 // ES384
	| -36 // ES512
	| -8 // EdDSA

export interface PublicKeyCredentialParameters {
	type: string;
	alg: COSEAlgorithmIdentifier;
}

export interface PublicKeyCredentialDescriptor {
	type: string;
	id: BufferSource;
	transports?: Array<string>;
}

export interface AuthenticatorSelectionCriteria {
	authenticatorAttachment?: string;
	residentKey?: string;
	requireResidentKey?: boolean;
	userVerification?: string;
}

export interface AuthenticationExtensionsClientInputs {
}

export interface PublicKeyCredentialCreationOptions {
	rp: PublicKeyCredentialRpEntity;
	user: PublicKeyCredentialUserEntity;
	challenge: BufferSource;
	pubKeyCredParams: Array<PublicKeyCredentialParameters>;

	timeout?: number;
	excludeCredentials?: Array<PublicKeyCredentialDescriptor>;
	authenticatorSelection?: AuthenticatorSelectionCriteria;
	attestation?: string;
	extensions?: AuthenticationExtensionsClientInputs;
}

export interface Credential {
	id: string;
	type: string;
}

export interface PublicKeyCredential extends Credential {
	rawId: ArrayBuffer,
	response: AuthenticatorResponse,
}

type CredentialMediationRequirement =
	| "silent"
	| "optional"
	| "conditional"
	| "required"

export interface CredentialCreationOptions {
	signal?: AbortSignal;
	/** extended here https://w3c.github.io/webauthn/#sctn-credentialcreationoptions-extension */
	publicKey: PublicKeyCredentialCreationOptions;
}

export interface CredentialRequestOptions {
	mediation?: CredentialMediationRequirement;
	signal?: AbortSignal;
	/** extended here https://w3c.github.io/webauthn/#sctn-credentialrequestoptions-extension */
	publicKey: PublicKeyCredentialRequestOptions;
}

export interface PublicKeyCredentialRequestOptions {
	challenge: $TypedArray;
	timeout?: number;
	rpId?: string;
	allowCredentials?: Array<PublicKeyCredentialDescriptor>;
	userVerification?: string;
	extensions?: AuthenticationExtensionsClientInputs;
}

export interface CredentialsApi {
	create(options: CredentialCreationOptions): Promise<Credential>;

	get(options: CredentialRequestOptions): Promise<Credential>;
}

export type EncodedPublicKey = {
	/** key type. 2 = EC */
	"1": number,
	/** algorithm. -7 = ES256 */
	"3": number,
	/** curve type. 1 = P-256 */
	"-1": number,
	/** x coordinate */
	"-2": number,
	/** y coordinate */
	"-3": number,
}