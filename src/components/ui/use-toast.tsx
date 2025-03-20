// components/ui/use-toast.tsx
import * as React from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;

export type ToastActionElement = React.ReactElement;

export type ToastProps = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
};

type ToastState = {
  toasts: ToastProps[];
};

export const toastVariants = {
  default: "bg-background border",
  destructive:
    "group destructive border-destructive bg-destructive text-destructive-foreground",
};

type ToasterToast = ToastProps & {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  swipeDirection?: "up" | "right" | "down" | "left";
};

export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
      id: string;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      id?: string;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      id?: string;
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { id } = action;

      if (id) {
        toastTimeouts.set(
          id,
          setTimeout(() => {
            toastTimeouts.delete(id);
          }, TOAST_REMOVE_DELAY)
        );
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          id === t.id || id === undefined
            ? {
                ...t,
              }
            : t
        ),
      };
    }

    case actionTypes.REMOVE_TOAST:
      if (action.id === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };

    default:
      return state;
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast(props: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      id,
      toast: props,
    });

  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
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
    toast,
    dismiss: (id?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, id }),
  };
}

export { useToast, toast };