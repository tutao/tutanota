#![allow(non_snake_case, unused_imports)]
use super::*;
use serde::{Serialize, Deserialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize, Debug)]
pub struct CustomerAccountPosting {
    pub _id: CustomId,
    pub amount: i64,
    pub invoiceNumber: Option<String>,
    #[serde(rename = "type")]
    pub r#type: i64,
    pub valueDate: DateTime,
}

impl Entity for CustomerAccountPosting {
    fn type_ref() -> TypeRef {
        TypeRef {
            app: "accounting",
            type_: "CustomerAccountPosting",
         }
    }
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize, Debug)]
pub struct CustomerAccountReturn {
    pub _format: i64,
    pub _ownerGroup: Option<GeneratedId>,
    #[serde(with = "serde_bytes")]
    pub _ownerPublicEncSessionKey: Option<Vec<u8>>,
    pub _publicCryptoProtocolVersion: Option<i64>,
    pub balance: i64,
    pub outstandingBookingsPrice: i64,
    pub postings: Vec<CustomerAccountPosting>,
	pub errors: Option<Errors>,
	pub final_ivs: HashMap<String, FinalIv>,
}

impl Entity for CustomerAccountReturn {
    fn type_ref() -> TypeRef {
        TypeRef {
            app: "accounting",
            type_: "CustomerAccountReturn",
         }
    }
}
