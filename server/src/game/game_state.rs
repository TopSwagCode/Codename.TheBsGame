use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum UnitType {
    Normal,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Unit {
    pub position: (f32, f32),
    pub destination: (f32, f32),
    pub unit_type: UnitType,
    pub id: String,
}
#[derive(Serialize, Deserialize, Default)]
pub struct GameState {
    //TODO Change this to https://docs.rs/chashmap/2.2.2/chashmap/
    pub units: HashMap<String, Unit>,
}
