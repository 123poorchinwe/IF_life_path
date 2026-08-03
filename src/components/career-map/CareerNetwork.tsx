"use client";
import { memo,useMemo,useState } from "react";
import { Background,Controls,Edge,Handle,MiniMap,Node,NodeProps,Position,ReactFlow,useReactFlow,ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Check,Clock3,Eye,Filter,LockKeyhole,Search,Sparkles,Target,X } from "lucide-react";
import { careers,Status } from "@/data/mock";
import { Button,Tag } from "@/components/ui";
import CareerDistrictMap from "./CareerDistrictMap";

type CareerData={label:string;sector:string;status:Status;gaps:number;confidence:string;kind:"career"|"profile"|"skill"|"constraint"};
const statusKey:Record<Status,string>={"已开放":"open","接近开放":"near","需要调查":"review","硬性受限":"blocked","新发现":"ai"};
const statusIcon:Record<Status,React.ReactNode>={"已开放":<Check/>,"接近开放":<Target/>,"需要调查":<Search/>,"硬性受限":<LockKeyhole/>,"新发现":<Sparkles/>};

const CareerNode=memo(function CareerNode({data,selected}:NodeProps<Node<CareerData>>){return <div className={`flow-node ${data.kind} ${statusKey[data.status]} ${selected?"selected":""}`}><Handle type="target" position={Position.Left}/><div className="node-head"><span>{data.kind==="career"?data.sector:data.kind==="skill"?"能力证据":data.kind==="constraint"?"限制条件":"个人档案"}</span>{data.status==="新发现"&&<Sparkles/>}</div><b>{data.label}</b><div className="node-foot"><span>{statusIcon[data.status]}{data.status}</span>{data.kind==="career"&&<small>{data.gaps?`缺 ${data.gaps} 项条件`:"当前可尝试"}</small>}</div><Handle type="source" position={Position.Right}/></div>});
const nodeTypes={career:CareerNode};

function NetworkInner({onEnter}:{onEnter:()=>void}){
  const [selectedId,setSelectedId]=useState("gis-dev"),[sector,setSector]=useState("全部"),[excluded,setExcluded]=useState(false),[view,setView]=useState<"district"|"network">("district");const {fitView}=useReactFlow();
  const selected=careers.find(c=>c.id===selectedId)||careers[0];
  const {nodes,edges}=useMemo(()=>{
    const visible=careers.filter(c=>(sector==="全部"||c.sector===sector)&&(!excluded||c.status!=="硬性受限")).slice(0,18);
    const ns:Node<CareerData>[]=[{id:"profile",type:"career",position:{x:20,y:305},data:{label:"GIS 硕士 · 2027",sector:"7 项能力证据",status:"已开放",gaps:0,confidence:"已确认",kind:"profile"}},
      {id:"skill-python",type:"career",position:{x:280,y:170},data:{label:"Python 与数据处理",sector:"项目证明",status:"已开放",gaps:0,confidence:"verified",kind:"skill"}},
      {id:"skill-spatial",type:"career",position:{x:280,y:355},data:{label:"空间网络分析",sector:"道路网络项目",status:"已开放",gaps:0,confidence:"verified",kind:"skill"}},
      {id:"constraint",type:"career",position:{x:280,y:540},data:{label:"企业案例不足",sector:"当前限制",status:"硬性受限",gaps:1,confidence:"verified",kind:"constraint"}},
      ...visible.map((c,i)=>({id:c.id,type:"career",position:{x:610+(i%4)*250,y:45+Math.floor(i/4)*145},data:{label:c.title,sector:String(c.sector),status:c.status,gaps:c.status==="已开放"?0:(i%2)+1,confidence:String(c.confidence),kind:"career" as const}}))];
    const es:Edge[]=[{id:"p-py",source:"profile",target:"skill-python",className:"edge-direct"},{id:"p-sp",source:"profile",target:"skill-spatial",className:"edge-direct"},{id:"p-co",source:"profile",target:"constraint",className:"edge-blocked"},...visible.map((c,i)=>({id:`e-${c.id}`,source:i%3===0?"skill-python":i%3===1?"skill-spatial":"constraint",target:c.id,className:c.status==="新发现"?"edge-ai":c.status==="硬性受限"?"edge-blocked":c.status==="接近开放"?"edge-action":"edge-direct",animated:c.status==="接近开放"}))];
    return {nodes:ns,edges:es};
  },[sector,excluded]);
  return <div className="network-shell"><aside className="network-profile"><div className="side-title"><span>PROFILE / 已确认</span><b>我的职业档案</b></div><dl><div><dt>专业</dt><dd>地理信息系统</dd></div><div><dt>学历</dt><dd>硕士 · 2027届</dd></div><div><dt>技能证据</dt><dd>7 项</dd></div><div><dt>当前限制</dt><dd>3 项</dd></div></dl><h4>重点能力</h4>{["Python","空间分析","路网建模","英文汇报"].map(x=><Tag key={x}>{x}</Tag>)}<h4>图例</h4>{(["已开放","接近开放","需要调查","硬性受限","新发现"] as Status[]).map(s=><div className="legend-row" key={s}><i className={statusKey[s]}/><span>{s}</span></div>)}</aside>
    <section className="network-workspace"><div className="network-toolbar"><div className="view-switch"><button className={view==="district"?"active":""} onClick={()=>setView("district")}>区域地图</button><button className={view==="network"?"active":""} onClick={()=>setView("network")}>关系网络</button></div>{view==="network"&&<><div className="sector-tabs">{["全部","空间技术","公共事务","研究科学","跨行业","创意技术"].map(s=><button className={sector===s?"active":""} onClick={()=>setSector(s)} key={s}>{s}</button>)}</div><button onClick={()=>setExcluded(!excluded)}><Eye/>{excluded?"显示受限":"隐藏受限"}</button><button onClick={()=>fitView({duration:300})}><Target/>自动居中</button></>}</div>{view==="district"?<CareerDistrictMap onSelect={setSelectedId}/>:<ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={(_,n)=>n.data.kind==="career"&&setSelectedId(n.id)} fitView minZoom={.35} maxZoom={1.5} aria-label="职业路径关系网络"><Background gap={24} size={1}/><Controls showInteractive={false}/><MiniMap pannable zoomable nodeColor={n=>n.data.kind==="career"?"#526873":"#304551"}/></ReactFlow>}<div className="network-caption"><Filter/>{view==="district"?"选择职业区域 · 建设证据设施 · 解锁新事件":"拖动画布探索 · 滚轮缩放 · 点击职业查看证据"}</div></section>
    <aside className="inspector"><button className="inspector-close" aria-label="关闭详情"><X/></button><div className="inspector-overline">CAREER INSPECTOR</div><Tag tone={statusKey[selected.status]}>{statusIcon[selected.status]}{selected.status}</Tag><h2>{selected.title}</h2><p className="definition">{selected.description}</p><div className="evidence-level"><span>证据等级</span><b>{selected.confidence}</b><small>基于档案与本地规则</small></div><h3>条件核验</h3><ul className="requirements"><li className="met"><Check/><span><b>已满足</b>硕士学历、Python、空间分析</span></li><li className="near"><Target/><span><b>可补足</b>{selected.gaps.join("、")}</span></li><li className="review"><Search/><span><b>需要核验</b>岗位中的“相关专业”表述</span></li></ul><h3>为什么向你出现</h3><blockquote>你的道路网络项目证明了网络分析、Python 和空间可视化能力。</blockquote><div className="source-note"><Clock3/><span><b>现实证据</b>当前使用示例岗位分类 · 数据待正式核验</span></div><div className="inspector-actions"><Button onClick={onEnter}>进入情景体验</Button><Button variant="secondary">调查此路径</Button><Button variant="ghost">暂时排除</Button></div></aside></div>
}
export default function CareerNetwork(props:{onEnter:()=>void}){return <ReactFlowProvider><NetworkInner {...props}/></ReactFlowProvider>}
