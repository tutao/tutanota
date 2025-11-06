package de.tutao.tutashared.testdata;


import com.fasterxml.jackson.annotation.JsonIgnore;


public class AeadTestData {
	private String plainTextBase64;
	private String cipherTextBase64;
	private String plaintextKey;
	private String encryptionKey;
	private String encryptedKey;
	private String seed;
	private String associatedData;


	/**
	 * Empty constructor needed for creating from json.
	 */
	public AeadTestData() {
	}

	@JsonIgnore
	public AeadTestData(String plainTextBase64, String cipherTextBase64, String plaintextKey,
						String encryptionKey, String encryptedKey, String seed, String associatedData) {
		this.plainTextBase64 = plainTextBase64;
		this.cipherTextBase64 = cipherTextBase64;
		this.plaintextKey = plaintextKey;
		this.encryptionKey = encryptionKey;
		this.encryptedKey = encryptedKey;
		this.seed = seed;
		this.associatedData = associatedData;
	}

	public String getPlainTextBase64() {
		return plainTextBase64;
	}

	public void setPlainTextBase64(String plainTextBase64) {
		this.plainTextBase64 = plainTextBase64;
	}

	public String getCipherTextBase64() {
		return cipherTextBase64;
	}

	public void setCipherTextBase64(String cipherTextBase64) {
		this.cipherTextBase64 = cipherTextBase64;
	}

	public String getPlaintextKey() {
		return plaintextKey;
	}

	public void setPlaintextKey(String plaintextKey) {
		this.plaintextKey = plaintextKey;
	}

	public String getEncryptionKey() {
		return encryptionKey;
	}

	public void setEncryptionKey(String encryptionKey) {
		this.encryptionKey = encryptionKey;
	}


	public String getEncryptedKey() {
		return encryptedKey;
	}

	public void setEncryptedKey(String encryptedKey) {
		this.encryptedKey = encryptedKey;
	}

	public String getSeed() {
		return seed;
	}

	public void setSeed(String seed) {
		this.seed = seed;
	}

	public String getAssociatedData() {
		return associatedData;
	}

	public void setAssociatedData(String associatedData) {
		this.associatedData = associatedData;
	}
}
