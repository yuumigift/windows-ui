import * as THREE from 'three'

export const createPlayer = (
  camera: THREE.PerspectiveCamera,
  dom: HTMLCanvasElement
) => {
  // 初始相机位置（站在地面上方一点）
  camera.position.set(8, 4, 20)

  // 保存当前按下的键
  const key = new Set<string>()

  const onKeyDown = (e: KeyboardEvent) => {
    key.add(e.code)
  }

  const onKeyUp = (e: KeyboardEvent) => {
    key.delete(e.code)
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  // 水平角（左右看）
  let yaw = 0
  // 垂直角（上下看）
  let pitch = 0

  const onMouseMove = (e: MouseEvent) => {
    // 只有在 PointerLock 生效时才处理视角
    if (!document.pointerLockElement) return

    // 鼠标左右 → yaw
    yaw -= e.movementX * 0.002

    // 鼠标上下 → pitch
    pitch -= e.movementY * 0.002

    // 限制上下看的最大角度，防止翻过去
    const limit = Math.PI / 2
    pitch = Math.max(-limit, Math.min(limit, pitch))
  }

  // 点击画布进入第一人称锁定
  dom.addEventListener('click', () => {
    dom.requestPointerLock()
  })

  window.addEventListener('mousemove', onMouseMove)

  // 临时向量，避免每帧 new
  const forward = new THREE.Vector3()
  const right = new THREE.Vector3()

  const update = () => {
    // 用 yaw / pitch 控制相机旋转
    // 使用 YXZ 顺序，符合第一人称相机习惯
    camera.rotation.set(pitch, yaw, 0, 'YXZ')

    // 前后移动输入
    // 约定：
    //   W = 前进
    //   S = 后退
    let moveForward = 0

    if (key.has('KeyW')) moveForward += 1
    if (key.has('KeyS')) moveForward -= 1

    // 左右移动输入
    let moveRight = 0

    if (key.has('KeyD')) moveRight += 1
    if (key.has('KeyA')) moveRight -= 1

    // 得到相机当前朝向（世界坐标系）
    // 注意：
    // 这是一个单位向量，指向“镜头正前方”
    camera.getWorldDirection(forward)

    // MC 风格移动：忽略上下方向
    forward.y = 0
    forward.normalize()

    // 右方向向量（相机的 X 轴）
    right.setFromMatrixColumn(camera.matrix, 0)
    right.y = 0
    right.normalize()

    const speed = 0.08

    // 前进 / 后退
    // 这里不再做任何额外取反
    // W = 正向沿 forward 走
    camera.position.addScaledVector(forward, moveForward * speed)

    // 左右平移
    camera.position.addScaledVector(right, moveRight * speed)
  }

  return {
    update,

    dispose() {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }
}
