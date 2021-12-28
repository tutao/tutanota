/** @file Types from Credential Management API. */
import {TypedArray} from "global";


export interface AuthenticatorResponse {
    clientDataJSON: ArrayBuffer
}
export interface AuthenticatorAttestationResponse extends AuthenticatorResponse {
    attestationObject: ArrayBuffer
}
export interface AuthenticatorAssertionResponse extends AuthenticatorResponse {
    authenticatorData: ArrayBuffer
    signature: ArrayBuffer
    userHandle?: ArrayBuffer | null
}
export interface PublicKeyCredentialEntity {
    name: string
}
interface PublicKeyCredentialRpEntity extends PublicKeyCredentialEntity {
    id: string
}
export interface PublicKeyCredentialUserEntity extends PublicKeyCredentialEntity {
    id: BufferSource
    displayName: string
}

/** see https://www.iana.org/assignments/cose/cose.xhtml#algorithms */
export const COSEAlgorithmIdentifierNames = Object.freeze({
    ES256: -7,
    ES384: -35,
    ES512: -36,
    EdDSA: -8,
})
// I'm breaking our naming convention with enums here to make type name the same
export type COSEAlgorithmIdentifier = Values<typeof COSEAlgorithmIdentifierNames>
export interface PublicKeyCredentialParameters {
    type: string
    alg: COSEAlgorithmIdentifier
}
export interface PublicKeyCredentialDescriptor {
    type: string
    id: BufferSource
    transports?: Array<string>
}
export interface AuthenticatorSelectionCriteria {
    authenticatorAttachment?: string
    residentKey?: string
    requireResidentKey?: boolean
    userVerification?: string
}
export interface AuthenticationExtensionsClientInputs {}
export interface PublicKeyCredentialCreationOptions {
    rp: PublicKeyCredentialRpEntity
    user: PublicKeyCredentialUserEntity
    challenge: BufferSource
    pubKeyCredParams: Array<PublicKeyCredentialParameters>
    timeout?: number
    excludeCredentials?: Array<PublicKeyCredentialDescriptor>
    authenticatorSelection?: AuthenticatorSelectionCriteria
    attestation?: string
    extensions?: AuthenticationExtensionsClientInputs
}
export interface Credential {
    id: string
    type: string
}
export interface PublicKeyCredential extends Credential {
    rawId: ArrayBuffer
    response: AuthenticatorResponse
}
type CredentialMediationRequirement = "silent" | "optional" | "conditional" | "required"
export interface CredentialCreationOptions {
    signal?: AbortSignal

    /** extended here https://w3c.github.io/webauthn/#sctn-credentialcreationoptions-extension */
    publicKey: PublicKeyCredentialCreationOptions
}
export interface CredentialRequestOptions {
    mediation?: CredentialMediationRequirement
    signal?: AbortSignal

    /** extended here https://w3c.github.io/webauthn/#sctn-credentialrequestoptions-extension */
    publicKey: PublicKeyCredentialRequestOptions
}
export interface PublicKeyCredentialRequestOptions {
    challenge: TypedArray
    timeout?: number
    rpId?: string
    allowCredentials?: Array<PublicKeyCredentialDescriptor>
    userVerification?: string
    extensions?: AuthenticationExtensionsClientInputs
}
export interface CredentialsApi {
    create(options: CredentialCreationOptions): Promise<Credential>
    get(options: CredentialRequestOptions): Promise<Credential>
}