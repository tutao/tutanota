package de.tutao.calendar.testdata;


import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Only convert to records after upgrading android to target API level 34 as this is copied to app-android!
 */
public class AesTestData {
	private String plainTextBase64;
	private String ivBase64;
	private String cipherTextBase64;
	private String hexKey;
	private String keyToEncrypt256;
	private String keyToEncrypt128;
	private String encryptedKey256;
	private String encryptedKey128;


	/**
	 * Empty constructor needed for creating from json.
	 */
	public AesTestData() {

	}

	@JsonIgnore
	public AesTestData(String plainTextBase64, String ivBase64, String cipherTextBase64, String hexKey,
					   String keyToEncrypt256, String keyToEncrypt128, String encryptedKey256, String encryptedKey128) {
		this.plainTextBase64 = plainTextBase64;
		this.ivBase64 = ivBase64;
		this.cipherTextBase64 = cipherTextBase64;
		this.hexKey = hexKey;
		this.keyToEncrypt256 = keyToEncrypt256;
		this.keyToEncrypt128 = keyToEncrypt128;
		this.encryptedKey256 = encryptedKey256;
		this.encryptedKey128 = encryptedKey128;
	}

	public String getPlainTextBase64() {
		return plainTextBase64;
	}

	public void setPlainTextBase64(String plainTextBase64) {
		this.plainTextBase64 = plainTextBase64;
	}

	public String getIvBase64() {
		return ivBase64;
	}

	public void setIvBase64(String ivBase64) {
		this.ivBase64 = ivBase64;
	}

	public String getCipherTextBase64() {
		return cipherTextBase64;
	}

	public void setCipherTextBase64(String cipherTextBase64) {
		this.cipherTextBase64 = cipherTextBase64;
	}

	public String getHexKey() {
		return hexKey;
	}

	public void setHexKey(String hexKey) {
		this.hexKey = hexKey;
	}

	public String getKeyToEncrypt256() {
		return keyToEncrypt256;
	}

	public void setKeyToEncrypt256(String keyToEncrypt256) {
		this.keyToEncrypt256 = keyToEncrypt256;
	}

	public String getKeyToEncrypt128() {
		return keyToEncrypt128;
	}

	public void setKeyToEncrypt128(String keyToEncrypt128) {
		this.keyToEncrypt128 = keyToEncrypt128;
	}

	public String getEncryptedKey256() {
		return encryptedKey256;
	}

	public void setEncryptedKey256(String encryptedKey256) {
		this.encryptedKey256 = encryptedKey256;
	}

	public String getEncryptedKey128() {
		return encryptedKey128;
	}

	public void setEncryptedKey128(String encryptedKey128) {
		this.encryptedKey128 = encryptedKey128;
	}
}
