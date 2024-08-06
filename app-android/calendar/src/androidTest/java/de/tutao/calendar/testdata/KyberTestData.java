package de.tutao.calendar.testdata;

/**
 * Only convert to records after upgrading android to target API level 34 as this is copied to app-android!
 */
public class KyberTestData {
	String publicKey;
	String privateKey;
	String seed;
	String cipherText;
	String sharedSecret;

	public String getPublicKey() {
		return publicKey;
	}

	public String getPrivateKey() {
		return privateKey;
	}

	public String getSeed() {
		return seed;
	}

	public String getCipherText() {
		return cipherText;
	}

	public String getSharedSecret() {
		return sharedSecret;
	}

	public KyberTestData setPublicKey(String publicKey) {
		this.publicKey = publicKey;
		return this;
	}

	public KyberTestData setPrivateKey(String privateKey) {
		this.privateKey = privateKey;
		return this;
	}

	public KyberTestData setSeed(String seed) {
		this.seed = seed;
		return this;
	}

	public KyberTestData setCipherText(String cipherText) {
		this.cipherText = cipherText;
		return this;
	}

	public KyberTestData setSharedSecret(String sharedSecret) {
		this.sharedSecret = sharedSecret;
		return this;
	}

}
