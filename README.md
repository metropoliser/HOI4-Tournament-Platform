# HOI4 Tournament Platform

A comprehensive tournament management platform for Hearts of Iron 4 multiplayer competitions. Features automated bracket management, player registration, match tracking, and casual game organization.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![ClickHouse](https://img.shields.io/badge/ClickHouse-Latest-yellow)

## Features

- **Tournament Management**: Create and manage single-elimination brackets (8-64 players)
- **Discord Authentication**: Seamless OAuth integration with Discord
- **Match Tracking**: Complete match lifecycle management with nation selection
- **Casual Games**: Host custom games with Steam Workshop mod integration
- **News System**: Rich text news and announcements with category management
- **Role-Based Access**: Admin, Matchmaker, and Player roles with granular permissions
- **Nation Database**: 180+ HOI4 nations with historical WW2 flags
- **Modern UI**: Dark-themed, responsive interface optimized for gaming

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth for authentication
- **Database**: ClickHouse 
- **UI Components**: Radix UI, Lucide Icons, TipTap Editor
- **Deployment**: Docker, Nginx (reverse proxy with SSL)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm** or **yarn** or **pnpm**
- **ClickHouse** database server
- **Discord Application** for OAuth (see [Discord Developer Portal](https://discord.com/developers/applications))

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/hoi4-tournament-platform.git
cd hoi4-tournament-platform
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up ClickHouse Database

Install ClickHouse following the [official documentation](https://clickhouse.com/docs/en/install).

For quick local setup:

```bash
# Using Docker
docker run -d --name clickhouse-server \
  -p 8123:8123 \
  -p 9000:9000 \
  clickhouse/clickhouse-server
```

### 4. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# ClickHouse Configuration
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_DATABASE=hoi4_tournament
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=

# NextAuth Configuration
NEXTAUTH_SECRET=your-random-secret-here-generate-with-openssl
NEXTAUTH_URL=http://localhost:3000

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Socket.io (optional)
SOCKET_PORT=3001
```

**Generate a secure NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

**Create a Discord Application:**

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a New Application
3. Go to OAuth2 section
4. Add redirect URL: `http://localhost:3000/api/auth/callback/discord`
5. Copy Client ID and Client Secret to your `.env.local`

### 5. Initialize the Database

Run the database initialization script to create all necessary tables:

```bash
npm run db:init
```

This will create the following tables:
- users
- tournaments
- tournament_signups
- matches
- casual_games
- casual_game_signups
- casual_game_rules
- news

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment

For production deployment using Docker:

### 1. Build the Docker Image

```bash
docker build -t hoi4-tournament-platform .
```

### 2. Using Docker Compose

The project includes a `docker-compose.yml` for easy deployment:

```bash
# Start all services (app, ClickHouse, Nginx)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Environment Configuration

For Docker deployment, copy and configure the Docker environment file:

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` with your production settings.

### 4. SSL Configuration

SSL certificates should be placed in the `ssl/` directory:
- `ssl/cert.pem` - SSL certificate
- `ssl/key.pem` - Private key

For development, you can generate self-signed certificates:

```bash
mkdir -p ssl
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
```

## Project Structure

```
hoi4-tournament-platform/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── tournaments/       # Tournament pages
│   ├── casual/            # Casual games pages
│   ├── news/              # News pages
│   └── ...
├── components/            # React components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
├── public/                # Static assets (flags, icons)
├── scripts/               # Database initialization scripts
├── clickhouse-config/     # ClickHouse configuration
└── docker-compose.yml     # Docker orchestration
```

## Usage

### First-Time Setup

1. **Create Admin User**: After first login with Discord, manually set your role to 'admin' in the ClickHouse users table:

```sql
ALTER TABLE hoi4_tournament.users
UPDATE role = 'admin'
WHERE discord_id = 'your-discord-id'
SETTINGS mutations_sync = 2;
```

2. **Create Your First Tournament**: Navigate to Admin > Create Tournament

3. **Add News**: Go to Admin > News > Create News Post

### User Roles

- **Admin**: Full platform control, user management, tournament creation
- **Matchmaker**: Tournament and match management, player assignments
- **Player**: Tournament participation, casual game creation
- **Public**: View-only access to tournaments and news

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:init` - Initialize database tables

### Code Style

This project uses:
- TypeScript for type safety
- ESLint for code linting
- Tailwind CSS for styling

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Documentation

- [FEATURES.md](FEATURES.md) - Comprehensive feature documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [docs/ROADMAP.md](docs/ROADMAP.md) - Future development plans
- [docs/SECURITY_AND_PERFORMANCE_AUDIT.md](docs/SECURITY_AND_PERFORMANCE_AUDIT.md) - Security audit details
- [docs/REMAINING_OPTIMIZATIONS_GUIDE.md](docs/REMAINING_OPTIMIZATIONS_GUIDE.md) - Performance optimization tasks

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or contributions, please:
- Open an issue on GitHub
- Join our Discord community (link TBD)

## Acknowledgments

- Hearts of Iron 4 by Paradox Interactive
- Next.js team for the excellent framework
- All contributors to this project

---

**Version**: 1.0.0
**Last Updated**: December 2025
