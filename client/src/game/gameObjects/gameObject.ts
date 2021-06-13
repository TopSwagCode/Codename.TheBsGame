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

	// protected renderedWorldData: IGameObjectWorldData

	constructor(key: string, model: Object3D, worldData: IGameObjectWorldData | undefined = undefined) {
		this.key = key
		if (worldData) {
			this.worldData = worldData
		} else {
			this.worldData = new GameObjectWorldData()
		}

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
		textLabel.position.set(0, 13, 0)

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
		const circle = this.selectedCircleMesh
		const color = circle.material.color.getHex()
		let targetColor = color

		if (event === 'highlighted') {
			targetColor = 0x333333
		} else if (event === 'selected') {
			targetColor = 0x336699
		}
		if (circle.visible !== show || targetColor !== color) {
			circle.visible = show
			circle.material.color.setHex(targetColor)
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public update(time: number, delta: number): void {
		if (!this.worldData.isAnyDirty) {
			return
		}
		const { position, selected, rotation, highlighted, isDirty, clearDirty } = this.worldData
		if (isDirty.position) {
			this.model.position.x = position.x
			this.model.position.y = position.y
			this.model.position.z = position.z
		}
		if (isDirty.rotation) {
			this.model.rotation.x = rotation.x
			this.model.rotation.y = rotation.y
			this.model.rotation.z = rotation.z
		}
		if (isDirty.selected || isDirty.highlighted) {
			this.circle(selected, 'selected')
			if (!selected) {
				this.circle(highlighted, 'highlighted')
			}
		}
		if (this.lastTextUpdate + 100 <= time || this.lastTextUpdate === 0) {
			const { x, z } = position
			const timeStr = Math.round(time).toString()
			let xStr = x.toFixed(2).toString()
			let zStr = z.toFixed(2).toString()
			if (x > 0) {
				xStr = `&nbsp;${xStr}`
			}
			if (z > 0) {
				zStr = `&nbsp;${zStr}`
			}
			this.textContainer.innerHTML = `x: ${xStr} <br />z: ${zStr}<br />update: ${timeStr}<br />`
			this.lastTextUpdate = time
		}
		clearDirty()
	}
}
export default GameObject
