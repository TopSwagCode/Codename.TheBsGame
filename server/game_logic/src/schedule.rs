use legion::Schedule;

use crate::systems::*;

pub fn create_schedule() -> Schedule {
    Schedule::builder()
        .add_system(handle_commands_system())
        .flush()
        .add_system(destination_to_velocity_system())
        .flush()
        .add_system(velocity_to_position_system())
        .flush()
        .add_system(remove_destination_on_arrival_system())
        .build()
}
