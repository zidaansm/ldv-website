<div align="center">
  <h1>🍷 La Dolce Vita (LDV) 🍷</h1>
  <p><strong>A Premium Discord Community Hub</strong></p>
  <p>
    <a href="https://ldvarch.com">View Live Website</a> •
    <a href="#">Join Discord</a>
  </p>
</div>

---

## 🌟 About The Project

**La Dolce Vita (LDV)** is a vibrant Discord community built for socializing, gaming, and late-night grinds. This repository contains the source code for our official website. 

Designed with a **Neo-Brutalist** aesthetic combined with retro OS window motifs, the website acts as a hub for members to view events, share anonymous messages (Menfess), and view community gallery memories.

### ✨ Key Features

- **🎨 Premium Neo-Brutalist UI**: Bold borders, striking shadows, and smooth micro-interactions powered by Framer Motion.
- **🤫 Secret Board (Menfess)**: Real-time anonymous message board with live comments and likes.
- **📸 Hall of Memories (Gallery)**: A grid of community highlights, supporting both images and looping videos.
- **📅 Events Hub**: Showcase upcoming server events with countdowns and quick registration.
- **🌐 Bilingual Support**: Full English and Indonesian language switching without page reloads.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://gsap.com/)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL & Realtime Subscriptions)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/zidaansm/ldv-website.git
cd ldv-website
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗄️ Database Schema

This project relies on two main Supabase tables:
1. `gallery`: Stores image URLs and metadata for the Hall of Memories.
2. `menfess`, `menfess_comments`, `menfess_likes`: Relational tables for the secret board features.

*(You can use the schema provided in Supabase to quickly set up the backend).*

## 📄 License

Distributed under the MIT License.

---
<div align="center">
  <i>Made with ❤️ by the LDV Team.</i>
</div>
