"use client";
import type { ButtonHTMLAttributes,HTMLAttributes,ReactNode,TextareaHTMLAttributes } from "react";
import { AlertTriangle,CheckCircle2,LoaderCircle } from "lucide-react";

export function Button({variant="primary",className="",...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:"primary"|"secondary"|"ghost"|"danger"}){return <button className={`ui-button ${variant} ${className}`} {...props}/>}
export function Tag({children,tone="neutral",className=""}:{children:ReactNode;tone?:string;className?:string}){return <span className={`ui-tag ${tone} ${className}`}>{children}</span>}
export function Panel({className="",...props}:HTMLAttributes<HTMLElement>){return <section className={`ui-panel ${className}`} {...props}/>}
export function TextArea(props:TextareaHTMLAttributes<HTMLTextAreaElement>){return <textarea className="ui-textarea" {...props}/>}
export function LoadingState({title,detail}:{title:string;detail:string}){return <div className="state-box" role="status"><LoaderCircle className="spin"/><div><b>{title}</b><p>{detail}</p></div></div>}
export function ErrorState({title,detail,action}:{title:string;detail:string;action?:ReactNode}){return <div className="state-box error" role="alert"><AlertTriangle/><div><b>{title}</b><p>{detail}</p>{action}</div></div>}
export function EmptyState({title,detail}:{title:string;detail:string}){return <div className="state-box"><CheckCircle2/><div><b>{title}</b><p>{detail}</p></div></div>}
