"use strict";

TestCase("ThunderbirdCsvContactConverterTest", {
	
	"test": function() {
		var t = new tutao.tutanota.ctrl.ThunderbirdContactCsvConverter();
		console.log(t.csvToContacts("First Name,Last Name,Display Name,Nickname,Primary Email,Secondary Email,Screen Name,Work Phone,Home Phone,Fax Number,Pager Number,Mobile Number,Home Address,Home Address 2,Home City,Home State,Home ZipCode,Home Country,Work Address,Work Address 2,Work City,Work State,Work ZipCode,Work Country,Job Title,Department,Organization,Web Page 1,Web Page 2,Birth Year,Birth Month,Birth Day,Custom 1,Custom 2,Custom 3,Custom 4,Notes\r\nFirst1,Last1,First1 Last1,,firstEmail1@asfda.de,additionalEmail1@asdf.de,,workphone,homephone,faxnumber,,mobilephone,my addresse,secondline address,City1,state1,23432postal,country1,addressorg1,addressorgsecondline1,orgcity1,orgstate1,23432orgpostal,orgcountry1,myTitle1,department1,organization1,,,2004,04,04,,,,,"));
	}
});