# Contributing to HOI4 Tournament Platform

Thank you for your interest in contributing to the HOI4 Tournament Platform! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

### Our Standards

- Be respectful and constructive in discussions
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before you start contributing, make sure you have:

1. Forked the repository
2. Cloned your fork locally
3. Set up the development environment (see [README.md](README.md))
4. Created a ClickHouse database instance
5. Configured your `.env.local` file

### Setting Up Your Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/hoi4-tournament-platform.git
cd hoi4-tournament-platform

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/hoi4-tournament-platform.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize database
npm run db:init

# Start development server
npm run dev
```

## Development Workflow

### 1. Create a Branch

Create a branch for your work:

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linting
npm run lint

# Build the project
npm run build

# Test the production build
npm run start
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add tournament bracket export feature"
```

Commit message conventions:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Pull Request Process

### Before Submitting

1. Ensure your code follows the project's coding standards
2. Update documentation if needed
3. Add tests for new features
4. Make sure all tests pass
5. Update the CHANGELOG.md with your changes

### Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to the original repository on GitHub
3. Click "New Pull Request"
4. Select your branch
5. Fill out the pull request template:
   - Clear title describing the change
   - Detailed description of what changed and why
   - Link to any related issues
   - Screenshots (if UI changes)
   - Testing instructions

### Pull Request Review

- Maintainers will review your PR
- Address any requested changes
- Once approved, a maintainer will merge your PR

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define types for function parameters and return values
- Avoid `any` types when possible
- Use interfaces for object shapes

```typescript
// Good
interface Tournament {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

// Avoid
const tournament: any = { ... };
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use meaningful component and prop names

```typescript
// Good
export function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <div className="tournament-card">
      {/* ... */}
    </div>
  );
}
```

### File Organization

- Place components in `components/`
- Place UI components in `components/ui/`
- Place utilities in `lib/`
- Place type definitions in `types/`
- Place API routes in `app/api/`

### Styling

- Use Tailwind CSS for styling
- Follow the existing design system
- Use the defined color palette (zinc/gray with amber accents)
- Ensure responsive design

### API Routes

- Validate all input
- Handle errors gracefully
- Return appropriate HTTP status codes
- Use consistent response formats

```typescript
// Good
return NextResponse.json(
  { error: 'Tournament not found' },
  { status: 404 }
);
```

## Testing

### Manual Testing

Before submitting a PR, manually test:

1. Your new feature/fix works as expected
2. Existing features still work
3. No console errors
4. Responsive design works
5. Different user roles behave correctly

### Future: Automated Testing

We plan to add automated tests. Contributions to testing infrastructure are welcome!

## Reporting Bugs

### Before Reporting

1. Check if the bug has already been reported
2. Verify it's reproducible
3. Test on the latest version

### Bug Report Template

```markdown
**Description**
A clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 20.10.0]
- Database: [e.g., ClickHouse 23.8]
```

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature has already been requested
2. Clearly describe the feature and its benefits
3. Explain your use case
4. Be open to discussion and iteration

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature

**Problem It Solves**
What problem does this address?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Any other relevant information
```

## Areas for Contribution

We especially welcome contributions in these areas:

### High Priority
- Unit and integration tests
- Documentation improvements
- Bug fixes
- Performance optimizations
- Security improvements

### Features from Roadmap
- Real-time match updates (WebSocket implementation)
- Mobile-responsive improvements
- Advanced bracket types (double elimination, Swiss)
- Player statistics and rankings
- Email notifications

### Nice to Have
- Internationalization (i18n)
- Dark/light theme toggle
- Advanced search and filtering
- Data export features
- API documentation

## Questions?

If you have questions about contributing:

1. Check the [README.md](README.md) and existing documentation
2. Look for similar issues or discussions
3. Open a new discussion on GitHub
4. Join our Discord community (link TBD)

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- GitHub contributors page

Thank you for contributing to the HOI4 Tournament Platform!
