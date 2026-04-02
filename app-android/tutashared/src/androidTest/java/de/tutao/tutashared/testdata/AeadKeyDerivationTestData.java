package de.tutao.tutashared.testdata;


import com.fasterxml.jackson.annotation.JsonIgnore;


public class AeadKeyDerivationTestData {
	private String groupKey256Hex;
	private String groupKey128Hex;
	private String sessionKeyHex;
	private String kdfNonceHex;
	private String globalInstanceTypeId;
	private String encryptionKeyFrom256Hex;
	private String authenticationKeyFrom256Hex;
	private String encryptionKeyFrom128Hex;
	private String authenticationKeyFrom128Hex;
	private String encryptionKeyFromSessionKeyHex;
	private String authenticationKeyFromSessionKeyHex;

	/**
	 * Empty constructor needed for creating from json.
	 */
	public AeadKeyDerivationTestData() {
	}

	@JsonIgnore
	public AeadKeyDerivationTestData(String groupKey256Hex,
									 String groupKey128Hex,
									 String sessionKeyHex,
									 String kdfNonceHex,
									 String globalInstanceTypeId,
									 String encryptionKeyFrom256Hex,
									 String authenticationKeyFrom256Hex,
									 String encryptionKeyFrom128Hex,
									 String authenticationKeyFrom128Hex,
									 String encryptionKeyFromSessionKeyHex,
									 String authenticationKeyFromSessionKeyHex) {
		this.groupKey256Hex = groupKey256Hex;
		this.groupKey128Hex = groupKey128Hex;
		this.sessionKeyHex = sessionKeyHex;
		this.kdfNonceHex = kdfNonceHex;
		this.globalInstanceTypeId = globalInstanceTypeId;
		this.encryptionKeyFrom256Hex = encryptionKeyFrom256Hex;
		this.authenticationKeyFrom256Hex = authenticationKeyFrom256Hex;
		this.encryptionKeyFrom128Hex = encryptionKeyFrom128Hex;
		this.authenticationKeyFrom128Hex = authenticationKeyFrom128Hex;
		this.encryptionKeyFromSessionKeyHex = encryptionKeyFromSessionKeyHex;
		this.authenticationKeyFromSessionKeyHex = authenticationKeyFromSessionKeyHex;
	}

	public String getGroupKey256Hex() {
		return groupKey256Hex;
	}

	public void setGroupKey256Hex(String groupKey256Hex) {
		this.groupKey256Hex = groupKey256Hex;
	}

	public String getGroupKey128Hex() {
		return groupKey128Hex;
	}

	public void setGroupKey128Hex(String groupKey128Hex) {
		this.groupKey128Hex = groupKey128Hex;
	}

	public String getSessionKeyHex() {
		return sessionKeyHex;
	}

	public void setSessionKeyHex(String sessionKeyHex) {
		this.sessionKeyHex = sessionKeyHex;
	}

	public String getKdfNonceHex() {
		return kdfNonceHex;
	}

	public void setKdfNonceHex(String kdfNonceHex) {
		this.kdfNonceHex = kdfNonceHex;
	}

	public String getGlobalInstanceTypeId() {
		return globalInstanceTypeId;
	}

	public void setGlobalInstanceTypeId(String globalInstanceTypeId) {
		this.globalInstanceTypeId = globalInstanceTypeId;
	}

	public String getEncryptionKeyFrom256Hex() {
		return encryptionKeyFrom256Hex;
	}

	public void setEncryptionKeyFrom256Hex(String encryptionKeyFrom256Hex) {
		this.encryptionKeyFrom256Hex = encryptionKeyFrom256Hex;
	}

	public String getAuthenticationKeyFrom256Hex() {
		return authenticationKeyFrom256Hex;
	}

	public void setAuthenticationKeyFrom256Hex(String authenticationKeyFrom256Hex) {
		this.authenticationKeyFrom256Hex = authenticationKeyFrom256Hex;
	}

	public String getEncryptionKeyFrom128Hex() {
		return encryptionKeyFrom128Hex;
	}

	public void setEncryptionKeyFrom128Hex(String encryptionKeyFrom128Hex) {
		this.encryptionKeyFrom128Hex = encryptionKeyFrom128Hex;
	}

	public String getAuthenticationKeyFrom128Hex() {
		return authenticationKeyFrom128Hex;
	}

	public void setAuthenticationKeyFrom128Hex(String authenticationKeyFrom128Hex) {
		this.authenticationKeyFrom128Hex = authenticationKeyFrom128Hex;
	}

	public String getEncryptionKeyFromSessionKeyHex() {
		return encryptionKeyFromSessionKeyHex;
	}

	public void setEncryptionKeyFromSessionKeyHex(String encryptionKeyFromSessionKeyHex) {
		this.encryptionKeyFromSessionKeyHex = encryptionKeyFromSessionKeyHex;
	}

	public String getAuthenticationKeyFromSessionKeyHex() {
		return authenticationKeyFromSessionKeyHex;
	}

	public void setAuthenticationKeyFromSessionKeyHex(String authenticationKeyFromSessionKeyHex) {
		this.authenticationKeyFromSessionKeyHex = authenticationKeyFromSessionKeyHex;
	}
}
