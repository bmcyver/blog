---
title: 블로그 완벽 가이드 (Blog Guide)
description: 마크다운 작성 문법 및 블로그 기능 가이드
date: 2100-12-31
tags:
  - Guide
authors:
  - bmcyver
draft: true
comments: false
---

## 1. 프론트매터 (Frontmatter)

```yaml
---
title: "포스트 제목"
description: "포스트 요약 설명"
date: 2026-08-24
tags:
  - Web
authors:
  - bmcyver
draft: false # true: 개발 환경에서만 표시 / false: 프로덕션 배포
comments: true # Giscus 댓글 영역 (기본값: true)
order: 1 # 서브포스트 정렬 순서
image: "./cover.png" # 대표 이미지
---
```

---

## 2. 이미지 크기 및 캡션

| 문법 | 설명 |
| :--- | :--- |
| `![설명\|x500](./img.png)` | 세로 500px 고정 + 캡션 |
| `![설명\|300](./img.png)` | 가로 300px 고정 + 캡션 |
| `![설명\|400x250](./img.png)` | 400x250px 고정 + 캡션 |
| `![설명](./img.png)` | 원본 크기 + 캡션 |
| `![\|x500](./img.png)` | 세로 500px 고정 (캡션 없음) |
| `![](./img.png)` | 기본 이미지 (캡션 없음) |

---

## 3. 콜아웃 (Callouts)

:::note[Note]
```markdown
:::note[Note]
참고 사항을 작성합니다.
:::
```
:::

:::tip[Tip]
```markdown
:::tip[Tip]
유용한 팁을 작성합니다.
:::
```
:::

:::important[Important]
```markdown
:::important[Important]
중요한 항목을 작성합니다.
:::
```
:::

:::warning[Warning]
```markdown
:::warning[Warning]
주의가 필요한 항목을 작성합니다.
:::
```
:::

:::danger[Danger]
```markdown
:::danger[Danger]
위험 요소를 작성합니다.
:::
```
:::

:::note[접힌 콜아웃]{closed}
```markdown
:::note[접힌 콜아웃]{closed}
기본으로 접혀있는 콜아웃입니다.
:::
```
:::

---

## 4. 코드 블록 (Expressive Code)

```ts title="src/index.ts" {2}
export function example() {
  console.log("특정 라인 하이라이트");
}
```

```bash title="Terminal"
pnpm run dev
```

```js ins={"추가":2} del={"삭제":1}
- const oldApi = "v1"
+ const newApi = "v2"
```

```json title="package.json" collapse={3-4}
{
  "name": "blog",
  "dependencies": {
    "astro": "^7.0.0"
  }
}
```

---

## 5. 수식 (Temml)

인라인 수식: $E = mc^2$

블록 수식:

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

---

## 6. 각주 (Footnotes)

본문 내용 뒤에 각주[^1]를 작성합니다.

[^1]: 페이지 최하단에 렌더링되는 각주 설명입니다.

---

## 7. 링크

```markdown
[외부 링크](https://astro.build) <!-- 새 탭 자동 적용 -->
[내부 링크](/blog/2026-08-ubuntu)
[섹션 앵커](#1-프론트매터-frontmatter)
```

---

## 8. 서브포스트 (Series)

```
src/content/blog/2026-08-series/
├── index.md         <-- 메인 포스트
├── 01-intro.md      <-- order: 1
└── 02-usage.md      <-- order: 2
```

메인 포스트에 진입하면 모든 서브포스트가 한 페이지로 이어져 렌더링됩니다.