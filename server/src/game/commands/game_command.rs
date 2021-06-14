#[derive(Debug)]
pub enum GameCommand {
    CreateUnitCommand { position: (f32, f32), uuid: String },
    SetUnitDestinationCommand { position: (f32, f32), uuid: String },
    ResetGameCommand,
}
