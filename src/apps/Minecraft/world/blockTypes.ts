import * as THREE from 'three'

export type BlockTypeId =
  | 'grass'
  | 'dirt'
  | 'stone'

export type BlockType = {
  id: BlockTypeId

  // 这个方块用什么材质
  material: THREE.Material
}

const grass = new THREE.MeshStandardMaterial({
  color: 0x55aa55
})

const dirt = new THREE.MeshStandardMaterial({
  color: 0x8b5a2b
})

const stone = new THREE.MeshStandardMaterial({
  color: 0x888888
})

export const blockTypes: Record<BlockTypeId, BlockType> = {
  grass: { id: 'grass', material: grass },
  dirt: { id: 'dirt', material: dirt },
  stone: { id: 'stone', material: stone }
}
