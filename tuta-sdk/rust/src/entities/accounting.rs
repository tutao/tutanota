#![allow(non_snake_case, unused_imports)]

use super::*;
use serde::{Serialize, Deserialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomerAccountPosting {
    pub _id: Id,
    pub amount: i64,
    pub invoiceNumber: Option<String>,
    #[serde(rename = "type")]
    pub r#type: i64,
    pub valueDate: DateTime,
}

impl Entity for CustomerAccountPosting {
    fn type_ref() -> TypeRef {
        TypeRef { app: "accounting".to_owned(), type_: "CustomerAccountPosting".to_owned() }
    }
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomerAccountReturn {
    pub _format: i64,
    pub _ownerGroup: Option<Id>,
    #[serde(with = "serde_bytes")]
    pub _ownerPublicEncSessionKey: Option<Vec<u8>>,
    pub _publicCryptoProtocolVersion: Option<i64>,
    pub balance: i64,
    pub outstandingBookingsPrice: i64,
    pub postings: Vec<CustomerAccountPosting>,
}

impl Entity for CustomerAccountReturn {
    fn type_ref() -> TypeRef {
        TypeRef { app: "accounting".to_owned(), type_: "CustomerAccountReturn".to_owned() }
    }
}
