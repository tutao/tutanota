import type {NativeInterface} from "../../../native/common/NativeInterface"
import {isApp} from "../../common/Env"
import {generateRsaKey, random, rsaDecrypt, rsaEncrypt} from "@tutao/tutanota-crypto"
import type {PrivateKey, PublicKey, RsaKeyPair} from "@tutao/tutanota-crypto"
export async function createRsaImplementation(native: NativeInterface): Promise<RsaImplementation> {
    if (isApp()) {
        const {RsaApp} = await import("../../../native/worker/RsaApp")
        return new RsaApp(native, random)
    } else {
        return new RsaWeb()
    }
}
export interface RsaImplementation {
    generateKey(): Promise<RsaKeyPair>
    encrypt(publicKey: PublicKey, bytes: Uint8Array): Promise<Uint8Array>
    decrypt(privateKey: PrivateKey, bytes: Uint8Array): Promise<Uint8Array>
}
export class RsaWeb implements RsaImplementation {
    async generateKey(): Promise<RsaKeyPair> {
        return generateRsaKey()
    }

    async encrypt(publicKey: PublicKey, bytes: Uint8Array): Promise<Uint8Array> {
        const seed = random.generateRandomData(32)
        return rsaEncrypt(publicKey, bytes, seed)
    }

    async decrypt(privateKey: PrivateKey, bytes: Uint8Array): Promise<Uint8Array> {
        return rsaDecrypt(privateKey, bytes)
    }
}