
//#region src/common/api/common/CountryList.ts
const CountryType = {
	GERMANY: 0,
	EU: 1,
	OTHER: 2
};
const Countries = Object.freeze([
	{
		n: "Afghanistan",
		a: "AF",
		t: 2,
		d: 2
	},
	{
		n: "Åland Islands",
		a: "AX",
		t: 2,
		d: 2
	},
	{
		n: "Albania",
		a: "AL",
		t: 2,
		d: 0
	},
	{
		n: "Algeria",
		a: "DZ",
		t: 2,
		d: 0
	},
	{
		n: "American Samoa",
		a: "AS",
		t: 2,
		d: 2
	},
	{
		n: "Andorra",
		a: "AD",
		t: 2,
		d: 0
	},
	{
		n: "Angola",
		a: "AO",
		t: 2,
		d: 0
	},
	{
		n: "Anguilla",
		a: "AI",
		t: 2,
		d: 2
	},
	{
		n: "Antarctica",
		a: "AQ",
		t: 2,
		d: 2
	},
	{
		n: "Antigua and Barbuda",
		a: "AG",
		t: 2,
		d: 2
	},
	{
		n: "Argentina",
		a: "AR",
		t: 2,
		d: 0
	},
	{
		n: "Armenia",
		a: "AM",
		t: 2,
		d: 0
	},
	{
		n: "Aruba",
		a: "AW",
		t: 2,
		d: 2
	},
	{
		n: "Australia",
		a: "AU",
		t: 2,
		d: 1
	},
	{
		n: "Azerbaijan",
		a: "AZ",
		t: 2,
		d: 0
	},
	{
		n: "Bahamas",
		a: "BS",
		t: 2,
		d: 2
	},
	{
		n: "Bahrain",
		a: "BH",
		t: 2,
		d: 2
	},
	{
		n: "Bangladesh",
		a: "BD",
		t: 2,
		d: 1
	},
	{
		n: "Barbados",
		a: "BB",
		t: 2,
		d: 2
	},
	{
		n: "Belarus",
		a: "BY",
		t: 2,
		d: 0
	},
	{
		n: "Belgium",
		a: "BE",
		t: 1,
		d: 0
	},
	{
		n: "Belize",
		a: "BZ",
		t: 2,
		d: 2
	},
	{
		n: "Benin",
		a: "BJ",
		t: 2,
		d: 2
	},
	{
		n: "Bermuda",
		a: "BM",
		t: 2,
		d: 2
	},
	{
		n: "Bhutan",
		a: "BT",
		t: 2,
		d: 2
	},
	{
		n: "Bolivia (Plurinational State of)",
		a: "BO",
		t: 2,
		d: 0
	},
	{
		n: "Bonaire",
		a: "BQ",
		t: 2,
		d: 2
	},
	{
		n: "Bosnia and Herzegovina",
		a: "BA",
		t: 2,
		d: 0
	},
	{
		n: "Botswana",
		a: "BW",
		t: 2,
		d: 1
	},
	{
		n: "Bouvet Island",
		a: "BV",
		t: 2,
		d: 2
	},
	{
		n: "Brazil",
		a: "BR",
		t: 2,
		d: 0
	},
	{
		n: "British Indian Ocean Territory",
		a: "IO",
		t: 2,
		d: 2
	},
	{
		n: "Brunei Darussalam",
		a: "BN",
		t: 2,
		d: 1
	},
	{
		n: "Bulgaria",
		a: "BG",
		t: 1,
		d: 0
	},
	{
		n: "Burkina Faso",
		a: "BF",
		t: 2,
		d: 2
	},
	{
		n: "Burundi",
		a: "BI",
		t: 2,
		d: 2
	},
	{
		n: "Cabo Verde",
		a: "CV",
		t: 2,
		d: 2
	},
	{
		n: "Cambodia",
		a: "KH",
		t: 2,
		d: 1
	},
	{
		n: "Cameroon",
		a: "CM",
		t: 2,
		d: 0
	},
	{
		n: "Canada",
		a: "CA",
		t: 2,
		d: 1
	},
	{
		n: "Cayman Islands",
		a: "KY",
		t: 2,
		d: 2
	},
	{
		n: "Central African Republic",
		a: "CF",
		t: 2,
		d: 2
	},
	{
		n: "Chad",
		a: "TD",
		t: 2,
		d: 2
	},
	{
		n: "Chile",
		a: "CL",
		t: 2,
		d: 0
	},
	{
		n: "China",
		a: "CN",
		t: 2,
		d: 1
	},
	{
		n: "Christmas Island",
		a: "CX",
		t: 2,
		d: 2
	},
	{
		n: "Cocos (Keeling) Islands",
		a: "CC",
		t: 2,
		d: 2
	},
	{
		n: "Colombia",
		a: "CO",
		t: 2,
		d: 0
	},
	{
		n: "Comoros",
		a: "KM",
		t: 2,
		d: 2
	},
	{
		n: "Congo",
		a: "CG",
		t: 2,
		d: 2
	},
	{
		n: "Congo (Democratic Republic of the)",
		a: "CD",
		t: 2,
		d: 2
	},
	{
		n: "Cook Islands",
		a: "CK",
		t: 2,
		d: 2
	},
	{
		n: "Costa Rica",
		a: "CR",
		t: 2,
		d: 0
	},
	{
		n: "Côte d'Ivoire",
		a: "CI",
		t: 2,
		d: 2
	},
	{
		n: "Croatia",
		a: "HR",
		t: 1,
		d: 0
	},
	{
		n: "Cuba",
		a: "CU",
		t: 2,
		d: 0
	},
	{
		n: "Curaçao",
		a: "CW",
		t: 2,
		d: 2
	},
	{
		n: "Cyprus",
		a: "CY",
		t: 1,
		d: 0
	},
	{
		n: "Czech Republic",
		a: "CZ",
		t: 1,
		d: 0
	},
	{
		n: "Denmark",
		a: "DK",
		t: 1,
		d: 0
	},
	{
		n: "Deutschland",
		a: "DE",
		t: 0,
		d: 0
	},
	{
		n: "Djibouti",
		a: "DJ",
		t: 2,
		d: 2
	},
	{
		n: "Dominica",
		a: "DM",
		t: 2,
		d: 2
	},
	{
		n: "Dominican Republic",
		a: "DO",
		t: 2,
		d: 1
	},
	{
		n: "Ecuador",
		a: "EC",
		t: 2,
		d: 0
	},
	{
		n: "Egypt",
		a: "EG",
		t: 2,
		d: 1
	},
	{
		n: "El Salvador",
		a: "SV",
		t: 2,
		d: 1
	},
	{
		n: "Equatorial Guinea",
		a: "GQ",
		t: 2,
		d: 2
	},
	{
		n: "Eritrea",
		a: "ER",
		t: 2,
		d: 2
	},
	{
		n: "Estonia",
		a: "EE",
		t: 1,
		d: 0
	},
	{
		n: "Ethiopia",
		a: "ET",
		t: 2,
		d: 2
	},
	{
		n: "Falkland Islands (Malvinas)",
		a: "FK",
		t: 2,
		d: 2
	},
	{
		n: "Faroe Islands",
		a: "FO",
		t: 2,
		d: 0
	},
	{
		n: "Fiji",
		a: "FJ",
		t: 2,
		d: 2
	},
	{
		n: "Finland",
		a: "FI",
		t: 1,
		d: 0
	},
	{
		n: "France",
		a: "FR",
		t: 1,
		d: 0
	},
	{
		n: "French Guiana",
		a: "GF",
		t: 2,
		d: 2
	},
	{
		n: "French Polynesia",
		a: "PF",
		t: 2,
		d: 2
	},
	{
		n: "French Southern Territories",
		a: "TF",
		t: 2,
		d: 2
	},
	{
		n: "Gabon",
		a: "GA",
		t: 2,
		d: 2
	},
	{
		n: "Gambia",
		a: "GM",
		t: 2,
		d: 2
	},
	{
		n: "Georgia",
		a: "GE",
		t: 2,
		d: 0
	},
	{
		n: "Ghana",
		a: "GH",
		t: 2,
		d: 1
	},
	{
		n: "Gibraltar",
		a: "GI",
		t: 2,
		d: 2
	},
	{
		n: "Greece",
		a: "GR",
		t: 1,
		d: 0
	},
	{
		n: "Greenland",
		a: "GL",
		t: 2,
		d: 0
	},
	{
		n: "Grenada",
		a: "GD",
		t: 2,
		d: 2
	},
	{
		n: "Guadeloupe",
		a: "GP",
		t: 2,
		d: 2
	},
	{
		n: "Guam",
		a: "GU",
		t: 2,
		d: 2
	},
	{
		n: "Guatemala",
		a: "GT",
		t: 2,
		d: 1
	},
	{
		n: "Guernsey",
		a: "GG",
		t: 2,
		d: 2
	},
	{
		n: "Guinea",
		a: "GN",
		t: 2,
		d: 2
	},
	{
		n: "Guinea-Bissau",
		a: "GW",
		t: 2,
		d: 2
	},
	{
		n: "Guyana",
		a: "GY",
		t: 2,
		d: 2
	},
	{
		n: "Haiti",
		a: "HT",
		t: 2,
		d: 2
	},
	{
		n: "Heard Island and McDonald Islands",
		a: "HM",
		t: 2,
		d: 2
	},
	{
		n: "Holy See",
		a: "VA",
		t: 2,
		d: 2
	},
	{
		n: "Honduras",
		a: "HN",
		t: 2,
		d: 1
	},
	{
		n: "Hong Kong",
		a: "HK",
		t: 2,
		d: 1
	},
	{
		n: "Hungary",
		a: "HU",
		t: 1,
		d: 0
	},
	{
		n: "Iceland",
		a: "IS",
		t: 2,
		d: 0
	},
	{
		n: "India",
		a: "IN",
		t: 2,
		d: 1
	},
	{
		n: "Indonesia",
		a: "ID",
		t: 2,
		d: 0
	},
	{
		n: "Iran (Islamic Republic of)",
		a: "IR",
		t: 2,
		d: 2
	},
	{
		n: "Iraq",
		a: "IQ",
		t: 2,
		d: 2
	},
	{
		n: "Ireland",
		a: "IE",
		t: 1,
		d: 1
	},
	{
		n: "Isle of Man",
		a: "IM",
		t: 2,
		d: 2
	},
	{
		n: "Israel",
		a: "IL",
		t: 2,
		d: 1
	},
	{
		n: "Italy",
		a: "IT",
		t: 1,
		d: 0
	},
	{
		n: "Jamaica",
		a: "JM",
		t: 2,
		d: 2
	},
	{
		n: "Japan",
		a: "JP",
		t: 2,
		d: 1
	},
	{
		n: "Jersey",
		a: "JE",
		t: 2,
		d: 2
	},
	{
		n: "Jordan",
		a: "JO",
		t: 2,
		d: 1
	},
	{
		n: "Kazakhstan",
		a: "KZ",
		t: 2,
		d: 0
	},
	{
		n: "Kenya",
		a: "KE",
		t: 2,
		d: 1
	},
	{
		n: "Kiribati",
		a: "KI",
		t: 2,
		d: 2
	},
	{
		n: "Korea (Democratic People's Republic of)",
		a: "KP",
		t: 2,
		d: 1
	},
	{
		n: "Korea (Republic of)",
		a: "KR",
		t: 2,
		d: 1
	},
	{
		n: "Kuwait",
		a: "KW",
		t: 2,
		d: 2
	},
	{
		n: "Kyrgyzstan",
		a: "KG",
		t: 2,
		d: 0
	},
	{
		n: "Lao People's Democratic Republic",
		a: "LA",
		t: 2,
		d: 2
	},
	{
		n: "Latvia",
		a: "LV",
		t: 1,
		d: 0
	},
	{
		n: "Lebanon",
		a: "LB",
		t: 2,
		d: 2
	},
	{
		n: "Lesotho",
		a: "LS",
		t: 2,
		d: 2
	},
	{
		n: "Liberia",
		a: "LR",
		t: 2,
		d: 2
	},
	{
		n: "Libya",
		a: "LY",
		t: 2,
		d: 2
	},
	{
		n: "Liechtenstein",
		a: "LI",
		t: 2,
		d: 2
	},
	{
		n: "Lithuania",
		a: "LT",
		t: 1,
		d: 0
	},
	{
		n: "Luxembourg",
		a: "LU",
		t: 1,
		d: 2
	},
	{
		n: "Macao",
		a: "MO",
		t: 2,
		d: 2
	},
	{
		n: "Macedonia",
		a: "MK",
		t: 2,
		d: 0
	},
	{
		n: "Madagascar",
		a: "MG",
		t: 2,
		d: 2
	},
	{
		n: "Malawi",
		a: "MW",
		t: 2,
		d: 2
	},
	{
		n: "Malaysia",
		a: "MY",
		t: 2,
		d: 1
	},
	{
		n: "Maldives",
		a: "MV",
		t: 2,
		d: 2
	},
	{
		n: "Mali",
		a: "ML",
		t: 2,
		d: 2
	},
	{
		n: "Malta",
		a: "MT",
		t: 1,
		d: 1
	},
	{
		n: "Marshall Islands",
		a: "MH",
		t: 2,
		d: 2
	},
	{
		n: "Martinique",
		a: "MQ",
		t: 2,
		d: 2
	},
	{
		n: "Mauritania",
		a: "MR",
		t: 2,
		d: 2
	},
	{
		n: "Mauritius",
		a: "MU",
		t: 2,
		d: 2
	},
	{
		n: "Mayotte",
		a: "YT",
		t: 2,
		d: 2
	},
	{
		n: "Mexico",
		a: "MX",
		t: 2,
		d: 1
	},
	{
		n: "Micronesia (Federated States of)",
		a: "FM",
		t: 2,
		d: 2
	},
	{
		n: "Moldova (Republic of)",
		a: "MD",
		t: 2,
		d: 0
	},
	{
		n: "Monaco",
		a: "MC",
		t: 2,
		d: 2
	},
	{
		n: "Mongolia",
		a: "MN",
		t: 2,
		d: 2
	},
	{
		n: "Montenegro",
		a: "ME",
		t: 2,
		d: 2
	},
	{
		n: "Montserrat",
		a: "MS",
		t: 2,
		d: 2
	},
	{
		n: "Morocco",
		a: "MA",
		t: 2,
		d: 0
	},
	{
		n: "Mozambique",
		a: "MZ",
		t: 2,
		d: 0
	},
	{
		n: "Myanmar",
		a: "MM",
		t: 2,
		d: 1
	},
	{
		n: "Namibia",
		a: "NA",
		t: 2,
		d: 0
	},
	{
		n: "Nauru",
		a: "NR",
		t: 2,
		d: 2
	},
	{
		n: "Nepal",
		a: "NP",
		t: 2,
		d: 1
	},
	{
		n: "Netherlands",
		a: "NL",
		t: 1,
		d: 0
	},
	{
		n: "New Caledonia",
		a: "NC",
		t: 2,
		d: 2
	},
	{
		n: "New Zealand",
		a: "NZ",
		t: 2,
		d: 1
	},
	{
		n: "Nicaragua",
		a: "NI",
		t: 2,
		d: 1
	},
	{
		n: "Niger",
		a: "NE",
		t: 2,
		d: 2
	},
	{
		n: "Nigeria",
		a: "NG",
		t: 2,
		d: 1
	},
	{
		n: "Niue",
		a: "NU",
		t: 2,
		d: 2
	},
	{
		n: "Norfolk Island",
		a: "NF",
		t: 2,
		d: 2
	},
	{
		n: "Northern Mariana Islands",
		a: "MP",
		t: 2,
		d: 2
	},
	{
		n: "Norway",
		a: "NO",
		t: 2,
		d: 0
	},
	{
		n: "Oman",
		a: "OM",
		t: 2,
		d: 2
	},
	{
		n: "Österreich",
		a: "AT",
		t: 1,
		d: 0
	},
	{
		n: "Pakistan",
		a: "PK",
		t: 2,
		d: 1
	},
	{
		n: "Palau",
		a: "PW",
		t: 2,
		d: 2
	},
	{
		n: "Palestine",
		a: "PS",
		t: 2,
		d: 1
	},
	{
		n: "Panama",
		a: "PA",
		t: 2,
		d: 1
	},
	{
		n: "Papua New Guinea",
		a: "PG",
		t: 2,
		d: 2
	},
	{
		n: "Paraguay",
		a: "PY",
		t: 2,
		d: 0
	},
	{
		n: "Peru",
		a: "PE",
		t: 2,
		d: 0
	},
	{
		n: "Philippines",
		a: "PH",
		t: 2,
		d: 1
	},
	{
		n: "Pitcairn",
		a: "PN",
		t: 2,
		d: 2
	},
	{
		n: "Poland",
		a: "PL",
		t: 1,
		d: 0
	},
	{
		n: "Portugal",
		a: "PT",
		t: 1,
		d: 0
	},
	{
		n: "Puerto Rico",
		a: "PR",
		t: 2,
		d: 1
	},
	{
		n: "Qatar",
		a: "QA",
		t: 2,
		d: 2
	},
	{
		n: "Réunion",
		a: "RE",
		t: 2,
		d: 2
	},
	{
		n: "Romania",
		a: "RO",
		t: 1,
		d: 0
	},
	{
		n: "Russian Federation",
		a: "RU",
		t: 2,
		d: 0
	},
	{
		n: "Rwanda",
		a: "RW",
		t: 2,
		d: 2
	},
	{
		n: "Saint Barthélemy",
		a: "BL",
		t: 2,
		d: 2
	},
	{
		n: "Saint Helena",
		a: "SH",
		t: 2,
		d: 2
	},
	{
		n: "Saint Kitts and Nevis",
		a: "KN",
		t: 2,
		d: 2
	},
	{
		n: "Saint Lucia",
		a: "LC",
		t: 2,
		d: 2
	},
	{
		n: "Saint Martin (French part)",
		a: "MF",
		t: 2,
		d: 2
	},
	{
		n: "Saint Pierre and Miquelon",
		a: "PM",
		t: 2,
		d: 2
	},
	{
		n: "Saint Vincent and the Grenadines",
		a: "VC",
		t: 2,
		d: 2
	},
	{
		n: "Samoa",
		a: "WS",
		t: 2,
		d: 2
	},
	{
		n: "San Marino",
		a: "SM",
		t: 2,
		d: 2
	},
	{
		n: "Sao Tome and Principe",
		a: "ST",
		t: 2,
		d: 2
	},
	{
		n: "Saudi Arabia",
		a: "SA",
		t: 2,
		d: 2
	},
	{
		n: "Senegal",
		a: "SN",
		t: 2,
		d: 2
	},
	{
		n: "Serbia",
		a: "RS",
		t: 2,
		d: 0
	},
	{
		n: "Seychelles",
		a: "SC",
		t: 2,
		d: 2
	},
	{
		n: "Sierra Leone",
		a: "SL",
		t: 2,
		d: 2
	},
	{
		n: "Singapore",
		a: "SG",
		t: 2,
		d: 1
	},
	{
		n: "Sint Maarten (Dutch part)",
		a: "SX",
		t: 2,
		d: 2
	},
	{
		n: "Slovakia",
		a: "SK",
		t: 1,
		d: 0
	},
	{
		n: "Slovenia",
		a: "SI",
		t: 1,
		d: 0
	},
	{
		n: "Solomon Islands",
		a: "SB",
		t: 2,
		d: 2
	},
	{
		n: "Somalia",
		a: "SO",
		t: 2,
		d: 2
	},
	{
		n: "South Africa",
		a: "ZA",
		t: 2,
		d: 0
	},
	{
		n: "South Georgia and the South Sandwich Islands",
		a: "GS",
		t: 2,
		d: 2
	},
	{
		n: "South Sudan",
		a: "SS",
		t: 2,
		d: 2
	},
	{
		n: "Spain",
		a: "ES",
		t: 1,
		d: 0
	},
	{
		n: "Sri Lanka",
		a: "LK",
		t: 2,
		d: 1
	},
	{
		n: "Sudan",
		a: "SD",
		t: 2,
		d: 2
	},
	{
		n: "Suriname",
		a: "SR",
		t: 2,
		d: 2
	},
	{
		n: "Svalbard and Jan Mayen",
		a: "SJ",
		t: 2,
		d: 2
	},
	{
		n: "Swaziland",
		a: "SZ",
		t: 2,
		d: 2
	},
	{
		n: "Sweden",
		a: "SE",
		t: 1,
		d: 0
	},
	{
		n: "Switzerland",
		a: "CH",
		t: 2,
		d: 0
	},
	{
		n: "Syrian Arab Republic",
		a: "SY",
		t: 2,
		d: 2
	},
	{
		n: "Taiwan",
		a: "TW",
		t: 2,
		d: 1
	},
	{
		n: "Tajikistan",
		a: "TJ",
		t: 2,
		d: 2
	},
	{
		n: "Tanzania",
		a: "TZ",
		t: 2,
		d: 1
	},
	{
		n: "Thailand",
		a: "TH",
		t: 2,
		d: 1
	},
	{
		n: "Timor-Leste",
		a: "TL",
		t: 2,
		d: 0
	},
	{
		n: "Togo",
		a: "TG",
		t: 2,
		d: 2
	},
	{
		n: "Tokelau",
		a: "TK",
		t: 2,
		d: 2
	},
	{
		n: "Tonga",
		a: "TO",
		t: 2,
		d: 2
	},
	{
		n: "Trinidad and Tobago",
		a: "TT",
		t: 2,
		d: 2
	},
	{
		n: "Tunisia",
		a: "TN",
		t: 2,
		d: 0
	},
	{
		n: "Turkey",
		a: "TR",
		t: 2,
		d: 0
	},
	{
		n: "Turkmenistan",
		a: "TM",
		t: 2,
		d: 2
	},
	{
		n: "Turks and Caicos Islands",
		a: "TC",
		t: 2,
		d: 2
	},
	{
		n: "Tuvalu",
		a: "TV",
		t: 2,
		d: 2
	},
	{
		n: "Uganda",
		a: "UG",
		t: 2,
		d: 1
	},
	{
		n: "Ukraine",
		a: "UA",
		t: 2,
		d: 0
	},
	{
		n: "United Arab Emirates",
		a: "AE",
		t: 2,
		d: 2
	},
	{
		n: "United Kingdom",
		a: "GB",
		t: 2,
		d: 1
	},
	{
		n: "United States Minor Outlying Islands",
		a: "UM",
		t: 2,
		d: 2
	},
	{
		n: "United States of America",
		a: "US",
		t: 2,
		d: 1
	},
	{
		n: "Uruguay",
		a: "UY",
		t: 2,
		d: 0
	},
	{
		n: "Uzbekistan",
		a: "UZ",
		t: 2,
		d: 0
	},
	{
		n: "Vanuatu",
		a: "VU",
		t: 2,
		d: 2
	},
	{
		n: "Venezuela (Bolivarian Republic of)",
		a: "VE",
		t: 2,
		d: 0
	},
	{
		n: "Viet Nam",
		a: "VN",
		t: 2,
		d: 0
	},
	{
		n: "Virgin Islands (British)",
		a: "VG",
		t: 2,
		d: 2
	},
	{
		n: "Virgin Islands (U.S.)",
		a: "VI",
		t: 2,
		d: 2
	},
	{
		n: "Wallis and Futuna",
		a: "WF",
		t: 2,
		d: 2
	},
	{
		n: "Western Sahara",
		a: "EH",
		t: 2,
		d: 2
	},
	{
		n: "Yemen",
		a: "YE",
		t: 2,
		d: 2
	},
	{
		n: "Zambia",
		a: "ZM",
		t: 2,
		d: 2
	},
	{
		n: "Zimbabwe",
		a: "ZW",
		t: 2,
		d: 1
	}
]);
function getByAbbreviation(abbreviation) {
	return Countries.find((c) => c.a === abbreviation) ?? null;
}

//#endregion
export { Countries, CountryType, getByAbbreviation };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ291bnRyeUxpc3QtY2h1bmsuanMiLCJuYW1lcyI6WyJDb3VudHJpZXM6IFJlYWRvbmx5QXJyYXk8Q291bnRyeT4iLCJhYmJyZXZpYXRpb246IHN0cmluZyJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vYXBpL2NvbW1vbi9Db3VudHJ5TGlzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgQ291bnRyeVR5cGUgPSB7XG5cdEdFUk1BTlk6IDAsXG5cdEVVOiAxLFxuXHRPVEhFUjogMixcbn1cbmV4cG9ydCBjb25zdCBEZWNpbWFsU2VwYXJhdG9yID0ge1xuXHRDT01NQTogMCxcblx0RE9UOiAxLFxuXHRVTktOT1dOOiAyLFxufVxuLyoqXG4gKiBwYXJhbWV0ZXIgbmFtZXMgYXJlIHNob3J0ZW5lZCB0byByZWR1Y2Ugc2l6ZVxuICovXG5leHBvcnQgdHlwZSBDb3VudHJ5ID0ge1xuXHQvKiogbmFtZSAqL1xuXHRuOiBzdHJpbmdcblx0LyoqIGFiYnJldmlhdGlvbiAqL1xuXHRhOiBzdHJpbmdcblx0LyoqIHR5cGUgKi9cblx0dDogbnVtYmVyXG5cdC8qKiA/Pz8gKi9cblx0ZDogbnVtYmVyXG59XG4vLyB0YWtlbiBmcm9tIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT18zMTY2LTFcbmV4cG9ydCBjb25zdCBDb3VudHJpZXM6IFJlYWRvbmx5QXJyYXk8Q291bnRyeT4gPSBPYmplY3QuZnJlZXplKFtcblx0e1xuXHRcdG46IFwiQWZnaGFuaXN0YW5cIixcblx0XHRhOiBcIkFGXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCLDhWxhbmQgSXNsYW5kc1wiLFxuXHRcdGE6IFwiQVhcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkFsYmFuaWFcIixcblx0XHRhOiBcIkFMXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJBbGdlcmlhXCIsXG5cdFx0YTogXCJEWlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiQW1lcmljYW4gU2Ftb2FcIixcblx0XHRhOiBcIkFTXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJBbmRvcnJhXCIsXG5cdFx0YTogXCJBRFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiQW5nb2xhXCIsXG5cdFx0YTogXCJBT1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiQW5ndWlsbGFcIixcblx0XHRhOiBcIkFJXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJBbnRhcmN0aWNhXCIsXG5cdFx0YTogXCJBUVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQW50aWd1YSBhbmQgQmFyYnVkYVwiLFxuXHRcdGE6IFwiQUdcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkFyZ2VudGluYVwiLFxuXHRcdGE6IFwiQVJcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkFybWVuaWFcIixcblx0XHRhOiBcIkFNXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJBcnViYVwiLFxuXHRcdGE6IFwiQVdcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkF1c3RyYWxpYVwiLFxuXHRcdGE6IFwiQVVcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkF6ZXJiYWlqYW5cIixcblx0XHRhOiBcIkFaXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJCYWhhbWFzXCIsXG5cdFx0YTogXCJCU1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQmFocmFpblwiLFxuXHRcdGE6IFwiQkhcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkJhbmdsYWRlc2hcIixcblx0XHRhOiBcIkJEXCIsXG5cdFx0dDogMixcblx0XHRkOiAxLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJCYXJiYWRvc1wiLFxuXHRcdGE6IFwiQkJcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkJlbGFydXNcIixcblx0XHRhOiBcIkJZXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJCZWxnaXVtXCIsXG5cdFx0YTogXCJCRVwiLFxuXHRcdHQ6IDEsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiQmVsaXplXCIsXG5cdFx0YTogXCJCWlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQmVuaW5cIixcblx0XHRhOiBcIkJKXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJCZXJtdWRhXCIsXG5cdFx0YTogXCJCTVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQmh1dGFuXCIsXG5cdFx0YTogXCJCVFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQm9saXZpYSAoUGx1cmluYXRpb25hbCBTdGF0ZSBvZilcIixcblx0XHRhOiBcIkJPXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJCb25haXJlXCIsXG5cdFx0YTogXCJCUVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQm9zbmlhIGFuZCBIZXJ6ZWdvdmluYVwiLFxuXHRcdGE6IFwiQkFcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkJvdHN3YW5hXCIsXG5cdFx0YTogXCJCV1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiQm91dmV0IElzbGFuZFwiLFxuXHRcdGE6IFwiQlZcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkJyYXppbFwiLFxuXHRcdGE6IFwiQlJcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkJyaXRpc2ggSW5kaWFuIE9jZWFuIFRlcnJpdG9yeVwiLFxuXHRcdGE6IFwiSU9cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkJydW5laSBEYXJ1c3NhbGFtXCIsXG5cdFx0YTogXCJCTlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiQnVsZ2FyaWFcIixcblx0XHRhOiBcIkJHXCIsXG5cdFx0dDogMSxcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJCdXJraW5hIEZhc29cIixcblx0XHRhOiBcIkJGXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJCdXJ1bmRpXCIsXG5cdFx0YTogXCJCSVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQ2FibyBWZXJkZVwiLFxuXHRcdGE6IFwiQ1ZcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkNhbWJvZGlhXCIsXG5cdFx0YTogXCJLSFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiQ2FtZXJvb25cIixcblx0XHRhOiBcIkNNXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJDYW5hZGFcIixcblx0XHRhOiBcIkNBXCIsXG5cdFx0dDogMixcblx0XHRkOiAxLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJDYXltYW4gSXNsYW5kc1wiLFxuXHRcdGE6IFwiS1lcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkNlbnRyYWwgQWZyaWNhbiBSZXB1YmxpY1wiLFxuXHRcdGE6IFwiQ0ZcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkNoYWRcIixcblx0XHRhOiBcIlREXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJDaGlsZVwiLFxuXHRcdGE6IFwiQ0xcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkNoaW5hXCIsXG5cdFx0YTogXCJDTlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiQ2hyaXN0bWFzIElzbGFuZFwiLFxuXHRcdGE6IFwiQ1hcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkNvY29zIChLZWVsaW5nKSBJc2xhbmRzXCIsXG5cdFx0YTogXCJDQ1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQ29sb21iaWFcIixcblx0XHRhOiBcIkNPXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJDb21vcm9zXCIsXG5cdFx0YTogXCJLTVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQ29uZ29cIixcblx0XHRhOiBcIkNHXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJDb25nbyAoRGVtb2NyYXRpYyBSZXB1YmxpYyBvZiB0aGUpXCIsXG5cdFx0YTogXCJDRFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQ29vayBJc2xhbmRzXCIsXG5cdFx0YTogXCJDS1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQ29zdGEgUmljYVwiLFxuXHRcdGE6IFwiQ1JcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkPDtHRlIGQnSXZvaXJlXCIsXG5cdFx0YTogXCJDSVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiQ3JvYXRpYVwiLFxuXHRcdGE6IFwiSFJcIixcblx0XHR0OiAxLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkN1YmFcIixcblx0XHRhOiBcIkNVXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJDdXJhw6dhb1wiLFxuXHRcdGE6IFwiQ1dcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkN5cHJ1c1wiLFxuXHRcdGE6IFwiQ1lcIixcblx0XHR0OiAxLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkN6ZWNoIFJlcHVibGljXCIsXG5cdFx0YTogXCJDWlwiLFxuXHRcdHQ6IDEsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiRGVubWFya1wiLFxuXHRcdGE6IFwiREtcIixcblx0XHR0OiAxLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkRldXRzY2hsYW5kXCIsXG5cdFx0YTogXCJERVwiLFxuXHRcdHQ6IDAsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiRGppYm91dGlcIixcblx0XHRhOiBcIkRKXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJEb21pbmljYVwiLFxuXHRcdGE6IFwiRE1cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkRvbWluaWNhbiBSZXB1YmxpY1wiLFxuXHRcdGE6IFwiRE9cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkVjdWFkb3JcIixcblx0XHRhOiBcIkVDXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJFZ3lwdFwiLFxuXHRcdGE6IFwiRUdcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkVsIFNhbHZhZG9yXCIsXG5cdFx0YTogXCJTVlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiRXF1YXRvcmlhbCBHdWluZWFcIixcblx0XHRhOiBcIkdRXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJFcml0cmVhXCIsXG5cdFx0YTogXCJFUlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiRXN0b25pYVwiLFxuXHRcdGE6IFwiRUVcIixcblx0XHR0OiAxLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkV0aGlvcGlhXCIsXG5cdFx0YTogXCJFVFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiRmFsa2xhbmQgSXNsYW5kcyAoTWFsdmluYXMpXCIsXG5cdFx0YTogXCJGS1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiRmFyb2UgSXNsYW5kc1wiLFxuXHRcdGE6IFwiRk9cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkZpamlcIixcblx0XHRhOiBcIkZKXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJGaW5sYW5kXCIsXG5cdFx0YTogXCJGSVwiLFxuXHRcdHQ6IDEsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiRnJhbmNlXCIsXG5cdFx0YTogXCJGUlwiLFxuXHRcdHQ6IDEsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiRnJlbmNoIEd1aWFuYVwiLFxuXHRcdGE6IFwiR0ZcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkZyZW5jaCBQb2x5bmVzaWFcIixcblx0XHRhOiBcIlBGXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJGcmVuY2ggU291dGhlcm4gVGVycml0b3JpZXNcIixcblx0XHRhOiBcIlRGXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJHYWJvblwiLFxuXHRcdGE6IFwiR0FcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkdhbWJpYVwiLFxuXHRcdGE6IFwiR01cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkdlb3JnaWFcIixcblx0XHRhOiBcIkdFXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJHaGFuYVwiLFxuXHRcdGE6IFwiR0hcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkdpYnJhbHRhclwiLFxuXHRcdGE6IFwiR0lcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkdyZWVjZVwiLFxuXHRcdGE6IFwiR1JcIixcblx0XHR0OiAxLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkdyZWVubGFuZFwiLFxuXHRcdGE6IFwiR0xcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkdyZW5hZGFcIixcblx0XHRhOiBcIkdEXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJHdWFkZWxvdXBlXCIsXG5cdFx0YTogXCJHUFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiR3VhbVwiLFxuXHRcdGE6IFwiR1VcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkd1YXRlbWFsYVwiLFxuXHRcdGE6IFwiR1RcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkd1ZXJuc2V5XCIsXG5cdFx0YTogXCJHR1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiR3VpbmVhXCIsXG5cdFx0YTogXCJHTlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiR3VpbmVhLUJpc3NhdVwiLFxuXHRcdGE6IFwiR1dcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkd1eWFuYVwiLFxuXHRcdGE6IFwiR1lcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkhhaXRpXCIsXG5cdFx0YTogXCJIVFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiSGVhcmQgSXNsYW5kIGFuZCBNY0RvbmFsZCBJc2xhbmRzXCIsXG5cdFx0YTogXCJITVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiSG9seSBTZWVcIixcblx0XHRhOiBcIlZBXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJIb25kdXJhc1wiLFxuXHRcdGE6IFwiSE5cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkhvbmcgS29uZ1wiLFxuXHRcdGE6IFwiSEtcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkh1bmdhcnlcIixcblx0XHRhOiBcIkhVXCIsXG5cdFx0dDogMSxcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJJY2VsYW5kXCIsXG5cdFx0YTogXCJJU1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiSW5kaWFcIixcblx0XHRhOiBcIklOXCIsXG5cdFx0dDogMixcblx0XHRkOiAxLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJJbmRvbmVzaWFcIixcblx0XHRhOiBcIklEXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJJcmFuIChJc2xhbWljIFJlcHVibGljIG9mKVwiLFxuXHRcdGE6IFwiSVJcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIklyYXFcIixcblx0XHRhOiBcIklRXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJJcmVsYW5kXCIsXG5cdFx0YTogXCJJRVwiLFxuXHRcdHQ6IDEsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiSXNsZSBvZiBNYW5cIixcblx0XHRhOiBcIklNXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJJc3JhZWxcIixcblx0XHRhOiBcIklMXCIsXG5cdFx0dDogMixcblx0XHRkOiAxLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJJdGFseVwiLFxuXHRcdGE6IFwiSVRcIixcblx0XHR0OiAxLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkphbWFpY2FcIixcblx0XHRhOiBcIkpNXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJKYXBhblwiLFxuXHRcdGE6IFwiSlBcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkplcnNleVwiLFxuXHRcdGE6IFwiSkVcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkpvcmRhblwiLFxuXHRcdGE6IFwiSk9cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkthemFraHN0YW5cIixcblx0XHRhOiBcIktaXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJLZW55YVwiLFxuXHRcdGE6IFwiS0VcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIktpcmliYXRpXCIsXG5cdFx0YTogXCJLSVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiS29yZWEgKERlbW9jcmF0aWMgUGVvcGxlJ3MgUmVwdWJsaWMgb2YpXCIsXG5cdFx0YTogXCJLUFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiS29yZWEgKFJlcHVibGljIG9mKVwiLFxuXHRcdGE6IFwiS1JcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkt1d2FpdFwiLFxuXHRcdGE6IFwiS1dcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkt5cmd5enN0YW5cIixcblx0XHRhOiBcIktHXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJMYW8gUGVvcGxlJ3MgRGVtb2NyYXRpYyBSZXB1YmxpY1wiLFxuXHRcdGE6IFwiTEFcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkxhdHZpYVwiLFxuXHRcdGE6IFwiTFZcIixcblx0XHR0OiAxLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkxlYmFub25cIixcblx0XHRhOiBcIkxCXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJMZXNvdGhvXCIsXG5cdFx0YTogXCJMU1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiTGliZXJpYVwiLFxuXHRcdGE6IFwiTFJcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkxpYnlhXCIsXG5cdFx0YTogXCJMWVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiTGllY2h0ZW5zdGVpblwiLFxuXHRcdGE6IFwiTElcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkxpdGh1YW5pYVwiLFxuXHRcdGE6IFwiTFRcIixcblx0XHR0OiAxLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIkx1eGVtYm91cmdcIixcblx0XHRhOiBcIkxVXCIsXG5cdFx0dDogMSxcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJNYWNhb1wiLFxuXHRcdGE6IFwiTU9cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIk1hY2Vkb25pYVwiLFxuXHRcdGE6IFwiTUtcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIk1hZGFnYXNjYXJcIixcblx0XHRhOiBcIk1HXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJNYWxhd2lcIixcblx0XHRhOiBcIk1XXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJNYWxheXNpYVwiLFxuXHRcdGE6IFwiTVlcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIk1hbGRpdmVzXCIsXG5cdFx0YTogXCJNVlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiTWFsaVwiLFxuXHRcdGE6IFwiTUxcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIk1hbHRhXCIsXG5cdFx0YTogXCJNVFwiLFxuXHRcdHQ6IDEsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiTWFyc2hhbGwgSXNsYW5kc1wiLFxuXHRcdGE6IFwiTUhcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIk1hcnRpbmlxdWVcIixcblx0XHRhOiBcIk1RXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJNYXVyaXRhbmlhXCIsXG5cdFx0YTogXCJNUlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiTWF1cml0aXVzXCIsXG5cdFx0YTogXCJNVVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiTWF5b3R0ZVwiLFxuXHRcdGE6IFwiWVRcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIk1leGljb1wiLFxuXHRcdGE6IFwiTVhcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIk1pY3JvbmVzaWEgKEZlZGVyYXRlZCBTdGF0ZXMgb2YpXCIsXG5cdFx0YTogXCJGTVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiTW9sZG92YSAoUmVwdWJsaWMgb2YpXCIsXG5cdFx0YTogXCJNRFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiTW9uYWNvXCIsXG5cdFx0YTogXCJNQ1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiTW9uZ29saWFcIixcblx0XHRhOiBcIk1OXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJNb250ZW5lZ3JvXCIsXG5cdFx0YTogXCJNRVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiTW9udHNlcnJhdFwiLFxuXHRcdGE6IFwiTVNcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIk1vcm9jY29cIixcblx0XHRhOiBcIk1BXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJNb3phbWJpcXVlXCIsXG5cdFx0YTogXCJNWlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiTXlhbm1hclwiLFxuXHRcdGE6IFwiTU1cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIk5hbWliaWFcIixcblx0XHRhOiBcIk5BXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJOYXVydVwiLFxuXHRcdGE6IFwiTlJcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIk5lcGFsXCIsXG5cdFx0YTogXCJOUFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiTmV0aGVybGFuZHNcIixcblx0XHRhOiBcIk5MXCIsXG5cdFx0dDogMSxcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJOZXcgQ2FsZWRvbmlhXCIsXG5cdFx0YTogXCJOQ1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiTmV3IFplYWxhbmRcIixcblx0XHRhOiBcIk5aXCIsXG5cdFx0dDogMixcblx0XHRkOiAxLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJOaWNhcmFndWFcIixcblx0XHRhOiBcIk5JXCIsXG5cdFx0dDogMixcblx0XHRkOiAxLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJOaWdlclwiLFxuXHRcdGE6IFwiTkVcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIk5pZ2VyaWFcIixcblx0XHRhOiBcIk5HXCIsXG5cdFx0dDogMixcblx0XHRkOiAxLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJOaXVlXCIsXG5cdFx0YTogXCJOVVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiTm9yZm9sayBJc2xhbmRcIixcblx0XHRhOiBcIk5GXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJOb3J0aGVybiBNYXJpYW5hIElzbGFuZHNcIixcblx0XHRhOiBcIk1QXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJOb3J3YXlcIixcblx0XHRhOiBcIk5PXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJPbWFuXCIsXG5cdFx0YTogXCJPTVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiw5ZzdGVycmVpY2hcIixcblx0XHRhOiBcIkFUXCIsXG5cdFx0dDogMSxcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJQYWtpc3RhblwiLFxuXHRcdGE6IFwiUEtcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlBhbGF1XCIsXG5cdFx0YTogXCJQV1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiUGFsZXN0aW5lXCIsXG5cdFx0YTogXCJQU1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiUGFuYW1hXCIsXG5cdFx0YTogXCJQQVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiUGFwdWEgTmV3IEd1aW5lYVwiLFxuXHRcdGE6IFwiUEdcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlBhcmFndWF5XCIsXG5cdFx0YTogXCJQWVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiUGVydVwiLFxuXHRcdGE6IFwiUEVcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlBoaWxpcHBpbmVzXCIsXG5cdFx0YTogXCJQSFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiUGl0Y2Fpcm5cIixcblx0XHRhOiBcIlBOXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJQb2xhbmRcIixcblx0XHRhOiBcIlBMXCIsXG5cdFx0dDogMSxcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJQb3J0dWdhbFwiLFxuXHRcdGE6IFwiUFRcIixcblx0XHR0OiAxLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlB1ZXJ0byBSaWNvXCIsXG5cdFx0YTogXCJQUlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiUWF0YXJcIixcblx0XHRhOiBcIlFBXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJSw6l1bmlvblwiLFxuXHRcdGE6IFwiUkVcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlJvbWFuaWFcIixcblx0XHRhOiBcIlJPXCIsXG5cdFx0dDogMSxcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJSdXNzaWFuIEZlZGVyYXRpb25cIixcblx0XHRhOiBcIlJVXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJSd2FuZGFcIixcblx0XHRhOiBcIlJXXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJTYWludCBCYXJ0aMOpbGVteVwiLFxuXHRcdGE6IFwiQkxcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlNhaW50IEhlbGVuYVwiLFxuXHRcdGE6IFwiU0hcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlNhaW50IEtpdHRzIGFuZCBOZXZpc1wiLFxuXHRcdGE6IFwiS05cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlNhaW50IEx1Y2lhXCIsXG5cdFx0YTogXCJMQ1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiU2FpbnQgTWFydGluIChGcmVuY2ggcGFydClcIixcblx0XHRhOiBcIk1GXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJTYWludCBQaWVycmUgYW5kIE1pcXVlbG9uXCIsXG5cdFx0YTogXCJQTVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiU2FpbnQgVmluY2VudCBhbmQgdGhlIEdyZW5hZGluZXNcIixcblx0XHRhOiBcIlZDXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJTYW1vYVwiLFxuXHRcdGE6IFwiV1NcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlNhbiBNYXJpbm9cIixcblx0XHRhOiBcIlNNXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJTYW8gVG9tZSBhbmQgUHJpbmNpcGVcIixcblx0XHRhOiBcIlNUXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJTYXVkaSBBcmFiaWFcIixcblx0XHRhOiBcIlNBXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJTZW5lZ2FsXCIsXG5cdFx0YTogXCJTTlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiU2VyYmlhXCIsXG5cdFx0YTogXCJSU1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiU2V5Y2hlbGxlc1wiLFxuXHRcdGE6IFwiU0NcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlNpZXJyYSBMZW9uZVwiLFxuXHRcdGE6IFwiU0xcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlNpbmdhcG9yZVwiLFxuXHRcdGE6IFwiU0dcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlNpbnQgTWFhcnRlbiAoRHV0Y2ggcGFydClcIixcblx0XHRhOiBcIlNYXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJTbG92YWtpYVwiLFxuXHRcdGE6IFwiU0tcIixcblx0XHR0OiAxLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlNsb3ZlbmlhXCIsXG5cdFx0YTogXCJTSVwiLFxuXHRcdHQ6IDEsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiU29sb21vbiBJc2xhbmRzXCIsXG5cdFx0YTogXCJTQlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiU29tYWxpYVwiLFxuXHRcdGE6IFwiU09cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlNvdXRoIEFmcmljYVwiLFxuXHRcdGE6IFwiWkFcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlNvdXRoIEdlb3JnaWEgYW5kIHRoZSBTb3V0aCBTYW5kd2ljaCBJc2xhbmRzXCIsXG5cdFx0YTogXCJHU1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiU291dGggU3VkYW5cIixcblx0XHRhOiBcIlNTXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJTcGFpblwiLFxuXHRcdGE6IFwiRVNcIixcblx0XHR0OiAxLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlNyaSBMYW5rYVwiLFxuXHRcdGE6IFwiTEtcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlN1ZGFuXCIsXG5cdFx0YTogXCJTRFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiU3VyaW5hbWVcIixcblx0XHRhOiBcIlNSXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJTdmFsYmFyZCBhbmQgSmFuIE1heWVuXCIsXG5cdFx0YTogXCJTSlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiU3dhemlsYW5kXCIsXG5cdFx0YTogXCJTWlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiU3dlZGVuXCIsXG5cdFx0YTogXCJTRVwiLFxuXHRcdHQ6IDEsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiU3dpdHplcmxhbmRcIixcblx0XHRhOiBcIkNIXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJTeXJpYW4gQXJhYiBSZXB1YmxpY1wiLFxuXHRcdGE6IFwiU1lcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlRhaXdhblwiLFxuXHRcdGE6IFwiVFdcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlRhamlraXN0YW5cIixcblx0XHRhOiBcIlRKXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJUYW56YW5pYVwiLFxuXHRcdGE6IFwiVFpcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlRoYWlsYW5kXCIsXG5cdFx0YTogXCJUSFwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcblx0e1xuXHRcdG46IFwiVGltb3ItTGVzdGVcIixcblx0XHRhOiBcIlRMXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJUb2dvXCIsXG5cdFx0YTogXCJUR1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiVG9rZWxhdVwiLFxuXHRcdGE6IFwiVEtcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlRvbmdhXCIsXG5cdFx0YTogXCJUT1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiVHJpbmlkYWQgYW5kIFRvYmFnb1wiLFxuXHRcdGE6IFwiVFRcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlR1bmlzaWFcIixcblx0XHRhOiBcIlROXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJUdXJrZXlcIixcblx0XHRhOiBcIlRSXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJUdXJrbWVuaXN0YW5cIixcblx0XHRhOiBcIlRNXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJUdXJrcyBhbmQgQ2FpY29zIElzbGFuZHNcIixcblx0XHRhOiBcIlRDXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJUdXZhbHVcIixcblx0XHRhOiBcIlRWXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJVZ2FuZGFcIixcblx0XHRhOiBcIlVHXCIsXG5cdFx0dDogMixcblx0XHRkOiAxLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJVa3JhaW5lXCIsXG5cdFx0YTogXCJVQVwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiVW5pdGVkIEFyYWIgRW1pcmF0ZXNcIixcblx0XHRhOiBcIkFFXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJVbml0ZWQgS2luZ2RvbVwiLFxuXHRcdGE6IFwiR0JcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlVuaXRlZCBTdGF0ZXMgTWlub3IgT3V0bHlpbmcgSXNsYW5kc1wiLFxuXHRcdGE6IFwiVU1cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlVuaXRlZCBTdGF0ZXMgb2YgQW1lcmljYVwiLFxuXHRcdGE6IFwiVVNcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDEsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlVydWd1YXlcIixcblx0XHRhOiBcIlVZXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJVemJla2lzdGFuXCIsXG5cdFx0YTogXCJVWlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMCxcblx0fSxcblx0e1xuXHRcdG46IFwiVmFudWF0dVwiLFxuXHRcdGE6IFwiVlVcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlZlbmV6dWVsYSAoQm9saXZhcmlhbiBSZXB1YmxpYyBvZilcIixcblx0XHRhOiBcIlZFXCIsXG5cdFx0dDogMixcblx0XHRkOiAwLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJWaWV0IE5hbVwiLFxuXHRcdGE6IFwiVk5cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDAsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlZpcmdpbiBJc2xhbmRzIChCcml0aXNoKVwiLFxuXHRcdGE6IFwiVkdcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlZpcmdpbiBJc2xhbmRzIChVLlMuKVwiLFxuXHRcdGE6IFwiVklcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIldhbGxpcyBhbmQgRnV0dW5hXCIsXG5cdFx0YTogXCJXRlwiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMixcblx0fSxcblx0e1xuXHRcdG46IFwiV2VzdGVybiBTYWhhcmFcIixcblx0XHRhOiBcIkVIXCIsXG5cdFx0dDogMixcblx0XHRkOiAyLFxuXHR9LFxuXHR7XG5cdFx0bjogXCJZZW1lblwiLFxuXHRcdGE6IFwiWUVcIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlphbWJpYVwiLFxuXHRcdGE6IFwiWk1cIixcblx0XHR0OiAyLFxuXHRcdGQ6IDIsXG5cdH0sXG5cdHtcblx0XHRuOiBcIlppbWJhYndlXCIsXG5cdFx0YTogXCJaV1wiLFxuXHRcdHQ6IDIsXG5cdFx0ZDogMSxcblx0fSxcbl0pXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCeUFiYnJldmlhdGlvbihhYmJyZXZpYXRpb246IHN0cmluZyk6IENvdW50cnkgfCBudWxsIHtcblx0cmV0dXJuIENvdW50cmllcy5maW5kKChjKSA9PiBjLmEgPT09IGFiYnJldmlhdGlvbikgPz8gbnVsbFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVjaW1hbFNlcGFyYXRvcihhYmJyZXZpYXRpb246IHN0cmluZyk6IHN0cmluZyB7XG5cdGxldCBjb3VudHJ5ID0gZ2V0QnlBYmJyZXZpYXRpb24oYWJicmV2aWF0aW9uKVxuXG5cdGlmIChjb3VudHJ5KSB7XG5cdFx0cmV0dXJuIGNvdW50cnkuZCA9PT0gRGVjaW1hbFNlcGFyYXRvci5ET1QgPyBcIi5cIiA6IFwiLFwiXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIFwiLFwiXG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7TUFBYSxjQUFjO0NBQzFCLFNBQVM7Q0FDVCxJQUFJO0NBQ0osT0FBTztBQUNQO01Bb0JZQSxZQUFvQyxPQUFPLE9BQU87Q0FDOUQ7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0NBQ0Q7RUFDQyxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0NBQ0g7Q0FDRDtFQUNDLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILEdBQUc7Q0FDSDtDQUNEO0VBQ0MsR0FBRztFQUNILEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztDQUNIO0FBQ0QsRUFBQztBQUVLLFNBQVMsa0JBQWtCQyxjQUFzQztBQUN2RSxRQUFPLFVBQVUsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLGFBQWEsSUFBSTtBQUN0RCJ9