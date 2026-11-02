# The stand server (PLAN 9g)

One Node process: the registry · the rooms · the clock · the eleven messages ·
the admin API · the static files the stand needs. Socket.IO over WebSocket only.
Design: `docs/DESIGN.md` §1–§5, §8–§9. Requirements: AR-1, 5, 9, 10, 13, 54, 55,
57, 58, 59.

## Run it here

```
node C:\Users\jwloy\GitHub\for_seven_tubas\server\server.js
```

→ `http://localhost:5300/` (and the LAN address it prints). Data lives in
`server/data/` (gitignored): `registry.json`, `marks/`, `admin.key`.

Flags: `--port 5300` · `--data server/data` · `--spare <snapshot.json>` ·
`--idle-ms 1800000` (REHEARSAL → ALONE after this long empty) · `--quiet`.
Environment: `PORT` · `DATA_DIR` · `ADMIN_KEY` · `PUBLIC_ORIGIN`
(`https://stand.example.org`, so the links print right behind nginx) ·
`TRUST_PROXY=1` (behind nginx only: read the real address from
`X-Forwarded-For`) · `REHEARSAL_IDLE_MS`.

## The composer's admin line

```
node C:\Users\jwloy\GitHub\for_seven_tubas\tools\admin.js register tubas "for seven tubas" db1
node C:\Users\jwloy\GitHub\for_seven_tubas\tools\admin.js create "Penn State Tubas" tubas
node C:\Users\jwloy\GitHub\for_seven_tubas\tools\admin.js ensembles
```

`create` prints the gatekeeper link and one link per part. `leader`, `name`,
`add`, `reissue`, `mode`, `links`, `snapshot` — run `admin.js` with no
arguments for the list. Against the box: add `--server https://stand.example.org
--key <the box's admin key>`.

## The tests

```
node tools/test_server.js      the protocol battery (every message, every refusal, the door, the spare)
node tools/chaos_test.js       gate E-5: N fake stands, a stand killed and rejoined, the server killed mid-piece
```

Both start their own server on a scratch folder; nothing of yours is touched.

## The box (Hetzner, as piece #1 — AR-55)

Once, on a fresh Ubuntu box:

1. `apt install nginx certbot python3-certbot-nginx` · Node 20+ · `npm i -g pm2`.
2. `git clone` the repository; `cd` into it.
3. `cp server/nginx.conf.example /etc/nginx/sites-available/stand`, set the
   host name, link into `sites-enabled`, `nginx -t && systemctl reload nginx`,
   then `certbot --nginx -d <host>` (HTTPS is what the wake lock, the
   home-screen app and the camera QR need).
4. `export ADMIN_KEY=<a long random string> PUBLIC_ORIGIN=https://<host> TRUST_PROXY=1`
   (or put them in `/etc/environment` so PM2 sees them after a reboot).
5. `bash server/deploy.sh` → pull, `npm ci`, PM2 start, `/health` green.
   `pm2 startup` once, so it comes back after a reboot.

Every later deploy is the same `bash server/deploy.sh`. Disaster recovery is
steps 2–5 on a new box.

## The spare (AR-58, 59)

On the venue laptop, with the registry snapshot the leader saved at sound
check (`/api/snapshot?token=<gatekeeper token>`, or the remote's "save a spare
copy"):

```
node server/server.js --spare spare-ens-xxxx.json
```

It prints its LAN address; the podium shows it as a QR; the same links work.
The spare starts every room stopped and runs on its own clock.
