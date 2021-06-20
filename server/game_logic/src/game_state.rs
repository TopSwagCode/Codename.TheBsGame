use std::collections::HashMap;

use legion::Entity;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Unit {
    pub position: (f32, f32),
    pub destination: (f32, f32),
    pub id: String,
}
#[derive(Serialize, Deserialize, Default)]
pub struct GameStateCache {
    //TODO Change this to https://docs.rs/chashmap/2.2.2/chashmap/
    pub units: HashMap<String, Unit>,
}

pub type UidEntityMap = HashMap<String, Entity>;
