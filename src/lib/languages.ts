import type { LanguageName } from '../api/submissionApi';

export interface LanguageMeta {
  name: LanguageName;
  label: string;
  /** Monaco language id */
  monaco: string;
  template: string;
}

export const LANGUAGES: Record<LanguageName, LanguageMeta> = {
  PYTHON: {
    name: 'PYTHON',
    label: 'Python 3',
    monaco: 'python',
    template: `import sys


def main():
    data = sys.stdin.read().split()
    # Write your solution here


if __name__ == "__main__":
    main()
`,
  },
  JAVA: {
    name: 'JAVA',
    label: 'Java',
    monaco: 'java',
    // Judge0 compiles Main.java — the public class must be Main
    template: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // Write your solution here
    }
}
`,
  },
  CPP: {
    name: 'CPP',
    label: 'C++',
    monaco: 'cpp',
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // Write your solution here
    return 0;
}
`,
  },
  C: {
    name: 'C',
    label: 'C',
    monaco: 'c',
    template: `#include <stdio.h>

int main(void) {
    // Write your solution here
    return 0;
}
`,
  },
  JAVASCRIPT: {
    name: 'JAVASCRIPT',
    label: 'JavaScript',
    monaco: 'javascript',
    template: `const input = require("fs").readFileSync(0, "utf8").trim().split(/\\s+/);

function main() {
  // Write your solution here
}

main();
`,
  },
};

/** Accepts enum names or display names ("PYTHON", "Python", "C++"). */
export function toLanguage(value: string): LanguageMeta | null {
  const v = value.trim().toUpperCase();
  if (v in LANGUAGES) return LANGUAGES[v as LanguageName];
  if (v === 'C++') return LANGUAGES.CPP;
  if (v === 'PYTHON3' || v === 'PYTHON 3') return LANGUAGES.PYTHON;
  if (v === 'JS') return LANGUAGES.JAVASCRIPT;
  return null;
}

export function languageLabel(value: string): string {
  return toLanguage(value)?.label ?? value;
}
