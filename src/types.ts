export namespace System {
  export interface IApp {
    title: string;
    vuePath: string;
    icon: string;
    width?: number;
    height?: number;
  }

  export interface ITask {
    id: number;
    title: string;
    render: any;
    isActive: boolean;
    isMinimize: boolean;
    width: number;
    height: number;
  }
}
