# @clevertask/kanban-board-ui

A React component for rendering and managing a kanban board with drag-and-drop functionality. This is built on top of the [kanban board Component from the dnd-kit library](https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/story/presets-sortable-multiple-containers--drag-handle).

# Table of Contents

- [@clevertask/kanban-board-ui](#clevertaskkanban-board-ui)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Props](#props)
  - [Helper Functions](#helper-functions)
    - [updateColumnItems](#updatecolumnitems)
    - [removeColumnItem](#removecolumnitem)
    - [removeColumn](#removecolumn)
    - [updateColumnName](#updatecolumnname)
  - [Roadmap](#roadmap)
  - [Release Process](#release-process)
  - [License](#license)

## Installation

```bash
npm install @clevertask/kanban-board-ui
```

## Usage

```tsx
import "@clevertask/kanban-board-ui/dist/style.css";
import React, { useState } from "react";
import { KanbanBoard, Columns } from "@clevertask/kanban-board-ui";

function App() {
  const [columns, setColumns] = useState<Columns>([
    {
      id: "1",
      name: "A",
      items: [{ id: "1.1", name: "A1" }],
    },
    {
      id: "2",
      name: "B",
      items: [{ id: "2.2", name: "B1" }],
    },
  ]);

  return (
    <KanbanBoard
      columns={columns}
      setColumns={setColumns}
      // ... other props
    />
  );
}
```

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

## Helper Functions

### `updateColumnItems`

```typescript
export declare function updateColumnItems(
  items: Columns,
  columnId: UniqueIdentifier,
  updateFn: (currentState: Item[]) => Item[]
): {
  id: UniqueIdentifier;
  name: string;
  items: Item[];
}[];
```

Updates the items in a specified column. This function is particularly useful for operations like adding, updating, or reordering items in a column.

> **Note**: In most cases, you’ll primarily use this function to add new items to a column, as drag-and-drop updates are automatically handled by the `KanbanBoard` component.

**Usage Example**:

```typescript
const updatedColumns = updateColumnItems(columns, "1", (currentColumnItems) => [
  ...currentColumnItems,
  { id: "1.2", name: "I'm a new item!" },
]);

setColumns(updatedColumns);
```

---

### `removeColumnItem`

```typescript
export declare function removeColumnItem(
  items: Columns,
  columnId: UniqueIdentifier,
  itemId: UniqueIdentifier
): {
  id: UniqueIdentifier;
  name: string;
  items: Item[];
}[];
```

Removes an item from a specified column. Use this function when an item is dropped into the trashable drop zone, or moved to the "create new column" drop zone.

**Usage Example**:

```tsx
<KanbanBoard
  onAddColumn={(data) => {
    if (data?.item) {
      const updatedColumns = removeColumnItem(columns, data.fromContainer, data.item.id);
      setColumns(() => [...updatedColumns, { id: "3", name: "Column C created on the fly", items: [data.item] }]);
    } else {
      setColumns((currentColumns) => [...currentColumns, { id: "3", name: "Column C created on the fly", items: [] }]);
    }
  }}
/>
```

---

### `removeColumn`

```typescript
export declare function removeColumn(
  items: Columns,
  columnId: UniqueIdentifier
): {
  id: UniqueIdentifier;
  name: string;
  items: Item[];
}[];
```

Removes a column by its ID. Useful for handling scenarios where a column is deleted from the board.

**Usage Example**:

```typescript
const updatedColumns = removeColumn(columns, "1");
setColumns(updatedColumns);
```

---

### `updateColumnName`

```typescript
export declare function updateColumnName(
  items: Columns,
  columnId: UniqueIdentifier,
  newName: string
): {
  id: UniqueIdentifier;
  name: string;
  items: Item[];
}[];
```

Updates the name of a specific column by its ID.

**Usage Example**:

```typescript
const updatedColumns = updateColumnName(columns, "1", "My name changed!");
setColumns(updatedColumns);
```

## Roadmap

We're constantly working to improve @clevertask/kanban-board-ui. Here are some features we're planning to implement:

- **Virtualization**: Improve performance for large trees by only rendering visible nodes.
- **Custom item rendering**: This is supported partially, the thing is that you'll only have access to the item's `id` and `name` props. The idea is that we can send properties to the item object as needed so you can build your item without any restrictions.
- **Drag multiple items**: Enable dragging and dropping multiple selected items at once.
- **API Example**: Provide a comprehensive example illustrating real-world usage with a backend API.
- **E2E tests**: It will ensure this component's working as expected.

We're excited about these upcoming features and welcome any feedback or contributions from the community. If you have any suggestions or would like to contribute to any of these features, please open an issue or submit a pull request on our GitHub repository.

## Release Process

This package is automatically published to npm when a new release is created on GitHub. To create a new release:

1. Update the version in `package.json` according to semantic versioning rules.
2. Commit the version change: `git commit -am "Bump version to x.x.x"`
3. Create a new tag: `git tag vx.x.x`
4. Push the changes and the tag: `git push && git push --tags`
5. Go to the GitHub repository and create a new release, selecting the tag you just created.

The GitHub Action will automatically build, test, and publish the new version to npm.

## License

MIT
