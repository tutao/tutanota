//@bundleInto:common-min
export class KeyPermanentlyInvalidatedError extends Error {
    constructor(message: string) {
        super(message)
    }
}