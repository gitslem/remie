# Contributing to REMIE

Thank you for your interest in contributing to REMIE! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Maintain professional communication

## Getting Started

### 1. Fork the Repository

```bash
git clone https://github.com/yourusername/remie.git
cd remie
```

### 2. Set Up Development Environment

```bash
# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start backend
npm run dev

# In a new terminal, install frontend dependencies
cd ../frontend
npm install

# Start frontend
npm run dev
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## Development Workflow

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

### Commit Messages

Follow conventional commits:

```
feat: add cryptocurrency withdrawal feature
fix: resolve wallet balance calculation bug
docs: update API documentation
refactor: improve authentication middleware
test: add unit tests for loan service
```

### Code Style

#### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint rules
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

#### Example:

```typescript
/**
 * Calculate loan repayment amount including interest
 * @param principal - Loan principal amount
 * @param rate - Annual interest rate (percentage)
 * @param tenure - Loan tenure in days
 * @returns Total repayable amount
 */
function calculateRepayableAmount(
  principal: number,
  rate: number,
  tenure: number
): number {
  const interestAmount = (principal * rate * tenure) / (365 * 100);
  return principal + interestAmount;
}
```

### Testing

Write tests for new features:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### API Development

When adding new endpoints:

1. Define route in `routes/`
2. Create controller in `controllers/`
3. Implement service logic in `services/`
4. Add validation middleware
5. Update API documentation
6. Write tests

## Pull Request Process

### 1. Before Submitting

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log or debugging code
- [ ] Environment variables documented

### 2. Create Pull Request

- Use a clear, descriptive title
- Reference related issues
- Describe changes in detail
- Include screenshots for UI changes
- List breaking changes (if any)

### 3. Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

## Areas for Contribution

### High Priority

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Payment gateway integrations
- [ ] Additional cryptocurrency support
- [ ] Biometric authentication

### Medium Priority

- [ ] Bill payments
- [ ] Savings features
- [ ] Investment options
- [ ] Merchant integration
- [ ] API rate limiting improvements

### Documentation

- [ ] API examples
- [ ] User guides
- [ ] Video tutorials
- [ ] Code comments
- [ ] Architecture diagrams

### Testing

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load testing
- [ ] Security testing

## Project Structure

```
remie/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models (Prisma)
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utilities
│   │   └── index.ts        # Entry point
│   └── prisma/
│       └── schema.prisma   # Database schema
└── frontend/
    └── src/
        ├── app/            # Next.js pages
        ├── components/     # React components
        └── lib/            # Utilities
```

## Security Guidelines

### Reporting Security Issues

Do NOT create public issues for security vulnerabilities.

Email security concerns to: security@remie.app

### Security Best Practices

- Never commit secrets or API keys
- Use environment variables
- Validate all user input
- Sanitize database queries
- Implement rate limiting
- Use HTTPS in production
- Keep dependencies updated

## Database Migrations

### Creating Migrations

```bash
npx prisma migrate dev --name your_migration_name
```

### Migration Guidelines

- Use descriptive names
- Test migrations locally
- Include rollback instructions
- Document breaking changes

## API Documentation

Update API docs when adding/modifying endpoints:

1. Update `docs/API.md`
2. Add JSDoc comments
3. Include request/response examples
4. Document error cases

## Review Process

### Code Review Checklist

Reviewers will check:

- [ ] Code quality and style
- [ ] Test coverage
- [ ] Documentation
- [ ] Security considerations
- [ ] Performance impact
- [ ] Breaking changes

### Approval Process

- At least 1 approval required
- All CI checks must pass
- Conflicts resolved
- Documentation updated

## Getting Help

### Communication Channels

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: General questions
- Email: dev@remie.app
- Slack: [Join our Slack](#)

### Resources

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Features Overview](docs/FEATURES.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## License

By contributing to REMIE, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be:

- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Featured on the website (optional)

Thank you for contributing to REMIE! 🚀
