import { Action, ActionProps } from "../Action";
import { Pencil1Icon } from "@radix-ui/react-icons";

export function Edit(props: ActionProps) {
  return (
    <Action
      {...props}
      active={{
        fill: "rgba(255, 70, 70, 0.95)",
        background: "rgba(255, 70, 70, 0.1)",
      }}
    >
      <Pencil1Icon />
    </Action>
  );
}
