"use client";

import {motion, useReducedMotion} from "motion/react";
import {usePathname} from "@/i18n/navigation";

export function PageReveal({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  return <motion.div key={pathname} initial={reducedMotion ? false : {opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} transition={{duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1]}}>{children}</motion.div>;
}
