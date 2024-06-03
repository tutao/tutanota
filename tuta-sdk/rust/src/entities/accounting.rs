#![allow(non_snake_case)]
use super::*;

pub struct CustomerAccountPosting {
	pub _id: Id,
	pub amount: String,
	pub invoiceNumber: String,
	#[serde(rename = "type")]
	pub r#type: String,
	pub valueDate: Date,
}

pub struct CustomerAccountReturn {
	pub _format: String,
	pub _ownerGroup: Id,
	pub _ownerPublicEncSessionKey: Vec<u8>,
	pub _publicCryptoProtocolVersion: String,
	pub balance: String,
	pub outstandingBookingsPrice: String,
	pub postings: Vec<CustomerAccountPosting>,
}