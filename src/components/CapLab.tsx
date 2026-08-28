import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PRODUCTS, fmt, productById, type ColorOpt, type Product } from "../data/products";
import { getStock, useDB } from "../lib/db";
import Reveal from "./Reveal";
import { IconBag, IconBolt, IconCheck } from "./icons";

const CAPS = PRODUCTS.filter((p) => p.category === "caps");

/* Brim color rule per cap + colorway */
function brimHexFor(p: Product, c: ColorOpt): string {
  if (p.id === "p1") return c.name === "Volt" ? "#141414" : "#c8f542";
  if (p.id === "p3") return "#202020";
  return c.name === "Grape" ? "#7a4fd6" : "#131313";
}

/* Paint the VLT/STRT bolt logo into a canvas texture */
function paintLogo(tex: THREE.CanvasTexture | null, logoColor: string) {
  if (!tex) return;
  const cv = tex.image as HTMLCanvasElement;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = logoColor;
  /* bolt */
  ctx.save();
  ctx.translate(128, 92);
  ctx.scale(6.4, 6.4);
  ctx.beginPath();
  ctx.moveTo(1.4, -10);
  ctx.lineTo(-7, 1.2);
  ctx.lineTo(-1.8, 1.2);
  ctx.lineTo(-2.6, 10);
  ctx.lineTo(6.2, -1.6);
  ctx.lineTo(0.8, -1.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  /* wordmark */
  ctx.font = "700 30px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VLT/STRT", 128, 196);
  tex.needsUpdate = true;
}

type ThreeRefs = {
  crown?: THREE.MeshStandardMaterial;
  brim?: THREE.MeshStandardMaterial;
  logoTex?: THREE.CanvasTexture;
  logoMat?: THREE.MeshBasicMaterial;
  accent?: THREE.PointLight;
  brimFlat?: THREE.Mesh;
  brimCurved?: THREE.Mesh;
  snap?: THREE.Group;
  strap?: THREE.Group;
};

/* ------------------------------ CAP LAB ---------------------------------- */
export default function CapLab({
  presetId,
  onAdd,
}: {
  presetId: string | null;
  onAdd: (p: Product, sel: { color: ColorOpt; closure: string; qty: number }) => void;
}) {
  useDB(); // re-render on stock changes
  const [capId, setCapId] = useState(presetId ?? "p1");
  const product = productById(capId) ?? CAPS[0];
  const [colorway, setColorway] = useState<ColorOpt>(product.colors[0]);
  const [closure, setClosure] = useState<string>(product.closures?.[0] ?? "Snapback");
  const [autoRotate, setAutoRotate] = useState(true);
  const [voltLight, setVoltLight] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const refs = useRef<ThreeRefs>({});
  const stateRef = useRef({
    rot: { x: -0.12, y: 0.7 },
    target: { x: -0.12, y: 0.7 },
    dist: 4.6,
    targetDist: 4.6,
    dragging: false,
    auto: true,
    px: 0,
    py: 0,
  });

  /* preset from product modal "view in 3D" */
  useEffect(() => {
    if (!presetId) return;
    const p = productById(presetId);
    if (!p) return;
    setCapId(p.id);
    setColorway(p.colors[0]);
    setClosure(p.closures?.[0] ?? "Snapback");
  }, [presetId]);

  useEffect(() => {
    const p = productById(capId);
    if (!p) return;
    setColorway(p.colors[0]);
    setClosure(p.closures?.[0] ?? "Snapback");
  }, [capId]);

  /* ------------------------- three.js scene (once) ----------------------- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const st = stateRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = "grab";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 5, 4);
    scene.add(key);
    const accent = new THREE.PointLight(0xc8f542, 42, 16, 1.6);
    accent.position.set(-3.2, 1.6, -2.6);
    scene.add(accent);
    refs.current.accent = accent;

    const group = new THREE.Group();
    scene.add(group);

    /* crown — faceted hemisphere, base plane at y=0 */
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, roughness: 0.72, metalness: 0.05, flatShading: true,
    });
    refs.current.crown = crownMat;
    const crownGeo = new THREE.SphereGeometry(1, 40, 22, 0, Math.PI * 2, 0, 1.12);
    crownGeo.scale(1, 0.85, 1);
    crownGeo.translate(0, -0.4317 * 0.85, 0);
    group.add(new THREE.Mesh(crownGeo, crownMat));

    /* button + eyelets */
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 16), crownMat);
    button.position.y = 0.85 - 0.4317 * 0.85 + 0.02;
    group.add(button);
    const eyeGeo = new THREE.SphereGeometry(0.032, 10, 8);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const eye = new THREE.Mesh(eyeGeo, crownMat);
      eye.position.set(Math.sin(a) * 0.53, 0.36, Math.cos(a) * 0.53);
      group.add(eye);
    }

    /* brims — flat (snapback) and curved (strapback) */
    const brimMat = new THREE.MeshStandardMaterial({
      color: 0xc8f542, roughness: 0.6, metalness: 0.05, flatShading: true,
    });
    refs.current.brim = brimMat;
    const arc = Math.PI * 0.36;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 1.42, -arc, arc, false);
    shape.absarc(0, 0, 0.86, arc, -arc, true);
    const flatGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
    flatGeo.rotateX(-Math.PI / 2);
    flatGeo.rotateY(Math.PI);

    const brimFlat = new THREE.Mesh(flatGeo, brimMat);
    brimFlat.position.y = -0.05;
    group.add(brimFlat);
    refs.current.brimFlat = brimFlat;

    const curveGeo = flatGeo.clone();
    const pos = curveGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.sqrt(x * x + z * z);
      pos.setY(i, pos.getY(i) - Math.max(0, d - 0.86) ** 2 * 0.3);
    }
    curveGeo.computeVertexNormals();
    const brimCurved = new THREE.Mesh(curveGeo, brimMat);
    brimCurved.position.y = -0.05;
    brimCurved.visible = false;
    group.add(brimCurved);
    refs.current.brimCurved = brimCurved;

    /* snap closure (plastic plate + prongs) */
    const snap = new THREE.Group();
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.15, 0.045),
      new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.4 }),
    );
    plate.position.set(0, 0.06, -0.8);
    snap.add(plate);
    const prongGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 8);
    [-0.07, 0.07].forEach((x) => {
      const prong = new THREE.Mesh(prongGeo, plate.material);
      prong.rotation.x = Math.PI / 2;
      prong.position.set(x, 0.06, -0.77);
      snap.add(prong);
    });
    group.add(snap);
    refs.current.snap = snap;

    /* strap closure (leather band + buckle) */
    const strap = new THREE.Group();
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x3a2c1e, roughness: 0.85 });
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.032, 10, 28, 1.3), strapMat);
    band.geometry.rotateX(Math.PI / 2);
    band.rotation.y = Math.PI / 2 + 0.65;
    band.position.y = 0.04;
    strap.add(band);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.025), strapMat);
    buckle.position.set(0, 0.04, -0.93);
    strap.add(buckle);
    strap.visible = false;
    group.add(strap);
    refs.current.strap = strap;

    /* logo decal — canvas texture */
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const logoTex = new THREE.CanvasTexture(cv);
    logoTex.colorSpace = THREE.SRGBColorSpace;
    logoTex.anisotropy = 4;
    refs.current.logoTex = logoTex;
    const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 });
    refs.current.logoMat = logoMat;
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), logoMat);
    logo.position.set(0, 0.16, 0.8);
    logo.rotation.x = -0.5;
    group.add(logo);

    /* floor shadow disc + ring */
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.25, 40),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.72;
    scene.add(shadow);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.55, 1.57, 64),
      new THREE.MeshBasicMaterial({ color: 0x2b2b2b }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.72;
    scene.add(ring);

    /* ------------------------- interaction ------------------------- */
    const dom = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      st.dragging = true;
      st.px = e.clientX;
      st.py = e.clientY;
      dom.setPointerCapture(e.pointerId);
      dom.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!st.dragging) return;
      st.target.y += (e.clientX - st.px) * 0.009;
      st.target.x = Math.max(-0.7, Math.min(0.75, st.target.x + (e.clientY - st.py) * 0.006));
      st.px = e.clientX;
      st.py = e.clientY;
    };
    const onUp = () => {
      st.dragging = false;
      dom.style.cursor = "grab";
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      st.targetDist = Math.max(2.9, Math.min(6.5, st.targetDist + e.deltaY * 0.0035));
    };
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointermove", onMove);
    dom.addEventListener("pointerup", onUp);
    dom.addEventListener("pointerleave", onUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    let raf = 0;
    const tick = (now: number) => {
      if (st.auto && !st.dragging) st.target.y += 0.0045;
      st.rot.x += (st.target.x - st.rot.x) * 0.1;
      st.rot.y += (st.target.y - st.rot.y) * 0.1;
      group.rotation.x = st.rot.x;
      group.rotation.y = st.rot.y;
      group.position.y = Math.sin(now * 0.0012) * 0.05;
      st.dist += (st.targetDist - st.dist) * 0.1;
      camera.position.set(0, 0.55, st.dist);
      camera.lookAt(0, 0.08, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerup", onUp);
      dom.removeEventListener("pointerleave", onUp);
      dom.removeEventListener("wheel", onWheel);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          Array.isArray(m) ? m.forEach((x) => x.dispose()) : m.dispose();
        }
      });
      logoTex.dispose();
      renderer.dispose();
      el.removeChild(dom);
      refs.current = {};
    };
  }, []);

  /* ----------------------- live config effects --------------------------- */
  useEffect(() => {
    const r = refs.current;
    if (!r.crown || !r.brim) return;
    r.crown.color.set(colorway.hex);
    r.brim.color.set(brimHexFor(product, colorway));
    const lum = parseInt(colorway.hex.slice(1, 3), 16) * 0.299 +
      parseInt(colorway.hex.slice(3, 5), 16) * 0.587 +
      parseInt(colorway.hex.slice(5, 7), 16) * 0.114;
    paintLogo(r.logoTex ?? null, lum > 140 ? "#0d0d0d" : "#c8f542");
  }, [colorway, product]);

  useEffect(() => {
    const r = refs.current;
    if (!r.brimFlat || !r.brimCurved || !r.snap || !r.strap) return;
    const isSnap = closure === "Snapback";
    r.brimFlat.visible = isSnap;
    r.brimCurved.visible = !isSnap;
    r.snap.visible = isSnap;
    r.strap.visible = !isSnap;
  }, [closure]);

  useEffect(() => {
    stateRef.current.auto = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    refs.current.accent?.color.set(voltLight ? 0xc8f542 : 0xa06bff);
  }, [voltLight]);

  /* ------------------------------ UI ------------------------------------- */
  const stock = getStock(product.id);
  const variant = closure;
  const left = stock[variant] ?? 0;

  return (
    <section id="lab" className="relative scroll-mt-24 overflow-hidden border-y border-seam bg-coal/60 py-16 lg:py-24">
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full bg-volt/10 blur-[130px]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-volt">
            <span className="h-px w-10 bg-volt" /> 02 — Cap lab
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-5xl leading-[0.9] sm:text-6xl lg:text-7xl">
              SPIN IT <span className="text-outline">IN 3D.</span>
            </h2>
            <p className="max-w-xs text-sm text-ash">
              Drag to rotate, scroll to zoom. Pick a cap, a colorway and a closure — then send the
              exact config to your cart.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* canvas */}
          <Reveal className="lg:col-span-7">
            <div className="relative border border-seam bg-ink">
              <div ref={containerRef} className="h-[340px] w-full sm:h-[440px] lg:h-[520px]" />
              {/* overlays */}
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 border border-seam bg-ink/80 px-3 py-1.5 backdrop-blur-sm">
                <IconBolt className="w-3.5 h-3.5 text-volt" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{product.name}</span>
              </div>
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 border border-seam bg-ink/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-ash backdrop-blur-sm">
                drag to spin · scroll to zoom
              </div>
              <div className="pointer-events-none absolute right-4 top-4 border border-seam bg-ink/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm">
                <span className={left > 0 ? "text-volt" : "text-ember"}>
                  {left > 0 ? `${left} in stock` : "sold out"}
                </span>
              </div>
            </div>
          </Reveal>

          {/* controls */}
          <Reveal delay={100} className="lg:col-span-5">
            <div className="flex h-full flex-col gap-6 border border-seam bg-panel/40 p-5 sm:p-6">
              {/* cap picker */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">Choose your cap</p>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {CAPS.map((c) => {
                    const active = c.id === product.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCapId(c.id)}
                        className={`border p-2 text-left transition-all duration-200 ${
                          active ? "border-volt bg-volt/10" : "border-seam hover:border-ash"
                        }`}
                      >
                        <img src={c.image} alt={c.name} className="aspect-square w-full object-cover" />
                        <p className={`mt-1.5 truncate text-[11px] font-bold ${active ? "text-volt" : "text-bone"}`}>
                          {c.name.replace(" Snapback", "").replace(" Dad Hat", "")}
                        </p>
                        <p className="text-[10px] text-ash">{fmt(c.price)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* colorway */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">
                  Colorway — <span className="text-bone">{colorway.name}</span>
                </p>
                <div className="mt-2.5 flex gap-2.5">
                  {product.colors.map((c) => {
                    const active = c.name === colorway.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => setColorway(c)}
                        title={c.name}
                        aria-label={`Colorway ${c.name}`}
                        className={`grid h-11 w-11 place-items-center border-2 transition-all duration-200 ${
                          active ? "scale-105 border-volt" : "border-seam hover:border-ash"
                        }`}
                        style={{ backgroundColor: `${c.hex}22` }}
                      >
                        <span className="h-6 w-6 rounded-full border border-bone/20" style={{ backgroundColor: c.hex }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* closure */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">Closure</p>
                <div className="mt-2.5 grid grid-cols-2 border border-seam">
                  {(product.closures ?? ["Snapback", "Strapback"]).map((c) => {
                    const active = closure === c;
                    const units = stock[c] ?? 0;
                    return (
                      <button
                        key={c}
                        onClick={() => setClosure(c)}
                        disabled={units === 0}
                        className={`px-4 py-3 text-left transition-all duration-200 ${
                          units === 0
                            ? "cursor-not-allowed opacity-40"
                            : active
                              ? "bg-volt text-ink"
                              : "text-bone hover:bg-panel"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-bold">
                          {active && units > 0 && <IconCheck className="w-3.5 h-3.5" />}
                          {c}
                        </span>
                        <span className={`text-[11px] ${active && units > 0 ? "text-ink/60" : units === 0 ? "text-ember" : "text-ash"}`}>
                          {units === 0 ? "sold out" : c === "Snapback" ? "flat brim · snap" : "curved brim · strap"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* toggles */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAutoRotate((v) => !v)}
                  className={`border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    autoRotate ? "border-volt text-volt" : "border-seam text-ash hover:border-ash"
                  }`}
                >
                  Auto-spin {autoRotate ? "on" : "off"}
                </button>
                <button
                  onClick={() => setVoltLight((v) => !v)}
                  className={`border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    voltLight ? "border-volt text-volt" : "border-grape text-grape"
                  }`}
                >
                  Light: {voltLight ? "Volt" : "Grape"}
                </button>
              </div>

              {/* add to cart */}
              <div className="mt-auto border-t border-seam pt-5">
                <div className="flex items-baseline justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">This config</p>
                  <p className="font-display text-3xl text-volt">{fmt(product.price)}</p>
                </div>
                <p className="mt-1 text-[12px] text-ash">
                  {product.name} · {colorway.name} · {closure}
                </p>
                <button
                  onClick={() => onAdd(product, { color: colorway, closure, qty: 1 })}
                  disabled={left === 0}
                  className="group mt-4 flex w-full items-center justify-center gap-3 bg-volt py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-ink transition-all duration-200 enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-seam disabled:text-ash"
                >
                  <IconBag className="w-4 h-4" />
                  {left === 0 ? "Sold out" : "Add this cap to cart"}
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
