import {RegisterComponent} from "@/gameScript/scripts/entityscript";

export class Locomotor extends RegisterComponent{
    get position(): { x: number; y: number } {
        return this._position;
    }

    set position(value: { x: number; y: number }) {
        this._position = value;
    }
    private _position:{x:number, y:number} = {x:0,y:0};
    constructor(){
        super()
    }
}
