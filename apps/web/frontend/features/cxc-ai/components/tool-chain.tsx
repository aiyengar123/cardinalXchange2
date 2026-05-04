"use client";

import {
  ChevronDown,
  MessageSquarePlus,
  Search,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@cardinalxchange/ui";

type ToolChainProps = {
  parts: Array<Record<string, unknown>>;
  className?: string;
};

type ToolState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error"
  | undefined;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function toolNameFromType(type: unknown): string {
  if (typeof type !== "string") return "tool";
  return type.startsWith("tool-") ? type.slice("tool-".length) : type;
}

function friendlyLabel(name: string): string {
  if (name === "search_cxc_sources") return "Searching CardinalXchange";
  if (name === "ask_community_draft") return "Drafting Ask the Community post";
  return name;
}

function iconForTool(name: string): LucideIcon {
  if (name === "search_cxc_sources") return Search;
  if (name === "ask_community_draft") return MessageSquarePlus;
  return Wrench;
}

function readState(part: Record<string, unknown>): ToolState {
  const state = part.state;
  if (
    state === "input-streaming" ||
    state === "input-available" ||
    state === "output-available" ||
    state === "output-error"
  ) {
    return state;
  }
  return undefined;
}

function statusFor(state: ToolState, hasOutput: boolean): {
  label: string;
  className: string;
} {
  if (state === "output-error") {
    return {
      label: "Error",
      className:
        "border-[var(--color-state-danger)] bg-[var(--color-surface-base)] text-[var(--color-state-danger)]",
    };
  }
  if (state === "output-available" || hasOutput) {
    return {
      label: "Done",
      className:
        "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-ink-500)]",
    };
  }
  return {
    label: "Running",
    className:
      "border-[var(--color-cardinal-500)] bg-[var(--color-surface-base)] text-[var(--color-cardinal-500)]",
  };
}

export default function ToolChain({ parts, className }: ToolChainProps) {
  const states = useMemo(() => parts.map((part) => readState(part)), [parts]);

  const anyRunning = useMemo(
    () =>
      states.some(
        (state) => state === "input-streaming" || state === "input-available",
      ),
    [states],
  );
  const anyDone = useMemo(
    () => states.some((state) => state === "output-available"),
    [states],
  );

  const [open, setOpen] = useState<boolean>(() => !(anyDone && !anyRunning));

  if (parts.length === 0) return null;

  return (
    <div
      className={cn(
        "border-l-2 border-[var(--color-border-default)] pl-3 my-3",
        className,
      )}
    >
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left text-xs text-[var(--color-ink-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-150 ease-out",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
        <span className="font-medium">Used {parts.length} steps</span>
        <span className="text-[11px] uppercase tracking-wide text-[var(--color-ink-500)]">
          tool
        </span>
      </button>

      {open ? (
        <ol className="mt-2 flex flex-col gap-2">
          {parts.map((part, index) => (
            <ToolStep key={index} expanded={open} part={part} />
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function ToolStep({
  expanded,
  part,
}: {
  expanded: boolean;
  part: Record<string, unknown>;
}) {
  const toolName = toolNameFromType(part.type);
  const Icon: LucideIcon = iconForTool(toolName);
  const label = friendlyLabel(toolName);

  const input = asRecord(part.input);
  const output = asRecord(part.output);
  const hasOutput = Object.keys(output).length > 0;

  const state = readState(part);
  const status = statusFor(state, hasOutput);

  return (
    <li className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-sunk)] p-2.5">
      <div className="flex items-center gap-2">
        <Icon
          aria-hidden
          className="h-3.5 w-3.5 text-[var(--color-ink-700)]"
        />
        <span className="text-xs font-medium text-[var(--color-ink-900)]">
          {label}
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide leading-none",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      {expanded && hasOutput ? (
        <div className="mt-2 text-xs text-[var(--color-ink-700)]">
          <ToolDetail input={input} output={output} toolName={toolName} />
        </div>
      ) : null}
    </li>
  );
}

function ToolDetail({
  input,
  output,
  toolName,
}: {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  toolName: string;
}) {
  if (toolName === "search_cxc_sources") {
    const query = typeof input.query === "string" ? input.query : "";
    const sources = Array.isArray(output.sources) ? output.sources : [];
    return (
      <div className="flex flex-col gap-1">
        {query ? (
          <p className="text-[var(--color-ink-700)]">
            <span className="text-[var(--color-ink-500)]">query:</span> {query}
          </p>
        ) : null}
        <p className="text-[var(--color-ink-500)]">
          Returned {sources.length} sources
        </p>
      </div>
    );
  }

  if (toolName === "ask_community_draft") {
    const title = typeof output.title === "string" ? output.title : "";
    const body = typeof output.body === "string" ? output.body : "";
    return (
      <div className="flex flex-col gap-1">
        {title ? (
          <p className="font-medium text-[var(--color-ink-900)]">{title}</p>
        ) : null}
        {body ? (
          <p className="line-clamp-2 text-[var(--color-ink-700)]">{body}</p>
        ) : null}
      </div>
    );
  }

  return (
    <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
      {JSON.stringify({ input, output }, null, 2).slice(0, 600)}
    </pre>
  );
}
