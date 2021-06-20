use crate::game_state::Unit;

#[derive(Debug)]
pub enum GameCommand {
    CreateUnitCommand { unit: Unit },
    SetUnitDestinationCommand { position: (f32, f32), uuid: String },
    ResetGameCommand,
}
