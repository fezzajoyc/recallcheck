# RecallCheck · 产品召回数据库

**14,682 条官方召回记录**(openFDA food/drug/device 三线 + CPSC 全史)+ 6,427 个品牌的历史聚合页。每条忠实转写官方字段,零解读,全程链接官方源。"is X recalled" 会话式长尾的蓝海卡位(调研:政府 UX 差、新闻站只报大件、召回量上升)。~850 预渲染 + 长尾 ISR。

三个不掺假的事(站群纪律):

- 每条都是官方记录的忠实转写,不添加任何危害解读或安全建议——这是 YMYL 相邻内容的质量底线。
- 记录数是"数量"不是"安全评价",品牌页口径明示。
- FSIS(肉类召回)源被 Akamai 封锁,留 CI 阶段接入;数据每日 CI 同步增量补齐。

## 站点结构

| 路径 | 内容 | SEO 角色 |
|---|---|---|
| `/recall/[id]` | 召回详情 ×14,682:"X recalled" 会话式意图 | 长尾主力 |
| `/brand/[slug]` | 品牌历史 ×6,427 | "X company recalls" |
| `/type/[type]` · `/year/[year]` · `/latest` | 类目/年份/最新 | 枢纽+日更 |
| `/api/recall` | JSON(CORS 全开,?id= / ?q=) | agent 数据口 |

## 数据流

```
openFDA(按年窗口分页,单页失败保留部分) + CPSC RestWebServices(全量)
  └─ scripts/sync-recalls.mjs(CI 每日;幂等,按 id 去重)
       └─ data/rec/<source>-<year>.json(分片 + generated.ts 静态打包)
            └─ 站点零外呼
```

`npm test`(6 项:去重一致性/官方链接/排序/历史深度)后构建。Vercel 导入零配置;广告位已埋;每日 CI 体检开 issue。
