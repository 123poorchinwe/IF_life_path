export type ProductStep="home"|"onboarding"|"parsing"|"review"|"map"|"simulation"|"transfer"|"result";
export type ProfileMode="text"|"upload"|"structured"|"preset";
export type ResourceState={turn:number;time:number;energy:number;buffer:number;information:number;support:number};
export type DecisionRecord={turn:number;choice:string;tags:string[]};
