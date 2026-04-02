package de.tutao.tutashared.testdata;


import com.fasterxml.jackson.annotation.JsonIgnore;


public class AeadTestData {
	private String plaintextBase64;
	private String ciphertextBase64;
	private String plaintextKey;
	private String encryptionKey;
	private String authenticationKey;
	private String encryptedKey;
	private String seed;
	private String associatedData;


	/**
	 * Empty constructor needed for creating from json.
	 */
	public AeadTestData() {
	}

	@JsonIgnore
	public AeadTestData(String plaintextBase64, String ciphertextBase64, String plaintextKey,
						String encryptionKey, String encryptedKey, String seed, String associatedData, String authenticationKey) {
		this.plaintextBase64 = plaintextBase64;
		this.ciphertextBase64 = ciphertextBase64;
		this.plaintextKey = plaintextKey;
		this.encryptionKey = encryptionKey;
		this.authenticationKey = authenticationKey;
		this.encryptedKey = encryptedKey;
		this.seed = seed;
		this.associatedData = associatedData;
	}

	public String getPlaintextBase64() {
		return plaintextBase64;
	}

	public void setPlaintextBase64(String plaintextBase64) {
		this.plaintextBase64 = plaintextBase64;
	}

	public String getCiphertextBase64() {
		return ciphertextBase64;
	}

	public void setCiphertextBase64(String ciphertextBase64) {
		this.ciphertextBase64 = ciphertextBase64;
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

	public String getAuthenticationKey() {
		return authenticationKey;
	}

	public void setAuthenticationKey(String authenticationKey) {
		this.authenticationKey = authenticationKey;
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
