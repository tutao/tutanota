package de.tutao.calendar.testdata;

/**
 * Only convert to records after upgrading android to target API level 34 as this is copied to app-android!
 */
public class KdfTestData {
	String password;
	String keyHex;
	String saltHex;

	public KdfTestData() {
	}

	public KdfTestData(String password, String keyHex, String saltHex) {
		this.password = password;
		this.keyHex = keyHex;
		this.saltHex = saltHex;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getKeyHex() {
		return keyHex;
	}

	public void setKeyHex(String keyHex) {
		this.keyHex = keyHex;
	}

	public String getSaltHex() {
		return saltHex;
	}

	public void setSaltHex(String saltHex) {
		this.saltHex = saltHex;
	}
}
