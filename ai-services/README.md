# AI Services Extension Point (Reserved Architecture)

This directory is an architectural placeholder for future West Bengal Labour Department AI enhancements.

## Planned Scope (Future Phase)
1. **Intelligent Citizen Query Resolver**: Multilingual AI assistant trained on state labor laws, registration processes, and factory compliance acts.
2. **Document Pre-Validation Agent**: Automated verification of uploaded factory blueprints, boiler safety certificates, and trade licenses.
3. **Smart Form Pre-Filler**: Cross-portal autofill service using unified applicant profile data.

## Current Phase Status
- **Disabled**: No AI services, background workers, or external LLM connections are active in this phase.
- Frontend extension point: `<AiAssistantDock />` is mounted conditionally behind the `VITE_ENABLE_AI_ASSISTANT` feature flag (defaults to `false`).
- All department entitlement logic and SSO tokens operate strictly through deterministic, audited NestJS core modules.
