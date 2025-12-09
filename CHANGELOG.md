# Changelog

All notable changes to the HOI4 Tournament Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-09

### Initial Release

This is the first public release of the HOI4 Tournament Platform.

#### Added

**Core Features**
- Tournament management system with single-elimination brackets (8, 16, 32, 64 players)
- User authentication via Discord OAuth
- Role-based access control (Admin, Matchmaker, Player, Public)
- Match tracking and management system
- Player signup and nation selection system
- Casual games creation and management
- News and announcements system with rich text editor

**User Interface**
- Modern dark-themed responsive design
- Tournament bracket visualization
- Real-time data updates via polling (30s intervals)
- User profile management
- Admin dashboard
- Match status indicators

**Database**
- ClickHouse database integration
- Complete database schema with 8 core tables
- Database initialization script
- Optimized query performance with synchronous mutations

**Content**
- 180+ HOI4 nations database
- Historical WW2 flag assets
- Nation tag system (3-letter codes)
- Ideology-based flag variants

**Security**
- Input validation (UUID, nation tags, Discord IDs)
- XSS prevention with DOMPurify
- SSRF prevention for Steam Workshop URLs
- Role-based authorization
- Session management with NextAuth
- Rate limiting support (via Nginx)

**Deployment**
- Docker support with multi-stage builds
- Docker Compose configuration
- Nginx reverse proxy configuration
- SSL/TLS support
- Production-ready environment configuration
- Health checks for containerized deployment

**API**
- 40+ RESTful API endpoints
- Input validation on all endpoints
- Error handling and appropriate HTTP status codes
- Authentication middleware
- CORS configuration

**Development Tools**
- TypeScript support throughout
- ESLint configuration
- Tailwind CSS for styling
- Comprehensive documentation

#### Technical Stack
- Next.js 16.0 (App Router)
- React 19.2
- TypeScript 5
- ClickHouse database
- NextAuth 5 for authentication
- Docker & Docker Compose
- Nginx for reverse proxy
- Radix UI components
- TipTap rich text editor
- Tailwind CSS 4

#### Documentation
- Comprehensive README with installation instructions
- Contributing guidelines
- Feature documentation
- Security and performance audit
- Development roadmap
- MIT License

---

## [Unreleased]

### Planned Features
See [docs/ROADMAP.md](docs/ROADMAP.md) for planned features and improvements.

---

## Version History

### Version Format
- **Major version** (X.0.0): Breaking changes, major new features
- **Minor version** (1.X.0): New features, backwards compatible
- **Patch version** (1.0.X): Bug fixes, minor improvements

### Release Tags
- `[Added]` - New features
- `[Changed]` - Changes to existing functionality
- `[Deprecated]` - Features that will be removed in future versions
- `[Removed]` - Removed features
- `[Fixed]` - Bug fixes
- `[Security]` - Security improvements

---

## Links
- [Repository](https://github.com/yourusername/hoi4-tournament-platform)
- [Issues](https://github.com/yourusername/hoi4-tournament-platform/issues)
- [Documentation](https://github.com/yourusername/hoi4-tournament-platform/blob/main/README.md)
