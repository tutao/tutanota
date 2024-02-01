/* generated file, don't edit. */


public struct WebAuthnSignChallenge : Codable {
	let challenge: DataWrapper
	let domain: String
	let keys: [WebauthnKeyDescriptor]
}
