export interface Attr {
  is_branch: boolean;
  is_segment: boolean;
  is_keyword: boolean;
  is_condition: boolean;
  is_nop: boolean;
  is_unsupported: boolean;
  is_constructor: boolean;
  is_destructor: boolean;
  is_static: boolean;
  is_overload: boolean;
  is_variadic: boolean;
}

export enum ParamType {
  any = 'any',
  arguments = 'arguments',
  boolean = 'bool',
  float = 'float',
  int = 'int',
  label = 'label',
  string = 'string',
}

export const CommandAttributes = [
  'is_branch',
  'is_segment',
  'is_keyword',
  'is_condition',
  'is_nop',
  'is_unsupported',
  'is_constructor',
  'is_destructor',
  'is_static',
  'is_overload',
  'is_variadic',
];

export interface Param {
  type: ParamType;
  name: String;
}

export interface Command {
  id: string;
  name: string;
  attrs: Attr;
  num_params: number;
  input?: Param[];
  output?: Param[];
  class?: string;
  member?: string;
  short_desc: string;
}

export interface Extension {
  name: string;
  commands: Command[];
}

export interface ExtensionSnippets {
  [extensionName: string]: { [opcode: string]: string };
}

export interface ExtensionSnippetsViewModel {
  [extensionName: string]: {
    [opcode: string]: {
      snippet: string;
      changed: boolean;
    };
  };
}

export enum Game {
  GTA3 = 'gta3',
  VC = 'vc',
}

export const GameIcon: Record<Game, string> = {
  [Game.GTA3]: 'assets/gta3.png',
  [Game.VC]: 'assets/vc.png',
};

export const GameClasses: Record<Game, string> = {
  [Game.GTA3]: 'assets/gta3/classes.db',
  [Game.VC]: 'assets/vc/classes.db',
};

export const GameLibrary: Record<Game, string> = {
  [Game.GTA3]: 'gta3/gta3.json',
  [Game.VC]: 'vc/vc.json',
};

export const GameSnippets: Record<Game, string> = {
  [Game.GTA3]: 'gta3/snippets.json',
  [Game.VC]: 'vc/snippets.json',
};

export const GameTitle: Record<Game, string> = {
  [Game.GTA3]: 'GTA III',
  [Game.VC]: 'Vice City',
};

export const DEFAULT_EXTENSION = 'default';

export const SEARCH_OPTIONS = {
  keys: ['name', 'short_desc', 'id', 'class', 'member'],
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 3,
  distance: 50,
  fusejsHighlightKey: '_highlight',
};

export enum ViewMode {
  None,
  Edit,
  View,
}

export type Modifier = 'except' | 'only';
