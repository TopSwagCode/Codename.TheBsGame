/// Resource that contains information about the ellapsed time of the game.
#[derive(Default)]
pub struct TimeResource {
    /// Time elapsed since the last tick
    pub elapsed_seconds: f64,

    /// Ticks since start of the game.
    /// If one tick is 1 second, this is enough for 5.8*10^11 years.
    pub ticks: u64,
}
