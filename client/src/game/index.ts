import { Material, Mesh, Object3D, PerspectiveCamera, Scene } from 'three'
import { v4 as uuid } from 'uuid'
import ModelLoader, { LoadedGameModel } from './loaders/modelLoader'
import GameObject, { IGameObject } from './gameObjects/gameObject'
import MoveableGameObject from './gameObjects/moveableGameObject'
import GameStateDataService from './services/gameStateDataService'
import { CreateUnitMessage, SetUnitMessage } from './services/models'
import GameWorld from './gameWorld'
import GameRenderer from './gameRenderer'
import GameControls from './controls/gameControls'

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
		this.modelLoader = new ModelLoader()
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
			.then((connected) => this.handleConnectedToServer(connected, connectionAtempt + 1))
			.catch(() => this.handleConnectedToServer(false, connectionAtempt + 1))
	}

	private handleConnectedToServer = (connected: boolean, connectionAtempt = 0): void => {
		if (connected) {
			this.gameStateDataService.addMessageHandler('CreateUnit', this.handleServerCreateUnit)
			this.gameStateDataService.addMessageHandler('SetUnit', this.handleServerSetUnit)

			this.gameRenderer.start()
		} else {
			setTimeout(() => {
				this.connectToServer(connectionAtempt)
			}, 5000 * connectionAtempt)
		}
	}

	private handleServerCreateUnit = (message: CreateUnitMessage): void => {
		// eslint-disable-next-line no-console
		console.log('handleServerCreateUnit', message)
	}

	private handleServerSetUnit = (message: SetUnitMessage): void => {
		// eslint-disable-next-line no-console
		console.log('handleServerSetUnit', message)
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

		this.gameWorld.addGameObject(this.createMoveableTower(`tower_${uuid()}`, 10, 10))
	}

	private loadModels = (): void => {
		this.modelLoader.loadModels(
			[
				{
					name: 'tower',
					path: '/assets/models/tower/scene.gltf'
				},
				{
					name: 'well',
					path: '/assets/models/well/scene.gltf'
				}
			],
			() => {
				this.handleLoadModelsCompleted()
			}
		)
	}

	private createGameObject = (model: LoadedGameModel, posX: number, posZ: number, scale: number): IGameObject => {
		const gameObj = new GameObject(`${model.name}_${uuid()}`, this.cloneModelCreateObject3D(model.object, scale))
		// gameObj.worldData.scale = scale
		gameObj.worldData.receiveShadow = true
		gameObj.worldData.castShadow = true
		gameObj.worldData.position.y = 0.1
		gameObj.worldData.position.x = posX
		gameObj.worldData.position.z = posZ
		return gameObj
	}

	private handleGameObjectReachedDestination = (obj: MoveableGameObject): void => {
		this.gameStateDataService.setUnit(obj.key, obj.worldData.position.x, obj.worldData.position.z)
	}

	private createMoveableTower = (id: string, posX: number, posZ: number): IGameObject => {
		const model = this.modelLoader.loadedModels.tower
		const gameObj = new MoveableGameObject(id, this.cloneModelCreateObject3D(model.object, 0.03))
		gameObj.destinationReached = this.handleGameObjectReachedDestination
		gameObj.worldData.receiveShadow = true
		gameObj.worldData.castShadow = true
		gameObj.worldData.position.y = 0.1
		gameObj.worldData.position.x = posX
		gameObj.worldData.position.z = posZ
		return gameObj
	}

	private createMoveableGameObject = (model: LoadedGameModel, posX: number, posZ: number, scale: number): IGameObject => {
		const gameObj = new MoveableGameObject(`${model.name}_${uuid()}`, this.cloneModelCreateObject3D(model.object, scale))
		// gameObj.worldData.scale = scale
		gameObj.worldData.receiveShadow = true
		gameObj.worldData.castShadow = true
		gameObj.worldData.position.y = 0.1
		gameObj.worldData.position.x = posX
		gameObj.worldData.position.z = posZ
		return gameObj
	}

	private cloneModelCreateObject3D = (object: Object3D, scale: number, castShadow = true, receiveShadow = true): Object3D => {
		const newObject = object.clone(true)
		newObject.traverse((m) => {
			const mesh = m as Mesh
			mesh.castShadow = castShadow
			mesh.receiveShadow = receiveShadow
			if (mesh.isMesh) {
				mesh.material = this.cloneMaterial(mesh.material)
			}
		})
		newObject.scale.setScalar(scale)
		return newObject
	}

	private cloneMaterial = (material: Material | Material[]): Material | Material[] => {
		let newMaterial = material
		if (Array.isArray(newMaterial)) {
			newMaterial = newMaterial.filter((im) => im.isMaterial).map((m) => m.clone())
		} else if (newMaterial.isMaterial) {
			newMaterial = newMaterial.clone()
		}
		return newMaterial
	}
}

export default Game
