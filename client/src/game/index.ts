import { PerspectiveCamera, Scene } from 'three'
import ModelLoader, { LoadedModels } from './loaders/modelLoader'
import { IGameObject } from './gameObjects/gameObject'
import MoveableGameObject from './gameObjects/moveableGameObject'
import GameStateDataService from './services/gameStateDataService'
import { CreateUnitResponse, SetUnitMessage } from './services/models'
import GameWorld from './gameWorld'
import GameRenderer from './gameRenderer'
import GameControls from './controls/gameControls'
import Object3DHelper from './helpers/object3dHelper'

class Game {
	private scene: Scene

	private camera: PerspectiveCamera

	private gameRenderer: GameRenderer

	private gameControls: GameControls

	private modelLoader: ModelLoader

	private gameWorld: GameWorld

	private gameStateDataService: GameStateDataService

	constructor(container: HTMLDivElement) {
		this.scene = new Scene()
		this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200)

		this.gameWorld = new GameWorld(this.scene)
		this.gameRenderer = new GameRenderer(container, this.scene, this.camera)
		this.gameControls = new GameControls(container, this.camera, this.gameWorld)
		this.modelLoader = new ModelLoader('assets/models/')
		this.gameStateDataService = new GameStateDataService()
	}

	public initialize = (): void => {
		this.gameRenderer.initialize()
		this.gameControls.initialize()
		this.modelLoader.initialize()
		this.gameWorld.initialize()

		this.gameRenderer.addUpdateTarget(this.gameWorld)
		this.gameRenderer.addUpdateTarget(this.gameControls)

		this.camera.position.set(30, 30, -20)
		this.loadModels()
	}

	private connectToServer = (connectionAtempt = 0): void => {
		this.gameStateDataService
			.connectToWebsocket(1)
			.then(() => this.handleConnectedToServer(true, connectionAtempt + 1))
			.catch(() => this.handleConnectedToServer(false, connectionAtempt + 1))
	}

	private handleConnectedToServer = (connected: boolean, connectionAtempt = 0): void => {
		if (connected) {
			this.gameStateDataService.addMessageHandler('CreatUnit', this.handleServerCreateUnit)
			this.gameStateDataService.addMessageHandler('SetUnit', this.handleServerSetUnit)

			this.gameRenderer.start()
		} else {
			setTimeout(() => {
				this.connectToServer(connectionAtempt)
			}, 5000 * connectionAtempt)
		}
	}

	private handleServerCreateUnit = (message: CreateUnitResponse): void => {
		// eslint-disable-next-line no-console
		console.log('handleServerCreateUnit', message)
		const { position: pos, id } = message.CreatUnit
		this.gameWorld.addGameObject(this.createMoveableTower(id, pos[0], pos[1]))
	}

	private handleServerSetUnit = (message: SetUnitMessage): void => {
		// eslint-disable-next-line no-console
		console.log('handleServerSetUnit', message)
		const { position: pos, id } = message.SetUnit
		this.gameWorld.setGameObject(id, 'destination', { x: pos[0], z: pos[1], y: 0.1 })
		this.gameWorld.setGameObject(id, 'position', { x: pos[0], z: pos[1], y: 0.1 })
	}

	private handleLoadModelsCompleted = (): void => {
		this.gameStateDataService.fetchInitialGameState().then((resp) => {
			this.connectToServer()
			Object.keys(resp).forEach((key) => {
				const unit = resp[key]
				if (unit.position.length >= 2) {
					this.gameWorld.addGameObject(this.createMoveableTower(unit.id, unit.position[0], unit.position[1]))
				}
			})
		})
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public handleActionbarButtonClicked = (button: string): void => {
		this.gameStateDataService.createUnit(10, 10)
	}

	private loadModels = (): void => {
		this.modelLoader.loadModels(
			[
				{
					name: 'tower',
					path: '/tower/scene.gltf',
					onLoaded: (tower) => tower.object.scale.setScalar(0.03)
				},
				{
					name: 'well',
					path: '/well/scene.gltf',
					onLoaded: (well) => well.object.scale.setScalar(0.3)
				}
			],
			() => {
				this.handleLoadModelsCompleted()
			}
		)
	}

	private handleGameObjectReachedDestination = (obj: MoveableGameObject): void => {
		this.gameStateDataService.setUnit(obj.key, obj.worldData.position.x, obj.worldData.position.z)
	}

	private createMoveableTower = (id: string, posX: number, posZ: number): IGameObject => this.createMoveableGameObject('tower', id, posX, posZ)

	private createMoveableWell = (id: string, posX: number, posZ: number): IGameObject => this.createMoveableGameObject('well', id, posX, posZ)

	private createMoveableGameObject = (modelKey: keyof LoadedModels, id: string, posX: number, posZ: number): IGameObject => {
		const model = this.modelLoader.loadedModels[modelKey]
		const gameObj = new MoveableGameObject(id, Object3DHelper.setShadows(model.object))
		gameObj.destinationReached = this.handleGameObjectReachedDestination
		gameObj.worldData.receiveShadow = true
		gameObj.worldData.castShadow = true
		gameObj.worldData.position.y = 0.1
		gameObj.worldData.position.x = posX
		gameObj.worldData.position.z = posZ
		return gameObj
	}
}

export default Game
