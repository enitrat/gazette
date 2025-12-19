import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

export type Toast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type State = {
  toasts: Toast[];
};

type Action =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "UPDATE_TOAST"; toast: Partial<Toast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST": {
      const toasts = [action.toast, ...state.toasts].slice(0, TOAST_LIMIT);
      return { ...state, toasts };
    }
    case "UPDATE_TOAST": {
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast
        ),
      };
    }
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.map((toast) =>
            toast.id === toastId ? { ...toast, open: false } : toast
          ),
        };
      }
      return {
        ...state,
        toasts: state.toasts.map((toast) => ({ ...toast, open: false })),
      };
    }
    case "REMOVE_TOAST": {
      const { toastId } = action;
      if (!toastId) {
        return { ...state, toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== toastId),
      };
    }
    default:
      return state;
  }
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleToastRemoval(toastId: string) {
  if (toastTimeouts.has(toastId)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

function createToast(props: Omit<Toast, "id">) {
  const id = crypto.randomUUID();

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  const update = (next: Partial<Toast>) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...next, id } });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  scheduleToastRemoval(id);

  return { id, dismiss, update };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast: createToast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export const toast = createToast;
