import { PerspectiveCamera, Raycaster, Vector2 } from 'three'
import { ICordinates } from '../gameObjects/gameObjectWorldData'
import GameWorld from '../gameWorld'

class WorldInteractionControls {
	private camera: PerspectiveCamera

	private container: HTMLElement

	private gameWorld: GameWorld

	constructor(container: HTMLElement, camera: PerspectiveCamera, gameWorld: GameWorld) {
		this.container = container
		this.camera = camera
		this.gameWorld = gameWorld
	}

	public initialize = (): void => {
		this.container.addEventListener('click', this.handleClick, false)
		this.container.addEventListener('contextmenu', this.handleClick, false)
		this.container.addEventListener('mousemove', this.handleMouseMove, false)
	}

	getMouseRaycaster = (event: MouseEvent): Raycaster => {
		const raycaster = new Raycaster()
		const mouse = new Vector2()
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

		raycaster.setFromCamera(mouse, this.camera)
		return raycaster
	}

	private handleMouseMove = (event: MouseEvent): void => {
		event.preventDefault()
		const raycaster = this.getMouseRaycaster(event)
		const intersecs = this.gameWorld.getGameObjectIntersection(raycaster)
		this.gameWorld.hoverGameObject(intersecs)
	}

	private handleClick = (event: MouseEvent): void => {
		event.preventDefault()
		if (event.button === 0) {
			this.handleLeftClick(event)
		}
		if (event.button === 2) {
			this.handleRightClick(event)
		}
	}

	private handleLeftClick = (event: MouseEvent): void => {
		const raycaster = this.getMouseRaycaster(event)
		const intersecs = this.gameWorld.getGameObjectIntersection(raycaster)
		this.gameWorld.selectGameObject(intersecs, true)
	}

	private handleRightClick = (event: MouseEvent): void => {
		const raycaster = this.getMouseRaycaster(event)
		const intersecs = this.gameWorld.getSceneIntersection(raycaster)
		if (intersecs && intersecs.length > 0) {
			const destination: ICordinates = {
				x: intersecs[0].point.x,
				y: intersecs[0].point.y,
				z: intersecs[0].point.z
			}
			this.gameWorld.setSelectedGameObjectsDestination(destination)
		}
	}
}

export default WorldInteractionControls
