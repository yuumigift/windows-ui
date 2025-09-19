import { EntityScript } from "@/gameScript/scripts/entityscript";
import { Toward } from "@/gameScript/scripts/utils/MapEnum";
import { AllActivePrefabs } from "@/gameScript/scripts/main";
import { isEqual } from "lodash";

export namespace AdventurePhysical {
  export const GRAVITY = -9.8;

  export class Physical {
    inst: ReturnType<typeof EntityScript>;

    public XPOWER: number = 5;

    private _velocityX: number = 0;
    private _velocityY: number = 0;

    public playerJumpPower: number = 400;

    // 摩擦力系数
    private _frictionCoefficient: number = 0.05;
    //位置
    public pos = reactive({ x: 0, y: 0 });
    private lastTime: number = -1;

    public toward: any = {
      LEFT: false,
      RIGHT: false,
      UP: false,
      DOWN: false
    };

    private savePos() {
      this.SetPosition(Math.max(0, this.pos.x), Math.max(0, this.pos.y));
    }

    get frictionCoefficient(): number {
      return this._frictionCoefficient;
    }

    set frictionCoefficient(value: number) {
      this._frictionCoefficient = value;
    }

    // 碰撞检测
    public checkCollision(): void {
      const inst = this.inst;
      const pos = this.pos;

      watch(() => pos, (value, oldValue, onCleanup) => {
        // 假设有一个碰撞检测逻辑，这里只是一个示例
        // 如果发生碰撞，可以根据具体情况更新物体的速度或位置
        //如果新值和旧值相同 则直接return
        if (isEqual(value, oldValue)) return
        if (value.x < 0 || value.x + inst.width > 800) {
          this._velocityX = 0;
          this.pos.x = 720;
        }
        if (value.y <= 0 || value.y + inst.height > 600) {
          if (this._velocityY > 0) {
            this._velocityY = 0;
          }
        }

      }, { deep: true });

    }
    /**
     * Checks if the current entity is colliding with any other entities in the `AllActivePrefabs` list.
     * @returns An object containing collision information:
     * - `xColliding`: A boolean indicating if there is a collision along the X-axis.
     * - `yColliding`: A boolean indicating if there is a collision along the Y-axis.
     * - `collisionSide`: An optional object specifying on which side the collision occurred. It can have properties `x` (with values 'left' or 'right') and `y` (with values 'top' or 'bottom').
     * - `collidedEntityX`: The entity with which a collision occurred along the X-axis, if any.
     * - `collidedEntityY`: The entity with which a collision occurred along the Y-axis, if any.
     */
    public isColliding(): {
      xColliding: boolean;
      yColliding: boolean;
      collisionSide?: { x?: 'left' | 'right'; y?: 'top' | 'bottom' };
      collidedEntityX?: any;
      collidedEntityY?: any;
    } {
      let xColliding = false;
      let yColliding = false;
      let collidedEntityX = null;
      let collidedEntityY = null;
      const collisionSide: { x?: 'left' | 'right'; y?: 'top' | 'bottom' } = {};

      const inst = this.inst;
      const pos = this.pos;
      const vx = this._velocityX ?? 0;
      const vy = this._velocityY ?? 0;

      const curLeft = pos.x;
      const curRight = pos.x + inst.width;
      const curTop = pos.y;
      const curBottom = pos.y + inst.height;

      for (let i = 0; i < AllActivePrefabs.length; i++) {
        const ent = AllActivePrefabs[i];
        if (!ent?.HasTag?.("build")) continue;
        if (ent === inst) continue;

        const p = ent.Physical.pos;
        const entLeft = p.x;
        const entRight = p.x + ent.width;
        const entTop = p.y;
        const entBottom = p.y + ent.height;

        // 只检测 X 方向（预测位置）
        const nextLeftX = pos.x + vx;
        const nextRightX = nextLeftX + inst.width;
        const verticalOverlapNow = !(curBottom <= entTop || curTop >= entBottom);
        if (!xColliding && verticalOverlapNow && nextRightX > entLeft && nextLeftX < entRight) {
          xColliding = true;
          collidedEntityX = ent;
          collisionSide.x = vx > 0 ? 'right' : 'left';
        }

        // 只检测 Y 方向（预测位置）
        const nextTopY = pos.y + vy;
        const nextBottomY = nextTopY + inst.height;
        const horizontalOverlapNow = !(curRight <= entLeft || curLeft >= entRight);
        if (!yColliding && horizontalOverlapNow && nextBottomY > entTop && nextTopY < entBottom) {
          yColliding = true;
          collidedEntityY = ent;
          collisionSide.y = vy > 0 ? 'bottom' : 'top';
        }

        if (xColliding && yColliding) break;
      }

      return { xColliding, yColliding, collisionSide, collidedEntityX, collidedEntityY };
    }


    public isUnderstandGround() {
      return this.pos.y <= 0;
    }

    private setGravity() {
      // 考虑重力影响
      this._velocityY += GRAVITY;
      if (this.pos.y <= 0) {
        this._velocityY = GRAVITY;
      }
    }

    // 设置物体的初始速度
    public SetInitialVelocity(velocityX: number, velocityY: number = 0): void {
      this._velocityX = velocityX || this._velocityX;
      this._velocityY = velocityY || this._velocityY;
    }

    // 在每一帧更新物体的位置
    public UpdatePosition(currentTime: number): void {
      // 根据当前速度更新位置
      if (this.toward[Toward.LEFT]) {
        this.SetInitialVelocity(-this.XPOWER, 0);
      }
      if (this.toward[Toward.RIGHT]) {
        this.SetInitialVelocity(this.XPOWER, 0);
      }

      if (this.lastTime === -1) {
        this.lastTime = performance.now();
      }
      const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒

      //==================================跳跃部分===========================================
      const addY = this._velocityY * deltaTime + 0.5 * GRAVITY * deltaTime * deltaTime;
      this._velocityY += GRAVITY * deltaTime;

      //==================================移动部分===========================================
      this._velocityX *= (1 - this.frictionCoefficient);
      const addX = this._velocityX;

      this.SetPosition(this.pos.x + addX, this.pos.y + addY);
      this.lastTime = currentTime;

      this.savePos();
      this.setGravity();
    }

    public SetPosition(x: number, y: number): void {
      const {
        xColliding,
        yColliding,
        collisionSide,
        collidedEntityX,
        collidedEntityY
      } = this.isColliding();

      const isBuild = this.inst.tags.includes("build");

      // 水平方向
      if (!xColliding || isBuild) {
        this.pos.x = x;
      } else if (collidedEntityX && collisionSide?.x) {
        if (collisionSide.x === 'right') {
          this.pos.x = collidedEntityX.Physical.pos.x - this.inst.width;
        } else if (collisionSide.x === 'left') {
          this.pos.x = collidedEntityX.Physical.pos.x + collidedEntityX.width;
        }
        this._velocityX = 0; // 碰到水平障碍 → 清除水平速度
      }

      // 垂直方向
      if (!yColliding || isBuild) {
        this.pos.y = y;
      } else if (collidedEntityY && collisionSide?.y) {
        if (collisionSide.y === 'bottom') {
          this.pos.y = collidedEntityY.Physical.pos.y - this.inst.height;
        } else if (collisionSide.y === 'top') {
          this.pos.y = collidedEntityY.Physical.pos.y + collidedEntityY.height;
        }
        this._velocityY = 0; // 碰到垂直障碍 → 清除垂直速度
      }
    }



    constructor(inst: any) {
      this.inst = inst;
      this.inst.ListenForEvent("changePosition", () => {
        const x = Math.floor(this.pos.x);
        const y = Math.floor(this.pos.y);
      });
      // this.checkCollision();
    }
  }

}
