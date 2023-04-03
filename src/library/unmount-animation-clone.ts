import composeRefs from '@seznam/compose-react-refs';
import type {CSSProperties, FunctionComponent, ReactElement} from 'react';
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

export interface UnmountAnimationCloneProps {
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
}

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
  // eslint-disable-next-line no-null/no-null
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const origin = ref.current!;
      const parent = origin.parentElement!;

      const clone = origin.cloneNode(true) as HTMLElement;

      clone.classList.add(className);

      if (style) {
        assignStyle(clone, style);
      }

      parent.insertBefore(clone, origin);

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

      if (!persist) {
        clone.addEventListener('animationend', onEnd);
        clone.addEventListener('transitionend', onEnd);
      }

      function onEnd(event: Event): void {
        const target = event.target as HTMLElement;

        if (
          target !== clone &&
          !target.classList.contains('unmount-transition-target')
        ) {
          return;
        }

        clone.remove();

        onUnmountRemove?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;

    if (renderCountRef.current > 1) {
      throw new Error(
        'Property `className` of `UnmountAnimationClone` must not mutate during the lifecycle',
      );
    }
  }, [className]);

  const child = Children.only(children);

  if (!isValidElement(child)) {
    throw new Error('Expecting a React element');
  }

  // eslint-disable-next-line @mufan/no-object-literal-type-assertion
  return cloneElement(child, {
    ref: composeRefs((child as any).ref, ref),
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
