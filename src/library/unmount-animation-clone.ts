import type {CSSProperties, FunctionComponent, ReactElement} from 'react';
import {Children, cloneElement, useLayoutEffect, useRef} from 'react';

import {getElementRef, useComposedRef} from './@refs.js';

export type UnmountAnimationCloneProps = {
  /**
   * Class name that adds to the DOM element clone for unmount animation.
   */
  className?: string;
  /**
   * Style that adds to the DOM element clone for unmount animation.
   */
  style?: CSSProperties;
  transitionClassName?: string;
  transitionStyle?: CSSProperties;
  /**
   * Do not remove the DOM element clone after animation (might be useful for
   * debugging).
   */
  persist?: boolean;
  onUnmountClone?(clone: HTMLElement): void;
  onUnmountRemove?(): void;
  children: ReactElement;
};

export const UnmountAnimationClone: FunctionComponent<
  UnmountAnimationCloneProps
> = ({
  className = 'unmount',
  style,
  transitionStyle,
  transitionClassName,
  persist,
  onUnmountClone,
  onUnmountRemove,
  children,
}) => {
  const ref = useRef<HTMLElement>(null);
  const pendingCloneRef = useRef<HTMLElement | undefined>(undefined);

  useLayoutEffect(() => {
    // Remove StrictMode's replay clone before parent layout effects run.
    pendingCloneRef.current?.remove();
    pendingCloneRef.current = undefined;

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const origin = ref.current;
      const parent = origin?.parentElement;

      if (!origin || !parent) {
        return;
      }

      const clone = origin.cloneNode(true) as HTMLElement;

      clone.classList.add(className);

      if (style) {
        assignStyle(clone, style);
      }

      parent.insertBefore(clone, origin);
      pendingCloneRef.current = clone;

      // Keep the clone in place before React removes the original, but wait for
      // the commit to finish before starting a real exit and its callbacks.
      queueMicrotask(() => {
        if (pendingCloneRef.current !== clone) {
          return;
        }

        pendingCloneRef.current = undefined;

        if (!persist) {
          clone.addEventListener('animationend', onEnd);
          clone.addEventListener('animationcancel', onEnd);
          clone.addEventListener('transitionend', onEnd);
          clone.addEventListener('transitioncancel', onEnd);
        }

        onUnmountClone?.(clone);

        if (transitionClassName || transitionStyle) {
          // reflow
          void clone.offsetHeight;

          if (transitionClassName) {
            clone.classList.add(transitionClassName);
          }

          if (transitionStyle) {
            assignStyle(clone, transitionStyle);
          }
        }
      });

      function onEnd(event: Event): void {
        const target = event.target as HTMLElement;

        if (
          target !== clone &&
          !target.classList.contains('unmount-transition-target')
        ) {
          return;
        }

        clone.removeEventListener('animationend', onEnd);
        clone.removeEventListener('animationcancel', onEnd);
        clone.removeEventListener('transitionend', onEnd);
        clone.removeEventListener('transitioncancel', onEnd);

        clone.remove();
        onUnmountRemove?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classNameRef = useRef(className);

  if (className !== classNameRef.current) {
    throw new Error(
      'Property `className` of `UnmountAnimationClone` must not mutate during the lifecycle',
    );
  }

  const child = Children.only(children);
  const composedRef = useComposedRef(ref, getElementRef<HTMLElement>(child));

  return cloneElement(child, {
    ref: composedRef,
  } as object);
};

function assignStyle(target: HTMLElement, styleProps: CSSProperties): void {
  const style = target.style;

  for (const [key, value] of Object.entries(styleProps)) {
    if (key.includes('-')) {
      style.setProperty(key, value);
    } else {
      (style as any)[key] = value;
    }
  }
}
