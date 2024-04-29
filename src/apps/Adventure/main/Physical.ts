import {EntityScript} from "@/gameScript/scripts/entityscript";

export namespace AdventurePhysical {
    export const GRAVITY = -0.5

    export const XPOWER = 0.5

    export class Physical {
        inst: ReturnType<typeof EntityScript>
        private _x: number = 0
        private _y: number = 0

        public width: number = 0;
        public height: number = 0;

        private _velocityX: number = 0;
        private _velocityY: number = 0;

        // 摩擦力系数
        private _frictionCoefficient: number = 0.1;

        private pos = reactive({x: this.x, y: this.y})

        public GetPosition(){
            return this.pos
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
            if (this.x <= 0 || this._x + this.width > 800) {
                this._velocityX = 0;
            }
            if (this.y <= 0 || this._y + this.height > 600) {
                this._velocityY = 0;
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
            this.x += this._velocityX;
            this.y += this._velocityY;
            // 考虑重力影响
            this._velocityY += GRAVITY;
            this.checkCollision()
        }

        get x(): number {
            return this._x;
        }

        set x(value: number) {
            this._x = value <= 0 ? 0 : value;
        }

        get y(): number {
            return this._y;
        }

        set y(value: number) {
            this._y = value <= 0 ? 0 : value;
        }

        public SetPosition(x: number, y: number): void {
            this.x = x;
            this.y = y;
        }

        constructor(inst: any) {
            this.inst = inst;
            this.inst.ListenForEvent("changePosition", () => {
                const x = Math.floor(this._x);
                const y = Math.floor(this._y);
            })
        }
    }

}
