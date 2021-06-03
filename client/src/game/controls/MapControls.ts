import { MOUSE, PerspectiveCamera, TOUCH } from 'three'
import OrbitControls from './OrbitControls'

class MapControls extends OrbitControls {
	constructor(camera: PerspectiveCamera, domElement: HTMLElement) {
		super(camera, domElement)

		this.screenSpacePanning = false // pan orthogonal to world-space direction camera.up

		this.mouseButtons.LEFT = MOUSE.PAN
		this.mouseButtons.RIGHT = MOUSE.ROTATE

		this.touches.ONE = TOUCH.PAN
		this.touches.TWO = TOUCH.DOLLY_ROTATE
	}
}
export default MapControls
