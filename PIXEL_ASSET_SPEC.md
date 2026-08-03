# 像素素材生产规格

当前 CSS 小人只用于验证互动和 AI 回路。正式建模应替换为同一套像素精灵图，避免不同 AI 批次造成比例漂移。

## 角色 Sprite Sheet

- 单格：32×48 px；整张：192×192 px；透明 PNG。
- 4 个方向：向下、向左、向右、向上。
- 每个方向 3 帧：站立、左脚、右脚；另加交谈、坐下、使用电脑、持物状态。
- 轮廓使用 1 px 深色描边；人物统一头身比、肩宽、眼睛位置和脚底锚点。
- 禁止插值缩放、柔边、半透明轮廓、文字、水印和随机背景。

通用提示词：`top-down 2D pixel game character sprite sheet, grounded contemporary Chinese workplace life simulation, 32x48 pixels per frame, four directions, three-frame walk cycle, idle and talking actions, restrained natural colors, readable silhouette, consistent proportions, transparent background, exact grid alignment, no anti-aliasing`

角色差异：

- `player-gis.png`：24 岁 GIS 硕士，浅色衬衫、深色长裤、棕色斜挎电脑包。
- `zhou-laoshi.png`：42 岁高校项目负责人，深灰针织衫，步态快，交谈动作克制。
- `lin-shan.png`：29 岁 GIS 企业校友，卡其色轻西装，手持手机或纸杯。
- `a-yuan.png`：24 岁同学，蓝色外套和双肩包。
- `tang-ning.png`：32 岁产品经理，墨绿色外套，手持平板电脑。
- `xu-rui.png`：36 岁培训顾问，暖灰商务休闲装，手持宣传册。
- `gao-yuan.png`：38 岁技术负责人，深蓝衬衫，使用笔记本电脑动作。
- `qiao-wen.png`：27 岁项目工程师，低饱和工装外套和证件卡。

## Tile Set

- 基础网格：16×16 px，界面以 2× 或 3× 整数倍显示。
- 地面：草地 6 种随机变体、土路、石板、沥青、人行道、室内木地板和办公室地毯。
- 建筑：实验室、就业中心、咖啡馆、共享办公区、企业大楼；门必须独立成可交互 tile。
- 道具：电脑、公告板、档案柜、打印机、咖啡机、长椅、招聘展板、公交站、树和水面动画。
- 所有物件同时提供普通、高亮和已调查状态。

## 接入路径

```text
public/assets/pixel/
  characters/
  tilesets/
  buildings/
  interiors/
  props/
  ui/
```

生成后优先替换 `Sprite` 组件，保持脚底中心为角色坐标锚点；地图数据应继续使用逻辑碰撞层，不从图片颜色猜测可通行区域。
