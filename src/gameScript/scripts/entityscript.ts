import {reactive} from "vue";


const RegisterComponent = (name:string) => {
    const s = reactive({
        name:name
    })
    return s
}


export const EntityScript = () => {

    const AddComponent = <T>(component: T) => {
        const comp = component()
        s.components[comp.name] =  component()
    }

    const s = reactive({
        entity: {} as any,
        guid: "" as string,
        components: {} as any,
        AddComponent
    })
    return s
}