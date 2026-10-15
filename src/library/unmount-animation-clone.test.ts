/** @jest-environment jsdom */

import * as React from 'react';
import {act} from 'react';
import type {Root} from 'react-dom/client';
import {createRoot} from 'react-dom/client';

import type {UnmountAnimationCloneProps} from 'unmount-animation-clone';
import {UnmountAnimationClone} from 'unmount-animation-clone';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
});

function renderClone(
  props: Omit<UnmountAnimationCloneProps, 'children'> = {},
  child: React.ReactElement = React.createElement('span', {}, '3'),
): React.ReactElement {
  return React.createElement(UnmountAnimationClone, {
    ...props,
    children: child,
  });
}

test('StrictMode does not create a clone until the actual unmount', async () => {
  const clones: HTMLElement[] = [];
  const render = (shown: boolean): React.ReactElement =>
    React.createElement(
      React.StrictMode,
      {},
      React.createElement(
        'div',
        {},
        shown
          ? renderClone({onUnmountClone: clone => clones.push(clone)})
          : null,
        React.createElement('span', {}, 'remaining'),
      ),
    );

  await act(() => root.render(render(true)));
  expect(container.querySelectorAll('.unmount')).toHaveLength(0);
  expect(clones).toHaveLength(0);

  await act(() => root.render(render(false)));
  expect(container.querySelectorAll('.unmount')).toHaveLength(1);
  expect(clones).toHaveLength(1);
  expect(container.textContent).toBe('3remaining');

  clones[0].dispatchEvent(new Event('animationend', {bubbles: true}));
  expect(container.textContent).toBe('remaining');
});

test('StrictMode replay is cancelled when a layout effect immediately unmounts the child', async () => {
  const clones: HTMLElement[] = [];
  const layoutCloneCounts: number[] = [];

  function HideAfterLayout(): React.ReactElement {
    const [shown, setShown] = React.useState(true);

    React.useLayoutEffect(() => {
      layoutCloneCounts.push(container.querySelectorAll('.unmount').length);
      setShown(false);
    }, []);

    return React.createElement(
      'div',
      {},
      shown ? renderClone({onUnmountClone: clone => clones.push(clone)}) : null,
    );
  }

  await act(() =>
    root.render(
      React.createElement(
        React.StrictMode,
        {},
        React.createElement(HideAfterLayout),
      ),
    ),
  );
  expect(layoutCloneCounts).toEqual([0, 0]);
  expect(clones).toHaveLength(1);
  expect(container.querySelectorAll('.unmount')).toHaveLength(1);
});

test('child object refs remain intact without deprecated ref access', async () => {
  const ref = React.createRef<HTMLSpanElement>();
  const errors: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => errors.push(args.join(' '));

  try {
    await act(() =>
      root.render(renderClone({}, React.createElement('span', {ref}, '3'))),
    );
    expect(ref.current).toBe(container.firstElementChild);
    await act(() => root.render(null));
    expect(ref.current).toBeNull();
    expect(errors).toEqual([]);
  } finally {
    console.error = originalError;
  }
});

test('changing className still reports an invalid lifecycle mutation', async () => {
  const originalError = console.error;
  console.error = () => {};

  try {
    await act(() => root.render(renderClone({className: 'leave'})));
    await expect(async () => {
      await act(() => root.render(renderClone({className: 'other'})));
    }).rejects.toThrow(
      'Property `className` of `UnmountAnimationClone` must not mutate',
    );
  } finally {
    console.error = originalError;
  }
});

(React.version.startsWith('19.') ? test : test.skip)(
  'React 19 child ref cleanup is forwarded',
  async () => {
    let attached = 0;
    let cleaned = 0;
    const ref: React.RefCallback<HTMLSpanElement> = node => {
      expect(node).not.toBeNull();
      attached++;

      return () => {
        cleaned++;
      };
    };

    await act(() =>
      root.render(renderClone({}, React.createElement('span', {ref}))),
    );
    await act(() => root.render(null));
    expect(attached).toBe(1);
    expect(cleaned).toBe(1);
  },
);

test('only the clone or a designated descendant can finish the exit', async () => {
  let removed = 0;

  await act(() =>
    root.render(
      renderClone(
        {onUnmountRemove: () => removed++},
        React.createElement(
          'div',
          {},
          React.createElement('span', {}, 'ignore'),
          React.createElement(
            'span',
            {className: 'unmount-transition-target'},
            'target',
          ),
        ),
      ),
    ),
  );
  await act(() => root.render(null));

  const clone = container.querySelector<HTMLElement>('.unmount')!;

  clone.firstElementChild!.dispatchEvent(
    new Event('animationend', {bubbles: true}),
  );
  expect(clone.isConnected).toBe(true);
  clone.lastElementChild!.dispatchEvent(
    new Event('transitionend', {bubbles: true}),
  );
  clone.dispatchEvent(new Event('animationend'));
  expect(clone.isConnected).toBe(false);
  expect(removed).toBe(1);
});

test('a cancelled exit removes the clone', async () => {
  let removed = 0;

  await act(() => root.render(renderClone({onUnmountRemove: () => removed++})));
  await act(() => root.render(null));

  const clone = container.querySelector<HTMLElement>('.unmount')!;

  clone.dispatchEvent(new Event('animationcancel'));
  expect(clone.isConnected).toBe(false);
  expect(removed).toBe(1);
});

test('transition styles and persistent clones keep the existing API', async () => {
  await act(() =>
    root.render(
      renderClone({
        style: {opacity: 1},
        transitionClassName: 'leave',
        transitionStyle: {opacity: 0},
        persist: true,
      }),
    ),
  );
  await act(() => root.render(null));

  const clone = container.querySelector<HTMLElement>('.unmount.leave')!;

  expect(clone.style.opacity).toBe('0');
  clone.dispatchEvent(new Event('transitionend'));
  expect(clone.isConnected).toBe(true);
});
