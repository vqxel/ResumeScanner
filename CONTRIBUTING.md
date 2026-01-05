# Contributing to Resume Analyzer

Thank you for your interest in contributing to Resume Analyzer! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit with clear messages
7. Push to your fork
8. Submit a pull request

## Development Setup

Follow the setup instructions in [README.md](README.md) or use the quick start:

```bash
./setup.sh
npm run dev
```

## Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **React**: Use functional components with hooks
- **Formatting**: Follow the existing code style
- **Comments**: Add comments for complex logic
- **Naming**: Use descriptive variable and function names

## Commit Messages

Use clear, descriptive commit messages:

- ✅ Good: "Add email validation to contact form"
- ❌ Bad: "Fix stuff"

Format:
```
<type>: <subject>

<body (optional)>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pull Request Process

1. **Update Documentation**: If you add features, update README.md
2. **Test**: Ensure the app builds and runs without errors
3. **Describe Changes**: Clearly explain what and why in the PR description
4. **Link Issues**: Reference any related issues
5. **Be Responsive**: Respond to review feedback promptly

## Feature Requests

Have an idea? Open an issue with:
- Clear description of the feature
- Use cases
- Potential implementation approach (optional)

## Bug Reports

Found a bug? Open an issue with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, Node version)

## Areas for Contribution

Some ideas:

- **UI/UX Improvements**: Better mobile experience, animations
- **Analysis Features**: Additional grading dimensions
- **Internationalization**: Support for multiple languages
- **Testing**: Unit tests, integration tests
- **Performance**: Optimize PDF processing, caching
- **Documentation**: Improve guides, add tutorials
- **Accessibility**: WCAG compliance improvements

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment
- Follow the project's coding standards

## Questions?

- Open an issue for questions
- Check existing issues and PRs first
- Be patient and respectful

Thank you for contributing! 🎉
