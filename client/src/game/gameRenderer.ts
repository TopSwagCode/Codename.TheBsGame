import Stats from 'three/examples/jsm/libs/stats.module'
import { Clock, PerspectiveCamera, Scene, sRGBEncoding, WebGLRenderer } from 'three'

export interface IUpdate {
	update: (timer: number, delta: number) => void
}
class GameRenderer {
	private camera: PerspectiveCamera

	private scene: Scene

	private container: HTMLElement

	private renderer: WebGLRenderer

	private clock: Clock

	private stats: Stats

	private fps = 60

	private lastRender = Date.now()

	private updateTargets: IUpdate[]

	constructor(container: HTMLElement, scene: Scene, camera: PerspectiveCamera) {
		this.container = container
		this.scene = scene
		this.camera = camera
		this.renderer = new WebGLRenderer({ antialias: true })
		this.clock = new Clock()
		this.updateTargets = []
		this.stats = Stats()
	}

	public initialize = (): void => {
		// init rendere

		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(window.innerWidth, window.innerHeight)

		this.renderer.outputEncoding = sRGBEncoding
		this.renderer.shadowMap.enabled = true
		// this.renderer.toneMapping = ACESFilmicToneMapping
		// this.renderer.toneMappingExposure = 0.85

		window.addEventListener('resize', this.handleWindowResize)
		this.container.appendChild(this.renderer.domElement)
		this.container.appendChild(this.stats.dom)
	}

	private handleWindowResize = (/* event: UIEvent */): void => {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	public addUpdateTarget = (updateTarget: IUpdate): void => {
		this.updateTargets = [...this.updateTargets, updateTarget]
	}

	public start = (): void => {
		requestAnimationFrame(this.renderLoop)
	}

	private renderLoop = (time: number): void => {
		const now = Date.now()
		const lastRenderDiff = now - this.lastRender
		const interval = 1000 / this.fps
		if (lastRenderDiff > interval) {
			const delta = this.clock.getDelta()
			// this.gameWorld.update(time, delta)
			this.updateTargets.forEach((updateTarget) => updateTarget.update(time, delta))
			this.stats.update()
			this.lastRender = now - (lastRenderDiff % interval)
			this.renderer.render(this.scene, this.camera)
		}
		requestAnimationFrame(this.renderLoop)
	}
}
export default GameRenderer
