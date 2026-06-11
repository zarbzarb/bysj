import { useCallback, useState } from 'react';

function useForceRender() {
  const [count, setCount] = useState(0);
  const forceRender = useCallback(() => setCount((c) => c + 1), []);
  return forceRender;
}

export default useForceRender;
