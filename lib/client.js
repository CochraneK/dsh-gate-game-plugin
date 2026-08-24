window.__ModuleLoader__.load({
	id: "dsh-gate-game",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");

		// ── CSS injection (once per page) ──────────────────────────────────────
		const css = `
.dsg-lock-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;background:transparent;cursor:pointer;padding:0;border-radius:6px;transition:background .15s;flex:none}
.dsg-lock-btn:hover{background:rgba(77,107,254,.12)}
.dsg-lock-btn img{width:16px;height:16px;pointer-events:none}
.dsg-overlay{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif}
.dsg-sky{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.dsg-fall{position:absolute;top:0;left:0;animation-name:dsgFall;animation-timing-function:linear;animation-iteration-count:1;will-change:transform;filter:brightness(0) drop-shadow(0 1px 2px rgba(0,0,0,.18))}
@keyframes dsgFall{0%{transform:translateY(-14vh)}100%{transform:translateY(116vh)}}
.dsg-biglogo{position:fixed;left:50%;top:50%;width:56px;height:56px;transform:translate(-50%,-50%);pointer-events:none;z-index:2147483647;filter:drop-shadow(0 0 7px rgba(77,107,254,.8)) drop-shadow(0 0 3px rgba(77,107,254,.55));transition:width .25s ease,height .25s ease}
.dsg-score{position:fixed;top:18px;right:20px;z-index:2147483646;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;font-size:15px;font-weight:700;color:#4D6BFE;background:#fff;border:1px solid rgba(77,107,254,.35);border-radius:999px;padding:8px 16px;box-shadow:0 6px 18px rgba(77,107,254,.18);transition:transform .14s ease}
.dsg-unlock{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);z-index:2147483646;padding:12px 32px;font-size:15px;font-weight:600;color:#fff;background:#4D6BFE;border:none;border-radius:10px;cursor:pointer;transition:background .15s}
.dsg-unlock:hover{background:#3a56e0}
.dsg-strain{animation:dsgShake .16s linear infinite}
@keyframes dsgShake{0%,100%{margin-left:0;margin-top:0}25%{margin-left:-3px;margin-top:2px}50%{margin-left:3px;margin-top:-2px}75%{margin-left:-2px;margin-top:-3px}}
.dsg-shard{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;will-change:transform,opacity}
.dsg-shockwave{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid rgba(77,107,254,.65);border-radius:50%;transform:translate(-50%,-50%) scale(0);opacity:1;animation:dsgShock .55s ease-out forwards}
@keyframes dsgShock{0%{transform:translate(-50%,-50%) scale(0);opacity:1}100%{transform:translate(-50%,-50%) scale(1);opacity:0}}
.dsg-flash{position:fixed;inset:0;z-index:2147483645;pointer-events:none;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(255,255,255,.4) 55%,rgba(255,255,255,0) 80%);opacity:1;transition:opacity .45s ease}
.dsg-rebirth{animation:dsgRebirth .6s cubic-bezier(.34,1.56,.64,1) both}
@keyframes dsgRebirth{0%{transform:translate(-50%,-50%) scale(0)}60%{transform:translate(-50%,-50%) scale(1.25)}80%{transform:translate(-50%,-50%) scale(.92)}100%{transform:translate(-50%,-50%) scale(1)}}
`;
		const tagId = "dsh-gate-game/styles";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-gate-game";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		// ── Game engine (imperative, runs inside the overlay) ──────────────────
		const LOGO_SRC = "/favicon.svg";
		const BASE = 56;
		const BURST_AT = 360;
		const STRAIN_AT = Math.round(BURST_AT * 0.72);

		function sizeFromScore(score) { return BASE + score * 2 + Math.floor(score * score / 30); }

		// ── GameOverlay component ──────────────────────────────────────────────
		function GameOverlay(props) {
			const { onUnlock } = props;
			const skyRef = (0, react.useRef)(null);
			const bigRef = (0, react.useRef)(null);
			const scoreRef = (0, react.useRef)(null);
			const stateRef = (0, react.useRef)({ score: 0, smalls: [], rafId: null, spawnTimer: null, bursting: false, clean: false });

			(0, react.useEffect)(() => {
				const st = stateRef.current;
				const sky = skyRef.current;
				const big = bigRef.current;
				const scoreEl = scoreRef.current;
				if (!sky || !big || !scoreEl) return;

				function setBigSize(px) { big.style.width = px + "px"; big.style.height = px + "px"; }

				function spawn() {
					if (st.clean || st.smalls.length > 26) return;
					const img = document.createElement("img");
					img.src = LOGO_SRC;
					img.className = "dsg-fall";
					const size = 22 + Math.random() * 18;
					img.style.width = size + "px";
					img.style.height = size + "px";
					img.style.left = (Math.random() * 100) + "vw";
					img.style.animationDuration = (3.4 + Math.random() * 3.2) + "s";
					sky.appendChild(img);
					const rec = { el: img, dead: false };
					st.smalls.push(rec);
					setTimeout(() => {
						if (rec.dead) return;
						rec.dead = true;
						const i = st.smalls.indexOf(rec); if (i >= 0) st.smalls.splice(i, 1);
						if (img.parentNode) img.parentNode.removeChild(img);
					}, 7200);
				}

				function burst() {
					if (st.bursting) return;
					st.bursting = true;
					const br = big.getBoundingClientRect();
					const cx = br.left + br.width / 2, cy = br.top + br.height / 2;
					big.classList.remove("dsg-strain");
					big.style.display = "none";
					scoreEl.textContent = "\uD83D\uDCA5 \u5403\u6491\u4E86\uFF01";
					for (let s = 0; s < 18; s++) {
						const sh = document.createElement("img");
						sh.src = LOGO_SRC;
						sh.className = "dsg-shard";
						const ssz = 14 + Math.random() * 26;
						sh.style.width = ssz + "px"; sh.style.height = ssz + "px";
						sh.style.left = cx + "px"; sh.style.top = cy + "px";
						sh.style.filter = (Math.random() < 0.5 ? "brightness(0) " : "") + "drop-shadow(0 0 4px rgba(77,107,254,.6))";
						document.body.appendChild(sh);
						const ang = Math.random() * Math.PI * 2;
						const dist = 120 + Math.random() * 260;
						const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 60;
						const rot = Math.random() * 720 - 360;
						sh.style.transition = "transform .7s cubic-bezier(.17,.67,.4,1), opacity .7s ease";
						sh.getBoundingClientRect();
						sh.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + rot + "deg) scale(.2)";
						sh.style.opacity = "0";
						setTimeout(() => { if (sh.parentNode) sh.parentNode.removeChild(sh); }, 750);
					}
					const wave = document.createElement("div");
					wave.className = "dsg-shockwave";
					wave.style.left = cx + "px"; wave.style.top = cy + "px";
					wave.style.width = "340px"; wave.style.height = "340px";
					document.body.appendChild(wave);
					setTimeout(() => { if (wave.parentNode) wave.parentNode.removeChild(wave); }, 620);
					const fl = document.createElement("div");
					fl.className = "dsg-flash";
					document.body.appendChild(fl);
					setTimeout(() => { fl.style.opacity = "0"; }, 60);
					setTimeout(() => { if (fl.parentNode) fl.parentNode.removeChild(fl); }, 560);
					setTimeout(() => {
						st.score = 0;
						scoreEl.textContent = "\u5DF2\u541E\u566C 0";
						big.classList.remove("dsg-strain");
						big.style.filter = "";
						setBigSize(BASE);
						big.style.display = "";
						big.classList.add("dsg-rebirth");
						setTimeout(() => { big.classList.remove("dsg-rebirth"); st.bursting = false; }, 650);
					}, 620);
				}

				function loop() {
					if (st.clean) return;
					const br = big.getBoundingClientRect();
					const bcx = br.left + br.width / 2, bcy = br.top + br.height / 2;
					const brR = br.width / 2;
					for (let i = st.smalls.length - 1; i >= 0; i--) {
						const r = st.smalls[i]; if (r.dead) continue;
						const sr = r.el.getBoundingClientRect();
						const scx = sr.left + sr.width / 2, scy = sr.top + sr.height / 2;
						const d = Math.sqrt((scx - bcx) * (scx - bcx) + (scy - bcy) * (scy - bcy));
						if (d < brR * 0.62 + sr.width / 2) {
							r.dead = true; st.smalls.splice(i, 1);
							st.score++;
							scoreEl.textContent = "\u5DF2\u541E\u566C " + st.score;
							scoreEl.style.transform = "scale(1.18)";
							setTimeout(() => { scoreEl.style.transform = "scale(1)"; }, 140);
							if (!st.bursting) {
								const ns = sizeFromScore(st.score);
								setBigSize(ns);
								if (ns >= BURST_AT) burst();
								else if (ns >= STRAIN_AT) {
									big.classList.add("dsg-strain");
									big.style.filter = "drop-shadow(0 0 9px rgba(229,72,77,.85)) drop-shadow(0 0 3px rgba(229,72,77,.6)) hue-rotate(-40deg) saturate(1.6)";
								}
							}
							const el = r.el;
							el.style.animation = "none";
							el.style.transition = "transform .18s ease, opacity .18s ease";
							el.style.transform = "translateY(" + (scy - br.top) + "px) scale(0)";
							el.style.opacity = "0";
							setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
						}
					}
					st.rafId = requestAnimationFrame(loop);
				}

				function onMouseMove(e) {
					big.style.left = e.clientX + "px";
					big.style.top = e.clientY + "px";
				}
				document.addEventListener("mousemove", onMouseMove);
				big.style.left = "50%"; big.style.top = "50%";
				st.spawnTimer = setInterval(spawn, 240);
				for (let k = 0; k < 8; k++) setTimeout(spawn, k * 120);
				st.rafId = requestAnimationFrame(loop);

				return () => {
					st.clean = true;
					document.removeEventListener("mousemove", onMouseMove);
					if (st.spawnTimer) clearInterval(st.spawnTimer);
					if (st.rafId) cancelAnimationFrame(st.rafId);
					for (const r of st.smalls) { if (r.el.parentNode) r.el.parentNode.removeChild(r.el); }
					st.smalls.length = 0;
				};
			}, []);

			return (0, react_jsx_runtime.jsxs)("div", { className: "dsg-overlay", children: [
				(0, react_jsx_runtime.jsx)("div", { className: "dsg-sky", ref: skyRef }),
				(0, react_jsx_runtime.jsx)("div", { className: "dsg-score", ref: scoreRef, children: "\u5DF2\u541E\u566C 0" }),
				(0, react_jsx_runtime.jsx)("img", { className: "dsg-biglogo", ref: bigRef, src: LOGO_SRC, alt: "" }),
				(0, react_jsx_runtime.jsx)("button", { className: "dsg-unlock", onClick: onUnlock, children: "\u89E3\u9501" })
			]});
		}

		// ── Lock button component (sidebar footer) ─────────────────────────────
		function LockButton(props) {
			const [locked, setLocked] = (0, react.useState)(false);
			const wide = props.wide;

			const handleLock = () => setLocked(true);
			const handleUnlock = () => setLocked(false);

			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)("button", {
					className: "dsg-lock-btn",
					title: "\u9501\u5C4F",
					onClick: handleLock,
					children: (0, react_jsx_runtime.jsx)("img", { src: LOGO_SRC, alt: "" })
				}),
				locked ? (0, react_jsx_runtime.jsx)(GameOverlay, { onUnlock: handleUnlock }) : null
			]});
		}

		// ── Plugin entry ───────────────────────────────────────────────────────
		const inject = ["slots"];

		function apply(ctx) {
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "dsh-gate-game-lock"
			}, LockButton));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
