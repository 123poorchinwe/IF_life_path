# IF人生线：未开放区域

可点击运行的中文职业决策模拟 MVP。当前内置 GIS 硕士档案、30 个职业节点、40 个结构化事件骨架、6 回合资源状态机、能力重组和结论简报。状态使用 Zustand 持久化；数值变化完全由本地规则执行，事件表达层不直接修改规则。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。生产检查使用 `npm run build`。

## 素材替换

像素人物、动作帧、地图 Tile Set 与接入规范见 `PIXEL_ASSET_SPEC.md`。当前 CSS 小人只是互动逻辑占位，正式素材应使用统一 Sprite Sheet。

## 启用实时 AI 对话

复制 `.env.example` 为 `.env.local`，填入服务端密钥：

```env
AI_PROVIDER=modelscope
AI_BASE_URL=https://api-inference.modelscope.cn/v1
AI_MODEL=Qwen/Qwen2.5-72B-Instruct
MODELSCOPE_ACCESS_TOKEN=你的魔搭SDK Token
```

重新执行 `npm run dev`。对话框显示“AI 在线”表示实时请求成功；缺少密钥或服务异常时会明确显示“本地回退”。密钥不会发送到浏览器。

## 后续接入 AI

建议新增 `/src/ai`，使用 Zod 校验模型的结构化事件输出；模型只返回叙事字段与语义后果标签，再由 `/src/store/game.ts` 或独立 consequence engine 转为确定性数值。

## 环境变量

复制 `.env.example` 为 `.env.local`。不配置时应用保持本地 Mock 模式。
