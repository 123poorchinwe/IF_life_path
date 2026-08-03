"use client";
import {useMemo,useState} from "react";
import {ArrowLeft,Check,Clock3,DoorOpen,Hammer,LockKeyhole,MapPin,Route,Send,Sparkles,Zap} from "lucide-react";
import {Button,Tag} from "@/components/ui";
import PhaserCareerWorld,{WorldPlace} from "./PhaserCareerWorld";

const districts=[
  {id:"spatial",name:"空间技术区",x:21,y:19,level:2,building:"空间数据实验室",path:"gis-dev",npc:"周老师",npcId:"mentor",role:"项目负责人"},
  {id:"market",name:"市场应用区",x:70,y:18,level:1,building:"城市科技公司",path:"urban",npc:"高原",npcId:"interviewer",role:"空间技术负责人"},
  {id:"public",name:"公共事务区",x:72,y:56,level:1,building:"资格档案馆",path:"natural",npc:"乔文",npcId:"engineer",role:"国企项目工程师"},
  {id:"research",name:"研究与交流区",x:19,y:53,level:1,building:"从业者咖啡馆",path:"institute",npc:"林珊",npcId:"senior",role:"GIS 企业校友"},
  {id:"transition",name:"跨界探索区",x:42,y:78,level:0,building:"能力迁移工坊",path:"supply",npc:"唐宁",npcId:"pm",role:"城市数据产品经理"}
];
type District=typeof districts[number];

function PixelPerson({player=false}:{player?:boolean}){return <span className={`controlled-sprite ${player?"player":""}`}><i className="ps-shadow"/><i className="ps-legs"/><i className="ps-body"/><i className="ps-head"/><i className="ps-hair"/>{player&&<i className="ps-bag"/>}</span>}

function Interior({district,close}:{district:District;close:()=>void}){
  const [input,setInput]=useState(""),[messages,setMessages]=useState<{who:"npc"|"player";text:string}[]>([{who:"npc",text:`你来了。这里是${district.building}。比起问“这份职业好不好”，你今天更想核验哪一件具体的事？`}]),[loading,setLoading]=useState(false),[mode,setMode]=useState("角色开场");
  const send=async(text=input)=>{if(!text.trim()||loading)return;setMessages(m=>[...m,{who:"player",text}]);setInput("");setLoading(true);try{const r=await fetch("/api/dialogue",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({npcId:district.npcId,place:district.building,message:text,memory:messages.slice(-6).map(m=>`${m.who}:${m.text}`),profile:{major:"GIS",degree:"硕士",graduation:"2027"},worldState:{energy:7,information_quality:2,turn:2}})});const j=await r.json();if(!r.ok)throw new Error();setMessages(m=>[...m,{who:"npc",text:j.data.npc_message}]);setMode("AI 在线")}catch{setMessages(m=>[...m,{who:"npc",text:"我只能先说我亲眼见过的部分。岗位名字经常比实际工作漂亮，你可以问我上个月真正交付了什么。"}]);setMode("本地角色回退")}finally{setLoading(false)}};
  return <div className="interior-overlay"><section className={`interior-room room-${district.id}`}><header><button onClick={close}><ArrowLeft/>返回小镇</button><div><span>{district.name}</span><b>{district.building}</b></div><Tag tone={mode==="AI 在线"?"open":"review"}><i/>{mode}</Tag></header><div className="room-scene"><div className="room-floor"/><div className="room-window"/><div className="room-desk"><i/><i/></div><div className="room-shelf"/><div className="room-plant"/><div className="npc-in-room"><PixelPerson/><span><b>{district.npc}</b><small>{district.role}</small></span></div><div className="player-in-room"><PixelPerson player/></div><button className="inspect-object computer"><Sparkles/>调查电脑上的岗位任务</button><button className="inspect-object notice"><MapPin/>查看本月公开活动</button></div><aside className="interior-dialogue"><div className="dialogue-person"><PixelPerson/><span><b>{district.npc}</b><small>{district.role} · 已观察：表达直接、资源有限</small></span></div><div className="message-history">{messages.map((m,i)=><p className={m.who} key={i}><span>{m.text}</span></p>)}{loading&&<p className="npc"><span className="dotting">正在组织回答…</span></p>}</div><div className="quick-asks">{["你上个月实际在做什么？","这条路径最大的误解是什么？","新人最容易忽略什么风险？"].map(q=><button onClick={()=>send(q)} key={q}>{q}</button>)}</div><form onSubmit={e=>{e.preventDefault();send()}}><input value={input} onChange={e=>setInput(e.target.value)} placeholder={`直接问${district.npc}任何具体问题…`}/><button disabled={loading||!input.trim()}><Send/></button></form><small><Sparkles/>AI 只控制表达；资格、时间和资源仍由规则引擎计算。</small></aside></section></div>
}

export default function CareerDistrictMap({onSelect}:{onSelect:(id:string)=>void}){
  const setPlayer=(_: {x:number;y:number})=>void _;
  const [levels,setLevels]=useState<Record<string,number>>(Object.fromEntries(districts.map(d=>[d.id,d.level]))),[selected,setSelected]=useState(districts[0]),[inside,setInside]=useState<District|null>(null),[manualTip,setManualTip]=useState("WASD / 方向键移动 · 靠近地点互动");
  const upgrade=()=>setLevels(s=>({...s,[selected.id]:Math.min(3,s[selected.id]+1)}));
  const worldPlaces:WorldPlace[]=useMemo(()=>districts.map(d=>({...d,locked:levels[d.id]===0})),[levels]);
  return <div className="district-map alive-map game-engine-map"><PhaserCareerWorld places={worldPlaces} onHint={setManualTip} onFocus={id=>{const d=districts.find(x=>x.id===id);if(d){setSelected(d);onSelect(d.path)}}} onEnter={id=>{const d=districts.find(x=>x.id===id);if(d){setSelected(d);setInside(d);onSelect(d.path)}}}/><div className="town-atmosphere"/>
    {[0,1,2,3,4].map(i=><div className={`map-walker walker-${i}`} key={i}><span className="thought">{i===1?"!":i===4?"?":"···"}</span><i className="person-shadow"/><i className="person-legs"/><i className="person-body"/><i className="person-head"/></div>)}
    <div className="play-hint"><Zap/><b>{manualTip}</b><small><kbd>WASD</kbd>移动 <kbd>E</kbd>进入 <kbd>点击地点</kbd>自动前往</small></div>
    <button className="live-event e1" onClick={()=>setSelected(districts[3])}><Sparkles/><span><b>校友访谈正在进行</b><small>前往咖啡馆了解城市数据岗位</small></span></button><button className="live-event e2" onClick={()=>setSelected(districts[1])}><Clock3/><span><b>企业开放日 · 剩余 2 回合</b><small>进入公司获得一手工作信息</small></span></button>
    <aside className="district-upgrade"><Tag tone={levels[selected.id]===0?"blocked":"open"}>{levels[selected.id]===0?<LockKeyhole/>:<MapPin/>}{selected.name}</Tag><h3>{selected.building}</h3><p>{levels[selected.id]===0?"完成一次能力迁移，修复通往这一区域的路线。":"进入场所与 NPC 互动，或投入真实行动升级，增加岗位证据与新事件。"}</p><dl><div><dt>当前等级</dt><dd>{levels[selected.id]} / 3</dd></div><div><dt>升级成本</dt><dd><Clock3/>时间 1 · <Hammer/>项目证据 1</dd></div><div><dt>下一等级</dt><dd>解锁 2 个职业事件</dd></div></dl><div className="place-actions"><Button onClick={()=>{setPlayer({x:selected.x,y:selected.y+9});setInside(selected)}} disabled={levels[selected.id]===0}><DoorOpen/>进入场所</Button><Button variant="secondary" disabled={levels[selected.id]===0||levels[selected.id]>=3} onClick={upgrade}>{levels[selected.id]>=3?<><Check/>已达上限</>:<>升级 <Route/></>}</Button></div></aside>{inside&&<Interior district={inside} close={()=>setInside(null)}/>}</div>}
