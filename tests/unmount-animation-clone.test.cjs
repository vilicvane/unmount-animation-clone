const assert = require('node:assert/strict');
const {afterEach, beforeEach, test} = require('node:test');
const {JSDOM} = require('jsdom');
const React = require('react');
const {createRoot} = require('react-dom/client');
const {UnmountAnimationClone} = require('unmount-animation-clone');

const act = React.act || require('react-dom/test-utils').act;

let dom;
let container;
let root;

beforeEach(() => {
  dom = new JSDOM('<!doctype html><div id="root"></div>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = dom.window.document.getElementById('root');
  root = createRoot(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  dom.window.close();
  delete global.window;
  delete global.document;
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

function renderClone(props = {}, child = React.createElement('span', {}, '3')) {
  return React.createElement(UnmountAnimationClone, props, child);
}

test('StrictMode does not create a clone until the actual unmount', async () => {
  const clones = [];
  const render = shown =>
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
  assert.equal(container.querySelectorAll('.unmount').length, 0);
  assert.equal(clones.length, 0);

  await act(() => root.render(render(false)));
  assert.equal(container.querySelectorAll('.unmount').length, 1);
  assert.equal(clones.length, 1);
  assert.equal(container.textContent, '3remaining');

  clones[0].dispatchEvent(
    new dom.window.Event('animationend', {bubbles: true}),
  );
  assert.equal(container.textContent, 'remaining');
});

test('StrictMode replay is cancelled when a layout effect immediately unmounts the child', async () => {
  const clones = [];
  const layoutCloneCounts = [];

  function HideAfterLayout() {
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
  assert.deepEqual(layoutCloneCounts, [0, 0]);
  assert.equal(clones.length, 1);
  assert.equal(container.querySelectorAll('.unmount').length, 1);
});

test('child object refs remain intact without deprecated ref access', async () => {
  const ref = React.createRef();
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => errors.push(args.join(' '));

  try {
    await act(() =>
      root.render(renderClone({}, React.createElement('span', {ref}, '3'))),
    );
    assert.equal(ref.current, container.firstElementChild);
    await act(() => root.render(null));
    assert.equal(ref.current, null);
    assert.deepEqual(errors, []);
  } finally {
    console.error = originalError;
  }
});

test('changing className still reports an invalid lifecycle mutation', async () => {
  const originalError = console.error;
  console.error = () => {};

  try {
    await act(() => root.render(renderClone({className: 'leave'})));
    await assert.rejects(async () => {
      await act(() => root.render(renderClone({className: 'other'})));
    }, /Property `className` of `UnmountAnimationClone` must not mutate/);
  } finally {
    console.error = originalError;
  }
});

test(
  'React 19 child ref cleanup is forwarded',
  {skip: !React.version.startsWith('19.')},
  async () => {
    let attached = 0;
    let cleaned = 0;
    const ref = node => {
      assert.ok(node);
      attached++;
      return () => cleaned++;
    };

    await act(() =>
      root.render(renderClone({}, React.createElement('span', {ref}))),
    );
    await act(() => root.render(null));
    assert.equal(attached, 1);
    assert.equal(cleaned, 1);
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

  const clone = container.querySelector('.unmount');
  clone.firstElementChild.dispatchEvent(
    new dom.window.Event('animationend', {bubbles: true}),
  );
  assert.equal(clone.isConnected, true);
  clone.lastElementChild.dispatchEvent(
    new dom.window.Event('transitionend', {bubbles: true}),
  );
  clone.dispatchEvent(new dom.window.Event('animationend'));
  assert.equal(clone.isConnected, false);
  assert.equal(removed, 1);
});

test('a cancelled exit removes the clone', async () => {
  let removed = 0;
  await act(() => root.render(renderClone({onUnmountRemove: () => removed++})));
  await act(() => root.render(null));
  const clone = container.querySelector('.unmount');
  clone.dispatchEvent(new dom.window.Event('animationcancel'));
  assert.equal(clone.isConnected, false);
  assert.equal(removed, 1);
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
  const clone = container.querySelector('.unmount.leave');
  assert.equal(clone.style.opacity, '0');
  clone.dispatchEvent(new dom.window.Event('transitionend'));
  assert.equal(clone.isConnected, true);
});
