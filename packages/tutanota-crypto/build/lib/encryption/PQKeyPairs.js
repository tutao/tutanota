export function pqKeyPairsToPublicKeys(keyPairs) {
    return {
        keyPairType: keyPairs.keyPairType,
        eccPublicKey: keyPairs.eccKeyPair.publicKey,
        kyberPublicKey: keyPairs.kyberKeyPair.publicKey,
    };
}
