import { useEffect, useRef } from "react";

export function useInterval(callback: () => void, delay: number) {
    const savedCallback = useRef<typeof callback>();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        const id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay]);
}
