import {EntityScript} from "@/gameScript/scripts/entityscript";
import {generateGUID} from "@/gameScript/scripts/utils/StringUtils";
import {Ents} from "@/gameScript/scripts/main";


export const CreateEntity = (name:string) => {
    const src = EntityScript()
    src.guid = generateGUID(name)
    Ents[src.guid] = src;
    return src
}
