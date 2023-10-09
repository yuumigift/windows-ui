export namespace System {
  export interface IApp {
    title: string;
    vuePath: string;
    icon: string;
  }

  export interface ITask {
    id: number;
    title: string;
    render: any;
    isActive: boolean;
  }
}
