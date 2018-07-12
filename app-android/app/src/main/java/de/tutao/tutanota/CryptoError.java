package de.tutao.tutanota;

class CryptoError extends Exception {
    public CryptoError(String message) {
        super(message);
    }
    public CryptoError(Throwable cause) {
        super(cause);
    }
}
