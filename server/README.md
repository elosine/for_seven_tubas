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

## The box (AR-55) — piece #1's Hetzner VPS, shared

The string quartet's box (its `docs/MAINTENANCE.md`): Hetzner CPX11,
`5.161.233.35`, Ubuntu, Node 20, nginx + certbot, PM2 under the `deploy` user
with systemd. The quartet runs there as PM2 `sq1-server` on
`justinwenloyang.com/string-quartet-no1`. The tubas run BESIDE it as PM2
`stand-server` on port 5300, on the subdomain **`tubas.justinwenloyang.com`**
(a subdomain, not a path: the stand's asset paths and `/socket.io/` are
absolute and must not collide with the quartet's).

SSH from the PC: `ssh -i C:\Users\jwloy\.ssh\id_ed25519 root@5.161.233.35 "…"`
— one line, the same in Command Prompt and PowerShell, bash inside the quotes.

### First deploy (once)

1. **DNS** (Cloudflare, where the domain is registered): an A record, name
   `tubas`, content `5.161.233.35`, proxy OFF ("DNS only" — the clock samples
   must not pass through Cloudflare's proxy).
2. **Clone, install, start** (as `deploy`; the repository is public):
   ```
   ssh -i C:\Users\jwloy\.ssh\id_ed25519 root@5.161.233.35 "su - deploy -c 'git clone --depth 1 https://github.com/elosine/for_seven_tubas.git /home/deploy/tubas && cd /home/deploy/tubas && npm ci --omit=dev && pm2 start server/ecosystem.config.js && pm2 save && sleep 2 && curl -s http://127.0.0.1:5300/health'"
   ```
   Ends with `{"ok":true,…}`. `pm2 save` adds `stand-server` to the dump the
   existing systemd unit resurrects after a reboot.
3. **nginx + HTTPS** (as root; certbot reuses the box's Let's Encrypt account):
   ```
   ssh -i C:\Users\jwloy\.ssh\id_ed25519 root@5.161.233.35 "cp /home/deploy/tubas/server/nginx.conf.example /etc/nginx/sites-available/tubas && sed -i 's/stand.example.org/tubas.justinwenloyang.com/' /etc/nginx/sites-available/tubas && ln -sf /etc/nginx/sites-available/tubas /etc/nginx/sites-enabled/tubas && nginx -t && systemctl reload nginx && certbot --nginx -d tubas.justinwenloyang.com --non-interactive --redirect"
   ```
4. **Health through the domain, and the admin key:**
   ```
   ssh -i C:\Users\jwloy\.ssh\id_ed25519 root@5.161.233.35 "curl -s https://tubas.justinwenloyang.com/health && echo && cat /home/deploy/tubas/server/data/admin.key"
   ```
5. **The piece and the first ensemble**, from the PC with that key:
   ```
   node C:\Users\jwloy\GitHub\for_seven_tubas\tools\admin.js --server https://tubas.justinwenloyang.com --key KEY register tubas "for seven tubas" db1
   node C:\Users\jwloy\GitHub\for_seven_tubas\tools\admin.js --server https://tubas.justinwenloyang.com --key KEY create "Test ensemble" tubas
   ```
   `create` prints the links. A player's link opened on the iPad shows that
   part over HTTPS.

The server needs no domain setting: behind nginx (`TRUST_PROXY=1`, set in
`ecosystem.config.js`) it prints links from the request's own host and scheme.

### Every later deploy

```
ssh -i C:\Users\jwloy\.ssh\id_ed25519 root@5.161.233.35 "su - deploy -c 'cd /home/deploy/tubas && bash server/deploy.sh'"
```

(pull → `npm ci` → PM2 restart → `/health`.) Disaster recovery on a new box:
steps 2–5, after `apt install nginx certbot python3-certbot-nginx`, Node 20,
`npm i -g pm2`, a `deploy` user, `pm2 startup`.

## The spare (AR-58, 59)

On the venue laptop, with the registry snapshot the leader saved at sound
check (`/api/snapshot?token=<gatekeeper token>`, or the remote's "save a spare
copy"):

```
node server/server.js --spare spare-ens-xxxx.json
```

It prints its LAN address; the podium shows it as a QR; the same links work.
The spare starts every room stopped and runs on its own clock.
