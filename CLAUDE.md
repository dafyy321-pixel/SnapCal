# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

**Operating System**: Windows 11
**Shell**: PowerShell or CMD
**Language**: All content (comments, documentation, error messages, user prompts) should be in **Simplified Chinese (简体中文)**

### Windows-Specific Commands

- **Path separators**: Use forward slash `/` or double backslash `\\` instead of single backslash `\`
- **Environment variables**:
  - PowerShell: `$env:VARIABLE_NAME`
  - CMD: `%VARIABLE_NAME%`
  - Node.js: `process.env.VARIABLE_NAME`
- **Package manager**: Use `npm` (recommended) or `pnpm`, avoid `yarn`

## Project Overview

**SnapCal** is a Next.js-based mobile-first nutrition tracking application that enables users to take photos of meals and receive AI-powered nutritional analysis using the Doubao API. The app tracks calories and macronutrients (protein, carbohydrates, fats) with visual statistics and trend analysis.

## Key Commands

### Development
```bash
# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev

# Build for production
npm run build
# or
pnpm build

# Start production server
npm run start
# or
pnpm start

# Lint code
npm run lint
# or
pnpm lint

# Type checking (新增脚本)
npm run type-check

# Build with type checking (推荐)
npm run build:check

# Check environment variables
npm run env:check
```

### Database Commands
```bash
# Install Supabase CLI (if needed)
npm install -g supabase

# Push migrations to Supabase
supabase db push

# Or run SQL file directly
psql -h <your-host> -U postgres -d postgres -f migrations/add_nutrition_details.sql
```

## Architecture Overview

### Frontend Structure

```
app/                          # Next.js App Router pages
├── layout.tsx               # Root layout with global styles and metadata
├── page.tsx                 # Home page - daily nutrition overview and meal logs
├── globals.css              # Global styles with CSS variables for theming
├── scan/page.tsx           # Camera/upload interface for food photos
├── analysis/page.tsx       # Nutritional analysis results display
├── analytics/page.tsx      # Trend analysis with charts (本周/上周/本月)
├── profile/page.tsx        # User profile and settings
├── auth/page.tsx           # User login/register
├── meal/[id]/page.tsx      # Individual meal details
└── api/                    # API routes with authentication
    ├── analyze/route.ts    # POST /api/analyze - AI food analysis
    ├── meals/route.ts      # GET/POST /api/meals - Meal CRUD operations
    ├── meals/[id]/route.ts # GET/PUT/DELETE - Single meal operations
    ├── analytics/route.ts  # GET /api/analytics - Nutrition statistics
    └── auth/               # Authentication endpoints
        ├── login/route.ts
        ├── register/route.ts
        └── login-records/route.ts

components/                   # React components
├── ui/                     # shadcn/ui components (button, card, chart, etc.)
├── bottom-nav.tsx          # Bottom navigation bar (mobile-optimized)
├── fab-button.tsx          # Floating action button with drag functionality
├── theme-provider.tsx      # next-themes integration for light/dark modes
└── performance-monitor.tsx # Performance monitoring

lib/                         # Business logic and utilities
├── ai-config.ts            # AI prompt configuration and response validation
├── doubao-service.ts       # Doubao API integration layer
├── supabase.ts             # Supabase client and data services (auth, meals, analytics)
├── env-config.ts           # Environment variables validation and configuration
├── use-meals.ts            # React hooks for meal data management
└── utils.ts                # Utility functions

hooks/                       # Custom React hooks
├── use-mobile.ts          # Mobile device detection
└── use-toast.ts           # Toast notification system
```

### Key Technologies & Dependencies

- **Next.js 16** - React full-stack framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Component library (new-york style variant)
- **Recharts** - Data visualization for nutrition trends
- **Supabase** - Backend database and authentication
- **Doubao API** - AI food analysis and nutrition calculation

## AI Integration Architecture

### Food Analysis Flow

```
User photo / upload image
    ↓
Convert to Base64 (client-side)
    ↓
POST /api/analyze
    ↓
Call Doubao AI API with optimized prompt (lib/ai-config.ts)
    ↓
Parse JSON response + validate data structure
    ↓
Return formatted nutrition data
```

### Critical AI Configuration (lib/ai-config.ts)

- **API Endpoint**: `https://ark.cn-beijing.volces.com/api/v3/chat/completions`
- **Model**: `doubao-seed-1-6-flash-250828`
- **Prompt Engineering**: `FOOD_ANALYSIS_PROMPT` (135 lines)
  - Optimized for Chinese cuisine recognition
  - Macro/micronutrient analysis
  - Portion size estimation
  - Confidence scoring (0-100)
- **Response Validation**: Ensures JSON structure with required fields

### Supported Data Fields

**Required Fields:**
- `name` (string): Food name in Chinese
- `confidence` (number): Confidence score 0-100
- `calories` (number): Calories in kcal
- `protein/carbs/fats` (number): Macronutrients in grams (1 decimal place)
- `ingredients` (string[]): Main ingredients array

**Optional Fields (nutrition object):**
- `sodium` (mg), `fiber` (g), `sugar` (g)
- `calcium` (mg), `iron` (mg), `potassium` (mg)
- `vitaminC`, `vitaminA` (μg), `vitaminD` (μg), `vitaminE` (mg)
- `cholesterol` (mg), `saturatedFat` (g), `transFat` (g)

## Authentication & Data Layer

### Supabase Configuration

**Environment Variables Required:**
```bash
# 必需配置（请复制 .env.template 并重命名为 .env.local）
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DOUBAO_API_KEY=your-doubao-api-key

# 可选配置
USE_MOCK_ANALYSIS=false  # 开发调试用
NODE_ENV=development
```

### 🔒 安全配置更新（2025-11-19）
- ✅ **TypeScript检查已启用**: `ignoreBuildErrors: false`
- ✅ **图片优化已启用**: `unoptimized: false`
- ✅ **安全头部已配置**: X-Content-Type-Options, X-Frame-Options, XSS-Protection
- ✅ **环境变量验证**: 新增 `lib/env-config.ts` 自动验证
- ⚠️ **重要提醒**: 请确保 Supabase 域名已添加到 `next.config.mjs` 的 `images.domains`

### Authentication Flow (lib/supabase.ts)

- ✓ JWT-based authentication with Supabase Auth
- ✓ Session persistence via localStorage
- ✓ Protected API routes with `/api/auth/*`
- ✓ Token-based authorization in API endpoints
- ✗ Refresh token implementation

### Data Services (lib/supabase.ts)

1. **authService**
   - `getCurrentUser()`: Get authenticated user
   - `getSession()`: Get current session
   - `signOut()`: User logout

2. **mealsService**
   - `getMealsByDate(date: string)`: Query meals by date
   - `addMeal(mealData)`: Create new meal record

3. **analyticsService**
   - `getAnalytics(timeframe)`: Get nutrition analytics (本周/上周/本月)

## Database Schema

### user_meals Table

**Core Fields:**
- `id` (uuid): Primary key
- `user_id` (uuid): Foreign key referencing auth.users
- `meal_name` (text): Food name
- `meal_type` (text): Meal category (breakfast/lunch/dinner/snack)
- `meal_date` (date): Record date
- `meal_time` (timestamptz): Record timestamp
- `calories` (numeric): Calories
- `protein/carbs/fats` (numeric): Macronutrients

**Extended Nutrition Fields** (see migrations/README.md):
- `fiber/sugar/sodium/calcium/vitamin_c/iron/cholesterol`
- `saturated_fat/trans_fat/potassium/vitamin_a/vitamin_d/vitamin_e`

**Metadata Fields:**
- `ingredients` (text[]): Ingredient list
- `confidence` (numeric): AI confidence score
- `image_url` (text): Food image URL
- `created_at` (timestamptz): Creation timestamp

## Deployment

### Vercel (Recommended)
```bash
# 1. Link GitHub repository in Vercel dashboard
# 2. Configure environment variables:
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   DOUBAO_API_KEY=
# 3. Automatic deployment on push
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Critical Implementation Notes

### Known Issues

1. **Data Persistence**: Currently uses `sessionStorage` in analysis page - **intended to be replaced with database**
2. **User Authentication**:
   - Login/logout functionality implemented
   - Protected routes via session management
   - **Routes not yet finalized** - needs review and testing
3. **TypeScript**: Build errors ignored (`typescript.ignoreBuildErrors: true` in next.config.mjs)

### Development Priorities

1. ⚠️ **Authentication Route Review**: Login/register routes need testing and validation
2. ⚠️ **API Protection**: Verify all `/api/*` routes require authentication
3. ⚠️ **Route Organization**: Standardize URL patterns across the app
4. 🔴 **Payment Integration**: Algorithmic e-commerce platform with payment flows via API routes

### AI Integration Best Practices

1. Always use `validateAndProcessFoodData()` from `lib/ai-config.ts` before using AI responses
2. Handle AI API failures gracefully with user-friendly error messages
3. Portion adjustments use multiplier (0.5x-3.0x), all nutrients scale proportionally
4. Optimize for Chinese cuisine - account for oil/salt content in calculations
5. Use mock data (`USE_MOCK_ANALYSIS=true`) for development without AI API calls

### Data Flow Patterns

1. **Meal Recording Flow**:
   ```
   Scan page → Camera/Upload → /api/analyze → AI analysis → Analysis page → Adjust portions → Save → POST /api/meals → Database
   ```

2. **Analytics Flow**:
   ```
   Analytics page → GET /api/analytics?timeframe=本周 → Database query → Client-side rendering with Recharts
   ```

3. **Authentication Flow**:
   ```
   Login/Register → /api/auth/* → Generate JWT → Store in localStorage → Use in API headers
   ```

### UI/UX Patterns

- Mobile-first design with bottom navigation (`BottomNav`)
- Floating action button (`FabButton`) with drag functionality
- Responsive layouts using Tailwind CSS
- Dark/light mode support via `next-themes`
- Toast notifications for user feedback
- Loading states for all async operations
- Error boundaries and fallback UI

## Test Strategy

### AI Testing
Set `USE_MOCK_ANALYSIS=true` in `.env.local` for development without AI API calls.

### API Testing
- Use real Supabase instance for integration tests
- Mock authentication tokens for unit tests
- Test error scenarios (invalid images, network failures, etc.)

### UI Testing
- Mobile responsiveness testing required
- Test drag functionality of FAB button
- Verify theme switching (light/dark)
- Cross-browser compatibility testing
