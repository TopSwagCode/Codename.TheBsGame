// #![windows_subsystem = "windows"]
use std::collections::HashMap;
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use warp::{ws::Message, Filter, Rejection};

use crate::game::game_state::GameState;

mod game;
mod handler;
mod ws;

type Result<T> = std::result::Result<T, Rejection>;
type Clients = Arc<RwLock<HashMap<String, Client>>>;
type GameStateRef = Arc<RwLock<GameState>>;

#[derive(Debug, Clone)]
pub struct Client {
    pub user_id: usize,
    pub sender: Option<mpsc::UnboundedSender<std::result::Result<Message, warp::Error>>>,
}

#[tokio::main]
async fn main() {
    let clients: Clients = Arc::new(RwLock::new(HashMap::new()));

    let health_route = warp::path!("health").and_then(handler::health_handler);

    let game_state = Arc::new(RwLock::new(GameState::default()));

    let game = warp::path("game");
    let game_route = game.and(warp::get())
        .and(with_game_state(game_state.clone()))
        .and_then(handler::get_game_state_handler);

    let register = warp::path("register");
    let register_routes = register
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(clients.clone()))
        .and_then(handler::register_handler)
        .or(register
            .and(warp::delete())
            .and(warp::path::param())
            .and(with_clients(clients.clone()))
            .and_then(handler::unregister_handler));

    let ws_route = warp::path("ws")
        .and(warp::ws())
        .and(warp::path::param())
        .and(with_clients(clients))
        .and(with_game_state(game_state))
        .and_then(handler::ws_handler);

    let routes = health_route
        .or(game_route)
        .or(register_routes)
        .or(ws_route)
        .with(warp::cors().allow_any_origin());
    let address = ([127, 0, 0, 1], 8000);
    println!("Listening on {:?}", address);
    warp::serve(routes).run(address).await;
}

fn with_clients(clients: Clients) -> impl Filter<Extract = (Clients,), Error = Infallible> + Clone {
    warp::any().map(move || clients.clone())
}

fn with_game_state(
    game_state: GameStateRef,
) -> impl Filter<Extract = (GameStateRef,), Error = Infallible> + Clone {
    warp::any().map(move || game_state.clone())
}
