import * as THREE from 'three'

export const createRaycast = (
  camera: THREE.Camera,
  world: { blocks: { mesh: THREE.Mesh }[] }
) => {
  const raycaster = new THREE.Raycaster()

  let last: THREE.Mesh | null = null

  const highlightMat = new THREE.MeshStandardMaterial({
    color: 0xffff00
  })

  const originMat = new WeakMap<THREE.Mesh, THREE.Material>()

  world.blocks.forEach(b => {
    originMat.set(b.mesh, b.mesh.material as THREE.Material)
  })

  const update = () => {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)

    const meshes = world.blocks.map(b => b.mesh)
    const hit = raycaster.intersectObjects(meshes, false)[0]

    if (last && (!hit || hit.object !== last)) {
      last.material = originMat.get(last)!
      last = null
    }

    if (hit && hit.object !== last) {
      if (last) last.material = originMat.get(last)!
      last = hit.object as THREE.Mesh
      last.material = highlightMat
    }
  }

  return { update }
}
