package de.tutao.calendar.testdata;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Only convert to records after upgrading android to target API level 34 as this is copied to app-android!
 */
public class EncodingTestData {
	public String string;
	public String encodedString;

	/**
	 * Empty constructor needed for creating from json.
	 */
	public EncodingTestData() {

	}

	@JsonIgnore
	public EncodingTestData(String string, String encodedString) {
		this.string = string;
		this.encodedString = encodedString;
	}

	public String getString() {
		return string;
	}

	public void setString(String string) {
		this.string = string;
	}

	public String getEncodedString() {
		return encodedString;
	}

	public void setEncodedString(String encodedString) {
		this.encodedString = encodedString;
	}
}
