import * as THREE from 'three'
import { type BlockTypeId, blockTypes } from "@/apps/Minecraft/world/blockTypes";

export type Block = {
  x: number
  y: number
  z: number
  id: BlockTypeId
  mesh: THREE.Mesh
}


export const createWorld = (scene: THREE.Scene) => {
  const blocks: Block[] = []

  const geo = new THREE.BoxGeometry(1, 1, 1)
  const mat = new THREE.MeshStandardMaterial({ color: 0x55aa55 })

  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      const id: BlockTypeId = 'grass'
      const mesh = new THREE.Mesh(geo, blockTypes[id].material)

      mesh.position.set(x + 0.5, 0.5, z + 0.5)
      scene.add(mesh)

      blocks.push({
        x,
        y: 0,
        z,
        id,
        mesh
      })
    }
  }

  return {
    blocks,
    dispose() {
      geo.dispose()
      mat.dispose()
    }
  }
}
