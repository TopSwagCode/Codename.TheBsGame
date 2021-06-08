import { Intersection, Object3D, Raycaster, Scene } from 'three'
import { IGameObject } from './gameObjects/gameObject'
import { ICordinates, IGameObjectWorldData } from './gameObjects/gameObjectWorldData'
import { IUpdate } from './gameRenderer'
import WorldEnviroment, { WorldEnviromentDebugEnum } from './worldEnviroment'

class GameWorld implements IUpdate {
	private setGameObjectWorldDataListeners: {
		type: keyof IGameObjectWorldData
		handler: (id: string, data: IGameObjectWorldData) => void
	}[]

	private scene: Scene

	public gameObjects: IGameObject[]

	private worldEnviroment: WorldEnviroment

	constructor(scene: Scene) {
		this.setGameObjectWorldDataListeners = []
		this.scene = scene
		this.worldEnviroment = new WorldEnviroment(scene)
		this.gameObjects = []
	}

	public initialize = (): void => {
		this.worldEnviroment.setDebug(WorldEnviromentDebugEnum.ShowMediumGrid, WorldEnviromentDebugEnum.ShowLargeGrid)
		this.worldEnviroment.initialize()
	}

	public update = (time: number, delta: number): void => {
		this.gameObjects.forEach((gm) => gm.update(time, delta))
	}

	public addGameObject = (gameObject: IGameObject): void => {
		this.scene.add(gameObject.model)
		this.gameObjects = [...this.gameObjects, gameObject]
	}

	public addSetGameObjectWorldDataListener = (prop: keyof IGameObjectWorldData, handler: (id: string, data: IGameObjectWorldData) => void): void => {
		this.setGameObjectWorldDataListeners = [...this.setGameObjectWorldDataListeners, { type: prop, handler }]
	}

	private notifySetGameObjectWorldDataListener = <K extends keyof IGameObjectWorldData>(id: string, prop: K, data: IGameObjectWorldData): void => {
		this.setGameObjectWorldDataListeners
			.filter((li) => li.type === prop)
			.forEach((li) => {
				li.handler(id, data)
			})
	}

	public setGameObjectWorldData = <K extends keyof IGameObjectWorldData>(id: string, prop: K, value: IGameObjectWorldData[K]): void => {
		this.gameObjects
			.filter((x) => x.key === id)
			.forEach((g) => {
				const gameObject = g
				const changed = !this.shallowEqual(gameObject.worldData[prop], value)
				if (changed) {
					gameObject.worldData[prop] = value
					this.notifySetGameObjectWorldDataListener(id, prop, gameObject.worldData)
				}
			})
	}

	private shallowEqual = <T>(object1: T, object2: T): boolean => {
		const keys1 = Object.keys(object1)
		const keys2 = Object.keys(object2)

		if (keys1.length !== keys2.length) {
			return false
		}
		if (keys1.filter((k) => object1[k as keyof T] !== object2[k as keyof T]).length > 0) {
			return false
		}

		return true
	}

	public setSelectedGameObjectsWorldData = <K extends keyof IGameObjectWorldData>(prop: K, value: IGameObjectWorldData[K]): void => {
		this.forEachSelectedGameObject((go) => {
			this.setGameObjectWorldData(go.key, prop, value)
		})
	}

	private forEachSelectedGameObject = (callback: (gameObject: IGameObject, index: number, all: IGameObject[]) => void): void => {
		this.gameObjects.filter((x) => x.worldData.selected).forEach(callback)
	}

	public setSelectedGameObjectsDestination = (destination: ICordinates): void => {
		this.forEachSelectedGameObject((go) => {
			this.setGameObjectWorldData(go.key, 'destination', {
				...go.worldData.destination,
				x: destination.x,
				z: destination.z
			})
		})
	}

	public getSceneIntersection = (raycaster: Raycaster): Intersection[] => {
		return raycaster.intersectObject(this.scene, true)
	}

	public getGameObjectIntersection = (raycaster: Raycaster): IGameObject | null => {
		const intersects = raycaster.intersectObjects(
			this.gameObjects.map((go) => go.model),
			true
		)
		let intersectedModel: IGameObject | null = null
		intersects.forEach((intersection): void => {
			const gameModel = this.getGameObjectRoot(intersection.object)
			if (!intersectedModel && gameModel) {
				intersectedModel = gameModel
			}
		})

		return intersectedModel
	}

	public hoverGameObject = (gameObject: IGameObject | null = null): void => {
		this.gameObjects
			.filter((x) => x.worldData.highlighted || (gameObject !== null && x.key === gameObject.key))
			.forEach((go) => {
				const { worldData } = go
				if (gameObject !== null && go.key === gameObject.key) {
					worldData.highlighted = true
				} else {
					worldData.highlighted = false
				}
			})
	}

	public selectGameObject = (gameObject: IGameObject | null = null, removeExsistingSelection: boolean): void => {
		this.gameObjects
			.filter((x) => x.worldData.selected || (gameObject !== null && x.key === gameObject.key))
			.forEach((go) => {
				const { worldData } = go
				if (gameObject !== null && go.key === gameObject.key) {
					worldData.selected = true
				} else if (removeExsistingSelection) {
					worldData.selected = false
				}
			})
	}

	private getGameObjectByKey = (key: string): IGameObject | null => {
		const objects = this.gameObjects.filter((gm) => gm.key === key)
		if (objects.length > 0) return objects[0]
		return null
	}

	private getGameObjectRoot = (object: Object3D): IGameObject | null => {
		if (object.userData.gameObjectKey) {
			return this.getGameObjectByKey(object.userData.gameObjectKey)
		}
		if (object.parent) {
			return this.getGameObjectRoot(object.parent)
		}
		return null
	}
}

export default GameWorld
