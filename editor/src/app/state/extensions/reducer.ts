import { Action, createReducer, on } from '@ngrx/store';
import { Command, Extension, Game, ViewMode } from '../../models';
import {
  loadExtensions,
  loadExtensionsError,
  loadExtensionsSuccess,
  toggleExtension,
  updateCommand,
  submitChangesSuccess,
} from './actions';
import { without, sortBy } from 'lodash';

export interface ExtensionsState {
  extensions?: Extension[];
  selectedExtensions?: string[];
  lastUpdate?: number;
  loading: boolean;
  entities?: Record<string, string[]>;
}

export const initialState: ExtensionsState = {
  loading: false,
};

const _reducer = createReducer(
  initialState,
  on(loadExtensions, (state, { game }) => ({
    ...state,
    game,
    loading: true,
    changesCount: 0,
  })),
  on(loadExtensionsSuccess, (state, { extensions, lastUpdate }) => ({
    ...state,
    loading: false,
    lastUpdate,
    extensions,
    selectedExtensions: extensions.map((e) => e.name),
    entities: getEntities(extensions),
  })),
  on(loadExtensionsError, (state) => ({
    ...state,
    commands: [],
    loading: false,
    error: `Error: can't load commands`,
  })),
  on(
    updateCommand,
    (state, { command: newCommand, newExtension: name, oldExtension }) => {
      let tickExtension = null;
      let untickExtension = null;
      let extensions = upsertBy(
        state.extensions,
        'name',
        name,
        (e) => ({
          ...e,
          commands: upsertBy(
            e.commands,
            'id',
            newCommand.id,
            () => newCommand,
            () => newCommand
          ),
        }),
        () => {
          tickExtension = name;
          return {
            name,
            commands: [newCommand],
          };
        }
      );

      if (name !== oldExtension) {
        // remove from previous collection
        extensions = upsertBy(extensions, 'name', oldExtension, (e) => {
          const commands = upsertBy(e.commands, 'id', newCommand.id);
          if (!commands.length) {
            // remove previous collection ifit is empty
            untickExtension = oldExtension;
            return null;
          }
          return {
            ...e,
            commands,
          };
        });
      }

      const selectedExtensions =
        untickExtension !== null
          ? state.selectedExtensions.filter((s) => s !== untickExtension)
          : [...state.selectedExtensions];

      if (tickExtension !== null) {
        selectedExtensions.push(tickExtension);
        selectedExtensions.sort();
      }

      const entities = getEntities(extensions);

      return {
        ...state,
        extensions,
        selectedExtensions,
        entities,
      };
    }
  ),
  on(submitChangesSuccess, (state, { lastUpdate }) => ({
    ...state,
    lastUpdate,
    changesCount: 0,
  })),
  on(toggleExtension, (state, { extension }) => {
    const selectedExtensions = state.selectedExtensions.includes(extension)
      ? without(state.selectedExtensions, extension)
      : [...state.selectedExtensions, extension];
    return { ...state, selectedExtensions };
  })
);

export function extensionsReducer(state: ExtensionsState, action: Action) {
  return _reducer(state, action);
}

function upsertBy<T extends object, Key extends keyof T>(
  collection: T[],
  key: Key,
  needle: T[Key],
  onFound: (element: T) => T | null = () => null,
  onDefault: () => T | null = () => null
): T[] {
  let found = false;
  const newCollection: T[] = [];

  for (let i = 0; i < collection.length; i++) {
    if (collection[i][key] === needle) {
      found = true;
      const newItem = onFound(collection[i]);
      if (newItem !== null) {
        newCollection.push(onFound(collection[i]));
      }
    } else {
      newCollection.push(collection[i]);
    }
  }
  if (!found) {
    const newItem = onDefault();
    if (newItem !== null) {
      newCollection.push(newItem);
      return sortBy(newCollection, key);
    }
  }

  return newCollection;
}

function getEntities(extensions: Extension[]): Record<string, string[]> {
  return extensions.reduce((m, e) => {
    const set = e.commands
      .filter((command) => command.attrs.is_constructor)
      .reduce((entities, command) => {
        const last = command.output[command.output.length - 1];
        if (!last) {
          return [];
        }
        entities.add(last.type);
        return entities;
      }, new Set());

    (m[e.name] ??= []).push(...set);
    return m;
  }, {});
}
