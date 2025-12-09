# HOI4 Tournament Platform - Features

## Overview
A comprehensive tournament management platform for Hearts of Iron 4 multiplayer competitions, featuring automated bracket management, player registration, and match tracking.

---

## 🎮 Core Features

### 1. User Management & Authentication
- **Discord OAuth Integration**
  - Seamless login with Discord accounts
  - Automatic profile sync (username, avatar)
  - Secure session management 

- **Role-Based Access Control**
  - **Admin**: Full platform control, user management, tournament creation
  - **Matchmaker**: Tournament/match management, player assignments
  - **Player**: Tournament participation, casual games
  - **Public**: View-only access to tournaments

- **User Profiles**
  - Discord integration (username, avatar)
  - Custom username support
  - Account creation date tracking


---

## 🏆 Tournament System

### Tournament Management
- **Create Tournaments**
  - Customizable tournament names
  - Flexible bracket sizes (8, 16, 32, 64 players)
  - Set as "Main Tournament" for homepage featuring
  - Track tournament status (not started, in progress, completed)

- **Bracket System**
  - Automated single-elimination brackets
  - Visual bracket display
  - Round progression (Round of 16 → Quarterfinals → Semifinals → Grand Final)
  - Dynamic round naming based on bracket size

- **Player Signups**
  - Open registration system
  - Nation preference selection (180+ HOI4 nations)
  - Signup status tracking (pending, approved, rejected)
  - Manual player selection for tournaments
  - Discord profile integration in signups

### Match Management
- **Match Tracking**
  - Match status (pending, in progress, completed)
  - Player assignments with nation tags
  - Winner declaration
  - Completion timestamps
  - Match scheduling

- **Nation Selection**
  - Complete HOI4 nation database (180+ nations)
  - Historical flags for WW2 period
  - Ideology-based flag variants
  - Tag-based nation system (GER, SOV, USA, etc.)

---

## 🎲 Casual Games

### Game Creation & Management
- **Create Custom Games**
  - Game name and description
  - Player limit configuration (2-8 players)
  - Co-op mode support
  - Rules and modpack specification
  - Steam Workshop integration

- **Steam Workshop Integration**
  - Direct workshop URL input
  - Automatic mod detection
  - Link to workshop collections

- **Rules Templates**
  - Predefined rule sets
  - Custom rules creation
  - Default template marking
  - Rich text editor support

- **Game Status**
  - Waiting for players
  - In progress
  - Completed

### Player Signups
- **Registration System**
  - Quick signup for available games
  - Nation preference selection
  - Player list visualization
  - Signup cancellation

---

## 📰 News & Announcements

### Content Management
- **News Creation** (Admin/Matchmaker only)
  - Rich text editor (TipTap)
  - Title, excerpt, and full content
  - Category system (Tournament, Update, Announcement)
  - Draft/Published status
  - Author tracking

- **News Display**
  - Latest news on homepage (3 most recent)
  - Dedicated news page
  - Category filtering
  - Individual news article pages
  - Publication date display
  - Draft previews for admins

---

## 🎨 User Interface

### Design & Usability
- **Modern Dark Theme**
  - Professional gaming aesthetic
  - Amber accent colors
  - Zinc/gray color scheme
  - High contrast for readability

- **Responsive Design**
  - Desktop-optimized layout
  - Full-width content areas
  - Card-based layouts
  - Smooth transitions and animations

- **Navigation**
  - Top navigation bar
  - User profile dropdown
  - Admin controls for authorized users
  - Role-based menu items

### Visual Components
- **Nation Flags**
  - Historical WW2-era flags
  - Ideology variants (fascism, communism, democratic, neutrality)
  - High-quality flag assets
  - Fallback flag system

- **Status Indicators**
  - Color-coded match statuses
  - Tournament progress indicators
  - Live game counters
  - Completed match tracking

---

## 🔧 Technical Features

### Backend Infrastructure
- **ClickHouse Database**
  - High-performance columnar database
  - Optimized for time-series data
  - Efficient query performance
  - Mutation synchronization

- **Next.js 15 (App Router)**
  - Server-side rendering
  - API routes
  - Standalone output for Docker
  - TypeScript support

- **API Endpoints**
  - RESTful API design
  - 40+ endpoints
  - Input validation
  - Error handling
  - Rate limiting (via Nginx)

### Security
- **Authentication & Authorization**
  - Secure session tokens (JWT)
  - Role-based permissions
  - Protected routes
  - CSRF protection

- **Input Validation**
  - UUID validation
  - Nation tag validation (3-letter codes)
  - Discord ID validation
  - Content length limits
  - XSS prevention (DOMPurify)

- **API Security**
  - SSRF prevention
  - URL validation (Steam Workshop)
  - Rate limiting
  - Authentication required for sensitive endpoints

### Performance Optimizations
- **Polling Intervals**
  - Homepage: 30s (tournaments, games, news)
  - Tournament list: 30s
  - Tournament detail: 15s (planned)
  - Casual games: 30s (planned)

- **Request Management**
  - AbortController for cleanup
  - Prevents memory leaks
  - Cancels in-flight requests on unmount

- **Database Optimization**
  - Synchronous mutations (SETTINGS mutations_sync = 2)
  - Efficient indexing
  - Batch queries

### Deployment
- **Docker Support**
  - Multi-stage Dockerfile
  - Production-ready configuration
  - Health checks
  - Non-root user execution
  - Standalone Next.js build

- **Environment Configuration**
  - Separate dev/production configs
  - Environment variable validation
  - Secure secrets management

---

## 📊 Data Management

### Database Schema
- **Users Table**
  - UUID-based identification
  - Discord integration fields
  - Role management
  - Activity tracking

- **Tournaments Table**
  - Tournament metadata
  - Status tracking
  - Creator tracking
  - Bracket size configuration

- **Matches Table**
  - Player assignments
  - Nation selections
  - Status tracking
  - Winner recording

- **Tournament Signups**
  - User preferences
  - Approval workflow
  - Nation selection

- **Casual Games**
  - Game configuration
  - Player limits
  - Co-op support
  - Workshop integration

- **News Table**
  - Content storage
  - Draft system
  - Author tracking
  - Category management

---

## 🔐 Admin Features

### Administrative Controls
- **User Management**
  - View all users
  - Assign roles
  - Whitelist management
  - Discord ID tracking

- **Tournament Administration**
  - Create/edit tournaments
  - Manage brackets
  - Player assignments
  - Match results

- **Content Management**
  - Create/edit news
  - Publish/unpublish articles
  - Category management
  - Draft previews

- **Casual Games**
  - Player assignments
  - Game status updates
  - Rules template management

---

## 🌐 Integration Points

### External Services
- **Discord**
  - OAuth authentication
  - Profile synchronization
  - Avatar integration
  - Username sync

- **Steam Workshop**
  - Mod collection links
  - Workshop URL validation
  - Security checks (SSRF prevention)

### Future Integrations (Roadmap)
- Twitch streaming
- Tournament brackets API
- Mobile app backend
- Third-party analytics

---

## 📈 Current Statistics Tracking
- Total matches played
- Tournament completion
- User activity
- Active players count

---

## 🎯 Platform Capabilities Summary

### What You Can Do
✅ Host competitive HOI4 tournaments with automated brackets
✅ Manage player registrations and nation selections
✅ Track matches from start to finish
✅ Create casual games for quick matches
✅ Share news and announcements
✅ Integrate Steam Workshop mods
✅ Manage users with role-based permissions
✅ Deploy in production with Docker
✅ Monitor platform activity
✅ Customize rules and modpacks

### What's Built-In
✅ Complete HOI4 nation database (180+ nations)
✅ Historical WW2 flag assets
✅ Responsive dark-themed UI
✅ Real-time updates (30s polling)
✅ Secure authentication system
✅ Input validation & XSS protection
✅ Production-ready deployment
✅ Comprehensive API (40+ endpoints)

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Tech Stack**: Next.js 15, ClickHouse, NextAuth, Docker, TypeScript
