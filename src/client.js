window.__ModuleLoader__.load({
	id: "dsh-gate-game",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");

		const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6d8bff"/><stop offset="1" stop-color="#3154ea"/></linearGradient></defs><circle cx="32" cy="32" r="29" fill="url(#g)"/><path d="M19 22h14c8.5 0 14 4.3 14 10s-5.5 10-14 10H19V22Zm8 6v8h6c4.1 0 6.5-1.5 6.5-4S37.1 28 33 28h-6Z" fill="white"/><circle cx="46" cy="20" r="4" fill="#cfe0ff"/></svg>`;
		const LOGO_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(LOGO_SVG)}`;
		const BASE = 56;
		const BURST_AT = 360;
		const STRAIN_AT = Math.round(BURST_AT * 0.72);
		const MAX_FALLING = 30;
		const STORAGE_KEY = "dsh-gate-game.best";

		function sizeFromScore(score) { return BASE + score * 2 + Math.floor(score * score / 30); }
		function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
		function prefersReducedMotion() {
			return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		}
		function labels() {
			const zh = typeof navigator !== "undefined" && /^zh\b/i.test(navigator.language || "");
			return zh ? {
				open: "休息游戏",
				close: "返回工作",
				score: "已吞噬",
				best: "最佳",
				burst: "💥 吃撑了！",
				hint: "移动鼠标、触控或使用方向键 / WASD 吃掉下落图标。",
				dialog: "休息小游戏（非安全锁屏）",
			} : {
				open: "Break game",
				close: "Back to work",
				score: "Eaten",
				best: "Best",
				burst: "💥 Too full!",
				hint: "Move the pointer, touch the screen, or use arrow keys / WASD to eat falling icons.",
				dialog: "Break mini-game (not a security lock)",
			};
		}

		const css = `
.dsg-lock-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:0;background:transparent;cursor:pointer;padding:0;border-radius:8px;transition:background .15s,transform .15s;flex:none}
.dsg-lock-btn:hover{background:rgba(77,107,254,.12);transform:translateY(-1px)}
.dsg-lock-btn:focus-visible,.dsg-unlock:focus-visible{outline:2px solid #4D6BFE;outline-offset:2px}
.dsg-lock-btn img{width:18px;height:18px;pointer-events:none}
.dsg-overlay{--dsg-bg:#fff;--dsg-fg:#172033;--dsg-card:rgba(255,255,255,.88);position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:var(--dsg-bg);color:var(--dsg-fg);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;touch-action:none;overscroll-behavior:none;user-select:none}
.dsg-sky{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.dsg-fall{position:absolute;left:0;top:0;will-change:transform;filter:drop-shadow(0 2px 3px rgba(0,0,0,.18))}
.dsg-biglogo{position:fixed;left:0;top:0;width:56px;height:56px;transform:translate(-50%,-50%);pointer-events:none;z-index:2147483647;filter:drop-shadow(0 0 7px rgba(77,107,254,.8)) drop-shadow(0 0 3px rgba(77,107,254,.55));transition:width .2s ease,height .2s ease,filter .2s ease;will-change:left,top,width,height}
.dsg-hud{position:fixed;top:18px;right:20px;z-index:2147483646;pointer-events:none;display:flex;gap:8px;align-items:center}
.dsg-pill{font-size:14px;font-weight:700;color:#4D6BFE;background:var(--dsg-card);border:1px solid rgba(77,107,254,.28);border-radius:999px;padding:8px 13px;box-shadow:0 6px 18px rgba(77,107,254,.14);backdrop-filter:blur(8px);transition:transform .14s ease}
.dsg-hint{position:fixed;left:50%;top:20px;transform:translateX(-50%);z-index:2147483646;pointer-events:none;max-width:min(620px,72vw);text-align:center;font-size:13px;line-height:1.45;opacity:.62}
.dsg-unlock{position:fixed;bottom:max(28px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:2147483646;padding:11px 26px;font-size:14px;font-weight:700;color:#fff;background:#4D6BFE;border:0;border-radius:10px;cursor:pointer;box-shadow:0 10px 28px rgba(77,107,254,.25);transition:background .15s,transform .15s}
.dsg-unlock:hover{background:#3a56e0;transform:translateX(-50%) translateY(-1px)}
.dsg-strain{animation:dsgShake .16s linear infinite}
@keyframes dsgShake{0%,100%{margin-left:0;margin-top:0}25%{margin-left:-3px;margin-top:2px}50%{margin-left:3px;margin-top:-2px}75%{margin-left:-2px;margin-top:-3px}}
.dsg-shard{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;will-change:transform,opacity}
.dsg-shockwave{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid rgba(77,107,254,.65);border-radius:50%;transform:translate(-50%,-50%) scale(0);opacity:1;animation:dsgShock .55s ease-out forwards}
@keyframes dsgShock{to{transform:translate(-50%,-50%) scale(1);opacity:0}}
.dsg-flash{position:fixed;inset:0;z-index:2147483645;pointer-events:none;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(255,255,255,.35) 55%,rgba(255,255,255,0) 80%);opacity:1;transition:opacity .42s ease}
.dsg-rebirth{animation:dsgRebirth .6s cubic-bezier(.34,1.56,.64,1) both}
@keyframes dsgRebirth{0%{transform:translate(-50%,-50%) scale(0)}60%{transform:translate(-50%,-50%) scale(1.25)}80%{transform:translate(-50%,-50%) scale(.92)}100%{transform:translate(-50%,-50%) scale(1)}}
@media (prefers-color-scheme:dark){.dsg-overlay{--dsg-bg:#111522;--dsg-fg:#eef2ff;--dsg-card:rgba(24,30,48,.9)}}
@media (prefers-reduced-motion:reduce){.dsg-strain,.dsg-rebirth{animation:none}.dsg-biglogo,.dsg-pill,.dsg-unlock,.dsg-lock-btn{transition:none}.dsg-flash{display:none}}
@media (max-width:640px){.dsg-hud{top:max(12px,env(safe-area-inset-top));right:12px}.dsg-hint{top:58px;max-width:86vw}.dsg-pill{font-size:12px;padding:7px 10px}}
`;
		const tagId = "dsh-gate-game/styles-v2";
		if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css=${JSON.stringify(tagId)}]`) === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-gate-game";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		function GameOverlay({ onUnlock }) {
			const skyRef = (0, react.useRef)(null);
			const bigRef = (0, react.useRef)(null);
			const scoreRef = (0, react.useRef)(null);
			const bestRef = (0, react.useRef)(null);
			const closeRef = (0, react.useRef)(null);
			const copy = labels();
			const stateRef = (0, react.useRef)({
				score: 0, best: 0, smalls: [], rafId: null, spawnTimer: null,
				timers: new Set(), tempNodes: new Set(), bursting: false, clean: false,
				paused: false, reduced: false, lastTs: 0, x: 0, y: 0, bigSize: BASE,
			});

			(0, react.useEffect)(() => {
				const st = stateRef.current;
				const sky = skyRef.current;
				const big = bigRef.current;
				const scoreEl = scoreRef.current;
				const bestEl = bestRef.current;
				const closeEl = closeRef.current;
				if (!sky || !big || !scoreEl || !bestEl || !closeEl) return;
				st.clean = false;
				st.reduced = prefersReducedMotion();
				st.x = window.innerWidth / 2;
				st.y = window.innerHeight / 2;
				try { st.best = Math.max(0, Number(localStorage.getItem(STORAGE_KEY)) || 0); } catch {}

				const schedule = (fn, ms) => {
					const id = setTimeout(() => { st.timers.delete(id); if (!st.clean) fn(); }, ms);
					st.timers.add(id);
					return id;
				};
				const addTemp = (el) => { st.tempNodes.add(el); document.body.appendChild(el); return el; };
				const removeTemp = (el) => { st.tempNodes.delete(el); if (el.parentNode) el.parentNode.removeChild(el); };
				const setBigPosition = () => { big.style.left = `${st.x}px`; big.style.top = `${st.y}px`; };
				const setBigSize = (px) => { st.bigSize = px; big.style.width = `${px}px`; big.style.height = `${px}px`; };
				const renderHud = () => {
					scoreEl.textContent = `${copy.score} ${st.score}`;
					bestEl.textContent = `${copy.best} ${st.best}`;
				};
				const removeSmall = (record) => {
					const i = st.smalls.indexOf(record);
					if (i >= 0) st.smalls.splice(i, 1);
					if (record.el.parentNode) record.el.parentNode.removeChild(record.el);
				};

				function spawn() {
					if (st.clean || st.paused || st.bursting || st.smalls.length >= MAX_FALLING) return;
					const img = document.createElement("img");
					img.src = LOGO_SRC;
					img.alt = "";
					img.className = "dsg-fall";
					const size = 22 + Math.random() * 18;
					const rec = {
						el: img, size, x: Math.random() * Math.max(1, window.innerWidth - size), y: -size - Math.random() * 80,
						speed: (st.reduced ? 70 : 90) + Math.random() * 55, rot: Math.random() * 360, spin: (Math.random() - .5) * 120,
					};
					img.style.width = `${size}px`;
					img.style.height = `${size}px`;
					sky.appendChild(img);
					st.smalls.push(rec);
				}

				function resetAfterBurst() {
					st.score = 0;
					renderHud();
					big.classList.remove("dsg-strain");
					big.style.filter = "";
					setBigSize(BASE);
					big.style.display = "";
					if (!st.reduced) big.classList.add("dsg-rebirth");
					schedule(() => { big.classList.remove("dsg-rebirth"); st.bursting = false; }, st.reduced ? 80 : 620);
				}

				function burst() {
					if (st.bursting) return;
					st.bursting = true;
					big.classList.remove("dsg-strain");
					big.style.display = "none";
					scoreEl.textContent = copy.burst;
					if (st.reduced) { schedule(resetAfterBurst, 220); return; }
					const cx = st.x, cy = st.y;
					for (let s = 0; s < 18; s += 1) {
						const sh = document.createElement("img");
						sh.src = LOGO_SRC; sh.alt = ""; sh.className = "dsg-shard";
						const ssz = 14 + Math.random() * 26;
						sh.style.width = `${ssz}px`; sh.style.height = `${ssz}px`;
						sh.style.left = `${cx}px`; sh.style.top = `${cy}px`;
						addTemp(sh);
						const ang = Math.random() * Math.PI * 2;
						const dist = 120 + Math.random() * 260;
						const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 60;
						const rot = Math.random() * 720 - 360;
						sh.style.transition = "transform .7s cubic-bezier(.17,.67,.4,1),opacity .7s ease";
						requestAnimationFrame(() => {
							sh.style.transform = `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(.2)`;
							sh.style.opacity = "0";
						});
						schedule(() => removeTemp(sh), 760);
					}
					const wave = addTemp(document.createElement("div"));
					wave.className = "dsg-shockwave"; wave.style.left = `${cx}px`; wave.style.top = `${cy}px`; wave.style.width = "340px"; wave.style.height = "340px";
					schedule(() => removeTemp(wave), 620);
					const flash = addTemp(document.createElement("div"));
					flash.className = "dsg-flash";
					schedule(() => { flash.style.opacity = "0"; }, 60);
					schedule(() => removeTemp(flash), 560);
					schedule(resetAfterBurst, 620);
				}

				function eat(record) {
					removeSmall(record);
					st.score += 1;
					if (st.score > st.best) {
						st.best = st.score;
						try { localStorage.setItem(STORAGE_KEY, String(st.best)); } catch {}
					}
					renderHud();
					scoreEl.style.transform = "scale(1.14)";
					schedule(() => { scoreEl.style.transform = "scale(1)"; }, 120);
					if (st.bursting) return;
					const nextSize = sizeFromScore(st.score);
					setBigSize(nextSize);
					if (nextSize >= BURST_AT) burst();
					else if (nextSize >= STRAIN_AT) {
						big.classList.add("dsg-strain");
						big.style.filter = "drop-shadow(0 0 9px rgba(229,72,77,.85)) drop-shadow(0 0 3px rgba(229,72,77,.6)) hue-rotate(-40deg) saturate(1.6)";
					}
				}

				function loop(ts) {
					if (st.clean) return;
					const dt = st.lastTs ? Math.min((ts - st.lastTs) / 1000, .05) : 0;
					st.lastTs = ts;
					if (!st.paused) {
						const bigR = st.bigSize * .31;
						for (let i = st.smalls.length - 1; i >= 0; i -= 1) {
							const r = st.smalls[i];
							r.y += r.speed * dt; r.rot += r.spin * dt;
							r.el.style.transform = `translate3d(${r.x}px,${r.y}px,0) rotate(${r.rot}deg)`;
							if (r.y > window.innerHeight + r.size) { removeSmall(r); continue; }
							if (st.bursting) continue;
							const dx = r.x + r.size / 2 - st.x;
							const dy = r.y + r.size / 2 - st.y;
							const hit = bigR + r.size * .46;
							if (dx * dx + dy * dy < hit * hit) eat(r);
						}
					}
					st.rafId = requestAnimationFrame(loop);
				}

				function onPointer(e) {
					st.x = clamp(e.clientX, 0, window.innerWidth);
					st.y = clamp(e.clientY, 0, window.innerHeight);
					setBigPosition();
				}
				function onKey(e) {
					const key = String(e.key || "").toLowerCase();
					if (key === "escape") { e.preventDefault(); onUnlock(); return; }
					let dx = 0, dy = 0;
					if (key === "arrowleft" || key === "a") dx = -30;
					else if (key === "arrowright" || key === "d") dx = 30;
					else if (key === "arrowup" || key === "w") dy = -30;
					else if (key === "arrowdown" || key === "s") dy = 30;
					else return;
					e.preventDefault();
					st.x = clamp(st.x + dx, 0, window.innerWidth);
					st.y = clamp(st.y + dy, 0, window.innerHeight);
					setBigPosition();
				}
				function onVisibility() { st.paused = document.hidden; st.lastTs = 0; }
				function onResize() {
					st.x = clamp(st.x, 0, window.innerWidth);
					st.y = clamp(st.y, 0, window.innerHeight);
					setBigPosition();
				}

				document.addEventListener("pointermove", onPointer, { passive: true });
				document.addEventListener("pointerdown", onPointer, { passive: true });
				document.addEventListener("keydown", onKey);
				document.addEventListener("visibilitychange", onVisibility);
				window.addEventListener("resize", onResize);
				setBigPosition(); renderHud(); closeEl.focus();
				st.spawnTimer = setInterval(spawn, st.reduced ? 430 : 240);
				for (let k = 0; k < (st.reduced ? 4 : 8); k += 1) schedule(spawn, k * 130);
				st.rafId = requestAnimationFrame(loop);

				return () => {
					st.clean = true;
					document.removeEventListener("pointermove", onPointer);
					document.removeEventListener("pointerdown", onPointer);
					document.removeEventListener("keydown", onKey);
					document.removeEventListener("visibilitychange", onVisibility);
					window.removeEventListener("resize", onResize);
					if (st.spawnTimer) clearInterval(st.spawnTimer);
					if (st.rafId) cancelAnimationFrame(st.rafId);
					for (const id of st.timers) clearTimeout(id);
					st.timers.clear();
					for (const record of [...st.smalls]) removeSmall(record);
					for (const node of st.tempNodes) if (node.parentNode) node.parentNode.removeChild(node);
					st.tempNodes.clear();
				};
			}, []);

			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsg-overlay", role: "dialog", "aria-modal": "true", "aria-label": copy.dialog,
				children: [
					(0, react_jsx_runtime.jsx)("div", { className: "dsg-sky", ref: skyRef, "aria-hidden": "true" }),
					(0, react_jsx_runtime.jsxs)("div", { className: "dsg-hud", children: [
						(0, react_jsx_runtime.jsx)("div", { className: "dsg-pill", ref: scoreRef, "aria-live": "polite" }),
						(0, react_jsx_runtime.jsx)("div", { className: "dsg-pill", ref: bestRef }),
					] }),
					(0, react_jsx_runtime.jsx)("div", { className: "dsg-hint", children: copy.hint }),
					(0, react_jsx_runtime.jsx)("img", { className: "dsg-biglogo", ref: bigRef, src: LOGO_SRC, alt: "" }),
					(0, react_jsx_runtime.jsx)("button", { className: "dsg-unlock", ref: closeRef, onClick: onUnlock, children: copy.close }),
				],
			});
		}

		function LockButton() {
			const [locked, setLocked] = (0, react.useState)(false);
			const copy = labels();
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)("button", {
					className: "dsg-lock-btn", title: copy.open, "aria-label": copy.open,
					onClick: () => setLocked(true),
					children: (0, react_jsx_runtime.jsx)("img", { src: LOGO_SRC, alt: "" }),
				}),
				locked ? (0, react_jsx_runtime.jsx)(GameOverlay, { onUnlock: () => setLocked(false) }) : null,
			] });
		}

		const inject = ["slots"];
		function apply(ctx) {
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "dsh-gate-game-break",
			}, LockButton));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
