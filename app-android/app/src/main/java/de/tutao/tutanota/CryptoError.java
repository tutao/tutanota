package de.tutao.tutanota;

public class CryptoError extends Exception {
    public CryptoError(String message) {
        super(message);
    }
    public CryptoError(Throwable cause) {
        super(cause);
    }
}
