import { intersection } from 'lodash';
import {
  Attribute,
  Command,
  Param,
  Platform,
  PrimitiveType,
  SELF,
  SourceType,
  Version,
} from '../models';
import { commandParams, inputParams, isOpcode, outputParams } from './command';
import { isValidIdentifier } from './enum-validation';
import { HEX_NEGATION } from './hex';

export const ATTRIBUTE_RULES: Partial<
  Record<Attribute, { allowed?: Attribute[]; disallowed?: Attribute[] }>
> = {
  is_unsupported: { allowed: [] },
  is_constructor: { disallowed: ['is_destructor'] },
  is_destructor: { disallowed: ['is_static'] },
  is_nop: { allowed: ['is_condition', 'is_static'] },
  is_keyword: { disallowed: ['is_constructor', 'is_destructor', 'is_static'] },
};

export function doesCommandHaveAnyAttributeInvalid(command: Command): boolean {
  const entries = Object.entries(command.attrs ?? {}) as [Attribute, boolean][];

  return !entries.reduce((m, [k, v]) => {
    // no rule for attribute or attribute is not enabled => skip
    if (!v || !ATTRIBUTE_RULES[k]) {
      return m;
    }

    // all other enabled attributes
    const other = entries.filter(([_k, _v]) => _k !== k && _v);
    const allowed = ATTRIBUTE_RULES[k]?.allowed;
    const disallowed = ATTRIBUTE_RULES[k]?.disallowed;

    // check if all enabled attributes allowed to pair with current attributes
    const isAllowedValid =
      !allowed || other.every(([_k]) => allowed.includes(_k));
    const isDisallowedValid =
      !disallowed || !other.some(([_k]) => disallowed.includes(_k));
    return m && isAllowedValid && isDisallowedValid;
  }, true);
}

export function doesCommandHaveDuplicateName(
  command: Command,
  otherCommands: Command[] | undefined
) {
  const thisCommandPlatforms = command.platforms ?? [Platform.Any];
  const thisCommandVersions = command.versions ?? [Version.Any];

  return (otherCommands ?? []).some(
    ({ name, id, platforms, versions }) =>
      name === command.name &&
      id &&
      id !== command.id &&
      intersection(thisCommandPlatforms, platforms ?? [Platform.Any]).length >
        0 &&
      intersection(thisCommandVersions, versions ?? [Version.Any]).length > 0 &&
      !command.attrs?.is_overload
  );
}

export function isCommandParamNameDuplicate(command: Command, name: string) {
  const f = (p: Param) => p.name === name;
  const hasDups = (items: Param[]) => items.filter(f).length > 1;
  const hasAnyDups =
    hasDups(inputParams(command)) || hasDups(outputParams(command));
  if (name) {
    return hasAnyDups;
  }
  // multiple empty param names are not allowed in class context
  return !!(command.class && command.member && hasAnyDups);
}

export function doesCommandHaveDuplicateParamName(command: Command) {
  return commandParams(command).some((param) =>
    isCommandParamNameDuplicate(command, param.name)
  );
}

export function doesConstructorCommandHaveNoOutputParams(command: Command) {
  return !!command.attrs?.is_constructor && !command.output?.length;
}

export function doesCommandHaveEmptyName(command: Command) {
  return !command.name;
}

export function doesCommandHaveEmptyId(command: Command) {
  return !command.id;
}

export function doesCommandHaveSelfInStaticMethod(command: Command) {
  return (
    !!command.attrs?.is_static &&
    commandParams(command).some((p) => p.name === SELF)
  );
}

export function doesCommandHaveInvalidOpcode(command: Command) {
  return !doesCommandHaveEmptyId(command) && !isOpcode(command.id);
}

export function doesCommandHaveOutOfRangeOpcode(command: Command) {
  const hasOpcode = !doesCommandHaveEmptyId(command) && isOpcode(command.id);
  return hasOpcode && !!HEX_NEGATION[command.id[0]];
}

export function doesCommandHaveMissingSelfParamInMethod(command: Command) {
  const { is_static, is_keyword, is_nop, is_unsupported, is_constructor } =
    command.attrs ?? {};
  const { class: className, member, num_params } = command;
  return (
    !is_static &&
    !is_keyword &&
    !is_nop &&
    !is_unsupported &&
    !is_constructor &&
    !!className &&
    !!member &&
    (!num_params || !commandParams(command).some((p) => p.name === SELF))
  );
}

export function doesCommandDescriptionHaveTrailingPeriod(command: Command) {
  return !!command.short_desc?.endsWith('.');
}

export function doesCommandDescriptionNotStartWith3rdPersonVerb(
  command: Command
) {
  return (
    !!command.short_desc && !command.short_desc?.split(' ')[0]?.endsWith('s')
  );
}

export function doesConstructorNotReturnHandle(command: Command) {
  const hasSingleParamHandle =
    command.output?.length === 1 && command.output[0].name === 'handle';

  return !!command.attrs?.is_constructor && !hasSingleParamHandle;
}

export function doesCommandHaveAnInvalidClassName(command: Command) {
  return !!command.class && !isValidIdentifier(command.class);
}

export function doesCommandHaveAnInvalidMethodName(command: Command) {
  return !!command.member && !isValidIdentifier(command.member);
}

export function doesCommandHaveInvalidConditionalOperator(command: Command) {
  if (!command.operator) {
    return false;
  }
  const is_condition = command.attrs?.is_condition;
  const validConditionalOperators = ['==', '>', '>='];

  if (is_condition) {
    return !validConditionalOperators.includes(command.operator);
  }
  return validConditionalOperators.includes(command.operator);
}

function isVar(source: SourceType | undefined) {
  return (
    source === SourceType.var_any ||
    source === SourceType.var_global ||
    source === SourceType.var_local
  );
}

export function doesCommandHaveInvalidArgumentWithOperator(command: Command) {
  if (!command.operator) {
    return false;
  }

  const input = inputParams(command);
  const output = outputParams(command);

  // should have at least one input param
  if (input.length < 1) {
    return true;
  }

  // should not have more than one output param
  if (output.length > 1) {
    return true;
  }

  // comparison operators should have two input params, with a number on either side
  if (['==', '>', '>='].includes(command.operator)) {
    if (output.length > 0 || input.length < 2) {
      return true;
    }
    return !isVar(input[0]?.source) && !isVar(input[1]?.source);
  }

  // the first output or input argument should be a variable of any type
  let source = output[0]?.source ?? input[0]?.source;
  if (!isVar(source)) {
    return true;
  }

  return false;
}
