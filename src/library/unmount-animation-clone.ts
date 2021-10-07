import {
  Children,
  FunctionComponent,
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
}

export const UnmountAnimationClone: FunctionComponent<UnmountAnimationCloneProps> =
  ({className = 'unmount', children}) => {
    // eslint-disable-next-line no-null/no-null
    let ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      return () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        let origin = ref.current!;
        // eslint-disable-next-line @mufan/no-unnecessary-type-assertion
        let parent = origin.parentElement!;

        let clone = origin.cloneNode(true) as HTMLDivElement;

        clone.classList.add(className);

        parent.insertBefore(clone, origin);

        clone.addEventListener('animationend', () => clone.remove());
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let renderCountRef = useRef(0);

    useEffect(() => {
      renderCountRef.current++;

      if (renderCountRef.current > 1) {
        throw new Error(
          'Property `className` of `UnmountAnimationClone` must not mutate during the lifecycle',
        );
      }
    }, [className]);

    let child = Children.only(children);

    if (!isValidElement(child)) {
      throw new Error('Expecting a React element');
    }

    return cloneElement(child, {ref});
  };
