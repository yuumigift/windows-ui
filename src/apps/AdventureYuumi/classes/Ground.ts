import { useCanvas } from "../common";
const { draw } = useCanvas();

export class Ground {
  enterFrame() {
    draw(0, 400, 800, 200, "#333");
  }
}
