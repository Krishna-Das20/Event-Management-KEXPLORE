import { motion } from 'motion/react';

const ease = [0.16, 1, 0.3, 1];

/** Fade-and-rise into view once, as the element scrolls into the viewport. */
export function Reveal({ as = 'div', delay = 0, y = 24, className, children, ...props }) {
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease, delay }}
      className={className}
      {...props}
    >
      {children}
    </Comp>
  );
}

/** Container that staggers its <StaggerItem> children. */
export function Stagger({ className, children, stagger = 0.07, delay = 0, ...props }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ className, children, ...props }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 28, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
