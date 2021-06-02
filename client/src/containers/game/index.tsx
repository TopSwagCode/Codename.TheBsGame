import React, { PureComponent } from 'react'

import * as THREE from 'three'
import { Object3D } from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { MapControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'

interface Unit {
	position: number[]
	// unit_type: UnitType,
	id: string
}

interface GameState {
	[unitId: string]: Unit
}

interface ConnectResponse {
	url: string
}

type CreateUnitMessage = {
	CreatUnit: { position: number[] }
}

type SetUnitMessage = {
	SetUnit: { position: number[]; id: string }
}

type WebsocketMessage = CreateUnitMessage | SetUnitMessage

class GameContainer extends PureComponent<Record<string, never>> {
	private initialized = false

	private gameContainer: HTMLDivElement | null | undefined

	private renderer: THREE.WebGLRenderer

	private camera: THREE.PerspectiveCamera

	private controls: MapControls | undefined

	private scene: THREE.Scene

	private grid: THREE.GridHelper

	private well: Object3D | undefined

	private tower: Object3D | undefined

	private socket: WebSocket | undefined

	private clock: THREE.Clock

	private stats: Stats

	private loader: GLTFLoader

	private lastAnimationLog = 0

	private fps = 60

	private lastRender = Date.now()

	constructor(props: Record<string, never>) {
		super(props)
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200)
		this.scene = new THREE.Scene()
		this.grid = new THREE.GridHelper(1000, 1000, 0x333333, 0x333333)
		this.clock = new THREE.Clock()
		this.stats = Stats()
		this.loader = new GLTFLoader()
	}

	componentDidMount(): void {
		this.initGame()
		window.addEventListener('resize', this.handleWindowResize)
		this.fetchInitialGameState()
		this.connectToWebsocket()
	}

	componentWillUnmount(): void {
		window.removeEventListener('resize', this.handleWindowResize)
	}

	// eslint-disable-next-line no-console
	log = (message?: unknown, ...optionalParams: unknown[]): void => console.log(message, optionalParams)

	handleWindowResize = (/* event: UIEvent */): void => {
		this.log('resize')
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	connectToWebsocket = (): void => {
		fetch('http://localhost:8000/register', {
			method: 'POST',
			mode: 'cors',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ user_id: 1 })
		})
			.then((r) => r.json())
			.then((r: ConnectResponse) => r.url)
			.then((url) => {
				const socket = new WebSocket(url)
				socket.onopen = (e) => {
					this.socket = socket
					socket.onmessage = this.onMessageRecived
				}
			})
	}

	onMessageRecived = (e: MessageEvent<any>): void => {
		const msg: WebsocketMessage = JSON.parse(e.data)
		if ((msg as CreateUnitMessage).CreatUnit) {
			const createUnit = (msg as CreateUnitMessage).CreatUnit
			this.loadModel('/models/tower/scene.gltf', createUnit.position[0], 0, createUnit.position[1], 0.01, (model) => {
				this.tower = model
				this.scene.add(this.tower)
			})
		}
	}

	fetchInitialGameState = (): void => {
		fetch('http://localhost:8000/game')
			.then((response) => response.json())
			.then(this.loadGameState)
	}

	loadGameState = (gameState: GameState): void => {
		Object.values(gameState).forEach((unit) => {
			this.loadModel('/models/tower/scene.gltf', unit.position[0], 0, unit.position[1], 0.01, (model) => {
				this.tower = model
				this.scene.add(this.tower)
			})
		})
	}

	initGame = (): void => {
		if (this.gameContainer && !this.initialized) {
			this.log('initGame')
			// init rendere
			this.renderer.setPixelRatio(window.devicePixelRatio)
			this.renderer.setSize(window.innerWidth, window.innerHeight)
			this.renderer.setAnimationLoop(this.renderLoop)
			this.renderer.outputEncoding = THREE.sRGBEncoding
			this.renderer.toneMapping = THREE.ACESFilmicToneMapping
			this.renderer.toneMappingExposure = 0.85
			// init camera
			this.camera.position.set(14, 14, -13)
			this.camera.rotation.set(-2.5, 0.5, 2.5)

			// init controls
			this.controls = new MapControls(this.camera, this.gameContainer)
			this.controls.screenSpacePanning = false
			this.controls.minDistance = 5
			this.controls.maxDistance = 30
			this.controls.maxPolarAngle = Math.PI / 3

			// this.controls.target.set(0, 0, 0)
			this.controls.update()

			const pmremGenerator = new THREE.PMREMGenerator(this.renderer)

			this.scene.background = new THREE.Color(0xeeeeee)
			this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture
			// this.scene.fog = new THREE.Fog(0xcccccc, 10, 50)
			this.scene.fog = new THREE.Fog(0x333333, 10, 50)

			// this.grid.material = {
			// 	opacity: 0.1,
			// 	depthWrite: false,
			// 	transparent: true
			// } as THREE.Material
			this.scene.add(this.grid)
			// loader
			const dracoLoader = new DRACOLoader()
			dracoLoader.setDecoderPath('/examples/js/libs/draco/')
			this.loader.setDRACOLoader(dracoLoader)
			this.loadModels()
			this.initialized = true

			this.gameContainer.appendChild(this.renderer.domElement)
			this.gameContainer.appendChild(this.stats.dom)
		}
		// this.animationLoop();
		// requestAnimationFrame(this.animationLoop)
	}

	loadModels = (): void => {
		// materials

		// const bodyMaterial = new THREE.MeshPhysicalMaterial({
		// 	color: 0xff0000,
		// 	metalness: 0.6,
		// 	roughness: 0.4,
		// 	clearcoat: 0.05,
		// 	clearcoatRoughness: 0.05
		// })

		// const detailsMaterial = new THREE.MeshStandardMaterial({
		// 	color: 0xffffff,
		// 	metalness: 1.0,
		// 	roughness: 0.5
		// })

		// const glassMaterial = new THREE.MeshPhysicalMaterial({
		// 	color: 0xffffff,
		// 	metalness: 0,
		// 	roughness: 0.1,
		// 	transmission: 0.9,
		// 	transparent: true
		// })

		// Car

		// const shadow = new THREE.TextureLoader().load('/models/ferrari_ao.png')
		// const dracoLoader = new THREE.DRACOLoader()
		// const dracoLoader = new DRACOLoader()
		// dracoLoader.setDecoderPath('')

		// loader.load('/models/buildings/scene.gltf', (gltf) => {
		// 	gltf.scene.scale.setX(0.03)
		// 	gltf.scene.scale.setY(0.03)
		// 	gltf.scene.scale.setZ(0.03)
		// 	gltf.scene.position.setY(1)
		// 	this.scene.add(gltf.scene)
		// })
		this.loadModel('/models/buildings/scene.gltf', 0, 1, 0, 0.03, (model) => {
			this.scene.add(model)
		})
		this.loadModel('/models/tower/scene.gltf', 10, 1, 0, 0.01, (model) => {
			this.tower = model
			this.scene.add(this.tower)
		})
		this.loadModel('/models/well/scene.gltf', 0, 1, 5, 0.1, (model) => {
			this.well = model
			this.scene.add(this.well)
		})
		// loader.load('/models/tower/scene.gltf', (gltf) => {
		// 	console.log('load tower', gltf.scene.children)
		// 	if (gltf.scene.children.length > 0) {
		// 		// const [tower] =
		// 		const [tower] = gltf.scene.children
		// 		gltf.scene.children.map((c) => console.log('tower child', c))

		// 		tower.scale.setX(0.01)
		// 		tower.scale.setY(0.01)
		// 		tower.scale.setZ(0.01)
		// 		tower.position.setX(10)
		// 		tower.position.setY(1)
		// 		this.tower = tower
		// 		this.scene.add(this.tower)
		// 	}
		// })
		// loader.load('/models/well/scene.gltf', (gltf) => {
		// 	this.well = gltf.scene
		// 	this.well.scale.setX(0.1)
		// 	this.well.scale.setY(0.1)
		// 	this.well.scale.setZ(0.1)
		// 	this.well.position.setZ(5)
		// 	this.well.position.setY(1)
		// 	this.scene.add(this.well)
		// })
		// const building = gltf.scene.children[0]
		// if (building) {
		// const body = carModel.getObjectByName('body')
		// const rimFL = carModel.getObjectByName('rim_fl')
		// const rimFR = carModel.getObjectByName('rim_fr')
		// const rimRR = carModel.getObjectByName('rim_rr')
		// const rimRL = carModel.getObjectByName('rim_rl')
		// const trim = carModel.getObjectByName('trim')
		// const glass = carModel.getObjectByName('glass')
		// body.material = bodyMaterial
		// rimFL.material = detailsMaterial
		// rimFR.material = detailsMaterial
		// rimRR.material = detailsMaterial
		// rimRL.material = detailsMaterial
		// trim.material = detailsMaterial
		// glass.material = glassMaterial
		// wheels.push(carModel.getObjectByName('wheel_fl'), carModel.getObjectByName('wheel_fr'), carModel.getObjectByName('wheel_rl'), carModel.getObjectByName('wheel_rr'))
		// shadow
		// const mesh = new THREE.Mesh(
		// 	new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
		// 	new THREE.MeshBasicMaterial({
		// 		map: shadow,
		// 		blending: THREE.MultiplyBlending,
		// 		toneMapped: false,
		// 		transparent: true
		// 	})
		// )
		// mesh.rotation.x = -Math.PI / 2
		// mesh.renderOrder = 2
		// carModel.add(mesh)
		// this.scene.add(building)
		// }
	}

	loadModel = (path: string, posX: number, posY: number, posZ: number, scale: number, callback: (model: Object3D) => void): void => {
		this.loader.load(path, (gltf) => {
			this.log('load model', gltf.scene.children)
			if (gltf.scene.children.length > 0) {
				// const [tower] =
				const [model] = gltf.scene.children
				// gltf.scene.children.map((c) => console.log('tower child', c))

				model.scale.setX(scale)
				model.scale.setY(scale)
				model.scale.setZ(scale)
				model.position.setX(posX)
				model.position.setY(posY)
				model.position.setZ(posZ)
				callback(model)
			}
		})
	}

	renderLoop = (time: number): void => {
		const now = Date.now()
		const delta = now - this.lastRender
		const interval = 1000 / this.fps
		if (delta > interval) {
			this.logInterval({
				delta,
				init: this.initialized,
				time
			})
			this.updateFrame(time)
			this.stats.update()
			this.renderer.render(this.scene, this.camera)
			this.lastRender = now - (delta % interval)
		}
	}

	logInterval = (obj: unknown): void => {
		const lastLogDelay = Date.now() - this.lastAnimationLog
		if (lastLogDelay >= 10000 || this.lastAnimationLog === 0) {
			this.log(obj)
			this.lastAnimationLog = Date.now()
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	updateFrame = (time: number): void => {
		const delta = this.clock.getDelta()
		if (this.tower) this.tower.rotation.z += delta
		if (this.well) this.well.rotation.z += delta
	}
	// initGame = (): void => {
	// 	if (this.gameContainerRef) {
	// 		const scene = new THREE.Scene()
	// 		const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

	// 		this.renderer.setSize(window.innerWidth, window.innerHeight)
	// 		this.gameContainerRef.appendChild(this.renderer.domElement)
	// 		const geometry = new THREE.BoxGeometry(1, 1, 1)
	// 		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
	// 		this.cube = new THREE.Mesh(geometry, material)
	// 		scene.add(this.cube)
	// 		camera.position.z = 5

	// 		this.animate(scene, camera)
	// 	}
	// }

	// animate = (scene: THREE.Scene, camera: THREE.PerspectiveCamera): void => {
	// 	requestAnimationFrame(() => {
	// 		this.animate(scene, camera)
	// 	})
	// 	if (this.cube) {
	// 		this.cube.rotation.x += 0.01
	// 		this.cube.rotation.y += 0.01
	// 	}
	// 	this.renderer.render(scene, camera)
	// }

	render = (): JSX.Element => {
		return (
			<div className="game">
				<div
					id="game-container"
					ref={(gameContainer): void => {
						this.gameContainer = gameContainer
					}}
				/>
			</div>
		)
	}
}

export default GameContainer
