import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Emblema vetorial do Clutch Racing, animado:
 *  - contorno "desenhando" + preenchimento surgindo ao entrar
 *  - flutuacao continua
 *  - leve inclinacao 3D acompanhando o mouse
 */
export default function Emblem({ className = '' }) {
  const [svg, setSvg] = useState(null); // { viewBox, paths: [] }
  const wrapRef = useRef(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 18 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 18 });
  const echoX = useSpring(useTransform(mx, [-0.5, 0.5], [14, -14]), { stiffness: 80, damping: 20 });
  const echoY = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 80, damping: 20 });

  useEffect(() => {
    let alive = true;
    fetch('/emblem.svg')
      .then((r) => r.text())
      .then((txt) => {
        if (!alive) return;
        const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
        const root = doc.querySelector('svg');
        const paths = [...doc.querySelectorAll('path')].map((p) => p.getAttribute('d'));
        setSvg({ viewBox: root?.getAttribute('viewBox') || '0 0 1024 500', paths });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  function onMove(e) {
    const el = wrapRef.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    mx.set((e.clientX - b.left) / b.width - 0.5);
    my.set((e.clientY - b.top) / b.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  if (!svg) return <div className={className} />;

  const draw = {
    hidden: { pathLength: 0, fillOpacity: 0 },
    visible: (i) => ({
      pathLength: 1,
      fillOpacity: 1,
      transition: {
        pathLength: { duration: 1.6, delay: i * 0.15, ease: 'easeInOut' },
        fillOpacity: { duration: 0.8, delay: 0.6 + i * 0.15 },
      },
    }),
  };

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`emblem [perspective:1000px] ${className}`}
    >
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="[transform-style:preserve-3d]"
      >
        <motion.div style={{ rotateX: rotX, rotateY: rotY }} className="relative [transform-style:preserve-3d]">
          {/* echo / sombra */}
          <motion.svg
            viewBox={svg.viewBox}
            aria-hidden
            className="absolute inset-0 text-primary/25 blur-[1px]"
            style={{ x: echoX, y: echoY, translateZ: -60 }}
          >
            {svg.paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </motion.svg>
          {/* logo principal */}
          <motion.svg
            viewBox={svg.viewBox}
            role="img"
            aria-label="Clutch Racing"
            className="relative text-foreground"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {svg.paths.map((d, i) => (
              <motion.path key={i} d={d} custom={i} variants={draw} />
            ))}
          </motion.svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
