import {EntityScript} from "@/apps/PlantVsZombieMadoka/scripts/entityscript";
import {generateGUID} from "@/apps/PlantVsZombieMadoka/scripts/utils/StringUtils";
import {Ents} from "@/apps/PlantVsZombieMadoka/scripts/main";


export const CreateEntity = (name:string) => {
    const src = EntityScript()
    src.guid = generateGUID(name)
    Ents[src.guid] = src;
    return src
}
