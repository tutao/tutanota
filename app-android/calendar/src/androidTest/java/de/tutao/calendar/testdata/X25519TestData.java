package de.tutao.calendar.testdata;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class X25519TestData {
	private String alicePrivateKeyHex;
	private String alicePublicKeyHex;
	private String ephemeralPrivateKeyHex;
	private String ephemeralPublicKeyHex;
	private String bobPrivateKeyHex;
	private String bobPublicKeyHex;
	private String ephemeralSharedSecretHex;
	private String authSharedSecretHex;

	public X25519TestData() {

	}

	@JsonIgnore
	public X25519TestData(String alicePrivateKeyHex, String alicePublicKeyHex, String ephemeralPrivateKeyHex, String ephemeralPublicKeyHex, String bobPrivateKeyHex, String bobPublicKeyHex, String ephemeralSharedSecretHex,
						  String authSharedSecretHex) {
		this.alicePrivateKeyHex = alicePrivateKeyHex;
		this.alicePublicKeyHex = alicePublicKeyHex;
		this.ephemeralPrivateKeyHex = ephemeralPrivateKeyHex;
		this.ephemeralPublicKeyHex = ephemeralPublicKeyHex;
		this.bobPrivateKeyHex = bobPrivateKeyHex;
		this.bobPublicKeyHex = bobPublicKeyHex;
		this.ephemeralSharedSecretHex = ephemeralSharedSecretHex;
		this.authSharedSecretHex = authSharedSecretHex;
	}

	public String getAlicePrivateKeyHex() {
		return alicePrivateKeyHex;
	}

	public void setAlicePrivateKeyHex(String alicePrivateKeyHex) {
		this.alicePrivateKeyHex = alicePrivateKeyHex;
	}

	public String getAlicePublicKeyHex() {
		return alicePublicKeyHex;
	}

	public void setAlicePublicKeyHex(String alicePublicKeyHex) {
		this.alicePublicKeyHex = alicePublicKeyHex;
	}

	public String getEphemeralPrivateKeyHex() {
		return ephemeralPrivateKeyHex;
	}

	public void setEphemeralPrivateKeyHex(String ephemeralPrivateKeyHex) {
		this.ephemeralPrivateKeyHex = ephemeralPrivateKeyHex;
	}
	public String getEphemeralPublicKeyHex() {
		return ephemeralPublicKeyHex;
	}

	public void setEphemeralPublicKeyHex(String ephemeralPublicKeyHex) {
		this.ephemeralPublicKeyHex = ephemeralPublicKeyHex;
	}

	public String getBobPrivateKeyHex() {
		return bobPrivateKeyHex;
	}

	public void setBobPrivateKeyHex(String bobPrivateKeyHex) {
		this.bobPrivateKeyHex = bobPrivateKeyHex;
	}

	public String getBobPublicKeyHex() {
		return bobPublicKeyHex;
	}

	public void setBobPublicKeyHex(String bobPublicKeyHex) {
		this.bobPublicKeyHex = bobPublicKeyHex;
	}

	public String getEphemeralSharedSecretHex() {
		return ephemeralSharedSecretHex;
	}

	public void setEphemeralSharedSecretHex(String ephemeralSharedSecretHex) {
		this.ephemeralSharedSecretHex = ephemeralSharedSecretHex;
	}

	public String getAuthSharedSecretHex() {
		return authSharedSecretHex;
	}

	public void setAuthSharedSecretHex(String authSharedSecretHex) {
		this.authSharedSecretHex = authSharedSecretHex;
	}
}
