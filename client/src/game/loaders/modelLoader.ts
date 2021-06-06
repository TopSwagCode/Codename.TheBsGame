import { Object3D } from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export interface GameModel {
	path: string
	name: string
}
export interface LoadedGameModel extends GameModel {
	object: Object3D
}

export interface LoadedModels {
	[property: string]: LoadedGameModel
}
class ModelLoader {
	private baseUrl: string

	private gltfLoader: GLTFLoader

	private dracoLoader: DRACOLoader

	public loadedModels: LoadedModels

	constructor(baseUrl = '') {
		this.baseUrl = baseUrl
		this.gltfLoader = new GLTFLoader()
		this.dracoLoader = new DRACOLoader()
		this.loadedModels = {}
	}

	public initialize = (): void => {
		// this.dracoLoader.setDecoderPath('/assets/draco/')
		// this.gltfLoader.setDRACOLoader(this.dracoLoader)
	}

	public loadModels = (models: GameModel[], completeCallback: (loadedModels: LoadedModels) => void): void => {
		let loadCount = 0
		models.forEach((m) => {
			this.loadModel(m, (loadedModel) => {
				this.loadedModels = {
					...this.loadedModels,
					[loadedModel.name]: loadedModel
				}
				loadCount += 1
				if (loadCount === models.length) {
					completeCallback(this.loadedModels)
				}
			})
		})
	}

	private loadModel = (gameModel: GameModel, callback: (model: LoadedGameModel) => void): void => {
		this.gltfLoader.load(`${this.baseUrl}${gameModel.path}`, (gltf) => {
			callback({
				...gameModel,
				object: gltf.scene
			})
		})
	}
}

export default ModelLoader
