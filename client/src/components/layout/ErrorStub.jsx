import { motion } from 'motion/react';

/** A voided ticket stub — shared by the 404 page and the router error boundary. */
export function Stub({ code, title, body, children }) {
  return (
    <div className="container-x flex min-h-[80vh] flex-col items-center justify-center pt-28 text-center">
      <motion.div
        initial={{ rotate: -8, y: 30, opacity: 0 }}
        animate={{ rotate: -4, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
        className="relative mb-10 flex overflow-hidden rounded-[28px] border border-line bg-surface shadow-card"
      >
        <div className="px-10 py-8">
          <div className="font-mono text-xs tracking-[0.3em] text-muted">ADMIT ONE</div>
          <div className="font-display-tight text-[7rem] leading-none font-black">{code}</div>
        </div>
        <div className="perforation-y my-4" />
        <div className="grid place-items-center bg-accent px-6 font-mono text-xs font-bold tracking-[0.25em] text-accent-fg [writing-mode:vertical-rl]">
          VOID
        </div>
      </motion.div>
      <h1 className="font-display-tight text-5xl font-bold">{title}</h1>
      <p className="mt-3 max-w-md text-muted">{body}</p>
      <div className="mt-8 flex gap-3">{children}</div>
    </div>
  );
}
