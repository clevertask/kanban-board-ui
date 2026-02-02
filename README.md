# @clevertask/kanban-board-ui

A React component for rendering and managing a kanban board with drag-and-drop functionality. Built on top of [dnd-kit](https://github.com/clauderic/dnd-kit), this component offers a flexible and extensible API for building modern kanban boards.

---

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Custom Components](#custom-components)
  - [Custom Item Rendering (`renderItem`)](#custom-item-rendering-renderitem)
  - [Custom Column Rendering (`renderColumn`)](#custom-column-rendering-rendercolumn)
- [Props](#props)
- [Helper Functions](#helper-functions)
  - [updateColumnItems](#updatecolumnitems)
  - [removeColumnItem](#removecolumnitem)
  - [removeColumn](#removecolumn)
  - [updateColumnName](#updatecolumnname)
- [Roadmap](#roadmap)
- [Release Process](#release-process)
- [License](#license)

---

## Installation

```bash
npm install @clevertask/kanban-board-ui
```

---

## Usage

```tsx
import "@clevertask/kanban-board-ui/dist/style.css";
import React, { useState } from "react";
import { KanbanBoard, Columns } from "@clevertask/kanban-board-ui";

function App() {
  const [columns, setColumns] = useState<Columns>([
    {
      id: "1",
      name: "To Do",
      items: [{ id: "1.1", name: "Task A" }],
    },
    {
      id: "2",
      name: "In Progress",
      items: [{ id: "2.1", name: "Task B" }],
    },
  ]);

  return (
    <KanbanBoard
      columns={columns}
      setColumns={setColumns}
      onItemClick={(itemId) => console.log("Clicked", itemId)}
    />
  );
}
```

---

## Custom Components

You can fully customize how both **items** and **columns** are rendered using the `renderItem` and `renderColumn` props.

### Custom Item Rendering (`renderItem`)

```tsx
<KanbanBoard
  columns={columns}
  setColumns={setColumns}
  renderItem={({ item, dragging, dragListeners, ref, styleLayout }) => (
    <li
      ref={ref}
      style={{
        padding: "16px",
        marginTop: "1rem",
        backgroundColor: dragging ? "#f0f0f0" : "#fff",
        border: "1px solid #ccc",
        borderRadius: "24px",
        ...styleLayout,
      }}
    >
      <strong>{item.name}</strong>
      <button>Click me</button>
      <div {...dragListeners} style={{ cursor: "grab" }}>
        Drag from here
      </div>
    </li>
  )}
/>
```

### Custom Column Rendering (`renderColumn`)

```tsx
<KanbanBoard
  columns={columns}
  setColumns={setColumns}
  renderColumn={(props) => (
    <div
      ref={props.ref}
      style={{
        padding: "1rem",
        width: "22rem",
        outline: "1px solid red",
        backgroundColor: "#fafafa",
        ...props.style,
      }}
    >
      <button {...props.listeners}>Drag me!</button>
      <h3>{props.label}</h3>
      {props.children}
    </div>
  )}
/>
```

### Extending Item Types

You can extend the default item structure using generics. This allows you to pass custom metadata or fields to each item and access them inside your custom `renderItem` function.

#### Example: Adding Metadata to Items

```tsx
const [columns, setColumns] = useState<Columns<{ metadata?: { foo: string } }>>(
  [
    {
      id: "1",
      name: "To Do",
      items: [{ id: "1.1", name: "Task A" }],
    },
    {
      id: "2",
      name: "In Progress",
      items: [{ id: "2.1", name: "Task B", metadata: { foo: "🔥" } }],
    },
  ],
);
```

Then in your `renderItem`:

```tsx
renderItem={({ item }) => (
  <div>
    <strong>{item.name}</strong>
    <span>{item.metadata?.foo}</span>
  </div>
)}
```

#### Example: Adding Metadata to Columns **(experimental)**

Currently, the `metadata` property for Columns accepts `any` value. We plan to fix that type in the future. So, we consider the `metadata` prop for Columns experimental

```tsx
const [columns, setColumns] = useState<Columns<{ metadata?: { foo: string } }>>([
  {
    id: "1",
    name: "To Do",
    items: [{ id: "1.1", name: "Task A" }],
    metadata: { statusId: 37 }
  },
  {
    id: "2",
    name: "In Progress",
    items: [{ id: "2.1", name: "Task B"],
    metadata: { statusId: 31 }
  },
]);
```

---

## Props

| Prop           | Type                                                        | Default      | Description                                                                                                                                                   |
| -------------- | ----------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`      | `Columns`                                                   | **Required** | An array of column objects to be rendered on the Kanban board. Each column includes its `id`, `name`, and `items` array.                                      |
| `setColumns`   | `React.Dispatch<React.SetStateAction<Columns>>`             | **Required** | A callback function triggered when the columns array changes, allowing the parent component to manage state updates.                                          |
| `trashable`    | `boolean`                                                   | `false`      | Enables a special drop zone where items can be dropped to delete them.                                                                                        |
| `onItemRemove` | `(result: TOnItemRemoveArgs) => void`                       | `undefined`  | Callback triggered after an item has been dropped into the trashable drop zone. Provides the `itemId` and source column.                                      |
| `onItemClick`  | `(itemId: UniqueIdentifier) => void`                        | `undefined`  | Callback triggered when an item on the Kanban board is clicked. Typically used to display a modal or additional item details.                                 |
| `onAddColumn`  | `(item: TOnAddColumnArgs) => void`                          | `undefined`  | Callback triggered when a new column is added. Provides information about the added item (if applicable) or triggers an action when the drop zone is clicked. |
| `onColumnMove` | `({newIndex: number; columnId: UniqueIdentifier;}) => void` | `undefined`  | Callback triggered when a column is moved to a new position. Provides the column's `id` and its new index.                                                    |
| `onItemMove`   | `(result: MovedItemState) => void`                          | `undefined`  | Callback triggered when an item is moved to another column or its position changes within the same column.                                                    |
| `onColumnEdit` | `(columnId: UniqueIdentifier): void`                        | `undefined`  | Callback triggered when a column is clicked for editing. Provides the column's `id`.                                                                          |
| `renderItem`   | `({ item, ... }) => React.ReactElement`                     | `undefined`  | Custom render function for items. Gives full control over layout, styling, and drag handle behavior.                                                          |
| `renderColumn` | `({ id, label, ... }) => React.ReactElement`                | `undefined`  | Custom render function for columns. Allows full control over column layout, including drag handle and header.                                                 |

---

## Helper Functions

### `updateColumnItems`

```ts
updateColumnItems(columns, columnId, updateFn);
```

Updates the items in a specific column.

### `removeColumnItem`

```ts
removeColumnItem(columns, columnId, itemId);
```

Removes an item from a specific column.

### `removeColumn`

```ts
removeColumn(columns, columnId);
```

Removes a column by its ID.

### `updateColumnName`

```ts
updateColumnName(columns, columnId, newName);
```

Updates a column's name.

---

## Roadmap

We're constantly working to improve `@clevertask/kanban-board-ui`. Here's what’s coming next:

- **Virtualization**: Improve performance for large boards.
- **Drag multiple items**: Enable selecting and dragging multiple items at once.
- **API Example**: Provide a full-stack example with backend integration.
- **E2E tests**: Ensure long-term stability and confidence in updates.
- **User personalization**: Let users configure card layouts and visible fields.

## License

MIT
