package de.tutao.calendar.testdata;

/**
 * Only convert to records after upgrading android to target API level 34 as this is copied to app-android!
 */
public class HkdfTestData {

	String saltHex;
	String inputKeyMaterialHex;
	String infoHex;
	int lengthInBytes;
	String hkdfHex;

	public HkdfTestData() {
	}

	public HkdfTestData(String saltHex, String inputKeyMaterialHex, String infoHex, int lengthInBytes, String hkdfHex) {
		this.saltHex = saltHex;
		this.inputKeyMaterialHex = inputKeyMaterialHex;
		this.infoHex = infoHex;
		this.lengthInBytes = lengthInBytes;
		this.hkdfHex = hkdfHex;
	}

	public String getSaltHex() {
		return saltHex;
	}

	public void setSaltHex(String saltHex) {
		this.saltHex = saltHex;
	}

	public String getInputKeyMaterialHex() {
		return inputKeyMaterialHex;
	}

	public void setInputKeyMaterialHex(String inputKeyMaterialHex) {
		this.inputKeyMaterialHex = inputKeyMaterialHex;
	}

	public String getInfoHex() {
		return infoHex;
	}

	public void setInfoHex(String infoHex) {
		this.infoHex = infoHex;
	}

	public int getLengthInBytes() {
		return lengthInBytes;
	}

	public void setLengthInBytes(int lengthInBytes) {
		this.lengthInBytes = lengthInBytes;
	}

	public String getHkdfHex() {
		return hkdfHex;
	}

	public void setHkdfHex(String hkdfHex) {
		this.hkdfHex = hkdfHex;
	}
}
