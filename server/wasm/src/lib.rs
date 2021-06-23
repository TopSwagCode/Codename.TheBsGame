use game_logic::{components::UnitId, game_state::Unit, GameLogic, GameLogicTrait};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WebGame {
    inner_game: GameLogic,
}

#[derive(Serialize, Deserialize)]
pub struct UnitPositionChange {
    pub new_x: f32,
    pub new_y: f32,
    pub unit_id: String,
}

#[wasm_bindgen]
impl WebGame {
    pub fn execute(&mut self) {
        self.inner_game.execute();
    }

    pub fn ticks(&self) -> u64 {
        self.inner_game.ticks()
    }

    pub fn get_changed_units(&self) -> JsValue {
        let query = self.inner_game.query_changed_units();
        let unit_position_changed =
            query
                .iter()
                .map(|(pos, _des_op, UnitId { id })| UnitPositionChange {
                    new_x: pos.x,
                    new_y: pos.y,
                    unit_id: id.clone(),
                });

        let vec_of_changed: Vec<UnitPositionChange> = unit_position_changed.collect();
        JsValue::from_serde(&vec_of_changed).unwrap()
    }

    pub fn set_elapsed_seconds(&mut self, elapsed_seconds: f64) {
        self.inner_game.set_elapsed_seconds(elapsed_seconds);
    }
}

#[wasm_bindgen]
pub fn initialize_game() -> WebGame {
    let mut inner_game = GameLogic::new();

    use game_logic::commands::GameCommand::*;
    let mut inputs = vec![];
    for i in 1..=1000 {
        if i < 100 {
            inputs.push(CreateUnitCommand {
                unit: Unit {
                    position: (i as f32, i as f32),
                    destination: (i as f32 * 10., i as f32 * 10.),
                    id: format!("{}", i),
                },
            });
        } else {
            inputs.push(CreateUnitCommand {
                unit: Unit {
                    position: (i as f32, i as f32),
                    destination: (i as f32, i as f32),
                    id: format!("{}", i),
                },
            });
        }
    }
    inner_game.handle_commands(inputs);
    inner_game.execute();
    WebGame { inner_game }
}
