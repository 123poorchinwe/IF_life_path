import { create } from "zustand";
import { persist } from "zustand/middleware";
type Effect={energy:number;time:number;money:number;info:number;support:number};
type State={round:number;energy:number;time:number;money:number;info:number;support:number;history:string[];choose:(text:string,e:Effect)=>void;reset:()=>void};
const initial={round:1,energy:7,time:8,money:5,info:3,support:4,history:[]};
export const useGameStore=create<State>()(persist((set)=>({...initial,choose:(text,e)=>set(s=>({round:s.round+1,energy:Math.max(0,Math.min(10,s.energy+e.energy)),time:Math.max(0,Math.min(10,s.time+e.time)),money:Math.max(0,Math.min(10,s.money+e.money)),info:Math.max(0,Math.min(10,s.info+e.info)),support:Math.max(0,Math.min(10,s.support+e.support)),history:[...s.history,text]})),reset:()=>set(initial)}),{name:"if-life-path-state"}));
