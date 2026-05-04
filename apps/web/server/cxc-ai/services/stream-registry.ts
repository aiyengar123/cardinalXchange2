// In-memory; cleared on process restart. Production should swap this for a Redis-backed registry.

/**
 * Public handle returned by `getActiveStream`. The GET reattach route consumes
 * this — `attach()` produces a fresh `ReadableStream<Uint8Array>` that first
 * replays everything buffered so far, then forwards live chunks until the
 * upstream producer closes.
 */
export type RegisteredStream = {
  /** Returns a fresh ReadableStream<Uint8Array> that replays buffered chunks then continues. */
  attach(): ReadableStream<Uint8Array>;
  /** Number of bytes buffered (debug). */
  buffered: number;
  /** True once the producer has closed. */
  done: boolean;
};

const TTL_MS = 60_000;

type RegisteredStreamInternal = {
  buffer: Uint8Array[];
  bufferedBytes: number;
  joiners: Set<ReadableStreamDefaultController<Uint8Array>>;
  done: boolean;
  ttlTimer: ReturnType<typeof setTimeout> | null;
};

const streams = new Map<string, RegisteredStreamInternal>();

/**
 * Register a streaming response so concurrent and slightly-late clients can
 * reattach to the same in-flight assistant turn. The returned stream is the
 * one that should be sent to the original client; a `tee()` is performed
 * implicitly via a `TransformStream` that mirrors every chunk into an
 * in-memory buffer and broadcasts to any attached late-joiners.
 */
export function registerStream(
  chatId: string,
  source: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  // If a previous stream is still registered for this chatId (e.g. user
  // posted a new message while the old one was mid-stream), drop it. The
  // old stream is already piping to the original client; the new one starts
  // fresh in the registry.
  const existing = streams.get(chatId);
  if (existing?.ttlTimer) {
    clearTimeout(existing.ttlTimer);
  }

  const entry: RegisteredStreamInternal = {
    buffer: [],
    bufferedBytes: 0,
    joiners: new Set<ReadableStreamDefaultController<Uint8Array>>(),
    done: false,
    ttlTimer: null,
  };
  streams.set(chatId, entry);

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      // 1. Forward to the original client.
      controller.enqueue(chunk);
      // 2. Buffer for replay.
      entry.buffer.push(chunk);
      entry.bufferedBytes += chunk.byteLength;
      // 3. Broadcast a private slice to each late-joiner so byte ownership
      //    stays independent across consumers.
      for (const joiner of entry.joiners) {
        try {
          joiner.enqueue(chunk.slice());
        } catch {
          // Joiner already closed/cancelled; drop it.
          entry.joiners.delete(joiner);
        }
      }
    },
    flush() {
      entry.done = true;
      for (const joiner of entry.joiners) {
        try {
          joiner.close();
        } catch {
          // Already closed; ignore.
        }
      }
      entry.joiners.clear();
      entry.ttlTimer = setTimeout(() => {
        // Only delete if this exact entry is still the registered one — a
        // newer registration may have replaced it during the TTL window.
        if (streams.get(chatId) === entry) {
          streams.delete(chatId);
        }
      }, TTL_MS);
    },
  });

  return source.pipeThrough(transform);
}

/** Returns the registered entry for `chatId`, or `null` if none is active. */
export function getActiveStream(chatId: string): RegisteredStream | null {
  const entry = streams.get(chatId);
  if (!entry) {
    return null;
  }

  return {
    get buffered(): number {
      return entry.bufferedBytes;
    },
    get done(): boolean {
      return entry.done;
    },
    attach(): ReadableStream<Uint8Array> {
      let attachedController: ReadableStreamDefaultController<Uint8Array> | null = null;

      return new ReadableStream<Uint8Array>({
        start(controller) {
          // Replay everything buffered so far — slice each chunk so the
          // joiner owns its own bytes.
          for (const chunk of entry.buffer) {
            controller.enqueue(chunk.slice());
          }
          if (entry.done) {
            controller.close();
            return;
          }
          attachedController = controller;
          entry.joiners.add(controller);
        },
        cancel() {
          if (attachedController) {
            entry.joiners.delete(attachedController);
            attachedController = null;
          }
        },
      });
    },
  };
}
