# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SnapCal is a mobile-focused nutrition tracking application built with Next.js and Tailwind CSS. The app allows users to take photos of their meals and get AI-powered nutritional analysis using the Doubao API. The interface is optimized for mobile devices with a bottom navigation bar and floating action button for camera access.

## Development Commands

- **Development server**: `pnpm dev` or `npm run dev`
- **Build**: `pnpm build` or `npm run build`
- **Production server**: `pnpm start` or `npm run start`
- **Lint**: `pnpm lint` or `npm run lint`

The project uses pnpm as its primary package manager but npm commands are also available through the scripts.

## Architecture

### Pages Structure
- `/` - Home page with daily calorie tracking, meal logs, and macronutrient breakdown
- `/scan` - Camera interface for capturing food photos
- `/analysis` - Display nutritional analysis of captured food
- `/analytics` - Nutritional trends and historical data
- `/profile` - User profile and settings

### Key Components
- `BottomNav` - Mobile-style bottom navigation bar
- `FabButton` - Floating action button for camera access with drag functionality
- UI components in `/components/ui/` - Built with shadcn/ui components

### AI Integration
- Uses the Doubao API for food image analysis
- Food analysis prompt is located in `lib/ai-config.ts` as `FOOD_ANALYSIS_PROMPT`
- Service layer in `lib/doubao-service.ts` handles API communication
- Response validation and formatting in `lib/ai-config.ts`

### Styling
- Uses Tailwind CSS with custom CSS variables for theming
- Mobile-first design with responsive breakpoints
- Custom color scheme for nutritional elements (protein, carbs, fats)
- Uses the "new-york" style variant from shadcn/ui

### Important Architecture Notes
- Mock data is currently embedded in page components
- API endpoints are not yet implemented (the scan page references `/api/analyze` which doesn't exist)
- TypeScript errors are ignored in the build configuration
- Data flows through session storage for the analysis page

### Language and Localization
- The app is primarily in Chinese (zh-CN)
- All UI text, meal names, and nutritional information are in Chinese
- This affects all user-facing content and error messages

## Environment Variables
- `DOUBAO_API_KEY` - Required for food analysis API (currently has a fallback key in code)

## Dependencies
- Built with Next.js 16
- Uses shadcn/ui for component library
- Implements react-hook-form with zod validation
- Uses lucide-react for all icons
- Nutritional data visualization with recharts

## Testing
The project does not currently have tests configured.