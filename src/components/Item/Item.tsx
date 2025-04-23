import React, { useEffect } from "react";
import classNames from "classnames";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import type { Transform } from "@dnd-kit/utilities";

import { Handle, Edit } from "./components";

import styles from "./Item.module.css";
import type { Item as TItem } from "../KanbanBoard";
export type RenderItemArgs<T = TItem> = {
  item: TItem<T>;
  styleLayout: React.CSSProperties;
  dragOverlay: boolean;
  dragging: boolean;
  sorting: boolean;
  index: number | undefined;
  fadeIn: boolean;
  dragListeners: DraggableSyntheticListeners;
  ref: React.Ref<any>;
  style: React.CSSProperties | undefined;
  transform: ItemProps["transform"];
  transition: ItemProps["transition"];
  value: ItemProps["value"];
  onItemClick?(): void;
};

export interface ItemProps<ExtendedItem = TItem> {
  item: TItem<ExtendedItem>;
  dragOverlay?: boolean;
  color?: string;
  disabled?: boolean;
  dragging?: boolean;
  handle?: boolean;
  handleProps?: any;
  height?: number;
  index?: number;
  fadeIn?: boolean;
  transform?: Transform | null;
  listeners?: DraggableSyntheticListeners;
  sorting?: boolean;
  style?: React.CSSProperties;
  transition?: string | null;
  wrapperStyle?: React.CSSProperties;
  value: React.ReactNode;
  content: string;
  onEdit?(): void;
  onItemClick?(): void;
  renderItem?(args: RenderItemArgs<ExtendedItem>): React.ReactElement;
}

export const Item = React.memo(
  React.forwardRef<HTMLLIElement, ItemProps>(
    (
      {
        color,
        dragOverlay,
        dragging,
        disabled,
        fadeIn,
        handle,
        handleProps,
        index,
        listeners,
        onItemClick,
        onEdit,
        renderItem,
        sorting,
        style,
        transition,
        transform,
        value,
        wrapperStyle,
        content,
        item,
        ...props
      },
      ref
    ) => {
      useEffect(() => {
        if (!dragOverlay) {
          return;
        }

        document.body.style.cursor = "grabbing";

        return () => {
          document.body.style.cursor = "";
        };
      }, [dragOverlay]);

      const computedTransform = transform
        ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0) scaleX(${
            transform.scaleX ?? 1
          }) scaleY(${transform.scaleY ?? 1})`
        : undefined;

      return renderItem ? (
        renderItem({
          dragOverlay: Boolean(dragOverlay),
          dragging: Boolean(dragging),
          sorting: Boolean(sorting),
          index,
          fadeIn: Boolean(fadeIn),
          dragListeners: listeners,
          ref,
          style,
          transform,
          transition,
          value,
          item,
          onItemClick,
          styleLayout: {
            transform: computedTransform,
            transition: "transform 200ms ease",
          },
        })
      ) : (
        <li
          onClick={onItemClick}
          className={classNames(
            styles.Wrapper,
            fadeIn && styles.fadeIn,
            sorting && styles.sorting,
            dragOverlay && styles.dragOverlay
          )}
          style={
            {
              ...wrapperStyle,
              transition: [transition, wrapperStyle?.transition].filter(Boolean).join(", "),
              "--translate-x": transform ? `${Math.round(transform.x)}px` : undefined,
              "--translate-y": transform ? `${Math.round(transform.y)}px` : undefined,
              "--scale-x": transform?.scaleX ? `${transform.scaleX}` : undefined,
              "--scale-y": transform?.scaleY ? `${transform.scaleY}` : undefined,
              "--index": index,
              "--color": color,
            } as React.CSSProperties
          }
          ref={ref}
        >
          <div
            className={classNames(
              styles.Item,
              dragging && styles.dragging,
              handle && styles.withHandle,
              dragOverlay && styles.dragOverlay,
              disabled && styles.disabled,
              color && styles.color
            )}
            style={style}
            data-cypress="draggable-item"
            {...(!handle ? listeners : undefined)}
            {...props}
            tabIndex={!handle ? 0 : undefined}
          >
            {content}
            <span className={styles.Actions}>
              {onEdit ? <Edit className={styles.Remove} onClick={onEdit} /> : null}
              {handle ? <Handle {...handleProps} {...listeners} /> : null}
            </span>
          </div>
        </li>
      );
    }
  )
);
