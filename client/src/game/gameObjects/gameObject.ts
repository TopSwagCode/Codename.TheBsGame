import { Group, Mesh, MeshBasicMaterial, Object3D, RingGeometry } from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
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

	public textContainer: HTMLDivElement

	public lastTextUpdate = 0

	public selectedCircleMesh: Mesh<RingGeometry, MeshBasicMaterial>

	public worldData: IGameObjectWorldData

	protected renderedWorldData: IGameObjectWorldData

	constructor(key: string, model: Object3D, worldData: IGameObjectWorldData = new GameObjectWorldData()) {
		this.key = key
		this.worldData = worldData
		this.renderedWorldData = new GameObjectWorldData()

		const geometry = new RingGeometry(3.5, 3.6, 32)
		const material = new MeshBasicMaterial({ color: 0x3336699 })
		this.selectedCircleMesh = new Mesh<RingGeometry, MeshBasicMaterial>(geometry, material)
		this.selectedCircleMesh.rotation.x = -Math.PI / 2
		this.selectedCircleMesh.position.y = 0
		this.selectedCircleMesh.visible = false

		this.textContainer = document.createElement('div')
		this.textContainer.className = 'text-label'
		this.textContainer.style.marginTop = '-1em'
		const textLabel = new CSS2DObject(this.textContainer)
		textLabel.position.set(0, 8, 0)

		const newGroup = new Group()
		newGroup.add(textLabel)
		newGroup.add(this.selectedCircleMesh)
		newGroup.add(model.clone())
		newGroup.userData = {
			gameObjectKey: key
		}
		this.model = newGroup
	}

	private circle = (show: boolean, event: 'highlighted' | 'selected'): void => {
		this.selectedCircleMesh.visible = show
		if (event === 'highlighted') this.selectedCircleMesh.material.color.setHex(0x333333)
		if (event === 'selected') this.selectedCircleMesh.material.color.setHex(0x336699)
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
		if (!this.worldData.isDirty) {
			return
		}
		const updateData = this.updateData<IGameObjectWorldData>()
		updateData('scale', (scale) => {
			this.model.scale.setScalar(scale)
		})
		updateData('position', (newPosition) => {
			this.model.position.x = newPosition.x
			this.model.position.y = newPosition.y
			this.model.position.z = newPosition.z
		})

		updateData('selected', (selected) => {
			this.circle(selected || this.worldData.highlighted, 'selected')
		})
		updateData('rotation', (newRotation) => {
			this.model.rotation.x = newRotation.x
			this.model.rotation.y = newRotation.y
			this.model.rotation.z = newRotation.z
		})
		updateData('highlighted', (highlighted) => {
			this.circle(highlighted || this.worldData.selected, 'highlighted')
		})
		if (this.lastTextUpdate + 100 <= time || this.lastTextUpdate === 0) {
			this.textContainer.innerHTML = `renderTime: ${time.toString()}<br />`
			this.lastTextUpdate = time
		}
		this.worldData.isDirty = false
	}
}
export default GameObject
