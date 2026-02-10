import * as THREE from 'three'
import { createWorld } from './world'
import { createPlayer } from './player'
import { createRaycast } from './raycast'

export const createEngine = (root: HTMLDivElement) => {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(
    70,
    root.clientWidth / root.clientHeight,
    0.1,
    1000
  )

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(root.clientWidth, root.clientHeight)
  root.appendChild(renderer.domElement)

  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(10, 20, 10)
  scene.add(light)

  const ambient = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambient)

  const world = createWorld(scene)
  const player = createPlayer(camera, renderer.domElement)
  const raycast = createRaycast(camera, world)

  let running = true

  const loop = () => {
    if (!running) return

    player.update()
    raycast.update()

    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }

  loop()

  // --------------------------------------------------
  // 只改这里：监听 root 容器尺寸变化
  // 而不是监听 window.resize
  // --------------------------------------------------

  const resize = () => {
    const w = root.clientWidth
    const h = root.clientHeight

    if (w === 0 || h === 0) return

    camera.aspect = w / h
    camera.updateProjectionMatrix()

    // 第三个参数不传，保持你原来的行为
    renderer.setSize(w, h)
  }

  // 初始化同步一次
  resize()

  const observer = new ResizeObserver(() => {
    resize()
  })

  observer.observe(root)

  return () => {
    running = false

    observer.disconnect()

    root.removeChild(renderer.domElement)
    renderer.dispose()
    world.dispose()
  }
}
