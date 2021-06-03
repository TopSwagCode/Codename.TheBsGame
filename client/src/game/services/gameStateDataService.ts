import { ConnectResponse, CreateUnitMessage, GameState } from './models'
import SetUnitMessage from './models/setUnitMessage'

interface WebsocketMessages {
	CreateUnit: CreateUnitMessage
	SetUnit: SetUnitMessage
}

type WebsocketMessageType = keyof WebsocketMessages
type WebsocketMessage = WebsocketMessages[WebsocketMessageType]

type MessageHandlerCallback<TMessage> = (message: TMessage) => void
type AddMessageHandler = <TMessageKey extends WebsocketMessageType>(type: TMessageKey, handler: MessageHandlerCallback<WebsocketMessages[TMessageKey]>) => void
interface MessageHandler {
	type: WebsocketMessageType
	handler: MessageHandlerCallback<any & WebsocketMessage>
}

class GameStateDataService {
	private apiUri: string

	private socket: WebSocket | undefined

	private messageHandlers: MessageHandler[]

	constructor() {
		this.apiUri = process.env.REACT_APP_SERVER_API
		this.messageHandlers = []
	}

	public connectToWebsocket = (userId: number): void => {
		fetch(`${this.apiUri}/register`, {
			method: 'POST',
			mode: 'cors',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ user_id: userId })
		})
			.then((r) => r.json())
			.then((r: ConnectResponse) => r.url)
			.then((url) => {
				const socket = new WebSocket(url)
				socket.onopen = () => {
					this.socket = socket
					socket.onmessage = this.onMessageRecived
				}
			})
	}

	public fetchInitialGameState = (): Promise<GameState> => fetch(`${this.apiUri}/game`).then<GameState>((response) => response.json())

	public addMessageHandler: AddMessageHandler = (type, handler) => {
		this.messageHandlers = [{ type, handler }]
	}

	private notifyHandlers = (type: WebsocketMessageType, message: WebsocketMessage): void => {
		this.messageHandlers.filter((h) => h.type === type).forEach((handler) => handler.handler(message))
	}

	private onMessageRecived = (e: MessageEvent): void => {
		const msg: WebsocketMessage = JSON.parse(e.data)
		if ((msg as CreateUnitMessage).CreatUnit) {
			const createUnit = (msg as CreateUnitMessage).CreatUnit
			this.notifyHandlers('CreateUnit', msg)
			// this.loadModel('/models/tower/scene.gltf', createUnit.position[0], 0, createUnit.position[1], 0.01, (model) => {
			//     this.tower = model
			//     this.scene.add(this.tower)
			// })
		}
	}
}

export default GameStateDataService
