use legion::{system, systems::CommandBuffer, world::SubWorld, Entity, EntityStore};

use crate::game_state::UidEntityMap;
use crate::{
    commands::GameCommand,
    components::{Destination, Position, UnitId},
    game_state::Unit,
};

#[system(for_each)]
#[write_component(Destination)]
pub fn handle_commands(
    world: &mut SubWorld,
    game_command: &GameCommand,
    entity: &Entity,
    #[resource] id_map: &mut UidEntityMap,
    command_buffer: &mut CommandBuffer,
) {
    match game_command {
        GameCommand::CreateUnitCommand {
            unit: Unit { position, id, .. },
        } => {
            let new_entity = command_buffer.push((
                Position {
                    x: position.0,
                    y: position.1,
                },
                UnitId { id: id.clone() },
            ));
            id_map.insert(id.clone(), new_entity);
        }
        GameCommand::SetUnitDestinationCommand { position, uuid } => {
            if let Some(entity) = id_map.get(uuid) {
                let entry_result = world.entry_mut(*entity);
                if let Ok(mut entry) = entry_result {
                    if let Ok(destination) = entry.get_component_mut::<Destination>() {
                        destination.x = position.0;
                        destination.y = position.1;
                    } else {
                        command_buffer.add_component(
                            *entity,
                            Destination {
                                x: position.0,
                                y: position.1,
                            },
                        )
                    }
                }
            }
        }
        // This command has to be handled in the main game loop, as this system does not have access to wipe the world,
        GameCommand::ResetGameCommand => {}
    };
    command_buffer.remove(*entity);
}
