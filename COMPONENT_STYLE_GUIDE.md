# Component Style Guide
## Car Rental Management System

This guide provides visual examples and usage guidelines for all UI components in the system.

---

## Buttons

### Variants

#### Primary Button
**Usage**: Main actions, form submissions, confirmations
```tsx
<Button variant="default">Save Changes</Button>
<Button variant="default" size="sm">Small Primary</Button>
<Button variant="default" size="lg">Large Primary</Button>
```
- Background: `#2563EB` (Blue 600)
- Text: White
- Height: 32px (sm), 40px (default), 48px (lg)
- Padding: 12px 16px (sm), 12px 16px (default), 16px 24px (lg)

#### Secondary Button
**Usage**: Less prominent actions, cancel buttons
```tsx
<Button variant="secondary">Cancel</Button>
```
- Background: `#F3F4F6` (Gray 100)
- Text: `#111827` (Gray 900)
- Hover: `#E5E7EB` (Gray 200)

#### Outline Button
**Usage**: Tertiary actions, filters, toggles
```tsx
<Button variant="outline">Filter</Button>
```
- Background: Transparent
- Border: 1px solid `#E5E7EB`
- Hover: `#F3F4F6` background

#### Ghost Button
**Usage**: Minimal actions, icon buttons
```tsx
<Button variant="ghost">More Options</Button>
```
- Background: Transparent
- Hover: `#F3F4F6` background

#### Destructive Button
**Usage**: Delete, remove, cancel actions
```tsx
<Button variant="destructive">Delete</Button>
```
- Background: `#EF4444` (Red 500)
- Text: White
- Hover: `#DC2626` (Red 600)

### States
- **Hover**: Darker shade, subtle shadow increase
- **Active**: Pressed appearance
- **Disabled**: 50% opacity, not clickable
- **Focus**: 2px blue ring with offset

---

## Input Fields

### Text Input
```tsx
<Input type="text" placeholder="Enter value..." />
```
- Height: 40px
- Padding: 8px 12px
- Border: 1px solid `#E5E7EB`
- Border radius: 6px
- Font size: 16px

### States
- **Default**: Gray border
- **Focus**: Blue ring + blue border
- **Error**: Red border + red ring
- **Disabled**: Gray background, 60% opacity

### Textarea
```tsx
<Textarea placeholder="Enter description..." rows={4} />
```
- Same styling as Input
- Min height: 80px
- Resizable vertically

### Select
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

## Cards

### Standard Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```
- Background: `#F9FAFB` (Gray 50)
- Border: 1px solid `#E5E7EB`
- Border radius: 8px
- Padding: 24px
- Shadow: Subtle (0 1px 2px rgba(0,0,0,0.05))

### Elevated Card
**Usage**: Important content, hover states
- Background: White
- Shadow: Medium (0 4px 6px rgba(0,0,0,0.1))

---

## Modals/Dialogs

### Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```
- Max width: 500px (default), 800px (large)
- Border radius: 16px
- Padding: 32px
- Shadow: Large (0 20px 25px rgba(0,0,0,0.1))
- Backdrop: rgba(0,0,0,0.5)

---

## Tables

### Data Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```
- Border: 1px solid `#E5E7EB`
- Row hover: `#F9FAFB` background
- Header: `#F3F4F6` background, semibold text
- Cell padding: 12px 16px

---

## Badges

### Status Badges
```tsx
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Cancelled</Badge>
<Badge variant="outline">Draft</Badge>
```
- Height: 20px
- Padding: 2px 10px
- Border radius: 9999px (pill shape)
- Font size: 12px
- Font weight: 600

---

## Typography

### Headings
```tsx
<h1>Page Title</h1>        // 36px, Bold
<h2>Section Title</h2>     // 30px, Semibold
<h3>Subsection Title</h3>  // 24px, Semibold
<h4>Card Title</h4>        // 20px, Semibold
```

### Body Text
```tsx
<p>Default body text</p>              // 16px, Normal
<p className="text-sm">Small text</p> // 14px, Normal
<p className="text-xs">Caption</p>    // 12px, Medium
```

### Text Colors
```tsx
<p className="text-text-primary">Primary text</p>       // #111827
<p className="text-text-secondary">Secondary text</p>   // #6B7280
<p className="text-text-tertiary">Tertiary text</p>     // #9CA3AF
```

---

## Icons

### Guidelines
- **Library**: Lucide React
- **Stroke width**: 2px
- **Sizes**: 
  - Small: 16px (`className="h-4 w-4"`)
  - Medium: 20px (`className="h-5 w-5"`)
  - Large: 24px (`className="h-6 w-6"`)
- **Color**: Inherit from parent

### Usage
```tsx
import { Check, X, AlertCircle } from "lucide-react";

<Button>
  <Check className="h-4 w-4" />
  Save
</Button>
```

---

## Spacing

### Margin/Padding Scale
- `p-1`: 4px
- `p-2`: 8px
- `p-3`: 12px
- `p-4`: 16px
- `p-6`: 24px
- `p-8`: 32px
- `p-12`: 48px
- `p-16`: 64px

### Gap Scale (for flex/grid)
- `gap-1`: 4px
- `gap-2`: 8px
- `gap-3`: 12px
- `gap-4`: 16px
- `gap-6`: 24px
- `gap-8`: 32px

---

## Layout

### Container
```tsx
<div className="container">
  {/* Content */}
</div>
```
- Max width: 1280px
- Padding: 16px (mobile), 24px (tablet), 32px (desktop)
- Centered with `mx-auto`

### Grid Layouts
```tsx
// 2-column grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

// 3-column grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

---

## Forms

### Form Layout
```tsx
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input id="name" placeholder="Enter name" />
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="Enter email" />
  </div>
  
  <div className="flex gap-3 justify-end">
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Submit</Button>
  </div>
</form>
```

### Form Validation
- **Error state**: Red border + error message below
- **Success state**: Green border (optional)
- **Helper text**: Gray text below input

---

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach
```tsx
// Stack on mobile, side-by-side on tablet+
<div className="flex flex-col md:flex-row gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## Accessibility

### Focus States
- All interactive elements have visible focus rings
- Focus ring: 2px blue ring with 2px offset
- Never remove focus indicators

### Color Contrast
- Text on background: Minimum 4.5:1
- Interactive elements: Minimum 3:1

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order
- Enter/Space activates buttons

---

## Dark Mode

### Automatic Support
All components automatically support dark mode through CSS variables. No additional code needed.

### Testing Dark Mode
```tsx
// Add dark class to root element
<html className="dark">
```

---

## Best Practices

### DO
✅ Use design tokens (CSS variables) for colors
✅ Use consistent spacing (multiples of 4px)
✅ Use semantic color names (primary, danger, success)
✅ Keep button text short and action-oriented
✅ Provide loading states for async actions
✅ Show error messages clearly
✅ Use icons to enhance understanding

### DON'T
❌ Hardcode color values
❌ Mix spacing units
❌ Use more than 2 font families
❌ Create custom components when shadcn/ui exists
❌ Ignore accessibility
❌ Skip loading/error states
❌ Use too many colors

---

## Component Checklist

When creating or updating components:
- [ ] Uses design tokens (CSS variables)
- [ ] Follows spacing scale
- [ ] Has all states (hover, active, disabled, focus)
- [ ] Is keyboard accessible
- [ ] Has proper ARIA labels
- [ ] Works in dark mode
- [ ] Is responsive (mobile-first)
- [ ] Has loading state (if async)
- [ ] Has error state (if applicable)
- [ ] Follows typography hierarchy
