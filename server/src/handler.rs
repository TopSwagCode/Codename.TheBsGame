use tokio::sync::mpsc::Sender;

use crate::{
    game::commands::GameCommand,
    ws::{self, RequestType},
    Client, Clients, GameCommandSender, GameStateRef, Result,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use warp::{http::StatusCode, reply::json, Reply};

#[derive(Serialize, Debug)]
pub struct RegisterResponse {
    url: String,
}

#[derive(Deserialize, Debug)]
pub struct RegisterRequest {
    user_id: usize,
}

pub async fn get_game_state_handler(game_state: GameStateRef) -> Result<impl Reply> {
    let game_state = &game_state.read().await.units;
    let json = json(&game_state);
    Ok(json)
}

pub async fn reset_game_state_handler(mut sender: GameCommandSender) -> impl Reply {
    sender
        .send(GameCommand::ResetGameCommand)
        .await
        .expect("Should be able to send");
    ""
}

pub async fn register_handler(body: RegisterRequest, clients: Clients) -> Result<impl Reply> {
    let user_id = body.user_id;
    println!("Register Handler, user_id {}", user_id);
    let uuid = Uuid::new_v4().simple().to_string();

    register_client(uuid.clone(), user_id, clients).await;
    Ok(json(&RegisterResponse {
        url: format!("ws://127.0.0.1:8000/ws/{}", uuid),
    }))
}

async fn register_client(id: String, user_id: usize, clients: Clients) {
    println!("Register Client, id {}", id);

    clients.write().await.insert(
        id,
        Client {
            user_id,
            sender: None,
        },
    );
}

pub async fn unregister_handler(id: String, clients: Clients) -> Result<impl Reply> {
    println!("Unregister handler, id {}", id);

    clients.write().await.remove(&id);
    Ok(StatusCode::OK)
}

pub async fn ws_handler(
    ws: warp::ws::Ws,
    id: String,
    clients: Clients,
    sender: GameCommandSender,
) -> Result<impl Reply> {
    let client = clients.read().await.get(&id).cloned();
    match client {
        Some(c) => {
            Ok(ws.on_upgrade(move |socket| ws::client_connection(socket, id, clients, c, sender)))
        }
        None => Err(warp::reject::not_found()),
    }
}

pub async fn health_handler() -> Result<impl Reply> {
    Ok(StatusCode::OK)
}
