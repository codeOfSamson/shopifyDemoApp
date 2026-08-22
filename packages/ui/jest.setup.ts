// tsconfig.json narrows `types` to just ["@testing-library/jest-dom"]
// (deliberately excluding @types/jest even though it's a devDependency).
// This still works only because jest-dom's own .d.ts carries
// `/// <reference types="jest" />`, which backfills the ambient
// describe/expect/it globals used across this package's *.test.tsx files.
// That reference is transitive and easy to lose track of — if jest-dom
// ever drops it, or this import is removed, typecheck breaks across every
// test file with no obvious link back to this line.
import "@testing-library/jest-dom";
