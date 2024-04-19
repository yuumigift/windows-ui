import {reactive} from "vue";


const RegisterComponent = (name: string) => {
    const s = reactive({
        name: name
    })
    return s
}


export const EntityScript = () => {

    const AddComponent = (component: any) => {
        const comp = component(s)
        s.components[comp.name] = comp
    }

    const s = reactive({
        entity: {} as any,
        guid: "" as string,
        components: {} as any,
        position: {x: 0, y: 0},
        AddComponent
    })
    return s
}
