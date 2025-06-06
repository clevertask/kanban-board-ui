import React, { forwardRef } from "react";
import classNames from "classnames";

import { Handle, Edit } from "../Item";

import styles from "./Container.module.css";

export interface ContainerProps {
  children: React.ReactNode;
  columns?: number;
  label: string;
  style?: React.CSSProperties;
  horizontal?: boolean;
  hover?: boolean;
  handleProps?: React.HTMLAttributes<any>;
  scrollable?: boolean;
  shadow?: boolean;
  placeholder?: boolean;
  unstyled?: boolean;
  onClick?(): void;
  onEdit?(): void;
}

export const Container = forwardRef<((node: HTMLElement | null) => void) | undefined, ContainerProps>(
  (
    {
      children,
      columns = 1,
      handleProps,
      horizontal,
      hover,
      onClick,
      onEdit,
      label,
      placeholder,
      style,
      scrollable,
      shadow,
      unstyled,
      ...props
    }: ContainerProps,
    ref
  ) => {
    const Component = onClick ? "button" : "div";

    return (
      <Component
        {...props}
        ref={ref as React.Ref<HTMLDivElement & HTMLButtonElement>}
        style={
          {
            ...style,
            "--columns": columns,
          } as React.CSSProperties
        }
        className={classNames(
          styles.Container,
          unstyled && styles.unstyled,
          horizontal && styles.horizontal,
          hover && styles.hover,
          placeholder && styles.placeholder,
          scrollable && styles.scrollable,
          shadow && styles.shadow
        )}
        onClick={onClick}
        tabIndex={onClick ? 0 : undefined}
      >
        {label ? (
          <div className={styles.Header}>
            {label}
            <div className={styles.Actions}>
              {onEdit ? <Edit onClick={onEdit} /> : undefined}
              <Handle {...handleProps} />
            </div>
          </div>
        ) : null}
        {placeholder ? children : <ul>{children}</ul>}
      </Component>
    );
  }
);
