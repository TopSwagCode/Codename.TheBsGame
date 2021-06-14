use crate::{
    game::{
        self,
        game_state::{GameState, Unit, UnitType},
    },
    Client, Clients, GameCommandSender, GameStateRef,
};
use futures::{FutureExt, StreamExt};
use serde::Deserialize;
use serde_json::from_str;
use tokio::sync::mpsc;
use uuid::Uuid;
use warp::ws::{Message, WebSocket};

#[derive(Deserialize, Debug, Clone)]
pub struct CreateUnitRequest {
    position: (f32, f32),
}

#[derive(Deserialize, Debug, Clone)]
pub struct SetUnitRequest {
    position: (f32, f32),
    id: String,
}

#[derive(Deserialize, Debug, Clone)]
pub enum RequestType {
    CreatUnit(CreateUnitRequest),
    SetUnit(SetUnitRequest),
    ResetGame,
}

pub async fn client_connection(
    ws: WebSocket,
    id: String,
    clients: Clients,
    mut client: Client,
    sender: GameCommandSender,
) {
    let (client_ws_sender, mut client_ws_rcv) = ws.split();
    let (client_sender, client_rcv) = mpsc::unbounded_channel();

    tokio::task::spawn(client_rcv.forward(client_ws_sender).map(|result| {
        if let Err(e) = result {
            eprintln!("error sending websocket msg: {}", e);
        }
    }));

    client.sender = Some(client_sender);
    clients.write().await.insert(id.clone(), client);

    println!("{} connected", id);

    while let Some(result) = client_ws_rcv.next().await {
        let msg = match result {
            Ok(msg) => msg,
            Err(e) => {
                eprintln!("error receiving ws message for id: {}): {}", id.clone(), e);
                break;
            }
        };
        client_msg(&id, msg, &clients, sender.clone()).await;
    }

    clients.write().await.remove(&id);
    println!("{} disconnected", id);
}

async fn client_msg(id: &str, msg: Message, clients: &Clients, mut sender: GameCommandSender) {
    println!("received message from {}: {:?}", id, msg);
    let message = match msg.to_str() {
        Ok(v) => v,
        Err(_) => return,
    };

    if message == "ping" || message == "ping\n" {
        return;
    }
    use RequestType::*;

    let request = from_str(&message);
    let response = match request {
        Ok(CreatUnit(CreateUnitRequest { position })) => {
            let uuid = Uuid::new_v4().simple().to_string();
            sender
                .send(game::commands::GameCommand::CreateUnitCommand {
                    position,
                    uuid: uuid.clone(),
                })
                .await
                .expect("Should be able to send");
            Some(uuid)
        }
        Ok(SetUnit(SetUnitRequest { position, id })) => {
            sender
                .send(game::commands::GameCommand::SetUnitDestinationCommand { position, uuid: id })
                .await
                .expect("Should be able to send");
            None
        }
        Ok(RequestType::ResetGame) => {
            sender
                .send(game::commands::GameCommand::ResetGameCommand)
                .await
                .expect("Could not send message");
            None
        }
        Err(e) => {
            let example_string = "{\"CreatUnit\":{\"position\":[10.0,15.0]}}";
            //Send something like this {"CreatUnit":{"position":[10.0,15.0]}}
            eprintln!(
                "error parsing message: {} , try something like this\n {}",
                e, example_string
            );
            None
        }
    };
    if let Some(response) = response {
        clients.read().await.iter().for_each(|c| match &c.1.sender {
            Some(sender) => {
                let _result = sender.send(Ok(Message::text(response.clone())));
            }
            None => {}
        });
    }
}
