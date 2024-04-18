import {reactive} from "vue";


export const EntityScript = () => {

    const AddComponent = <T>(component: any) => {
        s.components[component.name] = <T> component()
    }

    const s = reactive({
        entity: {} as any,
        guid: "" as string,
        components: {} as any,
        AddComponent
    })
    return s
}