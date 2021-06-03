import { AmbientLight, Color, DirectionalLight, Fog, GridHelper, LineBasicMaterial, Mesh, MeshLambertMaterial, PlaneGeometry, RepeatWrapping, Scene, sRGBEncoding, TextureLoader } from 'three'

export enum WorldEnviromentDebugEnum {
	ShowSmallGrid,
	ShowMediumGrid,
	ShowLargeGrid
}
class WorldEnviroment {
	private scene: Scene

	private debugOptions: { [key in keyof typeof WorldEnviromentDebugEnum]?: boolean }

	constructor(scene: Scene) {
		this.scene = scene
		this.debugOptions = {}
	}

	public initialize = (): void => {
		// lights
		const ambientLight = new AmbientLight(0x666666, 0.6)
		this.scene.add(ambientLight)

		const light = new DirectionalLight(0xdfebff, 0.7)
		light.position.set(500, 800, 500)

		light.castShadow = true
		light.shadow.bias = -0.0001
		light.shadow.mapSize.width = 10000
		light.shadow.mapSize.height = 10000

		const d = 500

		light.shadow.camera.left = -d
		light.shadow.camera.right = d
		light.shadow.camera.top = d
		light.shadow.camera.bottom = -d

		// light.shadow.camera.near = 10
		light.shadow.camera.far = 2000

		this.scene.add(light)

		// ground
		const textureLoader = new TextureLoader()
		const groundTexture = textureLoader.load('assets/textures/terrain/grasslight-big.jpg')

		groundTexture.wrapS = RepeatWrapping
		groundTexture.wrapT = RepeatWrapping
		groundTexture.repeat.set(200, 200)
		groundTexture.anisotropy = 16
		groundTexture.encoding = sRGBEncoding

		const groundMaterial = new MeshLambertMaterial({ map: groundTexture })
		const groundMesh = new Mesh(new PlaneGeometry(1000, 1000), groundMaterial)

		groundMesh.rotation.x = -Math.PI / 2
		groundMesh.receiveShadow = true
		this.scene.add(groundMesh)

		// sky and fog
		this.scene.background = new Color(0xcce0ff)
		this.scene.fog = new Fog(0xcce0ff, 75, 150)

		// this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture
		// this.scene.fog = new THREE.Fog(0xcccccc, 10, 50)
		this.initializeDebug()
	}

	public setDebug = (...debug: WorldEnviromentDebugEnum[]): void => {
		debug.forEach((d) => {
			this.debugOptions = {
				...this.debugOptions,
				[WorldEnviromentDebugEnum[d]]: true
			}
		})
	}

	private initializeDebug = (): void => {
		if (this.debugOptions.ShowSmallGrid) {
			const smallGrid = new GridHelper(1000, 1000, 0xcccccc, 0xcccccc)
			this.scene.add(smallGrid)
		}

		if (this.debugOptions.ShowMediumGrid) {
			const mediumGrid = new GridHelper(1000, 100, 0x333333, 0x333333)
			const mediumGridMaterial = mediumGrid.material as LineBasicMaterial
			mediumGridMaterial.linewidth = 3
			this.scene.add(mediumGrid)
		}

		if (this.debugOptions.ShowLargeGrid) {
			const largeGrid = new GridHelper(1000, 10, 0x999999, 0x999999)
			const largeGridMaterial = largeGrid.material as LineBasicMaterial
			largeGridMaterial.linewidth = 5
			this.scene.add(largeGrid)
		}
	}
}

export default WorldEnviroment
