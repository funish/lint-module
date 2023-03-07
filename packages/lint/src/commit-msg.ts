import { loadLintConfig } from "./config";
import consola from "consola";
import { readFileSync } from "fs";

export interface commitMsgLintConfigRules {
  enum?: string[];
  rules?: string[];
}

export interface commitMsgLintConfig {
  type?: RegExp | commitMsgLintConfigRules;
  scope?: RegExp | commitMsgLintConfigRules;
  description?: RegExp | commitMsgLintConfigRules;
}

export const commitMsgLintConfigRulesRegexp = {
  lowercase: /^[a-z]+$/,
  uppercase: /^[A-Z]+$/,
  camelcase: /^[a-z]+([A-Z][a-z]+)*$/,
  kebabcase: /^[a-z]+(-[a-z]+)*$/,
  snakecase: /^[a-z]+(_[a-z]+)*$/,
  pascalcase: /^[A-Z][a-z]+([A-Z][a-z]+)*$/,
  sentencecase: /^[A-Z][a-z]+$/,
  phrasecase: /^[a-z]+.+[^.]$/,
  semver:
    /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
};

export const commitMsgRaw = readFileSync(".git/COMMIT_EDITMSG", "utf8");

// Commit message format: type(scope)!: description
export const commitMsgRegexp = new RegExp(
  "(?<type>.+)(((?<scope>.+)))?(?<breaking>!)?: (?<description>.+)"
);

export const commitMsg = commitMsgRaw.match(commitMsgRegexp)
  ?.groups as unknown as Array<string>;

export async function commitMsgLint(config?: commitMsgLintConfig) {
  const loadCommitMsgLint = config || (await loadLintConfig()).commitMsg;

  if (commitMsgRegexp.test(commitMsgRaw)) {
    for (const key in loadCommitMsgLint) {
      if (Object.prototype.hasOwnProperty.call(loadCommitMsgLint, key)) {
        const element = loadCommitMsgLint[key];
        if (element instanceof RegExp) {
          if (!element.test(commitMsg[key])) {
            consola.error(
              `Commit message ${key} does not match the regular expression ${element}.`
            );
            process.exit(1);
          }
        } else if (typeof element === "object") {
          if (element.enum) {
            if (!element.enum.includes(commitMsg[key])) {
              consola.error(
                `Commit message ${key} does not match the enum ${element.enum}.`
              );
              process.exit(1);
            }
          } else if (element.rules) {
            for (const rule of element.rules) {
              if (!commitMsgLintConfigRulesRegexp[rule].test(commitMsg[key])) {
                consola.error(
                  `Commit message ${key} does not match the rule ${rule}.`
                );
                process.exit(1);
              }
            }
          } else {
            consola.error(
              "Commit message does not match the conventional commit format."
            );
            process.exit(1);
          }
        }
      }
    }
  } else {
    consola.error(
      "Commit message does not match the conventional commit format."
    );
    process.exit(1);
  }
}
