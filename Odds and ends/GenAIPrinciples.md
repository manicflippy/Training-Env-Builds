# Generative AI Principles for Code Modification

## Session Prompt Template

```
For this working session, I'd like you to follow the principles outlined in my GenAIPrinciples.md file. Specifically:

1. Make incremental changes rather than wholesale replacements
2. Preserve all diagnostic logging and error handling
3. Test components individually before suggesting integrated changes
4. Always prioritize maintaining working functionality
5. Provide clear explanations for all suggested modifications
6. Follow the existing patterns and conventions in my codebase
7. If any changes break functionality, immediately roll back to the last known good state

Please acknowledge these principles and apply them throughout our session today.
```

## Core Principles

1. **Incremental Over Wholesale Changes**
   - Make small, targeted modifications rather than complete rewrites
   - Preserve existing architecture and design patterns when possible
   - Implement changes in logical, testable increments

2. **Preserve Diagnostic Capabilities**
   - Maintain or enhance logging statements
   - Ensure error messages remain informative and actionable
   - Don't remove debugging hooks or diagnostic output

3. **Error Handling Balance**
   - Implement comprehensive but not overly complex error handling
   - Ensure exceptions are properly caught and logged
   - Provide meaningful error messages that aid troubleshooting

4. **Component-Based Testing**
   - Test individual components before integrating changes
   - Verify each modified function works as expected in isolation
   - Ensure changes don't break existing functionality

5. **Functionality Preservation**
   - Prioritize maintaining working functionality over code elegance
   - Document any behavioral changes, even if they seem minor
   - Ensure backward compatibility whenever possible

6. **Transparent Modifications**
   - Provide clear explanations for all suggested changes
   - Document the rationale behind design decisions
   - Highlight potential risks or trade-offs

7. **Respect Existing Patterns**
   - Follow established coding conventions in the codebase
   - Maintain consistent naming and formatting
   - Align new code with existing architectural patterns

8. **Rollback Before Rabbit Holes**
   - When changes break functionality, immediately roll back to the last known good state
   - Avoid compounding problems with multiple "fixes" that lead further from a working state
   - Use version control to preserve working versions before attempting significant changes
   - Restart from a clean, working baseline rather than trying to salvage broken code
   - Document what didn't work before attempting a different approach

## Prompt Guidelines for AI Assistants

When requesting help from AI assistants, structure your prompts to encourage these principles:

1. **Provide Context**
   - Share the purpose of the code and its current functionality
   - Explain what's working and what needs improvement
   - Include relevant error messages or unexpected behaviors

2. **Set Clear Boundaries**
   - Specify which parts of the code can be modified
   - Indicate if certain functionality must be preserved
   - Mention any performance or compatibility requirements

3. **Request Explanations**
   - Ask the AI to explain its reasoning for suggested changes
   - Request comments on potential risks or trade-offs
   - Have the AI highlight areas that might need further testing

4. **Incremental Assistance**
   - Break complex changes into smaller, manageable steps
   - Review and test each increment before proceeding
   - Ask for progressive improvements rather than complete solutions

5. **Example Prompt Template**
   ```
   I need help with [specific functionality].
   
   Current behavior: [describe what happens now]
   Desired behavior: [describe what should happen]
   
   Key requirements:
   - [requirement 1]
   - [requirement 2]
   
   Please suggest incremental changes that preserve existing logging and error handling.
   Explain your reasoning for each modification.
   ```

6. **Failure Recovery Instructions**
   ```
   If your suggested changes break functionality:
   1. Immediately roll back to the previous working version
   2. Analyze what went wrong with the attempted change
   3. Propose a different, more conservative approach
   4. Start from the original working code, not the broken version
   ```

By following these principles and prompt guidelines, we can leverage AI assistance while maintaining code quality, reliability, and maintainability.