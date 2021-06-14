import { Material, Mesh, Object3D } from 'three'

class Object3DHelper {
	public static cloneObject3D = (object: Object3D, recursive = true, cloneMaterials = false): Object3D => {
		const newObject = object.clone(true)
		if (recursive) {
			newObject.traverse((m) => {
				const mesh = m as Mesh
				if (mesh.isMesh && cloneMaterials) {
					mesh.material = Object3DHelper.cloneMaterial(mesh.material)
				}
			})
		}
		return newObject
	}

	public static setShadows = (object: Object3D, castShadow = true, receiveShadow = true): Object3D => {
		object.traverse((m) => {
			const mesh = m as Mesh
			mesh.castShadow = castShadow
			mesh.receiveShadow = receiveShadow
		})
		return object
	}

	public static cloneMaterial = (material: Material | Material[]): Material | Material[] => {
		let newMaterial = material
		if (Array.isArray(newMaterial)) {
			newMaterial = newMaterial.filter((im) => im.isMaterial).map((m) => m.clone())
		} else if (newMaterial.isMaterial) {
			newMaterial = newMaterial.clone()
		}
		return newMaterial
	}
}
export default Object3DHelper
