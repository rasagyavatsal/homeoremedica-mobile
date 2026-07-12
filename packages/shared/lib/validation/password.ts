export interface PasswordRule {
  passed: boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  rules: {
    length: PasswordRule;
    uppercase: PasswordRule;
    lowercase: PasswordRule;
    number: PasswordRule;
    symbol: PasswordRule;
    common: PasswordRule;
    match?: PasswordRule;
    notCurrent?: PasswordRule;
    personalInfo?: PasswordRule;
  };
  score: number;
  unmetRules: string[];
}

export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_RULES = {
  LENGTH: 'At least 12 characters',
  UPPERCASE: 'One uppercase letter (A-Z)',
  LOWERCASE: 'One lowercase letter (a-z)',
  NUMBER: 'One number (0-9)',
  SYMBOL: 'One symbol (!@#$%^&*)',
  COMMON: 'Password is too common or known to be breached',
  MATCH: 'Passwords must match',
  NOT_CURRENT: 'New password must be different from current password',
  PERSONAL_INFO: 'Password should not contain your personal information',
};

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'password12345',
  'password1!',
  '123456',
  '12345678',
  'qwerty',
  'admin',
  'admin123',
]);

interface PasswordValidationOptions {
  password: string;
  confirmPassword?: string;
  currentPassword?: string;
  email?: string;
  displayName?: string;
}

type RequiredRuleKey = Exclude<keyof ValidationResult['rules'], 'match' | 'notCurrent' | 'personalInfo'>;

function createRule(passed: boolean, message: string): PasswordRule {
  return { passed, message };
}

function addFailedRule(unmetRules: string[], rule: string, passed: boolean): void {
  if (!passed) {
    unmetRules.push(rule);
  }
}

function getBaseRules(password: string): Pick<ValidationResult['rules'], RequiredRuleKey> {
  const lowerPassword = password.toLowerCase();

  return {
    length: createRule(password.length >= PASSWORD_MIN_LENGTH, PASSWORD_RULES.LENGTH),
    uppercase: createRule(/[A-Z]/.test(password), PASSWORD_RULES.UPPERCASE),
    lowercase: createRule(/[a-z]/.test(password), PASSWORD_RULES.LOWERCASE),
    number: createRule(/\d/.test(password), PASSWORD_RULES.NUMBER),
    symbol: createRule(/[^a-zA-Z0-9]/.test(password), PASSWORD_RULES.SYMBOL),
    common: createRule(!COMMON_PASSWORDS.has(lowerPassword), PASSWORD_RULES.COMMON),
  };
}

function getPersonalInfoRule(password: string, options: PasswordValidationOptions): PasswordRule {
  const lowerPassword = password.toLowerCase();
  const emailLocalPart = options.email?.split('@')[0].toLowerCase();
  const displayName = options.displayName?.replace(/\s+/g, '').toLowerCase();
  const personalValues = [emailLocalPart, displayName].filter((value): value is string => Boolean(value));
  const containsPersonalInfo = personalValues.some((value) => lowerPassword.includes(value));

  return createRule(!containsPersonalInfo, PASSWORD_RULES.PERSONAL_INFO);
}

export function validatePassword(options: PasswordValidationOptions): ValidationResult {
  const password = options.password || '';
  const baseRules = getBaseRules(password);
  const rules: ValidationResult['rules'] = { ...baseRules };
  const unmetRules: string[] = [];

  Object.entries(baseRules).forEach(([rule, result]) => {
    addFailedRule(unmetRules, rule, result.passed);
  });

  const score = [
    rules.length,
    rules.uppercase,
    rules.lowercase,
    rules.number,
    rules.symbol,
  ].filter((rule) => rule.passed).length;

  if (options.confirmPassword !== undefined) {
    rules.match = createRule(password === options.confirmPassword, PASSWORD_RULES.MATCH);
    addFailedRule(unmetRules, 'match', rules.match.passed);
  }

  if (options.currentPassword !== undefined) {
    rules.notCurrent = createRule(password !== options.currentPassword, PASSWORD_RULES.NOT_CURRENT);
    addFailedRule(unmetRules, 'notCurrent', rules.notCurrent.passed);
  }

  if (options.email !== undefined || options.displayName !== undefined) {
    rules.personalInfo = getPersonalInfoRule(password, options);
    addFailedRule(unmetRules, 'personalInfo', rules.personalInfo.passed);
  }

  return {
    isValid: unmetRules.length === 0,
    rules,
    score,
    unmetRules,
  };
}
