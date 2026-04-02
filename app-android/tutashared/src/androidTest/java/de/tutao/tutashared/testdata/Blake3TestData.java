package de.tutao.tutashared.testdata;

/**
 * Only convert to records after upgrading android to target API level 34 as this is copied to app-android!
 */
public class Blake3TestData {

	String keyHex;
	String context;
	int lengthInBytes;
	String kdfOutputHex;
	String dataHex;
	String tagHex;
	String digestHex;

	public Blake3TestData() {
	}

	public Blake3TestData(String keyHex, String context, int lengthInBytes, String kdfOutputHex, String dataHex, String tagHex, String digestHex) {
		this.keyHex = keyHex;
		this.context = context;
		this.lengthInBytes = lengthInBytes;
		this.kdfOutputHex = kdfOutputHex;
		this.dataHex = dataHex;
		this.tagHex = tagHex;
		this.digestHex = digestHex;
	}

	public String getKeyHex() {
		return keyHex;
	}

	public void setKeyHex(String keyHex) {
		this.keyHex = keyHex;
	}

	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
	}

	public int getLengthInBytes() {
		return lengthInBytes;
	}

	public void setLengthInBytes(int lengthInBytes) {
		this.lengthInBytes = lengthInBytes;
	}

	public String getKdfOutputHex() {
		return kdfOutputHex;
	}

	public void setKdfOutputHex(String kdfOutputHex) {
		this.kdfOutputHex = kdfOutputHex;
	}

	public String getDataHex() {
		return dataHex;
	}

	public void setDataHex(String dataHex) {
		this.dataHex = dataHex;
	}

	public String getTagHex() {
		return tagHex;
	}

	public void setTagHex(String tagHex) {
		this.tagHex = tagHex;
	}

	public String getDigestHex() {
		return digestHex;
	}

	public void setDigestHex(String digestHex) {
		this.digestHex = digestHex;
	}
}
