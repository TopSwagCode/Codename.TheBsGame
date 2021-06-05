import { BufferGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, RingGeometry } from 'three'
import GameObjectWorldData, { IGameObjectWorldData } from './gameObjectWorldData'

export interface IGameObject {
	worldData: IGameObjectWorldData
	model: Object3D
	key: string
	update: (time: number, delta: number) => void
}
class GameObject implements IGameObject {
	public key: string

	public model: Object3D

	public selectedCircleMesh: Mesh

	public worldData: IGameObjectWorldData

	protected renderedWorldData: IGameObjectWorldData

	constructor(key: string, model: Object3D, worldData: IGameObjectWorldData = new GameObjectWorldData()) {
		this.key = key
		this.worldData = worldData
		this.renderedWorldData = new GameObjectWorldData()

		const geometry = new RingGeometry(3.5, 3.6, 32)
		const material = new MeshBasicMaterial({ color: 0x3336699 })
		this.selectedCircleMesh = new Mesh(geometry, material)
		this.selectedCircleMesh.rotation.x = -Math.PI / 2
		this.selectedCircleMesh.position.y = 0
		this.selectedCircleMesh.visible = this.worldData.selected
		const newGroup = new Group()
		newGroup.add(this.selectedCircleMesh)
		newGroup.add(model)
		newGroup.userData = {
			gameObjectKey: key
		}
		this.model = newGroup
	}

	private setOpacity = (opacity: number): void => {
		this.model.traverse((m) => {
			const mesh = m as Mesh<BufferGeometry, MeshStandardMaterial>
			if (mesh.isMesh) {
				if (mesh.material.isMaterial && mesh.material.opacity !== opacity) {
					mesh.material.opacity = opacity
					mesh.material.transparent = true
				}
			}
		})
	}

	protected updateDataBase =
		<T>() =>
		<K extends keyof T>(source: T, dest: T, prop: K, updateCallback: ((value: T[K]) => void) | undefined = undefined): void => {
			const destProp = dest[prop]
			if (destProp !== source[prop]) {
				if (updateCallback) updateCallback(source[prop])
			}
		}

	protected updateData =
		<T extends unknown>() =>
		<K extends keyof T>(prop: K, updateCallback: ((value: T[K]) => void) | undefined = undefined): void => {
			const worldData = this.worldData as T
			const renderedWorldData = this.renderedWorldData as T
			this.updateDataBase<T>()(worldData, renderedWorldData, prop, (newValue) => {
				if (updateCallback) updateCallback(newValue)
				renderedWorldData[prop] = newValue
			})
		}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public update(time: number, delta: number): void {
		const updateData = this.updateData<IGameObjectWorldData>()
		updateData('scale', (scale) => {
			this.model.scale.setScalar(scale)
		})
		updateData('position', (newPosition) => {
			this.model.position.x = newPosition.x
			this.model.position.y = newPosition.y
			this.model.position.z = newPosition.z
		})

		updateData('selected', (newSelection) => {
			this.selectedCircleMesh.visible = newSelection
		})
		updateData('rotation', (newRotation) => {
			this.model.rotation.x = newRotation.x
			this.model.rotation.y = newRotation.y
			this.model.rotation.z = newRotation.z
		})
		updateData('highlighted', (newHighlighted) => {
			if (newHighlighted) {
				this.setOpacity(0.7)
				this.selectedCircleMesh.visible = newHighlighted
			} else {
				this.selectedCircleMesh.visible = this.worldData.selected
				this.setOpacity(1)
			}
		})
	}
}
export default GameObject
