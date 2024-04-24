import {EntityScript} from "@/gameScript/scripts/entityscript";
import {generateGUID} from "@/gameScript/scripts/utils/StringUtils";
import {Ents} from "@/gameScript/scripts/main";
import {getUuid} from "ant-design-vue/es/vc-notification/HookNotification";


export const CreateEntity = (name:string) => {
    const src = EntityScript()
    src.data.name = name
    src.data.guid = getUuid()
    Ents[src.data.guid] = src;
    return src
}
