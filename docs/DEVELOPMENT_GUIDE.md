# RODEO - Development Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Coding Standards](#coding-standards)
4. [Common Development Tasks](#common-development-tasks)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase account and project
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/rodeo.git
cd rodeo
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create `.env` file in project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from:
- Supabase Dashboard → Settings → API

4. **Apply database migrations:**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

5. **Start development server:**
```bash
npm run dev
```

Application will be available at `http://localhost:5173`

6. **Create test users:**
Use the "Utwórz użytkowników testowych" button on login screen, or manually in Supabase Dashboard → Authentication.

---

## Project Structure

```
rodeo/
├── public/                 # Static assets (PWA manifest, service worker)
├── src/
│   ├── components/         # React components
│   │   ├── *Screen.tsx    # Full-page screens
│   │   ├── *Panel.tsx     # Admin panels
│   │   ├── *Manager.tsx   # CRUD management components
│   │   └── *.tsx          # Shared/utility components
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Business logic & utilities
│   ├── App.tsx            # Main app component with routing
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── supabase/
│   ├── migrations/        # Database schema migrations
│   └── functions/         # Edge Functions (Deno)
├── docs/                  # Technical documentation
├── .env                   # Environment variables (gitignored)
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite build config
└── tailwind.config.js     # Tailwind CSS config
```

### Component Organization

**Screens** (`*Screen.tsx`):
- Full-page components representing main app sections
- Examples: `HomeScreen`, `OrderDetails`, `VoiceOrderScreen`
- Should be lazy-loaded for better performance

**Panels** (`*Panel.tsx`):
- Admin/management interfaces
- Examples: `AdminPanel`, `AnalyticsPanel`

**Managers** (`*Manager.tsx`):
- CRUD operations for data entities
- Examples: `ProductManager`, `UsersManager`, `StoresManager`

**Shared Components**:
- Reusable UI elements
- Examples: `Modal`, `ConfirmDialog`, `ProductCard`

---

## Coding Standards

### TypeScript

**Always use explicit types:**

```typescript
// Good
const calculateTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.total_price, 0);
};

// Bad
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.total_price, 0);
};
```

**Use interfaces over types for objects:**

```typescript
// Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// Avoid (use only for unions/intersections)
type UserProfile = {
  id: string;
  name: string;
  email: string;
};
```

### React Components

**Functional components with hooks:**

```typescript
/**
 * Component description
 * @param props - Component props
 */
interface ProductCardProps {
  product: Product;
  onSelect: (productId: string) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  // State
  const [loading, setLoading] = useState(false);

  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // Handlers
  const handleClick = () => {
    onSelect(product.id);
  };

  // Render
  return (
    <div onClick={handleClick}>
      {product.name}
    </div>
  );
}
```

**Component Structure Order:**
1. JSDoc comment
2. Props interface
3. Component function
4. Hooks (useState, useContext, etc.)
5. Effects (useEffect)
6. Event handlers
7. Helper functions
8. Render/return

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `OrderDetails.tsx`)
- Utilities: `camelCase.ts` (e.g., `priceCalculations.ts`)
- Types: `PascalCase.ts` or included in main file

**Variables:**
- camelCase for variables and functions
- PascalCase for React components and classes
- UPPER_CASE for constants

```typescript
// Variables & functions
const userName = "Jan";
const calculatePrice = (amount: number) => amount * 1.23;

// Components
const UserProfile = () => <div>Profile</div>;

// Constants
const MAX_ORDER_ITEMS = 100;
const API_TIMEOUT = 5000;
```

**Boolean variables:**
- Prefix with `is`, `has`, `should`, `can`

```typescript
const isLoading = true;
const hasPermission = checkPermission(user);
const shouldShowModal = orders.length > 0;
const canEdit = user.role === 'admin';
```

### Comments & Documentation

**JSDoc for all exported functions:**

```typescript
/**
 * Calculate total order amount including promotions.
 *
 * @param items - Array of order items
 * @param storeId - Store ID for special pricing lookup
 * @returns Total amount in PLN
 *
 * @example
 * const total = await calculateOrderTotal(items, 'store-uuid');
 * console.log(total); // 1234.56
 */
export async function calculateOrderTotal(
  items: OrderItem[],
  storeId: string
): Promise<number> {
  // Implementation
}
```

**Inline comments for complex logic:**

```typescript
// Calculate bonus quantity for 10+1 promotion
// Buy 10kg, get 11kg (pay for 10 + 0.01 PLN)
if (product.promo_10_plus_1 && quantity >= 10) {
  const bonusQuantity = Math.floor(quantity / 10);
  deliveryQuantity = quantity + bonusQuantity;
  totalPrice = quantity * unitPrice + 0.01;
}
```

**Avoid obvious comments:**

```typescript
// Bad - comment states the obvious
// Increment counter by 1
counter = counter + 1;

// Good - no comment needed, code is self-explanatory
counter += 1;

// Good - comment explains WHY, not WHAT
// Reset counter to maintain memory efficiency
counter = 0;
```

### Error Handling

**Always handle Supabase errors:**

```typescript
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .maybeSingle();

if (error) {
  console.error('Failed to load order:', error);
  showAlert('error', 'Nie udało się załadować zamówienia');
  return;
}

if (!data) {
  showAlert('warning', 'Zamówienie nie znalezione');
  return;
}

// Process data
```

**Try-catch for async operations:**

```typescript
try {
  setLoading(true);
  const result = await performOperation();
  setData(result);
} catch (error) {
  console.error('Operation failed:', error);
  showAlert('error', 'Wystąpił błąd');
} finally {
  setLoading(false);
}
```

### CSS & Styling

**Use Tailwind utility classes:**

```tsx
// Good
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Click me
</button>

// Avoid inline styles unless dynamic
<button style={{ backgroundColor: dynamicColor }}>
  Dynamic
</button>
```

**Consistent spacing scale (8px grid):**
- `p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, etc.
- Use: `p-2`, `p-3`, `p-4`, `p-6`, `p-8` for consistent spacing

**Responsive design:**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

---

## Common Development Tasks

### Adding a New Component

1. **Create component file:**
```bash
touch src/components/NewFeatureScreen.tsx
```

2. **Basic structure:**
```typescript
/**
 * New Feature Screen
 * Description of what this screen does.
 */
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function NewFeatureScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">New Feature</h1>
      {/* Content */}
    </div>
  );
}
```

3. **Import in App.tsx:**
```typescript
import NewFeatureScreen from './components/NewFeatureScreen';

// Add to routing logic
if (activeTab === 'new-feature') {
  return <NewFeatureScreen />;
}
```

### Adding a Database Table

1. **Create migration file:**
```bash
supabase migration new add_feature_table
```

2. **Write SQL migration:**
```sql
/*
  # Add Feature Table

  1. New Tables
    - `features`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read features"
  ON features FOR SELECT
  TO authenticated
  USING (true);
```

3. **Apply migration:**
```bash
supabase db push
```

4. **Add TypeScript interface:**
```typescript
// In src/lib/supabase.ts
export interface Feature {
  id: string;
  name: string;
  created_at: string;
}
```

### Adding a New User Role

1. **Update UserRole type:**
```typescript
// src/lib/supabase.ts
export type UserRole =
  | 'store_manager'
  | 'salesperson'
  | 'operator'
  | 'admin'
  | 'driver'
  | 'analyst'
  | 'new_role';  // Add here
```

2. **Create migration for RLS policies:**
```sql
-- Allow new_role to perform specific actions
CREATE POLICY "New role can read orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'new_role'
    )
  );
```

3. **Add UI logic in App.tsx:**
```typescript
if (user.role === 'new_role') {
  return <NewRoleScreen />;
}
```

### Adding Analytics Tracking

1. **Import hook:**
```typescript
import { useUserTracking } from '../hooks/useUserTracking';
```

2. **Initialize in component:**
```typescript
const { trackClick, trackProductAction } = useUserTracking(
  user?.id || null,
  'my-screen'
);
```

3. **Track events:**
```typescript
// Track button click
<button onClick={() => {
  trackClick('submit-order');
  handleSubmit();
}}>
  Submit
</button>

// Track product interaction
const handleAddProduct = (product: Product) => {
  trackProductAction('add_to_list', product.id, product.name);
  addToOrder(product);
};
```

### Adding a Supabase Edge Function

1. **Create function directory:**
```bash
mkdir -p supabase/functions/my-function
touch supabase/functions/my-function/index.ts
```

2. **Write function code:**
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Your logic here
    const data = { message: "Hello from Edge Function" };

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
```

3. **Deploy function:**
```bash
supabase functions deploy my-function
```

4. **Call from frontend:**
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/my-function`,
  {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  }
);
const data = await response.json();
```

---

## Testing

### Manual Testing Checklist

Before deploying changes:

- [ ] Test in Chrome (desktop & mobile view)
- [ ] Test in Safari (iOS if possible)
- [ ] Test with different user roles
- [ ] Test offline functionality (PWA)
- [ ] Check browser console for errors
- [ ] Verify responsive design at multiple breakpoints

### TypeScript Type Checking

```bash
npm run typecheck
```

Fix all type errors before committing.

### Build Verification

```bash
npm run build
npm run preview
```

Ensure production build works correctly.

### Database Testing

Test RLS policies in Supabase Dashboard:

1. Go to SQL Editor
2. Run queries as different users:
```sql
-- Test as store manager
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid", "role": "authenticated"}';
SELECT * FROM orders;
```

---

## Deployment

### Environment-Specific Builds

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm run preview  # Test production build locally
```

### Deployment Platforms

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed instructions for:
- Vercel (recommended)
- Netlify
- Railway
- Render

### Environment Variables

Ensure these are set in deployment platform:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Pre-Deployment Checklist

- [ ] Run `npm run typecheck` - no errors
- [ ] Run `npm run build` - successful
- [ ] Test production build locally with `npm run preview`
- [ ] Database migrations applied to production
- [ ] Environment variables configured
- [ ] RLS policies tested and verified
- [ ] Service Worker cache invalidated if needed

---

## Troubleshooting

### Common Issues

#### 1. "Missing Supabase environment variables"

**Problem:** `.env` file not configured or variables not loaded

**Solution:**
```bash
# Create .env file
cp .env.example .env

# Edit with your values
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# Restart dev server
npm run dev
```

#### 2. RLS Policy Errors

**Problem:** Database queries fail with permission errors

**Solution:**
- Check user is authenticated: `SELECT auth.uid();`
- Verify policies exist: Check Supabase Dashboard → Authentication → Policies
- Test policy logic in SQL Editor
- Ensure user has correct role in `users` table

#### 3. AI Model Not Loading

**Problem:** Voice orders fail, AI initialization errors

**Solution:**
- Check browser compatibility (Chrome/Edge/Safari 16+)
- Clear IndexedDB: Profile → "Wyczyść pamięć podręczną AI"
- Check browser console for detailed errors
- Verify WebAssembly support: `typeof WebAssembly !== 'undefined'`

#### 4. Build Fails

**Problem:** `npm run build` errors

**Solution:**
```bash
# Check TypeScript errors
npm run typecheck

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

#### 5. Slow Queries

**Problem:** Database queries taking too long

**Solution:**
- Check query execution plan in Supabase Dashboard
- Add missing indexes
- Optimize RLS policies (avoid subqueries if possible)
- Use `.select()` with specific columns instead of `*`

### Debug Tools

**Browser DevTools:**
- Console: Check for errors
- Network: Inspect API calls
- Application → IndexedDB: View cached data
- Application → Service Workers: Check PWA status

**React DevTools:**
- Component tree inspection
- Props/state viewer
- Performance profiler

**Supabase Dashboard:**
- Database → SQL Editor
- Authentication → Users
- Logs → API logs
- Storage → Check uploaded files

---

## Best Practices

### Performance

1. **Lazy load large components:**
```typescript
const AnalyticsPanel = lazy(() => import('./components/AnalyticsPanel'));
```

2. **Memoize expensive calculations:**
```typescript
const totalAmount = useMemo(() => {
  return items.reduce((sum, item) => sum + item.total_price, 0);
}, [items]);
```

3. **Debounce frequent events:**
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => performSearch(query), 300),
  []
);
```

### Security

1. **Never expose sensitive data in client:**
```typescript
// Bad
const API_SECRET = 'secret-key';

// Good - use Edge Functions for sensitive operations
const response = await fetch('/functions/v1/secure-operation', {
  headers: { 'Authorization': `Bearer ${anonKey}` }
});
```

2. **Validate user input:**
```typescript
const quantity = parseFloat(input);
if (isNaN(quantity) || quantity <= 0) {
  showAlert('error', 'Nieprawidłowa ilość');
  return;
}
```

3. **Use RLS, never trust client:**
```sql
-- Always filter by authenticated user
CREATE POLICY "Users see own data"
  ON table_name FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

### Code Quality

1. **Keep functions small and focused:**
```typescript
// Good - single responsibility
const calculateDiscount = (price: number, percentage: number) => {
  return price * (percentage / 100);
};

const applyDiscount = (price: number, percentage: number) => {
  return price - calculateDiscount(price, percentage);
};

// Bad - doing too much
const processOrder = (order) => {
  // 100 lines of code doing everything
};
```

2. **Extract reusable logic:**
```typescript
// Create custom hooks for reusable logic
const useOrderTotal = (items: OrderItem[]) => {
  return useMemo(() => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  }, [items]);
};
```

3. **Write self-documenting code:**
```typescript
// Good - clear variable names
const hasActivePromotions = promotions.some(p => p.active);
const eligibleForDiscount = order.total > 1000 && hasActivePromotions;

// Bad - unclear abbreviations
const hap = proms.some(p => p.act);
const efd = ord.tot > 1000 && hap;
```

---

## Git Workflow

### Branch Strategy

```
main (production)
  └── develop (integration)
       ├── feature/new-order-mode
       ├── feature/analytics-dashboard
       └── bugfix/price-calculation
```

### Commit Messages

Follow conventional commits:

```
feat: add voice order confidence threshold setting
fix: correct price calculation for 10+1 promotion
docs: update database schema documentation
refactor: extract order total calculation to utility
style: format code with prettier
test: add unit tests for price calculations
chore: update dependencies
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Code follows project style guidelines
- [ ] TypeScript types are correct
- [ ] Documentation updated
- [ ] Tested locally
- [ ] Database migrations included (if applicable)
```

---

## Resources

### Documentation

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev/guide/)

### Internal Docs

- [Architecture Overview](./ARCHITECTURE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [AI Documentation](../AI_DOKUMENTACJA.md)
- [Analytics System](../ANALYTICS_SYSTEM.md)

---

**Last Updated**: 2025-10-16
**Version**: 2.0
**Maintainer**: RODEO Development Team
