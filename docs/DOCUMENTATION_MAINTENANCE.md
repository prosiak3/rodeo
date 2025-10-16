# Documentation Maintenance Guide

## Overview

This document explains how to maintain and update the RODEO project documentation as the application evolves. **It is critical that documentation stays synchronized with code changes.**

## Documentation Structure

```
project/
├── README.md                          # Project overview, quick start
├── docs/
│   ├── ARCHITECTURE.md                # System architecture, tech stack
│   ├── DATABASE_SCHEMA.md             # Complete database documentation
│   ├── DEVELOPMENT_GUIDE.md           # Developer guidelines, best practices
│   └── DOCUMENTATION_MAINTENANCE.md   # This file
├── AI_DOKUMENTACJA.md                 # AI system documentation (Polish)
├── ANALYTICS_SYSTEM.md                # Analytics & tracking system
├── DEPLOYMENT.md                      # Deployment instructions
└── CAMPAIGN_TRACKING_EXAMPLES.md      # Marketing campaign examples
```

## When to Update Documentation

### 1. Adding New Features

**When you add:**
- New component → Add JSDoc comment to component file
- New database table → Update `DATABASE_SCHEMA.md`
- New user role → Update `ARCHITECTURE.md` roles section
- New API endpoint → Document in relevant file
- New environment variable → Update setup instructions

**Example workflow:**

```typescript
// 1. Add JSDoc to new component
/**
 * NewFeature Component
 * Provides XYZ functionality for ABC use case.
 *
 * @param props - Component properties
 */
export default function NewFeature({ prop1, prop2 }: Props) {
  // ...
}

// 2. If it involves database changes:
// - Create migration with detailed comments
// - Update docs/DATABASE_SCHEMA.md with new table/column

// 3. If it's a major feature:
// - Update docs/ARCHITECTURE.md with architecture changes
// - Update README.md if it changes core functionality
```

### 2. Modifying Existing Features

**When you modify:**
- Component behavior → Update JSDoc if functionality changed
- Database schema → Create migration + update `DATABASE_SCHEMA.md`
- API contracts → Update relevant documentation
- Configuration → Update setup/deployment docs

**What to check:**
- [ ] Is JSDoc still accurate?
- [ ] Do examples still work?
- [ ] Are screenshots up to date?
- [ ] Do links still point to correct locations?

### 3. Fixing Bugs

**For bug fixes:**
- Update JSDoc if incorrect assumptions were documented
- Add notes about edge cases discovered
- Update troubleshooting section if relevant

### 4. Refactoring Code

**When refactoring:**
- Update file paths in documentation
- Update import examples if module structure changed
- Refresh architecture diagrams if applicable
- Update code examples to match new patterns

## Documentation Standards

### JSDoc Comments (In-Code Documentation)

**All exported functions/components must have JSDoc:**

```typescript
/**
 * Brief one-line description.
 *
 * Detailed explanation if needed (optional).
 * Multiple paragraphs OK.
 *
 * @param paramName - Parameter description
 * @param anotherParam - Another parameter
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * const result = myFunction('input', 42);
 * console.log(result); // Expected output
 */
export function myFunction(paramName: string, anotherParam: number): ReturnType {
  // Implementation
}
```

**For React components:**

```typescript
/**
 * Component brief description.
 *
 * Detailed description of what this component does,
 * when to use it, and any important notes.
 *
 * @param props - Component props
 * @param props.propName - Specific prop description
 *
 * @example
 * <MyComponent propName="value" onAction={handleAction} />
 */
interface MyComponentProps {
  /** Prop description */
  propName: string;
  /** Handler called when action occurs */
  onAction: () => void;
}

export default function MyComponent({ propName, onAction }: MyComponentProps) {
  return <div>{propName}</div>;
}
```

**For TypeScript interfaces:**

```typescript
/**
 * User profile information from database.
 * Linked to Supabase Auth users.
 */
export interface User {
  /** Unique identifier (UUID), matches auth.users.id */
  id: string;
  /** User's email address */
  email: string;
  /** Full display name */
  full_name: string;
  /** User role determining permissions */
  role: UserRole;
  // ... more fields with inline comments
}
```

### Markdown Documentation (Separate Files)

**File structure:**

```markdown
# Title

## Overview
Brief introduction to the topic.

## Section 1
Content...

### Subsection 1.1
More specific content...

## Examples
Practical examples with code blocks.

## Related Documentation
Links to other relevant docs.

---
**Last Updated**: YYYY-MM-DD
**Version**: X.Y
**Maintainer**: Your Name/Team
```

**Code blocks:**

````markdown
```typescript
// Always specify language for syntax highlighting
const example = "code";
```
````

**Tables:**

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value A  | Value B  | Value C  |
```

**Lists:**

```markdown
- Unordered list item
- Another item
  - Nested item

1. Ordered list item
2. Another item
   1. Nested item
```

**Links:**

```markdown
[Link text](./relative/path/to/file.md)
[External link](https://example.com)
[Section link](#section-heading)
```

### Database Migration Comments

**Every migration must have:**

```sql
/*
  # Migration Title

  ## Description
  Brief description of what this migration does.

  ## Changes
  1. New Tables
    - `table_name`
      - `column1` (type) - description
      - `column2` (type) - description

  2. Modified Tables
    - `existing_table` - added `new_column`

  3. Security
    - RLS policies for `table_name`
    - New role permissions

  ## Notes
  - Important considerations
  - Breaking changes (if any)
*/

-- SQL statements here
CREATE TABLE IF NOT EXISTS ...;
```

## Checklist: Adding Documentation for New Code

### For New Components

- [ ] JSDoc comment at top of file
- [ ] Props interface documented with inline comments
- [ ] Complex logic explained with inline comments
- [ ] Usage example in JSDoc
- [ ] Update `ARCHITECTURE.md` if introduces new pattern

### For New Database Tables

- [ ] Migration includes detailed header comment
- [ ] Update `docs/DATABASE_SCHEMA.md`:
  - [ ] Add table to relevant section
  - [ ] Document all columns
  - [ ] Document relationships
  - [ ] Document RLS policies
  - [ ] Add indexes
- [ ] Add TypeScript interface to `src/lib/supabase.ts`
- [ ] Document interface fields with inline comments

### For New Features

- [ ] Update `README.md` if user-facing
- [ ] Update `docs/ARCHITECTURE.md` if architectural change
- [ ] Create example usage if complex
- [ ] Update relevant screenshots (if UI change)
- [ ] Document in relevant *_DOKUMENTACJA.md files

### For API Changes

- [ ] Document new endpoints/functions
- [ ] Update examples to match new API
- [ ] Note breaking changes prominently
- [ ] Update integration examples

## Documentation Review Process

### Before Committing Code

1. **Self-review:**
   - [ ] Read your JSDoc comments - are they clear?
   - [ ] Check code examples - do they work?
   - [ ] Verify links - do they point to correct files?
   - [ ] Check spelling and grammar

2. **Test documentation:**
   - [ ] Can a new developer understand it?
   - [ ] Are examples copy-paste ready?
   - [ ] Is technical jargon explained?

3. **Update timestamps:**
   - [ ] Set "Last Updated" date in modified docs
   - [ ] Increment version if major changes

### During Code Review

Reviewer should check:
- [ ] Documentation exists for new code
- [ ] JSDoc is accurate and helpful
- [ ] Examples are correct and runnable
- [ ] No broken links
- [ ] Markdown renders correctly

### Quarterly Documentation Audit

Every 3 months:
- [ ] Review all JSDoc comments for accuracy
- [ ] Test all code examples
- [ ] Update screenshots if UI changed
- [ ] Fix broken links
- [ ] Archive outdated documentation
- [ ] Update architecture diagrams

## Tools & Tips

### VS Code Extensions

**Recommended:**
- **Better Comments** - Highlights different comment types
- **Markdown All in One** - Markdown editing tools
- **Markdown Preview Enhanced** - Live preview
- **TSDoc Comment** - Auto-generate JSDoc templates

### Generating JSDoc

VS Code shortcut: Type `/**` above function and press Enter

```typescript
// Type /** and press Enter here
function myFunction(param1: string) {
  // Auto-generates:
  /**
   *
   * @param param1
   */
}
```

### Markdown Preview

```bash
# In VS Code
Cmd+Shift+V (Mac) or Ctrl+Shift+V (Windows)

# Or install markdown viewer
npm install -g marked
marked README.md -o output.html
```

### Link Checking

```bash
# Install markdown-link-check
npm install -g markdown-link-check

# Check for broken links
markdown-link-check README.md
markdown-link-check docs/*.md
```

## Common Documentation Pitfalls

### ❌ Don't Do This

**1. Obvious comments:**
```typescript
// Bad: States the obvious
i++; // Increment i by 1
```

**2. Outdated examples:**
```typescript
// Bad: Function signature changed but example didn't
/**
 * @example
 * calculate(10, 20); // Now requires 3 arguments!
 */
function calculate(a: number, b: number, options: Options) {}
```

**3. Missing context:**
```typescript
// Bad: No explanation why
// Set to 42
const magic = 42;
```

**4. Copy-paste docs:**
```typescript
// Bad: Generic comment copied without updating
/**
 * This function does something.
 * @param x - The x parameter
 */
function calculateOrderTotal(items: OrderItem[]) {}
```

### ✅ Do This Instead

**1. Explain why, not what:**
```typescript
// Good: Explains reasoning
// Reset counter to prevent memory leak in long-running sessions
counter = 0;
```

**2. Keep examples in sync:**
```typescript
// Good: Matches current signature
/**
 * @example
 * calculate(10, 20, { currency: 'PLN' });
 */
function calculate(a: number, b: number, options: Options) {}
```

**3. Provide context:**
```typescript
// Good: Explains the magic number
// 42 is the maximum concurrent uploads supported by the browser
const MAX_CONCURRENT_UPLOADS = 42;
```

**4. Write specific docs:**
```typescript
// Good: Specific and helpful
/**
 * Calculate total order amount including promotions and special pricing.
 * Applies 10+1 bonus and percentage discounts automatically.
 *
 * @param items - Order line items with products
 * @returns Total in PLN with 2 decimal precision
 */
function calculateOrderTotal(items: OrderItem[]): number {}
```

## Documentation Templates

### New Component Template

```typescript
/**
 * [ComponentName] Component
 *
 * [Brief description of what this component does and when to use it]
 *
 * Features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 *
 * @param props - Component props
 * @param props.prop1 - Description of prop1
 * @param props.prop2 - Description of prop2
 *
 * @example
 * <ComponentName
 *   prop1="value"
 *   prop2={handler}
 * />
 */
interface ComponentNameProps {
  /** Prop1 description */
  prop1: string;
  /** Prop2 description */
  prop2: () => void;
}

export default function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // Implementation
}
```

### New Utility Function Template

```typescript
/**
 * [Brief one-line description]
 *
 * [Detailed explanation if needed]
 *
 * @param param1 - Description
 * @param param2 - Description
 * @returns Description of return value
 * @throws {ErrorType} When error occurs
 *
 * @example
 * const result = functionName('input', 42);
 * console.log(result); // Expected: ...
 */
export function functionName(param1: string, param2: number): ReturnType {
  // Implementation
}
```

### New Database Table Template

```markdown
### N. table_name

Brief description of what this table stores.

\`\`\`sql
CREATE TABLE table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column1 type NOT NULL,
  column2 type,
  created_at timestamptz DEFAULT now()
);
\`\`\`

**Columns:**
- `id`: Unique identifier (UUID)
- `column1`: Description of column1
- `column2`: Description of column2
- `created_at`: Record creation timestamp

**Relationships:**
- References `other_table` via `foreign_key`

**Indexes:**
- `table_name_column1_idx` on `column1` for fast lookup

**RLS Policies:**
- Store managers: Can view own data
- Admins: Full access

**Usage Example:**
\`\`\`typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column1', value);
\`\`\`
```

## Automated Documentation

### TypeScript Types → Documentation

Consider using tools:
- **TypeDoc** - Generate docs from TypeScript comments
- **Docusaurus** - Build documentation website
- **Storybook** - Component documentation

### Database Schema → Documentation

```bash
# Use Supabase CLI to export schema
supabase db dump --schema public > schema.sql

# Or query information_schema
psql -c "SELECT * FROM information_schema.tables"
```

## Quick Reference

**File to update when...**

| Change Type | Files to Update |
|-------------|-----------------|
| New React component | Component file (JSDoc), optionally ARCHITECTURE.md |
| New database table | Migration (comment), DATABASE_SCHEMA.md, supabase.ts (interface) |
| New user role | supabase.ts (type), ARCHITECTURE.md (roles), DATABASE_SCHEMA.md (RLS) |
| New feature | README.md (if user-facing), ARCHITECTURE.md (if architectural) |
| Config change | DEVELOPMENT_GUIDE.md (setup), DEPLOYMENT.md (deployment) |
| Bug fix | Inline comments (if assumptions changed), TROUBLESHOOTING.md |
| API change | Relevant doc file, update all examples |

---

## Remember

> **Good documentation is living documentation.**
>
> Update it with every change, not "when I have time later."

Documentation debt compounds like technical debt. It's easier to update docs immediately than to reverse-engineer your code later.

---

**Last Updated**: 2025-10-16
**Maintainer**: RODEO Development Team
