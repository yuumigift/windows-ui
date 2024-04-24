import {reactive} from "vue";


export class RegisterComponent {
    public inst: ReturnType<typeof EntityScript>

    constructor() {
        this.inst = null as any
    }
}

const DoTaskInTime = (timeout: number, handler: TimerHandler,) => {
    const timer = setTimeout(handler, timeout)
    const Cancel = () => {
        clearTimeout(timer)
    }

    const s = reactive({
        Cancel
    })
    return s
}
const DoPeriodicTask = (timeout: number, handler: TimerHandler,) => {
    const timer = setInterval(handler, timeout)
    const Cancel = () => {
        clearInterval(timer)
    }

    const s = reactive({
        Cancel
    })
    return s
}


export const EntityScript = () => {

    const AddComponent = (component: RegisterComponent) => {
        const comp = component
        comp.inst = s
        const name = comp.constructor.name.toLowerCase()
        if (!s.components[name]) {
            s.components[name] = comp
        }
    }
    const PushEvent = (event: string, ...args: any) => s.events[event](...args)


    const ListenForEvent = (event: string, eventHandle: (...args: any) => {}) => s.events[event] = eventHandle


    const AddTag = (tag: string) => {
        if (!s.tags.includes(tag)) {
            s.tags.push(tag)
        }
    }

    const RemoveTag = (tags: string[]) => s.tags = s.tags.filter(item => !tags.includes(item))

    const s = reactive({
        entity: {} as any,
        events: {} as Record<string, (...args: any[]) => any>,
        data: {
            name: "" as string,
            guid: "" as string
        },
        components: {} as Record<string, any>,
        position: {x: 0, y: 0} as { x: number, y: number },
        tags: <string[]>[],
        AddComponent,
        DoPeriodicTask,
        DoTaskInTime,
        PushEvent,
        ListenForEvent,
        AddTag,
        RemoveTag,
    })
    return s
}
