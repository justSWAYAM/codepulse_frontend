import type { QuestionType } from './types';

const DSA_TEMPLATE = `Write 8 test cases for this problem as a CSV in a code block, header exactly:
input,expected_output,is_sample,weight
Rules: quote any cell with commas or line breaks; input is the exact stdin; expected_output is the exact stdout;
first 2 rows is_sample=true, the rest false; weight=1; include edge cases (empty, minimum, maximum).
Problem: {title}
{description}`;

const SQL_TEMPLATE = `Write 6 test cases for this SQL question as a CSV in a code block, header exactly:
input,expected_output,is_sample,weight
Rules: input = extra INSERT statements for this case (blank for the base data); expected_output = JSON
{"columns":[...],"rows":[[...]]} for the correct query on schema + input; double the quotes inside CSV cells;
first 2 rows is_sample=true; weight=1; vary the data so hardcoded answers fail.
Question: {title}
{description}
Schema: {schema_sql}`;

export interface PromptSource {
  title: string;
  description: string;
  questionType: QuestionType;
  schemaSql?: string | null;
}

export function supportsTestCasePrompt(type: QuestionType): boolean {
  return type === 'DSA' || type === 'SQL';
}

/** Replaces ONLY {title}, {description}, {schema_sql}. The JSON braces in the SQL template are untouched. */
export function buildTestCasePrompt(q: PromptSource): string {
  const values: Record<string, string> = {
    title: q.title,
    description: q.description,
    schema_sql: q.schemaSql ?? '',
  };
  const template = q.questionType === 'SQL' ? SQL_TEMPLATE : DSA_TEMPLATE;
  return template.replace(/\{(title|description|schema_sql)\}/g, (_m, key: string) => values[key] ?? '');
}
