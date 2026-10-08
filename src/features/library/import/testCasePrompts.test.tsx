import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { buildTestCasePrompt, supportsTestCasePrompt } from './testCasePrompts';
import { TestCasePromptButton } from './TestCasePromptButton';

describe('testCasePrompts', () => {
  it('DSA question contains title and description, no {title} left, and no Schema: line', () => {
    const prompt = buildTestCasePrompt({
      title: 'Two Sum',
      description: 'Given an array of integers...',
      questionType: 'DSA',
    });

    expect(prompt).toContain('Problem: Two Sum');
    expect(prompt).toContain('Given an array of integers...');
    expect(prompt).not.toContain('{title}');
    expect(prompt).not.toContain('{description}');
    expect(prompt).not.toContain('Schema:');
  });

  it('SQL question contains Schema: + schemaSql and retains literal JSON template braces', () => {
    const prompt = buildTestCasePrompt({
      title: 'Find Top Customers',
      description: 'Write a query to list customers with over 5 orders.',
      questionType: 'SQL',
      schemaSql: 'CREATE TABLE orders (id INT, customer_id INT);',
    });

    expect(prompt).toContain('Question: Find Top Customers');
    expect(prompt).toContain('Schema: CREATE TABLE orders (id INT, customer_id INT);');
    expect(prompt).toContain('{"columns":[...],"rows":[[...]]}');
  });

  it('retains $& and $1 in description verbatim without regex replacement corruption', () => {
    const trickyDescription = 'Input contains regex patterns like $&, $1, $2 and costs $10.';
    const prompt = buildTestCasePrompt({
      title: 'Regex Parsing',
      description: trickyDescription,
      questionType: 'DSA',
    });

    expect(prompt).toContain(trickyDescription);
  });

  it('handles null or missing schemaSql on SQL gracefully without undefined or null string', () => {
    const prompt = buildTestCasePrompt({
      title: 'Simple SQL',
      description: 'Select all',
      questionType: 'SQL',
      schemaSql: null,
    });

    expect(prompt).toContain('Schema: ');
    expect(prompt).not.toContain('undefined');
    expect(prompt).not.toContain('null');
  });

  it('supportsTestCasePrompt is false for MCQ and THEORY, and TestCasePromptButton renders nothing', () => {
    expect(supportsTestCasePrompt('MCQ')).toBe(false);
    expect(supportsTestCasePrompt('THEORY')).toBe(false);
    expect(supportsTestCasePrompt('DSA')).toBe(true);
    expect(supportsTestCasePrompt('SQL')).toBe(true);

    const { container: mcqContainer } = render(
      <TestCasePromptButton
        question={{
          title: 'MCQ question',
          description: 'What is 2+2?',
          questionType: 'MCQ',
        }}
      />
    );
    expect(mcqContainer.firstChild).toBeNull();

    const { container: theoryContainer } = render(
      <TestCasePromptButton
        question={{
          title: 'Theory question',
          description: 'Explain CAP theorem.',
          questionType: 'THEORY',
        }}
      />
    );
    expect(theoryContainer.firstChild).toBeNull();
  });
});
