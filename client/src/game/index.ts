import Stats from 'three/examples/jsm/libs/stats.module'
import { Clock, Material, Mesh, Object3D, PerspectiveCamera, Scene, sRGBEncoding, WebGLRenderer } from 'three'
import { v4 as uuid } from 'uuid'
import MapControls from './controls/MapControls'
import ModelLoader, { LoadedGameModel } from './loaders/modelLoader'
import GameWorld from './gameWorld'
import WorldInteractionControls from './controls/worldInteractionControls'
import GameObject, { IGameObject } from './gameObjects/gameObject'
import MoveableGameObject from './gameObjects/moveableGameObject'

class Game {
	private container: HTMLDivElement

	private renderer: WebGLRenderer

	private camera: PerspectiveCamera

	private controls: MapControls | undefined

	private scene: Scene

	private modelLoader: ModelLoader

	private gameWorld: GameWorld

	private worldInteractionControls: WorldInteractionControls

	private clock: Clock

	private stats: Stats

	private fps = 60

	private lastRender = Date.now()

	constructor(container: HTMLDivElement) {
		this.container = container
		this.renderer = new WebGLRenderer({ antialias: true })
		this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200)
		this.scene = new Scene()
		this.modelLoader = new ModelLoader()
		this.clock = new Clock()
		this.gameWorld = new GameWorld(this.scene)
		this.worldInteractionControls = new WorldInteractionControls(this.container, this.camera, this.gameWorld)
		this.stats = Stats()
	}

	public initialize = (): void => {
		this.modelLoader.initialize()
		this.gameWorld.initialize()
		this.worldInteractionControls.initialize()

		window.addEventListener('resize', this.handleWindowResize)
		// init rendere

		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(window.innerWidth, window.innerHeight)

		this.renderer.outputEncoding = sRGBEncoding
		this.renderer.shadowMap.enabled = true

		// init camera
		this.camera.position.set(30, 30, -20)

		// init controls
		this.controls = new MapControls(this.camera, this.container)
		this.controls.screenSpacePanning = false
		this.controls.minDistance = 5
		this.controls.maxDistance = 75

		// "Math.PI" = allow full bird view
		// "Math.PI / 10" = allow 10% angle from full bird view
		this.controls.minPolarAngle = Math.PI / 10

		// "0" = allow to look from bottom
		// "Math.PI / 2.5" = lowest look angle is 40%
		this.controls.maxPolarAngle = Math.PI / 2.5

		this.controls.target.set(0, 0, 0)

		this.container.appendChild(this.renderer.domElement)
		this.container.appendChild(this.stats.dom)
		this.loadModels()
	}

	handleWindowResize = (/* event: UIEvent */): void => {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	private handleLoadModelsCompleted = (): void => {
		// this.renderer.setAnimationLoop(this.renderLoop)

		requestAnimationFrame(this.renderLoop)
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
			(loadedModels) => {
				this.gameWorld.addGameObject(this.createMoveableGameObject(loadedModels.well, 0, 0, 0.1))
				this.gameWorld.addGameObject(this.createMoveableGameObject(loadedModels.well, 10, 0, 0.1))
				this.gameWorld.addGameObject(this.createMoveableGameObject(loadedModels.tower, 20, 0, 0.02))
				this.gameWorld.addGameObject(this.createMoveableGameObject(loadedModels.tower, 30, 0, 0.02))
				this.gameWorld.addGameObject(this.createMoveableGameObject(loadedModels.tower, 20, 10, 0.02))
				this.gameWorld.addGameObject(this.createMoveableGameObject(loadedModels.tower, 30, 10, 0.02))
				this.gameWorld.addGameObject(this.createMoveableGameObject(loadedModels.tower, 20, -10, 0.02))
				this.gameWorld.addGameObject(this.createMoveableGameObject(loadedModels.tower, 30, -10, 0.02))
				this.gameWorld.addGameObject(this.createMoveableGameObject(loadedModels.tower, -30, -30, 0.03))
				this.gameWorld.addGameObject(this.createGameObject(loadedModels.tower, -100, -100, 0.1))
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

	private renderLoop = (time: number): void => {
		const now = Date.now()
		const lastRenderDiff = now - this.lastRender
		const interval = 1000 / this.fps
		if (lastRenderDiff > interval) {
			const delta = this.clock.getDelta()
			this.gameWorld.update(time, delta)
			this.stats.update()
			this.lastRender = now - (lastRenderDiff % interval)
			this.renderer.render(this.scene, this.camera)
		}
		requestAnimationFrame(this.renderLoop)
	}
}

export default Game
