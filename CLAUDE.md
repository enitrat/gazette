# Gazette Development Guidelines

## Common Bug Patterns to Avoid

### Zustand Selectors with Array Methods (CRITICAL)

This pattern caused a production bug: "The result of getSnapshot should be cached to avoid an infinite loop"

**Bug Pattern (DO NOT DO THIS):**
```tsx
const elements = useStore((state) => state.items.filter(i => i.pageId === pageId));
```

**Why this causes infinite loops:**
- `filter()`, `map()`, and other array methods always return NEW array references
- Zustand's `getSnapshot` (used by React's `useSyncExternalStore`) returns this new reference
- React detects the snapshot changed and re-renders
- Re-render calls the selector again, creating another new array
- Infinite loop → crash

**Correct Pattern (DO THIS):**
```tsx
import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

// Get the raw array with shallow comparison
const allItems = useStore(useShallow((state) => state.items));

// Filter in useMemo to cache the result
const filteredItems = useMemo(
  () => allItems.filter(i => i.pageId === pageId),
  [allItems, pageId]
);
```

**Why this works:**
- `useShallow` does shallow comparison of array contents, not reference
- `useMemo` caches the filtered result between renders
- No new references created during getSnapshot

---

### Radix Dialog `onOpenChange` Handler

**Bug Pattern (DO NOT DO THIS):**
```tsx
<Dialog
  open={isOpen}
  onOpenChange={() => {
    setLocalState(null);
    closeDialog();
  }}
>
```

**Why this causes issues:**
Radix Dialog calls `onOpenChange` on ANY dialog state transition, not just when closing. The callback receives an `open` boolean parameter indicating the desired state. Ignoring this parameter and unconditionally calling state setters can cause:
- Unnecessary state updates
- Dialog failing to open because it immediately closes
- Cascading re-renders

**Correct Pattern (DO THIS):**
```tsx
<Dialog
  open={isOpen}
  onOpenChange={(open) => {
    if (!open) {
      setLocalState(null);
      closeDialog();
    }
  }}
>
```

**Alternative - Pass function directly when no local state reset needed:**
```tsx
<Dialog open={isOpen} onOpenChange={closeDialog}>
```
