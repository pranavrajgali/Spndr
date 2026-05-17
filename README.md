# Spndr

Spndr is an AI-powered financial dashboard designed specifically for students. It combines automated transaction tracking, intelligent bank statement parsing, and personalized financial coaching into a single, cohesive experience.

## Core Features

- AI Financial Coach: A savage, witty conversational assistant that provides brutally honest budgeting advice.
- Intelligent Statement Import: Automated parsing of bank and UPI PDF statements.
- Receipt Scanner: In-browser OCR (Tesseract.js) for instant receipt logging.
- Context-Aware Dashboard: Real-time visualization of daily allowances, category breakdowns, and monthly trends.
- Budget Guardrails: Category-specific spending limits with automated warnings and status indicators.
- Wealth Tracking: Historical balance trends and wallet growth visualization.
- Multi-Frequency Onboarding: Support for weekly, monthly, or flexible money transfer schedules.

## Technology Stack

- Framework: Next.js 16 (App Router)
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- AI Engine: Groq (Llama 3.3 70B for text, Llama 3.1 8B for fast tasks)
- OCR: Tesseract.js (in-browser, no API key needed)
- Styling: Vanilla CSS with Glassmorphic design principles
- Charts: Recharts

## Getting Started

### Prerequisites

- Node.js 18.x or later
- Supabase account
- Groq API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pranavrajgali/SpendSense.git
   cd SpendSense
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a .env.local file in the root directory and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. Database Setup:
   Run the SQL found in `supabase/schema.sql` within your Supabase SQL Editor to initialize tables, triggers, and RLS policies.

5. Run the development server:
   ```bash
   npm run dev
   ```

## Documentation

For more detailed information, please refer to the documentation in the `docs/` directory:

- PROJECT_HANDOFF.md: Current project state and development log.
- DEVELOPMENT_BLUEPRINT.md: SpendSense-specific development process.
- UNIVERSAL_PROJECT_BLUEPRINT.md: Reusable project management framework.

## License

This project is licensed under the MIT License.
