export var KeyPairType;
(function (KeyPairType) {
    KeyPairType[KeyPairType["RSA"] = 0] = "RSA";
    KeyPairType[KeyPairType["RSA_AND_ECC"] = 1] = "RSA_AND_ECC";
    KeyPairType[KeyPairType["TUTA_CRYPT"] = 2] = "TUTA_CRYPT";
})(KeyPairType || (KeyPairType = {}));
export function isPqKeyPairs(keyPair) {
    return keyPair.keyPairType === KeyPairType.TUTA_CRYPT;
}
export function isRsaOrRsaEccKeyPair(keyPair) {
    return keyPair.keyPairType === KeyPairType.RSA || keyPair.keyPairType === KeyPairType.RSA_AND_ECC;
}
export function isRsaEccKeyPair(keyPair) {
    return keyPair.keyPairType === KeyPairType.RSA_AND_ECC;
}
export function isPqPublicKey(publicKey) {
    return publicKey.keyPairType === KeyPairType.TUTA_CRYPT;
}
export function isRsaPublicKey(publicKey) {
    return publicKey.keyPairType === KeyPairType.RSA;
}
