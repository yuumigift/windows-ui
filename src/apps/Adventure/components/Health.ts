import {RegisterComponent} from "@/gameScript/scripts/entityscript";

export class Health extends RegisterComponent{
    get maxHealth(): number {
        return this._maxHealth;
    }

    set maxHealth(value: number) {
        this._maxHealth = value;
    }

    get currentHealth(): number {
        return this._currentHealth;
    }

    set currentHealth(value: number) {
        this._currentHealth = value;
        if (this._currentHealth === 0){
            this.inst.PushEvent("death")
        }
    }
    private _maxHealth: number = 100;
    private _currentHealth: number = this._maxHealth;
    public isAlive(){
        return this._currentHealth > 0
    }
    public DoDelta(num: number) {
        this.currentHealth += num;
    }
    constructor() {
        super();
    }
}
