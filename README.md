# tizenbrew-sdb-relay

A [TizenBrew](https://github.com/reisxd/TizenBrew) module that lets you keep using `sdb` from your PC while the TV's developer-mode **Host PC IP stays at `127.0.0.1`**.

On older Samsung TVs (Tizen 3–5.5), TizenBrew and TizenTube need Host PC IP set to `127.0.0.1`. sdbd only accepts connections from that IP, so your PC can no longer connect, and you end up switching the IP back and forth.

This module runs a small TCP relay inside TizenBrew's service:

```
PC ──► TV:26102  (relay, allow-list)  ──► 127.0.0.1:26101 (sdbd)
```

sdbd sees the connection coming from `127.0.0.1` and accepts it.

## Setup

1. Edit `ALLOWED` in `service.js` to your PC's IP. Only these source addresses can connect. Anyone who can reach sdbd can install apps on the TV, so keep the list tight.
2. In TizenBrew: Module Manager (green button) → *Add GitHub module* → `<user>/tizenbrew-sdb-relay`.
3. Settings → *Autolaunch service settings* → enable this module, so the relay starts with TizenBrew.
4. Open TizenBrew once after each TV boot. Open the module to see relay status.
5. From the PC:

```sh
sdb connect <tv-ip>:26102
sdb devices
```

## Notes

- The relay is only up while TizenBrew's service is running.
- Ports: 26102 = relay (all interfaces, allow-listed), 26103 = JSON status (127.0.0.1 only).
- ES5 code, because older TVs run the service on Node.js 4.

MIT license.
