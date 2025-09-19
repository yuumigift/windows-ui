import {EntityScript} from "@/gameScript/scripts/entityscript";

export const Ents = <any>{}
export const AllPrefabs = <any>{}
export const AllActivePrefabs = <ReturnType<typeof EntityScript>[]>[]
export type ent = ReturnType<typeof EntityScript>