import {EntityScript} from "@/gameScript/scripts/entityscript";

export namespace AdventurePhysical {
    export const GRAVITY = -10

    export const XPOWER = 0.5

    export class Physical {
        inst: ReturnType<typeof EntityScript>
        public width: number = 0;
        public height: number = 0;

        private _velocityX: number = 0;
        private _velocityY: number = 0;

        // 摩擦力系数
        private _frictionCoefficient: number = 0.1;

        public pos = reactive({x: 0, y: 0})

        private savePos(){
            this.pos.x = Math.max(0, this.pos.x)
            this.pos.y = Math.max(0, this.pos.y)
        }

        get frictionCoefficient(): number {
            return this._frictionCoefficient;
        }

        set frictionCoefficient(value: number) {
            this._frictionCoefficient = value;
        }

        // 碰撞检测
        public checkCollision(): void {
            // 假设有一个碰撞检测逻辑，这里只是一个示例
            // 如果发生碰撞，可以根据具体情况更新物体的速度或位置
            if (this.pos.x <= 0 || this.pos.x + this.width > 800) {
                this._velocityX = 0;
            }
            if (this.pos.y <= 0 || this.pos.y + this.height > 600) {
                if (this._velocityY > 0){
                    this._velocityY = 0;
                }
            }
        }

        // 设置物体的初始速度
        public SetInitialVelocity(velocityX: number, velocityY: number = 0): void {
            this._velocityX = velocityX;
            this._velocityY = velocityY;
        }

        // 在每一帧更新物体的位置
        public UpdatePosition(): void {
            // 根据当前速度更新位置
            this._velocityX *= (1 - this.frictionCoefficient);
            this._velocityY *= (1 - this.frictionCoefficient);
            this.pos.x += this._velocityX;
            this.pos.y += this._velocityY;
            this.savePos();
            // 考虑重力影响
            this._velocityY += GRAVITY;
            this.checkCollision()
            console.log(this.pos)
        }

        public SetPosition(x: number, y: number): void {
            this.pos.x = x
            this.pos.y = y
        }

        constructor(inst: any) {
            this.inst = inst;
            this.inst.ListenForEvent("changePosition", () => {
                const x = Math.floor(this.pos.x);
                const y = Math.floor(this.pos.y);
            })
        }
    }

}
