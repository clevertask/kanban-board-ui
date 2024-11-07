import { forwardRef } from "react";

import { Action, ActionProps } from "../Action";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";

export const Handle = forwardRef<HTMLButtonElement, ActionProps>((props, ref) => {
  return (
    <Action ref={ref} cursor="grab" data-cypress="draggable-handle" {...props}>
      <DragHandleDots2Icon></DragHandleDots2Icon>
    </Action>
  );
});
