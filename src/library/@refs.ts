import type {ReactElement, Ref, RefCallback, RefObject} from 'react';
import {useCallback} from 'react';

export function getElementRef<T>(element: ReactElement): Ref<T> | undefined {
  // React 19 stores ref in props; React 18 stores it on the element. Reading
  // descriptors avoids invoking either version's deprecated ref getter.
  return (Object.getOwnPropertyDescriptor(element.props, 'ref')?.value ??
    Object.getOwnPropertyDescriptor(element, 'ref')?.value) as
    Ref<T> | undefined;
}

export function useComposedRef<T>(
  localRef: RefObject<T | null>,
  childRef: Ref<T> | undefined,
): RefCallback<T> {
  return useCallback(
    (element: T | null) => {
      localRef.current = element;

      if (typeof childRef === 'function') {
        const cleanup = childRef(element);

        if (typeof cleanup === 'function') {
          return () => {
            localRef.current = null;
            cleanup();
          };
        }
      } else if (childRef) {
        childRef.current = element;
      }

      return undefined;
    },
    [localRef, childRef],
  );
}
