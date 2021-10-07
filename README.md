# UnmountAnimationClone (React Component)

A simple utility component that clones the DOM element for animation before it unmounts.

## Installation

```ts
yarn add unmount-animation-clone
```

## Usage

**Style**

```css
@keyframes animation-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes animation-leave {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

.animated-element {
  animation-duration: 0.5s;
  animation-name: animation-enter;
}

.animated-element.unmount {
  animation-name: animation-leave;
}
```

**Render**

```jsx
import {useState} from 'react';
import {UnmountAnimationClone} from 'unmount-animation-clone';

function App() {
  let [shown, setShown] = useState();

  useEffect(() => {
    let timer = setTimeout(() => setShown(!shown), 2000);

    return () => clearTimeout(timer);
  }, [shown]);

  return (
    shown && (
      <UnmountAnimationClone>
        <div className="animated-element">hello, world!</div>
      </UnmountAnimationClone>
    )
  );
}
```

## License

MIT License.
