/**
 * sockjs-client ships no first-party types. We only use the default-export
 * constructor; the `Client` class from `@stomp/stompjs` calls `.send()` /
 * `.close()` on whatever it gets, so a structural typing of "callable that
 * returns a WebSocket-like object" is enough.
 */
declare module "sockjs-client";
