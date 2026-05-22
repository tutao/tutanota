/** @file Types from Credential Management API. */

/** see https://www.iana.org/assignments/cose/cose.xhtml#algorithms */
export enum COSEAlgorithmIdentifier {
	ES256 = -7,
	ES384 = -35,
	ES512 = -36,
	EdDSA = -8,
}
