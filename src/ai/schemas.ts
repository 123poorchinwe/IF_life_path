import { z } from "zod";

export const dialogueResponseSchema=z.object({
  npc_message:z.string().min(1).max(260),
  observable_signals:z.array(z.string().min(1).max(40)).min(1).max(4),
  emotional_tone:z.enum(["克制","友善","犹豫","疲惫","防御","施压","坦诚"]),
  relationship_tags:z.array(z.enum(["trust_up","trust_down","boundary_respected","boundary_pressure","information_shared","promise_unverified","conflict_unresolved"])).max(4),
  memory_summary:z.string().min(1).max(120),
  suggested_actions:z.array(z.object({id:z.string(),text:z.string().max(60),intent:z.enum(["clarify","boundary","accept","decline","investigate","empathy"])})).max(3).default([])
});
export type DialogueResponse=z.infer<typeof dialogueResponseSchema>;

export const dialogueJsonSchema={
  type:"object",additionalProperties:false,
  properties:{
    npc_message:{type:"string"},observable_signals:{type:"array",items:{type:"string"}},
    emotional_tone:{type:"string",enum:["克制","友善","犹豫","疲惫","防御","施压","坦诚"]},
    relationship_tags:{type:"array",items:{type:"string",enum:["trust_up","trust_down","boundary_respected","boundary_pressure","information_shared","promise_unverified","conflict_unresolved"]}},
    memory_summary:{type:"string"},suggested_actions:{type:"array",items:{type:"object",additionalProperties:false,properties:{id:{type:"string"},text:{type:"string"},intent:{type:"string",enum:["clarify","boundary","accept","decline","investigate","empathy"]}},required:["id","text","intent"]}}
  },required:["npc_message","observable_signals","emotional_tone","relationship_tags","memory_summary","suggested_actions"]
};
