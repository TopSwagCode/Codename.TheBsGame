/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable no-restricted-properties */
/* eslint-disable @typescript-eslint/no-shadow */
import { EventDispatcher, Matrix4, MOUSE, PerspectiveCamera, Quaternion, Spherical, TOUCH, Vector2, Vector3 } from 'three'

const changeEvent = { type: 'change' }
const startEvent = { type: 'start' }
const endEvent = { type: 'end' }
interface IOrbitControls {
	camera: PerspectiveCamera
	domElement: HTMLElement

	// API
	enabled: boolean
	target: Vector3

	minDistance: number
	maxDistance: number

	minZoom: number
	maxZoom: number

	minPolarAngle: number
	maxPolarAngle: number

	minAzimuthAngle: number
	maxAzimuthAngle: number

	enableDamping: boolean
	dampingFactor: number

	enableZoom: boolean
	zoomSpeed: number

	enableRotate: boolean
	rotateSpeed: number

	enablePan: boolean
	panSpeed: number
	screenSpacePanning: boolean
	keyPanSpeed: number

	autoRotate: boolean
	autoRotateSpeed: number

	keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string }
	mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE }
	touches: { ONE: TOUCH; TWO: TOUCH }

	update(): boolean

	listenToKeyEvents(domElement: HTMLElement): void

	saveState(): void

	reset(): void

	dispose(): void

	getPolarAngle(): number

	getAzimuthalAngle(): number
}

class OrbitControls extends EventDispatcher implements IOrbitControls {
	camera: PerspectiveCamera

	domElement: HTMLElement

	enabled: boolean

	target: Vector3

	minDistance: number

	maxDistance: number

	minZoom: number

	maxZoom: number

	minPolarAngle: number

	maxPolarAngle: number

	minAzimuthAngle: number

	maxAzimuthAngle: number

	enableDamping: boolean

	dampingFactor: number

	enableZoom: boolean

	zoomSpeed: number

	enableRotate: boolean

	rotateSpeed: number

	enablePan: boolean

	panSpeed: number

	screenSpacePanning: boolean

	keyPanSpeed: number

	autoRotate: boolean

	autoRotateSpeed: number

	keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string }

	mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE }

	touches: { ONE: TOUCH; TWO: TOUCH }

	target0: Vector3

	position0: Vector3

	zoom0: number

	domElementKeyEvents: HTMLElement | null

	getPolarAngle: () => number

	getAzimuthalAngle: () => number

	listenToKeyEvents: (domElement: HTMLElement) => void

	saveState: () => void

	reset: () => void

	dispose: () => void

	update = (): boolean => true

	constructor(camera: PerspectiveCamera, domElement: HTMLElement) {
		super()

		if (domElement === undefined) console.warn('THREE.OrbitControls: The second parameter "domElement" is now mandatory.')

		this.camera = camera
		this.domElement = domElement

		// Set to false to disable this control
		this.enabled = true

		// "target" sets the location of focus, where the object orbits around
		this.target = new Vector3()

		// How far you can dolly in and out ( PerspectiveCamera only )
		this.minDistance = 0
		this.maxDistance = Infinity

		// How far you can zoom in and out ( OrthographicCamera only )
		this.minZoom = 0
		this.maxZoom = Infinity

		// How far you can orbit vertically, upper and lower limits.
		// Range is 0 to Math.PI radians.
		this.minPolarAngle = 0 // radians
		this.maxPolarAngle = Math.PI // radians

		// How far you can orbit horizontally, upper and lower limits.
		// If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
		this.minAzimuthAngle = -Infinity // radians
		this.maxAzimuthAngle = Infinity // radians

		// Set to true to enable damping (inertia)
		// If damping is enabled, you must call controls.update() in your animation loop
		this.enableDamping = false
		this.dampingFactor = 0.05

		// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
		// Set to false to disable zooming
		this.enableZoom = true
		this.zoomSpeed = 1.0

		// Set to false to disable rotating
		this.enableRotate = true
		this.rotateSpeed = 1.0

		// Set to false to disable panning
		this.enablePan = true
		this.panSpeed = 1.0
		this.screenSpacePanning = true // if false, pan orthogonal to world-space direction camera.up
		this.keyPanSpeed = 7.0 // pixels moved per arrow key push

		// Set to true to automatically rotate around the target
		// If auto-rotate is enabled, you must call controls.update() in your animation loop
		this.autoRotate = false
		this.autoRotateSpeed = 2.0 // 30 seconds per orbit when fps is 60

		// The four arrow keys
		this.keys = {
			LEFT: 'ArrowLeft',
			UP: 'ArrowUp',
			RIGHT: 'ArrowRight',
			BOTTOM: 'ArrowDown'
		}

		// Mouse buttons
		this.mouseButtons = {
			LEFT: MOUSE.ROTATE,
			MIDDLE: MOUSE.DOLLY,
			RIGHT: MOUSE.PAN
		}

		// Touch fingers
		this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }

		// for reset
		this.target0 = this.target.clone()
		this.position0 = this.camera.position.clone()
		this.zoom0 = this.camera.zoom

		// the target DOM element for key events
		this.domElementKeyEvents = null

		//
		// public methods
		//

		this.getPolarAngle = (): number => {
			return spherical.phi
		}

		this.getAzimuthalAngle = (): number => {
			return spherical.theta
		}

		this.listenToKeyEvents = (domElement: HTMLElement) => {
			domElement.addEventListener('keydown', onKeyDown)
			this.domElementKeyEvents = domElement
		}

		this.saveState = (): void => {
			scope.target0.copy(scope.target)
			scope.position0.copy(scope.camera.position)
			scope.zoom0 = scope.camera.zoom
		}

		this.reset = (): void => {
			scope.target.copy(scope.target0)
			scope.camera.position.copy(scope.position0)
			scope.camera.zoom = scope.zoom0

			scope.camera.updateProjectionMatrix()
			scope.dispatchEvent(changeEvent)

			scope.update()

			state = STATE.NONE
		}

		// this method is exposed, but perhaps it would be better if we can make it private...
		this.update = ((): (() => boolean) => {
			const offset = new Vector3()

			// so camera.up is the orbit axis
			const quat = new Quaternion().setFromUnitVectors(camera.up, new Vector3(0, 1, 0))
			const quatInverse = quat.clone().invert()

			const lastPosition = new Vector3()
			const lastQuaternion = new Quaternion()

			const twoPI = 2 * Math.PI

			return (): boolean => {
				const { position } = scope.camera

				offset.copy(position).sub(scope.target)

				// rotate offset to "y-axis-is-up" space
				offset.applyQuaternion(quat)

				// angle from z-axis around y-axis
				spherical.setFromVector3(offset)

				if (scope.autoRotate && state === STATE.NONE) {
					rotateLeft(getAutoRotationAngle())
				}

				if (scope.enableDamping) {
					spherical.theta += sphericalDelta.theta * scope.dampingFactor
					spherical.phi += sphericalDelta.phi * scope.dampingFactor
				} else {
					spherical.theta += sphericalDelta.theta
					spherical.phi += sphericalDelta.phi
				}

				// restrict theta to be between desired limits

				let min = scope.minAzimuthAngle
				let max = scope.maxAzimuthAngle

				if (Number.isFinite(min) && Number.isFinite(max)) {
					if (min < -Math.PI) min += twoPI
					else if (min > Math.PI) min -= twoPI

					if (max < -Math.PI) max += twoPI
					else if (max > Math.PI) max -= twoPI

					if (min <= max) {
						spherical.theta = Math.max(min, Math.min(max, spherical.theta))
					} else {
						spherical.theta = spherical.theta > (min + max) / 2 ? Math.max(min, spherical.theta) : Math.min(max, spherical.theta)
					}
				}

				// restrict phi to be between desired limits
				spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi))

				spherical.makeSafe()

				spherical.radius *= scale

				// restrict radius to be between desired limits
				spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius))

				// move target to panned location

				if (scope.enableDamping === true) {
					scope.target.addScaledVector(panOffset, scope.dampingFactor)
				} else {
					scope.target.add(panOffset)
				}

				offset.setFromSpherical(spherical)

				// rotate offset back to "camera-up-vector-is-up" space
				offset.applyQuaternion(quatInverse)

				position.copy(scope.target).add(offset)

				scope.camera.lookAt(scope.target)

				if (scope.enableDamping === true) {
					sphericalDelta.theta *= 1 - scope.dampingFactor
					sphericalDelta.phi *= 1 - scope.dampingFactor

					panOffset.multiplyScalar(1 - scope.dampingFactor)
				} else {
					sphericalDelta.set(0, 0, 0)

					panOffset.set(0, 0, 0)
				}

				scale = 1

				// update condition is:
				// min(camera displacement, camera rotation in radians)^2 > EPS
				// using small-angle approximation cos(x/2) = 1 - x^2 / 8

				if (zoomChanged || lastPosition.distanceToSquared(scope.camera.position) > EPS || 8 * (1 - lastQuaternion.dot(scope.camera.quaternion)) > EPS) {
					scope.dispatchEvent(changeEvent)

					lastPosition.copy(scope.camera.position)
					lastQuaternion.copy(scope.camera.quaternion)
					zoomChanged = false

					return true
				}

				return false
			}
		})()

		this.dispose = (): void => {
			scope.domElement.removeEventListener('contextmenu', onContextMenu)

			scope.domElement.removeEventListener('pointerdown', onPointerDown)
			scope.domElement.removeEventListener('wheel', onMouseWheel)

			scope.domElement.removeEventListener('touchstart', onTouchStart)
			scope.domElement.removeEventListener('touchend', onTouchEnd)
			scope.domElement.removeEventListener('touchmove', onTouchMove)

			scope.domElement.ownerDocument.removeEventListener('pointermove', onPointerMove)
			scope.domElement.ownerDocument.removeEventListener('pointerup', onPointerUp)

			if (scope.domElementKeyEvents !== null) {
				// eslint-disable-next-line no-underscore-dangle
				scope.domElementKeyEvents.removeEventListener('keydown', onKeyDown)
			}

			// scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?
		}

		//
		// internals
		//

		const scope = this

		const STATE = {
			NONE: -1,
			ROTATE: 0,
			DOLLY: 1,
			PAN: 2,
			TOUCH_ROTATE: 3,
			TOUCH_PAN: 4,
			TOUCH_DOLLY_PAN: 5,
			TOUCH_DOLLY_ROTATE: 6
		}

		let state = STATE.NONE

		const EPS = 0.000001

		// current position in spherical coordinates
		const spherical = new Spherical()
		const sphericalDelta = new Spherical()

		let scale = 1
		const panOffset = new Vector3()
		let zoomChanged = false

		const rotateStart = new Vector2()
		const rotateEnd = new Vector2()
		const rotateDelta = new Vector2()

		const panStart = new Vector2()
		const panEnd = new Vector2()
		const panDelta = new Vector2()

		const dollyStart = new Vector2()
		const dollyEnd = new Vector2()
		const dollyDelta = new Vector2()

		function getAutoRotationAngle(): number {
			return ((2 * Math.PI) / 60 / 60) * scope.autoRotateSpeed
		}

		function getZoomScale(): number {
			return Math.pow(0.95, scope.zoomSpeed)
		}

		function rotateLeft(angle: number): void {
			sphericalDelta.theta -= angle
		}

		function rotateUp(angle: number): void {
			sphericalDelta.phi -= angle
		}

		const panLeft = (() => {
			const v = new Vector3()

			return function panLeft(distance: number, objectMatrix: Matrix4) {
				v.setFromMatrixColumn(objectMatrix, 0) // get X column of objectMatrix
				v.multiplyScalar(-distance)

				panOffset.add(v)
			}
		})()

		const panUp = (() => {
			const v = new Vector3()

			return function panUp(distance: number, objectMatrix: Matrix4) {
				if (scope.screenSpacePanning === true) {
					v.setFromMatrixColumn(objectMatrix, 1)
				} else {
					v.setFromMatrixColumn(objectMatrix, 0)
					v.crossVectors(scope.camera.up, v)
				}

				v.multiplyScalar(distance)

				panOffset.add(v)
			}
		})()

		// deltaX and deltaY are in pixels; right and down are positive
		const pan = (() => {
			const offset = new Vector3()

			return function pan(deltaX: number, deltaY: number) {
				const element = scope.domElement

				if (scope.camera.isPerspectiveCamera) {
					// perspective
					const { position } = scope.camera
					offset.copy(position).sub(scope.target)
					let targetDistance = offset.length()

					// half of the fov is center to top of screen
					targetDistance *= Math.tan(((scope.camera.fov / 2) * Math.PI) / 180.0)

					// we use only clientHeight here so aspect ratio does not distort speed
					panLeft((2 * deltaX * targetDistance) / element.clientHeight, scope.camera.matrix)
					panUp((2 * deltaY * targetDistance) / element.clientHeight, scope.camera.matrix)
				}
				// else if (scope.camera.isOrthographicCamera) {
				// 	// isOrthographicCamera
				// 	// orthographic
				// 	panLeft((deltaX * (scope.camera.right - scope.camera.left)) / scope.camera.zoom / element.clientWidth, scope.camera.matrix)
				// 	panUp((deltaY * (scope.camera.top - scope.camera.bottom)) / scope.camera.zoom / element.clientHeight, scope.camera.matrix)
				// }
				else {
					// camera neither orthographic nor perspective
					console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.')
					scope.enablePan = false
				}
			}
		})()

		function dollyOut(dollyScale: number): void {
			if (scope.camera.isPerspectiveCamera) {
				scale /= dollyScale
			}
			//  else if (scope.camera.isOrthographicCamera) {
			// 	scope.camera.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.camera.zoom * dollyScale))
			// 	scope.camera.updateProjectionMatrix()
			// 	zoomChanged = true
			// }
			else {
				console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.')
				scope.enableZoom = false
			}
		}

		function dollyIn(dollyScale: number): void {
			if (scope.camera.isPerspectiveCamera) {
				scale *= dollyScale
			}
			// else if (scope.camera.isOrthographicCamera) {
			// 	scope.camera.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.camera.zoom / dollyScale))
			// 	scope.camera.updateProjectionMatrix()
			// 	zoomChanged = true
			// }
			else {
				console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.')
				scope.enableZoom = false
			}
		}

		//
		// event callbacks - update the object state
		//

		function handleMouseDownRotate(event: { clientX: number; clientY: number }): void {
			rotateStart.set(event.clientX, event.clientY)
		}

		function handleMouseDownDolly(event: { clientX: number; clientY: number }): void {
			dollyStart.set(event.clientX, event.clientY)
		}

		function handleMouseDownPan(event: { clientX: number; clientY: number }): void {
			panStart.set(event.clientX, event.clientY)
		}

		function handleMouseMoveRotate(event: { clientX: number; clientY: number }): void {
			rotateEnd.set(event.clientX, event.clientY)

			rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed)

			const element = scope.domElement

			rotateLeft((2 * Math.PI * rotateDelta.x) / element.clientHeight) // yes, height

			rotateUp((2 * Math.PI * rotateDelta.y) / element.clientHeight)

			rotateStart.copy(rotateEnd)

			scope.update()
		}

		function handleMouseMoveDolly(event: { clientX: number; clientY: number }): void {
			dollyEnd.set(event.clientX, event.clientY)

			dollyDelta.subVectors(dollyEnd, dollyStart)

			if (dollyDelta.y > 0) {
				dollyOut(getZoomScale())
			} else if (dollyDelta.y < 0) {
				dollyIn(getZoomScale())
			}

			dollyStart.copy(dollyEnd)

			scope.update()
		}

		function handleMouseMovePan(event: { clientX: number; clientY: number }): void {
			panEnd.set(event.clientX, event.clientY)

			panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed)

			pan(panDelta.x, panDelta.y)

			panStart.copy(panEnd)

			scope.update()
		}

		function handleMouseUp(event: MouseEvent): void {
			// no-op
		}

		function handleMouseWheel(event: { deltaY: number }): void {
			if (event.deltaY < 0) {
				dollyIn(getZoomScale())
			} else if (event.deltaY > 0) {
				dollyOut(getZoomScale())
			}

			scope.update()
		}

		function handleKeyDown(event: KeyboardEvent): void {
			let needsUpdate = false

			switch (event.code) {
				case scope.keys.UP:
					pan(0, scope.keyPanSpeed)
					needsUpdate = true
					break

				case scope.keys.BOTTOM:
					pan(0, -scope.keyPanSpeed)
					needsUpdate = true
					break

				case scope.keys.LEFT:
					pan(scope.keyPanSpeed, 0)
					needsUpdate = true
					break

				case scope.keys.RIGHT:
					pan(-scope.keyPanSpeed, 0)
					needsUpdate = true
					break
				default:
					break
			}

			if (needsUpdate) {
				// prevent the browser from scrolling on cursor keys
				event.preventDefault()

				scope.update()
			}
		}

		function handleTouchStartRotate(event: TouchEvent): void {
			if (event.touches.length === 1) {
				rotateStart.set(event.touches[0].pageX, event.touches[0].pageY)
			} else {
				const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX)
				const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY)

				rotateStart.set(x, y)
			}
		}

		function handleTouchStartPan(event: TouchEvent): void {
			if (event.touches.length === 1) {
				panStart.set(event.touches[0].pageX, event.touches[0].pageY)
			} else {
				const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX)
				const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY)

				panStart.set(x, y)
			}
		}

		function handleTouchStartDolly(event: TouchEvent): void {
			const dx = event.touches[0].pageX - event.touches[1].pageX
			const dy = event.touches[0].pageY - event.touches[1].pageY

			const distance = Math.sqrt(dx * dx + dy * dy)

			dollyStart.set(0, distance)
		}

		function handleTouchStartDollyPan(event: TouchEvent): void {
			if (scope.enableZoom) handleTouchStartDolly(event)

			if (scope.enablePan) handleTouchStartPan(event)
		}

		function handleTouchStartDollyRotate(event: TouchEvent): void {
			if (scope.enableZoom) handleTouchStartDolly(event)

			if (scope.enableRotate) handleTouchStartRotate(event)
		}

		function handleTouchMoveRotate(event: TouchEvent): void {
			if (event.touches.length === 1) {
				rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY)
			} else {
				const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX)
				const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY)

				rotateEnd.set(x, y)
			}

			rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed)

			const element = scope.domElement

			rotateLeft((2 * Math.PI * rotateDelta.x) / element.clientHeight) // yes, height

			rotateUp((2 * Math.PI * rotateDelta.y) / element.clientHeight)

			rotateStart.copy(rotateEnd)
		}

		function handleTouchMovePan(event: TouchEvent): void {
			if (event.touches.length === 1) {
				panEnd.set(event.touches[0].pageX, event.touches[0].pageY)
			} else {
				const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX)
				const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY)

				panEnd.set(x, y)
			}

			panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed)

			pan(panDelta.x, panDelta.y)

			panStart.copy(panEnd)
		}

		function handleTouchMoveDolly(event: TouchEvent): void {
			const dx = event.touches[0].pageX - event.touches[1].pageX
			const dy = event.touches[0].pageY - event.touches[1].pageY

			const distance = Math.sqrt(dx * dx + dy * dy)

			dollyEnd.set(0, distance)

			dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed))

			dollyOut(dollyDelta.y)

			dollyStart.copy(dollyEnd)
		}

		function handleTouchMoveDollyPan(event: TouchEvent): void {
			if (scope.enableZoom) handleTouchMoveDolly(event)

			if (scope.enablePan) handleTouchMovePan(event)
		}

		function handleTouchMoveDollyRotate(event: TouchEvent): void {
			if (scope.enableZoom) handleTouchMoveDolly(event)

			if (scope.enableRotate) handleTouchMoveRotate(event)
		}

		function handleTouchEnd(event: TouchEvent): void {
			// no-op
		}

		//
		// event handlers - FSM: listen for events and reset state
		//

		function onPointerDown(event: PointerEvent): void {
			if (scope.enabled === false) return

			switch (event.pointerType) {
				case 'mouse':
				case 'pen':
					onMouseDown(event)
					break
				default:
					break
				// TODO touch
			}
		}

		function onPointerMove(event: PointerEvent): void {
			if (scope.enabled === false) return

			switch (event.pointerType) {
				case 'mouse':
				case 'pen':
					onMouseMove(event)
					break
				default:
					break
				// TODO touch
			}
		}

		function onPointerUp(event: PointerEvent): void {
			switch (event.pointerType) {
				case 'mouse':
				case 'pen':
					onMouseUp(event)
					break
				default:
					break

				// TODO touch
			}
		}

		function onMouseDown(event: MouseEvent): void {
			// Prevent the browser from scrolling.
			event.preventDefault()

			// Manually set the focus since calling preventDefault above
			// prevents the browser from setting it automatically.

			if (scope.domElement.focus) {
				scope.domElement.focus()
			} else {
				window.focus()
			}

			let mouseAction

			switch (event.button) {
				case 0:
					mouseAction = scope.mouseButtons.LEFT
					break

				case 1:
					mouseAction = scope.mouseButtons.MIDDLE
					break

				case 2:
					mouseAction = scope.mouseButtons.RIGHT
					break

				default:
					mouseAction = -1
			}

			switch (mouseAction) {
				case MOUSE.DOLLY:
					if (scope.enableZoom === false) return

					handleMouseDownDolly(event)

					state = STATE.DOLLY

					break

				case MOUSE.ROTATE:
					if (event.ctrlKey || event.metaKey || event.shiftKey) {
						if (scope.enablePan === false) return

						handleMouseDownPan(event)

						state = STATE.PAN
					} else {
						if (scope.enableRotate === false) return

						handleMouseDownRotate(event)

						state = STATE.ROTATE
					}

					break

				case MOUSE.PAN:
					if (event.ctrlKey || event.metaKey || event.shiftKey) {
						if (scope.enableRotate === false) return

						handleMouseDownRotate(event)

						state = STATE.ROTATE
					} else {
						if (scope.enablePan === false) return

						handleMouseDownPan(event)

						state = STATE.PAN
					}

					break

				default:
					state = STATE.NONE
			}

			if (state !== STATE.NONE) {
				scope.domElement.ownerDocument.addEventListener('pointermove', onPointerMove)
				scope.domElement.ownerDocument.addEventListener('pointerup', onPointerUp)

				scope.dispatchEvent(startEvent)
			}
		}

		function onMouseMove(event: MouseEvent): void {
			if (scope.enabled === false) return

			event.preventDefault()

			switch (state) {
				case STATE.ROTATE:
					if (scope.enableRotate === false) return

					handleMouseMoveRotate(event)

					break

				case STATE.DOLLY:
					if (scope.enableZoom === false) return

					handleMouseMoveDolly(event)

					break

				case STATE.PAN:
					if (scope.enablePan === false) return

					handleMouseMovePan(event)

					break

				default:
					break
			}
		}

		function onMouseUp(event: MouseEvent): void {
			scope.domElement.ownerDocument.removeEventListener('pointermove', onPointerMove)
			scope.domElement.ownerDocument.removeEventListener('pointerup', onPointerUp)

			if (scope.enabled === false) return

			handleMouseUp(event)

			scope.dispatchEvent(endEvent)

			state = STATE.NONE
		}

		function onMouseWheel(event: WheelEvent): void {
			if (scope.enabled === false || scope.enableZoom === false || (state !== STATE.NONE && state !== STATE.ROTATE)) return

			event.preventDefault()

			scope.dispatchEvent(startEvent)

			handleMouseWheel(event)

			scope.dispatchEvent(endEvent)
		}

		function onKeyDown(event: KeyboardEvent): void {
			if (scope.enabled === false || scope.enablePan === false) return

			handleKeyDown(event)
		}

		function onTouchStart(event: TouchEvent): void {
			if (scope.enabled === false) return

			event.preventDefault() // prevent scrolling

			switch (event.touches.length) {
				case 1:
					switch (scope.touches.ONE) {
						case TOUCH.ROTATE:
							if (scope.enableRotate === false) return

							handleTouchStartRotate(event)

							state = STATE.TOUCH_ROTATE

							break

						case TOUCH.PAN:
							if (scope.enablePan === false) return

							handleTouchStartPan(event)

							state = STATE.TOUCH_PAN

							break

						default:
							state = STATE.NONE
					}

					break

				case 2:
					switch (scope.touches.TWO) {
						case TOUCH.DOLLY_PAN:
							if (scope.enableZoom === false && scope.enablePan === false) return

							handleTouchStartDollyPan(event)

							state = STATE.TOUCH_DOLLY_PAN

							break

						case TOUCH.DOLLY_ROTATE:
							if (scope.enableZoom === false && scope.enableRotate === false) return

							handleTouchStartDollyRotate(event)

							state = STATE.TOUCH_DOLLY_ROTATE

							break

						default:
							state = STATE.NONE
					}

					break

				default:
					state = STATE.NONE
			}

			if (state !== STATE.NONE) {
				scope.dispatchEvent(startEvent)
			}
		}

		function onTouchMove(event: TouchEvent): void {
			if (scope.enabled === false) return

			event.preventDefault() // prevent scrolling

			switch (state) {
				case STATE.TOUCH_ROTATE:
					if (scope.enableRotate === false) return

					handleTouchMoveRotate(event)

					scope.update()

					break

				case STATE.TOUCH_PAN:
					if (scope.enablePan === false) return

					handleTouchMovePan(event)

					scope.update()

					break

				case STATE.TOUCH_DOLLY_PAN:
					if (scope.enableZoom === false && scope.enablePan === false) return

					handleTouchMoveDollyPan(event)

					scope.update()

					break

				case STATE.TOUCH_DOLLY_ROTATE:
					if (scope.enableZoom === false && scope.enableRotate === false) return

					handleTouchMoveDollyRotate(event)

					scope.update()

					break

				default:
					state = STATE.NONE
			}
		}

		function onTouchEnd(event: TouchEvent): void {
			if (scope.enabled === false) return

			handleTouchEnd(event)

			scope.dispatchEvent(endEvent)

			state = STATE.NONE
		}

		function onContextMenu(event: MouseEvent): void {
			if (scope.enabled === false) return

			event.preventDefault()
		}

		//

		scope.domElement.addEventListener('contextmenu', onContextMenu)

		scope.domElement.addEventListener('pointerdown', onPointerDown)
		scope.domElement.addEventListener('wheel', onMouseWheel, {
			passive: false
		})

		scope.domElement.addEventListener('touchstart', onTouchStart, {
			passive: false
		})
		scope.domElement.addEventListener('touchend', onTouchEnd)
		scope.domElement.addEventListener('touchmove', onTouchMove, {
			passive: false
		})

		// force an update at start

		this.update()
	}
}

export default OrbitControls
